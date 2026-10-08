import { useT } from "../i18n.tsx";
import { memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type Ref } from "react";
import { Minus, Plus, Scan } from "lucide-react";
import { Button } from "./ui.tsx";
import type { SchPage, SchText } from "../lib/schematic/analyze.ts";
import { segPath, type Box } from "../lib/schematic/model.ts";

export interface ViewerHandle {
  fit: (box?: Box | null, pad?: number) => void;
}

interface View {
  x: number;
  y: number;
  /** drawing units per screen pixel */
  k: number;
}

/** the bits of a pdf.js document the viewer needs to paint the real drawing */
export interface PdfRenderSource {
  getPage(n: number): Promise<{
    getViewport(o: { scale: number; offsetX?: number; offsetY?: number }): unknown;
    render(o: { canvasContext: CanvasRenderingContext2D; viewport: unknown; background?: string }): {
      promise: Promise<void>;
      cancel(): void;
    };
  }>;
}

interface Props {
  page: SchPage;
  /** pdf.js document: when present the original PDF is painted underneath */
  pdf?: PdfRenderSource | null;
  /** nets drawn in red */
  netIds: number[];
  /** text boxes outlined in red (selected item's labels / reference) */
  focusTexts: SchText[];
  /** search hits outlined in amber */
  matches: SchText[];
  activeMatch: number;
  onPick: (x: number, y: number, tolerance: number) => void;
  ref?: Ref<ViewerHandle>;
}

/** fallback when the PDF itself can't be painted: outlines only (filled areas would black out the sheet) */
const BaseDrawing = memo(function BaseDrawing({ page }: { page: SchPage }) {
  return (
    <g>
      <path
        d={page.strokePath}
        fill="none"
        stroke="currentColor"
        strokeWidth={0.9}
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {!page.vectorText &&
        page.texts.map((t) => (
          <text
            key={t.id}
            x={t.ax}
            y={t.ay}
            fontSize={t.size}
            fill="currentColor"
            fontFamily="ui-monospace, Menlo, Consolas, monospace"
            transform={t.rot ? `rotate(${t.rot} ${t.ax} ${t.ay})` : undefined}
          >
            {t.str}
          </text>
        ))}
    </g>
  );
});

export function SchematicViewer({ page, pdf, netIds, focusTexts, matches, activeMatch, onPick, ref }: Props) {
  const t = useT();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  /** view the bitmap on the canvas was painted for (it is stretched until the next repaint) */
  const [painted, setPainted] = useState<{ view: View; page: number; w: number; h: number } | null>(null);
  const [paintFailed, setPaintFailed] = useState(false);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 1 });
  const drag = useRef<{ id: number; sx: number; sy: number; vx: number; vy: number; moved: boolean } | null>(null);
  const viewRef = useRef(view);
  const sizeRef = useRef(size);
  useEffect(() => {
    viewRef.current = view;
    sizeRef.current = size;
  });

  const fit = useCallback(
    (box?: Box | null, pad = 0.08) => {
      const b: Box = box ?? [0, 0, page.width, page.height];
      const { w, h } = sizeRef.current;
      const bw = Math.max(b[2] - b[0], 20);
      const bh = Math.max(b[3] - b[1], 20);
      const k = Math.max(bw / (w * (1 - 2 * pad)), bh / (h * (1 - 2 * pad)), 0.004);
      const cx = (b[0] + b[2]) / 2;
      const cy = (b[1] + b[3]) / 2;
      setView({ x: cx - (w * k) / 2, y: cy - (h * k) / 2, k });
    },
    [page.width, page.height],
  );

  useImperativeHandle(ref, () => ({ fit }), [fit]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const r = e.contentRect;
      const next = { w: Math.max(r.width, 50), h: Math.max(r.height, 50) };
      sizeRef.current = next;
      setSize(next);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // fit the whole sheet whenever a new page is shown
  const fittedFor = useRef<SchPage | null>(null);
  useEffect(() => {
    if (fittedFor.current !== page && size.w > 50) {
      fittedFor.current = page;
      fit(null, 0.02);
    }
  }, [page, size, fit]);

  const zoomAt = useCallback((factor: number, sx?: number, sy?: number) => {
    setView((v) => {
      const { w, h } = sizeRef.current;
      const px = sx ?? w / 2;
      const py = sy ?? h / 2;
      const k = Math.min(Math.max(v.k * factor, 0.004), 5);
      const ux = v.x + px * v.k;
      const uy = v.y + py * v.k;
      return { x: ux - px * k, y: uy - py * k, k };
    });
  }, []);

  // wheel zoom needs a non-passive listener on the drawing surface itself
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomAt(Math.exp(e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  // paint the real PDF for the visible area; debounced so panning / zooming stays smooth
  useEffect(() => {
    if (!pdf || paintFailed) return;
    let cancelled = false;
    let task: { cancel(): void } | null = null;
    const fresh = !painted || painted.page !== page.index;
    const timer = setTimeout(
      async () => {
        try {
          const pg = await pdf.getPage(page.index + 1);
          if (cancelled) return;
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const scale = dpr / view.k;
          const viewport = pg.getViewport({ scale, offsetX: -view.x * scale, offsetY: -view.y * scale });
          const off = document.createElement("canvas");
          off.width = Math.max(1, Math.ceil(size.w * dpr));
          off.height = Math.max(1, Math.ceil(size.h * dpr));
          const ctx = off.getContext("2d");
          if (!ctx) throw new Error("canvas");
          const t = pg.render({ canvasContext: ctx, viewport, background: "#ffffff" });
          task = t;
          await t.promise;
          const c = canvasRef.current;
          if (cancelled || !c) return;
          c.width = off.width;
          c.height = off.height;
          c.getContext("2d")?.drawImage(off, 0, 0);
          setPainted({ view, page: page.index, w: size.w, h: size.h });
        } catch (e) {
          if (!cancelled && !/cancel/i.test(String((e as Error)?.name ?? e))) setPaintFailed(true);
        }
      },
      fresh ? 0 : 140,
    );
    return () => {
      cancelled = true;
      clearTimeout(timer);
      task?.cancel();
    };
    // painted is read only to decide the delay
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdf, page, view, size, paintFailed]);

  const showPdf = !!pdf && !paintFailed;
  const shown = painted && painted.page === page.index ? painted : null;
  const bitmap = shown?.view ?? null;

  const netD = useMemo(() => segPath(page, netIds), [page, netIds]);
  const netDots = useMemo(() => {
    const set = new Set(netIds);
    return page.dots.filter((d) => set.has(d.net));
  }, [page, netIds]);

  const px = view.k; // one screen pixel in drawing units
  const vb = `${view.x} ${view.y} ${size.w * view.k} ${size.h * view.k}`;

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = 60 * view.k;
    if (e.key === "+" || e.key === "=") zoomAt(1 / 1.3);
    else if (e.key === "-") zoomAt(1.3);
    else if (e.key === "0") fit(null, 0.02);
    else if (e.key === "ArrowLeft") setView((v) => ({ ...v, x: v.x - step }));
    else if (e.key === "ArrowRight") setView((v) => ({ ...v, x: v.x + step }));
    else if (e.key === "ArrowUp") setView((v) => ({ ...v, y: v.y - step }));
    else if (e.key === "ArrowDown") setView((v) => ({ ...v, y: v.y + step }));
    else return;
    e.preventDefault();
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div
        ref={wrapRef}
        style={{ position: "relative" }}
        id="drawing"
        tabIndex={0}
        role="application"
        aria-roledescription={t("회로도", "Schematic")}
        aria-label={t("회로도 도면. 클릭하면 같은 노드가 강조됩니다. 휠 또는 +, - 키로 확대·축소, 화살표 키로 이동, 0 키로 전체 보기.", "Schematic drawing. Click a wire to highlight its net. Use the wheel or + and - to zoom, arrow keys to pan, and 0 to fit the drawing.")}
        className="h-full w-full cursor-crosshair touch-none select-none bg-muted text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        onKeyDown={onKeyDown}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y, moved: false };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d || d.id !== e.pointerId) return;
          const dx = e.clientX - d.sx;
          const dy = e.clientY - d.sy;
          if (!d.moved && Math.hypot(dx, dy) < 4) return;
          d.moved = true;
          const k = viewRef.current.k;
          setView((v) => ({ ...v, x: d.vx - dx * k, y: d.vy - dy * k }));
        }}
        onPointerUp={(e) => {
          const d = drag.current;
          drag.current = null;
          if (!d || d.moved) return;
          const r = e.currentTarget.getBoundingClientRect();
          const v = viewRef.current;
          onPick(v.x + (e.clientX - r.left) * v.k, v.y + (e.clientY - r.top) * v.k, 5 * v.k);
        }}
        onPointerCancel={() => (drag.current = null)}
      >
        {showPdf && (
          <canvas
            ref={canvasRef}
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 origin-top-left"
            style={{
              width: shown?.w ?? size.w,
              height: shown?.h ?? size.h,
              visibility: bitmap ? "visible" : "hidden",
              transform: bitmap
                ? `translate(${(bitmap.x - view.x) / view.k}px, ${(bitmap.y - view.y) / view.k}px) scale(${bitmap.k / view.k})`
                : undefined,
            }}
          />
        )}
        <svg width={size.w} height={size.h} viewBox={vb} className="relative block" aria-hidden="true">
          {showPdf ? (
            <rect x={0} y={0} width={page.width} height={page.height} fill="none" stroke="var(--border)" vectorEffect="non-scaling-stroke" />
          ) : (
            <>
              <rect x={0} y={0} width={page.width} height={page.height} fill="var(--card)" stroke="var(--border)" />
              <BaseDrawing page={page} />
            </>
          )}

          {/* search hits */}
          {matches.map((t, i) => (
            <rect
              key={`m${t.id}`}
              x={t.x0 - 1.5 * px}
              y={t.y0 - 1.5 * px}
              width={t.x1 - t.x0 + 3 * px}
              height={t.y1 - t.y0 + 3 * px}
              rx={2 * px}
              className={i === activeMatch ? "fill-amber-400/50 stroke-amber-600" : "fill-amber-300/35 stroke-amber-500"}
              strokeWidth={i === activeMatch ? 2.5 : 1.5}
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {/* selected node */}
          {netD && (
            <g className="net-highlight text-red-600 dark:text-red-500">
              <path
                d={netD}
                fill="none"
                stroke="currentColor"
                strokeOpacity={0.22}
                strokeWidth={9}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d={netD}
                fill="none"
                stroke="currentColor"
                strokeWidth={2.6}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
              {netDots.map((d, i) => (
                <circle key={i} cx={d.x} cy={d.y} r={Math.max(d.r * 1.15, 3.2 * px)} fill="currentColor" />
              ))}
            </g>
          )}
          {focusTexts.map((t) => (
            <rect
              key={`f${t.id}`}
              x={t.x0 - 2 * px}
              y={t.y0 - 2 * px}
              width={t.x1 - t.x0 + 4 * px}
              height={t.y1 - t.y0 + 4 * px}
              rx={2 * px}
              className="fill-red-500/15 stroke-red-600 dark:stroke-red-500"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      </div>

      <div className="absolute bottom-4 right-4 flex flex-col overflow-hidden rounded-md border border-border bg-popover shadow-sm">
        <Button variant="ghost" size="icon" aria-label={t("확대")} onClick={() => zoomAt(1 / 1.4)}>
          <Plus aria-hidden="true" />
        </Button>
        <Button variant="ghost" size="icon" aria-label={t("축소")} onClick={() => zoomAt(1.4)}>
          <Minus aria-hidden="true" />
        </Button>
        <Button variant="ghost" size="icon" aria-label={t("전체 보기")} onClick={() => fit(null, 0.02)}>
          <Scan aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
