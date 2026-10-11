import type { Express } from "express";
import type { DatabaseSync } from "node:sqlite";
import { randomInt, randomUUID } from "node:crypto";
import { zipSync, strToU8 } from "fflate";
import type { AppRequest, Row } from "./app.js";

type Context = {
  now: () => number;
  text: (v: unknown, label: string, max?: number) => string;
  fail: (status: number, message: string) => never;
  teacher: (req: AppRequest) => void;
  student: (req: AppRequest) => void;
  classroom: (req: AppRequest, id: string) => Row;
};
type Snapshot = {
  id: string;
  chapterId: string;
  chapterTitle: string;
  text: string;
  choices: string[];
  lesson: string;
  correctIndex: number;
  explanation: string;
};
const json = <T>(v: unknown): T => JSON.parse(String(v));
const shuffle = <T>(values: T[]) => {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};
const cleanQuestion = ({ correctIndex: _c, explanation: _e, ...q }: Snapshot) =>
  q;

export function grantLearningMilestones(
  db: DatabaseSync,
  studentId: string,
  now: number,
) {
  if (
    db.prepare("SELECT role FROM users WHERE id=?").get(studentId)?.role !==
    "student"
  )
    return;
  const rows = db
    .prepare(
      `SELECT p.chapter_id,p.seconds,ch.classroom_id FROM progress p JOIN chapters ch ON ch.id=p.chapter_id
    JOIN memberships m ON m.classroom_id=ch.classroom_id AND m.student_id=p.student_id WHERE p.student_id=?`,
    )
    .all(studentId);
  for (const row of rows) {
    for (const level of [3, 4, 5])
      if (Number(row.seconds) >= (level - 1) * 3600)
        db.prepare(
          "INSERT OR IGNORE INTO learning_tickets(student_id,chapter_id,level,granted_at) VALUES(?,?,?,?)",
        ).run(studentId, row.chapter_id, level, now);
    if (Number(row.seconds) >= 14400)
      db.prepare(
        "INSERT OR IGNORE INTO learning_rewards(id,student_id,classroom_id,chapter_id,source,label,points,created_at) VALUES(?,?,?,?,?,?,1,?)",
      ).run(
        randomUUID(),
        studentId,
        row.classroom_id,
        row.chapter_id,
        `tree:${studentId}:${row.chapter_id}`,
        "Chăm cây đủ 4 giờ",
        now,
      );
  }
}

function releaseCorrections(db: DatabaseSync, run: Row, timestamp: number) {
  if (run.released) return;
  const questions = json<Snapshot[]>(run.questions),
    answers = json<Record<string, number>>(run.answers);
  for (const q of questions)
    if (answers[q.id] !== q.correctIndex)
      db.prepare(
        `INSERT INTO corrections VALUES(?,?,0,?) ON CONFLICT(student_id,question_id)
      DO UPDATE SET resolved=0,updated_at=excluded.updated_at`,
      ).run(run.student_id, q.id, timestamp);
  db.prepare("UPDATE exam_runs SET released=1 WHERE id=?").run(run.id);
}

function finalize(
  db: DatabaseSync,
  run: Row,
  reason: string,
  timestamp: number,
) {
  if (run.status !== "active") return;
  const questions = json<Snapshot[]>(run.questions),
    answers = json<Record<string, number>>(run.answers);
  const correct = questions.filter(
    (q) => answers[q.id] === q.correctIndex,
  ).length;
  const score = questions.length
    ? Math.round((correct / questions.length) * 100) / 10
    : 0;
  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare(
      "UPDATE exam_runs SET status='submitted',reason=?,score=?,submitted_at=? WHERE id=? AND status='active'",
    ).run(reason, score, timestamp, run.id);
    if (run.kind === "hunt") {
      releaseCorrections(db, run, timestamp);
      if (score >= 8)
        db.prepare(
          "INSERT OR IGNORE INTO learning_rewards(id,student_id,classroom_id,chapter_id,source,label,points,created_at) VALUES(?,?,?,?,?,?,1,?)",
        ).run(
          randomUUID(),
          run.student_id,
          run.classroom_id,
          run.chapter_id,
          `exam:${run.id}`,
          "Săn điểm đạt từ 8,0",
          timestamp,
        );
    }
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

export function sweepLearningExams(db: DatabaseSync, timestamp = Date.now()) {
  for (const run of db
    .prepare("SELECT * FROM exam_runs WHERE status='active' AND deadline_at<=?")
    .all(timestamp))
    finalize(db, run, "deadline", timestamp);
  for (const run of db
    .prepare(
      `SELECT r.* FROM exam_runs r JOIN exam_definitions e ON e.id=r.exam_id
    WHERE r.status='submitted' AND r.released=0 AND (e.closes_at<=? OR e.enabled=0)`,
    )
    .all(timestamp)) {
    db.exec("BEGIN IMMEDIATE");
    try {
      releaseCorrections(db, run, timestamp);
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  }
}

export function learningAnswersLocked(
  db: DatabaseSync,
  studentId: string,
  timestamp: number,
) {
  sweepLearningExams(db, timestamp);
  return !!db
    .prepare(
      `SELECT 1 FROM exam_runs r LEFT JOIN exam_definitions e ON e.id=r.exam_id
    WHERE r.student_id=? AND (r.status='active' OR (r.kind='official' AND e.enabled=1 AND e.closes_at>?))`,
    )
    .get(studentId, timestamp);
}

export function registerLearningRoutes(
  app: Express,
  db: DatabaseSync,
  context: Context,
) {
  const { now, text, teacher, student, classroom } = context;
  const fail: Context["fail"] = context.fail;
  const number = (value: unknown, label: string, min: number, max: number) => {
    if (
      typeof value !== "number" ||
      !Number.isSafeInteger(value) ||
      value < min ||
      value > max
    )
      fail(400, `${label} không hợp lệ.`);
    return value as number;
  };
  function chapterIds(classId: string, value: unknown) {
    if (
      !Array.isArray(value) ||
      !value.length ||
      value.length > 100 ||
      value.some((v) => typeof v !== "string") ||
      new Set(value).size !== value.length
    )
      fail(400, "Chọn các chương không trùng nhau.");
    for (const id of value)
      if (
        !db
          .prepare("SELECT 1 FROM chapters WHERE id=? AND classroom_id=?")
          .get(id, classId)
      )
        fail(403, "Chương không thuộc lớp này.");
    return value as string[];
  }
  function bank(ids: string[]): Snapshot[] {
    return db
      .prepare(
        `SELECT q.*,ch.title AS chapterTitle FROM questions q JOIN chapters ch ON ch.id=q.chapter_id
      WHERE q.active=1 AND q.is_current=1 AND q.chapter_id IN (${ids.map(() => "?").join(",")}) ORDER BY q.rowid`,
      )
      .all(...ids)
      .map((q) => ({
        id: String(q.id),
        chapterId: String(q.chapter_id),
        chapterTitle: String(q.chapterTitle),
        lesson: String(q.lesson),
        text: String(q.text),
        choices: json<string[]>(q.choices),
        correctIndex: Number(q.correct_index),
        explanation: String(q.explanation),
      }));
  }
  function matrix(classId: string) {
    return db
      .prepare(
        `SELECT q.chapter_id AS chapterId,ch.title AS chapterTitle,q.lesson,COUNT(*) AS available
      FROM questions q JOIN chapters ch ON ch.id=q.chapter_id WHERE ch.classroom_id=? AND q.active=1 AND q.is_current=1
      GROUP BY q.chapter_id,q.lesson ORDER BY MIN(q.rowid)`,
      )
      .all(classId)
      .map((q) => ({ ...q, key: `${q.chapterId}::${q.lesson}` }));
  }
  function sample(ids: string[], count: number, weights: unknown): Snapshot[] {
    const all = bank(ids);
    if (!all.length) fail(409, "Các chương được chọn chưa có câu hỏi.");
    if (!count) return shuffle(all).slice(0, 100);
    if (all.length < count)
      fail(409, `Ngân hàng chỉ có ${all.length} câu, cần ${count} câu.`);
    if (!weights || typeof weights !== "object" || Array.isArray(weights))
      fail(400, "Ma trận không hợp lệ.");
    const w = weights as Record<string, unknown>;
    const groups = new Map<string, Snapshot[]>();
    for (const q of all) {
      const key = `${q.chapterId}::${q.lesson}`;
      groups.set(key, [...(groups.get(key) ?? []), q]);
    }
    if (!Object.keys(w).length) return shuffle(all).slice(0, count);
    for (const [key, value] of Object.entries(w))
      if (
        !groups.has(key) ||
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        value < 0 ||
        value > 10000
      )
        fail(400, "Trọng số hoặc bài trong ma trận không hợp lệ.");
    const sum = Object.values(w).reduce<number>((s, v) => s + Number(v), 0);
    if (!sum) fail(400, "Ma trận cần ít nhất một trọng số lớn hơn 0.");
    const quotas = Object.entries(w).map(([key, value]) => {
      const raw = (count * Number(value)) / sum;
      return { key, n: Math.floor(raw), remainder: raw % 1 };
    });
    let remaining = count - quotas.reduce((s, q) => s + q.n, 0);
    for (const quota of [...quotas].sort((a, b) => b.remainder - a.remainder))
      if (remaining-- > 0) quota.n++;
    const chosen: Snapshot[] = [];
    for (const quota of quotas) {
      const available = groups.get(quota.key)!;
      if (quota.n > available.length)
        fail(
          409,
          `Bài ${available[0].lesson} thiếu câu: cần ${quota.n}, hiện có ${available.length}.`,
        );
      chosen.push(...shuffle(available).slice(0, quota.n));
    }
    return shuffle(chosen);
  }
  function examAllowed(chapterId: string) {
    return (
      db
        .prepare("SELECT enabled FROM chapter_exam_access WHERE chapter_id=?")
        .get(chapterId)?.enabled === 1
    );
  }
  function blockedExamChapters(questions: Snapshot[]) {
    return [...new Map(questions.map((q) => [q.chapterId, q.chapterTitle]))]
      .filter(([id]) => !examAllowed(id))
      .map(([id, title]) => ({ id, title }));
  }
  function eligibility(ch: Row, userId: string) {
    const seconds = Number(
      db
        .prepare(
          "SELECT seconds FROM progress WHERE student_id=? AND chapter_id=?",
        )
        .get(userId, ch.id)?.seconds ?? 0,
    );
    const settings = db
      .prepare("SELECT * FROM chapter_learning WHERE chapter_id=?")
      .get(ch.id);
    let rows = db
      .prepare(
        `SELECT a.id,a.correct,a.question_id FROM attempts a JOIN questions q ON q.id=a.question_id
      WHERE a.student_id=? AND q.chapter_id=? ORDER BY a.created_at,a.rowid`,
      )
      .all(userId, ch.id);
    if (settings?.accuracy_basis === "latest") {
      const latest = new Map();
      for (const r of rows) latest.set(r.question_id, r);
      rows = [...latest.values()];
    }
    const accuracy = rows.length
      ? (rows.filter((r) => r.correct).length / rows.length) * 100
      : 0;
    const openCorrections = Number(
      db
        .prepare(
          `SELECT COUNT(*) AS n FROM corrections c JOIN questions q ON q.id=c.question_id
      WHERE c.student_id=? AND q.chapter_id=? AND c.resolved=0`,
        )
        .get(userId, ch.id)?.n ?? 0,
    );
    const tickets = db
      .prepare(
        "SELECT COUNT(*) AS granted, SUM(used_by IS NOT NULL) AS used FROM learning_tickets WHERE student_id=? AND chapter_id=?",
      )
      .get(userId, ch.id)!;
    const remaining = Number(tickets.granted) - Number(tickets.used ?? 0);
    const missing: string[] = [];
    const allowed = examAllowed(String(ch.id));
    if (!allowed) missing.push("Giáo viên chưa mở kiểm tra chương này");
    if (seconds < 7200)
      missing.push(`Cần thêm ${Math.ceil((7200 - seconds) / 60)} phút học`);
    if (accuracy < 70) missing.push("Tỷ lệ đúng chưa đạt 70%");
    if (openCorrections)
      missing.push(`Còn ${openCorrections} câu cần sửa trong chương`);
    if (!remaining) missing.push("Chưa có vé còn lại");
    return {
      id: ch.id,
      title: ch.title,
      semester: settings?.semester ?? "",
      accuracyBasis: settings?.accuracy_basis ?? "all",
      examAllowed: allowed,
      seconds,
      level: Math.min(5, Math.floor(seconds / 3600) + 1),
      accuracy,
      answered: rows.length,
      openCorrections,
      tickets: {
        granted: Number(tickets.granted),
        used: Number(tickets.used ?? 0),
        remaining,
      },
      eligible: !missing.length,
      missing,
    };
  }
  function ownedRun(req: AppRequest) {
    const run = db
      .prepare("SELECT * FROM exam_runs WHERE id=?")
      .get(String(req.params.id)) as Row | undefined;
    if (!run) fail(404, "Không tìm thấy lượt thi.");
    classroom(req, run.classroom_id);
    if (req.user!.role !== "teacher" && run.student_id !== req.user!.id)
      fail(403, "Bạn không có quyền xem lượt thi này.");
    return run;
  }
  function viewRun(run: Row, role: string) {
    const fresh = db
      .prepare("SELECT * FROM exam_runs WHERE id=?")
      .get(run.id) as Row;
    const questions = json<Snapshot[]>(fresh.questions),
      answers = json<Record<string, number>>(fresh.answers);
    const definition = fresh.exam_id
      ? db
          .prepare("SELECT * FROM exam_definitions WHERE id=?")
          .get(fresh.exam_id)
      : undefined;
    const released =
      fresh.status === "submitted" &&
      (role === "teacher" ||
        fresh.kind === "hunt" ||
        !definition?.enabled ||
        Number(definition.closes_at) <= now());
    return {
      id: fresh.id,
      title: fresh.title,
      kind: fresh.kind,
      status: fresh.status,
      startedAt: fresh.started_at,
      deadlineAt: fresh.deadline_at,
      serverNow: now(),
      warnings: Number(
        db
          .prepare("SELECT COUNT(*) AS n FROM exam_tab_events WHERE run_id=?")
          .get(fresh.id)?.n,
      ),
      tabLimit: fresh.tab_limit,
      questions: questions.map(cleanQuestion),
      answers,
      revision: fresh.revision,
      score: fresh.score,
      reason: fresh.reason,
      ...(released
        ? {
            results: questions.map((q) => ({
              questionId: q.id,
              correct: answers[q.id] === q.correctIndex,
              correctIndex: q.correctIndex,
              explanation: q.explanation,
            })),
          }
        : {}),
    };
  }
  app.get("/api/classrooms/:id/learning", (req: AppRequest, res) => {
    const c = classroom(req, String(req.params.id));
    sweepLearningExams(db, now());
    if (req.user!.role === "student")
      grantLearningMilestones(db, req.user!.id, now());
    const chapters = db
      .prepare("SELECT * FROM chapters WHERE classroom_id=? ORDER BY rowid")
      .all(c.id)
      .map((ch) => eligibility(ch, req.user!.id));
    const own = req.user!.role === "teacher" ? "" : " AND r.student_id=?";
    const args = own ? [c.id, req.user!.id] : [c.id];
    res.json({
      chapters,
      matrix: matrix(c.id),
      blueprints: db
        .prepare(
          "SELECT * FROM review_blueprints WHERE classroom_id=? ORDER BY created_at DESC",
        )
        .all(c.id)
        .map((p) => ({
          id: p.id,
          title: p.title,
          chapterIds: json(p.chapter_ids),
          questionCount: p.question_count,
          weights: json(p.weights),
        })),
      exams: db
        .prepare(
          "SELECT * FROM exam_definitions WHERE classroom_id=? ORDER BY starts_at DESC",
        )
        .all(c.id)
        .map((e) => ({
          id: e.id,
          title: e.title,
          startsAt: e.starts_at,
          closesAt: e.closes_at,
          tabLimit: e.tab_limit,
          enabled: !!e.enabled,
          questionCount: json<Snapshot[]>(e.questions).length,
          blockedChapters: blockedExamChapters(json<Snapshot[]>(e.questions)),
        })),
      runs: db
        .prepare(
          `SELECT r.*,u.name AS studentName,(SELECT COUNT(*) FROM exam_tab_events t WHERE t.run_id=r.id) AS warnings
        FROM exam_runs r JOIN users u ON u.id=r.student_id WHERE r.classroom_id=?${own} ORDER BY r.started_at DESC LIMIT 200`,
        )
        .all(...args)
        .map((r) => ({
          id: r.id,
          title: r.title,
          kind: r.kind,
          studentName: r.studentName,
          status: r.status,
          score: r.score,
          deadlineAt: r.deadline_at,
          warnings: r.warnings,
        })),
      reviews: db
        .prepare(
          "SELECT * FROM review_sessions WHERE classroom_id=? AND student_id=? AND completed=0 ORDER BY created_at DESC",
        )
        .all(c.id, req.user!.id)
        .map((r) => ({
          id: r.id,
          title: r.title,
          currentIndex: r.current_index,
          questionCount: json<unknown[]>(r.questions).length,
        })),
      rewards: db
        .prepare(
          `SELECT r.*,u.name AS studentName FROM learning_rewards r JOIN users u ON u.id=r.student_id
        WHERE r.classroom_id=?${own} ORDER BY r.created_at DESC LIMIT 500`,
        )
        .all(...args)
        .map((r) => ({
          id: r.id,
          studentName: r.studentName,
          label: r.label,
          points: r.points,
          status: r.status,
          createdAt: r.created_at,
        })),
    });
  });
  app.post("/api/chapters/:id/exam-access", (req: AppRequest, res) => {
    teacher(req);
    const ch = db
      .prepare("SELECT * FROM chapters WHERE id=?")
      .get(String(req.params.id));
    if (!ch) fail(404, "Không tìm thấy chương.");
    classroom(req, String(ch.classroom_id));
    if (typeof req.body?.enabled !== "boolean")
      fail(400, "Trạng thái không hợp lệ.");
    db.prepare(
      `INSERT INTO chapter_exam_access(chapter_id,enabled,updated_by,updated_at)
      VALUES(?,?,?,?) ON CONFLICT(chapter_id) DO UPDATE SET
      enabled=excluded.enabled,updated_by=excluded.updated_by,updated_at=excluded.updated_at`,
    ).run(ch.id, Number(req.body.enabled), req.user!.id, now());
    res.json({ ok: true, examAllowed: req.body.enabled });
  });
  app.post("/api/chapters/:id/learning", (req: AppRequest, res) => {
    teacher(req);
    const ch = db
      .prepare("SELECT * FROM chapters WHERE id=?")
      .get(String(req.params.id));
    if (!ch) fail(404, "Không tìm thấy chương.");
    classroom(req, String(ch.classroom_id));
    const semester =
      req.body?.semester === "" ? "" : text(req.body?.semester, "Học kỳ", 80);
    const basis = req.body?.accuracyBasis ?? "all";
    if (!["all", "latest"].includes(basis))
      fail(400, "Cách tính tỷ lệ không hợp lệ.");
    db.prepare(
      "INSERT INTO chapter_learning VALUES(?,?,?) ON CONFLICT(chapter_id) DO UPDATE SET semester=excluded.semester,accuracy_basis=excluded.accuracy_basis",
    ).run(ch.id, semester, basis);
    res.json({ ok: true });
  });
  app.post("/api/classrooms/:id/blueprints", (req: AppRequest, res) => {
    teacher(req);
    const c = classroom(req, String(req.params.id)),
      ids = chapterIds(c.id, req.body?.chapterIds);
    const count = number(req.body?.questionCount, "Số câu", 0, 100),
      weights = req.body?.weights ?? {};
    sample(ids, count, weights);
    const id = randomUUID(),
      title = text(req.body?.title, "Tên bộ ôn", 120);
    db.prepare("INSERT INTO review_blueprints VALUES(?,?,?,?,?,?,?)").run(
      id,
      c.id,
      title,
      JSON.stringify(ids),
      count,
      JSON.stringify(weights),
      now(),
    );
    res.status(201).json({ id });
  });
  app.post("/api/classrooms/:id/reviews", (req: AppRequest, res) => {
    student(req);
    const c = classroom(req, String(req.params.id));
    if (learningAnswersLocked(db, req.user!.id, now()))
      fail(409, "Chờ khung thi đóng để tiếp tục ôn tập.");
    const key = text(req.body?.requestId, "Mã phiên", 100);
    const existing = db
      .prepare("SELECT * FROM review_sessions WHERE request_id=?")
      .get(key);
    if (existing) {
      if (
        existing.student_id !== req.user!.id ||
        existing.classroom_id !== c.id
      )
        fail(409, "Mã phiên đã dùng.");
      return res.json({ id: existing.id });
    }
    let ids: string[], count: number, weights: unknown, title: string;
    if (req.body?.blueprintId) {
      const p = db
        .prepare(
          "SELECT * FROM review_blueprints WHERE id=? AND classroom_id=?",
        )
        .get(text(req.body.blueprintId, "Bộ ôn"), c.id);
      if (!p) fail(404, "Không tìm thấy bộ ôn.");
      ids = json(p.chapter_ids);
      count = Number(p.question_count);
      weights = json(p.weights);
      title = String(p.title);
    } else {
      ids = chapterIds(c.id, req.body?.chapterIds);
      count = number(req.body?.questionCount ?? 0, "Số câu", 0, 100);
      weights = {};
      title = ids.length === 1 ? "Ôn chương" : "Ôn kỳ";
    }
    const questions = sample(ids, count, weights),
      id = randomUUID();
    db.prepare(
      "INSERT INTO review_sessions(id,student_id,classroom_id,title,questions,request_id,created_at) VALUES(?,?,?,?,?,?,?)",
    ).run(id, req.user!.id, c.id, title, JSON.stringify(questions), key, now());
    res.status(201).json({ id });
  });
  function review(req: AppRequest) {
    student(req);
    const r = db
      .prepare("SELECT * FROM review_sessions WHERE id=? AND student_id=?")
      .get(String(req.params.id), req.user!.id);
    if (!r) fail(404, "Không tìm thấy phiên ôn.");
    classroom(req, String(r.classroom_id));
    return r;
  }
  app.get("/api/learning/reviews/:id", (req: AppRequest, res) => {
    const r = review(req);
    if (learningAnswersLocked(db, req.user!.id, now()))
      fail(409, "Chờ khung thi đóng để tiếp tục ôn tập.");
    res.json({
      id: r.id,
      title: r.title,
      currentIndex: r.current_index,
      completed: !!r.completed,
      questions: json<Snapshot[]>(r.questions).map(cleanQuestion),
      answers: json(r.answers),
    });
  });
  app.post("/api/learning/reviews/:id/answer", (req: AppRequest, res) => {
    const r = review(req);
    if (learningAnswersLocked(db, req.user!.id, now()))
      fail(409, "Chờ khung thi đóng để tiếp tục ôn tập.");
    const qs = json<Snapshot[]>(r.questions),
      answers = json<
        Record<
          string,
          {
            selected: number;
            correct: boolean;
            correctIndex: number;
            explanation: string;
          }
        >
      >(r.answers);
    const q = qs.find((q) => q.id === req.body?.questionId);
    if (!q) fail(400, "Câu không thuộc bộ ôn.");
    const selected = number(req.body?.selected, "Đáp án", 0, 3);
    if (answers[q.id]) {
      if (answers[q.id].selected !== selected) fail(409, "Câu đã trả lời.");
      return res.json(answers[q.id]);
    }
    if (r.completed || qs[Number(r.current_index)]?.id !== q.id)
      fail(409, "Hãy tiếp tục từ câu đang làm.");
    const correct = selected === q.correctIndex,
      result = {
        selected,
        correct,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
      };
    answers[q.id] = result;
    db.exec("BEGIN IMMEDIATE");
    try {
      db.prepare("INSERT INTO attempts VALUES(?,?,?,?,?,'practice',?)").run(
        `review:${r.id}:${q.id}`,
        req.user!.id,
        q.id,
        selected,
        Number(correct),
        now(),
      );
      if (!correct)
        db.prepare(
          "INSERT INTO corrections VALUES(?,?,0,?) ON CONFLICT(student_id,question_id) DO UPDATE SET resolved=0,updated_at=excluded.updated_at",
        ).run(req.user!.id, q.id, now());
      db.prepare("UPDATE review_sessions SET answers=? WHERE id=?").run(
        JSON.stringify(answers),
        r.id,
      );
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
    res.json(result);
  });
  app.post("/api/learning/reviews/:id/next", (req: AppRequest, res) => {
    const r = review(req),
      qs = json<Snapshot[]>(r.questions),
      answers = json<Record<string, unknown>>(r.answers),
      idx = number(req.body?.index, "Vị trí câu", 0, 100);
    if (idx === Number(r.current_index) + 1 && answers[qs[idx - 1]?.id])
      db.prepare(
        "UPDATE review_sessions SET current_index=?,completed=? WHERE id=?",
      ).run(idx, Number(idx >= qs.length), r.id);
    else if (idx !== Number(r.current_index))
      fail(409, "Vị trí câu chưa hợp lệ.");
    res.json({ ok: true });
  });
  app.post("/api/classrooms/:id/exams", (req: AppRequest, res) => {
    teacher(req);
    const c = classroom(req, String(req.params.id)),
      ids = chapterIds(c.id, req.body?.chapterIds),
      count = number(req.body?.questionCount, "Số câu", 1, 100);
    const starts = number(req.body?.startsAt, "Giờ mở", 1, 8640000000000000),
      closes = number(req.body?.closesAt, "Giờ đóng", 1, 8640000000000000);
    if (closes <= starts || closes <= now())
      fail(400, "Giờ đóng phải sau giờ mở và hiện tại.");
    const questions = sample(ids, count, req.body?.weights ?? {}),
      id = randomUUID();
    db.prepare("INSERT INTO exam_definitions VALUES(?,?,?,?,?,?,?,1,?)").run(
      id,
      c.id,
      text(req.body?.title, "Tên kiểm tra", 120),
      JSON.stringify(questions),
      starts,
      closes,
      number(req.body?.tabLimit ?? 4, "Ngưỡng chuyển tab", 1, 10),
      now(),
    );
    res.status(201).json({ id });
  });
  app.post("/api/learning/exams/:id/state", (req: AppRequest, res) => {
    teacher(req);
    const e = db
      .prepare("SELECT * FROM exam_definitions WHERE id=?")
      .get(String(req.params.id));
    if (!e) fail(404, "Không tìm thấy kiểm tra.");
    classroom(req, String(e.classroom_id));
    if (typeof req.body?.enabled !== "boolean")
      fail(400, "Trạng thái không hợp lệ.");
    db.prepare("UPDATE exam_definitions SET enabled=? WHERE id=?").run(
      Number(req.body.enabled),
      e.id,
    );
    if (!req.body.enabled)
      for (const r of db
        .prepare("SELECT * FROM exam_runs WHERE exam_id=? AND status='active'")
        .all(e.id))
        finalize(db, r, "teacher", now());
    sweepLearningExams(db, now());
    res.json({ ok: true });
  });
  app.post("/api/classrooms/:id/exam-runs", (req: AppRequest, res) => {
    student(req);
    const c = classroom(req, String(req.params.id));
    if (req.body?.examId && req.body?.chapterId)
      fail(400, "Chọn kiểm tra chính thức hoặc Săn điểm theo chương.");
    if (req.body?.examId) text(req.body.examId, "Kiểm tra");
    else text(req.body?.chapterId, "Chương");
    sweepLearningExams(db, now());
    const key = text(req.body?.requestId, "Mã lượt thi", 100),
      prior = db.prepare("SELECT * FROM exam_runs WHERE request_id=?").get(key);
    if (prior) {
      if (
        prior.student_id !== req.user!.id ||
        prior.classroom_id !== c.id ||
        (prior.exam_id ?? null) !== (req.body?.examId ?? null) ||
        (prior.chapter_id ?? null) !== (req.body?.chapterId ?? null)
      )
        fail(409, "Mã lượt thi đã dùng.");
      return res.json({ id: prior.id });
    }
    if (
      db
        .prepare(
          "SELECT 1 FROM exam_runs WHERE student_id=? AND status='active'",
        )
        .get(req.user!.id)
    )
      fail(409, "Bạn có một lượt thi đang làm. Hãy tiếp tục lượt đó.");
    let questions: Snapshot[],
      deadline: number,
      title: string,
      tabLimit = 4,
      chapterId: string | null = null,
      examId: string | null = null;
    if (req.body?.examId) {
      const e = db
        .prepare("SELECT * FROM exam_definitions WHERE id=? AND classroom_id=?")
        .get(req.body.examId, c.id);
      if (!e) fail(404, "Không tìm thấy kiểm tra.");
      const old = db
        .prepare("SELECT * FROM exam_runs WHERE exam_id=? AND student_id=?")
        .get(e.id, req.user!.id);
      if (old) return res.json({ id: old.id });
      if (
        !e.enabled ||
        now() < Number(e.starts_at) ||
        now() >= Number(e.closes_at)
      )
        fail(403, "Kiểm tra chưa mở hoặc đã đóng.");
      const snapshot = json<Snapshot[]>(e.questions);
      const blocked = blockedExamChapters(snapshot);
      if (blocked.length)
        fail(
          403,
          `Giáo viên chưa mở kiểm tra: ${blocked.map((ch) => ch.title).join(" · ")}.`,
        );
      questions = shuffle(snapshot);
      deadline = Math.min(now() + 1200000, Number(e.closes_at));
      title = String(e.title);
      tabLimit = Number(e.tab_limit);
      examId = String(e.id);
    } else {
      const ch = db
        .prepare("SELECT * FROM chapters WHERE id=? AND classroom_id=?")
        .get(req.body?.chapterId, c.id);
      if (!ch) fail(404, "Không tìm thấy chương.");
      grantLearningMilestones(db, req.user!.id, now());
      const state = eligibility(ch, req.user!.id);
      if (!state.eligible) fail(403, state.missing.join(" · "));
      questions = sample(
        [String(ch.id)],
        Math.min(20, bank([String(ch.id)]).length),
        {},
      );
      deadline = now() + 1200000;
      title = `Săn điểm · ${ch.title}`;
      chapterId = String(ch.id);
    }
    const id = randomUUID();
    db.exec("BEGIN IMMEDIATE");
    try {
      db.prepare(
        "INSERT INTO exam_runs(id,student_id,classroom_id,chapter_id,exam_id,kind,title,questions,started_at,deadline_at,tab_limit,request_id) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",
      ).run(
        id,
        req.user!.id,
        c.id,
        chapterId,
        examId,
        examId ? "official" : "hunt",
        title,
        JSON.stringify(questions),
        now(),
        deadline,
        tabLimit,
        key,
      );
      if (chapterId) {
        const ticket = db
          .prepare(
            "SELECT level FROM learning_tickets WHERE student_id=? AND chapter_id=? AND used_by IS NULL ORDER BY level LIMIT 1",
          )
          .get(req.user!.id, chapterId);
        if (!ticket) throw new Error("Không còn vé.");
        db.prepare(
          "UPDATE learning_tickets SET used_by=? WHERE student_id=? AND chapter_id=? AND level=? AND used_by IS NULL",
        ).run(id, req.user!.id, chapterId, ticket.level);
      }
      db.prepare("DELETE FROM study_sessions WHERE student_id=?").run(
        req.user!.id,
      );
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
    res.status(201).json({ id });
  });
  app.get("/api/learning/exam-runs/:id", (req: AppRequest, res) => {
    const r = ownedRun(req);
    sweepLearningExams(db, now());
    res.json(viewRun(r, req.user!.role));
  });
  app.post("/api/learning/exam-runs/:id/answers", (req: AppRequest, res) => {
    student(req);
    let r = ownedRun(req);
    sweepLearningExams(db, now());
    r = db.prepare("SELECT * FROM exam_runs WHERE id=?").get(r.id) as Row;
    if (r.status !== "active") return res.json(viewRun(r, req.user!.role));
    const revision = number(req.body?.revision, "Phiên bản đáp án", 0, 1000000);
    if (revision !== r.revision)
      fail(409, "Đáp án đã thay đổi ở cửa sổ khác. Tải lại lượt thi.");
    const incoming = req.body?.answers;
    if (!incoming || typeof incoming !== "object" || Array.isArray(incoming))
      fail(400, "Đáp án không hợp lệ.");
    const ids = new Set(json<Snapshot[]>(r.questions).map((q) => q.id)),
      answers = json<Record<string, number>>(r.answers);
    for (const [id, value] of Object.entries(incoming)) {
      if (!ids.has(id)) fail(400, "Câu không thuộc đề thi.");
      answers[id] = number(value, "Đáp án", 0, 3);
    }
    db.prepare(
      "UPDATE exam_runs SET answers=?,revision=revision+1 WHERE id=?",
    ).run(JSON.stringify(answers), r.id);
    res.json(viewRun(r, req.user!.role));
  });
  app.post("/api/learning/exam-runs/:id/tab", (req: AppRequest, res) => {
    student(req);
    const r = ownedRun(req);
    sweepLearningExams(db, now());
    if (
      db.prepare("SELECT status FROM exam_runs WHERE id=?").get(r.id)
        ?.status === "active"
    ) {
      db.prepare("INSERT OR IGNORE INTO exam_tab_events VALUES(?,?,?)").run(
        r.id,
        text(req.body?.eventId, "Mã cảnh báo", 100),
        now(),
      );
      const n = Number(
        db
          .prepare("SELECT COUNT(*) AS n FROM exam_tab_events WHERE run_id=?")
          .get(r.id)?.n,
      );
      if (n >= Number(r.tab_limit))
        finalize(
          db,
          db.prepare("SELECT * FROM exam_runs WHERE id=?").get(r.id) as Row,
          "tabs",
          now(),
        );
    }
    res.json(viewRun(r, req.user!.role));
  });
  app.post("/api/learning/exam-runs/:id/submit", (req: AppRequest, res) => {
    student(req);
    const r = ownedRun(req);
    sweepLearningExams(db, now());
    finalize(
      db,
      db.prepare("SELECT * FROM exam_runs WHERE id=?").get(r.id) as Row,
      "student",
      now(),
    );
    res.json(viewRun(r, req.user!.role));
  });
  app.post("/api/learning/rewards/:id/review", (req: AppRequest, res) => {
    teacher(req);
    const r = db
      .prepare("SELECT * FROM learning_rewards WHERE id=?")
      .get(String(req.params.id));
    if (!r) fail(404, "Không tìm thấy điểm thưởng.");
    classroom(req, String(r.classroom_id));
    const status = req.body?.status;
    if (!["approved", "rejected"].includes(status))
      fail(400, "Chọn duyệt hoặc từ chối.");
    if (r.status !== "pending" && r.status !== status)
      fail(409, "Điểm thưởng đã được xử lý.");
    db.prepare(
      "UPDATE learning_rewards SET status=?,reviewed_by=?,reviewed_at=? WHERE id=? AND status='pending'",
    ).run(status, req.user!.id, now(), r.id);
    res.json({ ok: true });
  });
  app.get(
    "/api/classrooms/:id/learning-report.xlsx",
    (req: AppRequest, res) => {
      teacher(req);
      const c = classroom(req, String(req.params.id));
      sweepLearningExams(db, now());
      const students = db
        .prepare(
          "SELECT u.* FROM users u JOIN memberships m ON m.student_id=u.id WHERE m.classroom_id=? ORDER BY u.name",
        )
        .all(c.id);
      const rows: unknown[][] = [
        [
          "Họ tên",
          "Email",
          "Phút học",
          "Điểm TB thi chính thức",
          "Lượt Săn điểm",
          "Điểm Săn điểm",
          "Điểm cây",
          "Điểm đã duyệt",
        ],
      ];
      for (const u of students) {
        grantLearningMilestones(db, String(u.id), now());
        const stats = db
          .prepare(
            "SELECT AVG(CASE WHEN kind='official' THEN score END) AS avg, SUM(kind='hunt') AS hunts FROM exam_runs WHERE classroom_id=? AND student_id=? AND status='submitted'",
          )
          .get(c.id, u.id)!;
        const rewards = db
          .prepare(
            "SELECT SUM(CASE WHEN source LIKE 'exam:%' AND status!='rejected' THEN points ELSE 0 END) AS hunt,SUM(CASE WHEN source LIKE 'tree:%' AND status!='rejected' THEN points ELSE 0 END) AS tree,SUM(CASE WHEN status='approved' THEN points ELSE 0 END) AS approved FROM learning_rewards WHERE classroom_id=? AND student_id=?",
          )
          .get(c.id, u.id)!;
        const seconds =
          db
            .prepare(
              "SELECT SUM(p.seconds) AS s FROM progress p JOIN chapters ch ON ch.id=p.chapter_id WHERE p.student_id=? AND ch.classroom_id=?",
            )
            .get(u.id, c.id)?.s ?? 0;
        rows.push([
          u.name,
          u.email,
          Math.floor(Number(seconds) / 60),
          stats.avg == null ? "" : Math.round(Number(stats.avg) * 100) / 100,
          Number(stats.hunts ?? 0),
          Number(rewards.hunt ?? 0),
          Number(rewards.tree ?? 0),
          Number(rewards.approved ?? 0),
        ]);
      }
      const xml = (s: unknown) =>
        String(s)
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;");
      const sheet = `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows.map((r, i) => `<row r="${i + 1}">${r.map((v) => (typeof v === "number" ? `<c><v>${v}</v></c>` : `<c t="inlineStr"><is><t>${xml(v)}</t></is></c>`)).join("")}</row>`).join("")}</sheetData></worksheet>`;
      const files: Record<string, Uint8Array> = {
        "[Content_Types].xml": strToU8(
          '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
        ),
        "_rels/.rels": strToU8(
          '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
        ),
        "xl/workbook.xml": strToU8(
          '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Tiến độ và kiểm tra" sheetId="1" r:id="rId1"/></sheets></workbook>',
        ),
        "xl/_rels/workbook.xml.rels": strToU8(
          '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
        ),
        "xl/worksheets/sheet1.xml": strToU8(sheet),
      };
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="greenedu-kiem-tra.xlsx"',
      );
      res
        .type(
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        .send(Buffer.from(zipSync(files)));
    },
  );
}
