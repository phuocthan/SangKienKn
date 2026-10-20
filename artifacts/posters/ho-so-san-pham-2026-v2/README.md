# Poster hồ sơ GreenEdu — bản sáng tạo, đầy đủ hơn

Ngày19/10/2026. Người dùng yêu cầu bản sau poster hồ sơ đầu: “cần sáng tạo, đầy đủ hơn”. Bản này giữ banner chính thức nhưng thay cách kể chuyện bằng infographic: nhu cầu lớp học → đường nuôi cây → hai vai trò vận hành → vòng phản hồi → vai trò AI → kết quả/hướng phát triển.

## Bàn giao

- `GreenEdu-Poster-sang-tao-2026-A0.pdf`:1trang2384×3370pt, cùng khổ mẫu gốc.
- `GreenEdu-Poster-sang-tao-2026-A3.pdf`:1trang A3 để in nhỏ.
- `GreenEdu-Poster-sang-tao-2026.png`:3508×4961px/300dpi.
- `GreenEdu-Poster-sang-tao-2026-preview.png`: bản xem nhanh1400px.
- `build.py`: nguồn dàn trang vector, tham chiếu banner gốc trong thư mục bản đầu và5icon3D nguồn đã duyệt trong artifacts/design.

## Bổ sung so với bản đầu

Từ khoảng206từ lên384từ phần chữ dàn riêng, dùng nhãn ngắn thay đoạn văn. Nêu rõ đối tượng học sinh THPT/giáo viên; tên tác giả, đơn vị và địa phương giữ nguyên. Ba nhu cầu cụ thể dẫn đến hình ảnh cây lớn theo nỗ lực. Năm giai đoạn chạy trên một đường nối hữu cơ, giữ cấp riêng lớp/môn/chương và ghi nhận thời gian có hoạt động.

Hai cột phân vai chứa8chức năng: luyện/ôn, sổ tay sửa sai, săn thưởng có duyệt, nộp bài nhóm/phản biện; học liệu chương/bài và Word/CSV, kiểm tra online có hẹn giờ/trộn thứ tự câu, ngưỡng nhắc tab/idle, chỉ tiêu/báo cáo tuần và học bù Chủ nhật. Bổ sung vườn cá nhân/vườn lớp/vinh danh Kết Trái. Thanh quy trình thể hiện giao bài → học/sửa sai → ghi nhận → phản hồi.

Vai trò AI trung thực: hỗ trợ lập trình/rà soát mã/thiết kế, giáo viên xây dựng và kiểm duyệt học liệu. Không ghi chatbot/gia sư AI đã có trong app. Phân biệt sản phẩm web hiện có với giá trị hướng tới và hoạt động đánh giá hiệu quả tiếp theo; không bịa số liệu khảo sát/tăng điểm. Không dùng dữ liệu học sinh hoặc ảnh lớp thật. Banner2026 lấy nguyên asset mẫu trong thư mục bản đầu; không làm lại logo hoặc ngụ ý đã đạt giải.

## Kiểm tra

Đã xem render đầu và bản tinh chỉnh sau bổ sung đối tượng/vườn-vinh danh/báo cáo tuần; không chồng/cắt chữ. Pypdf xác nhận haiPDF đều1trang, đúng khổ, đủ tác giả/các phần nghiệp vụ, không placeholder. ZXing giải mã QR từ ảnh cuối đúng https://greenedu.up.railway.app/. Report `.local/poster-submission-20261019/v2-verification.json`. PDF để in giữ chữ vector/font nhúng; PNG tương ứng A3/300dpi. Không thay app, không ghi database/push/deploy; các poster trước vẫn giữ.
