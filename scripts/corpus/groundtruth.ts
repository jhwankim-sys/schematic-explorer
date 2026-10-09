// Ground truth ("정답") read from the CAD source next to a schematic PDF.
// Every reader returns wires in the source's own drawing units; the scorer maps
// them onto the PDF page (see align.ts).

export interface GtWire {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  net: number;
}

export interface GtNet {
  id: number;
  /** names visibly written on the sheet (labels, power symbols) */
  names: string[];
}

export interface GroundTruth {
  /** source units → PDF points, when the format fixes it (KiCad); Eagle needs fitting */
  unitToPt: number | null;
  /** true when +y points down in source coordinates */
  yDown: boolean;
  wires: GtWire[];
  nets: GtNet[];
  /** reference designators placed on the sheet (R1, U3 …) */
  refs: string[];
  /** value written next to each reference (10k/R0402, LM358 …), when the format stores it */
  values: Record<string, string>;
  /** label anchors, used to align coordinates */
  labels: { name: string; x: number; y: number }[];
}

class DSU {
  p: number[] = [];
  add() {
    this.p.push(this.p.length);
    return this.p.length - 1;
  }
  find(a: number): number {
    while (this.p[a] !== a) a = this.p[a] = this.p[this.p[a]];
    return a;
  }
  union(a: number, b: number) {
    a = this.find(a);
    b = this.find(b);
    if (a !== b) this.p[b] = a;
  }
}

function onSeg(px: number, py: number, w: { x1: number; y1: number; x2: number; y2: number }, eps: number) {
  const dx = w.x2 - w.x1;
  const dy = w.y2 - w.y1;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(px - w.x1, py - w.y1) <= eps;
  const t = ((px - w.x1) * dx + (py - w.y1) * dy) / l2;
  if (t < -1e-9 || t > 1 + 1e-9) return false;
  return Math.hypot(w.x1 + t * dx - px, w.y1 + t * dy - py) <= eps;
}

/**
 * Builds nets from bare geometry the way schematic editors do: touching ends,
 * ends landing on a wire, junctions, and same-named labels / power symbols.
 */
/** KiCad text markup → what is printed: {slash} → /, ~{X} (overbar) → X */
export function plainName(s: string): string {
  return s
    .replace(/\{slash\}/g, "/")
    .replace(/\{backslash\}/g, "\\")
    .replace(/[~^_]\{([^}]*)\}/g, "$1")
    .replace(/^~/, "");
}

function connect(
  rawWires: { x1: number; y1: number; x2: number; y2: number }[],
  junctions: [number, number][],
  named: { name: string; x: number; y: number; global: boolean }[],
  eps: number,
): { wires: GtWire[]; nets: GtNet[] } {
  const dsu = new DSU();
  rawWires.forEach(() => dsu.add());
  const pts: [number, number, number][] = [];
  rawWires.forEach((w, i) => pts.push([w.x1, w.y1, i], [w.x2, w.y2, i]));
  // bucket ends for speed
  const key = (x: number, y: number) => `${Math.round(x / (eps * 4))},${Math.round(y / (eps * 4))}`;
  const ends = new Map<string, number[]>();
  for (const [x, y, i] of pts) {
    const k = key(x, y);
    (ends.get(k) ?? ends.set(k, []).get(k)!).push(i);
  }
  for (const list of ends.values()) for (let i = 1; i < list.length; i++) {
    const a = rawWires[list[0]];
    const b = rawWires[list[i]];
    const touch =
      [[a.x1, a.y1], [a.x2, a.y2]].some(([x, y]) => Math.hypot(x - b.x1, y - b.y1) <= eps || Math.hypot(x - b.x2, y - b.y2) <= eps);
    if (touch) dsu.union(list[0], list[i]);
  }
  // a wire end on another wire's span joins only at a junction dot
  for (const [x, y] of junctions) {
    const hit = rawWires.map((w, j) => (onSeg(x, y, w, eps) ? j : -1)).filter((j) => j >= 0);
    for (let k = 1; k < hit.length; k++) dsu.union(hit[0], hit[k]);
  }
  const nameOf = new Map<number, Set<string>>();
  const byName = new Map<string, number>();
  for (const n of named) {
    const j = rawWires.findIndex((w) => onSeg(n.x, n.y, w, eps));
    if (j < 0) continue;
    const key2 = n.name.toUpperCase();
    const prev = byName.get(key2);
    if (prev !== undefined) dsu.union(prev, j);
    else byName.set(key2, j);
    const r = dsu.find(j);
    (nameOf.get(r) ?? nameOf.set(r, new Set()).get(r)!).add(n.name);
  }
  const rootId = new Map<number, number>();
  const nets: GtNet[] = [];
  const wires: GtWire[] = rawWires.map((w, i) => {
    const r = dsu.find(i);
    let id = rootId.get(r);
    if (id === undefined) {
      id = nets.length;
      rootId.set(r, id);
      nets.push({ id, names: [] });
    }
    return { ...w, net: id };
  });
  // names were collected on intermediate roots; re-resolve
  for (const n of named) {
    const j = rawWires.findIndex((w) => onSeg(n.x, n.y, w, eps));
    if (j < 0) continue;
    const net = nets[wires[j].net];
    const nm = plainName(n.name);
    if (!net.names.includes(nm)) net.names.push(nm);
  }
  return { wires, nets };
}

// ---------------------------------------------------------------- KiCad 4/5 (.sch)

export function readKicadLegacy(src: string): GroundTruth {
  const lines = src.split(/\r?\n/);
  const wires: { x1: number; y1: number; x2: number; y2: number }[] = [];
  const junctions: [number, number][] = [];
  const named: { name: string; x: number; y: number; global: boolean }[] = [];
  const refs: string[] = [];
  const values: Record<string, string> = {};
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.startsWith("Wire Wire Line")) {
      const [x1, y1, x2, y2] = lines[++i].trim().split(/\s+/).map(Number);
      wires.push({ x1, y1, x2, y2 });
    } else if (l.startsWith("Connection ~")) {
      const [, , x, y] = l.trim().split(/\s+/);
      junctions.push([+x, +y]);
    } else if (/^Text (Label|GLabel|HLabel)/.test(l)) {
      const f = l.trim().split(/\s+/);
      const name = lines[++i].trim();
      named.push({ name, x: +f[2], y: +f[3], global: f[1] !== "Label" });
    } else if (l.startsWith("$Comp")) {
      let ref = "";
      let value = "";
      let x = 0;
      let y = 0;
      let lib = "";
      for (i++; i < lines.length && !lines[i].startsWith("$EndComp"); i++) {
        const c = lines[i];
        if (c.startsWith("L ")) {
          const f = c.split(/\s+/);
          lib = f[1];
          ref = f[2];
        } else if (c.startsWith("P ")) {
          const f = c.split(/\s+/);
          x = +f[1];
          y = +f[2];
        } else if (c.startsWith("F 0 ")) {
          // the annotated reference as printed (the "L" line keeps "C?" on sheets annotated through AR paths)
          const shown = /"([^"]*)"/.exec(c)?.[1];
          if (shown) ref = shown;
        } else if (c.startsWith("F 1 ")) value = /"([^"]*)"/.exec(c)?.[1] ?? "";
      }
      if (ref.startsWith("#PWR") || /power:/i.test(lib)) {
        if (value && !/PWR_FLAG/i.test(value)) named.push({ name: value, x, y, global: true });
      } else if (!ref.startsWith("#")) {
        ref = ref.replace(/\?$/, "");
        refs.push(ref);
        if (value && !(ref in values)) values[ref] = plainName(value);
      }
    }
  }
  const { wires: w, nets } = connect(wires, junctions, named, 0.6);
  return {
    unitToPt: 72 / 1000,
    yDown: true,
    wires: w,
    nets,
    refs: [...new Set(refs)],
    values,
    labels: named.map(({ name, x, y }) => ({ name, x, y })),
  };
}

// ---------------------------------------------------------------- KiCad 6+ (.kicad_sch)

type SExpr = string | SExpr[];

export function parseSexpr(src: string): SExpr {
  let i = 0;
  const n = src.length;
  const read = (): SExpr => {
    while (i < n && /\s/.test(src[i])) i++;
    if (src[i] === "(") {
      i++;
      const list: SExpr[] = [];
      for (;;) {
        while (i < n && /\s/.test(src[i])) i++;
        if (src[i] === ")") {
          i++;
          return list;
        }
        if (i >= n) return list;
        list.push(read());
      }
    }
    if (src[i] === '"') {
      let s = "";
      i++;
      while (i < n && src[i] !== '"') {
        if (src[i] === "\\") i++;
        s += src[i++];
      }
      i++;
      return s;
    }
    const st = i;
    while (i < n && !/[\s()]/.test(src[i])) i++;
    return src.slice(st, i);
  };
  return read();
}

const head = (e: SExpr) => (Array.isArray(e) ? (e[0] as string) : "");
const kids = (e: SExpr, name: string) => (Array.isArray(e) ? (e.filter((c) => head(c) === name) as SExpr[][]) : []);
const kid = (e: SExpr, name: string) => kids(e, name)[0];

interface LibPin {
  x: number;
  y: number;
  unit: number;
}

function libPins(sym: SExpr[]): LibPin[] {
  const out: LibPin[] = [];
  // sub-symbols are named "<name>_<unit>_<style>"
  for (const sub of kids(sym, "symbol")) {
    const m = /_(\d+)_(\d+)$/.exec(sub[1] as string);
    const unit = m ? +m[1] : 0;
    for (const p of kids(sub, "pin")) {
      const at = kid(p, "at");
      out.push({ x: +at[1], y: +at[2], unit });
    }
  }
  return out;
}

export function readKicadSexpr(src: string): GroundTruth {
  const root = parseSexpr(src) as SExpr[];
  const wires: { x1: number; y1: number; x2: number; y2: number }[] = [];
  const junctions: [number, number][] = [];
  const named: { name: string; x: number; y: number; global: boolean }[] = [];
  const refs: string[] = [];
  const values: Record<string, string> = {};
  const libs = new Map<string, { power: boolean; pins: LibPin[] }>();
  for (const s of kids(kid(root, "lib_symbols") ?? [], "symbol"))
    libs.set(s[1] as string, { power: kids(s, "power").length > 0, pins: libPins(s) });

  for (const e of root.slice(1)) {
    const h = head(e);
    if (h === "wire") {
      const xy = kids(kid(e, "pts"), "xy");
      wires.push({ x1: +xy[0][1], y1: +xy[0][2], x2: +xy[1][1], y2: +xy[1][2] });
    } else if (h === "junction") {
      const at = kid(e, "at");
      junctions.push([+at[1], +at[2]]);
    } else if (h === "label" || h === "global_label" || h === "hierarchical_label") {
      const at = kid(e, "at");
      named.push({ name: (e as SExpr[])[1] as string, x: +at[1], y: +at[2], global: h !== "label" });
    } else if (h === "symbol") {
      const libId = kid(e, "lib_id")?.[1] as string;
      const at = kid(e, "at");
      const [x, y, rot] = [+at[1], +at[2], +(at[3] ?? 0)];
      const mirror = kid(e, "mirror")?.[1] as string | undefined;
      const unit = +(kid(e, "unit")?.[1] ?? 1);
      const prop = (name: string) => kids(e, "property").find((p) => p[1] === name)?.[2] as string | undefined;
      const ref = prop("Reference") ?? "";
      const lib = libs.get(libId);
      if (lib?.power || ref.startsWith("#PWR")) {
        const value = prop("Value");
        // power symbols connect at their pin; place it like the editor does
        const pins = lib?.pins.filter((p) => p.unit === 0 || p.unit === unit) ?? [];
        const p = pins[0] ?? { x: 0, y: 0 };
        let px = p.x;
        let py = -p.y; // library is y-up
        if (mirror === "x") py = -py;
        if (mirror === "y") px = -px;
        const r = (-rot * Math.PI) / 180;
        const qx = px * Math.cos(r) - py * Math.sin(r);
        const qy = px * Math.sin(r) + py * Math.cos(r);
        if (value && !/PWR_FLAG/i.test(value)) named.push({ name: value, x: x + qx, y: y + qy, global: true });
      } else if (ref && !ref.startsWith("#")) {
        refs.push(ref);
        const value = prop("Value");
        if (value && !(ref in values)) values[ref] = plainName(value);
      }
    }
  }
  const { wires: w, nets } = connect(wires, junctions, named, 0.02);
  return {
    unitToPt: 72 / 25.4,
    yDown: true,
    wires: w,
    nets,
    refs: [...new Set(refs)],
    values,
    labels: named.map(({ name, x, y }) => ({ name, x, y })),
  };
}

// ---------------------------------------------------------------- Eagle (.sch XML)

function attrs(tag: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of tag.matchAll(/([\w:-]+)="([^"]*)"/g)) out[m[1]] = m[2].replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  return out;
}

/** Eagle stores nets explicitly per sheet; only the first sheet is read. */
export function readEagle(src: string, sheetIndex = 0): GroundTruth {
  const sheets = [...src.matchAll(/<sheet>([\s\S]*?)<\/sheet>/g)].map((m) => m[1]);
  const sheet = sheets[sheetIndex] ?? "";
  const wires: GtWire[] = [];
  const nets: GtNet[] = [];
  const labels: { name: string; x: number; y: number }[] = [];
  for (const m of sheet.matchAll(/<net ([^>]*)>([\s\S]*?)<\/net>/g)) {
    const a = attrs(m[1]);
    const id = nets.length;
    const hasLabel = /<label /.test(m[2]);
    const name = a.name ?? "";
    nets.push({ id, names: hasLabel || (name && !/^N\$/.test(name)) ? [name] : [] });
    for (const w of m[2].matchAll(/<wire ([^>]*)\/>/g)) {
      const b = attrs(w[1]);
      if (b.curve) continue;
      wires.push({ x1: +b.x1, y1: +b.y1, x2: +b.x2, y2: +b.y2, net: id });
    }
    for (const l of m[2].matchAll(/<label ([^>]*)\/?>/g)) {
      const b = attrs(l[1]);
      labels.push({ name, x: +b.x, y: +b.y });
    }
  }
  const parts = new Map<string, string>();
  for (const p of src.matchAll(/<part ([^>]*?)\/?>/g)) {
    const a = attrs(p[1]);
    if (a.name) parts.set(a.name, a.deviceset ?? "");
  }
  const refs: string[] = [];
  for (const ins of sheet.matchAll(/<instance ([^>]*?)\/?>/g)) {
    const a = attrs(ins[1]);
    if (a.part && /^[A-Z]+\d+[A-Z]?$/i.test(a.part)) refs.push(a.part);
  }
  return { unitToPt: null, yDown: false, wires, nets, refs: [...new Set(refs)], values: {}, labels };
}

export function readGroundTruth(fileName: string, src: string): GroundTruth {
  if (/\.kicad_sch$/i.test(fileName)) return readKicadSexpr(src);
  if (src.startsWith("EESchema")) return readKicadLegacy(src);
  if (/<eagle /.test(src)) return readEagle(src);
  throw new Error(`알 수 없는 원본 형식: ${fileName}`);
}
