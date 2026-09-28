/**
 * Questions and words for the mini-games, drawn from the stage's own content.
 *
 * The games shipped with fifteen hard-coded questions or words per stage, so a
 * pupil met the same ones again after a couple of rounds. The modules hold
 * hundreds of exercises that have already been reviewed. These helpers pick
 * the ones that suit a fast game and the games merge them with their own
 * built-in lists, which stay as a fallback when the content cannot be loaded.
 */

import type { StageContent, GrammarExercise } from "./types";

export interface QuizQuestion {
  q: string;
  options: string[];
  correct: number;
}

export interface HangmanWord {
  word: string;
  hint: string;
}

/** Longest option that still reads at a glance in a timed game. */
const MAX_OPTION_LENGTH = 32;
/** Longest question that fits without scrolling on a phone. */
const MAX_QUESTION_LENGTH = 110;

function allExercises(content: StageContent): GrammarExercise[] {
  const modules = [...content.grammar, ...(content.spelling ?? [])];
  return modules.flatMap((m) => m.exercises);
}

function tidy(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/**
 * Multiple-choice exercises short enough for a quick-fire round.
 *
 * Skips questions that depend on a longer text, that have fewer than two
 * options, or that would need the module's help text to make sense.
 */
export function quizQuestionsFromContent(content: StageContent): QuizQuestion[] {
  const seen = new Set<string>();
  const out: QuizQuestion[] = [];
  for (const ex of allExercises(content)) {
    if (ex.type !== "multiple-choice") continue;
    const q = tidy(ex.question);
    const options = ex.options.map(tidy);
    if (q.length === 0 || q.length > MAX_QUESTION_LENGTH) continue;
    if (options.length < 2 || options.length > 4) continue;
    if (options.some((o) => o.length === 0 || o.length > MAX_OPTION_LENGTH)) continue;
    if (ex.correctIndex < 0 || ex.correctIndex >= options.length) continue;
    // Keyed on the options too: many exercises share a stem such as "Vilket
    // ord stavas rätt?" and differ only in the choices, so keying on the
    // question alone threw away every one after the first.
    const key = quizKey({ q, options });
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ q, options, correct: ex.correctIndex });
  }
  return out;
}

/**
 * Identity of a quiz question for de-duplication: the question text plus its
 * options in sorted order, so the same question with shuffled options is still
 * one question, while two questions that only share a stem are two.
 */
export function quizKey(item: { q: string; options: string[] }): string {
  const opts = item.options.map((o) => tidy(o).toLowerCase()).sort();
  return `${tidy(item.q).toLowerCase()}\u0000${opts.join("\u0001")}`;
}

/** A single Swedish word the on-screen keyboard can spell: letters only, 3–12 long. */
const HANGMAN_WORD = /^[A-ZÅÄÖ]{3,12}$/;

function asHangmanWord(raw: string, hint: string): HangmanWord | null {
  const word = tidy(raw).toUpperCase();
  const cleanHint = tidy(hint);
  if (!HANGMAN_WORD.test(word) || cleanHint.length === 0) return null;
  // A hint that spells out the answer is no hint at all.
  if (cleanHint.toUpperCase().includes(word)) return null;
  return { word, hint: cleanHint };
}

/**
 * Words with a hint, from the exercises that already pair the two: the
 * listen-and-spell words, the word riddles and the word-search clues.
 */
export function hangmanWordsFromContent(content: StageContent): HangmanWord[] {
  const seen = new Set<string>();
  const out: HangmanWord[] = [];
  const add = (w: HangmanWord | null) => {
    if (!w || seen.has(w.word)) return;
    seen.add(w.word);
    out.push(w);
  };

  for (const ex of allExercises(content)) {
    if (ex.type === "listen-spell") {
      add(asHangmanWord(ex.word, ex.hint ?? ex.sentence ?? ""));
    } else if (ex.type === "word-clues") {
      add(asHangmanWord(ex.answer, ex.clues.slice(0, 2).join(" · ")));
    }
  }
  for (const mod of content.wordsearch ?? []) {
    for (const w of mod.words) add(asHangmanWord(w.word, w.clue));
  }
  return out;
}

/**
 * The game's own list first, then everything from the content that is not
 * already in it. Order is left to the caller's shuffle.
 */
export function mergeUnique<T>(seed: T[], extra: T[], key: (item: T) => string): T[] {
  const seen = new Set(seed.map(key));
  const out = [...seed];
  for (const item of extra) {
    const k = key(item);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out;
}

/** Fisher–Yates shuffle into a new array. */
export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * The options in a fresh order, with the index of the right one moved along.
 *
 * The built-in questions mostly have the answer second, so a pupil who always
 * pressed B scored well without reading. Used by the boss and the quiz games.
 */
export function shuffleOptions(
  options: readonly string[],
  correctIndex: number
): { options: string[]; correctIndex: number } {
  const order = shuffle(options.map((_, i) => i));
  return { options: order.map((i) => options[i]), correctIndex: order.indexOf(correctIndex) };
}

/** A quiz deck in a fresh order, each question with its options shuffled too. */
export function dealQuiz(questions: readonly QuizQuestion[]): QuizQuestion[] {
  return shuffle(questions).map((item) => {
    const { options, correctIndex } = shuffleOptions(item.options, item.correct);
    return { ...item, options, correct: correctIndex };
  });
}

/** Points per correct answer in Tidsattack. */
export const TIDSATTACK_POINTS_PER_CORRECT = 10;
/** Points per coin (correct answer) in Samla mynt. */
export const SAMLA_MYNT_POINTS_PER_COIN = 15;

/** Points per pair on a perfect Memory round, so more pairs pay more. */
export const MEMORY_POINTS_PER_PAIR = 20;
/** Points lost for each attempt beyond the one-per-pair minimum. */
export const MEMORY_MISS_PENALTY = 3;
/** Seconds per pair that are free before the clock starts to cost points. */
export const MEMORY_FREE_SECONDS_PER_PAIR = 5;
/** Every this many seconds past the free time costs one point. */
export const MEMORY_SECONDS_PER_POINT = 4;
/** Least a finished Memory round pays. */
export const MEMORY_MIN_SCORE = 10;

/**
 * A finished Memory round's score.
 *
 * The old formula (180 − 3 per attempt − 1 per 4 s) gave every size of board
 * the same ceiling, so the hard board, which needs more attempts and more time
 * even when played perfectly, always scored less than the easy one. Now the
 * ceiling grows with the pairs (4 → 80, 6 → 120, 9 → 180, the old maximum),
 * and only attempts and time beyond what the board itself needs cost points.
 */
export function memoryScore(pairs: number, moves: number, seconds: number): number {
  const base = pairs * MEMORY_POINTS_PER_PAIR;
  const extraMoves = Math.max(0, moves - pairs);
  const extraSeconds = Math.max(0, seconds - pairs * MEMORY_FREE_SECONDS_PER_PAIR);
  const score = base - extraMoves * MEMORY_MISS_PENALTY - Math.floor(extraSeconds / MEMORY_SECONDS_PER_POINT);
  return Math.max(MEMORY_MIN_SCORE, score);
}
