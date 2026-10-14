import { test, expect } from "@playwright/test";
import { navigateTo } from "./navigation";

const teacher = { email: "giaovien@greenedu.nk", password: "GreenEdu123!" };

test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: "ignoreErrors" });
});

test("empty goals do not promise progress and student home fits narrow screens", async ({
  page,
}, info) => {
  await page.request.post("/api/auth/login", {
    data: { email: "levels@greenedu.test", password: "LevelsTest123!" },
  });
  await page.goto("/");
  const goal = page.getByRole("region", { name: "Mục tiêu học tập kế tiếp" });
  await expect(goal).toContainText("Những hạt mầm đang được chuẩn bị");
  await expect(goal.getByRole("progressbar")).toHaveCount(0);
  await expect(goal.getByRole("button")).toHaveCount(0);
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.screenshot({
    path: `.local/polish-${info.project.name}-empty.png`,
    fullPage: true,
  });
});

test("student goal opens a ready chapter and correction counts survive grouped navigation", async ({
  page,
}, info) => {
  await page.request.post("/api/auth/login", {
    data: { email: "learning@greenedu.test", password: "LearningTest123!" },
  });
  // GET-only presentation fixture for a pending correction count.
  await page.route("**/api/classrooms", async (route) => {
    const response = await route.fetch();
    const classrooms = await response.json();
    classrooms[0].chapters[0].openCorrections = 2;
    await route.fulfill({ response, json: classrooms });
  });
  await page.goto("/");
  const goal = page.getByRole("region", { name: "Mục tiêu học tập kế tiếp" });
  await expect(goal).toContainText("Chương ôn II");
  await expect(page.locator(".sidebar nav .nav-count")).toHaveText("2");
  await navigateTo(page, { name: "Luyện tập", exact: true });
  const tab = page.getByRole("tab", { name: "Sổ tay sửa sai", exact: true });
  await expect(tab.locator(".workspace-tab-count")).toHaveText("2");
  await tab.click();
  await expect(tab).toHaveAttribute("aria-selected", "true");
  await navigateTo(page, { name: "Khu vườn của tôi", exact: true });
  await page.screenshot({
    path: `.local/polish-${info.project.name}-student.png`,
    fullPage: true,
  });
  await goal.getByRole("button", { name: "Luyện tập chương này" }).click();
  await expect(page.locator(".practice-layout")).toContainText("Chương ôn II");
  await expect(
    page.getByRole("button", { name: "Kết thúc phiên" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Kết thúc phiên" }).click();
  await expect(goal).toBeVisible();
});

test("teacher statistics expose loading and failures, then recover with retry", async ({
  page,
}, info) => {
  await page.request.post("/api/auth/login", { data: teacher });
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  let failed = false;
  await page.route("**/api/classrooms/*/students", async (route) => {
    if (!failed) {
      failed = true;
      await pending;
      await route.fulfill({
        status: 503,
        json: { error: "Không tải được thống kê kiểm thử." },
      });
    } else await route.continue();
  });
  await page.goto("/");
  const lastStat = page.locator(".teacher-home .stat-card").last();
  await expect(lastStat.locator("strong")).toHaveText("—");
  await expect(lastStat).toContainText("Đang tải thống kê…");
  release();
  await expect(lastStat).toContainText("Chưa tải được thống kê");
  await page.getByRole("button", { name: "Thử lại thống kê" }).click();
  await expect(lastStat.locator("strong")).toHaveText(/^\d+$/);
  await expect(
    page.getByRole("button", { name: "Thử lại thống kê" }),
  ).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".quick-actions > button").first()).toHaveCSS(
    "transition-duration",
    "0s",
  );
  await page.screenshot({
    path: `.local/polish-${info.project.name}-teacher.png`,
    fullPage: true,
  });
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const actions = page.locator(".teacher-home .quick-actions > button");
    await expect(actions).toHaveCount(3);
    for (const action of await actions.all()) {
      const icon = (await action.locator(".stat-icon").boundingBox())!;
      const title = (await action.locator("h3").boundingBox())!;
      const description = (await action.locator("p").boundingBox())!;
      expect(icon.x + icon.width).toBeLessThanOrEqual(title.x - 4);
      expect(icon.x + icon.width).toBeLessThanOrEqual(description.x - 4);
    }
  }
});

test("teacher finds Vietnamese students without accents and clears the filter", async ({
  page,
}, info) => {
  await page.request.post("/api/auth/login", { data: teacher });
  const classrooms = await (await page.request.get("/api/classrooms")).json();
  const classroom = classrooms[0];
  const response = await page.request.post(
    `/api/classrooms/${classroom.id}/students`,
    {
      data: {
        name: `Đặng Ánh Hòa ${info.project.name}`,
        email: `polish-${info.project.name}-${Date.now()}@example.test`,
        password: "PolishTemp123!",
      },
    },
  );
  expect(response.ok()).toBeTruthy();
  await page.goto("/");
  await navigateTo(page, { name: "Quản lý lớp", exact: true });
  await page
    .getByLabel("Tìm học sinh")
    .fill(`  DANG   ANH HOA ${info.project.name}  `);
  const rows = page.locator(".roster-card tbody tr");
  await expect(rows).toHaveCount(1);
  await expect(rows).toContainText("Đặng Ánh Hòa");
  await expect(page.locator(".search-result-count")).toContainText("1/");
  await page.getByLabel("Tìm học sinh").fill("khong-ton-tai-polish");
  await expect(
    page.getByText("Không tìm thấy học sinh", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Xóa tìm kiếm" }).click();
  await expect(page.getByLabel("Tìm học sinh")).toHaveValue("");
  expect(await rows.count()).toBeGreaterThan(1);
});

test("skip navigation preserves routes and modal links stay in the focus trap", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const account of [
    teacher,
    { email: "levels@greenedu.test", password: "LevelsTest123!" },
    { email: "admin@greenedu.test", password: "AdminTest123!" },
  ]) {
    await page.request.post("/api/auth/login", { data: account });
    await page.goto("/");
    await expect(page.getByRole("navigation")).toBeVisible();
    if (account.email !== "admin@greenedu.test") {
      await expect(page.getByLabel("Chọn lớp học")).toBeVisible();
      await expect
        .poll(() => new URL(page.url()).hash)
        .toContain("section=home");
    }
    const address = page.url();
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("link", { name: "Đến nội dung chính" }),
    ).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("main")).toBeFocused();
    expect(page.url()).toBe(address);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.request.post("/api/auth/login", { data: teacher });
  await page.goto("/");
  const opener = page
    .locator(".profile")
    .getByRole("button", { name: "Đổi avatar", exact: true });
  await opener.click();
  const dialog = page.getByRole("dialog", { name: "Đổi avatar", exact: true });
  // Downloads and help links in a dialog must be part of its keyboard loop.
  await dialog.evaluate((node) => {
    const link = document.createElement("a");
    link.href = "/";
    link.textContent = "Liên kết kiểm thử";
    node.append(link);
  });
  const last = dialog.getByRole("link", { name: "Liên kết kiểm thử" });
  await last.focus();
  await page.keyboard.press("Tab");
  await expect(
    dialog.getByRole("button", { name: "Đóng", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(last).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(opener).toBeFocused();
  await page.screenshot({
    path: `.local/polish-${info.project.name}-focus.png`,
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
