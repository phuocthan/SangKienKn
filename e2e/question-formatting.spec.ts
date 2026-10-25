import { test, expect } from "@playwright/test";
import { navigateTo } from "./navigation";
import { studyDate } from "../shared/study-statistics";
import { readFile } from "node:fs/promises";

test("scripts render in exam, unit answers earn the right score, and range CSV matches the visible report", async ({
  page,
  browser,
}, info) => {
  const teacher = await browser.newContext();
  try {
    await teacher.request.post("/api/auth/login", {
      data: { email: "giaovien@greenedu.nk", password: "GreenEdu123!" },
    });
    const title = `Định dạng ${info.project.name} ${Date.now()}`;
    const created = await teacher.request.post(
      "/api/classrooms/learning-class/exams",
      {
        data: {
          title,
          delivery: "online",
          source: "upload",
          chapterIds: ["learning-ch1"],
          preparationMinutes: 0,
          durationMinutes: 20,
          tabLimit: 10,
          requestId: crypto.randomUUID(),
          questions: [
            {
              chapterId: "learning-ch1",
              question: {
                kind: "short-answer",
                lesson: "Bài định dạng",
                text: "Từ a_{max} = 500 cm/s^{2} và v_{max} = 50 cm/s. Tính tần số góc theo đơn vị rad/s.",
                choices: [],
                correctAnswer: "10",
                explanation: "ω = a_{max}/v_{max} = 10 rad/s.",
              },
            },
          ],
        },
      },
    );
    expect(created.ok(), await created.text()).toBe(true);
    const exam = await created.json();
    expect(
      (
        await teacher.request.post(`/api/learning/exams/${exam.id}/open`, {
          data: {},
        })
      ).ok(),
    ).toBe(true);
    await page.request.post("/api/auth/login", {
      data: { email: "learning@greenedu.test", password: "LearningTest123!" },
    });
    const started = await page.request.post(
      "/api/classrooms/learning-class/exam-runs",
      { data: { examId: exam.id, requestId: crypto.randomUUID() } },
    );
    expect(started.ok()).toBe(true);
    const run = await started.json();
    await page.goto(`/#learning=learning-class&exam=${run.id}`);
    await page.bringToFront();
    await expect(page.locator(".question-card h2 sup")).toHaveText("2");
    await expect(page.locator(".question-card h2 sub")).toHaveCount(2);
    await page.getByLabel("Câu trả lời ngắn", { exact: true }).fill("10 rad/s");
    await expect(page.locator(".info-panel")).toContainText("Đáp án đã lưu");
    page.on("dialog", (dialog) => void dialog.accept());
    await page.getByRole("button", { name: "Nộp bài", exact: true }).click();
    await expect(page.locator(".info-panel")).toContainText("Đã hoàn thành");
    await teacher.request.post(`/api/learning/exams/${exam.id}/state`, {
      data: { enabled: false },
    });
    await page.reload();
    await expect(page.locator(".exam-room")).toContainText("Điểm 10.0 / 10");
    await expect(page.locator(".explanation strong")).toHaveText("Đúng");
    await expect(page.locator(".explanation sub")).toHaveCount(2);
    await page
      .locator(".question-card")
      .screenshot({ path: info.outputPath("exam-scripts.png") });

    await page.request.post("/api/auth/login", {
      data: { email: "giaovien@greenedu.nk", password: "GreenEdu123!" },
    });
    await page.goto("/");
    await page.getByLabel("Chọn lớp học").selectOption("learning-class");
    await navigateTo(page, { name: "Quản lý lớp", exact: true });
    await page.getByRole("button", { name: "Thống kê", exact: true }).click();
    const modal = page.getByRole("dialog", {
      name: "Thống kê thời gian học",
      exact: true,
    });
    const today = studyDate(Date.now());
    await modal.getByLabel("Từ ngày", { exact: true }).fill(today);
    await modal.getByLabel("Đến ngày", { exact: true }).fill(today);
    const table = modal.getByRole("table", {
      name: "Thống kê theo khoảng ngày",
      exact: true,
    });
    await expect(table).toContainText(`${title}: 10 / 10`);
    const download = page.waitForEvent("download");
    await modal.getByRole("button", { name: "Xuất CSV", exact: true }).click();
    const file = await download;
    expect(file.suggestedFilename()).toContain(`${today}-den-${today}.csv`);
    const csv = await readFile((await file.path())!, "utf8");
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain(`${title}: 10 / 10`);
    const cells = await table
      .locator("tbody tr")
      .first()
      .locator("th,td")
      .allTextContents();
    expect(csv).toContain(
      cells.map((v) => `"${v.trim().replaceAll('"', '""')}"`).join(","),
    );
    await modal.getByLabel("Từ ngày", { exact: true }).fill("2026-01-01");
    await modal.getByLabel("Đến ngày", { exact: true }).fill("2026-01-01");
    await expect(table).not.toContainText(title);
    await modal.getByLabel("Từ ngày", { exact: true }).fill(today);
    await expect(modal.getByRole("alert")).toContainText("Chọn khoảng");
    await expect(
      modal.getByRole("button", { name: "Xuất CSV", exact: true }),
    ).toBeDisabled();
    await modal.getByLabel("Đến ngày", { exact: true }).fill(today);
    await expect(table).toContainText(title);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect(await modal.evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(
        true,
      );
    }
    await page.setViewportSize({
      width: info.project.name === "mobile" ? 390 : 1440,
      height: 900,
    });
    await modal.screenshot({ path: info.outputPath("range-statistics.png") });
  } finally {
    await teacher.close();
  }
});
