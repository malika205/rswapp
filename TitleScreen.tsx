/** Single entry point: career. Existing career saves remain compatible. */
import { useState } from "react";
import { sfx } from "@/game/audio";
import { hasSave, useGame } from "@/game/store";
import { resetTutorial } from "./Tutorial";

export default function TitleScreen() {
  const start = useGame(s => s.startNewGame);
  const resume = useGame(s => s.continueGame);
  const [error, setError] = useState("");
  const saved = hasSave("career");
  function newGame() {
    if (saved && !window.confirm("Начать новую игру? Текущая карьера будет перезаписана.")) return;
    sfx.click(); resetTutorial(); start("career");
  }
  return <div className="title-screen"><div className="title-bg"/><div className="title-content title-v2">
    <div className="title-logo"><div className="title-bull">📈</div><h1>WALL STREET 2.0</h1><h2>RISE OF THE TRADER</h2><p className="title-tag">Твой первый шаг на финансовом рынке</p></div>
    <section className="career-entry"><div className="entry-eyebrow">КАРЬЕРА ТРЕЙДЕРА</div><div className="entry-capital">$10 000</div><p>Стартовый виртуальный капитал. Изучай рынок, управляй портфелем и развивай навыки без реальных денежных рисков.</p>
      {saved && <button className="entry-primary" onClick={() => {sfx.click(); if (!resume("career")) setError("Не удалось открыть сохранение. Можно начать новую игру.");}}>▶ Продолжить игру</button>}
      <button className={saved ? "entry-secondary" : "entry-primary"} onClick={newGame}>{saved ? "Новая игра" : "Начать карьеру →"}</button>
      {error && <p role="alert">{error}</p>}
      <div className="entry-features"><span>◎ Обучение</span><span>◈ 23 актива</span><span>↗ Анализ P&amp;L</span></div>
    </section><p className="title-note">Учебный симулятор · виртуальные деньги · автоматическое сохранение</p>
  </div></div>;
}
