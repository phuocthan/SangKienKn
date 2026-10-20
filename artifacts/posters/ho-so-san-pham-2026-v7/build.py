from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.graphics import renderPDF
from pypdf import PdfReader, PdfWriter
import pypdfium2 as pdfium

OUT = Path(__file__).resolve().parent
ROOT = OUT.parents[2]
W, H = 1000, 1000*42799000/30276800
PW, PH = 2384, 3370
GREEN, INK, MUTED = '#246149', '#183C30', '#3D5549'
BG, PALE, RULE, GOLD = '#FBFCF8', '#EEF3E6', '#D4DFCA', '#AF7B2F'
STEM = 'GreenEdu-Poster-giao-duc-GDPT2018-2026'
APP = 'https://greenedu.up.railway.app/'
GENERAL = 'https://moet.gov.vn/content/tintuc/Lists/News/Attachments/8421/chuong-trinh-tong-the-ctgdpt-2018.pdf'
PHYSICS = 'https://data.moet.gov.vn/index.php/s/LYZDcWOm7QJqgdR'
for name, file in [('R', 'segoeui.ttf'), ('B', 'segoeuib.ttf'), ('S', 'seguisb.ttf')]:
    pdfmetrics.registerFont(TTFont(name, 'C:/Windows/Fonts/'+file))
c = canvas.Canvas(str(OUT/(STEM+'-A0.pdf')), pagesize=(PW, PH))
c.setTitle('GreenEdu - Hỗ trợ tự học theo Chương trình GDPT 2018')
c.setAuthor('Nguyễn Thị Thanh Phương - Trường THPT Nguyễn Khuyến, Đà Nẵng')
c.scale(PW/W, PH/H)
TEXT_AUDIT = []


def box(x, y, w, h, color, radius=0):
    c.setFillColor(color)
    if radius:
        c.roundRect(x, H-y-h, w, h, radius, stroke=0, fill=1)
    else:
        c.rect(x, H-y-h, w, h, stroke=0, fill=1)


def text(x, y, value, size=22, color=INK, font='R', limit=None):
    width = pdfmetrics.stringWidth(value, font, size)
    assert x >= 25 and x+width <= 975, (value, x, width)
    assert width <= (limit or W-x-30), (value, width, limit)
    c.setFillColor(color)
    c.setFont(font, size)
    c.drawString(x, H-y, value)
    TEXT_AUDIT.append({'text': value, 'design_size': size})


def center(x, y, value, size=22, color=INK, font='R'):
    text(x-pdfmetrics.stringWidth(value, font, size)/2, y, value, size, color, font)


def rule(x, y, x2, y2, color=RULE, width=1):
    c.setStrokeColor(color)
    c.setLineWidth(width)
    c.line(x, H-y, x2, H-y2)


def paragraph(x, y, value, width, size=22, leading=28, font='R', color=MUTED, max_lines=None):
    result, current = [], ''
    for word in value.split():
        trial = (current+' '+word).strip()
        if pdfmetrics.stringWidth(trial, font, size) <= width:
            current = trial
        else:
            assert current, word
            result.append(current)
            current = word
    if current:
        result.append(current)
    assert max_lines is None or len(result) <= max_lines, (value, result, max_lines)
    for i, line in enumerate(result):
        text(x, y+i*leading, line, size, color, font, width)
    return len(result)


def heading(y, number, value, size=24):
    text(40, y, number, 20, GOLD, 'B')
    text(78, y, value, size, GREEN, 'B')


def image(path, x, y, size):
    c.drawImage(ImageReader(str(path)), x, H-y-size, size, size, mask='auto')


box(0, 0, W, H, BG)
c.drawImage(ImageReader(str(ROOT/'artifacts/posters/ho-so-san-pham-2026/assets/banner-mau-2026.png')), 0, H-W*724/3975, W, W*724/3975)
text(40, 227, 'GreenEdu', 34, GREEN, 'B')
text(41, 254, 'ÔN TẬP VẬT LÍ Ở TRƯỜNG THPT', 18, GREEN, 'S')
text(510, 213, 'Giáo viên: Nguyễn Thị Thanh Phương', 18, INK, 'S')
text(510, 240, 'Trường THPT Nguyễn Khuyến, TP. Đà Nẵng', 18, MUTED)

center(500, 309, 'HỖ TRỢ TỰ HỌC VÀ SỬA SAI', 40, INK, 'B')
center(500, 355, 'THEO CHƯƠNG TRÌNH GDPT 2018', 36, GREEN, 'B')
center(500, 390, 'Từ kết quả làm bài đến điều chỉnh việc học và dạy học.', 22, MUTED, 'S')

heading(438, '01', 'NHU CẦU CẦN GIẢI QUYẾT')
paragraph(40, 475, 'Học sinh cần biết mình chưa hiểu gì và học lại thế nào sau giờ học. Giáo viên cần theo dõi từng em để hỗ trợ đúng nội dung.', 660, 22, 29, max_lines=3)
text(40, 548, 'Giáo viên chọn nhiệm vụ, tiêu chí theo yêu cầu cần đạt.', 22)
text(40, 577, 'Trọng tâm: tự học, hợp tác và đánh giá quá trình. [1]', 22, GREEN, 'S')
image(ROOT/'artifacts/posters/ho-so-san-pham-2026-v4/assets/khu-vuon-co-thu-tren-sach.png', 750, 409, 210)

heading(628, '02', 'MỤC TIÊU → HOẠT ĐỘNG → MINH CHỨNG')
TABLE_TOP, HEADER_H, ROW_H = 650, 44, 109
COLS = [40, 306, 681, 960]
box(40, TABLE_TOP, 920, HEADER_H, GREEN, 8)
text(55, TABLE_TOP+29, 'Định hướng GDPT 2018', 20, '#FFFFFF', 'B')
text(323, TABLE_TOP+29, 'Cách dùng GreenEdu', 20, '#FFFFFF', 'B')
text(697, TABLE_TOP+29, 'Minh chứng học tập', 20, '#FFFFFF', 'B')
ROWS = [
    ('Tự chủ và tự học',
     'Ôn theo chương; nhận phản hồi và làm lại câu sai.',
     'Nhật ký học; câu còn sai; kết quả làm lại.'),
    ('Giao tiếp và hợp tác',
     'Nộp sản phẩm nhóm; trao đổi, góp ý và phản biện.',
     'Sản phẩm, phiên bản và nội dung trao đổi.'),
    ('Giải quyết vấn đề và sáng tạo',
     'Giáo viên giao nhiệm vụ thực tiễn; học sinh giải thích, đề xuất cách làm.',
     'Lời giải, báo cáo và bằng chứng do học sinh tạo.'),
    ('Đánh giá để điều chỉnh',
     'Giáo viên xem kết quả, giao bài bổ sung và hướng dẫn phần chưa đạt.',
     'Lỗi lặp lại, mức hoàn thành và sản phẩm học tập.'),
]
for i, (goal, activity, evidence) in enumerate(ROWS):
    top = TABLE_TOP+HEADER_H+i*ROW_H
    box(40, top, 920, ROW_H, PALE if i % 2 == 0 else '#FFFFFF')
    paragraph(55, top+31, goal, 234, 23, 28, 'B', GREEN, 3)
    paragraph(323, top+31, activity, 341, 22, 28, max_lines=3)
    paragraph(697, top+31, evidence, 247, 22, 28, max_lines=3)
    rule(40, top+ROW_H, 960, top+ROW_H)
for x in COLS[1:-1]:
    rule(x, TABLE_TOP+HEADER_H, x, TABLE_TOP+HEADER_H+len(ROWS)*ROW_H)

heading(1170, '03', 'VAI TRÒ CỦA CÂY VÀ GIỚI HẠN CỦA CÔNG CỤ', 23)
text(40, 1205, 'Cấp cây phản ánh thời gian học, dùng để khuyến khích học đều.', 22)
text(40, 1236, 'Năng lực cần đánh giá qua bài làm, sản phẩm và thực hành Vật lí. [2]', 22)

heading(1280, '04', 'ĐÃ CÓ VÀ CẦN KIỂM CHỨNG', 23)
text(40, 1314, 'Đã có: luyện tập, sửa sai, bài nhóm và thống kê theo lớp.', 22)
text(40, 1345, 'Tiếp theo: đối chiếu bài làm trước - sau để kiểm chứng hiệu quả.', 22)

qr = QrCodeWidget(APP)
bx, by, bw, bh = qr.getBounds()
d = Drawing(113, 113, transform=[113/(bw-bx), 0, 0, 113/(bh-by), 0, 0])
d.add(qr)
box(820, 1264, 140, 125, '#FFFFFF', 10)
renderPDF.draw(d, c, 833, H-1380)
center(890, 1397, 'DÙNG THỬ', 15, GREEN, 'B')
c.linkURL(APP, (820, H-1403, 960, H-1264), relative=1, thickness=0)

# References remain short and link to the source documents.
text(40, 1381, '[1] CT tổng thể, mục III, VI, IX.  [2] CT môn Vật lí, mục IV, VI.', 16, MUTED)
text(40, 1404, 'TT 32/2018/TT-BGDĐT. AI hỗ trợ mã và minh họa; giáo viên kiểm tra học liệu.', 15.7, MUTED)
c.linkURL(GENERAL, (40, H-1386, 347, H-1362), relative=1, thickness=0)
c.linkURL(PHYSICS, (347, H-1386, 786, H-1362), relative=1, thickness=0)
c.save()

reader = PdfReader(OUT/(STEM+'-A0.pdf'))
page = reader.pages[0]
page.scale_to(297/25.4*72, 420/25.4*72)
writer = PdfWriter()
writer.add_page(page)
writer.add_metadata({'/Title': 'GreenEdu - Hỗ trợ tự học theo GDPT 2018 - A3'})
with (OUT/(STEM+'-A3.pdf')).open('wb') as f:
    writer.write(f)
doc = pdfium.PdfDocument(str(OUT/(STEM+'-A3.pdf')))
im = doc[0].render(scale=300/72).to_pil().convert('RGB')
im.save(OUT/(STEM+'.png'), dpi=(300, 300), optimize=True)
im.thumbnail((1400, 1980))
im.save(OUT/(STEM+'-preview.png'))
print('Created education-first poster: A0, A3, PNG, preview.')
