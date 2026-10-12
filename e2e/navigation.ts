import type { Page } from "@playwright/test";

// Open a collapsed sidebar group before following its destination. The portrait
// dock remains flat, so the same helper uses its visible destination directly.
export async function navigateTo(
  page: Page,
  options: NonNullable<Parameters<Page["getByRole"]>[1]>,
) {
  const navigation = page.getByRole("navigation", { name: "Điều hướng chính" });
  const target = navigation.getByRole("button", {
    ...options,
    includeHidden: true,
  });
  if (!(await target.isVisible())) {
    await target
      .locator(
        "xpath=ancestor::*[contains(concat(' ',normalize-space(@class),' '),' nav-group ')]",
      )
      .getByRole("button", { expanded: false })
      .click();
  }
  await target.click();
}
