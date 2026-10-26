import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase, seedDemo } from "./db.js";
import { ensureLearningSchema } from "./learning-db.js";
import { sweepLearningExams } from "./learning.js";
import { grantLearningMilestones } from "./learning.js";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { huntMinimumScore } from "./reward-rules.js";

test("class reward setting migration defaults to eight and preserves history across reopen", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "greenedu-reward-rules-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const path = join(dir, "reward.sqlite");
  let db = openDatabase(path);
  try {
    seedDemo(db);
    db.exec("DROP TABLE classroom_reward_settings");
    const users = db.prepare("SELECT * FROM users ORDER BY id").all();
    ensureLearningSchema(db);
    ensureLearningSchema(db);
    assert.equal(huntMinimumScore(db, "class-demo"), 8);
    db.prepare(
      "INSERT INTO classroom_reward_settings VALUES('class-demo',7.5,'teacher-demo',123)",
    ).run();
    db.close();
    db = openDatabase(path);
    assert.equal(huntMinimumScore(db, "class-demo"), 7.5);
    assert.deepEqual(
      db.prepare("SELECT * FROM users ORDER BY id").all(),
      users,
    );
    assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
  } finally {
    db.close();
  }
});

test("chapter exam permission migration preserves old settings and progress, defaults closed and persists on reopen", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "greenedu-exam-access-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const path = join(dir, "access.sqlite");
  let db = openDatabase(path);
  try {
    seedDemo(db);
    db.exec("DROP TABLE chapter_exam_access");
    db.prepare(
      "INSERT INTO chapter_learning VALUES('chapter-1','Học kỳ I','latest')",
    ).run();
    db.prepare(
      "INSERT INTO progress VALUES('student-demo','chapter-1',14400)",
    ).run();
    const settings = db.prepare("SELECT * FROM chapter_learning").all();
    const progress = db.prepare("SELECT * FROM progress").all();
    ensureLearningSchema(db);
    ensureLearningSchema(db);
    assert.equal(
      db.prepare("SELECT COUNT(*) AS n FROM chapter_exam_access").get()!.n,
      0,
    );
    assert.deepEqual(
      db.prepare("SELECT * FROM chapter_learning").all(),
      settings,
    );
    assert.deepEqual(db.prepare("SELECT * FROM progress").all(), progress);
    db.prepare(
      "INSERT INTO chapter_exam_access VALUES('chapter-1',1,'teacher-demo',123)",
    ).run();
    db.close();
    db = openDatabase(path);
    assert.equal(
      db
        .prepare(
          "SELECT enabled FROM chapter_exam_access WHERE chapter_id='chapter-1'",
        )
        .get()!.enabled,
      1,
    );
    assert.deepEqual(
      db.prepare("SELECT * FROM chapter_learning").all(),
      settings,
    );
    assert.deepEqual(db.prepare("SELECT * FROM progress").all(), progress);
    assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
  } finally {
    db.close();
  }
});

test("online session migration and reopen preserve the announced schedule, selection and frozen paper", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "greenedu-online-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const path = join(dir, "online.sqlite");
  let db = openDatabase(path);
  try {
    seedDemo(db);
    db.prepare(
      "INSERT INTO exam_definitions VALUES('online','class-demo','Online','[]',120000,180000,4,1,1)",
    ).run();
    db.prepare(
      "INSERT INTO online_exam_sessions(exam_id,duration_minutes,question_count,selection,started_at) VALUES('online',1,1,'{}',60000)",
    ).run();
    db.exec("ALTER TABLE online_exam_sessions DROP COLUMN scheduled_start_at");
    ensureLearningSchema(db);
    assert.equal(
      db.prepare("SELECT scheduled_start_at FROM online_exam_sessions").get()!
        .scheduled_start_at,
      null,
    );
    db.prepare(
      "UPDATE online_exam_sessions SET scheduled_start_at=120000",
    ).run();
    db.exec("ALTER TABLE online_exam_sessions DROP COLUMN preparation_minutes");
    const before = db.prepare("SELECT * FROM online_exam_sessions").get()!;
    ensureLearningSchema(db);
    ensureLearningSchema(db);
    assert.deepEqual(
      { ...db.prepare("SELECT * FROM online_exam_sessions").get()! },
      { ...before, preparation_minutes: 3 },
    );
    db.close();
    db = openDatabase(path);
    assert.equal(
      db.prepare("SELECT closes_at FROM exam_definitions").get()!.closes_at,
      180000,
    );
    assert.equal(
      db.prepare("SELECT started_at FROM online_exam_sessions").get()!
        .started_at,
      60000,
    );
    assert.equal(
      db.prepare("SELECT scheduled_start_at FROM online_exam_sessions").get()!
        .scheduled_start_at,
      120000,
    );
    assert.equal(
      db.prepare("SELECT COUNT(*) AS n FROM online_exam_sessions").get()!.n,
      1,
    );
    assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
  } finally {
    db.close();
  }
});

test("old exam schema gains revision/released while keeping existing runs", () => {
  const db = openDatabase(":memory:");
  try {
    seedDemo(db);
    db.exec(
      "ALTER TABLE exam_runs DROP COLUMN revision; ALTER TABLE exam_runs DROP COLUMN released;",
    );
    const student = db
      .prepare("SELECT id FROM users WHERE role='student' LIMIT 1")
      .get()!;
    const classroom = db.prepare("SELECT id FROM classrooms LIMIT 1").get()!;
    db.prepare(
      `INSERT INTO exam_runs(id,student_id,classroom_id,kind,title,questions,started_at,deadline_at,tab_limit,request_id)
      VALUES(?,?,?,'hunt','Existing exam','[]',1,100000,4,'existing-request')`,
    ).run("existing-run", student.id, classroom.id);
    const before = db
      .prepare("SELECT * FROM exam_runs WHERE id='existing-run'")
      .get()!;
    ensureLearningSchema(db);
    ensureLearningSchema(db);
    const after = db
      .prepare("SELECT * FROM exam_runs WHERE id='existing-run'")
      .get()!;
    assert.deepEqual({ ...after }, { ...before, revision: 0, released: 0 });
    assert.doesNotThrow(() => sweepLearningExams(db, 0));
    assert.doesNotThrow(() => sweepLearningExams(db, 100000));
    assert.equal(
      db.prepare("SELECT score FROM exam_runs WHERE id='existing-run'").get()!
        .score,
      0,
    );
    assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
  } finally {
    db.close();
  }
});

test("review, saved exam answers, consumed ticket and rewards persist on reopen; missed expiry is recovered once", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "greenedu-learning-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const path = join(dir, "learning.sqlite");
  let db = openDatabase(path);
  try {
    seedDemo(db);
    db.prepare(
      "INSERT INTO progress VALUES('student-demo','chapter-1',14400)",
    ).run();
    grantLearningMilestones(db, "student-demo", 1);
    const questions = JSON.stringify([
      {
        id: "question-1",
        chapterId: "chapter-1",
        chapterTitle: "Chapter",
        text: "Question",
        choices: ["A", "B", "C", "D"],
        lesson: "Lesson",
        correctIndex: 0,
        explanation: "Answer A",
      },
    ]);
    db.prepare(
      "INSERT INTO review_sessions(id,student_id,classroom_id,title,questions,answers,current_index,request_id,created_at) VALUES('review','student-demo','class-demo','Review',?,'{}',0,'review-key',1)",
    ).run(questions);
    db.prepare(
      "INSERT INTO exam_runs(id,student_id,classroom_id,chapter_id,kind,title,questions,answers,started_at,deadline_at,tab_limit,request_id,revision) VALUES('run','student-demo','class-demo','chapter-1','hunt','Exam',?, ?,1,10000,4,'run-key',1)",
    ).run(questions, JSON.stringify({ "question-1": 0 }));
    db.prepare("UPDATE learning_tickets SET used_by='run' WHERE level=3").run();
    db.prepare("INSERT INTO exam_tab_events VALUES('run','warning-1',2)").run();
    db.close();
    db = openDatabase(path);
    assert.equal(
      db.prepare("SELECT questions FROM review_sessions").get()!.questions,
      questions,
    );
    assert.equal(
      db.prepare("SELECT revision FROM exam_runs").get()!.revision,
      1,
    );
    assert.equal(
      db.prepare("SELECT COUNT(*) AS n FROM exam_tab_events").get()!.n,
      1,
    );
    sweepLearningExams(db, 10000);
    sweepLearningExams(db, 10001);
    grantLearningMilestones(db, "student-demo", 10001);
    assert.equal(db.prepare("SELECT score FROM exam_runs").get()!.score, 10);
    assert.equal(
      db.prepare("SELECT COUNT(*) AS n FROM learning_tickets").get()!.n,
      3,
    );
    assert.equal(
      db
        .prepare(
          "SELECT COUNT(*) AS n FROM learning_tickets WHERE used_by IS NOT NULL",
        )
        .get()!.n,
      1,
    );
    assert.equal(
      db.prepare("SELECT COUNT(*) AS n FROM learning_rewards").get()!.n,
      2,
    );
    assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
  } finally {
    db.close();
  }
});
