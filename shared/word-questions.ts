import { Unzip, UnzipInflate } from "fflate";
import {
  questionInput,
  questionContentKey,
  type QuestionInput,
} from "./questions";

export const wordFileLimit = 5 * 1024 * 1024;
export const wordXmlLimit = 2 * 1024 * 1024;

// Extract only the main document, in bounded chunks. Images and other ZIP
// entries are never inflated or sent to a server.
export function readWordDocument(data: Uint8Array): string {
  if (data.length > wordFileLimit)
    throw new Error("File Word quá lớn. Mỗi file tối đa 5 MB và 100 câu hỏi.");
  if (data[0] !== 0x50 || data[1] !== 0x4b)
    throw new Error(
      "File không phải Word .docx. Hãy lưu lại bằng Word theo mẫu.",
    );
  const chunks: Uint8Array[] = [];
  let size = 0,
    found = false,
    complete = false,
    problem = "";
  const unzip = new Unzip((file) => {
    if (file.name !== "word/document.xml") return;
    if (found) {
      problem = "Cấu trúc file Word không hợp lệ: có nội dung tài liệu trùng.";
      return;
    }
    found = true;
    if ((file.originalSize ?? 0) > wordXmlLimit) {
      problem = "Nội dung Word quá lớn. Hãy chia nhỏ file và bỏ nội dung thừa.";
      return;
    }
    file.ondata = (error, chunk, final) => {
      if (error) {
        problem = "Không giải nén được file Word. Hãy lưu lại thành .docx.";
        return;
      }
      size += chunk.length;
      if (size > wordXmlLimit) {
        problem =
          "Nội dung Word quá lớn. Hãy chia nhỏ file và bỏ nội dung thừa.";
        return;
      }
      chunks.push(chunk);
      if (final) complete = true;
    };
    file.start();
  });
  unzip.register(UnzipInflate);
  for (let offset = 0; offset < data.length; offset += 4096) {
    const end = Math.min(offset + 4096, data.length);
    try {
      unzip.push(data.subarray(offset, end), end === data.length);
    } catch {
      throw new Error("Không đọc được file Word. Hãy lưu lại thành .docx.");
    }
    if (problem) throw new Error(problem);
  }
  if (!found || !complete)
    throw new Error(
      "File Word thiếu nội dung hoặc bị hỏng. Hãy lưu lại thành .docx.",
    );
  const document = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    document.set(chunk, offset);
    offset += chunk.length;
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(document);
  } catch {
    throw new Error("Nội dung Word bị hỏng. Hãy lưu lại thành .docx.");
  }
}

type Field =
  | "text"
  | "lesson"
  | "topic"
  | "A"
  | "B"
  | "C"
  | "D"
  | "answer"
  | "explanation";
const fieldNames: Record<Field, string> = {
  text: "Câu hỏi",
  lesson: "Bài học",
  topic: "Chủ đề",
  A: "A",
  B: "B",
  C: "C",
  D: "D",
  answer: "Đáp án",
  explanation: "Lời giải",
};

export function parseQuestionWordText(source: string): {
  questions: QuestionInput[];
  errors: string[];
} {
  const blocks: { fields: Partial<Record<Field, string>>; errors: string[] }[] =
    [];
  let current: (typeof blocks)[number] | undefined,
    lastField: Field | undefined;
  for (const raw of source.normalize("NFC").split(/\r?\n/)) {
    const line = raw.replace(/\u00a0/g, " ").trim();
    if (!line) continue;
    const start = /^Câu\s+(?:\d+|hỏi)\s*[:.)]\s*(.*)$/iu.exec(line);
    if (start) {
      if (blocks.length === 100)
        return {
          questions: [],
          errors: ["Mỗi file cần từ 1 đến 100 câu hỏi."],
        };
      current = { fields: { text: start[1] }, errors: [] };
      blocks.push(current);
      lastField = "text";
      continue;
    }
    if (!current) continue; // Introductory instructions precede the first question.
    const label =
      /^(Bài\s+học|Chủ\s+đề|Đáp\s+án(?:\s+đúng)?|Lời\s+giải)\s*:\s*(.*)$/iu.exec(
        line,
      );
    const choice = /^([ABCD])\s*[.):]\s*(.*)$/iu.exec(line);
    let field: Field | undefined,
      value = "";
    if (label) {
      const key = label[1].toLocaleLowerCase("vi");
      field = key.startsWith("bài")
        ? "lesson"
        : key.startsWith("chủ")
          ? "topic"
          : key.startsWith("đáp")
            ? "answer"
            : "explanation";
      value = label[2];
    } else if (choice) {
      field = choice[1].toUpperCase() as Field;
      value = choice[2];
    }
    if (field) {
      if (current.fields[field] !== undefined)
        current.errors.push(`Nhãn ${fieldNames[field]} xuất hiện nhiều lần.`);
      else current.fields[field] = value;
      lastField = field;
    } else if (lastField) {
      current.fields[lastField] += `\n${line}`;
    }
  }
  if (!blocks.length)
    return {
      questions: [],
      errors: [
        "Không tìm thấy câu hỏi. Mỗi câu cần bắt đầu bằng “Câu 1: …” theo mẫu Word.",
      ],
    };
  const questions: QuestionInput[] = [],
    errors: string[] = [],
    seen = new Set<string>();
  blocks.forEach(({ fields, errors: blockErrors }, index) => {
    const missing = (Object.keys(fieldNames) as Field[]).filter(
      (field) => field !== "topic" && !fields[field]?.trim(),
    );
    if (missing.length)
      blockErrors.push(
        `Thiếu nội dung: ${missing.map((field) => fieldNames[field]).join(", ")}.`,
      );
    if (blockErrors.length) {
      errors.push(`Câu ${index + 1}: ${blockErrors.join(" ")}`);
      return;
    }
    try {
      const answer = fields.answer!.trim().toUpperCase();
      if (!/^[ABCD]$/.test(answer))
        throw new Error("Đáp án phải là một chữ A, B, C hoặc D.");
      const question = questionInput({
        text: fields.text,
        lesson: fields.lesson,
        choices: [fields.A, fields.B, fields.C, fields.D],
        correctIndex: "ABCD".indexOf(answer),
        explanation: fields.explanation,
        ...(fields.topic !== undefined ? { topic: fields.topic } : {}),
      });
      const key = questionContentKey(question);
      if (seen.has(key)) throw new Error("Câu hỏi trùng với một câu trước đó.");
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
