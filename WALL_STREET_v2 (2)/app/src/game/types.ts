/**
 * types.ts — типы игры WALL STREET: Rise of the Trader.
 */

export type Mode = "career" | "sandbox" | "survival";

export type Category = "stocks" | "crypto" | "metals" | "forex";

export interface Candle {
  t: number; // абсолютное игровое время (минуты)
  o: number;
  h: number;
  l: number;
  c: number;
}

export interface AssetDef {
  id: string;
  ticker: string;
  name: string;
  category: Category;
  price: number; // стартовая цена
  vol: number; // волатильность за игровую минуту (std лог-доходности)
  drift: number; // склонность к росту за минуту
  beta: number; // чувствительность к общерыночному фактору
  volume: number; // базовый объём торгов
  dividendYield: number; // годовая дивидендная доходность (0 для неплательщиков)
  description: string;
  color: string;
}

export interface AssetState {
  id: string;
  price: number;
  prevPrice: number;
  openDayPrice: number;
  dayHigh: number;
  dayLow: number;
  volume24: number;
  minutes: number[]; // минутные закрытия (хвост истории)
  daily: Candle[]; // дневные свечи (посевная история + живые дни)
}

export type NewsCategory = "tech" | "crypto" | "metals" | "forex" | "macro" | "company";

export interface NewsItem {
  id: number;
  t: number; // игровая минута
  title: string;
  category: NewsCategory;
  sentiment: number; // -3..3
  impact: "low" | "medium" | "high";
}

export interface MarketEffect {
  targets: string[] | null; // null = весь рынок
  category: Category | null;
  drift: number; // добавка к дрифту за тик
  remaining: number; // тиков осталось
}

export interface Position {
  qty: number;
  avgPrice: number;
}

export type TradeSide = "buy" | "sell";

export interface Trade {
  id: number;
  t: number;
  assetId: string;
  side: TradeSide;
  qty: number;
  price: number;
  total: number;
  commission: number;
  pnl: number | null; // только для продаж
}

export interface CalendarEvent {
  id: number;
  day: number; // игровой день
  title: string;
  kind: "macro" | "earnings";
  assetId: string | null;
  impact: "low" | "medium" | "high";
  fired: boolean;
}

export interface DailyQuest {
  id: string;
  progress: number;
  done: boolean;
}

export interface Toast {
  id: number;
  kind: "success" | "error" | "info" | "achievement" | "levelup" | "news";
  title: string;
  text?: string;
}

export interface Stats {
  trades: number;
  wins: number;
  losses: number;
  realizedPnl: number;
  bestTrade: number;
  dividendsEarned: number;
  depositsEarned: number;
  newsRead: number;
}

export interface SaveGame {
  version: number;
  mode: Mode;
  playerName: string;
  seed: number;
  gameMinute: number;
  assets: Record<string, AssetState>;
  balance: number;
  positions: Record<string, Position>;
  trades: Trade[];
  news: NewsItem[];
  effects: MarketEffect[];
  calendar: CalendarEvent[];
  level: number;
  xp: number;
  upgrades: string[];
  favorites: string[];
  achievements: string[];
  dailyQuestsDay: number;
  dailyQuests: DailyQuest[];
  careerDone: string[];
  stats: Stats;
  deposit: { amount: number };
  loan: { principal: number; interest: number };
  lastDividendDay: number;
  equityHistory: { t: number; v: number }[];
  dayStartEquity: number;
  day: number;
  muted: boolean;
}

export interface MetaSave {
  bestSurvivalDays: number;
  careerBestEquity: number;
}
