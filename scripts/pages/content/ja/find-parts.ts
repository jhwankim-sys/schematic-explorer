import type { JaPage } from "./index.ts";

// Translation of ../find-parts.ts.
export const findParts: JaPage = {
  updated: "2026-10-16",
  content: ({ href }) => ({
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
<li><strong>DNP / NC</strong>：「Do Not Populate」「No Connect」の略で、基板に実装しない場所です。</li>
</ul>

<h2>Schematic Viewer で探す</h2>
<ol class="steps">
<li><strong>リファレンス番号で</strong>：検索欄に <code>C37</code> と入力します。完全に一致する C37 が C370 のような似た名前より先に表示され、Enter を押さなくてもその位置へ移動します。<em>部品</em> タブで C37 を押してもかまいません。</li>
<li><strong>値で</strong>：<code>10k</code> や <code>104</code> のように値を検索すると、その値が書かれたすべての位置が表示されます。表示バーの数を見れば、同じ値の部品がいくつあるかおおよそわかります。</li>
<li><strong>図面から</strong>：図面のリファレンス番号の文字を押すとその部品が選択され、一覧が <em>部品</em> タブに切り替わります。</li>
<li><strong>一覧にまとめる</strong>：タブの横の <strong>⋯</strong> メニューの <strong>部品一覧CSV</strong> でリファレンス番号・値・ページを保存し、Excel で値ごとに並べ替えれば簡易的な BOM になります。</li>
</ol>

<h2>値が空のとき、違うとき</h2>
<p>Schematic Viewer は、リファレンス番号の近くに同じ向きで書かれた値の文字を結び付けます。値がリファレンス番号から遠くにある、向きが違う、複数行に分かれている、といった場合は結び付けられず、空になることがあります。そのときは部品を押して、図面で直接確認してください。OrCAD で作った PDF のように部品の情報が PDF の中に含まれている場合は、その情報を優先して使います。</p>
<p>CSV で作った一覧は図面から読み取った結果なので、正式な BOM の代わりにはなりません。発注や生産には CAD から出力した BOM を使い、この一覧は図面のレビューや照合用に活用してください。記号そのものになじみがなければ、<a href="${href("learn/read-schematic")}">回路図・データシートの読み方の基礎</a>もあわせてご覧ください。</p>
`,
  }),
};
