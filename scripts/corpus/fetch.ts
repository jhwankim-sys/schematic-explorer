// 코퍼스(정답 비교용 회로도 모음) 내려받기
// 사용법: npm run corpus:fetch
// corpus/manifest.json 에 적힌 공개 저장소에서 PDF와 CAD 원본만 골라 받아
// corpus/files/ 에 저장합니다 (git 필요, 저장소에는 올라가지 않음).
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { loadManifest, ROOT } from "./manifest.ts";

const cache = path.join(ROOT, "corpus", "cache");
const out = path.join(ROOT, "corpus", "files");
fs.mkdirSync(cache, { recursive: true });
fs.mkdirSync(out, { recursive: true });

const git = (args: string[], cwd?: string) => execFileSync("git", args, { cwd, stdio: ["ignore", "pipe", "pipe"] }).toString();

for (const e of loadManifest()) {
  if (!e.repo) continue;
  const want = [e.pdf, e.source].filter((p): p is string => !!p);
  const targets = want.map((p) => path.join(out, `${e.id}${path.extname(p)}`));
  if (targets.every((t) => fs.existsSync(t))) {
    console.log(`✓ ${e.id} (이미 있음)`);
    continue;
  }
  const dir = path.join(cache, e.repo.replace("/", "__"));
  try {
    if (!fs.existsSync(dir))
      git(["clone", "--quiet", "--depth", "1", "--filter=blob:none", "--no-checkout", `https://github.com/${e.repo}.git`, dir]);
    if (e.commit) {
      git(["fetch", "--quiet", "--depth", "1", "origin", e.commit], dir);
      git(["checkout", "--quiet", e.commit, "--", ...want], dir);
    } else git(["checkout", "--quiet", "HEAD", "--", ...want], dir);
    want.forEach((p, i) => fs.copyFileSync(path.join(dir, p), targets[i]));
    console.log(`↓ ${e.id}`);
  } catch (err) {
    console.log(`✗ ${e.id}: ${(err as Error).message.split("\n")[0]}`);
  }
}
