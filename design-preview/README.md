# Preview GreenEdu · Khu vườn ấm áp

Bản thiết kế tương tác để duyệt **trước khi cập nhật app**. Nguồn riêng trong `design-preview/`, không import `src/App.tsx`, không gọi API, không đăng nhập hoặc kết nối SQLite/Railway. Tên, số liệu, câu hỏi, lớp và biểu mẫu là dữ liệu minh họa. Thẻ mục tiêu ngày là ý tưởng trình bày, chưa bổ sung nghiệp vụ vào app.

## Chạy và quản lý

```powershell
npm run preview:design
npm run preview:design -- -Action Status
npm run preview:design -- -Action Stop
npm run preview:design:build
```

Mở **http://localhost:5180**. Vite riêng chạy trong nền, HMR khi sửa preview. Không thay `dist`, frontend chính 5173 hoặc Railway; không khởi động backend. Không dừng tiến trình khác khi cổng bận. Build ở `.local/garden-preview-build/`, log/state `.local/garden-preview-*`. Stop xác minh PID/thời điểm/executable/config thuộc preview.

## Duyệt thiết kế

- Đổi Học sinh/Giáo viên/Quản trị/Đăng nhập và máy tính/điện thoại ở thanh trên cùng.
- Sidebar/menu mở tổng quan, luyện tập, sửa sai, ôn thi, lớp, câu hỏi, tiến độ, nhóm; mobile có thanh điều hướng dưới.
- Thử chọn/kiểm tra đáp án, lời giải, câu tiếp, tìm lớp/tài khoản, modal, tạo lớp minh họa và thông báo.
- **Tùy chỉnh**: Vườn xanh/Vườn nắng, bo góc 12–32 px, thoáng/gọn, nền trường. Lựa chọn giữ qua chuyển role.
- **Lưu lựa chọn & góp ý**: tải JSON `preview-only`, lưu sở thích ở localStorage preview; không có nghĩa đã duyệt hay update app.

Hướng mới nhất: **khu vườn ấm áp, gần gũi**. Nền kem, xanh lá dịu/vàng đất, sidebar nổi bo mềm, thẻ nhẹ, nút rõ ràng, cây minh họa. Dùng lại ảnh/logo tại `public/assets`; cây preview là SVG riêng. Khi được duyệt, chuyển thiết kế sang thành phần thực, giữ dữ liệu/quyền/tính năng hiện có; không đưa dữ liệu mẫu này vào app.

## Kiểm tra

11/10/2026: build đạt; Chrome **68 màn hình/trạng thái** ở 1440/768/390/360 px không tràn ngang/lỗi JS. Đổi palette/bo góc/khoảng cách/nền, chuyển role/điện thoại, xuất JSON và thao tác minh họa đạt; theo dõi request không gọi `/api` hoặc dịch vụ ngoài. Script `.local/review-garden-preview.mjs`, ảnh `.local/ui-garden-preview/`. Đây là kiểm tra thiết kế, không phải kiểm thử backend thật.
