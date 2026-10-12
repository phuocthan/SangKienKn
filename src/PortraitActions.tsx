import { LogOut, MessageSquare, Settings } from "lucide-react";
import { ForestIcon } from "./components";

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
          <ForestIcon compact>
            <MessageSquare size={20} />
          </ForestIcon>
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
        <ForestIcon compact>
          <Settings size={20} />
        </ForestIcon>
      </button>
      <button
        type="button"
        className="icon-button"
        aria-label="Đăng xuất"
        title="Đăng xuất"
        onClick={onLogout}
      >
        <ForestIcon compact>
          <LogOut size={20} />
        </ForestIcon>
      </button>
    </div>
  );
}
