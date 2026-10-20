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

OUT=Path(__file__).resolve().parent
POSTERS=OUT.parent
ROOT=OUT.parents[2]
W,H=1000,1000*42799000/30276800
PW,PH=30276800/12700,42799000/12700
INK,GREEN,MUTED='#173E32','#24624B','#587264'
for name,file in [('R','segoeui.ttf'),('B','segoeuib.ttf'),('S','seguisb.ttf')]:
    pdfmetrics.registerFont(TTFont(name,'C:/Windows/Fonts/'+file))
target=OUT/'GreenEdu-Poster-ho-so-2026-A0.pdf'
c=canvas.Canvas(str(target),pagesize=(PW,PH))
c.setTitle('GreenEdu - Khu vườn tri thức số | Hồ sơ sản phẩm tham gia 2026')
c.setAuthor('Nguyễn Thị Thanh Phương - Trường THPT Nguyễn Khuyến')
c.scale(PW/W,PH/H)

def box(x,y,w,h,color,r=0):
    c.setFillColor(color)
    if r:c.roundRect(x,H-y-h,w,h,r,fill=1,stroke=0)
    else:c.rect(x,H-y-h,w,h,fill=1,stroke=0)

def text(x,y,s,size=20,color=INK,font='R',maxw=None):
    assert pdfmetrics.stringWidth(s,font,size)<=(maxw if maxw else W-x-42),(s,size)
    c.setFillColor(color);c.setFont(font,size);c.drawString(x,H-y,s)

def line(x,y,x2,color='#D5DFCF'):
    c.setStrokeColor(color);c.setLineWidth(1);c.line(x,H-y,x2,H-y)

def image(path,x,y,w,h):c.drawImage(ImageReader(str(path)),x,H-y-h,w,h,mask='auto')
def heading(x,y,n,s):
    box(x,y-23,29,29,GREEN,7)
    text(x+7,y-2,n,17,'#FFFFFF','B',maxw=24)
    text(x+42,y,s,21,GREEN,'B')

box(0,0,W,H,'#FFFFFF')
# Original official template banner, unmodified: no recreation of logos or type.
image(OUT/'assets/banner-mau-2026.png',0,0,W,W*724/3975)
text(56,245,'GREENEDU',49,GREEN,'B')
text(57,280,'KHU VƯỜN TRI THỨC SỐ',28,INK,'B')
text(57,315,'Giáo viên thực hiện: Nguyễn Thị Thanh Phương',17,INK,'S')
text(57,342,'Đơn vị công tác: Trường THPT Nguyễn Khuyến, thành phố Đà Nẵng',16,INK,'R')
line(56,364,944)

heading(56,410,'1','BỐI CẢNH & NHU CẦU')
text(57,452,'Tự học cần đều đặn.',25,INK,'B')
text(57,487,'Tiến bộ cần được nhìn thấy.',22,INK,'S')
text(57,522,'Hỗ trợ cần đúng lúc.',22,INK,'S')
box(56,548,398,49,'#EAF0DE',11)
text(73,580,'HỌC SINH THPT  /  GIÁO VIÊN',16,GREEN,'B')
image(POSTERS/'gioi-thieu-2026/assets/03-hien-thuc.png',515,374,430,430*2/3)

heading(56,657,'2','Ý TƯỞNG: HỌC ĐỂ CÂY LỚN LÊN')
text(57,690,'Mỗi lớp - mỗi môn - mỗi chương: một hành trình riêng.',19,MUTED)
for i,name in enumerate(['Mầm','Chồi','Cây Non','Đơm Hoa','Kết Trái'],1):
    x=60+(i-1)*180
    image(ROOT/'artifacts/design/student-levels-3d-preview/assets'/f'level-{i}.png',x,710,158,158)
    tx=x+79-pdfmetrics.stringWidth(name,'B',19)/2
    text(tx,890,name,19,INK,'B')
box(56,916,888,49,GREEN,11)
text(86,949,'Luyện tập',21,'#FFFFFF','B')
text(282,949,'→',24,'#D9E9C4','R')
text(337,949,'Sửa sai',21,'#FFFFFF','B')
text(505,949,'→',24,'#D9E9C4','R')
text(559,949,'Ghi nhận thời gian học có hoạt động',18,'#FFFFFF','S')

heading(56,1012,'3','AI & HIỆN THỰC HÓA')
text(57,1051,'AI hỗ trợ lập trình, thiết kế minh họa.',18,INK)
text(57,1081,'Giáo viên xây dựng, kiểm duyệt học liệu.',18,INK)
text(57,1123,'Tạo lớp → Giao bài → Học & sửa sai',18,GREEN,'S')
text(57,1153,'→ Theo dõi tiến bộ hằng tuần',18,GREEN,'S')

heading(529,1012,'4','KẾT QUẢ TRIỂN KHAI')
text(530,1051,'Sản phẩm web đã hoạt động:',18,INK,'B')
for y,s in [(1081,'Luyện tập - Ôn tập - Kiểm tra online'),(1111,'Hoạt động nhóm - Khu vườn của lớp'),(1141,'Báo cáo tuần: đã đạt / chưa đạt')]:
    text(530,y,s,17,INK)
line(56,1192,944)

heading(56,1238,'5','NHẬN XÉT & HƯỚNG PHÁT TRIỂN')
text(57,1278,'Ưu tiên thói quen tự học và phản hồi kịp thời.',18,INK)
text(57,1308,'Mở rộng học liệu, tiếp tục đánh giá hiệu quả.',18,INK)
text(57,1356,'Trải nghiệm: greenedu.up.railway.app',17,GREEN,'B')

qr=QrCodeWidget('https://greenedu.up.railway.app/')
lowx,lowy,highx,highy=qr.getBounds()
d=Drawing(122,122,transform=[122/(highx-lowx),0,0,122/(highy-lowy),0,0]);d.add(qr)
renderPDF.draw(d,c,812,H-1350)
text(821,1373,'QUÉT ĐỂ XEM',12,GREEN,'B')
c.linkURL('https://greenedu.up.railway.app/',(56,H-1374,590,H-1333),relative=1,thickness=0)
c.save()

reader=PdfReader(target)
writer=PdfWriter()
page=reader.pages[0]
page.scale_to(297/25.4*72,420/25.4*72)
writer.add_page(page)
writer.add_metadata({'/Title':'GreenEdu - Poster hồ sơ sản phẩm 2026 - A3'})
with (OUT/'GreenEdu-Poster-ho-so-2026-A3.pdf').open('wb') as f:writer.write(f)
pdf=pdfium.PdfDocument(str(OUT/'GreenEdu-Poster-ho-so-2026-A3.pdf'))
im=pdf[0].render(scale=300/72).to_pil().convert('RGB')
im.save(OUT/'GreenEdu-Poster-ho-so-2026.png',dpi=(300,300),optimize=True)
im.thumbnail((1200,1700));im.save(OUT/'GreenEdu-Poster-ho-so-2026-preview.png')
print('Created single poster: A0 (template size), A3, PNG 300 dpi and preview.')
