/**
 * ProfileModal.tsx — профиль игрока: имя, уровень, статистика.
 */
import { LEVELS, MODES } from "@/game/data";
import { equity, useGame } from "@/game/store";
import { fmtMoney } from "@/game/utils";

export default function ProfileModal() {
  const s = useGame();
  if (!s.profileOpen) return null;
  const levelDef = LEVELS[s.level - 1];
  const nextDef = LEVELS[s.level] ?? null;
  const startBalance = s.mode ? (MODES.find((m) => m.id === s.mode)?.startBalance ?? 10_000) : 10_000;
  const totalPnl = equity(s) - startBalance;

  return (
    <div className="modal-backdrop" onClick={() => s.setProfileOpen(false)}>
      <div className="modal profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">
          👤 Профиль трейдера
          <button className="modal-x" onClick={() => s.setProfileOpen(false)}>✕</button>
        </div>
        <div className="pf-name-row">
          <input
            className="pf-name"
            value={s.playerName}
            maxLength={24}
            onChange={(e) => s.setName(e.target.value)}
          />
          <span className="pf-level">Уровень {s.level} · {levelDef.title}</span>
        </div>
        {!nextDef && <div className="pf-max">🏆 Максимальный уровень!</div>}
        <div className="stats-grid">
          <div><span>Капитал</span><b>{fmtMoney(equity(s))}</b></div>
          <div><span>Общий P&amp;L</span><b className={totalPnl >= 0 ? "up" : "down"}>{fmtMoney(totalPnl, true)}</b></div>
          <div><span>Сделок</span><b>{s.stats.trades}</b></div>
          <div><span>Винрейт</span><b>{s.stats.trades ? Math.round((s.stats.wins / s.stats.trades) * 100) : 0}%</b></div>
          <div><span>Лучшая сделка</span><b className="up">{fmtMoney(s.stats.bestTrade)}</b></div>
          <div><span>Режим</span><b>{s.mode === "career" ? "Карьера" : s.mode === "sandbox" ? "Песочница" : "Выживание"}</b></div>
          <div><span>Дивиденды</span><b>{fmtMoney(s.stats.dividendsEarned)}</b></div>
          <div><span>Достижения</span><b>{s.achievements.length} 🏅</b></div>
        </div>
        <div className="modal-actions">
          <button className="btn ghost" onClick={() => s.backToTitle()}>🏠 В главное меню</button>
          <button className="btn danger" onClick={() => { if (confirm("Начать карьеру заново? Прогресс будет удалён.")) s.restartMode(); }}>
            🔄 Начать заново
          </button>
        </div>
      </div>
    </div>
  );
}
