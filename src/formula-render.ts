import katex from "katex";

export function renderFormula(
  latex: string,
  displayMode = false,
  mathml = false,
) {
  try {
    if (latex.length > 3000) throw new Error("Công thức tối đa 3000 ký tự.");
    return {
      html: katex.renderToString(latex, {
        displayMode,
        throwOnError: true,
        strict: "ignore",
        trust: false,
        maxSize: 12,
        maxExpand: 200,
        output: mathml ? "mathml" : "htmlAndMathml",
      }),
      error: "",
    };
  } catch {
    return {
      html: "",
      error:
        "Công thức chưa hợp lệ hoặc có lệnh chưa hỗ trợ. Kiểm tra lại dấu ngoặc và ký hiệu.",
    };
  }
}
