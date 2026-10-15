import { useState, useRef } from "react";
import { Modal } from "./components";
import { api, errorMessage } from "./api";
import { ExamUpload, type UploadedExamQuestion } from "./ExamUpload";
import type { Chapter } from "./types";
import type { LearningChapter } from "../shared/learning";
import type { SessionPolicy } from "../shared/session-policy";
import "./class-management.css";

export function HuntAccess({
  chapter,
  state,
  policy,
  onClose,
  onSaved,
}: {
  chapter: Chapter;
  state: LearningChapter;
  policy: SessionPolicy;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const closing = state.hunt?.open ?? state.examAllowed;
  const [reuse, setReuse] = useState(!!state.hunt?.hasQuestions);
  const [remove, setRemove] = useState(false);
  const [title, setTitle] = useState(
    state.hunt?.title || `Săn thưởng · ${chapter.title}`,
  );
  const [wait, setWait] = useState(state.hunt?.preparationMinutes ?? 0);
  const [minutes, setMinutes] = useState(state.hunt?.durationMinutes ?? 20);
  const [tabs, setTabs] = useState(state.hunt?.tabLimit ?? policy.closeTabs);
  const [questions, setQuestions] = useState<UploadedExamQuestion[]>([]);
  const [reading, setReading] = useState(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const requests = useRef(new Map<string, string>());
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy || reading) return;
    setBusy(true);
    setError("");
    try {
      const body = closing
        ? { enabled: false, deleteQuestions: remove }
        : {
            enabled: true,
            reuse,
            title,
            preparationMinutes: wait,
            durationMinutes: minutes,
            tabLimit: tabs,
            ...(!reuse ? { questions } : {}),
          };
      const fingerprint = JSON.stringify(body);
      if (!requests.current.has(fingerprint))
        requests.current.set(fingerprint, crypto.randomUUID());
      await api(`/chapters/${chapter.id}/hunt-access`, {
        ...body,
        requestId: requests.current.get(fingerprint),
      });
      await onSaved();
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={closing ? "Khóa săn thưởng" : "Mở săn thưởng"}
      className="online-exam-create-modal"
      dismissible={!busy && !reading}
      onClose={onClose}
    >
      <form
        onSubmit={save}
        className="hunt-access-form"
        aria-label={closing ? "Khóa săn thưởng" : "Mở săn thưởng"}
      >
        <p>
          <strong>{chapter.title}</strong>
        </p>
        {closing ? (
          <>
            <p>
              Học sinh sẽ không thể vào săn thưởng. Lượt đang làm được thu bài
              với đáp án đã lưu.
            </p>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={remove}
                disabled={busy}
                onChange={(e) => setRemove(e.target.checked)}
              />
              Xóa bộ đề đã tải lên
            </label>
            <small>
              Giữ lịch sử các lượt đã làm. Nếu bỏ chọn, lần mở sau có thể dùng
              lại bộ đề.
            </small>
          </>
        ) : (
          <>
            <label>
              Tên bộ đề
              <input
                required
                maxLength={120}
                value={title}
                disabled={busy}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            {state.hunt?.hasQuestions && (
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={reuse}
                  disabled={busy || reading}
                  onChange={(e) => setReuse(e.target.checked)}
                />
                Sử dụng bộ đề đã tải trước đó ·{" "}
                {new Intl.DateTimeFormat("vi-VN", {
                  dateStyle: "short",
                  timeStyle: "short",
                }).format(state.hunt.uploadedAt)}
              </label>
            )}
            {!reuse && (
              <fieldset disabled={busy}>
                <legend>Tải đề Word hoặc CSV</legend>
                <ExamUpload
                  singleChapter
                  chapters={[chapter]}
                  questions={questions}
                  onChange={setQuestions}
                  onReadingChange={setReading}
                />
              </fieldset>
            )}
            <div className="session-policy-fields">
              <label>
                Thời gian chuẩn bị (phút)
                <input
                  required
                  type="number"
                  min={0}
                  max={60}
                  step={1}
                  value={wait}
                  disabled={busy}
                  onChange={(e) => setWait(Number(e.target.value))}
                />
              </label>
              <label>
                Thời gian làm bài (phút)
                <input
                  required
                  type="number"
                  min={1}
                  max={180}
                  step={1}
                  value={minutes}
                  disabled={busy}
                  onChange={(e) => setMinutes(Number(e.target.value))}
                />
              </label>
              <label>
                Số lần rời tab tối đa
                <input
                  required
                  type="number"
                  min={1}
                  max={20}
                  step={1}
                  value={tabs}
                  disabled={busy}
                  onChange={(e) => setTabs(Number(e.target.value))}
                />
              </label>
            </div>
            <small>
              Mở sau {wait} phút, làm trong {minutes} phút với hạn đóng chung.
              Quy tắc của Quản lý chung vẫn áp dụng nếu chặt hơn. Học sinh vẫn
              cần đủ điều kiện và vé.
            </small>
          </>
        )}
        {error && (
          <div role="alert" className="error-banner">
            {error}
          </div>
        )}
        <div className="button-group">
          <button
            type="button"
            className="button outline"
            disabled={busy || reading}
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            className={`button ${closing ? "danger" : "primary"}`}
            disabled={
              busy || reading || (!closing && !reuse && !questions.length)
            }
          >
            {busy ? "Đang lưu…" : closing ? "Xác nhận khóa" : "Mở săn thưởng"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
