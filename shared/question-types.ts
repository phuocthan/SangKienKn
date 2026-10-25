export type QuestionKind = "multiple-choice" | "true-false" | "short-answer";
export type QuestionAnswer = number | string;
export type AnswerQuestion = {
  text?: string;
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
  // Keep unit case (mJ differs from MJ) until the grading comparison.
  if (
    shortAnswerContext(q.text ?? "").unit &&
    !/^-?\d+(?:\.\d+)?$/.test(answer)
  )
    return value.normalize("NFC").trim();
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
export function answerCorrect(
  q: AnswerQuestion,
  value: unknown,
  allowUnits = true,
) {
  if (!answerComplete(q, value)) return false;
  if (questionKind(q) === "multiple-choice") return value === q.correctIndex;
  if (questionKind(q) === "true-false") return value === q.correctAnswer;
  const expected = normalizeShortAnswer(q.correctAnswer ?? "");
  if (normalizeShortAnswer(String(value)) === expected) return true;
  if (!allowUnits) return false;
  // Accept a numeric response with the unit explicitly requested by the
  // question. Never discard arbitrary suffixes or convert different units.
  if (!/^-?\d+(?:\.\d+)?$/.test(expected)) return false;
  const context = shortAnswerContext(q.text ?? "");
  if (!context.unit) return false;
  let answer = String(value).normalize("NFC").trim();
  if (context.variable) {
    const prefix = new RegExp(`^${context.variable}\\s*=\\s*`);
    answer = answer.replace(prefix, "");
  }
  const unit = context.unit.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(
    `^([+−-]?(?:\\d+(?:[.,]\\d*)?|[.,]\\d+))\\s*(?:${unit}|\\(\\s*${unit}\\s*\\))$`,
  ).exec(answer);
  return !!match && normalizeShortAnswer(match[1]) === expected;
}

export function shortAnswerContext(text: string) {
  const units = "rad/s|cm/s|m/s|mJ|kJ|J|cm|mm|km|m|ms|s|Hz|N|kg|g|V|A|W|Pa|°C";
  const explicit = /theo đơn vị\s+([^.!?]+)\.?\s*$/iu.exec(text)?.[1].trim();
  const named: Record<string, string> = { "giây (s)": "s", giây: "s" };
  if (
    explicit &&
    (new RegExp(`^(?:${units})$`).test(explicit) || named[explicit])
  )
    return { unit: named[explicit] ?? explicit, variable: undefined };
  const variable = new RegExp(
    `Tính[^.!?]*?\\b([a-zA-Z])\\s*\\((${units})\\)`,
    "u",
  ).exec(text);
  return { unit: variable?.[2], variable: variable?.[1] };
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
