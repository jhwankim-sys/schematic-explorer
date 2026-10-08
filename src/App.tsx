import { useT } from "./i18n.tsx";
import { installFileDrop } from "./lib/file-drop.ts";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, FileUp, Focus, X } from "lucide-react";
import { Badge, Button, cn, Spinner } from "./components/ui.tsx";
import { SchematicSidebar, type SidebarTab } from "./components/sidebar.tsx";
import { SchematicViewer, type PdfRenderSource, type ViewerHandle } from "./components/viewer.tsx";
import { UploadHero } from "./components/upload-hero.tsx";
import type { SchText } from "./lib/schematic/analyze.ts";
import { loadSchematic, type Schematic } from "./lib/schematic/extract.ts";
import {
  buildCompEntries,
  buildNetEntries,
  countExact,
  matchTexts,
  netBox,
  netsNamed,
  PageIndex,
  textBox,
  toCsv,
  unionBox,
  type CompEntry,
  type NetEntry,
  type Selection,
} from "./lib/schematic/model.ts";

interface AppProps {
  active?: boolean;
  /** shown at the start / end of the toolbar (site brand, language switch) so the workspace needs one header row only */
  headerStart?: ReactNode;
  headerEnd?: ReactNode;
}

export function App({ active = true, headerStart, headerEnd }: AppProps) {
  const t = useT();
  const [dragging, setDragging] = useState(false);
  const [documentSerial, setDocumentSerial] = useState(0);
  const loading = useRef(false);
  const [doc, setDoc] = useState<Schematic | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [pageIdx, setPageIdx] = useState(0);
  const [sel, setSel] = useState<Selection>(null);
  const [query, setQuery] = useState("");
  const [matchIdx, setMatchIdx] = useState(0);
  const [tab, setTab] = useState<SidebarTab>("nets");
  const [error, setError] = useState<string | null>(null);
  /** selection details in the sidebar can be folded away */
  const [detailOpen, setDetailOpen] = useState(true);
  /** small screens: whether the list sheet under the drawing is open */
  const [sheetOpen, setSheetOpen] = useState(false);
  const viewer = useRef<ViewerHandle>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  /** set while the query comes from typing: the view then moves to the first hit without Enter */
  const typed = useRef(false);

  const openFile = useCallback(async (file: File) => {
    if (loading.current) return;
    if (!/\.pdf$/i.test(file.name) && file.type !== "application/pdf") {
      setError("PDF 파일만 열 수 있습니다.");
      return;
    }
    loading.current = true;
    setError(null);
    setBusy("도면 읽는 중");
    try {
      const d = await loadSchematic(file, (m) => setBusy(m));
      setDoc(d);
      setDocumentSerial((n) => n + 1);
      setMatchIdx(0);
      setTab("nets");
      setPageIdx(0);
      setSel(null);
      setQuery("");
      setSheetOpen(false);
    } catch {
      setError("이 PDF에서 회로도를 읽지 못했습니다. 손상되었거나 암호가 걸린 파일인지 확인해 주세요.");
    } finally {
      loading.current = false;
      setBusy(null);
    }
  }, []);

  useEffect(() => {
    if (!active) { setDragging(false); return; }
    return installFileDrop(window, (file) => { void openFile(file); }, setDragging);
  }, [active, openFile]);

  const page = doc?.pages[pageIdx] ?? null;
  const index = useMemo(() => (page ? new PageIndex(page) : null), [page]);
  const netEntries = useMemo(() => (doc ? buildNetEntries(doc.pages) : []), [doc]);
  const compEntries = useMemo(() => (doc ? buildCompEntries(doc.pages) : []), [doc]);
  const unnamedCount = useMemo(
    () => (doc ? doc.pages.reduce((a, p) => a + p.nets.filter((n) => !n.name && n.segs.length > 1).length, 0) : 0),
    [doc],
  );

  const matches = useMemo(() => (page ? matchTexts(page, query) : []), [page, query]);
  const exactCount = useMemo(() => countExact(matches, query), [matches, query]);

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
      setSheetOpen(false);
      selectNet(w.page, w.netIds, e.name);
    },
    [pageIdx, selectNet],
  );

  const pickComp = useCallback(
    (c: CompEntry) => {
      if (!doc) return;
      const w = c.where.find((x) => x.page === pageIdx) ?? c.where[0];
      const p = doc.pages[w.page];
      setSheetOpen(false);
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

  /** pages a named net appears on (labels with the same name), for the page chips */
  const selEntry = useMemo(
    () => (sel?.type === "net" && sel.name ? netEntries.find((e) => e.name.toUpperCase() === sel.name.toUpperCase()) ?? null : null),
    [sel, netEntries],
  );

  /** switching pages keeps a named net selected when it is on the new page too */
  const gotoPage = useCallback(
    (i: number) => {
      const w = selEntry?.where.find((x) => x.page === i);
      if (w && sel?.type === "net") selectNet(i, w.netIds, sel.name, false);
      else setPageIdx(i);
    },
    [selEntry, sel, selectNet],
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
    if (!page || sel?.type !== "net") return null;
    if (sel.page !== pageIdx) return { labels: [] as [string, number][], segs: 0, dots: 0, here: false };
    const nets = sel.netIds.map((i) => page.nets[i]);
    const labels = new Map<string, number>();
    for (const n of nets) for (const l of n.labels) labels.set(page.texts[l].str, (labels.get(page.texts[l].str) ?? 0) + 1);
    const segs = nets.reduce((a, n) => a + n.segs.length, 0);
    const set = new Set(sel.netIds);
    const dots = page.dots.filter((d) => set.has(d.net)).length;
    return { labels: [...labels.entries()].sort((a, b) => b[1] - a[1]), segs, dots, here: true };
  }, [page, pageIdx, sel]);

  const compInfo = useMemo(() => (sel?.type === "component" ? compEntries.find((c) => c.ref === sel.ref) ?? null : null), [sel, compEntries]);

  const gotoMatch = (i: number) => {
    if (!matches.length) return;
    const k = (i + matches.length) % matches.length;
    setMatchIdx(k);
    const t = matches[k];
    viewer.current?.fit([t.x0 - 40, t.y0 - 28, t.x1 + 40, t.y1 + 28], 0.05);
  };

  // typing a name is enough: after a short pause the view moves to the best hit
  useEffect(() => {
    if (!typed.current || !matches.length || query.trim().length < 2) return;
    const id = setTimeout(() => {
      typed.current = false;
      setMatchIdx(0);
      const m = matches[0];
      viewer.current?.fit([m.x0 - 40, m.y0 - 28, m.x1 + 40, m.y1 + 28], 0.05);
    }, 400);
    return () => clearTimeout(id);
  }, [matches, query]);

  // Esc: clear the selection first, then the search
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      const inField = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      if (inField) {
        if (query) setQuery("");
        else (e.target as HTMLElement).blur();
      } else if (sel) setSel(null);
      else if (query) setQuery("");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, sel, query]);

  const exportCsv = useCallback(
    (which: SidebarTab) => {
      if (!doc) return;
      const pagesOf = (w: { page: number }[]) => [...new Set(w.map((x) => x.page + 1))].sort((x, y) => x - y).join(" ");
      const rows =
        which === "nets"
          ? [["net", "type", "labels", "pages"], ...netEntries.map((n) => [n.name, n.power ? "power" : "signal", n.labelCount, pagesOf(n.where)])]
          : [["reference", "value", "pages"], ...compEntries.map((c) => [c.ref, c.values.join(" / "), pagesOf(c.where)])];
      const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${doc.fileName.replace(/\.pdf$/i, "")}-${which}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    [doc, netEntries, compEntries],
  );

  const selectionSummary =
    netInfo && sel?.type === "net"
      ? {
          title: sel.name || t("이름 없는 노드"),
          sub: netInfo.here
            ? t(`배선 ${netInfo.segs}개 · 접점 ${netInfo.dots}개`, `${netInfo.segs} wires · ${netInfo.dots} junctions`)
            : t("이 페이지에는 이 노드가 없습니다."),
        }
      : compInfo
        ? { title: compInfo.ref, sub: compInfo.values.join(" · ") || undefined }
        : null;

  // selection details live in the sidebar (under the lists) so they never cover the drawing
  const detailHead = (title: string, mono = true) => (
    <div className="flex items-center gap-2">
      <span aria-hidden="true" className="selection-dot size-2.5 shrink-0 rounded-full" />
      <h2 className={cn("min-w-0 flex-1 truncate text-sm font-semibold", mono && "font-mono")} title={title}>
        {title}
      </h2>
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        aria-expanded={detailOpen}
        aria-controls="selection-detail"
        aria-label={t(detailOpen ? "선택 정보 접기" : "선택 정보 펼치기")}
        onClick={() => setDetailOpen((o) => !o)}
      >
        {detailOpen ? <ChevronDown aria-hidden="true" /> : <ChevronUp aria-hidden="true" />}
      </Button>
      <Button variant="ghost" size="icon" className="-mr-1 size-7" aria-label={t("선택 해제")} onClick={() => setSel(null)}>
        <X aria-hidden="true" />
      </Button>
    </div>
  );
  const detail =
    netInfo && sel?.type === "net" ? (
      <section aria-label={t("선택한 노드")} className="shrink-0 border-t border-border bg-card px-3 py-2">
        {detailHead(sel.name || t("이름 없는 노드"), !!sel.name)}
        {detailOpen && (
          <div id="selection-detail" className="pb-1">
            <p className="mt-1 text-xs text-muted-foreground">
              {netInfo.here
                ? t(`배선 ${netInfo.segs}개 · 접점 ${netInfo.dots}개`, `${netInfo.segs} wires · ${netInfo.dots} junctions`)
                : t("이 페이지에는 이 노드가 없습니다.")}
            </p>
            {doc && doc.pages.length > 1 && selEntry && (
              <div className="mt-2 flex flex-wrap items-center gap-1">
                <h3 className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("있는 페이지")} {selEntry.where.length}/{doc.pages.length}
                </h3>
                {selEntry.where.map((w) => (
                  <Button
                    key={w.page}
                    size="sm"
                    variant={w.page === pageIdx ? "default" : "outline"}
                    className="h-6 min-w-6 px-1.5 text-xs tabular-nums"
                    aria-current={w.page === pageIdx ? "page" : undefined}
                    onClick={() => selectNet(w.page, w.netIds, sel.name)}
                  >
                    {w.page + 1}
                  </Button>
                ))}
              </div>
            )}
            {netInfo.labels.length > 0 && (
              <div className="mt-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t("연결된 라벨·핀 이름")}</h3>
                <ul className="mt-1.5 flex max-h-28 flex-wrap gap-1 overflow-y-auto">
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
            {netInfo.here && (
              <Button
                size="sm"
                variant="outline"
                className="mt-3 w-full"
                onClick={() => {
                  setSheetOpen(false);
                  if (page) viewer.current?.fit(netBox(page, sel.netIds), 0.12);
                }}
              >
                <Focus aria-hidden="true" />
                {t("노드 전체 보기")}
              </Button>
            )}
          </div>
        )}
      </section>
    ) : compInfo ? (
      <section aria-label={t("선택한 부품")} className="shrink-0 border-t border-border bg-card px-3 py-2">
        {detailHead(compInfo.ref)}
        {detailOpen && (
          <div id="selection-detail" className="pb-1">
            {compInfo.values.length > 0 && <p className="mt-1 font-mono text-sm">{compInfo.values.join(" · ")}</p>}
            <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => pickComp(compInfo)}>
              <Focus aria-hidden="true" />
              {t("부품 위치로 이동")}
            </Button>
          </div>
        )}
      </section>
    ) : null;

  return (
    <div className="viewer-app relative flex h-full min-h-0 flex-col bg-background">
      <a
        href="#drawing"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-sm focus:bg-popover focus:px-3 focus:py-2 focus:shadow"
      >
        {t("도면으로 건너뛰기")}
      </a>
      <header className="viewer-toolbar flex min-h-14 shrink-0 flex-wrap items-center gap-3 border-b border-border bg-card px-4 py-2">
        <h1 className="sr-only">Schematic Viewer</h1>
        {headerStart}
        {doc && (
          <>
            {headerStart && <span className="h-4 w-px bg-border" aria-hidden="true" />}
            <p className="min-w-0 truncate text-sm text-muted-foreground" title={doc.fileName}>
              {doc.fileName}
            </p>
            {doc.pages.length > 1 && (
              <nav aria-label={t("페이지")} className="flex items-center gap-1">
                {doc.pages.map((p) => (
                  <Button
                    key={p.index}
                    size="sm"
                    variant={p.index === pageIdx ? "default" : "ghost"}
                    aria-current={p.index === pageIdx ? "page" : undefined}
                    className="relative"
                    onClick={() => gotoPage(p.index)}
                  >
                    {p.index + 1}
                    {selEntry?.where.some((w) => w.page === p.index) && (
                      <span aria-hidden="true" className="selection-dot absolute right-1 top-1 size-1.5 rounded-full" />
                    )}
                  </Button>
                ))}
              </nav>
            )}
          </>
        )}
        <div className="ml-auto flex items-center gap-2">
          {doc && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf,.pdf"
                className="sr-only"
                aria-label={t("다른 회로도 PDF 선택")}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void openFile(f);
                  e.target.value = "";
                }}
              />
              <Button
                size="sm"
                variant="outline"
                className="max-sm:px-2"
                aria-label={t("다른 PDF 열기")}
                onClick={() => fileRef.current?.click()}
                disabled={!!busy}
              >
                <FileUp aria-hidden="true" />
                <span className="max-sm:hidden">{t("다른 PDF 열기")}</span>
              </Button>
            </>
          )}
          {headerEnd}
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col-reverse md:flex-row">
        {doc && page && (
          <SchematicSidebar
            query={query}
            onQuery={(q) => {
              typed.current = true;
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
            onExport={exportCsv}
            detail={detail}
            selectionSummary={selectionSummary}
            sheetOpen={sheetOpen}
            onSheetOpen={setSheetOpen}
          />
        )}

        <section aria-label={t("도면")} className="relative min-h-0 min-w-0 flex-1">
          {!doc || !page ? (
            <UploadHero onFile={(f) => void openFile(f)} busy={!!busy} />
          ) : (
            <SchematicViewer
              key={documentSerial}
              ref={viewer}
              page={page}
              pdf={doc.pdf as PdfRenderSource}
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
                {matches.length ? `${Math.min(matchIdx + 1, matches.length)} / ${matches.length}` : t("도면에 없음")}
                {exactCount > 0 && exactCount < matches.length && (
                  <span className="ml-2 text-xs">
                    {t("정확히 일치")} {exactCount}
                  </span>
                )}
              </span>
              <Button variant="ghost" size="icon" className="size-7" aria-label={t("이전 위치")} disabled={!matches.length} onClick={() => gotoMatch(matchIdx - 1)}>
                <ChevronUp aria-hidden="true" />
              </Button>
              <Button variant="ghost" size="icon" className="size-7" aria-label={t("다음 위치")} disabled={!matches.length} onClick={() => gotoMatch(matchIdx + 1)}>
                <ChevronDown aria-hidden="true" />
              </Button>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-md border border-red-300 bg-popover px-4 py-2 text-sm text-red-700 shadow-md dark:text-red-300"
            >
              {t(error)}
              <Button variant="ghost" size="icon" className="size-7" aria-label={t("알림 닫기")} onClick={() => setError(null)}>
                <X aria-hidden="true" />
              </Button>
            </div>
          )}

          {busy && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70" role="status" aria-live="polite">
              <div className="flex items-center gap-3 rounded-md border border-border bg-popover px-4 py-3 text-sm shadow-md">
                <Spinner />
                {t(busy, busy.replace(/(\d+\/\d+) 페이지 도면 읽는 중/, "Reading page $1").replace(/(\d+\/\d+) 페이지 연결 분석 중/, "Analyzing connections on page $1").replace("도면 읽는 중", "Reading schematic").replace("완료", "Done"))}
              </div>
            </div>
          )}
        </section>
      </main>
      <footer className="viewer-status"><span className="status-dot" />{t("파일은 브라우저 안에서만 분석됩니다.")}<span>{t("휠: 확대·축소 · 드래그: 이동")}</span></footer>
      {dragging && <div className="drop-overlay" role="status"><div><FileUp aria-hidden="true" /><h2>{t(doc ? "파일을 여기에 놓으면 현재 도면이 교체됩니다" : "PDF를 놓아 열기")}</h2><p>{t("파일은 브라우저 안에서만 분석됩니다.")}</p></div></div>}
    </div>
  );
}
