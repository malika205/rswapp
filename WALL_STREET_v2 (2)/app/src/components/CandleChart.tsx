/**
 * CandleChart.tsx — интерактивный свечной график (canvas): зум колесом, панорама перетаскиванием, кроссхейр.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { TIMEFRAMES, buildCandles, candleLabel } from "@/game/charts";
import { fmtPrice } from "@/game/utils";
import type { AssetState, Candle } from "@/game/types";

interface Props {
  asset: AssetState;
  gameMinute: number;
  color: string;
  height?: number;
  compare?: { asset: AssetState; color: string; name: string }[]; // режим сравнения (нормированные линии)
}

const UP = "#16c784";
const DOWN = "#ea3943";

export default function CandleChart({ asset, gameMinute, color, height = 340, compare }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tf, setTf] = useState(60);
  const [view, setView] = useState({ count: 90, right: 0 }); // right = свечей от правого края
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ startX: number; startRight: number } | null>(null);

  const candles = useMemo(
    () => (compare ? [] : buildCandles(asset, gameMinute, tf)),
    [compare, asset, gameMinute, tf]
  );
  const compareSeries = useMemo(() => {
    if (!compare) return [];
    // нормируем к 100 на левом краю видимого окна
    return compare.map((c) => {
      const cs = buildCandles(c.asset, gameMinute, tf);
      return { ...c, candles: cs };
    });
  }, [compare, gameMinute, tf]);

  const maxCount = compare
    ? Math.max(...compareSeries.map((s) => s.candles.length), 10)
    : Math.max(candles.length, 10);

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
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const padR = 62;
      const padT = 10;
      const padB = 22;
      const plotW = W - padR;
      const plotH = H - padT - padB;

      ctx.fillStyle = "#0a0e14";
      ctx.fillRect(0, 0, W, H);

      const count = Math.min(view.count, maxCount);
      const right = Math.min(Math.max(0, view.right), Math.max(0, maxCount - count));
      const data: Candle[] = compare ? [] : candles.slice(Math.max(0, candles.length - count - right), candles.length - right);

      if (compare) {
        // режим сравнения: нормированные линии
        const lines = compareSeries.map((s) => {
          const slice = s.candles.slice(Math.max(0, s.candles.length - count - right), s.candles.length - right);
          const base = slice.length ? slice[0].c : 1;
          return { color: s.color, name: s.name, vals: slice.map((c) => (c.c / base) * 100) };
        });
        let mn = Infinity, mx = -Infinity;
        for (const l of lines) for (const v of l.vals) { mn = Math.min(mn, v); mx = Math.max(mx, v); }
        if (!isFinite(mn)) { mn = 99; mx = 101; }
        const pad = (mx - mn) * 0.1 || 1;
        mn -= pad; mx += pad;
        // сетка
        ctx.strokeStyle = "#1a2230";
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
          const y = padT + (plotH * i) / 4;
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(plotW, y); ctx.stroke();
          const val = mx - ((mx - mn) * i) / 4;
          ctx.fillStyle = "#5b6b82";
          ctx.font = "10px ui-monospace, monospace";
          ctx.fillText(val.toFixed(1), plotW + 6, y + 3);
        }
        const maxLen = Math.max(...lines.map((l) => l.vals.length), 1);
        lines.forEach((l, li) => {
          ctx.strokeStyle = l.color;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          l.vals.forEach((v, i) => {
            const x = (i / Math.max(1, maxLen - 1)) * plotW;
            const y = padT + ((mx - v) / (mx - mn)) * plotH;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          });
          ctx.stroke();
          ctx.fillStyle = l.color;
          ctx.font = "10px ui-monospace, monospace";
          ctx.fillText(l.name, 8, padT + 14 + li * 14);
        });
        return;
      }

      if (data.length < 2) {
        ctx.fillStyle = "#5b6b82";
        ctx.font = "12px ui-sans-serif, system-ui";
        ctx.fillText("Накопление истории…", 16, H / 2);
        return;
      }

      let mn = Infinity, mx = -Infinity;
      for (const c of data) { mn = Math.min(mn, c.l); mx = Math.max(mx, c.h); }
      const padV = (mx - mn) * 0.08 || mx * 0.01;
      mn -= padV; mx += padV;
      const step = plotW / count;
      const bw = Math.max(1, Math.min(13, step * 0.62));
      const yOf = (v: number) => padT + ((mx - v) / (mx - mn)) * plotH;

      // сетка + ценовые метки
      ctx.strokeStyle = "#1a2230";
      ctx.fillStyle = "#5b6b82";
      ctx.font = "10px ui-monospace, monospace";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        const y = padT + (plotH * i) / 5;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(plotW, y); ctx.stroke();
        const val = mx - ((mx - mn) * i) / 5;
        ctx.fillText(fmtPrice(val), plotW + 6, y + 3);
      }
      // временные метки
      const labelEvery = Math.max(1, Math.floor(count / 6));
      ctx.textAlign = "center";
      for (let i = 0; i < data.length; i += labelEvery) {
        const x = (i + 0.5) * step;
        ctx.fillText(candleLabel(data[i].t, tf), x, H - 7);
      }
      ctx.textAlign = "left";

      // свечи
      data.forEach((c, i) => {
        const x = (i + 0.5) * step;
        const up = c.c >= c.o;
        const col = up ? UP : DOWN;
        ctx.strokeStyle = col;
        ctx.fillStyle = col;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, yOf(c.h));
        ctx.lineTo(x, yOf(c.l));
        ctx.stroke();
        const yO = yOf(c.o), yC = yOf(c.c);
        const top = Math.min(yO, yC);
        const hgt = Math.max(1, Math.abs(yC - yO));
        ctx.fillRect(x - bw / 2, top, bw, hgt);
      });

      // линия последней цены
      const last = data[data.length - 1];
      const lastY = yOf(last.c);
      ctx.strokeStyle = color;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(0, lastY); ctx.lineTo(plotW, lastY); ctx.stroke();
      ctx.setLineDash([]);
      const label = fmtPrice(last.c);
      ctx.font = "bold 10px ui-monospace, monospace";
      const tw = ctx.measureText(label).width + 8;
      ctx.fillStyle = last.c >= data[0].o ? UP : DOWN;
      ctx.fillRect(plotW, lastY - 9, tw + 4, 18);
      ctx.fillStyle = "#04120b";
      ctx.fillText(label, plotW + 6, lastY + 3);

      // кроссхейр
      if (hover) {
        const i = Math.min(data.length - 1, Math.max(0, Math.floor(hover.x / step)));
        const c = data[i];
        const cx = (i + 0.5) * step;
        ctx.strokeStyle = "#3b82f6";
        ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H - padB); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, hover.y); ctx.lineTo(plotW, hover.y); ctx.stroke();
        ctx.setLineDash([]);
        const val = mx - ((hover.y - padT) / plotH) * (mx - mn);
        const lbl = fmtPrice(val);
        ctx.fillStyle = "#3b82f6";
        ctx.fillRect(plotW, hover.y - 9, ctx.measureText(lbl).width + 14, 18);
        ctx.fillStyle = "#fff";
        ctx.fillText(lbl, plotW + 6, hover.y + 3);
        // OHLC панель
        const info = `O ${fmtPrice(c.o)}  H ${fmtPrice(c.h)}  L ${fmtPrice(c.l)}  C ${fmtPrice(c.c)}`;
        ctx.fillStyle = "rgba(13,17,23,0.92)";
        ctx.fillRect(8, 8, ctx.measureText(info).width + 16, 20);
        ctx.fillStyle = c.c >= c.o ? UP : DOWN;
        ctx.fillText(info, 16, 22);
      }
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [candles, compareSeries, compare, view, hover, height, color, maxCount, tf]);

  // авто-подгонка при смене ТФ
  useEffect(() => {
    setView({ count: tf >= 43200 ? 60 : tf >= 1440 ? 90 : 120, right: 0 });
  }, [tf]);

  const onWheel = (e: React.WheelEvent) => {
    const dir = e.deltaY > 0 ? 1.15 : 1 / 1.15;
    setView((v) => ({ ...v, count: Math.min(maxCount, Math.max(15, Math.round(v.count * dir))) }));
  };
  const onMouseDown = (e: React.MouseEvent) => {
    dragRef.current = { startX: e.clientX, startRight: view.right };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setHover({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    if (dragRef.current) {
      const step = (rect.width - 62) / Math.min(view.count, maxCount);
      const dx = (e.clientX - dragRef.current.startX) / Math.max(4, step);
      setView((v) => ({ ...v, right: Math.round(dragRef.current!.startRight + dx) }));
    }
  };
  const onMouseUp = () => { dragRef.current = null; };

  return (
    <div className="candle-chart">
      <div className="tf-bar">
        {TIMEFRAMES.map((t) => (
          <button
            key={t.min}
            className={tf === t.min ? "tf-btn active" : "tf-btn"}
            onClick={() => { setTf(t.min); }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div
        ref={wrapRef}
        className="chart-wrap"
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={() => { setHover(null); dragRef.current = null; }}
      >
        <canvas ref={canvasRef} />
      </div>
      <div className="chart-hint">Колесо — масштаб · Перетаскивание — сдвиг</div>
    </div>
  );
}
