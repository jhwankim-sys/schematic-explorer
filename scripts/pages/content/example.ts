import type { PageDef } from "./index.ts";

// Numbers below come from the analysis of the bundled example (Olimex ESP32-PoE rev. I).
// Re-check them when the analysis engine changes.
export const example: PageDef = {
  slug: "learn/example",
  related: ["guide", "learn/find-parts", "learn/read-schematic"],
  content: ({ lang, href, tool }) =>
    lang === "ko"
      ? {
          title: "예제로 따라 하기: ESP32-PoE 회로도 탐색",
          description: "공개 하드웨어인 Olimex ESP32-PoE 회로도로 전원 노드 따라가기, 같은 이름 라벨 찾기, 신호 추적, 부품 검색, CSV 내보내기를 순서대로 실습합니다.",
          body: `
<p>이 글은 <a href="${tool("#example")}">예제 회로도</a>를 열어 놓고 따라 하도록 만들었습니다. 예제는 불가리아의 Olimex가 Apache 2.0 라이선스로 공개한 <strong>ESP32-PoE</strong> 보드(리비전 I) 회로도입니다. 이더넷 케이블로 전원과 통신을 함께 받는(PoE) ESP32 보드로, 전원부·이더넷·USB-시리얼·버튼·확장 커넥터가 한 장에 들어 있어 회로도 읽기 연습에 알맞습니다. 원본 파일은 <a href="https://github.com/OLIMEX/ESP32-POE">Olimex GitHub 저장소</a>에 있습니다.</p>
<div class="note"><p>아래 숫자(노드 41개, 부품 135개 등)는 이 사이트의 분석 결과입니다. 분석 규칙이 개선되면 조금 달라질 수 있습니다.</p></div>

<h2>1단계: 예제 열기</h2>
<ol class="steps">
<li>첫 화면의 <strong>예제 회로도로 체험하기</strong>나 도구 화면의 <strong>예제 회로도로 먼저 해 보기</strong>를 누릅니다. 파일은 이 사이트에서 받아 브라우저 안에서 분석됩니다.</li>
<li>몇 초 뒤 도면 전체가 화면에 맞춰 나오고, 목록에 <em>노드 41</em>, <em>부품 135</em>가 표시됩니다.</li>
<li>도면에는 Power Supply, ESP32-WROOM-32 Module, Ethernet, USB to UART, Buttons 같은 블록 제목이 보입니다. 마우스 휠이나 두 손가락으로 확대해 각 블록을 둘러봅니다.</li>
</ol>

<h2>2단계: 전원 노드 따라가기</h2>
<ol class="steps">
<li><em>노드</em> 탭의 <strong>전원</strong> 묶음에서 <code>+3.3V</code>를 누릅니다. 이름 옆 <code>×11</code>은 같은 이름의 라벨이 11곳 있다는 뜻입니다.</li>
<li>+3.3V로 연결된 배선이 청록색으로 강조되고 나머지는 흐려집니다. 전원부의 레귤레이터 출력에서 시작해 ESP32 모듈, 버튼 풀업 저항, SD 카드, 확장 커넥터까지 같은 전원이 쓰이는 곳을 한눈에 볼 수 있습니다.</li>
<li>목록에서 <code>+3.3V</code>를 한 번 더 누르거나 선택 정보의 <strong>라벨 위치 ▶</strong>를 누르면 1/11, 2/11 … 순서로 라벨이 있는 곳으로 이동합니다. 도면 곳곳에 흩어진 전원 기호를 하나도 놓치지 않고 확인할 수 있습니다.</li>
<li>비교해 보려면 <code>+3.3VLAN</code>을 눌러 보세요. 이름은 비슷하지만 이더넷 칩 쪽 전원으로 따로 나뉜 노드라 강조되는 범위가 다릅니다. 이름이 비슷한 전원을 혼동하지 않는 연습이 됩니다.</li>
</ol>

<h2>3단계: 신호 하나 추적하기</h2>
<ol class="steps">
<li>검색창에 <code>ESP_EN</code>을 입력합니다. Enter 없이 잠시 기다리면 첫 위치로 이동하고, 목록에는 <code>ESP_EN ×4</code>가 나옵니다.</li>
<li>목록의 <code>ESP_EN</code>을 누르면 리셋(EN) 신호가 모듈의 EN 핀, 리셋 버튼, USB-시리얼 쪽 자동 리셋 회로로 이어지는 모습이 강조됩니다.</li>
<li>라벨 위치 버튼으로 네 곳을 차례로 보면서, 각 위치에서 어떤 부품(풀업 저항, 콘덴서, 버튼)이 이 신호에 붙어 있는지 확인해 보세요.</li>
<li>도면에서 강조된 배선 아무 곳이나 눌러도 같은 노드가 선택됩니다. 빈 곳을 누르거나 <kbd>Esc</kbd>를 누르면 선택이 해제됩니다.</li>
</ol>

<h2>4단계: 부품 찾기</h2>
<ol class="steps">
<li>검색창에 <code>R1</code>을 입력합니다. 부분 일치라서 R10~R19도 함께 찾지만, <strong>정확히 일치하는 R1이 맨 앞</strong>에 나오고 표시줄에 "정확히 일치 1"이 함께 표시됩니다.</li>
<li><em>부품</em> 탭으로 바꾸면 R1이 첫 줄에 있습니다. 누르면 R1 위치로 이동합니다.</li>
<li>값이 적힌 부품은 목록에 값이 함께 나옵니다(예: 콘덴서의 <code>22uF/6.3V/20%/X5R/C0603</code>). 값이 비어 있는 부품은 도면에서 직접 확인합니다. 이유는 <a href="${href("learn/find-parts")}">부품 찾기</a> 글에 정리했습니다.</li>
</ol>

<h2>5단계: 목록 저장하기</h2>
<ol class="steps">
<li>검색창을 비운 뒤 <em>부품</em> 탭에서 <strong>부품 목록 CSV</strong>를 누르면 135개 부품의 참조 번호·값·페이지가 담긴 CSV가 저장됩니다.</li>
<li><em>노드</em> 탭에서 <strong>노드 목록 CSV</strong>를 누르면 41개 노드의 이름·종류·라벨 수가 저장됩니다. 엑셀에서 열어 정렬하거나 BOM과 대조하는 데 쓸 수 있습니다.</li>
</ol>

<h2>정리</h2>
<p>이 다섯 단계면 대부분의 회로도에서 "이 전원이 어디어디 쓰이는지", "이 신호가 어디로 이어지는지", "이 부품이 어디 있는지"를 빠르게 확인할 수 있습니다. 이제 <a href="${tool()}">내 회로도 PDF</a>로 같은 순서를 해 보세요. 기호와 라벨 읽는 법이 익숙하지 않다면 <a href="${href("learn/read-schematic")}">회로도·데이터시트 읽는 법 기초</a>를 먼저 읽어 보는 것도 좋습니다.</p>
`,
        }
      : {
          title: "Step-by-step example: exploring the ESP32-PoE schematic",
          description: "Practise following a power net, finding every label with the same name, tracing a signal, searching parts and exporting CSV on the open-hardware Olimex ESP32-PoE schematic.",
          body: `
<p>This walkthrough is meant to be followed with the <a href="${tool("#example")}">example schematic</a> open. It is the <strong>ESP32-PoE</strong> board (revision I), published by Olimex of Bulgaria under the Apache 2.0 licence: an ESP32 board powered and networked over one Ethernet cable (PoE). Power supply, Ethernet, USB-to-serial, buttons and expansion connectors all fit on one sheet, which makes it good practice. The original file is in the <a href="https://github.com/OLIMEX/ESP32-POE">Olimex GitHub repository</a>.</p>
<div class="note"><p>The numbers below (41 nets, 135 parts, …) come from this site's analysis and may change slightly as the analysis improves.</p></div>

<h2>Step 1: open the example</h2>
<ol class="steps">
<li>Choose <strong>Try an example</strong> on the home page, or <strong>Try an example schematic</strong> in the tool. The file is fetched from this site and analyzed in your browser.</li>
<li>A few seconds later the whole sheet fits the screen and the list shows <em>Nets 41</em> and <em>Parts 135</em>.</li>
<li>Block titles such as Power Supply, ESP32-WROOM-32 Module, Ethernet, USB to UART and Buttons are visible. Zoom with the wheel or two fingers to look around.</li>
</ol>

<h2>Step 2: follow a power net</h2>
<ol class="steps">
<li>In the <em>Nets</em> tab, under <strong>Power</strong>, pick <code>+3.3V</code>. The <code>×11</code> next to it means there are eleven labels with that name.</li>
<li>Every wire on +3.3V turns cyan and the rest fades. From the regulator output to the ESP32 module, button pull-ups, SD card and expansion connector, you see everywhere this supply is used.</li>
<li>Click <code>+3.3V</code> in the list again, or use <strong>Labels ▶</strong> in the selection panel, to visit the labels one by one (1/11, 2/11 …). No power symbol scattered across the sheet is missed.</li>
<li>For contrast, pick <code>+3.3VLAN</code>. Similar name, but it is a separate supply for the Ethernet chip, so a different area lights up — good practice for not mixing up look-alike rails.</li>
</ol>

<h2>Step 3: trace one signal</h2>
<ol class="steps">
<li>Type <code>ESP_EN</code> in the search box. After a short pause the view jumps to the first match, and the list shows <code>ESP_EN ×4</code>.</li>
<li>Pick <code>ESP_EN</code> in the list: the enable (reset) signal is highlighted from the module's EN pin to the reset button and the auto-reset circuit on the USB-to-serial side.</li>
<li>Step through the four labels and note which parts (pull-up resistor, capacitor, button) sit on the signal at each place.</li>
<li>Clicking any highlighted wire selects the same net. Click empty space or press <kbd>Esc</kbd> to clear it.</li>
</ol>

<h2>Step 4: find a part</h2>
<ol class="steps">
<li>Type <code>R1</code>. Search matches parts of words, so R10–R19 are found too, but <strong>R1 itself comes first</strong> and the bar shows "exact 1".</li>
<li>Switch to the <em>Parts</em> tab: R1 is the first row. Click it to jump there.</li>
<li>Parts with a value written next to them show it in the list (for example <code>22uF/6.3V/20%/X5R/C0603</code> on a capacitor). If a value is empty, check the drawing; <a href="${href("learn/find-parts")}">Finding parts</a> explains why it happens.</li>
</ol>

<h2>Step 5: save the lists</h2>
<ol class="steps">
<li>Clear the search, then choose <strong>Parts CSV</strong> in the <em>Parts</em> tab to save references, values and pages for all 135 parts.</li>
<li><strong>Nets CSV</strong> in the <em>Nets</em> tab saves the 41 nets with their type and label count — handy for sorting in a spreadsheet or checking against a BOM.</li>
</ol>

<h2>Wrap-up</h2>
<p>These five steps answer most everyday questions on any schematic: where a supply is used, where a signal goes, and where a part is. Now try the same with <a href="${tool()}">your own schematic PDF</a>. If symbols and labels still feel unfamiliar, read <a href="${href("learn/read-schematic")}">Reading schematics and datasheets</a> first.</p>
`,
        },
};
