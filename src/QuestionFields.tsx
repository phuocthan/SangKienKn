import type { Question } from "./types";
import { questionInput } from "../shared/questions";

export function readQuestionForm(form: HTMLFormElement) {
  const fields = Object.fromEntries(new FormData(form));
  return questionInput({
    lesson: fields.lesson,
    text: fields.text,
    explanation: fields.explanation,
    choices: [fields.a, fields.b, fields.c, fields.d],
    correctIndex: Number(fields.correctIndex),
  });
}

export function QuestionFields({
  question,
  lessons = [],
}: {
  question?: Question;
  lessons?: string[];
}) {
  return (
    <>
      <label>
        Bài học
        <input
          required
          name="lesson"
          maxLength={120}
          defaultValue={question?.lesson ?? "Bài luyện tập chung"}
          list="lesson-titles"
          placeholder="Ví dụ: Bài 1 · Chuyển động thẳng"
        />
        <datalist id="lesson-titles">
          {lessons.map((title) => (
            <option key={title} value={title} />
          ))}
        </datalist>
      </label>
      <label>
        Nội dung câu hỏi
        <textarea
          name="text"
          required
          maxLength={3000}
          rows={3}
          defaultValue={question?.text}
          placeholder="Nhập câu hỏi rõ ràng, dễ hiểu…"
        />
      </label>
      <div className="form-grid">
        {["a", "b", "c", "d"].map((letter, index) => (
          <label key={letter}>
            Phương án {letter.toUpperCase()}
            <input
              name={letter}
              required
              maxLength={1000}
              defaultValue={question?.choices[index]}
            />
          </label>
        ))}
      </div>
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
      <label>
        Lời giải
        <textarea
          name="explanation"
          required
          maxLength={3000}
          rows={3}
          defaultValue={question?.explanation}
          placeholder="Giải thích vì sao đáp án đúng, giúp học sinh hiểu cách làm."
        />
      </label>
    </>
  );
}
