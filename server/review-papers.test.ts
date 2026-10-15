import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { openDatabase, seedDemo, hashPassword } from "./db.js";
import { createApp } from "./app.js";
import { ensureLearningSchema } from "./learning-db.js";
import type { QuestionInput } from "../shared/questions.js";

async function fixture(t: TestContext) {
  const db = openDatabase(":memory:");
  seedDemo(db);
  db.prepare("INSERT INTO users VALUES(?,?,?,?,?,0)").run(
    "other-teacher",
    "other@review.test",
    "Giáo viên khác",
    hashPassword("GreenEdu123!"),
    "teacher",
  );
  db.prepare("INSERT INTO classrooms VALUES(?,?,?,?,?)").run(
    "other-class",
    "Lớp khác",
    "Toán",
    "11",
    "other-teacher",
  );
  db.prepare("INSERT INTO chapters VALUES(?,?,?)").run(
    "other-chapter",
    "other-class",
    "Chương khác",
  );
  const server = createApp(db).listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}/api`;
  t.after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    db.close();
  });
  async function request(path: string, body?: unknown, cookie = "") {
    const res = await fetch(base + path, {
      method: body === undefined ? "GET" : "POST",
      headers: { Cookie: cookie, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return {
      status: res.status,
      data: await res.json(),
      cookie: res.headers.get("set-cookie")?.split(";")[0] ?? "",
    };
  }
  const login = async (email: string) =>
    (await request("/auth/login", { email, password: "GreenEdu123!" })).cookie;
  const teacher = await login("giaovien@greenedu.nk"),
    student = await login("hocsinh@greenedu.nk"),
    peer = await login("minhkhoi@greenedu.nk"),
    other = await login("other@review.test");
  const post = async (path: string, body: unknown, cookie = teacher) => {
    const r = await request(path, body, cookie);
    assert.ok([200, 201].includes(r.status), JSON.stringify(r));
    return r.data;
  };
  const read = async (path: string, cookie = student) => {
    const r = await request(path, undefined, cookie);
    assert.equal(r.status, 200, JSON.stringify(r));
    return r.data;
  };
  const question: QuestionInput = {
    text: "Biên độ của x = 4cos(2t) cm?",
    lesson: "Bài ôn riêng",
    choices: ["4 cm", "2 cm", "8 cm", "1 cm"],
    correctIndex: 0,
    explanation: "Biên độ là 4 cm.",
  };
  const payload = () => ({
    title: "Ôn dao động tuần 1",
    chapterIds: ["chapter-1"],
    requestId: randomUUID(),
    questions: [{ chapterId: "chapter-1", question }],
  });
  return {
    db,
    request,
    post,
    read,
    teacher,
    student,
    peer,
    other,
    question,
    payload,
  };
}
const route = "/classrooms/class-demo/review-papers";

test("uploaded reviews require the owning teacher and validate the complete paper before writing", async (t) => {
  const f = await fixture(t);
  const counts = () =>
    ["questions", "review_blueprints", "review_papers"].map(
      (table) => f.db.prepare(`SELECT COUNT(*) n FROM ${table}`).get()!.n,
    );
  const before = counts();
  for (const cookie of [f.student, f.other])
    assert.equal((await f.request(route, f.payload(), cookie)).status, 403);
  for (const change of [
    { title: "" },
    { questions: [] },
    { questions: Array(101).fill(f.payload().questions[0]) },
    { chapterIds: ["other-chapter"] },
    { chapterIds: ["chapter-1", "chapter-1"] },
    { questions: [{ chapterId: "other-chapter", question: f.question }] },
    {
      questions: [
        f.payload().questions[0],
        {
          chapterId: "chapter-1",
          question: {
            ...f.question,
            text: "Câu không hợp lệ",
            correctIndex: 9,
          },
        },
      ],
    },
    { questions: [f.payload().questions[0], f.payload().questions[0]] },
    { chapterIds: ["chapter-1", "chapter-2"] },
  ]) {
    assert.ok(
      [400, 403].includes(
        (await f.request(route, { ...f.payload(), ...change }, f.teacher))
          .status,
      ),
    );
    assert.deepEqual(counts(), before);
  }
  f.db.exec(
    `CREATE TRIGGER fail_review_paper BEFORE INSERT ON review_papers BEGIN SELECT RAISE(ABORT,'test rollback'); END`,
  );
  assert.equal((await f.request(route, f.payload(), f.teacher)).status, 500);
  assert.deepEqual(counts(), before);
});

test("named uploaded reviews are private, retry-safe and leave bank, exams and progress unchanged", async (t) => {
  const f = await fixture(t);
  const bank = await f.read("/chapters/chapter-1/questions");
  const snapshot = () =>
    [
      "progress",
      "exam_definitions",
      "learning_rewards",
      "chapter_exam_access",
    ].map((table) => f.db.prepare(`SELECT * FROM ${table}`).all());
  const before = snapshot();
  const payload = f.payload();
  const created = await f.post(route, payload);
  assert.deepEqual(await f.post(route, payload), created);
  assert.equal(
    (await f.request(route, { ...payload, title: "Nội dung khác" }, f.teacher))
      .status,
    409,
  );
  assert.equal(
    f.db.prepare("SELECT COUNT(*) n FROM review_papers").get()!.n,
    1,
  );
  const overview = await f.read("/classrooms/class-demo/learning");
  assert.equal(overview.reviewPapers, true);
  assert.equal(overview.blueprints[0].id, created.id);
  assert.equal(overview.blueprints[0].title, payload.title);
  assert.equal(overview.blueprints[0].source, "upload");
  assert.equal(overview.blueprints[0].questionCount, 1);
  assert.ok(!JSON.stringify(overview.blueprints).includes("correctIndex"));
  assert.ok(
    !JSON.stringify(overview.blueprints).includes(f.question.explanation),
  );
  assert.deepEqual(await f.read("/chapters/chapter-1/questions"), bank);
  assert.deepEqual(snapshot(), before);
  assert.equal(
    (
      await f.request(
        "/classrooms/other-class/reviews",
        { blueprintId: created.id, requestId: randomUUID() },
        f.student,
      )
    ).status,
    403,
  );
});

test("students resume, answer and repeat an uploaded paper snapshot while wrong answers stay hidden", async (t) => {
  const f = await fixture(t);
  const paper = f.payload();
  paper.questions.push({
    chapterId: "chapter-1",
    question: {
      ...f.question,
      text: "Chu kỳ khi tần số là 2 Hz?",
      kind: "short-answer",
      choices: [],
      correctAnswer: "0.5",
      correctIndex: 0,
    },
  });
  const created = await f.post(route, paper);
  const body = { blueprintId: created.id, requestId: randomUUID() };
  const session = await f.post(
    "/classrooms/class-demo/reviews",
    body,
    f.student,
  );
  assert.deepEqual(
    await f.post("/classrooms/class-demo/reviews", body, f.student),
    session,
  );
  const review = await f.read(`/learning/reviews/${session.id}`);
  assert.equal(review.title, paper.title);
  assert.equal(review.questions.length, 2);
  assert.equal(
    (await f.request(`/learning/reviews/${session.id}`, undefined, f.peer))
      .status,
    404,
  );
  assert.ok(
    review.questions.every(
      (q: Record<string, unknown>) =>
        !("correctIndex" in q) &&
        !("correctAnswer" in q) &&
        !("explanation" in q),
    ),
  );
  for (const [index, q] of review.questions.entries()) {
    const result = await f.post(
      `/learning/reviews/${session.id}/answer`,
      { questionId: q.id, selected: q.kind === "short-answer" ? "100" : 1 },
      f.student,
    );
    assert.equal(result.correct, false);
    assert.ok(!("correctIndex" in result));
    assert.ok(!("correctAnswer" in result));
    assert.notEqual(result.explanation, f.question.explanation);
    await f.post(
      `/learning/reviews/${session.id}/next`,
      { index: index + 1 },
      f.student,
    );
  }
  const completed = await f.read(`/learning/reviews/${session.id}`);
  assert.equal(completed.completed, true);
  assert.equal(
    f.db
      .prepare(
        "SELECT COUNT(*) n FROM corrections WHERE student_id='student-demo'",
      )
      .get()!.n,
    2,
  );
  const notebook = await f.read("/corrections");
  assert.ok(
    notebook.some((q: { id: string }) => q.id === review.questions[0].id),
  );
  const repeat = { requestId: randomUUID() };
  const again = await f.post(
    `/learning/reviews/${session.id}/repeat`,
    repeat,
    f.student,
  );
  assert.notEqual(again.id, session.id);
  assert.deepEqual(
    await f.post(`/learning/reviews/${session.id}/repeat`, repeat, f.student),
    again,
  );
  const fresh = await f.read(`/learning/reviews/${again.id}`);
  assert.deepEqual(
    new Set(fresh.questions.map((q: { id: string }) => q.id)),
    new Set(review.questions.map((q: { id: string }) => q.id)),
  );
  assert.equal(fresh.currentIndex, 0);
  assert.deepEqual(fresh.answers, {});
  const q = fresh.questions[0];
  const result = await f.post(
    `/learning/reviews/${again.id}/answer`,
    { questionId: q.id, selected: q.kind === "short-answer" ? "0,5" : 0 },
    f.student,
  );
  assert.equal(result.correct, true);
  assert.equal(result.explanation, f.question.explanation);
  assert.deepEqual(
    (await f.read(`/learning/reviews/${session.id}`)).answers,
    completed.answers,
  );
});

test("uploaded reviews obey classroom chapter gates and active exam locks without spending tickets", async (t) => {
  const f = await fixture(t);
  const paper = await f.post(route, f.payload());
  const start = () => ({ blueprintId: paper.id, requestId: randomUUID() });
  await f.post("/chapters/chapter-1/practice-access", { enabled: false });
  assert.equal(
    (await f.request("/classrooms/class-demo/reviews", start(), f.student))
      .status,
    403,
  );
  await f.post("/chapters/chapter-1/practice-access", { enabled: true });
  const session = await f.post(
    "/classrooms/class-demo/reviews",
    start(),
    f.student,
  );
  const exam = await f.post("/classrooms/class-demo/exams", {
    title: "Kiểm tra riêng",
    chapterIds: ["chapter-2"],
    source: "bank",
    questionCount: 1,
    startsAt: Date.now(),
    closesAt: Date.now() + 3600000,
  });
  const run = await f.post(
    "/classrooms/class-demo/exam-runs",
    { examId: exam.id, requestId: randomUUID() },
    f.student,
  );
  assert.ok(run.id);
  assert.equal(
    (await f.request("/classrooms/class-demo/reviews", start(), f.student))
      .status,
    409,
  );
  assert.equal(
    (await f.request(`/learning/reviews/${session.id}`, undefined, f.student))
      .status,
    409,
  );
  assert.equal(
    f.db
      .prepare(
        "SELECT COUNT(*) n FROM learning_tickets WHERE used_by IS NOT NULL",
      )
      .get()!.n,
    0,
  );
  assert.equal(
    f.db.prepare("SELECT COUNT(*) n FROM learning_rewards").get()!.n,
    0,
  );
});

test("review upload accepts full-size valid question batches beyond the default JSON body limit", async (t) => {
  const f = await fixture(t);
  const body = {
    ...f.payload(),
    questions: Array.from({ length: 100 }, (_, i) => ({
      chapterId: "chapter-1",
      question: {
        ...f.question,
        text: `Câu ${i}: ` + "x".repeat(1500),
        explanation: "y".repeat(1500),
      },
    })),
  };
  assert.ok(JSON.stringify(body).length > 100 * 1024);
  const result = await f.post(route, body);
  assert.equal(
    f.db
      .prepare("SELECT question_count FROM review_blueprints WHERE id=?")
      .get(result.id)!.question_count,
    100,
  );
});

test("additive review schema preserves legacy blueprints and sessions on repeated migration", () => {
  const db = openDatabase(":memory:");
  try {
    seedDemo(db);
    db.exec("DROP TABLE review_paper_sessions; DROP TABLE review_papers;");
    db.prepare("INSERT INTO review_blueprints VALUES(?,?,?,?,?,?,?)").run(
      "legacy",
      "class-demo",
      "Ôn cũ",
      '["chapter-1"]',
      1,
      "{}",
      123,
    );
    const before = db.prepare("SELECT * FROM review_blueprints").all();
    const questions = db.prepare("SELECT * FROM questions").all();
    ensureLearningSchema(db);
    ensureLearningSchema(db);
    assert.deepEqual(
      db.prepare("SELECT * FROM review_blueprints").all(),
      before,
    );
    assert.deepEqual(db.prepare("SELECT * FROM questions").all(), questions);
    assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
  } finally {
    db.close();
  }
});
