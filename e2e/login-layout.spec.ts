import { test, expect } from "@playwright/test";

test("login aligns title and form, and forgotten-password help preserves fields without submitting", async ({
  page,
}, info) => {
  const writes: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET") writes.push(request.url());
  });
  // Match the production login layout while using the isolated fixture server.
  await page.route("**/api/health", async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      json: {
        ...(await response.json()),
        demo: false,
        quickLogin: false,
        quickAccounts: [],
      },
    });
  });
  await page.goto("/");
  const form = page.locator(".login-form-wrap");
  await expect(form).toBeVisible();
  await expect(
    page.locator(".login-story-content > p, .forgot-hint"),
  ).toHaveCount(0);
  const email = page.getByLabel("Email", { exact: true });
  const password = page.getByLabel("Mật khẩu", { exact: true });
  await email.fill("hocsinh@greenedu.nk");
  await password.fill("GreenEdu123!");
  const forgot = page.getByRole("button", {
    name: "Quên mật khẩu",
    exact: true,
  });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: width < 700 ? 844 : 1000 });
    await page.evaluate(() => window.scrollTo(0, 0));
    const title = (await page.locator(".login-story h1").boundingBox())!;
    const caption = (await page
      .locator(".login-story-content > .eyebrow")
      .boundingBox())!;
    const card = (await form.boundingBox())!;
    const formTitle = (await form
      .getByRole("heading", { level: 2 })
      .boundingBox())!;
    const welcome = (await form.locator(":scope > .pill").boundingBox())!;
    expect(title.y + title.height).toBeLessThanOrEqual(caption.y);
    expect(formTitle.y + formTitle.height).toBeLessThanOrEqual(welcome.y);
    if (width <= 700) {
      expect(Math.abs(title.x - card.x)).toBeLessThan(2);
      expect(card.y - caption.y - caption.height).toBeLessThanOrEqual(30);
    } else {
      expect(Math.abs(title.y - card.y)).toBeLessThan(2);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `.local/login-${info.project.name}-${width}.png`,
      fullPage: true,
    });
    await forgot.click();
    const dialog = page.getByRole("dialog", { name: "Quên mật khẩu" });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("p")).toHaveText(
      "Liên hệ với giáo viên chủ nhiệm, hoặc admin để cấp lại",
    );
    await dialog.screenshot({
      path: `.local/login-help-${info.project.name}-${width}.png`,
    });
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(forgot).toBeFocused();
    await expect(email).toHaveValue("hocsinh@greenedu.nk");
    await expect(password).toHaveValue("GreenEdu123!");
  }
  expect(writes).toEqual([]);
  await forgot.click();
  await page.getByRole("button", { name: "Đã hiểu", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(forgot).toBeFocused();
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(
    page.getByRole("navigation", { name: "Điều hướng chính" }),
  ).toBeVisible();
});
