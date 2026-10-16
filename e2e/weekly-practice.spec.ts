import { test, expect, type Page } from "@playwright/test";
import { navigateTo } from "./navigation";
import type { WeeklyPracticeData } from "../shared/weekly-practice";

async function teacher(page: Page) {
  expect(
    (
      await page.request.post("/api/auth/login", {
        data: { email: "giaovien@greenedu.nk", password: "GreenEdu123!" },
      })
    ).ok(),
  ).toBeTruthy();
  await page.goto("/");
  await page.getByLabel("Chọn lớp học").selectOption("class-demo");
}
test("teacher saves the weekly minimum and later edits cannot change the current assigned goal", async ({
  page,
}, info) => {
  await teacher(page);
  const c = await (
    await page.request.post("/api/classrooms", {
      data: {
        name: `Tuần ${info.project.name} ${Date.now()}`,
        subject: "Vật lý",
        grade: "11",
      },
    })
  ).json();
  await page.request.post(`/api/classrooms/${c.id}/memberships`, {
    data: { email: "hocsinh@greenedu.nk" },
  });
  await page.reload();
  await page.getByLabel("Chọn lớp học").selectOption(c.id);
  await navigateTo(page, { name: "Cài đặt chung", exact: true });
  const form = page.getByRole("form", {
    name: "Thời gian luyện tập tối thiểu mỗi tuần",
    exact: true,
  });
  const input = form.getByLabel("Số phút tối thiểu mỗi học sinh mỗi tuần");
  await expect(input).toHaveValue("0");
  await input.fill("60");
  await form
    .getByRole("button", { name: "Lưu thời gian tuần", exact: true })
    .click();
  await expect(
    page.getByText(/Đã lưu mức tối thiểu, áp dụng từ tuần bắt đầu/),
  ).toBeVisible();
  const initial = await (
    await page.request.get(`/api/classrooms/${c.id}/weekly-practice`)
  ).json();
  expect(initial.config.minutes).toBe(60);
  await input.fill("90");
  await form
    .getByRole("button", { name: "Lưu thời gian tuần", exact: true })
    .click();
  await expect(form).toContainText("90 phút");
  const changed = await (
    await page.request.get(`/api/classrooms/${c.id}/weekly-practice`)
  ).json();
  expect(changed.config.minutes).toBe(90);
  if (initial.report) expect(changed.report.minutes).toBe(60);
  await page.reload();
  await expect(input).toHaveValue("90");
});
test("ended weeks display separate completed and incomplete students and retain the old weekly requirement", async ({
  page,
}, info) => {
  const monday = Date.parse("2026-10-12T00:00:00+07:00");
  const fixture: WeeklyPracticeData = {
    serverNow: monday + 7 * 86400000,
    config: { minutes: 90, effectiveWeek: "2026-10-19" },
    weeks: [
      { week: "2026-10-12", minutes: 60, closed: true },
      { week: "2026-10-05", minutes: 30, closed: true },
    ],
    report: {
      week: "2026-10-12",
      startsAt: monday,
      closesAt: monday + 6.5 * 86400000,
      minutes: 60,
      closed: true,
      coverageStart: monday,
      completed: [
        {
          id: "a",
          name: "Nguyễn Hoàn Thành",
          seconds: 3600,
          remainingSeconds: 0,
        },
      ],
      incomplete: [
        {
          id: "b",
          name: "Trần Cần Cố Gắng",
          seconds: 1200,
          remainingSeconds: 2400,
        },
      ],
    },
  };
  await page.route("**/api/classrooms/class-demo/weekly-practice*", (route) => {
    const week = new URL(route.request().url()).searchParams.get("week");
    route.fulfill({
      json:
        week === "2026-10-05"
          ? {
              ...fixture,
              report: {
                ...fixture.report!,
                week: "2026-10-05",
                startsAt: monday - 7 * 86400000,
                closesAt: monday - 0.5 * 86400000,
                minutes: 30,
                coverageStart: monday - 7 * 86400000,
                incomplete: fixture.report!.incomplete.map((m) => ({
                  ...m,
                  remainingSeconds: 600,
                })),
              },
            }
          : fixture,
    });
  });
  await teacher(page);
  await navigateTo(page, { name: "Cài đặt chung", exact: true });
  const weekly = page.locator(".weekly-practice");
  const done = weekly.getByRole("region", {
    name: "Đã hoàn thành",
    exact: true,
  });
  const incomplete = weekly.getByRole("region", {
    name: "Chưa hoàn thành",
    exact: true,
  });
  await expect(done).toContainText("Nguyễn Hoàn Thành");
  await expect(done).not.toContainText("Trần Cần Cố Gắng");
  await expect(incomplete).toContainText("Trần Cần Cố Gắng");
  await expect(incomplete).toContainText("Còn thiếu 0 giờ 40 phút 0 giây");
  await expect(weekly).toContainText("Đã kết thúc tuần");
  await expect(weekly).toContainText("60 phút/học sinh");
  await weekly.getByLabel("Tuần báo cáo").selectOption("2026-10-05");
  await expect(weekly).toContainText("30 phút/học sinh");
  await expect(incomplete).toContainText("Còn thiếu 0 giờ 10 phút 0 giây");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await weekly.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: info.outputPath("weekly-report.png"),
    fullPage: true,
  });
});
test("a server without weekly reporting clearly disables the weekly controls", async ({
  page,
}) => {
  await page.route("**/api/classrooms/class-demo/weekly-practice*", (r) =>
    r.fulfill({ status: 404, json: { error: "Không tìm thấy chức năng." } }),
  );
  await teacher(page);
  await navigateTo(page, { name: "Cài đặt chung", exact: true });
  await expect(page.locator(".weekly-practice")).toContainText(
    "Báo cáo tuần đang chờ cập nhật backend Railway.",
  );
  await expect(
    page.getByRole("button", { name: "Lưu thời gian tuần", exact: true }),
  ).toHaveCount(0);
});
