// Nguồn bộ icon "Vườn tri thức" cho GreenEdu — 28/11/2026.
// Lưới 24×24, vùng vẽ 2–22, nét currentColor bo tròn. Lớp tô (class) được build.mjs
// đổi thành style dùng CSS variable:
//   f  = mảng tô phụ (--gi-fill) + giữ nét      fo = mảng tô phụ, không nét
//   a  = màu nhấn (--gi-accent) + giữ nét       ao = màu nhấn, không nét
//   c  = tô đặc currentColor, không nét
//   gold / silver / bronze / fruit = màu vinh danh, giữ nét
// old: tên export cũ trong src/icons.tsx mà icon này thay thế (có thể nhiều icon mới chung một tên cũ).

const gear = () => {
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const at = (deg, r) => {
      const t = a + (deg * Math.PI) / 180;
      return [12 + r * Math.cos(t), 12 + r * Math.sin(t)];
    };
    pts.push(at(-17, 7), at(-9, 9.4), at(9, 9.4), at(17, 7));
  }
  const d = "M" + pts.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join("L") + "Z";
  return `<path class="f" d="${d}"/><circle cx="12" cy="12" r="3"/>`;
};

const flower = () => {
  let s = "";
  for (let i = 0; i < 5; i++) {
    const deg = -90 + i * 72;
    const t = (deg * Math.PI) / 180;
    const cx = 12 + 3.1 * Math.cos(t);
    const cy = 8.6 + 3.1 * Math.sin(t);
    s += `<ellipse class="f" cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" rx="2.2" ry="2.9" transform="rotate(${deg + 90} ${cx.toFixed(2)} ${cy.toFixed(2)})"/>`;
  }
  return `<path d="M12 12.5V21"/><path class="f" d="M12 18c0-2.2 1.6-3.7 4.2-3.7 0 2.2-1.6 3.7-4.2 3.7z"/>${s}<circle class="a" cx="12" cy="8.6" r="1.9"/>`;
};

const sunRays = () => {
  let s = "";
  for (let i = 0; i < 8; i++) {
    const t = (i * Math.PI) / 4;
    const p = (r) => `${(12 + r * Math.cos(t)).toFixed(2)} ${(12 + r * Math.sin(t)).toFixed(2)}`;
    s += `M${p(7)}L${p(9.2)}`;
  }
  return `<circle class="a" cx="12" cy="12" r="4"/><path d="${s}"/>`;
};

const medal = (cls, digit) =>
  `<path d="M8 3l3 6.6M16 3l-3 6.6"/><path class="fo" d="M8 3h2.6l2 4.4L11 9.6z"/><circle class="${cls}" cx="12" cy="15" r="6"/>${digit}`;

const doc = (extra) =>
  `<path class="f" d="M11 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v3"/><path d="M13 3v5h5"/>${extra}`;

export const groups = [
  { id: "nav", name: "Điều hướng" },
  { id: "metric", name: "Số liệu" },
  { id: "status", name: "Trạng thái" },
  { id: "action", name: "Hành động" },
  { id: "honor", name: "Vinh danh" },
  { id: "util", name: "Tiện ích & trang trí" },
];

export const icons = [
  // ——— Điều hướng ———
  { id: "tong-quan", label: "Tổng quan", group: "nav", old: ["LayoutDashboard"], anim: "sway",
    body: `<rect class="f" x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><path d="M17.25 21v-4.5"/><path class="f" d="M17.25 17.5c0-2.2 1.5-3.7 3.75-3.7 0 2.2-1.5 3.7-3.75 3.7z"/><path class="f" d="M17.25 18.5c0-1.9-1.2-3.1-3.2-3.1 0 1.9 1.2 3.1 3.2 3.1z"/>` },
  { id: "lop-cua-toi", label: "Lớp học của tôi", group: "nav", old: ["ClassroomIcon"],
    body: `<rect class="f" x="3" y="3.5" width="18" height="12.5" rx="2"/><path d="M8.5 20.5l2-4.5M15.5 20.5l-2-4.5"/><path d="M12 13.5v-3.5"/><path d="M12 11.2c0-2-1.2-3.2-3.3-3.2 0 2 1.2 3.2 3.3 3.2zM12 10.4c0-2 1.2-3.2 3.3-3.2 0 2-1.2 3.2-3.3 3.2z"/>` },
  { id: "chuong-hoc", label: "Chương học", group: "nav", old: ["Books"], anim: "sway",
    body: `<rect x="3.5" y="4" width="4.5" height="16.5" rx="1.2"/><rect class="f" x="8" y="6.5" width="4.5" height="14" rx="1.2"/><path d="M14.2 7.4l3.9-1 3.5 13.3-3.9 1z"/><path d="M3.5 8h4.5M8 10h4.5M15.2 11.2l3.9-1"/>` },
  { id: "luyen-tap", label: "Luyện tập", group: "nav", old: ["BookOpen"],
    body: `<path class="fo" d="M3 5.5C5.5 4.5 8.5 4.6 12 6.5V20c-3.5-1.9-6.5-2-9-1z"/><path d="M3 5.5C5.5 4.5 8.5 4.6 12 6.5c3.5-1.9 6.5-2 9-1V19c-2.5-1-5.5-.9-9 1-3.5-1.9-6.5-2-9-1zM12 6.5V20"/><path d="M14.5 12.2l1.6 1.6 3-3.1"/>` },
  { id: "on-tap", label: "Ôn tập", group: "nav", old: ["GraduationCap"],
    body: `<path class="f" d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c0 1.6 2.7 3 6 3s6-1.4 6-3v-5M22 9v5.5"/>` },
  { id: "kiem-tra", label: "Kiểm tra", group: "nav", old: ["ClipboardList"],
    body: `<rect x="5" y="4" width="14" height="17" rx="2"/><rect class="f" x="9" y="2.5" width="6" height="3.5" rx="1"/><path d="M8.5 11.5l1.5 1.5 2.5-2.5M14.5 12h1M8.5 16.5h7"/>` },
  { id: "kiem-tra-online", label: "Kiểm tra online", group: "nav", old: ["ClipboardList"],
    body: `<rect class="f" x="3" y="4" width="18" height="12" rx="2"/><path d="M9 20h6M12 16v4"/><path d="M9 10l2 2 4-4"/>` },
  { id: "san-thuong", label: "Săn thưởng", group: "nav", old: ["Target"], anim: "pop",
    body: `<circle cx="11" cy="13" r="8"/><circle class="f" cx="11" cy="13" r="4.5"/><circle class="c" cx="11" cy="13" r="1.5"/><path d="M11 13l7.5-7.5M16 3.5v4.5h4.5"/>` },
  { id: "so-tay-sua-sai", label: "Sổ tay sửa sai", group: "nav", old: ["Notebook"],
    body: `<rect x="5" y="3" width="14" height="18" rx="2"/><path class="fo" d="M9 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h2z"/><path d="M9 3v18M12.5 8h3.5"/><path d="M12.3 13.2l1.6 1.6 3.1-3.2"/>` },
  { id: "vuon-cua-toi", label: "Khu vườn của tôi", group: "nav", old: ["Sprout"], anim: "sway",
    body: `<path class="f" d="M6.5 14h11l-1.3 6.2a1 1 0 0 1-1 .8H8.8a1 1 0 0 1-1-.8z"/><path d="M12 14V9.5"/><path class="f" d="M12 10.5C12 7.4 10 5.3 6.5 5.3c0 3.1 2 5.2 5.5 5.2zM12 9.5c0-2.7 1.8-4.7 5-4.7 0 2.8-1.8 4.7-5 4.7z"/>` },
  { id: "vuon-cua-lop", label: "Khu vườn của lớp", group: "nav", old: ["TreeIcon"], anim: "sway",
    body: `<path class="f" d="M12 3a4.8 4.8 0 0 1 4.6 6.3A3.5 3.5 0 0 1 15.2 16H8.8a3.5 3.5 0 0 1-1.4-6.7A4.8 4.8 0 0 1 12 3z"/><path d="M12 16v5M12 13.5l-2-1.8M2 21h20M3.5 21v-4.5L5 15l1.5 1.5V21M17.5 21v-4.5L19 15l1.5 1.5V21M3.5 18.8h3M17.5 18.8h3"/>` },
  { id: "hoat-dong-nhom", label: "Hoạt động nhóm", group: "nav", old: ["Users"],
    body: `<circle class="f" cx="12" cy="7.5" r="3.2"/><circle cx="5.3" cy="9.5" r="2.2"/><circle cx="18.7" cy="9.5" r="2.2"/><path d="M6.5 20v-.8a5.5 5.5 0 0 1 11 0v.8M2 19v-.4a3.6 3.6 0 0 1 4.1-3.6M22 19v-.4a3.6 3.6 0 0 0-4.1-3.6"/>` },
  { id: "ngan-hang-cau-hoi", label: "Ngân hàng câu hỏi", group: "nav", old: ["Books"],
    body: `<path d="M8 3h10a2 2 0 0 1 2 2v12"/><rect class="f" x="4" y="6" width="13" height="15" rx="2"/><path d="M8.7 11.3a1.85 1.85 0 1 1 2.7 1.6c-.6.3-.9.7-.9 1.3M10.5 17.3h.01"/>` },
  { id: "hoc-sinh", label: "Học sinh", group: "nav", old: ["Users", "UserCircle"],
    body: `<circle class="f" cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/><path class="f" d="M17.5 4.5c0-1.4 1-2.4 2.6-2.4 0 1.4-1 2.4-2.6 2.4z"/>` },
  { id: "quan-ly-lop", label: "Quản lý lớp", group: "nav", old: ["Settings"],
    body: `<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M7 9h10M7 15h10"/><circle class="f" cx="10" cy="9" r="2"/><circle class="f" cx="14.5" cy="15" r="2"/>` },
  { id: "cai-dat", label: "Cài đặt chung", group: "nav", old: ["Settings"], anim: "spin", body: gear() },
  { id: "menu-them", label: "Thêm", group: "nav", old: [],
    body: `<rect class="f" x="3" y="3" width="18" height="18" rx="5"/><circle class="c" cx="7.5" cy="12" r="1.4"/><circle class="c" cx="12" cy="12" r="1.4"/><circle class="c" cx="16.5" cy="12" r="1.4"/>` },

  // ——— Số liệu ———
  { id: "thoi-gian-hoc", label: "Thời gian học", group: "metric", old: ["Clock3"],
    body: `<circle class="f" cx="12" cy="13" r="8"/><path d="M12 9v4l2.6 1.8M10 2.5h4M12 2.5V5M19 6l1.3-1.3"/>` },
  { id: "so-cau-da-lam", label: "Số câu đã làm", group: "metric", old: ["ClipboardList", "Check"],
    body: `<rect class="fo" x="2.5" y="3.5" width="5" height="5" rx="1.2"/><rect class="fo" x="2.5" y="15.5" width="5" height="5" rx="1.2"/><path d="M3.5 6l1.2 1.2L7 4.8M3.5 18l1.2 1.2L7 16.8M10.5 6h10M10.5 12h10M10.5 18h10M4 12h2"/>` },
  { id: "ty-le-dung", label: "Tỷ lệ đúng", group: "metric", old: ["Target"],
    body: `<circle cx="12" cy="12" r="9"/><path class="f" d="M12 12V3a9 9 0 0 1 8.6 11.7z"/>` },
  { id: "cau-can-sua", label: "Câu cần sửa", group: "metric", old: ["RotateCcw"],
    body: `<path d="M10 21v-5.5c0-3-1.7-5-4.8-5"/><path class="a" d="M5.2 10.5C2.8 10.5 1.6 12 2 14.3c2.3.2 3.6-1.3 3.2-3.8z"/><path class="f" d="M10 15.5c0-2.6 1.6-4.4 4.6-4.4 0 2.6-1.6 4.4-4.6 4.4z"/><path class="f" d="M18 3c1.7 2.2 2.7 3.6 2.7 5a2.7 2.7 0 0 1-5.4 0c0-1.4 1-2.8 2.7-5z"/>` },
  { id: "cau-da-khac-phuc", label: "Câu đã khắc phục", group: "metric", old: ["CheckCircle2"],
    body: `<path d="M9 21v-8"/><path class="f" d="M9 14C9 10.8 7 8.7 3.5 8.7c0 3.2 2 5.3 5.5 5.3zM9 16.5c0-3 2-5 5.3-5 0 3-2 5-5.3 5z"/><circle class="a" cx="17.5" cy="6.5" r="4"/><path d="M15.8 6.5l1.2 1.2 2.3-2.4M4 21h10"/>` },
  { id: "cay-ra-hoa", label: "Cây đã ra hoa", group: "metric", old: ["Flower2"], anim: "pop", body: flower() },
  { id: "thanh-vien-hoat-dong", label: "Thành viên hoạt động", group: "metric", old: ["Users"],
    body: `<circle class="f" cx="9" cy="8" r="3.6"/><path d="M2.5 20.5a6.5 6.5 0 0 1 13 0M16.5 14.6a5 5 0 0 1 5 5"/><circle class="a" cx="18.5" cy="7" r="2.6"/>` },
  { id: "diem-cong", label: "Điểm cộng", group: "metric", old: ["Sparkles"], anim: "pop",
    body: `<circle class="a" cx="11" cy="13" r="7.5"/><path d="M11 9.8v6.4M7.8 13h6.4M19.5 2.5v4M17.5 4.5h4"/>` },
  { id: "ve-kiem-tra", label: "Vé kiểm tra", group: "metric", old: ["Ticket"],
    body: `<path class="f" d="M4 6h16a1 1 0 0 1 1 1v3a2 2 0 0 0 0 4v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3a2 2 0 0 0 0-4V7a1 1 0 0 1 1-1z"/><path d="M15 6v2M15 11v2M15 16v2"/><path d="M7.5 14.5c0-2 1.3-3.3 3.5-3.3 0 2-1.3 3.3-3.5 3.3z"/>` },

  // ——— Trạng thái ———
  { id: "dang-hoc", label: "Đang học", group: "status", old: ["Play"], anim: "pulse",
    body: `<circle class="f" cx="12" cy="12" r="9"/><path class="c" d="M10 8.3v7.4l5.8-3.7z"/>` },
  { id: "tam-dung", label: "Tạm dừng", group: "status", old: ["Pause"],
    body: `<circle class="f" cx="12" cy="12" r="9"/><path d="M10 9v6M14 9v6"/>` },
  { id: "da-nop", label: "Đã nộp", group: "status", old: ["Send"],
    body: `<path class="f" d="M21 3L3 10.5l7 2.5 2.5 7z"/><path d="M21 3L10 13"/>` },
  { id: "cho-duyet", label: "Chờ duyệt", group: "status", old: ["History", "Clock3"],
    body: `<path d="M6.5 3h11M6.5 21h11M8 3c0 4.2 4 5 4 9s-4 4.8-4 9M16 3c0 4.2-4 5-4 9s4 4.8 4 9"/><path class="ao" d="M8.8 20.2c.6-2.4 3.2-3.6 3.2-3.6s2.6 1.2 3.2 3.6z"/><path class="ao" d="M9.6 6.5h4.8c-.6 1.4-2.4 2.3-2.4 2.3s-1.8-.9-2.4-2.3z"/>` },
  { id: "da-duyet", label: "Đã duyệt", group: "status", old: ["CheckCircle2"],
    body: `<circle class="f" cx="12" cy="12" r="9"/><path d="M8 12.5l2.8 2.8L16.5 9.5"/>` },
  { id: "tu-choi", label: "Từ chối", group: "status", old: ["X"],
    body: `<circle class="a" cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>` },
  { id: "khoa", label: "Khóa", group: "status", old: ["LockKeyhole"],
    body: `<rect class="f" x="5" y="10.5" width="14" height="10.5" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5M12 14.5v2.5"/>` },
  { id: "mo", label: "Mở", group: "status", old: ["LockKeyhole"],
    body: `<rect class="f" x="5" y="10.5" width="14" height="10.5" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 7.8-1.3M12 14.5v2.5"/>` },
  { id: "canh-bao-roi-tab", label: "Cảnh báo rời tab", group: "status", old: ["EyeOff"],
    body: `<path class="ao" d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2H3z"/><path d="M13 19H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4M3 9h18M15 16h7M19 13l3 3-3 3"/>` },
  { id: "offline", label: "Mất kết nối", group: "status", old: [],
    body: `<path class="f" d="M7 18.5a4.2 4.2 0 0 1-.6-8.4A6 6 0 0 1 17.6 9a4.8 4.8 0 0 1 .9 9.5z"/><path d="M3 3l18 18"/>` },

  // ——— Hành động ———
  { id: "bat-dau", label: "Bắt đầu", group: "action", old: ["Play"],
    body: `<path class="f" d="M8 5.6v12.8a1 1 0 0 0 1.5.9l10-6.4a1 1 0 0 0 0-1.8l-10-6.4A1 1 0 0 0 8 5.6z"/>` },
  { id: "tiep-tuc", label: "Tiếp tục", group: "action", old: ["ArrowRight"],
    body: `<circle class="f" cx="12" cy="12" r="9"/><path d="M8 12h8M12.8 8.5l3.5 3.5-3.5 3.5"/>` },
  { id: "nop-bai", label: "Nộp bài", group: "action", old: ["Send"],
    body: `<path class="f" d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M12 17.5v-6.5M9.5 13.5L12 11l2.5 2.5"/>` },
  { id: "xem-bai", label: "Xem bài", group: "action", old: ["Eye"],
    body: `<path class="f" d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>` },
  { id: "duyet", label: "Duyệt", group: "action", old: ["Check"],
    body: `<rect class="fo" x="3" y="3" width="18" height="18" rx="5"/><path d="M7.5 12.3l3 3 6-6.3"/>` },
  { id: "tu-choi-nut", label: "Từ chối (nút)", group: "action", old: ["X"],
    body: `<rect class="fo" x="3" y="3" width="18" height="18" rx="5"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7"/>` },
  { id: "tai-len-word", label: "Tải lên Word", group: "action", old: ["Upload"],
    body: doc(`<path d="M7 10.5l1 4 1.5-3 1.5 3 1-4M18 21v-7M15 17l3-3 3 3"/>`) },
  { id: "xuat-excel", label: "Xuất Excel", group: "action", old: ["Download"],
    body: doc(`<path d="M7 10.5h5v5H7zM9.5 10.5v5M7 13h5M18 14v7M15 18l3 3 3-3"/>`) },
  { id: "xuat-word", label: "Xuất Word", group: "action", old: ["Download"],
    body: doc(`<path d="M7 10.5l1 4 1.5-3 1.5 3 1-4M18 14v7M15 18l3 3 3-3"/>`) },
  { id: "them-moi", label: "Thêm mới", group: "action", old: ["Plus"],
    body: `<path d="M12 5v14M5 12h14"/>` },
  { id: "sua", label: "Sửa", group: "action", old: ["Pencil"],
    body: `<path class="f" d="M4 20l1-4.5L15.5 5a2.1 2.1 0 0 1 3 3L8 18.5z"/><path d="M13.5 7l3 3M13 20h7"/>` },
  { id: "xoa", label: "Xóa", group: "action", old: ["Trash2"],
    body: `<path class="f" d="M6 7h12l-1 13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1z"/><path d="M4 7h16M9 7V4.5h6V7M10 11v6M14 11v6"/>` },
  { id: "tim", label: "Tìm", group: "action", old: ["Search"],
    body: `<circle class="f" cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L20.5 20.5"/>` },
  { id: "loc-chuong", label: "Lọc theo chương", group: "action", old: ["ChevronDown"],
    body: `<path class="f" d="M4 5h16l-6 7.5V19l-4 2v-8.5z"/>` },
  { id: "doi-lop", label: "Đổi lớp", group: "action", old: ["ArrowsDownUp"],
    body: `<path d="M4 8h13M13.5 4.5L17 8l-3.5 3.5M20 16H7M10.5 12.5L7 16l3.5 3.5"/>` },
  { id: "dang-xuat", label: "Đăng xuất", group: "action", old: ["LogOut"],
    body: `<path class="f" d="M4 6a2 2 0 0 1 2-2h4v16H6a2 2 0 0 1-2-2z"/><path d="M10 12h10M16.5 8.5L20 12l-3.5 3.5"/>` },
  { id: "dang-nhap", label: "Đăng nhập", group: "action", old: [],
    body: `<path class="f" d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4z"/><path d="M3 12h11M10.5 8.5L14 12l-3.5 3.5"/>` },
  { id: "tai-len", label: "Tải lên", group: "action", old: ["Upload"],
    body: `<path class="fo" d="M4 15h16v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3M12 15V4M7.5 8.5L12 4l4.5 4.5"/>` },
  { id: "tai-xuong", label: "Tải xuống", group: "action", old: ["Download"],
    body: `<path class="fo" d="M4 15h16v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3M12 4v11M7.5 10.5L12 15l4.5-4.5"/>` },
  { id: "gui", label: "Gửi", group: "action", old: ["Send"],
    body: `<path class="f" d="M21 3L3 10.5l7 2.5 2.5 7z"/><path d="M21 3L10 13"/>` },

  // ——— Vinh danh ———
  { id: "cup", label: "Cúp", group: "honor", old: ["Trophy"], anim: "pop",
    body: `<path class="gold" d="M7 3.5h10V9a5 5 0 0 1-10 0z"/><path d="M7 5.5H4.5c0 2.8 1.2 4.6 3 5M17 5.5h2.5c0 2.8-1.2 4.6-3 5M12 14v4M8 21h8M9.5 18h5"/>` },
  { id: "huy-chuong-1", label: "Huy chương hạng 1", group: "honor", old: ["Medal"],
    body: medal("gold", `<path d="M11 13.4l1.5-1v5.3"/>`) },
  { id: "huy-chuong-2", label: "Huy chương hạng 2", group: "honor", old: ["Medal"],
    body: medal("silver", `<path d="M10.2 13.3a1.8 1.8 0 0 1 3.6.2c0 1.3-3.6 2.6-3.6 4.2h3.7"/>`) },
  { id: "huy-chuong-3", label: "Huy chương hạng 3", group: "honor", old: ["Medal"],
    body: medal("bronze", `<path d="M10.3 12.4h3.3l-1.8 2.1a1.6 1.6 0 1 1-1.6 2.3"/>`) },
  { id: "top-10", label: "Top 10", group: "honor", old: ["Trophy"],
    body: `<path d="M3 21v-6h6M15 13h6v8M2 21h20"/><path class="f" d="M9 21V10.5h6V21"/><path class="a" d="M12 2.8l1.1 2.1 2.3.3-1.7 1.6.4 2.3-2.1-1.1-2.1 1.1.4-2.3-1.7-1.6 2.3-.3z"/>` },
  { id: "ket-trai", label: "Kết Trái", group: "honor", old: ["TreeIcon"], anim: "pop",
    body: `<path class="fruit" d="M12 8.4c-1.6-1-5.6-1.4-7 1.6-1.7 3.5.3 9 3.6 10.6 1.3.6 2.4.2 3.4-.3 1 .5 2.1.9 3.4.3 3.3-1.6 5.3-7.1 3.6-10.6-1.4-3-5.4-2.6-7-1.6z"/><path d="M12 8.4c0-2.1.6-3.6 2-5.1"/><path class="f" d="M13.3 5.6c1.2-1.7 3.1-2.1 5.2-1.5-.8 1.9-2.9 2.5-5.2 1.5z"/>` },

  // ——— Tiện ích & trang trí ———
  { id: "quay-lai", label: "Quay lại", group: "util", old: ["ArrowLeft"], body: `<path d="M19 12H5M11 6l-6 6 6 6"/>` },
  { id: "di-tiep", label: "Đi tiếp", group: "util", old: ["ArrowRight"], body: `<path d="M5 12h14M13 6l6 6-6 6"/>` },
  { id: "mo-rong", label: "Mở rộng", group: "util", old: ["ChevronDown"], body: `<path d="M6 9l6 6 6-6"/>` },
  { id: "dong", label: "Đóng", group: "util", old: ["X"], body: `<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>` },
  { id: "thong-bao", label: "Thông báo", group: "util", old: ["BellRing"], anim: "ring",
    body: `<path class="f" d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>` },
  { id: "goi-y", label: "Gợi ý", group: "util", old: ["Lightbulb"],
    body: `<path class="a" d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/><path d="M9.5 19h5M10.5 21.5h3"/>` },
  { id: "binh-luan", label: "Bình luận", group: "util", old: ["MessageSquare"],
    body: `<path class="f" d="M7 4h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-9l-5 4V6a2 2 0 0 1 2-2z"/><path d="M9 9h8M9 12.5h5"/>` },
  { id: "lam-moi", label: "Làm mới", group: "util", old: ["RefreshCw"],
    body: `<path d="M20 11a8 8 0 0 0-14.5-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.5 4.5L20 16M20 20v-4h-4"/>` },
  { id: "lam-lai", label: "Làm lại", group: "util", old: ["RotateCcw"], body: `<path d="M4 4v5h5M4.6 9A8 8 0 1 1 4 13"/>` },
  { id: "lich-su", label: "Lịch sử", group: "util", old: ["History"], body: `<path d="M4 4v5h5M4.6 9A8 8 0 1 1 4 13M12 8v4l3 2"/>` },
  { id: "xu-huong", label: "Hành trình", group: "util", old: ["TrendingUp"], body: `<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>` },
  { id: "sap-xep", label: "Sắp xếp", group: "util", old: ["ArrowsDownUp"], body: `<path d="M7 4v16M3.5 16.5L7 20l3.5-3.5M17 20V4M13.5 7.5L17 4l3.5 3.5"/>` },
  { id: "tai-lieu", label: "Tài liệu", group: "util", old: ["FileText"],
    body: `<path class="f" d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 16.5h4"/>` },
  { id: "tai-khoan", label: "Tài khoản", group: "util", old: ["UserCircle"],
    body: `<circle cx="12" cy="12" r="9"/><circle class="f" cx="12" cy="10" r="3.2"/><path d="M6.6 18.4a6.4 6.4 0 0 1 10.8 0"/>` },
  { id: "an", label: "Ẩn", group: "util", old: ["EyeOff"],
    body: `<path class="f" d="M6.6 6.6C3.7 8.4 2 12 2 12s3.5 7 10 7c2 0 3.8-.7 5.3-1.6M10 5.2c.6-.1 1.3-.2 2-.2 6.5 0 10 7 10 7a17 17 0 0 1-2.2 3.2"/><path d="M3 3l18 18M9.9 9.9a3 3 0 0 0 4.2 4.2"/>` },
  { id: "bao-mat", label: "Bảo mật", group: "util", old: ["ShieldCheck"],
    body: `<path class="f" d="M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6z"/><path d="M9 12l2 2 4-4"/>` },
  { id: "lap-lanh", label: "Lấp lánh", group: "util", old: ["Sparkles"], anim: "pop",
    body: `<path class="a" d="M11 3c.6 4 2 5.4 6 6-4 .6-5.4 2-6 6-.6-4-2-5.4-6-6 4-.6 5.4-2 6-6z"/><path d="M18.5 15v5M16 17.5h5"/>` },
  { id: "muc-tieu", label: "Mục tiêu", group: "util", old: ["Target"],
    body: `<circle cx="12" cy="12" r="9"/><circle class="f" cx="12" cy="12" r="5"/><circle class="c" cx="12" cy="12" r="1.6"/>` },
  { id: "la", label: "Lá", group: "util", old: ["Leaf"], anim: "sway",
    body: `<path class="f" d="M5 19C5 10 10 5 19 5c0 9-5 14-14 14z"/><path d="M5 19l8-8"/>` },
  { id: "mat-troi", label: "Mặt trời", group: "util", old: ["Sun"], body: sunRays() },
  { id: "chim", label: "Chim", group: "util", old: ["Bird"],
    body: `<path class="f" d="M3.5 12.5c2.6 0 4.6.9 6 2.7C10.8 11 14 8 18 8a2.5 2.5 0 0 1 2.5 2L22 11l-1.5.6c-.5 4-4 7-8.5 7-3.7 0-6.8-2.3-8.5-6.1z"/><path d="M17.8 10.4h.01M9.5 15.2c1.6.2 3.2-.4 4.4-1.8"/>` },
  { id: "kham-pha", label: "Khám phá", group: "util", old: ["Compass"],
    body: `<circle class="f" cx="12" cy="12" r="9"/><path class="a" d="M15.5 8.5l-2 5-5 2 2-5z"/>` },
];
