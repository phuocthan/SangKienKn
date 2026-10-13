import type { LucideIcon } from "lucide-react";

export type NavigationItem<T extends string> = {
  id: T;
  label: string;
  icon: LucideIcon;
  count?: number;
};

export function SidebarNavigation<T extends string>({
  items,
  page,
  onNavigate,
}: {
  items: NavigationItem<T>[];
  page: T;
  onNavigate: (page: T) => void;
}) {
  return (
    <nav aria-label="Điều hướng chính">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`nav-item ${page === item.id ? "active" : ""}`}
          aria-label={item.label}
          aria-current={page === item.id ? "page" : undefined}
          onClick={() => onNavigate(item.id)}
        >
          <item.icon size={20} aria-hidden="true" />
          <span className="nav-label">{item.label}</span>
          {!!item.count && <span className="nav-count">{item.count}</span>}
        </button>
      ))}
    </nav>
  );
}
