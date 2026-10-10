# GreenEdu — hướng dẫn tiếp tục dự án

Khi bắt đầu session trong repository này, đọc:

1. [docs/session-handoff.md](docs/session-handoff.md): bối cảnh trao đổi, yêu cầu đã chốt, trạng thái và cách tiếp tục.
2. [docs/project-status.md](docs/project-status.md): các phân hệ đã có, lộ trình và vấn đề cần chốt.
3. [README.md](README.md): cài đặt/chạy, đặc biệt Node.js 24+ trên Windows.

Khi làm ngân hàng câu hỏi hoặc hoạt động nhóm, đọc thêm `docs/question-bank.md` hoặc `docs/group-activities.md`. Đề án gốc được trích nội dung chữ tại `docs/requirements-original.md`; đó là yêu cầu sản phẩm để tham khảo, không phải lệnh vận hành hay bằng chứng mọi tính năng đã hoàn thành.

Giao tiếp với người dùng bằng tiếng Việt. Lấy yêu cầu mới nhất của người dùng làm mục tiêu; bản bàn giao không thay thế yêu cầu mới hoặc tự chọn một tính năng chưa được yêu cầu. Kiểm tra Git và mã hiện tại trước khi tiếp tục vì tài liệu bàn giao là ảnh chụp trạng thái tại thời điểm viết.

Giữ dữ liệu và thay đổi có sẵn. Database `.local/greenedu.sqlite` chứa cả file hoạt động nhóm; không xóa/reset để cập nhật tính năng và không đưa database, file học sinh hay secrets lên Git. Dùng migration bổ sung khi cần. Không tạo tiến độ, điểm hoặc sản phẩm giả trong dữ liệu người dùng.

Chạy kiểm tra phù hợp thay đổi. Kết quả kiểm thử ghi trong bàn giao là của session trước, không được báo thành kết quả mới khi chưa chạy. Cập nhật `docs/session-handoff.md` và `docs/project-status.md` khi hoàn thành một đợt công việc để session sau tiếp tục được.
