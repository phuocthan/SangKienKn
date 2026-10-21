# Tiến độ và lộ trình GreenEdu

## Phát hành CSV thống kê — 21/10/2026

Theo yêu cầu deploy, chốt bản CSV khớp bảng giáo viên và tên file kèm tên lớp lên main cho Railway tự triển khai. Fetch trước phát hành xác nhận main/origin main cùng930fdf7, không có thay đổi remote cần ghép. Chỉ gồm frontend, test và tài liệu; không sửa backend/database. Đã đối chiếu report của lượt trước: 10/10 E2E thống kê, 2/2 xác nhận tên file, build/diff check đạt; không báo các lượt này thành QA chạy mới khi push. Các ghi chú chưa push bên dưới là trạng thái trước yêu cầu phát hành. Chỉ xác nhận production sau khi kiểm tra SHA deployment và bundle thực tế.

## Tên file CSV kèm tên lớp — 21/10/2026

Theo yêu cầu bổ sung, tên file CSV trong thống kê có tên lớp ở trước phạm vi học sinh/kỳ/ngày: ví dụ `greenedu-thong-ke-lop-11-2-ca-lop-day-2026-10-21.csv`. Tên lớp được chuyển không dấu và thay dấu cách, dấu /, ký tự đặc biệt bằng dấu gạch ngang để lưu được trên Windows; nội dung file vẫn giữ nguyên tiếng Việt. Áp dụng cả xuất cả lớp và cá nhân. Giữ toàn bộ thay đổi CSV trước đó; chưa push/deploy.

QA bổ sung: build TypeScript/Vite và diff check đạt; 2/2 E2E desktop/mobile đạt (17,9 giây), xác nhận tên lớp có dấu, / và ♥ được chuẩn hóa, tên file cả lớp/cá nhân đúng và nội dung vẫn khớp bảng. Report `.local/statistics-csv-20261021/filename-report.json`, server3338/SQLite e2e riêng; không ghi dữ liệu Railway.

## CSV thống kê khớp nội dung giáo viên đang xem — 21/10/2026

Xuất CSV trong popup Thống kê thời gian học dùng chính snapshot đang hiển thị và cùng các hàm định dạng ngày/thời gian của giao diện. File gồm lớp/môn/học sinh/kỳ/ngày xem, tổng ngày–tuần–tháng/tích lũy/mốc theo dõi, bảng từng học sinh khi xem cả lớp và bảng thời gian theo kỳ. Giữ thứ tự học sinh và kỳ mới nhất trước như màn hình; thời gian là giờ–phút–giây, ngày theo Việt Nam, kỳ không có lịch sử ghi Chưa có lịch sử. Bỏ dạng dữ liệu thô lặp mỗi học sinh theo từng kỳ, mã nội bộ và giây chưa định dạng. Quyết định này thay mô tả ô thiếu lịch sử để trống ở bản thiết kế cũ.

Giữ BOM UTF-8, escape dấu phẩy/ngoặc kép, chống công thức trong tên và khóa xuất khi tải/lỗi/rỗng. Chỉ sửa frontend của popup; nút xuất tiến độ ở ngoài danh sách học sinh vẫn là báo cáo riêng. Không sửa API/database hoặc thay cách tính thời gian. Local5173 dùng API/database Railway như mặc định; chưa push/deploy.

QA mới: TypeScript/Vite build đạt tại `.local/statistics-csv-20261021/build`; Prettier và diff check đạt. **10/10 E2E desktop/mobile đạt (46,7 giây)**: đối chiếu từng ô CSV với hai bảng trên màn hình cho Ngày/Tuần/Tháng, cả lớp/cá nhân, tổng tích lũy khác 0, kỳ chưa có lịch sử, BOM/escape/chống công thức, tải lại và lỗi/khóa xuất/lớp rỗng. Hai lượt đầu vướng assertion mới của test (cố định giây dù ca desktop đã ghi thêm thời gian; sau đó innerText ở details đóng trả rỗng); đã đổi sang mở Cách tính thời gian và so với giá trị thật, giữ các assertions đầy đủ. Test cũng thay kỳ vọng lời giải thích cũ bằng quy tắc triển khai hiện hành. Không đổi runtime sau build. Report cuối `.local/statistics-csv-20261021/final-report.json`; server3338 và SQLite e2e riêng, không ghi Railway. Đã bật lại frontend local5173, HTTP200 và health proxy ok=true/demo=false/quickLogin=false; chỉ đọc health, không đăng nhập hoặc tạo dữ liệu thật. Chưa commit/push/deploy.

## Lưu bộ thiết kế và tài liệu lên Git — 20/10/2026

Theo yêu cầu “push git”, bổ sung các poster giới thiệu/hồ sơ v1–v8, nguồn icon 3D đã duyệt, tài liệu thiết kế/bàn giao và đề xuất ảnh câu hỏi vào Git. Poster hiện hành là v8; các bản trước giữ làm lịch sử. Bộ icon ứng dụng đã phát hành ở commit 4e0823b và đã xác minh Railway thành công; lượt này chỉ lưu tài liệu/nguồn thiết kế, không sửa runtime hoặc dữ liệu. Các ghi chú “chưa push” trong nhật ký bên dưới mô tả thời điểm trước đợt Git này.

Không chạy lại build/E2E cho đợt chỉ thay tài liệu và artifact; kết quả 12/12 của bản icon bên dưới thuộc lượt kiểm thử trước. Kiểm tra diff và danh sách file trước commit; không đưa .local, database, secrets hoặc file khóa Word lên Git. Đề xuất ảnh câu hỏi vẫn chưa được triển khai.

## Đợt phát hành icon cấp độ 3D — 20/10/2026

Theo yêu cầu mới, đưa bộ Mầm / Chồi / Cây Non / Đơm Hoa / Kết Trái đã duyệt vào bản phát hành main. Năm WebP320×320 có alpha, tổng163.384byte; dùng chung trong thẻ chương, mốc cấp, giáo viên và khu vườn. Giữ ngưỡng thời gian, phạm vi lớp–môn–chương, accessible name và animation. Đã cập nhật main từ remote b21edc2, giữ đủ các thay đổi tài liệu/local có sẵn; chỉ commit phạm vi icon và ghi chú liên quan.

QA mới TypeScript/Vite build đạt, 12/12 E2E desktop/mobile đạt (32,5 giây) trên cổng3336/SQLite riêng; ảnh/URI/MIME/kích thước và các cấp/reload/vườn/roster/motion đều đạt, đã xem thanh cấp hai kích thước. Log `.local/icon-push-20261020`. Không sửa backend/database, không đưa poster hoặc nguồn PNG lớn vào đợt push. Cần đối chiếu deployment Railway và tài nguyên thực tế để xác nhận production; các dòng chưa push của lượt áp dụng local trước đây là lịch sử.

Xác nhận sau push: commit `4e0823b561e520aa8b275abe9f9eaa2f93f4cbea` đã có trên origin/main. Railway deployment `c7b6c25e-4c82-40a0-bf8c-6b6084afdf18` SUCCESS, đúng SHA. HTTP health200/ok=true/demo=false/quickLogin=false; cả năm WebP production trả200/image-webp, byte và SHA-256 khớp bộ đã test. Bundle `/assets/index-CjBszAa2.js` chứa family greenedu-3d và đường dẫn ảnh mới. Báo cáo `.local/icon-push-20261020/release-verification.json`. Ghi chú kiểm tra sau phát hành này lưu tại workspace; không tạo thêm đợt deploy chỉ để đổi tài liệu.

## Chốt phát hành Git hẹn giờ/chỉnh sửa đề —20/10/2026

Theo yêu cầu deploy Git, đưa bản đã kiểm thử lên origin/main cho luồng Railway autobuild hiện có. Fetch trước chốt không có commit remote mới ngoài13c638e. Bộ poster vẫn riêng working tree; không kèm dữ liệu/.local/secrets. API deployment và trang production bị403 trong môi trường này, nên chỉ xác nhận SHA remote qua Git, chưa xác nhận Railway deploy thành công. QA và phạm vi tính năng giữ theo lượt triển khai bên dưới; ghi chú chưa push là trạng thái trước yêu cầu này.

## Hiện hành: hẹn giờ bắt đầu và sửa bài kiểm tra —20/10/2026

Đã pull5commit lên **13c638e**, giữ bộ poster và tài liệu chưa commit. Form Tạo bài kiểm tra có ngày/giờ Việt Nam (UTC+7), bài tự mở theo lịch; Chỉnh sửa thông tin trong popup/danh sách tải lại đầy đủ nguồn đề/câu upload/cấu hình và lịch, cập nhật cùng ID, có đổi/bỏ lịch. Chỉ chủ lớp sửa trước giờ thi và khi chưa có lượt làm; bản đã bắt đầu/đóng khóa ở server. Lịch/snapshot giữ qua restart; thời gian chuẩn bị đứng trước giờ mở, cả lớp cùng hạn nộp. API/capability/migration thêm không reset dữ liệu. [Quy tắc chi tiết](online-exams.md).

QA: full **180/180 backend đạt**; bổ sung migration/reopen **4/4 xác nhận đạt** (cùng các ca đã có, không cộng trùng). Build/typecheck đạt; E2E rộng26/28 với2lỗi harness popup che navbar, đã sửa và **6/6 ca mới desktop/mobile đạt** trên DB E2E cũ. Có thử tự mở không lệnh giáo viên, giữ đề/ID khi sửa, retry/hủy/reload và native date control không tràn320/390px; đã xem ảnh. Sau tinh chỉnh hướng dẫn cuối, build lại và2/2 xác nhận desktop/mobile đạt. Chi tiết các lượt/report ở đầu session-handoff. **Chưa commit/push/deploy**; backend Railway cần triển khai mới để có tính năng, không ghi dữ liệu thật.

## Poster v8: bỏ nhãn GDPT 2018 — 20/10/2026

Theo yêu cầu tiếp theo, [poster v8](../artifacts/posters/ho-so-san-pham-2026-v8/README.md) bỏ tên/chú thích chương trình khỏi tiêu đề, bảng, chân trang và metadata. Giữ luận điểm giáo dục, chữ A3 18,53 pt và hình nhỏ của v7. QA mới xem render, kiểm tra hai PDF một trang/không còn nhãn đã bỏ/đủ nội dung/font, PNG 3508 × 4961/300 dpi và QR đúng Railway; báo cáo `.local/poster-gdpt2018/v8-verification.json`. v8 mới nhất; giữ tài liệu nguồn/bản cũ, không sửa app/database/push/deploy.

## Poster v7: ưu tiên căn cứ và logic giáo dục — 20/10/2026

Theo yêu cầu mới, [poster v7](../artifacts/posters/ho-so-san-pham-2026-v7/README.md) thay hướng hình lớn/khẩu hiệu bằng nhu cầu → định hướng GDPT 2018 → hoạt động GreenEdu → minh chứng để giáo viên điều chỉnh. Có bảng tự học, hợp tác, giải quyết vấn đề/sáng tạo và đánh giá quá trình; nhiệm vụ phải được giáo viên chọn theo yêu cầu cần đạt. Cấp cây ghi thời gian/tạo động lực, không phải đo năng lực; hiệu quả học tập còn cần kiểm chứng. Hình cây chỉ còn khung 3,12% trang, chữ nội dung A3 18,53 pt. Căn cứ và giới hạn nguồn tại SOURCES.md của bản này.

QA mới: xem render cuối, hai PDF một trang đúng khổ, đủ nội dung/cỡ chữ/ký tự trong trang, PNG 3508 × 4961/300 dpi, QR đúng Railway; báo cáo `.local/poster-gdpt2018/v7-verification.json`. Giữ mọi bản cũ và thay đổi có sẵn, không sửa app/database/push/deploy; không ghi đối chiếu chương trình là bằng chứng đã phát triển năng lực thực nghiệm.

## Đề xuất ảnh trong câu hỏi — 19/10/2026

Đã khảo sát và thử cơ chế trích ảnh nhúng qua relationship trên mẫu DOCX tổng hợp; khả thi. Hướng ưu tiên: Chèn ảnh/chọn file/dán Ctrl+V, sau đó nhập ảnh có sẵn trong Word, giữ ảnh theo phiên bản/snapshot và quyền xem lời giải. **Chưa triển khai**, bộ nhập hiện tại vẫn chỉ nhận văn bản. Phạm vi, thử nghiệm và nguồn tại [question-images-proposal.md](question-images-proposal.md); không thay dữ liệu hoặc deploy.

## Poster v6: sửa giọng văn theo góp ý — 19/10/2026

Người dùng nhận xét từ ngữ có hơi hướng AI. Đã viết lại poster tại `artifacts/posters/ho-so-san-pham-2026-v6`: câu chính “CÂY CỦA EM LỚN LÊN KHI EM HỌC.”, giới thiệu làm bài/xem câu sai/theo dõi cây; bốn cụm Vì sao làm? / Cách làm / Học sinh / Giáo viên dùng lời cụ thể, gần cách cô nói với học sinh. Bỏ “Gieo nỗ lực”, “Nuôi tri thức”, “hành trình riêng”, “sửa sai có đích”; kết quả nêu đúng chức năng đã có và dự kiến hỏi ý kiến học sinh. Vẫn ghi AI hỗ trợ viết/kiểm tra mã, tạo minh họa và cô kiểm tra bài tập; không bịa gia sư AI hoặc kết quả khảo sát.

Giữ banner/ảnh cổ thụ/cỡ chữ v5, không gọi ImageGen. QA mới xem render cuối, hai PDF đúng một trang/đúng khổ và đủ chữ mới, kiểm tra bỏ khẩu hiệu cũ, cỡ nội dung A3 14,74 pt và ký tự trong khổ, PNG 3508 × 4961/300 dpi, QR đúng Railway; ảnh nguồn khớp v5. Báo cáo `.local/poster-submission-20261019/v6-verification.json`. v6 mới nhất, giữ các bản trước, có nguồn/README. Không sửa app/database/push/deploy hoặc tác vụ Forms ở thread riêng.

## Poster v5: kiểm tra và chỉnh cỡ chữ — 19/10/2026

Người dùng yêu cầu kiểm tra cỡ chữ. Đã đo PDF A3 v4 bằng pdfplumber: nhãn mục 11,29 pt, mô tả 11,62 pt, chân trang 11,54 pt, chú thích QR 7,83 pt. Làm v5 tại `artifacts/posters/ho-so-san-pham-2026-v5`: nhãn 16,42 pt, nội dung/danh sách/chân trang đồng nhất 14,74 pt, chú thích QR 12,21 pt; câu chủ đạo giữ 42,95 pt. Tăng giãn dòng/độ đậm màu chữ, ngắt lại cột và thu minh họa 600 xuống 540 đơn vị để không đè chữ. Giữ nguyên ảnh cổ thụ/mầm cây và banner; không gọi ImageGen lại. v5 là bản mới nhất để người dùng xem, các bản cũ vẫn giữ.

QA mới: xem render cuối; hai PDF đúng một trang A0 theo mẫu/A3 và đủ nội dung, kiểm tra mọi ký tự nằm trong khổ, đo font trước/sau; PNG 3508 × 4961/300 dpi, QR đúng Railway. Báo cáo `.local/poster-submission-20261019/v5-verification.json`, có README/nguồn dàn trang. Không sửa app/database/push/deploy; giữ thay đổi có sẵn, không can thiệp tác vụ Forms ở thread riêng.

## Poster v4: cổ thụ trên sách, chữ quanh minh họa — 19/10/2026

Theo yêu cầu mới, đã tạo `artifacts/posters/ho-so-san-pham-2026-v4` với minh họa ImageGen mới: cổ thụ mọc từ sách mở, năm mầm cây vui chơi/tưới cây/chơi xích đu quanh gốc. Các cụm Nhu cầu / Ý tưởng / Học sinh chủ động / Giáo viên đồng hành nằm hai bên; giữ thông điệp lớn, banner mẫu nguyên bản, tác giả/đơn vị, năm cấp độ, vòng học, AI hỗ trợ phát triển, kết quả/hướng tiếp tục và QR. Bản v4 thay v3 làm bản mới nhất để xem, không xóa các bản cũ. Có ảnh minh họa RGBA trong assets, prompt đầy đủ và nguồn dàn trang.

QA mới: xem render cuối sau xử lý chữ đè lên lá/sách; hai PDF một trang A0 theo mẫu và A3, đủ chữ/không placeholder; PNG 3508 × 4961/300 dpi, QR đúng Railway, banner khớp nhị phân với PPTX nguồn. Lớp chữ 257 từ; minh họa 1254 × 1254/alpha 0–255. Báo cáo `.local/poster-submission-20261019/v4-verification.json`. Không sửa app/database/push/deploy, giữ thay đổi icon 3D local có sẵn. Tác vụ Google Forms đã chuyển sang thread riêng `01a1545e-1bae-7570-a3de-5a5a37399d75` theo yêu cầu, không tiếp tục ở thread poster.

## Poster v3: ý tưởng gây chú ý trước chi tiết — 19/10/2026

Người dùng yêu cầu ý tưởng phải đủ nổi bật để thu hút trước khi đọc tiếp. Đã làm bản v3 tại `artifacts/posters/ho-so-san-pham-2026-v3`: thông điệp lớn **BIẾN VIỆC HỌC THÀNH MỘT KHU VƯỜN.**, cây Kết Trái phóng lớn và bốn giai đoạn dẫn tới cây trưởng thành. Nhu cầu/chức năng theo vai trò/vòng phản hồi/AI/kết quả và hướng phát triển nằm phía dưới. Giữ nguyên banner mẫu 2026 và thông tin tác giả/đơn vị; không bịa số liệu hiệu quả hoặc AI gia sư. Đây là bản mới nhất, thay v2 về thứ tự hiện hành; tất cả bản trước vẫn giữ.

QA mới: xem render cuối sau sửa chồng cây/đường nối/nhãn; hai PDF một trang A0 theo mẫu và A3, đủ chữ và không placeholder. PNG 3508 × 4961/300 dpi; QR giải mã đúng Railway, banner so khớp nhị phân với PPTX gốc. Báo cáo `.local/poster-submission-20261019/v3-verification.json`. Có nguồn build/README/bản xem nhanh. Không thay app/database/push/deploy; giữ thay đổi icon 3D local và các file có sẵn.

## Poster hồ sơ v2: sáng tạo và đầy đủ hơn — 19/10/2026

Người dùng chưa hài lòng bản đầu và yêu cầu sáng tạo/đầy đủ hơn. Đã làm lại infographic tại artifacts/posters/ho-so-san-pham-2026-v2, giữ nguyên banner2026 và đúng thông tin tác giả/đơn vị. Trục đường nuôi cây5cấp, ba nhu cầu lớp học,8chức năng theo vai trò học sinh/giáo viên, vòng giao bài–học/sửa sai–ghi nhận–phản hồi, vườn/vinh danh, AI hỗ trợ phát triển và kết quả/hướng tiếp tục. Phân biệt kết quả web đã có với giá trị hướng tới, không bịa khảo sát/tăng điểm hoặc gia sưAI đã tích hợp. Nội dung384từ dàn dạng nhãn ngắn, đầy đủ hơn bản đầu206từ.

Đầu ra PDF A0 đúng khổ mẫu2384×3370pt, A3 và PNG3508×4961/300dpi, bản xem nhanh/nguồn build/README. Đã xem render cuối; Pypdf xác nhận đủ1trang/kích thước/tên/chức năng/không placeholder, QR giải mã đúngRailway. QA .local/poster-submission-20261019/v2-verification.json. Giữ tất cả bản cũ và thay đổi icon3D local đang chờ người dùng kiểm tra; không sửa app/database/push/deploy trong lượt poster này.

## Poster một trang theo mẫu hồ sơ 2026 — 19/10/2026

Người dùng gửi ảnh yêu cầu mẫu Canva và đề nghị sửa poster. Đã tìm đúng Mẫu Poster2026.pptx trong thư mục tài liệu Desktop; lấy nguyên banner3975×724 từ media/image1.png, kiểm tra binary không đổi. Gộp bộ3tờ thành1poster tại artifacts/posters/ho-so-san-pham-2026, gồm PDF đúng khổ gốc2384×3370pt (~A0), PDF A3, PNG3508×4961/300dpi, ảnh xem nhanh và nguồn build. Giữ Nguyễn Thị Thanh Phương/THPT Nguyễn Khuyến/thành phố Đà Nẵng, bỏ viền hướng dẫn. Có5mục: bối cảnh-đối tượng, ý tưởng5cấp, AI/cách triển khai, kết quả chức năng và nhận xét/hướng phát triển, QR sản phẩm.

AI chỉ ghi hỗ trợ lập trình/thiết kế; không hứa gia sư AI, không bịa khảo sát/tăng điểm hoặc thành tích giải thưởng. Đã xem bản render cuối sau chỉnh khoảng minh họa–mục2, kiểm tra đủ2PDF1trang/kích thước/tên/tiêu đề/không placeholder; QR ảnh cuối giải mã đúngRailway. QA .local/poster-submission-20261019/verification.json; chi tiết README trong thư mục kết quả. Giữ bộ3poster cũ và thay đổi icon3D local trước đó. Không sửa Canva trực tiếp, không đổi app/database/push/deploy trong lượt này.

## Hiện hành: icon cấp độ 3D đã duyệt, chạy local — 19/10/2026

Người dùng đã duyệt bộ preview và yêu cầu áp dụng, deploy local trước để kiểm tra. Thay hình vẽ trong LevelArtwork bằng SVG image dẫn5WebP public/assets/student-levels-3d-v1 (320×320, alpha trong suốt, tổng163.384byte); giữ svg/g80×80, class/CSS/ARIA/data-level và animation lên cấp/vườn. StudentLevelIcon đổi family greenedu-3d, giữ toàn bộ tên/ngưỡng/phạm vi lớp–môn–chương. Các vị trí dùng chung gồm thẻ chương/mốc cấp, danh sách giáo viên, vườn cá nhân/lớp và vinh danh. Quyết định này thay trạng thái chờ duyệt phía dưới; preview cũ vẫn giữ làm nguồn. Không thay backend/database.

Đã chạy npm run local: Vite nền http://localhost:5173, API/database tiếp tục Railway. Đã mở local trong browser, hiện form đăng nhập; không tự đăng nhập/ghi dữ liệu thật. Health qua proxy ok=true/demo=false/quickLogin=false. **QA mới:** TypeScript/Vite build/diff check đạt; **8/8 E2E desktop/mobile đạt (27,6 giây)** về5file ảnh/URI/mime/kích thước<50KB, đầy đủ5cấp/reload/độc lập theo chương, giáo viên/vườn, animation chỉ khi tăng cấp. Tests dùng server3330 và SQLite e2e riêng, không Railway. Xem ảnh thanh cấp desktop/mobile sau tích hợp; không tràn/đổi hình học. Log/report .local/level-3d-local-20261019. Không chạy backend suite vì không sửa server; cập nhật selector family trong duotone-icons nhưng chưa chạy file đó. Chưa push/deploy Railway. Giữ bộ poster và file khóa Word có sẵn chưa commit.

## Đề xuất chờ duyệt: bộ icon cấp độ 3D — 19/10/2026

Người dùng thích cây trong poster và yêu cầu xem preview trước khi thay bộ hiện tại. Đã tạo artifacts/design/student-levels-3d-preview với5PNG nền trong suốt1254×1254 (Mầm/Chồi/Cây Non/Đơm Hoa/Kết Trái), bảng preview2400×1680 gồm hình lớn/64px/mô phỏng thẻ chương-vườn và nguồn dàn trang. Dùng ImageGen theo ảnh cây poster tham chiếu, giữ hoa trắng/quả vàng phân biệt cấp4/5; dàn chữ riêng. Đã xem ảnh tổng thể và xác nhận cả5PNG RGBA có alpha0–255.

**Chưa được duyệt, chưa áp dụng vào app.** Giữ nguyên LevelArtwork/StudentLevelIcon và ngưỡng cấp; không đổi public/src/server/database, không push/deploy. Khi người dùng duyệt mới tích hợp, cân lại kích thước/nén ảnh và kiểm tra UI thật. Không tự coi preview là quyết định thiết kế hiện hành. Chi tiết tại artifacts/design/student-levels-3d-preview/README.md.

## Bộ poster giới thiệu GreenEdu — 19/10/2026

Đã tạo artifacts/posters/gioi-thieu-2026: 3 poster Nhu cầu → Ý tưởng → Hiện thực hóa, PDF A3 3 trang, PNG3508×4961/300dpi, ảnh tổng thể và nguồn build.py/DESIGN.md/assets. Theo yêu cầu nghiên cứu link https://ieeai.net/top-50: web extractor không mở được, nhưng trình duyệt đã xem trực tiếp Hành trình Việt Nam/COMPETECH/AI-PhysicsBook. Chỉ tham khảo bố cục/mạch vấn đề–giải pháp–triển khai–minh chứng; không sao chép số liệu/hình/logo giải thưởng. Tìm skill trên skills.sh, chọn canvas-design của anthropics/skills và đọc SKILL.md nguồn chính thức; không cài skill. Dùng ImageGen tạo ba minh họa mới; dàn chữ tiếng Việt, logo thật và QR bằng ReportLab, theo PDF skill.

QA mới: xem tổng thể ba trang render; Pypdf xác nhận3trang/tiêu đề; ảnh300dpi đúng khổ; ZXing giải mã QR ảnh cuối đúng https://greenedu.up.railway.app/. Mỗi tờ78–82từ kể cả nhận diện/chân trang. Không bịa số liệu hiệu quả hoặc tuyên bố AI đang có trong sản phẩm. Không sửa ứng dụng/dữ liệu, không push/deploy; giữ poster cũ. Đây là bộ giới thiệu dự án, tách poster hướng dẫn học sinh12/10. Nguồn/giới hạn tại artifacts/posters/gioi-thieu-2026/README.md, QA tại .local/poster-series-20261019/verification.json.

## Phát hành Railway theo yêu cầu — 19/10/2026

Người dùng yêu cầu deploy sau ba thay đổi: quyền xóa bài kiểm tra cho giáo viên, nút Xóa câu hỏi thay Ẩn câu hỏi và nhãn submenu Kiểm tra online. Kiểm tra Git không có commit mới trên origin/main; Railway liên kết SangKienKn / zooming-light / production, tự build nhánh main, volume /data hiện có. Phát hành qua commit/push GitHub, không dùng deploy SQLite local hoặc upload .local/file khóa Word. Không chỉnh cấu hình Railway hoặc dữ liệu thật.

Build release cuối đạt; kiểm thử backend176/176, xóa đề10tình huống qua hai lượt, xóa câu4/4 thuộc các lượt triển khai bên dưới. Lượt menu phát hành mới **6/6 desktop/mobile đạt (16,6 giây)** trên build cuối; report .local/release-menu-20261019-report.json. Trạng thái deployment đối chiếu trong Git/CLI Railway. Các ghi chú chưa push/deploy phía dưới là trạng thái trước yêu cầu phát hành này. Không coi push là đã deploy; xác nhận SHA và trạng thái SUCCESS cùng HTTP health/tài nguyên production sau phát hành.

## Nhãn submenu Kiểm tra online — 19/10/2026

Theo yêu cầu mới, submenu Ôn tập / Săn thưởng / Kiểm tra đổi thành **Ôn tập / Săn thưởng / Kiểm tra online**. Chỉ đổi nhãn tab cho cả giáo viên và học sinh; tiêu đề trang Kiểm tra, lối tắt sidebar học sinh, ID online-exams, URL và chức năng giữ nguyên. Thay nhãn submenu ngắn ở các quyết định lịch sử phía dưới. Giữ các thay đổi xóa bài kiểm tra/xóa câu hỏi chưa push. Cập nhật selector tab/helper trong E2E theo nhãn mới; đây là đổi chữ giao diện, không thêm ca test hoặc sửa backend/database. Kiểm tra mới TypeScript và diff check đạt; không chạy lại E2E cho thay đổi nhãn. Chưa push/deploy.

## Nút Xóa câu hỏi thay Ẩn câu hỏi — 19/10/2026

Theo ảnh người dùng, nút ở mỗi câu đang sử dụng đổi thành **Xóa câu hỏi**, icon thùng rác/màu danger, mở cùng popup và endpoint xóa nhiều câu với danh sách một ID. Popup một câu có tiêu đề Xóa câu hỏi, Hủy/Xác nhận xóa 1 câu và lời giải thích giữ lịch sử; đang xử lý chặn đóng modal/gửi lặp. Không chỉ đổi chữ trên luồng visibility: thao tác đi qua quyền/capability canDeleteQuestions và API `/chapters/:id/questions/delete` có sẵn. Câu ngừng dùng cho lượt học mới, vẫn giữ lượt làm/sổ tay/đề đã lưu; Hiện cả câu đã ẩn và Hiện lại giữ như luồng xóa nhiều câu trước. Không xóa vật lý dữ liệu lịch sử hoặc đổi backend. QA mới: TypeScript/Vite build/diff check đạt; 4/4 E2E desktop/mobile đạt (15,6 giây), gồm xóa một câu, hủy, hiện lại, xóa nhiều câu/cả bài và capability backend cũ. Lượt thăm dò có2 lỗi kỳ vọng tổng số thẻ sau khi phạm vi bài tự làm mới; đã sửa kiểm tra đúng câu biến mất và chọn lại Bài 1, giữ assertions xóa/khôi phục. Report .local/question-delete-20261019/report.json, SQLite/cổng3328 riêng. Cập nhật selector workflow theo nhãn mới, chưa chạy lại toàn file workflow; không chạy lại backend vì không thay server. Giữ phần xóa bài kiểm tra chưa push của lượt trước; chưa push/deploy trong lượt này.

## Xóa bài kiểm tra — 19/10/2026

Giáo viên sở hữu lớp có nút **Xóa bài kiểm tra** ở từng buổi trong mục Kiểm tra, gồm bài online và lịch kiểm tra cũ. Chỉ xóa đề chưa bắt đầu hoặc bài đã kết thúc/đóng; buổi đang thông báo/chờ/đang thi cần Đóng bài thi trước để thu bài. Bài hết hạn tự chốt lượt quá hạn trước khi kiểm tra điều kiện xóa. Không cho học sinh, giáo viên lớp khác hoặc admin thay quyền chủ lớp.

Hộp xác nhận nêu rõ đề và toàn bộ bài làm/điểm/kết quả của buổi sẽ bị xóa vĩnh viễn, gợi ý tải kết quả trước; Hủy là lựa chọn an toàn. Khóa nút/đóng modal khi đang xóa, lỗi giữ modal để thử lại, thành công bỏ đúng buổi/lượt khỏi danh sách và trả focus về Tạo bài kiểm tra. Giữ nguyên ngân hàng câu hỏi, tiến độ, luyện tập/sửa sai và dữ liệu buổi khác. Không thao tác xóa nào đã được thực hiện trên dữ liệu thật trong lượt phát triển này.

POST `/api/learning/exams/:id/delete` kiểm tra teacher/chủ lớp, 409 nếu buổi còn mở hoặc còn lượt active; xóa exam_tab_events, exam_activity, exam_runs, online_exam_sessions, exam_creation_requests và exam_definitions trong một transaction. Lỗi ở bất kỳ bước nào rollback toàn bộ. Không cần migration. Overview thêm capability examDeletion; frontend với backend cũ khóa nút và báo cần cập nhật Railway.

Đợt phát triển bắt đầu từ Git 1b791c3, chỉ có file khóa Word chưa track; giữ nguyên file đó, không đưa vào Git. Đã dùng redesign-existing-projects và web-design-guidelines; lấy guideline mới, xem ảnh hộp xác nhận desktop/mobile. QA mới: **176/176 backend đạt**, TypeScript/Vite build và diff check đạt. E2E lượt rộng 10 ca có8 đạt/2 dừng ở assertion cũ về việc không có tiêu đề lịch sử; sửa assertion sang kiểm tra nhóm buổi chưa có bài làm, giữ các assertions đếm/tham gia/thu bài/Excel phía sau. Chạy xác nhận hai ca desktop/mobile **2/2 đạt (28,1 giây)**; tổng10tình huống xác nhận qua hai lượt, không báo lượt đầu10/10 hoặc cộng thành12. Ca mới xóa desktop/mobile đã đạt từ lượt rộng: hủy/lỗi/thử lại/focus, draft/closed, khóa khi đang mở, student không có nút. SQLite/cổng3326 và build/log/report tại .local/exam-delete-20261019; lỗi SQLite trong test rollback là cố ý, dữ liệu giữ nguyên như assertion. Không push/deploy Railway trong lượt này; local5173 cần backend mới để bật quyền xóa. Bản Word giáo viên chưa cập nhật chức năng này.

## Chốt Git theo yêu cầu push — 19/10/2026

Người dùng yêu cầu push các thay đổi hai mốc chốt tuần (12:00 nhắc nhở, 24:00 chốt cuối) và bỏ nhãn lịch sử chưa đủ kỳ. Fetch không có commit mới trên origin/main. Kết quả kiểm thử ghi dưới là các lượt triển khai trước bước Git, không chạy lại trong bước push. Không đưa database, secrets hoặc file khóa tạm Word lên remote. Các ghi chú chưa push phía dưới thuộc thời điểm trước yêu cầu này; đối chiếu SHA remote trong Git. Push không xác nhận Railway triển khai thành công.

## Thống kê tính từ ngày triển khai — 19/10/2026

Theo yêu cầu mới, ngày/tuần/tháng đầu tiên vẫn hiển thị thời gian đã ghi nhận như bình thường, không gắn nhãn “Lịch sử chưa đủ kỳ”. Bỏ nhãn ở tổng hợp, danh sách từng học sinh và bảng kỳ; CSV ghi “Đã theo dõi” cho cả kỳ bắt đầu giữa chừng. Giữ mốc bắt đầu trong phần Cách tính thời gian. Không thay thời gian thực, không bù dữ liệu trước triển khai; kỳ hoàn toàn trước tracking vẫn là Chưa có lịch sử. Thay quyết định hiển thị partial trong các mục lịch sử phía dưới. Giữ nguyên các sửa đổi báo cáo tuần chưa push của lượt trước; không sửa backend/database hoặc deploy. Kiểm tra mới cho lượt này: TypeScript và git diff --check đạt; không chạy lại backend/E2E vì chỉ bỏ nhãn và đổi lời giải thích/CSV.

## Hiện hành: học bù sau trưa Chủ nhật và hai lần chốt — 16/10/2026

Theo yêu cầu mới, 12:00 Chủ nhật chỉ tạm chốt danh sách cho cô nhắc học sinh chưa đủ chỉ tiêu; tiếp tục cộng thời gian đến 24:00 Chủ nhật rồi chốt lần cuối (UTC+7). Tuần sau bắt đầu đúng 00:00 thứ Hai. UI có lựa chọn danh sách trưa giữ nguyên / kết quả cập nhật hoặc cuối ngày. Không tự gửi tin cho học sinh. Đặc tả [weekly-practice.md](weekly-practice.md) thay quy tắc cũ bỏ chiều Chủ nhật bên dưới.

Migration bổ sung credit trước trưa, snapshot nhắc nhở và cờ tuần được tạo trước trưa; giữ dữ liệu cũ, mở lại tuần đóng trưa nếu chưa hết ngày, không bịa giờ chiều từng bị bản trước loại. Snapshot trưa giữ nguyên cả khi học bù hoặc hủy phiên muộn; kết quả cập nhật vẫn loại giờ vi phạm. Tuần tạo sau trưa không dựng snapshot giả. Chưa push/deploy hoặc thay dữ liệu thật Railway trong lượt đổi này.

QA mới: backend **173/173 đạt**, TypeScript và Vite build đạt; **8/8 E2E desktop/mobile đạt** gồm học bù chuyển sang hoàn thành nhưng snapshot trưa vẫn chưa đạt, cấu hình/lịch sử/backend cũ. Đã xem ảnh mobile; kiểm tra UI giữ label/select, focus, hai danh sách responsive và trạng thái rỗng theo skills hiện có. SQLite/cổng3324 riêng; log .local/weekly-practice-20261016/sunday-backend.log, sunday-build.log và recheck-report.json. Lượt unit thăm dò cần cập nhật kỳ vọng tuần mới lúc 00:00 thứ Hai và tìm đúng học sinh trong fixture nhiều thành viên; bản suite cuối đạt như trên. Bản Word giáo viên chưa cập nhật hai mốc.

## Chốt remote cho báo cáo tuần — 16/10/2026

Người dùng đã yêu cầu push mã báo cáo tuần, kiểm thử và tài liệu liên quan, gồm bản Word giáo viên đã bàn giao. Ghi chú chưa push bên dưới thuộc thời điểm triển khai trước yêu cầu này; trạng thái commit/remote đối chiếu trực tiếp trong Git. Không chạy lại kiểm thử ở bước Git và chưa xác nhận Railway triển khai thành công.

## Luyện tập tối thiểu mỗi tuần — 16/10/2026

Đã thêm cấu hình phút tối thiểu trong Quản lý lớp → Cài đặt chung; báo cáo theo tuần00:00thứHai–12:00Chủnhật giờ Việt Nam, hai danh sách đạt/chưa đạt và thời gian còn thiếu. Ghi khoảng thời gian chính xác, snapshot mức/roster, giữ tuần cũ, hủy credit phiên vi phạm; migration bổ sung, không sửa dữ liệu thật. [Nghiệp vụ](weekly-practice.md), thiết kế đầu app-design. Backend Railway cần triển khai mới để UI local dùng được; chưa push/deploy cho lượt này. QA:171/171backend đạt; E2E rộng28/30 và6/6weekly xác nhận cuối đạt sau sửa harness/payload, không cộng lượt trùng. TypeScript/build đạt, ảnhdesktop/mobile đã xem; chi tiết đầu bàn giao.

## Tài liệu Word cho giáo viên — 16/10/2026

Đã tạo `artifacts/documents/GreenEdu_Huong_dan_giao_vien.docx` gồm11trang: tóm tắt menu, tạo lớp/tài khoản học sinh, chương/bài/ngân hàng, ôn tập, cấp độ và ngưỡng phiên, săn thưởng/duyệt điểm, kiểm tra X/Y, nhóm/gia hạn/nộp bài, vườn/thống kê, góp ý/phản biện và xử lý tình huống. Đối chiếu mã39fcad4 và đặc tả hiện hành, không lấy đường dẫn menu lịch sử. File không chứa tài khoản thật, mật khẩu hoặc dữ liệu học sinh. Đây là hướng dẫn sử dụng theo mã hiện có, không xác nhận Railway đã triển khai từng tính năng.

Tạo bằng documents skill/python-docx trong runtime đóng gói; render_docx.py thất bại vì Windows thiếu LibreOffice. Đã dùng Microsoft Word ẩn xuất PDF và Poppler đóng gói tạo ảnh11trang để kiểm tra bố cục, dấu tiếng Việt, bảng và số trang. File PDF/ảnh/script QA ở .local/teacher-guide-20261016, chỉ bàn giao Word. Không sửa mã ứng dụng hoặc database, không chạy lại test chức năng và không tự push cho lượt tạo tài liệu. Đồng thời sửa lại dòng tiêu đề Markdown đầu app-design/class-management bị chèn lệch ở lượt trước, không thay đặc tả.

## Hiện hành: rút gọn menu, đưa Quản lý lớp ra sidebar — 16/10/2026

Bổ sung theo ảnh: bỏ trạng thái/nút săn thưởng trong thẻ chương Quản lý lớp, giữ luyện tập. Quản lý đề săn thưởng vẫn ở tab Săn thưởng. TypeScript/build và lượt xác nhận6/6 E2E desktop/mobile mới đạt, gồm upload/khóa/dùng lại/xóa đề ở tab này.

Đã pull fast-forward `bce44bc → 9adbcff`, giữ bản animation/bài ôn mới từ remote. Sidebar giáo viên là Tổng quan / Lớp học của tôi / Ngân hàng câu hỏi / Ôn tập / Quản lý lớp. Quản lý lớp thay mục Kiểm tra online cũ; submenu Lớp học của tôi chỉ còn vườn và nhóm. Ba tab Ôn tập / Săn thưởng / Kiểm tra dùng nhãn ngắn, giáo viên vẫn vào kiểm tra từ đây. Học sinh giữ shortcut Kiểm tra. Nút Tạo bài ôn chuyển vào nội dung phía trên Bài ôn của lớp. Quyết định hiện hành ở đầu [app-design.md](app-design.md); kết quả kiểm tra và trạng thái Git ở đầu [session-handoff.md](session-handoff.md). Không đổi backend/schema/dữ liệu.

**QA lượt này:** TypeScript/Vite build đạt; 36/38 E2E lượt rộng và 2/2 ca submenu sau cập nhật harness đạt trên cùng build, tổng38tình huống desktop/mobile qua hai lượt. Đã xem ảnh desktop/mobile, local5173 đang chạy; chưa commit/push/deploy trong đợt sửa menu này. Chi tiết report/giới hạn ở đầu bàn giao.

## Hiện hành: ba submenu Quản lý lớp — 16/10/2026

Theo yêu cầu mới, Quản lý lớp dùng cùng submenu như Ôn tập: Học sinh (mặc định), Chương học, Cài đặt chung. Chỉ hiện panel được chọn; giữ bản nháp khi đổi tab, URL lưu tab/lớp, sidebar chọn Quản lý lớp. Desktop và portrait dùng WorkspaceTabs hiện có, giữ phím mũi tên/Home/End và layout trên dock. Không đổi backend/schema/dữ liệu. Người dùng yêu cầu hoàn tất push remote; kết quả kiểm tra và Git ở đầu session-handoff. Thiết kế mới ở đầu app-design.

**QA lượt submenu:** TypeScript/build đạt; 60/66 ca rộng và 6/6 xác nhận sau sửa harness đạt trên cùng build, tổng66tìnhhuống qua hai lượt. Ảnh desktop/mobile đã xem, dữ liệu test riêng; chi tiết/giới hạn ở đầu bàn giao. Chốt push theo yêu cầu, kiểm tra Git thực tế; không coi push là xác nhận Railway đã deploy.

## Chốt Git theo yêu cầu người dùng — 16/10/2026

Người dùng đã yêu cầu đẩy remote sau khi sửa menu và bỏ săn thưởng khỏi thẻ chương. Fetch xác nhận HEAD/origin/main cùng9adbcff trước bước chốt, không có commit remote mới. Đợt commit gồm frontend, E2E liên quan và tài liệu thiết kế/bàn giao; không gồm .local/database/secrets. Kết quả TypeScript/build, 38tình huống qua hai lượt và 6/6 xác nhận bổ sung là kết quả các lượt triển khai phía dưới, không chạy lại hoặc coi là kiểm thử mới ở bước Git. Các ghi chú chưa push bên dưới là trạng thái trước yêu cầu này. Đối chiếu Git thực tế để xác nhận commit/push; push không xác nhận Railway deploy thành công.

## Hiện hành: animation nhẹ đã áp dụng — 15/10/2026

Theo yêu cầu “Áp dụng” sau đề xuất skill: popup vào220ms, đóng bằng X/backdrop160ms; nút nhấn120ms; toast vào/ra160ms và vẫn tự ẩn6giây. Cây trong thẻ chương chỉ chuyển động280ms khi dữ liệu thời gian thực tế tăng qua cấp, không phát lại khi mở trang/polling/đổi màn hoặc đổi ngưỡng. Tiến độ chương dùng scaleX thay width. Giữ vị trí header/navbar, nhãn hai dòng/badge đỏ; bàn phím và reduced motion không chờ chuyển động. Không thêm thư viện hay đổi backend/nghiệp vụ/timer. Quyết định/phạm vi tại [app-design.md](app-design.md), nguồn skill tại [design-skills.md](design-skills.md).

**QA mới:** build, typecheck, Prettier, diff check đạt; **32/32 E2E** trên desktop/mobile với server/SQLite riêng, gồm popup busy/retry/focus, toast, lên cấp đúng dữ liệu, reduced motion và navbar cố định. Cần kiểm tra cảm giác chuyển động trên điện thoại thật; không khẳng định60/120fps bằng mô phỏng. Ngày16/10 người dùng yêu cầu “Apply”: chốt commit/push bản animation lên origin/main cho autobuild; đối chiếu Git để xác nhận SHA. Không suy Railway đã deploy từ kết quả push. Ghi chú chưa push trong nhật ký15/10 là trạng thái cũ. Chi tiết/đường dẫn report ở đầu [session-handoff.md](session-handoff.md).

## Chốt push ba mục ôn/thi và sửa nhập bài — 15/10/2026

Theo yêu cầu mới, chốt toàn bộ tính năng bài ôn/tách ba mục cùng sửa nhập sau xóa/tạo lại bài lên origin/main. Các ghi nhận “chưa push” bên dưới thuộc thời điểm trước yêu cầu này; đối chiếu Git và đầu session-handoff để tiếp tục. Không kèm database/.local/secrets và không coi push là xác nhận Railway đã deploy. Các kiểm tra chức năng đã hoàn tất trong lượt triển khai, không báo thành kiểm tra mới ở bước Git.

## Hiện hành: Ôn tập theo tiêu đề/upload và ba mục ôn/thi — 15/10/2026

Đã tách **Ôn tập / Kiểm tra săn thưởng / Kiểm tra online** thành ba tab, giữ5vị trí icon chính và nhãn tối đa2dòng. Giáo viên tạo bài ôn có tiêu đề + Word/CSV/mẫu, học sinh chọn theo tiêu đề/tiếp tục/làm lại giữ lịch sử. Bộ upload dùng snapshot/câu riêng, không phát hành vào ngân hàng. Giữ bộ ôn ngân hàng cũ/ôn chương-kỳ dạng mở rộng. Săn thưởng có quản lý đề/tái dùng/khóa cùng điều kiện-vé-lượt/duyệt điểm riêng. Online giữ popup/thông báo/phòng thi, đồng thời giữ truy cập các lịch đã lưu. [Quy trình/API/migration](review-papers.md), thiết kế ở đầu [app-design.md](app-design.md).

TypeScript/Vite build và **161/161 backend đạt**. Lượt rộng80E2E:78đạt/2lỗi harness mobile, đã sửa scope/các loại đáp án và xác nhận **12/12 đạt trên DB E2E cũ**, gồm hai ca archive hết chương mới. Sau chỉnh nhãn săn thưởng hết hạn, build cuối và **2/2 desktop/mobile đạt**; xem bằng chứng/giới hạn ở đầu [session-handoff.md](session-handoff.md). Không cộng lượt trùng hoặc báo toàn bộ E2E repository đạt. Bản sửa import bài xóa/tạo lại của lượt trước được giữ nguyên. Chưa commit/push/deploy; cần backend Railway mới, không sửa dữ liệu thật.

## Sửa lỗi upload sau khi xóa/tạo lại bài — 15/10/2026

Đã tái hiện và sửa API ghép tên bài: ưu tiên bài đang dùng thay vì tên tương đương đã archive (khác dấu phân cách hoặc cách đặt dấu tiếng Việt). Nhập Word/CSV sau tạo lại không bị tên bài cũ chặn; chưa tạo lại thì vẫn chặn, không hiện lại câu cũ hoặc đổi lịch sử. Giữ kiểm tra trùng/retry/phân quyền, không migration hay sửa dữ liệu thật. Chi tiết [question-bank.md](question-bank.md).

QA mới: TypeScript/Vite build, **19/19 backend liên quan** và **10/10 E2E desktop/mobile** đạt trên database/server riêng; có thao tác xóa/tạo lại/upload Word và CSV qua UI. Chưa commit/push/deploy trong lượt này; bản sửa cần backend Railway mới. Report và cách tiếp tục ở đầu [session-handoff.md](session-handoff.md).

## Hiện hành: triển khai đề xuất tối ưu UI/UX — 15/10/2026

Tiếp tục từ remote `bce44bc` sau khi pull11commit, giữ toàn bộ quyền học tập/đề săn thưởng/thống kê mới. Đã rút gọn tiêu đề/khẩu hiệu/mô tả; thêm việc cần làm từ dữ liệu thật; thu nhỏ hero/thẻ luyện; nhập Word/CSV một luồng, lời giải/hướng dẫn mở khi cần; nhóm thành bốn tab giữ draft/file; quản lý lớp có đường tới ba khu vực và ngưỡng nhắc/đóng theo cặp. Giữ navbar hai dòng/icon cố định và badge đỏ. React.lazy tải ba phân hệ khi mở, giữ điều hướng và có phục hồi lỗi tải. Thiết kế tại [app-design.md](app-design.md); QA/Git/deploy theo bản ghi mới đầu [session-handoff.md](session-handoff.md), không lấy các kết quả cũ bên dưới làm kết quả đợt này.

**QA cuối:** TypeScript/Vite build đạt, **58/58 desktop +58/58 mobile** đạt trên server/SQLite riêng; gồm năm ca mới và hồi quy chức năng, file/note nhóm giữ khi chuyển tab, navbar hai dòng/icon cố định, nhập Word/CSV và phục hồi lỗi tải trang. JS ban đầu436,83kB minified so với516,60kB trước tách. Hai ca timer cũ ngoài lượt kiểm tra; không báo toàn bộ suite/backend đã chạy. Người dùng yêu cầu push Git, Railway cần xác nhận phát hành riêng.

## Hiện hành: quản lý lớp, luyện tập/săn thưởng và quy tắc phiên — 15/10/2026

**Git hoàn tất:** đã commit/push tính năng **5bb72e5** lên origin/main và xác nhận SHA remote đúng **5bb72e5bcb314c139031520aba28bf009b50edf4**. Checkout sạch sau push mã. Các câu “chuẩn bị push” trong phần dưới là ghi trước bước Git này; không thực hiện lại tính năng/test hoặc tự suy Railway đã phát hành. Bản ghi trạng thái này được đẩy bằng commit tài liệu tiếp theo.

Đã thêm kính lúp thống kê đúng học sinh (giữ toolbar cả lớp), đổi **Quản lý cấp độ → Quản lý chung** với phút/cấp + ngưỡng nhắc/đóng tab–idle. Hai quyền **Mở/Khóa luyện tập** và **Mở/Khóa săn thưởng** riêng theo chương, kiểm tra ở server. Săn thưởng upload Word/CSV hoặc dùng lại đề có thời điểm tải, X/Y/ngưỡng tab; khóa xác nhận có tùy chọn xóa đề cấu hình và thu bài, giữ lịch sử. Kiểm tra chính thức dùng quyền/lịch riêng. Vi phạm luyện tập loại giờ đúng phiên khỏi tổng/ngày, giữ phiên trước/câu trả lời/sổ tay; giáo viên chủ động khóa thì giữ giờ đã ghi. Thi tự nộp đáp án đã lưu, polling không gia hạn idle; có worker, replay/idempotency và tương thích server cũ.

TypeScript/build riêng đạt; **154/154 backend**, **64/64 E2E hồi quy desktop/mobile**, **12/12 E2E release cuối** (8ca mới +4ca khôi phục ôn/hunt) đạt. Không cộng lượt chồng nhau thành tổngsuite; nhật ký lỗi harness/lượt xác nhận ở đầu session-handoff. Đã kiểm tra ảnh mobile/focus/không tràn; chưa chạy toàn bộ mọi E2E repository. Không sửa database thật/deploy/restart Railway; chuẩn bị push main theo yêu cầu, chưa xác minh backend phát hành. Bản push gồm thống kê toàn lớp/CSV và sắp xếp chương đã hoàn tất từ trước. Quyết định hiện hành [class-management.md](class-management.md), [app-design.md](app-design.md); các mô tả gate kiểm tra chương và thoát ngay sau1lần rời tab phía dưới là lịch sử.

## Rà soát kích hoạt tài khoản — 14/10/2026, 23:53 UTC+7

Đọc Railway chỉ đọc:27/85học sinh còn must_change=1 (5Lớp11/2♥,22Lớp11/6),58không còn cờ yêu cầu đổi. Database chưa có lịch sử login đầy đủ; không coi thiếu session là chắc chắn chưa đăng nhập. Danh sách riêng .local/reports/hoc-sinh-chua-doi-mat-khau-20261014.md khôngGit; không đọc/xuất mật khẩu/hash/token hoặc đổi tài khoản. Chi tiết/snapshot ở đầu [session-handoff.md](session-handoff.md).

## Dau Tay đủ điều kiện Săn điểm Chương I — 14/10/2026, 23:36 UTC+7

Theo yêu cầu cập nhật sau chẩn đoán, đã điều chỉnh thủ công đúng1hàng progress ChươngI trên Railway lên **7200giây/2giờ**. Backup/audit trên volume, transaction/so sánh progress và40bảng khác giữ nguyên, quick_check/FKđạt; kết nối chỉ đọc xác nhận **eligible=true**,79,5%đúng/0câu cần sửa/3vé/kiểm tra mở. Không tạo phiên học/lịch sử theo ngày/điểm/vé hoặc dùng vé/bắt đầu bài thi.2/2ca script độc lập đạt, không đổi mã/deploy/push; giữ phần UI đang sửa. Chi tiết ở đầu [session-handoff.md](session-handoff.md). Chẩn đoán thiếu giờ bên dưới là snapshot trước cập nhật.

## Chẩn đoán quyền Săn điểm Dau Tay — 14/10/2026, 23:29 UTC+7

Đọc Railway chỉ đọc xác nhận ChươngI của Dau Tay còn thiếu thời gian:3828,673/7200giây, thiếu~56phút11giây (UI57phút); lớp60phút/cấp. Mở kiểm tra/79,5%đúng/0câu cần sửa/3vé đều đã đạt. Không sửa tiến độ, vé hoặc điều kiện; snapshot có thể thay đổi khi học tiếp. Chi tiết/cách đọc lại ở đầu [session-handoff.md](session-handoff.md).

## Hiện hành: thống kê ở toolbar, sắp xếp chương kéo thả — 14/10/2026

Quản lý học sinh dùng **Thống kê** cạnh **Thêm học sinh**, bỏ nút từng dòng. Popup chọn cả lớp/một người từ roster đầy đủ, giữ ngày/tuần/tháng/ngày xem, tổng/bảng kỳ; cả lớp có bảng từng học sinh và popup rộng880px desktop. Xuất CSV trong popup đúng lựa chọn, giữ lịch sử chưa biết rỗng. Quản lý chương bỏ select Vị trí, thêm **Sắp xếp** cạnh Thêm chương: kéo chuột/cảm ứng hoặc nút/phím lên xuống, Lưu thứ tự/Hủy và lỗi/busy/focus. Không thay ID/thời gian/điểm hoặc thêm thư viện/migration. API tổng lớp mới teacher-only; cần backend Railway mới, cá nhân và lưu thứ tự dùng API cũ. Frontend local5173/HMR; chưa commit/push/deploy. QA mới: TypeScript/build/14API đạt, lượt trước22/22E2E có ca trạng thái hoạt động; **lượt xác nhận cuối18/18E2E thống kê/sắp xếp desktop/mobile đạt** trên build cuối, đã xem ảnh và kiểm tra bảng đủ cột desktop/mobile không overflow. Chi tiết ở đầu [session-handoff.md](session-handoff.md). Giữ ghi chú điều chỉnh dữ liệu từ công việc đồng thời bên dưới.

## Điều chỉnh tỷ lệ đúng Dau Tay Chương I — 14/10/2026

Theo lựa chọn rõ của người dùng, sửa10lượt sai đã có ở ChươngI lớp11/2 của Dau Tay để thành **28/31 đúng≈90,3%** (trước18/31≈58,1%). Tổng số lượt/thời điểm không đổi; giữ sổ tay, giờ/điểm/vé, dữ liệu các chương/tài khoản khác. Điều chỉnh thủ công có backup/audit, không coi là lượt học mới. Kiểm tra scope40bảng/attempts, integrity/FK và kết nối chỉ đọc độc lập đạt; không sửa app/push/deploy. Chi tiết ở đầu [session-handoff.md](session-handoff.md).

## Hiện hành: popup tạo online với Bắt đầu ngay/Đã hiểu — 14/10/2026

Thay banner sau lưu online bằng popup đúng nội dung người dùng, hai lựa chọn Bắt đầu ngay/Đã hiểu. Bắt đầu dùng ID vừa trả từ create, API open hiện có và X/Y cũ; lỗi trong popup/thử lại, khóa khi gửi, đóng thành công/cập nhật danh sách. Đã hiểu giữ bản chưa bắt đầu; focus về Tạo bài kiểm tra. QA mới: TypeScript/build đạt;14ca hồi quy online đạt, lượt xác nhận cuối6/6 popup desktop/mobile đạt sau sửa harness reload chọn lại lớp/page. Có bank/upload/trùng tên/start/lỗi/busy/ack/reload/geometry/focus. Không thêm backend/migration ở thay đổi popup. Phần thống kê trước đã commit riêng03f8cec để push cùng đợt theo yêu cầu; không database/secrets/deploy. Chi tiết mới ở đầu session-handoff.

## Chốt Git thống kê thời gian theo kỳ — 14/10/2026

Theo yêu cầu push sau chỉnh popup online mới, giữ và chốt phần thống kê đã hoàn tất trong commit riêng để đưa lên origin/main cùng đợt. Fetch trước commit xác nhận local/remotecbdecd9, diff check đạt; không kèm .local/database/secrets. QA144server/14E2E/6xác nhận là của lượt triển khai thống kê đã ghi, không chạy lại trong bước Git. Chưa xác minh backend Railway mới; chi tiết ở đầu session-handoff.

## Hiện hành: thống kê từng học sinh theo ngày/tuần/tháng — 14/10/2026

Yêu cầu mới bổ sung báo cáo kỳ; người dùng chọn giữ nhãn **Đang luyện tập** hiện có, không thêm online tài khoản. Trong Quản lý học sinh, nút **Thống kê** từng ô thời gian mở Ngày/Tuần/Tháng, chọn ngày xem, ba tổng kỳ/tổng tích lũy, bảng/thanh so sánh, tự refresh5giây. Backend thêm ledger thời gian được xác nhận theo ngày VN, tuần thứ Hai và tháng; transaction cùng progress/phiên học, không reset/backfill dữ liệu cũ. Kỳ chưa theo dõi/thiếu một phần phân biệt rõ. API teacher/owner/member-only, đọc không cộng giờ. TypeScript/build và144/144 server đạt, lượt14/14 E2E desktop/mobile đạt; sau xử lý phiên qua rollout, lượt xác nhận cuối6/6 thống kê desktop/mobile đạt. Chi tiết ở đầu [session-handoff.md](session-handoff.md). Chưa commit/push/deploy; cần backend Railway mới, lịch sử bắt đầu khi backend đó chạy. Các mục “chưa làm ngày/tuần/tháng” phía dưới là trạng thái trước yêu cầu mới này.

## Điều chỉnh Dau Tay lớp 11/2: chương3/4 về0 — 14/10/2026

Đã đặt riêng **chươngIII vàIV về0giây** theo yêu cầu “chưa từng luyện tập”; dữ liệu hai chương có0attempts/0corrections trước và sau, không xóa lịch sử. ChươngI/II giữ mỗi3600giây, tổng7200giây. Có backup/audit và xác nhận chỉ đọc độc lập trên Railway thật. Không đổi mã hoặc database local; chi tiết ở đầu [session-handoff.md](session-handoff.md). Ghi nhận cả4chương mỗi1giờ phía dưới là trạng thái trước yêu cầu mới.

## Chốt push cập nhật thời gian luyện tập — 14/10/2026

Theo yêu cầu mới, chốt API/hiển thị trực tiếp thời gian luyện tập, test và tài liệu vào **origin/main**. Fetch xác nhận main/remote cùng7683297 trước commit; không kèm database/.local/secrets. Các ghi nhận “chưa push” bên dưới là trước đợt chốt này. Không chạy lại hoặc báo kết quả kiểm thử lượt triển khai thành test mới của phiên Git. Chưa xác minh Railway triển khai backend mới; chi tiết ở đầu [session-handoff.md](session-handoff.md).

## Hiện hành: cập nhật thời gian luyện tập tại bảng giáo viên — 14/10/2026

Theo giải thích mới của người dùng, làm thời gian luyện tập cập nhật khi học sinh đang học ở bảng **Quản lý học sinh**, chưa làm báo cáo ngày/tuần/tháng. API nhẹ `GET /api/classrooms/:id/student-activity` chỉ chủ lớp, tổng giây đã ghi nhận và thời hạn tín hiệu phiên học theo đúng lớp; không cộng thời gian hoặc trả session ID. Frontend đồng bộ5giây, hiện giây và nhãn Đang luyện tập, hết tín hiệu thì bỏ nhãn; giữ refresh đầy đủ30giây. Lỗi/mất mạng không giữ trạng thái live giả; backend cũ có hướng dẫn cập nhật/Thử lại. Không migration/dữ liệu mới. QA cuối: TypeScript/build,137/137 server và8/8 E2E desktop/mobile đạt trên dữ liệu riêng; đã xem ảnh. Cần triển khai backend Railway mới; chưa push/deploy hoặc kiểm thử ghi production. Chi tiết ở đầu [session-handoff.md](session-handoff.md).

## Chốt push các chỉnh giao diện theo ảnh — 14/10/2026

Theo yêu cầu push remote, gom các thay đổi lời dẫn/thẻ/roadmap/Top1, avatar-header1,5× và Top3 thấp/chỉ icon cấp cùng test/tài liệu để commit/push **origin/main**. Fetch trước commit: main local/remote cùng915f7d6, git diff --check đạt; không kèm .local/database/secrets. Trạng thái “chưa push” của các lượt dưới đã được thay bởi đợt chốt này. QA là các lượt đã chạy vừa trước yêu cầu push, không chạy lại hoặc báo thành kết quả mới trong phiên Git. Chưa xác minh Railway phục vụ bundle mới từ thao tác push; chi tiết ở đầu session-handoff.

## Điều chỉnh dữ liệu theo yêu cầu: Dau Tay lớp 11/2 — 14/10/2026

Đã đặt thời gian học của **Dau Tay trong Lớp 11/2 ♥** thành **3600giây ở mỗi4chương đang dùng**, tổng14400giây, trên database Railway thật. Có backup WAL-safe và audit trước/sau trên volume; transaction commit và kết nối chỉ đọc độc lập xác nhận đủ4giá trị. Chỉ sửa progress.seconds của đúng tài khoản/chương, không sửa điểm/attempts/corrections. Không đổi mã, push/deploy hay database local. Chi tiết và đường dẫn backup ở đầu [session-handoff.md](session-handoff.md).

## Hiện hành: Top3 gọn chiều cao, cấp chỉ icon — 14/10/2026

Theo ảnh mới, giảm bục Top3 còn188/174/160px desktop và168/156/144px khung hẹp, bỏ khoảng tên ngắn/gap/padding thừa. Bỏ chữ Cấp+n trong Top10, giữ icon có nhãn accessibility. Crown/medal/goldframe, thứ hạng/chỉ số/bar/tên dài và avatar header1,5× giữ đúng yêu cầu trước. Chỉ CSS/JSX, không backend/dữ liệu mới. TypeScript/build và14/14 E2E desktop/mobile đạt; đã xem ảnh, chi tiết ở đầu session-handoff. Local5173/HMR, chưa commit/push.

## Hiện hành: avatar và tên tài khoản header lớn1,5× — 14/10/2026

Avatar header51px mobile/60px màn lớn và tên21px, tăng1,5× so với34/40px và14px cũ. Scoped ba vai trò, giữ vai trò nhỏ/ảnh ở bảng/Top10/tài khoản. Header portrait tự tăng chiều cao, giữ lớp/nút tài khoản, offset và khoảng focus theo chiều cao thật. TypeScript/build và14/14 E2E portrait/account desktop/mobile mới đạt; sau scroll-margin cuối build và8/8 E2E portrait đạt, đã xem ảnh. Chi tiết ở đầu session-handoff. Local5173/HMR phục vụ CSS200, chỉ frontend; chưa commit/push, giữ đợt ảnh trước.

## Hiện hành: lời dẫn gọn, màu tiến độ và vinh danh rõ hơn — 14/10/2026

Theo bốn ảnh và lời góp ý mới: châm ngôn in nghiêng/nhạt/ngoặc kép, rút lời dẫn (16 notes giảm~22% từ). Thẻ chương0giây xám, đang học màu cũ, cấp5 xanh/viền đậm/thanh xanh/check và CTA Ôn tập lại; giữ phiên practice/cấp/thời gian thật, không hiển thị100% sớm do làm tròn. Timeline nhãn chương gọn/bo6px, đạt KếtTrái xanh, thời gian học thêm sau mốc đỏ; mốc4 và5 mỗi mốc lớn thêm20%, cấp5 nhiều quả/dấu hoàn thành. Giữ tâm đường và thêm khoảng trống container hẹp. Top1 có crown/viền vàng/bục sáng, hạng4–10 có thanh tỷ lệ đúng xanh/sai đỏ theo correct/total, dữ liệu thiếu giữ—/không bar giả.

Chỉ React/CSS/SVG frontend, không API/migration/điểm/dữ liệu/quyền mới. TypeScript/build riêng và6/6 comparator đạt; lượt đầu26/26 E2E desktop/mobile đạt. Sau chỉnh spacing, hồi quy UI/cấp/Top10 và4ca workflow đạt; ca online cập nhật harness cho popup/lối quay lại danh sách hiện hành, **2/2 desktop/mobile cuối đạt**. Chi tiết các lượt12/18,16/18 và xác nhận cuối ở đầu session-handoff, không báo toàn repository E2E đạt. Local5173/HMR phục vụ mã mới200, API-DB vẫn Railway; không ghi thử production. Chưa commit/push đợt mới. Thiết kế current ở đầu app-design; quyết định palette trước đó không ghi đè màu theo trạng thái mới.

## Hiện hành: chương có thứ tự lưu, tạo chương hiển thị danh sách — 14/10/2026

Hộp tạo chương liệt kê chương hiện có và vị trí cuối của chương mới. Quản lý chương có ô chọn Vị trí1–N, lưu thứ tự server, tự dịch các chương còn lại và giữ qua reload; trạng thái gửi/lỗi/thử lại rõ ràng. Xóa icon44px ngay trước tên, giữ xác nhận/archive. Xem tiến độ Tổng quan giáo viên mở Lớp học của tôi → Khu vườn của lớp, thay lối tắt Quản lý lớp cũ; roster vẫn trong Quản lý học sinh.

Migration bổ sung bảng thứ tự, giữ schema chapters3cột/ID/lịch sử và backfill thứ tự cũ. Trigger thêm mới vào cuối từng lớp. API reorder teacher-owner-only, permutation toàn bộ chương active, atomic/reject trùng/thiếu/ID khác lớp/archive. Các nguồn hiển thị luyện/ngân hàng/ôn-thi/ma trận/cấp chương dùng thứ tự mới; snapshot và dữ liệu học giữ nguyên. Backend cũ khóa select qua capability. **Backend Railway cần triển khai để lưu thứ tự; chưa xác minh deployment từ push.**

QA mới:134/134 server đạt (5ca mới), TypeScript/build riêng đạt; **18/18 E2E desktop/mobile đạt** trên build cuối, gồm thứ tự/tạo/xóa/lỗi lưu/capability/menu/cấp cây và lối tắt khu vườn. Chi tiết lượt đầu/ảnh/responsive tại đầu [session-handoff.md](session-handoff.md). Test dùng database/server riêng, không ghi Railway. Frontend5173 đã ready bằng npm run local. Mã/tài liệu đi cùng push origin/main theo yêu cầu.

## Hiện hành: Top3 nằm trong bục, gọn hai hướng màn hình — 14/10/2026

Theo ảnh mới, đưa avatar/tên/cấp/chỉ số vào trong bục vàng/bạc/đồng, bỏ medal lớn lặp. Cụm tối đa800px, vàng cao nhất/bạc trái/đồng phải chung chân; chênh cao16px desktop,14px khung hẹp. Container query thích ứng cả mobile/desktop portrait/landscape, giữ tên dài/title và số thập phân/4chữ số trong khung. Không backend/migration/dữ liệu mới; danh sách4–10 và xếp hạng giữ nguyên. TypeScript/build và10/10 E2E desktop/mobile mới đạt, đã xem ảnh ba hướng/kích thước tiêu biểu. Mã/tài liệu đợt này được push origin/main theo yêu cầu; QA và deployment thực tế ở đầu [session-handoff.md](session-handoff.md).

## Hiện hành: Top10 chung và Quản lý học sinh đúng tab — 14/10/2026

Theo yêu cầu mới nhất, **bỏ quyết định skip chuyển roster của đợt trước**. Giáo viên/học sinh đều thấy **thông tin chung → Vinh danh Top10 → Vinh danh Kết Trái → Khu vườn chung**. Bỏ hai bảng xếp hạng cũ của học sinh. Giáo viên có **Quản lý cấp độ → Quản lý chương → Quản lý học sinh** trong Quản lý lớp, giữ search/CSV/Thêm học sinh/sổ tay/reset và thống kê khắc phục. Không chuyển dropdown chọn lớp.

API honors mới cho thành viên hiện tại/giáo viên sở hữu trả whitelist tên/avatar/cấp/câu/tỷ lệ; không mở quyền đọc roster/email cho học sinh. Comparator/tiến độ/dữ liệu giữ nguyên. Không cần migration. Nguồn lỗi có Thử lại, giữ vườn/roster và không giả0. Đợt này cập nhật mã/tài liệu/test để push origin/main theo yêu cầu; deployment Railway chưa xác minh. QA mới: TypeScript/build,129/129 server,6/6 comparator và60/60 E2E liên quan desktop/mobile đạt; test dùng DB riêng. Cách tiếp tục ở đầu [session-handoff.md](session-handoff.md); các đoạn skip/roster giữ trang lớp bên dưới thuộc lịch sử trước yêu cầu mới.

## Chốt đợt push sau pull — 14/10/2026

Đã push mã và tài liệu trong commit **124cb18** lên **origin/main**, đối chiếu SHA remote/local khớp. Working tree mã sạch; chỉ giữ file khóa PowerPoint bên ngoài commit. Xác nhận này được cập nhật bằng commit tài liệu tiếp theo; chưa xác minh phát hành Railway.

Đã pull bca6afd và giữ navbar/badge mới từ remote khi ghép các chỉnh local. Theo yêu cầu skip mới nhất, **Danh sách Học sinh giữ ở Lớp học của tôi**, không chuyển sang Quản lý lớp. Đợt bàn giao Git gom Top10/huy chương/gọn bảng, các màu/nhãn/icon/menu, quyền nộp mọi thành viên nhóm và archive chương cùng tài liệu; không kèm dữ liệu riêng. Xem commit/trạng thái remote thực tế bằng Git, không dùng các đoạn “chưa push” lịch sử để triển khai lại tính năng.

QA mới: TypeScript/build,127/127 server,6/6 comparator đạt. E2E lượt rộng có lỗi fixture lớp demo; đã tách lớp/API memberships đúng và lượt xác nhận24/24 desktop/mobile đạt. Chi tiết từng lượt ở đầu [session-handoff.md](session-handoff.md). **Triển khai Railway chưa được xác minh từ thao tác push**; không khẳng định backend mới đã phát hành.

## Bảng chăm vườn bỏ cột cây — 14/10/2026

Bảng Những người chăm vườn bỏ cột Cây ra hoa theo ảnh, chỉ còn hạng/tên/thời gian. Không đổi thứ hạng/quy tắc/API hoặc các bảng khác. TypeScript/build và2/2 E2E desktop/mobile mới đạt; local5173/HMR, chưa push. Chi tiết ở đầu [session-handoff.md](session-handoff.md).

## Hiện hành: Quản lý chương/cấp độ, giữ danh sách học sinh — 14/10/2026

Theo yêu cầu mới nhất bỏ qua việc chuyển danh sách, Roster/Danh sách Học sinh **giữ tại Lớp học của tôi cùng vườn/Top10**. Giữ đổi tiêu đề Quản lý chương/Quản lý cấp độ và nút Xóa chương + popup tên/count/Hủy/Xóa, server archive có xác nhận/quyền sở hữu/transaction/retry; giữ lịch sử và sửa sai, không xóa vật lý dữ liệu. API trả canDeleteChapter, máy chủ cũ giữ nút chờ cập nhật. Không tạo danh sách các lớp mới hoặc đổi header chọn lớp.

TypeScript/build,30/30 kiểm thử API và32/32 E2E desktop/mobile mới đạt,320–1920px không overflow. Frontend local5173/HMR đã cập nhật. **Chưa push/deploy: cần triển khai backend Railway mới để nút Xóa chương hoạt động.** Không ghi thử dữ liệu thật. Chi tiết/giả định “danh sách lớp” và cách archive ở đầu [session-handoff.md](session-handoff.md), [question-bank.md](question-bank.md).

## Top3 sát bục, icon chỉ số và huy chương mới — 14/10/2026

Vinh danh thu gọn khoảng cách Top3, ba chỉ số chỉ icon/số trên một hàng, bỏ dãy chip tiêu chí khỏi phần nhìn thấy. Huy chương SVG vàng/bạc/đồng có số hạng lớn và ruy băng, nằm gọn trong bục cả mobile/desktop. Hạng4–10 giữ bố cục/nhãn; không đổi comparator hoặc dữ liệu. TypeScript/build và4/4 E2E mới đạt, kiểm tra320–1920px/tên dài/tỷ lệ thập phân/số4chữ số/không spillout. Frontend local5173/HMR, chưa push/deploy. Chi tiết và giới hạn ảnh QA ở đầu [session-handoff.md](session-handoff.md).

## Nhãn số lượng và trạng thái chương — 14/10/2026

Quản lý lớp tách số bài/số câu thành hai nhãn vàng kem/xanh, số in đậm; trạng thái kiểm tra mở xanh đậm hơn, khóa đỏ. Không đổi số liệu hoặc thao tác mở/khóa. TypeScript/build và4/4 E2E desktop/mobile mới đạt, đã xem ảnh hai kích thước; local5173/HMR, chưa commit/push. Chi tiết ở đầu [session-handoff.md](session-handoff.md).

## Nút xóa bài dạng icon — 14/10/2026

Danh sách bài Quản lý lớp dùng nút thùng rác trước tên, bỏ chữ Xóa bài trên hàng; giữ tooltip/nhãn trợ năng và modal xác nhận. Grid giữ icon cạnh tên dài, vùng chạm44px. TypeScript/build và2/2 E2E desktop/mobile mới đạt; local5173, chưa commit/push. Xem đầu [session-handoff.md](session-handoff.md).

## Màu chờ/mở kiểm tra — 14/10/2026

Thẻ Săn điểm học sinh: nhãn chờ giáo viên mở kiểm tra màu đỏ nhạt cùng style pill; nhãn đã mở màu xanh với nền pha20% xanh đậm hơn. Không đổi quyền hoặc điều kiện dự thi. TypeScript/build và2/2 E2E desktop/mobile mới đạt; frontend local5173/HMR, chưa push/deploy. Chi tiết QA ở đầu [session-handoff.md](session-handoff.md).

## Tên menu lớp và tab khu vườn — 14/10/2026

Menu học sinh hiện là **Lớp học của tôi**; tab đầu giáo viên hiện là **Khu vườn của lớp**, phía dưới không còn heading/mô tả vườn lặp. Giữ menu/h1 giáo viên Lớp học của tôi, route và dữ liệu. TypeScript/build và16/16 E2E desktop/mobile mới đạt; local5173/HMR đã cập nhật, chưa commit/push. Chi tiết ở đầu [session-handoff.md](session-handoff.md).

## Vinh danh Top10 theo cây và thành tích — 13/10/2026

Lớp học của tôi giáo viên có3 bục vàng/bạc/đồng và hạng4–10 phía dưới (lựa chọn người dùng1). Ưu tiên **cấp cây cao nhất trong chương của lớp → số câu practice đã làm riêng biệt → tỷ lệ đúng chưa làm tròn → câu đã khắc phục**. Bằng cả4 dùng tên/ID để giữ vị trí ổn định. Dùng dữ liệu roster/leaderboard thật, không thêm số liệu để đủ10; thiếu metric báo chờ. Refresh30giây/focus/reconnect, search học sinh không ảnh hưởng Top10.

TypeScript/build,6/6 unit và18/18 E2E desktop/mobile mới đạt; đã xem bố cục320/1440px và kiểm tra cả390/768px. Chỉ frontend local5173/HMR, chưa push/deploy đợt này. Chi tiết/giới hạn QA ở đầu [session-handoff.md](session-handoff.md); không dùng trạng thái này để khẳng định backend nộp nhóm đã được triển khai.

## Quyền nộp nhóm mở cho mọi thành viên — 13/10/2026

Mã server/frontend đã cho mọi thành viên hiện tại, được phân vào nhóm, nộp sản phẩm cho nhóm mình trước hạn; giữ người nộp/version/idempotency và các kiểm tra lớp/hạn/file. Đại diện đứng đầu danh sách và selector, vai trò đại diện do giáo viên đổi như cũ. Không có migration/reset dữ liệu. TypeScript/build,9/9 kiểm thử API nhóm và12/12 E2E desktop/mobile mới đạt; QA browser/giới hạn ở [session-handoff.md](session-handoff.md).

**Chưa push/deploy backend Railway trong đợt này.** Sắp xếp đại diện đã hiệu lực local; quyền mọi thành viên cần backend mới. Frontend thiếu capability `memberSubmissions` báo chờ cập nhật và chỉ giữ quyền đại diện của API cũ, không hứa chức năng chưa triển khai.

## Huy chương vàng/bạc/đồng — 13/10/2026

Ba hạng đầu trong xếp hạng học sinh có huy chương Phosphor Duotone, màu vàng/bạc/đồng và số1/2/3 ở tâm. TypeScript/kiểm tra render390/1440px đạt, local5173 đã cập nhật. Giữ phạm vi trang giáo viên/roster theo yêu cầu trước; không thêm dữ liệu hoặc push.

## Lớp học gọn hơn, thống kê khắc phục trong danh sách học sinh — 13/10/2026

Trang Lớp học của tôi giáo viên bỏ hai bảng xếp hạng chăm vườn/sửa sai; vẫn giữ vườn/khung Kết Trái. Roster thêm Câu đã khắc phục, header thời gian dùng icon đồng hồ có nhãn trợ năng. Dùng leaderboard đã tải của đúng lớp để lấy số câu trạng thái resolved; không thêm API/backend/migration. Chưa có số liệu hiện—, tải xong người chưa khắc phục câu nào hiện0. Xếp hạng học sinh và màu huy chương vẫn có. QA mới và trạng thái local/chưa push tại đầu [session-handoff.md](session-handoff.md).

## Hiện hành: tài khoản học sinh lớp 11/6 Vật lí — 13/10/2026

Đã nhập **34 học sinh mới** vào lớp **11/6 · Vật lí** có sẵn trên Railway. Đối chiếu56 tài khoản trước nhập: **0 trùng tên/email**. Đăng nhập họ tên viết liền không dấu + **@greenedu.nk**, mật khẩu tạm theo yêu cầu và bắt buộc đổi lần đầu. Xác minh kết nối mới:34 tài khoản/34 membership, hash/cờ đổi đúng; tổng90 tài khoản. Giữ56 tài khoản cũ, membership cũ và35 bảng khác; backup/integrity/FK/health đạt.3/3 ca script nhập bằng DB riêng đạt. CSV riêng **.local/tai-khoan-lop-11-6.csv**; chi tiết/backup tại đầu [session-handoff.md](session-handoff.md). Chỉ cập nhật dữ liệu được yêu cầu, không deploy/push hoặc tạo tiến độ giả. Các ghi chép Railway chỉ có lớp11/2/51 tài khoản phía dưới là lịch sử.

## Ba hạng đầu vàng/bạc/đồng — 13/10/2026

Hạng1/2/3 có badge và nền hàng/thẻ tương ứng vàng/bạc/đồng trong cả hai bảng xếp hạng. Dùng rank thật từ API, giữ số/nhãn Bạn và dữ liệu. TypeScript và kiểm tra CSS Chromium390/1440px đạt, tương phản số ≥4,5:1. Hiệu lực local5173/HMR; thay đổi này và căn giữa submenu chưa commit/push.

## Căn giữa submenu theo ảnh — 13/10/2026

Đã căn giữa chữ và badge trong từng tab submenu, cả mục đang chọn và chưa chọn. Kiểm tra hình học bằng Chromium tại320/390/768/1440px đạt, giữ submenu một hàng trên dock. CSS hiệu lực qua local5173/HMR; chỉnh nhỏ này chưa commit/push. Bản redesign8dc5aac trước đó đã push origin/main.

## Hiện hành: navbar mobile gọn và submenu căn đều

Sau preview đã push `c92409c`, tiếp tục tinh chỉnh theo ảnh mới: dock portrait84px + safe area, ô64px, tên đầy đủ tối đa hai dòng/font11–13px, icon Luyện tập16px. Năm ô đều và icon giữ vị trí khi chọn; submenu Luyện tập/Khu vườn lớp và các trang chung căn giữa icon/nhãn/badge trong ô đều44px. Giữ badge câu sai trắng/đỏ tròn và đệm nội dung theo kích thước thật. Chỉ frontend, push remote theo yêu cầu đã chốt; kết quả/bằng chứng tại [session-handoff.md](session-handoff.md), hình thức tại [app-design.md](app-design.md). Git push không chứng minh Railway đã deploy thành công.

QA mới: TypeScript/Vite build và **18/18 E2E desktop/mobile** đạt trên server/SQLite riêng; đã kiểm tra hai dòng đủ chữ từ320px, icon không dịch chuyển, submenu/badge căn giữa và đệm nội dung/focus. Chưa nghiệm thu Safari/thiết bị thật hoặc deployment Railway.

## Hiện hành: hoàn tất redesign với hai skill — 13/10/2026

Đã cài/đọc `redesign-existing-projects` làm chính và `web-design-guidelines` kiểm tra; [nguồn/đường dẫn](design-skills.md). Hoàn tất yêu cầu gửi lại: submenu một hàng trên navbar đáy portrait/không che nội dung, header và thẻ có sắc vườn, bộ5 cấp mới/cây ra hoa có+, ôn/online hai vai trò, form tạo online mở bằng nút rồi lưu vào danh sách, metadata có icon/màu, căn controls, bỏ chữ phụ nhóm và thay rào vườn. Bỏ các nút refresh thừa sau khi có poll/focus/reconnect; giữ Thử lại và thao tác Lưu/Cập nhật mật khẩu thật.

Chỉ frontend, giữ backend/dữ liệu/điểm/vé/ngưỡng cấp/phân quyền. Local5173/HMR → Railway đang chạy, QA trên DB/server riêng. **TypeScript/build và72/72 E2E desktop/mobile mới đạt**; hai ca timer cũ ngoài lượt cuối chưa nghiệm thu. Kết quả/giới hạn QA ở [redesign-qa-20261013.md](redesign-qa-20261013.md); thiết kế mới nằm đầu [app-design.md](app-design.md), thay mục submenu sticky và hình thức cấp cũ. Đợt này người dùng yêu cầu commit/push origin/main; Railway cần xác nhận triển khai riêng, không đồng nhất build/push với deploy. Ghi chép xóa hoạt động Chủ đề1 đã được giữ khi pull và hợp nhất vào tài liệu.

## Lịch sử trước redesign: đồng bộ mã mới qua pull — 13/10/2026

`main` đã pull lên `3bb7fcf`, khớp origin/main. Ghi chép local xóa hoạt động Chủ đề1 được hợp nhất với tài liệu upstream, vẫn chưa commit; không còn conflict. Giữ stash/bản sao riêng để phục hồi, không đổi database hoặc deploy. Yêu cầu redesign mới tiếp tục trên bộ Duotone/menu/tab hiện có, tránh khôi phục bố cục cũ; chưa bắt đầu sửa UI trong đợt pull. Hai skill được nêu chưa tìm thấy SKILL.md trong các vị trí đã tra cứu, cần đường dẫn để đọc đúng hướng dẫn. Chi tiết tại [session-handoff.md](session-handoff.md).

## Hiện hành: áp dụng bộ GreenEdu Duotone đã duyệt — 13/10/2026

Theo yêu cầu “áp dụng đề xuất”, đã chuyển toàn bộ icon UI trong `src` sang Phosphor Duotone và thay5 SVG cấp cây bằng bộ đã duyệt trong `.local/greenedu-icons-preview.html`. Icon lớp/ngân hàng/ôn/online/vườn/nhóm/sổ tay/tài khoản/cài đặt phân biệt theo chức năng; giữ nhãn accessibility và hành vi. Tập trung SVG trong `src/icons.tsx`, chỉ dùng weight Duotone; JS chính474998 byte, không còn cảnh báo chunk500KB của bản thử dùng mọi weight. Avatar/logo/minh họa và dữ liệu giữ nguyên.

QA mới: TypeScript/Vite build `.local/duotone-icons-final-build` đạt; **48/48 E2E desktop/mobile đạt** trên server/SQLite riêng, gồm4 ca icon mới cùng hồi quy UI, account, menu/tab, heading, sidebar note, cấp cây và vườn lớp. Icon menu vừa khung tại320/390/768/1440px. Frontend local5173/HMR phục vụ module mới200; kiểm tra trang login bằng Chromium không có lỗi JS/request. Chỉ frontend, không ghi thử Railway, chưa push/deploy. Xem đầu [app-design.md](app-design.md) và [session-handoff.md](session-handoff.md).

## Hiện hành: UI/UX gọn hơn và thao tác học tập trực tiếp — 13/10/2026

Theo yêu cầu dùng `redesign-existing-projects` + `web-design-guidelines`, thêm lớp polish cho thẻ/hero/thống kê/thao tác nhanh/bảng/search/focus và responsive, giữ nhận diện khu vườn/Be Vietnam Pro/màu nghiệp vụ. Kế thừa menu **5 mục mỗi vai trò giáo viên/học sinh** và tab Quản lý lớp trong mã nền `2ab909f`; các mô tả menu 6/7/9 mục/cài đặt ở trang ôn cũ bên dưới không thay cấu trúc này.

Mục tiêu học tập mở đúng chương có câu; chưa có câu/chương có trạng thái rỗng. Badge sửa sai khôi phục ở menu Luyện tập/tab Sổ tay. Roster tìm tiếng Việt không dấu, xóa lọc và đếm kết quả. Thống kê giáo viên phân biệt tải/lỗi với số 0 và thử lại được. Skip link ba vai trò giữ URL, modal giữ focus với link/controls và reduced-motion. Không thay API, dữ liệu, điểm hoặc quy tắc thi.

TypeScript/build riêng đạt, **34/34 E2E hồi quy mới đạt** trên server/SQLite riêng; sau sửa icon mobile cuối, TypeScript/build và **10/10 E2E app-polish đạt**, có kiểm tra khoảng cách icon/chữ320/768/1440px. Chi tiết từng lượt tại đầu session-handoff. Local5173/HMR đã phục vụ CSS mới200; API/DB Railway không ghi thử, chưa push/deploy. Thiết kế cập nhật ở đầu [app-design.md](app-design.md).

## Hiện hành: nút hoạt động khác màu nút vô hiệu hóa — 13/10/2026

Nút phụ dùng xanh lá nhạt thay màu xám trình duyệt, nút mở kiểm tra xanh đậm, nút khóa/đóng thi nâu đỏ và nút xóa/bỏ câu nâu đỏ theo mức nhấn. Chỉ nút không bấm được dùng xám nhạt nhất quán ở mọi trang. Build và 4/4 E2E học/thi đạt trên DB thử riêng; chưa push. Xem phần đầu `docs/session-handoff.md`.

## Hiện hành: ổn định chữ tab portrait khi chuyển — 13/10/2026

Giữ vùng chữ tab cao34px và fade-in sau khi ô tab đổi xong độ rộng để tránh hiện nhãn từ2 dòng rồi nhảy thành1 dòng. Chế độ giảm chuyển động hiện chữ ngay. Build và6/6 E2E portrait đạt trên DB riêng. Chưa push theo yêu cầu người dùng.

## Hiện hành: tên học sinh trong xếp hạng thẳng cột — 13/10/2026

Nhãn “Bạn” chuyển trước tên trong hai bảng xếp hạng vườn lớp, dành cùng chiều rộng nhãn cho mọi hàng để tên học sinh thẳng cột. Giữ thứ tự icon cấp sau tên. Build và2/2 E2E desktop/mobile đạt trên DB riêng. Chưa push vì người dùng chỉ muốn push khi yêu cầu.

## Hiện hành: thẻ luyện tập bớt nhãn trùng — 13/10/2026

Bỏ nhãn môn viết hoa phía trên tên chương trong các thẻ luyện tập học sinh; vẫn giữ môn trong thông tin lớp, tên chương, cấp và tiến độ. Xem bản bàn giao ở đầu `docs/session-handoff.md`.

## Hiện hành: tab con portrait neo cố định và danh sách lớp gọn — 13/10/2026

Tab con của các trang cha giáo viên/học sinh bám dưới header sticky khi cuộn portrait, dùng nền kem/mục chọn nâu để tách dock đáy xanh. Đổi tab/menu đưa trang về đầu. Danh sách Chương giáo viên gọn thành hàng, hai cột ở desktop rộng; roster giảm khoảng đệm. Hệ chữ Be Vietnam Pro giữ nguyên, các heading, section, caption, nút và form dùng cỡ/nhịp dòng chung. Build đạt, 14/14 E2E giao diện liên quan trên DB riêng đạt. Chi tiết bàn giao ở đầu `docs/session-handoff.md`.

## Hiện hành: dock portrait đủ tab, tab chọn nổi bật — 13/10/2026

Phone/PC portrait dàn toàn bộ điểm đến trên thanh dưới, không cần swipe. Chỉ tab được chọn hiện chữ bên dưới icon; tab còn lại là icon với aria-label tên đầy đủ. Tab cùng trục, không nhảy lên; ô chọn hẹp hơn và chuyển màu/kích thước mượt. Kiểm tra kích thước từ 320px đến 1024px, giữ menu desktop/landscape. Heading Hoạt động nhóm ẩn ảnh trang trí ở landscape, giữ ảnh ở portrait.

Đã push `792c97e` lên origin/main. Localhost5173 đang phục vụ frontend mới và proxy API Railway trả health ok; build root và checkout sạch, 10/10 E2E liên quan đạt.

Đã push `d67b4da` lên origin/main; build và 10/10 E2E giao diện liên quan đạt trên checkout/DB riêng. Runtime Railway của commit này chưa xác minh.

## Hiện hành: menu rộng hơn và thống kê cấp bằng icon — 13/10/2026

Sidebar desktop/landscape rộng hơn một chút, phần nội dung được căn theo mép mới; portrait không đổi. Khu vườn của tôi chỉ có Hành trình của tôi làm nơi xem timeline cấp theo chương, không còn thẻ CẤP ĐỘ CỦA BẠN lặp lại. Trong danh sách học sinh và bảng xếp hạng vườn lớp, cấp từng chương hiển thị bằng icon theo thứ tự chương và vạch ngăn, không hiện tên chương/tên cấp trực tiếp; title/nhãn hỗ trợ vẫn chứa thông tin đó. Không đổi dữ liệu cấp hay thời gian.

Đã push `506c8a6` lên origin/main và đối chiếu remote SHA. Build, 14/14 E2E desktop/mobile trên checkout sạch và DB riêng đạt. Runtime Railway của commit này chưa được xác minh.

## Hiện hành: Hành trình của tôi trong trang vườn cá nhân — 13/10/2026

Học sinh không còn tab Hành trình riêng. Timeline cấp/chương nằm dưới nội dung Khu vườn của tôi; nút Xem hành trình cuộn xuống đúng vùng, URL progress cũ mở trang vườn. Không thay dữ liệu/tính cấp. Giáo viên giữ tab lớp/nhóm. Build và12/12 E2E desktop/mobile trên DB riêng đạt; xem bàn giao. Quyết định thay mô tả home2 tab trong phần lịch sử.

Đã push `edd8ebe` lên origin/main; Railway health báo hai capability mới và bundle mới đã phục vụ. Xác minh chỉ qua GET, không ghi dữ liệu thật. Root còn các thay đổi song song online/Excel/helper được giữ nguyên sau đồng bộ.

## Hiện hành: kết thúc phiên học và gộp vườn lớp — 13/10/2026

Luyện/ôn/sửa sai: rời tab, mất focus, máy ngủ hoặc idle 120 giây kết thúc phiên, về trang chính và hiện popup trong app, tài khoản vẫn đăng nhập. Không cộng thời gian sau khi rời/ngủ hoặc đuôi phiên quá hạn. Phòng thi giữ quy tắc tab riêng; idle rời giao diện mà không đăng xuất. Giáo viên xem lịch sử đáp án sai trong sổ tay lớp, học sinh không thấy. Khu vườn lớp gồm vườn và xếp hạng cùng trang, bỏ tab xếp hạng; bớt ba dòng khoanh đỏ trong frame vườn. Quyết định này thay quy tắc đăng xuất sau120 giây và tab vườn2 mục ghi trong lịch sử dưới.

QA riêng đợt này: root build/124 backend, sau bổ sung đáp án thi sai4/4 API; checkout push build/122 backend,10/10 E2E desktop/mobile và2/2 ca rời phiên tăng cường. Tất cả dùng DB riêng. Xem bàn giao để đối chiếu scope/push, không coi QA hoặc Git push là bằng chứng dữ liệu Railway đã đổi.

## Góp ý cuối: lớp gọn và đúng/sai0–4 ý đúng — 13/10/2026

Đã bỏ caption lớp/môn/giáo viên ở Tổng quan, thẻ lớp trùng header và tab Tiến độ giáo viên. Lớp có2 tab Lớp học/Hoạt động nhóm; roster vẫn giữ thống kê/sổ tay, tiêu đề **Danh sách Chương / Danh sách Học sinh**. URL/callback Tiến độ cũ chuyển về lớp; học sinh giữ Hành trình. Đúng/sai nhận đủ16 key4 ý (0–4 ý đúng), không yêu cầu chỉ1 ý đúng.

Railway health trước push chưa có capability ba dạng câu nên mẫu Câu3 lưu bằng validator cũ. Frontend đã chặn máy chủ cũ bằng thông báo cập nhật rõ ràng trước write dạng mới; backend mới có questionTypes:true/studyIdleSeconds:120. QA mới TypeScript/build và4 API đạt;12/14 UI đạt,2 workflow phụ thuộc fixture chạy lại cùng2 student-practices đạt4/4; Word thử legacy capability không gửi POST, backend mới lưu đủ4 câu. Push/capability thực tế ở session-handoff. Không coi frontend HMR hoặc Git push là deploy Railway đã xác nhận.

## Ba dạng câu hỏi và kiểm soát thời gian học — 13/10/2026

Đã có trắc nghiệm/đúng-sai2–4 ý/trả lời ngắn trong tạo-sửa, nhập Word/CSV, phiên bản, luyện/sửa sai/ôn và đề thi. Mẫu Word có4 câu thuộc3 dạng; mẫu CSV10 cột, nhận file8/9 cột cũ. Ngắn so khớp đáp án, chuẩn hóa số thập phân chính xác, không chấm tự luận/biểu thức tương đương. Đúng/sai chấm cả câu, phản hồi từng ý; lời giải luyện mở khi đúng, đề thi giữ thời điểm công bố.

Giáo viên xem sổ tay từng học sinh trong roster với lọc chương/trạng thái và quyền sở hữu lớp. Số câu đã làm đếm câu practice riêng biệt, không tăng trùng khi làm lại; nút làm lại cuối luyện/ôn giữ lịch sử. Đã gọn các chú thích giải thích dư.

Thời gian theo câu/chương đang học, chỉ trong bài tập; focus loss/hidden/ngủ máy dừng, cảnh báo105s/đăng xuất120s kể cả offline, backend chặn hồi sinh phiên hết hạn và gap/stop khi pause. Phòng thi dedup blur+hidden, cảnh báo và khóa tại ngưỡng cả offline. Không thay ngưỡng thi hoặc chỉnh lại dữ liệu giờ lịch sử. Website xử lý tín hiệu rời tab, không có quyền khóa việc mở tab của trình duyệt.

Kiểm tra mới: TypeScript/build đạt;122/122 backend,20/20 UI chính,6/6 clock/review-repeat và2/2 typed-exam đạt riêng;24 kịch bản UI khác nhau đã xác nhận. Chỉ DB riêng, giữ công việc song song, không suy deploy Railway từ code/test. SHA/capability triển khai xem session-handoff.

## Submenu căn trái và thao tác tạo nhóm dưới tìm kiếm — 13/10/2026

Đã căn trái tab và nội dung các trang cha giáo viên/học sinh, bỏ khoảng lệch do main-content tự căn giữa trên màn hình rộng. Portrait có tab xuống dòng bám trái. Nút Tạo hoạt động nằm dưới hàng tìm kiếm/bộ lọc, bên trái toolbar; Cập nhật bên phải. Quyền, điều kiện lớp có học sinh, form và API giữ nguyên.

Kiểm tra mới đúng checkout push: TypeScript/Vite đạt; 12/12 QA tab/bố cục/nghiệp vụ nhóm đạt trước tinh chỉnh portrait, sau đó build cuối và 4/4 QA bố cục đạt (90 tổ hợp trang/vai trò/viewport 320–2200px). Test dùng server/database riêng, không Railway. Bảo toàn các thay đổi backend/ôn-thi/online/helper local song song; push chỉ UI và bổ sung tài liệu. Không suy deploy Railway từ kết quả local/push; chi tiết SHA và kiểm tra tại session-handoff.

## Gom chức năng vào tab và menu portrait xanh — 13/10/2026

Đã gom theo yêu cầu: giáo viên lớp→lớp/nhóm/tiến độ, vườn lớp→vườn/xếp hạng (6 mục chính); học sinh vườn tôi→vườn/hành trình, vườn lớp→vườn/xếp hạng (7 mục chính, nhóm vẫn ở menu). Menu cha active đúng; tab giữ qua reload/lớp, bàn phím/aria đầy đủ. Portrait menu đáy xanh đậm giống landscape, line phân vùng trên và giữa mục, active xanh nhạt; giữ dock/header/safe area.

TypeScript/build đạt. **12/12 UI** sau sửa khôi phục tab đạt trước bước chốt kiểm tra URL theo vai trò; bản cuối **28 ca liên quan đã xác nhận đạt** (22 đạt lượt đầu,6 chạy lại đạt sau cập nhật selector cha/con và dùng reload thật cho ca hash). Gồm tab/role/54 tổ hợp tab×vai trò×viewport, account/portrait/nhóm/cấp cây/ôn-thi/online và hash phòng thi; chỉ DB/server riêng3331. Đã xem ảnh giáo viên desktop/portrait, root HMR phục vụ module200. Push riêng UI/test/ba phần tài liệu; giữ16 file backend/nhóm online/helper local/tài liệu đang làm, runtime Railway chưa xác minh.

## Localhost504 và làm mới Vite cache — 12/10/2026

Đã khởi động lại Vite với optimizer `--force` để xử lý Outdated Optimize Dep, thêm `npm run local -- -Force`. Script xác minh đúng Vite/mode/repository đang giữ5173, chờ dừng tiến trình cũ và kiểm tra PID readiness để không báo chạy nhầm khi có Vite khác cùng repo. QA mới trang login+reload:16dependency request200, không lỗi tài nguyên/JS, health proxy Railway200; vẫn frontend local/API+DB Railway, không ghi dữ liệu hoặc push/deploy. CSS Forest hiện đã có; thiếu CSS của ghi chú trước là lịch sử. Chi tiết ở [session-handoff.md](session-handoff.md), lệnh ở [dev-railway.md](dev-railway.md).

## Đăng nhập gọn và nút Quên mật khẩu — 12/10/2026

Đã đưa chữ lớn lên trước slogan/badge, bỏ mô tả intro được đánh dấu, kéo form lên/căn với tiêu đề trên desktop và cùng cạnh trái trên mobile. Thêm nút Quên mật khẩu mở đúng thông báo liên hệ giáo viên chủ nhiệm hoặc admin theo yêu cầu; đóng bằng nút/Escape, giữ dữ liệu đang nhập và không gửi API reset.

TypeScript/Vite build và **8/8 E2E mới** login-layout/account-popups desktop/mobile đạt trên checkout push/DB riêng3331; kiểm tra320/390/768/1440, thứ tự chữ/vị trí/không tràn, modal/nội dung/focus/không submit/giữ fields và đăng nhập thật fixture. Đã xem ảnh desktop/mobile/modal. Push riêng frontend/test/ba phần tài liệu theo yêu cầu đã chốt, giữ công việc backend/nhóm online. Kết quả push ở session-handoff; runtime Railway chưa xác minh.

## Tiêu đề đầu trang chung, bỏ breadcrumb giáo viên/học sinh — 12/10/2026

Đã bỏ dòng breadcrumb trên toàn workspace giáo viên/học sinh; cụm tiêu đề/chữ nhỏ/mô tả và thao tác được đưa lên đầu header desktop. Dùng một WorkspaceHeading/slot, portrait trả về nội dung dưới thanh account/lớp sticky; không nhân đôi h1 khi xoay. Bao phủ lớp/ngân hàng/nhóm/góp ý/vườn/xếp hạng/tài khoản/ôn-thi/online/phiên học; Admin giữ riêng. Không đổi API hay dữ liệu.

TypeScript/Vite build đạt. **4 E2E mới kiểm tra88 tổ hợp trang×vai trò×viewport** (11 trang mỗi vai trò,1440/900/390/768) và xoay đạt; **26 luồng regression liên quan đã xác nhận đạt**, gồm24 đạt lượt đầu và2 góp ý đạt khi chạy lại sau sửa selector menu tiện ích bắt nhầm nút pause note từ đợt trước. Bằng chứng từng lượt ở session-handoff; không ghi thử Railway. Đã xem ảnh desktop/mobile; push riêng UI/test/ba phần tài liệu, giữ task backend/nhóm online. Runtime Railway chưa xác minh.

## Đáp án chọn sai đỏ nhạt, đúng xanh — 12/10/2026

Đã sửa kết quả thi: bổ sung wrong-choice cho đáp án chọn sai sau công bố, thay nền/viền/outline/ô A-B-C-D sang đỏ nhạt; đáp án đúng xanh. Palette sai áp dụng chung luyện/ôn/sửa sai. Không đổi nghiệp vụ hoặc tiết lộ đáp án trước công bố.

TypeScript/Vite build và **6/6 E2E mới** ba luồng learning desktop/mobile đạt trên checkout push/server SQLite riêng3331: luyện sai không lộ lời giải, ôn/sửa sai/tiếp tục, thi lưu offline/nộp/chờ công bố/đóng thi. Assertion kiểm tra chọn đúng/chọn sai/câu bỏ trống, nền/viền/outline/ô chữ đỏ và nền đúng xanh; đã xem ảnh kết quả. Push riêng UI/test/ba phần tài liệu, giữ backend/nhóm online đang làm. Kết quả push ở session-handoff; runtime Railway chưa xác minh.

## Lời nhắn sidebar đa dạng và tự đổi — 12/10/2026

Đã thêm16 lời nhắn và8 minh họa khu rừng/học tập trong ô sidebar; câu chữ/icon/hình đổi đồng bộ mỗi10 giây. Có nút tạm dừng, pause khi hover/focus/tab nền và fade nhẹ (tắt khi reduced-motion). Giữ chiều cao ô, sidebar hẹp không đè hình; menu/icon gốc và panel xanh không đổi.

TypeScript/build và **14/14 E2E mới** garden-note/warm-journey/portrait-navigation trên checkout chuẩn bị push đạt (DB/server riêng3331), gồm giáo viên/học sinh, chu kỳ10 giây/quay vòng16 câu8 hình, dừng/tiếp tục/hover/tab nền, sidebar900px/reduced-motion và layout desktop/mobile. Đã xem contact sheet16 câu. HMR5173 phục vụ mã mới200; API/DB Railway không ghi thử. Push riêng frontend/test/ba phần tài liệu theo yêu cầu đã chốt; kết quả push tại session-handoff. Runtime Railway chưa xác minh.

## Panel xanh và icon bám đường cong — 12/10/2026

Đã thực hiện góp ý mới: trả panel/nền minh họa/nút về xanh; cam-vàng chỉ nhấn tên chương và tiến độ; lời nhắc thời gian vàng nhạt, nghiêng, opacity 85%. Năm icon cấp độ bám đường lượn cả chiều ngang/dọc, current xanh; desktop/mobile không tràn ngang và giữ dữ liệu cấp độc lập. Menu/icon gốc và header giữ như đợt trước.

Kiểm tra mới trên checkout chuẩn bị push: TypeScript/Vite build và **20/20 E2E** warm-journey/student-levels/portrait-navigation/account-popups đạt trên server/SQLite riêng3331, gồm căn tâm icon/tick X/Y qua năm cấp, panel/nút xanh và lời nhắc nghiêng/85%; đã xem ảnh desktop/mobile. Frontend5173/HMR vẫn chạy với API Railway; không ghi thử dữ liệu thật. Push riêng UI/test/ba phần tài liệu theo yêu cầu, giữ các thay đổi backend/nhóm thi của task khác. Kết quả push được ghi trong session-handoff; runtime Railway chưa xác minh.

## Góp ý UI và header Tổng quan đã lên remote — 12/10/2026

Đã push **`7ea2fab`**, xác minh SHA remote/main local0/0. Trả menu9 mục/icon Lucide gốc; áp dụng progress/chip/lộ trình cong cam-vàng/note mint/italic, giữ khẩu hiệu gọn và CTA đồng. Bỏ breadcrumb Tổng quan, đưa khối chào/tiêu đề lên header desktop; portrait chỉ một h1 trong nội dung/account-dock cũ. TypeScript/build và **20/20 E2E cuối đúng checkout push đạt**,34/34 trước header ghi riêng; đã xem ảnh desktop/mobile và clip tiến độ khớp mốc.14 file công việc song song nguyên hash; chỉ23 file UI/asset/test/tài liệu được push, phần ôn-thi/backend cònlocal. Deployment/runtime Railway mới chưa xác minh; chi tiết [session-handoff.md](session-handoff.md), [app-design.md](app-design.md).

## Trả menu/icon gốc; tiến độ và lộ trình theo ảnh góp ý — 12/10/2026

Đã trả9 mục riêng giáo viên/học sinh, bỏ submenu và bộ icon Forest gắn mầm khắp nơi, dùng Lucide gốc. Giữ cây cấp độ thật. Thanh tiến độ cam/vàng/bo tròn, tên chương và lời nhắc lên tên cấp dạng pill; lộ trình cong5mốc với current/check/khóa. Sidebar note mint/italic/chậu cây-cáo một góc; banner giữ khẩu hiệu nhưng thu gọn theo lựa chọn1, CTA luyện màu đồng. Không đổi API/DB/cách tính thời gian/điểm.

TypeScript/build riêng và **34/34 E2E desktop/mobile trước tinh chỉnh cuối đạt**, đã xem ảnh; đang QA clip đường tô/italic và bản push riêng. Theo quyền push ngay khi hoàn thành đã chốt, chuẩn bị commit UI/asset/test/tài liệu, giữ phần ôn-thi/backend song song; chưa suy deployment Railway. Chi tiết [app-design.md](app-design.md), [session-handoff.md](session-handoff.md).

## Menu/submenu đã lên origin/main — 12/10/2026

Đã push **`f7ccb42`**, xác minh git ls-remote; main local/remote0/0, giữ14 file công việc song song nguyên hash. Menu giáo viên4mục/học sinh5mục, một submenu mở mỗi lần/auto mở nhóm theo trang; portrait vẫn dock phẳng. Commit riêng24 file UI/test/tài liệu, không đưa backend/nhóm thi/Excel của task khác. TypeScript/build và **30/30 E2E mới trên đúng checkout push đạt** sau sửa race matchMedia lúc mount (lượt trước29/30). Local5173/HMR đang chạy, nguồn mới200, không ghi Railway; deployment/runtime commit mới chưa xác minh. Chi tiết [session-handoff.md](session-handoff.md), [app-design.md](app-design.md).

## Menu/submenu gọn cho giáo viên và học sinh — 12/10/2026

Đã gom sidebar giáo viên9→4 mục chính, học sinh9→5; mỗi lần mở một nhóm, tự mở nhóm chứa trang hiện tại, submenu có active/bàn phím/Escape/badge sửa sai. Menu portrait vẫn phẳng theo dock/header cũ; xoay giữ đúng trang, Admin giữ menu đơn. CSS/icon Forest và lời nhắc sidebar gọn; không đổi API/DB. Helper test navigation đã dùng thao tác mở nhóm thực tế, giữ assertion nghiệp vụ.

**TypeScript/build riêng và30/30 E2E desktop/mobile mới đạt** trên DB/server riêng3320, đã xem ảnh giáo viên/học sinh/mobile. Frontend5173/HMR đang chạy, API/DB Railway thật không ghi thử. Chuẩn bị push riêng menu/UI/test/tài liệu theo yêu cầu trước đó, giữ các thay đổi ôn-thi/backend của task song song; QA bản push và kết quả remote/deployment cần phân biệt. Chi tiết [app-design.md](app-design.md), [session-handoff.md](session-handoff.md).

## Theme Forest đã lên origin/main — 12/10/2026

Đã push commit **`9d50b10`**, xác minh SHA bằng git ls-remote; main local đồng bộremote0/0. Commit riêng14 file giao diện/tài liệu từremote `00a15b9`, giữntfy và các thay đổi ôn-thi/backend của task song song cònlocal. TypeScript/build riêng và12/12 E2E portrait/account-popups **mới trên đúng checkout push** đạt;14 file công việc song song giữ nguyên hash từng byte sau đồng bộGit. Deployment/runtime Railway củacommit giao diện chưa xác minh. Chi tiết tại [session-handoff.md](session-handoff.md).

## Theme khu rừng tri thức áp dụng các trang — 12/10/2026

Đã đưa chữ nhỏ xuống dưới tiêu đề (12px desktop/11px mobile) ở đầu trang cả ba vai trò; frame dùng xanh lá/vàng mật ong/xanh trời/tím hoa, giữ trạng thái chọn và các màu đúng/sai/cảnh báo. Bộ `ForestIcon` dùng chung thêm lá/mầm/đốm sáng cho menu, header portrait, thống kê, thẻ lớp/nhóm, mục tiêu/vinh danh và empty state. Theme `src/forest-theme.css` đã hoàn tất; trạng thái thiếu file trong bàn giao task song song trước đó đã được giải quyết bằng mã thật và build mới.

**TypeScript/build riêng,12/12 E2E portrait/account-popups và48 tổ hợp trang/vai trò/desktop-mobile đạt** trên server/database kiểm thử riêng; đã xem ảnh, không tràn ngang/lỗiJS. Frontend5173/HMR đang chạy, nguồn CSS mới200/API vẫn Railway. Giữ toàn bộ thay đổi online/backend có sẵn, không ghi Railway/đổi database chính hoặc tự commit/push/deploy. Thiết kế và bằng chứng tại [app-design.md](app-design.md), [session-handoff.md](session-handoff.md).

## Thông báo deploy trên Android qua ntfy — 12/10/2026

**Đã hoạt động thật:** commit workflow/tài liệu **`00a15b9`** đã push main, Railway deployment7006554080 success; [GitHub Actions tự động38204421055](https://github.com/phuocthan/SangKienKn/actions/runs/38204421055) success, đã đọc lại tin deploy thành công từ ntfy. [Lượt thủ công38204354004](https://github.com/phuocthan/SangKienKn/actions/runs/38204354004) cũng success/tin thử có trên ntfy. Chưa xác nhận hiển thị Android; người dùng cần đăng ký topic. Push dùng checkout riêng, HEAD chính vẫn f7a655a và các sửa app đang làm giữ nguyên/chưa được đưa lên Railway. Cập nhật nghiệm thu này là local; đối chiếu remote trước đợt commit/push tiếp theo.

Đã thêm workflow **Railway deploy notification**: Railway → GitHub deployment_status success → ntfy → Android, lọc bot `railway-app[bot]` và môi trường thật `zooming-light / production`, loại transient. GitHub Secret `NTFY_TOPIC` đã cấu hình; topic ngẫu nhiên không đưa vào Git. Có nút Run workflow gửi tin thử ghi rõ Test. **Actionlint và 9/9 ca mock mới đạt**; không đổi ứng dụng/DB. Đưa riêng workflow/tài liệu lên main từ checkout riêng để giữ các thay đổi ứng dụng đang làm ở phiên khác; kết quả push/gửi thật/deploy mới kiểm tra sau thực hiện. Người dùng cần đăng ký topic trong app ntfy trên Android; thành công gửi tới ntfy không đồng nghĩa đã kiểm tra thiết bị. Xem [hướng dẫn](deploy-notifications.md), [bàn giao](session-handoff.md).

## Nhóm buổi thi, Excel riêng và luyện tập sau nộp — 12/10/2026

Đã gom lịch/lượt/kết quả online thành một nhóm theo ID buổi, trạng thái **Chuẩn bị / Đang thi / Kết thúc**, số học sinh tham gia/đã nộp, giờ mở/hạn kết thúc và nút tải Excel sau kết thúc. Chủ lớp thấy bài nộp trong nhóm; student chỉ lượt mình. Thống kê/lượt theo buổi không phụ thuộc200 lượt gần nhất toàn lớp; Excel riêng gồm metadata/kết quả và thành viên chưa tham gia, có kiểm tra quyền/thời điểm tại server. Trang ôn/thi cũ giữ báo cáo lớp.

Người dùng đã chọn cho luyện tập và tính giờ ngay sau bài đã nộp, kể cả tự nộp do tab trong buổi còn mở. Đã sửa lock chỉ xét active; điểm/đáp án/câu sai official vẫn chờ buổi kết thúc, không mở lại lượt đã nộp. **120/120 backend,26/26 E2E hồi quy và2/2 E2E mới desktop/mobile đạt**, TypeScript/build/ảnh/XLSX đã kiểm tra bằng DB/server riêng. Frontend5173/API/DB Railway giữ nguyên; **đợt này chưa push/deploy, cần backend Railway mới để tính giờ/thống kê/export có hiệu lực**. Chi tiết/bằng chứng/lượt test lỗi điều hướng đã sửa ở [session-handoff.md](session-handoff.md), nghiệp vụ [online-exams.md](online-exams.md) và [learning.md](learning.md).

Người dùng xác nhận task Forest đang chỉnh cùng workspace sau QA của đợt này; đã giữ nguyên các thay đổi đó. Build cuối hiện chờ task kia tạo `src/forest-theme.css` đang được main import, chưa thể xác nhận toàn bộ checkout song song build được; kết quả kiểm tra ôn-thi ở trên không phải nghiệm thu theme Forest.

## Đồng bộ remote và push cập nhật online/Word — 12/10/2026

Theo yêu cầu push Git, đã gom mã quản lý online/nguồn đề/upload/phân loại lịch sử, test/tài liệu và hai Word15câu vào commit; rebase lên remote `73543a6` và giữ icon portrait top right. Xung đột bàn giao đã giữ cả hai nội dung. TypeScript/build riêng và **18/18 E2E portrait/online desktop-mobile sau ghép đạt**, không lẫn với118backend/26E2E của đợt trước. Đưa bản này lên `origin/main`, không force hoặc đưa dữ liệu thật/.local/secrets lên Git. Kết quả Railway autobuild/deployment chưa xác minh; các ghi chú chưa push phía dưới thuộc lịch sử trước yêu cầu Git. Chi tiết ở [session-handoff.md](session-handoff.md).

## Trang kiểm tra online riêng và hai nguồn đề — 12/10/2026

Đã thêm **Kiểm tra online** cho giáo viên và **Kiểm tra online** cho học sinh; giữ banner đếm chờ và vào đúng lớp/phòng/reload. Tách khỏi cấp cây/ôn/ma trận/thưởng. Nguồn đề2radio bắt buộc chọn một: Upload file hoặc Chọn từ ngân hàng. Upload chọn chương tại khối file, đọc Word/CSV/cảnh báo thành công/lỗi, không cần checkbox chương trước. Ngân hàng chọn nhiều chương, toàn chương hoặc từng bài độc lập giữa các chương. Đã kiểm tra hai Word15câu thành đề30câu trên testserver.

**118/118 backend,26/26 E2E desktop/mobile, TypeScript/build riêng đạt**, đã xem ảnh; các lỗi lượt đầu thuộc locator/fixture và đã sửa, không gọi gap audit là đã khắc phục. Frontend local5173/HMR đã mở lại, API/DB Railway, kiểm tra login/source/health chỉ đọc đạt. Backend thêm phân loại delivery của lượt thi để lọc lịch sử online, **cần deploy Railway mới có hiệu lực; chưa push/deploy/ghi dữ liệu thật**. Thiết kế [app-design.md](app-design.md), nghiệp vụ [online-exams.md](online-exams.md), bằng chứng [session-handoff.md](session-handoff.md).

## Hai file Word mở rộng theo chương và bài — 12/10/2026

Đã mở rộng hai file vui thành **2chương, mỗi chương3bài, mỗi bài5câu**:15câu/file, tổng30câu. Giữ10câu cũ, thêm20câu. Parser thật xác nhận15câu/0lỗi, đúng3bài×5; đã xem8trang Word cuối, giữ mẫu gốc. Khi nhập chọn chương tương ứng và **Theo tên bài trong file** để không gộp15câu vào một bài. [File và cấu trúc](../artifacts/question-banks/README.md). Chỉ tạo/cập nhật tài liệu, chưa nhập Railway hoặc sửa ứng dụng/deploy; bản5câu ở mục dưới là lịch sử.

## Hai bộ Word câu hỏi vui — 12/10/2026

Đã tạo hai file theo mẫu Word nhập GreenEdu, mỗi file5câu trắc nghiệm vui/đơn giản có đáp án và lời giải: Đố vui quanh em/Vui học mỗi ngày. Parser thật nhận5câu/0lỗi từng file; đã xem4trang render Word cuối, giữ mẫu gốc. Xem [file và cách nhập](../artifacts/question-banks/README.md). Chỉ tạo tài liệu, chưa nhập ngân hàng Railway hoặc sửa ứng dụng/dữ liệu/deploy. Chi tiết ở [session-handoff.md](session-handoff.md).

## Frontend local đang chạy, API/database Railway — 12/10/2026

Đã cài dependencies theo lockfile và chạy `npm run local` trên checkout Windows `D:/WorkSpace/Others/SangKienKn`, HEAD `8faa58c`. Frontend **http://localhost:5173** chạy nền/HMR, server/database vẫn Railway. Kiểm tra chỉ đọc mới: trang/Vite/source icon header200, health local-proxy và Railway200 cùng `demo:false/quickLogin:false`, auth chưa đăng nhập401. Không chạy API SQLite offline, ghi dữ liệu thật, chạy backend/E2E hoặc push/deploy Railway. Chi tiết ở [session-handoff.md](session-handoff.md).

## Góp ý, Tài khoản, Đăng xuất lên header portrait

Theo đính chính mới nhất, ba icon ở **góc trên phải**, neo cùng header; tên account/avatar bên trái, lớp ở hàng dưới. Dock đáy chỉ giữ điều hướng chính; landscape/desktop giữ sidebar. Admin có Tài khoản/Đăng xuất như quyền hiện có. Đợt icon trước có build/TypeScript và 12/12 E2E đạt bằng database riêng; vị trí mới kiểm tra riêng và đưa vào commit để push `origin/main` theo yêu cầu autobuild. Kết quả deploy Railway chưa được xác minh. Chi tiết/kiểm tra tại [session-handoff.md](session-handoff.md), thiết kế [app-design.md](app-design.md).

## Bố cục portrait: tài khoản/lớp ở trên, menu ở dưới

Đã chỉnh frontend theo yêu cầu mới: header luôn neo tên tài khoản/avatar/lớp ở đầu khi cuộn, thanh điều hướng fixed ở đáy và cuộn ngang; nội dung chừa khoảng để không bị che. Áp dụng portrait ≤1100px, cả giáo viên/học sinh/Admin; landscape và desktop giữ sidebar. CSS riêng nạp sau theme, có safe area. Build/TypeScript và 22/22 E2E đạt bằng database riêng. Theo yêu cầu tiếp theo, đưa bản này vào commit để push `origin/main`; không thay backend/dữ liệu và chưa xác minh kết quả deploy Railway. Chi tiết/bằng chứng trong [session-handoff.md](session-handoff.md), thiết kế [app-design.md](app-design.md).

## Xóa hoạt động Chủ đề 1 theo yêu cầu — 12/10/2026

Đã xóa **Chủ đề 1 - Xây dựng và phát triển nhà trường** của Lớp11/2 trực tiếp trên database Railway:1 hoạt động,4 nhóm và47phân nhóm. Đã sao lưu trước, bảo toàn dữ liệu ngoài phạm vi bằng hash37bảng; kết nối chỉ đọc mới xác nhận hoạt động không còn, hai hoạt động khác và47thành viên lớp giữ nguyên, backup/khóa ngoại/integrity đạt. Database thực tế hiện có2lớp, ghi chép chỉ1lớp phía dưới là trạng thái trước đây. Không sửa runtime/push/deploy/restart hoặc database local; chi tiết backup/audit ở [session-handoff.md](session-handoff.md). Tải lại trang Hoạt động nhóm để cập nhật danh sách.

## Cách nắm trạng thái hiện tại — cập nhật 12/10/2026

Đọc bảng tra cứu hiện hành bên dưới và các mục 12/10 trước nhật ký cũ. HEAD trước đợt gom tài liệu/commit là `72a7e3b`; các phân hệ online exam/góp ý/phản biện đã có trong commit đó. Đợt này bổ sung minh họa Hoạt động nhóm, slide rework có animation và đồng bộ tài liệu, không triển khai lại các chức năng đã có.

Frontend mặc định local5173/HMR, API/database Railway. Tài liệu phân biệt mã hiện có, kết quả kiểm thử theo đợt và deployment; không xác nhận production bằng việc đọc checkout. Kiểm tra gần nhất của đợt minh họa: TypeScript/build riêng và 4 tổ hợp trình duyệt giả lập; PowerPoint: 9 slide/60 hiệu ứng, render tĩnh và dữ liệu animation/QR đã kiểm tra, chưa playback tương tác. Database, dữ liệu học sinh, secrets và file kiểm thử riêng không đưa vào commit.

## Minh họa trang Hoạt động nhóm và slide rework — 12/10/2026

Đã thêm ảnh người dùng gửi vào banner đầu trang Hoạt động nhóm, desktop cạnh chữ/mobile bên dưới; WebP giữ alpha, CSS riêng và nút tạo giữ hành vi. TypeScript/build riêng và4 tổ hợp kiểm tra trình duyệt với dữ liệu giả lập GET-only đạt, đã xem ảnh, không tràn ngang. Frontend5173/HMR chạy lại bằng `npm run local`, chưa push/deploy/ghi Railway.

Đã hoàn tất slide rework9trang ít chữ/hình lớn,60 animation PowerPoint gốc và9 chuyển trang, giữ bản mẫu ban đầu. Đã mở lại bản lưu kiểm tra hiệu ứng, xem9ảnh PowerPoint, kiểm tra cấu trúc/font/import/hash/QR; chưa playback tương tác. Xem [bộ slide và minh họa](../artifacts/presentations/README.md). Chi tiết đợt này trong [session-handoff.md](session-handoff.md).

## Slide giới thiệu GreenEdu theo mẫu 2026 — 12/10/2026

Đã tạo PowerPoint9slide, dùng trực tiếp nền/nhận diện/kiểu chữ của mẫu người dùng, nội dung GreenEdu và tác giả Nguyễn Thị Thanh Phương. Có ảnh giao diện kiểm thử chú thích rõ, logo trường, QR/link Railway và ghi chú nguồn; chữ chỉnh sửa được. Không tạo số liệu tác động giáo dục khi chưa có đo trước/sau; gia sư AI vẫn là kế hoạch. Đã xem9slide của bản cuối mở lại bằng Artifact Tool, kiểm tra package/layout/font/bullets và giải mã QR đạt; chưa render bằng PowerPoint trực tiếp. Xem [bộ slide và nguồn](../artifacts/presentations/README.md). Công việc tài liệu không thay runtime/dữ liệu hoặc deploy.

## Buổi kiểm tra online có thời gian chuẩn bị và thông báo lớp — 12/10/2026

Đã thêm **Tạo kiểm tra online**: ngân hàng hoặc Word/CSV, nhiều chương/bài, X phút chuẩn bị và Y phút làm bài. Giáo viên bấm bắt đầu chốt đề chung, thông báo trong ứng dụng và đặt giờ mở sau X phút, hạn chung sau thêm Y phút. Học sinh thấy đếm chờ ở Trang chủ/các trang, vào khi tới giờ; mỗi lượt có thứ tự câu ngẫu nhiên giữ qua reload, vào muộn không cộng thêm giờ. Một buổi chỉ phát yêu cầu một lần; đóng/thu bài và quy tắc tự nộp như phòng thi hiện có. Không đổi Săn điểm/thi theo lịch.

Migration bổ sung, scope theo membership, không lộ đề trong thông báo; thiếu ngân hàng chặn/rollback, capability cũ khóa UI mới. **116/116 backend,14/14 E2E hồi quy ôn-thi và6/6 E2E online desktop/mobile đạt**; TypeScript/build riêng và ảnh đã kiểm tra. **Chưa deploy Railway**, local5173 cần backend mới để dùng thật. Nghiệp vụ [online-exams.md](online-exams.md), thiết kế [app-design.md](app-design.md), bằng chứng [session-handoff.md](session-handoff.md).

Poster học sinh bản mới nhất: `artifacts/posters/greenedu-hoc-sinh-qr-lon.png`/PDF A3 cùng tên, tăng QR khoảng36%, vẫn có logo dưới tên trường. Render/giải mã QR đạt; [các bản poster](../artifacts/posters/README.md).

Poster học sinh bản hiện hành có logo trường dưới tên trường, QR ở đầu: `artifacts/posters/greenedu-hoc-sinh-qr-logo-truong.png` và PDF A3 cùng tên. Đã xem render/giải mã QR; logo lấy từ asset web sẵn có. [Các bản và nguồn](../artifacts/posters/README.md).

Poster học sinh cập nhật 12/10: khối QR/link lên trên cùng theo yêu cầu. Bản mới nhất `artifacts/posters/greenedu-hoc-sinh-qr-tren-cung.png` và PDF A3 cùng tên; xem render/kiểm tra QR đạt. [Các bản poster](../artifacts/posters/README.md).

## Poster giới thiệu GreenEdu cho học sinh — 12/10/2026

Đã tạo ảnh poster dọc 300dpi, PDF A3 một trang và QR riêng tại [artifacts/posters](../artifacts/posters/README.md). Hướng dẫn đăng nhập/đổi mật khẩu/avatar, sáu mục học tập và Sổ tay sửa sai, chữ ngắn/minh họa 3D. Đã xem trang thật/render và giải mã QR trên ảnh cuối đúng Railway. Chỉ tạo tài liệu, không ghi dữ liệu hoặc thay ứng dụng; prompt/nguồn/cách in trong README artifact.

## Thu gọn vườn, bảng tên và avatar giáo viên — 12/10/2026

Vườn giảm icon56/46px, ô130px, sát nhau hơn/mobile3cột, cuộn tối đa360/300px; vinh danh riêng cũng gọn/cuộn. **Bảng tên nhỏ120px giữa cổng rào phía dưới chỉ ghi lớp/môn, avatar giáo viên38px để riêng bên trái, không ghi tên cô; bỏ dòng ghi chú dưới vườn.** Giữ toàn bộ thành viên/cấp/dữ liệu. API garden bổ sung teacher metadata; backend cũ dùng chữ viết tắt, giáo viên sở hữu lớp dùng avatar tài khoản đang đăng nhập. Avatar thật ở phía học sinh cần backend Railway mới. **2ca API,6/6 E2E desktop/mobile, TypeScript/build riêng và ảnh lớp47người đạt**; lượt chỉnh cổng/avatar cuối chạy lại TypeScript/build và6/6 E2E. Local5173 phục vụ source mới/HMR, chưa push/deploy/ghi Railway. Chi tiết ở [session-handoff.md](session-handoff.md), thiết kế [app-design.md](app-design.md).

## Lối tắt sổ tay và thẻ cấp gọn — 12/10/2026

Ôn tập & kiểm tra: nút **Mở sổ tay** dưới lý do còn câu cần sửa mở đúng chương; sổ tay thêm bộ lọc Chương cần sửa/Tất cả chương, sidebar/trang chủ vẫn mở tất cả. **Bỏ thời gian dưới Cấp độ hiện tại**, giữ icon/tên cấp. Chỉ frontend, dùng API sổ tay sẵn có; không thay dữ liệu/cách tính giờ hoặc điều kiện Săn điểm. TypeScript/build riêng và **2/2 E2E desktop/mobile** đạt, frontend5173/HMR đang chạy. Chi tiết [app-design.md](app-design.md), [session-handoff.md](session-handoff.md).

## Database Railway chỉ giữ lớp 11/2 Vật lý — 12/10/2026

Theo yêu cầu người dùng đã xóa hai lớp10A1/Vật Lý và dữ liệu nhóm/membership của chúng, sau khi backup đầy đủ. Railway chỉ còn **Lớp 11/2 ♥ · Vật Lý**, đủ **47 học sinh, 4 chương, 105 bản ghi câu hỏi**; giữ toàn bộ51 tài khoản và dữ liệu lớp này. Hash bảo vệ33 bảng, khóa ngoại/integrity và kiểm tra bằng kết nối mới đạt; backup/audit chi tiết ở session-handoff.md. Không deploy/restart/reset database local; frontend local tải lại để nhận danh sách mới.

## Quản lý ngân hàng: chọn nhiều câu/xóa cả bài — 11/10/2026

Đã thêm checkbox/chọn tất cả/bỏ chọn và xác nhận xóa nhiều câu; chọn bài trong bộ lọc để xóa cả bài, kể cả rỗng. Xóa dạng ngừng sử dụng/archive, giữ lịch sử/sổ tay/đề ôn-thi; chỉ giáo viên sở hữu lớp, kiểm tra toàn bộ danh sách trong transaction, gửi lại không xóa thêm. API mới có capability, frontend cũ-server cũ không ghi nhầm. Chi tiết [question-bank.md](question-bank.md), thiết kế [app-design.md](app-design.md).

Kiểm tra mới **112/112 backend, 10/10 E2E desktop/mobile**, TypeScript/build riêng đạt. Frontend local5173/HMR đã cập nhật; **chưa deploy/push Railway**, API xóa nhiều câu cần triển khai mới có hiệu lực trên dữ liệu thật. Không thực hiện thao tác xóa production.

## Bản tra cứu hiện hành cho session mới — 12/10/2026

Đọc phần này trước các ghi chép theo đợt bên dưới. **Mã checkout, bản đang phục vụ Railway và kết quả test là ba trạng thái riêng.** Ghi chép test/deploy cũ không xác nhận tình trạng đang chạy; kiểm tra Git/mã và capability khi tiếp tục. Yêu cầu mới của người dùng chọn việc tiếp theo, không tự triển khai lại toàn bộ đề án. Tổng rà soát tài liệu tại [documentation-audit.md](documentation-audit.md).

| Phạm vi             | Quyết định/trạng thái hiện hành                                                                                                                                                                                                                                  | Tra cứu                                                                                                                                                                                                                                                      |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Thiết kế            | Một tài liệu chính cho nền/logo/font/icon/layout/animation; các đoạn lịch sử không ghi đè thiết kế mới. Nền v11, blur2px trong CSS garden hiện tại                                                                                                               | [app-design.md](app-design.md)                                                                                                                                                                                                                               |
| Chạy và deploy      | Frontend local5173/HMR; API/database Railway thật. Không tự deploy/push hoặc chạy API offline; test dùng database riêng                                                                                                                                          | [dev-railway.md](dev-railway.md), [deploy-local.md](deploy-local.md)                                                                                                                                                                                         |
| Tài khoản           | Admin tạo giáo viên/học sinh; giáo viên tạo/thêm học sinh. Railway đã đổi miền đăng nhập@greenedu.nk. Vào nhanh chỉ backend offline; email chào chưa kết nối/gửi thật                                                                                            | [account-management.md](account-management.md), [welcome-email.md](welcome-email.md)                                                                                                                                                                         |
| Cấp học sinh        | Riêng lớp→môn→chương, Mầm/Chồi/Cây Non/Đơm Hoa/Kết Trái. m phút/cấp do chủ lớp đặt, mặc định60; cấu hình mới còn chờ backend Railway                                                                                                                             | [student-levels.md](student-levels.md)                                                                                                                                                                                                                       |
| Vườn và vinh danh   | Vườn có rào chứa toàn lớp, avatar/hai từ cuối/cấp MAX một chương; frame cấp5 riêng. Frontend đã có, danh sách thật cần backend members mới                                                                                                                       | [app-design.md](app-design.md), [student-levels.md](student-levels.md)                                                                                                                                                                                       |
| Ôn/kiểm tra         | Đúng mới mở lời giải; Săn điểm cần cấp3/70% mọi lượt/sổ tay sạch/vé/quyền giáo viên. Thi chính thức mở từ bank hoặc Word/CSV, một/nhiều chương/bài, không cần điều kiện tự học. Các công cụ backend mới chưa deploy                                              | [learning.md](learning.md)                                                                                                                                                                                                                                   |
| Kiểm tra online     | Giáo viên phát yêu cầu, chờ X phút rồi làm Y phút; thông báo trong app, đề chung/đảo câu riêng/hạn chung. Đã có mã và test, chưa deploy Railway                                                                                                                  | [online-exams.md](online-exams.md)                                                                                                                                                                                                                           |
| Vi phạm             | Audit đã có, không sửa runtime. Còn lỗi nhận đáp án sau ngưỡng offline, thiếu focus/nhật ký/AI; idle mobile cần QA thật. Mặc định lần4 tự nộp, không tự thêm kỷ luật tài khoản                                                                                   | [violations-audit.md](violations-audit.md)                                                                                                                                                                                                                   |
| Ngân hàng và PPCT   | PPCT Vật lý11 gồm4chương/26bài chính thức và mục bổ sung; lần ghi nhận Railway12/10 có105 bản ghi câu hỏi, không suy thành105 câu hiện hành. Thêm/xóa archive/topic/trộn chủ đề đã có mã, cần đối chiếu backend; Word50câu đã tạo, chưa xác nhận nhập production | [question-bank.md](question-bank.md), [physics-11-curriculum-2026-2027.md](physics-11-curriculum-2026-2027.md)                                                                                                                                               |
| Hoạt động nhóm      | Giao/chia/đại diện/nộp/gia hạn/lịch sử; mã đã có phản biện sau gia hạn và hết hạn mới. Banner minh họa mới ở frontend. Chấm/thưởng nhóm chưa có; backend phản biện Railway chưa xác minh trong đợt này                                                           | [group-activities.md](group-activities.md), [feedback-discussion.md](feedback-discussion.md), [app-design.md](app-design.md)                                                                                                                                 |
| Góp ý với giáo viên | Chủ đề riêng học sinh/giáo viên, trả lời, đóng/mở lại, tìm/lọc và retry không trùng đã có mã; không ẩn danh/không gửi email ngoài, Railway chưa xác minh trong đợt này                                                                                           | [feedback-discussion.md](feedback-discussion.md)                                                                                                                                                                                                             |
| Avatar              | 40ID/quyền vai trò/upload3MB, popup đổi ảnh và mật khẩu. Danh sách thành viên/avatar giáo viên cần API tương ứng                                                                                                                                                 | [user-avatars.md](user-avatars.md), [app-design.md](app-design.md)                                                                                                                                                                                           |
| Tài liệu giới thiệu | Poster học sinh QR lớn/logo trường, Word50câu và hai bản PowerPoint; bản rework9slide/60 hiệu ứng là hiện hành                                                                                                                                                   | [poster](../artifacts/posters/README.md), [slide](../artifacts/presentations/README.md), [question-bank.md](question-bank.md)                                                                                                                                |
| Nguồn và kiểm thử   | Đề án là nguồn sản phẩm; kế hoạch/audit trước triển khai là lịch sử. Ca kiểm thử và bằng chứng theo từng đợt, không cộng số lượt hoặc báo lại thành test mới                                                                                                     | [requirements-original.md](requirements-original.md), [mvp.md](mvp.md), [learning-implementation-plan.md](learning-implementation-plan.md), [levels-review-assessment.md](levels-review-assessment.md), [functional-test-cases.md](functional-test-cases.md) |

Các trạng thái Railway trong bảng dựa trên lần triển khai/kiểm tra đã ghi ở [session-handoff.md](session-handoff.md), không phải gọi lại production trong đợt kiểm tra tài liệu. Còn nghiệm thu lớp thật/tải/vận hành và các khoảng trống audit; không ghi là hoàn thành toàn bộ.

## Nhật ký các đợt công việc

Các mục dưới giữ bối cảnh/bằng chứng theo thời điểm. Mô tả đã thay như cấp tổng lớp, vườn chỉ cấp5, localhost3002, tự deploy sau mỗi sửa, .demo, blur cũ hoặc chưa có hosting phải đọc theo bảng hiện hành ở trên.

## Nhập câu vào bài có sẵn, chủ đề không tạo bài — 11/10/2026

Hộp nhập Word/CSV có **Bài nhận câu hỏi**, mặc định bài đang lọc; chọn bài có sẵn để gộp toàn bộ câu vào bài đó và giữ nhãn chủ đề riêng. Theo tên trong file thì ghép tên bài có số tương đương về tên đã có trong cùng chương; khác số/nội dung tên không tự gộp, nhiều tên tương đương cần chọn chính xác. API áp dụng cho thêm/sửa/nhập, giữ chống trùng/retry/lịch sử. Word 50 câu vẫn giữ một Bài 1 và 10 nhãn. **37 backend, 4 E2E desktop/mobile, TypeScript/build riêng đạt**; E2E xác nhận 50 câu vào một bài có sẵn. Chưa deploy Railway hoặc đổi bài trùng đã lưu; cần backend mới để áp dụng quy tắc API. Chi tiết ở [question-bank.md](question-bank.md) và [session-handoff.md](session-handoff.md).

## Cấu hình thời gian tăng cấp cho giáo viên — 11/10/2026

Đã thêm khối **Thời gian tăng cấp** tại Ôn tập & kiểm tra, theo lớp/môn, default **60 phút/cấp**, số nguyên1–1440. Xem trước năm mốc; lưu/reload và các cấp chương, tiến độ, roster/xếp hạng, vườn, vé/thưởng cùng dùng cấu hình. Migration additive classroom_level_settings, API chỉ chủ lớp; giữ progress và vé/điểm lịch sử, không cấp trùng. Nghiệp vụ student-levels.md/learning.md, thiết kế app-design.md.

Đã đạt107/107 backend,22/22 E2E learning/cấp/cài đặt desktop/mobile, TypeScript/build riêng. Frontend local5173 đang chạy/HMR; **chưa push/deploy Railway**, server cũ khiến cài đặt tạm khóa/chờ cập nhật, không tự ghi cấu hình production hoặc khởi động API offline. Chi tiết session-handoff.md.

Ngày11/10 audit quy định vi phạm/xử lý học sinh với Word gốc và quyết định tự nộp lần4: cơ chế ôn120+10giây/treo, sổ tay và thi4tab/deadline có trong mã. **Chưa đầy đủ**: đã tái hiện offline4tab vẫn chọn thêm đáp án và sync nhận trước tự nộp; visible mất focus không ghi; Thần Rừng sai lặp chưa có, nhật ký/ngoại lệ cần bổ sung. 9backend đạt; browseraudit7 đạt/1 mobile idle chưa xác nhận bằng mô phỏng, cần QA điện thoại thật. Các ca tái hiện gap không phải đã sửa. [Báo cáo và hướng xử lý](violations-audit.md); chỉ audit, chưa sửa runtime/deploy/ghi dữ liệu thật. Local5173 vẫn API Railway; kết luận mã/test checkout không thay nghiệm thu production.

Ngày 11/10 theo yêu cầu trực tiếp đã điều chỉnh **dautay@greenedu.nk lên cấp 5 ở đủ 4 chương Vật Lý lớp 11/2** trên Railway: progress mỗi chương tối thiểu 14.400 giây. Đây là điều chỉnh thủ công theo yêu cầu, không phải thời gian học mới. Backup/audit trên volume; transaction kiểm tra 30 bảng khác và progress ngoài phạm vi không đổi, integrity/khóa ngoại đạt; đọc lại sau commit xác nhận đủ 4 chương. Không deploy/push/restart, chi tiết [session-handoff.md](session-handoff.md).

Ngày 11/10 theo phản hồi mới đã thay bố cục tầng bằng **frame vườn có rào gỗ**, icon cấp cao nhất/tên/avatar dạo quanh vườn chung chứa toàn lớp. Thêm **frame Vinh danh Kết Trái · Cấp 5 riêng**, mỗi bạn một mục và vẫn có cây trong vườn. Có pause/reduced-motion, cuộn nội bộ lớp đông; API cũ vẫn hiện frame chờ, vinh danh gộp cây thật cũ theo học sinh. Không đổi backend/cấp/dữ liệu trong đợt này. Local5173 HMR cập nhật, **chưa deploy Railway**, cần API members để hiện vườn đầy đủ thật. Thiết kế [app-design.md](app-design.md), kiểm tra cuối [session-handoff.md](session-handoff.md); bố cục tầng ở ghi chú sau là lịch sử đã thay.

Kiểm tra cuối frame/rào/vinh danh: **12/12 E2E desktop/mobile đạt**, gồm lớp 47 thành viên, chuyển động/bounds/reduced-motion, API cũ và hồi quy practice/teacher workflow. TypeScript/build/diff check đạt; ảnh đã xem, dùng database riêng, không ghi Railway.

Ngày 11/10 thêm **khu vườn mỗi học sinh một cây**: avatar, hai từ cuối tên, cấp cao nhất của một chương trong đúng lớp/môn, cấp cao đứng trên; chưa học vẫn Mầm, cùng tên ngắn không gộp. Có chuyển động nhẹ/nút tắt/bật/reduced-motion. API garden bổ sung members, giữ trees/quyền cũ, không sửa dữ liệu. **27 backend liên quan, 4 E2E mới và 2 E2E tương thích cây cũ đạt**, TypeScript/build/ảnh desktop/mobile đạt trên môi trường riêng. Frontend local 5173 cập nhật; **chưa deploy Railway, cần API mới để hiện danh sách thật**. Thiết kế [app-design.md](app-design.md), nghiệp vụ [student-levels.md](student-levels.md), chi tiết [session-handoff.md](session-handoff.md).

## Bộ câu hỏi Bài 1 Vật lí 11 và chủ đề — 11/10/2026

Đã tạo [Word 50 câu](../artifacts/question-banks/vat-li-11-chuong-1-bai-1-50-cau.docx) cho Chương I Dao động, `Bài 1: Dao động điều hoà`, có đủ 4 phương án/đáp án/lời giải và 10 chủ đề × 5 câu. [Danh mục nhóm](../artifacts/question-banks/README.md). Đã bổ sung nhãn topic vào phiên bản câu hỏi, nhập Word/CSV và UI giáo viên; migration thêm cột giữ dữ liệu. Trộn câu ưu tiên phủ đều chủ đề trong bài, tránh liền nhau khi có nhóm khác, giữ quota ma trận/tập câu thi chính thức/snapshot resume và lịch sử sửa sai. Nhãn tùy chọn, mẫu cũ tương thích; đổi nhãn không lách chống trùng. Quy tắc [question-bank.md](question-bank.md).

103 backend đạt trong lượt đầu; 29 ca app/topic chạy lại sau tinh chỉnh cuối đạt; TypeScript/build cuối riêng đạt; 10 E2E desktop/mobile nhập/ôn/thi đạt và 4 ca topic chạy lại trên mã cuối đạt. Word đã kiểm tra parser thực tế và xem 18 trang render bằng Word ẩn/Poppler. **Chưa nhập 50 câu hoặc deploy/push Railway**: API production cần được cập nhật trước khi nhập file có chủ đề; frontend local chặn xác nhận khi API cũ thiếu capability để không mất nhãn. Không ghi dữ liệu/tiến độ thật. Chi tiết ở bàn giao.

Ngày 11/10 thiết kế lại thẻ học sinh **Ôn tập & kiểm tra**: tên chương/khung **Cấp độ yêu cầu**, **Cần vé săn thưởng** ở trên; cấp/icon/thời gian hiện tại xuống cuối, nút Săn điểm toàn chiều ngang. Bỏ thông báo “Cần thêm xx phút học”, gộp lý do thiếu vé/quyền giáo viên vào khung/pill; giữ điều kiện và số liệu thật. TypeScript/build riêng đạt; **14/14 learning E2E desktop/mobile** đạt sau chạy vào thư mục kết quả riêng, đã xem ảnh. Local 5173 HMR cập nhật; chưa push/deploy Railway, không ghi dữ liệu thử production. Chi tiết ở [session-handoff.md](session-handoff.md).

Xác minh bố cục gộp sửa sai: 2/2 ca trình duyệt desktop/mobile trên build riêng đạt, ảnh ô thống kê đã xem, không tràn ngang; dùng server/database riêng tại 3179. TypeScript/build/diff check đạt, không ghi dữ liệu Railway.

Ngày 11/10 đã đưa lời nhắc sửa sai và Mở sổ tay vào ô Câu cần sửa sai phía trên trang chủ; bỏ thẻ vàng cao cạnh danh sách cấp, khối cấp theo chương trải toàn hàng. Không đổi API/database. TypeScript/build riêng đạt, local 5173 HMR cập nhật; chưa deploy/push Railway. Thiết kế/chi tiết ở app-design.md/session-handoff.md.

## Cấp từng chương, mốc icon và công cụ kiểm tra — 11/10/2026

Đã sửa cấp riêng **lớp → môn → chương**, có icon trên từng vạch 0/1/2/3/4 giờ tại khối cấp độ và trang hành trình; mục tiêu/roster/xếp hạng dùng chương, bỏ badge tổng lớp. Giữ thời gian thật, không tạo tiến độ mới. Đã hoàn thiện trong mã Thêm/Xóa bài (archive giữ lịch sử/chống trùng), clock phiên, đáp án/lời giải chỉ khi đúng, icon vé và điều kiện mỗi dòng, kiểm tra từ Word/CSV hoặc bank chọn chương/bài và giáo viên mở ngay. API mới có capability chống frontend dùng nhầm backend cũ. Nghiệp vụ/thiết kế/ca test đã cập nhật; chi tiết session-handoff.md.

TypeScript/build riêng đạt; hồi quy backend 97/97, chạy lại sau cập nhật module đồng thời vẫn đạt, 18 ca learning/cấp desktop/mobile và 2 ca bài đã đạt sau sửa selector/kỳ vọng test. Đã xem ảnh mốc desktop/mobile, không tràn ngang. Có chỉnh chủ đề ngân hàng câu hỏi đồng thời đang được giữ riêng, cần kiểm tra tích hợp khi triển khai. **Chưa deploy/push Railway**, local 5173 HMR dùng API Railway cũ, công cụ giáo viên mới chờ deploy server. Không ghi dữ liệu thử production.

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

Đã có MVP lõi, ngân hàng phiên bản/Word–CSV, vườn/xếp hạng và hoạt động nhóm trong phạm vi đã mô tả. Railway công khai đã được triển khai ở các đợt ghi phía trên; **chưa hoàn thành toàn bộ đề án hoặc nghiệm thu lớp thật**, không đồng nghĩa mọi thay đổi checkout đã deploy.

Triển khai offline3002 ngày10/10 là lịch sử. Mặc định hiện hành local5173/API Railway theo bảng đầu tài liệu; test dùng server/database riêng. Trạng thái triển khai theo từng đợt ở [session-handoff.md](session-handoff.md), không ở nhật ký cũ cuối tài liệu.

| Phân hệ trong đề án                | Trạng thái                                                                                                           | Phần còn thiếu                                                                                  |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Tài khoản Admin/giáo viên/học sinh | Admin tạo giáo viên/học sinh; giáo viên tạo/thêm học sinh có sẵn; mật khẩu tạm và cấp lại mật khẩu                   | Nhập hàng loạt, vòng đời tài khoản và vận hành trường học thật                                  |
| Ngân hàng câu hỏi                  | Phiên bản/ẩn/hiện, Word/CSV theo mẫu, học kỳ và ma trận theo bài/chương                                              | Tự tách Word bố cục bất kỳ/PDF và nhập .xlsx                                                    |
| Luyện tập và cây                   | Luyện bài/chương, ôn chương/kỳ trộn ma trận, phiên ôn lưu để tiếp tục, cây 5 cấp                                     | Nghiệm thu bằng lớp học thật                                                                    |
| Sổ tay sửa sai                     | Nhận câu sai luyện/ôn/thi; khi sửa sai chưa mở đáp án, tự làm lại đến đúng                                           | Gợi ý AI khi có dịch vụ phù hợp                                                                 |
| Dashboard và xuất dữ liệu          | Thời gian, mọi lượt luyện/sửa sai, cây và CSV; kết quả thi/thưởng và Excel .xlsx                                     | Điểm và thưởng nhóm sau khi có nghiệp vụ chấm nhóm                                              |
| Khu vườn của lớp                   | Mỗi thành viên một cây/avatar/cấp MAX chương, vườn rào và vinh danh cấp5 riêng trong mã                              | Deploy backend members để hiển thị đầy đủ với Railway; nghiệm thu lớp đông                      |
| Xếp hạng chăm chỉ                  | Đã bổ sung xếp hạng thời gian/cây và bảng sửa sai                                                                    | Đánh giá trải nghiệm vinh danh với giáo viên/học sinh thật                                      |
| Vé và kiểm tra 20 phút             | Vé mốc3/4/5, quyền giáo viên, server deadline, autosave/khôi phục/thu/chấm và cảnh báo tab trong mã                  | Khắc phục offline/ngưỡng tab, focus/nhật ký, QA idle mobile theo audit; nghiệm thu lớp thật     |
| Săn điểm và thi chính thức         | Tối đa 3 lượt/chương, lịch lớp/cùng bộ câu đảo thứ tự, giáo viên đóng/thu bài, báo cáo                               | Điều chỉnh/kết luận điểm sau sự cố theo quy trình trường                                        |
| Green Points/đổi thưởng            | Sổ thưởng cây/thi cấp một lần, duyệt/từ chối và lịch sử                                                              | Danh mục quà và quy trình đổi thưởng                                                            |
| Hoạt động nhóm                     | Đã có tạo hoạt động, yêu cầu Word, chia nhóm, đại diện, nộp file/link, deadline/gia hạn và phản biện sau hạn gia hạn | Chấm điểm/điểm thưởng, điều chỉnh thành viên sau khi chốt; nghiệm thu backend phản biện Railway |
| Góp ý riêng                        | Học sinh gửi chủ đề cho giáo viên lớp, trả lời/đóng/mở lại và lịch sử trong mã                                       | Nghiệm thu vận hành và xác minh deployment Railway                                              |
| Trợ lý AI                          | Chưa triển khai                                                                                                      | Kích hoạt sau nhiều lần sai, gợi ý từng bước, bài tương tự, nhà cung cấp và cấu hình sử dụng    |
| Vận hành chính thức                | Railway HTTPS đã có; backup/đối chiếu ở các đợt đã ghi, chưa nghiệm thu vận hành quy mô trường                       | Đồng bộ mã/deployment, quy trình khôi phục, giám sát và kiểm thử tải                            |

## Các bước còn lại theo thứ tự đề xuất

Phạm vi cấp độ/ôn tập/kiểm tra được triển khai theo [kế hoạch](learning-implementation-plan.md), quy tắc tại [learning.md](learning.md).

1. Khi người dùng yêu cầu sửa, tiếp tục từ gap offline/focus/nhật ký và QA mobile ở violations-audit.md; sau đó nghiệm thu ôn/thi lớp thật/tải/quy trình sự cố. Không mặc định audit đã sửa.
2. Nghiệm thu phản biện nhóm hiện có sau khi triển khai backend phù hợp; chấm và điểm thưởng nhóm vẫn là phần tiếp theo, chỉ thực hiện khi được yêu cầu.
3. Đổi quà Green Points, nhập tài liệu tùy ý và AI là các phần riêng tiếp theo.
4. Railway HTTPS đã có; còn nghiệm thu backup/khôi phục, giám sát và vận hành trường học khi được yêu cầu.

## Quy tắc của vườn lớp và xếp hạng hiện tại

- Vườn chung mỗi thành viên một cây theo cấp MAX một chương, vinh danh cấp5 riêng; không cộng chương hoặc nhân bản người ở frame vinh danh. API trees vẫn giữ cặp học sinh/chương đạt4m phút (mặc định14.400giây) để tương thích/thống kê. API cũ thiếu members không đủ để hiển thị toàn lớp.
- Chỉ tính dữ liệu chương thuộc lớp đang chọn và học sinh hiện là thành viên. Giáo viên chỉ xem lớp mình sở hữu; học sinh chỉ xem lớp mình tham gia.
- Xếp hạng chăm vườn: thời gian học giảm dần, sau đó số cây cấp 5 giảm dần. Cùng cả hai chỉ số thì đồng hạng; tên chỉ để giữ thứ tự hiển thị ổn định. Dùng hạng 1, 1, 3 khi hai người dẫn đầu bằng nhau.
- Bảng “Bác sĩ cây trồng”: số câu hiện đã khắc phục giảm dần, cùng số câu thì đồng hạng. Một câu chỉ tính một lần; nếu làm sai lại, câu đó không còn được tính đến khi khắc phục lại. Đây không phải tổng số lượt gửi đáp án sửa sai.
- Chưa có hoạt động thì chưa xếp hạng hoặc tạo cây mẫu. Không dùng điểm số làm tiêu chí; không trả email, mật khẩu, đáp án hay chi tiết lỗi sai cá nhân qua API cộng đồng.
- Các bảng tính trong phạm vi lớp, lũy kế theo dữ liệu hiện có. Chưa có xếp hạng tuần/tháng hoặc xếp hạng công khai giữa mọi lớp.

## Quy tắc kiểm tra đã áp dụng

Người dùng chọn tỷ lệ 70% tính **tất cả lượt luyện tập và sửa sai**, **lần rời tab thứ 4 tự nộp**. Các quy tắc còn lại thực hiện theo [learning.md](learning.md): sổ tay xét từng chương, vé cấp theo mốc cây/dùng lúc bắt đầu, thời gian thi không cộng cây, tối đa 20 phút server, cùng tập câu đảo thứ tự và công bố đáp án thi chính thức khi khung thi đóng.

Điểm cây/Săn điểm có lịch sử/phê duyệt, chưa tự ghi sổ học bạ/đổi quà; thưởng nhóm chưa tính vì chưa chấm nhóm. AI chưa kết nối dịch vụ. Các gap thi/xử lý ngoại lệ theo violations-audit.md, không tự thêm chế độ phạt.

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
