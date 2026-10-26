import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "./app.js";
import { openDatabase, seedDemo, hashPassword, verifyPassword } from "./db.js";

test("read-only teacher keeps its own identity, sees only the linked teacher scope and cannot write through any API method", async (t) => {
  const db = openDatabase(":memory:");
  seedDemo(db);
  db.prepare(
    "INSERT INTO users VALUES('viewer','viewer@greenedu.nk','Giáo viên chỉ xem',?,'student',0)",
  ).run(hashPassword("ViewerTest123!"));
  db.prepare(
    "INSERT INTO teacher_viewers VALUES('viewer','teacher-demo')",
  ).run();
  db.prepare(
    "INSERT INTO users VALUES('outside','outside@test.local','Ngoài phạm vi',?,'teacher',0)",
  ).run(hashPassword("OutsideTest123!"));
  db.prepare(
    "INSERT INTO classrooms VALUES('private','Lớp riêng','Toán','10','outside')",
  ).run();
  db.prepare(
    "INSERT INTO chapters VALUES('private-ch','private','Chương riêng')",
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
  let cookie = "";
  async function request(
    path: string,
    body?: unknown,
    method = body === undefined ? "GET" : "POST",
  ) {
    const response = await fetch(base + path, {
      method,
      headers: { Cookie: cookie, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return {
      status: response.status,
      data: await response.json(),
      cookie: response.headers.get("set-cookie")?.split(";")[0] ?? "",
    };
  }
  const signedIn = await request("/auth/login", {
    email: "viewer",
    password: "ViewerTest123!",
  });
  cookie = signedIn.cookie;
  assert.equal(signedIn.data.id, "viewer");
  assert.equal(signedIn.data.role, "teacher");
  assert.equal(signedIn.data.readOnly, true);
  assert.equal((await request("/auth/me")).data.email, "viewer@greenedu.nk");
  const classes = (await request("/classrooms")).data;
  assert.deepEqual(
    classes.map((c: { id: string }) => c.id),
    ["class-demo"],
  );
  assert.equal(classes[0].canManageClass, false);
  assert.equal(classes[0].chapters[0].canDeleteQuestions, false);
  assert.equal((await request("/classrooms/class-demo/students")).status, 200);
  assert.equal(
    (await request("/chapters/chapter-1/questions?showHidden=1")).status,
    200,
  );
  const overview = await request("/classrooms/class-demo/learning");
  assert.equal(overview.status, 200);
  assert.equal(overview.data.canConfigureLevels, false);
  assert.equal((await request("/classrooms/private/learning")).status, 403);
  assert.equal((await request("/chapters/private-ch/questions")).status, 403);
  assert.equal((await request("/accounts")).status, 403);
  const snapshot = () =>
    JSON.stringify(
      [
        "users",
        "classrooms",
        "memberships",
        "chapters",
        "questions",
        "attempts",
        "progress",
        "learning_rewards",
        "teacher_viewers",
      ].map((table) =>
        db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all(),
      ),
    );
  const before = snapshot();
  for (const path of [
    "/classrooms",
    "/classrooms/class-demo/delete",
    "/classrooms/class-demo/students",
    "/classrooms/class-demo/general-settings",
    "/classrooms/class-demo/reward-settings",
    "/chapters/chapter-1/hunt-access",
    "/chapters/chapter-1/practice-access",
    "/chapters/chapter-1/questions",
    "/chapters/chapter-1/questions/import",
    "/questions/question-1",
    "/learning/rewards/missing/review",
    "/classrooms/class-demo/exams",
    "/group-activities/missing/extend",
    "/feedback/missing/messages",
    "/attempts",
    "/study/start",
    "/auth/avatar",
  ])
    assert.equal(
      (
        await request(path, {
          enabled: true,
          name: "Không được ghi",
          requestId: randomUUID(),
        })
      ).status,
      403,
      path,
    );
  for (const method of ["PUT", "PATCH", "DELETE"])
    assert.equal(
      (await request("/classrooms/class-demo", {}, method)).status,
      403,
    );
  assert.equal(snapshot(), before);
  const ownerPassword = db
    .prepare("SELECT password FROM users WHERE id='teacher-demo'")
    .get()!.password;
  assert.equal(
    (
      await request("/auth/password", {
        currentPassword: "ViewerTest123!",
        newPassword: "ViewerChanged123!",
      })
    ).status,
    200,
  );
  assert.equal(
    db.prepare("SELECT password FROM users WHERE id='teacher-demo'").get()!
      .password,
    ownerPassword,
  );
  assert.ok(
    verifyPassword(
      "ViewerChanged123!",
      String(
        db.prepare("SELECT password FROM users WHERE id='viewer'").get()!
          .password,
      ),
    ),
  );
  db.prepare("UPDATE users SET role='student' WHERE id='teacher-demo'").run();
  assert.equal((await request("/classrooms")).status, 403);
  db.prepare("UPDATE users SET role='teacher' WHERE id='teacher-demo'").run();
  db.prepare("DELETE FROM teacher_viewers WHERE user_id='viewer'").run();
  assert.deepEqual((await request("/classrooms")).data, []);
  assert.equal((await request("/classrooms", {})).status, 403);
  assert.equal((await request("/auth/logout", {})).status, 200);
  assert.equal((await request("/auth/me")).status, 401);
});

test("viewer migration is additive, persists after reopen and fails closed without a valid teacher", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "greenedu-viewer-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const path = join(dir, "viewer.sqlite");
  let db = openDatabase(path);
  try {
    seedDemo(db);
    db.exec("DROP TABLE teacher_viewers");
    const before = db.prepare("SELECT * FROM users ORDER BY id").all();
    db.close();
    db = openDatabase(path);
    assert.deepEqual(
      db.prepare("SELECT * FROM users ORDER BY id").all(),
      before,
    );
    db.prepare(
      "INSERT INTO teacher_viewers VALUES('student-demo','teacher-demo')",
    ).run();
    db.close();
    db = openDatabase(path);
    assert.equal(
      db
        .prepare(
          "SELECT teacher_id FROM teacher_viewers WHERE user_id='student-demo'",
        )
        .get()!.teacher_id,
      "teacher-demo",
    );
    assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
  } finally {
    db.close();
  }
});
