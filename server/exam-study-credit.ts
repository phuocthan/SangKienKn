import type { DatabaseSync } from "node:sqlite";
import {
  STUDY_DAY_MS,
  studyDate,
  studyDayStart,
} from "../shared/study-statistics.js";
import { sessionPolicy } from "./class-management.js";

// Called inside the same transaction that submits the run. The receipt survives
// deletion of an exam so credited history cannot be silently credited again.
export function creditExamTime(
  db: DatabaseSync,
  run: Record<string, any>,
  reason: string,
  timestamp: number,
) {
  if (
    !["official", "hunt"].includes(run.kind) ||
    !["student", "teacher", "deadline"].includes(reason)
  )
    return;
  const target =
    run.kind === "hunt"
      ? db
          .prepare(
            "SELECT id AS chapterId FROM chapters WHERE id=? AND classroom_id=?",
          )
          .get(run.chapter_id, run.classroom_id)
      : db
          .prepare(
            `SELECT o.progress_chapter_id AS chapterId FROM online_exam_sessions o
    JOIN chapters ch ON ch.id=o.progress_chapter_id WHERE o.exam_id=? AND ch.classroom_id=?`,
          )
          .get(run.exam_id, run.classroom_id);
  if (!target?.chapterId) return;
  const last = Number(
    db
      .prepare("SELECT last_activity FROM exam_activity WHERE run_id=?")
      .get(run.id)?.last_activity ?? run.started_at,
  );
  const end = Math.min(timestamp, Number(run.deadline_at));
  const policy = sessionPolicy(db, String(run.classroom_id));
  const tabs = Number(
    db
      .prepare("SELECT COUNT(*) n FROM exam_tab_events WHERE run_id=?")
      .get(run.id)!.n,
  );
  if (
    end - last >= policy.closeIdleSeconds * 1000 ||
    tabs >= Math.min(policy.closeTabs, Number(run.tab_limit))
  )
    return;
  const start = Number(run.started_at),
    ms = Math.max(0, end - start);
  if (!ms) return;
  const inserted = db
    .prepare(
      "INSERT OR IGNORE INTO exam_study_credit(run_id,student_id,chapter_id,credited_ms) VALUES(?,?,?,?)",
    )
    .run(run.id, run.student_id, target.chapterId, ms);
  if (!inserted.changes) return;
  db.prepare(
    "INSERT INTO progress VALUES(?,?,?) ON CONFLICT(student_id,chapter_id) DO UPDATE SET seconds=seconds+excluded.seconds",
  ).run(run.student_id, target.chapterId, ms / 1000);
  for (let cursor = start; cursor < end;) {
    const day = studyDate(cursor),
      next = Math.min(end, studyDayStart(day) + STUDY_DAY_MS);
    db.prepare(
      "INSERT INTO study_daily_time VALUES(?,?,?,?) ON CONFLICT(student_id,chapter_id,day) DO UPDATE SET credited_ms=credited_ms+excluded.credited_ms",
    ).run(run.student_id, target.chapterId, day, next - cursor);
    cursor = next;
  }
}
