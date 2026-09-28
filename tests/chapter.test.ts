/**
 * Tests for finishing a chapter, logging in and the other storage paths.
 *
 * These run the real storage code against an in-memory localStorage, so they
 * catch the bugs that only show up across a save and a reload: a "before"
 * value read after the save had changed it, a stale copy overwriting newer
 * progress, a name that collides with a built-in object property.
 *
 * Run with: npm test
 */

import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";

// ─── A browser-like global, just enough for storage.ts ───────────────────────

class MemoryStorage {
  private map = new Map<string, string>();
  getItem(k: string) { return this.map.has(k) ? this.map.get(k)! : null; }
  setItem(k: string, v: string) { this.map.set(k, String(v)); }
  removeItem(k: string) { this.map.delete(k); }
  clear() { this.map.clear(); }
}

const g = globalThis as unknown as Record<string, unknown>;
g.window = globalThis;
g.localStorage = new MemoryStorage();
g.sessionStorage = new MemoryStorage();

import {
  createStudent,
  saveStudent,
  loadStudent,
  getStoredStudent,
  studentExists,
  saveModuleProgress,
  loadGamification,
  saveGamification,
  buyAvatar,
  normaliseImported,
  validateStudentName,
  FREE_STARTER_AVATARS,
  isFreeStarterAvatar,
  DEFAULT_AVATAR,
} from "../src/lib/storage.ts";
import { finishChapter } from "../src/lib/chapter.ts";
import {
  defaultGamificationData,
  MILESTONE_SCALE,
  capNewChests,
  MAX_CHESTS_PER_TYPE,
  openChest,
  BOSS_MODULES_PER_FIGHT,
  EXERCISE_CHEST_MILESTONES,
  migrateExerciseMilestones,
  checkMissedExerciseMilestones,
} from "../src/lib/gamification.ts";
import { MODULE_COUNTS } from "../src/lib/moduleCounts.ts";
import { getShopAvatar } from "../src/lib/shop.ts";
import type { Chest, StudentData, ModuleProgress, MysteryBoxReward } from "../src/lib/types.ts";

function reset() {
  (g.localStorage as MemoryStorage).clear();
  (g.sessionStorage as MemoryStorage).clear();
}

function done(id: string): ModuleProgress {
  return { moduleId: id, completed: true, points: 0, attempts: 1, lastAttempt: "" };
}

/** Log in a fresh pupil and give them the given points and finished lagstadiet chapters. */
function pupil(points: number, chaptersInLag = 0): StudentData {
  const s = createStudent("Testa");
  const grammar: Record<string, ModuleProgress> = {};
  for (let i = 0; i < chaptersInLag; i++) grammar[`g${i}`] = done(`g${i}`);
  const withProgress: StudentData = {
    ...s,
    totalPoints: points,
    stages: { ...s.stages, lagstadiet: { ...s.stages.lagstadiet, grammarModules: grammar } },
  };
  saveStudent(withProgress);
  return withProgress;
}

const noMystery = () => null;

describe("kapitelslut delar ut kistor", () => {
  beforeEach(reset);

  test("ett kapitel som passerar 300 poäng ger poängkistan", () => {
    pupil(250);
    const r = finishChapter({ stageId: "lagstadiet", kind: "grammar", moduleId: "m1", points: 100, passed: true, rollMystery: noMystery });
    assert.equal(r.student?.totalPoints, 350);
    assert.ok(loadGamification().pointsMilestonesRewarded.includes(300), "300-milstolpen belönades inte");
    assert.ok(r.newChests.length >= 1);
    assert.equal(r.chestEarned, "wood");
  });

  test("en nyss upplåst utmärkelse ger sin kista", () => {
    pupil(0, 4);
    const r = finishChapter({ stageId: "lagstadiet", kind: "spelling", moduleId: "s1", points: 0, passed: true, rollMystery: noMystery });
    const gam = loadGamification();
    assert.ok(gam.achievementsRewarded.includes("lag-5"), "Ängsmästare gav ingen kista");
    assert.ok(r.chestEarned, "ingen kista annonserades");
  });

  test("bossen öppnar vid tionde kapitlet i världen", () => {
    pupil(0, BOSS_MODULES_PER_FIGHT - 1);
    const r = finishChapter({ stageId: "lagstadiet", kind: "wordsearch", moduleId: "w1", points: 10, passed: true, rollMystery: noMystery });
    assert.equal(r.bossOpenedNow, true);
    assert.equal(loadGamification().bossUnlocked, true);
  });

  test("bossen öppnar inte av kapitel i en annan värld eller av omspel", () => {
    pupil(0, BOSS_MODULES_PER_FIGHT - 1);
    const other = finishChapter({ stageId: "hogstadiet", kind: "grammar", moduleId: "h1", points: 10, passed: true, rollMystery: noMystery });
    assert.equal(other.bossOpenedNow, false);
    const replay = finishChapter({ stageId: "lagstadiet", kind: "grammar", moduleId: "g0", points: 10, passed: true, rollMystery: noMystery });
    assert.equal(replay.bossOpenedNow, false);
  });

  test("bara första godkända gången räknas som klarad övning", () => {
    pupil(0);
    let rolls = 0;
    const roll = (): MysteryBoxReward | null => { rolls++; return null; };
    finishChapter({ stageId: "lagstadiet", kind: "stavningstest", moduleId: "t1", points: 0, passed: false, rollMystery: roll });
    assert.equal(loadGamification().exercisesCompleted, 0, "ett underkänt försök räknades");
    finishChapter({ stageId: "lagstadiet", kind: "stavningstest", moduleId: "t1", points: 300, passed: true, rollMystery: roll });
    assert.equal(loadGamification().exercisesCompleted, 1);
    finishChapter({ stageId: "lagstadiet", kind: "stavningstest", moduleId: "t1", points: 300, passed: true, rollMystery: roll });
    assert.equal(loadGamification().exercisesCompleted, 1, "ett omspel räknades");
    assert.equal(rolls, 1, "mysterylådan slogs för annat än första godkända gången");
  });

  test("mysterylådans poäng sparas och räknas med i milstolparna", () => {
    pupil(290);
    const r = finishChapter({
      stageId: "lagstadiet", kind: "grammar", moduleId: "m1", points: 0, passed: true,
      rollMystery: () => ({ type: "points", points: 20, description: "+20" }),
    });
    assert.equal(getStoredStudent()?.totalPoints, 310);
    assert.equal(r.student?.totalPoints, 310);
    assert.ok(loadGamification().pointsMilestonesRewarded.includes(300));
  });
});

describe("sparande utan sidoeffekter", () => {
  beforeEach(reset);

  test("saveModuleProgress ändrar inte objektet den får", () => {
    const s = pupil(100);
    const before = JSON.stringify(s);
    const after = saveModuleProgress(s, "lagstadiet", "grammar", "m1", 50, true);
    assert.equal(JSON.stringify(s), before, "indata muterades");
    assert.equal(after.totalPoints, 150);
  });

  test("en gammal kopia skriver inte över nyare framsteg", () => {
    const stale = pupil(100);
    saveModuleProgress(stale, "lagstadiet", "grammar", "m1", 50, true);   // 150
    saveModuleProgress(stale, "lagstadiet", "grammar", "m2", 50, true);   // 200, from the same stale copy
    assert.equal(getStoredStudent()?.totalPoints, 200);
    assert.equal(Object.keys(getStoredStudent()!.stages.lagstadiet.grammarModules).length, 2);
  });

  test("köp i affären utgår från det sparade saldot", () => {
    const stale = pupil(0);
    saveStudent({ ...stale, totalPoints: 500 });
    const res = buyAvatar(stale, "fox");
    assert.equal(res.ok, true, "köpet avslogs trots att saldot räcker");
    assert.equal(getStoredStudent()?.totalPoints, 500, "poängen skrevs över av den gamla kopian");
  });
});

describe("inloggning", () => {
  beforeEach(reset);

  test("en återvändande elev behåller sin avatar", () => {
    const s = createStudent("Maja", "fox");
    saveStudent({ ...s, ownedAvatars: ["fox", "lion"], avatar: "lion" });
    const again = createStudent("Maja", "owl");
    assert.equal(again.avatar, "lion");
  });

  test("bara gratis startavatarer ges bort", () => {
    const dragon = createStudent("Ny1", "dragon");
    assert.equal(dragon.avatar, DEFAULT_AVATAR);
    assert.deepEqual(dragon.ownedAvatars, [DEFAULT_AVATAR]);
    const fox = createStudent("Ny2", "fox");
    assert.equal(fox.avatar, "fox");
    for (const a of FREE_STARTER_AVATARS) {
      assert.equal(getShopAvatar(a.id)?.rarity, "vanlig", `${a.id} är inte gratisnivå`);
    }
    assert.ok(isFreeStarterAvatar(DEFAULT_AVATAR));
    assert.equal(isFreeStarterAvatar("unicorn"), false);
  });

  test("en utrustad avatar blir inte ägd av att laddas", () => {
    const s = createStudent("Ola", "fox");
    saveStudent({ ...s, avatar: "dragon" });
    const loaded = loadStudent()!;
    assert.equal(loaded.ownedAvatars?.includes("dragon"), false);
    assert.equal(loaded.avatar, "fox");
  });

  test("namn som krockar med objektets egenskaper fungerar", () => {
    for (const name of ["constructor", "toString", "hasOwnProperty"]) {
      assert.equal(studentExists(name), false, `${name} fanns redan`);
      const s = createStudent(name);
      assert.equal(s.name, name);
      assert.equal(s.totalPoints, 0);
      assert.equal(studentExists(name), true);
    }
    assert.throws(() => createStudent("__proto__"));
    assert.ok(validateStudentName("__x"));
    assert.equal(validateStudentName("Emma"), null);
  });

  test("inloggningen bryr sig inte om stora och små bokstäver", () => {
    const emma = createStudent("Emma");
    saveStudent({ ...emma, totalPoints: 123 });
    assert.equal(studentExists("emma"), true);
    const again = createStudent("emma");
    assert.equal(again.name, "Emma");
    assert.equal(again.totalPoints, 123);
  });

  test("två konton som bara skiljer i versaler slås aldrig ihop", () => {
    createStudent("Alex");
    createStudent("ALEX"); // exact match missing, one case match: logs into Alex
    assert.equal(getStoredStudent()?.name, "Alex");
    // Build the ambiguous case by hand: both spellings stored.
    const a = createStudent("Alex");
    saveStudent({ ...a, name: "ALEX", totalPoints: 7 });
    assert.equal(createStudent("ALEX").totalPoints, 7);
    assert.equal(createStudent("Alex").totalPoints, 0);
    const neither = createStudent("alex");
    assert.equal(neither.name, "alex", "ett tvetydigt namn loggade in på fel konto");
  });
});

describe("kistor och spelstatus", () => {
  beforeEach(reset);

  test("nya elever börjar på aktuell milstolpsskala", () => {
    assert.equal(defaultGamificationData().milestoneScale, MILESTONE_SCALE);
  });

  test("öppnade kistor räknas inte mot taket", () => {
    const opened: Chest[] = Array.from({ length: MAX_CHESTS_PER_TYPE }, (_, i) => ({
      id: `o${i}`, type: "wood", earnedAt: "", opened: true,
    }));
    const fresh: Chest = { id: "n", type: "wood", earnedAt: "", opened: false };
    assert.equal(capNewChests(opened, [fresh]).length, 1);
  });

  test("en kista kan bara öppnas en gång", () => {
    const gam = { ...defaultGamificationData(), chests: [{ id: "c", type: "wood" as const, earnedAt: "", opened: false }] };
    const first = openChest(gam, "c");
    assert.ok(first);
    assert.equal(openChest(first!.gam, "c"), null);
  });

  test("dyra kistor ger aldrig Bossbesegrare", () => {
    for (const type of ["gold", "emerald", "ruby", "diamond", "hemlig"] as const) {
      for (let i = 0; i < 50; i++) {
        const gam = { ...defaultGamificationData(), chests: [{ id: "c", type, earnedAt: "", opened: false }] };
        assert.notEqual(openChest(gam, "c")!.badge, "boss_slayer", `${type} gav bossmärket`);
      }
    }
  });

  test("spelstatus sparas per elev", () => {
    createStudent("A");
    saveGamification({ ...defaultGamificationData(), bossWins: 3 });
    createStudent("B");
    assert.equal(loadGamification().bossWins, 0);
  });
});

describe("inläsning av säkerhetskopia", () => {
  test("okända saker och orimliga poäng rensas bort", () => {
    const data = normaliseImported({
      name: "Kim",
      totalPoints: 100,
      spentPoints: -5000,
      avatar: "dragon",
      ownedAvatars: ["fox", "hackad-avatar", 42],
      ownedFrames: ["guld", "nope"],
      equippedFrame: "nope",
    })!;
    assert.deepEqual(data.ownedAvatars, ["fox"]);
    assert.equal(data.avatar, "fox");
    assert.deepEqual(data.ownedFrames, ["guld"]);
    assert.equal(data.equippedFrame, "");
    assert.equal(data.spentPoints, 0);
    const tooMuch = normaliseImported({ name: "Kim", totalPoints: 100, spentPoints: 900 })!;
    assert.equal(tooMuch.spentPoints, 100);
  });

  test("reserverade namn avvisas", () => {
    assert.equal(normaliseImported({ name: "__proto__" }), null);
  });
});

describe("kapitelkistorna efter omskalningen", () => {
  beforeEach(reset);

  test("varje kapitelkista går att nå med kapitlen som finns", () => {
    const chapters = Object.values(MODULE_COUNTS).reduce((a, b) => a + b, 0);
    const top = EXERCISE_CHEST_MILESTONES.at(-1)!.exercises;
    assert.ok(top <= chapters, `högsta milstolpen ${top} men bara ${chapters} kapitel`);
  });

  test("uppblåst gammal räknare ger ingen ny flod av kistor", () => {
    // Old save: 60 "exercises" (replays counted), 18 old milestones paid, but
    // only 10 chapters actually passed.
    const old = { ...defaultGamificationData(), exercisesCompleted: 60, exerciseMilestonesRewarded: EXERCISE_CHEST_MILESTONES.slice(0, 18).map((m) => m.exercises * 3) };
    const migrated = migrateExerciseMilestones(old, 10);
    assert.equal(migrated.exercisesCompleted, 10);
    assert.equal(checkMissedExerciseMilestones(10, migrated.exerciseMilestonesRewarded).length, 0);
  });

  test("den som fick färre kistor än nya skalan ger får mellanskillnaden en gång", () => {
    const old = { ...defaultGamificationData(), exercisesCompleted: 20, exerciseMilestonesRewarded: [1, 2, 3] };
    const migrated = migrateExerciseMilestones(old, 20);
    const owed = EXERCISE_CHEST_MILESTONES.filter((m) => m.exercises <= 20).length;
    const missed = checkMissedExerciseMilestones(20, migrated.exerciseMilestonesRewarded);
    assert.equal(missed.length, owed - 3);
    const after = [...migrated.exerciseMilestonesRewarded, ...missed.map((m) => m.milestone)];
    assert.equal(checkMissedExerciseMilestones(20, after).length, 0, "betalades ut två gånger");
  });

  test("gamla sparfiler migreras när de laddas", () => {
    pupil(0, 7);
    saveGamification({
      ...defaultGamificationData(),
      milestoneScale: 2,
      exercisesCompleted: 40,
      exerciseMilestonesRewarded: [1, 2, 3, 4, 5, 7, 10, 12, 15, 20, 25, 30, 35, 40],
    });
    const gam = loadGamification();
    assert.equal(gam.milestoneScale, MILESTONE_SCALE);
    assert.equal(gam.exercisesCompleted, 7);
    assert.equal(checkMissedExerciseMilestones(gam.exercisesCompleted, gam.exerciseMilestonesRewarded).length, 0);
    // The next first-time pass continues from the real count.
    finishChapter({ stageId: "lagstadiet", kind: "grammar", moduleId: "ny", points: 0, passed: true, rollMystery: noMystery });
    assert.equal(loadGamification().exercisesCompleted, 8);
    assert.ok(loadGamification().exerciseMilestonesRewarded.includes(8));
  });
});
