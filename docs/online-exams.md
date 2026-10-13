# Kiểm tra online do giáo viên bắt đầu

Cập nhật giao diện13/10/2026. Giáo viên/học sinh vào mục riêng **Kiểm tra online**. Đã bỏ shortcut tạo online ở Ôn tập & kiểm tra. Giáo viên bấm **Tạo bài kiểm tra** để mở form trong modal; **Lưu bài kiểm tra** thành công đóng form, thông báo đã lưu vào danh sách và có thể bắt đầu bất cứ lúc nào. Trang mặc định chỉ còn danh sách; học sinh không có nút tạo. Các nút Làm mới đã bỏ, dùng poll15giây/focus/reconnect và Thử lại khi lỗi. Metadata mỗi buổi tách nhãn có icon/màu, giữ các quy tắc thời gian/quyền bên dưới. Dùng chung phòng thi/chấm điểm/lưu đáp án hiện có; kiểm tra theo lịch và Săn điểm vẫn ở trang cũ và giữ quy tắc riêng. Thiết kế giao diện chính tại [app-design.md](app-design.md).

## Quy trình và thời gian

### Nhóm quản lý buổi thi — quyết định mới 12/10/2026

Mỗi ID buổi là một nhóm gồm lịch, trạng thái và lượt/kết quả, kể cả hai buổi trùng tên. **Chuẩn bị** khi chưa phát yêu cầu hoặc đang trong X phút chờ; **Đang thi** khi đã mở và còn hạn; **Kết thúc** khi giáo viên đóng hoặc hết hạn chung. Buổi chưa bắt đầu không hết hạn theo mốc nháp. Số tham gia/đã nộp lấy toàn bộ lượt đúng exam_id, không suy từ 200 lượt gần nhất của lớp. Học sinh nộp sớm không tự kết thúc buổi. Thời gian mở/hạn chung hiển thị trong nhóm; chưa bắt đầu ghi Chưa ấn định.

Overview bổ sung `serverNow`, `onlineExamGroups`, `participants`, `myRun` riêng học sinh và `runs.examId`. GET `/api/learning/exams/:id/runs` lấy lượt của đúng buổi khi mở danh sách: chủ lớp thấy mọi lượt, học sinh chỉ lượt mình. GET `/api/learning/exams/:id/results.xlsx` chỉ chủ lớp sau kết thúc; trước bắt đầu/đang chờ/đang thi trả409, student/teacher khác403. File Excel gồm hai sheet Buổi kiểm tra/Kết quả, học sinh đã tham gia và thành viên chưa tham gia; tên/email dùng ô văn bản, không thực thi công thức. Chốt các lượt quá hạn trước xuất; không chứa mật khẩu/đáp án/lời giải. Không thêm migration.

Theo lựa chọn mới của người dùng, bài đã nộp (thủ công/tự nộp do tab/hết giờ/giáo viên đóng) **mở lại ôn/luyện/sửa sai và tính giờ ngay**, buổi lớp vẫn có thể đang thi. Bài active vẫn khóa; không mở lại/đổi đáp án của lượt đã nộp. Điểm thi chính thức cũng được ẩn ở phòng thi/overview/danh sách của student cho đến đóng buổi, cùng đáp án/câu sai. Room bổ sung capability `practiceAfterSubmission` để UI không hứa sai khi còn dùng backend cũ. Đợt này chưa push/deploy Railway, frontend local vẫn dùng server thật cũ cho tới deploy.

Giáo viên sở hữu lớp **bắt buộc chọn một trong hai radio Nguồn đề**: Upload file hoặc Chọn từ ngân hàng, không có nguồn mặc định. Nguồn ngân hàng tích nhiều chương, xổ danh sách bài để lấy toàn chương hoặc chọn nhiều bài riêng; phạm vi mỗi chương độc lập nên có thể lấy toàn chương1 và chỉ vài bài chương2. Số câu/trọng số chỉ xét phạm vi đã chọn, backend vẫn kiểm tra đủ câu.

Upload chọn chương trong chính khối tải file, không cần chọn chương trước ở một khu khác. Nhận Word `.docx` theo mẫu tối đa5MB hoặc CSV UTF-8 tối đa512KB; có đủ4lựa chọn, đáp án và lời giải, tổng đề tối đa100câu. Đọc file thành công hiển thị tên/số câu; lỗi/hỏng/trùng chặn thêm file, giữ các câu đã đọc trước đó. Có thể thêm nhiều file gắn nhiều chương và xem/bỏ từng câu. Chuyển nguồn giữ draft riêng nhưng payload chỉ gửi nguồn đang chọn. Câu riêng không phát hành cho luyện tập. Nhấn **Lưu bài kiểm tra** trong modal để lưu bản chờ, chưa thông báo và chưa cho làm bài.

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
