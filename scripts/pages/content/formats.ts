import type { PageDef } from "./index.ts";

export const formats: PageDef = {
  slug: "help/formats",
  related: ["guide", "faq", "learn/read-schematic"],
  content: ({ lang, href }) =>
    lang === "ko"
      ? {
          title: "지원 형식과 오류 해결",
          description: "어떤 회로도 PDF가 잘 분석되는지, 파일이 열리지 않거나 연결이 이상하게 나올 때 무엇을 확인하고 어떻게 다시 내보내면 되는지 정리했습니다.",
          body: `
<h2>잘 분석되는 PDF</h2>
<p>Schematic Viewer는 PDF에 들어 있는 <strong>선(벡터 경로)</strong>과 <strong>글자(텍스트 레이어)</strong>를 읽어 연결을 추정합니다. 따라서 회로도 프로그램에서 PDF로 직접 내보낸 파일이 가장 잘 맞습니다.</p>
<table>
<thead><tr><th>회로도 프로그램</th><th>상태</th><th>참고</th></tr></thead>
<tbody>
<tr><td>KiCad (5~8)</td><td>잘 됨</td><td>컬러로 내보내면 배선 색으로 배선과 부품 선을 구분해 가장 정확합니다.</td></tr>
<tr><td>Altium Designer</td><td>잘 됨</td><td>Smart PDF로 내보내면 PDF 책갈피에 담긴 넷리스트를 읽어 연결을 보정합니다.</td></tr>
<tr><td>Eagle / Fusion 전자</td><td>대부분 됨</td><td>글자를 선으로 그려 내보낸 PDF는 이름 검색이 제한됩니다.</td></tr>
<tr><td>OrCAD Capture</td><td>대부분 됨</td><td>흑백 출력이 많지만, PDF에 들어 있는 링크 정보(넷 라벨·부품 상자)로 라벨과 부품을 구분합니다.</td></tr>
<tr><td>기타 (EasyEDA, 문서용으로 다시 그린 도면 등)</td><td>도면에 따라 다름</td><td>배선이 직선이고 글자가 텍스트로 들어 있으면 대체로 분석됩니다.</td></tr>
</tbody>
</table>
<p>분석이 잘 되는 조건을 정리하면 다음과 같습니다.</p>
<ul>
<li>스캔이나 사진이 아니라 프로그램에서 <strong>PDF로 내보낸 파일</strong>일 것</li>
<li>글자가 선이 아니라 <strong>텍스트로 들어 있을 것</strong> (PDF 뷰어에서 글자를 드래그해 선택할 수 있으면 텍스트입니다)</li>
<li>가능하면 <strong>컬러</strong>로 내보낼 것 (배선 색이 부품 선과 다르면 정확도가 올라갑니다)</li>
<li>암호가 걸려 있지 않을 것</li>
</ul>

<h2>화면에 나오는 안내별 해결 방법</h2>
<h3>"PDF 파일만 열 수 있습니다"</h3>
<p>PDF가 아닌 파일(이미지, 압축 파일, CAD 원본 등)을 선택했습니다. 회로도 프로그램에서 PDF로 내보낸 뒤 그 파일을 열어 주세요. 파일 이름이 <code>.pdf</code>로 끝나는지도 확인해 주세요.</p>
<h3>"암호가 걸린 PDF는 열 수 없습니다"</h3>
<p>열기 암호가 걸린 PDF는 브라우저에서 내용을 읽을 수 없습니다. 암호를 알고 있다면 PDF 뷰어에서 연 뒤 암호 없이 다른 이름으로 저장하거나 인쇄 기능의 "PDF로 저장"을 이용해 사본을 만든 다음 그 사본을 열어 주세요. 사내 문서라면 보안 정책을 먼저 확인해 주세요.</p>
<h3>"이 PDF에서 회로도를 읽지 못했습니다"</h3>
<p>파일이 손상되었거나, 다운로드가 끝나기 전에 연 경우가 많습니다. 원본을 다시 받아 열어 보고, 그래도 안 되면 회로도 프로그램에서 PDF로 다시 내보내 주세요. 매우 오래된 브라우저에서도 생길 수 있으므로 최신 Chrome·Edge·Safari·Firefox를 권장합니다.</p>
<h3>"선과 글자 정보가 없어 연결을 분석할 수 없습니다"</h3>
<p>종이 도면을 스캔했거나 화면을 캡처해 PDF로 만든 파일입니다. 도면은 그대로 볼 수 있지만 선과 글자가 그림이라 연결을 분석할 수 없습니다. 원본 회로도 프로그램에서 PDF로 다시 내보내면 분석할 수 있습니다.</p>

<h2>열리지만 결과가 이상할 때</h2>
<h3>노드 목록이 비어 있거나 이름이 거의 없다</h3>
<p>글자를 텍스트가 아니라 선으로 그려 내보낸 PDF입니다. 이 경우 이름을 읽을 수 없어 노드 목록과 이름 검색이 비어 있지만, 배선을 누르면 연결 강조는 동작합니다. OrCAD로 만든 PDF라면 PDF 속 부품 정보로 부품 목록과 검색은 제공합니다. 회로도 프로그램의 PDF 설정에서 글꼴을 텍스트로 넣는 옵션(예: "TrueType 글꼴 사용", "텍스트를 선으로 변환하지 않음")을 찾아 다시 내보내 보세요.</p>
<h3>서로 다른 노드가 하나로 합쳐져 보인다</h3>
<p>흑백으로 내보낸 PDF는 배선과 부품 선이 같은 색이라, 부품 테두리나 핀 선이 배선으로 잘못 잡힐 수 있습니다. 컬러로 다시 내보내면 대부분 해결됩니다. 특정 도면에서 반복된다면 <a href="${href("contact")}">문의</a>로 알려 주세요. 해당 도면 대신 같은 증상이 나는 공개 예제를 알려 주시면 더 빨리 고칠 수 있습니다.</p>
<h3>같은 이름 라벨 일부가 연결되지 않는다</h3>
<p>라벨이 배선에서 조금 떨어져 있거나 핀 이름과 겹쳐 있으면 라벨로 인식하지 못할 수 있습니다. 검색으로는 모든 위치를 찾을 수 있으므로 이름으로 검색해 확인해 주세요.</p>
<h3>부품 값이 비어 있다</h3>
<p>값 글자가 참조 번호에서 멀리 떨어져 있거나 방향이 다르면 값으로 묶지 못합니다. 부품을 눌러 도면에서 직접 확인해 주세요. 자세한 내용은 <a href="${href("learn/find-parts")}">회로도 PDF에서 부품 찾기</a>를 참고하세요.</p>
<h3>도면이 회색 상자로만 보이거나 흐리다</h3>
<p>도면을 그리는 동안에는 "도면 그리는 중"이 표시됩니다. 계속 그려지지 않으면 브라우저가 PDF 그리기 기능을 지원하지 않는 경우라 분석용 선 그림으로 대신 보여 줍니다. 브라우저를 최신 버전으로 업데이트해 주세요.</p>

<h2>여러 장짜리 도면</h2>
<p>여러 페이지 PDF는 페이지마다 분석하고, 같은 이름의 노드는 목록에서 하나로 묶어 보여 줍니다. 선택한 노드가 있는 페이지는 상단 페이지 번호에 점으로 표시되며, 라벨 이동 버튼으로 페이지를 넘나들며 찾아갈 수 있습니다. 이름 없이 페이지 경계를 넘는 연결(계층 시트 포트 등)은 아직 따라가지 못합니다.</p>
`,
        }
      : {
          title: "Supported files and troubleshooting",
          description: "Which schematic PDFs analyze well, and what to check and how to re-export when a file won't open or the connections look wrong.",
          body: `
<h2>PDFs that work well</h2>
<p>Schematic Viewer reads the <strong>lines (vector paths)</strong> and <strong>text (text layer)</strong> in a PDF to infer connections, so PDFs exported directly from a schematic program work best.</p>
<table>
<thead><tr><th>Schematic program</th><th>Status</th><th>Notes</th></tr></thead>
<tbody>
<tr><td>KiCad (5–8)</td><td>Works well</td><td>Export in colour: the wire colour separates wires from symbol lines and gives the best accuracy.</td></tr>
<tr><td>Altium Designer</td><td>Works well</td><td>Smart PDF exports carry a netlist in the PDF bookmarks, which is used to correct the connections.</td></tr>
<tr><td>Eagle / Fusion Electronics</td><td>Mostly works</td><td>PDFs that draw their lettering as lines limit name search.</td></tr>
<tr><td>OrCAD Capture</td><td>Mostly works</td><td>Often black and white, but the link data inside the PDF (net labels, part boxes) is used to tell labels and parts apart.</td></tr>
<tr><td>Others (EasyEDA, redrawn documentation schematics …)</td><td>Depends on the drawing</td><td>Usually fine when wires are straight lines and text is real text.</td></tr>
</tbody>
</table>
<p>In short, analysis works best when the PDF:</p>
<ul>
<li>was <strong>exported</strong> from a program, not scanned or photographed;</li>
<li>contains its lettering as <strong>text</strong>, not as lines (if you can drag-select words in a PDF reader, it is text);</li>
<li>is in <strong>colour</strong> where possible (wires in a different colour from symbols improve accuracy);</li>
<li>has no password.</li>
</ul>

<h2>What each message means</h2>
<h3>"Only PDF files can be opened"</h3>
<p>The file is not a PDF (an image, an archive, a CAD source file …). Export a PDF from your schematic program and open that, and check that the file name ends in <code>.pdf</code>.</p>
<h3>"Password-protected PDFs can't be opened"</h3>
<p>A browser cannot read a PDF protected with an open password. If you know the password, open it in a PDF reader and save a copy without the password (or use "Print → Save as PDF"), then open the copy. For company documents, check your security policy first.</p>
<h3>"Unable to read this PDF"</h3>
<p>Usually the file is damaged or was opened before its download finished. Download the original again; if that fails, export the PDF again from your schematic program. Very old browsers can also cause this — a current Chrome, Edge, Safari or Firefox is recommended.</p>
<h3>"This PDF has no line or text data"</h3>
<p>The PDF is a scan or a screenshot saved as PDF. You can still view the drawing, but its lines and letters are pictures, so the connections can't be analyzed. Export the PDF again from the original schematic program.</p>

<h2>It opens, but the result looks wrong</h2>
<h3>The net list is empty or has few names</h3>
<p>The PDF draws its lettering as lines instead of text. Names can't be read, so the net list and name search stay empty, but clicking a wire still highlights its connections. For OrCAD PDFs, the part data inside the PDF still provides the parts list and part search. Look for an export option that keeps fonts as text (for example "use TrueType fonts" or "don't convert text to outlines") and export again.</p>
<h3>Different nets appear merged</h3>
<p>In black-and-white PDFs wires and symbols share one colour, so a part outline or a pin line can be mistaken for a wire. Exporting in colour fixes most cases. If it keeps happening with a drawing, tell us through the <a href="${href("contact")}">contact page</a> — a public example showing the same problem helps us fix it faster than a private drawing.</p>
<h3>Some labels with the same name are not connected</h3>
<p>A label slightly away from its wire, or overlapping a pin name, may not be recognized as a label. Search still finds every occurrence, so search for the name to check.</p>
<h3>A part has no value</h3>
<p>Values written far from the reference or in a different direction may not be grouped with it. Click the part and check the drawing. See <a href="${href("learn/find-parts")}">Finding parts in a schematic PDF</a>.</p>
<h3>The drawing stays grey or looks rough</h3>
<p>"Rendering drawing" is shown while the PDF is being drawn. If it never appears, the browser cannot draw the PDF and an outline drawing from the analysis is shown instead. Please update your browser.</p>

<h2>Multi-page schematics</h2>
<p>Each page is analyzed on its own, and nets with the same name are combined in the list. Pages containing the selected net are marked with a dot on the page numbers, and the label buttons move across pages. Connections that cross pages without a name (hierarchical sheet ports, for example) are not followed yet.</p>
`,
        },
};
