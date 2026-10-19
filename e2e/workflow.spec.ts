import { navigateTo } from "./navigation";
import { test, expect, type Page } from "@playwright/test";
import { csvHeaders } from "../shared/questions";
import { readFile } from "node:fs/promises";
import { strToU8, zipSync } from "fflate";

test("teacher downloads and imports a real Word template with preview, format switching and validation", async ({
  page,
}, info) => {
  await demoLogin(page, "Giáo viên");
  const stamp = `${info.project.name}-${Date.now()}`;
  const classroomResponse = await page.request.post("/api/classrooms", {
    data: { name: `Lớp Word ${stamp}`, subject: "Vật lý", grade: "10" },
  });
  expect(classroomResponse.ok()).toBeTruthy();
  const classroom = await classroomResponse.json();
  const chapterResponse = await page.request.post(
    `/api/classrooms/${classroom.id}/chapters`,
    { data: { title: `Chương Word ${stamp}` } },
  );
  expect(chapterResponse.ok()).toBeTruthy();
  const chapter = await chapterResponse.json();
  async function storedQuestions() {
    const response = await page.request.get(
      `/api/chapters/${chapter.id}/questions`,
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }
  await page.reload();
  await page.getByLabel("Chọn lớp học").selectOption(classroom.id);
  await navigateTo(page, { name: "Ngân hàng câu hỏi" });
  await page.getByRole("button", { name: "Nhập câu hỏi" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("Định dạng file")).toHaveValue("word");
  const downloadEvent = page.waitForEvent("download");
  await dialog.getByRole("link", { name: "Tải mẫu Word (.docx)" }).click();
  const sample = await downloadEvent;
  expect(sample.suggestedFilename()).toBe("greenedu-cau-hoi-mau.docx");
  const buffer = await readFile((await sample.path())!);
  expect(buffer.subarray(0, 2).toString()).toBe("PK");
  const file = dialog.getByLabel("File câu hỏi Word (.docx)");
  await file.setInputFiles({
    name: "ngan-hang-cu.doc",
    mimeType: "application/msword",
    buffer: Buffer.from("Old Word file"),
  });
  await expect(dialog.getByRole("alert")).toContainText("Save As");
  await file.setInputFiles({
    name: "hong.docx",
    mimeType: "application/octet-stream",
    buffer: Buffer.from("Not a Word file"),
  });
  await expect(dialog.getByRole("alert")).toContainText("không phải Word");
  await expect(
    dialog.getByRole("button", { name: "Xác nhận nhập 0 câu" }),
  ).toBeDisabled();
  const invalidXml = `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Câu 1: Câu hỏi thiếu phương án và lời giải?</w:t></w:r></w:p><w:p><w:r><w:t>Đáp án: A</w:t></w:r></w:p></w:body></w:document>`;
  await file.setInputFiles({
    name: "thieu-noi-dung.docx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    buffer: Buffer.from(zipSync({ "word/document.xml": strToU8(invalidXml) })),
  });
  await expect(dialog.getByRole("alert")).toContainText("Thiếu nội dung");
  expect(await storedQuestions()).toHaveLength(0);
  const validFile = {
    name: sample.suggestedFilename(),
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    buffer,
  };
  await file.setInputFiles(validFile);
  await expect(
    dialog.getByRole("heading", { name: "Xem trước · 4 câu hợp lệ" }),
  ).toBeVisible();
  expect(await storedQuestions()).toHaveLength(0);
  await dialog.locator(".import-preview summary").first().click();
  await expect(dialog.locator(".import-preview details").first()).toContainText(
    "Mét ✓",
  );
  await expect(dialog.locator(".import-preview details").first()).toContainText(
    "Centimét, kilômét",
  );
  await dialog.getByLabel("Định dạng file").selectOption("csv");
  await expect(
    dialog.getByRole("button", { name: "Xác nhận nhập 0 câu" }),
  ).toBeDisabled();
  await expect(dialog.getByLabel("File câu hỏi CSV")).toHaveValue("");
  await dialog.getByLabel("Định dạng file").selectOption("word");
  await expect(file).toHaveValue("");
  await file.setInputFiles(validFile);
  await expect(
    dialog.getByRole("heading", { name: "Xem trước · 4 câu hợp lệ" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: info.outputPath("word-import-preview.png"),
    fullPage: true,
  });
  let legacyWrites = 0;
  const countLegacyWrites = (request: import("@playwright/test").Request) => {
    if (
      request.method() === "POST" &&
      request.url().endsWith("/questions/import")
    )
      legacyWrites++;
  };
  page.on("request", countLegacyWrites);
  await page.route("**/api/health", (route) =>
    route.fulfill({ json: { ok: true, demo: false, questionTypes: false } }),
  );
  await dialog.getByRole("button", { name: "Xác nhận nhập 4 câu" }).click();
  await expect(dialog.getByRole("alert")).toContainText(
    "Máy chủ chưa hỗ trợ câu Đúng/sai",
  );
  expect(legacyWrites).toBe(0);
  expect(await storedQuestions()).toHaveLength(0);
  await page.unroute("**/api/health");
  page.off("request", countLegacyWrites);
  await dialog.getByRole("button", { name: "Xác nhận nhập 4 câu" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator(".bank-question")).toHaveCount(4);
  const questions = await storedQuestions();
  expect(
    questions.map((q: { correctIndex: number }) => q.correctIndex).sort(),
  ).toEqual([-1, -1, 0, 1]);
  expect(
    questions.some((q: { explanation: string }) =>
      q.explanation.includes("\nCentimét, kilômét"),
    ),
  ).toBeTruthy();
  await page.getByRole("button", { name: "Nhập câu hỏi" }).click();
  await file.setInputFiles(validFile);
  await dialog.getByRole("button", { name: "Xác nhận nhập 4 câu" }).click();
  await expect(dialog.getByRole("alert")).toContainText(
    "đã có trong ngân hàng",
  );
  expect(await storedQuestions()).toHaveLength(4);
});

async function demoLogin(page: Page, role: "Học sinh" | "Giáo viên") {
  await page.goto("/");
  await page
    .getByLabel("Email", { exact: true })
    .fill(
      role === "Giáo viên" ? "giaovien@greenedu.nk" : "hocsinh@greenedu.nk",
    );
  await page.getByLabel("Mật khẩu", { exact: true }).fill("GreenEdu123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(
    page.getByRole("navigation", { name: "Điều hướng chính" }),
  ).toBeVisible();
}

test("teacher imports with preview and network retry, edits/hides/restores; student repairs the original revision", async ({
  page,
}, info) => {
  const stamp = `${info.project.name}-${Date.now()}`;
  const className = `Lớp CSV ${stamp}`,
    chapterName = `Chương CSV ${stamp}`,
    email = `csv-${stamp}@example.test`;
  await demoLogin(page, "Giáo viên");
  async function post(path: string, data: unknown) {
    const response = await page.request.post(`/api${path}`, { data });
    expect(response.ok()).toBeTruthy();
    return response.json();
  }
  const classroom = await post("/classrooms", {
    name: className,
    subject: "Toán",
    grade: "10",
  });
  const chapter = await post(`/classrooms/${classroom.id}/chapters`, {
    title: chapterName,
  });
  await post(`/classrooms/${classroom.id}/students`, {
    name: "Học sinh CSV",
    email,
    password: "TempPass123!",
  });
  await page.reload();
  await page
    .getByLabel("Chọn lớp học")
    .selectOption({ label: `${className} · Toán` });
  await navigateTo(page, { name: "Ngân hàng câu hỏi" });
  await page.getByRole("button", { name: "Nhập câu hỏi" }).click();
  await page.getByRole("dialog").getByLabel("Định dạng file").selectOption("csv");
  const dialog = page.getByRole("dialog");
  const download = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Tải file mẫu" }).click();
  expect((await download).suggestedFilename()).toBe("greenedu-cau-hoi-mau.csv");
  const csv =
    csvHeaders.join(",") +
    "\r\nBài CSV,Câu nhập thứ nhất?,1,2,3,4,A,Lời giải phiên bản đầu\r\nBài CSV 2,Câu nhập thứ hai?,A1,B1,C1,D1,B,Lời giải thứ hai\r\n";
  await dialog.getByLabel("File câu hỏi CSV").setInputFiles({
    name: "loi.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(csv + "Bài lỗi,Câu lỗi,1,1,3,4,Z,Lỗi\r\n"),
  });
  await expect(dialog.getByRole("alert")).toContainText("Chưa lưu dữ liệu");
  await expect(
    dialog.getByRole("button", { name: "Xác nhận nhập 2 câu" }),
  ).toBeDisabled();
  expect(
    (
      await (
        await page.request.get(`/api/chapters/${chapter.id}/questions`)
      ).json()
    ).length,
  ).toBe(0);
  await dialog.getByLabel("File câu hỏi CSV").setInputFiles({
    name: "cau-hoi.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(csv),
  });
  await expect(
    dialog.getByRole("heading", { name: "Xem trước · 2 câu hợp lệ" }),
  ).toBeVisible();
  expect(
    (
      await (
        await page.request.get(`/api/chapters/${chapter.id}/questions`)
      ).json()
    ).length,
  ).toBe(0);
  let first = true;
  await page.route(
    `**/api/chapters/${chapter.id}/questions/import`,
    async (route) => {
      if (first) {
        first = false;
        await route.fetch();
        await route.abort("connectionfailed");
      } else await route.continue();
    },
  );
  await dialog.getByRole("button", { name: "Xác nhận nhập 2 câu" }).click();
  await expect(dialog.getByRole("alert")).toBeVisible();
  expect(
    (
      await (
        await page.request.get(`/api/chapters/${chapter.id}/questions`)
      ).json()
    ).length,
  ).toBe(2);
  await dialog.getByRole("button", { name: "Xác nhận nhập 2 câu" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator(".bank-question")).toHaveCount(2);
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  async function studentLogin() {
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Mật khẩu", { exact: true }).fill("OwnPass123!");
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await expect(page.getByRole("navigation")).toBeVisible();
  }
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill("TempPass123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.getByLabel("Mật khẩu hiện tại").fill("TempPass123!");
  await page.getByLabel("Mật khẩu mới", { exact: true }).fill("OwnPass123!");
  await page.getByLabel("Nhập lại mật khẩu mới").fill("OwnPass123!");
  await page.getByRole("button", { name: "Lưu mật khẩu" }).click();
  await navigateTo(page, { name: "Luyện tập", exact: true });
  await page.locator(".chapter-grid").getByRole("button", { name: /^(Luyện tập|Ôn tập lại)$/ }).click();
  await page.getByRole("button", { name: "B 2", exact: true }).click();
  await page.getByRole("button", { name: "Kiểm tra đáp án" }).click();
  await expect(
    page.getByText("Chưa đúng, cùng xem lại kiến thức nhé."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Kết thúc phiên" }).click();
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await demoLogin(page, "Giáo viên");
  await page
    .getByLabel("Chọn lớp học")
    .selectOption({ label: `${className} · Toán` });
  await navigateTo(page, { name: "Ngân hàng câu hỏi" });
  let card = page
    .locator(".bank-question")
    .filter({ hasText: "Câu nhập thứ nhất?" });
  await card.getByRole("button", { name: "Sửa câu hỏi" }).click();
  await dialog
    .getByLabel("Nội dung câu hỏi")
    .fill("Câu đã sửa sang phiên bản mới?");
  await dialog.getByLabel("Đáp án đúng").selectOption("2");
  await dialog.getByLabel("Lời giải").fill("Lời giải phiên bản mới");
  await dialog.getByRole("button", { name: "Lưu phiên bản mới" }).click();
  await expect(dialog).toHaveCount(0);
  card = page
    .locator(".bank-question")
    .filter({ hasText: "Câu đã sửa sang phiên bản mới?" });
  await expect(card).toContainText("Phiên bản 2");
  await card.getByRole("button", { name: "Lịch sử sửa" }).click();
  await expect(dialog.locator(".bank-question")).toHaveCount(2);
  await expect(dialog).toContainText("Lời giải phiên bản đầu");
  await dialog.getByRole("button", { name: "Đóng", exact: true }).click();
  await card.getByRole("button", { name: "Xóa câu hỏi" }).click();
  await dialog.getByRole("button", { name: "Xác nhận xóa 1 câu", exact: true }).click();
  await expect(page.locator(".bank-question")).toHaveCount(1);
  await page.getByLabel("Hiện cả câu đã ẩn").check();
  await expect(card).toContainText("Đã ẩn");
  await card.getByRole("button", { name: "Hiện lại", exact: true }).click();
  await dialog.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(card).toContainText("Đang sử dụng");
  const navigationWidths = await page
    .getByRole("navigation")
    .getByRole("button")
    .evaluateAll((buttons) =>
      buttons.every((button) => {
        const label = button.querySelector("span");
        return (
          !label ||
          label.getBoundingClientRect().width <=
            button.getBoundingClientRect().width
        );
      }),
    );
  expect(navigationWidths).toBeTruthy();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: info.outputPath("question-bank-revision.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await studentLogin();
  await navigateTo(page, { name: /Sổ tay sửa sai/ });
  const old = page
    .locator(".correction-card")
    .filter({ hasText: "Câu nhập thứ nhất?" });
  await expect(old).toBeVisible();
  await old.getByRole("button", { name: "Làm lại" }).click();
  await page.getByRole("button", { name: "A 1", exact: true }).click();
  await page.getByRole("button", { name: "Kiểm tra đáp án" }).click();
  await expect(page.getByText("Bạn đã khắc phục lỗi sai này!")).toBeVisible();
  await page.getByRole("button", { name: "Xem kết quả" }).click();
  await page.getByRole("button", { name: "Về khu vườn" }).click();
  await navigateTo(page, { name: "Luyện tập", exact: true });
  await page
    .getByLabel(`Luyện tập theo bài · ${chapterName}`)
    .selectOption("Bài CSV");
  await page.locator(".chapter-grid").getByRole("button", { name: /^(Luyện tập|Ôn tập lại)$/ }).click();
  await expect(
    page.getByRole("heading", { name: "Câu đã sửa sang phiên bản mới?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "C 3", exact: true }).click();
  await page.getByRole("button", { name: "Kiểm tra đáp án" }).click();
  await expect(
    page.getByText("Chính xác, tiếp tục phát huy nhé!"),
  ).toBeVisible();
});

test("student practices, repairs a wrong answer, and keeps progress after reload", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await demoLogin(page, "Học sinh");
  await expect(
    page.getByRole("heading", { name: "Khu vườn của tôi", level: 1 }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("garden.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await navigateTo(page, { name: "Luyện tập", exact: true });
  await page
    .locator(".chapter-grid")
    .getByRole("button", { name: /^(Luyện tập|Ôn tập lại)$/ })
    .first()
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Đơn vị đo độ dài trong hệ đơn vị SI là gì?",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "B Centimét (cm)" }).click();
  await page.getByRole("button", { name: "Kiểm tra đáp án" }).click();
  await expect(
    page.getByText("Chưa đúng, cùng xem lại kiến thức nhé."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Kết thúc phiên" }).click();
  await navigateTo(page, { name: /Sổ tay sửa sai/ });
  const card = page
    .locator(".correction-card")
    .filter({ hasText: "Đơn vị đo độ dài trong hệ đơn vị SI là gì?" });
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Làm lại" }).click();
  await page.getByRole("button", { name: "A Mét (m)" }).click();
  await page.getByRole("button", { name: "Kiểm tra đáp án" }).click();
  await expect(page.getByText("Bạn đã khắc phục lỗi sai này!")).toBeVisible();
  await page.getByRole("button", { name: "Xem kết quả" }).click();
  await expect(
    page.getByRole("heading", { name: "Bạn đã chăm cây hôm nay!" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Về khu vườn" }).click();
  await page.reload();
  await navigateTo(page, { name: /Sổ tay sửa sai/ });
  await expect(
    page
      .locator(".correction-card")
      .filter({ hasText: "Đơn vị đo độ dài trong hệ đơn vị SI là gì?" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Sổ tay đang sạch những lỗi sai" }),
  ).toBeVisible();
  await navigateTo(page, { name: "Khu vườn của lớp", exact: true });
  await expect(
    page.locator('.garden-student[data-student-id="student-demo"]'),
  ).toHaveCount(1);
  await expect(page.locator(".garden-honoree")).toHaveCount(0);
  await navigateTo(page, { name: "Xếp hạng chăm chỉ", exact: true });
  const honoree = page
    .locator(".honors-podium-place, .honors-list > li")
    .filter({ hasText: "Trần Hà Linh" });
  await expect(honoree).toBeVisible();
  await expect(honoree.locator("dd").last()).toHaveText("1");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: info.outputPath("class-leaderboard.png"),
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("community shares top ten and honors earned students once with the legacy garden API", async ({
  page,
}, info) => {
  // Presentation fixtures are intercepted only in this browser; persisted demo data is unchanged.
  const own = {
    id: "student-demo",
    name: "Trần Hà Linh",
    seconds: 36000,
    bloomedTrees: 2,
    resolvedCorrections: 2,
    rank: 1,
  };
  const other = {
    id: "student-2",
    name: "Lê Minh Khôi",
    seconds: 36000,
    bloomedTrees: 2,
    resolvedCorrections: 2,
    rank: 1,
  };
  const third = {
    id: "student-3",
    name: "Phạm Bảo Ngân",
    seconds: 120,
    bloomedTrees: 0,
    resolvedCorrections: 0,
    rank: 3,
  };
  const trees = [own, other].flatMap((member) =>
    ["chapter-1", "chapter-2"].map((chapterId) => ({
      studentId: member.id,
      studentName: member.name,
      chapterId,
      chapterTitle:
        chapterId === "chapter-1"
          ? "Chương 1 · Mở đầu"
          : "Chương 2 · Động học và các chuyển động trong cuộc sống",
    })),
  );
  await page.route("**/api/classrooms/class-demo/garden", (route) =>
    route.fulfill({ json: { trees } }),
  );
  await page.route("**/api/classrooms/class-demo/leaderboard", (route) =>
    route.fulfill({
      json: {
        participantCount: 3,
        activeStudents: 3,
        totalSeconds: 72120,
        bloomedTrees: 4,
        effort: [own, other, third],
        repairs: [own, other],
      },
    }),
  );
  await page.route("**/api/classrooms/class-demo/honors", (route) =>
    route.fulfill({
      json: [own, other, third].map((member) => ({
        id: member.id,
        name: member.name,
        avatarId: null,
        chapterLevels: [{ level: member.id === third.id ? 1 : 5 }],
        answeredQuestions: member.id === third.id ? 1 : 50,
        correct: 5,
        total: 10,
      })),
    }),
  );
  await demoLogin(page, "Học sinh");
  await navigateTo(page, { name: "Khu vườn của lớp", exact: true });
  await expect(
    page
      .locator(".garden-honors")
      .getByRole("img", { name: "Cấp 5 · Kết Trái" }),
  ).toHaveCount(2);
  await expect(page.locator(".garden-honoree.is-mine")).toHaveCount(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: info.outputPath("class-garden-earned.png"),
    fullPage: true,
  });
  await page.bringToFront();
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(
    page
      .locator(".garden-honors")
      .getByRole("img", { name: "Cấp 5 · Kết Trái" }),
  ).toHaveCount(2);
  await navigateTo(page, { name: "Xếp hạng chăm chỉ", exact: true });
  const podium = page.locator(".honors-podium-place");
  await expect(podium).toHaveCount(3);
  await expect(podium.nth(0)).toContainText(own.name);
  await expect(podium.nth(1)).toContainText(other.name);
  await expect(podium.nth(2)).toContainText(third.name);
  await expect(page.locator(".community-ranking")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
});

test("teacher creates content and student account; student changes password, learns, teacher sees result", async ({
  page,
}, info) => {
  const stamp = `${info.project.name}-${Date.now()}`;
  const className = `Lớp thử ${stamp}`;
  const studentEmail = `student-${stamp}@example.test`;
  const studentName = "Học sinh thử nghiệm";
  await demoLogin(page, "Giáo viên");
  await navigateTo(page, { name: "Lớp học của tôi" });
  await page.getByRole("button", { name: "Tạo lớp mới" }).click();
  await page.getByLabel("Tên lớp", { exact: true }).fill(className);
  await page.getByLabel("Môn học", { exact: true }).fill("Toán");
  await page.getByLabel("Khối lớp", { exact: true }).fill("10");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Lưu", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await navigateTo(page, { name: "Chương học", exact: true });
  await page.getByRole("button", { name: "Thêm chương", exact: true }).click();
  await page.getByLabel("Tên chương").fill("Chương 1 · Đại số");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Lưu", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await navigateTo(page, { name: "Ngân hàng câu hỏi" });
  await page.getByRole("button", { name: "Thêm câu hỏi" }).click();
  await page
    .getByLabel("Nội dung câu hỏi")
    .fill("Một cộng một bằng bao nhiêu?");
  await page.getByLabel("Bài học", { exact: true }).fill("Bài 1 · Phép cộng");
  for (const [i, letter] of ["A", "B", "C", "D"].entries())
    await page
      .getByLabel(`Phương án ${letter}`, { exact: true })
      .fill(String(i + 1));
  await page.getByLabel("Đáp án đúng").selectOption("1");
  await page.getByLabel("Lời giải").fill("Một cộng một bằng hai.");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Lưu", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Một cộng một bằng bao nhiêu?" }),
  ).toBeVisible();
  await navigateTo(page, { name: "Quản lý lớp", exact: true });
  await page
    .getByRole("button", { name: "Thêm học sinh", exact: true })
    .click();
  await page.getByLabel("Họ tên", { exact: true }).fill(studentName);
  await page
    .getByRole("dialog")
    .getByLabel("Email", { exact: true })
    .fill(studentEmail);
  await page.getByLabel("Mật khẩu tạm", { exact: true }).fill("TempPass123!");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Lưu", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await page.getByLabel("Email", { exact: true }).fill(studentEmail);
  await page.getByLabel("Mật khẩu", { exact: true }).fill("TempPass123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Đổi mật khẩu tạm" }),
  ).toBeVisible();
  await page.getByLabel("Mật khẩu hiện tại").fill("TempPass123!");
  await page.getByLabel("Mật khẩu mới", { exact: true }).fill("OwnPass123!");
  await page.getByLabel("Nhập lại mật khẩu mới").fill("OwnPass123!");
  await page.getByRole("button", { name: "Lưu mật khẩu" }).click();
  await navigateTo(page, { name: "Luyện tập", exact: true });
  await page
    .getByLabel("Luyện tập theo bài · Chương 1 · Đại số")
    .selectOption("Bài 1 · Phép cộng");
  await page.locator(".chapter-grid").getByRole("button", { name: /^(Luyện tập|Ôn tập lại)$/ }).click();
  await page.getByRole("button", { name: "B 2", exact: true }).click();
  await page.getByRole("button", { name: "Kiểm tra đáp án" }).click();
  await expect(
    page.getByText("Chính xác, tiếp tục phát huy nhé!"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Xem kết quả" }).click();
  await page.getByRole("button", { name: "Về khu vườn" }).click();
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await demoLogin(page, "Giáo viên");
  await page
    .getByLabel("Chọn lớp học")
    .selectOption({ label: `${className} · Toán` });
  await navigateTo(page, { name: "Quản lý lớp", exact: true });
  const row = page
    .locator(".roster-card")
    .getByRole("row")
    .filter({ hasText: studentName });
  await expect(row).toContainText("100%");
  await expect(row.getByRole("cell").nth(2)).toHaveText("1");
  await page.screenshot({
    path: info.outputPath("teacher-progress.png"),
    fullPage: true,
  });
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Xuất CSV" }).click();
  expect((await downloaded).suggestedFilename()).toBe("greenedu-tien-do.csv");
  await navigateTo(page, { name: "Khu vườn của lớp", exact: true });
  await expect(page.locator(".garden-student")).toHaveCount(1);
  await expect(page.locator(".garden-student")).toHaveAttribute(
    "title",
    studentName,
  );
  await expect(page.locator(".garden-honoree")).toHaveCount(0);
  await navigateTo(page, { name: "Xếp hạng chăm chỉ", exact: true });
  await expect(
    page.getByRole("region", { name: "Vinh danh Top 10" }),
  ).toBeVisible();
  await expect(page.locator(".honors-podium-place dd").last()).toHaveText("0");
  await page
    .getByLabel("Chọn lớp học")
    .selectOption({ label: "Lớp 10A1 · Vật lý" });
  const selectedClass = await page.getByLabel("Chọn lớp học").inputValue();
  const gardenResponse = await page.request.get(
    `/api/classrooms/${selectedClass}/garden`,
  );
  expect(gardenResponse.ok()).toBeTruthy();
  const garden = await gardenResponse.json();
  await expect(page.locator(".garden-student")).toHaveCount(
    garden.members.length,
  );
  await expect(page.locator(".student-garden")).not.toContainText(studentName);
});
