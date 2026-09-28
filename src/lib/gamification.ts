import type {
  ChestType,
  Chest,
  MysteryBoxReward,
  GamificationData,
  StudentData,
  StageId,
} from "./types";
import { localDayKey } from "./dates";

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Completed chapters needed in a world to earn one boss fight there.
 *
 * The boss used to open once, after five chapters anywhere in the app, and then
 * stand open for ever — so it became a way of earning points instead of a
 * reward for earning them. The lock now returns after every fight, and it
 * counts chapters in the world the boss belongs to.
 */
export const BOSS_MODULES_PER_FIGHT = 10;

/** Which bosses belong to which world, easiest world to hardest. */
export const BOSSES_BY_STAGE: Record<StageId, string[]> = {
  lagstadiet:    ["grammatikbossen", "stavningsdrakens"],
  mellanstadiet: ["ordkungen", "grammatikgiganten"],
  hogstadiet:    ["ordmastaren"],
  gymnasiet:     ["sprakprofessorn"],
};

/** How many chapters a pupil has finished in one world, all four kinds counted. */
export function completedModulesInStage(student: StudentData | null, stageId: StageId): number {
  const stage = student?.stages?.[stageId];
  if (!stage) return 0;
  const maps = [
    stage.grammarModules,
    stage.spellingModules,
    stage.wordsearchModules,
    stage.stavningstestModules,
  ];
  return maps.reduce(
    (n, map) => n + Object.values(map ?? {}).filter((m) => m.completed).length,
    0
  );
}

/** Boss fights already won in one world, summed over that world's bosses. */
export function bossWinsInStage(gam: GamificationData | null, stageId: StageId): number {
  const wins = gam?.bossWinsPerBoss ?? {};
  return (BOSSES_BY_STAGE[stageId] ?? []).reduce((n, id) => n + (wins[id] ?? 0), 0);
}

export interface BossGate {
  /** True when a fight is available in this world right now. */
  unlocked: boolean;
  /** Chapters needed in this world for the next fight. */
  needed: number;
  /** Chapters still to go. Zero when unlocked. */
  remaining: number;
  /** Chapters finished in this world. */
  completed: number;
}

/**
 * Whether the pupil has earned a boss fight in this world.
 *
 * Every fight costs another BOSS_MODULES_PER_FIGHT chapters, so the boss is the
 * reward for doing the exercises rather than a way around them.
 */
export function getBossGate(completed: number, winsInStage: number): BossGate {
  const needed = BOSS_MODULES_PER_FIGHT * (winsInStage + 1);
  return {
    unlocked: completed >= needed,
    needed,
    remaining: Math.max(0, needed - completed),
    completed,
  };
}

/** The boss a world offers next: its roster in order, repeating once exhausted. */
export function nextBossForStage(stageId: StageId, winsInStage: number): Boss | undefined {
  const roster = BOSSES_BY_STAGE[stageId] ?? [];
  if (roster.length === 0) return undefined;
  const id = roster[winsInStage % roster.length];
  return BOSSES.find((b) => b.id === id);
}

/**
 * What a boss win pays. The same every time: the chapters spent unlocking the
 * fight are the brake, so a fight that paid nothing would simply stop being a
 * reason to do them.
 */
export const BOSS_MAX_BONUS = 200;
export function bossPayout(boss: Boss): number {
  return Math.min(boss.bonusPoints, BOSS_MAX_BONUS);
}

export const MYSTERY_BOX_CHANCE = 0.15;
export const MAX_CHESTS_PER_TYPE = 30;

/** Version of the chest milestone scale. Bump when the milestones change so
 *  existing saves get migrated instead of paying out everything retroactively.
 *  2: point milestones rebalanced. 3: chapter milestones rescaled to the 169
 *  chapters, counted as first-time passes only. */
export const MILESTONE_SCALE = 3;

/** Points awarded for the first activity of each day (ties into the streak system). */
export const DAILY_LOGIN_BONUS = 50;

/**
 * Points for clearing an item from the "Försök igen" queue.
 *
 * Deliberately below what a first-time correct answer pays (15). The queue is
 * filled by getting something wrong, so a larger reward would mean answering
 * badly on purpose and then fixing it was worth more than knowing the answer —
 * which is what the old random 25–50 did.
 */
export const RETRY_CORRECT_POINTS = 10;

/**
 * Surprise points multiplier rolled when a module is completed.
 * Pure chance (no pattern): ~4% triple points, ~8% double points, otherwise 1.
 * Kept deliberately unpredictable so students can't game it.
 */
export function rollSurpriseMultiplier(): 1 | 2 | 3 {
  const r = Math.random();
  if (r < 0.04) return 3;
  if (r < 0.12) return 2;
  return 1;
}

export function getPointsMultiplier(prevAttempts: number): number {
  if (prevAttempts === 0) return 1.0;
  if (prevAttempts === 1) return 0.7;
  if (prevAttempts === 2) return 0.5;
  if (prevAttempts === 3) return 0.3;
  return 0.2;
}

/**
 * Most points a single mini-game may pay out to one pupil in one day.
 *
 * The mini-games can be restarted endlessly, so without a ceiling they are a
 * faster way to earn points than doing the exercises. The cap is set a little
 * above what a finished module pays so a game is worth playing, but grinding
 * one all afternoon is not the shortest route to the shop.
 */
export const MINIGAME_DAILY_CAP = 400;

/**
 * Replay decay for the mini-games, milder than the one modules use.
 *
 * A module is the same twenty questions every time, so its points fall away
 * quickly. A mini-game deals new words each round, so a pupil who keeps
 * playing is still practising — the curve flattens at 40% rather than 20%.
 */
export function getGamePointsMultiplier(prevPlays: number): number {
  if (prevPlays <= 0) return 1.0;
  if (prevPlays === 1) return 0.8;
  if (prevPlays === 2) return 0.6;
  if (prevPlays === 3) return 0.5;
  return 0.4;
}

/** Points one mini-game has paid this pupil so far today (0 when none, or another day). */
export function getGamePointsToday(student: StudentData | null, gameId: string): number {
  if (!student?.gamePlays || student.gamePlays.date !== localDayKey()) return 0;
  return student.gamePlays.games[gameId]?.points ?? 0;
}

/**
 * What one mini-game round is worth, given how much that game has already paid
 * out today. Kept separate from storage so the rule can be tested on its own.
 */
export function computeGameAward(
  rawPoints: number,
  prevPlays: number,
  pointsToday: number
): { awarded: number; multiplier: number; capped: boolean } {
  const multiplier = getGamePointsMultiplier(prevPlays);
  const wanted = Math.max(0, Math.round(Math.max(0, rawPoints) * multiplier));
  const room = Math.max(0, MINIGAME_DAILY_CAP - Math.max(0, pointsToday));
  const awarded = Math.min(wanted, room);
  return { awarded, multiplier, capped: awarded < wanted };
}

export const POINT_CHEST_MILESTONES: { points: number; type: ChestType }[] = [
  { points: 300,    type: "wood" },
  { points: 500,    type: "wood" },
  { points: 750,    type: "wood" },
  { points: 1000,   type: "wood" },
  { points: 1400,   type: "silver" },
  { points: 1800,   type: "silver" },
  { points: 2300,   type: "wood" },
  { points: 2900,   type: "silver" },
  { points: 3600,   type: "gold" },
  { points: 4400,   type: "silver" },
  { points: 5300,   type: "gold" },
  { points: 6300,   type: "silver" },
  { points: 7500,   type: "gold" },
  { points: 9000,   type: "emerald" },
  { points: 10500,  type: "gold" },
  { points: 12500,  type: "emerald" },
  { points: 14500,  type: "gold" },
  { points: 17000,  type: "emerald" },
  { points: 19500,  type: "ruby" },
  { points: 22500,  type: "emerald" },
  { points: 26000,  type: "ruby" },
  { points: 29500,  type: "diamond" },
  { points: 33500,  type: "ruby" },
  { points: 38000,  type: "diamond" },
  { points: 43000,  type: "ruby" },
  { points: 48000,  type: "diamond" },
  { points: 55000,  type: "hemlig" },
  { points: 65000,  type: "hemlig" },
];

/**
 * Chests for chapters passed for the first time. There are 169 chapters in all
 * (see moduleCounts.ts), so the top milestone sits just below that: every
 * chest on the list can actually be earned. Dense at the start, where a pupil
 * needs early rewards, sparser later. Changing this list means bumping
 * MILESTONE_SCALE so existing saves are migrated (see migrateExerciseMilestones).
 */
export const EXERCISE_CHEST_MILESTONES: { exercises: number; type: ChestType }[] = [
  { exercises: 1,   type: "wood" },
  { exercises: 2,   type: "wood" },
  { exercises: 3,   type: "wood" },
  { exercises: 4,   type: "wood" },
  { exercises: 5,   type: "wood" },
  { exercises: 6,   type: "wood" },
  { exercises: 8,   type: "wood" },
  { exercises: 10,  type: "silver" },
  { exercises: 12,  type: "silver" },
  { exercises: 14,  type: "silver" },
  { exercises: 16,  type: "wood" },
  { exercises: 18,  type: "gold" },
  { exercises: 20,  type: "silver" },
  { exercises: 23,  type: "silver" },
  { exercises: 26,  type: "wood" },
  { exercises: 29,  type: "silver" },
  { exercises: 32,  type: "wood" },
  { exercises: 36,  type: "gold" },
  { exercises: 40,  type: "silver" },
  { exercises: 45,  type: "gold" },
  { exercises: 50,  type: "silver" },
  { exercises: 55,  type: "silver" },
  { exercises: 60,  type: "gold" },
  { exercises: 70,  type: "gold" },
  { exercises: 80,  type: "emerald" },
  { exercises: 90,  type: "emerald" },
  { exercises: 100, type: "emerald" },
  { exercises: 110, type: "ruby" },
  { exercises: 120, type: "ruby" },
  { exercises: 130, type: "diamond" },
  { exercises: 140, type: "diamond" },
  { exercises: 150, type: "hemlig" },
  { exercises: 160, type: "hemlig" },
];

// ─── Achievement → chest rewards ─────────────────────────────────────────────

export const ACHIEVEMENT_CHEST_REWARDS: Record<string, ChestType> = {
  // Lagstadiet – Ordängen
  "lag-5":  "wood",    // Ängsmästare (5 moduler)
  "lag-9":  "silver",  // Ängshjälte  (10 moduler)
  "lag-10": "gold",    // Ängskung    (18 moduler)
  // Mellanstadiet – Berättelseskogen
  "mel-5":  "wood",
  "mel-9":  "silver",
  "mel-10": "gold",
  // Högstadiet – Texthavet
  "hog-5":  "wood",
  "hog-9":  "silver",
  "hog-10": "gold",
  // Gymnasiet – Skrivakademin
  "gym-5":  "wood",
  "gym-9":  "silver",
  "gym-10": "gold",
  // Globala
  "global-2": "wood",    // Fleritdig        (2 stadier)
  "global-3": "silver",  // Världserövrare   (4 stadier)
  "global-5": "gold",    // Mästaren         (500 poäng)
  "global-6": "silver",  // Fotbollsstjärnan (20 moduler)
  "global-7": "gold",    // Svenskaexperten  (1000 poäng)
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
  { label: string; emoji: string; image: string; openImage: string; color: string; borderColor: string; shadowColor: string; description: string; imageClass?: string }
> = {
  wood: {
    label: "Bronskista",
    emoji: "📦",
    image: "/content/bronskista.png",
    openImage: "/content/oppen-kista-brons.png",
    color: "from-amber-600 to-amber-800",
    borderColor: "border-amber-700",
    shadowColor: "shadow-amber-900/40",
    description: "En enkel bronskista med små belöningar.",
  },
  silver: {
    label: "Silverkista",
    emoji: "🪙",
    image: "/content/silverkista.png",
    openImage: "/content/oppen-kista-silver.png",
    color: "from-slate-400 to-slate-600",
    borderColor: "border-slate-500",
    shadowColor: "shadow-slate-700/40",
    description: "En glänsande silverkista med bra belöningar.",
  },
  gold: {
    label: "Guldkista",
    emoji: "🏆",
    image: "/content/guldkista.png",
    openImage: "/content/oppen-kista-guld.png",
    color: "from-yellow-400 to-amber-500",
    borderColor: "border-yellow-500",
    shadowColor: "shadow-yellow-600/40",
    description: "En praktfull guldkista med de bästa belöningarna!",
  },
  emerald: {
    label: "Smaragdkista",
    emoji: "💚",
    image: "/content/smaragdkista.png",
    openImage: "/content/oppen-kista-smaragd.png",
    color: "from-emerald-400 to-emerald-600",
    borderColor: "border-emerald-500",
    shadowColor: "shadow-emerald-700/40",
    description: "En lysande smaragdkista med exklusiva belöningar!",
  },
  ruby: {
    label: "Rubinkista",
    emoji: "❤️",
    image: "/content/rubinkista.png",
    openImage: "/content/oppen-kista-rubin.png",
    color: "from-red-400 to-rose-600",
    borderColor: "border-red-500",
    shadowColor: "shadow-red-700/40",
    description: "En strålande rubinkista med sällsynta belöningar!",
  },
  diamond: {
    label: "Diamantkista",
    emoji: "💎",
    image: "/content/diamantkista.png",
    openImage: "/content/oppen-kista-diamant.png",
    color: "from-sky-300 to-cyan-500",
    borderColor: "border-sky-400",
    shadowColor: "shadow-sky-600/40",
    description: "Den legendariska diamantkistan – den ultimata belöningen!",
  },
  hemlig: {
    label: "Hemliga kistan",
    emoji: "🔒",
    image: "/content/hemligkista.png",
    openImage: "/content/oppen-kista-hemlig.png",
    color: "from-violet-700 to-purple-900",
    borderColor: "border-violet-500",
    shadowColor: "shadow-violet-900/50",
    description: "En unik kista för de allra mest dedikerade – extremt sällsynt!",
    imageClass: "scale-[1.55]",
  },
};

export const ALL_BADGES = [
  { id: "grammar_star",    label: "Grammatikstjärna",  emoji: "⭐" },
  { id: "spelling_ace",   label: "Stavningsmästare",   emoji: "🔤" },
  { id: "curious_learner",label: "Nyfiken lärare",     emoji: "🔍" },
  { id: "word_wizard",    label: "Ordtrollkarl",       emoji: "🪄" },
  { id: "svenska_hero",   label: "Svenskahjälte",      emoji: "🦸" },
  { id: "boss_slayer",    label: "Bossbesegrare",      emoji: "⚔️" },
  { id: "mystery_hunter", label: "Mysteriejägare",     emoji: "🎁" },
];

// ─── Boss challenge (Swedish language) ───────────────────────────────────────

export interface BossQuestion {
  id: string;
  type: "multiple-choice";
  category: "grammar" | "spelling";
  question: string;
  options: string[];
  correctIndex: number;
}

export interface Boss {
  id: string;
  name: string;
  emoji: string;
  subtitle: string;
  difficulty: string;
  difficultyStars: number;
  description: string;
  gradient: string;
  accentColor: string;
  borderColor: string;
  questions: BossQuestion[];
  passThreshold: number;
  bonusPoints: number;
  rewardChestType: ChestType;
}

export const BOSSES: Boss[] = [
  {
    id: "grammatikbossen",
    name: "Grammatikbossen",
    emoji: "👹",
    subtitle: "Grammatik & stavning",
    difficulty: "Mellannivå",
    difficultyStars: 1,
    description: "Bossen testar din grammatik och stavning. Svara rätt på minst 6 av 10 frågor!",
    gradient: "linear-gradient(135deg, #7f1d1d, #991b1b, #dc2626)",
    accentColor: "#dc2626",
    borderColor: "#fca5a5",
    passThreshold: 0.6,
    bonusPoints: 150,
    rewardChestType: "wood",
    questions: [
      { id: "g1", type: "multiple-choice", category: "grammar",
        question: "Vilket alternativ följer skrivregeln om att nämna sig själv sist?",
        options: ["Jag och han gick till affären.", "Han och jag gick till affären.", "Mig och han gick till affären.", "Han och mig gick till affären."],
        correctIndex: 1 },
      { id: "g2", type: "multiple-choice", category: "spelling",
        question: "Hur stavas djuret som säger 'mjau'?",
        options: ["Kat", "Kkat", "Katt", "Kaht"],
        correctIndex: 2 },
      { id: "g3", type: "multiple-choice", category: "grammar",
        question: "Fyll i rätt ord: 'Igår ___ vi på bio.'",
        options: ["är", "var", "hade", "blir"],
        correctIndex: 1 },
      { id: "g4", type: "multiple-choice", category: "grammar",
        question: "Vad betyder ordet 'häpnadsväckande'?",
        options: ["Tråkig", "Liten", "Snabb", "Förvånande och imponerande"],
        correctIndex: 3 },
      { id: "g5", type: "multiple-choice", category: "grammar",
        question: "Vilket är plural av 'ett barn'?",
        options: ["Barns", "Barnen", "Barn", "Barnerna"],
        correctIndex: 2 },
      { id: "g6", type: "multiple-choice", category: "spelling",
        question: "Vilket ord stavas rätt?",
        options: ["Vännar", "Venner", "Vennar", "Vänner"],
        correctIndex: 3 },
      { id: "g7", type: "multiple-choice", category: "grammar",
        question: "Välj rätt ord: 'Det ___ regna imorgon.'",
        options: ["kanske", "möjlig", "trolig", "kan"],
        correctIndex: 3 },
      { id: "g8", type: "multiple-choice", category: "grammar",
        question: "Om någon är 'förtjust', hur mår hen?",
        options: ["Mycket arg", "Mycket glad och nöjd", "Mycket trött", "Mycket ledsen"],
        correctIndex: 1 },
      { id: "g9", type: "multiple-choice", category: "spelling",
        question: "Vilket ord stavas rätt?",
        options: ["Efersom", "Eftesom", "Eftersom", "Eferson"],
        correctIndex: 2 },
      { id: "g10", type: "multiple-choice", category: "grammar",
        question: "Vilken mening är i preteritum (dåtid)?",
        options: ["Igår äter jag pizza.", "Igår åt jag pizza.", "Igår ätande jag pizza.", "Igår ska jag äta pizza."],
        correctIndex: 1 },
    ],
  },
  {
    id: "stavningsdrakens",
    name: "Stavningsdraken",
    emoji: "🐉",
    subtitle: "Avancerad stavning",
    difficulty: "Avancerad",
    difficultyStars: 2,
    description: "Draken sprutar felstavningar! Svara rätt på minst 5 av 8 stavningsfrågor!",
    gradient: "linear-gradient(135deg, #4c1d95, #6d28d9, #7c3aed)",
    accentColor: "#7c3aed",
    borderColor: "#c4b5fd",
    passThreshold: 0.625,
    bonusPoints: 250,
    rewardChestType: "silver",
    questions: [
      { id: "s1", type: "multiple-choice", category: "spelling",
        question: "Vilket ord stavas rätt?",
        options: ["Äventhyr", "Aventyr", "Äventyr", "Äventir"],
        correctIndex: 2 },
      { id: "s2", type: "multiple-choice", category: "spelling",
        question: "Vilket ord stavas rätt?",
        options: ["Framgong", "Framgång", "Framgang", "Framgóng"],
        correctIndex: 1 },
      { id: "s3", type: "multiple-choice", category: "spelling",
        question: "Vilket ord stavas rätt?",
        options: ["Möjlighett", "Möjligheit", "Möyliget", "Möjlighet"],
        correctIndex: 3 },
      { id: "s4", type: "multiple-choice", category: "spelling",
        question: "Vilket alternativ stavas korrekt?",
        options: ["Nästan", "Nastan", "Nästen", "Nestan"],
        correctIndex: 0 },
      { id: "s5", type: "multiple-choice", category: "spelling",
        question: "Vilket ord stavas rätt?",
        options: ["Zorg", "Sorgg", "Sorg", "Sórg"],
        correctIndex: 2 },
      { id: "s6", type: "multiple-choice", category: "spelling",
        question: "Hur stavas 'att tycka om'?",
        options: ["Gila", "Gilla", "Gjilla", "Ghilla"],
        correctIndex: 1 },
      { id: "s7", type: "multiple-choice", category: "spelling",
        question: "Vilket ord stavas rätt?",
        options: ["Hensyn", "Hänsünn", "Hähnsyn", "Hänsyn"],
        correctIndex: 3 },
      { id: "s8", type: "multiple-choice", category: "spelling",
        question: "Vilket ord stavas rätt?",
        options: ["Sälvförtroende", "Självförtoende", "Självförtroende", "Självförtroenede"],
        correctIndex: 2 },
    ],
  },
  {
    id: "ordkungen",
    name: "Ordkungen",
    emoji: "🧙",
    subtitle: "Ordkunskap & läsförståelse",
    difficulty: "Expert",
    difficultyStars: 3,
    description: "Kungen av ord utmanar dig! Svara rätt på minst 5 av 8 svåra frågor om ordkunskap!",
    gradient: "linear-gradient(135deg, #1e3a5f, #1d4ed8, #2563eb)",
    accentColor: "#2563eb",
    borderColor: "#93c5fd",
    passThreshold: 0.625,
    bonusPoints: 400,
    rewardChestType: "gold",
    questions: [
      { id: "o1", type: "multiple-choice", category: "grammar",
        question: "Vad betyder 'perspektiv'?",
        options: ["En sorts kamera", "Synvinkel eller sätt att se på saker", "En matematisk formel", "Ett perspektivglas"],
        correctIndex: 1 },
      { id: "o2", type: "multiple-choice", category: "grammar",
        question: "Vilket ord beskriver 'tillståndet när man inte kan sova'?",
        options: ["Trötthet", "Dåsighet", "Sömnlöshet", "Sömnighet"],
        correctIndex: 2 },
      { id: "o3", type: "multiple-choice", category: "grammar",
        question: "Vad betyder 'vältalig'?",
        options: ["Talar för fort", "Pratar för mycket", "Har en vacker röst", "Duktig på att tala övertygande"],
        correctIndex: 3 },
      { id: "o4", type: "multiple-choice", category: "grammar",
        question: "Vilket ord är en antonym (motsats) till 'frivillig'?",
        options: ["Valfri", "Önskad", "Obligatorisk", "Spontan"],
        correctIndex: 2 },
      { id: "o5", type: "multiple-choice", category: "grammar",
        question: "Vad innebär att 'resonera'?",
        options: ["Att sjunga melodiskt", "Att tänka och argumentera logiskt", "Att reparera något", "Att räkna matematik"],
        correctIndex: 1 },
      { id: "o6", type: "multiple-choice", category: "grammar",
        question: "Vad menas med att en text är 'saklig'?",
        options: ["Den handlar om djur", "Den är skriven på latin", "Den är oseriös", "Den håller sig till fakta utan att vara känslomässig"],
        correctIndex: 3 },
      { id: "o7", type: "multiple-choice", category: "grammar",
        question: "Vad betyder 'paradox'?",
        options: ["En enkel matematisk formel", "En konstig dikt", "En sorts berättelse", "Ett påstående som verkar motsägelsefullt men ändå kan vara sant"],
        correctIndex: 3 },
      { id: "o8", type: "multiple-choice", category: "grammar",
        question: "Vilket ord betyder 'att bekräfta att något är sant'?",
        options: ["Falsifiera", "Verifiera", "Duplicera", "Ignorera"],
        correctIndex: 1 },
    ],
  },
  {
    id: "grammatikgiganten",
    name: "Grammatikgiganten",
    emoji: "🦕",
    subtitle: "Aktiv/passiv & sammansatta ord",
    difficulty: "Mästerlig",
    difficultyStars: 4,
    description: "En gigant som behärskar alla grammatikregler! Svara rätt på minst 7 av 10 avancerade grammatikfrågor!",
    gradient: "linear-gradient(135deg, #064e3b, #065f46, #059669)",
    accentColor: "#059669",
    borderColor: "#6ee7b7",
    passThreshold: 0.7,
    bonusPoints: 600,
    rewardChestType: "emerald",
    questions: [
      { id: "gg1", type: "multiple-choice", category: "grammar",
        question: "Vilken mening är i passiv form?",
        options: ["Kocken lagar maten.", "Maten lagas av kocken.", "Kocken har lagat maten.", "Kocken ska laga maten."],
        correctIndex: 1 },
      { id: "gg2", type: "multiple-choice", category: "grammar",
        question: "Vilket sammansatt ord är korrekt stavat?",
        options: ["Fotbollsspelare", "Fotbolsspelare", "Fotbols-spelare", "Fotbollspelaren"],
        correctIndex: 0 },
      { id: "gg3", type: "multiple-choice", category: "grammar",
        question: "Vilket bindeord passar bäst: 'Jag kom sent ___ bussen var försenad.'?",
        options: ["men", "eller", "eftersom", "fast"],
        correctIndex: 2 },
      { id: "gg4", type: "multiple-choice", category: "grammar",
        question: "Vad är plural av 'en mus'?",
        options: ["Musar", "Möss", "Muser", "Muses"],
        correctIndex: 1 },
      { id: "gg5", type: "multiple-choice", category: "grammar",
        question: "Vilken form är korrekt: 'Vi såg ___ film igår.'?",
        options: ["en rolig", "ett rolig", "den roliga", "roligen"],
        correctIndex: 0 },
      { id: "gg6", type: "multiple-choice", category: "grammar",
        question: "Vilket alternativ är korrekt passiv form av 'Läraren rättar proven'?",
        options: ["Proven rättas av läraren.", "Proven rättar av läraren.", "Proven har rättat av läraren.", "Proven rättades läraren."],
        correctIndex: 0 },
      { id: "gg7", type: "multiple-choice", category: "spelling",
        question: "Vilket ord är korrekt stavat?",
        options: ["Sammanhang", "Samanhang", "Sammannhang", "Samanhand"],
        correctIndex: 0 },
      { id: "gg8", type: "multiple-choice", category: "grammar",
        question: "Vad är bestämd form plural av 'ett hus'?",
        options: ["Husarna", "Huserna", "Husen", "Husna"],
        correctIndex: 2 },
      { id: "gg9", type: "multiple-choice", category: "grammar",
        question: "Vilken mening är grammatiskt korrekt?",
        options: ["Varken Erik eller Maja gillar glass.", "Varken Erik eller Maja gillar inte glass.", "Varken Erik och Maja gillar glass.", "Varken Erik eller inte Maja gillar glass."],
        correctIndex: 0 },
      { id: "gg10", type: "multiple-choice", category: "grammar",
        question: "Vilket ord är ett sammansatt substantiv?",
        options: ["Snabbt", "Skolbag", "Skolgård", "Snabbare"],
        correctIndex: 2 },
    ],
  },
  {
    id: "ordmastaren",
    name: "Ordmästaren",
    emoji: "🧛",
    subtitle: "Ordbildning & avancerat ordförråd",
    difficulty: "Legendar",
    difficultyStars: 5,
    description: "Ordmästaren utmanar dig med de svåraste orden! Svara rätt på minst 7 av 10 frågor för att besegra honom!",
    gradient: "linear-gradient(135deg, #7f1d1d, #9f1239, #e11d48)",
    accentColor: "#e11d48",
    borderColor: "#fda4af",
    passThreshold: 0.7,
    bonusPoints: 800,
    rewardChestType: "ruby",
    questions: [
      { id: "om1", type: "multiple-choice", category: "grammar",
        question: "Vad betyder prefixet 'mis-' i ordet 'missförstånd'?",
        options: ["Mycket", "Fel, dåligt", "Utan", "Över"],
        correctIndex: 1 },
      { id: "om2", type: "multiple-choice", category: "grammar",
        question: "Vilket alternativ är ett substantiverat adjektiv?",
        options: ["Snabb", "De fattiga", "Snabbt", "Snabbare"],
        correctIndex: 1 },
      { id: "om3", type: "multiple-choice", category: "grammar",
        question: "Vilken preposition är korrekt: 'Han är intresserad ___ historia.'?",
        options: ["för", "med", "av", "om"],
        correctIndex: 2 },
      { id: "om4", type: "multiple-choice", category: "grammar",
        question: "Vilket ord tillhör ett mer formellt stilregister?",
        options: ["Kille", "Snubbe", "Ung man", "Prick"],
        correctIndex: 2 },
      { id: "om5", type: "multiple-choice", category: "grammar",
        question: "Vad är synonymt med 'fåfäng'?",
        options: ["Ödmjuk", "Girig", "Självupptagen och inbilsk", "Slarvig"],
        correctIndex: 2 },
      { id: "om6", type: "multiple-choice", category: "grammar",
        question: "Vilket ord är ett adjektiv bildat av substantivet 'sten'?",
        options: ["stening", "stenlig", "stenig", "stenad"],
        correctIndex: 2 },
      { id: "om7", type: "multiple-choice", category: "spelling",
        question: "Vilket ord stavas rätt?",
        options: ["Extraordinnär", "Extraordinär", "Extraordenär", "Extraordiner"],
        correctIndex: 1 },
      { id: "om8", type: "multiple-choice", category: "grammar",
        question: "Vad är antonymen till 'magnifik'?",
        options: ["Stor", "Oansenlig", "Magnifikt", "Magnifikens"],
        correctIndex: 1 },
      { id: "om9", type: "multiple-choice", category: "grammar",
        question: "Vilken preposition är korrekt: 'Boken handlar ___ andra världskriget.'?",
        options: ["med", "för", "om", "av"],
        correctIndex: 2 },
      { id: "om10", type: "multiple-choice", category: "grammar",
        question: "Vad menas med 'konnotation'?",
        options: ["Ordets grundbetydelse", "Ordets känslo- och associationsvärde", "Ordets ursprungsland", "Ordets grammatiska form"],
        correctIndex: 1 },
    ],
  },
  {
    id: "sprakprofessorn",
    name: "Språkprofessorn",
    emoji: "🧠",
    subtitle: "Retorik, satsanalys & texttyper",
    difficulty: "Gudomlig",
    difficultyStars: 6,
    description: "Den allvetande Språkprofessorn utmanar dig med de absolut svåraste frågorna! Klara minst 7 av 10 för att bli en sann språkmästare!",
    gradient: "linear-gradient(135deg, #0c4a6e, #0369a1, #0ea5e9)",
    accentColor: "#0ea5e9",
    borderColor: "#7dd3fc",
    passThreshold: 0.7,
    bonusPoints: 1200,
    rewardChestType: "diamond",
    questions: [
      { id: "sp1", type: "multiple-choice", category: "grammar",
        question: "Vad kallas det retoriska greppet när man upprepar ett ord eller en fras i början av flera meningar?",
        options: ["Metafor", "Anafor", "Ironi", "Allegori"],
        correctIndex: 1 },
      { id: "sp2", type: "multiple-choice", category: "grammar",
        question: "Vad är subjektet i meningen: 'Den gamla katten sov lugnt på soffan.'?",
        options: ["sov", "lugnt", "Den gamla katten", "på soffan"],
        correctIndex: 2 },
      { id: "sp3", type: "multiple-choice", category: "grammar",
        question: "Vilken texttyp har som syfte att övertala läsaren?",
        options: ["Berättande text", "Instruerande text", "Argumenterande text", "Beskrivande text"],
        correctIndex: 2 },
      { id: "sp4", type: "multiple-choice", category: "grammar",
        question: "Vad kallas en bisats som fungerar som ett adjektiv och bestämmer ett substantiv?",
        options: ["Adverbialsats", "Relativsats", "Subjektsats", "Objektsats"],
        correctIndex: 1 },
      { id: "sp5", type: "multiple-choice", category: "grammar",
        question: "Vilket retoriskt begrepp handlar om talarens trovärdighet och karaktär?",
        options: ["Patos", "Logos", "Etos", "Kairos"],
        correctIndex: 2 },
      { id: "sp6", type: "multiple-choice", category: "grammar",
        question: "Vad innebär 'hyperbol' som stilfigur?",
        options: ["Underdrift för komisk effekt", "Överdrift för förstärkt effekt", "Likhet mellan två saker", "Ordlek med dubbel betydelse"],
        correctIndex: 1 },
      { id: "sp7", type: "multiple-choice", category: "grammar",
        question: "Vilken satstyp är 'att han kom sent' i meningen 'Jag visste att han kom sent'?",
        options: ["Adverbialsats", "Relativsats", "Objektsats", "Predikativ"],
        correctIndex: 2 },
      { id: "sp8", type: "multiple-choice", category: "spelling",
        question: "Vilket ord stavas rätt?",
        options: ["Koherent", "Koherant", "Coherent", "Koherrent"],
        correctIndex: 0 },
      { id: "sp9", type: "multiple-choice", category: "grammar",
        question: "Vad kallas den retoriska tekniken att ställa en fråga man inte förväntar sig svar på?",
        options: ["Aposiopes", "Retorisk fråga", "Antites", "Oxymoron"],
        correctIndex: 1 },
      { id: "sp10", type: "multiple-choice", category: "grammar",
        question: "Vilket begrepp beskriver skillnaden mellan vad texten säger och vad som faktiskt menas?",
        options: ["Metafor", "Ironi", "Allegori", "Metonymi"],
        correctIndex: 1 },
    ],
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

/**
 * Returns chests for any exercise milestones the player has already passed
 * but never received – used when new milestones are added after the fact.
 */
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

/**
 * Returns chests for any point milestones the player has already passed
 * but never received – covers imported progress and retroactive milestones.
 */
export function checkMissedPointMilestones(
  currentPoints: number,
  alreadyRewarded: number[]
): { chest: Chest; milestone: number }[] {
  const earned: { chest: Chest; milestone: number }[] = [];
  for (const m of POINT_CHEST_MILESTONES) {
    if (currentPoints >= m.points && !alreadyRewarded.includes(m.points)) {
      earned.push({ chest: makeChest(m.type), milestone: m.points });
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

/** Chapters passed at least once, over every world and all four kinds. */
export function completedChaptersTotal(student: StudentData | null): number {
  const stages: StageId[] = ["lagstadiet", "mellanstadiet", "hogstadiet", "gymnasiet"];
  return stages.reduce((n, id) => n + completedModulesInStage(student, id), 0);
}

/**
 * Move a save from before MILESTONE_SCALE 3 onto the rescaled chapter chests.
 *
 * Old saves counted every finish (failed tries and replays too) against the
 * old list, so both the counter and the rewarded list are replaced:
 *  - the counter becomes the chapters actually passed, which is what it
 *    counts from now on;
 *  - the pupil keeps every chest they already got, and is owed as many chapter
 *    chests as the new list gives for that count — no more, no fewer. The
 *    first `min(owed, alreadyGot)` new milestones are marked as rewarded; any
 *    left over stay open, so the chest page's missed-milestone check hands
 *    exactly those out. Nobody gets a second round of chests for chapters
 *    already paid, and nobody loses chests the new scale says they earned.
 */
export function migrateExerciseMilestones(
  gam: GamificationData,
  completedChapters: number
): Pick<GamificationData, "exercisesCompleted" | "exerciseMilestonesRewarded"> {
  const alreadyGot = new Set(gam.exerciseMilestonesRewarded ?? []).size;
  const owed = EXERCISE_CHEST_MILESTONES.filter((m) => m.exercises <= completedChapters);
  return {
    exercisesCompleted: completedChapters,
    exerciseMilestonesRewarded: owed.slice(0, Math.min(owed.length, alreadyGot)).map((m) => m.exercises),
  };
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

/**
 * Badges a chest can hand out: every one the pupil lacks except "Bossbesegrare",
 * which is only ever earned by beating a boss.
 */
function chestBadgePool(badges: string[]) {
  return ALL_BADGES.filter((b) => b.id !== "boss_slayer" && !badges.includes(b.id));
}

export function openWoodChest(): {
  points: number;
  description: string;
  bonusChest?: Chest;
} {
  const pts = Math.floor(Math.random() * 101) + 20;
  return { points: pts, description: `+${pts} poäng` };
}

export function openSilverChest(badges: string[]): {
  points: number;
  badge?: string;
  bonusChest?: Chest;
  description: string;
} {
  const pts = Math.floor(Math.random() * 101) + 20;
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
    .join(" • ");
  return { points: pts, badge: badge?.id, bonusChest, description: desc };
}

export function openGoldChest(badges: string[]): {
  points: number;
  badge?: string;
  bonusChest?: Chest;
  description: string;
} {
  const pts = Math.floor(Math.random() * 101) + 20;
  const available = chestBadgePool(badges);
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
    .join(" • ");
  return { points: pts, badge: badge?.id, bonusChest, description: desc };
}

export function openEmeraldChest(badges: string[]): {
  points: number;
  badge?: string;
  bonusChest?: Chest;
  description: string;
} {
  const pts = Math.floor(Math.random() * 101) + 20;
  const available = chestBadgePool(badges);
  const badge = available.length > 0
    ? available[Math.floor(Math.random() * available.length)]
    : null;
  const bonusChest = Math.random() < 0.4 ? makeChest("gold") : undefined;
  const desc = [
    `+${pts} poäng`,
    badge ? `Märke: ${badge.label} ${badge.emoji}` : null,
    bonusChest ? "Bonus: Guldkista!" : null,
  ]
    .filter(Boolean)
    .join(" • ");
  return { points: pts, badge: badge?.id, bonusChest, description: desc };
}

export function openRubyChest(badges: string[]): {
  points: number;
  badge?: string;
  bonusChest?: Chest;
  description: string;
} {
  const pts = Math.floor(Math.random() * 101) + 20;
  const available = chestBadgePool(badges);
  const badge = available.length > 0
    ? available[Math.floor(Math.random() * available.length)]
    : null;
  const bonusChest = Math.random() < 0.35 ? makeChest("emerald") : undefined;
  const desc = [
    `+${pts} poäng`,
    badge ? `Märke: ${badge.label} ${badge.emoji}` : null,
    bonusChest ? "Bonus: Smaragdkista!" : null,
  ]
    .filter(Boolean)
    .join(" • ");
  return { points: pts, badge: badge?.id, bonusChest, description: desc };
}

export function openDiamondChest(badges: string[]): {
  points: number;
  badge?: string;
  bonusChest?: Chest;
  description: string;
} {
  const pts = Math.floor(Math.random() * 101) + 20;
  const available = chestBadgePool(badges);
  const badge = available.length > 0
    ? available[Math.floor(Math.random() * available.length)]
    : null;
  const bonusChest = Math.random() < 0.5 ? makeChest("ruby") : undefined;
  const desc = [
    `+${pts} poäng`,
    badge ? `Märke: ${badge.label} ${badge.emoji}` : null,
    bonusChest ? "Bonus: Rubinkista!" : null,
  ]
    .filter(Boolean)
    .join(" • ");
  return { points: pts, badge: badge?.id, bonusChest, description: desc };
}

export function openHemligChest(badges: string[]): {
  points: number;
  badge?: string;
  bonusChest?: Chest;
  description: string;
} {
  const pts = Math.floor(Math.random() * 201) + 100;
  const available = chestBadgePool(badges);
  const badge = available.length > 0
    ? available[Math.floor(Math.random() * available.length)]
    : null;
  const bonusChest = Math.random() < 0.6 ? makeChest("diamond") : undefined;
  const desc = [
    `+${pts} poäng`,
    badge ? `Märke: ${badge.label} ${badge.emoji}` : null,
    bonusChest ? "Bonus: Diamantkista!" : null,
  ]
    .filter(Boolean)
    .join(" • ");
  return { points: pts, badge: badge?.id, bonusChest, description: desc };
}

export interface ChestOpening {
  /** The gamification data with the chest opened and any reward applied. */
  gam: GamificationData;
  chest: Chest;
  points: number;
  badge?: string;
  /** A bonus chest that was actually added (after the cap). */
  bonusChest?: Chest;
  description: string;
}

/**
 * Open one chest in `gam` and return the new data plus what it gave, or null
 * when the chest does not exist or is already open. Pure: the caller saves the
 * result and pays out the points. Callers should pass freshly loaded data so a
 * chest cannot be opened, and paid out, twice.
 */
export function openChest(gam: GamificationData, chestId: string): ChestOpening | null {
  const chest = gam.chests.find((c) => c.id === chestId);
  if (!chest || chest.opened) return null;

  let result: { points: number; badge?: string; bonusChest?: Chest; description: string };
  if (chest.type === "wood") result = openWoodChest();
  else if (chest.type === "silver") result = openSilverChest(gam.badges);
  else if (chest.type === "gold") result = openGoldChest(gam.badges);
  else if (chest.type === "emerald") result = openEmeraldChest(gam.badges);
  else if (chest.type === "ruby") result = openRubyChest(gam.badges);
  else if (chest.type === "diamond") result = openDiamondChest(gam.badges);
  else result = openHemligChest(gam.badges);

  const chests = gam.chests.map((c) =>
    c.id === chestId ? { ...c, opened: true, openedReward: result.description } : c
  );
  const bonusChest = result.bonusChest && capNewChests(chests, [result.bonusChest]).length > 0
    ? result.bonusChest
    : undefined;
  if (bonusChest) chests.push(bonusChest);
  const badges = result.badge && !gam.badges.includes(result.badge)
    ? [...gam.badges, result.badge]
    : gam.badges;

  return {
    gam: { ...gam, chests, badges },
    chest,
    points: result.points,
    badge: result.badge,
    bonusChest,
    description: result.description,
  };
}

/**
 * The chests from `toAdd` that fit under MAX_CHESTS_PER_TYPE.
 *
 * The cap limits how many of a kind can wait unopened, so a pile of the same
 * chest cannot build up. Opened chests are trophies and do not count — they
 * used to, which turned the cap into a lifetime limit on earning a kind.
 */
export function capNewChests(existing: Chest[], toAdd: Chest[]): Chest[] {
  const counts: Partial<Record<ChestType, number>> = {};
  for (const c of existing) {
    if (!c.opened) counts[c.type] = (counts[c.type] ?? 0) + 1;
  }
  const result: Chest[] = [];
  for (const c of toAdd) {
    const current = counts[c.type] ?? 0;
    if (current < MAX_CHESTS_PER_TYPE) {
      result.push(c);
      counts[c.type] = current + 1;
    }
  }
  return result;
}

export function defaultGamificationData(): GamificationData {
  return {
    // A new save starts on the current scale; without this the old-save
    // migration in loadGamification ran for every new pupil.
    milestoneScale: MILESTONE_SCALE,
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
