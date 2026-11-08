import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DOMParser } from "@xmldom/xmldom";
import { zipSync, strToU8 } from "fflate";
import {
  formulaSegments,
  unwrapFormula,
  wrapFormula,
} from "../shared/formula-text.js";
import { renderFormula } from "../src/formula-render.js";
import { QuestionText } from "../src/QuestionText.js";
import { parseWordFile } from "../src/importWord.js";
import { mathmlToLatex } from "../src/formula-clipboard.js";

test("formula text preserves Vietnamese labels, nested scripts, all supported delimiters and exact edit offsets", () => {
  const source =
    "Động năng W_{đ}, W_đ, a_{max}^{2}, x_{i^{2}} và \\(\\frac{1}{2}mv^2\\).";
  const segments = formulaSegments(source);
  assert.deepEqual(
    segments.filter((s) => s.kind === "sub").map((s) => s.value),
    ["đ", "đ", "max", "i^{2}"],
  );
  const formula = segments.find((s) => s.kind === "math")!;
  assert.equal(
    source.slice(formula.start, formula.end),
    wrapFormula(formula.value),
  );
  for (const input of ["\\(x_1\\)", "\\[x_1\\]", "$$x_1$$", "$x_1$"]) {
    assert.equal(unwrapFormula(input), "x_1");
    assert.equal(formulaSegments(input)[0].kind, "math");
  }
  assert.equal(formulaSegments("Wđ")[0].kind, "text"); // Never guess lost formatting.
  assert.equal(formulaSegments("x_{chưa đóng")[0].value, "x_{chưa đóng");
  assert.equal(formulaSegments("Giá \\$5")[0].kind, "text");
});

test("formula renderer handles fractions, roots, Vietnamese subscripts and nested scripts without trusting user HTML", () => {
  const latex = "W_{\\text{đ}}=\\frac{1}{2}mv^{2}+\\sqrt{x_{0}^{2}}";
  const html = renderToStaticMarkup(
    createElement(QuestionText, {
      children:
        "Động năng " +
        wrapFormula(latex) +
        " <img src=x onerror=alert(1)> W_{đ}",
    }),
  );
  assert.match(html, /<math/);
  assert.match(html, /<mfrac>/);
  assert.match(html, /<msqrt>/);
  assert.match(html, /<sub>đ<\/sub>/);
  assert.match(html, /&lt;img/);
  assert.doesNotMatch(html, /<img|onerror="|<script/);
  const malicious = renderFormula("\\href{javascript:alert(1)}{click}");
  assert.doesNotMatch(malicious.html, /href=|<a\b|<script/);
  assert.ok(renderFormula("\\frac{1}{").error);
  assert.ok(renderFormula("x".repeat(3001)).error);
});

function word(body: string) {
  globalThis.DOMParser = DOMParser as unknown as typeof globalThis.DOMParser;
  const p = (s: string) => `<w:p>${s}</w:p>`;
  const r = (s: string) => `<w:r><w:t>${s}</w:t></w:r>`;
  const xml = `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"><w:body>${[
    p(r("Câu 1: ") + body),
    p(r("Bài học: Bài công thức")),
    ...[
      "A. Một",
      "B. Hai",
      "C. Ba",
      "D. Bốn",
      "Đáp án: A",
      "Lời giải: Bảo toàn năng lượng.",
    ].map((s) => p(r(s))),
  ].join("")}</w:body></w:document>`;
  return parseWordFile(zipSync({ "word/document.xml": strToU8(xml) }));
}
const mt = (s: string) => `<m:r><m:t>${s}</m:t></m:r>`;

test("Word retains lowered Vietnamese đ and reads real Equation fractions, roots, sums and matrices", () => {
  const lowered = word(
    '<w:r><w:t>W</w:t></w:r><w:r><w:rPr><w:position w:val="-4"/></w:rPr><w:t>đ</w:t></w:r>',
  );
  assert.deepEqual(lowered.errors, []);
  assert.equal(lowered.questions[0].text, "W_{đ}");
  const q = word(
    `<m:oMath><m:sSub><m:e>${mt("W")}</m:e><m:sub>${mt("đ")}</m:sub></m:sSub>${mt("=")}<m:f><m:num>${mt("1")}</m:num><m:den>${mt("2")}</m:den></m:f>${mt("m")}<m:sSup><m:e>${mt("v")}</m:e><m:sup>${mt("2")}</m:sup></m:sSup><m:rad><m:deg/><m:e>${mt("x")}</m:e></m:rad></m:oMath>`,
  );
  assert.deepEqual(q.errors, []);
  assert.match(q.questions[0].text, /\\frac\{1\}\{2\}/);
  assert.match(q.questions[0].text, /_\{\\text\{đ\}\}/);
  assert.equal(renderFormula(unwrapFormula(q.questions[0].text)).error, "");
  const nary = word(
    `<m:oMath><m:nary><m:naryPr><m:chr m:val="∑"/></m:naryPr><m:sub>${mt("i=1")}</m:sub><m:sup>${mt("n")}</m:sup><m:e>${mt("x")}</m:e></m:nary><m:m><m:mr><m:e>${mt("1")}</m:e><m:e>${mt("2")}</m:e></m:mr></m:m></m:oMath>`,
  );
  assert.equal(renderFormula(unwrapFormula(nary.questions[0].text)).error, "");
});

test("Word does not silently flatten unsupported embedded formulas", () => {
  assert.throws(
    () => word("<w:object><w:t>Không được bỏ mất công thức</w:t></w:object>"),
    /đối tượng nhúng/,
  );
  assert.throws(
    () =>
      word(`<m:oMath><m:groupChr><m:e>${mt("x")}</m:e></m:groupChr></m:oMath>`),
    /chưa được hỗ trợ/,
  );
});

test("MathML clipboard expressions preserve math structure instead of concatenating numerator and denominator", () => {
  const doc = new DOMParser().parseFromString(
    '<math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><msub><mi>W</mi><mtext>đ</mtext></msub><mo>=</mo><mfrac><mn>1</mn><mn>2</mn></mfrac><msup><mi>v</mi><mn>2</mn></msup></mrow></math>',
    "application/xml",
  );
  const latex = mathmlToLatex(doc.documentElement! as unknown as Element);
  assert.match(latex, /\\text\{đ\}/);
  assert.match(latex, /\\frac\{1\}\{2\}/);
  assert.equal(renderFormula(latex).error, "");
});
