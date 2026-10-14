import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { openDatabase, seedDemo, hashPassword } from "./db.js";
import { createApp } from "./app.js";
import { ensureChapterOrderSchema, activeChapterIds } from "./chapter-order.js";

async function fixture(t: TestContext) {
  const db = openDatabase(":memory:");
  seedDemo(db);
  db.prepare(
    "INSERT INTO users VALUES('other','other@fixture.test','Other',?,'teacher',0)",
  ).run(hashPassword("GreenEdu123!"));
  db.prepare(
    "INSERT INTO classrooms VALUES('other-class','Other','Physics','10','other')",
  ).run();
  db.prepare(
    "INSERT INTO chapters VALUES('other-chapter','other-class','Other chapter')",
  ).run();
  const server = createApp(db).listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const port = address.port;
  t.after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    db.close();
  });
  async function request(path: string, cookie: string, body?: unknown) {
    const res = await fetch(`http://127.0.0.1:${port}/api${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: { Cookie: cookie, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return {
      status: res.status,
      data: await res.json(),
      cookie: res.headers.get("set-cookie")?.split(";")[0] ?? "",
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
const original = ["chapter-1", "chapter-2", "chapter-3"];
const reordered = ["chapter-3", "chapter-1", "chapter-2"];

test("migration keeps legacy insertion order, survives reruns, and appends within each class", () => {
  const db = new DatabaseSync(":memory:");
  try {
    db.exec(`CREATE TABLE chapters(id TEXT PRIMARY KEY,classroom_id TEXT,title TEXT);
      INSERT INTO chapters VALUES('z','one','Z'),('x','two','X'),('a','one','A'),('b','two','B');`);
    const before = db.prepare("SELECT * FROM chapters ORDER BY rowid").all();
    ensureChapterOrderSchema(db);
    assert.deepEqual(
      db
        .prepare(
          "SELECT chapter_id,position FROM chapter_display_order ORDER BY chapter_id",
        )
        .all()
        .map((r) => [r.chapter_id, r.position]),
      [
        ["a", 2],
        ["b", 2],
        ["x", 1],
        ["z", 1],
      ],
    );
    db.exec(
      "UPDATE chapter_display_order SET position=3-position WHERE chapter_id IN ('a','z')",
    );
    ensureChapterOrderSchema(db);
    assert.deepEqual(
      db.prepare("SELECT * FROM chapters ORDER BY rowid").all(),
      before,
    );
    db.exec("INSERT INTO chapters VALUES('c','one','C'),('d','two','D')");
    assert.deepEqual(
      db
        .prepare(
          "SELECT chapter_id FROM chapter_display_order o JOIN chapters ch ON ch.id=o.chapter_id WHERE classroom_id='one' ORDER BY position",
        )
        .all()
        .map((r) => r.chapter_id),
      ["a", "z", "c"],
    );
    assert.equal(
      db
        .prepare(
          "SELECT position FROM chapter_display_order WHERE chapter_id='d'",
        )
        .get()!.position,
      3,
    );
    assert.equal(db.prepare("PRAGMA table_info(chapters)").all().length, 3);
  } finally {
    db.close();
  }
});

test("owner reorders teacher/student lists, learning matrix and leaderboard levels without altering learning data", async (t) => {
  const f = await fixture(t);
  f.db
    .prepare("INSERT INTO progress VALUES('student-demo','chapter-1',123)")
    .run();
  const tables = [
    "chapters",
    "questions",
    "progress",
    "attempts",
    "corrections",
  ];
  const snapshots = tables.map((table) =>
    f.db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all(),
  );
  assert.equal(
    (
      await f.request("/classrooms/class-demo/chapters/order", f.teacher, {
        chapterIds: reordered,
      })
    ).status,
    200,
  );
  for (const cookie of [f.teacher, f.student]) {
    const classes = (await f.request("/classrooms", cookie)).data;
    const chapters = classes.find(
      (c: { id: string }) => c.id === "class-demo",
    ).chapters;
    assert.deepEqual(
      chapters.map((ch: { id: string }) => ch.id),
      reordered,
    );
    assert.equal(chapters[0].canReorderChapter, cookie === f.teacher);
    const learning = (
      await f.request("/classrooms/class-demo/learning", cookie)
    ).data;
    assert.deepEqual(
      learning.chapters.map((ch: { id: string }) => ch.id),
      reordered,
    );
    assert.deepEqual(
      [
        ...new Set(
          learning.matrix.map((row: { chapterId: string }) => row.chapterId),
        ),
      ],
      reordered,
    );
    const board = (
      await f.request("/classrooms/class-demo/leaderboard", cookie)
    ).data;
    const member = board.effort.find(
      (m: { id: string }) => m.id === "student-demo",
    );
    assert.deepEqual(
      member.chapterLevels.map((ch: { chapterId: string }) => ch.chapterId),
      reordered,
    );
  }
  ensureChapterOrderSchema(f.db);
  assert.deepEqual(activeChapterIds(f.db, "class-demo"), reordered);
  tables.forEach((table, index) =>
    assert.deepEqual(
      f.db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all(),
      snapshots[index],
    ),
  );
});

test("ordering requires a session and the owning teacher", async (t) => {
  const f = await fixture(t);
  for (const [cookie, status] of [
    ["", 401],
    [f.student, 403],
    [f.other, 403],
  ] as const)
    assert.equal(
      (
        await f.request("/classrooms/class-demo/chapters/order", cookie, {
          chapterIds: reordered,
        })
      ).status,
      status,
    );
  assert.equal(
    (
      await f.request("/classrooms/missing/chapters/order", f.teacher, {
        chapterIds: [],
      })
    ).status,
    404,
  );
  assert.deepEqual(activeChapterIds(f.db, "class-demo"), original);
});

test("invalid, incomplete, archived and cross-class lists are rejected atomically", async (t) => {
  const f = await fixture(t);
  for (const chapterIds of [
    null,
    "chapter-1",
    [1, 2, 3],
    ["chapter-1", "chapter-1", "chapter-3"],
  ])
    assert.equal(
      (
        await f.request("/classrooms/class-demo/chapters/order", f.teacher, {
          chapterIds,
        })
      ).status,
      400,
    );
  for (const chapterIds of [
    [],
    original.slice(1),
    ["chapter-1", "chapter-2", "other-chapter"],
    [...original, "missing"],
  ])
    assert.equal(
      (
        await f.request("/classrooms/class-demo/chapters/order", f.teacher, {
          chapterIds,
        })
      ).status,
      409,
    );
  assert.deepEqual(activeChapterIds(f.db, "class-demo"), original);
  assert.equal(
    (
      await f.request("/chapters/chapter-2/delete", f.teacher, {
        confirm: true,
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await f.request("/classrooms/class-demo/chapters/order", f.teacher, {
        chapterIds: original,
      })
    ).status,
    409,
  );
  assert.deepEqual(activeChapterIds(f.db, "class-demo"), [
    "chapter-1",
    "chapter-3",
  ]);
});

test("new chapters append after reordering/deletion and stale lists cannot discard them", async (t) => {
  const f = await fixture(t);
  await f.request("/classrooms/class-demo/chapters/order", f.teacher, {
    chapterIds: reordered,
  });
  const added = await f.request("/classrooms/class-demo/chapters", f.teacher, {
    title: "Chương mới",
  });
  assert.equal(added.status, 201);
  assert.deepEqual(activeChapterIds(f.db, "class-demo"), [
    ...reordered,
    added.data.id,
  ]);
  assert.equal(
    (
      await f.request("/classrooms/class-demo/chapters/order", f.teacher, {
        chapterIds: reordered,
      })
    ).status,
    409,
  );
  await f.request(`/chapters/${added.data.id}/delete`, f.teacher, {
    confirm: true,
  });
  await f.request("/classrooms/class-demo/chapters/order", f.teacher, {
    chapterIds: original,
  });
  const last = await f.request("/classrooms/class-demo/chapters", f.teacher, {
    title: "Chương cuối",
  });
  assert.deepEqual(activeChapterIds(f.db, "class-demo"), [
    ...original,
    last.data.id,
  ]);
  assert.deepEqual(activeChapterIds(f.db, "other-class"), ["other-chapter"]);
  assert.equal(f.db.prepare("PRAGMA foreign_key_check").all().length, 0);
});
