# Kiểm tra redesign — 13/10/2026

Phạm vi: frontend trên nền `3bb7fcf`, giữ API/quyền/dữ liệu/mốc cấp và quy tắc buổi thi. Build riêng `.local/redesign-20261013`; E2E dùng `e2e/start-server.ts` tại127.0.0.1:3101 và SQLite `.local/e2e-*.sqlite`, không chạy seed/ca ghi dữ liệu trên Railway. Frontend người dùng vẫn chạy5173 → Railway qua `npm run local -- -Force`; không thay dist hoặc khởi động API offline mặc định.

## Kết quả trong đợt này

TypeScript và Vite build đạt. Lượt đầu22/22 E2E desktop/mobile đạt: tạo online qua modal, hai nguồn đề, upload hai Word thật, thông báo, vào thi/đóng bài, capability cũ và submenu. Sau kiểm tra ảnh, đã điều chỉnh specificity để màu thẻ thực sự hiển thị và tab con vừa cả320px; **lượt cuối72/72 E2E desktop/mobile đạt (4,0phút)** với bản build riêng mới nhất. Lượt cuối gồm13 file spec, bỏ riêng ca timer cũ `practice clock advances...`; file online-exam-groups không đưa vào lượt này. Không coi số72 là toàn bộ suite của repository.

Rà rộng ban đầu có các ca chờ nút Cập nhật/Làm mới đã bỏ, và phép kiểm tra vị trí heading cố định40px. Đã thay bằng sự kiện focus thực tế và hình học nằm trong header. Ca phản biện cũ gọi endpoint `/__test/clock` không có trong server vừa pull; đổi fixture sang chờ giờ máy chủ thật (15giây), không thêm endpoint thử nghiệm vào production.

Ca timer cũ `practice clock advances...` vẫn kỳ vọng chỉ pause và tiếp tục sau hidden; mã nền/đặc tả hiện hành kết thúc phiên, về trang chính. Ca online-exam-groups có bước kiểm tra heartbeat luyện tập cũng timeout trong lượt rộng đầu. Hai ca này không nằm trong lượt xác nhận giao diện cuối; không gọi đây là toàn bộ E2E đều đạt, không sửa cơ chế phiên học đã chốt để làm test cũ xanh. Những luồng tạo/bắt đầu/đóng online được kiểm tra riêng bằng online-exams/online-management.

## Bằng chứng giao diện

- `e2e/redesign.spec.ts`: trang ôn không còn nút tạo online; trang online không có form trước khi mở; Escape/khôi phục focus; lỗi lưu hiện trong modal và giữ draft; gửi lại thành công đóng modal, thông báo đã lưu, `startedAt === null`; metadata bốn nhóm rõ nhãn và giá trị.
- Submenu một hàng tại320/390/768/1440px, portrait nằm sát trên dock, cả ba tab hiện đủ nhãn, không overflow trang; reduced-motion và control cuối panel không bị header/submenu/dock che.
- Học sinh giữ Bắt đầu ôn, năm cấp/nhãn, vườn và nhóm; rào trang trí `aria-hidden`, bỏ nút cập nhật thừa. Teacher chapter/roster, menu năm mục, heading, account và các luồng nhóm/góp ý được kiểm tra hồi quy liên quan.
- Ảnh Chromium chỉ chứa fixture riêng: `.local/redesign-home-{desktop,mobile}.png`, `.local/redesign-form-{desktop,mobile}.png`, `.local/redesign-review-teacher-desktop.png`; các ảnh từng ca trong test-results. Đã xem trực tiếp home, form hai kích thước, review, vườn và card đề. Không đưa ảnh fixture/DB/bản sao dữ liệu lên Git.

## Rà soát web-design-guidelines

`src/WorkspaceTabs.tsx`: giữ tablist/tabpanel, roving focus, Arrow/Home/End, nhãn đầy đủ; đo header/submenu/dock bằng ResizeObserver khi layout đổi. `src/redesign.css`: safe area, scroll padding/margin, focus-visible, responsive và reduced-motion; label/nút không dựa riêng vào màu. `src/Learning.tsx`: nhãn form, trạng thái lưu, inline error và focus lỗi, nguồn không mặc định; kết quả tạo thông báo qua role=status, retry có requestId cũ. `src/components.tsx`: trap/focus-return không khởi động lại khi busy đổi. `src/ExamMetadata.tsx`, `src/StudentLevel.tsx`: SVG trang trí ẩn với trợ năng; năm cấp giữ tên đọc được, số liệu tabular. Đã xử lý các phát hiện trong phạm vi thay đổi; không phải audit toàn ứng dụng hoặc nghiệm thu thiết bị thật.

Kiểm tra diff không có lỗi khoảng trắng; các liên kết Markdown local được kiểm tra trước commit. Push Git được người dùng yêu cầu; triển khai Railway không được suy ra chỉ từ commit hoặc build local. Xem trạng thái cuối trong [session-handoff.md](session-handoff.md).
