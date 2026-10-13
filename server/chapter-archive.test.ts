import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { openDatabase, seedDemo, hashPassword } from "./db.js";
import { createApp } from "./app.js";
import {
  archiveChapter,
  ensureChapterArchiveSchema,
} from "./chapter-archive.js";

async function fixture(t: TestContext) {
  const db = openDatabase(":memory:");
  seedDemo(db);
  db.prepare(
    "INSERT INTO users VALUES('other','other@fixture.test','Other',?,'teacher',0)",
  ).run(hashPassword("GreenEdu123!"));
  const server = createApp(db).listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const addr = server.address();
  assert.ok(addr && typeof addr !== "string");
  const port = addr.port;
  t.after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    db.close();
  });
  async function request(path: string, cookie: string, body?: unknown) {
    const r = await fetch(`http://127.0.0.1:${port}/api${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: { Cookie: cookie, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return {
      status: r.status,
      data: await r.json(),
      cookie: r.headers.get("set-cookie")?.split(";")[0] ?? "",
    };
  }
  const login = async (email: string) =>
    (await request("/auth/login", "", { email, password: "GreenEdu123!" }))
      .cookie;
  return {
    db,
    request,
    teacher: await login("giaovien@greenedu.nk"),
    student: await login("hocsinh@greenedu.nk"),
    other: await login("other@fixture.test"),
  };
}

test("only the owner can archive a chapter after confirmation; retries retain the first audit", async (t) => {
  const f = await fixture(t);
  for (const user of [f.student, f.other])
    assert.equal(
      (await f.request("/chapters/chapter-1/delete", user, { confirm: true }))
        .status,
      403,
    );
  assert.equal(
    (await f.request("/chapters/missing/delete", f.teacher, { confirm: true }))
      .status,
    404,
  );
  for (const confirm of [undefined, false, "true"])
    assert.equal(
      (await f.request("/chapters/chapter-1/delete", f.teacher, { confirm }))
        .status,
      400,
    );
  assert.equal(
    f.db.prepare("SELECT COUNT(*) AS n FROM archived_chapters").get()!.n,
    0,
  );
  assert.equal(
    (
      await f.request("/chapters/chapter-1/delete", f.teacher, {
        confirm: true,
      })
    ).status,
    200,
  );
  const audit = f.db.prepare("SELECT * FROM archived_chapters").all();
  assert.equal(
    (
      await f.request("/chapters/chapter-1/delete", f.teacher, {
        confirm: true,
      })
    ).status,
    200,
  );
  assert.deepEqual(
    f.db.prepare("SELECT * FROM archived_chapters").all(),
    audit,
  );
  assert.equal(f.db.prepare("PRAGMA foreign_key_check").all().length, 0);
});

test("archive hides new learning but retains progress, questions, corrections and saved reviews", async (t) => {
  const f = await fixture(t);
  const q = f.db
    .prepare("SELECT * FROM questions WHERE chapter_id='chapter-1' LIMIT 1")
    .get()!;
  assert.equal(
    (
      await f.request("/attempts", f.student, {
        questionId: q.id,
        selected: (Number(q.correct_index) + 1) % 4,
        mode: "practice",
        requestId: randomUUID(),
      })
    ).status,
    200,
  );
  f.db
    .prepare("INSERT INTO progress VALUES('student-demo','chapter-1',1200)")
    .run();
  const review = await f.request("/classrooms/class-demo/reviews", f.student, {
    chapterIds: ["chapter-1"],
    questionCount: 1,
    requestId: randomUUID(),
  });
  assert.equal(review.status, 201);
  const tables = [
    "chapters",
    "questions",
    "attempts",
    "corrections",
    "progress",
    "lessons",
    "review_sessions",
  ];
  const counts = () =>
    tables.map(
      (name) => f.db.prepare(`SELECT COUNT(*) AS n FROM ${name}`).get()!.n,
    );
  const before = counts();
  assert.equal(
    (
      await f.request("/chapters/chapter-1/delete", f.teacher, {
        confirm: true,
      })
    ).status,
    200,
  );
  assert.deepEqual(counts(), before);
  const classes = await f.request("/classrooms", f.student);
  assert.ok(
    !classes.data[0].chapters.some((c: { id: string }) => c.id === "chapter-1"),
  );
  const learning = await f.request(
    "/classrooms/class-demo/learning",
    f.teacher,
  );
  assert.ok(
    !learning.data.chapters.some((c: { id: string }) => c.id === "chapter-1"),
  );
  assert.equal(
    (await f.request("/chapters/chapter-1/questions", f.student)).status,
    409,
  );
  assert.equal(
    (
      await f.request("/chapters/chapter-1/exam-access", f.teacher, {
        enabled: true,
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await f.request("/chapters/chapter-1/lessons", f.teacher, {
        title: "New",
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await f.request("/classrooms/class-demo/reviews", f.student, {
        chapterIds: ["chapter-1"],
        requestId: randomUUID(),
      })
    ).status,
    403,
  );
  assert.equal(
    (await f.request(`/learning/reviews/${review.data.id}`, f.student)).status,
    200,
  );
  assert.equal((await f.request(`/questions/${q.id}/history`, f.teacher)).status, 200);
  assert.equal(
    (await f.request("/chapters/chapter-1", f.student)).data.seconds,
    1200,
  );
  assert.equal(
    (
      await f.request(
        "/chapters/chapter-1/questions?mode=correction",
        f.student,
      )
    ).data.length,
    1,
  );
  assert.equal(
    (
      await f.request("/attempts", f.student, {
        questionId: q.id,
        selected: Number(q.correct_index),
        mode: "correction",
        requestId: randomUUID(),
      })
    ).status,
    200,
  );
  assert.equal(
    f.db
      .prepare("SELECT resolved FROM corrections WHERE question_id=?")
      .get(q.id)!.resolved,
    1,
  );
  assert.equal(f.db.prepare("PRAGMA foreign_key_check").all().length, 0);
});

test("additive schema preserves existing chapters and archive rolls back on failure", async (t) => {
  const f = await fixture(t);
  const chapters = f.db.prepare("SELECT * FROM chapters").all();
  f.db.exec("DROP TABLE archived_chapters");
  ensureChapterArchiveSchema(f.db);
  ensureChapterArchiveSchema(f.db);
  assert.deepEqual(f.db.prepare("SELECT * FROM chapters").all(), chapters);
  const questions = f.db.prepare("SELECT * FROM questions").all();
  f.db.exec(
    "CREATE TRIGGER reject_archive BEFORE UPDATE OF active ON questions BEGIN SELECT RAISE(ABORT,'fixture failure'); END;",
  );
  assert.throws(
    () => archiveChapter(f.db, "chapter-1", "teacher-demo", Date.now()),
    /fixture failure/,
  );
  assert.equal(
    f.db.prepare("SELECT COUNT(*) AS n FROM archived_chapters").get()!.n,
    0,
  );
  assert.deepEqual(f.db.prepare("SELECT * FROM questions").all(), questions);
});
