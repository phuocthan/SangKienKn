import {
  Component,
  lazy,
  Suspense,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { formulaSegments, unwrapFormula } from "../shared/formula-text";
import { QuestionText } from "./QuestionText";
import { formattedClipboard } from "./formula-clipboard";

const FormulaComposer = lazy(() => import("./FormulaComposer"));

class FormulaBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <p role="alert">
        Chưa mở được bộ soạn công thức. Nội dung đang nhập vẫn được giữ; bạn có
        thể gõ hoặc dán mã công thức vào ô nội dung.
      </p>
    ) : (
      this.props.children
    );
  }
}

export function FormulaWorkbench() {
  const [open, setOpen] = useState(false);
  return (
    <details
      className="formula-workbench"
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary>Soạn và sao chép công thức</summary>
      {open && (
        <FormulaBoundary>
          <Suspense fallback={<p role="status">Đang mở bộ soạn công thức…</p>}>
            <FormulaComposer />
          </Suspense>
        </FormulaBoundary>
      )}
    </details>
  );
}

export function FormulaField({
  name,
  label,
  defaultValue = "",
  required = false,
  maxLength,
  rows,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  required?: boolean;
  maxLength: number;
  rows?: number;
}) {
  const id = useId(),
    panel = useId();
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const [value, setValue] = useState(defaultValue),
    [composer, setComposer] = useState<{
      initial: string;
      start: number;
      end: number;
    } | null>(null);
  const [error, setError] = useState("");
  const formatted = formulaSegments(value).some((p) => p.kind !== "text");
  function insert(
    text: string,
    start = ref.current?.selectionStart ?? value.length,
    end = ref.current?.selectionEnd ?? start,
  ) {
    const el = ref.current;
    if (!el) return;
    if (el.value.length - (end - start) + text.length > maxLength) {
      setError(
        `Nội dung tối đa ${maxLength} ký tự. Hãy rút ngắn trước khi chèn công thức.`,
      );
      return;
    }
    el.setRangeText(text, start, end, "end");
    setValue(el.value);
    setError("");
    setComposer(null);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.focus();
  }
  function open() {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart ?? 0,
      end = el.selectionEnd ?? start;
    const selected = formulaSegments(el.value).find(
      (p) =>
        p.kind === "math" &&
        p.start <= start &&
        p.end >= end &&
        (start !== end || start < p.end),
    );
    setComposer({
      initial: selected?.value ?? unwrapFormula(el.value.slice(start, end)),
      start: selected?.start ?? start,
      end: selected?.end ?? end,
    });
    setError("");
  }
  const props = {
    id,
    name,
    required,
    maxLength,
    defaultValue,
    autoComplete: "off",
    spellCheck: false,
    onInput: (e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValue(e.currentTarget.value);
      setError("");
    },
    onPaste: (
      e: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      try {
        const text = formattedClipboard(e.clipboardData);
        if (text !== null) {
          e.preventDefault();
          insert(text);
        }
      } catch (problem) {
        setError((problem as Error).message);
      }
    },
  };
  return (
    <div className="formula-field">
      <label htmlFor={id}>{label}</label>
      {rows ? (
        <textarea
          {...props}
          rows={rows}
          ref={(el) => {
            ref.current = el;
          }}
        />
      ) : (
        <input
          {...props}
          ref={(el) => {
            ref.current = el;
          }}
        />
      )}
      <div className="formula-tools">
        <button
          type="button"
          className="button secondary small"
          aria-expanded={!!composer}
          aria-controls={panel}
          onClick={() =>
            composer ? (setComposer(null), ref.current?.focus()) : open()
          }
        >
          Công thức<span className="sr-only"> cho {label}</span>
        </button>
      </div>
      {formatted && (
        <div className="formula-preview" aria-label={`Xem trước ${label}`}>
          <small>Xem trước</small>
          <QuestionText>{value}</QuestionText>
        </div>
      )}
      {error && <p role="alert">{error}</p>}
      <div id={panel}>
        {composer && (
          <FormulaBoundary>
            <Suspense
              fallback={<p role="status">Đang mở bộ soạn công thức…</p>}
            >
              <FormulaComposer
                initial={composer.initial}
                onInsert={(text) => insert(text, composer.start, composer.end)}
                onClose={() => {
                  setComposer(null);
                  ref.current?.focus();
                }}
              />
            </Suspense>
          </FormulaBoundary>
        )}
      </div>
    </div>
  );
}
