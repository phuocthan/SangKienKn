import { test, expect } from "@playwright/test";
import { navigateTo } from "./navigation";

for (const role of ["teacher", "student"] as const) {
  test(`${role} groups only requested destinations and keeps portrait menu dark`, async ({
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
    await page.setViewportSize({ width: 1440, height: 1000 });
    const nav = page.getByRole("navigation", { name: "Điều hướng chính" });
    await expect(nav.getByRole("button")).toHaveCount(
      role === "teacher" ? 6 : 7,
    );
    const landscapeBackground = await page
      .locator(".sidebar")
      .evaluate((node) => getComputedStyle(node).backgroundImage);
    const parents =
      role === "teacher"
        ? [
            {
              label: "Lớp học của tôi",
              items: ["Lớp học của tôi", "Hoạt động nhóm", "Tiến độ học tập"],
            },
            {
              label: "Khu vườn của lớp",
              items: ["Khu vườn của lớp", "Xếp hạng chăm chỉ"],
            },
          ]
        : [
            {
              label: "Khu vườn của tôi",
              items: ["Khu vườn của tôi", "Hành trình của tôi"],
            },
            {
              label: "Khu vườn của lớp",
              items: ["Khu vườn của lớp", "Xếp hạng chăm chỉ"],
            },
          ];
    for (const viewport of [
      { width: 1440, height: 1000 },
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
    ]) {
      await page.setViewportSize(viewport);
      for (const group of parents) {
        await nav
          .getByRole("button", { name: group.label, exact: true })
          .click();
        const tabs = page.getByRole("tablist", {
          name: group.label,
          exact: true,
        });
        await expect(tabs.getByRole("tab")).toHaveCount(group.items.length);
        for (const name of group.items) {
          await tabs.getByRole("tab", { name, exact: true }).click();
          await expect(
            tabs.getByRole("tab", { name, exact: true }),
          ).toHaveAttribute("aria-selected", "true");
          await expect(
            nav.getByRole("button", { name: group.label, exact: true }),
          ).toHaveAttribute("aria-current", "page");
          await expect(page.getByRole("tabpanel")).toHaveAttribute(
            "aria-labelledby",
            (await tabs
              .getByRole("tab", { name, exact: true })
              .getAttribute("id")) as string,
          );
          await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
          const section = (await tabs
            .getByRole("tab", { name, exact: true })
            .getAttribute("id"))!.replace("workspace-tab-", "");
          await expect
            .poll(() =>
              new URLSearchParams(new URL(page.url()).hash.slice(1)).get(
                "section",
              ),
            )
            .toBe(section);
          await page.reload();
          await expect(
            tabs.getByRole("tab", { name, exact: true }),
          ).toHaveAttribute("aria-selected", "true");
          expect(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
          ).toBe(true);
          if (viewport.width === 1440 || viewport.width === 390)
            await page.screenshot({
              path: `.local/parent-tabs-${info.project.name}-${role}-${viewport.width}-${group.items.indexOf(name)}-${parents.indexOf(group)}.png`,
              fullPage: true,
            });
        }
        await tabs.getByRole("tab").last().focus();
        await page.keyboard.press("Home");
        await expect(tabs.getByRole("tab").first()).toHaveAttribute(
          "aria-selected",
          "true",
        );
        await page.keyboard.press("ArrowRight");
        await expect(tabs.getByRole("tab").nth(1)).toBeFocused();
        await expect(tabs.getByRole("tab").nth(1)).toHaveAttribute(
          "aria-selected",
          "true",
        );
      }
      if (viewport.width < 1100) {
        await expect(page.locator(".sidebar")).toHaveCSS(
          "background-image",
          landscapeBackground,
        );
        await expect(page.locator(".sidebar")).toHaveCSS(
          "border-top-width",
          "2px",
        );
        await expect(nav.getByRole("button").first()).toHaveCSS(
          "color",
          "rgb(216, 230, 214)",
        );
        expect(
          (await page.locator(".sidebar").boundingBox())!.y,
        ).toBeGreaterThan(0);
      }
    }
    // Student collaboration remains a main destination.
    if (role === "student")
      await expect(
        nav.getByRole("button", { name: "Hoạt động nhóm", exact: true }),
      ).toHaveCount(1);
    for (const hidden of role === "teacher"
      ? ["Hoạt động nhóm", "Tiến độ học tập", "Xếp hạng chăm chỉ"]
      : ["Hành trình của tôi", "Xếp hạng chăm chỉ"])
      await expect(
        nav.getByRole("button", { name: hidden, exact: true }),
      ).toHaveCount(0);
    await navigateTo(page, { name: "Xếp hạng chăm chỉ", exact: true });
    await expect(
      page.getByRole("tab", { name: "Xếp hạng chăm chỉ", exact: true }),
    ).toHaveAttribute("aria-selected", "true");
    if (role === "student") {
      await page.goto("/#section=classes");
      await page.reload();
      await expect(
        page.getByRole("tab", { name: "Khu vườn của tôi", exact: true }),
      ).toHaveAttribute("aria-selected", "true");
      await expect(
        page.getByRole("button", { name: "Tạo lớp mới", exact: true }),
      ).toHaveCount(0);
    }
    expect(errors).toEqual([]);
  });
}
