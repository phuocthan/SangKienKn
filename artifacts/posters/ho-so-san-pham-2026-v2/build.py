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
target=OUT/'GreenEdu-Poster-sang-tao-2026-A0.pdf'
c=canvas.Canvas(str(target),pagesize=(PW,PH))
c.setTitle('GreenEdu - Nuôi cây kiến thức, hình thành thói quen tự học')
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

# Distinctive product masthead, outside the official event banner.
text(44,244,'GreenEdu',59,GREEN,'B')
text(47,278,'KHU VƯỜN TRI THỨC SỐ',24,NAVY,'B')
text(47,309,'Giáo viên thực hiện: Nguyễn Thị Thanh Phương',15.8,INK,'S')
text(47,334,'Đơn vị: Trường THPT Nguyễn Khuyến, thành phố Đà Nẵng',15.2,MUTED)
box(572,210,384,137,PALE,22)
leaf(910,245,33)
text(596,244,'Mỗi học sinh một cây.',22,GREEN,'B')
text(596,277,'Mỗi chương một hành trình.',20,INK,'S')
text(596,313,'Cả lớp cùng phát triển.',20,INK,'S')
text(596,339,'DÀNH CHO HỌC SINH THPT & GIÁO VIÊN',11.5,MUTED,'B')

# Concrete classroom needs as connected seeds of the solution.
section(44,383,'1','TỪ NHU CẦU THẬT TRONG LỚP HỌC')
needs=[('Duy trì thói quen','Tự học đều, tránh dồn sát kỳ kiểm tra.'),('Học từ lỗi sai','Biết mình hổng kiến thức ở đâu.'),('Đồng hành kịp thời','Giáo viên biết em nào cần hỗ trợ.')]
for i,(title,sub) in enumerate(needs):
    x=45+i*312
    line(x,404,x+286,404,GOLD,3)
    text(x,431,title,20,INK,'B')
    text(x,456,sub,14.6,MUTED,limit=295)

# Growth is the central visual metaphor, not a decorative picture.
box(28,480,944,284,'#F0F4E5',26)
section(46,514,'2','Ý TƯỞNG: BIẾN NỖ LỰC THÀNH SỰ TRƯỞNG THÀNH')
text(81,543,'Cây lớn từ thời gian học có hoạt động; cấp riêng theo lớp - môn - chương.',16.2,MUTED)
points=[(134,667),(317,650),(500,667),(683,650),(866,667)]
c.setStrokeColor('#B4C37F');c.setLineWidth(5)
p=c.beginPath();p.moveTo(*[points[0][0],H-points[0][1]])
for (x1,y1),(x2,y2) in zip(points,points[1:]):
    p.curveTo(x1+75,H-y1,x2-75,H-y2,x2,H-y2)
c.drawPath(p,stroke=1)
for i,((x,y),name) in enumerate(zip(points,['Mầm','Chồi','Cây Non','Đơm Hoa','Kết Trái']),1):
    stage(i,x-71,550+(0 if i%2 else -6),142)
    centered(x,716,name,20,INK,'B')
centered(500,742,'Luyện tập → Sửa sai → Tích lũy thời gian → Nhận vé săn thưởng khi đủ điều kiện',15.6,GREEN,'S')
centered(500,760,'Vườn cá nhân - Vườn của lớp - Vinh danh cấp Kết Trái',13.3,MUTED,'S')

# Role-based capabilities show the actual operational loop.
section(44,804,'3','HIỆN THỰC HÓA: MỘT HỆ SINH THÁI HỌC TẬP')
box(44,824,444,258,'#FFFFFF',18)
box(512,824,444,258,'#EAF0E0',18)
text(64,858,'HỌC SINH CHỦ ĐỘNG',20,GREEN,'B')
text(532,858,'GIÁO VIÊN ĐỒNG HÀNH',20,GREEN,'B')
student=[('Luyện tập & ôn tập','Chọn chương, bài; học theo nhịp riêng.'),('Sổ tay sửa sai','Lưu câu sai, làm lại để khắc phục.'),('Săn thưởng','Vé theo cấp cây; điểm do giáo viên duyệt.'),('Học cùng tập thể','Nộp bài nhóm, đọc chéo và phản biện.')]
teacher=[('Học liệu theo chương, bài','Tạo câu hỏi; nhập đề Word/CSV.'),('Kiểm tra online','Hẹn giờ mở; trộn thứ tự câu cho học sinh.'),('Ghi nhận học có hoạt động','Cấu hình nhắc rời tab và không tương tác.'),('Chỉ tiêu & báo cáo tuần','Tách đạt / chưa đạt; học bù hết Chủ nhật.')]
for x,items in [(64,student),(532,teacher)]:
    for i,(title,sub) in enumerate(items):
        y=895+i*49
        check(x+5,y-2)
        text(x+23,y,title,17.3,INK,'B')
        text(x+23,y+23,sub,14.5,MUTED,limit=392)

box(44,1098,912,38,GREEN,10)
centered(500,1123,'GIAO BÀI   →   HỌC & SỬA SAI   →   GHI NHẬN TIẾN BỘ   →   PHẢN HỒI',16,'#FFFFFF','B')

section(44,1175,'4','AI HỖ TRỢ XÂY DỰNG - GIÁO VIÊN LÀM CHỦ')
text(46,1204,'AI: hỗ trợ lập trình, rà soát mã và thiết kế minh họa.',16.7,INK)
text(46,1231,'Giáo viên: xây dựng học liệu, kiểm duyệt và tổ chức dạy học.',16.7,INK)

line(44,1250,956,1250)
section(44,1282,'5','KẾT QUẢ HIỆN CÓ & HƯỚNG PHÁT TRIỂN',18)
text(46,1312,'Đã có sản phẩm web: phân quyền, giao bài và theo dõi tiến độ.',16,INK,'S',limit=705)
text(46,1339,'Hướng tới: học đều hơn, sửa sai có đích, hỗ trợ đúng người.',16,INK,limit=705)
text(46,1366,'Tiếp tục mở rộng học liệu và đo lường hiệu quả học tập.',16,MUTED,limit=705)
text(46,1393,'greenedu.up.railway.app',15,GREEN,'B')

box(808,1266,148,140,'#FFFFFF',14)
qr=QrCodeWidget('https://greenedu.up.railway.app/')
bx,by,bw,bh=qr.getBounds()
d=Drawing(116,116,transform=[116/(bw-bx),0,0,116/(bh-by),0,0]);d.add(qr)
renderPDF.draw(d,c,824,H-1382)
centered(882,1396,'QUÉT ĐỂ TRẢI NGHIỆM',10.5,GREEN,'B')
c.linkURL('https://greenedu.up.railway.app/',(44,H-1400,450,H-1372),relative=1,thickness=0)
c.save()

reader=PdfReader(target);writer=PdfWriter();page=reader.pages[0]
page.scale_to(297/25.4*72,420/25.4*72);writer.add_page(page)
writer.add_metadata({'/Title':'GreenEdu - Poster hồ sơ sáng tạo 2026 - A3'})
with (OUT/'GreenEdu-Poster-sang-tao-2026-A3.pdf').open('wb') as stream:writer.write(stream)
doc=pdfium.PdfDocument(str(OUT/'GreenEdu-Poster-sang-tao-2026-A3.pdf'))
im=doc[0].render(scale=300/72).to_pil().convert('RGB')
im.save(OUT/'GreenEdu-Poster-sang-tao-2026.png',dpi=(300,300),optimize=True)
im.thumbnail((1400,1980));im.save(OUT/'GreenEdu-Poster-sang-tao-2026-preview.png')
print('Created revised editorial infographic: A0, A3 and 300 dpi PNG.')
