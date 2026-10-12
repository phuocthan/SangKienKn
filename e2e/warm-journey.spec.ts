import { test, expect } from "@playwright/test";
import { navigateTo } from "./navigation";

for (const role of ["teacher", "student"] as const) {
  test(`${role} restores flat menus and original icons with warm learning details`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    expect(
      (
        await page.request.post("/api/auth/login", {
          data:
            role === "teacher"
              ? { email: "giaovien@greenedu.nk", password: "GreenEdu123!" }
              : { email: "levels@greenedu.test", password: "LevelsTest123!" },
        })
      ).ok(),
    ).toBeTruthy();
    await page.goto("/");
    await page.setViewportSize({ width: 1440, height: 1000 });
    const nav = page.getByRole("navigation", { name: "Điều hướng chính" });
    await expect(nav.getByRole("button")).toHaveCount(9);
    await expect(page.locator(".topbar .breadcrumb")).toHaveCount(0);
    await expect(page.locator(".topbar > .page-heading")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(
      page.locator(".nav-group-trigger, .forest-icon, .forest-icon-foliage"),
    ).toHaveCount(0);
    await expect(page.locator(".sidebar-note-art")).toBeVisible();
    if (role === "student") {
      const chapter = page.locator(".chapter-card").first();
      await expect(chapter.locator(".button")).toHaveCSS(
        "background-color",
        "rgb(49, 93, 62)",
      );
      await expect(chapter.locator(".chapter-progress > span")).toHaveCSS(
        "font-style",
        "italic",
      );
      await expect(chapter.locator(".chapter-progress > span")).toHaveCSS(
        "opacity",
        "0.85",
      );
      await expect(page.locator(".chapter-card").nth(1)).toHaveCSS(
        "border-top-color",
        "rgb(199, 221, 181)",
      );
      await expect(chapter.locator(".chapter-progress")).toContainText(
        "để lên Chồi",
      );
      await expect(chapter.locator(".progress-track")).toHaveAttribute(
        "aria-valuenow",
        "0",
      );
      const timeline = page.locator(".chapter-level-timeline").first();
      await expect(timeline.locator(".journey-path-base")).toHaveCount(1);
      await expect(timeline.locator(".locked")).toHaveCount(4);
      await expect(timeline.locator(".journey-path-fill")).toHaveCount(0);
      for (const level of [2, 5]) {
        await page
          .getByLabel("Chọn lớp học")
          .selectOption(`levels-class-${level}`);
        await expect(timeline).toHaveAttribute("data-level", String(level));
        await expect(
          timeline.locator(".chapter-level-milestones .earned"),
        ).toHaveCount(level - 1);
        await expect(timeline.locator(".journey-path-fill")).toHaveAttribute(
          "data-progress-percent",
          String((level - 1) * 25),
        );
        await expect(timeline.locator(".chapter-level-rail")).toHaveAttribute(
          "aria-valuenow",
          String((level - 1) * 3600),
        );
      }
      await page.getByLabel("Chọn lớp học").selectOption("levels-class-2");
    }
    await page.mouse.move(1200, 50);
    await page.waitForTimeout(250);
    await page.screenshot({
      path: `.local/warm-journey-${info.project.name}-${role}-desktop.png`,
      fullPage: true,
    });
    for (const viewport of [
      { width: 320, height: 640 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport);
      await expect(page.locator(".topbar > .page-heading")).toBeHidden();
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
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
    }
    await navigateTo(page, {
      name: role === "teacher" ? "Tổng quan" : "Khu vườn của tôi",
      exact: true,
    });
    await page.screenshot({
      path: `.local/warm-journey-${info.project.name}-${role}-mobile.png`,
      fullPage: true,
    });
    expect(errors).toEqual([]);
  });
}
