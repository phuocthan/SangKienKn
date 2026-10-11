import type { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";

export function ensureLessonSchema(db: DatabaseSync) {
  db.exec(`CREATE TABLE IF NOT EXISTS lessons (
    id TEXT PRIMARY KEY, chapter_id TEXT NOT NULL REFERENCES chapters(id),
    title TEXT NOT NULL, sort_order INTEGER NOT NULL,
    kind TEXT NOT NULL DEFAULT 'lesson' CHECK(kind IN ('lesson','supplemental')),
    number INTEGER, UNIQUE(chapter_id,title)
  );
  CREATE INDEX IF NOT EXISTS lessons_chapter_order ON lessons(chapter_id,sort_order);`);
  db.exec(`CREATE TABLE IF NOT EXISTS archived_lessons (
    chapter_id TEXT NOT NULL REFERENCES chapters(id), title TEXT NOT NULL,
    archived_by TEXT NOT NULL REFERENCES users(id), archived_at INTEGER NOT NULL,
    PRIMARY KEY(chapter_id,title)
  );`);
}

// Keep legacy question titles visible without changing questions or their history.
export function chapterLessons(db: DatabaseSync, chapterId: string) {
  return db
    .prepare(
      `WITH names AS (
    SELECT title,sort_order,kind,number,0 AS source FROM lessons WHERE chapter_id=?
      AND title NOT IN (SELECT title FROM archived_lessons WHERE chapter_id=lessons.chapter_id)
    UNION ALL
    SELECT lesson AS title,MIN(rowid) AS sort_order,'lesson' AS kind,NULL AS number,1 AS source
    FROM questions WHERE chapter_id=? AND active=1 AND is_current=1
      AND lesson NOT IN (SELECT title FROM lessons WHERE chapter_id=?)
      AND lesson NOT IN (SELECT title FROM archived_lessons WHERE chapter_id=questions.chapter_id)
    GROUP BY lesson
  ) SELECT title,
    (SELECT COUNT(*) FROM questions q WHERE q.chapter_id=? AND q.lesson=names.title
      AND q.active=1 AND q.is_current=1) AS questionCount
  FROM names ORDER BY source,sort_order,title`,
    )
    .all(chapterId, chapterId, chapterId, chapterId);
}

export type CurriculumChapter = {
  title: string;
  lessons: {
    title: string;
    kind?: "lesson" | "supplemental";
    number?: number | null;
  }[];
};
const canonical = (value: string) =>
  value.normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase("vi");

export class LessonError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function lessonIsArchived(
  db: DatabaseSync,
  chapterId: string,
  title: string,
) {
  return db
    .prepare("SELECT title FROM archived_lessons WHERE chapter_id=?")
    .all(chapterId)
    .some((row) => canonical(String(row.title)) === canonical(title));
}
function lessonNames(db: DatabaseSync, chapterId: string) {
  return db
    .prepare(
      `SELECT title FROM lessons WHERE chapter_id=?
    UNION SELECT lesson AS title FROM questions WHERE chapter_id=?`,
    )
    .all(chapterId, chapterId);
}
export function addLesson(db: DatabaseSync, chapterId: string, title: string) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const found = lessonNames(db, chapterId).filter(
      (row) => canonical(String(row.title)) === canonical(title),
    );
    if (
      found.some((row) => !lessonIsArchived(db, chapterId, String(row.title)))
    )
      throw new LessonError(409, "Chương này đã có bài cùng tên.");
    const storedTitle = String(
      found[0]?.title ?? title.normalize("NFC").trim().replace(/\s+/g, " "),
    );
    const existing = db
      .prepare("SELECT id FROM lessons WHERE chapter_id=? AND title=?")
      .get(chapterId, storedTitle);
    const id = String(existing?.id ?? randomUUID());
    if (!existing)
      db.prepare(
        `INSERT INTO lessons(id,chapter_id,title,sort_order)
      VALUES(?,?,?,(SELECT COALESCE(MAX(sort_order),-1)+1 FROM lessons WHERE chapter_id=?))`,
      ).run(id, chapterId, storedTitle, chapterId);
    for (const row of db
      .prepare("SELECT title FROM archived_lessons WHERE chapter_id=?")
      .all(chapterId))
      if (canonical(String(row.title)) === canonical(title))
        db.prepare(
          "DELETE FROM archived_lessons WHERE chapter_id=? AND title=?",
        ).run(chapterId, row.title);
    db.exec("COMMIT");
    return { id, title: storedTitle };
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
export function archiveLesson(
  db: DatabaseSync,
  chapterId: string,
  title: string,
  teacherId: string,
  now: number,
) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const found = lessonNames(db, chapterId).filter(
      (row) => canonical(String(row.title)) === canonical(title),
    );
    if (!found.length) throw new LessonError(404, "Không tìm thấy bài.");
    let hiddenQuestions = 0;
    for (const row of found) {
      db.prepare("INSERT OR IGNORE INTO archived_lessons VALUES(?,?,?,?)").run(
        chapterId,
        row.title,
        teacherId,
        now,
      );
      hiddenQuestions += Number(
        db
          .prepare(
            "UPDATE questions SET active=0 WHERE chapter_id=? AND lesson=? AND is_current=1 AND active=1",
          )
          .run(chapterId, row.title).changes,
      );
    }
    db.exec("COMMIT");
    return { ok: true, hiddenQuestions };
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

// Caller selects/authorizes the classroom. Atomic, repeatable; never creates questions.
export function importCurriculum(
  db: DatabaseSync,
  classroomId: string,
  chapters: CurriculumChapter[],
) {
  const validateTitle = (value: unknown) => {
    if (typeof value !== "string" || !value.trim() || value.trim().length > 120)
      throw new Error("Tên chương/bài không hợp lệ (1–120 ký tự).");
    return value.trim().normalize("NFC");
  };
  if (!Array.isArray(chapters) || !chapters.length || chapters.length > 50)
    throw new Error("Danh mục chương không hợp lệ.");
  const input = chapters.map((ch) => ({
    title: validateTitle(ch.title),
    lessons: ch.lessons.map((l) => {
      if (l.kind !== undefined && !["lesson", "supplemental"].includes(l.kind))
        throw new Error("Loại bài không hợp lệ.");
      if (l.number != null && (!Number.isSafeInteger(l.number) || l.number < 1))
        throw new Error("Số bài không hợp lệ.");
      return {
        title: validateTitle(l.title),
        kind: l.kind ?? "lesson",
        number: l.number ?? null,
      };
    }),
  }));
  if (
    new Set(input.map((ch) => canonical(ch.title))).size !== input.length ||
    input.some(
      (ch) =>
        !ch.lessons.length ||
        ch.lessons.length > 100 ||
        new Set(ch.lessons.map((l) => canonical(l.title))).size !==
          ch.lessons.length,
    )
  )
    throw new Error("Danh mục rỗng, quá dài hoặc trùng chương/bài.");
  db.exec("BEGIN IMMEDIATE");
  try {
    if (!db.prepare("SELECT id FROM classrooms WHERE id=?").get(classroomId))
      throw new Error("Không tìm thấy lớp học.");
    let createdChapters = 0,
      createdLessons = 0;
    for (const chapter of input) {
      const matches = db
        .prepare("SELECT id,title FROM chapters WHERE classroom_id=?")
        .all(classroomId)
        .filter(
          (ch) => canonical(String(ch.title)) === canonical(chapter.title),
        );
      if (matches.length > 1)
        throw new Error(
          "Lớp đang có chương trùng tên; cần xử lý trước khi nhập.",
        );
      const chapterId = String(matches[0]?.id ?? randomUUID());
      if (!matches.length) {
        db.prepare(
          "INSERT INTO chapters (id,classroom_id,title) VALUES (?,?,?)",
        ).run(chapterId, classroomId, chapter.title);
        createdChapters++;
      }
      for (const [order, lesson] of chapter.lessons.entries()) {
        const found = db
          .prepare(
            "SELECT id,title,kind,number FROM lessons WHERE chapter_id=?",
          )
          .all(chapterId)
          .filter(
            (l) => canonical(String(l.title)) === canonical(lesson.title),
          );
        if (
          found.length > 1 ||
          (found[0] &&
            (found[0].kind !== lesson.kind ||
              found[0].number !== lesson.number))
        )
          throw new Error(
            "Bài đã có thông tin khác danh mục; không tự ghi đè.",
          );
        if (!found.length) {
          db.prepare(
            "INSERT INTO lessons (id,chapter_id,title,sort_order,kind,number) VALUES (?,?,?,?,?,?)",
          ).run(
            randomUUID(),
            chapterId,
            lesson.title,
            order,
            lesson.kind,
            lesson.number,
          );
          createdLessons++;
        }
      }
    }
    db.exec("COMMIT");
    return {
      createdChapters,
      createdLessons,
      requestedChapters: input.length,
      requestedLessons: input.reduce((n, ch) => n + ch.lessons.length, 0),
    };
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
