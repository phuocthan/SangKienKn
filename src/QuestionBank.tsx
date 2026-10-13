import { answerLabel, questionKind } from "../shared/question-types";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  History,
  Pencil,
  Upload,
  Trash2,
} from "lucide-react";
import { api, ensureQuestionTypes, errorMessage } from "./api";
import { Empty, Modal } from "./components";
import { QuestionFields, readQuestionForm } from "./QuestionFields";
import {
  csvTemplate,
  parseQuestionCsv,
  type QuestionInput,
} from "../shared/questions";
import type { Question } from "./types";
import { matchingLessonTitle } from "../shared/lesson-titles";
import "./question-bank.css";

type ImportFormat = "csv" | "word";

type Dialog =
  | { type: "edit" | "visibility" | "history"; question: Question }
  | { type: "import"; format: ImportFormat }
  | { type: "deleteQuestions"; questions: Question[] }
  | { type: "deleteLesson"; lesson: string; count: number }
  | null;

export function QuestionBank({
  chapterId,
  topicSupported,
  deleteSupported,
  lessonSupported,
  lesson,
  lessonTitles,
  revision,
  onChange,
}: {
  chapterId: string;
  topicSupported: boolean;
  deleteSupported: boolean;
  lessonSupported: boolean;
  lesson: string;
  lessonTitles: string[];
  revision: number;
  onChange: () => void;
}) {
  const [rows, setRows] = useState<Question[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [retry, setRetry] = useState(0),
    [showHidden, setShowHidden] = useState(false),
    [dialog, setDialog] = useState<Dialog>(null);
  const [busy, setBusy] = useState(false),
    [mutationError, setMutationError] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState("");
  const selectable = rows.filter((q) => q.active && q.isCurrent !== false);
  const selectedQuestions = selectable.filter((q) => selected.has(q.id));
  const allSelected =
    selectable.length > 0 &&
    selectedQuestions.length === Math.min(5000, selectable.length);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    setRows([]);
    setSelected(new Set());
    const query = new URLSearchParams();
    if (lesson) query.set("lesson", lesson);
    if (showHidden) query.set("showHidden", "1");
    api<Question[]>(
      `/chapters/${chapterId}/questions${query.size ? `?${query}` : ""}`,
    )
      .then((rows) => {
        if (alive) setRows(rows);
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
  }, [chapterId, lesson, revision, retry, showHidden]);
  function open(next: Dialog) {
    setMutationError("");
    setDialog(next);
  }
  function saved() {
    setSelected(new Set());
    setDialog(null);
    setRetry((n) => n + 1);
    onChange();
  }
  async function visibility() {
    if (!dialog || dialog.type !== "visibility" || busy) return;
    setBusy(true);
    setMutationError("");
    try {
      await api(`/questions/${dialog.question.id}/visibility`, {
        active: !dialog.question.active,
      });
      saved();
    } catch (e) {
      setMutationError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!dialog || busy) return;
    setBusy(true);
    setMutationError("");
    try {
      if (dialog.type === "deleteQuestions" && deleteSupported) {
        const result = await api<{ hiddenQuestions: number }>(
          `/chapters/${chapterId}/questions/delete`,
          {
            questionIds: dialog.questions.map((q) => q.id),
          },
        );
        setNotice(`Đã xóa ${result.hiddenQuestions} câu khỏi lượt học mới.`);
      } else if (dialog.type === "deleteLesson" && lessonSupported) {
        await api(`/chapters/${chapterId}/lessons/delete`, {
          title: dialog.lesson,
        });
        setNotice(
          `Đã xóa bài “${dialog.lesson}”. Lịch sử học tập vẫn được giữ.`,
        );
      } else return;
      saved();
    } catch (e) {
      setMutationError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="question-toolbar">
        <label>
          <input
            type="checkbox"
            checked={showHidden}
            onChange={(e) => setShowHidden(e.target.checked)}
          />
          Hiện cả câu đã ẩn
        </label>
        <div className="import-format-actions">
          <button
            className="button outline small"
            onClick={() => open({ type: "import", format: "csv" })}
          >
            <Upload size={16} />
            Nhập file CSV
          </button>
          <button
            className="button outline small"
            onClick={() => open({ type: "import", format: "word" })}
          >
            <Upload size={16} />
            Nhập file Word
          </button>
        </div>
      </div>
      <div
        className="card bank-management"
        aria-label="Quản lý câu hỏi hàng loạt"
      >
        <div className="bank-selection-tools">
          <label>
            <input
              type="checkbox"
              checked={allSelected}
              ref={(node) => {
                if (node)
                  node.indeterminate =
                    selectedQuestions.length > 0 && !allSelected;
              }}
              disabled={
                !deleteSupported || loading || busy || !selectable.length
              }
              onChange={(e) =>
                setSelected(
                  e.target.checked
                    ? new Set(selectable.slice(0, 5000).map((q) => q.id))
                    : new Set(),
                )
              }
            />
            Chọn tất cả{lesson ? " trong bài" : " đang hiển thị"}
          </label>
          <span role="status">Đã chọn {selectedQuestions.length} câu</span>
          {selectedQuestions.length > 0 && (
            <button
              className="text-button"
              onClick={() => setSelected(new Set())}
            >
              Bỏ chọn
            </button>
          )}
        </div>
        <div className="bank-management-actions">
          <button
            className="button outline small bank-delete-button"
            disabled={
              !deleteSupported || busy || loading || !selectedQuestions.length
            }
            onClick={() =>
              open({ type: "deleteQuestions", questions: selectedQuestions })
            }
          >
            <Trash2 size={16} /> Xóa các câu đã chọn
          </button>
          <button
            className="button outline small bank-delete-button"
            disabled={
              !lessonSupported ||
              !lesson ||
              busy ||
              loading ||
              !!error ||
              !lessonTitles.includes(lesson)
            }
            onClick={() =>
              open({ type: "deleteLesson", lesson, count: selectable.length })
            }
          >
            <Trash2 size={16} /> Xóa cả bài
          </button>
        </div>
        {!lesson && (
          <p className="subtle-note">
            Chọn một bài trong bộ lọc để xóa cả bài.
          </p>
        )}
        {!deleteSupported && (
          <p className="subtle-note">
            Xóa nhiều câu đang chờ cập nhật server Railway.
          </p>
        )}
        {rows.filter((q) => q.active).length > 5000 && (
          <p className="subtle-note">Mỗi lần chọn tối đa 5000 câu.</p>
        )}
      </div>
      {notice && (
        <p className="bank-notice" role="status">
          {notice}
        </p>
      )}
      {error ? (
        <div className="error-banner" role="alert">
          {error}
          <button onClick={() => setRetry((n) => n + 1)}>Thử lại</button>
        </div>
      ) : loading ? (
        <div className="loading-panel">Đang tải câu hỏi…</div>
      ) : !rows.length ? (
        <Empty
          title="Chưa có câu hỏi trong bộ lọc này"
          text="Thêm câu hỏi hoặc nhập file Word/CSV theo mẫu. Bật Hiện cả câu đã ẩn để xem các câu đã ngừng dùng."
        />
      ) : (
        <div className="bank-list">
          {rows.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              selection={
                q.active && q.isCurrent !== false
                  ? {
                      checked: selected.has(q.id),
                      disabled:
                        !deleteSupported ||
                        busy ||
                        (!selected.has(q.id) && selected.size >= 5000),
                      onChange: (checked: boolean) =>
                        setSelected((previous) => {
                          const next = new Set(previous);
                          if (checked) next.add(q.id);
                          else next.delete(q.id);
                          return next;
                        }),
                    }
                  : undefined
              }
            >
              <div className="question-actions">
                <button
                  className="button outline small"
                  onClick={() => open({ type: "edit", question: q })}
                >
                  <Pencil size={15} />
                  Sửa câu hỏi
                </button>
                <button
                  className="button outline small"
                  onClick={() => open({ type: "visibility", question: q })}
                >
                  {q.active ? <EyeOff size={15} /> : <Eye size={15} />}
                  {q.active ? "Ẩn câu hỏi" : "Hiện lại"}
                </button>
                <button
                  className="button outline small"
                  onClick={() => open({ type: "history", question: q })}
                >
                  <History size={15} />
                  Lịch sử sửa
                </button>
              </div>
            </QuestionCard>
          ))}
        </div>
      )}
      {dialog && (
        <Modal
          title={
            dialog.type === "edit"
              ? "Sửa câu hỏi"
              : dialog.type === "import"
                ? "Nhập bộ câu hỏi"
                : dialog.type === "history"
                  ? "Lịch sử câu hỏi"
                  : dialog.type === "deleteQuestions"
                    ? `Xóa ${dialog.questions.length} câu hỏi`
                    : dialog.type === "deleteLesson"
                      ? "Xóa cả bài học"
                      : dialog.question.active
                        ? "Ẩn câu hỏi"
                        : "Hiện lại câu hỏi"
          }
          onClose={() => {
            if (!busy) setDialog(null);
          }}
        >
          {dialog.type === "edit" && (
            <EditForm
              question={dialog.question}
              onSaved={saved}
              topicSupported={topicSupported}
            />
          )}
          {dialog.type === "import" && (
            <ImportForm
              chapterId={chapterId}
              initialFormat={dialog.format}
              topicSupported={topicSupported}
              onSaved={saved}
              initialLesson={lesson}
              lessonTitles={lessonTitles}
            />
          )}
          {dialog.type === "history" && (
            <QuestionHistory id={dialog.question.id} />
          )}
          {dialog.type === "visibility" && (
            <>
              <p>
                {dialog.question.active
                  ? "Câu này sẽ ngừng xuất hiện trong lượt luyện tập mới. Lịch sử làm bài và sổ tay sửa sai vẫn được giữ."
                  : "Câu này sẽ được dùng lại trong lượt luyện tập mới."}
              </p>
              <h3>{dialog.question.text}</h3>
              {mutationError && (
                <div className="error-banner" role="alert">
                  {mutationError}
                </div>
              )}
              <button
                className="button primary"
                disabled={busy}
                onClick={() => void visibility()}
              >
                {busy ? "Đang lưu…" : "Xác nhận"}
              </button>
            </>
          )}
          {(dialog.type === "deleteQuestions" ||
            dialog.type === "deleteLesson") && (
            <>
              {dialog.type === "deleteLesson" ? (
                <>
                  <h3>{dialog.lesson}</h3>
                  <p>
                    Xóa bài này khỏi danh mục và ngừng dùng toàn bộ{" "}
                    {dialog.count} câu hỏi đang sử dụng trong bài.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Ngừng dùng {dialog.questions.length} câu đã chọn trong các
                    lượt học mới.
                  </p>
                  <ul className="bank-delete-preview">
                    {dialog.questions.map((q) => (
                      <li key={q.id}>{q.text}</li>
                    ))}
                  </ul>
                </>
              )}
              <p>
                Lịch sử làm bài, sổ tay sửa sai và đề kiểm tra đã lưu vẫn được
                giữ. Câu đã xóa có thể xem lại bằng “Hiện cả câu đã ẩn”.
              </p>
              {dialog.type === "deleteLesson" && (
                <p>
                  Muốn sử dụng lại, hãy thêm lại bài rồi hiện lại những câu cần
                  dùng.
                </p>
              )}
              {mutationError && (
                <div className="error-banner" role="alert">
                  {mutationError}
                </div>
              )}
              <div className="button-group">
                <button
                  className="button outline"
                  disabled={busy}
                  onClick={() => setDialog(null)}
                >
                  Hủy
                </button>
                <button
                  className="button primary bank-delete-confirm"
                  disabled={busy}
                  onClick={() => void remove()}
                >
                  {busy
                    ? "Đang xóa…"
                    : dialog.type === "deleteLesson"
                      ? "Xác nhận xóa bài"
                      : `Xác nhận xóa ${dialog.questions.length} câu`}
                </button>
              </div>
            </>
          )}
        </Modal>
      )}
    </>
  );
}

function QuestionCard({
  question: q,
  children,
  selection,
}: {
  question: Question;
  children?: import("react").ReactNode;
  selection?: {
    checked: boolean;
    disabled: boolean;
    onChange: (checked: boolean) => void;
  };
}) {
  return (
    <article
      className={`card bank-question ${selection?.checked ? "bank-question-selected" : ""}`}
      data-question-id={q.id}
    >
      <div className="question-meta">
        {selection && (
          <label className="bank-question-select">
            <input
              type="checkbox"
              checked={selection.checked}
              disabled={selection.disabled}
              aria-label={`Chọn câu hỏi: ${q.text}`}
              onChange={(e) => selection.onChange(e.target.checked)}
            />
            Chọn câu
          </label>
        )}
        <span className="eyebrow">
          {q.lesson} · Phiên bản {q.version ?? 1}
        </span>
        <span className="pill">
          {q.isCurrent === false
            ? "Phiên bản cũ"
            : q.active === false
              ? "Đã ẩn"
              : "Đang sử dụng"}
        </span>
      </div>
      <h3>{q.text}</h3>
      {q.topic && <p className="subtle-note">Chủ đề: {q.topic}</p>}
      <div className="bank-choices">
        {q.choices.map((choice, index) => (
          <div
            key={index}
            className={index === q.correctIndex ? "answer-key" : ""}
          >
            <span>{"ABCD"[index]}</span>
            {choice}
            {questionKind(q) === "true-false" && (
              <strong>
                {q.correctAnswer?.[index] === "1" ? "Đúng" : "Sai"}
              </strong>
            )}
            {index === q.correctIndex && <CheckCircle2 size={16} />}
          </div>
        ))}
      </div>
      {questionKind(q) === "short-answer" && (
        <p>
          Đáp án: <strong>{answerLabel(q)}</strong>
        </p>
      )}
      <div className="bank-explanation">
        <strong>Lời giải</strong>
        <p>{q.explanation}</p>
      </div>
      {children}
    </article>
  );
}

function EditForm({
  question,
  onSaved,
  topicSupported,
}: {
  question: Question;
  topicSupported: boolean;
  onSaved: () => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    setBusy(true);
    setError("");
    try {
      const content = readQuestionForm(form);
      await ensureQuestionTypes([content]);
      await api(`/questions/${question.id}/edit`, {
        ...content,
        topic: new FormData(form).get("topic") ?? question.topic ?? "",
      });
      onSaved();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={(e) => void submit(e)}>
      <p>
        Nội dung thay đổi sẽ tạo phiên bản mới. Những lượt làm bài và câu cần
        sửa trước đây giữ nguyên nội dung cũ.
      </p>
      <QuestionFields question={question} topicSupported={topicSupported} />
      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}
      <button className="button primary" disabled={busy}>
        {busy ? "Đang lưu…" : "Lưu phiên bản mới"}
      </button>
    </form>
  );
}

function QuestionHistory({ id }: { id: string }) {
  const [rows, setRows] = useState<Question[]>([]),
    [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    api<Question[]>(`/questions/${id}/history`)
      .then((rows) => {
        if (alive) setRows(rows);
      })
      .catch((e) => {
        if (alive) setError(errorMessage(e));
      });
    return () => {
      alive = false;
    };
  }, [id]);
  if (error)
    return (
      <div className="error-banner" role="alert">
        {error}
      </div>
    );
  if (!rows.length)
    return <div className="loading-panel">Đang tải lịch sử…</div>;
  return (
    <div className="bank-list">
      {rows.map((q) => (
        <QuestionCard key={q.id} question={q} />
      ))}
    </div>
  );
}

function ImportForm({
  chapterId,
  initialFormat,
  onSaved,
  topicSupported,
  initialLesson,
  lessonTitles,
}: {
  chapterId: string;
  initialFormat: ImportFormat;
  topicSupported: boolean;
  initialLesson: string;
  lessonTitles: string[];
  onSaved: () => void;
}) {
  const [format, setFormat] = useState<ImportFormat>(initialFormat);
  const [targetLesson, setTargetLesson] = useState(initialLesson);
  const [questions, setQuestions] = useState<QuestionInput[]>([]),
    [errors, setErrors] = useState<string[]>([]);
  const [saveError, setSaveError] = useState("");
  const [busy, setBusy] = useState(false),
    [reading, setReading] = useState(false),
    [filename, setFilename] = useState("");
  const requestId = useRef(crypto.randomUUID()),
    sequence = useRef(0);
  const unsupportedTopics = !topicSupported && questions.some((q) => q.topic);
  let mappedQuestions = questions,
    lessonError = "";
  try {
    mappedQuestions = questions.map((q) => ({
      ...q,
      lesson: targetLesson || matchingLessonTitle(q.lesson, lessonTitles),
    }));
  } catch (error) {
    lessonError = errorMessage(error);
  }
  const newLessonTitles = [
    ...new Set(mappedQuestions.map((q) => q.lesson)),
  ].filter((title) => !lessonTitles.includes(title));
  async function read(file?: File) {
    const current = ++sequence.current;
    setQuestions([]);
    setErrors([]);
    setSaveError("");
    setFilename(file?.name ?? "");
    requestId.current = crypto.randomUUID();
    if (!file) {
      setReading(false);
      return;
    }
    if (format === "word" && /\.doc$/i.test(file.name)) {
      setErrors([
        "File .doc cũ chưa được hỗ trợ. Mở bằng Word và chọn Save As → Word Document (.docx).",
      ]);
      setReading(false);
      return;
    }
    if (!(format === "word" ? /\.docx$/i : /\.csv$/i).test(file.name)) {
      setErrors([
        format === "word"
          ? "Chọn file Word .docx theo mẫu."
          : "Chọn file CSV UTF-8 theo mẫu.",
      ]);
      setReading(false);
      return;
    }
    if (file.size > (format === "word" ? 5 * 1024 * 1024 : 512 * 1024)) {
      setErrors([
        format === "word"
          ? "File Word quá lớn. Mỗi file tối đa 5 MB và 100 câu hỏi."
          : "File quá lớn. Mỗi file tối đa 512 KB và 100 câu hỏi.",
      ]);
      setReading(false);
      return;
    }
    setReading(true);
    try {
      const data = await file.arrayBuffer();
      const parsed =
        format === "word"
          ? (await import("./importWord")).parseWordFile(new Uint8Array(data))
          : parseQuestionCsv(
              new TextDecoder("utf-8", { fatal: true }).decode(data),
            );
      if (current === sequence.current) {
        setQuestions(parsed.questions);
        setErrors(parsed.errors);
      }
    } catch (e) {
      if (current === sequence.current)
        setErrors([
          format === "word"
            ? errorMessage(e)
            : "Không đọc được file. Hãy lưu file ở định dạng CSV UTF-8.",
        ]);
    } finally {
      if (current === sequence.current) setReading(false);
    }
  }
  function template() {
    const url = URL.createObjectURL(
      new Blob([csvTemplate], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "greenedu-cau-hoi-mau.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function save() {
    if (
      busy ||
      reading ||
      errors.length ||
      !questions.length ||
      unsupportedTopics ||
      lessonError
    )
      return;
    setBusy(true);
    setSaveError("");
    try {
      await ensureQuestionTypes(mappedQuestions);
      await api(`/chapters/${chapterId}/questions/import`, {
        requestId: requestId.current,
        questions: mappedQuestions,
      });
      onSaved();
    } catch (e) {
      setSaveError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="question-import">
      <p>
        Nhập câu hỏi vào chương đang chọn. Tải mẫu, điền nội dung rồi chọn file
        để xem trước. Hỗ trợ trắc nghiệm, đúng/sai và trả lời ngắn. Tối đa 100
        câu.
      </p>
      <label>
        Bài nhận câu hỏi
        <select
          value={targetLesson}
          disabled={busy}
          onChange={(e) => {
            setTargetLesson(e.target.value);
            requestId.current = crypto.randomUUID();
            setSaveError("");
          }}
        >
          <option value="">Theo tên bài trong file</option>
          {lessonTitles.map((title) => (
            <option key={title} value={title}>
              {title}
            </option>
          ))}
        </select>
      </label>
      <p className="subtle-note">
        Chọn bài có sẵn để nhập toàn bộ câu vào bài đó. Chủ đề chỉ là nhãn của
        câu hỏi, không tạo bài học.
      </p>
      {lessonError && (
        <div className="error-banner" role="alert">
          {lessonError}
        </div>
      )}
      <label>
        Định dạng file
        <select
          value={format}
          disabled={busy}
          onChange={(e) => {
            setFormat(e.target.value as ImportFormat);
            void read();
          }}
        >
          <option value="csv">CSV UTF-8 (.csv)</option>
          <option value="word">Word (.docx)</option>
        </select>
      </label>
      {format === "word" ? (
        <>
          <a
            className="button outline small"
            href="/templates/greenedu-cau-hoi-mau.docx"
            download
          >
            <Download size={16} />
            Tải mẫu Word (.docx)
          </a>
          <p className="subtle-note">
            Mỗi câu có nhãn Loại câu hỏi, Bài học, Đáp án và Lời giải như mẫu.
            File tối đa 5 MB.
          </p>
        </>
      ) : (
        <button className="button outline small" onClick={template}>
          <Download size={16} />
          Tải file mẫu
        </button>
      )}
      <label>
        {format === "word" ? "File câu hỏi Word (.docx)" : "File câu hỏi CSV"}
        <input
          key={format}
          type="file"
          accept={
            format === "word"
              ? ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              : ".csv,text/csv"
          }
          disabled={busy}
          onChange={(e) => void read(e.target.files?.[0])}
        />
      </label>
      {reading && <p role="status">Đang đọc file…</p>}
      {errors.length > 0 && (
        <div className="error-banner import-errors" role="alert">
          <strong>Chưa lưu dữ liệu. Hãy sửa các lỗi sau:</strong>
          <ul>
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      {questions.length > 0 && (
        <>
          <h3>Xem trước · {questions.length} câu hợp lệ</h3>
          {!targetLesson && newLessonTitles.length > 0 && (
            <p className="subtle-note">
              Tên bài chưa có trong chương: {newLessonTitles.join("; ")}. Chọn
              bài nhận câu hỏi ở trên nếu muốn gộp vào bài có sẵn.
            </p>
          )}
          <p className="subtle-note">
            {filename} · Các câu chỉ được lưu khi bạn bấm xác nhận.
          </p>
          <div className="import-preview">
            {mappedQuestions.map((q, index) => (
              <details key={index}>
                <summary>
                  {index + 1}. {q.text}
                </summary>
                <p>{q.lesson}</p>
                {q.topic && <p>Chủ đề: {q.topic}</p>}
                <ol type="A">
                  {q.choices.map((choice, i) => (
                    <li key={i}>
                      {choice}
                      {i === q.correctIndex && " ✓"}
                      {questionKind(q) === "true-false" &&
                        (q.correctAnswer?.[i] === "1" ? " · Đúng" : " · Sai")}
                    </li>
                  ))}
                </ol>
                {questionKind(q) === "short-answer" && (
                  <p>Đáp án: {answerLabel(q)}</p>
                )}
                <p>{q.explanation}</p>
              </details>
            ))}
          </div>
        </>
      )}
      {unsupportedTopics && (
        <div className="error-banner" role="alert">
          Máy chủ hiện tại chưa hỗ trợ chủ đề câu hỏi. Cần cập nhật máy chủ
          trước khi nhập bộ câu này để giữ đầy đủ chủ đề.
        </div>
      )}
      {saveError && (
        <div className="error-banner" role="alert">
          {saveError} Bạn có thể thử xác nhận lại.
        </div>
      )}
      <button
        className="button primary"
        disabled={
          busy ||
          reading ||
          !!errors.length ||
          !questions.length ||
          unsupportedTopics ||
          !!lessonError
        }
        onClick={() => void save()}
      >
        {busy ? "Đang nhập…" : `Xác nhận nhập ${questions.length} câu`}
      </button>
    </div>
  );
}
