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
export type ReadingQuestionType = "on-the-line" | "between-the-lines" | "beyond-the-lines";

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

export interface WordCluesExercise {
  id: string;
  type: "word-clues";
  clues: string[];
  answer: string;
  alternativeAnswers?: string[];
  hint?: string;
  explanation?: string;
}

export type GrammarExercise =
  | MultipleChoiceExercise
  | FillInBlankExercise
  | BuildSentenceExercise
  | WordCluesExercise;

export interface ReadingQuestion {
  id: string;
  type: ReadingQuestionType;
  question: string;
  options: string[];
  correctIndex: number;
  hint?: string;
  explanation?: string;
}

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

export interface ReadingModule {
  id: string;
  title: string;
  description: string;
  icon: string;
  pointsRequired: number;
  bonusPoints: number;
  helpText?: string[];
  text: string;
  author?: string;
  questions: ReadingQuestion[];
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

// ─── Phoneme / Morpheme exercises ────────────────────────────────────────────

export type FonemExerciseType =
  | "sound-choice"       // Hear a phoneme → choose the letter
  | "word-first-sound"   // Hear a word → choose its first sound
  | "blend-sounds"       // Tap individual sounds → choose the word they form
  | "combine-morphemes"  // Tap word parts → choose the compound word
  | "listen-and-write";  // Hear a word → tap letters to spell it

export interface FonemExercise {
  id: string;
  type: FonemExerciseType;
  /** Text passed to SpeechSynthesis (the phoneme, word, or sounds) */
  speakText: string;
  question: string;
  /** For choice-based types: answer alternatives */
  options?: string[];
  correctIndex?: number;
  /** For blend-sounds: the individual sounds e.g. ["s","o","l"] */
  sounds?: string[];
  /** For combine-morphemes: the word parts e.g. ["sol","sken"] */
  morphemes?: string[];
  /** For listen-and-write: the target word */
  answer?: string;
  explanation?: string;
}

export interface FonemModule {
  id: string;
  title: string;
  description: string;
  icon: string;
  level: 1 | 2 | 3;
  pointsRequired: number;
  bonusPoints: number;
  helpText?: string[];
  exercises: FonemExercise[];
}

export interface StageContent {
  grammar: GrammarModule[];
  reading: ReadingModule[];
  spelling?: SpellingModule[];
  wordsearch?: WordSearchModule[];
  stavningstest?: SpellingTimedModule[];
  fonem?: FonemModule[];
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
  readingModules: Record<string, ModuleProgress>;
  spellingModules: Record<string, ModuleProgress>;
  wordsearchModules: Record<string, ModuleProgress>;
  stavningstestModules: Record<string, ModuleProgress>;
  fonemModules?: Record<string, ModuleProgress>;
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

// ─── Exercise session (in-memory, not persisted) ──────────────────────────────

export interface ExerciseResult {
  exerciseId: string;
  correct: boolean;
  pointsEarned: number;
}
