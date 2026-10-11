# Kế hoạch hoàn thiện cấp độ ôn tập và kiểm tra

Cập nhật 11/10/2026. Triển khai trên checkout hiện tại, giữ dữ liệu và các thay đổi có sẵn. Tài liệu thiết kế giao diện dùng riêng `docs/app-design.md`.

## Phạm vi thực hiện

1. Gom màu sắc, font, bố cục, ảnh nền, minh họa, avatar, responsive và lịch sử thiết kế vào một tài liệu; các tài liệu tiến độ/bàn giao trỏ tới đó.
2. Bổ sung học kỳ và ma trận ôn tập theo bài/chương; ôn chương/ôn kỳ trộn câu, lưu bộ câu và tiến độ phiên để tiếp tục sau tải lại.
3. Bổ sung điều kiện kiểm tra theo chương, vé mốc cây 3/4/5, thưởng mốc 4 giờ, thống kê đúng có sửa sai và trạng thái còn thiếu.
4. Xây dựng phòng thi 20 phút: thời hạn server, đáp án tự lưu, khôi phục, thu/chấm đúng một lần, cảnh báo chuyển tab, sổ tay nhận câu sai.
5. Thêm Săn điểm và thi chính thức theo lịch giáo viên; lịch sử kết quả, sổ thưởng/phê duyệt và xuất Excel.
6. Kiểm thử API/phân quyền/đồng thời/deadline/khôi phục/migration, kiểm tra desktop/mobile, deploy local và đối chiếu database với backup.

## Quy tắc đã xác nhận và áp dụng

- Cây giữ mốc 0/1/2/3/4 giờ. Thời gian luyện tập và sửa sai cùng tính tiến độ chương; thời gian thi không cộng vào cây.
- Người dùng đã chọn tỷ lệ mở thi tính toàn bộ lượt luyện tập và sửa sai; cho phép giáo viên chọn cách tính kết quả mới nhất của từng câu. Hiển thị rõ cách tính.
- Sổ tay sạch xét đúng chương. Vé cấp tại từng mốc 2/3/4 giờ, mỗi mốc một lần; dùng vé khi bắt đầu thi, tiếp tục cùng lượt sau mất mạng không trừ thêm vé.
- Thi tự học cần đủ 2 giờ, >=70%, không còn câu sai và còn vé. Thi chính thức do giáo viên mở không yêu cầu điều kiện tự học.
- Tự nộp ở lần rời tab thứ 4 theo mục 4.2; giáo viên cấu hình được. Thời gian chuẩn 20 phút theo server.
- Thi chính thức dùng cùng tập câu cho cả lớp, đảo thứ tự giữa các máy; đáp án được công bố sau khi khung thi đóng. Không trả đáp án khi còn đang làm.
- Mốc 4 giờ nhận một điểm hệ thống/chương; mỗi lượt Săn điểm >=8 nhận một điểm, tối đa ba lượt/chương. Thưởng có lịch sử và giáo viên duyệt việc ghi nhận; không tự ghi sổ điểm học bạ.
- Ma trận có số câu và trọng số theo bài/chương. Không đủ câu thì báo thiếu trước khi tạo đề, không lặp câu để bù. Không tự đoán phân loại từ Word ngoài mẫu.

## Tiêu chí hoàn tất

Các thao tác phải có màn hình sử dụng được, API kiểm tra quyền và trạng thái, dữ liệu lưu bền vững. Gửi lại/tải lại không cấp trùng vé hoặc thưởng, không nộp/chấm trùng; không lộ đáp án trước hạn; database cũ giữ dữ liệu. Phạm vi kế hoạch đã hoàn tất và deploy local ngày 11/10/2026 lúc 10:39.

## Nghiệm thu phạm vi kế hoạch

- [x] Tập trung toàn bộ thiết kế/lịch sử và liên kết tra cứu trong app-design.md.
- [x] Học kỳ, ma trận theo bài/chương, ôn chương/kỳ ngẫu nhiên, lưu/tiếp tục phiên.
- [x] Điều kiện 2 giờ/70%/sổ tay theo chương, vé đúng một lần tại cấp 3/4/5 và thưởng 4 giờ.
- [x] Phòng thi 20 phút, deadline server/worker, autosave/khôi phục, tự nộp lần rời tab thứ 4.
- [x] Săn điểm, lịch thi chính thức cùng bộ câu, lịch sử điểm, phê duyệt thưởng và Excel.
- [x] Kiểm thử phân quyền/đồng thời/deadline/retry/persistence/migration, desktop/mobile và deploy local.

Bằng chứng: 54 backend đạt; 32 E2E hồi quy và 8 E2E ôn/thi đạt. Excel tải thật mở được. Bản local http://localhost:3002, backup .local/backups/database-20261011-103900-238.sqlite; kiểm tra health/frontend/khóa ngoại và ID dữ liệu cũ đạt. Chi tiết ở session-handoff.md. Chấm/thưởng nhóm, đổi quà, AI và nghiệm thu với lớp thật là phần tiếp theo, không thuộc phạm vi hoàn tất này.
