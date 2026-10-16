import { test, expect } from "@playwright/test";

test("teacher opens class management directly and creates reviews above the library", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  expect(
    (
      await page.request.post("/api/auth/login", {
        data: { email: "giaovien@greenedu.nk", password: "GreenEdu123!" },
      })
    ).ok(),
  ).toBeTruthy();
  await page.goto("/");
  await page.getByLabel("Chọn lớp học").selectOption("class-demo");
  const nav = page.getByRole("navigation", { name: "Điều hướng chính" });
  await expect(nav.getByRole("button")).toHaveText([
    "Tổng quan",
    "Lớp học của tôi",
    "Ngân hàng câu hỏi",
    "Ôn tập",
    "Quản lý lớp",
  ]);
  await nav
    .getByRole("button", { name: "Lớp học của tôi", exact: true })
    .click();
  const classes = page.getByRole("tablist", {
    name: "Lớp học của tôi",
    exact: true,
  });
  await expect(classes.getByRole("tab")).toHaveText([
    "Khu vườn của lớp",
    "Hoạt động nhóm",
  ]);
  const management = nav.getByRole("button", {
    name: "Quản lý lớp",
    exact: true,
  });
  await management.click();
  await expect(management).toHaveAttribute("aria-current", "page");
  const managementTabs = page.getByRole("tablist", {
    name: "Quản lý lớp",
    exact: true,
  });
  await expect(managementTabs.getByRole("tab")).toHaveText([
    "Học sinh",
    "Chương học",
    "Cài đặt chung",
  ]);
  await expect(page.locator(".roster-card")).toBeVisible();
  await expect(page.locator("#class-chapters")).toBeHidden();
  await expect(page.locator("#class-general")).toBeHidden();
  await managementTabs
    .getByRole("tab", { name: "Chương học", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Quản lý lớp", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Quản lý chương", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator(".chapter-list .chapter-row").first(),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Thêm chương", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".roster-card")).toBeHidden();
  await managementTabs
    .getByRole("tab", { name: "Cài đặt chung", exact: true })
    .click();
  await expect(
    page.getByRole("form", { name: "Cài đặt thời gian tăng cấp" }),
  ).toBeVisible();
  const warningTabs = page.getByLabel("Nhắc nhở khi rời tab (lần)", {
    exact: true,
  });
  await warningTabs.fill("1");
  await managementTabs
    .getByRole("tab", { name: "Học sinh", exact: true })
    .click();
  await managementTabs
    .getByRole("tab", { name: "Cài đặt chung", exact: true })
    .click();
  await expect(warningTabs).toHaveValue("1");
  await expect(page).toHaveURL(/section=class-general/);
  await page.reload();
  await expect(
    managementTabs.getByRole("tab", { name: "Cài đặt chung", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await managementTabs
    .getByRole("tab", { name: "Học sinh", exact: true })
    .click();
  await expect(page.locator(".chapter-list")).not.toContainText("Săn thưởng");
  await expect(
    page
      .locator(".class-chapter-access")
      .getByRole("button", { name: /săn thưởng/i }),
  ).toHaveCount(0);
  await expect(page).toHaveURL(/section=class-settings/);
  await page.reload();
  await expect(management).toHaveAttribute("aria-current", "page");
  await nav.getByRole("button", { name: "Ôn tập", exact: true }).click();
  const tabs = page.getByRole("tablist", { name: "Ôn tập", exact: true });
  await expect(tabs.getByRole("tab")).toHaveText([
    "Ôn tập",
    "Săn thưởng",
    "Kiểm tra",
  ]);
  const create = page.getByRole("button", { name: "Tạo bài ôn", exact: true });
  await expect(create).toBeEnabled();
  await expect(
    page
      .locator(".topbar")
      .getByRole("button", { name: "Tạo bài ôn", exact: true }),
  ).toHaveCount(0);
  await expect(
    page
      .locator(".main-content")
      .getByRole("button", { name: "Tạo bài ôn", exact: true }),
  ).toBeVisible();
  expect(
    await create.evaluate((button) => {
      const title = document.getElementById("review-library-title")!;
      return (
        !!(
          button.compareDocumentPosition(title) &
          Node.DOCUMENT_POSITION_FOLLOWING
        ) &&
        button.getBoundingClientRect().bottom <=
          title.getBoundingClientRect().top
      );
    }),
  ).toBe(true);
  await create.click();
  const modal = page.getByRole("dialog", { name: "Tạo bài ôn", exact: true });
  await expect(modal).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(modal).toHaveCount(0);
  await expect(create).toBeFocused();
  await page.screenshot({
    path: info.outputPath("review-action.png"),
    fullPage: true,
  });
  for (const label of ["Săn thưởng", "Kiểm tra"]) {
    await tabs.getByRole("tab", { name: label, exact: true }).click();
    await expect(
      page.getByRole("heading", { name: label, exact: true }),
    ).toBeVisible();
    await expect(
      nav.getByRole("button", { name: "Ôn tập", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await page.reload();
    await expect(
      tabs.getByRole("tab", { name: label, exact: true }),
    ).toHaveAttribute("aria-selected", "true");
  }
  await expect(
    page.getByRole("button", { name: "Tạo bài kiểm tra", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("student keeps access to exams without teacher class management", async ({
  page,
}) => {
  expect(
    (
      await page.request.post("/api/auth/login", {
        data: { email: "levels@greenedu.test", password: "LevelsTest123!" },
      })
    ).ok(),
  ).toBeTruthy();
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Điều hướng chính" });
  await expect(nav.getByRole("button")).toHaveCount(5);
  await expect(
    nav.getByRole("button", { name: "Quản lý lớp", exact: true }),
  ).toHaveCount(0);
  await nav.getByRole("button", { name: "Ôn tập", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Tạo bài ôn", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("tab", { name: "Kiểm tra", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Kiểm tra", exact: true }),
  ).toBeVisible();
  await expect(
    nav.getByRole("button", { name: "Kiểm tra", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  for (const section of ["class-settings", "class-chapters", "class-general"]) {
    await page.goto(`/#section=${section}`);
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Khu vườn của tôi", exact: true }),
    ).toBeVisible();
  }
});

test("class management tabs support keyboard navigation and fit above the portrait dock", async ({
  page,
}, info) => {
  await page.request.post("/api/auth/login", {
    data: { email: "giaovien@greenedu.nk", password: "GreenEdu123!" },
  });
  await page.goto("/#section=class-settings&classroom=class-demo");
  const tabs = page.getByRole("tablist", { name: "Quản lý lớp", exact: true });
  const nav = page.getByRole("navigation", { name: "Điều hướng chính" });
  for (const size of [
    { width: 320, height: 720 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1440, height: 1000 },
  ]) {
    await page.setViewportSize(size);
    await tabs.getByRole("tab", { name: "Học sinh", exact: true }).click();
    await tabs.getByRole("tab", { name: "Học sinh", exact: true }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(
      tabs.getByRole("tab", { name: "Chương học", exact: true }),
    ).toBeFocused();
    await expect(page.locator("#class-chapters")).toBeVisible();
    await expect(page.locator("#class-students")).toBeHidden();
    await page.keyboard.press("End");
    await expect(
      tabs.getByRole("tab", { name: "Cài đặt chung", exact: true }),
    ).toBeFocused();
    await expect(page.locator("#class-general")).toBeVisible();
    await expect(page.locator("#class-chapters")).toBeHidden();
    await expect(
      nav.getByRole("button", { name: "Quản lý lớp", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    const rows = await tabs
      .getByRole("tab")
      .evaluateAll((nodes) => nodes.map((n) => n.getBoundingClientRect().top));
    expect(Math.max(...rows) - Math.min(...rows)).toBeLessThan(2);
    for (const tab of await tabs.getByRole("tab").all())
      await expect(tab).toBeInViewport({ ratio: 1 });
    if (size.width < 1100) {
      const menu = (await tabs.boundingBox())!;
      const dock = (await page.locator(".sidebar").boundingBox())!;
      expect(Math.abs(menu.y + menu.height - dock.y)).toBeLessThan(2);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (size.width === 390 || size.width === 1440)
      await page.screenshot({
        path: info.outputPath(`management-${size.width}.png`),
        fullPage: true,
      });
  }
  await page.reload();
  await expect(
    tabs.getByRole("tab", { name: "Cài đặt chung", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
});
