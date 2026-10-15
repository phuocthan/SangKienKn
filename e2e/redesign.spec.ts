import { test, expect, type Page } from "@playwright/test";
import { acknowledgeOnlineExamCreated } from "./online-exam-created";
import { navigateTo } from "./navigation";

async function teacher(page: Page) {
  const response = await page.request.post("/api/auth/login", {
    data: { email: "giaovien@greenedu.nk", password: "GreenEdu123!" },
  });
  expect(response.ok()).toBe(true);
  await page.goto("/");
  await page.getByLabel("Chọn lớp học").selectOption("learning-class");
}

test("online creation opens on demand, keeps draft on failure and saves without starting", async ({
  page,
}, info) => {
  await teacher(page);
  await navigateTo(page, { name: "Ôn tập & kiểm tra", exact: true });
  await expect(page.getByRole("button", { name: /Tạo.*kiểm tra/ })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("button", { name: "Làm mới", exact: true }),
  ).toHaveCount(0);
  await navigateTo(page, { name: "Kiểm tra online", exact: true });
  await expect(page.locator(".learning-form")).toHaveCount(0);
  const trigger = page.getByRole("button", {
    name: "Tạo bài kiểm tra",
    exact: true,
  });
  await trigger.click();
  const dialog = page.getByRole("dialog", {
    name: "Tạo bài kiểm tra",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  const form = dialog.locator("form");
  const title = `Redesign ${info.project.name} ${Date.now()}`;
  await form.getByLabel("Tên bộ câu").fill(title);
  await form
    .getByRole("radio", { name: "Chọn từ ngân hàng", exact: true })
    .check();
  await form.getByLabel("Chương ôn I", { exact: true }).check();
  await form.getByLabel("Số câu", { exact: true }).fill("2");
  await form.getByLabel("Thời gian chuẩn bị (phút)").fill("1");
  await form.getByLabel("Thời gian làm bài (phút)").fill("3");
  await form.getByLabel("Tự nộp ở lần rời tab").fill("10");
  const endpoint = "**/api/classrooms/learning-class/exams";
  await page.route(endpoint, (route) =>
    route.fulfill({
      status: 503,
      json: { error: "Không thể lưu lúc này. Thử lại." },
    }),
  );
  await form
    .getByRole("button", { name: "Lưu bài kiểm tra", exact: true })
    .click();
  await expect(form.getByRole("alert")).toContainText("Không thể lưu");
  await expect(form.getByRole("alert")).toBeFocused();
  await expect(form.getByLabel("Tên bộ câu")).toHaveValue(title);
  await page.unroute(endpoint);
  await form
    .getByRole("button", { name: "Lưu bài kiểm tra", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await acknowledgeOnlineExamCreated(page);
  const row = page
    .locator(".online-exam-group")
    .filter({ has: page.getByText(title, { exact: true }) });
  await expect(row).toContainText("Chờ giáo viên bắt đầu");
  await expect(row.locator(".exam-metadata li")).toHaveCount(4);
  await expect(row.locator(".exam-meta-rule")).toContainText("10");
  const overview = await (
    await page.request.get("/api/classrooms/learning-class/learning")
  ).json();
  expect(
    overview.exams.find((exam: { title: string }) => exam.title === title)
      .startedAt,
  ).toBeNull();
  await row.screenshot({ path: info.outputPath("exam-card-redesign.png") });
});

test("submenu is one row above the portrait dock and leaves focused content visible", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await teacher(page);
  await navigateTo(page, { name: "Quản lý lớp", exact: true });
  for (const size of [
    { width: 320, height: 720 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1440, height: 1000 },
  ]) {
    await page.setViewportSize(size);
    const tabs = page.getByRole("tablist", { name: "Lớp học của tôi" });
    await expect(tabs).toBeVisible();
    const tops = await tabs
      .getByRole("tab")
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getBoundingClientRect().top),
      );
    expect(Math.max(...tops) - Math.min(...tops)).toBeLessThan(2);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (size.width < 1100) {
      for (const tab of await tabs.getByRole("tab").all()) {
        await expect(tab).toBeInViewport({ ratio: 1 });
        expect(
          await tab
            .locator(".workspace-tab-label")
            .evaluate((node) => node.scrollWidth <= node.clientWidth),
        ).toBe(true);
      }
      await expect(tabs).toHaveCSS("position", "fixed");
      await expect
        .poll(async () => {
          const menu = (await tabs.boundingBox())!;
          const dock = (await page.locator(".sidebar").boundingBox())!;
          return Math.abs(menu.y + menu.height - dock.y);
        })
        .toBeLessThan(2);
      const bottomControl = page
        .locator("#workspace-tab-panel button:enabled:visible")
        .last();
      await bottomControl.evaluate((node) => {
        (node as HTMLElement).focus();
        node.scrollIntoView({ block: "end" });
      });
      const control = (await bottomControl.boundingBox())!;
      const menu = (await tabs.boundingBox())!;
      expect(control.y + control.height).toBeLessThanOrEqual(menu.y);
      expect(control.y).toBeGreaterThanOrEqual(
        (await page.locator(".topbar").boundingBox())!.height,
      );
      await expect(bottomControl).toBeFocused();
    } else await expect(tabs).not.toHaveCSS("position", "fixed");
    await page.screenshot({
      path: info.outputPath(`submenu-${size.width}.png`),
    });
  }
});

test("student review and garden keep actions, all levels and decorative fence", async ({
  page,
}, info) => {
  await page.request.post("/api/auth/login", {
    data: {
      email: "garden-student-3@greenedu.test",
      password: "GardenTest123!",
    },
  });
  await page.goto("/");
  await page.getByLabel("Chọn lớp học").selectOption("garden-class");
  await navigateTo(page, { name: "Khu vườn của lớp", exact: true });
  await expect(page.locator(".garden-fence-top")).toHaveCSS(
    "background-image",
    /garden-fence.svg/,
  );
  await expect(page.locator(".garden-fence-top")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  await expect(
    page.getByRole("button", { name: "Cập nhật", exact: true }),
  ).toHaveCount(0);
  for (let level = 1; level <= 5; level++)
    await expect(
      page
        .locator(`.garden-student .student-level-icon[data-level="${level}"]`)
        .first(),
    ).toBeVisible();
  await page
    .locator(".student-garden")
    .screenshot({ path: info.outputPath("garden-redesign.png") });
  await navigateTo(page, { name: "Hoạt động nhóm", exact: true });
  await expect(page.getByText("TRANG CỘNG TÁC", { exact: true })).toHaveCount(
    0,
  );
  await navigateTo(page, { name: "Ôn tập & kiểm tra", exact: true });
  await page.getByText("Ôn từ ngân hàng", { exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Bắt đầu ôn", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Làm mới", exact: true }),
  ).toHaveCount(0);
  await page.screenshot({
    path: info.outputPath("student-review-redesign.png"),
    fullPage: true,
  });
});
