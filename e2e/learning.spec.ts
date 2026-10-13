import { navigateTo } from "./navigation";
import { test, expect, type Page } from "@playwright/test";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { unzipSync, strFromU8 } from "fflate";

test.afterEach(async ({ request }) => {
  // Close this scenario's exam windows before reusing the dedicated student in another project.
  const login = await request.post("/api/auth/login", {
    data: { email: "giaovien@greenedu.nk", password: "GreenEdu123!" },
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
    .fill(teacher ? "giaovien@greenedu.nk" : "learning@greenedu.test");
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
  await navigateTo(page, { name: "Ôn tập & kiểm tra" });
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

async function repairPublishedNotebook(page: Page) {
  // Other suites also submit private uploads with non-A answer keys. Read only
  // results already published to this fixture student, then restore eligibility.
  const overview = await (
    await page.request.get("/api/classrooms/learning-class/learning")
  ).json();
  const answers = new Map<string, number>();
  for (const run of overview.runs.filter(
    (run: { status: string }) => run.status === "submitted",
  )) {
    const result = await (
      await page.request.get(`/api/learning/exam-runs/${run.id}`)
    ).json();
    for (const row of result.results ?? [])
      answers.set(row.questionId, row.correctIndex);
  }
  const corrections = await (await page.request.get("/api/corrections")).json();
  for (const question of corrections) {
    const response = await page.request.post("/api/attempts", {
      data: {
        questionId: question.id,
        selected: answers.get(question.id) ?? 0,
        mode: "correction",
        requestId: crypto.randomUUID(),
      },
    });
    expect(response.ok()).toBe(true);
    expect((await response.json()).correct).toBe(true);
  }
}

test("teacher selects individual lessons or uploads a private exam and manually opens it", async ({
  page,
}, info) => {
  await login(page, true);
  const form = page.locator(".learning-form");
  await form.getByLabel("Loại bộ câu").selectOption("exam");
  await form
    .getByRole("radio", { name: "Chọn từ ngân hàng", exact: true })
    .check();
  await form.getByLabel("Chương ôn I", { exact: true }).check();
  await form.getByLabel("Toàn chương · Chương ôn I", { exact: true }).uncheck();
  await expect(
    form.getByRole("button", { name: "Lưu lịch kiểm tra" }),
  ).toBeDisabled();
  await form.getByLabel("Chương ôn I · Bài 1", { exact: false }).check();
  await form.getByLabel("Số câu", { exact: true }).fill("2");
  const bankTitle = `Bài chọn ${info.project.name} ${Date.now()}`;
  await form.getByLabel("Tên bộ câu").fill(bankTitle);
  await form.getByRole("button", { name: "Lưu lịch kiểm tra" }).click();
  await expect(page.locator('.learning-notice[role="status"]')).toContainText(
    "Đã tạo kiểm tra",
  );
  const bank = page
    .locator(".learning-row")
    .filter({ has: page.getByText(bankTitle, { exact: true }) })
    .first();
  await expect(bank).toContainText("2 câu");
  await expect(bank).toContainText("Đã đóng");
  await form.getByRole("radio", { name: "Upload file", exact: true }).check();
  const uploadTitle = `Đề riêng ${info.project.name} ${Date.now()}`;
  await form.getByLabel("Tên bộ câu").fill(uploadTitle);
  await form.getByLabel("File đề (.docx hoặc .csv)").setInputFiles({
    name: "de.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      "Bài học,Câu hỏi,A,B,C,D,Đáp án,Lời giải\nBài tải riêng,Câu riêng không phát hành,A,B,C,D,C,Chọn C\n",
    ),
  });
  await expect(form).toContainText("1 câu đã chọn / tối đa 100");
  await form.getByRole("button", { name: "Lưu lịch kiểm tra" }).click();
  await expect(page.locator('.learning-notice[role="status"]')).toContainText(
    "Đã tạo kiểm tra",
  );
  const row = page
    .locator(".learning-row")
    .filter({ has: page.getByText(uploadTitle, { exact: true }) })
    .first();
  await expect(row).toContainText("1 câu");
  await row.getByRole("button", { name: "Mở kiểm tra ngay" }).click();
  await expect(page.locator('.learning-notice[role="status"]')).toContainText(
    "Đã mở kiểm tra",
  );
  await expect(row).toContainText("Đang mở");
  await noOverflow(page);
});

test("practice clock advances, pauses while hidden or offline, and wrong answers reveal no solution", async ({
  page,
  context,
}) => {
  await login(page);
  await page.clock.install();
  await page.getByLabel("Chương ôn I", { exact: true }).check();
  await page.getByRole("button", { name: "Bắt đầu ôn", exact: true }).click();
  await expect(page.locator(".question-card")).toBeVisible();
  const clock = page.getByLabel("Thời gian phiên học").locator("time");
  await expect(clock).toHaveText("00:00:00");
  await expect(page.locator(".practice-clock")).toContainText(
    "Đang ghi nhận thời gian",
  );
  // Wait for the API session before advancing the browser's display clock.
  await expect
    .poll(async () => (await page.request.get("/api/health")).ok())
    .toBeTruthy();
  await page.clock.runFor(3000);
  await expect(clock).not.toHaveText("00:00:00");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const hiddenTime = await clock.textContent();
  await page.clock.runFor(3000);
  await expect(clock).toHaveText(hiddenTime!);
  await page.evaluate(() => {
    delete (document as any).hidden;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await context.setOffline(true);
  const offlineTime = await clock.textContent();
  await page.clock.runFor(3000);
  await expect(clock).toHaveText(offlineTime!);
  await context.setOffline(false);
  await page.getByRole("button", { name: "Tiếp tục học", exact: true }).click();
  await page.locator(".choices .choice").nth(1).click();
  await page.getByRole("button", { name: "Kiểm tra đáp án" }).click();
  await expect(page.locator(".wrong-choice")).toHaveCount(1);
  await expect(page.locator(".wrong-choice")).toHaveCSS(
    "background-color",
    "rgb(255, 240, 240)",
  );
  await expect(page.locator(".wrong-choice .choice-letter")).toHaveCSS(
    "background-color",
    "rgb(197, 92, 102)",
  );
  await expect(page.locator(".correct-choice")).toHaveCount(0);
  await expect(page.locator(".explanation")).not.toContainText(
    "Phương án A là đáp án đúng",
  );
  await page.getByRole("button", { name: "Kết thúc phiên" }).click();
});

test("teacher controls chapter access; qualified students wait, opening another chapter does not unlock it, and stale starts are rejected", async ({
  page,
  browser,
}, info) => {
  await login(page, true);
  // Make this scenario independent of previous desktop/mobile scenarios.
  for (const id of ["learning-ch1", "learning-ch2"])
    expect(
      (
        await page.request.post(`/api/chapters/${id}/exam-access`, {
          data: { enabled: false },
        })
      ).ok(),
    ).toBeTruthy();
  await navigateTo(page, { name: "Lớp học của tôi", exact: true });
  const permission = page.locator(".chapter-list");
  const studentContext = await browser.newContext({
    viewport: page.viewportSize()!,
  });
  const student = await studentContext.newPage();
  try {
    await login(student);
    // Earlier scenarios can leave notebook errors in the shared E2E student.
    // Restore personal eligibility before asserting only the teacher gate.
    await repairPublishedNotebook(student);
    for (let i = 0; i < 8; i++)
      expect(
        (
          await student.request.post("/api/attempts", {
            data: {
              questionId: "learning-ch1-q1",
              selected: 0,
              mode: "practice",
              requestId: crypto.randomUUID(),
            },
          })
        ).ok(),
      ).toBeTruthy();
    await student.getByRole("button", { name: "Làm mới", exact: true }).click();
    const chapter = student
      .locator(".learning-chapter")
      .filter({ hasText: "Chương ôn I" })
      .first();
    const hunt = chapter.getByRole("button", { name: "Săn điểm", exact: true });
    await expect(chapter).toContainText("Chờ giáo viên mở kiểm tra");
    await expect(hunt).toBeDisabled();
    await permission
      .getByRole("button", { name: "Mở kiểm tra · Chương ôn II", exact: true })
      .click();
    await expect(
      permission.getByRole("button", {
        name: "Khóa kiểm tra · Chương ôn II",
        exact: true,
      }),
    ).toBeEnabled();
    await student.getByRole("button", { name: "Làm mới", exact: true }).click();
    await expect(hunt).toBeDisabled();
    await permission
      .getByRole("button", { name: "Mở kiểm tra · Chương ôn I", exact: true })
      .click();
    await expect(
      permission.getByRole("button", {
        name: "Khóa kiểm tra · Chương ôn I",
        exact: true,
      }),
    ).toBeEnabled();
    await student.getByRole("button", { name: "Làm mới", exact: true }).click();
    await expect(hunt).toBeEnabled();
    await student.reload();
    await navigateTo(student, { name: "Ôn tập & kiểm tra" });
    await expect(hunt).toBeEnabled();
    await permission
      .getByRole("button", { name: "Khóa kiểm tra · Chương ôn I", exact: true })
      .click();
    await expect(
      permission.getByRole("button", {
        name: "Mở kiểm tra · Chương ôn I",
        exact: true,
      }),
    ).toBeEnabled();
    // The student has not refreshed; server must independently reject their stale button.
    await hunt.click();
    await expect(student.getByRole("alert")).toContainText(
      "Giáo viên chưa mở kiểm tra",
    );
    await expect(student.locator(".exam-room")).toHaveCount(0);
    await student.getByRole("button", { name: "Làm mới", exact: true }).click();
    await expect(hunt).toBeDisabled();
    await noOverflow(page);
    await noOverflow(student);
    await page.screenshot({
      path: info.outputPath("chapter-access-teacher.png"),
      fullPage: true,
    });
    await student.screenshot({
      path: info.outputPath("chapter-access-student.png"),
      fullPage: true,
    });
  } finally {
    await studentContext.close();
  }
});

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
  await expect(page.locator(".correct-choice")).toHaveCount(0);
  await expect(page.locator(".explanation")).not.toContainText(
    "Phương án A là đáp án đúng",
  );
  await page.getByRole("button", { name: "Câu tiếp theo" }).click();
  await expect(page.locator(".question-meta")).toContainText("Câu 2/8");
  const text = await page.locator(".question-card h2").innerText();
  await page.reload();
  await navigateTo(page, { name: "Ôn tập & kiểm tra" });
  await page.getByRole("button", { name: "Tiếp tục ôn" }).first().click();
  await expect(page.locator(".question-meta")).toContainText("Câu 2/8");
  await expect(page.locator(".question-card h2")).toHaveText(text);
  await page.locator(".choices .choice").first().click();
  await page.reload();
  await navigateTo(page, { name: "Ôn tập & kiểm tra" });
  await page.getByRole("button", { name: "Tiếp tục ôn" }).first().click();
  await expect(page.locator(".choices .choice").first()).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Kết thúc phiên" }).click();
  // Errors in both chapters make the notebook shortcut's scope observable.
  for (const chapterId of ["learning-ch1", "learning-ch2"])
    expect(
      (
        await page.request.post("/api/attempts", {
          data: {
            questionId: `${chapterId}-q1`,
            selected: 1,
            mode: "practice",
            requestId: crypto.randomUUID(),
          },
        })
      ).ok(),
    ).toBeTruthy();
  const corrections = await (await page.request.get("/api/corrections")).json();
  await navigateTo(page, { name: "Ôn tập & kiểm tra" });
  // The API setup happens after the learning view mounts on ending the review.
  await page.getByRole("button", { name: "Làm mới", exact: true }).click();
  await expect(page.locator(".hunt-current-level > span")).toHaveCount(0);
  await expect(page.locator(".hunt-current-level").first()).toContainText(
    "Cấp độ hiện tại",
  );
  await expect(
    page.getByRole("button", { name: "Mở sổ tay · Chương ôn II", exact: true }),
  ).toBeVisible();
  await noOverflow(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: info.outputPath("notebook-shortcut.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Mở sổ tay · Chương ôn I", exact: true })
    .click();
  const filter = page.getByLabel("Chương cần sửa");
  await expect(filter).toHaveValue("learning-ch1");
  for (const chapterId of ["learning-ch1", "learning-ch2", ""]) {
    await filter.selectOption(chapterId);
    const expected = corrections.filter(
      (q: { chapterId: string }) => !chapterId || q.chapterId === chapterId,
    );
    await expect(page.locator(".correction-card")).toHaveCount(expected.length);
    for (const q of expected)
      await expect(
        page.locator(".correction-card").filter({ hasText: q.text }),
      ).toHaveCount(1);
  }
  await noOverflow(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: info.outputPath("notebook-filter.png"),
    fullPage: true,
  });
  // The sidebar still opens the full notebook rather than retaining a shortcut filter.
  await filter.selectOption("learning-ch2");
  await navigateTo(page, { name: "Sổ tay sửa sai" });
  await expect(filter).toHaveValue("");
  await filter.selectOption("learning-ch1");
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
  request,
}, info) => {
  await request.post("/api/auth/login", {
    data: { email: "giaovien@greenedu.nk", password: "GreenEdu123!" },
  });
  expect(
    (
      await request.post("/api/chapters/learning-ch1/exam-access", {
        data: { enabled: true },
      })
    ).ok(),
  ).toBeTruthy();
  await login(page);
  await repairPublishedNotebook(page);
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
  await navigateTo(page, { name: "Lớp học của tôi", exact: true });
  const permission = page.locator(".chapter-list");
  const openChapter = permission.getByRole("button", {
    name: "Mở kiểm tra · Chương ôn I",
    exact: true,
  });
  if (await openChapter.count()) await openChapter.click();
  await navigateTo(page, { name: "Ôn tập & kiểm tra", exact: true });
  await page.getByLabel("Tên bộ câu").fill(`Ôn ma trận ${info.project.name}`);
  await page
    .locator("fieldset")
    .getByLabel("Chương ôn I", { exact: true })
    .check();
  await page.getByLabel("Số câu", { exact: true }).fill("4");
  await page.getByRole("button", { name: "Lưu ma trận" }).click();
  await expect(page.locator('.learning-notice[role="status"]')).toContainText("Đã lưu ma trận");
  await page.getByLabel("Loại bộ câu").selectOption("exam");
  await page
    .getByRole("radio", { name: "Chọn từ ngân hàng", exact: true })
    .check();
  await page.getByLabel("Chương ôn I", { exact: true }).check();
  const title = `Thi ${info.project.name} ${Date.now()}`;
  await page.getByLabel("Tên bộ câu").fill(title);
  await page.getByRole("button", { name: "Lưu lịch kiểm tra" }).click();
  await expect(page.locator('.learning-notice[role="status"]')).toContainText("Đã tạo kiểm tra");
  await page
    .locator(".learning-row")
    .filter({ has: page.getByText(title, { exact: true }) })
    .first()
    .getByRole("button", { name: "Mở kiểm tra ngay" })
    .click();
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
    await expect(student.locator(".correct-choice, .wrong-choice")).toHaveCount(
      0,
    );
    const row = page
      .locator(".learning-row")
      .filter({ has: page.getByText(title, { exact: true }) })
      .first();
    await row.getByRole("button", { name: "Đóng bài thi" }).click();
    await expect(student.locator(".explanation")).toBeVisible({
      timeout: 10000,
    });
    await student
      .getByRole("button", { name: "Đến câu 1", exact: true })
      .click();
    await expect(
      student.locator(".choice.selected.correct-choice"),
    ).toHaveCount(1);
    await expect(student.locator(".wrong-choice")).toHaveCount(0);
    await student
      .getByRole("button", { name: "Đến câu 3", exact: true })
      .click();
    await expect(student.locator(".correct-choice")).toHaveCount(1);
    await expect(
      student.locator(".wrong-choice, .choice.selected"),
    ).toHaveCount(0);
    await student
      .getByRole("button", { name: "Đến câu 2", exact: true })
      .click();
    const wrong = student.locator(".choice.selected.wrong-choice");
    await expect(wrong).toHaveCount(1);
    await expect(wrong).toHaveCSS("background-color", "rgb(255, 240, 240)");
    await expect(wrong).toHaveCSS("border-top-color", "rgb(221, 162, 162)");
    await expect(wrong).toHaveCSS(
      "box-shadow",
      "rgb(221, 162, 162) 0px 0px 0px 1px",
    );
    await expect(wrong.locator(".choice-letter")).toHaveCSS(
      "background-color",
      "rgb(197, 92, 102)",
    );
    await expect(student.locator(".correct-choice")).toHaveCSS(
      "background-color",
      "rgb(239, 248, 232)",
    );
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
  expect(
    (
      await page.request.post("/api/chapters/learning-ch1/exam-access", {
        data: { enabled: true },
      })
    ).ok(),
  ).toBeTruthy();
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
      document.dispatchEvent(new Event("visibilitychange"));
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
