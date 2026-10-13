# Cấp icon học sinh theo lớp, môn và chương

## Hình thức icon mới — 13/10/2026

Bộ SVG năm cấp đã được vẽ lại đồng bộ theo khu vườn, dùng chung trong tiến độ/roster/xếp hạng/tài khoản và vườn. Thống kê Cây đã ra hoa dùng cây đơm hoa kèm dấu+. Đây là thay hình hiển thị; giữ tên, số giây, công thức, phạm vi chương, MAX đại diện vườn và thưởng/vé cũ. Thiết kế mới và QA ở [app-design.md](app-design.md), [redesign-qa-20261013.md](redesign-qa-20261013.md).

## Thời gian mỗi cấp do giáo viên cài đặt — 11/10/2026

Giáo viên sở hữu lớp đặt **số phút cho mỗi cấp** tại Ôn tập & kiểm tra → Thời gian tăng cấp. Phạm vi từng lớp/môn, áp dụng mọi chương của lớp; mặc định **60 phút**, số nguyên 1–1440 phút. Với m phút, cấp 1 bắt đầu 0, cấp 2/3/4/5 từ m/2m/3m/4m phút của riêng chương. Ví dụ 30 phút: Chồi 30 phút, Cây Non 60 phút, Đơm Hoa 90 phút, Kết Trái 120 phút. Bảng phía dưới là trường hợp mặc định 60 phút.

Schema bổ sung `classroom_level_settings` (classroom_id, minutes, updated_by, updated_at), không sửa `progress`. Cấp, remainingSeconds, thanh tiến độ, roster/xếp hạng, đại diện MAX chương trong vườn và cây Kết Trái cùng dùng mốc này. API lớp/chương/chapterLevels/learning trả `levelMinutes`; công thức tập trung ở shared/student-levels.ts, backend tra mốc ở server/level-settings.ts. POST `/api/classrooms/:id/level-settings` chỉ chủ lớp được ghi; học sinh/giáo viên khác bị chặn.

Vé cấp 3/4/5 ở 2m/3m/4m; điểm cây cấp 5 ở 4m. Khi thay đổi mốc, cấp/điều kiện vào Săn điểm tính lại từ giây đã ghi, không tạo thời gian. Vé đã cấp/dùng và thưởng đã cấp/duyệt không bị xóa; nguồn vé/thưởng vẫn unique, không cấp lại khi đổi mốc qua lại. Học sinh đọc learning/heartbeat tiếp tục đồng bộ các mốc mới đã đạt theo cơ chế sẵn có. Nâng mốc có thể hạ cấp tính toán nhưng không thu hồi lịch sử.

Theo yêu cầu mới ngày 11/10/2026, cấp icon tính bằng **thời gian học được ghi nhận trong từng chương**, thuộc đúng lớp/môn đang chọn. Quy tắc này thay lựa chọn tổng theo lớp/môn trước đó.

| Cấp | Tên      | Thời gian học của chương     |
| --- | -------- | ---------------------------- |
| 1   | Mầm      | Dưới 1 giờ, gồm học sinh mới |
| 2   | Chồi     | Từ 1 giờ đến dưới 2 giờ      |
| 3   | Cây Non  | Từ 2 giờ đến dưới 3 giờ      |
| 4   | Đơm Hoa  | Từ 3 giờ đến dưới 4 giờ      |
| 5   | Kết Trái | Từ 4 giờ trở lên             |

Một lớp trong GreenEdu gắn với một môn và giáo viên sở hữu. Cấp tính riêng theo `student_id + chapter_id`; chương thuộc `classroom_id` xác định đúng lớp/môn. Không cộng thời gian từ chương khác, lớp khác, môn khác hoặc học sinh khác. Ví dụ hai chương Vật lý cùng có 2 giờ thì mỗi chương đạt Cây Non; tổng 4 giờ không làm cả hai đạt Kết Trái. Chương chưa học vẫn là Mầm.

Chỉ dùng thời gian có hoạt động đã ghi trong bảng `progress` qua đồng hồ/heartbeat máy chủ. Thời gian làm bài kiểm tra, trang bị ẩn và thời gian không hoạt động vẫn theo quy tắc hiện có; icon không tự tạo thời gian hoặc điểm. Tổng sử dụng số giây nguyên của từng chương như danh sách tiến độ/xếp hạng. Không có trường cấp độ do học sinh tự gửi hoặc bảng cấp riêng cần đồng bộ: cấp được suy ra từ tiến độ hiện có, giữ qua restart.

API danh sách lớp trả seconds/level theo chương. Roster và xếp hạng thêm `chapterLevels` gồm chapterId/chapterTitle và metadata cấp từ thời gian riêng. Trường studentLevel tổng cũ còn để tương thích, không được dùng hiển thị cấp cá nhân trong UI mới. Công thức và tên cấp tập trung tại `shared/student-levels.ts`.

**Khu vườn của lớp (11/10/2026):** API `GET /api/classrooms/:id/garden` bổ sung `members` gồm studentId, studentName, avatarId và level cho toàn bộ học sinh đang thuộc lớp. Mỗi bạn xuất hiện một lần với cấp đại diện là **cấp cao nhất trong các chương của lớp đó** (MAX giây từng chương rồi tính cấp), không dùng SUM thời gian. Hai chương cùng 2 giờ vẫn đại diện Cây Non, tiến độ môn/lớp khác không làm tăng cấp. Chưa học hoặc lớp chưa có chương vẫn Mầm; học sinh đã rời lớp không xuất hiện. Endpoint giữ kiểm tra chủ lớp/thành viên và dữ liệu `trees` cũ để tương thích, không trả email/mật khẩu hay tạo tiến độ. Cấp riêng từng chương và điều kiện kiểm tra không đổi. Thiết kế/animation xem [app-design.md](app-design.md).

Theo phản hồi cùng ngày, vườn chứa toàn bộ thành viên trong frame có rào, icon/tên/avatar chuyển động; **Vinh danh Kết Trái · Cấp 5** riêng lọc `members.level === 5`. Cấp5 vẫn nằm trong vườn chung, vinh danh một lần dù nhiều chương đạt. API cũ chưa có members chỉ dùng trees để vinh danh người được backend xác nhận đạt mốc cũ4giờ, không suy toàn bộ roster. Backend mới dùng4m phút theo cài đặt lớp; thay đổi ngưỡng sau đó không tạo thời gian hoặc thu hồi thưởng cũ. Trạng thái triển khai ở [project-status.md](project-status.md).

Cấp icon, cây kiến thức, vé và các điều kiện ôn/thi đều theo chương: tổng đủ 4 giờ của lớp không cấp thêm vé, thưởng cây chương hoặc tự mở bài thi. Cấp icon không thay mật khẩu, vai trò, avatar đã chọn hay dữ liệu tiến độ. Không cần migration tiến độ: dùng số giây từng chương đã có.

Hình thức icon/vị trí/responsive xem [app-design.md](app-design.md); danh mục kiểm thử xem [functional-test-cases.md](functional-test-cases.md). Kiểm thử API có mốc chính xác, phân tách hai môn/hai lớp cùng môn và đối chiếu học sinh–roster–xếp hạng. Trình duyệt kiểm tra đủ năm icon, đổi lớp, tải lại, trang Tài khoản và giáo viên ở desktop/mobile bằng database riêng.
