import type { DatabaseSync } from "node:sqlite";

export function ensureChapterArchiveSchema(db: DatabaseSync) {
  db.exec(`CREATE TABLE IF NOT EXISTS archived_chapters (
    chapter_id TEXT PRIMARY KEY REFERENCES chapters(id),
    archived_by TEXT NOT NULL REFERENCES users(id), archived_at INTEGER NOT NULL
  );`);
}

export function chapterIsArchived(db: DatabaseSync, chapterId: string) {
  return !!db
    .prepare("SELECT 1 FROM archived_chapters WHERE chapter_id=?")
    .get(chapterId);
}

// Caller verifies the owning teacher. Keep every referenced row and snapshot.
export function archiveChapter(
  db: DatabaseSync,
  chapterId: string,
  teacherId: string,
  now: number,
) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const inserted = db
      .prepare("INSERT OR IGNORE INTO archived_chapters VALUES(?,?,?)")
      .run(chapterId, teacherId, now);
    if (inserted.changes) {
      db.prepare(
        "UPDATE questions SET active=0 WHERE chapter_id=? AND active=1",
      ).run(chapterId);
      db.prepare(
        `INSERT INTO chapter_exam_access VALUES(?,0,?,?)
        ON CONFLICT(chapter_id) DO UPDATE SET enabled=0,updated_by=excluded.updated_by,updated_at=excluded.updated_at`,
      ).run(chapterId, teacherId, now);
    }
    db.exec("COMMIT");
    return { ok: true };
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
