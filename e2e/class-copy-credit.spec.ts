import { test, expect } from "@playwright/test";
import { navigateTo } from "./navigation";

test("copy roster, configure exam credit, delete owned copy and keep original accounts", async ({
  page,
}, info) => {
  await page.request.post("/api/auth/login", {
    data: { email: "giaovien@greenedu.nk", password: "GreenEdu123!" },
  });
  await page.goto("/");
  await page.getByLabel("Chọn lớp học").selectOption("learning-class");
  await navigateTo(page, { name: "Lớp học của tôi", exact: true });
  await page.getByRole("button", { name: "Tạo lớp mới", exact: true }).click();
  let modal = page.getByRole("dialog");
  await modal
    .getByLabel("Lấy danh sách học sinh từ lớp")
    .selectOption("learning-class");
  await expect(modal.getByLabel("Khối lớp")).toHaveCount(0);
  const name = `Lớp sao chép ${info.project.name} ${Date.now()}`;
  await modal.getByLabel("Tên lớp", { exact: true }).fill(name);
  await modal.getByLabel("Môn học", { exact: true }).fill("Hóa học");
  await modal.screenshot({
    path: `.local/class-copy-form-${info.project.name}.png`,
  });
  await modal.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(modal).toHaveCount(0);
  const rooms = await (await page.request.get("/api/classrooms")).json();
  const copy = rooms.find((c: any) => c.name === name);
  const source = rooms.find((c: any) => c.id === "learning-class");
  expect(copy.chapters).toHaveLength(0);
  expect(copy.studentCount).toBe(source.studentCount);
  const originalRoster = await (
    await page.request.get("/api/classrooms/learning-class/students")
  ).json();
  await navigateTo(page, { name: "Quản lý lớp", exact: true });
  await page.getByRole("button", { name: "Xóa lớp", exact: true }).click();
  modal = page.getByRole("dialog", { name: "Xóa lớp học" });
  await expect(modal).toContainText("Tài khoản học sinh");
  await modal.getByRole("button", { name: "Hủy", exact: true }).click();
  await expect(modal).toHaveCount(0);
  await page.getByRole("button", { name: "Xóa lớp", exact: true }).click();
  await modal.getByLabel("Nhập tên lớp để xác nhận").fill(name);
  await modal.screenshot({
    path: `.local/class-delete-form-${info.project.name}.png`,
  });
  await modal.getByRole("button", { name: "Xóa lớp", exact: true }).click();
  await expect(modal).toHaveCount(0);
  expect(
    await (
      await page.request.get("/api/classrooms/learning-class/students")
    ).json(),
  ).toEqual(originalRoster);
  await page.getByLabel("Chọn lớp học").selectOption("learning-class");
  await navigateTo(page, { name: "Kiểm tra", exact: true });
  await page
    .getByRole("button", { name: "Tạo bài kiểm tra", exact: true })
    .click();
  modal = page.getByRole("dialog", { name: "Tạo bài kiểm tra", exact: true });
  await modal
    .getByLabel("Tên bộ câu")
    .fill(`Cộng giờ ${info.project.name} ${Date.now()}`);
  await modal
    .getByRole("radio", { name: "Chọn từ ngân hàng", exact: true })
    .check();
  await modal.getByLabel("Chương ôn I", { exact: true }).check();
  await modal.getByLabel("Số câu", { exact: true }).fill("2");
  const target = source.chapters[1];
  await modal
    .getByLabel("Cộng thời gian làm bài vào chương")
    .selectOption(target.id);
  await modal
    .getByLabel("Cộng thời gian làm bài vào chương")
    .scrollIntoViewIfNeeded();
  await modal.screenshot({
    path: `.local/class-copy-credit-${info.project.name}.png`,
  });
  await modal
    .getByRole("button", { name: "Lưu bài kiểm tra", exact: true })
    .click();
  const popup = page.getByRole("dialog", {
    name: "Đã tạo bài kiểm tra",
    exact: true,
  });
  await popup
    .getByRole("button", { name: "Chỉnh sửa thông tin", exact: true })
    .click();
  await expect(
    page.getByRole("dialog").getByLabel("Cộng thời gian làm bài vào chương"),
  ).toHaveValue(target.id);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Đóng", exact: true })
    .click();
  await expect(
    page
      .locator(".exam-metadata")
      .filter({ hasText: `Cộng giờ: ${target.title}` })
      .first(),
  ).toBeVisible();
});
