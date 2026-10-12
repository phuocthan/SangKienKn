import { navigateTo } from "./navigation";
import { test, expect } from "@playwright/test";

test("student switches independent subject icons, sees all five stages and retains them after reload", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByLabel("Email", { exact: true }).fill("levels@greenedu.test");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("LevelsTest123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByRole("navigation")).toBeVisible();
  const names = ["Mầm", "Chồi", "Cây Non", "Đơm Hoa", "Kết Trái"];
  for (let i = 0; i < names.length; i++) {
    await page.getByLabel("Chọn lớp học").selectOption(`levels-class-${i + 1}`);
    const card = page.getByRole("region", {
      name: "Cấp độ của bạn theo chương",
    });
    const timeline = card.locator(
      `.chapter-level-timeline[data-chapter-id="levels-class-${i + 1}-chapter"]`,
    );
    await expect(timeline).toHaveAttribute("data-level", String(i + 1));
    await expect(
      card.locator(
        `.chapter-level-timeline[data-chapter-id="levels-class-${i + 1}-untouched"]`,
      ),
    ).toHaveAttribute("data-level", "1");
    await expect(timeline.locator(".chapter-level-summary strong")).toHaveText(
      `Cấp ${i + 1} · ${names[i]}`,
    );
    await expect(timeline.locator(".chapter-level-milestones li")).toHaveCount(
      5,
    );
    await card.scrollIntoViewIfNeeded();
    for (const step of await timeline
      .locator(".chapter-level-milestones li")
      .all())
      await expect(step).toBeInViewport();
    const alignment = await timeline.evaluate((node) => {
      const icons = [
        ...node.querySelectorAll(
          ".chapter-level-milestones .student-level-icon",
        ),
      ];
      const ticks = [...node.querySelectorAll(".chapter-level-tick")];
      return icons.map((icon, index) => {
        const a = icon.getBoundingClientRect(),
          b = ticks[index].getBoundingClientRect();
        return Math.abs(a.x + a.width / 2 - b.x - b.width / 2);
      });
    });
    expect(alignment.every((offset) => offset < 2)).toBe(true);
    await expect(page.locator(".profile .student-level-badge")).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `.local/ui-${info.project.name}-student-level-${i + 1}.png`,
      fullPage: true,
    });
    if (i === 0)
      await page.locator(".student-stats").screenshot({
        path: `.local/correction-card-${info.project.name}.png`,
      });
    if (i === 4)
      await timeline.locator(".chapter-level-milestones").screenshot({
        path: `.local/student-level-icons-preview-${info.project.name}.png`,
      });
  }
  await page.getByLabel("Chọn lớp học").selectOption("levels-class-2");
  await page.reload();
  await expect(page.getByRole("navigation")).toBeVisible();
  await page.getByLabel("Chọn lớp học").selectOption("levels-class-2");
  await expect(
    page
      .getByRole("region", { name: "Cấp độ của bạn theo chương" })
      .locator(
        '.chapter-level-timeline[data-chapter-id="levels-class-2-chapter"]',
      ),
  ).toHaveAttribute("data-level", "2");
  await page.getByRole("button", { name: "Tài khoản", exact: true }).click();
  await expect(
    page
      .getByRole("region", { name: "Cấp độ của bạn theo chương" })
      .locator(
        '.chapter-level-timeline[data-chapter-id="levels-class-2-chapter"] .chapter-level-summary strong',
      ),
  ).toHaveText("Cấp 2 · Chồi");
  await navigateTo(page, { name: "Hành trình của tôi", exact: true });
  await expect(
    page.locator(".progress-table .chapter-level-timeline"),
  ).toHaveCount(2);
  await expect(
    page.locator(".progress-table .chapter-level-timeline").first(),
  ).toHaveAttribute("data-level", "2");
  await page
    .locator(".progress-table")
    .screenshot({ path: `.local/chapter-milestones-${info.project.name}.png` });
  expect(errors).toEqual([]);
});

test("teacher roster and class leaderboard show the same student stage for the selected subject", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Email", { exact: true }).fill("giaovien@greenedu.nk");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("GreenEdu123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByRole("navigation")).toBeVisible();
  for (const [id, level] of [
    ["levels-class-2", "2"],
    ["levels-class-5", "5"],
  ]) {
    await page.getByLabel("Chọn lớp học").selectOption(id);
    await navigateTo(page, { name: "Lớp học của tôi", exact: true });
    const row = page
      .getByRole("row")
      .filter({ hasText: "levels@greenedu.test" });
    await expect(
      row
        .locator(".chapter-level-member")
        .filter({ hasText: "Chương 1" })
        .locator(".student-level-badge"),
    ).toHaveAttribute("data-level", level);
    await navigateTo(page, { name: "Xếp hạng chăm chỉ", exact: true });
    const boardRow = page
      .getByRole("table", { name: "Xếp hạng chăm vườn" })
      .getByRole("row")
      .filter({ hasText: "Học sinh cấp độ" });
    await expect(
      boardRow
        .locator(".chapter-level-member")
        .filter({ hasText: "Chương 1" })
        .locator(".student-level-badge"),
    ).toHaveAttribute("data-level", level);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
