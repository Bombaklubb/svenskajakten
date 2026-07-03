// ─── Sound effects (Web Audio, no asset files) ────────────────────────────────
// Small synthesized jingles for feedback. Muting is persisted in localStorage.

const MUTE_KEY = "svenskajakten_muted";

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function isMuted(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(MUTE_KEY) === "1";
}

export function setMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
}

interface Note {
  /** Frequency in Hz */
  f: number;
  /** Start time offset in seconds */
  t: number;
  /** Duration in seconds */
  d: number;
  /** Peak gain (default 0.12) */
  g?: number;
  type?: OscillatorType;
}

function play(notes: Note[]) {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;
  for (const n of notes) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = n.type ?? "sine";
    osc.frequency.setValueAtTime(n.f, now + n.t);
    const peak = n.g ?? 0.12;
    gain.gain.setValueAtTime(0, now + n.t);
    gain.gain.linearRampToValueAtTime(peak, now + n.t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);
    osc.connect(gain).connect(ac.destination);
    osc.start(now + n.t);
    osc.stop(now + n.t + n.d + 0.02);
  }
}

/** Bright two-note "ding" for a correct answer. */
export function playCorrect() {
  play([
    { f: 660, t: 0, d: 0.15, type: "triangle" },
    { f: 880, t: 0.1, d: 0.25, type: "triangle" },
  ]);
}

/** Soft low "dunk" for a wrong answer (kind, not punishing). */
export function playWrong() {
  play([
    { f: 220, t: 0, d: 0.2, g: 0.1, type: "sine" },
    { f: 175, t: 0.12, d: 0.3, g: 0.1, type: "sine" },
  ]);
}

/** Cash-register style blip for shop purchases. */
export function playPurchase() {
  play([
    { f: 988, t: 0, d: 0.09, type: "square", g: 0.06 },
    { f: 1319, t: 0.09, d: 0.18, type: "square", g: 0.06 },
  ]);
}

/** Short rising arpeggio fanfare for opening a chest. */
export function playFanfare() {
  play([
    { f: 523, t: 0, d: 0.18, type: "triangle" },
    { f: 659, t: 0.12, d: 0.18, type: "triangle" },
    { f: 784, t: 0.24, d: 0.18, type: "triangle" },
    { f: 1047, t: 0.36, d: 0.45, type: "triangle", g: 0.15 },
  ]);
}

/** Small coin blip (bonus points etc.). */
export function playCoin() {
  play([
    { f: 1175, t: 0, d: 0.08, type: "square", g: 0.05 },
    { f: 1568, t: 0.07, d: 0.2, type: "square", g: 0.05 },
  ]);
}
