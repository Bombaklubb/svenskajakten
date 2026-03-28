// ─── Language definitions ─────────────────────────────────────────────────────

export type LanguageId = "franska" | "spanska" | "tyska";

export interface Language {
  id: LanguageId;
  name: string;
  nativeName: string;
  flag: string;
  emoji: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  buttonClass: string;
  description: string;
  locked: boolean;
}

// ─── Exercise types ───────────────────────────────────────────────────────────

export type ExerciseType = "multiple-choice" | "fill-in-blank" | "build-sentence";

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
  hint?: string;
  explanation?: string;
}

export interface BuildSentenceExercise {
  id: string;
  type: "build-sentence";
  instruction: string;
  words: string[];
  correctOrder: number[];
  hint?: string;
  explanation?: string;
}

export type Exercise =
  | MultipleChoiceExercise
  | FillInBlankExercise
  | BuildSentenceExercise;

// ─── Module definitions ───────────────────────────────────────────────────────

export interface VocabularyModule {
  id: string;
  title: string;
  description: string;
  icon: string;
  pointsRequired: number;
  bonusPoints: number;
  helpText?: string[];
  exercises: Exercise[];
}

export interface GrammarModule {
  id: string;
  title: string;
  description: string;
  icon: string;
  pointsRequired: number;
  bonusPoints: number;
  helpText?: string[];
  exercises: Exercise[];
}

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

export interface LanguageContent {
  vocabulary: VocabularyModule[];
  grammar: GrammarModule[];
  wordsearch?: WordSearchModule[];
}

// ─── Student progress ─────────────────────────────────────────────────────────

export interface ModuleProgress {
  moduleId: string;
  completed: boolean;
  points: number;
  attempts: number;
  lastAttempt: string;
}

export interface LanguageProgress {
  languageId: LanguageId;
  vocabularyModules: Record<string, ModuleProgress>;
  grammarModules: Record<string, ModuleProgress>;
  wordsearchModules: Record<string, ModuleProgress>;
}

export interface StudentData {
  avatar?: string;
  name: string;
  selectedLanguage?: LanguageId;
  createdAt: string;
  lastActive: string;
  totalPoints: number;
  languages: Record<LanguageId, LanguageProgress>;
}

// ─── Gamification ─────────────────────────────────────────────────────────────

export type ChestType = "wood" | "silver" | "gold" | "emerald" | "ruby" | "diamond";

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
  chests: Chest[];
  badges: string[];
  exercisesCompleted: number;
  bossUnlocked: boolean;
  bossLastAttempt?: string;
  bossWins: number;
  pointsMilestonesRewarded: number[];
  exerciseMilestonesRewarded: number[];
  achievementsRewarded: string[];
}

// ─── Exercise session ─────────────────────────────────────────────────────────

export interface ExerciseResult {
  exerciseId: string;
  correct: boolean;
  pointsEarned: number;
}
