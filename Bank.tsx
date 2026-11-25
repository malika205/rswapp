/**
 * Bank.tsx — депозиты, кредиты и магазин улучшений.
 */
import { useState } from "react";
import { DEPOSIT_APY, LOAN_APY, UPGRADES, depositApy, loanLimit } from "@/game/data";
import { equity, useGame } from "@/game/store";
import { fmtMoney } from "@/game/utils";

export default function Bank() {
  const s = useGame();
  const [depAmt, setDepAmt] = useState<string>("1000");
  const [loanAmt, setLoanAmt] = useState<string>("5000");
  const eq = equity(s);
  const depUnlocked = s.level >= 2 || s.mode === "sandbox";
  const loanUnlocked = s.level >= 3 || s.mode === "sandbox";
  const limit = loanLimit(s.level, eq, s.upgrades);
  const debt = s.loan.principal + s.loan.interest;
  const depRate = depositApy(s.upgrades);

  return (
    <div className="bank">
      <div className="bank-grid">
        <div className="panel bank-card">
          <div className="panel-head"><span>💰 Депозит</span><span className="badge up-bg">{depRate * 100}% годовых</span></div>
          {!depUnlocked ? (
            <div className="locked">
              🔒 Откроется на 2 уровне «Начинающий инвестор»
              <div className="locked-sub">Совершайте сделки и выполняйте задания, чтобы получать опыт</div>
            </div>
          ) : (
            <>
              <div className="bank-balance">
                <div><span>На депозите</span><b>{fmtMoney(s.deposit.amount)}</b></div>
                <div><span>Доход за сегодня</span><b className="up">+{fmtMoney(s.deposit.amount * (depRate / 365))}</b></div>
              </div>
              <div className="bank-row">
                <input type="number" min="0" value={depAmt} onChange={(e) => setDepAmt(e.target.value)} placeholder="Сумма" />
                <button className="btn primary" onClick={() => s.depositAdd(parseFloat(depAmt) || 0)}>Положить</button>
              </div>
              <button className="btn ghost" onClick={() => s.depositWithdraw()} disabled={s.deposit.amount <= 0}>
                Забрать всё ({fmtMoney(s.deposit.amount)})
              </button>
              <p className="bank-note">Проценты начисляются каждый игровой день. Снять можно в любой момент.</p>
            </>
          )}
        </div>

        <div className="panel bank-card">
          <div className="panel-head"><span>🏦 Кредит</span><span className="badge down-bg">{LOAN_APY * 100}% годовых</span></div>
          {!loanUnlocked ? (
            <div className="locked">
              🔒 Откроется на 3 уровне «Трейдер»
              <div className="locked-sub">Кредит — это левередж, но и обязательство: проценты капают ежедневно</div>
            </div>
          ) : (
            <>
              <div className="bank-balance">
                <div><span>Долг</span><b className={debt > 0 ? "down" : ""}>{fmtMoney(debt)}</b></div>
                <div><span>Лимит</span><b>{fmtMoney(Math.max(0, limit - debt))} доступно</b></div>
              </div>
              <div className="bank-row">
                <input type="number" min="0" value={loanAmt} onChange={(e) => setLoanAmt(e.target.value)} placeholder="Сумма" />
                <button className="btn primary" onClick={() => s.loanTake(parseFloat(loanAmt) || 0)}>Взять</button>
              </div>
              <button className="btn ghost" onClick={() => s.loanRepay(Math.min(debt, s.balance))} disabled={debt <= 0 || s.balance <= 0}>
                Погасить ({fmtMoney(Math.min(debt, s.balance))})
              </button>
              {s.loan.principal > 0 && (
                <p className="bank-note">Тело: {fmtMoney(s.loan.principal)} · проценты: {fmtMoney(s.loan.interest)} · ежедневно +{fmtMoney(s.loan.principal * (LOAN_APY / 365))}</p>
              )}
            </>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><span>🛒 Магазин улучшений</span><span className="badge neutral-bg">покупается за виртуальные деньги</span></div>
        <div className="upg-grid">
          {UPGRADES.map((u) => {
            const owned = s.upgrades.includes(u.id);
            const locked = s.level < u.minLevel && s.mode !== "sandbox";
            const poor = s.balance < u.price;
            return (
              <div key={u.id} className={`upg ${owned ? "owned" : ""}`}>
                <div className="upg-title">{owned ? "✅ " : ""}{u.title}</div>
                <div className="upg-desc">{u.desc}</div>
                {owned ? (
                  <div className="upg-owned-label">Куплено</div>
                ) : (
                  <button
                    className="btn primary"
                    disabled={locked || poor}
                    onClick={() => s.buyUpgrade(u.id)}
                  >
                    {locked ? `🔒 Уровень ${u.minLevel}` : `Купить за ${fmtMoney(u.price)}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {!depUnlocked && <p className="bank-note" style={{ marginTop: 10 }}>💡 Базовая ставка депозита {DEPOSIT_APY * 100}% годовых.</p>}
      </div>
    </div>
  );
}
