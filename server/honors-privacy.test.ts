import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase, seedDemo, hashPassword } from "./db.js";
import { createApp } from "./app.js";
import { rankClassHonors } from "../shared/class-honors.js";

test("student honors omit peers' accuracy and answer counts while preserving teacher rankings", async (t) => {
  const db = openDatabase(":memory:");
  seedDemo(db);
  const insert = db.prepare(
    "INSERT INTO attempts VALUES(?,?,?,?,?,'practice',?)",
  );
  for (const [id, student, correct] of [
    ["a", "student-demo", 1],
    ["b", "student-demo", 0],
    ["c", "student-2", 0],
    ["d", "student-2", 0],
    ["e", "student-3", 1],
    ["f", "student-3", 1],
  ] as const)
    insert.run(id, student, "question-1", correct ? 0 : 1, correct, 1);
  db.prepare(
    "INSERT INTO users VALUES('other','other@test.local','Khác',?,'teacher',0)",
  ).run(hashPassword("GreenEdu123!"));
  const server = createApp(db).listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  t.after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    db.close();
  });
  const base = `http://127.0.0.1:${address.port}/api`;
  async function login(email: string) {
    const r = await fetch(`${base}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "GreenEdu123!" }),
    });
    return r.headers.get("set-cookie")!.split(";")[0];
  }
  const teacher = await login("giaovien@greenedu.nk");
  const student = await login("hocsinh@greenedu.nk");
  const peer = await login("minhkhoi@greenedu.nk");
  const other = await login("other@test.local");
  async function get(cookie: string) {
    const r = await fetch(`${base}/classrooms/class-demo/honors`, {
      headers: { cookie },
    });
    return { status: r.status, data: await r.json() };
  }
  assert.equal((await get("")).status, 401);
  assert.equal((await get(other)).status, 403);
  const teacherData = (await get(teacher)).data;
  assert.equal(
    teacherData.find((r: { id: string }) => r.id === "student-demo").correct,
    1,
  );
  assert.equal(
    teacherData.find((r: { id: string }) => r.id === "student-demo").total,
    2,
  );
  const teacherRanking = rankClassHonors(teacherData, new Map()).map(
    (r) => r.id,
  );
  assert.deepEqual(teacherRanking, ["student-3", "student-demo", "student-2"]);
  for (const [cookie, own] of [
    [student, "student-demo"],
    [peer, "student-2"],
  ]) {
    const data = (await get(cookie)).data;
    assert.deepEqual(
      data.map((r: { id: string }) => r.id),
      teacherRanking,
    );
    assert.deepEqual(
      data.map((r: { position: number }) => r.position),
      [1, 2, 3],
    );
    for (const row of data) {
      if (row.id === own) {
        assert.equal(typeof row.correct, "number");
        assert.equal(row.total, 2);
        assert.equal(typeof row.accuracy, "number");
      } else
        for (const key of ["correct", "total", "accuracy"])
          assert.equal(Object.hasOwn(row, key), false, `${row.id} ${key}`);
      assert.equal(Object.hasOwn(row, "email"), false);
    }
  }
  assert.equal(
    (
      await fetch(`${base}/classrooms/class-demo/students`, {
        headers: { cookie: student },
      })
    ).status,
    403,
  );
});
