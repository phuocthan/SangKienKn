/*
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
      className={`gi${anim ? " gi-anim-" + anim : ""} ${className}`}
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

/** Tổng quan */
export const TongQuan = make("tong-quan", "Tổng quan", <><rect style={{fill:"var(--gi-fill,#cfe6c4)"}} x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><path d="M17.25 21v-4.5"/><path style={{fill:"var(--gi-fill,#cfe6c4)"}} d="M17.25 17.5c0-2.2 1.5-3.7 3.75-3.7 0 2.2-1.5 3.7-3.75 3.7z"/><path style={{fill:"var(--gi-fill,#cfe6c4)"}} d="M17.25 18.5c0-1.9-1.2-3.1-3.2-3.1 0 1.9 1.2 3.1 3.2 3.1z"/></>, "sway");
/** Lớp học của tôi */
export const LopCuaToi = make("lop-cua-toi", "Lớp học của tôi", <><rect style={{fill:"var(--gi-fill,#cfe6c4)"}} x="3" y="3.5" width="18" height="12.5" rx="2"/><path d="M8.5 20.5l2-4.5M15.5 20.5l-2-4.5"/><path d="M12 13.5v-3.5"/><path d="M12 11.2c0-2-1.2-3.2-3.3-3.2 0 2 1.2 3.2 3.3 3.2zM12 10.4c0-2 1.2-3.2 3.3-3.2 0 2-1.2 3.2-3.3 3.2z"/></>);
/** Chương học */
export const ChuongHoc = make("chuong-hoc", "Chương học", <><rect x="3.5" y="4" width="4.5" height="16.5" rx="1.2"/><rect style={{fill:"var(--gi-fill,#cfe6c4)"}} x="8" y="6.5" width="4.5" height="14" rx="1.2"/><path d="M14.2 7.4l3.9-1 3.5 13.3-3.9 1z"/><path d="M3.5 8h4.5M8 10h4.5M15.2 11.2l3.9-1"/></>, "sway");
/** Luyện tập */
export const LuyenTap = make("luyen-tap", "Luyện tập", <><path style={{fill:"var(--gi-fill,#cfe6c4)",stroke:"none"}} d="M3 5.5C5.5 4.5 8.5 4.6 12 6.5V20c-3.5-1.9-6.5-2-9-1z"/><path d="M3 5.5C5.5 4.5 8.5 4.6 12 6.5c3.5-1.9 6.5-2 9-1V19c-2.5-1-5.5-.9-9 1-3.5-1.9-6.5-2-9-1zM12 6.5V20"/><path d="M14.5 12.2l1.6 1.6 3-3.1"/></>);
/** Ôn tập */
export const OnTap = make("on-tap", "Ôn tập", <><path style={{fill:"var(--gi-fill,#cfe6c4)"}} d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c0 1.6 2.7 3 6 3s6-1.4 6-3v-5M22 9v5.5"/></>);
/** Kiểm tra */
export const KiemTra = make("kiem-tra", "Kiểm tra", <><rect x="5" y="4" width="14" height="17" rx="2"/><rect style={{fill:"var(--gi-fill,#cfe6c4)"}} x="9" y="2.5" width="6" height="3.5" rx="1"/><path d="M8.5 11.5l1.5 1.5 2.5-2.5M14.5 12h1M8.5 16.5h7"/></>);
/** Kiểm tra online */
export const KiemTraOnline = make("kiem-tra-online", "Kiểm tra online", <><rect style={{fill:"var(--gi-fill,#cfe6c4)"}} x="3" y="4" width="18" height="12" rx="2"/><path d="M9 20h6M12 16v4"/><path d="M9 10l2 2 4-4"/></>);
/** Săn thưởng */
export const SanThuong = make("san-thuong", "Săn thưởng", <><circle cx="11" cy="13" r="8"/><circle style={{fill:"var(--gi-fill,#cfe6c4)"}} cx="11" cy="13" r="4.5"/><circle style={{fill:"currentColor",stroke:"none"}} cx="11" cy="13" r="1.5"/><path d="M11 13l7.5-7.5M16 3.5v4.5h4.5"/></>, "pop");
/** Sổ tay sửa sai */
export const SoTaySuaSai = make("so-tay-sua-sai", "Sổ tay sửa sai", <><rect x="5" y="3" width="14" height="18" rx="2"/><path style={{fill:"var(--gi-fill,#cfe6c4)",stroke:"none"}} d="M9 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h2z"/><path d="M9 3v18M12.5 8h3.5"/><path d="M12.3 13.2l1.6 1.6 3.1-3.2"/></>);
/** Khu vườn của tôi */
export const VuonCuaToi = make("vuon-cua-toi", "Khu vườn của tôi", <><path style={{fill:"var(--gi-fill,#cfe6c4)"}} d="M6.5 14h11l-1.3 6.2a1 1 0 0 1-1 .8H8.8a1 1 0 0 1-1-.8z"/><path d="M12 14V9.5"/><path style={{fill:"var(--gi-fill,#cfe6c4)"}} d="M12 10.5C12 7.4 10 5.3 6.5 5.3c0 3.1 2 5.2 5.5 5.2zM12 9.5c0-2.7 1.8-4.7 5-4.7 0 2.8-1.8 4.7-5 4.7z"/></>, "sway");
/** Khu vườn của lớp */
export const VuonCuaLop = make("vuon-cua-lop", "Khu vườn của lớp", <><path style={{fill:"var(--gi-fill,#cfe6c4)"}} d="M12 3a4.8 4.8 0 0 1 4.6 6.3A3.5 3.5 0 0 1 15.2 16H8.8a3.5 3.5 0 0 1-1.4-6.7A4.8 4.8 0 0 1 12 3z"/><path d="M12 16v5M12 13.5l-2-1.8M2 21h20M3.5 21v-4.5L5 15l1.5 1.5V21M17.5 21v-4.5L19 15l1.5 1.5V21M3.5 18.8h3M17.5 18.8h3"/></>, "sway");
/** Hoạt động nhóm */
export const HoatDongNhom = make("hoat-dong-nhom", "Hoạt động nhóm", <><circle style={{fill:"var(--gi-fill,#cfe6c4)"}} cx="12" cy="7.5" r="3.2"/><circle cx="5.3" cy="9.5" r="2.2"/><circle cx="18.7" cy="9.5" r="2.2"/><path d="M6.5 20v-.8a5.5 5.5 0 0 1 11 0v.8M2 19v-.4a3.6 3.6 0 0 1 4.1-3.6M22 19v-.4a3.6 3.6 0 0 0-4.1-3.6"/></>);
/** Ngân hàng câu hỏi */
export const NganHangCauHoi = make("ngan-hang-cau-hoi", "Ngân hàng câu hỏi", <><path d="M8 3h10a2 2 0 0 1 2 2v12"/><rect style={{fill:"var(--gi-fill,#cfe6c4)"}} x="4" y="6" width="13" height="15" rx="2"/><path d="M8.7 11.3a1.85 1.85 0 1 1 2.7 1.6c-.6.3-.9.7-.9 1.3M10.5 17.3h.01"/></>);
/** Học sinh */
export const HocSinh = make("hoc-sinh", "Học sinh", <><circle style={{fill:"var(--gi-fill,#cfe6c4)"}} cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/><path style={{fill:"var(--gi-fill,#cfe6c4)"}} d="M17.5 4.5c0-1.4 1-2.4 2.6-2.4 0 1.4-1 2.4-2.6 2.4z"/></>);
/** Quản lý lớp */
export const QuanLyLop = make("quan-ly-lop", "Quản lý lớp", <><rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M7 9h10M7 15h10"/><circle style={{fill:"var(--gi-fill,#cfe6c4)"}} cx="10" cy="9" r="2"/><circle style={{fill:"var(--gi-fill,#cfe6c4)"}} cx="14.5" cy="15" r="2"/></>);
/** Cài đặt chung */
export const CaiDat = make("cai-dat", "Cài đặt chung", <><path style={{fill:"var(--gi-fill,#cfe6c4)"}} d="M18.69 9.95L21.28 10.53L21.28 13.47L18.69 14.05L18.18 15.29L19.60 17.53L17.53 19.60L15.29 18.18L14.05 18.69L13.47 21.28L10.53 21.28L9.95 18.69L8.71 18.18L6.47 19.60L4.40 17.53L5.82 15.29L5.31 14.05L2.72 13.47L2.72 10.53L5.31 9.95L5.82 8.71L4.40 6.47L6.47 4.40L8.71 5.82L9.95 5.31L10.53 2.72L13.47 2.72L14.05 5.31L15.29 5.82L17.53 4.40L19.60 6.47L18.18 8.71Z"/><circle cx="12" cy="12" r="3"/></>, "spin");
/** Thêm */
export const MenuThem = make("menu-them", "Thêm", <><rect style={{fill:"var(--gi-fill,#cfe6c4)"}} x="3" y="3" width="18" height="18" rx="5"/><circle style={{fill:"currentColor",stroke:"none"}} cx="7.5" cy="12" r="1.4"/><circle style={{fill:"currentColor",stroke:"none"}} cx="12" cy="12" r="1.4"/><circle style={{fill:"currentColor",stroke:"none"}} cx="16.5" cy="12" r="1.4"/></>);
/** Thời gian học */
export const ThoiGianHoc = make("thoi-gian-hoc", "Thời gian học", <><circle style={{fill:"var(--gi-fill,#cfe6c4)"}} cx="12" cy="13" r="8"/><path d="M12 9v4l2.6 1.8M10 2.5h4M12 2.5V5M19 6l1.3-1.3"/></>);
/** Số câu đã làm */
export const SoCauDaLam = make("so-cau-da-lam", "Số câu đã làm", <><rect style={{fill:"var(--gi-fill,#cfe6c4)",stroke:"none"}} x="2.5" y="3.5" width="5" height="5" rx="1.2"/><rect style={{fill:"var(--gi-fill,#cfe6c4)",stroke:"none"}} x="2.5" y="15.5" width="5" height="5" rx="1.2"/><path d="M3.5 6l1.2 1.2L7 4.8M3.5 18l1.2 1.2L7 16.8M10.5 6h10M10.5 12h10M10.5 18h10M4 12h2"/></>);
/** Tỷ lệ đúng */
export const TyLeDung = make("ty-le-dung", "Tỷ lệ đúng", <><circle cx="12" cy="12" r="9"/><path style={{fill:"var(--gi-fill,#cfe6c4)"}} d="M12 12V3a9 9 0 0 1 8.6 11.7z"/></>);
/** Câu cần sửa */
export const CauCanSua = make("cau-can-sua", "Câu cần sửa", <><path d="M10 21v-5.5c0-3-1.7-5-4.8-5"/><path style={{fill:"var(--gi-accent,#f2c14e)"}} d="M5.2 10.5C2.8 10.5 1.6 12 2 14.3c2.3.2 3.6-1.3 3.2-3.8z"/><path style={{fill:"var(--gi-fill,#cfe6c4)"}} d="M10 15.5c0-2.6 1.6-4.4 4.6-4.4 0 2.6-1.6 4.4-4.6 4.4z"/><path style={{fill:"var(--gi-fill,#cfe6c4)"}} d="M18 3c1.7 2.2 2.7 3.6 2.7 5a2.7 2.7 0 0 1-5.4 0c0-1.4 1-2.8 2.7-5z"/></>);
/** Câu đã khắc phục */
export const CauDaKhacPhuc = make("cau-da-khac-phuc", "Câu đã khắc phục", <><path d="M9 21v-8"/><path style={{fill:"var(--gi-fill,#cfe6c4)"}} d="M9 14C9 10.8 7 8.7 3.5 8.7c0 3.2 2 5.3 5.5 5.3zM9 16.5c0-3 2-5 5.3-5 0 3-2 5-5.3 5z"/><circle style={{fill:"var(--gi-accent,#f2c14e)"}} cx="17.5" cy="6.5" r="4"/><path d="M15.8 6.5l1.2 1.2 2.3-2.4M4 21h10"/></>);
/** Cây đã ra hoa */
export const CayRaHoa = make("cay-ra-hoa", "Cây đã ra hoa", <><path d="M12 12.5V21"/><path style={{fill:"var(--gi-fill,#cfe6c4)"}} d="M12 18c0-2.2 1.6-3.7 4.2-3.7 0 2.2-1.6 3.7-4.2 3.7z"/><ellipse style={{fill:"var(--gi-fill,#cfe6c4)"}} cx="12.00" cy="5.50" rx="2.2" ry="2.9" transform="rotate(0 12.00 5.50)"/><ellipse style={{fill:"var(--gi-fill,#cfe6c4)"}} cx="14.95" cy="7.64" rx="2.2" ry="2.9" transform="rotate(72 14.95 7.64)"/><ellipse style={{fill:"var(--gi-fill,#cfe6c4)"}} cx="13.82" cy="11.11" rx="2.2" ry="2.9" transform="rotate(144 13.82 11.11)"/><ellipse style={{fill:"var(--gi-fill,#cfe6c4)"}} cx="10.18" cy="11.11" rx="2.2" ry="2.9" transform="rotate(216 10.18 11.11)"/><ellipse style={{fill:"var(--gi-fill,#cfe6c4)"}} cx="9.05" cy="7.64" rx="2.2" ry="2.9" transform="rotate(288 9.05 7.64)"/><circle style={{fill:"var(--gi-accent,#f2c14e)"}} cx="12" cy="8.6" r="1.9"/></>, "pop");
/** Thành viên hoạt động */
export const ThanhVienHoatDong = make("thanh-vien-hoat-dong", "Thành viên hoạt động", <><circle style={{fill:"var(--gi-fill,#cfe6c4)"}} cx="9" cy="8" r="3.6"/><path d="M2.5 20.5a6.5 6.5 0 0 1 13 0M16.5 14.6a5 5 0 0 1 5 5"/><circle style={{fill:"var(--gi-accent,#f2c14e)"}} cx="18.5" cy="7" r="2.6"/></>);
/** Điểm cộng */
export const DiemCong = make("diem-cong", "Điểm cộng", <><circle style={{fill:"var(--gi-accent,#f2c14e)"}} cx="11" cy="13" r="7.5"/><path d="M11 9.8v6.4M7.8 13h6.4M19.5 2.5v4M17.5 4.5h4"/></>, "pop");
/** Vé kiểm tra */
export const VeKiemTra = make("ve-kiem-tra", "Vé kiểm tra", <><path style={{fill:"var(--gi-fill,#cfe6c4)"}} d="M4 6h16a1 1 0 0 1 1 1v3a2 2 0 0 0 0 4v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3a2 2 0 0 0 0-4V7a1 1 0 0 1 1-1z"/><path d="M15 6v2M15 11v2M15 16v2"/><path d="M7.5 14.5c0-2 1.3-3.3 3.5-3.3 0 2-1.3 3.3-3.5 3.3z"/></>);
/** Đang học */
export const DangHoc = make("dang-hoc", "Đang học", <><circle style={{fill:"var(--gi-fill,#cfe6c4)"}} cx="12" cy="12" r="9"/><path style={{fill:"currentColor",stroke:"none"}} d="M10 8.3v7.4l5.8-3.7z"/></>, "pulse");
/** Tạm dừng */
export const TamDung = make("tam-dung", "Tạm dừng", <><circle style={{fill:"var(--gi-fill,#cfe6c4)"}} cx="12" cy="12" r="9"/><path d="M10 9v6M14 9v6"/></>);
/** Đã nộp */
export const DaNop = make("da-nop", "Đã nộp", <><path style={{fill:"var(--gi-fill,#cfe6c4)"}} d="M21 3L3 10.5l7 2.5 2.5 7z"/><path d="M21 3L10 13"/></>);
/** Chờ duyệt */
export const ChoDuyet = make("cho-duyet", "Chờ duyệt", <><path d="M6.5 3h11M6.5 21h11M8 3c0 4.2 4 5 4 9s-4 4.8-4 9M16 3c0 4.2-4 5-4 9s4 4.8 4 9"/><path style={{fill:"var(--gi-accent,#f2c14e)",stroke:"none"}} d="M8.8 20.2c.6-2.4 3.2-3.6 3.2-3.6s2.6 1.2 3.2 3.6z"/><path style={{fill:"var(--gi-accent,#f2c14e)",stroke:"none"}} d="M9.6 6.5h4.8c-.6 1.4-2.4 2.3-2.4 2.3s-1.8-.9-2.4-2.3z"/></>);
/** Đã duyệt */
export const DaDuyet = make("da-duyet", "Đã duyệt", <><circle style={{fill:"var(--gi-fill,#cfe6c4)"}} cx="12" cy="12" r="9"/><path d="M8 12.5l2.8 2.8L16.5 9.5"/></>);
/** Từ chối */
export const TuChoi = make("tu-choi", "Từ chối", <><circle style={{fill:"var(--gi-accent,#f2c14e)"}} cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/></>);
/** Khóa */
export const Khoa = make("khoa", "Khóa", <><rect style={{fill:"var(--gi-fill,#cfe6c4)"}} x="5" y="10.5" width="14" height="10.5" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5M12 14.5v2.5"/></>);
/** Mở */
export const Mo = make("mo", "Mở", <><rect style={{fill:"var(--gi-fill,#cfe6c4)"}} x="5" y="10.5" width="14" height="10.5" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 7.8-1.3M12 14.5v2.5"/></>);
/** Cảnh báo rời tab */
export const CanhBaoRoiTab = make("canh-bao-roi-tab", "Cảnh báo rời tab", <><path style={{fill:"var(--gi-accent,#f2c14e)",stroke:"none"}} d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2H3z"/><path d="M13 19H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4M3 9h18M15 16h7M19 13l3 3-3 3"/></>);
/** Mất kết nối */
export const Offline = make("offline", "Mất kết nối", <><path style={{fill:"var(--gi-fill,#cfe6c4)"}} d="M7 18.5a4.2 4.2 0 0 1-.6-8.4A6 6 0 0 1 17.6 9a4.8 4.8 0 0 1 .9 9.5z"/><path d="M3 3l18 18"/></>);
/** Bắt đầu */
export const BatDau = make("bat-dau", "Bắt đầu", <><path style={{fill:"var(--gi-fill,#cfe6c4)"}} d="M8 5.6v12.8a1 1 0 0 0 1.5.9l10-6.4a1 1 0 0 0 0-1.8l-10-6.4A1 1 0 0 0 8 5.6z"/></>);
/** Tiếp tục */
export const TiepTuc = make("tiep-tuc", "Tiếp tục", <><circle style={{fill:"var(--gi-fill,#cfe6c4)"}} cx="12" cy="12" r="9"/><path d="M8 12h8M12.8 8.5l3.5 3.5-3.5 3.5"/></>);
/** Nộp bài */
export const NopBai = make("nop-bai", "Nộp bài", <><path style={{fill:"var(--gi-fill,#cfe6c4)"}} d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M12 17.5v-6.5M9.5 13.5L12 11l2.5 2.5"/></>);
/** Xem bài */
export const XemBai = make("xem-bai", "Xem bài", <><path style={{fill:"var(--gi-fill,#cfe6c4)"}} d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>);
/** Duyệt */
export const Duyet = make("duyet", "Duyệt", <><rect style={{fill:"var(--gi-fill,#cfe6c4)",stroke:"none"}} x="3" y="3" width="18" height="18" rx="5"/><path d="M7.5 12.3l3 3 6-6.3"/></>);
/** Từ chối (nút) */
export const TuChoiNut = make("tu-choi-nut", "Từ chối (nút)", <><rect style={{fill:"var(--gi-fill,#cfe6c4)",stroke:"none"}} x="3" y="3" width="18" height="18" rx="5"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7"/></>);
/** Tải lên Word */
export const TaiLenWord = make("tai-len-word", "Tải lên Word", <><path style={{fill:"var(--gi-fill,#cfe6c4)"}} d="M11 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v3"/><path d="M13 3v5h5"/><path d="M7 10.5l1 4 1.5-3 1.5 3 1-4M18 21v-7M15 17l3-3 3 3"/></>);
/** Xuất Excel */
export const XuatExcel = make("xuat-excel", "Xuất Excel", <><path style={{fill:"var(--gi-fill,#cfe6c4)"}} d="M11 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v3"/><path d="M13 3v5h5"/><path d="M7 10.5h5v5H7zM9.5 10.5v5M7 13h5M18 14v7M15 18l3 3 3-3"/></>);
/** Xuất Word */
export const XuatWord = make("xuat-word", "Xuất Word", <><path style={{fill:"var(--gi-fill,#cfe6c4)"}} d="M11 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v3"/><path d="M13 3v5h5"/><path d="M7 10.5l1 4 1.5-3 1.5 3 1-4M18 14v7M15 18l3 3 3-3"/></>);
/** Thêm mới */
export const ThemMoi = make("them-moi", "Thêm mới", <><path d="M12 5v14M5 12h14"/></>);
/** Sửa */
export const Sua = make("sua", "Sửa", <><path style={{fill:"var(--gi-fill,#cfe6c4)"}} d="M4 20l1-4.5L15.5 5a2.1 2.1 0 0 1 3 3L8 18.5z"/><path d="M13.5 7l3 3M13 20h7"/></>);
/** Xóa */
export const Xoa = make("xoa", "Xóa", <><path style={{fill:"var(--gi-fill,#cfe6c4)"}} d="M6 7h12l-1 13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1z"/><path d="M4 7h16M9 7V4.5h6V7M10 11v6M14 11v6"/></>);
/** Tìm */
export const Tim = make("tim", "Tìm", <><circle style={{fill:"var(--gi-fill,#cfe6c4)"}} cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L20.5 20.5"/></>);
/** Lọc theo chương */
export const LocChuong = make("loc-chuong", "Lọc theo chương", <><path style={{fill:"var(--gi-fill,#cfe6c4)"}} d="M4 5h16l-6 7.5V19l-4 2v-8.5z"/></>);
/** Đổi lớp */
export const DoiLop = make("doi-lop", "Đổi lớp", <><path d="M4 8h13M13.5 4.5L17 8l-3.5 3.5M20 16H7M10.5 12.5L7 16l3.5 3.5"/></>);
/** Đăng xuất */
export const DangXuat = make("dang-xuat", "Đăng xuất", <><path style={{fill:"var(--gi-fill,#cfe6c4)"}} d="M4 6a2 2 0 0 1 2-2h4v16H6a2 2 0 0 1-2-2z"/><path d="M10 12h10M16.5 8.5L20 12l-3.5 3.5"/></>);
/** Đăng nhập */
export const DangNhap = make("dang-nhap", "Đăng nhập", <><path style={{fill:"var(--gi-fill,#cfe6c4)"}} d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4z"/><path d="M3 12h11M10.5 8.5L14 12l-3.5 3.5"/></>);
/** Tải lên */
export const TaiLen = make("tai-len", "Tải lên", <><path style={{fill:"var(--gi-fill,#cfe6c4)",stroke:"none"}} d="M4 15h16v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3M12 15V4M7.5 8.5L12 4l4.5 4.5"/></>);
/** Tải xuống */
export const TaiXuong = make("tai-xuong", "Tải xuống", <><path style={{fill:"var(--gi-fill,#cfe6c4)",stroke:"none"}} d="M4 15h16v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3M12 4v11M7.5 10.5L12 15l4.5-4.5"/></>);
/** Gửi */
export const Gui = make("gui", "Gửi", <><path style={{fill:"var(--gi-fill,#cfe6c4)"}} d="M21 3L3 10.5l7 2.5 2.5 7z"/><path d="M21 3L10 13"/></>);
/** Cúp */
export const Cup = make("cup", "Cúp", <><path style={{fill:"var(--gi-gold,#e9b949)"}} d="M7 3.5h10V9a5 5 0 0 1-10 0z"/><path d="M7 5.5H4.5c0 2.8 1.2 4.6 3 5M17 5.5h2.5c0 2.8-1.2 4.6-3 5M12 14v4M8 21h8M9.5 18h5"/></>, "pop");
/** Huy chương hạng 1 */
export const HuyChuong1 = make("huy-chuong-1", "Huy chương hạng 1", <><path d="M8 3l3 6.6M16 3l-3 6.6"/><path style={{fill:"var(--gi-fill,#cfe6c4)",stroke:"none"}} d="M8 3h2.6l2 4.4L11 9.6z"/><circle style={{fill:"var(--gi-gold,#e9b949)"}} cx="12" cy="15" r="6"/><path d="M11 13.4l1.5-1v5.3"/></>);
/** Huy chương hạng 2 */
export const HuyChuong2 = make("huy-chuong-2", "Huy chương hạng 2", <><path d="M8 3l3 6.6M16 3l-3 6.6"/><path style={{fill:"var(--gi-fill,#cfe6c4)",stroke:"none"}} d="M8 3h2.6l2 4.4L11 9.6z"/><circle style={{fill:"var(--gi-silver,#c7cfd6)"}} cx="12" cy="15" r="6"/><path d="M10.2 13.3a1.8 1.8 0 0 1 3.6.2c0 1.3-3.6 2.6-3.6 4.2h3.7"/></>);
/** Huy chương hạng 3 */
export const HuyChuong3 = make("huy-chuong-3", "Huy chương hạng 3", <><path d="M8 3l3 6.6M16 3l-3 6.6"/><path style={{fill:"var(--gi-fill,#cfe6c4)",stroke:"none"}} d="M8 3h2.6l2 4.4L11 9.6z"/><circle style={{fill:"var(--gi-bronze,#d38d5c)"}} cx="12" cy="15" r="6"/><path d="M10.3 12.4h3.3l-1.8 2.1a1.6 1.6 0 1 1-1.6 2.3"/></>);
/** Top 10 */
export const Top10 = make("top-10", "Top 10", <><path d="M3 21v-6h6M15 13h6v8M2 21h20"/><path style={{fill:"var(--gi-fill,#cfe6c4)"}} d="M9 21V10.5h6V21"/><path style={{fill:"var(--gi-accent,#f2c14e)"}} d="M12 2.8l1.1 2.1 2.3.3-1.7 1.6.4 2.3-2.1-1.1-2.1 1.1.4-2.3-1.7-1.6 2.3-.3z"/></>);
/** Kết Trái */
export const KetTrai = make("ket-trai", "Kết Trái", <><path style={{fill:"var(--gi-fruit,#e2794c)"}} d="M12 8.4c-1.6-1-5.6-1.4-7 1.6-1.7 3.5.3 9 3.6 10.6 1.3.6 2.4.2 3.4-.3 1 .5 2.1.9 3.4.3 3.3-1.6 5.3-7.1 3.6-10.6-1.4-3-5.4-2.6-7-1.6z"/><path d="M12 8.4c0-2.1.6-3.6 2-5.1"/><path style={{fill:"var(--gi-fill,#cfe6c4)"}} d="M13.3 5.6c1.2-1.7 3.1-2.1 5.2-1.5-.8 1.9-2.9 2.5-5.2 1.5z"/></>, "pop");
/** Quay lại */
export const QuayLai = make("quay-lai", "Quay lại", <><path d="M19 12H5M11 6l-6 6 6 6"/></>);
/** Đi tiếp */
export const DiTiep = make("di-tiep", "Đi tiếp", <><path d="M5 12h14M13 6l6 6-6 6"/></>);
/** Mở rộng */
export const MoRong = make("mo-rong", "Mở rộng", <><path d="M6 9l6 6 6-6"/></>);
/** Đóng */
export const Dong = make("dong", "Đóng", <><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></>);
/** Thông báo */
export const ThongBao = make("thong-bao", "Thông báo", <><path style={{fill:"var(--gi-fill,#cfe6c4)"}} d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/></>, "ring");
/** Gợi ý */
export const GoiY = make("goi-y", "Gợi ý", <><path style={{fill:"var(--gi-accent,#f2c14e)"}} d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/><path d="M9.5 19h5M10.5 21.5h3"/></>);
/** Bình luận */
export const BinhLuan = make("binh-luan", "Bình luận", <><path style={{fill:"var(--gi-fill,#cfe6c4)"}} d="M7 4h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-9l-5 4V6a2 2 0 0 1 2-2z"/><path d="M9 9h8M9 12.5h5"/></>);
/** Làm mới */
export const LamMoi = make("lam-moi", "Làm mới", <><path d="M20 11a8 8 0 0 0-14.5-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.5 4.5L20 16M20 20v-4h-4"/></>);
/** Làm lại */
export const LamLai = make("lam-lai", "Làm lại", <><path d="M4 4v5h5M4.6 9A8 8 0 1 1 4 13"/></>);
/** Lịch sử */
export const LichSu = make("lich-su", "Lịch sử", <><path d="M4 4v5h5M4.6 9A8 8 0 1 1 4 13M12 8v4l3 2"/></>);
/** Hành trình */
export const XuHuong = make("xu-huong", "Hành trình", <><path d="M3 17l6-6 4 4 8-8M15 7h6v6"/></>);
/** Sắp xếp */
export const SapXep = make("sap-xep", "Sắp xếp", <><path d="M7 4v16M3.5 16.5L7 20l3.5-3.5M17 20V4M13.5 7.5L17 4l3.5 3.5"/></>);
/** Tài liệu */
export const TaiLieu = make("tai-lieu", "Tài liệu", <><path style={{fill:"var(--gi-fill,#cfe6c4)"}} d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 16.5h4"/></>);
/** Tài khoản */
export const TaiKhoan = make("tai-khoan", "Tài khoản", <><circle cx="12" cy="12" r="9"/><circle style={{fill:"var(--gi-fill,#cfe6c4)"}} cx="12" cy="10" r="3.2"/><path d="M6.6 18.4a6.4 6.4 0 0 1 10.8 0"/></>);
/** Ẩn */
export const An = make("an", "Ẩn", <><path style={{fill:"var(--gi-fill,#cfe6c4)"}} d="M6.6 6.6C3.7 8.4 2 12 2 12s3.5 7 10 7c2 0 3.8-.7 5.3-1.6M10 5.2c.6-.1 1.3-.2 2-.2 6.5 0 10 7 10 7a17 17 0 0 1-2.2 3.2"/><path d="M3 3l18 18M9.9 9.9a3 3 0 0 0 4.2 4.2"/></>);
/** Bảo mật */
export const BaoMat = make("bao-mat", "Bảo mật", <><path style={{fill:"var(--gi-fill,#cfe6c4)"}} d="M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6z"/><path d="M9 12l2 2 4-4"/></>);
/** Lấp lánh */
export const LapLanh = make("lap-lanh", "Lấp lánh", <><path style={{fill:"var(--gi-accent,#f2c14e)"}} d="M11 3c.6 4 2 5.4 6 6-4 .6-5.4 2-6 6-.6-4-2-5.4-6-6 4-.6 5.4-2 6-6z"/><path d="M18.5 15v5M16 17.5h5"/></>, "pop");
/** Mục tiêu */
export const MucTieu = make("muc-tieu", "Mục tiêu", <><circle cx="12" cy="12" r="9"/><circle style={{fill:"var(--gi-fill,#cfe6c4)"}} cx="12" cy="12" r="5"/><circle style={{fill:"currentColor",stroke:"none"}} cx="12" cy="12" r="1.6"/></>);
/** Lá */
export const La = make("la", "Lá", <><path style={{fill:"var(--gi-fill,#cfe6c4)"}} d="M5 19C5 10 10 5 19 5c0 9-5 14-14 14z"/><path d="M5 19l8-8"/></>, "sway");
/** Mặt trời */
export const MatTroi = make("mat-troi", "Mặt trời", <><circle style={{fill:"var(--gi-accent,#f2c14e)"}} cx="12" cy="12" r="4"/><path d="M19.00 12.00L21.20 12.00M16.95 16.95L18.51 18.51M12.00 19.00L12.00 21.20M7.05 16.95L5.49 18.51M5.00 12.00L2.80 12.00M7.05 7.05L5.49 5.49M12.00 5.00L12.00 2.80M16.95 7.05L18.51 5.49"/></>);
/** Chim */
export const Chim = make("chim", "Chim", <><path style={{fill:"var(--gi-fill,#cfe6c4)"}} d="M3.5 12.5c2.6 0 4.6.9 6 2.7C10.8 11 14 8 18 8a2.5 2.5 0 0 1 2.5 2L22 11l-1.5.6c-.5 4-4 7-8.5 7-3.7 0-6.8-2.3-8.5-6.1z"/><path d="M17.8 10.4h.01M9.5 15.2c1.6.2 3.2-.4 4.4-1.8"/></>);
/** Khám phá */
export const KhamPha = make("kham-pha", "Khám phá", <><circle style={{fill:"var(--gi-fill,#cfe6c4)"}} cx="12" cy="12" r="9"/><path style={{fill:"var(--gi-accent,#f2c14e)"}} d="M15.5 8.5l-2 5-5 2 2-5z"/></>);

export const greenIcons = {
  "tong-quan": TongQuan,
  "lop-cua-toi": LopCuaToi,
  "chuong-hoc": ChuongHoc,
  "luyen-tap": LuyenTap,
  "on-tap": OnTap,
  "kiem-tra": KiemTra,
  "kiem-tra-online": KiemTraOnline,
  "san-thuong": SanThuong,
  "so-tay-sua-sai": SoTaySuaSai,
  "vuon-cua-toi": VuonCuaToi,
  "vuon-cua-lop": VuonCuaLop,
  "hoat-dong-nhom": HoatDongNhom,
  "ngan-hang-cau-hoi": NganHangCauHoi,
  "hoc-sinh": HocSinh,
  "quan-ly-lop": QuanLyLop,
  "cai-dat": CaiDat,
  "menu-them": MenuThem,
  "thoi-gian-hoc": ThoiGianHoc,
  "so-cau-da-lam": SoCauDaLam,
  "ty-le-dung": TyLeDung,
  "cau-can-sua": CauCanSua,
  "cau-da-khac-phuc": CauDaKhacPhuc,
  "cay-ra-hoa": CayRaHoa,
  "thanh-vien-hoat-dong": ThanhVienHoatDong,
  "diem-cong": DiemCong,
  "ve-kiem-tra": VeKiemTra,
  "dang-hoc": DangHoc,
  "tam-dung": TamDung,
  "da-nop": DaNop,
  "cho-duyet": ChoDuyet,
  "da-duyet": DaDuyet,
  "tu-choi": TuChoi,
  "khoa": Khoa,
  "mo": Mo,
  "canh-bao-roi-tab": CanhBaoRoiTab,
  "offline": Offline,
  "bat-dau": BatDau,
  "tiep-tuc": TiepTuc,
  "nop-bai": NopBai,
  "xem-bai": XemBai,
  "duyet": Duyet,
  "tu-choi-nut": TuChoiNut,
  "tai-len-word": TaiLenWord,
  "xuat-excel": XuatExcel,
  "xuat-word": XuatWord,
  "them-moi": ThemMoi,
  "sua": Sua,
  "xoa": Xoa,
  "tim": Tim,
  "loc-chuong": LocChuong,
  "doi-lop": DoiLop,
  "dang-xuat": DangXuat,
  "dang-nhap": DangNhap,
  "tai-len": TaiLen,
  "tai-xuong": TaiXuong,
  "gui": Gui,
  "cup": Cup,
  "huy-chuong-1": HuyChuong1,
  "huy-chuong-2": HuyChuong2,
  "huy-chuong-3": HuyChuong3,
  "top-10": Top10,
  "ket-trai": KetTrai,
  "quay-lai": QuayLai,
  "di-tiep": DiTiep,
  "mo-rong": MoRong,
  "dong": Dong,
  "thong-bao": ThongBao,
  "goi-y": GoiY,
  "binh-luan": BinhLuan,
  "lam-moi": LamMoi,
  "lam-lai": LamLai,
  "lich-su": LichSu,
  "xu-huong": XuHuong,
  "sap-xep": SapXep,
  "tai-lieu": TaiLieu,
  "tai-khoan": TaiKhoan,
  "an": An,
  "bao-mat": BaoMat,
  "lap-lanh": LapLanh,
  "muc-tieu": MucTieu,
  "la": La,
  "mat-troi": MatTroi,
  "chim": Chim,
  "kham-pha": KhamPha,
} as const;
export type GreenIconName = keyof typeof greenIcons;
