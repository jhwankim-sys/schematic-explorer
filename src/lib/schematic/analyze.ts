// Pure schematic analysis: turns raw PDF vector paths + text items into
// drawable geometry, classified labels and electrically-connected nets.
// No DOM / pdf.js dependencies so it can be tested in isolation.
//
// Every distance below is expressed relative to the page's typical text height
// (S) or the wire line width, so the same rules work for Altium, KiCad, Eagle,
// OrCAD … exports at any paper size. Where the CAD tool colours wires
// differently from symbols (almost all of them), the wire colour is detected
// first and only that colour is treated as wiring.

import { decodePin, markerFonts, splitMarkerWords, type CadNetlist } from "./cad-hints.ts";

export type PaintOp = "stroke" | "fill" | "fillStroke" | "none";

export interface RawPath {
  op: PaintOp;
  /** pdf.js DrawOPS-encoded data: 0 moveTo(x,y) 1 lineTo(x,y) 2 curveTo(6) 3 quadTo(4) 4 close */
  data: ArrayLike<number>;
  /** current transform matrix applied to the path coordinates */
  ctm: number[];
  /** stroke width in page units */
  lineWidth?: number;
  /** "#rrggbb" */
  stroke?: string;
  fill?: string;
}

export interface RawText {
  str: string;
  /** pdf.js text transform in PDF user space */
  transform: number[];
  width: number;
  height: number;
  font?: string;
}

export type TextKind = "component" | "net" | "pin" | "value" | "note";

export interface SchText {
  id: number;
  str: string;
  kind: TextKind;
  /** bbox in view space (y down) */
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  /** baseline anchor for rendering */
  ax: number;
  ay: number;
  size: number;
  /** rotation in degrees, view space */
  rot: number;
  /** net this label is attached to (−1 if none) */
  net: number;
  /** text lies inside an IC / module body outline (pin name) */
  inBody: boolean;
  /** how a label was tied to its wire (debugging aid) */
  via?: "symbol" | "flag" | "along" | "near";
}

export interface SchNet {
  id: number;
  /** display name ("" when unnamed) */
  name: string;
  /** every label text id attached to this net */
  labels: number[];
  /** wire segment indexes */
  segs: number[];
  bbox: [number, number, number, number];
}

export interface SchComponent {
  ref: string;
  textIds: number[];
  /** nearby value / part-number texts */
  values: string[];
}

export interface SchDot {
  x: number;
  y: number;
  r: number;
  net: number;
}

/** pin position known exactly from CAD markers (Altium) */
export interface SchPin {
  name: string;
  box: [number, number, number, number];
  net: number;
}

export interface SchPage {
  index: number;
  width: number;
  height: number;
  strokePath: string;
  fillPath: string;
  /** wire segments, flat [x1,y1,x2,y2,...] in view space */
  segs: Float64Array;
  segNet: Int32Array;
  dots: SchDot[];
  texts: SchText[];
  nets: SchNet[];
  components: SchComponent[];
  pins: SchPin[];
  /** true when the PDF draws its lettering as vector strokes (text layer is invisible) */
  vectorText: boolean;
  /** how wires were told apart, for the maintenance report */
  wireStyle: string;
  /** typical text height on the page */
  textSize: number;
}

export interface AnalyzeOptions {
  cadNetlist?: CadNetlist | null;
  /** use CAD netlist hints for connectivity (default true) */
  useHints?: boolean;
}

type Pt = [number, number];
type Box = [number, number, number, number];

// ---------------------------------------------------------------- text classification

const VALUE =
  /^(?:[0-9]+(?:[.,/][0-9]+)?\s*(?:[pnuµμmkKMGR]|ohm|Ω)?\s*(?:[0-9]+)?(?:F|H|V|W|A|ohm|Ω|Hz|%|nF|uF|µF|pF|nH|uH|mA|mW)?(?:[\s/_,(].*)?|[0-9]+[pnuµμmkKMR][0-9]+(?:[\s/_,(].*)?|DNP|NC|N\.?C\.?|NA|TBD|NA\(.*\)|DNP\(.*\))$/i;
/** part numbers with a package / rating in brackets: 1N5819S4(SOD-123), T1107A(6x3,8x2,5MM) */
const PART_PAREN = /^[A-Z0-9][\w.+#-]*\((?=[^)]*\d)[^)]*\)[\w.+/-]*$/i;
const PART = /^[A-Z0-9]+(?:[-/.][A-Z0-9().#]+)+$|^[A-Z]{2,}[0-9]{2,}[A-Z0-9-/#]*$/;
/** signal names that look like part numbers (GPIO19, PA10, ADC12) */
const SIGNAL = /^(?:GPIO|GPI|GPO|IO|P[A-K]|PORT|ADC|AIN|AN|DAC|PWM|UART|USART|SPI|I2C|IIC|SCL|SDA|TXD?|RXD?|CAN|USB|LED|BTN|BUT|SW|EN|RST|INT|IRQ|CS|SS|CLK|SCK|MOSI|MISO|DATA|ADDR|BOOT|TP|EXT|AD|AF|HS|MTMS|MTDI|MTCK|MTDO|SD|D|A)\d+/i;
const POWER = /^(?:[+-]?\d+(?:[.,]\d+)?V\d*\w*|\d+V\d+\w*|[+-]\d+\w*|V?GND\w*|VCC\w*|VDD\w*|VSS\w*|VEE\w*|VBAT\w*|VBUS\w*|VIN\w*|AGND|DGND|PGND|SGND|EARTH)$/i;
// Reference designators. Families accepted:
//  - suffixed style:  R47Q, C88W, U77Q, ZD90W  (letters + 2-3 digits + 1-2 letters)
//  - standard style:  R1, C12, U3, IC5, J2, CN1, SB12, LD1 … (+ optional gate letter U4A)
const STD_PREFIX =
  "R|C|L|D|Q|U|IC|J|P|CN|TP|F|FB|SW|S|Y|X|XT|T|K|RY|LED|LD|ZD|VR|RV|BD|TR|RN|RA|RM|M|MH|JP|SJ|SB|BT|BAT|FL|FID|CR|DS|PS|RT|TH|VD|VT|TVS|ESD|MOV|PTC|NTC|OSC|XTAL|ANT|CON|USB|LS|BZ|MIC|SP|HS|SH|BUT|PB|LAN|EXT";
const REFDES = new RegExp(`^(?:[A-Z]{1,4}\\d{2,3}[A-Z]{1,2}|(?:${STD_PREFIX})\\d{1,4}[A-Z]?)$`);
const CONNECTOR_REF = /^\*?W?CN(?:[_\d]|$)/;
/** descriptive references some libraries use: PWRLED1, MICRO_SD1, USB-UART1 */
const LOOSE_REF = /^[A-Z][A-Z0-9_-]{1,14}\d{1,3}[A-Z]?$/;

export function classifyText(str: string): TextKind {
  const s = str.trim();
  if (!s) return "note";
  if (/^\d{1,4}$/.test(s)) return "pin";
  // grid-style pin names (USB-C A1…B12, BGA balls)
  if (/^[AB]\d{1,2}$/.test(s)) return "pin";
  if (/^PWR_FLAG$/i.test(s)) return "note";
  if (POWER.test(s)) return "net";
  if (VALUE.test(s)) return "value";
  if (/\s/.test(s)) return "note";
  if (/^\*/.test(s)) return "component";
  if (REFDES.test(s)) return "component";
  if (CONNECTOR_REF.test(s)) return "component";
  if (PART.test(s) && !/_/.test(s) && !SIGNAL.test(s)) return "value";
  if (PART_PAREN.test(s) && !/[\\/]/.test(s.split("(")[0])) return "value";
  if (s.length < 2) return "pin";
  if (!/[A-Z]/i.test(s)) return "note";
  return "net";
}

export function isPowerName(s: string) {
  return POWER.test(s);
}

// ---------------------------------------------------------------- helpers

function mul(m: number[], x: number, y: number): Pt {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}

function fmt(n: number): string {
  return (Math.round(n * 100) / 100).toString();
}

class DSU {
  p: Int32Array;
  constructor(n: number) {
    this.p = new Int32Array(n);
    for (let i = 0; i < n; i++) this.p[i] = i;
  }
  find(a: number): number {
    while (this.p[a] !== a) {
      this.p[a] = this.p[this.p[a]];
      a = this.p[a];
    }
    return a;
  }
  union(a: number, b: number) {
    a = this.find(a);
    b = this.find(b);
    if (a !== b) this.p[b] = a;
  }
}

/** Uniform grid spatial hash for boxes. */
export class Grid {
  cell: number;
  map = new Map<number, number[]>();
  constructor(cell: number) {
    this.cell = cell;
  }
  private key(gx: number, gy: number) {
    return gx * 100003 + gy;
  }
  add(id: number, x0: number, y0: number, x1: number, y1: number) {
    const c = this.cell;
    for (let gx = Math.floor(x0 / c); gx <= Math.floor(x1 / c); gx++)
      for (let gy = Math.floor(y0 / c); gy <= Math.floor(y1 / c); gy++) {
        const k = this.key(gx, gy);
        const a = this.map.get(k);
        if (a) a.push(id);
        else this.map.set(k, [id]);
      }
  }
  query(x0: number, y0: number, x1: number, y1: number): number[] {
    const c = this.cell;
    const out = new Set<number>();
    for (let gx = Math.floor(x0 / c); gx <= Math.floor(x1 / c); gx++)
      for (let gy = Math.floor(y0 / c); gy <= Math.floor(y1 / c); gy++) {
        const a = this.map.get(this.key(gx, gy));
        if (a) for (const id of a) out.add(id);
      }
    return [...out];
  }
}

interface SubPath {
  pts: Pt[];
  /** per segment i (pts[i]→pts[i+1]): true if a straight line */
  straight: boolean[];
  closed: boolean;
}

function splitSubpaths(p: RawPath, H: number): SubPath[] {
  const d = p.data;
  const out: SubPath[] = [];
  let cur: SubPath | null = null;
  const tp = (x: number, y: number): Pt => {
    const [px, py] = mul(p.ctm, x, y);
    return [px, H - py];
  };
  let i = 0;
  while (i < d.length) {
    const o = d[i];
    if (o === 0) {
      if (cur && cur.pts.length) out.push(cur);
      cur = { pts: [tp(d[i + 1], d[i + 2])], straight: [], closed: false };
      i += 3;
    } else if (o === 1) {
      if (cur) {
        cur.pts.push(tp(d[i + 1], d[i + 2]));
        cur.straight.push(true);
      }
      i += 3;
    } else if (o === 2) {
      if (cur) {
        cur.pts.push(tp(d[i + 5], d[i + 6]));
        cur.straight.push(false);
      }
      i += 7;
    } else if (o === 3) {
      if (cur) {
        cur.pts.push(tp(d[i + 3], d[i + 4]));
        cur.straight.push(false);
      }
      i += 5;
    } else if (o === 4) {
      if (cur) {
        cur.closed = true;
        const a = cur.pts[0];
        const b = cur.pts[cur.pts.length - 1];
        if (Math.abs(a[0] - b[0]) > 1e-3 || Math.abs(a[1] - b[1]) > 1e-3) {
          cur.pts.push([a[0], a[1]]);
          cur.straight.push(true);
        }
      }
      i += 1;
    } else {
      i += 1;
    }
  }
  if (cur && cur.pts.length) out.push(cur);
  for (const s of out) {
    const a = s.pts[0];
    const b = s.pts[s.pts.length - 1];
    if (s.pts.length > 3 && Math.abs(a[0] - b[0]) < 1e-3 && Math.abs(a[1] - b[1]) < 1e-3) s.closed = true;
  }
  return out;
}

function pathToD(raw: RawPath, H: number): string {
  const d = raw.data;
  const parts: string[] = [];
  let i = 0;
  const P = (x: number, y: number) => {
    const [px, py] = mul(raw.ctm, x, y);
    return fmt(px) + " " + fmt(H - py);
  };
  while (i < d.length) {
    const o = d[i];
    if (o === 0) {
      parts.push("M" + P(d[i + 1], d[i + 2]));
      i += 3;
    } else if (o === 1) {
      parts.push("L" + P(d[i + 1], d[i + 2]));
      i += 3;
    } else if (o === 2) {
      parts.push("C" + P(d[i + 1], d[i + 2]) + " " + P(d[i + 3], d[i + 4]) + " " + P(d[i + 5], d[i + 6]));
      i += 7;
    } else if (o === 3) {
      parts.push("Q" + P(d[i + 1], d[i + 2]) + " " + P(d[i + 3], d[i + 4]));
      i += 5;
    } else if (o === 4) {
      parts.push("Z");
      i += 1;
    } else i += 1;
  }
  return parts.join("");
}

export function distPtSeg(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  let t = l2 > 0 ? ((px - x1) * dx + (py - y1) * dy) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx - px;
  const cy = y1 + t * dy - py;
  return Math.sqrt(cx * cx + cy * cy);
}

/** distance between an axis-aligned box and a segment (exact for orthogonal ones) */
function distBoxSeg(b: Box, x1: number, y1: number, x2: number, y2: number): number {
  if (x1 !== x2 && y1 !== y2 && Math.abs(x1 - x2) > 0.05 && Math.abs(y1 - y2) > 0.05) {
    // diagonal: sample
    let best = Infinity;
    for (let k = 0; k <= 8; k++) {
      const x = x1 + ((x2 - x1) * k) / 8;
      const y = y1 + ((y2 - y1) * k) / 8;
      best = Math.min(best, Math.hypot(Math.max(b[0] - x, 0, x - b[2]), Math.max(b[1] - y, 0, y - b[3])));
    }
    return best;
  }
  const sx0 = Math.min(x1, x2);
  const sx1 = Math.max(x1, x2);
  const sy0 = Math.min(y1, y2);
  const sy1 = Math.max(y1, y2);
  const dx = Math.max(b[0] - sx1, 0, sx0 - b[2]);
  const dy = Math.max(b[1] - sy1, 0, sy0 - b[3]);
  return Math.sqrt(dx * dx + dy * dy);
}

function median(v: number[]): number {
  if (!v.length) return NaN;
  const s = [...v].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

function colorDistance(a: string, b: string): number {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) || 0);
  const [r1, g1, b1] = p(a);
  const [r2, g2, b2] = p(b);
  return Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
}

/** near-black / grey: carries no "this is a wire" information */
function isNeutral(c: string): boolean {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16) || 0);
  return Math.max(r, g, b) - Math.min(r, g, b) < 24;
}

// ---------------------------------------------------------------- analysis

interface Prim {
  sp: SubPath;
  op: PaintOp;
  style: string;
  color: string;
  width: number;
  box: Box;
  glyph: boolean;
}

export function analyzePage(
  index: number,
  width: number,
  height: number,
  paths: RawPath[],
  rawTexts: RawText[],
  opts: AnalyzeOptions = {},
): SchPage {
  const H = height;
  const useHints = opts.useHints !== false;

  // ---- CAD marker texts (Altium) are invisible: keep them apart
  const mFonts = markerFonts(rawTexts.map((t) => ({ str: t.str, font: t.font ?? "" })));
  const markerTexts: RawText[] = [];
  const visible: RawText[] = [];
  for (const t of rawTexts) (mFonts.has(t.font ?? "") ? markerTexts : visible).push(t);

  // ---- texts → view-space boxes
  const texts: SchText[] = [];
  const toBox = (t: RawText) => {
    const [a, b, c, d, e, f] = t.transform;
    const n = Math.hypot(a, b) || 1;
    const ux = a / n;
    const uy = b / n;
    // perpendicular follows the text's own up vector (handles mirrored/skewed matrices)
    const vn = Math.hypot(c, d) || 1;
    const vx = c / vn;
    const vy = d / vn;
    const h = t.height || vn;
    const corners: Pt[] = [
      [e, f],
      [e + ux * t.width, f + uy * t.width],
      [e + vx * h, f + vy * h],
      [e + ux * t.width + vx * h, f + uy * t.width + vy * h],
    ];
    const xs = corners.map((p) => p[0]);
    const ys = corners.map((p) => H - p[1]);
    return { box: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] as Box, h, e, f, ux, uy };
  };
  for (const t of visible) {
    const str = t.str.trim();
    if (!str) continue;
    const { box, h, e, f, ux, uy } = toBox(t);
    texts.push({
      id: texts.length,
      str,
      kind: classifyText(str),
      x0: box[0],
      y0: box[1],
      x1: box[2],
      y1: box[3],
      ax: e,
      ay: H - f,
      size: h,
      rot: -Math.round((Math.atan2(uy, ux) * 180) / Math.PI),
      net: -1,
      inBody: false,
    });
  }
  // typical lettering height: everything else scales with it
  const S = Math.min(Math.max(median(texts.filter((t) => t.str.length >= 2).map((t) => t.size)) || 6, 1.2), 40);

  // words that continue a sentence on the same baseline are annotations, not labels
  {
    const byLine = new Map<string, SchText[]>();
    for (const t of texts) {
      const base = t.rot === 0 ? t.ay : t.ax;
      const key = t.rot + ":" + Math.round((base * 3) / Math.max(S / 6, 0.2));
      const a = byLine.get(key);
      if (a) a.push(t);
      else byLine.set(key, [t]);
    }
    for (const line of byLine.values()) {
      if (line.length < 2) continue;
      const horiz = line[0].rot === 0;
      line.sort((a, b) => (horiz ? a.x0 - b.x0 : a.y0 - b.y0));
      for (let i = 1; i < line.length; i++) {
        const a = line[i - 1];
        const b = line[i];
        const gap = horiz ? b.x0 - a.x1 : b.y0 - a.y1;
        if (gap > -0.3 && gap < Math.min(a.size, b.size) * 0.6 && a.kind !== "pin" && b.kind !== "pin") {
          if (a.kind !== "value" || b.kind !== "value") {
            a.kind = "note";
            b.kind = "note";
          }
        }
      }
    }
  }

  const textGrid = new Grid(Math.max(4, S * 2));
  texts.forEach((t) => textGrid.add(t.id, t.x0 - t.size, t.y0 - t.size, t.x1 + t.size, t.y1 + t.size));
  /** vector-drawn glyphs sit on top of the (invisible) text layer, but font metrics differ slightly */
  const insideText = (box: Box) => {
    const bw = box[2] - box[0];
    const bh = box[3] - box[1];
    const cx = (box[0] + box[2]) / 2;
    const cy = (box[1] + box[3]) / 2;
    for (const id of textGrid.query(cx, cy, cx, cy)) {
      const t = texts[id];
      const s = t.size;
      if (Math.max(bw, bh) > s * 1.6) continue;
      const m = 0.45 * s;
      if (box[0] >= t.x0 - m && box[2] <= t.x1 + m && box[1] >= t.y0 - m && box[3] <= t.y1 + m) return true;
    }
    return false;
  };

  // ---- primitives
  const strokeParts: string[] = [];
  const fillParts: string[] = [];
  const prims: Prim[] = [];
  const pageDiag = Math.hypot(width, height);
  for (const raw of paths) {
    if (raw.op === "none") continue;
    if (raw.op === "fill" || raw.op === "fillStroke") fillParts.push(pathToD(raw, H));
    if (raw.op === "stroke" || raw.op === "fillStroke") strokeParts.push(pathToD(raw, H));
    const color = ((raw.op === "fill" ? raw.fill : raw.stroke) ?? "#000000").toLowerCase();
    const w = raw.lineWidth ?? 0;
    const style = `${raw.op === "fill" ? "F" : "S"}${color}/${w.toFixed(2)}`;
    for (const sp of splitSubpaths(raw, H)) {
      let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
      for (const [x, y] of sp.pts) {
        if (x < bx0) bx0 = x;
        if (y < by0) by0 = y;
        if (x > bx1) bx1 = x;
        if (y > by1) by1 = y;
      }
      const box: Box = [bx0, by0, bx1, by1];
      prims.push({ sp, op: raw.op, style, color, width: w, box, glyph: insideText(box) });
    }
  }

  // styles mostly made of glyph strokes are text styles: their stray strokes are glyphs too
  interface StyleStat {
    n: number;
    glyph: number;
    orthLen: number;
    orthN: number;
    closed: number;
    color: string;
    width: number;
    fill: boolean;
  }
  const stats = new Map<string, StyleStat>();
  for (const p of prims) {
    const st = stats.get(p.style) ?? stats.set(p.style, { n: 0, glyph: 0, orthLen: 0, orthN: 0, closed: 0, color: p.color, width: p.width, fill: p.op === "fill" }).get(p.style)!;
    st.n++;
    if (p.glyph) st.glyph++;
    if (p.sp.closed) st.closed++;
    // frame / title-block rules span the sheet: keep them out of the statistics
    if (Math.max(p.box[2] - p.box[0], p.box[3] - p.box[1]) > pageDiag * 0.4) continue;
    for (let k = 0; k < p.sp.straight.length; k++) {
      if (!p.sp.straight[k]) continue;
      const [x1, y1] = p.sp.pts[k];
      const [x2, y2] = p.sp.pts[k + 1];
      if (Math.abs(x1 - x2) < 0.02 || Math.abs(y1 - y2) < 0.02) {
        st.orthLen += Math.hypot(x2 - x1, y2 - y1);
        st.orthN++;
      }
    }
  }
  const textStyles = new Set<string>();
  stats.forEach((st, k) => {
    if (st.n >= 20 && st.glyph / st.n >= 0.85) textStyles.add(k);
  });
  let glyphCount = 0;
  for (const p of prims) {
    if (!p.glyph && textStyles.has(p.style) && Math.max(p.box[2] - p.box[0], p.box[3] - p.box[1]) < S * 1.2) p.glyph = true;
    if (p.glyph) glyphCount++;
  }

  // ---- junction dots: small round fills
  const dotsAll: { x: number; y: number; r: number; color: string }[] = [];
  for (const p of prims) {
    if (p.op === "stroke" || p.glyph) continue;
    const bw = p.box[2] - p.box[0];
    const bh = p.box[3] - p.box[1];
    const roundish = p.sp.straight.some((s) => !s) || p.sp.pts.length >= 7;
    if (roundish && bw > S * 0.12 && bw < S * 1.3 && Math.abs(bw - bh) < Math.max(bw, bh) * 0.25)
      dotsAll.push({ x: (p.box[0] + p.box[2]) / 2, y: (p.box[1] + p.box[3]) / 2, r: bw / 2, color: p.color });
  }
  // the same dot is often filled and stroked: de-duplicate
  const dotsU: typeof dotsAll = [];
  {
    const g = new Grid(Math.max(2, S));
    for (const d of dotsAll) {
      const dup = g.query(d.x, d.y, d.x, d.y).some((i) => Math.hypot(dotsU[i].x - d.x, dotsU[i].y - d.y) < d.r * 0.5);
      if (dup) continue;
      g.add(dotsU.length, d.x, d.y, d.x, d.y);
      dotsU.push(d);
    }
  }

  // ---- which stroke style is the wiring?
  const strokeStyles = [...stats.entries()].filter(([k, st]) => !st.fill && !textStyles.has(k) && st.orthN > 0);
  const totalOrth = strokeStyles.reduce((a, [, st]) => a + st.orthLen, 0) || 1;
  const coloured = strokeStyles.filter(([, st]) => st.orthLen / totalOrth > 0.03 && !isNeutral(st.color));
  const colours = new Set(strokeStyles.filter(([, st]) => st.orthLen / totalOrth > 0.03).map(([, st]) => st.color));
  let wireStyles: Set<string> | null = null;
  let wireStyleName = "monochrome";
  if (colours.size >= 2 && coloured.length) {
    let best: string | null = null;
    let bestScore = 0;
    for (const [k, st] of strokeStyles) {
      if (st.orthLen / totalOrth < 0.02) continue;
      const mean = st.orthLen / st.orthN;
      const dotMatch = dotsU.length ? dotsU.filter((d) => colorDistance(d.color, st.color) < 40).length / dotsU.length : 0;
      const longish = Math.min(mean / (S * 3), 3);
      const score = (st.orthLen / totalOrth) * longish * (1 - Math.min(st.closed / st.n, 0.8)) * (1 + 4 * dotMatch) * (isNeutral(st.color) ? 0.6 : 1);
      if (mean > S * 1.5 && score > bestScore) {
        bestScore = score;
        best = k;
      }
    }
    if (best) {
      const bs = stats.get(best)!;
      wireStyles = new Set([best]);
      // the same colour drawn a touch thinner/thicker is the same wiring (e.g. zoomed exports)
      stats.forEach((st, k) => {
        if (k !== best && !st.fill && !textStyles.has(k) && colorDistance(st.color, bs.color) < 20 && Math.abs(st.width - bs.width) <= Math.max(0.15, bs.width * 0.35) && st.orthN && st.orthLen / st.orthN > S)
          wireStyles!.add(k);
      });
      wireStyleName = `${bs.color} ${bs.width.toFixed(2)}`;
    }
  }
  const colourMode = !!wireStyles;

  // ---- geometry
  const wire: number[] = []; // x1,y1,x2,y2
  const bodies: Box[] = [];
  const symbols: Box[] = [];
  const triangles: Box[] = [];
  const bars: [number, number, number, number][] = [];
  /** straight symbol lines (pins): a name written along one of these is a pin name, not a net label */
  const pinLines: number[] = [];

  for (const p of prims) {
    if (p.glyph) continue;
    const { sp, box } = p;
    const bw = box[2] - box[0];
    const bh = box[3] - box[1];
    const isWireStyle = colourMode ? wireStyles!.has(p.style) : p.op !== "fill";
    if (sp.closed && sp.straight.every(Boolean)) {
      const vs: Pt[] = [];
      for (const q of sp.pts) if (!vs.some((v) => Math.abs(v[0] - q[0]) < 0.05 && Math.abs(v[1] - q[1]) < 0.05)) vs.push(q);
      if (vs.length === 3 && Math.max(bw, bh) > S * 0.15 && Math.max(bw, bh) < S * 1.6) triangles.push(box);
    }
    if (p.op === "fill") {
      if (Math.max(bw, bh) < S * 1.8) symbols.push(box);
      continue;
    }
    const curvedOrDiag = sp.straight.some((st, k) => {
      if (!st) return true;
      const [x1, y1] = sp.pts[k];
      const [x2, y2] = sp.pts[k + 1];
      return !(Math.abs(x1 - x2) < 0.02 || Math.abs(y1 - y2) < 0.02);
    });
    if ((sp.closed || curvedOrDiag || !isWireStyle) && Math.max(bw, bh) < S * 2.2) symbols.push(box);
    // short straight strokes: candidates for ground-symbol bars
    if (!sp.closed)
      for (let k = 0; k < sp.straight.length; k++) {
        if (!sp.straight[k]) continue;
        const [x1, y1] = sp.pts[k];
        const [x2, y2] = sp.pts[k + 1];
        const l = Math.hypot(x2 - x1, y2 - y1);
        if (l >= S * 0.2 && l <= S * 3 && (Math.abs(x1 - x2) < 0.02 || Math.abs(y1 - y2) < 0.02)) bars.push([x1, y1, x2, y2]);
      }
    if (colourMode && !isWireStyle && !sp.closed)
      for (let k = 0; k < sp.straight.length; k++) {
        if (!sp.straight[k]) continue;
        const [x1, y1] = sp.pts[k];
        const [x2, y2] = sp.pts[k + 1];
        const l = Math.hypot(x2 - x1, y2 - y1);
        if (l >= S * 0.8 && (Math.abs(x1 - x2) < 0.02 || Math.abs(y1 - y2) < 0.02)) pinLines.push(x1, y1, x2, y2);
      }
    if (sp.closed && (!colourMode || !isWireStyle)) {
      if (bw > S * 0.8 && bh > S * 0.4) bodies.push(box);
      continue;
    }
    if (!isWireStyle) continue;
    // sheet frame / zone rulers
    if (Math.max(bw, bh) > pageDiag * 0.45) continue;
    for (let k = 0; k < sp.straight.length; k++) {
      if (!sp.straight[k]) continue;
      const [x1, y1] = sp.pts[k];
      const [x2, y2] = sp.pts[k + 1];
      const orth = Math.abs(x1 - x2) < 0.02 || Math.abs(y1 - y2) < 0.02;
      if (!orth && !colourMode) continue;
      if (Math.hypot(x2 - x1, y2 - y1) < 0.05) continue;
      wire.push(x1, y1, x2, y2);
    }
  }

  // monochrome drawings: rectangles drawn as four separate lines are part bodies, not wires
  if (!colourMode) {
    const nS = wire.length / 4;
    const endKey = (x: number, y: number) => `${Math.round(x * 10)},${Math.round(y * 10)}`;
    const at = new Map<string, number[]>();
    for (let s = 0; s < nS; s++)
      for (const e of [0, 1]) {
        const k = endKey(wire[4 * s + 2 * e], wire[4 * s + 2 * e + 1]);
        (at.get(k) ?? at.set(k, []).get(k)!).push(s);
      }
    const drop = new Set<number>();
    for (let s = 0; s < nS; s++) {
      if (drop.has(s)) continue;
      const x1 = wire[4 * s], y1 = wire[4 * s + 1], x2 = wire[4 * s + 2], y2 = wire[4 * s + 3];
      if (Math.abs(y1 - y2) > 0.02) continue; // start from a horizontal edge
      // walk: corner → vertical → horizontal → vertical back
      const other = (seg: number, x: number, y: number): Pt => {
        const ax = wire[4 * seg], ay = wire[4 * seg + 1];
        return Math.hypot(ax - x, ay - y) < 0.15 ? [wire[4 * seg + 2], wire[4 * seg + 3]] : [ax, ay];
      };
      for (const v1 of at.get(endKey(x2, y2)) ?? []) {
        if (v1 === s || Math.abs(wire[4 * v1] - wire[4 * v1 + 2]) > 0.02) continue;
        const c2 = other(v1, x2, y2);
        for (const h2 of at.get(endKey(c2[0], c2[1])) ?? []) {
          if (h2 === v1 || Math.abs(wire[4 * h2 + 1] - wire[4 * h2 + 3]) > 0.02) continue;
          const c3 = other(h2, c2[0], c2[1]);
          for (const v2 of at.get(endKey(c3[0], c3[1])) ?? []) {
            if (v2 === h2 || Math.abs(wire[4 * v2] - wire[4 * v2 + 2]) > 0.02) continue;
            const c4 = other(v2, c3[0], c3[1]);
            if (Math.hypot(c4[0] - x1, c4[1] - y1) > 0.15) continue;
            const box: Box = [Math.min(x1, x2), Math.min(y1, c2[1]), Math.max(x1, x2), Math.max(y1, c2[1])];
            const hasText = textGrid.query(box[0], box[1], box[2], box[3]).some((id) => {
              const t = texts[id];
              const cx = (t.x0 + t.x1) / 2, cy = (t.y0 + t.y1) / 2;
              return cx > box[0] && cx < box[2] && cy > box[1] && cy < box[3];
            });
            // a loop with lettering inside is a part body; a tiny one (resistor, fuse, crystal) is too
            if (hasText || Math.max(box[2] - box[0], box[3] - box[1]) <= S * 3) {
              bodies.push(box);
              drop.add(s).add(v1).add(h2).add(v2);
            }
          }
        }
      }
    }
    if (drop.size) {
      const kept: number[] = [];
      for (let s = 0; s < nS; s++) if (!drop.has(s)) kept.push(wire[4 * s], wire[4 * s + 1], wire[4 * s + 2], wire[4 * s + 3]);
      wire.length = 0;
      wire.push(...kept);
    }
  }

  // a lead drawn straight through a diode triangle must not short anode to cathode
  if (triangles.length && !colourMode) {
    const triGrid = new Grid(Math.max(4, S * 2));
    triangles.forEach((b, i) => triGrid.add(i, b[0], b[1], b[2], b[3]));
    const out: number[] = [];
    const queue = wire.slice();
    const m = 0.05;
    while (queue.length) {
      const y2 = queue.pop()!, x2 = queue.pop()!, y1 = queue.pop()!, x1 = queue.pop()!;
      const horiz = Math.abs(y1 - y2) < 0.02;
      let cut = false;
      for (const i of triGrid.query(Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2))) {
        const b = triangles[i];
        if (horiz) {
          if (y1 <= b[1] + m || y1 >= b[3] - m) continue;
          const lo = Math.min(x1, x2), hi = Math.max(x1, x2);
          if (lo < b[0] - m && hi > b[2] + m) {
            queue.push(lo, y1, b[0], y1, b[2], y1, hi, y1);
            cut = true;
            break;
          }
        } else {
          if (x1 <= b[0] + m || x1 >= b[2] - m) continue;
          const lo = Math.min(y1, y2), hi = Math.max(y1, y2);
          if (lo < b[1] - m && hi > b[3] + m) {
            queue.push(x1, lo, x1, b[1], x1, b[3], x1, hi);
            cut = true;
            break;
          }
        }
      }
      if (!cut) out.push(x1, y1, x2, y2);
    }
    wire.length = 0;
    wire.push(...out);
  }

  // ---- CAD markers (Altium): pins with an exact netlist
  const pins: SchPin[] = [];
  const pageNets = opts.cadNetlist?.pages.get(index);
  const pageParts = opts.cadNetlist?.parts.get(index);
  const pinNet = new Map<string, string>();
  pageNets?.forEach((list, name) => list.forEach((p) => pinNet.set(p, name)));
  const markerRefs: { ref: string; box: Box }[] = [];
  const seenPin = new Map<string, Box[]>();
  for (const t of markerTexts) {
    const { box: whole, ux, uy } = toBox(t);
    const words = splitMarkerWords(t.str);
    const n = t.str.length || 1;
    for (const w of words) {
      // a merged item covers several markers: give each its share of the box along the text direction
      let box = whole;
      if (words.length > 1) {
        const horiz = Math.abs(ux) >= Math.abs(uy);
        const a = w.start / n, b = w.end / n;
        if (horiz) {
          const flip = ux < 0;
          const span = whole[2] - whole[0];
          box = flip ? [whole[2] - b * span, whole[1], whole[2] - a * span, whole[3]] : [whole[0] + a * span, whole[1], whole[0] + b * span, whole[3]];
        } else {
          // view y is flipped: text running "up" the page goes towards smaller y
          const up = uy > 0;
          const span = whole[3] - whole[1];
          box = up ? [whole[0], whole[3] - b * span, whole[2], whole[3] - a * span] : [whole[0], whole[1] + a * span, whole[2], whole[1] + b * span];
        }
      }
      if (w.kind === "part") markerRefs.push({ ref: w.code, box });
      if (w.kind !== "pin") continue;
      const name = decodePin(w.code, pageParts);
      if (!name) continue;
      // the same pin is often written twice (merged + single item): keep one
      const prev = seenPin.get(name) ?? [];
      if (prev.some((q) => Math.abs(q[0] - box[0]) < 1.5 && Math.abs(q[1] - box[1]) < 1.5 && Math.abs(q[2] - box[2]) < 1.5 && Math.abs(q[3] - box[3]) < 1.5)) continue;
      seenPin.set(name, [...prev, box]);
      pins.push({ name, box, net: -1 });
    }
  }
  const realSegs = wire.length / 4;
  /** pin index → its stand-in segment */
  const ownSeg = new Map<number, number>();
  if (useHints && pinNet.size) {
    // a pin wired straight onto another pin has no wire: let the pin itself stand in for one
    const g = Math.max(1, S * 0.3);
    const tmp = new Grid(Math.max(4, S * 1.5));
    for (let s2 = 0; s2 < wire.length / 4; s2++)
      tmp.add(s2, Math.min(wire[4 * s2], wire[4 * s2 + 2]), Math.min(wire[4 * s2 + 1], wire[4 * s2 + 3]), Math.max(wire[4 * s2], wire[4 * s2 + 2]), Math.max(wire[4 * s2 + 1], wire[4 * s2 + 3]));
    pins.forEach((p, pi) => {
      if (!pinNet.has(p.name)) return;
      const b = p.box;
      const touched = tmp
        .query(b[0] - g, b[1] - g, b[2] + g, b[3] + g)
        .some((o) => distBoxSeg([b[0] - g, b[1] - g, b[2] + g, b[3] + g], wire[4 * o], wire[4 * o + 1], wire[4 * o + 2], wire[4 * o + 3]) <= 0);
      if (touched) return;
      const cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2;
      ownSeg.set(pi, wire.length / 4);
      if (b[2] - b[0] >= b[3] - b[1]) wire.push(b[0], cy, b[2], cy);
      else wire.push(cx, b[1], cx, b[3]);
    });
  }

  // ---- connectivity
  let nSeg = wire.length / 4;
  let dsu = new DSU(nSeg);
  const segCell = Math.max(4, S * 1.5);
  let segGrid = new Grid(segCell);
  for (let s = 0; s < nSeg; s++) {
    const x1 = wire[4 * s], y1 = wire[4 * s + 1], x2 = wire[4 * s + 2], y2 = wire[4 * s + 3];
    segGrid.add(s, Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2));
  }
  const wireWidth = colourMode ? stats.get([...wireStyles!][0])!.width : median(prims.filter((p) => p.op !== "fill").map((p) => p.width)) || 0.3;

  // dots that sit on wires (in colour mode, prefer the wire colour)
  const wireColor = colourMode ? stats.get([...wireStyles!][0])!.color : null;
  const dots: SchDot[] = dotsU
    .filter((d) => !wireColor || colorDistance(d.color, wireColor) < 60 || isNeutral(d.color))
    .map((d) => ({ x: d.x, y: d.y, r: d.r, net: -1 }));
  const dotGrid = new Grid(Math.max(2, S));
  dots.forEach((d, i) => dotGrid.add(i, d.x - d.r, d.y - d.r, d.x + d.r, d.y + d.r));
  const hasDot = (x: number, y: number, tol: number) =>
    dotGrid.query(x - tol, y - tol, x + tol, y + tol).some((i) => Math.hypot(dots[i].x - x, dots[i].y - y) <= dots[i].r + tol);

  const EPS = Math.max(0.08, wireWidth * 0.6, S * 0.03);
  // stand-in pin segments (index ≥ realSegs) join only through the CAD netlist
  for (let s = 0; s < realSegs; s++) {
    for (const end of [0, 1]) {
      const px = wire[4 * s + 2 * end];
      const py = wire[4 * s + 2 * end + 1];
      for (const o of segGrid.query(px - EPS, py - EPS, px + EPS, py + EPS)) {
        if (o === s || o >= realSegs) continue;
        const x1 = wire[4 * o], y1 = wire[4 * o + 1], x2 = wire[4 * o + 2], y2 = wire[4 * o + 3];
        if (Math.hypot(px - x1, py - y1) <= EPS || Math.hypot(px - x2, py - y2) <= EPS) {
          dsu.union(s, o); // corner / continuation
        } else if (distPtSeg(px, py, x1, y1, x2, y2) <= EPS && hasDot(px, py, EPS * 2)) {
          dsu.union(s, o); // T junction (a dot is required when wires can't be told from symbol lines)
        }
      }
    }
  }
  // junction dots join every wire passing through them
  for (const d of dots) {
    const hits = segGrid
      .query(d.x - d.r, d.y - d.r, d.x + d.r, d.y + d.r)
      .filter((o) => o < realSegs && distPtSeg(d.x, d.y, wire[4 * o], wire[4 * o + 1], wire[4 * o + 2], wire[4 * o + 3]) <= Math.max(d.r * 0.6, EPS));
    for (let i = 1; i < hits.length; i++) dsu.union(hits[0], hits[i]);
  }

  // ---- bodies: texts inside large outlines are pin names
  const isBig = (b: Box) => (b[2] - b[0]) * (b[3] - b[1]) > S * S * 6 && Math.min(b[2] - b[0], b[3] - b[1]) > S * 1.5;
  // a part body never has wiring running inside it (section frames / note boxes do)
  const wiresInside = (b: Box) => {
    const m = Math.max(0.3, S * 0.1);
    let n = 0;
    for (const o of segGrid.query(b[0], b[1], b[2], b[3])) {
      if (o >= realSegs) continue;
      const x1 = wire[4 * o], y1 = wire[4 * o + 1], x2 = wire[4 * o + 2], y2 = wire[4 * o + 3];
      if (Math.min(x1, x2) > b[0] + m && Math.max(x1, x2) < b[2] - m && Math.min(y1, y2) > b[1] + m && Math.max(y1, y2) < b[3] - m) n++;
    }
    return n;
  };
  const bigBodies = bodies.filter((b) => isBig(b) && wiresInside(b) < 2);
  const bodyGrid = new Grid(Math.max(8, S * 4));
  bigBodies.forEach((b, i) => bodyGrid.add(i, b[0], b[1], b[2], b[3]));
  for (const t of texts) {
    const cx = (t.x0 + t.x1) / 2;
    const cy = (t.y0 + t.y1) / 2;
    t.inBody = bodyGrid.query(cx, cy, cx, cy).some((i) => {
      const b = bigBodies[i];
      // the whole sheet frame / title block is not a part body
      if ((b[2] - b[0]) * (b[3] - b[1]) > width * height * 0.25) return false;
      return cx > b[0] && cx < b[2] && cy > b[1] && cy < b[3];
    });
  }
  // small closed outlines wrapping exactly one label (net flags)
  const flagOf = new Map<number, Box>();
  for (const b of bodies) {
    if (isBig(b)) continue;
    const ids = textGrid.query(b[0], b[1], b[2], b[3]).filter((id) => {
      const t = texts[id];
      const m = t.size * 0.15;
      return t.x0 >= b[0] - m && t.x1 <= b[2] + m && t.y0 >= b[1] - m && t.y1 <= b[3] + m;
    });
    if (ids.length === 1 && texts[ids[0]].kind === "net") flagOf.set(ids[0], b);
  }

  // ---- attach labels to the nearest wire
  const labelAttach: { text: number; seg: number; port: boolean }[] = [];
  // glue touching symbol strokes into whole symbols (arrow head + stem, port outline...)
  {
    const g0 = new Grid(Math.max(4, S * 1.5));
    symbols.forEach((b, i) => g0.add(i, b[0], b[1], b[2], b[3]));
    const sd = new DSU(symbols.length);
    const m = Math.max(0.15, S * 0.04);
    symbols.forEach((b, i) => {
      for (const j of g0.query(b[0] - m, b[1] - m, b[2] + m, b[3] + m)) {
        if (j <= i) continue;
        const o = symbols[j];
        if (o[0] <= b[2] + m && o[2] >= b[0] - m && o[1] <= b[3] + m && o[3] >= b[1] - m) sd.union(i, j);
      }
    });
    const merged = new Map<number, Box>();
    symbols.forEach((b, i) => {
      const r = sd.find(i);
      const mm = merged.get(r);
      if (!mm) merged.set(r, [...b] as Box);
      else {
        mm[0] = Math.min(mm[0], b[0]);
        mm[1] = Math.min(mm[1], b[1]);
        mm[2] = Math.max(mm[2], b[2]);
        mm[3] = Math.max(mm[3], b[3]);
      }
    });
    symbols.length = 0;
    merged.forEach((b) => {
      if (Math.max(b[2] - b[0], b[3] - b[1]) < S * 3) symbols.push(b);
    });
  }
  const symGrid = new Grid(Math.max(4, S * 2));
  symbols.forEach((b, i) => symGrid.add(i, b[0], b[1], b[2], b[3]));
  const nearestSeg = (box: Box, R: number) => {
    let best = -1;
    let bestD = Infinity;
    for (const o of segGrid.query(box[0] - R, box[1] - R, box[2] + R, box[3] + R)) {
      const d = distBoxSeg(box, wire[4 * o], wire[4 * o + 1], wire[4 * o + 2], wire[4 * o + 3]);
      if (d < bestD) {
        bestD = d;
        best = o;
      }
    }
    return { best, bestD };
  };
  const pinGrid = new Grid(Math.max(4, S * 2));
  for (let i = 0; i < pinLines.length / 4; i++)
    pinGrid.add(i, Math.min(pinLines[4 * i], pinLines[4 * i + 2]), Math.min(pinLines[4 * i + 1], pinLines[4 * i + 3]), Math.max(pinLines[4 * i], pinLines[4 * i + 2]), Math.max(pinLines[4 * i + 1], pinLines[4 * i + 3]));
  /** share of the label's length that a symbol (pin) line runs under */
  const pinUnder = (t: SchText) => {
    const r = (t.rot * Math.PI) / 180;
    const dx = Math.cos(r), dy = Math.sin(r);
    const ux = Math.sin(r), uy = -Math.cos(r);
    const L = Math.max(Math.abs((t.x1 - t.x0) * dx) + Math.abs((t.y1 - t.y0) * dy), t.size * 0.5);
    let cover = 0;
    for (const i of pinGrid.query(t.x0 - t.size, t.y0 - t.size, t.x1 + t.size, t.y1 + t.size)) {
      const x1 = pinLines[4 * i], y1 = pinLines[4 * i + 1], x2 = pinLines[4 * i + 2], y2 = pinLines[4 * i + 3];
      const wl = Math.hypot(x2 - x1, y2 - y1) || 1e-6;
      if (Math.abs(((x2 - x1) * dx + (y2 - y1) * dy) / wl) < 0.97) continue;
      const off = ((x1 - t.ax) * ux + (y1 - t.ay) * uy + (x2 - t.ax) * ux + (y2 - t.ay) * uy) / 2;
      if (off < -0.7 * t.size || off > 0.3 * t.size) continue;
      const a1 = (x1 - t.ax) * dx + (y1 - t.ay) * dy;
      const a2 = (x2 - t.ax) * dx + (y2 - t.ay) * dy;
      cover = Math.max(cover, (Math.min(Math.max(a1, a2), L) - Math.max(Math.min(a1, a2), 0)) / L);
    }
    return cover;
  };
  /** wire running along the label's baseline (net labels sit on their wire in every CAD tool) */
  const alongSeg = (t: SchText) => {
    const r = (t.rot * Math.PI) / 180;
    const dx = Math.cos(r), dy = Math.sin(r);
    const ux = Math.sin(r), uy = -Math.cos(r);
    const L = Math.max(Math.abs((t.x1 - t.x0) * dx) + Math.abs((t.y1 - t.y0) * dy), t.size * 0.5);
    const s = t.size;
    let best = -1;
    let bestScore = Infinity;
    for (const o of segGrid.query(t.x0 - s, t.y0 - s, t.x1 + s, t.y1 + s)) {
      const x1 = wire[4 * o], y1 = wire[4 * o + 1], x2 = wire[4 * o + 2], y2 = wire[4 * o + 3];
      // the wire must run parallel to the text
      const wl = Math.hypot(x2 - x1, y2 - y1) || 1e-6;
      if (Math.abs(((x2 - x1) * dx + (y2 - y1) * dy) / wl) < 0.97) continue;
      const off1 = (x1 - t.ax) * ux + (y1 - t.ay) * uy;
      const off2 = (x2 - t.ax) * ux + (y2 - t.ay) * uy;
      const off = (off1 + off2) / 2;
      if (off < -0.6 * s || off > 0.3 * s) continue;
      const a1 = (x1 - t.ax) * dx + (y1 - t.ay) * dy;
      const a2 = (x2 - t.ax) * dx + (y2 - t.ay) * dy;
      const lo = Math.min(a1, a2), hi = Math.max(a1, a2);
      // the label is anchored on its wire: the wire must reach under its start or its end
      const holdsStart = lo <= 0.5 * s && hi >= -0.5 * s;
      const holdsEnd = lo <= L + 0.5 * s && hi >= L - 0.5 * s;
      if (!holdsStart && !holdsEnd) continue;
      const score = Math.abs(off + 0.12 * s);
      if (score < bestScore) {
        bestScore = score;
        best = o;
      }
    }
    return best;
  };
  const endTouch = Math.max(0.4, S * 0.15);
  /** wire end inside / at the edge of a box (power pins and port tips connect to wire ends) */
  const wireEndAt = (b: Box, m: number) => {
    let best = -1;
    let bd = Infinity;
    const cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2;
    const inB = (x: number, y: number) => x >= b[0] - m && x <= b[2] + m && y >= b[1] - m && y <= b[3] + m;
    for (const o of segGrid.query(b[0] - m, b[1] - m, b[2] + m, b[3] + m))
      for (const e of [0, 1]) {
        const x = wire[4 * o + 2 * e], y = wire[4 * o + 2 * e + 1];
        if (!inB(x, y)) continue;
        // a stroke of the symbol itself, not a wire leaving it
        if (inB(wire[4 * o + 2 * (1 - e)], wire[4 * o + 2 * (1 - e) + 1])) continue;
        const d = Math.hypot(x - cx, y - cy);
        if (d < bd) {
          bd = d;
          best = o;
        }
      }
    return best;
  };
  for (const t of texts) {
    if (t.kind !== "net" || t.inBody) continue;
    // a name written along a pin line belongs to the pin
    if (colourMode && pinUnder(t) > 0.5) continue;
    // "16V" next to a capacitor is a rating; as a net name it comes with a power symbol
    const bareVolt = /^\d+(?:[.,]\d+)?V\d*$/i.test(t.str);
    // 1) the label sits on its wire
    const a = bareVolt ? -1 : alongSeg(t);
    if (a >= 0) {
      labelAttach.push({ text: t.id, seg: a, port: true });
      t.via = "along";
      continue;
    }
    // 2) global-label / off-sheet flag outline around the text, touching a wire end
    const flag = flagOf.get(t.id);
    if (flag) {
      const { best, bestD } = nearestSeg(flag, endTouch);
      if (best >= 0 && bestD <= endTouch) {
        labelAttach.push({ text: t.id, seg: best, port: true });
        t.via = "flag";
        continue;
      }
    }
    // 3) power symbol / port arrow between the text and a wire end
    const g = t.size * 1.6;
    const tcx = (t.x0 + t.x1) / 2, tcy = (t.y0 + t.y1) / 2;
    const overlap = (a0: number, a1: number, b0: number, b1: number) =>
      Math.max(0, Math.min(a1, b1) - Math.max(a0, b0)) / Math.max(1e-6, Math.min(a1 - a0, b1 - b0));
    const gapOf = (b: Box) => Math.hypot(Math.max(b[0] - t.x1, 0, t.x0 - b[2]), Math.max(b[1] - t.y1, 0, t.y0 - b[3]));
    const own = symGrid
      .query(t.x0 - g, t.y0 - g, t.x1 + g, t.y1 + g)
      .map((i) => symbols[i])
      .filter((b) => {
        if (gapOf(b) > g) return false;
        const ox = overlap(b[0], b[2], t.x0, t.x1);
        const oy = overlap(b[1], b[3], t.y0, t.y1);
        if (ox < 0.5 && oy < 0.5) return false;
        // the symbol must not wrap another label
        return !textGrid.query(b[0], b[1], b[2], b[3]).some((id) => {
          if (id === t.id) return false;
          const o = texts[id];
          const cx = (o.x0 + o.x1) / 2;
          const cy = (o.y0 + o.y1) / 2;
          return cx > b[0] && cx < b[2] && cy > b[1] && cy < b[3];
        });
      })
      .sort((p, q) => gapOf(p) - gapOf(q));
    let hit = -1;
    for (const b of own.slice(0, 3)) {
      const o = wireEndAt(b, endTouch);
      if (o < 0) continue;
      // the wire must leave the symbol on the side away from the text
      const scx = (b[0] + b[2]) / 2, scy = (b[1] + b[3]) / 2;
      const e0 = Math.hypot(wire[4 * o] - tcx, wire[4 * o + 1] - tcy);
      const e1 = Math.hypot(wire[4 * o + 2] - tcx, wire[4 * o + 3] - tcy);
      if (Math.min(e0, e1) + 0.1 < Math.hypot(scx - tcx, scy - tcy)) continue;
      hit = o;
      break;
    }
    if (hit >= 0) {
      labelAttach.push({ text: t.id, seg: hit, port: true });
      t.via = "symbol";
      continue;
    }
    // 4) monochrome drawings: a name written right at a wire end (pin-side alias)
    if (!colourMode && !bareVolt) {
      const R = Math.max(0.6, t.size * 0.4);
      const { best, bestD } = nearestSeg([t.x0, t.y0, t.x1, t.y1], R);
      if (best >= 0 && bestD <= R) {
        labelAttach.push({ text: t.id, seg: best, port: false });
        t.via = "near";
      }
    }
  }

  // ground symbols drawn as a stack of shrinking bars (often without any text)
  const groundSegs: number[] = [];
  {
    const groups = new Map<string, { c: number; pos: number; len: number; horiz: boolean }[]>();
    const tol = Math.max(0.2, S * 0.15);
    for (const [x1, y1, x2, y2] of bars) {
      const horiz = Math.abs(y1 - y2) < 0.02;
      const c = horiz ? (x1 + x2) / 2 : (y1 + y2) / 2;
      const pos = horiz ? y1 : x1;
      const len = horiz ? Math.abs(x2 - x1) : Math.abs(y2 - y1);
      const k = `${horiz ? "h" : "v"}${Math.round(c / tol)}`;
      (groups.get(k) ?? groups.set(k, []).get(k)!).push({ c, pos, len, horiz });
    }
    for (const list of groups.values()) {
      if (list.length < 3) continue;
      list.sort((a, b) => a.pos - b.pos);
      // runs of ≥3 closely stacked bars with monotonically shrinking length
      for (let i = 0; i + 2 < list.length; i++) {
        const run = [list[i]];
        for (let j = i + 1; j < list.length; j++) {
          const gap = list[j].pos - run[run.length - 1].pos;
          if (gap < S * 0.08 || gap > S * 0.8) break;
          run.push(list[j]);
        }
        if (run.length < 3) continue;
        const dec = run.every((b, k) => k === 0 || b.len < run[k - 1].len - 0.05);
        const inc = run.every((b, k) => k === 0 || b.len > run[k - 1].len + 0.05);
        if (!dec && !inc) continue;
        const top = dec ? run[0] : run[run.length - 1];
        const dir = dec ? -1 : 1; // the stem leaves from the longest bar, away from the short ones
        const horiz = top.horiz;
        const px = horiz ? top.c : top.pos;
        const py = horiz ? top.pos : top.c;
        // wire end at the bar centre or a short stem away from the stack
        let best = -1, bd = Infinity;
        const reach = S * 1.6;
        for (const o of segGrid.query(px - reach, py - reach, px + reach, py + reach))
          for (const e of [0, 1]) {
            const x = wire[4 * o + 2 * e], y = wire[4 * o + 2 * e + 1];
            const along = horiz ? (y - py) * dir : (x - px) * dir;
            const side = horiz ? Math.abs(x - px) : Math.abs(y - py);
            if (side > tol * 1.5 || along < -tol || along > reach) continue;
            if (along < bd) {
              bd = along;
              best = o;
            }
          }
        if (best >= 0) groundSegs.push(best);
        i += run.length - 1;
      }
    }
    for (let i = 1; i < groundSegs.length; i++) dsu.union(groundSegs[0], groundSegs[i]);
  }

  // same-name labels outside IC bodies are the same net
  const byName = new Map<string, number>();
  for (const { text, seg, port } of labelAttach) {
    const t = texts[text];
    if (t.inBody || !(port || POWER.test(t.str))) continue;
    const key = t.str.toUpperCase();
    const prev = byName.get(key);
    if (prev === undefined) byName.set(key, seg);
    else dsu.union(prev, seg);
  }

  // pins located on wires (see CAD markers above)
  const pinSeg: number[] = pins.map((p, pi) => {
    const own = ownSeg.get(pi);
    if (own !== undefined) return own;
    const box = p.box;
    const g = Math.max(1, S * 0.3);
    let best = -1, bd = Infinity;
    // the wire normally ends on the pin's outer tip …
    for (const o of segGrid.query(box[0] - g, box[1] - g, box[2] + g, box[3] + g)) {
      if (o >= realSegs) continue;
      for (const e of [0, 1]) {
        const x = wire[4 * o + 2 * e], y = wire[4 * o + 2 * e + 1];
        if (x < box[0] - g || x > box[2] + g || y < box[1] - g || y > box[3] + g) continue;
        const d = Math.hypot(x - (box[0] + box[2]) / 2, y - (box[1] + box[3]) / 2);
        if (d < bd) {
          bd = d;
          best = o;
        }
      }
    }
    if (best >= 0) return best;
    // … or passes by it (pin dropped onto the middle of a wire)
    for (const o of segGrid.query(box[0] - g, box[1] - g, box[2] + g, box[3] + g)) {
      if (o >= realSegs) continue;
      const d = distBoxSeg(box, wire[4 * o], wire[4 * o + 1], wire[4 * o + 2], wire[4 * o + 3]);
      if (d <= EPS && d < bd) {
        bd = d;
        best = o;
      }
    }
    return best;
  });
  const hintName = new Map<number, string>(); // seg → CAD net name
  if (useHints && pinNet.size) {
    const firstSeg = new Map<string, number>();
    pins.forEach((p, i) => {
      const net = pinNet.get(p.name);
      const s = pinSeg[i];
      if (!net || s < 0) return;
      const prev = firstSeg.get(net);
      if (prev === undefined) firstSeg.set(net, s);
      else dsu.union(prev, s);
      if (!/^Net/.test(net)) hintName.set(s, net);
    });
  }

  // ---- monochrome drawings: tiny islands with no dot and no name are letters / symbol strokes
  const keep = new Uint8Array(nSeg).fill(1);
  if (!colourMode) {
    const box = new Map<number, Box>();
    for (let s = 0; s < realSegs; s++) {
      const r = dsu.find(s);
      const b = box.get(r) ?? box.set(r, [Infinity, Infinity, -Infinity, -Infinity]).get(r)!;
      b[0] = Math.min(b[0], wire[4 * s], wire[4 * s + 2]);
      b[1] = Math.min(b[1], wire[4 * s + 1], wire[4 * s + 3]);
      b[2] = Math.max(b[2], wire[4 * s], wire[4 * s + 2]);
      b[3] = Math.max(b[3], wire[4 * s + 1], wire[4 * s + 3]);
    }
    const named = new Set(labelAttach.map((a) => dsu.find(a.seg)));
    groundSegs.forEach((sg) => named.add(dsu.find(sg)));
    pinSeg.forEach((sg) => sg >= 0 && named.add(dsu.find(sg)));
    const dotted = new Set<number>();
    for (const d of dots)
      for (const o of segGrid.query(d.x - d.r, d.y - d.r, d.x + d.r, d.y + d.r))
        if (distPtSeg(d.x, d.y, wire[4 * o], wire[4 * o + 1], wire[4 * o + 2], wire[4 * o + 3]) <= Math.max(d.r, EPS)) dotted.add(dsu.find(o));
    for (let s = 0; s < realSegs; s++) {
      const r = dsu.find(s);
      const b = box.get(r)!;
      if (Math.max(b[2] - b[0], b[3] - b[1]) < S * 1.4 && !named.has(r) && !dotted.has(r)) keep[s] = 0;
    }
  }
  // compact the wire list
  const newIdx = new Int32Array(nSeg).fill(-1);
  {
    const kept: number[] = [];
    for (let s = 0; s < nSeg; s++)
      if (keep[s]) {
        newIdx[s] = kept.length / 4;
        kept.push(wire[4 * s], wire[4 * s + 1], wire[4 * s + 2], wire[4 * s + 3]);
      }
    if (kept.length !== wire.length) {
      const roots = Array.from({ length: nSeg }, (_, s2) => dsu.find(s2));
      wire.length = 0;
      wire.push(...kept);
      const nd = new DSU(kept.length / 4);
      const first = new Map<number, number>();
      for (let s2 = 0; s2 < nSeg; s2++) {
        if (newIdx[s2] < 0) continue;
        const f = first.get(roots[s2]);
        if (f === undefined) first.set(roots[s2], newIdx[s2]);
        else nd.union(f, newIdx[s2]);
      }
      dsu = nd;
      for (const a of labelAttach) a.seg = newIdx[a.seg];
      for (let i = 0; i < pinSeg.length; i++) pinSeg[i] = pinSeg[i] >= 0 ? newIdx[pinSeg[i]] : -1;
      nSeg = kept.length / 4;
      segGrid = new Grid(segCell);
      for (let s2 = 0; s2 < nSeg; s2++) segGrid.add(s2, Math.min(wire[4 * s2], wire[4 * s2 + 2]), Math.min(wire[4 * s2 + 1], wire[4 * s2 + 3]), Math.max(wire[4 * s2], wire[4 * s2 + 2]), Math.max(wire[4 * s2 + 1], wire[4 * s2 + 3]));
    }
  }

  // ---- build nets
  const rootToNet = new Map<number, number>();
  const nets: SchNet[] = [];
  const segNet = new Int32Array(nSeg);
  for (let s = 0; s < nSeg; s++) {
    const r = dsu.find(s);
    let n = rootToNet.get(r);
    if (n === undefined) {
      n = nets.length;
      rootToNet.set(r, n);
      nets.push({ id: n, name: "", labels: [], segs: [], bbox: [Infinity, Infinity, -Infinity, -Infinity] });
    }
    segNet[s] = n;
    const net = nets[n];
    net.segs.push(s);
    const x1 = wire[4 * s], y1 = wire[4 * s + 1], x2 = wire[4 * s + 2], y2 = wire[4 * s + 3];
    net.bbox[0] = Math.min(net.bbox[0], x1, x2);
    net.bbox[1] = Math.min(net.bbox[1], y1, y2);
    net.bbox[2] = Math.max(net.bbox[2], x1, x2);
    net.bbox[3] = Math.max(net.bbox[3], y1, y2);
  }
  for (const { text, seg } of labelAttach) {
    const n = segNet[seg];
    texts[text].net = n;
    nets[n].labels.push(text);
  }
  pins.forEach((p, i) => {
    if (pinSeg[i] >= 0) p.net = segNet[pinSeg[i]];
  });
  for (const d of dots) {
    const hit = segGrid
      .query(d.x - d.r, d.y - d.r, d.x + d.r, d.y + d.r)
      .find((o) => distPtSeg(d.x, d.y, wire[4 * o], wire[4 * o + 1], wire[4 * o + 2], wire[4 * o + 3]) <= Math.max(d.r, EPS));
    if (hit !== undefined) d.net = segNet[hit];
  }

  // ---- name nets: CAD netlist first, then power names, flags, plain labels (pin names never name a net)
  const isPort = new Set(labelAttach.filter((a) => a.port).map((a) => a.text));
  const groundNets = new Set<number>();
  for (const sg of groundSegs) if (newIdx[sg] >= 0) groundNets.add(segNet[newIdx[sg]]);
  const cadNameOf = new Map<number, string>();
  hintName.forEach((name, s) => {
    const k = newIdx[s];
    if (k >= 0) cadNameOf.set(segNet[k], name);
  });
  for (const net of nets) {
    const cad = cadNameOf.get(net.id);
    if (cad) {
      net.name = cad;
      continue;
    }
    const score = (t: SchText) => (isPort.has(t.id) ? 4 : 0) + (POWER.test(t.str) ? 2 : 0) + (flagOf.has(t.id) ? 1 : 0);
    const outside = net.labels.map((id) => texts[id]).filter((t) => !t.inBody);
    outside.sort((a, b) => score(b) - score(a) || a.str.localeCompare(b.str));
    net.name = outside[0]?.str ?? (groundNets.has(net.id) ? "GND" : "");
  }

  // ---- components (reference designators) with their nearby value text
  // loose references (PWRLED1, MICRO_SD1) count only when they don't name a wire and sit next to a value
  for (const t of texts) {
    if (t.kind !== "net" || t.net >= 0 || t.inBody || !LOOSE_REF.test(t.str) || POWER.test(t.str)) continue;
    const s = t.size;
    const hasValue = textGrid
      .query(t.x0 - 3 * s, t.y0 - 2.5 * s, t.x1 + 3 * s, t.y1 + 2.5 * s)
      .some((id) => texts[id].kind === "value" && Math.abs(texts[id].size - s) < s * 0.35);
    if (hasValue) t.kind = "component";
  }
  // Altium part markers name the references exactly
  if (markerRefs.length) {
    const refs = new Set(markerRefs.map((m) => m.ref));
    for (const t of texts) {
      if (refs.has(t.str)) t.kind = "component";
      else if (t.kind === "component" && /^[A-Z]+\d+$/.test(t.str) && !t.inBody) {
        // looks like a reference but the CAD says otherwise: probably a pin / net name
        t.kind = t.net >= 0 ? "net" : "note";
      }
    }
  }
  // multi-gate parts (U5A, U5B) are one component
  const gateBase = (r: string) => /^[A-Z]+\d{1,4}[A-H]$/.exec(r) ? r.slice(0, -1) : null;
  const refCount = new Map<string, number>();
  for (const t of texts) {
    if (t.kind !== "component") continue;
    const b = gateBase(t.str.replace(/^\*/, ""));
    if (b) refCount.set(b, (refCount.get(b) ?? 0) + 1);
  }
  const compMap = new Map<string, SchComponent>();
  for (const t of texts) {
    if (t.kind !== "component") continue;
    let ref = t.str.replace(/^\*/, "");
    const b = gateBase(ref);
    if (b && ((refCount.get(b) ?? 0) > 1 || texts.some((o) => o.str === b))) ref = b;
    let c = compMap.get(ref);
    if (!c) {
      c = { ref, textIds: [], values: [] };
      compMap.set(ref, c);
    }
    c.textIds.push(t.id);
    const s = t.size;
    const near = textGrid
      .query(t.x0 - 4 * s, t.y0 - 3 * s, t.x1 + 4 * s, t.y1 + 3 * s)
      .map((id) => texts[id])
      .filter((o) => o.kind === "value" && o.rot === t.rot)
      .map((o) => ({ o, d: Math.hypot((o.x0 + o.x1) / 2 - (t.x0 + t.x1) / 2, (o.y0 + o.y1) / 2 - (t.y0 + t.y1) / 2) }))
      .filter((x) => x.d < s * 3.2)
      .sort((a, b) => a.d - b.d)
      .slice(0, 2);
    for (const { o } of near) if (!c.values.includes(o.str)) c.values.push(o.str);
  }

  return {
    index,
    width,
    height,
    strokePath: strokeParts.join(""),
    fillPath: fillParts.join(""),
    segs: Float64Array.from(wire),
    segNet,
    dots,
    texts,
    nets,
    pins,
    vectorText: glyphCount > texts.length * 0.8,
    wireStyle: wireStyleName,
    textSize: S,
    components: [...compMap.values()].sort((a, b) => a.ref.localeCompare(b.ref, undefined, { numeric: true })),
  };
}
