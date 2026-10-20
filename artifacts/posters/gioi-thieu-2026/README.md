# GreenEdu - bộ poster giới thiệu dự án

Ngày tạo: 19/10/2026. Ba tờ A3 dọc đọc theo thứ tự Nhu cầu → Ý tưởng → Hiện thực hóa. Đây là bộ giới thiệu dự án, khác poster hướng dẫn đăng nhập/học sinh trong thư mục cha.

## Bản bàn giao

- `GreenEdu-Bo-3-poster-A3.pdf`: PDF 3 trang A3 dọc, chữ vector và font nhúng, ảnh minh họa nhúng; trang cuối có QR và liên kết bấm được đến https://greenedu.up.railway.app/.
- `01-Nhu-cau.png`, `02-Y-tuong.png`, `03-Hien-thuc-hoa.png`: 3508 × 4961 px, 300 dpi; phù hợp chia sẻ hoặc in A3.
- `GreenEdu-xem-ca-bo.png`: ảnh xem ba tờ cạnh nhau; các file `*-xem-nhanh.png` là bản nhỏ.
- `build.py`, `DESIGN.md` và `assets/`: nguồn dàn trang, triết lý thiết kế và minh họa; chạy bằng Python có reportlab/Pillow/pypdfium2/pypdf trên Windows. Font Segoe UI hiện có trên máy. Không thay poster cũ.

## Nội dung

1. **Nhu cầu:** duy trì thói quen, nhìn thấy tiến bộ, hỗ trợ đúng lúc. Không dùng số liệu khảo sát chưa có.
2. **Ý tưởng:** cây kiến thức Mầm → Chồi → Cây Non → Đơm Hoa → Kết Trái; cây lớn từ thời gian học có hoạt động, cấp riêng mỗi lớp/môn/chương.
3. **Hiện thực hóa:** vai trò học sinh/giáo viên/cả lớp; luyện tập/ôn/sửa sai, giao bài/kiểm tra/theo dõi tuần, nhóm/vườn chung; QR sản phẩm đang hoạt động. Không tuyên bố có AI đã triển khai hoặc thành tích giải thưởng.

## Tham khảo và skill

Theo link người dùng gửi [Top 50 IEEAI 2025](https://ieeai.net/top-50), đã mở và xem trực tiếp poster Hành trình Việt Nam, COMPETECH và AI-PhysicsBook trong trình duyệt. Tham khảo mạch vấn đề–giải pháp–quy trình–minh chứng, hình lớn, khối nội dung có nhãn và QR. Không sao chép hình/tên/số liệu hay bộ nhận diện giải thưởng. Công cụ web trích chữ không truy cập được trang; trình duyệt tải và hiển thị được cả ba mẫu.

Đã tìm trên skills.sh và chọn [canvas-design](https://skills.sh/anthropics/skills/canvas-design), đọc [SKILL.md nguồn chính thức](https://github.com/anthropics/skills/blob/main/skills/canvas-design/SKILL.md) để áp dụng phân cấp, ít chữ, khoảng trắng và lượt rà soát tinh chỉnh. Không cài skill mới. Có khảo sát poster-information-hierarchy, pptx-posters và paper2poster; không dùng các pipeline này vì không cần ca mẫu bắt buộc, PPTX hay toàn bộ bài báo.

Minh họa gốc mới được tạo bằng ImageGen tích hợp: học sinh/giáo viên bên tài liệu rời rạc; năm giai đoạn cây trên sách; giáo viên và học sinh bên vườn/laptop. Không phải ảnh chụp người thật hoặc giao diện sản phẩm. Chữ, sơ đồ, QR và logo trường thật được dàn riêng bằng ReportLab. Giữ huy hiệu đang dùng trong tài liệu dự án, không tạo lại chữ trong logo.

## Kiểm tra

Đã xem ảnh tổng thể ba trang xuất từ PDF; không chồng chữ/cắt chữ/tràn trang. Pypdf kiểm tra đủ 3 trang và các tiêu đề tiếng Việt; PNG đủ 3508 × 4961 px, 300 dpi. Mỗi trang 78–82 từ kể cả tên trường/tác giả/chân trang. ZXing-C++ giải mã QR từ ảnh cuối đúng URL sản phẩm. QA riêng tại `.local/poster-series-20261019/verification.json`. Không dùng dữ liệu học sinh, tài khoản hoặc mật khẩu; không sửa ứng dụng/database/push/deploy trong lượt này.
