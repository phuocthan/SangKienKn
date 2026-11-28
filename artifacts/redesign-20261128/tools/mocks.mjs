// Mock 7 màn "nhiều icon, ít chữ". Mỗi màn là HTML tĩnh dùng chung mocks/mock.css.
// Cấu trúc lớp mk-* tương ứng component React đề xuất (xem README).
// Tên học sinh là tên giả; số liệu minh họa.
import fs from "node:fs";
import path from "node:path";

export const screens = [
  { id: "dang-nhap", title: "Đăng nhập", icon: "dang-nhap", note: "Chọn vai trò bằng icon, hai ô có icon, một nút chính." },
  { id: "tong-quan-hoc-sinh", title: "Tổng quan học sinh", icon: "vuon-cua-toi", note: "Cây của em + 1 nút Học tiếp, 4 thẻ số liệu, việc hôm nay dạng ô icon." },
  { id: "chuong-hoc-luyen-tap", title: "Chương học / Luyện tập", icon: "luyen-tap", note: "Chip chương có icon trạng thái thay select; khung câu hỏi một việc chính." },
  { id: "khu-vuon-lop", title: "Khu vườn của lớp", icon: "vuon-cua-lop", note: "Phạm vi bằng chip, bục vinh danh, Top 10 gọn, vườn chung có hàng rào." },
  { id: "so-tay-sua-sai", title: "Sổ tay sửa sai", icon: "so-tay-sua-sai", note: "Sửa sai = tưới cây: tiến độ tưới, thẻ câu sai một dòng, nút Làm lại." },
  { id: "san-thuong-diem-cong", title: "Săn thưởng / Điểm cộng", icon: "san-thuong", note: "Vé đếm bằng icon, bài săn thưởng có pill trạng thái, sổ điểm cộng theo chương." },
  { id: "quan-ly-hoc-sinh", title: "Quản lý học sinh (giáo viên)", icon: "hoc-sinh", note: "Thanh công cụ icon, bảng gọn (mobile thành thẻ), hàng chờ duyệt có nút icon." },
];

const LEVELS = ["Mầm", "Chồi", "Cây Non", "Đơm Hoa", "Kết Trái"];
const lv = (n, cls = "mk-lv") => `<img class="${cls}" src="../assets/level-${n}.webp" alt="Cấp ${n} · ${LEVELS[n - 1]}" width="80" height="80" loading="lazy">`;
const PEOPLE = [
  ["Nguyễn An Nhiên", 5, "41g", 94], ["Trần Minh Khang", 5, "38g", 91], ["Lê Bảo Ngọc", 4, "35g", 89],
  ["Phạm Gia Huy", 4, "31g", 86], ["Võ Thanh Trúc", 4, "29g", 88], ["Đỗ Hải Đăng", 3, "26g", 81],
  ["Hoàng Mai Anh", 3, "24g", 84], ["Bùi Quốc Bảo", 3, "22g", 79], ["Đặng Khánh Linh", 3, "21g", 83],
  ["Ngô Tuấn Kiệt", 2, "18g", 76], ["Lý Thu Hà", 2, "15g", 72], ["Mai Đức Toàn", 1, "9g", 68],
];
const initials = (n) => n.split(" ").slice(-2).map((s) => s[0]).join("");
const avatar = (n, i = 0) => `<span class="mk-avatar mk-avatar--${i % 5}" aria-hidden="true">${initials(n)}</span>`;

export function buildMocks({ icon: I, w, out }) {
  // Tài sản: chép 5 ảnh cấp cây + hàng rào từ public/assets của GreenEdu (không đổi file gốc).
  const pub = path.resolve(out, "..", "..", "public", "assets");
  const dst = path.join(out, "mocks", "assets");
  fs.mkdirSync(dst, { recursive: true });
  for (let n = 1; n <= 5; n++) fs.copyFileSync(path.join(pub, "student-levels-3d-v1", `level-${n}.webp`), path.join(dst, `level-${n}.webp`));
  fs.copyFileSync(path.join(pub, "garden-fence.svg"), path.join(dst, "garden-fence.svg"));

  const ib = (id, label, extra = "") => `<button class="mk-ibtn gi-host ${extra}" type="button" aria-label="${label}" title="${label}">${I(id)}</button>`;
  const pill = (id, text, kind = "") => `<span class="mk-pill ${kind ? "mk-pill--" + kind : ""}">${I(id, { cls: "gi--16" })}${text}</span>`;
  const stat = (id, num, unit, label, kind = "") =>
    `<div class="mk-stat ${kind}">${I(id, { cls: "gi--32" })}<b>${num}${unit ? `<small>${unit}</small>` : ""}</b><span>${label}</span></div>`;
  const chips = (items, active, name) =>
    `<div class="mk-chips" role="radiogroup" aria-label="${name}">${items
      .map(([id, label, state], i) => `<button type="button" role="radio" aria-checked="${i === active}" class="mk-chip ${i === active ? "is-on on-dark" : ""}">${id ? I(id, { cls: "gi--20" }) : ""}<span>${label}</span>${state ? I(state, { cls: "gi--16 mk-chip-state", label: state === "khoa" ? "Khóa" : state === "da-duyet" ? "Xong" : "Đang học" }) : ""}</button>`)
      .join("")}</div>`;

  const NAV = {
    student: [
      ["Học", [["tong-quan", "vuon-cua-toi", "Tổng quan"], ["luyen-tap", "luyen-tap", "Luyện tập"], ["sua-sai", "so-tay-sua-sai", "Sửa sai", 9], ["on-tap", "on-tap", "Ôn tập"], ["san-thuong", "san-thuong", "Săn thưởng", 2], ["kiem-tra", "kiem-tra-online", "Kiểm tra"]]],
      ["Lớp", [["vuon-lop", "vuon-cua-lop", "Vườn lớp"], ["nhom", "hoat-dong-nhom", "Nhóm"]]],
    ],
    teacher: [
      ["Lớp", [["tong-quan", "tong-quan", "Tổng quan"], ["lop", "lop-cua-toi", "Lớp học"], ["nhom", "hoat-dong-nhom", "Nhóm"]]],
      ["Nội dung", [["cau-hoi", "ngan-hang-cau-hoi", "Câu hỏi"], ["on-tap", "on-tap", "Ôn tập"], ["kiem-tra", "kiem-tra-online", "Kiểm tra"]]],
      ["Quản lý", [["hoc-sinh", "hoc-sinh", "Học sinh", 3], ["chuong", "chuong-hoc", "Chương"], ["cai-dat", "cai-dat", "Cài đặt"]]],
    ],
  };
  const BOTTOM = { student: ["tong-quan", "luyen-tap", "sua-sai", "vuon-lop"], teacher: ["tong-quan", "lop", "cau-hoi", "hoc-sinh"] };

  const shell = ({ role, active, title, titleIcon, body, user }) => {
    const flat = NAV[role].flatMap(([, it]) => it);
    const side = NAV[role]
      .map(([g, it]) => `<p class="mk-navgroup">${g}</p>` + it.map(([id, ic, l, c]) => `<a class="mk-nav gi-host ${id === active ? "is-active on-dark" : ""}" href="#" ${id === active ? 'aria-current="page"' : ""}>${I(ic)}<span>${l}</span>${c ? `<em aria-label="${c} mục">${c}</em>` : ""}</a>`).join(""))
      .join("");
    const inBottom = BOTTOM[role].includes(active);
    const bottom =
      BOTTOM[role]
        .map((id) => flat.find((f) => f[0] === id))
        .map(([id, ic, l, c]) => `<a class="mk-tab gi-host ${id === active ? "is-active" : ""}" href="#" ${id === active ? 'aria-current="page"' : ""}><span class="mk-tab-ico ${id === active ? "on-dark" : ""}">${I(ic)}${c ? `<em aria-label="${c} mục">${c}</em>` : ""}</span><span>${l}</span></a>`)
        .join("") +
      `<button class="mk-tab gi-host ${inBottom ? "" : "is-active"}" type="button" aria-haspopup="menu"><span class="mk-tab-ico ${inBottom ? "" : "on-dark"}">${I("menu-them")}</span><span>Thêm</span></button>`;
    return `<div class="mk-app mk-app--${role}">
<aside class="mk-side" aria-label="Thanh bên">
  <div class="mk-logo">${I("vuon-cua-lop", { cls: "gi--32" })}<b>GreenEdu</b></div>
  <nav aria-label="Điều hướng chính">${side}</nav>
  <div class="mk-side-foot">
    <button class="mk-classpill gi-host" type="button" aria-label="Đổi lớp, đang ở 10A3">${I("doi-lop", { cls: "gi--20" })}<span>10A3</span></button>
    ${ib("dang-xuat", "Đăng xuất")}
  </div>
</aside>
<div class="mk-main">
  <header class="mk-top">
    <h1>${I(titleIcon, { cls: "gi--32" })}<span>${title}</span></h1>
    <div class="mk-top-r">
      <button class="mk-classpill mk-classpill--top gi-host" type="button" aria-label="Đổi lớp, đang ở 10A3">${I("doi-lop", { cls: "gi--20" })}<span>10A3</span></button>
      <button class="mk-ibtn gi-host mk-bell" type="button" aria-label="Thông báo, 2 mới">${I("thong-bao")}<i aria-hidden="true"></i></button>
      ${avatar(user, 1)}
    </div>
  </header>
  <main class="mk-content">${body}</main>
  <p class="mk-demo-note">${I("goi-y", { cls: "gi--16" })} Dữ liệu minh họa · tên giả</p>
</div>
<nav class="mk-bottom" aria-label="Điều hướng nhanh">${bottom}</nav>
</div>`;
  };

  const page = (s, inner) => `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${s.title} — mock GreenEdu</title>
${[400,600,700,800].map((n)=>`<link rel="stylesheet" href="../../../../node_modules/@fontsource/be-vietnam-pro/${n}.css">`).join("")}
<link rel="stylesheet" href="../../icons/greenedu-icons.css"><link rel="stylesheet" href="../mock.css">
</head><body class="mk-body">${inner}</body></html>
`;

  // ——— 1. Đăng nhập ———
  const login = `<div class="mk-login">
  <section class="mk-login-hero" aria-hidden="true">
    <div class="mk-login-brand">${I("vuon-cua-lop", { cls: "gi--48" })}<b>GreenEdu</b></div>
    <p class="mk-login-tag">Vườn tri thức</p>
    <ol class="mk-levels">${[1, 2, 3, 4, 5].map((n) => `<li>${lv(n)}<span>${LEVELS[n - 1]}</span></li>`).join("")}</ol>
  </section>
  <section class="mk-login-card" aria-labelledby="login-h">
    <ol class="mk-levels mk-levels--m" aria-hidden="true">${[1, 2, 3, 4, 5].map((n) => `<li>${lv(n)}</li>`).join("")}</ol>
    <div class="mk-login-brand mk-login-brand--m">${I("vuon-cua-lop", { cls: "gi--32" })}<b>GreenEdu</b></div>
    <h1 id="login-h">Đăng nhập</h1>
    ${chips([["hoc-sinh", "Học sinh"], ["lop-cua-toi", "Giáo viên"]], 0, "Vai trò")}
    <label class="mk-field">${I("tai-khoan")}<span class="sr-only">Tài khoản</span><input placeholder="Tài khoản" autocomplete="username" value="hs.10a3.nhien"></label>
    <label class="mk-field">${I("khoa")}<span class="sr-only">Mật khẩu</span><input type="password" placeholder="Mật khẩu" autocomplete="current-password" value="••••••••"><button class="mk-ibtn mk-ibtn--ghost" type="button" aria-label="Hiện mật khẩu" title="Hiện mật khẩu">${I("xem-bai")}</button></label>
    <button class="mk-btn mk-btn--primary mk-btn--block on-dark gi-host" type="button">${I("dang-nhap")}Vào vườn</button>
    <button class="mk-link" type="button">${I("goi-y", { cls: "gi--16" })}Quên mật khẩu</button>
  </section>
</div>`;

  // ——— 2. Tổng quan học sinh ———
  const dash = `
<section class="mk-hero" aria-label="Cây của em">
  <div class="mk-hero-tree">${lv(3, "mk-lv mk-lv--hero")}</div>
  <div class="mk-hero-body">
    <p class="mk-kicker">${I("vuon-cua-toi", { cls: "gi--20" })}Cấp 3</p>
    <h2>Cây Non</h2>
    <div class="mk-progress" role="progressbar" aria-label="Tới Đơm Hoa" aria-valuenow="72" aria-valuemin="0" aria-valuemax="100"><i style="width:72%"></i></div>
    <p class="mk-progress-cap">${I("thoi-gian-hoc", { cls: "gi--16" })}4g20 / 6g ${I("di-tiep", { cls: "gi--16" })} ${lv(4, "mk-lv mk-lv--xs")} Đơm Hoa</p>
  </div>
  <button class="mk-btn mk-btn--primary mk-btn--lg on-dark gi-host" type="button">${I("tiep-tuc")}Học tiếp</button>
</section>
<div class="mk-stats">
  ${stat("thoi-gian-hoc", "12", "giờ", "Học")}${stat("so-cau-da-lam", "248", "", "Đã làm")}${stat("ty-le-dung", "82", "%", "Đúng")}${stat("cau-can-sua", "9", "", "Cần sửa", "mk-stat--warn")}
</div>
<div class="mk-cols">
  <section class="mk-card" aria-labelledby="today-h">
    <h2 class="mk-h2" id="today-h">${I("mat-troi", { cls: "gi--20" })}Hôm nay</h2>
    <div class="mk-tiles">
      <a class="mk-tile gi-host" href="#">${I("luyen-tap", { cls: "gi--48" })}<b>Chương 3</b><span class="mk-meter"><i style="width:40%"></i></span><small>8/20</small></a>
      <a class="mk-tile mk-tile--warn gi-host" href="#">${I("cau-can-sua", { cls: "gi--48" })}<b>Sửa sai</b><small>9 câu</small></a>
      <a class="mk-tile gi-host" href="#">${I("san-thuong", { cls: "gi--48" })}<b>Săn thưởng</b><small>${I("ve-kiem-tra", { cls: "gi--16" })} ×2</small></a>
    </div>
  </section>
  <section class="mk-card" aria-labelledby="class-h">
    <h2 class="mk-h2" id="class-h">${I("vuon-cua-lop", { cls: "gi--20" })}Trong lớp</h2>
    <ul class="mk-badges">
      <li class="is-achieved gi-host" tabindex="0">${I("top-10", { cls: "gi--48" })}<b>#4</b><small>Top 10</small></li>
      <li class="gi-host" tabindex="0">${I("diem-cong", { cls: "gi--48" })}<b>+3</b><small>Điểm cộng</small></li>
      <li class="gi-host" tabindex="0">${I("cay-ra-hoa", { cls: "gi--48" })}<b>12</b><small>Ra hoa</small></li>
    </ul>
  </section>
</div>`;

  // ——— 3. Chương học / Luyện tập ———
  const CH = [["Mệnh đề", 40, 40, 92, "done"], ["Tập hợp", 36, 36, 88, "done"], ["Hàm số", 8, 20, 75, "live"], ["Hàm bậc hai", 0, 24, 0, "open"], ["Thống kê", 0, 18, 0, "lock"]];
  const chapterRows = CH.map(([n, d, t, p, st], i) => {
    const stp = st === "done" ? pill("da-duyet", "Xong", "ok") : st === "live" ? `<span class="mk-pill mk-pill--live is-live">${I("dang-hoc", { cls: "gi--16" })}Đang học</span>` : st === "lock" ? pill("khoa", "Khóa") : pill("mo", "Mở", "ok");
    const act = st === "lock" ? `<button class="mk-ibtn" type="button" disabled aria-label="Chương ${i + 1} đang khóa">${I("khoa")}</button>` : ib(st === "done" ? "lam-lai" : st === "live" ? "tiep-tuc" : "bat-dau", st === "done" ? "Luyện lại" : st === "live" ? "Tiếp tục" : "Bắt đầu", st === "live" ? "mk-ibtn--primary on-dark" : "");
    return `<li class="mk-chap ${i === 2 ? "is-on" : ""} ${st === "lock" ? "is-locked" : ""}"><span class="mk-chap-no">C${i + 1}</span><div class="mk-chap-body"><b>${n}</b><span class="mk-chap-meta">${I("so-cau-da-lam", { cls: "gi--16" })}${d}/${t}${p ? ` ${I("ty-le-dung", { cls: "gi--16" })}${p}%` : ""}</span><span class="mk-meter"><i style="width:${Math.round((d / t) * 100)}%"></i></span></div>${stp}${act}</li>`;
  }).join("");
  const practice = `
${chips(CH.map(([n, , , , st], i) => [null, `C${i + 1}`, st === "done" ? "da-duyet" : st === "lock" ? "khoa" : st === "live" ? "dang-hoc" : null]), 2, "Chọn chương")}
<div class="mk-cols mk-cols--practice">
  <section class="mk-card mk-card--list" aria-labelledby="chap-h"><h2 class="mk-h2" id="chap-h">${I("chuong-hoc", { cls: "gi--20" })}Chương</h2><ol class="mk-chaps">${chapterRows}</ol></section>
  <section class="mk-card mk-q" aria-labelledby="q-h">
    <header class="mk-q-head">
      <span class="mk-q-no" id="q-h">Câu 9<small>/20</small></span>
      <span class="mk-meter mk-meter--grow"><i style="width:45%"></i></span>
      <span class="mk-pill mk-pill--live is-live">${I("thoi-gian-hoc", { cls: "gi--16" })}18:42</span>
    </header>
    <p class="mk-q-text">Hàm số <var>y = 2x − 3</var> đồng biến trên khoảng nào?</p>
    <div class="mk-answers" role="radiogroup" aria-label="Phương án">
      ${["(−∞; 0)", "(0; +∞)", "ℝ", "(−3; +∞)"].map((a, i) => `<button type="button" role="radio" aria-checked="${i === 2}" class="mk-ans ${i === 2 ? "is-on" : ""}"><b>${"ABCD"[i]}</b><var>${a}</var></button>`).join("")}
    </div>
    <footer class="mk-q-foot">
      ${ib("goi-y", "Gợi ý")}
      ${ib("quay-lai", "Câu trước")}
      <button class="mk-btn mk-btn--primary on-dark gi-host" type="button">${I("di-tiep")}Câu sau</button>
    </footer>
  </section>
</div>`;

  // ——— 4. Khu vườn của lớp ———
  const podium = [1, 0, 2].map((idx) => {
    const [n, l, t, p] = PEOPLE[idx];
    const rank = idx + 1;
    return `<li class="mk-pod mk-pod--${rank}">${lv(l, "mk-lv mk-lv--pod")}${I("huy-chuong-" + rank, { cls: "gi--32", label: "Hạng " + rank })}<b>${n.split(" ").slice(-2).join(" ")}</b><span>${I("thoi-gian-hoc", { cls: "gi--16" })}${t}</span><i class="mk-pod-step" aria-hidden="true">${rank}</i></li>`;
  }).join("");
  const top = PEOPLE.slice(3, 10).map(([n, l, t], i) => `<li><span class="mk-rank">${i + 4}</span>${avatar(n, i)}<b>${n}</b>${lv(l, "mk-lv mk-lv--xs")}<span class="mk-num">${I("thoi-gian-hoc", { cls: "gi--16" })}${t}</span></li>`).join("");
  const EXTRA = [["Trịnh Gia Bảo", 2], ["Cao Ngọc Hân", 3], ["Phan Minh Thư", 1], ["Dương Quang Vinh", 2], ["Tạ Khánh Vy", 4], ["Lâm Tiến Đạt", 1]];
  const garden = PEOPLE.map(([n, l]) => [n, l]).concat(EXTRA)
    .map(([n, l]) => `<li title="${n} · ${LEVELS[l - 1]}">${lv(l, "mk-lv mk-lv--plot")}<span>${initials(n)}</span></li>`).join("");
  const classGarden = `
<div class="mk-row-between">
  ${chips([["chuong-hoc", "Tất cả"], [null, "C1"], [null, "C2"], [null, "C3"]], 0, "Phạm vi xếp hạng")}
  <div class="mk-mini-stats">
    <span title="Thành viên hoạt động">${I("thanh-vien-hoat-dong", { cls: "gi--20" })}<b>28</b>/34</span>
    <span title="Cây đã ra hoa">${I("cay-ra-hoa", { cls: "gi--20" })}<b>12</b></span>
    <span title="Kết Trái">${I("ket-trai", { cls: "gi--20" })}<b>5</b></span>
  </div>
</div>
<div class="mk-cols mk-cols--honor">
  <section class="mk-card mk-honor" aria-labelledby="top-h">
    <h2 class="mk-h2" id="top-h">${I("top-10", { cls: "gi--20" })}Top 10</h2>
    <ol class="mk-podium">${podium}</ol>
    <ol class="mk-toplist" start="4">${top}</ol>
  </section>
  <section class="mk-card mk-garden" aria-labelledby="g-h">
    <h2 class="mk-h2" id="g-h">${I("vuon-cua-lop", { cls: "gi--20" })}Vườn chung</h2>
    <div class="mk-legend">${[1, 2, 3, 4, 5].map((n) => `<span>${lv(n, "mk-lv mk-lv--xs")}${LEVELS[n - 1]}</span>`).join("")}</div>
    <ul class="mk-plots">${garden}</ul>
  </section>
</div>`;

  // ——— 5. Sổ tay sửa sai ———
  const MISS = [["C3", "Tập xác định của y = √(x − 1)", "B", "C", false], ["C3", "Đồ thị y = −x + 2 cắt trục tung tại", "A", "D", false], ["C2", "Số tập con của {1; 2; 3}", "C", "A", false], ["C1", "Phủ định của “∀x ∈ ℝ, x² ≥ 0”", "D", "B", true], ["C2", "A ∩ B với A = [1; 4], B = (2; 6)", "A", "C", true]];
  const notebook = `
<section class="mk-water" aria-label="Tiến độ tưới cây">
  ${I("cau-can-sua", { cls: "gi--48" })}
  <div class="mk-water-body"><b>Đã tưới 23<small>/32</small></b><div class="mk-progress mk-progress--water" role="progressbar" aria-label="Câu đã khắc phục" aria-valuenow="72" aria-valuemin="0" aria-valuemax="100"><i style="width:72%"></i></div></div>
  <div class="mk-stats mk-stats--2">${stat("cau-can-sua", "9", "", "Cần sửa", "mk-stat--warn")}${stat("cau-da-khac-phuc", "23", "", "Đã sửa", "mk-stat--ok")}</div>
</section>
<div class="mk-row-between">
  ${chips([["loc-chuong", "Tất cả"], [null, "C1"], [null, "C2"], [null, "C3"]], 0, "Lọc theo chương")}
  ${chips([["cau-can-sua", "Cần sửa"], ["cau-da-khac-phuc", "Đã sửa"]], 0, "Trạng thái")}
</div>
<ul class="mk-misses">${MISS.map(([c, q, pick, ok, done]) => `<li class="mk-miss ${done ? "is-done" : ""}">
  <span class="mk-tag">${c}</span>
  <p>${q}</p>
  <span class="mk-ab"><span class="mk-pill mk-pill--bad" title="Em chọn">${I("tu-choi", { cls: "gi--16" })}${pick}</span><span class="mk-pill mk-pill--ok" title="Đáp án">${I("da-duyet", { cls: "gi--16" })}${ok}</span></span>
  ${done ? pill("cau-da-khac-phuc", "Đã sửa", "ok") : `<span class="mk-acts">${ib("xem-bai", "Xem lời giải")}<button class="mk-btn mk-btn--primary on-dark gi-host" type="button">${I("lam-lai")}Làm lại</button></span>`}
</li>`).join("")}</ul>`;

  // ——— 6. Săn thưởng / Điểm cộng ———
  const HUNTS = [["Săn thưởng tuần 12", "C3", "mo", "Mở", "ok", "bat-dau", "Bắt đầu"], ["Kiểm tra online 15′", "C2", "cho-duyet", "Chờ duyệt", "warn", "xem-bai", "Xem bài"], ["Săn thưởng tuần 11", "C2", "da-duyet", "+1 đã duyệt", "ok", "xem-bai", "Xem bài"], ["Săn thưởng tuần 13", "C4", "khoa", "Cần Đơm Hoa", "", null, null]];
  const LEDGER = [["+1", "Top 10 online", "C2", "da-duyet", "Đã duyệt", "ok"], ["+1", "Săn thưởng tuần 11", "C2", "da-duyet", "Đã duyệt", "ok"], ["+1", "Nhóm xuất sắc", "C1", "da-duyet", "Đã duyệt", "ok"], ["+1", "Kiểm tra online 15′", "C2", "cho-duyet", "Chờ duyệt", "warn"]];
  const hunt = `
<section class="mk-tickets" aria-label="Vé kiểm tra">
  <div class="mk-ticket-row">${I("ve-kiem-tra", { cls: "gi--48", label: "Vé còn" })}${I("ve-kiem-tra", { cls: "gi--48", label: "Vé còn" })}<span class="mk-ticket-empty">${I("ve-kiem-tra", { cls: "gi--48", label: "Vé đã dùng" })}</span></div>
  <div><b class="mk-big">2<small>/3 vé</small></b><p class="mk-sub">${lv(3, "mk-lv mk-lv--xs")}Cây Non ${I("di-tiep", { cls: "gi--16" })} ${lv(4, "mk-lv mk-lv--xs")} +1 vé</p></div>
  <span class="mk-pill mk-pill--warn mk-rule">${I("canh-bao-roi-tab", { cls: "gi--16" })}Rời tab 3 lần = tự nộp<button class="mk-info" type="button" aria-label="Quy định rời tab" title="Rời tab hoặc không tương tác quá lâu: nhắc 2 lần, lần 3 tự nộp bài. Lượt tự nộp vẫn được xét Top 10.">i</button></span>
</section>
<div class="mk-cols">
  <section class="mk-card" aria-labelledby="hunt-h">
    <h2 class="mk-h2" id="hunt-h">${I("san-thuong", { cls: "gi--20" })}Bài săn thưởng</h2>
    <ul class="mk-hunts">${HUNTS.map(([t, c, ic, st, k, a, al]) => `<li class="${ic === "khoa" ? "is-locked" : ""}">${I(ic === "khoa" ? "khoa" : "kiem-tra-online", { cls: "gi--32" })}<div><b>${t}</b><span class="mk-tag">${c}</span></div><span class="mk-pill ${k ? "mk-pill--" + k : ""}">${I(ic, { cls: "gi--16" })}${st}</span>${a ? (a === "bat-dau" ? `<button class="mk-btn mk-btn--primary on-dark gi-host" type="button">${I(a)}${al}</button>` : ib(a, al)) : `<span class="mk-ibtn-spacer"></span>`}</li>`).join("")}</ul>
  </section>
  <section class="mk-card" aria-labelledby="pts-h">
    <div class="mk-row-between"><h2 class="mk-h2" id="pts-h">${I("diem-cong", { cls: "gi--20" })}Điểm cộng <b class="mk-h2-num">+3</b></h2>
      <label class="mk-select">${I("loc-chuong", { cls: "gi--20" })}<span class="sr-only">Chương</span><select><option>Tất cả</option><option>C1</option><option>C2</option></select>${I("mo-rong", { cls: "gi--16" })}</label></div>
    <ul class="mk-ledger">${LEDGER.map(([p, t, c, ic, st, k]) => `<li><b class="mk-plus">${p}</b><span>${t}</span><span class="mk-tag">${c}</span><span class="mk-pill mk-pill--${k}">${I(ic, { cls: "gi--16" })}${st}</span></li>`).join("")}</ul>
  </section>
</div>`;

  // ——— 7. Quản lý học sinh ———
  const STATES = [["dang-hoc", "Đang học", "live"], ["tam-dung", "Tạm dừng", ""], ["offline", "Offline", "bad"], ["dang-hoc", "Đang học", "live"], ["canh-bao-roi-tab", "Rời tab 2", "warn"], ["tam-dung", "Tạm dừng", ""], ["khoa", "Khóa", ""], ["dang-hoc", "Đang học", "live"]];
  const rows = PEOPLE.slice(0, 8).map(([n, l, t, p], i) => {
    const [sic, st, k] = STATES[i];
    return `<tr>
  <th scope="row"><span class="mk-who">${avatar(n, i)}<b>${n}</b></span></th>
  <td data-l="Cấp"><span class="mk-lvcell">${lv(l, "mk-lv mk-lv--xs")}${LEVELS[l - 1]}</span></td>
  <td data-l="Học" class="mk-num">${t}</td>
  <td data-l="Đã làm" class="mk-num">${180 - i * 14}</td>
  <td data-l="Đúng" class="mk-num">${p}%</td>
  <td data-l="Cần sửa" class="mk-num ${i % 3 === 2 ? "mk-warn-num" : ""}">${(i * 3) % 11}</td>
  <td data-l="Trạng thái"><span class="mk-pill ${k ? "mk-pill--" + k : ""} ${k === "live" ? "is-live" : ""}">${I(sic, { cls: "gi--16" })}${st}</span></td>
  <td class="mk-row-acts">${ib("xem-bai", "Xem " + n)}${ib("sua", "Sửa " + n)}${ib(sic === "khoa" ? "mo" : "khoa", (sic === "khoa" ? "Mở khóa " : "Khóa ") + n)}</td>
</tr>`;
  }).join("");
  const thIcon = (id, l) => `<th scope="col"><span class="mk-th" title="${l}">${I(id, { cls: "gi--20" })}<span>${l}</span></span></th>`;
  const teacher = `
<div class="mk-stats">
  ${stat("hoc-sinh", "34", "", "Học sinh")}${stat("thanh-vien-hoat-dong", "28", "", "Hoạt động", "mk-stat--ok")}${stat("ty-le-dung", "84", "%", "Đúng")}${stat("cho-duyet", "3", "", "Chờ duyệt", "mk-stat--warn")}
</div>
<section class="mk-card mk-approve" aria-labelledby="ap-h">
  <h2 class="mk-h2" id="ap-h">${I("cho-duyet", { cls: "gi--20" })}Chờ duyệt <b class="mk-h2-num">3</b></h2>
  <ul>${[["Lê Bảo Ngọc", "+1 Top 10 online", "C2"], ["Phạm Gia Huy", "+1 Săn thưởng tuần 12", "C3"], ["Võ Thanh Trúc", "+1 Nhóm xuất sắc", "C3"]].map(([n, r, c], i) => `<li>${avatar(n, i + 2)}<b>${n}</b><span>${I("diem-cong", { cls: "gi--16" })}${r}</span><span class="mk-tag">${c}</span><span class="mk-acts">${ib("tu-choi-nut", "Từ chối " + n, "mk-ibtn--bad")}${ib("duyet", "Duyệt " + n, "mk-ibtn--primary on-dark")}</span></li>`).join("")}</ul>
</section>
<section class="mk-card mk-card--table" aria-labelledby="st-h">
  <div class="mk-toolbar">
    <h2 class="mk-h2" id="st-h">${I("hoc-sinh", { cls: "gi--20" })}Học sinh</h2>
    <label class="mk-field mk-field--search">${I("tim", { cls: "gi--20" })}<span class="sr-only">Tìm học sinh</span><input placeholder="Tìm tên"></label>
    <label class="mk-select">${I("loc-chuong", { cls: "gi--20" })}<span class="sr-only">Lọc theo chương</span><select><option>Tất cả chương</option><option>C1</option><option>C2</option><option>C3</option></select>${I("mo-rong", { cls: "gi--16" })}</label>
    <span class="mk-toolbar-acts">${ib("xuat-excel", "Xuất Excel")}${ib("tai-len", "Nhập danh sách")}<button class="mk-btn mk-btn--primary on-dark gi-host" type="button">${I("them-moi")}Thêm</button></span>
  </div>
  <table class="mk-table">
    <thead><tr><th scope="col">Học sinh</th><th scope="col">Cấp</th>${thIcon("thoi-gian-hoc", "Học")}${thIcon("so-cau-da-lam", "Đã làm")}${thIcon("ty-le-dung", "Đúng")}${thIcon("cau-can-sua", "Cần sửa")}<th scope="col">Trạng thái</th><th scope="col"><span class="sr-only">Thao tác</span></th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</section>`;

  const S = Object.fromEntries(screens.map((s) => [s.id, s]));
  w("mocks/screens/dang-nhap.html", page(S["dang-nhap"], login));
  w("mocks/screens/tong-quan-hoc-sinh.html", page(S["tong-quan-hoc-sinh"], shell({ role: "student", active: "tong-quan", title: "Tổng quan", titleIcon: "vuon-cua-toi", body: dash, user: "Nguyễn An Nhiên" })));
  w("mocks/screens/chuong-hoc-luyen-tap.html", page(S["chuong-hoc-luyen-tap"], shell({ role: "student", active: "luyen-tap", title: "Luyện tập", titleIcon: "luyen-tap", body: practice, user: "Nguyễn An Nhiên" })));
  w("mocks/screens/khu-vuon-lop.html", page(S["khu-vuon-lop"], shell({ role: "student", active: "vuon-lop", title: "Vườn lớp", titleIcon: "vuon-cua-lop", body: classGarden, user: "Nguyễn An Nhiên" })));
  w("mocks/screens/so-tay-sua-sai.html", page(S["so-tay-sua-sai"], shell({ role: "student", active: "sua-sai", title: "Sửa sai", titleIcon: "so-tay-sua-sai", body: notebook, user: "Nguyễn An Nhiên" })));
  w("mocks/screens/san-thuong-diem-cong.html", page(S["san-thuong-diem-cong"], shell({ role: "student", active: "san-thuong", title: "Săn thưởng", titleIcon: "san-thuong", body: hunt, user: "Nguyễn An Nhiên" })));
  w("mocks/screens/quan-ly-hoc-sinh.html", page(S["quan-ly-hoc-sinh"], shell({ role: "teacher", active: "hoc-sinh", title: "Học sinh", titleIcon: "hoc-sinh", body: teacher, user: "Cô Hạnh" })));
}
