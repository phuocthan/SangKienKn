# Góp ý riêng và phản biện hoạt động nhóm

Đối chiếu mã checkout ngày 12/10/2026: `server/feedback.ts`, `server/group-discussion.ts`, `server/group-activities.ts`, `src/Feedback.tsx`, `src/GroupDiscussion.tsx`, `src/Conversation.tsx`. Tài liệu này mô tả chức năng đã có trong mã, không xác nhận backend Railway đã triển khai. Đợt cập nhật tài liệu không chạy lại các kiểm thử của phân hệ này.

## Góp ý riêng với giáo viên

- Học sinh chọn lớp, mở **Góp ý với giáo viên**, tạo chủ đề gồm tiêu đề và nội dung. Tiêu đề tối đa 160 ký tự, nội dung mỗi tin tối đa 5.000 ký tự.
- Chỉ người gửi và giáo viên sở hữu lớp xem được cuộc trao đổi. Đây là góp ý có tên người gửi, không ẩn danh và không gửi email bên ngoài.
- Giáo viên dùng **Quản lý góp ý** để tìm theo tiêu đề/học sinh, lọc Chờ phản hồi/Đã phản hồi/Đã xử lý và trả lời.
- Giáo viên trả lời chuyển trạng thái Đã phản hồi; học sinh gửi tiếp chuyển Chờ phản hồi. Giáo viên đánh dấu Đã xử lý hoặc mở lại để tiếp tục trao đổi.
- Chủ đề đã xử lý không nhận tin mới cho đến khi giáo viên mở lại. Quyền truy cập kiểm tra membership/giáo viên hiện tại của lớp ở máy chủ.
- Mỗi lần gửi dùng mã request để retry không tạo trùng; dùng cùng mã cho nội dung khác bị từ chối. Giao diện cập nhật định kỳ 20 giây và khi trở lại cửa sổ, giữ lịch sử tin nhắn.
- API cũ không có endpoint: giao diện báo tính năng chưa sẵn sàng, không coi frontend local là bằng chứng backend mới đã triển khai.

## Trao đổi và phản biện giữa các nhóm

Hoạt động chỉ mở giai đoạn phản biện khi giáo viên **đã gia hạn ít nhất một lần và hạn hiện tại đã hết**. Máy chủ dùng thời gian thật. Chỉ hết hạn ban đầu mà chưa có lịch sử gia hạn chưa mở phản biện. Gia hạn tiếp làm thời điểm mở chuyển theo hạn mới.

Trong giai đoạn nộp, học sinh xem sản phẩm của nhóm mình. Khi phản biện mở, thành viên hiện tại của lớp xem danh sách nhóm và tải sản phẩm nhóm khác trong cùng hoạt động. File vẫn kiểm tra session/quyền lớp mỗi lần tải, không có URL công khai.

- Nhóm khác đặt **câu hỏi** hoặc **góp ý** về sản phẩm của nhóm đích. Học sinh cần được phân vào một nhóm của hoạt động để gửi.
- Nhóm sở hữu sản phẩm trả lời ý kiến/câu hỏi bằng **phản biện**. Học sinh không tự đặt câu hỏi cho nhóm mình hoặc trả lời thay nhóm khác.
- Giáo viên sở hữu lớp có thể đặt câu hỏi, góp ý hoặc phản hồi trên các nhóm để điều phối.
- Nhóm đích phải có sản phẩm. Ý kiến mới gắn với phiên bản sản phẩm mới nhất; câu trả lời giữ liên kết phiên bản của ý kiến gốc. Không sửa lịch sử nộp sản phẩm.
- Nội dung tối đa 5.000 ký tự, có người gửi/vai trò/nhóm/thời điểm/phiên bản. Retry cùng mã không tạo trùng; ý kiến gốc phải thuộc đúng nhóm và hoạt động.
- Dialog **Trao đổi & phản biện** cập nhật 20 giây khi mở, có nút Cập nhật. Các trường capability `canDiscuss`, `discussionOpen`, `myGroupId` giúp tương thích với API cũ.

## Lưu trữ và phạm vi còn lại

Migration bổ sung `feedback_threads`, `feedback_messages`, `group_discussion_posts`, không reset database. Các tin nhắn là dữ liệu người dùng, không đưa database hoặc bản xuất tin nhắn lên Git.

Chưa có nghiệp vụ chấm điểm/điểm thưởng nhóm, phân công cặp phản biện riêng, điều chỉnh thành viên sau chốt nhóm hoặc đính kèm file riêng cho tin nhắn. Sản phẩm nhóm vẫn dùng luồng nộp file/link tại [group-activities.md](group-activities.md).

Kiểm thử sẵn có: `server/feedback.test.ts`, các ca trong `server/group-activities.test.ts`, `e2e/feedback-discussion.spec.ts`. Khi thay đổi chức năng, dùng server/database riêng; không chạy ca tạo dữ liệu trên Railway. Không báo các ca này đã đạt trong session mới khi chưa chạy.
