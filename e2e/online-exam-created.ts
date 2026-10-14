import { expect, type Page } from "@playwright/test";

export const onlineExamCreatedMessage =
  "Bạn đã tạo bài kiểm tra thành công và lưu vào danh sách. Có thể bắt đầu bất cứ lúc nào ở trong danh sách.";

export async function acknowledgeOnlineExamCreated(page: Page) {
  const popup = page.getByRole("dialog", {
    name: "Đã tạo bài kiểm tra",
    exact: true,
  });
  await expect(popup).toContainText(onlineExamCreatedMessage);
  await popup.getByRole("button", { name: "Đã hiểu", exact: true }).click();
  await expect(popup).toHaveCount(0);
}
