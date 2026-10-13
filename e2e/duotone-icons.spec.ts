import { test, expect } from "@playwright/test";
import { navigateTo } from "./navigation";

for (const role of ["teacher", "student"] as const) {
  test(`${role} duotone icons retain labels, fit navigation and render the garden stages`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.request.post("/api/auth/login", {
      data:
        role === "teacher"
          ? { email: "giaovien@greenedu.nk", password: "GreenEdu123!" }
          : { email: "levels@greenedu.test", password: "LevelsTest123!" },
    });
    await page.goto("/");
    const navigation = page.getByRole("navigation", {
      name: "Điều hướng chính",
    });
    await expect(navigation).toBeVisible();
    const destinations =
      role === "teacher"
        ? [
            ["Tổng quan", "SquaresFour"],
            ["Lớp học của tôi", "ChalkboardTeacher"],
            ["Ngân hàng câu hỏi", "Books"],
            ["Ôn tập & kiểm tra", "GraduationCap"],
            ["Kiểm tra online", "ClipboardText"],
          ]
        : [
            ["Khu vườn của tôi", "Plant"],
            ["Luyện tập", "BookOpenText"],
            ["Ôn tập & kiểm tra", "GraduationCap"],
            ["Kiểm tra online", "ClipboardText"],
            ["Lớp học của tôi", "Tree"],
          ];
    for (const [label, icon] of destinations) {
      const button = navigation.getByRole("button", {
        name: label,
        exact: true,
      });
      await expect(button.locator("svg")).toHaveAttribute(
        "data-icon-name",
        icon,
      );
      await expect(button.locator("svg")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
      await expect(button.locator("svg path").first()).toBeAttached();
    }
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({
        width,
        height: width === 1440 ? 1000 : 900,
      });
      await expect(navigation.locator("svg")).toHaveCount(5);
      for (const icon of await navigation.locator("svg").all()) {
        await expect(icon).toBeInViewport();
        const fits = await icon.evaluate((node) => {
          const a = node.getBoundingClientRect();
          const b = node.closest("button")!.getBoundingClientRect();
          return (
            a.width >= 16 &&
            a.height >= 16 &&
            a.left >= b.left &&
            a.right <= b.right
          );
        });
        expect(fits).toBe(true);
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    if (role === "student") {
      const timeline = page.locator(".chapter-level-timeline").first();
      const stages = timeline.locator(
        '.student-level-icon[data-icon-family="greenedu-duotone"]',
      );
      await expect(stages).toHaveCount(5);
      for (const [index, name] of [
        "Mầm",
        "Chồi",
        "Cây Non",
        "Đơm Hoa",
        "Kết Trái",
      ].entries()) {
        await expect(stages.nth(index)).toHaveAccessibleName(
          `Cấp ${index + 1} · ${name}`,
        );
        await expect(stages.nth(index)).toHaveAttribute(
          "data-level",
          String(index + 1),
        );
      }
      await timeline.scrollIntoViewIfNeeded();
      await timeline.screenshot({
        path: `.local/duotone-${info.project.name}-stages.png`,
      });
      await navigateTo(page, { name: "Sổ tay sửa sai", exact: true });
      await expect(
        page
          .getByRole("tab", { name: "Sổ tay sửa sai", exact: true })
          .locator("svg"),
      ).toHaveAttribute("data-icon-name", "Notebook");
      await navigateTo(page, { name: "Khu vườn của tôi", exact: true });
    } else {
      await navigateTo(page, { name: "Lớp học của tôi", exact: true });
      await expect(
        page.getByRole("region", { name: "Khu vườn của lớp", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("tab", { name: "Khu vườn của lớp", exact: true }),
      ).toHaveCount(1);
      await navigateTo(page, { name: "Tổng quan", exact: true });
    }
    await page.setViewportSize(
      info.project.name === "mobile"
        ? { width: 393, height: 851 }
        : { width: 1440, height: 1000 },
    );
    await page.screenshot({
      path: `.local/duotone-${info.project.name}-${role}.png`,
      fullPage: true,
    });
    expect(errors).toEqual([]);
  });
}
