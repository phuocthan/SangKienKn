import { DEFAULT_SESSION_POLICY } from "../shared/session-policy";
import { AnswerFields } from "./AnswerFields";
import { answerComplete, type QuestionAnswer } from "../shared/question-types";
import { QuestionText } from "./QuestionText";
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
  Notebook,
  Clock3,
  Download,
  Plus,
  Trophy,
  Ticket,
} from "./icons";
import { api, ApiError, duration, errorMessage } from "./api";
import { WorkspaceHeading } from "./WorkspaceHeading";
import { Modal } from "./components";
import { ExamMetadata } from "./ExamMetadata";
import { StudentLevelIcon } from "./StudentLevel";
import { STUDENT_LEVEL_NAMES } from "../shared/student-levels";
import { ExamUpload, type UploadedExamQuestion } from "./ExamUpload";
import { ExamBank, type ExamBankSelection } from "./ExamBank";
import { OnlineExamGroups } from "./OnlineExamGroups";
import { HuntAccess } from "./HuntAccess";
import type { Chapter, Classroom, User } from "./types";
import type {
  ExamRun,
  ExamDefinition,
  LearningChapter,
  LearningOverview,
} from "../shared/learning";
import "./learning.css";

const date = (n: number) => new Date(n).toLocaleString("vi-VN");
const statusText = {
  pending: "Chờ giáo viên duyệt",
  approved: "Đã duyệt",
  rejected: "Không ghi nhận",
};

export function Learning({
  classroom,
  user,
  onCorrections,
  entryRunId,
  onExamExit,
  view = "hunt",
}: {
  classroom: Classroom;
  user: User;
  onCorrections: (chapterId: string) => void;
  entryRunId?: string;
  onExamExit?: () => void;
  view?: "hunt" | "online";
}) {
  const teacher = user.role === "teacher";
  const onlinePage = view === "online";
  const hash = new URLSearchParams(location.hash.slice(1));
  const [runId, setRunId] = useState(
    entryRunId ||
      (hash.get("learning") === classroom.id &&
      (hash.get("workspace") === "online") === onlinePage
        ? (hash.get("exam") ?? "")
        : ""),
  );
  const [data, setData] = useState<LearningOverview | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [deletingExam, setDeletingExam] = useState<ExamDefinition | null>(null);
  const [deleteError, setDeleteError] = useState("");
  function askDelete(exam: ExamDefinition) {
    setDeleteError("");
    setDeletingExam(exam);
  }
  async function deleteExam() {
    if (busy || !deletingExam) return;
    setBusy(true);
    setDeleteError("");
    try {
      await api(`/learning/exams/${deletingExam.id}/delete`, {});
      const id = deletingExam.id;
      setData((current) =>
        current
          ? {
              ...current,
              exams: current.exams.filter((ex) => ex.id !== id),
              runs: current.runs.filter((run) => run.examId !== id),
            }
          : current,
      );
      setDeletingExam(null);
      setNotice("Đã xóa bài kiểm tra.");
      await refresh();
      requestAnimationFrame(() => createExamButtonRef.current?.focus());
    } catch (cause) {
      setDeleteError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }
  const [examFormOpen, setExamFormOpen] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [progressChapterId, setProgressChapterId] = useState("");
  const vietnamInput = (timestamp: number) =>
    new Date(timestamp + 7 * 3600000).toISOString().slice(0, 16);
  const scheduleDate = (timestamp: number) =>
    new Intl.DateTimeFormat("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      dateStyle: "short",
      timeStyle: "short",
    }).format(timestamp);
  async function editExam(id: string) {
    if (busy) return;
    setBusy(true);
    try {
      const draft = await api<{
        title: string;
        source: "bank" | "upload";
        tabLimit: number;
        durationMinutes: number;
        preparationMinutes: number;
        scheduledStartAt: number | null;
        progressChapterId?: string | null;
        chapterIds?: string[];
        questionCount?: number;
        lessonKeys?: string[];
        weights?: Record<string, number>;
        questions?: UploadedExamQuestion[];
      }>(`/learning/exams/${id}/edit`);
      setProgressChapterId(draft.progressChapterId ?? "");
      setTitle(draft.title);
      setExamSource(draft.source);
      setTabLimit(draft.tabLimit);
      setDurationMinutes(draft.durationMinutes);
      setPreparationMinutes(draft.preparationMinutes);
      setScheduleEnabled(draft.scheduledStartAt != null);
      setScheduledDate(
        draft.scheduledStartAt ? vietnamInput(draft.scheduledStartAt) : "",
      );
      setCount(draft.questionCount ?? draft.questions?.length ?? 10);
      setWeights(draft.weights ?? {});
      setUploaded(draft.questions ?? []);
      setBankSelection(
        Object.fromEntries(
          (draft.chapterIds ?? []).map((id) => [
            id,
            draft.lessonKeys
              ? (data?.matrix ?? [])
                  .filter(
                    (r) =>
                      r.chapterId === id && draft.lessonKeys!.includes(r.key),
                  )
                  .map((r) => r.key)
              : "all",
          ]),
        ),
      );
      setEditingExamId(id);
      setFormError("");
      setError("");
      setCreatedExamError("");
      setCreatedOnlineExam(null);
      setExamFormOpen(true);
    } catch (cause) {
      if (createdOnlineExam) setCreatedExamError(errorMessage(cause));
      else setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }
  const [createdOnlineExam, setCreatedOnlineExam] = useState<{
    id: string;
    preparationMinutes: number;
    durationMinutes: number;
    scheduledStartAt?: number | null;
  } | null>(null);
  const [createdExamError, setCreatedExamError] = useState("");
  const createExamButtonRef = useRef<HTMLButtonElement>(null);
  const [formError, setFormError] = useState("");
  const formErrorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (formError) formErrorRef.current?.focus();
  }, [formError]);
  const [count, setCount] = useState(10);
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [title, setTitle] = useState("");
  const [tabLimit, setTabLimit] = useState(4);
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [preparationMinutes, setPreparationMinutes] = useState(3);
  const [examSource, setExamSource] = useState<"" | "bank" | "upload">("");
  const [bankSelection, setBankSelection] = useState<ExamBankSelection>({});
  const [uploaded, setUploaded] = useState<UploadedExamQuestion[]>([]);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [huntChapter, setHuntChapter] = useState<string | null>(null);
  const selectedChapters =
    examSource === "upload"
      ? [...new Set(uploaded.map((row) => row.chapterId))]
      : Object.keys(bankSelection).filter(
          (id) => bankSelection[id] === "all" || bankSelection[id].length > 0,
        );
  const bankKeys = (data?.matrix ?? [])
    .filter(
      (row) =>
        bankSelection[row.chapterId] === "all" ||
        (Array.isArray(bankSelection[row.chapterId]) &&
          bankSelection[row.chapterId].includes(row.key)),
    )
    .map((row) => row.key);
  // Old scheduled definitions stay accessible under Online; hunts have their own history.
  const exams = data?.exams.filter((ex) => ex.delivery !== "online") ?? [];
  const runs =
    data?.runs.filter((run) =>
      onlinePage
        ? run.kind === "official" && run.delivery !== "online"
        : run.kind === "hunt",
    ) ?? [];
  const startKeys = useRef(new Map<string, string>());
  const refreshSequence = useRef(0);
  const requestKey = (intent: string) => {
    if (!startKeys.current.has(intent))
      startKeys.current.set(intent, crypto.randomUUID());
    return startKeys.current.get(intent)!;
  };
  const refresh = useCallback(async () => {
    const ticket = ++refreshSequence.current;
    try {
      const overview = await api<LearningOverview>(
        `/classrooms/${classroom.id}/learning`,
      );
      if (ticket === refreshSequence.current) {
        setData(overview);
        setError("");
      }
    } catch (e) {
      if (ticket === refreshSequence.current) setError(errorMessage(e));
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
    document.addEventListener("visibilitychange", update);
    return () => {
      refreshSequence.current++;
      clearInterval(timer);
      window.removeEventListener("focus", update);
      window.removeEventListener("online", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [refresh]);
  useEffect(() => {
    if (entryRunId) setRunId(entryRunId);
  }, [entryRunId]);
  async function act(action: () => Promise<unknown>, message = "") {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await action();
      setNotice(message);
      await refresh();
    } catch (e) {
      if (examFormOpen) setFormError(errorMessage(e));
      else setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  function openRun(id: string) {
    location.hash = new URLSearchParams({
      learning: classroom.id,
      exam: id,
      workspace: onlinePage ? "online" : "hunt",
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
  function dismissCreatedOnlineExam() {
    setCreatedOnlineExam(null);
    requestAnimationFrame(() => createExamButtonRef.current?.focus());
  }
  async function startCreatedOnlineExam() {
    if (busy || !createdOnlineExam) return;
    setBusy(true);
    setCreatedExamError("");
    setError("");
    let started = false;
    try {
      await api(`/learning/exams/${createdOnlineExam.id}/open`, {});
      setCreatedOnlineExam(null);
      started = true;
      setNotice(
        `Đã gửi thông báo cho lớp. Kiểm tra sẽ mở sau ${createdOnlineExam.preparationMinutes} phút, thời gian làm bài ${createdOnlineExam.durationMinutes} phút.`,
      );
      await refresh();
    } catch (e) {
      setCreatedExamError(errorMessage(e));
    } finally {
      setBusy(false);
      if (started)
        requestAnimationFrame(() => createExamButtonRef.current?.focus());
    }
  }
  async function create(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!examSource) {
      setFormError("Chọn một nguồn đề: Upload file hoặc Chọn từ ngân hàng.");
      return;
    }
    const scheduledStartAt = scheduleEnabled
      ? Date.parse(`${scheduledDate}:00+07:00`)
      : null;
    if (
      scheduleEnabled &&
      (!data?.examScheduling ||
        !Number.isFinite(scheduledStartAt) ||
        scheduledStartAt! <= (data?.serverNow ?? Date.now()))
    ) {
      setFormError("Chọn ngày và giờ bắt đầu trong tương lai (giờ Việt Nam).");
      return;
    }
    const body = {
      title,
      chapterIds: selectedChapters,
      questionCount: count,
      weights: Object.fromEntries(
        Object.entries(weights).filter(([key]) => bankKeys.includes(key)),
      ),
      tabLimit,
      source: examSource,
      delivery: "online",
      durationMinutes,
      preparationMinutes,
      ...(data?.examScheduling ? { scheduledStartAt } : {}),
      ...(data?.examProgressCredit
        ? { progressChapterId: progressChapterId || null }
        : {}),
      ...(examSource === "upload"
        ? { questions: uploaded }
        : Object.values(bankSelection).some(Array.isArray)
          ? { lessonKeys: bankKeys }
          : {}),
    };
    const intent = `save:${editingExamId ?? "new"}:${JSON.stringify(body)}`;
    await act(async () => {
      const saved = await api<{ id: string }>(
        editingExamId
          ? `/learning/exams/${editingExamId}/update`
          : `/classrooms/${classroom.id}/exams`,
        { ...body, requestId: requestKey(intent) },
      );
      startKeys.current.delete(intent);
      setExamFormOpen(false);
      setTitle("");
      setCreatedExamError("");
      if (editingExamId) {
        setEditingExamId(null);
        setNotice("Đã cập nhật bài kiểm tra.");
        requestAnimationFrame(() => createExamButtonRef.current?.focus());
      } else
        setCreatedOnlineExam({
          id: saved.id,
          preparationMinutes,
          durationMinutes,
          scheduledStartAt,
        });
    });
  }
  if (runId)
    return (
      <ExamRoom
        key={runId}
        id={runId}
        user={user}
        onClose={() => {
          setRunId("");
          onExamExit?.();
          location.hash = new URLSearchParams({
            learning: classroom.id,
            workspace: onlinePage ? "online" : "hunt",
          }).toString();
          void refresh();
        }}
      />
    );
  return (
    <div
      className={`learning-workspace ${onlinePage ? "online-workspace" : "hunt-workspace"} ${teacher ? "teacher-learning" : "student-learning"}`}
    >
      <WorkspaceHeading className="learning-heading learning-page-heading">
        <h1>{onlinePage ? "Kiểm tra" : "Săn thưởng"}</h1>
        {teacher && onlinePage && (
          <button
            ref={createExamButtonRef}
            className="button primary"
            disabled={busy || !data}
            onClick={() => {
              if (editingExamId) {
                setTitle("");
                setExamSource("");
                setBankSelection({});
                setUploaded([]);
                setWeights({});
                setScheduleEnabled(false);
                setScheduledDate("");
                setProgressChapterId("");
              }
              setEditingExamId(null);
              setFormError("");
              setExamFormOpen(true);
            }}
          >
            <Plus size={19} /> Tạo bài kiểm tra
          </button>
        )}
      </WorkspaceHeading>
      {error && (
        <div className="error-banner" role="alert">
          {error}
          <button type="button" onClick={() => void refresh()}>
            Thử lại
          </button>
        </div>
      )}
      {notice && (
        <div className="learning-notice" role="status">
          {notice}
        </div>
      )}
      {createdOnlineExam && (
        <Modal
          title="Đã tạo bài kiểm tra"
          dismissible={!busy}
          onClose={dismissCreatedOnlineExam}
        >
          <p>
            {createdOnlineExam.scheduledStartAt
              ? `Đã hẹn giờ bắt đầu lúc ${scheduleDate(createdOnlineExam.scheduledStartAt)} (giờ Việt Nam). Bài sẽ tự mở theo lịch, kể cả khi bạn đóng trình duyệt.`
              : "Đã lưu bài kiểm tra. Bạn có thể bắt đầu ngay hoặc để sau."}
          </p>
          {createdExamError && (
            <p className="error-banner" role="alert">
              {createdExamError}
            </p>
          )}
          <div className="modal-actions">
            {!createdOnlineExam.scheduledStartAt && (
              <button
                type="button"
                className="button primary"
                disabled={busy}
                onClick={() => void startCreatedOnlineExam()}
              >
                {busy ? "Đang bắt đầu…" : "Bắt đầu ngay"}
              </button>
            )}
            {data?.examEditing && (
              <button
                type="button"
                className="button secondary"
                disabled={busy}
                onClick={() => void editExam(createdOnlineExam.id)}
              >
                Chỉnh sửa thông tin
              </button>
            )}
            <button
              type="button"
              className="button outline"
              disabled={busy}
              onClick={dismissCreatedOnlineExam}
            >
              {createdOnlineExam.scheduledStartAt ? "Đã hiểu" : "Để sau"}
            </button>
          </div>
        </Modal>
      )}
      {deletingExam && (
        <Modal
          title="Xóa bài kiểm tra"
          dismissible={!busy}
          onClose={() => setDeletingExam(null)}
        >
          <p>
            Xóa bài kiểm tra <strong>{deletingExam.title}</strong>?
          </p>
          <p>
            Đề và toàn bộ bài làm, điểm, kết quả của buổi này sẽ bị xóa vĩnh
            viễn. Ngân hàng câu hỏi vẫn được giữ. Bạn nên tải kết quả trước nếu
            cần lưu lại.
          </p>
          {deleteError && (
            <p className="error-banner" role="alert">
              {deleteError}
            </p>
          )}
          <div className="modal-actions">
            <button
              type="button"
              className="button secondary"
              disabled={busy}
              onClick={() => setDeletingExam(null)}
            >
              Hủy
            </button>
            <button
              type="button"
              className="button danger"
              disabled={busy}
              onClick={() => void deleteExam()}
            >
              {busy ? "Đang xóa…" : "Xóa vĩnh viễn"}
            </button>
          </div>
        </Modal>
      )}
      {!data ? (
        <div className="loading-panel" role="status">
          Đang tải…
        </div>
      ) : (
        <>
          {!onlinePage && teacher && (
            <section
              className="card learning-section"
              aria-labelledby="hunt-manage-title"
            >
              <h2 id="hunt-manage-title">Đề săn thưởng theo chương</h2>
              {!data.chapters.length && (
                <p className="muted">Thêm chương để mở kiểm tra săn thưởng.</p>
              )}
              <div className="learning-list">
                {data.chapters.map((ch) => (
                  <article className="learning-row" key={ch.id}>
                    <div>
                      <strong>{ch.title}</strong>
                      <p>
                        {ch.hunt?.title || "Chưa có đề tải lên"}
                        {data.huntPaperSlots
                          ? ` · ${ch.hunt?.papers?.length ?? 0}/3 đề`
                          : ""}
                        {ch.hunt?.uploadedAt
                          ? ` · ${date(ch.hunt.uploadedAt)}`
                          : ""}
                      </p>
                      <small>
                        {(ch.hunt?.open ?? ch.examAllowed)
                          ? "Đang mở"
                          : "Đã khóa"}
                      </small>
                    </div>
                    <button
                      className="button secondary small"
                      disabled={
                        busy ||
                        !data.classManagement ||
                        !classroom.chapters.some((c) => c.id === ch.id)
                      }
                      onClick={() => setHuntChapter(ch.id)}
                    >
                      {(ch.hunt?.open ?? ch.examAllowed)
                        ? "Khóa săn thưởng"
                        : "Mở săn thưởng"}
                    </button>
                  </article>
                ))}
              </div>
              {!data.classManagement && (
                <p className="muted">
                  Quản lý đề săn thưởng đang chờ cập nhật backend Railway.
                </p>
              )}
              <details>
                <summary>Thiết lập chương</summary>
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
              </details>
            </section>
          )}
          {huntChapter &&
            data.chapters.some((c) => c.id === huntChapter) &&
            classroom.chapters.some((c) => c.id === huntChapter) && (
              <HuntAccess
                multiplePapers={!!data.huntPaperSlots}
                teacherControlled={!!data.huntTeacherControlled}
                key={huntChapter}
                chapter={classroom.chapters.find((c) => c.id === huntChapter)!}
                state={data.chapters.find((c) => c.id === huntChapter)!}
                policy={data.sessionPolicy ?? DEFAULT_SESSION_POLICY}
                onClose={() => setHuntChapter(null)}
                onSaved={refresh}
              />
            )}
          {onlinePage && teacher && examFormOpen && (
            <Modal
              title={
                editingExamId ? "Chỉnh sửa bài kiểm tra" : "Tạo bài kiểm tra"
              }
              className="online-exam-create-modal"
              dismissible={!busy && !uploadBusy}
              onClose={() => setExamFormOpen(false)}
            >
              <section
                className="card learning-section"
                aria-labelledby="learning-review"
              >
                <h2 id="learning-review">
                  <BookOpen size={21} aria-hidden="true" /> Chuẩn bị đề & thời
                  gian
                </h2>
                <form className="learning-form" onSubmit={create}>
                  {formError && (
                    <p
                      ref={formErrorRef}
                      tabIndex={-1}
                      className="error-banner"
                      role="alert"
                    >
                      {formError}
                    </p>
                  )}
                  {!data.onlineExams && (
                    <p className="muted">
                      Kiểm tra online và thông báo cho lớp đang chờ cập nhật
                      server Railway.
                    </p>
                  )}
                  <fieldset disabled={busy || uploadBusy}>
                    <legend className="sr-only">
                      Thông tin kiểm tra online
                    </legend>
                    <label>
                      Tên bộ câu
                      <input
                        required
                        name="title"
                        autoComplete="off"
                        maxLength={120}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ví dụ: Dao động điều hòa…"
                      />
                    </label>
                    <fieldset className="exam-source">
                      <legend>Nguồn đề</legend>
                      <p>Bắt buộc chọn một trong hai nguồn.</p>
                      <div className="learning-options">
                        <label>
                          <input
                            type="radio"
                            name="exam-source"
                            value="upload"
                            required
                            checked={examSource === "upload"}
                            onChange={() => setExamSource("upload")}
                          />
                          Upload file
                        </label>
                        <label>
                          <input
                            type="radio"
                            name="exam-source"
                            value="bank"
                            required
                            checked={examSource === "bank"}
                            onChange={() => setExamSource("bank")}
                          />
                          Chọn từ ngân hàng
                        </label>
                      </div>
                    </fieldset>
                  </fieldset>
                  {examSource === "upload" ? (
                    <fieldset disabled={busy}>
                      <legend className="sr-only">Đề kiểm tra tải lên</legend>
                      <ExamUpload
                        chapters={classroom.chapters}
                        questions={uploaded}
                        onChange={setUploaded}
                        onReadingChange={setUploadBusy}
                      />
                    </fieldset>
                  ) : (
                    examSource === "bank" && (
                      <fieldset disabled={busy || uploadBusy}>
                        <legend className="sr-only">Đề từ ngân hàng</legend>
                        <ExamBank
                          chapters={classroom.chapters}
                          matrix={data.matrix}
                          selection={bankSelection}
                          onChange={setBankSelection}
                          disabled={busy || uploadBusy}
                        />
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
                          <div className="learning-settings">
                            {data.matrix
                              .filter((row) => bankKeys.includes(row.key))
                              .map((row) => (
                                <label key={row.key}>
                                  {row.chapterTitle} · {row.lesson} (
                                  {row.available} câu)
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
                                          next[row.key] = Number(
                                            e.target.value,
                                          );
                                        return next;
                                      })
                                    }
                                  />
                                </label>
                              ))}
                          </div>
                        </details>
                      </fieldset>
                    )
                  )}
                  <fieldset disabled={busy || uploadBusy}>
                    <legend className="sr-only">Thời gian và giới hạn</legend>
                    <label>
                      Cộng thời gian làm bài vào chương
                      <select
                        name="progressChapterId"
                        value={progressChapterId}
                        disabled={!data.examProgressCredit}
                        onChange={(e) => setProgressChapterId(e.target.value)}
                      >
                        <option value="">Không cộng</option>
                        {classroom.chapters.map((ch) => (
                          <option key={ch.id} value={ch.id}>
                            {ch.title}
                          </option>
                        ))}
                      </select>
                      <small>
                        Chỉ cộng thời gian thực tế khi nộp bài hợp lệ, tối đa
                        đến hạn thi. Không tính thời gian chuẩn bị hoặc lượt bị
                        đóng do vi phạm.
                      </small>
                    </label>
                    <div className="learning-options">
                      <label>
                        <input
                          type="checkbox"
                          name="scheduleEnabled"
                          checked={scheduleEnabled}
                          disabled={!data.examScheduling}
                          onChange={(e) => setScheduleEnabled(e.target.checked)}
                        />
                        Hẹn giờ bắt đầu
                      </label>
                    </div>
                    {!data.examScheduling && (
                      <p className="muted">
                        Hẹn giờ bắt đầu đang chờ cập nhật backend Railway.
                      </p>
                    )}
                    {scheduleEnabled && (
                      <label>
                        Ngày và giờ bắt đầu (giờ Việt Nam)
                        <input
                          type="datetime-local"
                          name="scheduledStartAt"
                          autoComplete="off"
                          required
                          step={60}
                          min={vietnamInput(data.serverNow ?? Date.now())}
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                        />
                        <small>
                          Bắt đầu làm bài đúng giờ đã chọn (UTC+7). Thông báo
                          xuất hiện trước giờ này theo số phút chuẩn bị.
                        </small>
                      </label>
                    )}
                    <div className="learning-settings">
                      <label>
                        Thời gian chuẩn bị (phút)
                        <input
                          type="number"
                          min={0}
                          max={60}
                          required
                          value={preparationMinutes}
                          onChange={(e) =>
                            setPreparationMinutes(Number(e.target.value))
                          }
                        />
                      </label>
                      <label>
                        Thời gian làm bài (phút)
                        <input
                          type="number"
                          min={1}
                          max={180}
                          required
                          value={durationMinutes}
                          onChange={(e) =>
                            setDurationMinutes(Number(e.target.value))
                          }
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
                      <p className="online-exam-timing-note">
                        {scheduleEnabled
                          ? "Bài tự mở đúng ngày giờ đã hẹn. Thông báo trước giờ mở theo số phút chuẩn bị. Cả lớp cùng hạn nộp, vào muộn không được cộng thêm giờ."
                          : "Bấm Bắt đầu kiểm tra để thông báo cho lớp. Hết thời gian chuẩn bị mới mở đề; thời gian làm bài bắt đầu từ lúc mở đề. Cả lớp cùng hạn nộp, vào muộn không được cộng thêm giờ."}
                      </p>
                    </div>
                  </fieldset>
                  <button
                    className="button primary"
                    disabled={
                      busy ||
                      uploadBusy ||
                      !data.examCreation ||
                      !data.onlineExams ||
                      !selectedChapters.length ||
                      (examSource === "upload"
                        ? !uploaded.length
                        : !examSource || !bankKeys.length)
                    }
                  >
                    {busy
                      ? "Đang lưu…"
                      : editingExamId
                        ? "Lưu thay đổi"
                        : "Lưu bài kiểm tra"}
                  </button>
                </form>
              </section>
            </Modal>
          )}
          {!teacher && !onlinePage && (
            <section aria-labelledby="learning-eligibility">
              <h2 id="learning-eligibility">
                <Ticket size={21} className="reward-ticket-icon" /> Cấp độ & vé
                Săn thưởng
              </h2>
              <p>
                Cần đủ cấp độ và vé để tham gia. Thời gian làm bài hiển thị ở
                từng đề, không tính vào thời gian nuôi cây.
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
                      <span
                        className={`pill learning-exam-access ${ch.examAllowed ? "open" : "waiting"}`}
                      >
                        {ch.examAllowed
                          ? "Giáo viên đã mở săn thưởng"
                          : "Chờ giáo viên mở săn thưởng"}
                      </span>
                      {ch.hunt && (
                        <p className="muted">
                          {ch.hunt.title} · {ch.hunt.durationMinutes} phút ·{" "}
                          {data.huntPaperSlots
                            ? `Đề ${ch.hunt.nextSlot ?? 1} cho vé tiếp theo · `
                            : ""}
                          {new Intl.DateTimeFormat("vi-VN", {
                            dateStyle: "short",
                            timeStyle: "short",
                          }).format(ch.hunt.startsAt)}{" "}
                          {ch.hunt.closesAt == null
                            ? "· Mở đến khi giáo viên khóa; thời gian tính riêng mỗi lượt."
                            : `– ${new Intl.DateTimeFormat("vi-VN", {
                                timeStyle: "short",
                              }).format(ch.hunt.closesAt)}`}
                        </p>
                      )}
                      {ch.eligible && ch.examAllowed ? (
                        <p className="learning-ready">
                          Đã đủ điều kiện Săn điểm.
                        </p>
                      ) : missing.length > 0 ? (
                        <ul className="learning-requirements">
                          {missing.map((reason) => (
                            <li key={reason}>
                              {reason}
                              {ch.openCorrections > 0 &&
                                reason.includes("câu cần sửa") && (
                                  <button
                                    type="button"
                                    className="button outline small learning-notebook-shortcut"
                                    aria-label={`Mở sổ tay · ${ch.title}`}
                                    onClick={() => onCorrections(ch.id)}
                                  >
                                    <Notebook size={16} /> Mở sổ tay
                                  </button>
                                )}
                            </li>
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
                        <Trophy size={17} /> Săn thưởng
                      </button>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
          {onlinePage && (
            <OnlineExamGroups
              data={data}
              teacher={teacher}
              busy={busy}
              onStart={(ex) =>
                void act(
                  () => api(`/learning/exams/${ex.id}/open`, {}),
                  `Đã gửi thông báo cho lớp. Kiểm tra sẽ mở sau ${ex.preparationMinutes} phút, thời gian làm bài ${ex.durationMinutes} phút.`,
                )
              }
              onClose={(ex) =>
                void act(
                  () =>
                    api(`/learning/exams/${ex.id}/state`, { enabled: false }),
                  data.onlineExamGroups
                    ? "Buổi kiểm tra đã kết thúc. Có thể tải kết quả."
                    : "Buổi kiểm tra đã kết thúc.",
                )
              }
              onDelete={askDelete}
              onEdit={(ex) => void editExam(ex.id)}
              onJoin={(ex) => void act(() => startRun({ examId: ex.id }))}
              onOpen={openRun}
            />
          )}
          {onlinePage && exams.length > 0 && (
            <>
              <section
                className="card learning-section"
                aria-labelledby="learning-exams"
              >
                <h2 id="learning-exams">
                  <Clock3 size={21} /> Lịch kiểm tra đã lưu
                </h2>
                <p>
                  Đáp án và câu sai được công bố sau khi khung thi đóng. Khi
                  đang thi, luyện tập và sửa sai tạm khóa.
                </p>
                {!exams.length ? (
                  <p className="muted">
                    {onlinePage
                      ? "Chưa có buổi kiểm tra online cho lớp này."
                      : "Giáo viên chưa tạo lịch kiểm tra."}
                  </p>
                ) : (
                  <div className="learning-list">
                    {exams.map((ex) => (
                      <div className="learning-row" key={ex.id}>
                        <div>
                          <strong>{ex.title}</strong>
                          <ExamMetadata exam={ex} />
                          <small>
                            {ex.delivery === "online" &&
                            ex.startedAt == null ? (
                              "Chờ giáo viên bắt đầu"
                            ) : (
                              <>
                                {date(ex.startsAt)} → {date(ex.closesAt)} ·{" "}
                                {!ex.enabled
                                  ? "Đã đóng"
                                  : Date.now() < ex.startsAt
                                    ? ex.delivery === "online"
                                      ? "Đang chờ bắt đầu"
                                      : "Chưa mở"
                                    : Date.now() >= ex.closesAt
                                      ? "Đã hết giờ"
                                      : "Đang mở"}
                              </>
                            )}
                          </small>
                          {!!ex.blockedChapters?.length && (
                            <p>
                              Chờ giáo viên mở săn thưởng:{" "}
                              {ex.blockedChapters
                                .map((ch) => ch.title)
                                .join(" · ")}
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
                                (ex.delivery === "online"
                                  ? ex.startedAt != null || !data.onlineExams
                                  : ex.closesAt <= Date.now()) ||
                                !data.examCreation
                              }
                              onClick={() =>
                                void act(
                                  () =>
                                    api(`/learning/exams/${ex.id}/open`, {}),
                                  ex.delivery === "online"
                                    ? `Đã gửi thông báo cho lớp. Kiểm tra sẽ mở sau ${ex.preparationMinutes} phút, thời gian làm bài ${ex.durationMinutes} phút.`
                                    : "Đã mở kiểm tra và cho phép các chương trong đề. Học sinh có thể vào làm ngay.",
                                )
                              }
                            >
                              {ex.delivery === "online"
                                ? ex.startedAt == null
                                  ? "Bắt đầu kiểm tra"
                                  : "Đã gửi thông báo"
                                : "Mở kiểm tra ngay"}
                            </button>
                            <button
                              className={`button ${ex.enabled ? "danger" : "primary"} small`}
                              disabled={
                                busy ||
                                ex.closesAt <= Date.now() ||
                                (ex.delivery === "online" && !ex.enabled)
                              }
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
                              {ex.enabled
                                ? "Đóng bài thi"
                                : ex.delivery === "online"
                                  ? "Đã đóng"
                                  : "Mở lại"}
                            </button>
                            <button
                              type="button"
                              className="button danger small"
                              disabled={
                                busy ||
                                !data.examDeletion ||
                                (ex.enabled &&
                                  ex.closesAt > (data.serverNow ?? Date.now()))
                              }
                              onClick={() => askDelete(ex)}
                            >
                              Xóa bài kiểm tra
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
            </>
          )}
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
            {onlinePage &&
              data.runs.some((run) => run.delivery === undefined) && (
                <p className="muted">
                  Lịch sử kiểm tra online đang chờ máy chủ cập nhật để phân loại
                  các lượt thi.
                </p>
              )}
            {!runs.length ? (
              <p className="muted">Chưa có lượt thi.</p>
            ) : (
              <div className="learning-list">
                {runs.map((r) => (
                  <div className="learning-row" key={r.id}>
                    <div>
                      <strong>{r.title}</strong>
                      <p>
                        {teacher ? `${r.studentName} · ` : ""}
                        {r.status === "active"
                          ? `Đang làm · Hạn ${date(r.deadlineAt)}`
                          : `Đã nộp · ${r.score == null ? "Chờ công bố điểm" : `${r.score.toFixed(1)} / 10`}`}{" "}
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
          {!onlinePage && (
            <section className="card learning-section">
              <h2>Điểm thưởng hệ thống</h2>
              <p>
                Mỗi chương đạt Kết Trái (cấp 5) nhận 1 điểm; mỗi lượt Săn điểm
                đạt từ 8,0 nhận 1 điểm. Giáo viên duyệt việc ghi nhận.
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
          )}
        </>
      )}
    </div>
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
  const [tabWarning, setTabWarning] = useState("");
  const [idleWarning, setIdleWarning] = useState<number | null>(null);
  const lastActivity = useRef(Date.now());
  const activityDirty = useRef(false),
    idleLocked = useRef(false);
  const [warningPopup, setWarningPopup] = useState(false);
  const storageKey = "greenedu-exam:" + user.id + ":" + id;
  const [initial] = useState<{
    answers: Record<string, QuestionAnswer>;
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
  const dirty = useRef<Record<string, QuestionAnswer>>(initial.answers);
  const tabs = useRef<string[]>(initial.tabs);
  const current = useRef<ExamRun | null>(null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const mounted = useRef(true);
  const anchor = useRef({ server: 0, elapsed: performance.now() });
  const [run, setRun] = useState<ExamRun | null>(null);
  const [answers, setAnswers] = useState<Record<string, QuestionAnswer>>({});
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
    while (tabs.current.length && current.current!.status === "active") {
      const eventId = tabs.current[0];
      const r = await api<ExamRun>(`/learning/exam-runs/${id}/tab`, {
        eventId,
      });
      if (tabs.current[0] === eventId) tabs.current.shift();
      accept(r);
      persist();
    }
    if (current.current!.status !== "active") return;
    if (
      activityDirty.current &&
      !idleLocked.current &&
      current.current!.policy
    ) {
      accept(await api<ExamRun>(`/learning/exam-runs/${id}/activity`, {}));
      activityDirty.current = false;
    }
    if (current.current!.status !== "active") return;
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
    let away = false,
      idleExited = false;
    lastActivity.current = Date.now();
    const interaction = (event: Event) => {
      if (event.isTrusted && !document.hidden && document.hasFocus()) {
        lastActivity.current = Date.now();
        activityDirty.current = true;
        setIdleWarning(null);
      }
    };
    const timer = setInterval(() => {
      setNow(
        anchor.current.server + performance.now() - anchor.current.elapsed,
      );
      if (teacher || current.current?.status !== "active") return;
      const idle = (Date.now() - lastActivity.current) / 1000;
      const policy = current.current.policy ?? DEFAULT_SESSION_POLICY;
      if (idle >= policy.closeIdleSeconds && !idleExited) {
        idleExited = true;
        idleLocked.current = true;
        setIdleWarning(0);
        setWarningPopup(true);
        void enqueue(async () => {
          await sync();
          accept(
            current.current?.policy
              ? await api<ExamRun>(`/learning/exam-runs/${id}`)
              : await api<ExamRun>(`/learning/exam-runs/${id}/submit`, {}),
          );
        });
      } else if (idle >= policy.warningIdleSeconds && !idleExited) {
        setIdleWarning(Math.ceil(policy.closeIdleSeconds - idle));
        setWarningPopup(true);
      }
    }, 1000);
    const visibility = () => {
      const left = document.hidden || !document.hasFocus();
      if (!teacher && left && !away && current.current?.status === "active") {
        away = true;
        tabs.current.push(crypto.randomUUID());
        const warnings = current.current.warnings + tabs.current.length;
        if (
          warnings >=
          (current.current.policy ?? DEFAULT_SESSION_POLICY).warningTabs
        ) {
          setWarningPopup(true);
          setTabWarning(
            warnings >= current.current.tabLimit
              ? "Bài đã khóa do đạt giới hạn rời tab. Đáp án đã lưu sẽ được nộp khi có mạng."
              : `Bạn đã rời tab ${warnings}/${current.current.tabLimit} lần. Bài sẽ tự nộp khi đạt giới hạn.`,
          );
        }
        persist();
        void enqueue(sync);
      } else if (!left) {
        away = false;
        void refresh();
      }
    };
    ["pointerdown", "keydown", "wheel", "touchmove"].forEach((name) =>
      window.addEventListener(name, interaction, {
        passive: true,
        capture: true,
      }),
    );
    window.addEventListener("blur", visibility);
    window.addEventListener("focus", visibility);
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
      window.removeEventListener("blur", visibility);
      window.removeEventListener("focus", visibility);
      ["pointerdown", "keydown", "wheel", "touchmove"].forEach((name) =>
        window.removeEventListener(name, interaction, true),
      );
      window.removeEventListener("online", online);
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [id]);
  function choose(questionId: string, value: QuestionAnswer) {
    if (
      idleLocked.current ||
      !current.current ||
      current.current.status !== "active" ||
      current.current.warnings + tabs.current.length >=
        current.current.tabLimit ||
      document.hidden ||
      !document.hasFocus()
    )
      return;
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
  const tabLocked =
    active &&
    (idleLocked.current || run.warnings + tabs.current.length >= run.tabLimit);
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
  const questionResult = run.results?.find(
    (result) => result.questionId === q.id,
  );
  return (
    <div className="exam-room">
      {warningPopup && (
        <Modal
          title="Nhắc nhở bài kiểm tra"
          onClose={() => setWarningPopup(false)}
        >
          <p>
            {idleLocked.current
              ? "Đã đạt ngưỡng không tương tác. Bài thi bị khóa và tự nộp với đáp án đã lưu khi có kết nối."
              : idleWarning !== null
                ? `Không có tương tác. Bài sẽ tự nộp sau ${idleWarning} giây.`
                : tabWarning}
          </p>
          <button
            className="button primary"
            onClick={() => {
              setWarningPopup(false);
              if (!idleLocked.current) {
                lastActivity.current = Date.now();
                activityDirty.current = true;
                setIdleWarning(null);
              }
            }}
          >
            {idleLocked.current ? "Đã hiểu" : "Tiếp tục làm bài"}
          </button>
        </Modal>
      )}
      {tabWarning && (
        <p className="error-banner" role="alert">
          {tabWarning}
        </p>
      )}
      {idleWarning !== null && (
        <p className="idle-banner" role="alert">
          Rời bài sau {idleWarning} giây nếu không tương tác.
        </p>
      )}
      <WorkspaceHeading className="learning-heading">
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
      </WorkspaceHeading>
      {error && (
        <div className="error-banner" role="alert">
          {error}
          <button onClick={() => void enqueue(sync)}>Thử lưu lại</button>
        </div>
      )}
      <div className="info-panel">
        <p>
          {active
            ? `${run.questions.filter((question) => answerComplete(question, answers[question.id])).length}/${run.questions.length} câu đã chọn · ${pending ? `${pending} thay đổi chưa đồng bộ` : "Đáp án đã lưu"}. Rời tab ${run.warnings}/${run.tabLimit}; đến lần ${run.tabLimit} bài sẽ tự nộp.`
            : `${run.score == null ? "Chờ công bố điểm" : `Điểm ${run.score.toFixed(1)} / 10`} · ${run.reason === "tabs" ? "Tự nộp do rời tab" : run.reason === "deadline" ? "Tự nộp khi hết giờ" : run.reason === "teacher" ? "Giáo viên đã đóng bài thi" : run.reason === "idle" ? "Tự nộp do không tương tác" : "Đã hoàn thành"}.`}
        </p>
      </div>
      {!active && !run.results && (
        <p className="learning-notice">
          {run.practiceAfterSubmission &&
            "Bạn có thể quay lại luyện tập và được tính thời gian học. "}
          Chờ khung thi đóng để xem điểm, đáp án và cập nhật sổ tay sửa sai.
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
                className={`${index === i ? "current" : ""} ${answerComplete(question, answers[question.id]) ? "answered" : ""}`}
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
          <h2>
            <QuestionText>{q.text}</QuestionText>
          </h2>
          <AnswerFields
            question={q}
            value={answers[q.id]}
            result={questionResult}
            disabled={
              !active || teacher || submitting || seconds === 0 || tabLocked
            }
            onChange={(value) => choose(q.id, value)}
          />
          {run.results && (
            <div className="explanation" role="status">
              <strong>{questionResult?.correct ? "Đúng" : "Cần ôn lại"}</strong>
              <p>
                <QuestionText>{questionResult?.explanation}</QuestionText>
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
                    `Nộp bài với ${run.questions.filter((question) => answerComplete(question, answers[question.id])).length}/${run.questions.length} câu đã chọn?`,
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
