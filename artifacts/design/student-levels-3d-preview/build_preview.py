from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
import pypdfium2 as pdfium

ROOT=Path(__file__).resolve().parent
W,H=1600,1120
for name,file in [('R','segoeui.ttf'),('B','segoeuib.ttf')]:
    pdfmetrics.registerFont(TTFont(name,'C:/Windows/Fonts/'+file))
c=canvas.Canvas(str(ROOT/'GreenEdu-icon-3D-preview.pdf'),pagesize=(W,H))
c.setTitle('GreenEdu - Xem trước bộ icon cấp độ 3D')
def box(x,y,w,h,color,r=0):
    c.setFillColor(color)
    c.roundRect(x,H-y-h,w,h,r,stroke=0,fill=1)
def text(x,y,s,size=22,color='#204936',font='R'):
    c.setFillColor(color);c.setFont(font,size);c.drawString(x,H-y,s)
def icon(i,x,y,size):
    c.drawImage(ImageReader(str(ROOT/'assets'/f'level-{i}.png')),x,H-y-size,size,size,mask='auto')
box(0,0,W,H,'#F6F5EF')
text(48,70,'GreenEdu',38,font='B')
text(48,114,'BỘ CẤP ĐỘ 3D',30,font='B')
text(48,150,'Bản xem trước theo phong cách cây kiến thức trong poster',21,color='#687A69')
box(1220,48,330,49,'#E7EEDB',20)
text(1252,80,'CHỜ BẠN DUYỆT',19,font='B')
names=['Mầm','Chồi','Cây Non','Đơm Hoa','Kết Trái']
for i,name in enumerate(names,1):
    x=48+(i-1)*304
    box(x,190,288,410,'#FFFFFF',22)
    text(x+22,227,f'CẤP {i}',15,color='#7A8D71',font='B')
    icon(i,x+5,237,278)
    center=x+144-pdfmetrics.stringWidth(name,'B',27)/2
    text(center,556,name,27,font='B')
text(48,662,'KHI THU NHỎ',18,font='B')
text(48,696,'Cùng bộ icon ở kích thước 64 px',17,color='#687A69')
for i in range(1,6):
    icon(i,568+(i-1)*196,632,64)
    text(575+(i-1)*196,728,names[i-1],17,font='B')
box(48,775,730,238,'#FFFFFF',22)
text(77,819,'MINH HỌA TRONG THẺ CHƯƠNG',17,color='#71816A',font='B')
icon(3,81,842,132)
text(241,889,'Chương I · Dao động',26,font='B')
text(241,930,'Cấp 3 · Cây Non',21,color='#687A69')
box(806,775,746,238,'#E8EFD9',22)
text(834,819,'MINH HỌA TRONG KHU VƯỜN',17,color='#71816A',font='B')
for i in range(1,6):
    x=842+(i-1)*138
    icon(i,x,851,105)
    label=names[i-1]
    text(x+52.5-pdfmetrics.stringWidth(label,'R',15)/2,983,label,15)
text(48,1070,'Chưa thay bộ hiện tại. Chưa push hoặc deploy.',19,color='#687A69')
text(1258,1070,'Nền trong suốt · PNG',17,color='#687A69')
c.save()
pdf=pdfium.PdfDocument(str(ROOT/'GreenEdu-icon-3D-preview.pdf'))
pdf[0].render(scale=1.5).to_pil().save(ROOT/'GreenEdu-icon-3D-preview.png')
print(ROOT/'GreenEdu-icon-3D-preview.png')
