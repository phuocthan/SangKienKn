# Thông báo deploy Railway trên Android

Luồng: **Railway deploy thành công → GitHub deployment_status → GitHub Actions → ntfy → Android**.

Workflow [railway-ntfy.yml](../.github/workflows/railway-ntfy.yml) chỉ nhận trạng thái `success` từ `railway-app[bot]`, môi trường thực tế **`zooming-light / production`**, loại các môi trường tạm. Không dùng tên `production` đơn lẻ vì Railway gửi tên kết hợp project/environment. Không báo thành công chỉ dựa trên push hoặc build. Workflow không checkout, không build/deploy, không truy cập API/database GreenEdu.

## Nhận trên Android

1. Cài **ntfy** từ [Google Play](https://play.google.com/store/apps/details?id=io.heckel.ntfy).
2. Mở app, cho phép thông báo, nhấn **+** để đăng ký topic.
3. Server: **`https://ntfy.sh`**. Topic: mã kênh riêng được cung cấp trong chat triển khai, không ghi vào Git/tài liệu công khai.
4. Lưu. Khi deploy thành công, thông báo có mã commit ngắn và nút **Mở GreenEdu**.

Máy tính cũng có thể mở `https://ntfy.sh/<topic>` và bật thông báo trong trình duyệt. Android cần Internet; nếu không thấy thông báo, kiểm tra quyền thông báo và chế độ tiết kiệm pin của ứng dụng.

## Cấu hình GitHub

Repository → **Settings → Secrets and variables → Actions → Secrets**:

| Secret | Ý nghĩa |
| --- | --- |
| `NTFY_TOPIC` | Bắt buộc. Topic ngẫu nhiên dài ít nhất 20 ký tự, chỉ chữ/số/`_`/`-`. Cấu hình ban đầu dùng tiền tố `greenedu-deploy-` và 32 ký tự hex ngẫu nhiên. |
| `NTFY_TOKEN` | Tùy chọn. Access token khi tài khoản ntfy yêu cầu xác thực gửi tin. Bản thiết lập ban đầu không cần token. |

Topic trên ntfy.sh mặc định không có kiểm soát truy cập; tên ngẫu nhiên giúp khó đoán nhưng ai có tên vẫn có thể đọc/gửi tin. Giữ tên riêng, không đưa vào URL công khai hoặc Git. Thông báo chỉ có trạng thái/mã commit ngắn/link website, không chứa dữ liệu học sinh, token hoặc nội dung commit. Nếu cần kiểm soát quyền, dùng topic được bảo vệ trong tài khoản ntfy rồi cấu hình `NTFY_TOKEN` và đăng nhập trên app.

Để đổi kênh, tạo topic ngẫu nhiên mới, thay secret `NTFY_TOPIC`, đăng ký topic mới trên Android. Không cần sửa mã workflow.

## Gửi thử và kiểm tra

Repository → **Actions → Railway deploy notification → Run workflow → main → Run workflow**. Tin gửi thủ công ghi rõ **Test thông báo**, không giả là deploy thành công. Workflow phải nằm trên default branch `main` để nút chạy thủ công khả dụng.

Lượt tự động chỉ chạy khi Railway ghi một trạng thái deployment mới vào GitHub cho commit có workflow. Deployment cũ không tự được gửi lại khi thêm workflow. Khi đổi tên project/môi trường Railway, cập nhật cả điều kiện job và kiểm tra Python. Đối chiếu deployment/status thực tế trong GitHub nếu không có lượt tự động.

Workflow kiểm tra xác nhận từ ntfy, thử lại tối đa 3 lần khi lỗi mạng/429/5xx, không in topic/token hoặc response của ntfy vào log. GitHub Actions thành công xác nhận ntfy nhận tin; chỉ thiết bị thật mới xác nhận Android đã hiện thông báo. Retry sau timeout hiếm khi có thể tạo thông báo trùng.

Nguồn: [Railway post-deploy với GitHub Actions](https://docs.railway.com/guides/github-actions-post-deploy), [sự kiện deployment_status](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#deployment_status), [gửi tin ntfy](https://docs.ntfy.sh/publish/), [ứng dụng Android](https://docs.ntfy.sh/subscribe/phone/).
