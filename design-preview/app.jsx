import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Sprout,
  Leaf,
  Flower2,
  BookOpen,
  LayoutDashboard,
  Users,
  Clock3,
  CheckCircle2,
  TrendingUp,
  Trophy,
  Settings,
  LogOut,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Plus,
  Search,
  Bell,
  X,
  MoreHorizontal,
  Check,
  ShieldCheck,
  FileText,
  Download,
  Sun,
  Heart,
  CircleHelp,
  Target,
  CalendarDays,
  Mail,
} from "lucide-react";
import "@fontsource/be-vietnam-pro/400.css";
import "@fontsource/be-vietnam-pro/500.css";
import "@fontsource/be-vietnam-pro/600.css";
import "@fontsource/be-vietnam-pro/700.css";
import "./app.css";

const initials = new URLSearchParams(location.search).get("role");
const role = ["student", "teacher", "admin", "login"].includes(initials)
  ? initials
  : "student";
const chapters = [
  {
    title: "Mở đầu",
    lesson: "Đơn vị & phép đo",
    level: "Chồi",
    minutes: 85,
    progress: 62,
    count: 9,
    color: "sage",
    plant: 2,
  },
  {
    title: "Động học",
    lesson: "Chuyển động thẳng",
    level: "Mầm",
    minutes: 35,
    progress: 28,
    count: 12,
    color: "sand",
    plant: 1,
  },
  {
    title: "Động lực học",
    lesson: "Các định luật Newton",
    level: "Cây Non",
    minutes: 125,
    progress: 76,
    count: 15,
    color: "peach",
    plant: 3,
  },
];
const students = [
  {
    name: "Trần Hà Linh",
    email: "halinh@truong.demo",
    initials: "HL",
    progress: 72,
    level: "Chồi",
    time: "1 giờ 25 phút",
    color: "sage",
  },
  {
    name: "Nguyễn Minh Khang",
    email: "minhkhang@truong.demo",
    initials: "MK",
    progress: 86,
    level: "Đơm Hoa",
    time: "3 giờ 10 phút",
    color: "sand",
  },
  {
    name: "Lê Ngọc Anh",
    email: "ngocanh@truong.demo",
    initials: "NA",
    progress: 48,
    level: "Mầm",
    time: "42 phút",
    color: "peach",
  },
  {
    name: "Phạm Bảo Ngân",
    email: "baongan@truong.demo",
    initials: "BN",
    progress: 64,
    level: "Cây Non",
    time: "2 giờ 15 phút",
    color: "sage",
  },
];
const questions = [
  {
    text: "Đơn vị đo độ dài trong hệ đơn vị SI là gì?",
    answers: ["Mét (m)", "Centimét (cm)", "Kilômét (km)", "Milimét (mm)"],
    correct: 0,
    explanation:
      "Mét (m) là đơn vị đo độ dài cơ bản trong hệ SI. Các đơn vị còn lại là bội hoặc ước của mét.",
  },
  {
    text: "Dụng cụ nào phù hợp nhất để đo thời gian của một vật rơi?",
    answers: ["Thước kẻ", "Cân điện tử", "Đồng hồ bấm giây", "Nhiệt kế"],
    correct: 2,
    explanation:
      "Đồng hồ bấm giây đo khoảng thời gian giữa hai sự kiện, phù hợp với thời gian chuyển động của vật.",
  },
  {
    text: "Khi đo nhiều lần cùng một đại lượng, nên dùng giá trị nào làm kết quả?",
    answers: [
      "Giá trị lớn nhất",
      "Giá trị nhỏ nhất",
      "Giá trị trung bình",
      "Giá trị đầu tiên",
    ],
    correct: 2,
    explanation:
      "Giá trị trung bình giúp giảm ảnh hưởng của sai số ngẫu nhiên trong phép đo.",
  },
];

function Plant({ stage = 2, className = "" }) {
  return (
    <svg
      className={`plant ${className}`}
      viewBox="0 0 120 120"
      aria-hidden="true"
    >
      <ellipse cx="60" cy="106" rx="37" ry="7" fill="#d7e4c6" />
      <path d="M45 85h30l-5 20H50Z" fill="#c8946b" />
      <path d="M43 83h34v7H43Z" fill="#dbab83" />
      {stage === 1 ? (
        <>
          <path d="M58 83q-11-19 1-29 14 4 8 18Z" fill="#a78457" />
          <path d="M60 67q-2-21 14-26 3 17-14 26" fill="#72935f" />
        </>
      ) : (
        <>
          <path
            d="M60 84V47"
            stroke="#5e7c45"
            strokeWidth="5"
            strokeLinecap="round"
          />
          {stage >= 3 ? (
            <>
              <circle cx="39" cy="49" r="21" fill="#759760" />
              <circle cx="81" cy="48" r="21" fill="#668851" />
              <circle cx="60" cy="30" r="26" fill="#91ac72" />
              <path
                d="m60 83-15-23m15 7 18-13"
                stroke="#5e7c45"
                strokeWidth="4"
                strokeLinecap="round"
              />
              {stage >= 4 &&
                [35, 62, 83].map((x, i) => (
                  <g key={x} transform={`translate(${x},${i === 1 ? 27 : 47})`}>
                    <circle
                      cx="0"
                      cy="0"
                      r="8"
                      fill={stage === 5 ? "#d8a052" : "#efc49c"}
                    />
                    <circle cx="0" cy="0" r="3" fill="#bf864a" />
                  </g>
                ))}
            </>
          ) : (
            <>
              <path
                d="M58 65C30 69 25 52 26 38c24-2 36 10 32 27Z"
                fill="#90ad72"
              />
              <path
                d="M61 53C58 32 75 20 95 22c-2 22-16 34-34 31Z"
                fill="#71935c"
              />
              <path
                d="m60 64-20-16m21 6 19-17"
                stroke="#c0d3a0"
                strokeWidth="2"
              />
            </>
          )}
        </>
      )}
    </svg>
  );
}
function Logo() {
  return (
    <div className="brand">
      <span className="school-crest">
        <img
          src="/assets/nguyen-khuyen-background.png"
          alt="Logo Trường THPT Nguyễn Khuyến"
        />
      </span>
      <div>
        <strong>
          green<span>edu</span>
        </strong>
        <small>THPT Nguyễn Khuyến</small>
      </div>
    </div>
  );
}
function Button({
  children,
  icon: Icon,
  variant = "primary",
  onClick,
  className = "",
  ...props
}) {
  return (
    <button
      className={`button ${variant} ${className}`}
      onClick={onClick}
      {...props}
    >
      {Icon && <Icon size={17} />}
      <span>{children}</span>
    </button>
  );
}
function Badge({ children, tone = "green" }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
function Progress({ value, label }) {
  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin="0"
      aria-valuemax="100"
      aria-label={label}
    >
      <span style={{ width: `${value}%` }} />
    </div>
  );
}
function Heading({ eyebrow, title, subtitle, action }) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {action}
    </div>
  );
}
function Modal({ title, children, onClose }) {
  useEffect(() => {
    const close = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", close);
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", close);
      document.body.style.overflow = old;
    };
  }, []);
  const ref = React.useRef(null);
  useEffect(() => {
    ref.current?.querySelector("input,button")?.focus();
  }, []);
  function trap(e) {
    if (e.key !== "Tab") return;
    const items = [
      ...ref.current.querySelectorAll("button,input,select,textarea,a[href]"),
    ].filter((x) => !x.disabled);
    if (e.shiftKey && document.activeElement === items[0]) {
      e.preventDefault();
      items.at(-1).focus();
    } else if (!e.shiftKey && document.activeElement === items.at(-1)) {
      e.preventDefault();
      items[0].focus();
    }
  }
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        ref={ref}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onKeyDown={trap}
      >
        <div className="modal-heading">
          <div className="modal-mark">
            <Sprout size={22} />
          </div>
          <button className="icon-button" aria-label="Đóng" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <h2>{title}</h2>
        {children}
      </section>
    </div>
  );
}

function App() {
  const [page, setPage] = useState(role === "admin" ? "accounts" : "home");
  const [prefs, setPrefs] = useState({
    theme: "garden",
    radius: 24,
    density: "comfortable",
    school: true,
  });
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [checked, setChecked] = useState(false);
  const [newClasses, setNewClasses] = useState([]);
  const [mobileNav, setMobileNav] = useState(false);
  const isTeacher = role === "teacher";
  const admin = role === "admin";
  const name = admin
    ? "Quản trị viên"
    : isTeacher
      ? "Nguyễn Minh Anh"
      : "Trần Hà Linh";
  const nav = admin
    ? [
        { id: "accounts", label: "Quản lý tài khoản", icon: ShieldCheck },
        { id: "classes", label: "Các lớp học", icon: Users },
      ]
    : isTeacher
      ? [
          { id: "home", label: "Tổng quan", icon: LayoutDashboard },
          { id: "classes", label: "Lớp học của tôi", icon: Users },
          { id: "questions", label: "Ngân hàng câu hỏi", icon: BookOpen },
          { id: "learning", label: "Ôn tập & kiểm tra", icon: Clock3 },
          { id: "progress", label: "Tiến độ học tập", icon: TrendingUp },
          { id: "groups", label: "Hoạt động nhóm", icon: Users },
        ]
      : [
          { id: "home", label: "Khu vườn của tôi", icon: Sprout },
          { id: "practice", label: "Luyện tập", icon: BookOpen },
          { id: "corrections", label: "Sổ tay sửa sai", icon: CheckCircle2 },
          { id: "learning", label: "Ôn tập & kiểm tra", icon: Clock3 },
          { id: "groups", label: "Hoạt động nhóm", icon: Users },
          { id: "progress", label: "Hành trình của tôi", icon: TrendingUp },
        ];
  useEffect(() => {
    const receive = (e) => {
      if (
        e.origin !== location.origin ||
        e.source !== window.parent ||
        e.data?.type !== "garden-preferences"
      )
        return;
      const p = e.data.prefs;
      setPrefs({
        theme: p.theme === "sunny" ? "sunny" : "garden",
        radius: Math.max(12, Math.min(32, Number(p.radius) || 24)),
        density: p.density === "compact" ? "compact" : "comfortable",
        school: !!p.school,
      });
    };
    window.addEventListener("message", receive);
    window.parent.postMessage({ type: "garden-ready" }, location.origin);
    return () => window.removeEventListener("message", receive);
  }, []);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 4500);
      return () => clearTimeout(t);
    }
  }, [toast]);
  function go(next) {
    setPage(next);
    setMobileNav(false);
    setSearch("");
    setChecked(false);
    setSelected(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function practice() {
    setQuestionIndex(0);
    go("practice");
  }
  function notify(
    text = "Đã cập nhật trong bản xem trước. Không thay đổi dữ liệu thật.",
  ) {
    setToast(text);
  }
  const q = questions[questionIndex];
  const correct = selected === q.correct;
  const style = {
    "--radius": `${prefs.radius}px`,
    "--space": prefs.density === "compact" ? "20px" : "28px",
    "--school-opacity": prefs.school ? ".038" : "0",
  };
  const userProgress = (
    <div className="personal-progress card">
      <div className="section-heading">
        <div>
          <span className="eyebrow">TỪNG CHÚT MỘT, MỖI NGÀY</span>
          <h2>Hành trình lớn lên</h2>
        </div>
        <Badge>Chồi · Cấp 2</Badge>
      </div>
      <div className="growth-row">
        {["Mầm", "Chồi", "Cây Non", "Đơm Hoa", "Kết Trái"].map((n, i) => (
          <div className={`growth-step ${i === 1 ? "current" : ""}`} key={n}>
            <Plant stage={i + 1} />
            <strong>{n}</strong>
            <small>{i === 0 ? "Bắt đầu" : `${i} giờ`}</small>
          </div>
        ))}
      </div>
      <Progress value={42} label="Tiến độ tới cấp Cây Non" />
      <p className="caption">Thêm 35 phút chăm chỉ để đón một cây non mới.</p>
    </div>
  );
  if (role === "login")
    return (
      <div
        className={`theme-${prefs.theme} preview-app login-scene`}
        style={style}
      >
        <div className="login-top">
          <Logo />
          <span className="login-school">
            <Leaf size={15} />
            Nơi mỗi ngày là một cơ hội lớn lên
          </span>
        </div>
        <main className="login-grid">
          <section className="login-story">
            <Badge tone="warm">
              <Sun size={14} />
              Gieo tri thức, gặt tương lai
            </Badge>
            <h1>
              Một chút chăm chỉ.
              <br />
              Một khu vườn xanh.
            </h1>
            <p>
              Mỗi bài học là một hạt mầm. Cùng GreenEdu nuôi dưỡng kiến thức,
              từng bước một.
            </p>
            <img
              className="login-art"
              src="/assets/knowledge-garden-v1.webp"
              alt="Khu vườn kiến thức trên trang sách"
            />
            <div className="login-principles">
              <span>
                <Sprout size={17} />
                Học theo nhịp của bạn
              </span>
              <span>
                <Heart size={17} />
                Sửa sai để trưởng thành
              </span>
            </div>
          </section>
          <section className="login-form card">
            <span className="welcome-symbol">
              <Leaf size={24} />
            </span>
            <span className="eyebrow">CHÀO MỪNG TRỞ LẠI</span>
            <h2>Mở khu vườn của bạn</h2>
            <p>Đăng nhập để tiếp tục hành trình học tập.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                notify(
                  "Đây là biểu mẫu minh họa. Chọn màn hình Học sinh hoặc Giáo viên trên thanh preview để xem tiếp.",
                );
              }}
            >
              <label>
                Email hoặc tên đăng nhập
                <input
                  autoComplete="off"
                  required
                  placeholder="Tên tài khoản của bạn"
                />
              </label>
              <label>
                Mật khẩu
                <input
                  type="password"
                  autoComplete="off"
                  required
                  placeholder="Nhập mật khẩu"
                />
              </label>
              <div className="login-form-extra">
                <label className="check-label">
                  <input type="checkbox" />
                  Ghi nhớ đăng nhập
                </label>
                <button
                  type="button"
                  className="text-link"
                  onClick={() =>
                    notify("Liên hệ giáo viên để được cấp lại mật khẩu.")
                  }
                >
                  Quên mật khẩu?
                </button>
              </div>
              <Button className="wide" type="submit">
                Vào khu vườn <ArrowRight size={17} />
              </Button>
            </form>
            <div className="login-support">
              <ShieldCheck size={18} />
              <p>
                Tài khoản được cấp bởi nhà trường.
                <br />
                Cần trợ giúp? Hãy liên hệ giáo viên của bạn.
              </p>
            </div>
          </section>
        </main>
        <footer className="login-footer">
          GreenEdu · Cùng nhau nuôi dưỡng tri thức
          <span>THPT Nguyễn Khuyến</span>
        </footer>
        {toast && <Toast text={toast} close={() => setToast("")} />}
      </div>
    );
  return (
    <div
      className={`preview-app theme-${prefs.theme} density-${prefs.density}`}
      style={style}
    >
      <aside className={`sidebar ${mobileNav ? "show" : ""}`}>
        <Logo />
        <div className="workspace-caption">
          {admin
            ? "TRANG QUẢN TRỊ"
            : isTeacher
              ? "GÓC GIÁO VIÊN"
              : "GÓC HỌC TẬP"}
        </div>
        <nav aria-label="Điều hướng chính">
          {nav.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              aria-current={page === id ? "page" : undefined}
              className={`nav-link ${page === id ? "active" : ""}`}
              onClick={() => go(id)}
            >
              <Icon size={19} />
              <span>{label}</span>
              {id === "corrections" && <span className="nav-counter">3</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-message">
            <Leaf size={20} />
            <strong>Mỗi ngày, một chút xanh</strong>
            <p>
              Không cần đi thật nhanh.
              <br />
              Chỉ cần tiếp tục lớn lên.
            </p>
            <span className="mini-seed">✦</span>
          </div>
          <button className="nav-link" onClick={() => setModal("profile")}>
            <Settings size={19} />
            Tài khoản của tôi
          </button>
          <button
            className="nav-link"
            onClick={() =>
              notify(
                "Bạn đang ở bản xem trước. Chọn Đăng nhập trên thanh phía trên để xem màn hình đăng nhập.",
              )
            }
          >
            <LogOut size={19} />
            Đăng xuất
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="mobile-brand">
            <Logo />
            <button
              className="icon-button"
              aria-label="Mở menu"
              onClick={() => setMobileNav(!mobileNav)}
            >
              <MoreHorizontal size={21} />
            </button>
          </div>
          <div className="breadcrumbs">
            <span>
              {admin
                ? "Quản trị"
                : isTeacher
                  ? "Trang giáo viên"
                  : "Trang học tập"}
            </span>
            <ChevronRight size={14} />
            <strong>{nav.find((n) => n.id === page)?.label}</strong>
          </div>
          <div className="header-controls">
            {!admin && (
              <label className="class-picker">
                <BookOpen size={16} />
                <select
                  aria-label="Lớp học đang xem"
                  onChange={(e) =>
                    notify(`Đã chọn ${e.target.value} trong preview.`)
                  }
                >
                  <option>Lớp 10A1 · Vật lý</option>
                  <option>Lớp 10A2 · Toán</option>
                </select>
                <ChevronDown size={15} />
              </label>
            )}
            <button
              className="icon-button notification-button"
              aria-label="Thông báo"
              onClick={() => setModal("notifications")}
            >
              <Bell size={19} />
              <i />
            </button>
            <button className="profile" onClick={() => setModal("profile")}>
              <span className="avatar">
                {admin ? "QT" : isTeacher ? "MA" : "HL"}
              </span>
              <span>
                <strong>{name}</strong>
                <small>
                  {admin
                    ? "Quản trị viên"
                    : isTeacher
                      ? "Giáo viên"
                      : "Học sinh · Chồi"}
                </small>
              </span>
              <ChevronDown size={13} />
            </button>
          </div>
        </header>
        <main className="main">
          {page === "home" && (
            <>
              <Heading
                eyebrow={
                  isTeacher
                    ? "CÙNG HỌC SINH GIEO NHỮNG MẦM XANH"
                    : "HỌC MỘT CHÚT · LỚN MỘT CHÚT"
                }
                title={
                  isTeacher
                    ? "Chào cô Minh Anh, một ngày thật xanh!"
                    : "Chào Hà Linh, hôm nay mình học gì?"
                }
                subtitle={
                  isTeacher
                    ? "Nhìn thấy nỗ lực, đồng hành với từng học sinh."
                    : "Khu vườn nhỏ đang lớn lên từ những cố gắng của bạn."
                }
                action={
                  <div className="today-chip">
                    <Sun size={18} />
                    <span>Chúc bạn một ngày tốt lành</span>
                  </div>
                }
              />
              <div className="home-feature-grid">
                <section className="garden-hero card">
                  <div className="hero-copy">
                    <Badge>
                      <Leaf size={13} />
                      {isTeacher ? "GÓC CHĂM VƯỜN" : "KHU VƯỜN KIẾN THỨC"}
                    </Badge>
                    <h2>
                      {isTeacher ? (
                        <>
                          Một lớp học.
                          <br />
                          Nhiều cơ hội lớn lên.
                        </>
                      ) : (
                        <>
                          Gieo nỗ lực hôm nay,
                          <br />
                          đón tri thức ngày mai.
                        </>
                      )}
                    </h2>
                    <p>
                      {isTeacher
                        ? "Mỗi học sinh một nhịp học. Cùng chuẩn bị những bài học để các em tự tin hơn."
                        : "Dành một chút thời gian cho bài học mới. Mỗi câu trả lời là một bước tiến nhỏ."}
                    </p>
                    <div className="hero-actions">
                      <Button
                        onClick={isTeacher ? () => go("questions") : practice}
                      >
                        {isTeacher
                          ? "Chuẩn bị bài luyện tập"
                          : "Tiếp tục luyện tập"}
                        <ArrowRight size={17} />
                      </Button>
                      <button
                        className="text-link"
                        onClick={() => go("progress")}
                      >
                        Xem hành trình
                      </button>
                    </div>
                  </div>
                  <img
                    className="hero-garden"
                    src="/assets/knowledge-garden-v1.webp"
                    alt="Cây xanh mọc trên cuốn sách"
                  />
                  <span className="hero-speck one">✦</span>
                  <span className="hero-speck two">✧</span>
                </section>
                <section className="daily-card card">
                  <div className="daily-heading">
                    <span className="circle-icon sand">
                      <Sun size={20} />
                    </span>
                    <Badge tone="warm">HÔM NAY</Badge>
                  </div>
                  <h2>
                    {isTeacher ? "Một chút quan tâm" : "Một nhịp học nhẹ nhàng"}
                  </h2>
                  <p>
                    {isTeacher
                      ? "Có 3 học sinh đang cần một lời động viên ở chương Động học."
                      : "Mục tiêu nhỏ giúp mình tiến xa hơn. Hôm nay thử học thêm 15 phút nhé."}
                  </p>
                  <div className="daily-goal">
                    <strong>
                      {isTeacher ? "3" : "10"}
                      <small>
                        {isTeacher ? "học sinh cần hỗ trợ" : "/ 15 phút"}
                      </small>
                    </strong>
                    <Progress
                      value={isTeacher ? 35 : 67}
                      label="Mục tiêu hôm nay"
                    />
                  </div>
                  <button
                    className="text-link"
                    onClick={isTeacher ? () => go("progress") : practice}
                  >
                    {isTeacher ? "Xem tiến độ lớp" : "Bắt đầu một bước nhỏ"}
                    <ArrowRight size={16} />
                  </button>
                </section>
              </div>
              <div className="metrics-grid">
                {(isTeacher
                  ? [
                      {
                        label: "Học sinh trong lớp",
                        value: "25",
                        note: "Cùng gieo những mầm xanh",
                        icon: Users,
                        color: "sage",
                      },
                      {
                        label: "Câu hỏi đã chuẩn bị",
                        value: "36",
                        note: "Trong 3 chương học",
                        icon: BookOpen,
                        color: "sand",
                      },
                      {
                        label: "Tỷ lệ trả lời đúng",
                        value: "78%",
                        note: "Từng chút một, tiến bộ hơn",
                        icon: Target,
                        color: "peach",
                      },
                    ]
                  : [
                      {
                        label: "Thời gian chăm chỉ",
                        value: "2 giờ 5 phút",
                        note: "Những phút học có ý nghĩa",
                        icon: Clock3,
                        color: "sage",
                      },
                      {
                        label: "Tỷ lệ trả lời đúng",
                        value: "78%",
                        note: "Từ những lượt luyện tập",
                        icon: CheckCircle2,
                        color: "sand",
                      },
                      {
                        label: "Câu cần chăm lại",
                        value: "3 câu",
                        note: "Một cơ hội để hiểu sâu hơn",
                        icon: Leaf,
                        color: "peach",
                      },
                    ]
                ).map((m) => (
                  <div className="metric-card card" key={m.label}>
                    <span className={`circle-icon ${m.color}`}>
                      <m.icon size={20} />
                    </span>
                    <div>
                      <span>{m.label}</span>
                      <strong>{m.value}</strong>
                      <small>{m.note}</small>
                    </div>
                  </div>
                ))}
              </div>
              <div className="section-heading">
                <div>
                  <h2>
                    {isTeacher
                      ? "Chuẩn bị cho buổi học"
                      : "Những mầm xanh của bạn"}
                  </h2>
                  <p>
                    {isTeacher
                      ? "Ba việc nhỏ để khởi đầu một ngày nhiều cảm hứng."
                      : "Vật lý · Lớp 10A1 · Mỗi chương là một góc vườn"}
                  </p>
                </div>
                <button
                  className="text-link"
                  onClick={isTeacher ? () => go("classes") : practice}
                >
                  {isTeacher ? "Xem lớp học" : "Xem tất cả bài học"}
                  <ArrowRight size={16} />
                </button>
              </div>
              {isTeacher ? (
                <div className="quick-actions">
                  {[
                    {
                      title: "Thêm học sinh",
                      text: "Đón một thành viên vào lớp.",
                      icon: Users,
                      color: "sage",
                      fn: () => setModal("student"),
                    },
                    {
                      title: "Tạo chương học",
                      text: "Tổ chức kiến thức theo chặng.",
                      icon: BookOpen,
                      color: "sand",
                      fn: () => setModal("chapter"),
                    },
                    {
                      title: "Theo dõi tiến độ",
                      text: "Hiểu học sinh để hỗ trợ tốt hơn.",
                      icon: TrendingUp,
                      color: "peach",
                      fn: () => go("progress"),
                    },
                  ].map((a) => (
                    <button
                      className="quick-action card"
                      key={a.title}
                      onClick={a.fn}
                    >
                      <span className={`circle-icon ${a.color}`}>
                        <a.icon size={20} />
                      </span>
                      <strong>{a.title}</strong>
                      <p>{a.text}</p>
                      <ArrowRight size={18} />
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  <div className="chapters-grid">
                    {chapters.map((c, i) => (
                      <ChapterCard
                        key={c.title}
                        chapter={c}
                        index={i}
                        onStudy={practice}
                      />
                    ))}
                  </div>
                  <div className="bottom-garden-grid">
                    {userProgress}
                    <div className="reminder-card card">
                      <span className="circle-icon sand">
                        <Heart size={21} />
                      </span>
                      <h2>
                        Sai một câu,
                        <br />
                        hiểu thêm một điều.
                      </h2>
                      <p>
                        Mỗi lần sửa sai là một lần chăm lại khu vườn. Không sao
                        cả, mình cùng thử lại nhé.
                      </p>
                      <Button
                        variant="secondary"
                        onClick={() => go("corrections")}
                      >
                        Mở sổ tay sửa sai
                        <ArrowRight size={16} />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
          {page === "practice" && (
            <>
              <Heading
                eyebrow="CHĂM MỘT CHÚT, HIỂU THÊM MỘT CHÚT"
                title="Góc luyện tập"
                subtitle="Chương 1 · Mở đầu · Vật lý 10"
                action={
                  <Button
                    variant="secondary"
                    icon={ArrowLeft}
                    onClick={() => go("home")}
                  >
                    Về khu vườn
                  </Button>
                }
              />
              <div className="practice-layout">
                <section className="question-card card">
                  <div className="question-top">
                    <Badge>Bài luyện tập chung</Badge>
                    <span className="caption">Câu {questionIndex + 1} / 3</span>
                  </div>
                  <Progress
                    value={((questionIndex + 1) / 3) * 100}
                    label="Tiến độ bài luyện tập"
                  />
                  <h2>{q.text}</h2>
                  <p className="caption">Chọn một đáp án mà bạn cho là đúng.</p>
                  <div className="choices">
                    {q.answers.map((answer, i) => (
                      <button
                        key={answer}
                        disabled={checked}
                        className={`choice ${selected === i ? "selected" : ""} ${checked && i === q.correct ? "correct" : ""} ${checked && selected === i && !correct ? "incorrect" : ""}`}
                        onClick={() => setSelected(i)}
                      >
                        <span className="choice-letter">{"ABCD"[i]}</span>
                        <span>{answer}</span>
                        <span className="choice-check">
                          {(checked && i === q.correct) ||
                          (selected === i && !checked) ? (
                            <Check size={17} />
                          ) : null}
                        </span>
                      </button>
                    ))}
                  </div>
                  {checked && (
                    <div
                      className={`answer-feedback ${correct ? "positive" : "gentle"}`}
                      role="status"
                    >
                      <div>
                        <CheckCircle2 size={19} />
                        <strong>
                          {correct
                            ? "Tốt lắm! Bạn vừa nuôi thêm một mầm xanh."
                            : "Một cơ hội để mình hiểu rõ hơn."}
                        </strong>
                      </div>
                      <p>{q.explanation}</p>
                    </div>
                  )}
                  <div className="question-actions">
                    <Button
                      variant="ghost"
                      disabled={questionIndex === 0}
                      icon={ArrowLeft}
                      onClick={() => {
                        setQuestionIndex(questionIndex - 1);
                        setSelected(null);
                        setChecked(false);
                      }}
                    >
                      Câu trước
                    </Button>
                    {!checked ? (
                      <Button
                        disabled={selected === null}
                        onClick={() => setChecked(true)}
                      >
                        Kiểm tra đáp án
                        <ArrowRight size={17} />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          if (questionIndex === 2) {
                            go("home");
                            notify("Bạn đã hoàn thành bài luyện tập minh họa.");
                          } else {
                            setQuestionIndex(questionIndex + 1);
                            setSelected(null);
                            setChecked(false);
                          }
                        }}
                      >
                        {questionIndex === 2 ? "Về khu vườn" : "Câu tiếp theo"}
                        <ArrowRight size={17} />
                      </Button>
                    )}
                  </div>
                </section>
                <aside className="study-aside">
                  <div className="card study-garden">
                    <Plant stage={2} />
                    <Badge>CHƯƠNG 1 · CHỒI</Badge>
                    <h3>Mầm xanh đang lớn</h3>
                    <p>
                      Mỗi lần thử là một lần học.
                      <br />
                      Cứ tiếp tục theo nhịp của bạn.
                    </p>
                  </div>
                  <div className="study-note">
                    <Leaf size={18} />
                    <p>
                      Thời gian có hoạt động mới được tính vào hành trình học.
                    </p>
                  </div>
                </aside>
              </div>
            </>
          )}
          {page === "classes" && (
            <>
              <Heading
                eyebrow="CÙNG NHAU GIEO TRI THỨC"
                title={admin ? "Các lớp học" : "Lớp học của tôi"}
                subtitle="Mỗi lớp học là một khu vườn nhỏ, mỗi học sinh là một mầm xanh."
                action={
                  <Button icon={Plus} onClick={() => setModal("class")}>
                    Tạo lớp học
                  </Button>
                }
              />
              <div className="filter-panel card">
                <label className="search-field">
                  <Search size={18} />
                  <input
                    aria-label="Tìm lớp học"
                    placeholder="Tìm lớp hoặc môn học..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
                <span className="caption">
                  {3 + newClasses.length} lớp minh họa
                </span>
              </div>
              <div className="classes-grid">
                {[
                  {
                    title: "Lớp 10A1",
                    subject: "Vật lý",
                    members: 25,
                    color: "sage",
                  },
                  {
                    title: "Lớp 10A2",
                    subject: "Vật lý",
                    members: 28,
                    color: "sand",
                  },
                  {
                    title: "Lớp 11A1",
                    subject: "Vật lý",
                    members: 24,
                    color: "peach",
                  },
                  ...newClasses,
                ]
                  .filter((c) =>
                    (c.title + c.subject)
                      .toLowerCase()
                      .includes(search.toLowerCase()),
                  )
                  .map((c, i) => (
                    <article className="class-card card" key={i}>
                      <div className={`class-art ${c.color}`}>
                        <BookOpen size={30} />
                        <span className="class-art-leaf">
                          <Leaf size={64} />
                        </span>
                        <Badge tone="white">
                          Khối {c.title.includes("11") ? "11" : "10"}
                        </Badge>
                      </div>
                      <div className="class-body">
                        <div className="section-heading">
                          <h2>{c.title}</h2>
                          <button
                            className="icon-button"
                            aria-label={`Thông tin ${c.title}`}
                            onClick={() => setModal("class-info")}
                          >
                            <MoreHorizontal size={20} />
                          </button>
                        </div>
                        <p>{c.subject} · Học kỳ I</p>
                        <div className="class-meta">
                          <span>
                            <Users size={15} />
                            {c.members} học sinh
                          </span>
                          <span>
                            <BookOpen size={15} />3 chương
                          </span>
                        </div>
                        <div className="class-avatars">
                          {students.slice(0, 3).map((s) => (
                            <span key={s.name} className={`avatar ${s.color}`}>
                              {s.initials}
                            </span>
                          ))}
                          <span className="caption">
                            Cùng học, cùng lớn lên
                          </span>
                        </div>
                        <Button
                          variant="secondary"
                          className="wide"
                          onClick={() => go("progress")}
                        >
                          Vào lớp học
                          <ArrowRight size={16} />
                        </Button>
                      </div>
                    </article>
                  ))}
              </div>
            </>
          )}
          {(page === "questions" || page === "corrections") && (
            <>
              <Heading
                eyebrow={
                  page === "questions"
                    ? "NỀN TẢNG CỦA MỖI BÀI HỌC"
                    : "CHĂM LẠI NHỮNG GÓC VƯỜN"
                }
                title={
                  page === "questions" ? "Ngân hàng câu hỏi" : "Sổ tay sửa sai"
                }
                subtitle={
                  page === "questions"
                    ? "Câu hỏi rõ ràng, lời giải tốt giúp học sinh tự học hiệu quả."
                    : "Sai sót không phải điểm dừng. Cùng hiểu lại từng câu, từng chút một."
                }
                action={
                  page === "questions" ? (
                    <Button icon={Plus} onClick={() => setModal("question")}>
                      Thêm câu hỏi
                    </Button>
                  ) : (
                    <Badge tone="warm">3 câu cần chăm lại</Badge>
                  )
                }
              />
              <div className="question-filters card">
                <label>
                  Chương học
                  <select>
                    <option>Chương 1 · Mở đầu</option>
                    <option>Chương 2 · Động học</option>
                  </select>
                </label>
                <label>
                  Bài học
                  <select>
                    <option>Tất cả bài học</option>
                    <option>Bài luyện tập chung</option>
                  </select>
                </label>
                {page === "questions" && (
                  <Button
                    variant="secondary"
                    icon={Download}
                    onClick={() =>
                      notify(
                        "Bản xem trước minh họa bố cục nhập câu hỏi. Chức năng nhập file sẽ được giữ khi áp dụng vào app.",
                      )
                    }
                  >
                    Nhập câu hỏi
                  </Button>
                )}
              </div>
              <div className="question-bank">
                {questions.map((question, i) => (
                  <article className="bank-card card" key={question.text}>
                    <div className="question-top">
                      <span className="caption">
                        Bài luyện tập chung · Câu {i + 1}
                      </span>
                      <Badge tone={page === "questions" ? "green" : "warm"}>
                        {page === "questions" ? "Đang sử dụng" : "Cần sửa sai"}
                      </Badge>
                    </div>
                    <h3>{question.text}</h3>
                    {page === "questions" ? (
                      <>
                        <div className="bank-answers">
                          {question.answers.map((a, j) => (
                            <div
                              className={j === question.correct ? "right" : ""}
                              key={a}
                            >
                              <strong>{"ABCD"[j]}</strong>
                              <span>{a}</span>
                              {j === question.correct && (
                                <CheckCircle2 size={17} />
                              )}
                            </div>
                          ))}
                        </div>
                        <details className="bank-explanation">
                          <summary>Xem lời giải</summary>
                          <p>{question.explanation}</p>
                        </details>
                        <div className="bank-actions">
                          <Button
                            variant="secondary"
                            onClick={() => setModal("question")}
                          >
                            Chỉnh sửa
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() =>
                              notify(
                                "Câu hỏi chỉ được ẩn minh họa; dữ liệu thật không thay đổi.",
                              )
                            }
                          >
                            Ẩn câu hỏi
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="caption">
                          Đọc lại bài học rồi thử trả lời một lần nữa.
                        </p>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setQuestionIndex(i);
                            go("practice");
                          }}
                        >
                          Chăm lại câu này
                          <ArrowRight size={16} />
                        </Button>
                      </>
                    )}
                  </article>
                ))}
              </div>
            </>
          )}
          {(page === "progress" || page === "accounts") && (
            <>
              <Heading
                eyebrow={
                  admin
                    ? "CHĂM SÓC CỘNG ĐỒNG HỌC TẬP"
                    : isTeacher
                      ? "NHÌN THẤY NHỮNG NỖ LỰC NHỎ"
                      : "MỖI BƯỚC ĐỀU CÓ Ý NGHĨA"
                }
                title={
                  admin
                    ? "Quản lý tài khoản"
                    : isTeacher
                      ? "Tiến độ học tập"
                      : "Hành trình của tôi"
                }
                subtitle={
                  admin
                    ? "Cấp tài khoản để giáo viên và học sinh bắt đầu khu vườn kiến thức."
                    : isTeacher
                      ? "Theo dõi để đồng hành, động viên và hỗ trợ học sinh."
                      : "Những nỗ lực của bạn đang nuôi dưỡng một khu vườn xanh."
                }
                action={
                  <Button
                    icon={admin ? Plus : Download}
                    onClick={() =>
                      admin
                        ? setModal("student")
                        : notify(
                            "Bạn đang xem bản thiết kế. Xuất báo cáo minh họa chưa kết nối dữ liệu thật.",
                          )
                    }
                  >
                    {admin ? "Tạo tài khoản" : "Xuất báo cáo"}
                  </Button>
                }
              />
              {!admin && !isTeacher && userProgress}
              <section className="roster-card card">
                <div className="roster-toolbar">
                  <div>
                    <h2>
                      {admin
                        ? "Danh sách tài khoản"
                        : isTeacher
                          ? "Khu vườn lớp 10A1"
                          : "Chặng đường qua các chương"}
                    </h2>
                    <p className="caption">
                      {admin
                        ? "4 tài khoản minh họa"
                        : "Mỗi người một nhịp, cùng nhau tiến bộ"}
                    </p>
                  </div>
                  <label className="search-field">
                    <Search size={17} />
                    <input
                      aria-label="Tìm học sinh"
                      placeholder="Tìm theo tên hoặc email..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </label>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>
                          {admin
                            ? "Tài khoản"
                            : isTeacher
                              ? "Học sinh"
                              : "Chương học"}
                        </th>
                        <th>{admin ? "Vai trò" : "Thời gian học"}</th>
                        <th>{admin ? "Trạng thái" : "Cấp hiện tại"}</th>
                        <th>{admin ? "Lớp học" : "Tỷ lệ đúng"}</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(isTeacher || admin
                        ? students
                        : chapters.map((c, i) => ({
                            name: `Chương ${i + 1} · ${c.title}`,
                            email: c.lesson,
                            initials: `${i + 1}`,
                            progress: c.progress,
                            level: c.level,
                            time: `${c.minutes} phút`,
                            color: c.color,
                          }))
                      )
                        .filter((s) =>
                          (s.name + s.email)
                            .toLowerCase()
                            .includes(search.toLowerCase()),
                        )
                        .map((s) => (
                          <tr key={s.name}>
                            <td data-label={admin ? "Tài khoản" : "Học sinh"}>
                              <div className="student-info">
                                <span className={`avatar ${s.color}`}>
                                  {s.initials}
                                </span>
                                <div>
                                  <strong>{s.name}</strong>
                                  <small>{s.email}</small>
                                </div>
                              </div>
                            </td>
                            <td
                              data-label={admin ? "Vai trò" : "Thời gian học"}
                            >
                              {admin ? "Học sinh" : s.time}
                            </td>
                            <td
                              data-label={admin ? "Trạng thái" : "Cấp hiện tại"}
                            >
                              <Badge>
                                {admin ? "Đang hoạt động" : s.level}
                              </Badge>
                            </td>
                            <td data-label={admin ? "Lớp học" : "Tỷ lệ đúng"}>
                              {admin ? (
                                "Lớp 10A1"
                              ) : (
                                <div className="table-progress">
                                  <strong>{s.progress}%</strong>
                                  <Progress
                                    value={s.progress}
                                    label={`Tỷ lệ đúng của ${s.name}`}
                                  />
                                </div>
                              )}
                            </td>
                            <td data-label="Thao tác">
                              <button
                                className="text-link"
                                onClick={() =>
                                  setModal(
                                    admin ? "account-info" : "student-info",
                                  )
                                }
                              >
                                {admin ? "Quản lý" : "Chi tiết"}
                                <ChevronRight size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {search &&
                    !students.some((s) =>
                      (s.name + s.email)
                        .toLowerCase()
                        .includes(search.toLowerCase()),
                    ) &&
                    (isTeacher || admin) && (
                      <div className="empty-state">
                        <Search size={24} />
                        <p>Chưa có kết quả phù hợp. Thử một tên khác nhé.</p>
                      </div>
                    )}
                </div>
              </section>
            </>
          )}
          {page === "learning" && (
            <>
              <Heading
                eyebrow="VỮNG KIẾN THỨC, TỰ TIN BƯỚC TIẾP"
                title="Ôn tập & kiểm tra"
                subtitle="Một chặng ôn tập nhẹ nhàng trước khi thử sức với bài kiểm tra mới."
                action={
                  isTeacher ? (
                    <Button icon={Plus} onClick={() => setModal("exam")}>
                      Tạo bài kiểm tra
                    </Button>
                  ) : (
                    <Badge tone="warm">
                      <Target size={14} />
                      Học kỳ I
                    </Badge>
                  )
                }
              />
              <section className="learning-banner card">
                <div>
                  <Badge tone="warm">HÀNH TRANG SẴN SÀNG</Badge>
                  <h2>Chăm vườn đều, kiến thức vững.</h2>
                  <p>
                    Ôn lại những gì đã học và dành thời gian cho các câu cần sửa
                    sai.
                  </p>
                  <Button onClick={practice}>
                    Bắt đầu ôn tập
                    <ArrowRight size={17} />
                  </Button>
                </div>
                <Plant stage={4} />
              </section>
              <div className="section-heading">
                <div>
                  <h2>Các chặng ôn tập</h2>
                  <p>Chọn một chương để học theo nhịp của bạn.</p>
                </div>
              </div>
              <div className="chapters-grid">
                {chapters.map((c, i) => (
                  <ChapterCard
                    key={c.title}
                    chapter={c}
                    index={i}
                    onStudy={practice}
                  />
                ))}
              </div>
              <section className="exam-preview card">
                <div className="circle-icon peach">
                  <FileText size={22} />
                </div>
                <div>
                  <h2>Kiểm tra kiến thức · Học kỳ I</h2>
                  <p>20 phút · 15 câu hỏi · Kiến thức từ 3 chương</p>
                  <Badge>Đã sẵn sàng</Badge>
                </div>
                <Button variant="secondary" onClick={() => setModal("exam")}>
                  Xem bài kiểm tra
                  <ArrowRight size={16} />
                </Button>
              </section>
            </>
          )}
          {page === "groups" && (
            <>
              <Heading
                eyebrow="CÙNG LÀM, CÙNG LỚN LÊN"
                title="Góc hoạt động nhóm"
                subtitle="Một ý tưởng nhỏ, thêm những người bạn, thành một sản phẩm thật xanh."
                action={
                  isTeacher ? (
                    <Button icon={Plus} onClick={() => setModal("activity")}>
                      Tạo hoạt động
                    </Button>
                  ) : (
                    <Badge tone="warm">
                      <Users size={14} />
                      Lớp 10A1
                    </Badge>
                  )
                }
              />
              <div className="group-grid">
                {[
                  {
                    title: "Thiết kế một góc học tập xanh",
                    note: "Cùng tìm hiểu, lên ý tưởng và trình bày góc học tập của nhóm.",
                    color: "sage",
                    status: "Đang thực hiện",
                    icon: Leaf,
                  },
                  {
                    title: "Vật lý trong cuộc sống",
                    note: "Quan sát những hiện tượng quanh mình và giải thích bằng kiến thức đã học.",
                    color: "sand",
                    status: "Sắp đến hạn",
                    icon: Sun,
                  },
                ].map((g, i) => (
                  <article className="group-card card" key={g.title}>
                    <div className={`group-art ${g.color}`}>
                      <Plant stage={i === 0 ? 4 : 3} />
                      <span>
                        <g.icon size={38} />
                      </span>
                      <Badge tone="white">{g.status}</Badge>
                    </div>
                    <div className="group-body">
                      <h2>{g.title}</h2>
                      <p>{g.note}</p>
                      <div className="group-meta">
                        <span>
                          <Users size={16} />
                          Nhóm {i + 1} · 5 thành viên
                        </span>
                        <span>
                          <CalendarDays size={16} />
                          Còn {i === 0 ? "5" : "2"} ngày
                        </span>
                      </div>
                      <Button
                        variant="secondary"
                        className="wide"
                        onClick={() => setModal("group-info")}
                      >
                        Vào góc nhóm
                        <ArrowRight size={16} />
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
          <footer className="page-footer">
            <span>
              <Sprout size={15} />
              GreenEdu · Cùng nhau nuôi dưỡng tri thức
            </span>
            <span>Bản thiết kế · Dữ liệu minh họa</span>
          </footer>
        </main>
      </div>
      <nav className="mobile-bottom-nav" aria-label="Điều hướng nhanh">
        {nav.slice(0, 4).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={page === id ? "active" : ""}
            onClick={() => go(id)}
          >
            <Icon size={20} />
            <span>
              {id === "home"
                ? "Khu vườn"
                : id === "practice"
                  ? "Luyện tập"
                  : id === "learning"
                    ? "Ôn & thi"
                    : id === "corrections"
                      ? "Sửa sai"
                      : id === "classes"
                        ? "Lớp học"
                        : id === "questions"
                          ? "Câu hỏi"
                          : label}
            </span>
          </button>
        ))}
      </nav>
      {toast && <Toast text={toast} close={() => setToast("")} />}
      {modal && (
        <Modal
          title={
            {
              class: "Gieo một lớp học mới",
              student: admin ? "Tạo tài khoản học sinh" : "Đón thành viên mới",
              chapter: "Thêm một chặng học",
              question: "Chuẩn bị một câu hỏi",
              profile: "Góc nhỏ của bạn",
              notifications: "Một chút tin vui",
              "class-info": "Lớp 10A1 · Vật lý",
              "student-info": "Những nỗ lực nhỏ",
              "account-info": "Thông tin tài khoản",
              exam: "Bài kiểm tra học kỳ I",
              activity: "Khởi đầu một hoạt động",
              "group-info": "Góc học tập xanh · Nhóm 1",
            }[modal]
          }
          onClose={() => setModal(null)}
        >
          {["class", "student", "chapter", "question", "activity"].includes(
            modal,
          ) ? (
            <>
              <p className="modal-intro">
                Biểu mẫu minh họa cách trình bày mới. Thông tin chỉ được dùng
                trong bản xem trước.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const d = new FormData(e.target);
                  if (modal === "class")
                    setNewClasses([
                      ...newClasses,
                      {
                        title: d.get("name"),
                        subject: d.get("subject"),
                        members: 0,
                        color: "sage",
                      },
                    ]);
                  setModal(null);
                  notify(
                    "Đã lưu minh họa trong preview. Không ghi vào dữ liệu thật.",
                  );
                }}
              >
                <label>
                  {modal === "class"
                    ? "Tên lớp học"
                    : modal === "student"
                      ? "Họ và tên"
                      : modal === "question"
                        ? "Nội dung câu hỏi"
                        : modal === "chapter"
                          ? "Tên chương học"
                          : "Tên hoạt động"}
                  <input
                    name="name"
                    required
                    placeholder={
                      modal === "class"
                        ? "Ví dụ: Lớp 10A3"
                        : modal === "student"
                          ? "Nhập họ và tên"
                          : "Nhập nội dung"
                    }
                  />
                </label>
                {modal === "student" ? (
                  <label>
                    Email
                    <input
                      type="email"
                      required
                      placeholder="Email của học sinh"
                      autoComplete="off"
                    />
                  </label>
                ) : (
                  <div className="form-grid">
                    <label>
                      Môn học
                      <select name="subject">
                        <option>Vật lý</option>
                        <option>Toán</option>
                        <option>Sinh học</option>
                      </select>
                    </label>
                    <label>
                      Khối lớp
                      <select>
                        <option>Khối 10</option>
                        <option>Khối 11</option>
                        <option>Khối 12</option>
                      </select>
                    </label>
                  </div>
                )}
                <label>
                  Ghi chú
                  <textarea rows="3" placeholder="Thêm một chút thông tin..." />
                </label>
                <div className="modal-actions">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setModal(null)}
                  >
                    Để sau
                  </Button>
                  <Button type="submit" icon={Plus}>
                    {modal === "class" ? "Tạo lớp học" : "Lưu minh họa"}
                  </Button>
                </div>
              </form>
            </>
          ) : modal === "profile" ? (
            <>
              <div className="profile-card">
                <span className="avatar big">{isTeacher ? "MA" : "HL"}</span>
                <h3>{name}</h3>
                <Badge>{isTeacher ? "Giáo viên" : "Học sinh"}</Badge>
                <p>THPT Nguyễn Khuyến · Lớp 10A1</p>
              </div>
              <label>
                Tên hiển thị
                <input defaultValue={name} />
              </label>
              <Button
                className="wide"
                onClick={() => {
                  setModal(null);
                  notify();
                }}
              >
                Lưu thay đổi minh họa
              </Button>
            </>
          ) : modal === "notifications" ? (
            <>
              <div className="notification-item">
                <span className="circle-icon sage">
                  <Leaf size={19} />
                </span>
                <div>
                  <strong>Một mầm xanh mới đang chờ</strong>
                  <p>Tiếp tục bài luyện tập để chăm thêm cho khu vườn.</p>
                </div>
              </div>
              <div className="notification-item">
                <span className="circle-icon sand">
                  <Users size={19} />
                </span>
                <div>
                  <strong>Cùng làm một góc học tập xanh</strong>
                  <p>Nhóm của bạn có một hoạt động mới.</p>
                </div>
              </div>
              <Button
                variant="secondary"
                className="wide"
                onClick={() => {
                  setModal(null);
                  go("groups");
                }}
              >
                Xem hoạt động nhóm
              </Button>
            </>
          ) : modal === "exam" ? (
            <>
              <p className="modal-intro">
                Thử sức với kiến thức đã học theo nhịp của bạn.
              </p>
              <div className="exam-facts">
                <span>
                  <Clock3 size={20} />
                  <strong>20 phút</strong>
                  <small>Thời gian</small>
                </span>
                <span>
                  <FileText size={20} />
                  <strong>15 câu</strong>
                  <small>Câu hỏi</small>
                </span>
                <span>
                  <BookOpen size={20} />
                  <strong>3 chương</strong>
                  <small>Phạm vi</small>
                </span>
              </div>
              <div className="notice-panel">
                <CircleHelp size={19} />
                <p>
                  Đây là bản thiết kế minh họa. Bài thi và các điều kiện thật sẽ
                  được giữ nguyên khi cập nhật giao diện.
                </p>
              </div>
              <Button
                className="wide"
                onClick={() => {
                  setModal(null);
                  practice();
                }}
              >
                Thử giao diện làm bài
                <ArrowRight size={16} />
              </Button>
            </>
          ) : modal === "group-info" ? (
            <>
              <p className="modal-intro">
                Cùng thiết kế và trình bày một góc học tập xanh, gần gũi với
                thiên nhiên.
              </p>
              <div className="group-members">
                {students.map((s) => (
                  <div key={s.name}>
                    <span className={`avatar ${s.color}`}>{s.initials}</span>
                    <strong>{s.name}</strong>
                    <Badge>
                      {s.initials === "HL" ? "Đại diện" : "Thành viên"}
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="notice-panel">
                <FileText size={18} />
                <p>
                  Nhóm có thể nộp tài liệu hoặc liên kết sản phẩm. Bản xem trước
                  chỉ minh họa bố cục.
                </p>
              </div>
              <Button
                className="wide"
                onClick={() =>
                  notify(
                    "Nút nộp sản phẩm minh họa. Không gửi file hay dữ liệu lên server.",
                  )
                }
              >
                Nộp sản phẩm minh họa
                <ArrowRight size={16} />
              </Button>
            </>
          ) : (
            <>
              <p className="modal-intro">
                Thông tin minh họa giúp bạn xem cách bố trí dữ liệu trong khung
                mới.
              </p>
              <div className="profile-card">
                <Plant stage={3} />
                <h3>{modal === "class-info" ? "Lớp 10A1" : "Trần Hà Linh"}</h3>
                <Badge>Cùng học, cùng lớn lên</Badge>
                <p>Vật lý · 3 chương học · 78% câu trả lời đúng</p>
              </div>
              <Button
                variant="secondary"
                className="wide"
                onClick={() => setModal(null)}
              >
                Đã xem xong
              </Button>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
function ChapterCard({ chapter: c, index, onStudy }) {
  return (
    <article className="chapter-card card">
      <div className={`chapter-garden ${c.color}`}>
        <span className="chapter-number">0{index + 1}</span>
        <Plant stage={c.plant} />
        <Badge tone="white">{c.level}</Badge>
        <span className="tiny-flower">✧</span>
      </div>
      <div className="chapter-body">
        <span className="eyebrow">CHƯƠNG {index + 1} · VẬT LÝ</span>
        <h3>{c.title}</h3>
        <p>{c.lesson}</p>
        <div className="chapter-meta">
          <span>
            <Clock3 size={14} />
            {c.minutes} phút
          </span>
          <span>
            <BookOpen size={14} />
            {c.count} câu hỏi
          </span>
        </div>
        <Progress value={c.progress} label={`Tiến độ chương ${c.title}`} />
        <div className="chapter-progress">
          <span>Mầm xanh đang lớn</span>
          <strong>{c.progress}%</strong>
        </div>
        <Button variant="secondary" className="wide" onClick={onStudy}>
          Chăm cây · Luyện tập
          <ArrowRight size={16} />
        </Button>
      </div>
    </article>
  );
}
function Toast({ text, close }) {
  return (
    <div className="toast" role="status">
      <CheckCircle2 size={19} />
      <span>{text}</span>
      <button
        className="icon-button"
        aria-label="Đóng thông báo"
        onClick={close}
      >
        <X size={16} />
      </button>
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
