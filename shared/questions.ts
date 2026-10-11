export type QuestionInput = {
  text: string;
  lesson: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
  topic?: string;
};

// Topic labels classify content; changing a label does not make a new question.
export function questionContentKey({
  topic: _topic,
  ...content
}: QuestionInput) {
  return JSON.stringify(content);
}

export function questionInput(value: unknown): QuestionInput {
  const row = value as Partial<QuestionInput> | null;
  function field(value: unknown, label: string, max: number) {
    if (typeof value !== "string" || !value.trim() || value.trim().length > max)
      throw new Error(`${label} không hợp lệ (tối đa ${max} ký tự).`);
    return value.trim();
  }
  if (!row || typeof row !== "object") throw new Error("Câu hỏi không hợp lệ.");
  if (!Array.isArray(row.choices) || row.choices.length !== 4)
    throw new Error("Cần đúng 4 phương án trả lời.");
  const choices = row.choices.map((c) => field(c, "Phương án", 1000));
  if (new Set(choices).size !== 4)
    throw new Error("Các phương án phải khác nhau.");
  if (
    !Number.isInteger(row.correctIndex) ||
    row.correctIndex! < 0 ||
    row.correctIndex! > 3
  )
    throw new Error("Chọn một đáp án đúng.");
  return {
    text: field(row.text, "Nội dung câu hỏi", 3000),
    lesson:
      row.lesson === undefined
        ? "Bài luyện tập chung"
        : field(row.lesson, "Bài học", 120),
    choices,
    correctIndex: row.correctIndex!,
    explanation: field(row.explanation, "Lời giải", 3000),
    ...(row.topic === undefined ||
    (typeof row.topic === "string" && !row.topic.trim())
      ? {}
      : { topic: field(row.topic, "Chủ đề", 120).normalize("NFC") }),
  };
}

export const csvHeaders = [
  "Bài học",
  "Câu hỏi",
  "A",
  "B",
  "C",
  "D",
  "Đáp án",
  "Lời giải",
];
export const csvTemplate =
  "\uFEFF" +
  csvHeaders.join(",") +
  "\r\n" +
  "Bài 1 · Đơn vị đo,Đơn vị cơ bản của độ dài trong hệ SI?,Mét,Centimét,Kilômét,Milimét,A,Mét là đơn vị cơ bản của độ dài trong hệ SI.\r\n";

export function parseQuestionCsv(source: string): {
  questions: QuestionInput[];
  errors: string[];
} {
  const input = source.replace(/^\uFEFF/, "");
  const header = input.split(/\r?\n/, 1)[0];
  const separator =
    header.split(";").length > header.split(",").length ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false,
    closed = false;
  function endCell() {
    row.push(cell);
    cell = "";
    closed = false;
  }
  function endRow() {
    endCell();
    if (row.some((c) => c.trim())) rows.push(row);
    row = [];
  }
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (quoted) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          quoted = false;
          closed = true;
        }
      } else cell += char;
    } else if (char === separator) endCell();
    else if (char === "\n" || char === "\r") {
      if (char === "\r" && input[i + 1] === "\n") i++;
      endRow();
    } else if (char === '"') {
      if (cell || closed)
        return {
          questions: [],
          errors: ["Dấu ngoặc kép trong CSV không hợp lệ."],
        };
      quoted = true;
    } else {
      if (closed)
        return {
          questions: [],
          errors: ["Có ký tự thừa sau dấu ngoặc kép đóng."],
        };
      cell += char;
    }
  }
  if (quoted)
    return { questions: [], errors: ["CSV có ô chưa đóng dấu ngoặc kép."] };
  if (cell || row.length || closed) endRow();
  if (
    !rows.length ||
    ![8, 9].includes(rows[0].length) ||
    rows[0].some(
      (cell, i) => cell.trim() !== (i === 8 ? "Chủ đề" : csvHeaders[i]),
    )
  )
    return {
      questions: [],
      errors: [
        "Các cột không đúng mẫu. Hãy tải file mẫu và giữ nguyên dòng tiêu đề.",
      ],
    };
  if (rows.length === 1 || rows.length > 101)
    return { questions: [], errors: ["Mỗi file cần từ 1 đến 100 câu hỏi."] };
  const questions: QuestionInput[] = [],
    errors: string[] = [],
    seen = new Set<string>();
  rows.slice(1).forEach((cells, index) => {
    try {
      if (cells.length !== rows[0].length)
        throw new Error(`Cần đúng ${rows[0].length} cột.`);
      const correctIndex = ["A", "B", "C", "D"].indexOf(
        cells[6].trim().toUpperCase(),
      );
      const question = questionInput({
        lesson: cells[0],
        text: cells[1],
        choices: cells.slice(2, 6),
        correctIndex,
        explanation: cells[7],
        ...(cells.length === 9 ? { topic: cells[8] } : {}),
      });
      const key = questionContentKey(question);
      if (seen.has(key))
        throw new Error("Câu hỏi trùng với một dòng trước đó.");
      seen.add(key);
      questions.push(question);
    } catch (e) {
      errors.push(
        `Câu ${index + 1}: ${e instanceof Error ? e.message : "Dữ liệu không hợp lệ."}`,
      );
    }
  });
  return { questions, errors };
}
