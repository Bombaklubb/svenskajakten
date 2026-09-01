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
    const key = q.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ q, options, correct: ex.correctIndex });
  }
  return out;
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
