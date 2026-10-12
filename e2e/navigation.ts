import type { Page } from "@playwright/test";

// Sidebar and portrait dock use the same flat list of destinations.
export async function navigateTo(
  page: Page,
  options: NonNullable<Parameters<Page["getByRole"]>[1]>,
) {
  const navigation = page.getByRole("navigation", { name: "Điều hướng chính" });
  await navigation.getByRole("button", options).click();
}
