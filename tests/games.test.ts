/**
 * Tests for the mini-games and the boss lock.
 *
 * Run with: npm test
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  quizQuestionsFromContent,
  quizKey,
  shuffleOptions,
  dealQuiz,
  memoryScore,
  mergeUnique,
} from "../src/lib/gameContent.ts";
import {
  getBossGate,
  bossWinsInStage,
  BOSS_MODULES_PER_FIGHT,
  BOSSES_BY_STAGE,
} from "../src/lib/gamification.ts";
import type { GamificationData, StageContent } from "../src/lib/types.ts";

describe("frågor med samma lydelse men olika alternativ", () => {
  const content = {
    grammar: [{
      id: "m", title: "M", description: "", icon: "", pointsRequired: 0, bonusPoints: 0,
      exercises: [
        { id: "a", type: "multiple-choice", question: "Vilket ord stavas rätt?", options: ["Vänner", "Venner"], correctIndex: 0 },
        { id: "b", type: "multiple-choice", question: "Vilket ord stavas rätt?", options: ["Eftersom", "Efersom"], correctIndex: 0 },
        { id: "c", type: "multiple-choice", question: "vilket ord stavas rätt?", options: ["Venner", "Vänner"], correctIndex: 1 },
      ],
    }],
  } as unknown as StageContent;

  test("behålls som olika frågor; bara exakta dubbletter slås ihop", () => {
    const qs = quizQuestionsFromContent(content);
    assert.equal(qs.length, 2);
    assert.deepEqual(qs.map((q) => q.options[0]), ["Vänner", "Eftersom"]);
  });

  test("nyckeln bryr sig inte om alternativens ordning", () => {
    assert.equal(
      quizKey({ q: "Fråga?", options: ["a", "b", "c"] }),
      quizKey({ q: "fråga?", options: ["c", "a", "b"] })
    );
    assert.notEqual(
      quizKey({ q: "Fråga?", options: ["a", "b"] }),
      quizKey({ q: "Fråga?", options: ["a", "c"] })
    );
  });

  test("spelets egna frågor slås ihop med innehållet på samma nyckel", () => {
    const seed = [{ q: "Vilket ord stavas rätt?", options: ["Venner", "Vänner"], correct: 1 }];
    const merged = mergeUnique(seed, quizQuestionsFromContent(content), quizKey);
    assert.equal(merged.length, 2);
  });
});

describe("svarsalternativen blandas", () => {
  test("rätt svar följer med när alternativen byter plats", () => {
    const options = ["a", "b", "c", "d"];
    for (let i = 0; i < 50; i++) {
      const dealt = shuffleOptions(options, 1);
      assert.equal(dealt.options[dealt.correctIndex], "b");
      assert.deepEqual([...dealt.options].sort(), options);
    }
  });

  test("rätt svar hamnar inte alltid på samma plats", () => {
    const positions = new Set<number>();
    for (let i = 0; i < 200; i++) positions.add(shuffleOptions(["a", "b", "c", "d"], 1).correctIndex);
    assert.ok(positions.size > 1);
  });

  test("dealQuiz behåller varje fråga och dess facit", () => {
    const deck = [
      { q: "Ett?", options: ["x", "rätt", "y"], correct: 1 },
      { q: "Två?", options: ["rätt", "z"], correct: 0 },
    ];
    const dealt = dealQuiz(deck);
    assert.equal(dealt.length, 2);
    for (const q of dealt) assert.equal(q.options[q.correct], "rätt");
  });
});

describe("memorypoäng", () => {
  test("en perfekt svår omgång ger mer än en perfekt lätt", () => {
    const easy = memoryScore(4, 4, 15);
    const medium = memoryScore(6, 6, 25);
    const hard = memoryScore(9, 9, 40);
    assert.equal(easy, 80);
    assert.equal(medium, 120);
    assert.equal(hard, 180);
    assert.ok(hard > medium && medium > easy);
  });

  test("taket är det gamla maxet, 180", () => {
    assert.ok(memoryScore(9, 9, 0) <= 180);
  });

  test("extra försök och lång tid kostar, men aldrig under golvet", () => {
    assert.equal(memoryScore(4, 6, 0), 80 - 2 * 3);
    assert.equal(memoryScore(4, 4, 20 + 8), 80 - 2);
    assert.equal(memoryScore(4, 500, 5000), 10);
  });
});

describe("bosslåset efter en vinst", () => {
  const gamWith = (wins: Record<string, number>) =>
    ({ bossWinsPerBoss: wins } as unknown as GamificationData);
  const [firstBoss] = BOSSES_BY_STAGE.lagstadiet;

  test("en vinst låser matchen tills tio kapitel till är klara", () => {
    const completed = BOSS_MODULES_PER_FIGHT; // precis nog för första matchen
    assert.equal(getBossGate(completed, bossWinsInStage(gamWith({}), "lagstadiet")).unlocked, true);

    // Efter vinsten: samma antal kapitel räcker inte längre ("Spela igen"
    // på vinstskärmen gick förr runt detta).
    const after = getBossGate(completed, bossWinsInStage(gamWith({ [firstBoss]: 1 }), "lagstadiet"));
    assert.equal(after.unlocked, false);
    assert.equal(after.remaining, BOSS_MODULES_PER_FIGHT);

    assert.equal(
      getBossGate(completed * 2, bossWinsInStage(gamWith({ [firstBoss]: 1 }), "lagstadiet")).unlocked,
      true
    );
  });

  test("en vinst i en värld låser inte en annan", () => {
    const wins = bossWinsInStage(gamWith({ [firstBoss]: 1 }), "mellanstadiet");
    assert.equal(getBossGate(BOSS_MODULES_PER_FIGHT, wins).unlocked, true);
  });
});
