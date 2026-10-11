import type { DatabaseSync } from "node:sqlite";

export type WelcomeRole = "teacher" | "student";
export type WelcomeConfig = {
  serviceId: string;
  templateId: string;
  publicKey: string;
  privateKey?: string;
  appUrl: string;
};

export function readWelcomeConfig(
  env: NodeJS.ProcessEnv = process.env,
): WelcomeConfig | null {
  if (env.WELCOME_EMAIL_ENABLED !== "1") return null;
  const required = [
    "EMAILJS_SERVICE_ID",
    "EMAILJS_TEMPLATE_ID",
    "EMAILJS_PUBLIC_KEY",
  ] as const;
  for (const field of required) {
    if (!env[field]?.trim()) throw new Error(`Email chào mừng cần ${field}.`);
  }
  const url = new URL(env.APP_PUBLIC_URL ?? "https://greenedu.up.railway.app/");
  if (url.protocol !== "https:" || url.username || url.password)
    throw new Error(
      "APP_PUBLIC_URL cần URL HTTPS công khai, không chứa thông tin đăng nhập.",
    );
  return {
    serviceId: env.EMAILJS_SERVICE_ID!.trim(),
    templateId: env.EMAILJS_TEMPLATE_ID!.trim(),
    publicKey: env.EMAILJS_PUBLIC_KEY!.trim(),
    privateKey: env.EMAILJS_PRIVATE_KEY?.trim() || undefined,
    appUrl: url.href,
  };
}

export function welcomeMessage(
  name: string,
  role: WelcomeRole,
  appUrl: string,
) {
  const greeting =
    role === "teacher" ? `Xin chào Thầy/Cô ${name},` : `Xin chào ${name},`;
  const introduction =
    role === "teacher"
      ? "Với tài khoản giáo viên, Thầy/Cô có thể tạo lớp, thêm học sinh, quản lý câu hỏi, tổ chức hoạt động nhóm và theo dõi tiến độ học tập."
      : "Với tài khoản học sinh, bạn có thể luyện tập, sửa sai, ôn tập, làm bài kiểm tra và tham gia hoạt động nhóm trong lớp của mình.";
  return {
    subject: "GreenEdu — Tài khoản của bạn đã được tạo thành công",
    message: `${greeting}\n\nTài khoản ${role === "teacher" ? "giáo viên" : "học sinh"} của bạn trên GreenEdu đã được tạo thành công.\n\n${introduction}\n\nĐăng nhập tại: ${appUrl}\nSử dụng mật khẩu tạm do Admin hoặc giáo viên cung cấp và đổi mật khẩu ở lần đăng nhập đầu tiên.\n\nChào mừng bạn đến với GreenEdu!`,
  };
}

export function ensureWelcomeSchema(db: DatabaseSync) {
  db.exec(`CREATE TABLE IF NOT EXISTS welcome_emails (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK(status IN ('pending','sending','sent','failed','uncertain')) DEFAULT 'pending',
    created_at INTEGER NOT NULL, sent_at INTEGER, last_error TEXT
  );`);
}

// Called inside the same transaction as creating the account. No passwords stored.
export function enqueueWelcome(
  db: DatabaseSync,
  userId: string,
  createdAt: number,
) {
  db.prepare(
    "INSERT OR IGNORE INTO welcome_emails (user_id,created_at) VALUES (?,?)",
  ).run(userId, createdAt);
}

type Delivery = { ok: true } | { ok: false; status: number | null };
export async function sendWelcome(
  config: WelcomeConfig,
  user: { name: string; email: string; role: WelcomeRole },
  request: typeof fetch = fetch,
): Promise<Delivery> {
  const content = welcomeMessage(user.name, user.role, config.appUrl);
  try {
    const response = await request(
      "https://api.emailjs.com/api/v1.0/email/send",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({
          service_id: config.serviceId,
          template_id: config.templateId,
          user_id: config.publicKey,
          ...(config.privateKey ? { accessToken: config.privateKey } : {}),
          template_params: {
            to_email: user.email,
            to_name: user.name,
            subject: content.subject,
            message: content.message,
            app_url: config.appUrl,
          },
        }),
      },
    );
    // Do not store the provider body: it may contain identifiers or credentials.
    return response.ok ? { ok: true } : { ok: false, status: response.status };
  } catch {
    // Network failure is ambiguous: provider may already have sent the message.
    return { ok: false, status: null };
  }
}

export function welcomeWorker(
  db: DatabaseSync,
  config: WelcomeConfig,
  request: typeof fetch = fetch,
  now: () => number = Date.now,
) {
  let active: Promise<boolean> | null = null;
  let stopped = false;
  let nextAttemptAt = 0;
  async function deliverOne() {
    const row = db
      .prepare(
        `SELECT u.id,u.name,u.email,u.role FROM welcome_emails w JOIN users u ON u.id=w.user_id
      WHERE w.status='pending' AND u.role IN ('teacher','student') ORDER BY w.created_at,w.user_id LIMIT 1`,
      )
      .get();
    if (!row) return false;
    const claim = db
      .prepare(
        "UPDATE welcome_emails SET status='sending' WHERE user_id=? AND status='pending'",
      )
      .run(row.id);
    if (!claim.changes) return false;
    nextAttemptAt = now() + 2000;
    const result = await sendWelcome(
      config,
      {
        name: String(row.name),
        email: String(row.email),
        role: row.role as WelcomeRole,
      },
      request,
    );
    if (result.ok)
      db.prepare(
        "UPDATE welcome_emails SET status='sent',sent_at=?,last_error=NULL WHERE user_id=?",
      ).run(now(), row.id);
    else
      db.prepare(
        "UPDATE welcome_emails SET status=?,last_error=? WHERE user_id=?",
      ).run(
        result.status === null ? "uncertain" : "failed",
        result.status === null
          ? "Không xác định kết quả gửi; cần kiểm tra lịch sử EmailJS."
          : `EmailJS HTTP ${result.status}`,
        row.id,
      );
    return true;
  }
  return {
    tick(): Promise<boolean> {
      if (stopped || active || now() < nextAttemptAt)
        return Promise.resolve(false);
      active = deliverOne().finally(() => {
        active = null;
      });
      return active;
    },
    async stop() {
      stopped = true;
      await active;
    },
  };
}
