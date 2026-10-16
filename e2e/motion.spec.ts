import { test, expect, type Page } from "@playwright/test";
import { navigateTo } from "./navigation";

async function teacher(page: Page) {
  await page.request.post("/api/auth/login", {
    data: { email: "giaovien@greenedu.nk", password: "GreenEdu123!" },
  });
  await page.goto("/");
  await page.getByLabel("Chọn lớp học").selectOption("learning-class");
  await navigateTo(page, { name: "Kiểm tra", exact: true });
}

test("pointer modal exit preserves focus and keyboard reopening stays immediate", async ({
  page,
}) => {
  await teacher(page);
  const trigger = page.getByRole("button", {
    name: "Tạo bài kiểm tra",
    exact: true,
  });
  await trigger.click();
  const dialog = page.getByRole("dialog", {
    name: "Tạo bài kiểm tra",
    exact: true,
  });
  await expect(dialog).toHaveCSS("opacity", "1");
  await page.evaluate(() => {
    const backdrop = document.querySelector(".modal-backdrop")!;
    (window as any).sawClosing = false;
    new MutationObserver(() => {
      if (backdrop.getAttribute("data-closing") === "true")
        (window as any).sawClosing = true;
    }).observe(backdrop, { attributes: true });
  });
  await dialog.getByRole("button", { name: "Đóng", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).sawClosing)).toBe(true);
  await expect(trigger).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveCSS("transition-duration", "0s");
  await page.keyboard.press("Shift+Tab");
  expect(await dialog.evaluate((e) => e.contains(document.activeElement))).toBe(
    true,
  );
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
});

test("reduced motion removes transforms and mobile navigation never moves between sections", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await teacher(page);
  await page
    .getByRole("button", { name: "Tạo bài kiểm tra", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Tạo bài kiểm tra",
    exact: true,
  });
  await expect(dialog).toHaveCSS("transform", "none");
  await expect(dialog).toHaveCSS("transition-duration", "0s");
  await dialog.getByRole("button", { name: "Đóng", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  const positions = () =>
    page.locator(".sidebar .nav-item > svg").evaluateAll((nodes) =>
      nodes.map((n) => {
        const { x, y, width, height } = n.getBoundingClientRect();
        return { x, y, width, height };
      }),
    );
  const initial = await positions();
  const nav = page.getByRole("navigation", { name: "Điều hướng chính" });
  for (const button of await nav.getByRole("button").all()) {
    await button.click();
    expect(await positions()).toEqual(initial);
  }
});

test("earned level animates once, never on load, polling, navigation or changed thresholds", async ({
  page,
}) => {
  await page.request.post("/api/auth/login", {
    data: { email: "hocsinh@greenedu.nk", password: "GreenEdu123!" },
  });
  let seconds = 3599;
  let levelMinutes = 60;
  await page.route("**/api/classrooms", async (route) => {
    const response = await route.fetch();
    const classes = await response.json();
    const chapter = classes.find((c: { id: string }) => c.id === "class-demo")
      .chapters[0];
    chapter.seconds = seconds;
    chapter.levelMinutes = levelMinutes;
    await route.fulfill({ response, json: classes });
  });
  await page.goto("/");
  await page.getByLabel("Chọn lớp học").selectOption("class-demo");
  await navigateTo(page, { name: "Luyện tập", exact: true });
  const tree = page.locator(".chapter-card .student-level-icon").first();
  await expect(tree).toHaveAttribute("data-level", "1");
  await expect(page.locator('[data-level-up="true"]')).toHaveCount(0);
  await page.evaluate(() => {
    (window as any).levelAnimations = 0;
    document.addEventListener("animationstart", (e) => {
      if (e.animationName === "earned-level") (window as any).levelAnimations++;
    });
  });
  const refresh = async () => {
    const response = page.waitForResponse((r) =>
      r.url().endsWith("/api/classrooms"),
    );
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await response;
  };
  seconds = 3600;
  await refresh();
  await expect(tree).toHaveAttribute("data-level", "2");
  await expect
    .poll(() => page.evaluate(() => (window as any).levelAnimations))
    .toBe(1);
  await expect(page.locator('[data-level-up="true"]')).toHaveCount(0);
  const bar = page.locator(".chapter-card .progress-track").first();
  await expect(bar).toHaveAttribute("aria-valuenow", "25");
  const ratio = await bar.evaluate(
    (e) =>
      e.firstElementChild!.getBoundingClientRect().width /
      e.getBoundingClientRect().width,
  );
  expect(ratio).toBeCloseTo(0.25, 2);
  await refresh();
  await navigateTo(page, { name: "Khu vườn của tôi", exact: true });
  await navigateTo(page, { name: "Luyện tập", exact: true });
  levelMinutes = 30;
  await refresh();
  await expect(tree).toHaveAttribute("data-level", "3");
  expect(await page.evaluate(() => (window as any).levelAnimations)).toBe(1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  seconds = 5400;
  await refresh();
  await expect(tree).toHaveAttribute("data-level", "4");
  await expect(tree.locator(".level-artwork")).toHaveCSS(
    "animation-name",
    "none",
  );
  expect(await page.evaluate(() => (window as any).levelAnimations)).toBe(1);
});

test("saved notice can be dismissed, shown again and expires automatically", async ({
  page,
}, info) => {
  await page.clock.install();
  await teacher(page);
  await navigateTo(page, { name: "Quản lý lớp", exact: true });
  for (let i = 0; i < 2; i++) {
    await page
      .getByRole("button", { name: "Thêm chương", exact: true })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Thêm chương học",
      exact: true,
    });
    await dialog
      .getByLabel("Tên chương", { exact: true })
      .fill(`Motion ${info.project.name} ${Date.now()} ${i}`);
    await dialog.getByRole("button", { name: "Lưu", exact: true }).click();
    const toast = page.locator(".motion-toast");
    await expect(toast.getByRole("status")).toHaveText("Đã lưu thành công.");
    await expect(toast).toHaveCSS("opacity", "1");
    if (i === 0)
      await toast
        .getByRole("button", { name: "Đóng thông báo", exact: true })
        .click();
    else {
      await page.clock.fastForward(6000);
      await page.clock.runFor(200);
    }
    await expect(toast).toHaveCount(0);
  }
});
