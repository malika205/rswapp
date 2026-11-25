import { useEffect, useState } from "react";
import { useGame, type Tab } from "@/game/store";
const KEY = "wst.tutorial.v2";
export function resetTutorial() { try {localStorage.removeItem(KEY);} catch {} }
export function tutorialNeeded() { try {return localStorage.getItem(KEY) !== "done";} catch {return true;} }
const lessons: {label:string; title:string; text:string; tip:string; tab:Tab; question?:string; options?:string[]; correct?:number}[] = [
 {label:"01 / Старт", title:"Добро пожаловать на рынок", text:"У тебя $10 000 виртуальных денег на старте. Баланс — свободные деньги, капитал — деньги плюс стоимость активов и депозиты за вычетом долгов.", tip:"Все цены в игре моделируются. Реальных сделок здесь нет.", tab:"dashboard"},
 {label:"02 / Биржа", title:"Найди первый актив", text:"На бирже есть акции, криптовалюты, металлы и валюты. Выбери актив, изучи график и описание. Цена может как расти, так и падать.",tip:"BTC — Bitcoin, AAPL — Apple. Тикер — короткое обозначение актива.",tab:"trading"},
 {label:"03 / Покупка", title:"Попробуй рассчитать сделку", text:"Представь, что одна акция стоит $100. Ты покупаешь 2 акции. Комиссия 0,1% составит $0,20.",tip:"Это учебный пример: деньги со счёта не списываются.",tab:"trading",question:"Сколько спишется с баланса?",options:["$100,20","$200,20","$220"],correct:1},
 {label:"04 / Продажа", title:"Прибыль и убыток", text:"Если эти 2 акции выросли со $100 до $110, их цена теперь $220. При продаже прибыль до комиссий равна $20. Если цена упала, получится убыток.",tip:"P&L — результат в деньгах, доходность — результат в процентах.",tab:"portfolio",question:"Доходность до комиссий в примере?",options:["+5%","+10%","+20%"],correct:1},
 {label:"05 / Риски",title:"Управляй риском",text:"Не обязательно вкладывать весь баланс в один актив. Распределяй капитал, изучай новости и помни, что рост в прошлом не гарантирует роста в будущем.",tip:"В игре новости вымышлены. Не используй их как реальные инвестиционные рекомендации.",tab:"news",question:"Как уменьшить зависимость от одной акции?",options:["Купить только её","Вложить всё в кредит","Распределить средства между активами"],correct:2},
 {label:"06 / Практика",title:"Готов к первой сделке?",text:"Открой биржу, выбери Apple или другой актив, нажми «Купить» и укажи количество. Затем проверь портфель. После продажи можно открыть анимированный отчёт о результате.",tip:"Кнопка «?» в верхней панели позволяет повторить обучение в любой момент.",tab:"trading"},
];
export default function Tutorial({onClose}:{onClose:()=>void}) {
 const [step,setStep] = useState(0);
 const [answer,setAnswer] = useState<number|null>(null);
 const lesson=lessons[step];
 useEffect(()=>{useGame.getState().setTab(lesson.tab);},[lesson.tab]);
 const valid=lesson.correct===undefined || answer===lesson.correct;
 function finish(){try{localStorage.setItem(KEY,"done");}catch{} onClose();}
 function move(n:number){setAnswer(null);setStep(n);}
 return <div className="tutorial-backdrop"><section className="tutorial-card" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
   <div className="tutorial-top"><span>АКАДЕМИЯ WALL STREET</span><button className="link-btn" onClick={finish}>Пропустить</button></div>
   <div className="tutorial-progress" aria-label={`Шаг ${step+1} из ${lessons.length}`}>{lessons.map((_,i)=><i key={i} className={i<=step?"done":""}/>)}</div>
   <p className="tutorial-kicker">{lesson.label}</p><h2 id="tutorial-title">{lesson.title}</h2><p className="tutorial-body">{lesson.text}</p>
   {lesson.question && <div className="tutorial-quiz"><b>{lesson.question}</b>{lesson.options?.map((o,i)=><button key={o} className={`quiz-option ${answer===i ? valid?"right":"wrong":""}`} onClick={()=>setAnswer(i)}>{o}</button>)}{answer!==null && <p role="status" className={valid?"up":"down"}>{valid?"Верно!":"Попробуй ещё раз."}</p>}</div>}
   <div className="tutorial-tip">{lesson.tip}</div><div className="tutorial-actions"><button className="btn ghost" disabled={step===0} onClick={()=>move(step-1)}>Назад</button><button className="btn primary" disabled={!valid} onClick={()=>step===lessons.length-1?finish():move(step+1)}>{step===lessons.length-1?"К первой сделке →":"Далее →"}</button></div>
 </section></div>;
}
