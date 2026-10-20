# GreenEdu - Khu vườn cổ thụ trên sách

Ngày: 19/10/2026. Bản v4 theo yêu cầu: lấy khu vườn cổ thụ trên sách làm minh họa nền trung tâm, các mầm cây nhỏ vui chơi xung quanh, chữ bố trí quanh hình.

## Bố cục mới nhất

Giữ thông điệp lớn **BIẾN VIỆC HỌC THÀNH MỘT KHU VƯỜN.** ngay sau phần nhận diện. Minh họa mới là cây cổ thụ mọc từ sách mở, có năm mầm cây chơi đuổi bắt, tưới cây, chơi xích đu và vẫy chào. Bốn cụm Nhu cầu / Ý tưởng / Học sinh chủ động / Giáo viên đồng hành nằm hai bên cây. Dải năm cấp độ, vòng học tập, AI hỗ trợ phát triển, kết quả và QR nằm dưới cuốn sách. Không để chữ đè lên nhân vật, lá hoặc trang sách.

Đây là bản mới nhất để người dùng xem, thay v3 về thứ tự hiện hành. Toàn bộ bản cũ vẫn giữ; không sửa ứng dụng, dữ liệu hoặc triển khai Railway.

## Đầu ra

- `GreenEdu-Poster-co-thu-tren-sach-2026-A0.pdf`: một trang đúng khổ mẫu 2384 × 3370 pt, chữ và QR vector.
- `GreenEdu-Poster-co-thu-tren-sach-2026-A3.pdf`: một trang A3 dọc.
- `GreenEdu-Poster-co-thu-tren-sach-2026.png`: 3508 × 4961 px, 300 dpi.
- `GreenEdu-Poster-co-thu-tren-sach-2026-preview.png`: xem nhanh 1400 × 1980 px.
- `assets/khu-vuon-co-thu-tren-sach.png`: minh họa mới RGBA 1254 × 1254 px, giữ alpha trong suốt.
- `build.py`: nguồn dàn trang ReportLab. Python cần ReportLab, Pillow, pypdf, pypdfium2 và font Segoe UI trên Windows.
- [PROMPT.md](PROMPT.md): prompt đầy đủ của minh họa, tạo bằng ImageGen tích hợp.

## Nguồn và tính chính xác

Hai ảnh tham chiếu phong cách là `../gioi-thieu-2026/assets/02-y-tuong.png` và `../../design/student-levels-3d-preview/assets/level-5.png`. Minh họa mới do ImageGen tích hợp tạo, không phải ảnh sản phẩm hoặc dữ liệu học sinh thật. Bản gốc vẫn giữ tại `C:/Users/thant/.codex/generated_images/01a12677-3b28-71f2-bc1c-dbaf27a3515e/exec-5209a05e-5f13-43f9-a36e-a8fdf219c75b.png`; bản dùng cho dự án đã chép vào assets của thư mục này.

Banner mẫu 2026 được dùng nguyên từ `../ho-so-san-pham-2026/assets/banner-mau-2026.png`, không tái tạo logo/chữ bằng AI. Năm cây nhỏ ở thanh cấp độ dùng các ảnh đã duyệt tại `../../design/student-levels-3d-preview/assets/`.

Tác giả Nguyễn Thị Thanh Phương; Trường THPT Nguyễn Khuyến, thành phố Đà Nẵng. Nêu chức năng có trong sản phẩm, phân biệt kết quả chức năng với giá trị học tập hướng tới. AI chỉ hỗ trợ phát triển/thiết kế; giáo viên kiểm duyệt học liệu. Không bịa kết quả khảo sát, mức tăng điểm, giải thưởng đã đạt hoặc gia sư AI đang tích hợp.

QR và liên kết PDF mở https://greenedu.up.railway.app/.

## Kiểm tra bản xuất cuối

Đã xem toàn trang render sau khi thu các danh sách lên trên phần sách/lá để hết chồng chữ. Hai PDF một trang, đúng khổ, đủ thông điệp/tác giả/các mục và không còn placeholder; 257 từ ở lớp chữ. PNG đúng kích thước/300 dpi, QR giải mã đúng URL. Minh họa có alpha 0–255; banner so khớp nhị phân với PPTX mẫu gốc. Báo cáo `.local/poster-submission-20261019/v4-verification.json` không đưa lên Git.
