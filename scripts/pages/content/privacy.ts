import type { PageDef } from "./index.ts";

const ISSUES = "https://github.com/jhwankim-sys/schematic-explorer/issues";
const EFFECTIVE = "2026-10-09";

// Keep every statement here true to what the site actually does.
// The analytics section switches automatically with site.config.json (ga4MeasurementId).
export const privacy: PageDef = {
  slug: "privacy",
  cta: false,
  related: ["terms", "contact", "faq"],
  content: ({ lang, href, email, analytics }) => {
    const reach = email ? `<a href="mailto:${email}">${email}</a>` : "";
    if (lang === "ko") {
      const ga = analytics
        ? `<p>방문 통계를 위해 <strong>Google Analytics 4</strong>를 사용합니다. Google Analytics는 쿠키(<code>_ga</code> 등)를 사용해 방문한 페이지, 대략적인 지역, 기기·브라우저 종류, 유입 경로 같은 정보를 수집하며, 이 정보는 Google의 정책에 따라 처리됩니다. 이 사이트가 추가로 보내는 이벤트는 다음뿐입니다.</p>
<table>
<thead><tr><th>이벤트</th><th>보내는 값</th></tr></thead>
<tbody>
<tr><td><code>file_open</code></td><td>파일을 연 방법(선택/끌어 놓기), 파일 크기(KB)</td></tr>
<tr><td><code>example_load</code></td><td>예제 회로도를 열었다는 사실</td></tr>
<tr><td><code>view_complete</code></td><td>페이지 수, 노드 수, 부품 수, 분석 시간, 텍스트 레이어 유무</td></tr>
<tr><td><code>error</code></td><td>오류 종류(PDF 아님, 암호, 읽기 실패, 선 정보 없음, 그리기 실패)</td></tr>
</tbody>
</table>
<p><strong>파일 이름, 파일 내용, 도면에서 읽은 글자(부품 번호, 넷 이름 등)는 어떤 경우에도 보내지 않습니다.</strong> Google Analytics 수집을 원하지 않으면 브라우저에서 쿠키를 차단하거나 Google이 제공하는 <a href="https://tools.google.com/dlpage/gaoptout">Google 애널리틱스 차단 브라우저 부가기능</a>을 사용할 수 있습니다.</p>`
        : `<p>현재 이 사이트는 방문 통계 도구를 사용하지 않습니다. 앞으로 도입하게 되면 수집 항목을 이 방침에 먼저 공개합니다. 도입하더라도 파일 이름, 파일 내용, 도면에서 읽은 글자는 보내지 않습니다.</p>`;
      return {
        title: "개인정보처리방침",
        description: "Schematic Viewer는 회원 가입이 없고, 회로도 파일을 서버로 보내지 않습니다. 이 사이트가 처리하는 정보, 쿠키, 광고, 이용자의 권리를 설명합니다.",
        body: `
<p>Schematic Viewer(이하 "사이트", https://schematicviewer.com)는 이용자의 개인정보를 소중히 다루며, 「개인정보 보호법」 등 관련 법령을 지킵니다. 이 방침은 사이트가 어떤 정보를 어떻게 처리하는지 설명합니다.</p>

<h2>1. 회로도 파일은 수집하지 않습니다</h2>
<ul>
<li>이용자가 여는 PDF 파일은 <strong>이용자의 브라우저 안에서만</strong> 읽고 분석합니다.</li>
<li>파일, 파일 이름, 파일 내용, 분석 결과를 운영자의 서버나 제3자에게 <strong>전송하지 않으며 저장하지도 않습니다</strong>. 사이트에는 파일을 받는 서버 프로그램이 없습니다.</li>
<li>파일은 브라우저 탭의 메모리에만 있다가 다른 파일을 열거나, 새로 고치거나, 탭을 닫으면 사라집니다.</li>
<li>예제 회로도를 열 때는 예제 PDF를 이 사이트에서 내려받습니다. 이용자의 파일이 올라가는 것은 아닙니다.</li>
</ul>

<h2>2. 처리하는 정보</h2>
<p>사이트에는 회원 가입, 로그인, 입력 양식이 없으며 이름·연락처 같은 정보를 직접 받지 않습니다. 다만 다음 정보가 처리될 수 있습니다.</p>
<table>
<thead><tr><th>항목</th><th>처리 주체와 목적</th><th>보관</th></tr></thead>
<tbody>
<tr><td>접속 기록(IP 주소, 요청한 주소, 시간, 브라우저 정보)</td><td>호스팅 사업자 GitHub(GitHub Pages)가 서비스 제공과 보안을 위해 자동으로 기록합니다. 운영자는 이 기록을 받아 보거나 이용하지 않습니다.</td><td><a href="https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement">GitHub 개인정보 처리방침</a>에 따름</td></tr>
<tr><td>언어 설정</td><td>선택한 언어(한국어/English)를 다음 방문 때 유지하려고 이용자 브라우저의 localStorage에 저장합니다. 서버로 전송되지 않습니다.</td><td>이용자가 브라우저 데이터를 지울 때까지</td></tr>
<tr><td>방문 통계</td><td>아래 3항 참고</td><td>Google 정책에 따름</td></tr>
<tr><td>광고 관련 정보</td><td>아래 4항 참고</td><td>Google 정책에 따름</td></tr>
<tr><td>문의 내용(이메일 주소, 보낸 내용)</td><td>이용자가 이메일이나 GitHub 이슈로 연락한 경우 답변을 위해서만 사용합니다.</td><td>답변 완료 후 1년 이내 삭제(GitHub 이슈는 이용자가 직접 삭제 가능)</td></tr>
</tbody>
</table>

<h2>3. 방문 통계</h2>
${ga}

<h2>4. 광고와 쿠키</h2>
<p>사이트는 운영 비용을 위해 <strong>Google AdSense</strong> 광고를 게재할 수 있습니다.</p>
<ul>
<li>Google을 포함한 제3자 광고 사업자는 쿠키를 사용해 이용자가 이 사이트나 다른 사이트를 방문한 기록을 바탕으로 광고를 게재합니다.</li>
<li>Google은 광고 쿠키를 사용해 이용자가 이 사이트 및 인터넷의 다른 사이트를 방문한 기록에 따라 Google과 파트너가 광고를 게재할 수 있게 합니다.</li>
<li>이용자는 <a href="https://myadcenter.google.com/">Google 내 광고 센터</a>에서 맞춤 광고를 끌 수 있으며, <a href="https://www.aboutads.info/choices/">www.aboutads.info</a>에서 다른 제3자 사업자의 맞춤 광고 쿠키를 거부할 수 있습니다.</li>
<li>Google이 파트너 사이트에서 정보를 사용하는 방식은 <a href="https://policies.google.com/technologies/partner-sites">Google 파트너 사이트 정책</a>에서 볼 수 있습니다.</li>
<li>유럽경제지역(EEA)·영국·스위스 이용자에게는 Google의 동의 관리 절차에 따라 광고 쿠키 사용 전 동의를 받습니다.</li>
</ul>
<p>광고는 회로도 파일에 접근할 수 없으며, 파일 내용은 광고에 쓰이지 않습니다.</p>

<h2>5. 쿠키를 거부하는 방법</h2>
<p>브라우저 설정에서 쿠키를 차단하거나 삭제할 수 있습니다(예: Chrome 설정 → 개인정보 및 보안 → 서드 파티 쿠키). 쿠키를 차단해도 회로도 보기 기능은 그대로 쓸 수 있습니다.</p>

<h2>6. 제3자 제공과 처리 위탁</h2>
<p>운영자는 이용자의 개인정보를 제3자에게 제공하거나 판매하지 않습니다. 위 2~4항에 적힌 서비스(GitHub, Google)는 각 사업자가 자신의 방침에 따라 정보를 처리하며, 이 과정에서 정보가 국외(미국 등)에 있는 서버에서 처리될 수 있습니다.</p>

<h2>7. 이용자의 권리</h2>
<p>이용자는 운영자가 처리하는 자신의 개인정보(문의 내용 등)에 대해 열람, 정정, 삭제, 처리 정지를 요청할 수 있습니다. 아래 연락처로 요청하시면 지체 없이 처리합니다. 사이트는 만 14세 미만 아동의 개인정보를 의도적으로 수집하지 않습니다.</p>

<h2>8. 개인정보 보호책임자와 연락처</h2>
<ul>
<li>개인정보 보호책임자: 사이트 운영자</li>
<li>연락처: ${reach ? reach + ", " : ""}<a href="${href("contact")}">문의 페이지</a>, <a href="${ISSUES}">GitHub 이슈</a></li>
</ul>
<p>개인정보 침해에 대한 상담이 필요하면 개인정보침해신고센터(privacy.kisa.or.kr, 국번 없이 118), 개인정보분쟁조정위원회(www.kopico.go.kr, 1833-6972)에 문의할 수 있습니다.</p>

<h2>9. 방침의 변경</h2>
<p>이 방침을 바꾸면 이 페이지에 바뀐 내용과 시행일을 게시합니다.</p>
<p>시행일: ${EFFECTIVE}</p>
`,
      };
    }
    const ga = analytics
      ? `<p>We use <strong>Google Analytics 4</strong> for visitor statistics. It uses cookies (such as <code>_ga</code>) to collect pages visited, approximate location, device and browser type and referral source, processed under Google's policies. The only additional events this site sends are:</p>
<table>
<thead><tr><th>Event</th><th>Values sent</th></tr></thead>
<tbody>
<tr><td><code>file_open</code></td><td>how the file was opened (picker / drag and drop), file size in KB</td></tr>
<tr><td><code>example_load</code></td><td>that the example schematic was opened</td></tr>
<tr><td><code>view_complete</code></td><td>number of pages, nets and parts, analysis time, whether a text layer exists</td></tr>
<tr><td><code>error</code></td><td>error type (not a PDF, password, read failure, no line data, drawing failure)</td></tr>
</tbody>
</table>
<p><strong>File names, file contents and text read from a drawing (references, net names …) are never sent.</strong> To opt out, block cookies in your browser or install Google's <a href="https://tools.google.com/dlpage/gaoptout">Google Analytics opt-out browser add-on</a>.</p>`
      : `<p>The site currently uses no visitor-statistics tool. If one is introduced, what it collects will be published here first, and file names, file contents and text read from drawings will still never be sent.</p>`;
    return {
      title: "Privacy policy",
      description: "Schematic Viewer has no accounts and never uploads your schematic files. What information the site handles, cookies, advertising and your rights.",
      body: `
<p>Schematic Viewer (the "site", https://schematicviewer.com) respects your privacy and follows applicable law, including Korea's Personal Information Protection Act. This policy explains what information the site handles and how.</p>

<h2>1. We do not collect your schematic files</h2>
<ul>
<li>The PDF you open is read and analyzed <strong>only inside your browser</strong>.</li>
<li>The file, its name, its contents and the analysis results are <strong>never sent</strong> to the operator's servers or third parties, <strong>nor stored</strong>. The site has no server program that could receive files.</li>
<li>The file stays in your browser tab's memory and is gone when you open another file, reload or close the tab.</li>
<li>Opening the example schematic downloads the example PDF from this site; nothing of yours is uploaded.</li>
</ul>

<h2>2. Information handled</h2>
<p>There are no accounts, logins or forms, and we do not ask for your name or contact details. The following may be handled:</p>
<table>
<thead><tr><th>Item</th><th>Who handles it and why</th><th>Retention</th></tr></thead>
<tbody>
<tr><td>Access logs (IP address, requested URL, time, browser)</td><td>Recorded automatically by the host, GitHub (GitHub Pages), to provide and secure the service. The operator does not receive or use these logs.</td><td>Per the <a href="https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement">GitHub privacy statement</a></td></tr>
<tr><td>Language setting</td><td>Your chosen language (Korean/English) is kept in your browser's localStorage so it is remembered next time. It is not sent anywhere.</td><td>Until you clear browser data</td></tr>
<tr><td>Visitor statistics</td><td>See section 3</td><td>Per Google's policies</td></tr>
<tr><td>Advertising data</td><td>See section 4</td><td>Per Google's policies</td></tr>
<tr><td>Messages you send (email address, content)</td><td>Used only to reply when you contact us by email or GitHub issues.</td><td>Deleted within one year after the reply (you can delete GitHub issues yourself)</td></tr>
</tbody>
</table>

<h2>3. Visitor statistics</h2>
${ga}

<h2>4. Advertising and cookies</h2>
<p>The site may show <strong>Google AdSense</strong> ads to cover running costs.</p>
<ul>
<li>Third-party vendors, including Google, use cookies to serve ads based on your prior visits to this site or other websites.</li>
<li>Google's use of advertising cookies enables it and its partners to serve ads based on your visits to this site and/or other sites on the Internet.</li>
<li>You can turn off personalized advertising in <a href="https://myadcenter.google.com/">Google My Ad Center</a>, and opt out of other vendors' personalized-advertising cookies at <a href="https://www.aboutads.info/choices/">www.aboutads.info</a>.</li>
<li>How Google uses information from partner sites: <a href="https://policies.google.com/technologies/partner-sites">policies.google.com/technologies/partner-sites</a>.</li>
<li>Visitors in the EEA, the UK and Switzerland are asked for consent before advertising cookies are used, through Google's consent management.</li>
</ul>
<p>Ads have no access to your schematic files, and file contents are never used for advertising.</p>

<h2>5. Refusing cookies</h2>
<p>You can block or delete cookies in your browser settings (for example Chrome: Settings → Privacy and security → Third-party cookies). Viewing schematics keeps working with cookies blocked.</p>

<h2>6. Sharing and processors</h2>
<p>The operator does not provide or sell personal information to third parties. The services named in sections 2–4 (GitHub, Google) process information under their own policies, possibly on servers outside Korea (for example in the United States).</p>

<h2>7. Your rights</h2>
<p>You may ask to access, correct, delete or stop the processing of personal information the operator holds about you (such as your messages). Contact us below and we will act without delay. The site does not knowingly collect personal information from children under 14.</p>

<h2>8. Privacy officer and contact</h2>
<ul>
<li>Privacy officer: the site operator</li>
<li>Contact: ${reach ? reach + ", " : ""}<a href="${href("contact")}">contact page</a>, <a href="${ISSUES}">GitHub issues</a></li>
</ul>

<h2>9. Changes</h2>
<p>If this policy changes, the changes and their effective date will be posted on this page.</p>
<p>Effective: ${EFFECTIVE}</p>
`,
    };
  },
};
