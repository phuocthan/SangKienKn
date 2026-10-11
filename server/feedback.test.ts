import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createApp } from "./app.js";
import { openDatabase, seedDemo, hashPassword } from "./db.js";

test("feedback is private, scoped to the class teacher, validated and idempotent; replies and resolution preserve history", async (t) => {
  const databasePath = `.local/e2e-feedback-http-${randomUUID()}.sqlite`;
  const db = openDatabase(databasePath);
  seedDemo(db);
  let clock = 1000;
  const server = createApp(db, { now: () => clock }).listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  t.after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    db.close();
  });
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}/api`;
  async function call(path: string, body?: unknown, cookie = "") {
    const response = await fetch(base + path, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        Cookie: cookie,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return {
      status: response.status,
      data: await response.json(),
      cookie: response.headers.get("set-cookie")?.split(";")[0] ?? "",
    };
  }
  async function login(id: string) {
    const user = db.prepare("SELECT email FROM users WHERE id=?").get(id)!;
    const result = await call("/auth/login", {
      email: user.email,
      password: "GreenEdu123!",
    });
    assert.equal(result.status, 200);
    return result.cookie;
  }
  db.prepare("INSERT INTO users VALUES(?,?,?,?,?,0)").run(
    "foreign-teacher",
    "foreign@greenedu.test",
    "Giáo viên khác",
    hashPassword("GreenEdu123!"),
    "teacher",
  );
  const students = db
    .prepare(
      "SELECT student_id FROM memberships WHERE classroom_id='class-demo'",
    )
    .all();
  const student = await login(String(students[0].student_id)),
    otherStudent = await login(String(students[1].student_id)),
    teacher = await login("teacher-demo"),
    foreignTeacher = await login("foreign-teacher");
  const path = "/classrooms/class-demo/feedback";
  assert.equal((await call(path)).status, 401);
  assert.equal((await call(path, undefined, foreignTeacher)).status, 403);
  const body = {
    title: "Giúp em học tốt hơn",
    body: "<script>không chạy</script>\nEm muốn thêm hoạt động.",
    requestId: randomUUID(),
  };
  for (const invalid of [
    { ...body, title: " " },
    { ...body, body: "x".repeat(5001) },
    { ...body, requestId: "" },
  ])
    assert.equal((await call(path, invalid, student)).status, 400);
  assert.equal((await call(path, body, teacher)).status, 403);
  const created = await call(path, body, student);
  assert.equal(created.status, 201);
  const id = created.data.id;
  assert.equal(created.data.messages.length, 1);
  assert.equal((await call(path, body, student)).data.id, id);
  assert.equal(
    (await call(path, { ...body, body: "Nội dung khác" }, student)).status,
    409,
  );
  assert.equal(
    (await call(path, undefined, otherStudent)).data.threads.length,
    0,
  );
  assert.equal((await call(path, undefined, teacher)).data.threads.length, 1);
  const reply = { body: "Cô đã ghi nhận.", requestId: randomUUID() };
  clock++;
  const messagePath = `/feedback/${id}/messages`,
    statusPath = `/feedback/${id}/status`;
  assert.equal((await call(messagePath, reply, otherStudent)).status, 403);
  assert.equal((await call(messagePath, reply, foreignTeacher)).status, 403);
  const result = await call(messagePath, reply, teacher);
  assert.equal(result.status, 201);
  assert.equal(result.data.status, "replied");
  assert.equal(
    (await call(messagePath, reply, teacher)).data.messages.length,
    2,
  );
  assert.equal(
    (await call(messagePath, { ...reply, body: "Thay đổi" }, teacher)).status,
    409,
  );
  assert.equal(
    (await call(statusPath, { status: "closed" }, student)).status,
    403,
  );
  assert.equal(
    (await call(statusPath, { status: "fake" }, teacher)).status,
    400,
  );
  assert.equal(
    (await call(statusPath, { status: "closed" }, teacher)).data.status,
    "closed",
  );
  assert.equal(
    (
      await call(
        messagePath,
        { body: "Em cảm ơn", requestId: randomUUID() },
        student,
      )
    ).status,
    409,
  );
  assert.equal((await call(messagePath, reply, teacher)).status, 200); // retry after closure must not duplicate or reopen
  await call(statusPath, { status: "new" }, teacher);
  clock++;
  const followup = await call(
    messagePath,
    { body: "Em bổ sung một ý", requestId: randomUUID() },
    student,
  );
  assert.equal(followup.data.status, "new");
  assert.equal(followup.data.messages.length, 3);
  db.prepare(
    "DELETE FROM memberships WHERE classroom_id='class-demo' AND student_id=?",
  ).run(students[0].student_id);
  assert.equal(
    (
      await call(
        messagePath,
        { body: "Đã rời lớp", requestId: randomUUID() },
        student,
      )
    ).status,
    403,
  );
  assert.equal(
    (await call(path, undefined, teacher)).data.threads[0].messages.length,
    3,
  );
  assert.equal(db.prepare("PRAGMA foreign_key_check").all().length, 0);
  // A fresh startup applies the additive migration again without changing history.
  const reopened = openDatabase(databasePath);
  try {
    seedDemo(reopened);
    assert.equal(
      reopened.prepare("SELECT COUNT(*) AS n FROM feedback_threads").get()!.n,
      1,
    );
    assert.equal(
      reopened.prepare("SELECT COUNT(*) AS n FROM feedback_messages").get()!.n,
      3,
    );
    assert.equal(
      reopened.prepare("SELECT COUNT(*) AS n FROM questions").get()!.n,
      9,
    );
    assert.equal(reopened.prepare("PRAGMA foreign_key_check").all().length, 0);
  } finally {
    reopened.close();
  }
});
