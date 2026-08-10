/**
 * Tests for the points economy.
 *
 * These cover the parts where a silent regression costs pupils their
 * progress or floods them with rewards: the replay discount, the chest
 * milestones, the level thresholds and the spendable balance.
 *
 * Run with: npm test
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  getPointsMultiplier,
  rollSurpriseMultiplier,
  POINT_CHEST_MILESTONES,
  EXERCISE_CHEST_MILESTONES,
  MAX_CHESTS_PER_TYPE,
  DAILY_LOGIN_BONUS,
  chestsEarnedFromPoints,
  chestsEarnedFromExercises,
  capNewChests,
} from "../src/lib/gamification.ts";
import { getLevel, MAX_LEVEL } from "../src/lib/levels.ts";
import { getSpendable } from "../src/lib/storage.ts";
import type { Chest, StudentData } from "../src/lib/types.ts";

/** Points a pupil banks for a typical completed module, used to sanity-check pacing. */
const POINTS_PER_MODULE = 20 * 15 + 30; // 20 correct answers plus a pass bonus

describe("omspelsrabatt", () => {
  test("full poäng första gången", () => {
    assert.equal(getPointsMultiplier(0), 1.0);
  });

  test("avtar men blir aldrig noll – att öva om ska alltid löna sig", () => {
    const curve = [0, 1, 2, 3, 4, 10].map(getPointsMultiplier);
    for (const m of curve) assert.ok(m > 0, `multiplikatorn blev ${m}`);
  });

  test("är monotont avtagande", () => {
    for (let i = 1; i < 8; i++) {
      assert.ok(
        getPointsMultiplier(i) <= getPointsMultiplier(i - 1),
        `försök ${i} gav högre multiplikator än ${i - 1}`
      );
    }
  });
});

describe("överraskningsmultiplikator", () => {
  test("ger bara 1, 2 eller 3", () => {
    for (let i = 0; i < 500; i++) {
      assert.ok([1, 2, 3].includes(rollSurpriseMultiplier()));
    }
  });

  test("är sällsynt – klart under hälften av försöken", () => {
    const rolls = Array.from({ length: 20000 }, rollSurpriseMultiplier);
    const boosted = rolls.filter((r) => r > 1).length / rolls.length;
    assert.ok(boosted > 0.05 && boosted < 0.25, `andel med bonus: ${boosted}`);
    const triples = rolls.filter((r) => r === 3).length / rolls.length;
    assert.ok(triples < 0.1, `andel trippel: ${triples}`);
  });
});

describe("kistmilstolpar", () => {
  test("poängmilstolparna är strikt stigande och unika", () => {
    const points = POINT_CHEST_MILESTONES.map((m) => m.points);
    assert.deepEqual([...points].sort((a, b) => a - b), points);
    assert.equal(new Set(points).size, points.length);
  });

  test("övningsmilstolparna är strikt stigande och unika", () => {
    const counts = EXERCISE_CHEST_MILESTONES.map((m) => m.exercises);
    assert.deepEqual([...counts].sort((a, b) => a - b), counts);
    assert.equal(new Set(counts).size, counts.length);
  });

  test("första modulen ger högst en poängkista", () => {
    // Regression guard: the milestones once started at 10/20/30/50/75/100/200/300,
    // so a pupil's first module crossed eight of them at once.
    const firstDay = POINTS_PER_MODULE + DAILY_LOGIN_BONUS;
    const crossed = POINT_CHEST_MILESTONES.filter((m) => m.points <= firstDay);
    assert.ok(crossed.length <= 1, `första modulen passerar ${crossed.length} milstolpar`);
  });

  test("toppen är nåbar – allt innehåll är värt ~38 000 poäng", () => {
    const top = POINT_CHEST_MILESTONES.at(-1)!.points;
    assert.ok(top < 100_000, `högsta milstolpen ${top} är utom räckhåll`);
  });
});

describe("utdelning av kistor", () => {
  test("en milstolpe betalar ut en gång", () => {
    const first = POINT_CHEST_MILESTONES[0].points;
    const earned = chestsEarnedFromPoints(0, first, []);
    assert.equal(earned.length, 1);

    const again = chestsEarnedFromPoints(first, first + 1, [first]);
    assert.equal(again.length, 0, "samma milstolpe betalade ut två gånger");
  });

  test("att hoppa förbi flera milstolpar ger en kista per passerad", () => {
    const third = POINT_CHEST_MILESTONES[2].points;
    const earned = chestsEarnedFromPoints(0, third, []);
    assert.equal(earned.length, 3);
  });

  test("redan belönade milstolpar hoppas över", () => {
    const [a, b] = POINT_CHEST_MILESTONES;
    const earned = chestsEarnedFromPoints(0, b.points, [a.points]);
    assert.deepEqual(earned.map((e) => e.milestone), [b.points]);
  });

  test("övningsmilstolparna beter sig likadant", () => {
    const first = EXERCISE_CHEST_MILESTONES[0].exercises;
    assert.equal(chestsEarnedFromExercises(0, first, []).length, 1);
    assert.equal(chestsEarnedFromExercises(first, first, [first]).length, 0);
  });
});

describe("tak för antal kistor", () => {
  test("respekterar MAX_CHESTS_PER_TYPE", () => {
    const make = (n: number): Chest[] =>
      Array.from({ length: n }, (_, i) => ({
        id: `c${i}`, type: "wood", earnedAt: new Date(0).toISOString(), opened: false,
      }));
    const existing = make(MAX_CHESTS_PER_TYPE - 2);
    const added = capNewChests(existing, make(10));
    assert.equal(added.length, 2, "taket för brons överskreds");
  });

  test("olika valörer räknas var för sig", () => {
    const wood: Chest[] = Array.from({ length: MAX_CHESTS_PER_TYPE }, (_, i) => ({
      id: `w${i}`, type: "wood", earnedAt: new Date(0).toISOString(), opened: false,
    }));
    const gold: Chest[] = [{ id: "g", type: "gold", earnedAt: new Date(0).toISOString(), opened: false }];
    assert.equal(capNewChests(wood, gold).length, 1, "guldkistan blockerades av bronstaket");
  });
});

describe("nivåer", () => {
  test("börjar på nivå 1 utan poäng", () => {
    assert.equal(getLevel(0).level, 1);
  });

  test("negativa poäng kraschar inte", () => {
    const lvl = getLevel(-500);
    assert.equal(lvl.level, 1);
    assert.ok(lvl.progress >= 0 && lvl.progress <= 1);
  });

  test("progress håller sig mellan 0 och 1 hela vägen", () => {
    for (let p = 0; p <= 80_000; p += 250) {
      const { progress } = getLevel(p);
      assert.ok(progress >= 0 && progress <= 1, `progress ${progress} vid ${p} poäng`);
    }
  });

  test("nivån stiger aldrig bakåt", () => {
    let last = 0;
    for (let p = 0; p <= 80_000; p += 250) {
      const { level } = getLevel(p);
      assert.ok(level >= last, `nivån sjönk vid ${p} poäng`);
      last = level;
    }
  });

  test("maxnivån nås och överskrids inte", () => {
    assert.equal(getLevel(1_000_000).level, MAX_LEVEL);
    assert.equal(getLevel(1_000_000).progress, 1);
  });
});

describe("spenderbara poäng", () => {
  const student = (totalPoints: number, spentPoints: number): StudentData =>
    ({ name: "T", createdAt: "", lastActive: "", totalPoints, spentPoints, stages: {} } as unknown as StudentData);

  test("är differensen mellan intjänat och spenderat", () => {
    assert.equal(getSpendable(student(1000, 400)), 600);
  });

  test("blir aldrig negativ", () => {
    // A pupil could otherwise end up with a negative balance after a rebalance.
    assert.equal(getSpendable(student(100, 900)), 0);
  });

  test("klarar att spentPoints saknas i gamla sparfiler", () => {
    const legacy = { name: "T", totalPoints: 500 } as unknown as StudentData;
    assert.equal(getSpendable(legacy), 500);
  });
});
