import { getDocumentProxy, getResolvedPDFJS } from "unpdf";
import { analyzePage, type PaintOp, type RawLink, type RawPath, type RawText, type SchPage } from "./analyze.ts";
import { readAltiumNetlist, type CadNetlist } from "./cad-hints.ts";

/** Minimal slice of the pdf.js page API that the extractor needs (keeps tests free of pdf.js types). */
export interface PdfPageLike {
  getViewport(o: { scale: number }): { width: number; height: number; transform: number[] };
  getOperatorList(): Promise<{ fnArray: ArrayLike<number>; argsArray: unknown[] }>;
  getTextContent(): Promise<{ items: unknown[] }>;
  /** link annotations (OrCAD Capture marks parts and net labels with them) */
  getAnnotations?(): Promise<unknown[]>;
  /** the page's own object reference (pdf.js) */
  ref?: { num: number; gen: number } | null;
}

/** properties OrCAD Capture stores in a part link's popup script, by annotation id ("12R") */
export type AnnotationProps = (id: string) => Record<string, string> | null;

/**
 * pdf.js does not hand out link scripts, so read them from the file: OrCAD writes
 * app.popUpMenu('Ref-Des=R13','Part Type=R1/4W', …) into every part link. Only plain
 * (uncompressed) objects are read; anything else simply yields no properties.
 */
export function annotationPropsReader(buf: Uint8Array): AnnotationProps {
  let index: { text: string; offsets: Map<number, number> } | null = null;
  const objectText = (num: number) => {
    if (!index) {
      const text = new TextDecoder("latin1").decode(buf);
      const offsets = new Map<number, number>();
      const re = /(?:^|[\r\n\s])(\d+)\s+0\s+obj\b/g;
      for (let m = re.exec(text); m; m = re.exec(text)) offsets.set(Number(m[1]), m.index + m[0].length);
      index = { text, offsets };
    }
    const { text, offsets } = index;
    const at = offsets.get(num);
    if (at === undefined) return null;
    const end = text.indexOf("endobj", at);
    return text.slice(at, end < 0 ? at + 20000 : Math.min(end, at + 200000));
  };
  /** a PDF literal string starting at s[i] === "(" (nested parentheses and escapes) */
  const literal = (s: string, i: number) => {
    let depth = 0;
    let out = "";
    for (let k = i; k < s.length; k++) {
      const c = s[k];
      if (c === "\\") {
        const n = s[k + 1];
        out += n === "n" ? "\n" : n === "r" ? "\r" : n === "t" ? "\t" : n ?? "";
        k++;
        continue;
      }
      if (c === "(") {
        if (depth++ > 0) out += c;
        continue;
      }
      if (c === ")") {
        if (--depth === 0) return out;
        out += c;
        continue;
      }
      out += c;
    }
    return out;
  };
  const scriptOf = (obj: string, hops = 0): string | null => {
    const js = /\/JS\s*\(/.exec(obj);
    if (js) return literal(obj, js.index + js[0].length - 1);
    const ref = /\/(?:A|JS)\s+(\d+)\s+0\s+R/.exec(obj);
    if (ref && hops < 2) {
      const o = objectText(Number(ref[1]));
      return o ? scriptOf(o, hops + 1) : null;
    }
    return null;
  };
  return (id: string) => {
    const m = /^(\d+)R/.exec(id);
    if (!m) return null;
    try {
      const obj = objectText(Number(m[1]));
      const js = obj && scriptOf(obj);
      if (!js || !/popUpMenu/.test(js)) return null;
      const props: Record<string, string> = {};
      for (const kv of js.matchAll(/'([^'=]{1,60})=([^']*)'/g)) if (!kv[1].startsWith("Rules.")) props[kv[1].trim()] = kv[2].trim();
      return Object.keys(props).length ? props : null;
    } catch {
      return null;
    }
  };
}

export interface PdfDocLike {
  numPages: number;
  getPage(n: number): Promise<PdfPageLike>;
  getOutline(): Promise<unknown[] | null>;
}

export interface Schematic {
  fileName: string;
  pages: SchPage[];
  /** pdf.js document, kept so the viewer can render the real drawing */
  pdf: unknown;
  /** netlist embedded by the CAD tool (Altium bookmarks), when present */
  cadNetlist: CadNetlist | null;
}

type Mat = [number, number, number, number, number, number];

function compose(m: Mat, n: ArrayLike<number>): Mat {
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ];
}

interface GState {
  ctm: Mat;
  lineWidth: number;
  stroke: string;
  fill: string;
}

/**
 * Walks one page's operator list and returns raw paths (with colour and line width)
 * plus text items, all in a y-up space whose height is the viewport height
 * (analyzePage flips y itself).
 */
export async function extractPage(page: PdfPageLike, OPS: Record<string, number>, annotProps?: AnnotationProps) {
  const vp = page.getViewport({ scale: 1 });
  const ops = await page.getOperatorList();
  const paintName = new Map<number, PaintOp>([
    [OPS.stroke, "stroke"],
    [OPS.closeStroke, "stroke"],
    [OPS.fill, "fill"],
    [OPS.eoFill, "fill"],
    [OPS.fillStroke, "fillStroke"],
    [OPS.eoFillStroke, "fillStroke"],
    [OPS.closeFillStroke, "fillStroke"],
    [OPS.closeEOFillStroke, "fillStroke"],
    [OPS.endPath, "none"],
  ]);
  // viewport handles page rotation / crop offsets: fold it into the CTM,
  // pre-flipped because analyzePage flips y using the page height
  const pre: Mat = compose([1, 0, 0, -1, 0, vp.height], vp.transform);
  let gs: GState = { ctm: pre, lineWidth: 1, stroke: "#000000", fill: "#000000" };
  const stack: GState[] = [];
  const paths: RawPath[] = [];
  const hex = (v: unknown) => (typeof v === "string" ? v.toLowerCase() : "#000000");

  for (let i = 0; i < ops.fnArray.length; i++) {
    const fn = ops.fnArray[i];
    const args = ops.argsArray[i] as unknown[];
    if (fn === OPS.save) stack.push({ ...gs });
    else if (fn === OPS.restore) gs = stack.pop() ?? { ...gs, ctm: pre };
    else if (fn === OPS.transform) gs.ctm = compose(gs.ctm, args as number[]);
    else if (fn === OPS.paintFormXObjectBegin) {
      stack.push({ ...gs });
      const m = args?.[0] as ArrayLike<number> | null;
      if (m && m.length === 6) gs.ctm = compose(gs.ctm, m);
    } else if (fn === OPS.paintFormXObjectEnd) gs = stack.pop() ?? { ...gs, ctm: pre };
    else if (fn === OPS.setLineWidth) gs.lineWidth = Number(args[0]) || 0;
    else if (fn === OPS.setStrokeRGBColor) gs.stroke = hex(args[0]);
    else if (fn === OPS.setFillRGBColor) gs.fill = hex(args[0]);
    else if (fn === OPS.setGState) {
      for (const kv of (args[0] as [string, unknown][]) ?? []) if (kv[0] === "LW") gs.lineWidth = Number(kv[1]) || 0;
    } else if (fn === OPS.constructPath) {
      const paintOp = args[0] as number;
      const dataArr = args[1] as ArrayLike<number>[] | null;
      const data = dataArr?.[0];
      if (!data) continue;
      const scale = Math.sqrt(Math.abs(gs.ctm[0] * gs.ctm[3] - gs.ctm[1] * gs.ctm[2]));
      paths.push({
        op: paintName.get(paintOp) ?? "stroke",
        data,
        ctm: gs.ctm,
        // zero-width lines are drawn one device pixel wide
        lineWidth: gs.lineWidth * scale,
        stroke: gs.stroke,
        fill: gs.fill,
      });
    }
  }

  const tc = await page.getTextContent();
  const texts: RawText[] = [];
  for (const it of tc.items as Array<{ str?: string; transform?: number[]; width?: number; height?: number; fontName?: string }>) {
    if (!it.str || !it.transform) continue;
    // text transform is in PDF space; map it through the viewport (pre-flipped)
    const t = compose(pre, it.transform);
    texts.push({ str: it.str, transform: t, width: it.width ?? 0, height: it.height ?? 0, font: it.fontName ?? "" });
  }

  // link annotations: OrCAD Capture wraps every part (ref + value) and every net label in one
  const links: RawLink[] = [];
  try {
    const annots = ((await page.getAnnotations?.()) ?? []) as Array<{ id?: string; subtype?: string; rect?: number[]; dest?: unknown; overlaidText?: string }>;
    const toY = (x: number, y: number) => [pre[0] * x + pre[2] * y + pre[4], pre[1] * x + pre[3] * y + pre[5]];
    const ownRef = page.ref?.num;
    for (const a of annots) {
      if (a.subtype !== "Link" || !a.rect || a.rect.length !== 4) continue;
      const [x0, y0, x1, y1] = a.rect;
      const p0 = toY(x0, y0);
      const p1 = toY(x1, y1);
      const link: RawLink = {
        rect: [Math.min(p0[0], p1[0]), Math.min(p0[1], p1[1]), Math.max(p0[0], p1[0]), Math.max(p0[1], p1[1])],
        kind: Array.isArray(a.dest) ? "net" : "part",
        text: a.overlaidText ?? "",
      };
      // where the link jumps to (OrCAD: the next label of the same net)
      if (Array.isArray(a.dest)) {
        const d = a.dest as unknown[];
        const target = d[0] as { num?: number } | number | null;
        const samePage = typeof target === "object" && target !== null && ownRef !== undefined ? target.num === ownRef : false;
        const kind = (d[1] as { name?: string } | null)?.name;
        const nums = d.slice(2).map(Number);
        let pt: number[] | null = null;
        if (kind === "FitR" && nums.length >= 4 && nums.every(Number.isFinite)) pt = toY((nums[0] + nums[2]) / 2, (nums[1] + nums[3]) / 2);
        else if (kind === "XYZ" && Number.isFinite(nums[0]) && Number.isFinite(nums[1])) pt = toY(nums[0], nums[1]);
        if (pt && samePage) link.dest = [pt[0], pt[1]];
      } else if (annotProps && a.id) {
        const props = annotProps(a.id);
        if (props) link.props = props;
      }
      links.push(link);
    }
  } catch {
    /* annotations are only hints */
  }
  return { width: vp.width, height: vp.height, paths, texts, links };
}

export async function analyzeDocument(
  pdf: PdfDocLike,
  OPS: Record<string, number>,
  onProgress?: (msg: string, ratio: number) => void,
  annotProps?: AnnotationProps,
): Promise<{ pages: SchPage[]; cadNetlist: CadNetlist | null }> {
  const pages: SchPage[] = [];
  const total = pdf.numPages;
  const cadNetlist = await readAltiumNetlist(pdf).catch(() => null);
  for (let p = 1; p <= total; p++) {
    onProgress?.(`${p}/${total} 페이지 도면 읽는 중`, (p - 1) / total);
    const page = await pdf.getPage(p);
    const raw = await extractPage(page, OPS, annotProps);
    onProgress?.(`${p}/${total} 페이지 연결 분석 중`, (p - 0.5) / total);
    await new Promise((r) => setTimeout(r, 0));
    pages.push(analyzePage(p - 1, raw.width, raw.height, raw.paths, raw.texts, { cadNetlist, links: raw.links }));
  }
  onProgress?.("완료", 1);
  return { pages, cadNetlist };
}

export async function loadSchematic(
  file: File,
  onProgress?: (msg: string, ratio: number) => void,
): Promise<Schematic> {
  const buf = new Uint8Array(await file.arrayBuffer());
  // pdf.js may take the buffer over (transfer to its worker): the script reader keeps its own copy
  const annotProps = annotationPropsReader(buf.slice());
  const pdf = await getDocumentProxy(buf);
  const pdfjs = await getResolvedPDFJS();
  const OPS = pdfjs.OPS as Record<string, number>;
  const { pages, cadNetlist } = await analyzeDocument(pdf as unknown as PdfDocLike, OPS, onProgress, annotProps);
  return { fileName: file.name, pages, pdf, cadNetlist };
}
