import type { PageDef } from "./index.ts";

// Every number and screenshot below was checked on the bundled example (Olimex ESP32-PoE rev. I) with the
// tool itself (screenshots in public/images/guides/, taken from the built site). Re-check them, and retake the
// screenshots, when the analysis engine or the workspace changes.
export const fig = (name: string, lang: string, alt: string, caption: string) =>
  `<figure><img src="/images/guides/${name}-${lang}.jpg" width="1280" height="760" loading="lazy" alt="${alt}"><figcaption>${caption}</figcaption></figure>`;

export const example: PageDef = {
  slug: "learn/example",
  updated: "2026-11-03",
  related: ["guide", "learn/find-parts", "help/formats"],
  content: ({ lang, href, tool }) =>
    lang === "ko"
      ? {
          title: "예제로 따라 하기: ESP32-PoE 회로도 탐색",
          description: "공개 하드웨어인 Olimex ESP32-PoE 회로도로 전원 노드, ESP_EN 신호, 부품 R1, CSV 내보내기를 실제 화면과 함께 따라 하고, 결과를 원본 도면에서 어떻게 다시 확인하는지 정리했습니다.",
          body: `
<p>이 글은 <a href="${tool("#example")}">예제 회로도</a>를 열어 놓고 따라 하도록 만들었습니다. 예제는 불가리아의 Olimex가 Apache 2.0 라이선스로 공개한 <strong>ESP32-PoE</strong> 보드(리비전 I) 회로도입니다. 이더넷 케이블로 전원과 통신을 함께 받는(PoE) ESP32 보드로, 전원부·이더넷·USB-시리얼·버튼·확장 커넥터가 한 장에 들어 있어 회로도 읽기 연습에 알맞습니다. 원본 파일은 <a href="https://github.com/OLIMEX/ESP32-POE">Olimex GitHub 저장소</a>에 있고, 이 사이트는 원본을 수정하지 않고 그대로 제공합니다.</p>
<p>각 단계는 <strong>해결할 질문 → 조작 → 관찰한 결과 → 원본에서 다시 확인할 부분</strong> 순서로 적었습니다. 그림은 모두 이 사이트의 도구로 예제를 열어 직접 찍은 화면입니다.</p>
<div class="note"><p>도구가 보여 주는 연결은 PDF의 선과 글자에서 <em>추정</em>한 결과입니다. 아래 숫자(노드 40개, 부품 129개 등)는 2026-11-03에 이 사이트에서 확인한 분석 결과이며, 분석 규칙이 바뀌면 달라질 수 있습니다. 설계나 수리 판단에는 원본 도면과 CAD 자료를 함께 확인하세요.</p></div>

<h2>1단계: 예제 열기</h2>
<p><strong>질문</strong>: 이 도면에 이름 붙은 노드와 부품이 얼마나 있는가?</p>
<ol class="steps">
<li>첫 화면의 <strong>예제 회로도 체험하기</strong>나 도구 화면의 <strong>예제 회로도로 먼저 해 보기</strong>를 누릅니다. 파일은 이 사이트에서 받아 브라우저 안에서 분석됩니다.</li>
<li>분석이 끝나면 도면 전체가 화면에 맞춰 나오고, 목록 위 탭에 <em>노드 40</em>, <em>부품 129</em>가 표시됩니다.</li>
</ol>
${fig("example-open", "ko", "예제 회로도를 연 화면. 왼쪽 목록에 노드 40, 부품 129 탭과 전원·신호 노드 목록이 있고, 오른쪽에 도면 전체가 보인다.", "예제를 연 직후의 화면. 이름(라벨)이 있는 노드가 목록에 나오고, 이름이 없는 노드 26개는 도면에서 배선을 눌러 확인한다는 안내가 목록 끝에 나옵니다.")}
<p><strong>원본에서 확인할 부분</strong>: 도면에는 Power Supply, ESP-WROOM-32 Module, Ethernet, USB to UART, Buttons, SD/MMC Card, Extensions, UEXT 블록 제목이 있습니다. "노드"는 같은 전기적 연결로 추정한 배선 묶음이고, 129는 참조 번호(R1, C1, U1 …)로 읽은 부품 수입니다. 실제 부품 수는 원본의 BOM과 비교해야 확정됩니다.</p>

<h2>2단계: 전원 노드 따라가기</h2>
<p><strong>질문</strong>: +3.3V 전원은 도면의 어느 블록에서 쓰이는가?</p>
<ol class="steps">
<li><em>노드</em> 탭의 <strong>전원</strong> 묶음에서 <code>+3.3V</code>를 누릅니다. 이름 옆 <code>×11</code>은 같은 이름의 라벨이 11곳 있다는 뜻입니다.</li>
<li>선택 정보에 <em>배선 46개 · 접점 11개</em>가 표시되고, +3.3V로 묶인 배선이 청록색으로 강조됩니다.</li>
<li>목록에서 <code>+3.3V</code>를 한 번 더 누르거나 <strong>라벨 위치</strong>의 화살표를 누르면 1/11, 2/11 … 순서로 라벨이 있는 곳으로 이동합니다.</li>
</ol>
${fig("example-power", "ko", "+3.3V 노드를 선택한 화면. 전원부, ESP32 모듈, 버튼, SD 카드, 이더넷, 확장 커넥터, UEXT, USB to UART 블록의 일부 배선이 청록색으로 강조되어 있다.", "+3.3V를 선택한 화면. 강조된 곳은 Power Supply, ESP-WROOM-32, Buttons, SD/MMC Card, Ethernet, Extensions, UEXT, USB to UART 블록에 걸쳐 있습니다.")}
<p><strong>관찰한 결과</strong>: 강조는 전원부의 출력 쪽에서 시작해 ESP32 모듈, 버튼, SD 카드, 이더넷, 확장 커넥터(Extensions·UEXT), USB to UART 블록까지 이어집니다. 이름이 비슷한 <code>+3.3VLAN</code>(×6)을 누르면 Ethernet 블록 안에서만 강조되고(배선 22개 · 접점 5개), +3.3V와는 다른 노드로 나옵니다.</p>
<p><strong>원본에서 확인할 부분</strong>: 라벨 위치로 11곳을 차례로 보면서 각 라벨이 실제로 배선 끝에 붙어 있는지 확인합니다. 원본 도면에서 +3.3VLAN은 Ethernet 블록의 FET3(WPM2015-3/TR)를 사이에 두고 +3.3V와 나뉘어 있는 것으로 보입니다. 도구는 부품을 거친 연결을 같은 노드로 묶지 않으므로, 두 전원의 관계는 이렇게 부품을 직접 읽어 판단합니다.</p>

<h2>3단계: 신호 하나 추적하기</h2>
<p><strong>질문</strong>: ESP32의 리셋(EN) 신호는 어디어디로 이어지는가?</p>
<ol class="steps">
<li>검색창에 <code>ESP_EN</code>을 입력합니다. 목록에 <code>ESP_EN ×4</code>만 남고, 도면 위 검색 막대에 <em>1 / 4</em>가 표시됩니다.</li>
<li>목록의 <code>ESP_EN</code>을 누르면 선택 정보에 <em>배선 9개 · 접점 2개</em>가 표시됩니다.</li>
<li>라벨 위치 버튼으로 네 곳을 차례로 봅니다. 강조된 배선을 직접 눌러도 같은 노드가 선택되고, 빈 곳을 누르거나 <kbd>Esc</kbd>를 누르면 선택이 해제됩니다.</li>
</ol>
${fig("example-signal", "ko", "ESP_EN을 검색해 선택한 화면. ESP32 모듈의 EN 부근, Buttons, Extensions, USB to UART 블록의 짧은 배선이 강조되어 있고 검색 막대에 1 / 4가 보인다.", "ESP_EN을 선택한 화면. 같은 이름의 라벨 네 곳(ESP32 모듈 옆, Buttons, Extensions, USB to UART)이 강조됩니다.")}
<p><strong>관찰한 결과</strong>: ESP_EN 라벨은 ESP32 모듈의 EN 핀 쪽, 리셋 버튼이 있는 Buttons 블록, 확장 커넥터(Extensions), USB to UART 블록에 하나씩 있습니다. 서로 떨어진 네 곳이 같은 이름의 라벨로 이어진 하나의 신호로 묶였습니다.</p>
<p><strong>원본에서 확인할 부분</strong>: 각 위치에서 이 신호에 붙은 부품을 직접 읽어 보세요. 원본에서는 모듈 쪽 라벨 근처에 R32·C20, Buttons 쪽에 리셋 버튼 RST1, USB to UART 쪽에 다이오드 D9와 자동 프로그램용 트랜지스터 Q2·Q3(BC817, "Auto program" 표)가 있습니다. 라벨이 배선에서 조금 떨어져 있으면 라벨로 인식되지 않을 수 있으므로, 검색으로 찾은 위치 수와 라벨 위치 수가 같은지 비교하면 놓친 곳이 없는지 확인할 수 있습니다.</p>

<h2>4단계: 부품 찾기</h2>
<p><strong>질문</strong>: R1은 어디에 있고 값은 무엇인가?</p>
<ol class="steps">
<li>검색창에 <code>R1</code>을 입력합니다. 부분 일치로 찾으므로 결과는 13개(R1, R10~R19, 값에 "R1"이 들어간 PWR1·R28)이지만, 검색 막대에 <em>1 / 13 · 정확히 일치 1</em>이 표시되고 정확히 일치하는 R1이 맨 앞에 옵니다.</li>
<li><em>부품</em> 탭에서 첫 줄의 <code>R1  10k/R0402</code>를 누르면 R1 위치로 확대해 이동합니다.</li>
</ol>
${fig("example-part", "ko", "R1을 검색해 선택한 화면. 왼쪽 부품 목록 맨 위에 R1 10k/R0402가 있고, 검색 막대에 1 / 13 정확히 일치 1이 표시되며, 도면은 R1 참조 번호 부근으로 확대되어 있다.", "R1을 선택한 화면. 목록에는 참조 번호 옆에 읽어 낸 값(10k/R0402)이 함께 나옵니다.")}
<p><strong>원본에서 확인할 부분</strong>: 목록의 값은 참조 번호 근처의 글자를 값으로 읽은 결과입니다. 값 글자가 멀리 떨어져 있거나 방향이 다르면 다른 부품에 붙거나 비어 있을 수 있습니다. 이 예제에서는 값이 빈 부품이 없었지만, 다른 도면에서는 <a href="${href("learn/find-parts")}">부품 찾기</a> 글의 방법으로 도면에서 직접 확인하세요.</p>

<h2>5단계: 목록 저장하기</h2>
<p><strong>질문</strong>: 노드와 부품 목록을 표로 정리할 수 있는가?</p>
<ol class="steps">
<li>검색창을 비운 뒤 탭 옆의 <strong>⋯</strong>(내보내기) 메뉴에서 <strong>부품 목록 CSV</strong>를 고릅니다.</li>
<li>같은 메뉴의 <strong>노드 목록 CSV</strong>도 저장합니다.</li>
</ol>
<p><strong>관찰한 결과</strong>: 부품 CSV는 <code>reference,value,pages</code> 열에 129줄(예: <code>R1,10k/R0402,1</code>, <code>C1,22uF/6.3V/20%/X5R/C0603,1</code>), 노드 CSV는 <code>net,type,labels,pages</code> 열에 40줄(예: +3.3V, power, 11, 1)이었습니다. 노드 이름은 스프레드시트가 수식으로 읽지 않도록 <code>="+3.3V"</code> 형태로 저장됩니다.</p>
<p><strong>원본에서 확인할 부분</strong>: 이 CSV는 도면 글자에서 읽은 목록이며, 검증된 BOM이나 CAD 넷리스트와 같지 않습니다. 실장하지 않는 부품, 도면 밖 기구 부품, 이름 없는 노드는 빠지거나 다르게 나올 수 있으므로 원본 BOM과 대조하는 용도로 쓰세요.</p>

<h2>정리</h2>
<p>이 다섯 단계로 "이 전원이 어디에 쓰이는지", "이 신호가 어디로 이어지는지", "이 부품이 어디 있는지"를 확인하고, 그 결과를 원본에서 어떻게 검증할지까지 살펴봤습니다. 이제 <a href="${tool()}">내 회로도 PDF</a>로 같은 순서를 해 보세요. 결과가 이상하면 <a href="${href("help/formats")}">지원 형식과 오류 해결</a>에서 PDF 상태를 확인하고, 기호와 라벨 읽는 법은 <a href="${href("learn/read-schematic")}">회로도·데이터시트 읽는 법 기초</a>를 참고하세요.</p>
`,
        }
      : {
          title: "Step-by-step example: exploring the ESP32-PoE schematic",
          description: "Follow a power net, the ESP_EN signal, part R1 and the CSV export on the open-hardware Olimex ESP32-PoE schematic, with real screenshots and notes on how to verify each result against the original drawing.",
          body: `
<p>This walkthrough is meant to be followed with the <a href="${tool("#example")}">example schematic</a> open. It is the <strong>ESP32-PoE</strong> board (revision I), published by Olimex of Bulgaria under the Apache 2.0 licence: an ESP32 board powered and networked over one Ethernet cable (PoE). Power supply, Ethernet, USB-to-serial, buttons and expansion connectors all fit on one sheet, which makes it good practice. The original file is in the <a href="https://github.com/OLIMEX/ESP32-POE">Olimex GitHub repository</a>; this site serves it unchanged.</p>
<p>Each step follows the same pattern: <strong>question → what to do → what we observed → what to check in the original</strong>. Every picture is a screenshot of this site's tool with the example open.</p>
<div class="note"><p>The connections the tool shows are <em>inferred</em> from the lines and text in the PDF. The numbers below (40 nets, 129 parts, …) are this site's analysis results as checked on 2026-11-03 and may change when the analysis rules change. Check the original drawing and CAD data before design or repair decisions.</p></div>

<h2>Step 1: open the example</h2>
<p><strong>Question</strong>: how many named nets and parts does the sheet have?</p>
<ol class="steps">
<li>Choose <strong>Try an example</strong> on the home page, or <strong>Try an example schematic</strong> in the tool. The file is fetched from this site and analyzed in your browser.</li>
<li>When the analysis finishes, the whole sheet fits the screen and the tabs above the list show <em>Nets 40</em> and <em>Parts 129</em>.</li>
</ol>
${fig("example-open", "en", "The example schematic opened in the tool: on the left the Nets 40 and Parts 129 tabs with the power and signal nets; on the right the whole sheet.", "Right after opening the example. Nets with a name (label) are listed; a note at the end of the list says the 26 unlabeled nets can be inspected by clicking wires in the drawing.")}
<p><strong>Check in the original</strong>: the sheet has the block titles Power Supply, ESP-WROOM-32 Module, Ethernet, USB to UART, Buttons, SD/MMC Card, Extensions and UEXT. A "net" here is a group of wires inferred to be one electrical connection, and 129 is the number of parts read from references (R1, C1, U1 …). The real part count is only settled by comparing with the original BOM.</p>

<h2>Step 2: follow a power net</h2>
<p><strong>Question</strong>: which blocks of the sheet use the +3.3V supply?</p>
<ol class="steps">
<li>In the <em>Nets</em> tab, under <strong>Power</strong>, pick <code>+3.3V</code>. The <code>×11</code> next to it means there are eleven labels with that name.</li>
<li>The selection panel shows <em>46 wires · 11 junctions</em>, and the wires grouped as +3.3V turn cyan.</li>
<li>Click <code>+3.3V</code> in the list again, or use the arrows under <strong>Labels</strong>, to visit the labels one by one (1/11, 2/11 …).</li>
</ol>
${fig("example-power", "en", "The +3.3V net selected: wires in the power supply, ESP32 module, buttons, SD card, Ethernet, expansion connectors, UEXT and USB to UART blocks are highlighted in cyan.", "+3.3V selected. The highlight spans the Power Supply, ESP-WROOM-32, Buttons, SD/MMC Card, Ethernet, Extensions, UEXT and USB to UART blocks.")}
<p><strong>What we observed</strong>: the highlight starts at the output side of the power supply and reaches the ESP32 module, buttons, SD card, Ethernet, the expansion connectors (Extensions, UEXT) and the USB to UART block. Picking the look-alike <code>+3.3VLAN</code> (×6) highlights wires only inside the Ethernet block (22 wires · 5 junctions): it is a different net from +3.3V.</p>
<p><strong>Check in the original</strong>: step through the eleven labels and confirm that each one really sits at the end of a wire. In the original drawing, +3.3VLAN appears to be separated from +3.3V by FET3 (WPM2015-3/TR) in the Ethernet block. The tool does not merge connections through a component into one net, so the relation between the two supplies is judged by reading the parts like this.</p>

<h2>Step 3: trace one signal</h2>
<p><strong>Question</strong>: where does the ESP32 enable (reset) signal go?</p>
<ol class="steps">
<li>Type <code>ESP_EN</code> in the search box. Only <code>ESP_EN ×4</code> remains in the list, and the search bar over the drawing shows <em>1 / 4</em>.</li>
<li>Pick <code>ESP_EN</code> in the list: the selection panel shows <em>9 wires · 2 junctions</em>.</li>
<li>Step through the four labels. Clicking a highlighted wire selects the same net; click empty space or press <kbd>Esc</kbd> to clear it.</li>
</ol>
${fig("example-signal", "en", "ESP_EN searched and selected: short wires near the ESP32 module's EN pin, in the Buttons, Extensions and USB to UART blocks are highlighted, and the search bar shows 1 / 4.", "ESP_EN selected. The four labels with the same name (next to the ESP32 module, in Buttons, Extensions and USB to UART) are highlighted.")}
<p><strong>What we observed</strong>: there is one ESP_EN label on the ESP32 module's EN side, one in the Buttons block with the reset button, one at the expansion connector (Extensions) and one in the USB to UART block. Four separate places were grouped into one signal through labels with the same name.</p>
<p><strong>Check in the original</strong>: at each place, read the parts on the signal yourself. In the original, R32 and C20 are near the label on the module side, the reset button RST1 is in Buttons, and the diode D9 and the auto-program transistors Q2 and Q3 (BC817, with the "Auto program" table) are on the USB to UART side. A label slightly away from its wire may not be recognised as a label, so comparing the number of search matches with the number of label positions tells you whether any place was missed.</p>

<h2>Step 4: find a part</h2>
<p><strong>Question</strong>: where is R1 and what is its value?</p>
<ol class="steps">
<li>Type <code>R1</code>. Search matches parts of words, so there are 13 results (R1, R10–R19, and PWR1 and R28, whose values contain "R1"), but the search bar shows <em>1 / 13 · exact 1</em> and the exact match R1 comes first.</li>
<li>In the <em>Parts</em> tab, click the first row, <code>R1  10k/R0402</code>, to zoom to R1.</li>
</ol>
${fig("example-part", "en", "R1 searched and selected: R1 10k/R0402 is at the top of the parts list, the search bar shows 1 / 13 exact 1, and the drawing is zoomed to the R1 reference.", "R1 selected. The list shows the value read next to each reference (10k/R0402).")}
<p><strong>Check in the original</strong>: the value in the list is the text read near the reference. If the value text is far away or turned the other way, it can attach to another part or stay empty. No part in this example had an empty value; on other drawings, check in the drawing as described in <a href="${href("learn/find-parts")}">Finding parts</a>.</p>

<h2>Step 5: save the lists</h2>
<p><strong>Question</strong>: can the nets and parts be put into a table?</p>
<ol class="steps">
<li>Clear the search, then choose <strong>Parts CSV</strong> in the <strong>⋯</strong> (Export) menu beside the tabs.</li>
<li>Save <strong>Nets CSV</strong> from the same menu.</li>
</ol>
<p><strong>What we observed</strong>: the parts CSV had the columns <code>reference,value,pages</code> and 129 rows (for example <code>R1,10k/R0402,1</code> and <code>C1,22uF/6.3V/20%/X5R/C0603,1</code>); the nets CSV had <code>net,type,labels,pages</code> and 40 rows (for example +3.3V, power, 11, 1). Net names are written as <code>="+3.3V"</code> so that spreadsheets do not read them as formulas.</p>
<p><strong>Check in the original</strong>: these CSV files are lists read from the drawing's text, not a verified BOM or CAD netlist. Unfitted parts, mechanical parts outside the drawing and unnamed nets can be missing or differ, so use them for checking against the original BOM.</p>

<h2>Wrap-up</h2>
<p>These five steps answered where a supply is used, where a signal goes and where a part is, and showed how to verify each answer against the original. Now try the same with <a href="${tool()}">your own schematic PDF</a>. If the result looks wrong, check the PDF in <a href="${href("help/formats")}">Supported files and troubleshooting</a>; for symbols and labels, see <a href="${href("learn/read-schematic")}">Reading schematics and datasheets</a>.</p>
`,
        },
};
