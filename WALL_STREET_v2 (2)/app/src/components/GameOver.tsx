/**
 * GameOver.tsx — экран банкротства в режиме выживания.
 */
import { useGame } from "@/game/store";
import { fmtMoney } from "@/game/utils";

export default function GameOver() {
  const s = useGame();
  if (!s.gameOver) return null;
  return (
    <div className="modal-backdrop gameover">
      <div className="modal go-modal">
        <div className="go-icon">💥</div>
        <h2>БАНКРОТСТВО</h2>
        <p className="go-text">Капитал упал ниже $100 — брокер закрыл все позиции.</p>
        <div className="stats-grid">
          <div><span>Продержались</span><b>{s.gameOver.days} игровых дней</b></div>
          <div><span>Итоговый капитал</span><b>{fmtMoney(s.gameOver.equity)}</b></div>
          <div><span>Сделок совершено</span><b>{s.stats.trades}</b></div>
          <div><span>Реализованный P&amp;L</span><b className={s.stats.realizedPnl >= 0 ? "up" : "down"}>{fmtMoney(s.stats.realizedPnl, true)}</b></div>
        </div>
        <div className="modal-actions">
          <button className="btn ghost" onClick={() => s.backToTitle()}>🏠 В меню</button>
          <button className="btn primary" onClick={() => s.restartMode()}>🔥 Попробовать снова</button>
        </div>
      </div>
    </div>
  );
}
