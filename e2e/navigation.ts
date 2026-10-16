import type { Page } from "@playwright/test";

// Parent destinations remain in the sidebar/dock; their views live in page tabs.
export async function navigateTo(
  page: Page,
  options: NonNullable<Parameters<Page["getByRole"]>[1]>,
) {
  const navigation = page.getByRole("navigation", { name: "Điều hướng chính" });
  await navigation.waitFor({ state: "visible" });
  const direct = navigation.getByRole("button", options);
  if (await direct.count()) return direct.click();
  const teacher =
    (await navigation
      .getByRole("button", { name: "Ngân hàng câu hỏi", exact: true })
      .count()) > 0;
  const destinations = [
    ["Học sinh", "Quản lý lớp"],
    ["Chương học", "Quản lý lớp"],
    ["Cài đặt chung", "Quản lý lớp"],
    ["Săn thưởng", "Ôn tập"],
    ["Kiểm tra", "Ôn tập"],
    ["Hoạt động nhóm", "Lớp học của tôi"],
    ["Sổ tay sửa sai", "Luyện tập"],
    ["Khu vườn của lớp", "Lớp học của tôi"],
    ["Tiến độ học tập", "Lớp học của tôi"],
    ["Hành trình của tôi", "Khu vườn của tôi"],
    ["Xếp hạng chăm chỉ", "Lớp học của tôi"],
  ];
  const match = destinations.find(([name]) =>
    typeof options.name === "string"
      ? name === options.name
      : options.name instanceof RegExp && options.name.test(name),
  );
  if (!match)
    throw new Error(`Không có mục điều hướng: ${String(options.name)}`);
  await navigation.getByRole("button", { name: match[1], exact: true }).click();
  if (match[0] === "Tiến độ học tập" || match[0] === "Hành trình của tôi")
    return;
  if (
    match[0] === "Xếp hạng chăm chỉ" ||
    (teacher && match[0] === "Khu vườn của lớp")
  ) {
    return;
  }
  await page.getByRole("tab", options).click();
}
