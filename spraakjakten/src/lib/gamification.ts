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
  { points: 500,   type: "silver" },
  { points: 750,   type: "silver" },
  { points: 1000,  type: "gold" },
  { points: 1500,  type: "silver" },
  { points: 2000,  type: "silver" },
  { points: 2500,  type: "gold" },
  { points: 3500,  type: "gold" },
  { points: 5000,  type: "gold" },
  { points: 8000,  type: "emerald" },
  { points: 10000, type: "emerald" },
  { points: 15000, type: "ruby" },
  { points: 20000, type: "ruby" },
  { points: 25000, type: "diamond" },
  { points: 30000, type: "diamond" },
];

export const EXERCISE_CHEST_MILESTONES: { exercises: number; type: ChestType }[] = [
  { exercises: 1,   type: "wood" },
  { exercises: 2,   type: "wood" },
  { exercises: 5,   type: "wood" },
  { exercises: 10,  type: "wood" },
  { exercises: 15,  type: "silver" },
  { exercises: 20,  type: "silver" },
  { exercises: 30,  type: "gold" },
  { exercises: 50,  type: "silver" },
  { exercises: 75,  type: "gold" },
  { exercises: 100, type: "gold" },
  { exercises: 150, type: "emerald" },
  { exercises: 200, type: "emerald" },
  { exercises: 250, type: "ruby" },
  { exercises: 300, type: "ruby" },
  { exercises: 400, type: "diamond" },
  { exercises: 500, type: "diamond" },
];

// ─── Boss battle questions ─────────────────────────────────────────────────────

export const BOSS_QUESTIONS = [
  {
    id: "boss-1",
    type: "multiple-choice" as const,
    question: "Vad heter 'huset' på franska?",
    options: ["la maison", "el casa", "das Haus", "la casa"],
    correctIndex: 0,
    explanation: "På franska heter 'huset' la maison.",
  },
  {
    id: "boss-2",
    type: "multiple-choice" as const,
    question: "Hur säger man 'tack' på spanska?",
    options: ["merci", "gracias", "danke", "obrigado"],
    correctIndex: 1,
    explanation: "På spanska heter 'tack' gracias.",
  },
  {
    id: "boss-3",
    type: "multiple-choice" as const,
    question: "Vad heter 'hund' på tyska?",
    options: ["chien", "perro", "Hund", "dog"],
    correctIndex: 2,
    explanation: "På tyska heter 'hund' Hund.",
  },
  {
    id: "boss-4",
    type: "multiple-choice" as const,
    question: "Hur säger man 'god morgon' på franska?",
    options: ["bonne nuit", "bonjour", "bonsoir", "au revoir"],
    correctIndex: 1,
    explanation: "God morgon/hej på franska är bonjour.",
  },
  {
    id: "boss-5",
    type: "multiple-choice" as const,
    question: "Vad betyder 'agua' på spanska?",
    options: ["eld", "luft", "vatten", "jord"],
    correctIndex: 2,
    explanation: "Agua betyder vatten på spanska.",
  },
  {
    id: "boss-6",
    type: "multiple-choice" as const,
    question: "Hur säger man 'ett' (siffra) på tyska?",
    options: ["un", "uno", "eins", "een"],
    correctIndex: 2,
    explanation: "Siffran ett på tyska är eins.",
  },
  {
    id: "boss-7",
    type: "multiple-choice" as const,
    question: "Vad heter 'katten' på franska?",
    options: ["le chien", "le chat", "le cheval", "le lapin"],
    correctIndex: 1,
    explanation: "Katten på franska är le chat.",
  },
  {
    id: "boss-8",
    type: "multiple-choice" as const,
    question: "Vad betyder 'ich liebe dich' på tyska?",
    options: ["Jag hatar dig", "Jag älskar dig", "Var är du?", "Hur mår du?"],
    correctIndex: 1,
    explanation: "Ich liebe dich betyder 'Jag älskar dig'.",
  },
  {
    id: "boss-9",
    type: "multiple-choice" as const,
    question: "Hur heter 'skolan' på spanska?",
    options: ["l'école", "la escuela", "die Schule", "la scuola"],
    correctIndex: 1,
    explanation: "Skolan på spanska är la escuela.",
  },
  {
    id: "boss-10",
    type: "multiple-choice" as const,
    question: "Vad är det tyska ordet för 'boken'?",
    options: ["le livre", "el libro", "das Buch", "the book"],
    correctIndex: 2,
    explanation: "Boken på tyska är das Buch.",
  },
];

// ─── Chest helpers ────────────────────────────────────────────────────────────

export const CHEST_LABELS: Record<ChestType, string> = {
  wood:    "Träkista",
  silver:  "Silverkista",
  gold:    "Guldkista",
  emerald: "Smaragdkista",
  ruby:    "Rubinkista",
  diamond: "Diamantkista",
};

export const CHEST_EMOJIS: Record<ChestType, string> = {
  wood:    "📦",
  silver:  "🥈",
  gold:    "🏆",
  emerald: "💎",
  ruby:    "💍",
  diamond: "👑",
};

export const CHEST_COLORS: Record<ChestType, string> = {
  wood:    "from-amber-800 to-amber-600",
  silver:  "from-slate-400 to-slate-300",
  gold:    "from-yellow-500 to-amber-400",
  emerald: "from-emerald-600 to-emerald-400",
  ruby:    "from-red-700 to-red-500",
  diamond: "from-sky-400 to-blue-300",
};

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

export function createChest(type: ChestType): Chest {
  return {
    id: `${type}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    type,
    earnedAt: new Date().toISOString(),
    opened: false,
  };
}

export function checkAndAwardChests(
  totalPoints: number,
  exercisesCompleted: number,
  gamData: GamificationData
): { newChests: Chest[]; updatedGam: GamificationData } {
  const newChests: Chest[] = [];
  const updated = { ...gamData };

  // Point milestones
  for (const milestone of POINT_CHEST_MILESTONES) {
    if (
      totalPoints >= milestone.points &&
      !updated.pointsMilestonesRewarded.includes(milestone.points)
    ) {
      const chest = createChest(milestone.type);
      newChests.push(chest);
      updated.chests = [...updated.chests, chest];
      updated.pointsMilestonesRewarded = [...updated.pointsMilestonesRewarded, milestone.points];
    }
  }

  // Exercise milestones
  for (const milestone of EXERCISE_CHEST_MILESTONES) {
    if (
      exercisesCompleted >= milestone.exercises &&
      !updated.exerciseMilestonesRewarded.includes(milestone.exercises)
    ) {
      const chest = createChest(milestone.type);
      newChests.push(chest);
      updated.chests = [...updated.chests, chest];
      updated.exerciseMilestonesRewarded = [...updated.exerciseMilestonesRewarded, milestone.exercises];
    }
  }

  // Boss unlock
  if (exercisesCompleted >= BOSS_UNLOCK_THRESHOLD && !updated.bossUnlocked) {
    updated.bossUnlocked = true;
  }

  return { newChests, updatedGam: updated };
}

export function rollMysteryBox(gamData: GamificationData): {
  reward: MysteryBoxReward | null;
  updatedGam: GamificationData;
} {
  if (Math.random() > MYSTERY_BOX_CHANCE) return { reward: null, updatedGam: gamData };

  const roll = Math.random();
  const updated = { ...gamData };

  if (roll < 0.5) {
    const points = [10, 15, 20, 25, 30, 50][Math.floor(Math.random() * 6)];
    return {
      reward: { type: "points", points, description: `+${points} bonuspoäng!` },
      updatedGam: updated,
    };
  } else if (roll < 0.85) {
    const chest = createChest("wood");
    updated.chests = [...updated.chests, chest];
    return {
      reward: { type: "chest", chestType: "wood", description: "En träkista!" },
      updatedGam: updated,
    };
  } else {
    const badges = ["polyglot", "explorer", "linguist"];
    const badgeId = badges[Math.floor(Math.random() * badges.length)];
    if (!updated.badges.includes(badgeId)) {
      updated.badges = [...updated.badges, badgeId];
    }
    return {
      reward: { type: "badge", badgeId, description: "Ett nytt märke!" },
      updatedGam: updated,
    };
  }
}
