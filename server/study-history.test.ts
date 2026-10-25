import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { openDatabase, seedDemo, hashPassword } from "./db.js";
import { createApp } from "./app.js";
import {
  ensureStudyHistorySchema,
  startStudyHistory,
  creditStudyInterval,
  studentStudyStatistics,
  studyRangeReport,
} from "./study-history.js";
import {
  studyDate,
  studyDayStart,
  studyPeriodStart,
  shiftStudyPeriod,
  validStudyDate,
} from "../shared/study-statistics.js";

async function fixture(
  t: TestContext,
  initialTime = studyDayStart("2026-10-14") + 3600000,
) {
  const db = openDatabase(":memory:");
  seedDemo(db);
  let clock = initialTime;
  const server = createApp(db, { now: () => clock }).listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const port = address.port;
  t.after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    db.close();
  });
  async function request(path: string, cookie: string, body?: unknown) {
    const response = await fetch(`http://127.0.0.1:${port}/api${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: { Cookie: cookie, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return {
      status: response.status,
      data: await response.json(),
      cookie: response.headers.get("set-cookie")?.split(";")[0] ?? "",
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
    login,
    advance: (ms: number) => {
      clock += ms;
    },
  };
}
const path = "/classrooms/class-demo/students/student-demo/study-statistics";

test("date-range reports include the full Vietnam end day, exact class, saved accuracy, reviewed hunt points and each online score", async (t) => {
  const f = await fixture(t, studyDayStart("2026-10-20"));
  const start = studyDayStart("2026-10-19"),
    end = studyDayStart("2026-10-20");
  // Start tracking before the selected date without modifying a real database.
  f.db.prepare("UPDATE study_history_tracking SET started_at=?").run(start);
  creditStudyInterval(
    f.db,
    "student-demo",
    "chapter-1",
    start,
    start + 61000,
    () => {},
  );
  creditStudyInterval(
    f.db,
    "student-demo",
    "chapter-1",
    end,
    end + 99000,
    () => {},
  );
  const question = f.db
    .prepare("SELECT id FROM questions WHERE chapter_id='chapter-1' LIMIT 1")
    .get()!;
  for (const [id, correct, at] of [
    ["r-a", 1, start],
    ["r-b", 0, end - 1],
    ["r-out", 1, end],
  ] as const)
    f.db
      .prepare("INSERT INTO attempts VALUES(?,?,?,0,?,'practice',?)")
      .run(id, "student-demo", question.id, correct, at);
  for (const [id, status, source, at] of [
    ["approved", "approved", "exam:a", start],
    ["pending", "pending", "exam:b", start],
    ["rejected", "rejected", "exam:c", start],
    ["tree", "approved", "tree:a", start],
    ["outside", "approved", "exam:d", end],
  ] as const)
    f.db
      .prepare(
        "INSERT INTO learning_rewards(id,student_id,classroom_id,source,label,points,status,created_at) VALUES(?,'student-demo','class-demo',?,'Reward',1,?,?)",
      )
      .run(id, source, status, at);
  f.db
    .prepare(
      "INSERT INTO exam_definitions VALUES('range-exam','class-demo','Online','[]',?,?,4,0,?)",
    )
    .run(start, end, start);
  f.db
    .prepare(
      "INSERT INTO online_exam_sessions(exam_id,duration_minutes,question_count) VALUES('range-exam',20,1)",
    )
    .run();
  f.db
    .prepare(
      `INSERT INTO exam_runs(id,student_id,classroom_id,exam_id,kind,title,questions,answers,started_at,deadline_at,tab_limit,status,score,submitted_at,request_id)
    VALUES('range-run','student-demo','class-demo','range-exam','official','Online','[]','{}',?,?,4,'submitted',8.5,?,'range-request')`,
    )
    .run(start, end, end - 1);
  const report = studyRangeReport(
    f.db,
    "class-demo",
    "student-demo",
    "2026-10-19",
    "2026-10-19",
  );
  assert.equal(report.members[0].seconds, 61);
  assert.equal(report.members[0].attempts, 2);
  assert.equal(report.members[0].correct, 1);
  assert.equal(report.members[0].huntPoints, 1);
  assert.equal(report.members[0].pendingHuntPoints, 1);
  assert.deepEqual(
    report.members[0].onlineExams.map((e) => e.score),
    [8.5],
  );
  assert.deepEqual(
    studyRangeReport(f.db, "class-demo", "unknown", "2026-10-19", "2026-10-19")
      .members,
    [],
  );
  const response = await f.request(
    path + "?from=2026-10-19&to=2026-10-19",
    f.teacher,
  );
  assert.equal(response.status, 200);
  assert.deepEqual(response.data.report, report);
  assert.equal(
    (
      await f.request(
        "/classrooms/class-demo/study-statistics?from=2026-10-19&to=2026-10-19",
        f.student,
      )
    ).status,
    403,
  );
  for (const query of [
    "from=2026-10-20&to=2026-10-19",
    "from=2026-10-19",
    "from=2026-10-19&to=2026-10-21",
    "from=2026-02-30&to=2026-10-19",
    "from=2026-10-19&from=2026-10-18&to=2026-10-19",
  ])
    assert.equal(
      (await f.request(path + "?" + query, f.teacher)).status,
      400,
      query,
    );
});

test("class statistics sum current members, include archived class history and exclude other classes and former members", async (t) => {
  const f = await fixture(t);
  f.db
    .prepare(
      "DELETE FROM memberships WHERE classroom_id='class-demo' AND student_id<>'student-demo'",
    )
    .run();
  f.db
    .prepare(
      "INSERT INTO users VALUES('second','second@fixture.test','Second',?,'student',0)",
    )
    .run(hashPassword("GreenEdu123!"));
  f.db.prepare("INSERT INTO memberships VALUES('class-demo','second')").run();
  f.db
    .prepare(
      "INSERT INTO classrooms VALUES('other-class','Other','Math','10','teacher-demo')",
    )
    .run();
  f.db
    .prepare(
      "INSERT INTO chapters VALUES('other-chapter','other-class','Other')",
    )
    .run();
  f.db.prepare("INSERT INTO memberships VALUES('other-class','second')").run();
  const start = studyDayStart("2026-10-14") + 3600000;
  for (const [studentId, chapterId, ms] of [
    ["student-demo", "chapter-1", 15000],
    ["second", "chapter-2", 45000],
    ["second", "other-chapter", 999000],
  ] as const)
    creditStudyInterval(
      f.db,
      studentId,
      chapterId,
      start,
      start + ms,
      () => {},
    );
  f.db
    .prepare(
      "INSERT INTO archived_chapters VALUES('chapter-2','teacher-demo',?)",
    )
    .run(start);
  const endpoint = "/classrooms/class-demo/study-statistics";
  const response = await f.request(endpoint, f.teacher);
  assert.equal(response.status, 200);
  assert.equal(response.data.members.length, 2);
  assert.equal(response.data.lifetimeSeconds, 60);
  assert.equal(response.data.summaries.day.seconds, 60);
  assert.equal(response.data.buckets.at(-1).seconds, 60);
  assert.equal(response.data.buckets.at(-2).seconds, null);
  assert.deepEqual(
    response.data.members.map((m: any) => Object.keys(m).sort()),
    [
      ["id", "name", "statistics"],
      ["id", "name", "statistics"],
    ],
  );
  f.db
    .prepare(
      "DELETE FROM memberships WHERE classroom_id='class-demo' AND student_id='second'",
    )
    .run();
  const after = (await f.request(endpoint, f.teacher)).data;
  assert.equal(after.members.length, 1);
  assert.equal(after.lifetimeSeconds, 15);
  assert.equal(after.summaries.day.seconds, 15);
  const old = (await f.request(endpoint + "?date=2026-01-01", f.teacher)).data;
  assert.equal(old.summaries.month.seconds, null);
  assert.equal(old.lifetimeSeconds, 15);
  assert.equal(
    f.db.prepare("SELECT COUNT(*) AS n FROM study_daily_time").get()!.n,
    3,
  );
});

test("class statistics enforce teacher ownership, validate filters and describe empty classes", async (t) => {
  const f = await fixture(t);
  const endpoint = "/classrooms/class-demo/study-statistics";
  f.db
    .prepare(
      "INSERT INTO users VALUES('other','other@fixture.test','Other',?,'teacher',0)",
    )
    .run(hashPassword("GreenEdu123!"));
  const other = await f.login("other@fixture.test");
  assert.equal((await f.request(endpoint, "")).status, 401);
  assert.equal((await f.request(endpoint, f.student)).status, 403);
  assert.equal((await f.request(endpoint, other)).status, 403);
  assert.equal(
    (await f.request(endpoint.replace("class-demo", "unknown"), f.teacher))
      .status,
    404,
  );
  for (const query of [
    "period=year",
    "period=day&period=week",
    "date=2026-02-30",
    "date=2026-10-15",
    "date=2026-10-14&date=2026-10-14",
  ])
    assert.equal(
      (await f.request(`${endpoint}?${query}`, f.teacher)).status,
      400,
    );
  f.db.prepare("DELETE FROM memberships WHERE classroom_id='class-demo'").run();
  const empty = (await f.request(endpoint, f.teacher)).data;
  assert.deepEqual(empty.members, []);
  assert.equal(empty.lifetimeSeconds, 0);
  assert.equal(empty.summaries.day.seconds, 0);
  assert.equal(empty.buckets.at(-2).seconds, null);
});

test("a session surviving rollout keeps lifetime credit but only tracks history after the feature starts", async (t) => {
  const startedAt = studyDayStart("2026-10-14") + 5000;
  const f = await fixture(t, startedAt);
  f.db
    .prepare(
      "INSERT INTO study_sessions VALUES('existing-session','student-demo','chapter-1',?,?,1)",
    )
    .run(startedAt - 10000, startedAt - 10000);
  f.advance(5000);
  const heartbeat = await f.request("/study/heartbeat", f.student, {
    sessionId: "existing-session",
    active: true,
    interacted: true,
  });
  assert.equal(heartbeat.data.creditedSeconds, 15);
  const data = (await f.request(path, f.teacher)).data;
  assert.equal(data.lifetimeSeconds, 15);
  assert.equal(data.summaries.day.seconds, 5);
  assert.equal(
    f.db.prepare("SELECT SUM(credited_ms) AS ms FROM study_daily_time").get()!
      .ms,
    5000,
  );
  assert.equal(data.buckets.at(-2).seconds, null);
});

test("calendar boundaries use Vietnam midnight, Monday weeks, leap years and real month lengths", () => {
  assert.equal(studyDate(Date.parse("2026-10-13T17:00:00Z")), "2026-10-14");
  assert.equal(studyPeriodStart("2026-10-18", "week"), "2026-10-12");
  assert.equal(studyPeriodStart("2026-10-19", "week"), "2026-10-19");
  assert.equal(shiftStudyPeriod("2026-12-01", "month", 1), "2027-01-01");
  assert.equal(shiftStudyPeriod("2024-02-28", "day", 1), "2024-02-29");
  for (const invalid of [
    "2026-02-29",
    "2026-02-30",
    "2026-13-01",
    "2026-1-01",
    "oops",
  ])
    assert.equal(validStudyDate(invalid), false);
});

test("additive migration keeps legacy totals and does not fabricate daily history or reset tracking start", async (t) => {
  const f = await fixture(t);
  f.db
    .prepare("INSERT INTO progress VALUES('student-demo','chapter-1',7200)")
    .run();
  ensureStudyHistorySchema(f.db);
  startStudyHistory(f.db, studyDayStart("2026-10-15"));
  const response = await f.request(path, f.teacher);
  assert.equal(response.status, 200);
  assert.equal(response.data.lifetimeSeconds, 7200);
  assert.equal(
    response.data.trackingStartedAt,
    studyDayStart("2026-10-14") + 3600000,
  );
  assert.equal(response.data.summaries.day.seconds, 0);
  assert.equal(response.data.summaries.day.coverage, "partial");
  assert.deepEqual(
    response.data.buckets.slice(0, -1).map((bucket: any) => bucket.seconds),
    Array(13).fill(null),
  );
  assert.equal(
    f.db.prepare("SELECT COUNT(*) AS n FROM study_daily_time").get()!.n,
    0,
  );
  const old = await f.request(path + "?date=2026-09-01", f.teacher);
  assert.equal(old.data.summaries.month.seconds, null);
});

test("heartbeat crosses midnight into two exact days, repeated heartbeat and stop cannot duplicate credit", async (t) => {
  const f = await fixture(t, studyDayStart("2026-10-14") - 10000);
  const start = await f.request("/study/start", f.student, {
    chapterId: "chapter-1",
  });
  f.advance(15000);
  const body = {
    sessionId: start.data.sessionId,
    active: true,
    interacted: true,
  };
  assert.equal(
    (await f.request("/study/heartbeat", f.student, body)).data.creditedSeconds,
    15,
  );
  assert.equal(
    (await f.request("/study/heartbeat", f.student, body)).data.creditedSeconds,
    0,
  );
  f.advance(5000);
  await f.request("/study/stop", f.student, {
    sessionId: start.data.sessionId,
  });
  await f.request("/study/stop", f.student, {
    sessionId: start.data.sessionId,
  });
  const daily = f.db
    .prepare("SELECT day,credited_ms FROM study_daily_time ORDER BY day")
    .all()
    .map((row) => [row.day, row.credited_ms]);
  assert.deepEqual(daily, [
    ["2026-10-13", 10000],
    ["2026-10-14", 10000],
  ]);
  const data = (await f.request(path, f.teacher)).data;
  assert.equal(data.lifetimeSeconds, 20);
  assert.equal(data.summaries.day.seconds, 10);
  assert.equal(data.summaries.week.seconds, 20);
  assert.equal(data.summaries.month.seconds, 20);
});

test("hidden/disconnected/expired intervals add no historical time; credit rolls back atomically on failure", async (t) => {
  const f = await fixture(t);
  const start = await f.request("/study/start", f.student, {
    chapterId: "chapter-1",
  });
  f.advance(15000);
  await f.request("/study/heartbeat", f.student, {
    sessionId: start.data.sessionId,
    active: false,
    interacted: false,
  });
  f.advance(31000);
  await f.request("/study/heartbeat", f.student, {
    sessionId: start.data.sessionId,
    active: true,
    interacted: true,
  });
  f.advance(120000);
  assert.equal(
    (
      await f.request("/study/heartbeat", f.student, {
        sessionId: start.data.sessionId,
        active: true,
        interacted: true,
      })
    ).status,
    409,
  );
  assert.equal(
    f.db.prepare("SELECT COUNT(*) AS n FROM study_daily_time").get()!.n,
    0,
  );
  const before = f.db
    .prepare(
      "SELECT seconds FROM progress WHERE student_id='student-demo' AND chapter_id='chapter-1'",
    )
    .get()!.seconds;
  assert.throws(() =>
    creditStudyInterval(
      f.db,
      "student-demo",
      "chapter-1",
      studyDayStart("2026-10-14"),
      studyDayStart("2026-10-14") + 1000,
      () => {
        throw new Error("write failed");
      },
    ),
  );
  assert.equal(
    f.db.prepare("SELECT COUNT(*) AS n FROM study_daily_time").get()!.n,
    0,
  );
  assert.equal(
    f.db
      .prepare(
        "SELECT seconds FROM progress WHERE student_id='student-demo' AND chapter_id='chapter-1'",
      )
      .get()!.seconds,
    before,
  );
});

test("per-student summaries group class chapters and preserve subsecond credit across months and Monday boundaries", async (t) => {
  const f = await fixture(t, studyDayStart("2026-09-01"));
  f.db
    .prepare(
      "INSERT INTO classrooms VALUES('other-class','Other','Math','10','teacher-demo')",
    )
    .run();
  f.db
    .prepare(
      "INSERT INTO chapters VALUES('other-chapter','other-class','Other')",
    )
    .run();
  f.db
    .prepare("INSERT INTO memberships VALUES('other-class','student-demo')")
    .run();
  for (const [chapter, date, ms] of [
    ["chapter-1", "2026-09-30", 1500],
    ["chapter-2", "2026-10-01", 2500],
    ["chapter-1", "2026-10-11", 3500],
    ["chapter-2", "2026-10-12", 4500],
    ["other-chapter", "2026-10-12", 99000],
  ] as const) {
    creditStudyInterval(
      f.db,
      "student-demo",
      chapter,
      studyDayStart(date),
      studyDayStart(date) + ms,
      () => {},
    );
  }
  const october = studentStudyStatistics(
    f.db,
    "class-demo",
    "student-demo",
    "month",
    "2026-10-14",
  );
  assert.equal(october.buckets.at(-1)!.seconds, 10);
  assert.equal(october.buckets.at(-2)!.seconds, 1);
  assert.equal(october.summaries.week.seconds, 4);
  const weeks = studentStudyStatistics(
    f.db,
    "class-demo",
    "student-demo",
    "week",
    "2026-10-14",
  );
  assert.equal(weeks.buckets.at(-1)!.start, "2026-10-12");
  assert.equal(weeks.buckets.at(-2)!.seconds, 3);
  assert.equal(
    studentStudyStatistics(
      f.db,
      "other-class",
      "student-demo",
      "day",
      "2026-10-14",
    ).summaries.week.seconds,
    99,
  );
});

test("statistics enforce owner/student membership and reject invalid, repeated or future date filters", async (t) => {
  const f = await fixture(t);
  f.db
    .prepare(
      "INSERT INTO users VALUES('other','other@fixture.test','Other',?,'teacher',0)",
    )
    .run(hashPassword("GreenEdu123!"));
  const other = await f.login("other@fixture.test");
  assert.equal((await f.request(path, "")).status, 401);
  assert.equal((await f.request(path, f.student)).status, 403);
  assert.equal((await f.request(path, other)).status, 403);
  assert.equal(
    (await f.request(path.replace("student-demo", "unknown"), f.teacher))
      .status,
    404,
  );
  for (const query of [
    "period=year",
    "period=day&period=week",
    "date=2026-02-30",
    "date=2026-10-15",
    "date=2000-01-01&date=2026-10-14",
  ])
    assert.equal((await f.request(`${path}?${query}`, f.teacher)).status, 400);
  f.db
    .prepare(
      "DELETE FROM memberships WHERE student_id='student-demo' AND classroom_id='class-demo'",
    )
    .run();
  assert.equal((await f.request(path, f.teacher)).status, 404);
});
