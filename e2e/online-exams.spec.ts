import { navigateTo } from "./navigation";
import { test, expect, type Page } from "@playwright/test";

async function login(page: Page, teacher = false) {
  await page.goto("/");
  await page
    .getByLabel("Email", { exact: true })
    .fill(teacher ? "giaovien@greenedu.nk" : "learning@greenedu.test");
  await page
    .getByLabel("Mật khẩu", { exact: true })
    .fill(teacher ? "GreenEdu123!" : "LearningTest123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByRole("navigation")).toBeVisible();
  if (teacher) {
    await page.getByLabel("Chọn lớp học").selectOption("learning-class");
    await navigateTo(page, { name: "Ôn tập & kiểm tra" });
    await expect(
      page.getByRole("button", { name: "Tạo kiểm tra online", exact: true }),
    ).toBeEnabled();
    await page
      .getByRole("button", { name: "Tạo kiểm tra online", exact: true })
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
  for (const exam of data.exams)
    if (exam.enabled && exam.delivery === "online")
      await request.post(`/api/learning/exams/${exam.id}/state`, {
        data: { enabled: false },
      });
});

test("teacher starts a multi-lesson online exam; students get a persistent preparation countdown outside the learning page", async ({
  page,
  browser,
}, info) => {
  await login(page, true);
  const form = page.locator(".learning-form");
  const title = `Online chờ ${info.project.name} ${Date.now()}`;
  await form.getByLabel("Tên bộ câu").fill(title);
  await expect(
    form.getByRole("button", { name: "Chuẩn bị kiểm tra online" }),
  ).toBeDisabled();
  await form
    .getByRole("radio", { name: "Chọn từ ngân hàng", exact: true })
    .check();
  await form.getByLabel("Chương ôn I", { exact: true }).check();
  await form.getByLabel("Chương ôn II", { exact: true }).check();
  await form.getByLabel("Toàn chương · Chương ôn I", { exact: true }).uncheck();
  await form
    .getByLabel("Toàn chương · Chương ôn II", { exact: true })
    .uncheck();
  await form.getByLabel("Chương ôn I · Bài 1", { exact: false }).check();
  await form.getByLabel("Chương ôn II · Bài 2", { exact: false }).check();
  await form.getByLabel("Số câu", { exact: true }).fill("4");
  await form.getByLabel("Thời gian chuẩn bị (phút)").fill("2");
  await form.getByLabel("Thời gian làm bài (phút)").fill("45");
  await form.getByRole("button", { name: "Chuẩn bị kiểm tra online" }).click();
  await expect(page.locator('.learning-notice[role="status"]')).toContainText(
    "Đã chuẩn bị kiểm tra online",
  );
  const row = page
    .locator(".learning-row")
    .filter({ has: page.getByText(title, { exact: true }) })
    .first();
  await expect(row).toContainText("Chờ giáo viên bắt đầu");
  const context = await browser.newContext({ ...info.project.use });
  const student = await context.newPage();
  try {
    await login(student);
    await expect(student.locator(".exam-notices")).toHaveCount(0);
    await page.bringToFront();
    await row
      .getByRole("button", { name: "Bắt đầu kiểm tra", exact: true })
      .click();
    await expect(row).toContainText("Đang chờ bắt đầu");
    await expect(row.locator(".online-exam-state")).toHaveText("Chuẩn bị");
    await expect(row).toContainText("Đã gửi thông báo");
    await noOverflow(page);
    await form.screenshot({
      path: `.local/online-teacher-${info.project.name}.png`,
    });
    await student.bringToFront();
    const notice = student.getByRole("region", {
      name: "Thông báo kiểm tra online",
    });
    await expect(notice).toContainText(title, { timeout: 15000 });
    await expect(notice).toContainText("Lớp ôn thi · Vật lý");
    await expect(notice).toContainText("45 phút");
    await expect(notice).toContainText("Bắt đầu sau");
    const popup = student.getByRole("dialog", { name: "Có kiểm tra online từ giáo viên" });
    await expect(popup).toBeVisible();
    await student.keyboard.press("Escape");
    await expect(popup).toBeVisible();
    await expect(
      notice.getByRole("button", { name: "Chờ mở đề" }),
    ).toBeDisabled();
    await popup.getByRole("button", { name: "Đã hiểu" }).click();
    await expect(popup).toHaveCount(0);
    await student.reload();
    await expect(notice).toContainText(title);
    await expect(popup).toHaveCount(0);
    await noOverflow(student);
    await notice.screenshot({
      path: `.local/online-waiting-${info.project.name}.png`,
    });
    await page.bringToFront();
    await row.getByRole("button", { name: "Đóng bài thi" }).click();
    await student.bringToFront();
    await student.reload();
    await expect(student.locator(".exam-notices")).toHaveCount(0);
  } finally {
    await context.close();
  }
});

test("uploaded online exam notifies and opens a saved room; reload keeps question order and teacher close collects it", async ({
  page,
  browser,
}, info) => {
  await login(page, true);
  const form = page.locator(".learning-form");
  const title = `Online tải đề ${info.project.name} ${Date.now()}`;
  await form.getByLabel("Tên bộ câu").fill(title);
  await form.getByRole("radio", { name: "Upload file", exact: true }).check();
  await form.getByLabel("File đề (.docx hoặc .csv)").setInputFiles({
    name: "online.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      "Bài học,Câu hỏi,A,B,C,D,Đáp án,Lời giải\nBài riêng,Online câu một,A,B,C,D,B,Chọn B\nBài riêng,Online câu hai,A,B,C,D,C,Chọn C\n",
    ),
  });
  await expect(form).toContainText("2 câu đã chọn");
  await form.getByLabel("Thời gian chuẩn bị (phút)").fill("0");
  await form.getByLabel("Thời gian làm bài (phút)").fill("25");
  await form.getByRole("button", { name: "Chuẩn bị kiểm tra online" }).click();
  await expect(page.locator('.learning-notice[role="status"]')).toContainText(
    "Đã chuẩn bị",
  );
  const row = page
    .locator(".learning-row")
    .filter({ has: page.getByText(title, { exact: true }) })
    .first();
  await row
    .getByRole("button", { name: "Bắt đầu kiểm tra", exact: true })
    .click();
  await expect(row.locator(".online-exam-state")).toHaveText("Đang thi");
  const context = await browser.newContext({ ...info.project.use });
  const student = await context.newPage();
  try {
    // A class newly assigned while logged in may be absent from App's cached list.
    let staleClasses = true;
    await student.route("**/api/classrooms", async (route) => {
      if (staleClasses) {
        staleClasses = false;
        await route.fulfill({ json: [] });
      } else await route.continue();
    });
    await login(student);
    const notice = student.getByRole("region", {
      name: "Thông báo kiểm tra online",
    });
    await expect(notice).toContainText(title);
    await expect(student.getByRole("dialog", { name: "Có kiểm tra online từ giáo viên" })).toBeVisible();
    await notice.screenshot({
      path: `.local/online-ready-${info.project.name}.png`,
    });
    await notice.getByRole("button", { name: "Vào làm kiểm tra" }).click();
    await expect(student.locator(".exam-room")).toBeVisible();
    await expect(student.getByRole("heading", { level: 1 })).toHaveText(title);
    await expect(
      student.locator(
        ".workspace-heading-slot .learning-heading .pill, .exam-room .learning-heading .pill",
      ),
    ).toHaveText(/24:\d{2}|25:00/);
    await expect(student.locator(".exam-notices")).toHaveCount(0);
    const path = student.url();
    const firstText = await student
      .locator(".exam-room .question-card h2")
      .textContent();
    student.on("dialog", (dialog) => void dialog.accept());
    await student.reload();
    await expect(student.locator(".exam-room .question-card h2")).toHaveText(
      firstText!,
    );
    expect(student.url()).toBe(path);
    await noOverflow(student);
    await page.bringToFront();
    await row.getByRole("button", { name: "Đóng bài thi" }).click();
    await student.bringToFront();
    await expect(student.locator(".exam-room")).toContainText(
      "Giáo viên đã đóng bài thi",
      { timeout: 10000 },
    );
  } finally {
    await context.close();
  }
});

test("older Railway capability disables online preparation and start without sending unsupported mutations", async ({
  page,
}) => {
  await page.route(
    "**/api/classrooms/learning-class/learning",
    async (route) => {
      const response = await route.fetch();
      const data = await response.json();
      delete data.onlineExams;
      await route.fulfill({ json: data });
    },
  );
  await page.goto("/");
  await page.getByLabel("Email", { exact: true }).fill("giaovien@greenedu.nk");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("GreenEdu123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.getByLabel("Chọn lớp học").selectOption("learning-class");
  await navigateTo(page, { name: "Ôn tập & kiểm tra" });
  await expect(
    page.getByRole("button", { name: "Tạo kiểm tra online", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Tạo kiểm tra online", exact: true })
    .click();
  await expect(page.locator(".learning-form")).toContainText(
    "đang chờ cập nhật server Railway",
  );
  await expect(
    page.getByRole("button", { name: "Chuẩn bị kiểm tra online" }),
  ).toBeDisabled();
});
