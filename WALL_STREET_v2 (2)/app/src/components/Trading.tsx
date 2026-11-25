/**
 * Trading.tsx — торговая площадка: список активов, детали, график, покупка/продажа, избранное, сравнение.
 */
import { useMemo, useState } from "react";
import { ASSETS, ASSET_MAP, CATEGORIES } from "@/game/data";
import { fmtCompact, fmtMoney, fmtPct, fmtPrice } from "@/game/utils";
import { useGame } from "@/game/store";
import AssetIcon from "./AssetIcon";
import { ResultButton } from "./ResultScreen";
import CandleChart from "./CandleChart";
import type { Category } from "@/game/types";

export default function Trading() {
  const s = useGame();
  const [cat, setCat] = useState<Category | "all" | "fav">("all");
  const [query, setQuery] = useState("");
  const selected = s.selectedAsset ?? "aapl";
  const def = ASSET_MAP[selected];
  const a = s.assets[selected];
  const pos = s.positions[selected];

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ASSETS.filter((d) => {
      if (cat === "fav" && !s.favorites.includes(d.id)) return false;
      if (cat !== "all" && cat !== "fav" && d.category !== cat) return false;
      if (q && !d.name.toLowerCase().includes(q) && !d.ticker.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [cat, query, s.favorites]);

  const compareAssets = s.compare
    .filter((id) => id !== selected || s.compare.length > 0)
    .map((id) => ({ asset: s.assets[id], color: ASSET_MAP[id].color, name: ASSET_MAP[id].ticker }))
    .filter((c) => c.asset);

  const chg = a ? (a.price - a.openDayPrice) / a.openDayPrice : 0;
  const unreal = pos ? (a.price - pos.avgPrice) * pos.qty : 0;

  return (
    <div className="trading-layout">
      <div className="asset-list panel">
        <div className="list-head">
          <input
            className="search-input"
            placeholder="Поиск актива…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="cat-bar">
          <button className={cat === "all" ? "cat-chip active" : "cat-chip"} onClick={() => setCat("all")}>Все</button>
          {CATEGORIES.map((c) => (
            <button key={c.id} className={cat === c.id ? "cat-chip active" : "cat-chip"} onClick={() => setCat(c.id)}>
              {c.label}
            </button>
          ))}
          <button className={cat === "fav" ? "cat-chip active" : "cat-chip"} onClick={() => setCat("fav")}>★ Избранное</button>
        </div>
        <div className="asset-rows">
          {list.map((d) => {
            const st = s.assets[d.id];
            if (!st) return null;
            const c = (st.price - st.openDayPrice) / st.openDayPrice;
            return (
              <div
                key={d.id}
                className={`asset-row ${selected === d.id ? "selected" : ""}`}
                onClick={() => s.setSelectedAsset(d.id)}
              >
                <button
                  className={`fav-star ${s.favorites.includes(d.id) ? "on" : ""}`}
                  onClick={(e) => { e.stopPropagation(); s.toggleFavorite(d.id); }}
                  title="В избранное"
                >
                  {s.favorites.includes(d.id) ? "★" : "☆"}
                </button>
                <span className="asset-ticker asset-with-icon" style={{ color: d.color }}><AssetIcon id={d.id} size={24}/>{d.ticker}</span>
                <span className="asset-name">{d.name}</span>
                <span className="asset-price">{fmtPrice(st.price)}</span>
                <span className={c >= 0 ? "up" : "down"}>{fmtPct(c)}</span>
              </div>
            );
          })}
          {list.length === 0 && <div className="empty">Ничего не найдено</div>}
        </div>
      </div>

      <div className="asset-detail">
        {a && def && (
          <>
            <div className="panel detail-head">
              <div className="dh-main">
                <AssetIcon id={selected} size={36}/><span className="dh-ticker" style={{ color: def.color }}>{def.ticker}</span>
                <span className="dh-name">{def.name}</span>
                <span className="dh-cat">{CATEGORIES.find((c) => c.id === def.category)?.label}</span>
              </div>
              <div className="dh-price">
                <span className="dh-val">{fmtPrice(a.price)}</span>
                <span className={chg >= 0 ? "up big" : "down big"}>{fmtPct(chg)} сегодня</span>
              </div>
              <div className="dh-actions">
                <button className="buy-btn" onClick={() => s.openTrade(selected, "buy")}>Купить</button>
                <button className="sell-btn" onClick={() => s.openTrade(selected, "sell")} disabled={!pos}>Продать</button>
                <button
                  className={s.compare.includes(selected) ? "cmp-btn on" : "cmp-btn"}
                  onClick={() => s.toggleCompare(selected)}
                  disabled={!s.compare.includes(selected) && (s.compare.length >= 3 || s.level < 4 && s.mode !== "sandbox")}
                  title={s.level < 4 && s.mode !== "sandbox" && !s.compare.includes(selected) ? "Сравнение откроется на 4 уровне" : "Добавить к сравнению"}
                >
                  ⇄ Сравнить
                </button>
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <span>График {def.ticker}</span>
                <div className="head-stats">
                  <span>Макс <b className="up">{fmtPrice(a.dayHigh)}</b></span>
                  <span>Мин <b className="down">{fmtPrice(a.dayLow)}</b></span>
                  <span>Объём <b>{fmtCompact(a.volume24)}</b></span>
                </div>
              </div>
              {s.compare.length > 0 ? (
                <CandleChart
                  asset={a}
                  gameMinute={s.gameMinute}
                  color={def.color}
                  compare={[...compareAssets.filter((c2) => c2.asset.id !== selected), { asset: a, color: def.color, name: def.ticker }]}
                  height={300}
                />
              ) : (
                <CandleChart asset={a} gameMinute={s.gameMinute} color={def.color} height={300} />
              )}
              {s.compare.length > 0 && (
                <div className="compare-tray">
                  {s.compare.map((id) => (
                    <span key={id} className="cmp-tag" style={{ borderColor: ASSET_MAP[id].color }}>
                      {ASSET_MAP[id].ticker}
                      <button onClick={() => s.toggleCompare(id)}>✕</button>
                    </span>
                  ))}
                  <button className="link-btn" onClick={() => s.clearCompare()}>Очистить всё</button>
                </div>
              )}
            </div>

            <div className="panel detail-info">
              <p className="asset-desc">{def.description}</p>
              <div className="info-grid">
                <div><span>Тикер</span><b>{def.ticker}</b></div>
                <div><span>Категория</span><b>{CATEGORIES.find((c) => c.id === def.category)?.label}</b></div>
                <div><span>Волатильность</span><b>{def.vol > 0.004 ? "Очень высокая" : def.vol > 0.002 ? "Высокая" : def.vol > 0.001 ? "Средняя" : "Низкая"}</b></div>
                <div><span>Дивиденды</span><b>{def.dividendYield > 0 ? `${(def.dividendYield * 100).toFixed(def.dividendYield * 100 < 1 ? 2 : 1)}% годовых` : "Не выплачивает"}</b></div>
                <div><span>Цена открытия</span><b>{fmtPrice(a.openDayPrice)}</b></div>
                <div><span>Объём (24ч)</span><b>{fmtCompact(a.volume24)}</b></div>
              </div>
              {pos && (
                <div className="your-pos">
                  <div className="yp-title">Ваша позиция <ResultButton result={{title: `Позиция ${def.ticker}`, amount: unreal, base: pos.avgPrice * pos.qty, detail: "Нереализованный результат до комиссий", assetId: selected}} /></div>
                  <div className="yp-grid">
                    <div><span>Количество</span><b>{pos.qty.toFixed(4)}</b></div>
                    <div><span>Средняя цена</span><b>{fmtPrice(pos.avgPrice)}</b></div>
                    <div><span>Стоимость</span><b>{fmtMoney(pos.qty * a.price)}</b></div>
                    <div><span>Нереализ. P&amp;L</span><b className={unreal >= 0 ? "up" : "down"}>{fmtMoney(unreal, true)} ({fmtPct(pos.avgPrice > 0 ? (a.price - pos.avgPrice) / pos.avgPrice : 0)})</b></div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
