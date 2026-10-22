import type { SchPage } from "./analyze.ts";
import type { CadNetlist } from "./cad-hints.ts";

/** page → worker: one file to read and analyze */
export interface WorkerRequest {
  id: number;
  name: string;
  bytes: ArrayBuffer;
}

/** worker → page */
export type WorkerReply =
  | { id: 0; type: "ready" }
  | { id: number; type: "progress"; msg: string }
  | { id: number; type: "done"; pages: SchPage[]; cadNetlist: CadNetlist | null }
  | { id: number; type: "error"; name: string; message: string };
