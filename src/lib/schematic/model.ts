import { distPtSeg, Grid, isPowerName, type SchPage, type SchText } from "./analyze.ts";

export type Selection =
  | { type: "net"; page: number; netIds: number[]; name: string }
  | { type: "component"; ref: string }
  | null;

export interface NetEntry {
  name: string;
  power: boolean;
  /** per page: net ids carrying this name */
  where: { page: number; netIds: number[] }[];
  labelCount: number;
}

export interface CompEntry {
  ref: string;
  values: string[];
  where: { page: number; textIds: number[] }[];
}

export type Box = [number, number, number, number];

/** Spatial index over one page for click hit-testing. */
export class PageIndex {
  page: SchPage;
  segGrid = new Grid(10);
  textGrid = new Grid(10);
  constructor(page: SchPage) {
    this.page = page;
    const s = page.segs;
    for (let i = 0; i < s.length / 4; i++) {
      this.segGrid.add(i, Math.min(s[4 * i], s[4 * i + 2]), Math.min(s[4 * i + 1], s[4 * i + 3]), Math.max(s[4 * i], s[4 * i + 2]), Math.max(s[4 * i + 1], s[4 * i + 3]));
    }
    for (const t of page.texts) this.textGrid.add(t.id, t.x0, t.y0, t.x1, t.y1);
  }
  textAt(x: number, y: number, tol: number): SchText | null {
    let best: SchText | null = null;
    let bestA = Infinity;
    for (const id of this.textGrid.query(x - tol, y - tol, x + tol, y + tol)) {
      const t = this.page.texts[id];
      if (x >= t.x0 - tol && x <= t.x1 + tol && y >= t.y0 - tol && y <= t.y1 + tol) {
        const a = (t.x1 - t.x0) * (t.y1 - t.y0);
        if (a < bestA) {
          bestA = a;
          best = t;
        }
      }
    }
    return best;
  }
  segAt(x: number, y: number, tol: number): number {
    const s = this.page.segs;
    let best = -1;
    let bestD = tol;
    for (const i of this.segGrid.query(x - tol, y - tol, x + tol, y + tol)) {
      const d = distPtSeg(x, y, s[4 * i], s[4 * i + 1], s[4 * i + 2], s[4 * i + 3]);
      if (d <= bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }
}

export function buildNetEntries(pages: SchPage[]): NetEntry[] {
  const map = new Map<string, NetEntry>();
  for (const p of pages) {
    for (const n of p.nets) {
      if (!n.name) continue;
      const key = n.name.toUpperCase();
      let e = map.get(key);
      if (!e) {
        e = { name: n.name, power: isPowerName(n.name), where: [], labelCount: 0 };
        map.set(key, e);
      }
      let w = e.where.find((x) => x.page === p.index);
      if (!w) {
        w = { page: p.index, netIds: [] };
        e.where.push(w);
      }
      w.netIds.push(n.id);
      e.labelCount += n.labels.filter((id) => p.texts[id].str.toUpperCase() === key).length;
    }
  }
  return [...map.values()].sort(
    (a, b) => Number(b.power) - Number(a.power) || a.name.localeCompare(b.name, undefined, { numeric: true }),
  );
}

export function buildCompEntries(pages: SchPage[]): CompEntry[] {
  const map = new Map<string, CompEntry>();
  for (const p of pages)
    for (const c of p.components) {
      let e = map.get(c.ref);
      if (!e) {
        e = { ref: c.ref, values: [], where: [] };
        map.set(c.ref, e);
      }
      for (const v of c.values) if (!e.values.includes(v)) e.values.push(v);
      e.where.push({ page: p.index, textIds: c.textIds });
    }
  return [...map.values()].sort((a, b) => a.ref.localeCompare(b.ref, undefined, { numeric: true }));
}

/** nets on a page that share a display name (same node across the sheet) */
export function netsNamed(page: SchPage, name: string): number[] {
  const key = name.toUpperCase();
  return page.nets.filter((n) => n.name.toUpperCase() === key).map((n) => n.id);
}

export function unionBox(boxes: Box[]): Box | null {
  if (!boxes.length) return null;
  const b: Box = [Infinity, Infinity, -Infinity, -Infinity];
  for (const x of boxes) {
    b[0] = Math.min(b[0], x[0]);
    b[1] = Math.min(b[1], x[1]);
    b[2] = Math.max(b[2], x[2]);
    b[3] = Math.max(b[3], x[3]);
  }
  return b;
}

export function textBox(t: SchText): Box {
  return [t.x0, t.y0, t.x1, t.y1];
}

export function netBox(page: SchPage, netIds: number[]): Box | null {
  const boxes: Box[] = [];
  for (const id of netIds) {
    const n = page.nets[id];
    boxes.push(n.bbox);
    for (const l of n.labels) boxes.push(textBox(page.texts[l]));
  }
  return unionBox(boxes);
}

export function segPath(page: SchPage, netIds: number[]): string {
  const parts: string[] = [];
  const s = page.segs;
  for (const id of netIds)
    for (const i of page.nets[id].segs)
      parts.push(`M${s[4 * i].toFixed(2)} ${s[4 * i + 1].toFixed(2)}L${s[4 * i + 2].toFixed(2)} ${s[4 * i + 3].toFixed(2)}`);
  return parts.join("");
}

export function matchTexts(page: SchPage, query: string): SchText[] {
  const q = query.trim().toUpperCase();
  if (!q) return [];
  return page.texts.filter((t) => t.str.toUpperCase().includes(q));
}
