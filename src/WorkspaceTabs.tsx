import {
  useLayoutEffect,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import type { AppIcon } from "./icons";

export type WorkspaceTab<T extends string> = {
  id: T;
  label: string;
  icon: AppIcon;
  count?: number;
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
    const header = document.querySelector<HTMLElement>(".workspace-topbar");
    const main = mainRef.current;
    if (!header || !main) return;
    const submenu = main.querySelector<HTMLElement>(".workspace-tabs");
    const dock = document.querySelector<HTMLElement>(".sidebar");
    const root = document.documentElement;
    const updateOffset = () => {
      root.style.setProperty(
        "--workspace-sticky-offset",
        `${header.getBoundingClientRect().height}px`,
      );
      root.style.setProperty(
        "--workspace-submenu-height",
        `${submenu?.getBoundingClientRect().height ?? 0}px`,
      );
      root.style.setProperty(
        "--workspace-dock-height",
        `${dock?.getBoundingClientRect().height ?? 88}px`,
      );
    };
    updateOffset();
    const observer = new ResizeObserver(updateOffset);
    observer.observe(header);
    if (submenu) observer.observe(submenu);
    if (dock) observer.observe(dock);
    window.addEventListener("resize", updateOffset);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateOffset);
    };
  }, [tabs?.label]);

  return (
    <main
      className={`main-content ${tabs ? "has-submenu" : ""}`}
      id="workspace-content"
      tabIndex={-1}
      ref={mainRef}
    >
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
  const listRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const list = listRef.current;
    const active = list?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (list && active)
      list.scrollTo({
        left: active.offsetLeft - (list.clientWidth - active.clientWidth) / 2,
        behavior: "instant",
      });
  }, [page]);
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
    <div
      ref={listRef}
      className="workspace-tabs"
      role="tablist"
      aria-label={label}
    >
      {items.map((item, index) => (
        <button
          type="button"
          role="tab"
          aria-label={item.label}
          title={item.label}
          id={`workspace-tab-${item.id}`}
          key={item.id}
          aria-selected={page === item.id}
          aria-controls="workspace-tab-panel"
          tabIndex={page === item.id ? 0 : -1}
          onClick={() => onNavigate(item.id)}
          onKeyDown={(event) => move(event, index)}
        >
          <item.icon size={18} aria-hidden="true" />
          <span className="workspace-tab-label">{item.label}</span>
          {!!item.count && (
            <span className="workspace-tab-count" aria-hidden="true">
              {item.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
