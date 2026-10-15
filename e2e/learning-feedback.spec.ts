import { test, expect } from "@playwright/test";
import { navigateTo } from "./navigation";

test("chapters show real progress states, quieter quotes and growing aligned milestones", async ({
  page,
}, info) => {
  await page.request.post("/api/auth/login", {
    data: { email: "hocsinh@greenedu.nk", password: "GreenEdu123!" },
  });
  let extraSeconds = 0;
  let hasQuestions = true;
  let nearComplete = false;
  await page.route("**/api/classrooms", async (route) => {
    const response = await route.fetch();
    const classes = await response.json();
    const c = classes.find((item: { id: string }) => item.id === "class-demo");
    c.chapters.forEach((ch: Record<string, unknown>, i: number) => {
      ch.title = [
        "Chương I: DAO ĐỘNG",
        "Chương II: SÓNG",
        "Chương III: ĐIỆN TRƯỜNG",
      ][i];
      ch.seconds = [0, nearComplete ? 14399 : 7200, 14400 + extraSeconds][i];
      ch.level = [1, nearComplete ? 4 : 3, 5][i];
      ch.total = i * 5;
      ch.levelMinutes = 60;
      if (i === 2 && !hasQuestions) ch.questionCount = 0;
    });
    await route.fulfill({ response, json: classes });
  });
  await page.goto("/");
  await page.getByLabel("Chọn lớp học").selectOption("class-demo");
  await expect(page.locator(".page-heading .eyebrow")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Khu vườn của tôi", level: 1 })).toBeVisible();
  const journey = page.getByRole("region", { name: "Hành trình của tôi" });
  await expect(journey.locator(".chapter-level-card > h3")).toHaveText([
    "Chương I",
    "Chương II",
    "Chương III",
  ]);
  await expect(
    journey.locator(".chapter-level-card > h3").first(),
  ).toHaveAttribute("title", "Chương I: DAO ĐỘNG");
  const complete = journey.locator('.chapter-level-timeline[data-level="5"]');
  await expect(complete.locator(".level-completion-mark")).toHaveCount(1);
  await expect(complete.locator(".chapter-level-next")).toHaveCSS(
    "background-color",
    "rgb(226, 242, 214)",
  );
  await expect(complete.locator(".chapter-time-exceeded")).toHaveCount(0);
  for (const viewport of [
    { width: 320, height: 740 },
    { width: 390, height: 844 },
    { width: 740, height: 320 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    const geometry = await complete.evaluate((node) => {
      const icons = [
        ...node.querySelectorAll(
          ".chapter-level-milestones .student-level-icon",
        ),
      ].map((n) => n.getBoundingClientRect());
      const ticks = [...node.querySelectorAll(".chapter-level-tick")].map((n) =>
        n.getBoundingClientRect(),
      );
      return {
        widths: icons.map((icon) => icon.width),
        aligned: icons.every(
          (icon, i) =>
            Math.abs(
              icon.x + icon.width / 2 - ticks[i].x - ticks[i].width / 2,
            ) < 2 &&
            Math.abs(
              icon.y + icon.height / 2 - ticks[i].y - ticks[i].height / 2,
            ) < 2,
        ),
      };
    });
    expect(geometry.widths[3] / geometry.widths[2]).toBeCloseTo(1.2, 2);
    expect(geometry.widths[4] / geometry.widths[3]).toBeCloseTo(1.2, 2);
    expect(geometry.aligned).toBe(true);
    const textFits = await journey
      .locator(".chapter-level-timeline")
      .evaluateAll((nodes) =>
        nodes.every((node) => {
          const summary = node
            .querySelector(".chapter-level-summary")!
            .getBoundingClientRect();
          return [
            ...node.querySelectorAll(".chapter-level-milestones li"),
          ].every(
            (step) => step.getBoundingClientRect().bottom <= summary.top - 4,
          );
        }),
      );
    expect(textFits).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (viewport.width === 320 || viewport.width === 1440)
      await journey.screenshot({
        path: info.outputPath(`journey-${viewport.width}.png`),
        style:
          ".sidebar, .workspace-topbar, .skip-link { visibility: hidden !important; }",
        scale: "css",
      });
  }
  extraSeconds = 120;
  await page.reload();
  await expect(complete.locator(".chapter-time-exceeded")).toHaveCSS(
    "color",
    "rgb(173, 69, 55)",
  );
  await expect(complete.locator(".chapter-time-exceeded")).toContainText(
    "4 giờ 2 phút",
  );
  await navigateTo(page, { name: "Luyện tập", exact: true });
  const cards = page.locator(".chapter-card");
  await expect(cards.nth(0)).toHaveAttribute(
    "data-progress-state",
    "untouched",
  );
  await expect(cards.nth(1)).toHaveAttribute("data-progress-state", "growing");
  await expect(cards.nth(2)).toHaveAttribute("data-progress-state", "complete");
  await expect(cards.nth(0).locator(".student-level-icon")).toHaveCSS(
    "filter",
    "grayscale(1)",
  );
  await expect(
    cards.nth(0).getByRole("button", { name: "Luyện tập", exact: true }),
  ).toBeEnabled();
  await expect(cards.nth(1).getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "50",
  );
  await expect(cards.nth(2).getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "100",
  );
  await expect(cards.nth(2).locator(".progress-track > span")).toHaveCSS(
    "background-color",
    "rgb(49, 95, 60)",
  );
  await expect(cards.nth(2).locator(".chapter-completion-mark")).toHaveCount(1);
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath(`chapter-states-${width}.png`),
      fullPage: true,
    });
  }
  await cards
    .nth(2)
    .getByRole("button", { name: "Ôn tập lại", exact: true })
    .click();
  await expect(page.locator(".practice-layout")).toBeVisible();
  await page
    .getByRole("button", { name: "Kết thúc phiên", exact: true })
    .click();
  hasQuestions = false;
  nearComplete = true;
  await page.reload();
  await expect(cards.nth(1)).toHaveAttribute("data-progress-state", "growing");
  await expect(cards.nth(1).getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "99",
  );
  await expect(cards.nth(1).locator(".chapter-completion-mark")).toHaveCount(0);
  await expect(
    cards.nth(2).getByRole("button", { name: "Chờ câu hỏi", exact: true }),
  ).toBeDisabled();
});

test("top one has a crown and accuracy bars preserve zero, full and missing results", async ({
  page,
}, info) => {
  await page.request.post("/api/auth/login", {
    data: { email: "giaovien@greenedu.nk", password: "GreenEdu123!" },
  });
  const students = Array.from({ length: 10 }, (_, i) => ({
    id: `visual-${i}`,
    name: `Học sinh ${i + 1}`,
    chapterLevels: [{ level: 3 }],
    answeredQuestions: 100 - i,
    total: i === 9 ? 0 : 100,
    correct: [90, 80, 70, 0, 78, 80, 90, 95, 100, 0][i],
  }));
  await page.route("**/api/classrooms/class-demo/honors", (route) =>
    route.fulfill({ json: students }),
  );
  await page.route("**/api/classrooms/class-demo/leaderboard", (route) =>
    route.fulfill({
      json: {
        participantCount: 10,
        activeStudents: 10,
        totalSeconds: 0,
        bloomedTrees: 0,
        effort: [],
        repairs: [],
      },
    }),
  );
  await page.goto("/");
  await page.getByLabel("Chọn lớp học").selectOption("class-demo");
  await navigateTo(page, { name: "Lớp học của tôi", exact: true });
  const honors = page.getByRole("region", {
    name: "Vinh danh Top 10",
    exact: true,
  });
  await expect(honors.locator(".honors-crown")).toHaveCount(1);
  await expect(honors.locator(".honors-gold h3")).toHaveText("Học sinh 1");
  await expect(honors.locator(".honors-gold .honors-step")).toHaveCSS(
    "border-top-color",
    "rgb(188, 139, 36)",
  );
  const bars = honors.locator(".honors-accuracy-bar");
  await expect(bars).toHaveCount(6);
  await expect(bars.first()).toHaveAttribute("aria-valuenow", "0");
  await expect(bars.last()).toHaveAttribute("aria-valuenow", "100");
  await expect(bars.nth(1)).toHaveAttribute("aria-valuenow", "78");
  await expect(
    honors.locator('.honors-list li[data-position="10"]'),
  ).toContainText("—");
  for (const viewport of [
    { width: 320, height: 740 },
    { width: 740, height: 320 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    const fits = await honors.locator(".honors-gold").evaluate((node) => {
      const step = node.querySelector(".honors-step")!.getBoundingClientRect();
      const crown = node
        .querySelector(".honors-crown")!
        .getBoundingClientRect();
      return (
        crown.left >= step.left &&
        crown.right <= step.right &&
        crown.top >= step.top &&
        crown.bottom <= step.bottom
      );
    });
    expect(fits).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await honors.screenshot({
      path: info.outputPath(`honors-${viewport.width}.png`),
      style:
        ".sidebar, .workspace-topbar, .skip-link { visibility: hidden !important; }",
      scale: "css",
    });
  }
});
