// third-party-licenses.txt: the copyright and licence notices of the code that ships in dist/.
// Only local files are read (the installed packages and the PDF.js licence kept next to this file);
// nothing is downloaded. Any missing licence or version mismatch stops the build.
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

/** npm packages whose code ends up in the bundles (react-dom pulls in scheduler) */
const PACKAGES: { name: string; use: string }[] = [
  { name: "react", use: "user interface" },
  { name: "react-dom", use: "user interface (includes scheduler)" },
  { name: "scheduler", use: "user interface (bundled with react-dom)" },
  { name: "lucide-react", use: "icons" },
  { name: "unpdf", use: "PDF reading (ships a build of Mozilla PDF.js, listed separately below)" },
  { name: "tailwindcss", use: "styles (its base styles are part of the generated CSS)" },
];

/** PDF.js inside unpdf: the upstream licence of exactly this version is kept in licenses/ */
const PDFJS = {
  version: "6.1.200",
  build: "6353acefe",
  file: "pdf.js-LICENSE",
  sha256: "0d542e0c8804e39aa7f37eb00da5a762149dc682d7829451287e11b938e94594",
  source: "https://github.com/mozilla/pdf.js/blob/v6.1.200/LICENSE",
};

const sha256 = (b: Buffer | string) => createHash("sha256").update(b).digest("hex");
const rule = "=".repeat(78);

function fail(msg: string): never {
  throw new Error(`third-party-licenses: ${msg}`);
}

/** a licence file exactly as distributed, between marker lines (the text between them is the file byte for byte) */
function verbatim(label: string, bytes: Buffer): string {
  const text = bytes.toString("utf8");
  if (!text.endsWith("\n")) fail(`${label} does not end with a newline`);
  return `----- BEGIN ${label} (${bytes.length} bytes, sha256 ${sha256(bytes)}) -----\n${text}----- END ${label} -----`;
}

/** the PDF.js version and build ids written into a bundle (empty lists when it has none) */
function pdfjsMarks(code: string): { versions: string[]; builds: string[] } {
  const versions = [...code.matchAll(/apiVersion:[`"](\d+\.\d+\.\d+)[`"]/g)].map((m) => m[1]);
  const builds = [...code.matchAll(/[`"](\d+\.\d+\.\d+)[`"],[\w$]{1,4}=[`"]([0-9a-f]{7,40})[`"]/g)].map((m) => m[2]);
  return { versions, builds };
}

function checkPdfjs(code: string, where: string) {
  const { versions, builds } = pdfjsMarks(code);
  if (versions.length === 0 || builds.length === 0) fail(`no PDF.js version/build marker found in ${where}`);
  if (versions.some((v) => v !== PDFJS.version) || builds.some((b) => b !== PDFJS.build))
    fail(`${where} carries PDF.js ${[...new Set(versions)].join(",")} (${[...new Set(builds)].join(",")}), but the kept licence is for ${PDFJS.version} (${PDFJS.build}): check the upstream LICENSE of the new version and update scripts/pages/licenses/`);
}

/** text of third-party-licenses.txt; root = repository root, out = build output (checked when it has the PDF.js chunk) */
export function thirdPartyLicenses(root: string, out: string): string {
  const parts: string[] = [];
  parts.push(
    "Schematic Viewer (https://schematicviewer.com) - third-party software notices",
    "",
    "The site ships the following open-source software. Each entry gives the name, the",
    "version included in this build, what it is used for, and the full licence text with",
    "its copyright notice as distributed by the authors.",
    "",
  );
  for (const p of PACKAGES) {
    const dir = path.join(root, "node_modules", p.name);
    const pkgFile = path.join(dir, "package.json");
    const licFile = path.join(dir, "LICENSE");
    if (!fs.existsSync(pkgFile)) fail(`${p.name} is not installed`);
    const version = JSON.parse(fs.readFileSync(pkgFile, "utf8")).version;
    if (typeof version !== "string" || !/^\d+\.\d+\.\d+/.test(version)) fail(`no version for ${p.name}`);
    if (!fs.existsSync(licFile)) fail(`no LICENSE file in ${p.name}`);
    const text = fs.readFileSync(licFile);
    if (!text.toString("utf8").trim()) fail(`empty LICENSE in ${p.name}`);
    parts.push(rule, `${p.name} ${version}`, `Used for: ${p.use}`, `Source: https://www.npmjs.com/package/${p.name}/v/${version}`, rule, "", verbatim(`node_modules/${p.name}/LICENSE`, text), "");
  }

  // PDF.js: the licence is not inside unpdf, so it comes from the kept upstream file
  checkPdfjs(fs.readFileSync(path.join(root, "node_modules", "unpdf", "dist", "pdfjs.mjs"), "utf8"), "node_modules/unpdf/dist/pdfjs.mjs");
  const assets = path.join(out, "assets");
  const chunks = fs.existsSync(assets) ? fs.readdirSync(assets).filter((f) => /^pdfjs-.*\.js$/.test(f)) : [];
  for (const c of chunks) checkPdfjs(fs.readFileSync(path.join(assets, c), "utf8"), `dist/assets/${c}`);
  const licPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "licenses", PDFJS.file);
  if (!fs.existsSync(licPath)) fail(`missing ${PDFJS.file}`);
  const lic = fs.readFileSync(licPath);
  if (sha256(lic) !== PDFJS.sha256) fail(`${PDFJS.file} is not the expected upstream file (sha256 ${sha256(lic)})`);
  parts.push(
    rule,
    `PDF.js ${PDFJS.version} (build ${PDFJS.build}), Mozilla Foundation`,
    "Used for: reading and drawing PDF files (the build that unpdf bundles; this site does not change it)",
    `Source: ${PDFJS.source}`,
    rule,
    "",
    verbatim(`PDF.js v${PDFJS.version} LICENSE`, lic),
    "",
  );
  return parts.join("\n") + "\n";
}
