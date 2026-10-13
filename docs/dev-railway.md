# Giao diện local, API và database Railway

Đây là cách chạy mặc định theo yêu cầu ngày **11/10/2026**, thay việc tự deploy toàn bộ ứng dụng local sau mỗi thay đổi.

| Thành phần                               | Nơi chạy                                       |
| ---------------------------------------- | ---------------------------------------------- |
| Giao diện đang sửa                       | http://localhost:5173 — Vite, cập nhật tức thì |
| API/backend                              | https://greenedu.up.railway.app                |
| Database, file học sinh, phiên đăng nhập | Backend Railway đang triển khai quản lý        |

Không kết nối SQLite Railway trực tiếp từ máy này. Các yêu cầu `/api` được Vite chuyển tới HTTPS Railway; dữ liệu và phiên vẫn do backend đó xử lý. Cấu hình không làm thay đổi đường dẫn/mount của database trên Railway.

## Chạy nhanh

Trong `D:\SangKienKn`:

```powershell
npm run local
```

Lệnh chạy giao diện trong nền, không mở cửa sổ terminal, không build và không khởi động backend/database local. Nếu đang chạy thì dùng lại tiến trình hiện tại. Mở **http://localhost:5173**. Sửa mã frontend sẽ tự cập nhật; sửa `vite.config.ts` hoặc cấu hình npm có thể cần khởi động lại.

```powershell
npm run local -- -Action Status
npm run local -- -Action Stop
npm run local
```

Muốn giữ log trực tiếp trong terminal:

```powershell
npm run dev
```

Dừng bằng `Ctrl+C`. Cổng 5173 phải trống; nếu đã chạy nền, dừng bằng lệnh `local` trước. Vite chỉ lắng nghe loopback `127.0.0.1`, dùng cổng cố định, không tự chuyển cổng. Log nền: `.local/frontend.log`, `.local/frontend-error.log`; trạng thái: `.local/frontend-state.json`. Sau khi khởi động Windows, chạy lại lệnh.

Nếu trình duyệt báo **504 (Outdated Optimize Dep)**, khởi động lại frontend và buộc Vite tạo lại dependency cache:

```powershell
npm run local -- -Force
```

Sau đó tải lại tab localhost bằng `Ctrl+F5` nếu tab còn giữ module cũ. `-Force` chỉ khởi động lại Vite của đúng repository ở chế độ Railway và truyền `--force` cho optimizer; không xóa dữ liệu hoặc khởi động API SQLite. Script kiểm tra cả tiến trình đang giữ cổng5173 khi file trạng thái cũ không còn hợp lệ, chờ tiến trình cũ dừng và chỉ báo ready khi chính Vite mới giữ cổng. Nếu cổng thuộc ứng dụng khác thì báo lỗi, không dừng ứng dụng đó.

## Đăng nhập và dữ liệu

Đăng nhập bằng tài khoản/mật khẩu **có trên Railway**. Hai nút vào nhanh bỏ mật khẩu của backend local không hoạt động trong production; API Railway hiện trả `quickLogin:false`. Tài khoản/phiên của database local cũ không chuyển sang Railway.

**Tạo/sửa/xóa lớp, học sinh, câu hỏi, làm bài, tải file trên giao diện này sẽ ghi dữ liệu thật Railway.** Chỉ dùng dữ liệu và tài khoản phù hợp mục đích thao tác; không tự seed hoặc chạy bộ test tạo dữ liệu trên Railway. Kiểm thử tự động vẫn dùng server/database riêng.

Proxy giữ `HttpOnly`/`SameSite` cho cookie phiên; bỏ thuộc tính `Secure` ở phản hồi tới HTTP loopback và bỏ Domain upstream để trình duyệt lưu phiên cho host local. Đường truyền từ proxy tới Railway vẫn HTTPS, kiểm tra chứng chỉ bật. Proxy kiểm tra Origin và chặn cross-site trước khi đổi Host/Origin sang Railway để backend giữ kiểm tra cùng nguồn; không sửa hay mở CORS ở backend production. Không phục vụ proxy này trên LAN hoặc hosting công khai. Tham khảo [cấu hình proxy Vite](https://v6.vite.dev/config/server-options#server-proxy).

Frontend local dùng mã hiện tại, backend dùng **phiên bản đang triển khai trên Railway**. Sửa backend/migration local chưa có hiệu lực với Railway; cần triển khai backend riêng. Ghi chú chưa xác minh volume là giới hạn của lượt thiết lập ban đầu; các đợt triển khai/backup/đối chiếu dữ liệu sau đó ở [session-handoff.md](session-handoff.md). Không suy trạng thái deployment hoặc kết quả bảo toàn hiện tại từ một ghi chú cũ.

## Chạy độc lập khi kiểm thử

```powershell
# Hai tiến trình frontend và API local như cách dev trước đây
npm run dev:offline

# HTTP/backend tests dùng database riêng
npm test

# Browser tests khởi động server/database E2E riêng, không dùng proxy Railway
npm run test:e2e
```

Không chạy dev offline đồng thời với frontend Railway ở cổng 5173. Khi cần demo độc lập, đặt `DATABASE_PATH` riêng và `SEED_DEMO=1`; không đặt seed cho Railway. Lệnh `npm run deploy` cũ vẫn dành cho build + API + SQLite local, hướng dẫn tại [deploy-local.md](deploy-local.md); không còn là thao tác tự động sau mỗi yêu cầu sửa giao diện.

## Chrome báo 504 Outdated Optimize Dep

Nếu Chrome giữ URL thư viện React có hash cũ sau khi cache Vite thay đổi, mở lại http://localhost:5173 rồi nhấn Ctrl+Shift+R. Nếu vẫn lỗi, chạy `npm run local -- -Action Stop`, sau đó `npm run local` và tải lại trang. Cấu hình chỉ quét index.html của app và bỏ theo dõi .local để các bản build/release tạm không làm mất cache đang dùng. Thao tác này chỉ khởi động lại frontend; API/database Railway giữ nguyên.
