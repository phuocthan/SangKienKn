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
    await expect(nav.getByRole("button")).toHaveCount(5);
    const landscapeBackground = await page
      .locator(".sidebar")
      .evaluate((node) => getComputedStyle(node).backgroundImage);
    const parents =
      role === "teacher"
        ? [
            {
              label: "Lớp học của tôi",
              items: ["Lớp học của tôi", "Hoạt động nhóm", "Quản lý lớp"],
            },
          ]
        : [
            { label: "Luyện tập", items: ["Luyện tập", "Sổ tay sửa sai"] },
            { label: "Khu vườn của lớp", items: ["Khu vườn của lớp", "Hoạt động nhóm"] },
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
        if (viewport.width < 1100) {
          const boxes = await tabs.getByRole("tab").evaluateAll((nodes) =>
            nodes.map((node) => {
              const box = node.getBoundingClientRect();
              return { width: box.width, height: box.height, y: box.y };
            }),
          );
          for (const box of boxes) {
            expect(box.width).toBeCloseTo(boxes[0].width, 0);
            expect(box.height).toBe(44);
            expect(box.y).toBeCloseTo(boxes[0].y, 0);
          }
          for (const tab of await tabs.getByRole("tab").all())
            await expect(tab).toHaveCSS("justify-content", "center");
        }
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
          if (role === "teacher" && name === "Lớp học của tôi") {
            await expect(page.getByRole("region", { name: "Khu vườn của lớp", exact: true })).toBeVisible();
            await expect(page.getByRole("heading", { name: "Khu vườn của lớp", level: 2, exact: true })).toBeVisible();
            await expect(page.locator(".roster-card")).toBeVisible();
            await expect(page.locator(".chapter-list")).toHaveCount(0);
            await expect(page.getByRole("button", { name: "Thêm chương", exact: true })).toHaveCount(0);
          }
          if (role === "teacher" && name === "Quản lý lớp") {
            await expect(page.getByRole("heading", { name: "Danh sách Chương", exact: true })).toBeVisible();
            await expect(page.locator(".chapter-list .chapter-row").first()).toBeVisible();
            await expect(page.getByRole("button", { name: "Thêm chương", exact: true })).toBeVisible();
            await expect(page.getByRole("form", { name: "Cài đặt thời gian tăng cấp" })).toBeVisible();
            await expect(page.locator(".roster-card")).toHaveCount(0);
          }
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
        await expect(
          nav.locator("button.nav-item:not(.active)").first(),
        ).toHaveCSS("color", "rgb(216, 230, 214)");
        expect(
          (await page.locator(".sidebar").boundingBox())!.y,
        ).toBeGreaterThan(0);
      }
    }
    // Student collaboration and corrections now live under their parent destinations.
    if (role === "student")
      await expect(
        nav.getByRole("button", { name: "Hoạt động nhóm", exact: true }),
      ).toHaveCount(0);
    for (const hidden of role === "teacher"
      ? ["Hoạt động nhóm", "Khu vườn của lớp", "Tiến độ học tập", "Xếp hạng chăm chỉ"]
      : ["Hoạt động nhóm", "Sổ tay sửa sai", "Hành trình của tôi", "Xếp hạng chăm chỉ"])
      await expect(
        nav.getByRole("button", { name: hidden, exact: true }),
      ).toHaveCount(0);
    await navigateTo(page, { name: "Xếp hạng chăm chỉ", exact: true });
    await expect(
      page.getByRole("heading", { name: "Những người chăm vườn" }),
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: "Xếp hạng chăm chỉ" }),
    ).toHaveCount(0);
    if (role === "teacher") {
      await expect(page.getByRole("tab", { name: "Khu vườn của lớp", exact: true })).toHaveCount(0);
      const classId = new URLSearchParams(new URL(page.url()).hash.slice(1)).get("classroom")!;
      for (const section of ["garden", "leaderboard"]) {
        await page.goto(`/#section=${section}&classroom=${classId}`);
        await page.reload();
        await expect(page.getByRole("tab", { name: "Lớp học của tôi", exact: true })).toHaveAttribute("aria-selected", "true");
        await expect(page.getByRole("heading", { name: "Lớp học của tôi", level: 1, exact: true })).toBeVisible();
        await expect(page.getByRole("region", { name: "Khu vườn của lớp", exact: true })).toBeVisible();
        await expect(page).toHaveURL(new RegExp(`section=classes&classroom=${classId}`));
      }
    }
    if (role === "student") {
      await page.goto("/#section=progress");
      await page.reload();
      await expect(
        page.getByRole("heading", { name: /hôm nay mình học gì/ }),
      ).toBeVisible();
      await expect(
        page.getByRole("tab", { name: "Hành trình của tôi" }),
      ).toHaveCount(0);
      await expect(page.locator("#student-journey")).toContainText(
        "Hành trình của tôi",
      );
      await page.getByRole("button", { name: "Xem hành trình" }).click();
      await expect(page.locator("#student-journey")).toBeInViewport();
      await expect(
        page.getByRole("button", { name: "Tạo lớp mới", exact: true }),
      ).toHaveCount(0);
    }
    expect(errors).toEqual([]);
  });
}
