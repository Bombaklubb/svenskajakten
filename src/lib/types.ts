// ─── Stage / World definitions ───────────────────────────────────────────────

export type StageId = "lagstadiet" | "mellanstadiet" | "hogstadiet" | "gymnasiet";

export interface Stage {
  id: StageId;
  name: string;
  subtitle: string;
  emoji: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  buttonClass: string;
  grades: string;
  description: string;
  locked: boolean;
}

// ─── Exercise types ───────────────────────────────────────────────────────────

export type GrammarExerciseType = "multiple-choice" | "fill-in-blank" | "build-sentence";

export interface MultipleChoiceExercise {
  id: string;
  type: "multiple-choice";
  question: string;
  options: string[];
  correctIndex: number;
  hint?: string;
  explanation?: string;
}

export interface FillInBlankExercise {
  id: string;
  type: "fill-in-blank";
  question: string;
  answer: string;
  alternativeAnswers?: string[];
  /** Set when the capital letter is the point of the exercise, so that
   *  "mamma" is not accepted for "Mamma". */
  caseSensitive?: boolean;
  hint?: string;
  explanation?: string;
}

export interface BuildSentenceExercise {
  id: string;
  type: "build-sentence";
  instruction: string;
  words: string[];
  correctOrder: number[];
  /** Other word orders that are equally correct, e.g. two coordinated names
   *  swapped ("Erik och Maja" / "Maja och Erik"). Given as full sentences. */
  alternativeSentences?: string[];
  hint?: string;
  explanation?: string;
}

export interface WordCluesExercise {
  id: string;
  type: "word-clues";
  clues: string[];
  answer: string;
  alternativeAnswers?: string[];
  hint?: string;
  explanation?: string;
}

export interface ListenSpellExercise {
  id: string;
  type: "listen-spell";
  /** The word to be spoken aloud and spelled by the student */
  word: string;
  /** Optional sentence read after the word to give context */
  sentence?: string;
  hint?: string;
  explanation?: string;
}

export type GrammarExercise =
  | MultipleChoiceExercise
  | FillInBlankExercise
  | BuildSentenceExercise
  | WordCluesExercise
  | ListenSpellExercise;

// ─── Module definitions ───────────────────────────────────────────────────────

export interface GrammarModule {
  id: string;
  title: string;
  description: string;
  icon: string;
  pointsRequired: number;
  bonusPoints: number;
  helpText?: string[];
  exercises: GrammarExercise[];
}

export interface SpellingModule {
  id: string;
  title: string;
  description: string;
  icon: string;
  pointsRequired: number;
  bonusPoints: number;
  helpText?: string[];
  exercises: GrammarExercise[];
}

// ─── Timed Spelling Test ──────────────────────────────────────────────────────

export interface SpellingTimedWord {
  word: string;
  clue: string;
}

export interface SpellingTimedModule {
  id: string;
  title: string;
  description: string;
  icon: string;
  pointsRequired: number;
  bonusPoints: number;
  timeLimit?: number; // seconds, default 60
  words: SpellingTimedWord[];
}

// ─── Word Search ──────────────────────────────────────────────────────────────

export interface WordSearchWord {
  word: string;
  clue: string;
}

export interface WordSearchModule {
  id: string;
  title: string;
  description: string;
  icon: string;
  pointsRequired: number;
  bonusPoints: number;
  words: WordSearchWord[];
}

export interface StageContent {
  grammar: GrammarModule[];
  spelling?: SpellingModule[];
  wordsearch?: WordSearchModule[];
  stavningstest?: SpellingTimedModule[];
}

// ─── Student progress (stored in localStorage) ───────────────────────────────

export interface ModuleProgress {
  moduleId: string;
  completed: boolean;
  points: number;
  attempts: number;
  lastAttempt: string;
}

export interface StageProgress {
  stageId: StageId;
  grammarModules: Record<string, ModuleProgress>;
  spellingModules: Record<string, ModuleProgress>;
  wordsearchModules: Record<string, ModuleProgress>;
  stavningstestModules: Record<string, ModuleProgress>;
}

export type SkinTone = "light" | "light_brown" | "dark";

export interface HeroConfig {
  heroId: string;
  skinTone: SkinTone;
  gender?: "boy" | "girl";
  equippedAttributes: string[];
}

export interface StudentData {
  avatar?: string;
  name: string;
  createdAt: string;
  lastActive: string;
  totalPoints: number;
  stages: Record<StageId, StageProgress>;
  hero?: HeroConfig;
  streak?: number;
  lastStreakDate?: string; // YYYY-MM-DD
  // ─── Shop (Affären) ─────────────────────────────────────
  spentPoints?: number;       // total points spent in the shop (spendable = totalPoints - spentPoints)
  ownedAvatars?: string[];    // avatar ids the student owns
  ownedFrames?: string[];     // frame ids the student owns
  equippedFrame?: string;     // currently equipped frame id ("" / undefined = none)
  ownedThemes?: string[];     // theme ids the student owns
  equippedTheme?: string;     // currently equipped background theme id ("" / undefined = standard)
  ownedEffects?: string[];    // effect ids the student owns
  equippedEffect?: string;    // currently equipped avatar effect id ("" / undefined = none)
  // ─── Mini-games ─────────────────────────────────────────
  /** Today's mini-game payouts, used to decay replays and cap the daily total.
   *  Reset whenever `date` (YYYY-MM-DD) is no longer today. */
  gamePlays?: {
    date: string;
    games: Record<string, { plays: number; points: number }>;
  };
}

// ─── Gamification ─────────────────────────────────────────────────────────────

export type ChestType = "wood" | "silver" | "gold" | "emerald" | "ruby" | "diamond" | "hemlig";

export interface Chest {
  id: string;
  type: ChestType;
  earnedAt: string;
  opened: boolean;
  openedReward?: string;
}

export type MysteryRewardType = "points" | "chest" | "badge";

export interface MysteryBoxReward {
  type: MysteryRewardType;
  points?: number;
  chestType?: ChestType;
  badgeId?: string;
  description: string;
}

export interface GamificationData {
  /** Bumped when the chest milestone scale changes, so old saves can be migrated. */
  milestoneScale?: number;
  chests: Chest[];
  badges: string[];
  exercisesCompleted: number;
  bossUnlocked: boolean;
  bossLastAttempt?: string;
  bossWins: number;
  bossWinsPerBoss?: Record<string, number>;
  pointsMilestonesRewarded: number[];
  exerciseMilestonesRewarded: number[];
  achievementsRewarded: string[];
}

// ─── Retry queue (persisted per student per stage) ────────────────────────────

export interface RetryItem {
  /** Unique key: `${kind}-${moduleId}-${exerciseIndex}` */
  key: string;
  stageId: string;
  kind: "grammar" | "spelling";
  moduleId: string;
  moduleTitle: string;
  moduleIcon: string;
  exercise: GrammarExercise;
  addedAt: string;
}

/** The module a pupil most recently opened, so the start page can offer to resume it. */
export interface LastVisited {
  stageId: StageId;
  kind: "grammar" | "spelling" | "wordsearch" | "stavningstest";
  moduleId: string;
  title: string;
  icon: string;
  at: string; // ISO timestamp
}

// ─── Exercise session (in-memory, not persisted) ──────────────────────────────

export interface ExerciseResult {
  exerciseId: string;
  correct: boolean;
  pointsEarned: number;
}
