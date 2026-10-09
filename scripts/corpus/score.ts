// 코퍼스 채점: 모든 회로도를 분석해 정답과 비교하고 점수표를 출력합니다.
// 사용법: npm run corpus:score [-- <id 일부> ...] [--svg] [--no-hints] [--mono]
//   --svg       corpus/out/<id>-p<n>.svg 로 분석 결과 겹쳐 그리기 (틀린 곳 눈으로 확인)
//   --no-hints  Altium 책갈피 같은 CAD 힌트를 쓰지 않고 순수 도면 해석만 채점
//   --mono      모든 선을 검은색으로 바꿔 흑백 인쇄본처럼 채점 (색 구분이 없는 도면 대비)
// 결과는 corpus/out/report.json 에도 저장되어, 규칙을 고치기 전후를 비교할 수 있습니다.
import fs from "node:fs";
import path from "node:path";
import { getDocumentProxy, getResolvedPDFJS } from "unpdf";
import { analyzePage, type SchPage } from "../../src/lib/schematic/analyze.ts";
import { readAltiumNetlist, type CadNetlist } from "../../src/lib/schematic/cad-hints.ts";
import { extractPage, type PdfDocLike } from "../../src/lib/schematic/extract.ts";
import { fitTransform, type Seg } from "./align.ts";
import { readGroundTruth } from "./groundtruth.ts";
import { filesOf, loadManifest, ROOT } from "./manifest.ts";
import { scoreWires, type WireScore } from "./metrics.ts";
import { pageSvg } from "./svg.ts";

const args = process.argv.slice(2);
const wantSvg = args.includes("--svg");
const noHints = args.includes("--no-hints");
// --mono: pretend the PDF was printed in black only (tests the colour-less rules on drawings with known answers)
const mono = args.includes("--mono");
const filters = args.filter((a) => !a.startsWith("--"));
const outDir = path.join(ROOT, "corpus", "out");
fs.mkdirSync(outDir, { recursive: true });

const pdfjs = (await getResolvedPDFJS()) as unknown as { OPS: Record<string, number> };

interface PinScore {
  pinPrecision: number;
  pinRecall: number;
  netExact: number;
  naming: number;
  namedNets: number;
  located: number;
  pins: number;
  gtNets: number;
}

function rawOrthSegs(paths: { op: string; data: ArrayLike<number>; ctm: number[] }[], H: number): Seg[] {
  const out: Seg[] = [];
  for (const p of paths) {
    if (p.op !== "stroke" && p.op !== "fillStroke") continue;
    const d = p.data;
    const m = p.ctm;
    let px = 0, py = 0, has = false;
    for (let i = 0; i < d.length; ) {
      const o = d[i];
      const n = o === 0 || o === 1 ? 2 : o === 2 ? 6 : o === 3 ? 4 : 0;
      if (o === 0 || o === 1) {
        const x = m[0] * d[i + 1] + m[2] * d[i + 2] + m[4];
        const y = H - (m[1] * d[i + 1] + m[3] * d[i + 2] + m[5]);
        if (o === 1 && has && (Math.abs(x - px) < 0.02 || Math.abs(y - py) < 0.02)) out.push([px, py, x, y]);
        px = x;
        py = y;
        has = true;
      } else if (n) {
        has = false;
      }
      i += 1 + n;
    }
  }
  return out;
}

/** Altium: every pin marker is looked up in the bookmark netlist and compared with the detected node. */
function scorePins(page: SchPage, net: CadNetlist): PinScore | null {
  const nets = net.pages.get(page.index);
  if (!nets?.size) return null;
  const pinNet = new Map<string, string>();
  nets.forEach((pins, name) => pins.forEach((p) => pinNet.set(p, name)));
  const pins: { gt: string; pred: number }[] = [];
  let all = 0;
  for (const p of page.pins) {
    const g = pinNet.get(p.name);
    if (!g) continue;
    all++;
    pins.push({ gt: g, pred: p.net >= 0 ? p.net : -1 - pins.length });
  }
  if (!pins.length) return null;
  const cont = new Map<string, number>();
  const rowT = new Map<number, number>();
  const colT = new Map<string, number>();
  for (const p of pins) {
    const k = `${p.pred}|${p.gt}`;
    cont.set(k, (cont.get(k) ?? 0) + 1);
    rowT.set(p.pred, (rowT.get(p.pred) ?? 0) + 1);
    colT.set(p.gt, (colT.get(p.gt) ?? 0) + 1);
  }
  const c2 = (n: number) => (n * (n - 1)) / 2;
  let tp = 0, pp = 0, ap = 0;
  cont.forEach((v) => (tp += c2(v)));
  rowT.forEach((v) => (pp += c2(v)));
  colT.forEach((v) => (ap += c2(v)));
  let exact = 0, considered = 0, named = 0, namedOk = 0;
  for (const [g, n] of colT) {
    if (n < 2) continue;
    considered++;
    const preds = pins.filter((p) => p.gt === g).map((p) => p.pred);
    const top = preds.sort((a, b) => preds.filter((x) => x === b).length - preds.filter((x) => x === a).length)[0];
    const pure = pins.filter((p) => p.pred === top).every((p) => p.gt === g);
    if (top >= 0 && preds.every((p) => p === top) && pure) exact++;
    if (!/^Net/.test(g)) {
      named++;
      if (top >= 0 && page.nets[top]?.name.toUpperCase() === g.toUpperCase()) namedOk++;
    }
  }
  return {
    pinPrecision: pp ? tp / pp : 1,
    pinRecall: ap ? tp / ap : 1,
    netExact: considered ? exact / considered : 0,
    naming: named ? namedOk / named : NaN,
    namedNets: named,
    located: pins.filter((p) => p.pred >= 0).length,
    pins: all,
    gtNets: considered,
  };
}

const pct = (v: number) => (Number.isNaN(v) ? "  -  " : `${(v * 100).toFixed(1).padStart(5)}`);
const rows: Record<string, unknown>[] = [];
console.log(
  "id".padEnd(32) +
    " 도구    | 배선정밀 배선재현 묶음정밀 묶음재현 넷정확 이름정확 | 부품재현 부품정밀 값정확 | 가짜이름",
);
for (const e of loadManifest()) {
  if (filters.length && !filters.some((f) => e.id.includes(f))) continue;
  const f = filesOf(e);
  if (!fs.existsSync(f.pdf)) {
    console.log(`${e.id.padEnd(32)} (파일 없음: npm run corpus:fetch)`);
    continue;
  }
  const pdf = (await getDocumentProxy(new Uint8Array(fs.readFileSync(f.pdf)))) as unknown as PdfDocLike;
  const cad = noHints ? null : await readAltiumNetlist(pdf).catch(() => null);
  const gtNetlist = await readAltiumNetlist(pdf).catch(() => null);
  const gt = f.source && fs.existsSync(f.source) ? readGroundTruth(f.source, fs.readFileSync(f.source, "utf8")) : null;
  for (let p = 1; p <= pdf.numPages; p++) {
    const raw = await extractPage(await pdf.getPage(p), pdfjs.OPS);
    if (mono) for (const rp of raw.paths) {
      rp.stroke = "#000000";
      rp.fill = rp.fill && /^#(?:f|e)/i.test(rp.fill) ? rp.fill : "#000000";
    }
    const page = analyzePage(p - 1, raw.width, raw.height, raw.paths, raw.texts, { cadNetlist: cad, links: raw.links });
    let ws: WireScore | null = null;
    let ps: PinScore | null = null;
    if (gt && p === (e.sheet ?? 0) + 1) {
      const tf = fitTransform(
        gt.wires.map((w) => [w.x1, w.y1, w.x2, w.y2] as Seg),
        rawOrthSegs(raw.paths, raw.height),
        gt.unitToPt,
        gt.yDown,
      );
      if (tf && tf.inliers / tf.total > 0.3) ws = scoreWires(page, gt, tf);
      else console.log(`  ! ${e.id}: 좌표 맞춤 실패 (${tf ? ((tf.inliers / tf.total) * 100).toFixed(0) : 0}%)`);
    }
    if (gtNetlist) ps = scorePins(page, gtNetlist);
    const label = `${e.id}${pdf.numPages > 1 ? ` p${p}` : ""}`;
    const kinds: Record<string, number> = {};
    page.texts.forEach((t) => (kinds[t.kind] = (kinds[t.kind] ?? 0) + 1));
    const base = { id: e.id, page: p, tool: e.tool, wires: page.segs.length / 4, nets: page.nets.length, comps: page.components.length, kinds };
    if (ws) {
      console.log(
        `${label.padEnd(32)} ${e.tool.padEnd(7)} | ${pct(ws.wirePrecision)}    ${pct(ws.wireRecall)}    ${pct(ws.groupPrecision)}    ${pct(ws.groupRecall)}  ${pct(ws.netExact)}  ${pct(ws.naming)}  | ${pct(ws.refRecall)}   ${pct(ws.refPrecision)}  ${pct(ws.valueExact)} | ${String(ws.phantomNames.length).padStart(3)}`,
      );
      if (ws.phantomNames.length) console.log(`    노드가 아닌 이름: ${ws.phantomNames.slice(0, 10).join(", ")}`);
      if (ws.wrongValues.length) console.log(`    값 틀림(${ws.wrongValues.length}): ${ws.wrongValues.slice(0, 6).join(", ")}`);
      if (ws.wrongNames.length) console.log(`    이름 틀림: ${ws.wrongNames.slice(0, 8).join(", ")}`);
      if (ws.missedRefs.length) console.log(`    놓친 부품: ${ws.missedRefs.slice(0, 10).join(", ")}`);
      if (ws.extraRefs.length) console.log(`    잘못 잡은 부품: ${ws.extraRefs.slice(0, 10).join(", ")}`);
      rows.push({ ...base, ...ws });
    } else if (ps) {
      console.log(
        `${label.padEnd(32)} ${e.tool.padEnd(7)} | 핀 기준: 핀위치 ${ps.located}/${ps.pins}  묶음정밀 ${pct(ps.pinPrecision)} 묶음재현 ${pct(ps.pinRecall)} 넷정확 ${pct(ps.netExact)} 이름정확 ${pct(ps.naming)}`,
      );
      rows.push({ ...base, ...ps });
    } else {
      console.log(`${label.padEnd(32)} ${e.tool.padEnd(7)} | (정답 없음) 배선 ${base.wires} 노드 ${base.nets} 부품 ${base.comps}`);
      rows.push(base);
    }
    if (wantSvg) fs.writeFileSync(path.join(outDir, `${e.id}-p${p}.svg`), pageSvg(page));
  }
}

// averages over pages that have wire ground truth
const scored = rows.filter((r) => typeof r.wirePrecision === "number") as unknown as WireScore[];
const avg = (k: keyof WireScore) => {
  const v = scored.map((r) => r[k] as number).filter((x) => !Number.isNaN(x));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : NaN;
};
if (scored.length)
  console.log(
    `${"평균".padEnd(32)}         | ${pct(avg("wirePrecision"))}    ${pct(avg("wireRecall"))}    ${pct(avg("groupPrecision"))}    ${pct(avg("groupRecall"))}  ${pct(avg("netExact"))}  ${pct(avg("naming"))}  | ${pct(avg("refRecall"))}   ${pct(avg("refPrecision"))}  ${pct(avg("valueExact"))} | ${String(scored.reduce((a, r) => a + r.phantomNames.length, 0)).padStart(3)}`,
  );
fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify(rows, null, 1));
