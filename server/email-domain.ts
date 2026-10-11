import type { DatabaseSync } from "node:sqlite";
import { LOGIN_EMAIL_DOMAIN } from "../shared/login-email.js";

export function loginDomainPlan(db: DatabaseSync) {
  const users = db.prepare("SELECT id,email FROM users ORDER BY rowid").all();
  const plan = users.map((user) => {
    const oldEmail = String(user.email);
    if (!/^[^\s@]+@[^\s@]+$/.test(oldEmail))
      throw new Error("Có email không hợp lệ; chưa đổi dữ liệu.");
    const email = `${oldEmail.split("@")[0].toLowerCase()}@${LOGIN_EMAIL_DOMAIN}`;
    if (email.length > 254) throw new Error("Email mới vượt quá 254 ký tự.");
    return { userId: String(user.id), oldEmail, email };
  });
  if (new Set(plan.map((p) => p.email)).size !== plan.length)
    throw new Error(
      "Tên tài khoản bị trùng sau khi đổi tên miền; không tự gộp tài khoản.",
    );
  return plan;
}

// Explicit maintenance operation only; never run automatically at startup.
export function changeLoginDomain(db: DatabaseSync) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const plan = loginDomainPlan(db);
    let changed = 0;
    for (const user of plan) {
      if (user.oldEmail === user.email) continue;
      db.prepare("UPDATE users SET email=? WHERE id=?").run(
        user.email,
        user.userId,
      );
      changed++;
    }
    db.exec("COMMIT");
    return { domain: LOGIN_EMAIL_DOMAIN, total: plan.length, changed };
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
