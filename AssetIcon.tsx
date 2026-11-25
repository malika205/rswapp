import { ASSET_MAP } from "@/game/data";
import type { ReactNode } from "react";

// Local vector symbols; no remote logo services or network dependency.
export default function AssetIcon({ id, size = 26 }: { id: string; size?: number }) {
  const asset = ASSET_MAP[id];
  const color = asset?.color ?? "#94a3b8";
  let symbol: ReactNode;
  switch (id) {
    case "btc": symbol = <text x="16" y="23" fontSize="23" fontWeight="800">₿</text>; break;
    case "eth": symbol = <><path d="M16 3 7 17l9 5 9-5Z" fill="currentColor"/><path d="m7 19 9 10 9-10-9 5Z" fill="currentColor" opacity=".7"/><path d="M16 3v19l9-5Z" fill="#fff" opacity=".3"/></>; break;
    case "sol": symbol = <><path d="M8 8h19l-4 4H4zM4 14h19l4 4H8zM8 20h19l-4 4H4z" fill="currentColor"/></>; break;
    case "xrp": symbol = <path d="m5 7 7 7a6 6 0 0 0 8 0l7-7M5 25l7-7a6 6 0 0 1 8 0l7 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>; break;
    case "doge": symbol = <text x="16" y="23" fontSize="22" fontWeight="800">Ð</text>; break;
    case "ltc": symbol = <text x="16" y="23" fontSize="22" fontWeight="800">Ł</text>; break;
    case "ada": symbol = <>{[0,1,2,3,4,5].map(i => <g key={i} transform={`rotate(${i*60} 16 16)`}><circle cx="16" cy="8" r="2.2"/><circle cx="16" cy="3.5" r="1.1"/></g>)}<circle cx="16" cy="16" r="3"/></>; break;
    case "msft": symbol = <><path fill="#f25022" d="M6 6h9v9H6z"/><path fill="#7fba00" d="M17 6h9v9h-9z"/><path fill="#00a4ef" d="M6 17h9v9H6z"/><path fill="#ffb900" d="M17 17h9v9h-9z"/></>; break;
    case "aapl": symbol = <><path d="M16 11c-8-6-14 3-9 12 4 7 7 3 9 3s5 4 9-3c2-3 3-5 3-6-5-2-6-6-3-9-4-2-6 1-9 3Z"/><path d="M16 9c0-4 3-6 6-6-1 4-3 6-6 6Z"/></>; break;
    case "meta": symbol = <path d="M16 16C10 3 4 10 4 20c0 9 7 6 12-4 6-13 12-6 12 4 0 9-7 6-12-4Z" fill="none" stroke="currentColor" strokeWidth="3"/>; break;
    case "xau": case "xag": case "xpt": symbol = <><path d="m8 12 4-5h9l4 5 3 12H4Z" fill="currentColor"/><text x="16" y="21" fontSize="10" fill="#111827" fontWeight="bold">{id.slice(1).toUpperCase()}</text></>; break;
    case "eurusd": case "gbpusd": case "usdjpy": symbol = <text x="16" y="22" fontSize="20" fontWeight="800">{id === "eurusd" ? "€" : id === "gbpusd" ? "£" : "¥"}</text>; break;
    default: symbol = <text x="16" y="21" fontSize={id === "nvda" ? 11 : 19} fontWeight="800">{({nvda:"NV",tsla:"T",amzn:"a",googl:"G",nflx:"N",ko:"C",mcd:"M"} as Record<string,string>)[id] ?? asset?.ticker.slice(0,2) ?? "?"}</text>;
  }
  return <svg className="asset-icon" aria-hidden="true" width={size} height={size} viewBox="0 0 32 32" style={{color, flexShrink:0}}><circle cx="16" cy="16" r="15" fill="currentColor" opacity=".12"/><circle cx="16" cy="16" r="15" fill="none" stroke="currentColor" opacity=".35"/><g fill="currentColor" textAnchor="middle" fontFamily="Arial, sans-serif">{symbol}</g></svg>;
}
