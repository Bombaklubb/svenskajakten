/**
 * Answer matching for the free-text exercises.
 *
 * Shared by fill-in-the-blank, word clues and listen-and-spell so they all
 * judge an answer the same way. The rule of thumb: forgive how a pupil types,
 * never forgive what they got wrong. Case, spacing, quote characters and a
 * trailing full stop say nothing about whether the pupil knows the grammar,
 * so they are normalised away before comparing.
 */

/** Quote characters a keyboard or autocorrect may produce, folded to a plain '. */
const FANCY_QUOTES = /[‘’‚‛′ʼ]/g;

/** Trailing sentence punctuation – children routinely end an answer with a full stop. */
const TRAILING_PUNCTUATION = /[.,;:!?]+$/;

export function normalizeAnswer(value: string, caseSensitive = false): string {
  const tidied = value
    .replace(FANCY_QUOTES, "'")
    .replace(/\s+/g, " ")        // collapse double spaces and stray tabs
    .trim()
    .replace(TRAILING_PUNCTUATION, "")
    .trim();
  return caseSensitive ? tidied : tidied.toLowerCase();
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
 * Spacing and a trailing full stop are still forgiven either way.
 */
export function isAnswerCorrect(
  given: string,
  expected: string,
  alternatives: string[] = [],
  caseSensitive = false
): boolean {
  const normalised = normalizeAnswer(given, caseSensitive);
  if (!normalised) return false;
  return (
    normalised === normalizeAnswer(expected, caseSensitive) ||
    alternatives.some((alt) => normalizeAnswer(alt, caseSensitive) === normalised)
  );
}
