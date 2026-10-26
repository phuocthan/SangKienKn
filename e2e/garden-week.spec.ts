import { test, expect } from "@playwright/test";

test("personal garden shows the selected class's week separately from lifetime and keeps the enlarged artwork visible", async ({
  page,
}, info) => {
  const login = await page.request.post("/api/auth/login", {
    data: { email: "learning@greenedu.test", password: "LearningTest123!" },
  });
  expect(login.ok()).toBe(true);
  let seconds: number | null = 3723;
  let coverage = "full";
  await page.route("**/api/classrooms", async (route) => {
    const response = await route.fetch();
    const rows = await response.json();
    for (const row of rows) {
      row.studyWeek = {
        start: "2026-10-26",
        end: "2026-11-01",
        seconds,
        coverage,
      };
      row.chapters.forEach((ch: { seconds: number }, index: number) => {
        ch.seconds = index === 0 ? 18000 : 0;
      });
    }
    await route.fulfill({ response, json: rows });
  });
  await page.goto("/");
  await page.getByLabel("Chọn lớp học").selectOption("learning-class");
  const hero = page.locator(".student-welcome-hero");
  const week = hero.locator(".student-study-week");
  await expect(week).toContainText("Tuần này: 1 giờ 2 phút 3 giây");
  await expect(hero).toContainText("5 giờ 0 phút đã học");
  const art = hero.locator(".hero-illustration");
  for (const width of [320, 390, 768, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect(art).toBeVisible();
    const box = await art.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(width < 700 ? 175 : 180);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({
    width: info.project.name === "mobile" ? 390 : 1440,
    height: 1000,
  });
  await hero.screenshot({ path: info.outputPath("garden-week.png") });
  seconds = 0;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(week).toContainText("Tuần này: 0 phút");
  seconds = null;
  coverage = "none";
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(week).toContainText("Chưa có lịch sử");
  seconds = 65;
  coverage = "partial";
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(week).toContainText("1 phút 5 giây");
  await expect(week).toContainText("Chưa đủ lịch sử cả tuần");
  await hero
    .getByRole("button", { name: "Tiếp tục luyện tập", exact: true })
    .click();
  await expect(page.locator(".chapter-card").first()).toBeVisible();
});
