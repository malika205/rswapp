import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ASSET_MAP } from "@/game/data";
import type { Trade } from "@/game/types";
import AssetIcon from "./AssetIcon";

export type Result = {title:string; amount:number; base:number; detail:string; assetId?:string};
const ResultContext = createContext<(result:Result)=>void>(()=>{});
export const useResult = () => useContext(ResultContext);
export function tradeResult(t:Trade):Result {
 const gross=t.price*t.qty; const pnl=t.pnl??0;
 return {title:`Продажа ${ASSET_MAP[t.assetId]?.ticker??t.assetId}`,amount:pnl-t.commission,base:gross-pnl,detail:"С учётом комиссии продажи, без комиссии покупки",assetId:t.assetId};
}
function money(n:number){return `${n<0?"−":n>0?"+":""}$${Math.abs(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`;}
function percent(r:Result){return r.base>0?`${r.amount>0?"+":""}${(r.amount/r.base*100).toFixed(2)}%`:"—";}
export function ResultProvider({children}:{children:ReactNode}){
 const [result,setResult]=useState<Result|null>(null);
 return <ResultContext.Provider value={setResult}>{children}{result&&createPortal(<ResultScreen result={result} close={()=>setResult(null)}/>,document.body)}</ResultContext.Provider>;
}
export function ResultButton({result,label="Показать P&L"}:{result:Result;label?:string}){
 const show=useResult();return <button type="button" className="result-trigger" onClick={()=>show(result)} title="Полноэкранный отчёт">↗ {label}</button>;
}
function ResultScreen({result:r,close}:{result:Result;close:()=>void}){
 const [run,setRun]=useState(0);const [status,setStatus]=useState("");const [busy,setBusy]=useState(false);
 const [file,setFile]=useState<File|null>(null);const [url,setUrl]=useState("");
 const alive=useRef(true);const closeRef=useRef<HTMLButtonElement>(null);const cleanupRef=useRef<()=>void>(()=>{});
 const sign=r.amount>0?"profit":r.amount<0?"loss":"flat";
 const heading=r.amount>0?"ПРИБЫЛЬ":r.amount<0?"УБЫТОК":"БЕЗ ИЗМЕНЕНИЙ";
 useEffect(()=>{alive.current=true;closeRef.current?.focus();return()=>{alive.current=false;cleanupRef.current();};},[]);
 useEffect(()=>{function key(e:KeyboardEvent){if(e.key==="Escape")close();}window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key);},[close]);
 useEffect(()=>()=>{if(url)URL.revokeObjectURL(url);},[url]);
 async function record(){
  if(busy)return;setFile(null);setUrl("");setStatus("");
  const canvas=document.createElement("canvas");canvas.width=720;canvas.height=1280;
  const ctx=canvas.getContext("2d");
  if(!ctx || typeof canvas.captureStream!=="function" || typeof MediaRecorder==="undefined"){setStatus("Запись видео недоступна в этом браузере. Можно повторить анимацию и использовать запись экрана телефона.");return;}
  let stream:MediaStream|undefined;let timer=0;let raf=0;let recorder:MediaRecorder|undefined;
  try{
   const mime=["video/webm;codecs=vp9","video/webm;codecs=vp8","video/webm","video/mp4"].find(x=>MediaRecorder.isTypeSupported(x));
   stream=canvas.captureStream(30); recorder=mime?new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:3_000_000}):new MediaRecorder(stream);
   const rec=recorder;const chunks:Blob[]=[];setBusy(true);setStatus("Создаём ролик · 4 секунды…");
   cleanupRef.current=()=>{window.clearTimeout(timer);cancelAnimationFrame(raf);if(rec.state!=="inactive")rec.stop();stream?.getTracks().forEach(t=>t.stop());};
   rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
   rec.onerror=()=>{cleanupRef.current();if(alive.current){setBusy(false);setStatus("Не удалось записать видео. Используй запись экрана.");}};
   rec.onstop=()=>{stream?.getTracks().forEach(t=>t.stop());cancelAnimationFrame(raf);if(!alive.current)return;setBusy(false);if(!chunks.length){setStatus("Видео не записалось. Используй запись экрана.");return;}const type=rec.mimeType||chunks[0].type||"video/webm";const ext=type.includes("mp4")?"mp4":"webm";const f=new File(chunks,`wall-street-pnl.${ext}`,{type});setFile(f);setUrl(URL.createObjectURL(f));setStatus("Ролик готов. Сохрани или поделись им.");};
   const color=sign==="profit"?"#39e6aa":sign==="loss"?"#ff667a":"#cbd5e1";
   function text(s:string,x:number,y:number,size:number,fill:string,weight=600){ctx!.fillStyle=fill;ctx!.font=`${weight} ${size}px Arial, sans-serif`;ctx!.textAlign="center";ctx!.fillText(s,x,y,620);}
   const start=performance.now();
   function draw(){const t=Math.min(1,(performance.now()-start)/1200);const ease=1-Math.pow(1-t,3);const g=ctx!.createLinearGradient(0,0,720,1280);g.addColorStop(0,"#071018");g.addColorStop(1,sign==="profit"?"#103a30":sign==="loss"?"#391824":"#18202c");ctx!.fillStyle=g;ctx!.fillRect(0,0,720,1280);ctx!.strokeStyle="#ffffff12";ctx!.lineWidth=1;for(let i=0;i<720;i+=60){ctx!.beginPath();ctx!.moveTo(i,0);ctx!.lineTo(i,1280);ctx!.stroke();}for(let i=0;i<1280;i+=60){ctx!.beginPath();ctx!.moveTo(0,i);ctx!.lineTo(720,i);ctx!.stroke();}
    text("WALL STREET",360,125,34,"#ffffff",800);text("RISE OF THE TRADER",360,163,17,"#a0afc2");text(r.title,360,330,34,"#cbd5e1");text(heading,360,410,28,color,800);text(money(r.amount*ease),360,535,88,color,900);text(percent(r),360,610,43,color,800);
    ctx!.strokeStyle=color;ctx!.lineWidth=9;ctx!.lineJoin="round";ctx!.lineCap="round";ctx!.beginPath();const points=[0,0.16,0.09,0.43,0.35,0.69,0.57,1];points.forEach((v,i)=>{const x=90+i*77;const y=850-(sign==="profit"?1:sign==="loss"?-1:0)*v*150*ease;if(i===0)ctx!.moveTo(x,y);else ctx!.lineTo(x,y);});ctx!.stroke();text(r.detail,360,1080,22,"#a0afc2");text("Иллюстрация, не график котировок",360,1115,19,"#a0afc2");text("ИГРОВОЙ РЕЗУЛЬТАТ · ВИРТУАЛЬНЫЕ ДЕНЬГИ",360,1170,19,"#e2e8f0",800);raf=requestAnimationFrame(draw);}
   draw();rec.start();timer=window.setTimeout(()=>{cancelAnimationFrame(raf);if(rec.state!=="inactive")rec.stop();},4000);
  }catch{window.clearTimeout(timer);cancelAnimationFrame(raf);if(recorder&&recorder.state!=="inactive")recorder.stop();stream?.getTracks().forEach(t=>t.stop());setBusy(false);setStatus("Экспорт видео недоступен. Используй запись экрана телефона.");}
 }
 async function share(){if(!file)return;try{if(navigator.canShare?.({files:[file]}) && navigator.share){await navigator.share({files:[file],title:"WALL STREET · P&L"});}else if(url){const a=document.createElement("a");a.href=url;a.download=file.name;a.click();setStatus("Если загрузка не началась, используй запись экрана.");}}catch(e){if(!(e instanceof DOMException && e.name==="AbortError"))setStatus("Не удалось поделиться. Попробуй сохранить файл или записать экран.");}}
 return <div className={`result-screen ${sign}`} role="dialog" aria-modal="true" aria-label="Отчёт о результате">
  <header className="result-top"><span>WALL STREET <small> / P&amp;L REPORT</small></span><button ref={closeRef} className="result-close" onClick={close} aria-label="Закрыть">✕</button></header>
  <div className="result-main" key={run}><div className="result-label">{r.assetId&&<AssetIcon id={r.assetId} size={38}/>} {r.title}</div><div className="result-heading">{heading}</div><div className="result-value">{money(r.amount)}</div><div className="result-percent">{percent(r)}</div>
   <svg className="result-chart" viewBox="0 0 420 140" aria-hidden="true"><defs><linearGradient id="pnlFill" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0" stopColor="currentColor" stopOpacity=".25"/><stop offset="1" stopColor="currentColor" stopOpacity="0"/></linearGradient></defs><path d={sign==="profit"?"M0 120 55 98 100 108 150 62 205 75 260 33 310 48 420 8V140H0Z":sign==="loss"?"M0 8 55 30 100 20 150 66 205 53 260 95 310 80 420 120V140H0Z":"M0 70H420V140H0Z"} fill="url(#pnlFill)"/><path className="result-line" d={sign==="profit"?"M0 120 55 98 100 108 150 62 205 75 260 33 310 48 420 8":sign==="loss"?"M0 8 55 30 100 20 150 66 205 53 260 95 310 80 420 120":"M0 70H420"} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg><small className="result-caption">Иллюстративная анимация, не график котировок</small><p className="result-detail">{r.detail}</p></div>
  <footer className="result-footer"><div className="result-actions"><button className="btn ghost" onClick={()=>setRun(x=>x+1)}>↻ Повторить</button><button className="btn primary" disabled={busy} onClick={record}>{busy?"Запись…":"Создать видео"}</button>{file&&<button className="btn ghost" onClick={share}>Сохранить / поделиться</button>}</div>{status&&<p role="status">{status}</p>}{url&&<video className="result-video" src={url} controls playsInline/>}<small>Учебный симулятор · виртуальные деньги</small></footer>
 </div>;
}
