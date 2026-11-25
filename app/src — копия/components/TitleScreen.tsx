/**
 * TitleScreen.tsx — титульный экран и выбор режима игры.
 */
import { useState } from "react";
import { MODES } from "@/game/data";
import { sfx } from "@/game/audio";
import { hasSave, useGame } from "@/game/store";
import type { Mode } from "@/game/types";

export default function TitleScreen() {
  const startNewGame = useGame((s) => s.startNewGame);
  const continueGame = useGame((s) => s.continueGame);
  const [confirmReset, setConfirmReset] = useState<Mode | null>(null);

  const handleMode = (mode: Mode) => {
    sfx.click();
    if (hasSave(mode)) {
      if (confirmReset !== mode) {
        setConfirmReset(mode);
        return;
      }
      setConfirmReset(null);
      startNewGame(mode);
      return;
    }
    startNewGame(mode);
  };

  const handleContinue = (mode: Mode) => {
    sfx.click();
    continueGame(mode);
  };

  return (
    <div className="title-screen">
      <div className="title-bg" />
      <div className="title-content">
        <div className="title-logo">
          <div className="title-bull">📈</div>
          <h1>WALL STREET</h1>
          <h2>RISE OF THE TRADER</h2>
          <p className="title-tag">Симулятор финансового рынка · только виртуальные деньги</p>
        </div>

        <div className="mode-cards">
          {MODES.map((m) => {
            const saved = hasSave(m.id);
            return (
              <div key={m.id} className="mode-card" onClick={() => handleMode(m.id)}>
                <div className="mode-icon">{m.icon}</div>
                <div className="mode-title">{m.title}</div>
                <div className="mode-sub">{m.subtitle}</div>
                <div className="mode-start">{confirmReset === m.id ? "Точно начать заново?" : "Начать"}</div>
                {saved && (
                  <button
                    className="mode-continue"
                    onClick={(e) => { e.stopPropagation(); handleContinue(m.id); }}
                  >
                    ▶ Продолжить
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <p className="title-note">
          Прогресс сохраняется автоматически в этом браузере. Прогресс сохраняется отдельно для каждого режима.
        </p>
      </div>
    </div>
  );
}
