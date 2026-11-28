// Dựng bộ icon, bảng ánh xạ và trang xem trước.
// Chạy:  node tools/build.mjs [đường dẫn src của GreenEdu]
// Mặc định đọc ../../../src (chỉ đọc, không ghi gì vào src).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { icons, groups } from "./icon-source.mjs";
import { buildMocks, screens } from "./mocks.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, "..");
const srcDir = path.resolve(process.argv[2] || path.join(out, "..", "..", "src"));
const w = (rel, text) => {
  const p = path.join(out, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, text, "utf8");
};

// ——— Màu & lớp tô ———
export const TOKENS = {
  "--gi-fill": "#cfe6c4",
  "--gi-accent": "#f2c14e",
  "--gi-gold": "#e9b949",
  "--gi-silver": "#c7cfd6",
  "--gi-bronze": "#d38d5c",
  "--gi-fruit": "#e2794c",
};
const CLS = {
  f: ["fill", "--gi-fill", true],
  fo: ["fill", "--gi-fill", false],
  a: ["fill", "--gi-accent", true],
  ao: ["fill", "--gi-accent", false],
  gold: ["fill", "--gi-gold", true],
  silver: ["fill", "--gi-silver", true],
  bronze: ["fill", "--gi-bronze", true],
  fruit: ["fill", "--gi-fruit", true],
};
const styleFor = (c) => {
  if (c === "c") return { css: "fill:currentColor;stroke:none", jsx: `{fill:"currentColor",stroke:"none"}` };
  const [, v, keep] = CLS[c];
  const val = `var(${v},${TOKENS[v]})`;
  return {
    css: `fill:${val}` + (keep ? "" : ";stroke:none"),
    jsx: `{fill:"${val}"${keep ? "" : `,stroke:"none"`}}`,
  };
};
const toSvgBody = (b) => b.replace(/class="([a-z]+)"/g, (_, c) => `style="${styleFor(c).css}"`);
const toJsxBody = (b) => b.replace(/class="([a-z]+)"/g, (_, c) => `style={${styleFor(c).jsx}}`);
const STROKE = { 24: 2, 32: 1.75, 48: 1.5 };

const svgFile = (ic, size, extra = "") =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${STROKE[size]}" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="${ic.label}" data-icon="${ic.id}">` +
  `<title>${ic.label}</title>${extra}${toSvgBody(ic.body)}</svg>\n`;

// Icon nội tuyến dùng trong trang xem trước và mock.
export const icon = (id, opts = {}) => {
  const ic = icons.find((i) => i.id === id);
  if (!ic) throw new Error("Thiếu icon " + id);
  const { label, cls = "", size } = opts;
  const a11y = label ? `role="img" aria-label="${label}"` : `aria-hidden="true" focusable="false"`;
  const anim = ic.anim ? ` gi-anim-${ic.anim}` : "";
  const sz = size ? ` width="${size}" height="${size}"` : "";
  return `<svg class="gi${anim} ${cls}"${sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${a11y} data-icon="${id}">${label ? `<title>${label}</title>` : ""}${toSvgBody(ic.body)}</svg>`;
};

// ——— 1. SVG tĩnh 24/32/48 ———
fs.rmSync(path.join(out, "icons"), { recursive: true, force: true });
for (const size of [24, 32, 48]) for (const ic of icons) w(`icons/svg/${size}/${ic.id}.svg`, svgFile(ic, size));

// ——— 2. Sprite ———
w(
  "icons/sprite.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n` +
    icons
      .map(
        (ic) =>
          `<symbol id="gi-${ic.id}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><title>${ic.label}</title>${toSvgBody(ic.body)}</symbol>`,
      )
      .join("\n") +
    `\n</svg>\n`,
);

// ——— 3. SVG có animation (bản tự chứa, tắt khi reduced-motion) ———
const animated = {
  "ket-trai": `@keyframes s{0%,100%{transform:rotate(0)}30%{transform:rotate(-7deg)}65%{transform:rotate(5deg)}}.m{transform-origin:12px 4px;animation:s 2.4s ease-in-out infinite}`,
  "cay-ra-hoa": `@keyframes b{0%,100%{transform:scale(.92)}50%{transform:scale(1.04)}}.m{transform-origin:12px 9px;animation:b 2.6s ease-in-out infinite}`,
  "dang-hoc": `@keyframes p{0%,100%{opacity:1}50%{opacity:.55}}.m{animation:p 1.8s ease-in-out infinite}`,
  "diem-cong": `@keyframes t{0%,100%{transform:scale(1)}40%{transform:scale(1.1)}}.m{transform-origin:12px 12px;animation:t 2s ease-in-out infinite}`,
  "vuon-cua-toi": `@keyframes w{0%,100%{transform:rotate(0)}50%{transform:rotate(4deg)}}.m{transform-origin:12px 14px;animation:w 3s ease-in-out infinite}`,
  "thong-bao": `@keyframes r{0%,70%,100%{transform:rotate(0)}10%{transform:rotate(12deg)}25%{transform:rotate(-10deg)}40%{transform:rotate(6deg)}}.m{transform-origin:12px 4px;animation:r 2.8s ease-in-out infinite}`,
};
for (const [id, kf] of Object.entries(animated)) {
  const ic = icons.find((i) => i.id === id);
  for (const size of [24, 48]) {
    w(
      `icons/animated/${size}/${id}.svg`,
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${STROKE[size]}" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="${ic.label}"><title>${ic.label}</title>` +
        `<style>${kf}@media (prefers-reduced-motion:reduce){.m{animation:none}}</style><g class="m">${toSvgBody(ic.body)}</g></svg>\n`,
    );
  }
}

// ——— 4. CSS: biến màu, kích thước, animation hover/đạt được ———
const css = `/* GreenEdu — bộ icon "Vườn tri thức" (28/11/2026). CSS thuần, không phụ thuộc thư viện. */
:root {
${Object.entries(TOKENS).map(([k, v]) => `  ${k}: ${v};`).join("\n")}
}
.gi { width: 24px; height: 24px; flex: none; display: inline-block; vertical-align: middle; overflow: visible; }
.gi--32 { width: 32px; height: 32px; stroke-width: 1.75; }
.gi--48 { width: 48px; height: 48px; stroke-width: 1.5; }
.gi--20 { width: 20px; height: 20px; }
.gi--16 { width: 16px; height: 16px; stroke-width: 2.25; }
/* Trên nền xanh đậm (mục điều hướng đang chọn, nút chính) mảng phụ chuyển trong suốt. */
.on-dark, .gi--on-dark { --gi-fill: rgba(255, 255, 255, 0.24); }

/* Animation nhẹ: chỉ khi người dùng không yêu cầu giảm chuyển động.
   Kích hoạt khi rê/focus vào phần tử cha có .gi-host, hoặc khi cha có .is-achieved. */
@media (prefers-reduced-motion: no-preference) {
  .gi-anim-sway, .gi-anim-pop, .gi-anim-spin, .gi-anim-ring, .gi-anim-pulse { transform-box: fill-box; }
  .gi-anim-sway { transform-origin: 50% 90%; }
  .gi-anim-pop { transform-origin: 50% 50%; }
  .gi-anim-spin { transform-origin: 50% 50%; }
  .gi-anim-ring { transform-origin: 50% 10%; }
  .gi-host:is(:hover, :focus-visible) .gi-anim-sway { animation: gi-sway 0.9s ease-in-out; }
  .gi-host:is(:hover, :focus-visible) .gi-anim-pop, .is-achieved .gi-anim-pop { animation: gi-pop 0.6s cubic-bezier(.3,1.6,.5,1); }
  .gi-host:is(:hover, :focus-visible) .gi-anim-spin { animation: gi-spin 1.2s ease-in-out; }
  .gi-host:is(:hover, :focus-visible) .gi-anim-ring { animation: gi-ring 0.9s ease-in-out; }
  .is-live .gi-anim-pulse { animation: gi-pulse 1.8s ease-in-out infinite; }
}
@keyframes gi-sway { 0%, 100% { transform: rotate(0); } 35% { transform: rotate(-6deg); } 70% { transform: rotate(4deg); } }
@keyframes gi-pop { 0% { transform: scale(1); } 45% { transform: scale(1.18); } 100% { transform: scale(1); } }
@keyframes gi-spin { to { transform: rotate(90deg); } }
@keyframes gi-ring { 0%, 100% { transform: rotate(0); } 20% { transform: rotate(14deg); } 45% { transform: rotate(-10deg); } 70% { transform: rotate(5deg); } }
@keyframes gi-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
`;
w("icons/greenedu-icons.css", css);

// ——— 5. Component React đề xuất (TSX) ———
const pascal = (id) => id.split("-").map((s) => s[0].toUpperCase() + s.slice(1)).join("").replace(/^(\d)/, "N$1");
const tsx = `/*
  GreenEdu — bộ icon "Vườn tri thức" (28/11/2026). File ĐỀ XUẤT, chưa lắp vào app.
  Sinh tự động bởi artifacts/redesign-20261128/tools/build.mjs — sửa ở icon-source.mjs rồi build lại.
  Cách lắp (phiên GreenEdu, sau khi duyệt): chép file này thành src/green-icons.tsx, nạp
  icons/greenedu-icons.css, rồi đổi từng import theo bảng mapping/icon-mapping.md.
  Mỗi component nhận cùng props size/className như icon Phosphor cũ nên <item.icon size={20} /> vẫn chạy.
*/
import { forwardRef, type ReactElement, type SVGProps } from "react";

export type GreenIconProps = Omit<SVGProps<SVGSVGElement>, "ref"> & {
  size?: number | string;
  /** Có label → icon có nghĩa (role="img"). Không có → trang trí, aria-hidden. */
  label?: string;
};
export type GreenIcon = ReturnType<typeof make>;

const strokeFor = (size: number | string) => {
  const n = typeof size === "number" ? size : parseFloat(size) || 24;
  return n >= 44 ? 1.5 : n >= 30 ? 1.75 : 2;
};

function make(name: string, defaultLabel: string, body: ReactElement, anim?: string) {
  const C = forwardRef<SVGSVGElement, GreenIconProps>(({ size = 20, label, className = "", ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeFor(size)}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true, focusable: false })}
      {...props}
      className={\`gi\${anim ? " gi-anim-" + anim : ""} \${className}\`}
      data-icon-family="greenedu-garden"
      data-icon-name={name}
    >
      {label ? <title>{label}</title> : null}
      {body}
    </svg>
  ));
  C.displayName = name;
  return Object.assign(C, { defaultLabel });
}

${icons
  .map(
    (ic) =>
      `/** ${ic.label} */\nexport const ${pascal(ic.id)} = make("${ic.id}", "${ic.label}", <>${toJsxBody(ic.body)}</>${ic.anim ? `, "${ic.anim}"` : ""});`,
  )
  .join("\n")}

export const greenIcons = {
${icons.map((ic) => `  "${ic.id}": ${pascal(ic.id)},`).join("\n")}
} as const;
export type GreenIconName = keyof typeof greenIcons;
`;
w("react/GreenIcons.tsx", tsx);

// ——— 6. Quét nơi dùng icon cũ trong src/ ———
const exportsOld = [];
let oldPhosphor = {};
const iconsTsx = path.join(srcDir, "icons.tsx");
if (fs.existsSync(iconsTsx)) {
  const t = fs.readFileSync(iconsTsx, "utf8");
  for (const m of t.matchAll(/export const (\w+) = duotone\(\s*"(\w+)"/g)) {
    exportsOld.push(m[1]);
    oldPhosphor[m[1]] = m[2];
  }
}
// Gợi ý theo ngữ cảnh cho tên cũ dùng ở nhiều nghĩa (±3 dòng quanh chỗ dùng).
const RULES = {
  Books: [[/Ngân hàng|câu hỏi/i, "ngan-hang-cau-hoi"], [/./, "chuong-hoc"]],
  Users: [[/Học sinh|học sinh|tài khoản/i, "hoc-sinh"], [/thành viên|hoạt động/i, "thanh-vien-hoat-dong"], [/./, "hoat-dong-nhom"]],
  Settings: [[/Quản lý lớp/, "quan-ly-lop"], [/./, "cai-dat"]],
  ClipboardList: [[/online/i, "kiem-tra-online"], [/đã làm|số câu/i, "so-cau-da-lam"], [/./, "kiem-tra"]],
  Play: [[/./, "bat-dau"]],
  Send: [[/nộp/i, "nop-bai"], [/./, "gui"]],
  X: [[/Từ chối|reject/i, "tu-choi-nut"], [/./, "dong"]],
  Check: [[/duyệt|approve/i, "duyet"], [/./, "duyet"]],
  Target: [[/săn|thưởng|hunt/i, "san-thuong"], [/./, "muc-tieu"]],
  Download: [[/excel|xlsx|csv/i, "xuat-excel"], [/word|docx/i, "xuat-word"], [/./, "tai-xuong"]],
  Upload: [[/word|docx/i, "tai-len-word"], [/./, "tai-len"]],
  Sparkles: [[/điểm|thưởng|bonus/i, "diem-cong"], [/./, "lap-lanh"]],
  CheckCircle2: [[/tỷ lệ|đúng/i, "ty-le-dung"], [/khắc phục|đã sửa/i, "cau-da-khac-phuc"], [/./, "da-duyet"]],
  Clock3: [[/chờ/i, "cho-duyet"], [/./, "thoi-gian-hoc"]],
  EyeOff: [[/rời tab|tab/i, "canh-bao-roi-tab"], [/./, "an"]],
  RotateCcw: [[/sửa sai|cần sửa/i, "cau-can-sua"], [/./, "lam-lai"]],
  LockKeyhole: [[/mở khóa|unlock/i, "mo"], [/./, "khoa"]],
  ArrowRight: [[/Tiếp tục/, "tiep-tuc"], [/./, "di-tiep"]],
  ArrowsDownUp: [[/đổi lớp|chuyển lớp/i, "doi-lop"], [/./, "sap-xep"]],
  UserCircle: [[/./, "tai-khoan"]],
  Trophy: [[/top ?10/i, "top-10"], [/./, "cup"]],
  TreeIcon: [[/kết trái/i, "ket-trai"], [/./, "vuon-cua-lop"]],
  Medal: [[/./, "huy-chuong-1"]],
  ChevronDown: [[/./, "mo-rong"]],
  History: [[/chờ/i, "cho-duyet"], [/./, "lich-su"]],
  Eye: [[/./, "xem-bai"]],
};
const defaultFor = (old) => {
  const r = RULES[old];
  if (r) return r[r.length - 1][1];
  const c = icons.find((i) => i.old.includes(old));
  return c ? c.id : null;
};
const usage = {}; // old -> [{file,line,text,suggest}]
for (const n of exportsOld) usage[n] = [];
const walk = (d) =>
  fs.existsSync(d)
    ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]))
    : [];
for (const f of walk(srcDir).filter((f) => /\.tsx?$/.test(f) && path.basename(f) !== "icons.tsx")) {
  const text = fs.readFileSync(f, "utf8");
  const imp = [...text.matchAll(/import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*["']\.\/icons["']/g)];
  if (!imp.length) continue;
  const names = new Map();
  for (const m of imp)
    for (const part of m[1].split(",").map((s) => s.trim()).filter(Boolean)) {
      const [orig, alias] = part.replace(/^type\s+/, "").split(/\s+as\s+/);
      if (exportsOld.includes(orig)) names.set(alias || orig, orig);
    }
  const stripped = text.replace(/import\s*(?:type\s*)?\{[^}]*\}\s*from\s*["']\.\/icons["'];?/g, (s) => s.replace(/[^\n]/g, " "));
  const lines = stripped.split("\n");
  const rel = path.relative(path.dirname(srcDir), f).replace(/\\/g, "/");
  lines.forEach((ln, i) => {
    for (const [local, orig] of names) {
      if (!new RegExp(`\\b${local}\\b`).test(ln)) continue;
      const ctx = lines.slice(Math.max(0, i - 3), i + 4).join(" ");
      const rules = RULES[orig];
      const suggest = rules ? rules.find(([re]) => re.test(ctx))[1] : defaultFor(orig);
      usage[orig].push({ file: rel, line: i + 1, text: ln.trim().slice(0, 110), suggest });
    }
  });
}
const mapping = {
  generated: "2026-11-28",
  source: path.relative(out, srcDir).replace(/\\/g, "/"),
  icons: icons.map((ic) => ({
    id: ic.id,
    component: pascal(ic.id),
    label: ic.label,
    group: ic.group,
    replaces: ic.old,
    usages: Object.values(usage).flat().filter((u) => u.suggest === ic.id).map((u) => `${u.file}:${u.line}`),
  })),
  legacy: exportsOld.map((n) => ({
    old: n,
    phosphor: oldPhosphor[n],
    defaultNew: defaultFor(n),
    candidates: icons.filter((i) => i.old.includes(n)).map((i) => i.id),
    usages: usage[n],
  })),
};
w("mapping/icon-mapping.json", JSON.stringify(mapping, null, 2) + "\n");

const esc = (s) => s.replace(/\|/g, "\\|").replace(/</g, "&lt;");
const labelOf = (id) => icons.find((i) => i.id === id)?.label ?? id;
let md = `# Bảng ánh xạ icon GreenEdu — cũ ↔ mới ↔ nơi dùng

Sinh tự động ngày 28/11/2026 bằng \`tools/build.mjs\` từ \`src/\` của GreenEdu (chỉ đọc). ${exportsOld.length} icon cũ trong \`src/icons.tsx\`, ${icons.length} icon mới.
Cột **Gợi ý** chọn icon mới theo chữ quanh chỗ dùng (±3 dòng); tên cũ dùng ở nhiều nghĩa (Users, Books, Settings…) cần người lắp xác nhận lại.

## 1. Theo icon cũ (dùng khi lắp)

| Icon cũ (\`icons.tsx\`) | Phosphor | Icon mới mặc định | Ứng viên khác | Số chỗ dùng |
|---|---|---|---|---|
`;
for (const l of mapping.legacy)
  md += `| \`${l.old}\` | ${l.phosphor} | \`${l.defaultNew}\` ${labelOf(l.defaultNew)} | ${l.candidates.filter((c) => c !== l.defaultNew).map((c) => `\`${c}\``).join(", ") || "—"} | ${l.usages.length} |\n`;
md += `\n## 2. Chi tiết từng chỗ dùng\n`;
for (const l of mapping.legacy) {
  md += `\n### \`${l.old}\` → \`${l.defaultNew}\`\n\n`;
  if (!l.usages.length) {
    md += `Chưa dùng ngoài \`icons.tsx\`.\n`;
    continue;
  }
  md += `| Nơi dùng | Dòng mã | Gợi ý |\n|---|---|---|\n`;
  for (const u of l.usages) md += `| \`${u.file}:${u.line}\` | \`${esc(u.text)}\` | \`${u.suggest}\` |\n`;
}
md += `\n## 3. Icon mới chưa có tương ứng cũ (dùng cho giao diện mới)\n\n`;
for (const ic of icons.filter((i) => !i.old.length)) md += `- \`${ic.id}\` — ${ic.label}\n`;
w("mapping/icon-mapping.md", md);

// ——— 7. Mock các màn ———
buildMocks({ icon, w, out, icons });

// ——— 8. Trang xem trước ———
const grp = groups
  .map((g) => {
    const list = icons.filter((i) => i.group === g.id);
    return `<section class="pv-group" aria-labelledby="g-${g.id}"><h3 id="g-${g.id}">${g.name} <span class="pv-count">${list.length}</span></h3><ul class="pv-grid">${list
      .map(
        (ic) =>
          `<li class="pv-card gi-host" tabindex="0"><span class="pv-ico">${icon(ic.id, { label: ic.label })}</span><b>${ic.label}</b><code>${ic.id}</code>${ic.old.length ? `<small>thay ${ic.old.map((o) => `<code>${o}</code>`).join(" ")}</small>` : `<small class="pv-new">mới</small>`}${ic.anim ? `<span class="pv-anim" title="Có animation khi rê chuột/đạt được">${ic.anim}</span>` : ""}</li>`,
      )
      .join("")}</ul></section>`;
  })
  .join("");

const legacyRows = mapping.legacy
  .map(
    (l) =>
      `<tr><td><code>${l.old}</code></td><td>${l.defaultNew ? icon(l.defaultNew, { cls: "gi--20" }) : ""} <code>${l.defaultNew}</code></td><td>${l.candidates
        .filter((c) => c !== l.defaultNew)
        .map((c) => `<span class="pv-cand">${icon(c, { cls: "gi--16" })}<code>${c}</code></span>`)
        .join(" ") || "—"}</td><td>${l.usages.length ? `<details><summary>${l.usages.length} chỗ</summary><ul>${l.usages
        .map((u) => `<li><code>${u.file}:${u.line}</code> → <code>${u.suggest}</code></li>`)
        .join("")}</ul></details>` : "chưa dùng"}</td></tr>`,
  )
  .join("");

const animList = Object.keys(animated)
  .map((id) => `<figure><img src="icons/animated/48/${id}.svg" width="48" height="48" alt="${labelOf(id)} (animation)"><img src="icons/svg/48/${id}.svg" width="48" height="48" alt="${labelOf(id)} (tĩnh)"><figcaption>${labelOf(id)}</figcaption></figure>`)
  .join("");

const mockList = screens
  .map(
    (s) => `<article class="pv-mock" id="mock-${s.id}">
  <header><h3>${icon(s.icon, { cls: "gi--20" })} ${s.title}</h3><p>${s.note}</p>
  <nav class="pv-mock-links"><a href="mocks/screens/${s.id}.html" target="_blank">Mở trang</a><a href="mocks/png/${s.id}-desktop.png" target="_blank">PNG 1440</a><a href="mocks/png/${s.id}-mobile.png" target="_blank">PNG 390</a></nav></header>
  <div class="pv-frames">
    <figure class="pv-frame pv-frame--d"><div class="pv-scale"><iframe src="mocks/screens/${s.id}.html" width="1440" height="960" loading="lazy" title="${s.title} — desktop 1440"></iframe></div><figcaption>Desktop 1440</figcaption></figure>
    <figure class="pv-frame pv-frame--m"><div class="pv-scale"><iframe src="mocks/screens/${s.id}.html" width="390" height="844" loading="lazy" title="${s.title} — mobile 390"></iframe></div><figcaption>Mobile 390</figcaption></figure>
  </div></article>`,
  )
  .join("\n");

const html = `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>GreenEdu — icon & mock ít chữ</title>
<link rel="stylesheet" href="icons/greenedu-icons.css">
${[400,600,700,800].map((n)=>`<link rel="stylesheet" href="../../node_modules/@fontsource/be-vietnam-pro/${n}.css">`).join("")}
<link rel="stylesheet" href="mocks/mock.css">
<link rel="stylesheet" href="preview.css">
</head><body class="mk-body">
<a class="skip" href="#icons">Bỏ qua tới bộ icon</a>
<header class="pv-top">
  <div class="pv-brand">${icon("vuon-cua-lop", { cls: "gi--32" })}<div><h1>GreenEdu · Vườn tri thức</h1><p>Bộ icon ${icons.length} mẫu + mock "nhiều icon, ít chữ" · đề xuất 28/11/2026, chưa lắp vào app</p></div></div>
  <nav class="pv-tabs" aria-label="Mục trong trang"><a href="#icons">${icon("tong-quan", { cls: "gi--20" })}Icon</a><a href="#context">${icon("luyen-tap", { cls: "gi--20" })}Ngữ cảnh</a><a href="#mocks">${icon("lop-cua-toi", { cls: "gi--20" })}Mock</a><a href="#mapping">${icon("doi-lop", { cls: "gi--20" })}Ánh xạ</a></nav>
</header>
<main>
<section id="icons" class="pv-sec">
  <div class="pv-sec-head"><h2>Bộ icon</h2>
    <div class="pv-controls" role="group" aria-label="Tùy chọn xem">
      <fieldset class="seg"><legend>Cỡ</legend>
        <label><input type="radio" name="size" value="24" checked>24</label><label><input type="radio" name="size" value="32">32</label><label><input type="radio" name="size" value="48">48</label></fieldset>
      <fieldset class="seg"><legend>Nền</legend>
        <label><input type="radio" name="bg" value="cream" checked>Kem</label><label><input type="radio" name="bg" value="white">Trắng</label><label><input type="radio" name="bg" value="dark">Xanh đậm</label></fieldset>
    </div></div>
  <p class="pv-lede">Lưới 24 × 24, nét 2px (32px: 1,75 · 48px: 1,5) bo tròn, <code>currentColor</code> cho nét; mảng phụ qua <code>--gi-fill</code>, nhấn qua <code>--gi-accent</code>, vinh danh qua <code>--gi-gold/silver/bronze/fruit</code>. Rê chuột hoặc Tab vào thẻ để thấy animation (tắt khi hệ thống bật giảm chuyển động).</p>
  <div class="pv-icons" data-size="24" data-bg="cream">${grp}</div>
  <h3 class="pv-h3">Bản animation tự chứa (trái) và bản tĩnh (phải)</h3>
  <div class="pv-anims">${animList}</div>
</section>

<section id="context" class="pv-sec">
  <h2>Trong ngữ cảnh</h2>
  <div class="pv-ctx">
    <div class="pv-ctx-col"><h3>Điều hướng</h3>
      <nav class="mk-side-demo" aria-label="Ví dụ điều hướng">
        <a class="mk-nav is-active on-dark gi-host" href="#context" aria-current="page">${icon("vuon-cua-toi")}<span>Tổng quan</span></a>
        <a class="mk-nav gi-host" href="#context">${icon("luyen-tap")}<span>Luyện tập</span><em>3</em></a>
        <a class="mk-nav gi-host" href="#context">${icon("so-tay-sua-sai")}<span>Sửa sai</span><em>9</em></a>
        <a class="mk-nav gi-host" href="#context">${icon("san-thuong")}<span>Săn thưởng</span></a>
        <a class="mk-nav gi-host" href="#context">${icon("vuon-cua-lop")}<span>Vườn lớp</span></a>
      </nav></div>
    <div class="pv-ctx-col"><h3>Thẻ số liệu</h3>
      <div class="mk-stats mk-stats--demo">
        <div class="mk-stat">${icon("thoi-gian-hoc", { cls: "gi--32" })}<b>12<small>giờ</small></b><span>Học</span></div>
        <div class="mk-stat">${icon("so-cau-da-lam", { cls: "gi--32" })}<b>248</b><span>Đã làm</span></div>
        <div class="mk-stat">${icon("ty-le-dung", { cls: "gi--32" })}<b>82<small>%</small></b><span>Đúng</span></div>
        <div class="mk-stat mk-stat--warn">${icon("cau-can-sua", { cls: "gi--32" })}<b>9</b><span>Cần sửa</span></div>
      </div></div>
    <div class="pv-ctx-col"><h3>Trạng thái</h3>
      <div class="mk-pills">
        <span class="mk-pill mk-pill--live is-live">${icon("dang-hoc", { cls: "gi--16" })}Đang học</span>
        <span class="mk-pill">${icon("tam-dung", { cls: "gi--16" })}Tạm dừng</span>
        <span class="mk-pill mk-pill--info">${icon("da-nop", { cls: "gi--16" })}Đã nộp</span>
        <span class="mk-pill mk-pill--warn">${icon("cho-duyet", { cls: "gi--16" })}Chờ duyệt</span>
        <span class="mk-pill mk-pill--ok">${icon("da-duyet", { cls: "gi--16" })}Đã duyệt</span>
        <span class="mk-pill mk-pill--bad">${icon("tu-choi", { cls: "gi--16" })}Từ chối</span>
        <span class="mk-pill">${icon("khoa", { cls: "gi--16" })}Khóa</span>
        <span class="mk-pill mk-pill--ok">${icon("mo", { cls: "gi--16" })}Mở</span>
        <span class="mk-pill mk-pill--warn">${icon("canh-bao-roi-tab", { cls: "gi--16" })}Rời tab 2/3</span>
        <span class="mk-pill mk-pill--bad">${icon("offline", { cls: "gi--16" })}Offline</span>
      </div></div>
    <div class="pv-ctx-col"><h3>Nút</h3>
      <div class="mk-btnrow">
        <button class="mk-btn mk-btn--primary on-dark gi-host" type="button">${icon("bat-dau")}Bắt đầu</button>
        <button class="mk-btn gi-host" type="button">${icon("tiep-tuc")}Tiếp tục</button>
        <button class="mk-btn gi-host" type="button">${icon("tai-len-word")}Word</button>
        <button class="mk-btn gi-host" type="button">${icon("xuat-excel")}Excel</button>
      </div>
      <div class="mk-btnrow">
        ${["xem-bai:Xem bài", "sua:Sửa", "xoa:Xóa", "duyet:Duyệt", "tu-choi-nut:Từ chối", "tim:Tìm", "loc-chuong:Lọc theo chương", "doi-lop:Đổi lớp", "dang-xuat:Đăng xuất"]
          .map((p) => p.split(":"))
          .map(([id, l]) => `<button class="mk-ibtn gi-host" type="button" aria-label="${l}" title="${l}">${icon(id)}</button>`)
          .join("")}
      </div></div>
    <div class="pv-ctx-col"><h3>Vinh danh</h3>
      <div class="mk-honors-demo">
        ${["cup:Cúp", "huy-chuong-1:Hạng 1", "huy-chuong-2:Hạng 2", "huy-chuong-3:Hạng 3", "top-10:Top 10", "ket-trai:Kết Trái"]
          .map((p) => p.split(":"))
          .map(([id, l]) => `<span class="gi-host is-achieved" tabindex="0">${icon(id, { cls: "gi--48" })}<small>${l}</small></span>`)
          .join("")}
      </div></div>
  </div>
</section>

<section id="mocks" class="pv-sec">
  <h2>Mock 7 màn · desktop 1440 & mobile 390</h2>
  <p class="pv-lede">Mỗi màn là một HTML tĩnh dùng chung <code>mocks/mock.css</code> (CSS thuần, tên lớp tiền tố <code>mk-</code>, chuyển sang component React được 1-1). Ảnh 5 cấp cây lấy từ <code>public/assets/student-levels-3d-v1</code>. Tên học sinh là tên giả.</p>
  ${mockList}
</section>

<section id="mapping" class="pv-sec">
  <h2>Ánh xạ icon cũ → mới</h2>
  <p class="pv-lede">${exportsOld.length} icon cũ trong <code>src/icons.tsx</code>. Bản đầy đủ từng dòng: <a href="mapping/icon-mapping.md">mapping/icon-mapping.md</a> · <a href="mapping/icon-mapping.json">JSON</a>.</p>
  <div class="pv-table-wrap"><table class="pv-table"><thead><tr><th scope="col">Icon cũ</th><th scope="col">Mới (mặc định)</th><th scope="col">Ứng viên khác</th><th scope="col">Nơi dùng → gợi ý</th></tr></thead><tbody>${legacyRows}</tbody></table></div>
</section>
</main>
<script>
  const box = document.querySelector(".pv-icons");
  document.querySelectorAll('input[name="size"],input[name="bg"]').forEach((el) =>
    el.addEventListener("change", () => { box.dataset[el.name] = el.value; }));
  // Thu phóng iframe mock theo bề rộng khung.
  const fit = () => document.querySelectorAll(".pv-scale").forEach((s) => {
    const f = s.querySelector("iframe"); const k = s.clientWidth / f.width;
    f.style.transform = "scale(" + k + ")"; s.style.height = f.height * k + "px";
  });
  addEventListener("resize", fit); fit();
</script>
</body></html>
`;
w("index.html", html);
console.log(`OK: ${icons.length} icon × 3 cỡ, ${Object.keys(animated).length} animation, ${exportsOld.length} icon cũ, ${Object.values(usage).flat().length} chỗ dùng, ${screens.length} màn.`);
