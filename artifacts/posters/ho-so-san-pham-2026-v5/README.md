# GreenEdu - Poster cổ thụ, chỉnh cỡ chữ

Ngày: 19/10/2026. Bản v5 theo yêu cầu kiểm tra lại cỡ chữ. Giữ minh họa cổ thụ trên sách và mầm cây của v4; không gọi ImageGen lại.

## Kết quả rà soát và chỉnh sửa

Cỡ chữ dưới đây được đo trên PDF A3 thực tế bằng pdfplumber, sau mọi phép đổi khổ; không nhầm cỡ trong hệ tọa độ dàn trang với point trên bản in.

| Nhóm chữ | v4 A3 | v5 A3 |
| --- | ---: | ---: |
| Câu ý tưởng lớn | 42,95 pt | 42,95 pt |
| Nhãn Nhu cầu / Ý tưởng / Học sinh / Giáo viên | 11,29 pt | 16,42 pt |
| Mô tả ý tưởng | 11,62 pt | 14,74 pt |
| Nội dung cuối trang | 11,54 pt | 14,74 pt |
| Chú thích QR | 7,83 pt | 12,21 pt |

Đồng nhất nội dung và danh sách chức năng ở 14,74 pt A3; tên năm cấp độ và tiêu đề cuối trang khoảng 15,16 pt. Tăng giãn dòng và độ đậm màu chữ phụ. Ngắt lại câu để vừa cột, rút nhãn hai vai trò và chú thích QR; các ý nghiệp vụ giữ nguyên. Thu minh họa 600 xuống 540 đơn vị để chữ lớn vẫn nằm ngoài tán cây/cuốn sách. Không tái tạo banner gốc.

## File mới nhất

- `GreenEdu-Poster-co-thu-chu-ro-2026-A0.pdf`: một trang đúng khổ mẫu 2384 × 3370 pt.
- `GreenEdu-Poster-co-thu-chu-ro-2026-A3.pdf`: một trang A3 dọc.
- `GreenEdu-Poster-co-thu-chu-ro-2026.png`: 3508 × 4961 px, 300 dpi.
- `GreenEdu-Poster-co-thu-chu-ro-2026-preview.png`: xem nhanh 1400 × 1980 px.
- `build.py`: nguồn dàn trang, font Segoe UI trên Windows; cần ReportLab, Pillow, pypdf, pypdfium2.
- `assets/khu-vuon-co-thu-tren-sach.png`: minh họa giữ nguyên từ v4; [nguồn và prompt](../ho-so-san-pham-2026-v4/README.md).

Bản v5 thay v4 làm bản mới nhất để xem; tất cả bản cũ vẫn giữ. QR/liên kết PDF tới https://greenedu.up.railway.app/. Không sửa ứng dụng, dữ liệu, Git remote hoặc Railway.

## Kiểm tra mới

Đã xem toàn trang render cuối: chữ hai bên và chân trang đọc rõ, không đè lên minh họa hoặc tràn khổ. Hai PDF đúng một trang/đúng khổ/đủ nội dung/248 từ ở lớp chữ. Kiểm tra tọa độ mọi ký tự trong trang, đo cỡ chữ thực tế trước/sau, PNG đúng kích thước/DPI và giải mã QR đúng URL. Báo cáo `.local/poster-submission-20261019/v5-verification.json` không đưa lên Git.
