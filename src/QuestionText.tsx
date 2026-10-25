import type { ReactNode } from "react";

// Render only the two supported script markers; all other content remains
// escaped React text, including anything that looks like HTML.
export function QuestionText({ children }: { children?: string }) {
  const source = children ?? "";
  const parts: ReactNode[] = [];
  const pattern = /([_^])(?:\{([^{}\n]+)\}|([+-]?\d+))/g;
  let cursor = 0;
  for (const match of source.matchAll(pattern)) {
    parts.push(source.slice(cursor, match.index));
    const value = match[2] ?? match[3];
    parts.push(
      match[1] === "^" ? (
        <sup key={match.index}>{value}</sup>
      ) : (
        <sub key={match.index}>{value}</sub>
      ),
    );
    cursor = match.index + match[0].length;
  }
  parts.push(source.slice(cursor));
  return <>{parts}</>;
}
