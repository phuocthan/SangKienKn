import { test, expect } from "@playwright/test";

test("archiving every chapter keeps the named review history visible without opening an invalid study screen", async ({
  page,
}, info) => {
  async function login(teacher: boolean) {
    expect(
      (
        await page.request.post("/api/auth/login", {
          data: {
            email: teacher ? "giaovien@greenedu.nk" : "hocsinh@greenedu.nk",
            password: "GreenEdu123!",
          },
        })
      ).ok(),
    ).toBe(true);
  }
  async function post(path: string, data: unknown) {
    const response = await page.request.post(`/api${path}`, { data });
    expect(response.ok()).toBe(true);
    return response.json();
  }
  await login(true);
  const c = await post("/classrooms", {
    name: `Ôn lưu trữ ${info.project.name} ${Date.now()}`,
    subject: "Vật lý",
    grade: "11",
  });
  await post(`/classrooms/${c.id}/memberships`, {
    email: "hocsinh@greenedu.nk",
  });
  const chapter = await post(`/classrooms/${c.id}/chapters`, {
    title: "Chương sẽ lưu trữ",
  });
  const paper = await post(`/classrooms/${c.id}/review-papers`, {
    title: "Bài ôn được giữ lịch sử",
    requestId: crypto.randomUUID(),
    chapterIds: [chapter.id],
    questions: [
      {
        chapterId: chapter.id,
        question: {
          text: "Câu lịch sử",
          lesson: "Bài lịch sử",
          choices: ["A", "B", "C", "D"],
          correctIndex: 0,
          explanation: "Chọn A.",
        },
      },
    ],
  });
  await login(false);
  await post(`/classrooms/${c.id}/reviews`, {
    blueprintId: paper.id,
    requestId: crypto.randomUUID(),
  });
  await login(true);
  await post(`/chapters/${chapter.id}/delete`, { confirm: true });
  await login(false);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`/#section=learning&classroom=${c.id}`);
  await expect(
    page.getByRole("heading", { name: "Ôn tập", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Tiếp tục ôn", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByText("Lớp chưa có chương đang dùng để tiếp tục ôn.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator(".review-paper")).toContainText(
    "Bài ôn được giữ lịch sử",
  );
  await expect(
    page
      .locator(".review-paper")
      .getByRole("button", { name: "Bắt đầu ôn", exact: true }),
  ).toBeDisabled();
  expect(errors).toEqual([]);
});
