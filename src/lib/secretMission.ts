/**
 * Hemligt uppdrag – a surprise offer of five mixed exercises for double points.
 *
 * It can turn up in two ways:
 *   – after a passed chapter, with a small chance, on the result screen, or
 *   – as a hidden golden star that appears once a day somewhere in the app.
 *
 * The exercises come from chapters the pupil has already passed in that world,
 * so the mission is repetition at the right level, never something new.
 *
 * Guards, so that it rewards practice and cannot be farmed:
 *   – at most one mission a day, whichever way it was found;
 *   – only after the day's first chapter (the same rule as the games);
 *   – a one-time offer: leaving the offer without taking it uses it up;
 *   – no restart: an accepted mission resumes where it was left and pays once;
 *   – it does not count as a chapter, for the boss or the chapter chests.
 *
 * Everything lives in this browser, under the pupil's own key; nothing is
 * sent anywhere.
 */
import type { StageId, StudentData, StageContent, GrammarExercise, ChestType, Chest } from "./types";
import { localDayKey } from "./dates";
import {
  getStoredStudent,
  getCurrentStudentName,
  hasDoneModuleToday,
  addPointsToStored,
  loadGamification,
  saveGamification,
} from "./storage";
import { capNewChests } from "./gamification";

/** Normal chapters pay 15 points a right answer; the mission pays double. */
export const MISSION_POINTS_PER_CORRECT = 30;
export const MISSION_QUESTIONS = 5;
/** Chance that a passed chapter offers the mission (when none was had today). */
export const MISSION_CHANCE = 0.2;
/** Extra reward for five right out of five. */
export const MISSION_PERFECT_CHEST: ChestType = "silver";

export type MissionSource = "chapter" | "star";
export type MissionStatus = "offered" | "accepted" | "done" | "declined";

/** Points to one exercise in the content, so a mission can be resumed after a reload. */
export interface MissionExerciseRef {
  kind: "grammar" | "spelling";
  moduleId: string;
  index: number;
}

export interface SecretMission {
  /** Local day the mission belongs to. A mission from another day is gone. */
  day: string;
  stageId: StageId;
  source: MissionSource;
  status: MissionStatus;
  /** Chosen when the mission is accepted. */
  exercises?: MissionExerciseRef[];
  /** One entry per answered exercise, so a reload continues instead of restarting. */
  answers?: boolean[];
  /** How many exercises have been put on screen. One more than answers means
   *  an exercise was shown and the page left before it was answered. */
  shown?: number;
  /** Set when the mission is finished. */
  pointsAwarded?: number;
  chestAwarded?: ChestType;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

function missionKey(name: string): string {
  return `svenskajakten_mission_${name}`;
}

function read(name: string): SecretMission | null {
  try {
    const raw = localStorage.getItem(missionKey(name));
    return raw ? (JSON.parse(raw) as SecretMission) : null;
  } catch {
    return null;
  }
}

function write(name: string, mission: SecretMission): void {
  try {
    localStorage.setItem(missionKey(name), JSON.stringify(mission));
  } catch {
    // A mission that cannot be saved is simply not offered again; nothing to do.
  }
}

/** Today's mission for the logged-in pupil, in whatever state, or null. */
export function getTodaysMission(): SecretMission | null {
  if (typeof window === "undefined") return null;
  const name = getCurrentStudentName();
  if (!name) return null;
  const m = read(name);
  return m && m.day === localDayKey() ? m : null;
}

function saveTodaysMission(mission: SecretMission): void {
  const name = getCurrentStudentName();
  if (name) write(name, mission);
}

// ─── Which exercises ──────────────────────────────────────────────────────────

/** Exercise types the mission can show. Listening needs a voice, which not every device has. */
function usable(ex: GrammarExercise): boolean {
  return ex.type !== "listen-spell";
}

/** Every exercise from chapters the pupil has passed in this world. */
export function eligibleExercises(student: StudentData, stageId: StageId, content: StageContent): MissionExerciseRef[] {
  const progress = student.stages[stageId];
  if (!progress) return [];
  const refs: MissionExerciseRef[] = [];
  for (const mod of content.grammar ?? []) {
    if (!progress.grammarModules?.[mod.id]?.completed) continue;
    mod.exercises.forEach((ex, index) => { if (usable(ex)) refs.push({ kind: "grammar", moduleId: mod.id, index }); });
  }
  for (const mod of content.spelling ?? []) {
    if (!progress.spellingModules?.[mod.id]?.completed) continue;
    mod.exercises.forEach((ex, index) => { if (usable(ex)) refs.push({ kind: "spelling", moduleId: mod.id, index }); });
  }
  return refs;
}

/** True when the pupil has passed at least one grammar or spelling chapter in this world. */
export function hasPassedChapterIn(student: StudentData, stageId: StageId): boolean {
  const p = student.stages[stageId];
  if (!p) return false;
  const any = (m?: Record<string, { completed?: boolean }>) => Object.values(m ?? {}).some((x) => x?.completed);
  return any(p.grammarModules) || any(p.spellingModules);
}

/**
 * Five exercises, spread over as many different chapters as possible so the
 * mission really is mixed and not five questions from the same page.
 */
export function pickMissionExercises(refs: MissionExerciseRef[], rand: () => number = Math.random): MissionExerciseRef[] {
  const byModule = new Map<string, MissionExerciseRef[]>();
  for (const r of refs) {
    const key = `${r.kind}:${r.moduleId}`;
    byModule.set(key, [...(byModule.get(key) ?? []), r]);
  }
  const shuffle = <T,>(list: T[]): T[] => {
    const a = [...list];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const groups = shuffle([...byModule.values()].map((g) => shuffle(g)));
  const picked: MissionExerciseRef[] = [];
  // Take one from each chapter in turn until five are chosen.
  for (let round = 0; picked.length < MISSION_QUESTIONS; round++) {
    let tookAny = false;
    for (const g of groups) {
      if (picked.length >= MISSION_QUESTIONS) break;
      if (g[round]) { picked.push(g[round]); tookAny = true; }
    }
    if (!tookAny) break;
  }
  return picked;
}

export function resolveExercise(content: StageContent, ref: MissionExerciseRef): GrammarExercise | undefined {
  const list = ref.kind === "grammar" ? content.grammar : content.spelling;
  return list?.find((m) => m.id === ref.moduleId)?.exercises[ref.index];
}

// ─── Offering ─────────────────────────────────────────────────────────────────

/** Whether a mission may be offered at all right now (before any chance roll). */
export function canOfferMission(student: StudentData | null, stageId: StageId): boolean {
  if (!student) return false;
  if (getTodaysMission()) return false;           // one a day, whichever way
  if (!hasDoneModuleToday(student)) return false; // only after the day's first chapter
  return hasPassedChapterIn(student, stageId);
}

/**
 * Called after a passed chapter. With MISSION_CHANCE, records an offer for
 * today and returns true. The offer is recorded straight away, so a reload of
 * the result screen cannot roll again.
 */
export function rollChapterMission(stageId: StageId, rand: () => number = Math.random): boolean {
  const student = getStoredStudent();
  if (!canOfferMission(student, stageId)) return false;
  if (rand() >= MISSION_CHANCE) return false;
  saveTodaysMission({ day: localDayKey(), stageId, source: "chapter", status: "offered" });
  return true;
}

/** Called when the pupil clicks the golden star. Records the offer for today. */
export function offerFromStar(stageId: StageId): boolean {
  const student = getStoredStudent();
  if (!canOfferMission(student, stageId)) return false;
  saveTodaysMission({ day: localDayKey(), stageId, source: "star", status: "offered" });
  return true;
}

/** The pupil said no, or left the offer without taking it. Uses up today's mission. */
export function declineMission(): void {
  const m = getTodaysMission();
  if (m?.status === "offered") saveTodaysMission({ ...m, status: "declined" });
}

/**
 * The pupil took the offer. The five exercises are chosen now and stored, so
 * a reload shows the same ones instead of dealing a fresh, easier set.
 */
export function acceptMission(content: StageContent, rand: () => number = Math.random): SecretMission | null {
  const m = getTodaysMission();
  const student = getStoredStudent();
  if (!m || m.status !== "offered" || !student) return null;
  const exercises = pickMissionExercises(eligibleExercises(student, m.stageId, content), rand);
  if (exercises.length === 0) return null;
  const accepted: SecretMission = { ...m, status: "accepted", exercises, answers: [] };
  saveTodaysMission(accepted);
  return accepted;
}

/**
 * Notes that exercise number `index` is on screen. If the page is reloaded
 * before it is answered, it counts as wrong — otherwise a pupil could see the
 * right answer, reload and answer it again.
 */
export function markMissionShown(index: number): void {
  const m = getTodaysMission();
  if (!m || m.status !== "accepted") return;
  if ((m.shown ?? 0) <= index) saveTodaysMission({ ...m, shown: index + 1 });
}

/** On opening the mission page: an exercise left unanswered by a reload counts as wrong. */
export function settleAbandonedExercise(): SecretMission | null {
  const m = getTodaysMission();
  if (!m || m.status !== "accepted" || !m.exercises) return m;
  const answers = m.answers ?? [];
  if ((m.shown ?? 0) > answers.length && answers.length < m.exercises.length) {
    const updated = { ...m, answers: [...answers, false] };
    saveTodaysMission(updated);
    return updated;
  }
  return m;
}

/** Stores one answer, so leaving and coming back continues where the pupil was. */
export function recordMissionAnswer(correct: boolean): SecretMission | null {
  const m = getTodaysMission();
  if (!m || m.status !== "accepted" || !m.exercises) return null;
  const answers = [...(m.answers ?? []), correct].slice(0, m.exercises.length);
  const updated = { ...m, answers };
  saveTodaysMission(updated);
  return updated;
}

/**
 * Pays out once, when every exercise has an answer: double points for each
 * right answer and a silver chest for all right. Calling it again returns the
 * finished mission without paying a second time.
 */
export function completeMission(): SecretMission | null {
  const m = getTodaysMission();
  if (!m) return null;
  if (m.status === "done") return m;
  if (m.status !== "accepted" || !m.exercises || (m.answers?.length ?? 0) < m.exercises.length) return null;

  const correct = (m.answers ?? []).filter(Boolean).length;
  const points = correct * MISSION_POINTS_PER_CORRECT;
  // Mark it done before paying, so a crash in between can never pay twice.
  const done: SecretMission = { ...m, status: "done", pointsAwarded: points };
  saveTodaysMission(done);
  if (points > 0) addPointsToStored(points);

  if (correct === m.exercises.length) {
    const gam = loadGamification();
    const chest: Chest = {
      id: `chest_uppdrag_${Date.now()}`,
      type: MISSION_PERFECT_CHEST,
      earnedAt: new Date().toISOString(),
      opened: false,
    };
    if (capNewChests(gam.chests, [chest]).length > 0) {
      saveGamification({ ...gam, chests: [...gam.chests, chest] });
      done.chestAwarded = MISSION_PERFECT_CHEST;
      saveTodaysMission(done);
    }
  }
  return done;
}

// ─── The golden star ──────────────────────────────────────────────────────────

export type StarSpot = "home" | "world";

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Where today's star hides, and where on that page. Fixed for the day and the
 * pupil, so it does not jump around on every reload, but different tomorrow
 * and different from a classmate's.
 */
export function starPlacement(name: string, day: string = localDayKey()): { spot: StarSpot; x: number; y: number } {
  const h = hash(`${name.toLowerCase()}|${day}`);
  return {
    spot: h % 2 === 0 ? "home" : "world",
    x: 8 + (h >>> 3) % 80,  // 8–87 % across
    y: 10 + (h >>> 11) % 75, // 10–84 % down
  };
}
