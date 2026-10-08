// 선 스타일(색·굵기)별로 실제 배선과 얼마나 겹치는지 통계를 냅니다 — 규칙을 정할 때 근거 자료.
// 사용법: npm run corpus:styles [-- <id 일부>]
import fs from "node:fs";
import { getDocumentProxy, getResolvedPDFJS } from "unpdf";
import { extractPage, type PdfDocLike } from "../../src/lib/schematic/extract.ts";
import { apply, fitTransform, type Seg } from "./align.ts";
import { readGroundTruth } from "./groundtruth.ts";
import { filesOf, loadManifest } from "./manifest.ts";

const filters = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const pdfjs = (await getResolvedPDFJS()) as unknown as { OPS: Record<string, number> };

for (const e of loadManifest()) {
  if (filters.length && !filters.some((f) => e.id.includes(f))) continue;
  const f = filesOf(e);
  if (!f.source || !fs.existsSync(f.pdf) || !fs.existsSync(f.source)) continue;
  const gt = readGroundTruth(f.source, fs.readFileSync(f.source, "utf8"));
  const pdf = (await getDocumentProxy(new Uint8Array(fs.readFileSync(f.pdf)))) as unknown as PdfDocLike;
  const raw = await extractPage(await pdf.getPage((e.sheet ?? 0) + 1), pdfjs.OPS);
  const H = raw.height;
  type S = { seg: Seg; style: string; op: string; closed: boolean };
  const segs: S[] = [];
  for (const p of raw.paths) {
    if (p.op === "none") continue;
    const d = p.data, m = p.ctm;
    let px = 0, py = 0, sx = 0, sy = 0, has = false;
    const local: Seg[] = [];
    let closed = false;
    const flush = () => {
      for (const s of local) segs.push({ seg: s, style: `${p.op === "fill" ? "F" : "S"} ${p.op === "fill" ? p.fill : p.stroke} ${(p.lineWidth ?? 0).toFixed(2)}`, op: p.op, closed });
      local.length = 0;
      closed = false;
    };
    for (let i = 0; i < d.length; ) {
      const o = d[i];
      if (o === 0 || o === 1) {
        const x = m[0] * d[i + 1] + m[2] * d[i + 2] + m[4];
        const y = H - (m[1] * d[i + 1] + m[3] * d[i + 2] + m[5]);
        if (o === 0) (flush(), (sx = x), (sy = y));
        if (o === 1 && has && (Math.abs(x - px) < 0.02 || Math.abs(y - py) < 0.02)) local.push([px, py, x, y]);
        px = x; py = y; has = true; i += 3;
      } else if (o === 4) { closed = true; if (Math.abs(sx - px) < 0.02 || Math.abs(sy - py) < 0.02) local.push([px, py, sx, sy]); i += 1; }
      else { has = o !== 2 && o !== 3 ? has : true; if (o === 2) { px = m[0] * d[i + 5] + m[2] * d[i + 6] + m[4]; py = H - (m[1] * d[i + 5] + m[3] * d[i + 6] + m[5]); i += 7; } else if (o === 3) { px = m[0] * d[i + 3] + m[2] * d[i + 4] + m[4]; py = H - (m[1] * d[i + 3] + m[3] * d[i + 4] + m[5]); i += 5; } else i += 1; }
    }
    flush();
  }
  const tf = fitTransform(gt.wires.map((w) => [w.x1, w.y1, w.x2, w.y2] as Seg), segs.filter((s) => s.op !== "fill").map((s) => s.seg), gt.unitToPt, gt.yDown);
  if (!tf) continue;
  const gw = gt.wires.map((w) => [...apply(tf, w.x1, w.y1), ...apply(tf, w.x2, w.y2)]);
  const onWire = (s: Seg) => gw.some((w) => {
    const dx = w[2] - w[0], dy = w[3] - w[1], l = Math.hypot(dx, dy) || 1;
    const dist = (x: number, y: number) => Math.abs((x - w[0]) * dy - (y - w[1]) * dx) / l;
    const t = (x: number, y: number) => ((x - w[0]) * dx + (y - w[1]) * dy) / (l * l);
    return dist(s[0], s[1]) < 0.8 && dist(s[2], s[3]) < 0.8 && t((s[0] + s[2]) / 2, (s[1] + s[3]) / 2) > -0.05 && t((s[0] + s[2]) / 2, (s[1] + s[3]) / 2) < 1.05;
  });
  const st = new Map<string, { n: number; len: number; wire: number; closed: number }>();
  for (const s of segs) {
    const r = st.get(s.style) ?? st.set(s.style, { n: 0, len: 0, wire: 0, closed: 0 }).get(s.style)!;
    const len = Math.hypot(s.seg[2] - s.seg[0], s.seg[3] - s.seg[1]);
    r.n++; r.len += len; if (s.closed) r.closed++;
    if (onWire(s.seg)) r.wire += len;
  }
  console.log(`\n== ${e.id} (${e.tool})`);
  [...st.entries()].sort((a, b) => b[1].len - a[1].len).slice(0, 10).forEach(([k, v]) =>
    console.log(`  ${k.padEnd(22)} 선분 ${String(v.n).padStart(6)}  평균길이 ${(v.len / v.n).toFixed(2).padStart(6)}  닫힌도형 ${((v.closed / v.n) * 100).toFixed(0).padStart(3)}%  배선일치 ${((v.wire / v.len) * 100).toFixed(1).padStart(5)}%`));
}
