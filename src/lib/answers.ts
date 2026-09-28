/**
 * Answer matching for the free-text exercises.
 *
 * Shared by fill-in-the-blank, word clues and listen-and-spell so they all
 * judge an answer the same way. The rule of thumb: forgive how a pupil types,
 * never forgive what they got wrong. Case, spacing, quote characters and a
 * trailing full stop say nothing about whether the pupil knows the grammar,
 * so they are normalised away before comparing.
 */

/** Single quote characters a keyboard or autocorrect may produce, folded to a plain '. */
const FANCY_QUOTES = /[‘’‚‛′ʼ]/g;

/** Double quote characters – iOS and macOS turn " into ” or “ as you type. */
const FANCY_DOUBLE_QUOTES = /[”“„‟″]/g;

/** Dashes. A Chromebook or school PC keyboard has no key for – or —, so a
 *  pupil types - or -- for the talstreck/tankstreck; the mark itself is right. */
const DASHES = /--|[–—]/g;

/** Trailing sentence punctuation – children routinely end an answer with a full stop. */
const TRAILING_PUNCTUATION = /[.,;:!?]+$/;

/** How strictly an exercise is judged. Mirrors the flags on the exercise itself. */
export interface AnswerFlags {
  /** The capital letter is the point – "mamma" is not accepted for "Mamma". */
  caseSensitive?: boolean;
  /** The punctuation is the point – keep trailing marks, so ” is not accepted for ”,. */
  punctuationStrict?: boolean;
  /** The exercise's question. When it gaps a word ("h___st") and the facit is
   *  the missing letters, the whole word ("häst") is accepted too. */
  question?: string;
}

export function normalizeAnswer(
  value: string,
  caseSensitive = false,
  punctuationStrict = false
): string {
  const tidied = value
    .replace(FANCY_QUOTES, "'")
    .replace(FANCY_DOUBLE_QUOTES, '"')
    .replace(DASHES, "-")
    .replace(/\s+/g, " ")        // collapse double spaces and stray tabs
    .trim();
  // Strip the trailing full stop only when an answer remains in front of it.
  // Some exercises ask for the punctuation mark itself — "Vilket tecken
  // fattas? 'Hur gammal är du ___'" — and stripping there left nothing at all,
  // so the pupil typed the right mark and was marked wrong every time.
  const stripped = punctuationStrict ? tidied : tidied.replace(TRAILING_PUNCTUATION, "").trim();
  const result = stripped.length > 0 ? stripped : tidied;
  return caseSensitive ? result : result.toLowerCase();
}

/**
 * The letters around a single gap inside a word, e.g. ["h", "st"] for
 * "Vilken bokstav saknas? h___st". Null when the gap stands on its own
 * ("Jag ___ hem") or the question has more than one gap.
 */
export function gappedWord(question: string): [string, string] | null {
  if (question.split("___").length !== 2) return null;
  const m = question.match(/([\p{L}]*)___([\p{L}]*)/u);
  if (!m || (!m[1] && !m[2])) return null;
  return [m[1], m[2]];
}

/**
 * True when a built sentence matches the expected one or an accepted variant.
 *
 * Compared as text rather than as tile positions, so a sentence containing the
 * same word twice accepts either tile, and orders that are equally correct can
 * be listed — "Erik och Maja" and "Maja och Erik" are both right in an exercise
 * about capital letters. Capitals are kept: they are usually the point.
 */
export function isSentenceCorrect(built: string, accepted: string[]): boolean {
  const tidy = (s: string) => s.replace(/\s+/g, " ").trim();
  const answer = tidy(built);
  return answer.length > 0 && accepted.some((s) => tidy(s) === answer);
}

/**
 * True when the pupil's answer matches the expected one or any accepted variant.
 *
 * Set caseSensitive for exercises where the capital letter *is* the skill —
 * without it the module about capital letters accepts "mamma" for "Mamma".
 * Set punctuationStrict where the mark is the skill — without it ”, loses its
 * comma and a pupil who left the comma out is marked right.
 * Spacing is forgiven either way. The last argument is either the old
 * caseSensitive boolean or the exercise's flags (see AnswerFlags).
 */
export function isAnswerCorrect(
  given: string,
  expected: string,
  alternatives: string[] = [],
  flags: boolean | AnswerFlags = false
): boolean {
  const { caseSensitive = false, punctuationStrict = false, question } =
    typeof flags === "boolean" ? { caseSensitive: flags } : flags;
  const norm = (s: string) => normalizeAnswer(s, caseSensitive, punctuationStrict);
  const normalised = norm(given);
  if (!normalised) return false;

  const accepted = [expected, ...alternatives];
  // A letter-gap item ("h___st", facit "ä"): the whole word is the same
  // knowledge, and 28 of 53 such items used to reject it while the rest listed
  // it by hand. Only the gap's own facits are expanded, so "hast" stays wrong,
  // and only letter facits: "Vem är din lärare___" asks for the mark alone.
  const gap = question ? gappedWord(question) : null;
  if (gap) {
    const letters = accepted.map((a) => a.trim()).filter((a) => /^\p{L}+$/u.test(a));
    accepted.push(...letters.map((a) => gap[0] + a + gap[1]));
  }

  return accepted.some((a) => norm(a) === normalised);
}
