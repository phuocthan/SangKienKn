# Căn cứ giáo dục và giới hạn diễn giải

Rà soát: 20/10/2026. Đây là đối chiếu định hướng sư phạm cho poster, không phải chứng nhận GreenEdu đã đáp ứng toàn bộ Chương trình GDPT 2018 hoặc đã làm tăng năng lực học sinh.

## Văn bản gốc

1. Bộ GDĐT, **Chương trình giáo dục phổ thông - Chương trình tổng thể**, ban hành kèm Thông tư 32/2018/TT-BGDĐT. Đối chiếu mục III (năng lực chung), VI (phương pháp và đánh giá), IX (biểu hiện năng lực, đặc biệt tự học/tự hoàn thiện).
   - [Địa chỉ tài liệu của Bộ GDĐT](https://moet.gov.vn/content/tintuc/Lists/News/Attachments/8421/chuong-trinh-tong-the-ctgdpt-2018.pdf).
   - [Bản hợp nhất được dẫn trong tài liệu khoa học](https://moet.gov.vn/content/vanban/Lists/VBPQ/Attachments/1483/vbhn-chuong-trinh-tong-the.pdf).
   - [Bản toàn văn được đăng lại, đã đọc đối chiếu](https://www.slideshare.net/slideshow/chuong-trinh-tong-the-ctgdpt-2018-tai-li-u-d-c/285314416): mục III; trang 32–33 về tổ chức hoạt động/đánh giá; trang 45 về tự học, tự hoàn thiện. Đây là bản chụp/văn bản chương trình của Bộ, không sử dụng bình luận của người đăng làm căn cứ.
2. Bộ GDĐT, **Chương trình giáo dục phổ thông môn Vật lí**, ban hành kèm Thông tư 32/2018/TT-BGDĐT. Đối chiếu mục IV (nhận ra sai sót, giải thích và vận dụng) và VI (học nhóm, thực hành/thí nghiệm, tìm hiểu và giải quyết vấn đề).
   - [Địa chỉ tài liệu của Bộ GDĐT](https://data.moet.gov.vn/index.php/s/LYZDcWOm7QJqgdR).
   - [Bản toàn văn được đăng lại, đã đọc đối chiếu](https://www.slideshare.net/slideshow/2018ch-ng-trinh-gdpt-2018_mon-v-t-li-pdf/276931818): trang 6–7 về năng lực vật lí; mục VI về phương pháp dạy học và đánh giá.

Trang Bộ GDĐT có kết quả được lập chỉ mục cho nội dung đánh giá nhưng các lần mở trực tiếp bị timeout/đổi sang HTML, nên không ghi đã tải được PDF từ Bộ. Các đoạn văn bản gốc được đọc trên bản đăng lại ở trên; không dùng tài liệu GDTX, dự thảo 2017 hoặc kết quả thực nghiệm của dự án khác để thay cho chương trình chính thức. Phần có thay đổi 2022 về kế hoạch môn học không được dùng để suy diễn nghiệp vụ của ứng dụng. Poster không đưa kết luận pháp lý về tình trạng hiệu lực toàn bộ văn bản.

## Mạch lập luận của poster

| Định hướng | Cách dùng công cụ | Minh chứng để giáo viên xem |
| --- | --- | --- |
| Tự chủ và tự học | Giao nội dung ôn phù hợp; học sinh làm và làm lại câu sai. | Lịch sử học, câu còn sai và kết quả làm lại. |
| Giao tiếp và hợp tác | Nhóm nộp sản phẩm, góp ý, đặt câu hỏi và phản biện. | Sản phẩm/phiên bản và nội dung trao đổi; không tự suy ra đóng góp của mỗi thành viên chỉ từ một file nhóm. |
| Giải quyết vấn đề và sáng tạo | Giáo viên thiết kế nhiệm vụ gắn thực tiễn, yêu cầu giải thích hoặc đề xuất cách làm. | Lời giải, báo cáo và bằng chứng do học sinh tạo; cần giáo viên đánh giá theo tiêu chí. |
| Đánh giá để điều chỉnh | Giáo viên xem kết quả, hướng dẫn lại và bổ sung nhiệm vụ. | Lỗi lặp lại, mức hoàn thành và chất lượng sản phẩm, thay vì chỉ tổng điểm hoặc tổng thời gian. |

Đây là cách vận dụng các định hướng vào chức năng có sẵn. Sự tồn tại của tính năng không tự chứng minh năng lực đã hình thành. Nhiệm vụ thực tiễn, tiêu chí và mức độ phù hợp với yêu cầu cần đạt do giáo viên chọn; không khẳng định toàn bộ ngân hàng câu hỏi hiện có đã được gắn chuẩn/tự động phân loại năng lực.

Đối chiếu sản phẩm với `src/Practice.tsx`, `src/Learning.tsx`, `docs/class-management.md`, `docs/group-activities.md`, `docs/feedback-discussion.md`. Không thay app/DB, không coi tài liệu nghiệp vụ lịch sử là xác nhận phát hành mới trên Railway. Việc chấm điểm nhóm theo rubric tự động không được mô tả là chức năng đã có.

## Cây, AI và hiệu quả

- Cấp cây hiện dựa vào thời gian học hợp lệ theo lớp/môn/chương. Đây là cách ghi nhận việc học và ý tưởng tạo động lực, không phải thang đo năng lực hoặc phẩm chất.
- Ứng dụng bổ trợ quá trình ôn tập và trao đổi; giáo viên vẫn cần tổ chức thực hành, thí nghiệm và đánh giá nhiệm vụ vận dụng Vật lí.
- AI được ghi đúng là hỗ trợ phát triển mã và minh họa; không gán gia sư AI, chấm năng lực tự động hoặc tự động cá nhân hóa theo chuẩn chương trình khi chưa có.
- Chưa có dữ liệu thực nghiệm đủ để kết luận tăng năng lực. Đối chiếu bài làm trước/sau và phân tích chất lượng sản phẩm là hướng kiểm chứng tiếp theo, chưa phải kết quả đã thu được.
