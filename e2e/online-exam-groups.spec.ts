import { navigateTo } from "./navigation";
import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { unzipSync, strFromU8 } from "fflate";

async function login(page: Page, teacher: boolean) {
  await page.goto("/");
  await page
    .getByLabel("Email", { exact: true })
    .fill(teacher ? "giaovien@greenedu.nk" : "learning@greenedu.test");
  await page
    .getByLabel("Mật khẩu", { exact: true })
    .fill(teacher ? "GreenEdu123!" : "LearningTest123!");
  const noticeResponse = teacher
    ? null
    : page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/learning/exam-notices") &&
          response.ok(),
      );
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByRole("navigation")).toBeVisible();
  if (noticeResponse) {
    const data = await (await noticeResponse).json();
    if (
      data.notices.some(
        (notice: { closesAt: number }) => notice.closesAt > data.serverNow,
      )
    ) {
      const invitation = page.getByRole("dialog", {
        name: "Có kiểm tra online từ giáo viên",
        exact: true,
      });
      await expect(invitation).toBeVisible();
      await invitation
        .getByRole("button", { name: /^(Đã hiểu|Để sau)$/ })
        .click();
      await expect(invitation).toHaveCount(0);
    }
  }
  if (teacher)
    await page.getByLabel("Chọn lớp học").selectOption("learning-class");
  await navigateTo(page, {
    name: teacher ? "Kiểm tra" : "Kiểm tra",
    exact: true,
  });
}

async function teacherOnline(page: Page) {
  await page.getByLabel("Chọn lớp học").selectOption("learning-class");
  await navigateTo(page, { name: "Kiểm tra", exact: true });
}

test("each exam groups counts and runs; tab auto-submit restores practice time before class closes; closed Excel is scoped", async ({
  page,
  browser,
}, info) => {
  await login(page, true);
  const title = `Nhóm trùng tên ${info.project.name} ${Date.now()}`;
  const create = async () => {
    const response = await page.request.post(
      "/api/classrooms/learning-class/exams",
      {
        data: {
          title,
          delivery: "online",
          preparationMinutes: 0,
          durationMinutes: 5,
          chapterIds: ["learning-ch1"],
          questionCount: 2,
          tabLimit: 1,
          requestId: crypto.randomUUID(),
        },
      },
    );
    expect(response.ok()).toBeTruthy();
    return (await response.json()).id as string;
  };
  const a = await create(),
    b = await create();
  const group = page.locator(`[data-exam-id="${a}"]`);
  const other = page.locator(`[data-exam-id="${b}"]`);
  const context = await browser.newContext({ ...info.project.use });
  const student = await context.newPage();
  try {
    await page.reload();
    await teacherOnline(page);
    await expect(group.locator(".online-exam-state")).toHaveText("Chuẩn bị");
    await expect(group).toContainText("Chưa ấn định");
    await expect(
      page.getByRole("heading", { name: "Lượt thi & kết quả", exact: true }),
    ).toHaveCount(0);
    await expect(group.getByRole("link", { name: "Tải kết quả" })).toHaveCount(
      0,
    );
    await group
      .getByRole("button", { name: "Bắt đầu kiểm tra", exact: true })
      .click();
    await expect(group.locator(".online-exam-state")).toHaveText("Đang thi");
    await expect(group.locator(".online-exam-facts")).not.toContainText(
      "Chưa ấn định",
    );
    await login(student, false);
    await student
      .locator(`[data-exam-id="${a}"]`)
      .getByRole("button", { name: "Vào làm kiểm tra", exact: true })
      .click();
    await expect(student.locator(".exam-room")).toBeVisible();
    // Exercise the actual visibility handler and server auto-submit in this isolated fixture.
    await student.evaluate(() => {
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
    await expect(student.locator(".exam-room")).toContainText(
      "Tự nộp do rời tab",
      { timeout: 15000 },
    );
    await expect(student.locator(".exam-room")).toContainText(
      "Chờ công bố điểm",
    );
    await navigateTo(student, { name: "Luyện tập", exact: true });
    await student
      .locator(".chapter-grid")
      .getByRole("button", { name: /^(Luyện tập|Ôn tập lại)$/, exact: true })
      .first()
      .click();
    await expect(student.locator(".practice-layout")).toBeVisible();
    await expect(student.getByRole("alert")).toHaveCount(0);
    await expect(student.locator(".practice-clock")).toContainText(
      "Đang ghi nhận thời gian",
    );
    await expect(
      student.getByLabel("Thời gian phiên học").locator("time"),
    ).not.toHaveText("00:00:00", { timeout: 5000 });
    const heartbeat = await student.waitForResponse(
      (response) =>
        response.url().endsWith("/api/study/heartbeat") && response.ok(),
      { timeout: 20000 },
    );
    expect((await heartbeat.json()).creditedSeconds).toBeGreaterThan(0);
    await student
      .getByRole("button", { name: "Kết thúc phiên", exact: true })
      .click();
    await navigateTo(student, { name: "Kiểm tra", exact: true });
    // Returning from practice opens the grouped list; the submitted run stays saved.
    await expect(student.locator(".exam-room")).toHaveCount(0);
    const myGroup = student.locator(`[data-exam-id="${a}"]`);
    await expect(myGroup.locator(".online-exam-state")).toHaveText("Đang thi");
    await expect(
      myGroup.getByRole("button", { name: "Đã nộp bài", exact: true }),
    ).toBeDisabled();
    await expect(
      myGroup.getByRole("link", { name: "Tải kết quả" }),
    ).toHaveCount(0);
    await page.reload();
    await teacherOnline(page);
    await expect(group.locator(".online-exam-facts")).toContainText(
      "Tham gia1 học sinh",
    );
    await expect(group.locator(".online-exam-facts")).toContainText(
      "Đã nộp1 học sinh",
    );
    await expect(other.locator(".online-exam-facts")).toContainText(
      "Tham gia0 học sinh",
    );
    await group.locator("summary").click();
    await expect(group.locator(".online-exam-result")).toHaveCount(1);
    await expect(group.locator(".online-exam-result")).toContainText(
      "Học sinh ôn thi",
    );
    expect(
      (
        await page.request.get(`/api/learning/exams/${a}/results.xlsx`)
      ).status(),
    ).toBe(409);
    await group
      .getByRole("button", { name: "Đóng bài thi", exact: true })
      .click();
    await expect(group.locator(".online-exam-state")).toHaveText("Kết thúc");
    const downloadEvent = page.waitForEvent("download");
    await group.getByRole("link", { name: "Tải kết quả", exact: true }).click();
    const download = await downloadEvent;
    expect(download.suggestedFilename()).toBe(`greenedu-ket-qua-${a}.xlsx`);
    const zip = unzipSync(await readFile((await download.path())!));
    const metadata = strFromU8(zip["xl/worksheets/sheet1.xml"]);
    expect(metadata).toContain(a);
    expect(metadata).not.toContain(b);
    expect(strFromU8(zip["xl/worksheets/sheet2.xml"])).toContain(
      "Học sinh ôn thi",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await group.screenshot({
      path: `.local/exam-group-${info.project.name}.png`,
    });
  } finally {
    for (const id of [a, b])
      await page.request.post(`/api/learning/exams/${id}/state`, {
        data: { enabled: false },
      });
    await context.close();
  }
});
