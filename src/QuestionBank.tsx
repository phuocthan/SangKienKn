import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  History,
  Pencil,
  Upload,
} from "lucide-react";
import { api, errorMessage } from "./api";
import { Empty, Modal } from "./components";
import { QuestionFields, readQuestionForm } from "./QuestionFields";
import {
  csvTemplate,
  parseQuestionCsv,
  type QuestionInput,
} from "../shared/questions";
import type { Question } from "./types";

type ImportFormat = "csv" | "word";

type Dialog =
  | { type: "edit" | "visibility" | "history"; question: Question }
  | { type: "import"; format: ImportFormat }
  | null;

export function QuestionBank({
  chapterId,
  lesson,
  revision,
  onChange,
}: {
  chapterId: string;
  lesson: string;
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
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
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
            <QuestionCard key={q.id} question={q}>
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
                  : dialog.question.active
                    ? "Ẩn câu hỏi"
                    : "Hiện lại câu hỏi"
          }
          onClose={() => setDialog(null)}
        >
          {dialog.type === "edit" && (
            <EditForm question={dialog.question} onSaved={saved} />
          )}
          {dialog.type === "import" && (
            <ImportForm
              chapterId={chapterId}
              initialFormat={dialog.format}
              onSaved={saved}
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
        </Modal>
      )}
    </>
  );
}

function QuestionCard({
  question: q,
  children,
}: {
  question: Question;
  children?: import("react").ReactNode;
}) {
  return (
    <article className="card bank-question">
      <div className="question-meta">
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
      <div className="bank-choices">
        {q.choices.map((choice, index) => (
          <div
            key={index}
            className={index === q.correctIndex ? "answer-key" : ""}
          >
            <span>{"ABCD"[index]}</span>
            {choice}
            {index === q.correctIndex && <CheckCircle2 size={16} />}
          </div>
        ))}
      </div>
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
}: {
  question: Question;
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
      await api(`/questions/${question.id}/edit`, readQuestionForm(form));
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
      <QuestionFields question={question} />
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
}: {
  chapterId: string;
  initialFormat: ImportFormat;
  onSaved: () => void;
}) {
  const [format, setFormat] = useState<ImportFormat>(initialFormat);
  const [questions, setQuestions] = useState<QuestionInput[]>([]),
    [errors, setErrors] = useState<string[]>([]);
  const [saveError, setSaveError] = useState("");
  const [busy, setBusy] = useState(false),
    [reading, setReading] = useState(false),
    [filename, setFilename] = useState("");
  const requestId = useRef(crypto.randomUUID()),
    sequence = useRef(0);
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
    if (busy || reading || errors.length || !questions.length) return;
    setBusy(true);
    setSaveError("");
    try {
      await api(`/chapters/${chapterId}/questions/import`, {
        requestId: requestId.current,
        questions,
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
        để xem trước. Chọn đáp án A, B, C hoặc D. Mỗi file tối đa 100 câu.
      </p>
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
            Mỗi câu bắt đầu bằng “Câu 1: …”, kèm nhãn Bài học, A–D, Đáp án và
            Lời giải như mẫu. File tối đa 5 MB; hỗ trợ câu hỏi văn bản.
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
          <p className="subtle-note">
            {filename} · Các câu chỉ được lưu khi bạn bấm xác nhận.
          </p>
          <div className="import-preview">
            {questions.map((q, index) => (
              <details key={index}>
                <summary>
                  {index + 1}. {q.text}
                </summary>
                <p>{q.lesson}</p>
                <ol type="A">
                  {q.choices.map((choice, i) => (
                    <li key={i}>
                      {choice}
                      {i === q.correctIndex && " ✓"}
                    </li>
                  ))}
                </ol>
                <p>{q.explanation}</p>
              </details>
            ))}
          </div>
        </>
      )}
      {saveError && (
        <div className="error-banner" role="alert">
          {saveError} Bạn có thể thử xác nhận lại.
        </div>
      )}
      <button
        className="button primary"
        disabled={busy || reading || !!errors.length || !questions.length}
        onClick={() => void save()}
      >
        {busy ? "Đang nhập…" : `Xác nhận nhập ${questions.length} câu`}
      </button>
    </div>
  );
}
