import type { JaPage } from "./index.ts";

// Translation of ../find-parts.ts.
export const findParts: JaPage = {
  updated: "2026-11-12",
  content: ({ href, tool }) => ({
    title: "回路図 PDF で部品を探す方法",
    description: "リファレンス番号（R1、C3、U2）の意味、値の表記（4k7、104、10uF/16V）の読み方、複数の機能に分かれた部品、そして Schematic Viewer で部品を探して一覧にまとめる方法を説明します。",
    body: `
<p>修理やレビューをしていると、「C37 は図面のどこにある？」「このボードに 10k の抵抗はいくつある？」といった疑問がよく出てきます。PDF ビューアーの Ctrl+F でも探せますが、リファレンス番号の決まりと値の表記を知っていれば、ずっと速くなります。</p>

<h2>リファレンス番号（Reference Designator）を読む</h2>
<p>回路図のすべての部品には、<strong>種類を表す文字 + 番号</strong>でできたリファレンス番号が付きます。この番号は PCB のシルク印刷と部品表（BOM）にもそのまま使われるため、図面・基板・BOM をつなぐ鍵になります。よく使われる接頭辞は次のとおりです（会社や CAD によって少しずつ異なります）。</p>
<table>
<thead><tr><th>接頭辞</th><th>部品</th><th>接頭辞</th><th>部品</th></tr></thead>
<tbody>
<tr><td>R</td><td>抵抗</td><td>U, IC</td><td>集積回路（IC）</td></tr>
<tr><td>C</td><td>コンデンサー（キャパシター）</td><td>Q</td><td>トランジスター、MOSFET</td></tr>
<tr><td>L</td><td>インダクター、コイル</td><td>D, LED</td><td>ダイオード、LED</td></tr>
<tr><td>FB, BEAD</td><td>フェライトビーズ</td><td>J, P, CN, CON</td><td>コネクター</td></tr>
<tr><td>Y, X</td><td>水晶振動子、発振器</td><td>SW, S, BUT</td><td>スイッチ、ボタン</td></tr>
<tr><td>F</td><td>ヒューズ</td><td>T, TR</td><td>トランス</td></tr>
<tr><td>TP</td><td>テストポイント</td><td>JP</td><td>ジャンパー</td></tr>
</tbody>
</table>
<p>番号はふつう図面の左上から順に付きますが、ブロックごとに 100 単位で分けることも多いです（電源部は C101～、通信部は C201～ など）。番号の範囲を見ると、部品がどのブロックにあるか見当がつきます。</p>

<h3>複数の機能に分かれた部品</h3>
<p>オペアンプが 2 つ入った LM358 のように 1 つのチップに同じ機能が複数あると、図面では <code>U4A</code>、<code>U4B</code> のように後ろに文字を付けて別々に描きます。電源ピンだけを別に <code>U4C</code> として描くこともあります。Schematic Viewer はこうした部分を 1 つの部品 <code>U4</code> にまとめて一覧に表示します。</p>

<h2>値の表記を読む</h2>
<ul>
<li><strong>抵抗</strong>：<code>4k7</code> は 4.7kΩ、<code>1M</code> は 1MΩ、<code>0R</code> は 0Ω（ジャンパー用）です。小数点の代わりに単位の文字を使う表記は、印刷がにじんでも読みやすいように使われます。後ろに <code>/R0402</code> のようにサイズ（パッケージ）を付けることもあります。</li>
<li><strong>コンデンサー</strong>：<code>104</code> のように数字が 3 つなら、上 2 桁 × 10 の（3 桁目）乗 pF です。104 = 10 × 10⁴ pF = 100nF = 0.1µF。<code>10uF/16V</code> のように定格電圧を一緒に書くことが多いです。</li>
<li><strong>許容差・材質</strong>：<code>1%</code>、<code>X5R</code>、<code>C0G</code> のように精度と誘電体の種類が付きます。交換するときは値だけでなく、これらの項目とサイズも合わせる必要があります。</li>
<li><strong>DNP と NC は意味が違います</strong>：<code>DNP</code>（Do Not Populate。<code>DNF</code>、<code>NF</code>、<code>NM</code> とも書く）は<em>部品を実装しない場所</em>という表示で、ふつうは部品の値の欄や別の記号で付きます。<code>NC</code>（No Connect）は<em>ピンを意図的にどこにもつないでいない</em>という意味で、ピンの端の ✕ 印や、名前が <code>NC</code> のピンとして表れます。ただし部品の値の欄に <code>NC</code> と書いて未実装を表すメーカーもあるので、どちらの意味かは、その図面の凡例・注記、メーカーの表記の慣例、実装の有無が書かれた BOM（部品表）で確かめてください。</li>
</ul>

<h2>Schematic Viewer で探す</h2>
<ol class="steps">
<li><strong>リファレンス番号で</strong>：検索欄に <code>C37</code> と入力します。完全に一致する C37 が C370 のような似た名前より先に表示され、Enter を押さなくてもその位置へ移動します。<em>部品</em> タブで C37 を押してもかまいません。</li>
<li><strong>値で</strong>：<code>10k</code> や <code>104</code> のように値を検索すると、その値が書かれたすべての位置が表示されます。表示バーの数を見れば、同じ値の部品がいくつあるかおおよそわかります。</li>
<li><strong>図面から</strong>：図面のリファレンス番号の文字を押すとその部品が選択され、一覧が <em>部品</em> タブに切り替わります。</li>
<li><strong>一覧にまとめる</strong>：タブの横の <strong>⋯</strong> メニューの <strong>部品一覧CSV</strong> でリファレンス番号・値・ページを保存し、Excel で値ごとに並べ替えれば簡易的な BOM になります。</li>
</ol>

<h2>実習：部品 CSV を BOM と照合する</h2>
<p><strong>問い</strong>：Schematic Viewer の部品一覧 CSV をそのまま BOM（部品の購入・組立の一覧）として使えるか。使うなら何を照合すべきか。</p>
<p><strong>資料</strong>：このサイトの<a href="${tool("#example")}">例題の回路図</a>（Olimex ESP32-PoE rev. I の PDF）と、同じリビジョンの <a href="https://github.com/OLIMEX/ESP32-POE/blob/deb38a377d50eadb04ddc7118a17a5ae58b1ee53/HARDWARE/ESP32-PoE-hardware-revision-I/ESP32-PoE_Rev_I.sch">KiCad 回路図の元データ（ESP32-PoE_Rev_I.sch）</a>です。元データから参照番号と値のフィールドをスクリプトで取り出して比べました（電源記号を除く）。これは<em>回路図に置かれた部品の一覧</em>であり、メーカーの組立 BOM ではありません。</p>
<p><strong>操作</strong>：例題を開き、タブの横の <strong>⋯</strong> メニューで<strong>部品一覧CSV</strong>を保存して、元データの一覧と参照番号で突き合わせます。</p>
<table>
<thead><tr><th>照合する項目</th><th>部品 CSV</th><th>KiCad の元データ</th></tr></thead>
<tbody>
<tr><td>参照番号の数</td><td>129 個</td><td>129 個。両方の一覧の参照番号はすべて同じです。</td></tr>
<tr><td>値</td><td>129 個すべてが元データの値フィールドと同じ文字</td><td>例：<code>R1</code> = <code>10k/R0402</code></td></tr>
<tr><td>複数ユニットの部品</td><td><code>RM1</code>、<code>RM2</code>、<code>RM3</code> がそれぞれ 1 行</td><td>同じ参照番号の記号が <code>RM1</code> は 3 個、<code>RM2</code>・<code>RM3</code> は 4 個ずつ（抵抗アレイ）</td></tr>
<tr><td>値の前に <code>NA(…)</code>・<code>NS(…)</code> が付いた部品</td><td>10 個が通常の行として含まれる（例：<code>C21</code> = <code>NA(10uF/6.3V/20%/X5R/C0603)</code>、<code>EXT1</code> = <code>NS(HN1x10)</code>）</td><td>同じ文字。表記の意味は元データに書かれていない</td></tr>
<tr><td>購入する部品ではない項目</td><td><code>FID1</code>～<code>FID6</code>（値 <code>Fiducial</code>）、<code>BAT_SENS_E1</code>（値 <code>Opened</code>）を含む</td><td>同じ項目が記号としてある</td></tr>
<tr><td>異なる値の種類</td><td>71 種（数量の列なし）</td><td>71 種</td></tr>
</tbody>
</table>
<p><strong>元データとの照合でわかったこと</strong>：この図面では参照番号と値の文字が元データとすべて同じでした（紹介の公開採点でも、この標本は部品・値ともに 100%）。それでも CSV をそのまま BOM として使えない理由が残ります。</p>
<ul>
<li><strong>実装の有無</strong>：<code>NA(…)</code>、<code>NS(…)</code> のように値に付いた表記は未実装を表すメーカーの慣例に見えますが、ツールはこれを解釈せず、ほかの部品と同じ行として書き出します。実際に実装するかは、メーカーの BOM や組立資料で確かめてください。</li>
<li><strong>ユニットと数量</strong>：<code>RM1</code> のように複数の記号に分かれた部品は CSV では 1 行なので購入数 1 個と合いますが、元データで全ユニットが同じ部品か確かめる必要があります。CSV には数量の列がないため、同じ値をまとめて自分で数えます。</li>
<li><strong>購入対象ではない記号</strong>：フィデューシャル（<code>FID</code>）やはんだジャンパー（<code>…_E1</code>）のように基板にだけある項目も一覧に出ます。</li>
<li><strong>図面にない部品</strong>：ねじやケースのように回路図に描かれない部品は、CSV にも回路図の元データにもありません。</li>
</ul>
<p><strong>限界</strong>：この例題は文字がきれいなので、値はすべて合っていました。値の文字が参照番号から離れていたり向きが違ったりする図面では、値が抜けたり別の部品に付いたりすることがあります（次の節）。</p>
<p><strong>次の行動</strong>：CSV は「図面にどの参照番号と値が書かれているか」を手早くまとめる用途に使い、購入・組立にはメーカーの BOM と参照番号で照合して、実装の有無・数量・代替部品を確定してください。</p>

<h2>値が空のとき、違うとき</h2>
<p>Schematic Viewer は、リファレンス番号の近くに同じ向きで書かれた値の文字を結び付けます。値がリファレンス番号から遠くにある、向きが違う、複数行に分かれている、といった場合は結び付けられず、空になることがあります。そのときは部品を押して、図面で直接確認してください。OrCAD で作った PDF のように部品の情報が PDF の中に含まれている場合は、その情報を優先して使います。</p>
<p>CSV で作った一覧は図面から読み取った結果なので、正式な BOM の代わりにはなりません。発注や生産には CAD から出力した BOM を使い、この一覧は図面のレビューや照合用に活用してください。記号そのものになじみがなければ、<a href="${href("learn/read-schematic")}">回路図・データシートの読み方の基礎</a>もあわせてご覧ください。</p>
`,
  }),
};
