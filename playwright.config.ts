import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";

const browserPath =
  process.env.CHROMIUM_PATH ??
  (process.platform === "win32"
    ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
    : "/usr/bin/chromium");

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45000,
  use: {
    baseURL: "http://127.0.0.1:3101",
    trace: "retain-on-failure",
    launchOptions: {
      executablePath: existsSync(browserPath) ? browserPath : undefined,
      args: ["--no-sandbox"],
    },
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], defaultBrowserType: "chromium" },
    },
  ],
  webServer: {
    command: "node --import tsx e2e/start-server.ts",
    env: {
      SEED_DEMO: "1",
      LOCAL_QUICK_LOGIN: "1",
      DATABASE_PATH: `.local/e2e-${Date.now()}.sqlite`,
      PORT: "3101",
      STATIC_DIR: process.env.E2E_DIST_DIR ?? "dist",
    },
    url: "http://127.0.0.1:3101/api/health",
    reuseExistingServer: false,
    timeout: 30000,
  },
});
