import { test, expect } from "@playwright/test";
import { navigateTo } from "./navigation";

test("management owns the roster, preserves honors and confirms chapter deletion", async ({
  page,
}, info) => {
  await page.request.post("/api/auth/login", {
    data: { email: "giaovien@greenedu.nk", password: "GreenEdu123!" },
  });
  await page.goto("/");
  await page.getByLabel("Chọn lớp học").selectOption("learning-class");
  await navigateTo(page, { name: "Lớp học của tôi", exact: true });
  await expect(page.locator(".roster-card")).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "Vinh danh Top 10" }),
  ).toBeVisible();
  await navigateTo(page, { name: "Quản lý lớp", exact: true });
  await expect(page.locator(".roster-card")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Quản lý chương", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Quản lý cấp độ", exact: true }),
  ).toBeVisible();
  const title = `Chương thử xóa ${info.project.name}`;
  const created = await page.request.post(
    "/api/classrooms/learning-class/chapters",
    { data: { title } },
  );
  expect(created.ok()).toBe(true);
  const { id } = await created.json();
  await page.reload();
  await navigateTo(page, { name: "Ngân hàng câu hỏi", exact: true });
  await page.getByLabel("Chương câu hỏi").selectOption(id);
  await navigateTo(page, { name: "Quản lý lớp", exact: true });
  const row = page
    .locator(".chapter-row")
    .filter({ has: page.getByRole("heading", { name: title, exact: true }) });
  await row
    .getByRole("button", { name: `Xóa chương · ${title}`, exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Xóa chương", exact: true });
  await expect(dialog).toContainText("Bạn có chắc chắn");
  await expect(dialog).toContainText(title);
  await dialog.getByRole("button", { name: "Hủy", exact: true }).click();
  await expect(row).toBeVisible();
  await row
    .getByRole("button", { name: `Xóa chương · ${title}`, exact: true })
    .click();
  await dialog.getByRole("button", { name: "Xóa chương", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(row).toHaveCount(0);
  await expect(
    page.getByRole("status").filter({ hasText: "Đã xóa chương" }),
  ).toBeVisible();
  for (const width of [320, 390, 768, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  const classes = await (await page.request.get("/api/classrooms")).json();
  expect(
    classes
      .find((c: { id: string }) => c.id === "learning-class")
      .chapters.some((c: { id: string }) => c.id === id),
  ).toBe(false);
  await navigateTo(page, { name: "Ngân hàng câu hỏi", exact: true });
  await expect(page.getByLabel("Chương câu hỏi")).not.toHaveValue(id);
  await navigateTo(page, { name: "Quản lý lớp", exact: true });
  await page.screenshot({
    path: info.outputPath("class-management.png"),
    fullPage: true,
  });
});

test("old server capability keeps chapter deletion unavailable", async ({
  page,
}) => {
  await page.request.post("/api/auth/login", {
    data: { email: "giaovien@greenedu.nk", password: "GreenEdu123!" },
  });
  await page.route("**/api/classrooms", async (route) => {
    const response = await route.fetch();
    const classes = await response.json();
    for (const c of classes)
      for (const chapter of c.chapters) delete chapter.canDeleteChapter;
    await route.fulfill({ response, json: classes });
  });
  await page.goto("/");
  await navigateTo(page, { name: "Quản lý lớp", exact: true });
  await expect(
    page.getByRole("button", { name: /^Xóa chương ·/ }).first(),
  ).toBeDisabled();
});
