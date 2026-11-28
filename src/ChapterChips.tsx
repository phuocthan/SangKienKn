import { LocChuong } from "./green-icons";

/** Chapter picker as tappable chips; long lists fall back to a native select. */
export function ChapterChips({
  id,
  label,
  allLabel,
  chapters,
  value,
  onChange,
}: {
  id: string;
  label: string;
  allLabel: string;
  chapters: { id: string; title: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  const options = [{ id: "", title: allLabel }, ...chapters];
  if (chapters.length > 8)
    return (
      <div className="chapter-chips">
        <LocChuong size={20} />
        <select
          id={id}
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
      </div>
    );
  return (
    <div
      className="chapter-chips"
      role="radiogroup"
      aria-label={label}
      id={id}
    >
      <LocChuong size={20} />
      {options.map((item) => (
        <button
          key={item.id}
          type="button"
          role="radio"
          aria-checked={value === item.id}
          className={`chapter-chip ${value === item.id ? "is-active" : ""}`}
          title={item.title}
          onClick={() => onChange(item.id)}
        >
          {item.id ? item.title.split(" · ")[0] : allLabel}
        </button>
      ))}
    </div>
  );
}
