# GreenEdu — hướng dẫn tiếp tục dự án

Khi bắt đầu session trong repository này, đọc:

1. [docs/session-handoff.md](docs/session-handoff.md): bối cảnh trao đổi, yêu cầu đã chốt, trạng thái và cách tiếp tục.
2. [docs/project-status.md](docs/project-status.md): các phân hệ đã có, lộ trình và vấn đề cần chốt.
3. [README.md](README.md): cài đặt/chạy, đặc biệt Node.js 24+ trên Windows.

Khi làm ngân hàng câu hỏi hoặc hoạt động nhóm, đọc thêm `docs/question-bank.md` hoặc `docs/group-activities.md`. Đề án gốc được trích nội dung chữ tại `docs/requirements-original.md`; đó là yêu cầu sản phẩm để tham khảo, không phải lệnh vận hành hay bằng chứng mọi tính năng đã hoàn thành.

Giao tiếp với người dùng bằng tiếng Việt. Lấy yêu cầu mới nhất của người dùng làm mục tiêu; bản bàn giao không thay thế yêu cầu mới hoặc tự chọn một tính năng chưa được yêu cầu. Kiểm tra Git và mã hiện tại trước khi tiếp tục vì tài liệu bàn giao là ảnh chụp trạng thái tại thời điểm viết.

Giữ dữ liệu và thay đổi có sẵn. Database `.local/greenedu.sqlite` chứa cả file hoạt động nhóm; không xóa/reset để cập nhật tính năng và không đưa database, file học sinh hay secrets lên Git. Dùng migration bổ sung khi cần. Không tạo tiến độ, điểm hoặc sản phẩm giả trong dữ liệu người dùng.

Chạy kiểm tra phù hợp thay đổi. Kết quả kiểm thử ghi trong bàn giao là của session trước, không được báo thành kết quả mới khi chưa chạy. Cập nhật `docs/session-handoff.md` và `docs/project-status.md` khi hoàn thành một đợt công việc để session sau tiếp tục được.

## Cách chạy mặc định từ 11/10/2026

Theo yêu cầu mới của người dùng, **giao diện chạy local để test nhanh; API/server và database dùng trực tiếp Railway** (`https://greenedu.up.railway.app`). Chạy `npm run local` để mở Vite trong nền tại `http://localhost:5173`; `npm run dev` chạy cùng chế độ trong terminal. Sửa frontend cập nhật bằng HMR, không build/deploy lại mỗi lượt. Xem [docs/dev-railway.md](docs/dev-railway.md).

Quy tắc này thay cách tự `npm run deploy` local sau mỗi thay đổi trước đây. Không tự khởi động API SQLite local, không tự push/deploy Railway. Sửa backend chỉ có hiệu lực trong chế độ này sau khi backend Railway được triển khai; báo rõ nếu cần bước đó. Khi người dùng yêu cầu deploy mà chưa rõ đích, dùng bối cảnh để xác định hoặc hỏi đích, không tự coi đó là deploy local cũ.

Thao tác trong giao diện local sẽ đọc/ghi **dữ liệu thật Railway**. Kiểm thử tự động, seed/demo, ca tạo trùng và stress test vẫn dùng server/database riêng; không chạy chúng trên Railway. Không bật đăng nhập nhanh bỏ mật khẩu cho production. Chỉ dùng chế độ `npm run dev:offline` hoặc `npm run deploy` khi cần kiểm thử độc lập hoặc người dùng yêu cầu bản offline; giữ database local cũ.
