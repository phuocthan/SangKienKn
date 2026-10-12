import { LogOut, MessageSquare, Settings } from "lucide-react";

export function PortraitActions({
  page,
  feedbackLabel,
  onFeedback,
  onAccount,
  onLogout,
}: {
  page: string;
  feedbackLabel?: string;
  onFeedback?: () => void;
  onAccount: () => void;
  onLogout: () => void;
}) {
  return (
    <div
      className="portrait-actions"
      role="group"
      aria-label="Thao tác tài khoản"
    >
      {onFeedback && feedbackLabel && (
        <button
          type="button"
          className={`icon-button ${page === "feedback" ? "active" : ""}`}
          aria-label={feedbackLabel}
          title={feedbackLabel}
          aria-current={page === "feedback" ? "page" : undefined}
          onClick={onFeedback}
        >
          <MessageSquare size={20} aria-hidden="true" />
        </button>
      )}
      <button
        type="button"
        className={`icon-button ${page === "settings" ? "active" : ""}`}
        aria-label="Tài khoản"
        title="Tài khoản"
        aria-current={page === "settings" ? "page" : undefined}
        onClick={onAccount}
      >
        <Settings size={20} aria-hidden="true" />
      </button>
      <button
        type="button"
        className="icon-button"
        aria-label="Đăng xuất"
        title="Đăng xuất"
        onClick={onLogout}
      >
        <LogOut size={20} aria-hidden="true" />
      </button>
    </div>
  );
}
