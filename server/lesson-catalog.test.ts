import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { openDatabase, seedDemo } from "./db.js";
import { createApp } from "./app.js";
import {
  chapterLessons,
  ensureLessonSchema,
  importCurriculum,
  type CurriculumChapter,
} from "./lesson-catalog.js";

const source = JSON.parse(
  readFileSync(
    new URL("../docs/physics-11-curriculum-2026-2027.json", import.meta.url),
    "utf8",
  ),
);
const catalog: CurriculumChapter[] = source.regular.chapters.map((ch: any) => ({
  title: ch.title,
  lessons: [
    ...ch.lessons.map((l: any) => ({ ...l, kind: "lesson" })),
    ...ch.supplementalSessions.map((l: any) => ({
      ...l,
      kind: "supplemental",
    })),
  ]
    .sort((a: any, b: any) => a.sourceRows[0].row - b.sourceRows[0].row)
    .map((l: any) => ({
      title: l.title,
      number: l.number ?? null,
      kind: l.kind,
    })),
}));
function setup() {
  const db = openDatabase(":memory:");
  seedDemo(db);
  db.prepare("INSERT INTO classrooms VALUES (?,?,?,?,?)").run(
    "physics11",
    "Lớp 11/2 ♥",
    "Vật Lý",
    "11",
    "teacher-demo",
  );
  db.prepare("INSERT INTO memberships VALUES (?,?)").run(
    "physics11",
    "student-demo",
  );
  return db;
}

test("curriculum imports 4 chapters and 26 numbered lessons plus separate exercise; repeat is a no-op", () => {
  const db = setup();
  try {
    const questionsBefore = db
      .prepare("SELECT * FROM questions ORDER BY id")
      .all();
    const oldChapters = db.prepare("SELECT * FROM chapters ORDER BY id").all();
    assert.deepEqual(importCurriculum(db, "physics11", catalog), {
      createdChapters: 4,
      createdLessons: 27,
      requestedChapters: 4,
      requestedLessons: 27,
    });
    const lessonRows = db.prepare("SELECT * FROM lessons ORDER BY id").all();
    const repeated = importCurriculum(db, "physics11", catalog);
    assert.equal(repeated.createdChapters, 0);
    assert.equal(repeated.createdLessons, 0);
    ensureLessonSchema(db);
    assert.deepEqual(
      db.prepare("SELECT * FROM lessons ORDER BY id").all(),
      lessonRows,
    );
    assert.deepEqual(
      db.prepare("SELECT * FROM questions ORDER BY id").all(),
      questionsBefore,
    );
    for (const ch of oldChapters)
      assert.deepEqual(
        db.prepare("SELECT * FROM chapters WHERE id=?").get(ch.id),
        ch,
      );
    assert.equal(
      db.prepare("SELECT COUNT(*) n FROM lessons WHERE kind='lesson'").get()!.n,
      26,
    );
    assert.equal(
      db
        .prepare("SELECT COUNT(*) n FROM lessons WHERE kind='supplemental'")
        .get()!.n,
      1,
    );
    const first = db
      .prepare(
        "SELECT id FROM chapters WHERE classroom_id='physics11' ORDER BY rowid",
      )
      .get()!;
    assert.deepEqual(
      db
        .prepare(
          "SELECT number FROM lessons WHERE chapter_id=? ORDER BY sort_order",
        )
        .all(first.id)
        .map((l) => l.number),
      [1, 2, 3, 4, 5, 7, 6],
    );
    assert.ok(
      chapterLessons(db, String(first.id)).every((l) => l.questionCount === 0),
    );
  } finally {
    db.close();
  }
});

test("same curriculum in a second subject/classroom remains separate", () => {
  const db = setup();
  try {
    db.prepare("INSERT INTO classrooms VALUES (?,?,?,?,?)").run(
      "other",
      "Lớp khác",
      "Vật Lý",
      "11",
      "teacher-demo",
    );
    importCurriculum(db, "physics11", catalog);
    importCurriculum(db, "other", catalog);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM lessons").get()!.n, 54);
    assert.equal(
      db.prepare("SELECT COUNT(DISTINCT id) n FROM lessons").get()!.n,
      54,
    );
  } finally {
    db.close();
  }
});

test("duplicate input and a missing classroom write nothing", () => {
  const db = setup();
  try {
    assert.throws(
      () => importCurriculum(db, "physics11", [catalog[0], catalog[0]]),
      /trùng/,
    );
    assert.throws(() => importCurriculum(db, "missing", catalog), /lớp/);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM lessons").get()!.n, 0);
    assert.equal(
      db
        .prepare(
          "SELECT COUNT(*) n FROM chapters WHERE classroom_id='physics11'",
        )
        .get()!.n,
      0,
    );
  } finally {
    db.close();
  }
});

test("conflicting existing lesson rolls back earlier chapter creation", () => {
  const db = setup();
  try {
    importCurriculum(db, "physics11", [catalog[3]]);
    db.exec("UPDATE lessons SET number=999");
    const before = db.prepare("SELECT * FROM chapters ORDER BY id").all();
    assert.throws(() => importCurriculum(db, "physics11", catalog), /khác/);
    assert.deepEqual(
      db.prepare("SELECT * FROM chapters ORDER BY id").all(),
      before,
    );
    assert.equal(db.prepare("SELECT COUNT(*) n FROM lessons").get()!.n, 5);
  } finally {
    db.close();
  }
});

test("catalog and legacy questions combine without duplicates and count only active current questions", () => {
  const db = setup();
  try {
    const original = db.prepare("SELECT * FROM questions ORDER BY id").all();
    const oldTitle = String(
      original.find((q) => q.chapter_id === "chapter-1")!.lesson,
    );
    importCurriculum(db, "class-demo", [
      {
        title: "Chương 1 · Mở đầu",
        lessons: [{ title: oldTitle }, { title: "Bài mới" }],
      },
    ]);
    const before = chapterLessons(db, "chapter-1");
    assert.equal(before.filter((l) => l.title === oldTitle).length, 1);
    assert.equal(before.find((l) => l.title === "Bài mới")!.questionCount, 0);
    assert.deepEqual(
      db.prepare("SELECT * FROM questions ORDER BY id").all(),
      original,
    );
    db.prepare("UPDATE questions SET active=0 WHERE chapter_id=?").run(
      "chapter-1",
    );
    assert.ok(
      chapterLessons(db, "chapter-1").every((l) => l.questionCount === 0),
    );
  } finally {
    db.close();
  }
});

test("API exposes empty lessons only for owned/enrolled classrooms, never answer content", async (t) => {
  const db = setup();
  importCurriculum(db, "physics11", catalog);
  const server = createApp(db).listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  t.after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    db.close();
  });
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}/api`;
  for (const email of [
    "giaovien@greenedu.nk",
    "hocsinh@greenedu.nk",
    "minhkhoi@greenedu.nk",
  ]) {
    const login = await fetch(base + "/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "GreenEdu123!" }),
    });
    assert.equal(login.status, 200);
    const cookie = login.headers.get("set-cookie")!.split(";")[0];
    const response = await fetch(base + "/classrooms", {
      headers: { Cookie: cookie },
    });
    assert.equal(response.status, 200);
    const classes = await response.json();
    const target = classes.find((c: any) => c.id === "physics11");
    if (email === "minhkhoi@greenedu.nk") {
      assert.equal(target, undefined);
      continue;
    }
    assert.equal(target.chapters.length, 4);
    assert.equal(target.chapters.flatMap((c: any) => c.lessons).length, 27);
    assert.ok(target.chapters.every((c: any) => c.questionCount === 0));
    assert.ok(
      target.chapters
        .flatMap((c: any) => c.lessons)
        .every((l: any) => l.questionCount === 0 && !("correctIndex" in l)),
    );
  }
});
