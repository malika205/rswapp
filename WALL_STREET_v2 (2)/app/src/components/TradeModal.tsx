/**
 * TradeModal.tsx — окно подтверждения сделки (покупка/продажа).
 */
import { useEffect, useState } from "react";
import { ASSET_MAP, commissionRate } from "@/game/data";
import { useGame } from "@/game/store";
import AssetIcon from "./AssetIcon";
import { tradeResult, useResult } from "./ResultScreen";
import { fmtMoney, fmtPrice } from "@/game/utils";

export default function TradeModal() {
  const s = useGame();
  const modal = s.tradeModal;
  const showResult = useResult();
  const [qty, setQty] = useState<string>("1");
  const [side, setSide] = useState<"buy" | "sell">("buy");

  useEffect(() => {
    if (modal) setSide(modal.side);
  }, [modal]);

  if (!modal) return null;
  const def = ASSET_MAP[modal.assetId];
  const a = s.assets[modal.assetId];
  if (!a) return null;
  const pos = s.positions[modal.assetId];
  const price = a.price;
  const q = parseFloat(qty) || 0;
  const gross = q * price;
  const comm = gross * commissionRate(s.upgrades);
  const isBuy = side === "buy";
  const total = isBuy ? gross + comm : gross - comm;
  const maxQty = isBuy
    ? Math.max(0, s.balance / (price * (1 + commissionRate(s.upgrades))))
    : (pos?.qty ?? 0);
  const estPnl = !isBuy && pos ? (price - pos.avgPrice) * q - comm : null;

  const setPct = (p: number) => {
    const v = (maxQty * p) / 100;
    setQty(v >= 1 ? v.toFixed(2) : v.toFixed(6));
  };

  const confirm = () => {
    if (q <= 0) return;
    if (isBuy) s.buyAsset(modal.assetId, q);
    else {
      const before = useGame.getState().trades[0];
      s.sellAsset(modal.assetId, q);
      const after = useGame.getState().trades[0];
      if (after && after !== before && after.side === "sell" && after.assetId === modal.assetId) showResult(tradeResult(after));
    }
  };

  const insufficient = isBuy ? s.balance < total : q > (pos?.qty ?? 0) + 1e-9 || q <= 0;

  return (
    <div className="modal-backdrop" onClick={() => s.closeTrade()}>
      <div className="modal trade-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">
          <AssetIcon id={modal.assetId}/> Сделка: <span style={{ color: def.color }}>{def.ticker}</span>
          <button className="modal-x" onClick={() => s.closeTrade()}>✕</button>
        </div>

        <div className="side-tabs">
          <button className={isBuy ? "side-tab buy active" : "side-tab buy"} onClick={() => setSide("buy")}>Покупка</button>
          <button className={side === "sell" ? "side-tab sell active" : "side-tab sell"} onClick={() => setSide("sell")} disabled={!pos}>
            Продажа
          </button>
        </div>

        <div className="tm-price">
          Текущая цена: <b>{fmtPrice(price)}</b>
          {!isBuy && pos && <span className="tm-avail"> · доступно {pos.qty.toFixed(4)}</span>}
        </div>

        <div className="tm-qty-row">
          <label>Количество</label>
          <input
            className="qty-input"
            type="number"
            min="0"
            step="any"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
          <span className="tm-unit">шт.</span>
        </div>

        <div className="pct-btns">
          {[10, 25, 50, 100].map((p) => (
            <button key={p} onClick={() => setPct(p)}>{p}%</button>
          ))}
          <button onClick={() => setQty(maxQty >= 1 ? maxQty.toFixed(4) : maxQty.toFixed(6))}>MAX</button>
        </div>

        <div className="tm-summary">
          <div><span>Стоимость</span><b>{fmtMoney(gross)}</b></div>
          <div><span>Комиссия ({(commissionRate(s.upgrades) * 100).toFixed(2)}%)</span><b>{fmtMoney(comm)}</b></div>
          <div><span>{isBuy ? "Списано будет" : "Зачислится"}</span><b>{fmtMoney(total)}</b></div>
          {!isBuy && estPnl !== null && (
            <div>
              <span>Результат после комиссии продажи</span>
              <b className={estPnl >= 0 ? "up" : "down"}>{fmtMoney(estPnl, true)}</b>
            </div>
          )}
          <div><span>Баланс после</span><b>{fmtMoney(isBuy ? s.balance - total : s.balance + total)}</b></div>
        </div>

        {insufficient && (
          <div className="tm-error">
            {isBuy ? "Недостаточно средств на балансе" : "Недостаточно актива в портфеле"}
          </div>
        )}

        <div className="modal-actions">
          <button className="btn ghost" onClick={() => s.closeTrade()}>Отмена</button>
          <button
            className={isBuy ? "btn buy" : "btn sell"}
            disabled={insufficient || q <= 0}
            onClick={confirm}
          >
            {isBuy ? "✔ Подтвердить покупку" : "✔ Подтвердить продажу"}
          </button>
        </div>
      </div>
    </div>
  );
}
