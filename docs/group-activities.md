# Hoạt động nhóm

## Giáo viên giao hoạt động

1. Chọn lớp ở đầu ứng dụng, mở **Hoạt động nhóm → Tạo hoạt động**. Lớp cần có học sinh; nếu chưa có, thêm học sinh ở **Lớp học của tôi**.
2. Nhập tên, yêu cầu, số nhóm và hạn nộp. Có thể nhập yêu cầu trực tiếp, tải Word `.docx` tối đa **5 MB**, hoặc dùng cả hai. Với Word `.doc`, chọn **Save As → Word Document (.docx)** trước khi tải lên.
3. Chọn **Tạo và chia nhóm**. App xáo trộn ngẫu nhiên danh sách học sinh và phân lần lượt vào các nhóm để số thành viên chênh lệch tối đa một. Số nhóm từ 1 đến số học sinh, không có nhóm rỗng.
4. Mỗi nhóm có một đại diện được chọn khi chia nhóm. Giáo viên có thể đổi bằng **Đại diện → Lưu đại diện**, chọn người hiện còn trong lớp và thuộc nhóm đó.

Nhóm được lưu cố định khi tạo; tải lại trang hay gửi lại yêu cầu sau lỗi mạng không chia lại. Học sinh vào lớp sau đó chưa được phân nhóm trong hoạt động cũ. Bản hiện tại chưa có thao tác chuyển/thêm thành viên vào nhóm đã chốt; tạo hoạt động mới sau khi cập nhật danh sách lớp nếu cần. Người đã rời lớp mất quyền truy cập; danh sách cũ vẫn lưu tên để bảo toàn lịch sử. Nếu đại diện rời lớp, giáo viên chọn đại diện khác.

Yêu cầu Word hiển thị nội dung chữ trên web, gồm các đoạn, chữ trong bảng và xuống dòng. Không chuyển nguyên bố cục, ảnh hoặc hình vẽ sang HTML; **tải bản Word gốc** để xem đầy đủ. Các ký tự HTML trong yêu cầu được hiển thị như văn bản.

## Học sinh nộp sản phẩm

Học sinh mở hoạt động để xem yêu cầu, nhóm của mình và người đại diện. **Đại diện nộp cho cả nhóm**, phù hợp mục chia nhóm/nộp sản phẩm trong đề án. Thành viên khác cùng xem sản phẩm đã nộp; có thể nhờ giáo viên đổi đại diện.

- File **Word `.doc/.docx`, PDF `.pdf`, PowerPoint `.ppt/.pptx`**, tối đa **10 MB** mỗi lần nộp.
- Hoặc **link HTTP/HTTPS**, ví dụ link chia sẻ Canva. Bật quyền xem trên Canva trước khi gửi; ứng dụng lưu link, không kiểm tra hoặc tự tải nội dung bên ngoài.
- Có thể thêm ghi chú và nộp nhiều phiên bản trước hạn. Mỗi lần ghi người nộp, thời gian máy chủ và số phiên bản; phiên bản mới nhất đứng đầu. Nộp lại không xóa file/link cũ.

Nếu phản hồi bị mất sau khi máy chủ đã nhận, giữ nguyên form và bấm nộp lại: cùng yêu cầu được trả về mà không tạo bản trùng. Chỉnh sửa nội dung form sẽ tạo yêu cầu mới. Bài chỉ được coi là nhận khi máy chủ đã lưu; bắt đầu tải trước hạn nhưng hoàn tất sau hạn vẫn bị từ chối.

## Hạn nộp và gia hạn

Hạn nhập theo múi giờ của thiết bị giáo viên; thời điểm được lưu thống nhất ở máy chủ. Giao diện hiển thị theo múi giờ của thiết bị đang xem. **Thời gian máy chủ quyết định việc nhận bài**: khi thời gian hiện tại bằng hoặc vượt hạn, không nhận bài mới. Nút/form nộp ẩn khi hết hạn; tải lại, sửa giờ máy hay gọi API trực tiếp không vượt được giới hạn.

Giáo viên chọn **Gia hạn nộp bài**, nhập hạn mới và lý do tùy chọn. Hạn mới phải muộn hơn hạn cũ và thời gian hiện tại. Có thể gia hạn cả trước và sau khi hết hạn. App lưu người gia hạn, thời điểm, hạn cũ/mới và lý do. Nếu người khác vừa đổi hạn hoặc đại diện, yêu cầu cũ bị từ chối để tránh ghi đè; bấm **Cập nhật** trước khi thao tác lại.

Trang cập nhật dữ liệu mỗi 20 giây và khi quay lại cửa sổ. Học sinh có thể bấm **Cập nhật** để nhận hạn mới ngay. Sau gia hạn, đại diện được nộp tiếp; lịch sử cũ còn nguyên.

## Quyền truy cập và lưu trữ

Giáo viên chỉ quản lý hoạt động và tải sản phẩm trong lớp mình sở hữu. Học sinh phải là thành viên hiện tại của lớp; chỉ xem danh sách và sản phẩm của nhóm mình. Yêu cầu Word dành cho cả lớp. Không có URL file công khai: mỗi lần tải đều kiểm tra session và quyền lớp/nhóm, trả file dạng tải xuống.

Hoạt động, thành viên, lịch sử, file gốc và sản phẩm nằm trong SQLite ở `DATABASE_PATH` (mặc định `.local/greenedu.sqlite`). Các bảng được thêm tự động khi khởi động bản mới; không xóa lớp, câu hỏi hoặc tiến độ cũ. Không đưa database hoặc file học sinh lên Git. Sao lưu/khôi phục database phải bao gồm file BLOB; dùng SQLite backup phù hợp hoặc dừng server trước khi sao chép database. Đây là lưu trữ cho MVP một instance; chưa có hạn ngạch tổng dung lượng hay quản lý xóa file.

Phạm vi đợt này: tạo hoạt động, đọc yêu cầu Word, chia ngẫu nhiên, đại diện, nộp sản phẩm, hạn nộp, gia hạn và lịch sử. **Phản biện chéo, chấm điểm và điểm thưởng nhóm trong đề án chưa triển khai.**
