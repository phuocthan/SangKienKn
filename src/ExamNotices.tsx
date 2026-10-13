import { useEffect, useRef, useState } from "react";
import { BellRing, Clock3 } from "lucide-react";
import type { ExamNotice } from "../shared/learning";
import { api, ApiError, errorMessage } from "./api";
import { Modal } from "./components";
import "./exam-notices.css";

export function ExamNotices({
  onJoin,
  inLearning,
  userId,
}: {
  onJoin: (classroomId: string, runId: string) => void | Promise<void>;
  inLearning: boolean;
  userId: string;
}) {
  const [notices, setNotices] = useState<ExamNotice[]>([]);
  const [serverTime, setServerTime] = useState(0);
  const anchor = useRef({ time: 0, received: 0 });
  const [joining, setJoining] = useState("");
  const [error, setError] = useState("");
  const keys = useRef(new Map<string, string>());
  const storageKey = `greenedu-exam-notice-read:${userId}`;
  const [acknowledged, setAcknowledged] = useState<string[]>(() => {
    try {
      return JSON.parse(sessionStorage.getItem(storageKey) ?? "[]") as string[];
    } catch {
      return [];
    }
  });
  function acknowledge(id: string) {
    setAcknowledged((old) => {
      if (old.includes(id)) return old;
      const next = [...old, id];
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // The dialog still closes when browser storage is unavailable.
      }
      return next;
    });
  }
  useEffect(() => {
    let disposed = false,
      unavailable = false,
      loading = false;
    async function refresh() {
      if (
        disposed ||
        unavailable ||
        loading ||
        document.hidden ||
        !navigator.onLine
      )
        return;
      loading = true;
      try {
        const data = await api<{ serverNow: number; notices: ExamNotice[] }>(
          "/learning/exam-notices",
        );
        if (disposed) return;
        anchor.current = { time: data.serverNow, received: performance.now() };
        setServerTime(data.serverNow);
        setNotices(data.notices);
      } catch (e) {
        // Older Railway servers have no online-exam capability yet.
        if (e instanceof ApiError && [401, 403, 404].includes(e.status))
          unavailable = true;
      } finally {
        loading = false;
      }
    }
    void refresh();
    const timer = setInterval(() => void refresh(), 10000);
    const clock = setInterval(() => {
      if (anchor.current.time)
        setServerTime(
          anchor.current.time + performance.now() - anchor.current.received,
        );
    }, 1000);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("online", refresh);
    return () => {
      disposed = true;
      clearInterval(timer);
      clearInterval(clock);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("online", refresh);
    };
  }, []);
  async function join(notice: ExamNotice) {
    if (joining) return;
    setJoining(notice.id);
    setError("");
    try {
      if (!keys.current.has(notice.id))
        keys.current.set(notice.id, crypto.randomUUID());
      const run = notice.runId
        ? { id: notice.runId }
        : await api<{ id: string }>(
            `/classrooms/${notice.classroomId}/exam-runs`,
            {
              examId: notice.id,
              requestId: keys.current.get(notice.id),
            },
          );
      await onJoin(notice.classroomId, run.id);
      acknowledge(notice.id);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setJoining("");
    }
  }
  const active = notices.filter((n) => n.closesAt > serverTime);
  const pending = active.find((notice) => !acknowledged.includes(notice.id));
  if ((inLearning && location.hash.includes("exam=")) || !active.length)
    return null;
  return (
    <section className="exam-notices" aria-label="Thông báo kiểm tra online">
      <div role="status" className="exam-notices-heading">
        <BellRing size={20} />
        <strong>Giáo viên yêu cầu vào kiểm tra</strong>
      </div>
      {pending && (
        <Modal
          title="Có kiểm tra online từ giáo viên"
          className="exam-notice-dialog"
          dismissible={false}
          onClose={() => acknowledge(pending.id)}
        >
          <p className="exam-notice-intro">Giáo viên đã thông báo một buổi kiểm tra cho lớp. Hãy xem thông tin và chọn hành động bên dưới.</p>
          <strong>{pending.title}</strong>
          <p>{pending.classroomName} · {pending.subject}</p>
          <p>{pending.questionCount} câu · Thời lượng {pending.durationMinutes} phút · Cùng giờ kết thúc</p>
          <p className="exam-invitation-clock">
            <Clock3 size={16} /> {serverTime < pending.startsAt ? "Bắt đầu sau" : "Còn"}{" "}
            {Math.floor(Math.max(0, Math.ceil(((serverTime < pending.startsAt ? pending.startsAt : pending.closesAt) - serverTime) / 1000)) / 60)}:
            {String(Math.max(0, Math.ceil(((serverTime < pending.startsAt ? pending.startsAt : pending.closesAt) - serverTime) / 1000)) % 60).padStart(2, "0")}
          </p>
          {error && <p className="error-banner" role="alert">{error}</p>}
          <div className="exam-notice-actions">
            <button className="button secondary" onClick={() => acknowledge(pending.id)}>
              {serverTime < pending.startsAt ? "Đã hiểu" : "Để sau"}
            </button>
            <button
              className="button primary"
              disabled={!!joining || serverTime < pending.startsAt}
              onClick={() => void join(pending)}
            >
              {joining === pending.id ? "Đang vào…" : serverTime < pending.startsAt ? "Chờ mở đề" : pending.runId ? "Tiếp tục kiểm tra" : "Vào làm kiểm tra"}
            </button>
          </div>
        </Modal>
      )}
      {active.filter((notice) => notice.id !== pending?.id).map((notice) => {
        const waiting = serverTime < notice.startsAt;
        const seconds = Math.max(
          0,
          Math.ceil(
            ((waiting ? notice.startsAt : notice.closesAt) - serverTime) / 1000,
          ),
        );
        return (
          <article className="exam-invitation" key={notice.id}>
            <div>
              <strong>{notice.title}</strong>
              <p>
                {notice.classroomName} · {notice.subject}
              </p>
              <small>
                {notice.questionCount} câu · Thời lượng {notice.durationMinutes}{" "}
                phút · Cùng giờ kết thúc
              </small>
              <span className="exam-invitation-clock">
                <Clock3 size={15} /> {waiting ? "Bắt đầu sau" : "Còn"}{" "}
                {Math.floor(seconds / 60)}:
                {String(seconds % 60).padStart(2, "0")}
              </span>
            </div>
            <button
              className="button primary"
              disabled={!!joining || waiting}
              onClick={() => void join(notice)}
            >
              {joining === notice.id
                ? "Đang vào…"
                : waiting
                  ? "Chờ mở đề"
                  : notice.runId
                    ? "Tiếp tục kiểm tra"
                    : "Vào làm kiểm tra"}
            </button>
          </article>
        );
      })}
      {error && (
        <p className="error-banner" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
