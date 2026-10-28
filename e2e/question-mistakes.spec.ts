import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { unzipSync, strFromU8 } from "fflate";
import { navigateTo } from "./navigation";

test("teacher exports the selected chapter's wrong questions to Word and Excel", async ({
  page,
}, info) => {
  await page.request.post("/api/auth/login", {
    data: { email: "management@greenedu.test", password: "ManagementTest123!" },
  });
  expect(
    (
      await page.request.get("/api/chapters/management-ch/mistakes.xlsx")
    ).status(),
  ).toBe(403);
  const study = await (
    await page.request.post("/api/study/start", {
      data: { chapterId: "management-ch" },
    })
  ).json();
  const attempted = await page.request.post("/api/attempts", {
    data: {
      questionId: "management-q1",
      selected: 1,
      mode: "practice",
      requestId: crypto.randomUUID(),
      studySessionId: study.sessionId,
    },
  });
  expect(attempted.ok(), await attempted.text()).toBe(true);
  await page.request.post("/api/study/stop", {
    data: { sessionId: study.sessionId, active: false },
  });
  await page.request.post("/api/auth/login", {
    data: { email: "giaovien@greenedu.nk", password: "GreenEdu123!" },
  });
  await page.goto("/");
  await page.getByLabel("Chọn lớp học").selectOption("management-class");
  await navigateTo(page, { name: "Ngân hàng câu hỏi", exact: true });
  const report = page.getByRole("region", {
    name: "Xuất thống kê câu hỏi thường sai",
  });
  await expect(report).toBeVisible();
  await expect(report).toContainText("Chương đang chọn");
  for (const [format, path] of [
    ["Word", "word/document.xml"],
    ["Excel", "xl/worksheets/sheet1.xml"],
  ]) {
    const downloadPromise = page.waitForEvent("download");
    await report.getByRole("link", { name: `Xuất ${format}` }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain("cau-hoi-thuong-sai");
    const archive = unzipSync(await readFile((await download.path())!));
    const content = strFromU8(archive[path]);
    expect(content).toContain("Câu chính sách 1");
    expect(content).toContain("Chương chính sách");
  }
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await report.screenshot({
    path: `.local/mistake-report-20261028/report-${info.project.name}.png`,
  });
});
