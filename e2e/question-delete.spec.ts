import { navigateTo } from "./navigation";
import { test, expect } from "@playwright/test";

test("teacher selects questions, cancels or deletes a batch, and deletes the whole lesson", async ({
  page,
}, info) => {
  await page.request.post("/api/auth/login", {
    data: { email: "giaovien@greenedu.nk", password: "GreenEdu123!" },
  });
  const classroom = await (
    await page.request.post("/api/classrooms", {
      data: {
        name: `Xóa câu ${info.project.name} ${Date.now()}`,
        subject: "Vật lý",
        grade: "11",
      },
    })
  ).json();
  const chapter = await (
    await page.request.post(`/api/classrooms/${classroom.id}/chapters`, {
      data: { title: "Chương xóa thử" },
    })
  ).json();
  for (const title of ["Bài 1", "Bài 2", "Bài rỗng"])
    expect(
      (
        await page.request.post(`/api/chapters/${chapter.id}/lessons`, {
          data: { title },
        })
      ).ok(),
    ).toBeTruthy();
  for (let i = 1; i <= 4; i++)
    expect(
      (
        await page.request.post(`/api/chapters/${chapter.id}/questions`, {
          data: {
            text: `Câu kiểm thử ${i}`,
            lesson: i <= 3 ? "Bài 1" : "Bài 2",
            choices: ["A", "B", "C", "D"],
            correctIndex: 0,
            explanation: "Lời giải",
          },
        })
      ).ok(),
    ).toBeTruthy();
  await page.goto("/");
  await page.getByLabel("Chọn lớp học").selectOption(classroom.id);
  await navigateTo(page, { name: "Ngân hàng câu hỏi" });
  await page.getByLabel("Lọc theo bài học").selectOption("Bài 1");
  await expect(page.locator(".bank-question")).toHaveCount(3);
  await page
    .getByRole("checkbox", {
      name: "Chọn câu hỏi: Câu kiểm thử 1",
      exact: true,
    })
    .check();
  await page
    .getByRole("checkbox", {
      name: "Chọn câu hỏi: Câu kiểm thử 2",
      exact: true,
    })
    .check();
  await expect(page.getByText("Đã chọn 2 câu", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Xóa các câu đã chọn" }).click();
  await expect(page.getByRole("dialog")).toContainText("Xóa 2 câu hỏi");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Hủy", exact: true })
    .click();
  await expect(page.locator(".bank-question")).toHaveCount(3);
  // Switching scope must never carry selected IDs into another lesson.
  await page.getByLabel("Lọc theo bài học").selectOption("Bài 2");
  await expect(page.getByRole("checkbox", { name: /Chọn câu hỏi:/ }).first()).not.toBeChecked();
  await expect(
    page.getByRole("button", { name: "Xóa các câu đã chọn" }),
  ).toHaveCount(0);
  await page.getByLabel("Lọc theo bài học").selectOption("Bài 1");
  await page.getByRole("checkbox", { name: "Chọn tất cả trong bài" }).check();
  await page
    .getByRole("checkbox", {
      name: "Chọn câu hỏi: Câu kiểm thử 3",
      exact: true,
    })
    .uncheck();
  await page.locator(".bank-management").screenshot({
    path: info.outputPath("selection.png"),
    style: ".sidebar {visibility:hidden!important}",
  });
  await page.getByRole("button", { name: "Xóa các câu đã chọn" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Xác nhận xóa 2 câu", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".bank-question")).toHaveCount(2);
  await expect(
    page.getByText("Đã xóa 2 câu khỏi lượt học mới.", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Hiện cả câu đã ẩn").check();
  await page.getByLabel("Lọc theo bài học").selectOption("Bài 1");
  await expect(page.locator(".bank-question")).toHaveCount(3);
  await expect(
    page.locator(".bank-question .bank-question-select"),
  ).toHaveCount(1);
  await page.getByRole("button", { name: "Xóa cả bài", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("toàn bộ 1 câu hỏi");
  await page
    .getByRole("dialog")
    .screenshot({ path: info.outputPath("delete-lesson.png") });
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Xác nhận xóa bài", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByLabel("Lọc theo bài học").locator("option", { hasText: "Bài 1" }),
  ).toHaveCount(0);
  await expect(
    page.getByLabel("Lọc theo bài học").locator("option", { hasText: "Bài 2" }),
  ).toHaveCount(1);
  await page.getByLabel("Hiện cả câu đã ẩn").uncheck();
  await expect(page.locator(".bank-question")).toHaveCount(1);
  await page.reload();
  await page.getByLabel("Chọn lớp học").selectOption(classroom.id);
  await navigateTo(page, { name: "Ngân hàng câu hỏi" });
  await expect(page.locator(".bank-question")).toHaveCount(1);
  await page.getByLabel("Lọc theo bài học").selectOption("Bài rỗng");
  await page.getByRole("button", { name: "Xóa cả bài", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Xác nhận xóa bài", exact: true })
    .click();
  await expect(
    page
      .getByLabel("Lọc theo bài học")
      .locator("option", { hasText: "Bài rỗng" }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("old backend capability disables bulk deletion without sending any mutation", async ({
  page,
}) => {
  await page.route("**/api/classrooms", async (route) => {
    if (route.request().method() !== "GET") return route.continue();
    const response = await route.fetch(),
      rows = await response.json();
    for (const classroom of rows)
      for (const chapter of classroom.chapters)
        delete chapter.canDeleteQuestions;
    await route.fulfill({ response, json: rows });
  });
  await page.goto("/");
  await page.getByLabel("Email", { exact: true }).fill("giaovien@greenedu.nk");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("GreenEdu123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await navigateTo(page, { name: "Ngân hàng câu hỏi" });
  await expect(
    page.getByRole("button", { name: "Xóa các câu đã chọn" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("checkbox", { name: "Chọn tất cả đang hiển thị" }),
  ).toBeDisabled();
  await expect(
    page.getByText("Xóa nhiều câu đang chờ cập nhật server Railway.", {
      exact: true,
    }),
  ).toBeVisible();
});
