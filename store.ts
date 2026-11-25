/**
 * store.ts — центральное состояние игры (zustand): рынок, сделки, задания,
 * достижения, банк, режимы, автосохранение.
 */
import { create } from "zustand";
import {
  ACHIEVEMENTS, ASSETS, ASSET_MAP, CALENDAR_TEMPLATES, CAREER_QUESTS,
  DAILY_QUEST_POOL, DIVIDEND_PERIOD_DAYS, LEVELS, MODES, UPGRADES,
  commissionRate, dailyProgress, depositApy, loanLimit, sentimentImpact, xpMultiplier,
  type DailyQuestDef,
} from "./data";
import {
  generateNews, initAssets, newEngineState, rollDay, tickMarket,
  type EngineState,
} from "./engine";
import { mulberry32, pick, randInt, type Rng } from "./rng";
import { setMuted as setAudioMuted, sfx } from "./audio";
import type {
  AssetState, CalendarEvent, DailyQuest, MarketEffect, MetaSave, Mode,
  NewsItem, Position, SaveGame, Stats, Toast, Trade, TradeSide,
} from "./types";
import type { DailyCounters } from "./data";

const SAVE_PREFIX = "wst.save.v1.";
const META_KEY = "wst.meta.v1";
const SAVE_VERSION = 1;

export type Tab = "dashboard" | "trading" | "portfolio" | "news" | "career" | "bank";

export interface GameStore {
  screen: "title" | "game";
  tab: Tab;
  mode: Mode | null;
  playerName: string;
  seed: number;
  gameMinute: number;
  day: number;
  assets: Record<string, AssetState>;
  engine: EngineState;
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
  compare: string[];
  achievements: string[];
  careerDone: string[];
  dailyQuestsDay: number;
  dailyQuests: DailyQuest[];
  stats: Stats;
  deposit: { amount: number };
  loan: { principal: number; interest: number };
  lastDividendDay: number;
  dividendSources: string[];
  equityHistory: { t: number; v: number }[];
  dayStartEquity: number;
  muted: boolean;
  toasts: Toast[];
  gameOver: { days: number; equity: number } | null;
  // UI
  selectedAsset: string | null;
  tradeModal: { assetId: string; side: TradeSide } | null;
  profileOpen: boolean;
  daily: DailyCounters;
  tickerPause: boolean;

  // actions
  startNewGame(mode: Mode): void;
  continueGame(mode: Mode): boolean;
  backToTitle(): void;
  setTab(t: Tab): void;
  setSelectedAsset(id: string | null): void;
  openTrade(assetId: string, side: TradeSide): void;
  closeTrade(): void;
  buyAsset(assetId: string, qty: number): void;
  sellAsset(assetId: string, qty: number): void;
  toggleFavorite(id: string): void;
  toggleCompare(id: string): void;
  clearCompare(): void;
  depositAdd(amount: number): void;
  depositWithdraw(): void;
  loanTake(amount: number): void;
  loanRepay(amount: number): void;
  buyUpgrade(id: string): void;
  setMuted(m: boolean): void;
  setName(n: string): void;
  setProfileOpen(o: boolean): void;
  setTickerPause(p: boolean): void;
  dismissToast(id: number): void;
  restartMode(): void;
}

// ---------- внутренние модуля ----------
let rng: Rng = mulberry32(1);
let toastSeq = 1;
let tradeSeq = 1;
let newsSeq = 1;
let eventSeq = 1;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let hadLoan = false;
// мосты из замыкания create() в модульный таймер
let internalTick: () => void = () => {};
let internalPersist: () => void = () => {};

function meta(): MetaSave {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (raw) return JSON.parse(raw) as MetaSave;
  } catch { /* ignore */ }
  return { bestSurvivalDays: 0, careerBestEquity: 0 };
}

function saveMeta(m: MetaSave): void {
  try { localStorage.setItem(META_KEY, JSON.stringify(m)); } catch { /* ignore */ }
}

function hasSave(mode: Mode): boolean {
  try { return localStorage.getItem(SAVE_PREFIX + mode) !== null; } catch { return false; }
}

export function savedModes(): Mode[] {
  return MODES.map((m) => m.id).filter(hasSave);
}

function defaultStats(): Stats {
  return {
    trades: 0, wins: 0, losses: 0, realizedPnl: 0, bestTrade: 0,
    dividendsEarned: 0, depositsEarned: 0, newsRead: 0,
  };
}

export const useGame = create<GameStore>((set, get) => {
  function equityOf(s: GameStore): number {
    let pos = 0;
    for (const id in s.positions) {
      const a = s.assets[id];
      if (a) pos += s.positions[id].qty * a.price;
    }
    return s.balance + s.deposit.amount - s.loan.principal - s.loan.interest + pos;
  }

  function toast(kind: Toast["kind"], title: string, text?: string): void {
    const id = toastSeq++;
    set((st) => ({ toasts: [...st.toasts.slice(-4), { id, kind, title, text }] }));
    setTimeout(() => get().dismissToast(id), kind === "achievement" || kind === "levelup" ? 6000 : 4000);
  }

  function scheduleSave(): void {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => persist(get()), 800);
  }

  function persist(s: GameStore): void {
    if (!s.mode || s.screen !== "game") return;
    const save: SaveGame = {
      version: SAVE_VERSION, mode: s.mode, playerName: s.playerName, seed: s.seed,
      gameMinute: s.gameMinute, assets: s.assets, balance: s.balance, positions: s.positions,
      trades: s.trades.slice(-200), news: s.news.slice(-40), effects: s.effects,
      calendar: s.calendar, level: s.level, xp: s.xp, upgrades: s.upgrades,
      favorites: s.favorites, achievements: s.achievements, careerDone: s.careerDone,
      dailyQuestsDay: s.dailyQuestsDay, dailyQuests: s.dailyQuests, stats: s.stats,
      deposit: s.deposit, loan: s.loan, lastDividendDay: s.lastDividendDay,
      equityHistory: s.equityHistory.slice(-1200), dayStartEquity: s.dayStartEquity,
      day: s.day, muted: s.muted,
    };
    try { localStorage.setItem(SAVE_PREFIX + s.mode, JSON.stringify(save)); } catch { /* ignore */ }
    // мета-рекорды
    const m = meta();
    let changed = false;
    if (s.mode === "survival" && s.day > m.bestSurvivalDays) { m.bestSurvivalDays = s.day; changed = true; }
    if (s.mode === "career" && equityOf(s) > m.careerBestEquity) { m.careerBestEquity = equityOf(s); changed = true; }
    if (changed) saveMeta(m);
  }

  function addXp(amount: number): void {
    const s = get();
    let xp = s.xp + Math.round(amount * xpMultiplier(s.upgrades));
    let level = s.level;
    while (level < LEVELS.length && xp >= LEVELS[level].xp) {
      level++;
      const def = LEVELS[level - 1];
      toast("levelup", `⬆️ Уровень ${level}: ${def.title}`, def.unlocks.length ? `Открыто: ${def.unlocks.join(", ")}` : undefined);
      sfx.levelup();
    }
    set({ xp, level });
  }

  function grantAchievement(id: string): void {
    const s = get();
    if (s.achievements.includes(id)) return;
    const def = ACHIEVEMENTS.find((a) => a.id === id);
    set({ achievements: [...s.achievements, id] });
    toast("achievement", `${def?.icon ?? "🏅"} Достижение: ${def?.title ?? id}`, def?.desc);
    sfx.achievement();
    addXp(60);
    scheduleSave();
  }

  /** Прогресс карьерных заданий по id. */
  function careerProgress(id: string): number {
    const s = get();
    switch (id) {
      case "q_first": return Math.min(1, s.stats.trades);
      case "q_profit100": return Math.min(100, s.stats.bestTrade);
      case "q_three": return Object.keys(s.positions).length;
      case "q_20k": return Math.min(20_000, Math.floor(equityOf(s)));
      case "q_wins5": return Math.min(5, s.stats.wins);
      case "q_trades25": return Math.min(25, s.stats.trades);
      case "q_dividend": return s.stats.dividendsEarned > 0 ? 1 : 0;
      case "q_fav5": return Math.min(5, s.favorites.length);
      case "q_100k": return Math.min(100_000, Math.floor(equityOf(s)));
      case "q_crisis": return s.engine.crisisSurvived ? 1 : 0;
      default: return 0;
    }
  }

  function checkCareerQuests(): void {
    const s = get();
    for (const q of CAREER_QUESTS) {
      if (s.careerDone.includes(q.id)) continue;
      if (careerProgress(q.id) >= q.target) {
        set({
          careerDone: [...get().careerDone, q.id],
          balance: get().balance + q.reward,
        });
        toast("success", `✅ Задание выполнено: ${q.title}`, `Награда ${"$"}${q.reward} и +${q.xp} XP`);
        sfx.money();
        addXp(q.xp);
      }
    }
  }

  function checkAchievements(): void {
    const s = get();
    const eq = equityOf(s);
    if (s.stats.trades >= 1) grantAchievement("ach_buy");
    if (s.stats.wins + s.stats.losses >= 1) grantAchievement("ach_sell");
    if (s.stats.wins >= 1) grantAchievement("ach_profit");
    if (s.stats.realizedPnl >= 10_000) grantAchievement("ach_profit10k");
    if (eq >= 1_000_000) grantAchievement("ach_million");
    if (Object.keys(s.positions).length >= 10) grantAchievement("ach_ten");
    if (s.stats.trades >= 100) grantAchievement("ach_100trades");
    if (s.engine.crisisSurvived) grantAchievement("ach_crisis");
    if (s.level >= 5) grantAchievement("ach_level5");
    if (s.dividendSources.length >= 3) grantAchievement("ach_dividend");
    if (hadLoan && s.loan.principal <= 0) grantAchievement("ach_loan");
    if (s.stats.depositsEarned > 0) grantAchievement("ach_deposit");
  }

  function rollDailyQuests(day: number): DailyQuest[] {
    const pool = [...DAILY_QUEST_POOL];
    const out: DailyQuest[] = [];
    for (let i = 0; i < 3 && pool.length; i++) {
      const idx = Math.floor(rng() * pool.length);
      const def = pool.splice(idx, 1)[0];
      out.push({ id: def.id, progress: 0, done: false });
    }
    void day;
    return out;
  }

  function ensureCalendar(): void {
    const s = get();
    const upcoming = s.calendar.filter((e) => !e.fired);
    if (upcoming.length >= 4) return;
    const lastDay = upcoming.reduce((m, e) => Math.max(m, e.day), s.day);
    const tpl = pick(rng, CALENDAR_TEMPLATES);
    const ev: CalendarEvent = {
      id: eventSeq++, day: lastDay + randInt(rng, 1, 3),
      title: tpl.title, kind: tpl.kind, assetId: tpl.assetId,
      impact: tpl.impact, fired: false,
    };
    set({ calendar: [...get().calendar, ev] });
  }

  function fireEvent(ev: CalendarEvent): void {
    const sentiment = randInt(rng, -3, 3) || (rng() < 0.5 ? -1 : 1);
    const good = sentiment > 0;
    const item: NewsItem = {
      id: newsSeq++, t: get().gameMinute,
      title: ev.assetId
        ? `${ev.title}: ${ASSET_MAP[ev.assetId].name} ${good ? "превзошла ожидания" : "разочаровала инвесторов"}`
        : `${ev.title}: ${good ? "данные лучше прогнозов" : "данные хуже прогнозов"}`,
      category: ev.kind === "macro" ? "macro" : "company",
      sentiment, impact: sentimentImpact(sentiment),
    };
    set({
      news: [item, ...get().news].slice(0, 40),
      effects: [...get().effects, {
        targets: ev.assetId ? [ev.assetId] : null,
        category: ev.assetId ? null : null,
        drift: sentiment * 0.00004, remaining: 160,
      }],
    });
    sfx.news();
    if (ev.impact === "high") toast("news", "📰 Важная новость", item.title);
  }

  function dayBoundary(): void {
    const s = get();
    rollDay(s.assets, s.day);
    // проценты по депозиту
    let dep = s.deposit;
    const apy = depositApy(s.upgrades);
    const interest = dep.amount * (apy / 365);
    let stats = s.stats;
    if (interest >= 0.01) {
      dep = { amount: dep.amount + interest };
      stats = { ...stats, depositsEarned: stats.depositsEarned + interest };
    }
    // проценты по кредиту
    let loan = s.loan;
    if (loan.principal > 0) {
      loan = { ...loan, interest: loan.interest + loan.principal * (0.14 / 365) };
    }
    set({ deposit: dep, loan, stats });

    // дивиденды
    if (s.day - s.lastDividendDay >= DIVIDEND_PERIOD_DAYS) {
      let total = 0;
      const sources = new Set(s.dividendSources);
      for (const id in s.positions) {
        const def = ASSET_MAP[id];
        if (!def || def.dividendYield <= 0) continue;
        const a = s.assets[id];
        const amount = s.positions[id].qty * a.price * (def.dividendYield / 36.5);
        if (amount > 0) { total += amount; sources.add(id); }
      }
      if (total > 0) {
        set({
          balance: get().balance + total,
          lastDividendDay: s.day,
          dividendSources: [...sources],
          stats: { ...get().stats, dividendsEarned: get().stats.dividendsEarned + total },
        });
        toast("success", "💸 Дивиденды выплачены", `Вам начислено $${total.toFixed(2)}`);
        sfx.money();
      } else {
        set({ lastDividendDay: s.day });
      }
    }

    // календарные события
    const fired = s.calendar.filter((e) => !e.fired && s.day >= e.day);
    if (fired.length) {
      set({ calendar: get().calendar.map((e) => (fired.includes(e) ? { ...e, fired: true } : e)) });
      for (const ev of fired) fireEvent(ev);
    }
    ensureCalendar();

    // ежедневные задания
    set({
      dailyQuests: rollDailyQuests(s.day + 1),
      dailyQuestsDay: s.day + 1,
      daily: { trades: 0, buys: 0, profit: 0, assetsBought: new Set(), categoryTrades: {} },
      dayStartEquity: equityOf(get()),
    });

    // выживание: банкротство
    if (s.mode === "survival" && equityOf(get()) < 100) {
      set({ gameOver: { days: s.day, equity: equityOf(get()) } });
      persist(get());
    }
  }

  function tick(): void {
    const s = get();
    if (s.screen !== "game" || s.gameOver || s.tickerPause) return;
    const gameMinute = s.gameMinute + 1;
    const day = Math.floor(gameMinute / 1440);
    tickMarket(s.assets, s.effects, s.engine, gameMinute, rng);
    set({ gameMinute, day });

    if (day > s.day) {
      set({ day });
      dayBoundary();
    }

    // новости: ~1 раз в 1–2 игровых дня
    if (rng() < 0.006) {
      const { news, effect } = generateNews(gameMinute, rng, newsSeq++);
      set({ news: [news, ...get().news].slice(0, 40) });
      if (effect) set({ effects: [...get().effects, effect] });
      sfx.news();
      if (news.impact === "high") toast("news", "📰 Срочная новость", news.title);
    }

    // история капитала (в начале — каждый тик, потом раз в 5 игровых минут)
    if (gameMinute < 240 || gameMinute % 5 === 0) {
      const eq = equityOf(get());
      const hist = [...get().equityHistory, { t: gameMinute, v: eq }];
      if (hist.length > 1200) hist.splice(0, hist.length - 1200);
      set({ equityHistory: hist });
    }

    // прогресс ежедневных заданий
    const st = get();
    let changed = false;
    const quests = st.dailyQuests.map((q) => {
      if (q.done) return q;
      const def = DAILY_QUEST_POOL.find((d) => d.id === q.id);
      if (!def) return q;
      const p = Math.min(def.target, dailyProgress(def, st.daily));
      if (p !== q.progress) changed = true;
      if (p >= def.target) {
        changed = true;
        set({ balance: get().balance + def.reward });
        toast("success", `✅ Ежедневное задание: ${def.title}`, `Награда $${def.reward} и +${def.xp} XP`);
        sfx.money();
        addXp(def.xp);
        return { ...q, progress: p, done: true };
      }
      return { ...q, progress: p };
    });
    if (changed) set({ dailyQuests: quests });

    checkCareerQuests();
    checkAchievements();

    if (gameMinute % 15 === 0) persist(get());
  }

  // регистрация мостов и игрового цикла (1 тик = 1 игровая минута ≈ 0.9 с реального времени)
  internalTick = tick;
  internalPersist = () => persist(get());
  setInterval(() => tick(), 900);

  // ---------- публичные actions ----------
  return {
    screen: "title",
    tab: "dashboard",
    mode: null,
    playerName: "Трейдер",
    seed: 1,
    gameMinute: 0,
    day: 0,
    assets: {},
    engine: newEngineState(),
    balance: 0,
    positions: {},
    trades: [],
    news: [],
    effects: [],
    calendar: [],
    level: 1,
    xp: 0,
    upgrades: [],
    favorites: [],
    compare: [],
    achievements: [],
    careerDone: [],
    dailyQuestsDay: 0,
    dailyQuests: [],
    stats: defaultStats(),
    deposit: { amount: 0 },
    loan: { principal: 0, interest: 0 },
    lastDividendDay: 0,
    dividendSources: [],
    equityHistory: [],
    dayStartEquity: 0,
    muted: false,
    toasts: [],
    gameOver: null,
    selectedAsset: null,
    tradeModal: null,
    profileOpen: false,
    daily: { trades: 0, buys: 0, profit: 0, assetsBought: new Set(), categoryTrades: {} },
    tickerPause: false,

    startNewGame(mode: Mode) {
      const def = MODES.find((m) => m.id === mode)!;
      const seed = (Date.now() ^ (Math.floor(performance.now() * 1000))) >>> 0;
      rng = mulberry32(seed);
      tradeSeq = 1; newsSeq = 1; eventSeq = 1; hadLoan = false;
      const assets = initAssets(seed);
      set({
        screen: "game", mode, seed, gameMinute: 0, day: 0, assets,
        engine: newEngineState(), balance: def.startBalance, positions: {},
        trades: [], news: [], effects: [], calendar: [], level: 1, xp: 0,
        upgrades: [], compare: [], achievements: [], careerDone: [],
        dailyQuestsDay: 0, dailyQuests: rollDailyQuests(0), stats: defaultStats(),
        deposit: { amount: 0 }, loan: { principal: 0, interest: 0 },
        lastDividendDay: 0, dividendSources: [], equityHistory: [],
        dayStartEquity: def.startBalance, gameOver: null, tab: "dashboard",
        selectedAsset: null, tradeModal: null, tickerPause: false, profileOpen: false,
        daily: { trades: 0, buys: 0, profit: 0, assetsBought: new Set(), categoryTrades: {} },
      });
      for (let i = 0; i < 4; i++) ensureCalendar();
      // пара стартовых новостей, чтобы лента не была пустой
      const starter: NewsItem[] = [];
      for (let i = 0; i < 2; i++) {
        const { news, effect } = generateNews(0, rng, newsSeq++);
        starter.push(news);
        if (effect) set({ effects: [...get().effects, effect] });
      }
      set({ news: starter, equityHistory: [{ t: 0, v: def.startBalance }] });
      persist(get());
    },

    continueGame(mode: Mode) {
      try {
        const raw = localStorage.getItem(SAVE_PREFIX + mode);
        if (!raw) return false;
        const save = JSON.parse(raw) as SaveGame;
        if (save.version !== SAVE_VERSION) return false;
        rng = mulberry32((save.seed ^ Math.imul(save.gameMinute + 1, 2654435761)) >>> 0);
        tradeSeq = Math.max(0, ...save.trades.map(t => t.id)) + 1;
        newsSeq = save.news.length + 1;
        eventSeq = save.calendar.length + 1;
        hadLoan = save.loan.principal > 0 || save.stats.trades > 0;
        set({
          screen: "game", mode, playerName: save.playerName, seed: save.seed,
          gameMinute: save.gameMinute, day: save.day, assets: save.assets,
          engine: newEngineState(), balance: save.balance, positions: save.positions,
          trades: save.trades, news: save.news, effects: save.effects,
          calendar: save.calendar, level: save.level, xp: save.xp,
          upgrades: save.upgrades, favorites: save.favorites,
          achievements: save.achievements, careerDone: save.careerDone,
          dailyQuestsDay: save.dailyQuestsDay, dailyQuests: save.dailyQuests,
          stats: save.stats, deposit: save.deposit, loan: save.loan,
          lastDividendDay: save.lastDividendDay, dividendSources: [],
          equityHistory: save.equityHistory, dayStartEquity: save.dayStartEquity,
          gameOver: null, tab: "dashboard", selectedAsset: null, tradeModal: null, tickerPause: false, profileOpen: false,
          muted: save.muted,
          daily: { trades: 0, buys: 0, profit: 0, assetsBought: new Set(), categoryTrades: {} },
        });
        setAudioMuted(save.muted);
        return true;
      } catch {
        return false;
      }
    },

    backToTitle() {
      persist(get());
      set({ screen: "title", tradeModal: null, profileOpen: false });
    },

    setTab(t) { set({ tab: t }); sfx.click(); },
    setSelectedAsset(id) { set({ selectedAsset: id }); },
    openTrade(assetId, side) { set({ tradeModal: { assetId, side } }); sfx.click(); },
    closeTrade() { set({ tradeModal: null }); },

    buyAsset(assetId, qty) {
      const s = get();
      const a = s.assets[assetId];
      if (!a || qty <= 0) return;
      const cost = qty * a.price;
      const comm = cost * commissionRate(s.upgrades);
      const total = cost + comm;
      if (s.balance < total) {
        toast("error", "Недостаточно средств", `Нужно $${total.toFixed(2)}, доступно $${s.balance.toFixed(2)}`);
        sfx.error();
        return;
      }
      const pos = s.positions[assetId];
      const newQty = (pos?.qty ?? 0) + qty;
      const avg = pos ? (pos.avgPrice * pos.qty + cost) / newQty : a.price;
      const trade: Trade = {
        id: tradeSeq++, t: s.gameMinute, assetId, side: "buy", qty,
        price: a.price, total, commission: comm, pnl: null,
      };
      const cat = ASSET_MAP[assetId].category;
      const daily = s.daily;
      set({
        balance: s.balance - total,
        positions: { ...s.positions, [assetId]: { qty: newQty, avgPrice: avg } },
        trades: [trade, ...s.trades].slice(0, 200),
        stats: { ...s.stats, trades: s.stats.trades + 1 },
        daily: {
          ...daily, trades: daily.trades + 1, buys: daily.buys + 1,
          assetsBought: new Set(daily.assetsBought).add(assetId),
          categoryTrades: { ...daily.categoryTrades, [cat]: (daily.categoryTrades[cat] ?? 0) + 1 },
        },
        tradeModal: null,
      });
      sfx.buy();
      toast("success", `Куплено ${ASSET_MAP[assetId].ticker}`, `${qty} шт. по $${a.price.toFixed(2)}`);
      addXp(10);
      grantAchievement("ach_buy");
      checkCareerQuests();
      persist(get());
    },

    sellAsset(assetId, qty) {
      const s = get();
      const a = s.assets[assetId];
      const pos = s.positions[assetId];
      if (!a || !pos || qty <= 0) return;
      if (qty > pos.qty + 1e-9) {
        toast("error", "Недостаточно актива", `В портфеле только ${pos.qty}`);
        sfx.error();
        return;
      }
      const gross = qty * a.price;
      const comm = gross * commissionRate(s.upgrades);
      const proceeds = gross - comm;
      const pnl = (a.price - pos.avgPrice) * qty;
      const left = pos.qty - qty;
      const positions = { ...s.positions };
      if (left < 1e-9) delete positions[assetId];
      else positions[assetId] = { qty: left, avgPrice: pos.avgPrice };
      const trade: Trade = {
        id: tradeSeq++, t: s.gameMinute, assetId, side: "sell", qty,
        price: a.price, total: proceeds, commission: comm, pnl,
      };
      const cat = ASSET_MAP[assetId].category;
      const daily = s.daily;
      set({
        balance: s.balance + proceeds,
        positions,
        trades: [trade, ...s.trades].slice(0, 200),
        stats: {
          ...s.stats, trades: s.stats.trades + 1,
          wins: s.stats.wins + (pnl > 0 ? 1 : 0),
          losses: s.stats.losses + (pnl <= 0 ? 1 : 0),
          realizedPnl: s.stats.realizedPnl + pnl,
          bestTrade: Math.max(s.stats.bestTrade, pnl),
        },
        daily: {
          ...daily, trades: daily.trades + 1,
          profit: daily.profit + Math.max(0, pnl),
          categoryTrades: { ...daily.categoryTrades, [cat]: (daily.categoryTrades[cat] ?? 0) + 1 },
        },
        tradeModal: null,
      });
      sfx.sell();
      toast(pnl >= 0 ? "success" : "error",
        `${pnl >= 0 ? "Прибыль" : "Убыток"} $${Math.abs(pnl).toFixed(2)}`,
        `${ASSET_MAP[assetId].ticker}: продано ${qty} шт. по $${a.price.toFixed(2)}`);
      addXp(10);
      grantAchievement("ach_sell");
      if (pnl > 0) grantAchievement("ach_profit");
      checkCareerQuests();
      persist(get());
    },

    toggleFavorite(id) {
      const s = get();
      const favorites = s.favorites.includes(id) ? s.favorites.filter((f) => f !== id) : [...s.favorites, id];
      set({ favorites });
      sfx.click();
      checkCareerQuests();
      scheduleSave();
    },

    toggleCompare(id) {
      const s = get();
      let compare = s.compare.includes(id) ? s.compare.filter((c) => c !== id) : [...s.compare, id];
      if (compare.length > 3) compare = compare.slice(-3);
      set({ compare });
      sfx.click();
      scheduleSave();
    },

    clearCompare() {
      set({ compare: [] });
      sfx.click();
      scheduleSave();
    },

    depositAdd(amount) {
      const s = get();
      if (amount <= 0 || amount > s.balance) {
        toast("error", "Недостаточно средств");
        sfx.error();
        return;
      }
      set({ balance: s.balance - amount, deposit: { amount: s.deposit.amount + amount } });
      toast("success", "💰 Депозит открыт", `$${amount.toFixed(2)} под ${(depositApy(s.upgrades) * 100).toFixed(0)}% годовых`);
      sfx.money();
      scheduleSave();
    },

    depositWithdraw() {
      const s = get();
      if (s.deposit.amount <= 0) return;
      set({ balance: s.balance + s.deposit.amount, deposit: { amount: 0 } });
      toast("success", "💰 Депозит закрыт", "Все средства возвращены на баланс");
      sfx.money();
      scheduleSave();
    },

    loanTake(amount) {
      const s = get();
      const eq = equityOf(s);
      const limit = loanLimit(s.level, eq, s.upgrades);
      const current = s.loan.principal + s.loan.interest;
      if (amount <= 0 || current + amount > limit) {
        toast("error", "Превышен лимит кредита", `Доступно $${Math.max(0, limit - current).toFixed(0)}`);
        sfx.error();
        return;
      }
      hadLoan = true;
      set({
        balance: s.balance + amount,
        loan: { principal: s.loan.principal + amount, interest: s.loan.interest },
      });
      toast("info", "🏦 Кредит получен", `$${amount.toFixed(0)} под 14% годовых. Проценты начисляются ежедневно.`);
      sfx.money();
      scheduleSave();
    },

    loanRepay(amount) {
      const s = get();
      const debt = s.loan.principal + s.loan.interest;
      const pay = Math.min(amount, debt, s.balance);
      if (pay <= 0) {
        toast("error", "Нечем платить", debt > 0 ? "На балансе нет средств для погашения" : "Кредита нет");
        sfx.error();
        return;
      }
      let interest = s.loan.interest;
      let principal = s.loan.principal;
      const fromInterest = Math.min(pay, interest);
      interest -= fromInterest;
      principal -= (pay - fromInterest);
      set({ balance: s.balance - pay, loan: { principal, interest } });
      toast("success", "🏦 Погашение", `Выплачено $${pay.toFixed(2)}${debt - pay < 0.01 ? " — кредит закрыт" : ""}`);
      sfx.money();
      checkAchievements();
      scheduleSave();
    },

    buyUpgrade(id) {
      const s = get();
      const def = UPGRADES.find((u) => u.id === id);
      if (!def || s.upgrades.includes(id)) return;
      if (s.level < def.minLevel) {
        toast("error", "Требуется уровень " + def.minLevel);
        sfx.error();
        return;
      }
      if (s.balance < def.price) {
        toast("error", "Недостаточно средств", `Нужно $${def.price}`);
        sfx.error();
        return;
      }
      set({ balance: s.balance - def.price, upgrades: [...s.upgrades, id] });
      toast("success", "🛠️ Улучшение куплено", def.title);
      sfx.achievement();
      scheduleSave();
    },

    setMuted(m) {
      set({ muted: m });
      setAudioMuted(m);
      scheduleSave();
    },

    setName(n) {
      set({ playerName: n.slice(0, 24) || "Трейдер" });
      scheduleSave();
    },

    setProfileOpen(o) { set({ profileOpen: o }); },
    setTickerPause(p) { set({ tickerPause: p }); },

    dismissToast(id) {
      set((st) => ({ toasts: st.toasts.filter((t) => t.id !== id) }));
    },

    restartMode() {
      const mode = get().mode;
      if (!mode) return;
      try { localStorage.removeItem(SAVE_PREFIX + mode); } catch { /* ignore */ }
      get().startNewGame(mode);
    },
  };
});

window.addEventListener("beforeunload", () => {
  internalPersist();
});

export function equity(state: GameStore): number {
  let pos = 0;
  for (const id in state.positions) {
    const a = state.assets[id];
    if (a) pos += state.positions[id].qty * a.price;
  }
  return state.balance + state.deposit.amount - state.loan.principal - state.loan.interest + pos;
}

export { hasSave };
