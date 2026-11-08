import type { DatabaseSync } from "node:sqlite";
import type { LearningReward } from "../shared/learning.js";
import { classroomLevelMinutes } from "./level-settings.js";
import { studentLevel } from "../shared/student-levels.js";

export function huntMinimumScore(db: DatabaseSync, classroomId: string) {
  return Number(
    db
      .prepare(
        "SELECT hunt_minimum_score FROM classroom_reward_settings WHERE classroom_id=?",
      )
      .get(classroomId)?.hunt_minimum_score ?? 8,
  );
}

export function treeRewardCandidates(
  db: DatabaseSync,
  classroomId: string,
  timestamp: number,
  studentId?: string,
): (LearningReward & {
  studentId: string;
  classroomId: string;
  chapterId: string;
})[] {
  const minutes = classroomLevelMinutes(db, classroomId);
  return db
    .prepare(
      `SELECT p.student_id,p.chapter_id,p.seconds,u.name FROM progress p
       JOIN chapters c ON c.id=p.chapter_id
       JOIN memberships m ON m.classroom_id=c.classroom_id AND m.student_id=p.student_id
       JOIN users u ON u.id=p.student_id AND u.role='student'
       WHERE c.classroom_id=? AND (? IS NULL OR p.student_id=?)`,
    )
    .all(classroomId, studentId ?? null, studentId ?? null)
    .filter((row) => studentLevel(Number(row.seconds), minutes).level === 5)
    .map((row) => ({
      id: `tree:${row.student_id}:${row.chapter_id}`,
      studentId: String(row.student_id),
      classroomId,
      chapterId: String(row.chapter_id),
      studentName: String(row.name),
      label:
        minutes === 60 ? "Chăm cây đủ 4 giờ" : "Chăm cây đạt Kết Trái · Cấp 5",
      points: 1,
      status: "pending" as const,
      createdAt: timestamp,
      sourceType: "tree" as const,
    }));
}

// Read-only proposals. No points are recorded until the owning teacher reviews
// a candidate; a finished exam's full ranking is calculated before student filtering.
export function onlineRewardCandidates(
  db: DatabaseSync,
  classroomId: string,
  timestamp: number,
): (LearningReward & { studentId: string; classroomId: string })[] {
  const ranked = db
    .prepare(
      `SELECT r.id,r.student_id,r.exam_id,r.score,r.submitted_at,u.name studentName,e.title examTitle,
    MAX(0,MIN(r.submitted_at,r.deadline_at)-r.started_at) elapsedMs,
    ROW_NUMBER() OVER(PARTITION BY r.exam_id ORDER BY r.score DESC,
      MAX(0,MIN(r.submitted_at,r.deadline_at)-r.started_at),r.submitted_at,r.id) rank
    FROM exam_runs r JOIN exam_definitions e ON e.id=r.exam_id
    JOIN online_exam_sessions o ON o.exam_id=e.id JOIN users u ON u.id=r.student_id
    WHERE r.classroom_id=? AND r.status='submitted' AND o.started_at IS NOT NULL
      AND (e.enabled=0 OR e.closes_at<=?) AND r.reason IN ('student','teacher','deadline','tabs')
      AND r.score>=8`,
    )
    .all(classroomId, timestamp);
  return ranked
    .filter((r) => Number(r.rank) <= 10)
    .map((r) => ({
      id: `online:${r.id}`,
      studentId: String(r.student_id),
      classroomId,
      studentName: String(r.studentName),
      label: `Top 10 online · ${r.examTitle}`,
      points: 1,
      status: "pending",
      createdAt: Number(r.submitted_at),
      sourceType: "online",
      examId: String(r.exam_id),
      rank: Number(r.rank),
      score: Number(r.score),
      elapsedMs: Number(r.elapsedMs),
    }));
}

export function learningRewards(
  db: DatabaseSync,
  classroomId: string,
  timestamp: number,
  studentId?: string,
): LearningReward[] {
  const candidates = [
    ...onlineRewardCandidates(db, classroomId, timestamp),
    ...treeRewardCandidates(db, classroomId, timestamp, studentId),
  ];
  const saved = db
    .prepare(
      `SELECT r.*,u.name studentName FROM learning_rewards r JOIN users u ON u.id=r.student_id
    WHERE r.classroom_id=? AND (? IS NULL OR r.student_id=?) ORDER BY r.created_at DESC`,
    )
    .all(classroomId, studentId ?? null, studentId ?? null);
  const proposed = new Map(
    candidates
      .filter((r) => !studentId || r.studentId === studentId)
      .map((r) => [r.id, r]),
  );
  const result: LearningReward[] = saved.map((r) => {
    const candidate = proposed.get(String(r.source));
    proposed.delete(String(r.source));
    return {
      ...candidate,
      id: String(r.id),
      studentName: String(r.studentName),
      label: candidate?.label ?? String(r.label),
      points: Number(r.points),
      status: r.status as LearningReward["status"],
      createdAt: Number(r.created_at),
      sourceType: String(r.source).startsWith("online:")
        ? "online"
        : String(r.source).startsWith("exam:")
          ? "hunt"
          : "tree",
    };
  });
  return [...result, ...proposed.values()].sort((a, b) =>
    a.examId && a.examId === b.examId
      ? (a.rank ?? 99) - (b.rank ?? 99)
      : b.createdAt - a.createdAt,
  );
}
