import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export interface CorpusEntry {
  id: string;
  /** CAD tool that drew the PDF */
  tool: string;
  /** GitHub "owner/name" the files come from */
  repo?: string;
  commit?: string;
  /** path of the PDF inside the repo, or a local path under samples/ */
  pdf: string;
  /** CAD source next to the PDF (ground truth), if any */
  source?: string;
  /** PDF lives in samples/ (not downloaded) */
  local?: boolean;
  /** source sheet that matches the PDF page (Eagle multi-sheet) */
  sheet?: number;
  note?: string;
}

export function loadManifest(): CorpusEntry[] {
  return JSON.parse(fs.readFileSync(path.join(ROOT, "corpus", "manifest.json"), "utf8")).entries;
}

export function filesOf(e: CorpusEntry): { pdf: string; source?: string } {
  const dir = path.join(ROOT, "corpus", "files");
  const pdf = e.local ? path.join(ROOT, e.pdf) : path.join(dir, `${e.id}${path.extname(e.pdf)}`);
  const source = e.source ? path.join(dir, `${e.id}${path.extname(e.source)}`) : undefined;
  return { pdf, source };
}
