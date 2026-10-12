import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  CheckCircle2,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { api, errorMessage } from "./api";
import { Avatar } from "./Avatars";
import { PortraitActions } from "./PortraitActions";
import { Empty, GardenIllustration, Logo, Modal } from "./components";
import type { User } from "./types";

type Account = User & { classCount: number };
type AccountClass = {
  id: string;
  name: string;
  subject: string;
  teacherName: string;
};
const roleName = { admin: "Admin", teacher: "Giáo viên", student: "Học sinh" };

export function AdminWorkspace({
  user,
  onLogout,
  passwordForm,
  error: sessionError,
}: {
  user: User;
  onLogout: () => Promise<void>;
  passwordForm: ReactNode;
  error: string;
}) {
  const [page, setPage] = useState("accounts");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [classes, setClasses] = useState<AccountClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [editor, setEditor] = useState<"create" | Account | null>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const closePassword = useCallback(() => setPasswordOpen(false), []);
  const close = useCallback(() => setEditor(null), []);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [rows, classrooms] = await Promise.all([
        api<Account[]>("/accounts"),
        api<AccountClass[]>("/accounts/classrooms"),
      ]);
      setAccounts(rows);
      setClasses(classrooms);
      setError("");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void reload();
  }, [reload]);
  const filtered = accounts.filter(
    (a) =>
      (role === "all" || a.role === role) &&
      `${a.name} ${a.email}`
        .toLocaleLowerCase("vi")
        .includes(search.toLocaleLowerCase("vi")),
  );
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Logo school />
        <div className="workspace-label">TRANG QUẢN TRỊ</div>
        <nav aria-label="Điều hướng chính">
          <button
            className={`nav-item ${page === "accounts" ? "active" : ""}`}
            aria-current={page === "accounts" ? "page" : undefined}
            onClick={() => setPage("accounts")}
          >
            <Users size={20} />
            Quản lý tài khoản
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <ShieldCheck size={24} />
            <strong>Quản trị GreenEdu</strong>
            <p>Cấp tài khoản để giáo viên và học sinh bắt đầu học tập.</p>
          </div>
          <button
            className={`nav-item ${page === "settings" ? "active" : ""}`}
            aria-current={page === "settings" ? "page" : undefined}
            onClick={() => setPage("settings")}
          >
            <Settings size={19} />
            Tài khoản
          </button>
          <button className="nav-item" onClick={() => void onLogout()}>
            <LogOut size={19} />
            Đăng xuất
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <PortraitActions
            page={page}
            onAccount={() => setPage("settings")}
            onLogout={() => void onLogout()}
          />
          <div className="breadcrumb">
            Trang quản trị<span>/</span>
            <strong>
              {page === "accounts" ? "Quản lý tài khoản" : "Tài khoản"}
            </strong>
          </div>
          <div className="profile">
            <span className="avatar">AD</span>
            <div>
              <strong>{user.name}</strong>
              <small>Admin</small>
            </div>
          </div>
        </header>
        <main className="main-content">
          {(sessionError || error) && (
            <div className="error-banner" role="alert">
              {sessionError || error}
              <button onClick={() => void reload()}>Thử lại</button>
            </div>
          )}
          {notice && (
            <div className="success-banner" role="status">
              <CheckCircle2 size={18} />
              {notice}
            </div>
          )}
          {page === "settings" ? (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">TÀI KHOẢN CÁ NHÂN</span>
                  <h1>Bảo vệ tài khoản</h1>
                  <p>{user.email}</p>
                </div>
              </div>
              <section className="card account-settings">
                <h2>Đổi mật khẩu</h2>
                <p>Cập nhật mật khẩu để bảo vệ tài khoản quản trị.</p>
                <button
                  type="button"
                  className="button outline"
                  aria-haspopup="dialog"
                  onClick={() => setPasswordOpen(true)}
                >
                  <ShieldCheck size={18} />
                  Đổi mật khẩu
                </button>
              </section>
            </>
          ) : (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">QUẢN TRỊ TOÀN TRƯỜNG</span>
                  <h1>Quản lý tài khoản</h1>
                  <p>
                    Tạo tài khoản giáo viên, học sinh và cấp lại mật khẩu khi
                    cần.
                  </p>
                </div>
                <button
                  className="button primary"
                  onClick={() => setEditor("create")}
                >
                  <Plus size={17} />
                  Tạo tài khoản
                </button>
              </div>
              <div className="admin-welcome">
                <span className="admin-welcome-icon">
                  <ShieldCheck size={26} />
                </span>
                <div>
                  <strong>Kết nối lớp học, nuôi dưỡng tri thức.</strong>
                  <p>Mỗi tài khoản mở ra một hành trình học tập mới.</p>
                </div>
                <GardenIllustration className="admin-illustration" />
              </div>
              <div className="workspace-stats">
                {[
                  ["Tổng tài khoản", accounts.length],
                  [
                    "Giáo viên",
                    accounts.filter((a) => a.role === "teacher").length,
                  ],
                  [
                    "Học sinh",
                    accounts.filter((a) => a.role === "student").length,
                  ],
                  [
                    "Chờ đổi mật khẩu",
                    accounts.filter((a) => a.mustChange).length,
                  ],
                ].map(([label, value]) => (
                  <div className="card workspace-stat" key={label}>
                    <span>{label}</span>
                    <strong>{loading ? "—" : value}</strong>
                  </div>
                ))}
              </div>
              <section className="card accounts-card">
                <div className="workspace-filters">
                  <label className="search-input">
                    <Search size={18} />
                    <input
                      aria-label="Tìm tài khoản"
                      placeholder="Tìm theo tên hoặc email…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </label>
                  <select
                    aria-label="Lọc vai trò"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="all">Tất cả vai trò</option>
                    <option value="teacher">Giáo viên</option>
                    <option value="student">Học sinh</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    className="button outline"
                    disabled={loading}
                    onClick={() => void reload()}
                  >
                    <RefreshCw size={16} />
                    Cập nhật
                  </button>
                </div>
                {loading ? (
                  <div className="loading-panel" role="status">
                    Đang tải tài khoản…
                  </div>
                ) : !filtered.length ? (
                  <Empty
                    title="Không có tài khoản phù hợp"
                    text="Thử tên, email hoặc vai trò khác."
                  />
                ) : (
                  <>
                    <p className="subtle-note">
                      {filtered.length} tài khoản · Mật khẩu tạm được cung cấp
                      riêng cho người nhận.
                    </p>
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>Người dùng</th>
                            <th>Vai trò</th>
                            <th>Trạng thái</th>
                            <th>Lớp tham gia</th>
                            <th>Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((a) => (
                            <tr key={a.id}>
                              <td>
                                <div className="student-cell">
                                  <Avatar name={a.name} avatarId={a.avatarId} />
                                  <div>
                                    <strong>{a.name}</strong>
                                    <small>{a.email}</small>
                                  </div>
                                </div>
                              </td>
                              <td data-label="Vai trò">
                                <span className={`account-role ${a.role}`}>
                                  {roleName[a.role]}
                                </span>
                              </td>
                              <td data-label="Trạng thái">
                                {a.mustChange
                                  ? "Chờ đổi mật khẩu"
                                  : "Đã kích hoạt"}
                              </td>
                              <td data-label="Lớp tham gia">
                                {a.role === "student"
                                  ? a.classCount || "Chưa vào lớp"
                                  : "—"}
                              </td>
                              <td>
                                {a.role !== "admin" && (
                                  <button
                                    className="text-button"
                                    onClick={() => setEditor(a)}
                                  >
                                    Cấp lại mật khẩu
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </section>
            </>
          )}
          {passwordOpen && (
            <Modal
              title="Đổi mật khẩu"
              className="password-dialog"
              onClose={closePassword}
            >
              {passwordForm}
            </Modal>
          )}
          {editor && (
            <AccountEditor
              target={editor === "create" ? undefined : editor}
              classes={classes}
              onClose={close}
              onSaved={async (message) => {
                setEditor(null);
                setNotice(message);
                await reload();
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function AccountEditor({
  target,
  classes,
  onClose,
  onSaved,
}: {
  target?: Account;
  classes: AccountClass[];
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const [role, setRole] = useState("student");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    setError("");
    try {
      if (target)
        await api(`/accounts/${target.id}/password`, {
          password: data.password,
        });
      else await api("/accounts", data);
      await onSaved(
        target
          ? `Đã cấp lại mật khẩu cho ${target.name}. Các phiên đăng nhập cũ đã thu hồi.`
          : `Đã tạo tài khoản ${roleName[role as "student" | "teacher"].toLowerCase()} cho ${data.name} (${data.email}). Người nhận cần đổi mật khẩu ở lần đăng nhập đầu tiên.`,
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={target ? "Cấp lại mật khẩu" : "Tạo tài khoản"}
      onClose={onClose}
    >
      <form onSubmit={(e) => void submit(e)}>
        <fieldset disabled={busy} className="group-fieldset">
          <p className="form-intro">
            {target
              ? `Cấp mật khẩu tạm mới cho ${target.name} · ${target.email}.`
              : "Cung cấp email và mật khẩu tạm riêng cho người nhận. Người nhận phải đổi mật khẩu trước khi sử dụng."}
          </p>
          {!target && (
            <>
              <label>
                Vai trò
                <select
                  aria-label="Vai trò"
                  name="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="student">Học sinh</option>
                  <option value="teacher">Giáo viên</option>
                </select>
              </label>
              <label>
                Họ tên
                <input
                  name="name"
                  required
                  maxLength={100}
                  autoComplete="off"
                  placeholder="Họ và tên"
                />
              </label>
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  required
                  maxLength={254}
                  autoComplete="off"
                  placeholder="Email dùng để đăng nhập"
                />
              </label>
            </>
          )}
          <label>
            {target ? "Mật khẩu tạm mới" : "Mật khẩu tạm"}
            <input
              aria-label={target ? "Mật khẩu tạm mới" : "Mật khẩu tạm"}
              name="password"
              type="password"
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
            />
            <small>Từ 8 đến 128 ký tự.</small>
          </label>
          {!target && role === "student" && (
            <label>
              Lớp tham gia
              <select name="classroomId" defaultValue="">
                <option value="">Chưa xếp lớp</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {c.subject} · {c.teacherName}
                  </option>
                ))}
              </select>
              <small>
                Giáo viên có thể thêm học sinh vào lớp bằng email sau.
              </small>
            </label>
          )}
          {error && (
            <div className="error-banner" role="alert">
              {error}
            </div>
          )}
          <div className="modal-actions">
            <button className="button outline" type="button" onClick={onClose}>
              Hủy
            </button>
            <button className="button primary">
              {busy
                ? "Đang lưu…"
                : target
                  ? "Cấp mật khẩu tạm"
                  : "Tạo tài khoản"}
            </button>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}
