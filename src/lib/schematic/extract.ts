import { getDocumentProxy, getResolvedPDFJS } from "unpdf";
import { analyzePage, type PaintOp, type RawPath, type RawText, type SchPage } from "./analyze.ts";
import { readAltiumNetlist, type CadNetlist } from "./cad-hints.ts";

/** Minimal slice of the pdf.js page API that the extractor needs (keeps tests free of pdf.js types). */
export interface PdfPageLike {
  getViewport(o: { scale: number }): { width: number; height: number; transform: number[] };
  getOperatorList(): Promise<{ fnArray: ArrayLike<number>; argsArray: unknown[] }>;
  getTextContent(): Promise<{ items: unknown[] }>;
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
export async function extractPage(page: PdfPageLike, OPS: Record<string, number>) {
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
  return { width: vp.width, height: vp.height, paths, texts };
}

export async function analyzeDocument(
  pdf: PdfDocLike,
  OPS: Record<string, number>,
  onProgress?: (msg: string, ratio: number) => void,
): Promise<{ pages: SchPage[]; cadNetlist: CadNetlist | null }> {
  const pages: SchPage[] = [];
  const total = pdf.numPages;
  const cadNetlist = await readAltiumNetlist(pdf).catch(() => null);
  for (let p = 1; p <= total; p++) {
    onProgress?.(`${p}/${total} 페이지 도면 읽는 중`, (p - 1) / total);
    const page = await pdf.getPage(p);
    const raw = await extractPage(page, OPS);
    onProgress?.(`${p}/${total} 페이지 연결 분석 중`, (p - 0.5) / total);
    await new Promise((r) => setTimeout(r, 0));
    pages.push(analyzePage(p - 1, raw.width, raw.height, raw.paths, raw.texts, { cadNetlist }));
  }
  onProgress?.("완료", 1);
  return { pages, cadNetlist };
}

export async function loadSchematic(
  file: File,
  onProgress?: (msg: string, ratio: number) => void,
): Promise<Schematic> {
  const buf = new Uint8Array(await file.arrayBuffer());
  const pdf = await getDocumentProxy(buf);
  const pdfjs = await getResolvedPDFJS();
  const OPS = pdfjs.OPS as Record<string, number>;
  const { pages, cadNetlist } = await analyzeDocument(pdf as unknown as PdfDocLike, OPS, onProgress);
  return { fileName: file.name, pages, pdf, cadNetlist };
}
