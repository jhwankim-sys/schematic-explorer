# A small self-made schematic for the format examples (not a real product). Vector lines + real text.
import sys
from reportlab.lib.pagesizes import A5, landscape
from reportlab.pdfgen import canvas
from reportlab.lib.colors import Color
W, H = landscape(A5)
c = canvas.Canvas(sys.argv[1], pagesize=(W, H)); c.setTitle("Schematic Viewer format sample")
wire = Color(0, 0.52, 0); sym = Color(0.52, 0, 0); txt = Color(0, 0.45, 0.45)
def line(x1, y1, x2, y2, col=wire, w=1.2):
    c.setStrokeColor(col); c.setLineWidth(w); c.line(x1, y1, x2, y2)
def res(x, y, ref, val):  # vertical resistor between (x,y) and (x,y-60)
    c.setStrokeColor(sym); c.setLineWidth(1); c.rect(x - 6, y - 45, 12, 30)
    line(x, y, x, y - 15, sym, 1); line(x, y - 45, x, y - 60, sym, 1)
    c.setFillColor(txt); c.setFont("Helvetica", 9); c.drawString(x + 10, y - 28, ref); c.drawString(x + 10, y - 39, val)
def cap(x, y, ref, val):
    line(x, y, x, y - 26, sym, 1); line(x - 9, y - 26, x + 9, y - 26, sym, 1.5); line(x - 9, y - 32, x + 9, y - 32, sym, 1.5); line(x, y - 32, x, y - 60, sym, 1)
    c.setFillColor(txt); c.setFont("Helvetica", 9); c.drawString(x + 12, y - 25, ref); c.drawString(x + 12, y - 36, val)
def label(x, y, name):
    c.setFillColor(txt); c.setFont("Helvetica", 9); c.drawString(x + 2, y + 3, name)
def gnd(x, y):
    line(x - 8, y, x + 8, y, sym, 1); line(x - 5, y - 3, x + 5, y - 3, sym, 1); line(x - 2, y - 6, x + 2, y - 6, sym, 1)
    c.setFillColor(txt); c.setFont("Helvetica", 7); c.drawString(x - 8, y - 15, "GND")
# U1 box
c.setStrokeColor(sym); c.setLineWidth(1); c.rect(300, 140, 90, 130); c.setFillColor(txt); c.setFont("Helvetica", 10); c.drawString(318, 278, "U1  MCU")
pins = [("VCC", 250), ("EN", 220), ("IO4", 190), ("GND", 160)]
c.setFont("Helvetica", 8)
for name, y in pins:
    line(280, y, 300, y, sym, 1); c.setFillColor(txt); c.drawString(304, y - 3, name)
# VCC rail
line(80, 330, 280, 330); line(280, 330, 280, 250); label(82, 330, "VCC")
res(160, 330, "R1", "10k"); line(160, 270, 160, 220); line(160, 220, 280, 220); label(200, 220, "SENSE_EN")
cap(110, 330, "C1", "100n"); gnd(110, 270)
res(230, 220, "R2", "4.7k"); line(230, 160, 230, 150); gnd(230, 150)
line(280, 190, 262, 190); line(262, 190, 262, 120); line(262, 120, 140, 120); label(160, 120, "LED_OUT")
res(140, 120, "R3", "330"); line(140, 60, 140, 50); gnd(140, 50)
line(280, 160, 280, 120); gnd(280, 120)
c.setFillColor(Color(0.3, 0.3, 0.3)); c.setFont("Helvetica", 8); c.drawString(40, 20, "Schematic Viewer - self-made sample for the help page (not a real product)")
c.showPage(); c.save()
