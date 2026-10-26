import { randomUUID } from "node:crypto";
import { openDatabase, hashPassword } from "./db.js";
import { loginEmail } from "../shared/login-email.js";

const login = process.env.VIEWER_LOGIN?.trim();
const ownerEmail = process.env.VIEWER_OWNER?.trim().toLowerCase();
const name = process.env.VIEWER_NAME?.trim();
const password = process.env.VIEWER_PASSWORD;
if (
  !login ||
  !ownerEmail ||
  !name ||
  !password ||
  password.length < 8 ||
  password.length > 128
)
  throw new Error(
    "Cần VIEWER_LOGIN, VIEWER_OWNER, VIEWER_NAME và VIEWER_PASSWORD (8–128 ký tự). Không truyền mật khẩu bằng đối số.",
  );
const db = openDatabase(process.env.DATABASE_PATH ?? ".local/greenedu.sqlite");
try {
  const owner = db
    .prepare("SELECT id FROM users WHERE email=? AND role='teacher'")
    .get(ownerEmail);
  if (!owner) throw new Error("Không tìm thấy giáo viên sở hữu dữ liệu.");
  const email = loginEmail(login).toLowerCase();
  if (db.prepare("SELECT 1 FROM users WHERE email=?").get(email))
    throw new Error("Tên đăng nhập đã tồn tại; không ghi đè tài khoản.");
  db.exec("BEGIN IMMEDIATE");
  try {
    const id = randomUUID();
    // Fail closed on older servers: no teacher rights or memberships until
    // the server understands this explicit read-only teacher mapping.
    db.prepare("INSERT INTO users VALUES(?,?,?,?, 'student',0)").run(
      id,
      email,
      name,
      hashPassword(password),
    );
    db.prepare("INSERT INTO teacher_viewers VALUES(?,?)").run(id, owner.id);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
  console.log("Đã tạo tài khoản giáo viên chỉ xem.");
} finally {
  db.close();
}
