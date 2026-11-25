/**
 * Home.tsx — оболочка игры: титульный экран или игровой терминал.
 */
import { useEffect, useState } from "react";
import { gameDate } from "@/game/engine";
import { equity, useGame, type Tab } from "@/game/store";
import { fmtMoney } from "@/game/utils";
import Tutorial, { tutorialNeeded } from "@/components/Tutorial";
import { ResultProvider } from "@/components/ResultScreen";
import TitleScreen from "@/components/TitleScreen";
import Dashboard from "@/components/Dashboard";
import Trading from "@/components/Trading";
import Portfolio from "@/components/Portfolio";
import News from "@/components/News";
import Career from "@/components/Career";
import Bank from "@/components/Bank";
import TradeModal from "@/components/TradeModal";
import ProfileModal from "@/components/ProfileModal";
import GameOver from "@/components/GameOver";
import { sfx } from "@/game/audio";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "dashboard", label: "Главная", icon: "🏠" },
  { id: "trading", label: "Биржа", icon: "📊" },
  { id: "portfolio", label: "Портфель", icon: "💼" },
  { id: "news", label: "Новости", icon: "📰" },
  { id: "career", label: "Карьера", icon: "🎯" },
  { id: "bank", label: "Банк", icon: "🏦" },
];

function ToastStack() {
  const toasts = useGame((s) => s.toasts);
  const dismiss = useGame((s) => s.dismissToast);
  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`} onClick={() => dismiss(t.id)}>
          <div className="toast-title">{t.title}</div>
          {t.text && <div className="toast-text">{t.text}</div>}
        </div>
      ))}
    </div>
  );
}

function GameShell() {
  const s = useGame();
  const [tutorial, setTutorial] = useState(tutorialNeeded);
  const eq = equity(s);
  const dayPnl = eq - s.dayStartEquity;
  const date = gameDate(s.gameMinute);

  return (
    <ResultProvider><div className="shell">
      <header className="topbar">
        <button className="brand" onClick={() => s.setTab("dashboard")}>
          <span className="brand-icon">📈</span>
          <span className="brand-text">WALL STREET 2.0 <em>RISE OF THE TRADER</em></span>
        </button>
        <div className="topbar-stats">
          <div className="ts"><span>Баланс</span><b>{fmtMoney(s.balance)}</b></div>
          <div className="ts"><span>Капитал</span><b>{fmtMoney(eq)}</b></div>
          <div className="ts"><span>День</span><b className={dayPnl >= 0 ? "up" : "down"}>{fmtMoney(dayPnl, true)}</b></div>
          <div className="ts clock"><span>{date.date}</span><b>{date.time}</b></div>
        </div>
        <div className="topbar-actions">
          <button className="icon-btn" title={s.tickerPause ? "Возобновить время" : "Пауза"} onClick={() => s.setTickerPause(!s.tickerPause)}>
            {s.tickerPause ? "▶" : "⏸"}
          </button>
          <button className="icon-btn" title={s.muted ? "Включить звук" : "Выключить звук"} onClick={() => s.setMuted(!s.muted)}>
            {s.muted ? "🔇" : "🔊"}
          </button>
          <button className="icon-btn tutorial-help" title="Повторить обучение" aria-label="Повторить обучение" onClick={() => setTutorial(true)}>?</button>
          <button className="profile-btn" onClick={() => { s.setProfileOpen(true); sfx.click(); }}>
            👤 {s.playerName}
          </button>
        </div>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={s.tab === t.id ? "tab active" : "tab"}
            onClick={() => s.setTab(t.id)}
          >
            <span className="tab-icon">{t.icon}</span>
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
      </nav>

      <main className="content">
        {s.tab === "dashboard" && <Dashboard />}
        {s.tab === "trading" && <Trading />}
        {s.tab === "portfolio" && <Portfolio />}
        {s.tab === "news" && <News />}
        {s.tab === "career" && <Career />}
        {s.tab === "bank" && <Bank />}
      </main>

      <ToastStack />
      <TradeModal />
      <ProfileModal />
      <GameOver />
      {tutorial && <Tutorial onClose={() => setTutorial(false)} />}
    </div></ResultProvider>
  );
}

export default function Home() {
  const screen = useGame((s) => s.screen);

  // пробуждение AudioContext на первом жесте (автоплей-политика)
  useEffect(() => {
    const wake = () => sfx.click();
    window.addEventListener("pointerdown", wake, { once: true });
    return () => window.removeEventListener("pointerdown", wake);
  }, []);

  if (screen === "title") return <TitleScreen />;
  return <GameShell />;
}
