// Debug overlay: original drawing in grey, detected wires coloured per node,
// text boxes coloured per kind. Open the .svg in a browser and zoom in.
import type { SchPage } from "../../src/lib/schematic/analyze.ts";

const KIND_COLOR: Record<string, string> = {
  component: "#c026d3",
  net: "#2563eb",
  pin: "#9ca3af",
  value: "#16a34a",
  note: "#f59e0b",
};

function netColor(i: number) {
  const h = (i * 137.508) % 360;
  return `hsl(${h.toFixed(0)} 85% 42%)`;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function pageSvg(page: SchPage): string {
  const bg = page.strokePath;
  const s = page.segs;
  const wires: string[] = [];
  for (let i = 0; i < s.length / 4; i++) {
    const n = page.segNet[i];
    wires.push(
      `<line x1="${s[4 * i].toFixed(2)}" y1="${s[4 * i + 1].toFixed(2)}" x2="${s[4 * i + 2].toFixed(2)}" y2="${s[4 * i + 3].toFixed(2)}" stroke="${netColor(n)}"><title>#${n} ${esc(page.nets[n]?.name ?? "")}</title></line>`,
    );
  }
  const texts = page.texts.map(
    (t) =>
      `<rect x="${t.x0.toFixed(2)}" y="${t.y0.toFixed(2)}" width="${(t.x1 - t.x0).toFixed(2)}" height="${(t.y1 - t.y0).toFixed(2)}" fill="none" stroke="${KIND_COLOR[t.kind]}" stroke-width="0.3"><title>${t.kind}: ${esc(t.str)}${t.net >= 0 ? ` → #${t.net}` : ""}${t.inBody ? " (몸체 안)" : ""}</title></rect>`,
  );
  const dots = page.dots.map((d) => `<circle cx="${d.x.toFixed(2)}" cy="${d.y.toFixed(2)}" r="${(d.r * 1.4).toFixed(2)}" fill="none" stroke="#000" stroke-width="0.3"/>`);
  const pins = page.pins.map(
    (p) => `<rect x="${p.box[0].toFixed(2)}" y="${p.box[1].toFixed(2)}" width="${(p.box[2] - p.box[0]).toFixed(2)}" height="${(p.box[3] - p.box[1]).toFixed(2)}" fill="none" stroke="#f97316" stroke-width="0.25"><title>핀 ${esc(p.name)} → #${p.net}</title></rect>`,
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${page.width} ${page.height}" width="${page.width * 3}" height="${page.height * 3}">
<rect width="100%" height="100%" fill="#fff"/>
<path d="${bg}" fill="none" stroke="#d4d4d4" stroke-width="0.25"/>
<g stroke-width="0.9" stroke-linecap="round">${wires.join("")}</g>
<g>${texts.join("")}</g>
<g>${dots.join("")}</g>
<g>${pins.join("")}</g>
</svg>`;
}
