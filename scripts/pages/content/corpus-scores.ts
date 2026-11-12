// Per-sample corpus scores shown on the about page (ko/en/ja share this file).
// Source: `npm run corpus:score` (colour) and `npm run corpus:score -- --mono` on the 11 scored entries of
// corpus/manifest.json. The same output ran in GitHub Actions run 41645816206 ("코퍼스 채점", PR #31 head c700f82,
// tree 9dbc537 = main 84d3a4c) and again locally on 2026-11-12 with identical summary tables
// (normalized SHA-256 prefixes: colour 173aca44a56263c9, mono 9b1368d293099bef).
// Re-take every number here when the analysis engine changes; do not edit them by hand.

export const SCORE_RUN = {
  date: "2026-11-03",
  ci: "https://github.com/jhwankim-sys/schematic-explorer/actions/runs/41645816206",
  manifest: "https://github.com/jhwankim-sys/schematic-explorer/blob/main/corpus/manifest.json",
};

/** [board, CAD source, repo, commit, colour: net / name / parts / value, mono: net / name / parts / value]; null = not scored */
type Row = [string, string, string, string, [number, number, number, number | null], [number, number, number, number | null]];
export const SCORES: Row[] = [
  ["Olimex ESP32-GATEWAY rev. I", "KiCad 5", "OLIMEX/ESP32-GATEWAY", "d45c9bc81205", [97.5, 95.2, 99.0, 95.0], [87.5, 88.1, 94.1, 85.3]],
  ["Olimex ESP32-DevKit-LiPo rev. D", "KiCad 5", "OLIMEX/ESP32-DevKit-LiPo", "1ebbbb5ceaa8", [100.0, 100.0, 96.0, 91.7], [98.3, 92.3, 88.0, 65.9]],
  ["Olimex RP2040-PICO30 rev. A", "KiCad 5", "OLIMEX/RP2040-PICO30", "a6937dcaca37", [100.0, 100.0, 96.6, 100.0], [88.5, 86.5, 93.1, 77.8]],
  ["Olimex ESP32-EVB rev. K2", "KiCad 5", "OLIMEX/ESP32-EVB", "a3ec2f448109", [99.2, 98.1, 98.0, 94.7], [90.0, 88.9, 91.5, 84.4]],
  ["Olimex ESP32-C3-DevKit-Lipo rev. B", "KiCad 5", "OLIMEX/ESP32-C3-DevKit-Lipo", "5d93e79d46cf", [100.0, 100.0, 96.2, 96.0], [94.3, 91.3, 90.4, 57.4]],
  ["Olimex ESP32-PoE rev. I", "KiCad 5", "OLIMEX/ESP32-POE", "deb38a377d50", [100.0, 100.0, 100.0, 100.0], [89.6, 82.5, 93.7, 79.3]],
  ["Olimex ESP32-PoE rev. M", "KiCad 5", "OLIMEX/ESP32-POE", "deb38a377d50", [84.5, 100.0, 100.0, 97.6], [77.3, 82.5, 94.4, 79.3]],
  ["Olimex ESP32-EVB rev. L", "KiCad 7", "OLIMEX/ESP32-EVB", "a3ec2f448109", [95.9, 98.3, 98.1, 89.5], [83.5, 87.9, 92.9, 81.5]],
  ["Olimex ESP32-C3-DevKit-Lipo rev. D", "KiCad 7", "OLIMEX/ESP32-C3-DevKit-Lipo", "5d93e79d46cf", [100.0, 100.0, 98.0, 92.0], [91.2, 91.3, 92.2, 53.2]],
  ["Olimex ESP32-PoE rev. M2", "KiCad 7", "OLIMEX/ESP32-POE", "deb38a377d50", [97.9, 100.0, 99.2, 97.8], [89.6, 83.3, 93.9, 79.4]],
  ["Adafruit Metro THM+LDO rev. C", "Eagle", "adafruit/Adafruit-Metro-328-PCB", "1d635d70533c", [98.1, 84.1, 83.3, null], [75.5, 84.1, 83.3, null]],
];
/** the averages printed by the scorer: plain mean over the sheets, skipping a sheet with no value to compare */
export const AVERAGE: { colour: number[]; mono: number[] } = { colour: [97.6, 97.8, 96.8, 95.4], mono: [87.7, 87.2, 91.6, 74.4] };

const HEAD = {
  ko: ["회로도", "원본", "넷 정확", "이름 정확", "부품 찾음", "값 정확", "평균"],
  en: ["Schematic", "Source", "Nets exact", "Names right", "Parts found", "Values right", "Average"],
  ja: ["回路図", "元データ", "ネット正確", "名前正確", "部品発見", "値正確", "平均"],
};

/** one table (colour or mono) with a source link per row */
export function scoreTable(lang: "ko" | "en" | "ja", which: "colour" | "mono"): string {
  const h = HEAD[lang];
  const f = (v: number | null) => (v === null ? "–" : v.toFixed(1));
  const rows = SCORES.map(([name, src, repo, commit, c, m]) => {
    const v = which === "colour" ? c : m;
    return `<tr><td><a href="https://github.com/${repo}/tree/${commit}">${name}</a></td><td>${src}</td>${v.map((x) => `<td>${f(x)}</td>`).join("")}</tr>`;
  }).join("\n");
  const avg = AVERAGE[which].map((x) => `<td><strong>${x.toFixed(1)}</strong></td>`).join("");
  return `<table>
<thead><tr>${h.slice(0, 6).map((x) => `<th>${x}</th>`).join("")}</tr></thead>
<tbody>
${rows}
<tr><td><strong>${h[6]}</strong></td><td></td>${avg}</tr>
</tbody>
</table>`;
}
