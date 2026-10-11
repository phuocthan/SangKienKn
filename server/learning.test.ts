import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { unzipSync, strFromU8 } from "fflate";
import { createApp } from "./app.js";
import { openDatabase, seedDemo, hashPassword } from "./db.js";
import { grantLearningMilestones, sweepLearningExams } from "./learning.js";

async function fixture(t: TestContext) {
  const db = openDatabase(":memory:");
  seedDemo(db);
  db.prepare("INSERT INTO users VALUES (?,?,?,?,?,0)").run(
    "other-teacher",
    "other@test.local",
    "Other",
    hashPassword("GreenEdu123!"),
    "teacher",
  );
  db.prepare(
    "INSERT INTO classrooms VALUES ('other-class','Other','Math','10','other-teacher')",
  ).run();
  let clock = 1000000;
  const server = createApp(db, { now: () => clock }).listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}/api`;
  t.after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    db.close();
  });
  async function request(path: string, body?: unknown, cookie = "") {
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
  const login = async (email: string) =>
    (await request("/auth/login", { email, password: "GreenEdu123!" })).cookie;
  const teacher = await login("giaovien@greenedu.demo"),
    student = await login("hocsinh@greenedu.demo"),
    peer = await login("minhkhoi@greenedu.demo"),
    other = await login("other@test.local");
  const read = async (path: string, cookie = student) => {
    const r = await request(path, undefined, cookie);
    assert.equal(r.status, 200, JSON.stringify(r.data));
    return r.data;
  };
  const post = async (path: string, body: unknown, cookie = student) => {
    const r = await request(path, body, cookie);
    assert.ok(r.status === 200 || r.status === 201, JSON.stringify(r.data));
    return r.data;
  };
  const attempt = (selected: number, mode = "practice") =>
    post("/attempts", {
      questionId: "question-1",
      selected,
      mode,
      requestId: randomUUID(),
    });
  const eligible = () => {
    db.prepare(
      "INSERT INTO progress VALUES('student-demo','chapter-1',14400) ON CONFLICT(student_id,chapter_id) DO UPDATE SET seconds=14400",
    ).run();
    db.prepare(
      "INSERT INTO attempts VALUES(?,'student-demo','question-1',0,1,'practice',?)",
    ).run(randomUUID(), clock);
  };
  const official = (overrides: object = {}) =>
    post(
      "/classrooms/class-demo/exams",
      {
        title: "Thi chính thức",
        chapterIds: ["chapter-1"],
        questionCount: 3,
        weights: {},
        startsAt: clock,
        closesAt: clock + 3600000,
        ...overrides,
      },
      teacher,
    );
  const start = (body: object) =>
    post("/classrooms/class-demo/exam-runs", {
      requestId: randomUUID(),
      ...body,
    });
  return {
    db,
    base,
    request,
    post,
    read,
    teacher,
    student,
    peer,
    other,
    attempt,
    eligible,
    official,
    start,
    now: () => clock,
    advance: (ms: number) => (clock += ms),
  };
}

test("milestones are exact, grant three tickets and one tree reward once; eligibility counts all repairs and chapter notebook", async (t) => {
  const f = await fixture(t);
  f.db
    .prepare("INSERT INTO progress VALUES('student-demo','chapter-1',7199)")
    .run();
  let ch = (await f.read("/classrooms/class-demo/learning")).chapters[0];
  assert.equal(ch.level, 2);
  assert.equal(ch.tickets.granted, 0);
  f.db
    .prepare("UPDATE progress SET seconds=7200 WHERE student_id='student-demo'")
    .run();
  await f.attempt(1);
  const wrongRepair = await f.attempt(1, "correction");
  assert.equal(wrongRepair.correctIndex, undefined);
  assert.equal(wrongRepair.explanation.includes("tự làm lại"), true);
  await f.attempt(0, "correction");
  ch = (await f.read("/classrooms/class-demo/learning")).chapters[0];
  assert.equal(ch.tickets.granted, 1);
  assert.equal(ch.openCorrections, 0);
  assert.equal(ch.eligible, false);
  assert.ok(Math.abs(ch.accuracy - 100 / 3) < 0.000001);
  for (let i = 0; i < 4; i++) await f.attempt(0);
  // A different chapter's unresolved question does not prevent this chapter's exam.
  f.db
    .prepare("INSERT INTO corrections VALUES('student-demo','question-4',0,0)")
    .run();
  ch = (await f.read("/classrooms/class-demo/learning")).chapters[0];
  assert.equal(ch.eligible, true);
  assert.ok(ch.accuracy >= 70);
  for (const seconds of [10800, 14400, 28800]) {
    f.db
      .prepare("UPDATE progress SET seconds=? WHERE student_id='student-demo'")
      .run(seconds);
    grantLearningMilestones(f.db, "student-demo", f.now());
    grantLearningMilestones(f.db, "student-demo", f.now());
  }
  ch = (await f.read("/classrooms/class-demo/learning")).chapters[0];
  assert.equal(ch.level, 5);
  assert.equal(ch.tickets.granted, 3);
  assert.equal(
    f.db.prepare("SELECT COUNT(*) AS n FROM learning_rewards").get()!.n,
    1,
  );
});

test("review matrix is strict, no duplicate questions; saved session resumes same snapshot and answer retries record once", async (t) => {
  const f = await fixture(t);
  const matrix = (await f.read("/classrooms/class-demo/learning")).matrix;
  const key = matrix.find((r: any) => r.chapterId === "chapter-1").key;
  assert.equal(
    (
      await f.request(
        "/classrooms/class-demo/blueprints",
        { title: "No access", chapterIds: ["chapter-1"], questionCount: 2 },
        f.student,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await f.request(
        "/classrooms/class-demo/blueprints",
        {
          title: "Insufficient",
          chapterIds: ["chapter-1", "chapter-2"],
          questionCount: 4,
          weights: { [key]: 1 },
        },
        f.teacher,
      )
    ).status,
    409,
  );
  const p = await f.post(
    "/classrooms/class-demo/blueprints",
    {
      title: "Ôn kỳ I",
      chapterIds: ["chapter-1", "chapter-2"],
      questionCount: 4,
      weights: {},
    },
    f.teacher,
  );
  await f.post(
    "/chapters/chapter-1/learning",
    { semester: "Học kỳ I", accuracyBasis: "all" },
    f.teacher,
  );
  const body = { blueprintId: p.id, requestId: randomUUID() };
  const r = await f.post("/classrooms/class-demo/reviews", body);
  assert.deepEqual(await f.post("/classrooms/class-demo/reviews", body), r);
  let session = await f.read(`/learning/reviews/${r.id}`);
  assert.equal(session.questions.length, 4);
  assert.equal(new Set(session.questions.map((q: any) => q.id)).size, 4);
  assert.ok(session.questions.every((q: any) => q.correctIndex === undefined));
  const q = session.questions[0];
  const answer = { questionId: q.id, selected: 0 };
  const saved = await f.post(`/learning/reviews/${r.id}/answer`, answer);
  assert.deepEqual(
    await f.post(`/learning/reviews/${r.id}/answer`, answer),
    saved,
  );
  assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM attempts").get()!.n, 1);
  await f.post(`/learning/reviews/${r.id}/next`, { index: 1 });
  session = await f.read(`/learning/reviews/${r.id}`);
  assert.equal(session.currentIndex, 1);
  assert.equal(session.answers[q.id].selected, 0);
  assert.deepEqual(session.questions[0], q);
  assert.equal(
    (await f.request(`/learning/reviews/${r.id}`, undefined, f.peer)).status,
    404,
  );
  assert.equal(
    (await f.request(`/learning/reviews/${r.id}/next`, { index: 3 }, f.student))
      .status,
    409,
  );
});

test("hunt consumes one ticket atomically despite concurrent/retried starts, grades once and never grants a fourth ticket", async (t) => {
  const f = await fixture(t);
  f.eligible();
  const body = { chapterId: "chapter-1", requestId: randomUUID() };
  const [a, b] = await Promise.all([
    f.post("/classrooms/class-demo/exam-runs", body),
    f.post("/classrooms/class-demo/exam-runs", body),
  ]);
  assert.equal(a.id, b.id);
  assert.equal(
    f.db
      .prepare(
        "SELECT COUNT(*) AS n FROM learning_tickets WHERE used_by IS NOT NULL",
      )
      .get()!.n,
    1,
  );
  assert.equal(
    (await f.request("/study/start", { chapterId: "chapter-1" }, f.student))
      .status,
    409,
  );
  assert.equal(
    (await f.request(`/learning/exam-runs/${a.id}`, undefined, f.peer)).status,
    403,
  );
  const path = `/learning/exam-runs/${a.id}`;
  const run = await f.read(path);
  const answers = Object.fromEntries(
    run.questions.map((q: any) => [
      q.id,
      Number(
        f.db
          .prepare("SELECT correct_index FROM questions WHERE id=?")
          .get(q.id)!.correct_index,
      ),
    ]),
  );
  await f.post(`${path}/answers`, { revision: 0, answers });
  const [submitted, retry] = await Promise.all([
    f.post(`${path}/submit`, {}),
    f.post(`${path}/submit`, {}),
  ]);
  assert.equal(submitted.score, 10);
  assert.deepEqual(submitted, retry);
  assert.equal(submitted.results.length, 3);
  assert.equal(
    f.db
      .prepare(
        "SELECT COUNT(*) AS n FROM learning_rewards WHERE source LIKE 'exam:%'",
      )
      .get()!.n,
    1,
  );
  for (let i = 0; i < 2; i++) {
    const r = await f.start({ chapterId: "chapter-1" });
    await f.post(`/learning/exam-runs/${r.id}/submit`, {});
    f.db.prepare("UPDATE corrections SET resolved=1").run();
  }
  assert.equal(
    (
      await f.request(
        "/classrooms/class-demo/exam-runs",
        { chapterId: "chapter-1", requestId: randomUUID() },
        f.student,
      )
    ).status,
    403,
  );
  grantLearningMilestones(f.db, "student-demo", f.now());
  assert.equal(
    f.db.prepare("SELECT COUNT(*) AS n FROM learning_tickets").get()!.n,
    3,
  );
});

test("server expiry submits without a browser, rejects stale revisions and ignores all writes after deadline", async (t) => {
  const f = await fixture(t);
  f.eligible();
  const r = await f.start({ chapterId: "chapter-1" }),
    path = `/learning/exam-runs/${r.id}`;
  await f.post(`${path}/answers`, {
    revision: 0,
    answers: { "question-1": 0 },
  });
  assert.equal(
    (
      await f.request(
        `${path}/answers`,
        { revision: 0, answers: { "question-1": 1 } },
        f.student,
      )
    ).status,
    409,
  );
  f.advance(1199999);
  sweepLearningExams(f.db, f.now());
  assert.equal(
    f.db.prepare("SELECT status FROM exam_runs WHERE id=?").get(r.id)!.status,
    "active",
  );
  f.advance(1);
  sweepLearningExams(f.db, f.now());
  const saved = f.db.prepare("SELECT * FROM exam_runs WHERE id=?").get(r.id)!;
  assert.equal(saved.status, "submitted");
  assert.equal(saved.reason, "deadline");
  assert.equal(saved.score, 3.3);
  const after = await f.post(`${path}/answers`, {
    revision: 1,
    answers: { "question-2": 1 },
  });
  assert.deepEqual(after.answers, { "question-1": 0 });
  sweepLearningExams(f.db, f.now());
  assert.equal(
    f.db
      .prepare(
        "SELECT COUNT(*) AS n FROM corrections WHERE student_id='student-demo' AND resolved=0",
      )
      .get()!.n,
    2,
  );
});

test("four distinct hidden-tab events auto-submit; duplicate delivery counts once and persists", async (t) => {
  const f = await fixture(t);
  const review = await f.post("/classrooms/class-demo/reviews", {
    chapterIds: ["chapter-1"],
    requestId: randomUUID(),
  });
  const e = await f.official();
  const r = await f.start({ examId: e.id });
  const path = `/learning/exam-runs/${r.id}`;
  for (let i = 1; i <= 4; i++) {
    const eventId = `event-${i}`;
    const a = await f.post(`${path}/tab`, { eventId });
    const retry = await f.post(`${path}/tab`, { eventId });
    assert.equal(a.warnings, i);
    assert.equal(retry.warnings, i);
    assert.equal(a.status, i === 4 ? "submitted" : "active");
  }
  const run = await f.read(path);
  assert.equal(run.reason, "tabs");
  assert.equal(run.results, undefined);
  assert.equal(
    f.db
      .prepare(
        "SELECT COUNT(*) AS n FROM corrections WHERE student_id='student-demo'",
      )
      .get()!.n,
    0,
  );
  assert.equal(
    (
      await f.request(
        "/attempts",
        {
          questionId: "question-1",
          selected: 0,
          mode: "practice",
          requestId: randomUUID(),
        },
        f.student,
      )
    ).status,
    409,
  );
  assert.equal(
    (
      await f.request(
        "/classrooms/class-demo/reviews",
        { chapterIds: ["chapter-1"], requestId: randomUUID() },
        f.student,
      )
    ).status,
    409,
  );
  assert.equal(
    (await f.request(`/learning/reviews/${review.id}`, undefined, f.student))
      .status,
    409,
  );
  await f.post(`/learning/exams/${e.id}/state`, { enabled: false }, f.teacher);
  const released = await f.read(path);
  assert.equal(released.results.length, 3);
  assert.equal(
    f.db
      .prepare(
        "SELECT COUNT(*) AS n FROM corrections WHERE student_id='student-demo'",
      )
      .get()!.n,
    3,
  );
});

test("official scheduled fixed question set survives bank edits, enforces one run, class permissions and teacher close", async (t) => {
  const f = await fixture(t);
  const e = await f.official({
    startsAt: f.now() + 1000,
    closesAt: f.now() + 60000,
    tabLimit: 2,
  });
  assert.equal(
    (
      await f.request(
        "/classrooms/class-demo/exam-runs",
        { examId: e.id, requestId: randomUUID() },
        f.student,
      )
    ).status,
    403,
  );
  f.db
    .prepare("UPDATE questions SET active=0 WHERE chapter_id='chapter-1'")
    .run();
  f.advance(1000);
  const r = await f.start({ examId: e.id });
  const peer = await f.post(
    "/classrooms/class-demo/exam-runs",
    { examId: e.id, requestId: randomUUID() },
    f.peer,
  );
  const run = await f.read(`/learning/exam-runs/${r.id}`),
    runPeer = await f.read(`/learning/exam-runs/${peer.id}`, f.peer);
  assert.equal(run.deadlineAt, 1060000);
  assert.equal(run.tabLimit, 2);
  assert.deepEqual(
    run.questions.map((q: any) => q.id).sort(),
    runPeer.questions.map((q: any) => q.id).sort(),
  );
  assert.ok(
    run.questions.every(
      (q: any) => !("correctIndex" in q) && !("explanation" in q),
    ),
  );
  assert.equal(
    (
      await f.request(
        `/learning/exams/${e.id}/state`,
        { enabled: false },
        f.other,
      )
    ).status,
    403,
  );
  await f.post(`/learning/exams/${e.id}/state`, { enabled: false }, f.teacher);
  assert.equal((await f.read(`/learning/exam-runs/${r.id}`)).reason, "teacher");
  assert.equal(
    (await f.read(`/learning/exam-runs/${peer.id}`, f.peer)).status,
    "submitted",
  );
  assert.equal((await f.start({ examId: e.id })).id, r.id);
});

test("rewards require owning teacher approval; Excel contains true official averages, time and source points with safe text cells", async (t) => {
  const f = await fixture(t);
  f.eligible();
  await f.read("/classrooms/class-demo/learning");
  let reward = f.db.prepare("SELECT id FROM learning_rewards").get()!;
  assert.equal(
    (
      await f.request(
        `/learning/rewards/${reward.id}/review`,
        { status: "approved" },
        f.student,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await f.request(
        `/learning/rewards/${reward.id}/review`,
        { status: "approved" },
        f.other,
      )
    ).status,
    403,
  );
  await f.post(
    `/learning/rewards/${reward.id}/review`,
    { status: "approved" },
    f.teacher,
  );
  await f.post(
    `/learning/rewards/${reward.id}/review`,
    { status: "approved" },
    f.teacher,
  );
  assert.equal(
    (
      await f.request(
        `/learning/rewards/${reward.id}/review`,
        { status: "rejected" },
        f.teacher,
      )
    ).status,
    409,
  );
  const e = await f.official(),
    r = await f.start({ examId: e.id });
  const questions = (await f.read(`/learning/exam-runs/${r.id}`)).questions;
  const answers = Object.fromEntries(
    questions
      .slice(0, 2)
      .map((q: any) => [
        q.id,
        Number(
          f.db
            .prepare("SELECT correct_index FROM questions WHERE id=?")
            .get(q.id)!.correct_index,
        ),
      ]),
  );
  await f.post(`/learning/exam-runs/${r.id}/answers`, { revision: 0, answers });
  await f.post(`/learning/exam-runs/${r.id}/submit`, {});
  const e2 = await f.official(),
    r2 = await f.start({ examId: e2.id });
  const all = Object.fromEntries(
    questions.map((q: any) => [
      q.id,
      Number(
        f.db
          .prepare("SELECT correct_index FROM questions WHERE id=?")
          .get(q.id)!.correct_index,
      ),
    ]),
  );
  await f.post(`/learning/exam-runs/${r2.id}/answers`, {
    revision: 0,
    answers: all,
  });
  await f.post(`/learning/exam-runs/${r2.id}/submit`, {});
  f.db
    .prepare("UPDATE users SET name='=SUM(1,2) <&>' WHERE id='student-demo'")
    .run();
  const response = await fetch(
    f.base + "/classrooms/class-demo/learning-report.xlsx",
    { headers: { Cookie: f.teacher } },
  );
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type")!, /spreadsheetml/);
  const zip = unzipSync(new Uint8Array(await response.arrayBuffer()));
  const sheet = strFromU8(zip["xl/worksheets/sheet1.xml"]);
  assert.match(sheet, /240/);
  assert.match(sheet, /8.35/);
  assert.match(sheet, /=SUM\(1,2\) &lt;&amp;&gt;/);
  assert.equal(sheet.includes("<f>"), false);
  assert.deepEqual(f.db.prepare("PRAGMA foreign_key_check").all(), []);
  assert.equal(
    (
      await f.request(
        "/classrooms/class-demo/learning-report.xlsx",
        undefined,
        f.student,
      )
    ).status,
    403,
  );
});
