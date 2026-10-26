import type { DatabaseSync } from "node:sqlite";
import type { QuestionInput } from "../shared/questions.js";

// Called inside the question-version transaction. Existing sessions/runs and
// attempts stay immutable; reusable sources and papers not yet started follow
// the same question family. No content-based guesses across unrelated copies.
export function updateQuestionSources(
  db: DatabaseSync,
  chapterId: string,
  familyId: string,
  id: string,
  content: QuestionInput,
  now: number,
) {
  const chapter = db
    .prepare("SELECT classroom_id,title FROM chapters WHERE id=?")
    .get(chapterId)!;
  const ids = new Set(
    db
      .prepare("SELECT id FROM questions WHERE COALESCE(family_id,id)=?")
      .all(familyId)
      .map((row) => String(row.id)),
  );
  const replace = (raw: unknown) => {
    let changed = false;
    const questions = JSON.parse(String(raw)).map(
      (question: { id: string }) => {
        if (!ids.has(question.id)) return question;
        changed = true;
        return {
          ...question,
          ...content,
          id,
          chapterId,
          chapterTitle: chapter.title,
        };
      },
    );
    return changed ? JSON.stringify(questions) : null;
  };
  for (const row of db
    .prepare(
      "SELECT slot,questions FROM chapter_hunt_papers WHERE chapter_id=?",
    )
    .all(chapterId)) {
    const updated = replace(row.questions);
    if (updated)
      db.prepare(
        "UPDATE chapter_hunt_papers SET questions=? WHERE chapter_id=? AND slot=?",
      ).run(updated, chapterId, row.slot);
  }
  const hunt = db
    .prepare("SELECT questions FROM chapter_hunt_settings WHERE chapter_id=?")
    .get(chapterId);
  if (hunt) {
    const updated = replace(hunt.questions);
    if (updated)
      db.prepare(
        "UPDATE chapter_hunt_settings SET questions=? WHERE chapter_id=?",
      ).run(updated, chapterId);
  }
  for (const row of db
    .prepare(
      `SELECT p.blueprint_id,p.questions FROM review_papers p JOIN review_blueprints b ON b.id=p.blueprint_id WHERE b.classroom_id=?`,
    )
    .all(chapter.classroom_id)) {
    const updated = replace(row.questions);
    if (updated)
      db.prepare(
        "UPDATE review_papers SET questions=? WHERE blueprint_id=?",
      ).run(updated, row.blueprint_id);
  }
  for (const row of db
    .prepare(
      `SELECT e.id,e.questions FROM exam_definitions e LEFT JOIN online_exam_sessions o ON o.exam_id=e.id
    WHERE e.classroom_id=? AND NOT EXISTS(SELECT 1 FROM exam_runs r WHERE r.exam_id=e.id)
    AND ((o.exam_id IS NOT NULL AND o.started_at IS NULL) OR e.starts_at>?)`,
    )
    .all(chapter.classroom_id, now)) {
    const updated = replace(row.questions);
    if (updated)
      db.prepare("UPDATE exam_definitions SET questions=? WHERE id=?").run(
        updated,
        row.id,
      );
  }
}
