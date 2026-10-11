# Triển khai nhanh GreenEdu trên Windows

Tại thư mục dự án, chạy:

```powershell
npm run deploy
```

Hoặc nhắn trong chat đang làm việc với repository: **“deploy GreenEdu”**. Agent sẽ chạy cùng lệnh theo `AGENTS.md`. Theo lựa chọn ngày 11/10/2026, agent cũng tự deploy sau mỗi yêu cầu thay đổi ứng dụng đã hoàn thành và kiểm thử phù hợp đạt, không hỏi lại. Các bước chỉnh sửa/kiểm thử của cùng yêu cầu được gộp thành một lần deploy ở cuối. Có thể yêu cầu “chưa deploy”, “chỉ sửa/kiểm tra” hoặc “dừng server” để áp dụng cách khác cho lần đó.

Lệnh kiểm tra Node.js 24+, cài dependencies theo lockfile khi cần, kiểm tra TypeScript và build vào thư mục tạm. Khi build thành công, script sao lưu SQLite bằng API backup (bao gồm dữ liệu WAL đã commit), dừng server do script quản lý, thay bản build và khởi động server trong nền. Chỉ báo thành công sau khi `/api/health` đạt. Mở địa chỉ được script thông báo; dùng `npm run deploy:status` để xem lại.

Bản đã triển khai ngày 10/10/2026 đang ở **[http://localhost:3002](http://localhost:3002)** vì cổng 3001 có server chạy ngoài script. `npm run deploy` tự giữ cổng 3002 cho các lần cập nhật; 3001 chỉ là mặc định cho lần triển khai mới chưa có trạng thái.

Nếu trang Admin hoặc thao tác tạo giáo viên báo **“Không tìm thấy chức năng.”**, kiểm tra địa chỉ đang mở. Server demo cũ ở cổng 3001 khởi động trước khi thêm API quản trị, nhưng vẫn phục vụ thư mục giao diện `dist` vừa build; vì vậy giao diện có thể hiện Admin trong khi backend chưa có chức năng. Mở cổng 3002 bằng tài khoản đã tạo. Tải lại giao diện ở cổng 3001 không cập nhật backend của tiến trình cũ.

Server không hiện cửa sổ terminal, tiếp tục chạy sau khi lệnh hoàn tất; không tự chạy sau khi khởi động lại Windows. Database mặc định là `.local/greenedu.sqlite`, không bị xóa khi deploy. Lần gọi tiếp theo giữ cổng/database/chế độ demo của server do script quản lý, trừ khi truyền lại tham số.

Dependencies đã đúng phiên bản trong lockfile sẽ được dùng lại để deploy nhanh. Khi cần cài, script dùng thư mục staging riêng rồi đổi thư mục `node_modules`, giữ bản trước trong `.local/previous-dependencies-*`; không dùng `npm ci` trực tiếp để xóa các file đang bị tiến trình Windows giữ. Chỉ server do script quản lý và các tiến trình con của nó được dừng khi restart/stop.

## Các lệnh thường dùng

| Lệnh                           | Tác dụng                                                                      |
| ------------------------------ | ----------------------------------------------------------------------------- |
| `npm run deploy`               | Build và chạy/cập nhật ứng dụng local                                         |
| `npm run deploy:status`        | Kiểm tra server do script quản lý                                             |
| `npm run deploy:stop`          | Dừng server do script quản lý                                                 |
| `npm run deploy:build`         | Chỉ build, không khởi động/dừng server                                        |
| `npm run deploy -- -Port 3002` | Deploy ở cổng khác                                                            |
| `npm run deploy -- -Demo`      | Bật tài khoản/dữ liệu demo khi bạn cần                                        |
| `npm run deploy -- -QuickLogin` | Bật hai nút vào nhanh tài khoản giáo viên/học sinh có sẵn, chỉ trên máy local |
| `npm run deploy -- -NoQuickLogin` | Tắt đăng nhập nhanh, dùng lại biểu mẫu email/mật khẩu |
| `npm run deploy -- -Pull`      | Pull fast-forward trước khi deploy; yêu cầu Git không có thay đổi chưa commit |

Chọn database riêng khi cần:

```powershell
npm run deploy -- -Port 3102 -DatabasePath .local/thu-nghiem.sqlite -Demo
```

Dependencies chỉ được bỏ qua khi bạn chủ động dùng `-SkipInstall`; bình thường không cần tham số này. Script không tự pull, commit hoặc push. Nếu cổng có ứng dụng khác hoặc GreenEdu được chạy bằng lệnh khác trước đó, script báo lỗi và không dừng tiến trình đó.

## Log, bản cũ và lỗi

- Trạng thái: `.local/deploy-state.json` (PID, thời điểm bắt đầu, cổng, database).
- Log: `.local/deploy.log` và `.local/deploy-error.log`.
- Sao lưu database: `.local/backups/database-<thời điểm>.sqlite`.
- Bản giao diện cũ: `.local/previous-dist-<thời điểm>/`.
- Nếu build hoặc backup thất bại, script chưa dừng server đang chạy. Nếu khởi động bản mới thất bại, script dừng tiến trình mới và phục hồi thư mục giao diện cũ; server sẽ ở trạng thái dừng. Sửa lỗi theo log rồi deploy lại. Đây không phải rollback mã backend/database; backup SQLite giữ riêng để khôi phục khi có yêu cầu.
- Các backup/bản build cũ không tự xóa. Toàn bộ `.local/` nằm ngoài Git.

Đây là triển khai **local trên Windows**, dùng HTTP và `NODE_ENV=development` để đăng nhập hoạt động trên localhost. Hosting công khai/HTTPS là bước riêng cần cấu hình đích, lưu trữ bền vững và vận hành. Script không thiết lập firewall, hosting hoặc dịch vụ tự chạy cùng Windows.
