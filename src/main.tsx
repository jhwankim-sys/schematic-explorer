import "./lib/polyfills.ts";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App.tsx";

function Website() {
  const [route, setRoute] = useState(window.location.hash);
  useEffect(() => {
    const update = () => { setRoute(window.location.hash); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  const viewer = route === "#viewer" || route === "#drawing";
  useEffect(() => {
    document.title = viewer ? "PDF 탐색 | 회로도 노드 탐색기" : "회로도 노드 탐색기 | 소개 · 사용법 · 개인정보처리방침";
    if (!viewer && route) requestAnimationFrame(() => document.getElementById(route.slice(1))?.scrollIntoView());
  }, [route, viewer]);
  const link = "rounded px-2 py-2 text-sm hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring";
  return <>
    <header className="flex flex-wrap items-center justify-between gap-2 border-b bg-card px-4 py-2 sm:px-8">
      <a href="#home" className="font-semibold tracking-tight">Schematic Explorer <span className="text-primary">↗</span></a>
      <nav aria-label="사이트 메뉴" className="flex flex-wrap gap-1">
        <a className={link} href="#about">소개</a><a className={link} href="#guide">사용법</a><a className={link} href="#privacy">개인정보처리방침</a>
        <a className={link + " font-semibold text-primary"} href="#viewer">시작하기 →</a>
      </nav>
    </header>
    <div hidden={!viewer}><App /></div>
    {!viewer && <main id="home" className="mx-auto max-w-5xl px-6 py-12 sm:py-20">
      <section aria-labelledby="welcome" className="mb-16">
        <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">브라우저에서 바로 여는 회로도</p>
        <h1 id="welcome" className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">복잡한 회로도,<br />연결을 한눈에 따라가세요.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">회로도 PDF의 배선을 클릭하면 같은 노드를 빨간색으로 강조합니다. 전원이나 신호 이름을 하나씩 찾던 시간을 줄이고, 부품과 연결 관계를 더 쉽게 살펴보세요.</p>
        <a href="#viewer" className="mt-8 inline-flex rounded-md bg-primary px-7 py-3 font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">시작하기 →</a>
        <p className="mt-4 text-sm text-muted-foreground">회원가입 없이 이용 · PDF는 브라우저 안에서만 처리</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[["01", "연결된 노드 강조", "배선 한 곳을 클릭해 같은 노드의 배선과 라벨을 함께 확인하세요."], ["02", "이름으로 빠르게 검색", "GND, +5V, R1처럼 노드·부품 이름과 도면의 글자를 찾아보세요."], ["03", "원본 도면과 함께 확인", "PDF 원본 위에 분석 결과를 표시합니다. 확대와 이동으로 자세히 살펴보세요."]].map(([n,t,d]) => <article key={n} className="rounded-xl border bg-card p-6"><p className="font-mono text-sm text-primary">{n}</p><h2 className="mt-3 font-semibold">{t}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{d}</p></article>)}
        </div>
      </section>
      <section id="about" className="scroll-mt-6 border-t py-10" aria-labelledby="about-title">
        <h2 id="about-title" className="text-2xl font-bold">회로도 노드 탐색기 소개</h2>
        <p className="mt-4 leading-8">전자회로를 공부하거나 회로도를 검토할 때, 멀리 떨어진 같은 신호를 찾는 일은 번거롭습니다. 이 도구는 PDF의 선과 글자를 분석해 연결을 추정하고, 선택한 노드를 원본 도면 위에 강조하는 무료 웹 도구입니다.</p>
        <p className="mt-3 leading-8 text-muted-foreground">예를 들어 +5V 배선을 클릭하면 같은 전원 노드로 분석된 배선과 라벨을 함께 볼 수 있습니다. R1을 검색하거나 부품 목록에서 선택하면 해당 위치를 확인할 수 있습니다.</p>
        <aside className="mt-6 rounded-lg border bg-card p-5 text-sm leading-7"><h3 className="font-semibold">사용 전에 알아두세요</h3><p>CAD에서 내보낸 벡터 PDF를 권장합니다. 스캔·이미지 PDF는 지원하지 않으며, 글자를 선으로만 내보낸 PDF는 이름 검색이 제한될 수 있습니다. 여러 페이지는 페이지별로 분석합니다. 연결 분석은 추정 결과이므로 설계·수리 판단 전에는 원본 회로도와 CAD 자료로 확인하세요.</p></aside>
      </section>
      <section id="guide" className="scroll-mt-6 border-t py-10" aria-labelledby="guide-title">
        <h2 id="guide-title" className="text-2xl font-bold">간단한 사용법</h2>
        <ol className="mt-6 list-decimal space-y-5 pl-6 leading-7">
          <li><strong>시작하기를 누르세요.</strong> PDF 업로드 화면에서 ‘PDF 파일 선택’을 누르거나 파일을 끌어다 놓습니다. 화면의 ‘업로드’는 로컬 파일 선택을 의미하며, PDF는 서버로 전송되지 않습니다.</li>
          <li><strong>분석이 끝나면 배선을 클릭하세요.</strong> 선택한 배선과 같은 노드로 분석된 연결이 빨간색으로 표시됩니다. 노드 목록에서도 선택할 수 있습니다.</li>
          <li><strong>노드나 부품을 찾아보세요.</strong> 검색창에 GND, +5V, R1 등의 이름을 입력합니다. 검색 결과의 이전·다음 버튼으로 현재 페이지의 일치 위치를 이동합니다.</li>
          <li><strong>도면을 자세히 살펴보세요.</strong> 마우스 휠로 확대·축소하고 드래그로 이동합니다. 도면에 초점을 두면 + / − 키로 확대·축소, 0 키로 전체 보기, 방향키로 이동할 수 있습니다. 여러 장이면 상단 페이지 번호를 선택하세요.</li>
        </ol>
        <p className="mt-6 text-sm leading-7 text-muted-foreground">파일이 열리지 않으면 암호화·손상 여부를 확인하세요. 분석 결과가 기대와 다르면 CAD에서 선과 글자가 포함된 PDF로 다시 내보내 보세요.</p>
        <a href="#viewer" className="mt-5 inline-block font-semibold text-primary underline underline-offset-4">내 PDF로 시작하기 →</a>
      </section>
      <section id="privacy" className="scroll-mt-6 border-t py-10" aria-labelledby="privacy-title">
        <h2 id="privacy-title" className="text-2xl font-bold">개인정보처리방침</h2>
        <p className="mt-2 text-sm text-muted-foreground">적용 사이트: schematicviewer.com · 시행일: 2026년 10월 8일</p>
        <div className="mt-6 space-y-6 text-sm leading-7">
          <article><h3 className="text-base font-semibold">1. 운영자와 처리 목적</h3><p>이 사이트는 jhwankim-sys가 운영하는 회로도 PDF 탐색 도구입니다. 파일을 분석해 도면과 노드·부품 목록을 표시하는 목적으로 이용자가 선택한 파일을 브라우저에서 처리합니다. 회원가입이나 이름·이메일 입력을 요구하지 않습니다.</p></article>
          <article><h3 className="text-base font-semibold">2. PDF와 분석 데이터</h3><p>선택한 PDF, 파일 이름, 도면의 글자 및 분석 결과는 이용자의 브라우저 메모리에서 처리됩니다. 사이트 운영자에게 업로드하거나 서버에 저장하지 않으며, 광고 업체에 전달하지 않습니다. 앱은 이 데이터를 쿠키나 브라우저의 영구 저장소에 보관하지 않습니다. 다른 PDF를 열거나 페이지를 새로고침·닫으면 기존 분석 결과를 더 이상 이용할 수 없습니다. 기기에 저장된 원본 파일은 변경하지 않습니다.</p></article>
          <article><h3 className="text-base font-semibold">3. 호스팅 및 접속 정보</h3><p>사이트는 GitHub Pages를 통해 제공됩니다. 페이지 요청 과정에서 IP 주소 등 접속 정보가 호스팅 제공자에 의해 처리될 수 있습니다. 이는 PDF 내용 전송과는 별개입니다. GitHub의 처리 및 보관 기준은 <a className="text-primary underline" href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">GitHub 개인정보처리방침</a>을 확인하세요.</p></article>
          <article><h3 className="text-base font-semibold">4. 쿠키와 광고</h3><p>현재 사이트에는 Google AdSense 광고 코드나 방문 분석 도구를 설치하지 않았으며, 앱 자체는 광고·분석 쿠키를 사용하지 않습니다. 향후 광고를 도입하면 적용 전에 이 방침을 업데이트합니다.</p><p className="mt-2">Google AdSense가 적용되는 경우 Google 등 제3자 광고 제공업체는 쿠키를 사용해 이 사이트 또는 다른 사이트 방문 기록에 기반한 광고를 제공할 수 있습니다. 이용자는 <a className="text-primary underline" href="https://myadcenter.google.com/">Google 내 광고 센터</a>에서 맞춤 광고 설정을 관리하고, <a className="text-primary underline" href="https://www.aboutads.info/choices/">제3자 광고 선택 안내</a>를 확인할 수 있습니다. 자세한 내용은 <a className="text-primary underline" href="https://policies.google.com/technologies/partner-sites?hl=ko">Google의 파트너 사이트 정보 이용 안내</a>를 참고하세요. 광고 도입 시 해당 지역에 필요한 동의 절차도 적용합니다.</p></article>
          <article><h3 className="text-base font-semibold">5. 이용자의 선택과 문의</h3><p>파일을 선택하지 않고 소개·사용법을 읽을 수 있으며, 브라우저 설정에서 쿠키를 관리할 수 있습니다. 개인정보 관련 문의는 <a className="text-primary underline" href="https://github.com/jhwankim-sys/schematic-explorer/issues">운영 저장소의 문의 페이지</a>로 접수할 수 있습니다(GitHub 계정 필요). 공개 문의에는 PDF 원본, 개인정보 또는 비공개 회로 정보를 첨부하지 마세요.</p></article>
          <article><h3 className="text-base font-semibold">6. 방침 변경</h3><p>파일 처리 방식, 호스팅, 광고 또는 분석 기능이 변경되면 이 페이지에서 변경 내용과 시행일을 안내합니다.</p></article>
        </div>
      </section>
    </main>}
    {!viewer && <footer className="border-t bg-card px-6 py-6 text-center text-sm text-muted-foreground">© 2026 Schematic Explorer · <a className="underline" href="#privacy">개인정보처리방침</a> · <a className="underline" href="https://github.com/jhwankim-sys/schematic-explorer/issues">문의 및 의견</a></footer>}
  </>;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Website />
  </StrictMode>,
);
