import { test, expect } from "@playwright/test";
import { navigateTo } from "./navigation";

for (const role of ["teacher", "student"] as const) {
  test(`${role} sidebar groups collapse, follow destinations and reopen for the current page`, async ({
    page,
  }, info) => {
    const login = await page.request.post("/api/auth/login", {
      data: {
        email:
          role === "teacher" ? "giaovien@greenedu.nk" : "hocsinh@greenedu.nk",
        password: "GreenEdu123!",
      },
    });
    expect(login.ok()).toBeTruthy();
    await page.goto("/");
    await page.setViewportSize({ width: 1440, height: 1000 });
    const nav = page.getByRole("navigation", { name: "Điều hướng chính" });
    const triggers = nav.locator(".nav-group-trigger");
    await expect(triggers).toHaveCount(3);
    await expect(nav.getByRole("button")).toHaveCount(
      role === "teacher" ? 4 : 5,
    );
    const first = triggers.first();
    await first.focus();
    await page.keyboard.press("Enter");
    await expect(first).toHaveAttribute("aria-expanded", "true");
    const firstChild = nav
      .locator(".nav-submenu:not([hidden]) .nav-subitem")
      .first();
    await firstChild.focus();
    await page.keyboard.press("Escape");
    await expect(first).toHaveAttribute("aria-expanded", "false");
    await expect(first).toBeFocused();
    await triggers.nth(1).click();
    await first.click();
    await expect(triggers.nth(1)).toHaveAttribute("aria-expanded", "false");

    await navigateTo(page, {
      name: role === "teacher" ? "Ngân hàng câu hỏi" : "Luyện tập",
      exact: true,
    });
    const target = nav.getByRole("button", {
      name: role === "teacher" ? "Ngân hàng câu hỏi" : "Luyện tập",
      exact: true,
    });
    await expect(target).toHaveAttribute("aria-current", "page");
    await expect(
      nav.locator(".has-current .nav-group-trigger"),
    ).toHaveAttribute("aria-expanded", "true");
    await page.screenshot({
      path: `.local/grouped-navigation-${info.project.name}-${role}-desktop.png`,
    });

    await nav
      .getByRole("button", {
        name: role === "teacher" ? "Tổng quan" : "Khu vườn của tôi",
        exact: true,
      })
      .click();
    await expect(nav.getByRole("button")).toHaveCount(
      role === "teacher" ? 4 : 5,
    );
    // A content action also opens the relevant group; grouping doesn't change routing.
    if (role === "teacher") {
      await page
        .getByRole("button", { name: "Chuẩn bị bài luyện tập" })
        .click();
      await expect(
        nav.getByRole("button", { name: "Ngân hàng câu hỏi", exact: true }),
      ).toHaveAttribute("aria-current", "page");
    }
    for (const viewport of [
      { width: 320, height: 640 },
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
    ]) {
      await page.setViewportSize(viewport);
      await expect(triggers).toHaveCount(0);
      await expect(nav.getByRole("button")).toHaveCount(9);
      await navigateTo(page, { name: "Xếp hạng chăm chỉ", exact: true });
      await expect(
        nav.getByRole("button", { name: "Xếp hạng chăm chỉ", exact: true }),
      ).toHaveAttribute("aria-current", "page");
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      if (viewport.width === 390)
        await page.screenshot({
          path: `.local/grouped-navigation-${info.project.name}-${role}-mobile.png`,
        });
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await expect(triggers).toHaveCount(3);
    await expect(
      nav.getByRole("button", { name: "Xếp hạng chăm chỉ", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await expect(
      nav.locator(".has-current .nav-group-trigger"),
    ).toHaveAttribute("aria-expanded", "true");
  });
}
