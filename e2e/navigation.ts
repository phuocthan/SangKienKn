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
  const destinations = [
    ["Hoạt động nhóm", "Lớp học của tôi"],
    ["Tiến độ học tập", "Lớp học của tôi"],
    ["Hành trình của tôi", "Khu vườn của tôi"],
    ["Xếp hạng chăm chỉ", "Khu vườn của lớp"],
  ];
  const match = destinations.find(([name]) =>
    typeof options.name === "string"
      ? name === options.name
      : options.name instanceof RegExp && options.name.test(name),
  );
  if (!match)
    throw new Error(`Không có mục điều hướng: ${String(options.name)}`);
  await navigation.getByRole("button", { name: match[1], exact: true }).click();
  if (
    match[0] === "Tiến độ học tập" ||
    match[0] === "Xếp hạng chăm chỉ" ||
    match[0] === "Hành trình của tôi"
  )
    return;
  await page.getByRole("tab", options).click();
}
