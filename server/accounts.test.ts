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

test("class creation rejects normalized duplicates and concurrent repeats but allows other subjects/owners", async (t) => {
  const f = await fixture(t);
  const input = { name: "Lớp 11A2", subject: "Vật lý", grade: "11" };
  const created = await f.request("/classrooms", input, f.teacher);
  assert.equal(created.status, 201);
  const repeats = await Promise.all([
    f.request("/classrooms", input, f.teacher),
    f.request(
      "/classrooms",
      {
        name: "  lớp   11a2  ",
        subject: " VẬT   LÝ ".normalize("NFD"),
        grade: " 11 ",
      },
      f.teacher,
    ),
  ]);
  assert.deepEqual(
    repeats.map((r) => r.status),
    [409, 409],
  );
  assert.match(repeats[0].data.error, /đã tồn tại/);
  assert.equal(
    (await f.request("/classrooms", { ...input, subject: "Toán" }, f.teacher))
      .status,
    201,
  );
  const concurrent = await Promise.all(
    Array.from({ length: 4 }, () =>
      f.request("/classrooms", { ...input, name: "Lớp 12A3" }, f.teacher),
    ),
  );
  assert.deepEqual(
    concurrent.map((r) => r.status).sort(),
    [201, 409, 409, 409],
  );
  f.db
    .prepare("INSERT INTO users VALUES (?,?,?,?,?,0)")
    .run(
      "other-teacher",
      "other@example.test",
      "GV khác",
      hashPassword("OtherPass123!"),
      "teacher",
    );
  const other = (
    await f.request("/auth/login", {
      email: "other@example.test",
      password: "OtherPass123!",
    })
  ).cookie;
  assert.equal((await f.request("/classrooms", input, other)).status, 201);
  assert.equal(
    (await f.request("/classrooms", undefined, other)).data.length,
    1,
  );
  assert.deepEqual(f.db.prepare("PRAGMA foreign_key_check").all(), []);
});

test("class validation and role checks leave no partial class rows", async (t) => {
  const f = await fixture(t);
  const before = f.db.prepare("SELECT COUNT(*) AS n FROM classrooms").get()!.n;
  const valid = { name: "Lớp 10A2", subject: "Toán", grade: "10" };
  for (const body of [
    {},
    { ...valid, name: "   " },
    { ...valid, subject: "" },
    { ...valid, grade: " " },
    { ...valid, name: "x".repeat(81) },
    { ...valid, subject: 123 },
    { ...valid, grade: "x".repeat(21) },
  ])
    assert.equal((await f.request("/classrooms", body, f.teacher)).status, 400);
  assert.equal((await f.request("/classrooms", valid)).status, 401);
  assert.equal((await f.request("/classrooms", valid, f.student)).status, 403);
  assert.equal((await f.request("/classrooms", valid, f.admin)).status, 403);
  assert.equal(
    f.db.prepare("SELECT COUNT(*) AS n FROM classrooms").get()!.n,
    before,
  );
});

test("admin concurrent account creation normalizes email and never overwrites an existing role/password", async (t) => {
  const f = await fixture(t);
  const input = {
    name: "Học sinh cùng tên",
    email: " Repeat@Example.Test ",
    password: "TempPass123!",
    role: "student",
    classroomId: "class-demo",
  };
  const results = await Promise.all(
    Array.from({ length: 4 }, () => f.request("/accounts", input, f.admin)),
  );
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409, 409, 409]);
  const user = f.db
    .prepare("SELECT * FROM users WHERE email=?")
    .get("repeat@example.test")!;
  const originalPassword = user.password;
  assert.equal(user.role, "student");
  assert.ok(verifyPassword(input.password, String(originalPassword)));
  assert.equal(
    (
      await f.request(
        "/accounts",
        {
          ...input,
          email: "repeat@example.test",
          role: "teacher",
          classroomId: "",
          password: "Replacement123!",
        },
        f.admin,
      )
    ).status,
    409,
  );
  assert.equal(
    f.db
      .prepare("SELECT password FROM users WHERE id=?")
      .get(user.id as string)!.password,
    originalPassword,
  );
  assert.equal(
    f.db
      .prepare("SELECT COUNT(*) AS n FROM memberships WHERE student_id=?")
      .get(user.id as string)!.n,
    1,
  );
  // A shared display name is legitimate; email is the account identity.
  assert.equal(
    (
      await f.request(
        "/accounts",
        { ...input, email: "distinct@example.test" },
        f.admin,
      )
    ).status,
    201,
  );
});

test("teacher concurrent student creation and existing enrollment create one account/membership only", async (t) => {
  const f = await fixture(t);
  const input = {
    name: "HS mới",
    email: " Student@Example.Test ",
    password: "TempPass123!",
    role: "admin",
  };
  const results = await Promise.all(
    Array.from({ length: 4 }, () =>
      f.request("/classrooms/class-demo/students", input, f.teacher),
    ),
  );
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409, 409, 409]);
  const user = f.db
    .prepare("SELECT * FROM users WHERE email=?")
    .get("student@example.test")!;
  assert.equal(user.role, "student");
  f.db
    .prepare("INSERT INTO progress VALUES (?,?,?)")
    .run(user.id as string, "chapter-1", 1234);
  const c = await f.request(
    "/classrooms",
    { name: "Lớp thứ hai", subject: "Toán", grade: "10" },
    f.teacher,
  );
  const memberships = await Promise.all(
    Array.from({ length: 4 }, () =>
      f.request(
        `/classrooms/${c.data.id}/memberships`,
        { email: input.email },
        f.teacher,
      ),
    ),
  );
  assert.deepEqual(
    memberships.map((r) => r.status).sort(),
    [201, 409, 409, 409],
  );
  assert.equal(
    f.db
      .prepare("SELECT COUNT(*) AS n FROM users WHERE email=?")
      .get("student@example.test")!.n,
    1,
  );
  assert.equal(
    f.db
      .prepare("SELECT COUNT(*) AS n FROM memberships WHERE student_id=?")
      .get(user.id as string)!.n,
    2,
  );
  assert.equal(
    f.db
      .prepare("SELECT password FROM users WHERE id=?")
      .get(user.id as string)!.password,
    user.password,
  );
  const roster = await f.request(
    `/classrooms/${c.data.id}/students`,
    undefined,
    f.teacher,
  );
  assert.equal(roster.data.length, 1);
  assert.equal(roster.data[0].seconds, 0);
  assert.equal(roster.data[0].total, 0);
  assert.equal("password" in roster.data[0], false);
  const originalRoster = await f.request(
    "/classrooms/class-demo/students",
    undefined,
    f.teacher,
  );
  assert.equal(
    originalRoster.data.find((s: { id: string }) => s.id === user.id).seconds,
    1234,
  );
  assert.equal(
    f.db
      .prepare(
        "SELECT seconds FROM progress WHERE student_id=? AND chapter_id='chapter-1'",
      )
      .get(user.id as string)!.seconds,
    1234,
  );
});

test("invalid student/account input and unauthorized creation leave users and memberships unchanged", async (t) => {
  const f = await fixture(t);
  const before = () => [
    f.db.prepare("SELECT COUNT(*) AS n FROM users").get()!.n,
    f.db.prepare("SELECT COUNT(*) AS n FROM memberships").get()!.n,
  ];
  const counts = before();
  const input = {
    name: "HS",
    email: "valid@example.test",
    password: "TempPass123!",
    role: "student",
  };
  for (const body of [
    { ...input, name: " " },
    { ...input, email: "bad" },
    { ...input, password: "short" },
    { ...input, password: "x".repeat(129) },
  ]) {
    assert.equal((await f.request("/accounts", body, f.admin)).status, 400);
    assert.equal(
      (await f.request("/classrooms/class-demo/students", body, f.teacher))
        .status,
      400,
    );
  }
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
    (await f.request("/classrooms/missing/students", input, f.teacher)).status,
    404,
  );
  assert.equal(
    (await f.request("/classrooms/class-demo/students", input, f.student))
      .status,
    403,
  );
  assert.equal(
    (await f.request("/classrooms/class-demo/students", input)).status,
    401,
  );
  assert.equal(
    (
      await f.request(
        "/classrooms/class-demo/memberships",
        { email: "giaovien@greenedu.demo" },
        f.teacher,
      )
    ).status,
    404,
  );
  assert.deepEqual(before(), counts);
  assert.deepEqual(f.db.prepare("PRAGMA foreign_key_check").all(), []);
});

test("shared student password recovery requires admin and preserves both class memberships and progress", async (t) => {
  const f = await fixture(t);
  f.db
    .prepare("INSERT INTO users VALUES (?,?,?,?,?,0)")
    .run(
      "other-teacher",
      "other@example.test",
      "GV khác",
      hashPassword("OtherPass123!"),
      "teacher",
    );
  f.db
    .prepare("INSERT INTO classrooms VALUES (?,?,?,?,?)")
    .run("other-class", "Lớp khác", "Toán", "10", "other-teacher");
  f.db
    .prepare("INSERT INTO memberships VALUES (?,?)")
    .run("other-class", "student-demo");
  f.db
    .prepare("INSERT INTO progress VALUES (?,?,?)")
    .run("student-demo", "chapter-1", 3600);
  const reset = { password: "ResetPass123!" };
  assert.equal(
    (
      await f.request(
        "/classrooms/class-demo/students/student-demo/password",
        reset,
        f.teacher,
      )
    ).status,
    403,
  );
  assert.equal((await f.request("/auth/me", undefined, f.student)).status, 200);
  assert.equal(
    (await f.request("/accounts/student-demo/password", reset, f.admin)).status,
    200,
  );
  assert.equal((await f.request("/auth/me", undefined, f.student)).status, 401);
  const login = await f.request("/auth/login", {
    email: "hocsinh@greenedu.demo",
    password: reset.password,
  });
  assert.equal(login.status, 200);
  assert.equal(login.data.mustChange, true);
  assert.equal(
    f.db
      .prepare(
        "SELECT COUNT(*) AS n FROM memberships WHERE student_id='student-demo'",
      )
      .get()!.n,
    2,
  );
  assert.equal(
    f.db
      .prepare("SELECT seconds FROM progress WHERE student_id='student-demo'")
      .get()!.seconds,
    3600,
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
