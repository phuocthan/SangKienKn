# Bàn giao session GreenEdu

## Đăng nhập theo ảnh: tiêu đề trước, form nâng lên, Quên mật khẩu — 12/10/2026

Yêu cầu mới đã hoàn tất: Login đưa h1 trước slogan, h2 form trước badge; xóa hai dòng intro Một nơi để học…/Và để thấy mình… được đánh dấu. Thêm login.css nạp cuối trong main.tsx, chỉ scope login: desktop dùng cùng mốc đầu cho tiêu đề/frame (không margin:auto), mobile bỏ min-height290px/gap dư và căn cạnh trái22px. Giữ mô tả Đăng nhập để tiếp tục…/asset/copyright và luồng auth hiện có.

Thay forgot-hint bằng nút Quên mật khẩu, type=button/aria-haspopup=dialog. Modal dùng component hiện có, thông báo đúng **Liên hệ với giáo viên chủ nhiệm, hoặc admin để cấp lại**; Đã hiểu/Đóng/Escape, focus restore, fields giữ nguyên. Không thêm reset API/email/quyền production, không gọi auth khi chỉ mở/đóng popup.

**Kiểm tra mới đúng checkout push** .local/forest-push-checkout: TypeScript/Vite build .local/warm-journey-push-build và **8/8 E2E** login-layout/account-popups desktop/mobile đạt trên server/SQLite riêng3331. Hai ca login-layout kiểm tra4 viewport320/390/768/1440 mỗi project, h1/h2 trên chữ nhỏ, đoạn xóa không còn, đầu frame khớp desktop/cạnh trái và gap mobile/không tràn. Popup đúng nội dung, Escape/Đã hiểu/focus và fields giữ nguyên, không request ghi trước đăng nhập, sau đó đăng nhập fixture thành công. Health chỉ được stub demo/quickLogin=false trong test để xem layout production; không sửa capability thật. Đã xem ảnh390/1440 và modal, không chạy test trên Railway/database chính.

Push riêng App/main/login.css/test và ba phần tài liệu;14 file công việc song song bảo toàn theo manifest .local/login-layout-preserved.json. Kết quả push thực tế ghi sau hoàn thành; runtime Railway chưa xác minh.

## Bỏ breadcrumb và nâng cụm tiêu đề trên mọi trang — 12/10/2026

Theo ảnh Xếp hạng, đã mở rộng cách đặt tiêu đề lên đầu từ Home sang tất cả trang giáo viên/học sinh. WorkspaceFrame/WorkspaceHeadingSlot/WorkspaceHeading mới dùng React context/portal: một cụm tiêu đề + chữ nhỏ + mô tả + thao tác ở header desktop, trở lại nội dung trên compact/portrait; không nhân đôi heading. Bỏ breadcrumb/pageNames/homeHeading và CSS Home ẩn/hiện hai bản. Header account/lớp/menu portrait giữ; wrap tại900px, minh họa nhóm gọn ở desktop. PageHeading/App, cộng đồng, nhóm, góp ý (h1), Learning/ExamRoom, thanh Practice đều dùng chung; modal và thẻ hoàn thành giữ nội dung riêng. Không thay backend/API/data; Admin không thuộc yêu cầu và giữ giao diện riêng.

**Kiểm tra mới đúng checkout push** .local/forest-push-checkout: TypeScript/Vite build .local/warm-journey-push-build đạt; **4/4 workspace-headings** kiểm tra88 tổ hợp11 trang×2 vai trò×4 viewport1440/900/390/768 và xoay đạt (không breadcrumb, chỉ1 h1, desktop heading trong header ở y≤40, mobile heading trong main, không tràn). Rà regression **24/26 đạt lượt đầu** account/portrait/warm-journey/learning/online/groups/feedback;2 góp ý thất bại vì test cũ đếm cả nút pause note và mong mục đầu là Góp ý. Đổi selector sang các button.nav-item trực tiếp, không bỏ assertion menu; **2/2 góp ý chạy lại đạt**. Tổng30 ca tương ứng đã xác nhận, không nói26/26 một lượt. Test trang mới từng được ngắt để sửa helper chỉ điều hướng9 mục chính, các utility góp ý/tài khoản dùng nút hiện hành. Không đổi hành vi sản phẩm để né lỗi.

Tất cả trên server/SQLite riêng3331; không ghi Railway/database chính. Đã xem ảnh Xếp hạng học sinh desktop/mobile và Nhóm giáo viên, tiêu đề nâng đúng/controls rõ. Local5173/HMR vẫn chạy/API Railway. Learning và online-exams.spec.ts có task song song: chỉ áp dụng import/wrapper heading và selector tiêu đề/đồng hồ trên cả root/checkout remote, không copy toàn file mixed.14 file song song được bảo toàn theo manifest .local/workspace-heading-preserved.json. Push riêng UI/test/ba phần tài liệu; kết quả push thực tế ghi sau hoàn thành, runtime Railway chưa xác minh.

## Đáp án chọn sai đỏ nhạt, đúng xanh — 12/10/2026

Theo ảnh kết quả thi, đã sửa ExamRoom thiếu wrong-choice: lấy kết quả câu hiện tại một lần và gắn class sai cho lựa chọn của học sinh khi câu đã có kết quả sai. Đáp án đúng giữ correct-choice xanh; khi chờ công bố không gắn trạng thái đúng/sai, câu bỏ trống không có lựa chọn sai. styles.css đổi palette wrong-choice chung nền #fff0f0, viền/outline #dda2a2, chữ #9b3f46, ô chữ #c55c66/chữ trắng; thay outline xanh do selected. Dùng chung luyện/ôn/sửa sai/Săn điểm/kết quả thi, không sửa API/điểm/thời điểm công bố.

**Kiểm tra mới đúng checkout push** .local/forest-push-checkout: TypeScript/Vite build .local/warm-journey-push-build và **6/6 E2E** chọn ba luồng learning desktop/mobile đạt trên server/SQLite riêng3331 (practice clock/wrong no-solution; semester/resume/notebook repair; official exam/offline autosave/close/export). Assertion mới xác nhận đáp án chọn đúng/chọn sai/câu bỏ trống/chờ công bố và CSS nền/viền/outline/ô chữ đỏ/đúng xanh. Đã xem ảnh exam-result desktop/mobile. Không ghi thử Railway/database chính, không dùng kết quả cũ thay lượt này.

Learning.tsx có công việc ôn-thi song song: chỉ sửa các dòng result/class trong root và checkout remote, không copy toàn file root để push. Push riêng Learning/styles/test và ba phần tài liệu;14 file công việc song song (Learning gồm chỉnh UI đã chốt) được lưu hash tại .local/answer-colors-preserved.json để bảo toàn sau đồng bộ HEAD/index. Kết quả push thực tế ghi sau hoàn thành; Railway deployment/runtime chưa xác minh.

## Lời nhắn sidebar16 câu/8 minh họa — 12/10/2026

Theo ảnh ô lời nhắn, đã thêm GardenNote dùng chung cho giáo viên/học sinh:16 lời nhắn ngắn và8 hình SVG (cáo/cú/đom đóm/rùa/nhím/sóc/thỏ/gấu), cùng icon outline theo chủ đề. Giữ nền mint/chữ nghiêng/hình ở góc dưới; đổi đồng bộ mỗi10 giây và quay vòng, giữ chiều cao ô để menu không nhảy. Hover/focus/tab nền tạm dừng; nút dừng/tiếp tục giữ qua điều hướng, timer/listener cleanup. Fade300ms, reduced-motion tắt. Portrait vẫn ẩn note, menu9 mục/icon gốc/panel xanh không đổi; không sửa nghiệp vụ/API/database.

**Kiểm tra mới trên đúng checkout push** .local/forest-push-checkout: TypeScript/Vite build .local/warm-journey-push-build và **14/14 E2E** garden-note/warm-journey/portrait-navigation đạt với server/SQLite riêng3331. Clock điều khiển kiểm tra9 giây chưa đổi/10 giây đổi, đủ16 câu8 hình/quay vòng, hover/nút pause/đổi trang/tab nền; đo chữ không đè hình/ô không đổi chiều cao, sidebar900px/reduced-motion, desktop/mobile và ba vai trò navigation. Đã xem contact sheet16 câu, minh họa/chữ rõ. Frontend HMR5173 đang chạy, nguồn GardenNote.tsx200; không ghi dữ liệu thật Railway.

Chuẩn bị push riêng GardenNote/App/CSS/test mới và ba phần tài liệu; giữ nguyên14 file công việc song song theo manifest .local/garden-note-preserved.json. Kết quả push thực tế ghi sau hoàn thành; Railway deployment/runtime chưa xác minh. Các lời nhắn một câu cố định phía dưới là lịch sử.

## Trả panel xanh và đưa icon lên đường lượn — 12/10/2026

Yêu cầu mới nhất đã hoàn tất: bỏ màu cam/vàng phủ panel và CTA, trả frame chung/nền art chương/nút về xanh; chỉ giữ nhấn tên chương và progress cam→vàng. Lời nhắc còn thời gian dùng nền #fff6dd, chữ nghiêng, font-synthesis: style, opacity 0.85. ChapterLevelTimeline thêm wrapper roadmap; rail SVG và icon năm cấp dùng chung hình học, icon xen kẽ cao/thấp bám đúng điểm trên đường, current vòng/nhãn xanh, check/khóa giữ nguyên. Menu phẳng/icon Lucide/header trước giữ nguyên. Không đổi API/database/cách tính cấp/clip phần tô.

**Kiểm tra mới đúng checkout push** .local/forest-push-checkout: TypeScript và Vite build .local/warm-journey-push-build đạt; **20/20 E2E** warm-journey/student-levels/portrait-navigation/account-popups desktop/mobile đạt trên DB/server riêng3331. Test xác nhận tâm icon trùng tick X/Y qua năm cấp, tiến độ0/25/100%, panel/nút xanh, nhắc nghiêng/85%, không tràn ngang, menu/header/tài khoản vẫn hoạt động. Đã xem ảnh desktop và mobile Hành trình. Không dùng kết quả cũ thay lượt này. HMR5173/API Railway đang chạy, không ghi thử dữ liệu thật.

Chuẩn bị push riêng năm file UI/test và ba phần tài liệu mới; không gom các thay đổi backend/nhóm online/Excel/luyện sau nộp từ task song song. Manifest .local/green-roadmap-preserved.json lưu hash14 file đó để xác minh sau đồng bộ HEAD/index; không hard reset/force push. Kết quả push thực tế ghi sau hoàn thành; Railway deployment/runtime chưa xác minh. Các mục cam-vàng toàn khung/nút phía dưới là lịch sử đã thay.

## Đưa góp ý giao diện và tiêu đề Tổng quan lên remote — 12/10/2026

Đợt push riêng **23 file UI/asset/test/tài liệu** từ remote `f7ccb42`: trả menu9 mục/icon Lucide gốc, bỏ accordion/Forest mầm lặp, progress/nhãn/chương/lộ trình cong cam-vàng, sidebar note mint/italic/chậu cây-cáo, banner giữ khẩu hiệu nhưng gọn theo lựa chọn1. Bổ sung ảnh mới: bỏ breadcrumb ở Tổng quan giáo viên/học sinh và đưa khối tiêu đề lên header desktop cạnh account/lớp; portrait giữ tiêu đề trong nội dung/một h1 hiển thị, account/dock neo cũ. Các trang nghiệp vụ khác giữ điều hướng. Chỉ thay Learning import/span icon, không gom nghiệp vụ nhóm thi/Excel/luyện sau nộp/backend của task khác; không force hoặc đưa DB/.local/secrets/file học sinh vào Git.

**Kiểm tra mới trên đúng checkout push:** TypeScript/build `.local/warm-journey-push-build` đạt; **34/34 E2E** sau tinh chỉnh clip đường tô/italic và **20/20 E2E cuối** warm-journey/student-levels/portrait-navigation/account-popups sau thêm header mới đạt trên SQLite/server riêng3331. Hai lượt riêng, không cộng số hoặc dùng kết quả cũ thay lượt cuối. Đã xem ảnh desktop/mobile cuối: icon gốc/menu phẳng, tiêu đề đúng hàng đầu, note italic, đường tô dừng đúng mốc/0–100%; tick căn giữa, cấp riêng từng môn/đổi mốc/đổi lớp, modal/rotate/đăng xuất giữ đúng. Bộ34 của checkout chính ở dưới thuộc trước tinh chỉnh clip/header. Hash14 file công việc song song ở `.local/warm-journey-preserved.json` đã xác minh trước commit. **Deployment/runtime Railway của commit mới chưa xác minh**, kiểm tra SHA remote sau push; trạng thái chuẩn bị ở dưới là lịch sử trước bước Git cuối.

## Góp ý theo ảnh: trả menu/icon gốc và hành trình cam/vàng — 12/10/2026

Yêu cầu mới thay menu gom nhóm: trả9 mục riêng giáo viên/học sinh, không accordion; khôi phục Lucide gốc toàn bộ vị trí ForestIcon và bỏ mầm/đốm sáng gắn thêm. Giữ cây SVG cấp độ vì có ý nghĩa nghiệp vụ. Thêm `learning-journey.css` dùng chung cho progress-track cam→vàng dày/bo tròn, pill tên chương/nhắc còn bao lâu lên tên cấp; timeline5mốc đường lượn, check đã đạt/current vàng/future xám/khoá. Không đổi thời gian/điểm/tiến độ hay API. Sidebar note mint/chữ nghiêng/vector chậu cây-cáo một góc, asset `garden-note-friends.svg`. Theo trả lời1 của người dùng, **giữ câu khẩu hiệu banner nhưng thu gọn**, mô tả nhỏ hơn/nút luyện màu đồng, giữ nút hành trình viền xanh.

TypeScript/build `.local/warm-journey-build` và **34/34 E2E** warm-journey/student-levels/level-settings/portrait-navigation/account-popups/workflow desktop/mobile trên SQLite/server riêng3330 đạt trước tinh chỉnh cuối đường tô/italic. Đã xem ảnh desktop và các cấp: phát hiện dash của SVG non-scaling-stroke có thể vẽ phần tô vượt mốc khi co chiều ngang; đã đổi clip theo % trục ngang, cần QA lại trên checkout push. Giữ số liệu/aria-valuenow,0% không tô/100% đầy đủ, kiểm thử tick-icon dùng đúng SVG cấp thay vì bắt thêm icon khóa. Bỏ ca grouped-navigation vì sản phẩm không còn accordion; navigation helper vẫn dùng chung cho test cũ. Các test/script/build đều riêng, không Railway/database chính.

Các thay đổi ôn-thi/backend/tài liệu đang có vẫn giữ; Learning chỉ tháo wrapper icon/import Forest, phần nhóm/Excel/luyện sau nộp không thuộc đợt này. Chuẩn bị push riêng UI/asset/test/ba phần tài liệu theo yêu cầu push ngay khi xong đã chốt, không force; kết quả kiểm tra đúng checkout/push/deployment ghi sau thực hiện. Thiết kế hiện hành [app-design.md](app-design.md), các mô tả nhóm menu/Forest lá gắn chung phía dưới là lịch sử đã thay.


## Push riêng menu/submenu gọn — 12/10/2026

Theo yêu cầu push ngay sau hoàn thành đã chốt ở lượt trước, đợt này đưa **24 file menu/frontend/test/tài liệu** lên `origin/main` từ checkout riêng `.local/forest-push-checkout` trên remote `9d50b10`. Giữ theme Forest/ntfy và lịch sử remote, không force; không đưa backend/nhóm buổi thi/Excel/luyện tập sau nộp của task song song vào commit. Remote có15 test cũ được đổi lời gọi navigation, helper mới và4 ca grouped-navigation (hai vai trò×desktop/mobile); giữ assertion nghiệp vụ cũ. File online-exams.spec.ts chỉ cập nhật điều hướng, không gom assertion online đang sửa riêng ở checkout chính. Không đưa DB/.local/file học sinh/secrets vào Git.

Kiểm tra **mới trên đúng checkout push**: TypeScript/build `.local/grouped-navigation-push-build` đạt; **30/30 E2E grouped-navigation/portrait-navigation/account-popups/workflow/accounts** desktop/mobile đạt trên SQLite/server riêng3321. Lượt đầu29/30 đã bắt lỗi thật: resize ngay lúc mount có thể xảy ra trước khi đăng ký matchMedia listener, giữ nhầm nav compact. Đã đồng bộ media.matches ngay sau đăng ký listener, build và chạy lại đầy đủ30/30, không sửa quy tắc/test để né lỗi. Lời nhắc font12px cho phép xuống dòng trên sidebar hẹp; đã xem ảnh giáo viên/học sinh/mobile, không tràn ngang. Kết quả30/30 ở checkout chính trước chuẩn bị push bên dưới là lượt trước, không thay kiểm thử này. Hash14 file công việc song song ghi ở `.local/grouped-navigation-preserved.json`, giữ file khi đồng bộ Git sau push. **Railway deployment/runtime của commit menu chưa được xác minh**; xem Git remote để biết SHA cuối, không suy deploy từ push.

## Menu trái gom nhóm thành menu/submenu — 12/10/2026

Theo yêu cầu mới, đã thêm `SidebarNavigation`/CSS: giáo viên4 mục chính Tổng quan/Lớp học/Dạy học & kiểm tra/Khu rừng tri thức, học sinh5 mục chính (Khu vườn của tôi/Hành trình/Học tập/Kiểm tra/Cùng lớp). Nhóm lớp gom lớp và hoạt động nhóm; nhóm dạy học gom ngân hàng/ôn-thi/online; nhóm rừng gom tiến độ/vườn/xếp hạng. Học sinh Học tập có luyện/sửa sai, Kiểm tra có ôn-thi/online, Cùng lớp có nhóm/vườn/xếp hạng. Một submenu mở mỗi lần, auto mở nhóm theo trang khi điều hướng từ nội dung, active item/nút cha riêng. Parent có icon Forest/chevron, con dùng chấm/đường nối; lời nhắc sidebar gọn, tiện ích tài khoản vẫn dưới. Admin giữ menu đơn.

Giữ một navigation DOM; portrait≤1100px hoặc viewport≤700px tiếp tục menu compact phẳng, header/dock/safe area như cũ, xoay vẫn giữ route. Nút cha aria-expanded/aria-controls, đóng dùng hidden, Tab/Enter/Space và Escape đưa focus về cha; badge sửa sai hiện cả nhóm và mục con. Không thay API/backend/database, không tạo dữ liệu giả trong người dùng. `e2e/navigation.ts` hỗ trợ mở nhóm trước điều hướng; cập nhật lời gọi navigation trong16 file test hiện có, không đổi assertion nghiệp vụ. File online-exams.spec.ts và online-exam-groups.spec.ts đang có chỉnh sửa từ task ôn-thi: giữ nguyên phần đó, khi push riêng menu dùng bản remote chỉ đổi lời gọi navigation.

Kiểm tra mới trước chuẩn bị push: TypeScript/build `.local/grouped-navigation-build` đạt; **30/30 E2E** grouped-navigation/portrait-navigation/account-popups/workflow/accounts desktop-mobile trên SQLite/server riêng3320 đạt; gồm bấm/đóng/một nhóm, điều hướng nội dung/active, bàn phím/Escape, ba vai trò, portrait320/390/768/1024 và xoay, các trang và các luồng Word/câu hỏi/luyện/sửa sai/tài khoản vẫn hoạt động. Đã xem ảnh submenu giáo viên và các ảnh học sinh/mobile tại `.local/grouped-navigation-*.png`; không chạy kiểm thử trên Railway. Chỉnh lời nhắc một dòng cuối là CSS thuần, được build/kiểm tra lại trong checkout chuẩn bị push. Local5173 đang chạy/HMR, API/DB Railway vẫn như cũ. Theo yêu cầu push ngay sau hoàn thành đã chốt ở lượt trước, chuẩn bị push riêng UI/test/tài liệu từ remote, giữ task ôn-thi và không force; kết quả push và QA trên đúng checkout sẽ ghi sau bước thực hiện.


## Push theme khu rừng tri thức lên remote — 12/10/2026

Người dùng yêu cầu push ngay khi hoàn thành. Đợt Git đưa **14 file frontend/tài liệu Forest** lên `origin/main`, dùng checkout riêng `.local/forest-push-checkout` bắt đầu từ remote `00a15b9`, giữ commit ntfy và không force push. Learning chỉ đưa ba thay đổi giao diện: import ForestIcon, chữ nhỏ dưới h1 và biểu tượng Thời gian tăng cấp; không gom mã nhóm buổi thi/Excel/luyện tập sau nộp/backend còn ở task song song. Chỉ lấy ba phần tài liệu Forest, giữ lịch sử remote và không đưa `.local`, database, file học sinh hay secrets vào commit.

Kiểm tra **mới trên đúng checkout chuẩn bị push**: TypeScript/build riêng `.local/forest-push-build` và **12/12 E2E portrait-navigation/account-popups desktop/mobile** đạt trên SQLite/server riêng3310; diff check đạt. Bộ12/48 tổ hợp của đợt triển khai trước được ghi riêng bên dưới, không gọi là lượt kiểm tra mới này. Push Git và Railway deploy là hai trạng thái riêng; **deployment/runtime Railway của commit giao diện chưa được xác minh**. Kiểm tra Git remote để xác nhận commit cuối; các ghi chú chưa push đợt Forest bên dưới thuộc thời điểm trước yêu cầu này.

## Đồng bộ chữ nhỏ, màu khung và icon khu rừng tri thức — 12/10/2026

Theo yêu cầu từ ảnh tổng quan giáo viên: chuyển slogan/chữ nhỏ **xuống dưới tiêu đề chính** cho đầu trang giáo viên/học sinh/Admin; cỡ12px desktop,11px≤700px. Áp dụng PageHeading chung, Accounts/ClassCommunity/GroupActivities và learning-heading; giữ mô tả lớp/môn bên dưới. Frame nội dung dùng bốn màu gradient xanh lá/vàng mật ong/xanh trời/tím hoa, viền cùng màu; giữ hiển thị đang chọn/đúng-sai/cảnh báo/cấp cây và những khung nghiệp vụ đặc thù.

Đã tạo `src/forest-theme.css` nạp cuối sau portrait-navigation và `ForestIcon` SVG dùng chung: lá/mầm/đốm sáng, nền mềm nhiều màu, icon nghiệp vụ vẫn nhận biết được. Dùng trong menu cả ba vai trò, thao tác tài khoản portrait, thống kê/thẻ thao tác/lớp/nhóm, mục tiêu học tập, vinh danh/empty state. Icon trang trí aria-hidden, label/tooltip và nút44px giữ nguyên; hover nhẹ và reduced-motion. Header trên phải/menu đáy portrait tiếp tục hoạt động. Chỉ sửa frontend/theme; giữ các thay đổi online/backend/tài liệu đang có từ task song song. Ghi chú thiếu forest-theme.css trong phần bàn giao trước là trạng thái lúc task Forest chưa tạo file; **file đã hoàn tất và checkout hiện tại đã build thành công**.

Kiểm tra **mới đợt Forest**: TypeScript và Vite build riêng `.local/forest-theme-build` đạt; **12/12 E2E portrait-navigation/account-popups desktop/mobile** trên SQLite/server riêng3308 đạt (ba vai trò,320/390/768/1024,neo/đổi lớp/modal/đăng xuất/xoay). Rà soát trình duyệt **48 tổ hợp trang×vai trò×desktop1440/mobile390**, tiêu đề/chữ nhỏ đúng thứ tự, không tràn ngang hoặc lỗiJS; đã xem ảnh tổng quan giáo viên/học sinh, nhóm/ôn-thi và quản trị. QA tại `.local/forest-preview/summary.json` và PNG, script/config riêng `.local/forest-preview.mjs`/`forest-check.config.ts`. Lượt đầu sửa cwd config và accessible name Góp ý học sinh trong script QA rồi chạy lại đạt; không sửa hành vi sản phẩm để vượt test. Không chạy lại backend hoặc báo kết quả120backend/26E2E của đợt khác thành kiểm tra Forest.

`npm run local -- -Action Status` xác nhận frontend5173 đang chạy/HMR; GET nguồn forest-theme.css trả200. API/database vẫn Railway, các kiểm thử/ảnh chỉ dùng database riêng, không ghi dữ liệu thật. **Chưa commit/push/deploy Railway đợt Forest.** Thiết kế hiện hành tại [app-design.md](app-design.md).


## Thông báo deploy Railway tới ntfy/Android — 12/10/2026

Theo yêu cầu triển khai, thêm `.github/workflows/railway-ntfy.yml` và [hướng dẫn ntfy](deploy-notifications.md). Đã kiểm tra GitHub API thật: Actions bật, Railway tạo deployment bởi `railway-app[bot]`, môi trường **`zooming-light / production`**; deployment `7005473243` của `f7a655a` đã có trạng thái success. Workflow nhận `deployment_status`, lọc success/bot/môi trường/không transient, không dùng `states` sai schema; có workflow_dispatch gửi **Test thông báo** riêng. Python inline không checkout/build/deploy hoặc đọc/ghi API/DB GreenEdu; payload chỉ trạng thái/mã commit ngắn/link web, topic/token không in log, kiểm tra receipt ntfy và retry có giới hạn.

Đã cấu hình GitHub Secret `NTFY_TOPIC` bằng kênh ngẫu nhiên 128-bit, mã đăng ký chỉ trong chat và `.local/ntfy-setup/topic.txt` bị Git ignore; chưa dùng NTFY_TOKEN. Người dùng cần cài ntfy/cho phép thông báo và đăng ký kênh trên Android. Kiểm tra mới: **actionlint 1.7.12 và 9/9 ca Python mock đạt**, gồm success/manual/failure/staging/sai bot/transient/secret/token/retry. Không chạy kiểm thử app/DB vì không đổi ứng dụng. Chuẩn bị commit/push chỉ workflow và tài liệu thông báo từ checkout riêng `.local/ntfy-setup/checkout` trên origin/main, giữ toàn bộ thay đổi ứng dụng chưa commit của phiên khác. Trạng thái push, GitHub Actions gửi thật và deployment mới cần đối chiếu sau bước thực hiện, không suy từ 9 ca mock. Không xác nhận Android hiện thông báo nếu chưa có bằng chứng thiết bị thật.

## Đưa cập nhật online và hai bộ Word lên remote theo yêu cầu — 12/10/2026

Người dùng yêu cầu **push remote Git**. Đợt Git gom19file: quản lý thi online riêng, hai nguồn đề/radio/multi-chương-bài/upload, phân loại lịch sử lượt, kiểm thử/tài liệu và hai Word3bài×5câu. Fetch xác nhận remote có commit `73543a6` chuyển icon portrait sang top right; đã rebase commit local chưa push lên commit này, giữ CSS/kiểm thử/vị trí mới. Xung đột chỉ ở session-handoff, đã giữ cả hai phần nội dung, không bỏ thay đổi. Không đưa `.local`, database, file học sinh, ảnh QA hoặc secrets vào commit; không force push.

Kiểm tra mới sau ghép: TypeScript, build riêng và **18/18 E2E desktop/mobile** (portrait-navigation/online-exams/online-management) đạt trên SQLite/server riêng3297, output `.local/pre-push-ui-results`; đã xem ảnh390px giáo viên/học sinh với icon bên phải. Backend/shared và mã nghiệp vụ online không đổi qua rebase, kết quả118backend/26E2E ở đợt trước vẫn được ghi là của đợt trước. Đưa bản ghép/tài liệu vào commit để push `origin/main`. Những ghi chú chưa push của đợt online/Word bên dưới là trạng thái trước yêu cầu Git này; kiểm tra Git để biết commit remote hiện hành. Railway đã cấu hình autobuild từ main theo bàn giao, nhưng **kết quả deployment/runtime Railway chưa được xác minh trong đợt push này**. Mặc định frontend5173/API/DB Railway giữ nguyên.

## Sửa vị trí icon portrait thành top right và push để autobuild

Người dùng đính chính **top right**, đồng thời yêu cầu hoàn thành rồi push Git repo để autobuild. Đổi thứ tự grid header: account/avatar bên trái, ba icon Góp ý/Tài khoản/Đăng xuất ở góc trên phải, lớp ở hàng dưới. Giữ neo header/dock, quyền và hành vi; không thay backend hoặc ghi dữ liệu Railway. Cập nhật kiểm thử vị trí icon ở bên phải account và sát lề phải, các mô tả top left bên dưới là lịch sử. Đợt này được đưa vào commit để push `origin/main` theo yêu cầu; trạng thái autobuild/deployment cần phân biệt với kết quả push.

Kiểm tra mới: TypeScript/Vite build riêng `.local/portrait-right-build` và diff check đạt; **6/6 E2E portrait-navigation desktop/mobile** đạt trên database riêng, gồm ba vai trò và portrait320/390/768/1024, neo/click/đổi lớp/modal/đăng xuất/rotate như bộ test hiện có. Đã xem ảnh390px giáo viên xác nhận icon trên phải. Không chạy lại backend hoặc bộ account-popup vì không thay hành vi/API; 12/12 ở đợt trước là bằng chứng của đợt trước. Kết quả deploy Railway chưa được xác minh ở lượt này.

## Tách trang quản lý thi online, nguồn đề bắt buộc và kiểm tra upload — 12/10/2026

Yêu cầu mới theo ảnh: mục riêng ở giáo viên/học sinh, thông báo thi sắp bắt đầu; hai nguồn đề bắt buộc chọn một; kiểm tra upload và chọn nhiều chương/toàn chương/từng bài. Đã thêm navigation **Quản lý kiểm tra online / Kiểm tra online**, tái sử dụng Learning với view online; tách khỏi cấp cây/quyền Săn điểm/ôn/ma trận/thưởng. Nút cũ Tạo kiểm tra online dẫn sang trang mới. Banner hiện có vẫn đếm chờ/chuyển đúng lớp/phòng, hash workspace online giữ trang qua reload. Lịch theo giờ/Săn điểm vẫn trang cũ. File App/Learning/ExamBank/ExamUpload và CSS, kiểu shared/learning.

Nguồn đề chuyển từ select mặc định bank sang2radio chưa chọn **Upload file / Chọn từ ngân hàng**, bắt buộc một nguồn. Upload không còn phụ thuộc checkbox chương ở khu khác: chọn ngay trong khối file từ danh mục lớp; thêm tên/số câu đọc thành công, chặn file hỏng/câu trùng, Word5MB/CSV512KB/100câu. Ngân hàng checkbox chương + details bài, toàn chương hoặc nhiều bài riêng độc lập từng chương; hỗ trợ trộn toàn chương1 và bài cụ thể chương2. Chọn từng nguồn giữ draft nhưng payload độc lập. Đã upload thật hai Word15câu của đợt trước thành30câu/two chapters trên testserver.

Backend overview runs thêm delivery bằng EXISTS online_exam_sessions liên kết exam_id, giữ phân quyền/scope, không migration/sửa dữ liệu cũ. Trang mới lọc kết quả online; server cũ thiếu trường hiện lời báo lịch sử chờ cập nhật. **Backend Railway cần deploy để nhận trường này; chưa push/deploy Railway**. Không khẳng định việc đọc file local đã nghiệm thu API production. Các gap offline/ngưỡng tab/focus/AI còn nguyên.

Kiểm tra mới: TypeScript và Vite build riêng `.local/online-management-build` đạt; **118/118 toàn bộ backend** đạt; **26/26 E2E desktop/mobile** (learning/online-exams/online-management) đạt bằng SQLite `.local/e2e-online-management-*.sqlite`, server3297, config/output `.local/online-management.config.ts`/`.local/online-management-results`. Lượt đầu22/26:2ca locator status bắt thêm thông báo đọc file,2ca mobile fixture sửa sai chọnA cho câu đề riêng B/C; sửa test theo thông báo chính và đáp án đã công bố cho student fixture, không sửa quy tắc app, chạy lại26/26. Đã xem ảnh quản lý bank/upload/student desktop/mobile. Sandbox build realpath EPERM, chạy ngoài sandbox qua approval review đạt. Không chạy thử tạo dữ liệu trên Railway hoặc SQLite chính.

Kiểm tra local cuối phát hiện5173 đã dừng; `npm run local` mở lại Vite nền/HMR thành công. Chrome profile riêng chỉ đọc trang đăng nhập/source ExamBank200, không lỗiJS; API health qua local `ok:true/demo:false/quickLogin:false` vẫn Railway. Script kiểm tra ban đầu dùng request URL tương đối khi context không có baseURL nên Invalid URL; sửa absoluteURL và chạy lại đạt. Không đăng nhập/POST dữ liệu thật. Giữ file Word/README/tài liệu từ đợt trước và nhánh main đang behind origin1commit, không tự pull/reset/commit/push. Thiết kế/nghiệp vụ/ca kiểm thử đã cập nhật.

## Mở rộng hai bộ Word thành hai chương, mỗi chương3bài — 12/10/2026

Theo yêu cầu mới, đã cập nhật chính hai file câu hỏi vui ở `artifacts/question-banks/`: mỗi file một chương, mỗi chương3bài, mỗi bài5câu, tổng15câu/file và30câu. Chương1 Đố vui quanh em gồm Đồ vật ngộ nghĩnh/Thế giới động vật/Đố vui số lượng; Chương2 Vui học mỗi ngày gồm Con số vui nhộn/Khoa học quanh em/Cuộc sống mỗi ngày. Giữ10câu trước, thêm20câu mới; backup bản5câu ở `.local/fun-question-banks/before-expansion/`. Mỗi câu có tên bài riêng và đầy đủ4lựa chọn/đáp án/lời giải; số câu1–15 liên tục trong mỗi file.

Kiểm tra mới: parser Word thực của GreenEdu nhận15câu/0lỗi từng file, đúng3bài×5câu. Template hash/section A4 và package không liên quan giữ nguyên. Word ẩn mở read-only xuất PDF, PDFium đóng gói render; đã xem8trang cuối, không lỗi chữ hoặc câu bị tách trang. Script/data/contract/manifest riêng `.local/fun-question-banks/expand.py`, `expanded-bank-data.json`, `artifact-expanded.md`, `expanded-manifest.json`. Khi nhập mỗi file chọn đúng chương và **Bài nhận câu hỏi → Theo tên bài trong file**; chọn một bài có sẵn sẽ gộp toàn bộ15câu, không đúng cấu trúc này. Không thêm heading bài giữa các khối câu vì parser sẽ nối heading vào lời giải trước; nhận diện bằng nhãn Bài học trong từng câu. Chỉ sửa tài liệu/file, chưa nhập dữ liệu Railway/sửa runtime/push/deploy. Mô tả5câu của đợt trước bên dưới là lịch sử đã thay bằng bản15câu.

## Hai file Word câu hỏi vui theo mẫu — 12/10/2026

Theo yêu cầu, đã tạo `artifacts/question-banks/bo-cau-hoi-vui-1-do-vui-quanh-em.docx` và `bo-cau-hoi-vui-2-vui-hoc-moi-ngay.docx`, mỗi file5câu vui/đơn giản,4phương án/một đáp án/lời giải. Dùng trực tiếp mẫu `public/templates/greenedu-cau-hoi-mau.docx`, giữ Arial11/A4 và package không liên quan; mẫu gốc không đổi. Không có topic để tránh cần capability mới; tên Bài học theo chủ đề từng file, có thể chọn Bài nhận câu hỏi khi nhập. Nội dung tổng hợp, không giả là ngân hàng Vật lí11 chính khóa.

Kiểm tra mới bằng `readWordDocument`/`parseQuestionWordText` thực của ứng dụng: mỗi file5câu/0lỗi, đủ lựa chọn/đáp án/lời giải, không hình ảnh/Equation/Track Changes. Renderer đóng gói thiếu LibreOffice; dùng một phiên Word ẩn mở read-only, xuất PDF nội bộ và PDFium đóng gói tạo PNG. Đã xem đủ4trang cuối, cân bố cục3câu trang đầu/2câu trang sau, không tách câu qua trang. QA/script/contract riêng `.local/fun-question-banks/`; không cung cấp PDF/ảnh trung gian. Chỉ tạo file/tài liệu, chưa nhập Railway hoặc ghi dữ liệu thật, không sửa runtime/khởi động lại frontend/API/push/deploy. Giữ các cập nhật bàn giao chạy local từ đợt trước.

## Chạy frontend local trên máy Windows — 12/10/2026

Theo yêu cầu mới, đã chạy frontend tại **http://localhost:5173** trên checkout `D:/WorkSpace/Others/SangKienKn`, HEAD `8faa58c`. API/server và database tiếp tục dùng **https://greenedu.up.railway.app** qua proxy Vite chế độ railway. Checkout ban đầu thiếu dependencies; đã cài187gói bằng `npm ci` theo lockfile, không thay package/lockfile. Sandbox chặn tạo thư mục và kết nối loopback; cài/khởi động lại ngoài sandbox qua approval review thành công. `npm run local` chạy Vite nền/HMR, không khởi động API SQLite local, không build/deploy hoặc push Railway.

Kiểm tra mới chỉ đọc: trang local, Vite client và source `PortraitActions.tsx` đều200; `/api/health` qua proxy local và trực tiếp Railway cùng `ok:true/demo:false/quickLogin:false`, không có tài khoản vào nhanh. `/api/auth/me` local401 khi chưa đăng nhập. Không đăng nhập thử, ghi dữ liệu thật, chạy backend/E2E hoặc reset database. Đã yêu cầu mở trang local trong panel Codex; tool trảqueued. Quản lý frontend bằng `npm run local -- -Action Status/Stop`; các trạng thái deployment Railway ở đợt trước chưa được xác minh lại bằng việc kiểm tra health này.

## Push icon header portrait theo yêu cầu

Sau khi hoàn thành bản icon và 12/12 E2E bên dưới, người dùng yêu cầu **Push git**. Đưa component PortraitActions, App/AdminWorkspace, CSS portrait, E2E và tài liệu liên quan vào commit để push `origin/main`; giữ các commit đã có, không force push và không đưa `.local`/database/ảnh kiểm thử lên Git. Ghi chú “chưa push” của đợt triển khai icon bên dưới là lịch sử trước yêu cầu này. Kết quả Railway tự deploy chưa được xác minh trong đợt Git này.

## Icon Góp ý/Tài khoản/Đăng xuất ở góc trên trái portrait

Yêu cầu tiếp theo: đưa ba thao tác khỏi dock dưới lên top left, neo cùng header tên account, chỉ dùng icon. Đã thêm `src/PortraitActions.tsx` dùng chung App/AdminWorkspace; portrait ≤1100px hiển thị Góp ý/Tài khoản/Đăng xuất bên trái (Admin chỉ hai thao tác có sẵn), account/avatar bên phải và lớp ở hàng dưới. Nút44×44px/icon20px, có aria-label/title và trạng thái trang hiện tại; không hiển thị chữ. Sidebar-bottom ẩn ở portrait, menu chính vẫn fixed dưới; landscape/desktop giữ các nút sidebar cũ và không hiện icon header trùng.

Chỉ sửa frontend, không gọi API/database Railway, chưa push/deploy đợt icon này. Build kiểm tra riêng `.local/portrait-actions-build`; kế thừa quy tắc safe area và khoảng đệm dưới. Mô tả ba thao tác còn trong dock ở đợt portrait đầu tiên dưới đây là lịch sử đã được thay.

Kiểm tra mới: TypeScript/build riêng và diff check đạt; **12/12 E2E** portrait-navigation/account-popups desktop/mobile đạt trên database riêng. Ba vai trò, portrait320/390/768/1024, icon không có chữ và hit-test không bị che khi cuộn, tên/lớp giữ trên, Góp ý/Tài khoản/Đăng xuất chỉ có một nơi hiển thị, đổi lớp, trạng thái trang, mở/đóng modal, landscape/desktop khôi phục sidebar. Đã xem ảnh390px giáo viên/học sinh; không kiểm tra lại production hoặc Safari/thiết bị thật.

## Đưa bản portrait lên Git theo yêu cầu

Sau khi hoàn tất chỉnh giao diện và kiểm thử bên dưới, người dùng yêu cầu **Pushgit remote**. Đợt Git đưa CSS portrait, import CSS, viewport safe area, E2E và ba tài liệu cập nhật vào commit để push `origin/main`. Không đưa database, ảnh kiểm thử hoặc `.local` lên Git. Đối chiếu remote trước push, giữ các commit đã có và không force push. Trạng thái “chưa push” của đợt sửa giao diện bên dưới là lịch sử; xem Git để biết commit hiện hành. Railway đã có cấu hình tự nhận main theo bàn giao trước, nhưng kết quả deploy/runtime Railway chưa được xác minh trong đợt Git này.

## Header neo trên, menu neo dưới khi portrait

Yêu cầu mới của người dùng: khi portrait, luôn neo tên tài khoản/lớp trên header và chuyển thanh navigation đang ở phía trên xuống dưới. Đã thêm `src/portrait-navigation.css`, nạp cuối sau garden.css: portrait ≤1100 px, header sticky/account hiển thị đầy đủ, selector lớp giữ thao tác, dock fixed dưới/cuộn ngang toàn bộ menu và Tài khoản/Góp ý/Đăng xuất. ≤420 px header hai hàng; nội dung chừa 88px + safe area +24px dưới dock. Landscape/desktop giữ sidebar cũ; index.html có viewport-fit=cover. Áp dụng chung giáo viên/học sinh/Admin (Admin không có bộ chọn lớp).

Thay đổi chỉ frontend, không khởi động frontend/API production, không ghi Railway, không push/deploy. Bản trên cloud được build riêng `.local/portrait-navigation-build` để kiểm tra; chưa phải bản frontend trên máy Windows hoặc bản đang phục vụ Railway. Chi tiết giao diện tại [app-design.md](app-design.md), test trong `e2e/portrait-navigation.spec.ts`.

Kiểm tra mới: TypeScript/Vite build riêng và `git diff --check` đạt. **22/22 E2E** trong portrait-navigation/account-popups/workflow đạt trên Chromium desktop/mobile: ba vai trò, viewport portrait320/390/768/1024, cuộn thật/header luôn thấy tên và lớp, nút cuối trang không bị dock che, đổi lớp, cuộn tới menu cuối/Tài khoản/Đăng xuất, modal nằm trên dock, xoay landscape844 và desktop1440 khôi phục sidebar; các luồng Word/CSV/luyện tập/sổ tay/tài khoản/cộng đồng cũ vẫn đạt. Database riêng `.local/e2e-*.sqlite`, không Railway. Đã xem ảnh390px giáo viên/học sinh tại `.local/portrait-navigation-{desktop,mobile}-{role}.png`. Lượt đầu hai ca dừng vì locator avatar khớp cả header và trang Tài khoản; giới hạn locator vào header rồi chạy lại đạt, không phải lỗi ứng dụng. Chưa QA Safari/bàn phím trên thiết bị thật.

## Gom tài liệu hiện hành và commit theo yêu cầu — 12/10/2026

Người dùng yêu cầu cập nhật đầy đủ tài liệu để session sau nắm dự án và commit mọi thay đổi liên quan. Đã đối chiếu Git/mã hiện tại (HEAD trước đợt này `72a7e3b`), đồng bộ bảng tra cứu12/10, README/AGENTS/thiết kế/đặc tả nhóm/báo cáo tài liệu. Bổ sung `docs/feedback-discussion.md`: góp ý riêng học sinh/giáo viên và phản biện sau gia hạn ít nhất một lần rồi hết hạn hiện tại đã có trong mã; không còn ghi chung là chưa triển khai. Chấm/thưởng nhóm, AI và gap offline/focus/nhật ký vẫn giữ là phần còn lại. Backend mới trên Railway chưa được xác minh trong đợt tài liệu.

Phạm vi commit: banner minh họa nhóm/asset WebP/CSS, PowerPoint rework/3 minh họa nguồn/prompt và các tài liệu liên quan. Không đưa `.local`, database, file học sinh hay secrets vào Git. Các kiểm tra frontend/slide của đợt ngay trước được ghi riêng bên dưới; không báo lại thành kiểm thử mới của đợt gom tài liệu. Không deploy Railway trong công việc này.

Kiểm tra tài liệu mới trước commit: 28 Markdown/269 liên kết local có đích, `git diff --check` đạt. Commit dùng nhánh `main`; chưa thực hiện push remote. Sau khi cần đưa lên remote, phải phân biệt bước push với deploy/kiểm tra Railway.

## Minh họa Hoạt động nhóm và slide rework — 12/10/2026

Theo yêu cầu mới, thêm ảnh người dùng đính kèm vào đầu trang **Hoạt động nhóm** của cả giáo viên/học sinh. File PNG gốc1536×1024/2,22MB được tối ưu WebP giữ alpha/tỷ lệ tại `public/assets/group-learning-v1.webp` (284188bytes). Desktop hình bên phải, mobile dưới chữ; nút Tạo hoạt động chuyển vào phần chữ, giữ hành vi. TSX và CSS riêng `src/group-activities.css`, không đổi API/DB. TypeScript/build riêng `.local/group-illustration-build` đạt; kiểm tra trình duyệt4 tổ hợp giáo viên/học sinh×desktop1440/mobile390 bằng API giả lập GET-only đạt: ảnh tải, không tràn ngang, nút tạo mở modal cho giáo viên và không xuất hiện cho học sinh. Đã xem ảnh desktop/mobile tại `.local/group-illustration-preview/`. Không ghi dữ liệu Railway/khởi động API local. `npm run local` đã mở lại frontend5173/HMR, API/database Railway; chưa push/deploy.

Bộ slide rework cũng đã hoàn tất tại `artifacts/presentations/GreenEdu-Thanh-Phuong-Animation-2026.pptx`:9slide ít chữ/hình lớn,60 hiệu ứng gốc Fade/Fly In/Zoom/Wipe và9 chuyển slide. Bố cục Artifact Tool, animation lưu trực tiếp PowerPoint16.0 trên bản sao ẩn, không tác động tài liệu đang mở. Đã mở lại bản lưu kiểm tra60 hiệu ứng, xem ảnh9slide xuất PowerPoint, sửa logo/link trên nền tối, finalizer package/layout/font/import đạt, hash bản cuối khớp bản native và QR đúngRailway. Chưa kiểm tra playback tương tác trực tiếp; không coi render tĩnh là nghiệm thu từng khung animation. Lượt trước dừng vì auto-review hết hạn mức; sau yêu cầu tiếp tục đã chạy lại thành công, không còn chặn. Bản mẫu cũ giữ nguyên. Nguồn/prompt và hướng dẫn ở [README slide](../artifacts/presentations/README.md), file riêng `.local/greenedu-slides/v2/`. Giữ phân biệt gia sư AI dự kiến/số liệu tác động chưa có.

## Slide giới thiệu dự án theo mẫu 2026 — 12/10/2026

Đã đọc trực tiếp `C:/Users/thant/Desktop/SangkienKN/Mẫu Slide 2026.pptx` và tạo bộ **9 slide** tại `artifacts/presentations/GreenEdu-Nguyen-Thi-Thanh-Phuong-2026.pptx`. Giữ khổ20×11,25inch, bố cục/nhận diện/font của mẫu; thay nội dung hướng dẫn bằng GreenEdu. Tác giả: **Nguyễn Thị Thanh Phương, giáo viên Vật lý, THPT Nguyễn Khuyến**, email do người dùng cung cấp. Có logo trường, ảnh giao diện thử nghiệm có chú thích, bộ câu hỏi50câu/10chủ đề và QR/link Railway. Văn bản chỉnh sửa được, ghi chú nguồn/phạm vi trong speaker notes.

Phân biệt AI hỗ trợ phát triển/soạn tài liệu với gia sư AI còn dự kiến; chưa có dữ liệu đo hiệu quả trước/sau nên không tạo kết quả điểm số, phản hồi hay tỷ lệ giả. Quy mô47tài khoản/4chương26bài theo bàn giao, không coi là số học sinh sử dụng tích cực. Một số backend chưa lên Railway được ghi rõ. Đã mở lại bản cuối bằng Artifact Tool, xem cả9slide, kiểm tra package/layout/font/native bullets và tác giả/placeholder, giải mã QR trên render cuối đúngURL. Chưa kiểm tra render trực tiếp bằng Microsoft PowerPoint. Receipt/script/ảnh riêng `.local/greenedu-slides`; nguồn và cách dùng trong [README slide](../artifacts/presentations/README.md). Chỉ tạo tài liệu, không thay ứng dụng/database, không push/deploy. Giữ các thay đổi đồng thời trong repository.

## Kiểm tra online: thông báo trước X phút, làm bài Y phút — 12/10/2026

Yêu cầu mới: giáo viên mở buổi kiểm tra cho cả lớp, tải file hoặc chọn nhiều chương/bài; bấm bắt đầu phát yêu cầu trước X phút, giờ thi thật sau X phút và thời lượng Y phút. Đã bổ sung **Ôn tập & kiểm tra → Tạo kiểm tra online** và form dùng lại ngân hàng/Word–CSV, nhiều chương/bài/trọng số. Cài X0–60 mặc định3, Y1–180 mặc định20, ngưỡng rời tab như trước. Chuẩn bị chỉ lưu bản chờ; bấm bắt đầu mới chốt tập câu chung và lịch T+X/T+X+Y, chưa đủ câu thì rollback toàn bộ. Thời gian chờ bản chuẩn bị không làm buổi hết hạn. Chốt snapshot ngân hàng tại bắt đầu, tải đề dùng câu riêng ẩn; đảo thứ tự riêng cho mỗi lượt, giữ qua reload. Không đảo A/B/C/D.

Thêm banner chuông ở mọi trang học sinh: đúng lớp/môn/tên đề/số câu/thời lượng, đếm chờ rồi đếm còn lại, khóa Chờ mở đề trước giờ, Vào làm/Tiếp tục kiểm tra sau giờ. Poll10 giây khi online/visible và khi trở lại tab, đồng hồ theo server; vào từ banner chọn đúng lớp/phòng, không ép chuyển trang. Thông báo trong app, không email/push ngoài app. Một lượt/buổi, một lượt active/tài khoản, không cần điều kiện ôn/vé. Học sinh vào muộn cùng hạn chung, hết giờ hoặc giáo viên đóng thì thu bài; giữ autosave/tab/công bố như phòng thi cũ. Đóng trong X phút bỏ yêu cầu. Gửi lại bắt đầu không lấy đề khác/kéo giờ/mở lại buổi đã đóng.

Migration bổ sung online_exam_sessions, không sửa dữ liệu cũ; started_at trong bảng phụ ghi T phát yêu cầu, starts_at của đề ghi giờ mở thật. Capability onlineExams khóa UI mới khi Railway còn API cũ. Endpoint exam-notices chỉ cho học sinh/thành viên hiện tại, không chứa câu/đáp án/email; buổi hết/đóng/đã nộp bỏ thông báo. Entry phòng thi ở App gắn lớp, tránh đưa run sang lớp khác. API/frontend tại learning.ts, learning-db.ts, shared/learning.ts, Learning/ExamNotices/App và CSS scoped. Nghiệp vụ [online-exams.md](online-exams.md); thiết kế chính đã cập nhật [app-design.md](app-design.md).

Kiểm thử mới: **116/116 toàn bộ backend** đạt, gồm ba ca API online (X/Y, deadline chung/không gia hạn, scope/privacy, đề chung/reload, thiếu câu rollback, validation, uploaded private, thu bài) và migration/reopen. **14/14 E2E ôn/thi cũ đạt** trong lượt20ca đầu;4ca online dừng vì locator test learning-notice bắt cả hướng dẫn/thông báo, sửa locator theo role status rồi **6/6 E2E online desktop/mobile đạt**, gồm ngân hàng nhiều chương/bài/chờ/reload/hủy, file riêng/vào từ Trang chủ/lưu phòng/thu bài, capability API cũ. Database riêng `.local/e2e-online-exams-*.sqlite`, cổng3293, build/config/output `.local/online-exams-build`, `.local/online-exams.config.ts`, `.local/online-exams-results`. Đã xem ảnh teacher/waiting desktop/mobile; sau QA chuyển note thời gian ra hàng riêng để input gọn.

**Chưa push/deploy/restart hoặc ghi database Railway.** Frontend5173/HMR dùng Railway nên công cụ online đang chờ backend mới. Giữ thay đổi vườn/sổ tay/poster và tài liệu đồng thời; không triển khai lại các phần đó. Không coi bộ test này đã sửa các khoảng trống vi phạm offline/focus/AI trong audit.

Sau QA bố cục, TypeScript/build chạy lại đạt và **6/6 E2E online cuối đạt**, bổ sung ca danh sách lớp cache rỗng vẫn vào đúng lớp từ thông báo. Đã xem ảnh teacher cuối, note giờ riêng hàng không kéo input cao. Có thêm thay đổi đồng thời feedback/group discussion/artifacts presentations trong checkout; giữ nguyên, không thuộc phạm vi đợt online. Kết quả116 backend là của lượt trước các thay đổi đồng thời này, không khẳng định đã nghiệm thu chức năng mới của luồng khác.

Cuối đợt Vite5173 đã dừng; `npm run local` trong sandbox timeout ở kiểm tra loopback, chạy lại ngoài sandbox khởi động frontend thành công. GET source ExamNotices200/có Chờ mở đề; API/database vẫn Railway. Không dừng tiến trình API hoặc reset dữ liệu.

Poster cập nhật 12/10 theo yêu cầu tăng kích cỡ QR: bản hiện hành `artifacts/posters/greenedu-hoc-sinh-qr-lon.png` và PDF A3 cùng tên. Cạnh QR184→250 (+36%), nới banner đầu và thu minh họa để giữ đủ nội dung; logo trường vẫn dưới tên. Đã xem render cuối và ZXing giải mã đúng URL, giữ các bản trước; không đổi ứng dụng/dữ liệu.

Poster cập nhật tiếp 12/10: thêm logo trường ngay dưới tên THPT Nguyễn Khuyến, căn giữa theo tên. Bản hiện hành `artifacts/posters/greenedu-hoc-sinh-qr-logo-truong.png` và PDF A3 cùng tên. Dùng nguyên huy hiệu trong asset trường/CSS crop của website, không tái tạo logo; thu nhẹ minh họa để đủ khoảng. Đã xem render cuối/kiểm tra QR, giữ các bản trước; không đổi ứng dụng/dữ liệu.

Poster học sinh: theo yêu cầu mới 12/10 đưa khối **QUÉT QR, VÀO GREENEDU!**/mã/link lên trên cùng. Bản hiện hành `artifacts/posters/greenedu-hoc-sinh-qr-tren-cung.png` và PDF `greenedu-hoc-sinh-qr-tren-cung-A3.pdf`; giữ bản đầu, đủ nội dung trên một trang A3. Đã xem render toàn trang và giải mã QR trên PNG mới đúng Railway; không sửa ứng dụng/dữ liệu.

## Poster hướng dẫn nhanh cho học sinh — 12/10/2026

Theo yêu cầu mới, tạo `artifacts/posters/greenedu-huong-dan-hoc-sinh.png` (3508×4961px/300dpi), PDF A3 một trang cùng tên và QR riêng `greenedu-qr.png`. Nội dung ít chữ: đăng nhập họ tên viết liền không dấu/mật khẩu tạm theo chỉ dẫn người dùng, đổi mật khẩu đầu tiên, đổi avatar; sáu thẻ Luyện tập/Ôn tập/Kiểm tra/Hoạt động nhóm/Thăm vườn/Xếp hạng và nhắc Sổ tay sửa sai. QR/đường dẫn hướng tới `https://greenedu.up.railway.app/`.

Đã xem trang đăng nhập Railway qua browser, đối chiếu menu trong mã, không đăng nhập/ghi dữ liệu thật. Minh họa mới ImageGen ba học sinh học/chăm cây mọc từ sách, tham khảo asset knowledge-garden hiện có; không dùng ảnh cá nhân. Dàn chữ tiếng Việt/icon/QR riêng bằng ReportLab; PDF chữ và QR vector, link bấm được. Đã xem render toàn trang, giải mã độc lập bằng ZXing-C++ trên ảnh PNG poster cuối và QR riêng, đều đúng URL. Công cụ đọc QR cài riêng `.local/poster-libs`, script/ảnh trung gian `.local/poster-greenedu`, không thêm dependency app. Nguồn và prompt ở `artifacts/posters/README.md`. Không sửa runtime, deploy, push, mật khẩu hoặc database trong công việc poster.

## Vườn gọn hơn, bảng tên lớp/môn và avatar giáo viên — 12/10/2026

Đã giảm vùng cuộn vườn650/550→360/300px, icon84/72→56/46px, ô di chuyển130px, cột desktop108px tối thiểu/mobile3cột, giảm padding/biên độ để tên/avatar sát nhau nhưng không ra rào. Vinh danh cấp5 cũng gọn, cuộn180/160px và2cột mobile; vẫn đủ47người/mỗi người một cây, vinh danh dedup, MAX chương/không sửa cấp hoặc dữ liệu. Theo ảnh đánh dấu và yêu cầu cuối, **bảng tên nhỏ120px nằm giữa cổng rào phía dưới, chỉ có tên lớp/môn hai dòng; avatar giáo viên38px để riêng bên trái, không ghi tên cô**. Bảng/avatar không cuộn cùng học sinh. Đã bỏ dòng ghi chú cấp chương/cuộn dưới vườn. Đây là bố cục hiện hành, không đưa lại bảng lớn ở phía trên.

API garden bổ sung `teacher:{name,avatarId}` đọc teacher lớp và user_avatars sau kiểm tra quyền, không lộ email/secrets hoặc thêm migration. ClassCommunity truyền metadata; nếu server cũ thiếu teacher thì dùng classroom.teacherName và chữ viết tắt. Trang giáo viên dùng avatar tài khoản đang đăng nhập sở hữu lớp để vẫn hiện ảnh thật với backend cũ; học sinh cần API Railway mới để lấy avatar thật. Không lấy avatar học sinh làm giáo viên.

Kiểm tra mới: TypeScript và build riêng `.local/compact-garden-build` đạt;2ca HTTP API cộng đồng/garden đạt (thêm kiểm tra teacher metadata/quyền, cùng file student-levels chạy với bộ lọc không có ca khớp); **6/6 E2E desktop/mobile đạt**, lớp47người/icons/chiều cao/bounds/cuộn/reload/animation/reduced-motion/API cũ và bảng tên/avatar giáo viên. Lượt E2E đầu4đạt/2timeout vì fixture logout không gửi JSON nên phiên teacher còn, đã sửa data:{} và assert response rồi chạy lại6/6 đạt. Build/HTTP sandbox Windows bịEPERM/EACCES, chạy ngoài sandbox trên SQLite riêng3193, không Railway. Ảnh `.local/fenced-garden-{desktop,mobile}.png`/crowd được cập nhật trong lượt này và đã xem; output `.local/compact-garden-results`.

Local5173 đang phục vụ Vite/source mới, GET vite/client và StudentGarden đều200/có bảng tên. Script local status báo stopped vì tiến trình5173 không được trạng thái script nhận diện; thử start báo cổng đã dùng, không dừng tiến trình ngoài script. Chỉ đọc xác minh source mới, không restart API/database. **Chưa push/deploy Railway hoặc ghi dữ liệu thật.** Giữ các thay đổi đồng thời App/Learning/styles và thao tác prune database của session khác. Thiết kế hiện hành app-design.md; không cần triển khai lại vườn từ đầu.

Lượt chỉnh cổng nhỏ/avatar riêng cuối: TypeScript/build riêng chạy lại đạt, **6/6 E2E desktop/mobile đạt** trên SQLite kiểm thử3193. Test xác nhận bảng rộng tối đa120px, nằm giữa và chạm rào dưới, avatar thật tách khỏi bảng, không có tên giáo viên/dòng ghi chú; các ca47người/API cũ vẫn đạt. Đã xem lại ảnh crowd desktop/mobile, cập nhật thiết kế chính và tiến độ. Không chạy lại backend vì lượt cuối chỉ sửa bố cục frontend.

## Lối tắt sổ tay và bỏ giờ dưới cấp hiện tại — 12/10/2026

Theo hai yêu cầu mới, thẻ Ôn tập & kiểm tra thêm nút **Mở sổ tay** ngay dưới “Còn … câu cần sửa trong chương”, mở Sổ tay sửa sai lọc theo chính chương đó. Thêm trường Chương cần sửa/Tất cả chương, phân nhóm lớp/môn; số câu và danh sách cùng đọc bộ lọc. Vào từ sidebar/trang chủ mặc định tất cả. Giữ thao tác Làm lại đúng questionId hiện có và bộ lọc khi quay từ phiên sửa sai. Bỏ span thời gian dưới Cấp độ hiện tại cùng CSS không dùng; giữ icon/tên cấp và tính thời gian thật ở dữ liệu/màn hình khác. Chỉ frontend App/Learning/styles/learning.css, không đổi API, DB hoặc quy tắc Săn điểm.

Kiểm tra mới: TypeScript/build riêng `.local/notebook-shortcut-build` đạt; **2/2 E2E desktop/mobile** mở đúng chương với câu sai ở cả hai chương, chuyển bộ lọc/all/sidebar, không tràn ngang và hồi quy làm lại/sửa sai đạt. Test mở rộng ca student reviews trong e2e/learning.spec.ts; config/output `.local/notebook-shortcut-playwright.config.ts`/`.local/notebook-shortcut-e2e-results`, cổng3283/database `.local/e2e-notebook-shortcut-*.sqlite` riêng. Cổng3193 đã có tiến trình nên chuyển cổng, không dừng tiến trình đó. Lượt chờ đủ hai shortcut cho ảnh desktop chưa đạt vì fixture tạo lỗi API sau khi view mount, chưa đến chu kỳ refresh15giây; thêm thao tác Làm mới vào test, chạy lại2/2 đạt. Đã xem ảnh thẻ/sổ tay cuối. `npm run local` xác nhận frontend5173 đang chạy/HMR. Chưa push/deploy Railway; không ghi dữ liệu thật. Giữ thay đổi đồng thời vườn/teacher avatar/App/server đã có lúc bắt đầu.

## Database chỉ giữ lớp 11/2 Vật lý — 12/10/2026

Theo yêu cầu trực tiếp của người dùng, đã xóa các lớp khác trên **Railway production `/data/greenedu.sqlite`**, chỉ giữ **Lớp 11/2 ♥ · Vật Lý**, ID `89b7ada1-2e2f-4860-aeec-6e1d42e28adb`. Hai lớp đã xóa cùng tên 10A1/Vật Lý, IDs `65251193-cd4c-4688-b335-468c0a856709` và `e3510260-9c23-45de-953a-1ec127967148`; đều không có chương/câu hỏi. Một lớp có hoạt động nhóm: đã xóa 1 submission, 1 file DB, 2 thành viên nhóm, 1 nhóm, 1 hoạt động và 2 membership thuộc hai lớp. Tài khoản người dùng giữ nguyên, không xóa học sinh/giáo viên.

Sao lưu WAL-safe trước transaction **`/data/backups/pre-keep-11-2-physics-1791738158341.sqlite`**, audit **`/data/backups/keep-11-2-physics-1791738158341.json`**. Script private `.local/prune-other-classes.cjs`, không Git. Transaction bật foreign_keys, chốt chính xác ID/số bản ghi, kiểm tra backup chứa đủ dữ liệu sắp xóa và hash nội dung được bảo vệ của **33 bảng** trước commit; giữ toàn bộ dữ liệu lớp 11/2 và ngoài phạm vi. Còn **47 membership, 4 chương, 105 bản ghi câu hỏi, 51 users**. Progress dautay cấp5 bốn chương giữ nguyên. Kết nối chỉ đọc mới sau commit xác nhận một lớp duy nhất, backup còn3 lớp, quick_check ok/không lỗi FK. Lượt thực hiện đầu dừng/rollback trước DELETE do thiếu binding ở câu kiểm tra ID; sửa binding rồi chạy lại với backup mới và thành công.

Không deploy/push/restart, không reset database local hoặc sửa runtime. Frontend5173 dùng dữ liệu Railway, tải lại trang để danh sách lớp cập nhật. Đây là thao tác dữ liệu theo yêu cầu, không phải kết quả test backend/E2E mới.

## Giáo viên chọn nhiều câu/xóa cả bài trong ngân hàng — 11/10/2026

Yêu cầu mới: quản lý ngân hàng tốt hơn, xóa nhiều câu trong bài hoặc cả bài. Đã thêm checkbox từng câu đang dùng, Chọn tất cả trong bài/đang hiển thị, số đã chọn/Bỏ chọn, hai nút Xóa các câu đã chọn và Xóa cả bài ngay trong ngân hàng. Dialog chốt số câu/danh sách hoặc tên bài/số câu, Hủy/Xác nhận, busy khóa đóng và lỗi tại chỗ. Đổi bộ lọc/chương/tải lại bỏ lựa chọn; thành công refresh danh mục/bộ đếm theo callback hiện có và trả bộ lọc về tất cả. Xóa cả bài hoạt động cả bài rỗng, reuse route archiveLesson sẵn có.

API mới POST /api/chapters/:id/questions/delete nhận questionIds (1–5000), capability Chapter.canDeleteQuestions dành riêng teacher; kiểm tra chủ lớp và toàn bộ ID thuộc chương/phiên bản hiện tại trước transaction UPDATE active=0. Payload route giới hạn1MB đủ5000ID; ID thiếu/ngoài chương/phiên bản cũ chặn toàn bộ; lặp/đồng thời cùng ID không cập nhật thêm. Không DELETE vật lý, không migration, giữ phiên bản/attempts/sổ tay/progress và snapshot ôn/thi. API cũ thiếu capability khóa chọn/xóa nhiều câu, báo chờ Railway; nút xóa bài dùng canManageLessons. CSS scoped src/question-bank.css cùng phong cách vườn, checkbox rõ/nút đỏ đất/mobile toàn hàng.

Kiểm tra mới: **112/112 toàn bộ backend**, **10/10 E2E desktop/mobile** (question-delete, lesson-management, question-topics), TypeScript/build riêng `.local/question-delete-build` và diff check đạt. Lượt backend liên quan đầu 30/31 do payload 5001ID bị middleware100KB trả413; thêm parser1MB chỉ route mới để payload5000 hợp lệ, sau đó full suite đạt. E2E cổng3191/database `.local/e2e-question-delete-*.sqlite`, config/output `.local/question-delete-playwright.config.ts`/`.local/question-delete-e2e-results`; đã xem ảnh selection/popup. Kiểm tra lịch sử gồm phiên ôn đã lưu vẫn trả câu và nhận đáp án sau khi câu ngừng dùng, sửa sai/retry không mất. Không ghi/xóa dữ liệu thật Railway.

Sau xem ảnh, đã tăng specificity CSS để nút xóa giữ màu đỏ đất trước theme outline xanh, và checkbox chọn tất cả có trạng thái chọn một phần. Build/TypeScript chạy lại đạt, **4/4 E2E xóa desktop/mobile chạy lại đạt**; ảnh cuối đã xem.

`npm run local` xác nhận Vite5173 vẫn chạy/HMR. **Chưa push/deploy/restart Railway**; xóa nhiều câu trên database thật chờ backend mới. Giữ toàn bộ sửa tài liệu đồng thời đã có lúc bắt đầu (AGENTS/README và docs audit); không đổi việc của luồng khác. Nghiệp vụ question-bank.md, thiết kế app-design.md, ca functional-test-cases.md đã cập nhật.

## Tiếp nhận session mới và kiểm tra tài liệu — 11/10/2026

Đã rà soát **21 Markdown lõi** (AGENTS/README và 19 file docs trước khi thêm báo cáo). Đã đồng bộ mô tả cấp theo chương/mốc giáo viên, vườn toàn lớp/vinh danh riêng, chỉ đúng mới mở lời giải, thêm/xóa bài, đăng nhập/deploy hiện hành và thông số nền CSS. Báo cáo tại [documentation-audit.md](documentation-audit.md), bảng tra cứu hiện hành ở đầu [project-status.md](project-status.md). **Thiết kế chính [app-design.md](app-design.md) đã bổ sung audit vi phạm và các khoảng trống chưa sửa**, không còn chỉ nằm ở báo cáo/bàn giao.

Session mới đọc AGENTS → phần tra cứu hiện hành/project-status → các đợt liên quan tại handoff → app-design và đặc tả chức năng tương ứng. Không phân tích lại toàn bộ đề án hoặc làm lại việc đã hoàn tất; các đợt bên dưới giữ bằng chứng lịch sử, không thay yêu cầu người dùng hay cấp quyền tự deploy. Kiểm tra Git/mã khi tiếp tục; HEAD khi rà soát là e3f85a9, không coi HEAD/PID hoặc kết quả cũ là trạng thái tương lai. Không cộng số test giữa các lượt, không báo chúng thành lần chạy mới.

Đợt này chỉ sửa Markdown: kiểm tra cuối **22 file / 219 liên kết local, không thiếu đích; git diff --check đạt**. Không sửa runtime, chạy lại backend/E2E, deploy/push/restart hoặc ghi Railway. Audit 9 backend / 7 browser đạt + 1 mobile chưa xác nhận là kết quả lượt trước; lỗi offline/focus/AI vẫn chưa sửa. Tiếp tục phần còn thiếu khi được yêu cầu, không dùng checklist lịch sử kế hoạch10:39 để khẳng định thi đã nghiệm thu đầy đủ.

## Nhập câu có chủ đề vào bài đã có — 11/10/2026

Yêu cầu mới: chủ đề chỉ là nhãn tham khảo/phục vụ trộn câu, không ghép vào tên bài hoặc sinh một bài cho mỗi chủ đề. Kiểm tra file Word 50 câu đã tạo: parser giữ `lesson` và `topic` riêng. Cách phân bài trước đây dùng nguyên chuỗi tên; khác `:`, `-`, `·` hoặc `hoà/hòa` có thể làm xuất hiện bài riêng.

Đã thêm **Bài nhận câu hỏi** vào hộp nhập Word/CSV, mặc định bài đang lọc; chọn bài có sẵn sẽ gán toàn bộ câu vào tên bài đó trong bản xem trước và dữ liệu gửi. Chế độ theo file vẫn hỗ trợ nhiều bài, tự ghép tên bài có số tương đương trong cùng chương và liệt kê tên chưa có. Nếu nhiều bài tương đương, chặn để chọn chính xác, không tùy ý gộp. API thêm/sửa/nhập cũng dùng tên có sẵn, kiểm tra trùng sau ghép; retry dùng nội dung đầu vào để không đổi dấu vân tay sau khi tạo bài mới. Chủ đề vẫn lưu riêng, không tham gia danh sách bài. Không đổi câu đã lưu, lịch sử hoặc snapshot, không migration dữ liệu thật.

Xác minh mới: **37/37 backend** (app, catalog, topic, question-lesson-import) đạt trên database riêng; **4/4 E2E desktop/mobile** đạt, nhập Word thật 50 câu/10 chủ đề vào `Bài 1 - Dao động điều hòa` có sẵn, xác nhận danh sách chỉ 1 bài và số câu 50. Đã xem ảnh, kiểm tra không tràn ngang; TypeScript/build riêng đạt. **Chưa push/deploy Railway hoặc xử lý bài trùng đã nhập trước đây.** Frontend local cập nhật bằng HMR; API mới cần triển khai. Hướng dẫn ở `docs/question-bank.md` và `artifacts/question-banks/README.md`.

## Giáo viên cài đặt thời gian tăng cấp — 11/10/2026

Yêu cầu mới nhất: trong trang giáo viên cho cài đặt thời gian tăng cấp, default 60 phút. Đã thêm **Ôn tập & kiểm tra → Thời gian tăng cấp**, cấu hình từng lớp/môn áp dụng mọi chương. Input số nguyên 1–1440 phút, default60, xem trước năm icon/mốc thay ngay khi nhập, nút lưu có busy/validation/thông báo; desktop năm ô, mobile hai cột và cấp5 cả hàng. Không reset draft học kỳ/ma trận khi lưu; reload metadata lớp sau lưu. API cũ thiếu canConfigureLevels thì khóa input/nút, báo chờ server Railway.

Migration bổ sung classroom_level_settings (classroom_id PK, minutes, updated_by, updated_at); POST /api/classrooms/:id/level-settings chỉ teacher sở hữu. shared/student-levels.ts hỗ trợ minutes tùy chọn default60; server/level-settings.ts đọc mốc. Đã nối summary/chapterLevels/learning/roster/xếp hạng/vườn MAX/cây Kết Trái, StudentLevelBadge/timeline/GardenGoal/ChapterGrid và lời giải thích hành trình/thưởng. Với m phút, cấp2–5 ở m/2m/3m/4m, vé3–5 ở 2m/3m/4m, thưởng cây ở4m. Không sửa progress; tăng mốc có thể giảm cấp tính toán nhưng giữ vé đã cấp/dùng và điểm lịch sử, unique nguồn không cấp trùng; đồng bộ vé/thưởng khi học sinh đọc learning/heartbeat như trước.

Kiểm thử mới hoàn thành: **107/107 backend**, **22/22 E2E desktop/mobile** (learning, student-levels, level-settings), TypeScript/build riêng `.local/level-config-build` đạt. Sandbox lượt đầu chặn localhost EACCES nên chạy ngoài sandbox với DB test riêng. Lượt backend đầu ngoài sandbox 105/107: sửa treeLevel export để không nhận Array.map index làm minutes; sửa fixture roster chọn đúng student-demo thay hàng đầu. Chạy toàn bộ lại107/107 đạt. Browser port3181, DB `.local/e2e-level-config-*.sqlite`, config/output `.local/level-config-playwright.config.ts`/`.local/level-config-e2e-results`; không ghi Railway. Ảnh `.local/level-settings-{desktop,mobile}.png` đã xem; sửa margin label để nút/input thẳng hàng desktop sau ảnh đầu. Nghiệp vụ student-levels.md/learning.md, thiết kế app-design.md, ca functional-test-cases.md.

Sau căn margin label, build/TypeScript chạy lại đạt và **4/4 ca cài đặt desktop/mobile chạy lại đạt**. Đã xem lại hai ảnh: input/nút thẳng hàng, mobile đủ năm cấp; ẩn sidebar chỉ trong thao tác chụp card để fixed navigation không che ảnh, không đổi UI app. Các sửa đồng thời `server/lesson-catalog.ts`, `src/QuestionBank.tsx`, `shared/lesson-titles.ts` được giữ nguyên, không thuộc thay đổi cấp độ này.

**Chưa push/deploy/restart Railway.** `npm run local` xác nhận frontend5173 đã chạy, HMR cập nhật. API Railway còn bản cũ nên thao tác lưu chờ deploy backend; không đổi chế độ mặc định sang SQLite offline. Đã giữ file `docs/violations-audit.md` xuất hiện đồng thời từ công việc khác, không chỉnh/commit file đó. Database dautay ở lượt trước không thay đổi trong task này.

## Rà soát vi phạm và xử lý học sinh theo đề án — 11/10/2026

Người dùng yêu cầu kiểm tra đã theo thiết kế ban đầu chưa, không yêu cầu sửa/deploy. Đã đọc bản trích và trực tiếp XML DOCX `(1)` trong Downloads (kỹ năng Documents, chỉ đọc), đối chiếu code Practice/Learning/app/learning/index và quyết định tự nộp lần thứ4. Kết luận cơ chế chính có trong checkout: ôn120 giây + cảnh báo10 + pause130/tiếp tục, ẩn tab không tính giờ; sai vào sổ tay/làm đúng sửa sai mới khắc phục/không lộ lời giải; thi4 cảnh báo thu/khóa, deadline server/worker/teacher close. Mâu thuẫn đề án bảng cuối quá2 tab được giải bằng yêu cầu người dùng lần4. Không có quy định tự trừ điểm kỷ luật/khóa tài khoản; không tự thêm.

Khoảng trống xác nhận: offline4tab giữ event local nhưng UI vẫn chọn thêm, online sync gửi answers trước tabs nên chấm cả đáp án chọn sau lần4; visible blur không được ghi, hidden mới có. Chưa AI Thần Rừng sau lần sai3, chưa nhật ký UI chi tiết/phân loại ngoại lệ; thưởng>=8 vẫn có thể pending khi reason=tabs, đề án không loại thưởng nên cần quyết định chứ không tự đổi. Ưu tiên khóa/ngăn đáp án sau ngưỡng offline, rồi focus/journal/nhắc rõ, trợ giúp sai lặp. Báo cáo bằng chứng/hướng xử lý tại docs/violations-audit.md, learning.md dẫn liên kết.

Kiểm tra mới **9/9 backend liên quan đạt**. E2E audit SQLite riêng cổng3187/build mới `.local/violations-audit-build`, lượt cuối toàn bộ **7 đạt/1 chưa đạt**: desktop idle đạt, online4tab+reload/khóa và hai gap offline/blur xác nhận trên desktop/mobile; ca mobile idle chưa thấy banner ở mốc mô phỏng. Đã điều chỉnh fixture mở chương trước thi (lượt đầu timeout vì đúng gate), clock setup trước timer và chờ study/start; mobile idle vẫn chưa đạt, chưa kết luận lỗi app hay mô phỏng/timing, cần QA điện thoại thật. Trace/code test private `.local/violations-audit*.ts`, `.local/violations-audit-confirmed-results`, `.local/violations-idle-boundary-results`. Các ca gap passing chỉ xác nhận lỗi còn tồn tại, không báo là đã sửa. TypeScript không cần chạy cho audit; build mới/diff check đạt. Không seed/ghi Railway, không sửa code runtime, không deploy/push/restart. Checkout HEAD72e89e2 thay đổi từ công việc khác; giữ nguyên toàn bộ dirty hiện có. API production khác checkout, báo rõ kết luận test không phải nghiệm thu Railway.

## Điều chỉnh dautay cấp 5 theo yêu cầu trực tiếp — 11/10/2026

Người dùng yêu cầu trên database đưa tài khoản **dautay** lên cấp 5 tất cả chương. Đã xác định duy nhất `dautay@greenedu.nk`, student ID `b28150a6-3ad8-499d-9e57-fa501f672af5`, thuộc **Lớp 11/2 ♥ / Vật Lý**, 4 chương I–IV. Vì cấp suy ra từ progress.seconds, đã điều chỉnh thủ công mỗi chương lên **14.400 giây (4 giờ)**; đây là chỉnh tiến độ theo yêu cầu, không phải thời gian heartbeat học thực tế. Chương I trước 189,608 giây, ba chương khác 0. UPSERT dùng MAX để không giảm tiến độ nếu đã vượt mốc; không thêm lớp, attempts, câu hỏi, vé, điểm hoặc tài khoản.

Thao tác Railway `/data/greenedu.sqlite`, backup WAL-safe trước cập nhật **`/data/backups/pre-level5-dautay-1791732842360.sqlite`**, audit **`/data/backups/level5-dautay-1791732842360.json`**; script `.local/set-dautay-level5.cjs` ngoài Git. Transaction kiểm tra đúng 4 ID chương, hash nội dung **30 bảng khác** và mọi progress ngoài phạm vi không đổi; quick_check ok/không lỗi khóa ngoại. Kết nối chỉ đọc mới sau commit xác nhận đủ 4 chương đều >=14.400 giây. Không deploy/push/restart. API khi đọc learning có thể tự đồng bộ vé/thưởng theo quy tắc sẵn có.

Kiểm tra câu hỏi khu vườn trống ngay trước đó: production API garden chưa có members của toàn lớp, chỉ trả trees đạt 14.400 giây/chương; lúc kiểm tra Lớp 11/2 có 47 membership nhưng 0 cây đạt mốc. Frontend mỗi người một cây đã có local nhưng backend tương ứng chưa deploy. Sau điều chỉnh dautay, dữ liệu đủ mốc để API cây cũ trả cây của tài khoản này; toàn bộ danh sách thành viên vẫn cần API mới.

## Đổi sang frame có rào, icon dạo vườn và vinh danh cấp 5 — 11/10/2026

Người dùng sửa ý: không muốn danh sách tầng; cần frame có rào tại vùng trống của Khu vườn của lớp, icon cấp cao nhất/tên/avatar move quanh vườn. Sau đó yêu cầu **frame vinh danh cấp 5 riêng**, còn vườn hiển thị toàn lớp. Đã thay `StudentGarden`/CSS: frame vinh danh Kết Trái ở trên, cảnh vườn rào gỗ bốn phía/cổng/cỏ/lối đi/hoa bên dưới; mỗi thành viên một icon mang tên hai từ cuối/avatar/nhãn cấp cùng di chuyển. Cấp 5 đồng thời ở cả vườn/vinh danh, vinh danh một lần dù nhiều chương đạt. Ưu tiên cấp cao vị trí đầu, không còn nhãn chia tầng. Move theo vùng để tránh chạy ra rào, hover dừng, tắt/bật và reduced-motion; frame cuộn nội bộ desktop650/mobile550 cho lớp đông, rào đứng quanh frame. Mã cấp/API không đổi.

ClassCommunity luôn render hai frame thay white Empty/banner/cây cấp 5 cũ. Khi API Railway chưa trả members, frame/rào vẫn có thông báo chờ, không fake roster/cấp; dùng trees cũ thật để vinh danh sau dedup studentId, avatar null khi chưa có. Giao diện mới qua HMR local5173; **chưa deploy/push Railway, toàn bộ cây/avatar thật vẫn cần backend members đã chuẩn bị lượt trước**. Giữ dữ liệu và thay đổi đồng thời ngân hàng chủ đề/thẻ Săn điểm; không restart offline API.

Kiểm thử dùng SQLite/E2E riêng tại 3179/build `.local/fenced-garden-build`, không ghi Railway. Ca mới xác nhận icon/avatar/tên có chuyển động vị trí, pause/reduced-motion; 47 thành viên còn đủ/cấp5=9, bounds bốn điểm animation không thoát sàn, scroll tới cuối/reload/đổi lớp. Lượt đầu 8 đạt/2 workflow sai kỳ vọng “đang chờ” trong khi API mới đã có học sinh Mầm; đã sửa theo nghiệp vụ mới. Lượt tiếp 8 đạt/2 cuối luồng giáo viên thiếu trạng thái sửa sai demo vì grep bỏ ca học sinh chuẩn bị trạng thái; chạy kèm ca đó theo thứ tự suite hiện có, **12/12 desktop/mobile đạt** (6 garden mới + 2 tương thích cây cũ + 4 practice/teacher workflow). TypeScript/build/diff check cuối đạt; ảnh `.local/fenced-garden-{desktop,mobile}.png` và crowd đã xem. Ảnh mobile ẩn sidebar cố định chỉ khi chụp để tránh overlay trong ảnh toàn trang, không sửa sidebar app. Backend không đổi nên không chạy lại backend lượt này. Thiết kế duy nhất docs/app-design.md.

## Khu vườn mỗi học sinh một cây — 11/10/2026

Theo yêu cầu mới, Khu vườn của lớp đã có `StudentGarden`: mỗi thành viên hiện tại một cây, avatar và hai từ cuối họ tên, nhãn cấp/tên giai đoạn; người hiện tại viền/nhãn Bạn. Tầng cấp cao đứng trên, Kết Trái xuống Mầm; cùng cấp xếp tên, tên ngắn trùng vẫn giữ riêng bằng ID/nhãn họ tên đầy đủ. Cây đung đưa, lá chuyển động nhẹ; nút tắt/bật và reduced-motion. Dùng SVG/Avatar hiện có, không tạo ảnh hoặc dữ liệu tiến độ. Thiết kế tập trung docs/app-design.md, nghiệp vụ docs/student-levels.md.

`GET /api/classrooms/:id/garden` thêm members của toàn bộ membership hiện tại với studentId/studentName/avatarId/level. Cấp lấy MAX giây từng chương thuộc đúng lớp rồi tính bằng studentLevel, không SUM; chưa học/chưa có chương Mầm, người rời lớp không còn. Giữ trees cũ/quyền truy cập, không schema migration hoặc ghi DB. Frontend API cũ vẫn hiện cây cũ kèm thông báo chờ cập nhật server, không lấy cấp tổng từ leaderboard. e2e/workflow.spec.ts cập nhật hai kỳ vọng nhãn SVG cũ sang Cấp 5 · Kết Trái để khớp icon hiện tại.

Kiểm tra mới: **27/27 backend liên quan** (garden/app/student-levels) đạt; sau chuẩn hóa fixture avatar student-1 chạy lại ca garden cũng đạt. **4/4 E2E garden mới + 2/2 tương thích cây cũ** desktop/mobile đạt. TypeScript/build riêng `.local/student-garden-build`/diff check đạt; ảnh `.local/student-garden-desktop.png` và mobile đã xem, không tràn ngang. Server/database E2E riêng tại 3179, không dừng cổng 3101 của công việc khác, không ghi Railway. Tài liệu ca test cập nhật.

**Chưa deploy/push Railway.** Local 5173 nhận frontend qua HMR, nhưng danh sách/avatar/cấp thật cần API members mới trên Railway; hiện API cũ dùng giao diện tương thích. Không tự restart API offline hoặc reset SQLite. Giữ thay đổi đồng thời thẻ Ôn tập & kiểm tra/ngân hàng chủ đề cùng các thay đổi trước trên checkout, không commit/revert chúng.

## Bộ Word 50 câu Bài 1 Vật lí 11 và trộn theo chủ đề — 11/10/2026

Theo yêu cầu tạo bộ đề theo mẫu nhập và lựa chọn tiếp theo “1” (tạo Word **và** bổ sung trộn theo chủ đề), đã tạo `artifacts/question-banks/vat-li-11-chuong-1-bai-1-50-cau.docx`: 50 câu tự biên soạn, 4 phương án/1 đáp án/lời giải, giữ đúng tên `Bài 1: Dao động điều hoà` thuộc Chương I Dao động, sách Kết nối tri thức theo danh mục đã có. 10 nhóm × 5 câu với mã DD11-B1-01…10; nội dung nhận biết dao động, tuần hoàn/điều hòa, li độ, biên độ/quỹ đạo, dạng phương trình, đọc A, tính x đơn giản, đồ thị bằng mô tả/bảng chữ, hình chiếu tròn đều. Không dùng công thức vận tốc/gia tốc/năng lượng/con lắc. Chi tiết nhóm/cách nhập ở `artifacts/question-banks/README.md` và `docs/question-bank.md`.

Mã bổ sung topic tùy chọn (120 ký tự), Word nhận dòng `Chủ đề:`, CSV cũ 8 cột vẫn hợp lệ/thêm cột Chủ đề thứ 9 tùy chọn. Migration thêm `questions.topic DEFAULT ''` giữ câu/ID/lượt làm/tiến độ cũ. Topic đi cùng phiên bản, lịch sử và snapshot; sửa từ client cũ không gửi topic giữ nhãn hiện có, xóa nhãn explicit vẫn được. Trùng nội dung không thể nhập lại chỉ bằng đổi nhãn; fingerprint chống retry vẫn gồm nhãn. Giáo viên xem/sửa ở form/bank/preview. Các thay đổi có sẵn về cấp theo chương/bài/thi được giữ nguyên.

`shared/question-topics.ts` cân bằng các nhóm trong phạm vi chapter/lesson, chuẩn hóa tên chủ đề; chọn nhóm ít dùng và tránh liền nhau khi còn lựa chọn khác. Áp dụng thứ tự luyện tập (chỉ khi có nhãn, không đảo sổ tay), chọn ôn/Săn điểm/tạo đề và thứ tự tập câu cố định thi chính thức. Ma trận theo bài giữ quota, nhóm hết được bù từ nhóm còn lại; không trùng ID. Với bộ này 10/20/23 câu → 1/2/2–3 câu mỗi nhóm; không tránh câu đã gặp giữa các phiên. Phiên đã lưu/resume không bị xáo lại. Câu chưa gắn topic là nhóm chưa phân loại trong bài khi trộn chung; toàn bộ ngân hàng không nhãn giữ cách chọn cũ.

Backend trả `canTagQuestions` trong Chapter. Frontend local chặn xác nhận nhập file có chủ đề khi server cũ thiếu capability, tránh silently mất metadata; form chủ đề cũng disabled trên API cũ. **Chưa deploy/push Railway, chưa nhập bộ 50 câu hoặc ghi dữ liệu production.** API Railway cần được cập nhật trước khi nhập bộ này; không đổi bài học thành 10 bài con để lách. Khi deploy cần giữ nền lesson-catalog/email-domain cùng các thay đổi runtime hiện có đúng scope yêu cầu; không reset database hoặc seed production.

Kiểm thử mới: 103/103 toàn bộ backend trong lượt đầu; sau tinh chỉnh chống trùng/giữ nhãn client cũ, 29/29 ca app/topic chạy lại đạt. TypeScript và build cuối riêng `.local/topic-question-build` đạt. 10/10 E2E desktop/mobile (nhập Word thật, topic/compatibility, ôn resume và thi ma trận) đạt; sau thay đổi cuối 4/4 E2E topic chạy lại đạt. Tất cả dùng database riêng, E2E cổng 3107 qua `.local/topic-e2e.config.ts`; không Railway. Khởi động E2E ban đầu lỗi cwd/tên file chưa thỏa guard, đã sửa cấu hình riêng rồi chạy đạt. Build/loopback sandbox bị EPERM/EACCES, chạy lại với escalation đạt, không tự thay dist đang phục vụ.

Word giữ package mẫu gốc, chỉ thay document.xml và bỏ đường kẻ tiêu đề; mẫu public gốc không đổi. Parser/browser nhận đủ 50 câu không lỗi, 10×5 nhãn tách khỏi lời giải; đã kiểm tra nội dung/đáp án. Renderer đóng gói thiếu LibreOffice Windows; dùng Word COM phiên ẩn đọc-only xuất PDF nội bộ rồi Poppler runtime render và xem 18 trang PNG. Bản render/pdf/script/source JSON/text/audit nằm trong `.local/bai-1-questions`, không phải deliverable. Ảnh E2E `.local/topic-e2e-results` đã lưu. Chưa tạo điểm/tiến độ thật hoặc chạy đăng nhập/tạo dữ liệu Railway.

## Thu gọn thẻ điều kiện Ôn tập & kiểm tra — 11/10/2026

Theo ảnh/yêu cầu mới, đã thiết kế lại thẻ Săn điểm học sinh trong `src/Learning.tsx` và `src/learning.css`: tên chương lên đầu; khung điều kiện ghi **Cấp độ yêu cầu / Cấp 3 · Cây Non** và **Cần vé săn thưởng** kèm số vé còn lại. Cấp/icon/thời gian hiện tại chuyển xuống cuối thẻ trước nút Săn điểm; nút toàn chiều ngang, thẻ cùng hàng căn phần cuối. Bỏ dòng “Cần thêm xx phút học” và mô tả “Từ 2 giờ…” ở giao diện; không hiển thị lại lý do thiếu vé/quyền giáo viên đã có khung/pill. Giữ tỷ lệ đúng, câu cần sửa, lý do tỷ lệ/sửa sai và pill giáo viên mở/chờ mở. Không đổi điều kiện eligible, API, tiêu vé, dữ liệu hoặc quy tắc cấp; bộ lọc câu chữ frontend tương thích lý do của backend Railway cũ.

TypeScript/build riêng `.local/hunt-card-build` đạt; **14/14 E2E learning desktop/mobile** mới đạt trên database riêng. Lượt đầu 12 đạt/2 lỗi file trace ENOENT do thư mục test-results bị thay đổi đồng thời, đã chạy lại toàn bộ với `--output .local/hunt-card-e2e-results` và đạt. Đã xem ảnh `learning-teacher-controls--58ff7-d-stale-starts-are-rejected-{desktop,mobile}/chapter-access-student.png` trong thư mục kết quả riêng, không tràn ngang. Giữ toàn bộ thay đổi chương/bài/cấp/ngân hàng/gộp sửa sai khác trên checkout.

`npm run local` xác nhận frontend **http://localhost:5173/** đang chạy HMR để người dùng xem/test, API/database vẫn Railway. Không push/deploy Railway, không ghi dữ liệu thử production hoặc restart/reset SQLite local.

## Gộp lời nhắc sửa sai lên ô thống kê — 11/10/2026

Kiểm tra mới: 2/2 ca cấp độ desktop/mobile đạt trên build này, đã xem ảnh `.local/correction-card-desktop.png`/`mobile.png`, lời nhắc nằm trong ô thống kê và không tràn ngang. Cổng E2E 3101 có tiến trình khác nên dùng config riêng `.local/correction-playwright.config.ts`, server/database E2E tại 3179; không dừng tiến trình khác. TypeScript/build/diff check đạt, không chạy lại backend vì không đổi nghiệp vụ.

Theo ảnh/yêu cầu mới, đã gộp lời nhắc “Sai một câu, hiểu thêm một điều.” và Mở sổ tay ngay dưới nội dung ô Câu cần sửa sai trên trang chủ học sinh. StudentStats nhận callback optional, Stat hỗ trợ children; chỉ trang chủ hiển thị lời nhắc/nút này. Nội dung dùng số câu của lớp hiện tại, không còn lấy tổng toàn bộ lớp. Bỏ wrapper hai cột/thẻ vàng cạnh StudentLevelCard, khối cấp trải toàn hàng. CSS mới stat-correction-details, giữ các thay đổi đang có và dữ liệu. Thiết kế cập nhật docs/app-design.md. TypeScript/build riêng .local/correction-card-build đạt; kiểm tra hình thức dùng database E2E riêng, không ghi Railway. Local 5173 HMR cập nhật, chưa deploy/push.

## Cấp theo chương và mốc icon; bài/clock/kiểm tra — 11/10/2026

Yêu cầu mới nhất: cấp riêng **lớp → môn → chương**, thanh chia mốc và icon phía trên từng mốc. Đã dùng ChapterLevelTimeline cho khối cấp độ và Hành trình của tôi: 0/1/2/3/4 giờ, Mầm/Chồi/Cây Non/Đơm Hoa/Kết Trái, cấp hiện tại rõ, tiến độ mỗi chương độc lập. GardenGoal chọn một chương chưa hoàn tất, bỏ badge tổng ở thanh tài khoản. Roster/leaderboard trả chapterLevels; UI kèm tên chương, không fallback tổng với API cũ. studentLevel tổng còn để tương thích API, không dùng làm cấp cá nhân UI. Không migration/sửa tiến độ. Thiết kế duy nhất docs/app-design.md; nghiệp vụ docs/student-levels.md.

Các yêu cầu đang làm trước đó cũng đã vào mã: giáo viên Thêm bài/Xóa bài với xác nhận, chống tên trùng chuẩn hóa; archive ẩn câu hiện hành khỏi lượt mới, giữ notebook/attempt/version/snapshot, phục hồi danh mục không tự hiện câu. Practice có đồng hồ HH:MM:SS tạm tính và số API heartbeat đã lưu, dừng khi ẩn/offline/idle/lỗi; server trả creditedSeconds. Luyện tập/ôn chỉ trả/hiện đáp án đúng và lời giải khi đúng; sai/retry/GET phiên cũ được lọc, không tô lựa chọn đúng. Thi chính thức công bố kết quả sau đóng vẫn giữ nguyên.

Giáo viên tạo kiểm tra từ bank với một/nhiều chương, toàn bộ bài/chọn từng bài hoặc Word/CSV có đáp án theo mẫu. Upload nhiều file gắn chương, preview/bỏ câu; backend validate atomic/1–100 câu/chặn trùng, câu riêng active=0, snapshot chấm được. Có requestId chống tạo lại đề/câu, bảng bổ sung exam_creation_requests. Mặc định tạo đóng chờ giáo viên; Mở kiểm tra ngay bật bài, mở những chương xuất hiện trong snapshot, đưa startsAt về hiện tại nếu cần, giữ hạn đóng; không cần điều kiện tự học/vé cho thi chính thức. Chế độ theo lịch vẫn có, gate chương giữ nguyên. Overview thêm examCreation, UI khóa nguồn/mở mới khi backend chưa hỗ trợ, tránh API cũ bỏ qua upload/manualOpen rồi tạo sai đề.

Kiểm tra đợt này: TypeScript/build riêng .local/chapter-milestone-build đạt; 97/97 backend toàn bộ đạt; chạy lại sau khi các module topic đồng thời đã có đủ vẫn 97/97. 18/18 ca learning/student-levels desktop/mobile đạt; bổ sung kiểm tra tâm icon–vạch <2px và chụp trang tiến độ, chạy lại cùng hai ca bài ban đầu 18 đạt/2 lỗi selector chương I khớp II. Đã sửa selector exact heading; lượt tiếp lỗi kỳ vọng câu chữ chống trùng (thực tế “đã có bài cùng tên”), sửa kỳ vọng và 2/2 bài desktop/mobile đạt, tổng 20 ca đã được xác minh. Đã xem ảnh .local/chapter-milestones-desktop.png và .local/chapter-milestones-mobile.png, không tràn ngang. Không ghi dữ liệu Railway.

Lượt xét duyệt đầu bị usage limit, chưa thực thi; sau 21:15 đã thử lại qua chính approval review và được phép chạy, không bỏ qua xét duyệt. Có cập nhật ngân hàng/chủ đề câu hỏi đồng thời trong shared/questions.ts, shared/word-questions.ts, shared/question-topics.ts, server/db.ts, src/QuestionFields.tsx/QuestionBank.tsx và app/learning; giữ toàn bộ. Một lượt E2E bị module question-topics đang chưa tạo xong, không sửa/xóa thay đổi đó; khi module có đủ, kiểm thử bài chạy lại đạt. Khi deploy cần đủ module phụ thuộc hiện tại và thống nhất phạm vi, không chép server/app.ts/learning.ts rồi bỏ module topic.

**Chưa deploy/push Railway.** Frontend local 5173 cập nhật HMR, API/database Railway vẫn bản cũ. Các thao tác giáo viên cần API mới đang khóa/chờ cập nhật. Không restart local API hoặc reset SQLite. HEAD hiện 0b33a1e từ thay đổi bên ngoài session; không revert hoặc commit các thay đổi khác.

## Giáo viên mở kiểm tra theo từng chương — 11/10/2026

Theo yêu cầu mới, đã thêm quyền theo chương vào mã: mặc định khóa với chương cũ/mới; chỉ giáo viên sở hữu lớp mở/khóa tại Ôn tập & kiểm tra. Săn điểm cần thêm quyền này ngoài điều kiện >=2 giờ, >=70%, sửa sai sạch, còn vé. API chặn lượt mới cả khi học sinh dùng trang cũ/gọi trực tiếp; không dùng vé khi bị chặn. Kiểm tra chính thức cần các chương xuất hiện trong snapshot đề được mở, cùng lịch/enabled hiện có; giữ miễn điều kiện thời gian/vé cho thi chính thức. Khóa chương chỉ ngăn lượt mới; giữ bài/đáp án đang làm và retry cùng requestId; muốn thu bài chính thức vẫn dùng Đóng bài thi hiện có. Ôn tập không bị khóa theo quyền mới.

Schema bổ sung chapter_exam_access (chapter_id PK, enabled, updated_by, updated_at), không sửa tiến độ/câu hỏi/mật khẩu. POST /api/chapters/:id/exam-access kiểm tra boolean/vai trò/chủ lớp. Overview trả examAllowed và blockedChapters; frontend có điều khiển riêng, không ghi đè form học kỳ/tỷ lệ. Thiết kế tra cứu duy nhất docs/app-design.md, nghiệp vụ docs/learning.md.

Kiểm thử mới: 91/91 toàn bộ backend, 13/13 ca learning/schema liên quan, 10/10 E2E ôn/thi desktop/mobile, TypeScript/build riêng .local/chapter-exam-access-build đạt. Sau chỉnh thông báo tương thích API cũ ở frontend, build/TypeScript và 2/2 ca quyền chương desktop/mobile chạy lại đạt. Lượt E2E đầu 9/10 do ca mobile kế thừa sổ tay sai từ desktop; đã chuẩn bị lại điều kiện cá nhân trong database E2E riêng và chạy cả bộ lại 10/10. Không ghi dữ liệu Railway. Ảnh quyền giáo viên/học sinh trong test-results/learning-teacher-controls--58ff7-d-stale-starts-are-rejected-{desktop,mobile}/ đã xem; không tràn ngang. Backend test mới gồm mặc định khóa, quyền/trạng thái sai, riêng từng chương, không vượt điều kiện, giữ vé và lượt/đáp án, thi nhiều chương, migration/reopen.

**Chưa deploy/push Railway trong đợt này.** Local 5173 vẫn dùng API Railway cũ: nút giáo viên tạm disabled và thông báo chờ cập nhật server khi response chưa có examAllowed. Chỉ mã frontend HMR đã cập nhật; API production chưa áp dụng gate. Khi được yêu cầu deploy tiếp, đưa server/learning-db.ts, server/learning.ts, shared/learning.ts, src/Learning.tsx cùng các thay đổi lesson-catalog/email-domain đã triển khai trước vào snapshot đúng nền hiện tại; không vô tình đưa tính năng mail/popup khác đang chờ. Không chạy seed/test thật hoặc tự mở quyền production. Sau migration mọi chương mặc định khóa, giáo viên tự mở khi đã học đến chương.

## Sửa lỗi Chrome Outdated Optimize Dep — 11/10/2026

Người dùng báo React JSX runtime 504 với hash cũ 4ea5dd63 trên localhost:5173. HTTP trang/API vẫn 200; log Vite cho thấy các snapshot release trong .local bị quét, thay đổi tsconfig bên trong gây clear cache/full reload. Sửa vite.config.ts: optimizeDeps.entries chỉ index.html của app, watch bỏ qua **/.local/**. Dừng/khởi động lại đúng tiến trình frontend bằng npm run local; cache mới có react/jsx-dev-runtime, không đổi API/database Railway.

TypeScript và diff check đạt. Chrome cài trên máy chạy headless bằng profile riêng xác nhận trang đăng nhập hiển thị, thư viện React/JSX runtime và các dependency đều 200, không pageerror/504. GET auth/me 401 là đúng khi chưa đăng nhập; không đăng nhập thử hoặc ghi dữ liệu Railway. Script kiểm tra riêng .local/check-vite-cache.mjs. Chrome qua CUA không khả dụng nên kiểm tra bằng Chrome độc lập; tab người dùng cần Ctrl+Shift+R để bỏ URL dependency cũ. Không commit/push/deploy Railway.

## Đổi toàn bộ email đăng nhập thành @greenedu.nk — 11/10/2026

Theo yêu cầu “trên database, thay đổi toàn bộ email kể cả đăng nhập thành greenedu.nk”, đã đổi **51/51 tài khoản Railway** (1 Admin, 2 teacher, 48 student) sang **@greenedu.nk**, giữ tên trước @ viết thường. Trước đổi có 50 @greenedu.demo + 1 @gmail.com; dry-run không trùng. **Giữ ID/mật khẩu/hash/name/role/must_change và toàn bộ liên kết**, không reset mật khẩu, thu hồi phiên hoặc gửi email. Email cũ không còn đăng nhập được; nhập tên rút gọn dùng đuôi mới, email đầy đủ được giữ nguyên (không alias email cũ).

Mã shared/login-email.ts thống nhất đuôi cho frontend và backend; server/email-domain.ts là thao tác bảo trì explicit, không tự chạy khi khởi động. Plan kiểm tra email hợp lệ/va chạm, đổi trong BEGIN IMMEDIATE, gọi lại no-op. Seed demo mới, nút điền tài khoản mẫu, README/docs tài khoản và các fixtures liên quan cập nhật .nk; tài khoản custom @greenedu.test chỉ là E2E riêng. Không chuyển database SQLite offline cũ vì đích người dùng yêu cầu là Railway. CSV riêng 46 học sinh .local/tai-khoan-lop-11-2.csv và roster/builder riêng đã đổi đuôi; giữ mật khẩu tạm trong file ngoài Git, không sửa các audit/backup lịch sử.

Đã triển khai gói tối thiểu **.local/email-domain-release-20261011**, dựa trên release chương/bài trước đó, chỉ thêm helper/migration email + cập nhật login/seed/frontend default domain. Giữ API lessons trên Railway, không đưa email chào mừng/account-popup/login-copy đang chờ lên production. Deployment **2f2aa358-1cb0-41d2-bb58-eb24831f4165 SUCCESS**. Không commit/push; GitHub main chưa có cập nhật này hoặc lesson-catalog, khi đồng bộ cần gồm cả hai. Frontend local **http://localhost:5173** vẫn dùng Railway qua HMR; không deploy SQLite local hoặc bật quick login production.

Backup trước triển khai **/data/backups/pre-email-domain-1791721305391.sqlite**; backup ngay trước apply **/data/backups/pre-email-domain-apply-1791721439191.sqlite**. Audit **/data/backups/email-domain-change-1791721439681.json**. Đổi 51, gọi lại 0; kiểm tra 51 user giữ mọi cột ngoài email, **25 bảng còn lại** ngoài users/sessions/study_sessions khớp hash với backup (gồm 4 chương/27 bài, file nhóm và memberships), quick_check ok/FK 0. Xác minh read-only tiếp theo 51/51 @greenedu.nk, 0 email cũ/0 va chạm. Script/kết quả private .local/railway-email-*.mjs, .local/railway-change-login-domain.mjs, .local/railway-email-domain-apply-result.txt.

Kiểm thử mới: **87/87 backend checkout** đạt sau sửa so sánh prototype trong test, **78/78 backend release riêng**, **8/8 E2E đăng nhập desktop/mobile** bằng database riêng; 5 ca mới kiểm tra mọi role, fullname/short, email cũ 401, mật khẩu sai 401, trùng tên chặn toàn bộ và giữ sessions. TypeScript/build release + build frontend .local/email-domain-local-build đạt. Public HTML/JS Railway khớp byte build, JS có greenedu.nk/không có greenedu.demo; health Railway/local ok, demo:false/quickLogin:false. Kết quả .local/email-domain-production-verification.json. Không đăng nhập thử tài khoản thật hoặc tạo tiến độ production. Các ghi chú email .demo bên dưới là lịch sử.

## Tạo Chương/Bài Vật lý 11 trên Railway, kiểm tra local — 11/10/2026

Người dùng yêu cầu deploy local để xem, sau đó đính chính **cập nhật trực tiếp server/database Railway**, **tạo chương và bài trước, câu hỏi cập nhật sau**. Đã nhập vào **Lớp 11/2 ♥ / Vật Lý**, ID 89b7ada1-2e2f-4860-aeec-6e1d42e28adb: **4 chương, 26 bài chính và 1 mục bài tập sóng dừng bổ sung**, tất cả **0 câu hỏi**. Chuyên đề chưa nhập; không tạo bài thi/lịch theo các PPCT sai, câu hỏi/điểm/tiến độ/tài khoản giả.

Mã mới server/lesson-catalog.ts: migration bảng lessons (theo chương/thứ tự dạy/loại/số bài), API danh mục gộp với tên bài từ câu hỏi hiện hành, giữ shape title/questionCount và lịch sử cũ. importCurriculum kiểm tra input/trùng theo lớp/chương, transaction, gọi lại no-op và từ chối ghi đè metadata xung đột. db.ts gọi migration, app.ts đọc trong GET classrooms. Chưa thêm UI/API tạo/nhập bài thủ công; đợt này nhập bằng script riêng đã được yêu cầu. Frontend local: giáo viên mở Xem danh sách bài, học sinh thấy selector kể cả chương 0 câu; chặn luyện tập bài/chương chưa có câu. Thiết kế tại [app-design.md](app-design.md), danh mục tại [physics-11-curriculum-2026-2027.md](physics-11-curriculum-2026-2027.md).

Railway triển khai **backend tối thiểu từ commit production 3c61e2905739f89d813e659a13c2fa31946a2bcc**, gói .local/physics-release-20261011 chỉ đổi runtime server/app.ts, server/db.ts và module mới; **frontend production giữ nguyên**, không đưa thay đổi email/account-popup/login đang chờ lên Railway. Deployment **eb8f32c9-e63f-4c33-b5e3-32b7d1bc212b SUCCESS**. Đúng project zooming-light / production / SangKienKn, SQLite /data/greenedu.sqlite; không commit/push. **GitHub main chưa có API danh mục này**; khi đồng bộ/deploy lần sau cần gồm module/migration/GET mới (dữ liệu lessons vẫn trên volume).

Backup WAL-safe **/data/backups/pre-physics-curriculum-1791720518148.sqlite**, metadata .json cạnh backup; audit /data/backups/physics-curriculum-import-<timestamp>.json. Apply assert đúng service/environment/class/teacher, transaction; chạy lại 0 chương/0 bài mới. Đã so sánh **24 bảng cũ** ngoài chapters/sessions/study_sessions với backup: nội dung/hash không đổi, giữ 51 tài khoản/48 memberships và file nhóm; chỉ thêm 4 chapters/27 lessons, quick_check ok/0 vi phạm FK. Script/kết quả riêng tại .local/railway-physics-import.mjs, .local/railway-physics-*-result.txt, .local/prepare-railway-physics-import.py.

Kiểm tra mới: **82/82 backend checkout, 73/73 backend gói release riêng** đạt; TypeScript/build release và build frontend .local/physics-local-build đạt. 4 lượt UI teacher/student x 1440/390 px bằng server/database in-memory: đủ bài, 0 câu, nút luyện tập disabled, không lỗi JS/tràn ngang; ảnh .local/ui-physics-curriculum và kết quả .local/physics-ui-verification.json. Frontend thật **http://localhost:5173** dùng Railway, health demo:false/quickLogin:false. Đã reload tab giáo viên hiện có, mở Lớp học của tôi, xác nhận 46 học sinh/4 chương và 7 bài Dao động Chưa có câu hỏi; giữ phiên, không tạo lượt làm thử hoặc thay mật khẩu. Tab đang để trang lớp cho người dùng xem. Các đoạn “chưa nhập” bên dưới là lịch sử trước yêu cầu mới.

## Popup avatar và mật khẩu, chạy local để test — 11/10/2026

Theo ảnh trang Tài khoản & bảo mật và yêu cầu mới, đã thu gọn trang giáo viên/học sinh còn thông tin tài khoản và hai nút **Đổi avatar / Đổi mật khẩu**. Click ảnh đại diện trong trang, nút Đổi avatar hoặc avatar trên thanh đầu trang mở trực tiếp popup chọn/tải/lưu ảnh; không cần chuyển trang từ thanh đầu. Popup avatar dùng bộ chọn/quyền/API hiện có, rộng tối đa 760 px và cuộn nội dung. Đóng khi chưa lưu bỏ lựa chọn/ảnh tạm; ảnh đã lưu vẫn giữ. Đổi mật khẩu dùng popup riêng, thành công đóng và báo đã đổi; yêu cầu đổi mật khẩu tạm bắt buộc giữ màn hình riêng hiện có. Trang tài khoản Admin cũng mở đổi mật khẩu qua popup, giữ thông báo thành công trong popup. Không bổ sung avatar cho Admin.

`Modal` dùng chung thêm className tùy chọn và sửa focus để bỏ qua input file ẩn/nút disabled, giữ focus trong popup và trả về nút mở khi đóng. Mã tại `src/App.tsx`, `src/Accounts.tsx`, `src/components.tsx`, `src/garden.css`. Giữ thay đổi đăng nhập/email/backend/import có sẵn; không thay schema/database hoặc ghi dữ liệu Railway trong kiểm thử.

Kiểm tra mới: TypeScript/build riêng `.local/account-popup-build` đạt; **8 E2E avatar/tài khoản có sẵn** đạt trên desktop/mobile. Bộ mới `e2e/account-popups.spec.ts` **6/6 đạt** sau sửa kỳ vọng test focus bỏ qua nút reset đang disabled: mở bằng ảnh/nút/thanh đầu, hủy không lưu, chọn lại không giữ draft, Tab/Escape/focus, form mật khẩu mới khi mở lại, lỗi xác nhận, đổi thành công và đăng nhập bằng mật khẩu mới; Admin mở/đóng. Tất cả dùng database E2E độc lập. Đã xem ảnh desktop/mobile `.local/account-popups-*.png`, `.local/account-avatar-popup-*.png`, `.local/account-password-popup-*.png`.

Theo yêu cầu chạy local để test, `npm run local` xác nhận frontend Vite/HMR **http://localhost:5173/** đang chạy và dùng API/database Railway theo mặc định. Không khởi động backend SQLite local hoặc push/deploy Railway. Bản local được cập nhật qua HMR; kiểm thử không dùng phiên/tài khoản production.

## Phân tích kế hoạch dạy học Vật lý 11 — 11/10/2026

Theo yêu cầu phân tích file `C:/Users/thant/Downloads/KHGD VẠT LÝ 3 KHOI 2026-2027.docx` để tạo Chương/Bài, đã tách phần khối 11 (Kết nối tri thức với cuộc sống), đối chiếu cả hai phương án. Danh mục thường **4 chương/26 bài có số**, thêm một tiết bài tập sóng dừng; chuyên đề tùy chọn **3 chuyên đề/9 bài**. Gộp dòng cùng bài qua nhiều tuần, giữ thứ tự dạy Bài 7 trước 6 và 14 trước 13; không cộng lặp ô TIẾT bị merge. Tổng nguồn: 70 tiết thường + 35 tiết chuyên đề nếu chọn.

Danh mục đầy đủ và đề xuất nhập: [physics-11-curriculum-2026-2027.md](physics-11-curriculum-2026-2027.md); JSON có nguồn/hash, PPCT, yêu cầu cần đạt/mã năng lực, ô bảng gốc và cảnh báo tại [physics-11-curriculum-2026-2027.json](physics-11-curriculum-2026-2027.json). Phát hiện lỗi PPCT `85,56`, `100,101` cuối bảng chuyên đề, cột TIẾT không khớp, HK1 ghi lặp và lịch kiểm tra khác bảng dạy. Chưa tự sửa/ấn định lịch thi. Render đóng gói không chạy được do thiếu LibreOffice runtime; phân tích ô bảng/XML, không có số trang đã xác minh.

Railway SSH **chỉ đọc**, đúng service/environment/database `/data/greenedu.sqlite`: lớp **Lớp 11/2 ♥ / Vật Lý / khối 11**, ID `89b7ada1-2e2f-4860-aeec-6e1d42e28adb`, hiện **0 chương**. App hiện chỉ có `chapters`; bài suy ra từ câu hỏi `questions.lesson`, chưa có bảng/API tạo bài rỗng. Muốn hiển thị đủ cây Chương → Bài trước ngân hàng câu hỏi cần bổ sung lesson độc lập/backfill/bộ nhập có xem trước và chống trùng. Đây là phân tích/danh mục chuẩn bị, **chưa sửa runtime, chưa tạo chương/bài hoặc câu hỏi thật, chưa ghi Railway/deploy/push**. Không tạo câu hỏi/tiến độ giả. Kiểm tra danh mục mới đạt: 26 số bài chính 1–26 duy nhất ở cả hai phương án, 3 chuyên đề/9 bài, tên bài ≤120 ký tự. Không chạy lại test ứng dụng cho thay đổi tài liệu này; giữ toàn bộ thay đổi email/login đang có.

## Tạo danh sách tài khoản học sinh lớp 11/2 — 11/10/2026

Theo danh sách 46 họ tên và mật khẩu tạm người dùng chỉ định, đã **tạo 46 tài khoản student mới trên Railway** và thêm đủ 46 vào lớp **Lớp 11/2 ♥**, môn Vật Lý, ID `89b7ada1-2e2f-4860-aeec-6e1d42e28adb`. Email là toàn bộ họ tên viết thường/bỏ dấu và khoảng trắng, chuyển đ thành d, đuôi `@greenedu.demo`; không trùng nhau hoặc tài khoản cũ. Đặt `must_change=1` cho tất cả tài khoản mới. Không tạo tiến độ, điểm hoặc nhóm, không gửi email cho những địa chỉ đăng nhập demo này.

Thao tác đúng Railway `zooming-light / production / SangKienKn`, SQLite `/data/greenedu.sqlite`; không deploy/restart/push và không nhập database local. Đã dry-run đọc dữ liệu thật trước nhập, sao lưu WAL-safe tại **`/data/backups/pre-import-11-2-1791719190476.sqlite`**, nhập users/memberships trong transaction, giữ nguyên 5 tài khoản cũ. Audit riêng trên volume `/data/backups/import-11-2-1791719191452.json`.

Kiểm tra mới: 3/3 ca script import bằng database độc lập đạt (dry-run, idempotency, giữ mật khẩu cũ, xung đột role/name); xác minh production **chỉ đọc**: đủ 46 tài khoản/email/membership, 46 hash đúng mật khẩu đã yêu cầu, 46 cờ đổi mật khẩu; 5 tài khoản cũ và nội dung 23 bảng khác không đổi so với backup, quick_check ok, không lỗi khóa ngoại; health HTTP 200. Không đăng nhập hoặc tạo tiến độ thử.

Danh sách CSV tiếng Việt UTF-8 BOM và dữ liệu thao tác chỉ nằm trong `.local/` ngoài Git: **`.local/tai-khoan-lop-11-2.csv`**, `.local/class-11-2-roster.json`, `.local/railway-import-11-2-apply-result.json`, `.local/railway-verify-class-11-2-result.json`. CSV có thông tin đăng nhập/mật khẩu tạm; không đưa lên Git/public hoặc chép mật khẩu vào tài liệu. Mã email chào mừng chưa triển khai/cấu hình ở đoạn dưới vẫn giữ nguyên trạng thái.

## Chỉnh lời hướng dẫn đăng nhập — 11/10/2026

Theo ảnh/yêu cầu mới, đã xóa dòng “Nếu chưa có @, tự thêm @greenedu.demo khi đăng nhập.” và liên kết `aria-describedby` tương ứng trong `src/App.tsx`. Dòng dưới nút đăng nhập đổi thành **“Liên hệ giáo viên chủ nhiệm để cấp lại.”**. Chỉ đổi nội dung UI, giữ hành vi đăng nhập hiện có. TypeScript (`npx tsc --noEmit`) mới đạt. Local 5173 đang chạy HMR; giữ phiên Admin đang mở, không đăng xuất hoặc ghi dữ liệu Railway. Chưa push/deploy. Giữ nguyên các thay đổi email/backend/tài liệu có sẵn trên checkout.

## Email xác nhận tài khoản mới — 11/10/2026

Người dùng muốn gửi email tới Gmail của người mới, có giới thiệu theo giáo viên/học sinh; chọn email (không phải lời chào trong app), sau đó yêu cầu phương án đơn giản chỉ để thông báo tạo tài khoản thành công. Đã đề xuất **EmailJS kết nối Gmail cho lượng thư nhỏ**, chuẩn bị mã tích hợp và mẫu thư: xác nhận tạo thành công, một câu giới thiệu vai trò, link/nút mở GreenEdu, nhắc đổi mật khẩu tạm. Chi tiết/cách kết nối tại [welcome-email.md](welcome-email.md), HTML template [emailjs-welcome-template.html](emailjs-welcome-template.html), hình thức tại [app-design.md](app-design.md).

Mã mới `server/welcome-email.ts`: cấu hình opt-in `WELCOME_EMAIL_ENABLED=1`, REST HTTPS EmailJS chỉ ở server, hàng đợi `welcome_emails` thêm bằng migration. Admin tạo teacher/student và giáo viên tạo student ghi queue trong cùng transaction; không gửi cho seed/CLI/Admin/tài khoản cũ, không gửi lại khi thêm membership hoặc cấp lại mật khẩu. Một queue/user, worker claim trước khi gửi và cách lượt ít nhất 2 giây; lưu sent/failed/uncertain, không tự retry kết quả không rõ. Không chứa/gửi mật khẩu/hash/token trong thư. Index xử lý worker và chờ worker khi shutdown. `.env.example` giữ tắt mặc định; không có khóa thật được thêm.

**Chưa cấu hình EmailJS, chưa gửi mail thật, chưa push/deploy backend Railway.** Cần chủ Gmail kết nối trên EmailJS (không gửi mật khẩu qua chat), tạo template, bật non-browser API và đặt SERVICE_ID/TEMPLATE_ID/PUBLIC_KEY (+PRIVATE_KEY nếu yêu cầu) trong Railway Variables, sau đó triển khai backend theo yêu cầu. Frontend local 5173 vẫn dùng backend Railway hiện tại nên chưa có email mới. Chưa có tự đăng ký/Google OAuth; tính năng này gắn vào luồng tạo tài khoản hiện tại, không tự mở đăng ký công khai.

Kiểm thử mới: **20/20** email/tài khoản rồi **76/76 toàn bộ backend**, TypeScript đạt; mock EmailJS và database độc lập, không ghi production hoặc gọi dịch vụ gửi thật. Kiểm tra HTML hai vai trò 640/360 px: link đúng, không tràn ngang; đã xem ảnh `.local/welcome-email-preview-teacher.png`, `-student-mobile.png` và các biến thể. Chưa nghiệm thu inbox/khả năng gửi từ Gmail thật. Giữ các thay đổi có sẵn; không sửa frontend trong yêu cầu này.

## Kiểm tra local và sửa chữ thương hiệu — 11/10/2026

Người dùng phản hồi giao diện Railway chưa giống preview, chữ `greenedu` vẫn thường và yêu cầu chạy local. Git lúc tiếp nhận sạch ở `c32d84b`; kiểm tra mã xác nhận component `Logo` còn chữ thường, đây là chi tiết bị bỏ sót khi áp dụng thiết kế. Đã sửa component chung thành **GreenEdu**, đồng bộ nét đậm cho cả tên ở đăng nhập/sidebar/các vị trí dùng Logo. Không sửa dữ liệu hoặc tự push/deploy đợt này.

`npm run local` xác nhận frontend có sẵn ở **http://localhost:5173/**, dùng API/database Railway. Đã mở tab local trong ứng dụng; HMR hiển thị chữ mới. Tab Railway đang ở màn hình đăng nhập, trong khi ảnh mockup được duyệt là trang chủ học sinh sau đăng nhập; không đăng nhập thử hoặc ghi dữ liệu production. Build/TypeScript mới đạt tại `.local/brand-review-build`; kiểm tra trình duyệt đăng nhập desktop 1312 px/mobile 390 px: chữ GreenEdu, nét 800, không tràn ngang và không log lỗi. Đã khôi phục kích thước trình duyệt; ảnh `.local/brand-local-desktop.png` và `.local/brand-local-mobile.png`. Bản sửa chữ hiện chỉ có local, Railway vẫn dùng commit đã push trước đó.

## Push GitHub và deploy từ main — 11/10/2026

Theo yêu cầu “push lên git để deploy trên Railway”, đã commit và push **`a8336a1058f99807561360449e915c988b9b5bd2`** (`Apply approved warm garden UI and classroom safeguards`) lên **`origin/main`**, repository **https://github.com/phuocthan/SangKienKn**. Fetch trước push xác nhận main không bị lệch; kiểm tra hash toàn bộ file runtime khớp snapshot đã deploy/kiểm thử đợt trước. Commit gồm mã, tài liệu, kiểm thử và prototype riêng; không database/.env/secrets/file học sinh. TypeScript và `git diff --cached --check` chạy lại đạt; không chạy lại bộ backend/E2E vì mã runtime không đổi so với release đã kiểm thử.

Railway đã **tự nhận source GitHub / main / commit a8336a1**, deployment **`c07d72e5-00be-4bf3-bfbd-d9607efc449f` SUCCESS**. Không cần upload CLI hoặc đổi service/volume/cấu hình. Kiểm tra công khai mới: HTML/CSS/JS khớp build, ảnh trường/logo tải và giải mã được, đăng nhập 1440/390 px không lỗi JS/tràn ngang, health `ok:true/demo:false/quickLogin:false`, chưa đăng nhập 401; không ghi dữ liệu production. So sánh khóa bản ghi sau restart: 25 bảng/8 bản ghi được giữ nguyên, integrity ok, không vi phạm khóa ngoại. Kết quả `.local/railway-garden-verification.json` và ảnh `.local/ui-railway-garden/` được cập nhật.

Tài liệu bàn giao/tiến độ được bổ sung bằng commit riêng sau commit mã, không đổi runtime. GitHub main đã có thiết kế mới, các ghi chú “chưa push GitHub/main còn mã cũ” bên dưới là lịch sử. Các lượt push sau vào main sẽ kích hoạt deploy Railway theo nguồn đã kết nối; mặc định phát triển vẫn frontend local 5173/API Railway.

## Deploy Railway thiết kế khu vườn — 11/10/2026

Theo yêu cầu “deploy” sau khi áp dụng ảnh đã duyệt, đã triển khai **https://greenedu.up.railway.app/** bằng Railway CLI từ snapshot mã local, không commit/push GitHub. Đúng project `zooming-light` (`e45def16-099d-454b-a64c-27adf4172a97`), service `SangKienKn` (`d0abfac3-f946-4b3e-8623-a87636bcedc0`), environment `production` (`a515d737-f7a4-4b62-b49a-13a2408e9928`). Deployment **`f313de7d-3787-4dd4-88a7-ca0616abed83` SUCCESS**. CLI đã liên kết checkout với service này. Gói `.local/railway-release-20261011-170511` chứa mã/runtime và ảnh public, không chứa database/.env/log/prototype; manifest/hash tại `.local/railway-release-manifest.json`. Triển khai cả mã hiện tại đã kiểm thử, gồm thiết kế và thay đổi cấp học sinh/chặn lớp trùng có sẵn trên checkout.

Đã xác minh Node production 24.21.0, volume `/data` READY, `DATABASE_PATH=/data/greenedu.sqlite`, `NODE_ENV=production`, `SEED_DEMO=0`, `LOCAL_QUICK_LOGIN=0`; giữ nguyên cấu hình. Backup trước deploy **`/data/backups/pre-garden-2026-10-11T10-04-51.829Z.sqlite`** (2.793.472 byte) trên volume. Sau restart: so sánh đầy đủ nội dung bản ghi ở **25 bảng, 8 bản ghi** với backup không đổi, bao gồm blob avatar/file trong SQLite; bỏ qua sessions/study_sessions có thể biến động. `quick_check=ok`, không vi phạm khóa ngoại. Không chuyển/xóa/reset dữ liệu local hoặc Railway.

Kiểm tra mới đợt deploy: **67/67 backend** bằng database riêng, TypeScript và build riêng `.local/railway-check-build` đạt. Build Railway đạt; HTML trỏ đúng CSS/JS mới và byte của hai asset khớp build local. Health `ok:true/demo:false/quickLogin:false`, phiên chưa đăng nhập 401. Chromium kiểm tra đăng nhập **1440/390 px**: giao diện mới `--green:#315d3e`, khung 26 px, không tràn ngang/lỗi JS; không đăng nhập/ghi dữ liệu thử Railway. Ảnh `.local/ui-railway-garden/`, kết quả `.local/railway-garden-verification.json`, dữ liệu kiểm tra `.local/railway-db-before.json` và `.local/railway-data-after.json`; script `.local/verify-garden-railway.mjs`. Các **40 E2E** và rà soát 4 kích thước ở đoạn áp dụng bên dưới là lượt trước, không chạy lại trong đợt deploy này.

Frontend local 5173/API Railway vẫn là mặc định; prototype 5180 vẫn riêng. Git vẫn có thay đổi chưa commit. **GitHub main chưa có bản thiết kế mới**: lần deploy/redeploy lấy source GitHub cũ sẽ không có thay đổi này; cần đồng bộ mã khi người dùng yêu cầu. Các đoạn “chưa deploy Railway” phía dưới là lịch sử trước đợt này.

## Áp dụng thiết kế khu vườn đã duyệt vào app — 11/10/2026

Người dùng đã duyệt ảnh ImageGen và yêu cầu “áp dụng nó luôn”. Đã đưa thiết kế vào app thật: `src/garden.css` nạp cuối, nền kem/xanh rừng, sidebar bo mềm, nút/khung/bảng/form/modal/đăng nhập đồng bộ cho ba vai trò. Trang chủ học sinh trong `src/App.tsx` có hero + mục tiêu, ba thống kê, chương gọn, hành trình và sổ tay phía dưới; `src/GardenGoal.tsx` dùng thời gian lớp/môn thực để hiển thị mục tiêu lên cấp kế tiếp và cây ra hoa. Không đưa số mẫu 10/15 phút theo ngày hoặc dữ liệu minh họa vào app. Giữ logo, ảnh trường v11, ảnh cây/sách và mọi luồng/chọn bài hiện có; không thay backend/schema/dữ liệu hoặc thay đổi nghiệp vụ cấp cây.

Kiểm tra lượt này: TypeScript và build riêng `.local/warm-garden-build` đạt; **40/40 E2E** desktop/mobile (đăng nhập, cấp học sinh, tài khoản, nhóm, ôn/thi, workflow) đạt bằng database kiểm thử riêng. Rà soát ảnh/bố cục/nội dung tối thiểu 13 px ở **1440/768/390/360 px** đạt, không tràn ngang/lỗi JS. Ảnh tại `.local/ui-warm-garden`, script `.local/warm-garden-review.mjs`; đã xem trang chủ học sinh, giáo viên, đăng nhập, ngân hàng câu hỏi và modal mobile. `e2e/quick-login.spec.ts` cập nhật lời chào mới.

Frontend thật **http://localhost:5173** đang chạy Vite/HMR PID **87756**, API/database Railway theo mặc định hiện tại. Kiểm tra thật chỉ đọc: health khớp Railway, quickLogin:false, phiên chưa đăng nhập 401, đăng nhập hiển thị không lỗi JS, không ghi dữ liệu Railway. Không restart database/backend, không thay `dist`, không commit/push/deploy Railway. Prototype **5180 vẫn là bản minh họa cũ**, không phải app thật; các đoạn “chờ duyệt/chưa áp dụng” bên dưới là lịch sử trước yêu cầu mới. Thiết kế hiện tại tra cứu [app-design.md](app-design.md).

## Ảnh preview khu vườn để chỉnh tiếp — 11/10/2026

Theo yêu cầu mới, đã tạo một mockup desktop bằng ImageGen tích hợp, dùng ảnh `.local/ui-garden-preview/student-home-1440.png` làm tham chiếu. Thiết kế nền kem/xanh rừng, hero cây mọc từ sách, nút và khung đồng bộ, thẻ chương gọn và hành trình cây bên dưới. Đã xem ảnh kết quả để kiểm tra bố cục và chữ; đây là ảnh minh họa để duyệt, không phải giao diện đã triển khai. Ảnh giữ ở `C:/Users/thant/.codex/generated_images/01a128d2-3449-7e63-93dd-f548a9a1e26a/exec-0cadadf8-cb3b-457d-acb5-b26e644ae709.png`, đã hiển thị cho người dùng. Chưa sửa app hoặc bản preview tương tác 5180, chưa deploy/push. Tiếp theo nhận yêu cầu chỉnh ảnh hoặc phê duyệt trước khi áp dụng. Không chạy kiểm thử mã vì đợt này chỉ tạo ảnh và cập nhật bàn giao.

## Preview thiết kế khu vườn để duyệt — 11/10/2026, 16:42

Yêu cầu mới: thiết kế lại sâu hơn gồm button/frame/bố cục, tạo preview để duyệt và sửa **trước khi update**. Người dùng đã đính chính hướng ban đầu thành **khu vườn ấm áp, gần gũi**; đây là hướng hiện tại. Bản tương tác riêng ở **http://localhost:5180**, nguồn [design-preview](../design-preview/README.md), lệnh `npm run preview:design`. Không đưa thiết kế vào `src`, không thay `dist`, không deploy/push; giữ app hiện tại và mặc định frontend local/API Railway.

Preview có Học sinh/Giáo viên/Quản trị/Đăng nhập và các trang tổng quan/luyện tập/sửa sai/ôn thi/lớp/câu hỏi/tiến độ/nhóm, modal minh họa. Nền kem, xanh dịu/vàng đất, sidebar nổi bo mềm, thẻ nhẹ, nút đồng bộ, cây SVG và ảnh/logo hiện có. Thanh preview đổi role, desktop/mobile, palette Vườn xanh/Vườn nắng, bo góc, thoáng/gọn, nền trường; lưu lựa chọn/góp ý thành JSON. Chỉ dữ liệu minh họa trong bộ nhớ, không gọi API/database thật.

Build preview đạt; **68 màn hình/trạng thái** ở 1440/768/390/360 px đạt, không tràn ngang/lỗi JS; thao tác mẫu/tùy chỉnh/lưu JSON đạt, request không gọi API/dịch vụ ngoài. Ảnh `.local/ui-garden-preview/`, script `.local/review-garden-preview.mjs`. Tiếp theo: nhận phản hồi/duyệt, chỉnh riêng preview, chỉ áp dụng lên app khi được yêu cầu. Lựa chọn lưu ở preview không tự được coi là duyệt.

## Mặc định frontend local, API/database Railway — 11/10/2026

Người dùng yêu cầu từ giờ run local để test nhanh nhưng server/database trực tiếp từ Railway, đồng thời lưu quy tắc vào Markdown. Đã cập nhật `AGENTS.md`, [dev-railway.md](dev-railway.md), README và hướng dẫn deploy cũ. **Không tự deploy local sau mỗi thay đổi nữa.** Dùng `npm run local` (nền) hoặc `npm run dev` (terminal), frontend Vite/HMR tại **http://localhost:5173**, proxy `/api` tới **https://greenedu.up.railway.app**. Backend local được giữ riêng qua `npm run dev:offline` và bộ E2E vẫn dùng database riêng.

Frontend đang chạy PID **87756**; quản lý bằng `npm run local -- -Action Status/Stop`. Đã kiểm tra start/dùng lại/stop/start. Đã dừng API local được script deploy quản lý ở 3002; giữ nguyên `.local/greenedu.sqlite` và các backup. Cổng 3001 nếu còn server cũ ngoài script không bị can thiệp; frontend mới không dùng cổng đó. Các trạng thái deploy local bên dưới là lịch sử.

Proxy loopback kiểm tra Origin/cross-site trước khi đổi Host/Origin upstream; giữ HttpOnly/SameSite, bỏ Secure/Domain cookie trên HTTP local, TLS tới Railway vẫn xác minh. Không mở CORS hay sửa server Railway. Chế độ này đăng nhập bằng tài khoản/mật khẩu Railway, quickLogin:false; thao tác người dùng sẽ ghi dữ liệu thật Railway. Không seed hoặc chạy test tạo dữ liệu trên Railway. Sửa backend ở checkout chưa có hiệu lực cho frontend này trước khi triển khai Railway; không tự push/deploy.

TypeScript và build riêng đạt; **4/4 kiểm thử proxy** (`server/dev-proxy.test.ts`) đạt: phiên đăng nhập/cookie/logout trong Chromium, JSON/multipart và chặn Origin lạ/cross-site bằng upstream thử độc lập. Kiểm tra thật chỉ đọc: health local khớp Railway, ok:true/demo:false/quickLogin:false; `/api/auth/me` chưa đăng nhập trả 401; giao diện dùng Vite client, có form đăng nhập, 0 lỗi JS. Không đăng nhập thật/ghi dữ liệu/triển khai Railway; chưa xác minh cấu hình volume/database Railway hoặc dữ liệu sau restart. Ảnh `.local/railway-local-login.png`, script kiểm tra `.local/verify-railway-frontend.mjs`.

## Đổi bộ cấp học sinh theo yêu cầu — 11/10/2026, 11:47

Tên và icon hiện tại: **Mầm → Chồi → Cây Non → Đơm Hoa → Kết Trái**. Ba icon cuối lần lượt là cây nhỏ, cây có hoa, cây có quả. Giữ cách tính tổng thời gian riêng từng lớp/môn và ngưỡng 0/1/2/3/4 giờ; không thay tiến độ học sinh. Các tên Lá/Cây/Đại thụ ở những đoạn cũ bên dưới là lịch sử. Quy tắc ở [student-levels.md](student-levels.md), thiết kế ở [app-design.md](app-design.md).

TypeScript, build, **26/26 backend** (`student-levels.test.ts`, `app.test.ts`) và **4/4 E2E** icon desktop/mobile đạt với database riêng. Đã xem ảnh đủ năm icon/cấp trên hai kích thước; báo cáo `.local/student-stages-renamed-browser-results.json`, ảnh `.local/student-level-icons-preview-desktop.png` và `-mobile.png`.

Đã tự deploy local **http://localhost:3002**, PID **92676**, demo:false, quickLogin:true. Backup `.local/backups/database-20261011-114736-419.sqlite`. Health và tài nguyên giao diện đạt, HTML/assets khớp build đã kiểm thử; SQLite chỉ đọc xác nhận khóa ngoại hợp lệ và bảo toàn khóa 47 bản ghi trong 25 bảng. Không triển khai Railway. Đây là trạng thái local mới nhất; các deploy phía dưới là lịch sử.

## Deploy bố cục chữ theo yêu cầu — 11/10/2026, 11:40

Người dùng yêu cầu “deploy”; đã chạy `npm run deploy` trên checkout hiện tại, triển khai local **http://localhost:3002**, PID 96680, `demo:false`, `quickLogin:true`. TypeScript/build và `/api/health` đạt; `npm run deploy:status` xác nhận running. HTML/CSS được phục vụ khớp `dist`, có token cỡ chữ mới và bố cục lời nhắc mobile; ảnh nền v11 trả 200. Kiểm tra SQLite chỉ đọc: khóa ngoại hợp lệ. Script đã backup `.local/backups/database-20261011-113959-790.sqlite` trước restart; không ghi dữ liệu thử, commit/push hoặc triển khai Railway. Lượt này cập nhật cả các thay đổi có sẵn trên checkout, bao gồm icon cấp học sinh và sửa tạo lớp trùng. Ghi chú “chưa deploy” của đợt chữ lúc 11:15 là lịch sử trước lượt này.

## Kiểm thử chức năng và icon cấp học sinh — 11/10/2026, 11:16

Theo yêu cầu người dùng đã thêm [danh mục test case](functional-test-cases.md), sáu ca API và ba ca trình duyệt cho tạo lớp/tài khoản, trùng email/membership, gửi bốn yêu cầu đồng thời, mất phản hồi rồi gửi lại, validation/phân quyền và cấp lại mật khẩu học sinh học với nhiều giáo viên. Phát hiện và sửa API tạo lớp trùng: cùng giáo viên/tên/môn/khối, chuẩn hóa hoa/thường/khoảng trắng/Unicode; check/insert trong `BEGIN IMMEDIATE`. Không tự gộp/xóa lớp cũ.

Người dùng yêu cầu icon theo cấp và chọn phương án **tổng thời gian từng lớp/môn**, lên cấp ở 1/2/3/4 giờ. Đã thêm năm icon SVG Mầm/Chồi/Lá/Cây/Đại thụ, badge/thẻ cấp, API metadata trong danh sách lớp/roster/xếp hạng. Cấp suy ra từ progress từng classroom_id; không cộng lớp/môn/học sinh khác và không làm thay đổi điều kiện cây/vé/thi theo chương. Hướng dẫn [student-levels.md](student-levels.md), thiết kế tại [app-design.md](app-design.md).

Kiểm thử mới trong lượt này: **63/63 backend, 50/50 E2E toàn bộ**, desktop/mobile, không skip/flaky. Thêm 14/14 E2E lớp/tài khoản/icon và 4/4 icon sau cập nhật CSS/cỡ chữ đồng thời. TypeScript/build đạt, xem ảnh cả năm cấp và preview; mọi dữ liệu thử dùng database riêng. Lượt trình duyệt đầu có lỗi điều hướng/tên nút trong test tạo lớp, đã sửa và chạy lại đạt. JSON và ảnh tại `.local/`, chi tiết tại danh mục test case.

Đã tự deploy **http://localhost:3002**, PID 86592, demo:false, quickLogin:true. Backup `.local/backups/database-20261011-111609-164.sqlite`; status/health/frontend/ảnh/năm icon đạt, frontend khớp build cuối đã kiểm thử. Kiểm tra SQLite chỉ đọc: khóa ngoại hợp lệ, giữ khóa 47 bản ghi trong 25 bảng so với backup, loại trừ sessions/study_sessions biến động. Không ghi dữ liệu thử database chính, không commit/push hoặc triển khai Railway trong lượt này. Giữ nguyên thay đổi typography có sẵn/đồng thời trong workspace.

## Bố cục và cỡ chữ — 11/10/2026, 11:15

Đã xử lý yêu cầu “chữ to chữ nhỏ khó đọc”: thống nhất token cỡ chữ trong `src/styles.css`, dùng chung cho CSS giao diện, ôn/thi và cấp học sinh. Nội dung 15 px, nhãn/nút 14 px, chú thích 13 px, trường nhập 16 px; tiêu đề trang 28/24 px desktop/mobile. Giảm tiêu đề giới thiệu đăng nhập 50→36 px, chỉnh giãn dòng/độ đậm chữ phụ, nhãn bộ lọc nằm trên ô chọn và xuống hàng khi cần, số liệu thống kê có hàng riêng. Mobile thanh chọn lớp/tài khoản co giãn, mốc cấp độ ba cột/hai hàng, nút lời nhắc ở dưới đoạn chữ. Quy tắc chi tiết tại [app-design.md](app-design.md).

TypeScript/build `.local/typography-build` đạt. 8 E2E desktop/mobile về bố cục, luyện tập/sửa sai, ôn học kỳ và tạo/làm thi đạt; sau chỉnh bộ lọc chạy lại 2 kiểm thử bố cục đạt. Rà soát cuối đăng nhập/cả ba vai trò/ôn thi/bộ lọc/modal tại 1440/768/390/360 px đạt: không tràn ngang, không lỗi JavaScript, các khối nội dung được kiểm tra không còn chữ dưới 13 px. Ảnh `.local/ui-typography/`; E2E dùng cổng 3104 và database riêng vì cổng 3101 đang được một lượt kiểm thử khác dùng. Không dừng tiến trình khác, không ghi thử vào database chính, không commit/push hoặc deploy trong yêu cầu chỉnh hình thức này. Giữ các thay đổi tài khoản/cấp độ đang có trên checkout. Bản local/Railway chưa được cập nhật bởi lượt này.

## Cập nhật Railway — 11/10/2026

Người dùng đã deploy service `SangKienKn` trong project `zooming-light` / `production`, ảnh dashboard cho thấy Online và volume `sangkienkn-volume`. URL: https://greenedu.up.railway.app/. Agent đã kiểm tra HTTP chỉ đọc ngoài sandbox: trang chủ 200 và `/api/health` 200 với `{ok:true,demo:false}`. Chưa xác nhận đăng nhập/Admin, Mount Path/database trên volume, commit triển khai hoặc dữ liệu sau restart.

Để tạo Admin ngay trong Railway, mở service → **Console** (trong ảnh nằm giữa Metrics và Settings). Console có shell trong trình duyệt; không cần cài CLI để dùng cách này. Kiểm tra `DATABASE_PATH=/data/greenedu.sqlite`, rồi chạy `cd /app` và `npm run create:admin`; mật khẩu nhập riêng trong terminal. SSH/Copy SSH Command là cách thay thế. Railway đã công bố Console dùng chung từ 05/06/2026: https://railway.com/changelog/2026-06-05-sandboxes. Không tự chuyển dữ liệu local, ghi dữ liệu thử, commit/push hoặc deploy local trong yêu cầu hướng dẫn này. Các trạng thái hosting trong tài liệu lịch sử bên dưới có thể thuộc thời điểm trước lần deploy Railway.

## Bản bàn giao gốc — lịch sử 10/10/2026

**Các phần từ đây tới cuối thuộc bối cảnh ban đầu**, giữ để đối chiếu kiến trúc/yêu cầu/bằng chứng. Những mô tả chưa có hosting, chưa thi/vé, .demo, cấp tổng, cổng3002, E2E chỉ Linux hoặc mục chưa chốt đã được thay ở các cập nhật phía trên. Không dùng chúng làm trạng thái/lệnh hiện hành. Múi giờ người dùng Asia/Bangkok (UTC+7); session mới vẫn cần đọc repository và kiểm tra Git/mã thực tế.

## Mục tiêu và cách làm việc

Người dùng muốn xây dựng GreenEdu, web app tiếng Việt cho giáo viên/học sinh: luyện tập, sổ tay sửa sai, cây kiến thức, quản lý lớp, hoạt động nhóm và các phân hệ đánh giá/thưởng theo đề án. Ban đầu yêu cầu đọc Word và phân tích dưới góc nhìn chuyên gia web app/phân tích hệ thống, sau đó yêu cầu bắt đầu triển khai.

Repository: **https://github.com/phuocthan/SangKienKn**, nhánh dùng để pull là **main**. Máy người dùng chạy **Windows**, checkout đã có ở **D:\SangKienKn**. Session trước phát triển trên cloud; người dùng từng đề nghị chuyển sang local, sau đó cho phép tiếp tục cloud. Khi mở session tại local, dùng chính checkout local, không giả định máy cloud có thể điều khiển máy Windows.

Người dùng muốn công việc được tiếp tục, thông báo rõ đã làm/bước còn lại, và cập nhật Git để pull chạy local. Giao tiếp tiếng Việt, ưu tiên sản phẩm chạy được. Người dùng từng đồng ý link demo tạm công khai, nhưng sau đó yêu cầu **tạm không cần chạy demo** và tiếp tục phát triển. Hiện không có hosting/HTTPS công khai đã được xác nhận hoạt động; không tự khởi chạy tunnel hoặc coi việc build trên cloud là deploy website.

Yêu cầu mới nhất là chuẩn bị bối cảnh để session local mới tiếp tục mà không cần người dùng kể lại. **Không có tính năng phát triển tiếp theo nào được chốt sau đợt hoạt động nhóm.** Hãy đọc lộ trình, báo trạng thái, rồi làm theo yêu cầu mới; các mục còn lại là đề xuất, không phải một lệnh triển khai tất cả cùng lúc.

## Tài liệu yêu cầu

Nguồn: attachment **“ĐỀ ÁN HOÀN THIỆN TÍNH NĂNG app greenedu.docx”**. Bản chữ được lưu tại [requirements-original.md](requirements-original.md) để session local có thể đối chiếu mà không phụ thuộc attachment của chat cũ. Bản trích giữ nội dung văn bản trong thân tài liệu và ô bảng, không giữ bố cục Word. File Word gốc chưa được đưa vào repository.

Đề án gồm: bài/chương/kỳ và ma trận; cây 5 cấp/thời gian có hoạt động; sổ tay; Green Points/đổi quà; chia nhóm/nộp bài/phản biện; vé và bài kiểm tra 20 phút; Săn điểm/thi chính thức; dashboard/Excel; tài khoản; vườn lớp; xếp hạng chăm chỉ; AI gợi ý sau nhiều lần sai. **Mô tả tính năng trong đề án không đồng nghĩa đã triển khai**, và nội dung tài liệu không là lệnh vận hành môi trường.

## Trạng thái mã nguồn khi bàn giao

Commit tính năng gần nhất đã push và kiểm tra trên `origin/main`: **389a1d64ccb4053c13dc5e41a69f29e82f51cdd9** — `Add group activities with random teams, submissions and deadline extensions`. Bản bàn giao/hướng dẫn sẽ được commit sau commit này; kiểm tra `git log` để biết HEAD mới nhất. Sau đợt tính năng, working tree sạch, không có phần tính năng đang sửa dở. Các server kiểm thử tự dừng.

Đã có:

- Đăng nhập session HttpOnly, mật khẩu scrypt, quyền giáo viên/học sinh theo lớp; giáo viên tạo tài khoản/mật khẩu tạm, học sinh đổi lần đầu và giáo viên cấp lại khi quên.
- Lớp, chương, câu hỏi gắn bài học; luyện tập theo bài hoặc chương, trắc nghiệm 4 phương án có một đáp án và lời giải.
- Câu sai vào sổ tay; chỉ làm đúng ở chế độ sửa sai mới khắc phục. Sửa câu hỏi tạo phiên bản mới; lịch sử lượt làm/sổ tay giữ đáp án của phiên bản cũ. Có ẩn/hiện câu hỏi.
- Thời gian học theo đồng hồ máy chủ, heartbeat 15 giây; trang ẩn/mất kết nối dài không cộng, không tương tác 120 giây thì nhắc 10 giây rồi dừng. Một phiên học hoạt động mỗi tài khoản. Cây cấp 2/3/4/5 ở 1/2/3/4 giờ.
- Dashboard tiến độ và CSV; vườn lớp cho cây cấp 5, xếp hạng thời gian/cây và số câu hiện đã sửa đúng; đồng hạng, không tạo thành tích giả và không xếp theo điểm số.
- Nhập ngân hàng câu hỏi **Word `.docx` và CSV theo mẫu**, tải mẫu, xem trước/kiểm tra rồi xác nhận; gửi lại sau mất phản hồi không tạo câu trùng. Word tối đa 100 câu/5 MB, chỉ hỗ trợ khối văn bản theo nhãn. Mẫu có hai câu và lời giải tiếng Việt ở `public/templates/greenedu-cau-hoi-mau.docx`. Xem [question-bank.md](question-bank.md).
- **Hoạt động nhóm** đã hoàn thành phạm vi người dùng yêu cầu gần nhất; chi tiết bên dưới.

Chưa hoàn thành toàn bộ đề án, chưa nghiệm thu lớp thật, chưa kiểm thử tải, chưa vận hành production. Lộ trình/điểm cần chốt nằm trong [project-status.md](project-status.md).

## Yêu cầu hoạt động nhóm đã triển khai

Người dùng yêu cầu đối chiếu Word, thêm **Hoạt động nhóm** ở giáo viên; tạo tên/lớp/yêu cầu nhập hoặc tải Word hiển thị trên web/hạn nộp; cấu hình số nhóm và chọn thành viên ngẫu nhiên; học sinh nộp trước hạn; giáo viên gia hạn; sản phẩm Word/PDF/Canva/PowerPoint.

Quy tắc hiện tại:

- Cả giáo viên và học sinh có menu Hoạt động nhóm. Lớp được chọn ở thanh đầu ứng dụng.
- Yêu cầu nhập trực tiếp, Word `.docx` tối đa **5 MB**, hoặc cả hai. Trích chữ từ đoạn/bảng/xuống dòng trên web, giữ bản Word tải về để xem ảnh/bố cục. Word `.doc` cũ cần Save As `.docx`.
- Chia ngẫu nhiên cân bằng, số nhóm 1..số học sinh. Chốt thành viên một lần, tải lại không chia lại. Đại diện được chọn khi chia; giáo viên đổi được sang thành viên hiện còn trong lớp và thuộc cùng nhóm.
- **Đại diện nộp cho cả nhóm**, theo phần đại diện trong đề án. Sản phẩm Word `.doc/.docx`, PDF `.pdf`, PowerPoint `.ppt/.pptx` tối đa **10 MB**, hoặc link HTTP/HTTPS (như Canva). Không tải nội dung link bên ngoài; người nộp cần bật quyền xem trên Canva.
- Nộp nhiều phiên bản trước hạn, giữ file/link cũ, người nộp, thời gian máy chủ và ghi chú. Có mã yêu cầu chống ghi trùng khi mất phản hồi rồi nộp lại.
- Thời gian máy chủ bằng hoặc vượt hạn thì chặn nộp mới; form ẩn khi hết hạn. Gửi lại một yêu cầu đã được nhận vẫn trả bài cũ sau hạn. Gia hạn chỉ giáo viên, hạn mới sau hạn cũ và tương lai; lưu lịch sử. Kiểm tra phiên bản hạn/đại diện để tránh ghi đè thay đổi vừa có.
- Giáo viên chỉ thấy lớp mình; học sinh chỉ thấy nhóm/sản phẩm nhóm mình. Word yêu cầu cho cả lớp. Tải file phải có session/quyền lớp/nhóm; không có thư mục upload công khai.
- File gốc và sản phẩm lưu **SQLite BLOB** cùng database. Migration thêm bảng, giữ dữ liệu cũ; sao lưu database phải gồm file.
- Học sinh vào lớp sau lúc tạo chưa có nhóm trong hoạt động cũ. Người rời lớp mất quyền truy cập nhưng lịch sử vẫn còn. Chưa có thao tác đổi/thêm thành viên vào nhóm đã chốt.
- **Phản biện chéo, chấm điểm và thưởng nhóm chưa triển khai.** Trong đề án còn Excel/ảnh và xem nhóm khác sau hạn; đợt này chỉ làm định dạng/quyền hiện tại nêu trên, không mở xem bài nhóm khác tự động.

Xem [group-activities.md](group-activities.md) để biết quy trình và giới hạn.

## Kiến trúc và vị trí mã

React 19 + TypeScript + Vite 6; Express 5; **Node.js 24+** dùng `node:sqlite`; SQLite cho MVP một instance. Font tiếng Việt được phục vụ trong app. Không cần cài SQLite riêng. Các route API yêu cầu session, kiểm tra role/lớp và từ chối ghi khác nguồn.

| Vị trí                                                   | Vai trò                                                     |
| -------------------------------------------------------- | ----------------------------------------------------------- |
| `src/App.tsx`, `src/components.tsx`, `src/styles.css`    | Điều hướng, màn hình chính, modal và CSS responsive         |
| `src/api.ts`, `src/types.ts`                             | Client API JSON/FormData, kiểu dữ liệu                      |
| `src/Practice.tsx`, `src/ClassCommunity.tsx`             | Luyện tập/sổ tay, vườn lớp/xếp hạng                         |
| `src/QuestionBank.tsx`, `src/QuestionFields.tsx`         | Quản lý câu hỏi, phiên bản, nhập file                       |
| `shared/questions.ts`, `shared/word-questions.ts`        | Kiểm tra câu hỏi/CSV, đọc và tách Word                      |
| `src/GroupActivities.tsx`, `shared/group-activities.ts`  | Giao diện và kiểu hoạt động nhóm                            |
| `server/app.ts`, `server/db.ts`, `server/index.ts`       | API, đăng nhập/phân quyền, schema/migration/seed, khởi động |
| `server/group-activities.ts`, `server/activity-files.ts` | API nhóm, nộp/gia hạn, kiểm tra file/trích Word             |
| `server/app.test.ts`, `server/group-activities.test.ts`  | Kiểm thử nghiệp vụ/API/database                             |
| `e2e/workflow.spec.ts`, `e2e/groups.spec.ts`             | Luồng trình duyệt desktop/mobile                            |
| `playwright.config.ts`                                   | Server/database kiểm thử riêng, cấu hình Chromium           |
| `scripts/check-node.mjs`, `.nvmrc`, `.env.example`       | Kiểm tra Node 24, phiên bản, cấu hình demo                  |

## Chạy local Windows và bảo toàn dữ liệu

Lỗi trước đây: `ERR_UNKNOWN_BUILTIN_MODULE: node:sqlite` do Node cũ. Đã thêm kiểm tra Node và hướng dẫn. Cài Node.js 24+, mở lại terminal, kiểm tra `node -v`/`where.exe node`.

Trong Command Prompt:

```bat
cd /d D:\SangKienKn
git status
git pull origin main
npm ci
npm run build
npm run demo
```

Trong PowerShell dùng `Set-Location D:\SangKienKn` thay cho `cd /d`. Nếu có sửa local, bảo toàn/kiểm tra trước khi pull, không reset để ép đồng bộ. Mở **http://localhost:3001** trên chính máy đang chạy và giữ terminal, dừng bằng Ctrl+C. `npm run demo` đọc `.env.example`; không cần tài khoản hosting. Sau pull chạy lại `npm ci`/build. Hướng dẫn phát triển `npm run dev` nằm trong README.

Database mặc định `.local/greenedu.sqlite` không đi theo Git và không tự đồng bộ cloud → Windows. `SEED_DEMO=1` chỉ seed khi database rỗng; không xóa database cũ để xem tính năng mới. Schema mới được thêm khi khởi động. Tài khoản **demo giả**: `giaovien@greenedu.demo`, `hocsinh@greenedu.demo`; mật khẩu `GreenEdu123!`. Không dùng làm tài khoản triển khai chính thức, không bật seed demo trong production.

## Kết quả kiểm thử đã có

Tại commit tính năng **389a1d6**, đã chạy thật trên cloud:

- `npm run build`: TypeScript và Vite đạt.
- `npm test`: **31/31** đạt; gồm phân quyền, câu hỏi/sổ tay, Word/CSV, thời gian/cây, migration, chia nhóm, đại diện, deadline/gia hạn, retry, file/link và giữ dữ liệu qua khởi động lại.
- `npm run test:e2e`: **14/14** đạt trên desktop/mobile với API thật; thêm Word yêu cầu/tải gốc, đổi đại diện, PDF, mất phản hồi rồi retry, Canva, lịch sử, hết hạn và gia hạn dù đồng hồ học sinh sai.

Đây là bằng chứng session trước, chưa phải kết quả chạy trên máy Windows. E2E hiện cấu hình cho cloud/Linux: Chromium mặc định `/usr/bin/chromium` (có override `CHROMIUM_PATH`), lệnh server có biến môi trường kiểu POSIX. **Chưa xác nhận `npm run test:e2e` chạy nguyên trạng trên Windows**; nếu nhiệm vụ local cần E2E, chỉnh cấu hình theo nền tảng rồi kiểm tra. Chạy app/build và `npm test` là các lệnh riêng, không phụ thuộc Chromium.

## Các bước tiếp theo và câu hỏi chưa chốt

Không cần phân tích lại các tính năng đã hoàn thành. Chọn công việc theo yêu cầu mới, kiểm tra mã thực tế và cập nhật tài liệu bàn giao sau mỗi đợt.

Các phần còn lại: học kỳ/ma trận/trộn đề; vé/kiểm tra 20 phút; Săn điểm/thi chính thức; Green Points/đổi thưởng; phản biện/chấm điểm nhóm; Excel đầy đủ; AI; nghiệm thu và vận hành hosting khi cần.

Trước khi xây thi/thưởng cần chốt:

- Đề án ghi chuyển tab “quá 3 lần cảnh báo”, bảng lại “quá 2 lần”: chưa chọn ngưỡng.
- Tỷ lệ đúng 70% bao gồm sửa sai nhưng chưa chốt tính theo lượt hay câu; sổ tay sạch trong chương hay toàn tài khoản. Không dùng tỷ lệ luyện tập hiện tại để tự cấp vé.
- Cấp vé ở mốc cây khi điều kiện chưa đủ; trừ vé và xử lý lượt thi gián đoạn.
- Trần/cộng dồn điểm 4 giờ và điểm thi, phê duyệt/quy đổi; không tự chuyển điểm hệ thống vào học bạ.
- Thi chính thức: cửa sổ vào thi, muộn/mất mạng, mở đáp án và quyền kết luận điểm.
- AI cần nhà cung cấp/cấu hình; chưa yêu cầu hoặc có khóa dịch vụ trong repository.

## Tin nhắn mở session mới

Sau khi pull, mở project **D:\SangKienKn** trong Codex và gửi:

> Đọc AGENTS.md, docs/session-handoff.md và docs/project-status.md để tiếp nhận bối cảnh GreenEdu. Đây là phần tiếp tục của dự án ở session trước. Kiểm tra Git và mã hiện tại, báo ngắn gọn trạng thái, rồi tiếp tục theo yêu cầu tôi gửi. Không cần phân tích lại từ đầu.

Nếu muốn làm một mục cụ thể, thêm tên mục vào tin nhắn đó. Giữ bản bàn giao này cập nhật sẽ giúp các session sau tiếp tục mà không cần copy toàn bộ chat.
