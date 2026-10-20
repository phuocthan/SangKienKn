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
W, H = 1000, 1000 * 42799000 / 30276800
PW, PH = 2384, 3370
GREEN, INK, MUTED, GOLD = '#246149', '#183C30', '#435E50', '#C38C37'
BG = '#FAFBF5'
STEM = 'GreenEdu-Poster-loi-van-gan-gui-2026'
URL = 'https://greenedu.up.railway.app/'
for name, font in [('R', 'segoeui.ttf'), ('B', 'segoeuib.ttf'), ('S', 'seguisb.ttf')]:
    pdfmetrics.registerFont(TTFont(name, 'C:/Windows/Fonts/' + font))

c = canvas.Canvas(str(OUT / (STEM + '-A0.pdf')), pagesize=(PW, PH))
c.setTitle('GreenEdu - Cây của em lớn lên khi em học')
c.setAuthor('Nguyễn Thị Thanh Phương - Trường THPT Nguyễn Khuyến, Đà Nẵng')
c.scale(PW / W, PH / H)


def box(x, y, w, h, color, radius=0):
    c.setFillColor(color)
    if radius:
        c.roundRect(x, H-y-h, w, h, radius, fill=1, stroke=0)
    else:
        c.rect(x, H-y-h, w, h, fill=1, stroke=0)


def text(x, y, value, size=18, color=INK, font='R', limit=None):
    assert pdfmetrics.stringWidth(value, font, size) <= (limit or W-x-35), (value, size, limit)
    c.setFillColor(color)
    c.setFont(font, size)
    c.drawString(x, H-y, value)


def center(x, y, value, size=18, color=INK, font='R'):
    text(x-pdfmetrics.stringWidth(value, font, size)/2, y, value, size, color, font)


def line(x, y, x2, y2, color='#D6DFCA', width=1):
    c.setStrokeColor(color)
    c.setLineWidth(width)
    c.line(x, H-y, x2, H-y2)


def image(path, x, y, w, h):
    c.drawImage(ImageReader(str(path)), x, H-y-h, w, h, mask='auto')


def lines(x, y, values, size=14.2, color=MUTED, leading=22, font='R', width=205):
    for i, value in enumerate(values):
        text(x, y+i*leading, value, size, color, font, limit=width)


def label(x, y, number, title):
    text(x, y, number, 16.5, GOLD, 'B')
    text(x+30, y, title, 19.5, GREEN, 'B', limit=180)
    line(x, y+12, x+195, y+12, '#D4DDC8', 1.1)


box(0, 0, W, H, BG)
image(ROOT/'artifacts/posters/ho-so-san-pham-2026/assets/banner-mau-2026.png', 0, 0, W, W*724/3975)
text(42, 228, 'GreenEdu', 35, GREEN, 'B')
text(44, 252, 'ỨNG DỤNG ÔN TẬP CHO HỌC SINH', 17.5, '#091353', 'B')
text(533, 214, 'Giáo viên thực hiện: Nguyễn Thị Thanh Phương', 16, INK, 'S')
text(533, 237, 'Trường THPT Nguyễn Khuyến, thành phố Đà Nẵng', 16, MUTED)
text(533, 260, 'Dành cho học sinh THPT và giáo viên', 16, MUTED)

# The idea is seen before the four surrounding content clusters.
center(500, 321, 'CÂY CỦA EM', 51, INK, 'B')
center(500, 380, 'LỚN LÊN KHI EM HỌC.', 51, GREEN, 'B')
center(500, 410, 'Làm bài, xem lại câu sai và theo dõi cây của mình.', 20, MUTED, 'S')

# Illustration is the central background, with text kept beyond its silhouette.
c.setFillColor('#EFF3E3')
c.ellipse(236, H-1002, 764, H-450, fill=1, stroke=0)
image(OUT/'assets/khu-vuon-co-thu-tren-sach.png', 230, 455, 540, 540)

label(40, 490, '01', 'VÌ SAO LÀM?')
lines(40, 540, ['Bớt học dồn.', 'Biết chỗ sai.'], 28, INK, 35, 'B')
lines(40, 620, [
    'Sau giờ học, các em',
    'cần bài để luyện thêm.',
    'Cô cần biết em nào',
    'chưa theo kịp bài.',
], 17.5, MUTED, 26, width=210)

label(765, 490, '02', 'CÁCH LÀM')
lines(765, 540, ['Học thêm.', 'Cây lớn thêm.'], 28, INK, 35, 'B')
lines(765, 620, [
    'Mỗi chương có cây riêng.',
    'Em làm bài và sửa sai.',
    'Thời gian được tính',
    'khi em đang làm bài.',
    'Học đủ thời gian,',
    'cây sẽ lên cấp.',
], 17.5, MUTED, 26, width=199)

label(40, 795, '03', 'HỌC SINH')
lines(40, 839, [
    'Ôn bài theo chương',
    'Làm lại câu sai',
    'Tham gia săn thưởng',
    'Làm bài cùng nhóm',
], 17.5, GREEN, 27, 'S', width=210)

label(785, 795, '04', 'GIÁO VIÊN')
lines(785, 839, [
    'Giao bài theo chương',
    'Mở kiểm tra online',
    'Đặt số phút học/tuần',
    'Xem kết quả từng em',
], 17.5, GREEN, 27, 'S', width=180)

center(500, 1081, 'KHU VƯỜN CỦA LỚP CÓ CÂY CỦA TỪNG BẠN.', 22, GREEN, 'B')
center(500, 1110, 'Cấp cây tính riêng theo lớp, môn học và chương.', 18, MUTED)

# Five small stage markers remain secondary to the central tree and characters.
for i, (x, name) in enumerate([(180, 'Mầm'), (340, 'Chồi'), (500, 'Cây Non'), (660, 'Đơm Hoa'), (820, 'Kết Trái')], 1):
    image(ROOT/'artifacts/design/student-levels-3d-preview/assets'/f'level-{i}.png', x-27, 1124, 54, 54)
    center(x, 1197, name, 18, INK, 'B')
    if i < 5:
        line(x+43, 1158, x+117, 1158, '#CCD8BE', 1.4)

box(40, 1220, 920, 34, GREEN, 9)
center(500, 1243, 'LÀM BÀI   →   XEM CÂU SAI   →   LÀM LẠI   →   XEM KẾT QUẢ', 17.5, '#FFFFFF', 'B')

text(42, 1289, 'AI ĐƯỢC DÙNG Ở ĐÂU?', 18, GREEN, 'B')
lines(42, 1315, [
    'Hỗ trợ viết, kiểm tra mã;',
    'tạo hình minh họa.',
    'Cô kiểm tra nội dung bài tập.',
], 17.5, MUTED, 24, width=320)

text(403, 1289, 'ĐÃ LÀM ĐƯỢC GÌ?', 18, GREEN, 'B')
lines(403, 1315, [
    'Đã có web để giao và làm bài.',
    'Cô xem được kết quả của từng em.',
    'Sẽ lấy ý kiến học sinh để sửa tiếp.',
], 17.5, MUTED, 24, width=350)
text(42, 1392, 'GREENEDU · ÔN BÀI SAU GIỜ HỌC', 14.5, GREEN, 'S')

box(816, 1274, 144, 131, '#FFFFFF', 12)
qr = QrCodeWidget(URL)
bx, by, bw, bh = qr.getBounds()
d = Drawing(108, 108, transform=[108/(bw-bx), 0, 0, 108/(bh-by), 0, 0])
d.add(qr)
renderPDF.draw(d, c, 834, H-1387)
center(888, 1401, 'TRẢI NGHIỆM', 14.5, GREEN, 'B')
c.linkURL(URL, (816, H-1405, 960, H-1274), relative=1, thickness=0)
c.save()

reader = PdfReader(OUT/(STEM+'-A0.pdf'))
writer = PdfWriter()
page = reader.pages[0]
page.scale_to(297/25.4*72, 420/25.4*72)
writer.add_page(page)
writer.add_metadata({'/Title': 'GreenEdu - Cây của em lớn lên khi em học - A3'})
with (OUT/(STEM+'-A3.pdf')).open('wb') as stream:
    writer.write(stream)

doc = pdfium.PdfDocument(str(OUT/(STEM+'-A3.pdf')))
im = doc[0].render(scale=300/72).to_pil().convert('RGB')
im.save(OUT/(STEM+'.png'), dpi=(300, 300), optimize=True)
im.thumbnail((1400, 1980))
im.save(OUT/(STEM+'-preview.png'))
print('Created central book-garden poster: A0, A3, PNG and preview.')
