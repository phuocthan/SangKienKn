import { DatabaseSync, backup } from "node:sqlite";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const [source, destination] = process.argv.slice(2);
if (!source || !destination || resolve(source) === resolve(destination)) {
  throw new Error(
    "Usage: node scripts/backup-database.mjs <source.sqlite> <new-backup.sqlite>",
  );
}
mkdirSync(dirname(resolve(destination)), { recursive: true });
if (existsSync(resolve(destination))) {
  throw new Error("Backup destination already exists; choose a new path.");
}
const db = new DatabaseSync(resolve(source), { readOnly: true });
try {
  await backup(db, resolve(destination));
  console.log(`Database backup saved: ${resolve(destination)}`);
} finally {
  db.close();
}
