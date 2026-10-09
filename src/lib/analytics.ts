// Visitor analytics (Google Analytics 4). Nothing is loaded or sent while GA_ID is empty.
// Only coarse usage events are sent — never file names, file contents or anything read from a drawing.
// The privacy page (scripts/pages) describes this automatically whenever an ID is configured.

import config from "../../site.config.json";

/** GA4 measurement ID ("G-XXXXXXXXXX") from site.config.json; empty = analytics off */
export const GA_ID: string = /^G-[A-Z0-9]+$/.test(config.ga4MeasurementId) ? config.ga4MeasurementId : "";

type Params = Record<string, string | number | boolean>;
type Gtag = (...args: unknown[]) => void;

let ready = false;
function gtag(): Gtag | null {
  if (!GA_ID || typeof window === "undefined") return null;
  const w = window as unknown as { dataLayer?: unknown[]; gtag?: Gtag };
  if (!ready) {
    ready = true;
    w.dataLayer = w.dataLayer ?? [];
    w.gtag = function () {
      // gtag expects the arguments object itself
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer!.push(arguments);
    };
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(s);
    w.gtag("js", new Date());
    w.gtag("config", GA_ID, { anonymize_ip: true });
  }
  return w.gtag ?? null;
}

/** start analytics (page view) — call once when the site loads */
export function initAnalytics() {
  gtag();
}

export type AnalyticsEvent =
  | { name: "file_open"; params: { source: "picker" | "drop"; size_kb: number } }
  | { name: "example_load"; params: Params }
  | { name: "view_complete"; params: { pages: number; nets: number; parts: number; load_ms: number; text_layer: boolean } }
  | { name: "error"; params: { type: "not_pdf" | "encrypted" | "read_failed" | "no_vector" | "render_failed" } };

export function track(e: AnalyticsEvent) {
  try {
    gtag()?.("event", e.name, e.params);
  } catch {
    /* analytics must never break the tool */
  }
}
