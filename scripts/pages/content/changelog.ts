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
  /** Japanese (translation of ko, not reviewed by a native speaker) */
  ja: string;
}

const entries: Entry[] = [
  { date: "2026-10-22", ko: "PDF를 읽고 분석하는 작업을 페이지와 따로 동작하는 백그라운드 처리(Web Worker)에서 하도록 바꿨습니다. 파일이 이 브라우저 안에서만 처리되는 것은 그대로입니다.", en: "Reading and analyzing a PDF now runs in a background worker (Web Worker) separate from the page; files are still processed only in this browser.", ja: "PDF の読み込みと解析を、ページとは別に動くバックグラウンド処理（Web Worker）で行うように変えました。ファイルがこのブラウザの中だけで処理されることは変わりません。" },
  { date: "2026-10-22", ko: "도구 화면의 설명 문구에 지원 언어로 일본어를 추가하고, 링크를 공유할 때 쓰이는 제목·설명 정보를 넣었습니다.", en: "The tool page's description now lists Japanese among the supported languages, and the page provides a title and description for link previews.", ja: "ツール画面の説明文の対応言語に日本語を加え、リンクを共有するときに使われるタイトルと説明の情報を入れました。" },
  { date: "2026-10-22", ko: "사이트에 쓰인 오픈소스 소프트웨어의 라이선스 고지(/third-party-licenses.txt)를 공개하고, 이용약관에서 링크했습니다.", en: "Published the licence notices of the open-source software used by the site (/third-party-licenses.txt), linked from the terms of use.", ja: "サイトで使われているオープンソースソフトウェアのライセンス表示（/third-party-licenses.txt）を公開し、利用規約からリンクしました。" },
  { date: "2026-10-21", ko: "사용법·FAQ·소개 등 글 페이지 11개에 일본어판(/ja/)을 추가했습니다.", en: "Added Japanese versions (/ja/) of the 11 articles, including the guide, FAQ and about page.", ja: "使い方・FAQ・概要など 11 件の記事ページに日本語版（/ja/）を追加しました。" },
  { date: "2026-10-20", ko: "iPhone(Safari)에서 언어 메뉴의 항목을 눌러도 언어가 바뀌지 않던 문제를 고쳤습니다.", en: "Fixed the language menu on iPhone (Safari), where tapping a language did not change it.", ja: "iPhone（Safari）で言語メニューの項目を押しても言語が切り替わらなかった問題を修正しました。" },
  { date: "2026-10-16", ko: "도구와 첫 화면에 일본어(日本語)를 추가하고, 언어 선택을 메뉴 하나(한국어 / English / 日本語)로 바꿨습니다.", en: "Added Japanese to the tool and the home page; the language choice is now one menu (한국어 / English / 日本語).", ja: "ツールと最初の画面に日本語を追加し、言語の選択を 1 つのメニュー（한국어 / English / 日本語）にまとめました。" },
  { date: "2026-10-15", ko: "이 업데이트 기록 페이지를 추가했습니다(첫 화면과 글 페이지 아래쪽 링크).", en: "Added this changelog page (linked at the bottom of the home page and the articles).", ja: "この更新履歴ページを追加しました（最初の画面と記事ページの下部にリンク）。" },
  { date: "2026-10-15", ko: "휴대폰·태블릿 터치: 탭한 곳 가까이에 서로 다른 노드의 배선이 비슷한 거리로 여러 개 있으면, 고를 수 있는 목록을 보여 줍니다(마우스·펜은 그대로).", en: "Touch on phones and tablets: when wires of different nets are about equally close to a tap, a short list lets you pick one (mouse and pen unchanged).", ja: "スマートフォン・タブレットのタッチ操作：タップした場所の近くに別々のネットの配線が同じくらいの距離で複数あると、選べる一覧を表示します（マウス・ペンはこれまでどおり）。" },
  { date: "2026-10-15", ko: "글 페이지: 휴대폰에서 머리글을 한 줄로 줄이고, 메뉴를 메뉴 버튼 안에 넣었습니다.", en: "Articles: on phones the header is one row, with the page links in a menu button.", ja: "記事ページ：スマートフォンでヘッダーを 1 行にまとめ、ページへのリンクをメニューボタンの中に入れました。" },
  { date: "2026-10-15", ko: "첫 화면: 휴대폰에서도 머리글에 '도구 열기' 버튼이 보이고, 누르면 파일 선택 버튼(이미 도면이 열려 있으면 도면)으로 이동합니다.", en: "Home page: phones keep an 'Open the tool' button in the header; it takes you to the file button (or to the drawing when one is open).", ja: "最初の画面：スマートフォンでもヘッダーに「ツールを開く」ボタンが表示され、押すとファイル選択ボタン（すでに図面を開いているときは図面）へ移動します。" },
  { date: "2026-10-15", ko: "휴대폰 화면: 도면을 위에, 노드·부품 목록을 아래 시트로 배치했습니다. 시트는 선택한 항목과 목록 세 줄이 보이는 높이로 열립니다.", en: "Phones: the drawing sits on top and the net and part lists in a sheet below, opened just tall enough for the selection and three rows.", ja: "スマートフォンの画面：図面を上に、ネット・部品の一覧を下のシートに配置しました。シートは、選択した項目と一覧 3 行が見える高さで開きます。" },
  { date: "2026-10-15", ko: "키보드 사용: 보이지 않는 파일 입력이 Tab 순서에서 빠지고, 도면이 없을 때 '건너뛰기' 링크가 파일 선택 버튼으로 이동합니다. 도면을 읽는 중에 다른 파일을 열면 잠시 안내가 나옵니다.", en: "Keyboard: the hidden file inputs left the Tab order, the skip link goes to the file button when no drawing is open, and opening another file while one is being read shows a short notice.", ja: "キーボード操作：見えないファイル入力を Tab の順序から外し、図面がないときは「スキップ」リンクがファイル選択ボタンへ移動します。図面の読み込み中に別のファイルを開くと、短い案内が表示されます。" },
  { date: "2026-10-14", ko: "파일 열기 화면의 영어 문구를 채우고, 개인정보처리방침·소개·FAQ의 광고 관련 설명을 실제 동작(현재 광고 없음)에 맞췄으며, 글별로 최종 수정일을 관리하도록 바꿨습니다.", en: "Completed the English wording on the open-file screen, matched what the privacy policy, about page and FAQ say about ads to what the site does (no ads at present), and changed the 'last updated' dates to be managed per article.", ja: "ファイルを開く画面の英語の文言を補い、プライバシーポリシー・概要・FAQ の広告に関する説明を実際の動作（現在広告なし）に合わせ、記事ごとに最終更新日を管理するように変えました。" },
  { date: "2026-10-10", ko: "문의 이메일 주소를 바꿨습니다.", en: "Changed the contact email address.", ja: "お問い合わせ用のメールアドレスを変更しました。" },
  { date: "2026-10-10", ko: "글 페이지에서 소스 저장소와 이슈 링크를 뺐습니다.", en: "Removed the source repository and issue links from the articles.", ja: "記事ページからソースリポジトリと Issue へのリンクを外しました。" },
  { date: "2026-10-10", ko: "첫 화면과 파일 열기 화면을 단순하게 바꿨다가, 이전 디자인으로 되돌리고 어색한 한국어 문구만 다듬었습니다.", en: "Simplified the home and open-file screens, then went back to the previous design and only smoothed out awkward Korean wording.", ja: "最初の画面とファイルを開く画面をシンプルにした後、以前のデザインに戻し、不自然な韓国語の文言だけを整えました。" },
  { date: "2026-10-09", ko: "부품 값과 참조 번호를 짝짓는 방법을 개선했습니다(예제 회로도 전수 점검).", en: "Better pairing of part values with reference designators (from a full check of the example schematic).", ja: "部品の値とリファレンス番号を結び付ける方法を改善しました（例題の回路図を全数点検）。" },
  { date: "2026-10-09", ko: "문의 이메일을 표시하고, 방문 통계(Google Analytics)를 쓰기 시작했습니다.", en: "Added the contact email and started using visit statistics (Google Analytics).", ja: "お問い合わせ用のメールアドレスを表示し、アクセス統計（Google Analytics）を使い始めました。" },
  { date: "2026-10-09", ko: "글 페이지 10개(사용법·지원 형식·예제·부품 찾기·회로도 읽기·FAQ·소개·문의·개인정보처리방침·이용약관)와 예제 회로도(Olimex ESP32-PoE Rev.I)를 추가하고, 첫 화면 안내와 오류 안내를 넣었습니다.", en: "Added ten articles (guide, supported files, example, finding parts, reading schematics, FAQ, about, contact, privacy, terms) and an example schematic (Olimex ESP32-PoE Rev.I), plus first-screen hints and error messages.", ja: "記事ページ 10 件（使い方・対応形式・例題・部品を探す・回路図の読み方・FAQ・概要・お問い合わせ・プライバシーポリシー・利用規約）と例題の回路図（Olimex ESP32-PoE Rev.I）を追加し、最初の画面の案内とエラーの案内を入れました。" },
  { date: "2026-10-09", ko: "OrCAD PDF와 포트 기호를 읽고, 같은 이름 라벨을 차례로 따라가며, 휴대폰에서 두 손가락으로 확대할 수 있게 했습니다.", en: "OrCAD PDFs and port symbols are read, labels of the same name can be stepped through, and phones can pinch to zoom.", ja: "OrCAD の PDF とポート記号を読み取り、同じ名前のラベルを順にたどれるようにし、スマートフォンで 2 本の指で拡大できるようにしました。" },
  { date: "2026-10-09", ko: "검색 결과에서 정확히 일치하는 이름을 앞에 두고, 노드·부품 목록을 CSV로 저장할 수 있게 했습니다.", en: "Exact name matches come first in search, and the net and part lists can be saved as CSV.", ja: "検索結果で完全に一致する名前を先頭に置き、ネット・部品の一覧を CSV で保存できるようにしました。" },
  { date: "2026-10-09", ko: "선택한 노드를 청록색으로 강조하고 나머지를 흐리게 했으며, 선택 정보를 목록 옆에 보여 줍니다. 휴대폰에서는 목록을 아래 시트로 엽니다.", en: "The selected net is highlighted in cyan with the rest dimmed, its details are shown beside the list, and phones open the list as a sheet.", ja: "選択したネットを青緑色で強調して残りを薄く表示し、選択情報を一覧の横に表示します。スマートフォンでは一覧を下のシートで開きます。" },
  { date: "2026-10-09", ko: "사이트 이름을 Schematic Viewer로 바꾸고, 한국어·영어 화면과 새 디자인을 적용했습니다.", en: "Renamed the site Schematic Viewer, with Korean and English screens and a new design.", ja: "サイト名を Schematic Viewer に変え、韓国語・英語の画面と新しいデザインを適用しました。" },
  { date: "2026-10-09", ko: "첫 화면에 소개·사용법·개인정보 안내를 추가했습니다.", en: "Added an introduction, usage notes and a privacy notice to the home page.", ja: "最初の画面に紹介・使い方・個人情報の案内を追加しました。" },
  { date: "2026-10-08", ko: "여러 회로도 프로그램의 PDF를 분석하도록 개선하고, 원본 PDF를 그대로 그린 위에 강조만 겹쳐 보여 줍니다.", en: "PDFs from more schematic programs are analyzed, and the original PDF is drawn as is with only the highlight on top.", ja: "より多くの回路図ソフトの PDF を解析できるように改善し、元の PDF をそのまま描いた上に強調だけを重ねて表示します。" },
  { date: "2026-10-08", ko: "사이트를 처음 공개했습니다: 회로도 PDF를 열어 배선을 누르면 같은 노드를 찾아 줍니다.", en: "First release: open a schematic PDF and click a wire to find the rest of its net.", ja: "サイトを初めて公開しました：回路図 PDF を開いて配線を押すと、同じネットを見つけます。" },
];

/** the entries as HTML, newest date first (also used by the Japanese page, ja/changelog.ts) */
export function list(lang: "ko" | "en" | "ja"): string {
  const byDate = new Map<string, Entry[]>();
  for (const e of entries) byDate.set(e.date, [...(byDate.get(e.date) ?? []), e]);
  return [...byDate.entries()]
    .map(([date, es]) => `<h2>${date}</h2>\n<ul>\n${es.map((e) => `<li>${e[lang]}</li>`).join("\n")}\n</ul>`)
    .join("\n\n");
}

export const changelog: PageDef = {
  slug: "changelog",
  updated: "2026-10-22",
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
