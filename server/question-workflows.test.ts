import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { openDatabase, seedDemo, hashPassword } from "./db.js";
import { createApp } from "./app.js";
import { ensureClassManagementSchema } from "./class-management.js";
import { huntPaperFingerprint } from "./hunt-papers.js";

async function fixture(t: TestContext) {
  const db = openDatabase(":memory:");
  seedDemo(db);
  db.prepare(
    "INSERT INTO users VALUES('outside','outside@test.local','Other',?,'teacher',0)",
  ).run(hashPassword("GreenEdu123!"));
  const now = Date.now(),
    server = createApp(db, { now: () => now }).listen(0, "127.0.0.1");
  await new Promise<void>((r) => server.once("listening", r));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  t.after(async () => {
    await new Promise<void>((r) => server.close(() => r()));
    db.close();
  });
  const base = `http://127.0.0.1:${address.port}/api`;
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
    outside = await login("outside@test.local");
  const post = async (path: string, body: unknown, cookie = teacher) => {
    const r = await request(path, body, cookie);
    assert.ok([200, 201].includes(r.status), JSON.stringify(r));
    return r.data;
  };
  const eligible = () => {
    db.prepare(
      "INSERT INTO progress VALUES('student-demo','chapter-1',14400)",
    ).run();
    db.prepare(
      "INSERT INTO attempts VALUES(?,'student-demo','question-1',0,1,'practice',?)",
    ).run(randomUUID(), now);
  };
  return { db, now, request, post, teacher, student, outside, eligible };
}
const question = (slot: number) => ({
  text: `Câu riêng đề ${slot}`,
  choices: ["A", "B", "C", "D"],
  correctIndex: 0,
  lesson: "Bài luyện tập chung",
  explanation: "Đáp án A",
});
const papers = [1, 2, 3].map((slot) => ({
  slot,
  questions: [{ chapterId: "chapter-1", question: question(slot) }],
}));
const hunt = "/chapters/chapter-1/hunt-access";

test("hunt migration retains the legacy paper as slot one without resetting time, tickets or rewards", async (t) => {
  const f = await fixture(t);
  f.eligible();
  const snapshot = JSON.stringify([
    {
      ...question(1),
      id: "question-1",
      chapterId: "chapter-1",
      chapterTitle: "Chương 1",
    },
  ]);
  f.db
    .prepare(
      "INSERT INTO chapter_hunt_settings VALUES('chapter-1',?,123,'Đề cũ',20,0,4,?,?)",
    )
    .run(snapshot, f.now, f.now + 1200000);
  const before = f.db.prepare("SELECT * FROM progress").all();
  f.db
    .prepare(
      "INSERT INTO learning_tickets VALUES('student-demo','chapter-1',3,NULL,?)",
    )
    .run(f.now);
  f.db
    .prepare(
      "INSERT INTO learning_rewards(id,student_id,classroom_id,source,label,points,created_at) VALUES('legacy-reward','student-demo','class-demo','exam:legacy','Legacy',1,?)",
    )
    .run(f.now);
  const tickets = f.db.prepare("SELECT * FROM learning_tickets").all(),
    rewards = f.db.prepare("SELECT * FROM learning_rewards").all();
  ensureClassManagementSchema(f.db);
  ensureClassManagementSchema(f.db);
  assert.deepEqual(
    f.db
      .prepare("SELECT * FROM chapter_hunt_papers")
      .all()
      .map((row) => ({ ...row })),
    [
      {
        chapter_id: "chapter-1",
        slot: 1,
        questions: snapshot,
        title: "Đề cũ",
        uploaded_at: 123,
      },
    ].map((row) => ({ ...row })),
  );
  assert.deepEqual(f.db.prepare("SELECT * FROM progress").all(), before);
  assert.deepEqual(
    f.db.prepare("SELECT * FROM learning_tickets").all(),
    tickets,
  );
  assert.deepEqual(
    f.db.prepare("SELECT * FROM learning_rewards").all(),
    rewards,
  );
  assert.equal(
    f.db.prepare("SELECT COUNT(*) n FROM chapter_hunt_papers").get()!.n,
    1,
  );
});

test("three tickets use three different papers; replay cannot consume another ticket or earn another reward", async (t) => {
  const f = await fixture(t);
  f.eligible();
  const body = {
    enabled: true,
    preparationMinutes: 0,
    papers,
    requestId: randomUUID(),
  };
  await f.post(hunt, body);
  const before = f.db.prepare("SELECT * FROM chapter_hunt_papers").all();
  await f.post(hunt, body);
  assert.deepEqual(
    f.db.prepare("SELECT * FROM chapter_hunt_papers").all(),
    before,
  );
  for (let slot = 1; slot <= 3; slot++) {
    const payload = { chapterId: "chapter-1", requestId: randomUUID() };
    const [a, b] = await Promise.all([
      f.post("/classrooms/class-demo/exam-runs", payload, f.student),
      f.post("/classrooms/class-demo/exam-runs", payload, f.student),
    ]);
    assert.equal(a.id, b.id);
    const path = `/learning/exam-runs/${a.id}`;
    const run = (await f.request(path, undefined, f.student)).data;
    assert.equal(run.questions[0].text, question(slot).text);
    await f.post(
      path + "/answers",
      { revision: 0, answers: { [run.questions[0].id]: 0 } },
      f.student,
    );
    assert.equal((await f.post(path + "/submit", {}, f.student)).score, 10);
    await f.post(path + "/submit", {}, f.student);
    assert.equal(
      f.db
        .prepare(
          "SELECT COUNT(*) n FROM learning_tickets WHERE used_by IS NOT NULL",
        )
        .get()!.n,
      slot,
    );
  }
  assert.equal(
    (
      await f.request(
        "/classrooms/class-demo/exam-runs",
        { chapterId: "chapter-1", requestId: randomUUID() },
        f.student,
      )
    ).status,
    403,
  );
  assert.equal(
    f.db
      .prepare(
        "SELECT COUNT(*) n FROM learning_rewards WHERE source LIKE 'exam:%'",
      )
      .get()!.n,
    3,
  );
});

test("duplicate papers, missing next slots, reused legacy content and unauthorized uploads are rejected without spending tickets", async (t) => {
  const f = await fixture(t);
  f.eligible();
  for (const cookie of [f.student, f.outside])
    assert.equal(
      (await f.request(hunt, { enabled: true, papers }, cookie)).status,
      403,
    );
  const duplicate = papers.map((p) => ({
    ...p,
    questions: [
      {
        chapterId: "chapter-1",
        question: {
          ...question(1),
          choices: ["D", "C", "B", "A"],
          correctIndex: 3,
        },
      },
    ],
  }));
  assert.equal(
    (await f.request(hunt, { enabled: true, papers: duplicate }, f.teacher))
      .status,
    400,
  );
  assert.equal(
    f.db.prepare("SELECT COUNT(*) n FROM chapter_hunt_papers").get()!.n,
    0,
  );
  await f.post(hunt, {
    enabled: true,
    preparationMinutes: 0,
    papers: papers.slice(0, 1),
  });
  const { id } = await f.post(
    "/classrooms/class-demo/exam-runs",
    { chapterId: "chapter-1", requestId: randomUUID() },
    f.student,
  );
  const run = (
    await f.request(`/learning/exam-runs/${id}`, undefined, f.student)
  ).data;
  await f.post(
    `/learning/exam-runs/${id}/answers`,
    { revision: 0, answers: { [run.questions[0].id]: 0 } },
    f.student,
  );
  await f.post(`/learning/exam-runs/${id}/submit`, {}, f.student);
  const used = () =>
    f.db
      .prepare(
        "SELECT COUNT(*) n FROM learning_tickets WHERE used_by IS NOT NULL",
      )
      .get()!.n;
  const start = () =>
    f.request(
      "/classrooms/class-demo/exam-runs",
      { chapterId: "chapter-1", requestId: randomUUID() },
      f.student,
    );
  assert.equal((await start()).status, 403);
  assert.equal(used(), 1);
  f.db
    .prepare(
      "INSERT INTO chapter_hunt_papers SELECT chapter_id,2,questions,title,uploaded_at FROM chapter_hunt_papers WHERE slot=1",
    )
    .run();
  assert.equal((await start()).status, 403);
  assert.equal(used(), 1);
  ensureClassManagementSchema(f.db);
  ensureClassManagementSchema(f.db);
  assert.equal(
    f.db.prepare("SELECT COUNT(*) n FROM chapter_hunt_papers").get()!.n,
    2,
  );
  assert.equal(
    huntPaperFingerprint([question(1)]),
    huntPaperFingerprint([{ ...question(1), choices: ["D", "C", "B", "A"] }]),
  );
});

test("notebook editing resolves latest source, updates reusable papers for everyone, preserves submitted history and enforces ownership/stale writes", async (t) => {
  const f = await fixture(t);
  f.eligible();
  await f.post(hunt, { enabled: true, preparationMinutes: 0, papers });
  const { id } = await f.post(
    "/classrooms/class-demo/exam-runs",
    { chapterId: "chapter-1", requestId: randomUUID() },
    f.student,
  );
  const path = `/learning/exam-runs/${id}`;
  const run = (await f.request(path, undefined, f.student)).data,
    q = run.questions[0];
  await f.post(
    path + "/answers",
    { revision: 0, answers: { [q.id]: 1 } },
    f.student,
  );
  await f.post(path + "/submit", {}, f.student);
  const frozen = f.db
    .prepare("SELECT questions,answers,score FROM exam_runs WHERE id=?")
    .get(id);
  const sourcePath = `/questions/${q.id}/edit-source`,
    editPath = `/questions/${q.id}/notebook-edit`;
  for (const cookie of [f.student, f.outside])
    assert.equal((await f.request(sourcePath, undefined, cookie)).status, 403);
  const source = (await f.request(sourcePath, undefined, f.teacher)).data;
  assert.equal(source.privateQuestion, true);
  const content = {
    ...question(1),
    text: "Đã sửa cho mọi học sinh",
    correctIndex: 2,
    expectedId: source.question.id,
  };
  assert.equal(
    (await f.request(editPath, { ...content, text: "" }, f.teacher)).status,
    400,
  );
  const revised = await f.post(editPath, content);
  assert.equal(revised.version, 2);
  assert.deepEqual(
    f.db
      .prepare("SELECT questions,answers,score FROM exam_runs WHERE id=?")
      .get(id),
    frozen,
  );
  const next = JSON.parse(
    String(
      f.db
        .prepare("SELECT questions FROM chapter_hunt_papers WHERE slot=1")
        .get()!.questions,
    ),
  )[0];
  assert.equal(next.text, content.text);
  assert.equal(next.correctIndex, 2);
  assert.equal(next.id, revised.id);
  assert.equal(
    f.db.prepare("SELECT active FROM questions WHERE id=?").get(revised.id)!
      .active,
    0,
  );
  assert.equal(
    f.db.prepare("SELECT is_current FROM questions WHERE id=?").get(revised.id)!
      .is_current,
    0,
  );
  assert.equal(
    (await f.request(sourcePath, undefined, f.teacher)).data.question.id,
    revised.id,
  );
  assert.equal((await f.request(editPath, content, f.teacher)).status, 409);
  assert.equal(
    f.db
      .prepare("SELECT question_id FROM corrections WHERE student_id=?")
      .get("student-demo")!.question_id,
    q.id,
  );
  const notebook = (
    await f.request(
      "/classrooms/class-demo/students/student-demo/notebook",
      undefined,
      f.teacher,
    )
  ).data;
  assert.equal(
    notebook.find((item: any) => item.id === q.id).canEditSource,
    true,
  );
  f.db.exec(
    "CREATE TRIGGER reject_source_update BEFORE UPDATE ON chapter_hunt_settings BEGIN SELECT RAISE(ABORT,'expected source rollback'); END",
  );
  assert.equal(
    (
      await f.request(
        editPath,
        { ...content, text: "Không được lưu dở", expectedId: revised.id },
        f.teacher,
      )
    ).status,
    500,
  );
  assert.equal(
    (await f.request(sourcePath, undefined, f.teacher)).data.question.id,
    revised.id,
  );
  assert.equal(
    JSON.parse(
      String(
        f.db
          .prepare("SELECT questions FROM chapter_hunt_papers WHERE slot=1")
          .get()!.questions,
      ),
    )[0].text,
    content.text,
  );
  assert.deepEqual(
    f.db
      .prepare("SELECT questions,answers,score FROM exam_runs WHERE id=?")
      .get(id),
    frozen,
  );
});

test("editing a bank source from notebook updates the current bank version", async (t) => {
  const f = await fixture(t);
  f.db
    .prepare("INSERT INTO corrections VALUES('student-demo','question-1',0,?)")
    .run(f.now);
  const source = (
    await f.request("/questions/question-1/edit-source", undefined, f.teacher)
  ).data;
  assert.equal(source.privateQuestion, false);
  const content = {
    ...source.question,
    text: "Câu ngân hàng đã sửa",
    expectedId: source.question.id,
  };
  const snapshot = JSON.stringify([
    { ...source.question, chapterTitle: "Chương 1" },
  ]);
  for (const [id, start] of [
    ["future-source", f.now + 3600000],
    ["started-source", f.now - 1000],
  ] as const)
    f.db
      .prepare(
        "INSERT INTO exam_definitions VALUES(?,'class-demo','Snapshot',?,?,?,4,1,?)",
      )
      .run(id, snapshot, start, f.now + 7200000, f.now);
  f.db
    .prepare(
      "INSERT INTO review_blueprints VALUES('source-blueprint','class-demo','Review','[\"chapter-1\"]',1,'{}',?)",
    )
    .run(f.now);
  f.db
    .prepare(
      "INSERT INTO review_papers VALUES('source-blueprint','teacher-demo','source-request','source-fingerprint',?)",
    )
    .run(snapshot);
  f.db
    .prepare(
      "INSERT INTO review_sessions(id,student_id,classroom_id,title,questions,request_id,created_at) VALUES('frozen-review','student-demo','class-demo','Review',?,'frozen-review-request',?)",
    )
    .run(snapshot, f.now);
  const saved = await f.post("/questions/question-1/notebook-edit", content);
  const current = (
    await f.request("/chapters/chapter-1/questions", undefined, f.teacher)
  ).data;
  assert.ok(
    current.some((q: any) => q.id === saved.id && q.text === content.text),
  );
  assert.ok(!current.some((q: any) => q.id === "question-1"));
  assert.equal(
    (await f.request("/questions/question-1/edit-source", undefined, f.teacher))
      .data.question.id,
    saved.id,
  );
  assert.equal(
    JSON.parse(
      String(
        f.db
          .prepare(
            "SELECT questions FROM exam_definitions WHERE id='future-source'",
          )
          .get()!.questions,
      ),
    )[0].id,
    saved.id,
  );
  assert.equal(
    f.db
      .prepare(
        "SELECT questions FROM exam_definitions WHERE id='started-source'",
      )
      .get()!.questions,
    snapshot,
  );
  assert.equal(
    JSON.parse(
      String(
        f.db
          .prepare(
            "SELECT questions FROM review_papers WHERE blueprint_id='source-blueprint'",
          )
          .get()!.questions,
      ),
    )[0].id,
    saved.id,
  );
  assert.equal(
    f.db
      .prepare("SELECT questions FROM review_sessions WHERE id='frozen-review'")
      .get()!.questions,
    snapshot,
  );
  assert.ok(
    (
      await f.request("/chapters/chapter-1/questions", undefined, f.student)
    ).data.some(
      (q: any) =>
        q.id === saved.id &&
        q.text === content.text &&
        q.correctIndex === undefined,
    ),
  );
});
