import fs from 'node:fs';
import { unzipSync, zipSync, strFromU8, strToU8 } from 'fflate';
const file = new URL('../public/templates/greenedu-cau-hoi-mau.docx', import.meta.url);
const files = unzipSync(fs.readFileSync(file));
let xml = strFromU8(files['word/document.xml']);
if (!xml.includes('Loại câu hỏi: Đúng/sai')) {
  xml = xml.replace('Thay hai câu mẫu', 'Thay các câu mẫu').replace('Hai câu mẫu để thay nội dung','Ba dạng câu hỏi để thay nội dung')
    .replace('Giữ các nhãn Bài học:, A., B., C., D., Đáp án: và Lời giải:.','Giữ nhãn Bài học:, Loại câu hỏi:, Đáp án: và Lời giải:.')
    .replace('Mỗi câu có bốn phương án khác nhau và một đáp án đúng là A, B, C hoặc D. Điền đủ bài học và lời giải.', 'Trắc nghiệm: 4 phương án A–D, đáp án A/B/C/D. Đúng/sai: 2–4 ý a–d, đáp án Đ/S theo thứ tự. Trả lời ngắn: không có A–D, ghi trực tiếp đáp án.');
  const paragraphs = [
    'Câu 3: Trái đất là một hành tinh xanh. Xác định tính đúng/sai của các khẳng định.',
    'Loại câu hỏi: Đúng/sai','Bài học: Bài 3 · Trái đất',
    'a. Trái đất gần có dạng hình cầu.','b. Trái đất có đại dương.','c. Trái đất là một ngôi sao.','d. Trái đất quay quanh Mặt trời.',
    'Đáp án: Đ Đ S Đ','Lời giải: Trái đất là một hành tinh gần có dạng hình cầu, có đại dương và quay quanh Mặt trời.',
    'Câu 4: Cho hàm số y = x^3 - 3x^2 + 2. Tìm giá trị cực đại của hàm số.',
    'Loại câu hỏi: Trả lời ngắn','Bài học: Bài 4 · Hàm số','Đáp án: 2',
    'Lời giải: y\' = 3x(x-2). Đạo hàm đổi dấu từ dương sang âm tại x=0, nên giá trị cực đại là y(0)=2.',
  ];
  const escape = text => text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  const content = paragraphs.map(text=>'<w:p><w:r><w:t xml:space="preserve">'+escape(text)+'</w:t></w:r></w:p>').join('');
  xml = xml.includes('<w:sectPr') ? xml.replace('<w:sectPr',content+'<w:sectPr') : xml.replace('</w:body>',content+'</w:body>');
  files['word/document.xml'] = strToU8(xml);
  fs.writeFileSync(file, zipSync(files));
}
