import { test } from "node:test";
import assert from "node:assert/strict";
import { loginEmail } from "../shared/login-email.js";
import { openDatabase, seedDemo, hashPassword } from "./db.js";
import { changeLoginDomain } from "./email-domain.js";
import { createApp } from "./app.js";

test("short usernames use greenedu.nk and full addresses are preserved", () => {
  assert.equal(loginEmail("  truongnhavy  "), "truongnhavy@greenedu.nk");
  assert.equal(loginEmail("teacher@school.example"), "teacher@school.example");
  assert.equal(loginEmail("  teacher@greenedu.nk  "), "teacher@greenedu.nk");
});

test("domain migration changes all roles once and preserves passwords, IDs, memberships, progress and sessions", () => {
  const db = openDatabase(":memory:");
  seedDemo(db);
  try {
    db.exec(
      "UPDATE users SET email=replace(email,'@greenedu.nk','@greenedu.demo')",
    );
    db.prepare("INSERT INTO users VALUES (?,?,?,?,?,1)").run(
      "admin",
      "owner@gmail.com",
      "Admin",
      hashPassword("TestAdmin123!"),
      "admin",
    );
    db.prepare("INSERT INTO sessions VALUES (?,?,?)").run(
      "token",
      "student-demo",
      Date.now() + 100000,
    );
    db.prepare("INSERT INTO progress VALUES (?,?,?)").run(
      "student-demo",
      "chapter-1",
      1234,
    );
    const oldUsers = db.prepare("SELECT * FROM users ORDER BY id").all();
    const tables = [
      "memberships",
      "progress",
      "sessions",
      "chapters",
      "questions",
    ];
    const old = Object.fromEntries(
      tables.map((table) => [
        table,
        db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all(),
      ]),
    );
    assert.deepEqual(changeLoginDomain(db), {
      domain: "greenedu.nk",
      total: 5,
      changed: 5,
    });
    assert.deepEqual(changeLoginDomain(db), {
      domain: "greenedu.nk",
      total: 5,
      changed: 0,
    });
    for (const before of oldUsers) {
      const after = db
        .prepare("SELECT * FROM users WHERE id=?")
        .get(before.id)!;
      assert.equal(
        after.email,
        String(before.email).split("@")[0] + "@greenedu.nk",
      );
      assert.deepEqual({ ...after, email: before.email }, { ...before });
    }
    for (const table of tables)
      assert.deepEqual(
        db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all(),
        old[table],
      );
    assert.equal(db.prepare("PRAGMA foreign_key_check").all().length, 0);
  } finally {
    db.close();
  }
});

test("same username from two domains blocks the whole change instead of merging or renaming", () => {
  const db = openDatabase(":memory:");
  seedDemo(db);
  try {
    db.prepare("INSERT INTO users VALUES (?,?,?,?,?,0)").run(
      "collision",
      "hocsinh@gmail.com",
      "Other",
      hashPassword("OtherPass123!"),
      "teacher",
    );
    const before = db.prepare("SELECT * FROM users ORDER BY id").all();
    assert.throws(() => changeLoginDomain(db), /trùng/);
    assert.deepEqual(
      db.prepare("SELECT * FROM users ORDER BY id").all(),
      before,
    );
  } finally {
    db.close();
  }
});

test("invalid stored emails block migration without changing any account", () => {
  const db = openDatabase(":memory:");
  seedDemo(db);
  try {
    db.prepare("UPDATE users SET email=? WHERE id=?").run(
      "bad email",
      "student-3",
    );
    const before = db.prepare("SELECT * FROM users ORDER BY id").all();
    assert.throws(() => changeLoginDomain(db), /không hợp lệ/);
    assert.deepEqual(
      db.prepare("SELECT * FROM users ORDER BY id").all(),
      before,
    );
  } finally {
    db.close();
  }
});

test("login supports new full/short addresses for every role, rejects old address and retains existing sessions", async (t) => {
  const db = openDatabase(":memory:");
  seedDemo(db);
  db.exec(
    "UPDATE users SET email=replace(email,'@greenedu.nk','@greenedu.demo')",
  );
  db.prepare("INSERT INTO users VALUES (?,?,?,?,?,1)").run(
    "admin",
    "owner@gmail.com",
    "Admin",
    hashPassword("TestAdmin123!"),
    "admin",
  );
  const server = createApp(db).listen(0, "127.0.0.1");
  await new Promise<void>((r) => server.once("listening", r));
  t.after(async () => {
    await new Promise<void>((r) => server.close(() => r()));
    db.close();
  });
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}/api`;
  const login = (email: string, password = "GreenEdu123!") =>
    fetch(base + "/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  const old = await login("hocsinh@greenedu.demo");
  assert.equal(old.status, 200);
  const cookie = old.headers.get("set-cookie")!.split(";")[0];
  changeLoginDomain(db);
  const me = await fetch(base + "/auth/me", { headers: { Cookie: cookie } });
  assert.equal(me.status, 200);
  assert.equal((await me.json()).email, "hocsinh@greenedu.nk");
  assert.equal((await login("hocsinh@greenedu.demo")).status, 401);
  assert.equal((await login("hocsinh", "WrongPass123!")).status, 401);
  for (const [email, role, pass] of [
    ["  hocsinh  ", "student", "GreenEdu123!"],
    ["giaovien@greenedu.nk", "teacher", "GreenEdu123!"],
    ["owner", "admin", "TestAdmin123!"],
  ]) {
    const response = await login(email, pass);
    assert.equal(response.status, 200);
    const user = await response.json();
    assert.equal(user.role, role);
    assert.ok(user.email.endsWith("@greenedu.nk"));
    if (role === "admin") assert.equal(user.mustChange, true);
  }
});
