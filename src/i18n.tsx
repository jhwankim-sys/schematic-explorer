import { createContext, useCallback, useContext } from "react";

export type Language = "ko" | "en" | "ja";
export const LanguageContext = createContext<Language>("ko");
const english: Record<string, string> = {
  "도면으로 건너뛰기": "Skip to drawing", "회로도 노드 탐색기": "Schematic Viewer",
  "페이지": "Pages", "다른 회로도 PDF 선택": "Choose another schematic PDF", "다른 PDF 열기": "Open another PDF",
  "도면": "Drawing", "도면에 없음": "No matches on this page", "이전 위치": "Previous match", "다음 위치": "Next match",
  "선택한 노드": "Selected net", "이름 없는 노드": "Unnamed net", "선택 해제": "Clear selection",
  "연결된 라벨·핀 이름": "Connected labels and pins", "노드 전체 보기": "Fit selected net",
  "선택한 부품": "Selected component", "부품 위치로 이동": "Go to component", "알림 닫기": "Dismiss notification",
  "PDF 파일만 열 수 있습니다.": "Only PDF files are supported.",
  "이 PDF에서 회로도를 읽지 못했습니다. 손상되었거나 암호가 걸린 파일인지 확인해 주세요.": "Unable to read this PDF. Check whether the file is damaged or password protected.",
  "도면 읽는 중": "Reading schematic", "완료": "Done",
  "노드와 부품 목록": "Nets and components", "노드, 핀, 부품 이름 검색": "Search nets, pins and components",
  "검색어 지우기": "Clear search", "노드": "Nets", "부품": "Parts", "전원": "Power", "신호": "Signals",
  "일치하는 노드가 없습니다.": "No matching nets.", "일치하는 부품이 없습니다.": "No matching components.",
  "확대": "Zoom in", "축소": "Zoom out", "전체 보기": "Fit drawing",
  "회로도 PDF 파일 선택": "Choose a schematic PDF", "PDF 파일 선택": "Choose PDF",
  "회로도 PDF를 열어보세요": "Open your schematic PDF",
  "파일을 여기에 놓으면 현재 도면이 교체됩니다": "Drop your PDF here to replace the current drawing",
  "PDF를 놓아 열기": "Drop PDF to open", "파일은 브라우저 안에서만 분석됩니다.": "Your file is processed only in your browser.",
  "파일 선택 또는 드래그앤드롭": "Choose a file or drag and drop",
  "벡터 PDF 권장 · 스캔 PDF 미지원": "Vector PDFs recommended · Scanned PDFs not supported",
  "로컬 처리": "Local processing", "회원가입 없음": "No sign-up", "연결 분석": "Net analysis",
  "원본 PDF": "Original PDF", "배선을 클릭해 연결을 확인하세요": "Click a wire to inspect its net",
  "휠: 확대·축소 · 드래그: 이동": "Wheel: zoom · Drag: pan",
  "도면 그리는 중": "Rendering drawing", "선택 정보 접기": "Collapse selection details", "선택 정보 펼치기": "Expand selection details",
  "노드 목록 CSV": "Nets CSV", "부품 목록 CSV": "Parts CSV", "정확히 일치": "exact",
  "이 페이지에는 이 노드가 없습니다.": "This net is not on this page.", "있는 페이지": "Pages",
  "홈으로": "Home",
  "목록 크게 보기": "Expand list", "목록 줄이기": "Shrink list", "목록으로": "Back to list", "선택 정보 보기": "Show selection", "내보내기": "Export",
  "이전 페이지": "Previous page", "다음 페이지": "Next page", "페이지 선택": "Choose page",
  "선택한 노드 있음": "selected net", "선택한 노드가 다른 페이지에도 있습니다": "The selected net is on other pages too",
  "목록 열기": "Open list", "목록 접기": "Hide list", "목록": "List", "라벨 위치": "Labels", "이전 라벨": "Previous label", "다음 라벨": "Next label",
  "같은 이름 라벨로 차례로 이동": "Click again to step through its labels", "목록 닫기": "Close list", "선택한 항목": "Selection",
  "PDF 파일만 열 수 있습니다. 회로도 프로그램에서 PDF로 내보낸 파일을 선택해 주세요.": "Only PDF files can be opened. Choose a PDF exported from your schematic program.",
  "암호가 걸린 PDF는 열 수 없습니다. 암호를 해제한 PDF로 다시 저장한 뒤 열어 주세요.": "Password-protected PDFs can't be opened. Save a copy without the password and open that.",
  "이 PDF에서 회로도를 읽지 못했습니다. 파일이 손상되지 않았는지 확인하고, 회로도 프로그램에서 PDF로 다시 내보내 보세요.": "Unable to read this PDF. Check that the file isn't damaged, or export the PDF again from your schematic program.",
  "이 PDF에는 선과 글자 정보가 없어 연결을 분석할 수 없습니다. 스캔하거나 이미지로 저장한 PDF로 보입니다. 도면은 볼 수 있으며, 회로도 프로그램에서 PDF로 다시 내보내면 분석할 수 있습니다.": "This PDF has no line or text data, so its connections can't be analyzed. It looks like a scan or an image saved as PDF. You can still view the drawing; export the PDF again from your schematic program to analyze it.",
  "예제 파일을 불러오지 못했습니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.": "Couldn't load the example file. Check your internet connection and try again.",
  "무엇을 여나요": "What it opens", "지원 형식": "Supported files", "파일 저장": "Your file",
  "회로도 PDF를 열어 보세요": "Open your schematic PDF", "어떤 도구인가요": "What it does",
  "파일을 선택하거나 끌어다 놓으세요": "Choose a file or drag it here",
  "파일 선택으로 건너뛰기": "Skip to file selection",
};
/**
 * Japanese, keyed by the Korean text like `english` (not reviewed by a native speaker yet).
 * Text with numbers in it passes its Japanese as the third argument of t() instead of an entry here.
 * Glossary: 노드 ネット · 부품 部品 · 회로도 回路図 · 도면 図面 · 배선 配線 · 라벨 ラベル · 핀 ピン ·
 * 전원 電源 · 신호 信号 · 접점 接続点 · 확대/축소 拡大/縮小 · 전체 보기 全体表示 · 내보내기 エクスポート ·
 * 벡터 PDF ベクターPDF · 암호 パスワード
 */
const japanese: Record<string, string> = {
  // landing
  "회로도 PDF 연결 탐색": "回路図PDFの接続をたどる",
  "클릭 한 번으로 연결 따라가기": "クリック1回で接続をたどる",
  "배선 한 곳을 선택하면 같은 노드로 분석된 배선과 라벨을 함께 강조합니다.": "配線を1か所選ぶと、同じネットと解析された配線とラベルをまとめて強調表示します。",
  "노드와 부품을 빠르게 검색": "ネットと部品をすばやく検索",
  "GND, +5V, R1처럼 익숙한 이름으로 도면의 글자와 부품 위치를 찾아보세요.": "GND、+5V、R1のような見慣れた名前で、図面の文字や部品の位置を探せます。",
  "PDF는 내 기기에서만 처리": "PDFは自分の端末だけで処理",
  "회원가입도, 파일을 올리는 서버도 없이 브라우저 안에서 PDF를 분석합니다.": "会員登録も、ファイルをアップロードするサーバーもなしに、ブラウザの中でPDFを解析します。",
  "PDF 열기": "PDFを開く",
  "‘PDF 뷰어 시작하기’를 누르고 PDF를 선택하거나 화면에 끌어다 놓으세요. CAD에서 내보낸 벡터 PDF를 권장합니다.": "「PDFビューアーを開始」を押して、PDFを選ぶか画面にドラッグ＆ドロップしてください。CADから書き出したベクターPDFをおすすめします。",
  "배선 클릭하기": "配線をクリック",
  "분석이 끝나면 배선을 클릭하세요. 선택한 노드의 연결이 청록색으로 강조되고 나머지 도면은 흐려집니다. 목록에서도 노드와 부품을 선택할 수 있습니다.": "解析が終わったら配線をクリックしてください。選んだネットの接続が青緑色で強調され、残りの図面は薄く表示されます。一覧からもネットと部品を選べます。",
  "검색하고 살펴보기": "検索して確認",
  "검색창에 신호나 부품 이름을 입력하세요. 휠이나 두 손가락으로 확대·축소하고 드래그로 이동합니다. + / −, 0, 방향키도 사용할 수 있습니다.": "検索欄に信号名や部品名を入力してください。ホイールや2本指で拡大・縮小し、ドラッグで移動します。+ / −、0、矢印キーも使えます。",
  "다른 도면으로 교체하기": "別の図面に切り替える",
  "다른 PDF를 현재 뷰어에 끌어다 놓거나 ‘다른 PDF 열기’를 누르세요. 새 도면이 같은 화면에서 열립니다. 여러 장은 상단 페이지 번호로 이동합니다.": "別のPDFを今のビューアーにドラッグ＆ドロップするか、「別のPDFを開く」を押してください。新しい図面が同じ画面で開きます。複数ページの図面は上部のページ番号で移動します。",
  "사용법 가이드": "使い方ガイド",
  "파일 열기부터 노드 강조, 라벨 이동, CSV 내보내기까지 화면별 사용법.": "ファイルを開くところから、ネットの強調、ラベル間の移動、CSVのエクスポートまで、画面ごとの使い方。",
  "예제로 따라 하기": "例題でやってみる",
  "공개 회로도 한 장으로 전원 노드와 신호를 따라가 보는 실습.": "公開されている回路図1枚で、電源ネットと信号をたどってみる実習。",
  "회로도 PDF에서 부품 찾기": "回路図PDFで部品を探す",
  "참조 번호(R1, U3)와 값으로 부품을 찾고 목록으로 정리하는 방법.": "部品番号（R1、U3）と値で部品を探し、一覧にまとめる方法。",
  "회로도·데이터시트 읽는 법 기초": "回路図・データシートの読み方の基礎",
  "넷 라벨, 전원 기호, 핀 번호, 데이터시트 핀 배치표를 읽는 기본기.": "ネットラベル、電源記号、ピン番号、データシートのピン配置表を読む基本。",
  "지원 형식과 오류 해결": "対応形式とトラブル対処",
  "어떤 PDF가 잘 열리는지, 열리지 않을 때 무엇을 확인할지.": "どんなPDFがよく開けるか、開けないときに何を確認するか。",
  "자주 묻는 질문": "よくある質問",
  "파일 보안, 정확도, 모바일 사용, 비용에 대한 질문과 답.": "ファイルの安全性、精度、スマートフォンでの利用、費用についての質問と回答。",
  "언어 선택": "言語の選択", "홈으로": "ホームへ", "사이트 메뉴": "サイトメニュー",
  "사용법": "使い方", "소개": "概要", "문의": "お問い合わせ", "시작하기": "はじめる", "도구 열기": "ツールを開く",
  "복잡한 회로도,": "複雑な回路図も、", "연결은 클릭 한 번으로.": "接続はクリック1回で。",
  "회로도 PDF의 전원과 신호가 어디로 이어지는지 한눈에 따라가세요. 배선 선택, 노드 강조, 부품 검색을 한 화면에서 할 수 있습니다.": "回路図PDFの電源や信号がどこにつながっているか、ひと目でたどれます。配線の選択、ネットの強調、部品の検索をひとつの画面で行えます。",
  "열 수 있는 파일": "開けるファイル",
  "전자회로 회로도 PDF (KiCad·OrCAD·Altium·Eagle 등에서 내보낸 벡터 PDF)": "電子回路の回路図PDF（KiCad・OrCAD・Altium・Eagleなどから書き出したベクターPDF）",
  "열 수 없는 파일": "開けないファイル", "스캔·사진 PDF, 암호가 걸린 PDF": "スキャン・写真のPDF、パスワード付きのPDF",
  "파일 처리": "ファイルの処理", "서버로 보내거나 저장하지 않고 브라우저 안에서만 처리합니다": "サーバーに送信・保存せず、ブラウザの中だけで処理します",
  "PDF 뷰어 시작하기": "PDFビューアーを開始", "예제 회로도 체험하기": "例題の回路図で試す",
  "내 기기에서 처리": "端末内で処理", "회원가입 없음": "会員登録不要", "무료": "無料", "주요 기능": "主な機能",
  "도면을 읽는 데서 그치지 않고\n연결까지 이해하도록 돕습니다.": "図面を読むだけでなく、\n接続まで理解できるように。",
  "Schematic Viewer는 전자회로를 공부하거나 도면을 검토할 때 멀리 떨어진 같은 신호를 찾는 수고를 줄이는 무료 웹 도구입니다. PDF의 선과 글자를 분석하고, 연결을 원본 도면 위에 강조합니다.": "Schematic Viewerは、電子回路を学ぶときや図面をレビューするときに、離れた場所にある同じ信号を探す手間を減らす無料のWebツールです。PDFの線と文字を解析し、接続を元の図面の上に強調表示します。",
  "예를 들어 +5V 배선을 선택해 같은 전원으로 이어진 곳을 확인하거나, R1을 검색해 부품 위치로 이동할 수 있습니다.": "たとえば+5Vの配線を選んで同じ電源につながる場所を確認したり、R1を検索して部品の位置へ移動したりできます。",
  "소개 더 보기": "概要をもっと見る", "지원 범위와 분석 한계": "対応範囲と解析の限界",
  "벡터 PDF를 권장하며 스캔·이미지 PDF는 지원하지 않습니다. 글자를 선으로만 내보낸 PDF는 이름 검색이 제한될 수 있습니다. 페이지별로 연결을 추정하므로 설계·수리 판단 전에는 원본과 CAD 자료로 확인하세요.": "ベクターPDFをおすすめします。スキャン・画像のPDFには対応していません。文字を線だけで書き出したPDFでは、名前の検索が制限されることがあります。接続はページごとに推定するため、設計や修理の判断の前には元の図面とCADデータで確認してください。",
  "도면 탐색, 네 단계로 시작하기": "図面の探索を4ステップで", "전체 사용법": "使い方の全体",
  "파일이 열리지 않으면 암호화·손상 여부를 확인하세요. 분석이 부정확하면 선과 글자가 포함된 PDF로 다시 내보내 보세요.": "ファイルが開けない場合は、暗号化や破損がないか確認してください。解析が不正確な場合は、線と文字を含むPDFとして書き出し直してみてください。",
  "해결 방법 보기": "対処方法を見る", "읽을거리": "読みもの", "읽기": "読む",
  "개인정보처리방침": "プライバシーポリシー", "이용약관": "利用規約", "업데이트 기록": "更新履歴",
  // workspace
  "이름 없는 노드": "名前のないネット", "이 페이지에는 이 노드가 없습니다.": "このページにはこのネットはありません。",
  "이전 라벨": "前のラベル", "다음 라벨": "次のラベル", "선택 정보 접기": "選択情報を折りたたむ", "선택 정보 펼치기": "選択情報を広げる",
  "선택 해제": "選択を解除", "선택한 노드": "選択したネット", "있는 페이지": "含まれるページ", "라벨 위치": "ラベルの位置",
  "연결된 라벨·핀 이름": "接続されたラベル・ピン名", "노드 전체 보기": "ネット全体を表示", "선택한 부품": "選択した部品",
  "부품 위치로 이동": "部品の位置へ移動", "페이지": "ページ", "이전 페이지": "前のページ", "다음 페이지": "次のページ",
  "선택한 노드가 다른 페이지에도 있습니다": "選択したネットはほかのページにもあります", "페이지 선택": "ページの選択",
  "선택한 노드 있음": "選択したネットあり", "알림 닫기": "通知を閉じる", "도면에 없음": "図面にありません",
  "정확히 일치": "完全一致", "이전 위치": "前の位置", "다음 위치": "次の位置",
  "도면으로 건너뛰기": "図面へスキップ", "파일 선택으로 건너뛰기": "ファイル選択へスキップ",
  "다른 회로도 PDF 선택": "別の回路図PDFを選択", "다른 PDF 열기": "別のPDFを開く", "도면": "図面", "목록": "一覧",
  "읽는 중에는 다른 파일을 열 수 없습니다. 끝난 뒤 다시 열어 주세요.": "読み込み中はほかのファイルを開けません。終わってからもう一度開いてください。",
  "파일은 브라우저 안에서만 분석됩니다.": "ファイルはブラウザの中だけで解析されます。",
  "휠: 확대·축소 · 드래그: 이동": "ホイール：拡大・縮小 · ドラッグ：移動",
  "파일을 여기에 놓으면 현재 도면이 교체됩니다": "ここにファイルをドロップすると、今の図面と入れ替わります",
  "PDF를 놓아 열기": "PDFをドロップして開く",
  "같은 전원 노드를 강조한 회로 예시": "同じ電源ネットを強調した回路の例", "같은 노드의 연결을 한눈에": "同じネットの接続をひと目で",
  "목록 줄이기": "一覧を小さくする", "목록 크게 보기": "一覧を大きく表示", "목록 접기": "一覧を隠す",
  "노드와 부품 목록": "ネットと部品の一覧", "목록 열기": "一覧を開く", "목록으로": "一覧へ戻る",
  "노드, 핀, 부품 이름 검색": "ネット・ピン・部品名で検索", "검색어 지우기": "検索語を消去",
  "노드": "ネット", "부품": "部品", "선택 정보 보기": "選択情報を表示",
  "이 PDF는 글자가 선으로 그려져 있어 노드 이름을 읽을 수 없습니다. 도면에서 배선을 누르면 연결은 확인할 수 있습니다.": "このPDFは文字が線で描かれているため、ネット名を読み取れません。図面の配線を押すと接続は確認できます。",
  "일치하는 노드가 없습니다.": "一致するネットはありません。", "전원": "電源", "신호": "信号", "일치하는 부품이 없습니다.": "一致する部品はありません。",
  "같은 이름 라벨로 차례로 이동": "同じ名前のラベルへ順に移動",
  "노드 목록 CSV": "ネット一覧CSV", "부품 목록 CSV": "部品一覧CSV", "내보내기": "エクスポート",
  "회로도 PDF를 열어 보세요": "回路図PDFを開いてみましょう", "어떤 도구인가요": "どんなツールですか",
  "전자회로 회로도 PDF를 열어 배선 연결(노드)과 부품을 찾아 줍니다.": "電子回路の回路図PDFを開き、配線の接続（ネット）と部品を見つけます。",
  "지원 형식": "対応形式",
  "KiCad·OrCAD·Altium·Eagle 등에서 내보낸 벡터 PDF. 스캔·사진 PDF와 암호 걸린 PDF는 분석할 수 없습니다.": "KiCad・OrCAD・Altium・Eagleなどから書き出したベクターPDF。スキャン・写真のPDFとパスワード付きのPDFは解析できません。",
  "파일 저장": "ファイルの保存",
  "파일은 서버로 전송·저장되지 않고 이 브라우저 안에서만 처리되며, 창을 닫으면 사라집니다.": "ファイルはサーバーに送信・保存されず、このブラウザの中だけで処理され、ページを閉じると消えます。",
  "파일을 선택하거나 끌어다 놓으세요": "ファイルを選ぶか、ドラッグしてください",
  "회로도 PDF 파일 선택": "回路図PDFファイルを選択", "PDF 파일 선택": "PDFファイルを選択",
  "예제 회로도로 먼저 해 보기": "まず例題の回路図で試す",
  "예제: Olimex ESP32-PoE 공개 회로도 (Apache-2.0)": "例題：Olimex ESP32-PoEの公開回路図（Apache-2.0）",
  "처음이라면": "初めての方は", "파일이 열리지 않을 때": "ファイルが開けないとき",
  "배선을 클릭해 연결을 확인하세요": "配線をクリックして接続を確認してください", "회로도": "回路図",
  "회로도 도면. 클릭하면 같은 노드가 강조됩니다. 휠 또는 +, - 키로 확대·축소, 화살표 키로 이동, 0 키로 전체 보기.": "回路図の図面。クリックすると同じネットが強調されます。ホイールまたは+、-キーで拡大・縮小、矢印キーで移動、0キーで全体表示。",
  // nearby-net chooser on touch (P0-6)
  "가까운 노드 선택": "近くのネットを選択", "여러 배선이 가까이 있습니다": "複数の配線が近くにあります", "이 부분 확대": "この部分を拡大",
  "도면 그리는 중": "図面を描画中", "확대": "拡大", "축소": "縮小", "전체 보기": "全体表示",
  // errors and notices (App.tsx setError / setNotice) and the static progress text
  "PDF 파일만 열 수 있습니다. 회로도 프로그램에서 PDF로 내보낸 파일을 선택해 주세요.": "開けるのはPDFファイルだけです。回路図ソフトからPDFとして書き出したファイルを選んでください。",
  "암호가 걸린 PDF는 열 수 없습니다. 암호를 해제한 PDF로 다시 저장한 뒤 열어 주세요.": "パスワード付きのPDFは開けません。パスワードを解除したPDFとして保存し直してから開いてください。",
  "이 PDF에서 회로도를 읽지 못했습니다. 파일이 손상되지 않았는지 확인하고, 회로도 프로그램에서 PDF로 다시 내보내 보세요.": "このPDFから回路図を読み込めませんでした。ファイルが破損していないか確認し、回路図ソフトからPDFを書き出し直してみてください。",
  "이 PDF에는 선과 글자 정보가 없어 연결을 분석할 수 없습니다. 스캔하거나 이미지로 저장한 PDF로 보입니다. 도면은 볼 수 있으며, 회로도 프로그램에서 PDF로 다시 내보내면 분석할 수 있습니다.": "このPDFには線と文字の情報がないため、接続を解析できません。スキャンしたか、画像として保存したPDFのようです。図面は表示できます。回路図ソフトからPDFを書き出し直すと解析できます。",
  "예제 파일을 불러오지 못했습니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.": "例題ファイルを読み込めませんでした。インターネット接続を確認してから、もう一度お試しください。",
  "도면 읽는 중": "図面を読み込み中", "완료": "完了",
};
/** t(ko, en?, ja?): ja is for text with numbers in it; other Japanese comes from the table, then English as a fallback */
export function useT() {
  const language = useContext(LanguageContext);
  return useCallback((ko: string, en?: string, ja?: string) =>
    language === "en" ? en ?? english[ko] ?? ko
    : language === "ja" ? ja ?? japanese[ko] ?? en ?? english[ko] ?? ko
    : ko, [language]);
}
/** link to a static content page ("/guide/") in the current language ("/en/guide/"); there are no Japanese pages yet, so ja links to the English one */
export function usePageHref() {
  const language = useContext(LanguageContext);
  return useCallback((path: string) => (language === "ko" ? path : "/en" + path), [language]);
}
/** attributes for a link to a static content page: href, and hreflang when it is in another language than the screen */
export function usePageLink() {
  const href = usePageHref();
  const language = useContext(LanguageContext);
  return useCallback((path: string) => ({ href: href(path), hrefLang: language === "ja" ? "en" : undefined }), [href, language]);
}
/** after the text of such a link: says the page is in English (Japanese screen only) */
export function PageLangNote() {
  return useContext(LanguageContext) === "ja" ? <span className="page-lang">（英語）</span> : null;
}
