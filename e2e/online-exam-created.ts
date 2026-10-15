import { expect, type Page } from "@playwright/test";

export const onlineExamCreatedMessage =
  "Đã lưu bài kiểm tra. Bạn có thể bắt đầu ngay hoặc để sau.";

export async function acknowledgeOnlineExamCreated(page: Page) {
  const popup = page.getByRole("dialog", {
    name: "Đã tạo bài kiểm tra",
    exact: true,
  });
  await expect(popup).toContainText(onlineExamCreatedMessage);
  await popup.getByRole("button", { name: "Để sau", exact: true }).click();
  await expect(popup).toHaveCount(0);
}
