/**
 * MiniCharts.tsx — линейный график капитала и круговая диаграмма портфеля.
 */
import { useEffect, useRef } from "react";
import { fmtMoney } from "@/game/utils";
import { gameDate } from "@/game/engine";
import { ASSET_MAP } from "@/game/data";

export function LineChart({ data, height = 220, color = "#3b82f6" }: { data: { t: number; v: number }[]; height?: number; color?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = wrap.clientWidth;
      const H = height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (data.length < 2) {
        ctx.fillStyle = "#5b6b82";
        ctx.font = "12px ui-sans-serif, system-ui";
        ctx.fillText("Собираются данные…", 14, H / 2);
        return;
      }
      const pad = 8;
      let mn = Infinity, mx = -Infinity;
      for (const p of data) { mn = Math.min(mn, p.v); mx = Math.max(mx, p.v); }
      if (mx - mn < 1e-9) { mx += 1; mn -= 1; }
      const up = data[data.length - 1].v >= data[0].v;
      const col = up ? "#16c784" : "#ea3943";
      const xOf = (i: number) => pad + (i / (data.length - 1)) * (W - pad * 2 - 50);
      const yOf = (v: number) => pad + ((mx - v) / (mx - mn)) * (H - pad * 2 - 18);

      // сетка
      ctx.strokeStyle = "#1a2230";
      ctx.fillStyle = "#5b6b82";
      ctx.font = "10px ui-monospace, monospace";
      for (let i = 0; i <= 3; i++) {
        const y = pad + ((H - pad * 2 - 18) * i) / 3;
        ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - 50, y); ctx.stroke();
        ctx.fillText(fmtMoney(mx - ((mx - mn) * i) / 3), W - 46, y + 3);
      }
      // заливка
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, up ? "rgba(22,199,132,0.25)" : "rgba(234,57,67,0.25)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath();
      data.forEach((p, i) => { const x = xOf(i), y = yOf(p.v); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
      ctx.lineTo(xOf(data.length - 1), H - 18); ctx.lineTo(xOf(0), H - 18); ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
      // линия
      ctx.beginPath();
      data.forEach((p, i) => { const x = xOf(i), y = yOf(p.v); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.8;
      ctx.stroke();
      // метки времени
      ctx.textAlign = "center";
      const first = data[0], last = data[data.length - 1];
      ctx.fillText(gameDate(first.t).date, xOf(0) + 30, H - 5);
      ctx.fillText(gameDate(last.t).date, xOf(data.length - 1) - 30, H - 5);
      ctx.textAlign = "left";
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [data, height]);

  return (
    <div ref={wrapRef} style={{ width: "100%" }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

interface Slice { label: string; value: number; color: string; }

export function DonutChart({ slices, size = 220 }: { slices: Slice[]; size?: number }) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr; canvas.height = size * dpr;
    canvas.style.width = `${size}px`; canvas.style.height = `${size}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    const cx = size / 2, cy = size / 2;
    const r = size / 2 - 10;
    const inner = r * 0.62;
    let ang = -Math.PI / 2;
    for (const s of slices) {
      if (s.value <= 0) continue;
      const frac = s.value / (total || 1);
      const a2 = ang + frac * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, ang, a2);
      ctx.arc(cx, cy, inner, a2, ang, true);
      ctx.closePath();
      ctx.fillStyle = s.color;
      ctx.fill();
      ang = a2;
    }
    ctx.fillStyle = "#e6edf3";
    ctx.font = `bold ${Math.round(size / 11)}px ui-sans-serif, system-ui`;
    ctx.textAlign = "center";
    ctx.fillText(fmtMoney(total), cx, cy - 2);
    ctx.font = `${Math.round(size / 16)}px ui-sans-serif, system-ui`;
    ctx.fillStyle = "#5b6b82";
    ctx.fillText("капитал", cx, cy + size / 12);
    ctx.textAlign = "left";
  }, [slices, size]);

  return (
    <div className="donut-wrap">
      <canvas ref={canvasRef} />
      <div className="donut-legend">
        {slices.filter((s) => s.value > 0).sort((a, b) => b.value - a.value).map((s) => (
          <div className="donut-row" key={s.label}>
            <span className="dot" style={{ background: s.color }} />
            <span className="dl-label">{s.label}</span>
            <span className="dl-val">{fmtMoney(s.value)}</span>
            <span className="dl-pct">{total > 0 ? ((s.value / total) * 100).toFixed(1) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function positionSlices(
  positions: Record<string, { qty: number }>,
  assets: Record<string, { price: number }>,
  cash: number
): Slice[] {
  const out: Slice[] = [];
  for (const id in positions) {
    const a = ASSET_MAP[id];
    const p = assets[id];
    if (!a || !p) continue;
    out.push({ label: a.ticker, value: positions[id].qty * p.price, color: a.color });
  }
  if (cash > 0) out.push({ label: "Наличные", value: cash, color: "#3b82f6" });
  return out;
}
