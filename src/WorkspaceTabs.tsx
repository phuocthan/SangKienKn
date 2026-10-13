import {
  useLayoutEffect,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import type { LucideIcon } from "lucide-react";

export type WorkspaceTab<T extends string> = {
  id: T;
  label: string;
  icon: LucideIcon;
};

export function WorkspaceContent<T extends string>({
  children,
  tabs,
  page,
  onNavigate,
}: {
  children: ReactNode;
  tabs?: { label: string; items: WorkspaceTab<T>[] };
  page: T;
  onNavigate: (page: T) => void;
}) {
  const mainRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (!tabs) return;
    const header = document.querySelector<HTMLElement>(".workspace-topbar");
    const main = mainRef.current;
    if (!header || !main) return;
    const updateOffset = () => {
      main.style.setProperty(
        "--workspace-sticky-offset",
        `${header.getBoundingClientRect().height}px`,
      );
    };
    updateOffset();
    const observer = new ResizeObserver(updateOffset);
    observer.observe(header);
    return () => observer.disconnect();
  }, [tabs?.label]);

  return (
    <main className="main-content" ref={mainRef}>
      {tabs && (
        <WorkspaceTabs
          label={tabs.label}
          items={tabs.items}
          page={page}
          onNavigate={onNavigate}
        />
      )}
      <div
        id="workspace-tab-panel"
        role={tabs ? "tabpanel" : undefined}
        aria-labelledby={tabs ? `workspace-tab-${page}` : undefined}
      >
        {children}
      </div>
    </main>
  );
}

export function WorkspaceTabs<T extends string>({
  label,
  items,
  page,
  onNavigate,
}: {
  label: string;
  items: WorkspaceTab<T>[];
  page: T;
  onNavigate: (page: T) => void;
}) {
  function move(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next =
      event.key === "ArrowRight"
        ? (index + 1) % items.length
        : event.key === "ArrowLeft"
          ? (index + items.length - 1) % items.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? items.length - 1
              : null;
    if (next === null) return;
    event.preventDefault();
    onNavigate(items[next].id);
    const buttons =
      event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
        '[role="tab"]',
      );
    buttons?.[next]?.focus();
  }
  return (
    <div className="workspace-tabs" role="tablist" aria-label={label}>
      {items.map((item, index) => (
        <button
          type="button"
          role="tab"
          id={`workspace-tab-${item.id}`}
          key={item.id}
          aria-selected={page === item.id}
          aria-controls="workspace-tab-panel"
          tabIndex={page === item.id ? 0 : -1}
          onClick={() => onNavigate(item.id)}
          onKeyDown={(event) => move(event, index)}
        >
          <item.icon size={18} aria-hidden="true" />
          {item.label}
        </button>
      ))}
    </div>
  );
}
