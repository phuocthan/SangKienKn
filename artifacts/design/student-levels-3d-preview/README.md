# Preview icon cấp độ 3D GreenEdu — 19/10/2026

**Trạng thái mới: đã được duyệt ngày 19/10/2026; đã push origin/main và triển khai Railway thành công ngày 20/10/2026, commit 4e0823b. Đã kiểm tra đủ năm WebP production khớp bộ đã test; 12/12 E2E desktop/mobile đạt.**

Bảng preview bên dưới giữ bản trước duyệt làm nguồn tham khảo. Bản ứng dụng dùng WebP tối ưu tại public/assets/student-levels-3d-v1, không tải PNG gốc cỡ lớn.

- `GreenEdu-icon-3D-preview.png`: bảng xem trước 2400 × 1680 px, có cả hình lớn, mẫu thu nhỏ 64 đơn vị và hai mô phỏng thẻ chương/khu vườn. Đây là dàn cảnh thiết kế, không phải ảnh chụp ứng dụng đã sửa.
- `assets/level-1.png` đến `level-5.png`: năm PNG RGBA 1254 × 1254, alpha trong suốt, lần lượt Mầm / Chồi / Cây Non / Đơm Hoa / Kết Trái.
- `build_preview.py` và PDF cùng tên: nguồn dàn trang preview bằng ReportLab và bản trung gian để render PNG; ảnh gốc không bị sửa/cắt nền bằng script.

Theo yêu cầu người dùng, lấy phong cách cây 3D từ `artifacts/posters/gioi-thieu-2026/assets/02-y-tuong.png` làm tham chiếu và dùng ImageGen tích hợp tạo từng icon riêng. Giữ lá xanh tự nhiên, thân gỗ ấm và nền đất/rêu đơn giản; cấp4 nhận diện bằng hoa trắng, cấp5 bằng quả vàng. Không sách, nhãn, chữ hoặc phông nền trong ảnh icon. Nhãn trên preview được dàn riêng để giữ dấu tiếng Việt chính xác.

Đã xem preview toàn trang, kiểm tra đủ năm giai đoạn và khả năng phân biệt khi thu nhỏ. Kiểm tra từng PNG có mode RGBA và alpha min0/max255. Cây Non trông gọn hơn hai cấp cuối; việc căn lại kích thước quang học/nén WebP và thử trên UI thật sẽ làm khi được duyệt. Ghi chú trước duyệt: chưa thay LevelArtwork/StudentLevelIcon, chưa đổi tên/ngưỡng cấp, chưa thêm ảnh vào public và chưa push/deploy. Trạng thái này được thay bằng quyết định đã áp dụng local ở đầu tài liệu. Không tạo dữ liệu học sinh để minh họa.
