import type {
  ChestType,
  Chest,
  MysteryBoxReward,
  GamificationData,
} from "./types";

// ─── Constants ────────────────────────────────────────────────────────────────

export const BOSS_UNLOCK_THRESHOLD = 5;
export const MYSTERY_BOX_CHANCE = 0.15;

export const POINT_CHEST_MILESTONES: { points: number; type: ChestType }[] = [
  { points: 10,    type: "wood" },
  { points: 20,    type: "wood" },
  { points: 30,    type: "wood" },
  { points: 50,    type: "wood" },
  { points: 75,    type: "wood" },
  { points: 100,   type: "wood" },
  { points: 200,   type: "wood" },
  { points: 300,   type: "silver" },
  { points: 400,   type: "wood" },
  { points: 500,   type: "silver" },
  { points: 600,   type: "wood" },
  { points: 700,   type: "silver" },
  { points: 750,   type: "silver" },
  { points: 850,   type: "wood" },
  { points: 1000,  type: "gold" },
  { points: 1250,  type: "silver" },
  { points: 1500,  type: "silver" },
  { points: 1750,  type: "wood" },
  { points: 2000,  type: "silver" },
  { points: 2500,  type: "gold" },
  { points: 3000,  type: "silver" },
  { points: 3500,  type: "gold" },
  { points: 4000,  type: "silver" },
  { points: 5000,  type: "gold" },
  { points: 6000,  type: "gold" },
  { points: 7000,  type: "gold" },
  { points: 8000,  type: "gold" },
  { points: 10000, type: "gold" },
  { points: 12000, type: "gold" },
  { points: 15000, type: "gold" },
];

export const EXERCISE_CHEST_MILESTONES: { exercises: number; type: ChestType }[] = [
  { exercises: 1,   type: "wood" },
  { exercises: 2,   type: "wood" },
  { exercises: 3,   type: "wood" },
  { exercises: 4,   type: "wood" },
  { exercises: 5,   type: "wood" },
  { exercises: 7,   type: "wood" },
  { exercises: 10,  type: "wood" },
  { exercises: 12,  type: "silver" },
  { exercises: 15,  type: "silver" },
  { exercises: 20,  type: "silver" },
  { exercises: 25,  type: "wood" },
  { exercises: 30,  type: "gold" },
  { exercises: 35,  type: "silver" },
  { exercises: 40,  type: "silver" },
  { exercises: 45,  type: "wood" },
  { exercises: 50,  type: "silver" },
  { exercises: 55,  type: "wood" },
  { exercises: 60,  type: "gold" },
  { exercises: 70,  type: "silver" },
  { exercises: 75,  type: "gold" },
  { exercises: 80,  type: "silver" },
  { exercises: 90,  type: "silver" },
  { exercises: 100, type: "gold" },
  { exercises: 125, type: "gold" },
  { exercises: 150, type: "gold" },
  { exercises: 200, type: "gold" },
];

// ─── Achievement → chest rewards ─────────────────────────────────────────────

export const ACHIEVEMENT_CHEST_REWARDS: Record<string, ChestType> = {
  // Franska
  "fra-5":  "wood",
  "fra-9":  "silver",
  "fra-10": "gold",
  // Spanska
  "spa-5":  "wood",
  "spa-9":  "silver",
  "spa-10": "gold",
  // Tyska
  "tys-5":  "wood",
  "tys-9":  "silver",
  "tys-10": "gold",
  // Globala
  "global-2": "wood",
  "global-3": "silver",
  "global-5": "gold",
  "global-6": "silver",
  "global-7": "gold",
};

export function chestsEarnedFromAchievements(
  prevUnlocked: string[],
  nowUnlocked: string[],
  alreadyRewarded: string[]
): { chest: Chest; achievementId: string }[] {
  const earned: { chest: Chest; achievementId: string }[] = [];
  for (const id of nowUnlocked) {
    if (
      !prevUnlocked.includes(id) &&
      !alreadyRewarded.includes(id) &&
      ACHIEVEMENT_CHEST_REWARDS[id]
    ) {
      earned.push({ chest: makeChest(ACHIEVEMENT_CHEST_REWARDS[id]), achievementId: id });
    }
  }
  return earned;
}

// ─── Chest reward tables ──────────────────────────────────────────────────────

export const CHEST_META: Record<
  ChestType,
  { label: string; emoji: string; image: string; color: string; borderColor: string; shadowColor: string; description: string }
> = {
  wood: {
    label: "Bronskista",
    emoji: "📦",
    image: "/content/bronskista.png",
    color: "from-amber-600 to-amber-800",
    borderColor: "border-amber-700",
    shadowColor: "shadow-amber-900/40",
    description: "En enkel bronskista med små belöningar.",
  },
  silver: {
    label: "Silverkista",
    emoji: "🪙",
    image: "/content/silverkista.png",
    color: "from-slate-400 to-slate-600",
    borderColor: "border-slate-500",
    shadowColor: "shadow-slate-700/40",
    description: "En glänsande silverkista med bra belöningar.",
  },
  gold: {
    label: "Guldkista",
    emoji: "🏆",
    image: "/content/guldkista.png",
    color: "from-yellow-400 to-amber-500",
    borderColor: "border-yellow-500",
    shadowColor: "shadow-yellow-600/40",
    description: "En praktfull guldkista med de bästa belöningarna!",
  },
};

export const ALL_BADGES = [
  { id: "grammar_star",    label: "Grammatikstjärna",  emoji: "⭐" },
  { id: "vocab_ace",       label: "Ordförrådsmästare", emoji: "📚" },
  { id: "reading_pro",     label: "Läsproffs",         emoji: "📖" },
  { id: "curious_learner", label: "Nyfiken lärare",    emoji: "🔍" },
  { id: "word_wizard",     label: "Ordtrollkarl",      emoji: "🪄" },
  { id: "language_hero",   label: "Språkhjälte",       emoji: "🦸" },
  { id: "boss_slayer",     label: "Bossbesegrare",     emoji: "⚔️" },
  { id: "mystery_hunter",  label: "Mysteriejägare",    emoji: "🎁" },
];

// ─── Boss challenge questions (mixed language) ──────────────────────────────

export interface BossQuestion {
  id: string;
  type: "multiple-choice";
  category: "grammar" | "vocabulary" | "reading";
  question: string;
  options: string[];
  correctIndex: number;
}

export const BOSS_QUESTIONS: BossQuestion[] = [
  {
    id: "bq1",
    type: "multiple-choice",
    category: "vocabulary",
    question: "Vad betyder det franska ordet 'bonjour'?",
    options: ["Hej då", "God dag / Hej", "Tack", "Ursäkta"],
    correctIndex: 1,
  },
  {
    id: "bq2",
    type: "multiple-choice",
    category: "grammar",
    question: "Hur böjer man det spanska verbet 'hablar' (tala) i presens för 'yo' (jag)?",
    options: ["hablo", "hablas", "habla", "hablamos"],
    correctIndex: 0,
  },
  {
    id: "bq3",
    type: "multiple-choice",
    category: "vocabulary",
    question: "Vad betyder det tyska ordet 'Schule'?",
    options: ["Sko", "Skola", "Skuld", "Skylt"],
    correctIndex: 1,
  },
  {
    id: "bq4",
    type: "multiple-choice",
    category: "grammar",
    question: "Vilken artikel är korrekt på franska: '___ maison' (huset)?",
    options: ["le", "la", "les", "un"],
    correctIndex: 1,
  },
  {
    id: "bq5",
    type: "multiple-choice",
    category: "vocabulary",
    question: "Hur säger man 'vatten' på spanska?",
    options: ["agua", "leche", "pan", "café"],
    correctIndex: 0,
  },
  {
    id: "bq6",
    type: "multiple-choice",
    category: "grammar",
    question: "Vad är den tyska artikeln för 'Kind' (barn)?",
    options: ["der", "die", "das", "den"],
    correctIndex: 2,
  },
  {
    id: "bq7",
    type: "multiple-choice",
    category: "reading",
    question: "Vad betyder den franska meningen 'Je m'appelle Pierre'?",
    options: ["Jag bor i Paris", "Jag heter Pierre", "Jag gillar Pierre", "Jag ringer Pierre"],
    correctIndex: 1,
  },
  {
    id: "bq8",
    type: "multiple-choice",
    category: "vocabulary",
    question: "Hur säger man 'familj' på tyska?",
    options: ["Freund", "Familie", "Freiheit", "Farbe"],
    correctIndex: 1,
  },
  {
    id: "bq9",
    type: "multiple-choice",
    category: "grammar",
    question: "Vilket spanskt verb betyder 'att vara' (permanent egenskap)?",
    options: ["estar", "ser", "tener", "haber"],
    correctIndex: 1,
  },
  {
    id: "bq10",
    type: "multiple-choice",
    category: "reading",
    question: "Vad betyder 'Ich bin zwölf Jahre alt' på tyska?",
    options: [
      "Jag bor i tolv hus",
      "Jag har tolv år",
      "Jag är tolv år gammal",
      "Jag fyller tolv år",
    ],
    correctIndex: 2,
  },
];

// ─── Pure helper functions ────────────────────────────────────────────────────

function makeChest(type: ChestType): Chest {
  return {
    id: `chest_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type,
    earnedAt: new Date().toISOString(),
    opened: false,
  };
}

export function chestsEarnedFromPoints(
  prevPoints: number,
  newPoints: number,
  alreadyRewarded: number[]
): { chest: Chest; milestone: number }[] {
  const earned: { chest: Chest; milestone: number }[] = [];
  for (const m of POINT_CHEST_MILESTONES) {
    if (
      prevPoints < m.points &&
      newPoints >= m.points &&
      !alreadyRewarded.includes(m.points)
    ) {
      earned.push({ chest: makeChest(m.type), milestone: m.points });
    }
  }
  return earned;
}

export function checkMissedExerciseMilestones(
  currentCount: number,
  alreadyRewarded: number[]
): { chest: Chest; milestone: number }[] {
  const earned: { chest: Chest; milestone: number }[] = [];
  for (const m of EXERCISE_CHEST_MILESTONES) {
    if (currentCount >= m.exercises && !alreadyRewarded.includes(m.exercises)) {
      earned.push({ chest: makeChest(m.type), milestone: m.exercises });
    }
  }
  return earned;
}

export function chestsEarnedFromExercises(
  prevCount: number,
  newCount: number,
  alreadyRewarded: number[]
): { chest: Chest; milestone: number }[] {
  const earned: { chest: Chest; milestone: number }[] = [];
  for (const m of EXERCISE_CHEST_MILESTONES) {
    if (
      prevCount < m.exercises &&
      newCount >= m.exercises &&
      !alreadyRewarded.includes(m.exercises)
    ) {
      earned.push({ chest: makeChest(m.type), milestone: m.exercises });
    }
  }
  return earned;
}

export function rollMysteryBox(badges: string[]): MysteryBoxReward | null {
  if (Math.random() > MYSTERY_BOX_CHANCE) return null;

  const roll = Math.random();
  if (roll < 0.5) {
    const pts = Math.floor(Math.random() * 41) + 10;
    return {
      type: "points",
      points: pts,
      description: `+${pts} bonuspoäng!`,
    };
  } else if (roll < 0.75) {
    return {
      type: "chest",
      chestType: "wood",
      description: "En bronskista!",
    };
  } else {
    const available = ALL_BADGES.filter(
      (b) => b.id !== "boss_slayer" && !badges.includes(b.id)
    );
    if (available.length === 0) {
      const pts = Math.floor(Math.random() * 41) + 10;
      return {
        type: "points",
        points: pts,
        description: `+${pts} bonuspoäng!`,
      };
    }
    const badge = available[Math.floor(Math.random() * available.length)];
    return {
      type: "badge",
      badgeId: badge.id,
      description: `Märke: ${badge.label} ${badge.emoji}`,
    };
  }
}

export function openWoodChest(): {
  points: number;
  description: string;
  bonusChest?: Chest;
} {
  const pts = Math.floor(Math.random() * 51) + 50;
  return { points: pts, description: `+${pts} poäng` };
}

export function openSilverChest(badges: string[]): {
  points: number;
  badge?: string;
  bonusChest?: Chest;
  description: string;
} {
  const pts = Math.floor(Math.random() * 101) + 100;
  const available = ALL_BADGES.filter(
    (b) => b.id !== "boss_slayer" && !badges.includes(b.id)
  );
  const badge = available.length > 0
    ? available[Math.floor(Math.random() * available.length)]
    : null;
  const bonusChest = Math.random() < 0.5 ? makeChest("wood") : undefined;
  const desc = [
    `+${pts} poäng`,
    badge ? `Märke: ${badge.label} ${badge.emoji}` : null,
    bonusChest ? "Bonus: Bronskista!" : null,
  ]
    .filter(Boolean)
    .join(" \u2022 ");
  return { points: pts, badge: badge?.id, bonusChest, description: desc };
}

export function openGoldChest(badges: string[]): {
  points: number;
  badge?: string;
  bonusChest?: Chest;
  description: string;
} {
  const pts = Math.floor(Math.random() * 301) + 200;
  const available = ALL_BADGES.filter((b) => !badges.includes(b.id));
  const badge = available.length > 0
    ? available[Math.floor(Math.random() * available.length)]
    : null;
  const bonusChest = Math.random() < 0.3 ? makeChest("silver") : undefined;
  const desc = [
    `+${pts} poäng`,
    badge ? `Märke: ${badge.label} ${badge.emoji}` : null,
    bonusChest ? "Bonus: Silverkista!" : null,
  ]
    .filter(Boolean)
    .join(" \u2022 ");
  return { points: pts, badge: badge?.id, bonusChest, description: desc };
}

export function defaultGamificationData(): GamificationData {
  return {
    chests: [],
    badges: [],
    exercisesCompleted: 0,
    bossUnlocked: false,
    bossWins: 0,
    pointsMilestonesRewarded: [],
    exerciseMilestonesRewarded: [],
    achievementsRewarded: [],
  };
}

export function getBadge(id: string) {
  return ALL_BADGES.find((b) => b.id === id);
}
