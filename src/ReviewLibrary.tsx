import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { BookOpen, Plus } from "./icons";
import { api, errorMessage } from "./api";
import { Modal } from "./components";
import { WorkspaceHeading } from "./WorkspaceHeading";
import { ExamUpload, type UploadedExamQuestion } from "./ExamUpload";
import type { Chapter, Classroom, User } from "./types";
import type { LearningOverview } from "../shared/learning";
import "./learning.css";
import "./review-library.css";

export function ReviewLibrary({
  classroom,
  user,
  onReview,
}: {
  classroom: Classroom;
  user: User;
  onReview: (id: string, chapter: Chapter) => void;
}) {
  const teacher = user.role === "teacher";
  const [data, setData] = useState<LearningOverview | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [source, setSource] = useState<"upload" | "bank">("upload");
  const [uploaded, setUploaded] = useState<UploadedExamQuestion[]>([]);
  const [reading, setReading] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [count, setCount] = useState(0);
  const [semester, setSemester] = useState("");
  const [weights, setWeights] = useState<Record<string, number>>({});
  const requests = useRef(new Map<string, string>());
  const generation = useRef(0);
  const createButton = useRef<HTMLButtonElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const requestId = (body: object) => {
    const key = JSON.stringify(body);
    if (!requests.current.has(key))
      requests.current.set(key, crypto.randomUUID());
    return requests.current.get(key)!;
  };
  const refresh = useCallback(async () => {
    const ticket = ++generation.current;
    try {
      const next = await api<LearningOverview>(
        `/classrooms/${classroom.id}/learning`,
      );
      if (ticket === generation.current) {
        setData(next);
        setError("");
      }
    } catch (e) {
      if (ticket === generation.current) setError(errorMessage(e));
    }
  }, [classroom.id]);
  useEffect(() => {
    void refresh();
    const update = () => {
      if (document.visibilityState === "visible" && navigator.onLine)
        void refresh();
    };
    const timer = setInterval(update, 15000);
    window.addEventListener("focus", update);
    window.addEventListener("online", update);
    return () => {
      generation.current++;
      clearInterval(timer);
      window.removeEventListener("focus", update);
      window.removeEventListener("online", update);
    };
  }, [refresh]);
  useEffect(() => {
    if (formError) errorRef.current?.focus();
  }, [formError]);
  useEffect(() => {
    if (!creating || (!title && !uploaded.length && !selected.length)) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [creating, title, uploaded.length, selected.length]);
  function closeForm() {
    setCreating(false);
    requestAnimationFrame(() => createButton.current?.focus());
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    if (busy || reading) return;
    setFormError("");
    const ids =
      source === "upload"
        ? [...new Set(uploaded.map((q) => q.chapterId))]
        : selected;
    if (!ids.length) {
      setFormError(
        source === "upload"
          ? "Tải đề Word hoặc CSV trước khi lưu."
          : "Chọn chương cho bài ôn.",
      );
      return;
    }
    if (source === "upload" && !data?.reviewPapers) {
      setFormError("Tạo bài ôn từ file đang chờ cập nhật backend Railway.");
      return;
    }
    setBusy(true);
    try {
      const body =
        source === "upload"
          ? { title, chapterIds: ids, questions: uploaded }
          : {
              title,
              chapterIds: ids,
              questionCount: count,
              weights: Object.fromEntries(
                Object.entries(weights).filter(([key]) =>
                  ids.some((id) => key.startsWith(`${id}::`)),
                ),
              ),
            };
      const saved = await api<{ id: string }>(
        `/classrooms/${classroom.id}/${source === "upload" ? "review-papers" : "blueprints"}`,
        {
          ...body,
          ...(source === "upload" ? { requestId: requestId(body) } : {}),
        },
      );
      if (saved.id) {
        requests.current.delete(JSON.stringify(body));
        closeForm();
        setTitle("");
        setUploaded([]);
        setSelected([]);
        setWeights({});
        setNotice("Đã tạo bài ôn cho lớp.");
        await refresh();
      }
    } catch (e) {
      setFormError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function start(
    body: {
      blueprintId?: string;
      chapterIds?: string[];
      questionCount?: number;
    },
    chapter?: Chapter,
  ) {
    if (busy) return;
    const target = chapter ?? classroom.chapters[0];
    if (!target) {
      setError("Lớp chưa có chương đang dùng để mở phiên ôn.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await api<{ id: string }>(
        `/classrooms/${classroom.id}/reviews`,
        { ...body, requestId: requestId(body) },
      );
      requests.current.delete(JSON.stringify(body));
      onReview(result.id, target);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  const chapterOptions = (
    <div className="learning-options">
      {data?.chapters.map((chapter) => (
        <label key={chapter.id}>
          <input
            type="checkbox"
            checked={selected.includes(chapter.id)}
            disabled={busy || (chapter.practiceAllowed === false && !teacher)}
            onChange={(e) =>
              setSelected((ids) =>
                e.target.checked
                  ? [...ids, chapter.id]
                  : ids.filter((id) => id !== chapter.id),
              )
            }
          />
          {chapter.title}
        </label>
      ))}
    </div>
  );
  return (
    <div className="learning-workspace review-library">
      <WorkspaceHeading>
        <h1>Ôn tập</h1>
      </WorkspaceHeading>
      {teacher && (
        <div className="review-library-actions">
          <button
            ref={createButton}
            className="button primary"
            disabled={!data || busy}
            aria-haspopup="dialog"
            onClick={() => {
              setFormError("");
              setCreating(true);
            }}
          >
            <Plus size={19} aria-hidden="true" /> Tạo bài ôn
          </button>
        </div>
      )}
      {error && (
        <div className="error-banner" role="alert">
          {error}
          <button type="button" onClick={() => void refresh()}>
            Thử lại
          </button>
        </div>
      )}
      {notice && (
        <p className="learning-notice" role="status">
          {notice}
        </p>
      )}
      {!data ? (
        <div className="loading-panel" role="status">
          Đang tải bài ôn…
        </div>
      ) : (
        <>
          {!teacher && data.reviews.length > 0 && (
            <section
              className="card learning-section"
              aria-labelledby="review-resume"
            >
              <h2 id="review-resume">Đang ôn</h2>
              <div className="learning-list">
                {data.reviews.map((review) => (
                  <article className="learning-row" key={review.id}>
                    <div>
                      <h3>{review.title}</h3>
                      <p>
                        Câu{" "}
                        {Math.min(
                          review.currentIndex + 1,
                          review.questionCount,
                        )}
                        /{review.questionCount}
                      </p>
                      {!classroom.chapters.length && (
                        <small>
                          Lớp chưa có chương đang dùng để tiếp tục ôn.
                        </small>
                      )}
                    </div>
                    <button
                      className="button secondary small"
                      disabled={busy || !classroom.chapters.length}
                      onClick={() => onReview(review.id, classroom.chapters[0])}
                    >
                      Tiếp tục ôn
                    </button>
                  </article>
                ))}
              </div>
            </section>
          )}
          <section
            className="card learning-section"
            aria-labelledby="review-library-title"
          >
            <h2 id="review-library-title">
              <BookOpen size={21} aria-hidden="true" /> Bài ôn của lớp
            </h2>
            {!data.blueprints.length ? (
              <p className="muted">
                {teacher
                  ? "Tạo bài ôn và tải đề để học sinh bắt đầu."
                  : "Giáo viên chưa tạo bài ôn cho lớp."}
              </p>
            ) : (
              <div className="learning-list">
                {data.blueprints.map((paper) => {
                  const available = paper.chapterIds.every((id) =>
                    data.chapters.some(
                      (c) => c.id === id && c.practiceAllowed !== false,
                    ),
                  );
                  const chapter = classroom.chapters.find((c) =>
                    paper.chapterIds.includes(c.id),
                  );
                  return (
                    <article
                      className="learning-row review-paper"
                      key={paper.id}
                    >
                      <div>
                        <h3>{paper.title}</h3>
                        <p>
                          {paper.questionCount || "Toàn bộ"} câu ·{" "}
                          {paper.chapterIds.length} chương
                          {teacher
                            ? ` · ${paper.source === "upload" ? "Đề tải lên" : "Ngân hàng"}`
                            : ""}
                        </p>
                        {!teacher && !available && (
                          <small>
                            Chờ giáo viên mở luyện tập cho chương trong bài ôn.
                          </small>
                        )}
                      </div>
                      {!teacher && (
                        <button
                          className="button primary small"
                          disabled={busy || !available || !chapter}
                          onClick={() =>
                            void start({ blueprintId: paper.id }, chapter)
                          }
                        >
                          Bắt đầu ôn
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
          {!teacher && (
            <details className="card learning-section review-bank">
              <summary>Ôn từ ngân hàng</summary>
              <div className="learning-settings">
                <label>
                  Học kỳ
                  <select
                    value={semester}
                    onChange={(e) => {
                      setSemester(e.target.value);
                      setSelected([]);
                    }}
                  >
                    <option value="">Tất cả chương</option>
                    {[
                      ...new Set(
                        data.chapters.map((c) => c.semester).filter(Boolean),
                      ),
                    ].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Số câu ôn (0 = toàn bộ, tối đa 100)
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                  />
                </label>
              </div>
              <div className="learning-options">
                {data.chapters
                  .filter((c) => !semester || c.semester === semester)
                  .map((c) => (
                    <label key={c.id}>
                      <input
                        type="checkbox"
                        checked={selected.includes(c.id)}
                        disabled={busy || c.practiceAllowed === false}
                        onChange={(e) =>
                          setSelected((ids) =>
                            e.target.checked
                              ? [...ids, c.id]
                              : ids.filter((id) => id !== c.id),
                          )
                        }
                      />
                      {c.title}
                    </label>
                  ))}
              </div>
              <div className="learning-actions">
                <button
                  className="button primary"
                  disabled={busy || !selected.length}
                  onClick={() =>
                    void start({ chapterIds: selected, questionCount: count })
                  }
                >
                  Bắt đầu ôn
                </button>
                {semester && (
                  <button
                    className="button secondary"
                    disabled={busy}
                    onClick={() =>
                      void start({
                        chapterIds: data.chapters
                          .filter((c) => c.semester === semester)
                          .map((c) => c.id),
                        questionCount: count,
                      })
                    }
                  >
                    Ôn toàn học kỳ
                  </button>
                )}
              </div>
            </details>
          )}
        </>
      )}
      {creating && teacher && (
        <Modal
          title="Tạo bài ôn"
          className="online-exam-create-modal"
          dismissible={!busy && !reading}
          onClose={closeForm}
        >
          <form className="learning-form" onSubmit={save}>
            <fieldset
              className="review-create-fields"
              disabled={busy || reading}
            >
              <legend className="sr-only">Thông tin bài ôn</legend>
              <label>
                Tiêu đề bài ôn
                <input
                  required
                  name="review-title"
                  autoComplete="off"
                  maxLength={120}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Ôn dao động điều hòa…"
                />
              </label>
              <label>
                Nguồn câu hỏi
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value as typeof source)}
                >
                  <option value="upload">Tải đề Word/CSV</option>
                  <option value="bank">Ngân hàng câu hỏi</option>
                </select>
              </label>
            </fieldset>
            {source === "upload" ? (
              <>
                <p className="muted">
                  Học sinh chọn bài theo tiêu đề để ôn. Câu hỏi trong file chỉ
                  dùng cho bài ôn này.
                </p>
                {!data?.reviewPapers && (
                  <p className="error-banner" role="status">
                    Tạo bài ôn từ file đang chờ cập nhật backend Railway.
                  </p>
                )}
                <fieldset disabled={busy}>
                  <legend className="sr-only">Đề ôn tải lên</legend>
                  <ExamUpload
                    chapters={classroom.chapters}
                    questions={uploaded}
                    onChange={setUploaded}
                    onReadingChange={setReading}
                  />
                </fieldset>
              </>
            ) : (
              <fieldset disabled={busy}>
                <legend>Chương trong bộ câu</legend>
                {chapterOptions}
                <label>
                  Số câu (0 = toàn bộ, tối đa 100)
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                  />
                </label>
                <details>
                  <summary>Trọng số theo bài</summary>
                  <div className="learning-settings">
                    {data?.matrix
                      .filter((row) => selected.includes(row.chapterId))
                      .map((row) => (
                        <label key={row.key}>
                          {row.chapterTitle} · {row.lesson}
                          <input
                            type="number"
                            min={0}
                            max={10000}
                            aria-label={`Trọng số ${row.chapterTitle} ${row.lesson}`}
                            value={weights[row.key] ?? ""}
                            onChange={(e) =>
                              setWeights((old) => {
                                const next = { ...old };
                                if (e.target.value === "") delete next[row.key];
                                else next[row.key] = Number(e.target.value);
                                return next;
                              })
                            }
                          />
                        </label>
                      ))}
                  </div>
                </details>
              </fieldset>
            )}
            {formError && (
              <p
                ref={errorRef}
                tabIndex={-1}
                className="error-banner"
                role="alert"
              >
                {formError}
              </p>
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="button outline"
                disabled={busy || reading}
                onClick={closeForm}
              >
                Hủy
              </button>
              <button
                className="button primary"
                disabled={
                  busy ||
                  reading ||
                  (source === "upload" && !data?.reviewPapers)
                }
              >
                {busy ? "Đang lưu…" : "Lưu bài ôn"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
