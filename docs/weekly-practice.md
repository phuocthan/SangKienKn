# Luyện tập tối thiểu mỗi tuần

## Quyết định hiện hành ngày 16 tháng 10 năm 2026

Giáo viên chủ lớp vào **Quản lý lớp → Cài đặt chung → Luyện tập tối thiểu mỗi tuần** để đặt số phút tối thiểu cho mỗi học sinh trong đúng lớp/môn. Phạm vi cộng tất cả chương trong lớp, gồm thời gian luyện, ôn và sửa sai đã ghi nhận; không cộng giờ thi, trang vườn hoặc thời gian vắng mặt. Đây là yêu cầu theo tuần, không thay cấp độ riêng từng chương và không tự khóa quyền học hoặc trừ điểm.

Tuần dùng giờ Việt Nam UTC+7: **00:00 thứ Hai đến 12:00 trưa Chủ nhật**. Đầu tuần được tính, đúng mốc đóng và phần chiều Chủ nhật không được tính vào tuần đó hoặc tuần sau. Học sang thứ Hai bắt đầu cửa sổ mới. Thời gian được cắt từ khoảng ghi nhận chính xác, không lấy một nửa tổng ngày Chủ nhật.

## Giao mức tối thiểu và giữ lịch sử

- Số phút nguyên từ0đến9360, tối đa toàn bộ cửa sổ156giờ; 0là tắt giao mức mới.
- Lần cấu hình đầu tiên trước hạn áp dụng tuần hiện tại; nếu sau hạn, bắt đầu thứ Hai tiếp theo. Sau khi đã có cấu hình, thay đổi áp dụng từ tuần sau, giữ mức tuần đang chạy và các tuần trước. Gửi lại cùng mức đã lưu không đổi tuần hiệu lực.
- Mức từng tuần lưu riêng; danh sách học sinh được đồng bộ khi tuần đang mở. Sau hạn giữ danh sách/tên của tuần đó, không dùng roster hiện tại để viết lại lịch sử. Worker đồng bộ mỗi giây; API cũng chốt khi đọc sau hạn, hỗ trợ khôi phục sau restart.
- Không dựng lại thời gian cũ từ progress hoặc study_daily_time. Tracking chính xác bắt đầu khi backend mới khởi động; tuần đầu thiếu lịch sử có thông báo mốc bắt đầu. Không tạo báo cáo cho các tuần hoàn toàn không có máy chủ chạy để chụp danh sách.

## Báo cáo cho giáo viên

Trong cùng khu vực có bộ chọn tuần, thời gian mở/đóng, mức tối thiểu đã giao và hai danh sách **Đã hoàn thành / Chưa hoàn thành**. Mỗi học sinh có thời gian đã học; danh sách chưa hoàn thành thêm thời gian còn thiếu. Đạt khi tổng thời gian ít nhất bằng mức tối thiểu. Trước hạn hiển thị tạm tính; sau hạn hiển thị đã kết thúc tuần. Không gửi email hoặc thông báo bên ngoài ứng dụng trong đợt này.

Thời gian của phiên học có thể bị xác nhận vi phạm muộn. Khi ledger phiên bị hủy do tab/idle, credit tuần của đúng phiên cũng bị loại, kể cả báo cáo tuần đã kết thúc; giao diện nêu rõ quy tắc này. Khóa học theo quyết định giáo viên giữ giờ hợp lệ. Khoảng học gửi sau hạn chỉ cộng phần thực sự xảy ra trước hạn; không cộng thời gian chiều Chủ nhật. Mức giao và roster của báo cáo vẫn được giữ.

## Mã và dữ liệu

Migration bổ sung `weekly_practice_tracking`, `weekly_practice_settings`, `weekly_practice_periods`, `weekly_practice_members`, `weekly_practice_credit` và index; không reset dữ liệu. Credit theo session/lớp/tuần nằm cùng transaction với progress và daily history; rollback hoặc hủy phiên không tạo thời gian riêng lệch với báo cáo cũ.

GET/POST `/api/classrooms/:id/weekly-practice` chỉ giáo viên sở hữu lớp; GET nhận `week=YYYY-MM-DD` để xem lại tuần đã lưu. POST nhận `minutes`. Server xác định lịch và tuần hiệu lực, không tin giờ do frontend gửi. Hai danh sách không trả qua API học sinh hoặc giáo viên lớp khác. Frontend dùng `WeeklyPractice`, giữ nháp khi polling/chuyển submenu, thông báo cần cập nhật Railway khi gặp backend cũ.

Các kiểm thử dùng SQLite/cổng riêng. Chưa push hoặc deploy trong yêu cầu này; frontend local dùng Railway sẽ chỉ dùng tính năng khi backend mới được triển khai. Không chỉnh database thật để tạo báo cáo minh họa. Tài liệu Word11trang của lượt trước chưa bổ sung chức năng mới này.
