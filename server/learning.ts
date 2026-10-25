import { creditExamTime } from "./exam-study-credit.js";
import {
  answerCorrect,
  statementCorrectness,
  storedAnswer,
  validateQuestionAnswer,
  type QuestionKind,
  type QuestionAnswer,
} from "../shared/question-types.js";
import type { Express, Response } from "express";
import type { DatabaseSync } from "node:sqlite";
import { chapterIsArchived } from "./chapter-archive.js";
import { randomInt, randomUUID, createHash } from "node:crypto";
import { questionInput } from "../shared/questions.js";
import { sampleByTopic } from "../shared/question-topics.js";
import { lessonIsArchived, resolveQuestionLesson } from "./lesson-catalog.js";
import { zipSync, strToU8 } from "fflate";
import type { AppRequest, Row } from "./app.js";
import { studentLevel, levelStepSeconds } from "../shared/student-levels.js";
import { classroomLevelMinutes } from "./level-settings.js";
import { examResultsWorkbook } from "./exam-results.js";
import {
  sessionPolicy,
  practiceAllowed,
  requirePractice,
  guardStudy,
  terminateStudy,
} from "./class-management.js";
import { validSessionPolicy } from "../shared/session-policy.js";

type Context = {
  now: () => number;
  text: (v: unknown, label: string, max?: number) => string;
  fail: (status: number, message: string) => never;
  teacher: (req: AppRequest) => void;
  student: (req: AppRequest) => void;
  classroom: (req: AppRequest, id: string) => Row;
};
type Snapshot = {
  gradingVersion?: 2;
  kind?: QuestionKind;
  correctAnswer?: string;
  topic?: string;
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
const cleanQuestion = ({
  gradingVersion: _gradingVersion,
  correctIndex: _c,
  correctAnswer: _a,
  explanation: _e,
  ...q
}: Snapshot) => q;
const studyFeedback = (answer: {
  selected: QuestionAnswer;
  statementCorrectness?: boolean[];
  correct: boolean;
  correctIndex?: number;
  explanation?: string;
}) =>
  answer.correct
    ? answer
    : {
        selected: answer.selected,
        statementCorrectness: answer.statementCorrectness,
        correct: false,
        explanation: "Hãy xem lại kiến thức và tự làm lại câu này.",
      };

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
    const provisional =
      Number(
        db
          .prepare(
            `SELECT COALESCE(SUM(c.credited_ms),0) n FROM study_session_controls c JOIN study_sessions s ON s.id=c.session_id WHERE c.student_id=? AND c.chapter_id=? AND c.closed_reason IS NULL`,
          )
          .get(studentId, row.chapter_id)!.n,
      ) / 1000;
    row.seconds = Math.max(0, Number(row.seconds) - provisional);
    const minutes = classroomLevelMinutes(db, String(row.classroom_id));
    const step = levelStepSeconds(minutes);
    for (const level of [3, 4, 5])
      if (Number(row.seconds) >= (level - 1) * step)
        db.prepare(
          "INSERT OR IGNORE INTO learning_tickets(student_id,chapter_id,level,granted_at) VALUES(?,?,?,?)",
        ).run(studentId, row.chapter_id, level, now);
    if (Number(row.seconds) >= 4 * step)
      db.prepare(
        "INSERT OR IGNORE INTO learning_rewards(id,student_id,classroom_id,chapter_id,source,label,points,created_at) VALUES(?,?,?,?,?,?,1,?)",
      ).run(
        randomUUID(),
        studentId,
        row.classroom_id,
        row.chapter_id,
        `tree:${studentId}:${row.chapter_id}`,
        minutes === 60 ? "Chăm cây đủ 4 giờ" : "Chăm cây đạt Kết Trái · Cấp 5",
        now,
      );
  }
}

function releaseCorrections(db: DatabaseSync, run: Row, timestamp: number) {
  if (run.released) return;
  const questions = json<Snapshot[]>(run.questions),
    answers = json<Record<string, QuestionAnswer>>(run.answers);
  for (const q of questions)
    if (!answerCorrect(q, answers[q.id], q.gradingVersion === 2))
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
    answers = json<Record<string, QuestionAnswer>>(run.answers);
  const correct = questions.filter((q) =>
    answerCorrect(q, answers[q.id], q.gradingVersion === 2),
  ).length;
  const score = questions.length
    ? Math.round((correct / questions.length) * 100) / 10
    : 0;
  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare(
      "UPDATE exam_runs SET status='submitted',reason=?,score=?,submitted_at=? WHERE id=? AND status='active'",
    ).run(reason, score, timestamp, run.id);
    creditExamTime(db, run, reason, timestamp);
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
    .prepare("SELECT * FROM exam_runs WHERE status='active'")
    .all()) {
    const policy = sessionPolicy(db, String(run.classroom_id));
    const tabs = Number(
      db
        .prepare("SELECT COUNT(*) n FROM exam_tab_events WHERE run_id=?")
        .get(run.id)!.n,
    );
    const activity = db
      .prepare("SELECT last_activity FROM exam_activity WHERE run_id=?")
      .get(run.id);
    const hunt =
      run.kind === "hunt"
        ? db
            .prepare("SELECT * FROM chapter_hunt_settings WHERE chapter_id=?")
            .get(run.chapter_id)
        : undefined;
    if (
      hunt &&
      (Number(hunt.closes_at) <= timestamp ||
        db
          .prepare("SELECT enabled FROM chapter_exam_access WHERE chapter_id=?")
          .get(run.chapter_id)?.enabled === 0)
    )
      finalize(db, run, "teacher", timestamp);
    else if (tabs >= Math.min(Number(run.tab_limit), policy.closeTabs))
      finalize(db, run, "tabs", timestamp);
    else if (
      timestamp - Number(activity?.last_activity ?? run.started_at) >=
      policy.closeIdleSeconds * 1000
    )
      finalize(db, run, "idle", timestamp);
  }
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
    .prepare("SELECT 1 FROM exam_runs WHERE student_id=? AND status='active'")
    .get(studentId);
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
          .prepare(
            "SELECT 1 FROM chapters WHERE id=? AND classroom_id=? AND id NOT IN (SELECT chapter_id FROM archived_chapters)",
          )
          .get(id, classId)
      )
        fail(403, "Chương không thuộc lớp này.");
    return value as string[];
  }
  function answerValue(q: Snapshot, value: unknown, partial = false) {
    try {
      return validateQuestionAnswer(q, value, partial);
    } catch (e) {
      return fail(400, (e as Error).message);
    }
  }
  function bank(ids: string[]): Snapshot[] {
    return db
      .prepare(
        `SELECT q.*,ch.title AS chapterTitle FROM questions q JOIN chapters ch ON ch.id=q.chapter_id
      WHERE q.active=1 AND q.is_current=1 AND ch.id NOT IN (SELECT chapter_id FROM archived_chapters) AND q.chapter_id IN (${ids.map(() => "?").join(",")}) ORDER BY q.rowid`,
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
        kind: String(q.kind ?? "multiple-choice") as QuestionKind,
        correctAnswer: q.correct_answer ? String(q.correct_answer) : undefined,
        explanation: String(q.explanation),
        ...(q.topic ? { topic: String(q.topic) } : {}),
      }));
  }
  function matrix(classId: string) {
    return db
      .prepare(
        `SELECT q.chapter_id AS chapterId,ch.title AS chapterTitle,q.lesson,COUNT(*) AS available
      FROM questions q JOIN chapters ch ON ch.id=q.chapter_id JOIN chapter_display_order o ON o.chapter_id=ch.id WHERE ch.classroom_id=? AND q.active=1 AND q.is_current=1 AND ch.id NOT IN (SELECT chapter_id FROM archived_chapters)
      GROUP BY q.chapter_id,q.lesson ORDER BY o.position,MIN(q.rowid)`,
      )
      .all(classId)
      .map((q) => ({ ...q, key: `${q.chapterId}::${q.lesson}` }));
  }
  function sample(
    ids: string[],
    count: number,
    weights: unknown,
    lessonKeys?: unknown,
  ): Snapshot[] {
    let all = bank(ids);
    if (lessonKeys !== undefined) {
      if (
        !Array.isArray(lessonKeys) ||
        !lessonKeys.length ||
        lessonKeys.length > 100 ||
        new Set(lessonKeys).size !== lessonKeys.length ||
        lessonKeys.some(
          (key) =>
            typeof key !== "string" ||
            !all.some((q) => `${q.chapterId}::${q.lesson}` === key),
        )
      )
        fail(
          400,
          "Danh sách bài không hợp lệ hoặc không thuộc chương đã chọn.",
        );
      all = all.filter((q) =>
        lessonKeys.includes(`${q.chapterId}::${q.lesson}`),
      );
    }
    if (!all.length) fail(409, "Các chương được chọn chưa có câu hỏi.");
    if (!count) return sampleByTopic(all, 100, (q) => q, randomInt);
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
    if (!Object.keys(w).length)
      return sampleByTopic(all, count, (q) => q, randomInt);
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
      chosen.push(...sampleByTopic(available, quota.n, (q) => q, randomInt));
    }
    return sampleByTopic(chosen, chosen.length, (q) => q, randomInt);
  }
  function examAllowed(chapterId: string) {
    return (
      db
        .prepare("SELECT enabled FROM chapter_exam_access WHERE chapter_id=?")
        .get(chapterId)?.enabled === 1
    );
  }
  function blockedExamChapters(questions: Snapshot[]) {
    // Official sessions have their own teacher-controlled opening; practice
    // and reward-hunt switches never close an unrelated official exam.
    return [] as { id: string; title: string }[];
  }
  function eligibility(ch: Row, userId: string) {
    const levelMinutes = classroomLevelMinutes(db, String(ch.classroom_id));
    const requiredSeconds = 2 * levelStepSeconds(levelMinutes);
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
    const hunt = db
      .prepare("SELECT * FROM chapter_hunt_settings WHERE chapter_id=?")
      .get(ch.id);
    const allowed =
      examAllowed(String(ch.id)) &&
      (!hunt ||
        (json<Snapshot[]>(hunt.questions).length > 0 &&
          Number(hunt.closes_at) > now()));
    if (!allowed) missing.push("Giáo viên chưa mở săn thưởng chương này");
    if (hunt && Number(hunt.starts_at) > now())
      missing.push("Săn thưởng chưa đến giờ bắt đầu");
    if (seconds < requiredSeconds)
      missing.push(
        `Cần thêm ${Math.ceil((requiredSeconds - seconds) / 60)} phút học`,
      );
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
      practiceAllowed: practiceAllowed(db, String(ch.id)),
      hunt: (() => {
        const h = db
          .prepare("SELECT * FROM chapter_hunt_settings WHERE chapter_id=?")
          .get(ch.id);
        return h
          ? {
              hasQuestions: json<Snapshot[]>(h.questions).length > 0,
              uploadedAt: h.uploaded_at,
              title: h.title,
              startsAt: h.starts_at,
              closesAt: h.closes_at,
              durationMinutes: h.duration_minutes,
              preparationMinutes: h.preparation_minutes,
              tabLimit: h.tab_limit,
              open: allowed && Number(h.closes_at) > now(),
            }
          : null;
      })(),
      seconds,
      levelMinutes,
      level: studentLevel(seconds, levelMinutes).level,
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
      answers = json<Record<string, QuestionAnswer>>(fresh.answers);
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
      practiceAfterSubmission: true,
      title: fresh.title,
      kind: fresh.kind,
      delivery:
        definition &&
        db
          .prepare("SELECT 1 FROM online_exam_sessions WHERE exam_id=?")
          .get(definition.id)
          ? "online"
          : "scheduled",
      status: fresh.status,
      startedAt: fresh.started_at,
      deadlineAt: fresh.deadline_at,
      serverNow: now(),
      warnings: Number(
        db
          .prepare("SELECT COUNT(*) AS n FROM exam_tab_events WHERE run_id=?")
          .get(fresh.id)?.n,
      ),
      tabLimit: Math.min(
        Number(fresh.tab_limit),
        sessionPolicy(db, String(fresh.classroom_id)).closeTabs,
      ),
      policy: sessionPolicy(db, String(fresh.classroom_id)),
      questions: questions.map(cleanQuestion),
      answers,
      revision: fresh.revision,
      score: released ? fresh.score : null,
      reason: fresh.reason,
      ...(released
        ? {
            results: questions.map((q) => ({
              questionId: q.id,
              correct: answerCorrect(q, answers[q.id], q.gradingVersion === 2),
              correctIndex: q.correctIndex,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
            })),
          }
        : {}),
    };
  }
  app.get("/api/learning/exam-notices", (req: AppRequest, res) => {
    student(req);
    sweepLearningExams(db, now());
    const rows = db
      .prepare(
        `SELECT e.*,c.name AS classroomName,c.subject,u.name AS teacherName,
      o.duration_minutes,o.preparation_minutes,r.id AS runId,r.status AS runStatus
      FROM online_exam_sessions o JOIN exam_definitions e ON e.id=o.exam_id
      JOIN classrooms c ON c.id=e.classroom_id JOIN users u ON u.id=c.teacher_id
      JOIN memberships m ON m.classroom_id=c.id AND m.student_id=?
      LEFT JOIN exam_runs r ON r.exam_id=e.id AND r.student_id=m.student_id
      WHERE o.started_at IS NOT NULL AND o.started_at<=? AND e.enabled=1 AND e.closes_at>?
        AND (r.status IS NULL OR r.status='active') ORDER BY e.starts_at DESC`,
      )
      .all(req.user!.id, now(), now());
    res.json({
      serverNow: now(),
      notices: rows
        .filter(
          (e) => !blockedExamChapters(json<Snapshot[]>(e.questions)).length,
        )
        .map((e) => ({
          id: e.id,
          classroomId: e.classroom_id,
          classroomName: e.classroomName,
          subject: e.subject,
          teacherName: e.teacherName,
          title: e.title,
          startsAt: e.starts_at,
          closesAt: e.closes_at,
          durationMinutes: e.duration_minutes,
          preparationMinutes: e.preparation_minutes,
          questionCount: json<Snapshot[]>(e.questions).length,
          runId: e.runId ?? null,
        })),
    });
  });
  app.get("/api/classrooms/:id/learning", (req: AppRequest, res) => {
    const c = classroom(req, String(req.params.id));
    sweepLearningExams(db, now());
    if (req.user!.role === "student")
      grantLearningMilestones(db, req.user!.id, now());
    const chapters = db
      .prepare(
        "SELECT ch.* FROM chapters ch JOIN chapter_display_order o ON o.chapter_id=ch.id WHERE ch.classroom_id=? AND ch.id NOT IN (SELECT chapter_id FROM archived_chapters) ORDER BY o.position,ch.rowid",
      )
      .all(c.id)
      .map((ch) => eligibility(ch, req.user!.id));
    const own = req.user!.role === "teacher" ? "" : " AND r.student_id=?";
    const args = own ? [c.id, req.user!.id] : [c.id];
    res.json({
      chapters,
      serverNow: now(),
      onlineExamGroups: true,
      examDeletion: true,
      examScheduling: true,
      examEditing: true,
      examProgressCredit: true,
      classManagement: true,
      sessionPolicy: sessionPolicy(db, String(c.id)),
      levelMinutes: classroomLevelMinutes(db, String(c.id)),
      canConfigureLevels: req.user!.role === "teacher",
      examCreation: true,
      onlineExams: true,
      reviewPapers: true,
      matrix: matrix(c.id),
      blueprints: db
        .prepare(
          `SELECT b.*,p.blueprint_id AS paper_id FROM review_blueprints b
          LEFT JOIN review_papers p ON p.blueprint_id=b.id
          WHERE b.classroom_id=? ORDER BY b.created_at DESC,b.rowid DESC`,
        )
        .all(c.id)
        .map((p) => ({
          id: p.id,
          title: p.title,
          chapterIds: json(p.chapter_ids),
          questionCount: p.question_count,
          weights: json(p.weights),
          source: p.paper_id ? "upload" : "bank",
          createdAt: p.created_at,
        })),
      exams: db
        .prepare(
          "SELECT * FROM exam_definitions WHERE classroom_id=? ORDER BY starts_at DESC",
        )
        .all(c.id)
        .map((e) => {
          const online = db
            .prepare("SELECT * FROM online_exam_sessions WHERE exam_id=?")
            .get(e.id);
          const participants = db
            .prepare(
              "SELECT COUNT(*) AS joined,SUM(status='submitted') AS submitted FROM exam_runs WHERE exam_id=?",
            )
            .get(e.id)!;
          const myRun =
            req.user!.role === "student"
              ? db
                  .prepare(
                    "SELECT id,status FROM exam_runs WHERE exam_id=? AND student_id=?",
                  )
                  .get(e.id, req.user!.id)
              : null;
          return {
            id: e.id,
            title: e.title,
            startsAt: e.starts_at,
            closesAt: e.closes_at,
            tabLimit: e.tab_limit,
            enabled: !!e.enabled,
            questionCount:
              online?.question_count ?? json<Snapshot[]>(e.questions).length,
            delivery: online ? "online" : "scheduled",
            durationMinutes: online?.duration_minutes ?? 20,
            preparationMinutes: online?.preparation_minutes ?? 0,
            startedAt: online?.started_at ?? null,
            scheduledStartAt: online?.scheduled_start_at ?? null,
            progressChapterId: online?.progress_chapter_id ?? null,
            progressChapterTitle: online?.progress_chapter_id
              ? (db
                  .prepare("SELECT title FROM chapters WHERE id=?")
                  .get(online.progress_chapter_id)?.title ?? null)
              : null,
            participants: {
              joined: Number(participants.joined),
              submitted: Number(participants.submitted ?? 0),
            },
            ...(req.user!.role === "student"
              ? {
                  myRun: myRun
                    ? { id: String(myRun.id), status: String(myRun.status) }
                    : null,
                }
              : {}),
            blockedChapters: blockedExamChapters(json<Snapshot[]>(e.questions)),
          };
        }),
      runs: db
        .prepare(
          `SELECT r.*,u.name AS studentName,EXISTS(SELECT 1 FROM exam_definitions e WHERE e.id=r.exam_id AND e.enabled=1 AND e.closes_at>?) AS unreleased,EXISTS(SELECT 1 FROM online_exam_sessions o WHERE o.exam_id=r.exam_id) AS isOnline,(SELECT COUNT(*) FROM exam_tab_events t WHERE t.run_id=r.id) AS warnings
        FROM exam_runs r JOIN users u ON u.id=r.student_id WHERE r.classroom_id=?${own} ORDER BY r.started_at DESC LIMIT 200`,
        )
        .all(now(), ...args)
        .map((r) => ({
          id: r.id,
          examId: r.exam_id ?? null,
          delivery: r.isOnline ? "online" : "scheduled",
          title: r.title,
          kind: r.kind,
          studentName: r.studentName,
          status: r.status,
          score: req.user!.role === "teacher" || !r.unreleased ? r.score : null,
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
  function onlineSession(req: AppRequest) {
    const exam = db
      .prepare(
        "SELECT e.*,o.started_at,o.duration_minutes,o.preparation_minutes,o.question_count FROM exam_definitions e JOIN online_exam_sessions o ON o.exam_id=e.id WHERE e.id=?",
      )
      .get(String(req.params.id));
    if (!exam) fail(404, "Không tìm thấy buổi kiểm tra online.");
    const c = classroom(req, String(exam.classroom_id));
    return { exam, classroom: c };
  }
  app.get("/api/learning/exams/:id/runs", (req: AppRequest, res) => {
    const { exam } = onlineSession(req);
    sweepLearningExams(db, now());
    const own = req.user!.role === "student" ? " AND r.student_id=?" : "";
    const released =
      exam.started_at != null &&
      (!exam.enabled || Number(exam.closes_at) <= now());
    const rows = db
      .prepare(
        `SELECT r.*,u.name AS studentName,(SELECT COUNT(*) FROM exam_tab_events t WHERE t.run_id=r.id) AS warnings FROM exam_runs r JOIN users u ON u.id=r.student_id WHERE r.exam_id=?${own} ORDER BY u.name,r.id`,
      )
      .all(...(own ? [exam.id, req.user!.id] : [exam.id]));
    res.json(
      rows.map((r) => ({
        id: r.id,
        examId: exam.id,
        delivery: "online",
        title: r.title,
        kind: r.kind,
        studentName: r.studentName,
        status: r.status,
        score: req.user!.role === "teacher" || released ? r.score : null,
        deadlineAt: r.deadline_at,
        warnings: r.warnings,
      })),
    );
  });
  app.get("/api/learning/exams/:id/results.xlsx", (req: AppRequest, res) => {
    teacher(req);
    const { exam, classroom: c } = onlineSession(req);
    if (
      exam.started_at == null ||
      (exam.enabled && Number(exam.closes_at) > now())
    )
      fail(409, "Chỉ tải kết quả sau khi buổi kiểm tra kết thúc.");
    sweepLearningExams(db, now());
    const time = (value: unknown) =>
      value == null
        ? ""
        : new Date(Number(value)).toLocaleString("vi-VN", {
            timeZone: "Asia/Ho_Chi_Minh",
          });
    const students = db
      .prepare(
        `SELECT u.id,u.name,u.email,r.id AS runId,r.status,r.score,r.questions,r.answers,r.started_at,r.submitted_at,r.reason,
      (SELECT COUNT(*) FROM exam_tab_events t WHERE t.run_id=r.id) AS warnings
      FROM users u LEFT JOIN exam_runs r ON r.student_id=u.id AND r.exam_id=?
      WHERE u.id IN (SELECT student_id FROM memberships WHERE classroom_id=? UNION SELECT student_id FROM exam_runs WHERE exam_id=?) ORDER BY u.name,u.id`,
      )
      .all(exam.id, c.id, exam.id);
    const reasons: Record<string, string> = {
      manual: "Học sinh nộp",
      deadline: "Hết giờ",
      teacher: "Giáo viên thu bài",
      tabs: "Rời tab đạt ngưỡng",
    };
    const joined = students.filter((s) => s.runId).length;
    const submitted = students.filter((s) => s.status === "submitted").length;
    const metadata = [
      ["Buổi kiểm tra", exam.title],
      ["Mã buổi", exam.id],
      ["Lớp", c.name],
      ["Môn", c.subject],
      ["Trạng thái", "Kết thúc"],
      ["Giờ mở đề", time(exam.starts_at)],
      ["Hạn kết thúc theo lịch", time(exam.closes_at)],
      ["Tham gia", joined],
      ["Đã nộp", submitted],
      ["Múi giờ", "Việt Nam UTC+7"],
    ];
    const results: unknown[][] = [
      [
        "STT",
        "Họ tên",
        "Tài khoản",
        "Trạng thái",
        "Điểm / 10",
        "Số câu đúng",
        "Tổng số câu",
        "Bắt đầu làm bài",
        "Nộp bài",
        "Lần rời tab",
        "Lý do nộp",
      ],
    ];
    students.forEach((s, index) => {
      const questions = s.runId ? json<Snapshot[]>(s.questions) : [];
      const answers = s.runId
        ? json<Record<string, QuestionAnswer>>(s.answers)
        : {};
      results.push([
        index + 1,
        s.name,
        s.email,
        s.runId
          ? s.status === "submitted"
            ? "Đã nộp"
            : "Đang làm"
          : "Chưa tham gia",
        s.score ?? "",
        s.runId
          ? questions.filter((q) =>
              answerCorrect(q, answers[q.id], q.gradingVersion === 2),
            ).length
          : "",
        s.runId ? questions.length : Number(exam.question_count),
        time(s.started_at),
        time(s.submitted_at),
        s.runId ? Number(s.warnings) : "",
        reasons[String(s.reason)] ?? "",
      ]);
    });
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="greenedu-ket-qua-${exam.id}.xlsx"`,
    );
    res
      .type("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
      .send(examResultsWorkbook(metadata, results));
  });
  app.post("/api/classrooms/:id/level-settings", (req: AppRequest, res) => {
    teacher(req);
    const c = classroom(req, String(req.params.id));
    const minutes = req.body?.minutes;
    if (
      typeof minutes !== "number" ||
      !Number.isInteger(minutes) ||
      minutes < 1 ||
      minutes > 1440
    )
      fail(400, "Thời gian mỗi cấp phải là số phút nguyên từ 1 đến 1440.");
    db.prepare(
      `INSERT INTO classroom_level_settings(classroom_id,minutes,updated_by,updated_at)
      VALUES(?,?,?,?) ON CONFLICT(classroom_id) DO UPDATE SET
      minutes=excluded.minutes,updated_by=excluded.updated_by,updated_at=excluded.updated_at`,
    ).run(c.id, minutes, req.user!.id, now());
    res.json({ ok: true, levelMinutes: minutes });
  });
  app.post("/api/classrooms/:id/general-settings", (req: AppRequest, res) => {
    teacher(req);
    const c = classroom(req, String(req.params.id));
    const minutes = req.body?.minutes,
      p = req.body?.policy;
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440)
      fail(400, "Thời gian tăng cấp phải từ 1 đến 1440 phút.");
    if (!validSessionPolicy(p))
      fail(
        400,
        "Ngưỡng cảnh báo phải nhỏ hơn ngưỡng đóng: rời tab 1–20 lần; không tương tác 5–3600 giây.",
      );
    db.exec("BEGIN IMMEDIATE");
    try {
      db.prepare(
        "INSERT INTO classroom_level_settings VALUES(?,?,?,?) ON CONFLICT(classroom_id) DO UPDATE SET minutes=excluded.minutes,updated_by=excluded.updated_by,updated_at=excluded.updated_at",
      ).run(c.id, minutes, req.user!.id, now());
      db.prepare(
        "INSERT INTO classroom_session_policy VALUES(?,?,?,?) ON CONFLICT(classroom_id) DO UPDATE SET policy=excluded.policy,updated_by=excluded.updated_by,updated_at=excluded.updated_at",
      ).run(c.id, JSON.stringify(p), req.user!.id, now());
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
    res.json({ ok: true });
  });
  function managedChapter(req: AppRequest) {
    teacher(req);
    const ch = db
      .prepare("SELECT * FROM chapters WHERE id=?")
      .get(String(req.params.id));
    if (!ch || chapterIsArchived(db, String(ch.id)))
      fail(404, "Không tìm thấy chương đang dùng.");
    classroom(req, String(ch.classroom_id));
    return ch;
  }
  app.post("/api/chapters/:id/practice-access", (req: AppRequest, res) => {
    const ch = managedChapter(req);
    if (typeof req.body?.enabled !== "boolean")
      fail(400, "Trạng thái không hợp lệ.");
    db.prepare(
      "INSERT INTO chapter_practice_access VALUES(?,?,?,?) ON CONFLICT(chapter_id) DO UPDATE SET enabled=excluded.enabled,updated_by=excluded.updated_by,updated_at=excluded.updated_at",
    ).run(ch.id, Number(req.body.enabled), req.user!.id, now());
    if (!req.body.enabled)
      for (const s of db
        .prepare("SELECT id FROM study_sessions WHERE chapter_id=?")
        .all(ch.id))
        terminateStudy(db, String(s.id), "locked");
    res.json({ ok: true });
  });
  app.post("/api/chapters/:id/hunt-access", (req: AppRequest, res) => {
    const ch = managedChapter(req);
    if (
      typeof req.body?.enabled !== "boolean" ||
      (req.body?.deleteQuestions !== undefined &&
        typeof req.body.deleteQuestions !== "boolean")
    )
      fail(400, "Trạng thái không hợp lệ.");
    const old = db
      .prepare("SELECT * FROM chapter_hunt_settings WHERE chapter_id=?")
      .get(ch.id);
    const requestId =
      req.body?.requestId === undefined
        ? null
        : text(req.body.requestId, "Mã mở săn thưởng", 100);
    const fingerprint = createHash("sha256")
      .update(JSON.stringify(req.body))
      .digest("hex");
    if (requestId) {
      const prior = db
        .prepare("SELECT * FROM chapter_hunt_requests WHERE request_id=?")
        .get(requestId);
      if (prior) {
        if (
          prior.chapter_id !== ch.id ||
          prior.teacher_id !== req.user!.id ||
          prior.fingerprint !== fingerprint
        )
          fail(409, "Mã mở đã dùng cho nội dung khác.");
        return res.json({ ok: true });
      }
    }
    if (!req.body.enabled) {
      db.prepare(
        "INSERT INTO chapter_exam_access VALUES(?,?,?,?) ON CONFLICT(chapter_id) DO UPDATE SET enabled=excluded.enabled,updated_by=excluded.updated_by,updated_at=excluded.updated_at",
      ).run(ch.id, 0, req.user!.id, now());
      if (req.body.deleteQuestions)
        db.prepare(
          "UPDATE chapter_hunt_settings SET questions='[]',uploaded_at=0,title='' WHERE chapter_id=?",
        ).run(ch.id);
      for (const r of db
        .prepare(
          "SELECT * FROM exam_runs WHERE chapter_id=? AND kind='hunt' AND status='active'",
        )
        .all(ch.id))
        finalize(db, r, "teacher", now());
      return res.json({ ok: true });
    }
    if (old && examAllowed(String(ch.id)) && Number(old.closes_at) > now())
      fail(
        409,
        "Săn thưởng đang mở. Hãy khóa trước khi thay bộ đề hoặc giờ mở.",
      );
    const preparation = number(
        req.body.preparationMinutes ?? 0,
        "Thời gian chuẩn bị",
        0,
        60,
      ),
      duration = number(
        req.body.durationMinutes ?? 20,
        "Thời gian làm bài",
        1,
        180,
      ),
      tabs = number(
        req.body.tabLimit ??
          sessionPolicy(db, String(ch.classroom_id)).closeTabs,
        "Số lần rời tab",
        1,
        20,
      );
    const title = text(
      req.body.title ?? "Săn thưởng · " + ch.title,
      "Tên bộ đề",
      120,
    );
    let questions: Snapshot[] = [];
    let uploadTime = now();
    const incoming = req.body.questions;
    if (req.body.reuse === true) {
      if (!old || !json<Snapshot[]>(old.questions).length)
        fail(409, "Chưa có bộ đề để sử dụng lại. Hãy tải đề lên.");
      questions = json<Snapshot[]>(old.questions);
      uploadTime = Number(old.uploaded_at);
    } else {
      if (!Array.isArray(incoming) || !incoming.length || incoming.length > 100)
        fail(400, "Tải lên đề có 1–100 câu hỏi hợp lệ.");
      questions = incoming.map((row: any) => {
        if (row?.chapterId !== ch.id)
          fail(403, "Đề săn thưởng chỉ thuộc chương đang mở.");
        let content: ReturnType<typeof questionInput>;
        try {
          content = questionInput(row.question);
        } catch (e) {
          fail(400, (e as Error).message);
        }
        if (lessonIsArchived(db, String(ch.id), content.lesson))
          fail(409, "Bài trong đề đã bị xóa.");
        return {
          ...content,
          id: randomUUID(),
          chapterId: String(ch.id),
          chapterTitle: String(ch.title),
        };
      });
      if (
        new Set(
          questions.map((q) =>
            JSON.stringify([
              q.text,
              q.choices,
              q.correctIndex,
              q.correctAnswer,
            ]),
          ),
        ).size !== questions.length
      )
        fail(400, "Bộ đề có câu hỏi trùng nhau.");
    }
    db.exec("BEGIN IMMEDIATE");
    try {
      if (req.body.reuse !== true)
        for (const q of questions)
          db.prepare(
            `INSERT INTO questions(id,chapter_id,text,choices,correct_index,explanation,lesson,active,is_current,version,kind,correct_answer) VALUES(?,?,?,?,?,?,?,0,0,1,?,?)`,
          ).run(
            q.id,
            q.chapterId,
            q.text,
            JSON.stringify(q.choices),
            q.correctIndex,
            q.explanation,
            q.lesson,
            q.kind ?? "multiple-choice",
            q.correctAnswer ?? null,
          );
      db.prepare(
        "INSERT INTO chapter_hunt_settings VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(chapter_id) DO UPDATE SET questions=excluded.questions,uploaded_at=excluded.uploaded_at,title=excluded.title,duration_minutes=excluded.duration_minutes,preparation_minutes=excluded.preparation_minutes,tab_limit=excluded.tab_limit,starts_at=excluded.starts_at,closes_at=excluded.closes_at",
      ).run(
        ch.id,
        JSON.stringify(questions),
        uploadTime,
        title,
        duration,
        preparation,
        tabs,
        now() + preparation * 60000,
        now() + (preparation + duration) * 60000,
      );
      db.prepare(
        "INSERT INTO chapter_exam_access VALUES(?,?,?,?) ON CONFLICT(chapter_id) DO UPDATE SET enabled=excluded.enabled,updated_by=excluded.updated_by,updated_at=excluded.updated_at",
      ).run(ch.id, 1, req.user!.id, now());
      if (requestId)
        db.prepare("INSERT INTO chapter_hunt_requests VALUES(?,?,?,?)").run(
          requestId,
          ch.id,
          req.user!.id,
          fingerprint,
        );
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
    res.json({ ok: true });
  });
  app.post("/api/chapters/:id/exam-access", (req: AppRequest, res) => {
    teacher(req);
    const ch = db
      .prepare("SELECT * FROM chapters WHERE id=?")
      .get(String(req.params.id));
    if (!ch) fail(404, "Không tìm thấy chương.");
    classroom(req, String(ch.classroom_id));
    if (chapterIsArchived(db, String(ch.id)))
      fail(409, "Chương đã được xóa khỏi danh sách đang dùng.");
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
    if (chapterIsArchived(db, String(ch.id)))
      fail(409, "Chương đã được xóa khỏi danh sách đang dùng.");
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
  app.post("/api/classrooms/:id/review-papers", (req: AppRequest, res) => {
    teacher(req);
    const c = classroom(req, String(req.params.id));
    const title = text(req.body?.title, "Tiêu đề bài ôn", 120);
    const key = text(req.body?.requestId, "Mã tạo bài ôn", 100);
    const fingerprint = createHash("sha256")
      .update(JSON.stringify(req.body))
      .digest("hex");
    const existing = db
      .prepare(
        `SELECT p.*,b.classroom_id FROM review_papers p
      JOIN review_blueprints b ON b.id=p.blueprint_id WHERE p.request_id=?`,
      )
      .get(key);
    if (existing) {
      if (
        existing.teacher_id !== req.user!.id ||
        existing.classroom_id !== c.id ||
        existing.fingerprint !== fingerprint
      )
        fail(409, "Mã tạo bài ôn đã dùng cho nội dung khác.");
      return res.json({ id: existing.blueprint_id });
    }
    const ids = chapterIds(String(c.id), req.body?.chapterIds);
    if (
      !Array.isArray(req.body?.questions) ||
      !req.body.questions.length ||
      req.body.questions.length > 100
    )
      fail(400, "Đề ôn cần 1–100 câu hợp lệ.");
    const uploaded = req.body.questions.map(
      (row: { chapterId?: string; question?: unknown } | null) => {
        if (
          !row ||
          typeof row.chapterId !== "string" ||
          !ids.includes(row.chapterId)
        )
          fail(403, "Câu tải lên phải thuộc chương đã chọn.");
        let content: ReturnType<typeof questionInput>;
        try {
          content = questionInput(row.question);
        } catch (e) {
          fail(400, e instanceof Error ? e.message : "Câu ôn không hợp lệ.");
        }
        content = {
          ...content,
          lesson: resolveQuestionLesson(db, row.chapterId, content.lesson),
        };
        if (lessonIsArchived(db, row.chapterId, content.lesson))
          fail(409, "Bài trong đề ôn đã bị xóa; thêm lại bài trước.");
        return { chapterId: row.chapterId, content };
      },
    );
    const usedIds = [
      ...new Set<string>(
        uploaded.map((row: { chapterId: string }) => row.chapterId),
      ),
    ];
    if (usedIds.length !== ids.length)
      fail(400, "Mỗi chương đã chọn cần có câu hỏi trong đề ôn.");
    if (
      new Set(
        uploaded.map(
          (row: {
            chapterId: string;
            content: ReturnType<typeof questionInput>;
          }) =>
            JSON.stringify([
              row.chapterId,
              row.content.text
                .normalize("NFC")
                .toLocaleLowerCase("vi")
                .replace(/\s+/g, " "),
            ]),
        ),
      ).size !== uploaded.length
    )
      fail(400, "Đề ôn có câu trùng trong cùng chương.");
    const id = randomUUID();
    db.exec("BEGIN IMMEDIATE");
    try {
      const questions: Snapshot[] = uploaded.map(
        ({
          chapterId,
          content,
        }: {
          chapterId: string;
          content: ReturnType<typeof questionInput>;
        }) => {
          const questionId = randomUUID();
          // Private questions keep attempts/notebooks valid without entering the study bank.
          db.prepare(
            `INSERT INTO questions(id,chapter_id,text,choices,correct_index,explanation,lesson,active,is_current,version,changed_at,topic,kind,correct_answer)
          VALUES(?,?,?,?,?,?,?,0,1,1,?,?,?,?)`,
          ).run(
            questionId,
            chapterId,
            content.text,
            JSON.stringify(content.choices),
            content.correctIndex,
            content.explanation,
            content.lesson,
            now(),
            content.topic ?? "",
            content.kind ?? "multiple-choice",
            content.correctAnswer ?? null,
          );
          return {
            ...content,
            id: questionId,
            chapterId,
            chapterTitle: String(
              db
                .prepare("SELECT title FROM chapters WHERE id=?")
                .get(chapterId)!.title,
            ),
          };
        },
      );
      db.prepare("INSERT INTO review_blueprints VALUES(?,?,?,?,?,?,?)").run(
        id,
        c.id,
        title,
        JSON.stringify(usedIds),
        questions.length,
        "{}",
        now(),
      );
      db.prepare("INSERT INTO review_papers VALUES(?,?,?,?,?)").run(
        id,
        req.user!.id,
        key,
        fingerprint,
        JSON.stringify(questions),
      );
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
    res.status(201).json({ id });
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
      fail(409, "Bạn đang làm bài thi. Hãy nộp bài trước khi tiếp tục ôn tập.");
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
    let paper: Row | undefined;
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
      paper = db
        .prepare("SELECT * FROM review_papers WHERE blueprint_id=?")
        .get(p.id);
      if (paper) chapterIds(String(c.id), ids);
    } else {
      ids = chapterIds(c.id, req.body?.chapterIds);
      count = number(req.body?.questionCount ?? 0, "Số câu", 0, 100);
      weights = {};
      title = ids.length === 1 ? "Ôn chương" : "Ôn kỳ";
    }
    for (const id of ids) requirePractice(db, id);
    const questions = paper
        ? shuffle(json<Snapshot[]>(paper.questions))
        : sample(ids, count, weights),
      id = randomUUID();
    db.exec("BEGIN IMMEDIATE");
    try {
      db.prepare(
        "INSERT INTO review_sessions(id,student_id,classroom_id,title,questions,request_id,created_at) VALUES(?,?,?,?,?,?,?)",
      ).run(
        id,
        req.user!.id,
        c.id,
        title,
        JSON.stringify(questions),
        key,
        now(),
      );
      if (paper)
        db.prepare("INSERT INTO review_paper_sessions VALUES(?,?)").run(
          id,
          paper.blueprint_id,
        );
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
    res.status(201).json({ id });
  });
  function review(req: AppRequest) {
    student(req);
    const r = db
      .prepare("SELECT * FROM review_sessions WHERE id=? AND student_id=?")
      .get(String(req.params.id), req.user!.id);
    if (!r) fail(404, "Không tìm thấy phiên ôn.");
    classroom(req, String(r.classroom_id));
    for (const id of new Set(
      json<Snapshot[]>(r.questions).map((q) => q.chapterId),
    ))
      requirePractice(db, id);
    return r;
  }
  app.post("/api/learning/reviews/:id/repeat", (req: AppRequest, res) => {
    const original = review(req);
    if (!original.completed) fail(409, "Hoàn thành bộ ôn trước khi làm lại.");
    if (learningAnswersLocked(db, req.user!.id, now()))
      fail(409, "Hãy nộp bài thi trước khi ôn tập.");
    const requestId = text(req.body?.requestId, "Mã phiên", 100);
    const existing = db
      .prepare("SELECT * FROM review_sessions WHERE request_id=?")
      .get(requestId);
    if (existing) {
      if (
        existing.student_id !== req.user!.id ||
        existing.classroom_id !== original.classroom_id
      )
        fail(409, "Mã phiên đã dùng.");
      return res.json({ id: existing.id });
    }
    const old = json<Snapshot[]>(original.questions);
    const paper = db
      .prepare(
        "SELECT blueprint_id FROM review_paper_sessions WHERE session_id=?",
      )
      .get(original.id);
    const available = paper
      ? old
      : bank([...new Set(old.map((q) => q.chapterId))]);
    const questions = old
      .map((q) => available.find((current) => current.id === q.id))
      .filter((q): q is Snapshot => !!q);
    if (!questions.length)
      fail(409, "Bộ ôn đã được cập nhật. Hãy chọn lại bộ ôn.");
    const id = randomUUID();
    db.exec("BEGIN IMMEDIATE");
    try {
      db.prepare(
        "INSERT INTO review_sessions(id,student_id,classroom_id,title,questions,request_id,created_at) VALUES(?,?,?,?,?,?,?)",
      ).run(
        id,
        req.user!.id,
        original.classroom_id,
        original.title,
        JSON.stringify(shuffle(questions)),
        requestId,
        now(),
      );
      if (paper)
        db.prepare("INSERT INTO review_paper_sessions VALUES(?,?)").run(
          id,
          paper.blueprint_id,
        );
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
    res.status(201).json({ id });
  });
  app.get("/api/learning/reviews/:id", (req: AppRequest, res) => {
    const r = review(req);
    if (learningAnswersLocked(db, req.user!.id, now()))
      fail(409, "Bạn đang làm bài thi. Hãy nộp bài trước khi tiếp tục ôn tập.");
    res.json({
      id: r.id,
      title: r.title,
      currentIndex: r.current_index,
      completed: !!r.completed,
      questions: json<Snapshot[]>(r.questions).map(cleanQuestion),
      answers: Object.fromEntries(
        Object.entries(
          json<Record<string, Parameters<typeof studyFeedback>[0]>>(r.answers),
        ).map(([id, answer]) => [id, studyFeedback(answer)]),
      ),
    });
  });
  app.post("/api/learning/reviews/:id/answer", (req: AppRequest, res) => {
    const r = review(req);
    if (learningAnswersLocked(db, req.user!.id, now()))
      fail(409, "Bạn đang làm bài thi. Hãy nộp bài trước khi tiếp tục ôn tập.");
    const qs = json<Snapshot[]>(r.questions),
      answers = json<
        Record<
          string,
          {
            selected: QuestionAnswer;
            correct: boolean;
            correctIndex: number;
            explanation: string;
          }
        >
      >(r.answers);
    const q = qs.find((q) => q.id === req.body?.questionId);
    if (!q) fail(400, "Câu không thuộc bộ ôn.");
    const selected = answerValue(q, req.body?.selected);
    guardStudy(db, req.user!.id, q.chapterId, now(), req.body?.studySessionId);
    if (answers[q.id]) {
      if (answers[q.id].selected !== selected) fail(409, "Câu đã trả lời.");
      return res.json(studyFeedback(answers[q.id]));
    }
    if (r.completed || qs[Number(r.current_index)]?.id !== q.id)
      fail(409, "Hãy tiếp tục từ câu đang làm.");
    const correct = answerCorrect(q, selected),
      result = {
        selected,
        correct,
        statementCorrectness: statementCorrectness(q, selected),
        correctIndex: q.correctIndex,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      };
    answers[q.id] = result;
    db.exec("BEGIN IMMEDIATE");
    try {
      db.prepare("INSERT INTO attempts VALUES(?,?,?,?,?,'practice',?)").run(
        `review:${r.id}:${q.id}`,
        req.user!.id,
        q.id,
        storedAnswer(selected),
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
    res.json(studyFeedback(result));
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
  function editableExam(req: AppRequest, id: string) {
    teacher(req);
    const exam = db
      .prepare("SELECT * FROM exam_definitions WHERE id=?")
      .get(id);
    if (!exam) fail(404, "Không tìm thấy kiểm tra.");
    classroom(req, String(exam.classroom_id));
    const online = db
      .prepare("SELECT * FROM online_exam_sessions WHERE exam_id=?")
      .get(id);
    if (!online) fail(409, "Chỉ chỉnh sửa bài kiểm tra online.");
    if (
      (online.started_at != null &&
        (!exam.enabled ||
          !online.scheduled_start_at ||
          Number(exam.starts_at) <= now())) ||
      db.prepare("SELECT 1 FROM exam_runs WHERE exam_id=?").get(id)
    )
      fail(
        409,
        "Bài kiểm tra đã bắt đầu; không thể chỉnh sửa đề hoặc thời gian.",
      );
    return { exam, online };
  }
  app.get("/api/learning/exams/:id/edit", (req: AppRequest, res) => {
    const { exam, online } = editableExam(req, String(req.params.id));
    const selection = online.selection
      ? json<Record<string, unknown>>(online.selection)
      : null;
    res.json({
      id: exam.id,
      title: exam.title,
      source: selection ? "bank" : "upload",
      tabLimit: exam.tab_limit,
      durationMinutes: online.duration_minutes,
      preparationMinutes: online.preparation_minutes,
      scheduledStartAt: online.scheduled_start_at ?? null,
      progressChapterId: online.progress_chapter_id ?? null,
      ...(selection ?? {
        questions: json<Snapshot[]>(exam.questions).map((q) => ({
          chapterId: q.chapterId,
          question: q,
        })),
      }),
    });
  });
  function saveExam(req: AppRequest, res: Response, editingId?: string) {
    teacher(req);
    const editing = editingId ? editableExam(req, editingId) : null;
    const c = classroom(
        req,
        String(editing?.exam.classroom_id ?? req.params.id),
      ),
      ids = chapterIds(c.id, req.body?.chapterIds),
      source = req.body?.source ?? "bank";
    if (!["bank", "upload"].includes(source))
      fail(400, "Nguồn đề không hợp lệ.");
    if (
      req.body?.manualOpen !== undefined &&
      typeof req.body.manualOpen !== "boolean"
    )
      fail(400, "Cách mở không hợp lệ.");
    const delivery = req.body?.delivery ?? "scheduled";
    if (!["scheduled", "online"].includes(delivery))
      fail(400, "Loại kiểm tra không hợp lệ.");
    const online = delivery === "online";
    if (editing && !online) fail(400, "Không thể đổi loại kiểm tra.");
    const progressChapterId = req.body?.progressChapterId || null;
    if (progressChapterId != null) {
      if (
        !online ||
        typeof progressChapterId !== "string" ||
        !db
          .prepare(
            "SELECT 1 FROM chapters WHERE id=? AND classroom_id=? AND id NOT IN (SELECT chapter_id FROM archived_chapters)",
          )
          .get(progressChapterId, c.id)
      )
        fail(400, "Chọn chương nhận thời gian trong lớp hiện tại.");
    }
    const durationMinutes = online
      ? number(req.body?.durationMinutes ?? 20, "Thời gian làm bài", 1, 180)
      : 20;
    const preparationMinutes = online
      ? number(req.body?.preparationMinutes ?? 3, "Thời gian chuẩn bị", 0, 60)
      : 0;
    const title = text(req.body?.title, "Tên kiểm tra", 120);
    const tabLimit = number(
      req.body?.tabLimit ?? 4,
      "Ngưỡng chuyển tab",
      1,
      10,
    );
    const scheduledStartAt =
      online && req.body?.scheduledStartAt != null
        ? number(
            req.body.scheduledStartAt,
            "Hẹn giờ bắt đầu",
            1,
            8640000000000000,
          )
        : null;
    const starts = online
        ? (scheduledStartAt ?? now())
        : number(req.body?.startsAt, "Giờ mở", 1, 8640000000000000),
      closes = online
        ? starts + durationMinutes * 60000
        : number(req.body?.closesAt, "Giờ đóng", 1, 8640000000000000);
    const requestId =
      req.body?.requestId === undefined
        ? null
        : text(req.body.requestId, "Mã tạo kiểm tra", 100);
    const fingerprint = createHash("sha256")
      .update(
        JSON.stringify(editingId ? { editingId, body: req.body } : req.body),
      )
      .digest("hex");
    if (requestId) {
      const existing = db
        .prepare("SELECT * FROM exam_creation_requests WHERE request_id=?")
        .get(requestId);
      if (existing) {
        if (
          existing.teacher_id !== req.user!.id ||
          existing.classroom_id !== c.id ||
          existing.fingerprint !== fingerprint
        )
          fail(409, "Mã tạo kiểm tra đã dùng cho nội dung khác.");
        return res.json({ id: existing.exam_id });
      }
    }
    if (scheduledStartAt != null && scheduledStartAt <= now())
      fail(400, "Hẹn giờ bắt đầu phải ở tương lai.");
    if (closes <= starts || closes <= now())
      fail(400, "Giờ đóng phải sau giờ mở và hiện tại.");
    let uploaded: {
      chapterId: string;
      content: ReturnType<typeof questionInput>;
    }[] = [];
    let questions: Snapshot[] = [];
    if (source === "bank")
      questions = sample(
        ids,
        number(req.body?.questionCount, "Số câu", 1, 100),
        req.body?.weights ?? {},
        req.body?.lessonKeys,
      );
    else {
      if (
        !Array.isArray(req.body?.questions) ||
        !req.body.questions.length ||
        req.body.questions.length > 100
      )
        fail(400, "Đề tải lên cần 1–100 câu hợp lệ.");
      uploaded = req.body.questions.map((row: any) => {
        if (!row || !ids.includes(row.chapterId))
          fail(403, "Câu tải lên phải thuộc chương đã chọn.");
        let content: ReturnType<typeof questionInput>;
        try {
          content = questionInput(row.question);
        } catch (error) {
          fail(
            400,
            error instanceof Error
              ? error.message
              : "Câu tải lên không hợp lệ.",
          );
        }
        if (lessonIsArchived(db, row.chapterId, content.lesson))
          fail(409, "Bài trong đề đã bị xóa; thêm lại bài trước.");
        return { chapterId: row.chapterId, content };
      });
      if (
        new Set(
          uploaded.map((row) =>
            JSON.stringify([
              row.chapterId,
              row.content.text
                .normalize("NFC")
                .toLowerCase()
                .replace(/\s+/g, " "),
            ]),
          ),
        ).size !== uploaded.length
      )
        fail(400, "Đề tải lên có câu trùng trong cùng chương.");
    }
    const id = editingId ?? randomUUID();
    db.exec("BEGIN IMMEDIATE");
    try {
      if (editingId) editableExam(req, editingId);
      const previous = editing ? json<Snapshot[]>(editing.exam.questions) : [];
      for (const { chapterId, content } of uploaded) {
        const reusable = previous.find(
          (q) =>
            q.chapterId === chapterId &&
            JSON.stringify(questionInput(q)) === JSON.stringify(content),
        );
        const questionId = reusable?.id ?? randomUUID();
        // Private exam questions support grading/notebook without publishing to practice.
        if (!reusable)
          db.prepare(
            `INSERT INTO questions(id,chapter_id,text,choices,correct_index,explanation,lesson,active,is_current,version,changed_at,topic,kind,correct_answer)
          VALUES(?,?,?,?,?,?,?,0,1,1,?,?,?,?)`,
          ).run(
            questionId,
            chapterId,
            content.text,
            JSON.stringify(content.choices),
            content.correctIndex,
            content.explanation,
            content.lesson,
            now(),
            content.topic ?? "",
            content.kind ?? "multiple-choice",
            content.correctAnswer ?? null,
          );
        questions.push({
          ...content,
          id: questionId,
          chapterId,
          chapterTitle: String(
            db.prepare("SELECT title FROM chapters WHERE id=?").get(chapterId)!
              .title,
          ),
        });
      }
      if (editingId) {
        db.prepare(
          "UPDATE exam_definitions SET title=?,questions=?,starts_at=?,closes_at=?,tab_limit=?,enabled=? WHERE id=?",
        ).run(
          title,
          JSON.stringify(
            online && source === "bank" && !scheduledStartAt ? [] : questions,
          ),
          starts,
          closes,
          tabLimit,
          scheduledStartAt ? 1 : 0,
          id,
        );
      } else
        db.prepare(
          "INSERT INTO exam_definitions VALUES(?,?,?,?,?,?,?,?,?)",
        ).run(
          id,
          c.id,
          title,
          JSON.stringify(
            online && source === "bank" && !scheduledStartAt ? [] : questions,
          ),
          starts,
          closes,
          tabLimit,
          scheduledStartAt ? 1 : online || req.body?.manualOpen ? 0 : 1,
          now(),
        );
      if (online)
        db.prepare(
          `INSERT INTO online_exam_sessions(exam_id,duration_minutes,preparation_minutes,question_count,selection,scheduled_start_at,started_at) VALUES(?,?,?,?,?,?,?)
          ON CONFLICT(exam_id) DO UPDATE SET duration_minutes=excluded.duration_minutes,preparation_minutes=excluded.preparation_minutes,
          question_count=excluded.question_count,selection=excluded.selection,scheduled_start_at=excluded.scheduled_start_at,started_at=excluded.started_at`,
        ).run(
          id,
          durationMinutes,
          preparationMinutes,
          questions.length,
          source === "bank"
            ? JSON.stringify({
                chapterIds: ids,
                questionCount: questions.length,
                weights: req.body?.weights ?? {},
                lessonKeys: req.body?.lessonKeys,
              })
            : null,
          scheduledStartAt,
          scheduledStartAt == null
            ? null
            : Math.max(now(), scheduledStartAt - preparationMinutes * 60000),
        );
      if (online)
        db.prepare(
          "UPDATE online_exam_sessions SET progress_chapter_id=? WHERE exam_id=?",
        ).run(progressChapterId, id);
      if (requestId)
        db.prepare("INSERT INTO exam_creation_requests VALUES(?,?,?,?,?)").run(
          requestId,
          c.id,
          req.user!.id,
          fingerprint,
          id,
        );
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    res.status(editingId ? 200 : 201).json({ id });
  }
  app.post("/api/classrooms/:id/exams", (req: AppRequest, res) =>
    saveExam(req, res),
  );
  app.post("/api/learning/exams/:id/update", (req: AppRequest, res) =>
    saveExam(req, res, String(req.params.id)),
  );
  app.post("/api/learning/exams/:id/open", (req: AppRequest, res) => {
    teacher(req);
    const e = db
      .prepare("SELECT * FROM exam_definitions WHERE id=?")
      .get(String(req.params.id));
    if (!e) fail(404, "Không tìm thấy kiểm tra.");
    classroom(req, String(e.classroom_id));
    const timestamp = now();
    const online = db
      .prepare("SELECT * FROM online_exam_sessions WHERE exam_id=?")
      .get(e.id);
    if (online?.started_at != null)
      return res.json({
        ok: true,
        startedAt: online.started_at,
        closesAt: e.closes_at,
      });
    if (!online && Number(e.closes_at) <= timestamp)
      fail(409, "Bài đã hết giờ. Tạo lịch kiểm tra mới để mở.");
    db.exec("BEGIN IMMEDIATE");
    try {
      if (online) {
        const selection = online.selection
          ? json<{
              chapterIds: string[];
              questionCount: number;
              weights: Record<string, number>;
              lessonKeys?: string[];
            }>(online.selection)
          : null;
        const questions = selection
          ? sample(
              selection.chapterIds,
              selection.questionCount,
              selection.weights,
              selection.lessonKeys,
            )
          : json<Snapshot[]>(e.questions);
        db.prepare(
          "UPDATE exam_definitions SET questions=?,starts_at=?,closes_at=?,enabled=1 WHERE id=?",
        ).run(
          JSON.stringify(questions),
          timestamp + Number(online.preparation_minutes) * 60000,
          timestamp +
            (Number(online.preparation_minutes) +
              Number(online.duration_minutes)) *
              60000,
          e.id,
        );
        db.prepare(
          "UPDATE online_exam_sessions SET started_at=? WHERE exam_id=?",
        ).run(timestamp, e.id);
        e.questions = JSON.stringify(questions);
      }
      for (const chapterId of new Set(
        json<Snapshot[]>(e.questions).map((q) => q.chapterId),
      ))
        db.prepare(
          `INSERT INTO chapter_exam_access VALUES(?,1,?,?) ON CONFLICT(chapter_id)
          DO UPDATE SET enabled=1,updated_by=excluded.updated_by,updated_at=excluded.updated_at`,
        ).run(chapterId, req.user!.id, timestamp);
      if (!online)
        db.prepare(
          "UPDATE exam_definitions SET enabled=1,starts_at=MIN(starts_at,?) WHERE id=?",
        ).run(timestamp, e.id);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    res.json({ ok: true });
  });
  app.post("/api/learning/exams/:id/delete", (req: AppRequest, res) => {
    teacher(req);
    const id = String(req.params.id);
    const exam = db
      .prepare("SELECT * FROM exam_definitions WHERE id=?")
      .get(id);
    if (!exam) fail(404, "Không tìm thấy kiểm tra.");
    classroom(req, String(exam.classroom_id));
    sweepLearningExams(db, now());
    const online = db
      .prepare(
        "SELECT started_at,scheduled_start_at FROM online_exam_sessions WHERE exam_id=?",
      )
      .get(id);
    if (
      (exam.enabled &&
        Number(exam.closes_at) > now() &&
        (!online || online.started_at != null) &&
        !(online?.scheduled_start_at && Number(exam.starts_at) > now())) ||
      db
        .prepare("SELECT 1 FROM exam_runs WHERE exam_id=? AND status='active'")
        .get(id)
    )
      fail(409, "Hãy đóng bài thi để thu bài học sinh trước khi xóa.");
    db.exec("BEGIN IMMEDIATE");
    try {
      db.prepare(
        "DELETE FROM exam_tab_events WHERE run_id IN (SELECT id FROM exam_runs WHERE exam_id=?)",
      ).run(id);
      db.prepare(
        "DELETE FROM exam_activity WHERE run_id IN (SELECT id FROM exam_runs WHERE exam_id=?)",
      ).run(id);
      db.prepare("DELETE FROM exam_runs WHERE exam_id=?").run(id);
      db.prepare("DELETE FROM online_exam_sessions WHERE exam_id=?").run(id);
      db.prepare("DELETE FROM exam_creation_requests WHERE exam_id=?").run(id);
      db.prepare("DELETE FROM exam_definitions WHERE id=?").run(id);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    res.json({ ok: true });
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
    if (
      req.body.enabled &&
      db.prepare("SELECT 1 FROM online_exam_sessions WHERE exam_id=?").get(e.id)
    )
      fail(
        409,
        "Buổi kiểm tra online chỉ bắt đầu một lần. Dùng Bắt đầu kiểm tra hoặc tạo buổi mới.",
      );
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
      const online = db
        .prepare("SELECT * FROM online_exam_sessions WHERE exam_id=?")
        .get(e.id);
      if (online && online.started_at == null)
        fail(403, "Giáo viên chưa bắt đầu kiểm tra online.");
      questions = online
        ? shuffle(snapshot)
        : sampleByTopic(snapshot, snapshot.length, (q) => q, randomInt);
      deadline = online
        ? Number(e.closes_at)
        : Math.min(now() + 1200000, Number(e.closes_at));
      title = String(e.title);
      tabLimit = Number(e.tab_limit);
      examId = String(e.id);
    } else {
      const ch = db
        .prepare(
          "SELECT * FROM chapters WHERE id=? AND classroom_id=? AND id NOT IN (SELECT chapter_id FROM archived_chapters)",
        )
        .get(req.body?.chapterId, c.id);
      if (!ch) fail(404, "Không tìm thấy chương.");
      grantLearningMilestones(db, req.user!.id, now());
      const state = eligibility(ch, req.user!.id);
      if (!state.eligible) fail(403, state.missing.join(" · "));
      const hunt = db
        .prepare("SELECT * FROM chapter_hunt_settings WHERE chapter_id=?")
        .get(ch.id);
      questions = hunt
        ? shuffle(json<Snapshot[]>(hunt.questions))
        : sample(
            [String(ch.id)],
            Math.min(20, bank([String(ch.id)]).length),
            {},
          );
      deadline = hunt
        ? Math.min(
            now() + Number(hunt.duration_minutes) * 60000,
            Number(hunt.closes_at),
          )
        : now() + 1200000;
      tabLimit = hunt
        ? Number(hunt.tab_limit)
        : sessionPolicy(db, String(c.id)).closeTabs;
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
        JSON.stringify(questions.map((q) => ({ ...q, gradingVersion: 2 }))),
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
      db.prepare("INSERT INTO exam_activity VALUES(?,?)").run(id, now());
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
  app.post("/api/learning/exam-runs/:id/activity", (req: AppRequest, res) => {
    student(req);
    const r = ownedRun(req);
    sweepLearningExams(db, now());
    if (
      db.prepare("SELECT status FROM exam_runs WHERE id=?").get(r.id)
        ?.status === "active"
    )
      db.prepare(
        "INSERT INTO exam_activity VALUES(?,?) ON CONFLICT(run_id) DO UPDATE SET last_activity=excluded.last_activity",
      ).run(r.id, now());
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
      answers = json<Record<string, QuestionAnswer>>(r.answers);
    for (const [id, value] of Object.entries(incoming)) {
      if (!ids.has(id)) fail(400, "Câu không thuộc đề thi.");
      const q = json<Snapshot[]>(r.questions).find((q) => q.id === id)!;
      answers[id] = answerValue(q, value, true);
    }
    db.prepare(
      "UPDATE exam_runs SET answers=?,revision=revision+1 WHERE id=?",
    ).run(JSON.stringify(answers), r.id);
    db.prepare(
      "INSERT INTO exam_activity VALUES(?,?) ON CONFLICT(run_id) DO UPDATE SET last_activity=excluded.last_activity",
    ).run(r.id, now());
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
      if (
        n >=
        Math.min(
          Number(r.tab_limit),
          sessionPolicy(db, String(r.classroom_id)).closeTabs,
        )
      )
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
