import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { openDatabase, seedDemo } from "./db.js";
import { createApp } from "./app.js";
import {
  ensureWeeklyPracticeSchema,
  startWeeklyPractice,
  saveWeeklyMinimum,
  weeklyPracticeReport,
  recordWeeklyPractice,
  sweepWeeklyPractice,
} from "./weekly-practice.js";
import { practiceWeek } from "../shared/weekly-practice.js";
import { studyDayStart, STUDY_DAY_MS } from "../shared/study-statistics.js";
import { creditStudyInterval, startStudyHistory } from "./study-history.js";
import { terminateStudy } from "./class-management.js";

const mon = studyDayStart("2026-10-12"),
  noon = mon + 6.5 * STUDY_DAY_MS,
  cutoff = mon + 7 * STUDY_DAY_MS;

test("a cross-week interval includes Sunday afternoon and splits at Monday midnight", (t) => {
  const { db, chapter } = fixture(t);
  recordWeeklyPractice(
    db,
    "student-demo",
    chapter,
    noon - 10000,
    mon + 7 * STUDY_DAY_MS + 20000,
  );
  const rows = db
    .prepare(
      "SELECT week,credited_ms FROM weekly_practice_credit ORDER BY week",
    )
    .all();
  assert.deepEqual(
    rows.map((r) => [r.week, r.credited_ms]),
    [
      ["2026-10-12", 0.5 * STUDY_DAY_MS + 10000],
      ["2026-10-19", 20000],
    ],
  );
});
test("another class and a non-member's credit never make a student complete this class", (t) => {
  const { db, chapter } = fixture(t);
  saveWeeklyMinimum(db, "class-demo", 1, mon);
  db.prepare(
    "INSERT INTO classrooms VALUES('weekly-other','Khác','Toán','11','teacher-demo')",
  ).run();
  db.prepare(
    "INSERT INTO chapters VALUES('weekly-other-ch','weekly-other','Khác')",
  ).run();
  recordWeeklyPractice(db, "student-demo", "weekly-other-ch", mon, mon + 60000);
  recordWeeklyPractice(db, "teacher-demo", chapter, mon, mon + 60000);
  const r = weeklyPracticeReport(db, "class-demo", mon + 60000).report!;
  assert.equal(r.completed.length, 0);
  assert.equal(r.incomplete.find((s) => s.id === "student-demo")!.seconds, 0);
});
test("a teacher lock keeps valid recorded time in the weekly report", (t) => {
  const { db, chapter } = fixture(t);
  saveWeeklyMinimum(db, "class-demo", 1, mon);
  db.prepare(
    "INSERT INTO study_sessions VALUES('weekly-lock','student-demo',?,?,?,1)",
  ).run(chapter, mon, mon);
  db.prepare(
    "INSERT INTO study_session_controls(session_id,student_id,chapter_id,created_at) VALUES('weekly-lock','student-demo',?,?)",
  ).run(chapter, mon);
  creditStudyInterval(db, "student-demo", chapter, mon, mon + 60000, () => {});
  terminateStudy(db, "weekly-lock", "locked");
  assert.equal(
    weeklyPracticeReport(db, "class-demo", cutoff, "2026-10-12").report!
      .completed.length,
    1,
  );
});
function fixture(t: TestContext, start = mon) {
  const db = openDatabase(":memory:");
  seedDemo(db);
  startWeeklyPractice(db, start);
  startStudyHistory(db, start);
  const chapter = String(
    db
      .prepare(
        "SELECT id FROM chapters WHERE classroom_id='class-demo' LIMIT 1",
      )
      .get()!.id,
  );
  t.after(() => db.close());
  return { db, chapter };
}
test("Vietnam week begins Monday midnight and ends Sunday midnight with a noon checkpoint", () => {
  assert.deepEqual(practiceWeek(mon), {
    week: "2026-10-12",
    startsAt: mon,
    preliminaryAt: noon,
    closesAt: cutoff,
  });
  assert.equal(practiceWeek(cutoff - 1).week, "2026-10-12");
  assert.equal(practiceWeek(mon + 7 * STUDY_DAY_MS).week, "2026-10-19");
  assert.equal(practiceWeek(mon - 1).week, "2026-10-05");
});
test("only exact clipped intervals count; completion is inclusive and chapters aggregate only within the class", (t) => {
  const { db, chapter } = fixture(t);
  saveWeeklyMinimum(db, "class-demo", 1, mon);
  recordWeeklyPractice(
    db,
    "student-demo",
    chapter,
    cutoff - 10000,
    cutoff + 10000,
  );
  recordWeeklyPractice(
    db,
    "student-demo",
    chapter,
    cutoff + 10000,
    cutoff + 90000,
  );
  let r = weeklyPracticeReport(db, "class-demo", cutoff, "2026-10-12").report!;
  assert.equal(r.incomplete.find((m) => m.id === "student-demo")!.seconds, 10);
  assert.equal(r.closed, true);
  // Late credit is clipped at the final midnight boundary.
  recordWeeklyPractice(
    db,
    "student-demo",
    chapter,
    cutoff - 60000,
    cutoff - 10000,
  );
  r = weeklyPracticeReport(
    db,
    "class-demo",
    cutoff + 100000,
    "2026-10-12",
  ).report!;
  assert.equal(r.completed.find((m) => m.id === "student-demo")!.seconds, 60);
  assert.equal(r.completed[0].remainingSeconds, 0);
  assert.equal(
    db
      .prepare(
        "SELECT COUNT(*) n FROM weekly_practice_credit WHERE week='2026-10-12'",
      )
      .get()!.n,
    2,
  );
});
test("weekly goal changes and roster changes cannot rewrite the ended week's goal or roster", (t) => {
  const { db } = fixture(t);
  saveWeeklyMinimum(db, "class-demo", 60, mon);
  saveWeeklyMinimum(db, "class-demo", 120, mon + STUDY_DAY_MS);
  assert.equal(
    weeklyPracticeReport(db, "class-demo", mon + STUDY_DAY_MS).report!.minutes,
    60,
  );
  sweepWeeklyPractice(db, cutoff);
  db.prepare(
    "UPDATE users SET name='Đổi tên sau hạn' WHERE id='student-demo'",
  ).run();
  db.prepare(
    "DELETE FROM memberships WHERE classroom_id='class-demo' AND student_id='student-demo'",
  ).run();
  const now = mon + 7 * STUDY_DAY_MS;
  const data = weeklyPracticeReport(db, "class-demo", now);
  assert.equal(data.report!.minutes, 120);
  const old = weeklyPracticeReport(db, "class-demo", now, "2026-10-12").report!;
  assert.equal(old.minutes, 60);
  assert.ok(
    old.incomplete.some(
      (s) => s.id === "student-demo" && s.name !== "Đổi tên sau hạn",
    ),
  );
  assert.equal(
    data.report!.incomplete.some((s) => s.id === "student-demo"),
    false,
  );
});
test("first setup Sunday afternoon applies this week; zero disables later weeks and retry is idempotent", (t) => {
  const { db } = fixture(t);
  saveWeeklyMinimum(db, "class-demo", 30, noon + 1000);
  saveWeeklyMinimum(db, "class-demo", 30, noon + 2000);
  const r = weeklyPracticeReport(db, "class-demo", noon + 2000).report!;
  assert.equal(r.minutes, 30);
  assert.equal(r.preliminary, null);
  assert.equal(
    db.prepare("SELECT COUNT(*) n FROM weekly_practice_settings").get()!.n,
    1,
  );
  saveWeeklyMinimum(db, "class-demo", 0, noon + 3000);
  assert.equal(
    weeklyPracticeReport(db, "class-demo", cutoff, "2026-10-12").weeks.length,
    1,
  );
});

test("rollout does not fabricate earlier daily history and no report is fabricated for downtime weeks", (t) => {
  const { db, chapter } = fixture(t, mon + 2 * STUDY_DAY_MS);
  db.prepare("INSERT INTO study_daily_time VALUES(?,?,?,9999999)").run(
    "student-demo",
    chapter,
    "2026-10-12",
  );
  saveWeeklyMinimum(db, "class-demo", 1, mon + 2 * STUDY_DAY_MS);
  let r = weeklyPracticeReport(
    db,
    "class-demo",
    mon + 2 * STUDY_DAY_MS,
  ).report!;
  assert.equal(r.coverageStart, mon + 2 * STUDY_DAY_MS);
  assert.equal(r.completed.length, 0);
  ensureWeeklyPracticeSchema(db);
  startWeeklyPractice(db, mon + 3 * STUDY_DAY_MS);
  assert.equal(
    weeklyPracticeReport(db, "class-demo", mon + 21 * STUDY_DAY_MS).weeks
      .length,
    2,
  );
});
test("credit integration is atomic and invalidated sessions are removed even from ended reports", (t) => {
  const { db, chapter } = fixture(t);
  saveWeeklyMinimum(db, "class-demo", 1, mon);
  db.prepare(
    "INSERT INTO study_sessions VALUES('weekly-session','student-demo',?,?,?,1)",
  ).run(chapter, mon, mon);
  db.prepare(
    "INSERT INTO study_session_controls(session_id,student_id,chapter_id,created_at) VALUES('weekly-session','student-demo',?,?)",
  ).run(chapter, mon);
  creditStudyInterval(db, "student-demo", chapter, mon, mon + 60000, () => {});
  assert.equal(
    weeklyPracticeReport(db, "class-demo", cutoff, "2026-10-12").report!
      .completed.length,
    1,
  );
  terminateStudy(db, "weekly-session", "tabs");
  terminateStudy(db, "weekly-session", "tabs");
  assert.equal(
    weeklyPracticeReport(db, "class-demo", cutoff, "2026-10-12").report!
      .completed.length,
    0,
  );
  assert.equal(
    db.prepare("SELECT COUNT(*) n FROM weekly_practice_credit").get()!.n,
    0,
  );
  assert.throws(() =>
    creditStudyInterval(db, "student-demo", chapter, mon, mon + 60000, () => {
      throw Error("rollback");
    }),
  );
  assert.equal(
    db.prepare("SELECT COUNT(*) n FROM weekly_practice_credit").get()!.n,
    0,
  );
});
test("weekly API checks owner role, validates limits and selected weeks, saves and retrieves reports", async (t) => {
  const db = openDatabase(":memory:");
  seedDemo(db);
  const app = createApp(db, { now: () => mon });
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((r) => server.once("listening", r));
  t.after(async () => {
    await new Promise<void>((r) => server.close(() => r()));
    db.close();
  });
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}/api`;
  async function request(path: string, cookie = "", body?: unknown) {
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
    (await request("/auth/login", "", { email, password: "GreenEdu123!" }))
      .cookie;
  const teacher = await login("giaovien@greenedu.nk"),
    student = await login("hocsinh@greenedu.nk");
  const path = "/classrooms/class-demo/weekly-practice";
  assert.equal((await request(path)).status, 401);
  assert.equal((await request(path, student)).status, 403);
  assert.equal((await request(path, student, { minutes: 10 })).status, 403);
  for (const value of [-1, 1.5, 9361, "60", null])
    assert.equal(
      (await request(path, teacher, { minutes: value })).status,
      400,
    );
  const saved = await request(path, teacher, { minutes: 60 });
  assert.equal(saved.status, 200);
  assert.equal(saved.data.report.minutes, 60);
  assert.equal(
    (await request(path + "?week=2026-10-12", teacher)).data.report.week,
    "2026-10-12",
  );
  assert.equal((await request(path + "?week=garbage", teacher)).status, 400);
  assert.equal((await request(path + "?week=2026-10-05", teacher)).status, 404);
  db.prepare(
    "UPDATE classrooms SET teacher_id='student-demo' WHERE id='class-demo'",
  ).run();
  assert.equal((await request(path, teacher)).status, 403);
});

test("noon reminder snapshot stays fixed while Sunday catch-up changes final completion", (t) => {
  const { db, chapter } = fixture(t);
  saveWeeklyMinimum(db, "class-demo", 1, mon);
  recordWeeklyPractice(db, "student-demo", chapter, noon - 30000, noon + 10000);
  let r = weeklyPracticeReport(db, "class-demo", noon + 10000).report!;
  assert.equal(r.closed, false);
  assert.equal(
    r.preliminary!.incomplete.find((s) => s.id === "student-demo")!.seconds,
    30,
  );
  assert.equal(r.incomplete.find((s) => s.id === "student-demo")!.seconds, 40);
  recordWeeklyPractice(db, "student-demo", chapter, noon + 10000, noon + 30000);
  r = weeklyPracticeReport(db, "class-demo", cutoff, "2026-10-12").report!;
  assert.equal(r.closed, true);
  assert.equal(r.completed[0].seconds, 60);
  assert.equal(
    r.preliminary!.incomplete.find((s) => s.id === "student-demo")!.seconds,
    30,
  );
  assert.equal(r.closesAt, cutoff);
});

test("delayed sweep clips noon snapshot and upgrades the previous noon closure without inventing credit", (t) => {
  const { db, chapter } = fixture(t);
  saveWeeklyMinimum(db, "class-demo", 1, mon);
  recordWeeklyPractice(db, "student-demo", chapter, noon - 10000, noon + 60000);
  db.prepare("UPDATE weekly_practice_periods SET closed_at=?").run(noon);
  const r = weeklyPracticeReport(db, "class-demo", noon + 60000).report!;
  assert.equal(r.closed, false);
  assert.equal(r.completed[0].seconds, 70);
  assert.equal(
    r.preliminary!.incomplete.find((s) => s.id === "student-demo")!.seconds,
    10,
  );
  ensureWeeklyPracticeSchema(db);
  assert.equal(
    weeklyPracticeReport(db, "class-demo", cutoff, "2026-10-12").report!.closed,
    true,
  );
});
