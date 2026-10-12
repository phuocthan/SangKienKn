# Ngân hàng câu hỏi Vật lí 11

## Hai chương câu hỏi vui đơn giản — mở rộng 12/10/2026

Mỗi file là một chương, gồm **3 bài × 5 câu = 15 câu**, tổng cộng30câu. Giữ10câu ban đầu và thêm20câu mới.

| File | Chương | Ba bài học |
| --- | --- | --- |
| [Đố vui quanh em](bo-cau-hoi-vui-1-do-vui-quanh-em.docx) | Chương1 | Bài1 Đồ vật ngộ nghĩnh; Bài2 Thế giới động vật; Bài3 Đố vui số lượng |
| [Vui học mỗi ngày](bo-cau-hoi-vui-2-vui-hoc-moi-ngay.docx) | Chương2 | Bài1 Con số vui nhộn; Bài2 Khoa học quanh em; Bài3 Cuộc sống mỗi ngày |

Hai file tạo từ `public/templates/greenedu-cau-hoi-mau.docx`, mỗi câu đủ Bài học/A–D/Đáp án/Lời giải, không dùng topic hoặc nội dung nhúng. Đây là câu hỏi vui tổng hợp, không phải bộ Vật lí11. Kiểm tra mới: parser Word thật nhận15câu/0lỗi mỗi file, đúng3tên bài và5câu mỗi bài; đã xem đủ8trang render Microsoft Word cuối, không tách câu qua trang, giữ mẫu gốc và các phần package không liên quan. Bản5câu trước đó là lịch sử, có backup nội bộ `.local/fun-question-banks/before-expansion/`.

Khi nhập từng file, chọn **chương tương ứng** trong Ngân hàng câu hỏi và đặt **Bài nhận câu hỏi → Theo tên bài trong file** để giữ cả3bài. Không chọn một bài có sẵn cho toàn bộ file vì sẽ gộp15câu vào bài đó. Tên chương ở tiêu đề tài liệu là thông tin nhận diện, không tự tạo/chọn chương qua parser. Chưa nhập vào Railway; file có đáp án nên dùng cho ngân hàng giáo viên. Script/QA nội bộ ở `.local/fun-question-banks/`.

File `vat-li-11-chuong-1-bai-1-50-cau.docx` chứa 50 câu tự biên soạn cho Chương I Dao động, Bài 1 Dao động điều hoà, theo phạm vi mở đầu của sách Kết nối tri thức với cuộc sống. Có 4 phương án/câu, một đáp án đúng, lời giải và dòng `Chủ đề:`; công thức gõ bằng văn bản để nhập Word theo mẫu GreenEdu. Không có hình ảnh hoặc Equation.

| Mã | Nhóm kiến thức | Câu |
| --- | --- | --- |
| DD11-B1-01 | Nhận biết dao động cơ | 1–5 |
| DD11-B1-02 | Dao động tuần hoàn và điều hòa | 6–10 |
| DD11-B1-03 | Li độ và vị trí cân bằng | 11–15 |
| DD11-B1-04 | Biên độ và quỹ đạo | 16–20 |
| DD11-B1-05 | Nhận dạng phương trình điều hòa | 21–25 |
| DD11-B1-06 | Đọc biên độ từ phương trình | 26–30 |
| DD11-B1-07 | Li độ theo giá trị hàm cos | 31–35 |
| DD11-B1-08 | Tính li độ tại thời điểm cho trước | 36–40 |
| DD11-B1-09 | Đọc dữ liệu và đồ thị li độ | 41–45 |
| DD11-B1-10 | Hình chiếu chuyển động tròn đều | 46–50 |

Giữ chung `Bài học: Bài 1: Dao động điều hoà`. Vào Ngân hàng câu hỏi của đúng lớp/chương → Nhập file Word → chọn **Bài nhận câu hỏi** là Bài 1 Dao động điều hòa đã có → xem trước đủ 50 câu/nhãn → Xác nhận nhập. Tất cả câu vào một bài; 10 chủ đề chỉ là nhãn riêng để tham khảo và cân bằng trộn câu. Tên chủ đề gồm cả mã và tên; dùng nguyên cùng tên để phân loại câu bổ sung. Bài 1 chưa dùng vận tốc, gia tốc, năng lượng hoặc công thức con lắc.

Nhận biết/thông hiểu/vận dụng là phân loại biên soạn tham khảo (18/23/9 câu), không phải ma trận đánh giá chính thức và không được nhập như trường dữ liệu riêng. Bộ có đáp án nên dùng để quản lý ngân hàng, không gửi nguyên file làm đề cho học sinh.

Đợt 11/10/2026 đã kiểm tra parser thực tế nhận đủ 50 câu, không lỗi/trùng, 10 chủ đề × 5 câu, và nhập qua trình duyệt/database E2E riêng. Tài liệu giữ mẫu Word gốc, đã xuất PDF bằng Word ẩn và xem trang PNG; file Word mẫu gốc không đổi. Backend/nhãn mới **chưa deploy Railway**, bộ câu **chưa nhập production**. Không xác nhận nhập khi frontend báo máy chủ chưa hỗ trợ chủ đề. Xem [quy tắc nhập và chọn chủ đề](../../docs/question-bank.md).
