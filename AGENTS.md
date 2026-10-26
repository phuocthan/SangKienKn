# GreenEdu — hướng dẫn tiếp tục dự án

Khi bắt đầu session trong repository này, đọc:

1. [docs/session-handoff.md](docs/session-handoff.md): bối cảnh trao đổi, yêu cầu đã chốt, trạng thái và cách tiếp tục.
2. [docs/project-status.md](docs/project-status.md): các phân hệ đã có, lộ trình và vấn đề cần chốt.
3. [README.md](README.md): cài đặt/chạy, đặc biệt Node.js 24+ trên Windows.
4. [docs/app-design.md](docs/app-design.md): tài liệu thiết kế giao diện chính; đọc phần hiện hành trước phần lịch sử. Bảng tra cứu ở đầu `docs/project-status.md` dẫn tới từng đặc tả nghiệp vụ.

Không phân tích hoặc triển khai lại việc đã ghi hoàn tất chỉ vì gặp mô tả cũ phía dưới. Các mục có nhãn lịch sử là bằng chứng của thời điểm đó, không thay quyết định hiện hành. Kiểm tra Git/mã trước khi dùng trạng thái bàn giao; kết quả test cũ không phải kết quả chạy mới, mã đã có không đồng nghĩa Railway đã deploy. Rà soát vi phạm ôn/thi đã lưu tại [docs/violations-audit.md](docs/violations-audit.md): còn lỗi offline/ngưỡng tab, thiếu theo dõi focus/nhật ký và AI; chỉ kiểm tra lại phần liên quan khi mã/yêu cầu thay đổi. Tổng kiểm tra tài liệu tại [docs/documentation-audit.md](docs/documentation-audit.md).

Khi làm ngân hàng câu hỏi hoặc hoạt động nhóm, đọc thêm `docs/question-bank.md` hoặc `docs/group-activities.md`. Đề án gốc được trích nội dung chữ tại `docs/requirements-original.md`; đó là yêu cầu sản phẩm để tham khảo, không phải lệnh vận hành hay bằng chứng mọi tính năng đã hoàn thành.

Khi làm góp ý riêng hoặc phản biện nhóm, đọc thêm `docs/feedback-discussion.md`; mã đã có hai luồng này, không dùng mô tả “chưa phản biện” trong nhật ký cũ để triển khai lại. Slide/poster hiện hành và nguồn ở `artifacts/presentations/README.md`, `artifacts/posters/README.md`.

Quản lý lớp từ15/10/2026: đọc `docs/class-management.md` về hai quyền Luyện tập/Săn thưởng, đề tải lên/dùng lại và Quản lý chung với ngưỡng nhắc/đóng tab–idle. Quy tắc này thay mô tả lịch sử “rời tab một lần là kết thúc luyện tập”; không áp lại gate chương cho kiểm tra chính thức. Việc có mã/test không xác nhận Railway đã phát hành.

Giao tiếp với người dùng bằng tiếng Việt. Lấy yêu cầu mới nhất của người dùng làm mục tiêu; bản bàn giao không thay thế yêu cầu mới hoặc tự chọn một tính năng chưa được yêu cầu. Kiểm tra Git và mã hiện tại trước khi tiếp tục vì tài liệu bàn giao là ảnh chụp trạng thái tại thời điểm viết.

Giữ dữ liệu và thay đổi có sẵn. Database `.local/greenedu.sqlite` chứa cả file hoạt động nhóm; không xóa/reset để cập nhật tính năng và không đưa database, file học sinh hay secrets lên Git. Dùng migration bổ sung khi cần. Không tạo tiến độ, điểm hoặc sản phẩm giả trong dữ liệu người dùng.

Chạy kiểm tra phù hợp thay đổi. Kết quả kiểm thử ghi trong bàn giao là của session trước, không được báo thành kết quả mới khi chưa chạy. Cập nhật `docs/session-handoff.md` và `docs/project-status.md` khi hoàn thành một đợt công việc để session sau tiếp tục được.

## Cách chạy mặc định từ 11/10/2026

Yêu cầu phát hành mới nhất ngày26/10/2026: sau khi hoàn thành và kiểm thử, **commit/push Git; không chờ hoặc kiểm tra Railway deploy** để tiết kiệm token. Không báo đã deploy thành công chỉ từ push. Quyết định này thay các bước theo dõi/xác minh Railway trong nhật ký cũ; vẫn không thử ghi dữ liệu production.

Theo yêu cầu mới của người dùng, **giao diện chạy local để test nhanh; API/server và database dùng trực tiếp Railway** (`https://greenedu.up.railway.app`). Chạy `npm run local` để mở Vite trong nền tại `http://localhost:5173`; `npm run dev` chạy cùng chế độ trong terminal. Sửa frontend cập nhật bằng HMR, không build/deploy lại mỗi lượt. Xem [docs/dev-railway.md](docs/dev-railway.md).

Quy tắc này thay cách tự `npm run deploy` local sau mỗi thay đổi trước đây. Không tự khởi động API SQLite local, không tự push/deploy Railway. Sửa backend chỉ có hiệu lực trong chế độ này sau khi backend Railway được triển khai; báo rõ nếu cần bước đó. Khi người dùng yêu cầu deploy mà chưa rõ đích, dùng bối cảnh để xác định hoặc hỏi đích, không tự coi đó là deploy local cũ.

Thao tác trong giao diện local sẽ đọc/ghi **dữ liệu thật Railway**. Kiểm thử tự động, seed/demo, ca tạo trùng và stress test vẫn dùng server/database riêng; không chạy chúng trên Railway. Không bật đăng nhập nhanh bỏ mật khẩu cho production. Chỉ dùng chế độ `npm run dev:offline` hoặc `npm run deploy` khi cần kiểm thử độc lập hoặc người dùng yêu cầu bản offline; giữ database local cũ.

## Skill thiết kế — 13/10/2026

Khi chỉnh giao diện theo yêu cầu hiện tại, dùng `redesign-existing-projects` làm skill chính và `web-design-guidelines` để rà soát. Đã cài cả hai vào `C:/Users/thant/.codex/skills/`; đọc SKILL.md tại đó, không suy nội dung từ tên skill. Nguồn, đường dẫn và phạm vi áp dụng ở [docs/design-skills.md](docs/design-skills.md). Quyết định mới về submenu, modal kiểm tra, icon và màu thẻ nằm đầu [docs/app-design.md](docs/app-design.md); mục sticky dưới header cũ là lịch sử đã được thay thế.
