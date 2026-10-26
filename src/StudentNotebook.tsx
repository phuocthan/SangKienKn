import { useEffect, useState } from "react";
import { api, ensureQuestionTypes, errorMessage } from "./api";
import { Empty, Modal } from "./components";
import { AnswerFields } from "./AnswerFields";
import { QuestionFields, readQuestionForm } from "./QuestionFields";
import { QuestionText } from "./QuestionText";
import { Pencil } from "./icons";
import {
  questionKind,
  type AnswerQuestion,
  type QuestionAnswer,
} from "../shared/question-types";
import "./answer-fields.css";
import type { Classroom, Question, Student } from "./types";
type Item = Question & {
  canEditSource?: boolean;
  sourceQuestion?: Question;
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
  const [editing, setEditing] = useState<Item | null>(null);
  const [revision, setRevision] = useState(0);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
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
  }, [classroom.id, student.id, revision]);
  const visible = items.filter(
    (q) =>
      (!chapter || q.chapterId === chapter) &&
      (filter === "all" || q.resolved === (filter === "resolved")),
  );
  if (editing)
    return (
      <NotebookQuestionEdit
        id={editing.id}
        onClose={() => setEditing(null)}
        onSaved={(version) => {
          setEditing(null);
          setRevision((n) => n + 1);
          setNotice(
            `Đã lưu phiên bản nguồn ${version} cho mọi học sinh dùng chung câu này. Nội dung và điểm các lượt cũ vẫn được giữ.`,
          );
        }}
      />
    );
  return (
    <Modal title={`Sổ tay · ${student.name}`} onClose={onClose}>
      {notice && <p role="status">{notice}</p>}
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
        visible.map((q) => {
          const source = q.sourceQuestion ?? q;
          const updated = source.id !== q.id;
          return (
            <article className="card question-card" key={q.id}>
              <span className="eyebrow">
                {q.chapterTitle} · {q.resolved ? "Đã khắc phục" : "Cần sửa"}
              </span>
              <h3>
                <QuestionText>{source.text}</QuestionText>
              </h3>
              {updated && (
                <p>
                  Câu và đáp án hiện tại · Phiên bản {source.version}. Lịch sử
                  trả lời bên dưới thuộc phiên bản {q.version}; điểm cũ giữ
                  nguyên.
                </p>
              )}
              {q.canEditSource && (
                <button
                  type="button"
                  className="button outline small"
                  onClick={() => setEditing(q)}
                >
                  <Pencil size={16} /> Sửa câu hỏi
                </button>
              )}
              <NotebookAnswer question={source} />
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
              {updated && (
                <details>
                  <summary>
                    Câu và đáp án lúc làm bài · Phiên bản {q.version}
                  </summary>
                  <p>
                    <QuestionText>{q.text}</QuestionText>
                  </p>
                  <NotebookAnswer question={q} />
                </details>
              )}
            </article>
          );
        })
      )}
    </Modal>
  );
}

function NotebookAnswer({ question }: { question: Question }) {
  return (
    <>
      <AnswerFields
        question={question}
        value={
          questionKind(question) === "multiple-choice"
            ? question.correctIndex
            : question.correctAnswer
        }
        result={{
          correct: true,
          correctIndex: question.correctIndex,
          correctAnswer: question.correctAnswer,
        }}
        disabled
        onChange={() => {}}
      />
      <p>
        <QuestionText>{question.explanation}</QuestionText>
      </p>
    </>
  );
}

function NotebookQuestionEdit({
  id,
  onClose,
  onSaved,
}: {
  id: string;
  onClose: () => void;
  onSaved: (version: number) => void;
}) {
  const [source, setSource] = useState<{
    question: Question;
    privateQuestion: boolean;
    lessons: string[];
  }>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let alive = true;
    setError("");
    setSource(undefined);
    api<{ question: Question; privateQuestion: boolean; lessons: string[] }>(
      `/questions/${id}/edit-source`,
    )
      .then((result) => {
        if (alive) setSource(result);
      })
      .catch((e) => {
        if (alive) setError(errorMessage(e));
      });
    return () => {
      alive = false;
    };
  }, [id, retry]);
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!source || busy) return;
    const form = event.currentTarget;
    setBusy(true);
    setError("");
    try {
      const content = readQuestionForm(form);
      await ensureQuestionTypes([content]);
      const result = await api<{ version: number }>(
        `/questions/${id}/notebook-edit`,
        { ...content, expectedId: source.question.id },
      );
      onSaved(result.version);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Sửa câu hỏi từ sổ tay" onClose={onClose} dismissible={!busy}>
      <p>
        Bản sửa áp dụng cho mọi học sinh dùng chung câu nguồn và các đề chưa bắt
        đầu. Bài đang làm, bài đã nộp và điểm cũ được giữ nguyên.
      </p>
      {source ? (
        <form onSubmit={save}>
          <p>
            Đang sửa phiên bản nguồn mới nhất: {source.question.version}.{" "}
            {source.privateQuestion
              ? "Câu riêng của đề vẫn không được phát hành vào ngân hàng luyện tập."
              : "Câu được cập nhật trong ngân hàng câu hỏi."}
          </p>
          <fieldset disabled={busy}>
            <legend className="sr-only">Nội dung câu hỏi</legend>
            <QuestionFields
              question={source.question}
              lessons={source.lessons}
            />
          </fieldset>
          {error && (
            <p className="error-banner" role="alert">
              {error}
            </p>
          )}
          <div className="button-group">
            <button
              type="button"
              className="button outline"
              disabled={busy}
              onClick={onClose}
            >
              Hủy
            </button>
            <button className="button primary" disabled={busy}>
              {busy ? "Đang lưu…" : "Lưu câu nguồn"}
            </button>
          </div>
        </form>
      ) : error ? (
        <div role="alert" className="error-banner">
          {error}
          <button type="button" onClick={() => setRetry((n) => n + 1)}>
            Thử lại
          </button>
        </div>
      ) : (
        <p role="status">Đang tải câu nguồn…</p>
      )}
    </Modal>
  );
}
