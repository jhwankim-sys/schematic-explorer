// Module worker: reads and analyzes a PDF off the main thread with the same loadSchematic
// (pdf.js reading, Altium bookmarks, annotation hints, analyzePage), so the page stays responsive.
// It only receives the file bytes from the page and only sends the results back; no network.
import "../polyfills.ts";
import { loadSchematic } from "./extract.ts";
import type { WorkerRequest, WorkerReply } from "./worker-protocol.ts";

const post = (m: WorkerReply, transfer: Transferable[] = []) => (self as unknown as Worker).postMessage(m, transfer);

self.onmessage = async (ev: MessageEvent<WorkerRequest>) => {
  const { id, name, bytes } = ev.data;
  try {
    // loadSchematic keeps its own copy for the annotation reader before pdf.js takes the buffer over
    const d = await loadSchematic(new File([bytes], name, { type: "application/pdf" }), (msg) => post({ id, type: "progress", msg }));
    const transfer = new Set<ArrayBuffer>();
    for (const p of d.pages) for (const v of Object.values(p)) if (ArrayBuffer.isView(v) && v.buffer instanceof ArrayBuffer) transfer.add(v.buffer);
    post({ id, type: "done", pages: d.pages, cadNetlist: d.cadNetlist }, [...transfer]);
    // the analysis document is not needed any more (the page opens its own copy for drawing)
    await (d.pdf as { destroy?: () => Promise<void> }).destroy?.();
  } catch (e) {
    post({ id, type: "error", name: String((e as Error)?.name ?? "Error"), message: String((e as Error)?.message ?? e) });
  }
};

post({ id: 0, type: "ready" });
