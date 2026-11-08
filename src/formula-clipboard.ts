import { wrapFormula } from "../shared/formula-text";

const elements = (node: Element) =>
  Array.from(node.childNodes).filter((n): n is Element => n.nodeType === 1);
const escapeLatex = (value: string) =>
  value.replace(/[\\{}%&#_$^]/g, (c) =>
    c === "\\" ? "\\backslash " : `\\${c}`,
  );

export function mathmlToLatex(node: Element): string {
  const children = elements(node),
    values = children.map(mathmlToLatex);
  const group = (i: number) => `{${values[i] ?? ""}}`;
  switch (node.localName) {
    case "annotation":
    case "annotation-xml":
      return "";
    case "math":
    case "semantics":
    case "mrow":
    case "mstyle":
    case "mpadded":
      return values.join("");
    case "mi":
    case "mn":
    case "mo":
      return escapeLatex(node.textContent ?? "")
        .replaceAll("−", "-")
        .replaceAll("⁡", "");
    case "mtext":
      return `\\text{${escapeLatex(node.textContent ?? "")}}`;
    case "msub":
      return `${group(0)}_${group(1)}`;
    case "msup":
      return `${group(0)}^${group(1)}`;
    case "msubsup":
      return `${group(0)}_${group(1)}^${group(2)}`;
    case "mfrac":
      return `\\frac${group(0)}${group(1)}`;
    case "msqrt":
      return `\\sqrt{${values.join("")}}`;
    case "mroot":
      return `\\sqrt[${values[1] ?? ""}]${group(0)}`;
    case "mspace":
      return "\\,";
    case "munder":
      return `\\underset${group(1)}${group(0)}`;
    case "mover":
      return `\\overset${group(1)}${group(0)}`;
    case "munderover":
      return `\\overset${group(2)}{\\underset${group(1)}${group(0)}}`;
    case "mtable":
      return `\\begin{matrix}${values.join("\\\\")}\\end{matrix}`;
    case "mtr":
      return values.join("&");
    case "mtd":
      return values.join("");
    case "mfenced":
      return `${escapeLatex(node.getAttribute("open") ?? "(")}${values.join(node.getAttribute("separators") ?? ",")}${escapeLatex(node.getAttribute("close") ?? ")")}`;
    default:
      throw new Error(
        "Cấu trúc MathML này chưa được hỗ trợ. Hãy dán mã LaTeX của công thức.",
      );
  }
}

export function formattedHtmlText(html: string): string | null {
  const doc = new DOMParser().parseFromString(html, "text/html");
  let formatted = false;
  function text(node: Node): string {
    if (node.nodeType === 3) return node.textContent ?? "";
    if (node.nodeType !== 1) return "";
    const el = node as Element,
      tag = el.localName.toLowerCase();
    if (["script", "style", "iframe", "object", "noscript"].includes(tag))
      return "";
    const math =
      tag === "math"
        ? el
        : el.classList.contains("katex")
          ? el.querySelector("math")
          : null;
    if (math) {
      formatted = true;
      const annotation = Array.from(
        math.getElementsByTagName("annotation"),
      ).find((a) => /(?:x-tex|latex)/i.test(a.getAttribute("encoding") ?? ""));
      return wrapFormula(annotation?.textContent ?? mathmlToLatex(math));
    }
    const value = Array.from(el.childNodes).map(text).join("");
    const style = el.getAttribute("style") ?? "";
    if (
      tag === "sub" ||
      /vertical-align\s*:\s*sub\b|mso-text-raise\s*:\s*-/i.test(style)
    ) {
      formatted = true;
      return `_{${value}}`;
    }
    if (tag === "sup" || /vertical-align\s*:\s*super\b/i.test(style)) {
      formatted = true;
      return `^{${value}}`;
    }
    if (tag === "br") return "\n";
    return ["p", "div", "li", "tr"].includes(tag) ? value + "\n" : value;
  }
  const value = text(doc.body)
    .replace(/\u00a0/g, " ")
    .trimEnd();
  return formatted ? value : null;
}

export function formattedClipboard(data: Pick<DataTransfer, "getData">) {
  const latex = data.getData("application/x-latex");
  if (latex) return wrapFormula(latex);
  const html = data.getData("text/html");
  return html ? formattedHtmlText(html) : null;
}
