export type FormulaSegment = {
  kind: "text" | "sub" | "sup" | "math";
  value: string;
  start: number;
  end: number;
  display?: boolean;
};

// Keep the original text and offsets: editing/copying never flattens a formula.
export function formulaSegments(source: string): FormulaSegment[] {
  const result: FormulaSegment[] = [];
  let i = 0,
    plain = 0;
  const add = (segment: FormulaSegment) => {
    if (plain < segment.start)
      result.push({
        kind: "text",
        value: source.slice(plain, segment.start),
        start: plain,
        end: segment.start,
      });
    result.push(segment);
    i = plain = segment.end;
  };
  while (i < source.length) {
    const delimiter = source.startsWith("\\(", i)
      ? ["\\(", "\\)"]
      : source.startsWith("\\[", i)
        ? ["\\[", "\\]"]
        : source.startsWith("$$", i)
          ? ["$$", "$$"]
          : source[i] === "$" && source[i - 1] !== "\\"
            ? ["$", "$"]
            : null;
    if (delimiter) {
      const close = source.indexOf(delimiter[1], i + delimiter[0].length);
      if (close > i + delimiter[0].length) {
        add({
          kind: "math",
          value: source.slice(i + delimiter[0].length, close),
          start: i,
          end: close + delimiter[1].length,
          display: delimiter[0] === "\\[" || delimiter[0] === "$$",
        });
        continue;
      }
    }
    if ((source[i] === "_" || source[i] === "^") && source[i - 1] !== "\\") {
      const start = i;
      let end = i + 1,
        value = "";
      if (source[end] === "{") {
        let depth = 1;
        const first = ++end;
        while (end < source.length && depth && source[end] !== "\n") {
          if (source[end - 1] !== "\\") {
            if (source[end] === "{") depth++;
            if (source[end] === "}") depth--;
          }
          if (depth) end++;
        }
        if (depth === 0) {
          value = source.slice(first, end);
          end++;
        }
      } else {
        const match = /^(?:[+-]?\d+|[\p{L}])/u.exec(source.slice(end));
        if (match) {
          value = match[0];
          end += value.length;
        }
      }
      if (value) {
        add({ kind: source[start] === "_" ? "sub" : "sup", value, start, end });
        continue;
      }
    }
    i++;
  }
  if (plain < source.length || !result.length)
    result.push({
      kind: "text",
      value: source.slice(plain),
      start: plain,
      end: source.length,
    });
  return result;
}

export const wrapFormula = (latex: string) => `\\(${latex.trim()}\\)`;
export function unwrapFormula(value: string) {
  const segments = formulaSegments(value.trim());
  return segments.length === 1 && segments[0].kind === "math"
    ? segments[0].value
    : value.trim();
}
