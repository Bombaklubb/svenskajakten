/**
 * Tests for answer matching in the free-text exercises.
 *
 * Every case here comes from something a pupil actually typed, or from a fault
 * found while reading the content: a trailing full stop, a digit instead of a
 * word, or a lowercase answer slipping through the module about capital letters.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { isAnswerCorrect, isSentenceCorrect, normalizeAnswer } from "../src/lib/answers.ts";

describe("förlåtande stavning av samma svar", () => {
  test("skiftläge spelar ingen roll som standard", () => {
    assert.ok(isAnswerCorrect("HUND", "hund"));
    assert.ok(isAnswerCorrect("hund", "Hund"));
  });

  test("avslutande punkt underkänner inte ett rätt svar", () => {
    // A child ending the answer with a full stop is the reported bug.
    assert.ok(isAnswerCorrect("De tre pojkarna.", "De tre pojkarna"));
    assert.ok(isAnswerCorrect("hund!", "hund"));
    assert.ok(isAnswerCorrect("hund?", "hund"));
  });

  test("extra mellanslag städas bort", () => {
    assert.ok(isAnswerCorrect("  de tre   pojkarna ", "De tre pojkarna"));
  });

  test("krusiga apostrofer jämställs med raka", () => {
    assert.ok(isAnswerCorrect("barnets’ bok", "barnets' bok"));
  });

  test("tomt svar är aldrig rätt", () => {
    assert.equal(isAnswerCorrect("", "hund"), false);
    assert.equal(isAnswerCorrect("   ", "hund"), false);
    assert.equal(isAnswerCorrect(".", "hund"), false);
  });

  test("fel svar är fortfarande fel", () => {
    assert.equal(isAnswerCorrect("katt", "hund"), false);
    assert.equal(isAnswerCorrect("hundar", "hund"), false);
  });
});

describe("godkända varianter", () => {
  test("alternativa svar accepteras", () => {
    assert.ok(isAnswerCorrect("pojkarna", "De tre pojkarna", ["pojkarna"]));
    assert.ok(isAnswerCorrect("De 3 pojkarna", "De tre pojkarna", ["de 3 pojkarna"]));
  });

  test("varianter tål samma slarv som huvudsvaret", () => {
    assert.ok(isAnswerCorrect("Pojkarna.", "De tre pojkarna", ["pojkarna"]));
  });
});

describe("versalkänsliga övningar", () => {
  // The "Stor bokstav" module tests the capital letter itself, so folding case
  // there would accept exactly the mistake the exercise is about.
  test("gemener underkänns när versalen är poängen", () => {
    assert.equal(isAnswerCorrect("mamma", "Mamma", [], true), false);
    assert.equal(
      isAnswerCorrect("min kompis heter nova.", "Min kompis heter Nova.", [], true),
      false
    );
  });

  test("rätt versal godkänns", () => {
    assert.ok(isAnswerCorrect("Mamma", "Mamma", [], true));
    assert.ok(isAnswerCorrect("Min kompis heter Nova.", "Min kompis heter Nova.", [], true));
  });

  test("punkt och mellanslag förlåts även i versalläge", () => {
    assert.ok(isAnswerCorrect("Min kompis heter Nova", "Min kompis heter Nova.", [], true));
    assert.ok(isAnswerCorrect(" Mamma ", "Mamma", [], true));
  });
});

describe("normalizeAnswer", () => {
  test("gemenar bara när den får", () => {
    assert.equal(normalizeAnswer("Mamma."), "mamma");
    assert.equal(normalizeAnswer("Mamma.", true), "Mamma");
  });
});

describe("meningsbygge", () => {
  const facit = "Erik och Maja bor i Malmö.";
  const alt = "Maja och Erik bor i Malmö.";

  test("facit godkänns", () => {
    assert.ok(isSentenceCorrect(facit, [facit, alt]));
  });

  test("den likvärdiga ordningen godkänns – det var buggen eleven hittade", () => {
    assert.ok(isSentenceCorrect(alt, [facit, alt]));
  });

  test("fel ordning underkänns fortfarande", () => {
    assert.equal(isSentenceCorrect("Malmö bor i Erik och Maja.", [facit, alt]), false);
  });

  test("versaler måste stämma – meningen handlar om stor bokstav", () => {
    assert.equal(isSentenceCorrect("erik och maja bor i malmö.", [facit, alt]), false);
  });

  test("dubbla mellanslag mellan brickor spelar ingen roll", () => {
    assert.ok(isSentenceCorrect("Erik  och Maja bor i  Malmö.", [facit, alt]));
  });

  test("tom mening är aldrig rätt", () => {
    assert.equal(isSentenceCorrect("   ", [facit, alt]), false);
  });
});
