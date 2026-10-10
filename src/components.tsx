import { useEffect, useId, useRef, type ReactNode } from "react";
import { X, Leaf, Sprout, ArrowRight } from "lucide-react";

export function Logo() {
  return (
    <div className="logo">
      <span className="logo-mark">
        <Sprout size={27} />
      </span>
      <span>
        green<span className="logo-light">edu</span>
        <small>GIEO TRI THỨC, GẶT TƯƠNG LAI</small>
      </span>
    </div>
  );
}

export function Tree({
  level = 1,
  decorative = false,
}: {
  level?: number;
  decorative?: boolean;
}) {
  const id = useId().replaceAll(":", "");
  return (
    <svg
      viewBox="0 0 240 230"
      className="tree-art"
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : `Cây kiến thức cấp ${level}`}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#79b679" />
          <stop offset="1" stopColor="#257348" />
        </linearGradient>
      </defs>
      <ellipse cx="121" cy="207" rx="61" ry="12" fill="#153f2e" opacity=".08" />
      <path d="M86 183h70l-8 29H94z" fill="#cb986e" />
      <path d="M82 180h78v10H82z" fill="#e6b38c" />
      {level === 1 ? (
        <>
          <path d="M118 181q-8-20 4-29q17 12 2 29" fill="#896346" />
          <path d="M121 178l1-17" stroke="#d8b889" strokeWidth="2" />
        </>
      ) : (
        <>
          <path
            d={`M121 181Q${level > 2 ? "119 120 123 85" : "121 156 116 131"}`}
            stroke="#8a684c"
            strokeWidth={level > 2 ? 9 : 4}
            fill="none"
            strokeLinecap="round"
          />
          {level === 2 ? (
            <>
              <path
                d="M120 153C84 151 85 121 92 120c27 0 31 21 28 33"
                fill={`url(#${id})`}
              />
              <path
                d="M119 144c-3-28 22-43 35-40 1 25-14 39-35 40"
                fill="#6fae70"
              />
            </>
          ) : (
            <>
              <path
                d="M121 151l-26-31m27 16l28-27"
                stroke="#8a684c"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <ellipse
                cx="96"
                cy="108"
                rx={level > 3 ? 42 : 31}
                ry="35"
                fill="#438454"
              />
              <ellipse
                cx="150"
                cy="103"
                rx={level > 3 ? 43 : 32}
                ry="36"
                fill="#5b9c62"
              />
              <ellipse
                cx="122"
                cy="76"
                rx={level > 3 ? 46 : 32}
                ry="43"
                fill={`url(#${id})`}
              />
              <path
                d="M107 55q12-11 27-8"
                stroke="#a4cc91"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
              />
              {level === 5 &&
                [
                  [92, 91],
                  [141, 70],
                  [153, 114],
                  [117, 119],
                ].map(([x, y], i) => (
                  <g key={i} transform={`translate(${x} ${y})`}>
                    <circle r="9" fill="#efba98" />
                    <circle r="3" fill="#fff6c4" />
                  </g>
                ))}
            </>
          )}
        </>
      )}
      <path
        d="M52 205q3-13 11-12q-1 12-11 12m133 1q-2-14-10-16q-3 10 10 16"
        fill="#83a47c"
      />
      <circle cx="177" cy="50" r="3" fill="#e7bb70" />
      <path d="M61 68v8m-4-4h8" stroke="#dda56b" strokeWidth="2" />
    </svg>
  );
}

export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const style = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const elements = () =>
      [
        ...(ref.current?.querySelectorAll<HTMLElement>(
          'button, input, textarea, select, [tabindex="0"]',
        ) ?? []),
      ].filter((e) => !e.hasAttribute("disabled"));
    elements()
      .find((e) => e.tagName !== "BUTTON")
      ?.focus();
    function key(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        const all = elements(),
          first = all[0],
          last = all.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = style;
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="modal-head">
          <h2 id={titleId}>{title}</h2>
          <button className="icon-button" aria-label="Đóng" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Empty({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Leaf size={27} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
export function SectionTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-title">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function LinkButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button className="text-button" onClick={onClick}>
      {children}
      <ArrowRight size={16} />
    </button>
  );
}
