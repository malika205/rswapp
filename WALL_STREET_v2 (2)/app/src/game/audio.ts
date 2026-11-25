/**
 * audio.ts — синтезированные звуковые эффекты (Web Audio API, без внешних файлов).
 */

let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(m: boolean): void {
  muted = m;
}

function ac(): AudioContext | null {
  if (muted) return null;
  try {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, t0: number, dur: number, type: OscillatorType, gain: number): void {
  const c = ac();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, c.currentTime + t0);
  g.gain.exponentialRampToValueAtTime(gain, c.currentTime + t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + t0 + dur);
  osc.connect(g).connect(c.destination);
  osc.start(c.currentTime + t0);
  osc.stop(c.currentTime + t0 + dur + 0.05);
}

export const sfx = {
  click(): void {
    tone(720, 0, 0.06, "square", 0.04);
  },
  buy(): void {
    tone(440, 0, 0.1, "sine", 0.08);
    tone(660, 0.08, 0.14, "sine", 0.08);
  },
  sell(): void {
    tone(660, 0, 0.1, "sine", 0.08);
    tone(440, 0.08, 0.14, "sine", 0.08);
  },
  error(): void {
    tone(180, 0, 0.16, "sawtooth", 0.06);
    tone(140, 0.1, 0.2, "sawtooth", 0.06);
  },
  achievement(): void {
    tone(523, 0, 0.12, "triangle", 0.08);
    tone(659, 0.1, 0.12, "triangle", 0.08);
    tone(784, 0.2, 0.22, "triangle", 0.09);
  },
  levelup(): void {
    tone(392, 0, 0.12, "triangle", 0.08);
    tone(523, 0.1, 0.12, "triangle", 0.08);
    tone(659, 0.2, 0.12, "triangle", 0.08);
    tone(1046, 0.3, 0.3, "triangle", 0.1);
  },
  news(): void {
    tone(880, 0, 0.08, "sine", 0.05);
    tone(1174, 0.09, 0.12, "sine", 0.05);
  },
  money(): void {
    tone(988, 0, 0.07, "square", 0.04);
    tone(1319, 0.06, 0.12, "square", 0.04);
  },
};
