import { test, expect, type Page } from "@playwright/test";
import { navigateTo } from "./navigation";
import {
  onlineExamCreatedMessage,
  acknowledgeOnlineExamCreated,
} from "./online-exam-created";

async function teacherOnline(page: Page) {
  await page.request.post("/api/auth/login", {
    data: { email: "giaovien@greenedu.nk", password: "GreenEdu123!" },
  });
  await page.goto("/");
  await page.getByLabel("Chọn lớp học").selectOption("learning-class");
  await navigateTo(page, { name: "Kiểm tra", exact: true });
}

async function saveExam(page: Page, title: string, preparation = 2) {
  await page
    .getByRole("button", { name: "Tạo bài kiểm tra", exact: true })
    .click();
  const form = page.getByRole("dialog", {
    name: "Tạo bài kiểm tra",
    exact: true,
  });
  await form.getByLabel("Tên bộ câu").fill(title);
  await form
    .getByRole("radio", { name: "Chọn từ ngân hàng", exact: true })
    .check();
  await form.getByLabel("Chương ôn I", { exact: true }).check();
  await form.getByLabel("Số câu", { exact: true }).fill("2");
  await form.getByLabel("Thời gian chuẩn bị (phút)").fill(String(preparation));
  await form.getByLabel("Thời gian làm bài (phút)").fill("15");
  const saved = page.waitForResponse(
    (response) =>
      response.url().endsWith("/classrooms/learning-class/exams") &&
      response.request().method() === "POST",
  );
  await form
    .getByRole("button", { name: "Lưu bài kiểm tra", exact: true })
    .click();
  const response = await saved;
  expect(response.ok()).toBe(true);
  return (await response.json()).id as string;
}

test.afterEach(async ({ request }) => {
  await request.post("/api/auth/login", {
    data: { email: "giaovien@greenedu.nk", password: "GreenEdu123!" },
  });
  const data = await (
    await request.get("/api/classrooms/learning-class/learning")
  ).json();
  for (const exam of data.exams)
    if (exam.enabled && exam.delivery === "online")
      await request.post(`/api/learning/exams/${exam.id}/state`, {
        data: { enabled: false },
      });
});

test("successful creation shows the exact popup; understood keeps the exam unstarted and restores keyboard focus", async ({
  page,
}, info) => {
  await teacherOnline(page);
  const opened: string[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith("/open")) opened.push(request.url());
  });
  const id = await saveExam(
    page,
    `Popup hiểu ${info.project.name} ${Date.now()}`,
  );
  const popup = page.getByRole("dialog", {
    name: "Đã tạo bài kiểm tra",
    exact: true,
  });
  await expect(popup).toContainText(onlineExamCreatedMessage);
  await expect(
    page.getByRole("dialog", { name: "Tạo bài kiểm tra", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".learning-notice")).toHaveCount(0);
  await expect(
    popup.getByRole("button", { name: "Bắt đầu ngay", exact: true }),
  ).toBeEnabled();
  await expect(
    popup.getByRole("button", { name: "Để sau", exact: true }),
  ).toBeEnabled();
  await popup.screenshot({ path: info.outputPath("online-created-popup.png") });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await popup.evaluate(
        (element) => element.scrollWidth <= element.clientWidth,
      ),
    ).toBe(true);
    const box = await popup.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
  }
  await acknowledgeOnlineExamCreated(page);
  await expect(
    page.getByRole("button", { name: "Tạo bài kiểm tra", exact: true }),
  ).toBeFocused();
  const group = page.locator(`[data-exam-id="${id}"]`);
  await expect(group).toContainText("Chưa ấn định");
  expect(opened).toHaveLength(0);
  await page.reload();
  await expect(popup).toHaveCount(0);
  await page.getByLabel("Chọn lớp học").selectOption("learning-class");
  await navigateTo(page, { name: "Kiểm tra", exact: true });
  await expect(
    group.getByRole("button", { name: "Bắt đầu kiểm tra", exact: true }),
  ).toBeEnabled();
});

test("start now retries safely, locks both choices while pending, and starts only the newly saved exam ID", async ({
  page,
}, info) => {
  await teacherOnline(page);
  const title = `Popup trùng tên ${info.project.name} ${Date.now()}`;
  const previousId = await saveExam(page, title, 2);
  await acknowledgeOnlineExamCreated(page);
  const id = await saveExam(page, title, 0);
  expect(id).not.toBe(previousId);
  const popup = page.getByRole("dialog", {
    name: "Đã tạo bài kiểm tra",
    exact: true,
  });
  const start = popup.getByRole("button", {
    name: "Bắt đầu ngay",
    exact: true,
  });
  const endpoint = `**/api/learning/exams/${id}/open`;
  let requests = 0,
    release: (() => void) | undefined;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(endpoint, async (route) => {
    requests++;
    if (requests === 1)
      return route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({
          error: "Nguồn đề tạm thiếu câu. Vui lòng thử lại.",
        }),
      });
    await gate;
    await route.continue();
  });
  await start.click();
  await expect(popup.getByRole("alert")).toContainText(
    "Nguồn đề tạm thiếu câu",
  );
  await expect(start).toBeEnabled();
  await expect(page.locator(`[data-exam-id="${id}"]`)).toContainText(
    "Chưa ấn định",
  );
  await start.click();
  await expect(
    popup.getByRole("button", { name: "Đang bắt đầu…", exact: true }),
  ).toBeDisabled();
  await expect(
    popup.getByRole("button", { name: "Để sau", exact: true }),
  ).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(popup).toBeVisible();
  expect(requests).toBe(2);
  release!();
  await expect(popup).toHaveCount(0);
  await expect(
    page.locator(`[data-exam-id="${id}"] .online-exam-state`),
  ).toHaveText("Đang thi");
  await expect(page.locator(`[data-exam-id="${previousId}"]`)).toContainText(
    "Chưa ấn định",
  );
  await expect(page.locator(".learning-notice")).toContainText(
    "sau 0 phút, thời gian làm bài 15 phút",
  );
  await expect(
    page.getByRole("button", { name: "Tạo bài kiểm tra", exact: true }),
  ).toBeFocused();
});

test("failed creation keeps the form and never displays a success popup", async ({
  page,
}, info) => {
  await teacherOnline(page);
  await page.route("**/api/classrooms/learning-class/exams", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Không lưu được bài kiểm tra. Thử lại." }),
    }),
  );
  await page
    .getByRole("button", { name: "Tạo bài kiểm tra", exact: true })
    .click();
  const form = page.getByRole("dialog", {
    name: "Tạo bài kiểm tra",
    exact: true,
  });
  await form
    .getByRole("radio", { name: "Chọn từ ngân hàng", exact: true })
    .check();
  await form.getByLabel("Chương ôn I", { exact: true }).check();
  await form.getByLabel("Số câu", { exact: true }).fill("2");
  await form
    .getByLabel("Tên bộ câu")
    .fill(`Popup lỗi ${info.project.name} ${Date.now()}`);
  await form
    .getByRole("button", { name: "Lưu bài kiểm tra", exact: true })
    .click();
  await expect(form.getByRole("alert")).toContainText(
    "Không lưu được bài kiểm tra",
  );
  await expect(
    page.getByRole("dialog", { name: "Đã tạo bài kiểm tra", exact: true }),
  ).toHaveCount(0);
});
