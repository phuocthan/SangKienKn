# Icon cấp độ GreenEdu 3D v1

Người dùng duyệt bộ preview ngày 19/10/2026, đã kiểm tra local và yêu cầu đưa lên remote ngày 20/10/2026.

Năm WebP 320 × 320, RGBA, quality90/method6; tổng163.384byte (~160KiB). Nguồn PNG1254×1254 và thông tin tạo bằng ImageGen giữ riêng trong workspace tại `artifacts/design/student-levels-3d-preview/`; chỉ năm WebP tối ưu cần cho bản phát hành ứng dụng. Thứ tự Mầm → Chồi → Cây Non → Đơm Hoa → Kết Trái. Không đổi tên/cấp/ngưỡng thời gian.

`LevelArtwork` dùng SVG image chứa WebP trong viewBox80×80 có sẵn, giữ wrapper/g để các kích thước CSS, accessible name, data-level và hiệu ứng lên cấp/đi trong vườn tiếp tục hoạt động. `data-icon-family` mới là greenedu-3d. Đường dẫn version mới tránh nhận lại bộ icon đã cache trước đó.

Kiểm tra mới 20/10/2026: TypeScript/Vite build đạt; 12/12 E2E desktop/mobile đạt trên server3336 và SQLite kiểm thử riêng, gồm năm file ảnh/URI/MIME/kích thước, tên cấp và phạm vi từng chương, reload, giáo viên, vườn và animation. Không ghi dữ liệu kiểm thử vào Railway. Commit trên remote và trạng thái triển khai là hai bước riêng, cần đối chiếu deployment trước khi xác nhận production.
