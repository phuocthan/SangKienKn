# Bàn giao GreenEdu

Cập nhật ngày 11/10/2026. Repository Windows ở `D:\SangKienKn`, nhánh `main`.

Thiết kế giao diện (màu, font, ảnh, bố cục, avatar, responsive và lịch sử) tra cứu tại [app-design.md](app-design.md).

## Hoàn tất cấp độ ôn thi và đổi đề mục — 11/10/2026, 10:39

Đã thực hiện [kế hoạch](learning-implementation-plan.md): học kỳ/ma trận ôn, phiên ôn giữ bộ câu/vị trí/kết quả và lựa chọn chưa gửi, vé mốc cây 3/4/5, điều kiện Săn điểm, thưởng cây/thi, phòng thi 20 phút, lịch thi chính thức, tự lưu/khôi phục/thu/chấm bài, công bố đáp án/câu sai và Excel. Người dùng đã chọn 70% tính mọi lượt luyện tập/sửa sai, tự nộp ở lần rời tab thứ 4; giáo viên cấu hình được. Hướng dẫn và giới hạn tại [learning.md](learning.md).

Các đề mục đã đổi sang “Trang” theo yêu cầu mới. Toàn bộ quy tắc/lịch sử thiết kế tập trung ở [app-design.md](app-design.md); ghi chú hình thức đã chuyển khỏi tài liệu tiến độ/bàn giao/avatar, giữ thông tin chức năng và vận hành. AGENTS đã lưu quy tắc tra cứu/cập nhật tài liệu này.

Kiểm thử cuối: 54/54 backend; 32 kịch bản E2E hồi quy cũ đạt trên desktop/mobile; 8/8 E2E ôn/thi đạt sau khi tách cửa sổ thi giữa các dự án. Luồng gồm ôn kỳ, vị trí/lựa chọn sau tải lại, sửa sai không mở đáp án khi sai, Săn điểm/duyệt thưởng, ma trận/lịch thi, autosave mất mạng/khôi phục, đóng bài, Excel, cảnh báo thứ 4. Vòng E2E toàn bộ ban đầu có hai ca ôn/thi mobile bị cửa sổ thi desktop còn mở đúng quy tắc khóa; đã sửa cleanup fixture và chạy lại đủ 8 ca đạt. Các kiểm thử dùng database riêng; file Excel tải thật mở/đọc đúng 8 cột bằng openpyxl. TypeScript và build đạt.

Đã tự deploy **http://localhost:3002**, PID 70704, demo:false, quickLogin:true. Backup trước deploy: .local/backups/database-20261011-103900-238.sqlite. Status/health/HTML/JS/CSS/ảnh hiện tại và các đề mục mới đạt. SQLite chỉ đọc xác nhận khóa ngoại hợp lệ và bảo toàn khóa của 47 bản ghi hiện có trong 25 bảng dữ liệu so với backup, không đối chiếu bảng session/study_sessions biến động. Không ghi dữ liệu thử vào database chính, không commit/push. Worker mỗi giây tự thu bài hết hạn; khi restart cũng thu các lượt đã quá hạn. Build thử dùng thư mục riêng .local/learning-build.

Chưa gồm chấm/thưởng/phản biện nhóm, đổi quà, AI, tự phân loại Word bất kỳ hoặc hosting/nghiệm thu tải. Những phần này nằm trong lộ trình chung và chưa tính vào báo cáo điểm.

## Railway — người dùng xác nhận deploy, 11/10/2026

Người dùng cung cấp ảnh dashboard Railway: project `zooming-light`, môi trường `production`, service `SangKienKn` hiển thị **Online**, có volume `sangkienkn-volume` gắn bên dưới. Sau đó cung cấp URL công khai **https://greenedu.up.railway.app/** và xác nhận đã deploy được. Agent kiểm tra HTTP chỉ đọc ngoài sandbox: trang chủ trả 200, HTML có tiêu đề GreenEdu và tham chiếu JS/CSS; `/api/health` trả 200 với `{ok:true,demo:false}`. Web tool không truy cập được và DNS trong sandbox bị chặn; kiểm tra PowerShell ngoài sandbox thành công. Chưa kiểm tra trình duyệt/đăng nhập, Mount Path/biến DATABASE_PATH, commit đã triển khai, tài khoản Admin hoặc việc giữ dữ liệu sau restart. Các mô tả chưa có hosting công khai bên dưới là bối cảnh trước bước này.

Tiếp tục hướng dẫn người mới: xác nhận volume `/data` và `DATABASE_PATH=/data/greenedu.sqlite`; nếu chưa có Admin, tạo trong container Railway có volume bằng `npm run create:admin`, qua SSH (dashboard → Copy SSH Command). Sau đó kiểm tra đăng nhập/đổi mật khẩu, nghiệp vụ và giữ dữ liệu qua restart. Hướng dẫn trước dùng database mới; không tự chuyển database local. Không chạy deploy local, commit/push hoặc thay dữ liệu trong yêu cầu ghi nhận này.

## Deploy ảnh nền — 11/10/2026, 10:32

Đã deploy local. Thiết kế và lịch sử đầy đủ ở [app-design.md](app-design.md). Backup `.local/backups/database-20261011-103225-851.sqlite`.

## Đăng nhập bằng tên rút gọn — 11/10/2026, 10:19

Trang đăng nhập tự thêm `@greenedu.demo` khi giá trị nhập chưa có `@`, bỏ khoảng trắng đầu/cuối và giữ email đầy đủ với mọi tên miền. Ví dụ `hocsinh` → `hocsinh@greenedu.demo`; vẫn xác thực mật khẩu và luồng đổi mật khẩu tạm. Ô nhập dùng text/inputMode email để trình duyệt cho phép tên rút gọn, có hướng dẫn ngay dưới ô. Không đổi email đã lưu hoặc API xác thực.

Build riêng `.local/login-email-build` và 8/8 E2E desktop/mobile đạt; chạy lại 8/8 trên build cuối cùng bằng database riêng đạt. Checkout có phần learning đang được bổ sung song song: đã sửa kiểu `fail: never` và chuyển ID SQLite thành string để build đạt. Lần deploy đầu lúc 10:18 chưa khởi động do database cũ thiếu `exam_runs.revision/released`; bổ sung migration thêm hai cột mặc định 0, giữ bản ghi cũ và chạy lặp an toàn. Kiểm thử migration riêng 1/1 đạt.

Đã tự deploy thành công lúc 10:19 tại **http://localhost:3002**, PID 94044 khi kiểm tra, `demo:false`, `quickLogin:true`. Backup `.local/backups/database-20261011-101908-496.sqlite`; backup trước lần lỗi `.local/backups/database-20261011-101814-972.sqlite` vẫn giữ. Status/health đạt, HTML/JS/ảnh khớp build, kiểm tra khóa ngoại và ID/số bản ghi của 25 bảng dữ liệu so với backup đạt (không đối chiếu bảng phiên biến động). Không ghi dữ liệu thử vào database chính, không commit/push.

## Deploy thiết kế — 11/10/2026, 10:13

Đã deploy local; chi tiết và lịch sử thiết kế chuyển sang [app-design.md](app-design.md). Backup `.local/backups/database-20261011-101333-212.sqlite`.

## Giới hạn avatar 3 MB — 11/10/2026, 10:12

Đã nâng giới hạn tải avatar từ 2 MB lên **3 MB (3 × 1024 × 1024 byte)** ở hằng số dùng chung, giao diện và API; giữ định dạng JPG/PNG/WebP và kích thước tối đa 4096 × 4096 pixel. Build riêng `.local/avatar-size-build` đạt, 2/2 kiểm thử upload API và 4/4 E2E desktop/mobile đạt bằng database riêng. API nhận đúng 3 MB, từ chối vượt 1 byte; trình duyệt tải/lưu PNG hợp lệ 2,5 MB.

Đã tự chạy `npm run deploy` theo quyền thường trực, bản 3 MB chạy tại **http://localhost:3002** lúc 10:12, `demo:false`, `quickLogin:true`. Backup trước triển khai `.local/backups/database-20261011-101228-613.sqlite`. Kiểm tra chỉ đọc xác nhận frontend/JavaScript/3 ảnh atlas khớp build, health đạt, khóa ngoại hợp lệ và ID/số bản ghi của 17 bảng dữ liệu được bảo toàn so với backup (không đối chiếu bảng phiên biến động). Không ghi dữ liệu thử vào database chính. Giới hạn 2 MB trong các mục cũ bên dưới là lịch sử.

## Tự deploy khi hoàn tất và bản mới đang chạy — 11/10/2026, 10:05

Người dùng đã cho phép thường trực: sau mỗi yêu cầu thay đổi ứng dụng hoàn thành và kiểm thử phù hợp đạt, agent tự chạy `npm run deploy`, không hỏi lại. Gộp các bước sửa/kiểm thử của cùng yêu cầu thành một lần deploy ở cuối. Yêu cầu mới như “chưa deploy”, “chỉ sửa/kiểm tra” hoặc “dừng server” được ưu tiên. Đã cập nhật `AGENTS.md` và `docs/deploy-local.md`; quy tắc này thay cho ghi chú trước đây về chỉ deploy khi được yêu cầu riêng.

Đã deploy ngay các thay đổi đang chờ: tải avatar cá nhân và học sinh không chọn avatar giáo viên. Bản chạy **http://localhost:3002**, PID khi kiểm tra 90608, `demo:false`, `quickLogin:true`; giữ database/cổng/cấu hình. Backup `.local/backups/database-20261011-100541-810.sqlite`. TypeScript/Vite build và health đạt; frontend/JavaScript/3 ảnh khớp build, migration ảnh upload và giới hạn avatar đã có. Đối chiếu SQLite chỉ đọc bảo toàn ID/số bản ghi của 16 bảng dữ liệu, kiểm tra khóa ngoại đạt; loại các bảng phiên biến động và lựa chọn avatar giáo viên của học sinh được reset theo quy tắc mới. Không ghi dữ liệu thử. 45 backend tests/4 E2E của thay đổi đã đạt trước deploy. Các ghi chú “chưa deploy upload/quy tắc” bên dưới là lịch sử trước bản này.

## Rà soát cấp độ ôn tập và kiểm tra — 11/10/2026

Đã đọc lại file Word “ĐỀ ÁN HOÀN THIỆN TÍNH NĂNG app greenedu (1).docx” và đối chiếu mã hiện tại theo yêu cầu phân tích. Chi tiết tại `docs/levels-review-assessment.md`: cây 5 cấp đúng mốc 0/1/2/3/4 giờ; ôn chương chưa trộn ma trận, ôn kỳ chưa có, tỷ lệ báo cáo chưa tính sửa sai, sổ tay đang mở đáp án sau một lượt sai. Vé/phòng thi 20 phút/Săn điểm/Thi chính thức/thưởng/báo cáo thi chưa có. Đề án còn cần chốt ngưỡng chuyển tab, công thức 70%, phạm vi sổ tay sạch, cấp/dùng vé, đồng bộ/trộn đề và cộng dồn thưởng. Các đề xuất trong bản rà soát chưa phải quy tắc đã được người dùng chấp thuận. Chạy lại 4 kiểm thử liên quan đạt, database riêng. Không sửa nghiệp vụ hoặc deploy trong yêu cầu phân tích này.

## Học sinh không chọn avatar giáo viên — 11/10/2026

Đã giới hạn theo yêu cầu: học sinh chỉ thấy 8 avatar học sinh + 16 thiên nhiên, vẫn tải ảnh cá nhân; giáo viên giữ cả 40. Danh sách nhóm vai trò dùng chung ở `shared/avatars.ts`. API từ chối 403 khi học sinh chọn bất kỳ ID avatar giáo viên, không tin vai trò gửi trong body. Khi mở database bằng mã mới, lựa chọn giáo viên cũ của học sinh trở về chữ viết tắt; giữ các lựa chọn hợp lệ, ảnh upload và tiến độ. Chưa deploy quy tắc này hoặc phần upload.

Build vào `.local/avatar-role-build` đạt; 45 backend tests và 4/4 E2E avatar desktop/mobile đạt bằng database riêng, gồm chặn API, ẩn bộ giáo viên, migration giữ tiến độ và các luồng upload/thiên nhiên. Không thay `dist`, không ghi database chính hoặc restart server. Backend hỗ trợ `STATIC_DIR` cho thư mục build riêng; mặc định vẫn `dist`. Playwright dùng `E2E_DIST_DIR` để truyền thư mục này cho server thử, ví dụ `$env:E2E_DIST_DIR='.local/avatar-role-build'; npm run test:e2e -- e2e/avatars.spec.ts`. SPA fallback hỗ trợ build trong `.local`.

## Tải avatar cá nhân — 11/10/2026

Đã thêm tải ảnh JPG/PNG/WebP tối đa 2 MB/4096 × 4096 px cho học sinh/giáo viên trong Tài khoản. Có xem trước, hủy file, lưu, thay ảnh, chọn lại ảnh đã tải và quay về bộ 40 avatar/chữ viết tắt. Migration thêm bảng `avatar_uploads`, mỗi tài khoản một ảnh; lưu BLOB cùng database nên backup bao gồm ảnh. API upload chỉ cập nhật người đăng nhập, kiểm tra ảnh/file/CSRF; ảnh được phục vụ qua API có phân quyền tài khoản/Admin/lớp chung. Xem `docs/user-avatars.md`.

Build đạt, 44 backend tests và 4/4 E2E avatar desktop/mobile đạt bằng database riêng; đã xem ảnh UI `.local/ui-*-avatar-upload-*.png`. Chưa deploy tính năng upload. Server **http://localhost:3002** (PID khi deploy 91664) vẫn là backend bản 40 avatar; đã khôi phục `dist/index.html` và các assets của bản đó từ `.local/previous-dist-20261011-095328-747` sau khi build kiểm thử. Không restart server/ghi dữ liệu thử vào database chính. Lần kiểm tra sau khôi phục: frontend/3 ảnh/health/API xác thực và dữ liệu có sẵn đều đạt. Lần tiếp theo người dùng yêu cầu deploy chạy `npm run deploy` để đưa upload vào bản chạy. Khi server đang chạy, các build kiểm thử tiếp theo nên dùng `vite build --outDir .local/<thư-mục-build-thử>` để tránh thay frontend đang được phục vụ trước khi backend cập nhật.

## Deploy bộ 40 avatar — 11/10/2026

Đã chạy `npm run deploy` theo yêu cầu, bản local đang chạy tại **http://localhost:3002**, PID khi kiểm tra 91664, `demo:false`. Backup trước triển khai: `.local/backups/database-20261011-095328-747.sqlite`. Build/health đạt, frontend khớp build mới, cả 3 ảnh avatar được phục vụ đúng, API avatar chặn chưa đăng nhập. Kiểm tra SQLite chỉ đọc xác nhận ID dữ liệu có sẵn của 18 bảng và khóa ngoại được giữ; bảng avatar đã có hoạt động mới sau khi server chạy. Không ghi dữ liệu thử vào database chính. Các ghi chú “chưa deploy”/“stopped” bên dưới là lịch sử trước đợt này. Đang tiếp tục yêu cầu cho phép tải avatar cá nhân.

## Hai tài khoản vào nhanh và deploy — 11/10/2026, 09:52

Theo yêu cầu người dùng, trang đăng nhập thêm hai nút Giáo viên/Học sinh, hiển thị tên lấy từ database và đăng nhập ngay bằng phiên/cookie thật. Chọn bản ghi đầu tiên (`ORDER BY rowid`) của từng vai trò; hiện là Nguyễn Minh Anh và Trần Hà Linh. Không lấy/đổi mật khẩu hoặc tạo tài khoản mới. Nếu thiếu vai trò, nút bị vô hiệu hóa. Luồng đổi mật khẩu tạm vẫn được áp dụng, không cho vào nhanh Admin.

API `/api/auth/quick-login` chỉ bật qua `LOCAL_QUICK_LOGIN=1`, chỉ cho IP kết nối và hostname loopback, luôn tắt trong production, giữ kiểm tra JSON/cross-origin. Health cung cấp tên/vai trò cho hai lựa chọn khi được phép. Script deploy có `-QuickLogin`/`-NoQuickLogin`, lưu lựa chọn và giữ lại qua deploy tiếp theo.

Đã deploy theo yêu cầu bằng `npm run deploy -- -QuickLogin`: **http://localhost:3002**, PID 93264 tại thời điểm kiểm tra; `demo:false`, `quickLogin:true`. Backup `.local/backups/database-20261011-095200-788.sqlite`. Kiểm tra read-only đối chiếu 17 bảng với backup đạt, khóa ngoại hợp lệ, hai tên mặc định đúng database. Kiểm tra qua 3 IP mạng của máy đều không bật đăng nhập nhanh. Ảnh đăng nhập bản đang chạy tại `.local/quick-login-deployed.png`.

Build đạt; 42/42 API đạt, 6/6 E2E desktop/mobile cho tài khoản, giao diện và vào nhanh đạt bằng database riêng. Bản deploy gồm các thay đổi giao diện/ảnh/avatar đang có trong checkout. Không tạo dữ liệu thử trong database chính, không dừng server ngoài script, không commit/push. Tab in-app của người dùng đang đăng nhập Admin nên giữ phiên đó; muốn thấy hai nút cần tải lại trang và đăng xuất.

Lưu ý trạng thái cũ bên dưới: sandbox có thể không nhìn thấy PID và trả “stopped”; kiểm tra ngoài sandbox xác nhận server thực tế chạy. Luôn kiểm tra health và chạy `deploy:status` với quyền đủ đọc tiến trình trước khi kết luận trạng thái.

## Lưu lựa chọn avatar — 11/10/2026

API chỉ cập nhật avatar người đăng nhập, kiểm tra danh mục và giữ lựa chọn sau khởi động lại. Migration thêm `user_avatars`, không đổi dữ liệu học tập. Hướng dẫn chức năng ở [user-avatars.md](user-avatars.md); toàn bộ hình ảnh, bộ sưu tập, cách trình bày và lịch sử ở [app-design.md](app-design.md).

## Lỗi chức năng Admin khi mở server cũ — 11/10/2026

Kiểm tra hai server: cổng 3001 là demo (PID 78236, khởi động 22:57 ngày 10/10), trước khi `server/app.ts` được bổ sung API Admin lúc 23:44; cổng 3002 là bản do deploy quản lý (PID 90712, khởi động 23:55), health đạt, `demo:false`. Cả hai đọc giao diện `dist` mới, nên bản cũ có thể hiển thị Admin rồi trả 404 “Không tìm thấy chức năng.” cho API tài khoản. Địa chỉ sử dụng là **http://localhost:3002**. Không dừng server ngoài script hoặc redeploy trong lần chẩn đoán này.

Đã chạy lại luồng E2E Admin tạo giáo viên/học sinh → giáo viên tạo/thêm học sinh: 2/2 desktop/mobile đạt, database thử riêng. Kiểm tra read-only database chính hiện có 1 Admin, 1 giáo viên và 3 học sinh; khóa ngoại hợp lệ. Các ghi chú “chưa có Admin” bên dưới là trạng thái trước khi người vận hành tạo tài khoản. README/hướng dẫn deploy/tài khoản đã làm rõ địa chỉ để tránh nhầm cổng. Tab in-app cổng 3002 hiện ở trang đăng nhập; chưa xác nhận địa chỉ tab ngoài ứng dụng trong ảnh lỗi của người dùng.

## Tạo Admin trực tiếp trong terminal — 11/10/2026

Người dùng chạy `npm run create:admin` nhưng chưa có biến môi trường. Đã sửa CLI để hỏi email, họ tên, mật khẩu tạm và xác nhận khi chạy trực tiếp trong terminal; mật khẩu che bằng `*`, kiểm tra lại nhập sai. Vẫn hỗ trợ biến môi trường cho chạy tự động. Hướng dẫn ở `docs/account-management.md` đã cập nhật. Không cần redeploy để dùng CLI mới. Đã thử tương tác trên Windows bằng database riêng `.local/admin-interactive-check.sqlite`, kiểm tra che mật khẩu/dán Unicode/backspace/Ctrl+C và bootstrap tự động. Không tạo Admin thử trong database chính.

## Trạng thái triển khai hiện tại

Đã deploy theo yêu cầu người dùng lúc 23:55 ngày 10/10/2026: **http://localhost:3002**, server chạy ẩn do script quản lý (PID tại thời điểm kiểm tra: 90712). Cổng 3001 đang có server chạy ngoài script nên không dừng; dùng cổng 3002. Lần `npm run deploy` tiếp theo giữ cổng/database này từ `.local/deploy-state.json`.

Health `{ok:true,demo:false}`; frontend khớp build mới, ảnh nền tải được, API yêu cầu đăng nhập. Database `D:\SangKienKn\.local\greenedu.sqlite`; backup trước deploy tại `.local/backups/database-20261010-235542-851.sqlite`. Đã đối chiếu read-only các bảng tài khoản/lớp/thành viên/câu hỏi/lượt làm/tiến độ/nhóm/bài nộp với backup: số bản ghi giữ nguyên, migration vai trò Admin đã chạy và kiểm tra khóa ngoại đạt. Không seed demo mới hoặc ghi dữ liệu kiểm thử vào database chính. Chưa có Admin trong database chính; tạo theo thông tin người vận hành qua `npm run create:admin` và `docs/account-management.md`.

Các đoạn “chưa deploy” bên dưới mô tả trạng thái trước lần triển khai này, không phải trạng thái hiện tại. Luôn dùng `npm run deploy:status` để xác nhận khi tiếp tục.

## Bối cảnh đã tiếp nhận

MVP đã có luyện tập, sổ tay sửa sai, cây, báo cáo, cộng đồng lớp, nhập câu hỏi Word/CSV và hoạt động nhóm. Xem `project-status.md` cho phần còn thiếu; không cần phân tích lại toàn bộ app.

## Triển khai theo yêu cầu

Người dùng muốn một lệnh để tự chạy hoặc yêu cầu agent chạy trong chat. Đã có `scripts/deploy.ps1` và các lệnh `npm run deploy`, `deploy:build`, `deploy:status`, `deploy:stop`. Mặc định chạy local Windows, không bật demo mới và không tự pull. Chưa cấu hình đích hosting công khai. Xem `deploy-local.md`.

Người dùng đã xác nhận lựa chọn chạy/cập nhật trên máy Windows hiện tại. Việc tạo script chưa phải yêu cầu chạy bản chính ngay. Đã kiểm thử bằng database riêng `.local/deploy-test.sqlite` và cổng 3102; server thử đã dừng, file trạng thái thử đã xóa. Redeploy giữ dữ liệu/cấu hình, backup WAL, xử lý lỗi backup/cổng bận và status/stop đều đạt. Khi người dùng tiếp theo yêu cầu deploy, chạy lệnh đã ghi trong `AGENTS.md` và báo URL, health check, trạng thái thực tế.

Phát hiện một tiến trình chạy ngoài script (`node --env-file=.env.example --import tsx server/index.ts`) giữ file esbuild. Không dừng tiến trình đó. Đã sửa cài dependencies bằng staging riêng để không xóa executable Windows đang sử dụng; thư viện hiện khớp lockfile. Luôn kiểm tra cổng và trạng thái thật khi triển khai bản chính; không coi trạng thái demo trong tài liệu cũ là bằng chứng server đang dừng.

## Git

Không tự commit/push. Các ảnh và prompt đã có trong staging trước đợt sửa giao diện; giữ nguyên staging của người dùng. Thay đổi ảnh nền và script/tài liệu hiện tại chưa commit. Kiểm tra `git status` khi tiếp tục.

## Tài khoản — đợt tiếp theo 10/10/2026

- Đã thêm vai trò `admin` thật ở database/API. Admin có màn hình quản lý tài khoản: tìm/lọc, tạo giáo viên/học sinh, chọn lớp cho học sinh, trạng thái đổi mật khẩu, cấp lại mật khẩu. API chặn giáo viên/học sinh quản trị toàn trường. Không tự đổi vai trò các tài khoản cũ.
- Có `npm run create:admin` để cấp Admin đầu tiên qua biến môi trường; xem `docs/account-management.md`. Chưa tạo Admin trong database chính vì chưa có thông tin tài khoản người vận hành. Chỉ fixture E2E có Admin thử nghiệm.
- Giáo viên vẫn tạo học sinh trong `Thêm học sinh`, thêm lựa chọn `Tài khoản có sẵn` bằng email. Thêm vào lớp của mình, không ghi đè mật khẩu/tiến độ; hỗ trợ cùng học sinh tham gia nhiều lớp. Admin hỗ trợ reset tài khoản được nhiều giáo viên quản lý.
- `npm test`: 36 kiểm thử đạt, gồm bootstrap Admin, phân quyền, cấp/reset tài khoản, thêm học sinh có sẵn và migration giữ khóa ngoại/session/tiến độ/nhóm. Sửa thứ tự cleanup test SQLite trên Windows. Build TypeScript/Vite đạt. Có 18 kịch bản E2E desktop/mobile; các luồng cũ đã đạt, phần tài khoản được kiểm tra lại riêng sau chỉnh responsive/selector.
- Playwright chạy được Windows/macOS/Linux, chọn Chrome Windows nếu có hoặc Chromium cài bởi Playwright; server E2E dùng `.local/e2e-*.sqlite` riêng. Ảnh rà soát lưu trong `.local/ui-*.png` (không đưa Git).
- Chưa deploy hoặc tạo dữ liệu ở database chính, không commit/push. Khi người dùng yêu cầu deploy, dùng script đã có rồi tạo Admin theo thông tin họ cung cấp nếu cần.
