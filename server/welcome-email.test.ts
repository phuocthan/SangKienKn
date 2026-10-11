import test, { type TestContext } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { openDatabase, hashPassword, seedDemo } from "./db.js";
import { createApp } from "./app.js";
import {
  enqueueWelcome,
  readWelcomeConfig,
  sendWelcome,
  welcomeMessage,
  welcomeWorker,
  type WelcomeConfig,
} from "./welcome-email.js";

const config: WelcomeConfig = {
  serviceId: "service-test",
  templateId: "template-test",
  publicKey: "public-test",
  privateKey: "private-test",
  appUrl: "https://greenedu.up.railway.app/",
};
const insertUser = (
  db: ReturnType<typeof openDatabase>,
  id: string,
  role = "student",
) =>
  db
    .prepare("INSERT INTO users VALUES (?,?,?,?,?,1)")
    .run(
      id,
      `${id}@example.test`,
      "Nguyễn An",
      hashPassword("TempPassword123!"),
      role,
    );
const stub = (
  handler: (url: string, init: RequestInit) => Promise<Response> | Response,
) => (async (url, init) => handler(String(url), init!)) as typeof fetch;

test("welcome mail is opt-in; config rejects missing fields and insecure public links", () => {
  assert.equal(readWelcomeConfig({}), null);
  assert.equal(
    readWelcomeConfig({
      WELCOME_EMAIL_ENABLED: "0",
      EMAILJS_PUBLIC_KEY: "unused",
    }),
    null,
  );
  assert.throws(
    () => readWelcomeConfig({ WELCOME_EMAIL_ENABLED: "1" }),
    /EMAILJS_SERVICE_ID/,
  );
  const env = {
    WELCOME_EMAIL_ENABLED: "1",
    EMAILJS_SERVICE_ID: "s",
    EMAILJS_TEMPLATE_ID: "t",
    EMAILJS_PUBLIC_KEY: "p",
  };
  assert.equal(readWelcomeConfig(env)?.appUrl, config.appUrl);
  assert.throws(
    () =>
      readWelcomeConfig({ ...env, APP_PUBLIC_URL: "http://localhost:5173" }),
    /HTTPS/,
  );
  assert.throws(
    () =>
      readWelcomeConfig({
        ...env,
        APP_PUBLIC_URL: "https://user:secret@example.test",
      }),
    /HTTPS/,
  );
});

test("teacher and student receive short confirmations with the correct role introduction", () => {
  const teacher = welcomeMessage("Nguyễn An", "teacher", config.appUrl);
  const student = welcomeMessage("Nguyễn An", "student", config.appUrl);
  assert.match(teacher.message, /Xin chào Thầy\/Cô Nguyễn An/);
  assert.match(teacher.message, /tạo lớp, thêm học sinh/);
  assert.match(student.message, /luyện tập, sửa sai, ôn tập/);
  for (const content of [teacher, student]) {
    assert.match(content.subject, /đã được tạo thành công/);
    assert.ok(content.message.includes(config.appUrl));
    assert.match(content.message, /đổi mật khẩu ở lần đăng nhập đầu tiên/);
    assert.equal(content.message.includes("TempPassword123!"), false);
  }
});

async function fixture(t: TestContext, enabled = true) {
  const db = openDatabase(":memory:");
  seedDemo(db);
  db.prepare("INSERT INTO users VALUES (?,?,?,?,?,0)").run(
    "admin-mail",
    "admin@example.test",
    "Admin",
    hashPassword("AdminPassword123!"),
    "admin",
  );
  const server = createApp(db, { welcomeEmail: enabled }).listen(
    0,
    "127.0.0.1",
  );
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}/api`;
  t.after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    db.close();
  });
  async function post(path: string, body: unknown, cookie = "") {
    const response = await fetch(base + path, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify(body),
    });
    return {
      status: response.status,
      data: await response.json(),
      cookie: response.headers.get("set-cookie")?.split(";")[0] ?? "",
    };
  }
  const admin = (
    await post("/auth/login", {
      email: "admin@example.test",
      password: "AdminPassword123!",
    })
  ).cookie;
  const teacher = (
    await post("/auth/login", {
      email: "giaovien@greenedu.nk",
      password: "GreenEdu123!",
    })
  ).cookie;
  const classroom = String(
    db.prepare("SELECT id FROM classrooms LIMIT 1").get()!.id,
  );
  return { db, post, admin, teacher, classroom };
}

test("only newly created accounts queue mail; duplicate, invalid and existing membership operations do not", async (t) => {
  const f = await fixture(t);
  for (const role of ["teacher", "student"]) {
    const body = {
      name: "Nguyễn An",
      email: `${role}@example.test`,
      password: "TempPassword123!",
      role,
    };
    assert.equal((await f.post("/accounts", body, f.admin)).status, 201);
    assert.equal((await f.post("/accounts", body, f.admin)).status, 409);
  }
  assert.equal(
    (
      await f.post(
        `/classrooms/${f.classroom}/students`,
        {
          name: "Học sinh mới",
          email: "new@example.test",
          password: "TempPassword123!",
        },
        f.teacher,
      )
    ).status,
    201,
  );
  assert.equal(
    (
      await f.post(
        `/classrooms/${f.classroom}/memberships`,
        { email: "student@example.test" },
        f.teacher,
      )
    ).status,
    201,
  );
  assert.equal(
    (
      await f.post(
        "/accounts",
        {
          name: "",
          email: "invalid@example.test",
          password: "TempPassword123!",
          role: "student",
        },
        f.admin,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await f.post(
        "/accounts",
        {
          name: "An",
          email: "wrong-class@example.test",
          password: "TempPassword123!",
          role: "student",
          classroomId: "missing",
        },
        f.admin,
      )
    ).status,
    400,
  );
  assert.equal(
    f.db.prepare("SELECT COUNT(*) AS n FROM welcome_emails").get()!.n,
    3,
  );
  assert.equal(f.db.prepare("PRAGMA foreign_key_check").all().length, 0);
});

test("disabled mail never affects account creation and does not backfill old accounts", async (t) => {
  const f = await fixture(t, false);
  assert.equal(
    (
      await f.post(
        "/accounts",
        {
          name: "An",
          email: "disabled@example.test",
          password: "TempPassword123!",
          role: "student",
        },
        f.admin,
      )
    ).status,
    201,
  );
  assert.equal(
    f.db.prepare("SELECT COUNT(*) AS n FROM welcome_emails").get()!.n,
    0,
  );
});

test("queue is unique per account and rolls back with the account transaction", (t) => {
  const db = openDatabase(":memory:");
  t.after(() => db.close());
  db.exec("BEGIN");
  insertUser(db, "rollback");
  enqueueWelcome(db, "rollback", 100);
  db.exec("ROLLBACK");
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM users").get()!.n, 0);
  assert.equal(
    db.prepare("SELECT COUNT(*) AS n FROM welcome_emails").get()!.n,
    0,
  );
  insertUser(db, "unique");
  enqueueWelcome(db, "unique", 100);
  enqueueWelcome(db, "unique", 200);
  assert.equal(
    db.prepare("SELECT COUNT(*) AS n FROM welcome_emails").get()!.n,
    1,
  );
});

test("REST payload uses the server template, never includes passwords, and sanitizes failures", async () => {
  let payload: any;
  assert.deepEqual(
    await sendWelcome(
      config,
      { name: "An", email: "an@example.test", role: "student" },
      stub((url, init) => {
        assert.equal(url, "https://api.emailjs.com/api/v1.0/email/send");
        payload = JSON.parse(String(init.body));
        assert.equal(init.method, "POST");
        return new Response("OK");
      }),
    ),
    { ok: true },
  );
  assert.equal(payload.template_params.to_email, "an@example.test");
  assert.equal(payload.template_id, config.templateId);
  assert.equal(payload.accessToken, config.privateKey);
  assert.equal(JSON.stringify(payload).includes("TempPassword123!"), false);
  assert.deepEqual(
    await sendWelcome(
      config,
      { name: "An", email: "an@example.test", role: "teacher" },
      stub(() => new Response("secret provider error", { status: 429 })),
    ),
    { ok: false, status: 429 },
  );
});

test("worker claims one message, limits rate and never resends sent or in-flight jobs", async (t) => {
  const db = openDatabase(":memory:");
  t.after(() => db.close());
  insertUser(db, "a");
  insertUser(db, "b");
  enqueueWelcome(db, "a", 1);
  enqueueWelcome(db, "b", 2);
  let currentTime = 10000,
    calls = 0;
  let resolveSend!: (response: Response) => void;
  const worker = welcomeWorker(
    db,
    config,
    stub(() => {
      calls++;
      return new Promise((resolve) => {
        resolveSend = resolve;
      });
    }),
    () => currentTime,
  );
  const first = worker.tick();
  assert.equal(await worker.tick(), false);
  assert.equal(
    db.prepare("SELECT status FROM welcome_emails WHERE user_id='a'").get()!
      .status,
    "sending",
  );
  resolveSend(new Response("OK"));
  assert.equal(await first, true);
  assert.equal(await worker.tick(), false);
  currentTime += 2000;
  const second = worker.tick();
  resolveSend(new Response("OK"));
  await second;
  currentTime += 2000;
  assert.equal(await worker.tick(), false);
  assert.equal(calls, 2);
  assert.equal(
    db
      .prepare("SELECT COUNT(*) AS n FROM welcome_emails WHERE status='sent'")
      .get()!.n,
    2,
  );
  await worker.stop();
  assert.equal(await worker.tick(), false);
});

test("delivery failure keeps the account, hides provider secrets and does not automatically retry ambiguous sends", async (t) => {
  const db = openDatabase(":memory:");
  t.after(() => db.close());
  insertUser(db, "failed");
  insertUser(db, "network");
  enqueueWelcome(db, "failed", 1);
  enqueueWelcome(db, "network", 2);
  let currentTime = 10000,
    calls = 0;
  const worker = welcomeWorker(
    db,
    config,
    stub(() => {
      calls++;
      if (calls === 1)
        return new Response("private-test: sensitive", { status: 400 });
      throw new Error("private-test");
    }),
    () => currentTime,
  );
  await worker.tick();
  currentTime += 2000;
  await worker.tick();
  currentTime += 2000;
  assert.equal(await worker.tick(), false);
  const rows = db
    .prepare("SELECT status,last_error FROM welcome_emails ORDER BY created_at")
    .all();
  assert.deepEqual(
    rows.map((r) => r.status),
    ["failed", "uncertain"],
  );
  assert.equal(JSON.stringify(rows).includes("private-test"), false);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM users").get()!.n, 2);
  await worker.stop();
});

test("queue migration preserves existing accounts and pending/sending/sent state through reopen", async () => {
  const path = `.local/welcome-test-${randomUUID()}.sqlite`;
  let db = openDatabase(path);
  insertUser(db, "pending");
  insertUser(db, "sending");
  insertUser(db, "sent");
  for (const id of ["pending", "sending", "sent"]) enqueueWelcome(db, id, 1);
  db.prepare(
    "UPDATE welcome_emails SET status='sending' WHERE user_id='sending'",
  ).run();
  db.prepare(
    "UPDATE welcome_emails SET status='sent' WHERE user_id='sent'",
  ).run();
  db.close();
  db = openDatabase(path);
  try {
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM users").get()!.n, 3);
    let calls = 0;
    const worker = welcomeWorker(
      db,
      config,
      stub(() => {
        calls++;
        return new Response("OK");
      }),
    );
    await worker.tick();
    await worker.stop();
    assert.equal(calls, 1);
    assert.equal(db.prepare("PRAGMA foreign_key_check").all().length, 0);
  } finally {
    db.close();
  }
});
