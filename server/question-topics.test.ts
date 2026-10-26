import { test } from "node:test";
import assert from "node:assert/strict";
import { randomInt, randomUUID } from "node:crypto";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DOMParser } from "@xmldom/xmldom";
import {
  parseQuestionWordText,
  readWordDocument,
} from "../shared/word-questions.js";
import {
  questionInput,
  parseQuestionCsv,
  csvHeaders,
} from "../shared/questions.js";
import { sampleByTopic } from "../shared/question-topics.js";
import { openDatabase, seedDemo } from "./db.js";
import { createApp } from "./app.js";

function generatedQuestions() {
  const xml = readWordDocument(
    readFileSync(
      new URL(
        "../artifacts/question-banks/vat-li-11-chuong-1-bai-1-50-cau.docx",
        import.meta.url,
      ),
    ),
  );
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const ns = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
  const paragraphs = Array.from(doc.getElementsByTagNameNS(ns, "p"));
  const text = paragraphs
    .map((p) =>
      Array.from(p.getElementsByTagNameNS(ns, "t"))
        .map((n) => n.textContent)
        .join(""),
    )
    .join("\n");
  return parseQuestionWordText(text);
}

test("delivered Word parses 50 unique questions in one lesson and 10 topics with separate explanations", () => {
  const parsed = generatedQuestions();
  assert.deepEqual(parsed.errors, []);
  assert.equal(parsed.questions.length, 50);
  assert.equal(new Set(parsed.questions.map((q) => q.lesson)).size, 1);
  const counts = new Map<string, number>();
  for (const q of parsed.questions) {
    assert.ok(q.topic);
    assert.ok(!q.explanation.includes("Chủ đề:"));
    counts.set(q.topic, (counts.get(q.topic) ?? 0) + 1);
  }
  assert.equal(counts.size, 10);
  assert.ok([...counts.values()].every((n) => n === 5));
  assert.equal(new Set(parsed.questions.map((q) => q.text)).size, 50);
});

test("old Word and CSV stay compatible; optional topic supports validation and duplicate labels", () => {
  const base =
    "Câu 1: Một câu hỏi\nBài học: Bài 1\nA. A\nB. B\nC. C\nD. D\nĐáp án: A\nLời giải: Vì A đúng.";
  assert.equal(parseQuestionWordText(base).questions[0].topic, undefined);
  const tagged = base.replace("A. A", "Chủ đề: Biên độ\nA. A");
  assert.ok(
    parseQuestionWordText(
      tagged + "\n" + tagged.replace("Biên độ", "Li độ"),
    ).errors.some((e) => e.includes("trùng")),
  );
  assert.equal(parseQuestionWordText(tagged).questions[0].topic, "Biên độ");
  assert.ok(
    parseQuestionWordText(
      tagged.replace("Chủ đề: Biên độ", "Chủ đề: Biên độ\nChủ đề: Li độ"),
    ).errors.length,
  );
  assert.ok(
    parseQuestionWordText(tagged.replace("Biên độ", "x".repeat(121))).errors
      .length,
  );
  const csv = csvHeaders.join(",") + "\nBài 1,Câu hỏi,A,B,C,D,A,Lời giải";
  assert.equal(parseQuestionCsv(csv).questions[0].topic, undefined);
  const taggedCsv =
    csvHeaders.join(",") + ",Chủ đề\nBài 1,Câu hỏi,A,B,C,D,A,Lời giải,Biên độ";
  assert.equal(parseQuestionCsv(taggedCsv).questions[0].topic, "Biên độ");
  assert.throws(
    () =>
      questionInput({ ...parseQuestionWordText(base).questions[0], topic: 12 }),
    /Chủ đề/,
  );
});

test("topic sampling covers 10 topics evenly for 10, 20 and 23 questions, without duplicates or adjacent repeats", () => {
  const rows = generatedQuestions().questions;
  for (let run = 0; run < 30; run++) {
    for (const count of [10, 20, 23, 50]) {
      const selected = sampleByTopic(rows, count, (q) => q, randomInt);
      assert.equal(selected.length, count);
      assert.equal(new Set(selected).size, count);
      const counts = new Map<string, number>();
      selected.forEach((q, index) => {
        counts.set(q.topic!, (counts.get(q.topic!) ?? 0) + 1);
        if (index) assert.notEqual(q.topic, selected[index - 1].topic);
      });
      assert.equal(counts.size, 10);
      assert.ok(
        Math.max(...counts.values()) - Math.min(...counts.values()) <= 1,
      );
    }
  }
});

test("topic exhaustion and untagged rows never duplicate/drop available questions; matching topics are normalized and scoped", () => {
  const rows = Array.from({ length: 20 }, (_, id) => ({
    id,
    chapterId: "c",
    lesson: "l",
    topic: id < 18 ? "A" : id === 18 ? "B" : "",
  }));
  const all = sampleByTopic(rows, 30, (q) => q, randomInt);
  assert.equal(all.length, 20);
  assert.equal(new Set(all.map((q) => q.id)).size, 20);
  const normalized = [
    { topic: "Biên độ", lesson: "l" },
    { topic: "  BIÊN  ĐỘ  ", lesson: "l" },
    { topic: "Li độ", lesson: "l" },
  ];
  const two = sampleByTopic(
    normalized,
    2,
    (q) => q,
    () => 0,
  );
  assert.ok(two.some((q) => q.topic === "Li độ"));
  const scoped = [
    { topic: "A", lesson: "one" },
    { topic: "A", lesson: "one" },
    { topic: "A", lesson: "two" },
  ];
  assert.equal(
    new Set(
      sampleByTopic(
        scoped,
        2,
        (q) => q,
        () => 0,
      ).map((q) => q.lesson),
    ).size,
    2,
  );
  assert.deepEqual(
    sampleByTopic(rows, 0, (q) => q),
    [],
  );
});

test("migration preserves existing questions and topic survives reopening", () => {
  const dir = mkdtempSync(join(tmpdir(), "greenedu-topic-"));
  try {
    const path = join(dir, "data.sqlite");
    let db = openDatabase(path);
    seedDemo(db);
    const before = db
      .prepare(
        "SELECT id,text,choices,correct_index,explanation FROM questions",
      )
      .all();
    db.exec("ALTER TABLE questions DROP COLUMN topic");
    db.close();
    db = openDatabase(path);
    assert.deepEqual(
      db
        .prepare(
          "SELECT id,text,choices,correct_index,explanation FROM questions",
        )
        .all(),
      before,
    );
    assert.equal(
      db.prepare("SELECT topic FROM questions WHERE id='question-1'").get()!
        .topic,
      "",
    );
    db.prepare("UPDATE questions SET topic=? WHERE id='question-1'").run(
      "Biên độ",
    );
    db.close();
    db = openDatabase(path);
    assert.equal(
      db.prepare("SELECT topic FROM questions WHERE id='question-1'").get()!
        .topic,
      "Biên độ",
    );
    assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
    db.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("API imports topics atomically, preserves retry/history/correction, and balances practice/review/exam within lesson quotas", async (t) => {
  const db = openDatabase(":memory:");
  seedDemo(db);
  const server = createApp(db).listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  t.after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    db.close();
  });
  const base = `http://127.0.0.1:${address.port}/api`;
  async function request(path: string, cookie: string, body?: unknown) {
    const r = await fetch(base + path, {
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
  const teacher = (
    await request("/auth/login", "", {
      email: "giaovien@greenedu.nk",
      password: "GreenEdu123!",
    })
  ).cookie;
  const student = (
    await request("/auth/login", "", {
      email: "hocsinh@greenedu.nk",
      password: "GreenEdu123!",
    })
  ).cookie;
  const chapter = (
    await request("/classrooms/class-demo/chapters", teacher, {
      title: "Chương topic",
    })
  ).data.id;
  const questions = generatedQuestions().questions;
  const payload = { requestId: randomUUID(), questions };
  assert.equal(
    (await request(`/chapters/${chapter}/questions/import`, student, payload))
      .status,
    403,
  );
  const imported = await request(
    `/chapters/${chapter}/questions/import`,
    teacher,
    payload,
  );
  assert.equal(imported.status, 201);
  assert.equal(imported.data.ids.length, 50);
  assert.deepEqual(
    (await request(`/chapters/${chapter}/questions/import`, teacher, payload))
      .data.ids,
    imported.data.ids,
  );
  assert.equal(
    (
      await request(`/chapters/${chapter}/questions/import`, teacher, {
        ...payload,
        requestId: randomUUID(),
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await request(`/chapters/${chapter}/questions/import`, teacher, {
        requestId: randomUUID(),
        questions: [{ ...questions[0], topic: "Nhãn khác" }],
      })
    ).status,
    409,
  );
  const bank = (await request(`/chapters/${chapter}/questions`, teacher)).data;
  assert.equal(bank[0].topic, questions[0].topic);
  const practice = (await request(`/chapters/${chapter}/questions`, student))
    .data;
  assert.equal(
    new Set(practice.slice(0, 10).map((q: { topic: string }) => q.topic)).size,
    10,
  );
  assert.ok(
    practice.every(
      (q: object) => !("correctIndex" in q) && !("explanation" in q),
    ),
  );
  const reviewPayload = {
    requestId: randomUUID(),
    chapterIds: [chapter],
    questionCount: 20,
  };
  const review = await request(
    "/classrooms/class-demo/reviews",
    student,
    reviewPayload,
  );
  assert.equal(review.status, 201);
  const storedReview = (
    await request(`/learning/reviews/${review.data.id}`, student)
  ).data.questions;
  assert.equal(storedReview.length, 20);
  assert.equal(
    new Set(storedReview.slice(0, 10).map((q: { topic: string }) => q.topic))
      .size,
    10,
  );
  assert.deepEqual(
    (await request(`/learning/reviews/${review.data.id}`, student)).data
      .questions,
    storedReview,
  );
  const qid = imported.data.ids[0];
  const { topic: _topic, ...oldClientContent } = questions[0];
  assert.equal(
    (await request(`/questions/${qid}/edit`, teacher, oldClientContent)).data
      .id,
    qid,
  );
  assert.equal(
    (await request(`/questions/${qid}/edit`, teacher, questions[0])).data.id,
    qid,
  );
  await request("/attempts", student, {
    questionId: qid,
    selected: (questions[0].correctIndex + 1) % 4,
    mode: "practice",
    requestId: randomUUID(),
  });
  const revised = await request(`/questions/${qid}/edit`, teacher, {
    ...questions[0],
    topic: "Chủ đề đã chỉnh",
  });
  assert.equal(revised.status, 200);
  assert.equal(revised.data.version, 2);
  const correction = (
    await request(`/chapters/${chapter}/questions?mode=correction`, student)
  ).data;
  assert.equal(correction[0].id, qid);
  assert.equal(correction[0].topic, "Chủ đề đã chỉnh");
  assert.equal(correction[0].sourceQuestionId, revised.data.id);
  const history = (
    await request(`/questions/${revised.data.id}/history`, teacher)
  ).data;
  assert.equal(history[0].topic, "Chủ đề đã chỉnh");
  assert.equal(history[1].topic, questions[0].topic);
  const cleared = await request(`/questions/${revised.data.id}/edit`, teacher, {
    ...questions[0],
    topic: "",
  });
  assert.equal(cleared.data.version, 3);
  assert.equal(
    db.prepare("SELECT topic FROM questions WHERE id=?").get(cleared.data.id)!
      .topic,
    "",
  );
  assert.equal(
    (
      await request(`/questions/${cleared.data.id}/edit`, teacher, {
        ...questions[0],
        topic: "",
      })
    ).data.id,
    cleared.data.id,
  );
  await request(`/chapters/${chapter}/questions`, teacher, {
    ...questions[0],
    lesson: "Bài khác",
    topic: "Một chủ đề khác",
    text: "Câu ở bài khác",
  });
  const key = `${chapter}::${questions[0].lesson}`,
    otherKey = `${chapter}::Bài khác`;
  const now = Date.now();
  const exam = await request("/classrooms/class-demo/exams", teacher, {
    title: "Đề cân bằng",
    chapterIds: [chapter],
    questionCount: 11,
    weights: { [key]: 10, [otherKey]: 1 },
    startsAt: now,
    closesAt: now + 3600000,
  });
  assert.equal(exam.status, 201, JSON.stringify(exam.data));
  const snapshot = JSON.parse(
    String(
      db
        .prepare("SELECT questions FROM exam_definitions WHERE id=?")
        .get(exam.data.id)!.questions,
    ),
  );
  assert.equal(snapshot.length, 11);
  assert.equal(
    snapshot.filter((q: { lesson: string }) => q.lesson === "Bài khác").length,
    1,
  );
  const invalid = {
    requestId: randomUUID(),
    questions: [
      { ...questions[1], text: "Câu mới hợp lệ" },
      { ...questions[2], topic: "x".repeat(121) },
    ],
  };
  assert.equal(
    (await request(`/chapters/${chapter}/questions/import`, teacher, invalid))
      .status,
    400,
  );
  assert.equal(
    db
      .prepare(
        "SELECT COUNT(*) AS n FROM questions WHERE text='Câu mới hợp lệ'",
      )
      .get()!.n,
    0,
  );
});
