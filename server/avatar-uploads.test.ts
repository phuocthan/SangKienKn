import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "./app.js";
import { openDatabase, seedDemo, hashPassword } from "./db.js";
import { avatarImage } from "./avatar-uploads.js";
import { crc32 } from "node:zlib";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jA1cAAAAASUVORK5CYII=",
  "base64",
);
function pngAtSize(size: number) {
  const chunk = Buffer.alloc(size - png.length, 120);
  chunk.writeUInt32BE(chunk.length - 12, 0);
  chunk.write("tEXt", 4, "ascii");
  chunk.write("note\0", 8, "ascii");
  chunk.writeUInt32BE(crc32(chunk.subarray(4, -4)), chunk.length - 4);
  return Buffer.concat([png.subarray(0, -12), chunk, png.subarray(-12)]);
}
test("avatar image headers accept PNG/WebP and reject non-raster or excessive dimensions", () => {
  assert.equal(avatarImage(png), "image/png");
  assert.equal(
    avatarImage(readFileSync("public/assets/knowledge-garden-v1.webp")),
    "image/webp",
  );
  for (const buffer of [
    Buffer.alloc(0),
    Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),
    png.subarray(0, 20),
  ])
    assert.throws(() => avatarImage(buffer), /Ảnh không hợp lệ/);
  const large = Buffer.from(png);
  large.writeUInt32BE(4097, 16);
  assert.throws(() => avatarImage(large), /4096/);
});

test("upload is atomic, private to authorized classmates, size-limited and survives reopen", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "greenedu-upload-"));
  const path = join(dir, "upload.sqlite");
  const db = openDatabase(path);
  seedDemo(db);
  db.prepare(
    "INSERT INTO users (id,email,name,password,role) VALUES (?,?,?,?,?)",
  ).run(
    "outsider",
    "outsider@example.test",
    "Other",
    hashPassword("OtherPass123!"),
    "student",
  );
  const server = createApp(db).listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}/api`;
  let closed = false;
  t.after(async () => {
    if (!closed) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      db.close();
    }
    rmSync(dir, { recursive: true, force: true });
  });
  const login = async (email: string, password = "GreenEdu123!") =>
    (
      await fetch(`${base}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
    ).headers
      .get("set-cookie")!
      .split(";")[0];
  const student = await login("hocsinh@greenedu.demo");
  const teacher = await login("giaovien@greenedu.demo");
  const peer = await login("minhkhoi@greenedu.demo");
  const outsider = await login("outsider@example.test", "OtherPass123!");
  function upload(
    cookie = student,
    buffer = png,
    type = "image/png",
    extra?: string,
    origin?: string,
  ) {
    const body = new FormData();
    body.append(
      "avatar",
      new Blob([new Uint8Array(buffer)], { type }),
      "avatar.png",
    );
    if (extra === "file")
      body.append("avatar", new Blob([new Uint8Array(png)]), "second.png");
    if (extra === "field") body.append("userId", "teacher-demo");
    return fetch(`${base}/auth/avatar/upload`, {
      method: "POST",
      headers: { Cookie: cookie, ...(origin ? { Origin: origin } : {}) },
      body,
    });
  }
  assert.equal((await upload("")).status, 401);
  assert.equal(
    (
      await upload(
        student,
        png,
        "image/png",
        undefined,
        "https://foreign.example",
      )
    ).status,
    403,
  );
  const saved = await upload(student, png, "application/octet-stream");
  assert.equal(saved.status, 200);
  const user = await saved.json();
  assert.match(user.avatarId, /^upload-/);
  assert.equal(user.uploadedAvatarId, user.avatarId);
  const image = `${base}/avatars/${user.avatarId}`;
  for (const cookie of [student, teacher, peer]) {
    const response = await fetch(image, { headers: { Cookie: cookie } });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "image/png");
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), png);
  }
  assert.equal((await fetch(image)).status, 401);
  assert.equal(
    (await fetch(image, { headers: { Cookie: outsider } })).status,
    404,
  );
  assert.equal(
    (
      await fetch(`${base}/auth/avatar`, {
        method: "POST",
        headers: { Cookie: teacher, "Content-Type": "application/json" },
        body: JSON.stringify({ avatarId: user.avatarId }),
      })
    ).status,
    400,
  );
  assert.equal(
    (await upload(student, Buffer.from("<svg/>"), "image/png")).status,
    400,
  );
  const oversized = await upload(student, Buffer.alloc(3 * 1024 * 1024 + 1));
  assert.equal(oversized.status, 413);
  assert.match((await oversized.json()).error, /3 MB/);
  assert.equal((await upload(student, png, "image/png", "file")).status, 400);
  assert.equal((await upload(student, png, "image/png", "field")).status, 400);
  assert.equal(
    db
      .prepare(
        "SELECT avatar_id FROM user_avatars WHERE user_id='student-demo'",
      )
      .get()?.avatar_id,
    user.avatarId,
  );
  db.prepare("UPDATE users SET must_change=1 WHERE id='student-demo'").run();
  assert.equal((await upload()).status, 403);
  db.prepare("UPDATE users SET must_change=0 WHERE id='student-demo'").run();
  const largePng = pngAtSize(3 * 1024 * 1024);
  const replacement = await upload(student, largePng);
  assert.equal(replacement.status, 200);
  const replaced = await replacement.json();
  assert.notEqual(replaced.avatarId, user.avatarId);
  assert.equal(
    (await fetch(image, { headers: { Cookie: student } })).status,
    404,
  );
  assert.equal(
    db.prepare("SELECT COUNT(*) AS n FROM avatar_uploads").get()?.n,
    1,
  );
  await fetch(`${base}/auth/avatar`, {
    method: "POST",
    headers: { Cookie: student, "Content-Type": "application/json" },
    body: JSON.stringify({ avatarId: "nature-2" }),
  });
  const me = await (
    await fetch(`${base}/auth/me`, { headers: { Cookie: student } })
  ).json();
  assert.equal(me.avatarId, "nature-2");
  assert.equal(me.uploadedAvatarId, replaced.avatarId);
  await fetch(`${base}/auth/avatar`, {
    method: "POST",
    headers: { Cookie: student, "Content-Type": "application/json" },
    body: JSON.stringify({ avatarId: replaced.avatarId }),
  });
  await new Promise<void>((resolve) => server.close(() => resolve()));
  db.close();
  closed = true;
  const reopened = openDatabase(path);
  try {
    assert.equal(
      reopened
        .prepare(
          "SELECT avatar_id FROM user_avatars WHERE user_id='student-demo'",
        )
        .get()?.avatar_id,
      replaced.avatarId,
    );
    assert.deepEqual(
      Buffer.from(
        reopened
          .prepare(
            "SELECT data FROM avatar_uploads WHERE user_id='student-demo'",
          )
          .get()?.data as Uint8Array,
      ),
      largePng,
    );
    assert.deepEqual(reopened.prepare("PRAGMA foreign_key_check").all(), []);
  } finally {
    reopened.close();
  }
});
