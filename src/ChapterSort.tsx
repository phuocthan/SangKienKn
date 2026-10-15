import { useRef, useState, type PointerEvent } from "react";
import { api, errorMessage } from "./api";
import { Modal } from "./components";
import type { Classroom } from "./types";
import "./chapter-sort.css";

export function ChapterSort({
  classroom,
  onClose,
  onSaved,
}: {
  classroom: Classroom;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [initialChapters] = useState(classroom.chapters);
  const original = initialChapters.map((ch) => ch.id);
  const [ids, setIds] = useState(original);
  const [dragging, setDragging] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const drag = useRef<{ id: string; pointerId: number } | null>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const [error, setError] = useState("");
  const changed = ids.some((id, index) => original[index] !== id);
  const chapters = new Map(initialChapters.map((ch) => [ch.id, ch]));

  function move(id: string, to: number) {
    if (saving.current) return;
    setIds((previous) => {
      const from = previous.indexOf(id);
      if (from < 0 || to < 0 || to >= previous.length || from === to)
        return previous;
      const next = [...previous];
      next.splice(from, 1);
      next.splice(to, 0, id);
      return next;
    });
    setAnnouncement(`${chapters.get(id)?.title} · vị trí ${to + 1}`);
  }
  function pointerMove(event: PointerEvent<HTMLOListElement>) {
    if (!drag.current || event.pointerId !== drag.current.pointerId) return;
    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>("[data-sort-chapter]");
    if (target) {
      const to = ids.indexOf(target.dataset.sortChapter!);
      const from = ids.indexOf(drag.current.id);
      const box = target.getBoundingClientRect();
      if (
        (from < to && event.clientY > box.top + box.height / 2) ||
        (from > to && event.clientY < box.top + box.height / 2)
      )
        move(drag.current.id, to);
    }
    const list = event.currentTarget;
    if (list) {
      const box = list.getBoundingClientRect();
      if (event.clientY < box.top + 32) list.scrollBy(0, -16);
      if (event.clientY > box.bottom - 32) list.scrollBy(0, 16);
    }
  }
  function endDrag() {
    drag.current = null;
    setDragging(null);
  }
  async function save() {
    if (saving.current || !changed) return;
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      await api(`/classrooms/${classroom.id}/chapters/order`, {
        chapterIds: ids,
      });
      await onSaved();
      onClose();
    } catch (problem) {
      setError(errorMessage(problem));
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  return (
    <Modal
      title="Sắp xếp chương"
      onClose={onClose}
      dismissible={!busy}
      className="chapter-sort-modal"
    >
      <p className="form-intro">
        Kéo tay cầm để đổi thứ tự chương, hoặc dùng nút lên/xuống. Bấm Lưu thứ
        tự để áp dụng.
      </p>
      <ol
        ref={listRef}
        className={`chapter-sort-list ${dragging ? "is-dragging" : ""}`}
        aria-label="Thứ tự chương"
        onPointerMove={pointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
      >
        {ids.map((id, index) => (
          <li
            key={id}
            data-sort-chapter={id}
            className={dragging === id ? "dragging" : ""}
          >
            <button
              type="button"
              className="chapter-drag-handle"
              disabled={busy}
              aria-label={`Kéo sắp xếp · ${chapters.get(id)?.title}`}
              title="Kéo để đổi thứ tự; phím mũi tên lên/xuống"
              onPointerDown={(event) => {
                if (event.button !== 0 || saving.current || drag.current)
                  return;
                event.currentTarget.focus();
                listRef.current?.setPointerCapture(event.pointerId);
                drag.current = { id, pointerId: event.pointerId };
                setDragging(id);
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                  event.preventDefault();
                  move(id, index + (event.key === "ArrowUp" ? -1 : 1));
                }
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                {[6, 12, 18].flatMap((y) =>
                  [8, 16].map((x) => (
                    <circle key={`${x}-${y}`} cx={x} cy={y} r="1.8" />
                  )),
                )}
              </svg>
            </button>
            <span className="chapter-sort-number" aria-hidden="true">
              {index + 1}
            </span>
            <strong inert={dragging === id}>{chapters.get(id)?.title}</strong>
            <div className="chapter-sort-arrows">
              <button
                type="button"
                className="button outline small"
                disabled={busy || !!dragging || index === 0}
                aria-label={`Lên · ${chapters.get(id)?.title}`}
                onClick={() => move(id, index - 1)}
              >
                ↑
              </button>
              <button
                type="button"
                className="button outline small"
                disabled={busy || !!dragging || index === ids.length - 1}
                aria-label={`Xuống · ${chapters.get(id)?.title}`}
                onClick={() => move(id, index + 1)}
              >
                ↓
              </button>
            </div>
          </li>
        ))}
      </ol>
      <p className="chapter-sort-status" role="status">
        {announcement}
      </p>
      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}
      <div className="modal-actions">
        <button
          type="button"
          className="button outline"
          disabled={busy}
          onClick={onClose}
        >
          Hủy
        </button>
        <button
          type="button"
          className="button primary"
          disabled={busy || !changed || !!dragging}
          onClick={() => void save()}
        >
          {busy ? "Đang lưu…" : "Lưu thứ tự"}
        </button>
      </div>
    </Modal>
  );
}
