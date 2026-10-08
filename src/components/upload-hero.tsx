import { useRef } from "react";
import { FileUp, LockKeyhole, ArrowRight } from "lucide-react";
import { Button } from "./ui.tsx";
import { CircuitArtwork } from "./circuit-artwork.tsx";
import { useT } from "../i18n.tsx";

export function UploadHero({ onFile, busy }: { onFile: (f: File) => void; busy: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useT();
  return <section aria-labelledby="upload-title" className="upload-screen">
    <div className="upload-layout"><div className="upload-copy">
      <p className="eyebrow">SCHEMATIC VIEWER / WORKSPACE</p>
      <h1 id="upload-title">{t("회로도 PDF를 열어보세요")}</h1>
      <p>{t("전원과 신호의 연결을 원본 도면 위에서 탐색하세요. 파일을 선택하거나 이 화면에 끌어다 놓으면 분석이 시작됩니다.", "Trace power and signal connections on the original drawing. Choose a PDF or drop it anywhere in this workspace to begin.")}</p>
      <div className="upload-zone"><FileUp size={32} aria-hidden="true" /><h2>{t("파일 선택 또는 드래그앤드롭")}</h2>
        <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="sr-only" aria-label={t("회로도 PDF 파일 선택")} onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
        <Button size="lg" onClick={() => inputRef.current?.click()} disabled={busy}>{t("PDF 파일 선택")}<ArrowRight aria-hidden="true" /></Button><p>{t("벡터 PDF 권장 · 스캔 PDF 미지원")}</p>
      </div><div className="local-note"><LockKeyhole size={16} aria-hidden="true" />{t("파일은 브라우저 안에서만 분석됩니다.")}</div>
    </div><div className="upload-art"><CircuitArtwork /><p>{t("배선을 클릭해 연결을 확인하세요")}</p></div></div>
  </section>;
}
