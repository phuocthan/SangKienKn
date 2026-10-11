# Ngân hàng câu hỏi: phiên bản, ẩn và nhập Word/CSV

## Quy trình giáo viên

Vào Ngân hàng câu hỏi, chọn lớp/chương/bài. Giáo viên có thể thêm một câu, sửa nội dung, ẩn hoặc hiện lại và xem lịch sử phiên bản.

Chọn Nhập file Word hoặc Nhập file CSV → tải mẫu tương ứng → điền dữ liệu → chọn file → kiểm tra xem trước → xác nhận nhập. Có thể đổi định dạng trong hộp nhập; đổi định dạng sẽ xóa bản xem trước cũ. Chỉ lần xác nhận thành công mới lưu dữ liệu; chọn file hoặc xem trước không tạo câu hỏi.

Trong hộp nhập, **Bài nhận câu hỏi** mặc định theo bài đang lọc. Chọn bài có sẵn để toàn bộ câu trong file vào đúng bài đó, giữ chủ đề riêng của từng câu. Chọn **Theo tên bài trong file** khi nhập nhiều bài; tên tương đương của bài có số (khác `:`, `-`, `·`, khoảng trắng, hoa/thường, dấu tiếng Việt như `hoà/hòa`) được ghép về tên đang có trong cùng chương. Nếu có nhiều tên tương đương, cần chọn chính xác bài nhận; bài khác số hoặc khác nội dung tên không tự gộp. Tên chưa có được liệt kê trong bản xem trước để giáo viên kiểm tra. Nhãn `Chủ đề` không tham gia tên bài hoặc tạo bài con.

API cũng ghép tên tương đương khi thêm/sửa/nhập câu; kiểm tra trùng sau khi ghép, giữ retry và lịch sử. Không tự thay đổi tên bài/câu hỏi đã lưu hoặc sửa snapshot cũ. Với bài trùng đã tạo từ đợt nhập trước, cần xử lý dữ liệu riêng; bản sửa này áp dụng cho các lần nhập tiếp theo. Backend Railway cần được triển khai để quy tắc API mới có hiệu lực.

## Bảo toàn lịch sử học tập

- Câu hỏi đã xuất bản là một phiên bản có mã riêng. Khi thay đổi nội dung, bài học, lựa chọn, đáp án hoặc lời giải, app tạo mã mới và tăng số phiên bản. Không sửa câu hỏi tại chỗ.
- Phiên bản mới ở cùng chương; không chuyển câu đã làm sang chương khác. Câu cũ ngừng dùng trong luyện tập mới, nhưng lượt làm và sổ tay vẫn tham chiếu câu cũ.
- Học sinh sửa sai với nội dung, phương án và đáp án của phiên bản đã làm sai, kể cả khi giáo viên đã ẩn hoặc sửa câu đó.
- Ẩn chỉ ngừng dùng cho lượt luyện tập mới; hiện lại chỉ áp dụng phiên bản hiện tại. Chỉnh sửa câu đang ẩn không tự công bố nó. Không xóa câu hoặc lượt làm.
- Nếu giáo viên cập nhật/ẩn câu khi học sinh chưa gửi đáp án, lượt luyện tập mới bị từ chối và yêu cầu mở lại bài. Gửi lại mã của lượt đã lưu vẫn trả kết quả cũ và không ghi thêm lượt.
- Không đổi nội dung thì không tăng phiên bản. Sửa từ một phiên bản đã cũ bị từ chối; giáo viên tải lại trước khi sửa.
- Số câu và các bài luyện tập chỉ tính phiên bản hiện tại đang sử dụng. Báo cáo lượt làm vẫn bao gồm lịch sử. Một câu sai ở hai phiên bản là hai mục sửa sai riêng, vì nội dung và đáp án có thể khác nhau.
- Lịch sử phiên bản, đáp án và quyền sửa/ẩn/nhập chỉ dành cho giáo viên sở hữu lớp. API học sinh không gửi đáp án/lời giải trước khi trả lời.

## File Word (.docx)

Tải mẫu bằng nút **Tải mẫu Word (.docx)** trong ứng dụng hoặc mở [file mẫu trong repository](../public/templates/greenedu-cau-hoi-mau.docx). Mẫu có hướng dẫn và hai câu minh họa, mở và chỉnh sửa trực tiếp bằng Microsoft Word. Thay câu mẫu hoặc sao chép thêm khối câu:

```text
Câu 1: Đơn vị cơ bản của độ dài trong hệ SI là gì?
Bài học: Bài 1 · Đơn vị đo
Chủ đề: Đơn vị cơ bản
A. Mét
B. Centimét
C. Kilômét
D. Milimét
Đáp án: A
Lời giải: Mét (m) là đơn vị cơ bản của độ dài trong hệ SI.
```

- Mỗi câu bắt đầu bằng `Câu 1:`, `Câu 2:`… hoặc `Câu hỏi:`; giữ đủ nhãn `Bài học:`, `A.`, `B.`, `C.`, `D.`, `Đáp án:`, `Lời giải:`. Số thứ tự dùng để phân khối, không bắt buộc liên tục.
- `Chủ đề:` là nhãn tùy chọn, tối đa 120 ký tự, đặt ở dòng riêng. Dùng cùng tên/mã cho các câu cùng nội dung kiến thức; không ghép chủ đề vào `Bài học:`. File mẫu cũ không có nhãn này vẫn nhập được.
- Đáp án là một chữ A/B/C/D. Chấp nhận chữ thường, nhãn `Đáp án đúng:` và lựa chọn dạng `A)` hoặc `A:`. Bốn phương án phải khác nhau.
- Chữ đậm, nghiêng và các đoạn chữ trong cùng dòng vẫn được đọc. Dòng tiếp theo không có nhãn tiếp tục câu hỏi, phương án hoặc lời giải trước đó; giữ các nhãn ở đầu dòng riêng.
- Chỉ nhận `.docx`, không nhận `.doc` cũ. Với `.doc`, chọn Save As → Word Document (.docx) trong Word. Không nhận file Word có hình ảnh, Equation, hộp văn bản hay nội dung nhúng trong phần nội dung; dùng văn bản và công thức gõ bằng chữ. Chấp nhận/từ chối Track Changes trước khi nhập.
- Mỗi file 1–100 câu, tối đa 5 MB; nội dung XML tối đa 2 MB. Giới hạn nội dung từng câu giống CSV. File được đọc trong trình duyệt; khi xác nhận, app gửi dữ liệu câu hỏi đã chuẩn hóa để server kiểm tra/lưu, không gửi file Word gốc.
- Lỗi thiếu nhãn, thiếu nội dung, đáp án sai định dạng, phương án giống nhau, câu trùng hoặc file hỏng đều chặn lưu. Có câu hợp lệ và câu lỗi thì vẫn xem được câu hợp lệ, nhưng phải sửa toàn bộ lỗi trước khi xác nhận.

## File CSV

CSV UTF-8, có thể có BOM. Các cột theo đúng thứ tự:

| Bài học           | Câu hỏi                               | A   | B        | C       | D       | Đáp án | Lời giải                                     |
| ----------------- | ------------------------------------- | --- | -------- | ------- | ------- | ------ | -------------------------------------------- |
| Bài 1 · Đơn vị đo | Đơn vị cơ bản của độ dài trong hệ SI? | Mét | Centimét | Kilômét | Milimét | A      | Mét là đơn vị cơ bản của độ dài trong hệ SI. |

- Giữ nguyên tiêu đề; đáp án là A/B/C/D (chấp nhận chữ thường). Bốn lựa chọn cần khác nhau.
- CSV 8 cột cũ vẫn hợp lệ. Có thể thêm cột thứ 9 tên `Chủ đề` ở cuối; giữ đủ 9 ô trên mỗi dòng nếu thêm cột này.
- Dấu phân cách là dấu phẩy hoặc chấm phẩy. Ô chứa dấu phân cách, xuống dòng hoặc ngoặc kép phải được bao bằng ngoặc kép; ngoặc kép bên trong ghi thành hai ngoặc kép. Excel có thể lưu CSV UTF-8 theo quy tắc này.
- Mỗi file 1–100 câu, tối đa 512 KB ở giao diện. Tên bài tối đa 120 ký tự; câu hỏi/lời giải tối đa 3.000 ký tự; mỗi phương án tối đa 1.000 ký tự.
- Nếu bất kỳ câu nào lỗi, nút xác nhận bị khóa. App vẫn cho xem các câu hợp lệ, nhưng không tự nhập một phần.
- Bộ nhập API kiểm tra lại tất cả câu trước khi lưu và ghi trong một transaction. Câu trùng toàn bộ nội dung trong file hoặc trùng phiên bản hiện tại của ngân hàng (kể cả câu đã ẩn) bị từ chối; cần bỏ dòng trùng rồi nhập lại.
- Mã của lần xác nhận được giữ khi mạng lỗi. Nếu server đã lưu mà trình duyệt chưa nhận kết quả, xác nhận lại không tạo câu trùng.

Cả Word và CSV dùng cùng bộ nhập API: giữ phân quyền giáo viên, kiểm tra trùng, lưu toàn bộ hoặc không lưu và chống ghi trùng khi gửi lại. Đổi nhãn chủ đề không làm nội dung câu trở thành câu mới để nhập trùng. Chưa tự tách đề Word có bố cục bất kỳ, đọc PDF hoặc nhập `.xlsx`. Ôn tập, học kỳ, ma trận và trộn đề đã có; xem [learning.md](learning.md).

## Chọn và sắp thứ tự câu theo chủ đề

Ngày 11/10/2026 bổ sung `topic` vào từng phiên bản câu hỏi bằng migration thêm cột, mặc định rỗng cho câu cũ. Giáo viên xem/sửa nhãn trong ngân hàng và bản xem trước nhập Word/CSV. Sửa nhãn tạo phiên bản mới; sổ tay, lượt làm và snapshot đã lưu giữ nhãn/nội dung cũ. Client cũ không gửi trường chủ đề khi sửa sẽ giữ nhãn hiện có; nhập từ API cũ chưa hỗ trợ được chặn ở giao diện nếu file có chủ đề để tránh mất nhãn.

Luyện tập sắp câu xen kẽ; ôn tập/Săn điểm/tạo đề chọn câu theo các nhóm chủ đề trong từng lớp/chương/bài, ưu tiên nhóm đã được chọn ít hơn và tránh hai câu liên tiếp cùng nhóm khi còn nhóm khác. Ma trận theo bài giữ nguyên số câu đã phân bổ; chỉ cân bằng chủ đề bên trong mỗi bài. Thi chính thức giữ toàn bộ tập câu đã chốt và chỉ đổi thứ tự; phiên đã bắt đầu tiếp tục dùng snapshot cũ. Không loại câu khỏi sổ tay sửa sai hoặc tự đổi đề giữa phiên.

Với bộ Bài 1 gồm 10 nhóm, mỗi nhóm 5 câu, chọn 10 câu sẽ lấy 1 câu/nhóm; chọn 20 lấy 2 câu/nhóm; chọn 23 lấy 2–3 câu/nhóm. Nếu một nhóm hết câu, lấy từ nhóm còn lại để đủ số lượng, không lặp lại cùng câu. Câu chưa có nhãn được tính thành nhóm chưa phân loại của bài khi trộn chung; ngân hàng hoàn toàn chưa có nhãn giữ cách chọn cũ. Quy tắc cân bằng áp dụng trong một lượt chọn, chưa loại câu đã gặp ở phiên trước.

Bộ Word 50 câu có đáp án/lời giải: [Vật lí 11 Chương I Bài 1](../artifacts/question-banks/vat-li-11-chuong-1-bai-1-50-cau.docx). Tất cả dùng đúng tên `Bài 1: Dao động điều hoà`, không tạo 10 bài con. **Chưa triển khai backend Railway hoặc nhập bộ câu vào dữ liệu thật trong đợt này.** Frontend local có thể xem trước; cần backend hỗ trợ nhãn trước khi xác nhận nhập file này.

## Lưu trữ

Migration bổ sung `active`, `is_current`, `version`, `family_id`, `changed_at` vào `questions`, giữ mã/nội dung/lượt làm của dữ liệu cũ. `question_imports` lưu mã nhập, giáo viên, chương, dấu vân tay nội dung và các mã câu đã tạo để xử lý gửi lại.

Không cần xóa database hoặc tạo lại dữ liệu mẫu. Migration chạy khi mở database và có thể mở lại nhiều lần.
