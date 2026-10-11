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
    const card = page.getByRole("region", { name: "Cấp độ của bạn trong lớp" });
    await expect(card).toHaveAttribute("data-level", String(i + 1));
    await expect(card.getByRole("heading")).toHaveText(
      `Cấp ${i + 1} · ${names[i]}`,
    );
    await expect(card.locator(".student-level-step")).toHaveCount(5);
    await card.scrollIntoViewIfNeeded();
    for (const step of await card.locator(".student-level-step").all())
      await expect(step).toBeInViewport();
    await expect(page.locator(".profile .student-level-badge")).toHaveAttribute(
      "data-level",
      String(i + 1),
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `.local/ui-${info.project.name}-student-level-${i + 1}.png`,
      fullPage: true,
    });
    if (i === 4)
      await card.locator(".student-level-journey").screenshot({
        path: `.local/student-level-icons-preview-${info.project.name}.png`,
      });
  }
  await page.getByLabel("Chọn lớp học").selectOption("levels-class-2");
  await page.reload();
  await expect(page.getByRole("navigation")).toBeVisible();
  await page.getByLabel("Chọn lớp học").selectOption("levels-class-2");
  await expect(
    page.getByRole("region", { name: "Cấp độ của bạn trong lớp" }),
  ).toHaveAttribute("data-level", "2");
  await page.getByRole("button", { name: "Tài khoản", exact: true }).click();
  await expect(
    page
      .getByRole("region", { name: "Cấp độ của bạn trong lớp" })
      .getByRole("heading"),
  ).toHaveText("Cấp 2 · Chồi");
  expect(errors).toEqual([]);
});

test("teacher roster and class leaderboard show the same student stage for the selected subject", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByLabel("Email", { exact: true })
    .fill("giaovien@greenedu.demo");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("GreenEdu123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByRole("navigation")).toBeVisible();
  for (const [id, level] of [
    ["levels-class-2", "2"],
    ["levels-class-5", "5"],
  ]) {
    await page.getByLabel("Chọn lớp học").selectOption(id);
    await page
      .getByRole("navigation")
      .getByRole("button", { name: "Lớp học của tôi", exact: true })
      .click();
    const row = page
      .getByRole("row")
      .filter({ hasText: "levels@greenedu.test" });
    await expect(row.locator(".student-level-badge")).toHaveAttribute(
      "data-level",
      level,
    );
    await page
      .getByRole("navigation")
      .getByRole("button", { name: "Xếp hạng chăm chỉ", exact: true })
      .click();
    const boardRow = page
      .getByRole("table", { name: "Xếp hạng chăm vườn" })
      .getByRole("row")
      .filter({ hasText: "Học sinh cấp độ" });
    await expect(boardRow.locator(".student-level-badge")).toHaveAttribute(
      "data-level",
      level,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
