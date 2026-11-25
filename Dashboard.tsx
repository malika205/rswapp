/**
 * Dashboard.tsx — главный экран: баланс, статистика, график капитала, обзор рынка, новости, сделки.
 */
import { ASSET_MAP, CATEGORIES } from "@/game/data";
import { gameDate, newsTimeLabel } from "@/game/engine";
import { equity, useGame } from "@/game/store";
import { fmtCompact, fmtMoney, fmtPct, fmtPrice } from "@/game/utils";
import AssetIcon from "./AssetIcon";
import { ResultButton, tradeResult } from "./ResultScreen";
import { LineChart } from "./MiniCharts";

const REGIME_LABEL: Record<string, { label: string; cls: string }> = {
  calm: { label: "Спокойный рынок", cls: "neutral" },
  bull: { label: "Бычий рынок ▲", cls: "up" },
  bear: { label: "Медвежий рынок ▼", cls: "down" },
  crisis: { label: "⚠ РЫНОЧНЫЙ КРИЗИС", cls: "crisis" },
};

export default function Dashboard() {
  const s = useGame();
  const eq = equity(s);
  const dayPnl = eq - s.dayStartEquity;
  const startBalance = s.mode === "sandbox" ? 1_000_000 : s.mode === "survival" ? 1_000 : 10_000;
  const totalPnl = eq - startBalance;
  const posValue = eq - s.balance - s.deposit.amount + s.loan.principal + s.loan.interest;

  const movers = Object.values(s.assets)
    .map((a) => ({ a, chg: (a.price - a.openDayPrice) / a.openDayPrice }))
    .sort((x, y) => Math.abs(y.chg) - Math.abs(x.chg))
    .slice(0, 6);

  const regime = REGIME_LABEL[s.engine.regime] ?? REGIME_LABEL.calm;

  return (
    <div className="dash">
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-label">Баланс</div>
          <div className="stat-value">{fmtMoney(s.balance)}</div>
          {s.deposit.amount > 0 && <div className="stat-sub">+ {fmtMoney(s.deposit.amount)} на депозите</div>}
          {(s.loan.principal + s.loan.interest) > 0 && <div className="stat-sub down">− {fmtMoney(s.loan.principal + s.loan.interest)} долг</div>}
        </div>
        <div className="stat-card">
          <div className="stat-label">Портфель</div>
          <div className="stat-value">{fmtMoney(posValue)}</div>
          <div className="stat-sub">{Object.keys(s.positions).length} позиций</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Прибыль за день</div>
          <div className={`stat-value ${dayPnl >= 0 ? "up" : "down"}`}>{fmtMoney(dayPnl, true)}</div>
          <div className="stat-sub">{gameDate(s.gameMinute).date}</div>
          <ResultButton result={{title: "Изменение капитала за день",amount:dayPnl,base:s.dayStartEquity,detail:"Включает все изменения капитала, не только сделки"}}/>
        </div>
        <div className="stat-card">
          <div className="stat-label">Всего P&amp;L</div>
          <div className={`stat-value ${totalPnl >= 0 ? "up" : "down"}`}>{fmtMoney(totalPnl, true)}</div>
          <div className="stat-sub">от стартового капитала {fmtMoney(startBalance)}</div>
          <ResultButton result={{title: "Изменение капитала за всё время",amount:totalPnl,base:startBalance,detail:"Включает награды, проценты и другие изменения капитала"}}/>
        </div>
        <div className="stat-card">
          <div className="stat-label">Режим рынка</div>
          <div className={`stat-value regime ${regime.cls}`}>{regime.label}</div>
          <div className="stat-sub">капитал {fmtMoney(eq)}</div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="panel">
          <div className="panel-head">
            <span>График капитала</span>
            <span className={`badge ${totalPnl >= 0 ? "up-bg" : "down-bg"}`}>{fmtPct(totalPnl / startBalance)} за всё время</span>
          </div>
          <LineChart data={s.equityHistory} />
        </div>

        <div className="panel">
          <div className="panel-head">
            <span>🔥 Активность рынка</span>
            <button className="link-btn" onClick={() => s.setTab("trading")}>Вся биржа →</button>
          </div>
          <div className="movers">
            {movers.map(({ a, chg }) => {
              const def = ASSET_MAP[a.id];
              return (
                <button key={a.id} className="mover-row" onClick={() => { s.setTab("trading"); s.setSelectedAsset(a.id); }}>
                  <span className="mover-ticker asset-with-icon" style={{ color: def.color }}><AssetIcon id={a.id} size={24}/>{def.ticker}</span>
                  <span className="mover-name">{def.name}</span>
                  <span className="mover-price">{fmtPrice(a.price)}</span>
                  <span className={chg >= 0 ? "up" : "down"}>{fmtPct(chg)}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <span>📰 Последние новости</span>
            <button className="link-btn" onClick={() => s.setTab("news")}>Все →</button>
          </div>
          <div className="news-mini">
            {s.news.slice(0, 4).map((n) => (
              <div key={n.id} className="news-mini-row">
                <span className={`news-dot ${n.sentiment > 0 ? "up-bg" : n.sentiment < 0 ? "down-bg" : ""}`} />
                <span className="news-mini-title">{n.title}</span>
                <span className="news-mini-time">{newsTimeLabel(n.t, s.gameMinute)}</span>
              </div>
            ))}
            {s.news.length === 0 && <div className="empty">Новостей пока нет</div>}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <span>🕘 Последние сделки</span>
            <button className="link-btn" onClick={() => s.setTab("portfolio")}>Портфель →</button>
          </div>
          <div className="trades-mini">
            {s.trades.slice(0, 6).map((t) => {
              const def = ASSET_MAP[t.assetId];
              return (
                <div key={t.id} className="trade-row">
                  <span className={t.side === "buy" ? "side buy" : "side sell"}>{t.side === "buy" ? "ПОКУПКА" : "ПРОДАЖА"}</span>
                  <span className="trade-ticker asset-with-icon" style={{ color: def.color }}><AssetIcon id={t.assetId} size={22}/>{def.ticker}</span>
                  <span className="trade-qty">{t.qty >= 1 ? t.qty.toFixed(2) : t.qty.toFixed(4)}</span>
                  <span className="trade-total">{fmtMoney(t.total)}</span>
                  {t.pnl !== null && <><span className={tradeResult(t).amount >= 0 ? "up" : "down"}>{fmtMoney(tradeResult(t).amount, true)}</span><ResultButton result={tradeResult(t)} label="Отчёт"/></>}
                </div>
              );
            })}
            {s.trades.length === 0 && <div className="empty">Сделок пока не было. Откройте биржу и купите первый актив!</div>}
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <button className="qa-btn primary" onClick={() => s.setTab("trading")}>📊 Торговать</button>
        <button className="qa-btn" onClick={() => s.setTab("portfolio")}>💼 Портфель</button>
        <button className="qa-btn" onClick={() => s.setTab("bank")}>🛒 Магазин и улучшения</button>
        <button className="qa-btn" onClick={() => s.setProfileOpen(true)}>👤 Профиль</button>
      </div>
      <div className="cat-strip">
        {CATEGORIES.map((c) => (
          <button key={c.id} className="cat-chip" onClick={() => { s.setTab("trading"); }}>{c.label}</button>
        ))}
      </div>
    </div>
  );
}
