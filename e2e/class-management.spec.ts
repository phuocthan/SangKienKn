import {
  test,
  expect,
  type Page,
  type APIRequestContext,
} from "@playwright/test";
import { navigateTo } from "./navigation";
const rules = {
  warningTabs: 2,
  closeTabs: 3,
  warningIdleSeconds: 30,
  closeIdleSeconds: 60,
};
async function post(request: APIRequestContext, path: string, data: unknown) {
  const response = await request.post("/api" + path, { data });
  expect(response.ok(), await response.text()).toBeTruthy();
  return response.json();
}
async function login(page: Page, teacher = false) {
  await post(page.request, "/auth/login", {
    email: teacher ? "giaovien@greenedu.nk" : "management@greenedu.test",
    password: teacher ? "GreenEdu123!" : "ManagementTest123!",
  });
  await page.goto("/");
  await page.getByLabel("Chọn lớp học").selectOption("management-class");
}
test.beforeEach(async ({ request }) => {
  await post(request, "/auth/login", {
    email: "giaovien@greenedu.nk",
    password: "GreenEdu123!",
  });
  await post(request, "/chapters/management-ch/hunt-access", {
    enabled: false,
    deleteQuestions: true,
  });
  await post(request, "/chapters/management-ch/practice-access", {
    enabled: true,
  });
  await post(request, "/classrooms/management-class/general-settings", {
    minutes: 60,
    policy: rules,
  });
  const overview = await (
    await request.get("/api/classrooms/management-class/learning")
  ).json();
  for (const e of overview.exams)
    if (e.enabled)
      await post(request, `/learning/exams/${e.id}/state`, { enabled: false });
  const answers = new Map<string, number>();
  for (const r of overview.runs) {
    const v = await (
      await request.get(`/api/learning/exam-runs/${r.id}`)
    ).json();
    for (const q of v.results ?? []) answers.set(q.questionId, q.correctIndex);
  }
  await post(request, "/auth/login", {
    email: "management@greenedu.test",
    password: "ManagementTest123!",
  });
  const study = await post(request, "/study/start", {
    chapterId: "management-ch",
  });
  const corrections = await (await request.get("/api/corrections")).json();
  for (const q of corrections)
    await post(request, "/attempts", {
      questionId: q.id,
      selected: answers.get(q.id) ?? 0,
      mode: "correction",
      requestId: crypto.randomUUID(),
    });
  await post(request, "/study/stop", {
    sessionId: study.sessionId,
    active: false,
  });
  await post(request, "/auth/login", {
    email: "giaovien@greenedu.nk",
    password: "GreenEdu123!",
  });
});

test("magnifier opens the selected student; common settings persist and practice lock reaches the student", async ({
  page,
  browser,
}, info) => {
  await login(page, true);
  await navigateTo(page, { name: "Quản lý lớp", exact: true });
  const magnifier = page.getByRole("button", {
    name: "Xem thống kê · Học sinh chính sách",
    exact: true,
  });
  await magnifier.click();
  const stats = page.getByRole("dialog", {
    name: "Thống kê thời gian học",
    exact: true,
  });
  await expect(stats.getByLabel("Học sinh", { exact: true })).toHaveValue(
    "management-student",
  );
  await stats.getByRole("button", { name: "Đóng", exact: true }).click();
  await expect(magnifier).toBeFocused();
  const form = page.getByRole("form", { name: "Cài đặt thời gian tăng cấp" });
  await expect(
    page.getByRole("heading", { name: "Quản lý chung", exact: true }),
  ).toBeVisible();
  await form.getByLabel("Nhắc nhở khi không tương tác (giây)").fill("20");
  await form.getByRole("button", { name: "Lưu thay đổi", exact: true }).click();
  await expect(page.locator(".toast[role=status]")).toContainText(
    "Đã lưu cài đặt chung",
  );
  const row = page.locator(".chapter-row").filter({
    has: page.getByRole("heading", {
      name: "Chương chính sách",
      exact: true,
    }),
  });
  await row
    .getByRole("button", {
      name: "Khóa luyện tập · Chương chính sách",
      exact: true,
    })
    .click();
  await expect(row).toContainText("Luyện tập đang khóa");
  const ctx = await browser.newContext({ ...info.project.use });
  const student = await ctx.newPage();
  try {
    await login(student);
    await navigateTo(student, { name: "Luyện tập", exact: true });
    await expect(
      student.getByRole("button", { name: "Luyện tập đang khóa", exact: true }),
    ).toBeDisabled();
    expect(
      (
        await student.request.get("/api/chapters/management-ch/questions")
      ).status(),
    ).toBe(403);
  } finally {
    await ctx.close();
  }
  await page.bringToFront();
  await page.reload();
  await page.getByLabel("Chọn lớp học").selectOption("management-class");
  await navigateTo(page, { name: "Quản lý lớp", exact: true });
  await expect(form.getByLabel("Nhắc nhở khi không tương tác (giây)")).toHaveValue(
    "20",
  );
  await expect(
    page.getByRole("button", {
      name: "Mở luyện tập · Chương chính sách",
      exact: true,
    }),
  ).toBeVisible();
  await page.screenshot({
    path: `.local/class-management-20261015/teacher-${info.project.name}.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("teacher uploads a reward paper, student participates, then close/reuse/delete preserve prior results", async ({
  page,
  browser,
}, info) => {
  await login(page, true);
  await navigateTo(page, { name: "Quản lý lớp", exact: true });
  await page
    .getByRole("button", {
      name: "Mở săn thưởng · Chương chính sách",
      exact: true,
    })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Mở săn thưởng",
    exact: true,
  });
  await dialog.getByLabel("Tên bộ đề").fill("Đề thưởng kiểm thử");
  await dialog.getByLabel("Thời gian chuẩn bị (phút)").fill("0");
  await dialog.getByLabel("Thời gian làm bài (phút)").fill("25");
  await dialog.getByLabel("File đề (.docx hoặc .csv)").setInputFiles({
    name: "san-thuong.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      "Bài học,Câu hỏi,A,B,C,D,Đáp án,Lời giải\nBài 1,Câu thưởng riêng,A,B,C,D,A,Lời giải riêng\n",
    ),
  });
  await expect(
    dialog.getByRole("button", { name: "Mở săn thưởng", exact: true }),
  ).toBeEnabled();
  await dialog.screenshot({
    path: `.local/class-management-20261015/upload-${info.project.name}.png`,
  });
  await dialog
    .getByRole("button", { name: "Mở săn thưởng", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole("button", {
      name: "Khóa săn thưởng · Chương chính sách",
      exact: true,
    }),
  ).toBeVisible();
  const ctx = await browser.newContext({ ...info.project.use });
  const student = await ctx.newPage();
  let runId = "";
  try {
    await login(student);
    await navigateTo(student, { name: "Ôn tập & kiểm tra" });
    const card = student
      .locator(".hunt-chapter")
      .filter({ hasText: "Chương chính sách" });
    await expect(card).toContainText("Đề thưởng kiểm thử");
    await card.getByRole("button", { name: "Săn thưởng", exact: true }).click();
    await expect(student.locator(".exam-room")).toBeVisible();
    await expect(student.locator(".exam-room")).toContainText(
      "Câu thưởng riêng",
    );
    runId = new URLSearchParams(new URL(student.url()).hash.slice(1)).get(
      "exam",
    )!;
    await page.bringToFront();
    await page
      .getByRole("button", {
        name: "Khóa săn thưởng · Chương chính sách",
        exact: true,
      })
      .click();
    const close = page.getByRole("dialog", {
      name: "Khóa săn thưởng",
      exact: true,
    });
    await expect(close.getByLabel("Xóa bộ đề đã tải lên")).not.toBeChecked();
    await close
      .getByRole("button", { name: "Xác nhận khóa", exact: true })
      .click();
    await expect(close).toHaveCount(0);
    await student.bringToFront();
    await expect(student.locator(".exam-room")).toContainText(
      "Giáo viên đã đóng bài thi",
      { timeout: 10000 },
    );
    expect(
      (
        await (
          await student.request.get(`/api/learning/exam-runs/${runId}`)
        ).json()
      ).reason,
    ).toBe("teacher");
  } finally {
    await ctx.close();
  }
  await page.bringToFront();
  await page
    .getByRole("button", {
      name: "Mở săn thưởng · Chương chính sách",
      exact: true,
    })
    .click();
  await expect(
    dialog.getByLabel(/Sử dụng bộ đề đã tải trước đó/),
  ).toBeChecked();
  await expect(dialog).toContainText(/\d{1,2}\/\d{1,2}\/\d{2,4}/);
  await dialog
    .getByRole("button", { name: "Mở săn thưởng", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Khóa săn thưởng · Chương chính sách",
      exact: true,
    })
    .click();
  const close = page.getByRole("dialog", {
    name: "Khóa săn thưởng",
    exact: true,
  });
  await close.getByLabel("Xóa bộ đề đã tải lên").check();
  await close.getByRole("button", { name: "Xác nhận khóa" }).click();
  await page
    .getByRole("button", {
      name: "Mở săn thưởng · Chương chính sách",
      exact: true,
    })
    .click();
  await expect(dialog.getByLabel(/Sử dụng bộ đề đã tải trước đó/)).toHaveCount(
    0,
  );
  await expect(
    dialog.getByRole("button", { name: "Mở săn thưởng", exact: true }),
  ).toBeDisabled();
  expect(
    (await (await page.request.get(`/api/learning/exam-runs/${runId}`)).json())
      .questions[0].text,
  ).toBe("Câu thưởng riêng");
});

test("practice warns at the second away event and closes at the third without adding time", async ({
  page,
  request,
}) => {
  await login(page);
  await navigateTo(page, { name: "Luyện tập", exact: true });
  await page
    .locator(".chapter-card")
    .getByRole("button", { name: /^(Luyện tập|Ôn tập lại)$/, exact: true })
    .click();
  await expect(page.locator(".question-card")).toBeVisible();
  await expect
    .poll(async () => {
      const r = await page.request.get("/api/classrooms/management-class");
      return r.status();
    })
    .not.toBe(401);
  const baseline = (
    await (await page.request.get("/api/classrooms")).json()
  ).find((c: any) => c.id === "management-class").chapters[0].seconds;
  const away = async (value: boolean) =>
    page.evaluate((value) => {
      Object.defineProperty(document, "hidden", {
        configurable: true,
        get: () => value,
      });
      document.hasFocus = () => !value;
      document.dispatchEvent(new Event("visibilitychange"));
      window.dispatchEvent(new Event(value ? "blur" : "focus"));
    }, value);
  await away(true);
  await away(false);
  await page.getByRole("button", { name: "Tiếp tục học", exact: true }).click();
  await away(true);
  await away(false);
  const warning = page.getByRole("dialog", {
    name: "Nhắc nhở phiên học",
    exact: true,
  });
  await expect(warning).toContainText("2/3");
  await warning
    .getByRole("button", { name: "Tiếp tục học", exact: true })
    .click();
  await away(true);
  await away(false);
  await expect(
    page.getByRole("dialog", { name: "Phiên học đã kết thúc" }),
  ).toContainText("giới hạn rời tab");
  await expect
    .poll(async () => {
      const rows = await (await page.request.get("/api/classrooms")).json();
      return rows.find((c: any) => c.id === "management-class").chapters[0]
        .seconds;
    })
    .toBe(baseline);
});

test("idle reminder becomes automatic submission even though the exam keeps polling", async ({
  page,
  request,
}) => {
  await post(request, "/classrooms/management-class/general-settings", {
    minutes: 60,
    policy: { ...rules, warningIdleSeconds: 5, closeIdleSeconds: 8 },
  });
  const e = await post(request, "/classrooms/management-class/exams", {
    title: "Thi kiểm tra idle",
    chapterIds: ["management-ch"],
    questionCount: 1,
    startsAt: Date.now() - 1000,
    closesAt: Date.now() + 600000,
  });
  await login(page);
  const run = await post(
    page.request,
    "/classrooms/management-class/exam-runs",
    { examId: e.id, requestId: crypto.randomUUID() },
  );
  await page.goto(`/#learning=management-class&exam=${run.id}`);
  await page.reload();
  await expect(page.locator(".exam-room")).toBeVisible();
  await expect(
    page.getByRole("dialog", { name: "Nhắc nhở bài kiểm tra", exact: true }),
  ).toBeVisible({ timeout: 10000 });
  await expect(page.locator(".exam-room")).toContainText(
    "Tự nộp do không tương tác",
    { timeout: 14000 },
  );
  const saved = await (
    await page.request.get(`/api/learning/exam-runs/${run.id}`)
  ).json();
  expect(saved.reason).toBe("idle");
  expect(saved.status).toBe("submitted");
});
