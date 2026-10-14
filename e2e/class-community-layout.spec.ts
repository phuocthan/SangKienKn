import { test, expect } from "@playwright/test";
import { navigateTo } from "./navigation";

for (const role of ["teacher", "student"] as const) {
  test(`${role} sees shared top ten and the four class sections in order`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.request.post("/api/auth/login", {
      data: {
        email:
          role === "teacher" ? "giaovien@greenedu.nk" : "hocsinh@greenedu.nk",
        password: "GreenEdu123!",
      },
    });
    await page.goto("/");
    await page.getByLabel("Chọn lớp học").selectOption("class-demo");
    await navigateTo(page, { name: "Lớp học của tôi", exact: true });
    await expect(
      page.getByRole("region", { name: "Vinh danh Top 10" }),
    ).toBeVisible();
    await expect(page.locator(".honors-podium-place")).toHaveCount(3);
    expect(
      await page
        .locator(
          ".main-content .community-stats, .main-content .class-honors, .main-content .garden-honors, .main-content .student-garden",
        )
        .evaluateAll((nodes) =>
          nodes.map((node) =>
            node.classList.contains("community-stats")
              ? "stats"
              : node.classList.contains("class-honors")
                ? "top10"
                : node.classList.contains("garden-honors")
                  ? "fruit"
                  : "garden",
          ),
        ),
    ).toEqual(["stats", "top10", "fruit", "garden"]);
    await expect(page.locator(".community-ranking, .roster-card")).toHaveCount(
      0,
    );
    if (role === "teacher") {
      await navigateTo(page, { name: "Quản lý lớp", exact: true });
      const titles = page.getByRole("heading", { level: 2 });
      await expect(titles).toHaveText([
        "Quản lý cấp độ",
        "Quản lý chương",
        "Quản lý học sinh",
      ]);
      await expect(page.locator(".roster-card")).toBeVisible();
      await expect(page.locator(".class-honors")).toHaveCount(0);
      await navigateTo(page, { name: "Khu vườn của lớp", exact: true });
    } else {
      await expect(
        page.getByRole("tab", { name: "Quản lý lớp", exact: true }),
      ).toHaveCount(0);
      expect(
        (
          await page.request.get("/api/classrooms/class-demo/students")
        ).status(),
      ).toBe(403);
    }
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      if (width === 320 || width === 1440)
        await page.screenshot({
          path: info.outputPath(`shared-community-${role}-${width}.png`),
          fullPage: true,
        });
    }
    await page.screenshot({
      path: info.outputPath(`shared-community-${role}.png`),
      fullPage: true,
    });
    expect(errors).toEqual([]);
  });
}

test("honors failure keeps the garden visible and retries without fabricating ranks", async ({
  page,
}) => {
  await page.request.post("/api/auth/login", {
    data: { email: "hocsinh@greenedu.nk", password: "GreenEdu123!" },
  });
  const endpoint = "**/api/classrooms/class-demo/honors";
  await page.route(endpoint, (route) =>
    route.fulfill({ status: 503, json: { error: "Chưa tải được vinh danh" } }),
  );
  await page.goto("/");
  await page.getByLabel("Chọn lớp học").selectOption("class-demo");
  await navigateTo(page, { name: "Lớp học của tôi", exact: true });
  const honors = page.getByRole("region", { name: "Vinh danh Top 10" });
  await expect(honors.getByRole("alert")).toContainText(
    "Chưa tải được vinh danh",
  );
  await expect(honors.locator(".honors-podium-place")).toHaveCount(0);
  await expect(page.locator(".student-garden")).toBeVisible();
  await page.unroute(endpoint);
  await honors.getByRole("button", { name: "Thử lại Top 10" }).click();
  await expect(honors.locator(".honors-podium-place")).toHaveCount(3);
});
