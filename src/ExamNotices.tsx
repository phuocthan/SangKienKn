import { useEffect, useRef, useState } from "react";
import { BellRing, Clock3 } from "lucide-react";
import type { ExamNotice } from "../shared/learning";
import { api, ApiError, errorMessage } from "./api";
import "./exam-notices.css";

export function ExamNotices({
  onJoin,
  inLearning,
}: {
  onJoin: (classroomId: string, runId: string) => void | Promise<void>;
  inLearning: boolean;
}) {
  const [notices, setNotices] = useState<ExamNotice[]>([]);
  const [serverTime, setServerTime] = useState(0);
  const anchor = useRef({ time: 0, received: 0 });
  const [joining, setJoining] = useState("");
  const [error, setError] = useState("");
  const keys = useRef(new Map<string, string>());
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
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setJoining("");
    }
  }
  const active = notices.filter((n) => n.closesAt > serverTime);
  if ((inLearning && location.hash.includes("exam=")) || !active.length)
    return null;
  return (
    <section className="exam-notices" aria-label="Thông báo kiểm tra online">
      <div role="status" className="exam-notices-heading">
        <BellRing size={20} />
        <strong>Giáo viên yêu cầu vào kiểm tra</strong>
      </div>
      {active.map((notice) => {
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
