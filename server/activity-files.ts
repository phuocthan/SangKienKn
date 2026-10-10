import { DOMParser, type Element, type Node as XmlNode } from "@xmldom/xmldom";
import { Unzip } from "fflate";
import { readWordDocument } from "../shared/word-questions.js";

const mimeTypes: Record<string, string> = {
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pdf: "application/pdf",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

export function validateActivityFile(
  file: Express.Multer.File,
  requirement = false,
) {
  let name = file.originalname;
  if (Array.from(name).every((char) => char.charCodeAt(0) <= 255)) {
    const decoded = Buffer.from(name, "latin1").toString("utf8");
    if (!decoded.includes("\uFFFD")) name = decoded;
  }
  const filename = (name.split(/[\\/]/).at(-1) ?? "")
    .normalize("NFC")
    .replace(/[\x00-\x1f\x7f]/g, "")
    .trim();
  if (!filename || filename.length > 180)
    throw new Error("Tên file cần từ 1 đến 180 ký tự.");
  const extension = filename.split(".").at(-1)!.toLowerCase();
  if (requirement && extension !== "docx")
    throw new Error(
      "Yêu cầu Word cần file .docx. Với .doc, chọn Save As → Word Document (.docx).",
    );
  if (!mimeTypes[extension])
    throw new Error(
      "Sản phẩm cần là Word (.doc/.docx), PDF hoặc PowerPoint (.ppt/.pptx).",
    );
  if (
    !file.buffer.length ||
    file.buffer.length > (requirement ? 5 : 10) * 1024 * 1024
  )
    throw new Error(
      `File cần có nội dung và không vượt quá ${requirement ? 5 : 10} MB.`,
    );
  const data = file.buffer;
  if (extension === "pdf") {
    if (data.subarray(0, 5).toString() !== "%PDF-")
      throw new Error("Nội dung file không đúng định dạng PDF.");
  } else if (extension === "doc" || extension === "ppt") {
    if (!data.subarray(0, 8).equals(Buffer.from("d0cf11e0a1b11ae1", "hex")))
      throw new Error("Nội dung file không đúng định dạng Office cũ.");
  } else {
    let found = false;
    const required =
      extension === "docx" ? "word/document.xml" : "ppt/presentation.xml";
    const archive = new Unzip((entry) => {
      if (entry.name === required) found = true;
    });
    try {
      archive.push(data, true);
    } catch {
      throw new Error("File Office bị hỏng. Hãy lưu lại file trước khi nộp.");
    }
    if (!found)
      throw new Error("Nội dung file không đúng định dạng Office đã chọn.");
  }
  return { filename, mime: mimeTypes[extension], size: data.length };
}

export function requirementWordText(data: Uint8Array): string {
  const xml = readWordDocument(data);
  if (/<!DOCTYPE|<!ENTITY/i.test(xml))
    throw new Error("Cấu trúc XML Word không được hỗ trợ.");
  const document = new DOMParser({
    onError: () => {
      throw new Error("XML không hợp lệ.");
    },
  }).parseFromString(xml, "application/xml");
  const root = document.documentElement;
  const namespace = root?.namespaceURI;
  if (
    !namespace ||
    ![
      "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
      "http://purl.oclc.org/ooxml/wordprocessingml/main",
    ].includes(namespace)
  )
    throw new Error("Nội dung Word không hợp lệ.");
  const body = document.getElementsByTagNameNS(namespace, "body")[0];
  if (!body) throw new Error("File Word thiếu nội dung.");
  function text(node: XmlNode): string {
    if (node.nodeType !== 1) return "";
    const element = node as Element;
    if (["del", "moveFrom"].includes(element.localName ?? "")) return "";
    if (element.localName === "t") return element.textContent ?? "";
    if (element.namespaceURI === namespace) {
      if (["br", "cr"].includes(element.localName ?? "")) return "\n";
      if (element.localName === "tab") return "\t";
    }
    return Array.from(element.childNodes).map(text).join("");
  }
  return Array.from(body.getElementsByTagNameNS(namespace, "p"))
    .map(text)
    .filter((paragraph) => paragraph.trim())
    .join("\n\n")
    .trim();
}
