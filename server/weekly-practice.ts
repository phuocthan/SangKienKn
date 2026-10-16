import type { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import {
  practiceWeek,
  type WeeklyPracticeData,
  type WeeklyMember,
} from "../shared/weekly-practice.js";
import {
  STUDY_DAY_MS,
  studyDayStart,
  studyDate,
} from "../shared/study-statistics.js";

export function ensureWeeklyPracticeSchema(db: DatabaseSync) {
  db.exec(`CREATE TABLE IF NOT EXISTS weekly_practice_tracking(id INTEGER PRIMARY KEY CHECK(id=1),started_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS weekly_practice_settings(
      classroom_id TEXT NOT NULL REFERENCES classrooms(id),effective_week TEXT NOT NULL,
      minutes INTEGER NOT NULL CHECK(minutes BETWEEN 0 AND 9360),updated_at INTEGER NOT NULL,
      PRIMARY KEY(classroom_id,effective_week));
    CREATE TABLE IF NOT EXISTS weekly_practice_periods(
      classroom_id TEXT NOT NULL REFERENCES classrooms(id),week TEXT NOT NULL,minutes INTEGER NOT NULL,
      coverage_start INTEGER NOT NULL,closed_at INTEGER,
      PRIMARY KEY(classroom_id,week));
    CREATE TABLE IF NOT EXISTS weekly_practice_members(
      classroom_id TEXT NOT NULL,week TEXT NOT NULL,student_id TEXT NOT NULL REFERENCES users(id),name TEXT NOT NULL,
      PRIMARY KEY(classroom_id,week,student_id));
    CREATE TABLE IF NOT EXISTS weekly_practice_credit(
      session_id TEXT NOT NULL,student_id TEXT NOT NULL REFERENCES users(id),classroom_id TEXT NOT NULL REFERENCES classrooms(id),
      week TEXT NOT NULL,credited_ms INTEGER NOT NULL CHECK(credited_ms>=0),
      PRIMARY KEY(session_id,classroom_id,week));
    CREATE INDEX IF NOT EXISTS weekly_credit_report ON weekly_practice_credit(classroom_id,week,student_id);`);
}
export function startWeeklyPractice(db: DatabaseSync, now: number) {
  db.prepare(
    "INSERT INTO weekly_practice_tracking VALUES(1,?) ON CONFLICT DO NOTHING",
  ).run(now);
}

// Exact interval clipping; Sunday afternoon belongs to neither learning window.
// Called inside creditStudyInterval's transaction before its session is removed.
export function recordWeeklyPractice(
  db: DatabaseSync,
  student: string,
  chapter: string,
  start: number,
  end: number,
) {
  const tracking = db
    .prepare("SELECT started_at FROM weekly_practice_tracking WHERE id=1")
    .get();
  if (!tracking || end <= start) return;
  const classroom = db
    .prepare("SELECT classroom_id FROM chapters WHERE id=?")
    .get(chapter);
  if (!classroom) return;
  const session = db
    .prepare(
      "SELECT id FROM study_sessions WHERE student_id=? AND chapter_id=?",
    )
    .get(student, chapter);
  const id = String(session?.id ?? `interval-${randomUUID()}`);
  for (
    let cursor = Math.max(start, Number(tracking.started_at));
    cursor < end;
  ) {
    const w = practiceWeek(cursor);
    const finish = Math.min(end, w.closesAt);
    if (finish > cursor)
      db.prepare(
        `INSERT INTO weekly_practice_credit VALUES(?,?,?,?,?)
      ON CONFLICT(session_id,classroom_id,week) DO UPDATE SET credited_ms=credited_ms+excluded.credited_ms`,
      ).run(
        id,
        student,
        classroom.classroom_id,
        w.week,
        Math.round(finish - cursor),
      );
    cursor = w.startsAt + 7 * STUDY_DAY_MS;
  }
}

export function sweepWeeklyPractice(db: DatabaseSync, now: number) {
  const w = practiceWeek(now);
  const tracking = db
    .prepare("SELECT started_at FROM weekly_practice_tracking WHERE id=1")
    .get();
  if (!tracking) return;
  db.exec("SAVEPOINT weekly_sweep");
  try {
    // The stored roster/goal, not today's roster/goal, belongs to a closed week.
    for (const row of db
      .prepare(
        "SELECT classroom_id,week FROM weekly_practice_periods WHERE closed_at IS NULL",
      )
      .all()) {
      const deadline = studyDayStart(String(row.week)) + 6.5 * STUDY_DAY_MS;
      if (now >= deadline)
        db.prepare(
          "UPDATE weekly_practice_periods SET closed_at=? WHERE classroom_id=? AND week=?",
        ).run(deadline, row.classroom_id, row.week);
    }
    if (now < w.closesAt) {
      const settings = db
        .prepare(
          `SELECT s.* FROM weekly_practice_settings s WHERE effective_week<=?
        AND effective_week=(SELECT MAX(t.effective_week) FROM weekly_practice_settings t WHERE t.classroom_id=s.classroom_id AND t.effective_week<=?)`,
        )
        .all(w.week, w.week);
      for (const s of settings) {
        if (Number(s.minutes) <= 0) continue;
        db.prepare(
          "INSERT INTO weekly_practice_periods VALUES(?,?,?,?,NULL) ON CONFLICT DO NOTHING",
        ).run(
          s.classroom_id,
          w.week,
          s.minutes,
          Math.max(w.startsAt, Number(tracking.started_at)),
        );
        db.prepare(
          `INSERT INTO weekly_practice_members SELECT ?,?,u.id,u.name FROM memberships m JOIN users u ON u.id=m.student_id
          WHERE m.classroom_id=? ON CONFLICT(classroom_id,week,student_id) DO UPDATE SET name=excluded.name WHERE name<>excluded.name`,
        ).run(s.classroom_id, w.week, s.classroom_id);
        db.prepare(
          `DELETE FROM weekly_practice_members WHERE classroom_id=? AND week=? AND student_id NOT IN
          (SELECT student_id FROM memberships WHERE classroom_id=?)`,
        ).run(s.classroom_id, w.week, s.classroom_id);
      }
    }
    db.exec("RELEASE weekly_sweep");
  } catch (e) {
    db.exec("ROLLBACK TO weekly_sweep; RELEASE weekly_sweep");
    throw e;
  }
}

export function saveWeeklyMinimum(
  db: DatabaseSync,
  classroom: string,
  minutes: number,
  now: number,
) {
  const w = practiceWeek(now);
  const latest = db
    .prepare(
      "SELECT minutes FROM weekly_practice_settings WHERE classroom_id=? ORDER BY effective_week DESC LIMIT 1",
    )
    .get(classroom);
  if (latest && Number(latest.minutes) === minutes) {
    sweepWeeklyPractice(db, now);
    return;
  }
  const existing = db
    .prepare(
      "SELECT 1 FROM weekly_practice_settings WHERE classroom_id=? LIMIT 1",
    )
    .get(classroom);
  const effectiveWeek =
    !existing && now < w.closesAt
      ? w.week
      : studyDate(w.startsAt + 7 * STUDY_DAY_MS);
  db.exec("SAVEPOINT weekly_settings");
  try {
    db.prepare(
      `INSERT INTO weekly_practice_settings VALUES(?,?,?,?) ON CONFLICT(classroom_id,effective_week)
      DO UPDATE SET minutes=excluded.minutes,updated_at=excluded.updated_at`,
    ).run(classroom, effectiveWeek, minutes, now);
    sweepWeeklyPractice(db, now);
    db.exec("RELEASE weekly_settings");
  } catch (e) {
    db.exec("ROLLBACK TO weekly_settings; RELEASE weekly_settings");
    throw e;
  }
}

export function weeklyPracticeReport(
  db: DatabaseSync,
  classroom: string,
  now: number,
  selected?: string,
): WeeklyPracticeData {
  sweepWeeklyPractice(db, now);
  const config = db
    .prepare(
      "SELECT * FROM weekly_practice_settings WHERE classroom_id=? ORDER BY effective_week DESC LIMIT 1",
    )
    .get(classroom);
  const weeks = db
    .prepare(
      "SELECT week,minutes,closed_at FROM weekly_practice_periods WHERE classroom_id=? ORDER BY week DESC",
    )
    .all(classroom)
    .map((r) => ({
      week: String(r.week),
      minutes: Number(r.minutes),
      closed: r.closed_at !== null,
    }));
  const week = selected ?? weeks[0]?.week;
  const row = week
    ? db
        .prepare(
          "SELECT * FROM weekly_practice_periods WHERE classroom_id=? AND week=?",
        )
        .get(classroom, week)
    : undefined;
  let report: WeeklyPracticeData["report"] = null;
  if (row) {
    const members = db
      .prepare(
        `SELECT m.student_id,m.name,COALESCE(SUM(c.credited_ms),0) ms FROM weekly_practice_members m
      LEFT JOIN weekly_practice_credit c ON c.classroom_id=m.classroom_id AND c.week=m.week AND c.student_id=m.student_id
      WHERE m.classroom_id=? AND m.week=? GROUP BY m.student_id,m.name ORDER BY m.name,m.student_id`,
      )
      .all(classroom, week!);
    const map = (r: (typeof members)[number]): WeeklyMember => ({
      id: String(r.student_id),
      name: String(r.name),
      seconds: Math.floor(Number(r.ms) / 1000),
      remainingSeconds: Math.max(
        0,
        Number(row.minutes) * 60 - Math.floor(Number(r.ms) / 1000),
      ),
    });
    const students = members.map(map);
    const start = studyDayStart(week!);
    report = {
      week: week!,
      startsAt: start,
      closesAt: start + 6.5 * STUDY_DAY_MS,
      minutes: Number(row.minutes),
      coverageStart: Number(row.coverage_start),
      closed: row.closed_at !== null,
      completed: students.filter((s) => s.remainingSeconds === 0),
      incomplete: students.filter((s) => s.remainingSeconds > 0),
    };
  }
  return {
    serverNow: now,
    config: {
      minutes: Number(config?.minutes ?? 0),
      effectiveWeek: config ? String(config.effective_week) : null,
    },
    weeks,
    report,
  };
}
