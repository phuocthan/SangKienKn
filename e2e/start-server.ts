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
// Separate level-icon fixtures: five chapters across subjects, never live data.
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
  db.prepare("INSERT INTO chapters VALUES (?,?,?)").run(
    `${classId}-untouched`,
    classId,
    "Chương 2 chưa học",
  );
}
// Student garden fixtures: chapter maxima, never aggregate levels or production data.
db.prepare(
  "INSERT INTO classrooms VALUES('garden-class','Lớp vườn','Vật lý','11','teacher-demo')",
).run();
for (const id of ["garden-ch1", "garden-ch2"])
  db.prepare("INSERT INTO chapters VALUES(?,'garden-class',?)").run(id, id);
const gardenPassword = hashPassword("GardenTest123!");
for (const [level, name] of [
  [5, "Trần Hoàng Nhã Linh"],
  [4, "Nguyễn Thị Nhã Linh"],
  [3, "Huỳnh Văn Long Vũ"],
  [2, "Trần Duy Quốc Huy"],
  [1, "An"],
] as const) {
  const id = `garden-student-${level}`;
  db.prepare("INSERT INTO users VALUES(?,?,?,?,?,0)").run(
    id,
    `${id}@greenedu.test`,
    name,
    gardenPassword,
    "student",
  );
  db.prepare("INSERT INTO memberships VALUES('garden-class',?)").run(id);
  db.prepare("INSERT INTO progress VALUES(?,'garden-ch1',?)").run(
    id,
    (level - 1) * 3600,
  );
  if (level > 1)
    db.prepare("INSERT INTO user_avatars(user_id,avatar_id) VALUES(?,?)").run(
      id,
      `student-${level}`,
    );
}
db.prepare(
  "INSERT INTO progress VALUES('garden-student-3','garden-ch2',7200)",
).run();
db.prepare(
  "INSERT INTO classrooms VALUES('garden-other-class','Lớp khác','Toán','11','teacher-demo')",
).run();
db.prepare(
  "INSERT INTO chapters VALUES('garden-other-ch','garden-other-class','Chương khác')",
).run();
db.prepare(
  "INSERT INTO memberships VALUES('garden-other-class','garden-student-3')",
).run();
db.prepare(
  "INSERT INTO progress VALUES('garden-student-3','garden-other-ch',86400)",
).run();
db.close();
await import("../server/index.js");
