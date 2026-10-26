import { HomeTasks } from "./HomeTasks";
import { MotionToast } from "./MotionToast";
import { useChapterLevelUps } from "./motion";
import { StudentNotebook } from "./StudentNotebook";
import { useStudentActivity } from "./useStudentActivity";
import { StudentStudyStatistics } from "./StudentStudyStatistics";
import { ChapterSort } from "./ChapterSort";
import { ChapterDelete } from "./ChapterDelete";
import {
  lazy,
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  ArrowsDownUp,
  BookOpen,
  Books,
  ClassroomIcon,
  GraduationCap,
  Notebook,
  TreeIcon,
  UserCircle,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ClipboardList,
  Download,
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
} from "./icons";
import {
  api,
  ApiError,
  duration,
  errorMessage,
  ensureQuestionTypes,
} from "./api";
import {
  Empty,
  GardenIllustration,
  LinkButton,
  Logo,
  Modal,
  SectionTitle,
  SkipLink,
} from "./components";
import { Practice } from "./Practice";
import { Lessons } from "./Lessons";
import { ExamNotices } from "./ExamNotices";
import { ClassCommunity } from "./ClassCommunity";
import { Feedback } from "./Feedback";
import { AdminWorkspace } from "./Accounts";
import { PortraitActions } from "./PortraitActions";
import { SidebarNavigation, type NavigationItem } from "./SidebarNavigation";
import { Avatar, AvatarPicker } from "./Avatars";
import {
  ChapterLevelTimeline,
  ChapterLevelIcons,
  StudentLevelCard,
  StudentLevelIcon,
  BloomingTreeIcon,
  ChapterTitle,
} from "./StudentLevel";
import {
  STUDENT_LEVEL_NAMES,
  studentLevel,
  levelStepSeconds,
} from "../shared/student-levels";
import { GardenGoal } from "./GardenGoal";
import { searchText } from "./search";
import { GardenNote } from "./GardenNote";
import type { LearningOverview } from "../shared/learning";
import { ClassLevelSettings } from "./ClassLevelSettings";
import { WeeklyPractice } from "./WeeklyPractice";
import { flushStudyClosures } from "./session-end";
import {
  WorkspaceHeading,
  WorkspaceFrame,
  WorkspaceHeadingSlot,
} from "./WorkspaceHeading";
import { QuestionFields, readQuestionForm } from "./QuestionFields";
import type {
  Chapter,
  Classroom,
  ClassLeaderboard,
  Question,
  Student,
  User,
} from "./types";
import { WorkspaceContent, type WorkspaceTab } from "./WorkspaceTabs";
import { loginEmail } from "../shared/login-email";

const Learning = lazy(() =>
  import("./Learning").then((module) => ({ default: module.Learning })),
);
const ReviewLibrary = lazy(() =>
  import("./ReviewLibrary").then((module) => ({
    default: module.ReviewLibrary,
  })),
);
const GroupActivities = lazy(() =>
  import("./GroupActivities").then((module) => ({
    default: module.GroupActivities,
  })),
);
const QuestionBank = lazy(() =>
  import("./QuestionBank").then((module) => ({ default: module.QuestionBank })),
);

type Page =
  | "home"
  | "practice"
  | "learning"
  | "hunt"
  | "online-exams"
  | "corrections"
  | "classes"
  | "class-settings"
  | "class-chapters"
  | "class-general"
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
    new URLSearchParams(location.hash.slice(1)).get("learning") ??
      new URLSearchParams(location.hash.slice(1)).get("classroom") ??
      "",
  );
  const [page, setPage] = useState<Page>(() => {
    const params = new URLSearchParams(location.hash.slice(1));
    if (params.has("learning"))
      return params.get("workspace") === "online"
        ? "online-exams"
        : params.get("workspace") === "hunt" || params.has("exam")
          ? "hunt"
          : "learning";
    const section = params.get("section") as Page;
    if (section === "leaderboard") return "garden";
    if (section === "progress") return "home";
    return [
      "home",
      "practice",
      "learning",
      "hunt",
      "online-exams",
      "corrections",
      "classes",
      "class-settings",
      "class-chapters",
      "class-general",
      "groups",
      "progress",
      "garden",
      "leaderboard",
    ].includes(section)
      ? section
      : "home";
  });
  const isClassManagementPage = [
    "class-settings",
    "class-chapters",
    "class-general",
  ].includes(page);
  const [study, setStudy] = useState<Study | null>(null);
  useEffect(() => {
    const flush = () => {
      void flushStudyClosures();
    };
    flush();
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  }, []);
  const [entryRunId, setEntryRunId] = useState("");
  const [entryClassId, setEntryClassId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [studyExitNotice, setStudyExitNotice] = useState("");
  const [editor, setEditor] = useState<Editor>(null);
  const [deletingClass, setDeletingClass] = useState<Classroom | null>(null);
  const [deleteClassBusy, setDeleteClassBusy] = useState(false);
  const [deleteClassError, setDeleteClassError] = useState("");
  const [deleteClassName, setDeleteClassName] = useState("");
  async function deleteClass(event: FormEvent) {
    event.preventDefault();
    if (!deletingClass || deleteClassBusy) return;
    setDeleteClassBusy(true);
    setDeleteClassError("");
    try {
      await api(`/classrooms/${deletingClass.id}/delete`, {
        confirmName: deleteClassName,
      });
      setClassId("");
      setPage("classes");
      setStudy(null);
      await reload();
      setRevision((r) => r + 1);
      setDeletingClass(null);
      setNotice("Đã xóa lớp. Tài khoản học sinh được giữ nguyên.");
    } catch (err) {
      setDeleteClassError(errorMessage(err));
    } finally {
      setDeleteClassBusy(false);
    }
  }
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
  const levelUps = useChapterLevelUps(
    user?.role === "student" ? user.id : "",
    classes,
  );

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
        // An older client logged out on inactivity. Let existing accounts
        // resume normally after the new study-only exit behavior is deployed.
        localStorage.removeItem("greenedu-idle-logout");
        const signedIn = await api<User>("/auth/me");
        setUser(signedIn);
        if (signedIn.role === "teacher")
          setPage((restored) =>
            ["progress", "garden", "leaderboard"].includes(restored)
              ? "classes"
              : restored,
          );
        if (signedIn.role === "student") {
          setPage((restored) =>
            restored === "classes" ||
            restored === "class-settings" ||
            restored === "class-chapters" ||
            restored === "class-general" ||
            restored === "progress"
              ? "home"
              : restored,
          );
        }
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
  const [classLearning, setClassLearning] = useState<LearningOverview | null>(
    null,
  );
  useEffect(() => {
    if (user?.role !== "student" || user.mustChange) return;
    let alive = true,
      inFlight = false;
    const update = async () => {
      if (!alive || inFlight || document.hidden || !navigator.onLine) return;
      inFlight = true;
      try {
        const rows = await api<Classroom[]>("/classrooms");
        if (alive) setClasses(rows);
      } catch {
      } finally {
        inFlight = false;
      }
    };
    const timer = setInterval(() => void update(), 10000);
    window.addEventListener("focus", update);
    window.addEventListener("online", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      alive = false;
      clearInterval(timer);
      window.removeEventListener("focus", update);
      window.removeEventListener("online", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [user?.id, user?.role, user?.mustChange]);
  const [classLearningError, setClassLearningError] = useState("");
  const [classLearningBusy, setClassLearningBusy] = useState(false);
  const [sortingClassId, setSortingClassId] = useState<string | null>(null);
  useEffect(() => {
    if (!isTeacher || !current || !isClassManagementPage) return;
    let active = true;
    setClassLearning(null);
    setClassLearningError("");
    void api<LearningOverview>(`/classrooms/${current.id}/learning`)
      .then((data) => {
        if (active) setClassLearning(data);
      })
      .catch((error) => {
        if (active) setClassLearningError(errorMessage(error));
      });
    return () => {
      active = false;
    };
  }, [isTeacher, current?.id, isClassManagementPage, revision]);
  async function updateClassLearning(
    path: string,
    body: object,
    message: string,
  ) {
    if (!current || classLearningBusy) return;
    setClassLearningBusy(true);
    setClassLearningError("");
    try {
      await api(path, body);
      setClassLearning(
        await api<LearningOverview>(`/classrooms/${current.id}/learning`),
      );
      await reload();
      setNotice(message);
    } catch (error) {
      setClassLearningError(errorMessage(error));
    } finally {
      setClassLearningBusy(false);
    }
  }
  useEffect(() => {
    if (!user || user.mustChange) return;
    setLoadingClasses(true);
    void reload().finally(() => setLoadingClasses(false));
  }, [reload]);
  useEffect(() => {
    setQuestionChapter(current?.chapters[0]?.id ?? "");
  }, [current?.id]);
  useEffect(() => {
    if (
      questionChapter &&
      current &&
      !current.chapters.some((chapter) => chapter.id === questionChapter)
    ) {
      setQuestionChapter(current.chapters[0]?.id ?? "");
    }
  }, [current?.chapters, questionChapter]);
  useEffect(() => {
    if (!user || user.role === "admin" || !current || study) return;
    const params = new URLSearchParams(location.hash.slice(1));
    if (
      params.get("learning") === current.id &&
      params.has("exam") &&
      ((page === "online-exams" && params.get("workspace") === "online") ||
        (page === "hunt" && params.get("workspace") !== "online"))
    )
      return;
    if (
      [
        "home",
        "practice",
        "learning",
        "hunt",
        "online-exams",
        "corrections",
        "classes",
        "class-settings",
        "class-chapters",
        "class-general",
        "groups",
        "progress",
        "garden",
        "leaderboard",
      ].includes(page)
    ) {
      const section = new URLSearchParams({
        section: page,
        classroom: current.id,
      });
      history.replaceState(
        null,
        "",
        `${location.pathname}${location.search}#${section}`,
      );
    } else if (params.has("section")) {
      params.delete("section");
      params.delete("classroom");
      history.replaceState(
        null,
        "",
        `${location.pathname}${location.search}${params.size ? `#${params}` : ""}`,
      );
    }
  }, [user, current?.id, page, study]);
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
    if (next === "leaderboard") next = "garden";
    if (user?.role === "teacher" && ["progress", "garden"].includes(next))
      next = "classes";
    if (user?.role === "student" && next === "progress") next = "home";
    setEntryRunId("");
    setPage(next);
    setStudy(null);
    setError("");
    setCorrectionChapterId(next === "corrections" ? chapterId : "");
    if (next !== page) requestAnimationFrame(() => window.scrollTo(0, 0));
  }
  function login(u: User) {
    localStorage.removeItem("greenedu-idle-logout");
    setUser(u);
    setClasses([]);
    setClassId("");
    setPage("home");
    setStudy(null);
    setNotice("");
    setStudyExitNotice("");
  }
  useEffect(() => {
    const studyExit = (event: Event) => {
      const reason = (event as CustomEvent<{ reason?: string }>).detail?.reason;
      setEntryRunId("");
      setPage("home");
      setStudy(null);
      setError("");
      setStudyExitNotice(
        reason === "away"
          ? "Bạn đã rời trang học. Phiên học đã kết thúc và thời gian vắng mặt không được tính."
          : reason === "tabs"
            ? "Phiên luyện tập đã đóng do đạt giới hạn rời tab. Thời gian của phiên này không được tính."
            : reason === "locked"
              ? "Giáo viên đã khóa luyện tập chương này."
              : reason === "ended"
                ? "Phiên học không còn hiệu lực. Hãy mở phiên mới để tiếp tục."
                : "Phiên luyện tập đã đóng do không tương tác. Thời gian của phiên này không được tính.",
      );
    };
    window.addEventListener("greenedu-study-exit", studyExit);
    return () => window.removeEventListener("greenedu-study-exit", studyExit);
  }, []);
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
      const content = readQuestionForm(event.currentTarget);
      await ensureQuestionTypes([content]);
      await api(`/chapters/${data.chapterId}/questions`, content);
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
          <h1>Đổi mật khẩu tạm</h1>
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
  const nav: NavigationItem<Page>[] = isTeacher
    ? [
        { id: "home", label: "Tổng quan", icon: LayoutDashboard },
        { id: "classes", label: "Lớp học của tôi", icon: ClassroomIcon },
        { id: "questions", label: "Ngân hàng câu hỏi", icon: Books },
        { id: "learning", label: "Ôn tập", icon: GraduationCap },
        {
          id: "class-settings",
          label: "Quản lý lớp",
          icon: Settings,
        },
      ]
    : [
        { id: "home", label: "Khu vườn của tôi", icon: Sprout },
        { id: "practice", label: "Luyện tập", icon: BookOpen },
        { id: "learning", label: "Ôn tập", icon: GraduationCap },
        { id: "online-exams", label: "Kiểm tra", icon: ClipboardList },
        { id: "garden", label: "Lớp học của tôi", icon: TreeIcon },
      ];
  const parentPage: Page =
    page === "hunt" || (isTeacher && page === "online-exams")
      ? "learning"
      : page === "leaderboard"
        ? "garden"
        : isTeacher && isClassManagementPage
          ? "class-settings"
          : isTeacher &&
              (page === "groups" || page === "progress" || page === "garden")
            ? "classes"
            : !isTeacher && page === "corrections"
              ? "practice"
              : !isTeacher && page === "groups"
                ? "garden"
                : !isTeacher && page === "progress"
                  ? "home"
                  : page;
  const tabGroups: {
    parent: Page;
    label: string;
    items: WorkspaceTab<Page>[];
  }[] = isTeacher
    ? [
        {
          parent: "class-settings",
          label: "Quản lý lớp",
          items: [
            { id: "class-settings", label: "Học sinh", icon: Users },
            { id: "class-chapters", label: "Chương học", icon: Books },
            { id: "class-general", label: "Cài đặt chung", icon: Settings },
          ],
        },
        {
          parent: "classes",
          label: "Lớp học của tôi",
          items: [
            { id: "classes", label: "Khu vườn của lớp", icon: ClassroomIcon },
            { id: "groups", label: "Hoạt động nhóm", icon: Users },
          ],
        },
      ]
    : [
        {
          parent: "practice",
          label: "Luyện tập",
          items: [
            { id: "practice", label: "Luyện tập", icon: BookOpen },
            {
              id: "corrections",
              label: "Sổ tay sửa sai",
              icon: Notebook,
              count:
                current?.chapters.reduce(
                  (sum, chapter) => sum + chapter.openCorrections,
                  0,
                ) ?? 0,
            },
          ],
        },
        {
          parent: "garden",
          label: "Khu vườn của lớp",
          items: [
            { id: "garden", label: "Khu vườn của lớp", icon: TreeIcon },
            { id: "groups", label: "Hoạt động nhóm", icon: Users },
          ],
        },
      ];
  const activeTabs =
    !study && current
      ? ["learning", "hunt", "online-exams"].includes(page)
        ? {
            label: "Ôn tập",
            items: [
              { id: "learning" as const, label: "Ôn tập", icon: BookOpen },
              {
                id: "hunt" as const,
                label: "Săn thưởng",
                icon: Trophy,
              },
              {
                id: "online-exams" as const,
                label: "Kiểm tra online",
                icon: ClipboardList,
              },
            ],
          }
        : tabGroups.find((group) => group.parent === parentPage)
      : undefined;
  const totalSeconds =
    current?.chapters.reduce((n, c) => n + c.seconds, 0) ?? 0;
  const openCorrections = classes.reduce(
    (n, c) => n + c.chapters.reduce((a, ch) => a + ch.openCorrections, 0),
    0,
  );

  return (
    <div className="app-shell">
      <SkipLink target="workspace-content" />
      <aside className="sidebar">
        <Logo school />
        <div className="workspace-label">
          {isTeacher ? "TRANG GIÁO VIÊN" : "TRANG HỌC TẬP"}
        </div>
        <SidebarNavigation
          items={nav.map((item) =>
            !isTeacher && item.id === "practice"
              ? { ...item, count: openCorrections }
              : item,
          )}
          page={parentPage}
          onNavigate={navigate}
        />
        <div className="sidebar-bottom">
          <GardenNote isTeacher={isTeacher} />
          <button
            className={`nav-item ${page === "feedback" ? "active" : ""}`}
            aria-current={page === "feedback" ? "page" : undefined}
            aria-label={isTeacher ? "Quản lý góp ý" : "Góp ý"}
            onClick={() => navigate("feedback")}
          >
            <MessageSquare size={19} />
            {isTeacher ? "Quản lý góp ý" : "Góp ý"}
          </button>
          <button
            className={`nav-item ${page === "settings" ? "active" : ""}`}
            aria-current={page === "settings" ? "page" : undefined}
            onClick={() => navigate("settings")}
          >
            <UserCircle size={19} />
            Tài khoản
          </button>
          <button className="nav-item" onClick={() => void logout()}>
            <LogOut size={19} />
            Đăng xuất
          </button>
          <span className="sidebar-version">GREENEDU · MVP 0.1</span>
        </div>
      </aside>
      <WorkspaceFrame>
        <header className="topbar workspace-topbar">
          <PortraitActions
            page={page}
            feedbackLabel={isTeacher ? "Quản lý góp ý" : "Góp ý"}
            onFeedback={() => navigate("feedback")}
            onAccount={() => navigate("settings")}
            onLogout={() => void logout()}
          />
          <WorkspaceHeadingSlot />
          <div className="topbar-right">
            {current && (
              <label className="class-switch">
                <ClassroomIcon size={16} />
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
        <WorkspaceContent
          tabs={activeTabs}
          page={page}
          onNavigate={navigate}
          contentKey={isClassManagementPage ? "class-management" : page}
        >
          {!isTeacher && (
            <ExamNotices
              key={user.id}
              userId={user.id}
              inLearning={
                (page === "learning" ||
                  page === "hunt" ||
                  page === "online-exams") &&
                !study
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
          <MotionToast message={notice} onClose={() => setNotice("")} />
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
              <PageHeading title="Tài khoản & bảo mật" />
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
              <PageHeading title={`Xin chào, ${user.name}!`} />
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
                    key={current.id}
                    classroom={current}
                    revision={revision}
                    onPage={navigate}
                    onEditor={setEditor}
                  />
                ) : (
                  <div className="student-home">
                    <PageHeading title="Khu vườn của tôi" />
                    <HomeTasks
                      key={current.id}
                      classroom={current}
                      teacher={false}
                      onNavigate={navigate}
                    />
                    <div className="garden-welcome-grid">
                      <div className="garden-hero student-welcome-hero">
                        <div className="hero-copy">
                          <h2>Tiếp tục học</h2>
                          <p>
                            {totalSeconds
                              ? `${duration(totalSeconds)} đã học · ${current.subject}`
                              : "Chọn một chương để bắt đầu."}
                          </p>
                          <p className="student-study-week">
                            <Clock3 size={19} aria-hidden="true" />
                            <span>
                              Tuần này:{" "}
                              <strong>
                                {current.studyWeek
                                  ? current.studyWeek.seconds === null
                                    ? "Chưa có lịch sử"
                                    : `${duration(current.studyWeek.seconds)}${current.studyWeek.seconds % 60 ? ` ${current.studyWeek.seconds % 60} giây` : ""}`
                                  : "Chưa có dữ liệu tuần"}
                              </strong>
                              <small>
                                Thứ Hai – Chủ nhật · Giờ Việt Nam
                                {current.studyWeek?.coverage === "partial"
                                  ? " · Chưa đủ lịch sử cả tuần"
                                  : ""}
                              </small>
                            </span>
                          </p>
                          <div className="garden-hero-actions">
                            <button
                              className="button primary"
                              onClick={() => navigate("practice")}
                            >
                              {totalSeconds
                                ? "Tiếp tục luyện tập"
                                : "Bắt đầu luyện tập"}
                              <ArrowRight size={18} />
                            </button>
                            <button
                              className="button outline"
                              onClick={() =>
                                document
                                  .getElementById("student-journey")
                                  ?.scrollIntoView({
                                    behavior: window.matchMedia(
                                      "(prefers-reduced-motion: reduce)",
                                    ).matches
                                      ? "auto"
                                      : "smooth",
                                    block: "start",
                                  })
                              }
                            >
                              <TrendingUp size={17} /> Xem hành trình
                            </button>
                          </div>
                        </div>
                        <GardenIllustration className="hero-illustration" />
                      </div>
                      <GardenGoal
                        classroom={current}
                        onPractice={(chapter) =>
                          setStudy({ chapter, mode: "practice" })
                        }
                      />
                    </div>
                    <StudentStats
                      classroom={current}
                      onCorrections={() => navigate("corrections")}
                    />
                    <section
                      id="student-journey"
                      style={{ scrollMarginTop: 100 }}
                      aria-label="Hành trình của tôi"
                    >
                      <SectionTitle
                        title="Hành trình của tôi"
                        description={`${current.levelMinutes ?? 60} phút học có hoạt động/chương tăng một cấp, tối đa 5.`}
                      />
                      <div className="card progress-table">
                        {!current.chapters.length && (
                          <Empty
                            title="Hành trình đang chờ những hạt mầm"
                            text="Các mốc tăng cấp sẽ xuất hiện khi giáo viên thêm chương học."
                          />
                        )}
                        {current.chapters.map((ch) => (
                          <article className="chapter-level-card" key={ch.id}>
                            <ChapterTitle title={ch.title} />
                            <ChapterLevelTimeline chapter={ch} />
                          </article>
                        ))}
                      </div>
                    </section>
                  </div>
                ))}
              {page === "learning" && (
                <ReviewLibrary
                  key={current.id}
                  classroom={current}
                  user={user}
                  onReview={(reviewId, chapter) =>
                    setStudy({ chapter, mode: "practice", reviewId })
                  }
                />
              )}
              {(page === "hunt" || page === "online-exams") && (
                <Learning
                  key={`${current.id}-${page}`}
                  view={page === "online-exams" ? "online" : "hunt"}
                  classroom={current}
                  user={user}
                  entryRunId={
                    entryClassId === current.id ? entryRunId : undefined
                  }
                  onExamExit={() => {
                    setEntryRunId("");
                    refresh();
                  }}
                  onCorrections={(chapterId) =>
                    navigate("corrections", chapterId)
                  }
                />
              )}
              {page === "practice" && (
                <>
                  <PageHeading title="Luyện tập" />
                  <ChapterGrid
                    classroom={current}
                    levelUps={levelUps}
                    onStudy={(ch, lesson) =>
                      setStudy({ chapter: ch, mode: "practice", lesson })
                    }
                  />
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
                    title="Lớp học của tôi"
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
                  <section aria-label="Khu vườn của lớp">
                    <ClassCommunity
                      key={current.id}
                      classroom={current}
                      revision={revision}
                      userId={user.id}
                      teacherAvatarId={user.avatarId}
                      embedded
                    />
                  </section>
                </>
              )}
              {isClassManagementPage && (
                <>
                  <PageHeading
                    title="Quản lý lớp"
                    action={
                      current.canManageClass && (
                        <button
                          className="button danger"
                          onClick={() => {
                            setDeletingClass(current);
                            setDeleteClassName("");
                            setDeleteClassError("");
                          }}
                        >
                          Xóa lớp
                        </button>
                      )
                    }
                  />
                  <section
                    id="class-general"
                    hidden={page !== "class-general"}
                    tabIndex={-1}
                    aria-label="Cài đặt chung"
                  >
                    {classLearningError && (
                      <div className="error-banner" role="alert">
                        {classLearningError}
                      </div>
                    )}
                    {classLearning ? (
                      <ClassLevelSettings
                        key={`${current.id}-${classLearning.levelMinutes ?? 60}-${JSON.stringify(classLearning.sessionPolicy)}`}
                        minutes={classLearning.levelMinutes ?? 60}
                        enabled={classLearning.canConfigureLevels === true}
                        busy={classLearningBusy}
                        policy={classLearning.sessionPolicy}
                        canConfigurePolicy={
                          classLearning.classManagement === true
                        }
                        onSave={(minutes, policy) =>
                          updateClassLearning(
                            `/classrooms/${current.id}/${classLearning.classManagement ? "general-settings" : "level-settings"}`,
                            { minutes, policy },
                            "Đã lưu cài đặt chung cho lớp.",
                          )
                        }
                      />
                    ) : !classLearningError ? (
                      <div className="loading-panel">Đang tải cài đặt lớp…</div>
                    ) : null}
                    <WeeklyPractice
                      key={current.id}
                      classroomId={current.id}
                      active={page === "class-general"}
                    />
                  </section>
                  <section
                    id="class-chapters"
                    hidden={page !== "class-chapters"}
                    tabIndex={-1}
                    aria-label="Chương học"
                  >
                    <SectionTitle
                      title="Quản lý chương"
                      action={
                        <div className="button-group">
                          <button
                            className="button outline small"
                            disabled={
                              current.chapters.length < 2 ||
                              !current.chapters.every(
                                (ch) => ch.canReorderChapter,
                              )
                            }
                            title={
                              current.chapters.some(
                                (ch) => !ch.canReorderChapter,
                              )
                                ? "Đổi thứ tự chương đang chờ cập nhật máy chủ."
                                : undefined
                            }
                            onClick={() => setSortingClassId(current.id)}
                          >
                            <ArrowsDownUp size={16} />
                            Sắp xếp
                          </button>
                          <button
                            className="button outline small"
                            onClick={() => setEditor("chapter")}
                          >
                            <Plus size={16} />
                            Thêm chương
                          </button>
                        </div>
                      }
                    />
                    {sortingClassId === current.id && (
                      <ChapterSort
                        key={`sort-${current.id}`}
                        classroom={current}
                        onClose={() => setSortingClassId(null)}
                        onSaved={async () => {
                          setClasses(await api<Classroom[]>("/classrooms"));
                          setRevision((value) => value + 1);
                          setNotice("Đã lưu thứ tự hiển thị chương.");
                        }}
                      />
                    )}
                    <div className="chapter-list">
                      {current.chapters.length > 0 &&
                        !current.chapters[0].canReorderChapter && (
                          <p className="form-intro">
                            Đổi thứ tự chương đang chờ cập nhật máy chủ.
                          </p>
                        )}
                      {current.chapters.length ? (
                        current.chapters.map((ch) => {
                          const access = classLearning?.chapters.find(
                            (row) => row.id === ch.id,
                          );
                          return (
                            <div className="card chapter-row" key={ch.id}>
                              <div className="chapter-row-main">
                                <div className="chapter-row-copy">
                                  <div className="chapter-title-row">
                                    <ChapterDelete
                                      compact
                                      chapter={ch}
                                      onChange={async () => {
                                        await reload();
                                        setRevision((value) => value + 1);
                                        setNotice(
                                          "Đã xóa chương khỏi danh sách đang dùng.",
                                        );
                                      }}
                                    />
                                    <h3>{ch.title}</h3>
                                  </div>
                                  <p className="chapter-counts">
                                    <span className="chapter-count lessons">
                                      <strong>{ch.lessons.length}</strong> bài
                                    </span>
                                    <span className="chapter-count questions">
                                      <strong>{ch.questionCount}</strong> câu
                                      hỏi
                                    </span>
                                  </p>
                                  <div className="chapter-row-actions">
                                    <LinkButton
                                      onClick={() => {
                                        setQuestionChapter(ch.id);
                                        navigate("questions");
                                      }}
                                    >
                                      Quản lý câu hỏi
                                    </LinkButton>
                                  </div>
                                </div>
                                <Lessons
                                  chapter={ch}
                                  onChange={async () => {
                                    await reload();
                                    setRevision((value) => value + 1);
                                  }}
                                />
                              </div>
                              <div className="class-chapter-access">
                                <span
                                  className={`chapter-exam-status ${access?.practiceAllowed ? "open" : "locked"}`}
                                >
                                  {access?.practiceAllowed
                                    ? "Luyện tập đang mở"
                                    : "Luyện tập đang khóa"}
                                </span>
                                <button
                                  className={`button ${access?.practiceAllowed ? "danger" : "primary"} small`}
                                  disabled={
                                    classLearningBusy ||
                                    !classLearning?.classManagement
                                  }
                                  aria-label={`${access?.practiceAllowed ? "Khóa" : "Mở"} luyện tập · ${ch.title}`}
                                  onClick={() =>
                                    void updateClassLearning(
                                      `/chapters/${ch.id}/practice-access`,
                                      { enabled: !access?.practiceAllowed },
                                      access?.practiceAllowed
                                        ? "Đã khóa luyện tập chương."
                                        : "Đã mở luyện tập chương.",
                                    )
                                  }
                                >
                                  {access?.practiceAllowed
                                    ? "Khóa luyện tập"
                                    : "Mở luyện tập"}
                                </button>
                                {!classLearning?.classManagement && (
                                  <small>
                                    Quyền luyện tập đang chờ cập nhật máy chủ.
                                  </small>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <Empty
                          title="Thêm chương học đầu tiên"
                          text="Chia nội dung thành các chương để tổ chức câu hỏi và theo dõi tiến độ."
                        />
                      )}
                    </div>
                  </section>
                  <section
                    id="class-students"
                    hidden={page !== "class-settings"}
                    tabIndex={-1}
                    aria-label="Quản lý học sinh"
                  >
                    <Roster
                      key={current.id}
                      classroom={current}
                      revision={revision}
                      onAdd={() => setEditor("student")}
                      onReset={(s) => setEditor({ student: s })}
                    />
                  </section>
                </>
              )}
              {page === "questions" && (
                <>
                  <PageHeading
                    title="Ngân hàng câu hỏi"
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
              {page === "garden" && !isTeacher && (
                <ClassCommunity
                  key={current.id}
                  classroom={current}
                  revision={revision}
                  userId={user.id}
                  teacherAvatarId={isTeacher ? user.avatarId : undefined}
                />
              )}
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
        </WorkspaceContent>
      </WorkspaceFrame>
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
      {deletingClass && (
        <Modal
          title="Xóa lớp học"
          dismissible={!deleteClassBusy}
          onClose={() => {
            if (!deleteClassBusy) setDeletingClass(null);
          }}
        >
          <form onSubmit={deleteClass}>
            <p>
              Xóa “{deletingClass.name} · {deletingClass.subject}” khỏi danh
              sách và dừng quyền truy cập lớp. Tài khoản học sinh và các lớp
              khác được giữ nguyên; dữ liệu lớp này được lưu trữ.
            </p>
            <label>
              Nhập tên lớp để xác nhận
              <input
                name="confirmName"
                autoComplete="off"
                required
                value={deleteClassName}
                disabled={deleteClassBusy}
                onChange={(e) => setDeleteClassName(e.target.value)}
              />
            </label>
            {deleteClassError && (
              <p role="alert" className="error-banner">
                {deleteClassError}
              </p>
            )}
            <div className="form-actions">
              <button
                type="button"
                className="button"
                disabled={deleteClassBusy}
                onClick={() => setDeletingClass(null)}
              >
                Hủy
              </button>
              <button
                className="button danger"
                disabled={
                  deleteClassBusy || deleteClassName !== deletingClass.name
                }
              >
                {deleteClassBusy ? "Đang xóa…" : "Xóa lớp"}
              </button>
            </div>
          </form>
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
            classrooms={classes}
            classroom={current}
            chapterId={questionChapter}
            onSave={saveEditor}
          />
        </Modal>
      )}
      {studyExitNotice && (
        <Modal
          title="Phiên học đã kết thúc"
          onClose={() => setStudyExitNotice("")}
        >
          <p>{studyExitNotice}</p>
          <button
            className="button primary"
            onClick={() => setStudyExitNotice("")}
          >
            Đã hiểu
          </button>
        </Modal>
      )}
    </div>
  );
}

function PageHeading({
  title,
  text,
  action,
  className = "",
}: {
  title: string;
  text?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <WorkspaceHeading className={`page-heading ${className}`}>
      <div>
        <h1>{title}</h1>
        {text && <p>{text}</p>}
      </div>
      {action}
    </WorkspaceHeading>
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
  const [passwordHelp, setPasswordHelp] = useState(false);
  const closePasswordHelp = useCallback(() => setPasswordHelp(false), []);
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
          <h1>
            Kiến thức lớn lên.
            <br />
            Bạn cũng vậy.
          </h1>
          <span className="eyebrow">MỖI NỖ LỰC LÀ MỘT HẠT MẦM</span>
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
          <h2>Đăng nhập</h2>
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
          <button
            type="button"
            className="text-button login-forgot"
            aria-haspopup="dialog"
            onClick={() => setPasswordHelp(true)}
          >
            <ShieldCheck size={16} />
            Quên mật khẩu
          </button>
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
      {passwordHelp && (
        <Modal
          title="Quên mật khẩu"
          onClose={closePasswordHelp}
          className="login-password-help"
        >
          <p>Liên hệ với giáo viên chủ nhiệm, hoặc admin để cấp lại</p>
          <button
            type="button"
            className="button primary full"
            onClick={closePasswordHelp}
          >
            Đã hiểu
          </button>
        </Modal>
      )}
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
        icon={<Notebook size={21} />}
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
  note?: string;
  color?: string;
  children?: ReactNode;
}) {
  return (
    <div className="stat-card card">
      <span className={`stat-icon ${color}`}>{icon}</span>
      <span className="stat-label">{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
      {children}
    </div>
  );
}
function ChapterGrid({
  classroom,
  levelUps,
  onStudy,
}: {
  classroom: Classroom;
  levelUps: Set<string>;
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
      {classroom.chapters.map((ch, i) => {
        const stage = studentLevel(ch.seconds, ch.levelMinutes);
        const percent = Math.min(
          100,
          (stage.seconds / (4 * levelStepSeconds(ch.levelMinutes))) * 100,
        );
        const state =
          stage.seconds === 0
            ? "untouched"
            : stage.level === 5
              ? "complete"
              : "growing";
        return (
          <article
            className="chapter-card card"
            key={ch.id}
            data-progress-state={state}
          >
            <div className={`chapter-art art-${i % 3}`}>
              <span className="pill chapter-level">
                Cấp {stage.level} · {stage.name}
              </span>
              <StudentLevelIcon
                level={stage.level}
                celebrating={levelUps.has(`${classroom.id}/${ch.id}`)}
              />
              {stage.level === 5 && (
                <span
                  className="chapter-completion-mark"
                  title="Đã đạt Kết Trái"
                  aria-label="Đã đạt Kết Trái"
                >
                  <CheckCircle2 size={24} />
                </span>
              )}
            </div>
            <div className="chapter-body">
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
              <div
                className="progress-track"
                role="progressbar"
                aria-label={`Tiến độ ${ch.title}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.floor(percent)}
              >
                <span
                  style={{
                    width: "100%",
                    transform: `scaleX(${percent / 100})`,
                  }}
                />
              </div>
              <div className="chapter-progress">
                <span>
                  {stage.level === 5
                    ? "Đã đạt Kết Trái."
                    : `Còn ${duration(stage.remainingSeconds)} để lên ${stages[stage.level]}.`}
                </span>
                <strong>{Math.floor(percent)}%</strong>
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
                  ch.practiceAllowed === false ||
                  !ch.questionCount ||
                  (!!selectedLessons[ch.id] &&
                    !ch.lessons.find((l) => l.title === selectedLessons[ch.id])
                      ?.questionCount)
                }
                onClick={() => onStudy(ch, selectedLessons[ch.id] || undefined)}
              >
                {ch.practiceAllowed === false
                  ? "Luyện tập đang khóa"
                  : ch.questionCount
                    ? stage.level === 5
                      ? "Ôn tập lại"
                      : "Luyện tập"
                    : "Chờ câu hỏi"}
                <ArrowRight size={17} />
              </button>
            </div>
          </article>
        );
      })}
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
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let alive = true;
    setError("");
    setLoading(true);
    setStudents([]);
    api<Student[]>(`/classrooms/${classroom.id}/students`)
      .then((s) => {
        if (alive) setStudents(s);
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
  const total = students.reduce((n, s) => n + s.total, 0),
    correct = students.reduce((n, s) => n + s.correct, 0);
  return (
    <div className="teacher-home">
      <PageHeading title="Tổng quan" />
      <HomeTasks
        key={classroom.id}
        classroom={classroom}
        teacher
        onNavigate={onPage}
      />
      {error && (
        <div className="error-banner" role="alert">
          {error}
          <button
            type="button"
            className="text-button"
            onClick={() => setRetry((value) => value + 1)}
          >
            Thử lại thống kê
          </button>
        </div>
      )}
      <div className="stats-grid" aria-busy={loading} aria-live="polite">
        <Stat
          icon={<Users size={21} />}
          label="Học sinh"
          value={String(classroom.studentCount)}
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
          value={
            !loading && !error && total
              ? `${Math.round((correct / total) * 100)}%`
              : "—"
          }
          note={
            loading
              ? "Đang tải thống kê…"
              : error
                ? "Chưa tải được thống kê"
                : `${total} lượt luyện tập`
          }
          color="amber"
        />
        <Stat
          icon={<BloomingTreeIcon />}
          label="Cây đã ra hoa"
          value={
            loading || error
              ? "—"
              : String(students.reduce((n, s) => n + s.trees, 0))
          }
          note={
            loading
              ? "Đang tải thống kê…"
              : error
                ? "Chưa tải được thống kê"
                : "Từ cấp 4"
          }
          color="rose"
        />
      </div>
      <SectionTitle title="Chuẩn bị cho buổi học" />
      <div className="quick-actions">
        <button className="card" onClick={() => onEditor("student")}>
          <span className="stat-icon green">
            <Users size={22} />
          </span>
          <h3>Thêm học sinh</h3>

          <ArrowRight size={18} />
        </button>
        <button className="card" onClick={() => onEditor("chapter")}>
          <span className="stat-icon blue">
            <BookOpen size={22} />
          </span>
          <h3>Tạo chương học</h3>

          <ArrowRight size={18} />
        </button>
        <button className="card" onClick={() => onPage("classes")}>
          <span className="stat-icon amber">
            <TrendingUp size={22} />
          </span>
          <h3>Xem tiến độ</h3>

          <ArrowRight size={18} />
        </button>
      </div>
    </div>
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
      <PageHeading title="Sổ tay sửa sai" />
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
                    if (!chapter) {
                      void api<Chapter>(`/chapters/${q.chapterId}`)
                        .then((archived) =>
                          onStudy({
                            chapter: archived,
                            mode: "correction",
                            questionId: q.id,
                          }),
                        )
                        .catch((e) => setError(errorMessage(e)));
                    }
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
  const [leaderboard, setLeaderboard] = useState<ClassLeaderboard>();
  const [boardError, setBoardError] = useState("");
  const [notebookStudent, setNotebookStudent] = useState<Student | null>(null);
  const [statisticsOpen, setStatisticsOpen] = useState(false);
  const [statisticsStudent, setStatisticsStudent] = useState("");
  const [rowsReceivedAt, setRowsReceivedAt] = useState(0);
  const [rows, setRows] = useState<Student[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [search, setSearch] = useState(""),
    [retry, setRetry] = useState(0),
    [exporting, setExporting] = useState(false);
  const activity = useStudentActivity(classroom.id, retry);
  const recordedSeconds = (s: Student) =>
    activity.snapshot && activity.snapshot.receivedAt >= rowsReceivedAt
      ? (activity.snapshot.members.get(s.id)?.seconds ?? s.seconds)
      : s.seconds;
  useEffect(() => {
    let alive = true;
    let inFlight = false;
    setLoading(true);
    setError("");
    setLeaderboard(undefined);
    setBoardError("");
    const refresh = () => {
      if (!alive || inFlight) return;
      inFlight = true;
      Promise.allSettled([
        api<Student[]>(`/classrooms/${classroom.id}/students`),
        api<ClassLeaderboard>(`/classrooms/${classroom.id}/leaderboard`),
      ])
        .then(([studentsResult, boardResult]) => {
          if (studentsResult.status === "rejected") throw studentsResult.reason;
          if (alive) {
            setRows(studentsResult.value);
            setRowsReceivedAt(Date.now());
            setLeaderboard(
              boardResult.status === "fulfilled"
                ? boardResult.value
                : undefined,
            );
            setBoardError(
              boardResult.status === "rejected"
                ? "Chưa tải được số câu đã khắc phục."
                : "",
            );
            setError("");
          }
        })
        .catch((e) => {
          if (alive) setError(errorMessage(e));
        })
        .finally(() => {
          inFlight = false;
          if (alive) setLoading(false);
        });
    };
    const update = () => {
      if (document.visibilityState === "visible" && navigator.onLine) refresh();
    };
    refresh();
    const timer = window.setInterval(update, 30000);
    window.addEventListener("focus", update);
    window.addEventListener("online", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      alive = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", update);
      window.removeEventListener("online", update);
      document.removeEventListener("visibilitychange", update);
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
  const query = searchText(search);
  const resolvedCounts = new Map(
    leaderboard?.repairs.map((member) => [
      member.id,
      member.resolvedCorrections,
    ]),
  );
  const filtered = rows.filter((s) =>
    searchText(`${s.name} ${s.email}`).includes(query),
  );
  return (
    <>
      <SectionTitle
        title="Quản lý học sinh"
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
            <button
              className="button outline small"
              disabled={loading || !!error}
              onClick={() => {
                setStatisticsStudent("");
                setStatisticsOpen(true);
              }}
            >
              <TrendingUp size={16} />
              Thống kê
            </button>
            <button className="button primary small" onClick={onAdd}>
              <Plus size={16} />
              Thêm học sinh
            </button>
          </div>
        }
      />
      {activity.warning && (
        <p className="roster-activity-warning" role="status">
          {activity.warning}
          <button
            className="text-button"
            onClick={() => setRetry((n) => n + 1)}
          >
            Thử lại
          </button>
        </p>
      )}
      {boardError && (
        <div className="error-banner" role="alert">
          {boardError}
          <button onClick={() => setRetry((n) => n + 1)}>
            Thử lại thống kê
          </button>
        </div>
      )}
      <div className="card roster-card">
        <div className="roster-search-toolbar">
          <label className="search-input">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              name="student-search"
              autoComplete="off"
              aria-label="Tìm học sinh"
              placeholder="Tìm theo tên hoặc email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          {search && (
            <button
              type="button"
              className="text-button"
              onClick={() => setSearch("")}
            >
              Xóa tìm kiếm
            </button>
          )}
          {!loading && !error && (
            <span className="search-result-count" role="status">
              {filtered.length}/{rows.length} học sinh
            </span>
          )}
        </div>
        {error ? (
          <div className="error-banner" role="alert">
            {error}
            <button onClick={() => setRetry((n) => n + 1)}>Thử lại</button>
          </div>
        ) : loading ? (
          <div className="loading-panel">Đang tải tiến độ…</div>
        ) : rows.length ? (
          <div className="table-scroll">
            <table aria-label="Danh sách học sinh">
              <thead>
                <tr>
                  <th>Học sinh</th>
                  <th
                    className="roster-time-heading"
                    scope="col"
                    aria-label="Thời gian học"
                    title="Thời gian học"
                  >
                    <Clock3 size={20} />
                  </th>
                  <th>Số câu đã làm</th>
                  <th>Tỷ lệ đúng</th>
                  <th>Câu cần sửa</th>
                  <th>Câu đã khắc phục</th>
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
                          <ChapterLevelIcons chapters={s.chapterLevels} />
                        </div>
                      </div>
                    </td>
                    <td
                      className="roster-time-cell"
                      data-recorded-seconds={recordedSeconds(s)}
                    >
                      {duration(recordedSeconds(s))}
                      <button
                        className="text-button roster-statistics-search"
                        aria-label={`Xem thống kê · ${s.name}`}
                        title={`Xem thống kê · ${s.name}`}
                        onClick={() => {
                          setStatisticsStudent(s.id);
                          setStatisticsOpen(true);
                        }}
                      >
                        <Search size={18} />
                      </button>
                      <small className="roster-time-detail">
                        {Math.floor(recordedSeconds(s) % 60)} giây
                      </small>
                      {activity.isStudying(s.id) && (
                        <span className="roster-study-status">
                          Đang luyện tập
                        </span>
                      )}
                    </td>
                    <td>{s.answeredQuestions ?? s.total}</td>
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
                      <button
                        className="text-button"
                        onClick={() => setNotebookStudent(s)}
                      >
                        Xem sổ tay
                      </button>
                    </td>
                    <td className="roster-resolved-cell">
                      <span
                        className="pill roster-resolved-count"
                        title={
                          leaderboard
                            ? "Số câu đã khắc phục trong lớp; mỗi câu tính một lần"
                            : "Chưa tải được số câu đã khắc phục"
                        }
                      >
                        {leaderboard ? (resolvedCounts.get(s.id) ?? 0) : "—"}
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
      {notebookStudent && (
        <StudentNotebook
          classroom={classroom}
          student={notebookStudent}
          onClose={() => setNotebookStudent(null)}
        />
      )}
      {statisticsOpen && (
        <StudentStudyStatistics
          key={statisticsStudent}
          classroom={classroom}
          students={rows}
          initialStudentId={statisticsStudent}
          onClose={() => setStatisticsOpen(false)}
        />
      )}
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
  classrooms,
  editor,
  classroom,
  chapterId,
  onSave,
}: {
  classrooms: Classroom[];
  editor: NonNullable<Editor>;
  classroom?: Classroom;
  chapterId: string;
  onSave: (e: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  const [sourceClassroomId, setSourceClassroomId] = useState("");
  const sourceClassroom = classrooms.find((c) => c.id === sourceClassroomId);
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
            Tạo lớp trống hoặc dùng lại danh sách học sinh. Chương, câu hỏi và
            tiến độ của lớp mới bắt đầu trống.
          </p>
          <label>
            Lấy danh sách học sinh từ lớp
            <select
              name="sourceClassroomId"
              value={sourceClassroomId}
              onChange={(e) => setSourceClassroomId(e.target.value)}
              disabled={busy}
            >
              <option value="">Không sao chép — tạo lớp trống</option>
              {classrooms
                .filter((c) => c.canManageClass)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {c.subject} ({c.studentCount} học sinh)
                  </option>
                ))}
            </select>
          </label>
          {sourceClassroom && (
            <p className="muted">
              Dùng lại {sourceClassroom.studentCount} tài khoản học sinh; giữ
              khối {sourceClassroom.grade}.
            </p>
          )}
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
            {!sourceClassroom && (
              <label>
                Khối lớp
                <input
                  name="grade"
                  required
                  maxLength={20}
                  placeholder="Ví dụ: 10"
                />
              </label>
            )}
          </div>
        </>
      )}
      {editor === "chapter" && (
        <>
          <p className="form-intro">
            Chương mới thuộc {classroom?.name} · {classroom?.subject}.
          </p>
          <section className="existing-chapters" aria-label="Chương hiện có">
            <h3>Chương hiện có ({classroom?.chapters.length ?? 0})</h3>
            {classroom?.chapters.length ? (
              <ol>
                {classroom.chapters.map((chapter) => (
                  <li key={chapter.id}>{chapter.title}</li>
                ))}
              </ol>
            ) : (
              <p>Lớp chưa có chương học.</p>
            )}
          </section>
          <p className="form-intro">
            Chương mới sẽ nằm cuối danh sách, ở vị trí{" "}
            {(classroom?.chapters.length ?? 0) + 1}.
          </p>
          <label>
            Tên chương
            <input
              name="title"
              autoComplete="off"
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
