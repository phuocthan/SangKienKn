import { expect, test } from "@playwright/test";
import { navigateTo } from "./navigation";

test("student password recovery stays visible beside the correct student across screen sizes", async ({
  page,
}, info) => {
  await page.request.post("/api/auth/login", {
    data: { email: "giaovien@greenedu.nk", password: "GreenEdu123!" },
  });
  await page.goto("/");
  await page.getByLabel("Chọn lớp học").selectOption("learning-class");
  await navigateTo(page, { name: "Quản lý lớp", exact: true });
  const table = page.getByRole("table", { name: "Danh sách học sinh" });
  const row = table
    .getByRole("row")
    .filter({ hasText: "learning@greenedu.test" });
  const button = row.getByRole("button", { name: /Cấp lại mật khẩu/ });
  await expect(button).toBeEnabled();
  await expect(button).toHaveAccessibleName(/Học sinh ôn thi/);
  for (const width of [320, 390, 768, 1024, 1100, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    const scroll = page.locator(".roster-card .table-scroll");
    await scroll.evaluate((el) => {
      el.scrollLeft = 0;
    });
    const bounds = await button.evaluate((el) => {
      const b = el.getBoundingClientRect();
      const container = el.closest(".table-scroll")!.getBoundingClientRect();
      return {
        left: b.left,
        right: b.right,
        height: b.height,
        containerLeft: container.left,
        containerRight: container.right,
        viewport: innerWidth,
        pageWidth: document.documentElement.scrollWidth,
      };
    });
    expect(bounds.left, `left at ${width}px`).toBeGreaterThanOrEqual(
      Math.max(0, bounds.containerLeft) - 1,
    );
    expect(bounds.right, `right at ${width}px`).toBeLessThanOrEqual(
      Math.min(bounds.viewport, bounds.containerRight) + 1,
    );
    expect(bounds.height).toBeGreaterThanOrEqual(44);
    expect(bounds.pageWidth).toBeLessThanOrEqual(width);
  }
  await page.setViewportSize({
    width: info.project.name === "mobile" ? 390 : 1024,
    height: 900,
  });
  await row.screenshot({
    path: info.outputPath("student-password-action.png"),
  });
  await button.focus();
  await page.keyboard.press("Enter");
  const modal = page.getByRole("dialog", {
    name: "Cấp lại mật khẩu",
    exact: true,
  });
  await expect(modal).toBeVisible();
  await expect(modal.getByLabel("Mật khẩu tạm mới")).toBeVisible();
  await modal.getByRole("button", { name: "Đóng", exact: true }).click();
  await expect(modal).toHaveCount(0);
  await expect(button).toBeFocused();
});

test("read-only teacher cannot reset a student's password", async ({
  page,
}) => {
  await page.request.post("/api/auth/login", {
    data: { email: "viewer@greenedu.test", password: "ViewerTest123!" },
  });
  await page.goto("/");
  await page.getByLabel("Chọn lớp học").selectOption("learning-class");
  await navigateTo(page, { name: "Quản lý lớp", exact: true });
  await expect(
    page.getByRole("button", { name: /Cấp lại mật khẩu · Học sinh ôn thi/ }),
  ).toBeDisabled();
});
