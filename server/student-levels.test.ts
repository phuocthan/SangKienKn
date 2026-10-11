import { test } from "node:test";
import assert from "node:assert/strict";
import { studentLevel } from "../shared/student-levels.js";
import { createApp } from "./app.js";
import { hashPassword, openDatabase, seedDemo } from "./db.js";

test("student icons use five exact active-study milestones and never show early completion", () => {
  for (const [seconds, level, name] of [
    [0, 1, "Mầm"],
    [3599, 1, "Mầm"],
    [3600, 2, "Chồi"],
    [7199, 2, "Chồi"],
    [7200, 3, "Cây Non"],
    [10799, 3, "Cây Non"],
    [10800, 4, "Đơm Hoa"],
    [14399, 4, "Đơm Hoa"],
    [14400, 5, "Kết Trái"],
    [86400, 5, "Kết Trái"],
  ] as const) {
    const stage = studentLevel(seconds);
    assert.equal(stage.level, level);
    assert.equal(stage.name, name);
    assert.equal(
      stage.remainingSeconds,
      level === 5 ? 0 : level * 3600 - seconds,
    );
  }
  assert.equal(studentLevel(3599.99).progressPercent, 99);
  assert.equal(studentLevel(3600).progressPercent, 0);
  assert.equal(studentLevel(14400).progressPercent, 100);
});

test("student icon calculation handles empty or invalid totals without inventing progress", () => {
  for (const seconds of [-1, NaN, Infinity, -Infinity]) {
    assert.deepEqual(studentLevel(seconds), studentLevel(0));
  }
});

test("API keeps chapter levels independent within each class/subject and agrees with roster and leaderboard", async (t) => {
  const db = openDatabase(":memory:");
  seedDemo(db);
  db.prepare("INSERT INTO progress VALUES (?,?,?)").run(
    "student-demo",
    "chapter-1",
    7200,
  );
  db.prepare("INSERT INTO progress VALUES (?,?,?)").run(
    "student-demo",
    "chapter-2",
    7200,
  );
  for (const [id, subject, seconds] of [
    ["math", "Toán", 3600],
    ["physics-other", "Vật lý", 0],
  ] as const) {
    db.prepare("INSERT INTO classrooms VALUES (?,?,?,?,?)").run(
      id,
      "Lớp 10A2",
      subject,
      "10",
      "teacher-demo",
    );
    db.prepare("INSERT INTO chapters VALUES (?,?,?)").run(
      `${id}-chapter`,
      id,
      "Chương 1",
    );
    db.prepare("INSERT INTO memberships VALUES (?,?)").run(id, "student-demo");
    db.prepare("INSERT INTO progress VALUES (?,?,?)").run(
      "student-demo",
      `${id}-chapter`,
      seconds,
    );
  }
  db.prepare("INSERT INTO users VALUES (?,?,?,?,?,0)").run(
    "other-student",
    "other@example.test",
    "HS khác",
    hashPassword("OtherPass123!"),
    "student",
  );
  db.prepare("INSERT INTO memberships VALUES (?,?)").run(
    "math",
    "other-student",
  );
  db.prepare("INSERT INTO progress VALUES (?,?,?)").run(
    "other-student",
    "math-chapter",
    14400,
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
  async function login(email: string) {
    const response = await fetch(base + "/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "GreenEdu123!" }),
    });
    assert.equal(response.status, 200);
    return response.headers.get("set-cookie")!.split(";")[0];
  }
  const student = await login("hocsinh@greenedu.nk");
  const teacher = await login("giaovien@greenedu.nk");
  async function get(path: string, cookie: string) {
    const response = await fetch(base + path, { headers: { Cookie: cookie } });
    assert.equal(response.status, 200);
    return response.json();
  }
  const classrooms = await get("/classrooms", student);
  for (const [id, level, seconds] of [
    ["class-demo", 5, 14400],
    ["math", 2, 3600],
    ["physics-other", 1, 0],
  ] as const) {
    const classroom = classrooms.find((c: { id: string }) => c.id === id);
    assert.equal(classroom.studentLevel.level, level);
    assert.equal(classroom.studentLevel.seconds, seconds);
    const roster = await get(`/classrooms/${id}/students`, teacher);
    const chapterLevels = roster.find(
      (u: { id: string }) => u.id === "student-demo",
    ).chapterLevels;
    assert.deepEqual(
      chapterLevels.map((ch: any) => [ch.chapterId, ch.level, ch.seconds]),
      classroom.chapters.map((ch: any) => [ch.id, ch.level, ch.seconds]),
    );
    if (id === "class-demo")
      assert.deepEqual(
        chapterLevels.map((ch: any) => ch.level),
        [3, 3, 1],
      );
    assert.deepEqual(
      roster.find((u: { id: string }) => u.id === "student-demo").studentLevel,
      classroom.studentLevel,
    );
    const board = await get(`/classrooms/${id}/leaderboard`, student);
    if (seconds > 0)
      assert.deepEqual(
        board.effort.find((u: { id: string }) => u.id === "student-demo")
          .chapterLevels,
        chapterLevels,
      );
    if (seconds > 0)
      assert.deepEqual(
        board.effort.find((u: { id: string }) => u.id === "student-demo")
          .studentLevel,
        classroom.studentLevel,
      );
  }
  const before = db
    .prepare(
      "SELECT student_id,chapter_id,seconds FROM progress ORDER BY student_id,chapter_id",
    )
    .all();
  const teacherClasses = await get("/classrooms", teacher);
  assert.ok(
    teacherClasses.every(
      (c: { studentLevel: unknown }) => c.studentLevel === null,
    ),
  );
  await get("/classrooms", student);
  assert.deepEqual(
    db
      .prepare(
        "SELECT student_id,chapter_id,seconds FROM progress ORDER BY student_id,chapter_id",
      )
      .all(),
    before,
  );
  assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
  // Match the integer seconds already shown by chapter summaries and ranking.
  db.prepare(
    "UPDATE progress SET seconds=3599.9 WHERE student_id='student-demo' AND chapter_id='physics-other-chapter'",
  ).run();
  db.prepare(
    "INSERT INTO chapters VALUES ('fractional-chapter','physics-other','Chương 2')",
  ).run();
  db.prepare(
    "INSERT INTO progress VALUES ('student-demo','fractional-chapter',0.1)",
  ).run();
  const fractional = (await get("/classrooms", student)).find(
    (c: { id: string }) => c.id === "physics-other",
  );
  assert.equal(fractional.studentLevel.level, 1);
  assert.equal(fractional.studentLevel.seconds, 3599);
  const fractionalRoster = await get(
    "/classrooms/physics-other/students",
    teacher,
  );
  assert.deepEqual(fractionalRoster[0].studentLevel, fractional.studentLevel);
});
