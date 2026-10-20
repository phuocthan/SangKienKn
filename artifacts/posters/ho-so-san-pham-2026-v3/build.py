from pathlib import Path
from math import sin,cos,pi
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.graphics import renderPDF
from pypdf import PdfReader,PdfWriter
import pypdfium2 as pdfium

OUT=Path(__file__).resolve().parent
ROOT=OUT.parents[2]
W,H=1000,1000*42799000/30276800
PW,PH=2384,3370
GREEN,INK,MUTED,PALE,GOLD,NAVY='#246149','#183C30','#536B60','#EEF3E5','#C38C37','#091353'
for n,f in [('R','segoeui.ttf'),('B','segoeuib.ttf'),('S','seguisb.ttf')]:
    pdfmetrics.registerFont(TTFont(n,'C:/Windows/Fonts/'+f))
target=OUT/'GreenEdu-Poster-y-tuong-noi-bat-2026-A0.pdf'
c=canvas.Canvas(str(target),pagesize=(PW,PH))
c.setTitle('GreenEdu - Biến việc học thành một khu vườn')
c.setAuthor('Nguyễn Thị Thanh Phương - Trường THPT Nguyễn Khuyến, Đà Nẵng')
c.scale(PW/W,PH/H)
def box(x,y,w,h,color,r=0):
    c.setFillColor(color)
    if r:c.roundRect(x,H-y-h,w,h,r,fill=1,stroke=0)
    else:c.rect(x,H-y-h,w,h,fill=1,stroke=0)
def text(x,y,s,size=18,col=INK,font='R',limit=None):
    assert pdfmetrics.stringWidth(s,font,size)<=(limit or W-x-36),(s,size,limit)
    c.setFillColor(col);c.setFont(font,size);c.drawString(x,H-y,s)
def centered(x,y,s,size=18,col=INK,font='R'):
    text(x-pdfmetrics.stringWidth(s,font,size)/2,y,s,size,col,font)
def line(x,y,x2,y2,col='#D4E0D1',width=1):
    c.setStrokeColor(col);c.setLineWidth(width);c.line(x,H-y,x2,H-y2)
def image(p,x,y,w,h):c.drawImage(ImageReader(str(p)),x,H-y-h,w,h,mask='auto')
def stage(i,x,y,size):image(ROOT/'artifacts/design/student-levels-3d-preview/assets'/f'level-{i}.png',x,y,size,size)
def circle(x,y,r,col):c.setFillColor(col);c.circle(x,H-y,r,fill=1,stroke=0)
def section(x,y,n,title,size=19):
    circle(x+13,y-7,13,GREEN)
    centered(x+13,y-1,n,14,'#FFFFFF','B')
    text(x+35,y,title,size,GREEN,'B')
def check(x,y):
    circle(x,y-5,7,'#D8E7CB')
    line(x-3,y-5,x-0.5,y-2,GREEN,1.7);line(x-0.5,y-2,x+4,y-8,GREEN,1.7)
def leaf(x,y,size=24):
    c.saveState();c.translate(x,H-y);c.scale(size/24,size/24)
    p=c.beginPath();p.moveTo(0,0);p.curveTo(-11,3,-13,15,-13,20);p.curveTo(0,21,8,13,0,0)
    c.setFillColor('#BAD098');c.drawPath(p,fill=1,stroke=0)
    c.setStrokeColor(GREEN);c.setLineWidth(1.2);c.line(0,-3,-8,15);c.restoreState()

box(0,0,W,H,'#FBFCF8')
image(ROOT/'artifacts/posters/ho-so-san-pham-2026/assets/banner-mau-2026.png',0,0,W,W*724/3975)

# Product identity stays present; the idea is deliberately the dominant element.
text(44,229,'GreenEdu',36,GREEN,'B')
text(46,254,'KHU VƯỜN TRI THỨC SỐ',15.5,NAVY,'B')
text(533,214,'Giáo viên thực hiện: Nguyễn Thị Thanh Phương',13.8,INK,'S')
text(533,237,'Trường THPT Nguyễn Khuyến, thành phố Đà Nẵng',13.4,MUTED)
text(533,260,'Dành cho học sinh THPT và giáo viên',13.4,MUTED)

# The primary three-second message: large type + an outsized grown tree.
box(22,277,956,455,'#EDF3DF',28)
text(46,348,'BIẾN VIỆC HỌC',57,INK,'B',limit=540)
text(46,414,'THÀNH MỘT',54,INK,'B',limit=540)
text(43,492,'KHU VƯỜN.',72,GREEN,'B',limit=540)
box(47,509,427,4,GOLD,2)
text(48,544,'Tự học có hoạt động → cây kiến thức lớn lên.',17.6,MUTED,limit=520)
circle(776,453,174,'#DDE9C3')
# The four young stages lead to the mature tree instead of a second equal row.
c.setStrokeColor('#C29646');c.setLineWidth(3)
p=c.beginPath();p.moveTo(92,H-661)
p.curveTo(270,H-681,405,H-641,570,H-669)
p.curveTo(652,H-682,704,H-680,784,H-658)
c.drawPath(p,stroke=1)
stage(5,533,247,460)
for i,x in enumerate([40,163,292,427],1):
    stage(i,x,564,112)
for x,label in [(96,'Mầm'),(219,'Chồi'),(348,'Cây Non'),(483,'Đơm Hoa'),(782,'Kết Trái')]:
    centered(x,705,label,15.5,INK,'B')
centered(500,751,'Mỗi học sinh một cây. Mỗi chương một hành trình. Cả lớp cùng phát triển.',17.6,GREEN,'B')

# The supporting story now begins only after the core idea has landed.
for i,(title,sub) in enumerate([
 ('Học đều hơn','Tạo thói quen, tránh học dồn trước kiểm tra.'),
 ('Sửa sai có đích','Biết mình hổng kiến thức ở đâu.'),
 ('Hỗ trợ đúng lúc','Giáo viên biết em nào cần đồng hành.')]):
    x=44+i*312
    line(x,780,x+285,780,'#D9DFC9',1)
    text(x,805,title,20,INK,'B')
    text(x,829,sub,13.8,MUTED,limit=295)

section(44,872,'1','HIỆN THỰC HÓA Ý TƯỞNG TRONG LỚP HỌC')
box(44,890,444,236,'#FFFFFF',18)
box(512,890,444,236,'#EAF0E0',18)
text(64,921,'HỌC SINH CHỦ ĐỘNG',19,GREEN,'B')
text(532,921,'GIÁO VIÊN ĐỒNG HÀNH',19,GREEN,'B')
student=[('Luyện tập & ôn tập','Chọn chương, bài; học theo nhịp riêng.'),('Sổ tay sửa sai','Lưu câu sai, làm lại để khắc phục.'),('Săn thưởng','Vé theo cấp cây; điểm do giáo viên duyệt.'),('Nhóm & khu vườn của lớp','Nộp bài, phản biện; vinh danh cấp Kết Trái.')]
teacher=[('Học liệu theo chương, bài','Tạo câu hỏi; nhập đề Word/CSV.'),('Kiểm tra online','Hẹn giờ mở; trộn thứ tự câu cho học sinh.'),('Ghi nhận học có hoạt động','Cấu hình nhắc rời tab và không tương tác.'),('Chỉ tiêu & báo cáo tuần','Tách đạt / chưa đạt; học bù hết Chủ nhật.')]
for x,items in [(64,student),(532,teacher)]:
    for i,(title,sub) in enumerate(items):
        y=954+i*43
        check(x+5,y-2)
        text(x+23,y,title,16.4,INK,'B')
        text(x+23,y+21,sub,13.5,MUTED,limit=392)
box(44,1140,912,36,GREEN,10)
centered(500,1164,'GIAO BÀI   →   HỌC & SỬA SAI   →   GHI NHẬN TIẾN BỘ   →   PHẢN HỒI',15,'#FFFFFF','B')

section(44,1214,'2','AI HỖ TRỢ PHÁT TRIỂN - GIÁO VIÊN LÀM CHỦ',17.5)
text(46,1240,'AI hỗ trợ lập trình, rà soát mã, thiết kế minh họa; giáo viên kiểm duyệt học liệu.',14.4,INK,limit=740)
line(44,1258,956,1258)
section(44,1292,'3','KẾT QUẢ HIỆN CÓ & HƯỚNG PHÁT TRIỂN',17)
text(46,1321,'Web đã hoạt động: phân quyền, giao bài và báo cáo tiến độ.',15.5,INK,'S',limit=735)
text(46,1348,'Hướng tới tự học đều, sửa sai có đích và hỗ trợ đúng người.',15.5,INK,limit=735)
text(46,1375,'Tiếp tục mở rộng học liệu và đo lường hiệu quả học tập.',15.5,MUTED,limit=735)

box(814,1272,142,132,'#FFFFFF',14)
qr=QrCodeWidget('https://greenedu.up.railway.app/')
bx,by,bw,bh=qr.getBounds()
d=Drawing(106,106,transform=[106/(bw-bx),0,0,106/(bh-by),0,0]);d.add(qr)
renderPDF.draw(d,c,832,H-1382)
centered(885,1397,'QUÉT ĐỂ TRẢI NGHIỆM',9.8,GREEN,'B')
c.linkURL('https://greenedu.up.railway.app/',(814,H-1404,956,H-1272),relative=1,thickness=0)
c.save()

reader=PdfReader(target);writer=PdfWriter();page=reader.pages[0]
page.scale_to(297/25.4*72,420/25.4*72);writer.add_page(page)
writer.add_metadata({'/Title':'GreenEdu - Poster ý tưởng nổi bật 2026 - A3'})
with (OUT/'GreenEdu-Poster-y-tuong-noi-bat-2026-A3.pdf').open('wb') as stream:writer.write(stream)
doc=pdfium.PdfDocument(str(OUT/'GreenEdu-Poster-y-tuong-noi-bat-2026-A3.pdf'))
im=doc[0].render(scale=300/72).to_pil().convert('RGB')
im.save(OUT/'GreenEdu-Poster-y-tuong-noi-bat-2026.png',dpi=(300,300),optimize=True)
im.thumbnail((1400,1980));im.save(OUT/'GreenEdu-Poster-y-tuong-noi-bat-2026-preview.png')
print('Created revised editorial infographic: A0, A3 and 300 dpi PNG.')
