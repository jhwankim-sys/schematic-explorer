import { useT } from "./i18n.tsx";
import { installFileDrop } from "./lib/file-drop.ts";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, FileUp, Focus, List, X, ZoomIn } from "lucide-react";
import { Badge, Button, cn, Spinner } from "./components/ui.tsx";
import { SchematicSidebar, type PanelMode, type SheetState, type SidebarTab } from "./components/sidebar.tsx";
import { SchematicViewer, type PdfRenderSource, type PickInfo, type ViewerHandle } from "./components/viewer.tsx";
import { decideTouch, netsNear, TOUCH } from "./components/nearby.ts";
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

/**
 * The list goes beside the drawing on landscape screens, on desktop browsers (a fine pointer) from
 * 768px and on anything wider than a tablet; phones and tablets held upright get a sheet under the
 * drawing (a side panel there leaves wide empty bands above and below a landscape sheet).
 */
const SIDE_QUERY =
  "(min-width: 768px) and (orientation: landscape), (min-width: 768px) and (pointer: fine), (min-width: 1025px), (orientation: landscape) and (max-height: 500px)";
const COMPACT_QUERY = "(max-height: 500px)";
/** the folded sheet's handle row */
const HANDLE_H = 45;
/** narrow toolbars show the pages as "‹ 3 / 10 ›" */
const NARROW_QUERY = "(max-width: 639px)";
const COARSE_QUERY = "(pointer: coarse)";

function useLayout() {
  const read = () => {
    try {
      const m = (q: string) => window.matchMedia(q).matches;
      return { side: m(SIDE_QUERY), compact: m(COMPACT_QUERY), narrow: m(NARROW_QUERY), coarse: m(COARSE_QUERY) };
    } catch {
      return { side: true, compact: false, narrow: false, coarse: false };
    }
  };
  const [state, setState] = useState(read);
  useEffect(() => {
    const update = () => setState(read());
    const mqs = [SIDE_QUERY, COMPACT_QUERY, NARROW_QUERY, COARSE_QUERY].map((q) => window.matchMedia(q));
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
  const layout = useLayout();
  /** small screens (sheet, short side panel): selection details start folded to one line */
  const small = !layout.side || layout.compact;
  /** selection details in the sidebar can be folded away (null: the default for the layout) */
  const [detailPref, setDetailPref] = useState<boolean | null>(null);
  /** the sidebar shows the details alone when the panel is too short for both: then they are unfolded */
  const [panelMode, setPanelMode] = useState<PanelMode>("both");
  const detailOpen = panelMode === "detail" || (detailPref ?? !small);
  /** sheet: height the sidebar measured for its head + folded selection line + three whole list rows */
  const [peekNeed, setPeekNeed] = useState(0);
  /** small screens: the list sheet under the drawing (handle only / filling the space under the drawing / tall) */
  const [sheet, setSheet] = useState<SheetState>("peek");
  /** after picking something from a tall sheet, make room for the drawing again */
  const lowerSheet = useCallback(() => setSheet((s) => (s === "full" ? "peek" : s)), []);
  /** side layout: the list panel can be folded away for more drawing */
  const [panelOpen, setPanelOpen] = useState(true);
  const mainRef = useRef<HTMLElement>(null);
  const [mainSize, setMainSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setMainSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  /**
   * On-screen keyboard. One coordinate system only: the layout keeps its size while the keyboard is
   * up (the browsers' default — iOS Safari, and Chrome on Android since it resizes only the visual
   * viewport), so the layout, its media queries and the sheet heights do not change while typing.
   * The keyboard's height is read from visualViewport and only pads the end of the lists (--kb) so
   * every row can be scrolled above it. When it closes, a page the browser scrolled to show the
   * search box is scrolled back.
   */
  useEffect(() => {
    if (!active) return;
    const vv = window.visualViewport;
    if (!vv) return;
    const root = document.documentElement;
    const update = () => {
      const kb = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
      root.style.setProperty("--kb", `${kb}px`);
      if (kb === 0 && (window.scrollY !== 0 || window.scrollX !== 0)) window.scrollTo(0, 0);
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      root.style.removeProperty("--kb");
    };
  }, [active]);
  /** which of the selected net's labels the user has stepped to (-1: none yet) */
  const [occIdx, setOccIdx] = useState(-1);
  const viewer = useRef<ViewerHandle>(null);
  /** touch: nets about equally close to the fingertip, for the user to choose from (screen position of the tap) */
  const [choice, setChoice] = useState<{
    x: number;
    y: number;
    cx: number;
    cy: number;
    options: { net: number; name: string; netIds: number[] }[];
    more: number;
  } | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const choiceRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  /** set while the query comes from typing: the view then moves to the first hit without Enter */
  const typed = useRef(false);

  /** the PDF opened but holds no lines or text to analyze (a scan / photo): shown over the drawing */
  const [notice, setNotice] = useState<string | null>(null);

  /** a second file arrived while one is still being read: it is refused, and a short note says so */
  const [busyNote, setBusyNote] = useState(false);
  const busyNoteTimer = useRef<number | undefined>(undefined);
  const hideBusyNote = useCallback(() => {
    window.clearTimeout(busyNoteTimer.current);
    busyNoteTimer.current = undefined;
    setBusyNote(false);
  }, []);
  useEffect(() => () => window.clearTimeout(busyNoteTimer.current), []);

  const openFile = useCallback(async (file: File, source: "picker" | "drop" | "example" = "picker") => {
    if (loading.current) {
      // keep the file being read; one note at a time, restarted on every refused request
      window.clearTimeout(busyNoteTimer.current);
      setBusyNote(true);
      busyNoteTimer.current = window.setTimeout(() => {
        busyNoteTimer.current = undefined;
        setBusyNote(false);
      }, 5000);
      return;
    }
    if (!/\.pdf$/i.test(file.name) && file.type !== "application/pdf") {
      setError("PDF 파일만 열 수 있습니다. 회로도 프로그램에서 PDF로 내보낸 파일을 선택해 주세요.");
      track({ name: "error", params: { type: "not_pdf" } });
      return;
    }
    if (source === "example") track({ name: "example_load", params: {} });
    else track({ name: "file_open", params: { source, size_kb: Math.round(file.size / 1024) } });
    loading.current = true;
    setError(null);
    setBusy("도면 읽는 중");
    const t0 = performance.now();
    try {
      const d = await loadSchematic(file, (m) => setBusy(m));
      // the scan notice belongs to the drawing on screen: it goes only when another drawing opens
      setNotice(null);
      setDoc(d);
      setDocumentSerial((n) => n + 1);
      setMatchIdx(0);
      setTab("nets");
      setPageIdx(0);
      setSel(null);
      setQuery("");
      setSheet("peek");
      setDetailPref(null);
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
      hideBusyNote();
    }
  }, [hideBusyNote]);

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
      lowerSheet();
      setPageIdx(w.page);
      setSel({ type: "component", ref: c.ref });
      const b = unionBox(w.textIds.map((id) => textBox(p.texts[id]))) ?? w.box ?? null;
      if (b) requestAnimationFrame(() => viewer.current?.fit([b[0] - 30, b[1] - 22, b[2] + 30, b[3] + 22], 0.05));
    },
    [doc, pageIdx, lowerSheet],
  );

  const onPick = useCallback(
    (x: number, y: number, tol: number, info: PickInfo) => {
      if (!page || !index) return;
      setChoice(null);
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
      if (info.touch) {
        // a fingertip can cover several wires: when they are about equally close, let the user choose
        // instead of silently taking the nearest (mouse and pen keep the single nearest wire below)
        const option = (net: number) => {
          const n = page.nets[net];
          return { net, name: n.name, netIds: n.name ? netsNamed(page, n.name) : [n.id] };
        };
        const sameSelection = (net: number) => {
          const n = page.nets[net];
          return n.name ? "name:" + n.name.toUpperCase() : "id:" + n.id;
        };
        const near = netsNear(index, x, y, (TOUCH.reach + TOUCH.gap) * info.k);
        const d = decideTouch(near, info.k, option, sameSelection);
        if (d.kind === "choose") {
          const r = sectionRef.current?.getBoundingClientRect();
          setChoice({ x, y, cx: (r?.left ?? 0) + info.sx, cy: (r?.top ?? 0) + info.sy, options: d.options, more: d.more });
          // the compatibility mousedown/click the browser sends for this same tap must not land on the
          // list that just opened (or take focus from it): only events at the tap point, once each, briefly.
          // A real tap on the list is at least 28px away, so it is never swallowed.
          const tx = (r?.left ?? 0) + info.sx;
          const ty = (r?.top ?? 0) + info.sy;
          const swallow = (type: string) => {
            const stop = (ev: Event) => {
              const m = ev as MouseEvent;
              if (Math.hypot(m.clientX - tx, m.clientY - ty) > 12) return;
              ev.stopPropagation();
              ev.preventDefault();
              window.removeEventListener(type, stop, { capture: true });
            };
            window.addEventListener(type, stop, { capture: true });
            setTimeout(() => window.removeEventListener(type, stop, { capture: true }), 400);
          };
          swallow("mousedown");
          swallow("click");
          return;
        }
        if (d.kind === "pick") {
          selectNet(page.index, d.option.netIds, d.option.name, false);
          setTab("nets");
          return;
        }
      }
      const s = info.touch ? -1 : index.segAt(x, y, tol);
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
      lowerSheet();
      // clicking the selected net again walks through its labels (×3 → 1/3, 2/3, 3/3)
      if (sel?.type === "net" && sel.name && sel.name.toUpperCase() === e.name.toUpperCase() && occurrences.length) {
        gotoOcc(occIdx + 1);
        return;
      }
      const w = e.where.find((x) => x.page === pageIdx) ?? e.where[0];
      selectNet(w.page, w.netIds, e.name);
    },
    [pageIdx, selectNet, sel, occurrences, occIdx, gotoOcc, lowerSheet],
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
      if (choice) {
        setChoice(null);
        document.getElementById("drawing")?.focus({ preventScroll: true });
        return;
      }
      const inField = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      if (inField) {
        if (query) setQuery("");
        else (e.target as HTMLElement).blur();
      } else if (sel) setSel(null);
      else if (query) setQuery("");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, sel, query, choice]);

  // a list made for one tap does not survive another page, another file or a moved view
  useEffect(() => setChoice(null), [doc, pageIdx]);
  // focus the list when it opens, so a screen reader announces it and Tab moves through its rows
  useEffect(() => {
    if (choice) choiceRef.current?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
  }, [choice]);
  // a touch or click outside the list closes it and carries on as usual (a pinch or drag on the drawing
  // works from its first finger: nothing covers the drawing and the event is not stopped)
  useEffect(() => {
    if (!choice) return;
    const outside = (e: PointerEvent) => {
      if (!choiceRef.current?.contains(e.target as Node)) setChoice(null);
    };
    window.addEventListener("pointerdown", outside, { capture: true });
    return () => window.removeEventListener("pointerdown", outside, { capture: true });
  }, [choice]);
  // however the list closes, focus that was in it goes back to the drawing (its buttons are gone)
  const hadChoice = useRef(false);
  useEffect(() => {
    if (choice) hadChoice.current = true;
    else if (hadChoice.current) {
      hadChoice.current = false;
      if (document.activeElement === document.body) document.getElementById("drawing")?.focus({ preventScroll: true });
    }
  }, [choice]);
  /** after a choice from the list, focus goes back to the drawing (the list and its buttons are gone) */
  const closeChoiceTo = useCallback(() => {
    setChoice(null);
    requestAnimationFrame(() => document.getElementById("drawing")?.focus({ preventScroll: true }));
  }, []);

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
            ? t(`배선 ${netInfo.segs}개 · 접점 ${netInfo.dots}개`, `${netInfo.segs} wires · ${netInfo.dots} junctions`, `配線 ${netInfo.segs}本 · 接続点 ${netInfo.dots}個`)
            : t("이 페이지에는 이 노드가 없습니다."),
        }
      : compInfo
        ? { title: compInfo.ref, sub: compInfo.values.join(" · ") || undefined }
        : null;

  /** stepping through the selected net's labels: ‹ 2/5 › */
  const occStepper = (cls: string, wide = false) => (
    <div className={cn("flex shrink-0 items-center", cls)}>
      <Button variant={wide ? "outline" : "ghost"} size="icon" className="size-7" aria-label={t("이전 라벨")} onClick={() => gotoOcc(occIdx < 0 ? -1 : occIdx - 1)}>
        <ChevronLeft aria-hidden="true" />
      </Button>
      <span className={cn("text-center text-xs tabular-nums", wide ? "min-w-12" : "min-w-9 text-muted-foreground")} aria-live="polite">
        {occIdx < 0 ? "–" : occIdx + 1}
        {wide ? " / " : "/"}
        {occurrences.length}
      </span>
      <Button variant={wide ? "outline" : "ghost"} size="icon" className="size-7" aria-label={t("다음 라벨")} onClick={() => gotoOcc(occIdx + 1)}>
        <ChevronRight aria-hidden="true" />
      </Button>
    </div>
  );

  const toggleDetail = () => {
    const next = !detailOpen;
    setDetailPref(next);
    // unfolding on a phone: the tall sheet has room for the details and the list
    if (next && !layout.side) setSheet("full");
  };

  // selection details live in the sidebar (under the lists) so they never cover the drawing.
  // On small screens they start folded to one line (name, counts, label stepping); unfolded, the
  // body scrolls on its own so the list above keeps its rows.
  const detailHead = (title: string, mono: boolean, sub?: string, extra?: ReactNode) => (
    <div className="flex shrink-0 items-center gap-2">
      <span aria-hidden="true" className="selection-dot size-2.5 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1">
        <h2 className={cn("truncate text-sm font-semibold", mono && "font-mono")} title={title}>
          {title}
        </h2>
        {sub && !detailOpen && <p className="truncate text-[11px] leading-tight text-muted-foreground">{sub}</p>}
      </div>
      {extra}
      {/* details shown alone (short panel): the bar above them leads back to the list instead */}
      {panelMode !== "detail" && (
      <Button
          variant="ghost"
          size="icon"
          className="size-7"
          aria-expanded={detailOpen}
          aria-controls="selection-detail"
          aria-label={t(detailOpen ? "선택 정보 접기" : "선택 정보 펼치기")}
          onClick={toggleDetail}
        >
          {detailOpen ? <ChevronDown aria-hidden="true" /> : <ChevronUp aria-hidden="true" />}
        </Button>
      )}
      {/* a short side panel keeps the folded line for the name; clearing is in the unfolded details
          (or tap an empty spot of the drawing) */}
      {!(layout.compact && !detailOpen) && (
        <Button variant="ghost" size="icon" className="-mr-1 size-7" aria-label={t("선택 해제")} onClick={() => setSel(null)}>
          <X aria-hidden="true" />
        </Button>
      )}
    </div>
  );
  // folded, the selection line never gets squeezed; unfolded, its body scrolls inside the room left
  const detailCls = cn("flex min-h-0 flex-col border-t border-border bg-card px-3", detailOpen ? "shrink" : "shrink-0", layout.compact ? "py-0.5" : "py-1.5");
  const bodyCls = "min-h-0 overflow-y-auto overscroll-contain pb-1";
  const detail =
    netInfo && sel?.type === "net" ? (
      <section aria-label={t("선택한 노드")} className={detailCls}>
        {detailHead(sel.name || t("이름 없는 노드"), !!sel.name, selectionSummary?.sub, small && !layout.compact && !detailOpen && occurrences.length > 0 ? occStepper("") : null)}
        {detailOpen && (
          <div id="selection-detail" className={bodyCls}>
            <p className="mt-1 text-xs text-muted-foreground">
              {netInfo.here
                ? t(`배선 ${netInfo.segs}개 · 접점 ${netInfo.dots}개`, `${netInfo.segs} wires · ${netInfo.dots} junctions`, `配線 ${netInfo.segs}本 · 接続点 ${netInfo.dots}個`)
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
                {occStepper("gap-1", true)}
              </div>
            )}
            {netInfo.labels.length > 0 && (
              <div className="mt-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t("연결된 라벨·핀 이름")}</h3>
                <ul className="mt-1.5 flex flex-wrap gap-1">
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
                  lowerSheet();
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
      <section aria-label={t("선택한 부품")} className={detailCls}>
        {detailHead(compInfo.ref, true, compInfo.values.join(" · ") || undefined)}
        {detailOpen && (
          <div id="selection-detail" className={bodyCls}>
            {compInfo.values.length > 0 && <p className="mt-1 font-mono text-sm">{compInfo.values.join(" · ")}</p>}
            <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => pickComp(compInfo)}>
              <Focus aria-hidden="true" />
              {t("부품 위치로 이동")}
            </Button>
          </div>
        )}
      </section>
    ) : null;

  /**
   * Sheet height while it "peeks": measured, not a fixed share of the screen. The drawing is fitted
   * whole to the area above the sheet (top-aligned); when the page fitted to the full width leaves
   * room under it, the sheet takes exactly that room so no empty band is left between them.
   * Lower bound: without a selection, a preview (search box, tabs and a first row); with one, what the
   * sidebar measured for its head, the folded selection line and three whole rows. Upper bound (wins
   * when the two conflict): 62% of the screen, leaving the drawing at least 160px. When a selection
   * does not fit under it, the sidebar switches to the details alone (explicitly, with "back to list").
   */
  const hasDetail = !!detail;
  const peekHeight = useMemo(() => {
    if (!page || !mainSize.h) return 0;
    const margin = mainSize.w * 0.02;
    const drawingH = (mainSize.w - 2 * margin) * (page.height / page.width) + 2 * margin;
    const preview = layout.coarse ? 216 : 180;
    const lo = hasDetail ? Math.max(preview, peekNeed) : preview;
    const hi = Math.max(HANDLE_H, Math.min(window.innerHeight * 0.62, mainSize.h - 160));
    return Math.round(Math.min(hi, Math.max(lo, mainSize.h - drawingH - 2)));
  }, [page, mainSize, layout.coarse, hasDetail, peekNeed]);

  /** pages: one button each, or "‹ 3 / 10 ›" when there are many or the toolbar is narrow */
  const pager = doc && doc.pages.length > 1 && (
    layout.narrow || doc.pages.length > 7 ? (
      <nav aria-label={t("페이지")} className="pager flex shrink-0 items-center">
        <Button variant="ghost" size="icon" className="size-8" aria-label={t("이전 페이지")} disabled={pageIdx === 0} onClick={() => gotoPage(pageIdx - 1)}>
          <ChevronLeft aria-hidden="true" />
        </Button>
        <label className="tap relative flex h-8 items-center justify-center rounded-md px-1.5 text-sm tabular-nums hover:bg-muted">
          <span aria-hidden="true">
            {pageIdx + 1} / {doc.pages.length}
          </span>
          {/* same meaning as the dots on the page buttons: the selected net is on other pages too */}
          {selEntry && selEntry.where.some((w) => w.page !== pageIdx) && (
            <span aria-hidden="true" title={t("선택한 노드가 다른 페이지에도 있습니다")} className="selection-dot absolute right-0.5 top-1 size-1.5 rounded-full" />
          )}
          <select
            aria-label={t("페이지 선택")}
            className="absolute inset-0 cursor-pointer opacity-0"
            value={pageIdx}
            onChange={(e) => gotoPage(Number(e.target.value))}
          >
            {doc.pages.map((p) => (
              <option key={p.index} value={p.index}>
                {p.index + 1}
                {selEntry?.where.some((w) => w.page === p.index) ? ` • ${t("선택한 노드 있음")}` : ""}
              </option>
            ))}
          </select>
        </label>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label={t("다음 페이지")}
          disabled={pageIdx === doc.pages.length - 1}
          onClick={() => gotoPage(pageIdx + 1)}
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      </nav>
    ) : (
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
    )
  );

  // an error on a phone: a tall sheet is lowered so the alert has room above it
  useEffect(() => {
    if (error && !layout.side) setSheet((st) => (st === "full" ? "peek" : st));
  }, [error, layout.side]);

  /** notices: above the drawing on phone sheets (clear of the zoom buttons and the sheet), else at the bottom */
  const topNotices = !layout.side;

  const errorBox = error && (
    <div
      role="alert"
      className={cn(
        "pointer-events-auto flex items-center gap-2 rounded-md border border-red-300 bg-popover px-4 py-2 text-sm text-red-700 shadow-md dark:text-red-300",
        topNotices ? "w-full max-w-xl" : "absolute bottom-4 left-1/2 w-max max-w-[calc(100%-9rem)] -translate-x-1/2",
      )}
    >
      <p className="min-w-0 flex-1">{t(error)}</p>
      <Button variant="ghost" size="icon" className="size-7" aria-label={t("알림 닫기")} onClick={() => setError(null)}>
        <X aria-hidden="true" />
      </Button>
    </div>
  );
  const noticeBox = doc && notice && (
    <div
      role="status"
      className={cn(
        "pointer-events-auto flex max-w-xl items-start gap-2 rounded-md border border-amber-300 bg-popover px-4 py-3 text-sm shadow-md",
        topNotices ? "w-full" : "absolute inset-x-16 bottom-16 mx-auto",
      )}
    >
      <p className="min-w-0 flex-1 leading-relaxed">{t(notice)}</p>
      <Button variant="ghost" size="icon" className="size-7 shrink-0" aria-label={t("알림 닫기")} onClick={() => setNotice(null)}>
        <X aria-hidden="true" />
      </Button>
    </div>
  );
  /**
   * Search position (n / N, previous / next). Beside the drawing it floats over the top of the
   * drawing as before; on a phone sheet it sits under the search box instead, so the strip of
   * drawing above a tall sheet keeps room for the zoom buttons.
   */
  const queryPill = doc && query.trim() && (
    <div
      className={cn(
        "pointer-events-auto flex items-center gap-1 whitespace-nowrap text-sm",
        topNotices
          ? "min-w-0 px-3 pb-1"
          : "absolute left-1/2 top-3 max-w-[calc(100%-1.5rem)] -translate-x-1/2 rounded-md border border-border bg-popover py-1 pl-3 pr-1 shadow-sm",
      )}
    >
      <span className={cn("min-w-0 truncate font-mono", topNotices && "sr-only")}>{query.trim()}</span>
      <span className={cn("shrink-0 tabular-nums text-muted-foreground", topNotices ? "mr-auto text-xs" : "px-2")} aria-live="polite">
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
  );

  return (
    <div className="viewer-app relative flex h-full min-h-0 flex-col bg-background">
      <a
        href={doc && page ? "#drawing" : "#upload-pick"}
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-sm focus:bg-popover focus:px-3 focus:py-2 focus:shadow"
        onClick={(e) => {
          // move focus only: changing the hash would switch the page route
          e.preventDefault();
          const pick = document.getElementById("upload-pick") as HTMLButtonElement | null;
          const target =
            document.getElementById("drawing") ?? (pick && !pick.disabled ? pick : document.getElementById("upload-zone"));
          target?.focus();
        }}
      >
        {t(doc && page ? "도면으로 건너뛰기" : "파일 선택으로 건너뛰기")}
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
            {headerStart && <span className="h-4 w-px bg-border max-[400px]:hidden" aria-hidden="true" />}
            <p className="min-w-0 truncate text-sm text-muted-foreground max-[400px]:hidden" title={doc.fileName}>
              {doc.fileName}
            </p>
            {pager}
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
                tabIndex={-1}
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

      <main ref={mainRef} className={cn("flex min-h-0 flex-1", layout.side ? "flex-row" : "flex-col-reverse")}>
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
            // what the user asked for (unfolded or not), not the unfolding forced by the details-only view
            detailExpanded={!!detail && (detailPref ?? !small)}
            onFoldDetail={() => setDetailPref(false)}
            onPanelMode={setPanelMode}
            onPeekNeed={setPeekNeed}
            selectionSummary={selectionSummary}
            layout={layout.side ? "side" : "sheet"}
            compact={layout.compact}
            sheetState={sheet}
            onSheetState={setSheet}
            peekHeight={peekHeight}
            onCollapse={() => setPanelOpen(false)}
            handleExtra={occurrences.length > 1 ? occStepper("pr-1") : null}
            searchStatus={topNotices ? queryPill : null}
          />
        )}

        <section ref={sectionRef} aria-label={t("도면")} className="relative min-h-0 min-w-0 flex-1">
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
              onViewChange={() => setChoice(null)}
              onRenderError={() => track({ name: "error", params: { type: "render_failed" } })}
              align={layout.side ? "center" : "top"}
              controlsRow={!layout.side}
            />
          )}

          {doc && page && layout.side && !panelOpen && (
            <Button variant="outline" size="sm" className="absolute left-3 top-3 shadow-sm" onClick={() => setPanelOpen(true)}>
              <List aria-hidden="true" />
              {t("목록")}
            </Button>
          )}

          {topNotices ? (
            (errorBox || noticeBox) && (
              <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex flex-col items-center gap-2">
                {/* one at a time on a phone: an error replaces the scan notice while it is shown */}
                {errorBox || noticeBox}
              </div>
            )
          ) : (
            <>
              {queryPill}
              {noticeBox}
              {errorBox}
            </>
          )}

          {choice && (() => {
            // beside the finger, never under it: below when the list fits on the screen, else above; kept inside the window
            const width = Math.min(260, window.innerWidth - 16);
            // nets without a name cannot be told apart in a list: one guidance line sends the user to zoom instead
            const unnamed = choice.options.filter((o) => !o.name);
            const rows = unnamed.length >= 2 ? choice.options.filter((o) => o.name) : choice.options;
            const guide = unnamed.length >= 2 ? unnamed.length : 0;
            const h = 40 + 44 * (rows.length + 1) + (choice.more ? 28 : 0) + (guide ? 40 : 0) + 8;
            const left = Math.min(Math.max(choice.cx - width / 2, 8), window.innerWidth - width - 8);
            const below = choice.cy + 28 + h <= window.innerHeight - 8;
            const top = below ? choice.cy + 28 : Math.max(8, choice.cy - 28 - h);
            return (
              <>
                <span
                  aria-hidden="true"
                  className="pointer-events-none fixed z-[47] size-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--net-highlight)]"
                  style={{ left: choice.cx, top: choice.cy }}
                />
                <div
                  ref={choiceRef}
                  role="dialog"
                  aria-label={t("가까운 노드 선택", "Choose a nearby net")}
                  className="fixed z-[48] rounded-md border border-border bg-popover p-1 shadow-lg"
                  style={{ left, top, width }}
                >
                  <p className="px-2 pb-1 pt-1.5 text-xs text-muted-foreground">{t("여러 배선이 가까이 있습니다", "Several wires are close here")}</p>
                  <ul>
                    {rows.map((o) => (
                      <li key={o.net}>
                        <button
                          type="button"
                          className="flex min-h-11 w-full items-center gap-2 rounded-sm px-2 text-left text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          onClick={() => {
                            closeChoiceTo();
                            if (page) selectNet(page.index, o.netIds, o.name, false);
                            setTab("nets");
                          }}
                        >
                          <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-[var(--net-highlight)]" />
                          <span className={cn("min-w-0 flex-1 truncate", o.name && "font-mono")}>{o.name || t("이름 없는 노드")}</span>
                        </button>
                      </li>
                    ))}
                    {guide > 0 && (
                      <li className="px-2 py-1.5 text-xs text-muted-foreground">
                        {t(`이름 없는 노드 ${guide}개가 겹쳐 있어 목록으로는 구분할 수 없습니다. 확대해서 고르세요.`, `${guide} unnamed nets overlap here and can't be told apart in a list. Zoom in to choose.`, `名前のないネット${guide}個が重なっているため、一覧では区別できません。拡大して選んでください。`)}
                      </li>
                    )}
                    {choice.more > 0 && (
                      <li className="px-2 py-1.5 text-xs text-muted-foreground">
                        {t(`이 밖에 ${choice.more}개 더 있습니다. 확대해서 고르세요.`, `${choice.more} more here. Zoom in to choose.`, `ほか${choice.more}個は拡大して選んでください。`)}
                      </li>
                    )}
                    <li>
                      <button
                        type="button"
                        className="flex min-h-11 w-full items-center gap-2 rounded-sm px-2 text-left text-sm text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4"
                        onClick={() => {
                          const c = choice;
                          closeChoiceTo();
                          viewer.current?.zoomAround(c.x, c.y, 1 / 3);
                        }}
                      >
                        <ZoomIn aria-hidden="true" />
                        {t("이 부분 확대", "Zoom in here")}
                      </button>
                    </li>
                  </ul>
                </div>
              </>
            );
          })()}

          {busy && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-background/70" role="status" aria-live="polite">
              <div className="flex items-center gap-3 rounded-md border border-border bg-popover px-4 py-3 text-sm shadow-md">
                <Spinner />
                {t(busy, busy.replace(/(\d+\/\d+) 페이지 도면 읽는 중/, "Reading page $1").replace(/(\d+\/\d+) 페이지 연결 분석 중/, "Analyzing connections on page $1").replace("도면 읽는 중", "Reading schematic").replace("완료", "Done"),
                  busy.replace(/(\d+\/\d+) 페이지 도면 읽는 중/, "図面を読み込み中（$1 ページ）").replace(/(\d+\/\d+) 페이지 연결 분석 중/, "接続を解析中（$1 ページ）").replace("도면 읽는 중", "図面を読み込み中").replace("완료", "完了"))}
              </div>
            </div>
          )}

          <div role="status" aria-live="polite" className="busy-note-region pointer-events-none absolute inset-x-3 top-3 z-[45] flex justify-center">
            {busyNote && (
              <p className="busy-note rounded-md border border-border bg-popover px-4 py-2 text-sm shadow-md">
                {t("읽는 중에는 다른 파일을 열 수 없습니다. 끝난 뒤 다시 열어 주세요.", "Another file can't be opened while this one is being read. Try again when it's done.")}
              </p>
            )}
          </div>
        </section>
      </main>
      <footer className="viewer-status" hidden={!layout.side || layout.compact}><span className="status-dot" />{t("파일은 브라우저 안에서만 분석됩니다.")}<span>{t("휠: 확대·축소 · 드래그: 이동")}</span></footer>
      {dragging && <div className="drop-overlay" role="status"><div><FileUp aria-hidden="true" /><h2>{t(doc ? "파일을 여기에 놓으면 현재 도면이 교체됩니다" : "PDF를 놓아 열기")}</h2><p>{t("파일은 브라우저 안에서만 분석됩니다.")}</p></div></div>}
    </div>
  );
}
