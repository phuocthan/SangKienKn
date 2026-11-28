// Chụp PNG cho mock (1440 & 390) + trang xem trước, và tự kiểm tra:
//  - tương phản chữ/nền (WCAG AA: 4.5:1, chữ lớn ≥ 24px hoặc ≥ 18.66px đậm: 3:1)
//  - vùng chạm của nút/link/ô nhập ≥ 44 × 44px
//  - tràn ngang trang
// Chạy từ gốc repo GreenEdu:  node artifacts/redesign-20261128/tools/shoot.mjs
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { screens } from "./mocks.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, "..");
const require = createRequire(path.join(out, "..", "..", "package.json"));
const { chromium } = require("@playwright/test");

const audit = () => {
  const lum = (c) => {
    const [r, g, b] = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const parse = (s) => { const m = s.match(/[\d.]+/g); return m ? m.map(Number) : [0, 0, 0, 0]; };
  const bgOf = (el) => {
    for (let e = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.backgroundImage !== "none" && !/url\(/.test(cs.backgroundImage)) {
        const cols = cs.backgroundImage.match(/rgba?\([^)]+\)/g);
        if (cols) { // gradient: lấy màu tối nhất cho chữ sáng / sáng nhất cho chữ tối — trả mảng
          return cols.map(parse);
        }
      }
      const c = parse(cs.backgroundColor);
      if ((c[3] ?? 1) > 0.5 && cs.backgroundColor !== "rgba(0, 0, 0, 0)") return [c];
    }
    return [[255, 255, 255]];
  };
  const issues = [];
  const seen = new Set();
  for (const el of document.querySelectorAll("body *")) {
    if (!el.offsetParent && getComputedStyle(el).position !== "fixed") continue;
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!own) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || parseFloat(cs.opacity) < 0.5) continue;
    if (el.closest(".sr-only,[aria-hidden=true]")) continue;
    const fg = parse(cs.color);
    const size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight) >= 700;
    const need = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5;
    let worst = 99;
    for (const bg of bgOf(el)) {
      const L1 = lum(fg.slice(0, 3)), L2 = lum(bg.slice(0, 3));
      const r = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
      worst = Math.min(worst, r);
    }
    if (worst < need) {
      const key = el.className + "|" + el.textContent.trim().slice(0, 20);
      if (seen.has(key)) continue;
      seen.add(key);
      issues.push(`tương phản ${worst.toFixed(2)} < ${need}: <${el.tagName.toLowerCase()} class="${el.className}"> "${el.textContent.trim().slice(0, 40)}"`);
    }
  }
  for (const el of document.querySelectorAll("button, a[href], input:not([type=radio]), select, [role=radio]")) {
    if (el.closest(".sr-only")) continue;
    const target = el.closest("label") && el.matches("input,select") ? el.closest("label") : el;
    const r = target.getBoundingClientRect();
    if (!r.width || getComputedStyle(target).display === "none") continue;
    let w = r.width, h = r.height;
    if (el.classList.contains("mk-info")) { w += 20; h += 20; } // vùng chạm mở rộng bằng ::after
    if (w < 43.5 || h < 43.5) issues.push(`vùng chạm ${Math.round(w)}×${Math.round(h)}: <${el.tagName.toLowerCase()} class="${el.className}"> "${(el.getAttribute("aria-label") || el.textContent).trim().slice(0, 30)}"`);
  }
  if (document.documentElement.scrollWidth > innerWidth + 1) issues.push(`tràn ngang: ${document.documentElement.scrollWidth} > ${innerWidth}`);
  return issues;
};

const browser = await chromium.launch().catch(() => chromium.launch({ channel: "chrome" })).catch(() => chromium.launch({ channel: "msedge" }));
const report = [];
fs.mkdirSync(path.join(out, "mocks", "png"), { recursive: true });
for (const s of screens) {
  for (const [kind, width, height] of [["desktop", 1440, 960], ["mobile", 390, 844]]) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: kind === "mobile" ? 2 : 1, reducedMotion: "reduce" });
    await page.goto(pathToFileURL(path.join(out, "mocks", "screens", s.id + ".html")).href);
    await page.evaluate(() => document.fonts.ready);
    // Ảnh toàn trang: đặt thanh dưới ở đáy trang thay vì giữa ảnh (chỉ cho PNG).
    await page.addStyleTag({ content: ".mk-app{position:relative}.mk-bottom{position:absolute!important}.mk-top{position:relative!important}" });
    await page.screenshot({ path: path.join(out, "mocks", "png", `${s.id}-${kind}.png`), fullPage: true });
    const issues = await page.evaluate(audit);
    report.push(`## ${s.id} · ${kind}\n` + (issues.length ? issues.map((i) => "- " + i).join("\n") : "- đạt") + "\n");
    await page.close();
  }
}
for (const [kind, width] of [["desktop", 1440], ["mobile", 390]]) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
  await page.goto(pathToFileURL(path.join(out, "index.html")).href);
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(out, "mocks", "png", `_preview-${kind}.png`), fullPage: kind === "desktop" ? false : false });
  const issues = await page.evaluate(audit);
  report.push(`## index.html · ${kind}\n` + (issues.length ? issues.map((i) => "- " + i).join("\n") : "- đạt") + "\n");
  await page.close();
}
await browser.close();
fs.writeFileSync(path.join(out, "mocks", "audit.md"), `# Tự kiểm tra mock — ${new Date().toISOString().slice(0, 10)}\n\nTương phản WCAG AA, vùng chạm ≥ 44px, tràn ngang. Sinh bởi tools/shoot.mjs.\n\n` + report.join("\n"), "utf8");
console.log(report.join("\n"));
