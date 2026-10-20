import { test, expect, type Page } from "@playwright/test";
import { navigateTo } from "./navigation";
const vietnamInput = (timestamp: number) =>
  new Date(timestamp + 7 * 3600000).toISOString().slice(0, 16);
async function teacher(page: Page) {
  const r = await page.request.post("/api/auth/login", {
    data: { email: "giaovien@greenedu.nk", password: "GreenEdu123!" },
  });
  expect(r.ok()).toBe(true);
  await page.goto("/");
  await page.getByLabel("Chọn lớp học").selectOption("learning-class");
  await navigateTo(page, { name: "Kiểm tra", exact: true });
}

test("teacher schedules a bank paper, edits saved values, retries safely and keeps the same exam after reload", async ({
  page,
}, info) => {
  await teacher(page);
  await page
    .getByRole("button", { name: "Tạo bài kiểm tra", exact: true })
    .click();
  const form = page.getByRole("dialog", {
    name: "Tạo bài kiểm tra",
    exact: true,
  });
  const title = `Lịch ${info.project.name} ${Date.now()}`;
  await form.getByLabel("Tên bộ câu").fill(title);
  await form
    .getByRole("radio", { name: "Chọn từ ngân hàng", exact: true })
    .check();
  await form.getByLabel("Chương ôn I", { exact: true }).check();
  await form.getByLabel("Số câu", { exact: true }).fill("2");
  await form.getByLabel("Hẹn giờ bắt đầu", { exact: true }).check();
  await expect(form.locator(".online-exam-timing-note")).toContainText(
    "Bài tự mở đúng ngày giờ đã hẹn.",
  );
  const time = vietnamInput(Date.now() + 86400000);
  await form.getByLabel("Ngày và giờ bắt đầu (giờ Việt Nam)").fill(time);
  const saved = page.waitForResponse(
    (r) =>
      r.url().endsWith("/classrooms/learning-class/exams") &&
      r.request().method() === "POST",
  );
  await form
    .getByRole("button", { name: "Lưu bài kiểm tra", exact: true })
    .click();
  const response = await saved;
  expect(response.ok()).toBe(true);
  const { id } = await response.json();
  const popup = page.getByRole("dialog", {
    name: "Đã tạo bài kiểm tra",
    exact: true,
  });
  await expect(popup).toContainText("Đã hẹn giờ bắt đầu");
  await expect(
    popup.getByRole("button", { name: "Bắt đầu ngay", exact: true }),
  ).toHaveCount(0);
  await popup
    .getByRole("button", { name: "Chỉnh sửa thông tin", exact: true })
    .click();
  const edit = page.getByRole("dialog", {
    name: "Chỉnh sửa bài kiểm tra",
    exact: true,
  });
  await expect(edit.getByLabel("Tên bộ câu")).toHaveValue(title);
  await expect(
    edit.getByLabel("Ngày và giờ bắt đầu (giờ Việt Nam)"),
  ).toHaveValue(time);
  await expect(edit.getByLabel("Chương ôn I", { exact: true })).toBeChecked();
  await edit.getByLabel("Tên bộ câu").fill(title + " sửa");
  await edit.getByLabel("Thời gian làm bài (phút)").fill("35");
  const next = vietnamInput(Date.now() + 172800000);
  await edit.getByLabel("Ngày và giờ bắt đầu (giờ Việt Nam)").fill(next);
  const endpoint = `**/api/learning/exams/${id}/update`;
  await page.route(endpoint, (r) =>
    r.fulfill({ status: 503, json: { error: "Chưa thể lưu, thử lại." } }),
  );
  await edit.getByRole("button", { name: "Lưu thay đổi", exact: true }).click();
  await expect(edit.getByRole("alert")).toContainText("Chưa thể lưu");
  await expect(edit.getByRole("alert")).toBeFocused();
  await expect(edit.getByLabel("Tên bộ câu")).toHaveValue(title + " sửa");
  await page.unroute(endpoint);
  await edit.getByRole("button", { name: "Lưu thay đổi", exact: true }).click();
  await expect(edit).toHaveCount(0);
  const row = page.locator(`[data-exam-id="${id}"]`);
  await expect(row).toContainText(title + " sửa");
  await expect(row).toContainText("Đã hẹn giờ");
  await page.reload();
  await expect(row).toBeVisible();
  await row
    .getByRole("button", { name: "Chỉnh sửa thông tin", exact: true })
    .click();
  await expect(edit.getByLabel("Thời gian làm bài (phút)")).toHaveValue("35");
  await expect(
    edit.getByLabel("Ngày và giờ bắt đầu (giờ Việt Nam)"),
  ).toHaveValue(next);
  const viewport = page.viewportSize()!;
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    const calendar = edit.getByLabel("Ngày và giờ bắt đầu (giờ Việt Nam)");
    await calendar.scrollIntoViewIfNeeded();
    expect(await edit.evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(
      true,
    );
    const box = await calendar.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
  }
  await edit.screenshot({
    path: info.outputPath("edit-scheduled-exam-mobile.png"),
  });
  await page.setViewportSize(viewport);
  await edit
    .getByLabel("Ngày và giờ bắt đầu (giờ Việt Nam)")
    .scrollIntoViewIfNeeded();
  await edit.screenshot({ path: info.outputPath("edit-scheduled-exam.png") });
  await edit.getByLabel("Hẹn giờ bắt đầu", { exact: true }).uncheck();
  await edit.getByRole("button", { name: "Lưu thay đổi", exact: true }).click();
  await expect(row).toContainText("Chờ giáo viên bắt đầu");
  const overview = await (
    await page.request.get("/api/classrooms/learning-class/learning")
  ).json();
  const exam = overview.exams.find((e: { id: string }) => e.id === id);
  expect(exam.scheduledStartAt).toBeNull();
  expect(exam.startedAt).toBeNull();
  expect(exam.enabled).toBe(false);
  expect(
    overview.exams.filter((e: { id: string }) => e.id === id),
  ).toHaveLength(1);
});

test("uploaded paper can be edited without uploading again; cancel and metadata changes preserve its questions", async ({
  page,
}, info) => {
  await teacher(page);
  const question = {
    text: `Câu riêng ${info.project.name} ${Date.now()}`,
    choices: ["Một", "Hai", "Ba", "Bốn"],
    correctIndex: 0,
    explanation: "Giải thích mẫu.",
  };
  const r = await page.request.post("/api/classrooms/learning-class/exams", {
    data: {
      title: question.text,
      delivery: "online",
      source: "upload",
      chapterIds: ["learning-ch1"],
      questions: [{ chapterId: "learning-ch1", question }],
      preparationMinutes: 2,
      durationMinutes: 15,
    },
  });
  expect(r.ok()).toBe(true);
  const { id } = await r.json();
  const before = await (
    await page.request.get(`/api/learning/exams/${id}/edit`)
  ).json();
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  const row = page.locator(`[data-exam-id="${id}"]`);
  await row
    .getByRole("button", { name: "Chỉnh sửa thông tin", exact: true })
    .click();
  const edit = page.getByRole("dialog", {
    name: "Chỉnh sửa bài kiểm tra",
    exact: true,
  });
  await expect(
    edit.getByRole("radio", { name: "Upload file", exact: true }),
  ).toBeChecked();
  await expect(edit).toContainText("1 câu đã chọn");
  await edit.getByLabel("Tên bộ câu").fill("Không lưu thay đổi");
  await page.keyboard.press("Escape");
  await expect(row).toContainText(question.text);
  await row
    .getByRole("button", { name: "Chỉnh sửa thông tin", exact: true })
    .click();
  await expect(edit.getByLabel("Tên bộ câu")).toHaveValue(question.text);
  await edit.getByLabel("Tên bộ câu").fill(question.text + " mới");
  await edit.getByRole("button", { name: "Lưu thay đổi", exact: true }).click();
  await expect(edit).toHaveCount(0);
  const after = await (
    await page.request.get(`/api/learning/exams/${id}/edit`)
  ).json();
  expect(after.questions).toEqual(before.questions);
  expect(after.title).toBe(question.text + " mới");
});

test("scheduled exam opens for students without a teacher browser or open command", async ({
  page,
}, info) => {
  await teacher(page);
  const starts = Date.now() + 8000;
  const r = await page.request.post("/api/classrooms/learning-class/exams", {
    data: {
      title: `Tự mở ${info.project.name} ${Date.now()}`,
      delivery: "online",
      source: "bank",
      chapterIds: ["learning-ch1"],
      questionCount: 2,
      scheduledStartAt: starts,
      preparationMinutes: 1,
      durationMinutes: 2,
    },
  });
  expect(r.ok()).toBe(true);
  const { id } = await r.json();
  let openCommands = 0;
  page.on("request", (r) => {
    if (r.url().endsWith(`/exams/${id}/open`)) openCommands++;
  });
  await page.request.post("/api/auth/login", {
    data: { email: "learning@greenedu.test", password: "LearningTest123!" },
  });
  await page.goto("/");
  await page
    .getByRole("region", { name: "Thông báo kiểm tra online" })
    .getByRole("button", { name: /^(Đã hiểu|Để sau)$/ })
    .click();
  await page.getByLabel("Chọn lớp học").selectOption("learning-class");
  await navigateTo(page, { name: "Kiểm tra", exact: true });
  const row = page.locator(`[data-exam-id="${id}"]`);
  await expect(
    row.getByRole("button", { name: "Chỉnh sửa thông tin", exact: true }),
  ).toHaveCount(0);
  const enter = row.getByRole("button", {
    name: "Vào làm kiểm tra",
    exact: true,
  });
  await expect(enter).toBeEnabled({ timeout: 15000 });
  await enter.click();
  await expect(page.locator(".exam-room")).toBeVisible();
  expect(openCommands).toBe(0);
  const edit = await page.request.get(`/api/learning/exams/${id}/edit`);
  expect(edit.status()).toBe(403);
  page.once("dialog", (dialog) => dialog.accept());
  const submitted = page.waitForResponse(
    (r) => r.url().endsWith("/submit") && r.request().method() === "POST",
  );
  await page
    .locator(".exam-room")
    .getByRole("button", { name: "Nộp bài", exact: true })
    .click();
  expect((await submitted).ok()).toBe(true);
});
