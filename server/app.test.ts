import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readFileSync } from "node:fs";
import { zipSync, strToU8 } from "fflate";
import { DatabaseSync } from "node:sqlite";
import {
  csvHeaders,
  csvTemplate,
  parseQuestionCsv,
} from "../shared/questions.js";
import { createApp, treeLevel } from "./app.js";
import { hashPassword, openDatabase, seedDemo } from "./db.js";
import {
  parseQuestionWordText,
  readWordDocument,
  wordXmlLimit,
} from "../shared/word-questions.js";

const wordQuestion = `Câu 1: Một vật đi được 20 m trong 5 s. Tốc độ là bao nhiêu?
Bài học: Bài 2 · Tốc độ
A. 2 m/s
B. 4 m/s
C. 8 m/s
D. 20 m/s
Đáp án: B
Lời giải: v = s/t = 20/5 = 4 m/s.`;

test("Word question blocks preserve Vietnamese and multiline text, with explicit answer keys", () => {
  const source = `Hướng dẫn nhập Word\n${wordQuestion.replace("B. 4 m/s", "b) 4 m/s").replace("Đáp án: B", "Đáp án đúng: b")}\nĐơn vị tốc độ là mét trên giây.`;
  const parsed = parseQuestionWordText(source.normalize("NFD"));
  assert.deepEqual(parsed.errors, []);
  assert.equal(parsed.questions.length, 1);
  assert.equal(parsed.questions[0].lesson, "Bài 2 · Tốc độ");
  assert.equal(parsed.questions[0].correctIndex, 1);
  assert.equal(parsed.questions[0].choices[1], "4 m/s");
  assert.equal(
    parsed.questions[0].explanation,
    "v = s/t = 20/5 = 4 m/s.\nĐơn vị tốc độ là mét trên giây.",
  );
  const multiline = parseQuestionWordText(
    wordQuestion
      .replace("Câu 1: ", "Câu 1:\n")
      .replace("A. 2 m/s", "A.\n2 m/s"),
  );
  assert.deepEqual(multiline, parseQuestionWordText(wordQuestion));
});

test("Word preview reports incomplete, invalid, repeated and duplicate blocks without silently accepting them", () => {
  const missing = parseQuestionWordText(
    `${wordQuestion}\n${wordQuestion.replace("D. 20 m/s\n", "")}`,
  );
  assert.equal(missing.questions.length, 1);
  assert.match(missing.errors[0], /Câu 2:.*D/);
  assert.match(
    parseQuestionWordText(wordQuestion.replace("Đáp án: B", "Đáp án: A và B"))
      .errors[0],
    /Đáp án phải/,
  );
  assert.match(
    parseQuestionWordText(wordQuestion.replace("B. 4 m/s", "B. 2 m/s"))
      .errors[0],
    /phương án phải khác/,
  );
  assert.match(
    parseQuestionWordText(wordQuestion.replace("B. 4 m/s", "A. 4 m/s"))
      .errors[0],
    /Nhãn A xuất hiện/,
  );
  assert.match(
    parseQuestionWordText(`${wordQuestion}\n${wordQuestion}`).errors[0],
    /trùng/,
  );
  assert.match(
    parseQuestionWordText("Một file Word không theo mẫu").errors[0],
    /Không tìm thấy/,
  );
  assert.match(
    parseQuestionWordText(Array(101).fill(wordQuestion).join("\n")).errors[0],
    /100 câu/,
  );
  assert.match(
    parseQuestionWordText(
      wordQuestion.replace("Bài 2 · Tốc độ", "x".repeat(121)),
    ).errors[0],
    /120 ký tự/,
  );
});

test("DOCX reader extracts only document XML and rejects invalid, missing, incomplete or oversized content", () => {
  const xml = "<document>Tiếng Việt &amp; câu hỏi</document>";
  assert.equal(
    readWordDocument(
      zipSync({
        "word/document.xml": strToU8(xml),
        "word/media/image1.bin": new Uint8Array(wordXmlLimit + 1),
      }),
    ),
    xml,
  );
  assert.throws(
    () => readWordDocument(strToU8("Not a Word document")),
    /không phải Word/,
  );
  assert.throws(
    () => readWordDocument(zipSync({ "something.xml": strToU8(xml) })),
    /thiếu nội dung/,
  );
  const archive = zipSync({ "word/document.xml": strToU8(xml) });
  assert.throws(
    () => readWordDocument(archive.subarray(0, 20)),
    /thiếu nội dung|Không đọc được/,
  );
  assert.throws(
    () =>
      readWordDocument(
        zipSync({ "word/document.xml": strToU8("x".repeat(wordXmlLimit + 1)) }),
      ),
    /Nội dung Word quá lớn/,
  );
  assert.throws(
    () => readWordDocument(new Uint8Array(5 * 1024 * 1024 + 1)),
    /5 MB/,
  );
});

test("downloadable Word template is a real DOCX with two editable sample question blocks", () => {
  const file = readFileSync(
    new URL("../public/templates/greenedu-cau-hoi-mau.docx", import.meta.url),
  );
  const xml = readWordDocument(file);
  assert.ok(xml.includes("Câu 1: ") && xml.includes("Câu 2: "));
  assert.ok(xml.includes("Đáp án: A") && xml.includes("Đáp án: B"));
  assert.ok(xml.includes("Bài học:") && xml.includes("Lời giải:"));
});

async function fixture(t: TestContext) {
  const db = openDatabase(":memory:");
  seedDemo(db);
  let clock = 1000000;
  const app = createApp(db, { now: () => clock, demo: true });
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}/api`;
  t.after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    db.close();
  });
  async function request(path: string, body?: unknown, cookie = "") {
    const response = await fetch(base + path, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        Cookie: cookie,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await response.json();
    return {
      status: response.status,
      data,
      cookie: response.headers.get("set-cookie")?.split(";")[0] ?? "",
    };
  }
  async function login(role: "teacher" | "student") {
    const r = await request("/auth/login", {
      email:
        role === "teacher" ? "giaovien@greenedu.nk" : "hocsinh@greenedu.nk",
      password: "GreenEdu123!",
    });
    assert.equal(r.status, 200);
    assert.ok(r.cookie.includes("greenedu_session"));
    return r.cookie;
  }
  return {
    db,
    request,
    login,
    base,
    advance: (ms: number) => {
      clock += ms;
    },
  };
}

test("authentication rejects invalid passwords, expires sessions and revokes logout", async (t) => {
  const f = await fixture(t);
  assert.equal((await f.request("/classrooms")).status, 401);
  assert.equal(
    (
      await f.request("/auth/login", {
        email: "hocsinh@greenedu.nk",
        password: "incorrect",
      })
    ).status,
    401,
  );
  const cookie = await f.login("student");
  const me = await f.request("/auth/me", undefined, cookie);
  assert.equal(me.data.role, "student");
  assert.equal(me.data.password, undefined);
  assert.equal((await f.request("/auth/logout", {}, cookie)).status, 200);
  assert.equal((await f.request("/auth/me", undefined, cookie)).status, 401);
  const next = await f.login("student");
  f.advance(8 * 86400000);
  assert.equal((await f.request("/auth/me", undefined, next)).status, 401);
});

test("wrong answer → notebook → correct repair; retries are idempotent and practice cannot clear notebook", async (t) => {
  const f = await fixture(t),
    cookie = await f.login("student");
  const questions = await f.request(
    "/chapters/chapter-1/questions",
    undefined,
    cookie,
  );
  assert.equal(questions.data.length, 3);
  assert.equal(questions.data[0].correctIndex, undefined);
  assert.equal(questions.data[0].explanation, undefined);
  const body = {
    questionId: "question-1",
    selected: 1,
    mode: "practice",
    requestId: randomUUID(),
  };
  let result = await f.request("/attempts", body, cookie);
  assert.equal(result.status, 200);
  assert.equal(result.data.correct, false);
  assert.equal((await f.request("/attempts", body, cookie)).status, 200);
  assert.equal(
    (f.db.prepare("SELECT COUNT(*) AS n FROM attempts").get() as any).n,
    1,
  );
  assert.equal(
    (await f.request("/corrections", undefined, cookie)).data.length,
    1,
  );
  assert.equal(
    (await f.request("/attempts", { ...body, selected: 0 }, cookie)).status,
    409,
  );
  await f.request(
    "/attempts",
    { ...body, selected: 0, requestId: randomUUID() },
    cookie,
  );
  assert.equal(
    (await f.request("/corrections", undefined, cookie)).data.length,
    1,
  );
  await f.request(
    "/attempts",
    { ...body, mode: "correction", requestId: randomUUID() },
    cookie,
  );
  const repair = {
    ...body,
    selected: 0,
    mode: "correction",
    requestId: randomUUID(),
  };
  result = await f.request("/attempts", repair, cookie);
  assert.equal(result.data.resolved, true);
  assert.equal((await f.request("/attempts", repair, cookie)).status, 200);
  assert.equal(
    (await f.request("/corrections", undefined, cookie)).data.length,
    0,
  );
  const classroom = (await f.request("/classrooms", undefined, cookie)).data[0];
  assert.equal(classroom.chapters[0].total, 4); // Includes failed and successful repair.
  assert.equal(classroom.chapters[0].correct, 2);
  // A new wrong practice answer reopens the same correction, without duplicates.
  await f.request("/attempts", { ...body, requestId: randomUUID() }, cookie);
  assert.equal(
    (await f.request("/corrections", undefined, cookie)).data.length,
    1,
  );
});

test("classroom boundaries prevent student writes and cross-teacher access", async (t) => {
  const f = await fixture(t),
    student = await f.login("student"),
    teacher = await f.login("teacher");
  f.db
    .prepare("INSERT INTO users VALUES (?,?,?,?,?,0)")
    .run(
      "other",
      "other@example.test",
      "Other",
      hashPassword("OtherPass123!"),
      "teacher",
    );
  f.db
    .prepare("INSERT INTO classrooms VALUES (?,?,?,?,?)")
    .run("private", "Private", "Math", "10", "other");
  f.db
    .prepare("INSERT INTO chapters VALUES (?,?,?)")
    .run("private-chapter", "private", "Private chapter");
  f.db
    .prepare(
      "INSERT INTO questions (id,chapter_id,text,choices,correct_index,explanation) VALUES (?,?,?,?,?,?)",
    )
    .run(
      "private-question",
      "private-chapter",
      "Question",
      '["a","b","c","d"]',
      0,
      "Explanation",
    );
  assert.equal(
    (
      await f.request(
        "/classrooms",
        { name: "Bad", subject: "Math", grade: "10" },
        student,
      )
    ).status,
    403,
  );
  assert.equal(
    (await f.request("/classrooms/private/students", undefined, teacher))
      .status,
    403,
  );
  assert.equal(
    (await f.request("/chapters/private-chapter/questions", undefined, student))
      .status,
    403,
  );
  assert.equal(
    (
      await f.request(
        "/attempts",
        {
          questionId: "private-question",
          selected: 0,
          mode: "practice",
          requestId: randomUUID(),
        },
        student,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await f.request(
        "/classrooms/class-demo/students/student-demo/password",
        { password: "NewPass123!" },
        student,
      )
    ).status,
    403,
  );
  assert.equal(
    (await f.request("/classrooms", undefined, teacher)).data.length,
    1,
  );
});

test("teacher creates a class, chapter, question and student; first-login password change is enforced", async (t) => {
  const f = await fixture(t),
    teacher = await f.login("teacher");
  const c = await f.request(
    "/classrooms",
    { name: "Lớp 11A1", subject: "Toán", grade: "11" },
    teacher,
  );
  assert.equal(c.status, 201);
  const ch = await f.request(
    `/classrooms/${c.data.id}/chapters`,
    { title: "Chương 1" },
    teacher,
  );
  assert.equal(ch.status, 201);
  const invalid = await f.request(
    `/chapters/${ch.data.id}/questions`,
    {
      text: "1+1?",
      choices: ["1", "1", "2", "3"],
      correctIndex: 2,
      explanation: "1+1=2",
    },
    teacher,
  );
  assert.equal(invalid.status, 400);
  const q = await f.request(
    `/chapters/${ch.data.id}/questions`,
    {
      text: "1+1?",
      choices: ["1", "2", "3", "4"],
      correctIndex: 1,
      explanation: "1+1=2",
    },
    teacher,
  );
  assert.equal(q.status, 201);
  const s = await f.request(
    `/classrooms/${c.data.id}/students`,
    {
      name: "Học sinh mới",
      email: "new@example.test",
      password: "TempPass123!",
    },
    teacher,
  );
  assert.equal(s.status, 201);
  let login = await f.request("/auth/login", {
    email: "new@example.test",
    password: "TempPass123!",
  });
  assert.equal(login.data.mustChange, true);
  assert.equal(
    (await f.request("/classrooms", undefined, login.cookie)).status,
    403,
  );
  assert.equal(
    (
      await f.request(
        "/auth/password",
        { currentPassword: "TempPass123!", newPassword: "OwnPass123!" },
        login.cookie,
      )
    ).status,
    200,
  );
  assert.equal(
    (await f.request("/classrooms", undefined, login.cookie)).data[0].id,
    c.data.id,
  );
  assert.equal(
    (
      await f.request(
        "/attempts",
        {
          questionId: q.data.id,
          selected: 1,
          mode: "practice",
          requestId: randomUUID(),
        },
        login.cookie,
      )
    ).data.correct,
    true,
  );
  const roster = await f.request(
    `/classrooms/${c.data.id}/students`,
    undefined,
    teacher,
  );
  assert.equal(roster.data[0].total, 1);
  assert.equal(roster.data[0].correct, 1);
  assert.equal(
    (
      await f.request(
        `/classrooms/${c.data.id}/students/${s.data.id}/password`,
        { password: "ResetPass123!" },
        teacher,
      )
    ).status,
    200,
  );
  assert.equal(
    (await f.request("/auth/me", undefined, login.cookie)).status,
    401,
  );
  login = await f.request("/auth/login", {
    email: "new@example.test",
    password: "ResetPass123!",
  });
  assert.equal(login.data.mustChange, true);
});

test("study time uses server clock; hidden tabs, gaps and replaced sessions earn no time", async (t) => {
  const f = await fixture(t),
    cookie = await f.login("student");
  const { data: s } = await f.request(
    "/study/start",
    { chapterId: "chapter-1" },
    cookie,
  );
  const pulse = (active = true, interacted = true) =>
    f.request(
      "/study/heartbeat",
      { sessionId: s.sessionId, active, interacted, seconds: 999999 },
      cookie,
    );
  f.advance(15000);
  let r = await pulse();
  assert.equal(r.data.seconds, 15);
  assert.equal(r.data.creditedSeconds, 15);
  f.advance(15000);
  r = await pulse(false, false);
  assert.equal(r.data.seconds, 15);
  assert.equal(r.data.creditedSeconds, 0);
  f.advance(15000);
  r = await pulse(true, true);
  assert.equal(r.data.seconds, 15);
  assert.equal(r.data.creditedSeconds, 0);
  f.advance(15000);
  r = await pulse();
  assert.equal(r.data.seconds, 30);
  assert.equal(r.data.creditedSeconds, 15);
  f.advance(60000);
  r = await pulse();
  assert.equal(r.data.seconds, 30);
  assert.equal(r.data.creditedSeconds, 0);
  f.advance(5000);
  await f.request("/study/stop", { sessionId: s.sessionId }, cookie);
  await f.request("/study/stop", { sessionId: s.sessionId }, cookie);
  assert.equal(
    (
      f.db
        .prepare(
          "SELECT seconds FROM progress WHERE student_id = ? AND chapter_id = ?",
        )
        .get("student-demo", "chapter-1") as any
    ).seconds,
    35,
  );
  const next = await f.request(
    "/study/start",
    { chapterId: "chapter-1" },
    cookie,
  );
  await f.request("/study/start", { chapterId: "chapter-2" }, cookie);
  assert.equal(
    (
      await f.request(
        "/study/heartbeat",
        { sessionId: next.data.sessionId, active: true, interacted: true },
        cookie,
      )
    ).status,
    409,
  );
});

test("idle session expires at two minutes, and tree level changes at exact hour thresholds", async (t) => {
  const f = await fixture(t),
    cookie = await f.login("student");
  const { data: s } = await f.request(
    "/study/start",
    { chapterId: "chapter-1" },
    cookie,
  );
  let result;
  for (let i = 0; i < 12; i++) {
    f.advance(15000);
    result = await f.request(
      "/study/heartbeat",
      { sessionId: s.sessionId, active: true, interacted: false },
      cookie,
    );
  }
  assert.equal(result!.status, 409);
  assert.equal(
    f.db
      .prepare(
        "SELECT seconds FROM progress WHERE student_id='student-demo' AND chapter_id='chapter-1'",
      )
      .get()!.seconds,
    0, // Policy closure discards all credit of this session, not earlier sessions.
  );
  const renewed = await f.request(
    "/study/start",
    { chapterId: "chapter-1" },
    cookie,
  );
  s.sessionId = renewed.data.sessionId;
  f.db
    .prepare(
      "UPDATE progress SET seconds = 3590 WHERE student_id = ? AND chapter_id = ?",
    )
    .run("student-demo", "chapter-1");
  await f.request(
    "/study/heartbeat",
    { sessionId: s.sessionId, active: true, interacted: true },
    cookie,
  );
  f.advance(15000);
  result = await f.request(
    "/study/heartbeat",
    { sessionId: s.sessionId, active: true, interacted: true },
    cookie,
  );
  assert.equal(result.data.seconds, 3605);
  assert.equal(result.data.level, 2);
  assert.deepEqual(
    [0, 3599, 3600, 7200, 10800, 14400, 99999].map(treeLevel),
    [1, 1, 2, 3, 4, 5, 5],
  );
});

test("cross-origin writes and non-JSON bodies are rejected; report neutralizes spreadsheet formulas", async (t) => {
  const f = await fixture(t),
    cookie = await f.login("teacher");
  const response = await fetch(f.base + "/classrooms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://evil.example",
      Cookie: cookie,
    },
    body: JSON.stringify({ name: "bad" }),
  });
  assert.equal(response.status, 403);
  assert.equal(
    (await fetch(f.base + "/auth/login", { method: "POST", body: "not-json" }))
      .status,
    415,
  );
  f.db
    .prepare("UPDATE users SET name = ? WHERE id = ?")
    .run('=HYPERLINK("evil")', "student-demo");
  const exported = await fetch(f.base + "/classrooms/class-demo/export", {
    headers: { Cookie: cookie },
  });
  assert.equal(exported.status, 200);
  const csv = await exported.text();
  assert.ok(csv.includes("'="));
  assert.ok(csv.includes("Phút học có hoạt động"));
});

test("questions group by lesson; filters stay inside the selected chapter", async (t) => {
  const f = await fixture(t),
    teacher = await f.login("teacher"),
    student = await f.login("student");
  const created = await f.request(
    "/chapters/chapter-1/questions",
    {
      text: "Câu hỏi theo bài",
      choices: ["a", "b", "c", "d"],
      correctIndex: 0,
      explanation: "Giải thích",
      lesson: "Bài 2 · Sai số",
    },
    teacher,
  );
  assert.equal(created.status, 201);
  const filtered = await f.request(
    "/chapters/chapter-1/questions?lesson=" +
      encodeURIComponent("Bài 2 · Sai số"),
    undefined,
    student,
  );
  assert.equal(filtered.data.length, 1);
  assert.equal(filtered.data[0].id, created.data.id);
  assert.equal(filtered.data[0].correctIndex, undefined);
  assert.equal(
    (
      await f.request(
        "/chapters/chapter-2/questions?lesson=" +
          encodeURIComponent("Bài 2 · Sai số"),
        undefined,
        student,
      )
    ).data.length,
    0,
  );
  const classes = await f.request("/classrooms", undefined, student);
  assert.deepEqual(
    classes.data[0].chapters[0].lessons.find(
      (l: any) => l.title === "Bài 2 · Sai số",
    ),
    { title: "Bài 2 · Sai số", questionCount: 1 },
  );
  assert.equal(
    (
      await f.request(
        "/chapters/chapter-1/questions?lesson=a&lesson=b",
        undefined,
        student,
      )
    ).status,
    400,
  );
});

test("community is visible only to class members and owner; it exposes no credentials or answers", async (t) => {
  const f = await fixture(t);
  const student = await f.login("student"),
    teacher = await f.login("teacher");
  f.db
    .prepare("INSERT INTO user_avatars(user_id,avatar_id) VALUES(?,?)")
    .run("teacher-demo", "teacher-1");
  f.db
    .prepare("INSERT INTO classrooms VALUES (?,?,?,?,?)")
    .run("other-class", "Other", "Math", "10", "teacher-demo");
  f.db
    .prepare(
      "INSERT INTO users (id,email,name,password,role) VALUES (?,?,?,?,?)",
    )
    .run(
      "other-teacher",
      "other@example.test",
      "Other teacher",
      hashPassword("OtherPass123!"),
      "teacher",
    );
  const other = await f.request("/auth/login", {
    email: "other@example.test",
    password: "OtherPass123!",
  });
  for (const endpoint of ["garden", "leaderboard"]) {
    assert.equal(
      (await f.request(`/classrooms/class-demo/${endpoint}`)).status,
      401,
    );
    assert.equal(
      (
        await f.request(
          `/classrooms/class-demo/${endpoint}`,
          undefined,
          other.cookie,
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await f.request(
          `/classrooms/other-class/${endpoint}`,
          undefined,
          student,
        )
      ).status,
      403,
    );
    assert.equal(
      (await f.request(`/classrooms/missing/${endpoint}`, undefined, student))
        .status,
      404,
    );
    const result = await f.request(
      `/classrooms/class-demo/${endpoint}`,
      undefined,
      student,
    );
    assert.equal(result.status, 200);
    assert.deepEqual(
      (
        await f.request(
          `/classrooms/class-demo/${endpoint}`,
          undefined,
          teacher,
        )
      ).data,
      result.data,
    );
    assert.equal(
      (
        await f.request(
          `/classrooms/other-class/${endpoint}`,
          undefined,
          teacher,
        )
      ).status,
      200,
    );
  }
  const empty = await f.request(
    "/classrooms/class-demo/leaderboard",
    undefined,
    student,
  );
  assert.equal(empty.data.participantCount, 3);
  assert.equal(empty.data.activeStudents, 0);
  assert.deepEqual(empty.data.effort, []);
  assert.deepEqual(empty.data.repairs, []);
  const teacherInfo = (
    await f.request("/classrooms/class-demo/garden", undefined, student)
  ).data.teacher;
  assert.deepEqual(teacherInfo, {
    name: f.db.prepare("SELECT name FROM users WHERE id=?").get("teacher-demo")!
      .name,
    avatarId: "teacher-1",
  });
  f.db
    .prepare("INSERT INTO progress VALUES (?,?,?)")
    .run("student-demo", "chapter-1", 14400);
  const board = (
    await f.request("/classrooms/class-demo/leaderboard", undefined, student)
  ).data;
  assert.deepEqual(Object.keys(board.effort[0]).sort(), [
    "bloomedTrees",
    "chapterLevels",
    "id",
    "name",
    "rank",
    "resolvedCorrections",
    "seconds",
    "studentLevel",
  ]);
  assert.deepEqual(board.effort[0].studentLevel, {
    level: 5,
    name: "Kết Trái",
    seconds: 14400,
    progressPercent: 100,
    remainingSeconds: 0,
  });
  const tree = (
    await f.request("/classrooms/class-demo/garden", undefined, student)
  ).data.trees[0];
  assert.deepEqual(Object.keys(tree).sort(), [
    "chapterId",
    "chapterTitle",
    "studentId",
    "studentName",
  ]);
});

test("class garden uses the four-hour threshold, one tree per chapter, and current class membership", async (t) => {
  const f = await fixture(t),
    student = await f.login("student");
  const progress = f.db.prepare("INSERT INTO progress VALUES (?,?,?)");
  progress.run("student-demo", "chapter-1", 14399);
  progress.run("student-demo", "chapter-2", 14400);
  progress.run("student-demo", "chapter-3", 28800);
  progress.run("student-2", "chapter-1", 14400);
  progress.run("student-3", "chapter-1", 50000);
  f.db.prepare("DELETE FROM memberships WHERE student_id = ?").run("student-3");
  f.db
    .prepare("INSERT INTO classrooms VALUES (?,?,?,?,?)")
    .run("other-class", "Other", "Math", "10", "teacher-demo");
  f.db
    .prepare("INSERT INTO chapters VALUES (?,?,?)")
    .run("other-chapter", "other-class", "Other chapter");
  progress.run("student-demo", "other-chapter", 50000);
  const first = await f.request(
    "/classrooms/class-demo/garden",
    undefined,
    student,
  );
  assert.equal(first.data.trees.length, 3);
  assert.equal(
    first.data.trees.filter((tree: any) => tree.chapterId === "chapter-3")
      .length,
    1,
  );
  assert.ok(
    first.data.trees.every(
      (tree: any) =>
        tree.studentId !== "student-3" && tree.chapterId !== "other-chapter",
    ),
  );
  const session = await f.request(
    "/study/start",
    { chapterId: "chapter-1" },
    student,
  );
  f.advance(2000);
  await f.request(
    "/study/heartbeat",
    { sessionId: session.data.sessionId, interacted: true, active: true },
    student,
  );
  const after = await f.request(
    "/classrooms/class-demo/garden",
    undefined,
    student,
  );
  assert.equal(after.data.trees.length, 4);
  assert.deepEqual(
    (await f.request("/classrooms/class-demo/garden", undefined, student)).data,
    after.data,
  );
  const board = (
    await f.request("/classrooms/class-demo/leaderboard", undefined, student)
  ).data;
  assert.equal(board.bloomedTrees, 4);
  assert.equal(board.participantCount, 2);
  assert.equal(board.totalSeconds, 72001);
});

test("effort uses time then flowers with shared ranks; repairs count distinct resolved questions", async (t) => {
  const f = await fixture(t),
    student = await f.login("student");
  const progress = f.db.prepare("INSERT INTO progress VALUES (?,?,?)");
  progress.run("student-demo", "chapter-1", 18010);
  progress.run("student-2", "chapter-1", 18010);
  progress.run("student-3", "chapter-1", 9000);
  progress.run("student-3", "chapter-2", 9010);
  const correction = f.db.prepare("INSERT INTO corrections VALUES (?,?,?,?)");
  for (const id of ["student-demo", "student-2"]) {
    correction.run(id, "question-1", 1, 1000);
    correction.run(id, "question-2", 1, 1000);
  }
  correction.run("student-3", "question-1", 1, 1000);
  correction.run("student-2", "question-3", 0, 1000);
  const board = (
    await f.request("/classrooms/class-demo/leaderboard", undefined, student)
  ).data;
  assert.deepEqual(
    board.effort.map((m: any) => m.rank),
    [1, 1, 3],
  );
  assert.equal(board.effort[2].id, "student-3");
  assert.deepEqual(
    board.repairs.map((m: any) => m.rank),
    [1, 1, 3],
  );
  assert.deepEqual(
    board.repairs.map((m: any) => m.resolvedCorrections),
    [2, 2, 1],
  );
  assert.equal(board.totalSeconds, 54030);
  assert.equal(board.activeStudents, 3);
  assert.equal(board.bloomedTrees, 2);
});

test("repair ranking updates after repair and retry, and removes a question when it is wrong again", async (t) => {
  const f = await fixture(t),
    student = await f.login("student");
  const answer = (selected: number, mode: string, requestId = randomUUID()) =>
    f.request(
      "/attempts",
      { questionId: "question-1", selected, mode, requestId },
      student,
    );
  await answer(1, "practice");
  assert.deepEqual(
    (await f.request("/classrooms/class-demo/leaderboard", undefined, student))
      .data.repairs,
    [],
  );
  const id = randomUUID();
  assert.equal((await answer(0, "correction", id)).status, 200);
  assert.equal((await answer(0, "correction", id)).status, 200);
  const board = (
    await f.request("/classrooms/class-demo/leaderboard", undefined, student)
  ).data;
  assert.equal(board.repairs[0].resolvedCorrections, 1);
  assert.equal(board.activeStudents, 1);
  assert.deepEqual(board.effort, []);
  await answer(1, "practice");
  assert.deepEqual(
    (await f.request("/classrooms/class-demo/leaderboard", undefined, student))
      .data.repairs,
    [],
  );
});

test("question edits preserve history while new corrections and practice use the new revision", async (t) => {
  const f = await fixture(t),
    teacher = await f.login("teacher"),
    student = await f.login("student");
  const before = (
    await f.request("/chapters/chapter-1/questions", undefined, teacher)
  ).data[0];
  const attempt = {
    questionId: before.id,
    selected: 1,
    mode: "practice",
    requestId: randomUUID(),
  };
  assert.equal(
    (await f.request("/attempts", attempt, student)).data.correct,
    false,
  );
  const update = {
    ...before,
    text: "Câu hỏi đã cập nhật",
    correctIndex: 1,
    explanation: "Lời giải mới",
  };
  const edit = await f.request(`/questions/${before.id}/edit`, update, teacher);
  assert.equal(edit.status, 200);
  assert.equal(edit.data.version, 2);
  assert.notEqual(edit.data.id, before.id);
  const retry = await f.request("/attempts", attempt, student);
  assert.equal(retry.status, 200);
  assert.equal(retry.data.correct, false);
  assert.equal(retry.data.correctIndex, undefined);
  assert.equal(
    retry.data.explanation,
    "Hãy xem lại kiến thức và tự làm lại câu này.",
  );
  assert.equal(
    f.db.prepare("SELECT explanation FROM questions WHERE id=?").get(before.id)!
      .explanation,
    before.explanation,
  );
  assert.equal(
    (
      await f.request(
        "/attempts",
        { ...attempt, requestId: randomUUID() },
        student,
      )
    ).status,
    409,
  );
  const current = (
    await f.request("/chapters/chapter-1/questions", undefined, student)
  ).data;
  assert.equal(current.length, 3);
  assert.ok(current.every((q: any) => q.id !== before.id));
  assert.equal(
    current.find((q: any) => q.id === edit.data.id).correctIndex,
    undefined,
  );
  const old = (
    await f.request(
      "/chapters/chapter-1/questions?mode=correction",
      undefined,
      student,
    )
  ).data;
  assert.equal(old.length, 1);
  assert.equal(old[0].text, update.text);
  assert.equal(old[0].sourceQuestionId, edit.data.id);
  assert.equal(old[0].correctIndex, undefined);
  assert.equal(
    (
      await f.request(
        "/attempts",
        {
          questionId: before.id,
          sourceQuestionId: edit.data.id,
          selected: 1,
          mode: "correction",
          requestId: randomUUID(),
        },
        student,
      )
    ).data.resolved,
    true,
  );
  assert.deepEqual(
    (await f.request("/corrections", undefined, student)).data,
    [],
  );
  assert.equal(
    (
      await f.request(
        "/attempts",
        {
          questionId: edit.data.id,
          selected: 1,
          mode: "practice",
          requestId: randomUUID(),
        },
        student,
      )
    ).data.correct,
    true,
  );
  const summary = (await f.request("/classrooms", undefined, student)).data[0]
    .chapters[0];
  assert.equal(summary.total, 3); // Original wrong + repair + new revision practice.
  assert.equal(summary.correct, 2);
  assert.equal(summary.questionCount, 3);
  assert.equal(
    (await f.request(`/questions/${before.id}/edit`, update, teacher)).status,
    409,
  );
  const history = (
    await f.request(`/questions/${edit.data.id}/history`, undefined, teacher)
  ).data;
  assert.deepEqual(
    history.map((q: any) => q.version),
    [2, 1],
  );
  assert.equal(history[1].correctIndex, 0);
});

test("hiding and restoring keeps attempts, edits stay hidden, and obsolete revisions cannot be restored", async (t) => {
  const f = await fixture(t),
    teacher = await f.login("teacher"),
    student = await f.login("student");
  const q = (
    await f.request("/chapters/chapter-1/questions", undefined, teacher)
  ).data[0];
  const unchanged = await f.request(`/questions/${q.id}/edit`, q, teacher);
  assert.equal(unchanged.data.id, q.id);
  assert.equal(unchanged.data.version, 1);
  assert.equal(
    (
      await f.request(
        `/questions/${q.id}/visibility`,
        { active: false },
        teacher,
      )
    ).status,
    200,
  );
  assert.equal(
    (await f.request("/chapters/chapter-1/questions", undefined, student)).data
      .length,
    2,
  );
  assert.equal(
    (
      await f.request(
        "/attempts",
        {
          questionId: q.id,
          selected: 0,
          mode: "practice",
          requestId: randomUUID(),
        },
        student,
      )
    ).status,
    409,
  );
  const edit = await f.request(
    `/questions/${q.id}/edit`,
    { ...q, text: "Bản sửa của câu ẩn" },
    teacher,
  );
  const hidden = (
    await f.request(
      "/chapters/chapter-1/questions?showHidden=1",
      undefined,
      teacher,
    )
  ).data;
  assert.equal(hidden.length, 3);
  assert.equal(hidden.find((r: any) => r.id === edit.data.id).active, false);
  assert.equal(
    (
      await f.request(
        `/questions/${q.id}/visibility`,
        { active: true },
        teacher,
      )
    ).status,
    409,
  );
  assert.equal(
    (
      await f.request(
        `/questions/${edit.data.id}/visibility`,
        { active: true },
        teacher,
      )
    ).status,
    200,
  );
  assert.equal(
    (await f.request("/chapters/chapter-1/questions", undefined, student)).data
      .length,
    3,
  );
  const third = await f.request(
    `/questions/${edit.data.id}/edit`,
    { ...q, text: "Bản sửa lần ba" },
    teacher,
  );
  assert.equal(third.data.version, 3);
  assert.deepEqual(
    (
      await f.request(`/questions/${q.id}/history`, undefined, teacher)
    ).data.map((r: any) => r.version),
    [3, 2, 1],
  );
});

test("question editing, hidden bank, history and import enforce ownership and reject invalid payloads", async (t) => {
  const f = await fixture(t),
    teacher = await f.login("teacher"),
    student = await f.login("student");
  f.db
    .prepare(
      "INSERT INTO users (id,email,name,password,role) VALUES (?,?,?,?,?)",
    )
    .run(
      "q-teacher",
      "q@example.test",
      "Other",
      hashPassword("OtherPass123!"),
      "teacher",
    );
  const other = (
    await f.request("/auth/login", {
      email: "q@example.test",
      password: "OtherPass123!",
    })
  ).cookie;
  const q = (
    await f.request("/chapters/chapter-1/questions", undefined, teacher)
  ).data[0];
  for (const cookie of [student, other]) {
    assert.equal(
      (await f.request(`/questions/${q.id}/edit`, q, cookie)).status,
      403,
    );
    assert.equal(
      (
        await f.request(
          `/questions/${q.id}/visibility`,
          { active: false },
          cookie,
        )
      ).status,
      403,
    );
    assert.equal(
      (await f.request(`/questions/${q.id}/history`, undefined, cookie)).status,
      403,
    );
    assert.equal(
      (
        await f.request(
          "/chapters/chapter-1/questions/import",
          { requestId: randomUUID(), questions: [q] },
          cookie,
        )
      ).status,
      403,
    );
  }
  assert.equal(
    (
      await f.request(
        "/chapters/chapter-1/questions?showHidden=1",
        undefined,
        student,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await f.request(
        `/questions/${q.id}/edit`,
        { ...q, choices: ["A", "A", "B", "C"] },
        teacher,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await f.request(
        `/questions/${q.id}/visibility`,
        { active: "false" },
        teacher,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await f.request(
        "/chapters/chapter-1/questions?mode=unknown",
        undefined,
        student,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await f.request(
        "/chapters/chapter-1/questions?showHidden=all",
        undefined,
        teacher,
      )
    ).status,
    400,
  );
});

test("bulk import validates all rows before saving, rejects duplicates and is idempotent", async (t) => {
  const f = await fixture(t),
    teacher = await f.login("teacher");
  const question = parseQuestionCsv(csvTemplate).questions[0];
  const requestId = randomUUID(),
    questions = [question, { ...question, text: "Câu thứ hai" }];
  const count = () =>
    Number(
      (f.db.prepare("SELECT COUNT(*) AS n FROM questions").get() as any).n,
    );
  assert.equal(
    (
      await f.request(
        "/chapters/chapter-1/questions/import",
        { requestId, questions: [question, { ...question, correctIndex: 7 }] },
        teacher,
      )
    ).status,
    400,
  );
  assert.equal(count(), 9);
  assert.equal(
    (
      await f.request(
        "/chapters/chapter-1/questions/import",
        { requestId, questions: [question, question] },
        teacher,
      )
    ).status,
    400,
  );
  assert.equal(count(), 9);
  const imported = await f.request(
    "/chapters/chapter-1/questions/import",
    { requestId, questions },
    teacher,
  );
  assert.equal(imported.status, 201);
  assert.equal(imported.data.ids.length, 2);
  assert.equal(count(), 11);
  const retry = await f.request(
    "/chapters/chapter-1/questions/import",
    { requestId, questions },
    teacher,
  );
  assert.equal(retry.status, 200);
  assert.deepEqual(retry.data, imported.data);
  assert.equal(count(), 11);
  assert.equal(
    (
      await f.request(
        "/chapters/chapter-1/questions/import",
        { requestId, questions: [{ ...question, text: "Changed" }] },
        teacher,
      )
    ).status,
    409,
  );
  assert.equal(
    (
      await f.request(
        "/chapters/chapter-1/questions/import",
        { requestId: randomUUID(), questions },
        teacher,
      )
    ).status,
    409,
  );
  assert.equal(count(), 11);
  assert.equal(
    (
      await f.request(
        "/chapters/chapter-1/questions/import",
        { requestId: randomUUID(), questions: Array(101).fill(question) },
        teacher,
      )
    ).status,
    400,
  );
  const large = Array.from({ length: 24 }, (_, i) => ({
    ...question,
    text: `${i}:` + "x".repeat(2900),
    explanation: "y".repeat(2900),
  }));
  assert.ok(JSON.stringify(large).length > 100 * 1024);
  assert.equal(
    (
      await f.request(
        "/chapters/chapter-1/questions/import",
        { requestId: randomUUID(), questions: large },
        teacher,
      )
    ).status,
    201,
  );
  assert.equal(count(), 35);
});

test("CSV import understands BOM, semicolons, quoted accents/newlines, and reports errors without discarding good preview rows", () => {
  assert.equal(parseQuestionCsv(csvTemplate).questions.length, 3);
  const cells = [
    "Bài, một",
    'Câu "đúng"\nở dòng sau?',
    "Một",
    "Hai",
    "Ba",
    "Bốn",
    "b",
    "Lời giải, có dấu",
  ];
  const source =
    "\uFEFF" +
    csvHeaders.join(";") +
    "\r\n" +
    cells.map((c) => '"' + c.replaceAll('"', '""') + '"').join(";") +
    "\r\n";
  const parsed = parseQuestionCsv(source);
  assert.deepEqual(parsed.errors, []);
  assert.equal(parsed.questions[0].text, cells[1]);
  assert.equal(parsed.questions[0].correctIndex, 1);
  assert.ok(parseQuestionCsv("Wrong,header\n1,2").errors.length);
  assert.ok(
    parseQuestionCsv(csvHeaders.join(",") + '\n"Unclosed').errors.length,
  );
  assert.ok(
    parseQuestionCsv(csvHeaders.join(",") + '\n"Closed"x,A,B,C,D,E,A,F').errors
      .length,
  );
  const duplicate = csvTemplate + csvTemplate.split("\r\n")[1] + "\r\n";
  assert.equal(parseQuestionCsv(duplicate).questions.length, 3);
  assert.match(parseQuestionCsv(duplicate).errors[0], /trùng/);
  const mixed =
    csvTemplate + "Bài 2,Câu lỗi,A,A,C,D,Z,Lời giải,,Trắc nghiệm\r\n";
  assert.equal(parseQuestionCsv(mixed).questions.length, 3);
  assert.equal(parseQuestionCsv(mixed).errors.length, 1);
});

test("question migration is additive and preserves a legacy question, attempts, notebook and study time", () => {
  const directory = mkdtempSync(join(tmpdir(), "greenedu-legacy-")),
    path = join(directory, "legacy.sqlite");
  try {
    const legacy = new DatabaseSync(path);
    legacy.exec(`
      CREATE TABLE users (id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,name TEXT NOT NULL,password TEXT NOT NULL,role TEXT NOT NULL,must_change INTEGER NOT NULL DEFAULT 0);
      CREATE TABLE classrooms (id TEXT PRIMARY KEY,name TEXT NOT NULL,subject TEXT NOT NULL,grade TEXT NOT NULL,teacher_id TEXT NOT NULL REFERENCES users(id));
      CREATE TABLE chapters (id TEXT PRIMARY KEY,classroom_id TEXT NOT NULL REFERENCES classrooms(id),title TEXT NOT NULL);
      CREATE TABLE questions (id TEXT PRIMARY KEY,chapter_id TEXT NOT NULL REFERENCES chapters(id),text TEXT NOT NULL,choices TEXT NOT NULL,correct_index INTEGER NOT NULL,explanation TEXT NOT NULL);
      CREATE TABLE attempts (id TEXT PRIMARY KEY,student_id TEXT NOT NULL REFERENCES users(id),question_id TEXT NOT NULL REFERENCES questions(id),selected INTEGER NOT NULL,correct INTEGER NOT NULL,mode TEXT NOT NULL,created_at INTEGER NOT NULL);
      CREATE TABLE corrections (student_id TEXT NOT NULL REFERENCES users(id),question_id TEXT NOT NULL REFERENCES questions(id),resolved INTEGER NOT NULL DEFAULT 0,updated_at INTEGER NOT NULL,PRIMARY KEY(student_id,question_id));
      CREATE TABLE progress (student_id TEXT NOT NULL REFERENCES users(id),chapter_id TEXT NOT NULL REFERENCES chapters(id),seconds REAL NOT NULL DEFAULT 0,PRIMARY KEY(student_id,chapter_id));
      INSERT INTO users VALUES ('old-student','old@example.test','Old','hash','student',0);
      INSERT INTO classrooms VALUES ('old-class','Old','Math','10','old-student');
      INSERT INTO chapters VALUES ('old-chapter','old-class','Old');
      INSERT INTO questions VALUES ('old-question','old-chapter','Old question','["A","B","C","D"]',0,'Old explanation');
      INSERT INTO attempts VALUES ('old-attempt','old-student','old-question',1,0,'practice',1000);
      INSERT INTO corrections VALUES ('old-student','old-question',0,1000);
      INSERT INTO progress VALUES ('old-student','old-chapter',7200);
    `);
    legacy.close();
    let db = openDatabase(path);
    db.close();
    db = openDatabase(path);
    const q = db
      .prepare("SELECT * FROM questions WHERE id = 'old-question'")
      .get() as any;
    assert.equal(q.text, "Old question");
    assert.equal(q.active, 1);
    assert.equal(q.is_current, 1);
    assert.equal(q.version, 1);
    assert.equal(q.lesson, "Bài luyện tập chung");
    assert.equal(
      (db.prepare("SELECT COUNT(*) AS n FROM attempts").get() as any).n,
      1,
    );
    assert.equal(
      (db.prepare("SELECT resolved FROM corrections").get() as any).resolved,
      0,
    );
    assert.equal(
      (db.prepare("SELECT seconds FROM progress").get() as any).seconds,
      7200,
    );
    db.close();
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("persistent database retains accounts and progress after reopening, and seed does not overwrite", () => {
  const directory = mkdtempSync(join(tmpdir(), "greenedu-test-")),
    path = join(directory, "app.sqlite");
  try {
    let db = openDatabase(path);
    seedDemo(db);
    db.prepare("INSERT INTO progress VALUES (?,?,?)").run(
      "student-demo",
      "chapter-1",
      7200,
    );
    db.close();
    db = openDatabase(path);
    seedDemo(db);
    assert.equal(
      (db.prepare("SELECT COUNT(*) AS n FROM users").get() as any).n,
      4,
    );
    assert.equal(
      (db.prepare("SELECT seconds FROM progress").get() as any).seconds,
      7200,
    );
    db.close();
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
