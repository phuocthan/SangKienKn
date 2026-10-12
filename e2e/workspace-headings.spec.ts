import { test, expect } from "@playwright/test";
import { navigateTo } from "./navigation";

for (const role of ["teacher", "student"] as const) {
  test(`${role} has a single raised heading and no breadcrumb throughout the workspace`, async ({
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
    const pages =
      role === "teacher"
        ? [
            "Tổng quan",
            "Lớp học của tôi",
            "Hoạt động nhóm",
            "Ngân hàng câu hỏi",
            "Ôn tập & kiểm tra",
            "Quản lý kiểm tra online",
            "Tiến độ học tập",
            "Khu vườn của lớp",
            "Xếp hạng chăm chỉ",
            "Quản lý góp ý",
            "Tài khoản",
          ]
        : [
            "Khu vườn của tôi",
            "Luyện tập",
            "Ôn tập & kiểm tra",
            "Kiểm tra online",
            "Hoạt động nhóm",
            "Sổ tay sửa sai",
            "Hành trình của tôi",
            "Khu vườn của lớp",
            "Xếp hạng chăm chỉ",
            "Góp ý",
            "Tài khoản",
          ];
    const desktop = info.project.name === "desktop";
    for (const viewport of desktop
      ? [
          { width: 1440, height: 1000 },
          { width: 900, height: 700 },
        ]
      : [
          { width: 390, height: 844 },
          { width: 768, height: 1024 },
        ]) {
      await page.setViewportSize(viewport);
      for (const name of pages) {
        if (["Quản lý góp ý", "Góp ý", "Tài khoản"].includes(name)) {
          await page.getByRole("button", { name, exact: true }).click();
        } else {
          await navigateTo(page, { name, exact: true });
        }
        await expect(page.locator(".breadcrumb")).toHaveCount(0);
        const heading = page.getByRole("heading", { level: 1 });
        await expect(heading).toHaveCount(1);
        await expect(heading).toBeVisible();
        const slot = page.locator(".workspace-heading-slot");
        if (desktop) {
          await expect(slot.getByRole("heading", { level: 1 })).toHaveCount(1);
          const bounds = await heading.boundingBox();
          const topbar = await page.locator(".topbar").boundingBox();
          expect(bounds!.y).toBeLessThan(topbar!.y + topbar!.height);
          expect(bounds!.y).toBeLessThanOrEqual(40);
        } else {
          await expect(slot).toBeHidden();
          await expect(
            page.locator(".main-content").getByRole("heading", { level: 1 }),
          ).toHaveCount(1);
        }
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        if (viewport.width === 1440 || viewport.width === 390) {
          if (
            [
              "Xếp hạng chăm chỉ",
              "Hoạt động nhóm",
              "Ôn tập & kiểm tra",
              "Quản lý góp ý",
              "Góp ý",
            ].includes(name)
          ) {
            await page.screenshot({
              path: `.local/heading-${role}-${viewport.width}-${pages.indexOf(name)}.png`,
              fullPage: true,
            });
          }
        }
      }
    }
    // Resize without navigation; the same heading moves with the layout.
    await page.setViewportSize({ width: 1440, height: 1000 });
    await expect(page.locator(".workspace-heading-slot h1")).toHaveText(
      "Tài khoản & bảo mật",
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator(".main-content h1")).toHaveText(
      "Tài khoản & bảo mật",
    );
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    expect(errors).toEqual([]);
  });
}
