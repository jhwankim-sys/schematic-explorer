// 회로도 분석 결과를 브라우저 없이 확인하는 유지보수용 도구
// 사용법: npm run analyze -- <회로도.pdf> [찾을 노드 이름] [--svg]
//   예) npm run analyze -- ./samples/sample.pdf +5V --svg
// 결과 요약을 출력하고, 같은 폴더에 <파일명>.analysis.json 을 저장합니다.
// --svg 를 붙이면 <파일명>-p<쪽>.svg 로 분석 결과를 도면 위에 겹쳐 그립니다
// (노드별 색, 글자 상자: 파랑=노드 이름, 보라=부품, 초록=값, 회색=핀번호, 주황=메모).
import fs from "node:fs";
import path from "node:path";
import { loadSchematic } from "../src/lib/schematic/extract.ts";
import { buildCompEntries, buildNetEntries } from "../src/lib/schematic/model.ts";
import { pageSvg } from "./corpus/svg.ts";

const args = process.argv.slice(2);
const wantSvg = args.includes("--svg");
const [file, focus] = args.filter((a) => !a.startsWith("--"));
if (!file) {
  console.error("사용법: npm run analyze -- <회로도.pdf> [노드 이름] [--svg]");
  process.exit(1);
}

const buf = fs.readFileSync(file);
const t0 = Date.now();
const doc = await loadSchematic(new File([buf], path.basename(file), { type: "application/pdf" }));
const ms = Date.now() - t0;

const nets = buildNetEntries(doc.pages);
const comps = buildCompEntries(doc.pages);
console.log(`파일: ${doc.fileName}  페이지: ${doc.pages.length}  분석 시간: ${ms}ms${doc.cadNetlist ? "  (Altium 책갈피 넷리스트 사용)" : ""}`);
for (const p of doc.pages) {
  const kinds: Record<string, number> = {};
  p.texts.forEach((t) => (kinds[t.kind] = (kinds[t.kind] ?? 0) + 1));
  const unattached = p.texts.filter((t) => t.kind === "net" && !t.inBody && t.net < 0).map((t) => t.str);
  console.log(
    `\n[페이지 ${p.index + 1}] 배선 ${p.segs.length / 4}개, 노드 ${p.nets.length}개(이름 있음 ${p.nets.filter((n) => n.name).length}), 접점 ${p.dots.length}개, 글자 크기 ${p.textSize.toFixed(1)}pt, 배선 구분 ${p.wireStyle === "monochrome" ? "흑백(모양으로 판단)" : `색 ${p.wireStyle}`}`,
  );
  console.log(`  문자 종류 ${JSON.stringify(kinds)}${p.vectorText ? ", 글자를 선으로 그린 도면" : ""}`);
  console.log(`  연결되지 않은 라벨 ${unattached.length}개: ${unattached.slice(0, 40).join(", ")}`);
  const biggest = [...p.nets].sort((a, b) => b.segs.length - a.segs.length).slice(0, 8);
  console.log("  큰 노드 상위 8개 (잘못 합쳐졌는지 확인):");
  for (const n of biggest) {
    const labels = [...new Set(n.labels.map((i) => p.texts[i].str))].slice(0, 10).join(" | ");
    console.log(`   - ${n.name || "(이름 없음)"}  배선 ${n.segs.length}  라벨: ${labels}`);
  }
  if (wantSvg) {
    const out = file.replace(/\.pdf$/i, "") + `-p${p.index + 1}.svg`;
    fs.writeFileSync(out, pageSvg(p));
    console.log(`  겹쳐 그리기: ${out}`);
  }
}
console.log(`\n노드 이름 ${nets.length}개, 부품 ${comps.length}개`);

if (focus) {
  const e = nets.find((n) => n.name.toUpperCase() === focus.toUpperCase());
  if (!e) console.log(`\n'${focus}' 이름의 노드를 찾지 못했습니다.`);
  else
    for (const w of e.where) {
      const p = doc.pages[w.page];
      for (const id of w.netIds) {
        const n = p.nets[id];
        console.log(`\n'${focus}' (페이지 ${w.page + 1}, 노드 #${id}) 배선 ${n.segs.length}개`);
        console.log("  라벨:", n.labels.map((i) => `${p.texts[i].str}@(${p.texts[i].x0.toFixed(0)},${p.texts[i].y0.toFixed(0)})`).join(" "));
      }
    }
}

const out = file.replace(/\.pdf$/i, "") + ".analysis.json";
fs.writeFileSync(
  out,
  JSON.stringify(
    {
      file: doc.fileName,
      nets: nets.map((n) => ({ name: n.name, power: n.power, labelCount: n.labelCount, pages: n.where.map((w) => w.page + 1) })),
      components: comps.map((c) => ({ ref: c.ref, values: c.values, pages: c.where.map((w) => w.page + 1) })),
    },
    null,
    2,
  ),
);
console.log(`\n결과 저장: ${out}`);
