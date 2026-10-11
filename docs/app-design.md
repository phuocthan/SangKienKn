# Thiết kế giao diện GreenEdu

Tài liệu tra cứu duy nhất về hình thức giao diện, cập nhật 11/10/2026. Quy tắc nghiệp vụ/tài khoản/triển khai được lưu ở các tài liệu chức năng; khi sửa hình thức giao diện, cập nhật tài liệu này.

## Định hướng và chữ

Giao diện tiếng Việt theo chủ đề khu vườn kiến thức, màu xanh rừng, nền sáng, thẻ dễ đọc và các thao tác rõ ràng. Font **Be Vietnam Pro** được phục vụ nội bộ, các trọng lượng 400/500/600/700/800. Không phụ thuộc tải font từ dịch vụ ngoài. Icon dùng Lucide; cây cấp độ dùng SVG theo dữ liệu thực tế.

Thiết kế khu vườn ấm áp đã được người dùng duyệt qua ảnh và yêu cầu áp dụng ngày 11/10/2026. Các biến hiện tại trong `src/garden.css`: xanh `#315d3e`, xanh đậm `#153f2c`, chữ phụ `#596d60`, viền `#e2e6d8`, nền phụ `#eef3e4`, nền kem `#faf9f3`, chữ `#203f2c`, bán kính chuẩn 22 px. CSS chức năng/responsive tại `src/styles.css`; lớp diện mạo cũ tại `src/design.css`, cấp học sinh tại `src/student-level.css`; `src/garden.css` được nạp cuối trong `src/main.tsx` để áp dụng thiết kế đã duyệt cho app thật.

### Thiết kế đã duyệt và áp dụng — 11/10/2026

Sidebar xanh rừng bo 24 px, nền kem với ảnh trường mờ, thẻ trắng ấm viền nhẹ, nút xanh và nút phụ có viền cùng chiều cao tối thiểu 44–46 px. Đồng bộ biểu mẫu, bảng, modal và màn hình đăng nhập cho Học sinh/Giáo viên/Admin. Logo trường vẫn dùng nguồn gốc riêng; cây từ sách dùng ảnh `knowledge-garden-v1.webp` đã có. Giữ trạng thái focus, lỗi/đúng/sai, disabled và điều hướng hiện tại.

Trang chủ học sinh có hero và mục tiêu kế tiếp ở hai cột, ba thống kê dữ liệu thực, thẻ chương gọn với số chương/cây/tiến độ/chọn bài/nút luyện tập, cuối trang là hành trình năm cấp và sổ tay. `GardenGoal.tsx` suy ra mục tiêu lên cấp từ thời gian lớp/môn hiện tại; không sử dụng số liệu giả 10/15 phút theo ngày trong mockup vì API chưa cung cấp dữ liệu theo ngày. Số cây ra hoa chuyển sang thẻ mục tiêu. Không đổi quy tắc cây theo chương hoặc cấp học sinh, không lấy tên các cấp minh họa thay nghiệp vụ hiện có.

Ở màn hình 701–1200 px hero và mục tiêu xếp dọc; điện thoại dùng điều hướng ngang, các khối một cột, giữ chữ nội dung 15 px/nhãn 14 px/chú thích 13 px/ô nhập 16 px. Tiêu đề hero học sinh 26–34 px desktop và 27 px điện thoại; số liệu 26 px (23 px tablet). Hỗ trợ `prefers-reduced-motion`. Bản prototype 5180 vẫn riêng; giao diện thật ở frontend local 5173 dùng API/database Railway.

### Thứ bậc chữ — 11/10/2026

Dùng các biến `--text-*` tại `src/styles.css` thay cho cỡ chữ riêng lẻ ở mỗi trang/breakpoint. Nội dung **15 px**, nhãn/nút **14 px**, chú thích **13 px**, trường nhập/chọn **16 px**. Điện thoại giữ nguyên các cỡ chữ này; chỉ thu gọn tiêu đề. Dòng tên trường trong logo là chữ thương hiệu 10 px.

| Vai trò | Desktop | Điện thoại ≤700 px |
| --- | --- | --- |
| Tiêu đề trang/đăng nhập | 28 px | 24 px |
| Tiêu đề mục | 22 px | 20 px |
| Tiêu đề thẻ | 18 px | 18 px |
| Câu hỏi luyện tập/thi | 20 px | 20 px |
| Tiêu đề khối giới thiệu | 30 px | 26 px |
| Tiêu đề giới thiệu đăng nhập | 36 px | 30 px |
| Số liệu thống kê | 30 px | 30 px |

Nội dung dùng giãn dòng khoảng 1,7, chú thích/nhãn khoảng 1,5–1,6; tiêu đề bớt ép khoảng cách ký tự. Giới hạn chiều dài mô tả, cho tiêu đề/thao tác xuống hàng khi thiếu chỗ. Thẻ thống kê đặt số liệu trên hàng riêng; bộ lọc đặt nhãn phía trên trường chọn và tự xuống hàng. Chữ phụ của bảng/chương/thống kê dùng màu đậm hơn `#586b60`. Quy tắc áp dụng cả ôn/thi và thẻ cấp độ; không thu chú thích xuống 8–11 px trên mobile.

## Bố cục và thành phần

- Desktop dùng sidebar xanh rừng, vùng nội dung sáng và thanh đầu trang có tài khoản/lớp đang chọn.
- Mobile dùng điều hướng cuộn ngang, thẻ chương một cột ở màn hình hẹp, bảng tài khoản chuyển thành thẻ. Không cắt thao tác hoặc tạo cuộn ngang toàn trang.
- Đăng nhập gồm vùng giới thiệu và biểu mẫu; có hai nút vào nhanh với tên tài khoản mặc định từ database. Trên điện thoại hai nút xếp dọc.
- Thẻ thống kê, chương, bảng và modal dùng cùng màu, khoảng cách và trạng thái tải/lỗi/trống. Điều hướng hiện tại có `aria-current`, nhãn form đọc được và nút đủ lớn để chạm.
- Hoạt động nhóm có tổng quan, tìm/lọc, tiến độ, hạn nộp, yêu cầu và danh sách nhóm dễ phân biệt. Đây là cách trình bày; quyền nộp/đại diện/deadline nằm ở tài liệu chức năng.
- Giao diện ôn tập/kiểm tra mới tiếp tục hệ thống thành phần này; tránh đưa thuật ngữ backend hoặc dữ liệu kỹ thuật vào luồng học sinh.

## Ảnh trường logo và minh họa

Ảnh nền mới nhất: `public/assets/nguyen-khuyen-background-v11.png`, lưu bản nguồn và prompt ở `output/imagegen/nguyen-khuyen-background-v11.png` và `nguyen-khuyen-background-v11-prompt.txt`. Chỉnh bằng ImageGen tích hợp từ ảnh v8: bỏ huy hiệu khỏi nền, tăng cỡ dòng “TRƯỜNG THPT NGUYỄN KHUYẾN”, rồi đẩy cao thêm theo vùng người dùng đánh dấu. Bản v11 có tên trường lớn sát vùng trời phía trên, chừa lề và giữ dấu tiếng Việt. Giữ bố cục hai dãy lớp hình chữ V, phượng đỏ, không có cổng; cột cờ ở vị trí đã chọn. V8/v9/v10 và prompt giữ lại để đối chiếu.

Ảnh trường dùng cả đăng nhập và các trang bên trong. Theo yêu cầu giảm độ mờ để rõ hơn: đăng nhập blur 1 px, bên trong blur 3 px. Giữ lớp phủ sáng bên trong khoảng 89,8% (độ hiện ảnh 10,2%). `.app-shell::before` cố định, bắt đầu phía dưới thanh đầu trang để tên trường không bị che; desktop/tablet hiển thị ảnh theo chiều rộng để không cắt tên trường, mobile dùng cover. Lớp nền không nhận tương tác; chỉ nền bị mờ, nội dung/thẻ/form vẫn rõ. Rà soát 1440/768/390/360 px, ảnh kiểm tra `.local/ui-school-v11/`. Ghi chú blur 5/1,5 px bên dưới là lịch sử.

Logo trường riêng vẫn hiển thị cạnh tên GreenEdu ở đăng nhập và sidebar của cả ba vai trò, qua `Logo school`. `.school-crest` tiếp tục cắt huy hiệu bằng CSS từ ảnh v8 `public/assets/nguyen-khuyen-background.png` (x=832, y=70, cạnh 166 px trên ảnh 1672×941); không dùng ảnh nền v11 đã bỏ huy hiệu. Dòng phụ ghi “THPT NGUYỄN KHUYẾN”. Logo 58 px ở đăng nhập/48 px ở sidebar desktop, 48/38 px trên mobile; có alt tiếng Việt. Giữ nguyên ảnh v8 để logo riêng luôn đúng.

Minh họa cây/mầm từ sách: `public/assets/knowledge-garden-v1.webp` khoảng 277 KB; ảnh gốc `.png` cùng tên. Prompt `output/imagegen/knowledge-garden-v1-prompt.txt`. `GardenIllustration` dùng ở đăng nhập, tổng quan và banner Admin; không thay cây cấp độ SVG vì cây đó phản ánh tiến độ.

## Avatar

### Icon cấp học sinh theo lớp/môn — 11/10/2026

Bộ năm icon SVG riêng theo tên mới người dùng chọn: **Mầm → Chồi → Cây Non → Đơm Hoa → Kết Trái**, triển khai tại `src/StudentLevel.tsx`, CSS tại `src/student-level.css`. Mầm là hạt nảy mầm, Chồi có hai lá nhỏ, Cây Non có thân/tán nhỏ, Đơm Hoa có hoa hồng nhạt/nhụy vàng trên tán, Kết Trái có quả vàng cam và lá nhỏ trên tán lớn. Dùng nền tròn xanh nhạt, nét xanh rừng, thân màu đất, cùng hệ màu ứng dụng. SVG có nhãn đọc được “Cấp N · tên cấp”; không phụ thuộc ảnh tải ngoài. Bộ Mầm/Chồi/Lá/Cây/Đại thụ trước đây là lịch sử, đã thay tên/hình cho cấp 3–5.

Huy hiệu nhỏ nằm cạnh thông tin học sinh trên thanh tài khoản, trong danh sách lớp và xếp hạng. Thẻ cấp độ ở trang học sinh/Tài khoản cho thấy icon lớn, tên lớp/môn, năm bước, mốc giờ và tiến độ tới cấp tiếp theo. Bước hiện tại có viền/nền và `aria-current`; thanh tiến độ có nhãn/giá trị. Điện thoại ≤600 px chia năm bước thành ba cột/hai hàng, giữ chữ 13 px và hiển thị đủ cả năm mốc. Cấp độ đổi theo lớp/môn được chọn; avatar cá nhân vẫn hiển thị cùng huy hiệu.

Quy tắc thời gian và phân tách lớp/môn tại [student-levels.md](student-levels.md). Ảnh kiểm tra `.local/ui-<desktop|mobile>-student-level-<1..5>.png`.

Bộ 40 avatar chibi gồm 16 giáo viên, 8 học sinh và 16 thiên nhiên. Ảnh atlas: `public/assets/avatars-teachers-v1.png`, `avatars-students-v1.png`, `avatars-nature-v1.png`. Prompt tại `output/imagegen/avatars-v1-prompts.txt` và `avatars-nature-v1-prompt.txt`; danh mục tại `shared/avatars.ts`, hiển thị tại `src/Avatars.tsx`.

Giáo viên thấy cả 40; học sinh thấy 24 avatar học sinh/thiên nhiên. Bộ thiên nhiên gồm hạt/mầm/chồi/lá/tre/cây/hoa/sen đá; lọc theo bộ và có xem trước. Ảnh tự tải căn giữa trong khung tròn; có xem trước/hủy/thay ảnh/dùng lại/chữ viết tắt. Avatar hiển thị trên thanh tài khoản, hồ sơ, danh sách tài khoản/học sinh và thành viên nhóm. Giới hạn file, quyền API, migration và cách lưu nằm ở `docs/user-avatars.md`.

## Đề mục và giao diện ôn thi

Theo yêu cầu mới, các đề mục dùng **Trang**: Trang quản trị, Trang giáo viên, Trang học tập, Trang cộng tác và Trang học tập xanh. Quy tắc áp dụng sidebar, breadcrumb, lời giới thiệu và đề mục tổng quan.

src/Learning.tsx / src/learning.css dùng thẻ cấp độ/điều kiện/vé, ma trận và lịch thi, danh sách kết quả/thưởng. Desktop phòng thi có danh sách số câu bên trái; mobile đưa danh sách lên trên. Đáp án đã chọn và câu hiện tại có trạng thái riêng; đồng hồ và trạng thái lưu đặt ở đầu. Câu trả lời/lời giải dùng cùng thành phần luyện tập hiện có.

## Kiểm tra khi thay đổi giao diện

Kiểm tra desktop 1440 px, tablet 768 px và mobile 390/360 px: không tràn ngang, font/ảnh tải được, modal thao tác được, trạng thái lỗi/trống/tải không mất bố cục. Kiểm tra cả ba vai trò và trang đăng nhập; chọn/lưu/tải lại avatar và đường dẫn nội bộ. Ảnh kiểm tra nằm trong `.local/`, không đưa vào Git.

Các thư mục kiểm tra đã dùng: `.local/ui-design/`, `.local/ui-school-background/`, `.local/ui-*-quick-login.png`, `.local/ui-*-avatar-upload-*.png`, `.local/ui-*-avatars-nature-*.png`. Khi server đang chạy, build thử vào `.local/<tên-build>` và dùng `E2E_DIST_DIR`, không thay `dist` trước khi backend được deploy tương ứng.

## Lịch sử và tài liệu nguồn

Ảnh/prompt trong `output/imagegen/` giữ nguyên để đối chiếu. Các ghi chú thiết kế trước đây trong tài liệu bàn giao/tiến độ được gom ở phần dưới, mang tính lịch sử; trạng thái deploy thực tế luôn theo `docs/session-handoff.md` và script deploy.

### Ghi chú từ docs/session-handoff.md

#### Nền trường trong các trang bên trong — 11/10/2026

Theo yêu cầu mới nhất, ảnh trường cũng làm background cho các trang sau đăng nhập (Admin/giáo viên/học sinh), thay cho lựa chọn cũ chỉ dùng ở đăng nhập. `src/design.css` thêm lớp nền cố định `.app-shell::before`, dùng ảnh `nguyen-khuyen-background.png`, blur 5 px và phủ sáng khoảng 92%. Chỉ ảnh nền bị làm mờ; chữ, thẻ, bảng và biểu mẫu giữ rõ nét. Lớp nền không nhận tương tác.

Build vào `.local/school-background-build` đạt. Đã rà soát Admin/giáo viên/học sinh, các trang chức năng và modal trên desktop 1440 px/mobile 390 px bằng database riêng, không tràn ngang/lỗi JavaScript. Ảnh kiểm tra ở `.local/ui-school-background/`. Chưa deploy thay đổi này; không thay `dist` đang chạy, không ghi database chính hoặc restart server.

### Ghi chú từ docs/session-handoff.md

#### Làm mới giao diện bằng ImageGen — 11/10/2026

Theo yêu cầu thiết kế giao diện, đã đọc bối cảnh và giữ checkout/staging hiện có. Thêm `src/design.css` sau CSS cũ: sidebar xanh rừng trên desktop, nền trắng xanh sáng, chữ và nút rõ hơn, thẻ thống kê/chương học và giao diện Admin đồng bộ. Mobile giữ điều hướng cuộn ngang, thẻ chương một cột ở màn hình nhỏ và tài khoản dạng thẻ. Điều hướng có `aria-current`.

ImageGen tích hợp tạo minh họa cây/mầm non mọc từ sách, nền trong suốt. Ảnh gốc ở `public/assets/knowledge-garden-v1.png`; bản dùng trong app `public/assets/knowledge-garden-v1.webp` khoảng 277 KB. Prompt đầy đủ ở `output/imagegen/knowledge-garden-v1-prompt.txt`. Component `GardenIllustration` dùng trên đăng nhập, tổng quan giáo viên/học sinh và banner Admin. Cây tiến độ vẫn dùng SVG theo cấp thực tế; ảnh trường cũ vẫn chỉ ở trang đăng nhập.

Kiểm tra: TypeScript/Vite build đạt; 18/18 E2E desktop/mobile đạt bằng database riêng. Rà soát thêm đăng nhập/Admin/giáo viên/học sinh và các phân hệ ở 1440/768/390/360 px, không tràn ngang hoặc lỗi JavaScript; ảnh đã giải mã và tải thành công. Ảnh rà soát tại `.local/ui-design/`. Sandbox Windows chặn realpath của Vite và lượt chạy trình duyệt; các lệnh cần thiết đã chạy thành công qua escalation. Không ghi dữ liệu thử vào database chính.

Trạng thái kiểm tra mới nhất: `npm run deploy:status` báo **stopped (no managed server)**. Ghi chú “đang chạy cổng 3002” bên dưới là lịch sử, không còn là xác nhận hiện tại. Lần này chỉ sửa/build/kiểm thử giao diện, chưa chạy deploy, không commit/push. Khi người dùng yêu cầu triển khai, chạy `npm run deploy` theo AGENTS.md và kiểm tra URL/cổng thực tế.

### Ghi chú từ docs/project-status.md

Ngày 11/10 làm mới giao diện theo yêu cầu: sidebar xanh rừng, thẻ thống kê/chương học, biểu mẫu đăng nhập và giao diện Admin đồng bộ trong `src/design.css`. ImageGen tích hợp tạo minh họa khu vườn mọc từ trang sách; app dùng ảnh WebP nền trong suốt khoảng 277 KB. Giữ ảnh trường chỉ ở trang đăng nhập và cây tiến độ SVG theo dữ liệu. Build đạt, 18/18 E2E đạt; rà soát thêm 1440/768/390/360 px không tràn ngang/lỗi JavaScript, database thử riêng. Ảnh xem trước tại `.local/ui-design/`; prompt tại `output/imagegen/knowledge-garden-v1-prompt.txt`. Chưa deploy đợt giao diện này. Kiểm tra mới nhất `npm run deploy:status` báo **stopped (no managed server)**, thay cho mô tả “đang chạy” ở các ghi chú lịch sử bên dưới.

### Ghi chú từ docs/project-status.md

#### Ảnh nền trường — 10/10/2026

- Đã dùng ảnh đã chọn `output/imagegen/nguyen-khuyen-background-header-v8.png` làm nền **chỉ trang đăng nhập**, bản phục vụ giao diện ở `public/assets/nguyen-khuyen-background.png`. Sau khi đăng nhập, các trang học tập/quản lý dùng nền sáng như trước theo lựa chọn mới nhất của người dùng.
- CSS làm mờ riêng lớp nền `1.5px` và phủ màu sáng; chữ, biểu mẫu và nút giữ nguyên độ nét. Ảnh hiển thị theo chiều rộng để không cắt tên trường/logo, các vùng ngoài ảnh dùng nền sáng. Hai khối đăng nhập có nền trong nhẹ để thấy ảnh bên dưới.
- `npm run build` đạt. Đã kiểm tra trực quan trang đăng nhập desktop/mobile và trang giáo viên với dữ liệu API giả chỉ phục vụ kiểm tra giao diện: ảnh tải được, không tràn ngang và không có lỗi JavaScript. Không chạy lại demo hoặc thay đổi database.

### Lưu trữ từ docs/session-handoff.md khi gom tài liệu

#### Tăng độ hiện nền và logo trường — 11/10/2026, 10:13

Đã tăng độ hiện của nền bên trong thêm 30% tương đối: độ hiện từ 7,84% lên 10,2%, lớp phủ sáng từ `#eb` xuống `#e5`, vẫn blur 5 px. Đăng nhập và sidebar Admin/giáo viên/học sinh dùng `Logo school`, hiển thị huy hiệu từ ảnh trường đã chọn cạnh GreenEdu và tên trường. Cắt bằng CSS để giữ đúng huy hiệu trong ảnh hiện có; chi tiết/tọa độ tại `docs/app-design.md`. Không tạo lại logo bằng AI.

Build riêng đạt; rà soát các trang/biểu mẫu/modal của cả ba vai trò ở 1440/768/390/360 px bằng database riêng: logo tải được, không tràn ngang/lỗi JavaScript. Ảnh tại `.local/ui-school-brand/`. Đã tự chạy `npm run deploy` theo quyền thường trực, bản **http://localhost:3002**, PID khi kiểm tra 91992, `demo:false`, `quickLogin:true`. Backup `.local/backups/database-20261011-101333-212.sqlite`. Build/deploy/status/health đạt, HTML khớp build, ảnh trường và CSS logo/nền mới được phục vụ đúng. Không ghi dữ liệu thử vào database chính, không commit/push.

### Lưu trữ từ docs/session-handoff.md khi gom tài liệu

#### Avatar học sinh/giáo viên — 11/10/2026

Tiếp tục theo yêu cầu thêm mầm/chồi/lá/cây: bộ sưu tập hiện có **40 avatar**, thêm 16 chibi thiên nhiên cho cả học sinh và giáo viên. Thêm nút lọc **Mầm, chồi & cây** và các bộ khác để dễ chọn trên điện thoại; thứ tự bộ đầu tiên theo vai trò được giữ. Ảnh nguyên bản image_gen tại `public/assets/avatars-nature-v1.png`, prompt tại `output/imagegen/avatars-nature-v1-prompt.txt`. API dùng danh mục chung nên lưu được ID mới, không cần đổi database. Build và kiểm thử API danh mục/lưu/quyền sở hữu/giữ dữ liệu đạt. Chưa deploy.

Kiểm tra bổ sung bộ thiên nhiên: 4/4 E2E desktop/mobile đạt, gồm lọc/xem trước/lưu/tải lại/khôi phục; ảnh giao diện tại `.local/ui-*-avatars-nature-*.png` đã được rà soát. Database riêng, không ghi vào database chính.

Đã bổ sung 24 avatar chibi: 16 chủ đề giáo viên và 8 học sinh. Trang Tài khoản có chọn/xem trước/lưu/khôi phục chữ viết tắt; bấm avatar trên thanh đầu trang để mở. Bộ giáo viên được đặt trước cho giáo viên, bộ học sinh trước cho học sinh. Lựa chọn được lưu riêng theo tài khoản và hiển thị ở hồ sơ, danh sách học sinh, danh sách tài khoản Admin và thành viên nhóm. Xem `docs/user-avatars.md`.

Migration thêm bảng `user_avatars`, không thay schema tài khoản hoặc dữ liệu học tập. API chỉ cập nhật avatar của người đăng nhập và kiểm tra ID theo danh mục. Ảnh atlas nguyên bản do image_gen tạo ở `public/assets/avatars-teachers-v1.png` và `avatars-students-v1.png`; prompt ở `output/imagegen/avatars-v1-prompts.txt`.

Build đạt, 39 backend tests đạt, 4 kịch bản avatar desktop/mobile đạt; đã xem ảnh giao diện. Database kiểm thử riêng. Lần kiểm tra `npm run deploy:status` trong phiên này trả “GreenEdu is stopped (no managed server)”, khác với trạng thái triển khai trong bàn giao cũ bên dưới. Chưa chạy deploy cho thay đổi avatar; kiểm tra status thực tế khi tiếp tục. Giữ các thay đổi có sẵn, không commit/push.

### Lưu trữ từ docs/session-handoff.md khi gom tài liệu

Ảnh nền đã chọn là `output/imagegen/nguyen-khuyen-background-header-v8.png`, được phục vụ ở `public/assets/nguyen-khuyen-background.png`. Theo lựa chọn mới nhất của người dùng, ảnh nền **chỉ xuất hiện trên trang đăng nhập**, các trang sau đăng nhập dùng nền sáng. `src/styles.css` áp dụng lớp nền riêng cho `.login-page`, làm mờ `1.5px`, phủ sáng và hiển thị theo chiều rộng để không cắt tên trường/logo. Build và kiểm tra trực quan đăng nhập desktop/mobile, giao diện giáo viên đã đạt; dữ liệu API giả chỉ dùng trong kiểm tra giao diện.

### Lưu trữ từ docs/session-handoff.md khi gom tài liệu

- Nhóm đã có thẻ tổng quan, tìm kiếm, lọc trạng thái, tiến độ nộp, hạn nộp nổi bật, bố cục riêng cho yêu cầu và danh sách nhóm, bộ lọc nhóm chưa/đã nộp, avatar thành viên và lịch sử sản phẩm. Giữ nguyên chia nhóm, quyền đại diện, file/Word, deadline theo server, retry và gia hạn.

### Lưu trữ từ docs/session-handoff.md khi gom tài liệu

- Rà soát các trang giáo viên/học sinh trên desktop/mobile bằng API thật. Tăng cỡ chữ điều hướng, bảng/câu hỏi/chương/tiến độ; thẻ chương một cột trên điện thoại nhỏ; tài khoản Admin dạng thẻ trên mobile. Ảnh nền vẫn chỉ ở trang đăng nhập.

### Lưu trữ từ docs/project-status.md khi gom tài liệu

Ngày 11/10 lúc 10:13 đã tăng độ hiện nền trường bên trong thêm 30% (7,84% → 10,2%, giữ blur 5 px), đặt logo trường cạnh GreenEdu ở đăng nhập và sidebar cả ba vai trò. Giữ huy hiệu từ ảnh đã chọn qua CSS, không tái tạo bằng AI. Build và rà soát 1440/768/390/360 px với database riêng đạt. Đã deploy tại **http://localhost:3002**, status/health/frontend/ảnh/CSS mới đạt; `demo:false`, `quickLogin:true`, PID 91992 khi kiểm tra. Backup `.local/backups/database-20261011-101333-212.sqlite`. Thiết kế chi tiết tại [app-design.md](app-design.md).

### Lưu trữ từ docs/project-status.md khi gom tài liệu

Ngày 11/10 theo yêu cầu mới, bổ sung ảnh trường làm nền rất mờ trên các trang sau đăng nhập cho cả 3 vai trò: blur 5 px, phủ sáng khoảng 92%, nội dung/thẻ/bảng giữ rõ nét. Lựa chọn này thay cho quy tắc cũ chỉ dùng nền trường ở đăng nhập. Build riêng `.local/school-background-build` đạt; rà soát desktop/mobile bằng database riêng không tràn ngang/lỗi JavaScript. Chưa deploy, không thay frontend `dist` đang chạy. Ảnh kiểm tra ở `.local/ui-school-background/`.

### Lưu trữ từ docs/project-status.md khi gom tài liệu

Ngày 11/10 mở rộng bộ avatar lên **40 lựa chọn**: thêm 16 chibi mầm, chồi, lá, tre, cây, hoa và sen đá cho giáo viên/học sinh. Trang Tài khoản có lọc theo bộ sưu tập, gồm **Mầm, chồi & cây**. Giữ nguyên avatar đã chọn trước đó; không cần migration mới. Ảnh/prompt và cách dùng ở [avatar tài khoản](user-avatars.md). Chưa deploy đợt bổ sung này.

### Lưu trữ từ docs/project-status.md khi gom tài liệu

- **Giao diện chung:** tăng cỡ chữ quá nhỏ ở điều hướng, bảng, lựa chọn/câu hỏi, chương và tiến độ. Thẻ chương một cột trên màn hình nhỏ; danh sách tài khoản có thẻ mobile hiển thị đủ trạng thái/thao tác. Rà soát các trang tổng quan, lớp, câu hỏi, luyện tập, sửa sai, tiến độ, vườn, xếp hạng, tài khoản và nhóm trên desktop/mobile; không phát hiện tràn ngang hoặc lỗi JavaScript trong các luồng đã chạy. Ảnh nền chỉ trang đăng nhập.

### Lưu trữ từ docs/user-avatars.md khi gom tài liệu

# Avatar tài khoản

Cập nhật 11/10/2026.

Giới hạn upload hiện tại là **3 MB**, đã tự deploy tại **http://localhost:3002** lúc 10:12 ngày 11/10/2026. Build, 2/2 kiểm thử API và 4/4 E2E desktop/mobile đạt; API nhận đúng 3 MB và từ chối vượt 1 byte, trình duyệt tải/lưu ảnh PNG 2,5 MB thành công. Kiểm thử dùng database riêng; health và kiểm tra dữ liệu sau deploy đạt.

Đã triển khai cả tải ảnh cá nhân và giới hạn avatar theo vai trò tại **http://localhost:3002** lúc 10:05 ngày 11/10/2026. Các ghi chú “chưa deploy” trong kết quả kiểm thử bên dưới là trạng thái lịch sử trước lần triển khai này. Theo yêu cầu hiện tại, agent tự deploy sau khi hoàn tất thay đổi ứng dụng và kiểm thử đạt.

Học sinh và giáo viên vào **Tài khoản → Avatar của bạn**, chọn hình để xem trước rồi bấm **Lưu avatar**. Có thể bấm avatar trên thanh đầu trang để mở trang này. Chọn **Dùng chữ viết tắt** rồi lưu nếu muốn khôi phục kiểu cũ.

#### Tải ảnh cá nhân

Trong bản mã mới, bấm **Tải ảnh của bạn**, chọn ảnh, xem trước rồi **Lưu avatar**. Hỗ trợ JPG, PNG, WebP tối đa 3 MB (3 × 1024 × 1024 byte) và 4096 × 4096 pixel. Ảnh được căn giữa trong khung tròn; file gốc không được chỉnh sửa. Có thể hủy ảnh đang chọn, chọn avatar trong bộ sưu tập hoặc dùng lại **Dùng ảnh đã tải**. Tải ảnh mới thay ảnh cá nhân trước đó; mỗi tài khoản lưu một ảnh cá nhân.

API `POST /api/auth/avatar/upload` nhận multipart với một trường file `avatar`, kiểm tra dung lượng/chữ ký ảnh/kích thước và cập nhật ảnh/lựa chọn trong cùng transaction. Ảnh lưu trong bảng `avatar_uploads` nên backup database bao gồm ảnh; migration chỉ thêm bảng. `GET /api/avatars/:id` yêu cầu đăng nhập, cho phép chủ ảnh, Admin và thành viên/giáo viên có lớp chung xem. ID ảnh mới sau mỗi lần thay giúp giao diện tải đúng ảnh. Người khác không thể dùng ID ảnh tải lên của tài khoản khác để thay avatar của mình.

Kiểm tra tải ảnh: build đạt, 44 backend tests đạt, 4/4 E2E desktop/mobile đạt (PNG/JPG, xem trước/lưu/tải lại, giữ ảnh cá nhân khi chọn bộ sưu tập, chọn lại ảnh cũ, khôi phục và lỗi file). Kiểm tra API gồm WebP, phân quyền, khác nguồn, quá dung lượng, sai định dạng/nhiều file/trường thừa, ảnh thay thế và giữ dữ liệu sau mở lại database. Đã rà soát ảnh giao diện. Chưa deploy phần tải ảnh; server cổng 3002 đang dùng bản 40 avatar trong bộ sưu tập.

- Bộ sưu tập có 40 avatar: 16 chibi giáo viên, 8 chibi học sinh và 16 chibi thiên nhiên. Giáo viên chọn được cả 40; học sinh chỉ thấy/chọn 24 avatar học sinh và thiên nhiên, vẫn dùng được ảnh cá nhân. Bộ giáo viên được ẩn hoàn toàn khỏi học sinh. Dùng các nút lọc để mở riêng một bộ, hoặc **Tất cả** để xem các lựa chọn dành cho vai trò của mình.
- Bộ **Mầm, chồi & cây** gồm hạt mầm, mầm hai lá, chồi non, búp lá, lá tim, lá phong, trầu bà, chồi tre, chậu cây, bụi cây, cây non, cây xanh, cây hoa, hướng dương, sen đá và hạt sồi nảy mầm.
- Chủ đề giáo viên gồm áo dài/sách, Toán, Hóa, Vật lý, Ngữ văn, Lịch sử, Ngoại ngữ, Tin học, Âm nhạc, Mỹ thuật, Tiểu học, Thể dục, gieo mầm và chủ nhiệm.
- Avatar được giữ sau tải lại, đăng nhập lại và khởi động lại server. Hiển thị ở hồ sơ, danh sách học sinh, danh sách tài khoản Admin và thành viên nhóm. Tài khoản cũ tiếp tục dùng chữ viết tắt đến khi tự chọn hình.
- API `POST /api/auth/avatar` chỉ cập nhật tài khoản đang đăng nhập; nhận `avatarId` trong danh mục được phép, ID ảnh tự tải của chính tài khoản hoặc `null` để khôi phục. Học sinh gửi ID avatar giáo viên bị từ chối 403, kể cả tự gửi vai trò giáo viên trong body. Không nhận URL ảnh tùy ý. Tài khoản có mật khẩu tạm phải đổi mật khẩu trước.
- Khi mở database bằng mã mới, lựa chọn avatar giáo viên của học sinh từ trước quy tắc này được xóa để về chữ viết tắt. Avatar hợp lệ khác, tài khoản và tiến độ giữ nguyên. Quy tắc đã áp dụng trong bản triển khai lúc 10:05 ngày 11/10.
- Migration thêm bảng `user_avatars`, không đổi schema `users`, mật khẩu, vai trò hay tiến độ. Lựa chọn avatar không thay đổi vai trò tài khoản.

Ảnh được tạo bằng công cụ image_gen tích hợp, dùng nguyên bản dưới dạng atlas CSS: [giáo viên](../public/assets/avatars-teachers-v1.png), [học sinh](../public/assets/avatars-students-v1.png). Prompt lưu tại [avatars-v1-prompts.txt](../output/imagegen/avatars-v1-prompts.txt). Danh mục dùng chung cho giao diện/API tại `shared/avatars.ts`.

Ảnh thiên nhiên: [avatars-nature-v1.png](../public/assets/avatars-nature-v1.png), tạo bằng image_gen tích hợp; [prompt](../output/imagegen/avatars-nature-v1-prompt.txt). Mỗi bộ khai báo ảnh/số hàng atlas trong danh mục chung; giữ nguyên ID và ảnh của 24 avatar trước.

Kiểm tra: build đạt; 39 kiểm thử backend đạt; 4 kịch bản avatar desktop/mobile đạt, bao gồm chọn/lưu, tải lại, khôi phục, tải ảnh và bố cục không tràn ngang. Kiểm thử dùng database riêng.

Sau khi thêm bộ thiên nhiên: build đạt, kiểm thử API chạy qua toàn bộ 40 ID đạt; 4/4 kịch bản desktop/mobile đạt thêm lọc bộ thiên nhiên, xem trước, chọn/lưu avatar mới, tải lại giữ lựa chọn và khôi phục. Đã rà soát ảnh giao diện; không tràn ngang. Chưa deploy.

Sau khi giới hạn avatar theo vai trò: 45 backend tests và 4/4 E2E desktop/mobile đạt. Kiểm tra toàn bộ 16 ID giáo viên bị chặn cho học sinh, giữ avatar hiện tại sau yêu cầu bị từ chối; migration giữ avatar hợp lệ và tiến độ. UI học sinh không có bộ/nút/avatar giáo viên; thiên nhiên và upload vẫn hoạt động. Build kiểm thử ở `.local/avatar-role-build`, không thay `dist` đang được phục vụ.

### Lịch sử thiết kế v11 từ bàn giao

#### Áp dụng ảnh nền v11, tên trường lớn và cao hơn — 11/10/2026, 10:32

Theo chuỗi yêu cầu mới nhất, đã dùng ImageGen tích hợp bỏ huy hiệu khỏi ảnh nền, tăng cỡ tên trường, đẩy tên lên vùng đánh dấu rồi tăng/cao thêm theo phản hồi. Ảnh cuối `public/assets/nguyen-khuyen-background-v11.png`; nguồn/prompt ở `output/imagegen/nguyen-khuyen-background-v11.png` và `nguyen-khuyen-background-v11-prompt.txt`. Giữ logo riêng ở đăng nhập/sidebar lấy từ ảnh v8 cũ. Nền bên trong giảm blur 5→3 px, đăng nhập 1,5→1 px; giữ phủ sáng bên trong 89,8%. Desktop/tablet hiển thị ảnh theo chiều rộng và bắt đầu dưới thanh đầu trang để không cắt/che tên trường.

Build riêng và rà soát cuối đăng nhập/cả ba vai trò/các trang/modal ở 1440/768/390/360 px đạt: ảnh/logo tải đúng, không tràn ngang/lỗi JavaScript, database thử riêng. Ảnh kiểm tra `.local/ui-school-v11/`. Đã chạy `npm run deploy` theo yêu cầu áp dụng và quyền thường trực: **http://localhost:3002**, PID 92576 khi kiểm tra, `demo:false`, `quickLogin:true`. Backup `.local/backups/database-20261011-103225-851.sqlite`. Build/status/health đạt, HTML khớp build, CSS và ảnh v11 được phục vụ đúng. Không ghi dữ liệu thử vào database chính, không commit/push. V9 đã được deploy trước khi người dùng tiếp tục chỉnh vị trí, hiện thay bởi v11; các ảnh/prompt trung gian giữ để đối chiếu.

### Lịch sử từ tiến độ

Ngày 11/10 lúc 10:32 đã áp dụng ảnh nền **v11** theo phản hồi: bỏ logo trong nền, tên trường lớn và cao sát vùng trời trên; giữ logo riêng ở đăng nhập/sidebar. Blur giảm còn 3 px bên trong/1 px đăng nhập. Build và rà soát 4 kích thước desktop/tablet/mobile bằng database riêng đạt. Đã deploy tại **http://localhost:3002**, PID 92576 khi kiểm tra, `demo:false`, `quickLogin:true`; status/health/frontend/CSS/ảnh cuối đạt. Backup `.local/backups/database-20261011-103225-851.sqlite`. Nguồn/prompt và cấu hình tại [app-design.md](app-design.md).

### Lịch sử bộ avatar từ tiến độ

Ngày 11/10 bổ sung bộ 24 avatar chibi (16 giáo viên, 8 học sinh), tự chọn/xem trước/lưu/khôi phục ở Tài khoản. Avatar được lưu theo người dùng và hiển thị ở hồ sơ, danh sách học sinh, danh sách tài khoản và thành viên nhóm. Bộ giáo viên được ưu tiên cho giáo viên. Build, 39 kiểm thử backend và 4 kịch bản avatar desktop/mobile đạt; dùng database riêng. Xem [avatar tài khoản](user-avatars.md). Chưa deploy thay đổi này; kiểm tra trạng thái trong phiên avatar trả “stopped (no managed server)”, nên dùng `npm run deploy:status` để xác nhận thực tế thay vì dựa vào ghi chép triển khai cũ bên dưới.
