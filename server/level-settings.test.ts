import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDatabase, seedDemo, hashPassword } from "./db.js";
import { createApp } from "./app.js";
import { grantLearningMilestones } from "./learning.js";
import { classroomLevelMinutes } from "./level-settings.js";
import { studentLevel } from "../shared/student-levels.js";

test("configurable level boundaries use exact recorded seconds, with a 60-minute default", () => {
  assert.equal(studentLevel(3600).level, 2);
  for (const minutes of [1, 30, 60, 90, 1440]) {
    for (const level of [2, 3, 4, 5]) {
      const threshold = (level - 1) * minutes * 60;
      assert.equal(studentLevel(threshold - 0.01, minutes).level, level - 1);
      assert.equal(studentLevel(threshold, minutes).level, level);
      assert.equal(
        studentLevel(threshold, minutes).remainingSeconds,
        level === 5 ? 0 : minutes * 60,
      );
    }
    assert.equal(studentLevel((minutes * 60) / 2, minutes).progressPercent, 50);
  }
  for (const invalid of [0, -1, 1.5, NaN, Infinity, 1441])
    assert.deepEqual(studentLevel(7200, invalid), studentLevel(7200));
});

test("only the owning teacher configures their class; levels, garden, tickets and rewards agree without modifying progress", async (t) => {
  const db = openDatabase(":memory:");
  seedDemo(db);
  db.prepare("INSERT INTO users VALUES(?,?,?,?,?,0)").run(
    "other-teacher",
    "other@greenedu.test",
    "GV khác",
    hashPassword("GreenEdu123!"),
    "teacher",
  );
  db.prepare(
    "INSERT INTO classrooms VALUES('other-class','Lớp khác','Toán','10','other-teacher')",
  ).run();
  db.prepare(
    "INSERT INTO chapters VALUES('other-chapter','other-class','Chương khác')",
  ).run();
  db.prepare(
    "INSERT INTO memberships VALUES('other-class','student-demo')",
  ).run();
  for (const [id, seconds] of [
    ["chapter-1", 7200],
    ["chapter-2", 3600],
    ["other-chapter", 7200],
  ] as const)
    db.prepare("INSERT INTO progress VALUES('student-demo',?,?)").run(
      id,
      seconds,
    );
  const before = db.prepare("SELECT * FROM progress ORDER BY chapter_id").all();
  const server = createApp(db).listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}/api`;
  t.after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    db.close();
  });
  async function login(email: string) {
    const response = await fetch(base + "/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "GreenEdu123!" }),
    });
    assert.equal(response.status, 200);
    return response.headers.get("set-cookie")!.split(";")[0];
  }
  const teacher = await login("giaovien@greenedu.nk"),
    student = await login("hocsinh@greenedu.nk"),
    other = await login("other@greenedu.test");
  async function get(path: string, cookie = student) {
    const response = await fetch(base + path, { headers: { Cookie: cookie } });
    assert.equal(response.status, 200);
    return response.json();
  }
  const save = (cookie: string, minutes: unknown, id = "class-demo") =>
    fetch(base + `/classrooms/${id}/level-settings`, {
      method: "POST",
      headers: { Cookie: cookie, "Content-Type": "application/json" },
      body: JSON.stringify({ minutes }),
    });
  assert.equal(
    (await get("/classrooms/class-demo/learning", teacher)).levelMinutes,
    60,
  );
  assert.equal((await save(student, 30)).status, 403);
  assert.equal((await save(other, 30)).status, 403);
  assert.equal((await save(teacher, 30, "other-class")).status, 403);
  for (const invalid of [null, "30", 0, -1, 30.5, 1441])
    assert.equal((await save(teacher, invalid)).status, 400);
  assert.equal(
    db.prepare("SELECT COUNT(*) AS n FROM classroom_level_settings").get()!.n,
    0,
  );
  assert.equal((await save(teacher, 30)).status, 200);
  const classes = await get("/classrooms");
  const c = classes.find((c: any) => c.id === "class-demo");
  assert.equal(c.levelMinutes, 30);
  assert.deepEqual(
    c.chapters.map((ch: any) => ch.level),
    [5, 3, 1],
  );
  assert.equal(
    classes.find((c: any) => c.id === "other-class").chapters[0].level,
    3,
  );
  const learning = await get("/classrooms/class-demo/learning");
  assert.equal(learning.canConfigureLevels, false);
  assert.deepEqual(
    learning.chapters.map((ch: any) => ch.level),
    [5, 3, 1],
  );
  assert.deepEqual(
    learning.chapters.map((ch: any) => ch.tickets.granted),
    [3, 1, 0],
  );
  assert.ok(
    !learning.chapters[1].missing.some((s: string) => s.startsWith("Cần thêm")),
  );
  assert.equal(learning.rewards.length, 1);
  const roster = await get("/classrooms/class-demo/students", teacher);
  const studentRow = roster.find((r: any) => r.id === "student-demo");
  assert.deepEqual(
    studentRow.chapterLevels.map((ch: any) => ch.level),
    [5, 3, 1],
  );
  assert.equal(studentRow.trees, 1);
  const garden = await get("/classrooms/class-demo/garden");
  assert.equal(garden.members[0].level, 5);
  assert.equal(garden.trees.length, 1);
  const board = await get("/classrooms/class-demo/leaderboard");
  assert.equal(board.bloomedTrees, 1);
  assert.deepEqual(board.effort[0].chapterLevels, studentRow.chapterLevels);
  const earned = db
    .prepare("SELECT * FROM learning_tickets ORDER BY chapter_id,level")
    .all();
  const rewards = db
    .prepare("SELECT * FROM learning_rewards ORDER BY id")
    .all();
  await get("/classrooms/class-demo/learning");
  assert.deepEqual(
    db
      .prepare("SELECT * FROM learning_tickets ORDER BY chapter_id,level")
      .all(),
    earned,
  );
  assert.equal((await save(teacher, 120)).status, 200);
  const raised = await get("/classrooms/class-demo/learning");
  assert.deepEqual(
    raised.chapters.map((ch: any) => ch.level),
    [2, 1, 1],
  );
  assert.ok(
    raised.chapters[0].missing.some((s: string) => s.startsWith("Cần thêm")),
  );
  assert.equal((await get("/classrooms/class-demo/garden")).trees.length, 0);
  assert.deepEqual(
    db
      .prepare("SELECT * FROM learning_tickets ORDER BY chapter_id,level")
      .all(),
    earned,
  );
  assert.deepEqual(
    db.prepare("SELECT * FROM learning_rewards ORDER BY id").all(),
    rewards,
  );
  assert.deepEqual(
    db.prepare("SELECT * FROM progress ORDER BY chapter_id").all(),
    before,
  );
});

test("additive settings survive reopening and reward each custom milestone exactly once", () => {
  const directory = mkdtempSync(join(tmpdir(), "greenedu-level-settings-"));
  try {
    const path = join(directory, "test.sqlite");
    let db = openDatabase(path);
    seedDemo(db);
    assert.equal(classroomLevelMinutes(db, "class-demo"), 60);
    db.prepare(
      "INSERT INTO classroom_level_settings VALUES('class-demo',30,'teacher-demo',0)",
    ).run();
    const write = db.prepare(
      "INSERT INTO progress VALUES('student-demo','chapter-1',?) ON CONFLICT(student_id,chapter_id) DO UPDATE SET seconds=excluded.seconds",
    );
    for (const [seconds, tickets, rewards] of [
      [3599, 0, 0],
      [3600, 1, 0],
      [5400, 2, 0],
      [7199, 2, 0],
      [7200, 3, 1],
    ]) {
      write.run(seconds);
      grantLearningMilestones(db, "student-demo", 100);
      grantLearningMilestones(db, "student-demo", 200);
      assert.equal(
        db.prepare("SELECT COUNT(*) AS n FROM learning_tickets").get()!.n,
        tickets,
      );
      assert.equal(
        db.prepare("SELECT COUNT(*) AS n FROM learning_rewards").get()!.n,
        rewards,
      );
    }
    db.close();
    db = openDatabase(path);
    assert.equal(classroomLevelMinutes(db, "class-demo"), 30);
    assert.equal(
      db.prepare("SELECT seconds FROM progress").get()!.seconds,
      7200,
    );
    grantLearningMilestones(db, "student-demo", 300);
    assert.equal(
      db.prepare("SELECT COUNT(*) AS n FROM learning_tickets").get()!.n,
      3,
    );
    assert.equal(
      db.prepare("PRAGMA integrity_check").get()!.integrity_check,
      "ok",
    );
    assert.equal(db.prepare("PRAGMA foreign_key_check").all().length, 0);
    db.close();
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
