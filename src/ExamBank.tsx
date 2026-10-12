import type { MatrixRow } from "../shared/learning";
import type { Chapter } from "./types";

export type ExamBankSelection = Record<string, "all" | string[]>;

export function ExamBank({
  chapters,
  matrix,
  selection,
  onChange,
  disabled,
}: {
  chapters: Chapter[];
  matrix: MatrixRow[];
  selection: ExamBankSelection;
  onChange: (value: ExamBankSelection) => void;
  disabled: boolean;
}) {
  function selectChapter(id: string, checked: boolean) {
    const next = { ...selection };
    if (checked) next[id] = "all";
    else delete next[id];
    onChange(next);
  }
  return (
    <fieldset className="exam-bank">
      <legend>Chọn từ ngân hàng</legend>
      <p>
        Chọn nhiều chương, lấy toàn chương hoặc xổ danh sách để chọn từng bài.
      </p>
      {!chapters.length && <p className="muted">Lớp chưa có chương.</p>}
      {chapters.map((ch) => {
        const rows = matrix.filter((row) => row.chapterId === ch.id);
        const current = selection[ch.id];
        const partial = Array.isArray(current);
        return (
          <div className="exam-bank-chapter" key={ch.id}>
            <label className="exam-bank-title">
              <input
                type="checkbox"
                disabled={disabled}
                checked={current !== undefined}
                ref={(input) => {
                  if (input) input.indeterminate = partial;
                }}
                onChange={(e) => selectChapter(ch.id, e.target.checked)}
              />
              {ch.title}
            </label>
            <details open={current !== undefined}>
              <summary>
                Toàn chương hoặc từng bài ·{" "}
                {rows.reduce((sum, row) => sum + row.available, 0)} câu
              </summary>
              <div className="learning-options">
                <label>
                  <input
                    type="checkbox"
                    disabled={disabled || !rows.length}
                    checked={current === "all"}
                    onChange={(e) =>
                      onChange({
                        ...selection,
                        [ch.id]: e.target.checked ? "all" : [],
                      })
                    }
                  />
                  Toàn chương · {ch.title}
                </label>
                {rows.map((row) => (
                  <label className="exam-bank-lesson" key={row.key}>
                    <input
                      type="checkbox"
                      disabled={disabled}
                      checked={
                        current === "all" ||
                        (partial && current.includes(row.key))
                      }
                      onChange={(e) => {
                        const keys =
                          current === "all"
                            ? rows.map((r) => r.key)
                            : (current ?? []);
                        onChange({
                          ...selection,
                          [ch.id]: e.target.checked
                            ? [...new Set([...keys, row.key])]
                            : keys.filter((key) => key !== row.key),
                        });
                      }}
                    />
                    {ch.title} · {row.lesson || "Chưa gắn bài"} ({row.available}{" "}
                    câu)
                  </label>
                ))}
                {!rows.length && (
                  <p className="muted">Chương chưa có câu hỏi đang sử dụng.</p>
                )}
              </div>
            </details>
          </div>
        );
      })}
    </fieldset>
  );
}
