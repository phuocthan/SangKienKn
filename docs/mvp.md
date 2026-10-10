# Đặc tả MVP GreenEdu

## Mục tiêu

Kiểm chứng luồng giáo viên tạo lớp và câu hỏi → học sinh luyện tập → sai được lưu vào sổ tay → sửa đúng → tiến độ và cây cập nhật → giáo viên xem báo cáo.

## Mô hình dữ liệu

- `users`: giáo viên/học sinh, email duy nhất, mật khẩu băm, cờ bắt buộc đổi mật khẩu.
- `sessions`: hash token session và thời điểm hết hạn (7 ngày).
- `classrooms`, `memberships`: lớp thuộc một giáo viên; thành viên là học sinh.
- `chapters`, `questions`: chương thuộc lớp; câu hỏi được gắn tên bài học, có 4 phương án, một đáp án đúng và lời giải. Có thể luyện tập theo bài hoặc ôn toàn chương. Bài được nhóm từ tên bài trên câu hỏi trong phiên bản MVP.
- `attempts`: từng lượt luyện tập hoặc sửa sai, chọn đáp án, đúng/sai và thời điểm. Mã yêu cầu chống ghi trùng khi gửi lại.
- `corrections`: một mục cho mỗi học sinh/câu hỏi, trạng thái cần sửa/đã khắc phục.
- `progress`: thời gian tích lũy theo học sinh/chương.
- `study_sessions`: một phiên học cho mỗi học sinh, tín hiệu hoạt động và đồng hồ backend.
- `questions` có trạng thái sử dụng, phiên bản, mã nhóm phiên bản và thời điểm thay đổi; `question_imports` chống nhập trùng khi gửi lại cùng một lần xác nhận.
- `group_activities`, `activity_groups`, `activity_group_members`: yêu cầu, hạn nộp, nhóm cố định và đại diện; `activity_files` lưu file gốc/sản phẩm trong database; `group_submissions` lưu từng phiên bản; `activity_deadline_history` lưu các lần gia hạn.

## Quy tắc nghiệp vụ

1. Giáo viên chỉ truy cập và quản lý lớp mình sở hữu; học sinh chỉ xem câu hỏi và làm bài trong lớp có tên mình.
2. API danh sách câu hỏi không gửi đáp án/lời giải cho học sinh. Sau khi nộp một câu trả lời luyện tập, phản hồi có đáp án và lời giải.
3. Bất kỳ lượt trả lời sai nào đều tạo hoặc mở lại mục sửa sai, không tạo mục trùng.
4. Chỉ lượt đúng ở chế độ sửa sai mới đánh dấu đã khắc phục. Lượt đúng ở luyện tập không xóa mục sửa sai.
5. Tỷ lệ đúng MVP = số lượt luyện tập đúng / tổng lượt luyện tập. Chưa dùng chỉ số này để mở khóa thi.
6. Dashboard không tạo dữ liệu thành tích giả. Chưa làm bài thì tỷ lệ đúng hiển thị “—”.
7. Học sinh mới hoặc vừa được cấp lại mật khẩu phải đổi mật khẩu trước khi vào lớp. Cấp lại mật khẩu thu hồi toàn bộ session của học sinh.
8. CSV có BOM UTF-8 và xử lý ký tự bắt đầu công thức để tránh thực thi công thức khi mở bằng bảng tính.
9. Khu vườn của lớp hiển thị một cây cho mỗi học sinh/chương đạt 4 giờ có hoạt động, trong phạm vi thành viên và chương của lớp. Không tạo dữ liệu cây trùng khi tải lại.
10. Xếp hạng chăm chỉ xét thời gian học rồi số cây ra hoa; thành tích bằng nhau đồng hạng. Bảng sửa sai xét số câu hiện đã khắc phục, không đếm trùng số lượt làm lại. Chưa có hoạt động thì chưa xếp hạng. Các API cộng đồng không trả email hoặc đáp án.
11. Sửa câu hỏi tạo phiên bản mới; ẩn không xóa câu cũ, lượt làm hoặc sổ tay. Lượt sửa sai dùng đáp án phiên bản cũ; lượt luyện tập mới chỉ dùng phiên bản hiện tại đang sử dụng.
12. Nhập Word `.docx` và CSV theo mẫu có xem trước và xác nhận, kiểm tra lại trên server, ghi toàn bộ hoặc không ghi; gửi lại cùng mã nhập không tạo câu trùng. Word hỗ trợ câu hỏi văn bản, có mẫu tải về. Xem [ngân hàng câu hỏi](question-bank.md).
13. Hoạt động nhóm chia ngẫu nhiên cân bằng một lần, chỉ đại diện được nộp trước hạn máy chủ, giáo viên được gia hạn/đổi đại diện. Các lần nộp và file cũ được bảo toàn; học sinh chỉ xem sản phẩm nhóm mình. Xem [hoạt động nhóm](group-activities.md).

## Tiêu chí nghiệm thu

- Dữ liệu lớp, câu hỏi và tiến độ còn sau khi khởi động lại backend.
- Học sinh có thể trả lời sai, thấy câu trong sổ tay, làm lại đúng và không còn mục cần sửa.
- Giáo viên thấy số lượt luyện tập, tỷ lệ đúng, câu còn sai và thời gian học đúng của học sinh trong lớp.
- Học sinh không tạo câu hỏi, lấy danh sách học sinh hoặc truy cập chương của lớp khác.
- Gửi lại cùng một lượt làm không tăng số lượt hay tạo nhiều mục sửa sai.
- Trang ẩn, phiên cũ, mất kết nối dài và không có tương tác quá thời gian quy định không tiếp tục tăng tiến độ.
- Giao diện dùng được trên điện thoại và máy tính; modal có quản lý focus và các form có nhãn.
- Học sinh/giáo viên xem được vườn lớp và xếp hạng đúng quyền; dữ liệu chương/lớp khác không ảnh hưởng thành tích lớp đang xem.
- Nhóm, nội dung Word, sản phẩm và gia hạn còn sau khởi động lại; nộp đúng thời điểm hết hạn bị từ chối, gia hạn mở lại; gửi lại cùng bài không tạo phiên bản/file trùng.

## Các quyết định dành cho giai đoạn thi

Chốt cách tính tỷ lệ đúng 70%, thời điểm cấp/dùng vé, ngưỡng chuyển tab, trần điểm cộng, quyền phê duyệt, xử lý mất mạng và mở đáp án. Không tự chuyển Green Points thành điểm môn học.
