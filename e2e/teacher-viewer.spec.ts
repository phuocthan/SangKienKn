import { test, expect } from "@playwright/test";
import { navigateTo } from "./navigation";

test("read-only teacher browses owner classes and results while mutation controls and APIs remain blocked", async ({
  page,
}, info) => {
  const login = await page.request.post("/api/auth/login", {
    data: { email: "viewer@greenedu.test", password: "ViewerTest123!" },
  });
  expect(login.ok()).toBe(true);
  expect((await login.json()).id).toBe("viewer-e2e");
  await page.goto("/");
  await expect(page.getByText(/Giáo viên chỉ xem ·/)).toBeVisible();
  await page.getByLabel("Chọn lớp học").selectOption("learning-class");
  await expect(
    page.getByRole("button", { name: "Thêm học sinh", exact: true }),
  ).toBeDisabled();
  await navigateTo(page, { name: "Ngân hàng câu hỏi", exact: true });
  await expect(
    page.getByRole("button", { name: "Thêm câu hỏi", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Nhập câu hỏi", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Sửa câu hỏi", exact: true }).first(),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Lịch sử sửa", exact: true }).first(),
  ).toBeEnabled();
  const search = page.getByRole("searchbox", { name: /Tìm câu hỏi/ });
  await search.fill("số 4");
  await expect(page.locator(".bank-list .bank-question")).toHaveCount(1);
  await page.screenshot({
    path: `.local/teacher-viewer-20261026/questions-${info.project.name}.png`,
    fullPage: true,
  });
  await navigateTo(page, { name: "Săn thưởng", exact: true });
  await expect(
    page
      .getByRole("button", {
        name: /Mở săn thưởng|Khóa săn thưởng/,
        exact: true,
      })
      .first(),
  ).toBeDisabled();
  await expect(
    page.getByRole("form", { name: "Ngưỡng điểm Săn thưởng" }),
  ).toHaveCount(0);
  await navigateTo(page, { name: "Kiểm tra", exact: true });
  await expect(
    page.getByRole("button", { name: "Tạo bài kiểm tra", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Các buổi kiểm tra online" }),
  ).toBeVisible();
  const denied = await page.request.post("/api/classrooms", {
    data: { name: "Không được tạo", subject: "Vật lý", grade: "10" },
  });
  expect(denied.status()).toBe(403);
  expect((await (await page.request.get("/api/auth/me")).json()).id).toBe(
    "viewer-e2e",
  );
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
