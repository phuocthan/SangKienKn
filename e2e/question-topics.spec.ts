import { test, expect } from "@playwright/test";

test("teacher imports the 50-question Word with topics and student gets a balanced sequence", async ({
  page,
}, info) => {
  const login = await page.request.post("/api/auth/login", {
    data: { email: "giaovien@greenedu.nk", password: "GreenEdu123!" },
  });
  expect(login.ok()).toBeTruthy();
  const classroom = await (
    await page.request.post("/api/classrooms", {
      data: {
        name: `Topics ${info.project.name} ${Date.now()}`,
        subject: "Vật lý",
        grade: "11",
      },
    })
  ).json();
  const chapter = await (
    await page.request.post(`/api/classrooms/${classroom.id}/chapters`, {
      data: { title: "Chương I Dao động" },
    })
  ).json();
  expect(
    (
      await page.request.post(`/api/classrooms/${classroom.id}/memberships`, {
        data: { email: "hocsinh@greenedu.nk" },
      })
    ).ok(),
  ).toBeTruthy();
  const lessonTitle = "Bài 1 - Dao động điều hòa";
  expect(
    (
      await page.request.post(`/api/chapters/${chapter.id}/lessons`, {
        data: { title: lessonTitle },
      })
    ).ok(),
  ).toBeTruthy();
  await page.goto("/");
  await page.getByLabel("Chọn lớp học").selectOption(classroom.id);
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Ngân hàng câu hỏi" })
    .click();
  await page.getByRole("button", { name: "Nhập file Word" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Bài nhận câu hỏi").selectOption(lessonTitle);
  await dialog
    .getByLabel("File câu hỏi Word (.docx)")
    .setInputFiles(
      "artifacts/question-banks/vat-li-11-chuong-1-bai-1-50-cau.docx",
    );
  await expect(
    dialog.getByRole("heading", { name: "Xem trước · 50 câu hợp lệ" }),
  ).toBeVisible();
  await expect(dialog.locator(".import-preview details")).toHaveCount(50);
  await dialog.locator(".import-preview summary").first().click();
  await expect(
    dialog
      .getByText("Chủ đề: DD11-B1-01 Nhận biết dao động cơ", { exact: true })
      .first(),
  ).toBeVisible();
  await expect(dialog.getByRole("alert")).toHaveCount(0);
  await page.screenshot({
    path: info.outputPath("topic-word-preview.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await dialog.getByRole("button", { name: "Xác nhận nhập 50 câu" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator(".bank-question")).toHaveCount(50);
  const bank = await (
    await page.request.get(`/api/chapters/${chapter.id}/questions`)
  ).json();
  expect(bank.every((q: { topic?: string }) => !!q.topic)).toBeTruthy();
  expect(
    bank.every((q: { lesson: string }) => q.lesson === lessonTitle),
  ).toBeTruthy();
  const classes = await (await page.request.get("/api/classrooms")).json();
  expect(
    classes.find((c: { id: string }) => c.id === classroom.id).chapters[0]
      .lessons,
  ).toEqual([{ title: lessonTitle, questionCount: 50 }]);
  await page.request.post("/api/auth/logout", { data: {} });
  expect(
    (
      await page.request.post("/api/auth/login", {
        data: { email: "hocsinh@greenedu.nk", password: "GreenEdu123!" },
      })
    ).ok(),
  ).toBeTruthy();
  const practice = await (
    await page.request.get(`/api/chapters/${chapter.id}/questions`)
  ).json();
  expect(
    new Set(practice.slice(0, 10).map((q: { topic: string }) => q.topic)).size,
  ).toBe(10);
  expect(
    practice.every(
      (q: object) => !("explanation" in q) && !("correctIndex" in q),
    ),
  ).toBeTruthy();
});

test("older API cannot silently discard topic labels while importing Word", async ({
  page,
}) => {
  await page.request.post("/api/auth/login", {
    data: { email: "giaovien@greenedu.nk", password: "GreenEdu123!" },
  });
  await page.route("**/api/classrooms", async (route) => {
    const response = await route.fetch();
    const classes = await response.json();
    for (const c of classes)
      for (const ch of c.chapters) delete ch.canTagQuestions;
    await route.fulfill({ response, json: classes });
  });
  await page.goto("/");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Ngân hàng câu hỏi" })
    .click();
  await page.getByRole("button", { name: "Nhập file Word" }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("File câu hỏi Word (.docx)")
    .setInputFiles(
      "artifacts/question-banks/vat-li-11-chuong-1-bai-1-50-cau.docx",
    );
  await expect(
    dialog.getByRole("heading", { name: "Xem trước · 50 câu hợp lệ" }),
  ).toBeVisible();
  await expect(dialog.getByRole("alert")).toContainText("chưa hỗ trợ chủ đề");
  await expect(
    dialog.getByRole("button", { name: "Xác nhận nhập 50 câu" }),
  ).toBeDisabled();
});
