import type { StudentData, StageId, ModuleProgress, StageProgress, HeroConfig, GamificationData, RetryItem } from "./types";
import { defaultGamificationData, getPointsMultiplier, DAILY_LOGIN_BONUS } from "./gamification";
import { getShopAvatar, getFrame, getTheme, getEffect } from "./shop";

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

/** True when the most recent save to localStorage could not be completed. */
export function hasSaveFailed(): boolean {
  return lastSaveFailed;
}

function getAllStudents(): Record<string, StudentData> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STUDENTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, StudentData>;
    // A corrupt blob must not silently wipe every pupil on the device: keep a
    // copy so the data can be recovered by hand instead of being overwritten.
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      safeSetItem(`${STUDENTS_KEY}_corrupt_backup`, raw);
      return {};
    }
    return parsed;
  } catch {
    const raw = localStorage.getItem(STUDENTS_KEY);
    if (raw) safeSetItem(`${STUDENTS_KEY}_corrupt_backup`, raw);
    return {};
  }
}

function saveAllStudents(all: Record<string, StudentData>): void {
  if (typeof window === "undefined") return;
  lastSaveFailed = !safeSetItem(STUDENTS_KEY, JSON.stringify(all));
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
    const all = getAllStudents();
    if (!all[data.name]) {
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
  const data = all[name];
  if (!data) return null;
  // Ensure the student owns their currently selected avatar (migration for shop)
  if (!data.ownedAvatars || data.ownedAvatars.length === 0) {
    data.ownedAvatars = [data.avatar ?? "ninja"];
  } else if (data.avatar && !data.ownedAvatars.includes(data.avatar)) {
    data.ownedAvatars.push(data.avatar);
  }
  const today = new Date().toISOString().slice(0, 10);
  if (data.lastStreakDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    data.streak = data.lastStreakDate === yesterday ? (data.streak ?? 0) + 1 : 1;
    data.lastStreakDate = today;
    // Daily bonus: reward the first activity of the day.
    data.totalPoints += DAILY_LOGIN_BONUS;
    try {
      sessionStorage.setItem("dailyBonusAwarded", String(DAILY_LOGIN_BONUS));
    } catch {
      // ignore (sessionStorage unavailable)
    }
    all[name] = data;
    saveAllStudents(all);
  }
  return data;
}

export function saveStudent(data: StudentData): void {
  if (typeof window === "undefined") return;
  data.lastActive = new Date().toISOString();
  const all = getAllStudents();
  all[data.name] = data;
  saveAllStudents(all);
  safeSetItem(CURRENT_KEY, data.name);
}

export function createStudent(name: string, avatar?: string): StudentData {
  const trimmed = name.trim();
  migrateIfNeeded();
  const all = getAllStudents();
  const existing = all[trimmed];
  if (existing) {
    // Restore existing student; update avatar only if explicitly chosen
    if (avatar) existing.avatar = avatar;
    saveStudent(existing);
    return existing;
  }
  const data = defaultStudentData(trimmed);
  if (avatar) {
    data.avatar = avatar;
    data.ownedAvatars = [avatar];
  }
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
  migrateIfNeeded();
  const all = getAllStudents();
  return !!all[name.trim()];
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
  const stage = data.stages[stageId];
  const map =
    kind === "grammar" ? stage.grammarModules
    : kind === "spelling" ? (stage.spellingModules ?? {})
    : kind === "stavningstest" ? (stage.stavningstestModules ?? {})
    : (stage.wordsearchModules ?? {});
  return map[moduleId] ?? null;
}

export function saveModuleProgress(
  data: StudentData,
  stageId: StageId,
  kind: "grammar" | "spelling" | "wordsearch" | "stavningstest",
  moduleId: string,
  points: number,
  completed: boolean
): StudentData {
  const stage = data.stages[stageId];
  if (!stage.spellingModules) stage.spellingModules = {};
  if (!stage.wordsearchModules) stage.wordsearchModules = {};
  if (!stage.stavningstestModules) stage.stavningstestModules = {};
  const map =
    kind === "grammar" ? stage.grammarModules
    : kind === "spelling" ? stage.spellingModules
    : kind === "stavningstest" ? stage.stavningstestModules
    : stage.wordsearchModules;
  const existing = map[moduleId];
  const prevAttempts = existing?.attempts ?? 0;
  const multiplier = getPointsMultiplier(prevAttempts);
  const addedPoints = Math.round(points * multiplier);

  map[moduleId] = {
    moduleId,
    completed: existing?.completed || completed,
    points: (existing?.points ?? 0) + addedPoints,
    attempts: prevAttempts + 1,
    lastAttempt: new Date().toISOString(),
  };

  data.totalPoints += addedPoints;
  saveStudent(data);
  return { ...data };
}

export function loadGamification(): GamificationData {
  if (typeof window === "undefined") return defaultGamificationData();
  try {
    const raw = localStorage.getItem(getGamificationKey());
    if (!raw) return defaultGamificationData();
    const data = JSON.parse(raw) as GamificationData;
    // Migration: ensure new fields exist for existing users
    if (!data.achievementsRewarded) data.achievementsRewarded = [];
    return data;
  } catch {
    return defaultGamificationData();
  }
}

export function saveGamification(data: GamificationData): void {
  if (typeof window === "undefined") return;
  safeSetItem(getGamificationKey(), JSON.stringify(data));
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

/**
 * Repair an imported file into a complete StudentData.
 * A backup from an older version can be missing stages or newer fields, and
 * reading those later would crash the page, so everything is filled in here.
 */
function normaliseImported(raw: unknown): StudentData | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const data = raw as Partial<StudentData>;
  if (typeof data.name !== "string" || !data.name.trim()) return null;

  const stages = {} as StudentData["stages"];
  for (const id of ALL_STAGES) {
    const existing = (data.stages as Partial<Record<StageId, StageProgress>> | undefined)?.[id];
    stages[id] = {
      stageId: id,
      grammarModules: existing?.grammarModules ?? {},
      spellingModules: existing?.spellingModules ?? {},
      wordsearchModules: existing?.wordsearchModules ?? {},
      stavningstestModules: existing?.stavningstestModules ?? {},
    };
  }

  const now = new Date().toISOString();
  return {
    ...data,
    name: data.name.trim(),
    createdAt: typeof data.createdAt === "string" ? data.createdAt : now,
    lastActive: now,
    totalPoints: Number.isFinite(data.totalPoints) ? Number(data.totalPoints) : 0,
    spentPoints: Number.isFinite(data.spentPoints) ? Number(data.spentPoints) : 0,
    ownedAvatars: Array.isArray(data.ownedAvatars) ? data.ownedAvatars : [],
    ownedFrames: Array.isArray(data.ownedFrames) ? data.ownedFrames : [],
    ownedThemes: Array.isArray(data.ownedThemes) ? data.ownedThemes : [],
    ownedEffects: Array.isArray(data.ownedEffects) ? data.ownedEffects : [],
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

/** Progress already stored for this name, so the caller can warn before overwriting. */
export function getExistingProgress(name: string): StudentData | null {
  if (typeof window === "undefined") return null;
  return getAllStudents()[name.trim()] ?? null;
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

// ─── Shop (Affären) ───────────────────────────────────────────────────────────

/** Points the student still has available to spend in the shop. */
export function getSpendable(data: StudentData): number {
  return Math.max(0, data.totalPoints - (data.spentPoints ?? 0));
}

export type PurchaseResult =
  | { ok: true; student: StudentData }
  | { ok: false; reason: "owned" | "broke" | "missing" };

/** Buy an avatar. On success the avatar is added to ownedAvatars and equipped. */
export function buyAvatar(data: StudentData, avatarId: string): PurchaseResult {
  const item = getShopAvatar(avatarId);
  if (!item) return { ok: false, reason: "missing" };
  const owned = data.ownedAvatars ?? [];
  if (owned.includes(avatarId)) return { ok: false, reason: "owned" };
  if (getSpendable(data) < item.price) return { ok: false, reason: "broke" };

  const updated: StudentData = {
    ...data,
    spentPoints: (data.spentPoints ?? 0) + item.price,
    ownedAvatars: [...owned, avatarId],
    avatar: avatarId, // auto-equip on purchase
  };
  saveStudent(updated);
  return { ok: true, student: updated };
}

/** Buy a frame. On success the frame is added to ownedFrames and equipped. */
export function buyFrame(data: StudentData, frameId: string): PurchaseResult {
  const item = getFrame(frameId);
  if (!item) return { ok: false, reason: "missing" };
  const owned = data.ownedFrames ?? [];
  if (owned.includes(frameId)) return { ok: false, reason: "owned" };
  if (getSpendable(data) < item.price) return { ok: false, reason: "broke" };

  const updated: StudentData = {
    ...data,
    spentPoints: (data.spentPoints ?? 0) + item.price,
    ownedFrames: [...owned, frameId],
    equippedFrame: frameId, // auto-equip on purchase
  };
  saveStudent(updated);
  return { ok: true, student: updated };
}

/** Equip an already-owned avatar. */
export function equipAvatar(data: StudentData, avatarId: string): StudentData {
  if (!(data.ownedAvatars ?? []).includes(avatarId)) return data;
  const updated = { ...data, avatar: avatarId };
  saveStudent(updated);
  return updated;
}

/** Equip an owned frame, or pass "" to remove the current frame. */
export function equipFrame(data: StudentData, frameId: string): StudentData {
  if (frameId && !(data.ownedFrames ?? []).includes(frameId)) return data;
  const updated = { ...data, equippedFrame: frameId };
  saveStudent(updated);
  return updated;
}

/** Buy a theme. On success the theme is added to ownedThemes and equipped. */
export function buyTheme(data: StudentData, themeId: string): PurchaseResult {
  const item = getTheme(themeId);
  if (!item) return { ok: false, reason: "missing" };
  const owned = data.ownedThemes ?? [];
  if (owned.includes(themeId)) return { ok: false, reason: "owned" };
  if (getSpendable(data) < item.price) return { ok: false, reason: "broke" };

  const updated: StudentData = {
    ...data,
    spentPoints: (data.spentPoints ?? 0) + item.price,
    ownedThemes: [...owned, themeId],
    equippedTheme: themeId, // auto-equip on purchase
  };
  saveStudent(updated);
  return { ok: true, student: updated };
}

/** Equip an owned theme, or pass "" to go back to the standard background. */
export function equipTheme(data: StudentData, themeId: string): StudentData {
  if (themeId && !(data.ownedThemes ?? []).includes(themeId)) return data;
  const updated = { ...data, equippedTheme: themeId };
  saveStudent(updated);
  return updated;
}

/** Buy an effect. On success the effect is added to ownedEffects and equipped. */
export function buyEffect(data: StudentData, effectId: string): PurchaseResult {
  const item = getEffect(effectId);
  if (!item) return { ok: false, reason: "missing" };
  const owned = data.ownedEffects ?? [];
  if (owned.includes(effectId)) return { ok: false, reason: "owned" };
  if (getSpendable(data) < item.price) return { ok: false, reason: "broke" };

  const updated: StudentData = {
    ...data,
    spentPoints: (data.spentPoints ?? 0) + item.price,
    ownedEffects: [...owned, effectId],
    equippedEffect: effectId, // auto-equip on purchase
  };
  saveStudent(updated);
  return { ok: true, student: updated };
}

/** Equip an owned effect, or pass "" to remove the current effect. */
export function equipEffect(data: StudentData, effectId: string): StudentData {
  if (effectId && !(data.ownedEffects ?? []).includes(effectId)) return data;
  const updated = { ...data, equippedEffect: effectId };
  saveStudent(updated);
  return updated;
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
