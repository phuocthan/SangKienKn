import type { DatabaseSync } from "node:sqlite";

export function ensureLearningSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS chapter_exam_access (
      chapter_id TEXT PRIMARY KEY REFERENCES chapters(id),
      enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1)),
      updated_by TEXT NOT NULL REFERENCES users(id), updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS chapter_learning (
      chapter_id TEXT PRIMARY KEY REFERENCES chapters(id), semester TEXT NOT NULL DEFAULT '',
      accuracy_basis TEXT NOT NULL DEFAULT 'all' CHECK(accuracy_basis IN ('all','latest'))
    );
    CREATE TABLE IF NOT EXISTS review_blueprints (
      id TEXT PRIMARY KEY, classroom_id TEXT NOT NULL REFERENCES classrooms(id),
      title TEXT NOT NULL, chapter_ids TEXT NOT NULL, question_count INTEGER NOT NULL,
      weights TEXT NOT NULL, created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS review_sessions (
      id TEXT PRIMARY KEY, student_id TEXT NOT NULL REFERENCES users(id), classroom_id TEXT NOT NULL REFERENCES classrooms(id),
      title TEXT NOT NULL, questions TEXT NOT NULL, answers TEXT NOT NULL DEFAULT '{}',
      current_index INTEGER NOT NULL DEFAULT 0, completed INTEGER NOT NULL DEFAULT 0,
      request_id TEXT UNIQUE NOT NULL, created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS review_papers (
      blueprint_id TEXT PRIMARY KEY REFERENCES review_blueprints(id),
      teacher_id TEXT NOT NULL REFERENCES users(id),
      request_id TEXT UNIQUE NOT NULL, fingerprint TEXT NOT NULL,
      questions TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS review_paper_sessions (
      session_id TEXT PRIMARY KEY REFERENCES review_sessions(id),
      blueprint_id TEXT NOT NULL REFERENCES review_papers(blueprint_id)
    );
    CREATE TABLE IF NOT EXISTS learning_tickets (
      student_id TEXT NOT NULL REFERENCES users(id), chapter_id TEXT NOT NULL REFERENCES chapters(id),
      level INTEGER NOT NULL CHECK(level IN (3,4,5)), used_by TEXT UNIQUE, granted_at INTEGER NOT NULL,
      PRIMARY KEY(student_id,chapter_id,level)
    );
    CREATE TABLE IF NOT EXISTS learning_rewards (
      id TEXT PRIMARY KEY, student_id TEXT NOT NULL REFERENCES users(id), classroom_id TEXT NOT NULL REFERENCES classrooms(id),
      chapter_id TEXT REFERENCES chapters(id), source TEXT UNIQUE NOT NULL, label TEXT NOT NULL, points INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
      created_at INTEGER NOT NULL, reviewed_by TEXT REFERENCES users(id), reviewed_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS exam_definitions (
      id TEXT PRIMARY KEY, classroom_id TEXT NOT NULL REFERENCES classrooms(id), title TEXT NOT NULL,
      questions TEXT NOT NULL, starts_at INTEGER NOT NULL, closes_at INTEGER NOT NULL,
      tab_limit INTEGER NOT NULL, enabled INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS exam_runs (
      id TEXT PRIMARY KEY, student_id TEXT NOT NULL REFERENCES users(id), classroom_id TEXT NOT NULL REFERENCES classrooms(id),
      chapter_id TEXT REFERENCES chapters(id), exam_id TEXT REFERENCES exam_definitions(id), kind TEXT NOT NULL CHECK(kind IN ('hunt','official')),
      title TEXT NOT NULL, questions TEXT NOT NULL, answers TEXT NOT NULL DEFAULT '{}',
      started_at INTEGER NOT NULL, deadline_at INTEGER NOT NULL, tab_limit INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','submitted')),
      reason TEXT, score REAL, submitted_at INTEGER, request_id TEXT UNIQUE NOT NULL,
      revision INTEGER NOT NULL DEFAULT 0, released INTEGER NOT NULL DEFAULT 0,
      UNIQUE(student_id,exam_id)
    );
    CREATE TABLE IF NOT EXISTS exam_creation_requests (
      request_id TEXT PRIMARY KEY, classroom_id TEXT NOT NULL REFERENCES classrooms(id),
      teacher_id TEXT NOT NULL REFERENCES users(id), fingerprint TEXT NOT NULL,
      exam_id TEXT NOT NULL REFERENCES exam_definitions(id)
    );
    CREATE TABLE IF NOT EXISTS online_exam_sessions (
      exam_id TEXT PRIMARY KEY REFERENCES exam_definitions(id),
      duration_minutes INTEGER NOT NULL CHECK(duration_minutes BETWEEN 1 AND 180),
      preparation_minutes INTEGER NOT NULL DEFAULT 3 CHECK(preparation_minutes BETWEEN 0 AND 60),
      question_count INTEGER NOT NULL CHECK(question_count BETWEEN 1 AND 100),
      selection TEXT, started_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS exam_tab_events (
      run_id TEXT NOT NULL REFERENCES exam_runs(id), event_id TEXT NOT NULL,
      created_at INTEGER NOT NULL, PRIMARY KEY(run_id,event_id)
    );
    CREATE INDEX IF NOT EXISTS exam_expiry ON exam_runs(status,deadline_at);
    CREATE UNIQUE INDEX IF NOT EXISTS one_active_exam ON exam_runs(student_id) WHERE status='active';
    CREATE INDEX IF NOT EXISTS learning_reward_class ON learning_rewards(classroom_id,status);
  `);
  if (
    !db
      .prepare("PRAGMA table_info(online_exam_sessions)")
      .all()
      .some((column) => column.name === "scheduled_start_at")
  )
    db.exec(
      "ALTER TABLE online_exam_sessions ADD COLUMN scheduled_start_at INTEGER",
    );
  if (
    !db
      .prepare("PRAGMA table_info(online_exam_sessions)")
      .all()
      .some((c) => c.name === "progress_chapter_id")
  )
    db.exec(
      "ALTER TABLE online_exam_sessions ADD COLUMN progress_chapter_id TEXT REFERENCES chapters(id)",
    );
  db.exec(`CREATE TABLE IF NOT EXISTS exam_study_credit (
    run_id TEXT PRIMARY KEY, student_id TEXT NOT NULL REFERENCES users(id),
    chapter_id TEXT NOT NULL REFERENCES chapters(id), credited_ms INTEGER NOT NULL CHECK(credited_ms>=0)
  )`);
  const columns = new Set(
    db
      .prepare("PRAGMA table_info(exam_runs)")
      .all()
      .map((column) => column.name),
  );
  for (const name of ["revision", "released"]) {
    if (!columns.has(name))
      db.exec(
        `ALTER TABLE exam_runs ADD COLUMN ${name} INTEGER NOT NULL DEFAULT 0`,
      );
  }
  if (
    !db
      .prepare("PRAGMA table_info(online_exam_sessions)")
      .all()
      .some((column) => column.name === "preparation_minutes")
  )
    db.exec(
      "ALTER TABLE online_exam_sessions ADD COLUMN preparation_minutes INTEGER NOT NULL DEFAULT 3 CHECK(preparation_minutes BETWEEN 0 AND 60)",
    );
}
