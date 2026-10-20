import type { JaPage } from "./index.ts";
import { list } from "../changelog.ts";

// Japanese page of ../changelog.ts; the entries (with their ja text) live there, in one list.
export const changelog: JaPage = {
  updated: "2026-10-20",
  content: () => ({
    title: "更新履歴",
    description: "Schematic Viewer のサイトに反映された変更を、反映した日付（韓国時間）の順にまとめた記録です。",
    body: `
<p>サイトに実際に反映された変更のうち、利用者に見えるものだけを記載しています。日付は反映が完了した韓国時間で、反映を確認してから追加するため、最新の反映がすぐには表示されないことがあります。</p>

${list("ja")}
`,
  }),
};
