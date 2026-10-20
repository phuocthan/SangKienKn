# GreenEdu - Poster đưa ý tưởng lên trước

Ngày: 19/10/2026. Theo yêu cầu ý tưởng phải gây chú ý trước khi người xem đọc chi tiết.

## Hướng trình bày hiện hành

Thông điệp chính **BIẾN VIỆC HỌC / THÀNH MỘT / KHU VƯỜN.** chiếm vùng lớn ngay dưới nhận diện sản phẩm. Cây Kết Trái phóng lớn, bốn giai đoạn cây nhỏ dẫn tới cây trưởng thành; sau đó mới đến nhu cầu, chức năng theo hai vai trò, vòng phản hồi, AI hỗ trợ phát triển và kết quả/hướng tiếp tục.

Đây là bản v3 mới nhất để người dùng xem. Bản v1, v2 và bộ ba tờ được giữ riêng. Không thay đổi ứng dụng hoặc dữ liệu.

## Đầu ra

- `GreenEdu-Poster-y-tuong-noi-bat-2026-A0.pdf`: một trang đúng khổ mẫu 2384 × 3370 pt, chữ và QR vector.
- `GreenEdu-Poster-y-tuong-noi-bat-2026-A3.pdf`: một trang A3 dọc.
- `GreenEdu-Poster-y-tuong-noi-bat-2026.png`: 3508 × 4961 px, 300 dpi.
- `GreenEdu-Poster-y-tuong-noi-bat-2026-preview.png`: bản xem nhanh 1400 × 1980 px.
- `build.py`: nguồn dàn trang bằng ReportLab; dùng Python có ReportLab, Pillow, pypdf và pypdfium2, font Segoe UI trên Windows.

## Nguồn và phạm vi nội dung

Giữ nguyên banner từ mẫu Poster 2026 do người dùng cung cấp, dùng file đã trích ở `../ho-so-san-pham-2026/assets/banner-mau-2026.png`; không vẽ lại logo hoặc banner. Minh họa là năm cây 3D nền trong suốt đã tạo và duyệt trong `../../design/student-levels-3d-preview/assets/`.

Tác giả: Nguyễn Thị Thanh Phương; đơn vị: Trường THPT Nguyễn Khuyến, thành phố Đà Nẵng. Nêu chức năng sản phẩm hiện có; AI hỗ trợ lập trình, rà soát mã và thiết kế minh họa, giáo viên kiểm duyệt học liệu. Giá trị học tập được ghi là hướng tới; không gán số liệu hiệu quả chưa đo, khảo sát giả hoặc tuyên bố tích hợp gia sư AI.

QR và liên kết PDF: https://greenedu.up.railway.app/

## Kiểm tra bản xuất cuối

Đã xem toàn trang render cuối và sửa vị trí cây lớn/nhãn, đưa đường nối ra sau cây để tránh chồng lấn. Hai PDF đều một trang, đúng khổ, đủ thông điệp/tác giả/chức năng; PNG đúng kích thước và DPI. Giải mã QR trên ảnh cuối trả về đúng URL. Banner so khớp nhị phân với ảnh gốc trong PPTX. Báo cáo tại `.local/poster-submission-20261019/v3-verification.json` (không đưa lên Git).
