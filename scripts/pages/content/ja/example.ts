import type { JaPage } from "./index.ts";
import { fig } from "../example.ts";

// Translation of ../example.ts. The numbers and screenshots are the same checks as the Korean text
// (screenshots of the Japanese UI); re-check them together when the analysis engine changes.
export const example: JaPage = {
  updated: "2026-11-03",
  content: ({ href, tool }) => ({
    title: "例題でやってみる：ESP32-PoE の回路図を探索",
    description: "オープンハードウェアの Olimex ESP32-PoE の回路図で、電源ネット、ESP_EN 信号、部品 R1、CSV 書き出しを実際の画面とともにたどり、結果を元の図面でどう確かめるかをまとめました。",
    body: `
<p>この記事は、<a href="${tool("#example")}">例題の回路図</a>を開いた状態で進められるように作りました。例題は、ブルガリアの Olimex が Apache 2.0 ライセンスで公開している <strong>ESP32-PoE</strong> ボード（リビジョン I）の回路図です。イーサネットケーブルで電源と通信を一緒に受け取る（PoE）ESP32 ボードで、電源部・イーサネット・USB シリアル・ボタン・拡張コネクターが 1 枚に収まっているため、回路図を読む練習に向いています。元のファイルは <a href="https://github.com/OLIMEX/ESP32-POE">Olimex の GitHub リポジトリ</a>にあり、このサイトは元のファイルを変更せずにそのまま提供しています。</p>
<p>各ステップは <strong>解きたい問い → 操作 → 観察した結果 → 元の図面で確かめる点</strong> の順に書きました。図はすべて、このサイトのツールで例題を開いて撮った実際の画面です。</p>
<div class="note"><p>ツールが示す接続は、PDF の線と文字から<em>推定</em>した結果です。以下の数（ネット 40 個、部品 129 個など）は 2026-11-03 にこのサイトで確認した解析結果で、解析ルールが変わると変わることがあります。設計や修理の判断には、元の図面と CAD データもあわせて確認してください。</p></div>

<h2>ステップ 1：例題を開く</h2>
<p><strong>問い</strong>：この図面には、名前の付いたネットと部品がいくつあるか？</p>
<ol class="steps">
<li>最初の画面の <strong>例題の回路図で試す</strong> か、ツール画面の <strong>まず例題の回路図で試す</strong> を押します。ファイルはこのサイトから受け取り、ブラウザの中で解析されます。</li>
<li>解析が終わると図面全体が画面に合わせて表示され、一覧の上のタブに <em>ネット 40</em>、<em>部品 129</em> と表示されます。</li>
</ol>
${fig("example-open", "ja", "例題の回路図を開いた画面。左の一覧にネット 40・部品 129 のタブと電源・信号のネット一覧があり、右に図面全体が見える。", "例題を開いた直後の画面。名前（ラベル）のあるネットが一覧に並び、名前のないネット 26 個は図面で配線をクリックすると確認できるという案内が一覧の最後に出ます。")}
<p><strong>元の図面で確かめる点</strong>：図面には Power Supply、ESP-WROOM-32 Module、Ethernet、USB to UART、Buttons、SD/MMC Card、Extensions、UEXT のブロック見出しがあります。「ネット」は同じ電気的接続と推定した配線のまとまりで、129 は参照番号（R1、C1、U1 …）から読み取った部品の数です。実際の部品数は、元の BOM と比べてはじめて確定します。</p>

<h2>ステップ 2：電源ネットをたどる</h2>
<p><strong>問い</strong>：+3.3V の電源は、図面のどのブロックで使われているか？</p>
<ol class="steps">
<li><em>ネット</em> タブの <strong>電源</strong> のまとまりで <code>+3.3V</code> を押します。名前の横の <code>×11</code> は、同じ名前のラベルが 11 か所あるという意味です。</li>
<li>選択情報に <em>配線 46本 · 接続点 11個</em> と表示され、+3.3V にまとめられた配線が水色で強調されます。</li>
<li>一覧の <code>+3.3V</code> をもう一度押すか、<strong>ラベルの位置</strong> の矢印を押すと、1/11、2/11 … の順にラベルのある場所へ移動します。</li>
</ol>
${fig("example-power", "ja", "+3.3V のネットを選んだ画面。電源部、ESP32 モジュール、ボタン、SD カード、イーサネット、拡張コネクター、UEXT、USB to UART のブロックの配線の一部が水色で強調されている。", "+3.3V を選んだ画面。強調された場所は Power Supply、ESP-WROOM-32、Buttons、SD/MMC Card、Ethernet、Extensions、UEXT、USB to UART のブロックにまたがっています。")}
<p><strong>観察した結果</strong>：強調は電源部の出力側から始まり、ESP32 モジュール、ボタン、SD カード、イーサネット、拡張コネクター（Extensions・UEXT）、USB to UART のブロックまで続きます。名前の似た <code>+3.3VLAN</code>（×6）を押すと Ethernet ブロックの中だけが強調され（配線 22本 · 接続点 5個）、+3.3V とは別のネットとして表示されます。</p>
<p><strong>元の図面で確かめる点</strong>：ラベルの位置で 11 か所を順に見て、各ラベルが実際に配線の端に付いているか確かめます。元の図面では、+3.3VLAN は Ethernet ブロックの FET3（WPM2015-3/TR）を挟んで +3.3V と分かれているように見えます。ツールは部品を通る接続を同じネットにまとめないので、2 つの電源の関係はこのように部品を直接読んで判断します。</p>

<h2>ステップ 3：信号を 1 本追う</h2>
<p><strong>問い</strong>：ESP32 のリセット（EN）信号は、どこにつながっているか？</p>
<ol class="steps">
<li>検索欄に <code>ESP_EN</code> と入力します。一覧には <code>ESP_EN ×4</code> だけが残り、図面の上の検索バーに <em>1 / 4</em> と表示されます。</li>
<li>一覧の <code>ESP_EN</code> を押すと、選択情報に <em>配線 9本 · 接続点 2個</em> と表示されます。</li>
<li>ラベルの位置のボタンで 4 か所を順に見ます。強調された配線を直接押しても同じネットが選ばれ、何もない所を押すか <kbd>Esc</kbd> を押すと選択が解除されます。</li>
</ol>
${fig("example-signal", "ja", "ESP_EN を検索して選んだ画面。ESP32 モジュールの EN 付近、Buttons、Extensions、USB to UART のブロックの短い配線が強調され、検索バーに 1 / 4 と表示されている。", "ESP_EN を選んだ画面。同じ名前のラベル 4 か所（ESP32 モジュールの横、Buttons、Extensions、USB to UART）が強調されます。")}
<p><strong>観察した結果</strong>：ESP_EN のラベルは、ESP32 モジュールの EN ピン側、リセットボタンのある Buttons ブロック、拡張コネクター（Extensions）、USB to UART ブロックに 1 つずつあります。離れた 4 か所が、同じ名前のラベルでつながった 1 本の信号としてまとめられました。</p>
<p><strong>元の図面で確かめる点</strong>：それぞれの場所で、この信号に付いている部品を直接読んでみてください。元の図面では、モジュール側のラベルの近くに R32・C20、Buttons 側にリセットボタン RST1、USB to UART 側にダイオード D9 と自動書き込み用のトランジスター Q2・Q3（BC817、「Auto program」の表）があります。ラベルが配線から少し離れているとラベルとして認識されないことがあるので、検索で見つかった位置の数とラベルの位置の数が同じか比べると、見落としがないか確かめられます。</p>

<h2>ステップ 4：部品を探す</h2>
<p><strong>問い</strong>：R1 はどこにあり、値は何か？</p>
<ol class="steps">
<li>検索欄に <code>R1</code> と入力します。部分一致で探すので結果は 13 個（R1、R10〜R19、値に「R1」を含む PWR1・R28）ですが、検索バーに <em>1 / 13 · 完全一致 1</em> と表示され、完全に一致する R1 が先頭に来ます。</li>
<li><em>部品</em> タブで 1 行目の <code>R1  10k/R0402</code> を押すと、R1 の位置へ拡大して移動します。</li>
</ol>
${fig("example-part", "ja", "R1 を検索して選んだ画面。左の部品一覧の先頭に R1 10k/R0402 があり、検索バーに 1 / 13 完全一致 1 と表示され、図面は R1 の参照番号の付近に拡大されている。", "R1 を選んだ画面。一覧には参照番号の横に、読み取った値（10k/R0402）が一緒に表示されます。")}
<p><strong>元の図面で確かめる点</strong>：一覧の値は、参照番号の近くの文字を値として読んだ結果です。値の文字が離れていたり向きが違ったりすると、別の部品に付いたり空になったりすることがあります。この例題では値が空の部品はありませんでしたが、ほかの図面では<a href="${href("learn/find-parts")}">回路図 PDF で部品を探す方法</a>の方法で図面を直接確認してください。</p>

<h2>ステップ 5：一覧を保存する</h2>
<p><strong>問い</strong>：ネットと部品の一覧を表にまとめられるか？</p>
<ol class="steps">
<li>検索欄を空にしてから、タブの横の <strong>⋯</strong>（エクスポート）メニューで <strong>部品一覧CSV</strong> を選びます。</li>
<li>同じメニューの <strong>ネット一覧CSV</strong> も保存します。</li>
</ol>
<p><strong>観察した結果</strong>：部品の CSV は <code>reference,value,pages</code> の列に 129 行（例：<code>R1,10k/R0402,1</code>、<code>C1,22uF/6.3V/20%/X5R/C0603,1</code>）、ネットの CSV は <code>net,type,labels,pages</code> の列に 40 行（例：+3.3V、power、11、1）でした。ネット名は、表計算ソフトが数式として読まないように <code>="+3.3V"</code> の形で保存されます。</p>
<p><strong>元の図面で確かめる点</strong>：この CSV は図面の文字から読み取った一覧で、検証済みの BOM や CAD のネットリストと同じではありません。実装しない部品、図面外の機構部品、名前のないネットは抜けたり違って出たりすることがあるので、元の BOM と照らし合わせる用途で使ってください。</p>

<h2>まとめ</h2>
<p>この 5 つのステップで、「この電源がどこで使われているか」「この信号がどこへつながるか」「この部品がどこにあるか」を確かめ、その結果を元の図面でどう検証するかまで見てきました。次は<a href="${tool()}">自分の回路図 PDF</a>で同じ手順を試してみてください。結果がおかしいときは<a href="${href("help/formats")}">対応形式とトラブル対処</a>で PDF の状態を確認し、記号やラベルの読み方は<a href="${href("learn/read-schematic")}">回路図・データシートの読み方の基礎</a>を参考にしてください。</p>
`,
  }),
};
