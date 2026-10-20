# Phương án chèn ảnh vào câu hỏi — 19/10/2026

Trạng thái: **đã khảo sát mã và thử nghiệm trích ảnh trên mẫu tổng hợp; chưa triển khai vào ứng dụng**. Người dùng yêu cầu tìm phương án khả thi. Đây là đề xuất, không thay đặc tả nhập văn bản hiện hành hoặc xác nhận Railway đã hỗ trợ ảnh.

## Kết luận

Khả thi với React/Express/SQLite hiện có. Nên dùng chung một cơ chế ảnh cho thêm/sửa câu, xem trước nhập Word, luyện tập, sổ tay, ôn và kiểm tra. Làm chọn file/dán ảnh trước, rồi nhập ảnh nhúng trong Word; không cần thay toàn bộ biểu mẫu bằng trình soạn thảo văn bản phức tạp.

| Cách nhập | Trải nghiệm đề xuất | Đánh giá |
| --- | --- | --- |
| Chọn ảnh, kéo thả, Ctrl+V | Chèn ảnh cạnh phần câu hỏi hoặc lời giải; xem trước, thay/xóa, chú thích, bấm phóng lớn | Ưu tiên đợt đầu; file là cách dự phòng khi clipboard không có ảnh |
| Word có ảnh | Trích ảnh nhúng và gắn theo vị trí trong câu/phương án/lời giải; kiểm tra bản xem trước trước khi lưu | Khả thi, cần mở rộng parser và kiểm tra thêm mẫu Word thực tế |
| Trình soạn thảo đầy đủ như Word | Chữ/ảnh đan xen, định dạng phong phú | Chưa cần cho yêu cầu này; tăng công việc lưu nội dung, nhập file và bảo toàn phiên bản |

Ảnh trực tiếp áp dụng trước cho nội dung câu và lời giải. Mô hình dữ liệu nên dự trù ảnh ở từng phương án/khẳng định; giao diện của phần này có thể làm tiếp cùng đợt Word. Ảnh chụp công thức/đồ thị dùng được như ảnh, không đồng nghĩa ứng dụng đọc được Equation hoặc chấm đáp án từ hình.

## Những điểm đã kiểm tra trong mã

- `src/QuestionFields.tsx`: câu hỏi/lời giải là textarea, phương án là input; chưa có chọn ảnh hoặc xử lý paste ảnh.
- `shared/questions.ts`: QuestionInput và questionInput chỉ giữ các trường văn bản/đáp án. Gửi thêm images hiện bị loại khi chuẩn hóa, không được lưu.
- `src/importWord.ts`: chủ động từ chối drawing, pict, object và Equation. `shared/word-questions.ts` chỉ giải nén word/document.xml; không đọc relationships hoặc media.
- `src/ExamUpload.tsx`: dùng cùng parser cho đề tải lên, nên phải xử lý đồng bộ với ngân hàng.
- `server/app.ts`: phiên bản câu là bất biến; thay nội dung tạo ID mới. `server/learning.ts` tạo snapshot JSON và tách lời giải khỏi câu gửi cho học sinh.
- `server/avatar-uploads.ts` và các file nhóm đã có cơ chế upload/kiểm tra ảnh hoặc lưu BLOB trong SQLite. Có thể dùng kinh nghiệm từ các luồng này; không dùng lại bảng avatar để lưu ảnh câu hỏi.

## Cách triển khai đề xuất

1. **Biểu mẫu và xem trước:** nút Chèn ảnh, chọn PNG/JPG/WebP, kéo thả và paste khi clipboard có file ảnh. Hiện thumbnail/chú thích, thay/xóa và mở ảnh lớn trong app. Giữ tỷ lệ, không cắt mất trục đồ thị hoặc nhãn. Mốc dung lượng khởi đầu đề xuất3MB/ảnh; chốt thêm số ảnh/tổng dung lượng mỗi lần nhập sau khi đo mẫu thực tế.
2. **Lưu trữ:** thêm bảng media chứa BLOB/loại ảnh/kích thước/hash/chủ sở hữu và tham chiếu ảnh theo phiên bản câu, vị trí, thứ tự, mô tả. Đây là phương án bắt đầu dựa trên SQLite/volume hiện có; khi thư viện ảnh lớn có thể chuyển BLOB sang object storage mà giữ nguyên ID. Giới hạn phía server theo dung lượng và kích thước giải mã, kiểm tra nội dung thay vì chỉ tin đuôi file; chưa nhận SVG hoặc ảnh động ở đợt đầu.
3. **Lưu câu:** dùng multipart hoặc upload theo bản nháp có quyền, rồi xác nhận gắn media và câu trong transaction. Xem trước không công bố nội dung; hủy/nhập lỗi không tạo câu hoặc liên kết dở. Retry không tạo trùng; media tạm phải có cách thu dọn. Nội dung trùng phải xét hash ảnh và vị trí, không chỉ văn bản/ID upload ngẫu nhiên.
4. **Lịch sử và quyền đọc:** giữ ảnh bất biến cho phiên bản cũ và snapshot ôn/thi. Xóa/thay ảnh ở câu mới không làm mất hình của câu đã làm hoặc đề đã phát hành. API ảnh phải kiểm tra quyền theo câu/phiên học/đề tương ứng; ảnh thuộc lời giải chỉ được đọc khi lời giải được phép công bố. Không chỉ che ảnh bằng CSS hoặc trả sẵn URL lời giải cho học sinh.
5. **Word:** đọc document.xml, document.xml.rels và đúng các media được tham chiếu. Duyệt chữ/ảnh theo thứ tự, xác định trường đang đọc theo nhãn Câu/A–D/Lời giải rồi giữ ảnh tại vị trí đó. Ưu tiên ảnh nhúng với chế độ In Line with Text. Ảnh nổi, liên kết ngoài, shape/SmartArt/Equation phải báo rõ vị trí chưa hỗ trợ, không âm thầm bỏ ảnh hoặc lấy thứ tự tên file media để đoán câu. Giữ giới hạn giải nén, số ảnh, kích thước XML/media và đường dẫn trong ZIP.

Không nhét base64 vào trường text hoặc lấy link Google Drive làm nguồn ảnh mặc định. JSON câu chỉ chứa tham chiếu có cấu trúc; bộ hiển thị dùng chung cho ngân hàng, bản xem trước, luyện tập/sửa sai và ôn/thi. Phương án chỉ có ảnh cần cập nhật validation: cho phép văn bản rỗng khi có ảnh hợp lệ, xét trùng theo cả chữ lẫn ảnh và giữ đúng ảnh khi trộn phương án.

## Thử nghiệm đã thực hiện

Chạy `node --import tsx .local/question-images-feasibility.ts` trên ZIP DOCX tổng hợp có một PNG68byte và một relationship. Kết quả: parser hiện tại từ chối ảnh đúng như mã; phần thử nghiệm ánh xạ rId1 → word/media/chart.png, đọc đúng byte và kiểm tra MIME image/png; questionInput hiện không giữ images. Script chỉ chứng minh cơ chế tham chiếu và các chỗ thiếu, **không phải bộ nhập Word ảnh đã hoàn thành**, chưa kiểm thử Word phức tạp hoặc tương thích clipboard trình duyệt. Không thay mã runtime, không đọc/ghi database người dùng hoặc deploy.

Khi triển khai cần kiểm tra: chọn/paste/thay/xóa/hủy, Word nhiều câu/nhiều ảnh/ảnh lặp và vị trí A–D/lời giải; ảnh cũ sau sửa/xóa câu; đề ngân hàng và đề tải riêng; retry/rollback; chặn xem ảnh lời giải sớm/khác lớp; ảnh lỗi/không tải được phải báo rõ; desktop/mobile/phóng lớn/không tràn ngang. Dùng database riêng, không seed hoặc thử ghi Railway.

## Nguồn kỹ thuật đã đối chiếu

- [MDN: clipboardData](https://developer.mozilla.org/en-US/docs/Web/API/ClipboardEvent/clipboardData) và [getAsFile](https://developer.mozilla.org/en-US/docs/Web/API/DataTransferItem/getAsFile): nhận dữ liệu từ paste/drop khi có file; cần thử thêm clipboard từ Word và ảnh chụp màn hình, không hứa mọi thao tác copy đều trả file ảnh.
- [Microsoft: ảnh trong Wordprocessing document](https://learn.microsoft.com/en-us/office/open-xml/word/how-to-insert-a-picture-into-a-word-processing-document): ảnh là ImagePart được Drawing tham chiếu qua relationship ID. Từ cấu trúc này và thử nghiệm trên mã dự án, suy ra có thể mở rộng parser hiện tại.
- [Railway: Volumes](https://docs.railway.com/volumes): lưu dữ liệu bền vững trên volume. Chọn lưu BLOB là đề xuất phù hợp cách dự án đang lưu file; chưa khảo sát dung lượng/chi phí production trong đợt này.
