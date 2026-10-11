# Email xác nhận tài khoản GreenEdu

Theo yêu cầu ngày 11/10/2026, người mới nhận email **xác nhận tài khoản đã tạo thành công**, có một câu giới thiệu ngắn theo vai trò và nút mở GreenEdu. Đề xuất ban đầu cho lượng thư nhỏ là **EmailJS kết nối Gmail**; không cần tên miền gửi riêng. Chưa kết nối dịch vụ/chưa gửi email thật/chưa triển khai backend mới lên Railway.

GreenEdu hiện chưa có tự đăng ký hoặc đăng nhập Google. Tính năng này chạy khi **Admin tạo giáo viên/học sinh**, hoặc **giáo viên tạo học sinh** bằng email bất kỳ hợp lệ, gồm Gmail. Không tự mở đăng ký công khai, nâng quyền hoặc xác minh sở hữu Gmail.

## Nội dung

Tiêu đề chung: **GreenEdu — Tài khoản của bạn đã được tạo thành công**.

**Giáo viên:**

> Xin chào Thầy/Cô [Họ tên],
>
> Tài khoản giáo viên của bạn trên GreenEdu đã được tạo thành công.
>
> Với tài khoản giáo viên, Thầy/Cô có thể tạo lớp, thêm học sinh, quản lý câu hỏi, tổ chức hoạt động nhóm và theo dõi tiến độ học tập.
>
> Đăng nhập tại: https://greenedu.up.railway.app/
> Sử dụng mật khẩu tạm do Admin hoặc giáo viên cung cấp và đổi mật khẩu ở lần đăng nhập đầu tiên.
>
> Chào mừng bạn đến với GreenEdu!

**Học sinh:**

> Xin chào [Họ tên],
>
> Tài khoản học sinh của bạn trên GreenEdu đã được tạo thành công.
>
> Với tài khoản học sinh, bạn có thể luyện tập, sửa sai, ôn tập, làm bài kiểm tra và tham gia hoạt động nhóm trong lớp của mình.
>
> Đăng nhập tại: https://greenedu.up.railway.app/
> Sử dụng mật khẩu tạm do Admin hoặc giáo viên cung cấp và đổi mật khẩu ở lần đăng nhập đầu tiên.
>
> Chào mừng bạn đến với GreenEdu!

Không gửi mật khẩu tạm, hash, token phiên hoặc khóa API trong nội dung thư. Email này là thông báo tạo tài khoản, không phải email xác minh địa chỉ và không thay việc cung cấp mật khẩu riêng.

## Cấu hình một lần

1. Tạo tài khoản tại [EmailJS](https://www.emailjs.com/), vào **Email Services → Add New Service → Gmail**, kết nối Gmail muốn dùng gửi thư. Việc cấp quyền Google thực hiện trực tiếp trên EmailJS, không gửi mật khẩu Gmail qua chat.
2. Tạo một template cho cả hai vai trò. **To Email:** `{{to_email}}`; **Subject:** `{{subject}}`; **From Name:** `GreenEdu`; From Email lấy từ service Gmail đã kết nối. Dùng nội dung HTML trong [emailjs-welcome-template.html](emailjs-welcome-template.html). Giữ biến `{{message}}` với **hai** dấu ngoặc để EmailJS escape nội dung, không dùng ba dấu ngoặc. Không bật auto-reply hoặc template thứ hai cho sự kiện này.
3. Trong **Account → Security**, bật cho phép API từ **non-browser applications** vì Railway gửi từ backend. Nếu bật yêu cầu Private Key, điền `EMAILJS_PRIVATE_KEY` trên Railway tương ứng.
4. Trong Railway → service `SangKienKn` → **Variables**, đặt các biến bên dưới bằng giá trị từ tài khoản EmailJS. Đây là cấu hình server, không đặt tiền tố `VITE_`, không commit vào Git và không đưa khóa riêng vào chat/tài liệu.

```text
WELCOME_EMAIL_ENABLED=1
EMAILJS_SERVICE_ID=<Service ID>
EMAILJS_TEMPLATE_ID=<Template ID>
EMAILJS_PUBLIC_KEY=<Public Key>
EMAILJS_PRIVATE_KEY=<Private Key nếu cấu hình yêu cầu>
APP_PUBLIC_URL=https://greenedu.up.railway.app/
```

Triển khai backend có mã mới theo yêu cầu của người dùng rồi nghiệm thu bằng một tài khoản/địa chỉ người dùng chỉ định. Chưa tự push/deploy hoặc gửi test tới người dùng thật trong đợt chuẩn bị này. Gmail kết nối và cấu hình EmailJS cần chủ tài khoản thực hiện; nếu thiếu, giữ `WELCOME_EMAIL_ENABLED=0` như mặc định. Tài khoản vẫn tạo bình thường khi email tắt.

EmailJS/Gmail có giới hạn theo gói và dịch vụ; đây là phương án cho lượng thư nhỏ. Khi mở cho quy mô trường lớn, dùng dịch vụ email giao dịch chuyên dụng. Đối chiếu trực tiếp gói dịch vụ trước khi bật; không mặc định mọi tính năng miễn phí hoặc đảm bảo vào Inbox.

## Cách vận hành

- Tạo tài khoản và ghi hàng đợi trong cùng transaction. Hàng đợi `welcome_emails` lưu ID/trạng thái, không lưu mật khẩu hoặc body có secrets; migration chỉ thêm bảng.
- Một hàng đợi duy nhất cho mỗi tài khoản mới. Không gửi lại khi đăng nhập, cấp lại mật khẩu, thêm tài khoản có sẵn vào lớp hoặc tạo trùng email. Không gửi cho Admin/seed/demo/CLI bootstrap, không tự gửi bù hàng loạt cho tài khoản cũ hay những tài khoản tạo khi tính năng tắt.
- Worker trên backend gửi qua HTTPS EmailJS, xử lý từng thư và cách lượt bắt đầu gửi ít nhất 2 giây. Frontend local dùng API Railway nên cần **backend Railway mới**; chỉ sửa local chưa bật gửi thật.
- `pending`: chưa gửi; `sending`: đã được nhận xử lý; `sent`: API dịch vụ chấp nhận; `failed`: dịch vụ trả lỗi; `uncertain`: lỗi mạng/timeout không xác định kết quả. `sent` không xác nhận người nhận đã thấy thư hoặc vào Inbox.
- Không tự gửi lại `sent`, `failed`, `uncertain` hoặc `sending` sau restart để tránh gửi trùng khi kết quả không rõ. Nếu có lỗi, kiểm tra EmailJS History và trạng thái hàng đợi trước khi quyết định gửi lại. SMTP hoặc retry không được tự thêm vào yêu cầu này.
- Lỗi gửi không xóa tài khoản. Cấu hình bật nhưng thiếu biến hoặc APP_PUBLIC_URL không phải HTTPS bị từ chối lúc startup với tên biến cần bổ sung; không log giá trị khóa.

## Kiểm thử đã chạy

20/20 ca email + quản lý tài khoản đạt (`welcome-email.test.ts`, `accounts.test.ts`), TypeScript đạt. Database riêng và API EmailJS giả lập; không gửi mail thật hoặc ghi dữ liệu Railway. Kiểm tra nội dung hai vai trò, opt-in/tắt, tạo mới/trùng/thêm tài khoản có sẵn, không chứa mật khẩu, transaction rollback, uniqueness, cookie/role account regression, tốc độ/claim đồng thời, lỗi không làm mất tài khoản, không lộ provider body/secrets, giữ hàng đợi qua restart.

Sau đó **76/76 toàn bộ backend đạt** (`npm test`). Mẫu HTML hai vai trò được render và xem ở 640/360 px, link đúng/không tràn ngang; ảnh `.local/welcome-email-preview-*.png`. Đây là kiểm tra HTML bằng Chromium, chưa phải nghiệm thu trong Gmail Inbox thật.

Nguồn chính thức: [EmailJS nối Gmail và phạm vi lượng thư nhỏ](https://www.emailjs.com/docs/user-guide/connecting-email-services/), [REST send](https://www.emailjs.com/docs/rest-api/send/), [Node/non-browser API](https://github.com/emailjs-com/emailjs-nodejs), [biến template và escape](https://www.emailjs.com/docs/user-guide/dynamic-variables-templates/), [Railway SMTP/HTTPS](https://docs.railway.com/networking/outbound-networking). Hình thức email tra cứu tại [app-design.md](app-design.md).
