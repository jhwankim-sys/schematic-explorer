import "./lib/polyfills.ts";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowRight, CircuitBoard, LockKeyhole, FileSearch, Waypoints } from "lucide-react";
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
    document.title = viewer ? "Schematic Viewer | PDF Workspace" : "Schematic Viewer | " + t("회로도 PDF 연결 탐색", "Trace connections in your schematic PDF");
    if (!viewer && route) requestAnimationFrame(() => document.getElementById(route.slice(1))?.scrollIntoView());
  }, [route, viewer, t]);
  const features = [
    [Waypoints, t("클릭 한 번으로 연결 따라가기", "Follow a net in one click"), t("배선 한 곳을 선택하면 같은 노드로 분석된 배선과 라벨을 함께 강조합니다.", "Select a wire to highlight the connections and labels identified as part of the same net.")],
    [FileSearch, t("노드와 부품을 빠르게 검색", "Find nets and components"), t("GND, +5V, R1처럼 익숙한 이름으로 도면의 글자와 부품 위치를 찾아보세요.", "Search familiar names like GND, +5V or R1 to locate text and components in your drawing.")],
    [LockKeyhole, t("PDF는 내 기기에서만 처리", "Your PDF stays on your device"), t("회원가입도, 파일을 올리는 서버도 없이 브라우저 안에서 PDF를 분석합니다.", "Analyze PDFs in your browser, without an account or a file-upload server.")],
  ] as const;
  const steps = [
    [t("PDF 열기", "Open a PDF"), t("‘PDF 뷰어 시작하기’를 누르고 PDF를 선택하거나 화면에 끌어다 놓으세요. CAD에서 내보낸 벡터 PDF를 권장합니다.", "Get started, then choose a PDF or drop it into the workspace. Vector PDFs exported from CAD work best.")],
    [t("배선 클릭하기", "Select a wire"), t("분석이 끝나면 배선을 클릭하세요. 선택한 노드의 연결이 청록색으로 강조되고 나머지 도면은 흐려집니다. 목록에서도 노드와 부품을 선택할 수 있습니다.", "After analysis, click a wire to highlight its net in cyan while the rest of the drawing fades. You can also select nets and components from the list.")],
    [t("검색하고 살펴보기", "Search and inspect"), t("검색창에 신호나 부품 이름을 입력하세요. 휠이나 두 손가락으로 확대·축소하고 드래그로 이동합니다. + / −, 0, 방향키도 사용할 수 있습니다.", "Search a signal or component name. Zoom with the wheel or two fingers and drag to pan. Keyboard shortcuts: + / − to zoom, 0 to fit, and arrow keys to pan.")],
    [t("다른 도면으로 교체하기", "Replace your drawing"), t("다른 PDF를 현재 뷰어에 끌어다 놓거나 ‘다른 PDF 열기’를 누르세요. 새 도면이 같은 화면에서 열립니다. 여러 장은 상단 페이지 번호로 이동합니다.", "Drop another PDF onto the current viewer or choose Open another PDF. It replaces the drawing in the same workspace. Use the page numbers to navigate multi-page files.")],
  ];
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
        <p className="eyebrow">SCHEMATIC VIEWER / BROWSER WORKSPACE</p><h1 id="welcome">{t("복잡한 회로도,", "Complex schematics.")}<br /><span>{t("연결은 클릭 한 번으로.", "Clear connections.")}</span></h1>
        <p className="hero-description">{t("회로도 PDF의 전원과 신호가 어디로 이어지는지 한눈에 따라가세요. 배선 선택, 노드 강조, 부품 검색을 한 화면에서 할 수 있습니다.", "Trace power and signals in your schematic PDF. Select wires, highlight nets and find components in one focused workspace.")}</p>
        {/* what it opens / which files / where the file goes — right above the button */}
        <ul className="hero-facts">
          <li><strong>{t("열 수 있는 파일", "Opens")}</strong>{t("전자회로 회로도 PDF (KiCad·OrCAD·Altium·Eagle 등에서 내보낸 벡터 PDF)", "Electronic schematic PDFs exported from KiCad, OrCAD, Altium, Eagle and similar")}</li>
          <li><strong>{t("열 수 없는 파일", "Not supported")}</strong>{t("스캔·사진 PDF, 암호가 걸린 PDF", "Scanned or photographed PDFs, password-protected PDFs")}</li>
          <li><strong>{t("파일 처리", "Your file")}</strong>{t("서버로 보내거나 저장하지 않고 브라우저 안에서만 처리합니다", "Never uploaded or stored on a server — processed only in your browser")}</li>
        </ul>
        <div className="hero-actions"><a className="primary-link" href="#viewer">{t("PDF 뷰어 시작하기", "Open PDF workspace")}<ArrowRight size={18} aria-hidden="true" /></a><a className="text-link" href="#example">{t("예제 회로도 체험하기", "Try an example")} →</a></div>
        <div className="trust-row"><span><LockKeyhole size={15} />{t("내 기기에서 처리", "Processed locally")}</span><span>{t("회원가입 없음", "No sign-up")}</span><span>{t("무료", "Free")}</span></div>
      </div><CircuitArtwork /></div></section>
      <div className="content-wrap">
        <section className="feature-grid" aria-label={t("주요 기능", "Key features")}>{features.map(([Icon, title, description], i) => <article key={i}><Icon aria-hidden="true" /><span className="feature-number">0{i + 1}</span><h2>{title}</h2><p>{description}</p></article>)}</section>
        <section id="about" className="editorial-section" aria-labelledby="about-title"><div><p className="eyebrow">01 / ABOUT</p><h2 id="about-title">{t("도면을 읽는 데서 그치지 않고\n연결까지 이해하도록 돕습니다.", "Beyond reading.\nUnderstand the connections.")}</h2></div><div>
          <p>{t("Schematic Viewer는 전자회로를 공부하거나 도면을 검토할 때 멀리 떨어진 같은 신호를 찾는 수고를 줄이는 무료 웹 도구입니다. PDF의 선과 글자를 분석하고, 연결을 원본 도면 위에 강조합니다.", "Schematic Viewer is a free web tool for studying electronics and reviewing drawings. It analyzes lines and text in your PDF, then highlights inferred connections on the original drawing.")}</p>
          <p>{t("예를 들어 +5V 배선을 선택해 같은 전원으로 이어진 곳을 확인하거나, R1을 검색해 부품 위치로 이동할 수 있습니다.", "For example, select a +5V wire to inspect its inferred power net, or search R1 to locate a component.")} <a className="text-link" href={href("/about/")}>{t("소개 더 보기", "More about the project")} →</a></p>
          <aside className="info-note"><h3>{t("지원 범위와 분석 한계", "Supported files and limitations")}</h3><p>{t("벡터 PDF를 권장하며 스캔·이미지 PDF는 지원하지 않습니다. 글자를 선으로만 내보낸 PDF는 이름 검색이 제한될 수 있습니다. 페이지별로 연결을 추정하므로 설계·수리 판단 전에는 원본과 CAD 자료로 확인하세요.", "Vector PDFs are recommended. Scanned or image-only PDFs are not supported, and outlined text may limit name search. Connections are inferred per page; verify them against the original drawing and CAD data before making design or repair decisions.")}</p></aside>
        </div></section>
        <section id="guide" className="guide-section" aria-labelledby="guide-title"><p className="eyebrow">02 / QUICK START</p><div className="section-heading"><h2 id="guide-title">{t("도면 탐색, 네 단계로 시작하기", "Four steps to your first connection")}</h2><a className="text-link" href={href("/guide/")}>{t("전체 사용법", "Full guide")} →</a></div><ol className="steps-grid">{steps.map(([title, description], i) => <li key={i}><span>0{i + 1}</span><h3>{title}</h3><p>{description}</p></li>)}</ol><p className="guide-tip">{t("파일이 열리지 않으면 암호화·손상 여부를 확인하세요. 분석이 부정확하면 선과 글자가 포함된 PDF로 다시 내보내 보세요.", "If a file will not open, check whether it is encrypted or damaged. For better analysis, export a PDF that contains vector lines and text.")} <a href={href("/help/formats/")}>{t("해결 방법 보기", "Troubleshooting")} →</a></p></section>
        <section className="guide-section" aria-labelledby="learn-title"><p className="eyebrow">03 / LEARN</p><div className="section-heading"><h2 id="learn-title">{t("읽을거리", "Guides and articles")}</h2></div>
          <ul className="article-grid">{articles.map(([path, title, description]) => <li key={path}><a href={href(path)}><h3>{title}</h3><p>{description}</p><span>{t("읽기", "Read")} →</span></a></li>)}</ul>
        </section>
      </div>
    </main><footer className="site-footer"><a className="brand" href="#home"><CircuitBoard size={20} /><span>Schematic <strong>Viewer</strong></span></a><span>© 2026 Schematic Viewer</span><div>
      <a href={href("/about/")}>{t("소개", "About")}</a><a href={href("/contact/")}>{t("문의", "Contact")}</a><a href={href("/privacy/")}>{t("개인정보처리방침", "Privacy policy")}</a><a href={href("/terms/")}>{t("이용약관", "Terms of use")}</a>
    </div></footer></>}
  </div>;
}

createRoot(document.getElementById("root")!).render(<StrictMode><Website /></StrictMode>);
