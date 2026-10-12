import { useEffect, useId, useState } from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { ForestIcon } from "./components";
import "./sidebar-navigation.css";

const compactQuery =
  "(max-width: 700px), (max-width: 1100px) and (orientation: portrait)";

export type NavigationItem<T extends string> = {
  id: T;
  label: string;
  icon: LucideIcon;
  count?: number;
};

export type NavigationGroup<T extends string> = {
  id: string;
  label: string;
  icon: LucideIcon;
  pages: T[];
};

export function SidebarNavigation<T extends string>({
  items,
  groups,
  page,
  onNavigate,
}: {
  items: NavigationItem<T>[];
  groups: NavigationGroup<T>[];
  page: T;
  onNavigate: (page: T) => void;
}) {
  const id = useId();
  const activeGroup = groups.find((group) => group.pages.includes(page))?.id;
  const [expanded, setExpanded] = useState<string | undefined>(activeGroup);
  const [compact, setCompact] = useState(
    () => window.matchMedia(compactQuery).matches,
  );
  useEffect(() => setExpanded(activeGroup), [page, activeGroup]);
  useEffect(() => {
    const media = window.matchMedia(compactQuery);
    const update = () => setCompact(media.matches);
    media.addEventListener("change", update);
    update();
    return () => media.removeEventListener("change", update);
  }, []);

  function destination(item: NavigationItem<T>, submenu = false) {
    return (
      <button
        key={item.id}
        type="button"
        className={`nav-item ${submenu ? "nav-subitem" : ""} ${page === item.id ? "active" : ""}`}
        aria-current={page === item.id ? "page" : undefined}
        onClick={() => onNavigate(item.id)}
      >
        {submenu ? (
          <span className="nav-subitem-dot" aria-hidden="true" />
        ) : (
          <ForestIcon compact>
            <item.icon size={20} />
          </ForestIcon>
        )}
        <span>{item.label}</span>
        {!!item.count && <span className="nav-count">{item.count}</span>}
      </button>
    );
  }

  return (
    <nav
      aria-label="Điều hướng chính"
      className={compact ? "nav-compact" : "nav-grouped"}
    >
      {compact ? (
        items.map((item) => destination(item))
      ) : (
        <>
          {items
            .filter(
              (item) => !groups.some((group) => group.pages.includes(item.id)),
            )
            .map((item) => destination(item))}
          {groups.map((group, index) => {
            const children = group.pages
              .map((key) => items.find((item) => item.id === key))
              .filter((item): item is NavigationItem<T> => !!item);
            const open = expanded === group.id;
            const count = children.reduce(
              (sum, item) => sum + (item.count ?? 0),
              0,
            );
            return (
              <div
                key={group.id}
                className={`nav-group ${activeGroup === group.id ? "has-current" : ""}`}
                data-tone={index % 4}
                onKeyDown={(event) => {
                  if (event.key === "Escape" && open) {
                    event.preventDefault();
                    event.stopPropagation();
                    setExpanded(undefined);
                    event.currentTarget
                      .querySelector<HTMLButtonElement>(".nav-group-trigger")
                      ?.focus();
                  }
                }}
              >
                <button
                  type="button"
                  className="nav-item nav-group-trigger"
                  aria-expanded={open}
                  aria-controls={`${id}-${group.id}`}
                  onClick={() => setExpanded(open ? undefined : group.id)}
                >
                  <ForestIcon compact>
                    <group.icon size={20} />
                  </ForestIcon>
                  <span className="nav-group-label">{group.label}</span>
                  {!!count && <span className="nav-count">{count}</span>}
                  <ChevronDown
                    className="nav-group-chevron"
                    size={15}
                    aria-hidden="true"
                  />
                </button>
                <div
                  id={`${id}-${group.id}`}
                  className="nav-submenu"
                  hidden={!open}
                >
                  {children.map((item) => destination(item, true))}
                </div>
              </div>
            );
          })}
        </>
      )}
    </nav>
  );
}
