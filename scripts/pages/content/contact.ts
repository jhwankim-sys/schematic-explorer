import type { PageDef } from "./index.ts";

export const contact: PageDef = {
  slug: "contact",
  cta: false,
  related: ["faq", "help/formats", "about"],
  content: ({ lang, email, href }) => {
    const mail = email ? `<a href="mailto:${email}">${email}</a>` : "";
    return lang === "ko"
      ? {
          title: "문의",
          description: "Schematic Viewer에 대한 질문, 오류 제보, 기능 제안, 광고·제휴 문의를 받는 곳입니다. 이메일로 연락해 주세요.",
          body: `
<h2>연락처</h2>
<ul>
<li><strong>이메일</strong>: ${mail || "문의용 이메일 주소를 준비하고 있습니다."}</li>
</ul>
<p>보통 영업일 기준 며칠 안에 답장을 드립니다. 개인이 운영하는 사이트라 늦어질 수 있는 점 양해 부탁드립니다.</p>

<h2>오류를 알려 주실 때</h2>
<p>다음 내용을 함께 적어 주시면 원인을 훨씬 빨리 찾을 수 있습니다.</p>
<ol class="steps">
<li><strong>증상</strong>: 화면에 나온 안내 문구, 또는 "A와 B가 연결되어 나온다"처럼 기대와 다른 점</li>
<li><strong>환경</strong>: 기기(PC/휴대폰), 운영체제, 브라우저와 버전</li>
<li><strong>PDF 정보</strong>: 만든 회로도 프로그램과 버전, 컬러/흑백 출력 여부</li>
<li><strong>재현 자료</strong>: 같은 증상이 나는 <em>공개</em> 회로도(오픈 하드웨어 등)의 링크나, 해당 부분의 스크린숏</li>
</ol>
<div class="note"><p><strong>기밀 도면은 보내지 마세요.</strong> Schematic Viewer는 파일을 서버로 전송하지 않으므로, 이 사이트를 통해서는 운영자가 여러분의 파일을 볼 수 없습니다. 회사 도면이나 고객 도면을 이메일에 첨부하지 마시고, 공개 도면이나 민감한 부분을 가린 스크린숏으로 알려 주세요.</p></div>

<h2>이런 문의를 받습니다</h2>
<ul>
<li>사용 방법에 대한 질문 (먼저 <a href="${href("faq")}">자주 묻는 질문</a>을 확인해 주세요)</li>
<li>분석 오류, 화면 깨짐 등 버그 제보</li>
<li>지원했으면 하는 회로도 프로그램이나 기능 제안</li>
<li>개인정보 처리에 관한 문의와 요청</li>
<li>광고, 제휴, 기타 문의</li>
</ul>
`,
        }
      : {
          title: "Contact",
          description: "Questions, bug reports, feature ideas and business enquiries about Schematic Viewer. Reach us by email.",
          body: `
<h2>How to reach us</h2>
<ul>
<li><strong>Email</strong>: ${mail || "A contact email address is being set up."}</li>
</ul>
<p>We usually reply within a few working days. The site is run by one person, so please allow for occasional delays.</p>

<h2>Reporting a problem</h2>
<p>Including the following makes the cause much quicker to find:</p>
<ol class="steps">
<li><strong>Symptom</strong>: the message shown, or what differs from what you expected ("A and B appear connected")</li>
<li><strong>Environment</strong>: device (PC or phone), operating system, browser and version</li>
<li><strong>About the PDF</strong>: the schematic program and version that made it, colour or black-and-white export</li>
<li><strong>Something to reproduce it</strong>: a link to a <em>public</em> schematic (open hardware, for example) showing the same problem, or a screenshot of the area</li>
</ol>
<div class="note"><p><strong>Please don't send confidential drawings.</strong> Schematic Viewer never uploads your file, so the operator cannot see it through this site. Don't attach company or customer schematics to your email — use a public drawing or a screenshot with sensitive parts hidden.</p></div>

<h2>What you can contact us about</h2>
<ul>
<li>How to use the tool (please check the <a href="${href("faq")}">FAQ</a> first)</li>
<li>Bug reports — wrong analysis, broken display</li>
<li>Requests for schematic programs or features to support</li>
<li>Questions and requests about personal data</li>
<li>Advertising, partnerships and anything else</li>
</ul>
`,
        };
  },
};
