import { useRef } from "react";
import { FileUp } from "lucide-react";
import { Button } from "./ui.tsx";
import { usePageHref, useT } from "../i18n.tsx";

export function UploadHero({ onFile, onExample, busy }: { onFile: (f: File) => void; onExample: () => void; busy: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useT();
  const href = usePageHref();
  return <section aria-labelledby="upload-title" className="upload-screen">
    <div className="upload-box">
      <h1 id="upload-title">{t("회로도 PDF 열기", "Open a schematic PDF")}</h1>
      <p className="upload-lede">{t("KiCad, OrCAD, Altium, Eagle 등에서 내보낸 벡터 PDF를 열 수 있습니다. 스캔본·사진·암호가 걸린 PDF는 분석할 수 없습니다.", "Works with vector PDFs exported from KiCad, OrCAD, Altium, Eagle and similar tools. Scanned, photographed and password-protected PDFs can't be analyzed.")}</p>
      <div className="upload-zone">
        <FileUp size={28} aria-hidden="true" />
        <p className="upload-drop">{t("PDF 파일을 여기에 끌어다 놓거나", "Drop a PDF here, or")}</p>
        <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="sr-only" aria-label={t("회로도 PDF 파일 선택")} onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
        <Button size="lg" onClick={() => inputRef.current?.click()} disabled={busy}>{t("파일 선택", "Choose a file")}</Button>
      </div>
      <p className="upload-example">{t("파일이 없다면", "No file at hand?")} <button type="button" className="link-button" onClick={onExample} disabled={busy}>{t("예제 회로도 열기", "Open the example schematic")}</button> <span>{t("(Olimex ESP32-PoE, Apache-2.0)", "(Olimex ESP32-PoE, Apache-2.0)")}</span></p>
      <p className="upload-privacy">{t("파일은 서버로 보내지 않고 이 브라우저에서만 처리하며, 탭을 닫으면 사라집니다.", "Your file is never uploaded. It is processed in this browser only and is gone when you close the tab.")}</p>
      <p className="upload-help"><a href={href("/guide/")}>{t("사용법", "Guide")}</a> · <a href={href("/help/formats/")}>{t("파일이 열리지 않을 때", "If a file won't open")}</a></p>
    </div>
  </section>;
}
