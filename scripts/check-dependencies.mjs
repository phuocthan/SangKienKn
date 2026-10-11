import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
const mismatches = [];
for (const [path, expected] of Object.entries(lock.packages ?? {})) {
  if (!path.startsWith("node_modules/") || expected.optional || expected.link)
    continue;
  try {
    const installed = JSON.parse(
      readFileSync(resolve(path, "package.json"), "utf8"),
    );
    if (installed.version !== expected.version) mismatches.push(path);
  } catch {
    mismatches.push(path);
  }
}
for (const path of [
  "node_modules/typescript/bin/tsc",
  "node_modules/vite/bin/vite.js",
  "node_modules/tsx/dist/loader.mjs",
]) {
  if (!existsSync(path)) mismatches.push(path);
}
if (mismatches.length) {
  console.log(
    `Dependencies need installation: ${mismatches.slice(0, 3).join(", ")}${mismatches.length > 3 ? "..." : ""}`,
  );
  process.exitCode = 1;
} else {
  console.log("Installed dependencies match package-lock.json.");
}
