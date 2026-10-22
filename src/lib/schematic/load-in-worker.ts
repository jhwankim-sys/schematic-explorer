// Opens a schematic with the reading and analysis in a module worker (analyze-worker.ts); the page
// keeps only its own pdf.js document for drawing. When the worker cannot start (no module worker
// support, the script fails to load or initialise) it falls back once to the same work on the page.
// A newer request replaces an older one: the older call ends with a SupersededError, its worker is
// stopped and nothing it produces afterwards reaches the newer request.
import { getDocumentProxy } from "unpdf";
import { loadSchematic, type Schematic } from "./extract.ts";
import type { WorkerReply, WorkerRequest } from "./worker-protocol.ts";

/** the call was replaced by a newer one before it finished */
export class SupersededError extends Error {
  constructor() {
    super("replaced by a newer file");
    this.name = "SupersededError";
  }
}

/** worker could not start: not a problem with the PDF */
class WorkerStartError extends Error {}

type Progress = (msg: string, ratio: number) => void;
type Analysis = Pick<Schematic, "pages" | "cadNetlist">;

/** the request in progress; replacing it ends it */
let active: { cancel: () => void } | null = null;

const destroy = (pdf: unknown) => (pdf as { destroy?: () => Promise<void> })?.destroy?.().catch(() => {});

function analyzeInWorker(name: string, bytes: ArrayBuffer, onProgress: Progress | undefined, onCancel: (cancel: () => void) => void) {
  return new Promise<Analysis>((resolve, reject) => {
    let w: Worker;
    try {
      w = new Worker(new URL("./analyze-worker.ts", import.meta.url), { type: "module" });
    } catch (e) {
      reject(new WorkerStartError(String(e)));
      return;
    }
    let ready = false;
    let over = false;
    /** stop the worker and drop its handlers; the first caller decides how the promise ends */
    const end = () => {
      if (over) return false;
      over = true;
      w.onmessage = w.onerror = w.onmessageerror = null;
      w.terminate();
      return true;
    };
    onCancel(() => {
      if (end()) reject(new SupersededError());
    });
    w.onmessage = (ev: MessageEvent<WorkerReply>) => {
      // pdf.js inside the worker posts its own messages to the same port: only our replies count
      const m = ev.data;
      if (!m || typeof m !== "object" || !("type" in m)) return;
      if (m.type === "ready") {
        ready = true;
        const req: WorkerRequest = { id: 1, name, bytes };
        w.postMessage(req, [bytes]);
        return;
      }
      if (m.type === "progress") onProgress?.(m.msg, 0);
      else if (m.type === "done") {
        if (end()) resolve({ pages: m.pages, cadNetlist: m.cadNetlist });
      } else if (m.type === "error" && end()) {
        const err = new Error(m.message);
        err.name = m.name;
        reject(err);
      }
    };
    w.onerror = (ev) => {
      ev.preventDefault();
      if (end()) reject(ready ? new Error(`analysis worker stopped: ${ev.message}`) : new WorkerStartError(ev.message || "worker failed to start"));
    };
    w.onmessageerror = () => {
      if (end()) reject(ready ? new Error("analysis worker reply could not be read") : new WorkerStartError("messageerror"));
    };
  });
}

export async function loadSchematicInWorker(file: File, onProgress?: Progress): Promise<Schematic> {
  active?.cancel();
  let replaced = false;
  let stopWorker: (() => void) | null = null;
  const me = {
    cancel: () => {
      replaced = true;
      stopWorker?.();
    },
  };
  active = me;
  // progress of a replaced request never reaches the newer one
  const progress: Progress = (msg, ratio) => {
    if (!replaced) onProgress?.(msg, ratio);
  };
  try {
    const bytes = await file.arrayBuffer();
    if (replaced) throw new SupersededError();
    // the worker takes over one copy; the page keeps another for drawing
    let result: Analysis;
    try {
      result = await analyzeInWorker(file.name, bytes.slice(0), progress, (c) => (stopWorker = c));
    } catch (e) {
      if (!(e instanceof WorkerStartError) || replaced) throw replaced ? new SupersededError() : e;
      // the worker never started: do the same work here, once
      const d = await loadSchematic(file, progress);
      if (replaced) {
        await destroy(d.pdf);
        throw new SupersededError();
      }
      return d;
    }
    if (replaced) throw new SupersededError();
    const pdf = await getDocumentProxy(new Uint8Array(bytes));
    if (replaced) {
      await destroy(pdf);
      throw new SupersededError();
    }
    return { fileName: file.name, pages: result.pages, pdf, cadNetlist: result.cadNetlist };
  } finally {
    stopWorker = null;
    if (active === me) active = null;
  }
}
