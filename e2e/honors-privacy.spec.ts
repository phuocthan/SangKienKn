import { test, expect, type APIRequestContext } from "@playwright/test";
import { navigateTo } from "./navigation";

async function login(request: APIRequestContext, email: string) {
  const response = await request.post("/api/auth/login", {
    data: { email, password: "GreenEdu123!" },
  });
  expect(response.ok()).toBe(true);
}
async function attempt(
  request: APIRequestContext,
  email: string,
  selected: number[],
) {
  await login(request, email);
  const session = await (
    await request.post("/api/study/start", { data: { chapterId: "chapter-1" } })
  ).json();
  for (const value of selected) {
    const r = await request.post("/api/attempts", {
      data: {
        questionId: "question-1",
        selected: value,
        mode: "practice",
        requestId: crypto.randomUUID(),
        studySessionId: session.sessionId,
      },
    });
    expect(r.ok(), await r.text()).toBe(true);
  }
  await request.post("/api/study/stop", {
    data: { sessionId: session.sessionId, active: false },
  });
}

test("student sees only their own percentage; teacher sees everyone's and the order stays the same", async ({
  page,
}, info) => {
  await attempt(page.request, "hocsinh@greenedu.nk", [0, 1]);
  await attempt(page.request, "minhkhoi@greenedu.nk", [1, 1]);
  await attempt(page.request, "baongan@greenedu.nk", [0, 0]);
  await login(page.request, "hocsinh@greenedu.nk");
  const ownId = (await (await page.request.get("/api/auth/me")).json()).id;
  const response = await (
    await page.request.get("/api/classrooms/class-demo/honors")
  ).json();
  for (const entry of response) {
    if (entry.id === ownId) {
      expect(entry.accuracy).toBe(0.5);
      expect(entry.correct).toBe(entry.total / 2);
      expect(entry.total).toBeGreaterThanOrEqual(2);
    } else {
      expect(entry).not.toHaveProperty("accuracy");
      expect(entry).not.toHaveProperty("correct");
      expect(entry).not.toHaveProperty("total");
    }
  }
  await page.goto("/");
  await page.getByLabel("Chọn lớp học").selectOption("class-demo");
  await navigateTo(page, { name: "Lớp học của tôi", exact: true });
  const honors = page.getByRole("region", { name: "Vinh danh Top 10" });
  await expect(honors.locator(".honors-podium-place")).toHaveCount(3);
  await expect(honors.locator(".honors-stats-private")).toHaveCount(2);
  await expect(honors.getByText("50%", { exact: true })).toHaveCount(1);
  const order = await honors
    .locator(".honors-podium-place h3")
    .allTextContents();
  await page.screenshot({
    path: `.local/honors-privacy-20261031/student-${info.project.name}.png`,
    fullPage: true,
  });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  const teacherContext = await page
    .context()
    .browser()!
    .newContext({ baseURL: "http://127.0.0.1:3101" });
  const teacher = await teacherContext.newPage();
  try {
    await login(teacher.request, "giaovien@greenedu.nk");
    await teacher.goto("/");
    await teacher.getByLabel("Chọn lớp học").selectOption("class-demo");
    await navigateTo(teacher, { name: "Lớp học của tôi", exact: true });
    const t = teacher.getByRole("region", { name: "Vinh danh Top 10" });
    await expect(t.locator(".honors-podium-place")).toHaveCount(3);
    expect(
      await t.locator(".honors-podium-place h3").allTextContents(),
    ).toEqual(order);
    await expect(t.locator(".honors-stats-private")).toHaveCount(0);
    await expect(t.getByText("50%", { exact: true })).toHaveCount(1);
    await expect(t.getByText("100%", { exact: true })).toHaveCount(1);
    await expect(t.getByText("0%", { exact: true })).toHaveCount(1);
    // A still-old backend may return full metrics. The client must still hide
    // other students' percentages until the upgraded API is deployed.
    const legacy = await (
      await teacher.request.get("/api/classrooms/class-demo/honors")
    ).json();
    await page.route("**/api/classrooms/class-demo/honors", (route) =>
      route.fulfill({ json: legacy }),
    );
    await page.bringToFront();
    const refreshed = page.waitForResponse((r) =>
      r.url().endsWith("/api/classrooms/class-demo/honors"),
    );
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await refreshed;
    await expect(honors.locator(".honors-stats-private")).toHaveCount(2);
    await expect(honors.getByText("50%", { exact: true })).toHaveCount(1);
  } finally {
    await teacherContext.close();
  }
});

test("student can see their own percentage in lower ranks without exposing other rows or progressbar labels", async ({
  page,
}) => {
  const members = Array.from({ length: 5 }, (_, i) => ({
    id: i === 3 ? "student-demo" : `peer-${i}`,
    name: i === 3 ? "Học sinh của tôi" : `Bạn ${i}`,
    avatarId: null,
    chapterLevels: [{ level: 3 }],
    answeredQuestions: 5 - i,
    total: 5,
    correct: i,
  }));
  await login(page.request, "hocsinh@greenedu.nk");
  await page.route("**/api/classrooms/class-demo/honors", (route) =>
    route.fulfill({ json: members }),
  );
  await page.goto("/");
  await page.getByLabel("Chọn lớp học").selectOption("class-demo");
  await navigateTo(page, { name: "Lớp học của tôi", exact: true });
  const honors = page.getByRole("region", { name: "Vinh danh Top 10" });
  await expect(honors.locator(".honors-podium-place")).toHaveCount(3);
  await expect(honors.locator(".honors-list li")).toHaveCount(2);
  await expect(honors.locator(".honors-stats-private")).toHaveCount(4);
  await expect(honors.getByText("60%", { exact: true })).toHaveCount(1);
  await expect(
    honors.getByRole("progressbar", { name: "Tỷ lệ đúng · Học sinh của tôi" }),
  ).toHaveCount(1);
  await expect(honors.getByRole("progressbar")).toHaveCount(1);
  for (const peer of ["0%", "20%", "40%", "80%"])
    await expect(honors.getByText(peer, { exact: true })).toHaveCount(0);
});
