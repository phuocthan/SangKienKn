import type { DatabaseSync } from "node:sqlite";
import { DEFAULT_LEVEL_MINUTES } from "../shared/student-levels.js";

export function ensureLevelSettingsSchema(db: DatabaseSync) {
  db.exec(`CREATE TABLE IF NOT EXISTS classroom_level_settings (
    classroom_id TEXT PRIMARY KEY REFERENCES classrooms(id),
    minutes INTEGER NOT NULL DEFAULT 60 CHECK(typeof(minutes)='integer' AND minutes BETWEEN 1 AND 1440),
    updated_by TEXT NOT NULL REFERENCES users(id),
    updated_at INTEGER NOT NULL
  )`);
}

export function classroomLevelMinutes(
  db: DatabaseSync,
  classroomId: string,
): number {
  return Number(
    db
      .prepare(
        "SELECT minutes FROM classroom_level_settings WHERE classroom_id=?",
      )
      .get(classroomId)?.minutes ?? DEFAULT_LEVEL_MINUTES,
  );
}

export function chapterLevelMinutes(
  db: DatabaseSync,
  chapterId: string,
): number {
  return Number(
    db
      .prepare(
        `SELECT s.minutes FROM chapters ch LEFT JOIN classroom_level_settings s ON s.classroom_id=ch.classroom_id WHERE ch.id=?`,
      )
      .get(chapterId)?.minutes ?? DEFAULT_LEVEL_MINUTES,
  );
}
