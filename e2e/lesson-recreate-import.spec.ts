import { test, expect } from "@playwright/test";
import { strToU8, zipSync } from "fflate";
import { navigateTo } from "./navigation";

test("teacher deletes and recreates a lesson, then uploads Word and CSV without reviving old questions", async ({
  page,
}, info) => {
  await page.request.post("/api/auth/login", {
    data: { email: "giaovien@greenedu.nk", password: "GreenEdu123!" },
  });
  const classroom = await (
    await page.request.post("/api/classrooms", {
      data: {
        name: `Nhập lại ${info.project.name} ${Date.now()}`,
        subject: "Vật lý",
        grade: "11",
      },
    })
  ).json();
  const chapter = await (
    await page.request.post(`/api/classrooms/${classroom.id}/chapters`, {
      data: { title: "Chương kiểm thử nhập lại" },
    })
  ).json();
  const oldTitle = "Bài 1: Dao động điều hoà";
  const title = "Bài 1 - Dao động điều hòa";
  expect(
    (
      await page.request.post(`/api/chapters/${chapter.id}/lessons`, {
        data: { title: oldTitle },
      })
    ).ok(),
  ).toBeTruthy();
  expect(
    (
      await page.request.post(`/api/chapters/${chapter.id}/questions`, {
        data: {
          lesson: oldTitle,
          text: "Câu cũ cần giữ ẩn",
          choices: ["A", "B", "C", "D"],
          correctIndex: 0,
          explanation: "Đáp án A.",
        },
      })
    ).ok(),
  ).toBeTruthy();
  await page.goto("/");
  await page.getByLabel("Chọn lớp học").selectOption(classroom.id);
  await navigateTo(page, { name: "Ngân hàng câu hỏi" });
  await page.getByLabel("Lọc theo bài học").selectOption(oldTitle);
  await page.getByRole("button", { name: "Xóa cả bài", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Xác nhận xóa bài", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await navigateTo(page, { name: "Quản lý lớp" });
  await page.getByRole("button", { name: "Thêm bài", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByLabel("Tên bài", { exact: true })
    .fill(title);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Thêm bài", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await navigateTo(page, { name: "Ngân hàng câu hỏi" });
  await page.getByRole("button", { name: "Nhập câu hỏi", exact: true }).click();
  let dialog = page.getByRole("dialog");
  await dialog.getByLabel("Bài nhận câu hỏi").selectOption("");
  const lines = [
    "Câu 1: Biên độ của x = 4cos(2t) cm?",
    `Bài học: ${oldTitle}`,
    "A. 4 cm",
    "B. 2 cm",
    "C. 8 cm",
    "D. 1 cm",
    "Đáp án: A",
    "Lời giải: Biên độ là 4 cm.",
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${lines.map((line) => `<w:p><w:r><w:t>${line}</w:t></w:r></w:p>`).join("")}</w:body></w:document>`;
  const word = zipSync({ "word/document.xml": strToU8(xml) });
  await dialog
    .getByLabel("File câu hỏi Word (.docx)")
    .setInputFiles({
      name: "bai-cu.docx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      buffer: Buffer.from(word),
    });
  await expect(
    dialog.getByRole("heading", { name: "Xem trước · 1 câu hợp lệ" }),
  ).toBeVisible();
  await dialog
    .getByRole("button", { name: "Xác nhận nhập 1 câu", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await page.getByLabel("Lọc theo bài học").selectOption(title);
  await expect(page.locator(".bank-question")).toHaveCount(1);
  await page.getByRole("button", { name: "Nhập câu hỏi", exact: true }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Định dạng file").selectOption("csv");
  await dialog.getByLabel("Bài nhận câu hỏi").selectOption(title);
  const csv = `Bài học,Câu hỏi,A,B,C,D,Đáp án,Lời giải\n${oldTitle},Tần số của dao động 2 Hz có chu kỳ bao nhiêu?,0.5 s,1 s,2 s,4 s,A,T = 1/f = 0.5 s.\n`;
  await dialog
    .getByLabel("File câu hỏi CSV")
    .setInputFiles({
      name: "bai-cu.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csv),
    });
  await expect(
    dialog.getByRole("heading", { name: "Xem trước · 1 câu hợp lệ" }),
  ).toBeVisible();
  await dialog
    .getByRole("button", { name: "Xác nhận nhập 1 câu", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await page.getByLabel("Lọc theo bài học").selectOption(title);
  await expect(page.locator(".bank-question")).toHaveCount(2);
  await page.reload();
  await page.getByLabel("Chọn lớp học").selectOption(classroom.id);
  await navigateTo(page, { name: "Ngân hàng câu hỏi" });
  await page.getByLabel("Lọc theo bài học").selectOption(title);
  await expect(page.locator(".bank-question")).toHaveCount(2);
  const bank = await (
    await page.request.get(
      `/api/chapters/${chapter.id}/questions?showHidden=1`,
    )
  ).json();
  expect(bank.filter((q: { active: boolean }) => q.active)).toHaveLength(2);
  expect(
    bank
      .filter((q: { active: boolean }) => q.active)
      .every((q: { lesson: string }) => q.lesson === title),
  ).toBeTruthy();
  await page.getByLabel("Hiện cả câu đã ẩn").check();
  await page.getByLabel("Lọc theo bài học").selectOption("");
  await expect(page.locator(".bank-question")).toHaveCount(3);
  await expect(
    page.getByText("Câu cũ cần giữ ẩn", { exact: true }),
  ).toBeVisible();
});
