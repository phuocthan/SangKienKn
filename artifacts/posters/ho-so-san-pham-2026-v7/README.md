# GreenEdu - Poster đặt luận điểm giáo dục làm trọng tâm

Hoàn thiện: 20/10/2026, tiếp nhận yêu cầu từ 19/10. Người dùng yêu cầu logic và căn cứ GDPT 2018; giảm minh họa, tăng cỡ chữ và diện tích cho nội dung.

## Bản hiện hành

Tiêu đề: **HỖ TRỢ TỰ HỌC VÀ SỬA SAI / THEO CHƯƠNG TRÌNH GDPT 2018**.

Mạch nội dung: nhu cầu học sau giờ học → giáo viên chọn nhiệm vụ theo yêu cầu cần đạt → bảng định hướng giáo dục / cách dùng GreenEdu / minh chứng học tập → vai trò đúng của cây và đánh giá năng lực → chức năng đã có và cách kiểm chứng hiệu quả.

Bảng chính đối chiếu tự chủ/tự học, giao tiếp/hợp tác, giải quyết vấn đề/sáng tạo và đánh giá để điều chỉnh. Giáo viên thiết kế nhiệm vụ và đánh giá bằng chứng; không khẳng định làm trắc nghiệm hoặc lên cấp cây là đã phát triển đủ năng lực. [Căn cứ, nguồn và phạm vi diễn giải](SOURCES.md).

## Thay đổi bố cục và chữ

- Minh họa cổ thụ trên sách thu từ khung 540 × 540 xuống 210 × 210 đơn vị; khung hình này chỉ khoảng **3,12% diện tích trang** (không tính banner mẫu và QR).
- Bảng và nội dung giáo dục chiếm phần chính. Nội dung 22 đơn vị tương ứng **18,53 pt trên A3**; tên các định hướng 23 đơn vị tương ứng khoảng 19,37 pt. Tiêu đề bảng 20 đơn vị, nguồn 15,7–16 đơn vị là nhóm phụ.
- Giữ nguyên banner mẫu của hồ sơ 2026, tác giả/đơn vị, minh họa đã tạo và đường dẫn sản phẩm; không gọi ImageGen mới.
- Các nguồn tham khảo được ghi ngắn trên poster và gắn liên kết trong PDF; chi tiết tại SOURCES.md.

## File mới nhất

- `GreenEdu-Poster-giao-duc-GDPT2018-2026-A0.pdf`: một trang đúng khổ mẫu 2384 × 3370 pt.
- `GreenEdu-Poster-giao-duc-GDPT2018-2026-A3.pdf`: một trang A3 dọc.
- `GreenEdu-Poster-giao-duc-GDPT2018-2026.png`: 3508 × 4961 px, 300 dpi.
- `GreenEdu-Poster-giao-duc-GDPT2018-2026-preview.png`: xem nhanh 1400 × 1980 px.
- `build.py`: nguồn dàn trang; cần các thư viện ReportLab, Pillow, pypdf, pypdfium2 và Segoe UI trên Windows.

Nguồn hình: `../ho-so-san-pham-2026-v4/assets/khu-vuon-co-thu-tren-sach.png`; nguồn banner: `../ho-so-san-pham-2026/assets/banner-mau-2026.png`. Không sửa ảnh hoặc tạo thêm hình. QR/liên kết trải nghiệm tới https://greenedu.up.railway.app/.

v7 thay v6 làm bản mới nhất để xem; giữ mọi bản cũ. Không sửa ứng dụng, dữ liệu, Git remote hoặc Railway.

## Kiểm tra bản cuối

Đã xem toàn trang render: bảng là trọng tâm, chữ không đè hình/tràn ô. Hai PDF đúng một trang/đúng khổ và đủ các luận điểm; đo font nội dung A3 ≥18,5 pt, kiểm tra tọa độ ký tự trong khổ; PNG đúng kích thước/DPI, QR đúng URL. Báo cáo `.local/poster-gdpt2018/v7-verification.json` không đưa lên Git. Rà soát này không phải thử nghiệm hiệu quả giáo dục trên học sinh.
