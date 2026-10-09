// Compares an analysed page with ground truth.
import type { SchPage } from "../../src/lib/schematic/analyze.ts";
import { apply, type Transform } from "./align.ts";
import { plainName as plainNameOf, type GroundTruth } from "./groundtruth.ts";

export interface WireScore {
  /** share of detected wire length that lies on a real wire (글자선·테두리 오인식이 적을수록 높음) */
  wirePrecision: number;
  /** share of real wire length that was detected */
  wireRecall: number;
  /** length-weighted pairwise precision of grouping (서로 다른 노드를 합친 정도) */
  groupPrecision: number;
  /** length-weighted pairwise recall of grouping (같은 노드가 끊긴 정도) */
  groupRecall: number;
  /** share of real nets recovered exactly (≥95% pure both ways) */
  netExact: number;
  /** share of visibly named nets whose detected name matches */
  naming: number;
  namedNets: number;
  refRecall: number;
  refPrecision: number;
  /** share of detected parts (with a value printed on the sheet) listed with exactly that value first */
  valueExact: number;
  gtNets: number;
  /** examples for the report */
  wrongNames: string[];
  missedRefs: string[];
  extraRefs: string[];
  /** node names we list that no label / power symbol of the source carries (titles, pin names, values …) */
  phantomNames: string[];
  wrongValues: string[];
}

const TOL = 0.8;

function distToLine(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1, dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  if (!l2) return { d: Math.hypot(px - x1, py - y1), t: 0 };
  const t = ((px - x1) * dx + (py - y1) * dy) / l2;
  return { d: Math.abs((px - x1) * dy - (py - y1) * dx) / Math.sqrt(l2), t };
}

export function scoreWires(page: SchPage, gt: GroundTruth, tf: Transform): WireScore {
  const gw = gt.wires.map((w) => {
    const [x1, y1] = apply(tf, w.x1, w.y1);
    const [x2, y2] = apply(tf, w.x2, w.y2);
    return { x1, y1, x2, y2, net: w.net, len: Math.hypot(x2 - x1, y2 - y1) };
  });
  // grid over GT wires
  const cell = 20;
  const grid = new Map<string, number[]>();
  gw.forEach((w, i) => {
    for (let gx = Math.floor((Math.min(w.x1, w.x2) - TOL) / cell); gx <= Math.floor((Math.max(w.x1, w.x2) + TOL) / cell); gx++)
      for (let gy = Math.floor((Math.min(w.y1, w.y2) - TOL) / cell); gy <= Math.floor((Math.max(w.y1, w.y2) + TOL) / cell); gy++) {
        const k = `${gx},${gy}`;
        (grid.get(k) ?? grid.set(k, []).get(k)!).push(i);
      }
  });
  const candidates = (x: number, y: number) => grid.get(`${Math.floor(x / cell)},${Math.floor(y / cell)}`) ?? [];

  const s = page.segs;
  const nSeg = s.length / 4;
  let total = 0;
  let matched = 0;
  // contingency: pred net × gt net → length
  const cont = new Map<number, Map<number, number>>();
  for (let i = 0; i < nSeg; i++) {
    const x1 = s[4 * i], y1 = s[4 * i + 1], x2 = s[4 * i + 2], y2 = s[4 * i + 3];
    const len = Math.hypot(x2 - x1, y2 - y1);
    total += len;
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    let hit = -1;
    for (const j of candidates(mx, my)) {
      const w = gw[j];
      const a = distToLine(x1, y1, w.x1, w.y1, w.x2, w.y2);
      const b = distToLine(x2, y2, w.x1, w.y1, w.x2, w.y2);
      const m = distToLine(mx, my, w.x1, w.y1, w.x2, w.y2);
      const slack = TOL / Math.max(w.len, 1e-6);
      if (a.d <= TOL && b.d <= TOL && m.t >= -slack && m.t <= 1 + slack) {
        hit = j;
        break;
      }
    }
    if (hit < 0) continue;
    matched += len;
    const pn = page.segNet[i];
    const row = cont.get(pn) ?? cont.set(pn, new Map()).get(pn)!;
    row.set(gw[hit].net, (row.get(gw[hit].net) ?? 0) + len);
  }

  // recall: sample real wires
  const segGrid = new Map<string, number[]>();
  for (let i = 0; i < nSeg; i++) {
    const x1 = s[4 * i], y1 = s[4 * i + 1], x2 = s[4 * i + 2], y2 = s[4 * i + 3];
    for (let gx = Math.floor((Math.min(x1, x2) - TOL) / cell); gx <= Math.floor((Math.max(x1, x2) + TOL) / cell); gx++)
      for (let gy = Math.floor((Math.min(y1, y2) - TOL) / cell); gy <= Math.floor((Math.max(y1, y2) + TOL) / cell); gy++) {
        const k = `${gx},${gy}`;
        (segGrid.get(k) ?? segGrid.set(k, []).get(k)!).push(i);
      }
  }
  let gtLen = 0;
  let covered = 0;
  for (const w of gw) {
    const n = Math.max(1, Math.ceil(w.len / 1.5));
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n;
      const px = w.x1 + t * (w.x2 - w.x1), py = w.y1 + t * (w.y2 - w.y1);
      const piece = w.len / n;
      gtLen += piece;
      const ok = (segGrid.get(`${Math.floor(px / cell)},${Math.floor(py / cell)}`) ?? []).some((i) => {
        const r = distToLine(px, py, s[4 * i], s[4 * i + 1], s[4 * i + 2], s[4 * i + 3]);
        const l = Math.hypot(s[4 * i + 2] - s[4 * i], s[4 * i + 3] - s[4 * i + 1]);
        const slack = TOL / Math.max(l, 1e-6);
        return r.d <= TOL && r.t >= -slack && r.t <= 1 + slack;
      });
      if (ok) covered += piece;
    }
  }

  // pairwise grouping (length-weighted)
  let sumIJ = 0, sumI = 0;
  const colTot = new Map<number, number>();
  for (const row of cont.values()) {
    let ri = 0;
    for (const [j, v] of row) {
      sumIJ += v * v;
      ri += v;
      colTot.set(j, (colTot.get(j) ?? 0) + v);
    }
    sumI += ri * ri;
  }
  let sumJ = 0;
  for (const v of colTot.values()) sumJ += v * v;

  // exact nets + naming
  const rowTot = new Map<number, number>();
  for (const [i, row] of cont) rowTot.set(i, [...row.values()].reduce((a, b) => a + b, 0));
  let exact = 0, considered = 0, namedOk = 0, named = 0;
  const wrongNames: string[] = [];
  for (const net of gt.nets) {
    const col = colTot.get(net.id) ?? 0;
    const real = gw.filter((w) => w.net === net.id).reduce((a, w) => a + w.len, 0);
    if (real < 3) continue;
    considered++;
    let bestI = -1, bestV = 0;
    for (const [i, row] of cont) {
      const v = row.get(net.id) ?? 0;
      if (v > bestV) {
        bestV = v;
        bestI = i;
      }
    }
    if (bestI >= 0 && bestV / real >= 0.95 && bestV / (rowTot.get(bestI) ?? 1) >= 0.95) exact++;
    if (net.names.length) {
      named++;
      const got = bestI >= 0 ? page.nets[bestI]?.name ?? "" : "";
      if (net.names.some((n) => n.toUpperCase() === got.toUpperCase())) namedOk++;
      else if (wrongNames.length < 12) wrongNames.push(`${net.names[0]}→${got || "(없음)"}`);
    }
    void col;
  }

  // reference designators visible on the page
  const pdfStrings = new Set(page.texts.map((t) => t.str.trim()));
  const gtRefs = gt.refs.filter((r) => pdfStrings.has(r));
  const ours = new Set(page.components.map((c) => c.ref));
  const hit = gtRefs.filter((r) => ours.has(r)).length;
  const gtSet = new Set(gt.refs);
  // every name a wire can carry in the source (attached or not): anything else we list is not a net
  const realNames = new Set(gt.labels.map((l) => plainNameOf(l.name).toUpperCase()));
  const phantomNames = [...new Set(page.nets.map((n) => n.name).filter((n) => n && !realNames.has(n.toUpperCase())))];
  // values: only parts we found and whose value is printed on the sheet as one text
  let valueOk = 0, valueAll = 0;
  const wrongValues: string[] = [];
  for (const c of page.components) {
    const want = gt.values[c.ref];
    if (!want || !pdfStrings.has(want)) continue;
    valueAll++;
    if (c.values[0] === want) valueOk++;
    else wrongValues.push(`${c.ref}: ${want}→${c.values[0] ?? "(없음)"}`);
  }
  return {
    wirePrecision: total ? matched / total : 0,
    wireRecall: gtLen ? covered / gtLen : 0,
    groupPrecision: sumI ? sumIJ / sumI : 0,
    groupRecall: sumJ ? sumIJ / sumJ : 0,
    netExact: considered ? exact / considered : 0,
    naming: named ? namedOk / named : NaN,
    namedNets: named,
    refRecall: gtRefs.length ? hit / gtRefs.length : NaN,
    refPrecision: ours.size ? [...ours].filter((r) => gtSet.has(r)).length / ours.size : NaN,
    valueExact: valueAll ? valueOk / valueAll : NaN,
    phantomNames,
    wrongValues,
    gtNets: considered,
    wrongNames,
    missedRefs: gtRefs.filter((r) => !ours.has(r)).slice(0, 12),
    extraRefs: [...ours].filter((r) => !gtSet.has(r)).slice(0, 12),
  };
}
