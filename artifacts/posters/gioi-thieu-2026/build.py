from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.graphics import renderPDF
from PIL import Image, ImageOps, ImageDraw
import pypdfium2 as pdfium
from pypdf import PdfReader

OUT = Path(__file__).resolve().parent
ASSETS = OUT / 'assets'
W, H = 1000, 1414
PW, PH = 297/25.4*72, 420/25.4*72
BG, INK, MUTED, GREEN, LINE = '#F8F6EF', '#183E31', '#5C7062', '#236149', '#CDD7C7'
URL = 'https://greenedu.up.railway.app/'
for name, file in [('R','segoeui.ttf'),('B','segoeuib.ttf'),('S','seguisb.ttf')]:
    pdfmetrics.registerFont(TTFont(name, 'C:/Windows/Fonts/'+file))
c = canvas.Canvas(str(OUT/'GreenEdu-Bo-3-poster-A3.pdf'), pagesize=(PW,PH))
c.setTitle('GreenEdu | Nhu cầu - Ý tưởng - Hiện thực hóa')
c.setAuthor('GreenEdu - Trường THPT Nguyễn Khuyến')

def rect(x,y,w,h,fill,r=0):
    c.setFillColor(fill)
    if r: c.roundRect(x,H-y-h,w,h,r,stroke=0,fill=1)
    else: c.rect(x,H-y-h,w,h,stroke=0,fill=1)

def text(x,y,s,size=20,color=INK,font='R'):
    assert x >= 0 and y <= H-20
    assert pdfmetrics.stringWidth(s,font,size) <= W-x-45, (s,size)
    c.setFillColor(color); c.setFont(font,size); c.drawString(x,H-y,s)

def center(x,y,s,size=20,color=INK,font='R'):
    text(x-pdfmetrics.stringWidth(s,font,size)/2,y,s,size,color,font)

def line(x,y,x2,y2,color=LINE,width=1):
    c.setStrokeColor(color);c.setLineWidth(width);c.line(x,H-y,x2,H-y2)

def art(name,y,h):
    c.drawImage(ImageReader(str(ASSETS/name)), 0,H-y-h,W,h,mask='auto')

def crest():
    c.saveState()
    p=c.beginPath();p.moveTo(900,H-40);p.lineTo(940,H-80);p.lineTo(900,H-120);p.lineTo(860,H-80);p.close()
    c.clipPath(p,stroke=0,fill=0)
    c.drawImage(str(ASSETS/'logo-truong.png'),860,H-120,80,80)
    c.restoreState()

def header(n,label):
    c.saveState();c.scale(PW/W,PH/H)
    rect(0,0,W,H,BG)
    text(55,87,'GreenEdu',44,GREEN,'B')
    text(55,112,'CÙNG BẠN NUÔI DƯỠNG TRI THỨC',12,MUTED,'S')
    text(565,72,'TRƯỜNG THPT NGUYỄN KHUYẾN',15,INK,'B')
    text(565,97,'THÀNH PHỐ ĐÀ NẴNG',13,MUTED,'S')
    crest()
    line(55,142,945,142)
    text(55,198,f'0{n}',42,GREEN,'B')
    text(145,194,label,19,GREEN,'B')
    for j in range(1,4):
        rect(825+(j-1)*42,176,31,5,GREEN if j==n else LINE,2)

def footer(n):
    line(55,1344,945,1344)
    text(55,1374,'NGUYỄN THỊ THANH PHƯƠNG  /  GIÁO VIÊN VẬT LÝ',12,MUTED,'S')
    text(840,1374,f'GREENEDU / 0{n}',11,MUTED,'B')
    c.restoreState();c.showPage()

header(1,'NHU CẦU')
text(55,284,'HỌC ĐỀU.',67,INK,'B')
text(55,363,'TIẾN BỘ RÕ.',67,INK,'B')
text(58,410,'Học sinh cần động lực. Giáo viên cần dữ liệu.',24,MUTED)
art('01-nhu-cau.png',442,614)
line(55,1085,945,1085)
for x,num,title,sub in [(55,'01','Đều đặn','Duy trì thói quen tự học.'),(360,'02','Rõ ràng','Nhìn thấy sự tiến bộ.'),(665,'03','Kịp thời','Hỗ trợ đúng lúc cần.')]:
    text(x,1130,num,14,GREEN,'B')
    text(x,1171,title,28,INK,'B')
    text(x,1209,sub,18,MUTED)
rect(55,1250,890,61,GREEN,13)
center(500,1289,'Kết nối việc học và sự đồng hành.',25,'#FFFFFF','S')
footer(1)

header(2,'Ý TƯỞNG')
text(55,284,'GIEO NỖ LỰC.',65,INK,'B')
text(55,363,'NUÔI TRI THỨC.',65,INK,'B')
text(58,410,'Biến việc học mỗi ngày thành một khu vườn.',24,MUTED)
art('02-y-tuong.png',432,600)
for x,label in [(110,'Mầm'),(305,'Chồi'),(500,'Cây Non'),(695,'Đơm Hoa'),(890,'Kết Trái')]:
    center(x,1066,label,20,INK,'B')
line(90,1090,910,1090)
rect(55,1132,890,79,GREEN,15)
for x,label in [(202,'Luyện tập'),(500,'Sửa sai'),(795,'Cây lớn lên')]:
    center(x,1181,label,26,'#FFFFFF','B')
for x in [348,646]:
    line(x-14,1171,x+14,1171,'#BCD9A6',2)
    line(x+6,1163,x+14,1171,'#BCD9A6',2);line(x+6,1179,x+14,1171,'#BCD9A6',2)
center(500,1254,'Cây lớn theo thời gian học có hoạt động.',22,MUTED)
center(500,1296,'Mỗi lớp - mỗi môn - mỗi chương: một hành trình riêng.',19,INK,'S')
footer(2)

header(3,'HIỆN THỰC HÓA')
text(55,284,'TỪ Ý TƯỞNG',65,INK,'B')
text(55,363,'ĐẾN LỚP HỌC.',65,INK,'B')
text(58,410,'Một nền tảng. Kết nối cả lớp.',24,MUTED)
art('03-hien-thuc.png',436,592)
line(55,1052,945,1052)
for x,title,sub1,sub2 in [(55,'Học sinh','Luyện tập - Ôn tập','Sổ tay sửa sai'),(360,'Giáo viên','Giao bài - Mở kiểm tra','Theo dõi học tập tuần'),(665,'Cả lớp','Hoạt động nhóm','Khu vườn chung')]:
    text(x,1098,title,26,INK,'B')
    text(x,1131,sub1,18,MUTED)
    text(x,1158,sub2,18,MUTED)
rect(55,1192,890,128,GREEN,15)
rect(72,1206,100,100,'#FFFFFF',5)
qr=QrCodeWidget(URL);x1,y1,x2,y2=qr.getBounds()
d=Drawing(94,94,transform=[94/(x2-x1),0,0,94/(y2-y1),0,0]);d.add(qr)
renderPDF.draw(d,c,75,H-1303)
text(200,1237,'QUÉT QR ĐỂ TRẢI NGHIỆM',24,'#FFFFFF','B')
text(200,1274,'greenedu.up.railway.app',26,'#D8E8C8','S')
c.linkURL(URL,(200,H-1290,800,H-1209),relative=1,thickness=0)
footer(3)
c.save()

pdf=pdfium.PdfDocument(str(OUT/'GreenEdu-Bo-3-poster-A3.pdf'))
names=['01-Nhu-cau','02-Y-tuong','03-Hien-thuc-hoa']
for i,name in enumerate(names):
    image=pdf[i].render(scale=300/72).to_pil().convert('RGB')
    image.save(OUT/(name+'.png'),dpi=(300,300),optimize=True)
    image.thumbnail((700,990));image.save(OUT/(name+'-xem-nhanh.png'))
sheet=Image.new('RGB',(2140,1050),'#E7E9E1')
for i,name in enumerate(names):
    im=Image.open(OUT/(name+'-xem-nhanh.png'))
    sheet.paste(im,(20+i*710,30))
sheet.save(OUT/'GreenEdu-xem-ca-bo.png')
reader=PdfReader(OUT/'GreenEdu-Bo-3-poster-A3.pdf')
assert len(reader.pages)==3
for i,key in enumerate(['NHU CẦU','Ý TƯỞNG','HIỆN THỰC HÓA']):
    assert key in reader.pages[i].extract_text()
print('Created 3 A3 posters, 300 dpi PNGs, 3-page PDF and overview.')
