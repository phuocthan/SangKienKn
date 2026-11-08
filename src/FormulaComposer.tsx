import { useEffect, useId, useRef, useState } from "react";
import { MathfieldElement } from "mathlive";
import "mathlive/fonts.css";
import { renderFormula } from "./formula-render";
import { QuestionText } from "./QuestionText";
import { unwrapFormula, wrapFormula } from "../shared/formula-text";

MathfieldElement.fontsDirectory = null;
MathfieldElement.soundsDirectory = null;

const templates = [
  ["Chỉ số dưới", "x_{a}", "_{#0}"],
  ["Số mũ", "x^2", "^{#0}"],
  ["Phân số", "\\frac{a}{b}", "\\frac{#0}{#?}"],
  ["Căn bậc hai", "\\sqrt{x}", "\\sqrt{#0}"],
  ["Căn bậc n", "\\sqrt[n]{x}", "\\sqrt[#?]{#0}"],
  ["Vectơ", "\\vec{a}", "\\vec{#0}"],
  ["Tổng", "\\sum", "\\sum_{#?}^{#?}#0"],
  ["Tích phân", "\\int", "\\int_{#?}^{#?}#0"],
];
const symbols = [
  "α",
  "β",
  "γ",
  "Δ",
  "ω",
  "π",
  "λ",
  "μ",
  "θ",
  "φ",
  "±",
  "×",
  "·",
  "≤",
  "≥",
  "≠",
  "≈",
  "∞",
  "°",
];

export default function FormulaComposer({
  initial = "",
  onInsert,
  onClose,
}: {
  initial?: string;
  onInsert?: (value: string) => void;
  onClose?: () => void;
}) {
  const [latex, setLatex] = useState(unwrapFormula(initial));
  const [message, setMessage] = useState("");
  const host = useRef<HTMLDivElement>(null),
    field = useRef<MathfieldElement | null>(null);
  const id = useId();
  useEffect(() => {
    const mf = new MathfieldElement();
    mf.value = unwrapFormula(initial);
    mf.mathVirtualKeyboardPolicy = "manual";
    mf.setAttribute("aria-label", "Ô soạn công thức trực quan");
    mf.setAttribute("placeholder", "\\text{Nhập công thức…}");
    mf.setAttribute("tabindex", "0");
    const input = () => {
      setLatex(mf.getValue("latex-without-placeholders"));
      setMessage("");
    };
    mf.addEventListener("input", input);
    // Enter edits this formula; it must not submit the surrounding question form.
    const key = (e: KeyboardEvent) => {
      if (e.key === "Enter") e.preventDefault();
    };
    mf.addEventListener("keydown", key);
    host.current?.append(mf);
    mf.menuItems = [];
    field.current = mf;
    return () => {
      mf.removeEventListener("input", input);
      mf.removeEventListener("keydown", key);
      mf.remove();
      field.current = null;
    };
  }, [initial]);
  const result = renderFormula(latex);
  const valid = !!latex.trim() && !result.error;
  function insert(value: string) {
    field.current?.focus();
    if (value === "_{#0}") field.current?.executeCommand("moveToSubscript");
    else if (value === "^{#0}")
      field.current?.executeCommand("moveToSuperscript");
    else field.current?.insert(value, { selectionMode: "placeholder" });
    setLatex(field.current?.getValue("latex-without-placeholders") ?? latex);
    setMessage("");
  }
  async function copy(mathml = false) {
    const plain = mathml
      ? renderFormula(latex, false, true).html
      : wrapFormula(latex);
    try {
      if (
        !mathml &&
        navigator.clipboard?.write &&
        typeof ClipboardItem !== "undefined"
      ) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/plain": new Blob([plain], { type: "text/plain" }),
            "text/html": new Blob([renderFormula(latex, false, true).html], {
              type: "text/html",
            }),
          }),
        ]);
      } else await navigator.clipboard.writeText(plain);
      setMessage(
        mathml
          ? "Đã sao chép MathML."
          : "Đã sao chép công thức. Dán vào nội dung hoặc ô công thức để dùng lại.",
      );
    } catch {
      setMessage(
        "Trình duyệt chưa cho sao chép. Chọn mã công thức bên dưới rồi nhấn Ctrl+C.",
      );
    }
  }
  return (
    <section
      className="formula-composer"
      aria-label="Bộ soạn công thức"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onClose?.();
        }
      }}
    >
      <h4>Soạn công thức</h4>
      <p className="subtle-note">
        Gõ trực tiếp hoặc chọn mẫu. Dùng phím mũi tên để di chuyển giữa các ô;
        bôi đen công thức trong nội dung rồi mở lại để sửa.
      </p>
      <div className="formula-palette" aria-label="Mẫu công thức">
        {templates.map(([label, sample, value]) => (
          <button
            type="button"
            key={label}
            title={label}
            aria-label={label}
            onClick={() => insert(value)}
          >
            <QuestionText>{wrapFormula(sample)}</QuestionText>
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            const value = "W_{\\text{đ}}=\\frac{1}{2}mv^{2}";
            field.current?.setValue(value);
            setLatex(value);
            setMessage("");
          }}
        >
          Mẫu W<sub>đ</sub>
        </button>
      </div>
      <div ref={host} />
      <div className="formula-palette" aria-label="Ký hiệu toán và vật lý">
        {symbols.map((symbol) => (
          <button
            type="button"
            key={symbol}
            aria-label={`Chèn ${symbol}`}
            onClick={() => insert(symbol)}
          >
            {symbol}
          </button>
        ))}
      </div>
      <div className="formula-preview" aria-label="Xem trước công thức">
        {latex ? (
          <QuestionText>{wrapFormula(latex)}</QuestionText>
        ) : (
          <span className="muted">Công thức sẽ hiện ở đây.</span>
        )}
      </div>
      <label htmlFor={id}>Mã công thức (LaTeX)</label>
      <textarea
        id={id}
        value={latex}
        rows={2}
        maxLength={3000}
        spellCheck={false}
        autoComplete="off"
        onChange={(e) => {
          const value = unwrapFormula(e.target.value);
          setLatex(value);
          field.current?.setValue(value);
          setMessage("");
        }}
      />
      {latex && result.error && (
        <p role="alert" className="formula-feedback">
          {result.error}
        </p>
      )}
      <div className="formula-actions">
        {onInsert && (
          <button
            type="button"
            className="button primary small"
            disabled={!valid}
            onClick={() => onInsert(wrapFormula(latex))}
          >
            Chèn công thức
          </button>
        )}
        <button
          type="button"
          className="button secondary small"
          disabled={!valid}
          onClick={() => void copy()}
        >
          Sao chép công thức
        </button>
        <button
          type="button"
          className="button secondary small"
          disabled={!valid}
          onClick={() => void copy(true)}
        >
          Sao chép MathML
        </button>
        {onClose && (
          <button
            type="button"
            className="button secondary small"
            onClick={onClose}
          >
            Đóng bộ soạn
          </button>
        )}
      </div>
      <p role="status" className="formula-feedback">
        {message}
      </p>
    </section>
  );
}
