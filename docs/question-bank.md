# Ngân hàng câu hỏi: phiên bản, ẩn và nhập Word/CSV

## Nhập sau khi xóa và tạo lại bài — 15/10/2026

Khi bài đang dùng có tên tương đương với bài đã xóa (ví dụ `Bài 1: Dao động điều hoà` và `Bài 1 - Dao động điều hòa`), API ưu tiên ghép câu nhập/tạo/sửa vào tên bài đang dùng. Tên cũ trong lịch sử không được chọn trước chỉ vì trùng chính xác tên trong file và không làm bài đang dùng trở thành tên mơ hồ. Nếu thực sự có nhiều bài đang dùng tương đương, vẫn cần chọn chính xác bài nhận.

Chỉ tải file không khôi phục bài đã xóa: nếu chưa tạo lại bài tương ứng, API vẫn từ chối. Không đổi tên hoặc hiện lại câu cũ, không sửa lượt làm/sổ tay/snapshot. Các quy tắc chống trùng, transaction và gửi lại giữ nguyên. Không migration hoặc chỉnh dữ liệu thật; cần backend mới trên Railway để áp dụng. QA/Git theo đầu [session-handoff.md](session-handoff.md).

## Thứ tự hiển thị chương và thêm chương cuối danh sách — 14/10/2026

Hộp tạo chương hiển thị danh sách chương hiện có theo thứ tự lưu. Theo yêu cầu tiếp theo cùng ngày, Quản lý lớp → Quản lý chương **bỏ select Vị trí ở từng thẻ**. Nút **Sắp xếp** cạnh **Thêm chương** mở popup kéo thả chuột/cảm ứng, kèm nút lên/xuống và phím mũi tên cho bàn phím. **Lưu thứ tự** gửi một danh sách đầy đủ; **Hủy/X/Escape** bỏ nháp. Busy chặn đóng/gửi lặp, lỗi giữ nháp; capability máy chủ cũ khóa nút. Chương mới thêm cuối danh sách. Nút xóa icon nằm ngay trước tên, giữ xác nhận/archive và nhãn truy cập.

Migration bổ sung **chapter_display_order(chapter_id,position)**, khởi tạo dữ liệu cũ theo rowid trong từng lớp và giữ nguyên bảng chapters3cột/ID/lịch sử. Trigger AFTER INSERT gán vị trí cuối riêng mỗi lớp; chạy migration lại không reset thứ tự đã lưu. **POST /api/classrooms/:id/chapters/order {chapterIds}** chỉ giáo viên sở hữu lớp, yêu cầu toàn bộ ID chương đang dùng đúng một lần. Payload sai/trùng bị400; thiếu/thừa/ID khác lớp/chương archive hoặc danh sách cũ sau thêm/xóa bị409, toàn bộ transaction rollback. Lưu không thay câu hỏi/điểm/progress/attempts/corrections/snapshot. Các nguồn hiển thị chương dùng thứ tự này; không đổi thứ tự câu trong đề đã chốt.

GET classrooms trả canReorderChapter cho giáo viên; frontend dùng flag để chặn máy chủ cũ. Tính năng lưu thứ tự cần backend Railway mới, push Git không xác nhận deploy. QA mới ở đầu session-handoff và project-status.

## Xóa chương khỏi danh sách đang dùng — 14/10/2026

Quản lý lớp → Quản lý chương → Xóa chương mở popup xác nhận tên chương/số bài/câu. Hủy không ghi dữ liệu. Xác nhận gọi POST `/api/chapters/:id/delete` với `confirm:true`; chỉ giáo viên sở hữu lớp, giáo viên khác/học sinh bị403. canDeleteChapter từ API bảo vệ client tương thích máy chủ cũ. Backend Railway cần bản mới; mã local không chứng minh đã triển khai.

Xóa là archive trong bảng archived_chapters có người/thời điểm, tắt active câu hỏi và khóa kiểm tra, không DELETE chương/bài/câu hoặc dữ liệu học sinh. Transaction atomic và retry giữ audit lần đầu. Chương không còn ở danh sách/matrix/nguồn ôn mới; thêm/sửa bài/câu hoặc mở thi lại trên chương archive bị chặn. Phiên ôn/thi/snapshot/attempts/progress/sổ tay/vé/điểm đã lưu vẫn giữ; sửa sai của câu cũ và đọc history vẫn được. GET metadata chương kiểm tra quyền lớp để frontend mở sửa sai khi chương đã ra khỏi danh sách. Chương khác không đổi. Chưa có UI khôi phục chương trong phạm vi yêu cầu này.

Sau xóa, danh sách tải lại; nếu ngân hàng đang chọn chương vừa xóa thì chuyển sang chương còn lại, không gửi nhầm ID cũ. Theo yêu cầu mới nhất14/10, Danh sách Học sinh đổi thành Quản lý học sinh ở cuối Quản lý lớp, sau Quản lý cấp độ/Quản lý chương. Top10/vườn giữ ở Khu vườn của lớp cho cả giáo viên và học sinh. QA mới/trạng thái deployment tại đầu [session-handoff.md](session-handoff.md).

## Lưu dạng mới trên máy chủ và số ý đúng — 13/10/2026

Một câu đúng/sai4 ý có thể có từ0 đến4 ý đúng; tất cả Sai (key0000) hoặc tất cả Đúng (1111) đều hợp lệ. Nếu xem trước Word mẫu có4 câu hợp lệ nhưng Câu3 báo Chọn một đáp án đúng khi lưu, cần cập nhật API hỗ trợ dạng mới; validator cũ chỉ biết A–D. Client kiểm tra health.questionTypes trước write nhập/tạo/sửa dạng mới, chặn máy chủ cũ với thông báo rõ ràng và giữ bản xem trước. Không sửa key đúng/sai thành một đáp án trắc nghiệm để vượt validation. Capability thực tế Railway và SHA ở session-handoff.

## Hiện hành: ba dạng câu hỏi — 13/10/2026

Ngân hàng, form tạo/sửa và nhập file hỗ trợ Trắc nghiệm, Đúng/sai và Trả lời ngắn. Dạng cũ không có nhãn được hiểu là trắc nghiệm. Đúng/sai gồm2–4 khẳng định A–D liên tiếp và key đủ từng ý; cả câu đúng khi tất cả ý đúng. Trả lời ngắn không có phương án, đáp án tối đa100 ký tự; so khớp văn bản chuẩn hóa/hoa-thường/khoảng trắng, số thập phân nhận dấu chấm/phẩy mà không ép qua floating point. Không suy diễn đáp án đại số hoặc chấm tự luận.

Word thêm nhãn **Loại câu hỏi: Đúng/sai** hoặc **Loại câu hỏi: Trả lời ngắn** (cũng nhận Dạng:). Đúng/sai ghi A.–D. và Đáp án: Đ S Đ Đ theo thứ tự; ngắn bỏ A–D, ghi Đáp án: 2. Giữ Bài học:/Câu n:/Lời giải:; Chủ đề: tùy chọn. Mẫu Word có hai câu trắc nghiệm cũ + hai câu mới; nguồn cập nhật tại scripts/update-question-template.mjs. Mẫu CSV thêm Chủ đề và Loại câu hỏi vào cuối (10 cột), nhận8/9 cột cũ. Với ngắn để trống A–D; với đúng/sai ghi các khẳng định và key Đ/S theo thứ tự. Không bỏ trống ý giữa hai ý có nội dung.

Migration thêm kind/correct_answer; câu cũ/default là multiple-choice. Phiên bản, nhập transaction/retry/trùng/quyền và snapshot giữ nguyên. Trắc nghiệm lưu selected số, dạng mới lưu chuỗi JSON trong cột selected để không bị SQLite ép số. Student không nhận key trước làm; ngắn sai không lộ key/lời giải, đúng/sai có phản hồi từng ý sau trả lời nhưng lời giải chỉ mở khi cả câu đúng. Đề thi giữ thời điểm công bố. Đặc tả nhập trắc nghiệm phía dưới tiếp tục áp dụng cho dạng cũ.

## Chọn nhiều câu và xóa cả bài — 11/10/2026

Giáo viên sở hữu lớp chọn checkbox ở từng câu hoặc **Chọn tất cả trong bài/đang hiển thị**, xem số đã chọn, Bỏ chọn và bấm **Xóa các câu đã chọn**. Popup liệt kê các câu và số lượng, có Hủy/Xác nhận. Đổi chương/bài/bộ lọc hoặc tải lại dữ liệu xóa lựa chọn cũ để không tác động nhầm phạm vi. Chỉ chọn các phiên bản hiện tại đang dùng; tối đa 5000 câu mỗi lần. Câu đã ẩn không chọn lại, dùng Hiện lại khi cần.

Chọn một bài trong bộ lọc rồi bấm **Xóa cả bài** để archive bài và ngừng dùng toàn bộ câu đang dùng của bài đó (bài rỗng cũng xóa được). Popup ghi tên bài/số câu và xác nhận; không xóa bài khác hoặc cả chương. Muốn dùng lại, thêm lại bài rồi hiện các câu cần dùng. Danh mục/bộ đếm được tải lại sau thành công.

“Xóa” là ngừng sử dụng trong lượt mới, giữ bản ghi, phiên bản, attempts, sổ tay sửa sai và snapshot ôn/thi đã lưu. Bật **Hiện cả câu đã ẩn** để xem lại. Không DELETE vật lý hoặc cascade dữ liệu học sinh. POST `/api/chapters/:id/questions/delete` nhận `questionIds`, chỉ chủ lớp; xác thực toàn bộ ID/cùng chương/phiên bản hiện tại trước UPDATE trong một transaction. ID ngoài chương/không tồn tại/phiên bản cũ chặn toàn bộ, gửi lại không xóa thêm. Endpoint bài dùng `/api/chapters/:id/lessons/delete` sẵn có. Capability `Chapter.canDeleteQuestions` khóa thao tác nhiều câu trên API cũ; xóa cả bài dùng `canManageLessons`. Backend cần deploy Railway, local HMR không tự áp dụng API mới.

## Quy trình giáo viên

Vào Ngân hàng câu hỏi, chọn lớp/chương/bài. Giáo viên có thể thêm một câu, sửa nội dung, ẩn hoặc hiện lại và xem lịch sử phiên bản.

Từ giao diện15/10/2026, chọn **Nhập câu hỏi** → chọn Word/CSV trong hộp nhập (mặc định Word) → tải mẫu tương ứng → điền dữ liệu → chọn file → kiểm tra xem trước → xác nhận nhập. Có thể đổi định dạng trong hộp nhập; đổi định dạng sẽ xóa bản xem trước cũ. Chỉ lần xác nhận thành công mới lưu dữ liệu; chọn file hoặc xem trước không tạo câu hỏi.

Trong hộp nhập, **Bài nhận câu hỏi** mặc định theo bài đang lọc. Chọn bài có sẵn để toàn bộ câu trong file vào đúng bài đó, giữ chủ đề riêng của từng câu. Chọn **Theo tên bài trong file** khi nhập nhiều bài; tên tương đương của bài có số (khác `:`, `-`, `·`, khoảng trắng, hoa/thường, dấu tiếng Việt như `hoà/hòa`) được ghép về tên đang có trong cùng chương. Nếu có nhiều tên tương đương, cần chọn chính xác bài nhận; bài khác số hoặc khác nội dung tên không tự gộp. Tên chưa có được liệt kê trong bản xem trước để giáo viên kiểm tra. Nhãn `Chủ đề` không tham gia tên bài hoặc tạo bài con.

API cũng ghép tên tương đương khi thêm/sửa/nhập câu; kiểm tra trùng sau khi ghép, giữ retry và lịch sử. Không tự thay đổi tên bài/câu hỏi đã lưu hoặc sửa snapshot cũ. Với bài trùng đã tạo từ đợt nhập trước, cần xử lý dữ liệu riêng; bản sửa này áp dụng cho các lần nhập tiếp theo. Backend Railway cần được triển khai để quy tắc API mới có hiệu lực.

## Bảo toàn lịch sử học tập

- Câu hỏi đã xuất bản là một phiên bản có mã riêng. Khi thay đổi nội dung, bài học, lựa chọn, đáp án hoặc lời giải, app tạo mã mới và tăng số phiên bản. Không sửa câu hỏi tại chỗ.
- Phiên bản mới ở cùng chương; không chuyển câu đã làm sang chương khác. Câu cũ ngừng dùng trong luyện tập mới, nhưng lượt làm và sổ tay vẫn tham chiếu câu cũ.
- Học sinh sửa sai với nội dung, phương án và đáp án của phiên bản đã làm sai, kể cả khi giáo viên đã ẩn hoặc sửa câu đó.
- Ẩn/xóa câu chỉ ngừng dùng cho lượt luyện tập mới; hiện lại chỉ áp dụng phiên bản hiện tại. Chỉnh sửa câu đang ẩn không tự công bố nó. Không xóa vật lý câu hoặc lượt làm.
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
