import { test, expect, type Page } from "@playwright/test";
import { navigateTo } from "./navigation";
import { readFile } from "node:fs/promises";

async function openStatistics(page: Page) {
  await page.request.post("/api/auth/login", {
    data: { email: "giaovien@greenedu.nk", password: "GreenEdu123!" },
  });
  await page.goto("/");
  await page.getByLabel("Chọn lớp học").selectOption("learning-class");
  await navigateTo(page, { name: "Quản lý lớp", exact: true });
  await expect(
    page.locator(".roster-card").getByRole("button", { name: /Thống kê/ }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Thống kê", exact: true }).click();
  const dialog = page.getByRole("dialog", {
    name: "Thống kê thời gian học",
    exact: true,
  });
  await dialog
    .getByLabel("Học sinh", { exact: true })
    .selectOption("learning-student");
  return dialog;
}

test("teacher opens per-student day/week/month statistics, old time is preserved without invented history", async ({
  page,
}, info) => {
  const dialog = await openStatistics(page);
  const table = dialog.getByRole("table", {
    name: "Thời gian luyện tập theo kỳ",
    exact: true,
  });
  await expect(table.getByRole("row")).toHaveCount(15);
  await expect(
    dialog.getByText("Chưa có lịch sử", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    dialog.locator(".workspace-help .study-statistics-note"),
  ).toContainText("4 giờ 0 phút");
  await expect(
    dialog.locator(".workspace-help .study-statistics-note"),
  ).toContainText("Số liệu tính từ ngày triển khai, kể cả kỳ đầu chưa trọn.");
  await dialog.getByText("Cách tính thời gian", { exact: true }).click();
  const pendingCsv = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Xuất CSV", exact: true }).click();
  const csv = await readFile((await (await pendingCsv).path())!, "utf8");
  expect(csv.charCodeAt(0)).toBe(0xfeff);
  expect(csv).toContain('"Thời gian học","Tỉ lệ đúng"');
  expect(csv).toContain('"Điểm bài kiểm tra online"');
  expect(csv).toContain('"Học sinh","Học sinh ôn thi"');
  await dialog.getByRole("button", { name: "Tuần", exact: true }).click();
  await expect(table.getByRole("row")).toHaveCount(9);
  await expect(
    dialog.getByRole("button", { name: "Tuần", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await dialog.getByRole("button", { name: "Tháng", exact: true }).click();
  await expect(table.getByRole("row")).toHaveCount(13);
  await dialog.getByLabel("Ngày xem", { exact: true }).fill("2026-01-01");
  await expect(dialog.locator(".study-statistics-summary")).toContainText(
    "Chưa có lịch sử",
  );
  await dialog.screenshot({
    path: info.outputPath("study-statistics-month.png"),
  });
  await dialog.getByRole("button", { name: "Đóng", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole("button", {
      name: "Thống kê",
      exact: true,
    }),
  ).toBeFocused();
});

test("toolbar statistics includes the full roster despite search and CSV follows student, period and date", async ({
  page,
}, info) => {
  await page.request.post("/api/auth/login", {
    data: { email: "giaovien@greenedu.nk", password: "GreenEdu123!" },
  });
  const created = await page.request.post("/api/classrooms", {
    data: {
      name: `Thống kê / ${info.project.name} ♥`,
      subject: "Vật lý",
      grade: "10",
    },
  });
  const { id } = await created.json();
  const students: { id: string; name: string }[] = [];
  for (const name of ["=SUM(1,2)", 'Bạn "An", lớp 10']) {
    const email = `stats-${Date.now()}-${students.length}@fixture.test`;
    const response = await page.request.post(`/api/classrooms/${id}/students`, {
      data: { name, email, password: "StatsTest123!" },
    });
    expect(response.ok()).toBe(true);
    students.push({ id: (await response.json()).id, name });
  }
  await page.goto("/");
  await page.getByLabel("Chọn lớp học").selectOption(id);
  await navigateTo(page, { name: "Quản lý lớp", exact: true });
  await page
    .getByPlaceholder("Tìm theo tên hoặc email…")
    .fill("Không tìm thấy");
  await page.getByRole("button", { name: "Thống kê", exact: true }).click();
  const dialog = page.getByRole("dialog", {
    name: "Thống kê thời gian học",
    exact: true,
  });
  const select = dialog.getByLabel("Học sinh", { exact: true });
  await expect(select.locator("option")).toHaveCount(3);
  await expect(
    dialog
      .getByRole("table", { name: "Thống kê từng học sinh", exact: true })
      .getByRole("row"),
  ).toHaveCount(3);
  const downloadCsv = async () => {
    const pending = page.waitForEvent("download");
    await dialog.getByRole("button", { name: "Xuất CSV", exact: true }).click();
    const download = await pending;
    return {
      text: await readFile((await download.path())!, "utf8"),
      filename: download.suggestedFilename(),
    };
  };
  const all = await downloadCsv();
  expect(all.filename).toContain(
    `greenedu-thong-ke-thong-ke-${info.project.name}-ca-lop-`,
  );
  const expectVisibleTablesInCsv = async (text: string) => {
    // Compare downloaded cells against the actual displayed tables, including
    // ordering, missing history and human-readable time/date formatting.
    const tables = await dialog
      .getByRole("table", { name: "Thống kê theo khoảng ngày", exact: true })
      .evaluateAll((tables) =>
        tables.map((table) =>
          Array.from(table.querySelectorAll("tr")).map((row) =>
            Array.from(row.querySelectorAll("th, td")).map((cell) =>
              (cell.textContent ?? "").trim(),
            ),
          ),
        ),
      );
    const csvRow = (cells: string[]) =>
      cells
        .map(
          (cell) =>
            `"${(/^[\s]*[=+@-]/.test(cell) ? "'" + cell : cell).replace(/"/g, '""')}"`,
        )
        .join(",");
    for (const table of tables)
      expect(text).toContain(table.map(csvRow).join("\r\n"));
    expect(text).not.toContain("Mã học sinh");
    expect(text).not.toContain("(giây)");
  };
  await expectVisibleTablesInCsv(all.text);
  expect(all.text).toContain('"\'=SUM(1,2)"');
  expect(all.text).toContain('"Bạn ""An"", lớp 10"');
  for (const s of students) expect(all.text).not.toContain(s.id);
  // All three period views export the same two tables the teacher sees.
  for (const label of ["Tuần", "Tháng", "Ngày"]) {
    await dialog.getByRole("button", { name: label, exact: true }).click();
    await expect(
      dialog.getByRole("button", { name: "Xuất CSV", exact: true }),
    ).toBeEnabled();
    await expectVisibleTablesInCsv((await downloadCsv()).text);
  }
  const endpoint = `**/api/classrooms/${id}/study-statistics?**`;
  await page.route(endpoint, (route) =>
    route.fulfill({ status: 404, json: { error: "Máy chủ cũ" } }),
  );
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(dialog.getByRole("alert")).toContainText("Cần cập nhật máy chủ");
  await expect(
    dialog.getByRole("button", { name: "Xuất CSV", exact: true }),
  ).toBeDisabled();
  await select.selectOption(students[1].id);
  await dialog.getByRole("button", { name: "Tuần", exact: true }).click();
  await dialog.getByLabel("Ngày xem", { exact: true }).fill("2026-01-01");
  await dialog.getByLabel("Từ ngày", { exact: true }).fill("2026-01-01");
  await dialog.getByLabel("Đến ngày", { exact: true }).fill("2026-01-01");
  await expect(
    dialog
      .getByRole("table", { name: "Thời gian luyện tập theo kỳ", exact: true })
      .getByRole("row"),
  ).toHaveCount(9);
  const single = await downloadCsv();
  expect(single.filename).toBe(
    `greenedu-thong-ke-thong-ke-${info.project.name}-${students[1].id}-2026-01-01-den-2026-01-01.csv`,
  );
  await expectVisibleTablesInCsv(single.text);
  expect(single.text).not.toContain("Thống kê từng học sinh");
  expect(single.text).toContain(
    '"Từ ngày","01/01/2026","Đến ngày","01/01/2026"',
  );
  expect(single.text).not.toContain(students[0].id);
  expect(single.text).toContain('"Chưa có lịch sử"');
  await page.unroute(endpoint);
  await select.selectOption("");
  await expect(
    dialog.getByRole("table", { name: "Thống kê từng học sinh", exact: true }),
  ).toBeVisible();
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width === 1440) {
      expect(
        await dialog
          .locator(".table-scroll")
          .first()
          .evaluate((el) => el.scrollWidth <= el.clientWidth),
      ).toBe(true);
    }
    if (width === 320 || width === 1440)
      await dialog.screenshot({
        path: info.outputPath(`statistics-all-${width}.png`),
      });
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Thống kê", exact: true }),
  ).toBeFocused();
});

test("empty class statistics display a clear empty state and disable export", async ({
  page,
}, info) => {
  await page.request.post("/api/auth/login", {
    data: { email: "giaovien@greenedu.nk", password: "GreenEdu123!" },
  });
  const response = await page.request.post("/api/classrooms", {
    data: {
      name: `Thống kê rỗng ${info.project.name}`,
      subject: "Vật lý",
      grade: "10",
    },
  });
  const { id } = await response.json();
  await page.goto("/");
  await page.getByLabel("Chọn lớp học").selectOption(id);
  await navigateTo(page, { name: "Quản lý lớp", exact: true });
  await page.getByRole("button", { name: "Thống kê", exact: true }).click();
  const dialog = page.getByRole("dialog", {
    name: "Thống kê thời gian học",
    exact: true,
  });
  await expect(
    dialog.getByText("Lớp chưa có học sinh.", { exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Xuất CSV", exact: true }),
  ).toBeDisabled();
  await expect(
    dialog.getByLabel("Học sinh", { exact: true }).locator("option"),
  ).toHaveCount(1);
});

test("statistics refresh credited practice time while open and keep confirmed data through errors", async ({
  page,
  playwright,
  baseURL,
}) => {
  const learner = await playwright.request.newContext({
    baseURL,
  });
  await learner.post("/api/auth/login", {
    data: { email: "learning@greenedu.test", password: "LearningTest123!" },
  });
  const dialog = await openStatistics(page);
  const summaries = dialog.locator(".study-statistics-summary");
  await expect(summaries).toBeVisible();
  const day = summaries.locator("dd").first();
  const before = await day.innerText();
  const start = await learner.post("/api/study/start", {
    data: { chapterId: "learning-ch2", questionId: "learning-ch2-q1" },
  });
  expect(start.ok()).toBe(true);
  const { sessionId } = await start.json();
  try {
    await expect
      .poll(
        async () => {
          const heartbeat = await learner.post("/api/study/heartbeat", {
            data: { sessionId, active: true, interacted: true },
          });
          expect(heartbeat.ok()).toBe(true);
          return (await heartbeat.json()).creditedSeconds;
        },
        { intervals: [1200], timeout: 6000 },
      )
      .toBeGreaterThan(1);
    await expect(day).not.toHaveText(before, { timeout: 10000 });
    await page.route(
      "**/api/classrooms/learning-class/students/learning-student/study-statistics?**",
      (route) =>
        route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ error: "Nguồn thống kê tạm ngừng" }),
        }),
    );
    await expect(dialog.getByRole("alert")).toContainText(
      "Nguồn thống kê tạm ngừng",
      { timeout: 10000 },
    );
    await expect(
      dialog.getByRole("table", {
        name: "Thời gian luyện tập theo kỳ",
        exact: true,
      }),
    ).toBeVisible();
    const confirmed = await day.innerText();
    await page.unroute(
      "**/api/classrooms/learning-class/students/learning-student/study-statistics?**",
    );
    await dialog.getByRole("button", { name: "Thử lại", exact: true }).click();
    await expect(day).toHaveText(confirmed);
    await expect(dialog.getByRole("alert")).toHaveCount(0);
  } finally {
    await learner.post("/api/study/stop", {
      data: { sessionId, active: false },
    });
    await learner.dispose();
  }
});

test("statistics handle older servers and fit small and wide screens", async ({
  page,
}, info) => {
  const endpoint =
    "**/api/classrooms/learning-class/students/learning-student/study-statistics?**";
  await page.route(endpoint, (route) =>
    route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ error: "Not available" }),
    }),
  );
  const dialog = await openStatistics(page);
  await expect(dialog.getByRole("alert")).toContainText("Cần cập nhật máy chủ");
  await page.unroute(endpoint);
  await dialog.getByRole("button", { name: "Thử lại", exact: true }).click();
  await expect(
    dialog.getByRole("table", {
      name: "Thời gian luyện tập theo kỳ",
      exact: true,
    }),
  ).toBeVisible();
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await dialog.evaluate(
        (element) => element.scrollWidth <= element.clientWidth,
      ),
    ).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const box = await dialog.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
  }
  await dialog.screenshot({
    path: info.outputPath("study-statistics-day.png"),
  });
});
