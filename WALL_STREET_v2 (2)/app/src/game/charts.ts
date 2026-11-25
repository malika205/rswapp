/**
 * charts.ts — построение свечных рядов из минутной истории и дневных свечей.
 */
import { mulberry32 } from "./rng";
import type { AssetState, Candle } from "./types";

export const TIMEFRAMES: { min: number; label: string }[] = [
  { min: 1, label: "1м" },
  { min: 5, label: "5м" },
  { min: 15, label: "15м" },
  { min: 60, label: "1ч" },
  { min: 240, label: "4ч" },
  { min: 720, label: "1д" },
  { min: 1440, label: "1н" },
  { min: 43200, label: "1мес" },
  { min: 525600, label: "1год" },
];

/** Детерминированная генерация внутридневного пути для посевной свечи. */
function intradayCandles(day: Candle, tfMin: number): Candle[] {
  const perDay = Math.max(1, Math.floor(1440 / tfMin));
  const out: Candle[] = [];
  let seed = (Math.imul(day.t, 2654435761) ^ Math.imul(Math.floor(day.o * 1000), 40503)) >>> 0;
  const rng = mulberry32(seed);
  let p = day.o;
  for (let i = 0; i < perDay; i++) {
    const t = day.t + i * tfMin;
    const steps = 6;
    let o = p, h = p, l = p, c = p;
    const target = i === perDay - 1 ? day.c : day.o + ((day.c - day.o) * (i + 1)) / perDay;
    for (let s = 0; s < steps; s++) {
      const f = (s + 1) / steps;
      const anchor = o + (target - o) * f;
      c = anchor + (rng() - 0.5) * (day.h - day.l) * 0.5;
      c = Math.min(Math.max(c, day.l), day.h);
      h = Math.max(h, c);
      l = Math.min(l, c);
    }
    out.push({ t, o, h, l, c });
    p = c;
  }
  out[perDay - 1].c = day.c;
  return out;
}

function groupMinutes(a: AssetState, gameMinute: number, tfMin: number): Candle[] {
  const n = a.minutes.length;
  if (n === 0) return [];
  const oldest = gameMinute - n + 1;
  const startIdx = Math.floor((oldest - 1) / tfMin) * tfMin + 1; // выравнивание по границам TF
  const candles: Candle[] = [];
  let cur: Candle | null = null;
  for (let i = 0; i < n; i++) {
    const t = oldest + i;
    if (t < startIdx) continue;
    const bucket = Math.floor((t - 1) / tfMin) * tfMin + 1;
    const p = a.minutes[i];
    if (!cur || cur.t !== bucket) {
      if (cur) candles.push(cur);
      cur = { t: bucket, o: p, h: p, l: p, c: p };
    }
    cur.h = Math.max(cur.h, p);
    cur.l = Math.min(cur.l, p);
    cur.c = p;
  }
  if (cur) candles.push(cur);
  return candles;
}

/**
 * Свечи актива для таймфрейма. Для мелких ТФ подмешивается детерминированно
 * синтезированный внутридневный хвост из дневных свечей, чтобы график был полным
 * с первой минуты игры.
 */
export function buildCandles(a: AssetState, gameMinute: number, tfMin: number): Candle[] {
  if (tfMin >= 1440) {
    // агрегация дневных свечей
    const per = Math.max(1, Math.round(tfMin / 1440));
    const out: Candle[] = [];
    let cur: Candle | null = null;
    for (const d of a.daily) {
      const bucket = Math.floor(d.t / (per * 1440)) * per * 1440;
      if (!cur || cur.t !== bucket) {
        if (cur) out.push(cur);
        cur = { t: bucket, o: d.o, h: d.h, l: d.l, c: d.c };
      } else {
        cur.h = Math.max(cur.h, d.h);
        cur.l = Math.min(cur.l, d.l);
        cur.c = d.c;
      }
    }
    if (cur) out.push(cur);
    return out.slice(-400);
  }

  const live = groupMinutes(a, gameMinute, tfMin);
  const oldestLive = live.length ? live[0].t : gameMinute;
  // сколько посевных свечей нужно, чтобы добрать ~180 свечей
  const need = Math.max(0, 180 - live.length);
  const perDay = Math.floor(1440 / tfMin);
  const daysNeeded = Math.ceil(need / perDay) + 1;
  const pad: Candle[] = [];
  const daily = a.daily;
  for (let i = Math.max(0, daily.length - daysNeeded - 2); i < daily.length; i++) {
    const d = daily[i];
    if (d.t + 1440 > oldestLive) continue; // не пересекаемся с живой историей
    for (const c of intradayCandles(d, tfMin)) {
      if (c.t + tfMin <= oldestLive) pad.push(c);
    }
  }
  return [...pad, ...live].slice(-400);
}

/** Метка времени свечи (корректно и для посевной истории с t < 0). */
export function candleLabel(t: number, tfMin: number): string {
  const days = Math.floor(t / 1440);
  const mins = ((t % 1440) + 1440) % 1440;
  const d = new Date(2024, 0, 2 + days);
  const months = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
  const dd = `${d.getDate()} ${months[d.getMonth()]}`;
  if (tfMin >= 1440) return dd;
  const hh = String(Math.floor(mins / 60)).padStart(2, "0");
  const mm = String(mins % 60).padStart(2, "0");
  return tfMin >= 720 ? `${dd} ${hh}:00` : `${dd} ${hh}:${mm}`;
}
