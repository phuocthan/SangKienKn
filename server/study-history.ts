import type { DatabaseSync } from "node:sqlite";
import { recordWeeklyPractice } from "./weekly-practice.js";
import { recordSessionCredit } from "./class-management.js";
import {
  STUDY_DAY_MS,
  studyDate,
  studyDayStart,
  studyPeriodStart,
  shiftStudyPeriod,
  type StudyPeriod,
  type StudyBucket,
  type StudyStatistics,
  type ClassroomStudyStatistics,
  type StudyRangeReport,
} from "../shared/study-statistics.js";

// Read-only report. The end date includes the entire Vietnam calendar day.
export function studyRangeReport(
  db: DatabaseSync,
  classroomId: string,
  studentId: string | undefined,
  from: string,
  to: string,
): StudyRangeReport {
  const start = studyDayStart(from),
    end = studyDayStart(to) + STUDY_DAY_MS;
  const tracking = Number(
    db
      .prepare("SELECT started_at FROM study_history_tracking WHERE id=1")
      .get()!.started_at,
  );
  const coverage =
    end <= tracking ? "none" : start < tracking ? "partial" : "full";
  const students = db
    .prepare(
      `SELECT u.id,u.name FROM users u JOIN memberships m ON m.student_id=u.id
    WHERE m.classroom_id=? AND (? IS NULL OR u.id=?) ORDER BY u.name,u.id`,
    )
    .all(classroomId, studentId ?? null, studentId ?? null);
  return {
    from,
    to,
    coverage,
    members: students.map((u) => {
      const time = db
        .prepare(
          `SELECT COALESCE(SUM(h.credited_ms),0) AS ms FROM study_daily_time h JOIN chapters c ON c.id=h.chapter_id
      WHERE c.classroom_id=? AND h.student_id=? AND h.day>=? AND h.day<=?`,
        )
        .get(classroomId, u.id, from, to)!;
      const accuracy = db
        .prepare(
          `SELECT COUNT(*) AS attempts,COALESCE(SUM(a.correct),0) AS correct FROM attempts a JOIN questions q ON q.id=a.question_id
      JOIN chapters c ON c.id=q.chapter_id WHERE c.classroom_id=? AND a.student_id=? AND a.created_at>=? AND a.created_at<?`,
        )
        .get(classroomId, u.id, start, end)!;
      const rewards = db
        .prepare(
          `SELECT COALESCE(SUM(CASE WHEN status='approved' THEN points ELSE 0 END),0) AS approved,
      COALESCE(SUM(CASE WHEN status='pending' THEN points ELSE 0 END),0) AS pending FROM learning_rewards
      WHERE classroom_id=? AND student_id=? AND source LIKE 'exam:%' AND created_at>=? AND created_at<?`,
        )
        .get(classroomId, u.id, start, end)!;
      const onlineExams = db
        .prepare(
          `SELECT r.id,r.title,r.score,r.submitted_at FROM exam_runs r JOIN online_exam_sessions o ON o.exam_id=r.exam_id
      WHERE r.classroom_id=? AND r.student_id=? AND r.status='submitted' AND r.submitted_at>=? AND r.submitted_at<? ORDER BY r.submitted_at,r.id`,
        )
        .all(classroomId, u.id, start, end);
      return {
        id: String(u.id),
        name: String(u.name),
        seconds:
          coverage === "none" ? null : Math.floor(Number(time.ms) / 1000),
        attempts: Number(accuracy.attempts),
        correct: Number(accuracy.correct),
        huntPoints: Number(rewards.approved),
        pendingHuntPoints: Number(rewards.pending),
        onlineExams: onlineExams.map((r) => ({
          id: String(r.id),
          title: String(r.title),
          score: Number(r.score),
          submittedAt: Number(r.submitted_at),
        })),
      };
    }),
  };
}

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

export function classroomStudyStatistics(
  db: DatabaseSync,
  classroomId: string,
  period: StudyPeriod,
  date: string,
): ClassroomStudyStatistics {
  const members = db
    .prepare(
      `SELECT u.id,u.name FROM memberships m
    JOIN users u ON u.id=m.student_id WHERE m.classroom_id=? ORDER BY u.name,u.id`,
    )
    .all(classroomId)
    .map((row) => ({
      id: String(row.id),
      name: String(row.name),
      statistics: studentStudyStatistics(
        db,
        classroomId,
        String(row.id),
        period,
        date,
      ),
    }));
  // All members share the same calendar and tracking start. Even an empty
  // class must distinguish a period before tracking from a confirmed zero.
  const template =
    members[0]?.statistics ??
    studentStudyStatistics(db, classroomId, "", period, date);
  const totalBucket = (
    bucket: StudyBucket,
    pick: (s: StudyStatistics) => StudyBucket,
  ): StudyBucket => ({
    ...bucket,
    seconds:
      bucket.seconds === null
        ? null
        : members.reduce(
            (sum, m) => sum + (pick(m.statistics).seconds ?? 0),
            0,
          ),
  });
  return {
    ...template,
    lifetimeSeconds: members.reduce(
      (sum, m) => sum + m.statistics.lifetimeSeconds,
      0,
    ),
    summaries: {
      day: totalBucket(template.summaries.day, (s) => s.summaries.day),
      week: totalBucket(template.summaries.week, (s) => s.summaries.week),
      month: totalBucket(template.summaries.month, (s) => s.summaries.month),
    },
    buckets: template.buckets.map((bucket, index) =>
      totalBucket(bucket, (s) => s.buckets[index]),
    ),
    members,
  };
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
    const creditedDays: Record<string, number> = {};
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
      creditedDays[day] = (creditedDays[day] ?? 0) + Math.round(next - cursor);
      cursor = next;
    }
    recordSessionCredit(db, studentId, chapterId, creditedMs, creditedDays);
    recordWeeklyPractice(db, studentId, chapterId, start, end);
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
