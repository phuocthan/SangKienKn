# Prompt thiết kế lại GreenEdu — nhiều icon, ít chữ — 28/11/2026

Bản giao việc cho session **Kiến trúc Web app animation Spine** (`D:\MyProjects\AI Spine Asset Generator`). Đây là đề xuất thiết kế; chưa phải mã đã triển khai.

## Mục tiêu

Người dùng thấy GreenEdu hiện còn nhiều chữ và rối. Cần **bộ icon mới + hệ giao diện mới**: nhiều icon hơn, ít chữ hơn, thoáng hơn, nhưng **giữ chủ đề "khu vườn tri thức"** của trường THPT Nguyễn Khuyến (cây lớn dần theo cấp học, vườn lớp, kết trái, sửa sai = chăm cây).

Người dùng: học sinh THPT (chủ yếu điện thoại dọc) và giáo viên (desktop). Ngôn ngữ giao diện: tiếng Việt.

## Chủ đề phải giữ

- Bảng màu: xanh lá đậm `#164b35` / `#216b4a`, nền kem `#f8f7f0` / `#fffefa`, viền `#dfe6d2`, chữ phụ `#5f7359`; vàng/bạc/đồng cho bục vinh danh. Có thể tinh chỉnh nhưng vẫn xanh–kem ấm, không neon, không tối.
- Hình tượng: hạt mầm → cây non → cây lớn → ra hoa → kết trái (5 cấp, ảnh 3D hiện có tại `D:\MyProjects\SangKienKn\public\assets\student-levels-3d-v1\level-1..5.webp`), hàng rào vườn, lá, hoa, cúp.
- Nền ảnh trường (`public/assets/nguyen-khuyen-background-v11.png`) chỉ là chất liệu mờ.
- Icon hiện tại: Phosphor duotone (`src/icons.tsx`, 53 icon). Bộ mới có thể thay, nhưng phải đồng nhất một phong cách.

## Phần cần làm

### 1. Bộ icon (ưu tiên)

Một phong cách thống nhất: bo tròn, nét 2px hoặc duotone, có mảng màu xanh/kem, hợp chủ đề vườn. Mỗi icon có bản tĩnh SVG (24px, 32px, 48px) và — nếu hợp lý — animation nhẹ (Spine hoặc Lottie/CSS) cho trạng thái hover/đạt được. Cần tối thiểu:

- Điều hướng: Tổng quan, Lớp học của tôi, Chương học, Luyện tập, Ôn tập, Kiểm tra, Kiểm tra online, Săn thưởng, Sổ tay sửa sai, Khu vườn của tôi, Khu vườn của lớp, Hoạt động nhóm, Ngân hàng câu hỏi, Học sinh, Quản lý lớp, Cài đặt chung.
- Số liệu: thời gian học, số câu đã làm, tỷ lệ đúng, câu cần sửa, câu đã khắc phục, cây đã ra hoa, thành viên hoạt động, điểm cộng/điểm thưởng, vé kiểm tra.
- Trạng thái: đang học, tạm dừng, đã nộp, chờ duyệt, đã duyệt, từ chối, khóa, mở, cảnh báo rời tab, offline.
- Hành động: bắt đầu, tiếp tục, nộp bài, xem bài, duyệt, từ chối, tải lên Word, xuất Excel/Word, thêm, sửa, xóa, tìm, lọc theo chương, đổi lớp, đăng xuất.
- Vinh danh: cúp, huy chương 1/2/3, Top 10, Kết Trái.

### 2. Hệ giao diện "ít chữ"

Nguyên tắc đề xuất:
- Icon + nhãn 1–2 từ thay cho câu mô tả; mô tả dài chuyển vào tooltip/nút "i" hoặc bỏ.
- Thẻ số liệu: icon lớn + số lớn + nhãn ngắn ("Đã làm", "Đúng", "Cần sửa"), bỏ dòng phụ.
- Điều hướng: sidebar desktop dạng icon + nhãn ngắn, có nhóm; mobile là thanh dưới 4–5 icon + menu "Thêm".
- Chọn chương: chip/segmented có icon thay cho select dài khi ít chương.
- Trạng thái dạng pill có icon màu, không phải câu.
- Khoảng trắng nhiều hơn, mỗi màn một việc chính, nút chính nổi bật.

Cần mock (desktop 1440 và mobile 390) cho các màn: Đăng nhập, Tổng quan học sinh, Chương học/Luyện tập, Khu vườn của lớp (vinh danh + vườn chung), Sổ tay sửa sai, Săn thưởng/Điểm cộng, Quản lý học sinh (giáo viên).

### 3. Ràng buộc kỹ thuật (để bên GreenEdu lắp vào được)

- Frontend: React 19 + Vite + TypeScript, CSS thuần theo lớp (không Tailwind — người dùng đã từ chối).
- Icon giao dạng SVG (viewBox 0 0 24 24, `currentColor` cho nét chính, màu phụ qua CSS variable) để thay vào `src/icons.tsx`; animation giao file nhẹ kèm bản tĩnh, tôn trọng `prefers-reduced-motion`.
- Vùng chạm ≥44px; tương phản WCAG AA; mọi icon-only có `aria-label` (ghi tên tiếng Việt cho từng icon).
- Không chứa dữ liệu học sinh thật trong mock; dùng tên giả.

## Bàn giao lại

Đặt sản phẩm vào một thư mục rõ ràng (ví dụ `D:\MyProjects\SangKienKn\artifacts\redesign-20261128\` hoặc trong repo của session kia rồi báo đường dẫn): bộ SVG/animation, trang xem trước icon, mock các màn, và một bảng ánh xạ "icon mới ↔ tên icon cũ trong `src/icons.tsx` ↔ nơi dùng". Không sửa mã GreenEdu, không commit vào repo GreenEdu; việc lắp vào app làm ở session GreenEdu sau khi người dùng duyệt.
