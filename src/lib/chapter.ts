import type { StudentData, StageId, ChestType, Chest, MysteryBoxReward, GamificationData } from "./types";
import {
  getStoredStudent,
  getModuleProgress,
  saveModuleProgress,
  addPointsToStored,
  loadGamification,
  saveGamification,
  hasSaveFailed,
} from "./storage";
import {
  chestsEarnedFromPoints,
  chestsEarnedFromExercises,
  chestsEarnedFromAchievements,
  capNewChests,
  rollMysteryBox,
  bossWinsInStage,
  getBossGate,
  completedModulesInStage,
} from "./gamification";
import { ACHIEVEMENTS, isUnlocked } from "./achievements";
import { rollChapterMission } from "./secretMission";

export type ChapterKind = "grammar" | "spelling" | "wordsearch" | "stavningstest";

export interface FinishChapterInput {
  stageId: StageId;
  kind: ChapterKind;
  moduleId: string;
  /** Points for this attempt before the replay discount (surprise bonus included). */
  points: number;
  /** Whether the pupil reached the chapter's pass mark. */
  passed: boolean;
  /** Mystery box roll, injectable so tests do not depend on chance. */
  rollMystery?: (badges: string[]) => MysteryBoxReward | null;
  /** Skips the secret-mission roll, for tests that count exact rewards. */
  noMission?: boolean;
}

export interface FinishChapterResult {
  /** The saved pupil after everything was paid out, or null when nobody is logged in. */
  student: StudentData | null;
  /** True when this chapter had been passed before this attempt. */
  wasAlreadyCompleted: boolean;
  /** Attempts before this one, which sets the replay discount shown to the pupil. */
  prevAttempts: number;
  /** Every chest actually added (after the cap). */
  newChests: Chest[];
  /** The chest to announce on the result screen: the first non-mystery one actually added. */
  chestEarned?: ChestType;
  /** True when this very chapter opened a boss fight in this world. */
  bossOpenedNow: boolean;
  /** The mystery box won, if any. Only rolled on a first-time pass. */
  mystery: MysteryBoxReward | null;
  /** True when something could not be saved to the device. */
  saveFailed: boolean;
  /** True when this passed chapter turned up today's secret mission (see secretMission.ts). */
  missionOffered: boolean;
}

function unlockedIds(student: StudentData): string[] {
  return ACHIEVEMENTS.filter((a) => isUnlocked(a, student)).map((a) => a.id);
}

/** A fallback when the mystery chest cannot be added: the same value in points. */
function pointsInstead(): MysteryBoxReward {
  const pts = 30;
  return { type: "points", points: pts, description: `+${pts} bonuspoäng!` };
}

/**
 * Everything that happens when a pupil reaches the end of a chapter: the
 * progress and points are saved, and the rewards that depend on them are
 * worked out and saved too — point, exercise and achievement chests, the boss
 * gate for this world, the mystery box and its badge.
 *
 * All four chapter pages call this, so the rules live in one place. The pupil
 * is read from storage both before and after saving, so the "before" side of
 * every comparison really is from before this chapter — the pages used to read
 * it from an object the save had already changed, and the milestone chests,
 * achievement chests and boss fanfare never fired.
 *
 * Only a first-time pass counts towards the exercise chests and can roll a
 * mystery box. Anything else (a failed attempt, a replay, a spelling test that
 * timed out untouched) would make those rewards farmable by clicking through.
 */
export function finishChapter(input: FinishChapterInput): FinishChapterResult {
  const { stageId, kind, moduleId, points, passed } = input;
  const roll = input.rollMystery ?? rollMysteryBox;

  const before = getStoredStudent();
  if (!before) {
    return {
      student: null, wasAlreadyCompleted: false, prevAttempts: 0, newChests: [],
      bossOpenedNow: false, mystery: null, saveFailed: false, missionOffered: false,
    };
  }

  const prev = getModuleProgress(before, stageId, kind, moduleId);
  const wasAlreadyCompleted = prev?.completed ?? false;
  const prevAttempts = prev?.attempts ?? 0;
  const firstTimePass = passed && !wasAlreadyCompleted;

  let after = saveModuleProgress(before, stageId, kind, moduleId, points, passed);
  let saveFailed = hasSaveFailed();
  const gam: GamificationData = loadGamification();

  // Mystery box first: its points count towards this chapter's milestones.
  let mystery = firstTimePass ? roll(gam.badges) : null;
  let mysteryChest: Chest[] = [];
  if (mystery?.type === "chest" && mystery.chestType) {
    const chest: Chest = {
      id: `chest_m_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type: mystery.chestType,
      earnedAt: new Date().toISOString(),
      opened: false,
    };
    // Never announce a chest the cap will not let through.
    if (capNewChests(gam.chests, [chest]).length > 0) mysteryChest = [chest];
    else mystery = pointsInstead();
  }
  if (mystery?.type === "points" && mystery.points) {
    after = addPointsToStored(mystery.points) ?? after;
    saveFailed = saveFailed || hasSaveFailed();
  }
  const mysteryBadge = mystery?.type === "badge" && mystery.badgeId ? mystery.badgeId : null;

  const prevExercises = gam.exercisesCompleted ?? 0;
  const newExercises = prevExercises + (firstTimePass ? 1 : 0);

  const pointChests = chestsEarnedFromPoints(before.totalPoints, after.totalPoints, gam.pointsMilestonesRewarded ?? []);
  const exChests = chestsEarnedFromExercises(prevExercises, newExercises, gam.exerciseMilestonesRewarded ?? []);
  const achChests = chestsEarnedFromAchievements(
    unlockedIds(before),
    unlockedIds(after),
    gam.achievementsRewarded ?? []
  );

  const newChests = capNewChests(gam.chests, [
    ...pointChests.map((c) => c.chest),
    ...exChests.map((c) => c.chest),
    ...achChests.map((c) => c.chest),
    ...mysteryChest,
  ]);

  // The boss belongs to this world: the fanfare fires when this very chapter
  // brought the world up to its next ten.
  const winsHere = bossWinsInStage(gam, stageId);
  const gateBefore = getBossGate(completedModulesInStage(before, stageId), winsHere);
  const gateAfter = getBossGate(completedModulesInStage(after, stageId), winsHere);

  saveGamification({
    ...gam,
    chests: [...gam.chests, ...newChests],
    badges: mysteryBadge && !gam.badges.includes(mysteryBadge) ? [...gam.badges, mysteryBadge] : gam.badges,
    exercisesCompleted: newExercises,
    bossUnlocked: gam.bossUnlocked || gateAfter.unlocked,
    // Milestones are marked even when the cap swallowed their chest, or the
    // "missed milestones" check on the chest page would hand them out anyway.
    pointsMilestonesRewarded: [...(gam.pointsMilestonesRewarded ?? []), ...pointChests.map((c) => c.milestone)],
    exerciseMilestonesRewarded: [...(gam.exerciseMilestonesRewarded ?? []), ...exChests.map((c) => c.milestone)],
    achievementsRewarded: [...(gam.achievementsRewarded ?? []), ...achChests.map((c) => c.achievementId)],
  });
  saveFailed = saveFailed || hasSaveFailed();

  // A passed chapter may turn up the secret mission. Not on top of a mystery
  // box, which already has its own popup after the result screen.
  const missionOffered = passed && !mystery && !input.noMission && rollChapterMission(stageId);

  return {
    student: after,
    wasAlreadyCompleted,
    prevAttempts,
    newChests,
    // The mystery chest has its own popup, so announce a milestone chest here.
    chestEarned: newChests.find((c) => !mysteryChest.includes(c))?.type,
    bossOpenedNow: !gateBefore.unlocked && gateAfter.unlocked,
    mystery,
    saveFailed,
    missionOffered,
  };
}
