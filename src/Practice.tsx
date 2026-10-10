import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Pause,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import { api, errorMessage } from "./api";
import { Empty } from "./components";
import type { Chapter, Question, Result } from "./types";

export function Practice({
  chapter,
  mode,
  questionId,
  lesson,
  onFinish,
  onProgress,
}: {
  chapter: Chapter;
  mode: "practice" | "correction";
  questionId?: string;
  lesson?: string;
  onFinish: () => void;
  onProgress: () => void;
}) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [score, setScore] = useState(0);
  const [paused, setPaused] = useState(false);
  const [warning, setWarning] = useState<number | null>(null);
  const [sessionError, setSessionError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const lastInteraction = useRef(Date.now());
  const interacted = useRef(true);
  const pausedRef = useRef(false);
  const requestId = useRef(crypto.randomUUID());
  const doneRef = useRef(false);
  doneRef.current = done;
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    const query = new URLSearchParams();
    if (lesson) query.set("lesson", lesson);
    if (mode === "correction") query.set("mode", "correction");
    api<Question[]>(
      `/chapters/${chapter.id}/questions${query.size ? `?${query}` : ""}`,
    )
      .then((rows) => {
        if (!alive) return;
        setQuestions(
          mode === "correction"
            ? rows.filter(
                (q) => q.correction && (!questionId || q.id === questionId),
              )
            : rows,
        );
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
  }, [chapter.id, mode, questionId, lesson, retryKey]);

  const canStudy = !loading && questions.length > 0 && !done;
  useEffect(() => {
    if (!canStudy) return;
    let sessionId: string | undefined,
      disposed = false,
      sending = false;
    lastInteraction.current = Date.now();
    interacted.current = true;
    pausedRef.current = false;
    setPaused(false);
    setWarning(null);
    setSessionError("");
    async function heartbeat() {
      if (!sessionId || sending || disposed) return;
      sending = true;
      const activity = interacted.current;
      interacted.current = false;
      try {
        await api("/study/heartbeat", {
          sessionId,
          active: !document.hidden && !pausedRef.current && !doneRef.current,
          interacted: activity,
        });
        if (!disposed) {
          setSessionError("");
          onProgressRef.current();
        }
      } catch (e) {
        if (!disposed) {
          setSessionError(errorMessage(e));
          interacted.current ||= activity;
        }
      } finally {
        sending = false;
      }
    }
    function activity(event: Event) {
      if (event.isTrusted && !pausedRef.current && !document.hidden) {
        lastInteraction.current = Date.now();
        interacted.current = true;
        setWarning(null);
      }
    }
    api<{ sessionId: string }>("/study/start", { chapterId: chapter.id })
      .then((s) => {
        if (disposed) {
          void api("/study/stop", { sessionId: s.sessionId }).catch(() => {});
          return;
        }
        sessionId = s.sessionId;
      })
      .catch((e) => {
        if (!disposed) setSessionError(errorMessage(e));
      });
    const timer = window.setInterval(() => {
      if (disposed || pausedRef.current || document.hidden) return;
      const idle = Math.floor((Date.now() - lastInteraction.current) / 1000);
      if (idle >= 130) {
        pausedRef.current = true;
        setPaused(true);
        setWarning(null);
        void heartbeat();
      } else if (idle >= 120) setWarning(130 - idle);
    }, 1000);
    const pulse = window.setInterval(() => void heartbeat(), 15000);
    const visibility = () => void heartbeat();
    const events = ["pointerdown", "keydown", "scroll"];
    events.forEach((name) =>
      window.addEventListener(name, activity, { passive: true, capture: true }),
    );
    document.addEventListener("visibilitychange", visibility);
    return () => {
      disposed = true;
      clearInterval(timer);
      clearInterval(pulse);
      events.forEach((name) =>
        window.removeEventListener(name, activity, true),
      );
      document.removeEventListener("visibilitychange", visibility);
      if (sessionId) void api("/study/stop", { sessionId }).catch(() => {});
      onProgressRef.current();
    };
  }, [chapter.id, canStudy]);

  function resume() {
    lastInteraction.current = Date.now();
    interacted.current = true;
    pausedRef.current = false;
    setPaused(false);
    setWarning(null);
  }
  async function submit() {
    if (selected === null || busy || result || paused) return;
    setBusy(true);
    setError("");
    try {
      const r = await api<Result>("/attempts", {
        questionId: questions[index].id,
        selected,
        mode,
        requestId: requestId.current,
      });
      setResult(r);
      if (r.correct) setScore((s) => s + 1);
      onProgress();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  function next() {
    if (index === questions.length - 1) {
      setDone(true);
      onProgress();
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
      setResult(null);
      requestId.current = crypto.randomUUID();
      setError("");
    }
  }
  if (loading)
    return <div className="loading-panel">Đang chuẩn bị bài luyện tập…</div>;
  if (!questions.length)
    return (
      <>
        <button className="text-button" onClick={onFinish}>
          <ArrowLeft size={16} />
          Quay lại
        </button>
        {error ? (
          <div className="error-banner" role="alert">
            {error}
            <button onClick={() => setRetryKey((k) => k + 1)}>Thử lại</button>
          </div>
        ) : (
          <Empty
            title={
              mode === "correction"
                ? "Không còn câu cần sửa"
                : "Chương này chưa có câu hỏi"
            }
            text={
              mode === "correction"
                ? "Bạn đã hoàn thành các lỗi sai của chương này."
                : "Giáo viên sẽ thêm câu hỏi để bạn bắt đầu luyện tập."
            }
          />
        )}
      </>
    );
  if (done)
    return (
      <div className="completion card">
        <span className="completion-icon">
          <Sparkles size={36} />
        </span>
        <span className="eyebrow">MỘT BƯỚC TIẾN MỚI</span>
        <h1>Bạn đã chăm cây hôm nay!</h1>
        <p>
          {mode === "correction"
            ? "Mỗi lỗi sai được sửa là một điều bạn đã hiểu thêm."
            : "Duy trì từng chút một, kiến thức sẽ lớn lên cùng bạn."}
        </p>
        <div className="score">
          {score}
          <span> / {questions.length} câu đúng</span>
        </div>
        <p>
          {questions.length - score > 0
            ? `${questions.length - score} câu chưa đúng đã được giữ trong sổ tay sửa sai.`
            : "Tất cả câu trả lời đều chính xác. Làm tốt lắm!"}
        </p>
        <button className="button primary" onClick={onFinish}>
          Về khu vườn
          <ArrowRight size={18} />
        </button>
      </div>
    );
  const q = questions[index];
  return (
    <div className="practice-layout">
      <div className="practice-top">
        <button className="text-button" onClick={onFinish}>
          <ArrowLeft size={16} />
          Kết thúc phiên
        </button>
        <span className={`pill ${paused || sessionError ? "amber" : ""}`}>
          <Clock3 size={14} />
          {sessionError
            ? "Chưa ghi nhận thời gian"
            : paused
              ? "Đã tạm dừng tính giờ"
              : "Đang ghi nhận thời gian"}
        </span>
      </div>
      {sessionError && (
        <div className="error-banner" role="alert">
          {sessionError} Hãy kết thúc phiên rồi mở lại nếu phiên đã hết hiệu
          lực.
        </div>
      )}
      {(paused || warning !== null) && (
        <div className="idle-banner" role="status">
          <Pause size={20} />
          <span>
            {paused
              ? "Thời gian học đang tạm dừng do không có tương tác."
              : `Bạn còn đang học chứ? Tạm dừng tính giờ sau ${warning} giây.`}
          </span>
          <button className="button primary small" onClick={resume}>
            Tiếp tục học
          </button>
        </div>
      )}
      <div className="card question-card">
        <div className="question-meta">
          <span className="eyebrow">
            {mode === "correction" ? "SỔ TAY SỬA SAI" : "LUYỆN TẬP"} ·{" "}
            {chapter.title}
          </span>
          <span>
            Câu {index + 1}/{questions.length}
          </span>
        </div>
        <div className="progress-track">
          <span style={{ width: `${(index / questions.length) * 100}%` }} />
        </div>
        <h2>{q.text}</h2>
        <div className="choices">
          {q.choices.map((choice, i) => (
            <button
              key={i}
              disabled={!!result || busy || paused}
              onClick={() => {
                setSelected(i);
                requestId.current = crypto.randomUUID();
              }}
              className={`choice ${selected === i ? "selected" : ""} ${result && i === result.correctIndex ? "correct-choice" : ""} ${result && selected === i && !result.correct ? "wrong-choice" : ""}`}
              aria-pressed={selected === i}
            >
              <span className="choice-letter">{"ABCD"[i]}</span>
              <span>{choice}</span>
              {result && i === result.correctIndex ? (
                <Check size={20} />
              ) : result && selected === i && !result.correct ? (
                <X size={20} />
              ) : null}
            </button>
          ))}
        </div>
        {error && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}
        {result && (
          <div
            className={`explanation ${result.correct ? "success" : ""}`}
            role="status"
          >
            <div>
              <CheckCircle2 size={19} />
              <strong>
                {result.correct
                  ? result.resolved
                    ? "Bạn đã khắc phục lỗi sai này!"
                    : "Chính xác, tiếp tục phát huy nhé!"
                  : "Chưa đúng, cùng xem lại kiến thức nhé."}
              </strong>
            </div>
            <p>{result.explanation}</p>
            {!result.correct && (
              <small>
                Câu hỏi đã được lưu vào sổ tay sửa sai để bạn làm lại.
              </small>
            )}
          </div>
        )}
        <div className="question-footer">
          <span>
            <SproutMark /> Hiểu thêm một chút, cây lớn thêm một chút.
          </span>
          {result ? (
            <button className="button primary" onClick={next}>
              {index === questions.length - 1 ? "Xem kết quả" : "Câu tiếp theo"}
              <ArrowRight size={17} />
            </button>
          ) : (
            <button
              className="button primary"
              disabled={selected === null || busy || paused}
              onClick={() => void submit()}
            >
              {busy ? "Đang kiểm tra…" : "Kiểm tra đáp án"}
              <Check size={17} />
            </button>
          )}
        </div>
      </div>
      <div className="practice-note">
        <RotateCcw size={16} />
        Đây là phiên luyện tập. Bạn có thể học lại và sửa sai theo nhịp của
        mình.
      </div>
    </div>
  );
}
function SproutMark() {
  return <span aria-hidden="true">✦</span>;
}
