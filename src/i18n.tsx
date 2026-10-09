import { createContext, useCallback, useContext } from "react";

export type Language = "ko" | "en";
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
  "목록 열기": "Open list", "목록 접기": "Hide list", "목록": "List", "라벨 위치": "Labels", "이전 라벨": "Previous label", "다음 라벨": "Next label",
  "같은 이름 라벨로 차례로 이동": "Click again to step through its labels", "목록 닫기": "Close list", "선택한 항목": "Selection",
  "PDF 파일만 열 수 있습니다. 회로도 프로그램에서 PDF로 내보낸 파일을 선택해 주세요.": "Only PDF files can be opened. Choose a PDF exported from your schematic program.",
  "암호가 걸린 PDF는 열 수 없습니다. 암호를 해제한 PDF로 다시 저장한 뒤 열어 주세요.": "Password-protected PDFs can't be opened. Save a copy without the password and open that.",
  "이 PDF에서 회로도를 읽지 못했습니다. 파일이 손상되지 않았는지 확인하고, 회로도 프로그램에서 PDF로 다시 내보내 보세요.": "Unable to read this PDF. Check that the file isn't damaged, or export the PDF again from your schematic program.",
  "이 PDF에는 선과 글자 정보가 없어 연결을 분석할 수 없습니다. 스캔하거나 이미지로 저장한 PDF로 보입니다. 도면은 볼 수 있으며, 회로도 프로그램에서 PDF로 다시 내보내면 분석할 수 있습니다.": "This PDF has no line or text data, so its connections can't be analyzed. It looks like a scan or an image saved as PDF. You can still view the drawing; export the PDF again from your schematic program to analyze it.",
  "예제 파일을 불러오지 못했습니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.": "Couldn't load the example file. Check your internet connection and try again.",
  "무엇을 여나요": "What it opens", "지원 형식": "Supported files", "파일 저장": "Your file",
};
export function useT() {
  const language = useContext(LanguageContext);
  return useCallback((ko: string, en?: string) => language === "en" ? en ?? english[ko] ?? ko : ko, [language]);
}
/** link to a static content page ("/guide/") in the current language ("/en/guide/") */
export function usePageHref() {
  const language = useContext(LanguageContext);
  return useCallback((path: string) => (language === "en" ? "/en" + path : path), [language]);
}
