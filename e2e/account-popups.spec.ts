import { test, expect } from "@playwright/test";

for (const role of ["teacher", "student"] as const) {
  test(`${role} account popups cancel safely and save passwords`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    // Create a private fixture in the dedicated E2E database, never Railway.
    await page.request.post("/api/auth/login", {
      data: { email: "admin@greenedu.test", password: "AdminTest123!" },
    });
    const email = `popup-${role}-${info.project.name}-${Date.now()}@example.test`;
    const created = await page.request.post("/api/accounts", {
      data: {
        role,
        name: "Tài khoản kiểm thử popup",
        email,
        password: "PopupTemp123!",
      },
    });
    expect(created.ok()).toBeTruthy();
    await page.request.post("/api/auth/logout");
    await page.request.post("/api/auth/login", {
      data: { email, password: "PopupTemp123!" },
    });
    expect(
      (
        await page.request.post("/api/auth/password", {
          data: {
            currentPassword: "PopupTemp123!",
            newPassword: "PopupOwn123!",
          },
        })
      ).ok(),
    ).toBeTruthy();
    await page.goto("/");
    await page.getByRole("button", { name: "Tài khoản", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Thông tin tài khoản" }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Avatar của bạn" }),
    ).toHaveCount(0);
    await expect(page.getByLabel("Mật khẩu hiện tại")).toHaveCount(0);
    await page.screenshot({
      path: `.local/account-popups-${info.project.name}-${role}.png`,
      fullPage: true,
    });

    const avatarButton = page.getByRole("button", {
      name: "Đổi ảnh đại diện",
      exact: true,
    });
    await avatarButton.click();
    let dialog = page.getByRole("dialog", { name: "Đổi avatar", exact: true });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: "Đóng", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(dialog.locator("button:enabled").last()).toBeFocused();
    const choice = role === "teacher" ? "Cô giáo áo dài" : "Bạn nam khoa học";
    await dialog.getByRole("button", { name: choice, exact: true }).click();
    await page.screenshot({
      path: `.local/account-avatar-popup-${info.project.name}-${role}.png`,
      fullPage: true,
    });
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(avatarButton).toBeFocused();
    expect(
      (await (await page.request.get("/api/auth/me")).json()).avatarId,
    ).toBeNull();

    await page
      .locator(".account-settings-actions")
      .getByRole("button", { name: "Đổi avatar", exact: true })
      .click();
    dialog = page.getByRole("dialog", { name: "Đổi avatar", exact: true });
    await expect(
      dialog.getByRole("button", { name: choice, exact: true }),
    ).toHaveAttribute("aria-pressed", "false");
    await dialog.getByRole("button", { name: "Đóng", exact: true }).click();
    await page
      .locator(".profile")
      .getByRole("button", { name: "Đổi avatar", exact: true })
      .click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Đóng", exact: true }).click();

    const passwordButton = page.getByRole("button", {
      name: "Đổi mật khẩu",
      exact: true,
    });
    await passwordButton.click();
    dialog = page.getByRole("dialog", { name: "Đổi mật khẩu", exact: true });
    await expect(dialog.getByLabel("Mật khẩu hiện tại")).toBeFocused();
    await dialog.getByLabel("Mật khẩu hiện tại").fill("PopupOwn123!");
    await page.keyboard.press("Escape");
    await expect(passwordButton).toBeFocused();
    await passwordButton.click();
    await expect(dialog.getByLabel("Mật khẩu hiện tại")).toHaveValue("");
    await dialog.getByLabel("Mật khẩu hiện tại").fill("PopupOwn123!");
    await dialog
      .getByLabel("Mật khẩu mới", { exact: true })
      .fill("PopupUpdated123!");
    await dialog.getByLabel("Nhập lại mật khẩu mới").fill("PopupMismatch123!");
    await dialog.getByRole("button", { name: "Lưu mật khẩu" }).click();
    await expect(dialog.getByRole("alert")).toContainText(
      "Hai mật khẩu mới chưa khớp",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await page.screenshot({
      path: `.local/account-password-popup-${info.project.name}-${role}.png`,
      fullPage: true,
    });
    await dialog.getByLabel("Nhập lại mật khẩu mới").fill("PopupUpdated123!");
    await dialog.getByRole("button", { name: "Lưu mật khẩu" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole("status")).toContainText("Đã đổi mật khẩu");
    await page.request.post("/api/auth/logout");
    expect(
      (
        await page.request.post("/api/auth/login", {
          data: { email, password: "PopupUpdated123!" },
        })
      ).ok(),
    ).toBeTruthy();
    expect(errors).toEqual([]);
  });
}

test("admin opens password popup without an inline form", async ({ page }) => {
  await page.request.post("/api/auth/login", {
    data: { email: "admin@greenedu.test", password: "AdminTest123!" },
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Tài khoản", exact: true }).click();
  await expect(page.getByLabel("Mật khẩu hiện tại")).toHaveCount(0);
  await page.getByRole("button", { name: "Đổi mật khẩu", exact: true }).click();
  const dialog = page.getByRole("dialog", {
    name: "Đổi mật khẩu",
    exact: true,
  });
  await expect(dialog.getByLabel("Mật khẩu hiện tại")).toBeFocused();
  await dialog.getByRole("button", { name: "Đóng", exact: true }).click();
  await expect(dialog).toHaveCount(0);
});
