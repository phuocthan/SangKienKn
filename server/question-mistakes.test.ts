import { test } from "node:test";
import assert from "node:assert/strict";
import { strFromU8, unzipSync } from "fflate";
import { openDatabase, seedDemo, hashPassword } from "./db.js";
import { createApp } from "./app.js";
import {
  questionMistakes,
  mistakeWorkbook,
  mistakeDocument,
} from "./question-mistakes.js";

test("mistake report counts answered practice, repair and submitted exam snapshots once, preserving versions and chapter scope", () => {
  const db = openDatabase(":memory:");
  try {
    seedDemo(db);
    db.prepare(
      "UPDATE questions SET text='Gia tốc a_0 = 5 m/s^{2}',family_id='question-1',is_current=0 WHERE id='question-1'",
    ).run();
    db.prepare(
      `INSERT INTO questions(id,chapter_id,text,choices,correct_index,explanation,lesson,active,is_current,version,family_id,kind)
      VALUES('new-version','chapter-1','Câu sửa mới', '["A","B","C","D"]',0,'Giải','Bài 1',1,1,2,'question-1','multiple-choice')`,
    ).run();
    const insert = db.prepare("INSERT INTO attempts VALUES(?,?,?,?,?,?,?)");
    insert.run("wrong-old", "student-demo", "question-1", 1, 0, "practice", 1);
    insert.run("wrong-old-2", "student-2", "question-1", 2, 0, "practice", 2);
    insert.run("review:1", "student-demo", "question-1", 0, 1, "practice", 3);
    insert.run("repair", "student-demo", "question-1", 1, 0, "correction", 4);
    db.prepare(
      "INSERT INTO attempt_question_versions VALUES('repair','new-version')",
    ).run();
    insert.run("other-ch", "student-demo", "question-4", 0, 0, "practice", 5);
    const q = {
      id: "question-1",
      chapterId: "chapter-1",
      text: "Gia tốc a_0 = 5 m/s^{2}",
      choices: ["a", "b", "c", "d"],
      correctIndex: 0,
      kind: "multiple-choice",
      gradingVersion: 2,
    };
    const q2 = { ...q, id: "new-version", text: "Câu sửa mới" };
    const run =
      db.prepare(`INSERT INTO exam_runs(id,student_id,classroom_id,chapter_id,kind,title,questions,answers,started_at,deadline_at,tab_limit,status,reason,score,submitted_at,request_id)
      VALUES(?,?,'class-demo','chapter-1','hunt','Bài thi',?,?,100,200,4,?,?,?,150,?)`);
    run.run(
      "exam-wrong",
      "student-demo",
      JSON.stringify([q, q2]),
      JSON.stringify({ "question-1": 1 }),
      "submitted",
      "student",
      0,
      "exam-wrong",
    );
    run.run(
      "exam-correct",
      "student-3",
      JSON.stringify([q, q2]),
      JSON.stringify({ "question-1": 0, "new-version": 1 }),
      "submitted",
      "student",
      5,
      "exam-correct",
    );
    run.run(
      "exam-active",
      "student-2",
      JSON.stringify([q]),
      JSON.stringify({ "question-1": 1 }),
      "active",
      null,
      null,
      "exam-active",
    );
    const rows = questionMistakes(db, "chapter-1", "class-demo");
    assert.deepEqual(
      rows.map((r) => [
        r.question.id,
        r.wrong,
        r.answered,
        r.students,
        r.percent,
      ]),
      [
        ["question-1", 3, 5, 2, 60],
        ["new-version", 2, 2, 2, 100],
      ],
    );
    assert.equal(questionMistakes(db, "chapter-3", "class-demo").length, 0);
    const x = unzipSync(mistakeWorkbook("Lớp A", "Chương 1", rows));
    const sheet = strFromU8(x["xl/worksheets/sheet1.xml"]);
    assert.match(sheet, /Lớp: Lớp A · Chương: Chương 1/);
    assert.match(sheet, /vertAlign val="subscript"/);
    assert.match(sheet, /vertAlign val="superscript"/);
    assert.match(sheet, /<v>60<\/v>/);
    assert.match(sheet, /autoFilter ref="A3:J5"/);
    const w = unzipSync(mistakeDocument("Lớp A", "Chương 1", rows));
    const document = strFromU8(w["word/document.xml"]);
    assert.match(document, /vertAlign w:val="subscript"/);
    assert.match(document, /vertAlign w:val="superscript"/);
    assert.match(document, /3 lượt sai \/ 5 lượt trả lời/);
    assert.match(
      strFromU8(unzipSync(mistakeDocument("L", "C", []))["word/document.xml"]),
      /Chưa có câu nào/,
    );
  } finally {
    db.close();
  }
});

test("only teachers of the class and authorized read-only teachers can export reports", async (t) => {
  const db = openDatabase(":memory:");
  seedDemo(db);
  db.prepare(
    "INSERT INTO users VALUES('other','other@test.local','Khác',?,'teacher',0)",
  ).run(hashPassword("GreenEdu123!"));
  db.prepare(
    "INSERT INTO users VALUES('viewer','viewer@test.local','Chỉ xem',?,'student',0)",
  ).run(hashPassword("GreenEdu123!"));
  db.prepare(
    "INSERT INTO teacher_viewers VALUES('viewer','teacher-demo')",
  ).run();
  const server = createApp(db).listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  t.after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    db.close();
  });
  const base = `http://127.0.0.1:${address.port}/api`;
  async function login(email: string) {
    const r = await fetch(`${base}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "GreenEdu123!" }),
    });
    return r.headers.get("set-cookie")!.split(";")[0];
  }
  const teacher = await login("giaovien@greenedu.nk"),
    student = await login("hocsinh@greenedu.nk"),
    other = await login("other@test.local"),
    viewer = await login("viewer@test.local");
  for (const cookie of ["", student, other])
    assert.ok(
      [401, 403].includes(
        (
          await fetch(`${base}/chapters/chapter-1/mistakes.xlsx`, {
            headers: { cookie },
          })
        ).status,
      ),
    );
  for (const cookie of [teacher, viewer])
    for (const format of ["xlsx", "docx"]) {
      const response = await fetch(
        `${base}/chapters/chapter-1/mistakes.${format}`,
        { headers: { cookie } },
      );
      assert.equal(response.status, 200);
      assert.match(
        response.headers.get("content-disposition")!,
        /filename\*=UTF-8''/,
      );
      assert.ok(
        Object.keys(unzipSync(new Uint8Array(await response.arrayBuffer())))
          .length > 2,
      );
    }
  assert.equal(
    (
      await fetch(`${base}/chapters/chapter-1/mistakes.pdf`, {
        headers: { cookie: teacher },
      })
    ).status,
    400,
  );
});

test("exam grading uses frozen rules, excludes blank answers and counts partially answered true/false as incorrect", () => {
  const db = openDatabase(":memory:");
  try {
    seedDemo(db);
    const add = db.prepare(
      `INSERT INTO questions(id,chapter_id,text,choices,correct_index,explanation,lesson,kind,correct_answer) VALUES(?,?,?,?,0,'Giải','Bài 1',?,?)`,
    );
    add.run(
      "num",
      "chapter-1",
      "Tính t theo đơn vị s",
      "[]",
      "short-answer",
      "0.25",
    );
    add.run(
      "tf",
      "chapter-1",
      "Các ý",
      '["a","b","c","d"]',
      "true-false",
      "1010",
    );
    const num = {
      id: "num",
      chapterId: "chapter-1",
      kind: "short-answer",
      text: "Tính t theo đơn vị s",
      choices: [],
      correctAnswer: "0.25",
    };
    const tf = {
      id: "tf",
      chapterId: "chapter-1",
      kind: "true-false",
      text: "Các ý",
      choices: ["a", "b", "c", "d"],
      correctAnswer: "1010",
    };
    const ins = db.prepare(
      `INSERT INTO exam_runs(id,student_id,classroom_id,chapter_id,kind,title,questions,answers,started_at,deadline_at,tab_limit,status,reason,score,submitted_at,request_id) VALUES(?,?,'class-demo','chapter-1','hunt','Thi',?,?,1,2,4,'submitted','student',0,2,?)`,
    );
    ins.run(
      "legacy",
      "student-demo",
      JSON.stringify([num, tf]),
      JSON.stringify({ num: "0,25 s", tf: "1???" }),
      "legacy",
    );
    ins.run(
      "current",
      "student-2",
      JSON.stringify([{ ...num, gradingVersion: 2 }, tf]),
      JSON.stringify({ num: "0,25 s", tf: "????" }),
      "current",
    );
    const rows = questionMistakes(db, "chapter-1", "class-demo");
    assert.deepEqual(
      rows.map((r) => [r.question.id, r.wrong, r.answered]),
      [
        ["tf", 1, 1],
        ["num", 1, 2],
      ],
    );
  } finally {
    db.close();
  }
});
