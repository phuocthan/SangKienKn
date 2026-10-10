import express from "express";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { createApp } from "./app.js";
import { openDatabase, seedDemo } from "./db.js";

const production = process.env.NODE_ENV === "production";
const demo = process.env.SEED_DEMO === "1";
if (production && demo)
  throw new Error("Không bật SEED_DEMO trong production.");
const db = openDatabase(process.env.DATABASE_PATH ?? ".local/greenedu.sqlite");
if (demo) seedDemo(db);
const app = createApp(db, { production, demo });
const dist = resolve("dist");
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get("/{*path}", (_req, res) => res.sendFile(resolve(dist, "index.html")));
}
const port = Number(process.env.PORT ?? 3001);
const server = app.listen(port, "0.0.0.0", () =>
  console.log(`GreenEdu API listening on port ${port}${demo ? " (demo)" : ""}`),
);
function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
