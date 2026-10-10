# Bàn giao session GreenEdu

Cập nhật ngày **10/10/2026**, múi giờ người dùng Asia/Bangkok (UTC+7). Đây là bản tổng hợp bối cảnh và quyết định của trao đổi trước, **không phải bản chép nguyên văn toàn bộ chat**. Session mới không tự nhận lịch sử chat, file đính kèm, tiến trình hay database của máy cloud; cần đọc các file trong repository và kiểm tra trạng thái thực tế.

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
