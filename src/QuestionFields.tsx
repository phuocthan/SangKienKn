import { useState } from "react";
import type { Question } from "./types";
import { questionInput } from "../shared/questions";
import { questionKind, type QuestionKind } from "../shared/question-types";
export function readQuestionForm(form: HTMLFormElement) {
  const fields = Object.fromEntries(new FormData(form));
  const kind = fields.kind ?? "multiple-choice";
  if (
    kind === "true-false" &&
    String(fields.d ?? "").trim() &&
    !String(fields.c ?? "").trim()
  )
    throw new Error("Điền ý C trước ý D.");
  const letters = ["a", "b", "c", "d"];
  const used = letters.filter((letter) => String(fields[letter] ?? "").trim());
  return questionInput({
    kind,
    lesson: fields.lesson,
    text: fields.text,
    explanation: fields.explanation,
    topic: fields.topic,
    choices:
      kind === "short-answer"
        ? []
        : kind === "true-false"
          ? used.map((letter) => fields[letter])
          : letters.map((letter) => fields[letter]),
    correctIndex: Number(fields.correctIndex),
    correctAnswer:
      kind === "true-false"
        ? used.map((letter) => fields[`truth-${letter}`]).join("")
        : fields.correctAnswer,
  });
}
export function QuestionFields({
  question,
  lessons = [],
  topicSupported = true,
}: {
  question?: Question;
  lessons?: string[];
  topicSupported?: boolean;
}) {
  const [kind, setKind] = useState<QuestionKind>(questionKind(question ?? {}));
  return (
    <>
      <label>
        Loại câu hỏi
        <select
          name="kind"
          value={kind}
          onChange={(e) => setKind(e.target.value as QuestionKind)}
        >
          <option value="multiple-choice">Trắc nghiệm</option>
          <option value="true-false">Đúng/sai</option>
          <option value="short-answer">Trả lời ngắn</option>
        </select>
      </label>
      <label>
        Bài học
        <input
          required
          name="lesson"
          maxLength={120}
          defaultValue={question?.lesson ?? "Bài luyện tập chung"}
          list="lesson-titles"
        />
        <datalist id="lesson-titles">
          {lessons.map((title) => (
            <option key={title} value={title} />
          ))}
        </datalist>
      </label>
      <label>
        Chủ đề (không bắt buộc)
        <input
          name="topic"
          disabled={!topicSupported}
          maxLength={120}
          defaultValue={question?.topic ?? ""}
        />
      </label>
      <label>
        Nội dung câu hỏi
        <textarea
          name="text"
          required
          maxLength={3000}
          rows={3}
          defaultValue={question?.text}
        />
      </label>
      {kind !== "short-answer" && (
        <div className="form-grid">
          {["a", "b", "c", "d"].map((letter, index) => (
            <div key={`${kind}-${letter}`}>
              <label>
                {kind === "true-false" ? "Khẳng định" : "Phương án"}{" "}
                {letter.toUpperCase()}
                {kind === "true-false" && index > 1 ? " (không bắt buộc)" : ""}
                <input
                  name={letter}
                  required={kind === "multiple-choice" || index < 2}
                  maxLength={1000}
                  defaultValue={question?.choices[index]}
                />
              </label>
              {kind === "true-false" && (
                <label>
                  Đáp án ý {letter.toUpperCase()}
                  <select
                    name={`truth-${letter}`}
                    defaultValue={question?.correctAnswer?.[index] ?? "1"}
                  >
                    <option value="1">Đúng</option>
                    <option value="0">Sai</option>
                  </select>
                </label>
              )}
            </div>
          ))}
        </div>
      )}
      {kind === "multiple-choice" ? (
        <label>
          Đáp án đúng
          <select
            name="correctIndex"
            defaultValue={String(question?.correctIndex ?? 0)}
          >
            {["A", "B", "C", "D"].map((letter, index) => (
              <option key={letter} value={index}>
                Phương án {letter}
              </option>
            ))}
          </select>
        </label>
      ) : (
        kind === "short-answer" && (
          <label>
            Đáp án đúng
            <input
              name="correctAnswer"
              required
              maxLength={100}
              defaultValue={question?.correctAnswer}
              placeholder="Ví dụ: 2"
            />
          </label>
        )
      )}
      <label>
        Lời giải
        <textarea
          name="explanation"
          required
          maxLength={3000}
          rows={3}
          defaultValue={question?.explanation}
        />
      </label>
    </>
  );
}
