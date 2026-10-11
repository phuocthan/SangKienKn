# Avatar tài khoản — chức năng và lưu trữ

Cập nhật 11/10/2026. Toàn bộ thiết kế, hình ảnh, prompt, bộ sưu tập và cách hiển thị tập trung tại [app-design.md](app-design.md).

Học sinh và giáo viên chọn/lưu avatar trong Tài khoản. Giáo viên có 40 ID trong danh mục; học sinh dùng 24 ID dành cho học sinh/thiên nhiên, không được dùng 16 ID giáo viên. Avatar không thay đổi vai trò. Có thể dùng ảnh cá nhân hoặc khôi phục chữ viết tắt.

Từ lượt chỉnh giao diện 11/10/2026, click ảnh đại diện/nút **Đổi avatar** trong trang Tài khoản hoặc avatar thanh đầu để mở popup. Chọn/tải ảnh rồi bấm **Lưu avatar**; đóng khi chưa lưu bỏ lựa chọn và ảnh tạm, giữ avatar hiện tại. Đây là thay đổi frontend local 5173, chưa push/deploy Railway.

Upload nhận JPG/PNG/WebP tối đa **3 MB (3 × 1024 × 1024 byte)** và 4096 × 4096 px. Mỗi tài khoản lưu một ảnh, tải ảnh mới thay bản trước. API kiểm tra kích thước/chữ ký và lưu atomically. Không nhận URL ảnh tùy ý hoặc ID ảnh thuộc tài khoản khác.

- POST /api/auth/avatar: cập nhật lựa chọn của người đang đăng nhập, kiểm tra quyền theo vai trò; học sinh gửi ID giáo viên bị từ chối 403.
- POST /api/auth/avatar/upload: multipart một trường avatar; tài khoản mật khẩu tạm phải đổi mật khẩu trước.
- GET /api/avatars/:id: chỉ chủ ảnh, Admin và tài khoản có lớp chung được xem.
- user_avatars lưu lựa chọn; avatar_uploads lưu BLOB ảnh nên backup SQLite bao gồm cả ảnh. Migration giữ dữ liệu học tập; lựa chọn giáo viên cũ của học sinh được đưa về mặc định theo quy tắc vai trò.

Đã deploy bản offline local ở đợt trước; đây không phải xác nhận trạng thái server hiện tại. Popup mới và trạng thái Railway theo [session-handoff.md](session-handoff.md). Bằng chứng trước đây: API kiểm tra40ID/quyền/upload3MB/chặn vượt1byte/persistence; E2E chọn/lưu/tải lại/upload/khôi phục desktop/mobile trên database riêng. Không báo các kết quả này thành test mới khi chỉ đọc tài liệu.
