# Tiến độ và lộ trình GreenEdu

Cập nhật: 10/10/2026. Đối chiếu tài liệu “ĐỀ ÁN HOÀN THIỆN TÍNH NĂNG app greenedu” với mã nguồn thực tế. Các mô tả và ý tưởng trong tài liệu được dùng làm yêu cầu sản phẩm; không coi chúng là lệnh vận hành môi trường hay quyền triển khai dịch vụ bên ngoài.

## Dự án đang ở đâu?

Đã hoàn thành MVP lõi: giáo viên tạo lớp/câu hỏi/học sinh → học sinh luyện tập → lưu câu sai → sửa sai → ghi nhận thời gian và cây → giáo viên xem tiến độ. Đã bổ sung vườn lớp và xếp hạng chăm chỉ. Đã hoàn thiện sửa/ẩn câu hỏi, lịch sử phiên bản, nhập CSV và Word `.docx` theo mẫu có tải mẫu/xem trước/xác nhận. Đã bổ sung hoạt động nhóm: yêu cầu văn bản/Word, chia ngẫu nhiên, đại diện, nộp sản phẩm, hạn nộp, gia hạn và lịch sử. Chưa hoàn thành toàn bộ đề án, chưa triển khai một website công khai và chưa nghiệm thu với lớp học thật.

Theo yêu cầu hiện tại, đã dừng bản demo. Khi phát triển, kiểm thử có thể dùng server và database tạm riêng; không chạy lại demo hay triển khai hosting.

| Phân hệ trong đề án          | Trạng thái                                                                                 | Phần còn thiếu                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Tài khoản giáo viên/học sinh | Đã có đăng nhập, phân quyền, đổi mật khẩu tạm và giáo viên cấp lại mật khẩu                | Hoàn thiện vận hành tài khoản và quản lý học sinh tham gia nhiều lớp                                 |
| Ngân hàng câu hỏi            | Đã có phiên bản, ẩn/hiện, lịch sử và nhập Word/CSV theo mẫu, xem trước/xác nhận            | Học kỳ, ma trận/trộn đề, tự tách Word bố cục bất kỳ/PDF và nhập `.xlsx`                              |
| Luyện tập và cây             | Đã có luyện tập theo bài/chương, cây 5 cấp và thời gian theo hoạt động                     | Ôn kỳ, trộn theo ma trận; đánh giá bằng lớp học thật                                                 |
| Sổ tay sửa sai               | Đã có lưu câu sai từ luyện tập, làm lại và đánh dấu khắc phục                              | Nhận câu sai từ các chế độ kiểm tra sau khi xây dựng phòng thi                                       |
| Dashboard và xuất dữ liệu    | Đã có báo cáo thời gian, luyện tập, cây, câu còn sai và CSV                                | Excel `.xlsx`, điểm thi và điểm thưởng/nhóm                                                          |
| Khu vườn của lớp             | Đã bổ sung cây cấp 5 của thành viên trong lớp                                              | Màn hình so sánh nhiều lớp nếu cần; hiện giáo viên đổi lớp để xem                                    |
| Xếp hạng chăm chỉ            | Đã bổ sung xếp hạng thời gian/cây và bảng sửa sai                                          | Đánh giá trải nghiệm vinh danh với giáo viên/học sinh thật                                           |
| Vé và kiểm tra 20 phút       | Chưa triển khai                                                                            | Điều kiện mở khóa, vé cấp theo mốc cây, đề thi, thời hạn server, lưu đáp án, chấm điểm và chuyển tab |
| Săn điểm và thi chính thức   | Chưa triển khai                                                                            | Giới hạn lượt thi, lịch thi, mở đề theo lớp, thu bài, báo cáo điểm và giáo viên duyệt điểm cộng      |
| Green Points/đổi thưởng      | Chưa triển khai                                                                            | Sổ giao dịch điểm, cấp điểm một lần theo điều kiện, danh mục quà, yêu cầu và phê duyệt               |
| Hoạt động nhóm               | Đã có tạo hoạt động, yêu cầu Word, chia nhóm, đại diện, nộp file/link, deadline và gia hạn | Phản biện chéo, chấm điểm/điểm thưởng và điều chỉnh thành viên sau khi chốt nhóm                     |
| Trợ lý AI                    | Chưa triển khai                                                                            | Kích hoạt sau nhiều lần sai, gợi ý từng bước, bài tương tự, nhà cung cấp và cấu hình sử dụng         |
| Vận hành chính thức          | Chưa triển khai                                                                            | Hosting/HTTPS, lưu trữ, sao lưu/khôi phục, giám sát và kiểm thử tải                                  |

## Các bước còn lại theo thứ tự đề xuất

1. **Hoàn thiện bộ đề và nội dung:** phiên bản, ẩn/hiện và nhập Word/CSV theo mẫu đã hoàn thành; tiếp theo bổ sung cấu trúc học kỳ, ma trận và cách chọn/trộn câu. Tự tách Word có bố cục bất kỳ, nhập PDF hoặc `.xlsx` là phần riêng. Mục tiêu: giáo viên chuẩn bị được nội dung đủ cho lớp học thật.
2. **Xây dựng kiểm tra 20 phút:** chốt quy tắc mở khóa/vé và chuyển tab, lưu đề cố định cho từng lượt, đáp án tự lưu, thời hạn tính từ server, thu/chấm bài và xử lý mất mạng. Mục tiêu: làm và nộp bài đúng một lần, không mất đáp án khi tải lại trang.
3. **Bổ sung Săn điểm, thi chính thức và thưởng:** lịch thi theo lớp, giới hạn lượt, lưu điểm từng lần, sổ điểm thưởng và giáo viên phê duyệt. Mục tiêu: mọi cấp/đổi điểm có lịch sử và không ghi trùng; app không tự ghi điểm vào sổ học bạ.
4. **Hoạt động nhóm:** đã hoàn thành chia ngẫu nhiên, đại diện nộp Word/PDF/PowerPoint hoặc link, giới hạn deadline và gia hạn có lịch sử. Tiếp theo bổ sung phản biện chéo, chấm điểm và thưởng; điều chỉnh nhóm sau khi chốt nếu cần. Mục tiêu: phân quyền đúng nhóm và mọi bài nộp/đánh giá có lịch sử.
5. **Báo cáo đầy đủ và AI:** xuất Excel theo các phân hệ đã có; bổ sung AI khi có cấu hình dịch vụ phù hợp. Mục tiêu: trợ giúp theo kiến thức và gợi ý, không trả đáp án ngay.
6. **Nghiệm thu và dùng thử:** kiểm thử các luồng toàn hệ thống, khả năng truy cập trên điện thoại, mất mạng, phân quyền và tải; thử với một lớp và sửa theo phản hồi.
7. **Triển khai khi người dùng cần:** chọn hosting, thiết lập HTTPS và database/lưu trữ bền vững, sao lưu/khôi phục, vận hành tài khoản và giám sát. Đây là bước riêng sau phát triển; hiện chưa yêu cầu tài khoản hosting.

## Quy tắc của vườn lớp và xếp hạng hiện tại

- Vườn lớp hiển thị một cây cho mỗi cặp học sinh/chương có ít nhất 14.400 giây đã ghi nhận. Cây cá nhân vẫn tồn tại. Hiển thị từ dữ liệu tiến độ nên cập nhật/tải lại không tạo cây trùng.
- Chỉ tính dữ liệu chương thuộc lớp đang chọn và học sinh hiện là thành viên. Giáo viên chỉ xem lớp mình sở hữu; học sinh chỉ xem lớp mình tham gia.
- Xếp hạng chăm vườn: thời gian học giảm dần, sau đó số cây cấp 5 giảm dần. Cùng cả hai chỉ số thì đồng hạng; tên chỉ để giữ thứ tự hiển thị ổn định. Dùng hạng 1, 1, 3 khi hai người dẫn đầu bằng nhau.
- Bảng “Bác sĩ cây trồng”: số câu hiện đã khắc phục giảm dần, cùng số câu thì đồng hạng. Một câu chỉ tính một lần; nếu làm sai lại, câu đó không còn được tính đến khi khắc phục lại. Đây không phải tổng số lượt gửi đáp án sửa sai.
- Chưa có hoạt động thì chưa xếp hạng hoặc tạo cây mẫu. Không dùng điểm số làm tiêu chí; không trả email, mật khẩu, đáp án hay chi tiết lỗi sai cá nhân qua API cộng đồng.
- Các bảng tính trong phạm vi lớp, lũy kế theo dữ liệu hiện có. Chưa có xếp hạng tuần/tháng hoặc xếp hạng công khai giữa mọi lớp.

## Các điểm cần chốt trước giai đoạn kiểm tra

- Tài liệu ghi “quá 3 lần cảnh báo” ở mục 4.2, nhưng bảng tổng hợp ghi “chuyển tab quá 2 lần”: cần chọn tự nộp ở lần thứ 4 hay thứ 3.
- Tỷ lệ 70% có bao gồm sửa sai theo tài liệu. Cần chốt tính theo mọi lượt trả lời hay theo kết quả từng câu, và sổ tay phải sạch trong chương hay toàn bộ tài khoản. Tỷ lệ luyện tập của MVP hiện chỉ tính lượt luyện tập; chưa dùng để cấp vé.
- Cần chốt thời điểm cấp vé khi cây lên mốc mới nhưng các điều kiện khác chưa đạt, thời điểm trừ vé và cách xử lý lượt thi bị gián đoạn.
- Cần chốt trần điểm cộng, việc cộng dồn thưởng 4 giờ và thưởng thi, cùng thời điểm giáo viên phê duyệt/quy đổi.
- Thi chính thức cần xác định cửa sổ vào thi, xử lý vào muộn/mất mạng, thời điểm mở đáp án và quyền sửa/kết luận điểm.
- Tệp yêu cầu nhóm nhận Word `.docx` tối đa 5 MB; sản phẩm Word/PDF/PowerPoint tối đa 10 MB mỗi lần hoặc link. Chưa có hạn ngạch tổng dung lượng. Nhà cung cấp AI sẽ được xác định khi đến phân hệ tương ứng; hiện chưa yêu cầu khóa dịch vụ hay tài khoản hosting.

## Lưu trữ và kiểm thử

Quy tắc ngân hàng câu hỏi được ghi trong [question-bank.md](question-bank.md).

Hướng dẫn, giới hạn và quy tắc hoạt động nhóm được ghi trong [group-activities.md](group-activities.md). File gốc và sản phẩm lưu trong cùng database; sao lưu database bao gồm cả file.

Mã nguồn được quản lý tại [phuocthan/SangKienKn](https://github.com/phuocthan/SangKienKn), nhánh `main`. Để chạy phiên bản hiện tại trên Windows, pull mã nguồn và làm theo [hướng dẫn local trong README](../README.md#chạy-local-trên-windows). Các kiểm thử sử dụng database riêng; database demo và thư viện cài đặt không được đưa lên Git. Gói demo Windows đã gửi trước đó chứa phiên bản trước đợt bổ sung cộng đồng này; dùng mã nguồn trên Git để nhận các tính năng mới.

Kết quả kiểm thử sau đợt bổ sung hoạt động nhóm:

- `npm test`: 31/31 kiểm thử đạt. Giữ các kiểm tra ngân hàng câu hỏi, luyện tập, cộng đồng và migration; thêm chia nhóm cân bằng/cố định, Word tiếng Việt/bảng/xuống dòng, file hỏng/quá lớn, phân quyền lớp/nhóm, đổi đại diện, học sinh vào/rời lớp, đúng thời điểm hết hạn, gửi lại sau hết hạn, gia hạn và xung đột chỉnh sửa, lịch sử phiên bản/file/link, chống gửi khác nguồn và giữ dữ liệu qua khởi động lại.
- `npm run test:e2e`: 14/14 kiểm thử trình duyệt đạt trên desktop và mobile. Giữ các luồng Word/CSV, sửa câu hỏi, sổ tay, cây và cộng đồng. Thêm giáo viên tạo hoạt động với Word, tải bản gốc, đổi đại diện; học sinh nộp PDF, mất phản hồi rồi gửi lại không tạo bản trùng, nộp Canva, tải lại giữ lịch sử; giáo viên xem/tải bài, gia hạn mở lại form dù đồng hồ thiết bị học sinh sai. Các luồng nghiệp vụ chạy với API thật; fixture trình bày cộng đồng không tạo tiến độ giả trong dữ liệu demo.
- `npm run build`: kiểm tra TypeScript và build Vite đạt.

Chưa kiểm thử tải hoặc nghiệm thu với lớp học thật. Các server kiểm thử đã tự dừng sau khi hoàn tất; demo vẫn được giữ ở trạng thái dừng theo yêu cầu.
