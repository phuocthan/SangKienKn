import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "./app.js";
import { openDatabase, seedDemo } from "./db.js";
import { AVATARS } from "../shared/avatars.js";

test("avatars belong to the signed-in account, validate catalog IDs and survive database reopen", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "greenedu-avatars-"));
  const path = join(dir, "test.sqlite");
  const db = openDatabase(path);
  seedDemo(db);
  const server = createApp(db).listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const port = address.port;
  let closed = false;
  t.after(async () => {
    if (!closed) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      db.close();
    }
    rmSync(dir, { recursive: true, force: true });
  });
  async function request(route: string, body?: unknown, cookie = "") {
    const response = await fetch(`http://127.0.0.1:${port}/api${route}`, {
      method: body === undefined ? "GET" : "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return {
      status: response.status,
      data: await response.json(),
      cookie: response.headers.get("set-cookie")?.split(";")[0] ?? "",
    };
  }
  assert.equal(
    (await request("/auth/avatar", { avatarId: "teacher-1" })).status,
    401,
  );
  const teacher = await request("/auth/login", {
    email: "giaovien@greenedu.demo",
    password: "GreenEdu123!",
  });
  const student = await request("/auth/login", {
    email: "hocsinh@greenedu.demo",
    password: "GreenEdu123!",
  });
  assert.equal(teacher.data.avatarId, null);
  for (const avatar of AVATARS) {
    const saved = await request(
      "/auth/avatar",
      { avatarId: avatar.id },
      teacher.cookie,
    );
    assert.equal(saved.status, 200);
    assert.equal(saved.data.avatarId, avatar.id);
    assert.equal(saved.data.password, undefined);
  }
  for (const avatarId of [
    undefined,
    "bad-id",
    "https://example.test/avatar.png",
    {},
    1,
    "",
  ]) {
    assert.equal(
      (await request("/auth/avatar", { avatarId }, teacher.cookie)).status,
      400,
    );
  }
  await request(
    "/auth/avatar",
    { avatarId: "teacher-1", userId: "student-demo", role: "admin" },
    teacher.cookie,
  );
  assert.equal(
    (await request("/auth/me", undefined, student.cookie)).data.avatarId,
    null,
  );
  assert.equal(
    (await request("/auth/me", undefined, teacher.cookie)).data.role,
    "teacher",
  );
  for (const avatar of AVATARS) {
    const before = (await request("/auth/me", undefined, student.cookie)).data
      .avatarId;
    const response = await request(
      "/auth/avatar",
      { avatarId: avatar.id, role: "teacher" },
      student.cookie,
    );
    assert.equal(response.status, avatar.collection === "teacher" ? 403 : 200);
    assert.equal(
      (await request("/auth/me", undefined, student.cookie)).data.avatarId,
      avatar.collection === "teacher" ? before : avatar.id,
    );
  }
  assert.equal(
    (await request("/auth/avatar", { avatarId: "student-4" }, student.cookie))
      .status,
    200,
  );
  const roster = await request(
    "/classrooms/class-demo/students",
    undefined,
    teacher.cookie,
  );
  assert.equal(
    roster.data.find((u: any) => u.id === "student-demo").avatarId,
    "student-4",
  );
  const relogin = await request("/auth/login", {
    email: "hocsinh@greenedu.demo",
    password: "GreenEdu123!",
  });
  assert.equal(relogin.data.avatarId, "student-4");
  db.prepare(
    "UPDATE users SET must_change = 1 WHERE id = 'student-demo'",
  ).run();
  assert.equal(
    (await request("/auth/avatar", { avatarId: null }, student.cookie)).status,
    403,
  );
  db.prepare(
    "UPDATE users SET must_change = 0 WHERE id = 'student-demo'",
  ).run();
  const reset = await request(
    "/auth/avatar",
    { avatarId: null },
    teacher.cookie,
  );
  assert.equal(reset.data.avatarId, null);
  await new Promise<void>((resolve) => server.close(() => resolve()));
  db.close();
  closed = true;
  const reopened = openDatabase(path);
  try {
    assert.equal(
      reopened
        .prepare(
          "SELECT avatar_id FROM user_avatars WHERE user_id='student-demo'",
        )
        .get()?.avatar_id,
      "student-4",
    );
    assert.equal(
      reopened.prepare("SELECT COUNT(*) AS n FROM user_avatars").get()?.n,
      1,
    );
    assert.deepEqual(reopened.prepare("PRAGMA foreign_key_check").all(), []);
  } finally {
    reopened.close();
  }
});

test("migration resets legacy teacher avatars for students and preserves other avatar choices", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "greenedu-avatar-roles-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const path = join(dir, "roles.sqlite");
  const db = openDatabase(path);
  seedDemo(db);
  db.prepare("INSERT INTO user_avatars VALUES (?,?)").run(
    "student-demo",
    "teacher-1",
  );
  db.prepare("INSERT INTO user_avatars VALUES (?,?)").run(
    "teacher-demo",
    "teacher-1",
  );
  db.prepare("INSERT INTO user_avatars VALUES (?,?)").run(
    "student-2",
    "nature-2",
  );
  db.prepare("INSERT INTO progress VALUES (?,?,?)").run(
    "student-demo",
    "chapter-1",
    3600,
  );
  db.close();
  const migrated = openDatabase(path);
  try {
    assert.equal(
      migrated
        .prepare(
          "SELECT avatar_id FROM user_avatars WHERE user_id='student-demo'",
        )
        .get(),
      undefined,
    );
    assert.equal(
      migrated
        .prepare(
          "SELECT avatar_id FROM user_avatars WHERE user_id='teacher-demo'",
        )
        .get()?.avatar_id,
      "teacher-1",
    );
    assert.equal(
      migrated
        .prepare("SELECT avatar_id FROM user_avatars WHERE user_id='student-2'")
        .get()?.avatar_id,
      "nature-2",
    );
    assert.equal(
      migrated
        .prepare(
          "SELECT seconds FROM progress WHERE student_id='student-demo' AND chapter_id='chapter-1'",
        )
        .get()?.seconds,
      3600,
    );
    assert.deepEqual(migrated.prepare("PRAGMA foreign_key_check").all(), []);
  } finally {
    migrated.close();
  }
});
