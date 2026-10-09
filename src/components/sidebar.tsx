import { useT } from "../i18n.tsx";
import { useMemo, type ReactNode } from "react";
import { ChevronDown, ChevronLeft, ChevronUp, Cpu, Download, Search, Waypoints, X } from "lucide-react";
import { Button, cn, Input, TabStrip } from "./ui.tsx";
import { rankFilter, type CompEntry, type NetEntry } from "../lib/schematic/model.ts";

export type SidebarTab = "nets" | "parts";

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
  /** save the list of the open tab as a CSV file */
  onExport: (tab: SidebarTab) => void;
  /** details of the current selection, shown under the lists (null when nothing is selected) */
  detail: ReactNode;
  /** one-line summary of the selection for the collapsed sheet on small screens */
  selectionSummary: { title: string; sub?: string } | null;
  /** "side": a panel left of the drawing (wide screens, phones held sideways); "sheet": a sheet under it */
  layout: "side" | "sheet";
  /** short landscape screens: a narrower side panel */
  compact?: boolean;
  /** sheet: whether it is open; side: whether the panel is shown */
  sheetOpen: boolean;
  onSheetOpen: (open: boolean) => void;
  /** side layout: fold the panel away */
  onCollapse?: () => void;
  /** extra controls on the sheet handle (stepping through a net's labels) */
  handleExtra?: ReactNode;
}

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
  selectionSummary,
  layout,
  compact,
  sheetOpen,
  onSheetOpen,
  onCollapse,
  handleExtra,
}: Props) {
  const sheet = layout === "sheet";
  const t = useT();
  const q = query.trim().toUpperCase();
  // exact matches come first so "R1" is not buried under R10…R19
  const fNets = useMemo(() => (q ? rankFilter(nets, q, (n) => [n.name]) : nets), [nets, q]);
  const fComps = useMemo(() => (q ? rankFilter(comps, q, (c) => [c.ref, ...c.values]) : comps), [comps, q]);
  const power = fNets.filter((n) => n.power);
  const signal = fNets.filter((n) => !n.power);

  return (
    <aside
      aria-label={t("노드와 부품 목록")}
      className={cn(
        "flex min-h-0 shrink-0 flex-col border-border bg-card",
        compact && "side-compact",
        sheet ? "w-full border-t" : cn("h-auto border-r", compact ? "w-56" : "w-72"),
        sheet && sheetOpen && "h-[46dvh]",
      )}
    >
      {/* sheet: a slim handle that opens the lists; the drawing keeps the rest of the screen */}
      {sheet && (
        <div className="flex min-h-11 shrink-0 items-center">
          <button
            type="button"
            aria-expanded={sheetOpen}
            aria-controls="side-body"
            onClick={() => onSheetOpen(!sheetOpen)}
            className="flex min-h-11 min-w-0 flex-1 items-center gap-2.5 px-3 py-1.5 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          >
            {selectionSummary && !sheetOpen ? (
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
                  {t(`노드 ${nets.length} · 부품 ${comps.length}`, `${nets.length} nets · ${comps.length} parts`)}
                </span>
              </>
            )}
            <span className="sr-only">{t(sheetOpen ? "목록 닫기" : "목록 열기")}</span>
            {sheetOpen ? <ChevronDown className="size-4 shrink-0" aria-hidden="true" /> : <ChevronUp className="size-4 shrink-0" aria-hidden="true" />}
          </button>
          {!sheetOpen && handleExtra}
        </div>
      )}

      <div id="side-body" className={cn("min-h-0 flex-1 flex-col", sheet && "border-t border-border", !sheet || sheetOpen ? "flex" : "hidden")}>
      <form
        role="search"
        className={cn("flex items-center gap-1 border-b border-border", compact ? "p-2" : "p-3")}
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
            placeholder="+5V, VCC, R12 …"
            className="pl-8 pr-8 font-mono"
            autoComplete="off"
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
        {!sheet && onCollapse && (
          <Button type="button" variant="ghost" size="icon" className="size-8 shrink-0" aria-label={t("목록 접기")} title={t("목록 접기")} onClick={onCollapse}>
            <ChevronLeft aria-hidden="true" />
          </Button>
        )}
      </form>

      <TabStrip<SidebarTab>
        idPrefix="side"
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

      <div className="flex items-center justify-end px-3 pt-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          disabled={tab === "nets" ? nets.length === 0 : comps.length === 0}
          onClick={() => onExport(tab)}
        >
          <Download aria-hidden="true" />
          {tab === "nets" ? t("노드 목록 CSV") : t("부품 목록 CSV")}
        </Button>
      </div>

      {tab === "nets" && (
        <div role="tabpanel" id="side-panel-nets" aria-labelledby="side-tab-nets" className="min-h-0 flex-1 overflow-y-auto px-2 pb-4 pt-2">
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
              {t(`라벨이 없는 노드 ${unnamedCount.toLocaleString()}개는 도면에서 배선을 클릭해 확인할 수 있습니다.`, `Click wires in the drawing to inspect ${unnamedCount.toLocaleString()} unlabeled nets.`)}
            </p>
          )}
        </div>
      )}

      {tab === "parts" && (
        <div role="tabpanel" id="side-panel-parts" aria-labelledby="side-tab-parts" className="min-h-0 flex-1 overflow-y-auto px-2 pb-4 pt-2">
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
                      "flex w-full items-baseline gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
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

      {detail}
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
      <h3 className="px-2 pb-1 pt-2 text-xs font-semibold text-muted-foreground">{title}</h3>
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
                  "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
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
                    aria-label={t(`라벨 ${n.labelCount}곳`, `${n.labelCount} labels`)}
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
