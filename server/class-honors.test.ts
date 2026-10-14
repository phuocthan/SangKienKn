import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { openDatabase, seedDemo, hashPassword } from "./db.js";
import { createApp } from "./app.js";

async function fixture(t: TestContext) {
  const db = openDatabase(":memory:");
  seedDemo(db);
  for (const [id, role] of [
    ["outsider", "student"],
    ["other", "teacher"],
  ]) {
    db.prepare("INSERT INTO users VALUES(?,?,?,?,?,0)").run(
      id,
      `${id}@fixture.test`,
      id,
      hashPassword("GreenEdu123!"),
      role,
    );
  }
  const server = createApp(db).listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const addr = server.address();
  assert.ok(addr && typeof addr !== "string");
  const port = addr.port;
  t.after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    db.close();
  });
  async function request(path: string, cookie = "", body?: unknown) {
    const r = await fetch(`http://127.0.0.1:${port}/api${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: { Cookie: cookie, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return {
      status: r.status,
      data: await r.json(),
      cookie: r.headers.get("set-cookie")?.split(";")[0] ?? "",
    };
  }
  const login = async (email: string) =>
    (await request("/auth/login", "", { email, password: "GreenEdu123!" }))
      .cookie;
  return {
    db,
    request,
    teacher: await login("giaovien@greenedu.nk"),
    student: await login("hocsinh@greenedu.nk"),
    outsider: await login("outsider@fixture.test"),
    other: await login("other@fixture.test"),
  };
}

test("class members see the same accurate honors metrics without private roster fields", async (t) => {
  const f = await fixture(t);
  f.db
    .prepare("INSERT INTO progress VALUES('student-demo','chapter-1',14400)")
    .run();
  const q = f.db
    .prepare("SELECT * FROM questions WHERE chapter_id='chapter-1' LIMIT 1")
    .get()!;
  f.db
    .prepare(
      "INSERT INTO attempts VALUES('honor-attempt','student-demo',?,0,1,'practice',1)",
    )
    .run(q.id);
  const before = f.db.prepare("SELECT * FROM progress").all();
  const teacher = await f.request("/classrooms/class-demo/honors", f.teacher);
  const student = await f.request("/classrooms/class-demo/honors", f.student);
  assert.equal(student.status, 200);
  assert.deepEqual(student.data, teacher.data);
  const member = student.data.find(
    (row: { id: string }) => row.id === "student-demo",
  );
  assert.equal(member.answeredQuestions, 1);
  assert.equal(member.correct, 1);
  assert.equal(member.total, 1);
  assert.equal(
    Math.max(
      ...member.chapterLevels.map((row: { level: number }) => row.level),
    ),
    5,
  );
  for (const row of student.data) {
    assert.deepEqual(Object.keys(row).sort(), [
      "answeredQuestions",
      "avatarId",
      "chapterLevels",
      "correct",
      "id",
      "name",
      "total",
    ]);
    for (const chapter of row.chapterLevels)
      assert.deepEqual(Object.keys(chapter), ["level"]);
  }
  assert.ok(!JSON.stringify(student.data).includes("@"));
  assert.equal(
    (await f.request("/classrooms/class-demo/students", f.student)).status,
    403,
  );
  assert.deepEqual(f.db.prepare("SELECT * FROM progress").all(), before);
});

test("honors refuses outsiders and revoked memberships; an empty owned class has no invented entries", async (t) => {
  const f = await fixture(t);
  assert.equal((await f.request("/classrooms/class-demo/honors")).status, 401);
  for (const cookie of [f.outsider, f.other])
    assert.equal(
      (await f.request("/classrooms/class-demo/honors", cookie)).status,
      403,
    );
  assert.equal(
    (await f.request("/classrooms/missing/honors", f.teacher)).status,
    404,
  );
  f.db.prepare("DELETE FROM memberships WHERE student_id='student-demo'").run();
  assert.equal(
    (await f.request("/classrooms/class-demo/honors", f.student)).status,
    403,
  );
  const remaining = await f.request("/classrooms/class-demo/honors", f.teacher);
  assert.ok(
    !remaining.data.some((row: { id: string }) => row.id === "student-demo"),
  );
  f.db
    .prepare(
      "INSERT INTO classrooms VALUES('empty','Empty','Vật lý','11','teacher-demo')",
    )
    .run();
  assert.deepEqual(
    (await f.request("/classrooms/empty/honors", f.teacher)).data,
    [],
  );
});
