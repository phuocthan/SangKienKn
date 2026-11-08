import {
  parseQuestionWordText,
  readWordDocument,
} from "../shared/word-questions";
import { complexWordMath, wordMathLatex } from "./word-math";
import { wrapFormula } from "../shared/formula-text";

const wordNamespace =
  "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const mathNamespace =
  "http://schemas.openxmlformats.org/officeDocument/2006/math";

export function parseWordFile(data: Uint8Array) {
  const xml = readWordDocument(data);
  if (/<!DOCTYPE|<!ENTITY/i.test(xml))
    throw new Error(
      "Cấu trúc XML của file Word không được hỗ trợ. Hãy dùng file mẫu.",
    );
  const document = new DOMParser().parseFromString(xml, "application/xml");
  const body = document.getElementsByTagNameNS(wordNamespace, "body")[0];
  if (document.getElementsByTagName("parsererror").length || !body)
    throw new Error("Nội dung Word không hợp lệ. Hãy lưu lại file .docx.");
  if (
    ["drawing", "pict", "object", "altChunk", "txbxContent"].some(
      (tag) => body.getElementsByTagNameNS(wordNamespace, tag).length,
    )
  )
    throw new Error(
      "File có hình ảnh hoặc đối tượng nhúng chưa đọc được (ví dụ MathType dạng ảnh/OLE). Hãy chuyển sang Equation của Word hoặc dùng bộ soạn công thức rồi dán mã vào đề.",
    );
  if (
    ["ins", "del", "moveFrom", "moveTo"].some(
      (tag) => body.getElementsByTagNameNS(wordNamespace, tag).length,
    )
  )
    throw new Error(
      "File còn Track Changes. Hãy chấp nhận hoặc từ chối các chỉnh sửa trong Word trước khi nhập.",
    );
  function text(node: Element): string {
    const children = () =>
      Array.from(node.childNodes)
        .filter((child) => child.nodeType === 1)
        .map((child) => text(child as Element))
        .join("");
    if (node.namespaceURI === mathNamespace) {
      if (node.localName === "oMath" && complexWordMath(node))
        return wrapFormula(wordMathLatex(node));
      if (node.localName === "t") return node.textContent ?? "";
      if (["sSup", "sSub", "sSubSup"].includes(node.localName)) {
        const part = (name: string) => {
          const child = Array.from(node.childNodes).find(
            (child) =>
              child.nodeType === 1 && (child as Element).localName === name,
          );
          return child ? text(child as Element) : "";
        };
        const sub = part("sub"),
          sup = part("sup");
        return part("e") + (sub ? `_{${sub}}` : "") + (sup ? `^{${sup}}` : "");
      }
      if (
        [
          "f",
          "rad",
          "nary",
          "m",
          "limLow",
          "limUpp",
          "d",
          "eqArr",
          "func",
          "acc",
          "bar",
          "groupChr",
          "sPre",
        ].includes(node.localName)
      )
        throw new Error(
          "Công thức Word này chưa được hỗ trợ. Hiện đọc được chỉ số trên/dưới; hãy đổi công thức phức tạp sang văn bản trước khi nhập.",
        );
      if (node.localName.endsWith("Pr")) return "";
    }
    if (node.namespaceURI === wordNamespace) {
      if (node.localName === "t") return node.textContent ?? "";
      if (node.localName === "br" || node.localName === "cr") return "\n";
      if (node.localName === "tab") return " ";
      if (node.localName === "rPr") return "";
      if (node.localName === "r") {
        const value = children();
        const align = node.getElementsByTagNameNS(
          wordNamespace,
          "vertAlign",
        )[0];
        const kind = align?.getAttributeNS(wordNamespace, "val");
        const position = node.getElementsByTagNameNS(
          wordNamespace,
          "position",
        )[0];
        const offset = Number(
          position?.getAttributeNS(wordNamespace, "val") ?? 0,
        );
        return kind === "superscript"
          ? `^{${value}}`
          : kind === "subscript" || (!kind && offset < 0)
            ? `_{${value}}`
            : !kind && offset > 0
              ? `^{${value}}`
              : value;
      }
    }
    return children();
  }
  const paragraphs = Array.from(
    body.getElementsByTagNameNS(wordNamespace, "p"),
  );
  return parseQuestionWordText(paragraphs.map(text).join("\n"));
}
