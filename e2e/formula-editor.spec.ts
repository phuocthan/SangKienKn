import { test, expect, type Page } from "@playwright/test";
import { navigateTo } from "./navigation";
import { zipSync, strToU8 } from "fflate";

async function prepare(page: Page, suffix: string) {
  const login = await page.request.post("/api/auth/login", {
    data: { email: "giaovien@greenedu.nk", password: "GreenEdu123!" },
  });
  expect(login.ok()).toBe(true);
  const post = async (path: string, data: unknown) => {
    const response = await page.request.post("/api" + path, { data });
    expect(response.ok(), await response.text()).toBe(true);
    return response.json();
  };
  const classroom = await post("/classrooms", {
    name: `Công thức ${suffix} ${Date.now()}`,
    subject: "Vật lý",
    grade: "11",
  });
  const chapter = await post(`/classrooms/${classroom.id}/chapters`, {
    title: "Chương công thức",
  });
  const question = await post(`/chapters/${chapter.id}/questions`, {
    text: "Động năng Wđ của vật?",
    lesson: "Bài công thức",
    choices: ["Wđ = mv", "Wđ = mv²/2", "Wđ = mv²", "Wđ = m²v/2"],
    correctIndex: 1,
    explanation: "Động năng của vật.",
  });
  await page.goto("/");
  await page.getByLabel("Chọn lớp học").selectOption(classroom.id);
  return { classroom, chapter, question };
}

test("visual formula editor keeps Vietnamese subscripts through insertion, clipboard, save, reload and version history", async ({
  page,
  context,
}, info) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const failures: string[] = [];
  page.on("requestfailed", (r) => {
    if (/FormulaComposer|KaTeX|mathlive/.test(r.url())) failures.push(r.url());
  });
  const fixture = await prepare(page, info.project.name);
  await navigateTo(page, { name: "Ngân hàng câu hỏi", exact: true });
  await page.getByRole("button", { name: "Sửa câu hỏi", exact: true }).click();
  const modal = page.getByRole("dialog", { name: "Sửa câu hỏi", exact: true });
  const text = modal.getByLabel("Nội dung câu hỏi", { exact: true });
  await text.fill("Động năng ");
  await text.press("End");
  await modal
    .getByRole("button", {
      name: "Công thức cho Nội dung câu hỏi",
      exact: true,
    })
    .click();
  const composer = modal.getByRole("region", { name: "Bộ soạn công thức" });
  const visual = composer.locator("math-field");
  await expect(visual).toBeVisible();
  await visual.click();
  await expect(visual).toBeFocused();
  await page.keyboard.type("x");
  await expect(composer.getByLabel("Mã công thức (LaTeX)")).toHaveValue("x");
  await composer
    .getByRole("button", { name: "Chỉ số dưới", exact: true })
    .click();
  await expect(visual).toBeFocused();
  await page.keyboard.type("0");
  await expect(composer.getByLabel("Mã công thức (LaTeX)")).toHaveValue(
    /x.*_.*0/,
  );
  await composer.getByLabel("Mã công thức (LaTeX)").fill("\\frac{1}{");
  await expect(composer.getByRole("alert")).toContainText("chưa hợp lệ");
  await expect(
    composer.getByRole("button", { name: "Chèn công thức", exact: true }),
  ).toBeDisabled();
  await composer.getByRole("button", { name: "Mẫu Wđ", exact: true }).click();
  await expect(composer.locator(".formula-preview math msub")).toHaveCount(1);
  await expect(composer.locator(".formula-preview math mfrac")).toHaveCount(1);
  await composer
    .getByRole("button", { name: "Sao chép MathML", exact: true })
    .click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    "<math",
  );
  await composer
    .getByRole("button", { name: "Sao chép công thức", exact: true })
    .click();
  await expect(composer.locator("p[role=status]")).toContainText(
    "Đã sao chép công thức",
  );
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain("\\text{đ}");
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(await composer.evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(
      true,
    );
  }
  await page.setViewportSize({
    width: info.project.name === "mobile" ? 390 : 1440,
    height: 1000,
  });
  await composer.screenshot({ path: info.outputPath("formula-composer.png") });
  await composer
    .getByRole("button", { name: "Chèn công thức", exact: true })
    .click();
  await expect(text).toHaveValue("Động năng " + copied);
  await expect(
    modal.getByLabel("Xem trước Nội dung câu hỏi").locator("math msub"),
  ).toHaveCount(1);
  // Reopen at the caret inside an existing formula and replace the full range.
  await text.evaluate((el: HTMLTextAreaElement) =>
    el.setSelectionRange(15, 15),
  );
  await modal
    .getByRole("button", {
      name: "Công thức cho Nội dung câu hỏi",
      exact: true,
    })
    .click();
  await expect(composer.getByLabel("Mã công thức (LaTeX)")).toHaveValue(/W_/);
  await composer
    .getByRole("button", { name: "Đóng bộ soạn", exact: true })
    .click();
  // Clipboard HTML from Word preserves sub/sup without inserting executable HTML.
  const option = modal.getByLabel("Phương án B", { exact: true });
  await option.fill("");
  await option.evaluate((el) => {
    const data = new DataTransfer();
    data.setData("text/plain", "Wđ = mv2/2");
    data.setData(
      "text/html",
      '<p>W<sub>đ</sub> = mv<sup>2</sup>/2<img src=x onerror="alert(1)"></p>',
    );
    el.dispatchEvent(
      new ClipboardEvent("paste", {
        clipboardData: data,
        bubbles: true,
        cancelable: true,
      }),
    );
  });
  await expect(option).toHaveValue("W_{đ} = mv^{2}/2");
  // Real browser copy/paste back into a different field retains the same formula.
  const explanation = modal.getByLabel("Lời giải", { exact: true });
  await explanation.fill("");
  await explanation.focus();
  await page.keyboard.press("Control+V");
  await expect(explanation).toHaveValue(copied);
  await modal
    .getByRole("button", { name: "Lưu phiên bản mới", exact: true })
    .click();
  await expect(modal).toHaveCount(0);
  await page.reload();
  await page.getByLabel("Chọn lớp học").selectOption(fixture.classroom.id);
  await navigateTo(page, { name: "Ngân hàng câu hỏi", exact: true });
  const card = page.locator(".bank-question");
  await expect(card.locator("h3 math msub")).toHaveCount(1);
  await expect(card.locator("sub")).toContainText(["đ"]);
  await expect(card.locator("img")).toHaveCount(0);
  await card.getByRole("button", { name: "Lịch sử sửa", exact: true }).click();
  const history = page.getByRole("dialog");
  await expect(history).toContainText("Động năng Wđ của vật?");
  await expect(history.locator("math mfrac").first()).toBeVisible();
  expect(failures).toEqual([]);
});

test("Word Equation import and direct exam authoring preserve editable formulas", async ({
  page,
}, info) => {
  await prepare(page, "upload " + info.project.name);
  await navigateTo(page, { name: "Ôn tập", exact: true });
  await page.getByRole("button", { name: "Tạo bài ôn", exact: true }).click();
  const modal = page.getByRole("dialog", { name: "Tạo bài ôn", exact: true });
  await modal
    .getByLabel("Tiêu đề bài ôn", { exact: true })
    .fill("Bài ôn công thức");
  const run = (s: string) => `<w:r><w:t>${s}</w:t></w:r>`;
  const math =
    "<m:oMath><m:sSub><m:e><m:r><m:t>W</m:t></m:r></m:e><m:sub><m:r><m:t>đ</m:t></m:r></m:sub></m:sSub><m:r><m:t>=</m:t></m:r><m:f><m:num><m:r><m:t>1</m:t></m:r></m:num><m:den><m:r><m:t>2</m:t></m:r></m:den></m:f></m:oMath>";
  const xml = `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"><w:body><w:p>${run("Câu 1: Động năng ")}${math}</w:p>${["Bài học: Bài công thức", "A. Một", "B. Hai", "C. Ba", "D. Bốn", "Đáp án: A", "Lời giải: Công thức động năng."].map((s) => `<w:p>${run(s)}</w:p>`).join("")}</w:body></w:document>`;
  await modal.getByLabel("File đề (.docx hoặc .csv)").setInputFiles({
    name: "cong-thuc.docx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    buffer: Buffer.from(zipSync({ "word/document.xml": strToU8(xml) })),
  });
  await expect(modal.getByText(/1 câu đã chọn/)).toBeVisible();
  await modal.getByText("Xem và bỏ câu khỏi đề", { exact: true }).click();
  await expect(modal.locator(".learning-row math mfrac")).toHaveCount(1);
  await modal.getByRole("button", { name: "Sửa câu 1", exact: true }).click();
  const editor = modal.locator(".uploaded-question-editor");
  await expect(
    editor.getByLabel("Nội dung câu hỏi", { exact: true }),
  ).toHaveValue(/\\frac/);
  await editor.getByLabel("Lời giải", { exact: true }).fill("W_{đ} = mv^{2}/2");
  await editor
    .getByRole("button", { name: "Lưu câu vào đề", exact: true })
    .click();
  await modal
    .getByRole("button", { name: "Thêm câu trực tiếp", exact: true })
    .click();
  await editor
    .getByLabel("Nội dung câu hỏi", { exact: true })
    .fill("Gia tốc a_{max}?");
  for (const letter of ["A", "B", "C", "D"])
    await editor
      .getByLabel(`Phương án ${letter}`, { exact: true })
      .fill(letter === "A" ? "ω^{2}A" : letter);
  await editor.getByLabel("Lời giải", { exact: true }).fill("a_{max} = ω^{2}A");
  await editor
    .getByRole("button", { name: "Lưu câu vào đề", exact: true })
    .click();
  await expect(modal.getByText(/2 câu đã chọn/)).toBeVisible();
  await modal.getByRole("button", { name: "Lưu bài ôn", exact: true }).click();
  await expect(modal).toHaveCount(0);
  await expect(
    page.getByText("Bài ôn công thức", { exact: true }),
  ).toBeVisible();
});
