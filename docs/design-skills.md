# Skill thiết kế đã áp dụng — 13/10/2026

Đã tải, cài và đọc hai skill theo yêu cầu người dùng. `redesign-existing-projects` là chính: rà mã hiện có, cải thiện bố cục, bề mặt, typography và tương tác, giữ React/CSS và nhận diện khu vườn. `web-design-guidelines` dùng kiểm tra khả năng tiếp cận, focus, form, responsive và trạng thái. Yêu cầu mới của người dùng ưu tiên hơn các gợi ý mặc định trong skill.

| Skill                      | Nguồn trên skills.sh                                                             | Repo/path gốc                                              | SKILL.md đã cài                                                    |
| -------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------ |
| redesign-existing-projects | [Trang skill](https://skills.sh/leonxlnx/taste-skill/redesign-existing-projects) | `leonxlnx/taste-skill`, `skills/redesign-skill`            | `C:/Users/thant/.codex/skills/redesign-existing-projects/SKILL.md` |
| web-design-guidelines      | [Trang skill](https://skills.sh/vercel-labs/agent-skills/web-design-guidelines)  | `vercel-labs/agent-skills`, `skills/web-design-guidelines` | `C:/Users/thant/.codex/skills/web-design-guidelines/SKILL.md`      |

Cài bằng script của skill hệ thống `skill-installer`, lấy đúng repo/path trên, đặt tên thư mục chính là `redesign-existing-projects`. Không cài thư viện thiết kế mới cho ứng dụng. Trên máy khác, nếu thiếu skill, tải lại từ nguồn trên rồi đọc nội dung trước khi áp dụng; không coi việc tên skill được nhắc trong nhật ký là bằng chứng nó đã được cài.

Rà soát dùng bản [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md) lấy mới trong đợt này. Quyết định giao diện ở [app-design.md](app-design.md); bằng chứng và giới hạn kiểm thử ở [redesign-qa-20261013.md](redesign-qa-20261013.md).

## Animation — 15/10/2026

Người dùng đã duyệt áp dụng hai skill từ [emilkowalski/skills](https://github.com/emilkowalski/skills), repo công bố tại [skills.sh](https://skills.sh/emilkowalski/skills). Đọc trực tiếp `skills/animate/SKILL.md`, `RECIPES.md` và `skills/animation-performance/SKILL.md` của nguồn GitHub (SHA nguồn `2d228630ba1446365f614a108cb8252f1feda202`). skills.sh trả403 trong môi trường này; không coi đó là đã truy cập được trang chi tiết. Nguồn tải tạm ở `/tmp/greenedu-animation-emil`, không cài vào home hay thêm dependency ứng dụng. Session khác cần tải/đọc lại nếu thư mục tạm mất.

`animate` hướng dẫn chọn hiệu ứng theo tần suất/mục đích, CSS transition, easing mạnh, thời lượng ngắn, khả năng ngắt và reduced motion. `animation-performance` dùng rà nguyên nhân layout/paint: thay width của tiến độ chương bằng scaleX, bỏ transition shadow thẻ lớn, tránh React state từng frame. Tiếp tục áp dụng redesign-existing-projects và web-design-guidelines; bản Web Interface Guidelines đã lấy mới từ nguồn chính thức cho lượt rà soát này. Quyết định cụ thể ở đầu [app-design.md](app-design.md). Không dùng skill audit/delegation hoặc cài Motion/GSAP cho các hiệu ứng này.
