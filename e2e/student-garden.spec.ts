import { navigateTo } from "./navigation";
import { test, expect } from "@playwright/test";

test("fenced garden includes everyone with moving icons and separate level-5 honors", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const teacherLogin = await page.request.post("/api/auth/login", {
    data: { email: "giaovien@greenedu.nk", password: "GreenEdu123!" },
  });
  expect(teacherLogin.ok()).toBe(true);
  const teacherProfile = await (await page.request.get("/api/auth/me")).json();
  expect(
    (
      await page.request.post("/api/auth/avatar", {
        data: { avatarId: "teacher-1" },
      })
    ).ok(),
  ).toBe(true);
  expect((await page.request.post("/api/auth/logout", { data: {} })).ok()).toBe(
    true,
  );
  await page.goto("/");
  await page
    .getByLabel("Email", { exact: true })
    .fill("garden-student-3@greenedu.test");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("GardenTest123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByRole("navigation")).toBeVisible();
  await page.getByLabel("Chọn lớp học").selectOption("garden-class");
  await navigateTo(page, { name: "Khu vườn của lớp", exact: true });
  const garden = page.locator(".student-garden");
  await expect(garden).toBeVisible();
  const classSign = garden.getByRole("group", { name: "Lớp học", exact: true });
  await expect(classSign).toContainText("Lớp vườn");
  await expect(classSign).toContainText("Vật lý");
  await expect(garden).not.toContainText(teacherProfile.name);
  await expect(classSign.locator(".garden-teacher-avatar")).toHaveCount(0);
  await expect(
    garden
      .getByRole("img", { name: "Avatar giáo viên" })
      .locator(".garden-teacher-avatar"),
  ).toHaveCSS("background-image", /avatars-teachers/);
  const gatePosition = await classSign.evaluate((sign) => {
    const box = sign.getBoundingClientRect();
    const enclosure = sign.closest(".garden-enclosure")!;
    const world = enclosure
      .querySelector(".garden-world")!
      .getBoundingClientRect();
    const fence = enclosure
      .querySelector(".garden-fence-bottom")!
      .getBoundingClientRect();
    return {
      belowStudents: box.top >= world.bottom,
      onBottomFence: box.bottom > fence.top && box.top < fence.bottom,
      centered: Math.abs(
        (box.left + box.right) / 2 - (fence.left + fence.right) / 2,
      ),
      width: box.width,
    };
  });
  expect(gatePosition.belowStudents).toBe(true);
  expect(gatePosition.onBottomFence).toBe(true);
  expect(gatePosition.centered).toBeLessThan(2);
  expect(gatePosition.width).toBeLessThanOrEqual(120);
  await expect(garden).not.toContainText("Cấp của từng chương vẫn riêng biệt");
  await expect(garden.locator(".garden-student")).toHaveCount(5);
  expect(
    await garden
      .locator(".garden-student")
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute("data-level")),
      ),
  ).toEqual(["5", "4", "3", "2", "1"]);
  await expect(garden.locator(".garden-student-name")).toHaveText([
    "Nhã Linh",
    "Nhã Linh",
    "Long VũBạn",
    "Quốc Huy",
    "An",
  ]);
  await expect(garden.locator(".garden-student.is-mine")).toHaveAttribute(
    "data-level",
    "3",
  );
  await expect(
    garden.locator(".garden-student.is-mine .garden-you"),
  ).toHaveText("Bạn");
  await expect(garden.locator(".garden-student-avatar")).toHaveCount(5);
  await expect(garden.locator(".garden-fence")).toHaveCount(4);
  const honors = page.locator(".garden-honors");
  await expect(
    honors.getByRole("heading", { name: "Vinh danh Kết Trái · Cấp 5" }),
  ).toBeVisible();
  await expect(honors.locator(".garden-honoree")).toHaveCount(1);
  await expect(honors.locator(".garden-honoree")).toHaveAttribute(
    "data-student-id",
    "garden-student-5",
  );
  await expect(
    garden.locator('[data-student-id="garden-student-5"]'),
  ).toHaveCount(1);
  const walker = garden.locator(".garden-student").first();
  await expect(walker).toHaveCSS("animation-name", "garden-wander");
  // Seek the actual animation: the icon + name + avatar move as one group.
  const travels = await walker.evaluate((node) => {
    const animation = node.getAnimations()[0];
    animation.pause();
    animation.currentTime = 0;
    const before = node.getBoundingClientRect();
    animation.currentTime = 8000;
    const after = node.getBoundingClientRect();
    return Math.hypot(after.x - before.x, after.y - before.y);
  });
  expect(travels).toBeGreaterThan(20);
  await expect(
    garden.locator('[data-student-id="garden-student-5"] .avatar-art'),
  ).toHaveCSS("background-image", /avatars-students/);
  await expect(
    garden.locator(
      '[data-student-id="garden-student-1"] .garden-student-avatar',
    ),
  ).toHaveText("A");
  const plant = garden.locator(".garden-plant > svg").first();
  await expect(plant).toHaveCSS("animation-name", "garden-plant-sway");
  await garden
    .getByRole("button", { name: "Tắt chuyển động", exact: true })
    .click();
  await expect(plant).toHaveCSS("animation-name", "none");
  await expect(walker).toHaveCSS("animation-name", "none");
  await garden
    .getByRole("button", { name: "Bật chuyển động", exact: true })
    .click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(plant).toHaveCSS("animation-name", "none");
  await expect(walker).toHaveCSS("animation-name", "none");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `.local/fenced-garden-${info.project.name}.png`,
    fullPage: true,
    style:
      "@media(max-width:700px) { .sidebar { visibility: hidden !important; } }",
  });
  await page.getByRole("button", { name: "Cập nhật", exact: true }).click();
  await expect(garden.locator(".garden-student")).toHaveCount(5);
  await page.getByLabel("Chọn lớp học").selectOption("garden-other-class");
  await expect(garden.locator(".garden-student")).toHaveCount(1);
  await expect(garden.locator(".garden-student.is-mine")).toHaveAttribute(
    "data-level",
    "5",
  );
  await expect(honors.locator(".garden-honoree")).toHaveCount(1);
  await expect(honors.locator(".garden-honoree")).toHaveAttribute(
    "data-student-id",
    "garden-student-3",
  );
  expect(errors).toEqual([]);
});

test("old garden API shows fenced waiting frame without inventing students or levels", async ({
  page,
}) => {
  await page.route("**/api/classrooms/class-demo/garden", (route) =>
    route.fulfill({ json: { trees: [] } }),
  );
  await page.goto("/");
  await page.getByLabel("Email", { exact: true }).fill("hocsinh@greenedu.nk");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("GreenEdu123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByRole("navigation")).toBeVisible();
  await navigateTo(page, { name: "Khu vườn của lớp", exact: true });
  await expect(
    page.getByText(
      "Danh sách học sinh, avatar và cấp cao nhất đang chờ cập nhật server.",
    ),
  ).toBeVisible();
  await expect(page.locator(".garden-student")).toHaveCount(0);
  await expect(page.locator(".garden-fence")).toHaveCount(4);
  await expect(page.locator(".garden-honoree")).toHaveCount(0);
});

test("large class keeps all 47 students inside the fenced scrolling garden and honors only level 5", async ({
  page,
}, info) => {
  const members = Array.from({ length: 47 }, (_, index) => ({
    studentId: `garden-crowd-${index}`,
    studentName: `Học sinh mẫu ${index + 1}`,
    avatarId: `student-${(index % 5) + 1}`,
    level: (index % 5) + 1,
  }));
  await page.route("**/api/classrooms/garden-class/garden", (route) =>
    route.fulfill({ json: { trees: [], members } }),
  );
  await page.goto("/");
  await page
    .getByLabel("Email", { exact: true })
    .fill("garden-student-3@greenedu.test");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("GardenTest123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByRole("navigation")).toBeVisible();
  await page.getByLabel("Chọn lớp học").selectOption("garden-class");
  await navigateTo(page, { name: "Khu vườn của lớp", exact: true });
  await expect(page.locator(".garden-student")).toHaveCount(47);
  await expect(page.locator(".garden-honoree")).toHaveCount(9);
  const compact = await page.locator(".student-garden").evaluate((garden) => {
    const world = garden.querySelector(".garden-world")!;
    const icon = garden.querySelector(".garden-plant > svg")!;
    const cells = garden.querySelectorAll(".garden-wander-space");
    const a = cells[0].getBoundingClientRect(),
      b = cells[1].getBoundingClientRect();
    return {
      height: world.getBoundingClientRect().height,
      icon: icon.getBoundingClientRect().width,
      spacing: Math.abs(a.x - b.x),
    };
  });
  expect(compact.height).toBeLessThanOrEqual(
    info.project.name === "mobile" ? 300 : 360,
  );
  expect(compact.icon).toBeLessThan(60);
  expect(compact.spacing).toBeLessThan(140);
  const geometry = await page.locator(".garden-floor").evaluate((floor) => {
    const area = floor.getBoundingClientRect();
    const nodes = [...floor.querySelectorAll<HTMLElement>(".garden-student")];
    const escapes: string[] = [];
    for (const fraction of [0, 0.25, 0.5, 0.75]) {
      for (const node of nodes) {
        const animation = node.getAnimations()[0];
        if (animation) {
          animation.pause();
          animation.currentTime =
            Number(animation.effect!.getTiming().duration) * fraction;
        }
        const bounds = node.getBoundingClientRect();
        if (
          bounds.left < area.left ||
          bounds.right > area.right ||
          bounds.top < area.top ||
          bounds.bottom > area.bottom
        )
          escapes.push(node.dataset.studentId!);
      }
    }
    const world = floor.parentElement!;
    return { escapes, scrolls: world.scrollHeight > world.clientHeight };
  });
  expect(geometry.escapes).toEqual([]);
  expect(geometry.scrolls).toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.locator(".student-garden").screenshot({
    path: `.local/fenced-garden-crowd-${info.project.name}.png`,
    style:
      "@media(max-width:700px) { .sidebar { visibility: hidden !important; } }",
  });
  await page.locator(".garden-world").evaluate((node) => {
    node.scrollTop = node.scrollHeight;
  });
  await expect(page.locator(".garden-student").last()).toBeInViewport();
  await page.getByRole("button", { name: "Cập nhật", exact: true }).click();
  await expect(page.locator(".garden-student")).toHaveCount(47);
  await expect(page.locator(".garden-honoree")).toHaveCount(9);
});
