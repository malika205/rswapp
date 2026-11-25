/**
 * utils.ts — форматирование чисел и денег.
 */

export function fmtMoney(v: number, sign = false): string {
  const s = v < 0 ? "-" : sign && v > 0 ? "+" : "";
  const abs = Math.abs(v);
  if (abs >= 1_000_000_000) return `${s}$${(abs / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${s}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 10_000) return `${s}$${(abs / 1_000).toFixed(1)}K`;
  if (abs >= 0.01) return `${s}$${abs.toFixed(2)}`;
  if (abs >= 0.0001) return `${s}$${abs.toFixed(4)}`;
  return `${s}$0.00`;
}

export function fmtPrice(v: number): string {
  if (v >= 1000) return v.toFixed(0);
  if (v >= 100) return v.toFixed(2);
  if (v >= 1) return v.toFixed(3);
  return v.toFixed(5);
}

export function fmtQty(v: number): string {
  if (v >= 1000) return v.toFixed(0);
  if (v >= 1) return v.toFixed(2);
  return v.toFixed(4);
}

export function fmtPct(v: number, sign = true): string {
  const s = v < 0 ? "" : sign ? "+" : "";
  return `${s}${(v * 100).toFixed(2)}%`;
}

export function fmtCompact(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toFixed(0);
}
