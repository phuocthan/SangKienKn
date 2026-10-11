// Dedicated browser-test database. Never bootstrap accounts in the live database.
import { hashPassword, openDatabase, seedDemo } from "../server/db.js";
if (!process.env.DATABASE_PATH?.startsWith(".local/e2e-"))
  throw new Error("Browser tests require a dedicated e2e database.");
const db = openDatabase(process.env.DATABASE_PATH);
seedDemo(db);
db.prepare("INSERT INTO users VALUES (?,?,?,?,?,0)").run(
  "admin-e2e",
  "admin@greenedu.test",
  "Admin kiểm thử",
  hashPassword("AdminTest123!"),
  "admin",
);
// Learning scenarios have their own student/class so existing workflows stay independent.
db.prepare("INSERT INTO users VALUES (?,?,?,?,?,0)").run(
  "learning-student",
  "learning@greenedu.test",
  "Học sinh ôn thi",
  hashPassword("LearningTest123!"),
  "student",
);
db.prepare(
  "INSERT INTO classrooms VALUES ('learning-class','Lớp ôn thi','Vật lý','10','teacher-demo')",
).run();
db.prepare(
  "INSERT INTO memberships VALUES ('learning-class','learning-student')",
).run();
for (const [id, title] of [
  ["learning-ch1", "Chương ôn I"],
  ["learning-ch2", "Chương ôn II"],
]) {
  db.prepare("INSERT INTO chapters VALUES (?,'learning-class',?)").run(
    id,
    title,
  );
  db.prepare("INSERT INTO chapter_learning VALUES (?,'Học kỳ I','all')").run(
    id,
  );
  for (let i = 1; i <= 4; i++)
    db.prepare(
      "INSERT INTO questions(id,chapter_id,text,choices,correct_index,explanation,lesson) VALUES (?,?,?,?,0,?,?)",
    ).run(
      `${id}-q${i}`,
      id,
      `Câu hỏi ${title} số ${i}`,
      JSON.stringify(["Đúng", "Sai B", "Sai C", "Sai D"]),
      "Phương án A là đáp án đúng trong dữ liệu kiểm thử.",
      i <= 2 ? "Bài 1" : "Bài 2",
    );
}
db.prepare(
  "INSERT INTO progress VALUES('learning-student','learning-ch1',14400)",
).run();
db.prepare(
  "INSERT INTO attempts VALUES('learning-seed','learning-student','learning-ch1-q1',0,1,'practice',0)",
).run();
// Separate level-icon fixtures: five classroom/subject totals, never live data.
db.prepare("INSERT INTO users VALUES (?,?,?,?,?,0)").run(
  "levels-student",
  "levels@greenedu.test",
  "Học sinh cấp độ",
  hashPassword("LevelsTest123!"),
  "student",
);
for (const [index, subject] of [
  "Sinh học",
  "Toán",
  "Vật lý",
  "Hóa học",
  "Ngữ văn",
].entries()) {
  const classId = `levels-class-${index + 1}`;
  const chapterId = `${classId}-chapter`;
  db.prepare("INSERT INTO classrooms VALUES (?,?,?,?,?)").run(
    classId,
    "Lớp 10A2",
    subject,
    "10",
    "teacher-demo",
  );
  db.prepare("INSERT INTO memberships VALUES (?,?)").run(
    classId,
    "levels-student",
  );
  db.prepare("INSERT INTO chapters VALUES (?,?,?)").run(
    chapterId,
    classId,
    "Chương 1",
  );
  db.prepare("INSERT INTO progress VALUES (?,?,?)").run(
    "levels-student",
    chapterId,
    index * 3600,
  );
}
db.close();
await import("../server/index.js");
