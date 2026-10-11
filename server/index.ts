import express from "express";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { createApp } from "./app.js";
import { openDatabase, seedDemo } from "./db.js";
import { sweepLearningExams } from "./learning.js";
import { readWelcomeConfig, welcomeWorker } from "./welcome-email.js";

const production = process.env.NODE_ENV === "production";
const demo = process.env.SEED_DEMO === "1";
if (production && demo)
  throw new Error("Không bật SEED_DEMO trong production.");
const welcomeConfig = readWelcomeConfig();
const db = openDatabase(process.env.DATABASE_PATH ?? ".local/greenedu.sqlite");
if (demo) seedDemo(db);
const app = createApp(db, {
  production,
  demo,
  quickLogin: process.env.LOCAL_QUICK_LOGIN === "1",
  welcomeEmail: !!welcomeConfig,
});
const mailWorker = welcomeConfig ? welcomeWorker(db, welcomeConfig) : null;
const mailSweep = mailWorker
  ? setInterval(() => {
      void mailWorker
        .tick()
        .catch(() => console.error("Email chào mừng: lỗi xử lý hàng đợi."));
    }, 2000)
  : null;
mailSweep?.unref();
// A server worker also submits expired runs when every browser is closed.
sweepLearningExams(db);
const examSweep = setInterval(() => {
  try {
    sweepLearningExams(db);
  } catch (error) {
    console.error("Exam sweep:", error);
  }
}, 1000);
examSweep.unref();
const dist = resolve(process.env.STATIC_DIR ?? "dist");
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get("/{*path}", (_req, res) =>
    res.sendFile(resolve(dist, "index.html"), { dotfiles: "allow" }),
  );
}
const port = Number(process.env.PORT ?? 3001);
const server = app.listen(port, "0.0.0.0", () =>
  console.log(`GreenEdu API listening on port ${port}${demo ? " (demo)" : ""}`),
);
async function shutdown() {
  clearInterval(examSweep);
  if (mailSweep) clearInterval(mailSweep);
  await mailWorker?.stop();
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
