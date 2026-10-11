import { test, expect, type Page } from "@playwright/test";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { unzipSync, strFromU8 } from "fflate";

test.afterEach(async ({ request }) => {
  // Close this scenario's exam windows before reusing the dedicated student in another project.
  const login = await request.post("/api/auth/login", {
    data: { email: "giaovien@greenedu.demo", password: "GreenEdu123!" },
  });
  expect(login.ok()).toBeTruthy();
  const overview = await (
    await request.get("/api/classrooms/learning-class/learning")
  ).json();
  for (const exam of overview.exams)
    if (exam.enabled)
      expect(
        (
          await request.post(`/api/learning/exams/${exam.id}/state`, {
            data: { enabled: false },
          })
        ).ok(),
      ).toBeTruthy();
});

async function login(page: Page, teacher = false) {
  await page.goto("/");
  await page
    .getByLabel("Email")
    .fill(teacher ? "giaovien@greenedu.demo" : "learning@greenedu.test");
  await page
    .getByLabel("Mật khẩu", { exact: true })
    .fill(teacher ? "GreenEdu123!" : "LearningTest123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(
    page.getByRole("navigation", { name: "Điều hướng chính" }),
  ).toBeVisible();
  await expect(page.locator(".workspace-label")).toHaveText(
    teacher ? "TRANG GIÁO VIÊN" : "TRANG HỌC TẬP",
  );
  if (teacher)
    await page.getByLabel("Chọn lớp học").selectOption("learning-class");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Ôn tập & kiểm tra" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Ôn tập & kiểm tra", exact: true }),
  ).toBeVisible();
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
}

test("student reviews semester, resumes exact question and repairs without revealing a wrong answer", async ({
  page,
}, info) => {
  await login(page);
  await page
    .getByRole("combobox", { name: "Học kỳ", exact: true })
    .selectOption("Học kỳ I");
  await page.getByRole("button", { name: "Ôn toàn học kỳ" }).click();
  await expect(page.locator(".question-meta")).toContainText("Câu 1/8");
  await page.locator(".choices .choice").nth(1).click();
  await page.getByRole("button", { name: "Kiểm tra đáp án" }).click();
  await page.getByRole("button", { name: "Câu tiếp theo" }).click();
  await expect(page.locator(".question-meta")).toContainText("Câu 2/8");
  const text = await page.locator(".question-card h2").innerText();
  await page.reload();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Ôn tập & kiểm tra" })
    .click();
  await page.getByRole("button", { name: "Tiếp tục ôn" }).first().click();
  await expect(page.locator(".question-meta")).toContainText("Câu 2/8");
  await expect(page.locator(".question-card h2")).toHaveText(text);
  await page.locator(".choices .choice").first().click();
  await page.reload();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Ôn tập & kiểm tra" })
    .click();
  await page.getByRole("button", { name: "Tiếp tục ôn" }).first().click();
  await expect(page.locator(".choices .choice").first()).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Kết thúc phiên" }).click();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Sổ tay sửa sai" })
    .click();
  await page.locator(".correction-card").first().getByRole("button").click();
  await page.locator(".choices .choice").nth(1).click();
  await page.getByRole("button", { name: "Kiểm tra đáp án" }).click();
  await expect(page.locator(".correct-choice")).toHaveCount(0);
  await expect(page.locator(".explanation")).toContainText("tự làm lại");
  await page.getByRole("button", { name: "Tự làm lại" }).click();
  await page.locator(".choices .choice").first().click();
  await page.getByRole("button", { name: "Kiểm tra đáp án" }).click();
  await expect(page.locator(".explanation")).toContainText("khắc phục");
  await noOverflow(page);
  await page.screenshot({
    path: info.outputPath("review-repair.png"),
    fullPage: true,
  });
});

test("student uses hunt ticket and teacher approves the earned point", async ({
  page,
}, info) => {
  await login(page);
  const corrections = await (await page.request.get("/api/corrections")).json();
  for (const q of corrections)
    await page.request.post("/api/attempts", {
      data: {
        questionId: q.id,
        selected: 0,
        mode: "correction",
        requestId: crypto.randomUUID(),
      },
    });
  for (let i = 0; i < 8; i++)
    await page.request.post("/api/attempts", {
      data: {
        questionId: "learning-ch1-q1",
        selected: 0,
        mode: "practice",
        requestId: crypto.randomUUID(),
      },
    });
  await page.getByRole("button", { name: "Làm mới", exact: true }).click();
  const chapter = page
    .locator(".learning-chapter")
    .filter({ hasText: "Chương ôn I" })
    .first();
  await expect(
    chapter.getByRole("button", { name: "Săn điểm", exact: true }),
  ).toBeEnabled();
  await chapter.getByRole("button", { name: "Săn điểm", exact: true }).click();
  await expect(page.locator(".exam-room")).toBeVisible();
  for (let i = 0; i < 4; i++) {
    await page.locator(".choices .choice").first().click();
    if (i < 3)
      await page.getByRole("button", { name: "Câu sau", exact: true }).click();
  }
  page.on("dialog", (dialog) => void dialog.accept());
  await page.getByRole("button", { name: "Nộp bài", exact: true }).click();
  await expect(page.locator(".info-panel")).toContainText("Điểm 10.0 / 10");
  await page.getByRole("button", { name: "Về danh sách", exact: true }).click();
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await login(page, true);
  const reward = page
    .locator(".learning-row")
    .filter({ hasText: "Săn điểm đạt từ 8,0" })
    .filter({ hasText: "Chờ giáo viên duyệt" })
    .first();
  await reward.getByRole("button", { name: "Duyệt", exact: true }).click();
  await expect(
    page
      .locator(".learning-row")
      .filter({ hasText: "Săn điểm đạt từ 8,0" })
      .filter({ hasText: "Đã duyệt" })
      .first(),
  ).toBeVisible();
  await noOverflow(page);
  await page.screenshot({
    path: info.outputPath("hunt-approved.png"),
    fullPage: true,
  });
});

test("teacher creates matrix and scheduled exam; student autosaves offline and resumes, teacher closes and exports Excel", async ({
  page,
  browser,
}, info) => {
  await login(page, true);
  await page.getByLabel("Tên bộ câu").fill(`Ôn ma trận ${info.project.name}`);
  await page
    .locator("fieldset")
    .getByLabel("Chương ôn I", { exact: true })
    .check();
  await page.getByLabel("Số câu", { exact: true }).fill("4");
  await page.getByRole("button", { name: "Lưu ma trận" }).click();
  await expect(page.getByRole("status")).toContainText("Đã lưu ma trận");
  await page.getByLabel("Loại bộ câu").selectOption("exam");
  const title = `Thi ${info.project.name} ${Date.now()}`;
  await page.getByLabel("Tên bộ câu").fill(title);
  await page.getByRole("button", { name: "Lưu lịch kiểm tra" }).click();
  await expect(page.getByRole("status")).toContainText("Đã tạo lịch kiểm tra");
  await noOverflow(page);
  await page.screenshot({
    path: info.outputPath("learning-teacher.png"),
    fullPage: true,
  });
  const studentContext = await browser.newContext({
    viewport: page.viewportSize()!,
    isMobile: info.project.name === "mobile",
  });
  const student = await studentContext.newPage();
  try {
    await login(student);
    await student
      .locator(".learning-row")
      .filter({ has: student.getByText(title, { exact: true }) })
      .getByRole("button", { name: "Vào bài thi" })
      .click();
    await expect(student.locator(".exam-room")).toBeVisible();
    await student.locator(".choices .choice").first().click();
    await expect(student.locator(".info-panel")).toContainText("Đáp án đã lưu");
    await student.getByRole("button", { name: "Câu sau", exact: true }).click();
    await studentContext.setOffline(true);
    await student.locator(".choices .choice").nth(1).click();
    await expect(student.getByRole("alert")).toContainText("giữ trên máy");
    await studentContext.setOffline(false);
    await expect(student.locator(".info-panel")).toContainText("Đáp án đã lưu");
    student.on("dialog", (dialog) => void dialog.accept());
    await student.reload();
    await expect(student.locator(".exam-room")).toBeVisible();
    await expect(student.locator(".info-panel")).toContainText(
      "2/4 câu đã chọn",
    );
    await student.getByRole("button", { name: "Nộp bài", exact: true }).click();
    await expect(student.locator(".exam-room .learning-notice")).toContainText(
      "Chờ khung thi đóng",
    );
    const row = page
      .locator(".learning-row")
      .filter({ has: page.getByText(title, { exact: true }) })
      .first();
    await row.getByRole("button", { name: "Đóng bài thi" }).click();
    await expect(student.locator(".explanation")).toBeVisible({
      timeout: 10000,
    });
    await noOverflow(student);
    await student.screenshot({
      path: info.outputPath("exam-result.png"),
      fullPage: true,
    });
    const download = page.waitForEvent("download");
    await page.getByRole("link", { name: "Xuất Excel" }).click();
    const file = await download;
    const bytes = await readFile((await file.path())!);
    const files = unzipSync(new Uint8Array(bytes));
    expect(strFromU8(files["xl/worksheets/sheet1.xml"])).toContain(
      "Học sinh ôn thi",
    );
    await mkdir(".local", { recursive: true });
    await writeFile(".local/learning-report-test.xlsx", bytes);
  } finally {
    await studentContext.close();
  }
});

test("leaving the tab four times submits and warnings survive reload", async ({
  page,
}, info) => {
  await login(page, true);
  const title = `Chuyển tab ${info.project.name} ${Date.now()}`;
  const response = await page.request.post(
    "/api/classrooms/learning-class/exams",
    {
      data: {
        title,
        chapterIds: ["learning-ch1"],
        questionCount: 2,
        startsAt: Date.now() - 1000,
        closesAt: Date.now() + 600000,
        tabLimit: 4,
      },
    },
  );
  expect(response.ok()).toBeTruthy();
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await login(page);
  await page
    .locator(".learning-row")
    .filter({ has: page.getByText(title, { exact: true }) })
    .getByRole("button", { name: "Vào bài thi" })
    .click();
  await expect(page.locator(".exam-room")).toBeVisible();
  async function hiddenEvent() {
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", {
        configurable: true,
        value: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
      Object.defineProperty(document, "hidden", {
        configurable: true,
        value: false,
      });
    });
  }
  await hiddenEvent();
  await expect(page.locator(".info-panel")).toContainText("Rời tab 1/4");
  page.on("dialog", (dialog) => void dialog.accept());
  await page.reload();
  await expect(page.locator(".info-panel")).toContainText("Rời tab 1/4");
  for (let i = 2; i <= 4; i++) {
    await hiddenEvent();
    await expect(page.locator(".info-panel")).toContainText(
      i === 4 ? "Tự nộp do rời tab" : `Rời tab ${i}/4`,
    );
  }
  await noOverflow(page);
});
