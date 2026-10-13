# Cấp độ ôn tập và kiểm tra

## Quyết định mới: rời phiên học thay vì đăng xuất — 13/10/2026

Trong luyện bài/chương, ôn, sửa sai, rời tab/mất focus, timer gián đoạn do ngủ máy hoặc không tương tác đủ120 giây kết thúc phiên ngay, về trang chính và hiện popup. Giữ cookie/tài khoản; không ghi thời gian vắng mặt, stop active:false. Backend khi phiên hết hạn xóa phiên mà không ghi thêm phần đuôi chưa được xác nhận. Cảnh báo từ105 giây đổi thành kết thúc phiên. Phòng thi vẫn có xử lý rời tab theo ngưỡng và deadline riêng; idle rời giao diện chứ không đăng xuất. Quyết định này thay câu “đăng xuất120 giây” phía dưới.

Giáo viên xem đáp án sai cũ của từng câu trong sổ tay từ lịch sử attempts và bài thi đã công bố. Sổ tay học sinh tiếp tục chỉ hiển thị câu cần sửa, không cung cấp lịch sử đáp án sai. Giao diện vườn/xếp hạng gộp dưới Khu vườn của lớp; API tính hạng giữ nguyên.

## Quyết định hiện hành: thời gian thực và nhiều dạng câu — 13/10/2026

Thời gian cây chỉ phát sinh trong luyện bài/chương, ôn và sửa sai, theo chapterId của câu hiện tại; phòng thi và các trang khác không tính. Start kiểm tra liên kết questionId/chương khi client gửi. Blur/hidden pause ngay, cần Tiếp tục học; timer bị gián đoạn/ngủ máy không cộng bù. Sau105 giây không tương tác cảnh báo,120 giây đăng xuất, kể cả offline và không tự login lại khi reload. Quyết định mới thay cửa sổ120→130/pause trong phần lịch sử. Heartbeat/stop lấy giờ server, gap>30 giây không cộng, activity120 giây/phiên hết hạn không hồi sinh; stop khi đã pause không cộng phần đuôi.

Đúng/sai2–4 ý và trả lời ngắn dùng cùng luồng luyện/review/correction/exam snapshot. Đúng/sai cần đủ ý, chấm cả câu và phản hồi từng ý; ngắn so khớp văn bản/số chuẩn hóa. Lời giải luyện/ôn/sửa sai mở khi đúng; thi vẫn công bố theo lịch. Draft ngắn/ý chưa chọn lưu qua reload và không được tính là câu đã hoàn thành. Làm lại bài cuối luyện/ôn tạo vòng mới/id mới cho review, giữ lịch sử cũ và requestId chống retry lặp.

Giáo viên xem sổ tay học sinh từ roster, lọc đúng lớp/chương/trạng thái và xem phiên bản gốc; API không cho giáo viên khác/học sinh truy cập. Số câu đã làm trong roster/CSV là câu practice riêng biệt, tỷ lệ/điều kiện dùng lượt như trước. Không chỉnh lại giờ đã lưu trên Railway khi thiếu chứng cứ. Trạng thái triển khai/QA mới ở session-handoff; phần130 giây/gap focus trong báo cáo cũ là lịch sử đã được thay ở phạm vi này.

Cập nhật 11/10/2026. Kế hoạch và phạm vi: [learning-implementation-plan.md](learning-implementation-plan.md). Thiết kế: [app-design.md](app-design.md).

**Bổ sung 12/10/2026:** có chế độ **Kiểm tra online cả lớp**. Giáo viên chuẩn bị nguồn/ngân hàng/nhiều chương-bài, cài X phút chờ và Y phút làm bài. Bấm bắt đầu chốt đề chung và thông báo trong ứng dụng, giờ thi thật T+X, hạn chung T+X+Y. Câu đảo riêng mỗi học sinh/giữ qua reload, vào muộn không được cộng giờ. Chi tiết và trạng thái triển khai tại [online-exams.md](online-exams.md); thời lượng20 phút phía dưới chỉ còn áp dụng Săn điểm/thi theo lịch cũ.

Rà soát quy định vi phạm/xử lý học sinh: [violations-audit.md](violations-audit.md). Cơ chế chính đã có, nhưng đã tái hiện lỗi 4 lần rời tab khi offline vẫn nhận đáp án chọn sau ngưỡng; chỉ theo dõi hidden, chưa mất focus khi trang visible; AI sai lặp lại chưa có. Ca idle mobile mô phỏng chưa đạt, cần kiểm tra thiết bị thật. Đây là kết quả audit, chưa sửa runtime/triển khai các khoảng trống đó.

**Thay đổi mới nhất:** giáo viên đặt thời gian mỗi cấp theo lớp/môn tại Ôn tập & kiểm tra, mặc định 60 phút. Nếu đặt m phút, Cây Non/cấp 3 cần 2m phút trong chương, vé cấp 3/4/5 ở 2m/3m/4m, điểm Kết Trái ở 4m. Các mốc 2/3/4 giờ trong tài liệu phía dưới là mặc định 60 phút. Tỷ lệ đúng 70%, sửa sai, quyền mở chương, thời gian thi 20 phút và điểm thi không đổi. Khi đổi mốc giữ progress, vé/điểm lịch sử; không tự cấp trùng. Chi tiết [student-levels.md](student-levels.md).

## Quyền kiểm tra theo chương

Mặc định mọi chương khóa kiểm tra, kể cả học sinh đã đủ điều kiện thời gian. Giáo viên sở hữu lớp mở Ôn tập & kiểm tra → Quyền kiểm tra theo chương → Mở kiểm tra ở chương lớp đã học/ôn đến. Quyền áp dụng cho toàn bộ học sinh của đúng chương/lớp, lưu qua restart; học sinh và giáo viên khác không thay đổi được.

Săn điểm cần được mở **và** đủ các điều kiện cá nhân dưới đây. Kiểm tra chính thức nhiều chương cần mọi chương có câu trong đề được mở, bài enabled và trong khung giờ; giữ quy tắc không cần vé/điều kiện tự học. Học sinh thấy chương đang chờ giáo viên cho phép; server kiểm tra lại lúc bắt đầu, không chỉ khóa nút. Ôn tập vẫn sử dụng bình thường.

Khóa kiểm tra ngăn lượt mới và không hủy bài đang làm, mất đáp án hoặc dùng thêm vé khi tiếp tục/gửi lại. Đóng bài thi chính thức vẫn là thao tác riêng để thu bài. Migration thêm chapter_exam_access, không thay dữ liệu học cũ; chương không có quyền được coi là khóa.

Trạng thái triển khai 11/10/2026: đã triển khai trong mã và kiểm thử độc lập, **chưa deploy backend Railway**. Frontend local hiện chờ API mới để sử dụng điều khiển.

## Cách sử dụng

Giáo viên tạo kiểm tra có hai nguồn: ngân hàng câu hỏi (một/nhiều chương, toàn bộ bài hoặc từng bài; số câu/trọng số phải đủ ngân hàng) và Word/CSV theo mẫu có đáp án. Có thể tải nhiều file, gắn mỗi file vào chương đã chọn. Đề tải lên tối đa 100 câu, kiểm tra toàn bộ trước khi lưu, chặn câu trùng trong cùng chương; câu riêng lưu ẩn để chấm/sổ tay, không tự phát hành cho luyện tập. Lưu đề có requestId chống tạo lặp khi retry, transaction giữ đề/câu atomically.

Mặc định đề mới ở trạng thái đóng chờ giáo viên. **Mở kiểm tra ngay** bật đề, đưa giờ bắt đầu về hiện tại nếu đang ở tương lai và cho phép những chương thực sự có trong đề; giữ giờ đóng đã chọn. Chỉ giáo viên sở hữu lớp được mở, không mở lại đề đã hết giờ. Kiểm tra chính thức không yêu cầu thời gian tự học/vé; học sinh có thể vào khi giáo viên yêu cầu. Có thể chọn chế độ theo lịch thay mở thủ công; vẫn cần các chương được cho phép. Đóng bài thi vẫn thu bài đang làm theo quy tắc cũ.

Luyện tập và ôn tập chỉ trả correctIndex/lời giải khi trả lời đúng. Trả lời sai, retry và tải lại phiên cũ đều lọc thông tin tiết lộ; lời nhắc chung không chứa đáp án. Công bố kết quả thi chính thức sau đóng khung thi giữ nguyên.

Clock phiên có số giây tạm tính ở frontend và số giây API heartbeat đã ghi nhận riêng; không thay thời gian server hoặc giả tiến độ. Cấp hiển thị theo từng chương, xem [student-levels.md](student-levels.md).

Giáo viên mở **Ôn tập & kiểm tra**, gắn học kỳ cho từng chương. Mặc định tỷ lệ mở Săn điểm tính tất cả lượt luyện tập và sửa sai theo lựa chọn của người dùng. Có thể tạo bộ ôn hoặc thi chính thức, chọn chương, số câu và trọng số bài. Trọng số được chia theo tỷ lệ, làm tròn bằng phần dư lớn nhất. Không đủ câu thì báo thiếu; không nhân bản câu. Để trống trọng số chọn ngẫu nhiên trong phạm vi đã chọn.

Học sinh dùng Luyện tập để học từng bài; dùng **Ôn tập & kiểm tra** để ôn chương, nhiều chương hoặc toàn học kỳ, hoặc chọn ma trận giáo viên đã lưu. Bộ câu được trộn và giữ nguyên trong phiên; trả lời/vị trí được lưu. Sau tải lại, bấm **Tiếp tục ôn**. Đổi chương trong phiên ôn kỳ thì thời gian tính đúng chương của câu hiện tại.

Sổ tay nhận câu sai từ luyện tập/ôn/thi. Khi sửa vẫn sai, chỉ nhận thông báo tự làm lại; đáp án và lời giải mở khi sửa đúng. Thời gian học chỉ tính hoạt động có tương tác, theo quy tắc idle hiện có.

## Vé và điểm

| Mốc chương | Cấp cây | Quyền lợi một lần       |
| ---------- | ------- | ----------------------- |
| 0 giờ      | 1       | Bắt đầu chương          |
| 1 giờ      | 2       | Nảy mầm                 |
| 2 giờ      | 3       | Vé Săn điểm thứ nhất    |
| 3 giờ      | 4       | Vé thứ hai              |
| 4 giờ      | 5       | Vé thứ ba và 1 điểm cây |

Vé cấp theo thời gian đã ghi nhận, tối đa 3/chương, không cấp lại khi tải lại hoặc deploy. Dữ liệu tiến độ cũ được xét để nhận các mốc đã đạt. Săn điểm cần >=2 giờ, đúng >=70% **mọi lượt luyện tập và sửa sai**, sổ tay sạch trong chương và còn vé. Vé dùng khi tạo lượt; tải lại/tiếp tục không trừ thêm. Mỗi lượt Săn điểm đạt >=8,0 nhận 1 điểm, gửi giáo viên duyệt; không tự ghi sổ học bạ.

## Phòng thi

Săn điểm/thi theo lịch: mỗi lượt tối đa20 phút từ giờ server, kết thúc sớm hơn nếu khung thi đóng. **Kiểm tra online cả lớp**: Y phút từ giờ mở chung sau thời gian chuẩn bị X, học sinh vào muộn dùng phần còn lại. Thi chính thức không yêu cầu vé hoặc điều kiện tự học. Cả lớp có cùng tập câu, thứ tự trộn theo lượt. Mỗi học sinh có một lượt/bài chính thức và chỉ một bài đang làm trên toàn tài khoản.

Đáp án tự lưu có phiên bản, không trả đáp án đúng khi đang làm. Tải lại URL phòng thi tiếp tục cùng lượt. Khi mất mạng, thay đổi chưa gửi lưu trên trình duyệt hiện tại và tự thử lại khi kết nối trở lại; các đáp án chưa tới server trước hạn không được chấm. Đồng hồ thiết bị không quyết định thời hạn. Server tự thu bài ngay cả khi trình duyệt đóng, hoặc thu các lượt hết hạn lúc server khởi động lại.

Mỗi lần tab bị ẩn ghi một sự kiện riêng, gửi lại không đếm trùng. **Lần thứ 4 tự nộp**, giáo viên cấu hình được từ 1–10 khi tạo thi chính thức. Đây là cảnh báo dựa trên tín hiệu trình duyệt, chưa phải cơ chế chống gian lận được nghiệm thu.

Săn điểm công bố kết quả/lời giải và cập nhật sổ tay sau nộp. Thi chính thức công bố điểm, đáp án và cập nhật câu sai khi khung thi đóng hoặc giáo viên đóng bài. **Quyết định mới 12/10/2026:** học sinh đã nộp bài được ôn/luyện/sửa sai và tính giờ ngay, kể cả tự nộp do rời tab và buổi lớp còn mở; chỉ bài đang active khóa các API này. Quyết định thay quy tắc chờ đóng buổi để ôn trước đây, không mở lại lượt hoặc công bố sớm kết quả thi. Cần triển khai backend Railway mới để có hiệu lực. Giáo viên xem trạng thái/lượt thi, đóng bài để thu các lượt đang làm và duyệt hoặc từ chối điểm thưởng.

## Báo cáo và giới hạn phạm vi

Xuất Excel gồm học sinh/email, thời gian học, trung bình các lượt thi chính thức đã nộp, số lượt Săn điểm, điểm Săn điểm/điểm cây và tổng điểm đã duyệt. Họ tên/email là ô văn bản, không được thực thi thành công thức. Danh sách lượt lưu từng điểm và cảnh báo, lọc theo quyền lớp/tài khoản.

Phạm vi này chưa gồm chấm/điểm thưởng hoạt động nhóm, phản biện chéo, đổi quà Green Points, AI, tự phân loại tài liệu Word bất kỳ hoặc nghiệm thu tải với lớp thật. Các phần đó tiếp tục nằm trong lộ trình chung, không được tính vào điểm trong báo cáo này.

Migration thêm bảng, không đổi mật khẩu hoặc mất tiến độ cũ. Kiểm thử dùng SQLite riêng. Không seed dữ liệu thử vào database đang chạy.
