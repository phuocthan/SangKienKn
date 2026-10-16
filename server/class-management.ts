import type { DatabaseSync } from "node:sqlite";
import {
  DEFAULT_SESSION_POLICY,
  type SessionPolicy,
} from "../shared/session-policy.js";

export class ClassManagementError extends Error {
  status = 403;
}
export function ensureClassManagementSchema(db: DatabaseSync) {
  db.exec(`CREATE TABLE IF NOT EXISTS classroom_session_policy (
    classroom_id TEXT PRIMARY KEY REFERENCES classrooms(id), policy TEXT NOT NULL,
    updated_by TEXT NOT NULL REFERENCES users(id), updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS chapter_practice_access (
    chapter_id TEXT PRIMARY KEY REFERENCES chapters(id), enabled INTEGER NOT NULL CHECK(enabled IN (0,1)),
    updated_by TEXT NOT NULL REFERENCES users(id), updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS chapter_hunt_settings (
    chapter_id TEXT PRIMARY KEY REFERENCES chapters(id), questions TEXT NOT NULL,
    uploaded_at INTEGER NOT NULL, title TEXT NOT NULL, duration_minutes INTEGER NOT NULL,
    preparation_minutes INTEGER NOT NULL, tab_limit INTEGER NOT NULL, starts_at INTEGER NOT NULL, closes_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS study_session_controls (
    session_id TEXT PRIMARY KEY, student_id TEXT NOT NULL REFERENCES users(id), chapter_id TEXT NOT NULL REFERENCES chapters(id),
    created_at INTEGER NOT NULL, tabs INTEGER NOT NULL DEFAULT 0,
    credited_ms INTEGER NOT NULL DEFAULT 0, days TEXT NOT NULL DEFAULT '{}', closed_reason TEXT
  );
  CREATE TABLE IF NOT EXISTS study_tab_events (
    session_id TEXT NOT NULL REFERENCES study_session_controls(session_id),event_id TEXT NOT NULL,
    PRIMARY KEY(session_id,event_id)
  );
  CREATE TABLE IF NOT EXISTS exam_activity (
    run_id TEXT PRIMARY KEY REFERENCES exam_runs(id), last_activity INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS chapter_hunt_requests (
    request_id TEXT PRIMARY KEY, chapter_id TEXT NOT NULL REFERENCES chapters(id),
    teacher_id TEXT NOT NULL REFERENCES users(id), fingerprint TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS study_controls_student_chapter ON study_session_controls(student_id,chapter_id,created_at DESC);`);
  // Existing exams receive one rollout grace period, never a fabricated
  // historical activity stream or another extension on each restart.
  db.prepare(
    `INSERT INTO exam_activity(run_id,last_activity) SELECT id,? FROM exam_runs WHERE status='active' ON CONFLICT(run_id) DO NOTHING`,
  ).run(Date.now());
}
export function sessionPolicy(
  db: DatabaseSync,
  classroomId: string,
): SessionPolicy {
  const row = db
    .prepare("SELECT policy FROM classroom_session_policy WHERE classroom_id=?")
    .get(classroomId);
  return row ? JSON.parse(String(row.policy)) : { ...DEFAULT_SESSION_POLICY };
}
export function chapterPolicy(
  db: DatabaseSync,
  chapterId: string,
): SessionPolicy {
  const ch = db
    .prepare("SELECT classroom_id FROM chapters WHERE id=?")
    .get(chapterId);
  return sessionPolicy(db, String(ch?.classroom_id ?? ""));
}
export function practiceAllowed(db: DatabaseSync, chapterId: string) {
  return (
    db
      .prepare("SELECT enabled FROM chapter_practice_access WHERE chapter_id=?")
      .get(chapterId)?.enabled !== 0
  );
}
export function requirePractice(db: DatabaseSync, chapterId: string) {
  if (!practiceAllowed(db, chapterId))
    throw new ClassManagementError("Giáo viên đã khóa luyện tập chương này.");
}
// Called inside the credit transaction, before a stop deletes the active cursor.
export function recordSessionCredit(
  db: DatabaseSync,
  studentId: string,
  chapterId: string,
  ms: number,
  days: Record<string, number>,
) {
  const c = db
    .prepare(
      `SELECT c.* FROM study_session_controls c JOIN study_sessions s ON s.id=c.session_id
    WHERE s.student_id=? AND s.chapter_id=? AND c.closed_reason IS NULL`,
    )
    .get(studentId, chapterId);
  if (!c) return;
  const sums: Record<string, number> = JSON.parse(String(c.days));
  for (const [day, value] of Object.entries(days))
    sums[day] = (sums[day] ?? 0) + value;
  db.prepare(
    "UPDATE study_session_controls SET credited_ms=credited_ms+?,days=? WHERE session_id=?",
  ).run(ms, JSON.stringify(sums), c.session_id);
}
export function terminateStudy(db: DatabaseSync, id: string, reason: string) {
  const c = db
    .prepare("SELECT * FROM study_session_controls WHERE session_id=?")
    .get(id);
  if (!c || c.closed_reason) {
    db.prepare("DELETE FROM study_sessions WHERE id=?").run(id);
    return;
  }
  db.exec("BEGIN IMMEDIATE");
  try {
    if (reason === "tabs" || reason === "idle") {
      db.prepare("DELETE FROM weekly_practice_credit WHERE session_id=?").run(id);
      db.prepare(
        "UPDATE progress SET seconds=MAX(0,seconds-?) WHERE student_id=? AND chapter_id=?",
      ).run(Number(c.credited_ms) / 1000, c.student_id, c.chapter_id);
      for (const [day, ms] of Object.entries(
        JSON.parse(String(c.days)) as Record<string, number>,
      ))
        db.prepare(
          "UPDATE study_daily_time SET credited_ms=MAX(0,credited_ms-?) WHERE student_id=? AND chapter_id=? AND day=?",
        ).run(ms, c.student_id, c.chapter_id, day);
    }
    db.prepare(
      "UPDATE study_session_controls SET closed_reason=? WHERE session_id=?",
    ).run(reason, id);
    db.prepare("DELETE FROM study_sessions WHERE id=?").run(id);
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
export function guardStudy(
  db: DatabaseSync,
  studentId: string,
  chapterId: string,
  now: number,
  id?: string,
) {
  requirePractice(db, chapterId);
  const s = db
    .prepare("SELECT * FROM study_sessions WHERE student_id=? AND chapter_id=?")
    .get(studentId, chapterId);
  if (id && s?.id !== id)
    throw new ClassManagementError(
      "Phiên luyện tập đã kết thúc. Hãy mở phiên mới.",
    );
  if (
    s &&
    now - Number(s.last_activity) >=
      chapterPolicy(db, chapterId).closeIdleSeconds * 1000
  ) {
    terminateStudy(db, String(s.id), "idle");
    throw new ClassManagementError(
      "Phiên đã đóng do không tương tác; thời gian phiên này không được ghi nhận.",
    );
  }
  if (
    !s &&
    db
      .prepare(
        `SELECT closed_reason FROM study_session_controls WHERE student_id=? AND chapter_id=? ORDER BY created_at DESC,rowid DESC LIMIT 1`,
      )
      .get(studentId, chapterId)?.closed_reason
  )
    throw new ClassManagementError(
      "Phiên đã đóng. Hãy mở phiên luyện tập mới.",
    );
}
export function expireStudySessions(db: DatabaseSync, now: number) {
  for (const s of db
    .prepare(
      `SELECT s.* FROM study_sessions s JOIN study_session_controls c ON c.session_id=s.id WHERE c.closed_reason IS NULL`,
    )
    .all()) {
    const control = db
      .prepare("SELECT tabs FROM study_session_controls WHERE session_id=?")
      .get(s.id)!;
    if (
      Number(control.tabs) >= chapterPolicy(db, String(s.chapter_id)).closeTabs
    )
      terminateStudy(db, String(s.id), "tabs");
    else if (
      now - Number(s.last_activity) >=
      chapterPolicy(db, String(s.chapter_id)).closeIdleSeconds * 1000
    )
      terminateStudy(db, String(s.id), "idle");
  }
}
