// Pure schematic analysis: turns raw PDF vector paths + text items into
// drawable geometry, classified labels and electrically-connected nets.
// No DOM / pdf.js dependencies so it can be tested in isolation.

export type PaintOp = "stroke" | "fill" | "fillStroke" | "none";

export interface RawPath {
  op: PaintOp;
  /** pdf.js DrawOPS-encoded data: 0 moveTo(x,y) 1 lineTo(x,y) 2 curveTo(6) 3 quadTo(4) 4 close */
  data: ArrayLike<number>;
  /** current transform matrix applied to the path coordinates */
  ctm: number[];
}

export interface RawText {
  str: string;
  /** pdf.js text transform in PDF user space */
  transform: number[];
  width: number;
  height: number;
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
  /** true when the PDF draws its lettering as vector strokes (text layer is invisible) */
  vectorText: boolean;
}

type Pt = [number, number];
type Box = [number, number, number, number];

const VALUE =
  /^(?:[0-9]+(?:[./][0-9]+)?\s*(?:[pnuµmkKMGR]|ohm|Ω)?\s*(?:[0-9]+)?(?:F|H|V|W|A|ohm|Ω|Hz|%|nF|uF|pF)?(?:\s.*)?|[0-9]+[pnuµmkKMR][0-9]+)$/;
const PART = /^[A-Z0-9]+(?:[-/][A-Z0-9().]+)+$|^[A-Z]{2,}[0-9]{3,}[A-Z0-9-]*$/;
const POWER = /^(?:[+-]\d+(?:\.\d+)?V\w*|GND\w*|VCC\w*|VDD\w*|AGND|DGND|PGND)$/i;
// Reference designators. Two families are accepted:
//  - suffixed style:  R47Q, C88W, U77Q, ZD90W  (letters + 2-3 digits + 1-2 letters)
//  - standard style:  R1, C12, U3, IC5, J2      (known prefix + 1-4 digits)
const REFDES =
  /^(?:[A-Z]{1,4}\d{2,3}[A-Z]{1,2}|(?:R|C|L|D|Q|U|IC|J|P|CN|TP|F|FB|SW|Y|X|T|K|RY|LED|ZD|VR|BD|TR|RN|M)\d{1,4})$/;
const CONNECTOR_REF = /^\*?W?CN(?:[_\d]|$)/;

export function classifyText(str: string): TextKind {
  const s = str.trim();
  if (!s) return "note";
  if (/^\d+$/.test(s)) return "pin";
  if (POWER.test(s)) return "net";
  if (VALUE.test(s)) return "value";
  if (/\s/.test(s)) return "note";
  if (/^\*/.test(s)) return "component";
  if (REFDES.test(s)) return "component";
  if (CONNECTOR_REF.test(s)) return "component";
  if (PART.test(s) && !/_/.test(s)) return "value";
  if (s.length < 2) return "pin";
  if (!/[A-Z]/i.test(s)) return "note";
  return "net";
}

export function isPowerName(s: string) {
  return POWER.test(s);
}

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

/** distance between an axis-aligned box and an axis-aligned segment */
function distBoxSeg(b: Box, x1: number, y1: number, x2: number, y2: number): number {
  const sx0 = Math.min(x1, x2);
  const sx1 = Math.max(x1, x2);
  const sy0 = Math.min(y1, y2);
  const sy1 = Math.max(y1, y2);
  const dx = Math.max(b[0] - sx1, 0, sx0 - b[2]);
  const dy = Math.max(b[1] - sy1, 0, sy0 - b[3]);
  return Math.sqrt(dx * dx + dy * dy);
}

export function analyzePage(index: number, width: number, height: number, paths: RawPath[], rawTexts: RawText[]): SchPage {
  const H = height;

  // ---- texts → view-space boxes
  const texts: SchText[] = [];
  for (const t of rawTexts) {
    const str = t.str.trim();
    if (!str) continue;
    const [a, b, , , e, f] = t.transform;
    const n = Math.hypot(a, b) || 1;
    const ux = a / n;
    const uy = b / n;
    const vx = -uy;
    const vy = ux;
    const h = t.height || n;
    const corners: Pt[] = [
      [e, f],
      [e + ux * t.width, f + uy * t.width],
      [e + vx * h, f + vy * h],
      [e + ux * t.width + vx * h, f + uy * t.width + vy * h],
    ];
    const xs = corners.map((p) => p[0]);
    const ys = corners.map((p) => H - p[1]);
    texts.push({
      id: texts.length,
      str,
      kind: classifyText(str),
      x0: Math.min(...xs),
      y0: Math.min(...ys),
      x1: Math.max(...xs),
      y1: Math.max(...ys),
      ax: e,
      ay: H - f,
      size: h,
      rot: -Math.round((Math.atan2(uy, ux) * 180) / Math.PI),
      net: -1,
      inBody: false,
    });
  }
  // words that continue a sentence on the same baseline are annotations, not labels
  {
    const byLine = new Map<string, SchText[]>();
    for (const t of texts) {
      const base = t.rot === 0 ? t.ay : t.ax;
      const key = t.rot + ":" + Math.round(base * 3);
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
        if (gap > -0.3 && gap < a.size * 0.9 && a.kind !== "pin" && b.kind !== "pin") {
          if (a.kind !== "value" || b.kind !== "value") {
            a.kind = "note";
            b.kind = "note";
          }
        }
      }
    }
  }

  const textGrid = new Grid(8);
  texts.forEach((t) => textGrid.add(t.id, t.x0 - t.size, t.y0 - t.size, t.x1 + t.size, t.y1 + t.size));
  /** vector-drawn glyphs sit on top of the (invisible) text layer, but font metrics differ slightly */
  const isGlyph = (pts: Pt[], bw: number, bh: number) => {
    const [x, y] = pts[0];
    for (const id of textGrid.query(x, y, x, y)) {
      const t = texts[id];
      const s = t.size;
      if (Math.max(bw, bh) > s * 1.6) continue;
      const box =
        t.rot === 0 ? [t.x0 - 0.35 * s, t.y0 - 0.35 * s, t.x1 + 0.35 * s, t.y1 + 0.9 * s] : [t.x0 - 0.9 * s, t.y0 - 0.35 * s, t.x1 + 0.9 * s, t.y1 + 0.35 * s];
      if (pts.every(([px, py]) => px >= box[0] && px <= box[2] && py >= box[1] && py <= box[3])) return true;
    }
    return false;
  };

  // ---- geometry
  const strokeParts: string[] = [];
  const fillParts: string[] = [];
  const wire: number[] = []; // x1,y1,x2,y2
  const bodies: { box: Box }[] = [];
  const dots: SchDot[] = [];
  const symbols: Box[] = [];
  const triangles: Box[] = [];
  let glyphCount = 0;

  for (const raw of paths) {
    if (raw.op === "none") continue;
    if (raw.op === "fill" || raw.op === "fillStroke") fillParts.push(pathToD(raw, H));
    if (raw.op === "stroke" || raw.op === "fillStroke") strokeParts.push(pathToD(raw, H));
    for (const sp of splitSubpaths(raw, H)) {
      let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
      for (const [x, y] of sp.pts) {
        if (x < bx0) bx0 = x;
        if (y < by0) by0 = y;
        if (x > bx1) bx1 = x;
        if (y > by1) by1 = y;
      }
      const bw = bx1 - bx0;
      const bh = by1 - by0;
      if (isGlyph(sp.pts, bw, bh)) {
        glyphCount++; // vector glyph of a text label
        continue;
      }
      if (sp.closed && sp.straight.every(Boolean)) {
        // distinct vertices of a closed polygon; triangles are diode / arrow bodies
        const vs: Pt[] = [];
        for (const q of sp.pts)
          if (!vs.some((v) => Math.abs(v[0] - q[0]) < 0.05 && Math.abs(v[1] - q[1]) < 0.05)) vs.push(q);
        if (vs.length === 3 && Math.max(bw, bh) > 0.8 && Math.max(bw, bh) < 8) triangles.push([bx0, by0, bx1, by1]);
      }
      if (raw.op === "fill") {
        // junction dot: small, roughly round, curved outline
        if (bw > 0.8 && bw < 3.2 && Math.abs(bw - bh) < 0.4 && sp.straight.some((s) => !s))
          dots.push({ x: (bx0 + bx1) / 2, y: (by0 + by1) / 2, r: bw / 2, net: -1 });
        else if (Math.max(bw, bh) < 9) {
          // outlined strokes: thickness ≈ 2·area / perimeter. Heavy pen marks are annotations.
          let area = 0;
          let per = 0;
          for (let k = 0; k + 1 < sp.pts.length; k++) {
            const [ax, ay] = sp.pts[k];
            const [bx, by] = sp.pts[k + 1];
            area += ax * by - bx * ay;
            per += Math.hypot(bx - ax, by - ay);
          }
          const thick = per > 0 ? Math.abs(area) / per : 0;
          const curved = sp.straight.some((st) => !st);
          if (!(curved && thick > 0.45)) symbols.push([bx0, by0, bx1, by1]);
        }
        continue;
      }
      const hasDiag = sp.straight.some((st, k) => {
        if (!st) return true;
        const [x1, y1] = sp.pts[k];
        const [x2, y2] = sp.pts[k + 1];
        return !(Math.abs(x1 - x2) < 0.02 || Math.abs(y1 - y2) < 0.02);
      });
      if ((sp.closed || hasDiag) && Math.max(bw, bh) < 9) symbols.push([bx0, by0, bx1, by1]);
      if (sp.closed) {
        if (bw > 4 && bh > 2) bodies.push({ box: [bx0, by0, bx1, by1] });
        continue;
      }
      for (let k = 0; k < sp.straight.length; k++) {
        if (!sp.straight[k]) continue;
        const [x1, y1] = sp.pts[k];
        const [x2, y2] = sp.pts[k + 1];
        const orth = Math.abs(x1 - x2) < 0.02 || Math.abs(y1 - y2) < 0.02;
        if (!orth) continue;
        if (Math.hypot(x2 - x1, y2 - y1) < 0.05) continue;
        wire.push(x1, y1, x2, y2);
      }
    }
  }

  // a lead drawn straight through a diode triangle must not short anode to cathode
  if (triangles.length) {
    const triGrid = new Grid(8);
    triangles.forEach((b, i) => triGrid.add(i, b[0], b[1], b[2], b[3]));
    const out: number[] = [];
    const queue = wire.slice();
    while (queue.length) {
      const y2 = queue.pop()!, x2 = queue.pop()!, y1 = queue.pop()!, x1 = queue.pop()!;
      const horiz = Math.abs(y1 - y2) < 0.02;
      let cut = false;
      for (const i of triGrid.query(Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2))) {
        const b = triangles[i];
        if (horiz) {
          if (y1 <= b[1] + 0.05 || y1 >= b[3] - 0.05) continue;
          const lo = Math.min(x1, x2), hi = Math.max(x1, x2);
          if (lo < b[0] - 0.05 && hi > b[2] + 0.05) {
            queue.push(lo, y1, b[0], y1, b[2], y1, hi, y1);
            cut = true;
            break;
          }
        } else {
          if (x1 <= b[0] + 0.05 || x1 >= b[2] - 0.05) continue;
          const lo = Math.min(y1, y2), hi = Math.max(y1, y2);
          if (lo < b[1] - 0.05 && hi > b[3] + 0.05) {
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

  const nSeg = wire.length / 4;
  const dsu = new DSU(nSeg);
  const segGrid = new Grid(6);
  for (let s = 0; s < nSeg; s++) {
    const x1 = wire[4 * s], y1 = wire[4 * s + 1], x2 = wire[4 * s + 2], y2 = wire[4 * s + 3];
    segGrid.add(s, Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2));
  }

  const dotGrid = new Grid(6);
  dots.forEach((d, i) => dotGrid.add(i, d.x - d.r, d.y - d.r, d.x + d.r, d.y + d.r));
  const hasDot = (x: number, y: number) =>
    dotGrid.query(x - 0.3, y - 0.3, x + 0.3, y + 0.3).some((i) => Math.hypot(dots[i].x - x, dots[i].y - y) <= dots[i].r + 0.3);

  const EPS = 0.08;
  for (let s = 0; s < nSeg; s++) {
    for (const end of [0, 1]) {
      const px = wire[4 * s + 2 * end];
      const py = wire[4 * s + 2 * end + 1];
      for (const o of segGrid.query(px - EPS, py - EPS, px + EPS, py + EPS)) {
        if (o === s) continue;
        const x1 = wire[4 * o], y1 = wire[4 * o + 1], x2 = wire[4 * o + 2], y2 = wire[4 * o + 3];
        if (Math.hypot(px - x1, py - y1) <= EPS || Math.hypot(px - x2, py - y2) <= EPS) {
          dsu.union(s, o); // corner / continuation
        } else if (distPtSeg(px, py, x1, y1, x2, y2) <= EPS && hasDot(px, py)) {
          dsu.union(s, o); // T junction marked with a dot
        }
      }
    }
  }
  // junction dots join every wire passing through them
  for (const d of dots) {
    const hits = segGrid
      .query(d.x - d.r, d.y - d.r, d.x + d.r, d.y + d.r)
      .filter((o) => distPtSeg(d.x, d.y, wire[4 * o], wire[4 * o + 1], wire[4 * o + 2], wire[4 * o + 3]) <= d.r * 0.6);
    for (let i = 1; i < hits.length; i++) dsu.union(hits[0], hits[i]);
  }

  // ---- bodies: texts inside large outlines are pin names
  const isBig = (b: Box) => (b[2] - b[0]) * (b[3] - b[1]) > 120;
  const bigBodies = bodies.filter((b) => isBig(b.box));
  for (const t of texts) {
    const cx = (t.x0 + t.x1) / 2;
    const cy = (t.y0 + t.y1) / 2;
    t.inBody = bigBodies.some((b) => cx > b.box[0] && cx < b.box[2] && cy > b.box[1] && cy < b.box[3]);
  }
  // small closed outlines wrapping exactly one label (net flags)
  const flagOf = new Map<number, Box>();
  for (const b of bodies) {
    if (isBig(b.box)) continue;
    const ids = textGrid.query(b.box[0], b.box[1], b.box[2], b.box[3]).filter((id) => {
      const t = texts[id];
      return t.x0 >= b.box[0] - 0.3 && t.x1 <= b.box[2] + 0.3 && t.y0 >= b.box[1] - 0.3 && t.y1 <= b.box[3] + 0.3;
    });
    if (ids.length === 1 && texts[ids[0]].kind === "net") flagOf.set(ids[0], b.box);
  }

  // ---- attach labels to the nearest wire
  const labelAttach: { text: number; seg: number; port: boolean }[] = [];
  // glue touching symbol strokes into whole symbols (arrow head + stem, port outline...)
  {
    const g0 = new Grid(6);
    symbols.forEach((b, i) => g0.add(i, b[0], b[1], b[2], b[3]));
    const sd = new DSU(symbols.length);
    symbols.forEach((b, i) => {
      for (const j of g0.query(b[0] - 0.15, b[1] - 0.15, b[2] + 0.15, b[3] + 0.15)) {
        if (j <= i) continue;
        const o = symbols[j];
        if (o[0] <= b[2] + 0.15 && o[2] >= b[0] - 0.15 && o[1] <= b[3] + 0.15 && o[3] >= b[1] - 0.15) sd.union(i, j);
      }
    });
    const merged = new Map<number, Box>();
    symbols.forEach((b, i) => {
      const r = sd.find(i);
      const m = merged.get(r);
      if (!m) merged.set(r, [...b] as Box);
      else {
        m[0] = Math.min(m[0], b[0]);
        m[1] = Math.min(m[1], b[1]);
        m[2] = Math.max(m[2], b[2]);
        m[3] = Math.max(m[3], b[3]);
      }
    });
    symbols.length = 0;
    merged.forEach((b) => {
      if (Math.max(b[2] - b[0], b[3] - b[1]) < 12) symbols.push(b);
    });
  }
  const symGrid = new Grid(8);
  symbols.forEach((b, i) => symGrid.add(i, b[0], b[1], b[2], b[3]));
  for (const t of texts) {
    if (t.kind !== "net") continue;
    const flag = flagOf.get(t.id);
    const box: Box = flag ?? [t.x0, t.y0, t.x1, t.y1];
    let R = flag ? 0.6 : Math.max(1.2, t.size * 0.9);
    if (!flag) {
      // port arrows / power symbols drawn right next to the label
      const g = t.size * 1.6;
      const near = symGrid.query(t.x0 - g, t.y0 - g, t.x1 + g, t.y1 + g).map((i) => symbols[i]);
      const overlap = (a0: number, a1: number, b0: number, b1: number) =>
        Math.max(0, Math.min(a1, b1) - Math.max(a0, b0)) / Math.max(1e-6, Math.min(a1 - a0, b1 - b0));
      const gapOf = (b: Box) =>
        Math.hypot(Math.max(b[0] - t.x1, 0, t.x0 - b[2]), Math.max(b[1] - t.y1, 0, t.y0 - b[3]));
      const own = near.filter((b) => {
        if (gapOf(b) > g) return false;
        if (overlap(b[0], b[2], t.x0, t.x1) < 0.5 && overlap(b[1], b[3], t.y0, t.y1) < 0.5) return false;
        // the symbol must not wrap another label
        return !textGrid.query(b[0], b[1], b[2], b[3]).some((id) => {
          if (id === t.id) return false;
          const o = texts[id];
          const cx = (o.x0 + o.x1) / 2;
          const cy = (o.y0 + o.y1) / 2;
          return cx > b[0] && cx < b[2] && cy > b[1] && cy < b[3];
        });
      });
      own.sort((a, b) => gapOf(a) - gapOf(b));
      if (own.length) {
        // nearest symbol that actually touches a wire wins
        let hit = -1;
        for (const b of own.slice(0, 4)) {
          let hd = Infinity;
          for (const o of segGrid.query(b[0] - 0.4, b[1] - 0.4, b[2] + 0.4, b[3] + 0.4)) {
            const d = distBoxSeg(b, wire[4 * o], wire[4 * o + 1], wire[4 * o + 2], wire[4 * o + 3]);
            if (d < hd) {
              hd = d;
              hit = o;
            }
          }
          if (hd <= 0.4) break;
          hit = -1;
        }
        if (hit >= 0) {
          labelAttach.push({ text: t.id, seg: hit, port: true });
          continue;
        }
        R = Math.max(1.2, t.size * 0.6);
      }
    }
    let best = -1;
    let bestD = Infinity;
    for (const o of segGrid.query(box[0] - R, box[1] - R, box[2] + R, box[3] + R)) {
      const d = distBoxSeg(box, wire[4 * o], wire[4 * o + 1], wire[4 * o + 2], wire[4 * o + 3]);
      if (d < bestD) {
        bestD = d;
        best = o;
      }
    }
    if (best >= 0 && bestD <= R) {
      // a plain alias counts as a port only when it sits along its wire (not at a pin end)
      const x1 = wire[4 * best], y1 = wire[4 * best + 1], x2 = wire[4 * best + 2], y2 = wire[4 * best + 3];
      const cx = (t.x0 + t.x1) / 2;
      const cy = (t.y0 + t.y1) / 2;
      const horizWire = Math.abs(y1 - y2) < 0.02;
      const along =
        !!flag ||
        (horizWire && t.rot === 0 && cx >= Math.min(x1, x2) && cx <= Math.max(x1, x2)) ||
        (!horizWire && t.rot !== 0 && cy >= Math.min(y1, y2) && cy <= Math.max(y1, y2));
      labelAttach.push({ text: t.id, seg: best, port: along });
    }
  }

  // same-name labels outside IC bodies are the same net
  const byName = new Map<string, number>();
  for (const { text, seg, port } of labelAttach) {
    const t = texts[text];
    if (t.inBody || !(port || /^[+-]\d/.test(t.str))) continue;
    const key = t.str.toUpperCase();
    const prev = byName.get(key);
    if (prev === undefined) byName.set(key, seg);
    else dsu.union(prev, seg);
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
  for (const d of dots) {
    const hit = segGrid
      .query(d.x - d.r, d.y - d.r, d.x + d.r, d.y + d.r)
      .find((o) => distPtSeg(d.x, d.y, wire[4 * o], wire[4 * o + 1], wire[4 * o + 2], wire[4 * o + 3]) <= d.r);
    if (hit !== undefined) d.net = segNet[hit];
  }

  // ---- name nets: power names first, then flags, then plain labels (pin names never name a net)
  const isPort = new Set(labelAttach.filter((a) => a.port).map((a) => a.text));
  for (const net of nets) {
    const score = (t: SchText) => (isPort.has(t.id) ? 4 : 0) + (POWER.test(t.str) ? 2 : 0) + (flagOf.has(t.id) ? 1 : 0);
    const outside = net.labels.map((id) => texts[id]).filter((t) => !t.inBody);
    outside.sort((a, b) => score(b) - score(a) || a.str.localeCompare(b.str));
    net.name = outside[0]?.str ?? "";
  }

  // ---- components (reference designators) with their nearby value text
  const compMap = new Map<string, SchComponent>();
  for (const t of texts) {
    if (t.kind !== "component") continue;
    const ref = t.str.replace(/^\*/, "");
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
    vectorText: glyphCount > texts.length * 0.8,
    components: [...compMap.values()].sort((a, b) => a.ref.localeCompare(b.ref, undefined, { numeric: true })),
  };
}
