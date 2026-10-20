# GreenEdu — Poster hồ sơ sản phẩm 2026

Ngày sửa: 19/10/2026, theo ảnh mẫu do người dùng gửi. Gộp mạch của bộ ba poster cũ vào một trang hồ sơ dự án, giữ nền trắng, nội dung xanh và bộ cây3D đã duyệt.

## File bàn giao

- `GreenEdu-Poster-ho-so-2026-A0.pdf`: một trang đúng kích thước mẫu gốc2384×3370pt (~841×1189mm), chữ vector và font nhúng.
- `GreenEdu-Poster-ho-so-2026-A3.pdf`: một trang A3 để in nhỏ, cùng bố cục.
- `GreenEdu-Poster-ho-so-2026.png`: ảnh3508×4961/300dpi tương ứng bản A3.
- `GreenEdu-Poster-ho-so-2026-preview.png`: bản xem nhanh1200px.
- `build.py`, `assets/banner-mau-2026.png`: nguồn dàn trang và banner gốc. Script dùng minh họa/bộ icon đã có trong hai thư mục artifacts bên cạnh; không tạo lại logo hoặc chỉnh ảnh bằng AI.

## Đối chiếu yêu cầu mẫu

Đã tìm đúng `Mẫu Poster 2026.pptx` trong thư mục tài liệu2026 trên Desktop của người dùng. Banner lấy nguyên binary `ppt/media/image1.png` (3975×724), kiểm tra khớp byte với gốc; đây cũng là banner hiện trong ảnh người dùng gửi. Không dùng banner slide khác hoặc vẽ lại huy hiệu Bộ GDĐT/RMIT. Không chỉnh sửa Canva trên tài khoản người dùng.

Thêm tên sản phẩm **GreenEdu — Khu vườn tri thức số**, Nguyễn Thị Thanh Phương và Trường THPT Nguyễn Khuyến, thành phố Đà Nẵng. Năm phần nội dung: bối cảnh/nhu cầu và đối tượng; ý tưởng cây kiến thức; vai trò AI/cách triển khai; kết quả triển khai; nhận xét/hướng phát triển. Giữ thông điệp ngắn và hình lớn; không có khung nét đứt hoặc hướng dẫn điền mẫu.

Vai trò AI ghi đúng phạm vi đã dùng: hỗ trợ lập trình và thiết kế minh họa; giáo viên xây dựng/kiểm duyệt học liệu. Không mô tả gia sư AI đang có trong ứng dụng. Kết quả là các chức năng đã triển khai, không bịa số liệu khảo sát hay mức tăng điểm; đánh giá hiệu quả nằm ở hướng phát triển. Hình giáo viên/học sinh là minh họa của dự án, không phải người thật/ảnh lớp học hoặc bằng chứng khảo sát.

## Kiểm tra

Đã render lại sau lượt sửa khoảng cách giữa minh họa và mục2, xem toàn trang cuối không chồng/cắt chữ. Pypdf kiểm tra hai PDF đều1trang, đúng kích thước và đủ tiêu đề/tác giả, không còn placeholder. Banner khớp byte gốc. ZXing-C++ giải mã QR từ ảnh cuối đúng https://greenedu.up.railway.app/. Báo cáo riêng tại `.local/poster-submission-20261019/verification.json`. Khoảng206từ phần chữ dàn riêng, chưa tính banner ảnh.

Bộ ba poster trước vẫn giữ trong `../gioi-thieu-2026/`. Không sửa app/database/push/deploy trong lượt chỉnh poster này.
