import type { PageDef } from "./index.ts";

export const guide: PageDef = {
  slug: "guide",
  related: ["learn/example", "help/formats", "learn/find-parts", "faq"],
  content: ({ lang, href, tool }) =>
    lang === "ko"
      ? {
          title: "사용법 가이드",
          description: "Schematic Viewer로 회로도 PDF를 열고, 노드를 강조하고, 같은 이름 라벨과 부품을 찾고, 목록을 CSV로 저장하는 방법을 화면 순서대로 설명합니다.",
          body: `
<p>Schematic Viewer는 회로도 PDF 안의 선과 글자를 읽어 <strong>어떤 배선이 서로 이어져 있는지(노드, 넷)</strong>를 추정하고, 그 결과를 원본 도면 위에 겹쳐 보여 주는 무료 웹 도구입니다. 설치나 회원가입 없이 브라우저에서 바로 쓸 수 있고, 파일은 서버로 전송되지 않습니다. 이 글은 처음 쓰는 분을 위해 화면 순서대로 기능을 정리했습니다.</p>

<h2>1. 회로도 PDF 열기</h2>
<p><a href="${tool()}">도구 화면</a>에서 <strong>PDF 파일 선택</strong>을 누르거나, PDF 파일을 화면 아무 곳에나 끌어다 놓으면 분석이 시작됩니다. 이미 도면이 열려 있을 때 다른 PDF를 끌어다 놓으면 현재 도면이 새 도면으로 바뀝니다. 상단의 <strong>다른 PDF 열기</strong> 버튼도 같은 역할을 합니다.</p>
<p>가지고 있는 회로도가 없다면 <a href="${tool("#example")}">예제 회로도</a>로 먼저 기능을 익혀 보세요. Olimex가 공개한 ESP32-PoE 보드 회로도가 열립니다. 예제를 따라 하는 방법은 <a href="${href("learn/example")}">예제로 따라 하기</a>에 단계별로 정리했습니다.</p>
<div class="note"><p>분석은 페이지 수와 도면 복잡도에 따라 몇 초 걸립니다. 분석이 끝나도 원본 도면을 그리는 데 잠시 더 걸릴 수 있는데, 그동안 "도면 그리는 중" 표시가 나옵니다.</p></div>

<h2>2. 화면 구성</h2>
<ul>
<li><strong>상단 줄</strong>: 사이트 로고(누르면 첫 화면), 파일 이름, 여러 장인 PDF의 페이지 번호, 다른 PDF 열기, 언어 선택.</li>
<li><strong>목록</strong>: 검색창, <em>노드</em> 탭(전원과 신호로 나뉜 이름 있는 노드), <em>부품</em> 탭(참조 번호와 값). 노트북·PC와 가로로 든 휴대폰에서는 왼쪽에, 세로로 든 휴대폰에서는 도면 아래 시트로 나옵니다.</li>
<li><strong>도면</strong>: PDF 원본을 그대로 그리고, 그 위에 분석 결과(강조, 검색 표시)만 겹쳐 그립니다. 오른쪽 아래 버튼으로 확대·축소·전체 보기를 할 수 있습니다.</li>
</ul>

<h2>3. 노드 강조하기</h2>
<p>도면에서 배선이나 넷 라벨을 누르면 같은 노드로 분석된 배선 전체가 <strong>청록색</strong>으로 강조되고, 나머지 도면은 흐려집니다. 강조된 부분은 원본 선이 그대로 보이도록 흐림에서 빠집니다. 목록의 <em>노드</em> 탭에서 이름을 눌러도 같은 결과가 나오며, 이때는 노드 전체가 보이도록 화면이 자동으로 맞춰집니다.</p>
<p>목록 아래의 선택 정보에는 배선·접점 수, 노드에 붙은 라벨과 핀 이름, 이 노드가 있는 페이지가 나옵니다. 접기 버튼으로 줄여 두거나 <kbd>Esc</kbd>로 선택을 해제할 수 있습니다.</p>

<h3>같은 이름 라벨을 차례로 찾아가기</h3>
<p>목록에서 <code>+3.3V ×11</code>처럼 숫자가 붙은 노드는 같은 이름 라벨이 도면 여러 곳에 있다는 뜻입니다. 선택한 노드를 목록에서 <strong>한 번 더 누르거나</strong>, 선택 정보의 <strong>라벨 위치 ◀ ▶</strong> 버튼을 누르면 1/11, 2/11 … 순서로 다음 라벨 위치로 이동하고 해당 라벨에 테두리가 깜박입니다. 여러 페이지에 걸친 라벨도 페이지를 넘겨 가며 따라갑니다.</p>

<h2>4. 검색</h2>
<p>검색창에 노드 이름, 핀 이름, 부품 참조 번호, 값 등 도면에 적힌 글자를 입력하면 일치하는 위치가 노란색으로 표시됩니다. 두 글자 이상 입력하고 잠시 기다리면 Enter 없이도 가장 잘 맞는 위치로 화면이 이동합니다. 도면 위쪽 표시줄의 ▲ ▼ 버튼으로 이전·다음 위치로 넘어가고, Enter를 누르면 지금 위치로 다시 이동합니다.</p>
<p>검색은 부분 일치지만 <strong>정확히 일치하는 항목이 항상 먼저</strong> 나옵니다. 예를 들어 <code>R1</code>을 검색하면 R10~R19보다 R1이 먼저 표시되고, 표시줄에 "정확히 일치 1"처럼 정확히 일치하는 개수가 함께 나옵니다. 목록도 같은 순서로 정렬됩니다.</p>

<h2>5. 부품 찾기</h2>
<p><em>부품</em> 탭에는 도면에서 찾은 참조 번호(R1, C3, U2 …)와 근처에 적힌 값이 나옵니다. 부품을 누르면 해당 위치로 이동하고 참조 번호에 테두리가 표시됩니다. 도면에서 참조 번호를 직접 눌러도 됩니다. 부품을 찾는 요령은 <a href="${href("learn/find-parts")}">회로도 PDF에서 부품 찾기</a>에 자세히 정리했습니다.</p>

<h2>6. 목록을 CSV로 저장하기</h2>
<p>목록 위의 <strong>노드 목록 CSV</strong> 또는 <strong>부품 목록 CSV</strong> 버튼을 누르면 현재 탭의 전체 목록이 CSV 파일로 저장됩니다. 노드 목록에는 이름·종류(전원/신호)·라벨 수·페이지가, 부품 목록에는 참조 번호·값·페이지가 들어갑니다. 엑셀에서 바로 열리도록 UTF-8 BOM을 붙이며, <code>+5V</code>처럼 엑셀이 수식으로 읽는 이름은 글자 그대로 보이도록 저장합니다. 파일은 브라우저에서 만들어져 바로 내려받아지며 어디에도 전송되지 않습니다.</p>

<h2>7. 화면 이동과 단축키</h2>
<table>
<thead><tr><th>동작</th><th>마우스·키보드</th><th>터치</th></tr></thead>
<tbody>
<tr><td>확대·축소</td><td>마우스 휠, <kbd>+</kbd> / <kbd>-</kbd>, 트랙패드 핀치</td><td>두 손가락 벌리기·오므리기</td></tr>
<tr><td>이동</td><td>드래그, 방향키</td><td>한 손가락 드래그</td></tr>
<tr><td>그 지점 확대</td><td>더블클릭 (<kbd>Shift</kbd>+더블클릭은 축소)</td><td>두 번 탭</td></tr>
<tr><td>전체 보기</td><td><kbd>0</kbd> 또는 오른쪽 아래 버튼</td><td>오른쪽 아래 버튼</td></tr>
<tr><td>선택·검색 해제</td><td><kbd>Esc</kbd></td><td>선택 정보의 × 버튼</td></tr>
</tbody>
</table>

<h2>8. 휴대폰에서 쓰기</h2>
<p>세로로 든 휴대폰에서는 목록이 도면 아래 한 줄짜리 시트로 접혀 있어 도면을 넓게 볼 수 있습니다. 시트를 누르면 검색창과 목록이 펼쳐지고, 목록에서 항목을 고르면 다시 접힙니다. 노드를 선택하면 시트에 노드 이름과 라벨 이동 버튼이 나옵니다. 휴대폰을 가로로 돌리면 PC처럼 목록이 왼쪽에 나오며, ‹ 버튼으로 접을 수 있습니다.</p>

<h2>9. 결과를 믿어도 될까?</h2>
<p>연결은 PDF에 그려진 모양으로 <strong>추정</strong>한 것입니다. CAD 원본의 넷리스트와 다를 수 있으므로 설계 변경이나 수리처럼 중요한 판단을 하기 전에는 원본 도면과 CAD 자료로 다시 확인해 주세요. 잘 맞지 않는 경우와 해결 방법은 <a href="${href("help/formats")}">지원 형식과 오류 해결</a>에 정리했습니다.</p>
`,
        }
      : {
          title: "User guide",
          description: "How to open a schematic PDF in Schematic Viewer, highlight nets, step through labels with the same name, find parts and export the lists as CSV — screen by screen.",
          body: `
<p>Schematic Viewer is a free web tool that reads the lines and text in a schematic PDF, infers <strong>which wires are connected (nets)</strong>, and overlays the result on the original drawing. It runs in your browser with no installation or account, and your file is never uploaded. This guide walks through the screens in the order you will meet them.</p>

<h2>1. Open a schematic PDF</h2>
<p>In the <a href="${tool()}">tool</a>, choose <strong>Choose PDF</strong> or drop a PDF anywhere on the page to start the analysis. Dropping another PDF while a drawing is open replaces it; the <strong>Open another PDF</strong> button at the top does the same.</p>
<p>No schematic at hand? Start with the <a href="${tool("#example")}">example schematic</a> — the ESP32-PoE board published by Olimex. The <a href="${href("learn/example")}">step-by-step example</a> walks through it.</p>
<div class="note"><p>Analysis takes a few seconds depending on page count and complexity. Drawing the original PDF may take a moment longer; a "Rendering drawing" indicator is shown meanwhile.</p></div>

<h2>2. The screen</h2>
<ul>
<li><strong>Top bar</strong>: site logo (back to the home page), file name, page numbers for multi-page PDFs, Open another PDF, and the language switch.</li>
<li><strong>List</strong>: search box, the <em>Nets</em> tab (named nets split into power and signals) and the <em>Parts</em> tab (references and values). It sits on the left on laptops, desktops and phones held sideways, and as a sheet under the drawing on phones held upright.</li>
<li><strong>Drawing</strong>: the original PDF, with only the analysis (highlights, search hits) drawn on top. Use the buttons at the bottom right to zoom or fit the drawing.</li>
</ul>

<h2>3. Highlight a net</h2>
<p>Click a wire or a net label and every wire identified as part of the same net is highlighted in <strong>cyan</strong> while the rest of the drawing fades. The highlighted part itself is left out of the fading so the original lines stay crisp. Picking a name in the <em>Nets</em> tab does the same and zooms to fit the whole net.</p>
<p>Under the list, the selection panel shows the number of wires and junctions, the labels and pin names on the net, and the pages it appears on. Fold it away with the chevron, or press <kbd>Esc</kbd> to clear the selection.</p>

<h3>Step through labels with the same name</h3>
<p>A net listed as <code>+3.3V ×11</code> has eleven labels with that name. Click the selected net in the list <strong>again</strong>, or use the <strong>Labels ◀ ▶</strong> buttons in the selection panel, to jump to 1/11, 2/11 and so on; the label you land on gets a blinking outline. Labels on other pages are followed across pages.</p>

<h2>4. Search</h2>
<p>Type any text written on the drawing — a net name, pin name, reference or value — and every match is outlined in amber. After two or more characters and a short pause the view moves to the best match without pressing Enter. Use the ▲ ▼ buttons in the bar above the drawing to go to the previous or next match; Enter brings you back to the current one.</p>
<p>Search matches parts of words, but <strong>exact matches always come first</strong>. Searching <code>R1</code> shows R1 before R10–R19, and the bar adds the number of exact matches ("exact 1"). The lists are sorted the same way.</p>

<h2>5. Find parts</h2>
<p>The <em>Parts</em> tab lists the reference designators found on the drawing (R1, C3, U2 …) with the values written next to them. Click one to jump to it with its reference outlined, or click a reference directly in the drawing. See <a href="${href("learn/find-parts")}">Finding parts in a schematic PDF</a> for tips.</p>

<h2>6. Export the lists as CSV</h2>
<p>The <strong>Nets CSV</strong> or <strong>Parts CSV</strong> button above the list saves the whole list of the open tab as a CSV file: name, type (power/signal), label count and pages for nets; reference, value and pages for parts. A UTF-8 byte order mark is added so Excel opens it directly, and names such as <code>+5V</code> that spreadsheets would treat as formulas are written so they show as text. The file is created in your browser and downloaded directly; it is not sent anywhere.</p>

<h2>7. Moving around and shortcuts</h2>
<table>
<thead><tr><th>Action</th><th>Mouse and keyboard</th><th>Touch</th></tr></thead>
<tbody>
<tr><td>Zoom</td><td>Mouse wheel, <kbd>+</kbd> / <kbd>-</kbd>, trackpad pinch</td><td>Pinch with two fingers</td></tr>
<tr><td>Pan</td><td>Drag, arrow keys</td><td>Drag with one finger</td></tr>
<tr><td>Zoom into a spot</td><td>Double-click (<kbd>Shift</kbd>+double-click zooms out)</td><td>Double-tap</td></tr>
<tr><td>Fit drawing</td><td><kbd>0</kbd> or the bottom-right button</td><td>Bottom-right button</td></tr>
<tr><td>Clear selection / search</td><td><kbd>Esc</kbd></td><td>× in the selection panel</td></tr>
</tbody>
</table>

<h2>8. On a phone</h2>
<p>Held upright, the list folds into a one-line sheet under the drawing so the drawing gets most of the screen. Tap the sheet to open the search box and lists; picking an item folds it again. With a net selected, the sheet shows its name and the label buttons. Turn the phone sideways and the list moves to the left like on a computer; fold it with the ‹ button.</p>

<h2>9. Can I trust the result?</h2>
<p>Connections are <strong>inferred</strong> from what is drawn in the PDF and may differ from the netlist in the CAD source. Before a design change or a repair, check against the original drawing and CAD data. Cases that work less well, and what to do about them, are listed in <a href="${href("help/formats")}">Supported files and troubleshooting</a>.</p>
`,
        },
};
