import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { openDatabase, seedDemo, hashPassword } from "./db.js";
import { createApp } from "./app.js";
import { chapterLessons, ensureLessonSchema, addLesson, archiveLesson } from "./lesson-catalog.js";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

async function fixture(t: TestContext) {
  const db = openDatabase(":memory:"); seedDemo(db);
  db.prepare("INSERT INTO users VALUES('other','other@test.local','Other',?,'teacher',0)").run(hashPassword("GreenEdu123!"));
  const server = createApp(db).listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address(); assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}/api`;
  t.after(async () => { await new Promise<void>((resolve) => server.close(() => resolve())); db.close(); });
  async function request(path: string, body?: unknown, cookie = "") {
    const response = await fetch(base + path, { method: body === undefined ? "GET" : "POST", headers: { Cookie: cookie, "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: response.status, data: await response.json(), cookie: response.headers.get("set-cookie")?.split(";")[0] ?? "" };
  }
  const login = async (email: string) => (await request("/auth/login", { email, password: "GreenEdu123!" })).cookie;
  return { db, request, teacher: await login("giaovien@greenedu.nk"), student: await login("hocsinh@greenedu.nk"), other: await login("other@test.local") };
}

test("teacher adds lessons atomically; normalized duplicates and unauthorized/invalid requests do not change the catalog", async (t) => {
  const f = await fixture(t);
  for (const cookie of [f.student, f.other])
    assert.equal((await f.request("/chapters/chapter-1/lessons", { title: "Bài mới" }, cookie)).status, 403);
  for (const title of ["", " ", "x".repeat(121), null])
    assert.equal((await f.request("/chapters/chapter-1/lessons", { title }, f.teacher)).status, 400);
  const responses = await Promise.all([" Bài mới ", "BÀI   MỚI"].map((title) => f.request("/chapters/chapter-1/lessons", { title }, f.teacher)));
  assert.deepEqual(responses.map((r) => r.status).sort(), [201,409]);
  assert.equal((await f.request("/chapters/chapter-1/lessons", { title: "Bài mới".normalize("NFD") }, f.teacher)).status, 409);
  assert.equal((await f.request("/chapters/chapter-2/lessons", { title: "Bài mới" }, f.teacher)).status, 201);
  assert.equal((await f.request("/chapters/missing/lessons", { title: "Bài mới" }, f.teacher)).status, 404);
  const legacy = String(chapterLessons(f.db, "chapter-1").find((l) => l.questionCount !== 0)!.title);
  assert.equal((await f.request("/chapters/chapter-1/lessons", { title: legacy }, f.teacher)).status, 409);
  assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM lessons").get()!.n, 2);
  const data = (await f.request("/classrooms", undefined, f.teacher)).data;
  assert.equal(data[0].chapters[0].canManageLessons, true);
});

test("deleting a legacy lesson hides new study questions but preserves notebook, versions and published exam snapshots; restoring never auto-publishes", async (t) => {
  const f = await fixture(t);
  const q = f.db.prepare("SELECT * FROM questions WHERE id='question-1'").get()!;
  const title = String(q.lesson);
  await f.request("/attempts", { questionId: q.id, selected: 1, mode: "practice", requestId: randomUUID() }, f.student);
  const attempts = f.db.prepare("SELECT * FROM attempts").all();
  const corrections = f.db.prepare("SELECT * FROM corrections").all();
  const questions = f.db.prepare("SELECT * FROM questions").all();
  const definition = await f.request("/classrooms/class-demo/exams", { title: "Snapshot", chapterIds: ["chapter-1"], questionCount: 3, startsAt: Date.now(), closesAt: Date.now() + 3600000 }, f.teacher);
  assert.equal(definition.status, 201);
  const exams = f.db.prepare("SELECT * FROM exam_definitions").all();
  for (const cookie of [f.student, f.other])
    assert.equal((await f.request("/chapters/chapter-1/lessons/delete", { title }, cookie)).status, 403);
  const removed = await f.request("/chapters/chapter-1/lessons/delete", { title }, f.teacher);
  assert.equal(removed.status, 200); assert.ok(removed.data.hiddenQuestions > 0);
  assert.equal((await f.request("/chapters/chapter-1/lessons/delete", { title }, f.teacher)).data.hiddenQuestions, 0);
  assert.equal(chapterLessons(f.db, "chapter-1").some((l) => l.title === title), false);
  assert.deepEqual(f.db.prepare("SELECT * FROM attempts").all(), attempts);
  assert.deepEqual(f.db.prepare("SELECT * FROM corrections").all(), corrections);
  assert.deepEqual(f.db.prepare("SELECT * FROM exam_definitions").all(), exams);
  const after = f.db.prepare("SELECT * FROM questions").all();
  assert.deepEqual(after.map(({ active: _a, ...row }) => row), questions.map(({ active: _a, ...row }) => row));
  assert.equal((await f.request("/attempts", { questionId: q.id, selected: 0, mode: "practice", requestId: randomUUID() }, f.student)).status, 409);
  assert.equal((await f.request(`/questions/${q.id}/visibility`, { active: true }, f.teacher)).status, 409);
  assert.equal((await f.request("/chapters/chapter-1/questions", { text: "New", choices: ["A","B","C","D"], correctIndex: 0, explanation: "A", lesson: title }, f.teacher)).status, 409);
  assert.equal((await f.request("/attempts", { questionId: q.id, selected: 0, mode: "correction", requestId: randomUUID() }, f.student)).status, 200);
  assert.equal((await f.request("/chapters/chapter-1/lessons", { title }, f.teacher)).status, 201);
  assert.equal(chapterLessons(f.db, "chapter-1").find((l) => l.title === title)!.questionCount, 0);
  assert.equal((await f.request(`/questions/${q.id}/visibility`, { active: true }, f.teacher)).status, 200);
  assert.equal(chapterLessons(f.db, "chapter-1").find((l) => l.title === title)!.questionCount, 1);
});

test("empty lesson deletion and restoration survive restart, keep other chapters, and remain idempotent", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "greenedu-lessons-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const path = join(dir, "lessons.sqlite");
  let db = openDatabase(path);
  try {
    seedDemo(db);
    const first = addLesson(db, "chapter-1", "Bài trống");
    addLesson(db, "chapter-2", "Bài trống");
    archiveLesson(db, "chapter-1", "Bài trống", "teacher-demo", 123);
    ensureLessonSchema(db); db.close(); db = openDatabase(path);
    assert.equal(chapterLessons(db, "chapter-1").some((l) => l.title === "Bài trống"), false);
    assert.equal(chapterLessons(db, "chapter-2").some((l) => l.title === "Bài trống"), true);
    assert.equal(archiveLesson(db, "chapter-1", "Bài trống", "teacher-demo", 456).hiddenQuestions, 0);
    assert.equal(db.prepare("SELECT archived_at FROM archived_lessons").get()!.archived_at, 123);
    assert.equal(addLesson(db, "chapter-1", "BÀI TRỐNG").id, first.id);
    assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
  } finally { db.close(); }
});
