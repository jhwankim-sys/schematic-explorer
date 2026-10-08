import { getDocumentProxy, getResolvedPDFJS } from "unpdf";
import { analyzePage, type PaintOp, type RawPath, type RawText, type SchPage } from "./analyze.ts";

export interface Schematic {
  fileName: string;
  pages: SchPage[];
}

type Mat = [number, number, number, number, number, number];

function compose(m: Mat, n: number[]): Mat {
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ];
}

export async function loadSchematic(
  file: File,
  onProgress?: (msg: string, ratio: number) => void,
): Promise<Schematic> {
  const buf = new Uint8Array(await file.arrayBuffer());
  const pdf = await getDocumentProxy(buf);
  const pdfjs = await getResolvedPDFJS();
  const OPS = pdfjs.OPS as Record<string, number>;
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

  const pages: SchPage[] = [];
  const total = pdf.numPages;
  for (let p = 1; p <= total; p++) {
    onProgress?.(`${p}/${total} 페이지 도면 읽는 중`, (p - 1) / total);
    const page = await pdf.getPage(p);
    const vp = page.getViewport({ scale: 1 });
    const ops = await page.getOperatorList();
    // viewport handles page rotation / crop offsets: fold it into the CTM
    const base = vp.transform as number[];
    // analyzePage flips y using the page height, so pre-flip the viewport transform back
    const pre: Mat = compose([1, 0, 0, -1, 0, vp.height], base);
    let ctm: Mat = pre;
    const stack: Mat[] = [];
    const paths: RawPath[] = [];
    for (let i = 0; i < ops.fnArray.length; i++) {
      const fn = ops.fnArray[i];
      const args = ops.argsArray[i] as unknown[];
      if (fn === OPS.save) stack.push(ctm);
      else if (fn === OPS.restore) ctm = stack.pop() ?? pre;
      else if (fn === OPS.transform) ctm = compose(ctm, args as number[]);
      else if (fn === OPS.constructPath) {
        const paintOp = args[0] as number;
        const dataArr = args[1] as ArrayLike<number>[] | null;
        const data = dataArr?.[0];
        if (!data) continue;
        paths.push({ op: paintName.get(paintOp) ?? "stroke", data, ctm });
      }
    }
    const tc = await page.getTextContent();
    const texts: RawText[] = [];
    for (const it of tc.items as Array<{ str?: string; transform?: number[]; width?: number; height?: number }>) {
      if (!it.str || !it.transform) continue;
      // text transform is in PDF space; map it through the viewport (pre-flipped)
      const t = compose(pre, it.transform);
      texts.push({ str: it.str, transform: t, width: it.width ?? 0, height: it.height ?? 0 });
    }
    onProgress?.(`${p}/${total} 페이지 연결 분석 중`, (p - 0.5) / total);
    await new Promise((r) => setTimeout(r, 0));
    pages.push(analyzePage(p - 1, vp.width, vp.height, paths, texts));
  }
  onProgress?.("완료", 1);
  return { fileName: file.name, pages };
}
