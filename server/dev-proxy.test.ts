import test from "node:test";
import assert from "node:assert/strict";
import { createServer as httpServer } from "node:http";
import { existsSync } from "node:fs";
import { createServer } from "vite";
import { chromium } from "@playwright/test";
import { railwayProxy } from "../scripts/railway-proxy.js";

test("local frontend proxy preserves Railway sessions and protects writes", async (t) => {
  let upstreamRequests = 0;
  const upstream = httpServer(async (req, res) => {
    upstreamRequests++;
    res.setHeader("Content-Type", "application/json");
    if (
      req.method === "POST" &&
      new URL(req.headers.origin!).host !== req.headers.host
    ) {
      res.writeHead(403).end("{}");
      return;
    }
    if (req.url === "/api/auth/login") {
      res.setHeader(
        "Set-Cookie",
        "greenedu_session=mock-session; Domain=127.0.0.1; Path=/; HttpOnly; Secure; SameSite=Lax",
      );
      res.end('{"name":"Test only"}');
      return;
    }
    if (req.url === "/api/auth/logout") {
      res.setHeader(
        "Set-Cookie",
        "greenedu_session=; Path=/; HttpOnly; Secure; Max-Age=0; SameSite=Lax",
      );
      res.end("{}");
      return;
    }
    if (req.url === "/api/auth/me") {
      res.statusCode = req.headers.cookie?.includes(
        "greenedu_session=mock-session",
      )
        ? 200
        : 401;
      res.end("{}");
      return;
    }
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    res.end(
      JSON.stringify({
        host: req.headers.host,
        origin: req.headers.origin,
        contentType: req.headers["content-type"],
        body: Buffer.concat(chunks).toString("utf8"),
      }),
    );
  });
  await new Promise<void>((resolve) =>
    upstream.listen(0, "127.0.0.1", resolve),
  );
  t.after(
    () => new Promise<void>((resolve) => upstream.close(() => resolve())),
  );
  const address = upstream.address() as { port: number };
  const remoteOrigin = `http://127.0.0.1:${address.port}`;
  const proxy = railwayProxy(remoteOrigin);
  const vite = await createServer({
    configFile: false,
    plugins: [proxy.plugin],
    server: {
      host: "127.0.0.1",
      port: 0,
      watch: null,
      proxy: { "^/api(?:/|\\?|$)": proxy.proxy },
    },
  });
  await vite.listen();
  t.after(() => vite.close());
  const localAddress = vite.httpServer!.address() as { port: number };
  const localOrigin = `http://127.0.0.1:${localAddress.port}`;

  await t.test(
    "browser stores HttpOnly session, sends it back and clears it on logout",
    async () => {
      const path =
        process.env.CHROMIUM_PATH ??
        "C:/Program Files/Google/Chrome/Application/chrome.exe";
      const browser = await chromium.launch({
        executablePath: existsSync(path) ? path : undefined,
        args: ["--no-sandbox"],
      });
      try {
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.goto(`${localOrigin}/api/health`);
        assert.equal(
          await page.evaluate(async () => (await fetch("/api/auth/me")).status),
          401,
        );
        assert.equal(
          await page.evaluate(
            async () =>
              (
                await fetch("/api/auth/login", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: "{}",
                })
              ).status,
          ),
          200,
        );
        const cookie = (await context.cookies()).find(
          (c) => c.name === "greenedu_session",
        );
        assert.ok(cookie?.httpOnly);
        assert.equal(cookie?.sameSite, "Lax");
        assert.equal(cookie?.secure, false);
        assert.equal(
          await page.evaluate(async () => (await fetch("/api/auth/me")).status),
          200,
        );
        await page.evaluate(async () =>
          fetch("/api/auth/logout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "{}",
          }),
        );
        assert.equal(
          await page.evaluate(async () => (await fetch("/api/auth/me")).status),
          401,
        );
      } finally {
        await browser.close();
      }
    },
  );
  await t.test(
    "JSON and multipart bodies reach the upstream with matching Host/Origin",
    async () => {
      const json = await fetch(`${localOrigin}/api/echo`, {
        method: "POST",
        headers: { Origin: localOrigin, "Content-Type": "application/json" },
        body: '{"name":"Tiếng Việt"}',
      }).then((r) => r.json());
      assert.equal(json.origin, remoteOrigin);
      assert.equal(json.host, new URL(remoteOrigin).host);
      assert.equal(json.body, '{"name":"Tiếng Việt"}');
      const form = new FormData();
      form.append("file", new Blob(["file-bytes"]), "test.txt");
      const upload = await fetch(`${localOrigin}/api/upload`, {
        method: "POST",
        headers: { Origin: localOrigin },
        body: form,
      }).then((r) => r.json());
      assert.match(upload.contentType, /^multipart\/form-data; boundary=/);
      assert.ok(upload.body.includes("file-bytes"));
      assert.equal(upload.origin, remoteOrigin);
    },
  );
  await t.test(
    "foreign or malformed Origin and cross-site requests never reach upstream",
    async () => {
      const before = upstreamRequests;
      const cases: Record<string, string>[] = [
        { Origin: "https://untrusted.example" },
        { Origin: "invalid" },
        { Origin: localOrigin, "Sec-Fetch-Site": "cross-site" },
      ];
      for (const headers of cases) {
        const response = await fetch(`${localOrigin}/api/auth/login`, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: "{}",
        });
        assert.equal(response.status, 403);
      }
      assert.equal(upstreamRequests, before);
    },
  );
});
