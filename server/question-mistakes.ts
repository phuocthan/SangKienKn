import type { DatabaseSync } from "node:sqlite";
import { strToU8, zipSync } from "fflate";
import {
  answerCorrect,
  answerLabel,
  type AnswerQuestion,
  type QuestionKind,
} from "../shared/question-types.js";

type Question = AnswerQuestion & {
  id: string;
  chapterId: string;
  lesson: string;
  version: number;
  explanation: string;
  kind: QuestionKind;
};
export type MistakeRow = {
  question: Question;
  wrong: number;
  answered: number;
  students: number;
  percent: number;
};
type Aggregate = {
  question: Question;
  wrong: number;
  answered: number;
  students: Set<string>;
};

// A version is a separate question: old responses retain the content and key
// used at the time instead of being regraded against a later edit.
export function questionMistakes(
  db: DatabaseSync,
  chapterId: string,
  classroomId: string,
): MistakeRow[] {
  const rows = new Map<string, Aggregate>();
  const add = (
    q: Question,
    student: string,
    correct: boolean,
    count: number = 1,
  ) => {
    let row = rows.get(q.id);
    if (!row) {
      row = { question: q, wrong: 0, answered: 0, students: new Set() };
      rows.set(q.id, row);
    }
    row.answered += count;
    if (!correct) {
      row.wrong += count;
      row.students.add(student);
    }
  };
  const questions = new Map(
    db
      .prepare("SELECT * FROM questions WHERE chapter_id=?")
      .all(chapterId)
      .map((q) => [
        String(q.id),
        {
          id: String(q.id),
          chapterId,
          text: String(q.text),
          choices: JSON.parse(String(q.choices)),
          lesson: String(q.lesson),
          kind: String(q.kind ?? "multiple-choice") as QuestionKind,
          correctIndex: Number(q.correct_index),
          correctAnswer:
            q.correct_answer == null ? undefined : String(q.correct_answer),
          explanation: String(q.explanation),
          version: Number(q.version ?? 1),
        } satisfies Question,
      ]),
  );
  for (const a of db
    .prepare(
      `SELECT COALESCE(v.source_question_id,a.question_id) source_id,a.student_id,a.correct
    FROM attempts a JOIN questions original ON original.id=a.question_id
    LEFT JOIN attempt_question_versions v ON v.attempt_id=a.id WHERE original.chapter_id=?`,
    )
    .iterate(chapterId)) {
    const q = questions.get(String(a.source_id));
    if (q) add(q, String(a.student_id), Number(a.correct) === 1);
  }
  // Review answers already have an attempts row. Exams keep immutable question
  // snapshots; count submitted answers only, including partly answered Đ/S.
  for (const run of db
    .prepare(
      "SELECT student_id,questions,answers FROM exam_runs WHERE classroom_id=? AND status='submitted'",
    )
    .iterate(classroomId)) {
    const snapshots = JSON.parse(String(run.questions)) as (Question & {
      gradingVersion?: number;
    })[];
    const answers = JSON.parse(String(run.answers)) as Record<string, unknown>;
    for (const q of snapshots) {
      if (q.chapterId !== chapterId || !questions.has(q.id)) continue;
      const value = answers[q.id];
      const answered =
        typeof value === "number"
          ? Number.isInteger(value) && value >= 0
          : typeof value === "string" &&
            !!value.trim() &&
            (q.kind !== "true-false" || /[01]/.test(value));
      if (!answered) continue;
      add(
        questions.get(q.id)!,
        String(run.student_id),
        answerCorrect(q, value, q.gradingVersion === 2),
      );
    }
  }
  return [...rows.values()]
    .filter((r) => r.wrong > 0)
    .map((r) => ({
      ...r,
      students: r.students.size,
      percent: Math.round((r.wrong * 1000) / r.answered) / 10,
    }))
    .sort(
      (a, b) =>
        b.wrong - a.wrong ||
        b.students - a.students ||
        b.percent - a.percent ||
        a.question.id.localeCompare(b.question.id),
    );
}

const xml = (v: unknown) =>
  String(v ?? "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const parts = (text: string) => {
  const result: { text: string; script?: "superscript" | "subscript" }[] = [];
  let index = 0;
  for (const m of text.matchAll(/([_^])(?:\{([^{}\n]+)\}|([+-]?\d+))/g)) {
    if (m.index > index) result.push({ text: text.slice(index, m.index) });
    result.push({
      text: m[2] ?? m[3],
      script: m[1] === "^" ? "superscript" : "subscript",
    });
    index = m.index + m[0].length;
  }
  if (index < text.length) result.push({ text: text.slice(index) });
  return result.length ? result : [{ text: "" }];
};
const choices = (q: Question) =>
  q.kind === "short-answer"
    ? ""
    : q.choices.map((v, i) => `${"ABCD"[i] ?? i + 1}. ${v}`).join("\n");
const pack = (files: Record<string, string>) =>
  Buffer.from(
    zipSync(
      Object.fromEntries(
        Object.entries(files).map(([n, v]) => [n, strToU8(v)]),
      ),
    ),
  );

export function mistakeWorkbook(
  className: string,
  chapterName: string,
  rows: MistakeRow[],
) {
  const headers = [
    "STT",
    "Bài",
    "Câu hỏi",
    "Phương án / Các ý",
    "Đáp án",
    "Phiên bản",
    "Lượt sai",
    "Lượt trả lời",
    "HS làm sai",
    "Tỷ lệ sai (%)",
  ];
  const lines: (string | number)[][] = [
    [`Lớp: ${className} · Chương: ${chapterName}`],
    [
      "Gồm luyện tập, sửa sai, ôn tập và bài kiểm tra đã nộp; không tính câu bỏ trống. Tách từng phiên bản câu hỏi.",
    ],
    headers,
    ...rows.map((r, i) => [
      i + 1,
      r.question.lesson,
      r.question.text ?? "",
      choices(r.question),
      answerLabel(r.question) ?? "",
      r.question.version,
      r.wrong,
      r.answered,
      r.students,
      r.percent,
    ]),
  ];
  if (!rows.length) lines.push(["", "", "Chưa có câu nào được trả lời sai."]);
  const column = (n: number) => String.fromCharCode(65 + n);
  const cells = (value: string | number, i: number, j: number) => {
    const attr = `r="${column(j)}${i + 1}" s="${i === 2 ? 1 : 2}"`;
    if (typeof value === "number") return `<c ${attr}><v>${value}</v></c>`;
    const runs = parts(value)
      .map(
        (p) =>
          `<r>${p.script ? `<rPr><vertAlign val="${p.script}"/></rPr>` : ""}<t xml:space="preserve">${xml(p.text)}</t></r>`,
      )
      .join("");
    return `<c ${attr} t="inlineStr"><is>${runs}</is></c>`;
  };
  const widths = [7, 22, 65, 55, 22, 12, 12, 16, 15, 18];
  const sheet = `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="3" topLeftCell="A4" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("")}</cols><sheetData>${lines.map((row, i) => `<row r="${i + 1}"${i >= 3 ? ` ht="${Math.min(409, Math.max(30, Math.ceil(String(row[2] ?? "").length / 65) * 15 + (String(row[2] ?? "").split("\n").length - 1) * 15, Math.ceil(String(row[3] ?? "").length / 55) * 15 + (String(row[3] ?? "").split("\n").length - 1) * 15))}" customHeight="1"` : ' ht="30" customHeight="1"'}>${row.map((v, j) => cells(v, i, j)).join("")}</row>`).join("")}</sheetData><autoFilter ref="A3:J${lines.length}"/><mergeCells count="2"><mergeCell ref="A1:J1"/><mergeCell ref="A2:J2"/></mergeCells></worksheet>`;
  return pack({
    "[Content_Types].xml":
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>',
    "_rels/.rels":
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>',
    "docProps/core.xml": `<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${xml(`${className} · ${chapterName}`)}</dc:title></cp:coreProperties>`,
    "xl/workbook.xml":
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Câu hỏi thường sai" sheetId="1" r:id="rId1"/></sheets></workbook>',
    "xl/_rels/workbook.xml.rels":
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
    "xl/styles.xml":
      '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF315D3E"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>',
    "xl/worksheets/sheet1.xml": sheet,
  });
}

export function mistakeDocument(
  className: string,
  chapterName: string,
  rows: MistakeRow[],
) {
  const textRuns = (text: string) =>
    parts(text)
      .map(
        (p) =>
          `<w:r>${p.script ? `<w:rPr><w:vertAlign w:val="${p.script}"/></w:rPr>` : ""}${p.text
            .split("\n")
            .map(
              (line, i) =>
                `${i ? "<w:br/>" : ""}<w:t xml:space="preserve">${xml(line)}</w:t>`,
            )
            .join("")}</w:r>`,
      )
      .join("");
  const paragraph = (text: string, bold = false) =>
    `<w:p><w:pPr><w:spacing w:after="120"/></w:pPr>${bold ? `<w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${xml(text)}</w:t></w:r>` : textRuns(text)}</w:p>`;
  const content = rows.length
    ? rows
        .map((r, i) =>
          [
            paragraph(
              `Câu ${i + 1} · ${r.question.lesson} · Phiên bản ${r.question.version}`,
              true,
            ),
            paragraph(r.question.text ?? ""),
            ...(choices(r.question) ? [paragraph(choices(r.question))] : []),
            paragraph(`Đáp án: ${answerLabel(r.question) ?? ""}`),
            paragraph(
              `${r.wrong} lượt sai / ${r.answered} lượt trả lời · ${r.students} học sinh làm sai · Tỷ lệ sai ${r.percent.toLocaleString("vi-VN")}%`,
            ),
          ].join(""),
        )
        .join("")
    : paragraph("Chưa có câu nào được trả lời sai.");
  const body =
    paragraph("THỐNG KÊ CÂU HỎI THƯỜNG LÀM SAI", true) +
    paragraph(`Lớp: ${className} · Chương: ${chapterName}`, true) +
    paragraph(
      "Gồm lượt luyện tập, sửa sai, ôn tập và bài kiểm tra đã nộp; không tính câu bỏ trống. Mỗi phiên bản được thống kê riêng.",
    ) +
    content;
  return pack({
    "[Content_Types].xml":
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    "_rels/.rels":
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    "word/document.xml": `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr></w:body></w:document>`,
  });
}
