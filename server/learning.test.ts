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
  db.prepare('INSERT INTO classroom_session_policy VALUES(?,?,?,?)').run('class-demo',JSON.stringify({warningTabs:2,closeTabs:4,warningIdleSeconds:3500,closeIdleSeconds:3600}),'teacher-demo',0);
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
  const teacher = await login("giaovien@greenedu.nk"),
    student = await login("hocsinh@greenedu.nk"),
    peer = await login("minhkhoi@greenedu.nk"),
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
      "INSERT INTO chapter_exam_access VALUES('chapter-1',1,'teacher-demo',?) ON CONFLICT(chapter_id) DO UPDATE SET enabled=1",
    ).run(clock);
    db.prepare(
      "INSERT INTO progress VALUES('student-demo','chapter-1',14400) ON CONFLICT(student_id,chapter_id) DO UPDATE SET seconds=14400",
    ).run();
    db.prepare(
      "INSERT INTO attempts VALUES(?,'student-demo','question-1',0,1,'practice',?)",
    ).run(randomUUID(), clock);
  };
  const official = async (overrides: object = {}) => {
    const ids = (overrides as { chapterIds?: string[] }).chapterIds ?? [
      "chapter-1",
    ];
    for (const id of ids)
      await post(`/chapters/${id}/exam-access`, { enabled: true }, teacher);
    return post(
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
  };
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

test("online exam announces first, opens after preparation, shares a frozen paper and deadline, and retries never extend it", async (t) => {
  const f = await fixture(t);
  const body = {
    title: "Online cả lớp",
    delivery: "online",
    preparationMinutes: 2,
    durationMinutes: 45,
    chapterIds: ["chapter-1", "chapter-2"],
    questionCount: 6,
    requestId: randomUUID(),
  };
  const exam = await f.post("/classrooms/class-demo/exams", body, f.teacher);
  assert.deepEqual(
    await f.post("/classrooms/class-demo/exams", body, f.teacher),
    exam,
  );
  assert.deepEqual((await f.read("/learning/exam-notices")).notices, []);
  assert.equal(
    f.db
      .prepare("SELECT questions FROM exam_definitions WHERE id=?")
      .get(exam.id)!.questions,
    "[]",
  );
  f.advance(3600000); // A draft does not expire before the teacher starts it.
  const startTime = f.now();
  const open = `/learning/exams/${exam.id}/open`;
  assert.equal((await f.request(open, {}, f.student)).status, 403);
  assert.equal((await f.request(open, {}, f.other)).status, 403);
  await f.post(open, {}, f.teacher);
  const first = f.db
    .prepare("SELECT * FROM exam_definitions WHERE id=?")
    .get(exam.id)!;
  assert.equal(first.starts_at, startTime + 120000);
  assert.equal(first.closes_at, startTime + (2 + 45) * 60000);
  const frozen = JSON.parse(String(first.questions));
  assert.equal(frozen.length, 6);
  assert.equal(new Set(frozen.map((q: any) => q.id)).size, 6);
  const notices = (await f.read("/learning/exam-notices")).notices;
  assert.equal(notices[0].id, exam.id);
  assert.equal(notices[0].preparationMinutes, 2);
  assert.equal(notices[0].durationMinutes, 45);
  assert.equal(notices[0].questions, undefined);
  assert.equal(
    (await f.request("/learning/exam-notices", undefined, f.teacher)).status,
    403,
  );
  assert.equal((await f.request("/learning/exam-notices")).status, 401);
  f.db.prepare("DELETE FROM memberships WHERE student_id='student-2'").run();
  assert.deepEqual(
    (await f.read("/learning/exam-notices", f.peer)).notices,
    [],
  );
  f.db
    .prepare("INSERT INTO memberships VALUES('class-demo','student-2')")
    .run();
  assert.equal(
    (
      await f.request(
        "/classrooms/class-demo/exam-runs",
        { examId: exam.id, requestId: randomUUID() },
        f.student,
      )
    ).status,
    403,
  );
  f.advance(120000);
  f.db
    .prepare(
      "UPDATE questions SET text='Changed after launch',active=0 WHERE chapter_id IN ('chapter-1','chapter-2')",
    )
    .run();
  const run = await f.start({ examId: exam.id });
  const room = await f.read(`/learning/exam-runs/${run.id}`);
  assert.equal(room.deadlineAt, first.closes_at);
  assert.equal(room.delivery, "online");
  assert.deepEqual(
    room.questions.map((q: any) => q.id).sort(),
    frozen.map((q: any) => q.id).sort(),
  );
  assert.ok(
    room.questions.every(
      (q: any) =>
        q.correctIndex === undefined &&
        q.explanation === undefined &&
        q.text !== "Changed after launch",
    ),
  );
  f.advance(600000);
  const peer = await f.post(
    "/classrooms/class-demo/exam-runs",
    { examId: exam.id, requestId: randomUUID() },
    f.peer,
  );
  const peerRoom = await f.read(`/learning/exam-runs/${peer.id}`, f.peer);
  assert.equal(peerRoom.deadlineAt, room.deadlineAt);
  assert.deepEqual(
    peerRoom.questions.map((q: any) => q.id).sort(),
    room.questions.map((q: any) => q.id).sort(),
  );
  assert.deepEqual(
    (await f.read(`/learning/exam-runs/${run.id}`)).questions,
    room.questions,
  );
  await f.post(open, {}, f.teacher);
  assert.deepEqual(
    f.db.prepare("SELECT * FROM exam_definitions WHERE id=?").get(exam.id),
    first,
  );
  assert.equal(
    (
      await f.request(
        `/learning/exams/${exam.id}/state`,
        { enabled: true },
        f.teacher,
      )
    ).status,
    409,
  );
  f.advance(35 * 60000);
  const submitted = await f.read(`/learning/exam-runs/${run.id}`);
  assert.equal(submitted.status, "submitted");
  assert.equal(submitted.reason, "deadline");
  assert.ok(submitted.results);
  assert.deepEqual((await f.read("/learning/exam-notices")).notices, []);
  assert.equal(
    f.db
      .prepare(
        "SELECT COUNT(*) AS n FROM learning_tickets WHERE used_by IS NOT NULL",
      )
      .get()!.n,
    0,
  );
});

test("online launch rolls back when the selected bank changed, validates settings and can be closed during preparation", async (t) => {
  const f = await fixture(t);
  f.db
    .prepare(
      "UPDATE questions SET lesson='Bài đã chọn' WHERE chapter_id='chapter-1'",
    )
    .run();
  const body = {
    title: "Online chọn bài",
    delivery: "online",
    chapterIds: ["chapter-1"],
    questionCount: 3,
    lessonKeys: ["chapter-1::Bài đã chọn"],
    preparationMinutes: 3,
    durationMinutes: 10,
  };
  for (const overrides of [
    { preparationMinutes: -1 },
    { preparationMinutes: 61 },
    { durationMinutes: 0 },
    { durationMinutes: 181 },
    { durationMinutes: 1.5 },
  ]) {
    assert.equal(
      (
        await f.request(
          "/classrooms/class-demo/exams",
          { ...body, ...overrides },
          f.teacher,
        )
      ).status,
      400,
    );
  }
  const exam = await f.post("/classrooms/class-demo/exams", body, f.teacher);
  f.db.prepare("UPDATE questions SET active=0 WHERE id='question-1'").run();
  assert.equal(
    (await f.request(`/learning/exams/${exam.id}/open`, {}, f.teacher)).status,
    409,
  );
  assert.equal(
    f.db
      .prepare("SELECT started_at FROM online_exam_sessions WHERE exam_id=?")
      .get(exam.id)!.started_at,
    null,
  );
  assert.equal(
    f.db
      .prepare("SELECT enabled FROM exam_definitions WHERE id=?")
      .get(exam.id)!.enabled,
    0,
  );
  assert.deepEqual((await f.read("/learning/exam-notices")).notices, []);
  f.db.prepare("UPDATE questions SET active=1 WHERE id='question-1'").run();
  await f.post(`/learning/exams/${exam.id}/open`, {}, f.teacher);
  await f.post(
    `/learning/exams/${exam.id}/state`,
    { enabled: false },
    f.teacher,
  );
  await f.post(`/learning/exams/${exam.id}/open`, {}, f.teacher);
  assert.deepEqual((await f.read("/learning/exam-notices")).notices, []);
  assert.equal(
    f.db
      .prepare("SELECT enabled FROM exam_definitions WHERE id=?")
      .get(exam.id)!.enabled,
    0,
  );
});

test("online uploaded paper stays private, can start immediately, and teacher close collects and releases all runs", async (t) => {
  const f = await fixture(t);
  const body = {
    title: "Online đề riêng",
    delivery: "online",
    preparationMinutes: 0,
    durationMinutes: 30,
    chapterIds: ["chapter-1", "chapter-2"],
    source: "upload",
    requestId: randomUUID(),
    questions: ["chapter-1", "chapter-2"].map((chapterId) => ({
      chapterId,
      question: {
        text: `Câu riêng ${chapterId}`,
        lesson: "Bài riêng",
        choices: ["A", "B", "C", "D"],
        correctIndex: 1,
        explanation: "Riêng tư",
      },
    })),
  };
  const exam = await f.post("/classrooms/class-demo/exams", body, f.teacher);
  await f.post(`/learning/exams/${exam.id}/open`, {}, f.teacher);
  const a = await f.start({ examId: exam.id });
  const b = await f.post(
    "/classrooms/class-demo/exam-runs",
    { examId: exam.id, requestId: randomUUID() },
    f.peer,
  );
  const room = await f.read(`/learning/exam-runs/${a.id}`);
  assert.equal(room.deadlineAt, f.now() + 30 * 60000);
  const studentOverview = await f.read("/classrooms/class-demo/learning");
  assert.equal(
    studentOverview.runs.find((run: any) => run.id === a.id).delivery,
    "online",
  );
  assert.ok(!studentOverview.runs.some((run: any) => run.id === b.id));
  const teacherOverview = await f.read(
    "/classrooms/class-demo/learning",
    f.teacher,
  );
  assert.equal(
    teacherOverview.runs.find((run: any) => run.id === b.id).delivery,
    "online",
  );
  for (const q of room.questions)
    assert.equal(
      f.db.prepare("SELECT active FROM questions WHERE id=?").get(q.id)!.active,
      0,
    );
  await f.post(`/learning/exam-runs/${a.id}/submit`, {});
  assert.deepEqual((await f.read("/learning/exam-notices")).notices, []);
  assert.equal(
    (await f.read(`/learning/exam-runs/${a.id}`)).results,
    undefined,
  );
  await f.post(
    `/learning/exams/${exam.id}/state`,
    { enabled: false },
    f.teacher,
  );
  assert.equal(
    (await f.read(`/learning/exam-runs/${b.id}`, f.peer)).reason,
    "teacher",
  );
  assert.ok((await f.read(`/learning/exam-runs/${a.id}`)).results);
});

test("online groups count exact exam IDs, protect student results and export each closed session with absentees", async (t) => {
  const f = await fixture(t);
  const create = () =>
    f.post(
      "/classrooms/class-demo/exams",
      {
        title: "Trùng tên",
        delivery: "online",
        preparationMinutes: 0,
        durationMinutes: 5,
        chapterIds: ["chapter-1"],
        questionCount: 2,
        requestId: randomUUID(),
      },
      f.teacher,
    );
  const a = await create(),
    b = await create();
  const exportPath = `/learning/exams/${a.id}/results.xlsx`;
  f.advance(3600000);
  assert.equal((await f.request(exportPath, undefined, f.teacher)).status, 409);
  await f.post(`/learning/exams/${a.id}/open`, {}, f.teacher);
  const run = await f.start({ examId: a.id });
  const peerRun = await f.post(
    "/classrooms/class-demo/exam-runs",
    { examId: a.id, requestId: randomUUID() },
    f.peer,
  );
  await f.post(`/learning/exam-runs/${run.id}/submit`, {});
  const overview = await f.read("/classrooms/class-demo/learning", f.teacher);
  assert.equal(overview.onlineExamGroups, true);
  assert.equal(overview.serverNow, f.now());
  assert.deepEqual(
    overview.exams.find((e: any) => e.id === a.id).participants,
    { joined: 2, submitted: 1 },
  );
  assert.deepEqual(
    overview.exams.find((e: any) => e.id === b.id).participants,
    { joined: 0, submitted: 0 },
  );
  assert.equal(overview.runs.find((r: any) => r.id === run.id).examId, a.id);
  assert.deepEqual(await f.read(`/learning/exams/${b.id}/runs`, f.teacher), []);
  const studentRuns = await f.read(`/learning/exams/${a.id}/runs`);
  assert.equal(studentRuns.length, 1);
  assert.equal(studentRuns[0].id, run.id);
  assert.equal(studentRuns[0].score, null);
  const mine = await f.read("/classrooms/class-demo/learning");
  assert.deepEqual(mine.exams.find((e: any) => e.id === a.id).myRun, {
    id: run.id,
    status: "submitted",
  });
  assert.equal((await f.request(exportPath, undefined, f.teacher)).status, 409);
  for (const cookie of [f.student, f.other]) {
    assert.equal((await f.request(exportPath, undefined, cookie)).status, 403);
  }
  assert.equal(
    (await f.request(`/learning/exams/${a.id}/runs`, undefined, f.other))
      .status,
    403,
  );
  assert.equal((await f.request(exportPath)).status, 401);
  assert.equal(
    (
      await f.request(
        "/learning/exams/missing/results.xlsx",
        undefined,
        f.teacher,
      )
    ).status,
    404,
  );
  // Include a real member who did not join, and preserve formula-looking names as text.
  f.db
    .prepare(
      "INSERT INTO users VALUES ('absent','absent@test.local','=1+1',?,'student',0)",
    )
    .run(hashPassword("GreenEdu123!"));
  f.db.prepare("INSERT INTO memberships VALUES('class-demo','absent')").run();
  await f.post(`/learning/exams/${a.id}/state`, { enabled: false }, f.teacher);
  assert.equal(
    (await f.read(`/learning/exam-runs/${peerRun.id}`, f.peer)).status,
    "submitted",
  );
  const response = await fetch(f.base + exportPath, {
    headers: { Cookie: f.teacher },
  });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type")!, /spreadsheetml/);
  assert.match(response.headers.get("content-disposition")!, new RegExp(a.id));
  const zip = unzipSync(new Uint8Array(await response.arrayBuffer()));
  const metadata = strFromU8(zip["xl/worksheets/sheet1.xml"]);
  const results = strFromU8(zip["xl/worksheets/sheet2.xml"]);
  assert.ok(metadata.includes(a.id));
  assert.ok(!metadata.includes(b.id));
  assert.ok(results.includes("Chưa tham gia"));
  assert.ok(results.includes("=1+1"));
  assert.ok(!results.includes("<f>"));
  assert.equal((results.match(/Đã nộp/g) ?? []).length, 2);
  assert.ok(
    !(results.includes("password") || results.includes("correctIndex")),
  );
  assert.notEqual(
    (await f.read(`/learning/exams/${a.id}/runs`))[0].score,
    null,
  );
});

test("online result download sweeps expired runs and forbids draft and scheduled exports", async (t) => {
  const f = await fixture(t);
  const scheduled = await f.official();
  assert.equal(
    (
      await f.request(
        `/learning/exams/${scheduled.id}/results.xlsx`,
        undefined,
        f.teacher,
      )
    ).status,
    404,
  );
  const exam = await f.post(
    "/classrooms/class-demo/exams",
    {
      title: "Hết giờ",
      delivery: "online",
      preparationMinutes: 0,
      durationMinutes: 1,
      chapterIds: ["chapter-1"],
      questionCount: 2,
    },
    f.teacher,
  );
  await f.post(`/learning/exams/${exam.id}/open`, {}, f.teacher);
  const run = await f.start({ examId: exam.id });
  f.advance(60000);
  const response = await fetch(
    `${f.base}/learning/exams/${exam.id}/results.xlsx`,
    { headers: { Cookie: f.teacher } },
  );
  assert.equal(response.status, 200);
  assert.equal(
    f.db.prepare("SELECT reason FROM exam_runs WHERE id=?").get(run.id)!.reason,
    "deadline",
  );
  const overview = await f.read("/classrooms/class-demo/learning", f.teacher);
  assert.deepEqual(
    overview.exams.find((e: any) => e.id === exam.id).participants,
    { joined: 1, submitted: 1 },
  );
});

test("practice and review conceal answers after wrong submissions, retries and reload, including legacy saved feedback", async (t) => {
  const f = await fixture(t);
  const wrong = await f.attempt(1);
  assert.equal(wrong.correct, false);
  assert.equal(wrong.correctIndex, undefined);
  assert.equal(
    wrong.explanation,
    "Hãy xem lại kiến thức và tự làm lại câu này.",
  );
  const right = await f.attempt(0);
  assert.equal(right.correctIndex, 0);
  const review = await f.post("/classrooms/class-demo/reviews", {
    chapterIds: ["chapter-1"],
    questionCount: 2,
    requestId: randomUUID(),
  });
  const path = `/learning/reviews/${review.id}`;
  const session = await f.read(path);
  const q = session.questions[0];
  const correct = Number(
    f.db.prepare("SELECT correct_index FROM questions WHERE id=?").get(q.id)!
      .correct_index,
  );
  const body = { questionId: q.id, selected: (correct + 1) % 4 };
  const feedback = await f.post(`${path}/answer`, body);
  assert.equal(feedback.correctIndex, undefined);
  assert.equal(feedback.explanation, wrong.explanation);
  assert.deepEqual(await f.post(`${path}/answer`, body), feedback);
  // Existing sessions may contain answers saved before concealment was introduced.
  f.db.prepare("UPDATE review_sessions SET answers=? WHERE id=?").run(
    JSON.stringify({
      [q.id]: {
        ...feedback,
        correctIndex: correct,
        explanation: "LEGACY ANSWER MUST STAY PRIVATE",
      },
    }),
    review.id,
  );
  assert.deepEqual((await f.read(path)).answers[q.id], feedback);
  assert.deepEqual(await f.post(`${path}/answer`, body), feedback);
  await f.post(`${path}/next`, { index: 1 });
  const next = (await f.read(path)).questions[1];
  const nextCorrect = Number(
    f.db.prepare("SELECT correct_index FROM questions WHERE id=?").get(next.id)!
      .correct_index,
  );
  const success = await f.post(`${path}/answer`, {
    questionId: next.id,
    selected: nextCorrect,
  });
  assert.equal(success.correctIndex, nextCorrect);
  assert.equal(
    success.explanation,
    f.db.prepare("SELECT explanation FROM questions WHERE id=?").get(next.id)!
      .explanation,
  );
});

test("teacher creates a manual exam from chosen lessons, opens immediately, and students enter without study prerequisites", async (t) => {
  const f = await fixture(t);
  f.db
    .prepare(
      "UPDATE questions SET lesson=CASE WHEN id='question-1' THEN 'Bài được chọn' ELSE 'Bài khác' END WHERE chapter_id='chapter-1'",
    )
    .run();
  const body = {
    title: "Kiểm tra tự mở",
    chapterIds: ["chapter-1"],
    source: "bank",
    manualOpen: true,
    questionCount: 1,
    lessonKeys: ["chapter-1::Bài được chọn"],
    startsAt: f.now() + 60000,
    closesAt: f.now() + 3600000,
    requestId: randomUUID(),
  };
  assert.equal(
    (await f.request("/classrooms/class-demo/exams", body, f.student)).status,
    403,
  );
  const exam = await f.post("/classrooms/class-demo/exams", body, f.teacher);
  assert.deepEqual(
    await f.post("/classrooms/class-demo/exams", body, f.teacher),
    exam,
  );
  assert.equal(
    (
      await f.request(
        "/classrooms/class-demo/exams",
        { ...body, title: "Changed" },
        f.teacher,
      )
    ).status,
    409,
  );
  const saved = f.db
    .prepare("SELECT * FROM exam_definitions WHERE id=?")
    .get(exam.id)!;
  assert.equal(saved.enabled, 0);
  assert.deepEqual(
    JSON.parse(String(saved.questions)).map((q: any) => q.id),
    ["question-1"],
  );
  assert.equal(
    (
      await f.request(
        "/classrooms/class-demo/exam-runs",
        { examId: exam.id, requestId: randomUUID() },
        f.student,
      )
    ).status,
    403,
  );
  const open = `/learning/exams/${exam.id}/open`;
  assert.equal((await f.request(open, {}, f.other)).status, 403);
  assert.equal((await f.request(open, {}, f.student)).status, 403);
  await f.post(open, {}, f.teacher);
  assert.equal(
    f.db
      .prepare(
        "SELECT enabled FROM chapter_exam_access WHERE chapter_id='chapter-1'",
      )
      .get()!.enabled,
    1,
  );
  assert.equal(
    f.db
      .prepare("SELECT starts_at FROM exam_definitions WHERE id=?")
      .get(exam.id)!.starts_at,
    f.now(),
  );
  const run = await f.start({ examId: exam.id });
  assert.equal(
    (await f.read(`/learning/exam-runs/${run.id}`)).questions.length,
    1,
  );
  assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM progress").get()!.n, 0);
  f.advance(3600001);
  assert.equal((await f.request(open, {}, f.teacher)).status, 409);
});

test("uploaded multi-chapter exams validate atomically, keep questions unpublished, and retry without duplication", async (t) => {
  const f = await fixture(t);
  const question = {
    text: "Đề riêng của giáo viên",
    lesson: "Bài mới",
    choices: ["A", "B", "C", "D"],
    correctIndex: 2,
    explanation: "C là đáp án đúng của đề riêng.",
  };
  const body = {
    title: "Đề nhiều chương",
    chapterIds: ["chapter-1", "chapter-2"],
    source: "upload",
    manualOpen: true,
    startsAt: f.now(),
    closesAt: f.now() + 3600000,
    questions: [
      { chapterId: "chapter-1", question },
      { chapterId: "chapter-2", question },
    ],
    requestId: randomUUID(),
  };
  const before = Number(
    f.db.prepare("SELECT COUNT(*) AS n FROM questions").get()!.n,
  );
  for (const invalid of [
    { ...body, questions: [body.questions[0], body.questions[0]] },
    {
      ...body,
      questions: [
        { chapterId: "chapter-1", question: { ...question, correctIndex: 9 } },
      ],
    },
    { ...body, lessonKeys: [], source: "bank", questionCount: 1 },
  ])
    assert.equal(
      (await f.request("/classrooms/class-demo/exams", invalid, f.teacher))
        .status,
      400,
    );
  assert.equal(
    (
      await f.request(
        "/classrooms/class-demo/exams",
        { ...body, questions: [{ chapterId: "other-chapter", question }] },
        f.teacher,
      )
    ).status,
    403,
  );
  assert.equal(
    f.db.prepare("SELECT COUNT(*) AS n FROM questions").get()!.n,
    before,
  );
  const exam = await f.post("/classrooms/class-demo/exams", body, f.teacher);
  assert.deepEqual(
    await f.post("/classrooms/class-demo/exams", body, f.teacher),
    exam,
  );
  assert.equal(
    f.db.prepare("SELECT COUNT(*) AS n FROM questions").get()!.n,
    before + 2,
  );
  const saved = JSON.parse(
    String(
      f.db
        .prepare("SELECT questions FROM exam_definitions WHERE id=?")
        .get(exam.id)!.questions,
    ),
  );
  for (const q of saved)
    assert.equal(
      f.db.prepare("SELECT active FROM questions WHERE id=?").get(q.id)!.active,
      0,
    );
  await f.post(`/learning/exams/${exam.id}/open`, {}, f.teacher);
  assert.equal(
    f.db
      .prepare("SELECT COUNT(*) AS n FROM chapter_exam_access WHERE enabled=1")
      .get()!.n,
    2,
  );
  const run = await f.start({ examId: exam.id });
  const room = await f.read(`/learning/exam-runs/${run.id}`);
  assert.equal(room.questions.length, 2);
  assert.ok(
    room.questions.every(
      (q: any) => q.correctIndex === undefined && q.explanation === undefined,
    ),
  );
  assert.deepEqual(f.db.prepare("PRAGMA foreign_key_check").all(), []);
});

test("chapter exams default closed; only owning teacher can open, without bypassing study requirements or consuming tickets on rejection", async (t) => {
  const f = await fixture(t);
  f.eligible();
  // Existing progress qualifies, but permission must still come from the teacher.
  await f.post(
    "/chapters/chapter-1/exam-access",
    { enabled: false },
    f.teacher,
  );
  let ch = (await f.read("/classrooms/class-demo/learning")).chapters[0];
  assert.equal(ch.examAllowed, false);
  assert.equal(ch.eligible, false);
  assert.equal(ch.tickets.remaining, 3);
  assert.deepEqual(ch.missing, ["Giáo viên chưa mở săn thưởng chương này"]);
  const denied = await f.request(
    "/classrooms/class-demo/exam-runs",
    {
      chapterId: "chapter-1",
      requestId: randomUUID(),
    },
    f.student,
  );
  assert.equal(denied.status, 403);
  assert.match(denied.data.error, /Giáo viên chưa mở/);
  assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM exam_runs").get()!.n, 0);
  assert.equal(
    f.db
      .prepare(
        "SELECT COUNT(*) AS n FROM learning_tickets WHERE used_by IS NOT NULL",
      )
      .get()!.n,
    0,
  );
  for (const cookie of [f.student, f.other])
    assert.equal(
      (
        await f.request(
          "/chapters/chapter-1/exam-access",
          { enabled: true },
          cookie,
        )
      ).status,
      403,
    );
  for (const enabled of ["true", 1, null])
    assert.equal(
      (
        await f.request(
          "/chapters/chapter-1/exam-access",
          { enabled },
          f.teacher,
        )
      ).status,
      400,
    );
  assert.equal(
    (
      await f.request(
        "/chapters/missing/exam-access",
        { enabled: true },
        f.teacher,
      )
    ).status,
    404,
  );
  await f.post("/chapters/chapter-1/exam-access", { enabled: true }, f.teacher);
  await f.post("/chapters/chapter-1/exam-access", { enabled: true }, f.teacher);
  ch = (await f.read("/classrooms/class-demo/learning")).chapters[0];
  assert.equal(ch.examAllowed, true);
  assert.equal(ch.eligible, true);
  const second = (await f.read("/classrooms/class-demo/learning")).chapters[1];
  assert.equal(second.examAllowed, false);
  await f.post("/chapters/chapter-2/exam-access", { enabled: true }, f.teacher);
  assert.equal(
    (await f.read("/classrooms/class-demo/learning")).chapters[1].eligible,
    false,
  );
  assert.equal(
    (
      await f.request(
        "/classrooms/class-demo/exam-runs",
        {
          chapterId: "chapter-2",
          requestId: randomUUID(),
        },
        f.student,
      )
    ).status,
    403,
  );
  await f.post(
    "/chapters/chapter-2/exam-access",
    { enabled: false },
    f.teacher,
  );
  // Review remains available even when an exam is locked.
  await f.post("/classrooms/class-demo/reviews", {
    chapterIds: ["chapter-2"],
    questionCount: 1,
    requestId: randomUUID(),
  });
});

test("locking a chapter prevents new starts but preserves the active run, answers and retry without consuming another ticket", async (t) => {
  const f = await fixture(t);
  f.eligible();
  const body = { chapterId: "chapter-1", requestId: randomUUID() };
  const run = await f.post("/classrooms/class-demo/exam-runs", body);
  await f.post(
    "/chapters/chapter-1/exam-access",
    { enabled: false },
    f.teacher,
  );
  assert.equal(
    (await f.read(`/learning/exam-runs/${run.id}`)).status,
    "active",
  );
  assert.deepEqual(await f.post("/classrooms/class-demo/exam-runs", body), run);
  const q = (await f.read(`/learning/exam-runs/${run.id}`)).questions[0];
  await f.post(`/learning/exam-runs/${run.id}/answers`, {
    revision: 0,
    answers: { [q.id]: 0 },
  });
  assert.equal(
    (await f.read(`/learning/exam-runs/${run.id}`)).answers[q.id],
    0,
  );
  await f.post(`/learning/exam-runs/${run.id}/submit`, {});
  assert.equal(
    (
      await f.request(
        "/classrooms/class-demo/exam-runs",
        {
          chapterId: "chapter-1",
          requestId: randomUUID(),
        },
        f.student,
      )
    ).status,
    403,
  );
  assert.equal(
    f.db
      .prepare(
        "SELECT COUNT(*) AS n FROM learning_tickets WHERE used_by IS NOT NULL",
      )
      .get()!.n,
    1,
  );
  assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM exam_runs").get()!.n, 1);
});

test("scheduled exams keep their own schedule and resume rules independently of practice and hunt switches", async (t) => {
  const f = await fixture(t);
  const e = await f.post(
    "/classrooms/class-demo/exams",
    {
      title: "Two chapters",
      chapterIds: ["chapter-1", "chapter-2"],
      questionCount: 6,
      startsAt: f.now(),
      closesAt: f.now() + 3600000,
    },
    f.teacher,
  );
  const exam = (await f.read('/classrooms/class-demo/learning')).exams[0];
  assert.deepEqual(exam.blockedChapters, []);
  await f.post('/chapters/chapter-1/practice-access',{enabled:false},f.teacher);
  await f.post('/chapters/chapter-2/exam-access',{enabled:false},f.teacher);
  const preview = await f.request('/classrooms/class-demo/exam-runs',{examId:e.id,requestId:randomUUID()},f.peer);
  assert.equal(preview.status,201,'Official exam is independent of chapter practice/hunt switches');
  await f.post(`/learning/exams/${e.id}/state`, { enabled: false }, f.teacher);
  assert.equal(
    (
      await f.request(
        "/classrooms/class-demo/exam-runs",
        {
          examId: e.id,
          requestId: randomUUID(),
        },
        f.student,
      )
    ).status,
    403,
  );
  await f.post(`/learning/exams/${e.id}/state`, { enabled: true }, f.teacher);
  // Scheduled exams keep their previous exemption from personal study/ticket conditions.
  const body = { examId: e.id, requestId: randomUUID() };
  const run = await f.post("/classrooms/class-demo/exam-runs", body);
  await f.post(
    "/chapters/chapter-1/exam-access",
    { enabled: false },
    f.teacher,
  );
  assert.equal(
    (await f.read(`/learning/exam-runs/${run.id}`)).status,
    "active",
  );
  assert.equal(
    (await f.post("/classrooms/class-demo/exam-runs", body)).id,
    run.id,
  );
  assert.equal(
    f.db
      .prepare(
        "SELECT COUNT(*) AS n FROM learning_tickets WHERE used_by IS NOT NULL",
      )
      .get()!.n,
    0,
  );
});

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
  assert.equal(ch.examAllowed, false);
  assert.equal(ch.eligible, false);
  await f.post("/chapters/chapter-1/exam-access", { enabled: true }, f.teacher);
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
  assert.equal(
    (await f.request("/study/start", { chapterId: "chapter-1" }, f.student))
      .status,
    409,
  );
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
  assert.equal(run.score, null);
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
    200,
  );
  assert.equal(
    (
      await f.request(
        "/classrooms/class-demo/reviews",
        { chapterIds: ["chapter-1"], requestId: randomUUID() },
        f.student,
      )
    ).status,
    201,
  );
  assert.equal(
    (await f.request(`/learning/reviews/${review.id}`, undefined, f.student))
      .status,
    200,
  );
  const session = await f.post("/study/start", { chapterId: "chapter-1" });
  const secondsBefore = Number(
    f.db
      .prepare(
        "SELECT seconds FROM progress WHERE student_id='student-demo' AND chapter_id='chapter-1'",
      )
      .get()?.seconds ?? 0,
  );
  f.advance(15000);
  const pulse = await f.post("/study/heartbeat", {
    sessionId: session.sessionId,
    active: true,
    interacted: true,
  });
  assert.equal(pulse.creditedSeconds, 15);
  assert.equal(
    Number(
      f.db
        .prepare(
          "SELECT seconds FROM progress WHERE student_id='student-demo' AND chapter_id='chapter-1'",
        )
        .get()!.seconds,
    ),
    secondsBefore + 15,
  );
  assert.equal((await f.read(path)).results, undefined);
  assert.equal(
    (await f.read("/classrooms/class-demo/learning")).runs.find(
      (row: any) => row.id === r.id,
    ).score,
    null,
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


test("only the classroom teacher can delete an exam; drafts disappear without affecting the question bank", async(t)=>{
 const f=await fixture(t);
 const exam=await f.official({delivery:"online",preparationMinutes:0,durationMinutes:5,requestId:randomUUID()});
 const path=`/learning/exams/${exam.id}/delete`;
 const count=f.db.prepare("SELECT COUNT(*) n FROM questions").get()!.n;
 assert.equal((await f.request(path,{},f.student)).status,403);
 assert.equal((await f.request(path,{},f.other)).status,403);
 assert.equal((await f.request(path,{})).status,401);
 assert.equal((await f.request('/learning/exams/missing/delete',{},f.teacher)).status,404);
 assert.equal((await f.request(path,{},f.teacher)).status,200);
 assert.equal(f.db.prepare("SELECT 1 FROM exam_definitions WHERE id=?").get(exam.id),undefined);
 assert.equal(f.db.prepare("SELECT 1 FROM online_exam_sessions WHERE exam_id=?").get(exam.id),undefined);
 assert.equal(f.db.prepare("SELECT 1 FROM exam_creation_requests WHERE exam_id=?").get(exam.id),undefined);
 assert.equal(f.db.prepare("SELECT COUNT(*) n FROM questions").get()!.n,count);
 assert.equal((await f.read('/classrooms/class-demo/learning',f.teacher)).exams.some((e:{id:string})=>e.id===exam.id),false);
 assert.equal((await f.request(`/learning/exams/${exam.id}/open`,{},f.teacher)).status,404);
});

test("exam deletion requires closing active exams and atomically removes only that exam's results",async(t)=>{
 const f=await fixture(t);
 const exam=await f.official({delivery:"online",preparationMinutes:0,durationMinutes:5,requestId:randomUUID()});
 const keep=await f.official({delivery:"online",preparationMinutes:0,durationMinutes:5,requestId:randomUUID()});
 await f.post(`/learning/exams/${exam.id}/open`,{},f.teacher);
 const run=await f.start({examId:exam.id});
 f.db.prepare("INSERT INTO exam_tab_events VALUES(?,?,?)").run(run.id,'delete-tab',f.now());
 const path=`/learning/exams/${exam.id}/delete`;
 assert.equal((await f.request(path,{},f.teacher)).status,409);
 assert.equal(f.db.prepare("SELECT status FROM exam_runs WHERE id=?").get(run.id)!.status,'active');
 await f.post(`/learning/exams/${exam.id}/state`,{enabled:false},f.teacher);
 f.db.exec("CREATE TRIGGER fail_exam_delete BEFORE DELETE ON exam_definitions BEGIN SELECT RAISE(ABORT,'test rollback'); END");
 assert.equal((await f.request(path,{},f.teacher)).status,500);
 assert.ok(f.db.prepare("SELECT 1 FROM exam_runs WHERE id=?").get(run.id));
 assert.ok(f.db.prepare("SELECT 1 FROM exam_tab_events WHERE run_id=?").get(run.id));
 assert.ok(f.db.prepare("SELECT 1 FROM online_exam_sessions WHERE exam_id=?").get(exam.id));
 f.db.exec("DROP TRIGGER fail_exam_delete");
 assert.equal((await f.request(path,{},f.teacher)).status,200);
 for(const table of ['exam_runs','exam_creation_requests','online_exam_sessions']) assert.equal(f.db.prepare(`SELECT COUNT(*) n FROM ${table} WHERE exam_id=?`).get(exam.id)!.n,0);
 for(const table of ['exam_tab_events','exam_activity']) assert.equal(f.db.prepare(`SELECT COUNT(*) n FROM ${table} WHERE run_id=?`).get(run.id)!.n,0);
 assert.ok(f.db.prepare("SELECT 1 FROM exam_definitions WHERE id=?").get(keep.id));
 assert.equal((await f.request(`/classrooms/class-demo/exam-runs`,{examId:exam.id,requestId:randomUUID()},f.student)).status,404);
 assert.equal((await f.read('/learning/exam-notices')).notices.some((e:{id:string})=>e.id===exam.id),false);
});


test("expired exam can be deleted after collecting overdue runs without waiting for the worker",async(t)=>{
 const f=await fixture(t);
 const exam=await f.official({delivery:"online",preparationMinutes:0,durationMinutes:1,requestId:randomUUID()});
 await f.post(`/learning/exams/${exam.id}/open`,{},f.teacher);
 await f.start({examId:exam.id});
 f.advance(60000);
 assert.equal((await f.request(`/learning/exams/${exam.id}/delete`,{},f.teacher)).status,200);
 assert.equal(f.db.prepare("SELECT 1 FROM exam_runs WHERE exam_id=?").get(exam.id),undefined);
});
