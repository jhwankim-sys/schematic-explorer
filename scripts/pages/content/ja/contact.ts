import type { JaPage } from "./index.ts";

// Translation of ../contact.ts.
export const contact: JaPage = {
  updated: "2026-10-16",
  content: ({ email, href }) => {
    const mail = email ? `<a href="mailto:${email}">${email}</a>` : "";
    return {
      title: "お問い合わせ",
      description: "Schematic Viewer についての質問、不具合の報告、機能の提案、広告・提携のお問い合わせを受け付けています。メールでご連絡ください。",
      body: `
<h2>連絡先</h2>
<ul>
<li><strong>メール</strong>：${mail || "お問い合わせ用のメールアドレスを準備しています。"}</li>
</ul>
<p>通常、営業日で数日以内に返信します。個人で運営しているサイトのため、遅れることがある点をご了承ください。返信は韓国語または英語になることがあります。</p>

<h2>不具合をお知らせいただくとき</h2>
<p>次の内容を一緒に書いていただくと、原因をずっと早く見つけられます。</p>
<ol class="steps">
<li><strong>症状</strong>：画面に表示されたメッセージ、または「A と B がつながって表示される」のような期待と違う点</li>
<li><strong>環境</strong>：端末（PC／スマートフォン）、OS、ブラウザとそのバージョン</li>
<li><strong>PDF の情報</strong>：作成した回路図ソフトとそのバージョン、カラー／白黒出力のどちらか</li>
<li><strong>再現できる資料</strong>：同じ症状が出る<em>公開</em>回路図（オープンハードウェアなど）のリンク、または該当部分のスクリーンショット</li>
</ol>
<div class="note"><p><strong>機密の図面は送らないでください。</strong>Schematic Viewer はファイルをサーバーに送信しないため、このサイトを通じて運営者が皆さんのファイルを見ることはできません。会社の図面や顧客の図面をメールに添付せず、公開されている図面や機密部分を隠したスクリーンショットでお知らせください。</p></div>

<h2>このようなお問い合わせを受け付けます</h2>
<ul>
<li>使い方についての質問（まず<a href="${href("faq")}">よくある質問</a>をご確認ください）</li>
<li>解析の誤り、表示の崩れなどの不具合報告</li>
<li>対応してほしい回路図ソフトや機能の提案</li>
<li>個人情報の取り扱いに関するお問い合わせとご依頼</li>
<li>広告、提携、その他のお問い合わせ</li>
</ul>
`,
    };
  },
};
