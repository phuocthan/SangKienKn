import { navigateTo } from "./navigation";
import { test, expect, type Page } from "@playwright/test";

async function teacher(page: Page) {
  await page.goto("/");
  await page.getByLabel("Email", { exact: true }).fill("giaovien@greenedu.nk");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("GreenEdu123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.getByLabel("Chọn lớp học").selectOption("levels-class-2");
  await navigateTo(page, { name: "Quản lý lớp học", exact: true });
}

test("teacher saves class level minutes and persisted student milestones agree", async ({
  page,
  request,
  browser,
  baseURL,
}, info) => {
  await request.post("/api/auth/login", {
    data: { email: "giaovien@greenedu.nk", password: "GreenEdu123!" },
  });
  expect(
    (
      await request.post("/api/classrooms/levels-class-2/level-settings", {
        data: { minutes: 60 },
      })
    ).ok(),
  ).toBeTruthy();
  await teacher(page);
  const form = page.getByRole("form", { name: "Cài đặt thời gian tăng cấp" });
  const input = form.getByLabel("Phút mỗi cấp");
  await expect(input).toHaveValue("60");
  await expect(
    form.getByRole("button", { name: "Lưu thay đổi" }),
  ).toBeDisabled();
  await input.fill("0");
  await expect(
    form.getByRole("button", { name: "Lưu thay đổi" }),
  ).toBeDisabled();
  await input.fill("30");
  await form.getByRole("button", { name: "Lưu thay đổi" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Đã lưu thời gian tăng cấp cho lớp.",
  );
  await page.reload();
  // Page selection resets after a normal reload; reopen the teacher settings.
  await page.getByLabel("Chọn lớp học").selectOption("levels-class-2");
  await navigateTo(page, { name: "Quản lý lớp học", exact: true });
  await expect(input).toHaveValue("30");
  await form.scrollIntoViewIfNeeded();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.locator(".class-management-card").screenshot({
    path: `.local/level-settings-${info.project.name}.png`,
    // Hide fixed navigation only for this cropped card capture.
    style: ".sidebar { visibility: hidden !important; }",
  });
  const studentContext = await browser.newContext({ baseURL });
  try {
    const studentPage = await studentContext.newPage();
    await studentPage.goto("/");
    await studentPage
      .getByLabel("Email", { exact: true })
      .fill("levels@greenedu.test");
    await studentPage
      .getByLabel("Mật khẩu", { exact: true })
      .fill("LevelsTest123!");
    await studentPage
      .getByRole("button", { name: "Đăng nhập", exact: true })
      .click();
    await studentPage.getByLabel("Chọn lớp học").selectOption("levels-class-2");
    const timeline = studentPage.locator(
      '.chapter-level-timeline[data-chapter-id="levels-class-2-chapter"]',
    );
    await expect(timeline).toHaveAttribute("data-level", "3");
    await expect(timeline.getByRole("progressbar")).toHaveAttribute(
      "aria-valuemax",
      "7200",
    );
    await expect(
      timeline.locator(".chapter-level-milestones li small"),
    ).toHaveText([
      "0 phút",
      "30 phút",
      "1 giờ 0 phút",
      "1 giờ 30 phút",
      "2 giờ 0 phút",
    ]);
    await expect(
      studentPage.locator(
        '.chapter-level-timeline[data-chapter-id="levels-class-2-untouched"]',
      ),
    ).toHaveAttribute("data-level", "1");
    await studentPage.getByLabel("Chọn lớp học").selectOption("levels-class-3");
    await expect(
      studentPage
        .locator(
          '.chapter-level-timeline[data-chapter-id="levels-class-3-chapter"]',
        )
        .getByRole("progressbar"),
    ).toHaveAttribute("aria-valuemax", "14400");
  } finally {
    await studentContext.close();
  }
  await request.post("/api/classrooms/levels-class-2/level-settings", {
    data: { minutes: 60 },
  });
});

test("teacher cannot submit configuration to an older server without the capability", async ({
  page,
}) => {
  let writes = 0;
  await page.route("**/api/classrooms/*/learning", async (route) => {
    const response = await route.fetch();
    const data = await response.json();
    delete data.canConfigureLevels;
    delete data.levelMinutes;
    await route.fulfill({ response, json: data });
  });
  page.on("request", (r) => {
    if (r.url().endsWith("/level-settings") && r.method() === "POST") writes++;
  });
  await teacher(page);
  const form = page.getByRole("form", { name: "Cài đặt thời gian tăng cấp" });
  await expect(form.getByLabel("Phút mỗi cấp")).toBeDisabled();
  await expect(
    form.getByRole("button", { name: "Lưu thay đổi" }),
  ).toBeDisabled();
  await expect(page.locator(".class-management-card").getByRole("status")).toHaveText(
    "Cài đặt này đang chờ cập nhật server.",
  );
  expect(writes).toBe(0);
});
