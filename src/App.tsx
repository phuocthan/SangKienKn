import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ClipboardList,
  Download,
  Flower2,
  LayoutDashboard,
  Leaf,
  LogOut,
  MessageSquare,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sprout,
  TrendingUp,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { api, ApiError, duration, errorMessage } from "./api";
import {
  Empty,
  ForestIcon,
  GardenIllustration,
  LinkButton,
  Logo,
  Modal,
  SectionTitle,
} from "./components";
import { Practice } from "./Practice";
import { Lessons } from "./Lessons";
import { Learning } from "./Learning";
import { ExamNotices } from "./ExamNotices";
import { ClassCommunity } from "./ClassCommunity";
import { GroupActivities } from "./GroupActivities";
import { Feedback } from "./Feedback";
import { AdminWorkspace } from "./Accounts";
import { PortraitActions } from "./PortraitActions";
import { Avatar, AvatarPicker } from "./Avatars";
import {
  ChapterLevelTimeline,
  StudentLevelBadge,
  StudentLevelCard,
  StudentLevelIcon,
} from "./StudentLevel";
import { STUDENT_LEVEL_NAMES } from "../shared/student-levels";
import { GardenGoal } from "./GardenGoal";
import { QuestionBank } from "./QuestionBank";
import { QuestionFields } from "./QuestionFields";
import type { Chapter, Classroom, Question, Student, User } from "./types";
import { loginEmail } from "../shared/login-email";

type Page =
  | "home"
  | "practice"
  | "learning"
  | "online-exams"
  | "corrections"
  | "classes"
  | "groups"
  | "questions"
  | "progress"
  | "garden"
  | "leaderboard"
  | "feedback"
  | "settings";
type Study = {
  chapter: Chapter;
  mode: "practice" | "correction";
  questionId?: string;
  lesson?: string;
  reviewId?: string;
};
type Editor =
  "class" | "chapter" | "student" | "question" | { student: Student } | null;
const stages = STUDENT_LEVEL_NAMES;
type QuickAccount = { role: "teacher" | "student"; name: string };

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [booting, setBooting] = useState(true);
  const [demo, setDemo] = useState(false);
  const [quickLogin, setQuickLogin] = useState(false);
  const [quickAccounts, setQuickAccounts] = useState<QuickAccount[]>([]);
  const [startupError, setStartupError] = useState("");
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [classId, setClassId] = useState(
    new URLSearchParams(location.hash.slice(1)).get("learning") ?? "",
  );
  const [page, setPage] = useState<Page>(
    location.hash.includes("learning=")
      ? new URLSearchParams(location.hash.slice(1)).get("workspace") ===
        "online"
        ? "online-exams"
        : "learning"
      : "home",
  );
  const [study, setStudy] = useState<Study | null>(null);
  const [entryRunId, setEntryRunId] = useState("");
  const [entryClassId, setEntryClassId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editor, setEditor] = useState<Editor>(null);
  const [accountDialog, setAccountDialog] = useState<
    "avatar" | "password" | null
  >(null);
  const [questionChapter, setQuestionChapter] = useState("");
  const [questionLesson, setQuestionLesson] = useState("");
  const [correctionChapterId, setCorrectionChapterId] = useState("");
  useEffect(() => setQuestionLesson(""), [questionChapter, classId]);
  const [revision, setRevision] = useState(0);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const current = classes.find((c) => c.id === classId) ?? classes[0];
  const isTeacher = user?.role === "teacher";

  const initialize = useCallback(async () => {
    setBooting(true);
    setStartupError("");
    try {
      const health = await api<{
        demo: boolean;
        quickLogin?: boolean;
        quickAccounts?: QuickAccount[];
      }>("/health");
      setDemo(health.demo);
      setQuickLogin(!!health.quickLogin);
      setQuickAccounts(health.quickAccounts ?? []);
      try {
        setUser(await api<User>("/auth/me"));
      } catch (e) {
        if (!(e instanceof ApiError && e.status === 401)) throw e;
      }
    } catch (e) {
      setStartupError(errorMessage(e));
    } finally {
      setBooting(false);
    }
  }, []);
  useEffect(() => {
    void initialize();
  }, [initialize]);
  useEffect(() => {
    const expired = () => {
      setUser(null);
      setClasses([]);
      setStudy(null);
      setNotice("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    };
    window.addEventListener("session-expired", expired);
    return () => window.removeEventListener("session-expired", expired);
  }, []);
  const reload = useCallback(async () => {
    if (!user || user.mustChange || user.role === "admin") return;
    try {
      const rows = await api<Classroom[]>("/classrooms");
      setClasses(rows);
      setError("");
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [user]);
  useEffect(() => {
    if (!user || user.mustChange) return;
    setLoadingClasses(true);
    void reload().finally(() => setLoadingClasses(false));
  }, [reload]);
  useEffect(() => {
    setQuestionChapter(current?.chapters[0]?.id ?? "");
  }, [current?.id]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 6000);
    return () => clearTimeout(timer);
  }, [notice]);
  const refresh = useCallback(() => {
    void reload();
    setRevision((r) => r + 1);
  }, [reload]);
  const closeEditor = useCallback(() => setEditor(null), []);
  const closeAccountDialog = useCallback(() => setAccountDialog(null), []);
  function navigate(next: Page, chapterId = "") {
    setEntryRunId("");
    setPage(next);
    setStudy(null);
    setError("");
    setCorrectionChapterId(next === "corrections" ? chapterId : "");
  }
  function login(u: User) {
    setUser(u);
    setClasses([]);
    setClassId("");
    setPage("home");
    setStudy(null);
    setNotice("");
  }
  async function logout() {
    try {
      await api("/auth/logout", {});
      setUser(null);
      setClasses([]);
      setStudy(null);
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  async function saveEditor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const data = Object.fromEntries(form.entries());
    if (editor === "class") {
      const result = await api<{ id: string }>("/classrooms", data);
      setClassId(result.id);
      setPage("classes");
    } else if (editor === "chapter" && current) {
      const result = await api<{ id: string }>(
        `/classrooms/${current.id}/chapters`,
        data,
      );
      setQuestionChapter(result.id);
    } else if (editor === "student" && current) {
      await api(
        `/classrooms/${current.id}/${data.accountMode === "existing" ? "memberships" : "students"}`,
        data,
      );
    } else if (editor === "question" && current) {
      await api(`/chapters/${data.chapterId}/questions`, {
        text: data.text,
        explanation: data.explanation,
        lesson: data.lesson,
        choices: [data.a, data.b, data.c, data.d],
        correctIndex: Number(data.correctIndex),
      });
      setQuestionChapter(String(data.chapterId));
      setQuestionLesson("");
    } else if (typeof editor === "object" && editor && current) {
      await api(
        `/classrooms/${current.id}/students/${editor.student.id}/password`,
        data,
      );
    }
    await reload();
    setRevision((r) => r + 1);
    setEditor(null);
    setNotice("Đã lưu thành công.");
  }
  if (booting)
    return (
      <div className="boot">
        <Logo />
        <p>Đang mở khu vườn của bạn…</p>
      </div>
    );
  if (startupError)
    return (
      <div className="boot">
        <Logo />
        <div className="error-banner" role="alert">
          Không kết nối được máy chủ. {startupError}
        </div>
        <button className="button primary" onClick={() => void initialize()}>
          Thử kết nối lại
        </button>
      </div>
    );
  if (!user)
    return (
      <Login
        demo={demo}
        quickLogin={quickLogin}
        quickAccounts={quickAccounts}
        onLogin={login}
        notice={notice}
      />
    );
  if (user.mustChange)
    return (
      <div className="password-screen">
        <Logo />
        <div className="card">
          <span className="eyebrow">BẢO VỆ TÀI KHOẢN CỦA BẠN</span>
          <h1>Đặt mật khẩu của riêng bạn</h1>
          <p>Đổi mật khẩu tạm được cung cấp trước khi sử dụng GreenEdu.</p>
          <PasswordForm onUpdate={setUser} />
          <button className="text-button" onClick={() => void logout()}>
            Đăng xuất
          </button>
        </div>
      </div>
    );
  if (user.role === "admin")
    return (
      <AdminWorkspace
        user={user}
        onLogout={logout}
        passwordForm={<PasswordForm onUpdate={setUser} />}
        error={error}
      />
    );
  const nav: { id: Page; label: string; icon: typeof Leaf }[] = isTeacher
    ? [
        { id: "home", label: "Tổng quan", icon: LayoutDashboard },
        { id: "classes", label: "Lớp học của tôi", icon: Users },
        { id: "groups", label: "Hoạt động nhóm", icon: Users },
        { id: "questions", label: "Ngân hàng câu hỏi", icon: BookOpen },
        { id: "learning", label: "Ôn tập & kiểm tra", icon: Clock3 },
        {
          id: "online-exams",
          label: "Quản lý kiểm tra online",
          icon: ClipboardList,
        },
        { id: "progress", label: "Tiến độ học tập", icon: TrendingUp },
        { id: "garden", label: "Khu vườn của lớp", icon: Flower2 },
        { id: "leaderboard", label: "Xếp hạng chăm chỉ", icon: Trophy },
      ]
    : [
        { id: "home", label: "Khu vườn của tôi", icon: Sprout },
        { id: "practice", label: "Luyện tập", icon: BookOpen },
        { id: "learning", label: "Ôn tập & kiểm tra", icon: Clock3 },
        { id: "online-exams", label: "Kiểm tra online", icon: ClipboardList },
        { id: "groups", label: "Hoạt động nhóm", icon: Users },
        { id: "corrections", label: "Sổ tay sửa sai", icon: CheckCircle2 },
        { id: "progress", label: "Hành trình của tôi", icon: TrendingUp },
        { id: "garden", label: "Khu vườn của lớp", icon: Flower2 },
        { id: "leaderboard", label: "Xếp hạng chăm chỉ", icon: Trophy },
      ];
  const pageNames: Record<Page, string> = {
    home: isTeacher ? "Tổng quan" : "Khu vườn của tôi",
    practice: "Luyện tập",
    learning: "Ôn tập & kiểm tra",
    "online-exams": isTeacher ? "Quản lý kiểm tra online" : "Kiểm tra online",
    corrections: "Sổ tay sửa sai",
    classes: "Lớp học của tôi",
    groups: "Hoạt động nhóm",
    questions: "Ngân hàng câu hỏi",
    progress: isTeacher ? "Tiến độ học tập" : "Hành trình của tôi",
    settings: "Tài khoản",
    garden: "Khu vườn của lớp",
    leaderboard: "Xếp hạng chăm chỉ",
    feedback: isTeacher ? "Quản lý góp ý" : "Góp ý",
  };
  const totalSeconds =
    current?.chapters.reduce((n, c) => n + c.seconds, 0) ?? 0;
  const openCorrections = classes.reduce(
    (n, c) => n + c.chapters.reduce((a, ch) => a + ch.openCorrections, 0),
    0,
  );
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Logo school />
        <div className="workspace-label">
          {isTeacher ? "TRANG GIÁO VIÊN" : "TRANG HỌC TẬP"}
        </div>
        <nav aria-label="Điều hướng chính">
          {nav.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${page === item.id ? "active" : ""}`}
              aria-current={page === item.id ? "page" : undefined}
              onClick={() => navigate(item.id)}
            >
              <ForestIcon compact>
                <item.icon size={20} />
              </ForestIcon>
              <span>{item.label}</span>
              {item.id === "corrections" && openCorrections > 0 && (
                <span className="nav-count">{openCorrections}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="note-leaf">
              <Leaf size={19} />
            </span>
            <strong>Mỗi ngày, một chút xanh</strong>
            <p>
              {isTeacher
                ? "Cùng học sinh gieo những hạt mầm tri thức."
                : "Không cần đi thật nhanh. Chỉ cần tiếp tục lớn lên."}
            </p>
          </div>
          <button
            className={`nav-item ${page === "feedback" ? "active" : ""}`}
            aria-current={page === "feedback" ? "page" : undefined}
            aria-label={isTeacher ? "Quản lý góp ý" : "Góp ý"}
            onClick={() => navigate("feedback")}
          >
            <ForestIcon compact>
              <MessageSquare size={19} />
            </ForestIcon>
            {isTeacher ? "Quản lý góp ý" : "Góp ý"}
          </button>
          <button
            className={`nav-item ${page === "settings" ? "active" : ""}`}
            aria-current={page === "settings" ? "page" : undefined}
            onClick={() => navigate("settings")}
          >
            <ForestIcon compact>
              <Settings size={19} />
            </ForestIcon>
            Tài khoản
          </button>
          <button className="nav-item" onClick={() => void logout()}>
            <ForestIcon compact>
              <LogOut size={19} />
            </ForestIcon>
            Đăng xuất
          </button>
          <span className="sidebar-version">GREENEDU · MVP 0.1</span>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <PortraitActions
            page={page}
            feedbackLabel={isTeacher ? "Quản lý góp ý" : "Góp ý"}
            onFeedback={() => navigate("feedback")}
            onAccount={() => navigate("settings")}
            onLogout={() => void logout()}
          />
          <div className="breadcrumb">
            Trang {isTeacher ? "giáo viên" : "học tập"}
            <span>/</span>
            <strong>{pageNames[page]}</strong>
          </div>
          <div className="topbar-right">
            {current && (
              <label className="class-switch">
                <Users size={16} />
                <select
                  aria-label="Chọn lớp học"
                  value={current.id}
                  onChange={(e) => {
                    setClassId(e.target.value);
                    setStudy(null);
                  }}
                >
                  {classes.map((c) => (
                    <option value={c.id} key={c.id}>
                      {c.name} · {c.subject}
                    </option>
                  ))}
                </select>
                <ChevronDown size={13} />
              </label>
            )}
            <div className="profile">
              <button
                className="profile-avatar-button"
                aria-label="Đổi avatar"
                aria-haspopup="dialog"
                onClick={() => setAccountDialog("avatar")}
              >
                <Avatar name={user.name} avatarId={user.avatarId} />
              </button>
              <div>
                <strong>{user.name}</strong>
                <small>{isTeacher ? "Giáo viên" : "Học sinh"}</small>
              </div>
            </div>
          </div>
        </header>
        <main className="main-content">
          {!isTeacher && (
            <ExamNotices
              key={user.id}
              inLearning={
                (page === "learning" || page === "online-exams") && !study
              }
              onJoin={async (classroomId, runId) => {
                if (
                  !classes.some((classroom) => classroom.id === classroomId)
                ) {
                  const updated = await api<Classroom[]>("/classrooms");
                  if (
                    !updated.some((classroom) => classroom.id === classroomId)
                  )
                    throw new Error(
                      "Bạn không còn trong lớp của buổi kiểm tra này.",
                    );
                  setClasses(updated);
                }
                location.hash = new URLSearchParams({
                  learning: classroomId,
                  exam: runId,
                  workspace: "online",
                }).toString();
                setClassId(classroomId);
                navigate("online-exams");
                setEntryRunId(runId);
                setEntryClassId(classroomId);
              }}
            />
          )}
          {notice && (
            <div className="toast" role="status">
              <CheckCircle2 size={18} />
              {notice}
              <button
                className="icon-button"
                aria-label="Đóng thông báo"
                onClick={() => setNotice("")}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {error && (
            <div className="error-banner" role="alert">
              {error}
              <button onClick={() => void reload()}>Thử lại</button>
            </div>
          )}
          {study ? (
            <Practice
              key={`${study.chapter.id}-${study.mode}-${study.questionId ?? ""}-${study.lesson ?? ""}-${study.reviewId ?? ""}`}
              {...study}
              onProgress={refresh}
              onFinish={() => {
                setStudy(null);
                refresh();
              }}
            />
          ) : page === "settings" ? (
            <>
              <PageHeading
                eyebrow="GÓC RIÊNG CỦA BẠN"
                title="Tài khoản & bảo mật"
                text="Giữ tài khoản an toàn để hành trình học tập luôn được lưu lại."
              />
              <div className="card settings-card">
                <h2>Thông tin tài khoản</h2>
                <div className="account-info">
                  <button
                    type="button"
                    className="profile-avatar-button account-avatar-button"
                    aria-label="Đổi ảnh đại diện"
                    aria-haspopup="dialog"
                    onClick={() => setAccountDialog("avatar")}
                  >
                    <Avatar
                      name={user.name}
                      avatarId={user.avatarId}
                      className="large"
                    />
                  </button>
                  <div className="account-details">
                    <strong>{user.name}</strong>
                    <p>{user.email}</p>
                    <span className="pill">
                      {isTeacher ? "Giáo viên" : "Học sinh"}
                    </span>
                  </div>
                </div>
                <div className="account-settings-actions">
                  <button
                    type="button"
                    className="button outline"
                    aria-haspopup="dialog"
                    onClick={() => setAccountDialog("avatar")}
                  >
                    <Sprout size={18} />
                    Đổi avatar
                  </button>
                  <button
                    type="button"
                    className="button outline"
                    aria-haspopup="dialog"
                    onClick={() => setAccountDialog("password")}
                  >
                    <ShieldCheck size={18} />
                    Đổi mật khẩu
                  </button>
                </div>
              </div>
              {!isTeacher && current && (
                <StudentLevelCard classroom={current} />
              )}
            </>
          ) : loadingClasses ? (
            <div className="loading-panel">Đang tải lớp học…</div>
          ) : !current ? (
            <>
              <PageHeading
                eyebrow="CHÀO MỪNG ĐẾN GREENEDU"
                title={`Xin chào, ${user.name}!`}
                text="Một hành trình mới đang chờ bạn."
              />
              <Empty
                title={
                  isTeacher
                    ? "Bắt đầu với lớp học đầu tiên"
                    : "Bạn chưa được thêm vào lớp học"
                }
                text={
                  isTeacher
                    ? "Tạo lớp, thêm chương và câu hỏi để cùng học sinh bắt đầu."
                    : "Nhờ giáo viên thêm tài khoản của bạn vào lớp học."
                }
                action={
                  isTeacher ? (
                    <button
                      className="button primary"
                      onClick={() => setEditor("class")}
                    >
                      <Plus size={17} />
                      Tạo lớp học
                    </button>
                  ) : undefined
                }
              />
            </>
          ) : (
            <>
              {page === "feedback" && (
                <Feedback key={current.id} classroom={current} user={user} />
              )}
              {page === "home" &&
                (isTeacher ? (
                  <TeacherHome
                    classroom={current}
                    revision={revision}
                    onPage={navigate}
                    onEditor={setEditor}
                  />
                ) : (
                  <div className="student-home">
                    <PageHeading
                      eyebrow="HỌC MỘT CHÚT · LỚN MỘT CHÚT"
                      title={`Chào ${user.name.split(" ").slice(-2).join(" ")}, hôm nay mình học gì?`}
                      text="Khu vườn nhỏ đang lớn lên từ những cố gắng của bạn."
                    />
                    <div className="garden-welcome-grid">
                      <div className="garden-hero">
                        <div className="hero-copy">
                          <span className="pill hero-pill">
                            <Leaf size={14} />
                            KHU VƯỜN KIẾN THỨC
                          </span>
                          <h2>
                            Gieo nỗ lực hôm nay,
                            <br />
                            đón tri thức ngày mai.
                          </h2>
                          <p>
                            {totalSeconds
                              ? `Bạn đã dành ${duration(totalSeconds)} để chăm khu vườn ${current.subject}. Tiếp tục hành trình của mình nhé.`
                              : "Khu vườn đang chờ những hạt mầm đầu tiên. Bắt đầu một bài luyện tập để thấy mình tiến bộ mỗi ngày."}
                          </p>
                          <div className="garden-hero-actions">
                            <button
                              className="button primary"
                              onClick={() => navigate("practice")}
                            >
                              Tiếp tục luyện tập
                              <ArrowRight size={18} />
                            </button>
                            <button
                              className="button outline"
                              onClick={() => navigate("progress")}
                            >
                              <TrendingUp size={17} /> Xem hành trình
                            </button>
                          </div>
                        </div>
                        <GardenIllustration className="hero-illustration" />
                      </div>
                      <GardenGoal
                        classroom={current}
                        onPractice={() => navigate("practice")}
                      />
                    </div>
                    <StudentStats
                      classroom={current}
                      onCorrections={() => navigate("corrections")}
                    />
                    <SectionTitle
                      title="Những mầm xanh của bạn"
                      description={`${current.subject} · ${current.name}`}
                      action={
                        <LinkButton onClick={() => navigate("practice")}>
                          Xem bài luyện tập
                        </LinkButton>
                      }
                    />
                    <ChapterGrid
                      classroom={current}
                      onStudy={(ch, lesson) =>
                        setStudy({ chapter: ch, mode: "practice", lesson })
                      }
                    />
                    <StudentLevelCard classroom={current} />
                  </div>
                ))}
              {(page === "learning" || page === "online-exams") && (
                <Learning
                  key={`${current.id}-${page}`}
                  view={page === "online-exams" ? "online" : "learning"}
                  onOnline={() => navigate("online-exams")}
                  classroom={current}
                  user={user}
                  entryRunId={
                    entryClassId === current.id ? entryRunId : undefined
                  }
                  onExamExit={() => setEntryRunId("")}
                  onSettingsChanged={refresh}
                  onCorrections={(chapterId) =>
                    navigate("corrections", chapterId)
                  }
                  onReview={(reviewId, chapter) =>
                    setStudy({ chapter, mode: "practice", reviewId })
                  }
                />
              )}
              {page === "practice" && (
                <>
                  <PageHeading
                    eyebrow="CHĂM CÂY BẰNG KIẾN THỨC"
                    title="Hôm nay bạn muốn học gì?"
                    text="Chọn một chương và luyện tập theo nhịp của riêng mình."
                  />
                  <ChapterGrid
                    classroom={current}
                    onStudy={(ch, lesson) =>
                      setStudy({ chapter: ch, mode: "practice", lesson })
                    }
                  />
                  <div className="info-panel">
                    <Clock3 size={20} />
                    <p>
                      Thời gian được ghi nhận khi trang hiển thị và bạn có tương
                      tác. Sau 2 phút không tương tác, ứng dụng nhắc bạn tiếp
                      tục trước khi tạm dừng tính giờ.
                    </p>
                  </div>
                </>
              )}
              {page === "corrections" && (
                <Corrections
                  classes={classes}
                  revision={revision}
                  onStudy={setStudy}
                  chapterId={correctionChapterId}
                  onChapterChange={setCorrectionChapterId}
                />
              )}
              {page === "classes" && (
                <>
                  <PageHeading
                    eyebrow="CÙNG NHAU GIEO TRI THỨC"
                    title="Lớp học của tôi"
                    text="Tổ chức lớp, thêm học sinh và chuẩn bị hành trình học tập."
                    action={
                      <button
                        className="button primary"
                        onClick={() => setEditor("class")}
                      >
                        <Plus size={18} />
                        Tạo lớp mới
                      </button>
                    }
                  />
                  <div className="class-cards">
                    {classes.map((c) => (
                      <button
                        key={c.id}
                        className={`card class-card ${c.id === current.id ? "selected" : ""}`}
                        onClick={() => setClassId(c.id)}
                      >
                        <ForestIcon className="class-icon">
                          <Users size={25} />
                        </ForestIcon>
                        <h3>{c.name}</h3>
                        <p>
                          {c.subject} · Khối {c.grade}
                        </p>
                        <span>
                          {c.studentCount} học sinh <span>·</span>{" "}
                          {c.chapters.length} chương
                        </span>
                        {c.id === current.id && (
                          <span className="pill">Đang chọn</span>
                        )}
                      </button>
                    ))}
                  </div>
                  <SectionTitle
                    title={`Chương học · ${current.name}`}
                    action={
                      <button
                        className="button outline small"
                        onClick={() => setEditor("chapter")}
                      >
                        <Plus size={16} />
                        Thêm chương
                      </button>
                    }
                  />
                  <div className="chapter-list">
                    {current.chapters.length ? (
                      current.chapters.map((ch, i) => (
                        <div className="card chapter-row" key={ch.id}>
                          <span className="chapter-index">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <div>
                            <h3>{ch.title}</h3>
                            <p>
                              {ch.lessons.length} bài · {ch.questionCount} câu
                              hỏi
                            </p>
                            <Lessons
                              chapter={ch}
                              onChange={async () => {
                                await reload();
                                setRevision((value) => value + 1);
                              }}
                            />
                          </div>
                          <LinkButton
                            onClick={() => {
                              setQuestionChapter(ch.id);
                              navigate("questions");
                            }}
                          >
                            Quản lý câu hỏi
                          </LinkButton>
                        </div>
                      ))
                    ) : (
                      <Empty
                        title="Thêm chương học đầu tiên"
                        text="Chia nội dung thành các chương để tổ chức câu hỏi và theo dõi tiến độ."
                      />
                    )}
                  </div>
                  <Roster
                    classroom={current}
                    revision={revision}
                    onAdd={() => setEditor("student")}
                    onReset={(s) => setEditor({ student: s })}
                  />
                </>
              )}
              {page === "questions" && (
                <>
                  <PageHeading
                    eyebrow="NỀN TẢNG CỦA MỖI BÀI HỌC"
                    title="Ngân hàng câu hỏi"
                    text="Câu hỏi rõ ràng và lời giải tốt giúp học sinh tự học hiệu quả hơn."
                    action={
                      <button
                        className="button primary"
                        disabled={!current.chapters.length}
                        onClick={() => setEditor("question")}
                      >
                        <Plus size={18} />
                        Thêm câu hỏi
                      </button>
                    }
                  />
                  {current.chapters.length ? (
                    <>
                      <div className="filter-bar">
                        <label>
                          Chương học
                          <select
                            aria-label="Chương câu hỏi"
                            value={questionChapter || current.chapters[0]?.id}
                            onChange={(e) => setQuestionChapter(e.target.value)}
                          >
                            {current.chapters.map((ch) => (
                              <option key={ch.id} value={ch.id}>
                                {ch.title}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Bài học
                          <select
                            aria-label="Lọc theo bài học"
                            value={questionLesson}
                            onChange={(e) => setQuestionLesson(e.target.value)}
                          >
                            <option value="">Tất cả bài học</option>
                            {(
                              current.chapters.find(
                                (ch) => ch.id === questionChapter,
                              ) ?? current.chapters[0]
                            ).lessons.map((l) => (
                              <option key={l.title} value={l.title}>
                                {l.title}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <QuestionBank
                        deleteSupported={
                          !!(
                            current.chapters.find(
                              (ch) => ch.id === questionChapter,
                            ) ?? current.chapters[0]
                          ).canDeleteQuestions
                        }
                        lessonSupported={
                          !!(
                            current.chapters.find(
                              (ch) => ch.id === questionChapter,
                            ) ?? current.chapters[0]
                          ).canManageLessons
                        }
                        topicSupported={
                          !!(
                            current.chapters.find(
                              (ch) => ch.id === questionChapter,
                            ) ?? current.chapters[0]
                          ).canTagQuestions
                        }
                        key={questionChapter || current.chapters[0].id}
                        chapterId={questionChapter || current.chapters[0].id}
                        lesson={questionLesson}
                        lessonTitles={(
                          current.chapters.find(
                            (ch) => ch.id === questionChapter,
                          ) ?? current.chapters[0]
                        ).lessons.map((l) => l.title)}
                        revision={revision}
                        onChange={() => {
                          setQuestionLesson("");
                          refresh();
                        }}
                      />
                    </>
                  ) : (
                    <Empty
                      title="Cần thêm chương học"
                      text="Tạo chương trước khi thêm câu hỏi."
                      action={
                        <button
                          className="button primary"
                          onClick={() => setEditor("chapter")}
                        >
                          <Plus size={16} />
                          Thêm chương
                        </button>
                      }
                    />
                  )}
                </>
              )}
              {page === "groups" && (
                <GroupActivities
                  key={current.id}
                  classroom={current}
                  user={user}
                />
              )}
              {(page === "garden" || page === "leaderboard") && (
                <ClassCommunity
                  key={`${current.id}-${page}`}
                  classroom={current}
                  page={page}
                  revision={revision}
                  userId={user.id}
                  teacherAvatarId={isTeacher ? user.avatarId : undefined}
                />
              )}
              {page === "progress" &&
                (isTeacher ? (
                  <>
                    <PageHeading
                      eyebrow="NHÌN THẤY NỖ LỰC, HỖ TRỢ ĐÚNG LÚC"
                      title="Tiến độ học tập"
                      text="Theo dõi thời gian có hoạt động, kết quả luyện tập và các câu cần sửa."
                    />
                    <Roster
                      classroom={current}
                      revision={revision}
                      onAdd={() => setEditor("student")}
                      onReset={(s) => setEditor({ student: s })}
                    />
                  </>
                ) : (
                  <>
                    <PageHeading
                      eyebrow="TỪNG BƯỚC ĐỀU ĐÁNG GHI NHẬN"
                      title="Hành trình của tôi"
                      text="Không so sánh với người khác. Hãy nhìn những điều bạn đã học được."
                    />
                    <StudentStats classroom={current} />
                    <SectionTitle
                      title="Tiến độ theo chương"
                      description={`Mỗi ${current.levelMinutes ?? 60} phút học có hoạt động trong chương tăng một cấp, tối đa cấp 5.`}
                    />
                    <div className="card progress-table">
                      {current.chapters.map((ch) => (
                        <article className="chapter-level-card" key={ch.id}>
                          <h3>{ch.title}</h3>
                          <ChapterLevelTimeline chapter={ch} />
                        </article>
                      ))}
                    </div>
                  </>
                ))}
            </>
          )}
          <footer className="page-footer">
            <span>
              <Sprout size={15} />
              GreenEdu · Cùng bạn nuôi dưỡng tri thức
            </span>
            <span>
              {demo
                ? "Trang trải nghiệm · Dữ liệu mẫu"
                : "Mỗi ngày, một bước tiến"}
            </span>
          </footer>
        </main>
      </div>
      {accountDialog && (
        <Modal
          title={accountDialog === "avatar" ? "Đổi avatar" : "Đổi mật khẩu"}
          className={
            accountDialog === "avatar" ? "avatar-dialog" : "password-dialog"
          }
          onClose={closeAccountDialog}
        >
          {accountDialog === "avatar" ? (
            <AvatarPicker user={user} onUpdate={setUser} />
          ) : (
            <PasswordForm
              onUpdate={(updated) => {
                setUser(updated);
                setNotice("Đã đổi mật khẩu.");
                closeAccountDialog();
              }}
            />
          )}
        </Modal>
      )}
      {editor && (
        <Modal
          title={
            editor === "class"
              ? "Tạo lớp học"
              : editor === "chapter"
                ? "Thêm chương học"
                : editor === "student"
                  ? "Thêm học sinh"
                  : editor === "question"
                    ? "Thêm câu hỏi"
                    : "Cấp lại mật khẩu"
          }
          onClose={closeEditor}
        >
          <EditorForm
            editor={editor}
            classroom={current}
            chapterId={questionChapter}
            onSave={saveEditor}
          />
        </Modal>
      )}
    </div>
  );
}

function PageHeading({
  eyebrow,
  title,
  text,
  action,
}: {
  eyebrow: string;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        <span className="eyebrow">{eyebrow}</span>
        <p>{text}</p>
      </div>
      {action}
    </div>
  );
}
function Login({
  demo,
  quickLogin,
  quickAccounts,
  onLogin,
  notice,
}: {
  demo: boolean;
  quickLogin: boolean;
  quickAccounts: QuickAccount[];
  onLogin: (user: User) => void;
  notice: string;
}) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function enterDefault(role: QuickAccount["role"]) {
    setBusy(true);
    setError("");
    try {
      onLogin(await api<User>("/auth/quick-login", { role }));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function login(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      onLogin(
        await api<User>("/auth/login", { email: loginEmail(email), password }),
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login-page">
      <section className="login-story">
        <Logo school />
        <div className="login-story-content">
          <span className="eyebrow">MỖI NỖ LỰC LÀ MỘT HẠT MẦM</span>
          <h1>
            Kiến thức lớn lên.
            <br />
            Bạn cũng vậy.
          </h1>
          <p>
            Một nơi để học, để thử, để sửa sai.
            <br />
            Và để thấy mình tốt hơn mỗi ngày.
          </p>
          <GardenIllustration className="login-illustration" />
          <div className="story-caption">
            <Leaf size={17} />
            Gieo tri thức, gặt tương lai
          </div>
        </div>
        <span className="login-copyright">GREENEDU · TRANG HỌC TẬP XANH</span>
      </section>
      <section className="login-form-side">
        <div className="login-form-wrap">
          <span className="pill">
            <Sprout size={15} />
            Chào mừng trở lại
          </span>
          <h2>Mở khu vườn của bạn</h2>
          <p>Đăng nhập để tiếp tục hành trình học tập.</p>
          {notice && (
            <div className="info-panel" role="status">
              {notice}
            </div>
          )}
          <form onSubmit={(e) => void login(e)}>
            <label>
              Email
              <input
                required
                type="text"
                inputMode="email"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="Tên tài khoản hoặc email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              Mật khẩu
              <input
                required
                type="password"
                minLength={8}
                maxLength={128}
                autoComplete="current-password"
                placeholder="Nhập mật khẩu của bạn"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {error && (
              <div className="error-banner" role="alert">
                {error}
              </div>
            )}
            <button className="button primary full" disabled={busy}>
              {busy ? "Đang đăng nhập…" : "Đăng nhập"}
              <ArrowRight size={18} />
            </button>
          </form>
          <p className="forgot-hint">
            <ShieldCheck size={16} />
            Liên hệ giáo viên chủ nhiệm để cấp lại.
          </p>
          {quickLogin && (
            <div className="quick-login-box">
              <strong>Vào nhanh khu vườn</strong>
              <p>Chọn tài khoản mặc định để tiếp tục.</p>
              <div className="quick-login-options">
                {(["teacher", "student"] as const).map((role) => {
                  const account = quickAccounts.find((a) => a.role === role);
                  const label = role === "teacher" ? "Giáo viên" : "Học sinh";
                  return (
                    <button
                      className="quick-login-option"
                      type="button"
                      key={role}
                      aria-label={`Vào nhanh ${label}`}
                      disabled={busy || !account}
                      onClick={() => void enterDefault(role)}
                    >
                      {role === "teacher" ? (
                        <Users size={21} />
                      ) : (
                        <Sprout size={21} />
                      )}
                      <span>
                        <strong>{label}</strong>
                        <small>{account?.name ?? "Chưa có tài khoản"}</small>
                      </span>
                      <ArrowRight size={17} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {demo && !quickLogin && (
            <div className="demo-box">
              <strong>Khám phá bản MVP</strong>
              <p>Chọn vai trò để điền tài khoản mẫu, sau đó đăng nhập.</p>
              <div>
                <button
                  className="button outline small"
                  type="button"
                  onClick={() => {
                    setEmail("hocsinh@greenedu.nk");
                    setPassword("GreenEdu123!");
                    setError("");
                  }}
                >
                  <Sprout size={16} />
                  Học sinh
                </button>
                <button
                  className="button outline small"
                  type="button"
                  onClick={() => {
                    setEmail("giaovien@greenedu.nk");
                    setPassword("GreenEdu123!");
                    setError("");
                  }}
                >
                  <Users size={16} />
                  Giáo viên
                </button>
              </div>
            </div>
          )}
        </div>
        <span className="login-bottom">
          Học theo nhịp của bạn. Tiến bộ theo cách của bạn.
        </span>
      </section>
    </div>
  );
}
function StudentStats({
  classroom,
  onCorrections,
}: {
  classroom: Classroom;
  onCorrections?: () => void;
}) {
  const seconds = classroom.chapters.reduce((n, c) => n + c.seconds, 0),
    total = classroom.chapters.reduce((n, c) => n + c.total, 0),
    correct = classroom.chapters.reduce((n, c) => n + c.correct, 0),
    open = classroom.chapters.reduce((n, c) => n + c.openCorrections, 0);
  return (
    <div className="stats-grid student-stats">
      <Stat
        icon={<Clock3 size={21} />}
        label="Thời gian học"
        value={duration(seconds)}
        note="Có hoạt động trên ứng dụng"
      />
      <Stat
        icon={<CheckCircle2 size={21} />}
        label="Tỷ lệ trả lời đúng"
        value={total ? `${Math.round((correct / total) * 100)}%` : "—"}
        note={
          total
            ? `${correct}/${total} lượt luyện tập đúng`
            : "Bắt đầu học để có kết quả"
        }
        color="blue"
      />
      <Stat
        icon={<BookOpen size={21} />}
        label="Câu cần sửa sai"
        value={String(open)}
        note="Mỗi lỗi sai là một cơ hội"
        color="amber"
      >
        {onCorrections && (
          <div className="stat-correction-details">
            <strong>Sai một câu, hiểu thêm một điều.</strong>
            <p>
              {open
                ? "Cùng biến lỗi sai trong sổ tay thành kiến thức nhé."
                : "Các câu chưa đúng sẽ được lưu vào sổ tay để bạn có thể quay lại và làm tốt hơn."}
            </p>
            <LinkButton onClick={onCorrections}>Mở sổ tay</LinkButton>
          </div>
        )}
      </Stat>
    </div>
  );
}
function Stat({
  icon,
  label,
  value,
  note,
  color = "green",
  children,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  note: string;
  color?: string;
  children?: ReactNode;
}) {
  return (
    <div className="stat-card card">
      <ForestIcon className={`stat-icon ${color}`}>{icon}</ForestIcon>
      <span className="stat-label">{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
      {children}
    </div>
  );
}
function ChapterGrid({
  classroom,
  onStudy,
}: {
  classroom: Classroom;
  onStudy: (ch: Chapter, lesson?: string) => void;
}) {
  const [selectedLessons, setSelectedLessons] = useState<
    Record<string, string>
  >({});
  if (!classroom.chapters.length)
    return (
      <Empty
        title="Những hạt mầm đang được chuẩn bị"
        text="Giáo viên sẽ thêm chương học và câu hỏi để bạn bắt đầu."
      />
    );
  return (
    <div className="chapter-grid">
      {classroom.chapters.map((ch, i) => (
        <article className="chapter-card card" key={ch.id}>
          <div className={`chapter-art art-${i % 3}`}>
            <span className="garden-chapter-number" aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="pill chapter-level">
              Cấp {ch.level} · {stages[ch.level - 1]}
            </span>
            <StudentLevelIcon level={ch.level} />
          </div>
          <div className="chapter-body">
            <span className="eyebrow">{classroom.subject.toUpperCase()}</span>
            <h3>{ch.title}</h3>
            <div className="chapter-meta">
              <span>
                <Clock3 size={14} />
                {duration(ch.seconds)}
              </span>
              <span>
                <BookOpen size={14} />
                {ch.questionCount} câu hỏi
              </span>
            </div>
            <div className="progress-track">
              <span
                style={{
                  width: `${Math.min(100, (ch.seconds / (4 * (ch.levelMinutes ?? 60) * 60)) * 100)}%`,
                }}
              />
            </div>
            <div className="chapter-progress">
              <span>
                {ch.level === 5
                  ? "Cây đã ra hoa!"
                  : `Còn ${duration(ch.level * (ch.levelMinutes ?? 60) * 60 - ch.seconds)} đến cấp ${ch.level + 1}`}
              </span>
              <strong>
                {Math.round(
                  Math.min(
                    100,
                    (ch.seconds / (4 * (ch.levelMinutes ?? 60) * 60)) * 100,
                  ),
                )}
                %
              </strong>
            </div>
            {ch.lessons.length > 0 && (
              <select
                className="lesson-select"
                aria-label={`Luyện tập theo bài · ${ch.title}`}
                value={selectedLessons[ch.id] ?? ""}
                onChange={(e) =>
                  setSelectedLessons((previous) => ({
                    ...previous,
                    [ch.id]: e.target.value,
                  }))
                }
              >
                <option value="">Luyện tập toàn chương</option>
                {ch.lessons.map((l) => (
                  <option key={l.title} value={l.title}>
                    {l.title} · {l.questionCount} câu
                  </option>
                ))}
              </select>
            )}
            <button
              className="button outline full"
              disabled={
                !ch.questionCount ||
                (!!selectedLessons[ch.id] &&
                  !ch.lessons.find((l) => l.title === selectedLessons[ch.id])
                    ?.questionCount)
              }
              onClick={() => onStudy(ch, selectedLessons[ch.id] || undefined)}
            >
              {ch.questionCount ? "Chăm cây · Luyện tập" : "Đang chờ câu hỏi"}
              <ArrowRight size={17} />
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
function TeacherHome({
  classroom,
  revision,
  onPage,
  onEditor,
}: {
  classroom: Classroom;
  revision: number;
  onPage: (p: Page) => void;
  onEditor: (e: Editor) => void;
}) {
  const [students, setStudents] = useState<Student[]>([]),
    [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    setError("");
    setStudents([]);
    api<Student[]>(`/classrooms/${classroom.id}/students`)
      .then((s) => {
        if (alive) setStudents(s);
      })
      .catch((e) => {
        if (alive) setError(errorMessage(e));
      });
    return () => {
      alive = false;
    };
  }, [classroom.id, revision]);
  const total = students.reduce((n, s) => n + s.total, 0),
    correct = students.reduce((n, s) => n + s.correct, 0);
  return (
    <>
      <PageHeading
        eyebrow="CÙNG HỌC SINH GIEO NHỮNG MẦM XANH"
        title="Một lớp học, nhiều cơ hội lớn lên."
        text={`${classroom.name} · ${classroom.subject} · Giáo viên ${classroom.teacherName}`}
      />
      <div className="teacher-hero garden-hero">
        <div className="hero-copy">
          <span className="pill hero-pill">
            <Users size={14} />
            TRANG GIÁO VIÊN
          </span>
          <h2>
            Bài học tốt bắt đầu
            <br />
            từ sự quan tâm.
          </h2>
          <p>
            Chuẩn bị câu hỏi, nhìn thấy nỗ lực và giúp học sinh vượt qua từng
            lỗi sai.
          </p>
          <button
            className="button primary"
            onClick={() => onPage("questions")}
          >
            Chuẩn bị bài luyện tập
            <ArrowRight size={18} />
          </button>
        </div>
        <GardenIllustration className="hero-illustration" />
      </div>
      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}
      <div className="stats-grid">
        <Stat
          icon={<Users size={21} />}
          label="Học sinh"
          value={String(classroom.studentCount)}
          note="Thành viên trong lớp"
        />
        <Stat
          icon={<BookOpen size={21} />}
          label="Câu hỏi"
          value={String(
            classroom.chapters.reduce((n, c) => n + c.questionCount, 0),
          )}
          note={`${classroom.chapters.length} chương học`}
          color="blue"
        />
        <Stat
          icon={<CheckCircle2 size={21} />}
          label="Tỷ lệ đúng của lớp"
          value={total ? `${Math.round((correct / total) * 100)}%` : "—"}
          note={`${total} lượt luyện tập`}
          color="amber"
        />
        <Stat
          icon={<Flower2 size={21} />}
          label="Cây đã ra hoa"
          value={String(students.reduce((n, s) => n + s.trees, 0))}
          note="Nỗ lực chung của cả lớp"
          color="rose"
        />
      </div>
      <SectionTitle
        title="Chuẩn bị cho buổi học"
        description="Ba việc nhỏ để bắt đầu một hành trình lớn."
      />
      <div className="quick-actions">
        <button className="card" onClick={() => onEditor("student")}>
          <ForestIcon className="stat-icon green">
            <Users size={22} />
          </ForestIcon>
          <h3>Thêm học sinh</h3>
          <p>Tạo tài khoản và đưa học sinh vào lớp.</p>
          <ArrowRight size={18} />
        </button>
        <button className="card" onClick={() => onEditor("chapter")}>
          <ForestIcon className="stat-icon blue">
            <BookOpen size={22} />
          </ForestIcon>
          <h3>Tạo chương học</h3>
          <p>Tổ chức kiến thức theo từng chặng.</p>
          <ArrowRight size={18} />
        </button>
        <button className="card" onClick={() => onPage("progress")}>
          <ForestIcon className="stat-icon amber">
            <TrendingUp size={22} />
          </ForestIcon>
          <h3>Xem tiến độ</h3>
          <p>Tìm những học sinh cần hỗ trợ thêm.</p>
          <ArrowRight size={18} />
        </button>
      </div>
    </>
  );
}

function Corrections({
  classes,
  revision,
  onStudy,
  chapterId,
  onChapterChange,
}: {
  classes: Classroom[];
  revision: number;
  onStudy: (s: Study) => void;
  chapterId: string;
  onChapterChange: (id: string) => void;
}) {
  const [rows, setRows] = useState<
      (Question & { chapterTitle: string; className: string })[]
    >([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    api<typeof rows>("/corrections")
      .then((r) => {
        if (alive) setRows(r);
      })
      .catch((e) => {
        if (alive) setError(errorMessage(e));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [revision, retry]);
  const filteredRows = chapterId
    ? rows.filter((q) => q.chapterId === chapterId)
    : rows;
  return (
    <>
      <PageHeading
        eyebrow="BIẾN LỖI SAI THÀNH KIẾN THỨC"
        title="Sổ tay sửa sai"
        text="Một câu chưa đúng không phải điểm kết thúc. Đó là nơi để bắt đầu hiểu sâu hơn."
      />
      <div className="correction-filter">
        <label>
          Chương cần sửa
          <select
            value={chapterId}
            onChange={(e) => onChapterChange(e.target.value)}
          >
            <option value="">Tất cả chương</option>
            {classes.map((classroom) => (
              <optgroup
                key={classroom.id}
                label={`${classroom.name} · ${classroom.subject}`}
              >
                {classroom.chapters.map((chapter) => (
                  <option key={chapter.id} value={chapter.id}>
                    {chapter.title}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
      </div>
      {error ? (
        <div className="error-banner" role="alert">
          {error}
          <button onClick={() => setRetry((n) => n + 1)}>Thử lại</button>
        </div>
      ) : loading ? (
        <div className="loading-panel">Đang mở sổ tay…</div>
      ) : !filteredRows.length ? (
        <Empty
          title={
            chapterId
              ? "Chương này đã sạch lỗi sai"
              : "Sổ tay đang sạch những lỗi sai"
          }
          text="Khi bạn trả lời chưa đúng, câu hỏi sẽ tự động được lưu ở đây. Làm đúng trong sổ tay để đánh dấu đã khắc phục."
        />
      ) : (
        <>
          <div className="info-panel">
            <BookOpen size={21} />
            <p>
              Bạn có <strong>{filteredRows.length} câu</strong> cần làm lại. Các
              câu sẽ được đánh dấu đã khắc phục khi bạn trả lời đúng trong sổ
              tay.
            </p>
          </div>
          <div className="correction-list">
            {filteredRows.map((q, i) => (
              <div className="card correction-card" key={q.id}>
                <span className="chapter-index">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <span className="eyebrow">
                    {q.className} · {q.chapterTitle}
                  </span>
                  <h3>{q.text}</h3>
                  <span className="pill amber">Cần ôn lại</span>
                </div>
                <button
                  className="button outline small"
                  onClick={() => {
                    const chapter = classes
                      .flatMap((c) => c.chapters)
                      .find((c) => c.id === q.chapterId);
                    if (chapter)
                      onStudy({
                        chapter,
                        mode: "correction",
                        questionId: q.id,
                      });
                  }}
                >
                  Làm lại
                  <ArrowRight size={16} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
function Roster({
  classroom,
  revision,
  onAdd,
  onReset,
}: {
  classroom: Classroom;
  revision: number;
  onAdd: () => void;
  onReset: (s: Student) => void;
}) {
  const [rows, setRows] = useState<Student[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [search, setSearch] = useState(""),
    [retry, setRetry] = useState(0),
    [exporting, setExporting] = useState(false);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    api<Student[]>(`/classrooms/${classroom.id}/students`)
      .then((r) => {
        if (alive) setRows(r);
      })
      .catch((e) => {
        if (alive) setError(errorMessage(e));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [classroom.id, revision, retry]);
  async function exportCsv() {
    setExporting(true);
    setError("");
    try {
      const response = await fetch(`/api/classrooms/${classroom.id}/export`);
      if (!response.ok)
        throw new Error(
          "Không xuất được dữ liệu. Kiểm tra phiên đăng nhập và thử lại.",
        );
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = "greenedu-tien-do.csv";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setExporting(false);
    }
  }
  const filtered = rows.filter((s) =>
    `${s.name} ${s.email}`
      .toLocaleLowerCase("vi")
      .includes(search.toLocaleLowerCase("vi")),
  );
  return (
    <>
      <SectionTitle
        title={`Học sinh · ${classroom.name}`}
        description="Tỷ lệ đúng tính từ lượt luyện tập; các lượt sửa sai được theo dõi riêng."
        action={
          <div className="button-group">
            <button
              className="button outline small"
              disabled={exporting}
              onClick={() => void exportCsv()}
            >
              <Download size={16} />
              {exporting ? "Đang xuất…" : "Xuất CSV"}
            </button>
            <button className="button primary small" onClick={onAdd}>
              <Plus size={16} />
              Thêm học sinh
            </button>
          </div>
        }
      />
      <div className="card roster-card">
        <label className="search-input">
          <Search size={18} />
          <input
            aria-label="Tìm học sinh"
            placeholder="Tìm theo tên hoặc email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        {error ? (
          <div className="error-banner" role="alert">
            {error}
            <button onClick={() => setRetry((n) => n + 1)}>Thử lại</button>
          </div>
        ) : loading ? (
          <div className="loading-panel">Đang tải tiến độ…</div>
        ) : rows.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Học sinh</th>
                  <th>Thời gian học</th>
                  <th>Lượt luyện tập</th>
                  <th>Tỷ lệ đúng</th>
                  <th>Câu cần sửa</th>
                  <th>Tài khoản</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="student-cell">
                        <Avatar name={s.name} avatarId={s.avatarId} />
                        <div>
                          <strong>{s.name}</strong>
                          <small>{s.email}</small>
                          {s.chapterLevels?.map((ch) => (
                            <div
                              key={ch.chapterId}
                              className="chapter-level-member"
                            >
                              <small>{ch.chapterTitle}</small>
                              <StudentLevelBadge
                                seconds={ch.seconds}
                                levelMinutes={ch.levelMinutes}
                                scope={ch.chapterTitle}
                                compact
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td>{duration(s.seconds)}</td>
                    <td>{s.total}</td>
                    <td>
                      {s.total
                        ? `${Math.round((s.correct / s.total) * 100)}%`
                        : "—"}
                    </td>
                    <td>
                      <span
                        className={`pill ${s.openCorrections ? "amber" : ""}`}
                      >
                        {s.openCorrections}
                      </span>
                    </td>
                    <td>
                      <button
                        className="text-button"
                        onClick={() => onReset(s)}
                      >
                        Cấp lại mật khẩu
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filtered.length && (
              <Empty
                title="Không tìm thấy học sinh"
                text="Thử tìm bằng tên hoặc email khác."
              />
            )}
          </div>
        ) : (
          <Empty
            title="Lớp đang chờ những thành viên đầu tiên"
            text="Thêm học sinh và cung cấp mật khẩu tạm để các em đăng nhập."
          />
        )}
      </div>
      <p className="subtle-note">
        CSV có thể mở bằng Excel. Báo cáo MVP chưa bao gồm điểm kiểm tra chính
        thức hoặc điểm thưởng.
      </p>
    </>
  );
}
function PasswordForm({ onUpdate }: { onUpdate: (u: User) => void }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(false);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget,
      data = new FormData(form);
    setError("");
    setSuccess(false);
    if (data.get("newPassword") !== data.get("confirm")) {
      setError("Hai mật khẩu mới chưa khớp.");
      return;
    }
    setBusy(true);
    try {
      const u = await api<User>("/auth/password", {
        currentPassword: data.get("currentPassword"),
        newPassword: data.get("newPassword"),
      });
      form.reset();
      setSuccess(true);
      onUpdate(u);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="password-form" onSubmit={(e) => void save(e)}>
      <label>
        Mật khẩu hiện tại
        <input
          required
          name="currentPassword"
          type="password"
          minLength={8}
          maxLength={128}
          autoComplete="current-password"
        />
      </label>
      <label>
        Mật khẩu mới
        <input
          required
          name="newPassword"
          aria-label="Mật khẩu mới"
          type="password"
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
        />
        <small>Tối thiểu 8 ký tự. Không dùng lại mật khẩu tạm.</small>
      </label>
      <label>
        Nhập lại mật khẩu mới
        <input
          required
          name="confirm"
          type="password"
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
        />
      </label>
      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="success-banner" role="status">
          Mật khẩu đã được cập nhật.
        </div>
      )}
      <button className="button primary" disabled={busy}>
        {busy ? "Đang lưu…" : "Lưu mật khẩu"}
        <ShieldCheck size={17} />
      </button>
    </form>
  );
}
function EditorForm({
  editor,
  classroom,
  chapterId,
  onSave,
}: {
  editor: NonNullable<Editor>;
  classroom?: Classroom;
  chapterId: string;
  onSave: (e: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  const [accountMode, setAccountMode] = useState("new");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSave(e);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={(e) => void submit(e)}>
      {editor === "class" && (
        <>
          <p className="form-intro">
            Tạo không gian học tập riêng cho lớp của bạn.
          </p>
          <label>
            Tên lớp
            <input
              name="name"
              required
              maxLength={80}
              placeholder="Ví dụ: Lớp 10A2"
            />
          </label>
          <div className="form-grid">
            <label>
              Môn học
              <input
                name="subject"
                required
                maxLength={80}
                placeholder="Ví dụ: Vật lý"
              />
            </label>
            <label>
              Khối lớp
              <input
                name="grade"
                required
                maxLength={20}
                placeholder="Ví dụ: 10"
              />
            </label>
          </div>
        </>
      )}
      {editor === "chapter" && (
        <>
          <p className="form-intro">
            Chương mới thuộc {classroom?.name} · {classroom?.subject}.
          </p>
          <label>
            Tên chương
            <input
              name="title"
              required
              maxLength={120}
              placeholder="Ví dụ: Chương 4 · Năng lượng"
            />
          </label>
        </>
      )}
      {editor === "student" && (
        <>
          <label>
            Loại tài khoản
            <select
              aria-label="Loại tài khoản"
              name="accountMode"
              value={accountMode}
              onChange={(e) => setAccountMode(e.target.value)}
            >
              <option value="new">Tạo tài khoản học sinh</option>
              <option value="existing">Tài khoản có sẵn</option>
            </select>
          </label>
          <p className="form-intro">
            {accountMode === "new"
              ? "Tạo tài khoản và thêm vào lớp. Học sinh cần đổi mật khẩu tạm ở lần đăng nhập đầu tiên."
              : "Nhập email tài khoản học sinh do Admin hoặc giáo viên đã tạo để thêm vào lớp này."}
          </p>
          {accountMode === "new" && (
            <label>
              Họ tên
              <input
                name="name"
                required
                maxLength={100}
                placeholder="Họ và tên học sinh"
              />
            </label>
          )}
          <label>
            Email
            <input
              name="email"
              required
              type="email"
              maxLength={254}
              placeholder="Email đăng nhập của học sinh"
            />
          </label>
          {accountMode === "new" && (
            <label>
              Mật khẩu tạm
              <input
                name="password"
                aria-label="Mật khẩu tạm"
                required
                type="password"
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
              />
              <small>Cung cấp riêng cho học sinh, tối thiểu 8 ký tự.</small>
            </label>
          )}
        </>
      )}
      {typeof editor === "object" && (
        <>
          <p className="form-intro">
            Cấp mật khẩu tạm mới cho <strong>{editor.student.name}</strong>. Các
            phiên đăng nhập hiện tại của học sinh sẽ bị thu hồi.
          </p>
          <label>
            Mật khẩu tạm mới
            <input
              name="password"
              aria-label="Mật khẩu tạm mới"
              type="password"
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
            />
            <small>Học sinh phải đổi mật khẩu sau khi đăng nhập lại.</small>
          </label>
        </>
      )}
      {editor === "question" && (
        <>
          <label>
            Chương học
            <select
              required
              name="chapterId"
              defaultValue={chapterId || classroom?.chapters[0]?.id}
            >
              {classroom?.chapters.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.title}
                </option>
              ))}
            </select>
          </label>
          <QuestionFields
            topicSupported={
              !!classroom?.chapters.some((ch) => ch.canTagQuestions)
            }
            lessons={[
              ...new Set(
                classroom?.chapters.flatMap((ch) =>
                  ch.lessons.map((lesson) => lesson.title),
                ),
              ),
            ]}
          />
        </>
      )}
      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}
      <div className="modal-actions">
        <button className="button primary" disabled={busy}>
          {busy ? "Đang lưu…" : "Lưu"}
          <CheckCircle2 size={17} />
        </button>
      </div>
    </form>
  );
}
