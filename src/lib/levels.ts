// ─── Levels (Nivåer) ──────────────────────────────────────────────────────────
// Total points map to a level with a Swedish-learning themed title.

export interface LevelInfo {
  /** 1-based level number */
  level: number;
  title: string;
  /** Points where this level starts */
  min: number;
  /** Points where the next level starts (Infinity at max level) */
  next: number;
  /** 0–1 progress from this level towards the next */
  progress: number;
}

const LEVELS: { min: number; title: string }[] = [
  { min: 0,     title: "Ordnybörjare" },
  { min: 250,   title: "Bokstavsjägare" },
  { min: 600,   title: "Ordsamlare" },
  { min: 1200,  title: "Meningsbyggare" },
  { min: 2500,  title: "Stavningsstjärna" },
  { min: 4500,  title: "Grammatikhjälte" },
  { min: 7500,  title: "Textmästare" },
  { min: 12000, title: "Språkmästare" },
  { min: 20000, title: "Ordtrollkarl" },
  { min: 35000, title: "Svenskalegend" },
];

export function getLevel(totalPoints: number): LevelInfo {
  const pts = Math.max(0, totalPoints);
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (pts >= LEVELS[i].min) idx = i;
  }
  const min = LEVELS[idx].min;
  const next = idx + 1 < LEVELS.length ? LEVELS[idx + 1].min : Infinity;
  const progress = next === Infinity ? 1 : Math.min(1, (pts - min) / (next - min));
  return { level: idx + 1, title: LEVELS[idx].title, min, next, progress };
}

export const MAX_LEVEL = LEVELS.length;
