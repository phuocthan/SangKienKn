import type { ReactNode } from "react";
import { formulaSegments } from "../shared/formula-text";
import { renderFormula } from "./formula-render";

// Only KaTeX's bounded, untrusted renderer produces markup. Ordinary question
// text (including pasted HTML-looking strings) always stays escaped React text.
export function QuestionText({ children }: { children?: string }) {
  const parts: ReactNode[] = formulaSegments(children ?? "").map((part) => {
    if (part.kind === "text") return part.value;
    if (part.kind === "sub")
      return (
        <sub key={part.start}>
          <QuestionText>{part.value}</QuestionText>
        </sub>
      );
    if (part.kind === "sup")
      return (
        <sup key={part.start}>
          <QuestionText>{part.value}</QuestionText>
        </sup>
      );
    const result = renderFormula(part.value, part.display);
    return result.error ? (
      <span
        key={part.start}
        className="formula-invalid"
        title={result.error}
      >{`\\(${part.value}\\)`}</span>
    ) : (
      <span
        key={part.start}
        className={`question-formula${part.display ? " formula-display" : ""}`}
        translate="no"
        dangerouslySetInnerHTML={{ __html: result.html }}
      />
    );
  });
  return <>{parts}</>;
}
