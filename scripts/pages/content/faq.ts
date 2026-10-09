import type { PageDef } from "./index.ts";

export const faq: PageDef = {
  slug: "faq",
  related: ["guide", "help/formats", "privacy"],
  content: ({ lang, href, tool }) =>
    lang === "ko"
      ? {
          title: "자주 묻는 질문",
          description: "파일이 어디에 저장되는지, 비용, 지원 브라우저와 휴대폰 사용, 스캔 도면, 분석 정확도, 회로도 수정 가능 여부 등 Schematic Viewer에 대해 자주 받는 질문을 모았습니다.",
          body: `
<h2>파일과 보안</h2>
<h3>회로도 파일이 서버로 올라가나요?</h3>
<p>아니요. 선택한 PDF는 브라우저 안에서만 읽고 분석하며, 서버로 전송하거나 저장하지 않습니다. 파일 내용, 파일 이름, 분석 결과도 기록하지 않습니다. 브라우저 개발자 도구의 네트워크 탭을 열어 두고 파일을 열어 보면 파일이 전송되지 않는 것을 직접 확인할 수 있습니다. 자세한 내용은 <a href="${href("privacy")}">개인정보처리방침</a>과 <a href="${href("terms")}">이용약관의 파일 처리 정책</a>에 있습니다.</p>
<h3>열었던 파일은 언제 지워지나요?</h3>
<p>파일은 브라우저 탭의 메모리에만 있습니다. 다른 PDF를 열거나, 페이지를 새로 고치거나, 탭을 닫으면 사라집니다. 브라우저 저장소에 파일을 남기지 않습니다.</p>
<h3>회사 기밀 회로도를 열어도 되나요?</h3>
<p>파일이 외부로 나가지 않으므로 기술적으로는 안전하게 볼 수 있습니다. 다만 외부 웹 도구 사용에 대한 회사 보안 규정이 있다면 그것을 먼저 따라 주세요. 오류를 알려 주실 때는 기밀 도면을 보내지 마시고, 같은 증상이 나는 공개 도면이나 현상 설명으로 알려 주세요.</p>

<h2>사용 환경</h2>
<h3>요금이 있나요? 가입해야 하나요?</h3>
<p>무료이며 가입이나 로그인이 필요 없습니다. 사이트 운영을 위해 페이지에 광고가 표시될 수 있습니다.</p>
<h3>어떤 브라우저에서 되나요?</h3>
<p>최신 Chrome, Edge, Safari, Firefox에서 동작합니다. 설치할 프로그램은 없습니다. 오래된 브라우저에서는 PDF를 읽지 못하거나 도면이 그려지지 않을 수 있습니다.</p>
<h3>휴대폰에서도 쓸 수 있나요?</h3>
<p>네. 두 손가락으로 확대·축소하고, 한 손가락으로 끌어 이동합니다. 세로 화면에서는 목록이 아래쪽 패널로, 가로 화면에서는 옆 패널로 바뀝니다. 다만 큰 도면은 화면이 넓은 컴퓨터에서 보는 편이 편합니다. 휴대폰 사용법은 <a href="${href("guide")}">사용법</a>의 "휴대폰에서 쓰기"를 참고하세요.</p>
<h3>큰 파일도 열리나요?</h3>
<p>파일 크기 제한은 따로 두지 않았습니다. 다만 모든 처리를 내 기기에서 하므로 페이지가 많거나 복잡한 도면은 분석에 시간이 걸리고, 메모리가 적은 휴대폰에서는 느려질 수 있습니다.</p>

<h2>분석 결과</h2>
<h3>스캔한 도면도 분석되나요?</h3>
<p>도면은 볼 수 있지만 연결 분석은 되지 않습니다. 스캔본은 선과 글자가 하나의 그림이라 읽을 수 있는 정보가 없기 때문입니다. 회로도 프로그램에서 PDF로 직접 내보낸 파일을 사용해 주세요(<a href="${href("help/formats")}">지원 형식</a>).</p>
<h3>분석 결과가 항상 정확한가요?</h3>
<p>아니요. Schematic Viewer는 PDF에 그려진 선과 글자를 보고 연결을 <em>추정</em>합니다. 원본 회로도 파일(넷리스트)을 읽는 것이 아니므로, 부품 테두리를 배선으로 잘못 보거나 라벨 일부를 놓칠 수 있습니다. 검토와 탐색을 돕는 도구로 쓰시고, 제작·수리처럼 중요한 판단은 원본 도면과 CAD의 넷리스트로 확인해 주세요.</p>
<h3>같은 이름 라벨이 연결되어 있는데 왜 따로 나오나요?</h3>
<p>라벨이 배선에서 떨어져 있거나 다른 글자와 겹치면 라벨로 인식하지 못할 수 있습니다. 이름으로 검색하면 모든 위치를 찾을 수 있습니다. 반복되는 문제라면 <a href="${href("contact")}">문의</a>로 알려 주세요.</p>
<h3>"노드"는 무엇인가요?</h3>
<p>전기적으로 연결된 배선과 핀의 묶음입니다. 영어로는 넷(net)이라고 합니다. 라벨이 있는 노드는 목록에 라벨 이름으로 나오고, 라벨이 없는 노드는 도면에서 배선을 눌러 확인할 수 있습니다. 회로도 기호가 낯설다면 <a href="${href("learn/read-schematic")}">회로도 읽는 법 기초</a>를 보세요.</p>

<h2>기능</h2>
<h3>회로도를 수정하거나 메모를 남길 수 있나요?</h3>
<p>아니요. Schematic Viewer는 보기 전용입니다. 대신 노드 목록과 부품 목록을 CSV로 저장해 엑셀 등에서 정리할 수 있습니다.</p>
<h3>KiCad, Altium 원본 파일을 바로 열 수 있나요?</h3>
<p>현재는 PDF만 엽니다. 회로도 프로그램에서 PDF로 내보낸 뒤 열어 주세요.</p>
<h3>영어로도 쓸 수 있나요?</h3>
<p>네. 화면 위쪽의 언어 버튼(한국어 / EN)으로 한국어와 영어를 바꿀 수 있고, 선택한 언어는 다음 방문 때도 유지됩니다.</p>
<h3>먼저 체험해 볼 수 있나요?</h3>
<p><a href="${tool("#example")}">예제 회로도</a>를 바로 열어 볼 수 있습니다. 따라 하기 안내는 <a href="${href("learn/example")}">예제로 따라 하기</a>에 있습니다.</p>
`,
        }
      : {
          title: "Frequently asked questions",
          description: "Where your file goes, cost, supported browsers and phones, scanned drawings, analysis accuracy, editing and more — common questions about Schematic Viewer.",
          body: `
<h2>Files and security</h2>
<h3>Is my schematic uploaded to a server?</h3>
<p>No. The PDF you choose is read and analyzed only inside your browser; it is never sent to or stored on a server. Neither the file's contents, its name nor the analysis results are logged. You can confirm this yourself by watching the Network tab of your browser's developer tools while opening a file. Details are in the <a href="${href("privacy")}">privacy policy</a> and the <a href="${href("terms")}">file-handling policy in the terms of use</a>.</p>
<h3>When is an opened file deleted?</h3>
<p>It lives only in the memory of your browser tab and is gone when you open another PDF, reload the page or close the tab. Nothing is kept in browser storage.</p>
<h3>Can I open confidential company schematics?</h3>
<p>Because the file never leaves your device, viewing is technically safe. If your company has rules about external web tools, follow them first. When reporting a problem, please don't send confidential drawings — describe the symptom or share a public drawing that shows it.</p>

<h2>Requirements</h2>
<h3>Does it cost anything? Do I need an account?</h3>
<p>It is free and needs no sign-up or login. Ads may be shown on the site to cover running costs.</p>
<h3>Which browsers are supported?</h3>
<p>Current versions of Chrome, Edge, Safari and Firefox. Nothing to install. Very old browsers may fail to read the PDF or draw it.</p>
<h3>Does it work on a phone?</h3>
<p>Yes. Pinch with two fingers to zoom and drag with one to pan. In portrait the list becomes a bottom panel, in landscape a side panel. Large drawings are still easier on a wide screen. See "On a phone" in the <a href="${href("guide")}">guide</a>.</p>
<h3>Can it open large files?</h3>
<p>There is no set size limit, but everything runs on your device, so long or complex schematics take longer to analyze and can be slow on phones with little memory.</p>

<h2>Analysis results</h2>
<h3>Can scanned drawings be analyzed?</h3>
<p>You can view them, but connections can't be analyzed: in a scan, lines and letters are one picture with nothing to read. Use a PDF exported from the schematic program (see <a href="${href("help/formats")}">Supported files</a>).</p>
<h3>Are the results always correct?</h3>
<p>No. Schematic Viewer <em>infers</em> connections from the lines and text drawn in the PDF; it does not read the original design's netlist. It can mistake a part outline for a wire or miss a label. Use it to review and explore, and confirm important decisions — production or repair — against the original design files and the CAD netlist.</p>
<h3>Why do labels with the same name show up separately?</h3>
<p>A label away from its wire or overlapping other text may not be recognized. Searching for the name still finds every occurrence. If it keeps happening, let us know via the <a href="${href("contact")}">contact page</a>.</p>
<h3>What is a "net"?</h3>
<p>A group of wires and pins that are electrically connected. Labelled nets are listed by name; unlabelled ones can be inspected by clicking their wires on the drawing. If the symbols are new to you, see <a href="${href("learn/read-schematic")}">Reading schematics</a>.</p>

<h2>Features</h2>
<h3>Can I edit the schematic or add notes?</h3>
<p>No — Schematic Viewer is view-only. You can save the net and part lists as CSV and work with them in a spreadsheet.</p>
<h3>Can it open KiCad or Altium source files?</h3>
<p>Only PDFs for now. Export a PDF from your schematic program first.</p>
<h3>Is it available in English?</h3>
<p>Yes. Switch between Korean and English with the language buttons (한국어 / EN) at the top; your choice is remembered for next time.</p>
<h3>Can I try it first?</h3>
<p>Open the <a href="${tool("#example")}">example schematic</a> right away, and follow along with the <a href="${href("learn/example")}">step-by-step example</a>.</p>
`,
        },
};
