import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "./app.js";
import { openDatabase, seedDemo, hashPassword } from "./db.js";

async function fixture(t: TestContext) {
  const db = openDatabase(":memory:");
  seedDemo(db);
  db.prepare(
    "INSERT INTO users VALUES('other','other@fixture.test','Other',?,'teacher',0)",
  ).run(hashPassword("GreenEdu123!"));
  db.prepare(
    "INSERT INTO classrooms VALUES('other-class','Other','Math','10','other')",
  ).run();
  db.prepare(
    "INSERT INTO chapters VALUES('other-chapter','other-class','Other')",
  ).run();
  db.prepare(
    "INSERT INTO memberships VALUES('other-class','student-demo')",
  ).run();
  let clock = Date.now();
  const server = createApp(db, { now: () => clock }).listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const port = address.port;
  t.after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    db.close();
  });
  async function request(path: string, cookie = "", body?: unknown) {
    const response = await fetch(`http://127.0.0.1:${port}/api${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: { Cookie: cookie, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return {
      status: response.status,
      data: await response.json(),
      cookie: response.headers.get("set-cookie")?.split(";")[0] ?? "",
      cache: response.headers.get("cache-control"),
    };
  }
  const login = async (email: string) =>
    (await request("/auth/login", "", { email, password: "GreenEdu123!" }))
      .cookie;
  const teacher = await login("giaovien@greenedu.nk");
  const student = await login("hocsinh@greenedu.nk");
  const other = await login("other@fixture.test");
  return {
    db,
    request,
    teacher,
    student,
    other,
    advance: (ms: number) => {
      clock += ms;
    },
  };
}

test("teacher live activity is owner-only, scoped to the class and exposes no session credentials", async (t) => {
  const f = await fixture(t);
  const path = "/classrooms/class-demo/student-activity";
  assert.equal((await f.request(path)).status, 401);
  assert.equal((await f.request(path, f.student)).status, 403);
  assert.equal((await f.request(path, f.other)).status, 403);
  await f.request("/study/start", f.student, { chapterId: "other-chapter" });
  f.db
    .prepare("INSERT INTO progress VALUES('student-demo','other-chapter',500)")
    .run();
  const response = await f.request(path, f.teacher);
  assert.equal(response.status, 200);
  assert.equal(response.cache, "no-store");
  const member = response.data.find((s: any) => s.id === "student-demo");
  assert.deepEqual(Object.keys(member).sort(), [
    "activeForMs",
    "id",
    "seconds",
  ]);
  assert.equal(member.seconds, 0);
  assert.equal(member.activeForMs, 0);
  f.db
    .prepare(
      "INSERT INTO progress VALUES('student-demo','chapter-1',3.8),('student-demo','chapter-2',4.8)",
    )
    .run();
  const rounded = (await f.request(path, f.teacher)).data.find(
    (member: any) => member.id === "student-demo",
  );
  assert.equal(rounded.seconds, 7);
  assert.equal(
    (await f.request("/classrooms/class-demo/students", f.teacher)).data.find(
      (member: any) => member.id === "student-demo",
    ).seconds,
    rounded.seconds,
  );
  assert.equal(
    (
      await f.request("/classrooms/other-class/student-activity", f.other)
    ).data.find((member: any) => member.id === "student-demo").activeForMs,
    30000,
  );
});

test("live polling reads only credited study seconds; heartbeat and stop update actual time and presence", async (t) => {
  const f = await fixture(t);
  const path = "/classrooms/class-demo/student-activity";
  const start = await f.request("/study/start", f.student, {
    chapterId: "chapter-1",
  });
  assert.equal(start.status, 200);
  f.advance(15000);
  const before = (await f.request(path, f.teacher)).data.find(
    (member: any) => member.id === "student-demo",
  );
  assert.equal(before.seconds, 0);
  assert.equal(before.activeForMs, 15000);
  assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM progress").get()!.n, 0);
  const beat = await f.request("/study/heartbeat", f.student, {
    sessionId: start.data.sessionId,
    active: true,
    interacted: true,
  });
  assert.equal(beat.data.creditedSeconds, 15);
  const member = (await f.request(path, f.teacher)).data.find(
    (member: any) => member.id === "student-demo",
  );
  assert.equal(member.seconds, 15);
  assert.equal(member.activeForMs, 30000);
  assert.equal(
    (await f.request("/classrooms/class-demo/students", f.teacher)).data.find(
      (member: any) => member.id === "student-demo",
    ).seconds,
    member.seconds,
  );
  await f.request("/study/heartbeat", f.student, {
    sessionId: start.data.sessionId,
    active: false,
    interacted: false,
  });
  assert.equal(
    (await f.request(path, f.teacher)).data.find(
      (member: any) => member.id === "student-demo",
    ).activeForMs,
    0,
  );
  await f.request("/study/stop", f.student, {
    sessionId: start.data.sessionId,
    active: false,
  });
  assert.equal(
    (await f.request(path, f.teacher)).data.find(
      (member: any) => member.id === "student-demo",
    ).seconds,
    15,
  );
  assert.equal(
    (await f.request(path, f.teacher)).data.find(
      (member: any) => member.id === "student-demo",
    ).activeForMs,
    0,
  );
});

test("lost heartbeat expires presence; idle policy removes the session and discards only its credit", async (t) => {
  const f = await fixture(t);
  const path = "/classrooms/class-demo/student-activity";
  const start = await f.request("/study/start", f.student, {
    chapterId: "chapter-1",
  });
  f.advance(30000);
  assert.equal(
    (await f.request(path, f.teacher)).data.find(
      (member: any) => member.id === "student-demo",
    ).activeForMs,
    0,
  );
  for (let i = 0; i < 5; i++) {
    const beat = await f.request("/study/heartbeat", f.student, {
      sessionId: start.data.sessionId,
      active: true,
      interacted: false,
    });
    if (i < 4) {
      assert.equal(beat.status, 200);
      f.advance(15000);
    }
  }
  // The freshest heartbeat is still bounded by the last actual interaction.
  f.advance(15000);
  const nearIdle = (await f.request(path, f.teacher)).data.find(
    (member: any) => member.id === "student-demo",
  );
  assert.equal(nearIdle.activeForMs, 15000);
  f.advance(15000);
  const expired = (await f.request(path, f.teacher)).data.find(
    (member: any) => member.id === "student-demo",
  );
  assert.equal(expired.activeForMs, 0);
  assert.equal(expired.seconds, 0);
  assert.equal(
    f.db.prepare("SELECT COUNT(*) AS n FROM study_sessions").get()!.n,
    0,
  );
});
