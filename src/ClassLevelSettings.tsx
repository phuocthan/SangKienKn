import { useState } from "react";
import "./class-management.css";
import {
  DEFAULT_SESSION_POLICY,
  validSessionPolicy,
  type SessionPolicy,
} from "../shared/session-policy";

export function ClassLevelSettings({
  minutes,
  enabled,
  busy,
  onSave,
  policy = DEFAULT_SESSION_POLICY,
  canConfigurePolicy = false,
}: {
  minutes: number;
  enabled: boolean;
  busy: boolean;
  policy?: SessionPolicy;
  canConfigurePolicy?: boolean;
  onSave: (minutes: number, policy: SessionPolicy) => Promise<void>;
}) {
  const [draft, setDraft] = useState(String(minutes));
  const [rules, setRules] = useState(policy);
  const value = Number(draft);
  const valid =
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 1440 &&
    validSessionPolicy(rules);
  const changed =
    value !== minutes || JSON.stringify(rules) !== JSON.stringify(policy);

  return (
    <section
      className="card class-management-card"
      aria-labelledby="class-level-title"
    >
      <div>
        <h2 id="class-level-title">Quản lý chung</h2>
        <p>Mỗi chương tăng một cấp sau số phút học có hoạt động bạn chọn.</p>
      </div>
      <form
        aria-label="Cài đặt thời gian tăng cấp"
        onSubmit={(event) => {
          event.preventDefault();
          if (enabled && valid && changed && !busy) void onSave(value, rules);
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
        <fieldset
          className="session-policy-fields"
          disabled={busy || !canConfigurePolicy}
        >
          <legend>Nhắc nhở và tự động đóng phiên</legend>
          <p>
            Áp dụng cho luyện tập, ôn, sửa sai và kiểm tra của lớp này. Ngưỡng
            nhắc nhở phải nhỏ hơn ngưỡng đóng.
          </p>
          {(
            [
              ["warningTabs", "Nhắc khi rời tab (lần)", 1, 19],
              ["closeTabs", "Tự đóng khi rời tab (lần)", 2, 20],
              [
                "warningIdleSeconds",
                "Nhắc khi không tương tác (giây)",
                5,
                3599,
              ],
              [
                "closeIdleSeconds",
                "Tự đóng khi không tương tác (giây)",
                6,
                3600,
              ],
            ] as const
          ).map(([key, label, min, max]) => (
            <label key={key}>
              {label}
              <input
                type="number"
                required
                min={min}
                max={max}
                step={1}
                value={rules[key]}
                onChange={(e) =>
                  setRules({ ...rules, [key]: Number(e.target.value) })
                }
              />
            </label>
          ))}
          <small>
            Ví dụ: nhắc ở lần 2/30 giây; đóng ở lần 3/60 giây. Phiên luyện tập
            vi phạm không được tính giờ; bài kiểm tra được tự nộp với đáp án đã
            lưu.
          </small>
          {!canConfigurePolicy && (
            <p role="status">Cài đặt đóng phiên đang chờ cập nhật máy chủ.</p>
          )}
        </fieldset>
        {!valid && (
          <p role="alert">
            Nhập số nguyên hợp lệ; ngưỡng nhắc nhở phải nhỏ hơn ngưỡng tự đóng.
          </p>
        )}
        <button
          className="button primary small"
          disabled={busy || !enabled || !valid || !changed}
        >
          {busy ? "Đang lưu…" : "Lưu thay đổi"}
        </button>
      </form>
      <small>
        Hiện tại: {minutes} phút/cấp · Giới hạn 1–1440 phút. Vé và điểm đã cấp
        được giữ nguyên.
      </small>
      {!enabled && (
        <p role="status" className="muted">
          Cài đặt này đang chờ cập nhật server.
        </p>
      )}
    </section>
  );
}
