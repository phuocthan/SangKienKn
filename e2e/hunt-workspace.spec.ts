import { test, expect } from "@playwright/test";
import { navigateTo } from "./navigation";

test("teacher reward workspace reopens an expired paper and closes an active paper using the same server state as its dialog", async ({
  page,
}) => {
  expect(
    (
      await page.request.post("/api/auth/login", {
        data: { email: "giaovien@greenedu.nk", password: "GreenEdu123!" },
      })
    ).ok(),
  ).toBe(true);
  let open = false;
  await page.route(
    "**/api/classrooms/learning-class/learning",
    async (route) => {
      const response = await route.fetch();
      const data = await response.json();
      const ch = data.chapters.find(
        (c: { id: string }) => c.id === "learning-ch1",
      );
      ch.examAllowed = true;
      ch.hunt = {
        title: "Đề thưởng đã tải",
        hasQuestions: true,
        uploadedAt: Date.now() - 3600000,
        startsAt: Date.now() - 600000,
        closesAt: Date.now() + (open ? 600000 : -1000),
        preparationMinutes: 0,
        durationMinutes: 20,
        tabLimit: 4,
        open,
      };
      await route.fulfill({ response, json: data });
    },
  );
  await page.goto("/");
  await page.getByLabel("Chọn lớp học").selectOption("learning-class");
  await navigateTo(page, { name: "Săn thưởng", exact: true });
  const row = page
    .locator(".learning-row")
    .filter({ has: page.getByText("Chương ôn I", { exact: true }) })
    .first();
  await row.getByRole("button", { name: "Mở săn thưởng", exact: true }).click();
  const reopen = page.getByRole("dialog", {
    name: "Mở săn thưởng",
    exact: true,
  });
  await expect(reopen).toBeVisible();
  await expect(
    reopen.getByRole("checkbox", { name: /Sử dụng bộ đề đã tải trước đó/ }),
  ).toBeChecked();
  await reopen.getByRole("button", { name: "Đóng", exact: true }).click();
  open = true;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await row
    .getByRole("button", { name: "Khóa săn thưởng", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Khóa săn thưởng", exact: true }),
  ).toBeVisible();
});
