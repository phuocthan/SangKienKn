# Tiến độ và lộ trình GreenEdu

## Giáo viên mở kiểm tra theo từng chương — 11/10/2026

Theo yêu cầu mới, đã thêm quyền theo chương vào mã: mặc định khóa với chương cũ/mới; chỉ giáo viên sở hữu lớp mở/khóa tại Ôn tập & kiểm tra. Săn điểm cần thêm quyền này ngoài điều kiện >=2 giờ, >=70%, sửa sai sạch, còn vé. API chặn lượt mới cả khi học sinh dùng trang cũ/gọi trực tiếp; không dùng vé khi bị chặn. Kiểm tra chính thức cần các chương xuất hiện trong snapshot đề được mở, cùng lịch/enabled hiện có; giữ miễn điều kiện thời gian/vé cho thi chính thức. Khóa chương chỉ ngăn lượt mới; giữ bài/đáp án đang làm và retry cùng requestId; muốn thu bài chính thức vẫn dùng Đóng bài thi hiện có. Ôn tập không bị khóa theo quyền mới.

Schema bổ sung chapter_exam_access (chapter_id PK, enabled, updated_by, updated_at), không sửa tiến độ/câu hỏi/mật khẩu. POST /api/chapters/:id/exam-access kiểm tra boolean/vai trò/chủ lớp. Overview trả examAllowed và blockedChapters; frontend có điều khiển riêng, không ghi đè form học kỳ/tỷ lệ. Thiết kế tra cứu duy nhất docs/app-design.md, nghiệp vụ docs/learning.md.

Kiểm thử mới: 91/91 toàn bộ backend, 13/13 ca learning/schema liên quan, 10/10 E2E ôn/thi desktop/mobile, TypeScript/build riêng .local/chapter-exam-access-build đạt. Sau chỉnh thông báo tương thích API cũ ở frontend, build/TypeScript và 2/2 ca quyền chương desktop/mobile chạy lại đạt. Lượt E2E đầu 9/10 do ca mobile kế thừa sổ tay sai từ desktop; đã chuẩn bị lại điều kiện cá nhân trong database E2E riêng và chạy cả bộ lại 10/10. Không ghi dữ liệu Railway. Ảnh quyền giáo viên/học sinh trong test-results/learning-teacher-controls--58ff7-d-stale-starts-are-rejected-{desktop,mobile}/ đã xem; không tràn ngang. Backend test mới gồm mặc định khóa, quyền/trạng thái sai, riêng từng chương, không vượt điều kiện, giữ vé và lượt/đáp án, thi nhiều chương, migration/reopen.

**Chưa deploy/push Railway trong đợt này.** Local 5173 vẫn dùng API Railway cũ: nút giáo viên tạm disabled và thông báo chờ cập nhật server khi response chưa có examAllowed. Chỉ mã frontend HMR đã cập nhật; API production chưa áp dụng gate. Khi được yêu cầu deploy tiếp, đưa server/learning-db.ts, server/learning.ts, shared/learning.ts, src/Learning.tsx cùng các thay đổi lesson-catalog/email-domain đã triển khai trước vào snapshot đúng nền hiện tại; không vô tình đưa tính năng mail/popup khác đang chờ. Không chạy seed/test thật hoặc tự mở quyền production. Sau migration mọi chương mặc định khóa, giáo viên tự mở khi đã học đến chương.

## Sửa lỗi Chrome Outdated Optimize Dep — 11/10/2026

Người dùng báo React JSX runtime 504 với hash cũ 4ea5dd63 trên localhost:5173. HTTP trang/API vẫn 200; log Vite cho thấy các snapshot release trong .local bị quét, thay đổi tsconfig bên trong gây clear cache/full reload. Sửa vite.config.ts: optimizeDeps.entries chỉ index.html của app, watch bỏ qua **/.local/**. Dừng/khởi động lại đúng tiến trình frontend bằng npm run local; cache mới có react/jsx-dev-runtime, không đổi API/database Railway.

TypeScript và diff check đạt. Chrome cài trên máy chạy headless bằng profile riêng xác nhận trang đăng nhập hiển thị, thư viện React/JSX runtime và các dependency đều 200, không pageerror/504. GET auth/me 401 là đúng khi chưa đăng nhập; không đăng nhập thử hoặc ghi dữ liệu Railway. Script kiểm tra riêng .local/check-vite-cache.mjs. Chrome qua CUA không khả dụng nên kiểm tra bằng Chrome độc lập; tab người dùng cần Ctrl+Shift+R để bỏ URL dependency cũ. Không commit/push/deploy Railway.

Ngày 11/10 theo yêu cầu đã đổi **51/51 email đăng nhập Railway thành @greenedu.nk** (1 Admin/2 giáo viên/48 học sinh), giữ tên trước @, mật khẩu/ID/role/cờ đổi mật khẩu và liên kết. Tên rút gọn frontend/backend đều thêm đuôi mới; email cũ ngừng dùng. Deployment tối thiểu **2f2aa358-1cb0-41d2-bb58-eb24831f4165 SUCCESS**, giữ backend chương/bài và các thay đổi khác đang chờ ngoài gói, chưa push GitHub. Backup trước deploy/apply; 25 bảng khác khớp backup, 51 user chỉ đổi email, integrity/FK đạt, gọi lại không đổi thêm. 87 backend checkout/78 backend release, TypeScript/build và 8 E2E login đạt trên database riêng; HTML/JS Railway khớp build/miền mới, health local/Railway đạt. CSV private 46 học sinh cập nhật đuôi. Chi tiết ở bàn giao; .demo trong các đoạn cũ là lịch sử.

Ngày 11/10 theo yêu cầu **tạo chương/bài trước trên server/database Railway, câu hỏi cập nhật sau**: đã nhập **4 chương/26 bài chính + 1 mục bài tập bổ sung** vào **Lớp 11/2 ♥ / Vật Lý**, tất cả 0 câu hỏi. Bảng lessons/API đọc bài độc lập đã có; nhập transaction/chống trùng, giữ dữ liệu cũ. Backend tối thiểu Railway **eb8f32c9-e63f-4c33-b5e3-32b7d1bc212b SUCCESS**, không deploy thay đổi email/account-popup đang chờ hoặc push GitHub; frontend mới ở **http://localhost:5173** đọc Railway, đã xác minh bằng phiên giáo viên thật chỉ đọc. Backup trước nhập, 24 bảng cũ bảo toàn/hash khớp, integrity/FK đạt; nhập lại không trùng. 82 backend checkout/73 backend release, TypeScript/build và 4 lượt UI desktop/mobile database riêng đạt. [Danh mục](physics-11-curriculum-2026-2027.md), [thiết kế](app-design.md), chi tiết ở bàn giao. Các đoạn “chưa nhập” phía dưới là lịch sử.

Ngày 11/10 thu gọn **Tài khoản & bảo mật**: click avatar/nút Đổi avatar mở popup bộ chọn/tải/lưu; avatar thanh đầu cũng mở trực tiếp. Nút Đổi mật khẩu mở popup riêng; Admin đổi mật khẩu bằng popup, màn hình bắt buộc đổi mật khẩu tạm giữ nguyên. Đóng bỏ draft và trả focus về nút mở. TypeScript/build riêng đạt; 8 E2E avatar/tài khoản có sẵn và 6 E2E popup mới desktop/mobile đạt bằng database độc lập. Bản local **http://localhost:5173/** đã cập nhật qua Vite/HMR để test theo yêu cầu; API/database vẫn Railway, không push/deploy Railway hoặc ghi dữ liệu thử. Chi tiết/ảnh ở [session-handoff.md](session-handoff.md).

Ngày 11/10 phân tích KHGD Vật lý 2026–2027 phần khối 11: **4 chương/26 bài chính**, bài tập sóng dừng riêng; tùy chọn **3 chuyên đề/9 bài**, 70 + 35 tiết theo nguồn. Danh mục và cảnh báo lỗi PPCT/lịch thi tại [physics-11-curriculum-2026-2027.md](physics-11-curriculum-2026-2027.md), dữ liệu có nguồn gốc tại [JSON](physics-11-curriculum-2026-2027.json). Railway kiểm tra chỉ đọc xác nhận **Lớp 11/2 ♥ / Vật Lý hiện 0 chương**. **Chưa nhập hoặc sửa runtime**: bài hiện suy ra từ câu hỏi; cần bài độc lập để hiển thị bài rỗng trước khi có ngân hàng. Danh mục kiểm tra đủ/không trùng số bài, tên trong giới hạn; chưa tự sửa lịch sai, tạo câu hỏi giả, ghi database, deploy hoặc push. Chi tiết ở bàn giao.

Ngày 11/10 đã tạo **46 tài khoản học sinh và 46 membership** theo danh sách người dùng cho **Lớp 11/2 ♥ / Vật Lý** trên database Railway thật. Email từ họ tên không dấu/không khoảng trắng, đuôi `@greenedu.demo`, mật khẩu tạm theo yêu cầu và bắt buộc đổi lần đầu; không trùng tài khoản cũ. Backup trước nhập trên volume, giữ nguyên 5 tài khoản cũ/23 bảng dữ liệu khác; xác minh 46 hash/cờ đổi mật khẩu, integrity/khóa ngoại và health đạt. Script import kiểm thử 3/3 bằng database riêng trước thao tác. CSV riêng tại `.local/tai-khoan-lop-11-2.csv`, không Git/public, chi tiết ở [session-handoff.md](session-handoff.md). Không gửi email, tạo tiến độ, deploy/restart/push trong đợt này.

Ngày 11/10 chỉnh nội dung đăng nhập theo yêu cầu: bỏ gợi ý “Nếu chưa có @…”; dòng dưới nút đổi thành **“Liên hệ giáo viên chủ nhiệm để cấp lại.”**. TypeScript mới đạt, cập nhật frontend local qua HMR; chưa push/deploy, không đổi nghiệp vụ hoặc dữ liệu.

Ngày 11/10 đã chuẩn bị **email xác nhận tạo tài khoản mới** theo vai trò teacher/student, đề xuất EmailJS + Gmail cho nhu cầu thư ít/đơn giản. Luồng Admin/giáo viên tạo tài khoản có queue transactional opt-in, worker HTTPS, không gửi lại membership/đăng nhập/trùng email, không gửi mật khẩu. **Chưa kết nối Gmail/EmailJS, chưa bật gửi thật, chưa push/deploy backend Railway**; frontend local vẫn dùng API Railway cũ. Cần kết nối service/template và Variables rồi triển khai backend riêng. 20 kiểm thử email/tài khoản và 76 toàn bộ backend đạt với mock/database riêng; TypeScript và render mẫu mail desktop/mobile đạt. Hướng dẫn tại [welcome-email.md](welcome-email.md), thiết kế tại [app-design.md](app-design.md). Không thêm Google OAuth hay tự đăng ký.

Ngày 11/10 kiểm tra phản hồi giao diện chưa giống preview và chạy **local http://localhost:5173/**. Đã sửa chữ thương hiệu bị bỏ sót trong component Logo từ `greenedu` thành **GreenEdu**, nét đậm đồng nhất cho đăng nhập/sidebar. Build/TypeScript mới đạt; kiểm tra đăng nhập desktop 1312 px/mobile 390 px không tràn ngang hoặc log lỗi. Tab local đã mở để người dùng xem; API/database vẫn Railway, không ghi dữ liệu thử. Bản sửa chữ **chưa push/deploy**. Ảnh preview đã duyệt là trang chủ học sinh sau đăng nhập; tab Railway được kiểm tra đang hiển thị đăng nhập. Chi tiết và ảnh local ở [session-handoff.md](session-handoff.md).

Ngày 11/10 đã **push GitHub main** theo yêu cầu, commit mã `a8336a1` tại **https://github.com/phuocthan/SangKienKn**. Runtime khớp release đã kiểm thử, TypeScript/diff check chạy lại đạt. Railway tự nhận commit qua GitHub và deployment **`c07d72e5-00be-4bf3-bfbd-d9607efc449f` SUCCESS**. Kiểm tra công khai mới: CSS/JS khớp build, ảnh/logo tải được, đăng nhập desktop/mobile không lỗi/tràn ngang, health production đạt; database 25 bảng/8 khóa bản ghi giữ nguyên, integrity/khóa ngoại đạt, không ghi dữ liệu thử. Tài liệu có commit bổ sung riêng, không đổi runtime. GitHub đã có thiết kế mới và các push main sẽ tự kích hoạt Railway; ghi chú “chưa push” bên dưới là lịch sử. Chi tiết ở [session-handoff.md](session-handoff.md).

Ngày 11/10 đã **deploy thiết kế khu vườn lên https://greenedu.up.railway.app/** theo yêu cầu. Railway `zooming-light / production / SangKienKn`, deployment `f313de7d-3787-4dd4-88a7-ca0616abed83` **SUCCESS**, upload snapshot local trực tiếp, chưa commit/push GitHub. Kiểm tra mới: 67 backend/TypeScript/build đạt, CSS/JS công khai khớp build, health production đạt, đăng nhập desktop/mobile không lỗi JS/tràn ngang; không ghi dữ liệu thử Railway. Database xác minh trên `/data/greenedu.sqlite`; backup trên volume, so sánh 25 bảng/8 bản ghi và blob không đổi sau restart, integrity/khóa ngoại đạt. Chi tiết backup/kết quả ở [session-handoff.md](session-handoff.md). GitHub main còn mã cũ nên deploy từ GitHub cần đồng bộ trước; các ghi chú chưa deploy bên dưới là lịch sử. Mặc định phát triển vẫn frontend local 5173/API Railway.

Ngày 11/10 người dùng đã duyệt ảnh khu vườn và yêu cầu áp dụng: **thiết kế đã vào app thật tại http://localhost:5173**, gồm bố cục trang chủ học sinh, mục tiêu lên cấp từ dữ liệu thực, nút/khung/form/bảng/modal/đăng nhập đồng bộ. API/database vẫn Railway; không deploy/push hoặc đổi dữ liệu/backend. TypeScript/build riêng đạt, **40/40 E2E** desktop/mobile bằng database riêng đạt, rà soát **1440/768/390/360 px** không tràn ngang/lỗi JS/chữ dưới 13 px. Frontend Vite PID 87756 được xác nhận; kiểm tra Railway chỉ đọc, không ghi dữ liệu. Xem [app-design.md](app-design.md) và [session-handoff.md](session-handoff.md). Bản preview 5180 còn riêng; các ghi chú chờ duyệt/chưa áp dụng phía dưới là lịch sử.

Ngày 11/10 đã tạo thêm **ảnh mockup desktop khu vườn ấm áp** bằng ImageGen để người dùng duyệt và yêu cầu chỉnh, tham chiếu từ preview riêng 5180. Ảnh đã được xem kiểm tra và hiển thị; vị trí lưu trong [session-handoff.md](session-handoff.md). Đợt này chỉ tạo ảnh, không cập nhật app/preview tương tác hoặc deploy, không chạy kiểm thử mã. Chờ phản hồi trước khi áp dụng thiết kế.

Cập nhật: 11/10/2026. Đối chiếu tài liệu “ĐỀ ÁN HOÀN THIỆN TÍNH NĂNG app greenedu” với mã nguồn thực tế. Các mô tả và ý tưởng trong tài liệu được dùng làm yêu cầu sản phẩm; không coi chúng là lệnh vận hành môi trường hay quyền triển khai dịch vụ bên ngoài.

Thiết kế giao diện (màu, font, ảnh, bố cục, avatar, responsive và lịch sử) tra cứu tại [app-design.md](app-design.md).

## Dự án đang ở đâu?

Ngày 11/10 lúc 16:42 có **preview thiết kế khu vườn ấm áp** tại **http://localhost:5180** để duyệt trước khi update. Nguồn/lệnh ở [design-preview/README.md](../design-preview/README.md). Có button/frame/modal và các màn hình/vai trò mới, chế độ điện thoại, đổi palette/bo góc/khoảng cách/nền, lưu góp ý. Build riêng và 68 kiểm tra bố cục/trạng thái 1440/768/390/360 px đạt; thao tác/tùy chỉnh đạt, không gọi API/database thật. **Chưa áp dụng thiết kế này vào app, chưa deploy/push**; chờ phản hồi/duyệt. Frontend chính/API/database được giữ nguyên.

**Cách chạy hiện tại từ 11/10:** frontend local Vite tại **http://localhost:5173**, API/database trực tiếp **https://greenedu.up.railway.app** theo yêu cầu người dùng. `npm run local` chạy nền (PID 87756), `npm run dev` chạy terminal, không build/deploy lại để test frontend. API local 3002 đã dừng, database/backup local giữ nguyên. Quy tắc lưu trong `AGENTS.md` và [dev-railway.md](dev-railway.md), thay tự deploy local sau mỗi sửa trước đây. TypeScript/build và 4 kiểm thử proxy đạt; kiểm tra Railway thật chỉ đọc xác nhận health/401 chưa đăng nhập/form đăng nhập không lỗi JS. Thao tác UI ghi dữ liệu thật Railway; test tự động vẫn riêng, đăng nhập bằng mật khẩu Railway. Không push/deploy Railway trong đợt này, chưa xác minh volume/restart hoặc đăng nhập thật.

Ngày 11/10 lúc **11:47** đổi bộ cấp học sinh thành **Mầm → Chồi → Cây Non → Đơm Hoa → Kết Trái**, kèm icon cây nhỏ/hoa/quả tương ứng. Giữ ngưỡng 0/1/2/3/4 giờ riêng từng lớp/môn. TypeScript/build, 26 backend và 4 E2E desktop/mobile đạt; đã tự deploy local **http://localhost:3002**, PID 92676, demo:false, quickLogin:true. Backup `.local/backups/database-20261011-114736-419.sqlite`; health/build đã kiểm thử/khóa ngoại và bảo toàn khóa 47 bản ghi trong 25 bảng đạt. Các tên Lá/Cây/Đại thụ bên dưới là lịch sử. Xem [student-levels.md](student-levels.md) và [app-design.md](app-design.md).

Deploy local mới nhất lúc **11:40 ngày 11/10/2026** theo yêu cầu “deploy”: **http://localhost:3002**, PID 96680, `demo:false`, `quickLogin:true`. Đã áp dụng bố cục/cỡ chữ và các thay đổi hiện có trên checkout. TypeScript/build, status/health, HTML/CSS khớp `dist`, token chữ mới/bố cục mobile và ảnh nền v11 đạt; kiểm tra SQLite chỉ đọc xác nhận khóa ngoại hợp lệ. Backup `.local/backups/database-20261011-113959-790.sqlite`. Không commit/push hoặc cập nhật Railway; các trạng thái triển khai bên dưới là lịch sử.

Ngày 11/10 lúc **11:16** hoàn tất [kiểm thử chức năng](functional-test-cases.md) và [icon cấp học sinh theo lớp/môn](student-levels.md). Người dùng chọn tổng thời gian riêng từng lớp/môn; Mầm/Chồi/Lá/Cây/Đại thụ ở 0/1/2/3/4 giờ. Đã sửa tạo lớp trùng khi gửi lặp/đồng thời, giữ lớp cũ. **63 backend, 50 E2E toàn bộ desktop/mobile đạt**; kiểm tra thêm 14 ca lớp/tài khoản/icon và 4 ca icon với CSS cuối đều đạt. Thiết kế tại [app-design.md](app-design.md). Đã deploy local **http://localhost:3002**, PID 86592, demo:false, quickLogin:true; backup `.local/backups/database-20261011-111609-164.sqlite`. Health/build/frontend/khóa ngoại và giữ khóa 47 bản ghi trong 25 bảng đạt; database kiểm thử riêng, không cập nhật Railway trong lượt này.

Ngày 11/10 lúc 11:15 hoàn thiện thứ bậc chữ và bố cục: nội dung 15 px, nhãn/nút 14 px, chú thích 13 px, trường nhập 16 px; tiêu đề gọn hơn và không giảm chữ nội dung trên điện thoại. Nhãn bộ lọc phía trên ô chọn, thống kê có hàng số riêng, thanh tài khoản co giãn, lời nhắc và mốc cấp độ dễ đọc ở 360 px. Build riêng `.local/typography-build`, 8 E2E liên quan và 2 lượt kiểm thử lại bố cục đạt; rà soát hình thức cuối 1440/768/390/360 px đạt, database riêng. Chi tiết tại [app-design.md](app-design.md), ảnh `.local/ui-typography/`. Chưa deploy/push đợt chữ này; không thay bản local hoặc Railway đang chạy.

Deploy local mới nhất theo yêu cầu lúc **10:41 ngày 11/10/2026**: **http://localhost:3002**, PID 90992, demo:false, quickLogin:true. TypeScript/build, health và tài nguyên giao diện đạt; kiểm tra SQLite chỉ đọc xác nhận khóa ngoại hợp lệ và giữ khóa 47 bản ghi trong 25 bảng. Backup `.local/backups/database-20261011-104146-805.sqlite`. Lượt này không triển khai Railway.

Đợt cấp độ/ôn/thi và đổi đề mục đã hoàn tất, deploy local lúc 10:39 tại **http://localhost:3002**, PID 70704, demo:false, quickLogin:true. 54 backend, 32 E2E hồi quy cũ và 8 E2E ôn/thi desktop/mobile đạt; Excel đã mở/đọc lại. Backup .local/backups/database-20261011-103900-238.sqlite; health/frontend/khóa ngoại và bảo toàn ID 47 bản ghi trong 25 bảng đạt. Không ghi dữ liệu thử vào database chính. Hướng dẫn [learning.md](learning.md), [kế hoạch](learning-implementation-plan.md), thiết kế duy nhất [app-design.md](app-design.md). Các trạng thái “chưa có thi/học kỳ/ma trận” bên dưới là lịch sử trước đợt này.

Ngày 11/10 người dùng xác nhận đã deploy Railway và gửi ảnh: project `zooming-light` / `production`, service `SangKienKn` **Online**, có volume `sangkienkn-volume`. URL công khai **https://greenedu.up.railway.app/**; agent kiểm tra HTTP chỉ đọc ngoài sandbox: trang chủ 200, `/api/health` 200 với `{ok:true,demo:false}`. Chưa xác minh đăng nhập, đường dẫn lưu database, Admin và dữ liệu qua restart; chưa nghiệm thu bản Railway. Bước tiếp theo là xác nhận database trên volume và tạo Admin nếu chưa có. Chi tiết ở `docs/session-handoff.md`; các ghi chú chưa triển khai hosting bên dưới mô tả thời điểm trước bước này.

Ngày 11/10 lúc 10:32 đã deploy đợt thiết kế; cấu hình và lịch sử chuyển sang [app-design.md](app-design.md). Backup `.local/backups/database-20261011-103225-851.sqlite`.

Ngày 11/10 lúc 10:19 đã cho phép đăng nhập bằng tên rút gọn: chưa có `@` thì tự thêm `@greenedu.demo`, email đầy đủ được giữ nguyên; vẫn cần mật khẩu đúng. Build và 8/8 E2E desktop/mobile đạt bằng database riêng. Đã tự deploy tại **http://localhost:3002**, PID 94044 khi kiểm tra, `demo:false`, `quickLogin:true`; health/frontend/khóa ngoại và bảo toàn dữ liệu 25 bảng đạt. Backup `.local/backups/database-20261011-101908-496.sqlite`. Đã xử lý lỗi khởi động do schema learning cũ thiếu hai cột bằng migration giữ dữ liệu, kiểm thử 1/1 đạt; xem bàn giao để biết chi tiết.

Ngày 11/10 lúc 10:12 đã nâng giới hạn tải avatar lên **3 MB** ở giao diện/API và tự deploy tại **http://localhost:3002**. Build, 2/2 kiểm thử API và 4/4 E2E desktop/mobile đạt: nhận đúng 3 MB, chặn vượt 1 byte, tải/lưu ảnh 2,5 MB qua trình duyệt. Health và kiểm tra dữ liệu chỉ đọc của 17 bảng đạt; `demo:false`, `quickLogin:true`. Backup `.local/backups/database-20261011-101228-613.sqlite`. Các ghi chú giới hạn 2 MB bên dưới là lịch sử trước bản này.

Ngày 11/10 lúc 10:05 đã deploy **tải avatar cá nhân và giới hạn học sinh không chọn avatar giáo viên** tại **http://localhost:3002**. Build/health và kiểm tra chỉ đọc frontend/ảnh/migration/khóa ngoại/dữ liệu có sẵn đều đạt; `demo:false`, `quickLogin:true`. Backup `.local/backups/database-20261011-100541-810.sqlite`. Theo yêu cầu mới, từ nay tự deploy sau mỗi yêu cầu thay đổi ứng dụng hoàn thành và kiểm thử phù hợp đạt, không hỏi lại; quy tắc đã lưu ở `AGENTS.md`. Các mô tả “chưa deploy” của upload/quy tắc avatar bên dưới là lịch sử trước bản này.

Ngày 11/10 giới hạn học sinh không chọn avatar giáo viên: ẩn bộ giáo viên ở UI, API chặn 16 ID giáo viên với 403. Học sinh dùng 24 avatar học sinh/thiên nhiên và ảnh tự tải; giáo viên giữ 40 lựa chọn. Lựa chọn giáo viên cũ của học sinh được đưa về chữ viết tắt khi database mở bằng mã mới, không đổi tiến độ. Build riêng, 45 backend tests và 4/4 E2E desktop/mobile đạt. **Chưa deploy quy tắc này hoặc phần upload**; kiểm thử không thay frontend `dist` đang chạy. Xem [avatar tài khoản](user-avatars.md).

Ngày 11/10 đã bổ sung tải avatar cá nhân cho giáo viên/học sinh: JPG/PNG/WebP tối đa 2 MB/4096 × 4096 px, xem trước/lưu/thay ảnh/dùng lại ảnh đã tải. Ảnh lưu bền vững trong database, có phân quyền xem và kiểm tra file. Build, 44 backend tests và 4/4 E2E desktop/mobile đạt. **Chưa deploy phần upload**; bản cổng 3002 đang dùng bộ 40 avatar, frontend đã được khôi phục đúng build đã deploy sau kiểm thử. Xem [avatar tài khoản](user-avatars.md).

Ngày 11/10 đã deploy bộ **40 avatar** tại **http://localhost:3002** theo yêu cầu. Build/health đạt, `demo:false`, đã kiểm tra giao diện/3 ảnh atlas/API xác thực và bảo toàn ID dữ liệu có sẵn của 18 bảng bằng SQLite chỉ đọc so với backup. Trạng thái “chưa deploy”/“stopped” của đợt avatar trong các đoạn bên dưới là lịch sử. Tiếp tục yêu cầu tải avatar cá nhân.

Ngày 11/10 lúc 09:52 đã deploy yêu cầu vào nhanh tại **http://localhost:3002**: hai nút giáo viên/học sinh đăng nhập vào tài khoản đầu tiên của mỗi vai trò từ database, hiển thị đúng tên, dùng phiên thật. Chỉ bật trên máy local qua loopback và tắt trong production; không cho vào nhanh Admin. Script lưu `QuickLogin:true` để giữ qua các lần deploy. Kiểm thử 42/42 API và 6/6 E2E tài khoản/giao diện/vào nhanh đạt; so sánh 17 bảng với backup đạt, khóa ngoại hợp lệ. Trạng thái hiện tại đã xác nhận chạy bằng `deploy:status` ngoài sandbox và health; các mô tả “chưa deploy/stopped” bên dưới là lịch sử.

Build, kiểm thử API toàn bộ danh mục 40 avatar và 4/4 E2E desktop/mobile đã đạt sau bổ sung bộ thiên nhiên; đã rà soát ảnh giao diện. Kiểm thử dùng database riêng.

Avatar lưu theo tài khoản và giữ sau tải lại; hướng dẫn API/quyền ở [user-avatars.md](user-avatars.md), thiết kế/lịch sử ở [app-design.md](app-design.md).

Ngày 11/10 kiểm tra phản hồi “Không tìm thấy chức năng.” ở Admin: cổng 3001 còn chạy backend demo khởi động trước khi thêm API tài khoản, dù phục vụ giao diện mới. Bản triển khai hiện tại ở **http://localhost:3002**; health/status đạt. Luồng tạo giáo viên/học sinh và giáo viên tạo/thêm học sinh kiểm tra lại trên desktop/mobile đạt 2/2 bằng database riêng. Database chính đã có 1 Admin; chỉ kiểm tra đọc và không tạo thêm dữ liệu thử. Hướng dẫn đã làm rõ địa chỉ sử dụng.

Ngày 11/10 bổ sung nhập trực tiếp khi chạy `npm run create:admin`: hỏi email/họ tên, che mật khẩu và yêu cầu xác nhận. Không cần khai báo biến môi trường khi dùng terminal tương tác; vẫn giữ cách cấp biến cho chạy tự động. Đã kiểm tra trên terminal Windows/database riêng và không tạo tài khoản thử trong database chính.

Đã hoàn thành MVP lõi: giáo viên tạo lớp/câu hỏi/học sinh → học sinh luyện tập → lưu câu sai → sửa sai → ghi nhận thời gian và cây → giáo viên xem tiến độ. Đã bổ sung vườn lớp và xếp hạng chăm chỉ. Đã hoàn thiện sửa/ẩn câu hỏi, lịch sử phiên bản, nhập CSV và Word `.docx` theo mẫu có tải mẫu/xem trước/xác nhận. Đã bổ sung hoạt động nhóm: yêu cầu văn bản/Word, chia ngẫu nhiên, đại diện, nộp sản phẩm, hạn nộp, gia hạn và lịch sử. Chưa hoàn thành toàn bộ đề án, chưa triển khai một website công khai và chưa nghiệm thu với lớp học thật.

Đã triển khai local theo yêu cầu ngày 10/10/2026 tại **http://localhost:3002**, không bật seed demo mới. Kiểm thử tiếp tục dùng server/database riêng; chưa triển khai hosting công khai. Trạng thái vận hành mới nhất ở cuối tài liệu và `docs/session-handoff.md`.

| Phân hệ trong đề án                | Trạng thái                                                                                         | Phần còn thiếu                                                                               |
| ---------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Tài khoản Admin/giáo viên/học sinh | Admin tạo giáo viên/học sinh; giáo viên tạo/thêm học sinh có sẵn; mật khẩu tạm và cấp lại mật khẩu | Nhập hàng loạt, vòng đời tài khoản và vận hành trường học thật                               |
| Ngân hàng câu hỏi                  | Phiên bản/ẩn/hiện, Word/CSV theo mẫu, học kỳ và ma trận theo bài/chương                            | Tự tách Word bố cục bất kỳ/PDF và nhập .xlsx                                                 |
| Luyện tập và cây                   | Luyện bài/chương, ôn chương/kỳ trộn ma trận, phiên ôn lưu để tiếp tục, cây 5 cấp                   | Nghiệm thu bằng lớp học thật                                                                 |
| Sổ tay sửa sai                     | Nhận câu sai luyện/ôn/thi; khi sửa sai chưa mở đáp án, tự làm lại đến đúng                         | Gợi ý AI khi có dịch vụ phù hợp                                                              |
| Dashboard và xuất dữ liệu          | Thời gian, mọi lượt luyện/sửa sai, cây và CSV; kết quả thi/thưởng và Excel .xlsx                   | Điểm và thưởng nhóm sau khi có nghiệp vụ chấm nhóm                                           |
| Khu vườn của lớp                   | Đã bổ sung cây cấp 5 của thành viên trong lớp                                                      | Màn hình so sánh nhiều lớp nếu cần; hiện giáo viên đổi lớp để xem                            |
| Xếp hạng chăm chỉ                  | Đã bổ sung xếp hạng thời gian/cây và bảng sửa sai                                                  | Đánh giá trải nghiệm vinh danh với giáo viên/học sinh thật                                   |
| Vé và kiểm tra 20 phút             | Vé mốc 3/4/5, điều kiện mở thi, thời hạn server, tự lưu/khôi phục/thu/chấm bài và cảnh báo tab     | Kiểm thử tải, nghiệm thu xử lý sự cố lớp thật                                                |
| Săn điểm và thi chính thức         | Tối đa 3 lượt/chương, lịch lớp/cùng bộ câu đảo thứ tự, giáo viên đóng/thu bài, báo cáo             | Điều chỉnh/kết luận điểm sau sự cố theo quy trình trường                                     |
| Green Points/đổi thưởng            | Sổ thưởng cây/thi cấp một lần, duyệt/từ chối và lịch sử                                            | Danh mục quà và quy trình đổi thưởng                                                         |
| Hoạt động nhóm                     | Đã có tạo hoạt động, yêu cầu Word, chia nhóm, đại diện, nộp file/link, deadline và gia hạn         | Phản biện chéo, chấm điểm/điểm thưởng và điều chỉnh thành viên sau khi chốt nhóm             |
| Trợ lý AI                          | Chưa triển khai                                                                                    | Kích hoạt sau nhiều lần sai, gợi ý từng bước, bài tương tự, nhà cung cấp và cấu hình sử dụng |
| Vận hành chính thức                | Chưa triển khai                                                                                    | Hosting/HTTPS, lưu trữ, sao lưu/khôi phục, giám sát và kiểm thử tải                          |

## Các bước còn lại theo thứ tự đề xuất

Phạm vi cấp độ/ôn tập/kiểm tra được triển khai theo [kế hoạch](learning-implementation-plan.md), quy tắc tại [learning.md](learning.md).

1. Nghiệm thu ôn/thi với một lớp thật, kiểm thử tải và quy trình xử lý sự cố/điểm.
2. Bổ sung phản biện chéo, chấm và điểm thưởng hoạt động nhóm; hiện chỉ có giao/chia/nộp/gia hạn.
3. Đổi quà Green Points, nhập tài liệu tùy ý và AI là các phần riêng tiếp theo.
4. Hosting/HTTPS, sao lưu/khôi phục và vận hành trường học khi người dùng yêu cầu.

## Quy tắc của vườn lớp và xếp hạng hiện tại

- Vườn lớp hiển thị một cây cho mỗi cặp học sinh/chương có ít nhất 14.400 giây đã ghi nhận. Cây cá nhân vẫn tồn tại. Hiển thị từ dữ liệu tiến độ nên cập nhật/tải lại không tạo cây trùng.
- Chỉ tính dữ liệu chương thuộc lớp đang chọn và học sinh hiện là thành viên. Giáo viên chỉ xem lớp mình sở hữu; học sinh chỉ xem lớp mình tham gia.
- Xếp hạng chăm vườn: thời gian học giảm dần, sau đó số cây cấp 5 giảm dần. Cùng cả hai chỉ số thì đồng hạng; tên chỉ để giữ thứ tự hiển thị ổn định. Dùng hạng 1, 1, 3 khi hai người dẫn đầu bằng nhau.
- Bảng “Bác sĩ cây trồng”: số câu hiện đã khắc phục giảm dần, cùng số câu thì đồng hạng. Một câu chỉ tính một lần; nếu làm sai lại, câu đó không còn được tính đến khi khắc phục lại. Đây không phải tổng số lượt gửi đáp án sửa sai.
- Chưa có hoạt động thì chưa xếp hạng hoặc tạo cây mẫu. Không dùng điểm số làm tiêu chí; không trả email, mật khẩu, đáp án hay chi tiết lỗi sai cá nhân qua API cộng đồng.
- Các bảng tính trong phạm vi lớp, lũy kế theo dữ liệu hiện có. Chưa có xếp hạng tuần/tháng hoặc xếp hạng công khai giữa mọi lớp.

## Quy tắc kiểm tra đã áp dụng

Người dùng chọn tỷ lệ 70% tính **tất cả lượt luyện tập và sửa sai**, **lần rời tab thứ 4 tự nộp**. Các quy tắc còn lại thực hiện theo [learning.md](learning.md): sổ tay xét từng chương, vé cấp theo mốc cây/dùng lúc bắt đầu, thời gian thi không cộng cây, tối đa 20 phút server, cùng tập câu đảo thứ tự và công bố đáp án thi chính thức khi khung thi đóng.

Điểm cây và Săn điểm có lịch sử/phê duyệt, chưa tự ghi sổ học bạ hoặc đổi quà. Điểm thưởng nhóm chưa tính trong báo cáo vì chưa có phân hệ chấm nhóm. File nhóm giữ giới hạn hiện tại; AI/hosting chưa cần khóa hoặc tài khoản ngoài.

## Lưu trữ và kiểm thử

Quy tắc ngân hàng câu hỏi được ghi trong [question-bank.md](question-bank.md).

Hướng dẫn, giới hạn và quy tắc hoạt động nhóm được ghi trong [group-activities.md](group-activities.md). File gốc và sản phẩm lưu trong cùng database; sao lưu database bao gồm cả file.

Mã nguồn được quản lý tại [phuocthan/SangKienKn](https://github.com/phuocthan/SangKienKn), nhánh `main`. Để chạy phiên bản hiện tại trên Windows, pull mã nguồn và làm theo [hướng dẫn local trong README](../README.md#chạy-local-trên-windows). Các kiểm thử sử dụng database riêng; database demo và thư viện cài đặt không được đưa lên Git. Gói demo Windows đã gửi trước đó chứa phiên bản trước đợt bổ sung cộng đồng này; dùng mã nguồn trên Git để nhận các tính năng mới.

Kết quả kiểm thử sau đợt bổ sung hoạt động nhóm:

- `npm test`: 31/31 kiểm thử đạt. Giữ các kiểm tra ngân hàng câu hỏi, luyện tập, cộng đồng và migration; thêm chia nhóm cân bằng/cố định, Word tiếng Việt/bảng/xuống dòng, file hỏng/quá lớn, phân quyền lớp/nhóm, đổi đại diện, học sinh vào/rời lớp, đúng thời điểm hết hạn, gửi lại sau hết hạn, gia hạn và xung đột chỉnh sửa, lịch sử phiên bản/file/link, chống gửi khác nguồn và giữ dữ liệu qua khởi động lại.
- `npm run test:e2e`: 14/14 kiểm thử trình duyệt đạt trên desktop và mobile. Giữ các luồng Word/CSV, sửa câu hỏi, sổ tay, cây và cộng đồng. Thêm giáo viên tạo hoạt động với Word, tải bản gốc, đổi đại diện; học sinh nộp PDF, mất phản hồi rồi gửi lại không tạo bản trùng, nộp Canva, tải lại giữ lịch sử; giáo viên xem/tải bài, gia hạn mở lại form dù đồng hồ thiết bị học sinh sai. Các luồng nghiệp vụ chạy với API thật; fixture trình bày cộng đồng không tạo tiến độ giả trong dữ liệu demo.
- `npm run build`: kiểm tra TypeScript và build Vite đạt.

Chưa kiểm thử tải hoặc nghiệm thu với lớp học thật. Các server kiểm thử đã tự dừng sau khi hoàn tất; demo vẫn được giữ ở trạng thái dừng theo yêu cầu.

## Triển khai nhanh local — 10/10/2026

- Người dùng đã chọn chạy/cập nhật trên máy Windows hiện tại. Có `npm run deploy`, `deploy:build`, `deploy:status`, `deploy:stop`; cách gọi từ chat lưu trong `AGENTS.md`, bối cảnh tiếp tục lưu trong `docs/session-handoff.md`. Hướng dẫn chi tiết ở `docs/deploy-local.md`.
- Script dùng lại dependencies đúng lockfile; cài ở staging riêng khi cần để tránh file Windows bị khóa. TypeScript/build hoàn thành trước khi thay giao diện, SQLite được backup bằng API trước restart. Server chạy ẩn, kiểm tra health và chỉ quản lý PID/tiến trình con do script tạo.
- Đã kiểm thử thật bằng database `.local/deploy-test.sqlite` và cổng 3102: deploy mới, cài dependencies, redeploy không cài lại, giữ cổng/database/chế độ demo, giữ dữ liệu qua restart và backup WAL, lỗi backup giữ server cũ, từ chối cổng bị chiếm, status và stop. Server thử đã dừng; không thay database chính hoặc dừng tiến trình ngoài script.
- Chưa triển khai hosting công khai. Chưa chạy deploy trên database chính; lần tiếp theo chỉ cần người dùng yêu cầu “deploy GreenEdu”.

## Quản trị tài khoản — 10/10/2026

- **Admin:** thêm vai trò quản trị, màn hình tìm/lọc tài khoản, tạo giáo viên/học sinh, xếp lớp học sinh và cấp lại mật khẩu. Giáo viên chỉ tạo học sinh trong lớp của mình; thêm được tài khoản học sinh có sẵn bằng email mà không đổi mật khẩu/tiến độ. Tài khoản tạo qua giao diện bắt buộc đổi mật khẩu tạm. Bootstrap Admin đầu tiên qua `npm run create:admin`, không tự tạo Admin mặc định hoặc nâng quyền giáo viên cũ. Xem [quản lý tài khoản](account-management.md).
- **Hoạt động nhóm:** bố cục tổng quan/danh sách/chi tiết, tìm kiếm/lọc đang nhận bài/hết hạn, thanh tiến độ, hạn nộp và trạng thái nổi bật; yêu cầu và danh sách nhóm tách khu, lọc nhóm đã/chưa nộp, thành viên và sản phẩm dễ đọc hơn. Các quy tắc đại diện, lưu lịch sử, retry, hạn theo server và gia hạn giữ nguyên.
- **Kiểm thử:** 36 API/bootstrap/migration đạt; build TypeScript/Vite đạt. 18 kịch bản trình duyệt được kiểm tra trên desktop/mobile, gồm các luồng Word/CSV, luyện tập/sửa sai, nhóm và Admin → giáo viên → học sinh. Kiểm thử tài khoản/giao diện chạy lại riêng sau chỉnh thẻ mobile và nhãn chọn. Playwright đã hỗ trợ khởi động trên Windows và database E2E riêng; sửa cleanup SQLite để đóng trước khi xóa trên Windows.
- **Vận hành:** chưa deploy bản chính, chưa tạo Admin/dữ liệu thử trong database chính và chưa commit/push. Chỉ các server/database kiểm thử được sử dụng.

## Deploy local theo yêu cầu — 10/10/2026, 23:55

- `npm run deploy` phát hiện cổng 3001 bị server chạy ngoài script chiếm. Đã dùng `npm run deploy -- -Port 3002`, không dừng tiến trình khác. Bản mới chạy ẩn tại **http://localhost:3002**; các lần deploy tiếp theo tự giữ cổng 3002 từ trạng thái đã lưu.
- TypeScript/build đạt, backup database trước khởi động tại `.local/backups/database-20261010-235542-851.sqlite`. `npm run deploy:status` xác nhận server đang chạy, health đạt, `demo:false`.
- Kiểm tra read-only: frontend khớp build, ảnh nền có sẵn, API chặn truy cập chưa đăng nhập; migration Admin đã áp dụng, khóa ngoại hợp lệ và số bản ghi trong các bảng nghiệp vụ khớp backup. Không tạo dữ liệu thử hoặc seed demo mới trong database chính.
- Chưa có Admin trong database chính. Dùng `npm run create:admin` theo [hướng dẫn](account-management.md) khi có thông tin tài khoản người vận hành. Không commit/push.
