import type { DatabaseSync } from "node:sqlite";
import { createHash } from "node:crypto";

type Content = { text: string; choices: string[]; kind?: string };
// IDs, order, labels and explanations cannot turn the same paper into a new one.
export function huntPaperFingerprint(questions: Content[]) {
  const normalize = (text: string) =>
    text.normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase("vi");
  return createHash("sha256")
    .update(
      JSON.stringify(
        questions
          .map((q) =>
            JSON.stringify([
              q.kind ?? "multiple-choice",
              normalize(q.text),
              q.choices.map(normalize).sort(),
            ]),
          )
          .sort(),
      ),
    )
    .digest("hex");
}

export function huntPapers(db: DatabaseSync, chapterId: string) {
  return db
    .prepare(
      "SELECT * FROM chapter_hunt_papers WHERE chapter_id=? ORDER BY slot",
    )
    .all(chapterId);
}

export function nextHuntPaper(
  db: DatabaseSync,
  chapterId: string,
  studentId: string,
) {
  const ticket = db
    .prepare(
      "SELECT level FROM learning_tickets WHERE chapter_id=? AND student_id=? AND used_by IS NULL ORDER BY level LIMIT 1",
    )
    .get(chapterId, studentId);
  const slot = ticket ? Number(ticket.level) - 2 : 1;
  const paper = db
    .prepare("SELECT * FROM chapter_hunt_papers WHERE chapter_id=? AND slot=?")
    .get(chapterId, slot);
  return { slot, paper };
}

export function hasUsedHuntPaper(
  db: DatabaseSync,
  chapterId: string,
  studentId: string,
  questions: Content[],
) {
  const fingerprint = huntPaperFingerprint(questions);
  return db
    .prepare(
      "SELECT questions FROM exam_runs WHERE chapter_id=? AND student_id=? AND kind='hunt'",
    )
    .all(chapterId, studentId)
    .some(
      (run) =>
        huntPaperFingerprint(JSON.parse(String(run.questions))) === fingerprint,
    );
}
