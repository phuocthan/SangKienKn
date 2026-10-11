# Cấp độ ôn tập và kiểm tra

Cập nhật 11/10/2026. Kế hoạch và phạm vi: [learning-implementation-plan.md](learning-implementation-plan.md). Thiết kế: [app-design.md](app-design.md).

## Cách sử dụng

Giáo viên mở **Ôn tập & kiểm tra**, gắn học kỳ cho từng chương. Mặc định tỷ lệ mở Săn điểm tính tất cả lượt luyện tập và sửa sai theo lựa chọn của người dùng. Có thể tạo bộ ôn hoặc thi chính thức, chọn chương, số câu và trọng số bài. Trọng số được chia theo tỷ lệ, làm tròn bằng phần dư lớn nhất. Không đủ câu thì báo thiếu; không nhân bản câu. Để trống trọng số chọn ngẫu nhiên trong phạm vi đã chọn.

Học sinh dùng Luyện tập để học từng bài; dùng **Ôn tập & kiểm tra** để ôn chương, nhiều chương hoặc toàn học kỳ, hoặc chọn ma trận giáo viên đã lưu. Bộ câu được trộn và giữ nguyên trong phiên; trả lời/vị trí được lưu. Sau tải lại, bấm **Tiếp tục ôn**. Đổi chương trong phiên ôn kỳ thì thời gian tính đúng chương của câu hiện tại.

Sổ tay nhận câu sai từ luyện tập/ôn/thi. Khi sửa vẫn sai, chỉ nhận thông báo tự làm lại; đáp án và lời giải mở khi sửa đúng. Thời gian học chỉ tính hoạt động có tương tác, theo quy tắc idle hiện có.

## Vé và điểm

| Mốc chương | Cấp cây | Quyền lợi một lần       |
| ---------- | ------- | ----------------------- |
| 0 giờ      | 1       | Bắt đầu chương          |
| 1 giờ      | 2       | Nảy mầm                 |
| 2 giờ      | 3       | Vé Săn điểm thứ nhất    |
| 3 giờ      | 4       | Vé thứ hai              |
| 4 giờ      | 5       | Vé thứ ba và 1 điểm cây |

Vé cấp theo thời gian đã ghi nhận, tối đa 3/chương, không cấp lại khi tải lại hoặc deploy. Dữ liệu tiến độ cũ được xét để nhận các mốc đã đạt. Săn điểm cần >=2 giờ, đúng >=70% **mọi lượt luyện tập và sửa sai**, sổ tay sạch trong chương và còn vé. Vé dùng khi tạo lượt; tải lại/tiếp tục không trừ thêm. Mỗi lượt Săn điểm đạt >=8,0 nhận 1 điểm, gửi giáo viên duyệt; không tự ghi sổ học bạ.

## Phòng thi

Mỗi lượt tối đa 20 phút từ giờ server. Thi chính thức kết thúc sớm hơn nếu khung thi đóng; không yêu cầu vé hoặc điều kiện tự học. Cả lớp có cùng tập câu, thứ tự trộn theo lượt. Mỗi học sinh có một lượt/bài chính thức và chỉ một bài đang làm trên toàn tài khoản.

Đáp án tự lưu có phiên bản, không trả đáp án đúng khi đang làm. Tải lại URL phòng thi tiếp tục cùng lượt. Khi mất mạng, thay đổi chưa gửi lưu trên trình duyệt hiện tại và tự thử lại khi kết nối trở lại; các đáp án chưa tới server trước hạn không được chấm. Đồng hồ thiết bị không quyết định thời hạn. Server tự thu bài ngay cả khi trình duyệt đóng, hoặc thu các lượt hết hạn lúc server khởi động lại.

Mỗi lần tab bị ẩn ghi một sự kiện riêng, gửi lại không đếm trùng. **Lần thứ 4 tự nộp**, giáo viên cấu hình được từ 1–10 khi tạo thi chính thức. Đây là cảnh báo dựa trên tín hiệu trình duyệt, chưa phải cơ chế chống gian lận được nghiệm thu.

Săn điểm công bố kết quả/lời giải và cập nhật sổ tay sau nộp. Thi chính thức công bố đáp án và cập nhật câu sai khi khung thi đóng hoặc giáo viên đóng bài; trong lúc chờ, các API ôn/luyện/sửa sai tạm khóa để tránh dò đáp án. Giáo viên xem trạng thái/lượt thi, đóng bài để thu các lượt đang làm và duyệt hoặc từ chối điểm thưởng.

## Báo cáo và giới hạn phạm vi

Xuất Excel gồm học sinh/email, thời gian học, trung bình các lượt thi chính thức đã nộp, số lượt Săn điểm, điểm Săn điểm/điểm cây và tổng điểm đã duyệt. Họ tên/email là ô văn bản, không được thực thi thành công thức. Danh sách lượt lưu từng điểm và cảnh báo, lọc theo quyền lớp/tài khoản.

Phạm vi này chưa gồm chấm/điểm thưởng hoạt động nhóm, phản biện chéo, đổi quà Green Points, AI, tự phân loại tài liệu Word bất kỳ hoặc nghiệm thu tải với lớp thật. Các phần đó tiếp tục nằm trong lộ trình chung, không được tính vào điểm trong báo cáo này.

Migration thêm bảng, không đổi mật khẩu hoặc mất tiến độ cũ. Kiểm thử dùng SQLite riêng. Không seed dữ liệu thử vào database đang chạy.
