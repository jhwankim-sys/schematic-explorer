import "./lib/polyfills.ts";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowRight, CircuitBoard } from "lucide-react";
import "./index.css";
import { App } from "./App.tsx";
import { CircuitArtwork } from "./components/circuit-artwork.tsx";
import { LanguageContext, usePageHref, useT, type Language } from "./i18n.tsx";
import { initAnalytics } from "./lib/analytics.ts";

function Website() {
  const [language, setLanguage] = useState<Language>(() => {
    // the static pages link here with ?lang=en / ?lang=ko so the tool opens in the reader's language
    const asked = new URLSearchParams(window.location.search).get("lang");
    if (asked === "ko" || asked === "en") return asked;
    try { const saved = localStorage.getItem("schematic-viewer-language"); if (saved === "ko" || saved === "en") return saved; } catch { /* Storage can be disabled. */ }
    return navigator.language.toLowerCase().startsWith("ko") ? "ko" : "en";
  });
  useEffect(() => {
    document.documentElement.lang = language;
    try { localStorage.setItem("schematic-viewer-language", language); } catch { /* Works without storage. */ }
  }, [language]);
  useEffect(() => initAnalytics(), []);
  return <LanguageContext value={language}><WebsiteContent language={language} onLanguage={setLanguage} /></LanguageContext>;
}

function WebsiteContent({ language, onLanguage }: { language: Language; onLanguage: (language: Language) => void }) {
  const t = useT();
  const href = usePageHref();
  const [route, setRoute] = useState(window.location.hash);
  useEffect(() => {
    // the privacy notice used to be a section of this page (#privacy); it is a page of its own now
    if (route === "#privacy") window.location.replace(href("/privacy/"));
  }, [route, href]);
  const viewer = route === "#viewer" || route === "#drawing" || route === "#example";
  useEffect(() => {
    const update = () => { setRoute(window.location.hash); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  useEffect(() => {
    document.title = viewer ? "Schematic Viewer" : "Schematic Viewer | " + t("회로도 PDF 연결 탐색", "Trace connections in your schematic PDF");
    if (!viewer && route) requestAnimationFrame(() => document.getElementById(route.slice(1))?.scrollIntoView());
  }, [route, viewer, t]);
  const features = [
    [t("연결 따라가기", "Follow a net"), t("배선 한 곳을 클릭하면 같은 노드의 배선과 라벨이 청록색으로 강조되고, 나머지 도면은 흐려집니다.", "Click one wire and every wire and label on the same net turns cyan while the rest of the sheet fades.")],
    [t("이름으로 찾기", "Search by name"), t("GND, +5V, R1 같은 이름을 검색하면 도면 위 모든 위치가 표시되고, 차례로 이동할 수 있습니다.", "Search for GND, +5V or R1 and every match on the sheet is marked. Step through them one by one.")],
    [t("목록으로 저장", "Export lists"), t("노드와 부품 목록을 CSV로 저장해 BOM과 맞춰 볼 수 있습니다.", "Save the net and part lists as CSV to check against your BOM.")],
  ] as const;
  const steps = [
    [t("PDF 열기", "Open a PDF"), t("‘PDF 열기’를 누르거나 파일을 화면에 끌어다 놓습니다. CAD에서 내보낸 벡터 PDF가 가장 잘 열립니다.", "Choose Open a PDF or drop a file onto the page. Vector PDFs exported from CAD work best.")],
    [t("배선 클릭하기", "Click a wire"), t("분석이 끝나면 배선을 클릭합니다. 같은 노드가 청록색으로 표시되고 나머지 도면은 흐려집니다. 왼쪽 목록에서 노드나 부품을 골라도 됩니다.", "Once the analysis finishes, click a wire. Its net turns cyan and the rest fades. You can also pick a net or part from the list on the left.")],
    [t("검색하고 둘러보기", "Search and look around"), t("검색창에 신호나 부품 이름을 입력하면 도면 위 위치가 표시됩니다. 휠이나 두 손가락으로 확대·축소하고, 드래그로 이동합니다.", "Type a signal or part name to mark it on the sheet. Zoom with the wheel or two fingers and drag to pan.")],
  ] as const;
  const articles = [
    ["/guide/", t("사용법 가이드", "User guide"), t("파일 열기부터 노드 강조, 라벨 이동, CSV 내보내기까지 화면별 사용법.", "Every screen explained, from opening a file to highlighting nets, stepping through labels and exporting CSV.")],
    ["/learn/example/", t("예제로 따라 하기", "Step-by-step example"), t("공개 회로도 한 장으로 전원 노드와 신호를 따라가 보는 실습.", "Follow a power net and a signal on a public schematic, one step at a time.")],
    ["/learn/find-parts/", t("회로도 PDF에서 부품 찾기", "Finding parts in a schematic PDF"), t("참조 번호(R1, U3)와 값으로 부품을 찾고 목록으로 정리하는 방법.", "Locate parts by reference (R1, U3) and value, and turn them into a list.")],
    ["/learn/read-schematic/", t("회로도·데이터시트 읽는 법 기초", "Reading schematics and datasheets"), t("넷 라벨, 전원 기호, 핀 번호, 데이터시트 핀 배치표를 읽는 기본기.", "Net labels, power symbols, pin numbers and datasheet pin tables — the basics.")],
    ["/help/formats/", t("지원 형식과 오류 해결", "Supported files and troubleshooting"), t("어떤 PDF가 잘 열리는지, 열리지 않을 때 무엇을 확인할지.", "Which PDFs work best and what to check when one won't open.")],
    ["/faq/", t("자주 묻는 질문", "FAQ"), t("파일 보안, 정확도, 모바일 사용, 비용에 대한 질문과 답.", "Questions about file privacy, accuracy, mobile use and cost.")],
  ] as const;
  const languageSwitch = <div className="language-switch" role="group" aria-label={t("언어 선택", "Language")}><button type="button" aria-pressed={language === "ko"} onClick={() => onLanguage("ko")}>한국어</button><button type="button" aria-pressed={language === "en"} onClick={() => onLanguage("en")}>EN</button></div>;
  // the workspace has a single header row: the brand and language switch move into the viewer toolbar
  const workspaceBrand = <a className="brand" href="#home" aria-label={`Schematic Viewer · ${t("홈으로")}`}><CircuitBoard aria-hidden="true" /><span>Schematic <strong>Viewer</strong></span></a>;
  return <div className={viewer ? "site-shell workspace-shell" : "site-shell"}>
    <header className="site-header" hidden={viewer}><a className="brand" href="#home"><CircuitBoard aria-hidden="true" /><span>Schematic <strong>Viewer</strong></span></a>
      <nav aria-label={t("사이트 메뉴", "Site navigation")}><a href={href("/guide/")}>{t("사용법", "Guide")}</a><a href={href("/faq/")}>FAQ</a><a href={href("/about/")}>{t("소개", "About")}</a><a href={href("/contact/")}>{t("문의", "Contact")}</a></nav>
      <div className="header-actions">{languageSwitch}<a className="header-start" href="#viewer">{t("시작하기", "Get started")}<ArrowRight size={15} aria-hidden="true" /></a></div>
    </header>
    <div className="workspace" hidden={!viewer}><App active={viewer} autoExample={route === "#example"} headerStart={workspaceBrand} headerEnd={languageSwitch} /></div>
    {!viewer && <><main id="home">
      <section className="landing-hero" aria-labelledby="welcome"><div className="hero-layout"><div className="hero-copy">
        <h1 id="welcome">{t("배선을 클릭하면 연결된 곳이 모두 보입니다", "Click a wire, see everything it connects to")}</h1>
        <p className="hero-description">{t("KiCad, OrCAD, Altium, Eagle에서 내보낸 회로도 PDF를 열면, +5V 같은 전원이나 신호가 도면 어디까지 이어지는지 바로 표시합니다. 이름으로 부품과 신호를 찾는 검색도 됩니다.", "Open a schematic PDF exported from KiCad, OrCAD, Altium or Eagle and see how far +5V or any other net runs across the sheet. You can also search for parts and signals by name.")}</p>
        <div className="hero-actions"><a className="primary-link" href="#viewer">{t("PDF 열기", "Open a PDF")}</a><a className="text-link" href="#example">{t("예제로 먼저 보기", "Try the example first")}</a></div>
        <p className="hero-note">{t("파일은 서버로 보내지 않고 브라우저에서만 처리합니다. 스캔본이나 암호가 걸린 PDF는 열 수 없습니다.", "Files are processed in your browser and never uploaded. Scanned and password-protected PDFs can't be opened.")}</p>
      </div><CircuitArtwork /></div></section>
      <div className="content-wrap">
        <ul className="feature-list" aria-label={t("주요 기능", "Key features")}>{features.map(([title, description], i) => <li key={i}><h2>{title}</h2><p>{description}</p></li>)}</ul>
        <section id="about" className="about-section" aria-labelledby="about-title"><h2 id="about-title">{t("흩어진 같은 신호를 일일이 찾지 않아도 됩니다", "No more hunting for the same net across the sheet")}</h2><div>
          <p>{t("Schematic Viewer는 회로도를 공부하거나 검토할 때 쓰는 무료 웹 도구입니다. PDF의 선과 글자를 읽어 연결을 추정하고, 그 결과를 원본 도면 위에 겹쳐 보여 줍니다.", "Schematic Viewer is a free web tool for studying and reviewing schematics. It reads the lines and text in your PDF, infers the connections, and draws the result over your original drawing.")}</p>
          <p>{t("예를 들어 +5V 배선을 클릭해 같은 전원으로 이어진 곳을 확인하거나, R1을 검색해 부품 위치로 이동할 수 있습니다.", "For example, click a +5V wire to see everything on that supply, or search for R1 to jump to the part.")} <a className="text-link" href={href("/about/")}>{t("소개 더 보기", "More about the project")} →</a></p>
          <aside className="info-note"><h3>{t("분석의 한계", "Limits of the analysis")}</h3><p>{t("연결은 도면의 모양으로 추정하므로 틀릴 수 있습니다. 설계나 수리를 판단하기 전에는 원본 CAD 자료로 확인하세요. 스캔·이미지 PDF는 열 수 없고, 글자가 선으로만 그려진 PDF는 이름 검색이 제한됩니다.", "Connections are inferred from how the drawing looks, so they can be wrong. Check the original CAD data before making design or repair decisions. Scanned and image-only PDFs can't be opened, and PDFs with outlined text have limited name search.")}</p></aside>
        </div></section>
        <section id="guide" className="guide-section" aria-labelledby="guide-title"><div className="section-heading"><h2 id="guide-title">{t("사용 방법", "How it works")}</h2><a className="text-link" href={href("/guide/")}>{t("자세한 사용법", "Full guide")} →</a></div><ol className="steps-grid">{steps.map(([title, description], i) => <li key={i}><span>{i + 1}</span><h3>{title}</h3><p>{description}</p></li>)}</ol><p className="guide-tip">{t("파일이 열리지 않으면 암호화되었거나 손상된 PDF일 수 있습니다. 분석 결과가 이상하면 선과 글자가 들어 있는 벡터 PDF로 다시 내보내 보세요.", "If a file won't open, it may be encrypted or damaged. If the result looks wrong, export the sheet again as a vector PDF that contains lines and text.")} <a href={href("/help/formats/")}>{t("열리지 않을 때", "Troubleshooting")} →</a></p></section>
        <section className="guide-section" aria-labelledby="learn-title"><div className="section-heading"><h2 id="learn-title">{t("더 읽어 보기", "Further reading")}</h2></div>
          <ul className="article-grid">{articles.map(([path, title, description]) => <li key={path}><a href={href(path)}><h3>{title}</h3><p>{description}</p></a></li>)}</ul>
        </section>
      </div>
    </main><footer className="site-footer"><a className="brand" href="#home"><CircuitBoard size={20} /><span>Schematic <strong>Viewer</strong></span></a><span>© 2026 Schematic Viewer</span><div>
      <a href={href("/about/")}>{t("소개", "About")}</a><a href={href("/contact/")}>{t("문의", "Contact")}</a><a href={href("/privacy/")}>{t("개인정보처리방침", "Privacy policy")}</a><a href={href("/terms/")}>{t("이용약관", "Terms of use")}</a>
    </div></footer></>}
  </div>;
}

createRoot(document.getElementById("root")!).render(<StrictMode><Website /></StrictMode>);
