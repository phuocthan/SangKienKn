import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

const desktopQuery =
  "(min-width: 1101px), (min-width: 701px) and (orientation: landscape)";
const HeadingContext = createContext<{
  target: HTMLDivElement | null;
  setTarget: (target: HTMLDivElement | null) => void;
  desktop: boolean;
} | null>(null);

export function WorkspaceFrame({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<HTMLDivElement | null>(null);
  const [desktop, setDesktop] = useState(
    () => window.matchMedia(desktopQuery).matches,
  );
  useEffect(() => {
    const media = window.matchMedia(desktopQuery);
    const update = () => setDesktop(media.matches);
    media.addEventListener("change", update);
    update();
    return () => media.removeEventListener("change", update);
  }, []);
  return (
    <HeadingContext.Provider value={{ target, setTarget, desktop }}>
      <div className="main-shell">{children}</div>
    </HeadingContext.Provider>
  );
}

export function WorkspaceHeadingSlot() {
  const context = useContext(HeadingContext);
  return <div className="workspace-heading-slot" ref={context?.setTarget} />;
}

export function WorkspaceHeading({
  children,
  className = "page-heading",
}: {
  children: ReactNode;
  className?: string;
}) {
  const context = useContext(HeadingContext);
  const heading = <div className={className}>{children}</div>;
  return context?.desktop && context.target
    ? createPortal(heading, context.target)
    : heading;
}
