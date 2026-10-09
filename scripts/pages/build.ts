// 정적 콘텐츠 페이지 생성기
// 사용법: node scripts/pages/build.ts [출력 폴더=dist]   (npm run build 가 vite build 뒤에 자동 실행)
//
// - scripts/pages/content/*.ts 의 글을 한국어(/guide/)·영어(/en/guide/) HTML 페이지로 만듭니다.
// - sitemap.xml, robots.txt 를 만들고, site.config.json 의 GA4 ID·사이트 소유 확인 코드를
//   모든 페이지와 도구 화면(index.html)에 넣습니다. 값이 비어 있으면 아무것도 넣지 않습니다.
// - 페이지는 자바스크립트 없이도 읽히는 순수 HTML 입니다 (검색 엔진·광고 심사용).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pages, type Ctx, type Lang, type PageDef } from "./content/index.ts";
import { PAGES_CSS } from "./style.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT = path.resolve(ROOT, process.argv[2] ?? "dist");

interface SiteConfig {
  siteUrl: string;
  contactEmail: string;
  ga4MeasurementId: string;
  googleSiteVerification: string;
  naverSiteVerification: string;
}
const config: SiteConfig = JSON.parse(fs.readFileSync(path.join(ROOT, "site.config.json"), "utf8"));
const SITE = config.siteUrl.replace(/\/+$/, "");
const GA_ID = /^G-[A-Z0-9]+$/.test(config.ga4MeasurementId) ? config.ga4MeasurementId : "";
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(config.contactEmail) ? config.contactEmail : "";
const UPDATED = "2026-10-09";
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const pathOf = (lang: Lang, slug: string) => (lang === "en" ? `/en/${slug}/` : `/${slug}/`);

const UI = {
  ko: {
    skip: "본문으로 건너뛰기",
    nav: [["guide", "사용법"], ["faq", "FAQ"], ["about", "소개"], ["contact", "문의"]] as const,
    open: "도구 열기",
    other: "English",
    footer: [["about", "소개"], ["contact", "문의"], ["privacy", "개인정보처리방침"], ["terms", "이용약관"]] as const,
    home: "홈",
    updated: "최종 수정",
    more: "더 읽을거리",
    cta: "회로도 PDF 열기",
    ctaNote: "파일은 서버로 전송되지 않고 브라우저 안에서만 처리됩니다.",
    example: "예제로 체험하기",
  },
  en: {
    skip: "Skip to content",
    nav: [["guide", "Guide"], ["faq", "FAQ"], ["about", "About"], ["contact", "Contact"]] as const,
    open: "Open the tool",
    other: "한국어",
    footer: [["about", "About"], ["contact", "Contact"], ["privacy", "Privacy policy"], ["terms", "Terms of use"]] as const,
    home: "Home",
    updated: "Last updated",
    more: "Further reading",
    cta: "Open a schematic PDF",
    ctaNote: "Your file is never uploaded — it is processed only in your browser.",
    example: "Try the example",
  },
};

function gaSnippet(): string {
  if (!GA_ID) return "";
  return `<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag("js",new Date());gtag("config","${GA_ID}",{anonymize_ip:true});</script>`;
}

function verificationMeta(): string {
  let s = "";
  if (/^[\w-]{10,}$/.test(config.googleSiteVerification)) s += `<meta name="google-site-verification" content="${esc(config.googleSiteVerification)}">\n`;
  if (/^[\w-]{10,}$/.test(config.naverSiteVerification)) s += `<meta name="naver-site-verification" content="${esc(config.naverSiteVerification)}">\n`;
  return s;
}

function render(page: PageDef, lang: Lang): string {
  const ui = UI[lang];
  const other: Lang = lang === "ko" ? "en" : "ko";
  const ctx: Ctx = {
    lang,
    href: (slug) => pathOf(lang, slug),
    tool: (hash = "#viewer") => `/${lang === "en" ? "?lang=en" : "?lang=ko"}${hash}`,
    email: EMAIL,
    analytics: !!GA_ID,
    updated: UPDATED,
  };
  const c = page.content(ctx);
  const url = SITE + pathOf(lang, page.slug);
  const related = (page.related ?? [])
    .map((slug) => pages.find((p) => p.slug === slug))
    .filter((p): p is PageDef => !!p)
    .map((p) => {
      const rc = p.content({ ...ctx });
      return `<li><a href="${pathOf(lang, p.slug)}"><strong>${esc(rc.title)}</strong><span>${esc(rc.description)}</span></a></li>`;
    })
    .join("");
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(c.title)} | Schematic Viewer</title>
<meta name="description" content="${esc(c.description)}">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="ko" href="${SITE}${pathOf("ko", page.slug)}">
<link rel="alternate" hreflang="en" href="${SITE}${pathOf("en", page.slug)}">
<link rel="alternate" hreflang="x-default" href="${SITE}${pathOf("ko", page.slug)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Schematic Viewer">
<meta property="og:title" content="${esc(c.title)}">
<meta property="og:description" content="${esc(c.description)}">
<meta property="og:url" content="${url}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/pages.css">
${verificationMeta()}${gaSnippet()}
</head>
<body>
<a class="skip" href="#content">${ui.skip}</a>
<header class="top"><div class="wrap">
<a class="brand" href="${lang === "en" ? "/?lang=en" : "/?lang=ko"}"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M11 9h4a2 2 0 0 0 2-2V3M19 9h2M11 15h4a2 2 0 0 1 2 2v4M19 15h2M3 9h2M3 15h2M7 9a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2"/></svg><span>Schematic <b>Viewer</b></span></a>
<nav aria-label="${lang === "en" ? "Site" : "사이트 메뉴"}">${ui.nav.map(([slug, label]) => `<a href="${pathOf(lang, slug)}"${slug === page.slug ? ' aria-current="page"' : ""}>${label}</a>`).join("")}</nav>
<a class="lang" href="${pathOf(other, page.slug)}" hreflang="${other}" lang="${other}">${ui.other}</a>
<a class="open" href="${ctx.tool()}">${ui.open}</a>
</div></header>
<main id="content" class="wrap">
<nav class="crumbs" aria-label="breadcrumb"><a href="${lang === "en" ? "/?lang=en" : "/?lang=ko"}">${ui.home}</a> / <span>${esc(c.title)}</span></nav>
<article>
<h1>${esc(c.title)}</h1>
<p class="lead">${c.lead ?? esc(c.description)}</p>
<p class="meta">${ui.updated}: ${UPDATED}</p>
${c.body}
</article>
${page.cta === false ? "" : `<aside class="cta"><div><strong>${ui.cta}</strong><p>${ui.ctaNote}</p></div><div class="cta-actions"><a class="button" href="${ctx.tool()}">${ui.open}</a><a class="button ghost" href="${ctx.tool("#example")}">${ui.example}</a></div></aside>`}
${related ? `<section class="related"><h2>${ui.more}</h2><ul>${related}</ul></section>` : ""}
</main>
<footer class="bottom"><div class="wrap"><span>© 2026 Schematic Viewer</span><nav>${ui.footer.map(([slug, label]) => `<a href="${pathOf(lang, slug)}">${label}</a>`).join("")}</nav></div></footer>
</body>
</html>
`;
}

function write(rel: string, text: string) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
write("pages.css", PAGES_CSS);
const urls: { loc: string; alt?: Record<Lang, string> }[] = [{ loc: SITE + "/" }];
for (const page of pages) {
  for (const lang of ["ko", "en"] as const) write(path.join(pathOf(lang, page.slug), "index.html"), render(page, lang));
  urls.push({ loc: SITE + pathOf("ko", page.slug), alt: { ko: SITE + pathOf("ko", page.slug), en: SITE + pathOf("en", page.slug) } });
  urls.push({ loc: SITE + pathOf("en", page.slug), alt: { ko: SITE + pathOf("ko", page.slug), en: SITE + pathOf("en", page.slug) } });
}

write(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls
  .map(
    (u) => `  <url><loc>${u.loc}</loc><lastmod>${UPDATED}</lastmod>${u.alt ? (["ko", "en"] as const).map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${u.alt![l]}"/>`).join("") : ""}</url>`,
  )
  .join("\n")}
</urlset>
`,
);
write("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

// the tool page (built by vite): add verification tags and keep its description in sync
const indexFile = path.join(OUT, "index.html");
if (fs.existsSync(indexFile)) {
  let html = fs.readFileSync(indexFile, "utf8");
  const extra = verificationMeta() + `<link rel="canonical" href="${SITE}/">\n<link rel="sitemap" type="application/xml" href="/sitemap.xml">\n`;
  if (!html.includes('rel="canonical"')) html = html.replace("</head>", extra + "</head>");
  fs.writeFileSync(indexFile, html);
}
console.log(`pages: ${pages.length * 2} written to ${path.relative(ROOT, OUT) || "."} (GA4 ${GA_ID ? "on" : "off"}, contact email ${EMAIL ? "set" : "not set"})`);
