import type { PageDef } from "./index.ts";

/**
 * Site update log. One entry per successful deployment of the site (GitHub Pages deploy job,
 * completion time in KST), user-visible changes only. Entries are added after a deployment has
 * been confirmed, never in advance; internal changes (scoring, CI, docs) are left out.
 * The evidence for each entry (deploy run, commit, PR) is kept in the review records, not here.
 */
interface Entry {
  /** YYYY-MM-DD, KST, when the deploy job finished */
  date: string;
  ko: string;
  en: string;
}

const entries: Entry[] = [
  { date: "2026-10-15", ko: "글 페이지: 휴대폰에서 머리글을 한 줄로 줄이고, 메뉴를 메뉴 버튼 안에 넣었습니다.", en: "Articles: on phones the header is one row, with the page links in a menu button." },
  { date: "2026-10-15", ko: "첫 화면: 휴대폰에서도 머리글에 '도구 열기' 버튼이 보이고, 누르면 파일 선택 버튼(이미 도면이 열려 있으면 도면)으로 이동합니다.", en: "Home page: phones keep an 'Open the tool' button in the header; it takes you to the file button (or to the drawing when one is open)." },
  { date: "2026-10-15", ko: "휴대폰 화면: 도면을 위에, 노드·부품 목록을 아래 시트로 배치했습니다. 시트는 선택한 항목과 목록 세 줄이 보이는 높이로 열립니다.", en: "Phones: the drawing sits on top and the net and part lists in a sheet below, opened just tall enough for the selection and three rows." },
  { date: "2026-10-15", ko: "키보드 사용: 보이지 않는 파일 입력이 Tab 순서에서 빠지고, 도면이 없을 때 '건너뛰기' 링크가 파일 선택 버튼으로 이동합니다. 도면을 읽는 중에 다른 파일을 열면 잠시 안내가 나옵니다.", en: "Keyboard: the hidden file inputs left the Tab order, the skip link goes to the file button when no drawing is open, and opening another file while one is being read shows a short notice." },
  { date: "2026-10-14", ko: "파일 열기 화면의 영어 문구를 채우고, 개인정보처리방침·소개·FAQ의 광고 관련 설명을 실제 동작(현재 광고 없음)에 맞췄으며, 글별로 최종 수정일을 관리하도록 바꿨습니다.", en: "Completed the English wording on the open-file screen, matched what the privacy policy, about page and FAQ say about ads to what the site does (no ads at present), and changed the 'last updated' dates to be managed per article." },
  { date: "2026-10-10", ko: "문의 이메일 주소를 바꿨습니다.", en: "Changed the contact email address." },
  { date: "2026-10-10", ko: "글 페이지에서 소스 저장소와 이슈 링크를 뺐습니다.", en: "Removed the source repository and issue links from the articles." },
  { date: "2026-10-10", ko: "첫 화면과 파일 열기 화면을 단순하게 바꿨다가, 이전 디자인으로 되돌리고 어색한 한국어 문구만 다듬었습니다.", en: "Simplified the home and open-file screens, then went back to the previous design and only smoothed out awkward Korean wording." },
  { date: "2026-10-09", ko: "부품 값과 참조 번호를 짝짓는 방법을 개선했습니다(예제 회로도 전수 점검).", en: "Better pairing of part values with reference designators (from a full check of the example schematic)." },
  { date: "2026-10-09", ko: "문의 이메일을 표시하고, 방문 통계(Google Analytics)를 쓰기 시작했습니다.", en: "Added the contact email and started using visit statistics (Google Analytics)." },
  { date: "2026-10-09", ko: "글 페이지 10개(사용법·지원 형식·예제·부품 찾기·회로도 읽기·FAQ·소개·문의·개인정보처리방침·이용약관)와 예제 회로도(Olimex ESP32-PoE Rev.I)를 추가하고, 첫 화면 안내와 오류 안내를 넣었습니다.", en: "Added ten articles (guide, supported files, example, finding parts, reading schematics, FAQ, about, contact, privacy, terms) and an example schematic (Olimex ESP32-PoE Rev.I), plus first-screen hints and error messages." },
  { date: "2026-10-09", ko: "OrCAD PDF와 포트 기호를 읽고, 같은 이름 라벨을 차례로 따라가며, 휴대폰에서 두 손가락으로 확대할 수 있게 했습니다.", en: "OrCAD PDFs and port symbols are read, labels of the same name can be stepped through, and phones can pinch to zoom." },
  { date: "2026-10-09", ko: "검색 결과에서 정확히 일치하는 이름을 앞에 두고, 노드·부품 목록을 CSV로 저장할 수 있게 했습니다.", en: "Exact name matches come first in search, and the net and part lists can be saved as CSV." },
  { date: "2026-10-09", ko: "선택한 노드를 청록색으로 강조하고 나머지를 흐리게 했으며, 선택 정보를 목록 옆에 보여 줍니다. 휴대폰에서는 목록을 아래 시트로 엽니다.", en: "The selected net is highlighted in cyan with the rest dimmed, its details are shown beside the list, and phones open the list as a sheet." },
  { date: "2026-10-09", ko: "사이트 이름을 Schematic Viewer로 바꾸고, 한국어·영어 화면과 새 디자인을 적용했습니다.", en: "Renamed the site Schematic Viewer, with Korean and English screens and a new design." },
  { date: "2026-10-09", ko: "첫 화면에 소개·사용법·개인정보 안내를 추가했습니다.", en: "Added an introduction, usage notes and a privacy notice to the home page." },
  { date: "2026-10-08", ko: "여러 회로도 프로그램의 PDF를 분석하도록 개선하고, 원본 PDF를 그대로 그린 위에 강조만 겹쳐 보여 줍니다.", en: "PDFs from more schematic programs are analyzed, and the original PDF is drawn as is with only the highlight on top." },
  { date: "2026-10-08", ko: "사이트를 처음 공개했습니다: 회로도 PDF를 열어 배선을 누르면 같은 노드를 찾아 줍니다.", en: "First release: open a schematic PDF and click a wire to find the rest of its net." },
];

function list(lang: "ko" | "en"): string {
  const byDate = new Map<string, Entry[]>();
  for (const e of entries) byDate.set(e.date, [...(byDate.get(e.date) ?? []), e]);
  return [...byDate.entries()]
    .map(([date, es]) => `<h2>${date}</h2>\n<ul>\n${es.map((e) => `<li>${lang === "ko" ? e.ko : e.en}</li>`).join("\n")}\n</ul>`)
    .join("\n\n");
}

export const changelog: PageDef = {
  slug: "changelog",
  updated: "2026-10-15",
  cta: false,
  related: ["guide", "faq", "about"],
  content: ({ lang }) =>
    lang === "ko"
      ? {
          title: "업데이트 기록",
          description: "Schematic Viewer 사이트에 배포된 변경 사항을 배포한 날짜(한국 시간) 순으로 정리한 기록입니다.",
          body: `
<p>사이트에 실제로 배포된 변경 가운데 사용자에게 보이는 것만 적었습니다. 날짜는 배포가 끝난 한국 시간 기준이며, 배포를 확인한 뒤에 추가하므로 가장 최근 배포가 바로 보이지 않을 수 있습니다.</p>

${list("ko")}
`,
        }
      : {
          title: "Changelog",
          description: "Changes deployed to the Schematic Viewer site, by deployment date (Korea time).",
          body: `
<p>Only the changes you can see are listed, from deployments that actually reached the site. Dates are when the deployment finished, in Korea time; entries are added after a deployment has been checked, so the latest one may not be listed yet.</p>

${list("en")}
`,
        },
};
