import type { PageDef } from "./index.ts";

export const findParts: PageDef = {
  slug: "learn/find-parts",
  updated: "2026-11-12",
  related: ["learn/read-schematic", "guide", "learn/example"],
  content: ({ lang, href, tool }) =>
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
<li><strong>DNP와 NC는 뜻이 다릅니다</strong>: <code>DNP</code>(Do Not Populate. <code>DNF</code>, <code>NF</code>, <code>NM</code>으로도 씀)는 <em>부품을 실장하지 않는 자리</em>라는 표시로, 보통 부품 값 칸이나 별도 기호로 붙습니다. <code>NC</code>(No Connect)는 <em>핀을 일부러 아무 데도 연결하지 않았다</em>는 뜻으로, 핀 끝의 ✕ 표시나 이름이 <code>NC</code>인 핀으로 나타납니다. 다만 부품 값 자리에 <code>NC</code>를 써서 미실장을 나타내는 제조사도 있으므로, 어느 뜻인지는 그 도면의 범례·주석, 제조사의 표기 관례, 실장 여부가 적힌 BOM(부품표)으로 확인하세요.</li>
</ul>

<h2>Schematic Viewer로 찾기</h2>
<ol class="steps">
<li><strong>참조 번호로</strong>: 검색창에 <code>C37</code>을 입력합니다. 정확히 일치하는 C37이 C370 같은 비슷한 이름보다 먼저 나오고, Enter 없이 그 위치로 이동합니다. <em>부품</em> 탭에서 C37을 눌러도 됩니다.</li>
<li><strong>값으로</strong>: <code>10k</code>나 <code>104</code>처럼 값을 검색하면 그 값이 적힌 모든 위치가 표시됩니다. 표시줄의 개수를 보면 같은 값 부품이 몇 개인지 대략 알 수 있습니다.</li>
<li><strong>도면에서</strong>: 도면의 참조 번호 글자를 누르면 그 부품이 선택되고, 목록이 <em>부품</em> 탭으로 바뀝니다.</li>
<li><strong>목록으로 정리</strong>: 탭 옆 <strong>⋯</strong> 메뉴의 <strong>부품 목록 CSV</strong>로 참조 번호·값·페이지를 저장한 뒤, 엑셀에서 값으로 정렬하면 간이 BOM이 됩니다.</li>
</ol>

<h2>실습: 부품 CSV를 BOM과 대조하기</h2>
<p><strong>질문</strong>: Schematic Viewer의 부품 목록 CSV를 그대로 BOM(부품 구매·조립 목록)으로 써도 될까? 쓴다면 무엇을 대조해야 할까?</p>
<p><strong>자료</strong>: 사이트의 <a href="${tool("#example")}">예제 회로도</a>(Olimex ESP32-PoE rev. I PDF)와, 같은 리비전의 <a href="https://github.com/OLIMEX/ESP32-POE/blob/deb38a377d50eadb04ddc7118a17a5ae58b1ee53/HARDWARE/ESP32-PoE-hardware-revision-I/ESP32-PoE_Rev_I.sch">KiCad 회로도 원본(ESP32-PoE_Rev_I.sch)</a>입니다. 원본에서 참조 번호와 값 필드를 스크립트로 뽑아 비교했습니다(전원 기호 제외). 이것은 <em>회로도에 놓인 부품 목록</em>이며, 제조사의 조립 BOM은 아닙니다.</p>
<p><strong>조작</strong>: 예제를 열고 탭 옆 <strong>⋯</strong> 메뉴에서 <strong>부품 목록 CSV</strong>를 저장한 뒤, 원본 목록과 참조 번호로 맞춰 봅니다.</p>
<table>
<thead><tr><th>대조 항목</th><th>부품 CSV</th><th>KiCad 원본</th></tr></thead>
<tbody>
<tr><td>참조 번호 수</td><td>129개</td><td>129개. 양쪽 목록의 참조 번호가 모두 같습니다.</td></tr>
<tr><td>값</td><td>129개 모두 원본 값 필드와 같은 글자</td><td>예: <code>R1</code> = <code>10k/R0402</code></td></tr>
<tr><td>여러 유닛 부품</td><td><code>RM1</code>, <code>RM2</code>, <code>RM3</code>이 한 줄씩</td><td>같은 참조 번호의 기호가 <code>RM1</code> 3개, <code>RM2</code>·<code>RM3</code> 4개씩(저항 어레이)</td></tr>
<tr><td>값 앞에 <code>NA(…)</code>·<code>NS(…)</code>가 붙은 부품</td><td>10개가 일반 행으로 들어 있음(예: <code>C21</code> = <code>NA(10uF/6.3V/20%/X5R/C0603)</code>, <code>EXT1</code> = <code>NS(HN1x10)</code>)</td><td>같은 글자. 표기의 뜻은 원본에 따로 적혀 있지 않음</td></tr>
<tr><td>구매 부품이 아닌 항목</td><td><code>FID1</code>~<code>FID6</code>(값 <code>Fiducial</code>), <code>BAT_SENS_E1</code>(값 <code>Opened</code>) 포함</td><td>같은 항목이 기호로 있음</td></tr>
<tr><td>서로 다른 값</td><td>71종(수량 열 없음)</td><td>71종</td></tr>
</tbody>
</table>
<p><strong>원본과 대조해 알게 된 점</strong>: 이 도면에서는 참조 번호와 값 글자가 원본과 모두 같았습니다(소개의 공개 채점에서도 이 표본은 부품·값 100%). 그래도 CSV를 그대로 BOM으로 쓰면 안 되는 이유가 남습니다.</p>
<ul>
<li><strong>실장 여부</strong>: <code>NA(…)</code>, <code>NS(…)</code>처럼 값에 붙은 표기는 미실장을 뜻하는 제조사 관례로 보이지만, 도구는 이를 해석하지 않고 다른 부품과 같은 행으로 내보냅니다. 실제 실장 여부는 제조사 BOM이나 조립 자료로 확인해야 합니다.</li>
<li><strong>유닛과 수량</strong>: <code>RM1</code>처럼 여러 기호로 나뉜 부품은 CSV에서 한 줄이라 구매 수량 1개와 맞지만, 원본에서 유닛이 모두 같은 부품인지 확인해야 합니다. CSV에는 수량 열이 없으므로 같은 값끼리 묶어 직접 세어야 합니다.</li>
<li><strong>구매 대상이 아닌 기호</strong>: 피듀셜(<code>FID</code>), 납땜 점퍼(<code>…_E1</code>)처럼 기판에만 있는 항목도 목록에 나옵니다.</li>
<li><strong>도면에 없는 부품</strong>: 나사·케이스처럼 회로도에 그리지 않은 부품은 CSV에도, 회로도 원본에도 없습니다.</li>
</ul>
<p><strong>한계</strong>: 이 예제는 글자가 깨끗해 값이 모두 맞았습니다. 값 글자가 참조 번호에서 멀거나 방향이 다른 도면에서는 값이 빠지거나 다른 부품에 붙을 수 있습니다(아래 절).</p>
<p><strong>다음 행동</strong>: CSV는 "도면에 어떤 참조 번호와 값이 적혀 있는가"를 빠르게 정리하는 용도로 쓰고, 구매·조립에는 제조사 BOM과 참조 번호로 대조해 실장 여부·수량·대체 부품을 확정하세요.</p>

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
<li><strong>DNP and NC mean different things</strong>: <code>DNP</code> (do not populate; also written <code>DNF</code>, <code>NF</code> or <code>NM</code>) marks <em>a part position left empty</em>, usually in the value field or with a separate mark. <code>NC</code> (no connect) means <em>a pin deliberately left unconnected</em>, shown as an ✕ at the pin end or as a pin named <code>NC</code>. Some manufacturers do write <code>NC</code> in a part's value field to mean not fitted, so decide which meaning applies from the drawing's legend or notes, the manufacturer's conventions and the BOM that lists what is fitted.</li>
</ul>

<h2>Finding them with Schematic Viewer</h2>
<ol class="steps">
<li><strong>By reference</strong>: type <code>C37</code>. The exact C37 comes before look-alikes such as C370, and the view jumps there without pressing Enter. Or pick C37 in the <em>Parts</em> tab.</li>
<li><strong>By value</strong>: search <code>10k</code> or <code>104</code> to mark every place that value is written; the count in the search bar gives a rough number of parts with that value.</li>
<li><strong>On the drawing</strong>: click a reference on the drawing to select the part; the list switches to the <em>Parts</em> tab.</li>
<li><strong>As a list</strong>: save references, values and pages with <strong>Parts CSV</strong> in the <strong>⋯</strong> menu beside the tabs, then sort by value in a spreadsheet for a quick BOM.</li>
</ol>

<h2>Practice: checking the parts CSV against a BOM</h2>
<p><strong>Question</strong>: can Schematic Viewer's parts CSV be used as a BOM (the list for buying and assembly)? If so, what needs checking?</p>
<p><strong>Material</strong>: this site's <a href="${tool("#example")}">example schematic</a> (the Olimex ESP32-PoE rev. I PDF) and the <a href="https://github.com/OLIMEX/ESP32-POE/blob/deb38a377d50eadb04ddc7118a17a5ae58b1ee53/HARDWARE/ESP32-PoE-hardware-revision-I/ESP32-PoE_Rev_I.sch">KiCad schematic source (ESP32-PoE_Rev_I.sch)</a> of the same revision. A script extracted every reference and value field from the source (power symbols excluded). This is <em>the list of parts placed on the schematic</em>, not the manufacturer's assembly BOM.</p>
<p><strong>Steps</strong>: open the example, save <strong>Parts CSV</strong> from the <strong>⋯</strong> menu beside the tabs, and match it with the source list by reference.</p>
<table>
<thead><tr><th>What to compare</th><th>Parts CSV</th><th>KiCad source</th></tr></thead>
<tbody>
<tr><td>Number of references</td><td>129</td><td>129; the two lists have exactly the same references.</td></tr>
<tr><td>Values</td><td>all 129 have the same text as the source value field</td><td>e.g. <code>R1</code> = <code>10k/R0402</code></td></tr>
<tr><td>Multi-unit parts</td><td><code>RM1</code>, <code>RM2</code>, <code>RM3</code> one row each</td><td>symbols sharing one reference: 3 for <code>RM1</code>, 4 each for <code>RM2</code> and <code>RM3</code> (resistor arrays)</td></tr>
<tr><td>Values starting with <code>NA(…)</code> or <code>NS(…)</code></td><td>10 parts listed as ordinary rows (e.g. <code>C21</code> = <code>NA(10uF/6.3V/20%/X5R/C0603)</code>, <code>EXT1</code> = <code>NS(HN1x10)</code>)</td><td>same text; the source does not explain the notation</td></tr>
<tr><td>Items that are not bought</td><td><code>FID1</code>–<code>FID6</code> (value <code>Fiducial</code>) and <code>BAT_SENS_E1</code> (value <code>Opened</code>) included</td><td>present as symbols</td></tr>
<tr><td>Distinct values</td><td>71 (no quantity column)</td><td>71</td></tr>
</tbody>
</table>
<p><strong>What the comparison shows</strong>: on this drawing every reference and value matched the source (the public scoring on the about page also gives this sample 100% for parts and values). Even so, the CSV is not a BOM as it stands:</p>
<ul>
<li><strong>Fitted or not</strong>: notations such as <code>NA(…)</code> and <code>NS(…)</code> look like the manufacturer's way of marking unfitted parts, but the tool does not interpret them and exports them like any other row. Confirm what is fitted from the manufacturer's BOM or assembly data.</li>
<li><strong>Units and quantity</strong>: a part split into several symbols, such as <code>RM1</code>, is one row in the CSV, which matches buying one part — but check in the source that all units really belong to one part. The CSV has no quantity column, so group equal values and count them yourself.</li>
<li><strong>Symbols that are not parts to buy</strong>: board-only items such as fiducials (<code>FID</code>) and solder jumpers (<code>…_E1</code>) appear in the list.</li>
<li><strong>Parts not on the drawing</strong>: screws, enclosures and other parts never drawn on the schematic are in neither the CSV nor the schematic source.</li>
</ul>
<p><strong>Limits</strong>: this example has clean text, so every value was right. On drawings where the value text sits far from the reference or is turned, values can be missing or attach to another part (next section).</p>
<p><strong>Next step</strong>: use the CSV to list quickly which references and values are printed on the drawing; for buying and assembly, match it by reference with the manufacturer's BOM to settle fitting, quantities and substitutes.</p>

<h2>When a value is missing or different</h2>
<p>Schematic Viewer groups value text written near a reference in the same direction. A value far from its reference, rotated differently or split over lines may not be grouped and is left empty; click the part and check the drawing. When the PDF itself carries part data — as OrCAD PDFs do — that data is used first.</p>
<p>A CSV made this way reflects what is drawn, so it does not replace the official BOM. Use the CAD-generated BOM for purchasing and production, and this list for reviewing and cross-checking. If the symbols themselves are new to you, see <a href="${href("learn/read-schematic")}">Reading schematics and datasheets</a>.</p>
`,
        },
};
