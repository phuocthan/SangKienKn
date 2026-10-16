import { test, expect, type Page } from "@playwright/test";
import { navigateTo } from "./navigation";

async function classroom(page: Page, suffix: string, titles: string[] = []) {
  await page.request.post("/api/auth/login", {
    data: { email: "giaovien@greenedu.nk", password: "GreenEdu123!" },
  });
  const response = await page.request.post("/api/classrooms", {
    data: {
      name: `Thứ tự ${suffix} ${Date.now()}`,
      subject: "Vật lý",
      grade: "10",
    },
  });
  expect(response.ok()).toBe(true);
  const { id } = await response.json();
  for (const title of titles) {
    expect(
      (
        await page.request.post(`/api/classrooms/${id}/chapters`, {
          data: { title },
        })
      ).ok(),
    ).toBe(true);
  }
  await page.goto("/");
  await page.getByLabel("Chọn lớp học").selectOption(id);
  return id;
}
const names = [
  "Chương A · Nội dung học tập có tên dài để kiểm tra hiển thị",
  "Chương B",
  "Chương C",
];
const titles = (page: Page) =>
  page.locator(".chapter-list .chapter-title-row h3");

test("creation lists existing chapters; reorder persists, new chapters append and progress opens the class garden", async ({
  page,
}, info) => {
  const id = await classroom(page, info.project.name, names);
  await page.getByRole("button", { name: /Tạo chương học/ }).click();
  const dialog = page.getByRole("dialog", { name: "Thêm chương học" });
  await expect(
    dialog.getByRole("region", { name: "Chương hiện có" }).locator("li"),
  ).toHaveText(names);
  await expect(dialog).toContainText("ở vị trí 4");
  await dialog.getByLabel("Tên chương").fill("Chương mới");
  await dialog.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await navigateTo(page, { name: "Chương học", exact: true });
  await expect(titles(page)).toHaveText([...names, "Chương mới"]);
  await expect(page.getByLabel(/Vị trí chương/)).toHaveCount(0);
  await page.getByRole("button", { name: "Sắp xếp", exact: true }).click();
  const sortDialog = page.getByRole("dialog", {
    name: "Sắp xếp chương",
    exact: true,
  });
  await sortDialog
    .getByRole("button", { name: "Lên · Chương mới", exact: true })
    .click();
  await sortDialog
    .getByRole("button", { name: "Lên · Chương mới", exact: true })
    .click();
  await expect(titles(page)).toHaveText([...names, "Chương mới"]);
  await sortDialog
    .getByRole("button", { name: "Lưu thứ tự", exact: true })
    .click();
  await expect(sortDialog).toHaveCount(0);
  const ordered = [names[0], "Chương mới", names[1], names[2]];
  await expect(titles(page)).toHaveText(ordered);
  await expect(
    page.getByRole("status").filter({ hasText: "Đã lưu thứ tự" }),
  ).toBeVisible();
  await page.reload();
  await expect(titles(page)).toHaveText(ordered);
  await page.getByRole("button", { name: "Thêm chương", exact: true }).click();
  await expect(dialog.locator("li")).toHaveText(ordered);
  await expect(dialog).toContainText("ở vị trí 5");
  await dialog.getByLabel("Tên chương").fill("Chương cuối");
  await dialog.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(titles(page)).toHaveText([...ordered, "Chương cuối"]);
  for (const viewport of [
    { width: 320, height: 740 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
    { width: 768, height: 1024 },
    { width: 1440, height: 1000 },
  ]) {
    await page.setViewportSize(viewport);
    const row = page.locator(".chapter-row").first();
    const button = await row
      .getByRole("button", { name: /^Xóa chương ·/ })
      .boundingBox();
    const heading = await row.getByRole("heading").boundingBox();
    expect(button).toBeTruthy();
    expect(heading).toBeTruthy();
    expect(button!.x + button!.width).toBeLessThanOrEqual(heading!.x);
    expect(button!.width).toBeGreaterThanOrEqual(44);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (viewport.width === 320 || viewport.width === 1440)
      await page.screenshot({
        path: info.outputPath(`chapter-order-${viewport.width}.png`),
        fullPage: true,
      });
  }
  await navigateTo(page, { name: "Ngân hàng câu hỏi", exact: true });
  await expect(page.getByLabel("Chương câu hỏi").locator("option")).toHaveText([
    ...ordered,
    "Chương cuối",
  ]);
  const rows = await (await page.request.get("/api/classrooms")).json();
  expect(
    rows
      .find((c: { id: string }) => c.id === id)
      .chapters.map((ch: { title: string }) => ch.title),
  ).toEqual([...ordered, "Chương cuối"]);
  await navigateTo(page, { name: "Tổng quan", exact: true });
  await page.getByRole("button", { name: /Xem tiến độ/ }).click();
  await expect(page).toHaveURL(/section=classes/);
  await expect(
    page.getByRole("region", { name: "Khu vườn của lớp", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".roster-card")).toHaveCount(0);
});

test("failed ordering keeps current positions and permits a retry", async ({
  page,
}, info) => {
  await classroom(page, `retry-${info.project.name}`, names);
  await navigateTo(page, { name: "Chương học", exact: true });
  await page.route("**/api/classrooms/*/chapters/order", (route) =>
    route.fulfill({
      status: 503,
      json: { error: "Không lưu được thứ tự. Thử lại." },
    }),
  );
  await page.getByRole("button", { name: "Sắp xếp", exact: true }).click();
  const dialog = page.getByRole("dialog", {
    name: "Sắp xếp chương",
    exact: true,
  });
  const handle = dialog.getByRole("button", {
    name: `Kéo sắp xếp · ${names[2]}`,
    exact: true,
  });
  await handle.focus();
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  const control = dialog.getByRole("button", {
    name: "Lưu thứ tự",
    exact: true,
  });
  await control.click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Không lưu được thứ tự" }),
  ).toBeVisible();
  await expect(control).toBeEnabled();
  await expect(dialog.locator("li strong")).toHaveText([
    names[2],
    names[0],
    names[1],
  ]);
  await expect(titles(page)).toHaveText(names);
  await page.unroute("**/api/classrooms/*/chapters/order");
  await control.click();
  await expect(dialog).toHaveCount(0);
  await expect(titles(page)).toHaveText([names[2], names[0], names[1]]);
});

test("empty class creation and old server order capability have clear states", async ({
  page,
}, info) => {
  await classroom(page, `empty-${info.project.name}`);
  await page.getByRole("button", { name: /Tạo chương học/ }).click();
  const dialog = page.getByRole("dialog", { name: "Thêm chương học" });
  await expect(dialog).toContainText("Lớp chưa có chương học.");
  await expect(dialog).toContainText("ở vị trí 1");
  await dialog.getByLabel("Tên chương").fill("Chương đầu");
  await dialog.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.route("**/api/classrooms", async (route) => {
    const response = await route.fetch();
    const classes = await response.json();
    for (const c of classes)
      for (const ch of c.chapters) delete ch.canReorderChapter;
    await route.fulfill({ response, json: classes });
  });
  await page.reload();
  await navigateTo(page, { name: "Chương học", exact: true });
  await expect(
    page.getByRole("button", { name: "Sắp xếp", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByText("Đổi thứ tự chương đang chờ cập nhật máy chủ.", {
      exact: true,
    }),
  ).toBeVisible();
});

test("drag works with mouse and touch, cancel discards draft and save persists", async ({
  page,
}, info) => {
  const id = await classroom(page, `drag-${info.project.name}`, names);
  await navigateTo(page, { name: "Chương học", exact: true });
  await page.getByRole("button", { name: "Sắp xếp", exact: true }).click();
  const dialog = page.getByRole("dialog", {
    name: "Sắp xếp chương",
    exact: true,
  });
  const from = await dialog
    .getByRole("button", { name: `Kéo sắp xếp · ${names[2]}`, exact: true })
    .boundingBox();
  const to = await dialog.locator("li").first().boundingBox();
  const x = from!.x + from!.width / 2,
    y = from!.y + from!.height / 2;
  if (info.project.name === "mobile") {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y }],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x, y: to!.y + 12 }],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await cdp.detach();
  } else {
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x, to!.y + 12, { steps: 12 });
    await page.mouse.up();
  }
  await expect(dialog.locator("li strong")).toHaveText([
    names[2],
    names[0],
    names[1],
  ]);
  const classes = await (await page.request.get("/api/classrooms")).json();
  expect(
    classes
      .find((c: { id: string }) => c.id === id)
      .chapters.map((ch: { title: string }) => ch.title),
  ).toEqual(names);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    if (width === 320 || width === 1440)
      await dialog.screenshot({ path: info.outputPath(`sort-${width}.png`) });
  }
  await dialog.getByRole("button", { name: "Hủy", exact: true }).click();
  await expect(titles(page)).toHaveText(names);
  await expect(
    page.getByRole("button", { name: "Sắp xếp", exact: true }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Sắp xếp", exact: true }).click();
  await expect(dialog.locator("li strong")).toHaveText(names);
  await dialog
    .getByRole("button", { name: `Lên · ${names[1]}`, exact: true })
    .click();
  await dialog.getByRole("button", { name: "Lưu thứ tự", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.reload();
  await expect(titles(page)).toHaveText([names[1], names[0], names[2]]);
});
