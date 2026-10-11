import { test, expect, type Page } from "@playwright/test";
import { strToU8, zipSync } from "fflate";
import { readFile } from "node:fs/promises";
import type { GroupActivity } from "../shared/group-activities";

async function teacherLogin(page: Page) {
  await page.goto("/");
  await page
    .getByLabel("Email", { exact: true })
    .fill("giaovien@greenedu.nk");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("GreenEdu123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByRole("navigation")).toBeVisible();
}
async function post(page: Page, path: string, data: unknown) {
  const response = await page.request.post(`/api${path}`, { data });
  expect(response.ok()).toBeTruthy();
  return response.json();
}
async function studentLogin(page: Page, email: string) {
  await page.goto("/");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill("TempPass123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.getByLabel("Mật khẩu hiện tại").fill("TempPass123!");
  await page.getByLabel("Mật khẩu mới", { exact: true }).fill("OwnPass123!");
  await page.getByLabel("Nhập lại mật khẩu mới").fill("OwnPass123!");
  await page.getByRole("button", { name: "Lưu mật khẩu" }).click();
  await expect(page.getByRole("navigation")).toBeVisible();
}
async function openGroups(page: Page) {
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Hoạt động nhóm", exact: true })
    .click();
}

test("teacher creates a Word group activity, changes representative; student uploads and retries, then sends Canva and teacher sees history", async ({
  page,
  browser,
}, info) => {
  await teacherLogin(page);
  const stamp = `groups-${info.project.name}-${Date.now()}`;
  const classroom = await post(page, "/classrooms", {
    name: `Lớp ${stamp}`,
    subject: "Vật lý",
    grade: "10",
  });
  const students = [];
  for (let i = 1; i <= 3; i++) {
    const email = `${stamp}-${i}@example.test`;
    const response = await post(page, `/classrooms/${classroom.id}/students`, {
      name: `Học sinh nhóm ${i}`,
      email,
      password: "TempPass123!",
    });
    students.push({ ...response, email });
  }
  await page.reload();
  await page.getByLabel("Chọn lớp học").selectOption(classroom.id);
  await openGroups(page);
  await expect(page.getByText("Chưa có hoạt động nhóm")).toBeVisible();
  await page
    .getByRole("button", { name: "Tạo hoạt động", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("Lớp học", { exact: true })).toHaveValue(
    `Lớp ${stamp}`,
  );
  await dialog.getByLabel("Tên hoạt động").fill("Thiết kế năng lượng xanh");
  await dialog
    .getByLabel("Yêu cầu hoạt động", { exact: true })
    .fill("Trình bày sản phẩm và báo cáo theo nhóm.");
  const requirement = Buffer.from(
    zipSync({
      "word/document.xml": strToU8(
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Yêu cầu Word: Làm mô hình tiết kiệm điện.</w:t></w:r></w:p></w:body></w:document>',
      ),
    }),
  );
  await dialog.getByLabel("File yêu cầu Word").setInputFiles({
    name: "Yêu cầu nhóm.docx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    buffer: requirement,
  });
  await dialog.getByLabel("Số nhóm").fill("2");
  await dialog.getByRole("button", { name: "Tạo và chia nhóm" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator(".group-roster")).toHaveCount(2);
  await expect(page.locator(".group-word-text")).toContainText(
    "Làm mô hình tiết kiệm điện",
  );
  const requirementDownload = page.waitForEvent("download");
  await page.getByRole("link", { name: /Yêu cầu nhóm.docx/ }).click();
  const downloaded = await requirementDownload;
  expect(downloaded.suggestedFilename()).toBe("Yêu cầu nhóm.docx");
  expect(await readFile((await downloaded.path())!)).toEqual(requirement);
  const list = await page.request.get(
    `/api/classrooms/${classroom.id}/group-activities`,
  );
  const activityId = (await list.json()).activities[0].id;
  const response = await page.request.get(
    `/api/group-activities/${activityId}`,
  );
  const activity: GroupActivity = await response.json();
  const group = activity.groups.find((g) => g.members.length === 2)!;
  const nextId = group.members.find((m) => m.id !== group.representativeId)!.id;
  await page.getByLabel(`Đại diện · Nhóm ${group.number}`).selectOption(nextId);
  await page
    .locator(".group-roster")
    .filter({
      has: page.getByRole("heading", {
        name: `Nhóm ${group.number}`,
        exact: true,
      }),
    })
    .getByRole("button", { name: "Lưu đại diện" })
    .click();
  await expect(page.getByText("Đã cập nhật đại diện nhóm.")).toBeVisible();
  const context = await browser.newContext(info.project.use);
  const student = await context.newPage();
  try {
    await studentLogin(student, students.find((s) => s.id === nextId)!.email);
    await openGroups(student);
    await student
      .locator(".group-activity-card")
      .filter({ hasText: "Thiết kế năng lượng xanh" })
      .click();
    await expect(student.locator(".group-roster")).toHaveCount(1);
    await expect(
      student.getByRole("button", { name: "Nộp bài nhóm" }),
    ).toBeVisible();
    const product = Buffer.from("%PDF-1.7\nSản phẩm nhóm\n%%EOF");
    await student.getByLabel("File sản phẩm").setInputFiles({
      name: "Mô hình xanh.pdf",
      mimeType: "application/pdf",
      buffer: product,
    });
    await student.getByLabel("Ghi chú").fill("Bản đầu tiên");
    await student.route(
      `**/api/group-activities/${activityId}/submissions`,
      async (route) => {
        const received = await route.fetch();
        expect(received.status()).toBe(201);
        await route.abort("failed");
        await student.unroute(
          `**/api/group-activities/${activityId}/submissions`,
        );
      },
      { times: 1 },
    );
    await student.getByRole("button", { name: "Nộp bài nhóm" }).click();
    await expect(student.locator(".group-submission")).toHaveCount(1);
    await expect(
      student.locator(".group-submit-form").getByRole("alert"),
    ).toBeVisible();
    await student.getByRole("button", { name: "Nộp bài nhóm" }).click();
    await expect(student.getByText("Đã nhận bài nộp của nhóm.")).toBeVisible();
    await expect(student.locator(".group-submission")).toHaveCount(1);
    await student.getByLabel("Hình thức nộp").selectOption("link");
    await student
      .getByLabel("Link sản phẩm")
      .fill("https://www.canva.com/design/greenedu-demo/view");
    await student.getByLabel("Ghi chú").fill("Bản Canva hoàn thiện");
    await student.getByRole("button", { name: "Nộp bài nhóm" }).click();
    await expect(student.locator(".group-submission")).toHaveCount(2);
    await expect(student.locator(".group-submission").first()).toContainText(
      "Lần 2 · Mới nhất",
    );
    await expect(
      student.getByRole("link", { name: /Mở sản phẩm/ }),
    ).toHaveAttribute("rel", "noopener noreferrer");
    await student.reload();
    await openGroups(student);
    await student.locator(".group-activity-card").click();
    await expect(student.locator(".group-submission")).toHaveCount(2);
    await page.getByRole("button", { name: "Cập nhật", exact: true }).click();
    await expect(page.locator(".group-submission")).toHaveCount(2);
    const downloadEvent = page.waitForEvent("download");
    await page.getByRole("link", { name: /Mô hình xanh.pdf/ }).click();
    const file = await downloadEvent;
    expect(await readFile((await file.path())!)).toEqual(product);
    expect(
      await student.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
  } finally {
    await context.close();
  }
});

test("expired activity hides student submission despite wrong device clock; teacher extension opens it again and is logged", async ({
  page,
  browser,
}, info) => {
  await teacherLogin(page);
  const stamp = `deadline-${info.project.name}-${Date.now()}`,
    email = `${stamp}@example.test`;
  const classroom = await post(page, "/classrooms", {
    name: `Lớp ${stamp}`,
    subject: "Lý",
    grade: "10",
  });
  await post(page, `/classrooms/${classroom.id}/students`, {
    name: "Đại diện hết hạn",
    email,
    password: "TempPass123!",
  });
  const activity: GroupActivity = await post(
    page,
    `/classrooms/${classroom.id}/group-activities`,
    {
      title: "Bài có hạn nộp",
      instructions: "Nộp link trình bày.",
      deadlineAt: Date.now() + 1500,
      groupCount: 1,
      requestId: crypto.randomUUID(),
    },
  );
  await page.reload();
  await page.getByLabel("Chọn lớp học").selectOption(classroom.id);
  await openGroups(page);
  await page.locator(".group-activity-card").click();
  const context = await browser.newContext(info.project.use);
  const student = await context.newPage();
  await student.addInitScript(() => {
    Date.now = () => 0;
  });
  try {
    await studentLogin(student, email);
    await openGroups(student);
    await student.locator(".group-activity-card").click();
    await expect(
      student.getByText(
        "Đã hết hạn nộp bài. Giáo viên cần gia hạn để nhóm nộp thêm.",
      ),
    ).toBeVisible();
    await expect(
      student.getByRole("button", { name: "Nộp bài nhóm" }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "Gia hạn nộp bài" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Lý do gia hạn").fill("Nhóm cần thêm thời gian");
    await dialog.getByRole("button", { name: "Lưu hạn mới" }).click();
    await expect(dialog).toHaveCount(0);
    await page.getByText("Lịch sử gia hạn (1)").click();
    await expect(page.locator(".group-extensions")).toContainText(
      "Nhóm cần thêm thời gian",
    );
    await student
      .getByRole("button", { name: "Cập nhật", exact: true })
      .click();
    await expect(
      student.getByRole("button", { name: "Nộp bài nhóm" }),
    ).toBeVisible();
    await student.getByLabel("Hình thức nộp").selectOption("link");
    await student
      .getByLabel("Link sản phẩm")
      .fill("https://www.canva.com/design/extended/view");
    await student.getByRole("button", { name: "Nộp bài nhóm" }).click();
    await expect(student.locator(".group-submission")).toHaveCount(1);
    const response = await page.request.get(
      `/api/group-activities/${activity.id}`,
    );
    expect((await response.json()).extensions).toHaveLength(1);
  } finally {
    await context.close();
  }
});
