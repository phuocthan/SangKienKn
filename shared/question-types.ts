export type QuestionKind = "multiple-choice" | "true-false" | "short-answer";
export type QuestionAnswer = number | string;
export type AnswerQuestion = {
  kind?: QuestionKind;
  choices: string[];
  correctIndex?: number;
  correctAnswer?: string;
};
export const questionKind = (q: { kind?: QuestionKind }) =>
  q.kind ?? "multiple-choice";
export function normalizeShortAnswer(value: string) {
  const text = value
    .normalize("NFC")
    .trim()
    .replace(/−/g, "-")
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("vi");
  if (/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(text)) {
    const negative = text.startsWith("-");
    const [whole, fraction = ""] = text
      .replace(/^[+-]/, "")
      .replace(",", ".")
      .split(".");
    const integer = whole.replace(/^0+/, "") || "0";
    const decimal = fraction.replace(/0+$/, "");
    const magnitude = integer + (decimal ? "." + decimal : "");
    return (negative && magnitude !== "0" ? "-" : "") + magnitude;
  }
  return text;
}
export function parseQuestionKind(value: unknown): QuestionKind {
  const label = String(value ?? "")
    .trim()
    .toLocaleLowerCase("vi")
    .replace(/\s+/g, "");
  if (["", "multiple-choice", "trắcnghiệm"].includes(label))
    return "multiple-choice";
  if (["true-false", "đúng/sai", "đúngsai"].includes(label))
    return "true-false";
  if (["short-answer", "trảlờingắn"].includes(label)) return "short-answer";
  throw new Error("Loại câu hỏi không hợp lệ.");
}
export function parseTruthKey(value: string) {
  const tokens = value
    .trim()
    .toLocaleLowerCase("vi")
    .split(/[\s,;/]+/)
    .filter(Boolean);
  if (/^[01]+$/.test(value.trim())) return value.trim();
  if (/^[đs]+$/i.test(value.trim()))
    return value.trim().toLowerCase().replaceAll("đ", "1").replaceAll("s", "0");
  return tokens
    .map((t) => {
      if (["đ", "đúng", "true", "1"].includes(t)) return "1";
      if (["s", "sai", "false", "0"].includes(t)) return "0";
      throw new Error("Đáp án đúng/sai cần Đ hoặc S cho từng ý, theo thứ tự.");
    })
    .join("");
}
export function validateQuestionAnswer(
  q: AnswerQuestion,
  value: unknown,
  partial = false,
): QuestionAnswer {
  const kind = questionKind(q);
  if (kind === "multiple-choice") {
    if (
      !Number.isInteger(value) ||
      Number(value) < 0 ||
      Number(value) >= q.choices.length
    )
      throw new Error("Chọn một đáp án.");
    return Number(value);
  }
  if (typeof value !== "string" || value.length > 100)
    throw new Error("Câu trả lời không hợp lệ.");
  if (kind === "true-false") {
    if (
      value.length !== q.choices.length ||
      !(partial ? /^[01?]+$/ : /^[01]+$/).test(value)
    )
      throw new Error("Chọn đúng hoặc sai cho từng ý.");
    return value;
  }
  if (partial) return value.normalize("NFC");
  const answer = normalizeShortAnswer(value);
  if (!partial && !answer) throw new Error("Nhập câu trả lời.");
  return answer;
}
export function answerComplete(q: AnswerQuestion, value: unknown) {
  try {
    validateQuestionAnswer(q, value);
    return true;
  } catch {
    return false;
  }
}
export function answerCorrect(q: AnswerQuestion, value: unknown) {
  if (!answerComplete(q, value)) return false;
  return questionKind(q) === "multiple-choice"
    ? value === q.correctIndex
    : validateQuestionAnswer(q, value) === q.correctAnswer;
}
export const storedAnswer = (answer: QuestionAnswer) =>
  typeof answer === "number" ? answer : JSON.stringify(answer);
export function answerLabel(q: AnswerQuestion) {
  if (questionKind(q) === "true-false")
    return q.correctAnswer
      ?.split("")
      .map((v) => (v === "1" ? "Đúng" : "Sai"))
      .join(" · ");
  return questionKind(q) === "short-answer"
    ? q.correctAnswer
    : "ABCD"[q.correctIndex ?? -1];
}

export function statementCorrectness(q: AnswerQuestion, value: QuestionAnswer) {
  return questionKind(q) === "true-false" && typeof value === "string"
    ? q.choices.map((_, i) => value[i] === q.correctAnswer?.[i])
    : undefined;
}
