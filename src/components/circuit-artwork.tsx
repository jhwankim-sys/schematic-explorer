import { useT } from "../i18n.tsx";

/** Original vector artwork; no remote image requests or third-party assets. */
export function CircuitArtwork() {
  const t = useT();
  return <div className="circuit-artwork">
    <svg viewBox="0 0 560 330" role="img" aria-label={t("같은 전원 노드를 강조한 회로 예시", "Illustration of a highlighted power net")}>
      <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="330" y="76" width="145" height="174" rx="6" />
        <path d="M308 116h22m-22 48h22m-22 48h22M475 116h38m-38 48h38m-38 48h38M80 164h40m0 0v-40h74m0 0v-24M120 164v46h22l7-7 9 14 9-14 9 14 9-14 7 7h22v48M198 100h-8m4-12v12M199 268h30m-25 7h20m-15 7h10M513 116v48" />
        <path d="M253 164v48m-14 0h28m-28 8h28m-14 0v38m-15 0h30m-24 7h18m-12 7h6" />
      </g>
      <g fill="none" stroke="var(--net-highlight)" strokeLinecap="round">
        <path d="M80 164h228M120 164v-40h74v-24M253 164v48" strokeWidth="14" opacity=".16" />
        <path d="M80 164h228M120 164v-40h74v-24M253 164v48" strokeWidth="3" />
        <circle cx="120" cy="164" r="4" fill="var(--net-highlight)" /><circle cx="253" cy="164" r="4" fill="var(--net-highlight)" />
      </g>
      <g fill="currentColor" fontFamily="ui-monospace, Consolas, monospace" fontSize="13">
        <text x="42" y="168" fill="var(--net-highlight)">+5V</text><text x="205" y="91">VCC</text><text x="159" y="245">R1</text><text x="278" y="219">C1</text><text x="390" y="63">U1</text><text x="344" y="120">1 RX</text><text x="344" y="168">4 VCC</text><text x="344" y="216">5 GND</text><text x="423" y="120">TX 8</text><text x="417" y="168">IO 7</text>
      </g>
    </svg>
  </div>;
}
