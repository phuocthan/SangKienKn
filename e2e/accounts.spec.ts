import { navigateTo } from "./navigation";
import { test, expect, type Page } from "@playwright/test";

async function login(page: Page, email: string, password: string) {
  await page.goto("/");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
}
async function changeTemporary(page: Page) {
  await page.getByLabel("Mật khẩu hiện tại").fill("TempPass123!");
  await page
    .getByLabel("Mật khẩu mới", { exact: true })
    .fill("OwnPassword123!");
  await page.getByLabel("Nhập lại mật khẩu mới").fill("OwnPassword123!");
  await page.getByRole("button", { name: "Lưu mật khẩu" }).click();
  await expect(page.getByRole("navigation")).toBeVisible();
}
async function checkLayout(page: Page, name: string, project: string) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.evaluate(() => document.fonts.ready);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    `${name} must fit viewport`,
  ).toBeTruthy();
  await page.screenshot({
    path: `.local/ui-${project}-${name}.png`,
    fullPage: true,
  });
}

test("admin creates teacher/student; teacher changes password, creates student and enrolls an existing student", async ({
  page,
  browser,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const stamp = `${info.project.name}-${Date.now()}`;
  const teacherEmail = `teacher-${stamp}@example.test`,
    studentEmail = `student-${stamp}@example.test`;
  await login(page, "admin@greenedu.test", "AdminTest123!");
  await expect(
    page.getByRole("heading", { name: "Quản lý tài khoản" }),
  ).toBeVisible();
  async function create(role: string, name: string, email: string) {
    await page
      .getByRole("button", { name: "Tạo tài khoản", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Vai trò", { exact: true }).selectOption(role);
    await dialog.getByLabel("Họ tên").fill(name);
    await dialog.getByLabel("Email", { exact: true }).fill(email);
    await dialog
      .getByLabel("Mật khẩu tạm", { exact: true })
      .fill("TempPass123!");
    await checkLayout(page, `account-dialog-${role}`, info.project.name);
    await dialog
      .getByRole("button", { name: "Tạo tài khoản", exact: true })
      .click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole("status")).toContainText(email);
  }
  await create("teacher", "Giáo viên mới", teacherEmail);
  await create("student", "Học sinh do Admin tạo", studentEmail);
  await page.getByLabel("Tìm tài khoản").fill(studentEmail);
  await expect(page.getByRole("cell", { name: /Chưa vào lớp$/ })).toBeVisible();
  await checkLayout(page, "admin-accounts", info.project.name);
  const teacherContext = await browser.newContext(info.project.use);
  const teacher = await teacherContext.newPage();
  try {
    await login(teacher, teacherEmail, "TempPass123!");
    await changeTemporary(teacher);
    await teacher
      .getByRole("button", { name: "Tạo lớp học", exact: true })
      .click();
    let dialog = teacher.getByRole("dialog");
    await dialog.getByLabel("Tên lớp").fill(`Lớp tài khoản ${stamp}`);
    await dialog.getByLabel("Môn học").fill("Toán");
    await dialog.getByLabel("Khối lớp").fill("10");
    await dialog.getByRole("button", { name: "Lưu" }).click();
    await expect(dialog).toHaveCount(0);
    await teacher
      .getByRole("button", { name: "Thêm học sinh", exact: true })
      .click();
    dialog = teacher.getByRole("dialog");
    await dialog.getByLabel("Loại tài khoản").selectOption("existing");
    await dialog.getByLabel("Email", { exact: true }).fill(studentEmail);
    await dialog.getByRole("button", { name: "Lưu" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(
      teacher.getByRole("cell").filter({ hasText: studentEmail }),
    ).toBeVisible();
    await teacher
      .getByRole("button", { name: "Thêm học sinh", exact: true })
      .click();
    dialog = teacher.getByRole("dialog");
    await dialog.getByLabel("Họ tên").fill("Học sinh do giáo viên tạo");
    await dialog
      .getByLabel("Email", { exact: true })
      .fill(`teacherstudent-${stamp}@example.test`);
    await dialog
      .getByLabel("Mật khẩu tạm", { exact: true })
      .fill("TempPass123!");
    await dialog.getByRole("button", { name: "Lưu" }).click();
    await expect(dialog).toHaveCount(0);
    await checkLayout(teacher, "teacher-students", info.project.name);
    const studentContext = await browser.newContext(info.project.use);
    try {
      const student = await studentContext.newPage();
      await login(student, studentEmail, "TempPass123!");
      await changeTemporary(student);
      await expect(student.getByLabel("Chọn lớp học")).toContainText(
        `Lớp tài khoản ${stamp}`,
      );
      await checkLayout(student, "new-student-home", info.project.name);
    } finally {
      await studentContext.close();
    }
    // Admin can recover both kinds of account; it revokes the old login.
    await page.getByRole("button", { name: "Cấp lại mật khẩu" }).click();
    dialog = page.getByRole("dialog");
    await dialog.getByLabel("Mật khẩu tạm mới").fill("ResetPassword123!");
    await dialog.getByRole("button", { name: "Cấp mật khẩu tạm" }).click();
    await expect(dialog).toHaveCount(0);
  } finally {
    await teacherContext.close();
  }
  expect(errors).toEqual([]);
});

test("all teacher/student pages fit desktop/mobile and group filters show real data", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await login(page, "giaovien@greenedu.nk", "GreenEdu123!");
  await expect(page.getByRole("navigation")).toBeVisible();
  await page.getByLabel("Chọn lớp học").selectOption("class-demo");
  for (const [label, name] of [
    ["Tổng quan", "teacher-home"],
    ["Lớp học của tôi", "classes"],
    ["Ngân hàng câu hỏi", "questions"],
    ["Tiến độ học tập", "teacher-progress"],
    ["Khu vườn của lớp", "teacher-garden"],
    ["Xếp hạng chăm chỉ", "teacher-leaderboard"],
    ["Hoạt động nhóm", "groups-empty"],
  ]) {
    await navigateTo(page, { name: label, exact: true });
    await checkLayout(page, name, info.project.name);
  }
  // Create through the actual API; only the group presentation is under review here.
  const form = new FormData();
  form.set("title", `Hoạt động UI ${info.project.name}`);
  form.set(
    "instructions",
    "Cùng thiết kế một sản phẩm xanh. Mỗi nhóm trình bày ý tưởng, cách thực hiện và kết quả.",
  );
  form.set("groupCount", "2");
  form.set("deadlineAt", String(Date.now() + 86400000));
  form.set("requestId", crypto.randomUUID());
  const response = await page.request.post(
    "/api/classrooms/class-demo/group-activities",
    {
      multipart: Object.fromEntries(
        [...form.entries()].map(([key, value]) => [key, String(value)]),
      ),
    },
  );
  expect(response.ok()).toBeTruthy();
  await page.getByRole("button", { name: "Cập nhật", exact: true }).click();
  await page
    .getByLabel("Tìm hoạt động")
    .fill(`Hoạt động UI ${info.project.name}`);
  await expect(page.locator(".group-activity-card")).toHaveCount(1);
  await checkLayout(page, "groups-list", info.project.name);
  await page.locator(".group-activity-card").click();
  await expect(page.locator(".group-roster")).toHaveCount(2);
  await page.getByRole("button", { name: "Đã nộp (0)", exact: true }).click();
  await expect(page.getByText("Không có nhóm ở trạng thái này")).toBeVisible();
  await page.getByRole("button", { name: "Tất cả (2)", exact: true }).click();
  await checkLayout(page, "groups-detail", info.project.name);
  await page.getByRole("button", { name: "Tài khoản", exact: true }).click();
  await checkLayout(page, "teacher-settings", info.project.name);
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await login(page, "hocsinh@greenedu.nk", "GreenEdu123!");
  await expect(page.getByRole("navigation")).toBeVisible();
  for (const [label, name] of [
    ["Khu vườn của tôi", "student-home"],
    ["Luyện tập", "practice"],
    ["Sổ tay sửa sai", "corrections"],
    ["Hành trình của tôi", "student-progress"],
    ["Khu vườn của lớp", "student-garden"],
    ["Xếp hạng chăm chỉ", "student-leaderboard"],
    ["Hoạt động nhóm", "student-groups"],
  ]) {
    await navigateTo(page, { name: label, exact: true });
    await checkLayout(page, name, info.project.name);
  }
  await page
    .locator(".group-activity-card")
    .filter({ hasText: `Hoạt động UI ${info.project.name}` })
    .click();
  await expect(page.locator(".group-roster")).toHaveCount(1);
  await checkLayout(page, "student-group-detail", info.project.name);
  expect(errors).toEqual([]);
});
