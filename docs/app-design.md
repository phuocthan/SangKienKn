# Thiết kế giao diện GreenEdu

## Hiện hành: tab điều hướng portrait không cuộn — 13/10/2026

Dock đáy trong portrait có một hàng flex rộng đúng viewport: icon mọi điểm đến đều nhìn thấy, không kéo ngang. Mục đang chọn có icon/chữ và nền sáng gọn hơn; tất cả tab cao64px cùng trục, không nâng lên. Chuyển độ rộng/màu/nền trong220ms, tắt khi reduced-motion. Mục còn lại chỉ icon trên nền xanh. Nhãn button luôn ở aria-label dù chữ bị ẩn; badge sửa sai đặt dưới icon khi mục chưa chọn. Khoảng đệm đáy nội dung và header sticky giữ nguyên. CSS chỉ áp dụng media portrait≤1100px. Heading Hoạt động nhóm không hiện minh họa ở landscape và không chừa cột ảnh; portrait vẫn giữ hình.

## Hiện hành: sidebar nới rộng và icon cấp theo chương — 13/10/2026

Menu trái desktop nới nhẹ để logo/chữ/note thoáng hơn; main-shell dịch tương ứng, giữ khoảng cách 24px giữa menu và nội dung. Các breakpoint landscape nhỏ nới 12px; dock portrait giữ cấu hình cũ. Trang Khu vườn của tôi bỏ thẻ CẤP ĐỘ CỦA BẠN trùng Hành trình của tôi. Roster giáo viên và bảng xếp hạng trong vườn lớp dùng icon cấp thuần hình, phân cách vạch dọc theo thứ tự chương; nhãn chương/cấp vẫn có ở tooltip và aria-label. Thẻ cấp trong Tài khoản và timeline hành trình vẫn đầy đủ chữ.

## Hiện hành: gộp hành trình vào vườn cá nhân — 13/10/2026

Học sinh vào Khu vườn của tôi thấy phần Hành trình của tôi ở cuối trang, sau những mầm xanh và thẻ cấp độ. Bỏ tab con Hành trình; nút Xem hành trình trong hero cuộn tới phần này. Chỉ một h1 đầu trang; section dùng tiêu đề h2 và timeline chương cũ. URL progress cũ chuyển về home. Quyết định thay mô tả tab home2 mục phía dưới.

## Hiện hành: thông báo kết thúc phiên và vườn lớp một trang — 13/10/2026

Trong luyện/ôn/sửa sai, mất focus/ẩn tab/ngủ máy hoặc idle120 giây kết thúc phiên học, đưa học sinh về Khu vườn của tôi và mở Modal thông báo; không yêu cầu đăng nhập lại. Backend dừng phiên active:false và không cộng đuôi khi phiên quá hạn. Cảnh báo giây105 nói phiên sẽ kết thúc. Phòng thi giữ xử lý vi phạm rời tab riêng, idle chỉ rời giao diện.

Sổ tay giáo viên có khung đỏ nhạt liệt kê từng câu trả lời sai cũ, thời điểm và nguồn, phía trên đáp án chuẩn; trang sổ tay học sinh không hiện lịch sử. Khu vườn lớp không còn tab Xếp hạng: thống kê, vườn, hai bảng thành tích trên một trang. Frame vườn chỉ còn nhãn KHU VƯỜN CHUNG và nút chuyển động trước sân; bỏ h2 tên lớp, sĩ số/môn và đoạn giải thích được khoanh trong ảnh. Tên lớp vẫn trên biển cổng và header.

## Hiện hành: bỏ lặp thông tin lớp và tab Tiến độ giáo viên — 13/10/2026

Tổng quan giáo viên giữ tiêu đề/slogan, bỏ caption lớp/môn/giáo viên lặp header. Lớp học của tôi bỏ thẻ chọn lớp vì header đã có selector; đi thẳng vào **Danh sách Chương**, rồi **Danh sách Học sinh**. Giữ các nút tạo/chọn lớp/chương/học sinh, thống kê và sổ tay. Tab lớp chỉ còn Lớp học/Hoạt động nhóm; tiến độ xem ở bảng học sinh, hash/callback cũ chuyển về lớp. Học sinh không thay đổi Hành trình. Quyết định này thay3-tab giáo viên trong mục lịch sử bên dưới.

Đúng/sai cho phép0–4 ý đúng khi4 ý, không coi một phương án duy nhất là đáp án. Nhập/tạo/sửa dạng mới kiểm tra capability máy chủ và báo cần cập nhật nếu API cũ, giữ xem trước file/mã retry; không âm thầm chuyển dạng hoặc gửi write không hỗ trợ.

## Hiện hành: câu đúng/sai, trả lời ngắn và sổ tay lớp — 13/10/2026

Form câu hỏi chọn Loại câu hỏi trước bài/nội dung. Trắc nghiệm giữ4 phương án; đúng/sai có2–4 khẳng định với đáp án từng ý; ngắn có một ô đáp án. Dạng bài dùng AnswerFields chung trong luyện/ôn/sửa sai/thi: đúng/sai là nhóm chọn Đúng/Sai theo từng ý, ngắn là input; chưa chọn đủ ý không cho kiểm tra. Chấm đúng/sai cả câu, màu phản hồi từng ý; lời giải luyện chỉ mở khi đúng. Thi lưu cả draft chưa hoàn thành và giữ công bố theo lịch. Tên chương/progress/panel/icon cũ giữ theme đã chốt.

Roster đổi Lượt luyện tập thành Số câu đã làm (câu practice riêng biệt), thêm Xem sổ tay ở cột Câu cần sửa. Modal chỉ đọc, lọc chương/trạng thái, xem câu phiên bản gốc/đáp án/lời giải. Cuối luyện/ôn có Làm lại bài, bắt đầu vòng mới và giữ lịch sử. Bỏ ghi chú phụ chủ đề/roster/CSV/note cuối phiên, giữ nội dung giải bài và cảnh báo.

Clock pause ngay khi blur/hidden/timer gián đoạn; người học cần Tiếp tục học. Cảnh báo sau105 giây, đăng xuất sau120 giây không click/keydown/scroll, cả offline; vào app ở trang khác không cộng giờ. Phòng thi cảnh báo rời tab, đếm một lần cho blur+hidden và khóa chọn tại ngưỡng cả offline. Tín hiệu focus/visibility có giới hạn trình duyệt, không mô tả website có quyền cấm mở tab ở cấp hệ điều hành.

## Hiện hành: submenu căn trái và nút tạo dưới tìm kiếm — 13/10/2026

Các trang có WorkspaceTabs căn main-content về cạnh trái thay vì tự căn giữa khi chiều rộng vượt max-width1600px. Giữ padding responsive chung với header để tiêu đề desktop, tab và panel cùng trục trái. Chiều rộng tối đa, thứ tự/quyền các tab, keyboard và khôi phục qua reload giữ nguyên. Portrait giữ khung tab đủ chiều rộng; nút không giãn lấp hàng, nội dung nút và hàng tiếp theo căn trái.

Hoạt động nhóm: tiêu đề chỉ gồm tên trang/chữ nhỏ/mô tả/minh họa. Tạo hoạt động chuyển xuống toolbar ngay dưới tìm kiếm/bộ lọc, căn trái; Cập nhật căn phải. Toolbar có thể xuống dòng. Chi tiết vẫn giữ thao tác tạo và quay về danh sách; chỉ giáo viên có nút tạo, lớp chưa có học sinh vẫn disabled. Không đổi nghiệp vụ hoặc palette xanh.

## Hiện hành: tab trong trang cha và menu portrait xanh đậm — 13/10/2026

Yêu cầu mới gom đúng các chức năng đã chọn, dùng tab trong nội dung (không accordion menu trái). **Giáo viên:** Lớp học của tôi có Lớp học của tôi/Hoạt động nhóm/Tiến độ học tập; Khu vườn của lớp có Khu vườn của lớp/Xếp hạng chăm chỉ. Sidebar giáo viên còn6 mục. **Học sinh:** Khu vườn của tôi có Khu vườn của tôi/Hành trình của tôi; Khu vườn của lớp có Khu vườn của lớp/Xếp hạng chăm chỉ; Hoạt động nhóm vẫn là mục chính. Sidebar học sinh còn7 mục.

WorkspaceContent/WorkspaceTabs dùng tablist/tab/tabpanel, aria-selected/controls/labelledby và roving tabindex; phím trái/phải/Home/End chọn và focus đúng tab. Sidebar tô sáng trang cha khi vào mục con; các nút dẫn tới tiến độ/xếp hạng vẫn mở đúng chức năng. Hash section/classroom giữ tab và lớp khi tải lại; luồng hash learning/workspace phòng thi giữ ưu tiên. URL lớp giáo viên được đưa về Home nếu học sinh khôi phục; dữ liệu/quyền API giữ nguyên. Các trang con dùng lại thành phần và trạng thái nghiệp vụ cũ, không tính lại tiến độ hoặc tạo dữ liệu.

Portrait≤1100px dùng nền menu đáy cùng gradient xanh đậm landscape (#19442f→#254d36), chữ/icon xanh trắng, mục active nền xanh nhạt/chữ đậm. Viền trên2px #88a982 phân vùng nội dung và menu; thêm đường chia mảnh giữa các mục. Vị trí fixed, cuộn ngang, chiều cao/safe area, header account/lớp sticky giữ nguyên. Quyết định9 mục phẳng và navbar portrait sáng phía dưới là lịch sử đã thay.

## Hiện hành: đăng nhập gọn, tiêu đề lớn trước và Quên mật khẩu — 12/10/2026

Theo ảnh đăng nhập: đặt “Kiến thức lớn lên. Bạn cũng vậy.” trước dòng nhỏ “MỖI NỖ LỰC LÀ MỘT HẠT MẦM”; bỏ đoạn “Một nơi để học, để thử, để sửa sai. Và để thấy mình tốt hơn mỗi ngày.”. Trong form, h2 “Mở khu vườn của bạn” trước badge Chào mừng trở lại; giữ mô tả đăng nhập. login.css nạp cuối và scoped theo login: desktop đầu khung nhập căn với đầu tiêu đề chính, không còn margin:auto đẩy khung xuống; mobile bỏ min-height dư và giảm gap, cạnh trái form khớp tiêu đề. Giữ minh họa desktop, mobile vẫn ẩn như cũ.

Thay lời nhắc cấp lại tĩnh dưới nút đăng nhập bằng nút “Quên mật khẩu” (type=button, aria-haspopup=dialog). Bấm mở Modal với đúng nội dung: **Liên hệ với giáo viên chủ nhiệm, hoặc admin để cấp lại**. Có Đã hiểu/Đóng/Escape, focus trở về nút khi đóng, email/mật khẩu đang nhập giữ nguyên. Chỉ thông báo hướng dẫn liên hệ, không gửi yêu cầu reset hoặc sửa backend/auth/quyền đăng nhập.

## Hiện hành: bỏ breadcrumb, đưa tiêu đề lên đầu tất cả trang — 12/10/2026

Yêu cầu mới mở rộng từ Tổng quan sang **mọi trang giáo viên/học sinh**: bỏ hẳn dòng Trang giáo viên/học tập / tên trang; đưa cụm tiêu đề, slogan/chữ nhỏ, mô tả và nút thao tác lên vị trí đầu trang. WorkspaceFrame cung cấp slot ở header; WorkspaceHeading đặt cùng một cụm vào slot bằng React portal trên desktop/landscape, trả về nội dung trên compact/portrait. Không render hai bản tiêu đề. Header tài khoản/lớp vẫn bên phải; màn hình hẹp tự xuống hàng. Portrait giữ account/lớp sticky trên, tiêu đề ngay dưới, menu đáy/safe area như cũ; xoay không đổi trang hay nhân đôi h1.

Áp dụng PageHeading chung, ClassCommunity, GroupActivities, Feedback, Learning/ExamRoom và thanh điều khiển phiên Practice; giữ callback/state/nút tạo/cập nhật/thời gian. Góp ý dùng h1 thống nhất. Minh họa nhóm thu gọn tại header desktop, portrait giữ khối gốc; tiêu đề modal và nội dung thẻ kết thúc phiên giữ trong chính thẻ/modal. Admin giữ giao diện quản trị riêng. Quyết định giữ breadcrumb trang nghiệp vụ và cách nhân đôi tiêu đề Home phía dưới là lịch sử đã thay.

## Hiện hành: phân biệt đáp án sai/đúng — 12/10/2026

Sau khi kết quả được công bố, đáp án học sinh chọn sai dùng nền đỏ nhạt #fff0f0, viền/outline #dda2a2, chữ đỏ #9b3f46 và ô chữ A/B/C/D đỏ #c55c66/chữ trắng. Đáp án đúng giữ màu xanh hiện có. ExamRoom gắn wrong-choice khi có kết quả cho câu đó, câu trả lời đã chọn và kết quả sai; không giữ viền xanh từ selected. CSS dùng chung cho luyện tập/ôn tập/sửa sai và kết quả Săn điểm/thi chính thức, kể cả màn hình xem bài dùng cùng ExamRoom.

Không có kết quả công bố thì không gắn trạng thái đúng/sai; câu chưa trả lời không đánh dấu là lựa chọn sai. Giữ nguyên đáp án/điểm/quy tắc công bố và API. Trạng thái answered của danh sách số câu vẫn thể hiện đã trả lời như trước.

## Hiện hành: lời nhắn khu rừng tự đổi mỗi 10 giây — 12/10/2026

Ô lời nhắn ở sidebar giáo viên/học sinh dùng GardenNote: 16 tiêu đề/lời nhắn ngắn về tò mò, đọc sách, kiên trì, sửa sai, chia sẻ và nghỉ ngơi; 8 minh họa vector nhỏ ghép theo nội dung (cáo/chậu cây, cú/sách, đom đóm, rùa/ba lô, nhím/nấm, sóc/hạt, thỏ/tưới hoa, gấu/sách). Icon nhỏ đổi theo chủ đề sách/la bàn/nắng/bóng đèn/lá/hoa/chim; không gắn mầm vào icon menu hay toàn ứng dụng.

Câu chữ, icon và minh họa đổi cùng nhau mỗi 10 giây, hết16 câu quay vòng; câu đầu giữ lời nhắn riêng cho giáo viên. Rê chuột/focus trong ô hoặc tab chạy nền thì tạm dừng, khi quay lại chờ đủ10 giây mới đổi tiếp; nút dừng/tiếp tục có aria-pressed giữ lựa chọn qua điều hướng trang. Timer và listener được dọn khi unmount. Ô giữ nền mint/chữ nghiêng/kích thước ổn định, hình riêng ở góc dưới; chuyển mờ300ms, reduced-motion bỏ hiệu ứng. Portrait vẫn ẩn ô theo layout cũ. Không lưu/tạo dữ liệu hay gọi API mới.

## Hiện hành: panel xanh, nhấn chương/tiến độ và cây bám đường — 12/10/2026

Góp ý mới thay màu cam/vàng phủ rộng của đợt trước: panel dùng lại gradient xanh/viền xanh, kể cả thẻ chương thứ hai và nền minh họa chương; nút luyện tập/tiếp tục và trạng thái cấp hiện tại trở về xanh. Bỏ biến thể frame theo thứ tự/icon và màu riêng luân phiên nhóm online. Giữ màu trạng thái nghiệp vụ đúng/sai/cảnh báo. Cam→vàng chỉ nhấn tên chương dạng pill và thanh/đường tiến độ; lời nhắc còn thời gian nền vàng nhạt #fff6dd, chữ nghiêng với font-synthesis: style và opacity 0.85.

ChapterLevelTimeline dùng một roadmap chung: SVG và năm icon cùng trục ngang, icon xen kẽ cao/thấp đặt ngay tại các điểm uốn của đường. Tên cấp/thời gian dưới từng icon; hiện tại vòng xanh/nhãn xanh, mốc đã đạt dấu kiểm, tương lai xám/khoá. Desktop và mobile cùng căn tâm icon vào tick cả X/Y, không đổi dữ liệu, cách tính cấp hay phần clip tiến độ. Menu/icon gốc và header Tổng quan từ đợt trước giữ nguyên. Các quyết định current vàng/CTA đồng/frame nhiều màu phía dưới là lịch sử đã được thay.

## Góp ý trực quan: menu cũ, icon gốc và hành trình cam/vàng — 12/10/2026

**Bổ sung theo ảnh tiếp theo:** bỏ breadcrumb “Trang học tập / Khu vườn của tôi” ở Tổng quan và đưa khối tiêu đề/chào, chữ nhỏ và mô tả lên header desktop cạnh bộ chọn lớp/account. Áp dụng Tổng quan giáo viên và học sinh; màn hình hẹp tự xuống hàng để không đè nhau. Portrait/compact giữ account/lớp neo trên, tiêu đề trong nội dung ngay dưới, chỉ một h1 hiển thị; không đưa thêm chữ lớn vào header điện thoại. Các trang nghiệp vụ khác giữ breadcrumb hiện có. Khi vào phiên luyện từ trang chủ, header dùng điều hướng của phiên như cũ.

Yêu cầu mới **thay quyết định gom menu**: giáo viên/học sinh trở lại9 mục riêng theo thứ tự cũ, không menu cha/submenu. SidebarNavigation chỉ render danh sách phẳng; bỏ CSS/ca kiểm thử riêng của accordion, helper navigation chuyển sang bấm mục trực tiếp. Portrait vẫn header trên/menu đáy, Admin giữ menu đơn. **Khôi phục icon Lucide gốc** ở menu/thống kê/tài khoản/lớp/nhóm/mục tiêu/vinh danh/empty state; bỏ ForestIcon, lá/mầm/đốm sáng gắn thêm và CSS trang trí. Giữ SVG cấp độ Mầm→Kết Trái vì đó là trạng thái học tập thật, không phải mầm trang trí lặp lại.

Theo ảnh góp ý: progress-track dùng thanh dày bo tròn và gradient đồng/cam→vàng, nền kem; áp dụng thẻ chương/mục tiêu/phiên luyện/tổng hợp dùng thành phần này. Tên chương trong thẻ học, timeline và điều kiện ôn-thi có nền pill đào; lời nhắc còn bao lâu lên cấp có nền vàng nhạt, gọi tên giai đoạn kế tiếp thay số cấp trên thẻ chương/mục tiêu. Các số phút/tỷ lệ/cấp vẫn dùng dữ liệu và mốc hiện có, không đổi cách tính.

Lộ trình từng chương đổi rail thẳng sang SVG đường lượn nối5 mốc: mốc đã đạt có dấu kiểm, hiện tại nền vàng, tương lai icon xám/khoá. Rail vẫn progressbar với thời gian thật/min-max; phần tô màu cắt theo tỷ lệ trên trục ngang để khớp mốc dù co giãn desktop/mobile (không dùng dash với non-scaling-stroke vì có thể lệch). Tick/nhãn/icon giữ căn giữa cùng cột, không đổi thời gian/điều kiện tiến cấp. Sidebar note nền mint sáng, chữ nghiêng, minh họa vector chậu cây/cáo ở góc; chỉ trang trí tại lời nhắc, không gắn lên mọi icon. Asset `public/assets/garden-note-friends.svg`.

Người dùng đã chọn **giữ câu “Gieo nỗ lực hôm nay, đón tri thức ngày mai” nhưng thu gọn**, không bỏ; h2 banner học sinh21–26px, mô tả14px, nút Tiếp tục luyện tập và nút luyện từng chương màu đồng/cam. Nút Xem hành trình giữ viền xanh. `src/learning-journey.css` nạp cuối dùng chung cho các chi tiết này; giữ palette khung đa sắc trước đó, trạng thái đúng/sai/cảnh báo và dữ liệu. Kết quả QA/push mới ghi ở bàn giao, không suy Railway deploy từ mã local.


## Menu trái gom nhóm và submenu — 12/10/2026

Theo yêu cầu menu trái gọn hơn, giáo viên có **4 mục cấp đầu**: Tổng quan; Lớp học → Lớp học của tôi/Hoạt động nhóm; Dạy học & kiểm tra → Ngân hàng câu hỏi/Ôn tập & kiểm tra/Quản lý kiểm tra online; Khu rừng tri thức → Tiến độ học tập/Khu vườn của lớp/Xếp hạng chăm chỉ. Học sinh có **5 mục cấp đầu**: Khu vườn của tôi/Hành trình của tôi; Học tập → Luyện tập/Sổ tay sửa sai; Kiểm tra → Ôn tập & kiểm tra/Kiểm tra online; Cùng lớp → Hoạt động nhóm/Khu vườn của lớp/Xếp hạng chăm chỉ. Admin giữ mục Quản lý tài khoản riêng vì không có nhiều chức năng để nhóm.

`SidebarNavigation` dùng chung: một nhóm mở mỗi lần, bấm lại để đóng; vào trang từ submenu/nút trong nội dung tự mở nhóm chứa trang hiện tại. Home/tiện ích tài khoản đóng nhóm; chọn lớp giữ trang. Menu cha chỉ mở/đóng, không dẫn ngầm sang trang đầu. Parent có icon Forest và chevron; submenu dùng chấm nhỏ/đường nối, item hiện tại có aria-current và nền xanh nhẹ. Lời nhắc sidebar rút thành một dòng, ba tiện ích Góp ý/Tài khoản/Đăng xuất vẫn dưới cùng. Bộ đếm sửa sai hiện cả trên nhóm Học tập khi đóng và mục con; không tạo hoặc đổi dữ liệu học tập.

Accordion dùng nút có aria-expanded/aria-controls, submenu đóng có hidden; Tab/Enter/Space hoạt động tự nhiên, Escape trong nhóm đóng và đưa focus về cha. Desktop/landscape dùng sidebar phân cấp; portrait≤1100px hoặc viewport≤700px giữ navigation phẳng theo bố cục compact hiện có, nên menu đáy/header trên phải và safe area không đổi. Khi xoay qua lại chỉ có một navigation DOM, không nhân đôi nút hoặc active route. CSS `sidebar-navigation.css` scoped, dùng palette Forest riêng cho từng nhóm; reduced-motion tắt hiệu ứng chevron. Không thay API/backend hoặc nghiệp vụ các trang.


## Màu khung và icon khu rừng tri thức — 12/10/2026

Theo yêu cầu mới từ ảnh tổng quan giáo viên, **tiêu đề lớn đứng trước; slogan/chữ nhỏ nằm ngay dưới** trên các trang của giáo viên, học sinh và Admin. PageHeading chung, đầu trang nhóm/cộng đồng/tài khoản và learning-heading cùng thứ tự h1 → eyebrow → mô tả. Eyebrow12px desktop/11px màn hình≤700px, weight500, giãn dòng1,7; không di chuyển nhãn câu hỏi, số câu hoặc trạng thái phòng thi.

Theme dùng chung `src/forest-theme.css`, nạp sau portrait-navigation.css: khung nội dung có gradient xanh lá/vàng mật ong/xanh trời/tím hoa và viền tương ứng; thống kê/thao tác nhanh đồng bộ màu theo icon. Giữ màu báo đúng/sai, cảnh báo, trạng thái thi, câu đang chọn và các khung cấp độ/vinh danh đặc thù. `ForestIcon` tại components.tsx kết hợp icon nghiệp vụ hiện có với SVG lá/mầm, đốm sáng, nền nổi mềm; dùng ở menu ba vai trò, thao tác tài khoản portrait, thống kê, thẻ lớp/nhóm, mục tiêu, vinh danh và empty state. Trang có ít dữ liệu vẫn có bộ icon/theme chung, không tạo dữ liệu để lấp thẻ.

Icon trang trí aria-hidden; nhãn/tooltip/nút44px giữ ở thao tác gốc. Hover xoay icon rất nhẹ, tắt khi reduced-motion; menu portrait vẫn ở đáy/header tài khoản trên phải. Chỉ thay frontend, local5173 nhận HMR/API và DB vẫn Railway; không tự push/deploy. Kết quả kiểm tra mới của đợt Forest ghi riêng tại session-handoff.md, không dùng kết quả ôn-thi của task song song làm bằng chứng.


## Trang kiểm tra online riêng và hai nguồn đề — 12/10/2026

Điều hướng chính bổ sung **Quản lý kiểm tra online** cho giáo viên và **Kiểm tra online** cho học sinh, icon ClipboardList. Giáo viên có form chuẩn bị đề, danh sách buổi/bắt đầu/đóng và lượt thi/kết quả; học sinh xem buổi chờ/đang mở/đã đóng và lượt của mình. Không đưa cấu hình cấp cây, quyền Săn điểm, ma trận ôn hoặc thưởng cây vào trang riêng này. Nút Tạo kiểm tra online ở trang Ôn tập & kiểm tra dẫn sang trang mới. Phòng thi dùng lại luồng hiện có, reload giữ đúng trang online/lớp/lượt bằng workspace trong hash. Lịch kiểm tra theo lịch và Săn điểm tiếp tục ở trang cũ.

**Nguồn đề** là fieldset hai radio **Upload file / Chọn từ ngân hàng**, ban đầu chưa chọn; bắt buộc chọn đúng một. Upload chọn chương ngay trong khối file, không cần tích chương ở khối khác trước. Có mẫu Word/CSV, thông báo đọc thành công, xem/bỏ câu và lỗi tại chỗ; Word5MB/CSV512KB, đề tối đa100câu. Ngân hàng hiển thị checkbox chương, xổ danh sách bằng details và chọn toàn chương hoặc các bài riêng; các chương có phạm vi độc lập, hỗ trợ chọn toàn chương này và vài bài chương khác cùng lúc. Checkbox chương có trạng thái chọn một phần, trọng số chỉ hiện các bài thuộc phạm vi được chọn.

Banner thông báo học sinh ở mọi trang vẫn đếm chờ theo server; bấm vào chuyển đúng trang Kiểm tra online và lớp/phòng. Trong phòng ẩn banner, giữ đồng hồ và autosave hiện có. Desktop/mobile sử dụng theme vườn và header/dock portrait hiện hành. Overview lượt thi thêm delivery để lọc đúng lịch sử online; backend Railway cần triển khai trường này. API cũ thiếu capability khóa tạo/bắt đầu, thiếu phân loại có lời báo lịch sử chờ server. Chưa xác nhận deployment từ việc đọc checkout; nghiệp vụ [online-exams.md](online-exams.md), bằng chứng tại [session-handoff.md](session-handoff.md).

## Header và menu đáy ở portrait

Theo yêu cầu mới đã sửa lại vị trí, điện thoại/tablet **portrait, rộng tối đa 1100 px** dùng header sticky ở đầu trang để luôn thấy **tên tài khoản/avatar và bộ chọn lớp/môn** khi cuộn. **Góp ý, Tài khoản và Đăng xuất** ở góc trên phải, chỉ hiển thị icon 20px trong nút44×44px có tooltip/aria-label; tên tài khoản/avatar bên trái, bộ chọn lớp ở hàng dưới. Admin có hai icon Tài khoản/Đăng xuất vì không có luồng Góp ý. Tên tài khoản không bị ẩn theo breakpoint, được xuống dòng khi thiếu chỗ. Breadcrumb không nằm trong header portrait. Vị trí top left ở ghi chú trước đã được thay theo yêu cầu mới.

Menu điều hướng chính ở **đáy màn hình**, cố định thành một dải cuộn ngang có icon và nhãn. Góp ý/Tài khoản/Đăng xuất đã chuyển lên header, không nằm trong dock; ẩn logo/lời nhắc ở sidebar portrait để dock gọn. Nội dung có khoảng đệm dưới bằng chiều cao dock và safe area để thao tác cuối trang không bị che; header/dock có nền kem và viền nhẹ. Modal vẫn nằm trên cả header/menu. Hỗ trợ safe area trên thiết bị có tai thỏ/thanh home, `viewport-fit=cover`.

Landscape và desktop giữ bố cục sidebar hiện có. CSS riêng `src/portrait-navigation.css` nạp sau `garden.css`, không đổi API/database hay quy tắc nghiệp vụ. Quyết định này thay mô tả menu trên cùng ở điện thoại trong các ghi chú cũ.

## Buổi kiểm tra online, chờ X phút/làm Y phút — 12/10/2026

Trang giáo viên **Ôn tập & kiểm tra** có nút **Tạo kiểm tra online** dẫn tới form bộ câu, thêm lựa chọn **Kiểm tra online cả lớp**. Dùng lại nguồn ngân hàng/Word–CSV, checkbox nhiều chương và bài. Form online thay lịch mở/đóng bằng hai input riêng **Thời gian chuẩn bị (phút)** X và **Thời gian làm bài (phút)** Y, giữ ngưỡng rời tab. Có hướng dẫn chung giờ thi và nút **Chuẩn bị kiểm tra online**; danh sách buổi có **Bắt đầu kiểm tra**, sau gửi yêu cầu khóa nút thành **Đã gửi thông báo**, có **Đóng bài thi**. Trạng thái chờ bắt đầu/đang mở/hết giờ và X/Y hiển thị riêng.

Trang học sinh có banner xanh nhạt ở đầu nội dung, icon chuông, tên đề/lớp/môn/số câu/thời lượng; đồng hồ **Bắt đầu sau** trong X phút, **Còn** trong Y phút. Nút Chờ mở đề khóa trước giờ, Vào làm kiểm tra/Tiếp tục kiểm tra khi tới giờ. Thông báo không ép chuyển trang; bấm vào mới chọn đúng lớp/phòng. Trong phòng thi ẩn banner, dùng đồng hồ/hạn chung hiện có. Desktop nút bên phải, mobile xếp dưới toàn hàng; không tràn ngang. Poll10 giây và cập nhật khi trở lại tab, đồng hồ theo server; không hứa thông báo email/push ngoài ứng dụng. Capability cũ khóa công cụ mới, có lời báo chờ server. Nghiệp vụ [online-exams.md](online-exams.md).

## Thu gọn vườn và bảng tên lớp/giáo viên — 12/10/2026

Theo yêu cầu mới, frame vườn gọn hơn: vùng cuộn tối đa **360 px desktop / 300 px mobile**, icon học sinh **56 / 46 px**, ô di chuyển cao130px, cột desktop tối thiểu108px và **ba cột mobile**. Giảm padding/khoảng cách và biên độ chuyển động để tên/avatar sát nhau nhưng vẫn nằm trong rào. Khung vinh danh cũng giảm icon/padding, cuộn tối đa180px/160px, hai cột mobile. Giữ đủ thành viên, cấp MAX chương, thứ tự ưu tiên cấp cao và pause/reduced-motion; không đổi tiến độ/điểm.

Bảng tên nền kem viền gỗ nằm **giữa cổng ở hàng rào phía dưới**, giữ khung nhỏ rộng120px, chỉ ghi **tên lớp / môn** thành hai dòng (13/12px). **Avatar giáo viên38px để riêng bên trái cổng, không ghi tên giáo viên**; bảng và avatar nằm ngoài vùng cuộn học sinh. Bỏ dòng ghi chú “Cấp của từng chương vẫn riêng biệt; khu vườn không cộng dồn thời gian giữa các chương. Cuộn trong vườn để xem thêm khi lớp đông.” theo yêu cầu người dùng. Avatar dùng ảnh/bộ chọn đã lưu, chưa có dùng chữ viết tắt. Trang giáo viên có thể dùng avatar người đang đăng nhập (lớp sở hữu); trang học sinh đọc `teacher: {name, avatarId}` bổ sung từ API garden. API cũ vẫn hiện tên lớp/môn và avatar chữ viết tắt, không dùng avatar học sinh làm giáo viên. Metadata mới cần backend Railway được deploy, không thêm schema hoặc ghi dữ liệu thật.

Đã kiểm tra build/TypeScript, hai ca API cộng đồng/phân quyền và6ca vườn desktop/mobile trên database riêng, xem ảnh lớp47người; kiểm tra bounds/cuộn/reload/animation/avatar thật và API cũ đạt. Bản local5173 nhận mã qua HMR; chưa push/deploy Railway. Thông số650/550px và hai cột mobile trong ghi chú cũ đã thay bởi phần này.

## Quản lý/xóa câu hỏi hàng loạt — 11/10/2026

Ngân hàng câu hỏi thêm frame kem **Quản lý câu hỏi hàng loạt** dưới toolbar nhập file: checkbox Chọn tất cả trong bài/đang hiển thị, số đã chọn, Bỏ chọn, hai nút **Xóa các câu đã chọn / Xóa cả bài**. Checkbox từng câu nằm trên thẻ; thẻ được chọn viền xanh, chỉ câu đang dùng/phiên bản hiện tại được chọn. Xóa cả bài bật khi bộ lọc đã chọn một bài, kể cả rỗng. Nút xóa viền/nội dung đỏ đất; mobile tự xuống dòng và hai nút toàn hàng.

Popup xóa nhiều câu có số lượng/danh sách cuộn; popup xóa bài có tên/số câu và cách khôi phục. Cả hai nhắc giữ lịch sử/sổ tay/đề đã lưu, Hủy + Xác nhận, busy khóa đóng/lưu và hiện lỗi tại chỗ. Thành công tải lại danh mục/bộ đếm, bỏ chọn và thông báo; đổi phạm vi không mang lựa chọn cũ sang bài/chương khác. API cũ thiếu capability khóa chọn/xóa nhiều câu kèm thông báo chờ server. Nghiệp vụ [question-bank.md](question-bank.md); CSS scoped src/question-bank.css, không đổi các thẻ nhập/sửa/lịch sử.

## Cách đọc và tiếp tục session — 11/10/2026

Đây là **tài liệu thiết kế giao diện chính**. Quyết định hiện hành ở đầu tài liệu ưu tiên các mô tả lịch sử phía dưới; yêu cầu mới của người dùng và mã hiện tại quyết định bước tiếp theo. Tra cứu nghiệp vụ/trạng thái triển khai tại [project-status.md](project-status.md), bối cảnh tại [session-handoff.md](session-handoff.md). Không tự làm lại ảnh nền, icon, vườn hoặc audit đã có chỉ vì một ghi chú cũ mô tả khác; không coi ảnh QA/test checkout là giao diện đã deploy Railway.

Các quyết định hiện hành: cấp riêng **lớp → môn → chương**, năm tên **Mầm → Chồi → Cây Non → Đơm Hoa → Kết Trái**, mốc thời gian theo cài đặt lớp/môn (mặc định 60 phút/cấp); vườn có rào chứa toàn bộ lớp, frame vinh danh cấp 5 riêng; sửa sai nằm trong ô thống kê phía trên; sai chưa hiện đáp án/lời giải; thẻ kiểm tra hiển thị cấp yêu cầu, vé và quyền giáo viên. Frontend local5173 dùng API/database Railway; công cụ mới thiếu capability phải báo chờ server, không giả dữ liệu.

### Trạng thái giao diện xử lý vi phạm ôn/thi

Đã đối chiếu đề án gốc và kiểm thử tại [violations-audit.md](violations-audit.md). Ôn tập có cảnh báo sau120 giây, đếm10 giây rồi dừng ghi nhận; sai lưu sổ tay và chỉ mở lời giải khi đúng. Phòng kiểm tra theo quyết định người dùng tự nộp lần rời tab thứ4 mặc định, không áp tự nộp cho phiên ôn. Không tự thêm trừ điểm kỷ luật hoặc khóa tài khoản.

**Chưa sửa/triển khai:** offline đạt ngưỡng vẫn chọn thêm đáp án và đồng bộ đáp án trước sự kiện; trang visible mất focus chưa ghi cảnh báo; chưa có nhật ký/ngoại lệ chi tiết cho giáo viên, chưa có hỗ trợ Thần Rừng sau lần sai thứ3. UI cảnh báo pending/offline và lời nhắc mỗi lần rời cần hoàn thiện theo báo cáo. Mobile idle cần QA thiết bị thật; kết quả audit7/8 không phải đã nghiệm thu toàn bộ. Thưởng bài tự nộp do tab và cách hủy cảnh báo bằng tương tác còn là điểm cần thống nhất, không tự thay quy chế. Session mới tiếp tục từ các khoảng trống này khi được yêu cầu, không tái phân tích toàn bộ đề án hoặc coi đề xuất đã thành code.

## Cài đặt thời gian tăng cấp của giáo viên — 11/10/2026

Trang **Ôn tập & kiểm tra** thêm thẻ **Thời gian tăng cấp** phía trên Quyền kiểm tra theo chương. Giữ nền kem, icon đồng hồ trong ô xanh nhạt, input số **Số phút cho mỗi cấp** và nút **Lưu thời gian**; mặc định 60 phút, phạm vi 1–1440 phút. Xem trước Mầm/Chồi/Cây Non/Đơm Hoa/Kết Trái với icon/tên/mốc giờ thay ngay theo draft; chưa lưu không thay dữ liệu. Preview desktop năm ô cùng hàng, mobile hai cột và cấp 5 toàn hàng; nút/input toàn chiều ngang mobile. Nút disabled khi chưa thay đổi, số sai, đang lưu hoặc API cũ thiếu `canConfigureLevels`.

Thông báo lưu thành công/lỗi theo learning hiện có; giữ draft các form khác. Cài đặt áp dụng từng lớp/môn, mọi chương; nhắc vé/điểm đã cấp được giữ. Timeline chương, mục tiêu, tiến độ và badge roster/xếp hạng đọc cùng `levelMinutes`, thay mốc cố định 0/1/2/3/4 giờ trong mô tả lịch sử phía dưới. Khi API Railway chưa có capability, hiển thị trạng thái chờ cập nhật server và khóa ghi. Nghiệp vụ tại student-levels.md/learning.md; ảnh QA `.local/level-settings-{desktop,mobile}.png` dùng fixture riêng.

## Khung vườn có rào và vinh danh cấp 5 — 11/10/2026

Theo phản hồi mới, bỏ bố cục danh sách chia tầng. Trang **Khu vườn của lớp** có hai frame riêng dưới thống kê: **Vinh danh Kết Trái · Cấp 5** nền kem/viền vàng, và **Khu vườn [tên lớp]** chứa toàn bộ học sinh trong một cảnh vườn có rào gỗ bốn phía, cổng nhỏ, cỏ, lối đi và hoa trang trí. Mỗi học sinh hiện thuộc lớp có đúng một icon cây đại diện trong vườn, kèm avatar hiện có (chưa chọn thì dùng chữ cái), **hai từ cuối họ tên**, cấp/tên giai đoạn. Người hiện tại nhãn tên xanh và Bạn; họ tên đầy đủ trong nhãn accessible/tooltip phân biệt bạn trùng tên ngắn. Cấp đại diện lấy cao nhất của một chương trong đúng lớp/môn, không cộng thời gian giữa chương.

Icon, tên và avatar di chuyển cùng nhóm quanh vị trí trong vườn theo đường vòng, mỗi bạn có nhịp/chiều riêng; cây thêm đung đưa nhẹ. Sắp vị trí ban đầu ưu tiên cấp cao, không có hàng tiêu đề theo cấp. Giới hạn chuyển động trong rào, hover dừng, nút **Tắt/Bật chuyển động** và reduced-motion. Kích thước/cuộn/cột theo cập nhật12/10 ở đầu tài liệu; rào/cổng giữ quanh frame khi cuộn lớp đông. Cấp5 vẫn có cây trong vườn và xuất hiện một lần ở frame vinh danh dù nhiều chương đạt. Component src/StudentGarden.tsx và CSS src/student-garden.css, giữ SVG/Avatar hiện có.

API `/garden` bổ sung `members`; nếu backend cũ thiếu trường này, vẫn hiện frame/rào nhưng thông báo chờ server, không suy roster/cấp từ tổng leaderboard. Frame vinh danh có thể dùng `trees` thật của API cũ, gộp theo studentId, avatar chưa có dùng chữ cái. Bỏ thẻ trắng trống/banner chỉ dành cho cây cấp 5 cũ. Ảnh kiểm tra mới `.local/fenced-garden-{desktop,mobile}.png` và `.local/fenced-garden-crowd-{desktop,mobile}.png` (fixture 47 bạn, không phải học sinh Railway). Các ảnh student-garden cũ là bố cục đã thay.

## Thẻ Ôn tập & kiểm tra học sinh — 12/10/2026

Mỗi thẻ bắt đầu bằng tên chương, khung nền xanh nhạt ghi **Cấp độ yêu cầu / Cấp 3 · Cây Non** và **Cần vé săn thưởng** kèm số vé còn lại. Bên dưới là tỷ lệ đúng, câu cần sửa và trạng thái giáo viên mở kiểm tra; các lý do tỷ lệ/sửa sai còn thiếu dùng danh sách gọn. Dưới dòng “Còn … câu cần sửa trong chương” có nút viền xanh **Mở sổ tay**, icon sách và chiều cao tối thiểu44px, mở sổ tay đã lọc đúng chương. Sổ tay có trường **Chương cần sửa**, nhóm theo lớp/môn và tùy chọn **Tất cả chương**; vào từ sidebar/trang chủ mặc định tất cả. Không hiển thị “Cần thêm xx phút học” hoặc lặp lý do thiếu vé/chương khóa. Cấp độ hiện tại chỉ có icon nhỏ và tên cấp ở cuối thẻ, **bỏ dòng thời gian học** theo yêu cầu12/10, phía trên nút Săn điểm toàn chiều ngang; khối cuối căn đều giữa các thẻ cùng hàng. Tên chương18px, điều kiện/nút14px, nhãn/chú thích13px; điện thoại một cột. CSS scoped `.hunt-chapter` trong learning.css và `.correction-filter` trong styles.css, không đổi nghiệp vụ/API hoặc dữ liệu.

## Gộp lời nhắc sửa sai vào thống kê — 11/10/2026

Trang chủ học sinh: gộp tiêu đề “Sai một câu, hiểu thêm một điều.”, lời nhắc và nút Mở sổ tay vào ngay dưới số liệu/note của ô Câu cần sửa sai. Dùng số câu của lớp/môn đang chọn; có câu sai thì nhắc làm lại, chưa có thì giải thích câu sai sẽ được lưu. Nội dung có vạch ngăn nhẹ, khoảng cách 10–12 px, nút mở trang sửa sai hiện có. Bỏ thẻ gentle-reminder cạnh khối cấp độ để tránh kéo thẻ vàng cao theo danh sách chương. Khối cấp theo chương dùng toàn hàng; mobile lời nhắc cùng ô thống kê và ở trên danh sách chương. Không đổi dữ liệu hoặc API.

## Mốc cấp theo chương, vé và công cụ kiểm tra — 11/10/2026

Các mốc giờ ở phần này là **mặc định 60 phút/cấp**; dùng cài đặt m để đặt icon/vạch và thời gian đúng lớp/môn. Mô tả thẻ “Từ 2 giờ” dưới đây là bố cục trước đợt Thẻ Ôn tập & kiểm tra học sinh ở trên, không đưa lại dòng đã bỏ.

Yêu cầu mới thay cấp cộng gộp lớp/môn: mỗi **lớp → môn → chương** có cấp riêng. Khối Cấp độ của bạn hiển thị từng chương; trang Hành trình của tôi dùng cùng `ChapterLevelTimeline`. Thanh chia 0/1/2/3/4 giờ, icon **Mầm → Chồi → Cây Non → Đơm Hoa → Kết Trái** nằm trên đúng vạch mốc, tên và giờ ở dòng riêng. Mốc hiện tại có nền xanh nhạt/nhãn cấp, mốc đã đạt màu đậm; thanh tô theo tổng thời gian chương / 4 giờ. Không dùng màu làm tín hiệu duy nhất. Năm mốc giữ cùng hàng trên điện thoại, tên được xuống dòng khi cần; icon 48 px desktop/36 px mobile. Khối mục tiêu chọn một chương chưa đạt Kết Trái; bỏ badge cấp cộng gộp trên thanh tài khoản. Roster/xếp hạng dùng badge kèm tên từng chương khi API cung cấp, không thay bằng cấp tổng khi API cũ.

Thẻ ôn/thi dùng icon cấp đã duyệt, có dòng **Cấp cần để kiểm tra / Cây Non · Cấp 3 / Từ 2 giờ học trong chương này**. Vé Săn thưởng có icon Ticket màu vàng đất; điều kiện chưa đạt là danh sách mỗi điều kiện một dòng. Giữ riêng điều kiện giáo viên cho phép. Không đổi logic điểm/vé.

Luyện tập/ôn tập: dưới trạng thái ghi nhận có đồng hồ `HH:MM:SS` nhãn **Phiên này · tạm tính**; dòng **Đã ghi nhận** chỉ xuất hiện khi API trả số giây đã lưu. Đồng hồ dừng khi trang ẩn, offline, phiên lỗi, idle hoặc kết thúc; không bù khoảng trình duyệt bị treo. Trả lời sai chỉ đánh dấu lựa chọn sai và lời nhắc chung; không tô đáp án đúng/hiện lời giải. Trả lời đúng mở đáp án/lời giải.

Giáo viên quản lý bài qua nút Thêm bài và Xóa bài trong disclosure danh sách; xóa có popup giải thích bảo toàn lịch sử và xác nhận/hủy. Tên trùng hiển thị lỗi trong popup.

Form kiểm tra thêm nguồn **Ngân hàng / Word–CSV**, phạm vi **Toàn bộ bài / Chọn từng bài**, một/nhiều chương. Upload có file mẫu, chọn chương cho mỗi file, preview và bỏ câu trước khi lưu, tối đa 100 câu. Đang đọc file khóa việc lưu/đổi nguồn/chương. Mặc định giáo viên bấm mở khi sẵn sàng; danh sách đề có **Mở kiểm tra ngay**, cùng thao tác đóng hiện có. Khi backend chưa trả `examCreation`, khóa thao tác mới và báo chờ cập nhật server để không tạo nhầm đề bằng API cũ.

Ảnh đã kiểm tra: `.local/chapter-milestones-desktop.png`, `.local/chapter-milestones-mobile.png`; kiểm thử hình học xác nhận tâm icon khớp vạch mốc, không tràn ngang ở desktop/mobile. Các đoạn mô tả cấp cộng gộp bên dưới là lịch sử.

## Điều khiển kiểm tra theo chương — 11/10/2026

Trang giáo viên Ôn tập & kiểm tra có thẻ Quyền kiểm tra theo chương phía trên khối học kỳ/ma trận. Mỗi hàng gồm tên chương, trạng thái Đang khóa/Đã mở và nút Mở kiểm tra (primary)/Khóa kiểm tra (secondary). Sử dụng learning-section/list/row hiện có, nhãn nút accessible gồm tên chương; busy khóa điều khiển trong khi lưu, thông báo thành công/lỗi và refresh trạng thái. Hàng tự xuống cột trên điện thoại. Điều khiển riêng không reset draft học kỳ/ma trận. Khi server chưa có trường mới, nút disabled kèm trạng thái chờ cập nhật.

Thẻ Săn điểm học sinh có pill Giáo viên đã mở kiểm tra/Chờ giáo viên mở kiểm tra và lý do chưa thể bắt đầu; nút chỉ sáng khi toàn bộ điều kiện đạt. Danh sách kiểm tra chính thức ghi tên các chương còn khóa và khóa nút vào bài tương ứng. Không dùng màu làm tín hiệu duy nhất. Các ca desktop/mobile mới kiểm tra mở/khóa, reload, nút cũ bị API từ chối, không tràn ngang; ảnh trong test-results/learning-teacher-controls--58ff7-d-stale-starts-are-rejected-{desktop,mobile}. Nghiệp vụ/triển khai ở learning.md.

## Danh mục chương/bài chưa có câu hỏi — 11/10/2026

Giáo viên, trang **Lớp học của tôi**: mỗi thẻ chương có số bài/số câu, disclosure **Xem danh sách bài** bằng details/summary hỗ trợ bàn phím. Danh sách theo thứ tự dạy, giữ số bài trong tên; dưới mỗi bài là số câu hoặc **Chưa có câu hỏi**. Mỗi chương mở độc lập, giữ nút Quản lý câu hỏi. CSS .curriculum-lessons dùng khoảng cách 10–12 px, màu xanh/chữ phụ hiện có; tên dài tự xuống dòng trên điện thoại.

Học sinh: ô chọn bài vẫn hiện khi chương có danh mục nhưng 0 câu hỏi; lựa chọn ghi tên bài/số câu, nút luyện tập disabled khi chương hoặc bài được chọn chưa có câu. Không ẩn danh mục hoặc thêm tiến độ minh họa. Rà soát mới teacher/student tại 1440/390 px không tràn ngang/lỗi JS; ảnh .local/ui-physics-curriculum. UI mới đang ở frontend local 5173, API/danh mục Railway đã cập nhật; frontend production chưa triển khai disclosure này.

Tài liệu tra cứu duy nhất về hình thức giao diện, cập nhật 11/10/2026. Quy tắc nghiệp vụ/tài khoản/triển khai được lưu ở các tài liệu chức năng; khi sửa hình thức giao diện, cập nhật tài liệu này.

## Định hướng và chữ

Đăng nhập bỏ dòng giải thích tự thêm đuôi email; lời hướng dẫn dưới nút là **“Liên hệ giáo viên chủ nhiệm để cấp lại.”** theo yêu cầu ngày 11/10/2026.

Email xác nhận tài khoản dùng mẫu gọn: chữ GreenEdu xanh đậm, nền sáng, khối nội dung tối đa 560 px, font Arial 15 px/line-height 1.7 để đọc được trong trình đọc mail, một nút xanh **Mở GreenEdu**. Nội dung theo vai trò do server tạo; mẫu có biến được escape, không nhận HTML từ họ tên. Template tại [emailjs-welcome-template.html](emailjs-welcome-template.html), nghiệp vụ/cấu hình tại [welcome-email.md](welcome-email.md). Không thay bố cục ứng dụng trong yêu cầu email này.

Tên thương hiệu hiển thị **GreenEdu** (G và E viết hoa), nét đậm 800 đồng nhất cho cả tên, theo ảnh preview đã duyệt. Component `Logo` dùng chung ở đăng nhập/sidebar/các màn hình tài khoản; sửa chi tiết còn viết thường ngày 11/10/2026 sau phản hồi của người dùng.

Giao diện tiếng Việt theo chủ đề khu vườn kiến thức, màu xanh rừng, nền sáng, thẻ dễ đọc và các thao tác rõ ràng. Font **Be Vietnam Pro** được phục vụ nội bộ, các trọng lượng 400/500/600/700/800. Không phụ thuộc tải font từ dịch vụ ngoài. Icon dùng Lucide; cây cấp độ dùng SVG theo dữ liệu thực tế.

Thiết kế khu vườn ấm áp đã được người dùng duyệt qua ảnh và yêu cầu áp dụng ngày 11/10/2026. Các biến hiện tại trong `src/garden.css`: xanh `#315d3e`, xanh đậm `#153f2c`, chữ phụ `#596d60`, viền `#e2e6d8`, nền phụ `#eef3e4`, nền kem `#faf9f3`, chữ `#203f2c`, bán kính chuẩn 22 px. CSS chức năng/responsive tại `src/styles.css`; lớp diện mạo cũ tại `src/design.css`, cấp học sinh tại `src/student-level.css`; `src/garden.css` được nạp cuối trong `src/main.tsx` để áp dụng thiết kế đã duyệt cho app thật.

### Thiết kế đã duyệt và áp dụng — 11/10/2026

Sidebar xanh rừng bo 24 px, nền kem với ảnh trường mờ, thẻ trắng ấm viền nhẹ, nút xanh và nút phụ có viền cùng chiều cao tối thiểu 44–46 px. Đồng bộ biểu mẫu, bảng, modal và màn hình đăng nhập cho Học sinh/Giáo viên/Admin. Logo trường vẫn dùng nguồn gốc riêng; cây từ sách dùng ảnh `knowledge-garden-v1.webp` đã có. Giữ trạng thái focus, lỗi/đúng/sai, disabled và điều hướng hiện tại.

Trang chủ học sinh có hero và mục tiêu kế tiếp ở hai cột, ba thống kê dữ liệu thực, thẻ chương gọn với số chương/cây/tiến độ/chọn bài/nút luyện tập. `GardenGoal.tsx` suy ra mục tiêu của **một chương** chưa đạt Kết Trái và mốc cài đặt lớp/môn; không dùng tổng giờ lớp làm cấp cá nhân hoặc số liệu giả theo ngày. Khối cấp theo chương trải toàn hàng, lời nhắc/sổ tay gộp trong ô Câu cần sửa sai phía trên theo cập nhật mới; bố cục cuối trang cũ đã thay.

Ở màn hình 701–1200 px hero và mục tiêu xếp dọc; điện thoại dùng điều hướng ngang, các khối một cột, giữ chữ nội dung 15 px/nhãn 14 px/chú thích 13 px/ô nhập 16 px. Tiêu đề hero học sinh 26–34 px desktop và 27 px điện thoại; số liệu 26 px (23 px tablet). Hỗ trợ `prefers-reduced-motion`. Bản prototype 5180 vẫn riêng; giao diện thật ở frontend local 5173 dùng API/database Railway.

### Thứ bậc chữ — 11/10/2026

Dùng các biến `--text-*` tại `src/styles.css` thay cho cỡ chữ riêng lẻ ở mỗi trang/breakpoint. Nội dung **15 px**, nhãn/nút **14 px**, chú thích **13 px**, trường nhập/chọn **16 px**. Điện thoại giữ nguyên các cỡ chữ này; chỉ thu gọn tiêu đề. Dòng tên trường trong logo là chữ thương hiệu 10 px.

| Vai trò                      | Desktop | Điện thoại ≤700 px |
| ---------------------------- | ------- | ------------------ |
| Tiêu đề trang/đăng nhập      | 28 px   | 24 px              |
| Tiêu đề mục                  | 22 px   | 20 px              |
| Tiêu đề thẻ                  | 18 px   | 18 px              |
| Câu hỏi luyện tập/thi        | 20 px   | 20 px              |
| Tiêu đề khối giới thiệu      | 30 px   | 26 px              |
| Tiêu đề giới thiệu đăng nhập | 36 px   | 30 px              |
| Số liệu thống kê             | 30 px   | 30 px              |

Nội dung dùng giãn dòng khoảng 1,7, chú thích/nhãn khoảng 1,5–1,6; tiêu đề bớt ép khoảng cách ký tự. Giới hạn chiều dài mô tả, cho tiêu đề/thao tác xuống hàng khi thiếu chỗ. Thẻ thống kê đặt số liệu trên hàng riêng; bộ lọc đặt nhãn phía trên trường chọn và tự xuống hàng. Chữ phụ của bảng/chương/thống kê dùng màu đậm hơn `#586b60`. Quy tắc áp dụng cả ôn/thi và thẻ cấp độ; không thu chú thích xuống 8–11 px trên mobile.

Bảng trên là hệ token trước khi áp dụng CSS khu vườn. `garden.css` nạp sau cùng đặt `--text-metric:26px`, thẻ thống kê học sinh26px (23px ở tablet) và hero26–34px; mô tả thiết kế đã duyệt phía trên phản ánh các override này. Khi kiểm tra font thực tế phải xét selector/breakpoint và thứ tự nạp CSS, không coi bảng token là computed style của mọi trang.

## Bố cục và thành phần

- Trang Tài khoản & bảo mật giáo viên/học sinh chỉ hiển thị thông tin cá nhân, ảnh đại diện và hai nút Đổi avatar/Đổi mật khẩu. Click ảnh hoặc nút mở popup tương ứng; avatar thanh đầu mở trực tiếp bộ chọn. Popup avatar rộng tối đa 760 px, cuộn nội dung, giữ nút đóng ở đầu; mật khẩu dùng popup riêng. Đóng bằng X/Escape/nền, bỏ draft chưa lưu và trả focus về nút mở; không cho focus tới input file ẩn. Admin đổi mật khẩu qua popup; màn hình đổi mật khẩu tạm bắt buộc vẫn riêng.

- Desktop dùng sidebar xanh rừng, vùng nội dung sáng và thanh đầu trang có tài khoản/lớp đang chọn.
- Mobile dùng điều hướng cuộn ngang, thẻ chương một cột ở màn hình hẹp, bảng tài khoản chuyển thành thẻ. Không cắt thao tác hoặc tạo cuộn ngang toàn trang.
- Đăng nhập gồm vùng giới thiệu và biểu mẫu; chỉ khi backend offline bật `LOCAL_QUICK_LOGIN=1` mới có hai nút vào nhanh với tên từ database. Production/Railway tắt chức năng này, kể cả giao diện chạy local5173. Trên điện thoại hai nút xếp dọc khi được bật.
- Thẻ thống kê, chương, bảng và modal dùng cùng màu, khoảng cách và trạng thái tải/lỗi/trống. Điều hướng hiện tại có `aria-current`, nhãn form đọc được và nút đủ lớn để chạm.
- Hoạt động nhóm có tổng quan, tìm/lọc, tiến độ, hạn nộp, yêu cầu và danh sách nhóm dễ phân biệt. Đây là cách trình bày; quyền nộp/đại diện/deadline nằm ở tài liệu chức năng.
- Giao diện ôn tập/kiểm tra mới tiếp tục hệ thống thành phần này; tránh đưa thuật ngữ backend hoặc dữ liệu kỹ thuật vào luồng học sinh.

### Hoạt động nhóm

Phần đầu trang dùng minh họa ba học sinh thảo luận do người dùng cung cấp, asset `public/assets/group-learning-v1.webp`, nền xanh kem nhẹ. Desktop đặt hình bên phải tiêu đề/mô tả/nút Tạo hoạt động, điện thoại đặt hình dưới phần chữ. Ảnh trang trí có alt rỗng, giữ tỷ lệ/alpha; CSS riêng `src/group-activities.css`, không đổi các trang khác. Áp dụng cho giáo viên/học sinh, cả danh sách và chi tiết hoạt động.

Danh sách có thẻ tổng quan, tìm tên/lọc đang nhận bài–đã hết hạn và tiến độ đã nộp. Trang chi tiết đặt hạn/trạng thái ở đầu, yêu cầu/file Word và danh sách nhóm trong hai khu; điện thoại xếp dọc. Giáo viên lọc Tất cả/Chưa nộp/Đã nộp, đổi đại diện và xem lịch sử ngay trong thẻ nhóm. Học sinh xem nhóm mình, form nộp chỉ hiện cho đại diện trước hạn. Trạng thái dùng cả màu và chữ; nghiệp vụ tại [group-activities.md](group-activities.md).

Sau gia hạn ít nhất một lần và hết hạn mới, học sinh xem các nhóm/sản phẩm trong cùng hoạt động; nút **Trao đổi & phản biện** mở dialog câu hỏi/góp ý và phản hồi gắn phiên bản sản phẩm. Nhóm khác đặt ý kiến, nhóm sở hữu trả lời, giáo viên điều phối. Backend cũ thiếu capability không bật luồng mới. Quy tắc chi tiết ở [feedback-discussion.md](feedback-discussion.md).

### Góp ý riêng với giáo viên

Học sinh có **Góp ý với giáo viên**, giáo viên có **Quản lý góp ý** theo lớp. Danh sách tìm/lọc bên cạnh nội dung trao đổi, điện thoại xếp dọc; có người gửi/thời điểm và Chờ phản hồi/Đã phản hồi/Đã xử lý. Giáo viên đóng/mở lại chủ đề; composer giữ nội dung khi lỗi, khóa gửi trong lúc xử lý và dùng mã retry. Không thể hiện đây là góp ý ẩn danh hoặc email ngoài hệ thống. Nghiệp vụ tại [feedback-discussion.md](feedback-discussion.md).

## Ảnh trường logo và minh họa

Ảnh nền mới nhất: `public/assets/nguyen-khuyen-background-v11.png`, lưu bản nguồn và prompt ở `output/imagegen/nguyen-khuyen-background-v11.png` và `nguyen-khuyen-background-v11-prompt.txt`. Chỉnh bằng ImageGen tích hợp từ ảnh v8: bỏ huy hiệu khỏi nền, tăng cỡ dòng “TRƯỜNG THPT NGUYỄN KHUYẾN”, rồi đẩy cao thêm theo vùng người dùng đánh dấu. Bản v11 có tên trường lớn sát vùng trời phía trên, chừa lề và giữ dấu tiếng Việt. Giữ bố cục hai dãy lớp hình chữ V, phượng đỏ, không có cổng; cột cờ ở vị trí đã chọn. V8/v9/v10 và prompt giữ lại để đối chiếu.

Ảnh trường dùng cả đăng nhập và các trang bên trong. **CSS hiện hành** là `src/garden.css` nạp sau styles/design tại `src/main.tsx`: cả hai nền blur **2 px**, ảnh v11 căn giữa phía trên và `cover`. Bên trong phủ gradient kem `#faf9f3dd` → `#faf9f3f2` tại70%; nền cố định `inset:0`. Các giá trị login1px/bên trong3px/phủ89,8% là cấu hình trước thiết kế khu vườn, đã bị override; không dùng làm thông số hiện tại. Lớp nền không nhận tương tác, chữ/thẻ/form vẫn rõ. Ảnh `.local/ui-school-v11/` là bằng chứng lượt trước, không phải QA mới sau lần rà soát tài liệu này.

Logo trường riêng vẫn hiển thị cạnh tên GreenEdu ở đăng nhập và sidebar của cả ba vai trò, qua `Logo school`. `.school-crest` tiếp tục cắt huy hiệu bằng CSS từ ảnh v8 `public/assets/nguyen-khuyen-background.png` (x=832, y=70, cạnh 166 px trên ảnh 1672×941); không dùng ảnh nền v11 đã bỏ huy hiệu. Dòng phụ ghi “THPT NGUYỄN KHUYẾN”. Logo 58 px ở đăng nhập/48 px ở sidebar desktop, 48/38 px trên mobile; có alt tiếng Việt. Giữ nguyên ảnh v8 để logo riêng luôn đúng.

Minh họa cây/mầm từ sách: `public/assets/knowledge-garden-v1.webp` khoảng 277 KB; ảnh gốc `.png` cùng tên. Prompt `output/imagegen/knowledge-garden-v1-prompt.txt`. `GardenIllustration` dùng ở đăng nhập, tổng quan và banner Admin; không thay cây cấp độ SVG vì cây đó phản ánh tiến độ.

## Avatar

### Icon cấp học sinh theo lớp/môn — 11/10/2026

Bộ năm icon SVG riêng theo tên mới người dùng chọn: **Mầm → Chồi → Cây Non → Đơm Hoa → Kết Trái**, triển khai tại `src/StudentLevel.tsx`, CSS tại `src/student-level.css`. Mầm là hạt nảy mầm, Chồi có hai lá nhỏ, Cây Non có thân/tán nhỏ, Đơm Hoa có hoa hồng nhạt/nhụy vàng trên tán, Kết Trái có quả vàng cam và lá nhỏ trên tán lớn. Dùng nền tròn xanh nhạt, nét xanh rừng, thân màu đất, cùng hệ màu ứng dụng. SVG có nhãn đọc được “Cấp N · tên cấp”; không phụ thuộc ảnh tải ngoài. Bộ Mầm/Chồi/Lá/Cây/Đại thụ trước đây là lịch sử, đã thay tên/hình cho cấp 3–5.

Huy hiệu nhỏ nằm cạnh thông tin học sinh trên thanh tài khoản, trong danh sách lớp và xếp hạng. Thẻ cấp độ ở trang học sinh/Tài khoản cho thấy icon lớn, tên lớp/môn, năm bước, mốc giờ và tiến độ tới cấp tiếp theo. Bước hiện tại có viền/nền và `aria-current`; thanh tiến độ có nhãn/giá trị. Điện thoại ≤600 px chia năm bước thành ba cột/hai hàng, giữ chữ 13 px và hiển thị đủ cả năm mốc. Cấp độ đổi theo lớp/môn được chọn; avatar cá nhân vẫn hiển thị cùng huy hiệu.

Quy tắc thời gian và phân tách lớp/môn tại [student-levels.md](student-levels.md). Ảnh kiểm tra `.local/ui-<desktop|mobile>-student-level-<1..5>.png`.

Bộ 40 avatar chibi gồm 16 giáo viên, 8 học sinh và 16 thiên nhiên. Ảnh atlas: `public/assets/avatars-teachers-v1.png`, `avatars-students-v1.png`, `avatars-nature-v1.png`. Prompt tại `output/imagegen/avatars-v1-prompts.txt` và `avatars-nature-v1-prompt.txt`; danh mục tại `shared/avatars.ts`, hiển thị tại `src/Avatars.tsx`.

Giáo viên thấy cả 40; học sinh thấy 24 avatar học sinh/thiên nhiên. Bộ thiên nhiên gồm hạt/mầm/chồi/lá/tre/cây/hoa/sen đá; lọc theo bộ và có xem trước. Ảnh tự tải căn giữa trong khung tròn; có xem trước/hủy/thay ảnh/dùng lại/chữ viết tắt. Avatar hiển thị trên thanh tài khoản, hồ sơ, danh sách tài khoản/học sinh và thành viên nhóm. Giới hạn file, quyền API, migration và cách lưu nằm ở `docs/user-avatars.md`.

## Đề mục và giao diện ôn thi

Theo yêu cầu mới, các đề mục dùng **Trang**: Trang quản trị, Trang giáo viên, Trang học tập, Trang cộng tác và Trang học tập xanh. Quy tắc áp dụng sidebar, breadcrumb, lời giới thiệu và đề mục tổng quan.

src/Learning.tsx / src/learning.css dùng thẻ cấp độ/điều kiện/vé, ma trận và lịch thi, danh sách kết quả/thưởng. Desktop phòng thi có danh sách số câu bên trái; mobile đưa danh sách lên trên. Đáp án đã chọn và câu hiện tại có trạng thái riêng; đồng hồ và trạng thái lưu đặt ở đầu. Câu trả lời/lời giải dùng cùng thành phần luyện tập hiện có.

## Kiểm tra khi thay đổi giao diện

Kiểm tra desktop 1440 px, tablet 768 px và mobile 390/360 px: không tràn ngang, font/ảnh tải được, modal thao tác được, trạng thái lỗi/trống/tải không mất bố cục. Kiểm tra cả ba vai trò và trang đăng nhập; chọn/lưu/tải lại avatar và đường dẫn nội bộ. Ảnh kiểm tra nằm trong `.local/`, không đưa vào Git.

Các thư mục kiểm tra đã dùng: `.local/ui-design/`, `.local/ui-school-background/`, `.local/ui-*-quick-login.png`, `.local/ui-*-avatar-upload-*.png`, `.local/ui-*-avatars-nature-*.png`. Khi server đang chạy, build thử vào `.local/<tên-build>` và dùng `E2E_DIST_DIR`, không thay `dist` trước khi backend được deploy tương ứng.

## Lịch sử và tài liệu nguồn

**Toàn bộ nội dung sau đây là lịch sử, không phải hướng dẫn vận hành hiện hành.** Các lệnh tự deploy/địa chỉ3002/ảnh chỉ login/blur cũ trong đoạn lưu trữ đã được thay bởi quyết định ở đầu tài liệu và [dev-railway.md](dev-railway.md). Giữ để đối chiếu, không khôi phục lại hoặc thực thi chỉ từ đoạn này.

Ảnh/prompt trong `output/imagegen/` giữ nguyên để đối chiếu. Các ghi chú thiết kế trước đây trong tài liệu bàn giao/tiến độ được gom ở phần dưới, mang tính lịch sử; trạng thái deploy thực tế luôn theo `docs/session-handoff.md` và script deploy.

### Ghi chú từ docs/session-handoff.md

#### Nền trường trong các trang bên trong — 11/10/2026

Theo yêu cầu mới nhất, ảnh trường cũng làm background cho các trang sau đăng nhập (Admin/giáo viên/học sinh), thay cho lựa chọn cũ chỉ dùng ở đăng nhập. `src/design.css` thêm lớp nền cố định `.app-shell::before`, dùng ảnh `nguyen-khuyen-background.png`, blur 5 px và phủ sáng khoảng 92%. Chỉ ảnh nền bị làm mờ; chữ, thẻ, bảng và biểu mẫu giữ rõ nét. Lớp nền không nhận tương tác.

Build vào `.local/school-background-build` đạt. Đã rà soát Admin/giáo viên/học sinh, các trang chức năng và modal trên desktop 1440 px/mobile 390 px bằng database riêng, không tràn ngang/lỗi JavaScript. Ảnh kiểm tra ở `.local/ui-school-background/`. Chưa deploy thay đổi này; không thay `dist` đang chạy, không ghi database chính hoặc restart server.

### Ghi chú từ docs/session-handoff.md

#### Làm mới giao diện bằng ImageGen — 11/10/2026

Theo yêu cầu thiết kế giao diện, đã đọc bối cảnh và giữ checkout/staging hiện có. Thêm `src/design.css` sau CSS cũ: sidebar xanh rừng trên desktop, nền trắng xanh sáng, chữ và nút rõ hơn, thẻ thống kê/chương học và giao diện Admin đồng bộ. Mobile giữ điều hướng cuộn ngang, thẻ chương một cột ở màn hình nhỏ và tài khoản dạng thẻ. Điều hướng có `aria-current`.

ImageGen tích hợp tạo minh họa cây/mầm non mọc từ sách, nền trong suốt. Ảnh gốc ở `public/assets/knowledge-garden-v1.png`; bản dùng trong app `public/assets/knowledge-garden-v1.webp` khoảng 277 KB. Prompt đầy đủ ở `output/imagegen/knowledge-garden-v1-prompt.txt`. Component `GardenIllustration` dùng trên đăng nhập, tổng quan giáo viên/học sinh và banner Admin. Cây tiến độ vẫn dùng SVG theo cấp thực tế; ảnh trường cũ vẫn chỉ ở trang đăng nhập.

Kiểm tra: TypeScript/Vite build đạt; 18/18 E2E desktop/mobile đạt bằng database riêng. Rà soát thêm đăng nhập/Admin/giáo viên/học sinh và các phân hệ ở 1440/768/390/360 px, không tràn ngang hoặc lỗi JavaScript; ảnh đã giải mã và tải thành công. Ảnh rà soát tại `.local/ui-design/`. Sandbox Windows chặn realpath của Vite và lượt chạy trình duyệt; các lệnh cần thiết đã chạy thành công qua escalation. Không ghi dữ liệu thử vào database chính.

Trạng thái kiểm tra mới nhất: `npm run deploy:status` báo **stopped (no managed server)**. Ghi chú “đang chạy cổng 3002” bên dưới là lịch sử, không còn là xác nhận hiện tại. Lần này chỉ sửa/build/kiểm thử giao diện, chưa chạy deploy, không commit/push. Khi người dùng yêu cầu triển khai, chạy `npm run deploy` theo AGENTS.md và kiểm tra URL/cổng thực tế.

### Ghi chú từ docs/project-status.md

Ngày 11/10 làm mới giao diện theo yêu cầu: sidebar xanh rừng, thẻ thống kê/chương học, biểu mẫu đăng nhập và giao diện Admin đồng bộ trong `src/design.css`. ImageGen tích hợp tạo minh họa khu vườn mọc từ trang sách; app dùng ảnh WebP nền trong suốt khoảng 277 KB. Giữ ảnh trường chỉ ở trang đăng nhập và cây tiến độ SVG theo dữ liệu. Build đạt, 18/18 E2E đạt; rà soát thêm 1440/768/390/360 px không tràn ngang/lỗi JavaScript, database thử riêng. Ảnh xem trước tại `.local/ui-design/`; prompt tại `output/imagegen/knowledge-garden-v1-prompt.txt`. Chưa deploy đợt giao diện này. Kiểm tra mới nhất `npm run deploy:status` báo **stopped (no managed server)**, thay cho mô tả “đang chạy” ở các ghi chú lịch sử bên dưới.

### Ghi chú từ docs/project-status.md

#### Ảnh nền trường — 10/10/2026

- Đã dùng ảnh đã chọn `output/imagegen/nguyen-khuyen-background-header-v8.png` làm nền **chỉ trang đăng nhập**, bản phục vụ giao diện ở `public/assets/nguyen-khuyen-background.png`. Sau khi đăng nhập, các trang học tập/quản lý dùng nền sáng như trước theo lựa chọn mới nhất của người dùng.
- CSS làm mờ riêng lớp nền `1.5px` và phủ màu sáng; chữ, biểu mẫu và nút giữ nguyên độ nét. Ảnh hiển thị theo chiều rộng để không cắt tên trường/logo, các vùng ngoài ảnh dùng nền sáng. Hai khối đăng nhập có nền trong nhẹ để thấy ảnh bên dưới.
- `npm run build` đạt. Đã kiểm tra trực quan trang đăng nhập desktop/mobile và trang giáo viên với dữ liệu API giả chỉ phục vụ kiểm tra giao diện: ảnh tải được, không tràn ngang và không có lỗi JavaScript. Không chạy lại demo hoặc thay đổi database.

### Lưu trữ từ docs/session-handoff.md khi gom tài liệu

#### Tăng độ hiện nền và logo trường — 11/10/2026, 10:13

Đã tăng độ hiện của nền bên trong thêm 30% tương đối: độ hiện từ 7,84% lên 10,2%, lớp phủ sáng từ `#eb` xuống `#e5`, vẫn blur 5 px. Đăng nhập và sidebar Admin/giáo viên/học sinh dùng `Logo school`, hiển thị huy hiệu từ ảnh trường đã chọn cạnh GreenEdu và tên trường. Cắt bằng CSS để giữ đúng huy hiệu trong ảnh hiện có; chi tiết/tọa độ tại `docs/app-design.md`. Không tạo lại logo bằng AI.

Build riêng đạt; rà soát các trang/biểu mẫu/modal của cả ba vai trò ở 1440/768/390/360 px bằng database riêng: logo tải được, không tràn ngang/lỗi JavaScript. Ảnh tại `.local/ui-school-brand/`. Đã tự chạy `npm run deploy` theo quyền thường trực, bản **http://localhost:3002**, PID khi kiểm tra 91992, `demo:false`, `quickLogin:true`. Backup `.local/backups/database-20261011-101333-212.sqlite`. Build/deploy/status/health đạt, HTML khớp build, ảnh trường và CSS logo/nền mới được phục vụ đúng. Không ghi dữ liệu thử vào database chính, không commit/push.

### Lưu trữ từ docs/session-handoff.md khi gom tài liệu

#### Avatar học sinh/giáo viên — 11/10/2026

Tiếp tục theo yêu cầu thêm mầm/chồi/lá/cây: bộ sưu tập hiện có **40 avatar**, thêm 16 chibi thiên nhiên cho cả học sinh và giáo viên. Thêm nút lọc **Mầm, chồi & cây** và các bộ khác để dễ chọn trên điện thoại; thứ tự bộ đầu tiên theo vai trò được giữ. Ảnh nguyên bản image_gen tại `public/assets/avatars-nature-v1.png`, prompt tại `output/imagegen/avatars-nature-v1-prompt.txt`. API dùng danh mục chung nên lưu được ID mới, không cần đổi database. Build và kiểm thử API danh mục/lưu/quyền sở hữu/giữ dữ liệu đạt. Chưa deploy.

Kiểm tra bổ sung bộ thiên nhiên: 4/4 E2E desktop/mobile đạt, gồm lọc/xem trước/lưu/tải lại/khôi phục; ảnh giao diện tại `.local/ui-*-avatars-nature-*.png` đã được rà soát. Database riêng, không ghi vào database chính.

Đã bổ sung 24 avatar chibi: 16 chủ đề giáo viên và 8 học sinh. Trang Tài khoản có chọn/xem trước/lưu/khôi phục chữ viết tắt; bấm avatar trên thanh đầu trang để mở. Bộ giáo viên được đặt trước cho giáo viên, bộ học sinh trước cho học sinh. Lựa chọn được lưu riêng theo tài khoản và hiển thị ở hồ sơ, danh sách học sinh, danh sách tài khoản Admin và thành viên nhóm. Xem `docs/user-avatars.md`.

Migration thêm bảng `user_avatars`, không thay schema tài khoản hoặc dữ liệu học tập. API chỉ cập nhật avatar của người đăng nhập và kiểm tra ID theo danh mục. Ảnh atlas nguyên bản do image_gen tạo ở `public/assets/avatars-teachers-v1.png` và `avatars-students-v1.png`; prompt ở `output/imagegen/avatars-v1-prompts.txt`.

Build đạt, 39 backend tests đạt, 4 kịch bản avatar desktop/mobile đạt; đã xem ảnh giao diện. Database kiểm thử riêng. Lần kiểm tra `npm run deploy:status` trong phiên này trả “GreenEdu is stopped (no managed server)”, khác với trạng thái triển khai trong bàn giao cũ bên dưới. Chưa chạy deploy cho thay đổi avatar; kiểm tra status thực tế khi tiếp tục. Giữ các thay đổi có sẵn, không commit/push.

### Lưu trữ từ docs/session-handoff.md khi gom tài liệu

Ảnh nền đã chọn là `output/imagegen/nguyen-khuyen-background-header-v8.png`, được phục vụ ở `public/assets/nguyen-khuyen-background.png`. Theo lựa chọn mới nhất của người dùng, ảnh nền **chỉ xuất hiện trên trang đăng nhập**, các trang sau đăng nhập dùng nền sáng. `src/styles.css` áp dụng lớp nền riêng cho `.login-page`, làm mờ `1.5px`, phủ sáng và hiển thị theo chiều rộng để không cắt tên trường/logo. Build và kiểm tra trực quan đăng nhập desktop/mobile, giao diện giáo viên đã đạt; dữ liệu API giả chỉ dùng trong kiểm tra giao diện.

### Lưu trữ từ docs/session-handoff.md khi gom tài liệu

- Nhóm đã có thẻ tổng quan, tìm kiếm, lọc trạng thái, tiến độ nộp, hạn nộp nổi bật, bố cục riêng cho yêu cầu và danh sách nhóm, bộ lọc nhóm chưa/đã nộp, avatar thành viên và lịch sử sản phẩm. Giữ nguyên chia nhóm, quyền đại diện, file/Word, deadline theo server, retry và gia hạn.

### Lưu trữ từ docs/session-handoff.md khi gom tài liệu

- Rà soát các trang giáo viên/học sinh trên desktop/mobile bằng API thật. Tăng cỡ chữ điều hướng, bảng/câu hỏi/chương/tiến độ; thẻ chương một cột trên điện thoại nhỏ; tài khoản Admin dạng thẻ trên mobile. Ảnh nền vẫn chỉ ở trang đăng nhập.

### Lưu trữ từ docs/project-status.md khi gom tài liệu

Ngày 11/10 lúc 10:13 đã tăng độ hiện nền trường bên trong thêm 30% (7,84% → 10,2%, giữ blur 5 px), đặt logo trường cạnh GreenEdu ở đăng nhập và sidebar cả ba vai trò. Giữ huy hiệu từ ảnh đã chọn qua CSS, không tái tạo bằng AI. Build và rà soát 1440/768/390/360 px với database riêng đạt. Đã deploy tại **http://localhost:3002**, status/health/frontend/ảnh/CSS mới đạt; `demo:false`, `quickLogin:true`, PID 91992 khi kiểm tra. Backup `.local/backups/database-20261011-101333-212.sqlite`. Thiết kế chi tiết tại [app-design.md](app-design.md).

### Lưu trữ từ docs/project-status.md khi gom tài liệu

Ngày 11/10 theo yêu cầu mới, bổ sung ảnh trường làm nền rất mờ trên các trang sau đăng nhập cho cả 3 vai trò: blur 5 px, phủ sáng khoảng 92%, nội dung/thẻ/bảng giữ rõ nét. Lựa chọn này thay cho quy tắc cũ chỉ dùng nền trường ở đăng nhập. Build riêng `.local/school-background-build` đạt; rà soát desktop/mobile bằng database riêng không tràn ngang/lỗi JavaScript. Chưa deploy, không thay frontend `dist` đang chạy. Ảnh kiểm tra ở `.local/ui-school-background/`.

### Lưu trữ từ docs/project-status.md khi gom tài liệu

Ngày 11/10 mở rộng bộ avatar lên **40 lựa chọn**: thêm 16 chibi mầm, chồi, lá, tre, cây, hoa và sen đá cho giáo viên/học sinh. Trang Tài khoản có lọc theo bộ sưu tập, gồm **Mầm, chồi & cây**. Giữ nguyên avatar đã chọn trước đó; không cần migration mới. Ảnh/prompt và cách dùng ở [avatar tài khoản](user-avatars.md). Chưa deploy đợt bổ sung này.

### Lưu trữ từ docs/project-status.md khi gom tài liệu

- **Giao diện chung:** tăng cỡ chữ quá nhỏ ở điều hướng, bảng, lựa chọn/câu hỏi, chương và tiến độ. Thẻ chương một cột trên màn hình nhỏ; danh sách tài khoản có thẻ mobile hiển thị đủ trạng thái/thao tác. Rà soát các trang tổng quan, lớp, câu hỏi, luyện tập, sửa sai, tiến độ, vườn, xếp hạng, tài khoản và nhóm trên desktop/mobile; không phát hiện tràn ngang hoặc lỗi JavaScript trong các luồng đã chạy. Ảnh nền chỉ trang đăng nhập.

### Lưu trữ từ docs/user-avatars.md khi gom tài liệu

# Avatar tài khoản

Cập nhật 11/10/2026.

Giới hạn upload hiện tại là **3 MB**, đã tự deploy tại **http://localhost:3002** lúc 10:12 ngày 11/10/2026. Build, 2/2 kiểm thử API và 4/4 E2E desktop/mobile đạt; API nhận đúng 3 MB và từ chối vượt 1 byte, trình duyệt tải/lưu ảnh PNG 2,5 MB thành công. Kiểm thử dùng database riêng; health và kiểm tra dữ liệu sau deploy đạt.

Đã triển khai cả tải ảnh cá nhân và giới hạn avatar theo vai trò tại **http://localhost:3002** lúc 10:05 ngày 11/10/2026. Các ghi chú “chưa deploy” trong kết quả kiểm thử bên dưới là trạng thái lịch sử trước lần triển khai này. Theo yêu cầu hiện tại, agent tự deploy sau khi hoàn tất thay đổi ứng dụng và kiểm thử đạt.

Học sinh và giáo viên vào **Tài khoản → Avatar của bạn**, chọn hình để xem trước rồi bấm **Lưu avatar**. Có thể bấm avatar trên thanh đầu trang để mở trang này. Chọn **Dùng chữ viết tắt** rồi lưu nếu muốn khôi phục kiểu cũ.

#### Tải ảnh cá nhân

Trong bản mã mới, bấm **Tải ảnh của bạn**, chọn ảnh, xem trước rồi **Lưu avatar**. Hỗ trợ JPG, PNG, WebP tối đa 3 MB (3 × 1024 × 1024 byte) và 4096 × 4096 pixel. Ảnh được căn giữa trong khung tròn; file gốc không được chỉnh sửa. Có thể hủy ảnh đang chọn, chọn avatar trong bộ sưu tập hoặc dùng lại **Dùng ảnh đã tải**. Tải ảnh mới thay ảnh cá nhân trước đó; mỗi tài khoản lưu một ảnh cá nhân.

API `POST /api/auth/avatar/upload` nhận multipart với một trường file `avatar`, kiểm tra dung lượng/chữ ký ảnh/kích thước và cập nhật ảnh/lựa chọn trong cùng transaction. Ảnh lưu trong bảng `avatar_uploads` nên backup database bao gồm ảnh; migration chỉ thêm bảng. `GET /api/avatars/:id` yêu cầu đăng nhập, cho phép chủ ảnh, Admin và thành viên/giáo viên có lớp chung xem. ID ảnh mới sau mỗi lần thay giúp giao diện tải đúng ảnh. Người khác không thể dùng ID ảnh tải lên của tài khoản khác để thay avatar của mình.

Kiểm tra tải ảnh: build đạt, 44 backend tests đạt, 4/4 E2E desktop/mobile đạt (PNG/JPG, xem trước/lưu/tải lại, giữ ảnh cá nhân khi chọn bộ sưu tập, chọn lại ảnh cũ, khôi phục và lỗi file). Kiểm tra API gồm WebP, phân quyền, khác nguồn, quá dung lượng, sai định dạng/nhiều file/trường thừa, ảnh thay thế và giữ dữ liệu sau mở lại database. Đã rà soát ảnh giao diện. Chưa deploy phần tải ảnh; server cổng 3002 đang dùng bản 40 avatar trong bộ sưu tập.

- Bộ sưu tập có 40 avatar: 16 chibi giáo viên, 8 chibi học sinh và 16 chibi thiên nhiên. Giáo viên chọn được cả 40; học sinh chỉ thấy/chọn 24 avatar học sinh và thiên nhiên, vẫn dùng được ảnh cá nhân. Bộ giáo viên được ẩn hoàn toàn khỏi học sinh. Dùng các nút lọc để mở riêng một bộ, hoặc **Tất cả** để xem các lựa chọn dành cho vai trò của mình.
- Bộ **Mầm, chồi & cây** gồm hạt mầm, mầm hai lá, chồi non, búp lá, lá tim, lá phong, trầu bà, chồi tre, chậu cây, bụi cây, cây non, cây xanh, cây hoa, hướng dương, sen đá và hạt sồi nảy mầm.
- Chủ đề giáo viên gồm áo dài/sách, Toán, Hóa, Vật lý, Ngữ văn, Lịch sử, Ngoại ngữ, Tin học, Âm nhạc, Mỹ thuật, Tiểu học, Thể dục, gieo mầm và chủ nhiệm.
- Avatar được giữ sau tải lại, đăng nhập lại và khởi động lại server. Hiển thị ở hồ sơ, danh sách học sinh, danh sách tài khoản Admin và thành viên nhóm. Tài khoản cũ tiếp tục dùng chữ viết tắt đến khi tự chọn hình.
- API `POST /api/auth/avatar` chỉ cập nhật tài khoản đang đăng nhập; nhận `avatarId` trong danh mục được phép, ID ảnh tự tải của chính tài khoản hoặc `null` để khôi phục. Học sinh gửi ID avatar giáo viên bị từ chối 403, kể cả tự gửi vai trò giáo viên trong body. Không nhận URL ảnh tùy ý. Tài khoản có mật khẩu tạm phải đổi mật khẩu trước.
- Khi mở database bằng mã mới, lựa chọn avatar giáo viên của học sinh từ trước quy tắc này được xóa để về chữ viết tắt. Avatar hợp lệ khác, tài khoản và tiến độ giữ nguyên. Quy tắc đã áp dụng trong bản triển khai lúc 10:05 ngày 11/10.
- Migration thêm bảng `user_avatars`, không đổi schema `users`, mật khẩu, vai trò hay tiến độ. Lựa chọn avatar không thay đổi vai trò tài khoản.

Ảnh được tạo bằng công cụ image_gen tích hợp, dùng nguyên bản dưới dạng atlas CSS: [giáo viên](../public/assets/avatars-teachers-v1.png), [học sinh](../public/assets/avatars-students-v1.png). Prompt lưu tại [avatars-v1-prompts.txt](../output/imagegen/avatars-v1-prompts.txt). Danh mục dùng chung cho giao diện/API tại `shared/avatars.ts`.

Ảnh thiên nhiên: [avatars-nature-v1.png](../public/assets/avatars-nature-v1.png), tạo bằng image_gen tích hợp; [prompt](../output/imagegen/avatars-nature-v1-prompt.txt). Mỗi bộ khai báo ảnh/số hàng atlas trong danh mục chung; giữ nguyên ID và ảnh của 24 avatar trước.

Kiểm tra: build đạt; 39 kiểm thử backend đạt; 4 kịch bản avatar desktop/mobile đạt, bao gồm chọn/lưu, tải lại, khôi phục, tải ảnh và bố cục không tràn ngang. Kiểm thử dùng database riêng.

Sau khi thêm bộ thiên nhiên: build đạt, kiểm thử API chạy qua toàn bộ 40 ID đạt; 4/4 kịch bản desktop/mobile đạt thêm lọc bộ thiên nhiên, xem trước, chọn/lưu avatar mới, tải lại giữ lựa chọn và khôi phục. Đã rà soát ảnh giao diện; không tràn ngang. Chưa deploy.

Sau khi giới hạn avatar theo vai trò: 45 backend tests và 4/4 E2E desktop/mobile đạt. Kiểm tra toàn bộ 16 ID giáo viên bị chặn cho học sinh, giữ avatar hiện tại sau yêu cầu bị từ chối; migration giữ avatar hợp lệ và tiến độ. UI học sinh không có bộ/nút/avatar giáo viên; thiên nhiên và upload vẫn hoạt động. Build kiểm thử ở `.local/avatar-role-build`, không thay `dist` đang được phục vụ.

### Lịch sử thiết kế v11 từ bàn giao

#### Áp dụng ảnh nền v11, tên trường lớn và cao hơn — 11/10/2026, 10:32

Theo chuỗi yêu cầu mới nhất, đã dùng ImageGen tích hợp bỏ huy hiệu khỏi ảnh nền, tăng cỡ tên trường, đẩy tên lên vùng đánh dấu rồi tăng/cao thêm theo phản hồi. Ảnh cuối `public/assets/nguyen-khuyen-background-v11.png`; nguồn/prompt ở `output/imagegen/nguyen-khuyen-background-v11.png` và `nguyen-khuyen-background-v11-prompt.txt`. Giữ logo riêng ở đăng nhập/sidebar lấy từ ảnh v8 cũ. Nền bên trong giảm blur 5→3 px, đăng nhập 1,5→1 px; giữ phủ sáng bên trong 89,8%. Desktop/tablet hiển thị ảnh theo chiều rộng và bắt đầu dưới thanh đầu trang để không cắt/che tên trường.

Build riêng và rà soát cuối đăng nhập/cả ba vai trò/các trang/modal ở 1440/768/390/360 px đạt: ảnh/logo tải đúng, không tràn ngang/lỗi JavaScript, database thử riêng. Ảnh kiểm tra `.local/ui-school-v11/`. Đã chạy `npm run deploy` theo yêu cầu áp dụng và quyền thường trực: **http://localhost:3002**, PID 92576 khi kiểm tra, `demo:false`, `quickLogin:true`. Backup `.local/backups/database-20261011-103225-851.sqlite`. Build/status/health đạt, HTML khớp build, CSS và ảnh v11 được phục vụ đúng. Không ghi dữ liệu thử vào database chính, không commit/push. V9 đã được deploy trước khi người dùng tiếp tục chỉnh vị trí, hiện thay bởi v11; các ảnh/prompt trung gian giữ để đối chiếu.

### Lịch sử từ tiến độ

Ngày 11/10 lúc 10:32 đã áp dụng ảnh nền **v11** theo phản hồi: bỏ logo trong nền, tên trường lớn và cao sát vùng trời trên; giữ logo riêng ở đăng nhập/sidebar. Blur giảm còn 3 px bên trong/1 px đăng nhập. Build và rà soát 4 kích thước desktop/tablet/mobile bằng database riêng đạt. Đã deploy tại **http://localhost:3002**, PID 92576 khi kiểm tra, `demo:false`, `quickLogin:true`; status/health/frontend/CSS/ảnh cuối đạt. Backup `.local/backups/database-20261011-103225-851.sqlite`. Nguồn/prompt và cấu hình tại [app-design.md](app-design.md).

### Lịch sử bộ avatar từ tiến độ

Ngày 11/10 bổ sung bộ 24 avatar chibi (16 giáo viên, 8 học sinh), tự chọn/xem trước/lưu/khôi phục ở Tài khoản. Avatar được lưu theo người dùng và hiển thị ở hồ sơ, danh sách học sinh, danh sách tài khoản và thành viên nhóm. Bộ giáo viên được ưu tiên cho giáo viên. Build, 39 kiểm thử backend và 4 kịch bản avatar desktop/mobile đạt; dùng database riêng. Xem [avatar tài khoản](user-avatars.md). Chưa deploy thay đổi này; kiểm tra trạng thái trong phiên avatar trả “stopped (no managed server)”, nên dùng `npm run deploy:status` để xác nhận thực tế thay vì dựa vào ghi chép triển khai cũ bên dưới.
