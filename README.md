# GreenEdu

Web app tiếng Việt giúp học sinh luyện tập, sửa sai và nuôi cây kiến thức. Giáo viên quản lý lớp, chương, câu hỏi và theo dõi tiến độ. Đây là MVP có backend và cơ sở dữ liệu thực, chưa phải hệ thống thi chính thức.

## Chạy local trên Windows

Cài Git và Node.js **24 trở lên** (app sử dụng `node:sqlite`, không cần cài SQLite riêng). Nếu đã có repository trên máy, mở PowerShell trong thư mục `SangKienKn` và cập nhật:

```powershell
git pull origin main
```

Nếu chưa có repository, tải lần đầu bằng:

```powershell
git clone https://github.com/phuocthan/SangKienKn.git
cd SangKienKn
```

Trong thư mục repository, cài thư viện, build và chạy bản demo:

```powershell
npm ci
npm run build
npm run demo
```

Giữ cửa sổ PowerShell đang chạy và mở **http://localhost:3001** trên trình duyệt của cùng máy. Dừng bằng `Ctrl+C`. `npm run demo` đọc cấu hình demo từ `.env.example`; không cần tạo `.env` hay tài khoản hosting. Sau mỗi lần pull bản mới, chạy lại `npm ci` và `npm run build` trước khi khởi động.

Dữ liệu lưu tại `.local/greenedu.sqlite`, không bị mất khi tải lại trang hoặc khởi động lại server. Database này không được đưa lên Git.

### Lỗi `ERR_UNKNOWN_BUILTIN_MODULE: node:sqlite`

Node đang chạy chưa cung cấp module SQLite tích hợp mà app cần. Cài **Node.js 24** từ [trang tải chính thức](https://nodejs.org/en/download), đóng rồi mở lại PowerShell và kiểm tra:

```powershell
node -v
where.exe node
```

`node -v` phải hiện `v24.x.x` hoặc mới hơn. Nếu vẫn hiện bản cũ, `where.exe node` giúp tìm các bản Node trong PATH; cập nhật PATH hoặc chọn Node 24 trong trình quản lý phiên bản đang dùng. Nếu dùng nvm-windows, chạy `nvm install 24` rồi `nvm use 24`.

Sau khi đổi Node, chạy lại `npm ci`, `npm run build`, `npm run demo`. Không cần cài gói npm tên `sqlite` hay xóa database. Các lệnh phát triển, build, khởi động và kiểm thử sẽ kiểm tra Node trước khi chạy và báo phiên bản/đường dẫn Node nếu chưa phù hợp.

## Chạy để phát triển

Trên Windows PowerShell:

```powershell
$env:SEED_DEMO = "1"
npm run dev
```

Trên macOS/Linux:

```bash
npm ci
SEED_DEMO=1 npm run dev
```

Giao diện ở **http://localhost:5173**, API ở cổng **3001**. Vite chuyển các yêu cầu `/api` đến backend.

## Tài khoản dùng thử

Tài khoản mẫu, chỉ dùng cho dữ liệu thử:

| Vai trò   | Email                  | Mật khẩu mẫu |
| --------- | ---------------------- | ------------ |
| Giáo viên | giaovien@greenedu.demo | GreenEdu123! |
| Học sinh  | hocsinh@greenedu.demo  | GreenEdu123! |

Đăng nhập mẫu không tạo tiến độ giả. Lớp Vật lý 10A1 có 3 chương và 9 câu hỏi; học sinh bắt đầu từ 0 phút. Seed chỉ chạy khi bật `SEED_DEMO=1` và database chưa có người dùng, không ghi đè dữ liệu.

## Luồng dùng thử

1. Đăng nhập học sinh → Luyện tập → chọn chương.
2. Trả lời sai → kiểm tra lời giải → kết thúc phiên → mở Sổ tay sửa sai.
3. Làm lại đúng trong sổ tay → câu được đánh dấu đã khắc phục và rời danh sách cần sửa.
4. Đăng xuất → đăng nhập giáo viên → xem Tiến độ học tập của lớp.
5. Tạo lớp mới, thêm chương, thêm câu hỏi và tạo học sinh mới. Học sinh phải đổi mật khẩu tạm ở lần đăng nhập đầu tiên.

Các lượt luyện tập được tính riêng với lượt sửa sai; trả lời đúng ở phần luyện tập không tự xóa lỗi sai trong sổ tay.

## Kiểm tra và bản build

```bash
npm test
npm run build
SEED_DEMO=1 npm start
```

`npm start` phục vụ cả API và giao diện đã build ở cổng 3001. `npm test` kiểm thử HTTP với database độc lập, bao gồm phân quyền, làm sai/sửa sai, mật khẩu tạm, thời gian học, cấp cây, lưu trữ và xuất CSV.

Kiểm thử trình duyệt dùng Chromium đã cài sẵn:

```bash
npm run test:e2e
```

Bộ E2E tự tạo database tạm riêng và khởi động ứng dụng ở cổng 3101; không sửa dữ liệu dùng thử. Có thể đặt `CHROMIUM_PATH` nếu Chromium nằm ở đường dẫn khác.

## Tạo dữ liệu riêng

Không bật `SEED_DEMO`; chọn `DATABASE_PATH` mới. Tạo tài khoản giáo viên bằng:

```bash
npm run create:teacher
```

Lệnh đọc `TEACHER_EMAIL`, `TEACHER_NAME`, `TEACHER_PASSWORD` từ biến môi trường do người vận hành cung cấp. Không ghi mật khẩu vào Git, đối số lệnh hoặc tài liệu. Sau đó giáo viên đăng nhập và tạo lớp trong ứng dụng.

Biến cấu hình:

| Biến          | Mặc định               | Ý nghĩa                                                 |
| ------------- | ---------------------- | ------------------------------------------------------- |
| PORT          | 3001                   | Cổng backend                                            |
| DATABASE_PATH | .local/greenedu.sqlite | Vị trí database SQLite                                  |
| SEED_DEMO     | không bật              | `1` để tạo dữ liệu mẫu khi database rỗng                |
| NODE_ENV      | development            | `production` bật cookie Secure; không cho bật seed demo |

`.env.example` là tài liệu cấu hình; app không tự đọc `.env`. Có thể truyền biến qua môi trường hoặc dùng tùy chọn `--env-file` của Node/tsx.

## Quy tắc thời gian và cây

- Mỗi học sinh/chương có tiến độ riêng, giữ nguyên khi đổi chương.
- Cây cấp 1 mặc định; cấp 2/3/4/5 ở 1/2/3/4 giờ học có hoạt động.
- Trang luyện tập gửi heartbeat mỗi 15 giây; thời lượng dựa trên đồng hồ backend.
- Trang ẩn hoặc khoảng kết nối vượt 30 giây không được cộng thời gian.
- Không tương tác 120 giây: nhắc tiếp tục trong 10 giây; sau đó tạm dừng. Backend cũng giới hạn cửa sổ hoạt động 130 giây.
- Chỉ một phiên học hoạt động trên mỗi tài khoản; mở phiên mới làm phiên cũ hết hiệu lực.

Đây là ghi nhận hoạt động, không chứng minh sự tập trung và không chống được thao tác giả hoặc sử dụng thiết bị thứ hai. SQLite và giới hạn đăng nhập trong bộ nhớ phù hợp cho MVP chạy một instance.

## Phạm vi và bước tiếp theo

Đã có: đăng nhập session HttpOnly, mật khẩu scrypt, phân quyền theo lớp, tạo lớp/chương/câu hỏi/học sinh, phân câu hỏi theo tên bài, luyện tập theo bài hoặc chương, cấp lại mật khẩu, luyện tập trắc nghiệm 4 phương án, sổ tay, cây kiến thức, dashboard, CSV UTF-8 mở bằng Excel, giao diện responsive và font phục vụ nội bộ.

Đã bổ sung: Khu vườn của lớp hiển thị cây cấp 5 của các thành viên; Xếp hạng chăm chỉ dựa trên thời gian/cây và bảng Bác sĩ cây trồng theo số câu hiện đã khắc phục. Hai phần tính trong lớp đang chọn, không dùng điểm số, không tạo thành tích giả và không trả email qua API cộng đồng.

Ngân hàng câu hỏi đã có sửa bằng phiên bản mới, ẩn/hiện lại và lịch sử nội dung. Có nhập CSV UTF-8 theo mẫu, xem trước/kiểm tra lỗi và xác nhận trước khi lưu; gửi lại khi mạng lỗi không tạo câu trùng. Sổ tay và lượt làm cũ giữ nguyên đáp án cũ. Xem [hướng dẫn ngân hàng câu hỏi](docs/question-bank.md).

Chưa có: học kỳ, ma trận/trộn đề, vé kiểm tra, thi 20 phút/thi chính thức, Green Points, đổi thưởng, hoạt động nhóm, AI, tách đề từ Word/PDF, nhập `.xlsx`, quản lý nhiều lớp cho cùng một học sinh và xuất Excel `.xlsx`. Không xóa câu hỏi đã có lịch sử; dùng chức năng ẩn.

Trước khi dùng dữ liệu học sinh thật: triển khai HTTPS cùng nguồn, tắt và tách dữ liệu demo, sao lưu database, thiết lập quyền truy cập và chính sách dữ liệu, vận hành tài khoản giáo viên, và đánh giá tải. Thi chính thức cần đặc tả riêng về đề, lưu đáp án, mất mạng, điểm và quy trình xử lý sự cố.

Xem [tiến độ và lộ trình](docs/project-status.md) và [quy tắc MVP](docs/mvp.md) để tiếp tục phát triển. Làm việc trên checkout hiện tại; mỗi cloud task đã được cách ly, không cần tạo worktree.
