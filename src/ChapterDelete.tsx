import { useState } from "react";
import { Trash2 } from "./icons";
import { Modal } from "./components";
import { api, errorMessage } from "./api";
import type { Chapter } from "./types";

export function ChapterDelete({
  chapter,
  onChange,
  compact = false,
}: {
  chapter: Chapter;
  onChange: () => Promise<void>;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function remove() {
    if (busy || !chapter.canDeleteChapter) return;
    setBusy(true);
    setError("");
    try {
      await api(`/chapters/${chapter.id}/delete`, { confirm: true });
      await onChange();
      setOpen(false);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button
        type="button"
        className={`button danger-outline small${compact ? " chapter-delete-icon" : ""}`}
        aria-label={`Xóa chương · ${chapter.title}`}
        disabled={!chapter.canDeleteChapter}
        title={
          chapter.canDeleteChapter
            ? "Xóa chương"
            : "Xóa chương đang chờ cập nhật máy chủ"
        }
        onClick={() => {
          setError("");
          setOpen(true);
        }}
      >
        <Trash2 size={16} />
        {!compact && " Xóa chương"}
      </button>
      {open && (
        <Modal
          title="Xóa chương"
          onClose={() => {
            if (!busy) setOpen(false);
          }}
        >
          <p>
            Bạn có chắc chắn muốn xóa chương <strong>{chapter.title}</strong>{" "}
            không?
          </p>
          <p>
            {chapter.lessons.length} bài · {chapter.questionCount} câu hỏi sẽ
            ngừng sử dụng trong lượt học mới. Lịch sử học, sổ tay sửa sai và kết
            quả kiểm tra đã lưu được giữ lại.
          </p>
          {error && (
            <div className="error-banner" role="alert">
              {error}
            </div>
          )}
          <div className="button-group">
            <button
              type="button"
              className="button outline"
              disabled={busy}
              onClick={() => setOpen(false)}
            >
              Hủy
            </button>
            <button
              type="button"
              className="button danger"
              disabled={busy}
              onClick={() => void remove()}
            >
              {busy ? "Đang xóa…" : "Xóa chương"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
