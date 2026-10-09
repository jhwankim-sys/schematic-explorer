import { useT } from "./i18n.tsx";
import { installFileDrop } from "./lib/file-drop.ts";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, FileUp, Focus, List, X } from "lucide-react";
import { Badge, Button, cn, Spinner } from "./components/ui.tsx";
import { SchematicSidebar, type SidebarTab } from "./components/sidebar.tsx";
import { SchematicViewer, type PdfRenderSource, type ViewerHandle } from "./components/viewer.tsx";
import { UploadHero } from "./components/upload-hero.tsx";
import type { SchText } from "./lib/schematic/analyze.ts";
import { loadSchematic, type Schematic } from "./lib/schematic/extract.ts";
import { track } from "./lib/analytics.ts";
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

/** sample schematic shipped with the site: Olimex ESP32-PoE rev. I (open hardware, Apache-2.0) */
const EXAMPLE_URL = "./examples/olimex-esp32-poe-rev-i.pdf";
const EXAMPLE_NAME = "Olimex-ESP32-PoE-Rev-I (example).pdf";

interface AppProps {
  active?: boolean;
  /** open the bundled example as soon as the workspace is shown */
  autoExample?: boolean;
  /** shown at the start / end of the toolbar (site brand, language switch) so the workspace needs one header row only */
  headerStart?: ReactNode;
  headerEnd?: ReactNode;
}

const SIDE_QUERY = "(min-width: 768px), (orientation: landscape) and (max-height: 500px)";
const COMPACT_QUERY = "(max-height: 500px)";

/** wide screens and phones held sideways get the list beside the drawing; narrow portrait screens get a sheet */
function useLayout() {
  const read = () => {
    try {
      return { side: window.matchMedia(SIDE_QUERY).matches, compact: window.matchMedia(COMPACT_QUERY).matches };
    } catch {
      return { side: true, compact: false };
    }
  };
  const [state, setState] = useState(read);
  useEffect(() => {
    const update = () => setState(read());
    const mqs = [window.matchMedia(SIDE_QUERY), window.matchMedia(COMPACT_QUERY)];
    mqs.forEach((m) => m.addEventListener("change", update));
    window.addEventListener("resize", update);
    return () => {
      mqs.forEach((m) => m.removeEventListener("change", update));
      window.removeEventListener("resize", update);
    };
  }, []);
  return state;
}

export function App({ active = true, autoExample = false, headerStart, headerEnd }: AppProps) {
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
  /** side layout: the list panel can be folded away for more drawing */
  const [panelOpen, setPanelOpen] = useState(true);
  const layout = useLayout();
  /** which of the selected net's labels the user has stepped to (-1: none yet) */
  const [occIdx, setOccIdx] = useState(-1);
  const viewer = useRef<ViewerHandle>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  /** set while the query comes from typing: the view then moves to the first hit without Enter */
  const typed = useRef(false);

  /** the PDF opened but holds no lines or text to analyze (a scan / photo): shown over the drawing */
  const [notice, setNotice] = useState<string | null>(null);

  const openFile = useCallback(async (file: File, source: "picker" | "drop" | "example" = "picker") => {
    if (loading.current) return;
    if (!/\.pdf$/i.test(file.name) && file.type !== "application/pdf") {
      setError("PDF 파일만 열 수 있습니다. 회로도 프로그램에서 PDF로 내보낸 파일을 선택해 주세요.");
      track({ name: "error", params: { type: "not_pdf" } });
      return;
    }
    if (source === "example") track({ name: "example_load", params: {} });
    else track({ name: "file_open", params: { source, size_kb: Math.round(file.size / 1024) } });
    loading.current = true;
    setError(null);
    setNotice(null);
    setBusy("도면 읽는 중");
    const t0 = performance.now();
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
      const nets = new Set(d.pages.flatMap((p) => p.nets.filter((n) => n.name).map((n) => n.name.toUpperCase()))).size;
      const parts = new Set(d.pages.flatMap((p) => p.components.map((c) => c.ref))).size;
      const textLayer = d.pages.some((p) => p.texts.length > 0);
      // nothing to analyze: no wiring and no text anywhere (scanned or image-only PDF)
      if (d.pages.every((p) => p.segs.length === 0 && p.texts.length === 0)) {
        setNotice(
          "이 PDF에는 선과 글자 정보가 없어 연결을 분석할 수 없습니다. 스캔하거나 이미지로 저장한 PDF로 보입니다. 도면은 볼 수 있으며, 회로도 프로그램에서 PDF로 다시 내보내면 분석할 수 있습니다.",
        );
        track({ name: "error", params: { type: "no_vector" } });
      }
      track({ name: "view_complete", params: { pages: d.pages.length, nets, parts, load_ms: Math.round(performance.now() - t0), text_layer: textLayer } });
    } catch (e) {
      const encrypted = /password/i.test(String((e as Error)?.name ?? "") + String((e as Error)?.message ?? ""));
      setError(
        encrypted
          ? "암호가 걸린 PDF는 열 수 없습니다. 암호를 해제한 PDF로 다시 저장한 뒤 열어 주세요."
          : "이 PDF에서 회로도를 읽지 못했습니다. 파일이 손상되지 않았는지 확인하고, 회로도 프로그램에서 PDF로 다시 내보내 보세요.",
      );
      track({ name: "error", params: { type: encrypted ? "encrypted" : "read_failed" } });
    } finally {
      loading.current = false;
      setBusy(null);
    }
  }, []);

  /** open the bundled public example (Olimex ESP32-PoE, Apache-2.0) */
  const openExample = useCallback(async () => {
    try {
      const res = await fetch(EXAMPLE_URL);
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      await openFile(new File([blob], EXAMPLE_NAME, { type: "application/pdf" }), "example");
    } catch {
      setError("예제 파일을 불러오지 못했습니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.");
      track({ name: "error", params: { type: "read_failed" } });
    }
  }, [openFile]);

  // the example demo page links to #example: open the sample right away
  const exampleOpened = useRef(false);
  useEffect(() => {
    if (!active || !autoExample || exampleOpened.current) return;
    exampleOpened.current = true;
    void openExample();
  }, [active, autoExample, openExample]);

  useEffect(() => {
    if (!active) { setDragging(false); return; }
    return installFileDrop(window, (file) => { void openFile(file, "drop"); }, setDragging);
  }, [active, openFile]);

  const page = doc?.pages[pageIdx] ?? null;
  const index = useMemo(() => (page ? new PageIndex(page) : null), [page]);
  const netEntries = useMemo(() => (doc ? buildNetEntries(doc.pages) : []), [doc]);
  const compEntries = useMemo(() => (doc ? buildCompEntries(doc.pages) : []), [doc]);
  const unnamedCount = useMemo(
    () => (doc ? doc.pages.reduce((a, p) => a + p.nets.filter((n) => !n.name && n.segs.length > 1).length, 0) : 0),
    [doc],
  );

  /** parts whose reference is drawn as strokes are still searchable by their box */
  const partBoxTexts = useMemo(
    () =>
      page
        ? page.components
            .filter((c) => !c.textIds.length && c.box)
            .map((c, i) => {
              const [x0, y0, x1, y1] = c.box!;
              return { id: -1 - i, str: c.ref, kind: "component", x0, y0, x1, y1, ax: x0, ay: y1, size: y1 - y0, rot: 0, net: -1, inBody: false } as SchText;
            })
        : [],
    [page],
  );
  const matches = useMemo(
    () => (page ? matchTexts(partBoxTexts.length ? { ...page, texts: page.texts.concat(partBoxTexts) } : page, query) : []),
    [page, query, partBoxTexts],
  );
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

  const pickComp = useCallback(
    (c: CompEntry) => {
      if (!doc) return;
      const w = c.where.find((x) => x.page === pageIdx) ?? c.where[0];
      const p = doc.pages[w.page];
      setSheetOpen(false);
      setPageIdx(w.page);
      setSel({ type: "component", ref: c.ref });
      const b = unionBox(w.textIds.map((id) => textBox(p.texts[id]))) ?? w.box ?? null;
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
      // parts known only by their box (lettering drawn as strokes): the smallest box under the pointer
      let part: { ref: string; area: number } | null = null;
      for (const c of page.components) {
        const b = c.box;
        if (!b || x < b[0] || x > b[2] || y < b[1] || y > b[3]) continue;
        const area = (b[2] - b[0]) * (b[3] - b[1]);
        if (!part || area < part.area) part = { ref: c.ref, area };
      }
      if (part) {
        setSel({ type: "component", ref: part.ref });
        setTab("parts");
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

  /** every label of the selected named net, in reading order across the pages (what "×3" counts) */
  const occurrences = useMemo(() => {
    if (!doc || sel?.type !== "net" || !sel.name) return [];
    const key = sel.name.toUpperCase();
    const out: { page: number; text: SchText }[] = [];
    for (const p of doc.pages) {
      const ids = new Set<number>();
      for (const n of p.nets) if (n.name.toUpperCase() === key) for (const l of n.labels) if (p.texts[l].str.toUpperCase() === key) ids.add(l);
      const list = [...ids].map((i) => p.texts[i]);
      list.sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0);
      for (const text of list) out.push({ page: p.index, text });
    }
    return out;
  }, [doc, sel]);
  const occName = sel?.type === "net" ? sel.name : "";
  useEffect(() => setOccIdx(-1), [occName]);

  /** move to one of the selected net's labels (wraps around) */
  const gotoOcc = useCallback(
    (i: number) => {
      if (!doc || !occurrences.length || sel?.type !== "net") return;
      const k = ((i % occurrences.length) + occurrences.length) % occurrences.length;
      const o = occurrences[k];
      setOccIdx(k);
      if (o.page !== pageIdx || sel.page !== o.page) selectNet(o.page, netsNamed(doc.pages[o.page], sel.name), sel.name, false);
      const t = o.text;
      const m = Math.max(t.size * 8, 40);
      requestAnimationFrame(() => viewer.current?.fit([t.x0 - m, t.y0 - m * 0.7, t.x1 + m, t.y1 + m * 0.7], 0.05));
    },
    [doc, occurrences, sel, pageIdx, selectNet],
  );

  const pickNetEntry = useCallback(
    (e: NetEntry) => {
      setSheetOpen(false);
      // clicking the selected net again walks through its labels (×3 → 1/3, 2/3, 3/3)
      if (sel?.type === "net" && sel.name && sel.name.toUpperCase() === e.name.toUpperCase() && occurrences.length) {
        gotoOcc(occIdx + 1);
        return;
      }
      const w = e.where.find((x) => x.page === pageIdx) ?? e.where[0];
      selectNet(w.page, w.netIds, e.name);
    },
    [pageIdx, selectNet, sel, occurrences, occIdx, gotoOcc],
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
    if (!c) return [];
    // a part whose lettering is strokes: outline its box instead
    if (!c.textIds.length && c.box) {
      const [x0, y0, x1, y1] = c.box;
      return [{ id: -1, str: c.ref, kind: "component", x0, y0, x1, y1, ax: x0, ay: y1, size: y1 - y0, rot: 0, net: -1, inBody: false } as SchText];
    }
    return c.textIds.map((i) => page.texts[i]);
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
            {occurrences.length > 0 && (
              <div className="mt-2 flex items-center gap-1">
                <h3 className="mr-auto text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t("라벨 위치")}</h3>
                <Button variant="outline" size="icon" className="size-7" aria-label={t("이전 라벨")} onClick={() => gotoOcc(occIdx < 0 ? -1 : occIdx - 1)}>
                  <ChevronLeft aria-hidden="true" />
                </Button>
                <span className="min-w-12 text-center text-xs tabular-nums" aria-live="polite">
                  {occIdx < 0 ? "–" : occIdx + 1} / {occurrences.length}
                </span>
                <Button variant="outline" size="icon" className="size-7" aria-label={t("다음 라벨")} onClick={() => gotoOcc(occIdx + 1)}>
                  <ChevronRight aria-hidden="true" />
                </Button>
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
      <header
        className={cn(
          "viewer-toolbar flex shrink-0 items-center gap-3 border-b border-border bg-card px-4",
          layout.side && !layout.compact ? "min-h-14 flex-wrap py-2" : "min-h-11 py-1",
        )}
      >
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
                  if (f) void openFile(f, "picker");
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

      <main className={cn("flex min-h-0 flex-1", layout.side ? "flex-row" : "flex-col-reverse")}>
        {doc && page && (!layout.side || panelOpen) && (
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
            noText={doc.pages.every((p) => p.texts.length === 0)}
            selectedNet={sel?.type === "net" ? sel.name || null : null}
            selectedComp={sel?.type === "component" ? sel.ref : null}
            onPickNet={pickNetEntry}
            onPickComp={pickComp}
            onExport={exportCsv}
            detail={detail}
            selectionSummary={selectionSummary}
            layout={layout.side ? "side" : "sheet"}
            compact={layout.compact}
            sheetOpen={sheetOpen}
            onSheetOpen={setSheetOpen}
            onCollapse={() => setPanelOpen(false)}
            handleExtra={
              occurrences.length > 1 ? (
                <div className="flex shrink-0 items-center pr-1">
                  <Button variant="ghost" size="icon" className="size-9" aria-label={t("이전 라벨")} onClick={() => gotoOcc(occIdx < 0 ? -1 : occIdx - 1)}>
                    <ChevronLeft aria-hidden="true" />
                  </Button>
                  <span className="min-w-9 text-center text-xs tabular-nums text-muted-foreground">
                    {occIdx < 0 ? "–" : occIdx + 1}/{occurrences.length}
                  </span>
                  <Button variant="ghost" size="icon" className="size-9" aria-label={t("다음 라벨")} onClick={() => gotoOcc(occIdx + 1)}>
                    <ChevronRight aria-hidden="true" />
                  </Button>
                </div>
              ) : null
            }
          />
        )}

        <section aria-label={t("도면")} className="relative min-h-0 min-w-0 flex-1">
          {!doc || !page ? (
            <UploadHero onFile={(f) => void openFile(f, "picker")} onExample={() => void openExample()} busy={!!busy} />
          ) : (
            <SchematicViewer
              key={documentSerial}
              ref={viewer}
              page={page}
              pdf={doc.pdf as PdfRenderSource}
              netIds={netIds}
              focusTexts={focusTexts}
              activeFocus={occIdx >= 0 && occurrences[occIdx]?.page === pageIdx ? occurrences[occIdx].text : null}
              matches={matches}
              activeMatch={matchIdx}
              onPick={onPick}
              onRenderError={() => track({ name: "error", params: { type: "render_failed" } })}
            />
          )}

          {doc && notice && (
            <div role="status" className="absolute inset-x-3 bottom-16 mx-auto flex max-w-xl items-start gap-2 rounded-md border border-amber-300 bg-popover px-4 py-3 text-sm shadow-md">
              <p className="min-w-0 flex-1 leading-relaxed">{t(notice)}</p>
              <Button variant="ghost" size="icon" className="size-7 shrink-0" aria-label={t("알림 닫기")} onClick={() => setNotice(null)}>
                <X aria-hidden="true" />
              </Button>
            </div>
          )}

          {doc && page && layout.side && !panelOpen && (
            <Button variant="outline" size="sm" className="absolute left-3 top-3 shadow-sm" onClick={() => setPanelOpen(true)}>
              <List aria-hidden="true" />
              {t("목록")}
            </Button>
          )}

          {doc && query.trim() && (
            <div className="absolute left-1/2 top-3 flex max-w-[calc(100%-1.5rem)] -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-md border border-border bg-popover py-1 pl-3 pr-1 text-sm shadow-sm">
              <span className="min-w-0 truncate font-mono">{query.trim()}</span>
              <span className="shrink-0 px-2 tabular-nums text-muted-foreground" aria-live="polite">
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
              className="absolute bottom-4 left-1/2 flex w-max max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-2 rounded-md border border-red-300 bg-popover px-4 py-2 text-sm text-red-700 shadow-md dark:text-red-300"
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
      <footer className="viewer-status" hidden={!layout.side || layout.compact}><span className="status-dot" />{t("파일은 브라우저 안에서만 분석됩니다.")}<span>{t("휠: 확대·축소 · 드래그: 이동")}</span></footer>
      {dragging && <div className="drop-overlay" role="status"><div><FileUp aria-hidden="true" /><h2>{t(doc ? "파일을 여기에 놓으면 현재 도면이 교체됩니다" : "PDF를 놓아 열기")}</h2><p>{t("파일은 브라우저 안에서만 분석됩니다.")}</p></div></div>}
    </div>
  );
}
