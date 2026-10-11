import { test, expect } from "@playwright/test";

test("teacher and student quick access uses database defaults and survives reload", async ({
  page,
}, info) => {
  await page.goto("/");
  const teacher = page.getByRole("button", {
    name: "Vào nhanh Giáo viên",
    exact: true,
  });
  const student = page.getByRole("button", {
    name: "Vào nhanh Học sinh",
    exact: true,
  });
  await expect(teacher).toContainText("Nguyễn Minh Anh");
  await expect(student).toContainText("Trần Hà Linh");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: `.local/ui-${info.project.name}-quick-login.png`,
    fullPage: true,
  });
  await teacher.click();
  await expect(
    page.getByRole("heading", { name: "Một lớp học, nhiều cơ hội lớn lên." }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Một lớp học, nhiều cơ hội lớn lên." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await student.click();
  await expect(
    page.getByRole("heading", { name: "Chào Hà Linh, hôm nay mình học gì?" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Lớp học của tôi", exact: true }),
  ).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Chào Hà Linh, hôm nay mình học gì?" }),
  ).toBeVisible();
});
