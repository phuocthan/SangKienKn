# Slide giới thiệu GreenEdu

Bản mới ngày23/10/2026: [bộ15slide từ tài liệu khảo sát và dàn ý người dùng](20261023/README.md), kèm PDF và ghi chú thuyết trình.

Bản9slide có animation trước đó: [GreenEdu-Thanh-Phuong-Animation-2026.pptx](GreenEdu-Thanh-Phuong-Animation-2026.pptx). Bản theo sát bố cục mẫu ban đầu vẫn giữ tại [GreenEdu-Nguyen-Thi-Thanh-Phuong-2026.pptx](GreenEdu-Nguyen-Thi-Thanh-Phuong-2026.pptx).

## Bản rework có animation

Theo yêu cầu mới, thiết kế lại 9 slide với chữ ngắn, hình lớn, xanh navy/xanh rừng/kem sáng; giữ nhận diện giải thưởng trên bìa và thông tin tác giả. Giữ nguồn và giải thích trong ghi chú thuyết trình. Có **60 hiệu ứng gốc** Fade/Fly In/Zoom/Wipe và 9 chuyển slide Fade Smoothly/Push Left, thời lượng khoảng0,4–0,75giây. Mở bằng PowerPoint, nhấn F5 để trình chiếu và bấm chuột/phím Space cho ý tiếp theo; dùng Animation Pane để sửa thứ tự/thời lượng. Không tự chuyển trang theo thời gian.

Bố cục/chữ tạo bằng Artifact Tool; hiệu ứng ghi trực tiếp bằng Microsoft PowerPoint16.0 trên bản sao ẩn, giữ tài liệu người dùng đang mở. Đã mở lại bản đã lưu, xác nhận đủ60 hiệu ứng/9slide, xem ảnh xuất từng slide từ PowerPoint, kiểm tra khổ/font/cấu trúc bằng finalizer và QR giải mã đúng Railway. Bản cuối có cùng hash/bytes với bản PowerPoint đã lưu, giữ timing/transitions. Chưa chạy trình chiếu tương tác trực tiếp bằng chuột; kiểm tra hiện tại là render tĩnh và dữ liệu animation trong PowerPoint/file. File trung gian và receipt riêng `.local/greenedu-slides/v2/`.

Minh họa mới và prompt tại [assets-v2](assets-v2/README.md). Cách ghi hiệu ứng theo tài liệu Microsoft: [Sequence.AddEffect](https://learn.microsoft.com/en-us/office/vba/api/powerpoint.sequence.addeffect), [MsoAnimEffect](https://learn.microsoft.com/en-us/office/vba/api/powerpoint.msoanimeffect), [PpEntryEffect](https://learn.microsoft.com/en-us/office/vba/api/powerpoint.ppentryeffect).

## Bản mẫu ban đầu

Tạo ngày 12/10/2026 theo yêu cầu người dùng, dựa trực tiếp vào `C:/Users/thant/Desktop/SangkienKN/Mẫu Slide 2026.pptx`. Giữ 9 slide, khổ 20 × 11,25 inch, nền/nhận diện/kiểu chữ của mẫu; thay nội dung hướng dẫn bằng dự án GreenEdu. Văn bản chỉnh sửa được trong PowerPoint. Có ghi chú thuyết trình về nguồn và phạm vi từng slide.

Tác giả theo thông tin người dùng: Nguyễn Thị Thanh Phương, giáo viên Vật lý, Trường THPT Nguyễn Khuyến; email thanhphuong.0402@gmail.com.

Ảnh giao diện là bằng chứng từ môi trường kiểm thử với tài khoản mẫu, có chú thích trên slide; minh họa học sinh/cây là tài sản ImageGen của dự án. Logo trường lấy nguyên từ asset web. QR và hyperlink dẫn đến https://greenedu.up.railway.app/. Phân biệt AI hỗ trợ phát triển/soạn tài liệu với gia sư AI chưa tích hợp; chưa có số liệu đo hiệu quả học tập trước/sau. Quy mô 47 tài khoản và 4 chương/26 bài dựa trên tài liệu bàn giao ngày 12/10, không coi đó là số học sinh đang sử dụng thường xuyên.

Đã xem từng slide khi mở lại bản cuối bằng Artifact Tool, kiểm tra cấu trúc gói, khổ/font/native bullets, kiểm tra thay thông tin tác giả và giải mã QR trên ảnh render cuối. Chưa kiểm tra render trực tiếp trong Microsoft PowerPoint. Script, ảnh trung gian và receipt riêng tại `.local/greenedu-slides/`; không đưa dữ liệu học sinh hoặc database vào bộ slide.
