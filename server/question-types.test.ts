import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createApp } from "./app.js";
import { openDatabase, seedDemo, hashPassword } from "./db.js";
import {
  csvTemplate,
  parseQuestionCsv,
  questionInput,
} from "../shared/questions.js";
import { parseQuestionWordText } from "../shared/word-questions.js";
import { answerCorrect } from "../shared/question-types.js";

const truth = {
  kind: "true-false",
  lesson: "Bài Trái đất",
  text: "Xác định tính đúng sai.",
  choices: ["Trái đất gần hình cầu.", "Trái đất là ngôi sao."],
  correctAnswer: "Đ S",
  explanation: "Trái đất là một hành tinh.",
};
const short = {
  kind: "short-answer",
  lesson: "Bài Hàm số",
  text: "Cho y=x^3-3x^2+2. Tìm giá trị cực đại.",
  choices: [],
  correctAnswer: "2",
  explanation: "Giá trị cực đại tại x=0 là 2.",
};
async function fixture(t: TestContext) {
  const db = openDatabase(":memory:");
  seedDemo(db);
  db.prepare("INSERT INTO users VALUES (?,?,?,?,?,0)").run(
    "other",
    "other@example.test",
    "Other",
    hashPassword("GreenEdu123!"),
    "teacher",
  );
  let clock = 1_000_000;
  const server = createApp(db, { now: () => clock }).listen(0, "127.0.0.1");
  await new Promise<void>((r) => server.once("listening", r));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = "http://127.0.0.1:" + address.port + "/api";
  t.after(async () => {
    await new Promise<void>((r) => server.close(() => r()));
    db.close();
  });
  async function request(path: string, body?: unknown, cookie = "") {
    const response = await fetch(base + path, {
      method: body === undefined ? "GET" : "POST",
      headers: { Cookie: cookie, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return {
      status: response.status,
      data: await response.json(),
      cookie: response.headers.get("set-cookie")?.split(";")[0] ?? "",
    };
  }
  const login = async (email: string) =>
    (await request("/auth/login", { email, password: "GreenEdu123!" })).cookie;
  const teacher = await login("giaovien@greenedu.nk"),
    student = await login("hocsinh@greenedu.nk"),
    other = await login("other@example.test");
  const post = async (path: string, body: unknown, cookie = student) => {
    const r = await request(path, body, cookie);
    assert.ok([200, 201].includes(r.status), JSON.stringify(r));
    return r.data;
  };
  return {
    db,
    request,
    post,
    teacher,
    student,
    other,
    advance: (ms: number) => (clock += ms),
    now: () => clock,
  };
}

test("Word/CSV support all three types and reject incomplete truth keys or malformed answers", () => {
  for (let mask = 0; mask < 16; mask++) {
    const bits = mask.toString(2).padStart(4, "0");
    const q = questionInput({
      ...truth,
      choices: ["Ý A", "Ý B", "Ý C", "Ý D"],
      correctAnswer: bits,
    });
    assert.equal(answerCorrect(q, bits), true);
  }
  const csv = parseQuestionCsv(csvTemplate);
  assert.deepEqual(csv.errors, []);
  assert.equal(csv.questions.length, 3);
  assert.equal(csv.questions[1].correctAnswer, "1101");
  assert.equal(csv.questions[2].correctAnswer, "2");
  const word = parseQuestionWordText(
    "Câu 1: Trái đất\nLoại câu hỏi: Đúng/sai\nBài học: Bài 1\na. Hình cầu\nb. Ngôi sao\nĐáp án: Đ S\nLời giải: Một hành tinh.\nCâu 2: Giá trị cực đại?\nDạng: Trả lời ngắn\nBài học: Bài 2\nĐáp án: 2\nLời giải: Tại x=0.",
  );
  assert.deepEqual(word.errors, []);
  assert.equal(word.questions.length, 2);
  assert.throws(() => questionInput({ ...truth, correctAnswer: "Đ" }));
  assert.throws(() => questionInput({ ...short, correctAnswer: "" }));
  assert.equal(answerCorrect(questionInput(short), " 2,0 "), true);
  assert.equal(answerCorrect(questionInput(short), "2+x"), false);
  assert.equal(
    answerCorrect(
      questionInput({ ...short, correctAnswer: "9007199254740992" }),
      "9007199254740993",
    ),
    false,
  );
  assert.equal(answerCorrect(questionInput(truth), "1?"), false);
});

test("typed questions preserve versions, hide keys until correct and expose notebooks only to the owning teacher", async (t) => {
  const f = await fixture(t);
  const a = await f.post("/chapters/chapter-1/questions", truth, f.teacher);
  const b = await f.post("/chapters/chapter-2/questions", short, f.teacher);
  const questions = (
    await f.request("/chapters/chapter-1/questions", undefined, f.student)
  ).data;
  const q = questions.find((q: any) => q.id === a.id);
  assert.equal(q.kind, "true-false");
  assert.equal(q.correctAnswer, undefined);
  const body = {
    questionId: a.id,
    selected: "11",
    mode: "practice",
    requestId: randomUUID(),
  };
  const wrong = await f.post("/attempts", body);
  assert.equal(wrong.correct, false);
  assert.equal(wrong.correctAnswer, undefined);
  assert.notEqual(wrong.explanation, truth.explanation);
  assert.deepEqual(wrong.statementCorrectness, [true, false]);
  assert.deepEqual(await f.post("/attempts", body), wrong);
  const edited = await f.post(
    `/questions/${a.id}/edit`,
    { ...truth, correctAnswer: "Đ Đ" },
    f.teacher,
  );
  assert.notEqual(edited.id, a.id);
  f.advance(1000);
  const stillWrong = await f.post("/attempts", {
    questionId: a.id,
    selected: "00",
    mode: "correction",
    requestId: randomUUID(),
  });
  assert.equal(stillWrong.correct, false);
  const right = await f.post("/attempts", {
    questionId: a.id,
    selected: "10",
    mode: "correction",
    requestId: randomUUID(),
  });
  assert.equal(right.correct, true);
  assert.equal(right.correctAnswer, "10");
  assert.equal(right.explanation, truth.explanation);
  const shortWrong = await f.post("/attempts", {
    questionId: b.id,
    selected: "3",
    mode: "practice",
    requestId: randomUUID(),
  });
  assert.equal(shortWrong.correctAnswer, undefined);
  const shortRight = await f.post("/attempts", {
    questionId: b.id,
    selected: "2,00",
    mode: "correction",
    requestId: randomUUID(),
  });
  assert.equal(shortRight.correct, true);
  assert.equal(shortRight.correctAnswer, "2");
  const path = "/classrooms/class-demo/students/student-demo/notebook";
  assert.equal((await f.request(path, undefined, f.student)).status, 403);
  assert.equal((await f.request(path, undefined, f.other)).status, 403);
  const notebook = (await f.request(path, undefined, f.teacher)).data;
  assert.equal(notebook.length, 2);
  assert.ok(notebook.every((q: any) => q.resolved));
  assert.equal(notebook.find((q: any) => q.id === a.id).correctAnswer, "10");
  assert.equal(notebook.find((q: any) => q.id === b.id).chapterId, "chapter-2");
  assert.deepEqual(
    notebook
      .find((q: any) => q.id === a.id)
      .wrongAnswers.map((a: any) => a.selected),
    ["11", "00"],
  );
  assert.deepEqual(
    notebook
      .find((q: any) => q.id === b.id)
      .wrongAnswers.map((a: any) => a.selected),
    ["3"],
  );
  assert.equal(
    notebook.find((q: any) => q.id === b.id).wrongAnswers[0].source,
    "Luyện tập",
  );
  const roster = (
    await f.request("/classrooms/class-demo/students", undefined, f.teacher)
  ).data;
  assert.equal(
    roster.find((s: any) => s.id === "student-demo").answeredQuestions,
    2,
  );
});

test("mixed reviews repeat as a new session, and uploaded exams autosave typed answers and grade without leaking keys", async (t) => {
  const f = await fixture(t);
  const chapter = await f.post(
    "/classrooms/class-demo/chapters",
    { title: "Bộ ba dạng" },
    f.teacher,
  );
  for (const content of [truth, short])
    await f.post(`/chapters/${chapter.id}/questions`, content, f.teacher);
  const review = await f.post("/classrooms/class-demo/reviews", {
    chapterIds: [chapter.id],
    questionCount: 0,
    requestId: randomUUID(),
  });
  const session = (
    await f.request(`/learning/reviews/${review.id}`, undefined, f.student)
  ).data;
  assert.ok(session.questions.every((q: any) => !("correctAnswer" in q)));
  for (const [index, q] of session.questions.entries()) {
    const result = await f.post(`/learning/reviews/${review.id}/answer`, {
      questionId: q.id,
      selected: q.kind === "true-false" ? "10" : "2.0",
    });
    assert.equal(result.correct, true);
    await f.post(`/learning/reviews/${review.id}/next`, { index: index + 1 });
  }
  const repeatBody = { requestId: randomUUID() };
  const repeated = await f.post(
    `/learning/reviews/${review.id}/repeat`,
    repeatBody,
  );
  assert.notEqual(repeated.id, review.id);
  assert.deepEqual(
    await f.post(`/learning/reviews/${review.id}/repeat`, repeatBody),
    repeated,
  );
  const fresh = (
    await f.request(`/learning/reviews/${repeated.id}`, undefined, f.student)
  ).data;
  assert.deepEqual(fresh.answers, {});
  assert.equal(fresh.currentIndex, 0);
  assert.equal(
    (await f.request(`/learning/reviews/${review.id}`, undefined, f.student))
      .data.completed,
    true,
  );
  await f.post(
    `/chapters/${chapter.id}/exam-access`,
    { enabled: true },
    f.teacher,
  );
  const exam = await f.post(
    "/classrooms/class-demo/exams",
    {
      title: "Ba dạng",
      source: "upload",
      chapterIds: [chapter.id],
      startsAt: f.now(),
      closesAt: f.now() + 600000,
      questions: [truth, short].map((question) => ({
        chapterId: chapter.id,
        question,
      })),
      requestId: randomUUID(),
    },
    f.teacher,
  );
  const run = await f.post("/classrooms/class-demo/exam-runs", {
    examId: exam.id,
    requestId: randomUUID(),
  });
  const room = (
    await f.request(`/learning/exam-runs/${run.id}`, undefined, f.student)
  ).data;
  assert.ok(room.questions.every((q: any) => !("correctAnswer" in q)));
  const answers = Object.fromEntries(
    room.questions.map((q: any) => [
      q.id,
      q.kind === "true-false" ? "11" : "2,0",
    ]),
  );
  const shortId = room.questions.find((q: any) => q.kind === "short-answer").id;
  const truthId = room.questions.find((q: any) => q.kind === "true-false").id;
  const draft = await f.post(`/learning/exam-runs/${run.id}/answers`, {
    revision: room.revision,
    answers: { [shortId]: "2,", [truthId]: "1?" },
  });
  assert.equal(draft.answers[shortId], "2,");
  assert.equal(draft.results, undefined);
  const saved = await f.post(`/learning/exam-runs/${run.id}/answers`, {
    revision: draft.revision,
    answers,
  });
  assert.equal(saved.answers[shortId], "2,0");
  assert.equal(saved.results, undefined);
  await f.post(`/learning/exam-runs/${run.id}/submit`, {});
  await f.post(
    `/learning/exams/${exam.id}/state`,
    { enabled: false },
    f.teacher,
  );
  const result = (
    await f.request(`/learning/exam-runs/${run.id}`, undefined, f.student)
  ).data;
  assert.equal(result.score, 5);
  assert.equal(result.results.filter((r: any) => r.correct).length, 1);
  const notebook = (
    await f.request(
      "/classrooms/class-demo/students/student-demo/notebook",
      undefined,
      f.teacher,
    )
  ).data;
  assert.deepEqual(
    notebook
      .find((q: any) => q.id === truthId)
      .wrongAnswers.map((entry: any) => entry.selected),
    ["11"],
  );
  assert.equal(
    notebook.find((q: any) => q.id === truthId).wrongAnswers[0].source,
    "Kiểm tra",
  );
});

test("study credit stays in the question chapter, excludes focus loss and sleep gaps, and cannot revive an expired session", async (t) => {
  const f = await fixture(t);
  assert.equal(
    (
      await f.request(
        "/study/start",
        { chapterId: "chapter-2", questionId: "question-1" },
        f.student,
      )
    ).status,
    400,
  );
  const s = await f.post("/study/start", {
    chapterId: "chapter-1",
    questionId: "question-1",
  });
  f.advance(15000);
  const first = await f.post("/study/heartbeat", {
    sessionId: s.sessionId,
    active: true,
    interacted: true,
  });
  assert.equal(first.creditedSeconds, 15);
  f.advance(15000);
  const hidden = await f.post("/study/heartbeat", {
    sessionId: s.sessionId,
    active: false,
    interacted: false,
  });
  assert.equal(hidden.creditedSeconds, 0);
  f.advance(45000);
  const wake = await f.post("/study/heartbeat", {
    sessionId: s.sessionId,
    active: true,
    interacted: false,
  });
  assert.equal(wake.creditedSeconds, 0);
  f.advance(120000);
  assert.equal(
    (
      await f.request(
        "/study/heartbeat",
        { sessionId: s.sessionId, active: true, interacted: true },
        f.student,
      )
    ).status,
    409,
  );
  assert.equal(
    f.db
      .prepare(
        "SELECT seconds FROM progress WHERE student_id='student-demo' AND chapter_id='chapter-1'",
      )
      .get()!.seconds,
    15,
  );
  assert.equal(
    f.db
      .prepare(
        "SELECT seconds FROM progress WHERE student_id='student-demo' AND chapter_id='chapter-2'",
      )
      .get(),
    undefined,
  );
  const paused = await f.post("/study/start", { chapterId: "chapter-2" });
  f.advance(15000);
  await f.post("/study/stop", { sessionId: paused.sessionId, active: false });
  assert.equal(
    f.db
      .prepare(
        "SELECT seconds FROM progress WHERE student_id='student-demo' AND chapter_id='chapter-2'",
      )
      .get()!.seconds,
    0,
  );
});
