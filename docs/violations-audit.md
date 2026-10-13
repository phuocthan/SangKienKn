# Đối chiếu quy định ôn tập và kiểm tra GreenEdu

## Cập nhật xử lý theo yêu cầu mới — 13/10/2026

Đã sửa trong mã: Practice pause khi hidden/blur/gián đoạn timer, không cộng bù sau sleep; cảnh báo105s và đăng xuất120s không tương tác kể cả offline. Backend chặn hồi sinh idle/không cộng gap hoặc stop inactive; thời gian chỉ gắn bài/câu/chương đang làm. ExamRoom dedup blur+hidden cho một lần rời, cảnh báo rõ, khóa chọn ngay tại ngưỡng cả offline và đồng bộ draft có trước ngưỡng rồi nộp. Giữ ngưỡng4 hoặc cấu hình1–10; không tự thêm hình phạt/hoàn vé. Website không thể cấm mở tab ở cấp hệ điều hành, xử lý bằng focus/visibility.

QA mới đạt backend và trình duyệt riêng: blur→hidden không tăng đôi, offline4 lần khóa/đáp án sau ngưỡng không nhập, reload lưu warnings; idle105→120/offline/reload yêu cầu login, gap sleep không catch-up; API questionId khác chương bị từ chối và không cộng giờ chương khác. Kết quả đầy đủ/triển khai ở session-handoff. Các gap offline/focus/idle bên dưới là lịch sử trước sửa; nhật ký chi tiết sự kiện/ngoại lệ giáo viên và AI sai lặp lại vẫn chưa triển khai. Không coi QA mô phỏng là nghiệm thu thiết bị thật hoặc Railway.

Ngày kiểm tra: 11/10/2026. Kết luận: cơ chế chính đã có trong mã, nhưng **chưa đầy đủ ở tình huống mất mạng/rời cửa sổ và hỗ trợ học sinh sai nhiều lần**. Đây là báo cáo kiểm tra, không thay đổi quy chế, code runtime hoặc dữ liệu học sinh.

## Nguồn và phạm vi

Đối chiếu bản trích [đề án](requirements-original.md), đồng thời đọc trực tiếp `word/document.xml` của file người dùng `ĐỀ ÁN HOÀN THIỆN TÍNH NĂNG app greenedu (1).docx` trong Downloads; các đoạn về 2 phút/10 giây, cảnh báo tab, sổ tay và AI khớp. File là nguồn yêu cầu sản phẩm, không cấp quyền vận hành/deploy.

Đề án có mâu thuẫn: mục 4.2 ghi quá 3 cảnh báo (nộp ở lần 4), bảng cuối ghi chuyển tab quá 2 lần. Quyết định của người dùng **tự nộp ở lần thứ 4** là quy tắc áp dụng. Giáo viên được cấu hình ngưỡng thi chính thức 1–10 theo quyết định đã chốt ở session trước.

Ôn tập/luyện tập/sửa sai và Săn điểm/thi chính thức là hai luồng khác nhau. Quy tắc rời tab tự nộp thuộc phòng kiểm tra, không phải mọi phiên ôn. Trả lời sai là vấn đề học tập, không tự coi là gian lận. Đề án không quy định trừ điểm kỷ luật, khóa tài khoản, xóa tiến độ hoặc phạt học sinh khi mất mạng.

Kiểm tra mã checkout, test trên SQLite/E2E riêng, không thử vi phạm bằng tài khoản thật Railway. Local 5173 vẫn dùng API Railway; những thay đổi backend đã ghi là chưa deploy (gate chương/members/ẩn lời giải ở backend…) không thể coi đã có hiệu lực production chỉ từ test checkout.

## Đối chiếu và hướng xử lý học sinh

| Tình huống | Thiết kế/quyết định đã chốt | Mã hiện tại | Xử lý đúng phạm vi |
| --- | --- | --- | --- |
| Ôn tập không tương tác 2 phút | Cảnh báo đếm ngược 10 giây, rồi treo tính giờ | Có banner ở 120 giây, pause ở 130, khóa chọn đáp án khi pause, nút Tiếp tục học; backend/desktop đã xác nhận, ca mô phỏng mobile chưa đạt | Không tính thời gian treo; tiếp tục khi học sinh bấm nút; không kỷ luật. Kiểm tra cảnh báo trên điện thoại thật trước nghiệm thu |
| Ẩn tab khi đang ôn | Chỉ ghi thời gian khi app mở/có hoạt động | UI pause hiển thị, heartbeat server không cộng đoạn ẩn; bỏ khoảng mất kết nối >30 giây; một phiên tính giờ trên tài khoản | Dừng cộng thời gian, trở lại tiếp tục; không tự nộp phiên ôn |
| Sai câu/làm lại | Tự lưu sổ tay; làm đúng lại mới khắc phục; chưa sạch thì chưa mở Săn điểm | Có ở practice/review; retry không nhân đôi, practice trả đúng không tự xóa câu cần sửa; tỷ lệ tính mọi lượt và sửa sai | Học sinh tự làm lại; chưa hiện đáp án/lời giải khi sai theo yêu cầu mới |
| Sai cùng câu quá 2 lần | Hiện Thần Rừng, gợi kiến thức/câu dễ tương tự, không cho đáp án ngay | **Chưa có AI hoặc luồng hỗ trợ theo số lần sai** | Bổ sung trợ giúp học tập sau lần sai thứ 3; không gọi là vi phạm/kỷ luật |
| Rời tab phòng kiểm tra khi có mạng | Cảnh báo; lần thứ 4 thu/khóa bài | Có visibilitychange; server lưu eventId chống đếm trùng, giữ qua reload; threshold finalize reason=tabs, không nhận sửa bài sau nộp | Lần 1–3 nhắc quay lại; lần 4 nộp đáp án đã lưu và khóa lượt đó |
| Hết 20 phút/giáo viên đóng bài | Tự thu và chấm phần đã làm | Có deadline server, worker 1 giây/khởi động lại; sau hạn không nhận ghi đáp án; teacher close thu lượt đang làm | Khóa/nộp theo server, không bù thời gian mất mạng vào bài thi |
| Rời tab 4 lần khi mất mạng | Đề án yêu cầu nộp/khóa ở ngưỡng | **Lỗ hổng đã tái hiện:** event chờ localStorage, UI vẫn cho chọn đáp án; khi online, sync gửi đáp án trước event, đáp án chọn sau lần 4 vẫn vào bài đã nộp | Ưu tiên khóa bài ngay ở ngưỡng local, đóng băng đáp án và đồng bộ trạng thái; xử lý thứ tự sự kiện/đáp án tại server, không cho chèn đáp án sau ngưỡng |
| Rời sang cửa sổ khác nhưng trang vẫn visible | “Thoát app/chuyển tab” trong đề án | **Chưa bao phủ:** chỉ visibilitychange, không bắt blur; beforeunload chỉ nhắc rời trang, không ghi thêm vi phạm | Bổ sung ghi nhận mất focus/lifecycle có phân loại, debounce/dedup; không cộng đôi blur + hidden cho cùng lần rời và không tự coi mọi blur là gian lận |
| Giáo viên xem/can thiệp | Theo dõi lượt thi, thời gian và duyệt điểm | Có tổng số lần rời tab/trạng thái, xem bài/đóng bài; chưa có màn nhật ký chi tiết, lý do thiết bị hay xác nhận ngoại lệ | Cho giáo viên xem loại sự kiện/thời điểm/mất mạng và quyết định ngoại lệ; không tự mở lượt mới hoặc hoàn vé không có quy tắc |

### Những khác biệt nhỏ hoặc cần chốt

- Khi đang cảnh báo 10 giây, tương tác thật (scroll/click/key) cũng hủy cảnh báo; đề án mô tả bấm Tiếp tục. Sau khi đã pause thì chỉ nút Tiếp tục học mở lại. Đây là khác biệt UX nhỏ cần thống nhất nếu muốn theo đúng chữ của đề án.
- Cảnh báo rời tab hiện là bộ đếm trong info-panel. Chưa có popup/nhắc nổi mỗi lần trở lại, và số pending/offline chưa được cộng vào bộ đếm đã nhận của server.
- Mã thi Săn điểm vẫn tạo thưởng khi điểm >=8 kể cả reason=tabs, sau đó giáo viên duyệt. Đề án chỉ nói thu/khóa bài, không nói mất quyền thưởng; đây là **điểm cần quyết định**, không kết luận lỗi và không tự thêm hình phạt.
- Tín hiệu active/interacted của heartbeat do trình duyệt gửi, isTrusted chỉ kiểm tra UI; server tự tính giây nhưng không thể chứng minh người học tương tác thật nếu client bị sửa. Đây là giới hạn mức chống gian lận hiện tại, không phải bằng chứng học sinh gian lận.

## Bằng chứng trong mã

- [Practice.tsx](../src/Practice.tsx): 120/130 giây, tương tác trusted, visibility/offline và nút resume; dùng chung cho ôn tập qua reviewId.
- [server/app.ts](../server/app.ts): heartbeat/stop lấy giờ server, giới hạn activity 130 giây/đứt kết nối 30 giây; attempts/corrections.
- [Learning.tsx](../src/Learning.tsx): ExamRoom/sync gửi dirty answers trước tabs; localStorage giữ queue, choice disabled chưa xét số tabs pending; chỉ visibilitychange ghi cảnh báo, beforeunload nhắc thoát.
- [server/learning.ts](../server/learning.ts): exam_tab_events, finalize/sweep, khóa lượt sau nộp, sổ tay công bố theo thời điểm, thưởng >=8 và phê duyệt.
- [server/index.ts](../server/index.ts): worker tự thu bài quá hạn.

## Kiểm thử mới và ưu tiên xử lý

Chạy lại **9/9 backend liên quan đạt**: giờ server/ẩn tab/idle, sổ tay/không lộ đáp án, điều kiện/mốc vé, deadline/chống ghi sau hạn, 4 cảnh báo/không đếm retry, quyền duyệt thưởng. Các test này xác nhận những phần đã có, không chứng minh hệ thống chống gian lận đã hoàn chỉnh.

Ca trình duyệt riêng `.local/violations-audit.spec.ts`/config 3187/build mới `.local/violations-audit-build`: ôn 120→130→Tiếp tục; kiểm tra online 1→reload→4→khóa; offline 4 lần vẫn chọn thêm rồi đáp án được lưu trước tự nộp; blur trong trang visible không có cảnh báo nhưng hidden có. Kết quả lượt cuối toàn bộ **7 đạt/1 chưa đạt**: desktop idle đạt; online/offline/blur đều tái hiện được trên desktop/mobile; mobile idle không tìm thấy banner đếm ngược trong khoảng mô phỏng. Đã thử cài clock trước khi tạo timer, chờ study/start và xét chu kỳ timer 1 giây, ca mobile vẫn chưa đạt. Chưa đủ bằng chứng kết luận nguyên nhân là app hay mô phỏng/timing, không ghi thành lỗi đã chắc hoặc ca đã đạt. Cần kiểm tra trên điện thoại thật; kết quả/trace giữ trong `.local/violations-audit-confirmed-results` và `.local/violations-idle-boundary-results`.

Các ca “audit gap” chủ động xác nhận hành vi thiếu hiện tại, **không phải các ca nghiệm thu đã sửa lỗi**. Các phiên kiểm thử không ghi DB thật hoặc deploy. Phần docx chỉ đọc XML để đối chiếu chữ, không tạo/sửa/xuất Word.

Ưu tiên 1: chốt/khắc phục khóa ngưỡng khi offline và thứ tự đồng bộ đáp án–sự kiện. Ưu tiên 2: nhật ký có loại/timestamp, cảnh báo rõ và phân loại rời cửa sổ để giáo viên kiểm tra ngoại lệ. Ưu tiên 3: hỗ trợ Thần Rừng/sai lặp lại và thống nhất nút Tiếp tục trong thời gian cảnh báo. Kiểm tra lại production sau khi deploy API liên quan, dùng tài khoản test được chỉ định và không áp chế độ phạt ngoài quy định.
