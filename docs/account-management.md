# Quản lý tài khoản GreenEdu

**Tên miền đăng nhập hiện tại từ 11/10/2026: @greenedu.nk.** Toàn bộ 51 tài khoản sẵn có trên Railway (kể cả Admin và giáo viên) đã đổi đuôi, giữ nguyên tên trước @ và mật khẩu. Ví dụ truongnhavy@greenedu.nk hoặc chỉ truongnhavy. Email cũ không còn là tên đăng nhập; phiên đã đăng nhập vẫn gắn với cùng ID. Đợt chuyển đổi có backup/kiểm tra va chạm, không chạy tự động mỗi lần mở database. Dữ liệu SQLite offline cũ không tự chuyển đổi.

## Nhập tài khoản khi đăng nhập

Trang đăng nhập cho phép nhập tên tài khoản hoặc email đầy đủ. Nếu chưa có ký tự `@`, app tự thêm `@greenedu.nk` khi gửi đăng nhập: `hocsinh` tương đương `hocsinh@greenedu.nk`. Khoảng trắng đầu/cuối được bỏ; email đã có `@` được giữ nguyên, kể cả tên miền khác. Vẫn cần mật khẩu đúng và đổi mật khẩu tạm khi được yêu cầu.

## Admin đầu tiên

Tài khoản hiện tại giữ nguyên vai trò. Bản mới không tự nâng giáo viên thành Admin và không tạo mật khẩu Admin mặc định. Người vận hành tạo Admin đầu tiên bằng `npm run create:admin` trên máy đang lưu database.

Trong PowerShell tại thư mục dự án, chạy:

```powershell
npm run create:admin
```

Lệnh hỏi email, họ tên, mật khẩu tạm và nhập lại mật khẩu. Ký tự mật khẩu được che bằng `*`. Nhập sai email, mật khẩu quá ngắn hoặc xác nhận chưa khớp sẽ được hỏi lại; dùng Ctrl+C để hủy. Lệnh dùng `DATABASE_PATH` của môi trường nếu có, mặc định `.local/greenedu.sqlite`, và báo database đã ghi sau khi tạo thành công.

Nếu chạy tự động không có terminal tương tác, vẫn có thể cung cấp `ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_PASSWORD` qua biến môi trường. Ví dụ nhập biến trong PowerShell:

```powershell
$env:ADMIN_EMAIL = Read-Host "Email Admin"
$env:ADMIN_NAME = Read-Host "Họ tên Admin"
$adminCredential = [System.Management.Automation.PSCredential]::new("admin", (Read-Host "Mật khẩu tạm (8–128 ký tự)" -AsSecureString))
try {
    $env:ADMIN_PASSWORD = $adminCredential.GetNetworkCredential().Password
    npm run create:admin
} finally {
    Remove-Item Env:ADMIN_PASSWORD -ErrorAction SilentlyContinue
    Remove-Item Env:ADMIN_EMAIL -ErrorAction SilentlyContinue
    Remove-Item Env:ADMIN_NAME -ErrorAction SilentlyContinue
    $adminCredential = $null
}
```

Lệnh từ chối email đã tồn tại, không ghi đè hoặc đổi quyền tài khoản. Không đưa mật khẩu vào đối số dòng lệnh, Git hoặc tài liệu. Admin đăng nhập bằng email vừa tạo và đổi mật khẩu trước khi dùng. CLI chạy trên máy local chỉ ghi database local đã chọn, không tạo Admin Railway; cần chạy tại đúng môi trường/database. Mặc định frontend dùng `npm run local`, cập nhật backend Railway riêng khi được yêu cầu; `npm run deploy` chỉ dành cho bản SQLite offline. Không tạo lại Admin mỗi lần cập nhật.

## Vào nhanh giáo viên và học sinh trên backend offline

Không áp dụng với mặc định frontend local5173/API Railway: backend production tắt vào nhanh. Đây là chức năng bản offline độc lập, không bật bỏ mật khẩu cho Railway.

Trang đăng nhập có hai lựa chọn **Giáo viên** và **Học sinh** khi bật `LOCAL_QUICK_LOGIN=1`. Mỗi nút đăng nhập ngay vào tài khoản đầu tiên của vai trò tương ứng theo thứ tự bản ghi trong database; tên hiển thị cũng đọc từ database. Không tạo tài khoản mới hoặc đổi mật khẩu. Nếu thiếu một vai trò, nút đó báo chưa có tài khoản và bị vô hiệu hóa. Phiên đăng nhập dùng cookie như đăng nhập thông thường; yêu cầu đổi mật khẩu tạm vẫn được giữ.

Bật bằng `npm run deploy -- -QuickLogin`; script lưu lựa chọn cho các lần deploy tiếp theo. Tắt bằng `npm run deploy -- -NoQuickLogin`. Tính năng chỉ cho phép kết nối loopback qua localhost/127.0.0.1/::1 và luôn tắt trong production. Không có vào nhanh Admin. Đây là truy cập không cần mật khẩu cho hai tài khoản được chọn trên máy local.

## Admin tạo tài khoản

Mặc định mở **[http://localhost:5173](http://localhost:5173)**, đăng nhập Admin bằng tài khoản có trên Railway; thao tác tạo sẽ ghi dữ liệu thật Railway. Bản offline cũ3002 và lỗi backend demo3001 là lịch sử; chỉ dùng `npm run deploy:status` khi đang kiểm tra bản offline được script quản lý. Nếu API chưa có chức năng, kiểm tra đúng backend/phiên bản trước khi tạo lại tài khoản.

1. Mở **Quản lý tài khoản → Tạo tài khoản**.
2. Chọn **Giáo viên** hoặc **Học sinh**, nhập họ tên, email và mật khẩu tạm.
3. Với học sinh, có thể chọn lớp đã có hoặc **Chưa xếp lớp**. Giáo viên mới tự tạo lớp sau khi đăng nhập.
4. Cung cấp email/mật khẩu riêng cho người nhận. Tất cả tài khoản được cấp qua giao diện phải đổi mật khẩu tạm ở lần đăng nhập đầu tiên.

Danh sách có tìm theo tên/email, lọc vai trò, số lớp học sinh tham gia và trạng thái đã kích hoạt/chờ đổi mật khẩu. Điện thoại hiển thị dạng thẻ; desktop dùng bảng. Mật khẩu không được trả về trong danh sách hoặc thông báo tạo thành công.

**Cấp lại mật khẩu** áp dụng cho giáo viên/học sinh. Mật khẩu mới là mật khẩu tạm, thu hồi tất cả phiên đăng nhập cũ và phiên học đang ghi nhận. Admin đổi mật khẩu của chính mình trong **Tài khoản**.

## Giáo viên tạo hoặc thêm học sinh

Khi tạo lớp, cùng giáo viên/tên lớp/môn/khối đã có sẽ báo trùng và hướng dẫn chọn lớp có sẵn; so sánh không phân biệt hoa/thường, khoảng trắng dư hoặc cách biểu diễn Unicode. Môn khác hoặc giáo viên khác được phép có lớp cùng tên. Các lớp đã có không bị tự gộp/xóa. Gửi lại sau khi lưu nhưng mất phản hồi cũng không tạo thêm lớp.

Ở **Lớp học của tôi → Thêm học sinh** (hoặc lối tắt tại Tổng quan):

- **Tạo tài khoản học sinh:** nhập họ tên, email, mật khẩu tạm. App tạo tài khoản và thêm ngay vào lớp đang chọn.
- **Tài khoản có sẵn:** nhập email của học sinh đã được Admin/giáo viên tạo. App thêm vào lớp, giữ nguyên mật khẩu, tiến độ và các lớp khác. Nếu email đã thuộc lớp, app báo rõ để tránh thêm trùng.

Giáo viên chỉ thêm học sinh vào lớp mình sở hữu, không tạo giáo viên/Admin hoặc xem danh sách tài khoản toàn trường. Cấp lại mật khẩu học sinh có lớp của giáo viên khác cần Admin hỗ trợ. Học sinh mới vào lớp không được thêm tự động vào nhóm đã chốt; quy tắc ở [hoạt động nhóm](group-activities.md).

## Dữ liệu cũ và kiểm thử

Database cũ tự cập nhật ràng buộc vai trò khi mở bản mới; giữ ID người dùng, mật khẩu, session, lớp, tiến độ và liên kết hoạt động nhóm. Kiểm thử migration dùng database riêng và kiểm tra khóa ngoại sau cập nhật. Sao lưu trước khi cập nhật bản chạy bằng script deploy hiện có.

Tài khoản `admin@greenedu.test` chỉ nằm trong database E2E riêng, không được tạo trong dữ liệu demo hoặc database chính. Chưa có tự đăng ký, nhập tài khoản hàng loạt hoặc xóa tài khoản. Đã chuẩn bị email xác nhận tài khoản mới theo vai trò, mặc định tắt; cần kết nối EmailJS/Gmail và triển khai backend Railway để dùng thật. Xem [welcome-email.md](welcome-email.md). Không gửi mật khẩu trong email hoặc gửi lại khi thêm tài khoản có sẵn vào lớp.
