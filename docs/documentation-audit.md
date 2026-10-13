# Rà soát tài liệu và bối cảnh GreenEdu

## Đồng bộ redesign và skill đã cài — 13/10/2026

Đã cập nhật AGENTS, nguồn/path hai skill, thiết kế hiện hành, online exam, icon, auto refresh nhóm/góp ý, bàn giao/tiến độ và báo cáo QA. Mục submenu sticky cũ được đổi nhãn lịch sử; ghi chép skill chưa tìm thấy giữ rõ bối cảnh đợt pull trước cài. Giữ đầy đủ ghi chép xóa Chủ đề1 và các mục upstream, không dùng test cũ hoặc commit làm bằng chứng Railway đã triển khai.

Kiểm tra mới:245 liên kết local trong11 tài liệu được cập nhật đều có đích; `git diff --check` đạt. TypeScript/build và72/72 ca E2E liên quan đạt trên server/database riêng; giới hạn hai ca timer cũ được ghi tại [redesign-qa-20261013.md](redesign-qa-20261013.md).

## Đồng bộ hiện trạng và chuẩn bị commit — 12/10/2026

Đối chiếu HEAD `72a7e3b`, thay đổi hiện có và mã góp ý/phản biện. Bảng tra cứu `project-status.md` được cập nhật12/10, bổ sung tài liệu [feedback-discussion.md](feedback-discussion.md), sửa mô tả cũ “chưa phản biện” trong đặc tả nhóm và bảng phần còn thiếu. README/AGENTS/thiết kế/bàn giao liên kết tới chức năng và poster/slide hiện hành. Giữ nhật ký cũ làm lịch sử, không tạo kết quả kiểm thử hay trạng thái deployment mới từ việc đọc mã.

Đợt này không thay backend, không đọc/ghi database Railway và không chạy lại kiểm thử backend/E2E toàn hệ thống. Minh họa frontend và slide đã có bằng chứng kiểm tra ở [session-handoff.md](session-handoff.md); kết quả thuộc đợt hoàn thiện ngay trước commit. Mục rà soát11/10 bên dưới là lịch sử.

Kiểm tra mới trước commit: 28 file Markdown (AGENTS, README, docs và README các artifact), 269 liên kết local đều có đích; `git diff --check` đạt. Kiểm tra liên kết chỉ xác nhận file tồn tại, không xác minh anchor hoặc website ngoài.

Ngày 11/10/2026. Phạm vi: **21 Markdown lõi** gồm AGENTS.md, README.md và 19 tài liệu docs đã có, cùng liên kết tới artifact/mẫu/mã. Đối chiếu trực tiếp các mô tả thay đổi gần đây với shared/student-levels, server/app/learning/level-settings/lesson-catalog, src/Practice/Learning/StudentGarden/ClassCommunity/main và CSS. Đây là **kiểm tra tài liệu**, không phải chạy lại toàn bộ chức năng hoặc nghiệm thu Railway.

## Những chỗ đã sửa

| Vấn đề                                                  | Nội dung đã đồng bộ                                                                                                  |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Audit chỉ ở báo cáo/bàn giao, thiếu thiết kế chính      | app-design bổ sung UI xử lý ôn/thi, quy tắc lần4 và gap chưa sửa; liên kết violations-audit                          |
| Session dễ đọc mô tả cũ thành yêu cầu hiện hành         | AGENTS/README nêu thứ tự đọc; project-status có bảng tra cứu; handoff và app-design đánh dấu vùng lịch sử            |
| MVP/README còn cho xem lời giải sau trả lời sai         | Chỉ trả lời đúng mới mở đáp án/lời giải, kể cả retry/reload; thi có lịch công bố riêng                               |
| Vườn chỉ mô tả cây cấp5                                 | Vườn toàn lớp, mỗi người một cây/cấp MAX chương/avatar/tên; frame vinh danh cấp5 riêng; API cũ không đủ roster       |
| Cấp tổng hoặc giờ cố định bị hiểu là hiện hành          | Cấp riêng lớp→môn→chương, m phút/cấp default60, vé2m/3m/4m; ca LEVEL-04/05/06 sửa để không SUM                       |
| Tài liệu PPCT nói chưa có tạo bài thủ công              | Thêm/xóa archive đã có code, còn chờ backend Railway; UI nhập toàn bộ PPCT chưa có                                   |
| Nền mô tả login1px/bên trong3px nhưng CSS override      | garden.css nạp sau cùng: cả hai2px/cover, gradient kem hiện hành; giữ số cũ trong lịch sử                            |
| Cổng3002/vào nhanh/tự deploy gây nhầm mặc định          | Frontend5173/API Railway; quick login chỉ backend offline; CLI local không tạo Admin trên Railway                    |
| Kế hoạch tick hoàn tất bị coi đã nghiệm thu mọi vi phạm | Ghi rõ phạm vi ban đầu10:39; audit còn lỗi offline/focus/AI/QA mobile, không coi test tái hiện gap là sửa thành công |
| Thiết kế nhóm còn rải trong đặc tả chức năng            | Bố cục/thẻ/bộ lọc/responsive gom vào app-design, group-activities giữ nghiệp vụ và dẫn liên kết                      |
| Hosting/trạng thái cũ được gọi là hiện tại              | Railway HTTPS đã có theo bản ghi triển khai; runtime checkout chưa đồng nghĩa đã deploy, còn nghiệm thu vận hành     |

Giữ nguyên nội dung đề án gốc và dữ liệu PPCT JSON; không sửa nguồn sản phẩm để khớp code. Các quyết định đã thay được ghi ở phần hiện hành, lịch sử giữ để đối chiếu. Không viết lại lịch sử chat hoặc suy quyền triển khai từ tài liệu.

## Tài liệu cần đọc theo mục đích

- Tiếp nhận: [AGENTS](../AGENTS.md), [README](../README.md), [session-handoff](session-handoff.md), [project-status](project-status.md).
- Thiết kế duy nhất: [app-design](app-design.md).
- Nguồn/phạm vi/lịch sử kế hoạch: [requirements-original](requirements-original.md), [mvp](mvp.md), [learning-implementation-plan](learning-implementation-plan.md), [levels-review-assessment](levels-review-assessment.md).
- Cấp/ôn/thi/audit/ca kiểm thử: [student-levels](student-levels.md), [learning](learning.md), [violations-audit](violations-audit.md), [functional-test-cases](functional-test-cases.md).
- Tài khoản/avatar/mail: [account-management](account-management.md), [user-avatars](user-avatars.md), [welcome-email](welcome-email.md).
- Ngân hàng/PPCT/nhóm: [question-bank](question-bank.md), [physics-11-curriculum-2026-2027](physics-11-curriculum-2026-2027.md), [group-activities](group-activities.md).
- Vận hành: [dev-railway](dev-railway.md), [deploy-local](deploy-local.md).

## Kiểm tra và giới hạn

Trước sửa: **21 file / 142 liên kết local**, không có đích bị thiếu. Sau sửa, tính cả báo cáo này: **22 file / 219 liên kết local, không có đích bị thiếu**; `git diff --check` đạt. Kiểm tra liên kết gồm sự tồn tại file, không kiểm tra anchor Markdown hoặc nội dung website ngoài. Mã được đọc để đối chiếu các điểm trên; không chạy TypeScript/build/backend/E2E vì không sửa runtime. Không cộng số ca giữa các lượt lịch sử hoặc gán chúng cho mã sau này.

HEAD đọc khi bắt đầu e3f85a9; các thay đổi ứng dụng từ session khác đã có trong checkout, không reset/revert/commit chúng. Không deploy/push/restart hoặc ghi database. Railway trong bảng trạng thái dựa trên lần triển khai đã ghi, không xác minh lại production ở đợt này.

**Còn nguyên:** lỗi đáp án sau ngưỡng tab khi offline, thiếu focus/nhật ký/ngoại lệ và Thần Rừng; mobile idle cần QA thật. Các backend mới về quyền chương/cấp/công cụ kiểm tra/members/topic vẫn cần triển khai theo yêu cầu. Session sau tiếp tục từ [violations-audit](violations-audit.md) và bảng hiện hành, chỉ kiểm tra lại phần có thay đổi/yêu cầu mới.
