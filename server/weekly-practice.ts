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
  if (
    !db
      .prepare("PRAGMA table_info(weekly_practice_credit)")
      .all()
      .some((c) => c.name === "before_noon_ms")
  ) {
    db.exec(
      "ALTER TABLE weekly_practice_credit ADD COLUMN before_noon_ms INTEGER NOT NULL DEFAULT 0; UPDATE weekly_practice_credit SET before_noon_ms=credited_ms",
    );
  }
  db.exec(`CREATE TABLE IF NOT EXISTS weekly_practice_preliminary(
    classroom_id TEXT NOT NULL,week TEXT NOT NULL,student_id TEXT NOT NULL,name TEXT NOT NULL,seconds INTEGER NOT NULL,
    PRIMARY KEY(classroom_id,week,student_id));
    CREATE TABLE IF NOT EXISTS weekly_practice_checkpoints(classroom_id TEXT NOT NULL,week TEXT NOT NULL,
    PRIMARY KEY(classroom_id,week));`);
  if (
    !db
      .prepare("PRAGMA table_info(weekly_practice_periods)")
      .all()
      .some((c) => c.name === "noon_eligible")
  )
    db.exec(
      "ALTER TABLE weekly_practice_periods ADD COLUMN noon_eligible INTEGER NOT NULL DEFAULT 1",
    );
}
export function startWeeklyPractice(db: DatabaseSync, now: number) {
  db.prepare(
    "INSERT INTO weekly_practice_tracking VALUES(1,?) ON CONFLICT DO NOTHING",
  ).run(now);
}

// Count the entire week; retain exact pre-noon credit for the reminder snapshot.
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
        `INSERT INTO weekly_practice_credit VALUES(?,?,?,?,?,?)
      ON CONFLICT(session_id,classroom_id,week) DO UPDATE SET credited_ms=credited_ms+excluded.credited_ms,before_noon_ms=before_noon_ms+excluded.before_noon_ms`,
      ).run(
        id,
        student,
        classroom.classroom_id,
        w.week,
        Math.round(finish - cursor),
        Math.round(Math.max(0, Math.min(finish, w.preliminaryAt) - cursor)),
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
    // Upgrade noon closures from the previous policy, preserving recorded credit.
    for (const row of db
      .prepare(
        "SELECT classroom_id,week,closed_at FROM weekly_practice_periods WHERE closed_at IS NOT NULL",
      )
      .all()) {
      const oldDeadline = studyDayStart(String(row.week)) + 6.5 * STUDY_DAY_MS;
      if (Number(row.closed_at) === oldDeadline) {
        const end = oldDeadline + 0.5 * STUDY_DAY_MS;
        db.prepare(
          "UPDATE weekly_practice_periods SET closed_at=? WHERE classroom_id=? AND week=?",
        ).run(now < end ? null : end, row.classroom_id, row.week);
      }
    }
    // Snapshot the noon list once, including when the worker resumes after noon.
    for (const row of db
      .prepare(
        `SELECT * FROM weekly_practice_periods p WHERE NOT EXISTS
      (SELECT 1 FROM weekly_practice_checkpoints s WHERE s.classroom_id=p.classroom_id AND s.week=p.week)`,
      )
      .all()) {
      const noon = studyDayStart(String(row.week)) + 6.5 * STUDY_DAY_MS;
      if (
        now < noon ||
        Number(row.coverage_start) >= noon ||
        !row.noon_eligible
      )
        continue;
      db.prepare(
        `INSERT INTO weekly_practice_preliminary
        SELECT m.classroom_id,m.week,m.student_id,m.name,CAST(COALESCE(SUM(c.before_noon_ms),0)/1000 AS INTEGER)
        FROM weekly_practice_members m LEFT JOIN weekly_practice_credit c
        ON c.classroom_id=m.classroom_id AND c.week=m.week AND c.student_id=m.student_id
        WHERE m.classroom_id=? AND m.week=? GROUP BY m.student_id`,
      ).run(row.classroom_id, row.week);
      db.prepare("INSERT INTO weekly_practice_checkpoints VALUES(?,?)").run(
        row.classroom_id,
        row.week,
      );
    }
    // The stored roster/goal, not today's roster/goal, belongs to a closed week.
    for (const row of db
      .prepare(
        "SELECT classroom_id,week FROM weekly_practice_periods WHERE closed_at IS NULL",
      )
      .all()) {
      const deadline = studyDayStart(String(row.week)) + 7 * STUDY_DAY_MS;
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
          "INSERT INTO weekly_practice_periods(classroom_id,week,minutes,coverage_start,closed_at,noon_eligible) VALUES(?,?,?,?,NULL,?) ON CONFLICT DO NOTHING",
        ).run(
          s.classroom_id,
          w.week,
          s.minutes,
          Math.max(w.startsAt, Number(tracking.started_at)),
          now < w.preliminaryAt ? 1 : 0,
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
      closesAt: start + 7 * STUDY_DAY_MS,
      preliminaryAt: start + 6.5 * STUDY_DAY_MS,
      preliminary: null,
      minutes: Number(row.minutes),
      coverageStart: Number(row.coverage_start),
      closed: row.closed_at !== null,
      completed: students.filter((s) => s.remainingSeconds === 0),
      incomplete: students.filter((s) => s.remainingSeconds > 0),
    };
    if (
      db
        .prepare(
          "SELECT 1 FROM weekly_practice_checkpoints WHERE classroom_id=? AND week=?",
        )
        .get(classroom, week!)
    ) {
      const snapshot = db
        .prepare(
          "SELECT * FROM weekly_practice_preliminary WHERE classroom_id=? AND week=? ORDER BY name,student_id",
        )
        .all(classroom, week!)
        .map((r) => ({
          id: String(r.student_id),
          name: String(r.name),
          seconds: Number(r.seconds),
          remainingSeconds: Math.max(
            0,
            Number(row.minutes) * 60 - Number(r.seconds),
          ),
        }));
      report.preliminary = {
        completed: snapshot.filter((s) => s.remainingSeconds === 0),
        incomplete: snapshot.filter((s) => s.remainingSeconds > 0),
      };
    }
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
