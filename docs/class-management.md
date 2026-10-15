# Quản lý lớp: quyền học tập và quy tắc phiên

## Điều hướng săn thưởng — 15/10/2026

Giáo viên có thể mở/khóa/upload/dùng lại đề ngay tại **Kiểm tra săn thưởng → Đề săn thưởng theo chương**, ngoài các nút Quản lý lớp hiện có. Cùng `HuntAccess` và API/quyền/chính sách bên dưới; không thêm gate hoặc thay đổi vé/điểm. Thiết lập học kỳ/cách tính tỷ lệ nằm trong **Thiết lập chương** của tab này. Ôn tập theo tiêu đề/upload đã tách riêng; [quy trình hiện hành](review-papers.md).

Cập nhật 15/10/2026 theo yêu cầu mới. Các quy tắc dưới thay mô tả cũ “mở/khóa kiểm tra chương” và “rời tab một lần là kết thúc luyện tập”. Mã/test trong checkout không đồng nghĩa backend Railway đã phát hành.

## Giao diện quản lý — 15/10/2026

Ba nút **Học sinh / Chương học / Cài đặt chung** ở đầu Quản lý lớp di chuyển và focus đúng khu vực, không xóa bản nháp. Cài phiên học chia hai cặp **Rời tab · lần** và **Không tương tác · giây**, mỗi cặp Nhắc nhở/Tự đóng; nhãn đầy đủ cho trình đọc màn hình. Giữ min/max, điều kiện ngưỡng nhắc nhỏ hơn ngưỡng đóng và quyền lưu ở phần nghiệp vụ bên dưới.

## Thống kê học sinh

Trong Quản lý học sinh, kính lúp ở ô thời gian mở hộp thống kê với đúng học sinh đã chọn. Dùng lại thống kê ngày/tuần/tháng, CSV và API cá nhân hiện có. Nút Thống kê chung vẫn mở toàn lớp, bộ chọn vẫn có toàn bộ roster, không phụ thuộc tìm kiếm. Giữ quyền giáo viên sở hữu lớp.

## Hai quyền độc lập cho từng chương

- **Mở/Khóa luyện tập**: điều khiển luyện chương/bài, ôn và sửa sai thuộc chương. Mặc định luyện tập mở để bảo toàn quyền học trước migration. Student chapter card khóa nút khi nhận trạng thái mới. Server chặn lấy đề luyện, bắt đầu/heartbeat, trả lời và bộ ôn chứa chương bị khóa, kể cả URL hoặc màn hình cũ. Khóa đóng phiên đang học, giữ thời gian đã được xác nhận; khóa theo quyết định giáo viên không phải vi phạm của học sinh.
- **Mở/Khóa săn thưởng**: độc lập với luyện tập. Lần cấu hình mới cần tải Word/CSV hợp lệ theo mẫu, 1–100 câu thuộc chương đang mở. Câu riêng không xuất hiện trong ngân hàng luyện tập. Giữ các điều kiện cấp 3, tỷ lệ đúng, sổ tay sạch và vé; mở quyền không tự trao đủ điều kiện.
- **Kiểm tra online/theo lịch**: dùng quyền và lịch của chính buổi thi; hai khóa ở chương không chặn một buổi kiểm tra chính thức độc lập.

Quyền kiểm tra chương cũ còn giữ qua `/exam-access` để tương thích dữ liệu/client trước; giao diện quản lý mới không dùng nó cho luyện tập. Săn thưởng cũ chưa có cấu hình đề tiếp tục nguồn ngân hàng và quy tắc cũ cho đến khi giáo viên cấu hình mới; không tự chuyển tiến độ/đề cũ hoặc sửa database production trong đợt code này.

## Đề săn thưởng và cửa sổ tham gia

Mở săn thưởng hiện hộp: tên đề, upload, thời gian chuẩn bị X phút (0–60), làm bài Y phút (1–180), giới hạn rời tab (1–20). Có đề đã lưu thì mặc định **Sử dụng bộ đề đã tải trước đó**, kèm thời điểm tải; bỏ chọn để tải đề mới. Mẫu/preview/kiểm tra lỗi Word và CSV dùng chung với tạo kiểm tra online; chỉ một chương trong hộp này.

Bấm mở chốt snapshot và đặt giờ mở T+X, hạn chung T+X+Y. Mỗi lượt đảo thứ tự câu và lưu thứ tự; vào muộn không được gia hạn. Không được thay bộ đề hoặc kéo dài cửa sổ đang mở; khóa trước khi mở đợt mới. Request ID chống retry tạo thêm đề hoặc đổi giờ. Học sinh thấy tên đề/thời lượng/giờ mở–đóng trên thẻ săn thưởng; poll hiện có cập nhật quyền, server quyết định quyền vào thật.

Bấm khóa luôn có xác nhận: học sinh không vào mới; lượt đang làm thu bài với đáp án đã lưu. Checkbox **Xóa bộ đề đã tải lên** mặc định bỏ chọn. Không xóa thì mở lại dùng đề/thời điểm tải cũ, đặt cửa sổ mới; chọn xóa thì không thể dùng lại đề cấu hình đó, phải tải mới. Giữ snapshot/câu và kết quả của các lượt đã làm để lịch sử và sổ tay không mất dữ liệu. Không xóa lịch sử để xóa đề đang cấu hình.

## Quản lý chung

Thay tiêu đề Quản lý cấp độ; giữ phút/cấp (1–1440) và thêm:

| Cài đặt | Phạm vi | Mặc định |
| --- | --- | --- |
| Nhắc khi rời tab | Số nguyên, từ 1 và nhỏ hơn ngưỡng đóng | 2 lần |
| Tự đóng khi rời tab | Số nguyên 2–20 | 4 lần |
| Nhắc không tương tác | Giây nguyên, từ 5 và nhỏ hơn ngưỡng đóng | 105 giây |
| Tự đóng không tương tác | Giây nguyên, tối đa 3600 | 120 giây |

Ví dụ yêu cầu: nhắc 2 lần/30 giây, đóng 3 lần/60 giây. Hai điều kiện dùng **hoặc**, không phải cần đồng thời cả hai. Lưu phút/cấp và policy trong một transaction, chỉ giáo viên chủ lớp. Áp dụng trong cùng lớp/môn cho luyện, ôn, sửa sai và phòng thi. Giới hạn tab của bài thi/đợt săn thưởng được giữ nếu chặt hơn giới hạn chung. Worker/GET cũng kết thúc phiên đã đạt ngưỡng sau khi giáo viên hạ cấu hình.

Blur/hidden cùng một lần rời chỉ tính một sự kiện; trở lại rồi rời mới tính lần tiếp. Trước ngưỡng đóng, luyện tập tạm dừng ghi giờ khi ở ngoài trang, cần Tiếp tục học. Đến ngưỡng nhắc hiện popup; tiếp tục làm bài không xóa số lần rời tab. Tương tác thực mới đặt lại đồng hồ idle; polling không được coi là tương tác.

## Khi bị đóng phiên

- **Luyện tập/ôn/sửa sai:** về trang chính, popup lý do, giữ đăng nhập và đáp án/sổ tay. Loại **toàn bộ thời gian của đúng phiên vi phạm**, giữ giờ từ các phiên trước, chương và học sinh khác. Ledger phiên lưu tổng mili-giây và phần theo ngày để hoàn tác progress và thống kê ngày cùng transaction, kể cả qua nửa đêm. Retry không trừ hai lần. Giờ phiên đang mở là tạm tính; không dùng phần này để cấp vé/điểm mốc cho tới khi phiên kết thúc hợp lệ.
- **Phòng thi/săn thưởng:** khóa trả lời, tự nộp với đáp án server đã lưu; không cộng giờ ôn cho thời gian thi. Server dùng last_activity và số sự kiện đã nhận; GET/poll không gia hạn idle. Gửi đáp án sau khi đóng không thay kết quả. Hàng đợi xử lý vi phạm tab trước đáp án chưa gửi để không đưa đáp án mới vào bài sau khi đã đạt ngưỡng.
- **Mất mạng/ngủ máy:** client dừng thao tác/đếm bù khi không đủ bằng chứng; closure luyện tập được lưu chờ và gửi lại lúc online. Worker server đóng các phiên đã hết ngưỡng ngay cả khi không còn trình duyệt. Không khẳng định có thể phát hiện một sự kiện trình duyệt không gửi được; backend không thể chứng thực `isTrusted` của client. Không có trừ điểm kỷ luật/khóa tài khoản hoặc thêm gia sư AI.

Migration chỉ thêm bảng/cột chỉ mục mới, không sửa lịch sử có sẵn. Lượt thi cũ chưa có activity nhận một mốc grace ở lần rollout đầu, không đặt lại mốc đã có ở mỗi restart và không đổi deadline. Phiên luyện tồn tại từ trước ledger không bị suy diễn giờ đã ghi trước rollout. Client thiếu capability khóa các công cụ quản lý mới; ExamRoom/Practice có đường tương thích server trước đó.

## Tệp triển khai

`shared/session-policy.ts`, `server/class-management.ts`, migration trong `server/db.ts`, worker `server/index.ts`, quyền/study trong `server/app.ts`, săn thưởng/exam trong `server/learning.ts`, ledger trong `server/study-history.ts`; frontend dùng `HuntAccess`, `ClassLevelSettings`, `Practice`, `Learning`, `session-end` và kính lúp trong `App`/`StudentStudyStatistics`. Bằng chứng từng lượt test và trạng thái push/deploy ở đầu session-handoff/project-status, không lấy kết quả test lịch sử làm lượt mới.
