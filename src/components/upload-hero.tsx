import { useId, useRef, useState } from "react";
import { FileUp } from "lucide-react";
import { Button } from "./ui.tsx";
import { cn } from "./ui.tsx";

/** Inline diagram: a tiny circuit whose highlighted node shows what a click does. */
function NodeIllustration() {
  const titleId = useId();
  const descId = useId();
  return (
    <figure className="w-full max-w-xl">
      <svg
        viewBox="0 0 520 250"
        role="img"
        aria-labelledby={`${titleId} ${descId}`}
        className="w-full text-foreground"
      >
        <title id={titleId}>같은 노드 강조 예시</title>
        <desc id={descId}>
          +5V 라벨이 붙은 배선 하나를 클릭하면, 저항 R1과 커패시터 C1, IC 핀 4번까지 이어진 같은 노드 전체가 빨간색으로
          표시됩니다.
        </desc>
        <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          {/* IC body */}
          <rect x="330" y="40" width="130" height="170" rx="2" />
          <path d="M305 80h25M305 120h25M305 170h25M460 80h25M460 140h25" />
          {/* resistor to ground side */}
          <path d="M150 170v20l-8 5 16 6-16 6 16 6-8 5v20" />
          <path d="M135 236h30M141 242h18M147 248h6" />
          {/* other wires */}
          <path d="M40 80h60M485 80h20M485 140h20M250 120h55M250 120v-30" />
          <path d="M235 90h30" />
        </g>
        {/* the highlighted node */}
        <g className="text-red-600 dark:text-red-500" stroke="currentColor" strokeLinecap="round" fill="none">
          <path d="M100 120h205M150 120v50M220 120v28" strokeWidth="10" strokeOpacity="0.2" />
          <path d="M100 120h205M150 120v50M220 120v28" strokeWidth="2.6" />
          <circle cx="150" cy="120" r="4.5" fill="currentColor" />
          <circle cx="220" cy="120" r="4.5" fill="currentColor" />
          <rect x="52" y="108" width="40" height="22" rx="3" strokeWidth="2" className="fill-red-500/15" />
        </g>
        {/* capacitor on the node */}
        <g stroke="currentColor" strokeWidth="1.4" className="text-foreground">
          <path d="M206 148h28M206 156h28M220 156v28" />
          <path d="M207 184h26M212 190h16" />
        </g>
        <g className="fill-foreground" fontFamily="ui-monospace, Menlo, Consolas, monospace" fontSize="13">
          <text x="57" y="124">+5V</text>
          <text x="163" y="205">R1</text>
          <text x="242" y="165">C1</text>
          <text x="340" y="124">4 VCC</text>
          <text x="340" y="84">1 RX</text>
          <text x="340" y="174">5 GND</text>
          <text x="410" y="84">TX 8</text>
          <text x="398" y="144">ADC 7</text>
          <text x="375" y="30">U1</text>
        </g>
        <g className="fill-red-700 dark:fill-red-400" fontSize="12" fontFamily="var(--font-sans)">
          <path d="M150 120 l-24 -46" stroke="currentColor" strokeWidth="1" className="stroke-red-700 dark:stroke-red-400" />
          <text x="72" y="64">클릭한 지점</text>
        </g>
      </svg>
      <figcaption className="sr-only">한 지점을 클릭하면 연결된 배선, 접점, 라벨이 함께 빨간색으로 표시됩니다.</figcaption>
    </figure>
  );
}

export function UploadHero({ onFile, busy }: { onFile: (f: File) => void; busy: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    <section
      aria-labelledby="upload-title"
      className={cn(
        "flex h-full flex-col items-center justify-center gap-8 bg-muted px-6 py-10 transition-colors",
        over && "bg-accent",
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
    >
      <NodeIllustration />
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <h2 id="upload-title" className="text-xl font-semibold tracking-tight">
          회로도 PDF를 올려 노드를 따라가 보세요
        </h2>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          aria-label="회로도 PDF 파일 선택"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = "";
          }}
        />
        <Button size="lg" onClick={() => inputRef.current?.click()} disabled={busy}>
          <FileUp aria-hidden="true" />
          PDF 파일 선택
        </Button>
        <p className="text-sm text-muted-foreground">또는 이 영역에 파일을 끌어다 놓으세요. 파일은 브라우저 안에서만 분석됩니다.</p>
      </div>
    </section>
  );
}
