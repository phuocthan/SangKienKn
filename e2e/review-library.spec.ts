import { test, expect, type Page } from "@playwright/test";
import { strToU8, zipSync } from "fflate";
import { navigateTo } from "./navigation";

async function setup(page: Page, name: string) {
  expect(
    (
      await page.request.post("/api/auth/login", {
        data: { email: "giaovien@greenedu.nk", password: "GreenEdu123!" },
      })
    ).ok(),
  ).toBeTruthy();
  const c = await (
    await page.request.post("/api/classrooms", {
      data: { name, subject: "Vật lý", grade: "11" },
    })
  ).json();
  const chapter = await (
    await page.request.post(`/api/classrooms/${c.id}/chapters`, {
      data: { title: "Chương ôn tải lên" },
    })
  ).json();
  expect(
    (
      await page.request.post(`/api/classrooms/${c.id}/memberships`, {
        data: { email: "hocsinh@greenedu.nk" },
      })
    ).ok(),
  ).toBeTruthy();
  await page.goto("/");
  await page.getByLabel("Chọn lớp học").selectOption(c.id);
  await navigateTo(page, { name: "Ôn tập", exact: true });
  await expect(
    page.getByRole("heading", { name: "Ôn tập", exact: true }),
  ).toBeVisible();
  return { ...c, chapter };
}
const csv =
  "Bài học,Câu hỏi,A,B,C,D,Đáp án,Lời giải\nBài ôn,Tần số 2 Hz có chu kỳ bao nhiêu?,0.5 s,1 s,2 s,4 s,A,T = 1/f = 0.5 s.\n";
function word() {
  const lines = [
    "Câu 1: Đơn vị độ dài SI?",
    "Bài học: Bài ôn",
    "A. Mét",
    "B. Centimét",
    "C. Kilômét",
    "D. Milimét",
    "Đáp án: A",
    "Lời giải: Đơn vị cơ bản là mét.",
    "Câu 2: Tốc độ khi đi 20 m trong 5 s?",
    "Bài học: Bài ôn",
    "A. 4 m/s",
    "B. 2 m/s",
    "C. 8 m/s",
    "D. 20 m/s",
    "Đáp án: A",
    "Lời giải: v = s/t = 20/5 = 4 m/s.",
  ];
  return Buffer.from(
    zipSync({
      "word/document.xml": strToU8(
        `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${lines.map((line) => `<w:p><w:r><w:t>${line}</w:t></w:r></w:p>`).join("")}</w:body></w:document>`,
      ),
    }),
  );
}

test("teacher uploads a titled Word/CSV review; student selects, resumes and repeats without mixing exams", async ({
  page,
}, info) => {
  const c = await setup(page, `Bài ôn ${info.project.name} ${Date.now()}`);
  const title = `Ôn tuần 1 · ${info.project.name}`;
  const tabs = page.getByRole("tablist", { name: "Ôn tập" });
  await expect(tabs.getByRole("tab")).toHaveCount(3);
  await page.getByRole("button", { name: "Tạo bài ôn", exact: true }).click();
  const form = page.getByRole("dialog", { name: "Tạo bài ôn", exact: true });
  await form.getByLabel("Tiêu đề bài ôn").fill(title);
  await expect(
    form.getByRole("link", { name: "Mẫu Word", exact: true }),
  ).toHaveAttribute("href", "/templates/greenedu-cau-hoi-mau.docx");
  await form.getByLabel("File đề (.docx hoặc .csv)").setInputFiles({
    name: "on-tap.docx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    buffer: word(),
  });
  await expect(form).toContainText("2 câu đã chọn / tối đa 100");
  await form.getByLabel("File đề (.docx hoặc .csv)").setInputFiles({
    name: "on-tap.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(csv),
  });
  await expect(form).toContainText("3 câu đã chọn / tối đa 100");
  await form.getByRole("button", { name: "Lưu bài ôn", exact: true }).click();
  await expect(form).toHaveCount(0);
  await expect(page.locator(".review-paper")).toContainText(title);
  await expect(page.locator(".review-paper")).toContainText("3 câu");
  await page.screenshot({
    path: info.outputPath("teacher-library.png"),
    fullPage: true,
  });
  const bank = await (
    await page.request.get(`/api/chapters/${c.chapter.id}/questions`)
  ).json();
  expect(bank).toHaveLength(0);
  await tabs
    .getByRole("tab", { name: "Săn thưởng", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Săn thưởng", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Mở săn thưởng", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".review-paper")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Mở săn thưởng", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Mở săn thưởng", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Đóng", exact: true })
    .click();
  await tabs.getByRole("tab", { name: "Kiểm tra", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Tạo bài kiểm tra", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".review-paper")).toHaveCount(0);
  await page.request.post("/api/auth/logout", { data: {} });
  await page.request.post("/api/auth/login", {
    data: { email: "hocsinh@greenedu.nk", password: "GreenEdu123!" },
  });
  await page.goto(`/#section=learning&classroom=${c.id}`);
  await page.reload();
  await expect(page.locator(".review-paper")).toContainText(title);
  await page
    .locator(".review-paper")
    .getByRole("button", { name: "Bắt đầu ôn", exact: true })
    .click();
  await expect(page.locator(".question-meta")).toContainText("Câu 1/3");
  await page.locator(".choices .choice").first().click();
  await page
    .getByRole("button", { name: "Kiểm tra đáp án", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Câu tiếp theo", exact: true })
    .click();
  await expect(page.locator(".question-meta")).toContainText("Câu 2/3");
  const text = await page.locator(".question-card h2").innerText();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Ôn tập", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Tiếp tục ôn", exact: true }).click();
  await expect(page.locator(".question-meta")).toContainText("Câu 2/3");
  await expect(page.locator(".question-card h2")).toHaveText(text);
  for (let i = 0; i < 2; i++) {
    await page.locator(".choices .choice").first().click();
    await page
      .getByRole("button", { name: "Kiểm tra đáp án", exact: true })
      .click();
    await page
      .getByRole("button", {
        name: i === 1 ? "Xem kết quả" : "Câu tiếp theo",
        exact: true,
      })
      .click();
  }
  await page.getByRole("button", { name: "Làm lại bài", exact: true }).click();
  await expect(page.locator(".question-meta")).toContainText("Câu 1/3");
  await page
    .getByRole("button", { name: "Kết thúc phiên", exact: true })
    .click();
  await expect(page.locator(".review-paper")).toContainText(title);
  await expect(page.locator(".learning-chapter")).toHaveCount(0);
  await expect(page.locator(".online-exam-groups")).toHaveCount(0);
});

test("review creation preserves title and file after response loss and retries without duplicate papers", async ({
  page,
}, info) => {
  const c = await setup(page, `Thử lại ôn ${info.project.name} ${Date.now()}`);
  const bodies: { requestId: string }[] = [];
  await page.route(`**/api/classrooms/${c.id}/review-papers`, async (route) => {
    bodies.push(route.request().postDataJSON());
    const response = await route.fetch();
    if (bodies.length === 1)
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "Chưa nhận được phản hồi. Thử lại." }),
      });
    else await route.fulfill({ response });
  });
  await page.getByRole("button", { name: "Tạo bài ôn", exact: true }).click();
  const form = page.getByRole("dialog");
  await form.getByLabel("Tiêu đề bài ôn").fill("Ôn sau lỗi mạng");
  await form.getByLabel("File đề (.docx hoặc .csv)").setInputFiles({
    name: "on.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(csv),
  });
  await form.getByRole("button", { name: "Lưu bài ôn", exact: true }).click();
  await expect(form.getByRole("alert")).toContainText("Thử lại");
  await expect(form.getByRole("alert")).toBeFocused();
  await expect(form.getByLabel("Tiêu đề bài ôn")).toHaveValue(
    "Ôn sau lỗi mạng",
  );
  await expect(form).toContainText("1 câu đã chọn / tối đa 100");
  await form.getByRole("button", { name: "Lưu bài ôn", exact: true }).click();
  await expect(form).toHaveCount(0);
  expect(bodies).toHaveLength(2);
  expect(bodies[0].requestId).toBe(bodies[1].requestId);
  await expect(page.locator(".review-paper")).toHaveCount(1);
});

test("three learning tabs fit mobile, keep dock positions and survive reload and keyboard navigation", async ({
  page,
}, info) => {
  const c = await setup(
    page,
    `Điều hướng ôn ${info.project.name} ${Date.now()}`,
  );
  const list = page.getByRole("tablist", { name: "Ôn tập" });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    let dock: number[] | undefined;
    for (const name of ["Ôn tập", "Săn thưởng", "Kiểm tra"]) {
      await list.getByRole("tab", { name, exact: true }).click();
      await expect(
        page.getByRole("heading", { name, exact: true }),
      ).toBeVisible();
      const positions = await page
        .getByRole("navigation", { name: "Điều hướng chính" })
        .getByRole("button")
        .evaluateAll((nodes) =>
          nodes.map((node) => node.getBoundingClientRect().x),
        );
      expect(positions).toHaveLength(5);
      if (dock) expect(positions).toEqual(dock);
      else dock = positions;
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      if (width < 700)
        expect(
          await list
            .locator(".workspace-tab-label")
            .evaluateAll((nodes) =>
              nodes.every(
                (n) =>
                  n.scrollHeight <= n.clientHeight + 1 &&
                  n.getBoundingClientRect().height <= 31,
              ),
            ),
        ).toBe(true);
    }
    if (width === 390 || width === 1440)
      await page.screenshot({
        path: info.outputPath(`tabs-${width}.png`),
        fullPage: true,
      });
  }
  await list.getByRole("tab", { name: "Ôn tập", exact: true }).click();
  await list.getByRole("tab", { name: "Ôn tập", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    list.getByRole("tab", { name: "Săn thưởng", exact: true }),
  ).toBeFocused();
  await page.reload();
  await expect(page.getByLabel("Chọn lớp học")).toHaveValue(c.id);
  await expect(
    page.getByRole("heading", { name: "Săn thưởng", exact: true }),
  ).toBeVisible();
});

test("old backend blocks uploaded review creation and keeps the other workspaces available", async ({
  page,
}, info) => {
  const c = await setup(page, `API cũ ${info.project.name} ${Date.now()}`);
  await page.route(`**/api/classrooms/${c.id}/learning`, async (route) => {
    const response = await route.fetch();
    const json = await response.json();
    delete json.reviewPapers;
    await route.fulfill({ response, json });
  });
  await page.reload();
  await page.getByRole("button", { name: "Tạo bài ôn", exact: true }).click();
  const form = page.getByRole("dialog");
  await expect(form).toContainText("đang chờ cập nhật backend Railway");
  await expect(
    form.getByRole("button", { name: "Lưu bài ôn", exact: true }),
  ).toBeDisabled();
  await form.getByRole("button", { name: "Hủy", exact: true }).click();
  await page.getByRole("tab", { name: "Kiểm tra", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Tạo bài kiểm tra", exact: true }),
  ).toBeEnabled();
});
