# Giáo viên chỉ xem

Tài khoản được gắn với một giáo viên sở hữu dữ liệu bằng bảng bổ sung `teacher_viewers(user_id, teacher_id)`. Tài khoản có tên đăng nhập/mật khẩu và phiên riêng; xem các lớp hiện có và các lớp tạo thêm của giáo viên đó. Không sao chép lớp, học sinh, câu hỏi hoặc điểm. Admin không được thay thế quyền chủ lớp. Không xem được lớp của giáo viên khác.

API đăng nhập/auth/me trả `role: teacher`, `readOnly: true` và **ID/tên/email của người xem**. Middleware áp phạm vi ID giáo viên sở hữu chỉ cho các lượt đọc tài nguyên; các đường `/auth/` giữ danh tính thật. Chặn mọi phương thức ghi trước khi vào các handler, kể cả tạo lớp, câu hỏi, upload, hoạt động nhóm, góp ý, mở/khóa thi và duyệt điểm. Chỉ cho đổi mật khẩu của chính người xem và đăng xuất. Không sửa mật khẩu/phiên/tài khoản giáo viên sở hữu. Mapping được đọc mỗi request; chủ dữ liệu không còn là giáo viên thì từ chối, bỏ mapping thì mất quyền xem.

Trong bảng users, tài khoản người xem mới dùng vai trò nền `student`, **không có membership**. Đây là cơ chế đóng quyền khi server cũ chưa hỗ trợ mapping: tài khoản không có quyền giáo viên hoặc lớp nào trước khi bản mới hoạt động. Middleware/publicUser mới mới hiển thị vai trò giáo viên chỉ xem. Không cấp membership hay chuyển vai trò nền sang teacher. Không có tiến độ/điểm/dữ liệu học sinh giả được tạo cho tài khoản này.

Giao diện giữ bố cục giáo viên và có thông báo Chỉ xem. Các điều khiển tạo/sửa/xóa/cấp lại mật khẩu/mở thi/duyệt điểm được ẩn hoặc khóa; bộ lọc/tìm kiếm, lịch sử, xem sổ tay/bài nộp và tải báo cáo vẫn dùng GET trong phạm vi được cấp. Client chặn gửi thao tác ghi để phản hồi rõ; server là nơi thực thi quyền, không dựa vào trạng thái DOM.

## Tạo tài khoản mới

Dùng biến môi trường `VIEWER_LOGIN`, `VIEWER_OWNER` (email giáo viên), `VIEWER_NAME`, `VIEWER_PASSWORD`, `DATABASE_PATH` rồi chạy `node --import tsx server/create-teacher-viewer.ts` trên máy sở hữu database cần thao tác. Tên đăng nhập ngắn dùng miền greenedu.nk như luồng đăng nhập hiện có. Script chỉ tạo tài khoản mới và mapping trong transaction; không ghi đè/reset tài khoản đã có, không nhận mật khẩu qua đối số, không in hash/mật khẩu. Không commit các biến môi trường hay thông tin xác thực.

Đã tạo tài khoản `giaovien-nk` theo yêu cầu, gắn với `thanhphuong@greenedu.nk`; mật khẩu do người dùng cung cấp không lưu trong tài liệu/Git. Việc tạo thực hiện trực tiếp qua SSH trong transaction, không đăng nhập thao tác bằng tài khoản thanhphuong, không sửa dữ liệu lớp/bài/điểm. Mã quyền xem cần bản mới; theo yêu cầu người dùng chỉ commit/push Git, không chờ/xác minh deploy Railway.
