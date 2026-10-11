import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { openDatabase, seedDemo, hashPassword } from "./db.js";
import { createApp } from "./app.js";

async function fixture(t: TestContext) {
  const db = openDatabase(":memory:");
  seedDemo(db);
  db.prepare(
    "INSERT INTO users VALUES('other','other@test.local','GV khác',?,'teacher',0)",
  ).run(hashPassword("GreenEdu123!"));
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
    other = await login("other@test.local");
  const add = async (
    text: string,
    lesson = "Bài xóa thử",
    chapter = "chapter-1",
  ) => {
    const r = await request(
      `/chapters/${chapter}/questions`,
      {
        text,
        lesson,
        choices: ["A", "B", "C", "D"],
        correctIndex: 0,
        explanation: "Lời giải giữ lại",
      },
      teacher,
    );
    assert.equal(r.status, 201);
    return String(r.data.id);
  };
  const remove = (questionIds: unknown, cookie = teacher) =>
    request("/chapters/chapter-1/questions/delete", { questionIds }, cookie);
  return { db, request, teacher, student, other, add, remove };
}

test("bulk deletion requires the owning teacher and validates the entire set before any update", async (t) => {
  const f = await fixture(t),
    first = await f.add("Câu chọn 1"),
    second = await f.add("Câu chọn 2"),
    foreign = await f.add("Câu chương khác", "Bài xóa thử", "chapter-2");
  const before = f.db.prepare("SELECT * FROM questions ORDER BY id").all();
  for (const cookie of ["", f.student, f.other])
    assert.equal(
      (await f.remove([first, second], cookie)).status,
      cookie ? 403 : 401,
    );
  for (const ids of [
    null,
    "id",
    [],
    [null],
    [12],
    [""],
    ["x".repeat(101)],
    Array(5001).fill(first),
  ])
    assert.equal((await f.remove(ids)).status, 400);
  for (const ids of [
    [first, "missing"],
    [first, foreign],
  ])
    assert.equal((await f.remove(ids)).status, 404);
  assert.deepEqual(
    f.db.prepare("SELECT * FROM questions ORDER BY id").all(),
    before,
  );
  const classes = await f.request("/classrooms", undefined, f.teacher);
  assert.equal(classes.data[0].chapters[0].canDeleteQuestions, true);
  assert.equal(
    (await f.request("/classrooms", undefined, f.student)).data[0].chapters[0]
      .canDeleteQuestions,
    false,
  );
});

test("selected deletion is idempotent, retains versions and rejects stale selection atomically", async (t) => {
  const f = await fixture(t),
    first = await f.add("Câu có phiên bản"),
    second = await f.add("Câu thứ hai"),
    untouched = await f.add("Câu bài khác", "Bài giữ lại");
  const edited = await f.request(
    `/questions/${first}/edit`,
    {
      text: "Phiên bản mới",
      lesson: "Bài xóa thử",
      choices: ["A", "B", "C", "D"],
      correctIndex: 0,
      explanation: "Lời giải giữ lại",
    },
    f.teacher,
  );
  assert.equal(edited.status, 200);
  assert.equal((await f.remove([second, first])).status, 409);
  assert.equal(
    f.db.prepare("SELECT active FROM questions WHERE id=?").get(second)!.active,
    1,
  );
  const ids = [edited.data.id, second, second];
  const results = await Promise.all([f.remove(ids), f.remove(ids)]);
  assert.deepEqual(results.map((r) => r.data.hiddenQuestions).sort(), [0, 2]);
  assert.equal((await f.remove(ids)).data.hiddenQuestions, 0);
  assert.equal(
    f.db.prepare("SELECT active FROM questions WHERE id=?").get(untouched)!
      .active,
    1,
  );
  assert.equal(
    (
      await f.request(
        `/questions/${edited.data.id}/history`,
        undefined,
        f.teacher,
      )
    ).data.length,
    2,
  );
  assert.equal(f.db.prepare("PRAGMA foreign_key_check").all().length, 0);
});

test("deleting selected questions retains attempts, notebook and saved review snapshots", async (t) => {
  const f = await fixture(t),
    id = await f.add("Câu bảo toàn lịch sử");
  const requestId = randomUUID();
  const body = { questionId: id, selected: 1, mode: "practice", requestId };
  assert.equal((await f.request("/attempts", body, f.student)).status, 200);
  const review = await f.request(
    "/classrooms/class-demo/reviews",
    {
      chapterIds: ["chapter-1"],
      questionCount: 1,
      weights: {},
      requestId: randomUUID(),
    },
    f.student,
  );
  assert.equal(review.status, 201);
  f.db
    .prepare("INSERT INTO progress VALUES('student-demo','chapter-1',1234)")
    .run();
  const before = Object.fromEntries(
    ["attempts", "corrections", "progress", "review_sessions"].map((table) => [
      table,
      f.db.prepare(`SELECT * FROM ${table}`).all(),
    ]),
  );
  const all = f.db
    .prepare(
      "SELECT id FROM questions WHERE chapter_id='chapter-1' AND is_current=1",
    )
    .all()
    .map((q) => q.id);
  assert.equal((await f.remove(all)).status, 200);
  for (const [table, rows] of Object.entries(before))
    assert.deepEqual(f.db.prepare(`SELECT * FROM ${table}`).all(), rows);
  assert.equal(
    (await f.request("/chapters/chapter-1/questions", undefined, f.student))
      .data.length,
    0,
  );
  assert.ok(
    (
      await f.request(
        "/chapters/chapter-1/questions?mode=correction",
        undefined,
        f.student,
      )
    ).data.some((q: any) => q.id === id),
  );
  assert.equal((await f.request("/attempts", body, f.student)).status, 200);
  assert.equal(
    (
      await f.request(
        "/attempts",
        { ...body, requestId: randomUUID() },
        f.student,
      )
    ).status,
    409,
  );
  const savedReview = await f.request(
    `/learning/reviews/${review.data.id}`,
    undefined,
    f.student,
  );
  assert.equal(savedReview.status, 200);
  assert.equal(savedReview.data.questions.length, 1);
  const q = savedReview.data.questions[0];
  const correct = f.db
    .prepare("SELECT correct_index FROM questions WHERE id=?")
    .get(q.id)!.correct_index;
  assert.equal(
    (
      await f.request(
        `/learning/reviews/${review.data.id}/answer`,
        { questionId: q.id, selected: correct },
        f.student,
      )
    ).status,
    200,
  );
});
