/**
 * engine.ts — рыночный движок игры.
 *
 * Модель: геометрическое броуновское движение (GBM) на игровую минуту,
 * общерыночный фактор + режимы рынка (спокойствие/бычий/медвежий/кризис),
 * новостные эффекты с затуханием, скачки (jumps), посевная дневная история.
 */
import { ASSETS, ASSET_MAP, MINUTES_CAP, NEWS_TEMPLATES, SEED_DAYS } from "./data";
import { gaussian, mulberry32, pick, randInt, type Rng } from "./rng";
import type { AssetState, Candle, MarketEffect, NewsItem } from "./types";

export type MarketRegime = "calm" | "bull" | "bear" | "crisis";

export const REGIME_DRIFT: Record<MarketRegime, number> = {
  calm: 0,
  bull: 0.000006,
  bear: -0.000006,
  crisis: -0.00002,
};

export const REGIME_VOL: Record<MarketRegime, number> = {
  calm: 1,
  bull: 1.15,
  bear: 1.3,
  crisis: 2.1,
};

export interface EngineState {
  regime: MarketRegime;
  regimeTicks: number; // сколько тиков в текущем режиме
  newsCounter: number;
  crisisSurvived: boolean; // был ли пережит кризис (для достижения)
  inCrisis: boolean;
}

export function newEngineState(): EngineState {
  return { regime: "calm", regimeTicks: 0, newsCounter: 0, crisisSurvived: false, inCrisis: false };
}

/**
 * Посевная дневная история: обратный блуждающий проход от стартовой цены.
 * Каждая свеча закрывается ровно там, где открылась следующая (новая) — график непрерывен.
 * Возвращает массив по возрастанию времени; последняя свеча закрывается на defPrice.
 */
export function seedDaily(defPrice: number, volPerMinute: number, driftPerMinute: number, rng: Rng): Candle[] {
  const candles: Candle[] = [];
  const dailyVol = volPerMinute * Math.sqrt(1440);
  const steps = 8;
  let close = defPrice;
  for (let d = 0; d < SEED_DAYS; d++) {
    const t = -((d + 1) * 1440);
    // шагаем назад во времени от известного закрытия
    let p = close;
    let h = p;
    let l = p;
    for (let s = 0; s < steps; s++) {
      const ret = (driftPerMinute * 1440) / steps + (dailyVol / Math.sqrt(steps)) * gaussian(rng);
      p = Math.max(p / Math.exp(ret), defPrice * 0.02);
      h = Math.max(h, p);
      l = Math.min(l, p);
    }
    const o = p;
    candles.push({ t, o, h, l, c: close });
    close = o; // более старая свеча закроется на открытии этой
  }
  candles.reverse(); // по возрастанию времени: самая первая — самая старая
  return candles;
}

/** Синтез последнего игрового дня внутри посевной свечи — минутные закрытия до старта игры. */
export function synthDayMinutes(dayCandle: Candle, rng: Rng): number[] {
  const out: number[] = [];
  const n = 1440;
  let p = dayCandle.o;
  const target = dayCandle.c;
  const range = Math.max(dayCandle.h - dayCandle.l, Math.abs(target - p) * 0.5, p * 0.002);
  for (let i = 0; i < n; i++) {
    const frac = (i + 1) / n;
    const anchor = p + (target - p) * 0.06;
    let next = anchor + gaussian(rng) * range * 0.12;
    next = Math.min(Math.max(next, dayCandle.l), dayCandle.h);
    out.push(next);
    p = next;
  }
  out[n - 1] = target;
  return out;
}

/** Полная инициализация всех активов. */
export function initAssets(seed: number): Record<string, AssetState> {
  const assets: Record<string, AssetState> = {};
  ASSETS.forEach((def, i) => {
    const rng = mulberry32(seed + i * 7919);
    const daily = seedDaily(def.price, def.vol, def.drift, rng);
    const lastCandle = daily[daily.length - 1];
    const minutes = synthDayMinutes(lastCandle, rng);
    const price = minutes[minutes.length - 1];
    const volRng = mulberry32(seed + i * 104729);
    assets[def.id] = {
      id: def.id,
      price,
      prevPrice: price,
      openDayPrice: price,
      dayHigh: price,
      dayLow: price,
      volume24: def.volume * (0.7 + volRng() * 0.6),
      minutes,
      daily,
    };
  });
  return assets;
}

/** Случайное дневное колебание объёма. */
export function updateVolume(a: AssetState, rng: Rng): void {
  const def = ASSET_MAP[a.id];
  a.volume24 = Math.max(def.volume * 0.3, a.volume24 * (1 + (rng() - 0.5) * 0.04));
}

/** Переход режимов рынка (скрытая марковская цепь). */
export function stepRegime(st: EngineState, rng: Rng): void {
  st.regimeTicks++;
  let pSwitch = 0.004;
  if (st.regime === "crisis") pSwitch = 0.02; // кризисы длятся недолго
  else if (st.regime === "bear") pSwitch = 0.012;
  if (rng() < pSwitch) {
    const roll = rng();
    let next: MarketRegime = "calm";
    if (st.regime === "crisis") next = roll < 0.5 ? "bear" : "calm";
    else if (roll < 0.4) next = "calm";
    else if (roll < 0.65) next = "bull";
    else if (roll < 0.88) next = "bear";
    else next = "crisis";
    st.regime = next;
    st.regimeTicks = 0;
  }
  st.inCrisis = st.regime === "crisis";
  if (st.regime === "crisis" && st.regimeTicks > 200) st.crisisSurvived = true;
  if (st.regime === "crisis" && st.regimeTicks === 1) st.crisisSurvived = false; // новый кризис — заново
}

/** Генерация новостной сводки. */
export function generateNews(gameMinute: number, rng: Rng, counter: number): { news: NewsItem; effect: MarketEffect | null } {
  const tpl = pick(rng, NEWS_TEMPLATES);
  const impact = Math.abs(tpl.sentiment) <= 1 ? "low" : Math.abs(tpl.sentiment) <= 2 ? "medium" : "high";
  const news: NewsItem = {
    id: counter,
    t: gameMinute,
    title: tpl.text,
    category: tpl.cat,
    sentiment: tpl.sentiment,
    impact,
  };
  let effect: MarketEffect | null = null;
  if (tpl.sentiment !== 0) {
    effect = {
      targets: tpl.scope === "asset" && tpl.target ? [tpl.target] : null,
      category: tpl.scope === "category" ? (tpl.target as MarketEffect["category"]) : null,
      drift: tpl.sentiment * 0.000035,
      remaining: tpl.dur,
    };
  }
  return { news, effect };
}

/** Один тик рынка: 1 игровая минута. */
export function tickMarket(
  assets: Record<string, AssetState>,
  effects: MarketEffect[],
  st: EngineState,
  gameMinute: number,
  rng: Rng
): void {
  stepRegime(st, rng);
  const m = gaussian(rng) * REGIME_VOL[st.regime];
  const marketDrift = REGIME_DRIFT[st.regime];

  for (const id in assets) {
    const a = assets[id];
    const def = ASSET_MAP[id];
    a.prevPrice = a.price;
    let shock = 0;
    for (let i = effects.length - 1; i >= 0; i--) {
      const e = effects[i];
      const hit = e.targets === null || (e.targets !== null && e.targets.includes(id)) || e.category === def.category;
      if (hit) shock += e.drift;
    }
    let ret = def.drift + marketDrift * def.beta + def.vol * m * def.beta + shock;
    // случайный скачок
    if (rng() < 0.004) {
      const mag = (0.5 + rng() * 1.5) * def.vol * 12 * REGIME_VOL[st.regime];
      ret += rng() < 0.5 ? -mag : mag;
    }
    let p = a.price * Math.exp(ret);
    if (p < def.price * 0.01) p = def.price * 0.01; // защита от обнуления
    a.price = p;
    a.dayHigh = Math.max(a.dayHigh, p);
    a.dayLow = Math.min(a.dayLow, p);
    a.minutes.push(p);
    if (a.minutes.length > MINUTES_CAP) a.minutes.splice(0, a.minutes.length - MINUTES_CAP);
    updateVolume(a, rng);
  }

  // затухание эффектов
  for (let i = effects.length - 1; i >= 0; i--) {
    effects[i].remaining--;
    effects[i].drift *= 0.997;
    if (effects[i].remaining <= 0) effects.splice(i, 1);
  }
}

/** Граница игрового дня: обновление дневных свечей и дневной статистики. */
export function rollDay(assets: Record<string, AssetState>, dayIndex: number): void {
  for (const id in assets) {
    const a = assets[id];
    const t = dayIndex * 1440;
    a.daily.push({ t, o: a.openDayPrice, h: a.dayHigh, l: a.dayLow, c: a.price });
    if (a.daily.length > SEED_DAYS + 40) a.daily.splice(0, a.daily.length - (SEED_DAYS + 40));
    a.openDayPrice = a.price;
    a.dayHigh = a.price;
    a.dayLow = a.price;
  }
}

/** Дата из игровой минуты. Игра стартует 2 января 2024. */
export function gameDate(gameMinute: number): { date: string; time: string; day: number } {
  const abs = Math.floor(gameMinute / 1440);
  const mins = Math.floor(gameMinute % 1440);
  const d = new Date(2024, 0, 2 + abs, 0, 0, 0);
  const months = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
  const date = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  const time = `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
  return { date, time, day: abs };
}

export function newsTimeLabel(gameMinute: number, now: number): string {
  const diff = Math.max(0, now - gameMinute);
  if (diff < 60) return `${diff} мин назад`;
  if (diff < 1440) return `${Math.floor(diff / 60)} ч назад`;
  return `${Math.floor(diff / 1440)} дн назад`;
}

export { randInt };
