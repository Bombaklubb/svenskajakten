import type { StudentData, StageId, ModuleProgress, StageProgress, HeroConfig, GamificationData, RetryItem, LastVisited } from "./types";
import {
  defaultGamificationData,
  getPointsMultiplier,
  computeGameAward,
  DAILY_LOGIN_BONUS,
  MILESTONE_SCALE,
  POINT_CHEST_MILESTONES,
  migrateExerciseMilestones,
  completedChaptersTotal,
} from "./gamification";
import { getShopAvatar, getFrame, getTheme, getEffect, SHOP_AVATARS, FRAMES, THEMES, EFFECTS } from "./shop";
import { STARTER_AVATARS, type Avatar } from "./avatars";
import { localDayKey, previousLocalDayKey } from "./dates";

// Legacy key (single student) – kept only for migration
const LEGACY_KEY = "svenskajakten_student";
const LEGACY_GAMIFICATION_KEY = "svenskajakten_gamification";

// New keys
const STUDENTS_KEY = "svenskajakten_students"; // Record<name, StudentData>
const CURRENT_KEY = "svenskajakten_current";   // currently logged-in name

function emptyStageProgress(stageId: StageId): StageProgress {
  return {
    stageId,
    grammarModules: {},
    spellingModules: {},
    wordsearchModules: {},
    stavningstestModules: {},
  };
}

function defaultStudentData(name: string): StudentData {
  const now = new Date().toISOString();
  return {
    name,
    createdAt: now,
    lastActive: now,
    totalPoints: 0,
    spentPoints: 0,
    ownedAvatars: [],
    ownedFrames: [],
    ownedThemes: [],
    ownedEffects: [],
    stages: {
      lagstadiet: emptyStageProgress("lagstadiet"),
      mellanstadiet: emptyStageProgress("mellanstadiet"),
      hogstadiet: emptyStageProgress("hogstadiet"),
      gymnasiet: emptyStageProgress("gymnasiet"),
    },
  };
}

/**
 * Write to localStorage without ever throwing.
 *
 * setItem raises QuotaExceededError when storage is full (and in Safari's
 * private mode it throws for every write). An uncaught error here would crash
 * the page mid-exercise, so failures are reported through the return value and
 * surfaced to the pupil by the caller instead.
 */
function safeSetItem(key: string, value: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/** Set when a save fails, so the UI can warn that progress is not being stored. */
let lastSaveFailed = false;

/** Fired on window whenever a save fails, so a warning can appear without polling. */
export const SAVE_FAILED_EVENT = "svenskajakten:save-failed";

/** True when the most recent save to localStorage could not be completed. */
export function hasSaveFailed(): boolean {
  return lastSaveFailed;
}

/** Record the outcome of a save and tell any listening UI when it failed. */
function recordSave(ok: boolean): void {
  lastSaveFailed = !ok;
  if (!ok && typeof window !== "undefined") {
    try {
      window.dispatchEvent(new Event(SAVE_FAILED_EVENT));
    } catch {
      // ignore (no DOM events, e.g. in tests)
    }
  }
}

/** A map keyed by pupil name. Null prototype: a pupil called "constructor" or
 *  "toString" must not find the method Object.prototype already has there. */
type StudentMap = Record<string, StudentData>;

function emptyStudentMap(): StudentMap {
  return Object.create(null) as StudentMap;
}

function getAllStudents(): StudentMap {
  if (typeof window === "undefined") return emptyStudentMap();
  try {
    const raw = localStorage.getItem(STUDENTS_KEY);
    if (!raw) return emptyStudentMap();
    const parsed = JSON.parse(raw) as StudentMap;
    // A corrupt blob must not silently wipe every pupil on the device: keep a
    // copy so the data can be recovered by hand instead of being overwritten.
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      safeSetItem(`${STUDENTS_KEY}_corrupt_backup`, raw);
      return emptyStudentMap();
    }
    // JSON.parse stores even "__proto__" as an own key; copying onto a
    // null-prototype object keeps it that way.
    return Object.assign(emptyStudentMap(), parsed);
  } catch {
    const raw = localStorage.getItem(STUDENTS_KEY);
    if (raw) safeSetItem(`${STUDENTS_KEY}_corrupt_backup`, raw);
    return emptyStudentMap();
  }
}

function saveAllStudents(all: StudentMap): void {
  if (typeof window === "undefined") return;
  recordSave(safeSetItem(STUDENTS_KEY, JSON.stringify(all)));
}

/** The stored pupil with exactly this name, never an inherited property. */
function ownStudent(all: StudentMap, name: string): StudentData | null {
  return Object.hasOwn(all, name) ? all[name] : null;
}

/**
 * The stored name a login refers to: the exact name when it exists, otherwise
 * the one pupil whose name differs only in capitals ("emma" finds "Emma").
 * When several names match that way nothing is returned, so two existing
 * accounts are never merged or confused with each other.
 */
function findStudentKey(all: StudentMap, name: string): string | null {
  if (Object.hasOwn(all, name)) return name;
  const lower = name.toLocaleLowerCase("sv");
  const matches = Object.keys(all).filter((k) => k.toLocaleLowerCase("sv") === lower);
  return matches.length === 1 ? matches[0] : null;
}

/**
 * Why a name cannot be used, or null when it is fine. Names starting with "__"
 * are reserved: "__proto__" and friends are special to JavaScript objects.
 */
export function validateStudentName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Skriv ditt namn först.";
  if (trimmed.startsWith("__")) return "Namnet får inte börja med två understreck.";
  return null;
}

/** The pupil currently logged in, straight from storage with no side effects. */
export function getStoredStudent(): StudentData | null {
  if (typeof window === "undefined") return null;
  const name = getCurrentName();
  if (!name) return null;
  return ownStudent(getAllStudents(), name);
}

/** The stored copy of this pupil, or the given one if it was never saved. */
function freshCopy(data: StudentData): StudentData {
  return ownStudent(getAllStudents(), data.name) ?? data;
}

function getCurrentName(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CURRENT_KEY);
}

function getGamificationKey(): string {
  const name = getCurrentName();
  if (name) return `${LEGACY_GAMIFICATION_KEY}_${name}`;
  return LEGACY_GAMIFICATION_KEY;
}

/** Migrate old single-student data into the new per-student store */
function migrateIfNeeded(): void {
  if (typeof window === "undefined") return;
  const legacy = localStorage.getItem(LEGACY_KEY);
  if (!legacy) return;
  try {
    const data = JSON.parse(legacy) as StudentData;
    if (!data.name) return;
    if (validateStudentName(data.name)) return;
    const all = getAllStudents();
    if (!Object.hasOwn(all, data.name)) {
      all[data.name] = data;
      saveAllStudents(all);
      // Migrate gamification too
      const legacyGam = localStorage.getItem(LEGACY_GAMIFICATION_KEY);
      if (legacyGam) {
        safeSetItem(`${LEGACY_GAMIFICATION_KEY}_${data.name}`, legacyGam);
      }
    }
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    // ignore
  }
}

export function loadStudent(): StudentData | null {
  if (typeof window === "undefined") return null;
  migrateIfNeeded();
  const name = getCurrentName();
  if (!name) return null;
  const all = getAllStudents();
  const stored = ownStudent(all, name);
  if (!stored) return null;
  const data: StudentData = { ...stored };
  let changed = false;
  // Saves from before the shop have no owned avatars at all: the avatar they
  // picked at signup was theirs, so it becomes their first owned one. Anyone
  // else only owns what they got at signup or bought — equipping something is
  // never a way to own it.
  if (!data.ownedAvatars || data.ownedAvatars.length === 0) {
    data.ownedAvatars = [data.avatar ?? DEFAULT_AVATAR];
    changed = true;
  } else if (data.avatar && !data.ownedAvatars.includes(data.avatar)) {
    data.avatar = data.ownedAvatars[0];
    changed = true;
  }
  const today = localDayKey();
  if (data.lastStreakDate !== today) {
    const yesterday = previousLocalDayKey();
    data.streak = data.lastStreakDate === yesterday ? (data.streak ?? 0) + 1 : 1;
    data.lastStreakDate = today;
    // Daily bonus: reward the first activity of the day.
    data.totalPoints += DAILY_LOGIN_BONUS;
    try {
      sessionStorage.setItem("dailyBonusAwarded", String(DAILY_LOGIN_BONUS));
    } catch {
      // ignore (sessionStorage unavailable)
    }
    changed = true;
  }
  if (changed) {
    all[name] = data;
    saveAllStudents(all);
  }
  return data;
}

export function saveStudent(data: StudentData): void {
  if (typeof window === "undefined") return;
  // Stamped on a copy: callers keep holding the object they passed in, and
  // mutating it behind their back is how "before" values used to go stale.
  const toSave: StudentData = { ...data, lastActive: new Date().toISOString() };
  const all = getAllStudents();
  all[toSave.name] = toSave;
  saveAllStudents(all);
  safeSetItem(CURRENT_KEY, toSave.name);
}

/**
 * Add points to the pupil as stored on the device and return the result.
 *
 * Every screen that pays out — chests, the boss, the retry queue — used to do
 * `{ ...student, totalPoints: student.totalPoints + n }` on the copy it held in
 * component state. That copy is whatever was loaded when the page opened, so a
 * save from anywhere else in between was silently overwritten. Reading the
 * stored pupil at the moment of paying out removes that whole class of bug.
 */
export function addPointsToStored(points: number): StudentData | null {
  if (typeof window === "undefined") return null;
  const name = getCurrentName();
  if (!name) return null;
  const current = ownStudent(getAllStudents(), name);
  if (!current) return null;
  const rounded = Math.max(0, Math.round(points));
  if (rounded === 0) return current;
  const updated = { ...current, totalPoints: current.totalPoints + rounded };
  saveStudent(updated);
  return updated;
}

export interface GameAward {
  /** The saved pupil, or null when nobody is logged in. */
  student: StudentData | null;
  /** Points actually added, after the replay decay and the daily cap. */
  awarded: number;
  /** The decay applied to this round (1 for the first play of the day). */
  multiplier: number;
  /** True when the daily cap swallowed part or all of the round. */
  capped: boolean;
  /** True when no chapter has been finished today, so the games pay nothing. */
  locked: boolean;
}

/** True once the pupil has finished a chapter today, which opens the games. */
export function hasDoneModuleToday(student: StudentData | null): boolean {
  return !!student && student.lastModuleDay === localDayKey();
}

/**
 * Add points earned in a mini-game to the current pupil.
 *
 * The games can be restarted for ever, so unlike a module they cannot simply
 * pay their score out every time — that would make replaying one game the
 * fastest way to earn points in the whole app. Each round is therefore worth
 * less than the last (see getGamePointsMultiplier) and every game stops paying
 * once it has given MINIGAME_DAILY_CAP points today. Both reset at midnight.
 *
 * Reads the stored pupil rather than taking one as an argument so a stale copy
 * held in component state cannot overwrite progress saved elsewhere.
 */
export function awardGamePoints(gameId: string, rawPoints: number): GameAward {
  const empty: GameAward = { student: null, awarded: 0, multiplier: 1, capped: false, locked: false };
  if (typeof window === "undefined") return empty;
  const name = getCurrentName();
  if (!name) return empty;
  const current = ownStudent(getAllStudents(), name);
  if (!current) return empty;
  // The games are a reward for doing the exercises, so they pay nothing on a day
  // with no chapter behind it. The tab is locked in the UI as well — paying zero
  // without saying why would read as a bug.
  if (!hasDoneModuleToday(current)) {
    return { ...empty, student: current, locked: true };
  }
  // A round worth nothing must not burn a step of the replay decay, or a pupil
  // who has a bad first go would earn less for the good round that follows.
  if (Math.round(Math.max(0, rawPoints)) === 0) return { ...empty, student: current };

  const today = localDayKey();
  const sameDay = current.gamePlays?.date === today;
  const games = sameDay ? { ...current.gamePlays!.games } : {};
  const record = games[gameId] ?? { plays: 0, points: 0 };

  const { awarded, multiplier, capped } = computeGameAward(rawPoints, record.plays, record.points);

  games[gameId] = { plays: record.plays + 1, points: record.points + awarded };
  const updated: StudentData = {
    ...current,
    totalPoints: current.totalPoints + awarded,
    gamePlays: { date: today, games },
  };
  saveStudent(updated);
  return { student: updated, awarded, multiplier, capped, locked: false };
}

/** The avatar every pupil can fall back on; always free. */
export const DEFAULT_AVATAR = "ninja";

/**
 * The starter avatars a new pupil may pick for free: the ones of the cheapest
 * rarity ("vanlig"). The others are on the login screen's old list too, but the
 * dragon, the unicorn and the genie cost 2 500 points in the shop — handing
 * them out at signup made the shop's rarest items free for anyone who typed a
 * new name. Show only these on the signup screen.
 */
export const FREE_STARTER_AVATARS: Avatar[] = STARTER_AVATARS.filter(
  (a) => getShopAvatar(a.id)?.rarity === "vanlig"
);

/** True when a new pupil may start with this avatar without buying it. */
export function isFreeStarterAvatar(id: string | undefined): boolean {
  return !!id && FREE_STARTER_AVATARS.some((a) => a.id === id);
}

/**
 * Log in: return the stored pupil with this name, or create a new one.
 *
 * The avatar is only used for a new pupil, and only when it is a free starter
 * (anything else becomes the default). A returning pupil keeps the avatar they
 * have equipped — the login screen always has one selected, so honouring it
 * here swapped out whatever they had bought.
 *
 * Throws when the name is not allowed (see validateStudentName).
 */
export function createStudent(name: string, avatar?: string): StudentData {
  const trimmed = name.trim();
  const invalid = validateStudentName(trimmed);
  if (invalid) throw new Error(invalid);
  migrateIfNeeded();
  const all = getAllStudents();
  const key = findStudentKey(all, trimmed);
  const existing = key !== null ? ownStudent(all, key) : null;
  if (existing) {
    saveStudent(existing);
    return { ...existing };
  }
  const data = defaultStudentData(trimmed);
  const chosen = isFreeStarterAvatar(avatar) ? avatar! : DEFAULT_AVATAR;
  data.avatar = chosen;
  data.ownedAvatars = [chosen];
  saveStudent(data);
  return data;
}

export function clearStudent(): void {
  if (typeof window === "undefined") return;
  // Only clear the session pointer – student data stays in STUDENTS_KEY
  localStorage.removeItem(CURRENT_KEY);
}

export function studentExists(name: string): boolean {
  if (typeof window === "undefined") return false;
  const trimmed = name.trim();
  if (!trimmed || validateStudentName(trimmed)) return false;
  migrateIfNeeded();
  return findStudentKey(getAllStudents(), trimmed) !== null;
}

export function saveHero(hero: HeroConfig): void {
  const data = loadStudent();
  if (!data) return;
  data.hero = hero;
  saveStudent(data);
}

export function getModuleProgress(
  data: StudentData,
  stageId: StageId,
  kind: "grammar" | "spelling" | "wordsearch" | "stavningstest",
  moduleId: string
): ModuleProgress | null {
  const stage = data.stages?.[stageId];
  if (!stage) return null;
  const map =
    kind === "grammar" ? (stage.grammarModules ?? {})
    : kind === "spelling" ? (stage.spellingModules ?? {})
    : kind === "stavningstest" ? (stage.stavningstestModules ?? {})
    : (stage.wordsearchModules ?? {});
  return Object.hasOwn(map, moduleId) ? map[moduleId] : null;
}

/**
 * Record one finished attempt at a chapter and return the saved pupil.
 *
 * Never mutates `data`. Callers compare the pupil before and after (point
 * milestones, achievements, the boss gate), which silently broke when this
 * function changed their "before" object in place. The update is applied to
 * the pupil as stored on the device, not to `data`, so a save made elsewhere
 * since the page loaded (a chest opened in another tab, say) is kept.
 */
export function saveModuleProgress(
  data: StudentData,
  stageId: StageId,
  kind: "grammar" | "spelling" | "wordsearch" | "stavningstest",
  moduleId: string,
  points: number,
  completed: boolean
): StudentData {
  const base = freshCopy(data);
  const updated: StudentData = structuredClone(base);
  const prevStage = updated.stages?.[stageId];
  const stage: StageProgress = {
    stageId,
    grammarModules: prevStage?.grammarModules ?? {},
    spellingModules: prevStage?.spellingModules ?? {},
    wordsearchModules: prevStage?.wordsearchModules ?? {},
    stavningstestModules: prevStage?.stavningstestModules ?? {},
  };
  updated.stages = { ...updated.stages, [stageId]: stage };
  const map =
    kind === "grammar" ? stage.grammarModules
    : kind === "spelling" ? stage.spellingModules
    : kind === "stavningstest" ? stage.stavningstestModules
    : stage.wordsearchModules;
  const existing = Object.hasOwn(map, moduleId) ? map[moduleId] : undefined;
  const prevAttempts = existing?.attempts ?? 0;
  const multiplier = getPointsMultiplier(prevAttempts);
  const addedPoints = Math.max(0, Math.round(points * multiplier));

  map[moduleId] = {
    moduleId,
    completed: (existing?.completed ?? false) || completed,
    points: (existing?.points ?? 0) + addedPoints,
    attempts: prevAttempts + 1,
    lastAttempt: new Date().toISOString(),
  };

  // Finishing a chapter opens the mini-games for the rest of the day. Every
  // kind of chapter goes through here, so this is the one place to record it.
  if (completed) updated.lastModuleDay = localDayKey();

  updated.totalPoints = base.totalPoints + addedPoints;
  saveStudent(updated);
  return updated;
}

export function loadGamification(): GamificationData {
  if (typeof window === "undefined") return defaultGamificationData();
  try {
    const raw = localStorage.getItem(getGamificationKey());
    if (!raw) return defaultGamificationData();
    const data = JSON.parse(raw) as GamificationData;
    // Migration: ensure new fields exist for existing users
    if (!data.achievementsRewarded) data.achievementsRewarded = [];

    const scale = data.milestoneScale ?? 1;
    if (scale < MILESTONE_SCALE) {
      const name = getCurrentName();
      const stored = name ? ownStudent(getAllStudents(), name) : null;

      // Scale 2: the point milestones were rebalanced for the current points
      // economy. A pupil who already has points would otherwise count every
      // new milestone below their total as "missed" and be handed a pile of
      // chests at once, so mark everything already passed as rewarded and let
      // only future progress pay out.
      if (scale < 2) {
        const points = stored?.totalPoints ?? 0;
        data.pointsMilestonesRewarded = [
          ...new Set([
            ...(data.pointsMilestonesRewarded ?? []),
            ...POINT_CHEST_MILESTONES.filter((m) => m.points <= points).map((m) => m.points),
          ]),
        ];
      }

      // Scale 3: the chapter milestones were rescaled and now count first-time
      // passes only. See migrateExerciseMilestones for why this is fair.
      Object.assign(data, migrateExerciseMilestones(data, completedChaptersTotal(stored)));

      data.milestoneScale = MILESTONE_SCALE;
      recordSave(safeSetItem(getGamificationKey(), JSON.stringify(data)));
    }
    return data;
  } catch {
    return defaultGamificationData();
  }
}

export function saveGamification(data: GamificationData): void {
  if (typeof window === "undefined") return;
  recordSave(safeSetItem(getGamificationKey(), JSON.stringify(data)));
}

export function clearGamification(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(getGamificationKey());
}

export function exportProgress(data: StudentData): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `svenskajakten_${data.name.replace(/\s+/g, "_")}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

const ALL_STAGES: StageId[] = ["lagstadiet", "mellanstadiet", "hogstadiet", "gymnasiet"];

/** Keep only string ids that exist in the shop list, without duplicates. */
function knownIds(value: unknown, valid: Set<string>): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((v): v is string => typeof v === "string" && valid.has(v)))];
}

const VALID_AVATAR_IDS = new Set(SHOP_AVATARS.map((a) => a.id));
const VALID_FRAME_IDS = new Set(FRAMES.map((f) => f.id));
const VALID_THEME_IDS = new Set(THEMES.map((t) => t.id));
const VALID_EFFECT_IDS = new Set(EFFECTS.map((e) => e.id));

function finiteNonNegative(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
}

/**
 * Repair an imported file into a complete StudentData.
 * A backup from an older version can be missing stages or newer fields, and
 * reading those later would crash the page, so everything is filled in here.
 *
 * A backup is also a hand-editable JSON file, so nothing in it is trusted:
 * owned items must exist in the shop, equipped items must be owned, and the
 * points spent can be neither negative (free money) nor above the total.
 * Exported for the tests.
 */
export function normaliseImported(raw: unknown): StudentData | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const data = raw as Partial<StudentData>;
  if (typeof data.name !== "string" || !data.name.trim()) return null;
  if (validateStudentName(data.name)) return null;

  const stages = {} as StudentData["stages"];
  const rawStages = data.stages && typeof data.stages === "object" ? data.stages : undefined;
  const moduleMap = (v: unknown) =>
    v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, ModuleProgress>) : {};
  for (const id of ALL_STAGES) {
    const existing = rawStages && Object.hasOwn(rawStages, id)
      ? (rawStages as Partial<Record<StageId, StageProgress>>)[id]
      : undefined;
    stages[id] = {
      stageId: id,
      grammarModules: moduleMap(existing?.grammarModules),
      spellingModules: moduleMap(existing?.spellingModules),
      wordsearchModules: moduleMap(existing?.wordsearchModules),
      stavningstestModules: moduleMap(existing?.stavningstestModules),
    };
  }

  const totalPoints = finiteNonNegative(data.totalPoints);
  const spentPoints = Math.min(totalPoints, finiteNonNegative(data.spentPoints));
  const ownedAvatars = knownIds(data.ownedAvatars, VALID_AVATAR_IDS);
  const ownedFrames = knownIds(data.ownedFrames, VALID_FRAME_IDS);
  const ownedThemes = knownIds(data.ownedThemes, VALID_THEME_IDS);
  const ownedEffects = knownIds(data.ownedEffects, VALID_EFFECT_IDS);
  // An old backup without owned avatars keeps the free default only.
  if (ownedAvatars.length === 0) ownedAvatars.push(DEFAULT_AVATAR);
  const equipped = (id: unknown, owned: string[]) =>
    typeof id === "string" && owned.includes(id) ? id : "";

  const now = new Date().toISOString();
  return {
    ...data,
    name: data.name.trim(),
    createdAt: typeof data.createdAt === "string" ? data.createdAt : now,
    lastActive: now,
    totalPoints,
    spentPoints,
    avatar: typeof data.avatar === "string" && ownedAvatars.includes(data.avatar) ? data.avatar : ownedAvatars[0],
    ownedAvatars,
    ownedFrames,
    ownedThemes,
    ownedEffects,
    equippedFrame: equipped(data.equippedFrame, ownedFrames),
    equippedTheme: equipped(data.equippedTheme, ownedThemes),
    equippedEffect: equipped(data.equippedEffect, ownedEffects),
    stages,
  };
}

/**
 * Read a backup file and return the student it contains, WITHOUT saving it.
 * The caller shows the pupil what the file holds and asks for confirmation
 * before it replaces the progress already on the device.
 */
export function readProgressFile(file: File): Promise<StudentData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        const data = normaliseImported(parsed);
        if (!data) throw new Error("Ogiltig fil");
        resolve(data);
      } catch {
        reject(new Error("Kunde inte läsa filen. Kontrollera att det är rätt fil."));
      }
    };
    reader.onerror = () => reject(new Error("Filläsning misslyckades."));
    reader.readAsText(file);
  });
}

/** Progress already stored for this name (matched like a login), so the caller can warn before overwriting. */
export function getExistingProgress(name: string): StudentData | null {
  if (typeof window === "undefined") return null;
  const all = getAllStudents();
  const key = findStudentKey(all, name.trim());
  return key !== null ? ownStudent(all, key) : null;
}

/** Name of the pupil logged in on this device, or null. */
export function getCurrentStudentName(): string | null {
  return getCurrentName();
}

export function importProgress(file: File): Promise<StudentData> {
  return readProgressFile(file).then((data) => {
    saveStudent(data);
    return data;
  });
}

// ─── Retry queue ──────────────────────────────────────────────────────────────

function getRetryKey(stageId: string): string {
  const name = getCurrentName();
  return `svenskajakten_retry_${name ?? "anon"}_${stageId}`;
}

export function loadRetryQueue(stageId: string): RetryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getRetryKey(stageId));
    if (!raw) return [];
    return JSON.parse(raw) as RetryItem[];
  } catch {
    return [];
  }
}

/** Upper bound per stage – each item stores a whole exercise, so this can't grow forever. */
const MAX_RETRY_ITEMS = 60;

export function addToRetryQueue(item: RetryItem): void {
  if (typeof window === "undefined") return;
  const queue = loadRetryQueue(item.stageId);
  if (queue.some((q) => q.key === item.key)) return; // no duplicates
  queue.push(item);
  // Keep the most recent mistakes if the queue is at capacity.
  const trimmed = queue.length > MAX_RETRY_ITEMS ? queue.slice(-MAX_RETRY_ITEMS) : queue;
  safeSetItem(getRetryKey(item.stageId), JSON.stringify(trimmed));
}

export function removeFromRetryQueue(stageId: string, key: string): void {
  if (typeof window === "undefined") return;
  const queue = loadRetryQueue(stageId).filter((q) => q.key !== key);
  safeSetItem(getRetryKey(stageId), JSON.stringify(queue));
}

// ─── Fortsätt där du var ──────────────────────────────────────────────────────

function getLastVisitedKey(): string {
  return `svenskajakten_last_${getCurrentName() ?? "anon"}`;
}

/** Remember the module the pupil just opened. Called when a module page loads. */
export function recordLastVisited(item: Omit<LastVisited, "at">): void {
  if (typeof window === "undefined") return;
  if (!getCurrentName()) return;
  safeSetItem(getLastVisitedKey(), JSON.stringify({ ...item, at: new Date().toISOString() }));
}

export function loadLastVisited(): LastVisited | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getLastVisitedKey());
    if (!raw) return null;
    const data = JSON.parse(raw) as LastVisited;
    if (!data || typeof data.moduleId !== "string" || typeof data.stageId !== "string") return null;
    return data;
  } catch {
    return null;
  }
}

// ─── Shop (Affären) ───────────────────────────────────────────────────────────

/** Points the student still has available to spend in the shop. */
export function getSpendable(data: StudentData): number {
  return Math.max(0, data.totalPoints - (data.spentPoints ?? 0));
}

export type PurchaseResult =
  | { ok: true; student: StudentData }
  | { ok: false; reason: "owned" | "broke" | "missing" };

type OwnedKey = "ownedAvatars" | "ownedFrames" | "ownedThemes" | "ownedEffects";
type EquipKey = "avatar" | "equippedFrame" | "equippedTheme" | "equippedEffect";

/**
 * Buy one shop item for the pupil and equip it.
 *
 * Works on the pupil as stored on the device, not on `data`: the shop page
 * holds whatever was loaded when it opened, and saving that copy would undo a
 * chapter finished or a chest opened in another tab since.
 */
function buyItem(
  data: StudentData,
  itemId: string,
  price: number | undefined,
  ownedKey: OwnedKey,
  equipKey: EquipKey
): PurchaseResult {
  if (price === undefined) return { ok: false, reason: "missing" };
  const current = freshCopy(data);
  const owned = current[ownedKey] ?? [];
  if (owned.includes(itemId)) return { ok: false, reason: "owned" };
  if (getSpendable(current) < price) return { ok: false, reason: "broke" };

  const updated: StudentData = {
    ...current,
    spentPoints: (current.spentPoints ?? 0) + price,
    [ownedKey]: [...owned, itemId],
    [equipKey]: itemId, // auto-equip on purchase
  };
  saveStudent(updated);
  return { ok: true, student: updated };
}

/** Equip an owned item, or pass "" to remove it (not allowed for the avatar). */
function equipItem(data: StudentData, itemId: string, ownedKey: OwnedKey, equipKey: EquipKey): StudentData {
  const current = freshCopy(data);
  const allowEmpty = equipKey !== "avatar";
  if (!(allowEmpty && itemId === "") && !(current[ownedKey] ?? []).includes(itemId)) return current;
  const updated: StudentData = { ...current, [equipKey]: itemId };
  saveStudent(updated);
  return updated;
}

/** Buy an avatar. On success the avatar is added to ownedAvatars and equipped. */
export function buyAvatar(data: StudentData, avatarId: string): PurchaseResult {
  return buyItem(data, avatarId, getShopAvatar(avatarId)?.price, "ownedAvatars", "avatar");
}

/** Buy a frame. On success the frame is added to ownedFrames and equipped. */
export function buyFrame(data: StudentData, frameId: string): PurchaseResult {
  return buyItem(data, frameId, getFrame(frameId)?.price, "ownedFrames", "equippedFrame");
}

/** Equip an already-owned avatar. */
export function equipAvatar(data: StudentData, avatarId: string): StudentData {
  return equipItem(data, avatarId, "ownedAvatars", "avatar");
}

/** Equip an owned frame, or pass "" to remove the current frame. */
export function equipFrame(data: StudentData, frameId: string): StudentData {
  return equipItem(data, frameId, "ownedFrames", "equippedFrame");
}

/** Buy a theme. On success the theme is added to ownedThemes and equipped. */
export function buyTheme(data: StudentData, themeId: string): PurchaseResult {
  return buyItem(data, themeId, getTheme(themeId)?.price, "ownedThemes", "equippedTheme");
}

/** Equip an owned theme, or pass "" to go back to the standard background. */
export function equipTheme(data: StudentData, themeId: string): StudentData {
  return equipItem(data, themeId, "ownedThemes", "equippedTheme");
}

/** Buy an effect. On success the effect is added to ownedEffects and equipped. */
export function buyEffect(data: StudentData, effectId: string): PurchaseResult {
  return buyItem(data, effectId, getEffect(effectId)?.price, "ownedEffects", "equippedEffect");
}

/** Equip an owned effect, or pass "" to remove the current effect. */
export function equipEffect(data: StudentData, effectId: string): StudentData {
  return equipItem(data, effectId, "ownedEffects", "equippedEffect");
}

export function generateShareCode(data: StudentData): string {
  return btoa(encodeURIComponent(JSON.stringify(data)));
}

export function importShareCode(code: string): StudentData | null {
  try {
    const data = JSON.parse(decodeURIComponent(atob(code))) as StudentData;
    if (!data.name || !data.stages) return null;
    return data;
  } catch {
    return null;
  }
}
