import type { PageDef } from "./index.ts";

export const readSchematic: PageDef = {
  slug: "learn/read-schematic",
  related: ["learn/find-parts", "learn/example", "guide"],
  content: ({ lang, href, tool }) =>
    lang === "ko"
      ? {
          title: "회로도·데이터시트 읽는 법 기초",
          description: "배선과 접점, 넷 라벨, 전원·접지 기호, 페이지를 넘나드는 포트, 핀 번호와 핀 이름, 액티브 로우 표기, 그리고 데이터시트에서 먼저 볼 항목을 처음 보는 사람 기준으로 정리했습니다.",
          body: `
<p>회로도는 "무엇이 무엇과 연결되어 있는가"를 적은 지도입니다. 부품의 실제 위치나 모양은 PCB 도면이 담당하고, 회로도는 연결 관계와 부품 값만 보여 줍니다. 이 글은 회로도를 처음 읽는 사람이 알아야 할 표기 규칙을 정리합니다. 읽으면서 <a href="${tool("#example")}">예제 회로도</a>를 열어 직접 찾아보면 빨리 익숙해집니다.</p>

<h2>배선과 접점</h2>
<ul>
<li><strong>배선(wire)</strong>: 부품 핀 사이를 잇는 선입니다. 선으로 이어진 모든 핀은 전기적으로 같은 점이며, 이 묶음을 <strong>노드</strong> 또는 <strong>넷(net)</strong>이라고 부릅니다.</li>
<li><strong>접점(junction dot)</strong>: 선이 만나는 곳의 굵은 점은 "여기서 연결됨"을 뜻합니다.</li>
<li><strong>점 없는 교차</strong>: 두 선이 점 없이 십자로 지나가면 <em>연결되지 않은</em> 것입니다. 오래된 도면은 한쪽 선을 반원으로 넘겨 그리기도 합니다. 헷갈리지 않도록 요즘은 T자 연결에만 점을 찍고 십자 연결은 피하는 것이 관례입니다.</li>
</ul>
<p>Schematic Viewer에서 배선을 누르면 그 노드 전체가 강조되므로, 점 없는 교차가 실제로 연결되지 않았는지 바로 확인할 수 있습니다.</p>

<h2>넷 라벨: 선 없이 연결하기</h2>
<p>모든 연결을 선으로 그리면 도면이 거미줄이 됩니다. 그래서 선 끝에 <code>SDA</code>, <code>ESP_EN</code> 같은 <strong>넷 라벨</strong>을 붙이고, <strong>같은 이름의 라벨끼리는 선이 없어도 연결된 것</strong>으로 약속합니다. 회로도를 읽을 때 가장 시간이 많이 드는 일이 바로 같은 이름 라벨을 찾아다니는 것이고, Schematic Viewer는 이 작업을 대신해 줍니다.</p>
<p>라벨 이름은 기능을 나타내도록 짓는 경우가 많습니다. <code>_N</code>, <code>#</code>, <code>/</code>가 붙은 이름은 아래의 액티브 로우 신호인 경우가 많고, <code>TX</code>/<code>RX</code>는 어느 쪽 기준으로 붙인 이름인지(보내는 쪽인지 받는 쪽인지) 도면마다 다르니 핀 이름과 함께 확인해야 합니다.</p>

<h2>전원과 접지 기호</h2>
<ul>
<li><strong>전원 기호</strong>: 위쪽을 향한 화살표나 막대 옆에 <code>+3.3V</code>, <code>VCC</code>, <code>+5V</code>처럼 이름이 적힌 기호입니다. 넷 라벨과 마찬가지로 같은 이름이면 모두 연결되어 있습니다.</li>
<li><strong>접지 기호</strong>: 아래로 갈수록 짧아지는 가로줄 묶음(<code>GND</code>), 삼각형, 갈퀴 모양 등이 있습니다. 아날로그 접지(<code>AGND</code>)와 디지털 접지(<code>DGND</code>), 섀시 접지를 구분해 그리는 도면도 있는데, 이름이 다르면 별개의 노드로 봐야 합니다(보통 한 점에서 비드나 0Ω 저항으로 이어집니다).</li>
<li><strong>비슷한 이름 주의</strong>: <code>+3.3V</code>와 <code>+3.3VA</code>, <code>VCC</code>와 <code>VCCIO</code>는 다른 전원입니다. 필터나 스위치를 거쳐 갈라진 전원이므로, 측정할 때 어느 쪽인지 반드시 구분해야 합니다.</li>
</ul>

<h2>페이지를 넘는 연결: 포트와 계층 시트</h2>
<p>도면이 여러 장이면 <strong>오프 페이지 커넥터</strong>(화살표나 오각형 모양의 상자 안에 이름)를 써서 다른 페이지로 신호를 넘깁니다. 이름이 같으면 연결된 것이며, 옆에 상대 페이지 번호가 작게 적혀 있기도 합니다.</p>
<p>큰 설계는 <strong>계층 시트</strong>를 씁니다. 상위 페이지에 "전원부", "MCU" 같은 블록 상자가 있고, 상자 테두리의 포트가 하위 페이지의 포트와 이어집니다. 이때는 같은 이름이라도 블록마다 따로일 수 있어 주의가 필요합니다. Schematic Viewer는 이름이 있는 라벨·포트는 페이지를 넘어 묶어 주지만, 이름 없이 블록 포트로만 이어진 연결은 아직 따라가지 못합니다(<a href="${href("help/formats")}">지원 형식</a> 참고).</p>

<h2>부품 기호와 핀</h2>
<ul>
<li><strong>핀 번호와 핀 이름</strong>: IC 기호의 핀 옆에는 보통 바깥쪽에 <em>핀 번호</em>(패키지의 물리적 위치, 예: 12), 안쪽에 <em>핀 이름</em>(기능, 예: <code>GPIO4</code>)이 적힙니다. 측정이나 납땜은 번호로, 기능 파악은 이름으로 합니다.</li>
<li><strong>극성 있는 부품</strong>: 다이오드는 삼각형이 가리키는 쪽(막대)이 캐소드입니다. 전해 콘덴서는 <code>+</code> 표시나 곡선 판으로 극성을 나타냅니다.</li>
<li><strong>숨은 핀</strong>: 일부 라이브러리는 IC의 전원·접지 핀을 기호에 그리지 않고 이름으로만 연결합니다. 도면에 VCC 핀이 안 보이면 데이터시트로 확인해야 합니다.</li>
</ul>

<h2>액티브 로우 표기</h2>
<p>신호가 0V(Low)일 때 동작한다는 뜻으로, 이름 위에 줄을 긋거나(<code>RESET</code> 위 막대) 이름 앞뒤에 <code>/</code>, <code>#</code>, <code>_N</code>, <code>n</code>을 붙입니다. 예를 들어 <code>RESET_N</code>은 Low일 때 리셋이 걸리므로 평소에는 풀업 저항으로 High를 유지하는 회로가 함께 그려져 있는 경우가 많습니다. PDF로 내보낼 때 윗줄이 사라지는 도면도 있으니 풀업·풀다운 구성으로 판단하는 것이 안전합니다.</p>

<h2>데이터시트에서 먼저 볼 것</h2>
<p>회로도에서 모르는 IC를 만나면 부품 번호로 데이터시트를 찾아 다음 순서로 보면 효율적입니다.</p>
<ol class="steps">
<li><strong>첫 페이지 요약(Features)</strong>: 무엇을 하는 칩인지, 동작 전압과 주요 사양을 한눈에 봅니다.</li>
<li><strong>핀 배치(Pin Configuration)와 핀 설명표</strong>: 회로도의 핀 번호·이름을 여기와 맞춰 봅니다. 패키지에 따라 핀 번호가 다르니 회로도의 패키지와 같은 그림을 봐야 합니다.</li>
<li><strong>절대 최대 정격(Absolute Maximum Ratings)</strong>: 넘으면 손상되는 한계입니다. 정상 동작 조건(Recommended Operating Conditions)과 혼동하지 마세요.</li>
<li><strong>전기적 특성(Electrical Characteristics)</strong>: 실제 측정값과 비교할 기준입니다. 표의 조건(전압, 온도)을 함께 확인합니다.</li>
<li><strong>응용 회로(Typical Application)</strong>: 제조사가 권장하는 연결 예입니다. 회로도의 주변 부품(콘덴서, 저항 값)이 대부분 여기서 왔으므로, 도면과 비교하면 각 부품의 역할을 이해하기 쉽습니다.</li>
</ol>

<h2>읽는 순서 제안</h2>
<p>처음 보는 회로도는 ① 전원 입력에서 레귤레이터를 거쳐 각 전원이 만들어지는 흐름, ② 주 IC(MCU 등)와 그 클럭·리셋, ③ 커넥터에서 들어오고 나가는 신호 순서로 보면 전체 구조가 빨리 잡힙니다. 각 단계에서 전원 이름이나 신호 이름을 Schematic Viewer 목록에서 눌러 보면 어디까지 이어지는지 바로 확인할 수 있습니다. 부품 번호와 값 표기는 <a href="${href("learn/find-parts")}">부품 찾는 법</a>에 정리했습니다.</p>
`,
        }
      : {
          title: "Reading schematics and datasheets: the basics",
          description: "Wires and junctions, net labels, power and ground symbols, off-page ports, pin numbers versus pin names, active-low notation, and what to read first in a datasheet — explained for first-time readers.",
          body: `
<p>A schematic is a map of what connects to what. Where parts physically sit is the PCB layout's job; the schematic shows only connections and values. This article covers the conventions a first-time reader needs. Keep the <a href="${tool("#example")}">example schematic</a> open and look for each item as you read.</p>

<h2>Wires and junctions</h2>
<ul>
<li><strong>Wire</strong>: a line between part pins. Every pin joined by wires is electrically the same point; that group is a <strong>net</strong> (or node).</li>
<li><strong>Junction dot</strong>: a solid dot where lines meet means "connected here".</li>
<li><strong>Crossing without a dot</strong>: two lines crossing with no dot are <em>not</em> connected. Older drawings hop one line over the other with a small arc. To avoid ambiguity, modern practice dots T-junctions and avoids four-way joins.</li>
</ul>
<p>Clicking a wire in Schematic Viewer highlights the whole net, so you can confirm at once that a dotless crossing really isn't connected.</p>

<h2>Net labels: connecting without wires</h2>
<p>Drawing every connection as a line would turn the sheet into a spider's web. Instead a wire ends in a <strong>net label</strong> such as <code>SDA</code> or <code>ESP_EN</code>, and <strong>labels with the same name are connected even with no line between them</strong>. Hunting for every label with the same name is the slowest part of reading a schematic — exactly what Schematic Viewer does for you.</p>
<p>Names usually describe function. Names with <code>_N</code>, <code>#</code> or <code>/</code> are often active-low (see below), and <code>TX</code>/<code>RX</code> may be named from either side of the link, so check them against the pin names.</p>

<h2>Power and ground symbols</h2>
<ul>
<li><strong>Power symbols</strong>: an upward arrow or bar with a name such as <code>+3.3V</code>, <code>VCC</code> or <code>+5V</code>. As with net labels, the same name means the same net everywhere.</li>
<li><strong>Ground symbols</strong>: stacked lines getting shorter (<code>GND</code>), a triangle, or a rake. Some designs separate analog (<code>AGND</code>), digital (<code>DGND</code>) and chassis ground; different names are different nets, usually joined at one point through a bead or 0 Ω resistor.</li>
<li><strong>Look-alike names</strong>: <code>+3.3V</code> and <code>+3.3VA</code>, or <code>VCC</code> and <code>VCCIO</code>, are different supplies split off through a filter or switch. Know which one you are probing.</li>
</ul>

<h2>Connections across pages: ports and hierarchical sheets</h2>
<p>Multi-page schematics pass signals between pages with <strong>off-page connectors</strong> — a name inside an arrow or pentagon. The same name means connected, and the other page number is sometimes printed beside it.</p>
<p>Large designs use <strong>hierarchical sheets</strong>: a top page shows blocks such as "Power" or "MCU", and ports on a block's border connect to ports on its sub-page. Here the same name can be local to each block, so take care. Schematic Viewer joins named labels and ports across pages, but does not yet follow connections made only through unnamed block ports (see <a href="${href("help/formats")}">Supported files</a>).</p>

<h2>Symbols and pins</h2>
<ul>
<li><strong>Pin numbers and pin names</strong>: on an IC symbol the <em>pin number</em> (physical position, e.g. 12) is usually outside the body and the <em>pin name</em> (function, e.g. <code>GPIO4</code>) inside. Probe and solder by number; understand by name.</li>
<li><strong>Polarized parts</strong>: on a diode the bar the triangle points to is the cathode. Electrolytic capacitors show polarity with a <code>+</code> or a curved plate.</li>
<li><strong>Hidden pins</strong>: some libraries leave an IC's power and ground pins off the symbol and connect them by name. If you can't see a VCC pin, check the datasheet.</li>
</ul>

<h2>Active-low notation</h2>
<p>A signal that acts when it is at 0 V (low) is marked with a bar over its name or with <code>/</code>, <code>#</code>, <code>_N</code> or <code>n</code>. <code>RESET_N</code>, for example, resets the chip when low, so a pull-up resistor usually holds it high. The overbar is sometimes lost when exporting to PDF, so the pull-up or pull-down arrangement is the safer clue.</p>

<h2>What to read first in a datasheet</h2>
<p>When you meet an unfamiliar IC, look up its part number and read in this order:</p>
<ol class="steps">
<li><strong>Features on page one</strong>: what the chip does, its supply range and headline specs.</li>
<li><strong>Pin configuration and pin description table</strong>: match the schematic's pin numbers and names. Pinouts differ between packages, so use the drawing for the package on your schematic.</li>
<li><strong>Absolute maximum ratings</strong>: the limits beyond which damage occurs — not to be confused with the recommended operating conditions.</li>
<li><strong>Electrical characteristics</strong>: the reference for your measurements; note the test conditions (voltage, temperature).</li>
<li><strong>Typical application</strong>: the maker's recommended circuit. Most surrounding capacitor and resistor values on a schematic come from here, so comparing the two explains each part's job.</li>
</ol>

<h2>A suggested reading order</h2>
<p>For an unfamiliar schematic, follow ① the power input through the regulators to each supply, ② the main IC (an MCU, say) with its clock and reset, then ③ the signals entering and leaving through connectors. At each step, click the supply or signal name in Schematic Viewer's list to see how far it reaches. Reference designators and value notation are covered in <a href="${href("learn/find-parts")}">Finding parts</a>.</p>
`,
        },
};
