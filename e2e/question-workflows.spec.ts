import { test, expect, type Page } from "@playwright/test";
import { navigateTo } from "./navigation";

const login = async (page: Page, student = false) => {
  const r = await page.request.post("/api/auth/login", {
    data: student
      ? { email: "learning@greenedu.test", password: "LearningTest123!" }
      : { email: "giaovien@greenedu.nk", password: "GreenEdu123!" },
  });
  expect(r.ok()).toBe(true);
};
async function createClass(page: Page, label: string) {
  await login(page);
  const post = async (path: string, data: unknown) => {
    const r = await page.request.post("/api" + path, { data });
    expect(r.ok(), await r.text()).toBe(true);
    return r.json();
  };
  const classroom = await post("/classrooms", {
    name: label + " " + Date.now(),
    subject: "Vật lý",
    sourceClassroomId: "learning-class",
  });
  const chapter = await post(`/classrooms/${classroom.id}/chapters`, {
    title: "Chương kiểm thử",
  });
  await post(`/chapters/${chapter.id}/lessons`, { title: "Bài 1" });
  await post(`/chapters/${chapter.id}/lessons`, { title: "Bài 2" });
  return { classroom, chapter, post };
}
test("bank searches without accents and edits the shared source directly from a student notebook with retry and cancel", async ({
  page,
}, info) => {
  const f = await createClass(page, "Tìm và sửa " + info.project.name);
  const q = await f.post(`/chapters/${f.chapter.id}/questions`, {
    text: "Dao động tại vị trí cân bằng",
    lesson: "Bài 1",
    topic: "Gia tốc hướng tâm",
    choices: ["vmax", "B", "C", "D"],
    correctIndex: 0,
    explanation: "Vận tốc đạt cực đại.",
  });
  await f.post(`/chapters/${f.chapter.id}/questions`, {
    text: "Cơ năng bảo toàn",
    lesson: "Bài 2",
    choices: ["A", "B", "C", "D"],
    correctIndex: 0,
    explanation: "Xét thế năng.",
  });
  await login(page, true);
  expect(
    (
      await page.request.post("/api/attempts", {
        data: {
          questionId: q.id,
          selected: 1,
          mode: "practice",
          requestId: crypto.randomUUID(),
        },
      })
    ).ok(),
  ).toBe(true);
  await login(page);
  await page.goto("/");
  await page.getByLabel("Chọn lớp học").selectOption(f.classroom.id);
  await navigateTo(page, { name: "Ngân hàng câu hỏi", exact: true });
  const search = page.getByRole("searchbox", {
    name: "Tìm câu hỏi",
    exact: true,
  });
  await expect(page.locator(".bank-question")).toHaveCount(2);
  for (const term of ["DAO DONG", "huong tam", "vmax"]) {
    await search.fill(term);
    await expect(page.locator(".bank-question")).toHaveCount(1);
    await expect(page.locator(".bank-question")).toContainText("Dao động");
  }
  await page.getByLabel("Chọn tất cả đang hiển thị", { exact: true }).check();
  await expect(
    page.getByRole("button", { name: "Xóa các câu đã chọn", exact: true }),
  ).toContainText("Xóa");
  await search.fill("khong-co-noi-dung");
  await expect(
    page.getByText("Không tìm thấy câu hỏi phù hợp", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Xóa các câu đã chọn", exact: true }),
  ).toHaveCount(0);
  await search.fill("dao dong");
  await page.getByLabel("Lọc theo bài học").selectOption("Bài 2");
  await expect(page.locator(".bank-question")).toHaveCount(0);
  await page.getByLabel("Lọc theo bài học").selectOption("");
  await search.fill("");
  await expect(page.locator(".bank-question")).toHaveCount(2);
  await navigateTo(page, { name: "Quản lý lớp", exact: true });
  await page
    .getByRole("row")
    .filter({ hasText: "learning@greenedu.test" })
    .getByRole("button", { name: "Xem sổ tay", exact: true })
    .click();
  const notebook = page.getByRole("dialog", {
    name: "Sổ tay · Học sinh ôn thi",
    exact: true,
  });
  await notebook
    .getByRole("button", { name: "Sửa câu hỏi", exact: true })
    .click();
  const edit = page.getByRole("dialog", {
    name: "Sửa câu hỏi từ sổ tay",
    exact: true,
  });
  const text = edit.getByRole("textbox", {
    name: "Nội dung câu hỏi",
    exact: true,
  });
  await expect(text).toHaveValue("Dao động tại vị trí cân bằng");
  await text.fill("Nháp bỏ đi");
  await edit.getByRole("button", { name: "Hủy", exact: true }).click();
  await notebook
    .getByRole("button", { name: "Sửa câu hỏi", exact: true })
    .click();
  await expect(text).toHaveValue("Dao động tại vị trí cân bằng");
  const endpoint = `**/api/questions/${q.id}/notebook-edit`;
  await page.route(endpoint, (route) =>
    route.fulfill({ status: 503, json: { error: "Lỗi thử lại" } }),
  );
  await text.fill("Dao động với a_{max} và x^{2} đã sửa");
  await edit
    .getByRole("combobox", { name: "Đáp án đúng", exact: true })
    .selectOption("2");
  await edit
    .getByRole("textbox", { name: "Lời giải", exact: true })
    .fill("Lời giải mới chọn C.");
  await edit
    .getByRole("button", { name: "Lưu câu nguồn", exact: true })
    .click();
  await expect(edit.getByRole("alert")).toContainText("Lỗi thử lại");
  await expect(text).toHaveValue("Dao động với a_{max} và x^{2} đã sửa");
  await page.unroute(endpoint);
  await edit
    .getByRole("button", { name: "Lưu câu nguồn", exact: true })
    .click();
  await expect(notebook).toContainText("Đã lưu phiên bản nguồn 2");
  const card = notebook.locator(".question-card");
  await expect(card.getByRole("heading")).toHaveText(
    "Dao động với amax và x2 đã sửa",
  );
  await expect(card.locator(":scope > .choices .correct-choice")).toHaveText(
    "CC",
  );
  await expect(
    card.getByText("Lời giải mới chọn C.", { exact: true }),
  ).toBeVisible();
  await expect(card.locator(".notebook-wrong-history")).toContainText("B. B");
  await card
    .getByText("Câu và đáp án lúc làm bài · Phiên bản 1", { exact: true })
    .click();
  await expect(card.locator("details")).toContainText(
    "Dao động tại vị trí cân bằng",
  );
  await expect(card.locator("details .correct-choice")).toHaveText("Avmax");
  await notebook.screenshot({
    path: info.outputPath("notebook-updated-answer.png"),
  });
  await notebook
    .getByRole("button", { name: "Sửa câu hỏi", exact: true })
    .click();
  await expect(text).toHaveValue("Dao động với a_{max} và x^{2} đã sửa");
  await expect(
    edit.getByRole("combobox", { name: "Đáp án đúng", exact: true }),
  ).toHaveValue("2");
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({
    width: info.project.name === "mobile" ? 390 : 1440,
    height: 900,
  });
  await edit.screenshot({ path: info.outputPath("notebook-edit.png") });
  await edit.getByRole("button", { name: "Hủy", exact: true }).click();
  await notebook.getByRole("button", { name: "Đóng", exact: true }).click();
  await page.reload();
  await page.getByLabel("Chọn lớp học").selectOption(f.classroom.id);
  await navigateTo(page, { name: "Quản lý lớp", exact: true });
  await page
    .getByRole("row")
    .filter({ hasText: "learning@greenedu.test" })
    .getByRole("button", { name: "Xem sổ tay", exact: true })
    .click();
  await expect(card.locator(":scope > .choices .correct-choice")).toHaveText(
    "CC",
  );
  await expect(card.getByRole("heading")).toHaveText(
    "Dao động với amax và x2 đã sửa",
  );
  await notebook.getByRole("button", { name: "Đóng", exact: true }).click();
  await navigateTo(page, { name: "Ngân hàng câu hỏi", exact: true });
  await search.fill("da sua");
  await expect(page.locator(".bank-question")).toHaveCount(1);
  await expect(page.locator(".bank-question sup")).toHaveText("2");
  await expect(page.locator(".bank-question sub")).toHaveText("max");
  await page
    .locator(".bank-question")
    .screenshot({ path: info.outputPath("search-result.png") });
});

test("teacher uploads three different hunt papers, duplicate content is rejected and all slots survive closing/reopening", async ({
  page,
}, info) => {
  const f = await createClass(page, "Ba đề " + info.project.name);
  await page.goto("/");
  await page.getByLabel("Chọn lớp học").selectOption(f.classroom.id);
  await navigateTo(page, { name: "Săn thưởng", exact: true });
  await page
    .getByRole("button", { name: "Mở săn thưởng", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Mở săn thưởng",
    exact: true,
  });
  await expect(dialog).toContainText("giữ mở đến khi giáo viên khóa");
  const upload = async (slot: number, text: string) =>
    dialog
      .getByRole("group", {
        name: `Đề ${slot} · Vé cấp ${slot + 2}`,
        exact: true,
      })
      .getByLabel("File đề (.docx hoặc .csv)")
      .setInputFiles({
        name: `de-${slot}.csv`,
        mimeType: "text/csv",
        buffer: Buffer.from(
          `Bài học,Câu hỏi,A,B,C,D,Đáp án,Lời giải\nBài 1,${text},A,B,C,D,A,Đáp án A\n`,
        ),
      });
  for (const slot of [1, 2, 3]) await upload(slot, "Nội dung trùng");
  await dialog
    .getByRole("button", { name: "Mở săn thưởng", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toContainText("phải khác nội dung");
  // Reopen to replace draft contents without adding another question to a paper.
  await dialog.getByRole("button", { name: "Hủy", exact: true }).click();
  await page
    .getByRole("button", { name: "Mở săn thưởng", exact: true })
    .click();
  for (const slot of [1, 2, 3]) await upload(slot, `Câu riêng đề ${slot}`);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({
    width: info.project.name === "mobile" ? 390 : 1440,
    height: 900,
  });
  await dialog.screenshot({ path: info.outputPath("three-hunt-papers.png") });
  await dialog
    .getByRole("button", { name: "Mở săn thưởng", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await expect(
    page.locator(".learning-row").filter({ hasText: "Chương kiểm thử" }),
  ).toContainText("3/3 đề");
  const overview = await (
    await page.request.get(`/api/classrooms/${f.classroom.id}/learning`)
  ).json();
  expect(overview.huntTeacherControlled).toBe(true);
  expect(overview.chapters[0].hunt.closesAt).toBeNull();
  expect(overview.chapters[0].hunt.open).toBe(true);
  expect(overview.chapters[0].hunt.papers.map((p: any) => p.slot)).toEqual([
    1, 2, 3,
  ]);
  expect(JSON.stringify(overview.chapters[0].hunt)).not.toContain(
    "correctIndex",
  );
  await page
    .getByRole("button", { name: "Khóa săn thưởng", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Xác nhận khóa", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Mở săn thưởng", exact: true })
    .click();
  await expect(dialog.getByLabel(/Sử dụng bộ đề đã tải trước đó/)).toHaveCount(
    3,
  );
  for (const checkbox of await dialog
    .getByLabel(/Sử dụng bộ đề đã tải trước đó/)
    .all())
    await expect(checkbox).toBeChecked();
  await dialog
    .getByRole("button", { name: "Mở săn thưởng", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
});
