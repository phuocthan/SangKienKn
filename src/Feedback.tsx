import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  MessageSquare,
  Plus,
  RefreshCw,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { api, ApiError, errorMessage } from "./api";
import { Empty, Modal, SectionTitle } from "./components";
import { MessageComposer, conversationDate } from "./Conversation";
import type { Classroom, User } from "./types";
import type { FeedbackStatus, FeedbackThread } from "../shared/feedback";

const statusText: Record<FeedbackStatus, string> = {
  new: "Chờ phản hồi",
  replied: "Đã phản hồi",
  closed: "Đã xử lý",
};
export function Feedback({
  classroom,
  user,
}: {
  classroom: Classroom;
  user: User;
}) {
  const teacher = user.role === "teacher";
  const [threads, setThreads] = useState<FeedbackThread[]>([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const closeCreate = useCallback(() => setCreating(false), []);
  const sequence = useRef(0);
  const reload = useCallback(async () => {
    const ticket = ++sequence.current;
    try {
      const data = await api<{ threads: FeedbackThread[] }>(
        `/classrooms/${classroom.id}/feedback`,
      );
      if (ticket === sequence.current) {
        setThreads(data.threads);
        setError("");
        setUnavailable(false);
      }
    } catch (e) {
      if (ticket === sequence.current) {
        setUnavailable(e instanceof ApiError && e.status === 404);
        setError(errorMessage(e));
      }
    } finally {
      if (ticket === sequence.current) setLoading(false);
    }
  }, [classroom.id]);
  useEffect(() => {
    void reload();
    const timer = setInterval(() => void reload(), 20000);
    window.addEventListener("focus", reload);
    return () => {
      sequence.current++;
      clearInterval(timer);
      window.removeEventListener("focus", reload);
    };
  }, [reload]);
  function updated(thread: FeedbackThread) {
    sequence.current++;
    setThreads((rows) => [
      thread,
      ...rows.filter((row) => row.id !== thread.id),
    ]);
    setSelected(thread.id);
    setFilter("");
  }
  const active = threads.find((row) => row.id === selected);
  const visible = threads.filter(
    (row) =>
      (!filter || row.status === filter) &&
      `${row.title} ${row.studentName}`
        .toLocaleLowerCase("vi")
        .includes(search.toLocaleLowerCase("vi")),
  );
  async function changeStatus() {
    if (!active || busy) return;
    setBusy(true);
    setError("");
    try {
      updated(
        await api<FeedbackThread>(`/feedback/${active.id}/status`, {
          status: active.status === "closed" ? "new" : "closed",
        }),
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="feedback-page">
      <SectionTitle
        title={teacher ? "Quản lý góp ý" : "Góp ý với giáo viên"}
        description={
          teacher
            ? "Lắng nghe học sinh, phản hồi và theo dõi việc xử lý theo từng lớp."
            : `Gửi ý kiến riêng đến ${classroom.teacherName}. Chỉ bạn và giáo viên phụ trách lớp đọc được.`
        }
        action={
          <div className="button-group">
            <button className="button outline" onClick={() => void reload()}>
              <RefreshCw size={16} />
              Cập nhật
            </button>
            {!teacher && (
              <button
                className="button primary"
                disabled={loading || unavailable}
                onClick={() => setCreating(true)}
              >
                <Plus size={16} />
                Viết góp ý
              </button>
            )}
          </div>
        }
      />
      {unavailable ? (
        <div className="info-panel" role="status">
          Chức năng Góp ý đang chờ cập nhật server Railway.
        </div>
      ) : (
        error && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )
      )}
      {!unavailable && (
        <>
          <div className="feedback-filters">
            <label>
              Tìm góp ý
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  teacher ? "Tiêu đề hoặc tên học sinh…" : "Tìm theo tiêu đề…"
                }
              />
            </label>
            <label>
              Trạng thái
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="">Tất cả</option>
                {Object.entries(statusText).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {loading ? (
            <p role="status">Đang tải góp ý…</p>
          ) : (
            <div className="feedback-layout">
              <section className="feedback-list" aria-label="Danh sách góp ý">
                {!visible.length && (
                  <Empty
                    title={
                      threads.length
                        ? "Không có góp ý phù hợp"
                        : "Chưa có góp ý"
                    }
                    text={
                      teacher
                        ? "Góp ý của học sinh sẽ xuất hiện tại đây."
                        : "Ý kiến của bạn giúp lớp học tốt hơn mỗi ngày."
                    }
                  />
                )}
                {visible.map((thread) => (
                  <button
                    key={thread.id}
                    className={`card feedback-item ${selected === thread.id ? "selected" : ""}`}
                    aria-pressed={selected === thread.id}
                    onClick={() => setSelected(thread.id)}
                  >
                    <span className="pill">{statusText[thread.status]}</span>
                    <strong>{thread.title}</strong>
                    {teacher && <span>{thread.studentName}</span>}
                    <small>{conversationDate(thread.updatedAt)}</small>
                  </button>
                ))}
              </section>
              {active ? (
                <section
                  className="card feedback-detail"
                  aria-label="Nội dung góp ý"
                >
                  <div className="conversation-heading">
                    <div>
                      <span className="pill">{statusText[active.status]}</span>
                      <h2>{active.title}</h2>
                      <p>{active.studentName}</p>
                    </div>
                    {teacher && (
                      <button
                        className="button outline small"
                        disabled={busy}
                        onClick={() => void changeStatus()}
                      >
                        {active.status === "closed" ? (
                          <RotateCcw size={16} />
                        ) : (
                          <CheckCircle2 size={16} />
                        )}{" "}
                        {active.status === "closed"
                          ? "Mở lại"
                          : "Đánh dấu đã xử lý"}
                      </button>
                    )}
                  </div>
                  <div className="conversation-messages">
                    {active.messages.map((message) => (
                      <article
                        key={message.id}
                        className={`conversation-message ${message.authorRole}`}
                      >
                        <strong>
                          {message.authorName}
                          {message.authorRole === "teacher" && " · Giáo viên"}
                        </strong>
                        <small>{conversationDate(message.createdAt)}</small>
                        <p>{message.body}</p>
                      </article>
                    ))}
                  </div>
                  {active.status === "closed" ? (
                    <p className="subtle-note">
                      Góp ý đã được xử lý. Giáo viên có thể mở lại để tiếp tục
                      trao đổi.
                    </p>
                  ) : (
                    <MessageComposer
                      key={active.id}
                      label="Nội dung phản hồi"
                      submitLabel="Gửi phản hồi"
                      onSend={async (body, requestId) =>
                        updated(
                          await api<FeedbackThread>(
                            `/feedback/${active.id}/messages`,
                            { body, requestId },
                          ),
                        )
                      }
                    />
                  )}
                </section>
              ) : (
                <div className="card feedback-placeholder">
                  <MessageSquare size={32} />
                  <h2>Chọn một góp ý để đọc</h2>
                  <p>Các trao đổi với giáo viên được lưu tại đây.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
      {creating && (
        <CreateFeedback
          classroomId={classroom.id}
          onClose={closeCreate}
          onCreated={(thread) => {
            updated(thread);
            setCreating(false);
          }}
        />
      )}
    </div>
  );
}
function CreateFeedback({
  classroomId,
  onClose,
  onCreated,
}: {
  classroomId: string;
  onClose: () => void;
  onCreated: (thread: FeedbackThread) => void;
}) {
  const [title, setTitle] = useState(""),
    [body, setBody] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const request = useRef(crypto.randomUUID());
  const busyRef = useRef(false);
  busyRef.current = busy;
  const close = useCallback(() => {
    if (!busyRef.current) onClose();
  }, [onClose]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      onCreated(
        await api<FeedbackThread>(`/classrooms/${classroomId}/feedback`, {
          title,
          body,
          requestId: request.current,
        }),
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Viết góp ý" onClose={close}>
      <form className="message-composer" onSubmit={submit}>
        <p>Chia sẻ điều bạn muốn cải thiện hoặc cần giáo viên hỗ trợ.</p>
        <label>
          Tiêu đề
          <input
            required
            maxLength={160}
            value={title}
            disabled={busy}
            onChange={(e) => {
              setTitle(e.target.value);
              request.current = crypto.randomUUID();
            }}
          />
        </label>
        <label>
          Nội dung góp ý
          <textarea
            required
            maxLength={5000}
            rows={6}
            value={body}
            disabled={busy}
            onChange={(e) => {
              setBody(e.target.value);
              request.current = crypto.randomUUID();
            }}
          />
        </label>
        {error && (
          <p className="error-banner" role="alert">
            {error}
          </p>
        )}
        <div className="button-group">
          <button
            className="button outline"
            type="button"
            disabled={busy}
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            className="button primary"
            disabled={busy || !title.trim() || !body.trim()}
          >
            {busy ? "Đang gửi…" : "Gửi góp ý"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
