import {
  questionKind,
  type AnswerQuestion,
  type QuestionAnswer,
} from "../shared/question-types";
import "./answer-fields.css";
export function AnswerFields({
  question,
  value,
  onChange,
  disabled = false,
  result,
}: {
  question: AnswerQuestion;
  value?: QuestionAnswer | null;
  onChange: (value: QuestionAnswer) => void;
  disabled?: boolean;
  result?: {
    correct: boolean;
    statementCorrectness?: boolean[];
    correctIndex?: number;
    correctAnswer?: string;
  } | null;
}) {
  const kind = questionKind(question);
  if (kind === "short-answer")
    return (
      <label
        className={`short-answer ${result ? (result.correct ? "correct-choice" : "wrong-choice") : ""}`}
      >
        Câu trả lời
        <input
          aria-label="Câu trả lời ngắn"
          maxLength={100}
          value={typeof value === "string" ? value : ""}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
        />
        {result?.correctAnswer && !result.correct && (
          <small>Đáp án: {result.correctAnswer}</small>
        )}
      </label>
    );
  if (kind === "true-false") {
    const answers =
      typeof value === "string" && value.length === question.choices.length
        ? value
        : "?".repeat(question.choices.length);
    return (
      <div className="truth-statements">
        {question.choices.map((statement, i) => (
          <fieldset key={i} disabled={disabled}>
            <legend>
              {"abcd"[i]}. {statement}
            </legend>
            <div>
              {[
                ["1", "Đúng"],
                ["0", "Sai"],
              ].map(([bit, label]) => {
                const chosen = answers[i] === bit;
                const correct =
                  result?.correctAnswer?.[i] === bit ||
                  (chosen && result?.statementCorrectness?.[i] === true);
                return (
                  <button
                    key={bit}
                    type="button"
                    aria-label={`${"abcd"[i]}. ${label}`}
                    aria-pressed={chosen}
                    className={`choice ${chosen ? "selected" : ""} ${correct ? "correct-choice" : ""} ${result && chosen && !correct && !result.correct ? "wrong-choice" : ""}`}
                    onClick={() =>
                      onChange(answers.slice(0, i) + bit + answers.slice(i + 1))
                    }
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>
    );
  }
  return (
    <div className="choices">
      {question.choices.map((choice, i) => (
        <button
          type="button"
          key={i}
          disabled={disabled}
          onClick={() => onChange(i)}
          className={`choice ${value === i ? "selected" : ""} ${result?.correctIndex === i ? "correct-choice" : ""} ${result && value === i && !result.correct ? "wrong-choice" : ""}`}
          aria-pressed={value === i}
        >
          <span className="choice-letter">{"ABCD"[i]}</span>
          <span>{choice}</span>
        </button>
      ))}
    </div>
  );
}
