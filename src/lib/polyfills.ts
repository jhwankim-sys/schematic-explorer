// pdf.js 6 uses a few very new JavaScript built-ins. Older browsers (and some
// company-managed Chrome versions) lack them, which makes PDF painting fail.
type Upsert = {
  getOrInsert?: (k: unknown, v: unknown) => unknown;
  getOrInsertComputed?: (k: unknown, f: (k: unknown) => unknown) => unknown;
};

for (const C of [Map, WeakMap] as unknown as { prototype: Upsert & { has(k: unknown): boolean; get(k: unknown): unknown; set(k: unknown, v: unknown): unknown } }[]) {
  const p = C.prototype;
  if (!p.getOrInsertComputed)
    p.getOrInsertComputed = function (this: typeof p, k: unknown, f: (k: unknown) => unknown) {
      if (!this.has(k)) this.set(k, f(k));
      return this.get(k);
    };
  if (!p.getOrInsert)
    p.getOrInsert = function (this: typeof p, k: unknown, v: unknown) {
      if (!this.has(k)) this.set(k, v);
      return this.get(k);
    };
}

const P = Promise as unknown as { try?: (fn: (...a: unknown[]) => unknown, ...a: unknown[]) => Promise<unknown> };
if (!P.try) P.try = (fn, ...a) => new Promise((resolve) => resolve(fn(...a)));

const M = Math as unknown as { sumPrecise?: (it: Iterable<number>) => number };
if (!M.sumPrecise)
  M.sumPrecise = (it) => {
    let s = 0;
    for (const x of it) s += x;
    return s;
  };

export {};
