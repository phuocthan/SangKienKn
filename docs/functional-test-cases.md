# Ca kiểm thử chức năng GreenEdu

## Quản lý online riêng, chọn nguồn và upload Word thật — 12/10/2026

- ONLINE-PAGES: mục giáo viên/học sinh riêng, không hiển thị cấu hình cây/ma trận/thưởng; tách buổi online khỏi lịch cũ, đúng lớp/lượt qua thông báo và reload.
- ONLINE-SOURCE-REQUIRED: ban đầu không chọn nguồn, không lưu; radio chỉ một lựa chọn, đổi nguồn không gửi payload của nguồn còn lại.
- ONLINE-BANK-SCOPE: chọn nhiều chương, toàn chương1 cộng một bài chương2; đúng chapterIds/lessonKeys, bỏ chương/bài không còn trong phạm vi, không tràn ngang.
- ONLINE-WORD-REAL: hai file15câu đã tạo đọc từ trình duyệt, gắn hai chương và gửi đề30câu; không cần tích chương trước khi upload. File hỏng/câu trùng không thêm, draft cũ còn, giới hạn/đang đọc giữ nút khóa.
- ONLINE-HISTORY: overview lượt thi có delivery sau quyền lớp/tài khoản, student không đọc lượt bạn, lọc lịch sử online riêng; API cũ có thông báo chờ cập nhật.

Kiểm tra mới:118/118 backend và26/26 E2E desktop/mobile (learning, online-exams, online-management) đạt trên SQLite/server riêng3297, build `.local/online-management-build`. Lượt đầu22/26 do locator status khớp thông báo đọc file và fixture sửa sai mặc địnhA cho đề riêng B/C; đã sửa test dùng thông báo tạo đề riêng và đáp án đã công bố của chính student fixture, chạy lại toàn bộ26/26. Đã xem ảnh desktop/mobile. Không ghi Railway, không sửa các gap vi phạm trong audit.

## Kiểm tra online X phút chờ / Y phút làm — 12/10/2026

- ONLINE-SCHEDULE: tạo bản chuẩn bị không thông báo/hết hạn; bấm bắt đầu chốt T+X/T+X+Y, trước giờ không vào được, vào muộn cùng hạn, hết giờ tự thu. X0–60/Y1–180, sai kiểu/ngoài khoảng bị chặn.
- ONLINE-PAPER: nhiều chương/bài, một tập câu chung; snapshot chọn tại bắt đầu, sửa bank sau đó không đổi đề, reload giữ hoán vị. File riêng không phát hành luyện tập, không lộ đáp án đang thi.
- ONLINE-ATOMIC: tạo retry không lặp; bank thiếu sau chuẩn bị rollback cả giờ/trạng thái/đề; gửi bắt đầu lại không kéo giờ/lấy đề mới. Đóng trong chuẩn bị hủy yêu cầu, không mở lại; đóng lúc thi thu bài/công bố.
- ONLINE-NOTICE: chỉ học sinh/thành viên đúng lớp nhận metadata; không câu/đáp án/email. Banner trên Trang chủ đếm chờ/khóa nút, đăng nhập/reload nhận lại, nộp/đóng/hết giờ bỏ. Vào từ banner chọn đúng lớp kể cả danh sách lớp cache cũ.
- ONLINE-COMPAT: thiếu capability khóa tạo/bắt đầu, không gửi payload online sang API cũ. Migration thêm bảng/cột và reopen giữ thời điểm/selection/snapshot, không mất dữ liệu cũ.

Backend trong server/learning.test.ts và learning-db.test.ts; E2E e2e/online-exams.spec.ts desktop/mobile, hồi quy e2e/learning.spec.ts. Test dùng SQLite riêng, không Railway. Nghiệp vụ [online-exams.md](online-exams.md).

## Ca mới: quản lý/xóa câu hỏi hàng loạt — 11/10/2026

- BANK-DELETE-ACCESS: chỉ chủ lớp; chưa đăng nhập/học sinh/giáo viên khác bị chặn, payload sai/rỗng/quá 5000 bị từ chối.
- BANK-DELETE-ATOMIC: chọn câu ngoài chương/ID thiếu/phiên bản cũ chặn toàn bộ; không cập nhật một phần. Lặp/concurrent retry không xóa trùng hoặc đổi câu chưa chọn.
- BANK-DELETE-HISTORY: giữ phiên bản, attempts, sổ tay, progress và snapshot ôn; sửa sai/retry/phiên ôn đã lưu tiếp tục được, lượt luyện mới không nhận câu bị xóa.
- BANK-DELETE-UI: chọn từng câu/tất cả/bỏ chọn/Hủy, đổi bài xóa lựa chọn, xóa nhiều câu và cả bài (kể cả bài rỗng), reload/hidden/đếm đúng. API cũ disabled theo capability; desktop/mobile không tràn ngang.

Backend server/question-delete.test.ts cùng hồi quy lesson-management/app; E2E e2e/question-delete.spec.ts cùng nhập Word và quản lý bài. Chỉ dùng database riêng.

Các kết quả ghi theo từng đợt là **bằng chứng lịch sử**, không cộng số ca giữa các lượt hoặc báo thành kết quả mới. Với thay đổi tài liệu chỉ kiểm tra nội dung/liên kết/diff; khi sửa runtime chạy ca liên quan và hồi quy cần thiết trên database riêng. Các mốc1/2/3/4giờ dưới đây là mặc định60phút/cấp; ca cấu hình bao phủ mốc tùy chỉnh. Trạng thái hiện hành tại [project-status.md](project-status.md).

## Audit vi phạm khi ôn và thi — 11/10/2026

Đã chạy lại 9 backend liên quan giờ/idle/sổ tay/thi4tab/deadline/duyệt thưởng. Tám ca trình duyệt audit desktop/mobile: desktop idle đạt; online4tab/reload/nộp khóa, offline4tab vẫn nhận đáp án sau ngưỡng, blur trang visible không đếm đều xác nhận trên hai viewport. Kết quả7 đạt/1 mobile idle chưa xác nhận ở mốc mô phỏng, cần QA thiết bị thật. Tests gap passing xác nhận hành vi lỗi hiện tại, không đồng nghĩa đã sửa. Chỉ server/DB riêng3187/build `.local/violations-audit-build`; [chi tiết](violations-audit.md). Không ghi Railway hoặc áp quy tắc phạt mới.

## Ca mới: thời gian tăng cấp do giáo viên đặt — 11/10/2026

- LEVEL-CONFIG-BOUNDARY: mặc định 60 phút; mốc chính xác cho 1/30/60/90/1440 phút, giây phân số dưới mốc chưa lên cấp.
- LEVEL-CONFIG-ACCESS: chỉ chủ lớp ghi; học sinh/giáo viên ngoài lớp bị chặn; null/string/0/âm/thập phân/>1440 không tạo bản ghi.
- LEVEL-CONFIG-SYNC: cấu hình lớp 30 phút đối chiếu cấp chương, learning, roster, xếp hạng, vườn MAX và cây cấp 5; lớp/môn khác/chương chưa học giữ độc lập.
- LEVEL-CONFIG-HISTORY: giảm/tăng mốc không sửa progress hoặc thu hồi vé/điểm; đọc lặp/đổi mốc không cấp trùng. Migration/reopen giữ cài đặt, khóa ngoại và integrity.
- LEVEL-CONFIG-UI: giáo viên xem draft năm mốc, lưu/reload; học sinh nhận timeline/mốc mới. Desktop/mobile không tràn ngang. API cũ thiếu capability khóa input/nút và không gửi ghi.

Ca backend `server/level-settings.test.ts`; browser `e2e/level-settings.spec.ts`. Chỉ chạy server/database kiểm thử riêng.

## Ca mới: khu vườn thành viên — 11/10/2026

- GARDEN-MEMBERS: mọi học sinh hiện thuộc lớp xuất hiện một lần, kể cả chưa học/chưa có chương; người đã rời lớp không xuất hiện, avatar null dùng chữ cái. Không ghi tiến độ hoặc dữ liệu người dùng.
- GARDEN-MAX: hai chương cùng 2 giờ cho cấp 3, không cộng thành cấp 5; chương lớp/môn khác không ảnh hưởng. Vị trí ban đầu ưu tiên cấp cao, reload không nhân đôi, đổi lớp chỉ hiện thành viên/cấp của lớp mới.
- GARDEN-NAMES: tên hiển thị hai từ cuối; tên một từ giữ nguyên, trùng tên ngắn vẫn là hai cây với ID/avatar và nhãn đầy đủ riêng; bạn hiện tại có nhãn Bạn.
- GARDEN-ACCESS: chưa đăng nhập 401, học sinh/giáo viên ngoài lớp 403; chủ lớp và học sinh trong lớp đọc cùng dữ liệu, không lộ email/mật khẩu/câu hỏi. Dữ liệu trees cũ còn nguyên.
- GARDEN-MOTION: frame rào bốn phía, icon/tên/avatar cùng di chuyển (seek animation xác nhận khoảng cách >20px), nút tắt/bật và reduced-motion ngừng cả chuyển động/đung đưa; desktop/mobile không tràn ngang/lỗi JS.
- GARDEN-HONORS: frame riêng chỉ cấp 5, một người một mục dù nhiều chương đạt; người cấp 5 vẫn có mặt trong vườn chung. Đổi lớp đổi cả vườn và vinh danh; chưa có người đạt thì hiện lời nhắc.
- GARDEN-CROWD: fixture 47 học sinh mọi cấp; 47 icon vườn/9 vinh danh, kiểm tra bốn điểm đường chuyển động không thoát sàn vườn; khung cuộn nội bộ, cuộn tới thành viên cuối, reload không nhân bản.
- GARDEN-OLD-API: thiếu members vẫn hiện rào và thông báo chờ API, không tạo cấp giả; gộp trees theo ID để vinh danh một lần, giữ xếp hạng đồng điểm.

Kiểm tra mới: 27/27 backend liên quan đạt; ca garden backend chạy lại sau sửa fixture avatar cũng đạt. 4/4 E2E garden mới và 2/2 E2E tương thích cây cũ đạt, dùng build `.local/student-garden-build`, server/database riêng tại 3179. TypeScript/build/diff check đạt; không chạy test hoặc seed trên Railway.

Lần chỉnh theo phản hồi frame/rào/vinh danh dùng `.local/fenced-garden-build`: **12/12 E2E desktop/mobile đạt**, gồm 6 garden mới/lớp đông, 2 tương thích cây cũ, 4 practice/teacher workflow. Đã cập nhật kỳ vọng cũ “chưa cây cấp 5” sang thành viên cấp Mầm vì vườn giờ chứa toàn lớp, không chỉ cấp 5. Luồng giáo viên cuối suite hiện phụ thuộc ca practice chuẩn bị trạng thái demo, cần chạy cùng khi dùng grep. Backend không đổi lần này. TypeScript/build/diff check đạt; không ghi dữ liệu thật.

## Ca mới: chương/bài, clock và kiểm tra — 11/10/2026

- LEVEL-CHAPTER: hai chương cùng lớp có cấp riêng; chương chưa học vẫn Mầm. Roster/xếp hạng đối chiếu tiến độ từng chương, giữ các lớp/môn/học sinh độc lập.
- LEVEL-MARKER: đủ năm mốc 0/1/2/3/4 giờ, icon phía trên đúng vạch (sai lệch tâm <2 px), current/earned đúng, đổi lớp/reload/trang tài khoản/hành trình không cộng gộp và không tràn ngang desktop/mobile.
- LESSON-ADD: chủ lớp thêm bài rỗng; trim/collapse/case/NFC và yêu cầu đồng thời không tạo trùng; bài cùng tên ở chương khác được phép; vai trò/chủ lớp/dữ liệu không hợp lệ bị từ chối.
- LESSON-DELETE: hủy không đổi; xóa ẩn câu hiện hành khỏi lượt mới, giữ attempt/sổ tay/version/snapshot đề; gọi lại no-op, reopen giữ trạng thái. Khôi phục cùng tên chỉ hiện danh mục, không tự hiện câu hỏi.
- FEEDBACK: sai không correctIndex/lời giải, kể cả retry/reload dữ liệu phiên cũ; đúng có đáp án/lời giải. UI chỉ tô lựa chọn sai và nhắc chung khi sai.
- CLOCK: số tạm tính chạy, ẩn/offline thì dừng; authoritative creditedSeconds theo heartbeat server, hidden/gap/replaced không ghi giả thời gian.
- EXAM-SOURCE: nguồn bank chọn bài cụ thể không lọt bài khác, upload nhiều chương, lỗi/câu trùng không ghi một phần; câu tải lên ẩn, không lộ đáp án trong phòng thi.
- EXAM-MANUAL: đề tạo chờ đóng; chủ lớp mở ngay bật đúng chương/giờ bắt đầu, học sinh không cần tự học đủ thời gian; teacher khác/student bị từ chối, hết giờ không mở; requestId retry không tạo thêm đề/câu.
- API-COMPAT: frontend khóa công cụ mới khi overview chưa trả examCreation; giữ sử dụng ma trận cũ, không gửi upload tới API cũ.

Đợt này dùng build riêng `.local/chapter-milestone-build` và SQLite in-memory/E2E riêng. Kết quả cuối xem đầu session-handoff.md; không ghi dữ liệu test Railway.

Đợt kiểm thử ngày 11/10/2026 theo yêu cầu tự tạo test case, kiểm tra tạo lớp, tạo học sinh và không trùng lặp. Quy tắc thiết kế tra cứu tại [app-design.md](app-design.md).

## Môi trường và phạm vi

- API dùng SQLite trong bộ nhớ hoặc database tạm; trình duyệt dùng database `.local/e2e-<thời điểm>.sqlite`, server cổng 3101, build riêng `.local/creation-test-build`.
- Không tạo lớp, tài khoản hoặc điểm thử trong `.local/greenedu.sqlite`. Không thử ghi dữ liệu lên Railway.
- Mỗi ca trình duyệt mới dùng UUID để phân biệt dữ liệu desktop/mobile. Các ca kiểm tra trùng cố ý gửi lại cùng dữ liệu và xác nhận số bản ghi sau thao tác.
- Không coi trùng họ tên là trùng tài khoản. Email đã bỏ khoảng trắng đầu/cuối và chuyển chữ thường là định danh tài khoản toàn trường.
- Lớp trùng là cùng giáo viên sở hữu, tên lớp, môn và khối. So sánh bỏ khoảng trắng dư, chữ hoa/thường và chuẩn hóa dấu Unicode. Lớp cùng tên ở môn khác hoặc giáo viên khác được phép. Không xóa/gộp lớp đã có.

## Ca mới: tạo lớp và tài khoản

| Mã         | Thao tác                                                                             | Kết quả cần đạt                                                             | Kiểm tra                      |
| ---------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- | ----------------------------- |
| CLASS-01   | Giáo viên tạo lớp hợp lệ                                                             | 201; lớp thuộc giáo viên, xuất hiện sau tải lại                             | API + trình duyệt             |
| CLASS-02   | Tạo lại cùng tên/môn/khối                                                            | 409 và thông báo lớp đã tồn tại; vẫn một lớp                                | API + trình duyệt             |
| CLASS-03   | Đổi hoa/thường, khoảng trắng và biểu diễn Unicode của lớp/môn                        | Vẫn nhận là trùng                                                           | API; hoa/thường ở trình duyệt |
| CLASS-04   | Gửi bốn yêu cầu tạo cùng lớp đồng thời                                               | Một 201, ba 409; không tạo bốn lớp                                          | API                           |
| CLASS-05   | Cùng tên ở môn khác hoặc giáo viên khác                                              | Tạo được; mỗi giáo viên chỉ thấy lớp của mình                               | API                           |
| CLASS-06   | Tên/môn/khối rỗng, sai kiểu hoặc vượt giới hạn                                       | 400; không có bản ghi lớp dở dang                                           | API                           |
| CLASS-07   | Chưa đăng nhập, học sinh hoặc Admin gọi API tạo lớp giáo viên                        | 401/403; không có lớp mới                                                   | API                           |
| CLASS-08   | Server đã lưu lớp nhưng trình duyệt mất phản hồi, bấm lưu lại                        | Báo trùng, còn một lớp sau tải lại                                          | Trình duyệt                   |
| ACCOUNT-01 | Admin tạo giáo viên/học sinh                                                         | Đúng vai trò, mật khẩu băm, buộc đổi mật khẩu tạm                           | API + trình duyệt             |
| ACCOUNT-02 | Gửi bốn yêu cầu tạo cùng email đồng thời                                             | Một tài khoản và một membership nếu chọn lớp                                | API                           |
| ACCOUNT-03 | Email khác hoa/thường/khoảng trắng, kể cả chọn vai trò khác                          | 409; không đổi vai trò, tên hoặc mật khẩu đã có                             | API + trình duyệt             |
| ACCOUNT-04 | Hai người cùng họ tên, email khác nhau                                               | Được tạo hai tài khoản                                                      | API                           |
| ACCOUNT-05 | Giáo viên tạo học sinh; gửi thêm trường role=admin                                   | Vẫn chỉ tạo học sinh và thêm một lần vào lớp                                | API                           |
| ACCOUNT-06 | Giáo viên tạo lại email có sẵn                                                       | 409; hướng dẫn chọn tài khoản có sẵn, mật khẩu cũ vẫn đăng nhập được        | API + trình duyệt             |
| ACCOUNT-07 | Thêm học sinh có sẵn vào lớp; gửi lặp/gửi đồng thời                                  | Một membership trong lớp; thêm trùng báo 409                                | API + trình duyệt             |
| ACCOUNT-08 | Thêm học sinh vào lớp thứ hai                                                        | Giữ một tài khoản, hai memberships; giữ mật khẩu/tiến độ                    | API                           |
| ACCOUNT-09 | Sai email, tên trống, mật khẩu quá ngắn/dài, lớp không tồn tại                       | 400/404; không tạo tài khoản hoặc membership dở dang                        | API                           |
| ACCOUNT-10 | Học sinh tạo tài khoản, giáo viên truy cập lớp khác, thêm email giáo viên vào roster | 403/404; không thêm dữ liệu                                                 | API                           |
| ACCOUNT-11 | Form thiếu trường; API tạo tài khoản đang chờ phản hồi                               | Form giữ lại; nút/trường bị khóa khi đang gửi, chỉ một POST                 | Trình duyệt                   |
| ACCOUNT-12 | Cấp lại mật khẩu học sinh học với hai giáo viên                                      | Giáo viên bị từ chối; Admin được cấp lại, thu hồi phiên cũ, giữ lớp/tiến độ | API                           |

Ca tự động mới nằm trong [accounts.test.ts](../server/accounts.test.ts) (sáu ca tổng hợp) và [creation-validation.spec.ts](../e2e/creation-validation.spec.ts) (ba ca chạy ở hai kích thước màn hình).

## Ca icon cấp học sinh theo lớp/môn/chương

Cấp hiện hành riêng **lớp → môn → chương**, thay lựa chọn tổng lớp/môn ban đầu; quy tắc tại [student-levels.md](student-levels.md). Garden dùng MAX chương làm đại diện, không SUM.

| Mã       | Thao tác                                        | Kết quả cần đạt                                           | Kiểm tra              |
| -------- | ----------------------------------------------- | --------------------------------------------------------- | --------------------- |
| LEVEL-01 | Thời gian đúng trước/tại mốc 1, 2, 3, 4 giờ     | Đúng Mầm/Chồi/Cây Non/Đơm Hoa/Kết Trái; không lên cấp sớm | API                   |
| LEVEL-02 | Học sinh có hai môn với thời gian khác nhau     | Mỗi môn có cấp riêng                                      | API + trình duyệt     |
| LEVEL-03 | Hai lớp khác nhau cùng môn                      | Không cộng thời gian của lớp kia                          | API                   |
| LEVEL-04 | Hai chương cùng lớp mỗi chương2giờ ở mặc định60 | Mỗi chương cấp3; không SUM thành cấp5, không lẫn học sinh | API                   |
| LEVEL-05 | Giáo viên xem roster và xếp hạng                | chapterLevels trùng học sinh ở đúng lớp/môn/chương        | API + trình duyệt     |
| LEVEL-06 | Đổi lớp, tải lại, xem Tài khoản                 | Cấp từng chương theo lớp chọn; không dùng huy hiệu tổng   | Trình duyệt           |
| LEVEL-07 | Đủ năm icon và các bước trên điện thoại/desktop | Không tràn ngang, icon/nhãn/mốc rõ, không lỗi JS          | Trình duyệt + xem ảnh |
| LEVEL-08 | Tổng chưa có dữ liệu hoặc không hợp lệ          | Mầm, không tạo thời gian/điểm giả                         | API                   |

Ca tự động tại `server/student-levels.test.ts` (ba ca tổng hợp) và `e2e/student-levels.spec.ts` (hai ca ở desktop/mobile).

## Hồi quy chức năng có sẵn

Các nhóm hồi quy cần cân nhắc theo phạm vi thay đổi runtime; không mặc định chạy lại toàn bộ cho chỉnh tài liệu:

| Nhóm              | Nội dung                                                                                                                   |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Đăng nhập         | Mật khẩu sai, hết phiên, đăng xuất, mật khẩu tạm, tên đăng nhập rút gọn, vào nhanh local và giới hạn production            |
| Tài khoản         | Bootstrap Admin, danh sách không lộ mật khẩu, tạo giáo viên/học sinh, phân quyền, cấp lại mật khẩu, migration giữ liên kết |
| Luyện tập/sổ tay  | Làm sai, sửa sai, gửi lại không ghi trùng, câu hỏi có phiên bản, tải lại giữ kết quả                                       |
| Thời gian/cây     | Đồng hồ máy chủ, ẩn tab/mất mạng/không tương tác, mốc cấp cây, vườn lớp/xếp hạng theo dữ liệu thật                         |
| Ngân hàng câu hỏi | Tạo/sửa/ẩn/hiện, Word/CSV mẫu, xem trước lỗi, câu trùng, retry nhập không nhân bản, quyền sở hữu                           |
| Hoạt động nhóm    | Chia nhóm cân bằng, đại diện/phân quyền, file Word/PDF/Office/link, thời hạn/gia hạn, retry/phiên bản và lưu bền           |
| Ôn tập/kiểm tra   | Ma trận không trùng câu, khôi phục, vé/thưởng, thi chính thức, autosave/mất mạng, nộp hạn, lần rời tab thứ 4, Excel        |
| Avatar            | Lưu/khôi phục/chọn theo vai trò, upload/giới hạn dung lượng/định dạng/quyền xem                                            |
| Dữ liệu           | Khóa ngoại, migration, mở lại database không mất tài khoản/tiến độ/liên kết                                                |

## Chạy lại

Tại thư mục repository trên PowerShell:

```powershell
# Chỉ API lớp/tài khoản
node --import tsx --test server/accounts.test.ts

# Toàn bộ backend
npm test

# Frontend cho trình duyệt kiểm thử, không thay dist đang phục vụ
npx tsc --noEmit
npx vite build --outDir .local/creation-test-build
$env:E2E_DIST_DIR = '.local/creation-test-build'

# Ca tạo mới và tài khoản; mặc định có desktop + mobile
npx playwright test e2e/creation-validation.spec.ts e2e/accounts.spec.ts

# Icon theo lớp/môn
npx playwright test e2e/student-levels.spec.ts

# Toàn bộ trình duyệt
npm run test:e2e
```

## Kết quả lịch sử đợt tạo lớp/tài khoản — 11/10/2026, 11:16

Đã tái hiện lỗi tạo lớp trùng trước sửa: hai yêu cầu lặp đều trả 201 thay vì 409. Đã sửa API tạo lớp bằng kiểm tra chuẩn hóa trong transaction `BEGIN IMMEDIATE`, giữ nguyên các lớp có sẵn. Backend **63/63 đạt**, toàn bộ trình duyệt **50/50 đạt** trên desktop/mobile, không skip/flaky; TypeScript và build riêng đạt. Lượt đầu ca trình duyệt tạo lớp dùng sai tên nút/vị trí trang, đã sửa test sang “Lớp học của tôi → Tạo lớp mới” và chạy lại đạt; không tính những lượt lỗi đó là pass.

Trong lúc kiểm thử có cập nhật CSS/cỡ chữ đồng thời trong workspace. Đã build riêng và chạy thêm **14/14** ca lớp/tài khoản/icon, rồi **4/4** ca icon với CSS cuối; xem ảnh đủ năm cấp trên desktop/mobile, tất cả bước nằm trong viewport, không tràn ngang/lỗi JS. Báo cáo JSON trong `.local/functional-browser-results.json`, `.local/functional-final-browser-results.json`, `.local/student-level-current-browser-results.json`.

Đã deploy local **http://localhost:3002** lúc **11:16 ngày 11/10/2026**, PID 86592, demo:false, quickLogin:true. Backup `.local/backups/database-20261011-111609-164.sqlite`. Health/frontend/ảnh/đề mục và năm tên cấp đạt; HTML/assets khớp build cuối đã kiểm thử. SQLite chỉ đọc xác nhận khóa ngoại hợp lệ và giữ khóa 47 bản ghi trong 25 bảng dữ liệu so với backup (không đối chiếu sessions/study_sessions biến động). Không ghi dữ liệu thử vào database chính, không triển khai Railway hoặc commit/push trong lượt này.

Các ca tự động không thay thế nghiệm thu với dữ liệu/quy mô lớp thực tế hoặc kiểm thử tải và môi trường Railway.

## Đổi tên và icon cấp — 11/10/2026, 11:47

Theo yêu cầu mới, bộ cấp là Mầm/Chồi/Cây Non/Đơm Hoa/Kết Trái; cập nhật kỳ vọng trong kiểm thử và icon tương ứng. TypeScript/build, **26/26 backend** (student-levels/app) và **4/4 E2E** cấp độ desktop/mobile đạt, không skip/flaky; database thử riêng. Ảnh đủ năm cấp đã kiểm tra trên hai kích thước. Báo cáo `.local/student-stages-renamed-browser-results.json`.

Đã deploy tại http://localhost:3002, PID 92676; backup `.local/backups/database-20261011-114736-419.sqlite`. Xác nhận frontend khớp build đã kiểm thử, đủ năm tên mới, health và khóa ngoại đạt, bảo toàn khóa 47 bản ghi trong 25 bảng dữ liệu bằng kiểm tra chỉ đọc.

## Quyền kiểm tra theo chương — 11/10/2026

- Học sinh đủ thời gian/tỷ lệ/vé vẫn bị chặn khi giáo viên chưa mở chương; request trực tiếp trả 403, không tạo lượt hoặc dùng vé.
- Chỉ chủ lớp mở/khóa, boolean input hợp lệ; học sinh/giáo viên khác bị chặn; chương khác giữ trạng thái riêng.
- Mở không vượt điều kiện cá nhân Săn điểm; ôn tập chương bị khóa vẫn hoạt động.
- Khóa lại chặn lượt mới/trang cũ; giữ bài đang làm/đáp án và retry không dùng thêm vé.
- Thi chính thức cần mọi chương xuất hiện trong snapshot được mở; vẫn kiểm tra lịch/enabled, không tự áp dụng vé/thời gian tự học.
- Migration giữ thiết lập/chương/tiến độ cũ, không mở tự động, quyền lưu qua reopen.

Kết quả mới: 91 backend, 10 E2E ôn/thi desktop/mobile đạt bằng database riêng; TypeScript/build đạt. Backend Railway chưa deploy, không dùng production để tạo ca thử. Chi tiết ở session-handoff.md.
