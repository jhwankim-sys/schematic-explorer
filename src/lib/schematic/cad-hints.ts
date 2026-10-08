// Hints that some CAD tools embed in their PDF exports.
//
// Altium "Smart PDF" writes the whole netlist into the bookmarks
// (sheet → Nets → <net> → Pins → "C7-2") and drops invisible marker texts on the
// drawing: "PI<ref>0<pin>" on every pin, "NL<net>" on net labels, "PO<port>" on
// ports and "CO<ref>" on parts. Together they give exact connectivity.

export interface CadNetlist {
  tool: "altium";
  /** page index → net name → pins ("C7-2") on that sheet */
  pages: Map<number, Map<string, string[]>>;
  /** page index → reference designator → pin numbers */
  parts: Map<number, Map<string, string[]>>;
}

interface OutlineItem {
  title: string;
  dest: unknown;
  items: OutlineItem[];
}

interface DocWithOutline {
  getOutline(): Promise<unknown[] | null>;
  getDestination?(name: string): Promise<unknown[] | null>;
  getPageIndex?(ref: unknown): Promise<number>;
}

async function pageOf(doc: DocWithOutline, item: OutlineItem): Promise<number> {
  const stack = [item];
  while (stack.length) {
    const it = stack.shift()!;
    let d = it.dest as unknown;
    if (typeof d === "string" && doc.getDestination) d = await doc.getDestination(d);
    if (Array.isArray(d) && d[0] && typeof d[0] === "object" && doc.getPageIndex) return doc.getPageIndex(d[0]);
    if (Array.isArray(d) && typeof d[0] === "number") return d[0];
    stack.push(...(it.items ?? []));
  }
  return -1;
}

const strip = (s: string) => s.replace(/\s*\(\d+\)\s*$/, "").trim();

export async function readAltiumNetlist(doc: DocWithOutline): Promise<CadNetlist | null> {
  const outline = (await doc.getOutline()) as OutlineItem[] | null;
  if (!outline?.length) return null;
  const pages = new Map<number, Map<string, string[]>>();
  const parts = new Map<number, Map<string, string[]>>();
  // every node that owns a "Nets" child is a sheet
  const visit = async (it: OutlineItem) => {
    const kids = it.items ?? [];
    const nets = kids.find((k) => strip(k.title) === "Nets");
    const comps = kids.find((k) => strip(k.title) === "Components");
    if (nets || comps) {
      const page = await pageOf(doc, it);
      if (page >= 0) {
        const nm = pages.get(page) ?? new Map<string, string[]>();
        for (const n of nets?.items ?? []) {
          const pinsNode = n.items.find((k) => strip(k.title) === "Pins");
          const pins = (pinsNode?.items ?? []).map((p) => p.title.trim());
          if (pins.length) nm.set(n.title.trim(), [...(nm.get(n.title.trim()) ?? []), ...pins]);
        }
        pages.set(page, nm);
        const pm = parts.get(page) ?? new Map<string, string[]>();
        for (const c of comps?.items ?? []) {
          const ref = c.title.trim();
          pm.set(
            ref,
            c.items.map((p) => p.title.trim().slice(ref.length + 1)),
          );
        }
        parts.set(page, pm);
      }
    }
    for (const k of kids) if (k !== nets && k !== comps) await visit(k);
  };
  for (const it of outline) await visit(it);
  let total = 0;
  pages.forEach((m) => (total += m.size));
  if (!total) return null;
  return { tool: "altium", pages, parts };
}

export type MarkerKind = "pin" | "part" | "netLabel" | "port";

export interface Marker {
  kind: MarkerKind;
  /** pin: "C7-2", part: "C7", netLabel / port: the name */
  name: string;
  box: [number, number, number, number];
}

const MARK = /^(PI|CO|NL|PO)(\S+)$/;

/**
 * Altium marker strings use a font that is only used for them; a string that does
 * not match the pattern disqualifies its font.
 */
export function markerFonts(texts: { str: string; font: string }[]): Set<string> {
  const ok = new Map<string, number>();
  const bad = new Set<string>();
  for (const t of texts) {
    const s = t.str.trim();
    if (!s) continue;
    if (s.split(/\s+/).every((w) => MARK.test(w))) ok.set(t.font, (ok.get(t.font) ?? 0) + 1);
    else bad.add(t.font);
  }
  const out = new Set<string>();
  ok.forEach((n, f) => {
    if (!bad.has(f) && n >= 3) out.add(f);
  });
  return out;
}

/** "PIU2016" → "U2-16" using the sheet's known parts ("U2" has pin "16"). */
export function decodePin(code: string, parts: Map<string, string[]> | undefined): string | null {
  if (parts) {
    let best: string | null = null;
    for (let i = 1; i < code.length - 1; i++) {
      const ref = code.slice(0, i);
      const pins = parts.get(ref);
      if (!pins) continue;
      const rest = code.slice(i);
      if (rest[0] !== "0") continue;
      const pin = rest.slice(1);
      if (pins.includes(pin)) best = `${ref}-${pin}`;
    }
    if (best) return best;
  }
  const m = /^([A-Z]+\d+?)0(\w+)$/i.exec(code);
  return m ? `${m[1]}-${m[2]}` : null;
}

/** marker words with their character span inside the string (pdf.js may merge several into one item) */
export function splitMarkerWords(str: string): { kind: MarkerKind; code: string; start: number; end: number }[] {
  const out: { kind: MarkerKind; code: string; start: number; end: number }[] = [];
  for (const wm of str.matchAll(/\S+/g)) {
    const w = wm[0];
    // several pins can be glued together: "PIU2016PIU2017"
    let off = 0;
    for (const part of w.startsWith("PI") ? w.split(/(?=PI[A-Z])/) : [w]) {
      const start = (wm.index ?? 0) + off;
      off += part.length;
      const m = MARK.exec(part);
      if (!m) continue;
      const kind: MarkerKind = m[1] === "PI" ? "pin" : m[1] === "CO" ? "part" : m[1] === "NL" ? "netLabel" : "port";
      out.push({ kind, code: m[2], start, end: start + part.length });
    }
  }
  return out;
}
