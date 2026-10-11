# Bàn giao session GreenEdu

## Deploy Railway thiết kế khu vườn — 11/10/2026

Theo yêu cầu “deploy” sau khi áp dụng ảnh đã duyệt, đã triển khai **https://greenedu.up.railway.app/** bằng Railway CLI từ snapshot mã local, không commit/push GitHub. Đúng project `zooming-light` (`e45def16-099d-454b-a64c-27adf4172a97`), service `SangKienKn` (`d0abfac3-f946-4b3e-8623-a87636bcedc0`), environment `production` (`a515d737-f7a4-4b62-b49a-13a2408e9928`). Deployment **`f313de7d-3787-4dd4-88a7-ca0616abed83` SUCCESS**. CLI đã liên kết checkout với service này. Gói `.local/railway-release-20261011-170511` chứa mã/runtime và ảnh public, không chứa database/.env/log/prototype; manifest/hash tại `.local/railway-release-manifest.json`. Triển khai cả mã hiện tại đã kiểm thử, gồm thiết kế và thay đổi cấp học sinh/chặn lớp trùng có sẵn trên checkout.

Đã xác minh Node production 24.21.0, volume `/data` READY, `DATABASE_PATH=/data/greenedu.sqlite`, `NODE_ENV=production`, `SEED_DEMO=0`, `LOCAL_QUICK_LOGIN=0`; giữ nguyên cấu hình. Backup trước deploy **`/data/backups/pre-garden-2026-10-11T10-04-51.829Z.sqlite`** (2.793.472 byte) trên volume. Sau restart: so sánh đầy đủ nội dung bản ghi ở **25 bảng, 8 bản ghi** với backup không đổi, bao gồm blob avatar/file trong SQLite; bỏ qua sessions/study_sessions có thể biến động. `quick_check=ok`, không vi phạm khóa ngoại. Không chuyển/xóa/reset dữ liệu local hoặc Railway.

Kiểm tra mới đợt deploy: **67/67 backend** bằng database riêng, TypeScript và build riêng `.local/railway-check-build` đạt. Build Railway đạt; HTML trỏ đúng CSS/JS mới và byte của hai asset khớp build local. Health `ok:true/demo:false/quickLogin:false`, phiên chưa đăng nhập 401. Chromium kiểm tra đăng nhập **1440/390 px**: giao diện mới `--green:#315d3e`, khung 26 px, không tràn ngang/lỗi JS; không đăng nhập/ghi dữ liệu thử Railway. Ảnh `.local/ui-railway-garden/`, kết quả `.local/railway-garden-verification.json`, dữ liệu kiểm tra `.local/railway-db-before.json` và `.local/railway-data-after.json`; script `.local/verify-garden-railway.mjs`. Các **40 E2E** và rà soát 4 kích thước ở đoạn áp dụng bên dưới là lượt trước, không chạy lại trong đợt deploy này.

Frontend local 5173/API Railway vẫn là mặc định; prototype 5180 vẫn riêng. Git vẫn có thay đổi chưa commit. **GitHub main chưa có bản thiết kế mới**: lần deploy/redeploy lấy source GitHub cũ sẽ không có thay đổi này; cần đồng bộ mã khi người dùng yêu cầu. Các đoạn “chưa deploy Railway” phía dưới là lịch sử trước đợt này.

## Áp dụng thiết kế khu vườn đã duyệt vào app — 11/10/2026

Người dùng đã duyệt ảnh ImageGen và yêu cầu “áp dụng nó luôn”. Đã đưa thiết kế vào app thật: `src/garden.css` nạp cuối, nền kem/xanh rừng, sidebar bo mềm, nút/khung/bảng/form/modal/đăng nhập đồng bộ cho ba vai trò. Trang chủ học sinh trong `src/App.tsx` có hero + mục tiêu, ba thống kê, chương gọn, hành trình và sổ tay phía dưới; `src/GardenGoal.tsx` dùng thời gian lớp/môn thực để hiển thị mục tiêu lên cấp kế tiếp và cây ra hoa. Không đưa số mẫu 10/15 phút theo ngày hoặc dữ liệu minh họa vào app. Giữ logo, ảnh trường v11, ảnh cây/sách và mọi luồng/chọn bài hiện có; không thay backend/schema/dữ liệu hoặc thay đổi nghiệp vụ cấp cây.

Kiểm tra lượt này: TypeScript và build riêng `.local/warm-garden-build` đạt; **40/40 E2E** desktop/mobile (đăng nhập, cấp học sinh, tài khoản, nhóm, ôn/thi, workflow) đạt bằng database kiểm thử riêng. Rà soát ảnh/bố cục/nội dung tối thiểu 13 px ở **1440/768/390/360 px** đạt, không tràn ngang/lỗi JS. Ảnh tại `.local/ui-warm-garden`, script `.local/warm-garden-review.mjs`; đã xem trang chủ học sinh, giáo viên, đăng nhập, ngân hàng câu hỏi và modal mobile. `e2e/quick-login.spec.ts` cập nhật lời chào mới.

Frontend thật **http://localhost:5173** đang chạy Vite/HMR PID **87756**, API/database Railway theo mặc định hiện tại. Kiểm tra thật chỉ đọc: health khớp Railway, quickLogin:false, phiên chưa đăng nhập 401, đăng nhập hiển thị không lỗi JS, không ghi dữ liệu Railway. Không restart database/backend, không thay `dist`, không commit/push/deploy Railway. Prototype **5180 vẫn là bản minh họa cũ**, không phải app thật; các đoạn “chờ duyệt/chưa áp dụng” bên dưới là lịch sử trước yêu cầu mới. Thiết kế hiện tại tra cứu [app-design.md](app-design.md).

## Ảnh preview khu vườn để chỉnh tiếp — 11/10/2026

Theo yêu cầu mới, đã tạo một mockup desktop bằng ImageGen tích hợp, dùng ảnh `.local/ui-garden-preview/student-home-1440.png` làm tham chiếu. Thiết kế nền kem/xanh rừng, hero cây mọc từ sách, nút và khung đồng bộ, thẻ chương gọn và hành trình cây bên dưới. Đã xem ảnh kết quả để kiểm tra bố cục và chữ; đây là ảnh minh họa để duyệt, không phải giao diện đã triển khai. Ảnh giữ ở `C:/Users/thant/.codex/generated_images/01a128d2-3449-7e63-93dd-f548a9a1e26a/exec-0cadadf8-cb3b-457d-acb5-b26e644ae709.png`, đã hiển thị cho người dùng. Chưa sửa app hoặc bản preview tương tác 5180, chưa deploy/push. Tiếp theo nhận yêu cầu chỉnh ảnh hoặc phê duyệt trước khi áp dụng. Không chạy kiểm thử mã vì đợt này chỉ tạo ảnh và cập nhật bàn giao.

## Preview thiết kế khu vườn để duyệt — 11/10/2026, 16:42

Yêu cầu mới: thiết kế lại sâu hơn gồm button/frame/bố cục, tạo preview để duyệt và sửa **trước khi update**. Người dùng đã đính chính hướng ban đầu thành **khu vườn ấm áp, gần gũi**; đây là hướng hiện tại. Bản tương tác riêng ở **http://localhost:5180**, nguồn [design-preview](../design-preview/README.md), lệnh `npm run preview:design`. Không đưa thiết kế vào `src`, không thay `dist`, không deploy/push; giữ app hiện tại và mặc định frontend local/API Railway.

Preview có Học sinh/Giáo viên/Quản trị/Đăng nhập và các trang tổng quan/luyện tập/sửa sai/ôn thi/lớp/câu hỏi/tiến độ/nhóm, modal minh họa. Nền kem, xanh dịu/vàng đất, sidebar nổi bo mềm, thẻ nhẹ, nút đồng bộ, cây SVG và ảnh/logo hiện có. Thanh preview đổi role, desktop/mobile, palette Vườn xanh/Vườn nắng, bo góc, thoáng/gọn, nền trường; lưu lựa chọn/góp ý thành JSON. Chỉ dữ liệu minh họa trong bộ nhớ, không gọi API/database thật.

Build preview đạt; **68 màn hình/trạng thái** ở 1440/768/390/360 px đạt, không tràn ngang/lỗi JS; thao tác mẫu/tùy chỉnh/lưu JSON đạt, request không gọi API/dịch vụ ngoài. Ảnh `.local/ui-garden-preview/`, script `.local/review-garden-preview.mjs`. Tiếp theo: nhận phản hồi/duyệt, chỉnh riêng preview, chỉ áp dụng lên app khi được yêu cầu. Lựa chọn lưu ở preview không tự được coi là duyệt.

## Mặc định frontend local, API/database Railway — 11/10/2026

Người dùng yêu cầu từ giờ run local để test nhanh nhưng server/database trực tiếp từ Railway, đồng thời lưu quy tắc vào Markdown. Đã cập nhật `AGENTS.md`, [dev-railway.md](dev-railway.md), README và hướng dẫn deploy cũ. **Không tự deploy local sau mỗi thay đổi nữa.** Dùng `npm run local` (nền) hoặc `npm run dev` (terminal), frontend Vite/HMR tại **http://localhost:5173**, proxy `/api` tới **https://greenedu.up.railway.app**. Backend local được giữ riêng qua `npm run dev:offline` và bộ E2E vẫn dùng database riêng.

Frontend đang chạy PID **87756**; quản lý bằng `npm run local -- -Action Status/Stop`. Đã kiểm tra start/dùng lại/stop/start. Đã dừng API local được script deploy quản lý ở 3002; giữ nguyên `.local/greenedu.sqlite` và các backup. Cổng 3001 nếu còn server cũ ngoài script không bị can thiệp; frontend mới không dùng cổng đó. Các trạng thái deploy local bên dưới là lịch sử.

Proxy loopback kiểm tra Origin/cross-site trước khi đổi Host/Origin upstream; giữ HttpOnly/SameSite, bỏ Secure/Domain cookie trên HTTP local, TLS tới Railway vẫn xác minh. Không mở CORS hay sửa server Railway. Chế độ này đăng nhập bằng tài khoản/mật khẩu Railway, quickLogin:false; thao tác người dùng sẽ ghi dữ liệu thật Railway. Không seed hoặc chạy test tạo dữ liệu trên Railway. Sửa backend ở checkout chưa có hiệu lực cho frontend này trước khi triển khai Railway; không tự push/deploy.

TypeScript và build riêng đạt; **4/4 kiểm thử proxy** (`server/dev-proxy.test.ts`) đạt: phiên đăng nhập/cookie/logout trong Chromium, JSON/multipart và chặn Origin lạ/cross-site bằng upstream thử độc lập. Kiểm tra thật chỉ đọc: health local khớp Railway, ok:true/demo:false/quickLogin:false; `/api/auth/me` chưa đăng nhập trả 401; giao diện dùng Vite client, có form đăng nhập, 0 lỗi JS. Không đăng nhập thật/ghi dữ liệu/triển khai Railway; chưa xác minh cấu hình volume/database Railway hoặc dữ liệu sau restart. Ảnh `.local/railway-local-login.png`, script kiểm tra `.local/verify-railway-frontend.mjs`.

## Đổi bộ cấp học sinh theo yêu cầu — 11/10/2026, 11:47

Tên và icon hiện tại: **Mầm → Chồi → Cây Non → Đơm Hoa → Kết Trái**. Ba icon cuối lần lượt là cây nhỏ, cây có hoa, cây có quả. Giữ cách tính tổng thời gian riêng từng lớp/môn và ngưỡng 0/1/2/3/4 giờ; không thay tiến độ học sinh. Các tên Lá/Cây/Đại thụ ở những đoạn cũ bên dưới là lịch sử. Quy tắc ở [student-levels.md](student-levels.md), thiết kế ở [app-design.md](app-design.md).

TypeScript, build, **26/26 backend** (`student-levels.test.ts`, `app.test.ts`) và **4/4 E2E** icon desktop/mobile đạt với database riêng. Đã xem ảnh đủ năm icon/cấp trên hai kích thước; báo cáo `.local/student-stages-renamed-browser-results.json`, ảnh `.local/student-level-icons-preview-desktop.png` và `-mobile.png`.

Đã tự deploy local **http://localhost:3002**, PID **92676**, demo:false, quickLogin:true. Backup `.local/backups/database-20261011-114736-419.sqlite`. Health và tài nguyên giao diện đạt, HTML/assets khớp build đã kiểm thử; SQLite chỉ đọc xác nhận khóa ngoại hợp lệ và bảo toàn khóa 47 bản ghi trong 25 bảng. Không triển khai Railway. Đây là trạng thái local mới nhất; các deploy phía dưới là lịch sử.

## Deploy bố cục chữ theo yêu cầu — 11/10/2026, 11:40

Người dùng yêu cầu “deploy”; đã chạy `npm run deploy` trên checkout hiện tại, triển khai local **http://localhost:3002**, PID 96680, `demo:false`, `quickLogin:true`. TypeScript/build và `/api/health` đạt; `npm run deploy:status` xác nhận running. HTML/CSS được phục vụ khớp `dist`, có token cỡ chữ mới và bố cục lời nhắc mobile; ảnh nền v11 trả 200. Kiểm tra SQLite chỉ đọc: khóa ngoại hợp lệ. Script đã backup `.local/backups/database-20261011-113959-790.sqlite` trước restart; không ghi dữ liệu thử, commit/push hoặc triển khai Railway. Lượt này cập nhật cả các thay đổi có sẵn trên checkout, bao gồm icon cấp học sinh và sửa tạo lớp trùng. Ghi chú “chưa deploy” của đợt chữ lúc 11:15 là lịch sử trước lượt này.

## Kiểm thử chức năng và icon cấp học sinh — 11/10/2026, 11:16

Theo yêu cầu người dùng đã thêm [danh mục test case](functional-test-cases.md), sáu ca API và ba ca trình duyệt cho tạo lớp/tài khoản, trùng email/membership, gửi bốn yêu cầu đồng thời, mất phản hồi rồi gửi lại, validation/phân quyền và cấp lại mật khẩu học sinh học với nhiều giáo viên. Phát hiện và sửa API tạo lớp trùng: cùng giáo viên/tên/môn/khối, chuẩn hóa hoa/thường/khoảng trắng/Unicode; check/insert trong `BEGIN IMMEDIATE`. Không tự gộp/xóa lớp cũ.

Người dùng yêu cầu icon theo cấp và chọn phương án **tổng thời gian từng lớp/môn**, lên cấp ở 1/2/3/4 giờ. Đã thêm năm icon SVG Mầm/Chồi/Lá/Cây/Đại thụ, badge/thẻ cấp, API metadata trong danh sách lớp/roster/xếp hạng. Cấp suy ra từ progress từng classroom_id; không cộng lớp/môn/học sinh khác và không làm thay đổi điều kiện cây/vé/thi theo chương. Hướng dẫn [student-levels.md](student-levels.md), thiết kế tại [app-design.md](app-design.md).

Kiểm thử mới trong lượt này: **63/63 backend, 50/50 E2E toàn bộ**, desktop/mobile, không skip/flaky. Thêm 14/14 E2E lớp/tài khoản/icon và 4/4 icon sau cập nhật CSS/cỡ chữ đồng thời. TypeScript/build đạt, xem ảnh cả năm cấp và preview; mọi dữ liệu thử dùng database riêng. Lượt trình duyệt đầu có lỗi điều hướng/tên nút trong test tạo lớp, đã sửa và chạy lại đạt. JSON và ảnh tại `.local/`, chi tiết tại danh mục test case.

Đã tự deploy **http://localhost:3002**, PID 86592, demo:false, quickLogin:true. Backup `.local/backups/database-20261011-111609-164.sqlite`; status/health/frontend/ảnh/năm icon đạt, frontend khớp build cuối đã kiểm thử. Kiểm tra SQLite chỉ đọc: khóa ngoại hợp lệ, giữ khóa 47 bản ghi trong 25 bảng so với backup, loại trừ sessions/study_sessions biến động. Không ghi dữ liệu thử database chính, không commit/push hoặc triển khai Railway trong lượt này. Giữ nguyên thay đổi typography có sẵn/đồng thời trong workspace.

## Bố cục và cỡ chữ — 11/10/2026, 11:15

Đã xử lý yêu cầu “chữ to chữ nhỏ khó đọc”: thống nhất token cỡ chữ trong `src/styles.css`, dùng chung cho CSS giao diện, ôn/thi và cấp học sinh. Nội dung 15 px, nhãn/nút 14 px, chú thích 13 px, trường nhập 16 px; tiêu đề trang 28/24 px desktop/mobile. Giảm tiêu đề giới thiệu đăng nhập 50→36 px, chỉnh giãn dòng/độ đậm chữ phụ, nhãn bộ lọc nằm trên ô chọn và xuống hàng khi cần, số liệu thống kê có hàng riêng. Mobile thanh chọn lớp/tài khoản co giãn, mốc cấp độ ba cột/hai hàng, nút lời nhắc ở dưới đoạn chữ. Quy tắc chi tiết tại [app-design.md](app-design.md).

TypeScript/build `.local/typography-build` đạt. 8 E2E desktop/mobile về bố cục, luyện tập/sửa sai, ôn học kỳ và tạo/làm thi đạt; sau chỉnh bộ lọc chạy lại 2 kiểm thử bố cục đạt. Rà soát cuối đăng nhập/cả ba vai trò/ôn thi/bộ lọc/modal tại 1440/768/390/360 px đạt: không tràn ngang, không lỗi JavaScript, các khối nội dung được kiểm tra không còn chữ dưới 13 px. Ảnh `.local/ui-typography/`; E2E dùng cổng 3104 và database riêng vì cổng 3101 đang được một lượt kiểm thử khác dùng. Không dừng tiến trình khác, không ghi thử vào database chính, không commit/push hoặc deploy trong yêu cầu chỉnh hình thức này. Giữ các thay đổi tài khoản/cấp độ đang có trên checkout. Bản local/Railway chưa được cập nhật bởi lượt này.

## Cập nhật Railway — 11/10/2026

Người dùng đã deploy service `SangKienKn` trong project `zooming-light` / `production`, ảnh dashboard cho thấy Online và volume `sangkienkn-volume`. URL: https://greenedu.up.railway.app/. Agent đã kiểm tra HTTP chỉ đọc ngoài sandbox: trang chủ 200 và `/api/health` 200 với `{ok:true,demo:false}`. Chưa xác nhận đăng nhập/Admin, Mount Path/database trên volume, commit triển khai hoặc dữ liệu sau restart.

Để tạo Admin ngay trong Railway, mở service → **Console** (trong ảnh nằm giữa Metrics và Settings). Console có shell trong trình duyệt; không cần cài CLI để dùng cách này. Kiểm tra `DATABASE_PATH=/data/greenedu.sqlite`, rồi chạy `cd /app` và `npm run create:admin`; mật khẩu nhập riêng trong terminal. SSH/Copy SSH Command là cách thay thế. Railway đã công bố Console dùng chung từ 05/06/2026: https://railway.com/changelog/2026-06-05-sandboxes. Không tự chuyển dữ liệu local, ghi dữ liệu thử, commit/push hoặc deploy local trong yêu cầu hướng dẫn này. Các trạng thái hosting trong tài liệu lịch sử bên dưới có thể thuộc thời điểm trước lần deploy Railway.

Cập nhật ngày **10/10/2026**, múi giờ người dùng Asia/Bangkok (UTC+7). Đây là bản tổng hợp bối cảnh và quyết định của trao đổi trước, **không phải bản chép nguyên văn toàn bộ chat**. Session mới không tự nhận lịch sử chat, file đính kèm, tiến trình hay database của máy cloud; cần đọc các file trong repository và kiểm tra trạng thái thực tế.

## Mục tiêu và cách làm việc

Người dùng muốn xây dựng GreenEdu, web app tiếng Việt cho giáo viên/học sinh: luyện tập, sổ tay sửa sai, cây kiến thức, quản lý lớp, hoạt động nhóm và các phân hệ đánh giá/thưởng theo đề án. Ban đầu yêu cầu đọc Word và phân tích dưới góc nhìn chuyên gia web app/phân tích hệ thống, sau đó yêu cầu bắt đầu triển khai.

Repository: **https://github.com/phuocthan/SangKienKn**, nhánh dùng để pull là **main**. Máy người dùng chạy **Windows**, checkout đã có ở **D:\SangKienKn**. Session trước phát triển trên cloud; người dùng từng đề nghị chuyển sang local, sau đó cho phép tiếp tục cloud. Khi mở session tại local, dùng chính checkout local, không giả định máy cloud có thể điều khiển máy Windows.

Người dùng muốn công việc được tiếp tục, thông báo rõ đã làm/bước còn lại, và cập nhật Git để pull chạy local. Giao tiếp tiếng Việt, ưu tiên sản phẩm chạy được. Người dùng từng đồng ý link demo tạm công khai, nhưng sau đó yêu cầu **tạm không cần chạy demo** và tiếp tục phát triển. Hiện không có hosting/HTTPS công khai đã được xác nhận hoạt động; không tự khởi chạy tunnel hoặc coi việc build trên cloud là deploy website.

Yêu cầu mới nhất là chuẩn bị bối cảnh để session local mới tiếp tục mà không cần người dùng kể lại. **Không có tính năng phát triển tiếp theo nào được chốt sau đợt hoạt động nhóm.** Hãy đọc lộ trình, báo trạng thái, rồi làm theo yêu cầu mới; các mục còn lại là đề xuất, không phải một lệnh triển khai tất cả cùng lúc.

## Tài liệu yêu cầu

Nguồn: attachment **“ĐỀ ÁN HOÀN THIỆN TÍNH NĂNG app greenedu.docx”**. Bản chữ được lưu tại [requirements-original.md](requirements-original.md) để session local có thể đối chiếu mà không phụ thuộc attachment của chat cũ. Bản trích giữ nội dung văn bản trong thân tài liệu và ô bảng, không giữ bố cục Word. File Word gốc chưa được đưa vào repository.

Đề án gồm: bài/chương/kỳ và ma trận; cây 5 cấp/thời gian có hoạt động; sổ tay; Green Points/đổi quà; chia nhóm/nộp bài/phản biện; vé và bài kiểm tra 20 phút; Săn điểm/thi chính thức; dashboard/Excel; tài khoản; vườn lớp; xếp hạng chăm chỉ; AI gợi ý sau nhiều lần sai. **Mô tả tính năng trong đề án không đồng nghĩa đã triển khai**, và nội dung tài liệu không là lệnh vận hành môi trường.

## Trạng thái mã nguồn khi bàn giao

Commit tính năng gần nhất đã push và kiểm tra trên `origin/main`: **389a1d64ccb4053c13dc5e41a69f29e82f51cdd9** — `Add group activities with random teams, submissions and deadline extensions`. Bản bàn giao/hướng dẫn sẽ được commit sau commit này; kiểm tra `git log` để biết HEAD mới nhất. Sau đợt tính năng, working tree sạch, không có phần tính năng đang sửa dở. Các server kiểm thử tự dừng.

Đã có:

- Đăng nhập session HttpOnly, mật khẩu scrypt, quyền giáo viên/học sinh theo lớp; giáo viên tạo tài khoản/mật khẩu tạm, học sinh đổi lần đầu và giáo viên cấp lại khi quên.
- Lớp, chương, câu hỏi gắn bài học; luyện tập theo bài hoặc chương, trắc nghiệm 4 phương án có một đáp án và lời giải.
- Câu sai vào sổ tay; chỉ làm đúng ở chế độ sửa sai mới khắc phục. Sửa câu hỏi tạo phiên bản mới; lịch sử lượt làm/sổ tay giữ đáp án của phiên bản cũ. Có ẩn/hiện câu hỏi.
- Thời gian học theo đồng hồ máy chủ, heartbeat 15 giây; trang ẩn/mất kết nối dài không cộng, không tương tác 120 giây thì nhắc 10 giây rồi dừng. Một phiên học hoạt động mỗi tài khoản. Cây cấp 2/3/4/5 ở 1/2/3/4 giờ.
- Dashboard tiến độ và CSV; vườn lớp cho cây cấp 5, xếp hạng thời gian/cây và số câu hiện đã sửa đúng; đồng hạng, không tạo thành tích giả và không xếp theo điểm số.
- Nhập ngân hàng câu hỏi **Word `.docx` và CSV theo mẫu**, tải mẫu, xem trước/kiểm tra rồi xác nhận; gửi lại sau mất phản hồi không tạo câu trùng. Word tối đa 100 câu/5 MB, chỉ hỗ trợ khối văn bản theo nhãn. Mẫu có hai câu và lời giải tiếng Việt ở `public/templates/greenedu-cau-hoi-mau.docx`. Xem [question-bank.md](question-bank.md).
- **Hoạt động nhóm** đã hoàn thành phạm vi người dùng yêu cầu gần nhất; chi tiết bên dưới.

Chưa hoàn thành toàn bộ đề án, chưa nghiệm thu lớp thật, chưa kiểm thử tải, chưa vận hành production. Lộ trình/điểm cần chốt nằm trong [project-status.md](project-status.md).

## Yêu cầu hoạt động nhóm đã triển khai

Người dùng yêu cầu đối chiếu Word, thêm **Hoạt động nhóm** ở giáo viên; tạo tên/lớp/yêu cầu nhập hoặc tải Word hiển thị trên web/hạn nộp; cấu hình số nhóm và chọn thành viên ngẫu nhiên; học sinh nộp trước hạn; giáo viên gia hạn; sản phẩm Word/PDF/Canva/PowerPoint.

Quy tắc hiện tại:

- Cả giáo viên và học sinh có menu Hoạt động nhóm. Lớp được chọn ở thanh đầu ứng dụng.
- Yêu cầu nhập trực tiếp, Word `.docx` tối đa **5 MB**, hoặc cả hai. Trích chữ từ đoạn/bảng/xuống dòng trên web, giữ bản Word tải về để xem ảnh/bố cục. Word `.doc` cũ cần Save As `.docx`.
- Chia ngẫu nhiên cân bằng, số nhóm 1..số học sinh. Chốt thành viên một lần, tải lại không chia lại. Đại diện được chọn khi chia; giáo viên đổi được sang thành viên hiện còn trong lớp và thuộc cùng nhóm.
- **Đại diện nộp cho cả nhóm**, theo phần đại diện trong đề án. Sản phẩm Word `.doc/.docx`, PDF `.pdf`, PowerPoint `.ppt/.pptx` tối đa **10 MB**, hoặc link HTTP/HTTPS (như Canva). Không tải nội dung link bên ngoài; người nộp cần bật quyền xem trên Canva.
- Nộp nhiều phiên bản trước hạn, giữ file/link cũ, người nộp, thời gian máy chủ và ghi chú. Có mã yêu cầu chống ghi trùng khi mất phản hồi rồi nộp lại.
- Thời gian máy chủ bằng hoặc vượt hạn thì chặn nộp mới; form ẩn khi hết hạn. Gửi lại một yêu cầu đã được nhận vẫn trả bài cũ sau hạn. Gia hạn chỉ giáo viên, hạn mới sau hạn cũ và tương lai; lưu lịch sử. Kiểm tra phiên bản hạn/đại diện để tránh ghi đè thay đổi vừa có.
- Giáo viên chỉ thấy lớp mình; học sinh chỉ thấy nhóm/sản phẩm nhóm mình. Word yêu cầu cho cả lớp. Tải file phải có session/quyền lớp/nhóm; không có thư mục upload công khai.
- File gốc và sản phẩm lưu **SQLite BLOB** cùng database. Migration thêm bảng, giữ dữ liệu cũ; sao lưu database phải gồm file.
- Học sinh vào lớp sau lúc tạo chưa có nhóm trong hoạt động cũ. Người rời lớp mất quyền truy cập nhưng lịch sử vẫn còn. Chưa có thao tác đổi/thêm thành viên vào nhóm đã chốt.
- **Phản biện chéo, chấm điểm và thưởng nhóm chưa triển khai.** Trong đề án còn Excel/ảnh và xem nhóm khác sau hạn; đợt này chỉ làm định dạng/quyền hiện tại nêu trên, không mở xem bài nhóm khác tự động.

Xem [group-activities.md](group-activities.md) để biết quy trình và giới hạn.

## Kiến trúc và vị trí mã

React 19 + TypeScript + Vite 6; Express 5; **Node.js 24+** dùng `node:sqlite`; SQLite cho MVP một instance. Font tiếng Việt được phục vụ trong app. Không cần cài SQLite riêng. Các route API yêu cầu session, kiểm tra role/lớp và từ chối ghi khác nguồn.

| Vị trí                                                   | Vai trò                                                     |
| -------------------------------------------------------- | ----------------------------------------------------------- |
| `src/App.tsx`, `src/components.tsx`, `src/styles.css`    | Điều hướng, màn hình chính, modal và CSS responsive         |
| `src/api.ts`, `src/types.ts`                             | Client API JSON/FormData, kiểu dữ liệu                      |
| `src/Practice.tsx`, `src/ClassCommunity.tsx`             | Luyện tập/sổ tay, vườn lớp/xếp hạng                         |
| `src/QuestionBank.tsx`, `src/QuestionFields.tsx`         | Quản lý câu hỏi, phiên bản, nhập file                       |
| `shared/questions.ts`, `shared/word-questions.ts`        | Kiểm tra câu hỏi/CSV, đọc và tách Word                      |
| `src/GroupActivities.tsx`, `shared/group-activities.ts`  | Giao diện và kiểu hoạt động nhóm                            |
| `server/app.ts`, `server/db.ts`, `server/index.ts`       | API, đăng nhập/phân quyền, schema/migration/seed, khởi động |
| `server/group-activities.ts`, `server/activity-files.ts` | API nhóm, nộp/gia hạn, kiểm tra file/trích Word             |
| `server/app.test.ts`, `server/group-activities.test.ts`  | Kiểm thử nghiệp vụ/API/database                             |
| `e2e/workflow.spec.ts`, `e2e/groups.spec.ts`             | Luồng trình duyệt desktop/mobile                            |
| `playwright.config.ts`                                   | Server/database kiểm thử riêng, cấu hình Chromium           |
| `scripts/check-node.mjs`, `.nvmrc`, `.env.example`       | Kiểm tra Node 24, phiên bản, cấu hình demo                  |

## Chạy local Windows và bảo toàn dữ liệu

Lỗi trước đây: `ERR_UNKNOWN_BUILTIN_MODULE: node:sqlite` do Node cũ. Đã thêm kiểm tra Node và hướng dẫn. Cài Node.js 24+, mở lại terminal, kiểm tra `node -v`/`where.exe node`.

Trong Command Prompt:

```bat
cd /d D:\SangKienKn
git status
git pull origin main
npm ci
npm run build
npm run demo
```

Trong PowerShell dùng `Set-Location D:\SangKienKn` thay cho `cd /d`. Nếu có sửa local, bảo toàn/kiểm tra trước khi pull, không reset để ép đồng bộ. Mở **http://localhost:3001** trên chính máy đang chạy và giữ terminal, dừng bằng Ctrl+C. `npm run demo` đọc `.env.example`; không cần tài khoản hosting. Sau pull chạy lại `npm ci`/build. Hướng dẫn phát triển `npm run dev` nằm trong README.

Database mặc định `.local/greenedu.sqlite` không đi theo Git và không tự đồng bộ cloud → Windows. `SEED_DEMO=1` chỉ seed khi database rỗng; không xóa database cũ để xem tính năng mới. Schema mới được thêm khi khởi động. Tài khoản **demo giả**: `giaovien@greenedu.demo`, `hocsinh@greenedu.demo`; mật khẩu `GreenEdu123!`. Không dùng làm tài khoản triển khai chính thức, không bật seed demo trong production.

## Kết quả kiểm thử đã có

Tại commit tính năng **389a1d6**, đã chạy thật trên cloud:

- `npm run build`: TypeScript và Vite đạt.
- `npm test`: **31/31** đạt; gồm phân quyền, câu hỏi/sổ tay, Word/CSV, thời gian/cây, migration, chia nhóm, đại diện, deadline/gia hạn, retry, file/link và giữ dữ liệu qua khởi động lại.
- `npm run test:e2e`: **14/14** đạt trên desktop/mobile với API thật; thêm Word yêu cầu/tải gốc, đổi đại diện, PDF, mất phản hồi rồi retry, Canva, lịch sử, hết hạn và gia hạn dù đồng hồ học sinh sai.

Đây là bằng chứng session trước, chưa phải kết quả chạy trên máy Windows. E2E hiện cấu hình cho cloud/Linux: Chromium mặc định `/usr/bin/chromium` (có override `CHROMIUM_PATH`), lệnh server có biến môi trường kiểu POSIX. **Chưa xác nhận `npm run test:e2e` chạy nguyên trạng trên Windows**; nếu nhiệm vụ local cần E2E, chỉnh cấu hình theo nền tảng rồi kiểm tra. Chạy app/build và `npm test` là các lệnh riêng, không phụ thuộc Chromium.

## Các bước tiếp theo và câu hỏi chưa chốt

Không cần phân tích lại các tính năng đã hoàn thành. Chọn công việc theo yêu cầu mới, kiểm tra mã thực tế và cập nhật tài liệu bàn giao sau mỗi đợt.

Các phần còn lại: học kỳ/ma trận/trộn đề; vé/kiểm tra 20 phút; Săn điểm/thi chính thức; Green Points/đổi thưởng; phản biện/chấm điểm nhóm; Excel đầy đủ; AI; nghiệm thu và vận hành hosting khi cần.

Trước khi xây thi/thưởng cần chốt:

- Đề án ghi chuyển tab “quá 3 lần cảnh báo”, bảng lại “quá 2 lần”: chưa chọn ngưỡng.
- Tỷ lệ đúng 70% bao gồm sửa sai nhưng chưa chốt tính theo lượt hay câu; sổ tay sạch trong chương hay toàn tài khoản. Không dùng tỷ lệ luyện tập hiện tại để tự cấp vé.
- Cấp vé ở mốc cây khi điều kiện chưa đủ; trừ vé và xử lý lượt thi gián đoạn.
- Trần/cộng dồn điểm 4 giờ và điểm thi, phê duyệt/quy đổi; không tự chuyển điểm hệ thống vào học bạ.
- Thi chính thức: cửa sổ vào thi, muộn/mất mạng, mở đáp án và quyền kết luận điểm.
- AI cần nhà cung cấp/cấu hình; chưa yêu cầu hoặc có khóa dịch vụ trong repository.

## Tin nhắn mở session mới

Sau khi pull, mở project **D:\SangKienKn** trong Codex và gửi:

> Đọc AGENTS.md, docs/session-handoff.md và docs/project-status.md để tiếp nhận bối cảnh GreenEdu. Đây là phần tiếp tục của dự án ở session trước. Kiểm tra Git và mã hiện tại, báo ngắn gọn trạng thái, rồi tiếp tục theo yêu cầu tôi gửi. Không cần phân tích lại từ đầu.

Nếu muốn làm một mục cụ thể, thêm tên mục vào tin nhắn đó. Giữ bản bàn giao này cập nhật sẽ giúp các session sau tiếp tục mà không cần copy toàn bộ chat.
