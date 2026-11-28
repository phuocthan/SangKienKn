# Bảng ánh xạ icon GreenEdu — cũ ↔ mới ↔ nơi dùng

Sinh tự động ngày 28/11/2026 bằng `tools/build.mjs` từ `src/` của GreenEdu (chỉ đọc). 52 icon cũ trong `src/icons.tsx`, 84 icon mới.
Cột **Gợi ý** chọn icon mới theo chữ quanh chỗ dùng (±3 dòng); tên cũ dùng ở nhiều nghĩa (Users, Books, Settings…) cần người lắp xác nhận lại.

## 1. Theo icon cũ (dùng khi lắp)

| Icon cũ (`icons.tsx`) | Phosphor | Icon mới mặc định | Ứng viên khác | Số chỗ dùng |
|---|---|---|---|---|
| `ArrowLeft` | ArrowLeft | `quay-lai` Quay lại | — | 5 |
| `ArrowsDownUp` | ArrowsDownUp | `sap-xep` Sắp xếp | `doi-lop` | 1 |
| `ArrowRight` | ArrowRight | `di-tiep` Đi tiếp | `tiep-tuc` | 14 |
| `BellRing` | BellRinging | `thong-bao` Thông báo | — | 1 |
| `Bird` | Bird | `chim` Chim | — | 2 |
| `BookOpen` | BookOpenText | `luyen-tap` Luyện tập | — | 14 |
| `Check` | Check | `duyet` Duyệt | `so-cau-da-lam` | 3 |
| `CheckCircle2` | CheckCircle | `da-duyet` Đã duyệt | `cau-da-khac-phuc` | 12 |
| `ChevronDown` | CaretDown | `mo-rong` Mở rộng | `loc-chuong` | 1 |
| `ClipboardList` | ClipboardText | `kiem-tra` Kiểm tra | `kiem-tra-online`, `so-cau-da-lam` | 3 |
| `Clock3` | Clock | `thoi-gian-hoc` Thời gian học | `cho-duyet` | 17 |
| `Compass` | Compass | `kham-pha` Khám phá | — | 2 |
| `Download` | DownloadSimple | `tai-xuong` Tải xuống | `xuat-excel`, `xuat-word` | 9 |
| `Eye` | Eye | `xem-bai` Xem bài | — | 1 |
| `EyeOff` | EyeSlash | `an` Ẩn | `canh-bao-roi-tab` | 0 |
| `FileText` | FileText | `tai-lieu` Tài liệu | — | 2 |
| `Flower2` | Flower | `cay-ra-hoa` Cây đã ra hoa | — | 7 |
| `History` | ClockCounterClockwise | `lich-su` Lịch sử | `cho-duyet` | 1 |
| `LayoutDashboard` | SquaresFour | `tong-quan` Tổng quan | — | 1 |
| `Leaf` | Leaf | `la` Lá | — | 5 |
| `Lightbulb` | Lightbulb | `goi-y` Gợi ý | — | 3 |
| `LockKeyhole` | LockKey | `khoa` Khóa | `mo` | 1 |
| `LogOut` | SignOut | `dang-xuat` Đăng xuất | — | 3 |
| `MessageSquare` | ChatCircleText | `binh-luan` Bình luận | — | 4 |
| `Pause` | Pause | `tam-dung` Tạm dừng | — | 3 |
| `Pencil` | PencilSimple | `sua` Sửa | — | 3 |
| `Play` | Play | `bat-dau` Bắt đầu | `dang-hoc` | 2 |
| `Plus` | Plus | `them-moi` Thêm mới | — | 12 |
| `RefreshCw` | ArrowsClockwise | `lam-moi` Làm mới | — | 1 |
| `RotateCcw` | ArrowCounterClockwise | `lam-lai` Làm lại | `cau-can-sua` | 3 |
| `Search` | MagnifyingGlass | `tim` Tìm | — | 4 |
| `Medal` | Medal | `huy-chuong-1` Huy chương hạng 1 | `huy-chuong-2`, `huy-chuong-3` | 0 |
| `Send` | PaperPlaneTilt | `gui` Gửi | `da-nop`, `nop-bai` | 1 |
| `Settings` | GearSix | `cai-dat` Cài đặt chung | `quan-ly-lop` | 2 |
| `ShieldCheck` | ShieldCheck | `bao-mat` Bảo mật | — | 7 |
| `Sparkles` | Sparkle | `lap-lanh` Lấp lánh | `diem-cong` | 1 |
| `Sprout` | Plant | `vuon-cua-toi` Khu vườn của tôi | — | 9 |
| `Sun` | Sun | `mat-troi` Mặt trời | — | 2 |
| `Target` | Target | `muc-tieu` Mục tiêu | `san-thuong`, `ty-le-dung` | 2 |
| `Ticket` | Ticket | `ve-kiem-tra` Vé kiểm tra | — | 2 |
| `Trash2` | Trash | `xoa` Xóa | — | 6 |
| `TrendingUp` | ChartLineUp | `xu-huong` Hành trình | — | 3 |
| `Trophy` | Trophy | `cup` Cúp | `top-10` | 4 |
| `Upload` | UploadSimple | `tai-len` Tải lên | `tai-len-word` | 2 |
| `Users` | UsersThree | `hoat-dong-nhom` Hoạt động nhóm | `hoc-sinh`, `thanh-vien-hoat-dong` | 12 |
| `X` | X | `dong` Đóng | `tu-choi`, `tu-choi-nut` | 7 |
| `ClassroomIcon` | ChalkboardTeacher | `lop-cua-toi` Lớp học của tôi | — | 3 |
| `Books` | Books | `chuong-hoc` Chương học | `ngan-hang-cau-hoi` | 2 |
| `GraduationCap` | GraduationCap | `on-tap` Ôn tập | — | 2 |
| `Notebook` | Notebook | `so-tay-sua-sai` Sổ tay sửa sai | — | 4 |
| `UserCircle` | UserCircle | `tai-khoan` Tài khoản | `hoc-sinh` | 3 |
| `TreeIcon` | Tree | `vuon-cua-lop` Khu vườn của lớp | `ket-trai` | 2 |

## 2. Chi tiết từng chỗ dùng

### `ArrowLeft` → `quay-lai`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/GroupActivities.tsx:282` | `&lt;ArrowLeft size={16} />` | `quay-lai` |
| `src/Learning.tsx:1737` | `&lt;ArrowLeft size={16} /> Về danh sách` | `quay-lai` |
| `src/Learning.tsx:1942` | `&lt;ArrowLeft size={17} /> Về danh sách` | `quay-lai` |
| `src/Practice.tsx:525` | `&lt;ArrowLeft size={16} />` | `quay-lai` |
| `src/Practice.tsx:604` | `&lt;ArrowLeft size={16} />` | `quay-lai` |

### `ArrowsDownUp` → `sap-xep`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/App.tsx:1251` | `&lt;ArrowsDownUp size={16} />` | `sap-xep` |

### `ArrowRight` → `di-tiep`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/App.tsx:1029` | `&lt;ArrowRight size={18} />` | `tiep-tuc` |
| `src/App.tsx:1784` | `&lt;ArrowRight size={18} />` | `di-tiep` |
| `src/App.tsx:1822` | `&lt;ArrowRight size={17} />` | `di-tiep` |
| `src/App.tsx:2092` | `&lt;ArrowRight size={17} />` | `di-tiep` |
| `src/App.tsx:2220` | `&lt;ArrowRight size={18} />` | `di-tiep` |
| `src/App.tsx:2232` | `&lt;ArrowRight size={18} />` | `di-tiep` |
| `src/App.tsx:2240` | `&lt;ArrowRight size={18} />` | `di-tiep` |
| `src/App.tsx:2378` | `&lt;ArrowRight size={16} />` | `di-tiep` |
| `src/components.tsx:361` | `&lt;ArrowRight size={16} />` | `di-tiep` |
| `src/GardenGoal.tsx:91` | `Luyện tập &lt;ArrowRight size={17} aria-hidden="true" />` | `di-tiep` |
| `src/HomeTasks.tsx:133` | `{corrections} câu cần sửa &lt;ArrowRight size={16} />` | `di-tiep` |
| `src/HomeTasks.tsx:160` | `&lt;ArrowRight size={17} aria-hidden="true" />` | `di-tiep` |
| `src/Practice.tsx:583` | `&lt;ArrowRight size={18} />` | `di-tiep` |
| `src/Practice.tsx:737` | `&lt;ArrowRight size={17} />` | `di-tiep` |

### `BellRing` → `thong-bao`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/ExamNotices.tsx:122` | `&lt;BellRing size={20} />` | `thong-bao` |

### `Bird` → `chim`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/GardenNote.tsx:61` | `icon: Bird,` | `chim` |
| `src/GardenNote.tsx:109` | `icon: Bird,` | `chim` |

### `BookOpen` → `luyen-tap`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/App.tsx:634` | `{ id: "practice", label: "Luyện tập", icon: BookOpen },` | `luyen-tap` |
| `src/App.tsx:685` | `{ id: "practice", label: "Luyện tập", icon: BookOpen },` | `luyen-tap` |
| `src/App.tsx:713` | `{ id: "learning" as const, label: "Ôn tập", icon: BookOpen },` | `luyen-tap` |
| `src/App.tsx:2027` | `&lt;BookOpen size={14} />` | `luyen-tap` |
| `src/App.tsx:2165` | `icon={&lt;BookOpen size={21} />}` | `luyen-tap` |
| `src/App.tsx:2228` | `&lt;BookOpen size={22} />` | `luyen-tap` |
| `src/App.tsx:2332` | `&lt;BookOpen size={21} />` | `luyen-tap` |
| `src/ClassHonors.tsx:91` | `&lt;BookOpen size={15} />` | `luyen-tap` |
| `src/ExamMetadata.tsx:9` | `&lt;BookOpen size={18} />` | `luyen-tap` |
| `src/GardenNote.tsx:25` | `icon: BookOpen,` | `luyen-tap` |
| `src/GardenNote.tsx:49` | `icon: BookOpen,` | `luyen-tap` |
| `src/GardenNote.tsx:73` | `icon: BookOpen,` | `luyen-tap` |
| `src/Learning.tsx:661` | `&lt;BookOpen size={21} aria-hidden="true" /> Chuẩn bị đề & thời` | `luyen-tap` |
| `src/ReviewLibrary.tsx:288` | `&lt;BookOpen size={21} aria-hidden="true" /> Bài ôn của lớp` | `luyen-tap` |

### `Check` → `duyet`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/Avatars.tsx:306` | `&lt;Check className="avatar-check" size={16} />` | `duyet` |
| `src/Practice.tsx:746` | `&lt;Check size={17} />` | `duyet` |
| `src/StudentLevel.tsx:171` | `&lt;Check size={10} />` | `duyet` |

### `CheckCircle2` → `da-duyet`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/Accounts.tsx:151` | `&lt;CheckCircle2 size={18} />` | `da-duyet` |
| `src/App.tsx:1905` | `icon={&lt;CheckCircle2 size={21} />}` | `ty-le-dung` |
| `src/App.tsx:2015` | `&lt;CheckCircle2 size={24} />` | `da-duyet` |
| `src/App.tsx:2174` | `icon={&lt;CheckCircle2 size={21} />}` | `ty-le-dung` |
| `src/App.tsx:3074` | `&lt;CheckCircle2 size={17} />` | `da-duyet` |
| `src/ClassHonors.tsx:99` | `&lt;CheckCircle2 size={15} />` | `ty-le-dung` |
| `src/Feedback.tsx:228` | `&lt;CheckCircle2 size={16} />` | `da-duyet` |
| `src/GroupActivities.tsx:216` | `&lt;CheckCircle2 size={18} />` | `da-duyet` |
| `src/MotionToast.tsx:23` | `&lt;CheckCircle2 size={18} aria-hidden="true" />` | `da-duyet` |
| `src/Practice.tsx:699` | `&lt;CheckCircle2 size={19} />` | `da-duyet` |
| `src/QuestionBank.tsx:613` | `{index === q.correctIndex && &lt;CheckCircle2 size={16} />}` | `ty-le-dung` |
| `src/StudentLevel.tsx:161` | `&lt;CheckCircle2 size={18} />` | `da-duyet` |

### `ChevronDown` → `mo-rong`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/App.tsx:806` | `&lt;ChevronDown size={13} />` | `mo-rong` |

### `ClipboardList` → `kiem-tra`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/App.tsx:636` | `{ id: "online-exams", label: "Kiểm tra", icon: ClipboardList },` | `kiem-tra-online` |
| `src/App.tsx:722` | `icon: ClipboardList,` | `kiem-tra-online` |
| `src/HomeTasks.tsx:152` | `&lt;ClipboardList size={20} aria-hidden="true" />` | `kiem-tra` |

### `Clock3` → `thoi-gian-hoc`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/App.tsx:1003` | `&lt;Clock3 size={19} aria-hidden="true" />` | `thoi-gian-hoc` |
| `src/App.tsx:1899` | `icon={&lt;Clock3 size={21} />}` | `thoi-gian-hoc` |
| `src/App.tsx:2023` | `&lt;Clock3 size={14} />` | `thoi-gian-hoc` |
| `src/App.tsx:2611` | `&lt;Clock3 size={20} />` | `thoi-gian-hoc` |
| `src/ClassCommunity.tsx:227` | `&lt;Clock3 size={21} />` | `thoi-gian-hoc` |
| `src/ExamMetadata.tsx:17` | `&lt;Clock3 size={18} />` | `cho-duyet` |
| `src/ExamMetadata.tsx:23` | `&lt;Clock3 size={18} />` | `thoi-gian-hoc` |
| `src/ExamMetadata.tsx:38` | `&lt;Clock3 size={18} />` | `thoi-gian-hoc` |
| `src/ExamNotices.tsx:137` | `&lt;Clock3 size={16} /> {serverTime &lt; pending.startsAt ? "Bắt đầu sau" : "Còn"}{" "}` | `thoi-gian-hoc` |
| `src/ExamNotices.tsx:176` | `&lt;Clock3 size={15} /> {waiting ? "Bắt đầu sau" : "Còn"}{" "}` | `thoi-gian-hoc` |
| `src/GroupActivities.tsx:317` | `&lt;Clock3 size={16} />` | `thoi-gian-hoc` |
| `src/GroupActivities.tsx:382` | `&lt;Clock3 size={17} />` | `thoi-gian-hoc` |
| `src/HomeTasks.tsx:154` | `&lt;Clock3 size={20} aria-hidden="true" />` | `thoi-gian-hoc` |
| `src/Learning.tsx:1085` | `&lt;Clock3 size={21} /> Lịch kiểm tra đã lưu` | `thoi-gian-hoc` |
| `src/Learning.tsx:1827` | `&lt;Clock3 size={17} />` | `thoi-gian-hoc` |
| `src/OnlineExamGroups.tsx:50` | `&lt;Clock3 size={21} /> Các buổi kiểm tra online` | `thoi-gian-hoc` |
| `src/Practice.tsx:611` | `&lt;Clock3 size={14} />` | `thoi-gian-hoc` |

### `Compass` → `kham-pha`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/GardenNote.tsx:37` | `icon: Compass,` | `kham-pha` |
| `src/GardenNote.tsx:85` | `icon: Compass,` | `kham-pha` |

### `Download` → `tai-xuong`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/App.tsx:2514` | `&lt;Download size={16} />` | `xuat-excel` |
| `src/GroupActivities.tsx:52` | `&lt;Download size={16} />` | `tai-xuong` |
| `src/Learning.tsx:1232` | `&lt;Download size={16} /> Xuất Excel` | `xuat-excel` |
| `src/OnlineExamGroups.tsx:236` | `&lt;Download size={16} /> Tải kết quả` | `xuat-excel` |
| `src/QuestionBank.tsx:200` | `&lt;Download size={16} /> Xuất Word` | `xuat-word` |
| `src/QuestionBank.tsx:206` | `&lt;Download size={16} /> Xuất Excel` | `xuat-excel` |
| `src/QuestionBank.tsx:909` | `&lt;Download size={16} />` | `xuat-word` |
| `src/QuestionBank.tsx:919` | `&lt;Download size={16} />` | `tai-xuong` |
| `src/StudentStudyStatistics.tsx:359` | `&lt;Download size={16} /> Xuất CSV` | `xuat-excel` |

### `Eye` → `xem-bai`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/QuestionBank.tsx:408` | `{q.active ? &lt;Trash2 size={15} /> : &lt;Eye size={15} />}` | `xem-bai` |

### `EyeOff` → `an`

Chưa dùng ngoài `icons.tsx`.

### `FileText` → `tai-lieu`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/GroupActivities.tsx:439` | `&lt;FileText size={20} />` | `tai-lieu` |
| `src/GroupActivities.tsx:661` | `&lt;FileText size={22} />` | `tai-lieu` |

### `Flower2` → `cay-ra-hoa`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/GardenGoal.tsx:87` | `&lt;Flower2 size={17} aria-hidden="true" /> {flowers}/` | `cay-ra-hoa` |
| `src/GardenNote.tsx:67` | `icon: Flower2,` | `cay-ra-hoa` |
| `src/GardenNote.tsx:103` | `icon: Flower2,` | `cay-ra-hoa` |
| `src/StudentGarden.tsx:164` | `&lt;Flower2 />` | `cay-ra-hoa` |
| `src/StudentGarden.tsx:166` | `&lt;Flower2 />` | `cay-ra-hoa` |
| `src/StudentGarden.tsx:169` | `&lt;Flower2 />` | `cay-ra-hoa` |
| `src/StudentGarden.tsx:171` | `&lt;Flower2 />` | `cay-ra-hoa` |

### `History` → `lich-su`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/QuestionBank.tsx:415` | `&lt;History size={15} />` | `lich-su` |

### `LayoutDashboard` → `tong-quan`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/App.tsx:622` | `{ id: "home", label: "Tổng quan", icon: LayoutDashboard },` | `tong-quan` |

### `Leaf` → `la`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/App.tsx:1735` | `&lt;Leaf size={17} />` | `la` |
| `src/components.tsx:324` | `&lt;Leaf size={27} aria-hidden="true" />` | `la` |
| `src/GardenNote.tsx:19` | `icon: Leaf,` | `la` |
| `src/GardenNote.tsx:43` | `icon: Leaf,` | `la` |
| `src/StudentGarden.tsx:165` | `&lt;Leaf />` | `la` |

### `Lightbulb` → `goi-y`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/GardenNote.tsx:31` | `icon: Lightbulb,` | `goi-y` |
| `src/GardenNote.tsx:79` | `icon: Lightbulb,` | `goi-y` |
| `src/GardenNote.tsx:97` | `icon: Lightbulb,` | `goi-y` |

### `LockKeyhole` → `khoa`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/StudentLevel.tsx:173` | `&lt;LockKeyhole size={10} />` | `khoa` |

### `LogOut` → `dang-xuat`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/Accounts.tsx:116` | `&lt;LogOut size={19} />` | `dang-xuat` |
| `src/App.tsx:772` | `&lt;LogOut size={19} />` | `dang-xuat` |
| `src/PortraitActions.tsx:51` | `&lt;LogOut size={20} aria-hidden="true" />` | `dang-xuat` |

### `MessageSquare` → `binh-luan`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/App.tsx:760` | `&lt;MessageSquare size={19} />` | `binh-luan` |
| `src/Feedback.tsx:274` | `&lt;MessageSquare size={32} />` | `binh-luan` |
| `src/GroupDiscussion.tsx:30` | `&lt;MessageSquare size={16} />` | `binh-luan` |
| `src/PortraitActions.tsx:31` | `&lt;MessageSquare size={20} aria-hidden="true" />` | `binh-luan` |

### `Pause` → `tam-dung`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/GardenNote.tsx:601` | `&lt;Pause size={13} aria-hidden="true" />` | `tam-dung` |
| `src/Practice.tsx:637` | `&lt;Pause size={20} />` | `tam-dung` |
| `src/StudentGarden.tsx:149` | `{animated ? &lt;Pause size={15} /> : &lt;Play size={15} />}` | `tam-dung` |

### `Pencil` → `sua`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/OnlineExamGroups.tsx:211` | `&lt;Pencil size={16} /> Chỉnh sửa thông tin` | `sua` |
| `src/QuestionBank.tsx:394` | `&lt;Pencil size={15} />` | `sua` |
| `src/StudentNotebook.tsx:152` | `&lt;Pencil size={16} /> Sửa câu hỏi` | `sua` |

### `Play` → `bat-dau`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/GardenNote.tsx:599` | `&lt;Play size={13} aria-hidden="true" />` | `bat-dau` |
| `src/StudentGarden.tsx:149` | `{animated ? &lt;Pause size={15} /> : &lt;Play size={15} />}` | `bat-dau` |

### `Plus` → `them-moi`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/Accounts.tsx:188` | `&lt;Plus size={17} />` | `them-moi` |
| `src/App.tsx:963` | `&lt;Plus size={17} />` | `them-moi` |
| `src/App.tsx:1148` | `&lt;Plus size={18} />` | `them-moi` |
| `src/App.tsx:1259` | `&lt;Plus size={16} />` | `them-moi` |
| `src/App.tsx:1408` | `&lt;Plus size={18} />` | `them-moi` |
| `src/App.tsx:1504` | `&lt;Plus size={16} />` | `them-moi` |
| `src/App.tsx:2533` | `&lt;Plus size={16} />` | `them-moi` |
| `src/Feedback.tsx:127` | `&lt;Plus size={16} />` | `them-moi` |
| `src/GroupActivities.tsx:182` | `&lt;Plus size={16} />` | `them-moi` |
| `src/Learning.tsx:452` | `&lt;Plus size={19} /> Tạo bài kiểm tra` | `them-moi` |
| `src/Lessons.tsx:63` | `&lt;Plus size={15} /> Thêm bài` | `them-moi` |
| `src/ReviewLibrary.tsx:223` | `&lt;Plus size={19} aria-hidden="true" /> Tạo bài ôn` | `them-moi` |

### `RefreshCw` → `lam-moi`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/Accounts.tsx:249` | `&lt;RefreshCw size={16} />` | `lam-moi` |

### `RotateCcw` → `lam-lai`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/Avatars.tsx:343` | `&lt;RotateCcw size={16} />` | `lam-lai` |
| `src/Feedback.tsx:226` | `&lt;RotateCcw size={16} />` | `lam-lai` |
| `src/Practice.tsx:578` | `Làm lại bài &lt;RotateCcw size={17} />` | `lam-lai` |

### `Search` → `tim`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/Accounts.tsx:226` | `&lt;Search size={18} />` | `tim` |
| `src/App.tsx:2561` | `&lt;Search size={18} aria-hidden="true" />` | `tim` |
| `src/App.tsx:2649` | `&lt;Search size={18} />` | `tim` |
| `src/GroupActivities.tsx:252` | `&lt;Search size={18} />` | `tim` |

### `Medal` → `huy-chuong-1`

Chưa dùng ngoài `icons.tsx`.

### `Send` → `gui`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/Conversation.tsx:72` | `&lt;Send size={16} />` | `gui` |

### `Settings` → `cai-dat`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/App.tsx:629` | `icon: Settings,` | `quan-ly-lop` |
| `src/App.tsx:668` | `{ id: "class-general", label: "Cài đặt chung", icon: Settings },` | `cai-dat` |

### `ShieldCheck` → `bao-mat`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/Accounts.tsx:103` | `&lt;ShieldCheck size={24} />` | `bao-mat` |
| `src/Accounts.tsx:173` | `&lt;ShieldCheck size={18} />` | `bao-mat` |
| `src/Accounts.tsx:194` | `&lt;ShieldCheck size={26} />` | `bao-mat` |
| `src/App.tsx:932` | `&lt;ShieldCheck size={18} />` | `bao-mat` |
| `src/App.tsx:1793` | `&lt;ShieldCheck size={16} />` | `bao-mat` |
| `src/App.tsx:2825` | `&lt;ShieldCheck size={17} />` | `bao-mat` |
| `src/ExamMetadata.tsx:31` | `&lt;ShieldCheck size={18} />` | `bao-mat` |

### `Sparkles` → `lap-lanh`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/Practice.tsx:553` | `&lt;Sparkles size={36} />` | `lap-lanh` |

### `Sprout` → `vuon-cua-toi`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/App.tsx:633` | `{ id: "home", label: "Khu vườn của tôi", icon: Sprout },` | `vuon-cua-toi` |
| `src/App.tsx:923` | `&lt;Sprout size={18} />` | `vuon-cua-toi` |
| `src/App.tsx:1532` | `&lt;Sprout size={15} />` | `vuon-cua-toi` |
| `src/App.tsx:1816` | `&lt;Sprout size={21} />` | `vuon-cua-toi` |
| `src/App.tsx:1843` | `&lt;Sprout size={16} />` | `vuon-cua-toi` |
| `src/components.tsx:37` | `&lt;Sprout size={27} />` | `vuon-cua-toi` |
| `src/StudentGarden.tsx:135` | `&lt;Sprout size={15} /> KHU VƯỜN CHUNG` | `vuon-cua-toi` |
| `src/StudentGarden.tsx:170` | `&lt;Sprout />` | `vuon-cua-toi` |
| `src/StudentGarden.tsx:222` | `&lt;Sprout size={38} />` | `vuon-cua-toi` |

### `Sun` → `mat-troi`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/GardenNote.tsx:55` | `icon: Sun,` | `mat-troi` |
| `src/GardenNote.tsx:91` | `icon: Sun,` | `mat-troi` |

### `Target` → `muc-tieu`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/GardenGoal.tsx:36` | `&lt;Target size={24} aria-hidden="true" />` | `muc-tieu` |
| `src/GardenGoal.tsx:56` | `&lt;Target size={24} aria-hidden="true" />` | `muc-tieu` |

### `Ticket` → `ve-kiem-tra`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/Learning.tsx:925` | `&lt;Ticket size={21} className="reward-ticket-icon" /> Cấp độ & vé` | `ve-kiem-tra` |
| `src/Learning.tsx:955` | `&lt;Ticket size={20} className="reward-ticket-icon" />` | `ve-kiem-tra` |

### `Trash2` → `xoa`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/ChapterDelete.tsx:50` | `&lt;Trash2 size={16} />` | `xoa` |
| `src/Lessons.tsx:91` | `&lt;Trash2 size={16} />` | `xoa` |
| `src/OnlineExamGroups.tsx:249` | `&lt;Trash2 size={16} /> Xóa bài kiểm tra` | `xoa` |
| `src/QuestionBank.tsx:307` | `&lt;Trash2 size={16} /> Xóa các câu đã chọn` | `xoa` |
| `src/QuestionBank.tsx:325` | `&lt;Trash2 size={16} /> Xóa cả bài` | `xoa` |
| `src/QuestionBank.tsx:408` | `{q.active ? &lt;Trash2 size={15} /> : &lt;Eye size={15} />}` | `xoa` |

### `TrendingUp` → `xu-huong`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/App.tsx:1046` | `&lt;TrendingUp size={17} /> Xem hành trình` | `xu-huong` |
| `src/App.tsx:2236` | `&lt;TrendingUp size={22} />` | `xu-huong` |
| `src/App.tsx:2525` | `&lt;TrendingUp size={16} />` | `xu-huong` |

### `Trophy` → `cup`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/App.tsx:717` | `icon: Trophy,` | `cup` |
| `src/ClassHonors.tsx:177` | `&lt;Trophy size={27} />` | `cup` |
| `src/Learning.tsx:1044` | `&lt;Trophy size={17} /> Săn thưởng` | `cup` |
| `src/StudentGarden.tsx:82` | `&lt;Trophy size={25} />` | `cup` |

### `Upload` → `tai-len`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/Avatars.tsx:211` | `&lt;Upload size={16} />` | `tai-len` |
| `src/QuestionBank.tsx:244` | `&lt;Upload size={16} />` | `tai-len-word` |

### `Users` → `hoat-dong-nhom`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/Accounts.tsx:95` | `&lt;Users size={20} />` | `hoc-sinh` |
| `src/App.tsx:666` | `{ id: "class-settings", label: "Học sinh", icon: Users },` | `hoc-sinh` |
| `src/App.tsx:676` | `{ id: "groups", label: "Hoạt động nhóm", icon: Users },` | `thanh-vien-hoat-dong` |
| `src/App.tsx:703` | `{ id: "groups", label: "Hoạt động nhóm", icon: Users },` | `thanh-vien-hoat-dong` |
| `src/App.tsx:1814` | `&lt;Users size={21} />` | `hoat-dong-nhom` |
| `src/App.tsx:1855` | `&lt;Users size={16} />` | `hoat-dong-nhom` |
| `src/App.tsx:2160` | `icon={&lt;Users size={21} />}` | `hoc-sinh` |
| `src/App.tsx:2216` | `&lt;Users size={22} />` | `hoc-sinh` |
| `src/ClassCommunity.tsx:217` | `&lt;Users size={21} />` | `thanh-vien-hoat-dong` |
| `src/GroupActivities.tsx:305` | `&lt;Users size={22} />` | `hoat-dong-nhom` |
| `src/GroupActivities.tsx:321` | `&lt;Users size={16} />` | `hoat-dong-nhom` |
| `src/HomeTasks.tsx:150` | `&lt;Users size={20} aria-hidden="true" />` | `hoat-dong-nhom` |

### `X` → `dong`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/App.tsx:1180` | `Xóa lớp` | `dong` |
| `src/App.tsx:1566` | `title="Xóa lớp học"` | `dong` |
| `src/App.tsx:1574` | `Xóa “{deletingClass.name} · {deletingClass.subject}” khỏi danh` | `dong` |
| `src/App.tsx:1609` | `{deleteClassBusy ? "Đang xóa…" : "Xóa lớp"}` | `dong` |
| `src/App.tsx:2578` | `Xóa tìm kiếm` | `dong` |
| `src/components.tsx:302` | `&lt;X size={20} aria-hidden="true" />` | `dong` |
| `src/MotionToast.tsx:32` | `&lt;X size={16} aria-hidden="true" />` | `dong` |

### `ClassroomIcon` → `lop-cua-toi`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/App.tsx:623` | `{ id: "classes", label: "Lớp học của tôi", icon: ClassroomIcon },` | `lop-cua-toi` |
| `src/App.tsx:675` | `{ id: "classes", label: "Khu vườn của lớp", icon: ClassroomIcon },` | `lop-cua-toi` |
| `src/App.tsx:791` | `&lt;ClassroomIcon size={16} />` | `lop-cua-toi` |

### `Books` → `chuong-hoc`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/App.tsx:624` | `{ id: "questions", label: "Ngân hàng câu hỏi", icon: Books },` | `ngan-hang-cau-hoi` |
| `src/App.tsx:667` | `{ id: "class-chapters", label: "Chương học", icon: Books },` | `chuong-hoc` |

### `GraduationCap` → `on-tap`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/App.tsx:625` | `{ id: "learning", label: "Ôn tập", icon: GraduationCap },` | `on-tap` |
| `src/App.tsx:635` | `{ id: "learning", label: "Ôn tập", icon: GraduationCap },` | `on-tap` |

### `Notebook` → `so-tay-sua-sai`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/App.tsx:689` | `icon: Notebook,` | `so-tay-sua-sai` |
| `src/App.tsx:1916` | `icon={&lt;Notebook size={21} />}` | `so-tay-sua-sai` |
| `src/ClassHonors.tsx:124` | `&lt;Notebook size={15} />` | `so-tay-sua-sai` |
| `src/Learning.tsx:1016` | `&lt;Notebook size={16} /> Mở sổ tay` | `so-tay-sua-sai` |

### `UserCircle` → `tai-khoan`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/Accounts.tsx:112` | `&lt;UserCircle size={19} />` | `tai-khoan` |
| `src/App.tsx:768` | `&lt;UserCircle size={19} />` | `tai-khoan` |
| `src/PortraitActions.tsx:42` | `&lt;UserCircle size={20} aria-hidden="true" />` | `tai-khoan` |

### `TreeIcon` → `vuon-cua-lop`

| Nơi dùng | Dòng mã | Gợi ý |
|---|---|---|
| `src/App.tsx:637` | `{ id: "garden", label: "Lớp học của tôi", icon: TreeIcon },` | `vuon-cua-lop` |
| `src/App.tsx:702` | `{ id: "garden", label: "Khu vườn của lớp", icon: TreeIcon },` | `vuon-cua-lop` |

## 3. Icon mới chưa có tương ứng cũ (dùng cho giao diện mới)

- `menu-them` — Thêm
- `offline` — Mất kết nối
- `dang-nhap` — Đăng nhập
