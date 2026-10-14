import type { DatabaseSync } from "node:sqlite";

// Keep the existing three-column chapters table and all historical IDs intact.
export function ensureChapterOrderSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS chapter_display_order (
      chapter_id TEXT PRIMARY KEY REFERENCES chapters(id),
      position INTEGER NOT NULL CHECK(position >= 1)
    );
    WITH missing AS (
      SELECT ch.id,
        ROW_NUMBER() OVER (PARTITION BY ch.classroom_id ORDER BY ch.rowid) +
        COALESCE((SELECT MAX(o.position) FROM chapter_display_order o
          JOIN chapters existing ON existing.id=o.chapter_id
          WHERE existing.classroom_id=ch.classroom_id),0) AS position
      FROM chapters ch
      WHERE ch.id NOT IN (SELECT chapter_id FROM chapter_display_order)
    )
    INSERT INTO chapter_display_order SELECT id,position FROM missing;
    CREATE TRIGGER IF NOT EXISTS chapter_append_display_order
    AFTER INSERT ON chapters BEGIN
      INSERT INTO chapter_display_order(chapter_id,position)
      SELECT NEW.id,COALESCE(MAX(o.position),0)+1
      FROM chapter_display_order o JOIN chapters ch ON ch.id=o.chapter_id
      WHERE ch.classroom_id=NEW.classroom_id;
    END;
  `);
}

export function activeChapterIds(db: DatabaseSync, classroomId: string) {
  return db
    .prepare(
      `SELECT ch.id FROM chapters ch
    JOIN chapter_display_order o ON o.chapter_id=ch.id
    WHERE ch.classroom_id=? AND ch.id NOT IN (SELECT chapter_id FROM archived_chapters)
    ORDER BY o.position,ch.rowid`,
    )
    .all(classroomId)
    .map((ch) => String(ch.id));
}
