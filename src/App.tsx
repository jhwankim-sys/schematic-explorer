import { useCallback, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, FileUp, Focus, X } from "lucide-react";
import { Badge, Button, Spinner } from "./components/ui.tsx";
import { SchematicSidebar, type SidebarTab } from "./components/sidebar.tsx";
import { SchematicViewer, type ViewerHandle } from "./components/viewer.tsx";
import { UploadHero } from "./components/upload-hero.tsx";
import type { SchText } from "./lib/schematic/analyze.ts";
import { loadSchematic, type Schematic } from "./lib/schematic/extract.ts";
import {
  buildCompEntries,
  buildNetEntries,
  matchTexts,
  netBox,
  netsNamed,
  PageIndex,
  textBox,
  unionBox,
  type CompEntry,
  type NetEntry,
  type Selection,
} from "./lib/schematic/model.ts";

export function App() {
  const [doc, setDoc] = useState<Schematic | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [pageIdx, setPageIdx] = useState(0);
  const [sel, setSel] = useState<Selection>(null);
  const [query, setQuery] = useState("");
  const [matchIdx, setMatchIdx] = useState(0);
  const [tab, setTab] = useState<SidebarTab>("nets");
  const [error, setError] = useState<string | null>(null);
  const viewer = useRef<ViewerHandle>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const openFile = useCallback(async (file: File) => {
    if (!/\.pdf$/i.test(file.name) && file.type !== "application/pdf") {
      setError("PDF 파일만 열 수 있습니다.");
      return;
    }
    setError(null);
    setBusy("도면 읽는 중");
    try {
      const d = await loadSchematic(file, (m) => setBusy(m));
      setDoc(d);
      setPageIdx(0);
      setSel(null);
      setQuery("");
    } catch {
      setError("이 PDF에서 회로도를 읽지 못했습니다. 손상되었거나 암호가 걸린 파일인지 확인해 주세요.");
    } finally {
      setBusy(null);
    }
  }, []);

  const page = doc?.pages[pageIdx] ?? null;
  const index = useMemo(() => (page ? new PageIndex(page) : null), [page]);
  const netEntries = useMemo(() => (doc ? buildNetEntries(doc.pages) : []), [doc]);
  const compEntries = useMemo(() => (doc ? buildCompEntries(doc.pages) : []), [doc]);
  const unnamedCount = useMemo(
    () => (doc ? doc.pages.reduce((a, p) => a + p.nets.filter((n) => !n.name && n.segs.length > 1).length, 0) : 0),
    [doc],
  );

  const matches = useMemo(() => (page ? matchTexts(page, query) : []), [page, query]);

  // ----- selection helpers
  const selectNet = useCallback(
    (pIdx: number, netIds: number[], name: string, zoom = true) => {
      if (!doc) return;
      const p = doc.pages[pIdx];
      setPageIdx(pIdx);
      setSel({ type: "net", page: pIdx, netIds, name });
      if (zoom) requestAnimationFrame(() => viewer.current?.fit(netBox(p, netIds), 0.12));
    },
    [doc],
  );

  const pickNetEntry = useCallback(
    (e: NetEntry) => {
      const w = e.where.find((x) => x.page === pageIdx) ?? e.where[0];
      selectNet(w.page, w.netIds, e.name);
    },
    [pageIdx, selectNet],
  );

  const pickComp = useCallback(
    (c: CompEntry) => {
      if (!doc) return;
      const w = c.where.find((x) => x.page === pageIdx) ?? c.where[0];
      const p = doc.pages[w.page];
      setPageIdx(w.page);
      setSel({ type: "component", ref: c.ref });
      const b = unionBox(w.textIds.map((id) => textBox(p.texts[id])));
      if (b) requestAnimationFrame(() => viewer.current?.fit([b[0] - 30, b[1] - 22, b[2] + 30, b[3] + 22], 0.05));
    },
    [doc, pageIdx],
  );

  const onPick = useCallback(
    (x: number, y: number, tol: number) => {
      if (!page || !index) return;
      const t = index.textAt(x, y, tol * 0.4);
      if (t) {
        if (t.kind === "component") {
          const c = compEntries.find((c) => c.ref === t.str.replace(/^\*/, ""));
          if (c) {
            setSel({ type: "component", ref: c.ref });
            setTab("parts");
            return;
          }
        }
        if (t.net >= 0) {
          const n = page.nets[t.net];
          selectNet(page.index, n.name ? netsNamed(page, n.name) : [n.id], n.name, false);
          return;
        }
      }
      const s = index.segAt(x, y, tol);
      if (s >= 0) {
        const n = page.nets[page.segNet[s]];
        selectNet(page.index, n.name ? netsNamed(page, n.name) : [n.id], n.name, false);
        setTab("nets");
        return;
      }
      if (t) {
        // plain text (pin number, value, note): find every place it appears
        setQuery(t.str);
        setMatchIdx(0);
        setSel(null);
        return;
      }
      setSel(null);
    },
    [page, index, compEntries, selectNet],
  );

  // ----- what to draw
  const netIds = sel?.type === "net" && sel.page === pageIdx ? sel.netIds : [];
  const focusTexts: SchText[] = useMemo(() => {
    if (!page || !sel) return [];
    if (sel.type === "net") {
      if (sel.page !== pageIdx) return [];
      const ids = new Set<number>();
      for (const n of sel.netIds) for (const l of page.nets[n].labels) ids.add(l);
      if (sel.name) for (const t of page.texts) if (t.str.toUpperCase() === sel.name.toUpperCase()) ids.add(t.id);
      return [...ids].map((i) => page.texts[i]);
    }
    const c = page.components.find((c) => c.ref === sel.ref);
    return c ? c.textIds.map((i) => page.texts[i]) : [];
  }, [page, pageIdx, sel]);

  const netInfo = useMemo(() => {
    if (!page || sel?.type !== "net" || sel.page !== pageIdx) return null;
    const nets = sel.netIds.map((i) => page.nets[i]);
    const labels = new Map<string, number>();
    for (const n of nets) for (const l of n.labels) labels.set(page.texts[l].str, (labels.get(page.texts[l].str) ?? 0) + 1);
    const segs = nets.reduce((a, n) => a + n.segs.length, 0);
    const set = new Set(sel.netIds);
    const dots = page.dots.filter((d) => set.has(d.net)).length;
    return { labels: [...labels.entries()].sort((a, b) => b[1] - a[1]), segs, dots };
  }, [page, pageIdx, sel]);

  const compInfo = useMemo(() => (sel?.type === "component" ? compEntries.find((c) => c.ref === sel.ref) ?? null : null), [sel, compEntries]);

  const gotoMatch = (i: number) => {
    if (!matches.length) return;
    const k = (i + matches.length) % matches.length;
    setMatchIdx(k);
    const t = matches[k];
    viewer.current?.fit([t.x0 - 40, t.y0 - 28, t.x1 + 40, t.y1 + 28], 0.05);
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-background">
      <a
        href="#drawing"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-sm focus:bg-popover focus:px-3 focus:py-2 focus:shadow"
      >
        도면으로 건너뛰기
      </a>
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
        <h1 className="font-heading text-sm font-semibold uppercase tracking-wide">회로도 노드 탐색기</h1>
        {doc && (
          <>
            <span className="h-4 w-px bg-border" aria-hidden="true" />
            <p className="min-w-0 truncate text-sm text-muted-foreground" title={doc.fileName}>
              {doc.fileName}
            </p>
            {doc.pages.length > 1 && (
              <nav aria-label="페이지" className="flex items-center gap-1">
                {doc.pages.map((p) => (
                  <Button
                    key={p.index}
                    size="sm"
                    variant={p.index === pageIdx ? "default" : "ghost"}
                    aria-current={p.index === pageIdx ? "page" : undefined}
                    onClick={() => setPageIdx(p.index)}
                  >
                    {p.index + 1}
                  </Button>
                ))}
              </nav>
            )}
          </>
        )}
        <div className="ml-auto">
          {doc && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf,.pdf"
                className="sr-only"
                aria-label="다른 회로도 PDF 선택"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void openFile(f);
                  e.target.value = "";
                }}
              />
              <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={!!busy}>
                <FileUp aria-hidden="true" />
                다른 PDF 열기
              </Button>
            </>
          )}
        </div>
      </header>

      <main className="flex min-h-0 flex-1">
        {doc && page && (
          <SchematicSidebar
            query={query}
            onQuery={(q) => {
              setQuery(q);
              setMatchIdx(0);
            }}
            onSubmitQuery={() => gotoMatch(matchIdx)}
            tab={tab}
            onTab={setTab}
            nets={netEntries}
            comps={compEntries}
            unnamedCount={unnamedCount}
            selectedNet={sel?.type === "net" ? sel.name || null : null}
            selectedComp={sel?.type === "component" ? sel.ref : null}
            onPickNet={pickNetEntry}
            onPickComp={pickComp}
          />
        )}

        <section aria-label="도면" className="relative min-w-0 flex-1">
          {!doc || !page ? (
            <UploadHero onFile={(f) => void openFile(f)} busy={!!busy} />
          ) : (
            <SchematicViewer
              ref={viewer}
              page={page}
              netIds={netIds}
              focusTexts={focusTexts}
              matches={matches}
              activeMatch={matchIdx}
              onPick={onPick}
            />
          )}

          {doc && query.trim() && (
            <div className="absolute left-1/2 top-3 flex -translate-x-1/2 items-center gap-1 rounded-md border border-border bg-popover py-1 pl-3 pr-1 text-sm shadow-sm">
              <span className="font-mono">{query.trim()}</span>
              <span className="px-2 tabular-nums text-muted-foreground" aria-live="polite">
                {matches.length ? `${Math.min(matchIdx + 1, matches.length)} / ${matches.length}` : "도면에 없음"}
              </span>
              <Button variant="ghost" size="icon" className="size-7" aria-label="이전 위치" disabled={!matches.length} onClick={() => gotoMatch(matchIdx - 1)}>
                <ChevronUp aria-hidden="true" />
              </Button>
              <Button variant="ghost" size="icon" className="size-7" aria-label="다음 위치" disabled={!matches.length} onClick={() => gotoMatch(matchIdx + 1)}>
                <ChevronDown aria-hidden="true" />
              </Button>
            </div>
          )}

          {netInfo && sel?.type === "net" && (
            <aside
              aria-label="선택한 노드"
              className="absolute left-3 top-3 w-72 rounded-md border border-border bg-popover p-3 shadow-md"
            >
              <div className="flex items-start gap-2">
                <span aria-hidden="true" className="mt-1.5 size-2.5 shrink-0 rounded-full bg-red-600" />
                <h2 className="min-w-0 flex-1 break-all font-mono text-base font-semibold">
                  {sel.name || "이름 없는 노드"}
                </h2>
                <Button variant="ghost" size="icon" className="-mr-1 -mt-1 size-7" aria-label="선택 해제" onClick={() => setSel(null)}>
                  <X aria-hidden="true" />
                </Button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                배선 {netInfo.segs}개 · 접점 {netInfo.dots}개
              </p>
              {netInfo.labels.length > 0 && (
                <div className="mt-3">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">연결된 라벨·핀 이름</h3>
                  <ul className="mt-1.5 flex max-h-32 flex-wrap gap-1 overflow-y-auto">
                    {netInfo.labels.map(([s, n]) => (
                      <li key={s}>
                        <Badge className="font-mono">
                          {s}
                          {n > 1 && <span className="text-muted-foreground">×{n}</span>}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <Button
                size="sm"
                variant="outline"
                className="mt-3 w-full"
                onClick={() => page && viewer.current?.fit(netBox(page, sel.netIds), 0.12)}
              >
                <Focus aria-hidden="true" />
                노드 전체 보기
              </Button>
            </aside>
          )}

          {compInfo && (
            <aside
              aria-label="선택한 부품"
              className="absolute left-3 top-3 w-64 rounded-md border border-border bg-popover p-3 shadow-md"
            >
              <div className="flex items-start gap-2">
                <h2 className="min-w-0 flex-1 font-mono text-base font-semibold">{compInfo.ref}</h2>
                <Button variant="ghost" size="icon" className="-mr-1 -mt-1 size-7" aria-label="선택 해제" onClick={() => setSel(null)}>
                  <X aria-hidden="true" />
                </Button>
              </div>
              {compInfo.values.length > 0 && <p className="mt-1 font-mono text-sm">{compInfo.values.join(" · ")}</p>}
              <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => pickComp(compInfo)}>
                <Focus aria-hidden="true" />
                부품 위치로 이동
              </Button>
            </aside>
          )}

          {error && (
            <div
              role="alert"
              className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-md border border-red-300 bg-popover px-4 py-2 text-sm text-red-700 shadow-md dark:text-red-300"
            >
              {error}
              <Button variant="ghost" size="icon" className="size-7" aria-label="알림 닫기" onClick={() => setError(null)}>
                <X aria-hidden="true" />
              </Button>
            </div>
          )}

          {busy && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70" role="status" aria-live="polite">
              <div className="flex items-center gap-3 rounded-md border border-border bg-popover px-4 py-3 text-sm shadow-md">
                <Spinner />
                {busy}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
