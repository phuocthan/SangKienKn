const ns = "http://schemas.openxmlformats.org/officeDocument/2006/math";
const kids = (e: Element) =>
  Array.from(e.childNodes).filter((n): n is Element => n.nodeType === 1);
const child = (e: Element, name: string) =>
  kids(e).find((n) => n.namespaceURI === ns && n.localName === name);
const escape = (s: string) =>
  s.replace(/[\\{}%&#_$^]/g, (c) => (c === "\\" ? "\\backslash " : `\\${c}`));
const literal = (s: string) => {
  const value = escape(s);
  // Vietnamese labels such as đ/động are text, not mathematical variables.
  return /[\u00c0-\u024f\u1e00-\u1eff]/u.test(s) ? `\\text{${value}}` : value;
};
const unsupported = () =>
  new Error(
    "Công thức Word này chưa được hỗ trợ. Hãy dùng bộ soạn công thức hoặc dán mã LaTeX thay cho công thức nhúng.",
  );

export function wordMathLatex(e: Element): string {
  const tag = e.localName;
  const all = () => kids(e).map(wordMathLatex).join("");
  const part = (name: string) => {
    const n = child(e, name);
    return n ? wordMathLatex(n) : "";
  };
  const property = (group: string, name: string, fallback: string) => {
    const prop = child(e, group),
      entry = prop && child(prop, name);
    return entry?.getAttributeNS(ns, "val") ?? fallback;
  };
  if (tag.endsWith("Pr")) return "";
  if (tag === "t") return literal(e.textContent ?? "");
  if (["sSub", "sSup", "sSubSup"].includes(tag))
    return `{${part("e")}}${tag !== "sSup" ? `_{${part("sub")}}` : ""}${tag !== "sSub" ? `^{${part("sup")}}` : ""}`;
  if (tag === "f") {
    if (!child(e, "num") || !child(e, "den")) throw unsupported();
    return `\\frac{${part("num")}}{${part("den")}}`;
  }
  if (tag === "rad")
    return `\\sqrt${part("deg") ? `[${part("deg")}]` : ""}{${part("e")}}`;
  if (tag === "nary") {
    const sign = property("naryPr", "chr", "∫"),
      op = (
        {
          "∑": "\\sum",
          "∏": "\\prod",
          "∫": "\\int",
          "∮": "\\oint",
          "⋃": "\\bigcup",
          "⋂": "\\bigcap",
        } as Record<string, string>
      )[sign];
    if (!op) throw unsupported();
    return `${op}${part("sub") ? `_{${part("sub")}}` : ""}${part("sup") ? `^{${part("sup")}}` : ""}{${part("e")}}`;
  }
  if (tag === "d") {
    const fence = (s: string) =>
      s === "{" || s === "}"
        ? `\\${s}`
        : s === ""
          ? "."
          : [
                "(",
                ")",
                "[",
                "]",
                "|",
                "‖",
                "⌊",
                "⌋",
                "⌈",
                "⌉",
                "⟨",
                "⟩",
              ].includes(s)
            ? s
            : (() => {
                throw unsupported();
              })();
    return `\\left${fence(property("dPr", "begChr", "("))}${kids(e)
      .filter((n) => n.localName === "e")
      .map(wordMathLatex)
      .join(
        property("dPr", "sepChr", "|"),
      )}\\right${fence(property("dPr", "endChr", ")"))}`;
  }
  if (tag === "func") {
    const name = part("fName");
    return `${/^(sin|cos|tan|cot|log|ln|exp|lim|max|min)$/.test(name) ? `\\${name}` : `\\operatorname{${name}}`}{${part("e")}}`;
  }
  if (tag === "acc") {
    const op = (
      {
        "̂": "hat",
        ˆ: "hat",
        "⃗": "vec",
        "→": "vec",
        "̇": "dot",
        "̈": "ddot",
        "̃": "tilde",
        "¯": "bar",
        "̅": "bar",
      } as Record<string, string>
    )[property("accPr", "chr", "̂")];
    if (!op) throw unsupported();
    return `\\${op}{${part("e")}}`;
  }
  if (tag === "bar")
    return `\\${property("barPr", "pos", "top") === "bot" ? "underline" : "overline"}{${part("e")}}`;
  if (tag === "limLow" || tag === "limUpp")
    return `\\${tag === "limLow" ? "underset" : "overset"}{${part("lim")}}{${part("e")}}`;
  if (tag === "m")
    return `\\begin{matrix}${kids(e)
      .filter((n) => n.localName === "mr")
      .map(wordMathLatex)
      .join("\\\\")}\\end{matrix}`;
  if (tag === "mr")
    return kids(e)
      .filter((n) => n.localName === "e")
      .map(wordMathLatex)
      .join("&");
  if (tag === "eqArr")
    return `\\begin{gathered}${kids(e)
      .filter((n) => n.localName === "e")
      .map(wordMathLatex)
      .join("\\\\")}\\end{gathered}`;
  if (["sPre", "groupChr", "borderBox", "box", "phant"].includes(tag))
    throw unsupported();
  if (e.namespaceURI !== ns && tag !== "t") return "";
  return all();
}

export function complexWordMath(e: Element) {
  return [
    "f",
    "rad",
    "nary",
    "d",
    "func",
    "acc",
    "bar",
    "limLow",
    "limUpp",
    "m",
    "eqArr",
    "sPre",
    "groupChr",
    "borderBox",
    "box",
    "phant",
  ].some((tag) => e.getElementsByTagNameNS(ns, tag).length > 0);
}
