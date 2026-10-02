/**
 * Tests for the secret mission ("Hemligt uppdrag").
 *
 * The mission pays double, so every guard against farming it is tested here:
 * one a day, only after the day's first chapter, a one-time offer, no
 * restart, a single payout, and exercises only from chapters already passed.
 *
 * Run with: npm test
 */

import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";

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

import { createStudent, getStoredStudent, saveModuleProgress, loadGamification } from "../src/lib/storage.ts";
import {
  rollChapterMission,
  offerFromStar,
  declineMission,
  acceptMission,
  recordMissionAnswer,
  completeMission,
  getTodaysMission,
  markMissionShown,
  settleAbandonedExercise,
  canOfferMission,
  eligibleExercises,
  pickMissionExercises,
  starPlacement,
  MISSION_POINTS_PER_CORRECT,
  MISSION_QUESTIONS,
} from "../src/lib/secretMission.ts";
import { finishChapter } from "../src/lib/chapter.ts";
import type { StageContent, GrammarExercise } from "../src/lib/types.ts";

const mc = (id: string): GrammarExercise => ({ id, type: "multiple-choice", question: `Fråga ${id}?`, options: ["a", "b"], correctIndex: 0 });
const mod = (id: string, n: number) => ({
  id, title: id, description: "", icon: "📝", pointsRequired: 0, bonusPoints: 0,
  exercises: Array.from({ length: n }, (_, i) => mc(`${id}-${i}`)),
});
const CONTENT: StageContent = {
  grammar: [mod("g1", 4), mod("g2", 4), mod("g3", 4)],
  spelling: [mod("s1", 4)],
};
const always = () => 0;   // a roll that always succeeds
const never = () => 0.99; // a roll that never does

function freshPupil(): void {
  (g.localStorage as MemoryStorage).clear();
  createStudent("Nova", "ninja");
}

function passChapter(moduleId: string): void {
  const s = getStoredStudent()!;
  saveModuleProgress(s, "lagstadiet", "grammar", moduleId, 60, true);
}

describe("hemligt uppdrag", () => {
  beforeEach(freshPupil);

  test("erbjuds inte innan dagens första kapitel", () => {
    assert.equal(canOfferMission(getStoredStudent(), "lagstadiet"), false);
    assert.equal(rollChapterMission("lagstadiet", always), false);
    assert.equal(offerFromStar("lagstadiet"), false);
  });

  test("erbjuds efter ett klarat kapitel, högst en gång per dag", () => {
    passChapter("g1");
    assert.equal(rollChapterMission("lagstadiet", always), true);
    assert.equal(getTodaysMission()?.status, "offered");
    passChapter("g2");
    assert.equal(rollChapterMission("lagstadiet", always), false, "ett andra uppdrag samma dag");
    assert.equal(offerFromStar("lagstadiet"), false, "stjärnan ger inget när kapitlet redan gett ett");
  });

  test("slumpen kan säga nej, och då finns stjärnan kvar", () => {
    passChapter("g1");
    assert.equal(rollChapterMission("lagstadiet", never), false);
    assert.equal(getTodaysMission(), null);
    assert.equal(offerFromStar("lagstadiet"), true);
  });

  test("ett nej använder upp dagens uppdrag", () => {
    passChapter("g1");
    offerFromStar("lagstadiet");
    declineMission();
    assert.equal(getTodaysMission()?.status, "declined");
    assert.equal(acceptMission(CONTENT), null);
    assert.equal(offerFromStar("lagstadiet"), false);
  });

  test("uppgifterna kommer bara från klarade kapitel och blandas", () => {
    passChapter("g1");
    passChapter("g3");
    const refs = eligibleExercises(getStoredStudent()!, "lagstadiet", CONTENT);
    assert.ok(refs.every((r) => r.moduleId === "g1" || r.moduleId === "g3"));
    const picked = pickMissionExercises(refs);
    assert.equal(picked.length, MISSION_QUESTIONS);
    assert.deepEqual(new Set(picked.map((p) => p.moduleId)), new Set(["g1", "g3"]), "från båda kapitlen");
  });

  test("betalar dubbla poäng en gång, och en silverkista för alla rätt", () => {
    passChapter("g1");
    passChapter("g2");
    offerFromStar("lagstadiet");
    const before = getStoredStudent()!.totalPoints;
    const accepted = acceptMission(CONTENT)!;
    assert.equal(accepted.exercises!.length, MISSION_QUESTIONS);
    for (let i = 0; i < MISSION_QUESTIONS; i++) recordMissionAnswer(true);
    const done = completeMission()!;
    assert.equal(done.status, "done");
    assert.equal(done.pointsAwarded, MISSION_QUESTIONS * MISSION_POINTS_PER_CORRECT);
    assert.equal(done.chestAwarded, "silver");
    assert.equal(getStoredStudent()!.totalPoints, before + MISSION_QUESTIONS * MISSION_POINTS_PER_CORRECT);
    assert.equal(loadGamification().chests.filter((c) => c.type === "silver").length, 1);

    // A second call, a reload or a double click pays nothing more.
    completeMission();
    assert.equal(getStoredStudent()!.totalPoints, before + MISSION_QUESTIONS * MISSION_POINTS_PER_CORRECT);
    assert.equal(loadGamification().chests.filter((c) => c.type === "silver").length, 1);
  });

  test("inget omtag: ett accepterat uppdrag fortsätter där det var", () => {
    passChapter("g1");
    offerFromStar("lagstadiet");
    const first = acceptMission(CONTENT)!;
    recordMissionAnswer(false);
    // Accepting again (a reload of the offer) does not deal a new set.
    assert.equal(acceptMission(CONTENT), null);
    const now = getTodaysMission()!;
    assert.deepEqual(now.exercises, first.exercises);
    assert.deepEqual(now.answers, [false]);
    assert.equal(completeMission(), null, "betalar inte förrän alla är besvarade");
  });

  test("en fråga som visats och lämnats genom omladdning räknas som fel", () => {
    passChapter("g1");
    offerFromStar("lagstadiet");
    acceptMission(CONTENT);
    markMissionShown(0);
    recordMissionAnswer(true);
    markMissionShown(1);
    // The page is reloaded here, after the answer was shown but before "Nästa".
    const settled = settleAbandonedExercise()!;
    assert.deepEqual(settled.answers, [true, false]);
    // Settling again does nothing more.
    assert.deepEqual(settleAbandonedExercise()!.answers, [true, false]);
  });

  test("räknas inte som ett kapitel", () => {
    passChapter("g1");
    offerFromStar("lagstadiet");
    const chaptersBefore = Object.keys(getStoredStudent()!.stages.lagstadiet.grammarModules).length;
    acceptMission(CONTENT);
    for (let i = 0; i < MISSION_QUESTIONS; i++) recordMissionAnswer(true);
    completeMission();
    assert.equal(Object.keys(getStoredStudent()!.stages.lagstadiet.grammarModules).length, chaptersBefore);
    assert.equal(loadGamification().exercisesCompleted ?? 0, 0);
  });

  test("ett uppdrag från igår gäller inte i dag", () => {
    passChapter("g1");
    offerFromStar("lagstadiet");
    const key = "svenskajakten_mission_Nova";
    const old = JSON.parse(localStorage.getItem(key)!);
    localStorage.setItem(key, JSON.stringify({ ...old, day: "2000-01-01" }));
    assert.equal(getTodaysMission(), null);
  });

  test("finishChapter kan erbjuda uppdraget efter ett klarat kapitel", () => {
    // Pass one chapter first so there is something to repeat, then let the
    // next chapter's roll run (MISSION_CHANCE is a chance, so retry a few days).
    passChapter("g1");
    let offered = false;
    for (let i = 0; i < 60 && !offered; i++) {
      localStorage.removeItem("svenskajakten_mission_Nova");
      offered = finishChapter({ stageId: "lagstadiet", kind: "grammar", moduleId: "g2", points: 30, passed: true, rollMystery: () => null }).missionOffered;
    }
    assert.ok(offered, "erbjöds aldrig på 60 försök");
    const failed = finishChapter({ stageId: "lagstadiet", kind: "grammar", moduleId: "g3", points: 0, passed: false, rollMystery: () => null });
    assert.equal(failed.missionOffered, false);
  });

  test("stjärnans gömställe är fast under dagen men skiljer sig mellan dagar", () => {
    assert.deepEqual(starPlacement("Nova", "2026-10-02"), starPlacement("Nova", "2026-10-02"));
    const spots = new Set(Array.from({ length: 20 }, (_, i) => starPlacement("Nova", `2026-10-${String(i + 1).padStart(2, "0")}`).spot));
    assert.deepEqual(spots, new Set(["home", "world"]));
  });
});

