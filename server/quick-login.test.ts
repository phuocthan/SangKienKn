import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { request as httpRequest } from "node:http";
import { createApp } from "./app.js";
import { hashPassword, openDatabase } from "./db.js";

async function fixture(
  t: TestContext,
  options: Parameters<typeof createApp>[1] = { quickLogin: true },
) {
  const db = openDatabase(":memory:");
  const server = createApp(db, options).listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}/api`;
  t.after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    db.close();
  });
  function add(id: string, role: string, mustChange = 0) {
    db.prepare("INSERT INTO users VALUES (?,?,?,?,?,?)").run(
      id,
      `${id}@example.test`,
      `Tên ${id}`,
      hashPassword(`Unique-${id}-123!`),
      role,
      mustChange,
    );
  }
  async function request(
    path: string,
    body?: unknown,
    headers: Record<string, string> = {},
  ) {
    if (headers.Host) {
      return await new Promise<{ status: number; data: any; cookie: string }>(
        (resolve, reject) => {
          const req = httpRequest(
            `${base}${path}`,
            {
              method: body === undefined ? "GET" : "POST",
              headers: { "Content-Type": "application/json", ...headers },
            },
            (res) => {
              let data = "";
              res.on("data", (chunk) => {
                data += chunk;
              });
              res.on("end", () =>
                resolve({
                  status: res.statusCode!,
                  data: JSON.parse(data),
                  cookie: res.headers["set-cookie"]?.[0]?.split(";")[0] ?? "",
                }),
              );
            },
          );
          req.on("error", reject);
          req.end(body === undefined ? undefined : JSON.stringify(body));
        },
      );
    }
    const response = await fetch(`${base}${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return {
      status: response.status,
      data: await response.json(),
      cookie: response.headers.get("set-cookie")?.split(";")[0] ?? "",
    };
  }
  return { db, add, request };
}

test("quick login selects existing default teacher/student, issues real sessions and never returns credentials", async (t) => {
  const f = await fixture(t);
  f.add("admin-first", "admin");
  f.add("teacher-first", "teacher");
  f.add("teacher-next", "teacher");
  f.add("student-first", "student");
  const health = await f.request("/health");
  assert.equal(health.data.quickLogin, true);
  assert.deepEqual(health.data.quickAccounts, [
    { role: "teacher", name: "Tên teacher-first" },
    { role: "student", name: "Tên student-first" },
  ]);
  for (const role of ["teacher", "student"]) {
    const login = await f.request("/auth/quick-login", {
      role,
      userId: "admin-first",
    });
    assert.equal(login.status, 200);
    assert.equal(login.data.id, `${role}-first`);
    assert.equal(login.data.role, role);
    assert.equal("password" in login.data, false);
    assert.match(login.cookie, /^greenedu_session=/);
    assert.equal(
      (await f.request("/auth/me", undefined, { Cookie: login.cookie })).data
        .id,
      `${role}-first`,
    );
  }
  assert.equal(
    (await f.request("/auth/quick-login", { role: "admin" })).status,
    400,
  );
  assert.equal((await f.request("/auth/quick-login", {})).status, 400);
  f.db
    .prepare("UPDATE users SET name = 'Tên mới' WHERE id = 'teacher-first'")
    .run();
  assert.equal(
    (await f.request("/health")).data.quickAccounts[0].name,
    "Tên mới",
  );
  f.db.prepare("DELETE FROM sessions WHERE user_id = 'teacher-first'").run();
  f.db.prepare("DELETE FROM users WHERE id = 'teacher-first'").run();
  assert.equal(
    (await f.request("/auth/quick-login", { role: "teacher" })).data.id,
    "teacher-next",
  );
});

test("quick login remains disabled by default, in production, and on non-local hosts; rejects cross-site requests", async (t) => {
  for (const options of [{}, { quickLogin: true, production: true }]) {
    const f = await fixture(t, options);
    f.add("teacher", "teacher");
    const health = await f.request("/health");
    assert.equal(health.data.quickLogin, false);
    assert.deepEqual(health.data.quickAccounts, []);
    assert.equal(
      (await f.request("/auth/quick-login", { role: "teacher" })).status,
      404,
    );
    assert.equal(
      f.db.prepare("SELECT COUNT(*) AS n FROM sessions").get()?.n,
      0,
    );
  }
  const f = await fixture(t);
  f.add("teacher", "teacher");
  const headers = { Host: "school.example", "X-Forwarded-For": "127.0.0.1" };
  assert.deepEqual(
    (await f.request("/health", undefined, headers)).data.quickAccounts,
    [],
  );
  assert.equal(
    (await f.request("/auth/quick-login", { role: "teacher" }, headers)).status,
    404,
  );
  assert.equal(
    (
      await f.request(
        "/auth/quick-login",
        { role: "teacher" },
        { Origin: "https://other.example" },
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await f.request(
        "/auth/quick-login",
        { role: "teacher" },
        { "Sec-Fetch-Site": "cross-site" },
      )
    ).status,
    403,
  );
  assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM sessions").get()?.n, 0);
});

test("quick login handles missing roles without seeding and retains mandatory password change", async (t) => {
  const f = await fixture(t);
  assert.deepEqual((await f.request("/health")).data.quickAccounts, []);
  assert.equal(
    (await f.request("/auth/quick-login", { role: "teacher" })).status,
    404,
  );
  assert.equal(
    (await f.request("/auth/quick-login", { role: "student" })).status,
    404,
  );
  assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM users").get()?.n, 0);
  f.add("temporary", "student", 1);
  const login = await f.request("/auth/quick-login", { role: "student" });
  assert.equal(login.data.mustChange, true);
  assert.equal(
    (await f.request("/classrooms", undefined, { Cookie: login.cookie }))
      .status,
    403,
  );
});
