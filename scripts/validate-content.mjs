#!/usr/bin/env node
/**
 * Quality gate for the exercise content.
 *
 * Checks every exercise in public/content/<stage>/content.json for the fault
 * classes found during the content audit: broken facit, ambiguous questions,
 * hints that hand over the answer, and structural mistakes that would show up
 * as a bug for the pupil.
 *
 * Usage:  node scripts/validate-content.mjs
 * Exits 1 if any error is found (warnings alone still exit 0).
 */

import { readFileSync } from "fs";

const STAGES = ["lagstadiet", "mellanstadiet", "hogstadiet", "gymnasiet"];
const errors = [];
const warnings = [];

const norm = (s) => String(s ?? "").replace(/\s+/g, " ").trim().toLowerCase();
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

/** Naming the alternatives — "(de/dem)" or "(de eller dem)" — is the format, not a giveaway. */
const isChoicePair = (text) => /^[a-zåäö]+\s*(?:\/|eller)\s*[a-zåäö]+$/.test(norm(text));

function checkMultipleChoice(ex, where) {
  const options = ex.options ?? [];
  const ci = ex.correctIndex;

  if (!Number.isInteger(ci) || ci < 0 || ci >= options.length) {
    err(where, `correctIndex ${ci} utanför options (${options.length} st)`);
    return;
  }
  if (options.length < 3) warn(where, `bara ${options.length} svarsalternativ`);

  // Compared exactly, not case-folded: the capitalisation and punctuation
  // exercises differ only in case ("karin" / "Karin"), which is the point.
  const seen = new Map();
  for (const o of options) {
    const key = String(o).trim();
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  for (const [value, count] of seen) {
    if (count > 1) err(where, `dubblerat svarsalternativ "${value}" (${count}x) – rätt svar kan räknas som fel`);
  }
  if (options.some((o) => !String(o).trim())) err(where, "tomt svarsalternativ");
}

function checkFillInBlank(ex, where) {
  const question = String(ex.question ?? "");
  const answer = String(ex.answer ?? "").trim();

  if (!answer) return err(where, "tomt answer");
  if (!question.includes("___")) {
    // Some letter exercises mark the gap inline as "__röd"; that still renders
    // sensibly, so it is a style note rather than a broken exercise.
    // Rendered as the question followed by the input box, which is fine.
    warn(where, `saknar ___ i frågan: "${question.slice(0, 60)}"`);
  }

  const alts = (ex.alternativeAnswers ?? []).map(norm);
  if (alts.includes(norm(answer))) warn(where, "answer finns även i alternativeAnswers");

  // Inserting the answer must not repeat the word already next to the gap.
  // Only duplication caused by the answer itself counts — a question may well
  // repeat a word on purpose ("substantivet 'fara'? fara + ___").
  // Parentheticals are stripped first; they restate words by design.
  const stripped = question.replace(/\([^)]*\)/g, "");
  const toWords = (s) => norm(s).split(/[^a-zåäöé]+/).filter(Boolean);
  const answerWords = toWords(answer);
  if (answerWords.length) {
    const [before, after = ""] = stripped.split("___");
    const wordBefore = toWords(before).at(-1);
    const wordAfter = toWords(after)[0];
    const firstAnswer = answerWords[0];
    const lastAnswer = answerWords.at(-1);
    if (firstAnswer.length > 2 && wordBefore === firstAnswer) {
      err(where, `insatt svar dubblerar ordet före luckan: "${wordBefore} ${firstAnswer}"`);
    } else if (lastAnswer.length > 2 && wordAfter === lastAnswer) {
      err(where, `insatt svar dubblerar ordet efter luckan: "${lastAnswer} ${wordAfter}"`);
    }
  }

  // The answer must not be readable straight out of the hint or parenthetical.
  if (answer.length >= 3) {
    // Case-sensitive on purpose: "(börja med 'mamma')" with the answer "Mamma"
    // is a capitalisation exercise, not a giveaway.
    const boundary = new RegExp(`\\b${answer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
    for (const par of question.match(/\(([^)]*)\)/g) ?? []) {
      const inner = par.slice(1, -1);
      if (!isChoicePair(inner) && boundary.test(inner)) {
        err(where, `parentesen avslöjar svaret "${answer}": (${inner.slice(0, 50)})`);
      }
    }
    const hint = String(ex.hint ?? "");
    if (hint && !norm(hint).includes(" eller ") && boundary.test(hint)) {
      err(where, `ledtråden avslöjar svaret "${answer}": ${hint.slice(0, 60)}`);
    }
  }
}

function checkBuildSentence(ex, where) {
  const words = ex.words ?? [];
  const order = ex.correctOrder ?? [];
  const expected = [...words.keys()].join(",");
  if ([...order].sort((a, b) => a - b).join(",") !== expected) {
    err(where, `correctOrder [${order}] är ingen permutation av 0..${words.length - 1}`);
  }
  const sentence = order.map((i) => words[i]).join(" ");
  if (/\s[.,!?]/.test(sentence)) {
    warn(where, `skiljetecken står som egen bricka: "${sentence.slice(0, 60)}"`);
  }
}

/**
 * Punctuation marks a module title promises to cover.
 *
 * A module called "Punkt och frågetecken" had four exercises whose answer was
 * "!" — a mark it never teaches and whose help text never mentions it. A pupil
 * doing that module first met a right answer they had not been shown.
 *
 * Only titles that are nothing but a list of marks are held to this ("Punkt
 * och frågetecken", "Punkt, komma och frågetecken"). A title with any other
 * word in it — "Skiljetecken", "Avancerad interpunktion", "Skriva dialoger –
 * citattecken" — promises a topic rather than a closed set, and a topic may
 * fairly need companion marks such as the colon before a line of speech.
 */
const MARK_NAMES = {
  "punkt": [".", "…"],
  "frågetecken": ["?"],
  "utropstecken": ["!"],
  "komma": [","],
  "kolon": [":"],
  "semikolon": [";"],
  "citattecken": ['"', "\u201d", "\u201c", "\u00bb", "\u00ab"],
  "tankstreck": ["\u2013", "\u2014", "-"],
  "apostrof": ["'", "\u2019"],
};

/** Words that may join mark names without making the title a topic. */
const CONNECTIVES = /\b(och|samt|eller)\b|[,\-\u2013\u2014&]/g;

function promisedMarks(title) {
  let rest = title.toLowerCase();
  const found = new Set();
  // Longest first: "semikolon" contains "kolon", "utropstecken" contains none
  // but the principle holds for any future additions.
  for (const name of Object.keys(MARK_NAMES).sort((a, b) => b.length - a.length)) {
    const word = new RegExp(`\\b${name}(er|en|et)?\\b`, "g");
    if (word.test(rest)) {
      for (const m of MARK_NAMES[name]) found.add(m);
      rest = rest.replace(word, " ");
    }
  }
  // Anything left over means the title names a topic, not a closed set.
  const leftover = rest.replace(CONNECTIVES, " ").replace(/\s+/g, "").trim();
  return leftover.length === 0 ? found : new Set();
}

/** The answer, when it is a bare punctuation mark rather than a word or sentence. */
function bareMarkAnswer(ex) {
  const answer =
    ex.type === "multiple-choice" ? (ex.options ?? [])[ex.correctIndex]
    : ex.type === "fill-in-blank" ? ex.answer
    : null;
  const a = String(answer ?? "").trim();
  return a.length > 0 && a.length <= 2 && !/[\p{L}\p{N}]/u.test(a) ? a : null;
}

for (const stage of STAGES) {
  const path = `public/content/${stage}/content.json`;
  let data;
  try {
    data = JSON.parse(readFileSync(path, "utf-8"));
  } catch (e) {
    err(path, `ogiltig JSON – ${e.message}`);
    continue;
  }

  for (const kind of ["grammar", "spelling"]) {
    const ids = new Set();
    for (const mod of data[kind] ?? []) {
      if (ids.has(mod.id)) err(`${stage}/${kind}`, `modul-id "${mod.id}" förekommer flera gånger`);
      ids.add(mod.id);

      const promised = promisedMarks(mod.title ?? "");

      const stems = new Map();
      (mod.exercises ?? []).forEach((ex, i) => {
        const where = `${stage}/${mod.id}#${i}`;
        if (!String(ex.explanation ?? "").trim()) warn(where, "saknar explanation");

        if (promised.size) {
          const mark = bareMarkAnswer(ex);
          if (mark && ![...mark].every((ch) => promised.has(ch))) {
            err(where, `facit är "${mark}" men modulen heter "${mod.title}" och lovar bara ${[...promised].map((m) => `"${m}"`).join(", ")}`);
          }
        }

        if (ex.type === "multiple-choice") {
          checkMultipleChoice(ex, where);
          const key = `${norm(ex.question)}|${(ex.options ?? []).map(norm).sort().join("|")}`;
          if (stems.has(key)) err(where, `identisk med övning #${stems.get(key)} (samma fråga och alternativ)`);
          else stems.set(key, i);
        } else if (ex.type === "fill-in-blank") {
          checkFillInBlank(ex, where);
        } else if (ex.type === "build-sentence") {
          checkBuildSentence(ex, where);
        } else if (ex.type === "word-clues") {
          if (!String(ex.answer ?? "").trim()) err(where, "tomt answer");
          if (!(ex.clues ?? []).length) err(where, "saknar clues");
        } else if (ex.type === "listen-spell") {
          if (!String(ex.word ?? "").trim()) err(where, "tomt word");
        } else {
          err(where, `okänd övningstyp "${ex.type}"`);
        }
      });
    }
  }

  // Word search words have to fit the 13x13 grid and contain letters only.
  for (const mod of data.wordsearch ?? []) {
    (mod.words ?? []).forEach((w, i) => {
      const word = String(w.word ?? "");
      const where = `${stage}/${mod.id}#${i}`;
      if (word.length > 13) err(where, `"${word}" (${word.length} tecken) får inte plats i rutnätet`);
      if (!/^[A-Za-zÅÄÖåäö]+$/.test(word)) err(where, `"${word}" innehåller annat än bokstäver`);
    });
  }

  for (const mod of data.stavningstest ?? []) {
    (mod.words ?? []).forEach((w, i) => {
      const where = `${stage}/${mod.id}#${i}`;
      if (!String(w.word ?? "").trim()) err(where, "tomt ord");
      if (!String(w.clue ?? "").trim()) err(where, `"${w.word}" saknar ledtråd`);
    });
  }
}

// Exercises repeated verbatim across stages mean no progression between ages.
const across = new Map();
for (const stage of STAGES) {
  const data = JSON.parse(readFileSync(`public/content/${stage}/content.json`, "utf-8"));
  for (const kind of ["grammar", "spelling"]) {
    for (const mod of data[kind] ?? []) {
      for (const ex of mod.exercises ?? []) {
        // Include the options/answer: generic stems such as "Vilken mening är
        // rätt skriven?" recur legitimately with completely different content.
        const key =
          ex.type === "multiple-choice"
            ? `mc|${norm(ex.question)}|${(ex.options ?? []).map(norm).sort().join("|")}`
            : ex.type === "fill-in-blank"
              ? `fib|${norm(ex.question)}|${norm(ex.answer)}`
              : ex.type === "build-sentence"
                ? `bs|${(ex.words ?? []).map(norm).join(" ")}`
                : null;
        if (!key) continue;
        if (!across.has(key)) across.set(key, new Set());
        across.get(key).add(stage);
      }
    }
  }
}
const shared = [...across.values()].filter((s) => s.size > 1).length;
if (shared) warn("progression", `${shared} övningar förekommer ordagrant i flera stadier`);

const line = "=".repeat(72);
console.log(line);
console.log(`INNEHÅLLSKONTROLL — ${errors.length} fel, ${warnings.length} varningar`);
console.log(line);
for (const e of errors) console.log(`  FEL      ${e}`);
if (errors.length && warnings.length) console.log("");
for (const w of warnings) console.log(`  varning  ${w}`);
if (!errors.length) console.log("  Inga fel hittades.");

process.exit(errors.length ? 1 : 0);
