import { test, expect } from "@playwright/test";
import { navigateTo } from "./navigation";

for (const role of ["teacher", "student"] as const) {
  test(`${role} rotates forest notes every ten seconds and can pause to read`, async ({
    page,
  }, info) => {
    await page.clock.install({ time: new Date("2026-10-12T01:00:00Z") });
    await page.clock.pauseAt(new Date("2026-10-12T01:01:00Z"));
    await page.request.post("/api/auth/login", {
      data:
        role === "teacher"
          ? { email: "giaovien@greenedu.nk", password: "GreenEdu123!" }
          : { email: "levels@greenedu.test", password: "LevelsTest123!" },
    });
    await page.goto("/");
    await page.setViewportSize({ width: 1440, height: 1000 });
    const note = page.getByLabel("Lời nhắn khu rừng tri thức");
    await expect(note).toBeVisible();
    await page.mouse.move(1200, 50);
    await expect(note.locator("strong")).toHaveText("Mỗi ngày, một chút xanh");
    await expect(note.locator("p")).toContainText(
      role === "teacher" ? "Cùng học sinh" : "Không cần đi thật nhanh",
    );
    const height = (await note.boundingBox())!.height;
    await page.clock.runFor(9_000);
    await expect(note.locator("strong")).toHaveText("Mỗi ngày, một chút xanh");
    await page.clock.runFor(1_000);
    await expect(note.locator("strong")).toHaveText("Mở sách, mở một khu rừng");
    await expect(note.locator(".sidebar-note-art")).toHaveAttribute(
      "data-art",
      "owl",
    );
    await note.hover();
    await page.clock.runFor(20_000);
    await expect(note.locator("strong")).toHaveText("Mở sách, mở một khu rừng");
    const pause = note.getByRole("button", { name: "Tạm dừng lời nhắn" });
    await pause.click();
    await expect(pause).toHaveAttribute("aria-pressed", "true");
    await page.mouse.move(1200, 50);
    await navigateTo(page, { name: "Xếp hạng chăm chỉ", exact: true });
    await page.clock.runFor(20_000);
    await expect(note.locator("strong")).toHaveText("Mở sách, mở một khu rừng");
    await pause.click();
    await expect(pause).toHaveAttribute("aria-pressed", "false");
    await page.mouse.move(1200, 50);
    await navigateTo(page, {
      name: role === "teacher" ? "Tổng quan" : "Khu vườn của tôi",
      exact: true,
    });
    await page.clock.runFor(10_000);
    await expect(note.locator("strong")).toHaveText(
      "Tò mò là một siêu năng lực",
    );

    // Simulate a background tab without relying on headless window focus.
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", {
        configurable: true,
        value: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.clock.runFor(20_000);
    await expect(note.locator("strong")).toHaveText(
      "Tò mò là một siêu năng lực",
    );
    await page.evaluate(() => {
      Reflect.deleteProperty(document, "hidden");
      document.dispatchEvent(new Event("visibilitychange"));
    });
    const titles = new Set<string>();
    const arts = new Set<string>();
    const snapshots: string[] = [];
    for (let i = 0; i < 16; i++) {
      titles.add((await note.locator("strong").textContent())!);
      arts.add(
        (await note.locator(".sidebar-note-art").getAttribute("data-art"))!,
      );
      const layout = await note.evaluate((node) => {
        const bounds = node.getBoundingClientRect();
        const text = node.querySelector("p")!.getBoundingClientRect();
        const art = node
          .querySelector(".sidebar-note-art")!
          .getBoundingClientRect();
        return {
          height: bounds.height,
          textBottom: text.bottom,
          artTop: art.top,
          overflow: node.scrollWidth > node.clientWidth,
        };
      });
      expect(layout.height).toBeCloseTo(height, 0);
      expect(layout.overflow).toBe(false);
      expect(layout.textBottom).toBeLessThanOrEqual(layout.artTop);
      snapshots.push(await note.evaluate((node) => node.outerHTML));
      await page.clock.runFor(10_000);
    }
    expect(titles.size).toBe(16);
    expect(arts.size).toBe(8);
    await expect(note.locator("strong")).toHaveText(
      "Tò mò là một siêu năng lực",
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(note.locator(".garden-note-content")).toHaveCSS(
      "animation-name",
      "none",
    );

    await page.evaluate((cards) => {
      const gallery = document.createElement("div");
      gallery.id = "note-gallery";
      gallery.className = "sidebar";
      gallery.style.cssText =
        "position:absolute;inset:0 auto auto 0;width:1080px;height:auto;z-index:9999;background:#204c37;display:grid;grid-template-columns:repeat(4,240px);gap:20px;padding:30px;overflow:visible";
      gallery.innerHTML = cards.join("");
      document.body.append(gallery);
    }, snapshots);
    await page.locator("#note-gallery").screenshot({
      path: `.local/garden-notes-${info.project.name}-${role}.png`,
      animations: "disabled",
    });
    await page.locator("#note-gallery").evaluate((node) => node.remove());
    await page.setViewportSize({ width: 900, height: 700 });
    for (let i = 0; i < 16; i++) {
      const fits = await note.evaluate((node) => {
        const text = node.querySelector("p")!.getBoundingClientRect();
        const art = node
          .querySelector(".sidebar-note-art")!
          .getBoundingClientRect();
        return text.bottom <= art.top && node.scrollWidth <= node.clientWidth;
      });
      expect(fits).toBe(true);
      await page.clock.runFor(10_000);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(note).toBeHidden();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}
