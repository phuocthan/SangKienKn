# Hoạt động nhóm

## Giao diện gọn theo tác vụ — 15/10/2026

Mở hoạt động giữ tóm tắt hạn/trạng thái và chia bốn tab **Yêu cầu / Thành viên / Bài nộp / Trao đổi**. Yêu cầu chứa chữ/file gốc/lịch sử gia hạn; Thành viên chứa roster/đại diện; Bài nộp chứa form/file/link/lịch sử sản phẩm; Trao đổi chứa sản phẩm đọc chéo và nút phản biện khi đủ điều kiện server. Học sinh có nút **Nộp bài** ở tóm tắt để mở đúng tab. Tab hỗ trợ mũi tên/Home/End, giữ file/nội dung chưa gửi khi chuyển mục; điều kiện đại diện/quyền tất cả thành viên/hạn/gia hạn bên dưới không đổi.

## Vị trí quản lý thành viên hiện hành — 14/10/2026

Giáo viên thêm/tìm học sinh tại **Lớp học của tôi → Quản lý lớp → Quản lý học sinh**, sau Quản lý cấp độ/Quản lý chương. Tab Hoạt động nhóm và quy tắc phân nhóm/quyền nộp không đổi. Top10 dùng chung hai vai trò nằm trong tab Khu vườn của lớp, không ở roster quản lý. Thay đổi danh sách lớp không tự thay thành viên hoạt động đã chia.

Thiết kế giao diện theo dõi, bố cục thẻ/bộ lọc và responsive tập trung tại [app-design.md](app-design.md). Tài liệu này giữ nghiệp vụ, quyền truy cập và lưu trữ; không phải danh sách mọi mục hoạt động nhóm trong đề án đã hoàn thành.

## Giáo viên giao hoạt động

1. Chọn lớp ở đầu ứng dụng, mở **Hoạt động nhóm → Tạo hoạt động**. Lớp cần có học sinh; nếu chưa có, thêm học sinh ở **Lớp học của tôi**.
2. Nhập tên, yêu cầu, số nhóm và hạn nộp. Có thể nhập yêu cầu trực tiếp, tải Word `.docx` tối đa **5 MB**, hoặc dùng cả hai. Với Word `.doc`, chọn **Save As → Word Document (.docx)** trước khi tải lên.
3. Chọn **Tạo và chia nhóm**. App xáo trộn ngẫu nhiên danh sách học sinh và phân lần lượt vào các nhóm để số thành viên chênh lệch tối đa một. Số nhóm từ 1 đến số học sinh, không có nhóm rỗng.
4. Mỗi nhóm có một đại diện được chọn khi chia nhóm và hiển thị đầu danh sách. Giáo viên có thể đổi bằng **Đại diện → Lưu đại diện**, chọn người hiện còn trong lớp và thuộc nhóm đó.

Nhóm được lưu cố định khi tạo; tải lại trang hay gửi lại yêu cầu sau lỗi mạng không chia lại. Học sinh vào lớp sau đó chưa được phân nhóm trong hoạt động cũ. Bản hiện tại chưa có thao tác chuyển/thêm thành viên vào nhóm đã chốt; tạo hoạt động mới sau khi cập nhật danh sách lớp nếu cần. Người đã rời lớp mất quyền truy cập; danh sách cũ vẫn lưu tên để bảo toàn lịch sử. Nếu đại diện rời lớp, giáo viên chọn đại diện khác.

Yêu cầu Word hiển thị nội dung chữ trên web, gồm các đoạn, chữ trong bảng và xuống dòng. Không chuyển nguyên bố cục, ảnh hoặc hình vẽ sang HTML; **tải bản Word gốc** để xem đầy đủ. Các ký tự HTML trong yêu cầu được hiển thị như văn bản.

## Học sinh nộp sản phẩm

Theo yêu cầu mới13/10/2026, học sinh mở hoạt động để xem yêu cầu và nhóm của mình. **Mọi thành viên hiện còn thuộc lớp, đã được phân vào nhóm đều được nộp sản phẩm cho nhóm mình trước hạn**; đại diện đứng đầu danh sách nhưng không độc quyền nộp. Giáo viên vẫn có thể đổi đại diện. Mỗi phiên bản ghi đúng thành viên thực sự nộp; các thành viên cùng xem lịch sử của nhóm.

API detail bổ sung `memberSubmissions: true`. Backend mới chưa được triển khai Railway trong đợt sửa này: giao diện local/API cũ vẫn chỉ mở form cho đại diện và báo chờ cập nhật cho thành viên khác. Sắp xếp đại diện trên giao diện hiệu lực ngay, không cần đổi dữ liệu. Kiểm thử dùng DB riêng, không gửi bài giả lên Railway.

- File **Word `.doc/.docx`, PDF `.pdf`, PowerPoint `.ppt/.pptx`**, tối đa **10 MB** mỗi lần nộp.
- Hoặc **link HTTP/HTTPS**, ví dụ link chia sẻ Canva. Bật quyền xem trên Canva trước khi gửi; ứng dụng lưu link, không kiểm tra hoặc tự tải nội dung bên ngoài.
- Có thể thêm ghi chú và nộp nhiều phiên bản trước hạn. Mỗi lần ghi người nộp, thời gian máy chủ và số phiên bản; phiên bản mới nhất đứng đầu. Nộp lại không xóa file/link cũ.

Nếu phản hồi bị mất sau khi máy chủ đã nhận, giữ nguyên form và bấm nộp lại: cùng yêu cầu được trả về mà không tạo bản trùng. Chỉnh sửa nội dung form sẽ tạo yêu cầu mới. Bài chỉ được coi là nhận khi máy chủ đã lưu; bắt đầu tải trước hạn nhưng hoàn tất sau hạn vẫn bị từ chối.

## Hạn nộp và gia hạn

Hạn nhập theo múi giờ của thiết bị giáo viên; thời điểm được lưu thống nhất ở máy chủ. Giao diện hiển thị theo múi giờ của thiết bị đang xem. **Thời gian máy chủ quyết định việc nhận bài**: khi thời gian hiện tại bằng hoặc vượt hạn, không nhận bài mới. Nút/form nộp ẩn khi hết hạn; tải lại, sửa giờ máy hay gọi API trực tiếp không vượt được giới hạn.

Giáo viên chọn **Gia hạn nộp bài**, nhập hạn mới và lý do tùy chọn. Hạn mới phải muộn hơn hạn cũ và thời gian hiện tại. Có thể gia hạn cả trước và sau khi hết hạn. App lưu người gia hạn, thời điểm, hạn cũ/mới và lý do. Nếu người khác vừa đổi hạn hoặc đại diện, yêu cầu cũ bị từ chối để tránh ghi đè; đợi đồng bộ tự động hoặc quay lại cửa sổ trước khi thao tác lại; nếu tải lỗi dùng Thử lại.

Trang cập nhật dữ liệu mỗi 20 giây và khi quay lại cửa sổ. Từ13/10, bỏ nút Cập nhật vì đã đồng bộ tự động khi quay lại cửa sổ/khôi phục kết nối; lỗi có Thử lại. Heading bỏ TRANG CỘNG TÁC và mô tả lớp, giữ tên trang/minh họa và toolbar tạo hoạt động. Sau gia hạn, mọi thành viên đủ quyền được nộp tiếp; lịch sử cũ còn nguyên.

## Quyền truy cập và lưu trữ

Giáo viên chỉ quản lý hoạt động và tải sản phẩm trong lớp mình sở hữu. Học sinh phải là thành viên hiện tại của lớp; trong giai đoạn nộp chỉ xem danh sách và sản phẩm của nhóm mình. Khi phản biện mở, học sinh xem các nhóm và sản phẩm trong cùng hoạt động. Yêu cầu Word dành cho cả lớp. Không có URL file công khai: mỗi lần tải đều kiểm tra session và quyền lớp/nhóm/giai đoạn, trả file dạng tải xuống.

Hoạt động, thành viên, lịch sử, file gốc và sản phẩm nằm trong SQLite ở `DATABASE_PATH` (mặc định `.local/greenedu.sqlite`). Các bảng được thêm tự động khi khởi động bản mới; không xóa lớp, câu hỏi hoặc tiến độ cũ. Không đưa database hoặc file học sinh lên Git. Sao lưu/khôi phục database phải bao gồm file BLOB; dùng SQLite backup phù hợp hoặc dừng server trước khi sao chép database. Đây là lưu trữ cho MVP một instance; chưa có hạn ngạch tổng dung lượng hay quản lý xóa file.

## Trao đổi và phản biện — cập nhật 12/10/2026

Mã hiện tại đã bổ sung **Trao đổi & phản biện**. Điều kiện mở: giáo viên đã gia hạn ít nhất một lần và hạn hiện tại đã hết. Nhóm khác đặt câu hỏi/góp ý cho sản phẩm, nhóm sở hữu trả lời; giáo viên điều phối. Trao đổi gắn với phiên bản sản phẩm và kiểm tra quyền ở máy chủ. Xem [góp ý và phản biện](feedback-discussion.md) để nắm đầy đủ quy tắc và tương thích backend cũ.

Chấm điểm, điểm thưởng nhóm và điều chỉnh thành viên sau khi chốt nhóm vẫn chưa triển khai. Có mã phản biện không đồng nghĩa Railway đã cập nhật backend; trạng thái từng đợt ở [project-status.md](project-status.md) và [session-handoff.md](session-handoff.md).
