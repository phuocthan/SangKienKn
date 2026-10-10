# Ngân hàng câu hỏi: phiên bản, ẩn và nhập CSV

## Quy trình giáo viên

Vào Ngân hàng câu hỏi, chọn lớp/chương/bài. Giáo viên có thể thêm một câu, sửa nội dung, ẩn hoặc hiện lại và xem lịch sử phiên bản.

Chọn Nhập file CSV → Tải file mẫu → điền dữ liệu → chọn file → kiểm tra xem trước → xác nhận nhập. Chỉ lần xác nhận thành công mới lưu dữ liệu; chọn file hoặc xem trước không tạo câu hỏi.

## Bảo toàn lịch sử học tập

- Câu hỏi đã xuất bản là một phiên bản có mã riêng. Khi thay đổi nội dung, bài học, lựa chọn, đáp án hoặc lời giải, app tạo mã mới và tăng số phiên bản. Không sửa câu hỏi tại chỗ.
- Phiên bản mới ở cùng chương; không chuyển câu đã làm sang chương khác. Câu cũ ngừng dùng trong luyện tập mới, nhưng lượt làm và sổ tay vẫn tham chiếu câu cũ.
- Học sinh sửa sai với nội dung, phương án và đáp án của phiên bản đã làm sai, kể cả khi giáo viên đã ẩn hoặc sửa câu đó.
- Ẩn chỉ ngừng dùng cho lượt luyện tập mới; hiện lại chỉ áp dụng phiên bản hiện tại. Chỉnh sửa câu đang ẩn không tự công bố nó. Không xóa câu hoặc lượt làm.
- Nếu giáo viên cập nhật/ẩn câu khi học sinh chưa gửi đáp án, lượt luyện tập mới bị từ chối và yêu cầu mở lại bài. Gửi lại mã của lượt đã lưu vẫn trả kết quả cũ và không ghi thêm lượt.
- Không đổi nội dung thì không tăng phiên bản. Sửa từ một phiên bản đã cũ bị từ chối; giáo viên tải lại trước khi sửa.
- Số câu và các bài luyện tập chỉ tính phiên bản hiện tại đang sử dụng. Báo cáo lượt làm vẫn bao gồm lịch sử. Một câu sai ở hai phiên bản là hai mục sửa sai riêng, vì nội dung và đáp án có thể khác nhau.
- Lịch sử phiên bản, đáp án và quyền sửa/ẩn/nhập chỉ dành cho giáo viên sở hữu lớp. API học sinh không gửi đáp án/lời giải trước khi trả lời.

## Định dạng file nhập

CSV UTF-8, có thể có BOM. Các cột theo đúng thứ tự:

| Bài học           | Câu hỏi                               | A   | B        | C       | D       | Đáp án | Lời giải                                     |
| ----------------- | ------------------------------------- | --- | -------- | ------- | ------- | ------ | -------------------------------------------- |
| Bài 1 · Đơn vị đo | Đơn vị cơ bản của độ dài trong hệ SI? | Mét | Centimét | Kilômét | Milimét | A      | Mét là đơn vị cơ bản của độ dài trong hệ SI. |

- Giữ nguyên tiêu đề; đáp án là A/B/C/D (chấp nhận chữ thường). Bốn lựa chọn cần khác nhau.
- Dấu phân cách là dấu phẩy hoặc chấm phẩy. Ô chứa dấu phân cách, xuống dòng hoặc ngoặc kép phải được bao bằng ngoặc kép; ngoặc kép bên trong ghi thành hai ngoặc kép. Excel có thể lưu CSV UTF-8 theo quy tắc này.
- Mỗi file 1–100 câu, tối đa 512 KB ở giao diện. Tên bài tối đa 120 ký tự; câu hỏi/lời giải tối đa 3.000 ký tự; mỗi phương án tối đa 1.000 ký tự.
- Nếu bất kỳ câu nào lỗi, nút xác nhận bị khóa. App vẫn cho xem các câu hợp lệ, nhưng không tự nhập một phần.
- Bộ nhập API kiểm tra lại tất cả câu trước khi lưu và ghi trong một transaction. Câu trùng toàn bộ nội dung trong file hoặc trùng phiên bản hiện tại của ngân hàng (kể cả câu đã ẩn) bị từ chối; cần bỏ dòng trùng rồi nhập lại.
- Mã của lần xác nhận được giữ khi mạng lỗi. Nếu server đã lưu mà trình duyệt chưa nhận kết quả, xác nhận lại không tạo câu trùng.

Đợt này chỉ hỗ trợ CSV theo mẫu, chưa tự đọc/tách câu từ Word/PDF hoặc nhập `.xlsx`. Học kỳ, ma trận và trộn đề chưa thuộc phần đã hoàn thành.

## Lưu trữ

Migration bổ sung `active`, `is_current`, `version`, `family_id`, `changed_at` vào `questions`, giữ mã/nội dung/lượt làm của dữ liệu cũ. `question_imports` lưu mã nhập, giáo viên, chương, dấu vân tay nội dung và các mã câu đã tạo để xử lý gửi lại.

Không cần xóa database hoặc tạo lại dữ liệu mẫu. Migration chạy khi mở database và có thể mở lại nhiều lần.
