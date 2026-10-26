import { useState, useRef, useMemo } from "react";
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
  multiplePapers = false,
  teacherControlled = false,
  onClose,
  onSaved,
}: {
  chapter: Chapter;
  state: LearningChapter;
  policy: SessionPolicy;
  multiplePapers?: boolean;
  teacherControlled?: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const closing = state.hunt?.open ?? state.examAllowed;
  const [papers, setPapers] = useState(() =>
    [1, 2, 3].map((slot) => {
      const saved = state.hunt?.papers?.find((p) => p.slot === slot);
      return {
        slot,
        reuse: !!saved || (slot === 1 && !!state.hunt?.hasQuestions),
        questions: [] as UploadedExamQuestion[],
        reading: false,
        uploadedAt:
          saved?.uploadedAt ??
          (slot === 1 ? state.hunt?.uploadedAt : undefined),
      };
    }),
  );
  const [remove, setRemove] = useState(false);
  const [title, setTitle] = useState(
    (state.hunt?.title || `Săn thưởng · ${chapter.title}`).slice(0, 120),
  );
  const [wait, setWait] = useState(state.hunt?.preparationMinutes ?? 0);
  const [minutes, setMinutes] = useState(state.hunt?.durationMinutes ?? 20);
  const [tabs, setTabs] = useState(state.hunt?.tabLimit ?? policy.closeTabs);
  const reading = papers.some((p) => p.reading);
  const paperCallbacks = useMemo(
    () =>
      [1, 2, 3].map((slot) => ({
        onChange: (questions: UploadedExamQuestion[]) =>
          setPapers((old) =>
            old.map((p) => (p.slot === slot ? { ...p, questions } : p)),
          ),
        onReadingChange: (reading: boolean) =>
          setPapers((old) =>
            old.find((p) => p.slot === slot)?.reading === reading
              ? old
              : old.map((p) => (p.slot === slot ? { ...p, reading } : p)),
          ),
      })),
    [],
  );
  const first = papers[0];
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
            reuse: first.reuse,
            title,
            preparationMinutes: wait,
            durationMinutes: minutes,
            tabLimit: tabs,
            ...(multiplePapers
              ? {
                  papers: papers
                    .filter((p) => p.reuse || p.questions.length)
                    .map((p) => ({
                      slot: p.slot,
                      reuse: p.reuse,
                      title: `${title.slice(0, 110)} · Đề ${p.slot}`,
                      ...(!p.reuse ? { questions: p.questions } : {}),
                    })),
                }
              : !first.reuse
                ? { questions: first.questions }
                : {}),
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
            {multiplePapers && (
              <p>
                Mỗi vé dùng một đề: cấp 3 → Đề 1, cấp 4 → Đề 2, cấp 5 → Đề 3.
                Các đề phải khác nội dung. Đề chưa tải lên sẽ khóa lượt tương
                ứng.
              </p>
            )}
            {(multiplePapers ? papers : papers.slice(0, 1)).map((paper) => (
              <fieldset key={paper.slot} disabled={busy}>
                <legend>
                  {multiplePapers
                    ? `Đề ${paper.slot} · Vé cấp ${paper.slot + 2}`
                    : "Đề săn thưởng"}
                </legend>
                {paper.uploadedAt && (
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={paper.reuse}
                      disabled={busy || reading}
                      onChange={(e) =>
                        setPapers((old) =>
                          old.map((p) =>
                            p.slot === paper.slot
                              ? { ...p, reuse: e.target.checked }
                              : p,
                          ),
                        )
                      }
                    />
                    Sử dụng bộ đề đã tải trước đó ·{" "}
                    {new Intl.DateTimeFormat("vi-VN", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(paper.uploadedAt)}
                  </label>
                )}
                {!paper.reuse && (
                  <fieldset disabled={busy}>
                    <legend>Tải đề Word hoặc CSV</legend>
                    <ExamUpload
                      singleChapter
                      chapters={[chapter]}
                      questions={paper.questions}
                      onChange={paperCallbacks[paper.slot - 1].onChange}
                      onReadingChange={
                        paperCallbacks[paper.slot - 1].onReadingChange
                      }
                    />
                  </fieldset>
                )}
              </fieldset>
            ))}
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
              {teacherControlled
                ? `Mở sau ${wait} phút và giữ mở đến khi giáo viên khóa. Mỗi lượt có ${minutes} phút tính từ lúc học sinh bắt đầu.`
                : `Mở sau ${wait} phút, làm trong ${minutes} phút với hạn đóng chung.`}{" "}
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
              busy ||
              reading ||
              (!closing && !first.reuse && !first.questions.length)
            }
          >
            {busy ? "Đang lưu…" : closing ? "Xác nhận khóa" : "Mở săn thưởng"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
