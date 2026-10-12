# Kiểm tra online do giáo viên bắt đầu

Cập nhật 12/10/2026. Giáo viên dùng mục riêng **Quản lý kiểm tra online**, học sinh dùng **Kiểm tra online**. Nút Tạo kiểm tra online ở trang Ôn tập & kiểm tra cũng dẫn sang trang riêng. Dùng chung phòng thi/chấm điểm/lưu đáp án hiện có; kiểm tra theo lịch và Săn điểm vẫn ở trang cũ và giữ quy tắc riêng. Thiết kế giao diện chính tại [app-design.md](app-design.md).

## Quy trình và thời gian

Giáo viên sở hữu lớp **bắt buộc chọn một trong hai radio Nguồn đề**: Upload file hoặc Chọn từ ngân hàng, không có nguồn mặc định. Nguồn ngân hàng tích nhiều chương, xổ danh sách bài để lấy toàn chương hoặc chọn nhiều bài riêng; phạm vi mỗi chương độc lập nên có thể lấy toàn chương1 và chỉ vài bài chương2. Số câu/trọng số chỉ xét phạm vi đã chọn, backend vẫn kiểm tra đủ câu.

Upload chọn chương trong chính khối tải file, không cần chọn chương trước ở một khu khác. Nhận Word `.docx` theo mẫu tối đa5MB hoặc CSV UTF-8 tối đa512KB; có đủ4lựa chọn, đáp án và lời giải, tổng đề tối đa100câu. Đọc file thành công hiển thị tên/số câu; lỗi/hỏng/trùng chặn thêm file, giữ các câu đã đọc trước đó. Có thể thêm nhiều file gắn nhiều chương và xem/bỏ từng câu. Chuyển nguồn giữ draft riêng nhưng payload chỉ gửi nguồn đang chọn. Câu riêng không phát hành cho luyện tập. Nhấn **Chuẩn bị kiểm tra online** để lưu bản chờ, chưa thông báo và chưa cho làm bài.

Mỗi buổi có **thời gian chuẩn bị X (0–60 phút, mặc định3)** và **thời gian làm bài Y (1–180 phút, mặc định20)**. Khi nhấn **Bắt đầu kiểm tra**, server chốt một bộ câu chung, ghi thời điểm thông báo T, đặt giờ mở T+X và giờ đóng T+X+Y. Chờ bao lâu trước khi bấm không làm bản chuẩn bị hết hạn. Học sinh vào muộn chỉ có thời gian còn lại tới giờ đóng chung; không cộng Y phút kể từ lúc từng em vào. X=0 mở ngay.

Ngân hàng được kiểm tra đủ câu khi chuẩn bị và được chọn lại/chốt trong transaction khi giáo viên bắt đầu. Nếu phạm vi bị xóa/thiếu câu, thao tác thất bại toàn bộ: chưa mở, chưa thông báo, chưa ghi thời điểm bắt đầu. Đề tải lên dùng snapshot câu riêng đã lưu. Sau khi thông báo, chỉnh ngân hàng không thay bộ đề chung. Mỗi học sinh nhận hoán vị ngẫu nhiên của cùng bộ câu, lưu tại server và giữ nguyên qua reload; không chọn tập câu khác cho từng em. Không đảo lựa chọn A/B/C/D trong đợt này.

## Thông báo học sinh

Thông báo **trong ứng dụng** ở đầu nội dung trên các trang học sinh, kể cả Trang chủ. Hiển thị tên đề/lớp/môn, số câu, Y phút, đồng hồ “Bắt đầu sau …” rồi “Còn …”. Nút **Chờ mở đề** bị khóa trong X phút; tới giờ mở đổi thành **Vào làm kiểm tra**. Học sinh đã có lượt đang làm thấy **Tiếp tục kiểm tra**. Vào từ thông báo chọn đúng lớp và trang Kiểm tra online/phòng thi, kể cả đang ôn bài khác; reload giữ lớp/lượt/trang online. Không tự nộp hoặc tự bắt học sinh vào phòng khi nhận thông báo.

Client hỏi `/api/learning/exam-notices` mỗi10 giây khi trang hiển thị/online, hỏi lại khi trở lại tab/kết nối. Đồng hồ dùng `serverNow` với thời gian đơn điệu trình duyệt; server vẫn quyết định quyền bắt đầu và hạn nộp. Không phải gửi email, push hệ điều hành hoặc thông báo cho người chưa mở ứng dụng. Đăng nhập/reload trong buổi còn mở nhận thông báo lại; nộp bài/giáo viên đóng/hết giờ thì bỏ thông báo. Không lộ câu hỏi, đáp án hoặc email trong thông báo. Chỉ thành viên hiện tại của lớp nhận được; giáo viên/người chưa đăng nhập không đọc endpoint này.

## Quyền, lưu dữ liệu và tương thích

Thi chính thức không yêu cầu cấp/vé/tỷ lệ ôn; giữ một lượt/học sinh/buổi, một bài đang làm/tài khoản, tự lưu đáp án có revision, ngưỡng rời tab mặc định4, chấm/công bố sau đóng. Giáo viên có thể đóng trong lúc chuẩn bị để hủy yêu cầu hoặc khi đang thi để thu bài. Buổi đã gửi thông báo không mở lại để đổi giờ; tạo buổi mới nếu cần thi lại. Gửi lại lệnh bắt đầu trả trạng thái buổi cũ, không lấy đề mới/đổi giờ/thông báo thành buổi khác.

Migration thêm `online_exam_sessions` gắn `exam_definitions`, không sửa bảng/câu/tiến độ hiện có. Lưu duration_minutes, preparation_minutes, question_count, selection và started_at. **started_at trong bảng phụ là T lúc giáo viên phát yêu cầu; giờ thi thực tế là exam_definitions.starts_at.** Schema bổ sung preparation_minutes cho bản thiếu cột, gọi lại an toàn. Câu riêng và snapshot/lượt giữ FK/lịch sử hiện có.

Overview trả capability `onlineExams`, metadata delivery/durationMinutes/preparationMinutes/startedAt; `/exams/:id/open` dùng lại theo delivery. Frontend thiếu capability khóa nút mới và báo chờ backend, không gửi buổi online sang API cũ thành bài thi theo lịch. **Chưa deploy Railway trong đợt triển khai này**; local5173 dùng API Railway nên phần mới cần backend được triển khai mới dùng thật. Kiểm thử chỉ dùng SQLite riêng; bằng chứng tại [session-handoff.md](session-handoff.md).

Đợt tách trang bổ sung `delivery` vào từng lượt trong overview, lấy từ liên kết exam_runs/online_exam_sessions sau phân quyền hiện có; không thêm migration hoặc sửa lượt đã lưu. Trang online lọc buổi/lượt online, trang cũ giữ lịch thi/Săn điểm. Backend cũ thiếu trường phân loại được báo chờ cập nhật thay vì đưa lượt Săn điểm vào lịch sử online. Trường mới cần deploy Railway; kiểm thử chức năng mới không phải nghiệm thu dữ liệu thật.
