import { test, expect } from "@playwright/test";
import { navigateTo } from "./navigation";
import type { Student, ClassLeaderboard } from "../src/types";

test("honors shows only existing podium winners and waits for missing metrics", async ({
  page,
}) => {
  let roster = structuredClone(fixtures.slice(0, 2));
  await page.request.post("/api/auth/login", {
    data: { email: "giaovien@greenedu.nk", password: "GreenEdu123!" },
  });
  await page.route("**/api/classrooms/class-demo/honors", (route) =>
    route.fulfill({ json: roster }),
  );
  await page.route("**/api/classrooms/class-demo/leaderboard", (route) =>
    route.fulfill({ json: board }),
  );
  await page.goto("/");
  await page.getByLabel("Chọn lớp học").selectOption("class-demo");
  await navigateTo(page, { name: "Lớp học của tôi", exact: true });
  const honors = page.getByRole("region", {
    name: "Vinh danh Top 10",
    exact: true,
  });
  await expect(honors.locator(".honors-podium-place")).toHaveCount(2);
  await expect(honors.locator(".honors-bronze")).toHaveCount(0);
  roster = [];
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(honors).toContainText("Lớp chưa có học sinh");
  await expect(honors.locator(".honors-podium-place")).toHaveCount(0);
  roster = [{ ...fixtures[0], answeredQuestions: undefined }];
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(honors).toContainText("Chưa đủ số liệu");
  await expect(honors.locator(".honors-podium-place")).toHaveCount(0);
});

const fixtures: Student[] = Array.from({ length: 13 }, (_, index) => ({
  id: `honor-${index + 1}`,
  name: `Học sinh vinh danh ${index + 1}`,
  email: `honor-${index + 1}@fixture.test`,
  seconds: 0,
  total: 1000,
  correct: 600,
  answeredQuestions: 70 - index,
  openCorrections: 0,
  trees: 0,
  chapterLevels: [
    {
      chapterId: "honors-chapter",
      chapterTitle: "Chương lớp",
      level: index === 0 ? 5 : index < 5 ? 4 : 3,
      name: "Cây",
      seconds: 0,
      progressPercent: 0,
      remainingSeconds: 0,
    },
  ],
}));
fixtures[0].answeredQuestions = 1234;
fixtures[0].total = 2000;
fixtures[0].correct = 1948;
fixtures[1].name =
  "Nguyễn Thị Thanh Phương Học sinh có họ tên rất dài để kiểm tra bố cục";
fixtures[1].answeredQuestions =
  fixtures[2].answeredQuestions =
  fixtures[3].answeredQuestions =
    100;
fixtures[1].correct = fixtures[2].correct = 900;
fixtures[3].correct = 800;
fixtures[4].answeredQuestions = 90;
fixtures[4].correct = 1000;
const board: ClassLeaderboard = {
  participantCount: 13,
  activeStudents: 13,
  totalSeconds: 0,
  bloomedTrees: 0,
  effort: [],
  repairs: [
    {
      id: fixtures[1].id,
      name: fixtures[1].name,
      seconds: 0,
      bloomedTrees: 0,
      resolvedCorrections: 5,
      rank: 1,
    },
    {
      id: fixtures[2].id,
      name: fixtures[2].name,
      seconds: 0,
      bloomedTrees: 0,
      resolvedCorrections: 2,
      rank: 2,
    },
  ],
};

test("top ten has gold above silver on left and bronze on right, followed by ranks four through ten", async ({
  page,
}, info) => {
  let roster = structuredClone(fixtures);
  await page.request.post("/api/auth/login", {
    data: { email: "giaovien@greenedu.nk", password: "GreenEdu123!" },
  });
  await page.route("**/api/classrooms/class-demo/honors", (route) =>
    route.fulfill({ json: roster }),
  );
  await page.route("**/api/classrooms/class-demo/leaderboard", (route) =>
    route.fulfill({ json: board }),
  );
  await page.goto("/");
  await page.getByLabel("Chọn lớp học").selectOption("class-demo");
  await navigateTo(page, { name: "Lớp học của tôi", exact: true });
  const honors = page.getByRole("region", {
    name: "Vinh danh Top 10",
    exact: true,
  });
  await expect(honors).toBeVisible();
  await expect(
    honors.locator('.honors-podium-place[data-position="1"] h3'),
  ).toHaveText(fixtures[0].name);
  await expect(
    honors.locator('.honors-podium-place[data-position="2"] h3'),
  ).toHaveText(fixtures[1].name);
  await expect(
    honors.locator('.honors-podium-place[data-position="3"] h3'),
  ).toHaveText(fixtures[2].name);
  await expect(honors.locator(".honors-list li")).toHaveCount(7);
  await expect(
    honors.locator(".honors-list .honors-stats-compact"),
  ).toHaveCount(0);
  await expect(honors.locator(".honors-list dt").first()).toContainText(
    "Câu đã làm",
  );
  await expect(
    honors.locator(".honors-podium .honors-stats-compact"),
  ).toHaveCount(3);
  await expect(honors.locator(".honors-criteria")).toHaveCount(0);
  expect(
    await honors
      .locator(".honors-list li")
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute("data-position")),
      ),
  ).toEqual(["4", "5", "6", "7", "8", "9", "10"]);
  for (const width of [320, 360, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 1100 });
    await honors.scrollIntoViewIfNeeded();
    const silver = (await honors
      .locator(".honors-silver .honors-step")
      .boundingBox())!;
    const gold = (await honors
      .locator(".honors-gold .honors-step")
      .boundingBox())!;
    const bronze = (await honors
      .locator(".honors-bronze .honors-step")
      .boundingBox())!;
    expect(silver.x).toBeLessThan(gold.x);
    expect(gold.x).toBeLessThan(bronze.x);
    expect(gold.y).toBeLessThan(silver.y);
    expect(silver.y).toBeLessThan(bronze.y);
    expect(
      Math.max(
        silver.y + silver.height,
        gold.y + gold.height,
        bronze.y + bronze.height,
      ) -
        Math.min(
          silver.y + silver.height,
          gold.y + gold.height,
          bronze.y + bronze.height,
        ),
    ).toBeLessThan(2);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const fits = await honors
      .locator(".honors-podium-place")
      .evaluateAll((places) =>
        places.map((place) => {
          const step = place
            .querySelector(".honors-step")!
            .getBoundingClientRect();
          const medal = place
            .querySelector(".honors-step .honors-medal")!
            .getBoundingClientRect();
          const stats = place
            .querySelector(".honors-stats")!
            .getBoundingClientRect();
          const cells = Array.from(
            place.querySelectorAll(".honors-stats > div"),
          ).map((node) => node.getBoundingClientRect());
          const numbers = Array.from(
            place.querySelectorAll(".honors-stats dd"),
          );
          return {
            medalInside:
              medal.top >= step.top &&
              medal.bottom <= step.bottom &&
              medal.left >= step.left &&
              medal.right <= step.right,
            statsAbove:
              stats.bottom <= step.top && step.top - stats.bottom <= 11,
            sameRow:
              Math.max(...cells.map((cell) => cell.top)) -
                Math.min(...cells.map((cell) => cell.top)) <
              1,
            numbersFit: numbers.every(
              (number) =>
                number.scrollWidth <= number.clientWidth &&
                number.getBoundingClientRect().height <=
                  parseFloat(getComputedStyle(number).lineHeight) + 1,
            ),
          };
        }),
      );
    expect(fits).toEqual(
      Array(3).fill({
        medalInside: true,
        statsAbove: true,
        sameRow: true,
        numbersFit: true,
      }),
    );
    await honors.screenshot({
      path: info.outputPath(`honors-${width}.png`),
      style: ".sidebar, .topbar, .skip-link { visibility: hidden !important; }",
    });
  }
  await page.route("**/api/classrooms/class-demo/students", (route) => route.fulfill({ json: roster }));
  await navigateTo(page, { name: "Quản lý lớp", exact: true });
  await page.getByLabel("Tìm học sinh").fill("vinh danh 13");
  await expect(page.locator(".roster-card tbody tr")).toHaveCount(1);
  await navigateTo(page, { name: "Khu vườn của lớp", exact: true });
  await expect(honors.locator(".honors-list li")).toHaveCount(7);
  roster[5].chapterLevels![0].level = 5;
  roster[5].answeredQuestions = 2000;
  roster[5].total = 3000;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(
    honors.locator('.honors-podium-place[data-position="1"] h3'),
  ).toHaveText(roster[5].name);
});
