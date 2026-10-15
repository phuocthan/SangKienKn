import { test, expect, type Page } from "@playwright/test";
import { navigateTo } from "./navigation";
test.afterEach(async ({ page, context }) => {
  await context.setOffline(false);
  expect(
    (
      await page.request.post("/api/auth/login", {
        data: { email: "giaovien@greenedu.nk", password: "GreenEdu123!" },
      })
    ).ok(),
  ).toBeTruthy();
  const overview = await (
    await page.request.get("/api/classrooms/learning-class/learning")
  ).json();
  for (const exam of overview.exams)
    if (exam.enabled)
      expect(
        (
          await page.request.post("/api/learning/exams/" + exam.id + "/state", {
            data: { enabled: false },
          })
        ).ok(),
      ).toBeTruthy();
});

async function login(page: Page, teacher = false) {
  const response = await page.request.post("/api/auth/login", {
    data: teacher
      ? { email: "giaovien@greenedu.nk", password: "GreenEdu123!" }
      : { email: "learning@greenedu.test", password: "LearningTest123!" },
  });
  expect(response.ok()).toBeTruthy();
  await page.goto("/");
  await expect(
    page.getByRole("navigation", { name: "Điều hướng chính" }),
  ).toBeVisible();
}
test("typed exam autosaves unfinished statements and decimal text across reload, then publishes its grade", async ({
  page,
  browser,
}, info) => {
  await login(page, true);
  expect(
    (
      await page.request.post("/api/chapters/learning-ch1/exam-access", {
        data: { enabled: true },
      })
    ).ok(),
  ).toBeTruthy();
  const questions = [
    {
      kind: "true-false",
      text: "Hành tinh " + info.project.name,
      lesson: "Bài kiểu mới",
      choices: ["Trái đất là hành tinh.", "Trái đất là ngôi sao."],
      correctAnswer: "10",
      explanation: "Trái đất là hành tinh.",
    },
    {
      kind: "short-answer",
      text: "Giá trị cực đại " + info.project.name,
      lesson: "Bài kiểu mới",
      choices: [],
      correctAnswer: "2",
      explanation: "Giá trị cực đại bằng 2.",
    },
  ];
  const created = await page.request.post(
    "/api/classrooms/learning-class/exams",
    {
      data: {
        title: "Đề kiểu mới " + Date.now(),
        source: "upload",
        chapterIds: ["learning-ch1"],
        startsAt: Date.now() - 1000,
        closesAt: Date.now() + 600000,
        requestId: crypto.randomUUID(),
        questions: questions.map((question) => ({
          chapterId: "learning-ch1",
          question,
        })),
      },
    },
  );
  expect(created.ok()).toBeTruthy();
  const exam = await created.json();
  await login(page);
  const started = await page.request.post(
    "/api/classrooms/learning-class/exam-runs",
    { data: { examId: exam.id, requestId: crypto.randomUUID() } },
  );
  expect(started.ok()).toBeTruthy();
  const run = await started.json();
  const room = await (
    await page.request.get("/api/learning/exam-runs/" + run.id)
  ).json();
  const shortIndex = room.questions.findIndex(
      (q: any) => q.kind === "short-answer",
    ),
    truthIndex = 1 - shortIndex;
  await page.goto("/#learning=learning-class&exam=" + run.id);
  await page.reload();
  await page
    .getByRole("button", { name: "Đến câu " + (shortIndex + 1), exact: true })
    .click();
  await page
    .getByLabel("Câu trả lời ngắn", { exact: true })
    .pressSequentially("2,0", { delay: 150 });
  await expect(
    page.getByLabel("Câu trả lời ngắn", { exact: true }),
  ).toHaveValue("2,0");
  await expect(page.locator(".info-panel")).toContainText("Đáp án đã lưu");
  await page
    .getByRole("button", { name: "Đến câu " + (truthIndex + 1), exact: true })
    .click();
  await page.getByRole("button", { name: "a. Đúng", exact: true }).click();
  await expect(page.locator(".info-panel")).toContainText("1/2 câu đã chọn");
  await expect(page.locator(".info-panel")).toContainText("Đáp án đã lưu");
  page.on("dialog", (dialog) => void dialog.accept());
  await page.reload();
  await page
    .getByRole("button", { name: "Đến câu " + (truthIndex + 1), exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "a. Đúng", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "b. Sai", exact: true }).click();
  await expect(page.locator(".info-panel")).toContainText("2/2 câu đã chọn");
  await page
    .getByRole("button", { name: "Đến câu " + (shortIndex + 1), exact: true })
    .click();
  await expect(
    page.getByLabel("Câu trả lời ngắn", { exact: true }),
  ).toHaveValue("2,0");
  await page.getByRole("button", { name: "Nộp bài", exact: true }).click();
  await expect(page.locator(".info-panel")).toContainText("Đã hoàn thành");
  await expect(page.locator(".explanation")).toHaveCount(0);
  const teacher = await browser.newContext();
  await teacher.request.post("/api/auth/login", {
    data: { email: "giaovien@greenedu.nk", password: "GreenEdu123!" },
  });
  expect(
    (
      await teacher.request.post("/api/learning/exams/" + exam.id + "/state", {
        data: { enabled: false },
      })
    ).ok(),
  ).toBeTruthy();
  await teacher.close();
  await page.reload();
  await expect(page.locator(".exam-room")).toContainText("Điểm 10.0 / 10");
  await expect(page.locator(".explanation")).toBeVisible();
});
test("completed review starts a fresh round without changing the old answers", async ({
  page,
}) => {
  await login(page);
  await page.getByLabel("Chọn lớp học").selectOption("learning-class");
  const created = await page.request.post(
    "/api/classrooms/learning-class/reviews",
    {
      data: {
        chapterIds: ["learning-ch1"],
        questionCount: 2,
        requestId: crypto.randomUUID(),
      },
    },
  );
  expect(created.ok()).toBeTruthy();
  const original = await created.json();
  await navigateTo(page, { name: "Ôn tập & kiểm tra", exact: true });
  await page
    .getByRole("button", { name: "Tiếp tục ôn", exact: true })
    .first()
    .click();
  for (let i = 0; i < 2; i++) {
    await expect(page.locator(".question-card")).toBeVisible();
    await page.locator(".choices .choice").first().click();
    await page
      .getByRole("button", { name: "Kiểm tra đáp án", exact: true })
      .click();
    await expect(page.locator(".explanation")).toContainText("Chính xác");
    await page
      .getByRole("button", {
        name: i === 0 ? "Câu tiếp theo" : "Xem kết quả",
        exact: true,
      })
      .click();
  }
  const repeat = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/learning/reviews/" + original.id + "/repeat") &&
      r.ok(),
  );
  await page.getByRole("button", { name: "Làm lại bài", exact: true }).click();
  const fresh = await (await repeat).json();
  expect(fresh.id).not.toBe(original.id);
  await expect(page.locator(".question-meta")).toContainText("Câu 1/2");
  expect(
    (
      await (
        await page.request.get("/api/learning/reviews/" + original.id)
      ).json()
    ).completed,
  ).toBe(true);
  expect(
    (await (await page.request.get("/api/learning/reviews/" + fresh.id)).json())
      .answers,
  ).toEqual({});
  await page
    .getByRole("button", { name: "Kết thúc phiên", exact: true })
    .click();
});
test("exam deduplicates blur and hidden events and locks answers at the offline tab limit", async ({
  page,
  context,
}, info) => {
  await login(page, true);
  expect(
    (
      await page.request.post("/api/chapters/learning-ch1/exam-access", {
        data: { enabled: true },
      })
    ).ok(),
  ).toBeTruthy();
  const title = "Offline focus " + info.project.name + " " + Date.now();
  const created = await page.request.post(
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
  expect(created.ok()).toBeTruthy();
  const exam = await created.json();
  await login(page);
  const start = await page.request.post(
    "/api/classrooms/learning-class/exam-runs",
    { data: { examId: exam.id, requestId: crypto.randomUUID() } },
  );
  expect(start.ok()).toBeTruthy();
  const run = await start.json();
  await page.goto("/#learning=learning-class&exam=" + run.id);
  await page.reload();
  await expect(page.locator(".exam-room")).toBeVisible();
  await page.locator(".choices .choice").first().click();
  await expect(page.locator(".info-panel")).toContainText("Đáp án đã lưu");
  await context.setOffline(true);
  for (let i = 0; i < 4; i++)
    await page.evaluate(() => {
      Object.defineProperty(document, "hasFocus", {
        configurable: true,
        value: () => false,
      });
      window.dispatchEvent(new Event("blur"));
      Object.defineProperty(document, "hidden", {
        configurable: true,
        value: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
      Object.defineProperty(document, "hidden", {
        configurable: true,
        value: false,
      });
      delete (document as any).hasFocus;
      document.dispatchEvent(new Event("visibilitychange"));
      window.dispatchEvent(new Event("focus"));
    });
  await expect(
    page.getByRole("alert").filter({ hasText: "Bài đã khóa" }),
  ).toBeVisible();
  for (const choice of await page.locator(".choices .choice").all())
    await expect(choice).toBeDisabled();
  await context.setOffline(false);
  await expect(page.locator(".info-panel")).toContainText("Tự nộp do rời tab");
  const saved = await (
    await page.request.get("/api/learning/exam-runs/" + run.id)
  ).json();
  expect(saved.warnings).toBe(4);
  expect(saved.status).toBe("submitted");
  expect(Object.values(saved.answers)).toEqual([0]);
  await login(page, true);
  expect(
    (
      await page.request.post("/api/learning/exams/" + exam.id + "/state", {
        data: { enabled: false },
      })
    ).ok(),
  ).toBeTruthy();
});
test("teacher authors typed questions; student answers, repeats and teacher opens the original notebook", async ({
  page,
}, info) => {
  await login(page, true);
  const stamp = `mixed-${info.project.name}-${Date.now()}`;
  async function post(path: string, data: unknown) {
    const r = await page.request.post("/api" + path, { data });
    expect(r.ok()).toBeTruthy();
    return r.json();
  }
  const classroom = await post("/classrooms", {
    name: stamp,
    subject: "Toán",
    grade: "10",
  });
  const chapter = await post(`/classrooms/${classroom.id}/chapters`, {
    title: "Chương hỗn hợp",
  });
  const other = await post(`/classrooms/${classroom.id}/chapters`, {
    title: "Chương chưa học",
  });
  await post(`/classrooms/${classroom.id}/memberships`, {
    email: "learning@greenedu.test",
  });
  await page.reload();
  await page.getByLabel("Chọn lớp học").selectOption(classroom.id);
  await navigateTo(page, { name: "Ngân hàng câu hỏi", exact: true });
  for (const kind of ["true-false", "short-answer"]) {
    await page
      .getByRole("button", { name: "Thêm câu hỏi", exact: true })
      .click();
    const form = page.getByRole("dialog");
    await form
      .getByRole("combobox", { name: "Chương học", exact: true })
      .selectOption(chapter.id);
    await form
      .getByRole("combobox", { name: "Loại câu hỏi", exact: true })
      .selectOption(kind);
    await form.getByLabel("Bài học", { exact: true }).fill("Bài hỗn hợp");
    await form
      .getByLabel("Nội dung câu hỏi", { exact: true })
      .fill(
        kind === "true-false"
          ? "Xác định đúng sai về Trái đất."
          : "Tìm giá trị cực đại của y=x^3-3x^2+2.",
      );
    if (kind === "true-false") {
      await form
        .getByLabel("Khẳng định A", { exact: true })
        .fill("Trái đất gần hình cầu.");
      await form
        .getByLabel("Khẳng định B", { exact: true })
        .fill("Trái đất là ngôi sao.");
      await form
        .getByRole("combobox", { name: "Đáp án ý B", exact: true })
        .selectOption("0");
    } else await form.getByLabel("Đáp án đúng", { exact: true }).fill("2");
    await form
      .getByLabel("Lời giải", { exact: true })
      .fill(
        kind === "true-false"
          ? "Trái đất là một hành tinh."
          : "Giá trị cực đại tại x=0 là 2.",
      );
    await form.getByRole("button", { name: "Lưu", exact: true }).click();
    await expect(form).toHaveCount(0);
  }
  await expect(page.locator(".bank-question")).toHaveCount(2);
  await login(page);
  await page.getByLabel("Chọn lớp học").selectOption(classroom.id);
  await navigateTo(page, { name: "Luyện tập", exact: true });
  await page
    .locator(".chapter-card")
    .filter({
      has: page.getByRole("heading", { name: "Chương hỗn hợp", exact: true }),
    })
    .getByRole("button", { name: /Luyện tập/ })
    .click();
  async function answer(correct: boolean) {
    await expect(page.locator(".question-card")).toBeVisible();
    if (await page.locator(".truth-statements").count()) {
      await page.getByRole("button", { name: "a. Đúng", exact: true }).click();
      await page
        .getByRole("button", {
          name: correct ? "b. Sai" : "b. Đúng",
          exact: true,
        })
        .click();
    } else
      await page
        .getByLabel("Câu trả lời ngắn", { exact: true })
        .fill(correct ? "2,0" : "3");
    await page
      .getByRole("button", { name: "Kiểm tra đáp án", exact: true })
      .click();
    await expect(page.locator(".explanation")).toBeVisible();
    if (correct)
      await expect(page.locator(".explanation")).toContainText(
        /Trái đất là một hành tinh|Giá trị cực đại/,
      );
    else {
      await expect(page.locator(".wrong-choice")).toHaveCount(1);
      await expect(page.locator(".explanation")).not.toContainText(
        /Trái đất là một hành tinh|Giá trị cực đại tại/,
      );
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await page.screenshot({
      path: info.outputPath(
        `answer-${correct}-${(await page.locator(".truth-statements").count()) ? "truth" : "short"}.png`,
      ),
      fullPage: true,
    });
    await page
      .getByRole("button", { name: /Câu tiếp theo|Xem kết quả/, exact: true })
      .click();
  }
  await answer(false);
  await answer(false);
  await expect(
    page.getByRole("button", { name: "Làm lại bài", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Làm lại bài", exact: true }).click();
  await answer(true);
  await answer(true);
  await page.getByRole("button", { name: "Về khu vườn", exact: true }).click();
  const progress = await (await page.request.get("/api/classrooms")).json();
  expect(
    progress
      .find((c: any) => c.id === classroom.id)
      .chapters.find((ch: any) => ch.id === other.id).seconds,
  ).toBe(0);
  await login(page, true);
  await page.getByLabel("Chọn lớp học").selectOption(classroom.id);
  await navigateTo(page, { name: "Quản lý lớp", exact: true });
  await expect(
    page.getByRole("columnheader", { name: "Số câu đã làm", exact: true }),
  ).toBeVisible();
  const row = page
    .getByRole("row")
    .filter({ hasText: "learning@greenedu.test" });
  await expect(row.getByRole("cell").nth(2)).toHaveText("2");
  await row.getByRole("button", { name: "Xem sổ tay", exact: true }).click();
  await expect(page.getByRole("dialog").locator(".question-card")).toHaveCount(
    2,
  );
  await expect(page.getByRole("dialog")).toContainText("Chương hỗn hợp");
  await expect(
    page.getByRole("dialog").locator(".notebook-wrong-history"),
  ).toHaveCount(2);
  await expect(page.getByRole("dialog")).toContainText(
    "Câu trả lời sai trước đó",
  );
  await page.screenshot({
    path: info.outputPath("teacher-notebook.png"),
    fullPage: true,
  });
});

test("leaving study or becoming idle ends only the study session and shows an in-app dialog", async ({
  page,
  context,
}, info) => {
  await login(page);
  await page.getByLabel("Chọn lớp học").selectOption("learning-class");
  await page.clock.install();
  await navigateTo(page, { name: "Luyện tập", exact: true });
  const start = page.waitForResponse(
    (r) => r.url().endsWith("/api/study/start") && r.ok(),
  );
  await page
    .locator(".chapter-card")
    .filter({
      has: page.getByRole("heading", { name: "Chương ôn I", exact: true }),
    })
    .getByRole("button", { name: /Luyện tập|Ôn tập lại/ })
    .click();
  const started = await start;
  const sessionId = (await started.json()).sessionId;
  const clock = page.getByLabel("Thời gian phiên học").locator("time");
  await page.clock.runFor(3000);
  const stop = page.waitForResponse(
    (r) => r.url().endsWith("/api/study/stop") && r.ok(),
  );
  await page.evaluate(() => {
    for(let i=0;i<4;i++){
      Object.defineProperty(document,'hasFocus',{configurable:true,value:()=>false});window.dispatchEvent(new Event('blur'));
      Object.defineProperty(document,'hasFocus',{configurable:true,value:()=>true});window.dispatchEvent(new Event('focus'));
    }
  });
  await stop;
  const stopped = await page.request.post("/api/study/heartbeat", {
    data: { sessionId, active: true, interacted: true },
  });
  expect(stopped.status()).toBe(409);
  await expect(
    page.getByRole("dialog", { name: "Phiên học đã kết thúc" }),
  ).toContainText("giới hạn rời tab");
  await expect(
    page.getByRole("heading", { name: /hôm nay mình học gì/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Đăng xuất", exact: true }),
  ).toBeVisible();
  await page.evaluate(() => {
    delete (document as any).hasFocus;
    window.dispatchEvent(new Event("focus"));
  });
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Đã hiểu" })
    .click();
  await navigateTo(page, { name: "Luyện tập", exact: true });
  await page
    .locator(".chapter-card")
    .filter({
      has: page.getByRole("heading", { name: "Chương ôn I", exact: true }),
    })
    .getByRole("button", { name: /Luyện tập|Ôn tập lại/ })
    .click();
  await expect(clock).toBeVisible();
  await page.clock.runFor(106000);
  await expect(page.locator(".idle-banner")).toContainText(
    "Phiên học kết thúc sau",
  );
  await page.screenshot({
    path: info.outputPath("idle-warning.png"),
    fullPage: true,
  });
  await context.setOffline(true);
  await page.clock.runFor(15000);
  await expect(
    page.getByRole("dialog", { name: "Phiên học đã kết thúc" }),
  ).toContainText("không tương tác");
  await expect(
    page.getByRole("heading", { name: /hôm nay mình học gì/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Đăng nhập", exact: true }),
  ).toHaveCount(0);
  await context.setOffline(false);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Đã hiểu" })
    .click();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: /hôm nay mình học gì/ }),
  ).toBeVisible();
  await navigateTo(page, { name: "Luyện tập", exact: true });
  await page
    .locator(".chapter-card")
    .filter({
      has: page.getByRole("heading", { name: "Chương ôn I", exact: true }),
    })
    .getByRole("button", { name: /Luyện tập|Ôn tập lại/ })
    .click();
  await expect(page.getByLabel("Thời gian phiên học")).toBeVisible();
  await page.clock.fastForward(60000);
  await page.clock.runFor(61000);
  await expect(
    page.getByRole("dialog", { name: "Phiên học đã kết thúc" }),
  ).toContainText("không tương tác");
});
