import { useEffect, useState } from "react";
import { CheckCircle2, X } from "./icons";

export function MotionToast({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  const [displayed, setDisplayed] = useState(message);
  useEffect(() => {
    if (message) {
      setDisplayed(message);
      return;
    }
    const timer = setTimeout(() => setDisplayed(""), 160);
    return () => clearTimeout(timer);
  }, [message]);
  if (!displayed) return null;
  return (
    <div className="toast motion-toast" data-open={!!message} inert={!message}>
      <CheckCircle2 size={18} aria-hidden="true" />
      <span role="status" aria-live={message ? "polite" : "off"}>
        {message || displayed}
      </span>
      <button
        className="icon-button"
        aria-label="Đóng thông báo"
        onClick={onClose}
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
