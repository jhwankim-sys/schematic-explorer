import { useT } from "../i18n.tsx";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronDown, ChevronLeft, ChevronUp, Cpu, Download, Ellipsis, Info, PanelBottomClose, Search, Waypoints, X } from "lucide-react";
import { Button, cn, Input, TabStrip } from "./ui.tsx";
import { rankFilter, type CompEntry, type NetEntry } from "../lib/schematic/model.ts";

export type SidebarTab = "nets" | "parts";
/** list sheet on narrow portrait screens: just the handle, filling the space under the drawing, or tall */
export type SheetState = "closed" | "peek" | "full";
export type PanelMode = "both" | "detail" | "list";

interface Props {
  query: string;
  onQuery: (q: string) => void;
  onSubmitQuery: () => void;
  tab: SidebarTab;
  onTab: (t: SidebarTab) => void;
  nets: NetEntry[];
  comps: CompEntry[];
  unnamedCount: number;
  /** the PDF has no text layer (lettering drawn as strokes): names cannot be read */
  noText?: boolean;
  selectedNet: string | null;
  selectedComp: string | null;
  onPickNet: (e: NetEntry) => void;
  onPickComp: (e: CompEntry) => void;
  /** save the list of a tab as a CSV file */
  onExport: (tab: SidebarTab) => void;
  /** details of the current selection, shown under the lists (null when nothing is selected) */
  detail: ReactNode;
  /** the selection details are unfolded (on short panels they then replace the list, with a way back) */
  detailExpanded?: boolean;
  /** fold the selection details again (the "back to the list" button) */
  onFoldDetail?: () => void;
  /**
   * how the panel shows a selection: "both" (list and details together, the list keeping three whole
   * rows), "detail" (details alone, with a way back) or "list" (list alone, with a button to the details)
   */
  onPanelMode?: (mode: PanelMode) => void;
  /** sheet: the height that would show the head, the folded selection line and three whole rows */
  onPeekNeed?: (px: number) => void;
  /** one-line summary of the selection for the collapsed sheet on small screens */
  selectionSummary: { title: string; sub?: string } | null;
  /** "side": a panel left of the drawing (wide screens, phones held sideways); "sheet": a sheet under it */
  layout: "side" | "sheet";
  /** short landscape screens: a narrower side panel */
  compact?: boolean;
  /** sheet only */
  sheetState: SheetState;
  onSheetState: (s: SheetState) => void;
  /** sheet height in the "peek" state (CSS px) */
  peekHeight: number;
  /** side layout: fold the panel away */
  onCollapse?: () => void;
  /** extra controls on the sheet handle (stepping through a net's labels) */
  handleExtra?: ReactNode;
  /** sheet: search position and previous / next, shown under the search box */
  searchStatus?: ReactNode;
}

/** gap kept above the tall sheet so a strip of the drawing stays visible */
const FULL_GAP = 88;
const HANDLE = 44;

export function SchematicSidebar({
  query,
  onQuery,
  onSubmitQuery,
  tab,
  onTab,
  nets,
  comps,
  unnamedCount,
  noText,
  selectedNet,
  selectedComp,
  onPickNet,
  onPickComp,
  onExport,
  detail,
  detailExpanded,
  onFoldDetail,
  onPanelMode,
  onPeekNeed,
  selectionSummary,
  layout,
  compact,
  sheetState,
  onSheetState,
  peekHeight,
  onCollapse,
  handleExtra,
  searchStatus,
}: Props) {
  const sheet = layout === "sheet";
  const open = !sheet || sheetState !== "closed";
  const t = useT();
  const q = query.trim().toUpperCase();
  // exact matches come first so "R1" is not buried under R10…R19
  const fNets = useMemo(() => (q ? rankFilter(nets, q, (n) => [n.name]) : nets), [nets, q]);
  const fComps = useMemo(() => (q ? rankFilter(comps, q, (c) => [c.ref, ...c.values]) : comps), [comps, q]);
  const power = fNets.filter((n) => n.power);
  const signal = fNets.filter((n) => !n.power);

  // ----- dragging the sheet by its handle (snaps to the nearest height on release; a tap toggles)
  const asideRef = useRef<HTMLElement>(null);
  const [dragH, setDragH] = useState<number | null>(null);
  const dragRef = useRef<{ id: number; y0: number; h0: number; moved: boolean } | null>(null);
  const heights = () => {
    const parent = asideRef.current?.parentElement?.clientHeight ?? window.innerHeight;
    return { closed: HANDLE, peek: Math.min(peekHeight, parent - FULL_GAP), full: Math.max(parent - FULL_GAP, peekHeight) };
  };
  const dragHandlers = (onTap: () => void) => ({
    onPointerDown: (e: React.PointerEvent) => {
      if (!sheet || e.button > 0) return;
      dragRef.current = { id: e.pointerId, y0: e.clientY, h0: asideRef.current?.getBoundingClientRect().height ?? HANDLE, moved: false };
    },
    onPointerMove: (e: React.PointerEvent) => {
      const d = dragRef.current;
      if (!d || d.id !== e.pointerId) return;
      const dy = e.clientY - d.y0;
      if (!d.moved && Math.abs(dy) < 6) return;
      if (!d.moved) (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      d.moved = true;
      const h = heights();
      setDragH(Math.min(Math.max(d.h0 - dy, HANDLE), h.full));
    },
    onPointerUp: (e: React.PointerEvent) => {
      const d = dragRef.current;
      dragRef.current = null;
      if (!d || d.id !== e.pointerId) return;
      if (!d.moved) return; // the click handler does the tap
      const h = heights();
      const end = Math.min(Math.max(d.h0 - (e.clientY - d.y0), HANDLE), h.full);
      const pick = (Object.entries(h) as [SheetState, number][]).reduce((a, b) => (Math.abs(b[1] - end) < Math.abs(a[1] - end) ? b : a))[0];
      setDragH(null);
      onSheetState(pick);
      // swallow the click that follows a drag
      const stop = (ev: Event) => { ev.stopPropagation(); ev.preventDefault(); };
      window.addEventListener("click", stop, { capture: true, once: true });
      setTimeout(() => window.removeEventListener("click", stop, { capture: true }), 0);
    },
    onPointerCancel: () => {
      dragRef.current = null;
      setDragH(null);
    },
    onClick: onTap,
  });

  const height =
    !sheet ? undefined : dragH !== null ? dragH : sheetState === "peek" ? peekHeight : sheetState === "full" ? `calc(100% - ${FULL_GAP}px)` : undefined;

  // A selection and the list share the panel only while the list still shows three whole rows (each
  // 44px on touch screens) under the head and the selection; otherwise the panel switches explicitly to
  // the details alone ("back to list") or, once the user went back, to the list alone (a button leads
  // to the details again). Heights are measured, not assumed.
  const headRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const [m, setM] = useState({ aside: 0, head: 0, folded: 0, rows3: 0 });
  const measure = useCallback(() => {
    setM((prev) => {
      const next = { ...prev, aside: asideRef.current?.clientHeight ?? 0 };
      const head = headRef.current?.offsetHeight ?? 0;
      if (head > 0) next.head = head; // the head is hidden while the details fill the panel
      const det = detailRef.current?.firstElementChild as HTMLElement | null;
      // the folded line's own height: its head row plus the section's padding and border (the section
      // itself may be stretched or squeezed by the panel, so its box is not used)
      const headRow = det?.firstElementChild as HTMLElement | null;
      if (det && headRow) {
        const cs = getComputedStyle(det);
        next.folded = Math.ceil(headRow.offsetHeight + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) + parseFloat(cs.borderTopWidth));
      }
      const panel = listRef.current;
      const rows = panel?.querySelectorAll("li > button");
      if (panel && rows && rows.length >= 1) {
        // from the top of the list area to the bottom of its third row, plus the area's own bottom space
        const third = rows[Math.min(2, rows.length - 1)] as HTMLElement;
        const top = panel.getBoundingClientRect().top - panel.scrollTop;
        const pad = parseFloat(getComputedStyle(panel).paddingTop) || 0;
        const rowH = third.offsetHeight;
        const missing = Math.max(0, 2 - (rows.length - 1)) * rowH; // fewer than 3 items: count the full 3
        next.rows3 = Math.ceil(third.getBoundingClientRect().bottom - top + missing + pad);
      }
      return next.aside === prev.aside && next.head === prev.head && next.folded === prev.folded && next.rows3 === prev.rows3 ? prev : next;
    });
  }, []);
  useEffect(() => {
    const ro = new ResizeObserver(measure);
    for (const r of [asideRef, headRef, listRef, detailRef]) if (r.current) ro.observe(r.current);
    measure();
    return () => ro.disconnect();
  });
  const rows3 = m.rows3 || (layout === "sheet" || compact ? 162 : 126);
  const DETAIL_MIN = 52 + 120; // unfolded details: their head and a body that can show a few lines
  const [listPref, setListPref] = useState(false);
  useEffect(() => {
    if (!detail) setListPref(false);
  }, [detail]);
  const detailNeed = detailExpanded ? DETAIL_MIN : m.folded || 53;
  const GRABBER = sheet ? 24 : 0; // the sheet's grab bar above the head
  const fitsBoth = m.aside > 0 && m.aside - GRABBER - m.head - detailNeed >= rows3;
  const mode: PanelMode = !detail || !open ? "both" : fitsBoth ? "both" : listPref ? "list" : "detail";
  const detailView = mode === "detail";
  useEffect(() => onPanelMode?.(mode), [mode, onPanelMode]);
  // + the sheet's top border (clientHeight leaves it out) and 1px for rounding
  const peekNeed = GRABBER + m.head + (m.folded || 53) + rows3 + 2;
  useEffect(() => {
    if (sheet && m.head) onPeekNeed?.(peekNeed);
  }, [sheet, peekNeed, m.head, onPeekNeed]);

  /** the sheet size buttons (44px on touch screens): shown in the head, and in the details-only bar */
  const sheetButtons = sheet && (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-9 shrink-0"
        aria-label={t(sheetState === "full" ? "목록 줄이기" : "목록 크게 보기")}
        title={t(sheetState === "full" ? "목록 줄이기" : "목록 크게 보기")}
        onClick={() => onSheetState(sheetState === "full" ? "peek" : "full")}
      >
        {sheetState === "full" ? <ChevronDown aria-hidden="true" /> : <ChevronUp aria-hidden="true" />}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-9 shrink-0"
        aria-label={t("목록 접기")}
        title={t("목록 접기")}
        onClick={() => onSheetState("closed")}
      >
        <PanelBottomClose aria-hidden="true" />
      </Button>
    </>
  );

  // next to a selection the list keeps room for three whole rows (the details body scrolls instead)
  const listStyle = detail && mode === "both" ? { minHeight: rows3 } : undefined;
  const listCls = cn(
    "min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-[calc(1rem+var(--kb,0px))] pt-1",
    (!sheet || sheetState === "full") && "min-h-[6.5rem] pointer-coarse:min-h-[8.25rem]",
  );

  return (
    <aside
      ref={asideRef}
      aria-label={t("노드와 부품 목록")}
      data-panel-mode={detail ? mode : "none"}
      data-rows3={rows3}
      style={height !== undefined ? { height, maxHeight: `calc(100% - ${FULL_GAP}px)` } : undefined}
      className={cn(
        "flex min-h-0 shrink-0 flex-col border-border bg-card",
        compact && "side-compact",
        sheet ? "sheet w-full overflow-hidden border-t" : cn("h-auto border-r", compact ? "w-56" : "w-72"),
        sheet && open && "sheet-open",
      )}
    >
      {/* sheet folded: a slim handle that opens the lists; the drawing keeps the rest of the screen */}
      {sheet && !open && (
        <div className="flex min-h-11 shrink-0 items-center">
          <button
            type="button"
            aria-expanded={false}
            aria-controls="side-body"
            {...dragHandlers(() => onSheetState("peek"))}
            className="sheet-handle flex min-h-11 touch-none min-w-0 flex-1 items-center gap-2.5 px-3 py-1.5 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          >
            {selectionSummary ? (
              <>
                <span aria-hidden="true" className="selection-dot size-2.5 shrink-0 rounded-full" />
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-mono font-semibold">{selectionSummary.title}</span>
                  {selectionSummary.sub && <span className="ml-2 text-xs text-muted-foreground">{selectionSummary.sub}</span>}
                </span>
              </>
            ) : (
              <>
                <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate text-muted-foreground">
                  {t(`노드 ${nets.length} · 부품 ${comps.length}`, `${nets.length} nets · ${comps.length} parts`, `ネット ${nets.length} · 部品 ${comps.length}`)}
                </span>
              </>
            )}
            <span className="sr-only">{t("목록 열기")}</span>
            <ChevronUp className="size-4 shrink-0" aria-hidden="true" />
          </button>
          {handleExtra}
        </div>
      )}

      <div id="side-body" className={cn("min-h-0 flex-1 flex-col", open ? "flex" : "hidden")}>
      {/* open sheet: a grab bar for dragging (and tapping to fold). It is an extra for touch: the 44px
          buttons beside the search box do the same, and are what keyboards and screen readers use */}
      {sheet && (
        <div
          aria-hidden="true"
          {...dragHandlers(() => onSheetState("closed"))}
          className="sheet-grabber flex h-6 w-full shrink-0 cursor-grab touch-none items-center justify-center"
        >
          <span className="h-1 w-10 rounded-full bg-border" />
        </div>
      )}
      {detailView && (
        <div className="flex shrink-0 items-center gap-1 border-b border-border px-1 py-0.5 pr-3">
          <Button
            variant="ghost"
            size="sm"
            className="mr-auto text-sm"
            onClick={() => {
              setListPref(true);
              onFoldDetail?.();
              // more room for the list next to the selection
              if (sheet && sheetState !== "full") onSheetState("full");
            }}
          >
            <ChevronLeft aria-hidden="true" />
            {t("목록으로")}
          </Button>
          {sheetButtons}
        </div>
      )}
      <div ref={headRef} className={cn("shrink-0", detailView && "hidden")}>
      <form
        role="search"
        className={cn("flex items-center gap-1", sheet ? "px-3 pb-1.5" : compact ? "px-2 py-1" : "p-3 pb-1")}
        onSubmit={(e) => {
          e.preventDefault();
          onSubmitQuery();
        }}
      >
        <label htmlFor="sch-search" className="sr-only">
          {t("노드, 핀, 부품 이름 검색")}
        </label>
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id="sch-search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            onFocus={() => {
              // the on-screen keyboard covers the lower half: give the results the tall sheet
              if (sheet && sheetState !== "full") onSheetState("full");
            }}
            placeholder="+5V, VCC, R12 …"
            className="pl-8 pr-8 font-mono"
            autoComplete="off"
            enterKeyHint="search"
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0.5 top-1/2 size-7 -translate-y-1/2"
              aria-label={t("검색어 지우기")}
              onClick={() => onQuery("")}
            >
              <X aria-hidden="true" />
            </Button>
          )}
        </div>
        {sheetButtons}
        {!sheet && onCollapse && (
          <Button type="button" variant="ghost" size="icon" className="size-8 shrink-0" aria-label={t("목록 접기")} title={t("목록 접기")} onClick={onCollapse}>
            <ChevronLeft aria-hidden="true" />
          </Button>
        )}
      </form>
      {searchStatus}

      <div className={cn("flex shrink-0 items-center gap-1 border-b border-border", compact ? "px-2 pb-1" : "px-3 pb-1.5")}>
      <TabStrip<SidebarTab>
        idPrefix="side"
        className={compact ? "p-0.5" : undefined}
        value={tab}
        onChange={onTab}
        tabs={[
          {
            value: "nets",
            label: (
              <>
                <Waypoints aria-hidden="true" />
                {t("노드")}<span className="tabular-nums text-muted-foreground">{fNets.length}</span>
              </>
            ),
          },
          {
            value: "parts",
            label: (
              <>
                <Cpu aria-hidden="true" />
                {t("부품")}<span className="tabular-nums text-muted-foreground">{fComps.length}</span>
              </>
            ),
          },
        ]}
      />

        {mode === "list" && (
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={t("선택 정보 보기")}
            title={t("선택 정보 보기")}
            onClick={() => setListPref(false)}
          >
            <Info aria-hidden="true" />
          </Button>
        )}
        <ExportMenu tab={tab} disabled={{ nets: nets.length === 0, parts: comps.length === 0 }} onExport={onExport} />
      </div>
      </div>

      {tab === "nets" && !detailView && (
        <div ref={listRef} role="tabpanel" id="side-panel-nets" aria-labelledby="side-tab-nets" className={listCls} style={listStyle}>
          {noText && (
            <p className="mx-1 mb-2 rounded-md border border-border bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground">
              {t(
                "이 PDF는 글자가 선으로 그려져 있어 노드 이름을 읽을 수 없습니다. 도면에서 배선을 누르면 연결은 확인할 수 있습니다.",
                "This PDF draws its lettering as lines, so net names can't be read. Click a wire in the drawing to see its connections.",
              )}
            </p>
          )}
          {fNets.length === 0 && !noText && <p className="px-2 py-6 text-sm text-muted-foreground">{t("일치하는 노드가 없습니다.")}</p>}
          {power.length > 0 && <NetGroup title={t("전원")} items={power} selected={selectedNet} onPick={onPickNet} />}
          {signal.length > 0 && <NetGroup title={t("신호")} items={signal} selected={selectedNet} onPick={onPickNet} />}
          {!q && unnamedCount > 0 && (
            <p className="px-2 pt-4 text-xs text-muted-foreground">
              {t(`라벨이 없는 노드 ${unnamedCount.toLocaleString()}개는 도면에서 배선을 클릭해 확인할 수 있습니다.`, `Click wires in the drawing to inspect ${unnamedCount.toLocaleString()} unlabeled nets.`, `ラベルのないネット${unnamedCount.toLocaleString()}個は、図面で配線をクリックすると確認できます。`)}
            </p>
          )}
        </div>
      )}

      {tab === "parts" && !detailView && (
        <div ref={listRef} role="tabpanel" id="side-panel-parts" aria-labelledby="side-tab-parts" className={listCls} style={listStyle}>
          {fComps.length === 0 && <p className="px-2 py-6 text-sm text-muted-foreground">{t("일치하는 부품이 없습니다.")}</p>}
          <ul className="flex flex-col">
            {fComps.map((c) => {
              const active = selectedComp === c.ref;
              return (
                <li key={c.ref}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => onPickComp(c)}
                    className={cn(
                      "tap-row flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active && "bg-accent text-accent-foreground",
                    )}
                  >
                    <span className="w-20 shrink-0 truncate font-mono font-medium">{c.ref}</span>
                    <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">{c.values.join(" · ")}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {mode !== "list" && (
        <div ref={detailRef} className={detailView ? "flex min-h-0 flex-1 flex-col [&>section]:flex-1" : "contents"}>
          {detail}
        </div>
      )}
      </div>
    </aside>
  );
}

function NetGroup({
  title,
  items,
  selected,
  onPick,
}: {
  title: string;
  items: NetEntry[];
  selected: string | null;
  onPick: (e: NetEntry) => void;
}) {
  const t = useT();
  return (
    <section className="mb-3">
      <h3 className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      <ul className="flex flex-col">
        {items.map((n) => {
          const active = selected?.toUpperCase() === n.name.toUpperCase();
          return (
            <li key={n.name}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onPick(n)}
                className={cn(
                  "tap-row flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active && "bg-accent text-accent-foreground",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn("size-2 shrink-0 rounded-full", active ? "selection-dot" : n.power ? "bg-primary" : "bg-border")}
                />
                <span className="min-w-0 flex-1 truncate font-mono">{n.name}</span>
                {n.labelCount > 1 && (
                  <span
                    className="shrink-0 text-xs tabular-nums text-muted-foreground"
                    aria-label={t(`라벨 ${n.labelCount}곳`, `${n.labelCount} labels`, `ラベル ${n.labelCount}か所`)}
                    title={active ? t("같은 이름 라벨로 차례로 이동") : undefined}
                  >
                    ×{n.labelCount}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * The CSV downloads, folded into a small menu beside the tabs (menu button pattern, like the language
 * menu): Enter / Space / ArrowDown open it and focus the first item, ArrowUp / ArrowDown / Home / End
 * move, Enter runs an item, Esc closes; focus returns to the button. The list is placed with fixed
 * coordinates (below the button, or above it when there is no room) so a short sheet cannot cut it off.
 */
function ExportMenu({
  tab,
  disabled,
  onExport,
}: {
  tab: SidebarTab;
  disabled: Record<SidebarTab, boolean>;
  onExport: (tab: SidebarTab) => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const items: [SidebarTab, string][] = [
    ["nets", t("노드 목록 CSV")],
    ["parts", t("부품 목록 CSV")],
  ];
  // the open tab's list first
  if (tab === "parts") items.reverse();
  const enabled = () => [...(listRef.current?.querySelectorAll<HTMLButtonElement>("[role=menuitem]:not(:disabled)") ?? [])];
  const close = (focusButton = true) => {
    setOpen(false);
    if (focusButton) buttonRef.current?.focus();
  };
  const openMenu = () => {
    const b = buttonRef.current?.getBoundingClientRect();
    if (b) {
      const w = 192;
      const h = 8 + items.length * 44;
      const left = Math.max(8, Math.min(b.right - w, window.innerWidth - w - 8));
      const below = b.bottom + 4 + h <= window.innerHeight - 8;
      setPos({ left, top: below ? b.bottom + 4 : Math.max(8, b.top - 4 - h) });
    }
    setOpen(true);
  };
  useEffect(() => {
    if (!open) return;
    enabled()[0]?.focus();
    const away = (e: PointerEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", away);
    return () => window.removeEventListener("pointerdown", away);
  }, [open]);
  return (
    <div
      ref={boxRef}
      className="relative shrink-0"
      onKeyDown={(e) => {
        if (!open) return;
        const list = enabled();
        const i = list.indexOf(document.activeElement as HTMLButtonElement);
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          close();
        } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          list[(i + (e.key === "ArrowDown" ? 1 : list.length - 1) + list.length) % list.length]?.focus();
        } else if (e.key === "Home" || e.key === "End") {
          e.preventDefault();
          (e.key === "Home" ? list[0] : list[list.length - 1])?.focus();
        } else if (e.key === "Tab") setOpen(false);
      }}
    >
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon"
        className="size-8"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("내보내기")}
        title={t("내보내기")}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            openMenu();
          }
        }}
      >
        <Ellipsis aria-hidden="true" />
      </Button>
      {open && pos && (
        <div
          ref={listRef}
          role="menu"
          aria-label={t("내보내기")}
          className="fixed z-50 w-48 rounded-md border border-border bg-popover p-1 shadow-md"
          style={{ left: pos.left, top: pos.top }}
        >
          {items.map(([which, label]) => (
            <button
              key={which}
              type="button"
              role="menuitem"
              disabled={disabled[which]}
              onClick={() => {
                close();
                onExport(which);
              }}
              className="tap-row flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted focus:bg-muted disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4"
            >
              <Download aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
