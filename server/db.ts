import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { ensureLearningSchema } from "./learning-db.js";
import { ensureWelcomeSchema } from "./welcome-email.js";
import { ensureLessonSchema } from "./lesson-catalog.js";
import { ensureLevelSettingsSchema } from "./level-settings.js";
import { ensureFeedbackSchema } from "./feedback.js";
import { ensureGroupDiscussionSchema } from "./group-discussion.js";
import { ensureChapterArchiveSchema } from "./chapter-archive.js";
import { ensureChapterOrderSchema } from "./chapter-order.js";
import { ensureStudyHistorySchema } from "./study-history.js";
import { ensureClassManagementSchema } from "./class-management.js";
import { ensureWeeklyPracticeSchema } from "./weekly-practice.js";

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function openDatabase(path: string) {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
      password TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('admin','teacher','student')),
      must_change INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS classrooms (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, subject TEXT NOT NULL, grade TEXT NOT NULL,
      teacher_id TEXT NOT NULL REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS archived_classrooms (
      classroom_id TEXT PRIMARY KEY REFERENCES classrooms(id), deleted_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS memberships (
      classroom_id TEXT NOT NULL REFERENCES classrooms(id), student_id TEXT NOT NULL REFERENCES users(id),
      PRIMARY KEY(classroom_id, student_id)
    );
    CREATE TABLE IF NOT EXISTS chapters (
      id TEXT PRIMARY KEY, classroom_id TEXT NOT NULL REFERENCES classrooms(id), title TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY, chapter_id TEXT NOT NULL REFERENCES chapters(id), text TEXT NOT NULL,
      choices TEXT NOT NULL, correct_index INTEGER NOT NULL, explanation TEXT NOT NULL,
      lesson TEXT NOT NULL DEFAULT 'Bài luyện tập chung'
    );
    CREATE TABLE IF NOT EXISTS attempts (
      id TEXT PRIMARY KEY, student_id TEXT NOT NULL REFERENCES users(id), question_id TEXT NOT NULL REFERENCES questions(id),
      selected INTEGER NOT NULL, correct INTEGER NOT NULL, mode TEXT NOT NULL CHECK(mode IN ('practice','correction')),
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS corrections (
      student_id TEXT NOT NULL REFERENCES users(id), question_id TEXT NOT NULL REFERENCES questions(id),
      resolved INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL,
      PRIMARY KEY(student_id, question_id)
    );
    CREATE TABLE IF NOT EXISTS attempt_question_versions (
      attempt_id TEXT PRIMARY KEY REFERENCES attempts(id) ON DELETE CASCADE,
      source_question_id TEXT NOT NULL REFERENCES questions(id)
    );
    CREATE TABLE IF NOT EXISTS progress (
      student_id TEXT NOT NULL REFERENCES users(id), chapter_id TEXT NOT NULL REFERENCES chapters(id),
      seconds REAL NOT NULL DEFAULT 0, PRIMARY KEY(student_id, chapter_id)
    );
    CREATE TABLE IF NOT EXISTS study_sessions (
      id TEXT PRIMARY KEY, student_id TEXT UNIQUE NOT NULL REFERENCES users(id), chapter_id TEXT NOT NULL REFERENCES chapters(id),
      last_received INTEGER NOT NULL, last_activity INTEGER NOT NULL, active INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS attempts_student ON attempts(student_id, question_id);
    CREATE INDEX IF NOT EXISTS questions_chapter ON questions(chapter_id);
    CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
    CREATE TABLE IF NOT EXISTS group_activities (
      id TEXT PRIMARY KEY, classroom_id TEXT NOT NULL REFERENCES classrooms(id), title TEXT NOT NULL,
      instructions TEXT NOT NULL, requirement_text TEXT NOT NULL DEFAULT '',
      deadline_at INTEGER NOT NULL, created_at INTEGER NOT NULL, group_count INTEGER NOT NULL,
      request_id TEXT NOT NULL UNIQUE, fingerprint TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS activity_groups (
      id TEXT PRIMARY KEY, activity_id TEXT NOT NULL REFERENCES group_activities(id), number INTEGER NOT NULL,
      representative_id TEXT NOT NULL REFERENCES users(id), UNIQUE(activity_id,number), UNIQUE(id,activity_id)
    );
    CREATE TABLE IF NOT EXISTS activity_group_members (
      activity_id TEXT NOT NULL REFERENCES group_activities(id), group_id TEXT NOT NULL,
      student_id TEXT NOT NULL REFERENCES users(id), PRIMARY KEY(activity_id,student_id),
      FOREIGN KEY(group_id,activity_id) REFERENCES activity_groups(id,activity_id)
    );
    CREATE TABLE IF NOT EXISTS activity_files (
      id TEXT PRIMARY KEY, activity_id TEXT NOT NULL REFERENCES group_activities(id), group_id TEXT,
      kind TEXT NOT NULL CHECK(kind IN ('requirement','submission')), filename TEXT NOT NULL,
      mime TEXT NOT NULL, size INTEGER NOT NULL, data BLOB NOT NULL,
      uploaded_by TEXT NOT NULL REFERENCES users(id), created_at INTEGER NOT NULL,
      FOREIGN KEY(group_id,activity_id) REFERENCES activity_groups(id,activity_id),
      CHECK((kind = 'requirement' AND group_id IS NULL) OR (kind = 'submission' AND group_id IS NOT NULL))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS activity_requirement ON activity_files(activity_id) WHERE kind = 'requirement';
    CREATE TABLE IF NOT EXISTS group_submissions (
      id TEXT PRIMARY KEY, group_id TEXT NOT NULL REFERENCES activity_groups(id),
      submitted_by TEXT NOT NULL REFERENCES users(id), version INTEGER NOT NULL,
      link TEXT, file_id TEXT REFERENCES activity_files(id), note TEXT NOT NULL,
      created_at INTEGER NOT NULL, request_id TEXT NOT NULL UNIQUE, fingerprint TEXT NOT NULL,
      UNIQUE(group_id,version), CHECK((link IS NOT NULL AND file_id IS NULL) OR (link IS NULL AND file_id IS NOT NULL))
    );
    CREATE TABLE IF NOT EXISTS activity_deadline_history (
      id TEXT PRIMARY KEY, activity_id TEXT NOT NULL REFERENCES group_activities(id),
      old_deadline_at INTEGER NOT NULL, deadline_at INTEGER NOT NULL,
      changed_by TEXT NOT NULL REFERENCES users(id), changed_at INTEGER NOT NULL, reason TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS activities_classroom ON group_activities(classroom_id,created_at);
    CREATE INDEX IF NOT EXISTS activity_files_lookup ON activity_files(activity_id,group_id);
  `);
  // Rebuild only the role constraint, retaining IDs referenced by every other table.
  const usersSchema = String(
    db.prepare("SELECT sql FROM sqlite_schema WHERE name = 'users'").get()?.sql,
  );
  if (!usersSchema.includes("'admin'")) {
    db.exec("PRAGMA foreign_keys = OFF; BEGIN IMMEDIATE;");
    try {
      db.exec(`CREATE TABLE users_updated (
        id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
        password TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('admin','teacher','student')),
        must_change INTEGER NOT NULL DEFAULT 0
      );
      INSERT INTO users_updated SELECT id,email,name,password,role,must_change FROM users;
      DROP TABLE users;
      ALTER TABLE users_updated RENAME TO users;`);
      if (db.prepare("PRAGMA foreign_key_check").all().length)
        throw new Error(
          "Không thể cập nhật tài khoản: liên kết dữ liệu không hợp lệ.",
        );
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      db.close();
      throw error;
    }
    db.exec("PRAGMA foreign_keys = ON");
  }
  // Additive migration for the initial MVP database; keep answers and progress.
  db.exec(`CREATE TABLE IF NOT EXISTS user_avatars (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    avatar_id TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS avatar_uploads (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mime TEXT NOT NULL, data BLOB NOT NULL
  );`);
  // Reset student choices made before teacher avatars were restricted by role.
  db.exec(`DELETE FROM user_avatars WHERE avatar_id LIKE 'teacher-%'
    AND user_id IN (SELECT id FROM users WHERE role='student');`);
  if (
    !db
      .prepare("PRAGMA table_info(questions)")
      .all()
      .some((c) => c.name === "lesson")
  ) {
    db.exec(
      "ALTER TABLE questions ADD COLUMN lesson TEXT NOT NULL DEFAULT 'Bài luyện tập chung'",
    );
  }
  const questionColumns = new Set(
    db
      .prepare("PRAGMA table_info(questions)")
      .all()
      .map((c) => c.name),
  );
  for (const [name, definition] of [
    ["kind", "TEXT NOT NULL DEFAULT 'multiple-choice'"],
    ["correct_answer", "TEXT"],
    ["topic", "TEXT NOT NULL DEFAULT ''"],
    ["active", "INTEGER NOT NULL DEFAULT 1"],
    ["is_current", "INTEGER NOT NULL DEFAULT 1"],
    ["version", "INTEGER NOT NULL DEFAULT 1"],
    ["family_id", "TEXT"],
    ["changed_at", "INTEGER"],
  ]) {
    if (!questionColumns.has(name))
      db.exec(`ALTER TABLE questions ADD COLUMN ${name} ${definition}`);
  }
  db.exec(`CREATE INDEX IF NOT EXISTS questions_family ON questions(family_id);
    CREATE TABLE IF NOT EXISTS question_imports (
      id TEXT PRIMARY KEY, chapter_id TEXT NOT NULL REFERENCES chapters(id),
      teacher_id TEXT NOT NULL REFERENCES users(id), fingerprint TEXT NOT NULL,
      question_ids TEXT NOT NULL
    );`);
  ensureLearningSchema(db);
  ensureChapterArchiveSchema(db);
  ensureChapterOrderSchema(db);
  ensureStudyHistorySchema(db);
  ensureWeeklyPracticeSchema(db);
  ensureClassManagementSchema(db);
  ensureLevelSettingsSchema(db);
  ensureLessonSchema(db);
  ensureWelcomeSchema(db);
  ensureFeedbackSchema(db);
  ensureGroupDiscussionSchema(db);
  return db;
}

// Public demo credentials, enabled explicitly by SEED_DEMO=1. Never seed in production.
export function seedDemo(db: DatabaseSync) {
  if (db.prepare("SELECT id FROM users LIMIT 1").get()) return;
  const insertUser = db.prepare(
    "INSERT INTO users (id,email,name,password,role) VALUES (?,?,?,?,?)",
  );
  db.exec("BEGIN");
  try {
    insertUser.run(
      "teacher-demo",
      "giaovien@greenedu.nk",
      "Nguyễn Minh Anh",
      hashPassword("GreenEdu123!"),
      "teacher",
    );
    insertUser.run(
      "student-demo",
      "hocsinh@greenedu.nk",
      "Trần Hà Linh",
      hashPassword("GreenEdu123!"),
      "student",
    );
    insertUser.run(
      "student-2",
      "minhkhoi@greenedu.nk",
      "Lê Minh Khôi",
      hashPassword("GreenEdu123!"),
      "student",
    );
    insertUser.run(
      "student-3",
      "baongan@greenedu.nk",
      "Phạm Bảo Ngân",
      hashPassword("GreenEdu123!"),
      "student",
    );
    db.prepare("INSERT INTO classrooms VALUES (?,?,?,?,?)").run(
      "class-demo",
      "Lớp 10A1",
      "Vật lý",
      "10",
      "teacher-demo",
    );
    for (const student of ["student-demo", "student-2", "student-3"])
      db.prepare("INSERT INTO memberships VALUES (?,?)").run(
        "class-demo",
        student,
      );
    const chapters = [
      ["chapter-1", "Chương 1 · Mở đầu"],
      ["chapter-2", "Chương 2 · Động học"],
      ["chapter-3", "Chương 3 · Động lực học"],
    ];
    for (const [id, title] of chapters)
      db.prepare("INSERT INTO chapters VALUES (?,?,?)").run(
        id,
        "class-demo",
        title,
      );
    const questions: [string, string, string[], number, string][] = [
      [
        "chapter-1",
        "Đơn vị đo độ dài trong hệ đơn vị SI là gì?",
        ["Mét (m)", "Centimét (cm)", "Kilômét (km)", "Milimét (mm)"],
        0,
        "Mét (m) là đơn vị cơ bản của độ dài trong hệ SI. Các đơn vị còn lại là bội hoặc ước của mét.",
      ],
      [
        "chapter-1",
        "Dụng cụ nào phù hợp nhất để đo thời gian một vật rơi?",
        ["Thước kẻ", "Cân điện tử", "Đồng hồ bấm giây", "Nhiệt kế"],
        2,
        "Đồng hồ bấm giây đo khoảng thời gian giữa hai sự kiện. Thước đo độ dài, cân đo khối lượng và nhiệt kế đo nhiệt độ.",
      ],
      [
        "chapter-1",
        "Khi đo nhiều lần cùng một đại lượng, nên dùng giá trị nào làm kết quả?",
        [
          "Giá trị lớn nhất",
          "Giá trị nhỏ nhất",
          "Giá trị đầu tiên",
          "Giá trị trung bình",
        ],
        3,
        "Giá trị trung bình của các lần đo giúp giảm ảnh hưởng của sai số ngẫu nhiên.",
      ],
      [
        "chapter-2",
        "Một xe đi được 120 km trong 2 giờ. Tốc độ trung bình của xe bằng bao nhiêu?",
        ["30 km/h", "60 km/h", "120 km/h", "240 km/h"],
        1,
        "Tốc độ trung bình = quãng đường / thời gian = 120 / 2 = 60 km/h.",
      ],
      [
        "chapter-2",
        "Đại lượng nào biểu thị sự thay đổi vận tốc theo thời gian?",
        ["Quãng đường", "Khối lượng", "Gia tốc", "Năng lượng"],
        2,
        "Gia tốc đặc trưng cho sự thay đổi vận tốc theo thời gian: a = Δv / Δt.",
      ],
      [
        "chapter-2",
        "Trong chuyển động thẳng đều, vận tốc của vật có đặc điểm gì?",
        ["Tăng đều", "Giảm đều", "Luôn bằng không", "Không đổi"],
        3,
        "Chuyển động thẳng đều là chuyển động có vận tốc không đổi cả về hướng và độ lớn.",
      ],
      [
        "chapter-3",
        "Theo định luật II Newton, công thức liên hệ lực, khối lượng và gia tốc là gì?",
        ["F = m / a", "F = m × a", "F = a / m", "F = m + a"],
        1,
        "Hợp lực tác dụng lên vật bằng tích khối lượng và gia tốc: F = m × a.",
      ],
      [
        "chapter-3",
        "Vật có khối lượng 2 kg chịu hợp lực 6 N. Gia tốc bằng bao nhiêu?",
        ["12 m/s²", "4 m/s²", "3 m/s²", "0,33 m/s²"],
        2,
        "Áp dụng a = F / m = 6 / 2 = 3 m/s².",
      ],
      [
        "chapter-3",
        "Lực và phản lực trong định luật III Newton tác dụng lên đâu?",
        [
          "Cùng một vật",
          "Hai vật khác nhau",
          "Chỉ vật đứng yên",
          "Chỉ vật chuyển động",
        ],
        1,
        "Lực và phản lực có cùng độ lớn, ngược hướng và tác dụng lên hai vật khác nhau, nên không triệt tiêu nhau trên một vật.",
      ],
    ];
    questions.forEach(([chapter, text, choices, correct, explanation], i) => {
      db.prepare(
        "INSERT INTO questions (id,chapter_id,text,choices,correct_index,explanation) VALUES (?,?,?,?,?,?)",
      ).run(
        `question-${i + 1}`,
        chapter,
        text,
        JSON.stringify(choices),
        correct,
        explanation,
      );
    });
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
