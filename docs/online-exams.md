# Kiểm tra online do giáo viên bắt đầu

## Cộng thời gian kiểm tra vào chương — 24/10/2026

Form tạo/chỉnh sửa thêm **Cộng thời gian làm bài vào chương**: mặc định Không cộng, hoặc chọn một chương đang dùng trong lớp. Chương nhận giờ độc lập với chương lấy câu hỏi; lưu `online_exam_sessions.progress_chapter_id`, trả lại khi chỉnh sửa và hiển thị ở thông tin buổi thi. Chỉ đổi khi buổi còn được chỉnh sửa theo quy tắc hiện hành. Bài cũ mặc định null, không hồi tố thời gian.

Khi học sinh nộp hợp lệ, giáo viên thu bài hoặc hết hạn, cộng khoảng từ lúc học sinh bắt đầu lượt đến min(thời điểm kết thúc, hạn thi). Không cộng thời gian chuẩn bị, thời gian trước khi học sinh vào, phần quá hạn hoặc lượt bị đóng do tabs/idle. Ngay cả worker chạy muộn và chốt lý do deadline, vẫn kiểm tra idle/tab tại hạn thi trước khi cộng. Đây là thời lượng lượt thi theo server, không khẳng định đo được mức độ tập trung thực tế.

`exam_study_credit` lưu một receipt mỗi run; cùng transaction nộp bài cập nhật progress và study_daily_time theo ngày UTC+7, nên tải lại/nộp lại/worker không cộng hai lần. Receipt không phụ thuộc FK vào run để xóa buổi thi không xóa giờ đã ghi; thống kê ngày/tuần/tháng đọc được giờ này. Không cộng vào chỉ tiêu **luyện tập tối thiểu mỗi tuần**, vốn là yêu cầu luyện tập riêng. Không đổi gate cấp/vé cho kiểm tra chính thức. Tùy chọn này thay quy tắc lịch sử “thi không cộng giờ” chỉ đối với buổi online có chọn chương.

Overview thêm `examProgressCredit`; migration bổ sung cột/bảng an toàn, không reset database. Chỉ có hiệu lực trên Railway sau khi backend mới được triển khai.

## Hẹn giờ bắt đầu và chỉnh sửa đề —20/10/2026

Giáo viên vào **Kiểm tra → Tạo bài kiểm tra**, chọn nguồn đề rồi bật **Hẹn giờ bắt đầu**. Chọn **Ngày và giờ bắt đầu (giờ Việt Nam)**; ứng dụng dùng UTC+7, không phụ thuộc múi giờ máy giáo viên. Đây là giờ bắt đầu làm bài, không phải giờ bắt đầu đếm thời gian chuẩn bị. Hạn kết thúc bằng giờ đã chọn cộng số phút làm bài; học sinh vào muộn chỉ có phần thời gian còn lại. Không bật hẹn giờ thì vẫn lưu bản nháp và bắt đầu thủ công như trước.

Lưu bài có lịch sẽ tự mở đúng mốc đã lưu dù giáo viên đóng trình duyệt. Thông báo trong app xuất hiện từ X phút trước giờ bắt đầu; nếu tạo/chỉnh khi đã nằm trong khoảng chuẩn bị thì thông báo từ lúc lưu. Không phát email hay tự ép học sinh vào phòng. Popup sau tạo xác nhận lịch/giờ Việt Nam, có **Chỉnh sửa thông tin** và **Đã hiểu**; không có Bắt đầu ngay để tránh vô tình đổi lịch. Danh sách hiển thị Đã hẹn giờ, giờ mở/hạn kết thúc và vẫn cho học sinh chờ tới giờ mở.

Nút **Chỉnh sửa thông tin** có trong popup sau tạo và trên từng buổi online. Mở lại đầy đủ tên, nguồn/chương/bài/trọng số/số câu hoặc câu tải lên, thời gian chuẩn bị/làm bài, ngưỡng rời tab và lịch đã lưu. Có thể thay nội dung đề, đổi lịch hoặc bỏ chọn hẹn giờ rồi **Lưu thay đổi** để trở về bản chờ bắt đầu thủ công. Đóng form bằng X/Escape bỏ chỉnh sửa chưa lưu. Lưu lỗi giữ nguyên dữ liệu để thử lại; lưu thành công cập nhật cùng ID, không tạo buổi mới. Đề upload giữ câu đã tải, không bắt upload lại khi sửa tên/thời gian; câu riêng không thay đổi được tái dùng ID.

Chỉ chủ lớp được xem dữ liệu chỉnh sửa hoặc cập nhật. Bản chờ thủ công được sửa; bài hẹn giờ được sửa trước giờ làm bài và chưa có lượt thi, kể cả khi đang trong khoảng thông báo chuẩn bị. Bài đã bắt đầu, đã đóng hoặc đã có bài làm bị khóa chỉnh sửa tại server, không chỉ dựa vào nút disabled. Bài hẹn giờ chưa tới giờ bắt đầu có thể xóa bằng hộp xác nhận hiện có; khi đang thi vẫn phải đóng/thu bài trước. Không đổi dữ liệu bài đã nộp hoặc buổi khác.

### API, snapshot và lưu lịch

Overview thêm `examScheduling`, `examEditing` và `exams[].scheduledStartAt`; client dùng backend cũ khóa điều khiển mới, không gửi lịch sang API chưa hỗ trợ. POST tạo online nhận `scheduledStartAt` là timestamp milliseconds UTC hoặc null. Ngày giờ phải ở tương lai; số phút chuẩn bị/làm bài và nguồn đề vẫn được kiểm tra như cũ. GET `/api/learning/exams/:id/edit` trả draft đầy đủ chỉ cho chủ lớp, POST `/api/learning/exams/:id/update` dùng cùng validation/transaction với tạo; requestId chống lưu lặp gắn với thao tác/ID đề/nội dung. Lỗi không thay dữ liệu đã lưu, private question insert hoặc bản ghi request.

Migration bổ sung cột nullable `online_exam_sessions.scheduled_start_at`, gọi lại an toàn và giữ mọi dữ liệu cũ. Với bài hẹn giờ, `exam_definitions.starts_at` là giờ làm bài đã chọn, `closes_at` là hạn chung, `enabled=1`; bộ câu được chốt ngay khi lưu/chỉnh, kể cả nguồn ngân hàng, để ngân hàng thay đổi sau đó không làm lịch tự mở thất bại. `online_exam_sessions.started_at` của bài hẹn giờ là **mốc bắt đầu thông báo chuẩn bị**, có thể ở tương lai, bằng max(thời điểm lưu, giờ làm bài−X). API thông báo lọc mốc này; quyền vào bài luôn kiểm tra giờ mở/đóng trên server. Không cần trình duyệt hoặc cron kích hoạt mở bài: các mốc/quyền đã lưu và vẫn có hiệu lực sau server khởi động lại. Worker thu bài hết hạn hiện có giữ nguyên. Bài ngân hàng chưa hẹn vẫn chọn/chốt lại câu khi giáo viên bắt đầu thủ công.

Bản cập nhật cần triển khai backend Railway; build/test riêng không chứng minh production đã có migration/capability. QA và trạng thái Git của lượt này ở đầu session-handoff; không áp các ghi chú lịch sử “bài chưa bắt đầu không có giờ ấn định” hoặc “không được sửa sau thông báo” vào bài hẹn giờ mới.

## Xóa bài kiểm tra — 19/10/2026

Giáo viên sở hữu lớp có nút **Xóa bài kiểm tra** ở từng buổi trong mục Kiểm tra, gồm bài online và lịch kiểm tra cũ. Chỉ xóa đề chưa bắt đầu hoặc bài đã kết thúc/đóng; buổi đang thông báo/chờ/đang thi cần Đóng bài thi trước để thu bài. Bài hết hạn tự chốt lượt quá hạn trước khi kiểm tra điều kiện xóa. Không cho học sinh, giáo viên lớp khác hoặc admin thay quyền chủ lớp.

Hộp xác nhận nêu rõ đề và toàn bộ bài làm/điểm/kết quả của buổi sẽ bị xóa vĩnh viễn, gợi ý tải kết quả trước; Hủy là lựa chọn an toàn. Khóa nút/đóng modal khi đang xóa, lỗi giữ modal để thử lại, thành công bỏ đúng buổi/lượt khỏi danh sách và trả focus về Tạo bài kiểm tra. Giữ nguyên ngân hàng câu hỏi, tiến độ, luyện tập/sửa sai và dữ liệu buổi khác. Không thao tác xóa nào đã được thực hiện trên dữ liệu thật trong lượt phát triển này.

POST `/api/learning/exams/:id/delete` kiểm tra teacher/chủ lớp, 409 nếu buổi còn mở hoặc còn lượt active; xóa exam_tab_events, exam_activity, exam_runs, online_exam_sessions, exam_creation_requests và exam_definitions trong một transaction. Lỗi ở bất kỳ bước nào rollback toàn bộ. Không cần migration. Overview thêm capability examDeletion; frontend với backend cũ khóa nút và báo cần cập nhật Railway.

## Điều hướng hiện hành — 15/10/2026

Kiểm tra online là tab thứ3 trong khu vực **Ôn tập / Kiểm tra săn thưởng / Kiểm tra online**; lối tắt thanh điều hướng chính giữ nguyên. Ôn tập mới dùng bài có tiêu đề/đề riêng, săn thưởng có tab riêng. Online giữ các buổi thi, tạo mới/thông báo và các **Lịch kiểm tra đã lưu** từ luồng cũ; không xóa hay sửa các đề/kết quả cũ khi tách trang. [Chi tiết ôn/thi hiện hành](review-papers.md).

Cập nhật giao diện15/10/2026. Giáo viên/học sinh vào mục riêng **Kiểm tra online**. Đã bỏ shortcut tạo online ở Ôn tập & kiểm tra. Giáo viên bấm **Tạo bài kiểm tra** để mở form trong modal; **Lưu bài kiểm tra** thành công đóng form và mở popup **Đã tạo bài kiểm tra** với nội dung “Đã lưu bài kiểm tra. Bạn có thể bắt đầu ngay hoặc để sau.” Hai nút **Bắt đầu ngay** và **Để sau**: nút đầu dùng ID trả về khi lưu để gọi API open hiện có, phát thông báo/áp dụng X/Y đã cài; nút sau đóng popup, bài vẫn chờ trong danh sách. Không hiện thêm banner thành công cũ. Khi đang bắt đầu khóa cả hai nút và thao tác đóng popup; thất bại giữ popup/lỗi để thử lại, thành công đóng popup và cập nhật danh sách. Đóng popup/bắt đầu thành công trả focus về Tạo bài kiểm tra. Lưu thất bại giữ form, không báo thành công. Trang mặc định chỉ còn danh sách; học sinh không có nút tạo. Các nút Làm mới đã bỏ, dùng poll15giây/focus/reconnect và Thử lại khi lỗi. Metadata mỗi buổi tách nhãn có icon/màu, giữ các quy tắc thời gian/quyền bên dưới. Dùng chung phòng thi/chấm điểm/lưu đáp án hiện có; lịch kiểm tra cũ được giữ ở Online, Săn thưởng ở tab riêng và giữ quy tắc nghiệp vụ. Thiết kế giao diện chính tại [app-design.md](app-design.md).

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
