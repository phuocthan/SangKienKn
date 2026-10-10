import { defineConfig, devices } from "@playwright/test";

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
      executablePath: process.env.CHROMIUM_PATH ?? "/usr/bin/chromium",
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
    command: `SEED_DEMO=1 DATABASE_PATH=.local/e2e-${Date.now()}.sqlite PORT=3101 npm start`,
    url: "http://127.0.0.1:3101/api/health",
    reuseExistingServer: false,
    timeout: 30000,
  },
});
