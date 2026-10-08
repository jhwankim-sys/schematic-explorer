import "./lib/polyfills.ts";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowRight, CircuitBoard, LockKeyhole, FileSearch, Waypoints } from "lucide-react";
import "./index.css";
import { App } from "./App.tsx";
import { CircuitArtwork } from "./components/circuit-artwork.tsx";
import { LanguageContext, useT, type Language } from "./i18n.tsx";

function Website() {
  const [language, setLanguage] = useState<Language>(() => {
    try { const saved = localStorage.getItem("schematic-viewer-language"); if (saved === "ko" || saved === "en") return saved; } catch { /* Storage can be disabled. */ }
    return navigator.language.toLowerCase().startsWith("ko") ? "ko" : "en";
  });
  useEffect(() => {
    document.documentElement.lang = language;
    try { localStorage.setItem("schematic-viewer-language", language); } catch { /* Works without storage. */ }
  }, [language]);
  return <LanguageContext value={language}><WebsiteContent language={language} onLanguage={setLanguage} /></LanguageContext>;
}

function WebsiteContent({ language, onLanguage }: { language: Language; onLanguage: (language: Language) => void }) {
  const t = useT();
  const [route, setRoute] = useState(window.location.hash);
  const viewer = route === "#viewer" || route === "#drawing";
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
    [Waypoints, t("클릭 한 번으로 연결 탐색", "Follow a net in one click"), t("배선 한 곳을 선택하면 같은 노드로 분석된 배선과 라벨을 함께 강조합니다.", "Select a wire to highlight the connections and labels identified as part of the same net.")],
    [FileSearch, t("노드와 부품을 빠르게 검색", "Find nets and components"), t("GND, +5V, R1처럼 익숙한 이름으로 도면의 글자와 부품 위치를 찾아보세요.", "Search familiar names like GND, +5V or R1 to locate text and components in your drawing.")],
    [LockKeyhole, t("내 기기에서 처리하는 PDF", "Your PDF stays on your device"), t("회원가입이나 파일 업로드 서버 없이 브라우저 안에서 PDF를 분석합니다.", "Analyze PDFs in your browser, without an account or a file-upload server.")],
  ] as const;
  const steps = [
    [t("PDF 열기", "Open a PDF"), t("시작하기를 누르고 PDF를 선택하거나 작업 화면에 끌어다 놓으세요. CAD에서 내보낸 벡터 PDF를 권장합니다.", "Get started, then choose a PDF or drop it into the workspace. Vector PDFs exported from CAD work best.")],
    [t("배선 선택하기", "Select a wire"), t("분석이 끝나면 배선을 클릭하세요. 선택한 노드의 연결이 빨간색으로 강조됩니다. 왼쪽 목록에서도 노드와 부품을 선택할 수 있습니다.", "After analysis, click a wire to highlight its net in red. You can also select nets and components from the sidebar.")],
    [t("검색하고 살펴보기", "Search and inspect"), t("검색창에 신호나 부품 이름을 입력하세요. 휠로 확대·축소하고 드래그로 이동합니다. + / −, 0, 방향키도 사용할 수 있습니다.", "Search a signal or component name. Use the wheel to zoom and drag to pan. Keyboard shortcuts: + / − to zoom, 0 to fit, and arrow keys to pan.")],
    [t("다른 도면으로 교체하기", "Replace your drawing"), t("다른 PDF를 현재 뷰어에 끌어다 놓거나 ‘다른 PDF 열기’를 누르세요. 같은 작업 화면에서 새 도면이 열립니다. 여러 장은 상단 페이지 번호로 이동합니다.", "Drop another PDF onto the current viewer or choose Open another PDF. It replaces the drawing in the same workspace. Use the page numbers to navigate multi-page files.")],
  ];
  return <div className={viewer ? "site-shell workspace-shell" : "site-shell"}>
    <header className="site-header"><a className="brand" href="#home"><CircuitBoard aria-hidden="true" /><span>Schematic <strong>Viewer</strong></span></a>
      <nav aria-label={t("사이트 메뉴", "Site navigation")}><a href="#about">{t("소개", "About")}</a><a href="#guide">{t("사용법", "Guide")}</a><a href="#privacy">{t("개인정보처리방침", "Privacy")}</a></nav>
      <div className="header-actions"><div className="language-switch" role="group" aria-label={t("언어 선택", "Language")}><button type="button" aria-pressed={language === "ko"} onClick={() => onLanguage("ko")}>한국어</button><button type="button" aria-pressed={language === "en"} onClick={() => onLanguage("en")}>EN</button></div><a className="header-start" href="#viewer">{t("시작하기", "Get started")}<ArrowRight size={15} aria-hidden="true" /></a></div>
    </header>
    <div className="workspace" hidden={!viewer}><App active={viewer} /></div>
    {!viewer && <><main id="home">
      <section className="landing-hero" aria-labelledby="welcome"><div className="hero-layout"><div className="hero-copy">
        <p className="eyebrow">SCHEMATIC VIEWER / BROWSER WORKSPACE</p><h1 id="welcome">{t("복잡한 회로도,", "Complex schematics.")}<br /><span>{t("명확하게 이어지는 연결.", "Clear connections.")}</span></h1>
        <p className="hero-description">{t("회로도 PDF의 전원과 신호를 한눈에 따라가세요. 배선 선택, 노드 강조, 부품 검색을 하나의 작업 화면에서.", "Trace power and signals in your schematic PDF. Select wires, highlight nets and find components in one focused workspace.")}</p>
        <div className="hero-actions"><a className="primary-link" href="#viewer">{t("PDF 뷰어 시작하기", "Open PDF workspace")}<ArrowRight size={18} aria-hidden="true" /></a><a className="text-link" href="#guide">{t("사용법 살펴보기", "Read the guide")} ↗</a></div>
        <div className="trust-row"><span><LockKeyhole size={15} />{t("로컬 처리")}</span><span>{t("회원가입 없음")}</span><span>{t("원본 PDF")}</span></div>
      </div><CircuitArtwork /></div></section>
      <div className="content-wrap">
        <section className="feature-grid" aria-label={t("주요 기능", "Key features")}>{features.map(([Icon, title, description], i) => <article key={i}><Icon aria-hidden="true" /><span className="feature-number">0{i + 1}</span><h2>{title}</h2><p>{description}</p></article>)}</section>
        <section id="about" className="editorial-section" aria-labelledby="about-title"><div><p className="eyebrow">01 / ABOUT</p><h2 id="about-title">{t("읽는 데서 끝나지 않고,\n연결을 이해하도록.", "Beyond reading.\nUnderstand the connections.")}</h2></div><div>
          <p>{t("Schematic Viewer는 전자회로를 공부하거나 도면을 검토할 때 멀리 떨어진 같은 신호를 찾는 수고를 줄이는 무료 웹 도구입니다. PDF의 선과 글자를 분석하고, 연결을 원본 도면 위에 강조합니다.", "Schematic Viewer is a free web tool for studying electronics and reviewing drawings. It analyzes lines and text in your PDF, then highlights inferred connections on the original drawing.")}</p>
          <p>{t("예를 들어 +5V 배선을 선택해 같은 전원 노드로 분석된 연결을 확인하거나, R1을 검색해 부품 위치로 이동할 수 있습니다.", "For example, select a +5V wire to inspect its inferred power net, or search R1 to locate a component.")}</p>
          <aside className="info-note"><h3>{t("지원 범위와 분석 한계", "Supported files and limitations")}</h3><p>{t("벡터 PDF를 권장하며 스캔·이미지 PDF는 지원하지 않습니다. 글자를 선으로만 내보낸 PDF는 이름 검색이 제한될 수 있습니다. 페이지별로 연결을 추정하므로 설계·수리 판단 전에는 원본과 CAD 자료로 확인하세요.", "Vector PDFs are recommended. Scanned or image-only PDFs are not supported, and outlined text may limit name search. Connections are inferred per page; verify them against the original drawing and CAD data before making design or repair decisions.")}</p></aside>
        </div></section>
        <section id="guide" className="guide-section" aria-labelledby="guide-title"><p className="eyebrow">02 / QUICK START</p><div className="section-heading"><h2 id="guide-title">{t("도면 탐색을 시작하는 네 단계", "Four steps to your first connection")}</h2><a className="text-link" href="#viewer">{t("시작하기", "Get started")} →</a></div><ol className="steps-grid">{steps.map(([title, description], i) => <li key={i}><span>0{i + 1}</span><h3>{title}</h3><p>{description}</p></li>)}</ol><p className="guide-tip">{t("파일이 열리지 않으면 암호화·손상 여부를 확인하세요. 분석이 부정확하면 선과 글자가 포함된 PDF로 다시 내보내 보세요.", "If a file will not open, check whether it is encrypted or damaged. For better analysis, export a PDF that contains vector lines and text.")}</p></section>
        <Privacy />
      </div>
    </main><footer className="site-footer"><a className="brand" href="#home"><CircuitBoard size={20} /><span>Schematic <strong>Viewer</strong></span></a><span>© 2026 Schematic Viewer</span><div><a href="#privacy">{t("개인정보처리방침", "Privacy policy")}</a><a href="https://github.com/jhwankim-sys/schematic-explorer/issues">{t("문의 및 의견", "Contact & feedback")}</a></div></footer></>}
  </div>;
}

function Privacy() {
  const t = useT();
  return <section id="privacy" className="privacy-section" aria-labelledby="privacy-title"><p className="eyebrow">03 / PRIVACY</p><h2 id="privacy-title">{t("개인정보처리방침", "Privacy policy")}</h2><p className="policy-date">schematicviewer.com · {t("시행일: 2026년 10월 9일", "Effective: October 9, 2026")}</p><div className="policy-grid">
    <article><h3>{t("1. 운영자와 처리 목적", "1. Operator and purpose")}</h3><p>{t("이 사이트는 jhwankim-sys가 운영하는 회로도 PDF 탐색 도구입니다. 도면과 노드·부품 목록을 표시하기 위해 선택한 PDF를 브라우저에서 처리합니다. 회원가입이나 이름·이메일 입력을 요구하지 않습니다.", "This schematic PDF tool is operated by jhwankim-sys. Your selected PDF is processed in your browser to display drawings, nets and components. No account, name or email address is required.")}</p></article>
    <article><h3>{t("2. PDF와 분석 데이터", "2. PDFs and analysis data")}</h3><p>{t("PDF, 파일 이름, 도면의 글자와 분석 결과는 브라우저 메모리에서 처리합니다. 운영자에게 전송하거나 서버에 저장하지 않으며 광고 업체에 전달하지 않습니다. 이 파일 데이터를 쿠키나 영구 저장소에 보관하지 않습니다. 다른 PDF를 열거나 새로고침·페이지 종료 시 기존 결과는 더 이상 이용할 수 없습니다. 원본 파일은 변경하지 않습니다.", "PDFs, file names, drawing text and analysis results are processed in browser memory. They are not sent to the operator, stored on a server or shared with advertisers. This file data is not stored in cookies or persistent browser storage. Opening another PDF, reloading or closing the page makes the previous results unavailable. Your original file is not modified.")}</p></article>
    <article><h3>{t("3. 언어 설정과 접속 정보", "3. Language preference and hosting")}</h3><p>{t("한국어·영어 선택값만 브라우저의 로컬 저장소에 보관해 다음 방문에 적용합니다. 브라우저에서 사이트 데이터를 삭제하면 초기화됩니다. GitHub Pages가 페이지를 제공하며 요청 과정에서 IP 주소 등의 접속 정보를 처리할 수 있습니다. 이는 PDF 전송과는 별개입니다.", "Only your Korean or English language preference is saved in local browser storage for future visits. Clear site data in your browser to reset it. GitHub Pages serves this site and may process connection information such as your IP address. This is separate from PDF processing.")}</p><a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">{t("GitHub 개인정보처리방침", "GitHub privacy statement")} ↗</a></article>
    <article><h3>{t("4. 쿠키와 광고", "4. Cookies and advertising")}</h3><p>{t("현재 AdSense 광고 코드나 방문 분석 도구는 설치되어 있지 않으며, 앱은 광고·분석 쿠키를 사용하지 않습니다. 광고 도입 전에 방침과 필요한 지역별 동의 절차를 업데이트합니다.", "No AdSense advertising code or visitor analytics is currently installed. The app does not use advertising or analytics cookies. This policy and any required regional consent procedures will be updated before advertising is introduced.")}</p><p>{t("AdSense 적용 시 Google 등 제3자 광고 제공업체는 이 사이트 및 다른 사이트 방문 기록에 기반한 광고를 위해 쿠키를 사용할 수 있습니다. 다음 링크에서 정보 이용과 맞춤 광고 설정을 확인할 수 있습니다.", "If AdSense is introduced, Google and other third-party vendors may use cookies to serve ads based on visits to this and other websites. The links below explain data use and personalized advertising choices.")}</p><div className="policy-links"><a href="https://myadcenter.google.com/">{t("Google 내 광고 센터", "Google My Ad Center")} ↗</a><a href="https://www.aboutads.info/choices/">{t("제3자 광고 선택", "Third-party ad choices")} ↗</a><a href="https://policies.google.com/technologies/partner-sites?hl=en">{t("Google 정보 이용 안내", "How Google uses information")} ↗</a></div></article>
    <article><h3>{t("5. 선택과 문의", "5. Your choices and contact")}</h3><p>{t("파일을 선택하지 않고 소개와 사용법을 읽을 수 있으며 브라우저에서 쿠키와 사이트 데이터를 관리할 수 있습니다. 문의는 운영 저장소의 공개 문의 페이지에서 접수합니다(GitHub 계정 필요). 개인정보·비공개 회로도는 첨부하지 마세요.", "You can read the introduction and guide without selecting a file. Manage cookies and site data through your browser. Contact the operator through the public repository issues page (a GitHub account is required). Do not include personal information or confidential schematics.")}</p><a href="https://github.com/jhwankim-sys/schematic-explorer/issues">{t("문의 및 의견", "Contact & feedback")} ↗</a></article>
    <article><h3>{t("6. 방침 변경", "6. Policy updates")}</h3><p>{t("파일 처리, 호스팅, 광고 또는 분석 기능이 변경되면 이 페이지에 변경 내용과 시행일을 안내합니다.", "Changes to file processing, hosting, advertising or analytics will be described on this page together with their effective date.")}</p></article>
  </div></section>;
}

createRoot(document.getElementById("root")!).render(<StrictMode><Website /></StrictMode>);
