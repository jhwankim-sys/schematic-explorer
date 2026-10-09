import type { PageDef } from "./index.ts";

const REPO = "https://github.com/jhwankim-sys/schematic-explorer";

export const about: PageDef = {
  slug: "about",
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
<li><strong>언어</strong>: 한국어, English</li>
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
<p>이 과정은 그림에서 연결을 <em>추정</em>하는 것이므로 원본 넷리스트만큼 정확하지는 않습니다. 공개 회로도 묶음으로 매번 정확도를 채점하며 개선하고 있습니다. 한계와 해결 방법은 <a href="${href("help/formats")}">지원 형식과 오류 해결</a>에 정리했습니다.</p>

<h2>누가 만들었나요</h2>
<p>전자 회로를 다루는 개인 개발자가 운영합니다. 소스 코드는 <a href="${REPO}">GitHub</a>에서 볼 수 있고, 사이트는 GitHub Pages에서 정적 파일로 제공됩니다. 서버에서 실행되는 프로그램이나 데이터베이스는 없습니다.</p>
<p>사이트 운영 비용을 위해 광고를 게재할 수 있습니다. 광고는 도구의 기능이나 파일 처리 방식에 영향을 주지 않으며, 광고와 관련된 쿠키는 <a href="${href("privacy")}">개인정보처리방침</a>에 설명되어 있습니다.</p>

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
<li><strong>Languages</strong>: Korean, English</li>
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
<p>Because connections are <em>inferred</em> from a drawing, the result is not as exact as the original netlist. Accuracy is scored against a set of public schematics with every change. Limits and fixes are listed in <a href="${href("help/formats")}">Supported files and troubleshooting</a>.</p>

<h2>Who runs it</h2>
<p>An individual developer who works with electronics. The source code is on <a href="${REPO}">GitHub</a>, and the site is served as static files from GitHub Pages — there is no server-side program or database.</p>
<p>Ads may be shown to cover running costs. They do not affect the tool's features or how files are handled; related cookies are explained in the <a href="${href("privacy")}">privacy policy</a>.</p>

<h2>Get started</h2>
<p><a href="${tool()}">Open a schematic PDF</a>, or try the <a href="${tool("#example")}">example schematic</a> first. New users may like the <a href="${href("guide")}">guide</a>. Feedback and bug reports are welcome on the <a href="${href("contact")}">contact page</a>.</p>
`,
        },
};
