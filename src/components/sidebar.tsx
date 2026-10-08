import { useMemo } from "react";
import { Cpu, Search, Waypoints, X } from "lucide-react";
import { Button, cn, Input, TabStrip } from "./ui.tsx";
import type { CompEntry, NetEntry } from "../lib/schematic/model.ts";

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
  selectedNet: string | null;
  selectedComp: string | null;
  onPickNet: (e: NetEntry) => void;
  onPickComp: (e: CompEntry) => void;
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
  selectedNet,
  selectedComp,
  onPickNet,
  onPickComp,
}: Props) {
  const q = query.trim().toUpperCase();
  const fNets = useMemo(() => (q ? nets.filter((n) => n.name.toUpperCase().includes(q)) : nets), [nets, q]);
  const fComps = useMemo(
    () =>
      q ? comps.filter((c) => c.ref.toUpperCase().includes(q) || c.values.some((v) => v.toUpperCase().includes(q))) : comps,
    [comps, q],
  );
  const power = fNets.filter((n) => n.power);
  const signal = fNets.filter((n) => !n.power);

  return (
    <aside aria-label="노드와 부품 목록" className="flex min-h-0 w-80 shrink-0 flex-col border-r border-border bg-card">
      <form
        role="search"
        className="border-b border-border p-3"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmitQuery();
        }}
      >
        <label htmlFor="sch-search" className="sr-only">
          노드, 핀, 부품 이름 검색
        </label>
        <div className="relative">
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
              aria-label="검색어 지우기"
              onClick={() => onQuery("")}
            >
              <X aria-hidden="true" />
            </Button>
          )}
        </div>
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
                노드 <span className="tabular-nums text-muted-foreground">{fNets.length}</span>
              </>
            ),
          },
          {
            value: "parts",
            label: (
              <>
                <Cpu aria-hidden="true" />
                부품 <span className="tabular-nums text-muted-foreground">{fComps.length}</span>
              </>
            ),
          },
        ]}
      />

      {tab === "nets" && (
        <div role="tabpanel" id="side-panel-nets" aria-labelledby="side-tab-nets" className="min-h-0 flex-1 overflow-y-auto px-2 pb-4 pt-2">
          {fNets.length === 0 && <p className="px-2 py-6 text-sm text-muted-foreground">일치하는 노드가 없습니다.</p>}
          {power.length > 0 && <NetGroup title="전원" items={power} selected={selectedNet} onPick={onPickNet} />}
          {signal.length > 0 && <NetGroup title="신호" items={signal} selected={selectedNet} onPick={onPickNet} />}
          {!q && unnamedCount > 0 && (
            <p className="px-2 pt-4 text-xs text-muted-foreground">
              라벨이 없는 노드 {unnamedCount.toLocaleString()}개는 도면에서 배선을 클릭해 확인할 수 있습니다.
            </p>
          )}
        </div>
      )}

      {tab === "parts" && (
        <div role="tabpanel" id="side-panel-parts" aria-labelledby="side-tab-parts" className="min-h-0 flex-1 overflow-y-auto px-2 pb-4 pt-2">
          {fComps.length === 0 && <p className="px-2 py-6 text-sm text-muted-foreground">일치하는 부품이 없습니다.</p>}
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
                  "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active && "bg-accent text-accent-foreground",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn("size-2 shrink-0 rounded-full", active ? "bg-red-600" : n.power ? "bg-primary" : "bg-border")}
                />
                <span className="min-w-0 flex-1 truncate font-mono">{n.name}</span>
                {n.labelCount > 1 && (
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground" aria-label={`라벨 ${n.labelCount}곳`}>
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
