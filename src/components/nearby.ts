import { distPtSeg } from "../lib/schematic/analyze.ts";
import type { PageIndex } from "../lib/schematic/model.ts";

/**
 * Touch taps: which nets have a wire close to the fingertip. Reads the page index as it is (no change
 * to the analysis); one entry per net id with the distance of its closest wire, nearest first, ties in
 * net id order so the list is always the same for the same tap.
 */
export function netsNear(index: PageIndex, x: number, y: number, r: number): { net: number; d: number }[] {
  const { segs, segNet } = index.page;
  const best = new Map<number, number>();
  for (const i of index.segGrid.query(x - r, y - r, x + r, y + r)) {
    const d = distPtSeg(x, y, segs[4 * i], segs[4 * i + 1], segs[4 * i + 2], segs[4 * i + 3]);
    if (d > r) continue;
    const net = segNet[i];
    const prev = best.get(net);
    if (prev === undefined || d < prev) best.set(net, d);
  }
  return [...best.entries()].map(([net, d]) => ({ net, d })).sort((a, b) => a.d - b.d || a.net - b.net);
}

/** touch thresholds in screen pixels (see the P0-6 measurement report for how they were chosen) */
export const TOUCH = {
  /** a wire this close is taken as meant, unless another net's wire is as close (a crossing) */
  sure: 1,
  /** reach of a touch tap, as before the candidate list (unchanged from the previous touch tolerance) */
  reach: 9,
  /** nets whose wires are within this much of the nearest one count as equally likely */
  gap: 3,
  /** rows shown in the list; the rest are reached by zooming in */
  shown: 4,
} as const;

export type TouchDecision<T> = { kind: "none" } | { kind: "pick"; option: T } | { kind: "choose"; options: T[]; more: number };

/**
 * Decide a touch tap from the nets near it. `key` maps a net to what selecting it would select
 * (named nets select every net of that name), so two candidates that select the same thing are
 * not offered as a choice.
 */
export function decideTouch<T>(near: { net: number; d: number }[], k: number, option: (net: number) => T, key: (net: number) => string): TouchDecision<T> {
  if (!near.length || near[0].d > TOUCH.reach * k) return { kind: "none" };
  const d1 = near[0].d;
  const likely = d1 <= TOUCH.sure * k ? near.filter((n) => n.d <= TOUCH.sure * k) : near.filter((n) => n.d - d1 < TOUCH.gap * k);
  const groups: number[] = [];
  const seen = new Set<string>();
  for (const n of likely) {
    const g = key(n.net);
    if (seen.has(g)) continue;
    seen.add(g);
    groups.push(n.net);
  }
  if (groups.length === 1) return { kind: "pick", option: option(groups[0]) };
  return { kind: "choose", options: groups.slice(0, TOUCH.shown).map(option), more: Math.max(0, groups.length - TOUCH.shown) };
}
