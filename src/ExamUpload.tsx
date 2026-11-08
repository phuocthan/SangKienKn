import { useEffect, useRef, useState } from "react";
import { QuestionText } from "./QuestionText";
import { FormulaWorkbench } from "./FormulaField";
import { QuestionFields, readQuestionForm } from "./QuestionFields";
import { answerLabel } from "../shared/question-types";
import { parseWordFile } from "./importWord";
import {
  csvTemplate,
  parseQuestionCsv,
  questionContentKey,
  type QuestionInput,
} from "../shared/questions";
import { errorMessage } from "./api";
import type { Chapter } from "./types";

export type UploadedExamQuestion = {
  chapterId: string;
  question: QuestionInput;
};

export function ExamUpload({
  chapters,
  questions,
  onChange,
  onReadingChange,
  singleChapter = false,
}: {
  chapters: Chapter[];
  questions: UploadedExamQuestion[];
  onChange: (questions: UploadedExamQuestion[]) => void;
  onReadingChange: (reading: boolean) => void;
  singleChapter?: boolean;
}) {
  const [chapterId, setChapterId] = useState(chapters[0]?.id ?? "");
  const [errors, setErrors] = useState<string[]>([]);
  const [reading, setReading] = useState(false);
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [editError, setEditError] = useState("");
  const editor = useRef<HTMLFieldSetElement>(null);
  const generation = useRef(0);
  const target = chapters.some((ch) => ch.id === chapterId)
    ? chapterId
    : (chapters[0]?.id ?? "");
  useEffect(
    () => () => {
      generation.current++;
      onReadingChange(false);
    },
    [onReadingChange],
  );
  async function read(file: File) {
    const token = ++generation.current;
    setErrors([]);
    setSuccess("");
    setReading(true);
    onReadingChange(true);
    try {
      if (!target) throw new Error("Chọn chương trước khi tải đề.");
      const word = /\.docx$/i.test(file.name);
      if (file.size > (word ? 5 * 1024 * 1024 : 512 * 1024))
        throw new Error(
          word ? "File Word tối đa 5 MB." : "File CSV tối đa 512 KB.",
        );
      const bytes = new Uint8Array(await file.arrayBuffer());
      const parsed = /\.docx$/i.test(file.name)
        ? parseWordFile(bytes)
        : /\.csv$/i.test(file.name)
          ? parseQuestionCsv(
              new TextDecoder("utf-8", { fatal: true }).decode(bytes),
            )
          : (() => {
              throw new Error("Chọn file Word .docx hoặc CSV theo mẫu.");
            })();
      if (token !== generation.current) return;
      if (parsed.errors.length) {
        setErrors(parsed.errors);
        return;
      }
      if (!parsed.questions.length)
        throw new Error("File chưa có câu hỏi hợp lệ.");
      if (questions.length + parsed.questions.length > 100)
        throw new Error(
          "Mỗi đề tối đa 100 câu. Xóa bớt câu trước khi tải thêm.",
        );
      const seen = new Set(
        questions
          .filter((row) => row.chapterId === target)
          .map((row) => questionContentKey(row.question)),
      );
      if (
        parsed.questions.some((question) =>
          seen.has(questionContentKey(question)),
        )
      )
        throw new Error(
          "File có câu trùng với đề đã tải vào chương này. Bỏ câu trùng hoặc chọn file khác.",
        );
      onChange([
        ...questions,
        ...parsed.questions.map((question) => ({
          chapterId: target,
          question,
        })),
      ]);
      setSuccess(`Đã đọc ${file.name}: ${parsed.questions.length} câu hợp lệ.`);
    } catch (e) {
      if (token === generation.current) setErrors([errorMessage(e)]);
    } finally {
      if (token === generation.current) {
        setReading(false);
        onReadingChange(false);
      }
    }
  }
  function downloadCsv() {
    const url = URL.createObjectURL(
      new Blob([csvTemplate], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "greenedu-de-kiem-tra.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function edit(index: number | null) {
    setEditing(index);
    setEditError("");
    onReadingChange(index !== null);
  }
  function saveQuestion() {
    if (!editor.current || editing === null) return;
    const invalid = Array.from(
      editor.current.querySelectorAll<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >("input,textarea,select"),
    ).find((el) => !el.checkValidity());
    if (invalid) {
      invalid.reportValidity();
      return;
    }
    try {
      const question = readQuestionForm(editor.current);
      const chapterId = editing >= 0 ? questions[editing].chapterId : target;
      if (
        questions.some(
          (row, i) =>
            i !== editing &&
            row.chapterId === chapterId &&
            questionContentKey(row.question) === questionContentKey(question),
        )
      )
        throw new Error("Câu này trùng với câu đã có trong đề.");
      const row = { chapterId, question };
      onChange(
        editing < 0
          ? [...questions, row]
          : questions.map((old, i) => (i === editing ? row : old)),
      );
      edit(null);
    } catch (problem) {
      setEditError(errorMessage(problem));
    }
  }
  return (
    <fieldset className="exam-upload">
      <legend>Tải đề của giáo viên</legend>
      <p>
        Dùng Word/CSV theo mẫu, có đủ lựa chọn và đáp án để chấm tự động. Mỗi
        file gắn với chương được chọn bên dưới;{" "}
        {singleChapter
          ? "có thể thêm file cùng chương."
          : "tải thêm file để tạo đề nhiều chương."}{" "}
        Câu tải lên chỉ dùng cho đề này.
      </p>
      <div className="learning-actions">
        <a
          className="button secondary small"
          href="/templates/greenedu-cau-hoi-mau.docx"
          download
        >
          Mẫu Word
        </a>
        <button
          type="button"
          className="button secondary small"
          onClick={downloadCsv}
        >
          Mẫu CSV
        </button>
      </div>
      <FormulaWorkbench />
      <button
        type="button"
        className="button secondary small"
        disabled={
          reading || editing !== null || !target || questions.length >= 100
        }
        onClick={() => edit(-1)}
      >
        Thêm câu trực tiếp
      </button>
      <label>
        Chương cho file tải lên
        <select
          value={target}
          onChange={(e) => setChapterId(e.target.value)}
          disabled={reading || editing !== null || !chapters.length}
        >
          {!chapters.length && <option value="">Chọn chương ở trên</option>}
          {chapters.map((ch) => (
            <option key={ch.id} value={ch.id}>
              {ch.title}
            </option>
          ))}
        </select>
      </label>
      <label>
        File đề (.docx hoặc .csv)
        <input
          type="file"
          accept=".docx,.csv"
          disabled={reading || editing !== null || !target}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void read(file);
          }}
        />
      </label>
      {reading && <p role="status">Đang đọc đề…</p>}
      {success && <p role="status">{success}</p>}
      {!!errors.length && (
        <div role="alert">
          <ul>
            {errors.map((message, index) => (
              <li key={index}>{message}</li>
            ))}
          </ul>
        </div>
      )}
      <p>{questions.length} câu đã chọn / tối đa 100</p>
      {editing !== null && (
        <fieldset
          ref={editor}
          className="uploaded-question-editor"
          key={editing}
        >
          <legend>
            {editing < 0 ? "Thêm câu trực tiếp" : `Sửa câu ${editing + 1}`}
          </legend>
          <QuestionFields
            question={editing >= 0 ? questions[editing].question : undefined}
          />
          {editError && <p role="alert">{editError}</p>}
          <div className="learning-actions">
            <button
              type="button"
              className="button primary small"
              onClick={saveQuestion}
            >
              Lưu câu vào đề
            </button>
            <button
              type="button"
              className="button secondary small"
              onClick={() => edit(null)}
            >
              Hủy sửa câu
            </button>
          </div>
        </fieldset>
      )}
      {!!questions.length && (
        <details>
          <summary>Xem và bỏ câu khỏi đề</summary>
          {questions.map((row, index) => (
            <div className="learning-row" key={index}>
              <div>
                <strong>
                  {index + 1}. <QuestionText>{row.question.text}</QuestionText>
                </strong>
                <p>
                  {chapters.find((ch) => ch.id === row.chapterId)?.title ??
                    "Chương đã bỏ chọn"}{" "}
                  · {row.question.lesson || "Chưa gắn bài"}
                </p>
                <small>
                  Đáp án:{" "}
                  <QuestionText>{answerLabel(row.question)}</QuestionText>
                </small>
              </div>
              <div className="learning-actions">
                <button
                  type="button"
                  className="button secondary small"
                  disabled={reading || editing !== null}
                  onClick={() => edit(index)}
                >
                  Sửa câu {index + 1}
                </button>
                <button
                  type="button"
                  className="button danger-outline small"
                  disabled={reading || editing !== null}
                  onClick={() =>
                    onChange(questions.filter((_, i) => i !== index))
                  }
                >
                  Bỏ câu {index + 1}
                </button>
              </div>
            </div>
          ))}
        </details>
      )}
    </fieldset>
  );
}
