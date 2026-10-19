# Luyện tập tối thiểu mỗi tuần

## Quyết định hiện hành ngày 16 tháng 10 năm 2026

Giáo viên chủ lớp vào **Quản lý lớp → Cài đặt chung → Luyện tập tối thiểu mỗi tuần** để đặt số phút tối thiểu cho mỗi học sinh trong đúng lớp/môn. Phạm vi cộng tất cả chương trong lớp, gồm thời gian luyện, ôn và sửa sai đã ghi nhận; không cộng giờ thi, trang vườn hoặc thời gian vắng mặt. Đây là yêu cầu theo tuần, không thay cấp độ riêng từng chương và không tự khóa quyền học hoặc trừ điểm.

Tuần dùng giờ Việt Nam UTC+7: **00:00 thứ Hai đến 24:00 Chủ nhật (00:00 thứ Hai kế tiếp)**. Lúc **12:00 Chủ nhật tạm chốt danh sách** để cô giáo dùng nhắc các em chưa đủ chỉ tiêu. Học sinh vẫn được luyện tập và cộng thời gian chiều/tối Chủ nhật. **Chốt lần cuối vào cuối ngày Chủ nhật**; đúng mốc 00:00 thứ Hai, thời gian bắt đầu thuộc tuần mới. Quyết định này thay yêu cầu cũ dừng cộng giờ sau 12:00.

Danh sách nhắc nhở lúc trưa được giữ riêng, không đổi theo kết quả học bù, thay tên/xóa học sinh hoặc xác nhận vi phạm muộn. Danh sách cập nhật/final phản ánh giờ hợp lệ sau học bù, gồm việc loại phiên vi phạm. Không gửi tin tự động trong thay đổi này; cô giáo sử dụng danh sách để gửi nhắc nhở. Nếu tuần được tạo sau 12:00 hoặc bắt đầu tracking sau mốc đó, không dựng một danh sách trưa giả.

## Giao mức tối thiểu và giữ lịch sử

- Số phút nguyên từ0đến9360, giữ giới hạn cấu hình156giờ của bản trước; 0là tắt giao mức mới.
- Lần cấu hình đầu tiên trước hạn áp dụng tuần hiện tại; nếu sau hạn, bắt đầu thứ Hai tiếp theo. Sau khi đã có cấu hình, thay đổi áp dụng từ tuần sau, giữ mức tuần đang chạy và các tuần trước. Gửi lại cùng mức đã lưu không đổi tuần hiệu lực.
- Mức từng tuần lưu riêng; danh sách học sinh được đồng bộ khi tuần đang mở. Sau cuối ngày Chủ nhật giữ danh sách/tên của tuần đó, không dùng roster hiện tại để viết lại lịch sử. Worker đồng bộ mỗi giây; API cũng chốt khi đọc sau hạn, hỗ trợ khôi phục sau restart.
- Không dựng lại thời gian cũ từ progress hoặc study_daily_time. Tracking chính xác bắt đầu khi backend mới khởi động; tuần đầu thiếu lịch sử có thông báo mốc bắt đầu. Không tạo báo cáo cho các tuần hoàn toàn không có máy chủ chạy để chụp danh sách.

## Báo cáo cho giáo viên

Trong cùng khu vực có bộ chọn tuần, thời gian mở/đóng, mức tối thiểu đã giao và hai danh sách **Đã hoàn thành / Chưa hoàn thành**. Mỗi học sinh có thời gian đã học; danh sách chưa hoàn thành thêm thời gian còn thiếu. Đạt khi tổng thời gian ít nhất bằng mức tối thiểu. Trước trưa hiển thị tạm tính; sau trưa hiển thị đã tạm chốt và vẫn tính học bù; sau cuối ngày hiển thị đã kết thúc tuần. Bộ chọn danh sách chuyển giữa cập nhật/chốt cuối ngày và tạm chốt 12:00 dùng nhắc nhở. Không gửi email hoặc thông báo bên ngoài ứng dụng trong đợt này.

Thời gian của phiên học có thể bị xác nhận vi phạm muộn. Khi ledger phiên bị hủy do tab/idle, credit tuần của đúng phiên cũng bị loại, kể cả báo cáo tuần đã kết thúc; giao diện nêu rõ quy tắc này. Khóa học theo quyết định giáo viên giữ giờ hợp lệ. Khoảng học gửi sau hạn chỉ cộng phần thực sự xảy ra trước hạn; vẫn cộng chiều Chủ nhật trước 24:00. Mức giao và roster của báo cáo vẫn được giữ.

## Mã và dữ liệu

Migration bổ sung `weekly_practice_tracking`, `weekly_practice_settings`, `weekly_practice_periods`, `weekly_practice_members`, `weekly_practice_credit` và index; bổ sung before_noon_ms để cắt đúng giờ trước trưa, bảng weekly_practice_preliminary và weekly_practice_checkpoints lưu danh sách trưa, noon_eligible tránh dựng danh sách khi tuần được tạo sau trưa. Không reset dữ liệu. Credit theo session/lớp/tuần nằm cùng transaction với progress và daily history; rollback hoặc hủy phiên không tạo thời gian riêng lệch với báo cáo cũ.

GET/POST `/api/classrooms/:id/weekly-practice` chỉ giáo viên sở hữu lớp; GET nhận `week=YYYY-MM-DD` để xem lại tuần đã lưu. POST nhận `minutes`. Server xác định lịch và tuần hiệu lực, không tin giờ do frontend gửi. Hai danh sách không trả qua API học sinh hoặc giáo viên lớp khác. Frontend dùng `WeeklyPractice`, giữ nháp khi polling/chuyển submenu, thông báo cần cập nhật Railway khi gặp backend cũ.

Migration giữ nguyên giờ đã có; báo cáo bị đóng lúc trưa theo bản cũ sẽ được mở lại nếu tuần còn diễn ra, hoặc đổi mốc đóng sang cuối ngày nếu tuần đã qua. Phần chiều Chủ nhật từng bị bản cũ bỏ qua không thể dựng lại từ credit tuần, nên không bù dữ liệu giả. Cấu hình đã lên lịch cho tuần sau giữ nguyên.

Các kiểm thử dùng SQLite/cổng riêng. Lượt đổi hai mốc chưa push/deploy; frontend local dùng Railway sẽ chỉ dùng tính năng khi backend mới được triển khai. Không chỉnh database thật để tạo báo cáo minh họa. Tài liệu Word11trang của lượt trước chưa bổ sung chức năng mới này.
