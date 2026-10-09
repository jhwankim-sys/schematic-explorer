import { useT } from "../i18n.tsx";
import { memo, useCallback, useEffect, useId, useImperativeHandle, useMemo, useRef, useState, type Ref } from "react";
import { Minus, Plus, Scan } from "lucide-react";
import { Button, Spinner } from "./ui.tsx";
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
  /** nets drawn in the highlight colour (the rest of the sheet is dimmed meanwhile) */
  netIds: number[];
  /** text boxes outlined in the highlight colour (selected item's labels / reference) */
  focusTexts: SchText[];
  /** the label the user is stepping through (drawn with a stronger ring) */
  activeFocus?: SchText | null;
  /** search hits outlined in amber */
  matches: SchText[];
  activeMatch: number;
  onPick: (x: number, y: number, tolerance: number) => void;
  /** the PDF could not be painted (the outline drawing is shown instead) */
  onRenderError?: () => void;
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

export function SchematicViewer({ page, pdf, netIds, focusTexts, activeFocus, matches, activeMatch, onPick, onRenderError, ref }: Props) {
  const maskId = useId().replace(/:/g, "");
  const t = useT();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  /** view the bitmap on the canvas was painted for (it is stretched until the next repaint) */
  const [painted, setPainted] = useState<{ view: View; page: number; w: number; h: number } | null>(null);
  const [paintFailed, setPaintFailed] = useState(false);
  const [size, setSize] = useState({ w: 800, h: 600 });
  /** false until the drawing surface has been measured (the default size above is only a placeholder) */
  const [measured, setMeasured] = useState(false);
  /**
   * The last fit that was asked for. It is applied again when the surface changes size
   * (first layout, rotating a phone, opening the list sheet) until the user pans or zooms.
   */
  const stickyFit = useRef<{ box: Box | null; pad: number } | null>({ box: null, pad: 0.02 });
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 1 });
  const drag = useRef<{ id: number; sx: number; sy: number; vx: number; vy: number; moved: boolean } | null>(null);
  /** touch points on the drawing (two of them pinch-zoom) */
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  /** pinch in progress: start distance / scale and the drawing point under the fingers' midpoint */
  const pinch = useRef<{ d0: number; k0: number; ux: number; uy: number } | null>(null);
  const viewRef = useRef(view);
  const sizeRef = useRef(size);
  useEffect(() => {
    viewRef.current = view;
    sizeRef.current = size;
  });

  const fit = useCallback(
    (box?: Box | null, pad = 0.08) => {
      stickyFit.current = { box: box ?? null, pad };
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
      setMeasured(true);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // fit the whole sheet whenever a new page is shown, and keep the requested fit while the surface resizes
  const fittedFor = useRef<SchPage | null>(null);
  useEffect(() => {
    if (!measured) return;
    if (fittedFor.current !== page) {
      fittedFor.current = page;
      fit(null, 0.02);
    } else if (stickyFit.current) fit(stickyFit.current.box, stickyFit.current.pad);
  }, [page, size, measured, fit]);

  const zoomAt = useCallback((factor: number, sx?: number, sy?: number) => {
    stickyFit.current = null;
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
      // trackpad pinch arrives as ctrl+wheel with small steps
      zoomAt(Math.exp(e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)), e.clientX - r.left, e.clientY - r.top);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  // paint the real PDF for the visible area; debounced so panning / zooming stays smooth
  useEffect(() => {
    if (!pdf || paintFailed || !measured) return;
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
          if (!cancelled && !/cancel/i.test(String((e as Error)?.name ?? e))) {
            setPaintFailed(true);
            onRenderError?.();
          }
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
  }, [pdf, page, view, size, paintFailed, measured]);

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
    if (e.key.startsWith("Arrow")) stickyFit.current = null;
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
          pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          if (pointers.current.size === 2) {
            // second finger: pinch-zoom around the midpoint (no click comes out of it)
            const [a, b] = [...pointers.current.values()];
            const r = e.currentTarget.getBoundingClientRect();
            const v = viewRef.current;
            const mx = (a.x + b.x) / 2 - r.left, my = (a.y + b.y) / 2 - r.top;
            pinch.current = { d0: Math.max(Math.hypot(a.x - b.x, a.y - b.y), 1), k0: v.k, ux: v.x + mx * v.k, uy: v.y + my * v.k };
            drag.current = null;
            stickyFit.current = null;
            return;
          }
          if (pointers.current.size > 2) return;
          drag.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y, moved: false };
        }}
        onPointerMove={(e) => {
          if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          const pz = pinch.current;
          if (pz && pointers.current.size >= 2) {
            const [a, b] = [...pointers.current.values()];
            const r = e.currentTarget.getBoundingClientRect();
            const mx = (a.x + b.x) / 2 - r.left, my = (a.y + b.y) / 2 - r.top;
            const k = Math.min(Math.max((pz.k0 * pz.d0) / Math.max(Math.hypot(a.x - b.x, a.y - b.y), 1), 0.004), 5);
            setView({ x: pz.ux - mx * k, y: pz.uy - my * k, k });
            return;
          }
          const d = drag.current;
          if (!d || d.id !== e.pointerId) return;
          const dx = e.clientX - d.sx;
          const dy = e.clientY - d.sy;
          if (!d.moved && Math.hypot(dx, dy) < 4) return;
          d.moved = true;
          stickyFit.current = null;
          const k = viewRef.current.k;
          setView((v) => ({ ...v, x: d.vx - dx * k, y: d.vy - dy * k }));
        }}
        onPointerUp={(e) => {
          pointers.current.delete(e.pointerId);
          if (pinch.current) {
            if (pointers.current.size < 2) pinch.current = null;
            // the finger left on the glass keeps panning (and never counts as a tap)
            const rest = [...pointers.current.entries()][0];
            const v = viewRef.current;
            drag.current = rest ? { id: rest[0], sx: rest[1].x, sy: rest[1].y, vx: v.x, vy: v.y, moved: true } : null;
            return;
          }
          const d = drag.current;
          drag.current = null;
          if (!d || d.moved || d.id !== e.pointerId) return;
          const r = e.currentTarget.getBoundingClientRect();
          const v = viewRef.current;
          // fingers are less precise than a mouse pointer
          const tol = (e.pointerType === "touch" ? 9 : 5) * v.k;
          onPick(v.x + (e.clientX - r.left) * v.k, v.y + (e.clientY - r.top) * v.k, tol);
        }}
        onPointerCancel={(e) => {
          pointers.current.delete(e.pointerId);
          if (pointers.current.size < 2) pinch.current = null;
          drag.current = null;
        }}
        onDoubleClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          zoomAt(e.shiftKey ? 2 : 0.5, e.clientX - r.left, e.clientY - r.top);
        }}
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
            <rect
              x={0}
              y={0}
              width={page.width}
              height={page.height}
              fill={bitmap ? "none" : "#ffffff"}
              stroke="var(--border)"
              vectorEffect="non-scaling-stroke"
            />
          ) : (
            <>
              <rect x={0} y={0} width={page.width} height={page.height} fill="var(--card)" stroke="var(--border)" />
              <BaseDrawing page={page} />
            </>
          )}

          {/* while a node is selected the rest of the sheet is washed out; the node itself stays crisp */}
          {netD && (
            <>
              <defs>
                <mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={page.width} height={page.height}>
                  <rect x={0} y={0} width={page.width} height={page.height} fill="#ffffff" />
                  <path d={netD} fill="none" stroke="#000000" strokeWidth={14} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                  {netDots.map((d, i) => (
                    <circle key={i} cx={d.x} cy={d.y} r={Math.max(d.r * 1.6, 6 * px)} fill="#000000" />
                  ))}
                  {focusTexts.map((t) => (
                    <rect key={t.id} x={t.x0 - 3 * px} y={t.y0 - 3 * px} width={t.x1 - t.x0 + 6 * px} height={t.y1 - t.y0 + 6 * px} fill="#000000" />
                  ))}
                </mask>
              </defs>
              <rect
                className="net-dim"
                x={0}
                y={0}
                width={page.width}
                height={page.height}
                fill={showPdf ? "#ffffff" : "var(--card)"}
                fillOpacity={0.72}
                mask={`url(#${maskId})`}
              />
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
            <g className="net-highlight">
              <path
                d={netD}
                fill="none"
                stroke="var(--net-glow)"
                strokeOpacity={0.4}
                strokeWidth={10}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d={netD}
                fill="none"
                stroke="var(--net-highlight)"
                strokeWidth={2.2}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
              {netDots.map((d, i) => (
                <circle key={i} cx={d.x} cy={d.y} r={Math.max(d.r * 1.15, 3.2 * px)} fill="var(--net-highlight)" />
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
              className="focus-text"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {activeFocus && (
            <rect
              className="focus-ping"
              x={activeFocus.x0 - 6 * px}
              y={activeFocus.y0 - 6 * px}
              width={activeFocus.x1 - activeFocus.x0 + 12 * px}
              height={activeFocus.y1 - activeFocus.y0 + 12 * px}
              rx={4 * px}
              fill="none"
              strokeWidth={3}
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>
      </div>

      {showPdf && !bitmap && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" role="status" aria-live="polite">
          <div className="flex items-center gap-3 rounded-md border border-border bg-popover px-4 py-3 text-sm shadow-md">
            <Spinner />
            {t("도면 그리는 중")}
          </div>
        </div>
      )}

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
