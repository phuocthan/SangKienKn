import type { DatabaseSync } from "node:sqlite";
import {
  STUDY_DAY_MS,
  studyDate,
  studyDayStart,
  studyPeriodStart,
  shiftStudyPeriod,
  type StudyPeriod,
  type StudyBucket,
  type StudyStatistics,
} from "../shared/study-statistics.js";

export function ensureStudyHistorySchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS study_history_tracking (
      id INTEGER PRIMARY KEY CHECK(id=1), started_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS study_daily_time (
      student_id TEXT NOT NULL REFERENCES users(id),
      chapter_id TEXT NOT NULL REFERENCES chapters(id),
      day TEXT NOT NULL,
      credited_ms INTEGER NOT NULL CHECK(credited_ms>=0),
      PRIMARY KEY(student_id,chapter_id,day)
    );
    CREATE INDEX IF NOT EXISTS study_daily_time_student_day ON study_daily_time(student_id,day);
  `);
}

export function startStudyHistory(db: DatabaseSync, timestamp: number) {
  db.prepare(
    "INSERT INTO study_history_tracking VALUES(1,?) ON CONFLICT(id) DO NOTHING",
  ).run(timestamp);
}

// Commit the confirmed interval and session cursor together. Failed writes
// cannot advance a session or leave its lifetime and calendar totals apart.
export function creditStudyInterval(
  db: DatabaseSync,
  studentId: string,
  chapterId: string,
  start: number,
  end: number,
  finishSession: () => void,
) {
  const creditedMs = Math.max(0, Math.round(end - start));
  const trackingStartedAt = Number(
    db
      .prepare("SELECT started_at FROM study_history_tracking WHERE id=1")
      .get()!.started_at,
  );
  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare(
      "INSERT INTO progress VALUES (?,?,?) ON CONFLICT(student_id,chapter_id) DO UPDATE SET seconds=seconds+excluded.seconds",
    ).run(studentId, chapterId, creditedMs / 1000);
    // A session may survive deployment. Preserve its lifetime credit, while
    // calendar history begins at the actual rollout of this feature.
    for (let cursor = Math.max(start, trackingStartedAt); cursor < end;) {
      const day = studyDate(cursor);
      const next = Math.min(end, studyDayStart(day) + STUDY_DAY_MS);
      db.prepare(
        `INSERT INTO study_daily_time VALUES(?,?,?,?)
        ON CONFLICT(student_id,chapter_id,day) DO UPDATE SET credited_ms=credited_ms+excluded.credited_ms`,
      ).run(studentId, chapterId, day, Math.round(next - cursor));
      cursor = next;
    }
    finishSession();
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function studentStudyStatistics(
  db: DatabaseSync,
  classroomId: string,
  studentId: string,
  period: StudyPeriod,
  date: string,
): StudyStatistics {
  const trackingStartedAt = Number(
    db
      .prepare("SELECT started_at FROM study_history_tracking WHERE id=1")
      .get()!.started_at,
  );
  const count = period === "day" ? 14 : period === "week" ? 8 : 12;
  const latestStart = studyPeriodStart(date, period);
  const oldestStart = shiftStudyPeriod(latestStart, period, 1 - count);
  const firstDay = [
    oldestStart,
    studyPeriodStart(date, "week"),
    studyPeriodStart(date, "month"),
  ].sort()[0];
  const lastDay = [
    shiftStudyPeriod(latestStart, period, 1),
    shiftStudyPeriod(studyPeriodStart(date, "week"), "week", 1),
    shiftStudyPeriod(studyPeriodStart(date, "month"), "month", 1),
  ]
    .sort()
    .at(-1)!;
  const daily = db
    .prepare(
      `SELECT h.day,SUM(h.credited_ms) AS ms FROM study_daily_time h
    JOIN chapters c ON c.id=h.chapter_id
    WHERE h.student_id=? AND c.classroom_id=? AND h.day>=? AND h.day<? GROUP BY h.day`,
    )
    .all(studentId, classroomId, firstDay, lastDay);
  const bucket = (start: string, bucketPeriod: StudyPeriod): StudyBucket => {
    const next = shiftStudyPeriod(start, bucketPeriod, 1);
    const coverage =
      studyDayStart(next) <= trackingStartedAt
        ? "none"
        : studyDayStart(start) < trackingStartedAt
          ? "partial"
          : "full";
    return {
      start,
      end: studyDate(studyDayStart(next) - STUDY_DAY_MS),
      coverage,
      seconds:
        coverage === "none"
          ? null
          : Math.floor(
              daily
                .filter(
                  (row) => String(row.day) >= start && String(row.day) < next,
                )
                .reduce((sum, row) => sum + Number(row.ms), 0) / 1000,
            ),
    };
  };
  return {
    date,
    period,
    trackingStartedAt,
    lifetimeSeconds: Number(
      db
        .prepare(
          `SELECT COALESCE(SUM(CAST(p.seconds AS INTEGER)),0) AS seconds FROM progress p
      JOIN chapters c ON c.id=p.chapter_id WHERE p.student_id=? AND c.classroom_id=?`,
        )
        .get(studentId, classroomId)!.seconds,
    ),
    summaries: {
      day: bucket(date, "day"),
      week: bucket(studyPeriodStart(date, "week"), "week"),
      month: bucket(studyPeriodStart(date, "month"), "month"),
    },
    buckets: Array.from({ length: count }, (_, index) =>
      bucket(shiftStudyPeriod(oldestStart, period, index), period),
    ),
  };
}
