import { test, expect } from "@playwright/test";

const accounts = {
  teacher: { email: "giaovien@greenedu.nk", password: "GreenEdu123!" },
  student: { email: "levels@greenedu.test", password: "LevelsTest123!" },
  admin: { email: "admin@greenedu.test", password: "AdminTest123!" },
};

for (const role of ["teacher", "student", "admin"] as const) {
  test(`${role} portrait keeps account/class above and all navigation below while scrolling`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const login = await page.request.post("/api/auth/login", {
      data: accounts[role],
    });
    expect(login.ok()).toBeTruthy();
    const user = await login.json();
    await page.goto("/");
    await expect(page.locator(".topbar .profile strong")).toHaveText(user.name);
    const header = page.locator(".topbar");
    const dock = page.locator(".sidebar");
    for (const viewport of [
      { width: 320, height: 640 },
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
      { width: 1024, height: 1366 },
    ]) {
      await page.setViewportSize(viewport);
      await page.evaluate(() => {
        window.scrollTo(0, 0);
        document.querySelector("[data-scroll-fixture]")?.remove();
        // Presentation-only filler ensures genuine document scrolling at tablet sizes.
        const filler = document.createElement("div");
        filler.dataset.scrollFixture = "true";
        filler.style.paddingTop = "1600px";
        const button = document.createElement("button");
        button.textContent = "Cuối nội dung kiểm thử";
        button.className = "button outline";
        button.onclick = () => {
          button.dataset.clicked = "true";
        };
        filler.append(button);
        document.querySelector(".main-content")!.append(filler);
      });
      const dockBox = (await dock.boundingBox())!;
      expect(dockBox.y + dockBox.height).toBeCloseTo(viewport.height, 0);
      expect(await header.evaluate((el) => getComputedStyle(el).position)).toBe(
        "sticky",
      );
      expect(await dock.evaluate((el) => getComputedStyle(el).position)).toBe(
        "fixed",
      );
      await page.evaluate(() =>
        window.scrollTo(0, document.documentElement.scrollHeight),
      );
      await expect.poll(async () => (await header.boundingBox())!.y).toBe(0);
      await expect(page.locator(".topbar .profile strong")).toBeInViewport();
      if (role !== "admin")
        await expect(page.getByLabel("Chọn lớp học")).toBeInViewport();
      const actions = header.getByRole("group", { name: "Thao tác tài khoản" });
      await expect(actions).toBeInViewport();
      await expect(actions.getByRole("button")).toHaveCount(
        role === "admin" ? 2 : 3,
      );
      const actionsBox = (await actions.boundingBox())!;
      const profileBox = (await header.locator(".profile").boundingBox())!;
      expect(actionsBox.x).toBeLessThan(profileBox.x);
      expect(actionsBox.y + actionsBox.height).toBeLessThanOrEqual(
        (await header.boundingBox())!.height,
      );
      for (const button of await actions.getByRole("button").all()) {
        expect((await button.textContent())?.trim()).toBe("");
        expect(
          await button.evaluate((element) => {
            const box = element.getBoundingClientRect();
            return (
              document
                .elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)
                ?.closest("button") === element
            );
          }),
        ).toBe(true);
      }
      await expect(
        dock.getByRole("button", { name: "Tài khoản", exact: true }),
      ).toHaveCount(0);
      await expect(
        dock.getByRole("button", { name: "Đăng xuất", exact: true }),
      ).toHaveCount(0);
      const bottomButton = page.getByRole("button", {
        name: "Cuối nội dung kiểm thử",
      });
      const bottomBox = (await bottomButton.boundingBox())!;
      expect(bottomBox.y + bottomBox.height).toBeLessThanOrEqual(dockBox.y);
      await bottomButton.click();
      await expect(bottomButton).toHaveAttribute("data-clicked", "true");
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      if (viewport.width === 390) {
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({
          path: `.local/portrait-navigation-${info.project.name}-${role}.png`,
        });
        await page.evaluate(() =>
          window.scrollTo(0, document.documentElement.scrollHeight),
        );
      }
    }

    // Changing class still works from the pinned header after scrolling.
    if (role !== "admin") {
      const select = page.getByLabel("Chọn lớp học");
      const values = await select
        .locator("option")
        .evaluateAll((options) =>
          options.map((option) => (option as HTMLOptionElement).value),
        );
      expect(values.length).toBeGreaterThan(1);
      await select.selectOption(values[1]);
      await expect(select).toHaveValue(values[1]);
      await expect(page.locator(".topbar .profile strong")).toHaveText(
        user.name,
      );
    }

    await page.setViewportSize({ width: 390, height: 844 });
    // Main destinations stay below; utility actions are accessible from the header.
    if (role !== "admin") {
      await page
        .getByRole("navigation")
        .getByRole("button", { name: "Xếp hạng chăm chỉ" })
        .click();
      await expect(
        page
          .getByRole("navigation")
          .getByRole("button", { name: "Xếp hạng chăm chỉ" }),
      ).toHaveAttribute("aria-current", "page");
    }
    if (role !== "admin") {
      const feedback = header.getByRole("button", {
        name: role === "teacher" ? "Quản lý góp ý" : "Góp ý",
        exact: true,
      });
      await feedback.click();
      await expect(feedback).toHaveAttribute("aria-current", "page");
    }
    await header
      .getByRole("button", { name: "Tài khoản", exact: true })
      .click();
    await expect(
      header.getByRole("button", { name: "Tài khoản", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    if (role !== "admin")
      await header.locator(".profile-avatar-button").click();
    else
      await page
        .getByRole("button", { name: "Đổi mật khẩu", exact: true })
        .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Đóng", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toHaveCount(0);

    // Rotation restores the existing sidebar layout, as does desktop.
    for (const viewport of [
      { width: 844, height: 390 },
      { width: 1440, height: 1000 },
    ]) {
      await page.setViewportSize(viewport);
      await page.evaluate(() => window.scrollTo(0, 0));
      const sidebar = (await dock.boundingBox())!;
      expect(sidebar.width).toBeLessThan(viewport.width / 2);
      expect(sidebar.y).toBeLessThan(30);
      expect(
        await header.evaluate((el) => getComputedStyle(el).position),
      ).not.toBe("sticky");
      await expect(header.locator(".portrait-actions")).toBeHidden();
      await expect(
        dock.getByRole("button", { name: "Tài khoản", exact: true }),
      ).toBeVisible();
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await header
      .getByRole("button", { name: "Đăng xuất", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Đăng nhập", exact: true }),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });
}
