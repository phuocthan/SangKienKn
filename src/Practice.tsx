import { QuestionText } from "./QuestionText";
import {
  DEFAULT_SESSION_POLICY,
  type SessionPolicy,
} from "../shared/session-policy";
import { closeInvalidStudy, flushStudyClosures } from "./session-end";
import { AnswerFields } from "./AnswerFields";
import { answerComplete, type QuestionAnswer } from "../shared/question-types";
import { WorkspaceHeading } from "./WorkspaceHeading";
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
} from "./icons";
import { api, ApiError, errorMessage } from "./api";
import { Empty, Modal } from "./components";
import type { Chapter, Question, Result } from "./types";

export function Practice({
  chapter,
  mode,
  questionId,
  lesson,
  reviewId: initialReviewId,
  onFinish,
  onProgress,
}: {
  chapter: Chapter;
  mode: "practice" | "correction";
  questionId?: string;
  lesson?: string;
  reviewId?: string;
  onFinish: () => void;
  onProgress: () => void;
}) {
  const [reviewId, setReviewId] = useState(initialReviewId);
  const [reviewTitle, setReviewTitle] = useState("");
  const repeatRequest = useRef(crypto.randomUUID());
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<QuestionAnswer | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [score, setScore] = useState(0);
  const [paused, setPaused] = useState(false);
  const [warning, setWarning] = useState<number | null>(null);
  const [sessionError, setSessionError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [recordedSeconds, setRecordedSeconds] = useState<number | null>(null);
  const [hidden, setHidden] = useState(document.hidden);
  const [offline, setOffline] = useState(!navigator.onLine);
  const studySession = useRef<string | undefined>(undefined);
  const activePolicy = useRef<SessionPolicy>({ ...DEFAULT_SESSION_POLICY });
  const [tabCount, setTabCount] = useState(0),
    [tabWarning, setTabWarning] = useState(false);
  const tabCountRef = useRef(0);
  tabCountRef.current = tabCount;
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
    if (reviewId) {
      api<{
        title: string;
        questions: Question[];
        currentIndex: number;
        completed: boolean;
        answers: Record<string, Result & { selected: QuestionAnswer }>;
      }>(`/learning/reviews/${reviewId}`)
        .then((r) => {
          if (!alive) return;
          setReviewTitle(r.title);
          setQuestions(r.questions);
          setIndex(r.currentIndex);
          setDone(r.completed);
          setScore(Object.values(r.answers).filter((a) => a.correct).length);
          const answer = r.answers[r.questions[r.currentIndex]?.id];
          setResult(answer ?? null);
          let draft: QuestionAnswer | null = null;
          try {
            draft = JSON.parse(
              localStorage.getItem(
                "greenedu-review:" +
                  reviewId +
                  ":" +
                  r.questions[r.currentIndex]?.id,
              ) ?? "null",
            );
          } catch {}
          setSelected(answer?.selected ?? draft);
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
    }
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
  }, [chapter.id, mode, questionId, lesson, reviewId, retryKey]);

  const canStudy = !loading && questions.length > 0 && !done;
  const studyChapterId = questions[index]?.chapterId ?? chapter.id;
  useEffect(() => {
    if (!canStudy) return;
    let sessionId: string | undefined,
      disposed = false,
      sending = false,
      failed = false,
      exited = false,
      away = false;
    let lastTick = performance.now(),
      pendingTabs: string[] = [];
    let policy = { ...DEFAULT_SESSION_POLICY };
    let termination: string | undefined;
    let flushing = false,
      supportsRules = false;
    const exitStudy = (
      reason: "idle" | "tabs" | "locked" | "away" | "ended",
    ) => {
      if (disposed || exited) return;
      exited = true;
      termination = reason;
      pausedRef.current = true;
      setPaused(true);
      if (sessionId) closeInvalidStudy(sessionId, reason);
      window.dispatchEvent(
        new CustomEvent("greenedu-study-exit", { detail: { reason } }),
      );
    };
    const updatePolicy = (p?: SessionPolicy) => {
      if (p) {
        policy = p;
        activePolicy.current = p;
      }
    };
    async function syncTabs() {
      if (!sessionId || !supportsRules || flushing || disposed) return;
      flushing = true;
      try {
        while (pendingTabs.length && !disposed && !exited) {
          const eventId = pendingTabs[0];
          const r = await api<{
            tabs: number;
            closed: boolean;
            policy: SessionPolicy;
          }>(`/study/${sessionId}/tab`, { eventId });
          pendingTabs.shift();
          updatePolicy(r.policy);
          const count = Math.max(
            r.tabs + pendingTabs.length,
            tabCountRef.current,
          );
          tabCountRef.current = count;
          setTabCount(count);
          if (r.closed) {
            exitStudy("tabs");
            break;
          }
        }
      } catch (e) {
        if (!disposed) setSessionError(errorMessage(e));
      } finally {
        flushing = false;
      }
    }
    async function heartbeat() {
      if (!sessionId || sending || disposed || exited) return;
      sending = true;
      const activity = interacted.current;
      interacted.current = false;
      try {
        await syncTabs();
        if (exited) return;
        const response = await api<{
          creditedSeconds?: number;
          policy?: SessionPolicy;
        }>("/study/heartbeat", {
          sessionId,
          active:
            !document.hidden &&
            document.hasFocus() &&
            !pausedRef.current &&
            !doneRef.current &&
            Date.now() - lastInteraction.current <
              policy.closeIdleSeconds * 1000,
          interacted: activity,
        });
        updatePolicy(response.policy);
        if (!disposed) {
          failed = false;
          setSessionError("");
          if (typeof response.creditedSeconds === "number")
            setRecordedSeconds(
              (s) => (s ?? 0) + Math.max(0, response.creditedSeconds!),
            );
          onProgressRef.current();
        }
      } catch (e) {
        if (!disposed) {
          failed = true;
          interacted.current ||= activity;
          setSessionError(errorMessage(e));
          if (e instanceof ApiError && (e.status === 403 || e.status === 409))
            exitStudy(
              Date.now() - lastInteraction.current >=
                policy.closeIdleSeconds * 1000
                ? "idle"
                : e.status === 403
                  ? "locked"
                  : "ended",
            );
        }
      } finally {
        sending = false;
      }
    }
    lastInteraction.current = Date.now();
    interacted.current = true;
    pausedRef.current = false;
    setPaused(false);
    setWarning(null);
    setSessionError("");
    setTabCount(0);
    api<{ sessionId: string; policy?: SessionPolicy }>("/study/start", {
      chapterId: studyChapterId,
      questionId: questions[index]?.id,
    })
      .then((s) => {
        if (disposed) {
          void api("/study/stop", {
            sessionId: s.sessionId,
            active: false,
          }).catch(() => {});
          return;
        }
        sessionId = s.sessionId;
        supportsRules = !!s.policy;
        studySession.current = s.sessionId;
        updatePolicy(s.policy);
        lastTick = performance.now();
        void syncTabs();
      })
      .catch((e) => {
        if (!disposed) {
          setSessionError(errorMessage(e));
          pausedRef.current = true;
          setPaused(true);
        }
      });
    const activity = (event: Event) => {
      if (
        event.isTrusted &&
        !pausedRef.current &&
        !document.hidden &&
        document.hasFocus()
      ) {
        lastInteraction.current = Date.now();
        interacted.current = true;
        setWarning(null);
      }
    };
    const timer = window.setInterval(() => {
      const tick = performance.now(),
        delta = (tick - lastTick) / 1000;
      lastTick = tick;
      const idle = (Date.now() - lastInteraction.current) / 1000;
      if (idle >= policy.closeIdleSeconds) {
        exitStudy("idle");
        return;
      }
      if (idle >= policy.warningIdleSeconds)
        setWarning(Math.ceil(policy.closeIdleSeconds - idle));
      if (delta > 2) {
        pausedRef.current = true;
        setPaused(true);
        void heartbeat();
      }
      if (
        disposed ||
        exited ||
        pausedRef.current ||
        document.hidden ||
        !document.hasFocus() ||
        doneRef.current ||
        !sessionId ||
        failed ||
        !navigator.onLine
      )
        return;
      if (delta > 0 && delta <= 2) setElapsedSeconds((s) => s + delta);
    }, 1000);
    const pulse = window.setInterval(() => void heartbeat(), 5000);
    const visibility = () => {
      lastTick = performance.now();
      setHidden(document.hidden);
      const left = document.hidden || !document.hasFocus();
      if (left && !away && !exited) {
        if (sessionId && !supportsRules) {
          exitStudy("away");
          return;
        }
        away = true;
        pausedRef.current = true;
        setPaused(true);
        const id = crypto.randomUUID();
        pendingTabs.push(id);
        const count = tabCountRef.current + 1;
        tabCountRef.current = count;
        setTabCount(count);
        if (count >= policy.closeTabs) {
          exitStudy("tabs");
          return;
        }
        if (count >= policy.warningTabs) setTabWarning(true);
        void syncTabs();
        void heartbeat();
      } else if (!left) {
        away = false;
        void heartbeat();
      }
    };
    const connection = () => {
      setOffline(!navigator.onLine);
      lastTick = performance.now();
      if (navigator.onLine) {
        void flushStudyClosures();
        void heartbeat();
      }
    };
    const events = ["pointerdown", "keydown", "wheel", "touchmove"];
    events.forEach((n) =>
      window.addEventListener(n, activity, { passive: true, capture: true }),
    );
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("blur", visibility);
    window.addEventListener("focus", visibility);
    window.addEventListener("online", connection);
    window.addEventListener("offline", connection);
    return () => {
      disposed = true;
      clearInterval(timer);
      clearInterval(pulse);
      events.forEach((n) => window.removeEventListener(n, activity, true));
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("blur", visibility);
      window.removeEventListener("focus", visibility);
      window.removeEventListener("online", connection);
      window.removeEventListener("offline", connection);
      if (sessionId) {
        if (termination) closeInvalidStudy(sessionId, termination);
        else
          void api("/study/stop", {
            sessionId,
            active:
              !pausedRef.current &&
              !document.hidden &&
              document.hasFocus() &&
              navigator.onLine,
          }).catch(() => {});
      }
      onProgressRef.current();
    };
  }, [studyChapterId, canStudy]);
  function resume() {
    lastInteraction.current = Date.now();
    interacted.current = true;
    pausedRef.current = false;
    setPaused(false);
    setWarning(null);
    setTabWarning(false);
  }
  async function submit() {
    if (
      !answerComplete(questions[index], selected) ||
      busy ||
      result ||
      paused ||
      document.hidden ||
      !document.hasFocus()
    )
      return;
    setBusy(true);
    setError("");
    try {
      const r = await api<Result>(
        reviewId ? `/learning/reviews/${reviewId}/answer` : "/attempts",
        {
          questionId: questions[index].id,
          ...(mode === "correction" && !reviewId
            ? { sourceQuestionId: questions[index].sourceQuestionId }
            : {}),
          selected,
          mode,
          requestId: requestId.current,
          studySessionId: studySession.current,
        },
      );
      setResult(r);
      if (reviewId)
        localStorage.removeItem(
          `greenedu-review:${reviewId}:${questions[index].id}`,
        );
      if (r.correct) setScore((s) => s + 1);
      onProgress();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function repeat() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (reviewId) {
        const r = await api<{ id: string }>(
          "/learning/reviews/" + reviewId + "/repeat",
          { requestId: repeatRequest.current },
        );
        setLoading(true);
        setReviewId(r.id);
        repeatRequest.current = crypto.randomUUID();
      } else {
        setLoading(true);
        setRetryKey((k) => k + 1);
      }
      setDone(false);
      setIndex(0);
      setSelected(null);
      setResult(null);
      setScore(0);
      setElapsedSeconds(0);
      setRecordedSeconds(null);
      requestId.current = crypto.randomUUID();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function next() {
    if (busy) return;
    if (mode === "correction" && result && !result.correct) {
      setResult(null);
      setSelected(null);
      requestId.current = crypto.randomUUID();
      return;
    }
    if (reviewId) {
      setBusy(true);
      try {
        await api(`/learning/reviews/${reviewId}/next`, { index: index + 1 });
      } catch (e) {
        setError(errorMessage(e));
        return;
      } finally {
        setBusy(false);
      }
    }
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
        {error && <p role="alert">{error}</p>}
        {mode === "practice" && (
          <button
            className="button primary"
            disabled={busy}
            onClick={() => void repeat()}
          >
            Làm lại bài <RotateCcw size={17} />
          </button>
        )}
        <button className="button secondary" onClick={onFinish}>
          Về khu vườn
          <ArrowRight size={18} />
        </button>
      </div>
    );
  const q = questions[index];
  return (
    <div className="practice-layout">
      {(tabWarning || warning !== null) && (
        <Modal title="Nhắc nhở phiên học" onClose={resume}>
          <p>
            {tabWarning
              ? `Bạn đã rời tab ${tabCount}/${activePolicy.current.closeTabs} lần. Tới ngưỡng, phiên sẽ đóng và không được tính giờ.`
              : `Không có tương tác. Phiên sẽ tự đóng sau ${warning} giây và không được tính giờ.`}
          </p>
          <button className="button primary" onClick={resume}>
            Tiếp tục học
          </button>
        </Modal>
      )}
      <WorkspaceHeading className="practice-top">
        <button className="text-button" onClick={onFinish}>
          <ArrowLeft size={16} />
          Kết thúc phiên
        </button>
        <div className="practice-clock">
          <span
            className={`pill ${paused || hidden || offline || sessionError ? "amber" : ""}`}
          >
            <Clock3 size={14} />
            {sessionError || offline
              ? "Chưa ghi nhận thời gian"
              : paused || hidden
                ? "Đã tạm dừng tính giờ"
                : "Đang ghi nhận thời gian"}
          </span>
          <span className="practice-elapsed" aria-label="Thời gian phiên học">
            <small>Phiên này · tạm tính</small>
            <time>{clockTime(elapsedSeconds)}</time>
          </span>
          {recordedSeconds !== null && (
            <small className="muted">
              Đã ghi nhận: {clockTime(recordedSeconds)}
            </small>
          )}
        </div>
      </WorkspaceHeading>
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
              ? "Phiên đang tạm dừng sau khi rời tab hoặc máy nghỉ."
              : `Bạn còn đang học chứ? Phiên học kết thúc sau ${warning} giây nếu không tương tác.`}
          </span>
          {paused && (
            <button className="button primary small" onClick={resume}>
              Tiếp tục học
            </button>
          )}
        </div>
      )}
      <div className="card question-card">
        {reviewId && <p className="review-session-title">{reviewTitle}</p>}
        <div className="question-meta">
          <span className="eyebrow">
            {mode === "correction"
              ? "SỔ TAY SỬA SAI"
              : reviewId
                ? "ÔN TẬP"
                : "LUYỆN TẬP"}{" "}
            ·{" "}
            {(q as Question & { chapterTitle?: string }).chapterTitle ??
              chapter.title}
          </span>
          <span>
            Câu {index + 1}/{questions.length}
          </span>
        </div>
        <div className="progress-track">
          <span style={{ width: `${(index / questions.length) * 100}%` }} />
        </div>
        <h2>
          <QuestionText>{q.text}</QuestionText>
        </h2>
        <AnswerFields
          question={q}
          value={selected}
          result={result}
          disabled={!!result || busy || paused}
          onChange={(value) => {
            setSelected(value);
            if (reviewId)
              localStorage.setItem(
                "greenedu-review:" + reviewId + ":" + q.id,
                JSON.stringify(value),
              );
            requestId.current = crypto.randomUUID();
          }}
        />
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
            <p>
              <QuestionText>
                {result.correct
                  ? result.explanation
                  : "Hãy xem lại kiến thức và tự làm lại câu này."}
              </QuestionText>
            </p>
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
            <button
              className="button primary"
              disabled={busy}
              onClick={() => void next()}
            >
              {mode === "correction" && !result.correct
                ? "Tự làm lại"
                : index === questions.length - 1
                  ? "Xem kết quả"
                  : "Câu tiếp theo"}
              <ArrowRight size={17} />
            </button>
          ) : (
            <button
              className="button primary"
              disabled={!answerComplete(q, selected) || busy || paused}
              onClick={() => void submit()}
            >
              {busy ? "Đang kiểm tra…" : "Kiểm tra đáp án"}
              <Check size={17} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
function SproutMark() {
  return <span aria-hidden="true">✦</span>;
}
function clockTime(seconds: number) {
  const value = Math.max(0, Math.floor(seconds));
  return [Math.floor(value / 3600), Math.floor(value / 60) % 60, value % 60]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}
