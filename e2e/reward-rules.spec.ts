import { test, expect } from "@playwright/test";
import { navigateTo } from "./navigation";

test("teacher saves a class threshold and uploads Word without fetching a vanished parser chunk", async ({
  page,
}, info) => {
  await page.request.post("/api/auth/login", {
    data: { email: "giaovien@greenedu.nk", password: "GreenEdu123!" },
  });
  await page.request.post("/api/chapters/learning-ch1/hunt-access", {
    data: { enabled: false, deleteQuestions: true },
  });
  await page.goto("/");
  await page.getByLabel("Chọn lớp học").selectOption("learning-class");
  await navigateTo(page, { name: "Săn thưởng", exact: true });
  const settings = page.getByRole("form", { name: "Ngưỡng điểm Săn thưởng" });
  await settings.getByLabel("Điểm tối thiểu để xét điểm cộng").fill("7.5");
  await settings.getByRole("button", { name: "Lưu ngưỡng điểm" }).click();
  await expect(
    page.getByText("Đã lưu ngưỡng điểm Săn thưởng cho lớp này."),
  ).toBeVisible();
  expect(
    (
      await (
        await page.request.get("/api/classrooms/learning-class/learning")
      ).json()
    ).huntMinimumScore,
  ).toBe(7.5);
  await settings.scrollIntoViewIfNeeded();
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize(info.project.use.viewport!);
  await settings.screenshot({
    path: `.local/reward-rules-20261026/settings-${info.project.name}.png`,
  });
  const row = page
    .locator(".learning-row")
    .filter({ has: page.getByText("Chương ôn I", { exact: true }) })
    .first();
  await row.getByRole("button", { name: "Mở săn thưởng", exact: true }).click();
  const dialog = page.getByRole("dialog", {
    name: "Mở săn thưởng",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  // Reproduce the screenshot's missing chunk after the dialog is already loaded.
  let parserFetches = 0;
  await page.route("**/assets/importWord-*.js", async (route) => {
    parserFetches++;
    await route.abort();
  });
  const template = await page.request.get(
    "/templates/greenedu-cau-hoi-mau.docx",
  );
  expect(template.ok()).toBe(true);
  const paper = dialog.getByRole("group", {
    name: "Đề 1 · Vé cấp 3",
    exact: true,
  });
  await paper.getByLabel("File đề (.docx hoặc .csv)").setInputFiles({
    name: "de-thuong.docx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    buffer: await template.body(),
  });
  await expect(
    paper.getByText(/Đã đọc de-thuong.docx: \d+ câu hợp lệ/),
  ).toBeVisible();
  expect(parserFetches).toBe(0);
  await expect(
    dialog.getByRole("button", { name: "Mở săn thưởng", exact: true }),
  ).toBeEnabled();
  await dialog
    .getByRole("button", { name: "Mở săn thưởng", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await expect(
    row.getByRole("button", { name: "Khóa săn thưởng", exact: true }),
  ).toBeVisible();
  const saved = await (
    await page.request.get("/api/classrooms/learning-class/learning")
  ).json();
  expect(
    saved.chapters.find((ch: { id: string }) => ch.id === "learning-ch1").hunt
      .open,
  ).toBe(true);
  await page.request.post("/api/chapters/learning-ch1/hunt-access", {
    data: { enabled: false },
  });
  await page.request.post("/api/classrooms/learning-class/reward-settings", {
    data: { huntMinimumScore: 8 },
  });
});

test("online has its own ranked approval list and never shows hunt proposals", async ({
  page,
}, info) => {
  await page.request.post("/api/auth/login", {
    data: { email: "giaovien@greenedu.nk", password: "GreenEdu123!" },
  });
  let status = "pending";
  await page.route(
    "**/api/classrooms/learning-class/learning",
    async (route) => {
      const response = await route.fetch(),
        data = await response.json();
      data.rewards = [
        {
          id: "online:test",
          sourceType: "online",
          examId: "test",
          studentName: "Học sinh kiểm thử",
          label: "Top 10 online · Bài kiểm thử",
          points: 1,
          status,
          rank: 1,
          score: 9.5,
          elapsedMs: 125000,
          createdAt: Date.now(),
        },
        {
          id: "hunt:test",
          sourceType: "hunt",
          studentName: "Học sinh kiểm thử",
          label: "Săn điểm đạt từ 8",
          points: 1,
          status: "pending",
          createdAt: Date.now(),
        },
      ];
      await route.fulfill({ response, json: data });
    },
  );
  await page.route(
    "**/api/learning/rewards/online:test/review",
    async (route) => {
      expect(route.request().postDataJSON()).toEqual({ status: "approved" });
      status = "approved";
      await route.fulfill({ json: { ok: true } });
    },
  );
  await page.goto("/");
  await page.getByLabel("Chọn lớp học").selectOption("learning-class");
  await navigateTo(page, { name: "Kiểm tra", exact: true });
  const rewards = page.getByRole("region", {
    name: "Điểm cộng kiểm tra online",
  });
  await expect(rewards.getByText(/Hạng 1 · 9.5\/10/)).toBeVisible();
  await expect(
    rewards.getByText("Săn điểm đạt từ 8", { exact: false }),
  ).toHaveCount(0);
  await rewards.getByRole("button", { name: "Duyệt", exact: true }).click();
  await expect(rewards.getByText(/Đã duyệt/)).toBeVisible();
  await expect(
    rewards.getByRole("button", { name: "Duyệt", exact: true }),
  ).toHaveCount(0);
  await rewards.screenshot({
    path: `.local/reward-rules-20261026/online-${info.project.name}.png`,
  });
});
