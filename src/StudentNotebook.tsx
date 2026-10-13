import { useEffect, useState } from "react";
import { api, errorMessage } from "./api";
import { Empty, Modal } from "./components";
import { AnswerFields } from "./AnswerFields";
import {
  questionKind,
  type AnswerQuestion,
  type QuestionAnswer,
} from "../shared/question-types";
import "./answer-fields.css";
import type { Classroom, Question, Student } from "./types";
type Item = Question & {
  chapterTitle: string;
  resolved: boolean;
  updatedAt: number;
  attempts: number;
  wrongAnswers: {
    selected: QuestionAnswer;
    at: number;
    source: string;
    question: AnswerQuestion;
  }[];
};
function wrongAnswerText(question: AnswerQuestion, selected: QuestionAnswer) {
  const kind = questionKind(question);
  if (kind === "short-answer") return String(selected);
  if (kind === "true-false")
    return question.choices
      .map(
        (statement, index) =>
          `${"abcd"[index]}. ${statement}: ${String(selected)[index] === "1" ? "Đúng" : "Sai"}`,
      )
      .join("; ");
  const index = Number(selected);
  return `${"ABCD"[index] ?? "?"}. ${question.choices[index] ?? ""}`;
}
export function StudentNotebook({
  classroom,
  student,
  onClose,
}: {
  classroom: Classroom;
  student: Student;
  onClose: () => void;
}) {
  const [items, setItems] = useState<Item[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("open"),
    [chapter, setChapter] = useState("");
  useEffect(() => {
    let alive = true;
    api<Item[]>(`/classrooms/${classroom.id}/students/${student.id}/notebook`)
      .then((rows) => {
        if (alive) setItems(rows);
      })
      .catch((e) => {
        if (alive) setError(errorMessage(e));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [classroom.id, student.id]);
  const visible = items.filter(
    (q) =>
      (!chapter || q.chapterId === chapter) &&
      (filter === "all" || q.resolved === (filter === "resolved")),
  );
  return (
    <Modal title={`Sổ tay · ${student.name}`} onClose={onClose}>
      <div className="workspace-filters">
        <select
          aria-label="Trạng thái sửa sai"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="open">Cần sửa</option>
          <option value="resolved">Đã khắc phục</option>
          <option value="all">Tất cả</option>
        </select>
        <select
          aria-label="Chương trong sổ tay"
          value={chapter}
          onChange={(e) => setChapter(e.target.value)}
        >
          <option value="">Tất cả chương</option>
          {classroom.chapters.map((ch) => (
            <option key={ch.id} value={ch.id}>
              {ch.title}
            </option>
          ))}
        </select>
      </div>
      {error ? (
        <p role="alert">{error}</p>
      ) : loading ? (
        <p role="status">Đang tải sổ tay…</p>
      ) : !visible.length ? (
        <Empty title="Không có câu hỏi" text="" />
      ) : (
        visible.map((q) => (
          <article className="card question-card" key={q.id}>
            <span className="eyebrow">
              {q.chapterTitle} · {q.resolved ? "Đã khắc phục" : "Cần sửa"}
            </span>
            <h3>{q.text}</h3>
            {!!q.wrongAnswers?.length && (
              <div className="notebook-wrong-history">
                <strong>Câu trả lời sai trước đó</strong>
                <ul>
                  {q.wrongAnswers.map((entry, index) => (
                    <li key={`${entry.at}-${index}`}>
                      <small>
                        {entry.source} ·{" "}
                        {new Date(entry.at).toLocaleString("vi-VN")}
                      </small>
                      <span>
                        {wrongAnswerText(entry.question, entry.selected)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <AnswerFields
              question={q}
              value={
                questionKind(q) === "multiple-choice"
                  ? q.correctIndex
                  : q.correctAnswer
              }
              result={{
                correct: true,
                correctIndex: q.correctIndex,
                correctAnswer: q.correctAnswer,
              }}
              disabled
              onChange={() => {}}
            />
            <p>{q.explanation}</p>
          </article>
        ))
      )}
    </Modal>
  );
}
