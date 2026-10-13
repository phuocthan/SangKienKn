import { expect, test } from "@playwright/test";

test("portrait submenu stays below the account header and tab changes return to top", async ({
  page,
}) => {
  await page.request.post("/api/auth/login", {
    data: { email: "giaovien@greenedu.nk", password: "GreenEdu123!" },
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Điều hướng chính" })
    .getByRole("button", { name: "Lớp học của tôi" })
    .click();
  const tabs = page.getByRole("tablist", { name: "Lớp học của tôi" });
  await expect(tabs).toBeVisible();
  await page.locator(".main-content").evaluate((main) => {
    (main as HTMLElement).style.minHeight = "1800px";
  });
  await page.evaluate(() => window.scrollTo(0, 500));
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(400);
  await expect
    .poll(async () => {
      const headerBottom = await page
        .locator(".topbar")
        .evaluate((header) => header.getBoundingClientRect().bottom);
      const tabsTop = await tabs.evaluate(
        (node) => node.getBoundingClientRect().top,
      );
      return Math.abs(tabsTop - headerBottom);
    })
    .toBeLessThan(3);
  await tabs.getByRole("tab", { name: "Hoạt động nhóm" }).click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(
    tabs.getByRole("tab", { name: "Hoạt động nhóm" }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(tabs).toHaveCSS("position", "sticky");
  await expect(tabs.getByRole("tab", { name: "Hoạt động nhóm" })).toHaveCSS(
    "background-color",
    "rgb(169, 87, 55)",
  );
  await page.screenshot({ path: ".local/workspace-tabs-portrait.png" });
});

test("teacher chapter and roster lists use compact, readable rows", async ({
  page,
}) => {
  await page.request.post("/api/auth/login", {
    data: { email: "giaovien@greenedu.nk", password: "GreenEdu123!" },
  });
  await page.setViewportSize({ width: 1900, height: 1000 });
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Điều hướng chính" })
    .getByRole("button", { name: "Lớp học của tôi" })
    .click();
  await page.getByRole("tab", { name: "Quản lý lớp", exact: true }).click();
  const chapters = page.locator(".chapter-list .chapter-row");
  await expect(chapters.first()).toBeVisible();
  if ((await chapters.count()) > 1) {
    const first = (await chapters.nth(0).boundingBox())!;
    const second = (await chapters.nth(1).boundingBox())!;
    expect(Math.abs(first.y - second.y)).toBeLessThan(2);
    // The compact content now has a separate row for chapter exam access.
    const access = (await chapters.first().locator(".class-chapter-access").boundingBox())!;
    expect(first.height - access.height).toBeLessThan(145);
  }
  await expect(
    page.getByRole("heading", { name: "Danh sách Chương" }),
  ).toHaveCSS("font-size", "22px");
  await expect(
    page.getByRole("heading", { name: "Quản lý lớp", level: 1 }),
  ).toHaveCSS("font-family", /Be Vietnam Pro/);
  await page.getByRole("tab", { name: "Lớp học của tôi", exact: true }).click();
  const studentRow = page.locator(".roster-card tbody tr").first();
  await expect(studentRow).toBeVisible();
  expect((await studentRow.boundingBox())!.height).toBeLessThan(100);
  await page.screenshot({
    path: ".local/workspace-density-desktop.png",
    fullPage: true,
  });
});
