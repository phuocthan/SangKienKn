import { test, expect } from "@playwright/test";

const accounts = [
  {
    input: "hocsinh",
    email: "hocsinh@greenedu.nk",
    password: "GreenEdu123!",
    role: "student",
  },
  {
    input: "  giaovien  ",
    email: "giaovien@greenedu.nk",
    password: "GreenEdu123!",
    role: "teacher",
  },
  {
    input: "admin@greenedu.test",
    email: "admin@greenedu.test",
    password: "AdminTest123!",
    role: "admin",
  },
];

for (const account of accounts) {
  test(`login accepts ${account.role} account: ${account.input.trim()}`, async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByLabel("Email", { exact: true }).fill(account.input);
    await page.getByLabel("Mật khẩu", { exact: true }).fill(account.password);
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/auth/login") &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    const response = await responsePromise;
    expect(response.request().postDataJSON().email).toBe(account.email);
    expect(response.status()).toBe(200);
    expect((await response.json()).role).toBe(account.role);
    await expect(page.getByRole("navigation")).toBeVisible();
  });
}

test("short login still requires the correct password", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Email", { exact: true }).fill("hocsinh");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("WrongPassword123!");
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/auth/login") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  expect((await responsePromise).status()).toBe(401);
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByRole("navigation")).toHaveCount(0);
});
