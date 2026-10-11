import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { openDatabase, seedDemo } from "./db.js";
import { createApp } from "./app.js";
import { chapterLessons } from "./lesson-catalog.js";
import { matchingLessonTitle } from "../shared/lesson-titles.js";

test("numbered lesson aliases match without using topic or merging different titles", () => {
  const title = "Bài 1 - Dao động điều hòa";
  assert.equal(
    matchingLessonTitle(" BÀI 01:  Dao động điều hoà ", [title]),
    title,
  );
  assert.equal(
    matchingLessonTitle("Bài 1 · Dao động điều hoà", [title]),
    title,
  );
  assert.equal(
    matchingLessonTitle("Bài 2: Dao động điều hoà", [title]),
    "Bài 2: Dao động điều hoà",
  );
  assert.equal(
    matchingLessonTitle("Bài 1: Biên độ", [title]),
    "Bài 1: Biên độ",
  );
  assert.throws(() =>
    matchingLessonTitle("Bài 1 · Dao động điều hoà", [
      title,
      "Bài 1: Dao động điều hoà",
    ]),
  );
  assert.equal(
    matchingLessonTitle(title, [title, "Bài 1: Dao động điều hoà"]),
    title,
  );
});

test("API imports topics into existing lesson and preserves retry, duplicate, edit and archive rules", async (t) => {
  const db = openDatabase(":memory:");
  seedDemo(db);
  const title = "Bài 1 - Dao động điều hòa";
  db.prepare(
    "INSERT INTO lessons(id,chapter_id,title,sort_order) VALUES(?,?,?,?)",
  ).run("import-target", "chapter-1", title, 0);
  const server = createApp(db).listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}/api`;
  t.after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    db.close();
  });
  let cookie = "";
  async function request(path: string, body: unknown) {
    const res = await fetch(`${base}${path}`, {
      method: "POST",
      headers: { Cookie: cookie, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    cookie = res.headers.get("set-cookie")?.split(";")[0] ?? cookie;
    return { status: res.status, data: await res.json() };
  }
  await request("/auth/login", {
    email: "giaovien@greenedu.nk",
    password: "GreenEdu123!",
  });
  const question = {
    text: "Biên độ của dao động x = 4cos(2t) cm?",
    lesson: "Bài 1: Dao động điều hoà",
    topic: "Biên độ",
    choices: ["4 cm", "2 cm", "8 cm", "1 cm"],
    correctIndex: 0,
    explanation: "Biên độ là 4 cm.",
  };
  const payload = {
    requestId: randomUUID(),
    questions: [
      question,
      {
        ...question,
        text: "Li độ tại t = 0?",
        topic: "Li độ",
        lesson: "Bài 1 · Dao động điều hòa",
      },
    ],
  };
  const first = await request("/chapters/chapter-1/questions/import", payload);
  assert.equal(first.status, 201, JSON.stringify(first.data));
  assert.deepEqual(
    (await request("/chapters/chapter-1/questions/import", payload)).data,
    first.data,
  );
  const rows = db
    .prepare("SELECT lesson,topic FROM questions WHERE id IN (?,?)")
    .all(...first.data.ids);
  assert.ok(rows.every((row) => row.lesson === title));
  assert.deepEqual(
    new Set(rows.map((row) => row.topic)),
    new Set(["Biên độ", "Li độ"]),
  );
  assert.equal(
    chapterLessons(db, "chapter-1").filter((row) =>
      String(row.title).includes("Dao động"),
    ).length,
    1,
  );
  assert.equal(
    chapterLessons(db, "chapter-1").find((row) => row.title === title)!
      .questionCount,
    2,
  );
  assert.equal(
    (
      await request("/chapters/chapter-1/questions/import", {
        requestId: randomUUID(),
        questions: [
          { ...question, topic: "Khác", lesson: "Bài 1 - Dao động điều hòa" },
        ],
      })
    ).status,
    409,
  );
  assert.equal(
    (await request(`/questions/${first.data.ids[0]}/edit`, question)).data.id,
    first.data.ids[0],
  );
  const before = db.prepare("SELECT COUNT(*) n FROM questions").get()!.n;
  assert.equal(
    (
      await request("/chapters/chapter-1/questions/import", {
        requestId: randomUUID(),
        questions: [
          { ...question, text: "Câu trùng trong file" },
          {
            ...question,
            text: "Câu trùng trong file",
            lesson: title,
            topic: "Nhãn khác",
          },
        ],
      })
    ).status,
    400,
  );
  assert.equal(db.prepare("SELECT COUNT(*) n FROM questions").get()!.n, before);
  const newLessonPayload = {
    requestId: randomUUID(),
    questions: [
      { ...question, lesson: "Bài 5: Bài mới", text: "Câu mới thứ nhất" },
      { ...question, lesson: "Bài 5 - Bài mới", text: "Câu mới thứ hai" },
    ],
  };
  const newLesson = await request(
    "/chapters/chapter-1/questions/import",
    newLessonPayload,
  );
  assert.equal(newLesson.status, 201);
  assert.deepEqual(
    (await request("/chapters/chapter-1/questions/import", newLessonPayload))
      .data,
    newLesson.data,
  );
  assert.equal(
    chapterLessons(db, "chapter-1").filter((row) =>
      String(row.title).startsWith("Bài 5"),
    ).length,
    1,
  );
  const created = await request("/chapters/chapter-1/questions", {
    ...question,
    text: "Một câu mới",
    topic: "Phương trình",
  });
  assert.equal(created.status, 201);
  assert.equal(
    db.prepare("SELECT lesson FROM questions WHERE id=?").get(created.data.id)!
      .lesson,
    title,
  );
  await request("/chapters/chapter-1/lessons/delete", { title });
  assert.equal(
    (
      await request("/chapters/chapter-1/questions/import", {
        requestId: randomUUID(),
        questions: [{ ...question, text: "Không được tự khôi phục bài" }],
      })
    ).status,
    409,
  );
  db.prepare(
    "INSERT INTO lessons(id,chapter_id,title,sort_order) VALUES(?,?,?,?)",
  ).run("ambiguous-target", "chapter-1", "Bài 1: Dao động điều hoà", 1);
  assert.equal(
    (
      await request("/chapters/chapter-1/questions", {
        ...question,
        lesson: "Bài 1 · Dao động điều hoà",
        text: "Không được chọn tùy ý bài trùng",
      })
    ).status,
    409,
  );
});
