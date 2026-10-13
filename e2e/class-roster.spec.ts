import { test, expect, type Page } from "@playwright/test";
import { navigateTo } from "./navigation";

async function openTeacherClass(page: Page) {
  await page.request.post("/api/auth/login", {
    data: { email: "giaovien@greenedu.nk", password: "GreenEdu123!" },
  });
  await page.goto("/");
  await page.getByLabel("Chọn lớp học").selectOption("learning-class");
  await navigateTo(page, { name: "Lớp học của tôi", exact: true });
}

test.afterEach(async ({ request }) => {
  // Restore the notebook question introduced by this fixture before other suites run.
  await request.post("/api/auth/login", {
    data: { email: "learning@greenedu.test", password: "LearningTest123!" },
  });
  const corrections = await (await request.get("/api/corrections")).json();
  if (
    corrections.some(
      (question: { id: string }) => question.id === "learning-ch2-q1",
    )
  ) {
    expect(
      (
        await request.post("/api/attempts", {
          data: {
            questionId: "learning-ch2-q1",
            selected: 0,
            mode: "correction",
            requestId: crypto.randomUUID(),
          },
        })
      ).ok(),
    ).toBe(true);
  }
});

test("teacher roster shows unique resolved corrections and a labeled clock; student rankings remain", async ({
  page,
}, info) => {
  await page.request.post("/api/auth/login", {
    data: { email: "learning@greenedu.test", password: "LearningTest123!" },
  });
  const correctionRequestId = crypto.randomUUID();
  for (const [questionId, selected, mode] of [
    ["learning-ch1-q1", 1, "practice"],
    ["learning-ch1-q1", 0, "correction"],
    ["learning-ch1-q1", 0, "correction"],
    ["learning-ch2-q1", 1, "practice"],
  ]) {
    expect(
      (
        await page.request.post("/api/attempts", {
          data: {
            questionId,
            selected,
            mode,
            requestId:
              mode === "correction" ? correctionRequestId : crypto.randomUUID(),
          },
        })
      ).ok(),
    ).toBe(true);
  }
  const overview = await (
    await page.request.get("/api/classrooms/learning-class/leaderboard")
  ).json();
  const expected = overview.repairs.find(
    (member: { id: string }) => member.id === "learning-student",
  ).resolvedCorrections;
  await openTeacherClass(page);
  await expect(
    page.getByRole("heading", { name: "Những người chăm vườn" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Bác sĩ cây trồng" }),
  ).toHaveCount(0);
  const roster = page.getByRole("table", {
    name: "Danh sách học sinh",
    exact: true,
  });
  const row = roster
    .getByRole("row")
    .filter({ hasText: "learning@greenedu.test" });
  await expect(
    roster.getByRole("columnheader", { name: "Câu đã khắc phục", exact: true }),
  ).toBeVisible();
  await expect(row.locator(".roster-resolved-count")).toHaveText(
    String(expected),
  );
  const clock = roster.getByRole("columnheader", {
    name: "Thời gian học",
    exact: true,
  });
  await expect(clock.locator("svg")).toHaveAttribute("data-icon-name", "Clock");
  await expect(clock).toHaveText("");
  await roster.scrollIntoViewIfNeeded();
  await roster.screenshot({
    path: info.outputPath("teacher-roster-resolved.png"),
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.request.post("/api/auth/login", {
    data: { email: "learning@greenedu.test", password: "LearningTest123!" },
  });
  await page.reload();
  await navigateTo(page, { name: "Khu vườn của lớp", exact: true });
  await expect(
    page.getByRole("heading", { name: "Những người chăm vườn" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Bác sĩ cây trồng" }),
  ).toBeVisible();
});

test("a failed leaderboard load does not invent a zero resolved count or hide roster", async ({
  page,
}) => {
  const endpoint = "**/api/classrooms/learning-class/leaderboard";
  await page.route(endpoint, (route) =>
    route.fulfill({
      status: 503,
      json: { error: "Tạm thời chưa tải được thành tích lớp" },
    }),
  );
  await openTeacherClass(page);
  const count = page.locator(".roster-resolved-count").first();
  await expect(count).toHaveText("—");
  const garden = page.getByRole("region", { name: "Khu vườn của lớp", exact: true });
  await expect(garden.getByRole("alert")).toContainText("Tạm thời chưa tải");
  await page.unroute(endpoint);
  await garden.getByRole("button", { name: "Thử lại", exact: true }).click();
  await expect(count).toHaveText(/^\d+$/);
});
