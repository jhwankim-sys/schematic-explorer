import type { PageDef } from "./index.ts";
import { SCORE_RUN, scoreTable } from "./corpus-scores.ts";

export const about: PageDef = {
  slug: "about",
  updated: "2026-11-12",
  related: ["guide", "faq", "contact"],
  content: ({ lang, href, tool }) =>
    lang === "ko"
      ? {
          title: "Schematic Viewer 소개",
          description: "Schematic Viewer는 회로도 PDF를 브라우저에서 열어 연결된 배선을 강조하고, 같은 이름 라벨과 부품을 찾아 주는 무료 도구입니다. 만든 이유와 동작 방식, 한계를 소개합니다.",
          body: `
<h2>무엇을 하는 도구인가요</h2>
<p>Schematic Viewer는 <strong>회로도 PDF를 여는 웹 도구</strong>입니다. 배선 하나를 누르면 그 배선과 전기적으로 연결된 모든 선과 핀을 강조하고, 같은 이름의 넷 라벨과 전원 기호를 모아 차례로 찾아가게 해 줍니다. 부품 번호나 값으로 검색하고, 노드·부품 목록을 CSV로 저장할 수도 있습니다.</p>
<ul>
<li><strong>지원 형식</strong>: KiCad, Altium, Eagle, OrCAD 등 회로도 프로그램에서 내보낸 PDF</li>
<li><strong>파일 처리</strong>: 모든 분석은 브라우저 안에서 이루어지며, 파일은 서버로 전송되거나 저장되지 않습니다</li>
<li><strong>비용</strong>: 무료, 가입 없음</li>
<li><strong>언어</strong>: 한국어, English, 日本語</li>
</ul>

<h2>왜 만들었나요</h2>
<p>회로도를 PDF로 받으면 원본 CAD 없이 연결을 따라가기가 어렵습니다. 같은 이름의 라벨이 여러 페이지에 흩어져 있고, PDF 뷰어의 검색은 글자만 찾을 뿐 "이 배선이 어디까지 이어지는지"는 알려 주지 않습니다. 수리, 설계 검토, 공부를 하다 보면 이 작업에 많은 시간이 듭니다.</p>
<p>Schematic Viewer는 이 반복 작업을 줄이려고 만들었습니다. 특히 사내 도면처럼 외부로 보낼 수 없는 파일도 쓸 수 있도록, 처음부터 <strong>파일이 내 기기를 떠나지 않는 구조</strong>로 설계했습니다.</p>

<h2>어떻게 동작하나요</h2>
<ol class="steps">
<li>브라우저가 PDF를 읽어 선(벡터 경로)과 글자(텍스트 레이어)를 꺼냅니다. PDF 처리에는 Mozilla의 오픈소스 PDF.js를 사용합니다.</li>
<li>선의 굵기·색·모양으로 배선과 부품 기호를 구분하고, 끝점과 접점을 이어 노드를 만듭니다.</li>
<li>배선 끝에 붙은 글자를 넷 라벨로, 부품 근처의 글자를 참조 번호와 값으로 읽어 이름을 붙입니다. Altium·OrCAD처럼 PDF 안에 연결·부품 정보를 함께 넣는 경우 그 정보로 결과를 보정합니다.</li>
<li>결과를 도면 위에 겹쳐 그려, 누르는 곳의 노드를 강조합니다.</li>
</ol>
<p>이 과정은 그림에서 연결을 <em>추정</em>하는 것이므로 원본 넷리스트만큼 정확하지는 않습니다.</p>

<h2>어떻게 시험하나요</h2>
<p>분석 규칙을 바꿀 때마다, CAD 원본이 공개된 회로도로 결과를 채점합니다. 변경 요청(PR)이 올라오면 GitHub Actions가 자동으로 같은 채점을 실행하고, 점수 변화를 확인한 뒤에 반영합니다.</p>
<ul>
<li><strong>채점하는 회로도 11개</strong>: Olimex의 공개 보드 10개(KiCad 5·7)와 Adafruit 보드 1개(Eagle). 각 PDF를 분석한 결과를 각 보드 저장소에 공개된 CAD 원본에서 뽑은 정답 연결과 비교합니다. 이 사이트의 예제(Olimex ESP32-PoE rev. I)도 여기에 들어 있습니다.</li>
<li><strong>채점에 넣지 않는 샘플 3개</strong>: 글자를 선으로 그린 Eagle 도면, Altium Smart PDF, 문서용으로 다시 그린 도면은 개발자 PC에서만 확인하며 자동 채점 점수에는 들어가지 않습니다.</li>
<li><strong>2026-11-03 기준 평균(11개)</strong>: 정답 넷을 거의 그대로(양쪽 95% 이상 일치) 찾아낸 비율 97.6%, 이름이 보이는 넷의 이름을 맞힌 비율 97.8%, 참조 번호로 부품을 찾은 비율 96.8%, 찾은 부품의 값을 맞힌 비율 95.4%. 같은 도면을 흑백으로 바꿔 채점하면 각각 87.7%, 87.2%, 91.6%, 74.4%로 낮아집니다. 컬러로 내보내기를 권하는 이유입니다.</li>
</ul>
<p>이 점수는 위 공개 회로도에 대한 결과일 뿐, 모든 회로도에서 같은 정확도를 보장하지 않습니다. 회사마다 도면 그리는 방식이 달라 처음 보는 형식에서는 더 낮을 수 있습니다.</p>
<h3>표본별 점수와 계산 방법</h3>
<p>아래 표가 위 평균의 근거입니다. 같은 결과가 <a href="${SCORE_RUN.ci}">GitHub Actions 채점 실행</a>(${SCORE_RUN.date})에 남아 있고, 같은 코드로 다시 실행하면 같은 표가 나옵니다. 표본 목록과 CAD 원본의 저장소·커밋은 <a href="${SCORE_RUN.manifest}">corpus/manifest.json</a>에 있고, 표의 회로도 이름은 해당 커밋으로 연결됩니다.</p>
<ul>
<li><strong>넷 정확</strong>: CAD 원본의 넷 가운데, 도구가 찾은 넷과 배선 길이 기준으로 양쪽 95% 이상 겹치는 넷의 비율</li>
<li><strong>이름 정확</strong>: 원본에서 라벨·전원 기호로 이름이 보이는 넷 가운데 같은 이름을 붙인 비율</li>
<li><strong>부품 찾음</strong>: 원본에 놓인 참조 번호 가운데 도구 목록에 있는 비율</li>
<li><strong>값 정확</strong>: 찾은 부품 가운데 첫 번째 값이 원본의 값 필드와 같은 비율. Adafruit 표본은 채점 도구가 이 원본 형식에서 값을 읽지 않아 빈칸(–)이며 평균에서도 뺐습니다.</li>
<li><strong>평균</strong>: 표본 11개(값 정확은 10개)의 단순 평균입니다. 표본마다 넷·부품 수가 달라도 같은 비중으로 셉니다.</li>
<li><strong>흑백</strong>: 같은 PDF의 모든 선을 검은색으로 바꿔 흑백 인쇄본처럼 만든 뒤 같은 방법으로 채점한 결과입니다.</li>
</ul>
<p><strong>컬러 PDF (%)</strong></p>
${scoreTable("ko", "colour")}
<p><strong>흑백으로 바꾼 PDF (%)</strong></p>
${scoreTable("ko", "mono")}
<p>채점에 넣지 않은 표본 3개(Arduino Uno R3(Eagle 6, 글자를 선으로 그림), STM32F4DISCOVERY MB997(Altium Smart PDF), STEVAL-IDS001V5(문서용으로 다시 그린 도면))는 파일을 저장소에 넣지 않고 개발자 PC에서만 확인하므로 위 표와 평균에 들어 있지 않습니다.</p>


<h2>알려진 한계</h2>
<ul>
<li>스캔·사진·캡처로 만든 PDF는 분석할 수 없습니다(도면 보기만 가능).</li>
<li>글자를 선으로 그린 PDF는 노드 이름과 이름 검색이 제한됩니다.</li>
<li>흑백 PDF는 부품 선이 배선으로 잡혀 서로 다른 노드가 합쳐질 수 있습니다.</li>
<li>이름 없이 페이지를 넘어가는 연결(계층 시트 포트 등)은 따라가지 못합니다.</li>
<li>부품(저항, 스위치, 페라이트 비드 등)을 거친 연결은 같은 노드로 묶지 않습니다.</li>
</ul>
<p>증상별 확인 방법은 <a href="${href("help/formats")}">지원 형식과 오류 해결</a>에, 실제 화면으로 결과를 확인하는 과정은 <a href="${href("learn/example")}">예제로 따라 하기</a>에 정리했습니다.</p>

<h2>소스 코드와 문의</h2>
<p>사이트와 분석 코드, 채점 도구의 소스는 <a href="https://github.com/jhwankim-sys/schematic-explorer">GitHub 저장소</a>에서 볼 수 있고, 사이트에 반영된 변경은 <a href="${href("changelog")}">업데이트 기록</a>에 정리합니다. 잘못 분석되는 공개 회로도나 오류는 <a href="${href("contact")}">문의</a>로 알려 주세요.</p>

<h2>누가 만들었나요</h2>
<p>전자 회로를 다루는 개인 개발자가 운영합니다. 사이트는 GitHub Pages에서 정적 파일로 제공됩니다. 서버에서 실행되는 프로그램이나 데이터베이스는 없습니다.</p>
<p>현재 사이트에는 광고가 없습니다. 운영 비용을 위해 앞으로 광고를 도입할 수 있으며, 그때는 시작하기 전에 관련 쿠키와 처리하는 정보를 <a href="${href("privacy")}">개인정보처리방침</a>에 먼저 공개합니다.</p>

<h2>시작하기</h2>
<p><a href="${tool()}">회로도 PDF 열기</a>로 바로 시작하거나, <a href="${tool("#example")}">예제 회로도</a>로 먼저 체험해 보세요. 처음이라면 <a href="${href("guide")}">사용법 가이드</a>를 추천합니다. 의견이나 오류 제보는 <a href="${href("contact")}">문의</a> 페이지로 보내 주세요.</p>
`,
        }
      : {
          title: "About Schematic Viewer",
          description: "Schematic Viewer is a free browser tool that opens schematic PDFs, highlights connected wires and finds every label and part with the same name. Why it exists, how it works and where its limits are.",
          body: `
<h2>What it does</h2>
<p>Schematic Viewer is a <strong>web tool for opening schematic PDFs</strong>. Click a wire and every line and pin electrically connected to it is highlighted; labels and power symbols with the same name are gathered so you can step through them. You can search by reference or value and save the net and part lists as CSV.</p>
<ul>
<li><strong>Supported files</strong>: PDFs exported from schematic programs such as KiCad, Altium, Eagle and OrCAD</li>
<li><strong>File handling</strong>: all analysis happens in your browser; files are never uploaded or stored on a server</li>
<li><strong>Cost</strong>: free, no sign-up</li>
<li><strong>Languages</strong>: Korean, English, Japanese</li>
</ul>

<h2>Why it exists</h2>
<p>A schematic received as a PDF is hard to trace without the original CAD files. Labels with the same name are scattered across pages, and a PDF reader's search finds text but can't tell you how far a wire reaches. Repairs, design reviews and study all spend a lot of time on this.</p>
<p>Schematic Viewer was built to cut that repetitive work. So that it can be used even for drawings that may not leave a company, it was designed from the start so that <strong>your file never leaves your device</strong>.</p>

<h2>How it works</h2>
<ol class="steps">
<li>The browser reads the PDF and extracts its lines (vector paths) and text (text layer), using Mozilla's open-source PDF.js.</li>
<li>Line width, colour and shape separate wires from symbols, and end points and junctions are joined into nets.</li>
<li>Text at wire ends is read as net labels, and text near parts as references and values. When the PDF also carries connection or part data — as Altium and OrCAD exports can — that data is used to correct the result.</li>
<li>The result is drawn over the sheet, and the net under your click is highlighted.</li>
</ol>
<p>Because connections are <em>inferred</em> from a drawing, the result is not as exact as the original netlist.</p>

<h2>How it is tested</h2>
<p>Every change to the analysis rules is scored on schematics whose CAD source is public. When a change is proposed (a pull request), GitHub Actions runs the same scoring automatically, and the change in scores is checked before the change is merged.</p>
<ul>
<li><strong>11 scored schematics</strong>: ten open boards from Olimex (KiCad 5 and 7) and one Adafruit board (Eagle). The analysis of each PDF is compared with the true connections extracted from the CAD source published in each board's repository. This site's example (Olimex ESP32-PoE rev. I) is one of them.</li>
<li><strong>3 samples not in the score</strong>: an Eagle drawing with its lettering drawn as lines, an Altium Smart PDF and a drawing redrawn for documentation are only checked on the developer's PC and are not part of the automatic score.</li>
<li><strong>Averages over the 11, as of 2026-11-03</strong>: true nets recovered almost exactly (at least 95% match both ways) 97.6%; visibly named nets given the right name 97.8%; parts found by reference 96.8%; values right for the parts found 95.4%. Scored as black-and-white copies of the same drawings, these drop to 87.7%, 87.2%, 91.6% and 74.4% — which is why colour exports are recommended.</li>
</ul>
<p>These scores describe the public schematics above; they do not promise the same accuracy on every drawing. Drawing styles differ between companies, and an unfamiliar style can score lower.</p>
<h3>Scores per sample and how they are calculated</h3>
<p>The tables below are the basis of the averages above. The same results are kept in the <a href="${SCORE_RUN.ci}">GitHub Actions scoring run</a> (${SCORE_RUN.date}), and running the same code again gives the same tables. The sample list with each CAD source's repository and commit is in <a href="${SCORE_RUN.manifest}">corpus/manifest.json</a>; each schematic name links to that commit.</p>
<ul>
<li><strong>Nets exact</strong>: the share of the CAD source's nets matched by a net the tool found, at least 95% both ways by wire length</li>
<li><strong>Names right</strong>: the share of nets visibly named by a label or power symbol in the source that got the same name</li>
<li><strong>Parts found</strong>: the share of references placed in the source that appear in the tool's list</li>
<li><strong>Values right</strong>: the share of found parts whose first value equals the source's value field. The Adafruit sample is blank (–) because the scorer does not read values from that source format, and it is left out of the average.</li>
<li><strong>Average</strong>: a plain mean over the 11 samples (10 for values), each sample counting equally whatever its number of nets or parts.</li>
<li><strong>Black and white</strong>: the same PDFs with every line turned black, like a black-and-white print, scored the same way.</li>
</ul>
<p><strong>Colour PDFs (%)</strong></p>
${scoreTable("en", "colour")}
<p><strong>Converted to black and white (%)</strong></p>
${scoreTable("en", "mono")}
<p>The 3 samples outside the score — Arduino Uno R3 (Eagle 6, lettering drawn as lines), STM32F4DISCOVERY MB997 (Altium Smart PDF) and STEVAL-IDS001V5 (redrawn for documentation) — are kept out of the repository and only checked on the developer's PC, so they are not in these tables or averages.</p>


<h2>Known limitations</h2>
<ul>
<li>Scanned, photographed or captured PDFs cannot be analyzed (the drawing can only be viewed).</li>
<li>PDFs with lettering drawn as lines limit net names and name search.</li>
<li>In black-and-white PDFs, symbol lines can be taken for wires and different nets can merge.</li>
<li>Connections that leave a page without a name (hierarchical sheet ports and the like) are not followed.</li>
<li>Connections through a part (resistor, switch, ferrite bead …) are not merged into one net.</li>
</ul>
<p>How to check each symptom is in <a href="${href("help/formats")}">Supported files and troubleshooting</a>, and a worked check with real screenshots is in the <a href="${href("learn/example")}">step-by-step example</a>.</p>

<h2>Source code and contact</h2>
<p>The source of the site, the analysis and the scoring tools is on <a href="https://github.com/jhwankim-sys/schematic-explorer">GitHub</a>, and changes that reach the site are listed in the <a href="${href("changelog")}">changelog</a>. Please report public schematics that analyze wrongly, or any errors, through the <a href="${href("contact")}">contact page</a>.</p>

<h2>Who runs it</h2>
<p>An individual developer who works with electronics. The site is served as static files from GitHub Pages — there is no server-side program or database.</p>
<p>The site currently shows no ads. Ads may be introduced later to cover running costs; if so, the cookies and information involved will be described in the <a href="${href("privacy")}">privacy policy</a> before they start.</p>

<h2>Get started</h2>
<p><a href="${tool()}">Open a schematic PDF</a>, or try the <a href="${tool("#example")}">example schematic</a> first. New users may like the <a href="${href("guide")}">guide</a>. Feedback and bug reports are welcome on the <a href="${href("contact")}">contact page</a>.</p>
`,
        },
};
