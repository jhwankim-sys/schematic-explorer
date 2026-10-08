// Finds the transform that lays CAD-source coordinates onto the PDF page.
// Exporters place the drawing with an unknown offset (and Eagle with an unknown
// scale / rotation), so it is fitted from wire end points that coincide.

export type Seg = [number, number, number, number];

export interface Transform {
  /** view = [a*x + c*y + e, b*x + d*y + f] */
  m: [number, number, number, number, number, number];
  inliers: number;
  total: number;
}

export function apply(t: Transform, x: number, y: number): [number, number] {
  const [a, b, c, d, e, f] = t.m;
  return [a * x + c * y + e, b * x + d * y + f];
}

function bbox(segs: Seg[]) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const s of segs) {
    x0 = Math.min(x0, s[0], s[2]);
    x1 = Math.max(x1, s[0], s[2]);
    y0 = Math.min(y0, s[1], s[3]);
    y1 = Math.max(y1, s[1], s[3]);
  }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}

class PointIndex {
  cell: number;
  map = new Map<string, [number, number][]>();
  constructor(pts: [number, number][], cell: number) {
    this.cell = cell;
    for (const p of pts) {
      const k = `${Math.floor(p[0] / cell)},${Math.floor(p[1] / cell)}`;
      (this.map.get(k) ?? this.map.set(k, []).get(k)!).push(p);
    }
  }
  near(x: number, y: number, r: number): [number, number] | null {
    const c = this.cell;
    let best: [number, number] | null = null;
    let bd = r;
    for (let gx = Math.floor((x - r) / c); gx <= Math.floor((x + r) / c); gx++)
      for (let gy = Math.floor((y - r) / c); gy <= Math.floor((y + r) / c); gy++)
        for (const p of this.map.get(`${gx},${gy}`) ?? []) {
          const d = Math.hypot(p[0] - x, p[1] - y);
          if (d <= bd) {
            bd = d;
            best = p;
          }
        }
    return best;
  }
}

/**
 * @param gt      wires in source units
 * @param pdf     candidate line segments on the page (view space, points)
 * @param unitToPt known scale, or null to search
 * @param yDown   source y axis points down
 */
export function fitTransform(gt: Seg[], pdf: Seg[], unitToPt: number | null, yDown: boolean): Transform | null {
  const gtPts: [number, number][] = [];
  for (const s of gt) gtPts.push([s[0], s[1]], [s[2], s[3]]);
  const longPdf = pdf.filter((s) => Math.hypot(s[2] - s[0], s[3] - s[1]) > 5);
  const pdfPts: [number, number][] = [];
  for (const s of longPdf) pdfPts.push([s[0], s[1]], [s[2], s[3]]);
  if (!gtPts.length || !pdfPts.length) return null;
  const index = new PointIndex(pdfPts, 4);
  const gb = bbox(gt);
  const pb = bbox(longPdf);

  const fy = yDown ? 1 : -1;
  const linear = (sc: number, rot: number): [number, number, number, number] => {
    const r = (rot * Math.PI) / 180;
    return [sc * Math.cos(r), sc * Math.sin(r), -sc * Math.sin(r) * fy, sc * Math.cos(r) * fy];
  };
  const step = Math.max(1, Math.floor(gtPts.length / 80));
  const sample = gtPts.filter((_, i) => i % step === 0);
  const quickScore = (m: Transform["m"]) => {
    let n = 0;
    for (const [x, y] of sample) if (index.near(m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5], 0.9)) n++;
    return n;
  };
  const found: { best: Transform | null } = { best: null };
  let bestQ = -1;
  const consider = (m: Transform["m"]) => {
    const q = quickScore(m);
    if (q > bestQ) {
      bestQ = q;
      found.best = { m, inliers: 0, total: gtPts.length };
    }
  };

  // hypotheses: a long GT wire laid onto a PDF line of matching direction fixes
  // scale and offset at once (both end orders, all quarter turns)
  const gtLong = [...gt].sort((p, q) => Math.hypot(q[2] - q[0], q[3] - q[1]) - Math.hypot(p[2] - p[0], p[3] - p[1])).slice(0, 12);
  const rots = unitToPt ? [0] : [0, 90, 180, 270];
  for (const g of gtLong) {
    const gl = Math.hypot(g[2] - g[0], g[3] - g[1]);
    if (!gl) continue;
    for (const rot of rots) {
      const [ua, ub, uc, ud] = linear(1, rot);
      const dx = ua * (g[2] - g[0]) + uc * (g[3] - g[1]);
      const dy = ub * (g[2] - g[0]) + ud * (g[3] - g[1]);
      const horiz = Math.abs(dy) < Math.abs(dx);
      for (const p of longPdf) {
        const pl = Math.hypot(p[2] - p[0], p[3] - p[1]);
        const ph = Math.abs(p[3] - p[1]) < Math.abs(p[2] - p[0]);
        if (ph !== horiz) continue;
        const sc = pl / gl;
        if (unitToPt && (sc < unitToPt * 0.3 || sc > unitToPt * 1.05)) continue;
        for (const flip of [false, true]) {
          const [qx, qy] = flip ? [p[2], p[3]] : [p[0], p[1]];
          const [rx, ry] = flip ? [p[0], p[1]] : [p[2], p[3]];
          // direction must agree
          if ((rx - qx) * dx + (ry - qy) * dy <= 0) continue;
          const [a, b, c, d] = linear(sc, rot);
          consider([a, b, c, d, qx - (a * g[0] + c * g[1]), qy - (b * g[0] + d * g[1])]);
        }
      }
    }
  }
  void pb;
  void gb;
  if (!found.best) return null;
  let best: Transform = found.best;
  // refine translation (and scale when it was searched) on inlier pairs
  for (let it = 0; it < 3; it++) {
    const pairs: [number, number, number, number][] = [];
    for (const [x, y] of gtPts) {
      const [vx, vy] = apply(best, x, y);
      const p = index.near(vx, vy, 1);
      if (p) pairs.push([x, y, p[0], p[1]]);
    }
    if (pairs.length < 4) break;
    const [a0, b0, c0, d0]: number[] = best.m;
    const sc0 = Math.hypot(a0, b0);
    // unit linear part, then least-squares scale + offset
    const ua = a0 / sc0, ub = b0 / sc0, uc = c0 / sc0, ud = d0 / sc0;
    let mx = 0, my = 0, mpx = 0, mpy = 0;
    for (const [x, y, px, py] of pairs) {
      mx += ua * x + uc * y;
      my += ub * x + ud * y;
      mpx += px;
      mpy += py;
    }
    const n = pairs.length;
    mx /= n; my /= n; mpx /= n; mpy /= n;
    let num = 0, den = 0;
    for (const [x, y, px, py] of pairs) {
      const qx = ua * x + uc * y - mx, qy = ub * x + ud * y - my;
      num += qx * (px - mpx) + qy * (py - mpy);
      den += qx * qx + qy * qy;
    }
    const sc = den > 0 ? num / den : sc0;
    best = { m: [ua * sc, ub * sc, uc * sc, ud * sc, mpx - sc * mx, mpy - sc * my], inliers: 0, total: gtPts.length };
    for (const [x, y] of gtPts) {
      const [vx, vy] = apply(best, x, y);
      if (index.near(vx, vy, 0.75)) best.inliers++;
    }
  }
  return best;
}
