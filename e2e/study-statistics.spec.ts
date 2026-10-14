import { test, expect, type Page } from "@playwright/test";
import { navigateTo } from "./navigation";

async function openStatistics(page: Page) {
  await page.request.post("/api/auth/login", {
    data: { email: "giaovien@greenedu.nk", password: "GreenEdu123!" },
  });
  await page.goto("/");
  await page.getByLabel("Chọn lớp học").selectOption("learning-class");
  await navigateTo(page, { name: "Quản lý lớp", exact: true });
  const row = page
    .getByRole("table", { name: "Danh sách học sinh", exact: true })
    .getByRole("row")
    .filter({ hasText: "learning@greenedu.test" });
  await row
    .getByRole("button", {
      name: "Thống kê thời gian học · Học sinh ôn thi",
      exact: true,
    })
    .click();
  return page.getByRole("dialog", {
    name: "Thống kê thời gian học · Học sinh ôn thi",
    exact: true,
  });
}

test("teacher opens per-student day/week/month statistics, old time is preserved without invented history", async ({
  page,
}, info) => {
  const dialog = await openStatistics(page);
  const table = dialog.getByRole("table", {
    name: "Thời gian luyện tập theo kỳ",
    exact: true,
  });
  await expect(table.getByRole("row")).toHaveCount(15);
  await expect(
    dialog.getByText("Chưa có lịch sử", { exact: true }).first(),
  ).toBeVisible();
  await expect(dialog.locator(".study-statistics-note")).toContainText(
    "4 giờ 0 phút",
  );
  await expect(dialog.locator(".study-statistics-note")).toContainText(
    "Thời gian cũ chưa được chia theo ngày",
  );
  await dialog.getByRole("button", { name: "Tuần", exact: true }).click();
  await expect(table.getByRole("row")).toHaveCount(9);
  await expect(
    dialog.getByRole("button", { name: "Tuần", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await dialog.getByRole("button", { name: "Tháng", exact: true }).click();
  await expect(table.getByRole("row")).toHaveCount(13);
  await dialog.getByLabel("Ngày xem", { exact: true }).fill("2026-01-01");
  await expect(dialog.locator(".study-statistics-summary")).toContainText(
    "Chưa có lịch sử",
  );
  await dialog.screenshot({
    path: info.outputPath("study-statistics-month.png"),
  });
  await dialog.getByRole("button", { name: "Đóng", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole("button", {
      name: "Thống kê thời gian học · Học sinh ôn thi",
      exact: true,
    }),
  ).toBeFocused();
});

test("statistics refresh credited practice time while open and keep confirmed data through errors", async ({
  page,
  playwright,
}) => {
  const learner = await playwright.request.newContext({
    baseURL: "http://127.0.0.1:3101",
  });
  await learner.post("/api/auth/login", {
    data: { email: "learning@greenedu.test", password: "LearningTest123!" },
  });
  const dialog = await openStatistics(page);
  const summaries = dialog.locator(".study-statistics-summary");
  await expect(summaries).toBeVisible();
  const day = summaries.locator("dd").first();
  const before = await day.innerText();
  const start = await learner.post("/api/study/start", {
    data: { chapterId: "learning-ch2", questionId: "learning-ch2-q1" },
  });
  expect(start.ok()).toBe(true);
  const { sessionId } = await start.json();
  try {
    await expect
      .poll(
        async () => {
          const heartbeat = await learner.post("/api/study/heartbeat", {
            data: { sessionId, active: true, interacted: true },
          });
          expect(heartbeat.ok()).toBe(true);
          return (await heartbeat.json()).creditedSeconds;
        },
        { intervals: [1200], timeout: 6000 },
      )
      .toBeGreaterThan(1);
    await expect(day).not.toHaveText(before, { timeout: 10000 });
    await page.route(
      "**/api/classrooms/learning-class/students/learning-student/study-statistics?**",
      (route) =>
        route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ error: "Nguồn thống kê tạm ngừng" }),
        }),
    );
    await expect(dialog.getByRole("alert")).toContainText(
      "Nguồn thống kê tạm ngừng",
      { timeout: 10000 },
    );
    await expect(
      dialog.getByRole("table", {
        name: "Thời gian luyện tập theo kỳ",
        exact: true,
      }),
    ).toBeVisible();
    const confirmed = await day.innerText();
    await page.unroute(
      "**/api/classrooms/learning-class/students/learning-student/study-statistics?**",
    );
    await dialog.getByRole("button", { name: "Thử lại", exact: true }).click();
    await expect(day).toHaveText(confirmed);
    await expect(dialog.getByRole("alert")).toHaveCount(0);
  } finally {
    await learner.post("/api/study/stop", {
      data: { sessionId, active: false },
    });
    await learner.dispose();
  }
});

test("statistics handle older servers and fit small and wide screens", async ({
  page,
}, info) => {
  const endpoint =
    "**/api/classrooms/learning-class/students/learning-student/study-statistics?**";
  await page.route(endpoint, (route) =>
    route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ error: "Not available" }),
    }),
  );
  const dialog = await openStatistics(page);
  await expect(dialog.getByRole("alert")).toContainText("Cần cập nhật máy chủ");
  await page.unroute(endpoint);
  await dialog.getByRole("button", { name: "Thử lại", exact: true }).click();
  await expect(
    dialog.getByRole("table", {
      name: "Thời gian luyện tập theo kỳ",
      exact: true,
    }),
  ).toBeVisible();
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await dialog.evaluate(
        (element) => element.scrollWidth <= element.clientWidth,
      ),
    ).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const box = await dialog.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
  }
  await dialog.screenshot({
    path: info.outputPath("study-statistics-day.png"),
  });
});
