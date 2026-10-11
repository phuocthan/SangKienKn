# Ca kiểm thử chức năng GreenEdu

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

## Ca mới: icon cấp học sinh theo lớp/môn

Người dùng chọn cộng thời gian riêng trong lớp/môn; quy tắc tại [student-levels.md](student-levels.md).

| Mã       | Thao tác                                        | Kết quả cần đạt                                           | Kiểm tra              |
| -------- | ----------------------------------------------- | --------------------------------------------------------- | --------------------- |
| LEVEL-01 | Thời gian đúng trước/tại mốc 1, 2, 3, 4 giờ     | Đúng Mầm/Chồi/Cây Non/Đơm Hoa/Kết Trái; không lên cấp sớm | API                   |
| LEVEL-02 | Học sinh có hai môn với thời gian khác nhau     | Mỗi môn có cấp riêng                                      | API + trình duyệt     |
| LEVEL-03 | Hai lớp khác nhau cùng môn                      | Không cộng thời gian của lớp kia                          | API                   |
| LEVEL-04 | Cộng thời gian nhiều chương trong cùng lớp      | Tổng đúng; không cộng của học sinh khác                   | API                   |
| LEVEL-05 | Giáo viên xem roster và xếp hạng                | Cấp trùng với học sinh ở cùng lớp/môn                     | API + trình duyệt     |
| LEVEL-06 | Đổi lớp, tải lại, xem Tài khoản                 | Huy hiệu/thẻ cấp theo lớp chọn, đọc từ tiến độ đã lưu     | Trình duyệt           |
| LEVEL-07 | Đủ năm icon và các bước trên điện thoại/desktop | Không tràn ngang, icon/nhãn/mốc rõ, không lỗi JS          | Trình duyệt + xem ảnh |
| LEVEL-08 | Tổng chưa có dữ liệu hoặc không hợp lệ          | Mầm, không tạo thời gian/điểm giả                         | API                   |

Ca tự động tại `server/student-levels.test.ts` (ba ca tổng hợp) và `e2e/student-levels.spec.ts` (hai ca ở desktop/mobile).

## Hồi quy chức năng có sẵn

Chạy lại toàn bộ bộ kiểm thử, không chỉ ca mới:

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

## Kết quả đợt này

Đã tái hiện lỗi tạo lớp trùng trước sửa: hai yêu cầu lặp đều trả 201 thay vì 409. Đã sửa API tạo lớp bằng kiểm tra chuẩn hóa trong transaction `BEGIN IMMEDIATE`, giữ nguyên các lớp có sẵn. Backend **63/63 đạt**, toàn bộ trình duyệt **50/50 đạt** trên desktop/mobile, không skip/flaky; TypeScript và build riêng đạt. Lượt đầu ca trình duyệt tạo lớp dùng sai tên nút/vị trí trang, đã sửa test sang “Lớp học của tôi → Tạo lớp mới” và chạy lại đạt; không tính những lượt lỗi đó là pass.

Trong lúc kiểm thử có cập nhật CSS/cỡ chữ đồng thời trong workspace. Đã build riêng và chạy thêm **14/14** ca lớp/tài khoản/icon, rồi **4/4** ca icon với CSS cuối; xem ảnh đủ năm cấp trên desktop/mobile, tất cả bước nằm trong viewport, không tràn ngang/lỗi JS. Báo cáo JSON trong `.local/functional-browser-results.json`, `.local/functional-final-browser-results.json`, `.local/student-level-current-browser-results.json`.

Đã deploy local **http://localhost:3002** lúc **11:16 ngày 11/10/2026**, PID 86592, demo:false, quickLogin:true. Backup `.local/backups/database-20261011-111609-164.sqlite`. Health/frontend/ảnh/đề mục và năm tên cấp đạt; HTML/assets khớp build cuối đã kiểm thử. SQLite chỉ đọc xác nhận khóa ngoại hợp lệ và giữ khóa 47 bản ghi trong 25 bảng dữ liệu so với backup (không đối chiếu sessions/study_sessions biến động). Không ghi dữ liệu thử vào database chính, không triển khai Railway hoặc commit/push trong lượt này.

Các ca tự động không thay thế nghiệm thu với dữ liệu/quy mô lớp thực tế hoặc kiểm thử tải và môi trường Railway.

## Đổi tên và icon cấp — 11/10/2026, 11:47

Theo yêu cầu mới, bộ cấp là Mầm/Chồi/Cây Non/Đơm Hoa/Kết Trái; cập nhật kỳ vọng trong kiểm thử và icon tương ứng. TypeScript/build, **26/26 backend** (student-levels/app) và **4/4 E2E** cấp độ desktop/mobile đạt, không skip/flaky; database thử riêng. Ảnh đủ năm cấp đã kiểm tra trên hai kích thước. Báo cáo `.local/student-stages-renamed-browser-results.json`.

Đã deploy tại http://localhost:3002, PID 92676; backup `.local/backups/database-20261011-114736-419.sqlite`. Xác nhận frontend khớp build đã kiểm thử, đủ năm tên mới, health và khóa ngoại đạt, bảo toàn khóa 47 bản ghi trong 25 bảng dữ liệu bằng kiểm tra chỉ đọc.
