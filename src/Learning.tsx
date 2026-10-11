import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  ArrowLeft,
  BookOpen,
  Clock3,
  Download,
  RefreshCw,
  Trophy,
  Ticket,
} from "lucide-react";
import { api, ApiError, duration, errorMessage } from "./api";
import { StudentLevelIcon } from "./StudentLevel";
import { STUDENT_LEVEL_NAMES } from "../shared/student-levels";
import { ExamUpload, type UploadedExamQuestion } from "./ExamUpload";
import type { Chapter, Classroom, User } from "./types";
import type {
  ExamRun,
  LearningChapter,
  LearningOverview,
} from "../shared/learning";
import "./learning.css";

const date = (n: number) => new Date(n).toLocaleString("vi-VN");
const localDate = (n: number) =>
  new Date(n - new Date(n).getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
const statusText = {
  pending: "Chờ giáo viên duyệt",
  approved: "Đã duyệt",
  rejected: "Không ghi nhận",
};

export function Learning({
  classroom,
  user,
  onReview,
  onSettingsChanged,
}: {
  classroom: Classroom;
  user: User;
  onReview: (id: string, chapter: Chapter) => void;
  onSettingsChanged?: () => void;
}) {
  const teacher = user.role === "teacher";
  const hash = new URLSearchParams(location.hash.slice(1));
  const [runId, setRunId] = useState(
    hash.get("learning") === classroom.id ? (hash.get("exam") ?? "") : "",
  );
  const [data, setData] = useState<LearningOverview | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [semester, setSemester] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [count, setCount] = useState(teacher ? 10 : 0);
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [title, setTitle] = useState("");
  const [starts, setStarts] = useState(localDate(Date.now()));
  const [closes, setCloses] = useState(localDate(Date.now() + 3600000));
  const [tabLimit, setTabLimit] = useState(4);
  const [creating, setCreating] = useState<"blueprint" | "exam">("blueprint");
  const [examSource, setExamSource] = useState<"bank" | "upload">("bank");
  const [manualOpen, setManualOpen] = useState(true);
  const [lessonMode, setLessonMode] = useState<"all" | "selected">("all");
  const [lessonKeys, setLessonKeys] = useState<string[]>([]);
  const [uploaded, setUploaded] = useState<UploadedExamQuestion[]>([]);
  const [uploadBusy, setUploadBusy] = useState(false);
  const startKeys = useRef(new Map<string, string>());
  const requestKey = (intent: string) => {
    if (!startKeys.current.has(intent))
      startKeys.current.set(intent, crypto.randomUUID());
    return startKeys.current.get(intent)!;
  };
  const refresh = useCallback(async () => {
    try {
      setData(
        await api<LearningOverview>(`/classrooms/${classroom.id}/learning`),
      );
      setError("");
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [classroom.id]);
  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 15000);
    return () => clearInterval(timer);
  }, [refresh]);
  async function act(action: () => Promise<unknown>, message = "") {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await action();
      setNotice(message);
      await refresh();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  function openRun(id: string) {
    location.hash = new URLSearchParams({
      learning: classroom.id,
      exam: id,
    }).toString();
    setRunId(id);
  }
  async function startRun(body: object) {
    const intent = `exam:${JSON.stringify(body)}`;
    const r = await api<{ id: string }>(
      `/classrooms/${classroom.id}/exam-runs`,
      { ...body, requestId: requestKey(intent) },
    );
    startKeys.current.delete(intent);
    openRun(r.id);
  }
  async function startReview(body: object) {
    const intent = `review:${JSON.stringify(body)}`;
    const r = await api<{ id: string }>(`/classrooms/${classroom.id}/reviews`, {
      ...body,
      requestId: requestKey(intent),
    });
    startKeys.current.delete(intent);
    onReview(r.id, classroom.chapters[0]);
  }
  async function create(e: FormEvent) {
    e.preventDefault();
    const chosenWeights = Object.fromEntries(
      Object.entries(weights).filter(
        ([key]) =>
          selected.some((id) => key.startsWith(`${id}::`)) &&
          (creating !== "exam" ||
            lessonMode !== "selected" ||
            lessonKeys.includes(key)),
      ),
    );
    const body = {
      title,
      chapterIds: selected,
      questionCount: count,
      weights: chosenWeights,
      ...(creating === "exam"
        ? {
            startsAt: new Date(starts).getTime(),
            closesAt: new Date(closes).getTime(),
            tabLimit,
            source: examSource,
            manualOpen,
            ...(examSource === "upload"
              ? { questions: uploaded }
              : lessonMode === "selected"
                ? {
                    lessonKeys: lessonKeys.filter((key) =>
                      selected.some((id) => key.startsWith(`${id}::`)),
                    ),
                  }
                : {}),
          }
        : {}),
    };
    const intent = `create:${JSON.stringify(body)}`;
    await act(
      async () => {
        await api(
          `/classrooms/${classroom.id}/${creating === "exam" ? "exams" : "blueprints"}`,
          {
            ...body,
            ...(creating === "exam" ? { requestId: requestKey(intent) } : {}),
          },
        );
        startKeys.current.delete(intent);
      },
      creating === "exam"
        ? manualOpen
          ? "Đã tạo kiểm tra. Chọn Mở kiểm tra ngay khi sẵn sàng."
          : "Đã tạo lịch kiểm tra cho lớp."
        : "Đã lưu ma trận ôn tập.",
    );
  }
  if (runId)
    return (
      <ExamRoom
        key={runId}
        id={runId}
        user={user}
        onClose={() => {
          setRunId("");
          location.hash = new URLSearchParams({
            learning: classroom.id,
          }).toString();
          void refresh();
        }}
      />
    );
  return (
    <div className="learning-workspace">
      <div className="learning-heading">
        <div>
          <span className="eyebrow">HỌC VỮNG · THI TỰ TIN</span>
          <h1>Ôn tập & kiểm tra</h1>
          <p>
            {teacher
              ? "Thiết lập ma trận, lịch thi và ghi nhận nỗ lực của học sinh."
              : "Theo dõi điều kiện từng chương, tiếp tục ôn tập và làm bài kiểm tra."}
          </p>
        </div>
        <button
          className="button secondary small"
          onClick={() => void refresh()}
        >
          <RefreshCw size={16} /> Làm mới
        </button>
      </div>
      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="learning-notice" role="status">
          {notice}
        </div>
      )}
      {!data ? (
        <div className="loading-panel">Đang tải tiến độ…</div>
      ) : (
        <>
          {teacher && (
            <LevelSettings
              key={`${classroom.id}-${data.levelMinutes ?? 60}`}
              minutes={data.levelMinutes ?? 60}
              enabled={data.canConfigureLevels === true}
              busy={busy}
              onSave={(minutes) =>
                act(async () => {
                  await api(`/classrooms/${classroom.id}/level-settings`, {
                    minutes,
                  });
                  onSettingsChanged?.();
                }, "Đã lưu thời gian tăng cấp cho lớp.")
              }
            />
          )}
          {teacher && (
            <section
              className="card learning-section"
              aria-labelledby="chapter-exam-access"
            >
              <h2 id="chapter-exam-access">Quyền kiểm tra theo chương</h2>
              <p>
                Chỉ mở khi lớp đã học và ôn đến chương đó. Săn điểm vẫn yêu cầu
                đủ thời gian, tỷ lệ đúng, sửa sai và vé. Khóa chương ngăn lượt
                mới; lượt đang làm được hoàn thành.
              </p>
              <div className="learning-list">
                {data.chapters.map((ch) => (
                  <div className="learning-row" key={ch.id}>
                    <div>
                      <strong>{ch.title}</strong>
                      <p
                        className={ch.examAllowed ? "learning-ready" : "muted"}
                      >
                        {ch.examAllowed
                          ? "Đã mở kiểm tra"
                          : "Đang khóa kiểm tra"}
                      </p>
                    </div>
                    <button
                      className={`button ${ch.examAllowed ? "secondary" : "primary"} small`}
                      disabled={busy || typeof ch.examAllowed !== "boolean"}
                      aria-label={`${ch.examAllowed ? "Khóa" : "Mở"} kiểm tra · ${ch.title}`}
                      onClick={() =>
                        void act(
                          () =>
                            api(`/chapters/${ch.id}/exam-access`, {
                              enabled: !ch.examAllowed,
                            }),
                          ch.examAllowed
                            ? "Đã khóa kiểm tra chương."
                            : "Đã mở kiểm tra chương.",
                        )
                      }
                    >
                      {ch.examAllowed ? "Khóa kiểm tra" : "Mở kiểm tra"}
                    </button>
                  </div>
                ))}
              </div>
              {data.chapters.some(
                (ch) => typeof ch.examAllowed !== "boolean",
              ) && (
                <p className="muted">
                  Chức năng mở kiểm tra theo chương đang chờ cập nhật server.
                </p>
              )}
              {!data.chapters.length && (
                <p className="muted">Tạo chương để thiết lập quyền kiểm tra.</p>
              )}
            </section>
          )}
          {!teacher && (
            <section aria-labelledby="learning-eligibility">
              <h2 id="learning-eligibility">
                <Ticket size={21} className="reward-ticket-icon" /> Cấp độ & vé
                Săn thưởng
              </h2>
              <p>
                Đạt cấp độ yêu cầu và có vé Săn thưởng để bắt đầu khi giáo viên
                mở kiểm tra. Bài thi dài 20 phút; thời gian thi không cộng vào
                cây.
              </p>
              <div className="learning-grid">
                {data.chapters.map((ch) => {
                  const missing = ch.missing.filter(
                    (reason) =>
                      !/^Cần thêm .* phút học/.test(reason) &&
                      reason !== "Chưa có vé còn lại" &&
                      !reason.includes("Giáo viên chưa mở"),
                  );
                  return (
                    <article
                      className="card learning-chapter hunt-chapter"
                      key={ch.id}
                    >
                      <h3>{ch.title}</h3>
                      <div className="hunt-entry-requirements">
                        <div className="exam-required-level">
                          <StudentLevelIcon level={3} />
                          <div>
                            <small>Cấp độ yêu cầu</small>
                            <strong>Cấp 3 · Cây Non</strong>
                          </div>
                        </div>
                        <div className="hunt-required-ticket">
                          <Ticket size={20} className="reward-ticket-icon" />
                          <span>Cần vé săn thưởng</span>
                          <strong>{ch.tickets.remaining} vé</strong>
                        </div>
                      </div>
                      <dl>
                        <div>
                          <dt>
                            Đúng{" "}
                            {ch.accuracyBasis === "all"
                              ? "tất cả lượt học & sửa sai"
                              : "lượt mới nhất mỗi câu"}
                          </dt>
                          <dd>{ch.accuracy.toFixed(1)}%</dd>
                        </div>
                        <div>
                          <dt>Câu cần sửa</dt>
                          <dd>{ch.openCorrections}</dd>
                        </div>
                      </dl>
                      <span className="pill">
                        {ch.examAllowed
                          ? "Giáo viên đã mở kiểm tra"
                          : "Chờ giáo viên mở kiểm tra"}
                      </span>
                      {ch.eligible && ch.examAllowed ? (
                        <p className="learning-ready">
                          Đã đủ điều kiện Săn điểm.
                        </p>
                      ) : missing.length > 0 ? (
                        <ul className="learning-requirements">
                          {missing.map((reason) => (
                            <li key={reason}>{reason}</li>
                          ))}
                        </ul>
                      ) : null}
                      <div className="hunt-current-level">
                        <StudentLevelIcon level={ch.level} />
                        <div>
                          <small>Cấp độ hiện tại</small>
                          <strong>
                            Cấp {ch.level} · {STUDENT_LEVEL_NAMES[ch.level - 1]}
                          </strong>
                        </div>
                        <span>{duration(ch.seconds)}</span>
                      </div>
                      <button
                        className="button primary"
                        disabled={
                          busy ||
                          !ch.examAllowed ||
                          !ch.eligible ||
                          data.runs.some((r) => r.status === "active")
                        }
                        onClick={() =>
                          void act(() => startRun({ chapterId: ch.id }))
                        }
                      >
                        <Trophy size={17} /> Săn điểm
                      </button>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
          <section
            className="card learning-section"
            aria-labelledby="learning-review"
          >
            <h2 id="learning-review">
              <BookOpen size={21} />{" "}
              {teacher ? "Học kỳ & ma trận ôn tập" : "Ôn chương / ôn học kỳ"}
            </h2>
            {teacher ? (
              <>
                <div className="learning-settings">
                  {data.chapters.map((ch) => (
                    <ChapterSettings
                      key={`${ch.id}-${ch.semester}-${ch.accuracyBasis}`}
                      chapter={ch}
                      busy={busy}
                      onSave={(body) =>
                        act(
                          () => api(`/chapters/${ch.id}/learning`, body),
                          "Đã lưu thiết lập chương.",
                        )
                      }
                    />
                  ))}
                </div>
                <form
                  className="learning-form"
                  onSubmit={(e) => void create(e)}
                >
                  <label>
                    Loại bộ câu
                    <select
                      value={creating}
                      onChange={(e) =>
                        setCreating(e.target.value as typeof creating)
                      }
                      disabled={busy || uploadBusy}
                    >
                      <option value="blueprint">Ma trận ôn tập</option>
                      <option value="exam">Thi chính thức</option>
                    </select>
                  </label>
                  {creating === "exam" && !data.examCreation && (
                    <p className="muted">
                      Tạo đề theo bài, tải đề và mở kiểm tra đang chờ cập nhật
                      server.
                    </p>
                  )}
                  <label>
                    Tên bộ câu
                    <input
                      required
                      maxLength={120}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ví dụ: Ôn tập học kỳ I"
                    />
                  </label>
                  <fieldset>
                    <legend>Chương trong bộ câu</legend>
                    <div className="learning-options">
                      {data.chapters.map((ch) => (
                        <label key={ch.id}>
                          <input
                            type="checkbox"
                            disabled={busy || uploadBusy}
                            checked={selected.includes(ch.id)}
                            onChange={(e) =>
                              setSelected((ids) =>
                                e.target.checked
                                  ? [...ids, ch.id]
                                  : ids.filter((id) => id !== ch.id),
                              )
                            }
                          />
                          {ch.title}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  {creating === "exam" && (
                    <label>
                      Nguồn đề
                      <select
                        value={examSource}
                        disabled={busy || uploadBusy}
                        onChange={(e) =>
                          setExamSource(e.target.value as "bank" | "upload")
                        }
                      >
                        <option value="bank">Chọn từ ngân hàng câu hỏi</option>
                        <option value="upload">
                          Tải đề Word / CSV của giáo viên
                        </option>
                      </select>
                    </label>
                  )}
                  {creating === "exam" && examSource === "upload" ? (
                    <ExamUpload
                      chapters={classroom.chapters.filter((ch) =>
                        selected.includes(ch.id),
                      )}
                      questions={uploaded}
                      onChange={setUploaded}
                      onReadingChange={setUploadBusy}
                    />
                  ) : (
                    <>
                      {creating === "exam" && (
                        <fieldset>
                          <legend>Bài trong đề</legend>
                          <label>
                            Phạm vi bài
                            <select
                              value={lessonMode}
                              onChange={(e) =>
                                setLessonMode(
                                  e.target.value as "all" | "selected",
                                )
                              }
                            >
                              <option value="all">
                                Toàn bộ bài của chương đã chọn
                              </option>
                              <option value="selected">Chọn từng bài</option>
                            </select>
                          </label>
                          {lessonMode === "selected" && (
                            <div className="learning-options">
                              {data.matrix
                                .filter((row) =>
                                  selected.includes(row.chapterId),
                                )
                                .map((row) => (
                                  <label key={row.key}>
                                    <input
                                      type="checkbox"
                                      checked={lessonKeys.includes(row.key)}
                                      onChange={(e) =>
                                        setLessonKeys((keys) =>
                                          e.target.checked
                                            ? [...keys, row.key]
                                            : keys.filter(
                                                (key) => key !== row.key,
                                              ),
                                        )
                                      }
                                    />
                                    {row.chapterTitle} ·{" "}
                                    {row.lesson || "Chưa gắn bài"} (
                                    {row.available} câu)
                                  </label>
                                ))}
                            </div>
                          )}
                        </fieldset>
                      )}
                      <label>
                        Số câu
                        <input
                          type="number"
                          min={1}
                          max={100}
                          required
                          value={count}
                          onChange={(e) => setCount(Number(e.target.value))}
                        />
                      </label>
                      <details>
                        <summary>
                          Trọng số theo bài (để trống để chọn ngẫu nhiên)
                        </summary>
                        <p>
                          Trọng số tỷ lệ với số câu. Chỉ thêm các bài muốn sử
                          dụng; 0 loại bài khỏi ma trận. Thiếu câu sẽ được báo
                          trước khi lưu.
                        </p>
                        <div className="learning-settings">
                          {data.matrix
                            .filter((row) => selected.includes(row.chapterId))
                            .map((row) => (
                              <label key={row.key}>
                                {row.chapterTitle} ·{" "}
                                {row.lesson || "Chưa gắn bài"} ({row.available}{" "}
                                câu)
                                <input
                                  type="number"
                                  min={0}
                                  max={10000}
                                  aria-label={`Trọng số ${row.chapterTitle} ${row.lesson}`}
                                  value={weights[row.key] ?? ""}
                                  onChange={(e) =>
                                    setWeights((old) => {
                                      const next = { ...old };
                                      if (e.target.value === "")
                                        delete next[row.key];
                                      else
                                        next[row.key] = Number(e.target.value);
                                      return next;
                                    })
                                  }
                                />
                              </label>
                            ))}
                        </div>
                      </details>
                    </>
                  )}
                  {creating === "exam" && (
                    <div className="learning-settings">
                      <label>
                        Cách mở kiểm tra
                        <select
                          value={manualOpen ? "manual" : "scheduled"}
                          onChange={(e) =>
                            setManualOpen(e.target.value === "manual")
                          }
                        >
                          <option value="manual">
                            Giáo viên bấm mở khi sẵn sàng
                          </option>
                          <option value="scheduled">
                            Theo lịch, khi các chương đã được cho phép
                          </option>
                        </select>
                      </label>
                      <label>
                        Mở bài thi
                        <input
                          type="datetime-local"
                          required
                          value={starts}
                          onChange={(e) => setStarts(e.target.value)}
                        />
                      </label>
                      <label>
                        Đóng khung thi
                        <input
                          type="datetime-local"
                          required
                          value={closes}
                          onChange={(e) => setCloses(e.target.value)}
                        />
                      </label>
                      <label>
                        Tự nộp ở lần rời tab
                        <input
                          type="number"
                          min={1}
                          max={10}
                          required
                          value={tabLimit}
                          onChange={(e) => setTabLimit(Number(e.target.value))}
                        />
                      </label>
                      <p>
                        Cả lớp dùng cùng tập câu, đảo thứ tự. Mỗi học sinh có
                        tối đa 20 phút, kết thúc sớm hơn nếu khung thi đóng.
                      </p>
                    </div>
                  )}
                  <button
                    className="button primary"
                    disabled={
                      busy ||
                      uploadBusy ||
                      (creating === "exam" && !data.examCreation) ||
                      !selected.length ||
                      (creating === "exam" &&
                        (examSource === "upload"
                          ? !uploaded.length ||
                            uploaded.some(
                              (row) => !selected.includes(row.chapterId),
                            )
                          : lessonMode === "selected" &&
                            !lessonKeys.some((key) =>
                              selected.some((id) => key.startsWith(`${id}::`)),
                            )))
                    }
                  >
                    Lưu {creating === "exam" ? "lịch kiểm tra" : "ma trận"}
                  </button>
                </form>
              </>
            ) : (
              <>
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
                          data.chapters
                            .map((ch) => ch.semester)
                            .filter(Boolean),
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
                    .filter((ch) => !semester || ch.semester === semester)
                    .map((ch) => (
                      <label key={ch.id}>
                        <input
                          type="checkbox"
                          checked={selected.includes(ch.id)}
                          onChange={(e) =>
                            setSelected((ids) =>
                              e.target.checked
                                ? [...ids, ch.id]
                                : ids.filter((id) => id !== ch.id),
                            )
                          }
                        />
                        {ch.title}
                      </label>
                    ))}
                </div>
                <div className="learning-actions">
                  <button
                    className="button primary"
                    disabled={busy || !selected.length}
                    onClick={() =>
                      void act(() =>
                        startReview({
                          chapterIds: selected,
                          questionCount: count,
                        }),
                      )
                    }
                  >
                    Bắt đầu ôn
                  </button>
                  {semester && (
                    <button
                      className="button secondary"
                      disabled={busy}
                      onClick={() =>
                        void act(() =>
                          startReview({
                            chapterIds: data.chapters
                              .filter((ch) => ch.semester === semester)
                              .map((ch) => ch.id),
                            questionCount: count,
                          }),
                        )
                      }
                    >
                      Ôn toàn học kỳ
                    </button>
                  )}
                </div>
              </>
            )}
            {!!data.blueprints.length && (
              <div className="learning-list">
                {data.blueprints.map((p) => (
                  <div className="learning-row" key={p.id}>
                    <div>
                      <strong>{p.title}</strong>
                      <p>
                        {p.chapterIds.length} chương ·{" "}
                        {p.questionCount || "Toàn bộ"} câu
                      </p>
                    </div>
                    {!teacher && (
                      <button
                        className="button secondary small"
                        disabled={busy}
                        onClick={() =>
                          void act(() => startReview({ blueprintId: p.id }))
                        }
                      >
                        Ôn theo ma trận
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {!teacher && !!data.reviews.length && (
              <>
                <h3>Phiên ôn đang dở</h3>
                <div className="learning-list">
                  {data.reviews.map((r) => (
                    <div className="learning-row" key={r.id}>
                      <span>
                        {r.title} · Câu{" "}
                        {Math.min(r.currentIndex + 1, r.questionCount)}/
                        {r.questionCount}
                      </span>
                      <button
                        className="button secondary small"
                        onClick={() => onReview(r.id, classroom.chapters[0])}
                      >
                        Tiếp tục ôn
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
          <section
            className="card learning-section"
            aria-labelledby="learning-exams"
          >
            <h2 id="learning-exams">
              <Clock3 size={21} /> Lịch kiểm tra chính thức
            </h2>
            <p>
              Đáp án và câu sai được công bố sau khi khung thi đóng. Khi đang
              thi, luyện tập và sửa sai tạm khóa.
            </p>
            {!data.exams.length ? (
              <p className="muted">Giáo viên chưa tạo lịch kiểm tra.</p>
            ) : (
              <div className="learning-list">
                {data.exams.map((ex) => (
                  <div className="learning-row" key={ex.id}>
                    <div>
                      <strong>{ex.title}</strong>
                      <p>
                        {ex.questionCount} câu · Tự nộp ở lần rời tab{" "}
                        {ex.tabLimit}
                      </p>
                      <small>
                        {date(ex.startsAt)} → {date(ex.closesAt)} ·{" "}
                        {!ex.enabled
                          ? "Đã đóng"
                          : Date.now() < ex.startsAt
                            ? "Chưa mở"
                            : Date.now() >= ex.closesAt
                              ? "Đã hết giờ"
                              : "Đang mở"}
                      </small>
                      {!!ex.blockedChapters?.length && (
                        <p>
                          Chờ giáo viên mở kiểm tra:{" "}
                          {ex.blockedChapters.map((ch) => ch.title).join(" · ")}
                          .
                        </p>
                      )}
                    </div>
                    {teacher ? (
                      <div className="learning-actions">
                        <button
                          className="button primary small"
                          disabled={
                            busy ||
                            ex.closesAt <= Date.now() ||
                            !data.examCreation
                          }
                          onClick={() =>
                            void act(
                              () => api(`/learning/exams/${ex.id}/open`, {}),
                              "Đã mở kiểm tra và cho phép các chương trong đề. Học sinh có thể vào làm ngay.",
                            )
                          }
                        >
                          Mở kiểm tra ngay
                        </button>
                        <button
                          className="button secondary small"
                          disabled={busy || ex.closesAt <= Date.now()}
                          onClick={() =>
                            void act(
                              () =>
                                api(`/learning/exams/${ex.id}/state`, {
                                  enabled: !ex.enabled,
                                }),
                              "Đã cập nhật trạng thái bài thi.",
                            )
                          }
                        >
                          {ex.enabled ? "Đóng bài thi" : "Mở lại"}
                        </button>
                      </div>
                    ) : (
                      <button
                        className="button primary small"
                        disabled={
                          busy ||
                          !ex.enabled ||
                          !ex.blockedChapters ||
                          ex.blockedChapters.length > 0 ||
                          Date.now() < ex.startsAt ||
                          Date.now() >= ex.closesAt
                        }
                        onClick={() =>
                          void act(() => startRun({ examId: ex.id }))
                        }
                      >
                        Vào bài thi
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
          <section className="card learning-section">
            <div className="learning-heading">
              <h2>Lượt thi & kết quả</h2>
              {teacher && (
                <a
                  className="button secondary small"
                  href={`/api/classrooms/${classroom.id}/learning-report.xlsx`}
                >
                  <Download size={16} /> Xuất Excel
                </a>
              )}
            </div>
            {!data.runs.length ? (
              <p className="muted">Chưa có lượt thi.</p>
            ) : (
              <div className="learning-list">
                {data.runs.map((r) => (
                  <div className="learning-row" key={r.id}>
                    <div>
                      <strong>{r.title}</strong>
                      <p>
                        {teacher ? `${r.studentName} · ` : ""}
                        {r.status === "active"
                          ? `Đang làm · Hạn ${date(r.deadlineAt)}`
                          : `Đã nộp · ${r.score?.toFixed(1)} / 10`}{" "}
                        · {r.warnings} lần rời tab
                      </p>
                    </div>
                    <button
                      className="button secondary small"
                      onClick={() => openRun(r.id)}
                    >
                      {r.status === "active" && !teacher
                        ? "Tiếp tục thi"
                        : "Xem bài"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
          <section className="card learning-section">
            <h2>Điểm thưởng hệ thống</h2>
            <p>
              Mỗi chương đạt Kết Trái (cấp 5) nhận 1 điểm; mỗi lượt Săn điểm đạt
              từ 8,0 nhận 1 điểm. Giáo viên duyệt việc ghi nhận.
            </p>
            {!data.rewards.length ? (
              <p className="muted">Chưa có điểm thưởng.</p>
            ) : (
              <div className="learning-list">
                {data.rewards.map((r) => (
                  <div className="learning-row" key={r.id}>
                    <div>
                      <strong>
                        {teacher ? `${r.studentName} · ` : ""}
                        {r.label} · +{r.points}
                      </strong>
                      <p>
                        {statusText[r.status]} · {date(r.createdAt)}
                      </p>
                    </div>
                    {teacher && r.status === "pending" && (
                      <div className="learning-actions">
                        <button
                          className="button primary small"
                          disabled={busy}
                          onClick={() =>
                            void act(() =>
                              api(`/learning/rewards/${r.id}/review`, {
                                status: "approved",
                              }),
                            )
                          }
                        >
                          Duyệt
                        </button>
                        <button
                          className="button secondary small"
                          disabled={busy}
                          onClick={() =>
                            void act(() =>
                              api(`/learning/rewards/${r.id}/review`, {
                                status: "rejected",
                              }),
                            )
                          }
                        >
                          Từ chối
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function LevelSettings({
  minutes,
  enabled,
  busy,
  onSave,
}: {
  minutes: number;
  enabled: boolean;
  busy: boolean;
  onSave: (minutes: number) => Promise<void>;
}) {
  const [draft, setDraft] = useState(String(minutes));
  const value = Number(draft);
  const valid =
    draft.trim() !== "" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 1440;
  return (
    <section
      className="card learning-section level-settings"
      aria-labelledby="level-settings-title"
    >
      <div className="level-settings-heading">
        <span className="level-settings-symbol">
          <Clock3 size={23} />
        </span>
        <div>
          <h2 id="level-settings-title">Thời gian tăng cấp</h2>
          <p>
            Chọn nhịp lớn lên của khu vườn cho lớp này, áp dụng cho mọi chương.
          </p>
        </div>
      </div>
      <form
        aria-label="Cài đặt thời gian tăng cấp"
        onSubmit={(e) => {
          e.preventDefault();
          if (enabled && valid && value !== minutes && !busy)
            void onSave(value);
        }}
      >
        <div className="level-settings-controls">
          <label>
            Số phút cho mỗi cấp
            <div className="level-settings-input">
              <input
                type="number"
                min={1}
                max={1440}
                step={1}
                required
                value={draft}
                disabled={busy || !enabled}
                onChange={(e) => setDraft(e.target.value)}
                aria-describedby="level-settings-help"
              />
              <span>phút</span>
            </div>
          </label>
          <button
            className="button primary"
            disabled={busy || !enabled || !valid || value === minutes}
          >
            {busy ? "Đang lưu…" : "Lưu thời gian"}
          </button>
        </div>
        <p id="level-settings-help" className="muted">
          Mặc định 60 phút mỗi cấp · Có thể đặt từ 1 đến 1440 phút.
        </p>
        <ol
          className="level-settings-preview"
          aria-label="Xem trước mốc tăng cấp"
        >
          {STUDENT_LEVEL_NAMES.map((name, index) => (
            <li key={name}>
              <StudentLevelIcon level={index + 1} />
              <strong>
                Cấp {index + 1} · {name}
              </strong>
              <small>{valid ? duration(index * value * 60) : "—"}</small>
            </li>
          ))}
        </ol>
        <p className="muted">
          Khi lưu, cấp độ tính lại từ thời gian đã học. Vé và điểm đã được cấp
          vẫn được giữ.
        </p>
        {!enabled && (
          <p role="status" className="muted">
            Cài đặt này đang chờ cập nhật server Railway.
          </p>
        )}
      </form>
    </section>
  );
}

function ChapterSettings({
  chapter,
  busy,
  onSave,
}: {
  chapter: LearningChapter;
  busy: boolean;
  onSave: (body: object) => Promise<void>;
}) {
  const [semester, setSemester] = useState(chapter.semester);
  const [basis, setBasis] = useState(chapter.accuracyBasis);
  return (
    <form
      className="learning-chapter-settings"
      onSubmit={(e) => {
        e.preventDefault();
        void onSave({ semester, accuracyBasis: basis });
      }}
    >
      <strong>{chapter.title}</strong>
      <label>
        Học kỳ
        <input
          maxLength={80}
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
          placeholder="Học kỳ I"
        />
      </label>
      <label>
        Tỷ lệ mở Săn điểm
        <select
          value={basis}
          onChange={(e) => setBasis(e.target.value as typeof basis)}
        >
          <option value="all">Tất cả lượt học & sửa sai</option>
          <option value="latest">Lượt mới nhất mỗi câu</option>
        </select>
      </label>
      <button className="button secondary small" disabled={busy}>
        Lưu chương
      </button>
    </form>
  );
}

function ExamRoom({
  id,
  user,
  onClose,
}: {
  id: string;
  user: User;
  onClose: () => void;
}) {
  const teacher = user.role === "teacher";
  const storageKey = `greenedu-exam:${user.id}:${id}`;
  const [initial] = useState<{
    answers: Record<string, number>;
    tabs: string[];
  }>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
      return {
        answers:
          saved?.answers && typeof saved.answers === "object"
            ? saved.answers
            : {},
        tabs: Array.isArray(saved?.tabs) ? saved.tabs : [],
      };
    } catch {
      return { answers: {}, tabs: [] };
    }
  });
  const dirty = useRef<Record<string, number>>(initial.answers);
  const tabs = useRef<string[]>(initial.tabs);
  const current = useRef<ExamRun | null>(null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const mounted = useRef(true);
  const anchor = useRef({ server: 0, elapsed: performance.now() });
  const [run, setRun] = useState<ExamRun | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [now, setNow] = useState(0);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const persist = () => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({ answers: dirty.current, tabs: tabs.current }),
    );
    if (mounted.current)
      setPending(Object.keys(dirty.current).length + tabs.current.length);
  };
  function accept(r: ExamRun) {
    current.current = r;
    anchor.current = { server: r.serverNow, elapsed: performance.now() };
    if (r.status === "submitted") {
      dirty.current = {};
      tabs.current = [];
      localStorage.removeItem(storageKey);
    }
    if (mounted.current) {
      setRun(r);
      setAnswers({ ...r.answers, ...dirty.current });
      setNow(r.serverNow);
      setPending(Object.keys(dirty.current).length + tabs.current.length);
    }
  }
  function enqueue(task: () => Promise<void>) {
    const next = queue.current.then(task).catch((e) => {
      if (mounted.current)
        setError(
          `${errorMessage(e)} Các thay đổi chưa gửi được giữ trên máy này; hãy thử lại trước khi hết giờ.`,
        );
    });
    queue.current = next;
    return next;
  }
  async function sync() {
    if (!current.current)
      accept(await api<ExamRun>(`/learning/exam-runs/${id}`));
    if (teacher || current.current!.status !== "active") return;
    if (Object.keys(dirty.current).length) {
      const snapshot = { ...dirty.current };
      let r: ExamRun;
      try {
        r = await api<ExamRun>(`/learning/exam-runs/${id}/answers`, {
          answers: snapshot,
          revision: current.current!.revision,
        });
      } catch (e) {
        if (!(e instanceof ApiError && e.status === 409)) throw e;
        accept(await api<ExamRun>(`/learning/exam-runs/${id}`));
        r = await api<ExamRun>(`/learning/exam-runs/${id}/answers`, {
          answers: snapshot,
          revision: current.current!.revision,
        });
      }
      for (const [key, value] of Object.entries(snapshot))
        if (dirty.current[key] === value) delete dirty.current[key];
      accept(r);
      persist();
    }
    while (tabs.current.length && current.current!.status === "active") {
      const eventId = tabs.current[0];
      const r = await api<ExamRun>(`/learning/exam-runs/${id}/tab`, {
        eventId,
      });
      if (tabs.current[0] === eventId) tabs.current.shift();
      accept(r);
      persist();
    }
    if (mounted.current) setError("");
  }
  useEffect(() => {
    mounted.current = true;
    const refresh = () =>
      enqueue(async () => {
        await sync();
        accept(await api<ExamRun>(`/learning/exam-runs/${id}`));
        setError("");
      });
    void refresh();
    const poll = setInterval(() => void refresh(), 4000);
    const timer = setInterval(
      () =>
        setNow(
          anchor.current.server + performance.now() - anchor.current.elapsed,
        ),
      1000,
    );
    const visibility = () => {
      if (!teacher && document.hidden && current.current?.status === "active") {
        tabs.current.push(crypto.randomUUID());
        persist();
        void enqueue(sync);
      } else if (!document.hidden) void refresh();
    };
    const online = () => void refresh();
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (current.current?.status === "active" && !teacher) {
        e.preventDefault();
      }
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("online", online);
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      mounted.current = false;
      clearInterval(poll);
      clearInterval(timer);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("online", online);
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [id]);
  function choose(questionId: string, value: number) {
    dirty.current[questionId] = value;
    setAnswers((old) => ({ ...old, [questionId]: value }));
    persist();
    void enqueue(sync);
  }
  async function submit() {
    setSubmitting(true);
    await enqueue(async () => {
      await sync();
      accept(await api<ExamRun>(`/learning/exam-runs/${id}/submit`, {}));
      setError("");
    });
    setSubmitting(false);
  }
  if (!run)
    return (
      <div className="card learning-section">
        <button className="text-button" onClick={onClose}>
          <ArrowLeft size={16} /> Về danh sách
        </button>
        {error ? (
          <div className="error-banner" role="alert">
            {error}
            <button
              onClick={() =>
                void enqueue(async () => {
                  await sync();
                  accept(await api<ExamRun>(`/learning/exam-runs/${id}`));
                })
              }
            >
              Thử lại
            </button>
          </div>
        ) : (
          <p>Đang khôi phục bài thi…</p>
        )}
      </div>
    );
  const active = run.status === "active";
  if (!run.questions.length)
    return (
      <div className="card learning-section">
        <h1>{run.title}</h1>
        <p>
          Lượt thi cũ này không có câu hỏi. Hãy liên hệ giáo viên để kiểm tra bộ
          đề.
        </p>
        <button className="button secondary" onClick={onClose}>
          Về danh sách
        </button>
      </div>
    );
  const seconds = Math.max(0, Math.ceil((run.deadlineAt - now) / 1000));
  const q = run.questions[index];
  return (
    <div className="exam-room">
      <div className="learning-heading">
        <div>
          <span className="eyebrow">
            {run.kind === "hunt" ? "SĂN ĐIỂM" : "THI CHÍNH THỨC"}
          </span>
          <h1>{run.title}</h1>
        </div>
        <span className={`pill ${seconds < 60 && active ? "amber" : ""}`}>
          <Clock3 size={17} />
          {active
            ? `${Math.floor(seconds / 60)
                .toString()
                .padStart(
                  2,
                  "0",
                )}:${(seconds % 60).toString().padStart(2, "0")}`
            : "Đã nộp"}
        </span>
      </div>
      {error && (
        <div className="error-banner" role="alert">
          {error}
          <button onClick={() => void enqueue(sync)}>Thử lưu lại</button>
        </div>
      )}
      <div className="info-panel">
        <p>
          {active
            ? `${Object.keys(answers).length}/${run.questions.length} câu đã chọn · ${pending ? `${pending} thay đổi chưa đồng bộ` : "Đáp án đã lưu"}. Rời tab ${run.warnings}/${run.tabLimit}; đến lần ${run.tabLimit} bài sẽ tự nộp.`
            : `Điểm ${run.score?.toFixed(1)} / 10 · ${run.reason === "tabs" ? "Tự nộp do rời tab" : run.reason === "deadline" ? "Tự nộp khi hết giờ" : run.reason === "teacher" ? "Giáo viên đã đóng bài thi" : "Đã hoàn thành"}.`}
        </p>
      </div>
      {!active && !run.results && (
        <p className="learning-notice">
          Chờ khung thi đóng để xem đáp án và cập nhật sổ tay sửa sai.
        </p>
      )}
      <div className="exam-columns">
        <aside className="card exam-map">
          <h2>Danh sách câu</h2>
          <div className="exam-numbers">
            {run.questions.map((question, i) => (
              <button
                key={question.id}
                aria-label={`Đến câu ${i + 1}`}
                aria-current={index === i ? "true" : undefined}
                className={`${index === i ? "current" : ""} ${answers[question.id] !== undefined ? "answered" : ""}`}
                onClick={() => setIndex(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <p>Chọn số để chuyển câu. Đáp án tự lưu khi chọn.</p>
        </aside>
        <article className="card question-card">
          <span className="eyebrow">
            CÂU {index + 1}/{run.questions.length} · {q.chapterTitle}
          </span>
          <h2>{q.text}</h2>
          <div className="choices">
            {q.choices.map((choice, i) => (
              <button
                key={i}
                className={`choice ${answers[q.id] === i ? "selected" : ""} ${run.results?.find((r) => r.questionId === q.id)?.correctIndex === i ? "correct-choice" : ""}`}
                aria-pressed={answers[q.id] === i}
                disabled={!active || teacher || submitting || seconds === 0}
                onClick={() => choose(q.id, i)}
              >
                <span className="choice-letter">{"ABCD"[i]}</span>
                <span>{choice}</span>
              </button>
            ))}
          </div>
          {run.results && (
            <div className="explanation" role="status">
              <strong>
                {run.results.find((r) => r.questionId === q.id)?.correct
                  ? "Đúng"
                  : "Cần ôn lại"}
              </strong>
              <p>
                {run.results.find((r) => r.questionId === q.id)?.explanation}
              </p>
            </div>
          )}
          <div className="learning-actions">
            <button
              className="button secondary"
              disabled={!index}
              onClick={() => setIndex((i) => i - 1)}
            >
              Câu trước
            </button>
            <button
              className="button secondary"
              disabled={index === run.questions.length - 1}
              onClick={() => setIndex((i) => i + 1)}
            >
              Câu sau
            </button>
          </div>
        </article>
      </div>
      <div className="exam-footer">
        {active && !teacher ? (
          <>
            <p>
              Hạn nộp theo server: {date(run.deadlineAt)}. Tải lại trang vẫn
              tiếp tục cùng lượt thi.
            </p>
            <button
              className="button primary"
              disabled={submitting}
              onClick={() => {
                if (
                  confirm(
                    `Nộp bài với ${Object.keys(answers).length}/${run.questions.length} câu đã chọn?`,
                  )
                )
                  void submit();
              }}
            >
              {submitting ? "Đang nộp…" : "Nộp bài"}
            </button>
          </>
        ) : (
          <button className="button primary" onClick={onClose}>
            <ArrowLeft size={17} /> Về danh sách
          </button>
        )}
      </div>
    </div>
  );
}
