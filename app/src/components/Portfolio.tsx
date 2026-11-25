/**
 * Portfolio.tsx — портфель: позиции, P&L, распределение капитала.
 */
import { ASSET_MAP, CATEGORIES } from "@/game/data";
import { useGame } from "@/game/store";
import { fmtMoney, fmtPct, fmtPrice } from "@/game/utils";
import { DonutChart, positionSlices } from "./MiniCharts";

export default function Portfolio() {
  const s = useGame();
  const ids = Object.keys(s.positions);
  const posValue = ids.reduce((sum, id) => sum + (s.assets[id] ? s.positions[id].qty * s.assets[id].price : 0), 0);
  const costBasis = ids.reduce((sum, id) => sum + s.positions[id].qty * s.positions[id].avgPrice, 0);
  const unreal = posValue - costBasis;
  const cash = s.balance;

  return (
    <div className="portfolio">
      <div className="stat-cards three">
        <div className="stat-card">
          <div className="stat-label">Стоимость активов</div>
          <div className="stat-value">{fmtMoney(posValue)}</div>
          <div className="stat-sub">{ids.length} позиций</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Нереализованный P&amp;L</div>
          <div className={`stat-value ${unreal >= 0 ? "up" : "down"}`}>{fmtMoney(unreal, true)}</div>
          <div className="stat-sub">{fmtPct(costBasis > 0 ? unreal / costBasis : 0)} к цене покупки</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Свободные средства</div>
          <div className="stat-value">{fmtMoney(cash)}</div>
          <div className="stat-sub">реализованный P&amp;L: {fmtMoney(s.stats.realizedPnl, true)}</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><span>💼 Позиции</span></div>
        {ids.length === 0 ? (
          <div className="empty">
            Портфель пуст. Перейдите на биржу и купите первый актив — например, акцию Apple или немного Bitcoin.
            <div style={{ marginTop: 12 }}>
              <button className="btn primary" onClick={() => s.setTab("trading")}>Открыть биржу</button>
            </div>
          </div>
        ) : (
          <div className="pos-table-wrap">
            <table className="pos-table">
              <thead>
                <tr>
                  <th>Актив</th><th>Категория</th><th>Кол-во</th><th>Ср. цена</th><th>Тек. цена</th>
                  <th>Стоимость</th><th>P&amp;L</th><th>Доходность</th><th></th>
                </tr>
              </thead>
              <tbody>
                {ids.map((id) => {
                  const p = s.positions[id];
                  const a = s.assets[id];
                  if (!a) return null;
                  const def = ASSET_MAP[id];
                  const value = p.qty * a.price;
                  const pnl = (a.price - p.avgPrice) * p.qty;
                  const pct = p.avgPrice > 0 ? (a.price - p.avgPrice) / p.avgPrice : 0;
                  return (
                    <tr key={id}>
                      <td><span className="asset-ticker" style={{ color: def.color }}>{def.ticker}</span> {def.name}</td>
                      <td>{CATEGORIES.find((c) => c.id === def.category)?.label}</td>
                      <td>{p.qty.toFixed(4)}</td>
                      <td>{fmtPrice(p.avgPrice)}</td>
                      <td>{fmtPrice(a.price)}</td>
                      <td>{fmtMoney(value)}</td>
                      <td className={pnl >= 0 ? "up" : "down"}>{fmtMoney(pnl, true)}</td>
                      <td className={pnl >= 0 ? "up" : "down"}>{fmtPct(pct)}</td>
                      <td>
                        <button className="sell-btn sm" onClick={() => s.openTrade(id, "sell")}>Продать</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="panel">
        <div className="panel-head"><span>🍰 Распределение капитала</span></div>
        <DonutChart slices={positionSlices(s.positions, s.assets, Math.max(0, cash))} />
      </div>
    </div>
  );
}
