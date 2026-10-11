# Cấp icon học sinh theo lớp và môn

Người dùng đã chọn phương án 1 ngày 11/10/2026: cấp icon tính bằng **tổng thời gian học được ghi nhận trong lớp/môn đang chọn**.

| Cấp | Tên      | Thời gian học của lớp/môn    |
| --- | -------- | ---------------------------- |
| 1   | Mầm      | Dưới 1 giờ, gồm học sinh mới |
| 2   | Chồi     | Từ 1 giờ đến dưới 2 giờ      |
| 3   | Cây Non  | Từ 2 giờ đến dưới 3 giờ      |
| 4   | Đơm Hoa  | Từ 3 giờ đến dưới 4 giờ      |
| 5   | Kết Trái | Từ 4 giờ trở lên             |

Một lớp trong GreenEdu gắn với một môn và giáo viên sở hữu. Cấp tính riêng theo `classroom_id`, cộng thời gian của các chương thuộc đúng lớp đó. Hai lớp khác nhau cùng môn cũng có cấp riêng. Không cộng thời gian từ lớp khác, môn khác hoặc học sinh khác. Ví dụ học sinh có 4 giờ ở Vật lý đạt Kết Trái, 1 giờ ở Toán đạt Chồi, và 0 giờ ở một lớp Vật lý khác vẫn là Mầm.

Chỉ dùng thời gian có hoạt động đã ghi trong bảng `progress` qua đồng hồ/heartbeat máy chủ. Thời gian làm bài kiểm tra, trang bị ẩn và thời gian không hoạt động vẫn theo quy tắc hiện có; icon không tự tạo thời gian hoặc điểm. Tổng sử dụng số giây nguyên của từng chương như danh sách tiến độ/xếp hạng. Không có trường cấp độ do học sinh tự gửi hoặc bảng cấp riêng cần đồng bộ: cấp được suy ra từ tiến độ hiện có, giữ qua restart.

API danh sách lớp trả `studentLevel` cho học sinh trong từng lớp; giáo viên có giá trị null tại danh sách lớp. Roster và xếp hạng trả cùng metadata cấp của từng học sinh trong lớp đó. Công thức và tên cấp tập trung tại `shared/student-levels.ts`.

Cấp icon học sinh là tổng theo lớp/môn. Cây kiến thức, vé và các điều kiện ôn/thi hiện có vẫn tính theo chương: tổng đủ 4 giờ của lớp không cấp thêm vé, thưởng cây chương hoặc tự mở bài thi. Cấp icon không thay mật khẩu, vai trò, avatar đã chọn hay dữ liệu tiến độ.

Hình thức icon/vị trí/responsive xem [app-design.md](app-design.md); danh mục kiểm thử xem [functional-test-cases.md](functional-test-cases.md). Kiểm thử API có mốc chính xác, phân tách hai môn/hai lớp cùng môn và đối chiếu học sinh–roster–xếp hạng. Trình duyệt kiểm tra đủ năm icon, đổi lớp, tải lại, trang Tài khoản và giáo viên ở desktop/mobile bằng database riêng.
