import { useRef } from "react";
import { FileUp, LockKeyhole, ArrowRight, FileSearch, CircuitBoard } from "lucide-react";
import { Button } from "./ui.tsx";
import { CircuitArtwork } from "./circuit-artwork.tsx";
import { usePageHref, useT } from "../i18n.tsx";

export function UploadHero({ onFile, onExample, busy }: { onFile: (f: File) => void; onExample: () => void; busy: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useT();
  const href = usePageHref();
  return <section aria-labelledby="upload-title" className="upload-screen">
    <div className="upload-layout"><div className="upload-copy">
      <p className="eyebrow">SCHEMATIC VIEWER / WORKSPACE</p>
      <h1 id="upload-title">{t("회로도 PDF를 열어 보세요")}</h1>
      {/* what it opens, which files, and where the file goes — before the button */}
      <ul className="upload-facts">
        <li><CircuitBoard aria-hidden="true" /><span><strong>{t("어떤 도구인가요")}</strong>{t("전자회로 회로도 PDF를 열어 배선 연결(노드)과 부품을 찾아 줍니다.", "Opens electronic schematic PDFs and traces their nets and parts.")}</span></li>
        <li><FileSearch aria-hidden="true" /><span><strong>{t("지원 형식")}</strong>{t("KiCad·OrCAD·Altium·Eagle 등에서 내보낸 벡터 PDF. 스캔·사진 PDF와 암호 걸린 PDF는 분석할 수 없습니다.", "Vector PDFs exported from KiCad, OrCAD, Altium, Eagle and similar. Scanned, photographed or password-protected PDFs cannot be analyzed.")}</span></li>
        <li><LockKeyhole aria-hidden="true" /><span><strong>{t("파일 저장")}</strong>{t("파일은 서버로 전송·저장되지 않고 이 브라우저 안에서만 처리되며, 창을 닫으면 사라집니다.", "Your file is never uploaded or stored on a server. It is processed in this browser only and is gone when you close the page.")}</span></li>
      </ul>
      <div className="upload-zone"><FileUp size={32} aria-hidden="true" /><h2>{t("파일을 선택하거나 끌어다 놓으세요")}</h2>
        <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="sr-only" aria-label={t("회로도 PDF 파일 선택")} onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
        <Button size="lg" onClick={() => inputRef.current?.click()} disabled={busy}>{t("PDF 파일 선택")}<ArrowRight aria-hidden="true" /></Button>
        <Button variant="outline" onClick={onExample} disabled={busy}>{t("예제 회로도로 먼저 해 보기", "Try an example schematic")}</Button>
        <p>{t("예제: Olimex ESP32-PoE 공개 회로도 (Apache-2.0)", "Example: Olimex ESP32-PoE open-hardware schematic (Apache-2.0)")}</p>
      </div>
      <p className="upload-help">{t("처음이라면", "New here?")} <a href={href("/guide/")}>{t("사용법", "Read the guide")}</a> · <a href={href("/help/formats/")}>{t("파일이 열리지 않을 때", "If a file won't open")}</a></p>
    </div><div className="upload-art"><CircuitArtwork /><p>{t("배선을 클릭해 연결을 확인하세요")}</p></div></div>
  </section>;
}
