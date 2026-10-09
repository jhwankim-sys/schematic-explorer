import type { PageDef } from "./index.ts";

const EFFECTIVE = "2026-10-09";

export const terms: PageDef = {
  slug: "terms",
  cta: false,
  related: ["privacy", "faq", "contact"],
  content: ({ lang, href, analytics }) =>
    lang === "ko"
      ? {
          title: "이용약관 및 파일 처리 정책",
          description: "Schematic Viewer 이용 조건과, 이용자가 여는 회로도 파일이 어디서 처리되고 언제 사라지며 무엇이 기록되는지를 사실대로 정리한 파일 처리 정책입니다.",
          body: `
<h2>파일 처리 정책</h2>
<p>회로도 파일은 민감한 자료인 경우가 많으므로, 파일이 어떻게 다뤄지는지를 먼저 밝힙니다.</p>
<table>
<thead><tr><th>항목</th><th>내용</th></tr></thead>
<tbody>
<tr><td>업로드 여부</td><td><strong>업로드하지 않습니다.</strong> 파일은 이용자의 브라우저 안에서 PDF.js로 읽고 분석합니다. 사이트에는 파일을 받는 서버가 없습니다.</td></tr>
<tr><td>저장 위치</td><td>열려 있는 브라우저 탭의 메모리에만 있습니다. 서버, 브라우저 저장소(localStorage, IndexedDB 등), 쿠키에 파일이나 분석 결과를 저장하지 않습니다.</td></tr>
<tr><td>삭제 시점</td><td>다른 PDF를 열거나, 페이지를 새로 고치거나, 탭·브라우저를 닫으면 메모리에서 사라집니다. 운영자가 따로 지울 사본은 존재하지 않습니다.</td></tr>
<tr><td>기록(로그)</td><td>운영자는 파일 이름·내용·분석 결과를 기록하지 않습니다. 호스팅 사업자(GitHub Pages)는 페이지 요청에 대한 접속 기록(IP, 주소, 시간, 브라우저)을 남길 수 있으나 파일은 요청에 포함되지 않습니다.${analytics ? " 방문 통계(Google Analytics)에는 파일 크기, 페이지·노드·부품 수, 분석 시간, 오류 종류 같은 수치만 전송됩니다." : ""} 자세한 내용은 <a href="${href("privacy")}">개인정보처리방침</a>을 참고하세요.</td></tr>
<tr><td>내보낸 파일</td><td>CSV 저장 기능은 이용자의 기기에서 파일을 만들어 바로 내려받게 합니다. 서버를 거치지 않습니다.</td></tr>
<tr><td>예제 파일</td><td>예제 회로도는 Olimex Ltd.가 Apache License 2.0으로 공개한 ESP32-PoE 회로도이며, 원본 그대로 이 사이트에서 제공합니다. 라이선스와 고지문은 사이트의 <code>/examples/</code> 폴더에 함께 있습니다. Olimex는 이 사이트와 관계가 없습니다.</td></tr>
</tbody>
</table>

<h2>이용약관</h2>
<h3>제1조 (목적)</h3>
<p>이 약관은 Schematic Viewer(이하 "사이트")가 제공하는 회로도 PDF 보기 도구와 관련 글(이하 "서비스")의 이용 조건을 정합니다. 서비스를 이용하면 이 약관에 동의한 것으로 봅니다.</p>
<h3>제2조 (서비스)</h3>
<ol>
<li>서비스는 무료이며 회원 가입 없이 이용할 수 있습니다.</li>
<li>운영자는 서비스의 내용을 개선하거나 바꿀 수 있으며, 운영상·기술상 필요한 경우 서비스의 전부 또는 일부를 중단할 수 있습니다.</li>
<li>사이트에는 광고가 게재될 수 있습니다.</li>
</ol>
<h3>제3조 (분석 결과의 성격)</h3>
<ol>
<li>서비스는 PDF에 그려진 선과 글자로부터 연결 관계를 <strong>추정</strong>합니다. 원본 설계 데이터(넷리스트)를 읽는 것이 아니므로 결과가 틀리거나 빠질 수 있습니다.</li>
<li>서비스의 결과는 검토와 탐색을 돕기 위한 참고 자료입니다. 제작, 수리, 안전과 관련된 판단은 원본 설계 자료와 데이터시트로 확인해야 합니다.</li>
<li>사이트의 글은 일반적인 정보 제공을 위한 것이며, 특정 제품이나 회로에 대한 전문적 조언이 아닙니다.</li>
</ol>
<h3>제4조 (이용자의 책임)</h3>
<ol>
<li>이용자는 자신이 열람할 권한이 있는 파일만 서비스로 열어야 합니다. 회사 도면 등은 소속 기관의 보안 규정을 따라야 합니다.</li>
<li>이용자는 서비스를 비정상적인 방법으로 공격하거나, 운영을 방해하거나, 법령에 어긋나는 목적으로 이용해서는 안 됩니다.</li>
</ol>
<h3>제5조 (지식재산권)</h3>
<ol>
<li>이용자가 여는 파일과 그 내용에 대한 권리는 이용자 또는 원래의 권리자에게 있으며, 사이트는 어떠한 권리도 갖지 않습니다.</li>
<li>사이트의 글, 디자인과 소스 코드에 대한 권리는 운영자에게 있습니다. 사이트에 쓰인 오픈소스 소프트웨어와 예제 파일은 각자의 라이선스를 따릅니다.</li>
</ol>
<h3>제6조 (책임의 제한)</h3>
<ol>
<li>서비스는 "있는 그대로" 제공되며, 운영자는 서비스가 특정 목적에 맞거나 오류가 없음을 보증하지 않습니다.</li>
<li>운영자는 고의 또는 중대한 과실이 없는 한, 서비스의 이용이나 분석 결과를 신뢰해 생긴 손해에 대해 책임을 지지 않습니다. 다만 관련 법령상 책임을 제한할 수 없는 경우에는 그에 따릅니다.</li>
<li>서비스는 무료로 제공되며 파일을 보관하지 않으므로, 파일 손실에 대해 운영자가 복구할 수 있는 사본은 없습니다. 원본 파일은 이용자가 보관해야 합니다.</li>
</ol>
<h3>제7조 (약관의 변경)</h3>
<p>운영자는 필요한 경우 이 약관을 바꿀 수 있으며, 바뀐 약관은 시행일과 함께 이 페이지에 게시합니다.</p>
<h3>제8조 (준거법)</h3>
<p>이 약관은 대한민국 법률에 따라 해석됩니다. 문의는 <a href="${href("contact")}">문의 페이지</a>로 보내 주세요.</p>
<p>시행일: ${EFFECTIVE}</p>
`,
        }
      : {
          title: "Terms of use and file-handling policy",
          description: "The conditions for using Schematic Viewer, and a factual account of where the schematic files you open are processed, when they disappear and what is logged.",
          body: `
<h2>File-handling policy</h2>
<p>Schematics are often sensitive, so here first is exactly how your files are handled.</p>
<table>
<thead><tr><th>Item</th><th>What happens</th></tr></thead>
<tbody>
<tr><td>Upload</td><td><strong>None.</strong> Files are read and analyzed in your browser with PDF.js. The site has no server that receives files.</td></tr>
<tr><td>Where it is kept</td><td>Only in the memory of the open browser tab. Neither the file nor the analysis is saved on a server, in browser storage (localStorage, IndexedDB …) or in cookies.</td></tr>
<tr><td>When it is deleted</td><td>When you open another PDF, reload the page, or close the tab or browser. There is no copy for the operator to delete.</td></tr>
<tr><td>Logs</td><td>The operator logs no file names, contents or analysis results. The host (GitHub Pages) may keep access logs of page requests (IP, URL, time, browser), but files are not part of any request.${analytics ? " Visitor statistics (Google Analytics) receive only numbers such as file size, page/net/part counts, analysis time and error type." : ""} See the <a href="${href("privacy")}">privacy policy</a>.</td></tr>
<tr><td>Exported files</td><td>CSV exports are created on your device and downloaded directly, without passing through a server.</td></tr>
<tr><td>Example file</td><td>The example is the ESP32-PoE schematic published by Olimex Ltd. under the Apache License 2.0, served unmodified. Its licence and notice are in the site's <code>/examples/</code> folder. Olimex is not affiliated with this site.</td></tr>
</tbody>
</table>

<h2>Terms of use</h2>
<h3>1. Purpose</h3>
<p>These terms set the conditions for using the schematic PDF viewer and related articles (the "service") provided by Schematic Viewer (the "site"). By using the service you agree to them.</p>
<h3>2. The service</h3>
<ol>
<li>The service is free and needs no account.</li>
<li>The operator may improve or change the service, and may suspend all or part of it when operationally or technically necessary.</li>
<li>Ads may be shown on the site.</li>
</ol>
<h3>3. Nature of the results</h3>
<ol>
<li>The service <strong>infers</strong> connections from the lines and text drawn in a PDF. It does not read the original design data (netlist), so results may be wrong or incomplete.</li>
<li>Results are a reference to help review and exploration. Decisions about production, repair or safety must be checked against the original design files and datasheets.</li>
<li>Articles on the site are general information, not professional advice about any particular product or circuit.</li>
</ol>
<h3>4. Your responsibilities</h3>
<ol>
<li>Only open files you are entitled to view. For company drawings, follow your organization's security rules.</li>
<li>Do not attack or disrupt the service or use it for unlawful purposes.</li>
</ol>
<h3>5. Intellectual property</h3>
<ol>
<li>Rights in the files you open and their contents remain with you or their original owners; the site claims none.</li>
<li>Rights in the site's articles, design and source code belong to the operator. Open-source software used by the site and the example file are governed by their own licences.</li>
</ol>
<h3>6. Limitation of liability</h3>
<ol>
<li>The service is provided "as is" without warranty of fitness for a particular purpose or freedom from errors.</li>
<li>Except for intent or gross negligence, the operator is not liable for loss arising from using the service or relying on its results, to the extent permitted by law.</li>
<li>Because the service is free and keeps no files, the operator has no copy from which to recover a lost file. Keep your own originals.</li>
</ol>
<h3>7. Changes</h3>
<p>The operator may change these terms when needed; changes are posted on this page with their effective date.</p>
<h3>8. Governing law</h3>
<p>These terms are governed by the laws of the Republic of Korea. Questions go to the <a href="${href("contact")}">contact page</a>.</p>
<p>Effective: ${EFFECTIVE}</p>
`,
        },
};
