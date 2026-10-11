# Đối chiếu cấp độ cây ôn tập và kiểm tra GreenEdu

**Bản rà soát trước triển khai.** Các thiếu sót trong phạm vi ôn/thi đã được xử lý theo [kế hoạch](learning-implementation-plan.md) và [hướng dẫn hiện tại](learning.md); giữ nội dung dưới đây làm đối chiếu lịch sử.

Ngày rà soát: 11/10/2026. Nguồn yêu cầu: file “ĐỀ ÁN HOÀN THIỆN TÍNH NĂNG app greenedu (1).docx” người dùng gửi, các mục 1, 2, 4, 5 và bảng tổng hợp cuối tài liệu. Đối chiếu mã trong checkout hiện tại; các nội dung được đề xuất dưới đây chưa phải quy tắc đã được người dùng phê duyệt.

Kết luận: cây theo thời gian và luyện tập/sửa sai đã có nền tảng hoạt động. Ôn chương chưa đáp ứng việc trộn theo ma trận; ôn kỳ chưa có. Vé, phòng kiểm tra 20 phút, Săn điểm và Thi chính thức còn thiếu cả giao diện, API lẫn dữ liệu lưu trữ. Cần chốt một số quy tắc trong đề án trước khi triển khai các phân hệ này.

## 1 Cấp độ cây

| Cấp            | Thời gian tích lũy của chương | Trạng thái hiện tại              | Liên kết còn thiếu                          |
| -------------- | ----------------------------- | -------------------------------- | ------------------------------------------- |
| 1 Hạt mầm      | Từ 0 đến dưới 1 giờ           | Có, mặc định khi chưa có tiến độ | Không có thiếu sót về mốc cấp               |
| 2 Nảy mầm      | Từ 1 đến dưới 2 giờ           | Có                               | Không có thiếu sót về mốc cấp               |
| 3 Cây non      | Từ 2 đến dưới 3 giờ           | Có                               | Mốc cấp vé thứ nhất và điều kiện sử dụng vé |
| 4 Trưởng thành | Từ 3 đến dưới 4 giờ           | Có                               | Mốc cấp vé thứ hai                          |
| 5 Ra hoa       | Từ 4 giờ                      | Có, không tăng lên cấp 6         | Mốc cấp vé thứ ba và ghi nhận Green Points  |

`treeLevel()` trong `server/app.ts` tính cấp từ số giây, giới hạn tối đa 5. Tiến độ lưu theo học sinh/chương; giao diện có cây, thời gian còn thiếu đến cấp kế tiếp và thanh tiến độ đến 4 giờ. Đây là cấp cây theo sự chăm chỉ, không phải mức độ khó của câu hỏi hay kết quả đánh giá năng lực.

Phần tính giờ đã có heartbeat, đồng hồ server, chỉ một phiên học hoạt động cho mỗi học sinh, không cộng các khoảng mất kết nối dài hoặc khi tab ẩn, cảnh báo sau 120 giây không tương tác và tạm dừng sau 10 giây tiếp theo. Tuy nhiên, tín hiệu có tương tác vẫn do trình duyệt gửi; không thể coi cơ chế này là bằng chứng học sinh thực sự đang giải bài hay là cơ chế chống gian lận phòng thi hoàn chỉnh.

Thiếu liên kết nghiệp vụ:

- Chưa ghi sự kiện đạt từng mốc để cấp vé/thưởng đúng một lần. Chỉ tính lại cấp từ thời gian chưa đủ bảo đảm quyền lợi được cấp một lần, không trùng khi tải lại/gửi lại.
- Chưa có thời gian luyện tập và thời gian sửa sai tách riêng. Cả hai hiện cộng vào cùng tiến độ chương. Điều này phù hợp phần thưởng 4 giờ có tính sửa sai, nhưng điều kiện vé ghi “luyện tập” cần xác định có tính sửa sai hay không.
- Chưa có màn hình báo còn thiếu điều kiện nào để được kiểm tra, vé đã cấp/đã dùng/còn lại, điểm thưởng đã nhận ở mốc 4 giờ.
- Cần xác định học thêm sau 4 giờ có thưởng tiếp hay chỉ nhận một lần/chương. Đề xuất giữ cây cấp 5 và cấp thưởng một lần/chương, nếu người dùng chấp thuận.

## 2 Luyện tập ôn chương ôn kỳ và sửa sai

| Nội dung                | Đã có                                                           | Còn thiếu                                                                                            |
| ----------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Luyện từng bài          | Chọn bài, lấy câu thuộc bài đó, trả lời và nhận giải thích      | Chưa có mức độ câu hỏi/ma trận để chọn bộ câu theo cấu hình                                          |
| Ôn toàn chương          | Lấy toàn bộ câu đang hoạt động của chương                       | Hiện trả theo thứ tự nhập, chưa rút/trộn ngẫu nhiên theo ma trận, số câu/thời lượng chưa cấu hình    |
| Ôn kỳ                   | Chưa có                                                         | Quan hệ học kỳ–chương, chọn phạm vi, tỷ lệ phân bổ câu giữa chương/bài, tạo bộ ôn                    |
| Ngân hàng câu hỏi       | Gắn bài/chương, nhập Word/CSV theo mẫu                          | Chưa tự phân loại từ bộ đề bất kỳ; chưa lưu cấu hình ma trận                                         |
| Sổ tay sửa sai          | Lưu câu sai, làm lại, đánh dấu đã khắc phục; sai lại thì mở lại | Chưa nhận câu sai từ bài kiểm tra vì chưa có phân hệ kiểm tra                                        |
| Tiếp tục phiên đang làm | Lượt trả lời và tổng thời gian được lưu                         | Vị trí câu, lựa chọn chưa gửi, bộ câu và tổng kết của phiên luyện tập chưa được phục hồi sau tải lại |

Điểm lệch đáng chú ý: ban đầu API không trả đáp án cho học sinh. Nhưng sau khi gửi một đáp án sai, cả luyện tập lẫn sửa sai đều nhận đáp án đúng và lời giải ngay. Bảng cuối đề án yêu cầu sổ tay không cho xem đáp án ngay. Cần chọn cách hiển thị gợi ý trước, thời điểm mở lời giải và số lần tự làm lại; hiện chưa có cơ chế đó.

Tỷ lệ đúng đang dùng để báo cáo chỉ đếm lượt `practice`, không tính `correction`. Ví dụ một lượt sai rồi một lượt sửa đúng vẫn chưa được phản ánh như yêu cầu “bao gồm sửa sai” trong điều kiện 70%. Không nên tái sử dụng tỷ lệ này làm điều kiện thi khi chưa thống nhất công thức.

## 3 Vé và các chế độ kiểm tra

Theo đề án, bắt đầu kiểm tra tự học cần đồng thời đủ 2 giờ, cây từ cấp 3, tỷ lệ đúng từ 70%, hết câu chưa khắc phục và có vé. Hiện không có kiểm tra các điều kiện đó để mở một bài thi. Đủ 2 giờ và cây cấp 3 là hai biểu hiện của cùng một mốc theo công thức đang có.

Các phần chưa được xây dựng:

1. **Quản lý vé:** cấp theo mốc cấp 3/4/5, tối đa 3/chương; chống cấp trùng, giữ vé chờ đủ điều kiện, dùng/trả vé và lịch sử.
2. **Phòng kiểm tra 20 phút:** bộ đề cố định cho lượt thi, lưu thời điểm bắt đầu/hết hạn trên server, tự lưu đáp án, tiếp tục sau tải lại/mất mạng, tự thu bài khi hết hạn kể cả học sinh đóng trình duyệt, chấm/lưu kết quả đúng một lần.
3. **Theo dõi chuyển tab:** ghi cảnh báo cho lượt thi, xử lý ngưỡng tự nộp, giữ số lần qua tải lại. Việc tab ẩn hiện tại chỉ tạm dừng tính thời gian học.
4. **Săn điểm cộng:** giới hạn lượt bằng vé, lưu đủ ba kết quả, quy tắc từ 8,0 điểm, sổ giao dịch thưởng chống ghi trùng và quy trình giáo viên phê duyệt.
5. **Thi chính thức:** giáo viên tạo/mở/lên lịch theo lớp, cửa sổ vào thi, thông báo, phân phối đề, theo dõi đang làm/đã nộp, đóng/thu bài, báo cáo và thời điểm công bố đáp án.
6. **Báo cáo giáo viên:** điểm từng lượt/trung bình thi chính thức, điểm cộng theo nguồn và xuất Excel đầy đủ. Báo cáo hiện tại là thời gian/luyện tập/sửa sai/cây và CSV.

Đây là thiếu toàn bộ nghiệp vụ, không thể hoàn thành chỉ bằng thêm nút hoặc đồng hồ vào màn hình luyện tập. `attempts.mode` hiện chỉ có `practice` và `correction`; chưa có đối tượng đề thi, lượt thi, vé hoặc sổ giao dịch thưởng.

## 4 Những quy tắc cần chốt

| Quy tắc                  | Vấn đề trong đề án                                                | Điều cần quyết định                                                                                          |
| ------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Chuyển tab               | Mục 4.2 ghi quá 3 cảnh báo; bảng cuối ghi quá 2 lần               | Tự nộp ở lần thứ 4 hay thứ 3; thế nào là một lần; xử lý app điện thoại bị che/gián đoạn                      |
| Tỷ lệ 70%                | Ghi trung bình có tính sửa sai nhưng không nêu mẫu số             | Tính trên mọi lượt, lần đầu hay kết quả gần nhất; phạm vi câu; có yêu cầu số câu/bài tối thiểu không         |
| Phạm vi sổ tay sạch      | Không nêu rõ chương hiện tại hay toàn bộ tài khoản                | Đề xuất xét đúng chương đang xin kiểm tra, tránh chương khác chặn tiến độ                                    |
| Cấp vé và dùng vé        | Vừa nói cấp khi cây lên mốc, vừa nói đạt đủ điều kiện mới mở khóa | Đề xuất vé ghi nhận ở mốc cây, chỉ sử dụng khi đủ điều kiện; khi nào trừ vé, mất mạng có được tiếp tục không |
| Thi chính thức           | Cùng một đề cho cả lớp, nhưng bảng cuối nói trộn giữa các máy     | Cùng tập câu và đảo thứ tự, hay các mã đề tương đương theo cùng ma trận                                      |
| Điều kiện thi chính thức | Quy tắc vé/2 giờ/70% mô tả cho tự học                             | Thi theo lệnh giáo viên có cần các điều kiện tự học hay không                                                |
| Thưởng                   | Mốc 4 giờ và bài thi từ 8,0 đều tạo điểm; có tối đa 3 lượt thi    | Mỗi lượt đạt được thưởng hay lấy kết quả tốt nhất; giới hạn/cộng dồn và quyền phê duyệt                      |
| Thời gian và ma trận     | Chưa có số câu, tỷ lệ, loại câu hoặc cách xử lý thiếu câu         | Cấu hình của giáo viên, thang điểm, phạm vi chương/kỳ và xử lý ngân hàng chưa đủ                             |

Lưu ý về 70%: nếu dùng kết quả gần nhất của các câu đã làm, sau khi sửa hết câu sai tỷ lệ gần như luôn 100%; ngưỡng 70% mất tác dụng độc lập. Nếu dùng toàn bộ lịch sử lượt làm, học sinh có thể sửa hết vẫn dưới 70%, hoặc lặp câu dễ để tăng tỷ lệ. Cần phân biệt tỷ lệ đúng ban đầu, mức độ khắc phục và độ phủ nội dung trước khi chọn một chỉ số để mở thi.

## 5 Thứ tự hoàn thiện đề xuất

1. Chốt công thức 70%, phạm vi sổ tay, cấp/dùng vé, ngưỡng chuyển tab và quy tắc thưởng.
2. Hoàn thiện ngân hàng/ma trận, Ôn chương/Ôn kỳ và màn hình tiến độ có trạng thái đủ/chưa đủ điều kiện.
3. Xây dựng vé và phòng kiểm tra 20 phút có lưu/khôi phục/thu bài theo server.
4. Hoàn thiện Săn điểm cùng sổ thưởng và phê duyệt.
5. Thêm lịch thi chính thức, theo dõi lớp và xuất báo cáo đầy đủ.

## Bằng chứng đối chiếu

- `server/app.ts:18`: công thức cấp cây.
- `server/app.ts:393`: thống kê thời gian/cấp/tỷ lệ đúng; chỉ đếm lượt luyện tập.
- `server/app.ts:837`: câu theo chương/bài trả theo `rowid`.
- `server/app.ts:965`: lưu lượt trả lời/sửa sai và trả đáp án/lời giải.
- `server/app.ts:1059`: phiên học và heartbeat tính giờ.
- `src/App.tsx:1165`: thẻ chương, cấp cây, chọn bài/Ôn toàn chương.
- `src/Practice.tsx:141`: cảnh báo/tạm dừng do không tương tác.
- `src/Practice.tsx:324`: hiển thị đáp án đúng ngay sau gửi câu trả lời.
- `shared/questions.ts:1`: câu trắc nghiệm bốn lựa chọn, có bài; chưa có học kỳ/ma trận.
- `server/db.ts:48`: lượt làm hiện chỉ có luyện tập/sửa sai.

Đã chạy lại các kiểm thử có sẵn liên quan cấp cây, tính giờ, sửa sai và migration tiến độ: 4/4 đạt, dùng database riêng. Đây là rà soát nội dung và mã, không phải nghiệm thu phân hệ thi hoặc kiểm thử chống gian lận thực tế. Lần rà soát không sửa nghiệp vụ hoặc deploy.
