import { navigateTo } from "./navigation";
import { test, expect } from "@playwright/test";

test("teacher adds an empty lesson, duplicate is rejected, delete can be cancelled and restoration keeps one lesson", async ({
  page,
}, info) => {
  await page.goto("/");
  await page.getByLabel("Email", { exact: true }).fill("giaovien@greenedu.nk");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("GreenEdu123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByRole("navigation")).toBeVisible();
  await page.getByLabel("Chọn lớp học").selectOption("learning-class");
  await navigateTo(page, { name: "Chương học", exact: true });
  const chapter = page.locator(".chapter-row").filter({
    has: page.getByRole("heading", { name: "Chương ôn I", exact: true }),
  });
  const title = `Bài thêm ${info.project.name} ${Date.now()}`;
  async function add(value: string) {
    await chapter
      .getByRole("button", { name: "Thêm bài", exact: true })
      .click();
    const dialog = page.getByRole("dialog", { name: "Thêm bài học" });
    await dialog.getByLabel("Tên bài").fill(value);
    await dialog.getByRole("button", { name: "Thêm bài", exact: true }).click();
  }
  await add(title);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await chapter.getByText("Xem danh sách bài", { exact: true }).click();
  const lesson = chapter.locator(".lesson-row").filter({ hasText: title });
  await expect(lesson).toHaveCount(1);
  await expect(lesson).toContainText("Chưa có câu hỏi");
  const deleteButton = lesson.getByRole("button", { name: `Xóa bài · ${title}`, exact: true });
  await expect(deleteButton).toHaveText("");
  await expect(deleteButton.locator("svg")).toHaveCount(1);
  expect(await lesson.evaluate((row) => {
    const icon = row.querySelector("button")!.getBoundingClientRect();
    const name = row.querySelector("span")!.getBoundingClientRect();
    return icon.right <= name.left && icon.width >= 44 && icon.height >= 44;
  })).toBe(true);
  await chapter.screenshot({ path: info.outputPath("lesson-delete-icon.png") });
  await add(`  ${title.toLocaleLowerCase("vi")}  `);
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "đã có bài cùng tên",
  );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Hủy", exact: true })
    .click();
  await lesson
    .getByRole("button", { name: `Xóa bài · ${title}`, exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Xóa bài học" })
    .getByRole("button", { name: "Hủy", exact: true })
    .click();
  await expect(lesson).toHaveCount(1);
  await lesson
    .getByRole("button", { name: `Xóa bài · ${title}`, exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Xóa bài học" })
    .getByRole("button", { name: "Xóa bài", exact: true })
    .click();
  await expect(lesson).toHaveCount(0);
  await add(title);
  await expect(lesson).toHaveCount(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
