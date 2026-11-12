# Self-made two-page practice sheet for "Reading schematics" (not a real product). Vector lines + real text.
# Page 1: a crossing without a dot, a T-junction with a dot, a resistor between two named nets, label EN.
# Page 2: another label EN, drawn as a separate (sheet-local) net by intent.
import sys
from reportlab.lib.pagesizes import A5, landscape
from reportlab.pdfgen import canvas
from reportlab.lib.colors import Color
W, H = landscape(A5)
c = canvas.Canvas(sys.argv[1], pagesize=(W, H)); c.setTitle("Schematic Viewer reading practice sample")
c.setCreator("Schematic Viewer gen-read.py"); c.setAuthor("Schematic Viewer")
wire = Color(0, 0.52, 0); sym = Color(0.52, 0, 0); txt = Color(0, 0.45, 0.45)
def line(x1, y1, x2, y2, col=wire, w=1.2):
    c.setStrokeColor(col); c.setLineWidth(w); c.line(x1, y1, x2, y2)
def dot(x, y):
    c.setFillColor(wire); c.circle(x, y, 2.6, stroke=0, fill=1)
def label(x, y, name):
    c.setFillColor(txt); c.setFont("Helvetica", 9); c.drawString(x + 2, y + 3, name)
def resh(x, y, ref, val):  # horizontal resistor from (x,y) to (x+60,y)
    line(x, y, x + 15, y, sym, 1); c.setStrokeColor(sym); c.setLineWidth(1); c.rect(x + 15, y - 6, 30, 12); line(x + 45, y, x + 60, y, sym, 1)
    c.setFillColor(txt); c.setFont("Helvetica", 9); c.drawString(x + 18, y + 10, ref); c.drawString(x + 18, y - 17, val)
def resv(x, y, ref, val):  # vertical resistor from (x,y) down to (x,y-60)
    line(x, y, x, y - 15, sym, 1); c.setStrokeColor(sym); c.setLineWidth(1); c.rect(x - 6, y - 45, 12, 30); line(x, y - 45, x, y - 60, sym, 1)
    c.setFillColor(txt); c.setFont("Helvetica", 9); c.drawString(x + 10, y - 28, ref); c.drawString(x + 10, y - 39, val)
def gndlab(x, y):  # ground as a short wire with the name GND (a schematic-wide power name in most CAD)
    line(x, y, x + 40, y); label(x + 6, y, "GND")
def foot(p):
    c.setFillColor(Color(0.3, 0.3, 0.3)); c.setFont("Helvetica", 8)
    c.drawString(40, 20, f"Schematic Viewer - self-made reading practice sheet, page {p}/2 (not a real product)")
# ---- page 1
# A: horizontal wire, B: vertical wire crossing it at (200, 300) with no dot
line(60, 300, 380, 300); label(62, 300, "SIG_A")
line(150, 370, 200, 370); label(152, 370, "SIG_B"); line(200, 370, 200, 230); resv(200, 230, "R4", "1k"); gndlab(200, 170)
# T-junction with a dot: a branch from SIG_A down to R5
line(320, 300, 320, 250); dot(320, 300); resv(320, 250, "R5", "10k"); gndlab(320, 190)
# a resistor between two named nets
line(60, 120, 140, 120); label(62, 120, "IN_L"); resh(140, 120, "R1", "100"); line(200, 120, 300, 120); label(240, 120, "OUT_R")
# label EN on page 1
line(420, 300, 500, 300); label(422, 300, "EN"); resv(500, 300, "R2", "4.7k"); gndlab(500, 240)
foot(1); c.showPage()
# ---- page 2
line(80, 300, 200, 300); label(82, 300, "EN"); resv(200, 300, "R3", "4.7k"); gndlab(200, 240)
foot(2); c.showPage(); c.save()
