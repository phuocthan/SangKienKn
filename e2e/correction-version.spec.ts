import { test, expect } from "@playwright/test";
import { navigateTo } from "./navigation";

test("student retries -346 using the corrected key while the original wrong attempt stays in history", async ({
  page,
}, info) => {
  const teacher = { email: "giaovien@greenedu.nk", password: "GreenEdu123!" };
  const student = {
    email: "learning@greenedu.test",
    password: "LearningTest123!",
  };
  const post = async (path: string, data: unknown) => {
    const r = await page.request.post("/api" + path, { data });
    expect(r.ok(), await r.text()).toBe(true);
    return r.json();
  };
  await post("/auth/login", teacher);
  const classroom = await post("/classrooms", {
    name: "Sửa gia tốc " + info.project.name + Date.now(),
    subject: "Vật lý",
    sourceClassroomId: "learning-class",
  });
  const chapter = await post(`/classrooms/${classroom.id}/chapters`, {
    title: "Dao động",
  });
  const content = {
    kind: "short-answer",
    lesson: "Bài luyện tập chung",
    text: "Một vật có vận tốc v = 20π cos(2πt - π/3) cm/s. Tính gia tốc tại t = 0,5 s, lấy π² = 10.",
    choices: [],
    correctAnswer: "-200",
    explanation: "Lời giải ban đầu.",
  };
  const q = await post(`/chapters/${chapter.id}/questions`, content);
  await post("/auth/login", student);
  const first = {
    questionId: q.id,
    selected: "-346",
    mode: "practice",
    requestId: crypto.randomUUID(),
  };
  expect((await post("/attempts", first)).correct).toBe(false);
  await post("/auth/login", teacher);
  await post(`/questions/${q.id}/notebook-edit`, {
    ...content,
    text: content.text + " Làm tròn đến hàng đơn vị.",
    correctAnswer: "-346",
    explanation: "a = -200√3 ≈ -346 cm/s².",
    expectedId: q.id,
  });
  await post("/auth/login", student);
  await page.goto("/");
  await page.getByLabel("Chọn lớp học").selectOption(classroom.id);
  await navigateTo(page, { name: /Sổ tay sửa sai/ });
  const card = page
    .locator(".correction-card")
    .filter({ hasText: "Làm tròn đến hàng đơn vị" });
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Làm lại", exact: true }).click();
  await expect(page.locator(".question-card")).toContainText(
    "Làm tròn đến hàng đơn vị",
  );
  await page
    .getByRole("textbox", { name: "Câu trả lời ngắn", exact: true })
    .fill("-346");
  await page
    .getByRole("button", { name: "Kiểm tra đáp án", exact: true })
    .click();
  await expect(
    page.getByText("Bạn đã khắc phục lỗi sai này!", { exact: true }),
  ).toBeVisible();
  await page
    .locator(".practice-layout")
    .screenshot({ path: info.outputPath("corrected-acceleration.png") });
  expect((await post("/attempts", first)).correct).toBe(false);
  await post("/auth/login", teacher);
  const rows = await (
    await page.request.get(
      `/api/classrooms/${classroom.id}/students/learning-student/notebook`,
    )
  ).json();
  const item = rows.find((row: any) => row.id === q.id);
  expect(item.resolved).toBe(true);
  expect(item.correctAnswer).toBe("-200");
  expect(item.sourceQuestion.correctAnswer).toBe("-346");
  expect(item.wrongAnswers.map((a: any) => a.selected)).toContain("-346");
});
