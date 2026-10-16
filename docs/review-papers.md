# Ôn tập, săn thưởng và kiểm tra

## Quy trình hiện hành — cập nhật 16/10/2026

Khu vực ôn/thi có ba tab cho giáo viên và học sinh: **Ôn tập**, **Săn thưởng**, **Kiểm tra**. Giữ năm vị trí trên thanh điều hướng chính; Ôn tập mở danh sách bài ôn. Giáo viên dùng submenu Kiểm tra, vị trí sidebar Kiểm tra online cũ nay là Quản lý lớp; học sinh giữ lối tắt Kiểm tra. Chuyển giữa ba tab không đổi vị trí icon. Tab được lưu trong URL; phòng thi giữ mã lượt để tải lại đúng bài. Nút Tạo bài ôn nằm trong nội dung, phía trên Bài ôn của lớp, không trên header.

### Ôn tập

Giáo viên chọn lớp → Ôn tập → **Tạo bài ôn** → nhập **Tiêu đề bài ôn** → tải Word/CSV theo mẫu → kiểm tra câu đã đọc → **Lưu bài ôn**. Có thể tải nhiều file vào một hoặc nhiều chương; tổng 1–100 câu. Word `.docx` tối đa5MB/file, CSV UTF-8 tối đa512KB/file, các giới hạn câu/dạng câu như ngân hàng. Mẫu Word/CSV có sẵn trong hộp tạo. File gốc được đọc trên trình duyệt, chỉ dữ liệu câu đã chuẩn hóa được gửi/lưu; không phải kho lưu tệp Word gốc.

Học sinh vào **Bài ôn của lớp**, chọn đúng tiêu đề và bấm **Bắt đầu ôn**. Khi kết thúc phiên hoặc tải lại, **Đang ôn → Tiếp tục ôn** mở đúng thứ tự/câu/đáp án đã lưu. Hoàn thành có **Làm lại bài**, tạo lượt mới và giữ lượt cũ. Tên bài ôn xuất hiện trong màn làm câu hỏi.

Đây là ôn tự học, không đặt hạn nộp/thời gian thi hoặc dùng vé. Thời gian có tương tác và sổ tay sửa sai tiếp tục theo quy tắc ôn hiện có; không tự thêm thời gian/điểm/vé. Khóa luyện tập của chương và khóa ôn trong lúc đang thi vẫn được kiểm tra ở server. Trả lời sai không lộ đáp án/lời giải; trả lời đúng mới mở.

Bộ ôn cũ từ ngân hàng vẫn hiện theo tiêu đề. Giáo viên có thể chọn **Nguồn câu hỏi → Ngân hàng câu hỏi**, chọn chương/số câu/trọng số. Học sinh còn **Ôn từ ngân hàng** dạng mở rộng để ôn chương/học kỳ; danh sách bài có tiêu đề là nội dung chính.

### Kiểm tra săn thưởng

Tách thẻ điều kiện/vé, lượt săn và duyệt điểm khỏi Ôn tập. Giáo viên quản lý đề ngay tại tab mới bằng **Mở/Khóa săn thưởng** theo chương, dùng lại `HuntAccess`: upload/dùng lại đề, X phút chuẩn bị/Y phút làm, giới hạn rời tab, khóa/thu bài và tùy chọn xóa đề cấu hình. Lối quản lý trong Quản lý lớp vẫn còn. Thiết lập học kỳ/cách tính tỷ lệ nằm trong **Thiết lập chương**.

Học sinh vẫn cần cấp3, tỷ lệ đúng, sửa sai và vé theo [quản lý lớp](class-management.md). Việc tách tab không mở quyền hay bỏ điều kiện. Lượt/kết quả săn và điểm chờ duyệt chỉ xuất hiện tại đây.

### Kiểm tra online

Giữ tạo đề ngân hàng/upload, popup **Bắt đầu ngay/Để sau**, thời gian chuẩn bị/làm bài chung, thông báo cả lớp, nộp/thu bài và kết quả theo buổi. Không lẫn điểm/vé săn thưởng hoặc bài ôn. Các đề theo lịch đã lưu từ trước được giữ ở **Lịch kiểm tra đã lưu**, quản lý mở/đóng, vào làm/tiếp tục/xem kết quả như cũ; không di chuyển hoặc viết lại snapshot/lượt thi trong database. Đề tạo mới qua giao diện dùng luồng online. API đề theo lịch vẫn tương thích.

## API và dữ liệu

- `POST /api/classrooms/:id/review-papers`: chỉ giáo viên sở hữu lớp. Nhận `title`, `chapterIds`, `questions:[{chapterId,question}]`, `requestId`. Kiểm tra toàn bộ lớp/chương/dạng câu/tên bài/câu trùng trước ghi; transaction rollback toàn bộ nếu có lỗi. Cần tạo lại bài đã archive trước khi nhập, ưu tiên tên bài đang dùng tương đương.
- `GET /api/classrooms/:id/learning`: `reviewPapers:true`; `blueprints` thêm `source:upload|bank`, `createdAt`. Chỉ metadata tiêu đề/số câu/chương, không trả đề hoặc đáp án. Client gặp API cũ khóa tạo từ file và thông báo cần cập nhật backend.
- `POST /api/classrooms/:id/reviews {blueprintId,requestId}`: học sinh thành viên chọn bài. Bộ upload dùng snapshot riêng, đảo thứ tự một lần cho phiên; bộ ngân hàng cũ tiếp tục chọn từ ngân hàng. Các endpoint đọc/trả lời/next/repeat giữ giao thức cũ.
- Migration bổ sung `review_papers` (snapshot đề, liên kết blueprint, giáo viên/request/fingerprint) và `review_paper_sessions` (liên kết phiên với đề upload). Giữ nguyên số cột của bảng blueprint/session cũ, không reset/backfill hoặc sửa lịch sử.
- Câu đề upload lưu `active=0` để attempts/sổ tay có tham chiếu thật, không tự phát hành vào luyện tập/ngân hàng đang dùng. Snapshot phiên/đề giữ nguyên khi ngân hàng thay đổi. Làm lại bộ upload dùng snapshot riêng vì câu upload không có trong ngân hàng active.
- Retry tạo cùng request/nội dung trả lại đúng bài, không thêm câu. Cùng mã cho nội dung/lớp/giáo viên khác bị409. Retry bắt đầu/làm lại giữ phiên, không đảo lại câu hoặc ghi thêm lượt. Đáp án học sinh được lọc như ôn cũ.

## Triển khai và kiểm tra

Frontend mặc định vẫn dùng API/database Railway. Backend phải triển khai phiên bản mới để migration và capability có hiệu lực; build/test local không chứng minh Railway đã cập nhật. Không reset database hoặc nhập dữ liệu thử vào lớp thật. Trạng thái Git/QA mới ở đầu [session-handoff.md](session-handoff.md) và [project-status.md](project-status.md).
