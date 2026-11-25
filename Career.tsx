/**
 * Career.tsx — карьера трейдера: уровень, опыт, задания, достижения.
 */
import { ACHIEVEMENTS, CAREER_QUESTS, DAILY_QUEST_POOL, LEVELS, MODES } from "@/game/data";
import { equity, useGame } from "@/game/store";
import { fmtMoney } from "@/game/utils";

export default function Career() {
  const s = useGame();
  const levelDef = LEVELS[s.level - 1];
  const nextDef = LEVELS[s.level] ?? null;
  const curXp = s.xp - levelDef.xp;
  const needXp = nextDef ? nextDef.xp - levelDef.xp : 1;
  const pct = nextDef ? Math.min(1, curXp / needXp) : 1;
  const startBalance = s.mode ? (MODES.find((m) => m.id === s.mode)?.startBalance ?? 10_000) : 10_000;

  const questProgress = (id: string): number => {
    switch (id) {
      case "q_first": return Math.min(1, s.stats.trades);
      case "q_profit100": return Math.min(100, s.stats.bestTrade);
      case "q_three": return Object.keys(s.positions).length;
      case "q_20k": return Math.min(20_000, Math.floor(equity(s)));
      case "q_wins5": return Math.min(5, s.stats.wins);
      case "q_trades25": return Math.min(25, s.stats.trades);
      case "q_dividend": return s.stats.dividendsEarned > 0 ? 1 : 0;
      case "q_fav5": return Math.min(5, s.favorites.length);
      case "q_100k": return Math.min(100_000, Math.floor(equity(s)));
      case "q_crisis": return s.engine.crisisSurvived ? 1 : 0;
      default: return 0;
    }
  };

  return (
    <div className="career">
      <div className="panel level-panel">
        <div className="level-badge">{s.level}</div>
        <div className="level-info">
          <div className="level-title">{levelDef.title}</div>
          <div className="xp-bar">
            <div className="xp-fill" style={{ width: `${pct * 100}%` }} />
          </div>
          <div className="level-sub">
            {nextDef
              ? `${s.xp} XP · до уровня «${nextDef.title}» ещё ${nextDef.xp - s.xp} XP`
              : "Максимальный уровень достигнут — вы Легенда Уолл-стрит!"}
          </div>
          {levelDef.unlocks.length > 0 && <div className="level-unlocks">🔓 Открыто: {levelDef.unlocks.join(" · ")}</div>}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><span>📋 Ежедневные задания</span><span className="badge neutral-bg">обновляются каждый игровой день</span></div>
        <div className="quest-list">
          {s.dailyQuests.map((q) => {
            const def = DAILY_QUEST_POOL.find((d) => d.id === q.id);
            if (!def) return null;
            const p = q.done ? def.target : Math.min(def.target, q.progress);
            return (
              <div key={q.id} className={`quest ${q.done ? "done" : ""}`}>
                <div className="quest-main">
                  <div className="quest-title">{q.done ? "✅ " : ""}{def.title}</div>
                  <div className="quest-desc">{def.desc}</div>
                </div>
                <div className="quest-side">
                  <div className="quest-reward">+${def.reward} · +{def.xp} XP</div>
                  <div className="quest-bar">
                    <div className="quest-fill" style={{ width: `${(p / def.target) * 100}%` }} />
                    <span className="quest-count">{p}/{def.target}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><span>🎯 Карьерные цели</span></div>
        <div className="quest-list">
          {CAREER_QUESTS.map((q) => {
            const done = s.careerDone.includes(q.id);
            const p = done ? q.target : questProgress(q.id);
            return (
              <div key={q.id} className={`quest ${done ? "done" : ""}`}>
                <div className="quest-main">
                  <div className="quest-title">{done ? "✅ " : ""}{q.title}</div>
                  <div className="quest-desc">{q.desc}</div>
                </div>
                <div className="quest-side">
                  <div className="quest-reward">+${q.reward} · +{q.xp} XP</div>
                  <div className="quest-bar">
                    <div className="quest-fill" style={{ width: `${Math.min(1, p / q.target) * 100}%` }} />
                    <span className="quest-count">{Math.min(q.target, Math.floor(p))}/{q.target}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><span>🏅 Достижения</span><span className="badge neutral-bg">{s.achievements.length}/{ACHIEVEMENTS.length}</span></div>
        <div className="ach-grid">
          {ACHIEVEMENTS.map((a) => {
            const unlocked = s.achievements.includes(a.id);
            return (
              <div key={a.id} className={`ach ${unlocked ? "unlocked" : ""}`} title={a.desc}>
                <div className="ach-icon">{unlocked ? a.icon : "🔒"}</div>
                <div className="ach-title">{a.title}</div>
                <div className="ach-desc">{a.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><span>📊 Статистика</span></div>
        <div className="stats-grid">
          <div><span>Сделок</span><b>{s.stats.trades}</b></div>
          <div><span>Прибыльных</span><b className="up">{s.stats.wins}</b></div>
          <div><span>Убыточных</span><b className="down">{s.stats.losses}</b></div>
          <div><span>Винрейт</span><b>{s.stats.trades ? Math.round((s.stats.wins / s.stats.trades) * 100) : 0}%</b></div>
          <div><span>Реализованный P&amp;L</span><b className={s.stats.realizedPnl >= 0 ? "up" : "down"}>{fmtMoney(s.stats.realizedPnl, true)}</b></div>
          <div><span>Дивиденды</span><b>{fmtMoney(s.stats.dividendsEarned)}</b></div>
          <div><span>Проценты с депозита</span><b>{fmtMoney(s.stats.depositsEarned)}</b></div>
          <div><span>Капитал</span><b>{fmtMoney(equity(s))}</b></div>
          <div><span>Стартовый капитал</span><b>{fmtMoney(startBalance)}</b></div>
        </div>
      </div>
    </div>
  );
}
