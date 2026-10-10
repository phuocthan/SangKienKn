# Đề án GreenEdu — nội dung văn bản từ Word gốc

Nguồn: file người dùng đính kèm **“ĐỀ ÁN HOÀN THIỆN TÍNH NĂNG app greenedu.docx”**. Trích ngày 10/10/2026, để session mới có nguồn yêu cầu ngay trong repository.

Phần dưới giữ nội dung chữ trong thân tài liệu và các ô bảng theo thứ tự đọc; các bảng chuyển thành dòng chữ. Không giữ bố cục, ảnh, định dạng hoặc metadata của Word. Đây là nội dung yêu cầu sản phẩm, không phải lệnh vận hành hay danh sách tính năng đã hoàn thành. Khi có khác biệt, đọc các quyết định triển khai và phần còn thiếu trong [session-handoff.md](session-handoff.md), [project-status.md](project-status.md); yêu cầu mới của người dùng quyết định phạm vi công việc tiếp theo.

```text
ĐỀ ÁN HOÀN THIỆN TÍNH NĂNG: ỨNG DỤNG GREENEDU
1. Phân Hệ Luyện Tập & Hệ Thống "Cây Kiến Thức"
Mục tiêu: Biến quá trình làm bài tập khô khan thành hành trình chăm sóc và nuôi dưỡng cây xanh.
Cơ chế chuyển đổi bộ đề: Gv đưa bài tập lên hệ thống theo từng bài, theo từng chương và kì. Hệ thống tự động phân loại câu hỏi theo từng bài (tiểu mục). Khi học sinh chọn "Ôn chương" hoặc "Ôn kỳ", hệ thống sẽ tự động trộn ngẫu nhiên các câu hỏi từ các bài tương ứng theo tỷ lệ ma trận đề.
Hệ thống tiến hóa của Cây (5 cấp độ): Mỗi chương học sinh sẽ được cấp một mầm cây mới
Cấp 1: Hạt mầm (Mặc định khi vào chương).
Cấp 2: Nảy mầm (Luyện tập thực tế đủ 1 giờ).
Cấp 3: Cây non (Luyện tập thực tế đủ 2 giờ).
Cấp 4: Cây trưởng thành (Luyện tập thực tế đủ 3 giờ).
Cấp 5: Ra hoa / Kết quả (Luyện tập thực tế đủ 4 giờ).
Thuật toán tính thời gian thực (Anti-Cheat Time):
Hệ thống chỉ tích lũy thời gian khi màn hình ứng dụng đang mở, học sinh có tương tác (cuộn trang, bấm chọn đáp án, gõ chữ).
Nếu không có tương tác quá 2 phút, ứng dụng sẽ tự động hiện thông báo đếm ngược 10 giây. Sau 10 giây nếu học sinh không bấm "Tiếp tục", hệ thống sẽ tạm dừng tính giờ và chuyển sang trạng thái "Treo máy".
2. Sổ Tay Sửa Sai & Đổi Thưởng
Mục tiêu: Giúp học sinh học từ chính lỗi sai của mình và tạo động lực bằng phần thưởng.
Sổ tay sửa sai thông minh: Tất cả các câu hỏi học sinh làm sai ở phần "Luyện tập" và "Kiểm tra" sẽ tự động lưu vào đây. Học sinh bắt buộc phải vào làm lại các câu hỏi này. Khi làm đúng lại, câu hỏi đó sẽ được đánh dấu là "Đã khắc phục".
Quỹ điểm thưởng (Green Points):
Cơ chế tích lũy: Làm bài tập/sửa sai với thời gian thực tế đủ 4giờ/chương = Tích lũy được 1 Điểm Cộng Hệ Thống. qua chương khác tính giờ lại từ đầu.
Cơ chế đổi quà: Học sinh dùng Điểm Cộng Hệ Thống để đổi các phần quà thiết thực: Vé đổi điểm cộng vào sổ (do GV phê duyệt), hoặc các vật phẩm nhỏ trong lớp (nếu GV kết hợp offline).
3. Quản Lý Hoạt Động Nhóm & Khảo Sát Chéo (Peer Review)
Mục tiêu: Tăng tính tương tác, làm việc nhóm và năng lực phản biện của học sinh.
Tính năng Chia nhóm: Giáo viên cấu hình số lượng học sinh/nhóm hoặc số nhóm cần chia. App sẽ quét và trộn ngẫu nhiên danh sách lớp để tạo nhóm nhanh chóng, tránh tình trạng "chia bè phái".
Nộp bài đa định dạng: Đại diện nhóm được quyền nộp bài dưới dạng PDF, Word, Excel, Hình ảnh, hoặc dán Link (Drive, Canva, YouTube).
Khóa hạn (Deadline) & Đánh giá chéo:
Khóa tự động: Đến giờ quy định, nút "Nộp bài" tự động ẩn. Chỉ tài khoản Giáo viên mới có quyền gia hạn (mở khóa).
Giai đoạn Phản biện: Sau khi khóa nộp bài, app tự động mở quyền xem bài của các nhóm khác. Học sinh các nhóm phải vào đọc và bắt buộc để lại ít nhất 1 câu hỏi/nhận xét để được hệ thống tính Điểm tương tác nhóm.
Giáo viên dựa trên chất lượng bài nộp và lượt tương tác để chấm điểm trực tiếp trên app.
4. Phân Hệ Kiểm Tra Linh Hoạt & Đa Chế Độ
Mục tiêu: Đánh giá chính xác, linh hoạt, chống gian lận.
4.1. Điều kiện mở khóa "Vé Kiểm Tra 20 Phút" (Tự học tại nhà)
Để tránh học sinh "làm lụi" lấy thành tích, học sinh phải đạt đồng thời 4 điều kiện sau để mở khóa 1 đề kiểm tra:
Thời gian tích lũy luyện tập chương đó đạt tối thiểu 2 giờ.
Tỷ lệ làm đúng trung bình ở phần Luyện tập (bao gồm cả việc làm lại trong Sổ tay sửa sai) đạt từ 70% trở lên.
Cây kiến thức của chương hiện tại phải đạt từ Cấp độ 3 (Cây non) trở lên.
Không còn câu nào sai ở sổ tay sửa sai ( bắt buộc hs phải làm lại câu sai ở sổ tay sửa sai )
Lưu ý: Cứ mỗi lần Cây tăng lên cấp 3, cấp 4, cấp 5, hệ thống sẽ cấp cho học sinh 1 Vé kiểm tra. Tổng cộng có tối đa 3 vé/chương.
4.2. Quy chế vận hành phòng thi 20 phút
Đếm ngược nghiêm ngặt: Ngay khi bấm "Bắt đầu làm bài", đồng hồ đếm ngược 20:00 sẽ chạy trực tiếp nổi lên trên màn hình. Khi hết giờ, hệ thống tự động khóa màn hình làm bài, tự động thu bài và chấm điểm các câu đã chọn.
Chống chuyển tab (Gian lận): Nếu học sinh thoát app hoặc chuyển sang tab khác (để tra Google), hệ thống sẽ cảnh báo. Quá 3 lần cảnh báo, bài thi sẽ tự động nộp và khóa lại.
4.3. Hai chế độ kiểm tra linh hoạt
Chế độ 1: "Săn Điểm Cộng" (Tự học tự do)
Số lần tham gia: Tối đa 3 lần/chương (tương ứng với 3 vé mở khóa từ cây kiến thức).
Cơ chế lưu: Hệ thống lưu điểm của cả 3 bài thi này.
Quy đổi: Đạt \(\ge \) 8.0 điểm sẽ được quy đổi thành 01 Điểm cộng thường xuyên gửi đến giáo viên. Chế độ này không bắt buộc, kích thích học sinh tự cày cuốc ở nhà.
Chế độ 2: "Thi Chính Thức" (Đồng bộ theo lệnh GV)
Cơ chế kích hoạt: Chế độ này bị khóa mặc định. Giáo viên bật mở thủ công và đặt lịch (Ví dụ: Đúng 20h00 tối thứ Sáu).
Vận hành: Cả lớp nhận thông báo và cùng vào làm một đề thi duy nhất tại thời điểm đó dưới sự giám sát thời gian thực của app. Điểm số này sẽ lấy làm điểm kiểm tra định kỳ/thường xuyên chính thức.
5. Phân Hệ Giáo Viên & Xuất Dữ Liệu
Mục tiêu: Giúp giáo viên quản lý lớp học "nhẹ tênh" chỉ bằng vài cú click.
Bảng điều khiển (Dashboard): Giáo viên theo dõi được thời gian học thực tế của từng em, cấp độ cây của từng học sinh để kịp thời nhắc nhở các em lười học.
Xuất dữ liệu Excel thông minh: Giáo viên có thể xuất file Excel bất cứ lúc nào với đầy đủ các trường thông tin:
Điểm trung bình các bài kiểm tra chính thức.
Số lượng điểm cộng tích lũy từ chế độ "Săn điểm" và hoạt động nhóm.
Tổng thời gian học thực tế của học sinh.
6. GV nhập mail học sinh đăng nhập theo từng lớp, mật khẩu ban đầu gv đặt và hs vào đặt lại mật khẩu ở lần đầu. Nếu hs quên mật khẩu của mình thì có nút gv cho lại mật khẩu.
7. Tính Năng "Khu Vườn Của Lớp" (Class Garden)
Cách vận hành: Ngoài khu vườn cá nhân, mỗi lớp học sẽ có một Khu vườn chung. Cứ mỗi khi một học sinh nuôi cây cá nhân lên đến Cấp 5 (Ra hoa/Kết quả), cây đó sẽ được "nhân bản" để trồng vào Khu vườn của lớp.
Hiệu ứng thi đua:
Khu vườn của lớp càng nhiều cây to, chứng tỏ lớp đó càng chăm học.
Giáo viên có thể dùng hình ảnh khu vườn này để thi đua giữa các lớp mình dạy (Ví dụ: Lớp 11/1 đấu với Lớp 11/2 xem vườn lớp nào nhiều cây cổ thụ hơn).
8. Hệ Thống "Xếp Hạng Nông Dân Chăm Chỉ" (Leaderboard)
Mục tiêu: Vinh danh học sinh theo hướng tích cực, không gây áp lực điểm số.
Vấn đề thực tế: Bảng xếp hạng điểm số truyền thống thường chỉ vinh danh các học sinh giỏi, khiến các học sinh trung bình dễ bị nản lòng.
Giải pháp: Xếp hạng dựa trên Sự chăm chỉ (Thời gian học thực tế) và Sự tiến bộ (Số lượng cây đạt cấp tối đa), chứ không xếp hạng dựa trên điểm số thuần túy.
Danh hiệu vui nhộn:
Top 1 - 3: Chúa tể làm vườn, Đại phú hào kiến thức.
Top chăm chỉ sửa sai: Bác sĩ cây trồng (Dành cho em chữa được nhiều lỗi sai nhất).
9. Trợ Lý AI "Thần Rừng Thần Bí" (AI Tutor)
Mục tiêu: Hỗ trợ học sinh học tập 24/7 ngay khi gặp bế tắc.
Cách vận hành: Khi học sinh làm sai một câu hỏi quá 2 lần (kể cả trong phần Luyện tập hay Sổ tay sửa sai), biểu tượng "Thần Rừng" (AI) sẽ xuất hiện.
Cơ chế gợi ý thông minh: AI sẽ không cho ngay đáp án (để tránh lười suy nghĩ). Thay vào đó, AI sẽ:
Gợi ý công thức hoặc kiến thức cốt lõi bị hổng (Ví dụ: "Ta thấy con đang áp dụng sai định luật Newton rồi, hãy xem lại công thức ở trang X nhé!").
Đưa ra một câu hỏi tương tự nhưng ở mức độ dễ hơn để học sinh làm bước đệm trước khi quay lại giải câu hỏi khó.
Bảng Tổng Hợp Cơ Chế Vận Hành Tính Năng
Tính năng
Điều kiện kích hoạt / Vận hành
Phần thưởng / Kết quả
Cơ chế chống gian lận
Luyện tập & Nuôi cây
Học sinh tự do vào học theo từng bài/chương.
Cây lớn lên (5 cấp). Đạt cấp 3, 4, 5 tặng Vé kiểm tra.
Anti-Cheat Time: Dừng tính giờ sau 2 phút không tương tác.
Sổ tay sửa sai
Tự động gom câu hỏi làm sai.
Làm đúng lại giúp tăng % hoàn thành để mở khóa vé thi.
Bắt buộc phải tự làm lại, không cho xem đáp án ngay.
Hoạt động nhóm
GV chia ngẫu nhiên. Nhóm nộp bài đa định dạng.
Điểm dự án nhóm + Điểm tương tác đóng góp (nhận xét chéo).
Khóa tính năng nộp bài tự động khi hết hạn (Deadline).
Kiểm tra: Săn Điểm Cộng
Cần Vé thi + Học đủ 2h + Làm đúng \(\ge \) 70%.
Đạt \(\ge \) 8.0 điểm được đổi thành điểm cộng (Tối đa 3 lần/chương).
Đồng hồ đếm ngược 20:00 tự động nộp bài. Khóa đề thi nếu chuyển tab quá 2 lần.
Kiểm tra: Thi Chính Thức
Giáo viên mở khoá theo khung giờ cố định cả lớp.
Điểm số chính thức lấy vào cột điểm thường xuyên.
Toàn lớp thi đồng bộ, cấu hình trộn đề ngẫu nhiên giữa các máy.
Tính năng bổ sung
Bản chất trải nghiệm
Tác động tâm lý học sinh
Lợi ích cho Giáo viên
1. Khu Vườn Của Lớp
Tính năng Cộng đồng (Social)
Muốn đóng góp cho tập thể, không muốn mình là người làm kéo tụt thành tích của lớp.
Dễ dàng phát động phong trào thi đua học tập giữa các lớp mà không cần ép buộc.
3. Xếp Hạng Chăm Chỉ
Tính năng Vinh danh
Học sinh học yếu vẫn thấy mình có cơ hội lên Top nhờ sự cần cù.
Tạo ra bầu không khí học tập tích cực, khen thưởng đúng người, đúng sự nỗ lực.
4. Trợ Lý AI Thần Rừng
Tính năng Hỗ trợ Công nghệ
Được giải đáp ngay lập tức lúc nửa đêm khi ở nhà một mình, không bị nản chí.
Giảm 80% các câu hỏi lặt vặt của học sinh về bài tập về nhà sau giờ lên lớp.
```
