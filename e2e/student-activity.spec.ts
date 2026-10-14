import { test, expect } from "@playwright/test";
import { navigateTo } from "./navigation";

test("teacher sees a student's credited practice time and session start/stop without reloading", async ({
  page,
  playwright,
}, info) => {
  const learner = await playwright.request.newContext({
    baseURL: "http://127.0.0.1:3101",
  });
  await learner.post("/api/auth/login", {
    data: { email: "learning@greenedu.test", password: "LearningTest123!" },
  });
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
  const time = row.locator(".roster-time-cell");
  await expect(time).toBeVisible();
  const before = Number(await time.getAttribute("data-recorded-seconds"));
  const start = await learner.post("/api/study/start", {
    data: { chapterId: "learning-ch2", questionId: "learning-ch2-q1" },
  });
  expect(start.ok()).toBe(true);
  const { sessionId } = await start.json();
  try {
    await expect(row.getByText("Đang luyện tập", { exact: true })).toBeVisible({
      timeout: 10000,
    });
    const heartbeat = await learner.post("/api/study/heartbeat", {
      data: { sessionId, active: true, interacted: true },
    });
    expect(heartbeat.ok()).toBe(true);
    const { creditedSeconds } = await heartbeat.json();
    expect(creditedSeconds).toBeGreaterThan(0);
    const members = await (
      await page.request.get("/api/classrooms/learning-class/student-activity")
    ).json();
    const confirmed = members.find(
      (member: { id: string }) => member.id === "learning-student",
    ).seconds;
    expect(confirmed).toBeGreaterThan(before);
    expect(Math.abs(confirmed - before - creditedSeconds)).toBeLessThan(1);
    await expect
      .poll(
        async () => Number(await time.getAttribute("data-recorded-seconds")),
        { timeout: 10000 },
      )
      .toBe(confirmed);
    await row.screenshot({ path: info.outputPath("teacher-live-study.png") });
    expect(
      (
        await learner.post("/api/study/stop", {
          data: { sessionId, active: false },
        })
      ).ok(),
    ).toBe(true);
    await expect(row.getByText("Đang luyện tập", { exact: true })).toHaveCount(
      0,
      { timeout: 10000 },
    );
    await expect(time).toHaveAttribute(
      "data-recorded-seconds",
      String(confirmed),
    );
  } finally {
    await learner.post("/api/study/stop", {
      data: { sessionId, active: false },
    });
    await learner.dispose();
  }
});

test("activity failures retain confirmed time and roster, hide live status, and recover", async ({
  page,
}) => {
  let status = 200;
  await page.route(
    "**/api/classrooms/learning-class/student-activity",
    (route) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(
          status === 200
            ? [{ id: "learning-student", seconds: 14415, activeForMs: 30000 }]
            : { error: "Unavailable" },
        ),
      }),
  );
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
  await expect(row.getByText("Đang luyện tập", { exact: true })).toBeVisible();
  await expect(row.locator(".roster-time-cell")).toHaveAttribute(
    "data-recorded-seconds",
    "14415",
    { timeout: 10000 },
  );
  status = 503;
  await expect(
    page.getByText("Chưa cập nhật được phiên luyện tập. Đang kết nối lại…"),
  ).toBeVisible({ timeout: 10000 });
  await expect(row.getByText("Đang luyện tập", { exact: true })).toHaveCount(0);
  await expect(row.locator(".roster-time-cell")).toHaveAttribute(
    "data-recorded-seconds",
    "14415",
  );
  status = 200;
  await expect(row.getByText("Đang luyện tập", { exact: true })).toBeVisible({
    timeout: 10000,
  });
  status = 404;
  await expect(
    page.getByText("Cập nhật trực tiếp cần phiên bản máy chủ mới."),
  ).toBeVisible({ timeout: 10000 });
  await expect(row).toBeVisible();
  status = 200;
  await page
    .locator(".roster-activity-warning")
    .getByRole("button", { name: "Thử lại", exact: true })
    .click();
  await expect(row.getByText("Đang luyện tập", { exact: true })).toBeVisible();
});
