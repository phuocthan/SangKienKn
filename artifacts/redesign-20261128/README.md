# GreenEdu — bộ icon "Vườn tri thức" + mock "nhiều icon, ít chữ" (28/11/2026)

Đề xuất theo `docs/redesign-brief-20261128.md`. **Chưa lắp vào app**, chưa commit; mã `src/` không bị sửa (chỉ được đọc để lập bảng ánh xạ).

## Mở xem

Mở `index.html` bằng trình duyệt (chạy được qua file://, không cần server). Trang có 4 phần: bộ icon (đổi cỡ 24/32/48, nền kem/trắng/xanh đậm), icon trong ngữ cảnh, mock 7 màn (desktop 1440 + mobile 390), bảng ánh xạ.

## Có gì

| Thư mục | Nội dung |
|---|---|
| `icons/svg/{24,32,48}/` | 84 SVG tĩnh, `viewBox="0 0 24 24"`, nét `currentColor` (2 / 1,75 / 1,5px), `role="img"` + `aria-label` tiếng Việt |
| `icons/animated/{24,48}/` | 6 SVG animation tự chứa (kết trái, ra hoa, đang học, điểm cộng, vườn của tôi, thông báo), tự tắt khi `prefers-reduced-motion: reduce`; bản tĩnh cùng tên ở `icons/svg/` |
| `icons/sprite.svg` | Sprite `<symbol id="gi-…">` |
| `icons/greenedu-icons.css` | Biến màu `--gi-fill`, `--gi-accent`, `--gi-gold/silver/bronze/fruit`; cỡ `.gi--16/20/32/48`; `.on-dark`; animation hover/focus (`.gi-host`) và đạt được (`.is-achieved`), chỉ trong `prefers-reduced-motion: no-preference` |
| `react/GreenIcons.tsx` | Component đề xuất (React 19 + TS, đã chạy `tsc --strict` đạt). Mỗi icon là một component nhận `size`, `className`, `label` như icon Phosphor cũ; có `greenIcons` theo tên |
| `mocks/screens/*.html` + `mocks/mock.css` | 7 màn, CSS thuần lớp `mk-*`, responsive ở 899px (sidebar ↔ thanh dưới 4 mục + Thêm) |
| `mocks/png/` | Ảnh chụp toàn trang từng màn ở 1440 và 390 |
| `mocks/audit.md` | Kết quả tự kiểm tra tương phản AA, vùng chạm ≥ 44px, tràn ngang |
| `mapping/icon-mapping.md` / `.json` | Bảng icon cũ (52 tên trong `src/icons.tsx`) ↔ icon mới ↔ 216 chỗ dùng trong `src/` |
| `tools/` | `icon-source.mjs` (nguồn icon), `mocks.mjs`, `build.mjs`, `shoot.mjs` |

Nhóm icon: Điều hướng 17 · Số liệu 9 · Trạng thái 10 · Hành động 20 · Vinh danh 6 · Tiện ích & trang trí 22.

## Quy ước thiết kế

- Lưới 24, vùng vẽ 2–22, bo tròn (`linecap/linejoin: round`), duotone: nét xanh + mảng `--gi-fill` (#cfe6c4). Màu nhấn vàng `--gi-accent` chỉ để trang trí, không mang nghĩa một mình: huy chương có số 1/2/3, trạng thái luôn có chữ trong pill.
- Hình tượng vườn: sửa sai = cây cần tưới / cây có dấu tích, săn thưởng = bia, kết trái = quả + lá, vườn lớp = cây + hàng rào.
- Bảng màu giữ nguyên: `#164b35` / `#216b4a`, kem `#f8f7f0` / `#fffefa`, viền `#dfe6d2`, chữ phụ `#5f7359`. Pill trạng thái có cặp nền/chữ riêng, đều ≥ 4,5:1.
- Ít chữ: nhãn 1–2 từ (Sửa sai, Vườn lớp, Câu hỏi), thẻ số liệu = icon + số + nhãn, chọn chương bằng chip có icon trạng thái, mô tả dài vào nút "i"/tooltip, nút icon-only luôn có `aria-label` + `title`.
- Vùng chạm 44px cho mọi nút/chip/ô nhập; thanh dưới mobile cao 60px.

## Lắp vào app (việc của phiên GreenEdu, sau khi duyệt)

1. Chép `react/GreenIcons.tsx` → `src/green-icons.tsx`, nạp `icons/greenedu-icons.css` trong `main.tsx`.
2. Đổi import theo `mapping/icon-mapping.md`. Các tên cũ có nhiều nghĩa (`Users`, `Books`, `Settings`, `CheckCircle2`, `Clock3`, `Download`, `X`…) đã có cột "Gợi ý" theo ngữ cảnh từng dòng, cần người lắp xác nhận.
3. Chuyển dần lớp `mk-*` thành component (`StatCard`, `StatusPill`, `NavItem`, `BottomBar`, `ChapterChips`, `IconButton`); mock dùng breakpoint 899px.
4. Bỏ `@phosphor-icons/react` khi không còn import.

## Dựng lại

```
cd D:\MyProjects\SangKienKn
node artifacts/redesign-20261128/tools/build.mjs
node artifacts/redesign-20261128/tools/shoot.mjs
```

`shoot.mjs` dùng Playwright của repo với Chrome đã cài (Chromium của Playwright chưa được tải về). Dữ liệu trong mock là minh họa, tên học sinh là tên giả. Ảnh cấp cây chép từ `public/assets/student-levels-3d-v1/` vào `mocks/assets/` và không bị sửa; font Be Vietnam Pro đọc từ `node_modules/@fontsource`.

## Chưa làm / cần duyệt

- Chưa có animation Spine/Lottie: dùng CSS/SVG nhẹ, đủ cho hover/đạt được.
- Chưa kiểm tra bằng trình đọc màn hình thật; mới kiểm tra tự động (tương phản, vùng chạm, tràn ngang).
- Các màn chưa mock: Ôn tập, Kiểm tra online, Hoạt động nhóm, Ngân hàng câu hỏi, Tổng quan giáo viên.
