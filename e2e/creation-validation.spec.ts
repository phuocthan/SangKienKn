import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";

async function login(page: Page, role: "teacher" | "admin") {
  await page.goto("/");
  await page
    .getByLabel("Email", { exact: true })
    .fill(role === "admin" ? "admin@greenedu.test" : "giaovien@greenedu.nk");
  await page
    .getByLabel("Mật khẩu", { exact: true })
    .fill(role === "admin" ? "AdminTest123!" : "GreenEdu123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByRole("navigation")).toBeVisible();
}

async function classForm(page: Page, name: string) {
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Lớp học của tôi", exact: true })
    .click();
  await page.getByRole("button", { name: "Tạo lớp mới", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Tên lớp").fill(name);
  await dialog.getByLabel("Môn học").fill("Vật lý");
  await dialog.getByLabel("Khối lớp").fill("11");
  return dialog;
}

test("teacher creates a class/student and duplicate forms keep one class/account/member after reload", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const name = `Lớp ${info.project.name} ${randomUUID()}`;
  const email = `student-${randomUUID()}@example.test`;
  await login(page, "teacher");
  let dialog = await classForm(page, name);
  await dialog.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  const classes = await (await page.request.get("/api/classrooms")).json();
  const classroom = classes.find((c: { name: string }) => c.name === name);
  expect(classroom).toBeTruthy();

  dialog = await classForm(page, name.toUpperCase());
  await dialog.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("Lớp học đã tồn tại");
  await expect(dialog.getByLabel("Tên lớp")).toHaveValue(name.toUpperCase());
  await dialog.getByRole("button", { name: "Đóng", exact: true }).click();

  async function studentForm(existing = false, duplicate = false) {
    await page
      .getByRole("button", { name: "Thêm học sinh", exact: true })
      .click();
    const form = page.getByRole("dialog");
    if (existing)
      await form.getByLabel("Loại tài khoản").selectOption("existing");
    else {
      await form
        .getByLabel("Họ tên")
        .fill(duplicate ? "Tên thay thế" : "Học sinh kiểm thử");
      await form
        .getByLabel("Mật khẩu tạm", { exact: true })
        .fill(duplicate ? "Replacement123!" : "TempPass123!");
    }
    await form
      .getByLabel("Email", { exact: true })
      .fill(duplicate ? email.toUpperCase() : email);
    await form.getByRole("button", { name: "Lưu", exact: true }).click();
    return form;
  }
  dialog = await studentForm();
  await expect(dialog).toHaveCount(0);
  dialog = await studentForm(false, true);
  await expect(dialog.getByRole("alert")).toContainText("Email đã tồn tại");
  await dialog.getByRole("button", { name: "Đóng", exact: true }).click();
  dialog = await studentForm(true, true);
  await expect(dialog.getByRole("alert")).toContainText(
    "Học sinh đã có trong lớp",
  );
  await dialog.getByRole("button", { name: "Đóng", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("navigation")).toBeVisible();
  const after = await (await page.request.get("/api/classrooms")).json();
  expect(after.filter((c: { name: string }) => c.name === name)).toHaveLength(
    1,
  );
  const roster = await (
    await page.request.get(`/api/classrooms/${classroom.id}/students`)
  ).json();
  expect(roster).toHaveLength(1);
  expect(roster[0]).toMatchObject({
    name: "Học sinh kiểm thử",
    email,
    seconds: 0,
    total: 0,
  });
  const student = await page.request.post("/api/auth/login", {
    data: { email, password: "TempPass123!" },
  });
  expect(student.status()).toBe(200);
  expect((await student.json()).mustChange).toBe(true);
  expect(errors).toEqual([]);
});

test("admin validates required fields, disables pending submit and rejects duplicate teacher/student email", async ({
  page,
}) => {
  await login(page, "admin");
  for (const role of ["teacher", "student"]) {
    const email = `${role}-${randomUUID()}@example.test`;
    await page
      .getByRole("button", { name: "Tạo tài khoản", exact: true })
      .click();
    let dialog = page.getByRole("dialog");
    await dialog.getByLabel("Vai trò", { exact: true }).selectOption(role);
    await dialog
      .getByRole("button", { name: "Tạo tài khoản", exact: true })
      .click();
    await expect(dialog).toBeVisible();
    expect(
      await dialog
        .getByLabel("Họ tên")
        .evaluate((el: HTMLInputElement) => el.validity.valueMissing),
    ).toBe(true);
    await dialog.getByLabel("Họ tên").fill(`Tài khoản ${role}`);
    await dialog.getByLabel("Email", { exact: true }).fill(email);
    await dialog
      .getByLabel("Mật khẩu tạm", { exact: true })
      .fill("TempPass123!");
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    let posts = 0;
    await page.route("**/api/accounts", async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      posts++;
      const response = await route.fetch();
      await pending;
      await route.fulfill({ response });
    });
    await dialog
      .getByRole("button", { name: "Tạo tài khoản", exact: true })
      .click();
    try {
      await expect(
        dialog.getByRole("button", { name: "Đang lưu…", exact: true }),
      ).toBeDisabled();
      await expect(dialog.getByLabel("Email", { exact: true })).toBeDisabled();
    } finally {
      release();
    }
    await expect(dialog).toHaveCount(0);
    expect(posts).toBe(1);
    await page.unroute("**/api/accounts");
    await page
      .getByRole("button", { name: "Tạo tài khoản", exact: true })
      .click();
    dialog = page.getByRole("dialog");
    await dialog
      .getByLabel("Vai trò", { exact: true })
      .selectOption(role === "teacher" ? "student" : "teacher");
    await dialog.getByLabel("Họ tên").fill("Tên thay thế");
    await dialog.getByLabel("Email", { exact: true }).fill(email.toUpperCase());
    await dialog
      .getByLabel("Mật khẩu tạm", { exact: true })
      .fill("Replacement123!");
    await dialog
      .getByRole("button", { name: "Tạo tài khoản", exact: true })
      .click();
    await expect(dialog.getByRole("alert")).toContainText("Email đã tồn tại");
    await dialog.getByRole("button", { name: "Hủy", exact: true }).click();
    await page.getByLabel("Tìm tài khoản").fill(email);
    const accounts = await (await page.request.get("/api/accounts")).json();
    expect(
      accounts.filter((u: { email: string }) => u.email === email),
    ).toHaveLength(1);
    expect(
      accounts.find((u: { email: string }) => u.email === email).role,
    ).toBe(role);
    await expect(page.getByText(email, { exact: true })).toBeVisible();
  }
});

test("retry after lost class-create response reports duplicate and retains one saved class", async ({
  page,
}, info) => {
  await login(page, "teacher");
  const name = `Mất phản hồi ${info.project.name} ${randomUUID()}`;
  const dialog = await classForm(page, name);
  await page.route(
    "**/api/classrooms",
    async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      const response = await route.fetch();
      expect(response.status()).toBe(201);
      await route.abort("failed");
    },
    { times: 1 },
  );
  await dialog.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(dialog.getByRole("alert")).toBeVisible();
  await dialog.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("Lớp học đã tồn tại");
  await dialog.getByRole("button", { name: "Đóng", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("navigation")).toBeVisible();
  const classes = await (await page.request.get("/api/classrooms")).json();
  expect(classes.filter((c: { name: string }) => c.name === name)).toHaveLength(
    1,
  );
});
