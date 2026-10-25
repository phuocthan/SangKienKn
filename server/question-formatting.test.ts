import { test } from "node:test";
import assert from "node:assert/strict";
import { DOMParser } from "@xmldom/xmldom";
import { zipSync, strToU8 } from "fflate";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { parseWordFile } from "../src/importWord.js";
import { QuestionText } from "../src/QuestionText.js";
import { createApp } from "./app.js";
import { openDatabase, seedDemo } from "./db.js";
import {
  answerCorrect,
  validateQuestionAnswer,
} from "../shared/question-types.js";

test("Word preserves superscripts/subscripts in question, choices and explanation, including simple Equation scripts", () => {
  globalThis.DOMParser = DOMParser as unknown as typeof globalThis.DOMParser;
  const run = (text: string, align = "") =>
    `<w:r>${align ? `<w:rPr><w:vertAlign w:val="${align}"/></w:rPr>` : ""}<w:t>${text}</w:t></w:r>`;
  const p = (s: string) => `<w:p>${s}</w:p>`;
  const xml = `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"><w:body>${[
    p(run("Câu 1: Gia tốc có đơn vị m/s") + run("2", "superscript")),
    p(run("Bài học: Bài 1")),
    p(run("A. x") + run("2", "superscript")),
    p(run("B. x") + run("2", "subscript")),
    p(run("C. v")),
    p(run("D. a")),
    p(run("Đáp án: B")),
    p(
      run("Lời giải: a") +
        `<m:oMath><m:sSubSup><m:e><m:r><m:t>x</m:t></m:r></m:e><m:sub><m:r><m:t>0</m:t></m:r></m:sub><m:sup><m:r><m:t>2</m:t></m:r></m:sup></m:sSubSup></m:oMath>`,
    ),
  ].join("")}</w:body></w:document>`;
  const data = zipSync({ "word/document.xml": strToU8(xml) });
  const parsed = parseWordFile(data);
  assert.deepEqual(parsed.errors, []);
  const q = parsed.questions[0];
  assert.equal(q.text, "Gia tốc có đơn vị m/s^{2}");
  assert.deepEqual(q.choices, ["x^{2}", "x_{2}", "v", "a"]);
  assert.equal(q.correctIndex, 1);
  assert.equal(q.explanation, "ax_{0}^{2}");
  const html = renderToStaticMarkup(
    createElement(QuestionText, {
      children: q.explanation + " <img src=x onerror=alert(1)>",
    }),
  );
  assert.ok(html.includes("x<sub>0</sub><sup>2</sup>"));
  assert.ok(html.includes("&lt;img"));
  assert.throws(
    () =>
      parseWordFile(
        zipSync({
          "word/document.xml": strToU8(
            xml
              .replace("<m:sSubSup>", "<m:f>")
              .replace("</m:sSubSup>", "</m:f>"),
          ),
        }),
      ),
    /chưa được hỗ trợ/,
  );
});

test("short answers accept only the explicitly requested unit and retain numeric precision", () => {
  const q = (text: string, correctAnswer: string) => ({
    text,
    kind: "short-answer" as const,
    choices: [],
    correctAnswer,
  });
  for (const [question, values] of [
    [
      q("Tính tần số góc theo đơn vị rad/s.", "10"),
      ["10rad/s", "10 rad/s", "10,0 (rad/s)"],
    ],
    [q("Tính cơ năng theo đơn vị mJ.", "32"), ["32 mJ", "32mJ"]],
    [
      q("Tính chu kì theo đơn vị giây (s).", "0.25"),
      ["0,25s", "0,25(s)", "0.250 s"],
    ],
    [
      q(
        "Tính li độ dương x (cm) tại vị trí có động năng bằng 3 lần thế năng.",
        "4",
      ),
      ["4cm", "4 cm", "x=4cm"],
    ],
  ] as const)
    for (const value of values) {
      assert.equal(answerCorrect(question, value), true, value);
      assert.equal(
        answerCorrect(question, validateQuestionAnswer(question, value)),
        true,
        value,
      );
    }
  for (const value of ["32 J", "32 MJ", "32 m", "0,032", "32abc", "32mJ xyz"])
    assert.equal(
      answerCorrect(q("Tính cơ năng theo đơn vị mJ.", "32"), value),
      false,
      value,
    );
  assert.equal(answerCorrect(q("Tìm giá trị.", "4"), "4 cm"), false);
  assert.equal(answerCorrect(q("Tính x (cm).", "4"), "x=+-4cm"), false);
  assert.equal(
    answerCorrect(q("Tính x (cm).", "9007199254740992"), "9007199254740993cm"),
    false,
  );
  assert.equal(answerCorrect(q("Giá trị?", " 2,00 "), "2"), true);
  assert.equal(
    answerCorrect(q("Tính theo đơn vị mJ.", "32"), "32mJ", false),
    false,
  );
});

test("viewing submitted legacy papers preserves their saved score and correctness until a teacher approves regrading", async (t) => {
  const db = openDatabase(":memory:");
  seedDemo(db);
  const app = createApp(db);
  const question = {
    id: "measure",
    text: "Tính cơ năng theo đơn vị mJ.",
    choices: [],
    correctAnswer: "32",
    kind: "short-answer",
    correctIndex: -1,
    explanation: "32 mJ",
    chapterId: "chapter-1",
    chapterTitle: "Chương 1",
    lesson: "Bài 1",
  };
  for (const version of [1, 2]) {
    const questions = [
      { ...question, ...(version === 2 ? { gradingVersion: 2 } : {}) },
    ];
    db.prepare(
      `INSERT INTO exam_runs(id,student_id,classroom_id,chapter_id,kind,title,questions,answers,started_at,deadline_at,tab_limit,status,score,submitted_at,request_id,released)
      VALUES(?,'student-demo','class-demo','chapter-1','hunt','Legacy',?,'{"measure":"32mJ"}',1,2,4,'submitted',?,2,?,1)`,
    ).run(
      `legacy-${version}`,
      JSON.stringify(questions),
      version === 1 ? 0 : 10,
      `legacy-req-${version}`,
    );
  }
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  t.after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    db.close();
  });
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}/api`;
  const login = await fetch(base + "/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "giaovien@greenedu.nk",
      password: "GreenEdu123!",
    }),
  });
  const cookie = login.headers.get("set-cookie")!.split(";")[0];
  for (const version of [1, 2]) {
    const response = await fetch(
      base + `/learning/exam-runs/legacy-${version}`,
      { headers: { Cookie: cookie } },
    );
    const result = await response.json();
    assert.equal(response.status, 200);
    assert.equal(result.score, version === 1 ? 0 : 10);
    assert.equal(result.results[0].correct, version === 2);
    assert.equal(
      db
        .prepare("SELECT score FROM exam_runs WHERE id=?")
        .get(`legacy-${version}`)!.score,
      version === 1 ? 0 : 10,
    );
  }
});
