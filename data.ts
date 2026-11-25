/**
 * data.ts — весь игровой контент: активы, новости, задания, достижения, уровни, улучшения.
 */
import type { AssetDef, Category, Mode, NewsCategory } from "./types";

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: "stocks", label: "Акции" },
  { id: "crypto", label: "Криптовалюты" },
  { id: "metals", label: "Драгметаллы" },
  { id: "forex", label: "Валюты" },
];

export const ASSETS: AssetDef[] = [
  // ---------- АКЦИИ ----------
  { id: "aapl", ticker: "AAPL", name: "Apple", category: "stocks", price: 232, vol: 0.0016, drift: 0.000004, beta: 1.0, volume: 52_000_000, dividendYield: 0.005, color: "#c8c8d2", description: "Технологический гигант: iPhone, Mac, сервисы. Крупнейшая компания мира по капитализации." },
  { id: "msft", ticker: "MSFT", name: "Microsoft", category: "stocks", price: 428, vol: 0.0015, drift: 0.000005, beta: 0.9, volume: 22_000_000, dividendYield: 0.007, color: "#7dd3fc", description: "Программное обеспечение, облако Azure и искусственный интеллект." },
  { id: "nvda", ticker: "NVDA", name: "NVIDIA", category: "stocks", price: 138, vol: 0.0032, drift: 0.00002, beta: 1.5, volume: 250_000_000, dividendYield: 0.0003, color: "#a3e635", description: "Лидер рынка графических процессоров и чипов для ИИ. Самая волатильная из «большой десятки»." },
  { id: "tsla", ticker: "TSLA", name: "Tesla", category: "stocks", price: 342, vol: 0.0038, drift: 0.000008, beta: 1.6, volume: 98_000_000, dividendYield: 0, color: "#f87171", description: "Электромобили и автопилот. Любимица розничных инвесторов, резкие движения обычное дело." },
  { id: "amzn", ticker: "AMZN", name: "Amazon", category: "stocks", price: 205, vol: 0.0018, drift: 0.000006, beta: 1.1, volume: 38_000_000, dividendYield: 0, color: "#fbbf24", description: "Электронная коммерция, облако AWS и логистика." },
  { id: "googl", ticker: "GOOGL", name: "Google (Alphabet)", category: "stocks", price: 175, vol: 0.0017, drift: 0.000005, beta: 1.0, volume: 26_000_000, dividendYield: 0.0045, color: "#60a5fa", description: "Поиск, реклама и Android. Платит дивиденды с 2024 года." },
  { id: "meta", ticker: "META", name: "Meta Platforms", category: "stocks", price: 585, vol: 0.0022, drift: 0.000007, beta: 1.2, volume: 12_000_000, dividendYield: 0.0035, color: "#818cf8", description: "Facebook, Instagram и ставка на метавселенную. Волатильна на фоне новостей о ИИ." },
  { id: "nflx", ticker: "NFLX", name: "Netflix", category: "stocks", price: 900, vol: 0.002, drift: 0.000006, beta: 0.9, volume: 3_000_000, dividendYield: 0, color: "#ef4444", description: "Мировой лидер стриминга. Дорогая акция с умеренным объёмом." },
  { id: "ko", ticker: "KO", name: "Coca-Cola", category: "stocks", price: 63, vol: 0.0009, drift: 0.000002, beta: 0.5, volume: 14_000_000, dividendYield: 0.028, description: "Защитная акция, стабильные дивиденды. Классика консервативного портфеля.", color: "#f87171" },
  { id: "mcd", ticker: "MCD", name: "McDonald's", category: "stocks", price: 295, vol: 0.001, drift: 0.000002, beta: 0.5, volume: 4_000_000, dividendYield: 0.022, description: "Сеть быстрого питания с дивидендной историей более 40 лет.", color: "#facc15" },

  // ---------- КРИПТОВАЛЮТЫ ----------
  { id: "btc", ticker: "BTC", name: "Bitcoin", category: "crypto", price: 97_000, vol: 0.0042, drift: 0.000012, beta: 1.3, volume: 31_000_000_000, dividendYield: 0, color: "#f7931a", description: "Первая и крупнейшая криптовалюта. Цифровое золото с высокой волатильностью." },
  { id: "eth", ticker: "ETH", name: "Ethereum", category: "crypto", price: 3_400, vol: 0.005, drift: 0.00001, beta: 1.4, volume: 16_000_000_000, dividendYield: 0, color: "#a78bfa", description: "Платформа смарт-контрактов, основа DeFi и NFT." },
  { id: "sol", ticker: "SOL", name: "Solana", category: "crypto", price: 215, vol: 0.0065, drift: 0.000008, beta: 1.8, volume: 5_000_000_000, dividendYield: 0, color: "#34d399", description: "Быстрый блокчейн, любимец разработчиков. Очень волатильна." },
  { id: "xrp", ticker: "XRP", name: "XRP", category: "crypto", price: 2.4, vol: 0.0058, drift: 0.000002, beta: 1.7, volume: 4_000_000_000, dividendYield: 0, color: "#94a3b8", description: "Токен для банковских переводов. Резко реагирует на новости о регулировании." },
  { id: "doge", ticker: "DOGE", name: "Dogecoin", category: "crypto", price: 0.32, vol: 0.009, drift: 0.000004, beta: 2.2, volume: 2_500_000_000, dividendYield: 0, color: "#fbbf24", description: "Мем-криптовалюта. Движения носят спекулятивный характер." },
  { id: "ltc", ticker: "LTC", name: "Litecoin", category: "crypto", price: 105, vol: 0.005, drift: 0.0, beta: 1.5, volume: 900_000_000, dividendYield: 0, color: "#cbd5e1", description: "«Цифровое серебро», один из старейших альткоинов." },
  { id: "ada", ticker: "ADA", name: "Cardano", category: "crypto", price: 1.0, vol: 0.006, drift: 0.000001, beta: 1.7, volume: 800_000_000, dividendYield: 0, color: "#60a5fa", description: "Блокчейн с академическим подходом к разработке." },

  // ---------- ДРАГМЕТАЛЛЫ ----------
  { id: "xau", ticker: "XAU/USD", name: "Золото", category: "metals", price: 2_650, vol: 0.0008, drift: 0.000003, beta: 0.2, volume: 180_000, dividendYield: 0, color: "#fbbf24", description: "Традиционное защитное актив. Растёт в кризисы и при слабом долларе." },
  { id: "xag", ticker: "XAG/USD", name: "Серебро", category: "metals", price: 31, vol: 0.0014, drift: 0.000002, beta: 0.4, volume: 90_000, dividendYield: 0, color: "#e2e8f0", description: "Дешевле золота, волатильнее. Промышленный спрос + монетарный." },
  { id: "xpt", ticker: "XPT/USD", name: "Платина", category: "metals", price: 980, vol: 0.0016, drift: 0.000001, beta: 0.4, volume: 30_000, dividendYield: 0, color: "#c4b5fd", description: "Редкий металл, спрос из автопрома. Узкий рынок, резкие скачки." },

  // ---------- ВАЛЮТЫ ----------
  { id: "eurusd", ticker: "EUR/USD", name: "Евро / Доллар", category: "forex", price: 1.05, vol: 0.0004, drift: 0.0, beta: 0.1, volume: 900_000_000_000, dividendYield: 0, color: "#3b82f6", description: "Самая ликвидная валютная пара мира. Спокойное движение." },
  { id: "gbpusd", ticker: "GBP/USD", name: "Фунт / Доллар", category: "forex", price: 1.27, vol: 0.00045, drift: 0.0, beta: 0.15, volume: 250_000_000_000, dividendYield: 0, color: "#a855f7", description: "«Кабель». Чувствителен к решениям Банка Англии." },
  { id: "usdjpy", ticker: "USD/JPY", name: "Доллар / Иена", category: "forex", price: 155, vol: 0.0005, drift: 0.0, beta: 0.15, volume: 400_000_000_000, dividendYield: 0, color: "#f472b6", description: "Зависит от разницы ставок ФРС и Банка Японии." },
];

export const ASSET_MAP: Record<string, AssetDef> = Object.fromEntries(ASSETS.map((a) => [a.id, a]));

export const COMMISSION_RATE = 0.001; // 0.1%
export const DEPOSIT_APY = 0.06; // 6% годовых
export const LOAN_APY = 0.14; // 14% годовых
export const DIVIDEND_PERIOD_DAYS = 10; // игровых дней между выплатами
export const MINUTES_CAP = 3000;
export const SEED_DAYS = 400;

// ---------- НОВОСТНЫЕ ШАБЛОНЫ ----------
export interface NewsTemplate {
  text: string;
  cat: NewsCategory;
  sentiment: number; // -3..3
  scope: "all" | "category" | "asset";
  target?: string; // assetId или category
  dur: number; // тиков действия эффекта
}

const tech = "stocks";
const cry = "crypto";
const met = "metals";
const frx = "forex";

export const NEWS_TEMPLATES: NewsTemplate[] = [
  { text: "NVIDIA объявила о прорыве в чипах для ИИ нового поколения", cat: "tech", sentiment: 3, scope: "asset", target: "nvda", dur: 160 },
  { text: "Apple представила рекордно дорогую линейку iPhone", cat: "tech", sentiment: 2, scope: "asset", target: "aapl", dur: 120 },
  { text: "Tesla показала новую модель: предзаказы побили рекорды", cat: "tech", sentiment: 2, scope: "asset", target: "tsla", dur: 140 },
  { text: "Microsoft подписала крупнейший в истории контракт на облачные сервисы", cat: "tech", sentiment: 2, scope: "asset", target: "msft", dur: 130 },
  { text: "Amazon отчиталась о рекордной прибыли квартала", cat: "tech", sentiment: 2, scope: "asset", target: "amzn", dur: 110 },
  { text: "Google проиграл антимонопольный иск — риск разделения компании", cat: "tech", sentiment: -3, scope: "asset", target: "googl", dur: 150 },
  { text: "Meta удвоила инвестиции в ИИ, инвесторы обеспокоены расходами", cat: "tech", sentiment: -2, scope: "asset", target: "meta", dur: 120 },
  { text: "Netflix потерял миллион подписчиков в квартале", cat: "tech", sentiment: -2, scope: "asset", target: "nflx", dur: 120 },
  { text: "Технологический сектор переживает коррекцию после перегрева", cat: "tech", sentiment: -2, scope: "category", target: tech, dur: 180 },
  { text: "Большая десятка техногигантов бьёт рекорды капитализации", cat: "tech", sentiment: 2, scope: "category", target: tech, dur: 160 },
  { text: "Bitcoin резко вырос на фоне притока институциональных денег", cat: "crypto", sentiment: 3, scope: "asset", target: "btc", dur: 150 },
  { text: "Крупнейший банк разрешил клиентам торговать Bitcoin", cat: "crypto", sentiment: 2, scope: "category", target: cry, dur: 140 },
  { text: "Ethereum обновил сеть: комиссии упали вдвое", cat: "crypto", sentiment: 2, scope: "asset", target: "eth", dur: 130 },
  { text: "Регулятор запустил расследование крупной криптобиржи", cat: "crypto", sentiment: -3, scope: "category", target: cry, dur: 150 },
  { text: "Хакеры вывели сотни миллионов из DeFi-протокола", cat: "crypto", sentiment: -2, scope: "category", target: cry, dur: 120 },
  { text: "Solana установила рекорд по числу транзакций в секунду", cat: "crypto", sentiment: 2, scope: "asset", target: "sol", dur: 110 },
  { text: "Dogecoin взлетел после очередного твита известного миллиардера", cat: "crypto", sentiment: 2, scope: "asset", target: "doge", dur: 80 },
  { text: "Крупные инвесторы начали активно скупать золото", cat: "metals", sentiment: 2, scope: "asset", target: "xau", dur: 160 },
  { text: "Центробанки мира увеличили закупки золота до рекорда", cat: "metals", sentiment: 2, scope: "asset", target: "xau", dur: 150 },
  { text: "Промышленный спрос на серебро превысил предложение", cat: "metals", sentiment: 2, scope: "asset", target: "xag", dur: 130 },
  { text: "Дефицит платины на мировом рынке достиг многолетнего максимума", cat: "metals", sentiment: 2, scope: "asset", target: "xpt", dur: 130 },
  { text: "Добыча металлов восстановилась, давление на цены сохраняется", cat: "metals", sentiment: -1, scope: "category", target: met, dur: 120 },
  { text: "ФРС изменила процентную ставку: доллар укрепился", cat: "macro", sentiment: 1, scope: "asset", target: "usdjpy", dur: 140 },
  { text: "ФРС снизила ставку ниже ожиданий рынка", cat: "macro", sentiment: -2, scope: "category", target: frx, dur: 130 },
  { text: "Евросоюз опубликовал слабые данные по ВВП", cat: "macro", sentiment: -1, scope: "asset", target: "eurusd", dur: 120 },
  { text: "Банк Англии пошёл на неожиданное ужесточение политики", cat: "macro", sentiment: 2, scope: "asset", target: "gbpusd", dur: 130 },
  { text: "Инфляция в США оказалась ниже прогнозов", cat: "macro", sentiment: 2, scope: "all", dur: 150 },
  { text: "Инфляция в США бьёт рекорды, рынки в панике", cat: "macro", sentiment: -3, scope: "all", dur: 150 },
  { text: "На мировом рынке началась паника: инвесторы бегут в наличные", cat: "macro", sentiment: -3, scope: "all", dur: 140 },
  { text: "Экономика США показала лучший рост за десятилетие", cat: "macro", sentiment: 2, scope: "all", dur: 150 },
  { text: "Мировые рынки растут на фоне мирных переговоров", cat: "macro", sentiment: 2, scope: "all", dur: 130 },
  { text: "Кризис ликвидности: биржи фиксируют аномальные объёмы продаж", cat: "macro", sentiment: -2, scope: "all", dur: 130 },
  { text: "Coca-Cola увеличила дивиденды 62-й год подряд", cat: "company", sentiment: 2, scope: "asset", target: "ko", dur: 100 },
  { text: "McDonald's открыл рекордное число новых ресторанов", cat: "company", sentiment: 2, scope: "asset", target: "mcd", dur: 100 },
  { text: "NVIDIA под вопросом: клиенты откладывают заказы на чипы", cat: "company", sentiment: -3, scope: "asset", target: "nvda", dur: 150 },
  { text: "Tesla отзывает партию автомобилей из-за ПО", cat: "company", sentiment: -2, scope: "asset", target: "tsla", dur: 110 },
  { text: "Apple готовит секретный продукт новой категории", cat: "company", sentiment: 2, scope: "asset", target: "aapl", dur: 120 },
];

// ---------- ЭКОНОМИЧЕСКИЙ КАЛЕНДАРЬ ----------
export interface CalendarTemplate {
  title: string;
  kind: "macro" | "earnings";
  assetId: string | null;
  sentiment: number;
  scope: "all" | "asset";
  impact: "low" | "medium" | "high";
}

export const CALENDAR_TEMPLATES: CalendarTemplate[] = [
  { title: "Решение ФРС по процентной ставке", kind: "macro", assetId: null, sentiment: 0, scope: "all", impact: "high" },
  { title: "Публикация индекса потребительских цен (CPI)", kind: "macro", assetId: null, sentiment: 0, scope: "all", impact: "high" },
  { title: "Отчёт по рынку труда США", kind: "macro", assetId: null, sentiment: 0, scope: "all", impact: "medium" },
  { title: "Решение ЕЦБ по ставке", kind: "macro", assetId: null, sentiment: 0, scope: "all", impact: "medium" },
  { title: "ВВП Китая за квартал", kind: "macro", assetId: null, sentiment: 0, scope: "all", impact: "medium" },
  { title: "Отчётность Apple", kind: "earnings", assetId: "aapl", sentiment: 0, scope: "asset", impact: "high" },
  { title: "Отчётность NVIDIA", kind: "earnings", assetId: "nvda", sentiment: 0, scope: "asset", impact: "high" },
  { title: "Отчётность Tesla", kind: "earnings", assetId: "tsla", sentiment: 0, scope: "asset", impact: "medium" },
  { title: "Отчётность Microsoft", kind: "earnings", assetId: "msft", sentiment: 0, scope: "asset", impact: "medium" },
  { title: "Отчётность Amazon", kind: "earnings", assetId: "amzn", sentiment: 0, scope: "asset", impact: "medium" },
];

// ---------- УРОВНИ ----------
export interface LevelDef {
  level: number;
  title: string;
  xp: number; // порог для достижения уровня
  unlocks: string[];
}

export const LEVELS: LevelDef[] = [
  { level: 1, title: "Новичок", xp: 0, unlocks: [] },
  { level: 2, title: "Начинающий инвестор", xp: 100, unlocks: ["Депозиты в банке", "Магазин улучшений"] },
  { level: 3, title: "Трейдер", xp: 300, unlocks: ["Игровые кредиты"] },
  { level: 4, title: "Опытный трейдер", xp: 700, unlocks: ["Сравнение активов"] },
  { level: 5, title: "Профессионал", xp: 1500, unlocks: ["Повышенные лимиты кредита"] },
  { level: 6, title: "Управляющий фондом", xp: 3000, unlocks: [] },
  { level: 7, title: "Миллионер", xp: 6000, unlocks: [] },
  { level: 8, title: "Легенда Уолл-стрит", xp: 12000, unlocks: [] },
];

// ---------- КАРЬЕРНЫЕ ЗАДАНИЯ ----------
export interface QuestDef {
  id: string;
  title: string;
  desc: string;
  reward: number;
  xp: number;
  target: number;
}

export const CAREER_QUESTS: QuestDef[] = [
  { id: "q_first", title: "Первый шаг", desc: "Совершите первую сделку", reward: 100, xp: 25, target: 1 },
  { id: "q_profit100", title: "Первая сотня", desc: "Получите прибыль $100 от продажи актива", reward: 200, xp: 40, target: 100 },
  { id: "q_three", title: "Диверсификация", desc: "Владейте тремя разными активами одновременно", reward: 300, xp: 50, target: 3 },
  { id: "q_20k", title: "Капитал $20 000", desc: "Достигните общего капитала $20 000", reward: 500, xp: 80, target: 20_000 },
  { id: "q_wins5", title: "Серия побед", desc: "Проведите 5 прибыльных сделок", reward: 400, xp: 60, target: 5 },
  { id: "q_trades25", title: "Волчок с Уолл-стрит", desc: "Совершите 25 сделок", reward: 600, xp: 80, target: 25 },
  { id: "q_dividend", title: "Дивидендный доход", desc: "Получите первые дивиденды", reward: 250, xp: 40, target: 1 },
  { id: "q_fav5", title: "Наблюдатель", desc: "Добавьте 5 активов в избранное", reward: 150, xp: 30, target: 5 },
  { id: "q_100k", title: "Шестизначная сумма", desc: "Достигните капитала $100 000", reward: 2000, xp: 200, target: 100_000 },
  { id: "q_crisis", title: "Стальные нервы", desc: "Продержитесь через рыночный кризис, не продавая всё в панике", reward: 800, xp: 120, target: 1 },
];

// ---------- ЕЖЕДНЕВНЫЕ ЗАДАНИЯ (выборка из пула) ----------
export interface DailyCounters {
  trades: number;
  buys: number;
  profit: number;
  assetsBought: Set<string>;
  categoryTrades: Partial<Record<Category, number>>;
}

export interface DailyQuestDef extends QuestDef {
  category?: Category; // если задано — считаем сделки только этой категории
  onlyBuys?: boolean;
  uniqueAssets?: boolean;
}

function countFrom(def: DailyQuestDef, c: DailyCounters): number {
  let n = def.onlyBuys ? c.buys : def.category ? (c.categoryTrades[def.category] ?? 0) : c.trades;
  if (def.uniqueAssets) n = c.assetsBought.size;
  return n;
}

export function dailyProgress(def: DailyQuestDef, c: DailyCounters): number {
  if (def.id === "d_profit200") return Math.floor(c.profit);
  return countFrom(def, c);
}

export const DAILY_QUEST_POOL: DailyQuestDef[] = [
  { id: "d_trades3", title: "Активный день", desc: "Совершите 3 сделки за игровой день", reward: 150, xp: 20, target: 3 },
  { id: "d_profit200", title: "В плюсе", desc: "Заработайте $200 за игровой день", reward: 250, xp: 30, target: 200 },
  { id: "d_buy2", title: "Покупатель", desc: "Купите 2 разных актива за день", reward: 150, xp: 20, target: 2, uniqueAssets: true, onlyBuys: true },
  { id: "d_crypto", title: "Крипто-интерес", desc: "Совершите сделку с криптовалютой", reward: 100, xp: 15, target: 1, category: "crypto" },
  { id: "d_stocks", title: "Акционер", desc: "Совершите сделку с акцией", reward: 100, xp: 15, target: 1, category: "stocks" },
  { id: "d_noSell", title: "Стратег", desc: "Совершите 5 покупок за день", reward: 200, xp: 25, target: 5, onlyBuys: true },
];

// ---------- ДОСТИЖЕНИЯ ----------
export interface AchievementDef {
  id: string;
  title: string;
  desc: string;
  icon: string; // emoji
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "ach_buy", title: "Первая покупка", desc: "Купите первый актив", icon: "🛒" },
  { id: "ach_sell", title: "Первая продажа", desc: "Продайте актив из портфеля", icon: "💵" },
  { id: "ach_profit", title: "Первая прибыль", desc: "Закройте сделку с прибылью", icon: "📈" },
  { id: "ach_profit10k", title: "Мастер прибыли", desc: "Заработайте $10 000 суммарной прибыли", icon: "💰" },
  { id: "ach_million", title: "Первый миллион", desc: "Достигните капитала $1 000 000", icon: "🏆" },
  { id: "ach_ten", title: "Коллекционер", desc: "Держите 10 разных активов в портфеле", icon: "🗂️" },
  { id: "ach_100trades", title: "Высокочастотник", desc: "Совершите 100 сделок", icon: "⚡" },
  { id: "ach_crisis", title: "Пережил кризис", desc: "Переживите рыночный кризис", icon: "🌪️" },
  { id: "ach_level5", title: "Профи", desc: "Достигните 5 уровня", icon: "🎓" },
  { id: "ach_dividend", title: "Дивидендный аристократ", desc: "Получите дивиденды от 3 разных компаний", icon: "👑" },
  { id: "ach_loan", title: "Левередж", desc: "Возьмите игровой кредит и верните его", icon: "🏦" },
  { id: "ach_deposit", title: "Сберегатель", desc: "Положите деньги на депозит и заработайте проценты", icon: "🐖" },
];

// ---------- УЛУЧШЕНИЯ (МАГАЗИН) ----------
export interface UpgradeDef {
  id: string;
  title: string;
  desc: string;
  price: number;
  minLevel: number;
}

export const UPGRADES: UpgradeDef[] = [
  { id: "u_comm", title: "VIP-брокер", desc: "Комиссия на сделки снижена вдвое (0.05%)", price: 5_000, minLevel: 2 },
  { id: "u_xp", title: "Ментор", desc: "+50% к получаемому опыту", price: 8_000, minLevel: 2 },
  { id: "u_dep", title: "Премиальный депозит", desc: "Ставка по депозиту выше на 4% (итого 10% годовых)", price: 12_000, minLevel: 3 },
  { id: "u_loan", title: "Кредитная линия", desc: "Максимальный кредит увеличен вдвое", price: 20_000, minLevel: 3 },
];

export function commissionRate(upgrades: string[]): number {
  return upgrades.includes("u_comm") ? COMMISSION_RATE / 2 : COMMISSION_RATE;
}

export function xpMultiplier(upgrades: string[]): number {
  return upgrades.includes("u_xp") ? 1.5 : 1;
}

export function depositApy(upgrades: string[]): number {
  return upgrades.includes("u_dep") ? DEPOSIT_APY + 0.04 : DEPOSIT_APY;
}

export function loanLimit(level: number, equity: number, upgrades: string[]): number {
  const base = Math.max(10_000, equity * 0.5);
  const mult = upgrades.includes("u_loan") ? 2 : 1;
  const lvlBonus = 1 + Math.max(0, level - 3) * 0.25;
  return base * mult * lvlBonus;
}

// ---------- РЕЖИМЫ ----------
export interface ModeDef {
  id: Mode;
  title: string;
  subtitle: string;
  startBalance: number;
  icon: string;
}

export const MODES: ModeDef[] = [
  { id: "career", title: "КАРЬЕРА", subtitle: "Начните с $10 000 и постройте финансовую империю", startBalance: 10_000, icon: "📊" },
  { id: "sandbox", title: "ПЕСОЧНИЦА", subtitle: "$1 000 000 виртуальных денег. Экспериментируйте без ограничений", startBalance: 1_000_000, icon: "🏖️" },
  { id: "survival", title: "ВЫЖИВАНИЕ", subtitle: "Всего $1 000. Продержитесь на рынке как можно дольше", startBalance: 1_000, icon: "🔥" },
];

export function impactLabel(i: "low" | "medium" | "high"): string {
  return i === "low" ? "Низкое" : i === "medium" ? "Среднее" : "Высокое";
}

export function sentimentImpact(s: number): "low" | "medium" | "high" {
  const a = Math.abs(s);
  return a <= 1 ? "low" : a <= 2 ? "medium" : "high";
}
