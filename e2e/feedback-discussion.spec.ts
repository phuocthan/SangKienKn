import { navigateTo } from "./navigation";
import { test, expect, type Page } from "@playwright/test";
import type { GroupActivity } from "../shared/group-activities";
async function login(page: Page, email: string, classroomId = "class-demo") {
  await page.goto("/");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill("GreenEdu123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByRole("navigation")).toBeVisible();
  await page.getByLabel("Chọn lớp học").selectOption(classroomId);
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
}
test("private student feedback reaches the teacher, who replies, resolves and reopens it", async ({
  page,
  browser,
}, info) => {
  await login(page, "hocsinh@greenedu.nk");
  const footer = page.locator(".sidebar-bottom");
  const labels = await footer
    .locator(":scope > button.nav-item")
    .allTextContents();
  expect(labels[0]).toContain("Góp ý");
  expect(labels[1]).toContain("Tài khoản");
  await page.getByRole("button", { name: "Góp ý", exact: true }).click();
  await page.getByRole("button", { name: "Viết góp ý", exact: true }).click();
  const dialog = page.getByRole("dialog");
  const title = `Thêm giờ trao đổi · ${info.project.name}`;
  await dialog.getByLabel("Tiêu đề", { exact: true }).fill(title);
  await dialog
    .getByLabel("Nội dung góp ý")
    .fill("Em muốn thêm thời gian hỏi bài sau buổi học. <b>Ý kiến của em</b>");
  await dialog.getByRole("button", { name: "Gửi góp ý", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator(".feedback-detail")).toContainText(title);
  await expect(page.locator(".conversation-message b")).toHaveCount(0);
  await noOverflow(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: info.outputPath("student-feedback.png"),
    fullPage: true,
  });
  const context = await browser.newContext({ viewport: page.viewportSize()! });
  const teacher = await context.newPage();
  try {
    await login(teacher, "giaovien@greenedu.nk");
    await teacher
      .getByRole("button", { name: "Quản lý góp ý", exact: true })
      .click();
    await teacher.locator(".feedback-item").filter({ hasText: title }).click();
    await teacher
      .getByLabel("Nội dung phản hồi")
      .fill("Cô sẽ dành thêm 10 phút để các em hỏi bài.");
    await teacher
      .getByRole("button", { name: "Gửi phản hồi", exact: true })
      .click();
    await expect(teacher.locator(".feedback-detail .pill")).toHaveText(
      "Đã phản hồi",
    );
    await page.bringToFront();
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(page.locator(".feedback-detail")).toContainText(
      "Cô sẽ dành thêm 10 phút",
    );
    await teacher.getByRole("button", { name: "Đánh dấu đã xử lý" }).click();
    await expect(
      teacher.getByRole("button", { name: "Mở lại", exact: true }),
    ).toBeVisible();
    await page.bringToFront();
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(page.locator(".feedback-detail .pill")).toHaveText("Đã xử lý");
    await expect(
      page.getByRole("button", { name: "Gửi phản hồi", exact: true }),
    ).toHaveCount(0);
    await noOverflow(teacher);
    await teacher.evaluate(() => window.scrollTo(0, 0));
    await teacher.screenshot({
      path: info.outputPath("teacher-feedback.png"),
      fullPage: true,
    });
    await teacher.getByRole("button", { name: "Mở lại", exact: true }).click();
    await page.reload();
    await page.getByRole("button", { name: "Góp ý", exact: true }).click();
    await page.locator(".feedback-item").filter({ hasText: title }).click();
    await expect(page.getByLabel("Nội dung phản hồi")).toBeVisible();
    await teacher
      .getByRole("combobox", { name: "Trạng thái", exact: true })
      .selectOption("replied");
    await expect(
      teacher.locator(".feedback-item").filter({ hasText: title }),
    ).toHaveCount(0);
  } finally {
    await context.close();
  }
});

test("students read other groups after the extended deadline and the responsible group rebuts their question", async ({
  page,
  browser,
}, info) => {
  await login(page, "giaovien@greenedu.nk");
  // Earlier suites may add students to class-demo. Give this random-group case
  // its own classroom with the three known accounts, without resetting them.
  const created = await page.request.post("/api/classrooms", {
    data: {
      name: `Lớp phản biện ${info.project.name} ${crypto.randomUUID().slice(0, 8)}`,
      subject: "Vật lý",
      grade: "10",
    },
  });
  expect(created.ok()).toBe(true);
  const classroomId = (await created.json()).id as string;
  for (const email of [
    "hocsinh@greenedu.nk",
    "minhkhoi@greenedu.nk",
    "baongan@greenedu.nk",
  ]) {
    const enrolled = await page.request.post(
      `/api/classrooms/${classroomId}/memberships`,
      { data: { email } },
    );
    expect(enrolled.ok()).toBe(true);
  }
  const list = await (
    await page.request.get(`/api/classrooms/${classroomId}/group-activities`)
  ).json();
  const initial = list.serverNow,
    deadline = initial + 10000,
    extended = initial + 15000;
  const title = `Hoạt động phản biện · ${info.project.name}`;
  const response = await page.request.post(
    `/api/classrooms/${classroomId}/group-activities`,
    {
      data: {
        title,
        instructions: "Thực hiện mô hình và trao đổi cách đo.",
        groupCount: 2,
        deadlineAt: deadline,
        requestId: crypto.randomUUID(),
      },
    },
  );
  expect(response.ok()).toBeTruthy();
  const activity = (await response.json()) as GroupActivity;
  const target = activity.groups[0],
    other = activity.groups[1];
  const email: Record<string, string> = {
    "student-demo": "hocsinh@greenedu.nk",
    "student-2": "minhkhoi@greenedu.nk",
    "student-3": "baongan@greenedu.nk",
  };
  const ownerContext = await browser.newContext({
      viewport: page.viewportSize()!,
    }),
    peerContext = await browser.newContext({ viewport: page.viewportSize()! });
  const owner = await ownerContext.newPage(),
    peer = await peerContext.newPage();
  try {
    await login(owner, email[target.representativeId], classroomId);
    await login(peer, email[other.representativeId], classroomId);
    const submit = await owner.request.post(
      `/api/group-activities/${activity.id}/submissions`,
      {
        data: {
          link: "https://example.com/product",
          note: "Sản phẩm có đo ba lần.",
          requestId: crypto.randomUUID(),
        },
      },
    );
    expect(submit.ok()).toBeTruthy();
    await navigateTo(peer, { name: "Hoạt động nhóm", exact: true });
    await peer
      .locator(".group-activity-card")
      .filter({ hasText: title })
      .click();
    await expect(peer.locator(".group-roster")).toHaveCount(1);
    await expect(
      peer.getByRole("button", { name: "Trao đổi & phản biện" }),
    ).toHaveCount(0);
    const extension = await page.request.post(
      `/api/group-activities/${activity.id}/deadline`,
      {
        data: {
          expectedDeadlineAt: deadline,
          deadlineAt: extended,
          reason: "Cho nhóm hoàn thiện",
        },
      },
    );
    expect(extension.ok()).toBeTruthy();
    // Real server clock; the production server has no test clock endpoint.
    await expect
      .poll(
        async () =>
          (
            await (
              await page.request.get(
                `/api/classrooms/${classroomId}/group-activities`,
              )
            ).json()
          ).serverNow,
        { timeout: 20000 },
      )
      .toBeGreaterThanOrEqual(extended);
    await peer.bringToFront();
    await peer.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(peer.locator(".group-roster")).toHaveCount(2);
    await peer.getByRole("tab", { name: "Trao đổi", exact: true }).click();
    const card = peer.locator(".group-discussion-card").filter({
      has: peer.getByRole("heading", {
        name: `Nhóm ${target.number}`,
        exact: true,
      }),
    });
    await expect(card).toContainText("Sản phẩm có đo ba lần.");
    await card.getByRole("button", { name: "Trao đổi & phản biện" }).click();
    const peerDialog = peer.getByRole("dialog");
    await peerDialog
      .getByLabel("Nội dung trao đổi")
      .fill("Vì sao nhóm đo ba lần?");
    await peerDialog
      .getByRole("button", { name: "Gửi trao đổi", exact: true })
      .click();
    await expect(peerDialog.locator(".discussion-thread")).toContainText(
      "Vì sao nhóm đo ba lần?",
    );
    await expect(
      peerDialog.getByRole("button", { name: "Gửi phản biện" }),
    ).toHaveCount(0);
    await navigateTo(owner, { name: "Hoạt động nhóm", exact: true });
    await owner
      .locator(".group-activity-card")
      .filter({ hasText: title })
      .click();
    await owner.getByRole("tab", { name: "Trao đổi", exact: true }).click();
    const ownerCard = owner
      .locator(".group-discussion-card")
      .filter({ hasText: "Nhóm của bạn" });
    await ownerCard
      .getByRole("button", { name: "Trao đổi & phản biện" })
      .click();
    const ownerDialog = owner.getByRole("dialog");
    await ownerDialog
      .getByRole("textbox")
      .fill("Đo ba lần giúp giảm sai số ngẫu nhiên.");
    await ownerDialog
      .getByRole("button", { name: "Gửi phản biện", exact: true })
      .click();
    await expect(ownerDialog.locator(".discussion-replies")).toContainText(
      "giảm sai số ngẫu nhiên",
    );
    await peer.bringToFront();
    await peer.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(peerDialog.locator(".discussion-replies")).toContainText(
      "giảm sai số ngẫu nhiên",
    );
    await noOverflow(peer);
    await noOverflow(owner);
    await owner.screenshot({
      path: info.outputPath("group-rebuttal.png"),
      fullPage: false,
    });
    await ownerDialog
      .getByRole("button", { name: "Đóng", exact: true })
      .click();
    await owner.evaluate(() => window.scrollTo(0, 0));
    await owner.screenshot({
      path: info.outputPath("peer-products.png"),
      fullPage: true,
    });
  } finally {
    await ownerContext.close();
    await peerContext.close();
  }
});

test("old Railway API clearly disables sending feedback without issuing a write", async ({
  page,
}) => {
  let writes = 0;
  await page.route("**/api/classrooms/class-demo/feedback", async (route) => {
    if (route.request().method() === "POST") writes++;
    await route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ error: "Không tìm thấy chức năng." }),
    });
  });
  await login(page, "hocsinh@greenedu.nk");
  await page.getByRole("button", { name: "Góp ý", exact: true }).click();
  await expect(
    page.getByText("Chức năng Góp ý đang chờ cập nhật server Railway."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Viết góp ý", exact: true }),
  ).toBeDisabled();
  expect(writes).toBe(0);
  await noOverflow(page);
});
