import { navigateTo } from "./navigation";
import { acknowledgeOnlineExamCreated } from "./online-exam-created";
import { test, expect, type Page } from "@playwright/test";

async function login(page: Page, teacher: boolean) {
  await page.goto("/");
  await page
    .getByLabel("Email", { exact: true })
    .fill(teacher ? "giaovien@greenedu.nk" : "learning@greenedu.test");
  await page
    .getByLabel("Mật khẩu", { exact: true })
    .fill(teacher ? "GreenEdu123!" : "LearningTest123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  if (teacher)
    await page.getByLabel("Chọn lớp học").selectOption("learning-class");
  await navigateTo(page, {
    name: teacher ? "Kiểm tra online" : "Kiểm tra online",
    exact: true,
  });
  await expect(
    page.getByRole("heading", {
      name: teacher ? "Kiểm tra online" : "Kiểm tra online",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Quản lý cấp độ", exact: true }),
  ).toHaveCount(0);
  if (teacher) {
    await expect(page.locator(".learning-form")).toHaveCount(0);
    await page
      .getByRole("button", { name: "Tạo bài kiểm tra", exact: true })
      .click();
  }
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}
test.afterEach(async ({ request }) => {
  await request.post("/api/auth/login", {
    data: { email: "giaovien@greenedu.nk", password: "GreenEdu123!" },
  });
  const data = await (
    await request.get("/api/classrooms/learning-class/learning")
  ).json();
  for (const ex of data.exams)
    if (ex.enabled && ex.delivery === "online")
      await request.post(`/api/learning/exams/${ex.id}/state`, {
        data: { enabled: false },
      });
});

test("online manager requires one source and supports whole chapter plus selected lessons in another chapter", async ({
  page,
}, info) => {
  await login(page, true);
  const form = page.locator(".learning-form");
  const save = form.getByRole("button", {
    name: "Lưu bài kiểm tra",
    exact: true,
  });
  await expect(form.getByRole("radio", { checked: true })).toHaveCount(0);
  await expect(save).toBeDisabled();
  await form
    .getByRole("radio", { name: "Chọn từ ngân hàng", exact: true })
    .check();
  await expect(form.getByRole("radio", { checked: true })).toHaveCount(1);
  await form.getByLabel("Chương ôn I", { exact: true }).check();
  await form.getByLabel("Chương ôn II", { exact: true }).check();
  await form
    .getByLabel("Toàn chương · Chương ôn II", { exact: true })
    .uncheck();
  await form.getByLabel("Chương ôn II · Bài 2", { exact: false }).check();
  await expect(
    form.getByLabel("Toàn chương · Chương ôn I", { exact: true }),
  ).toBeChecked();
  await form.getByLabel("Số câu", { exact: true }).fill("6");
  await form
    .getByLabel("Tên bộ câu")
    .fill(`Manager bank ${info.project.name} ${Date.now()}`);
  await noOverflow(page);
  await page.screenshot({
    path: info.outputPath("online-manager-bank.png"),
    fullPage: true,
  });
  const responsePromise = page.waitForResponse(
    (r) =>
      r.url().endsWith("/classrooms/learning-class/exams") &&
      r.request().method() === "POST",
  );
  await save.click();
  const response = await responsePromise;
  expect(response.ok()).toBe(true);
  const payload = response.request().postDataJSON();
  expect(payload.source).toBe("bank");
  expect(payload.questions).toBeUndefined();
  expect(payload.chapterIds.sort()).toEqual(["learning-ch1", "learning-ch2"]);
  expect(payload.lessonKeys.sort()).toEqual([
    "learning-ch1::Bài 1",
    "learning-ch1::Bài 2",
    "learning-ch2::Bài 2",
  ]);
  await acknowledgeOnlineExamCreated(page);
  await navigateTo(page, { name: "Ôn tập & kiểm tra", exact: true });
  await expect(
    page.getByRole("heading", { name: "Ôn tập", exact: true }),
  ).toBeVisible();
  await expect(page.getByText(payload.title, { exact: true })).toHaveCount(0);
});

test("Word upload reads both real 15-question files without prior chapter checks, rejects corrupt and duplicate files, and submits an exclusive upload source", async ({
  page,
}, info) => {
  await login(page, true);
  const form = page.locator(".learning-form");
  await form.getByRole("radio", { name: "Upload file", exact: true }).check();
  const file = form.getByLabel("File đề (.docx hoặc .csv)");
  await expect(file).toBeEnabled();
  await file.setInputFiles({
    name: "broken.docx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    buffer: Buffer.from("not a Word document"),
  });
  await expect(form.getByRole("alert")).toContainText("File không phải Word");
  await expect(form).toContainText("0 câu đã chọn");
  await file.setInputFiles(
    "artifacts/question-banks/bo-cau-hoi-vui-1-do-vui-quanh-em.docx",
  );
  await expect(form).toContainText("15 câu đã chọn");
  await file.setInputFiles(
    "artifacts/question-banks/bo-cau-hoi-vui-1-do-vui-quanh-em.docx",
  );
  await expect(form.getByRole("alert")).toContainText("câu trùng");
  await expect(form).toContainText("15 câu đã chọn");
  await form.getByLabel("Chương cho file tải lên").selectOption("learning-ch2");
  await file.setInputFiles(
    "artifacts/question-banks/bo-cau-hoi-vui-2-vui-hoc-moi-ngay.docx",
  );
  await expect(form).toContainText("30 câu đã chọn");
  await form
    .getByRole("radio", { name: "Chọn từ ngân hàng", exact: true })
    .check();
  await expect(form.getByRole("radio", { checked: true })).toHaveCount(1);
  await expect(
    form.getByRole("button", { name: "Lưu bài kiểm tra" }),
  ).toBeDisabled();
  await form.getByRole("radio", { name: "Upload file", exact: true }).check();
  await expect(form).toContainText("30 câu đã chọn");
  await form
    .getByLabel("Tên bộ câu")
    .fill(`Manager Word ${info.project.name} ${Date.now()}`);
  await noOverflow(page);
  await form.screenshot({ path: info.outputPath("online-manager-upload.png") });
  const responsePromise = page.waitForResponse(
    (r) =>
      r.url().endsWith("/classrooms/learning-class/exams") &&
      r.request().method() === "POST",
  );
  await form.getByRole("button", { name: "Lưu bài kiểm tra" }).click();
  const response = await responsePromise;
  expect(response.ok()).toBe(true);
  const payload = response.request().postDataJSON();
  expect(payload.source).toBe("upload");
  expect(payload.lessonKeys).toBeUndefined();
  expect(payload.questions).toHaveLength(30);
  expect(payload.chapterIds.sort()).toEqual(["learning-ch1", "learning-ch2"]);
  await acknowledgeOnlineExamCreated(page);
});

test("student online page manages preparations separately from hunt eligibility", async ({
  page,
}, info) => {
  await login(page, true);
  const form = page.locator(".learning-form");
  await form
    .getByRole("radio", { name: "Chọn từ ngân hàng", exact: true })
    .check();
  await form.getByLabel("Chương ôn I", { exact: true }).check();
  await form.getByLabel("Số câu", { exact: true }).fill("2");
  const title = `Manager student ${info.project.name} ${Date.now()}`;
  await form.getByLabel("Tên bộ câu").fill(title);
  await form.getByRole("button", { name: "Lưu bài kiểm tra" }).click();
  await acknowledgeOnlineExamCreated(page);
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await login(page, false);
  await expect(page.getByText(title, { exact: true })).toBeVisible();
  await expect(
    page
      .getByRole("button", { name: "Chờ giáo viên bắt đầu", exact: true })
      .last(),
  ).toBeDisabled();
  await expect(
    page.getByRole("heading", { name: "Cấp độ & vé Săn thưởng" }),
  ).toHaveCount(0);
  await noOverflow(page);
  await page.screenshot({
    path: info.outputPath("online-manager-student.png"),
    fullPage: true,
  });
});
