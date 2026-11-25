import { expect, test } from "@playwright/test";

test("rankings can be limited to one chapter and return to the whole class", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Vào nhanh Học sinh" }).click();
  await page
    .getByRole("navigation", { name: "Điều hướng chính" })
    .getByRole("button", { name: "Lớp học của tôi", exact: true })
    .click();
  const honors = page.getByRole("region", { name: "Vinh danh Top 10" });
  await expect(honors.getByText("Cả lớp · tất cả chương")).toBeVisible();
  const scope = page.locator("#ranking-scope-select");
  await expect(scope.locator("option")).toHaveText([
    "Cả lớp · tất cả chương",
    "Chương 1 · Mở đầu",
    "Chương 2 · Động học",
    "Chương 3 · Động lực học",
  ]);
  const request = page.waitForResponse((response) =>
    response.url().includes("/chapter-honors?chapter=chapter-2"),
  );
  await scope.selectOption("chapter-2");
  expect((await request).ok()).toBe(true);
  await expect(honors.locator(".honors-scope")).toHaveText(
    "Chương 2 · Động học",
  );
  await expect(honors.locator(".honors-podium-place")).toHaveCount(3);
  await expect(honors.locator(".honors-tie-note")).toContainText(
    "riêng chương này",
  );
  await expect(
    page.getByText("Chưa có bạn đạt cấp 5 ở chương này."),
  ).toBeVisible();
  const garden = page.locator(".student-garden");
  await expect(garden.locator(".honors-scope")).toHaveText(
    "Cấp cây của Chương 2 · Động học",
  );
  await expect(garden.locator(".garden-student").first()).toBeVisible();
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      ),
    ).toBeLessThanOrEqual(0);
  }
  await scope.selectOption("");
  await expect(honors.locator(".honors-scope")).toHaveText(
    "Cả lớp · tất cả chương",
  );
});
