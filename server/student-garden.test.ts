import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "./app.js";
import { openDatabase, hashPassword } from "./db.js";

test("student garden includes every current member once, uses max chapter level, exposes avatars and stays inside class permissions", async (t) => {
  const db = openDatabase(":memory:");
  const password = hashPassword("GardenPass123!");
  for (const [id, name, role] of [
    ["teacher", "Giáo viên", "teacher"],
    ["other-teacher", "Giáo viên khác", "teacher"],
    ["fruit", "Trần Hoàng Nhã Linh", "student"],
    ["young", "Nguyễn Thị Nhã Linh", "student"],
    ["new", "An", "student"],
    ["removed", "Đã rời lớp", "student"],
    ["outside", "Ngoài lớp", "student"],
  ])
    db.prepare("INSERT INTO users VALUES (?,?,?,?,?,0)").run(
      id,
      `${id}@test.local`,
      name,
      password,
      role,
    );
  db.prepare(
    "INSERT INTO classrooms VALUES('class','Lớp 11/2','Vật lý','11','teacher')",
  ).run();
  db.prepare(
    "INSERT INTO classrooms VALUES('other','Lớp 11/2','Toán','11','other-teacher')",
  ).run();
  for (const id of ["ch1", "ch2"])
    db.prepare("INSERT INTO chapters VALUES(?, 'class', ?)").run(id, id);
  db.prepare(
    "INSERT INTO chapters VALUES('other-ch','other','Chương khác')",
  ).run();
  for (const id of ["fruit", "young", "new", "removed"])
    db.prepare("INSERT INTO memberships VALUES('class',?)").run(id);
  db.prepare("INSERT INTO memberships VALUES('other','young')").run();
  db.prepare("INSERT INTO memberships VALUES('other','outside')").run();
  for (const [student, chapter, seconds] of [
    ["fruit", "ch1", 14400],
    ["fruit", "ch2", 28800],
    ["young", "ch1", 7200],
    ["young", "ch2", 7200],
    ["young", "other-ch", 86400],
    ["removed", "ch1", 86400],
  ])
    db.prepare("INSERT INTO progress VALUES(?,?,?)").run(
      student,
      chapter,
      seconds,
    );
  db.prepare(
    "DELETE FROM memberships WHERE classroom_id='class' AND student_id='removed'",
  ).run();
  db.prepare(
    "INSERT INTO user_avatars(user_id,avatar_id) VALUES('fruit','student-1')",
  ).run();
  const before = db
    .prepare("SELECT * FROM progress ORDER BY student_id,chapter_id")
    .all();
  const server = createApp(db).listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}/api`;
  t.after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    db.close();
  });
  async function login(id: string) {
    const response = await fetch(`${base}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `${id}@test.local`,
        password: "GardenPass123!",
      }),
    });
    assert.equal(response.status, 200);
    return response.headers.get("set-cookie")!.split(";")[0];
  }
  const student = await login("young"),
    teacher = await login("teacher");
  async function garden(classId: string, cookie = "") {
    return fetch(`${base}/classrooms/${classId}/garden`, {
      headers: { Cookie: cookie },
    });
  }
  assert.equal((await garden("class")).status, 401);
  assert.equal((await garden("class", await login("outside"))).status, 403);
  assert.equal(
    (await garden("class", await login("other-teacher"))).status,
    403,
  );
  const response = await garden("class", student);
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.deepEqual(data.members, [
    {
      studentId: "fruit",
      studentName: "Trần Hoàng Nhã Linh",
      avatarId: "student-1",
      level: 5,
    },
    {
      studentId: "young",
      studentName: "Nguyễn Thị Nhã Linh",
      avatarId: null,
      level: 3,
    },
    { studentId: "new", studentName: "An", avatarId: null, level: 1 },
  ]);
  assert.equal(data.trees.length, 2);
  assert.deepEqual(await (await garden("class", teacher)).json(), data);
  assert.equal(new Set(data.members.map((m: any) => m.studentId)).size, 3);
  assert.deepEqual(
    db.prepare("SELECT * FROM progress ORDER BY student_id,chapter_id").all(),
    before,
  );
  const other = await (await garden("other", student)).json();
  assert.equal(
    other.members.find((m: any) => m.studentId === "young").level,
    5,
  );
  db.prepare(
    "INSERT INTO classrooms VALUES('empty','Lớp trống','Sinh học','11','teacher')",
  ).run();
  db.prepare("INSERT INTO memberships VALUES('empty','new')").run();
  assert.equal(
    (await (await garden("empty", teacher)).json()).members[0].level,
    1,
  );
  assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
});
