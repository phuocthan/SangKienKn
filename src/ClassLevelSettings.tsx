import { useState } from "react";
import "./class-management.css";

export function ClassLevelSettings({
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
  const valid = Number.isInteger(value) && value >= 1 && value <= 1440;

  return (
    <section className="card class-management-card" aria-labelledby="class-level-title">
      <div>
        <h2 id="class-level-title">Thời gian tăng cấp</h2>
        <p>Mỗi chương tăng một cấp sau số phút học có hoạt động bạn chọn.</p>
      </div>
      <form
        aria-label="Cài đặt thời gian tăng cấp"
        onSubmit={(event) => {
          event.preventDefault();
          if (enabled && valid && value !== minutes && !busy) void onSave(value);
        }}
      >
        <label htmlFor="class-level-minutes">Phút mỗi cấp</label>
        <input
          id="class-level-minutes"
          type="number"
          min={1}
          max={1440}
          step={1}
          required
          value={draft}
          disabled={busy || !enabled}
          onChange={(event) => setDraft(event.target.value)}
        />
        <button className="button primary small" disabled={busy || !enabled || !valid || value === minutes}>
          {busy ? "Đang lưu…" : "Lưu thay đổi"}
        </button>
      </form>
      <small>Hiện tại: {minutes} phút/cấp · Giới hạn 1–1440 phút. Vé và điểm đã cấp được giữ nguyên.</small>
      {!enabled && <p role="status" className="muted">Cài đặt này đang chờ cập nhật server.</p>}
    </section>
  );
}
