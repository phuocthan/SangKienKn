import { expect, test } from "@playwright/test";

test("student management sorts numbered names numerically and keeps search order", async ({
  page,
}) => {
  const login = await page.request.post("/api/auth/login", {
    data: { email: "giaovien@greenedu.nk", password: "GreenEdu123!" },
  });
  expect(login.ok()).toBeTruthy();

  await page.route("**/api/classrooms/class-demo/students", async (route) => {
    const response = await route.fetch();
    const students = await response.json();
    const template = students[0];
    const names = ["10 An", "2 An", "1 An", "12 An", "3 An"];
    await route.fulfill({
      response,
      json: names.map((name, index) => ({
        ...template,
        id: `roster-test-${index}`,
        name,
        email: `student-${index}@greenedu.nk`,
      })),
    });
  });

  await page.goto("/#section=class-settings&classroom=class-demo");
  const names = page.locator(
    'table[aria-label="Danh sách học sinh"] tbody .student-cell strong',
  );
  await expect(names).toHaveText(["1 An", "2 An", "3 An", "10 An", "12 An"]);
  await page.getByRole("searchbox", { name: "Tìm học sinh" }).fill("An");
  await expect(names).toHaveText(["1 An", "2 An", "3 An", "10 An", "12 An"]);
});
