import type { PageDef } from "./index.ts";

export const findParts: PageDef = {
  slug: "learn/find-parts",
  related: ["learn/read-schematic", "guide", "learn/example"],
  content: ({ lang, href }) =>
    lang === "ko"
      ? {
          title: "회로도 PDF에서 부품 찾는 법",
          description: "참조 번호(R1, C3, U2)의 뜻, 값 표기(4k7, 104, 10uF/16V) 읽는 법, 여러 기능으로 나뉜 부품, 그리고 Schematic Viewer로 부품을 찾고 목록으로 정리하는 방법을 설명합니다.",
          body: `
<p>수리나 검토를 하다 보면 "C37이 도면 어디에 있지?", "이 보드에 10k 저항이 몇 개지?" 같은 질문이 자주 생깁니다. PDF 뷰어의 Ctrl+F로도 찾을 수는 있지만, 참조 번호 규칙과 값 표기를 알고 있으면 훨씬 빨라집니다.</p>

<h2>참조 번호(Reference Designator) 읽기</h2>
<p>회로도의 모든 부품에는 <strong>종류를 뜻하는 글자 + 번호</strong>로 된 참조 번호가 붙습니다. 이 번호는 PCB 실크 인쇄와 부품 목록(BOM)에도 그대로 쓰이므로, 도면·보드·BOM을 잇는 열쇠입니다. 자주 쓰는 접두어는 다음과 같습니다(회사나 CAD에 따라 조금씩 다릅니다).</p>
<table>
<thead><tr><th>접두어</th><th>부품</th><th>접두어</th><th>부품</th></tr></thead>
<tbody>
<tr><td>R</td><td>저항</td><td>U, IC</td><td>집적회로(IC)</td></tr>
<tr><td>C</td><td>콘덴서(커패시터)</td><td>Q</td><td>트랜지스터, MOSFET</td></tr>
<tr><td>L</td><td>인덕터, 코일</td><td>D, LED</td><td>다이오드, LED</td></tr>
<tr><td>FB, BEAD</td><td>페라이트 비드</td><td>J, P, CN, CON</td><td>커넥터</td></tr>
<tr><td>Y, X</td><td>크리스털, 발진기</td><td>SW, S, BUT</td><td>스위치, 버튼</td></tr>
<tr><td>F</td><td>퓨즈</td><td>T, TR</td><td>변압기</td></tr>
<tr><td>TP</td><td>테스트 포인트</td><td>JP</td><td>점퍼</td></tr>
</tbody>
</table>
<p>번호는 보통 도면에서 왼쪽 위부터 차례로 붙지만, 블록별로 100 단위로 나누는 경우도 많습니다(전원부 C101~, 통신부 C201~ 등). 번호대를 보면 부품이 어느 블록에 있는지 짐작할 수 있습니다.</p>

<h3>여러 기능으로 나뉜 부품</h3>
<p>연산증폭기 두 개가 들어 있는 LM358처럼 한 칩에 같은 기능이 여러 개 있으면, 도면에서는 <code>U4A</code>, <code>U4B</code>처럼 뒤에 글자를 붙여 따로 그립니다. 전원 핀만 따로 <code>U4C</code>로 그리기도 합니다. Schematic Viewer는 이런 조각을 하나의 부품 <code>U4</code>로 묶어 목록에 보여 줍니다.</p>

<h2>값 표기 읽기</h2>
<ul>
<li><strong>저항</strong>: <code>4k7</code>은 4.7kΩ, <code>1M</code>은 1MΩ, <code>0R</code>은 0Ω(점퍼용)입니다. 소수점 대신 단위 글자를 쓰는 표기는 인쇄가 번져도 읽기 쉽도록 쓰입니다. 뒤에 <code>/R0402</code>처럼 크기(패키지)를 붙이기도 합니다.</li>
<li><strong>콘덴서</strong>: <code>104</code>처럼 숫자 세 개면 앞 두 자리 × 10의 (셋째 자리)승 pF입니다. 104 = 10 × 10⁴ pF = 100nF = 0.1µF. <code>10uF/16V</code>처럼 정격 전압을 함께 쓰는 경우가 많습니다.</li>
<li><strong>허용오차·재질</strong>: <code>1%</code>, <code>X5R</code>, <code>C0G</code>처럼 정밀도와 유전체 종류가 붙습니다. 교체할 때는 값뿐 아니라 이 항목과 크기도 맞춰야 합니다.</li>
<li><strong>DNP / NC</strong>: "Do Not Populate", "No Connect"의 줄임으로, 기판에 실장하지 않는 자리입니다.</li>
</ul>

<h2>Schematic Viewer로 찾기</h2>
<ol class="steps">
<li><strong>참조 번호로</strong>: 검색창에 <code>C37</code>을 입력합니다. 정확히 일치하는 C37이 C370 같은 비슷한 이름보다 먼저 나오고, Enter 없이 그 위치로 이동합니다. <em>부품</em> 탭에서 C37을 눌러도 됩니다.</li>
<li><strong>값으로</strong>: <code>10k</code>나 <code>104</code>처럼 값을 검색하면 그 값이 적힌 모든 위치가 표시됩니다. 표시줄의 개수를 보면 같은 값 부품이 몇 개인지 대략 알 수 있습니다.</li>
<li><strong>도면에서</strong>: 도면의 참조 번호 글자를 누르면 그 부품이 선택되고, 목록이 <em>부품</em> 탭으로 바뀝니다.</li>
<li><strong>목록으로 정리</strong>: <em>부품</em> 탭의 <strong>부품 목록 CSV</strong>로 참조 번호·값·페이지를 저장한 뒤, 엑셀에서 값으로 정렬하면 간이 BOM이 됩니다.</li>
</ol>

<h2>값이 비어 있거나 다를 때</h2>
<p>Schematic Viewer는 참조 번호 근처에 같은 방향으로 적힌 값 글자를 묶습니다. 값이 참조 번호에서 멀리 있거나, 방향이 다르거나, 여러 줄로 나뉘어 있으면 묶지 못해 비어 있을 수 있습니다. 이때는 부품을 눌러 도면에서 직접 확인해 주세요. OrCAD로 만든 PDF처럼 부품 정보가 PDF 안에 들어 있는 경우에는 그 정보를 우선 사용합니다.</p>
<p>CSV로 만든 목록은 도면에서 읽은 결과이므로 정식 BOM을 대신하지는 않습니다. 발주나 생산에는 CAD에서 출력한 BOM을 사용하고, 이 목록은 도면 검토와 대조용으로 활용하세요. 기호 자체가 낯설다면 <a href="${href("learn/read-schematic")}">회로도·데이터시트 읽는 법 기초</a>를 함께 보세요.</p>
`,
        }
      : {
          title: "Finding parts in a schematic PDF",
          description: "What reference designators (R1, C3, U2) mean, how to read value notation (4k7, 104, 10uF/16V), multi-unit parts, and how to find parts and turn them into a list with Schematic Viewer.",
          body: `
<p>Repairs and reviews constantly raise questions like "where is C37 on this drawing?" or "how many 10k resistors are on this board?". Ctrl+F in a PDF reader gets you part of the way; knowing the naming rules and value notation gets you there much faster.</p>

<h2>Reading reference designators</h2>
<p>Every part on a schematic carries a <strong>letter prefix for its type plus a number</strong>. The same reference appears on the PCB silkscreen and in the bill of materials (BOM), so it is the key that ties drawing, board and BOM together. Common prefixes (they vary a little between companies and CAD tools):</p>
<table>
<thead><tr><th>Prefix</th><th>Part</th><th>Prefix</th><th>Part</th></tr></thead>
<tbody>
<tr><td>R</td><td>Resistor</td><td>U, IC</td><td>Integrated circuit</td></tr>
<tr><td>C</td><td>Capacitor</td><td>Q</td><td>Transistor, MOSFET</td></tr>
<tr><td>L</td><td>Inductor</td><td>D, LED</td><td>Diode, LED</td></tr>
<tr><td>FB, BEAD</td><td>Ferrite bead</td><td>J, P, CN, CON</td><td>Connector</td></tr>
<tr><td>Y, X</td><td>Crystal, oscillator</td><td>SW, S, BUT</td><td>Switch, button</td></tr>
<tr><td>F</td><td>Fuse</td><td>T, TR</td><td>Transformer</td></tr>
<tr><td>TP</td><td>Test point</td><td>JP</td><td>Jumper</td></tr>
</tbody>
</table>
<p>Numbers usually run from the top left of the sheet, but many designs reserve a hundred per block (C101… for the power supply, C201… for communications). The number range tells you roughly which block a part is in.</p>

<h3>Multi-unit parts</h3>
<p>When one chip holds several identical functions — the LM358 has two op-amps — each is drawn separately with a suffix: <code>U4A</code>, <code>U4B</code>, sometimes <code>U4C</code> for the power pins. Schematic Viewer groups these units into one part, <code>U4</code>, in the list.</p>

<h2>Reading values</h2>
<ul>
<li><strong>Resistors</strong>: <code>4k7</code> is 4.7 kΩ, <code>1M</code> is 1 MΩ, <code>0R</code> is 0 Ω (a jumper). Using the unit letter as the decimal point keeps values legible when print smudges. A size is often appended, as in <code>/R0402</code>.</li>
<li><strong>Capacitors</strong>: three digits such as <code>104</code> mean the first two digits × 10 to the power of the third, in pF: 104 = 10 × 10⁴ pF = 100 nF = 0.1 µF. Voltage ratings are often added, as in <code>10uF/16V</code>.</li>
<li><strong>Tolerance and dielectric</strong>: <code>1%</code>, <code>X5R</code>, <code>C0G</code> and the like. When replacing a part, match these and the package size, not just the value.</li>
<li><strong>DNP / NC</strong>: "do not populate" / "no connect" — a footprint left empty on the board.</li>
</ul>

<h2>Finding them with Schematic Viewer</h2>
<ol class="steps">
<li><strong>By reference</strong>: type <code>C37</code>. The exact C37 comes before look-alikes such as C370, and the view jumps there without pressing Enter. Or pick C37 in the <em>Parts</em> tab.</li>
<li><strong>By value</strong>: search <code>10k</code> or <code>104</code> to mark every place that value is written; the count in the search bar gives a rough number of parts with that value.</li>
<li><strong>On the drawing</strong>: click a reference on the drawing to select the part; the list switches to the <em>Parts</em> tab.</li>
<li><strong>As a list</strong>: save references, values and pages with <strong>Parts CSV</strong>, then sort by value in a spreadsheet for a quick BOM.</li>
</ol>

<h2>When a value is missing or different</h2>
<p>Schematic Viewer groups value text written near a reference in the same direction. A value far from its reference, rotated differently or split over lines may not be grouped and is left empty; click the part and check the drawing. When the PDF itself carries part data — as OrCAD PDFs do — that data is used first.</p>
<p>A CSV made this way reflects what is drawn, so it does not replace the official BOM. Use the CAD-generated BOM for purchasing and production, and this list for reviewing and cross-checking. If the symbols themselves are new to you, see <a href="${href("learn/read-schematic")}">Reading schematics and datasheets</a>.</p>
`,
        },
};
