import { useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Modal } from "./components";
import { api, errorMessage } from "./api";
import type { Chapter } from "./types";

export function Lessons({
  chapter,
  onChange,
}: {
  chapter: Chapter;
  onChange: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await api(`/chapters/${chapter.id}/lessons`, { title });
      await onChange();
      setEditing(false);
      setTitle("");
      setNotice("Đã thêm bài.");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (busy || !deleting) return;
    setBusy(true);
    setError("");
    try {
      await api(`/chapters/${chapter.id}/lessons/delete`, { title: deleting });
      await onChange();
      setDeleting(null);
      setNotice("Đã xóa bài khỏi danh sách; lịch sử học được giữ lại.");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="lesson-management">
      <button
        className="button secondary small"
        disabled={!chapter.canManageLessons}
        onClick={() => {
          setEditing(true);
          setError("");
          setNotice("");
        }}
      >
        <Plus size={15} /> Thêm bài
      </button>
      {!chapter.canManageLessons && (
        <small className="muted">Quản lý bài đang chờ cập nhật server.</small>
      )}
      {notice && (
        <p className="learning-notice" role="status">
          {notice}
        </p>
      )}
      {chapter.lessons.length > 0 && (
        <details className="curriculum-lessons">
          <summary>Xem danh sách bài</summary>
          <ol>
            {chapter.lessons.map((lesson) => (
              <li key={lesson.title}>
                <div className="lesson-row">
                  <div>
                    <span>{lesson.title}</span>
                    <small>
                      {lesson.questionCount
                        ? `${lesson.questionCount} câu hỏi`
                        : "Chưa có câu hỏi"}
                    </small>
                  </div>
                  <button
                    className="button danger-outline small"
                    disabled={busy || !chapter.canManageLessons}
                    aria-label={`Xóa bài · ${lesson.title}`}
                    onClick={() => {
                      setDeleting(lesson.title);
                      setError("");
                      setNotice("");
                    }}
                  >
                    <Trash2 size={15} /> Xóa bài
                  </button>
                </div>
              </li>
            ))}
          </ol>
        </details>
      )}
      {editing && (
        <Modal
          title="Thêm bài học"
          onClose={() => {
            if (!busy) setEditing(false);
          }}
        >
          <form onSubmit={(event) => void save(event)}>
            <p className="form-intro">Bài mới thuộc {chapter.title}.</p>
            <label>
              Tên bài
              <input
                required
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Bài 1. Dao động điều hòa"
              />
            </label>
            {error && (
              <div className="error-banner" role="alert">
                {error}
              </div>
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="button secondary"
                disabled={busy}
                onClick={() => setEditing(false)}
              >
                Hủy
              </button>
              <button className="button primary" disabled={busy}>
                {busy ? "Đang lưu…" : "Thêm bài"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {deleting && (
        <Modal
          title="Xóa bài học"
          onClose={() => {
            if (!busy) setDeleting(null);
          }}
        >
          <p>
            Xóa <strong>{deleting}</strong> khỏi {chapter.title}?
          </p>
          <p>
            Câu hỏi của bài sẽ được ẩn khỏi lượt học mới. Lượt làm, sổ tay sửa
            sai và bài kiểm tra đã tạo được giữ lại. Thêm lại cùng tên sẽ khôi
            phục bài; câu hỏi vẫn ẩn cho đến khi bạn hiện lại.
          </p>
          {error && (
            <div className="error-banner" role="alert">
              {error}
            </div>
          )}
          <div className="modal-actions">
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => setDeleting(null)}
            >
              Hủy
            </button>
            <button
              className="button danger"
              disabled={busy}
              onClick={() => void remove()}
            >
              {busy ? "Đang xóa…" : "Xóa bài"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
