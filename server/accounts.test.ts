import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { spawnSync } from "node:child_process";
import { createApp } from "./app.js";
import { hashPassword, openDatabase, seedDemo, verifyPassword } from "./db.js";

test("Admin bootstrap creates one temporary account, rejects duplicates and never prints the password", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "greenedu-admin-cli-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const path = join(dir, "admin.sqlite");
  const env = {
    ...process.env,
    DATABASE_PATH: path,
    ADMIN_EMAIL: "ADMIN@example.test",
    ADMIN_NAME: "Admin kiểm thử",
    ADMIN_PASSWORD: "TemporaryAdmin123!",
  };
  const run = () =>
    spawnSync(process.execPath, ["--import", "tsx", "server/create-admin.ts"], {
      env,
      encoding: "utf8",
    });
  const first = run();
  assert.equal(first.status, 0, first.stderr);
  assert.equal(first.stdout.includes(env.ADMIN_PASSWORD), false);
  const duplicate = run();
  assert.notEqual(duplicate.status, 0);
  const db = openDatabase(path);
  try {
    const accounts = db.prepare("SELECT * FROM users").all();
    assert.equal(accounts.length, 1);
    assert.equal(accounts[0].email, "admin@example.test");
    assert.equal(accounts[0].role, "admin");
    assert.equal(accounts[0].must_change, 1);
    assert.ok(verifyPassword(env.ADMIN_PASSWORD, String(accounts[0].password)));
  } finally {
    db.close();
  }
});

async function fixture(t: TestContext) {
  const db = openDatabase(":memory:");
  seedDemo(db);
  db.prepare("INSERT INTO users VALUES (?,?,?,?,?,0)").run(
    "admin",
    "admin@example.test",
    "Admin",
    hashPassword("AdminPass123!"),
    "admin",
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
    const r = await fetch(base + path, {
      method: body === undefined ? "GET" : "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return {
      status: r.status,
      data: await r.json(),
      cookie: r.headers.get("set-cookie")?.split(";")[0] ?? "",
    };
  }
  const admin = (
    await request("/auth/login", {
      email: "admin@example.test",
      password: "AdminPass123!",
    })
  ).cookie;
  const teacher = (
    await request("/auth/login", {
      email: "giaovien@greenedu.demo",
      password: "GreenEdu123!",
    })
  ).cookie;
  const student = (
    await request("/auth/login", {
      email: "hocsinh@greenedu.demo",
      password: "GreenEdu123!",
    })
  ).cookie;
  return { db, request, admin, teacher, student };
}

test("only admin can list/create school accounts; input validation cannot escalate roles", async (t) => {
  const f = await fixture(t);
  const input = {
    name: "Giáo viên mới",
    email: "NEW@example.test",
    password: "TempPass123!",
    role: "teacher",
  };
  for (const cookie of [f.teacher, f.student]) {
    assert.equal((await f.request("/accounts", undefined, cookie)).status, 403);
    assert.equal(
      (await f.request("/accounts/classrooms", undefined, cookie)).status,
      403,
    );
    assert.equal((await f.request("/accounts", input, cookie)).status, 403);
  }
  assert.equal(
    (await f.request("/accounts", { ...input, role: "admin" }, f.admin)).status,
    400,
  );
  assert.equal(
    (await f.request("/accounts", { ...input, email: "bad" }, f.admin)).status,
    400,
  );
  assert.equal(
    (await f.request("/accounts", { ...input, password: "tiny" }, f.admin))
      .status,
    400,
  );
  assert.equal(
    (
      await f.request(
        "/accounts",
        { ...input, classroomId: "class-demo" },
        f.admin,
      )
    ).status,
    400,
  );
  const created = await f.request("/accounts", input, f.admin);
  assert.equal(created.status, 201);
  assert.equal(created.data.email, "new@example.test");
  assert.equal(created.data.mustChange, true);
  assert.equal((await f.request("/accounts", input, f.admin)).status, 409);
  const accounts = (await f.request("/accounts", undefined, f.admin)).data;
  assert.equal(accounts.length, 6);
  for (const account of accounts) {
    assert.equal("password" in account, false);
    assert.equal("must_change" in account, false);
  }
  const teacher = await f.request("/auth/login", {
    email: input.email,
    password: input.password,
  });
  assert.equal(teacher.data.role, "teacher");
  assert.equal(
    (await f.request("/classrooms", undefined, teacher.cookie)).status,
    403,
  );
  assert.equal(
    (
      await f.request(
        "/auth/password",
        { currentPassword: input.password, newPassword: "OwnPassword123!" },
        teacher.cookie,
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await f.request(
        "/classrooms",
        { name: "Lớp mới", subject: "Toán", grade: "10" },
        teacher.cookie,
      )
    ).status,
    201,
  );
});

test("admin creates students with optional class; teacher enrolls existing students without overwriting credentials", async (t) => {
  const f = await fixture(t);
  const input = {
    name: "Học sinh mới",
    email: "newstudent@example.test",
    password: "TempPass123!",
    role: "student",
  };
  assert.equal(
    (
      await f.request(
        "/accounts",
        { ...input, classroomId: "missing" },
        f.admin,
      )
    ).status,
    400,
  );
  assert.equal(
    f.db.prepare("SELECT id FROM users WHERE email = ?").get(input.email),
    undefined,
  );
  const created = await f.request("/accounts", input, f.admin);
  assert.equal(created.status, 201);
  const before = f.db
    .prepare("SELECT password FROM users WHERE id = ?")
    .get(created.data.id)?.password;
  assert.equal(
    (
      await f.request(
        "/classrooms/class-demo/memberships",
        { email: input.email },
        f.student,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await f.request(
        "/classrooms/class-demo/memberships",
        { email: "admin@example.test" },
        f.teacher,
      )
    ).status,
    404,
  );
  assert.equal(
    (
      await f.request(
        "/classrooms/class-demo/memberships",
        { email: input.email.toUpperCase() },
        f.teacher,
      )
    ).status,
    201,
  );
  assert.equal(
    (
      await f.request(
        "/classrooms/class-demo/memberships",
        { email: input.email },
        f.teacher,
      )
    ).status,
    409,
  );
  assert.equal(
    f.db.prepare("SELECT password FROM users WHERE id = ?").get(created.data.id)
      ?.password,
    before,
  );
  const assigned = await f.request(
    "/accounts",
    { ...input, email: "assigned@example.test", classroomId: "class-demo" },
    f.admin,
  );
  assert.equal(assigned.status, 201);
  assert.ok(
    f.db
      .prepare(
        "SELECT 1 FROM memberships WHERE classroom_id = ? AND student_id = ?",
      )
      .get("class-demo", assigned.data.id),
  );
  const ownClass = (
    await f.request(
      "/classrooms",
      { name: "Own", subject: "Toán", grade: "10" },
      f.teacher,
    )
  ).data.id;
  f.db
    .prepare("INSERT INTO classrooms VALUES (?,?,?,?,?)")
    .run("private", "Private", "Toán", "10", "admin");
  assert.equal(
    (
      await f.request(
        "/classrooms/private/memberships",
        { email: input.email },
        f.teacher,
      )
    ).status,
    403,
  );
  const teacherStudent = await f.request(
    `/classrooms/${ownClass}/students`,
    { ...input, email: "teacherstudent@example.test", role: "teacher" },
    f.teacher,
  );
  assert.equal(teacherStudent.status, 201);
  assert.equal(
    f.db
      .prepare("SELECT role FROM users WHERE id = ?")
      .get(teacherStudent.data.id)?.role,
    "student",
  );
});

test("admin reset revokes sessions and forces password change, while teachers cannot reset other teachers", async (t) => {
  const f = await fixture(t);
  assert.equal(
    (
      await f.request(
        "/accounts/teacher-demo/password",
        { password: "ResetPass123!" },
        f.teacher,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await f.request(
        "/accounts/admin/password",
        { password: "ResetPass123!" },
        f.admin,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await f.request(
        "/accounts/missing/password",
        { password: "ResetPass123!" },
        f.admin,
      )
    ).status,
    404,
  );
  assert.equal(
    (
      await f.request(
        "/accounts/teacher-demo/password",
        { password: "ResetPass123!" },
        f.admin,
      )
    ).status,
    200,
  );
  assert.equal((await f.request("/auth/me", undefined, f.teacher)).status, 401);
  const login = await f.request("/auth/login", {
    email: "giaovien@greenedu.demo",
    password: "ResetPass123!",
  });
  assert.equal(login.data.mustChange, true);
  assert.equal(
    (await f.request("/classrooms", undefined, login.cookie)).status,
    403,
  );
});

test("legacy role migration retains sessions, learning and group foreign keys across restarts", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "greenedu-accounts-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const path = join(dir, "legacy.sqlite");
  const legacy = new DatabaseSync(path);
  legacy.exec(
    `CREATE TABLE users (id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,name TEXT NOT NULL,password TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('teacher','student')),must_change INTEGER NOT NULL DEFAULT 0)`,
  );
  legacy.close();
  // Populate realistic linked data, then restore the original role constraint.
  let db = openDatabase(path);
  seedDemo(db);
  db.exec(
    "PRAGMA foreign_keys=OFF; BEGIN; CREATE TABLE old_users (id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,name TEXT NOT NULL,password TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('teacher','student')),must_change INTEGER NOT NULL DEFAULT 0); INSERT INTO old_users SELECT * FROM users; DROP TABLE users; ALTER TABLE old_users RENAME TO users; COMMIT; PRAGMA foreign_keys=ON;",
  );
  db.prepare("INSERT INTO progress VALUES (?,?,?)").run(
    "student-demo",
    "chapter-1",
    4321,
  );
  db.prepare("INSERT INTO sessions VALUES (?,?,?)").run(
    "keep-session",
    "teacher-demo",
    9999999999999,
  );
  db.prepare("INSERT INTO group_activities VALUES (?,?,?,?,?,?,?,?,?,?)").run(
    "activity",
    "class-demo",
    "Test",
    "Instructions",
    "",
    9999999999999,
    1,
    1,
    "req",
    "fp",
  );
  db.prepare("INSERT INTO activity_groups VALUES (?,?,?,?)").run(
    "group",
    "activity",
    1,
    "student-demo",
  );
  db.prepare("INSERT INTO activity_group_members VALUES (?,?,?)").run(
    "activity",
    "group",
    "student-demo",
  );
  db.close();
  db = openDatabase(path);
  try {
    db.prepare("INSERT INTO users VALUES (?,?,?,?,?,1)").run(
      "admin",
      "admin@example.test",
      "Admin",
      hashPassword("AdminPass123!"),
      "admin",
    );
    assert.ok(
      verifyPassword(
        "GreenEdu123!",
        String(
          db.prepare("SELECT password FROM users WHERE id='teacher-demo'").get()
            ?.password,
        ),
      ),
    );
    assert.equal(
      db.prepare("SELECT seconds FROM progress").get()?.seconds,
      4321,
    );
    assert.equal(
      db.prepare("SELECT user_id FROM sessions").get()?.user_id,
      "teacher-demo",
    );
    assert.equal(
      db.prepare("SELECT representative_id FROM activity_groups").get()
        ?.representative_id,
      "student-demo",
    );
    assert.equal(
      db.prepare("SELECT student_id FROM activity_group_members").get()
        ?.student_id,
      "student-demo",
    );
    assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
    assert.equal(db.prepare("PRAGMA foreign_keys").get()?.foreign_keys, 1);
  } finally {
    db.close();
  }
  db = openDatabase(path);
  try {
    assert.equal(
      db.prepare("SELECT role FROM users WHERE id='admin'").get()?.role,
      "admin",
    );
  } finally {
    db.close();
  }
});
