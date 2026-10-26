import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { openDatabase, seedDemo, hashPassword } from "./db.js";
import { createApp } from "./app.js";
import { sweepLearningExams } from "./learning.js";
import { ensureClassManagementSchema } from "./class-management.js";

async function fixture(t: TestContext) {
  const db = openDatabase(":memory:");
  seedDemo(db);
  db.prepare("INSERT INTO users VALUES(?,?,?,?,?,0)").run(
    "outsider",
    "outsider@test.local",
    "GV khác",
    hashPassword("GreenEdu123!"),
    "teacher",
  );
  let time = Date.UTC(2026, 9, 14, 16, 59, 45);
  const server = createApp(db, { now: () => time }).listen(0, "127.0.0.1");
  await new Promise<void>((r) => server.once("listening", r));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const port = address.port;
  t.after(async () => {
    await new Promise<void>((r) => server.close(() => r()));
    db.close();
  });
  async function request(path: string, body?: unknown, cookie = "") {
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
    (await request("/auth/login", { email, password: "GreenEdu123!" })).cookie;
  const teacher = await login("giaovien@greenedu.nk"),
    student = await login("hocsinh@greenedu.nk"),
    peer = await login("minhkhoi@greenedu.nk"),
    outsider = await login("outsider@test.local");
  const post = async (path: string, body: unknown, cookie = student) => {
    const r = await request(path, body, cookie);
    assert.ok([200, 201].includes(r.status), JSON.stringify(r));
    return r.data;
  };
  const read = async (path: string, cookie = student) => {
    const r = await request(path, undefined, cookie);
    assert.equal(r.status, 200, JSON.stringify(r));
    return r.data;
  };
  const rules = {
    warningTabs: 2,
    closeTabs: 3,
    warningIdleSeconds: 30,
    closeIdleSeconds: 60,
  };
  const configure = () =>
    post(
      "/classrooms/class-demo/general-settings",
      { minutes: 60, policy: rules },
      teacher,
    );
  const eligible = () => {
    db.prepare(
      "INSERT INTO progress VALUES('student-demo','chapter-1',7200) ON CONFLICT(student_id,chapter_id) DO UPDATE SET seconds=7200",
    ).run();
    db.prepare(
      "INSERT INTO attempts VALUES(?,'student-demo','question-1',0,1,'practice',?)",
    ).run(randomUUID(), time);
  };
  return {
    db,
    request,
    post,
    read,
    teacher,
    student,
    peer,
    outsider,
    rules,
    configure,
    eligible,
    now: () => time,
    advance: (ms: number) => (time += ms),
  };
}
const paper = [
  {
    chapterId: "chapter-1",
    question: {
      text: "Một câu trong đề riêng",
      choices: ["A", "B", "C", "D"],
      correctIndex: 0,
      lesson: "Bài luyện tập chung",
      explanation: "Giải thích riêng",
    },
  },
];

test("legacy active exam receives rollout activity once without changing its deadline or resetting known activity", async (t) => {
  const f = await fixture(t);
  const e = await f.post(
    "/classrooms/class-demo/exams",
    {
      title: "Legacy",
      chapterIds: ["chapter-1"],
      questionCount: 1,
      startsAt: f.now(),
      closesAt: f.now() + 600000,
    },
    f.teacher,
  );
  const run = await f.post("/classrooms/class-demo/exam-runs", {
    examId: e.id,
    requestId: randomUUID(),
  });
  const original = f.db
    .prepare("SELECT * FROM exam_runs WHERE id=?")
    .get(run.id);
  f.db.prepare("DELETE FROM exam_activity WHERE run_id=?").run(run.id);
  const before = Date.now();
  ensureClassManagementSchema(f.db);
  assert.ok(
    Number(
      f.db
        .prepare("SELECT last_activity FROM exam_activity WHERE run_id=?")
        .get(run.id)!.last_activity,
    ) >= before,
  );
  f.db
    .prepare("UPDATE exam_activity SET last_activity=123 WHERE run_id=?")
    .run(run.id);
  ensureClassManagementSchema(f.db);
  assert.equal(
    f.db
      .prepare("SELECT last_activity FROM exam_activity WHERE run_id=?")
      .get(run.id)!.last_activity,
    123,
  );
  assert.deepEqual(
    f.db.prepare("SELECT * FROM exam_runs WHERE id=?").get(run.id),
    original,
  );
});

test("general policy is owner-only, validates warning before closure, and updates level and policy atomically", async (t) => {
  const f = await fixture(t);
  const payload = { minutes: 30, policy: f.rules };
  for (const cookie of [f.student, f.outsider])
    assert.equal(
      (
        await f.request(
          "/classrooms/class-demo/general-settings",
          payload,
          cookie,
        )
      ).status,
      403,
    );
  for (const policy of [
    { ...f.rules, warningTabs: 3 },
    { ...f.rules, closeTabs: 1 },
    { ...f.rules, warningIdleSeconds: 60 },
    { ...f.rules, closeIdleSeconds: 60.5 },
    null,
  ]) {
    assert.equal(
      (
        await f.request(
          "/classrooms/class-demo/general-settings",
          { minutes: 30, policy },
          f.teacher,
        )
      ).status,
      400,
    );
    assert.equal(
      f.db.prepare("SELECT COUNT(*) n FROM classroom_level_settings").get()!.n,
      0,
    );
  }
  await f.post("/classrooms/class-demo/general-settings", payload, f.teacher);
  const overview = await f.read("/classrooms/class-demo/learning");
  assert.equal(overview.levelMinutes, 30);
  assert.deepEqual(overview.sessionPolicy, f.rules);
  ensureClassManagementSchema(f.db);
  assert.deepEqual(
    (await f.read("/classrooms/class-demo/learning")).sessionPolicy,
    f.rules,
  );
});

test("practice lock is independent, enforced on old URLs/reviews/answers, and stops the session without removing its earned time", async (t) => {
  const f = await fixture(t);
  await f.configure();
  f.db
    .prepare("INSERT INTO progress VALUES('student-demo','chapter-1',500)")
    .run();
  const review = await f.post("/classrooms/class-demo/reviews", {
    chapterIds: ["chapter-1"],
    questionCount: 1,
    requestId: randomUUID(),
  });
  const s = await f.post("/study/start", { chapterId: "chapter-1" });
  f.advance(15000);
  await f.post("/study/heartbeat", {
    sessionId: s.sessionId,
    active: true,
    interacted: true,
  });
  assert.equal(
    f.db
      .prepare(
        "SELECT seconds FROM progress WHERE student_id='student-demo' AND chapter_id='chapter-1'",
      )
      .get()!.seconds,
    515,
  );
  assert.equal(
    (
      await f.request(
        "/chapters/chapter-1/practice-access",
        { enabled: false },
        f.outsider,
      )
    ).status,
    403,
  );
  await f.post(
    "/chapters/chapter-1/practice-access",
    { enabled: false },
    f.teacher,
  );
  assert.equal(
    f.db
      .prepare(
        "SELECT seconds FROM progress WHERE student_id='student-demo' AND chapter_id='chapter-1'",
      )
      .get()!.seconds,
    515,
  );
  for (const path of [
    "/chapters/chapter-1/questions",
    `/learning/reviews/${review.id}`,
  ])
    assert.equal((await f.request(path, undefined, f.student)).status, 403);
  assert.equal(
    (await f.request("/study/start", { chapterId: "chapter-1" }, f.student))
      .status,
    403,
  );
  assert.equal(
    (
      await f.request(
        "/attempts",
        {
          questionId: "question-1",
          mode: "practice",
          selected: 0,
          requestId: randomUUID(),
        },
        f.student,
      )
    ).status,
    403,
  );
  assert.equal(
    (await f.read("/classrooms/class-demo/learning")).chapters[0]
      .practiceAllowed,
    false,
  );
  assert.ok((await f.read("/chapters/chapter-1/questions", f.teacher)).length);
  assert.ok((await f.read("/chapters/chapter-2/questions")).length);
  await f.post(
    "/chapters/chapter-1/practice-access",
    { enabled: true },
    f.teacher,
  );
  await f.post("/study/start", { chapterId: "chapter-1" });
});

test("tab events deduplicate, warn at configured count and roll back current-session time across days without changing prior data", async (t) => {
  const f = await fixture(t);
  await f.configure();
  f.db
    .prepare("INSERT INTO progress VALUES('student-demo','chapter-1',500)")
    .run();
  f.db
    .prepare(
      "INSERT INTO study_daily_time VALUES('student-demo','chapter-1','2026-10-14',10000)",
    )
    .run();
  const s = await f.post("/study/start", { chapterId: "chapter-1" });
  for (let i = 0; i < 2; i++) {
    f.advance(10000);
    await f.post("/study/heartbeat", {
      sessionId: s.sessionId,
      active: true,
      interacted: true,
    });
  }
  const path = `/study/${s.sessionId}/tab`;
  assert.equal((await f.post(path, { eventId: "one" })).tabs, 1);
  assert.equal((await f.post(path, { eventId: "one" })).tabs, 1);
  const warning = await f.post(path, { eventId: "two" });
  assert.equal(warning.tabs, warning.policy.warningTabs);
  assert.equal(warning.closed, false);
  assert.equal((await f.post(path, { eventId: "three" })).closed, true);
  assert.equal((await f.post(path, { eventId: "three" })).tabs, 3);
  assert.equal(
    f.db
      .prepare(
        "SELECT seconds FROM progress WHERE student_id='student-demo' AND chapter_id='chapter-1'",
      )
      .get()!.seconds,
    500,
  );
  assert.equal(
    f.db.prepare("SELECT SUM(credited_ms) n FROM study_daily_time").get()!.n,
    10000,
  );
  const late = await f.request(
    "/attempts",
    {
      questionId: "question-1",
      selected: 0,
      mode: "practice",
      requestId: randomUUID(),
      studySessionId: s.sessionId,
    },
    f.student,
  );
  assert.equal(late.status, 403);
  assert.equal(f.db.prepare("SELECT COUNT(*) n FROM attempts").get()!.n, 0);
});

test("idle closure uses server activity; late interaction or answer cannot revive a session or keep its credit", async (t) => {
  const f = await fixture(t);
  await f.configure();
  const s = await f.post("/study/start", { chapterId: "chapter-1" });
  f.advance(10000);
  await f.post("/study/heartbeat", {
    sessionId: s.sessionId,
    active: true,
    interacted: true,
  });
  f.advance(60000);
  assert.equal(
    (
      await f.request(
        "/study/heartbeat",
        { sessionId: s.sessionId, active: true, interacted: true },
        f.student,
      )
    ).status,
    409,
  );
  assert.equal(
    f.db
      .prepare(
        "SELECT seconds FROM progress WHERE student_id='student-demo' AND chapter_id='chapter-1'",
      )
      .get()!.seconds,
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
    403,
  );
  await f.post("/study/stop", {
    sessionId: s.sessionId,
    violation: "idle",
    active: false,
  });
  assert.equal(
    f.db.prepare("SELECT COUNT(*) n FROM study_sessions").get()!.n,
    0,
  );
});

test("an offline violation replay after replacement discards only the old session, never the new one or another student", async (t) => {
  const f = await fixture(t);
  await f.configure();
  const old = await f.post("/study/start", { chapterId: "chapter-1" });
  f.advance(10000);
  await f.post("/study/heartbeat", {
    sessionId: old.sessionId,
    active: true,
    interacted: true,
  });
  const next = await f.post("/study/start", { chapterId: "chapter-1" });
  f.advance(10000);
  await f.post("/study/heartbeat", {
    sessionId: next.sessionId,
    active: true,
    interacted: true,
  });
  await f.post(
    "/study/stop",
    { sessionId: old.sessionId, violation: "tabs", active: false },
    f.peer,
  );
  assert.equal(
    f.db
      .prepare(
        "SELECT seconds FROM progress WHERE student_id='student-demo' AND chapter_id='chapter-1'",
      )
      .get()!.seconds,
    20,
  );
  for (let i = 0; i < 2; i++)
    await f.post("/study/stop", {
      sessionId: old.sessionId,
      violation: "tabs",
      active: false,
    });
  assert.equal(
    f.db
      .prepare(
        "SELECT seconds FROM progress WHERE student_id='student-demo' AND chapter_id='chapter-1'",
      )
      .get()!.seconds,
    10,
  );
  assert.equal(
    f.db
      .prepare("SELECT id FROM study_sessions WHERE student_id='student-demo'")
      .get()!.id,
    next.sessionId,
  );
  assert.equal(
    f.db.prepare("SELECT SUM(credited_ms) n FROM study_daily_time").get()!.n,
    10000,
  );
});

test("hunt upload/reuse/delete retains private snapshots and history; teacher closure collects active runs and never depends on practice", async (t) => {
  const f = await fixture(t);
  await f.configure();
  f.eligible();
  const url = "/chapters/chapter-1/hunt-access";
  assert.equal(
    (await f.request(url, { enabled: true, questions: paper }, f.student))
      .status,
    403,
  );
  assert.equal(
    (await f.request(url, { enabled: true, reuse: true }, f.teacher)).status,
    409,
  );
  assert.equal(
    (await f.request(url, { enabled: true, questions: [] }, f.teacher)).status,
    400,
  );
  assert.equal(
    (
      await f.request(
        url,
        { enabled: true, questions: [...paper, ...paper] },
        f.teacher,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await f.request(
        url,
        { enabled: true, questions: [{ ...paper[0], chapterId: "chapter-2" }] },
        f.teacher,
      )
    ).status,
    403,
  );
  const openBody = {
    enabled: true,
    title: "Đề săn thưởng",
    questions: paper,
    preparationMinutes: 1,
    durationMinutes: 20,
    tabLimit: 5,
    requestId: randomUUID(),
  };
  await f.post(url, openBody, f.teacher);
  let chapter = (await f.read("/classrooms/class-demo/learning")).chapters[0];
  assert.equal(chapter.hunt.hasQuestions, true);
  const uploadedAt = chapter.hunt.uploadedAt;
  const firstWindow = { ...chapter.hunt };
  f.advance(1000);
  await f.post(url, openBody, f.teacher);
  assert.deepEqual(
    (await f.read("/classrooms/class-demo/learning")).chapters[0].hunt,
    firstWindow,
    "Retry cannot replace the paper or extend its window",
  );
  assert.equal(
    (await f.request(url, { ...openBody, title: "Changed" }, f.teacher)).status,
    409,
  );
  assert.equal(
    (await f.request(url, { ...openBody, requestId: randomUUID() }, f.teacher))
      .status,
    409,
  );
  assert.equal(chapter.eligible, false);
  assert.ok(!JSON.stringify(chapter).includes("Giải thích riêng"));
  assert.ok(
    !JSON.stringify(await f.read("/chapters/chapter-1/questions")).includes(
      "Một câu trong đề riêng",
    ),
  );
  f.advance(60000);
  await f.post(
    "/chapters/chapter-1/practice-access",
    { enabled: false },
    f.teacher,
  );
  const run = await f.post("/classrooms/class-demo/exam-runs", {
    chapterId: "chapter-1",
    requestId: randomUUID(),
  });
  const view = await f.read(`/learning/exam-runs/${run.id}`);
  assert.equal(view.questions.length, 1);
  assert.equal(view.questions[0].text, paper[0].question.text);
  assert.equal(view.tabLimit, 3);
  await f.post(`/learning/exam-runs/${run.id}/answers`, {
    revision: 0,
    answers: { [view.questions[0].id]: 0 },
  });
  await f.post(url, { enabled: false, deleteQuestions: false }, f.teacher);
  assert.equal(
    (await f.read(`/learning/exam-runs/${run.id}`)).reason,
    "teacher",
  );
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
  f.advance(5000);
  await f.post(
    url,
    { enabled: true, reuse: true, preparationMinutes: 0, durationMinutes: 30 },
    f.teacher,
  );
  chapter = (await f.read("/classrooms/class-demo/learning")).chapters[0];
  assert.equal(chapter.hunt.uploadedAt, uploadedAt);
  assert.equal(chapter.hunt.durationMinutes, 30);
  await f.post(url, { enabled: false, deleteQuestions: true }, f.teacher);
  assert.equal(
    (await f.read("/classrooms/class-demo/learning")).chapters[0].hunt
      .hasQuestions,
    false,
  );
  assert.equal(
    (await f.request(url, { enabled: true, reuse: true }, f.teacher)).status,
    409,
  );
  const old = await f.read(`/learning/exam-runs/${run.id}`);
  assert.equal(old.questions[0].text, paper[0].question.text);
  assert.equal(old.answers[old.questions[0].id], 0);
  assert.deepEqual(f.db.prepare("PRAGMA foreign_key_check").all(), []);
});

test("hunt stays open until teacher closure and each late student gets a full independent duration", async (t) => {
  const f = await fixture(t);
  await f.post(
    "/classrooms/class-demo/general-settings",
    {
      minutes: 60,
      policy: { ...f.rules, warningIdleSeconds: 3500, closeIdleSeconds: 3600 },
    },
    f.teacher,
  );
  f.eligible();
  f.db
    .prepare("INSERT INTO progress VALUES('student-2','chapter-1',7200)")
    .run();
  f.db
    .prepare(
      "INSERT INTO attempts VALUES(?,'student-2','question-1',0,1,'practice',?)",
    )
    .run(randomUUID(), f.now());
  const url = "/chapters/chapter-1/hunt-access";
  await f.post(
    url,
    {
      enabled: true,
      questions: paper,
      preparationMinutes: 1,
      durationMinutes: 20,
    },
    f.teacher,
  );
  const overview = await f.read("/classrooms/class-demo/learning");
  assert.equal(overview.huntTeacherControlled, true);
  assert.equal(overview.chapters[0].hunt.closesAt, null);
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
  f.advance(25 * 60000);
  let state = (await f.read("/classrooms/class-demo/learning")).chapters[0];
  assert.equal(state.hunt.open, true);
  assert.equal(state.eligible, true);
  const start = () => ({ chapterId: "chapter-1", requestId: randomUUID() });
  const first = await f.post("/classrooms/class-demo/exam-runs", start());
  const firstPath = `/learning/exam-runs/${first.id}`;
  const firstView = await f.read(firstPath);
  assert.equal(firstView.deadlineAt, f.now() + 20 * 60000);
  await f.post(firstPath + "/answers", {
    revision: 0,
    answers: { [firstView.questions[0].id]: 0 },
  });
  f.advance(30000);
  const second = await f.post(
    "/classrooms/class-demo/exam-runs",
    start(),
    f.peer,
  );
  const secondPath = `/learning/exam-runs/${second.id}`;
  const secondView = await f.read(secondPath, f.peer);
  assert.equal(secondView.deadlineAt, firstView.deadlineAt + 30000);
  f.advance(firstView.deadlineAt - f.now() - 1);
  sweepLearningExams(f.db, f.now());
  assert.equal((await f.read(firstPath)).status, "active");
  f.advance(1);
  sweepLearningExams(f.db, f.now());
  const submitted = await f.read(firstPath);
  assert.equal(submitted.reason, "deadline");
  assert.equal(submitted.answers[firstView.questions[0].id], 0);
  assert.equal((await f.read(secondPath, f.peer)).status, "active");
  state = (await f.read("/classrooms/class-demo/learning")).chapters[0];
  assert.equal(state.hunt.open, true);
  await f.post(url, { enabled: false }, f.teacher);
  assert.equal((await f.read(secondPath, f.peer)).reason, "teacher");
  assert.equal(
    (await f.read("/classrooms/class-demo/learning")).chapters[0].hunt.open,
    false,
  );
  assert.equal(
    (await f.request("/classrooms/class-demo/exam-runs", start(), f.peer))
      .status,
    403,
  );
});

test("legacy hunt windows retain their deadlines and stay closed until the teacher reopens them", async (t) => {
  const f = await fixture(t);
  f.eligible();
  const url = "/chapters/chapter-1/hunt-access";
  await f.post(
    url,
    { enabled: true, questions: paper, durationMinutes: 20 },
    f.teacher,
  );
  const legacyDeadline = f.now() + 60000;
  f.db
    .prepare(
      "UPDATE chapter_hunt_settings SET closes_at=? WHERE chapter_id='chapter-1'",
    )
    .run(legacyDeadline);
  ensureClassManagementSchema(f.db);
  assert.equal(
    f.db
      .prepare(
        "SELECT closes_at FROM chapter_hunt_settings WHERE chapter_id='chapter-1'",
      )
      .get()!.closes_at,
    legacyDeadline,
  );
  const run = await f.post("/classrooms/class-demo/exam-runs", {
    chapterId: "chapter-1",
    requestId: randomUUID(),
  });
  assert.equal(
    (await f.read(`/learning/exam-runs/${run.id}`)).deadlineAt,
    legacyDeadline,
  );
  f.advance(60000);
  sweepLearningExams(f.db, f.now());
  const frozen = f.db.prepare("SELECT * FROM exam_runs WHERE id=?").get(run.id);
  const legacy = (await f.read("/classrooms/class-demo/learning")).chapters[0];
  assert.equal(legacy.hunt.open, false);
  assert.equal(legacy.hunt.closesAt, legacyDeadline);
  await f.post(
    url,
    { enabled: true, reuse: true, preparationMinutes: 0 },
    f.teacher,
  );
  const reopened = (await f.read("/classrooms/class-demo/learning"))
    .chapters[0];
  assert.equal(reopened.hunt.open, true);
  assert.equal(reopened.hunt.closesAt, null);
  f.advance(86400000);
  assert.equal(
    (await f.read("/classrooms/class-demo/learning")).chapters[0].hunt.open,
    true,
  );
  assert.deepEqual(
    f.db.prepare("SELECT * FROM exam_runs WHERE id=?").get(run.id),
    frozen,
  );
});

test("official exam has its own opening; global tab cap and server idle submit saved answers without counting polling as activity", async (t) => {
  const f = await fixture(t);
  await f.configure();
  const e = await f.post(
    "/classrooms/class-demo/exams",
    {
      title: "Thi độc lập",
      chapterIds: ["chapter-1"],
      questionCount: 2,
      startsAt: f.now(),
      closesAt: f.now() + 3600000,
      tabLimit: 10,
    },
    f.teacher,
  );
  await f.post(
    "/chapters/chapter-1/practice-access",
    { enabled: false },
    f.teacher,
  );
  const run = await f.post("/classrooms/class-demo/exam-runs", {
    examId: e.id,
    requestId: randomUUID(),
  });
  const path = `/learning/exam-runs/${run.id}`;
  const first = await f.read(path);
  assert.equal(first.tabLimit, 3);
  await f.post(path + "/answers", {
    revision: 0,
    answers: { [first.questions[0].id]: 0 },
  });
  f.advance(30000);
  assert.equal((await f.read(path)).status, "active");
  await f.post(path + "/activity", {});
  f.advance(59000);
  assert.equal((await f.read(path)).status, "active");
  f.advance(1000);
  sweepLearningExams(f.db, f.now());
  const closed = await f.read(path);
  assert.equal(closed.status, "submitted");
  assert.equal(closed.reason, "idle");
  const after = await f.post(path + "/answers", {
    revision: 1,
    answers: { [first.questions[1].id]: 0 },
  });
  assert.equal(Object.keys(after.answers).length, 1);
  const peer = await f.post(
    "/classrooms/class-demo/exam-runs",
    { examId: e.id, requestId: randomUUID() },
    f.peer,
  );
  const pp = `/learning/exam-runs/${peer.id}/tab`;
  assert.equal((await f.post(pp, { eventId: "1" }, f.peer)).warnings, 1);
  assert.equal((await f.post(pp, { eventId: "1" }, f.peer)).warnings, 1);
  assert.equal((await f.post(pp, { eventId: "2" }, f.peer)).status, "active");
  assert.equal((await f.post(pp, { eventId: "3" }, f.peer)).reason, "tabs");
});
