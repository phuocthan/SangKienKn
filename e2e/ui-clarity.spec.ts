import { test, expect, type Page } from "@playwright/test";
import { navigateTo } from "./navigation";

async function login(page: Page, role: "teacher" | "student") {
  const response = await page.request.post("/api/auth/login", {
    data:
      role === "teacher"
        ? { email: "giaovien@greenedu.nk", password: "GreenEdu123!" }
        : { email: "learning@greenedu.test", password: "LearningTest123!" },
  });
  expect(response.ok()).toBeTruthy();
  await page.goto("/");
  await page.getByLabel("Chọn lớp học").selectOption("learning-class");
}

test("student reaches practice content without a hero and keeps complete compact navigation", async ({
  page,
}, info) => {
  await login(page, "student");
  await expect(
    page.getByRole("heading", { level: 1, name: "Khu vườn của tôi" }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Việc cần làm" }),
  ).toBeVisible();
  await navigateTo(page, { name: "Luyện tập", exact: true });
  for (const viewport of [
    { width: 320, height: 740 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1440, height: 1000 },
  ]) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(
      page.getByRole("heading", { level: 1, name: "Luyện tập" }),
    ).toBeVisible();
    await expect(page.locator(".page-heading .eyebrow")).toHaveCount(0);
    const first = page.locator(".chapter-card").first();
    await expect(first).toBeInViewport();
    if (viewport.width <= 390) {
      const card = (await first.boundingBox())!;
      const dock = (await page.locator(".sidebar").boundingBox())!;
      expect(card.y + card.height).toBeLessThan(dock.y);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (viewport.width === 390 || viewport.width === 1440)
      await page.screenshot({
        path: `.local/ui-clarity-${info.project.name}-practice-${viewport.width}.png`,
      });
  }
});

test("teacher imports both formats from one action and reaches paired classroom settings", async ({
  page,
}, info) => {
  await login(page, "teacher");
  await expect(
    page.getByRole("heading", { level: 1, name: "Tổng quan" }),
  ).toBeVisible();
  await navigateTo(page, { name: "Ngân hàng câu hỏi", exact: true });
  await page.getByLabel("Chương câu hỏi").selectOption("learning-ch1");
  await expect(
    page.getByRole("button", { name: "Nhập câu hỏi", exact: true }),
  ).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: /Nhập file (Word|CSV)/ }),
  ).toHaveCount(0);
  const explanation = page.locator(".bank-explanation").first();
  await expect(explanation.locator("p")).toBeHidden();
  await explanation.locator("summary").click();
  await expect(explanation.locator("p")).toBeVisible();
  const management = page.getByLabel("Quản lý câu hỏi hàng loạt");
  await expect(
    management.getByRole("button", { name: "Xóa các câu đã chọn" }),
  ).toHaveCount(0);
  await page.getByLabel("Chọn câu hỏi:", { exact: false }).first().check();
  await expect(
    management.getByRole("button", { name: "Xóa các câu đã chọn" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Nhập câu hỏi", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Nhập bộ câu hỏi" });
  await expect(dialog.getByLabel("Định dạng file")).toHaveValue("word");
  await expect(
    dialog.getByRole("link", { name: "Tải mẫu Word (.docx)" }),
  ).toBeVisible();
  await dialog.getByLabel("Định dạng file").selectOption("csv");
  await expect(
    dialog.getByRole("button", { name: "Tải file mẫu" }),
  ).toBeVisible();
  await dialog.getByLabel("File câu hỏi CSV", { exact: true }).setInputFiles({
    name: "questions.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      "Bài học,Câu hỏi,A,B,C,D,Đáp án,Lời giải\nBài 1,Câu nhập xem trước,A,B,C,D,A,Đáp án A\n",
    ),
  });
  await expect(dialog).toContainText("Câu nhập xem trước");
  await page.keyboard.press("Escape");
  await navigateTo(page, { name: "Quản lý lớp", exact: true });
  await page
    .getByRole("group", { name: "Nội dung quản lý lớp" })
    .getByRole("button", { name: "Cài đặt chung" })
    .click();
  await expect(page.locator("#class-general")).toBeFocused();
  await expect(
    page.getByRole("group", { name: "Rời tab · lần", exact: true }),
  ).toBeVisible();
  const warning = page.getByLabel("Nhắc nhở khi rời tab (lần)", {
    exact: true,
  });
  const close = page.getByLabel("Tự đóng khi rời tab (lần)", { exact: true });
  await warning.fill(await close.inputValue());
  await expect(
    page.getByText(
      "Nhập số nguyên hợp lệ; ngưỡng nhắc nhở phải nhỏ hơn ngưỡng tự đóng.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Lưu thay đổi", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("group", { name: "Nội dung quản lý lớp" })
    .getByRole("button", { name: "Học sinh", exact: true })
    .click();
  await expect(page.locator("#class-students")).toBeFocused();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `.local/ui-clarity-${info.project.name}-class-management.png`,
  });
});

test("activity sections preserve a student's file and note when navigating by keyboard", async ({
  page,
}, info) => {
  await login(page, "teacher");
  const title = `Nhóm UI ${info.project.name} ${crypto.randomUUID().slice(0, 6)}`;
  const response = await page.request.post(
    "/api/classrooms/learning-class/group-activities",
    {
      multipart: {
        title,
        instructions: "Đọc yêu cầu, lập nhóm và nộp sản phẩm.",
        deadlineAt: String(Date.now() + 300000),
        groupCount: "1",
        requestId: crypto.randomUUID(),
      },
    },
  );
  expect(response.ok()).toBeTruthy();
  await login(page, "student");
  const tasks = page.getByRole("region", { name: "Việc cần làm" });
  await expect(tasks).toContainText(title);
  await tasks.getByRole("button", { name: new RegExp(title) }).click();
  await page.locator(".group-activity-card").filter({ hasText: title }).click();
  const tabs = page.getByRole("tablist", { name: "Nội dung hoạt động" });
  await expect(tabs.getByRole("tab")).toHaveText([
    "Yêu cầu",
    "Thành viên",
    "Bài nộp",
    "Trao đổi",
  ]);
  await expect(page.locator(".group-instructions").first()).toBeVisible();
  await tabs.getByRole("tab", { name: "Bài nộp", exact: true }).click();
  const form = page.locator(".group-submit-form");
  const file = form.locator('input[type="file"]');
  await file.setInputFiles({
    name: "bao-cao.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\n%%EOF"),
  });
  const note = form.locator("textarea");
  await note.fill("Bản đang soạn của nhóm.");
  await tabs.getByRole("tab", { name: "Yêu cầu", exact: true }).click();
  await expect(form).toBeHidden();
  await page.keyboard.press("ArrowRight");
  await expect(
    tabs.getByRole("tab", { name: "Thành viên", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(
    tabs.getByRole("tab", { name: "Bài nộp", exact: true }),
  ).toBeFocused();
  await expect(note).toHaveValue("Bản đang soạn của nhóm.");
  expect(
    await file.evaluate((node: HTMLInputElement) => node.files?.[0]?.name),
  ).toBe("bao-cao.pdf");
  await expect(
    form.getByRole("button", { name: "Nộp bài nhóm", exact: true }),
  ).toBeEnabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `.local/ui-clarity-${info.project.name}-group-submission.png`,
    fullPage: true,
  });
});

test("home tasks do not claim an empty inbox when a source fails and retry recovers", async ({
  page,
}) => {
  let fail = true;
  await page.route(
    "**/api/classrooms/learning-class/learning",
    async (route) => {
      if (fail)
        await route.fulfill({
          status: 503,
          json: { error: "Tạm thời không tải được" },
        });
      else await route.continue();
    },
  );
  await login(page, "teacher");
  const tasks = page.getByRole("region", { name: "Việc cần làm" });
  await expect(tasks).toContainText("Chưa tải đủ danh sách.");
  await expect(tasks).not.toContainText("Chưa có bài sắp đến hạn");
  fail = false;
  await tasks.getByRole("button", { name: "Thử lại", exact: true }).click();
  await expect(tasks).not.toContainText("Chưa tải đủ danh sách.");
});

test("a failed workspace download keeps navigation available and offers recovery", async ({
  page,
}) => {
  await login(page, "teacher");
  const chunk = /\/assets\/QuestionBank-[^/]+\.js$/;
  await page.route(chunk, (route) => route.abort());
  await navigateTo(page, { name: "Ngân hàng câu hỏi", exact: true });
  await expect(page.getByRole("alert")).toContainText(
    "Không tải được nội dung.",
  );
  await expect(
    page.getByRole("navigation", { name: "Điều hướng chính" }),
  ).toBeVisible();
  await page.unroute(chunk);
  await page
    .getByRole("button", { name: "Tải lại trang", exact: true })
    .click();
  await navigateTo(page, { name: "Ngân hàng câu hỏi", exact: true });
  await expect(
    page.getByRole("button", { name: "Nhập câu hỏi", exact: true }),
  ).toBeVisible();
});
