/**
 * News.tsx — лента новостей рынка + экономический календарь.
 */
import { gameDate, newsTimeLabel } from "@/game/engine";
import { impactLabel } from "@/game/data";
import { useGame } from "@/game/store";

const CAT_LABEL: Record<string, string> = {
  tech: "Технологии",
  crypto: "Крипто",
  metals: "Металлы",
  forex: "Валюты",
  macro: "Макро",
  company: "Компании",
};

export default function News() {
  const s = useGame();
  const upcoming = s.calendar.filter((e) => !e.fired).sort((a, b) => a.day - b.day).slice(0, 8);

  return (
    <div className="news-layout">
      <div className="panel">
        <div className="panel-head">
          <span>📰 Лента новостей</span>
          <span className="badge neutral-bg">{s.news.length} событий</span>
        </div>
        <div className="news-feed">
          {s.news.map((n) => (
            <div key={n.id} className={`news-item ${n.impact === "high" ? "hot" : ""}`}>
              <div className="ni-top">
                <span className={`ni-cat cat-${n.category}`}>{CAT_LABEL[n.category] ?? n.category}</span>
                <span className="ni-time">{newsTimeLabel(n.t, s.gameMinute)} · {gameDate(n.t).date}</span>
                <span className={`ni-impact ${n.sentiment > 0 ? "up-bg" : n.sentiment < 0 ? "down-bg" : "neutral-bg"}`}>
                  {n.sentiment > 0 ? "▲" : n.sentiment < 0 ? "▼" : "•"} {impactLabel(n.impact)}
                </span>
              </div>
              <div className="ni-title">{n.title}</div>
            </div>
          ))}
          {s.news.length === 0 && <div className="empty">Новости появятся по мере движения рынка</div>}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><span>🗓️ Экономический календарь</span><span className="badge neutral-bg">игровые события</span></div>
        <div className="cal-list">
          {upcoming.map((e) => (
            <div key={e.id} className="cal-item">
              <div className="cal-date">{gameDate(e.day * 1440).date}</div>
              <div className="cal-body">
                <div className="cal-title">{e.title}</div>
                <div className="cal-sub">{e.kind === "macro" ? "Макроэкономика · влияет на весь рынок" : "Отчётность компании"} · влияние: {impactLabel(e.impact)}</div>
              </div>
            </div>
          ))}
          {upcoming.length === 0 && <div className="empty">Событий не запланировано</div>}
        </div>
        <p className="cal-note">
          События календаря случаются в конце игрового дня и реально двигают рынок — следите за датами.
        </p>
      </div>
    </div>
  );
}
