import { randomUUID } from "node:crypto";
import { hashPassword, openDatabase } from "./db.js";

const email = process.env.TEACHER_EMAIL?.trim().toLowerCase();
const name = process.env.TEACHER_NAME?.trim();
const password = process.env.TEACHER_PASSWORD;
if (
  !email ||
  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
  !name ||
  !password ||
  password.length < 8 ||
  password.length > 128
) {
  console.error(
    "Cần TEACHER_EMAIL, TEACHER_NAME và TEACHER_PASSWORD (8–128 ký tự). Không truyền mật khẩu bằng đối số dòng lệnh.",
  );
  process.exit(1);
}
const db = openDatabase(process.env.DATABASE_PATH ?? ".local/greenedu.sqlite");
try {
  if (db.prepare("SELECT id FROM users WHERE email = ?").get(email))
    throw new Error("Email đã tồn tại. Không ghi đè tài khoản.");
  db.prepare("INSERT INTO users VALUES (?,?,?,?,?,0)").run(
    randomUUID(),
    email,
    name,
    hashPassword(password),
    "teacher",
  );
  console.log("Đã tạo tài khoản giáo viên.");
} finally {
  db.close();
}
