import { useRef, useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { errorMessage } from "./api";
import "./conversation.css";

export const conversationDate = (timestamp: number) =>
  new Date(timestamp).toLocaleString("vi-VN");
export function MessageComposer({
  label,
  submitLabel,
  onSend,
  disabled = false,
}: {
  label: string;
  submitLabel: string;
  disabled?: boolean;
  onSend: (body: string, requestId: string) => Promise<void>;
}) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const request = useRef(crypto.randomUUID());
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || disabled) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await onSend(body.trim(), request.current);
      setBody("");
      request.current = crypto.randomUUID();
      setNotice("Đã gửi.");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="message-composer" onSubmit={submit}>
      <label>
        {label}
        <textarea
          required
          maxLength={5000}
          rows={4}
          value={body}
          disabled={busy || disabled}
          onChange={(event) => {
            setBody(event.target.value);
            request.current = crypto.randomUUID();
            setNotice("");
          }}
        />
      </label>
      {error && (
        <p className="error-banner" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="subtle-note" role="status">
          {notice}
        </p>
      )}
      <button
        className="button primary"
        disabled={busy || disabled || !body.trim()}
      >
        <Send size={16} />
        {busy ? "Đang gửi…" : submitLabel}
      </button>
    </form>
  );
}
