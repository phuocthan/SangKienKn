import { randomUUID } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { hashPassword, openDatabase } from "./db.js";
import { readHiddenPassword } from "./cli-input.js";

const validEmail = (value: string) =>
  value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const validPassword = (value: string) =>
  value.length >= 8 && value.length <= 128;

async function main() {
  let email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  let name = process.env.ADMIN_NAME?.trim();
  let password = process.env.ADMIN_PASSWORD;
  if (!email || !name || !password) {
    if (!process.stdin.isTTY || !process.stdout.isTTY)
      throw new Error(
        "Chạy npm run create:admin trực tiếp trong terminal để nhập thông tin, hoặc khai báo ADMIN_EMAIL, ADMIN_NAME và ADMIN_PASSWORD (8–128 ký tự) khi chạy tự động.",
      );
    console.log("Tạo tài khoản Admin · Ctrl+C để hủy.");
    const terminal = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    try {
      while (!email || !validEmail(email)) {
        email = (await terminal.question("Email Admin: ")).trim().toLowerCase();
        if (!validEmail(email))
          console.log("Nhập email hợp lệ, tối đa 254 ký tự.");
      }
      while (!name || name.length > 100) {
        name = (await terminal.question("Họ tên Admin: ")).trim();
        if (!name || name.length > 100)
          console.log("Họ tên cần từ 1 đến 100 ký tự.");
      }
    } finally {
      terminal.close();
    }
    if (!password) {
      for (;;) {
        const next = await readHiddenPassword("Mật khẩu tạm (8–128 ký tự): ");
        if (!validPassword(next)) {
          console.log("Mật khẩu phải có từ 8 đến 128 ký tự.");
          continue;
        }
        const confirm = await readHiddenPassword("Nhập lại mật khẩu tạm: ");
        if (next !== confirm) {
          console.log("Hai mật khẩu chưa khớp. Hãy nhập lại.");
          continue;
        }
        password = next;
        break;
      }
    }
  }
  if (
    !email ||
    !validEmail(email) ||
    !name ||
    name.length > 100 ||
    !password ||
    !validPassword(password)
  )
    throw new Error(
      "Thông tin Admin không hợp lệ: email tối đa 254 ký tự, họ tên 1–100 ký tự, mật khẩu 8–128 ký tự.",
    );
  const path = process.env.DATABASE_PATH ?? ".local/greenedu.sqlite";
  const db = openDatabase(path);
  try {
    if (db.prepare("SELECT id FROM users WHERE email = ?").get(email))
      throw new Error("Email đã tồn tại. Không ghi đè tài khoản.");
    db.prepare("INSERT INTO users VALUES (?,?,?,?,?,1)").run(
      randomUUID(),
      email,
      name,
      hashPassword(password),
      "admin",
    );
    console.log(
      `Đã tạo Admin: ${email}. Đổi mật khẩu ở lần đăng nhập đầu tiên.`,
    );
    console.log(`Database: ${path}`);
  } finally {
    db.close();
  }
}
await main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Không tạo được Admin.",
  );
  process.exitCode = 1;
});
