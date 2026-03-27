import type { StudentData, StageId, ModuleProgress, StageProgress, HeroConfig, GamificationData } from "./types";
import { defaultGamificationData } from "./gamification";

// Storage keys
const STUDENTS_KEY = "sprakjakten_students"; // Record<name, StudentData>
const CURRENT_KEY = "sprakjakten_current";   // currently logged-in name
const GAMIFICATION_KEY = "sprakjakten_gamification";

function emptyStageProgress(stageId: StageId): StageProgress {
  return {
    stageId,
    grammarModules: {},
    readingModules: {},
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
    stages: {
      franska: emptyStageProgress("franska"),
      spanska: emptyStageProgress("spanska"),
      tyska: emptyStageProgress("tyska"),
    },
  };
}

function getAllStudents(): Record<string, StudentData> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STUDENTS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, StudentData>;
  } catch {
    return {};
  }
}

function saveAllStudents(all: Record<string, StudentData>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(all));
}

function getCurrentName(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CURRENT_KEY);
}

function getGamificationKey(): string {
  const name = getCurrentName();
  if (name) return `${GAMIFICATION_KEY}_${name}`;
  return GAMIFICATION_KEY;
}

export function loadStudent(): StudentData | null {
  if (typeof window === "undefined") return null;
  const name = getCurrentName();
  if (!name) return null;
  const all = getAllStudents();
  return all[name] ?? null;
}

export function saveStudent(data: StudentData): void {
  if (typeof window === "undefined") return;
  data.lastActive = new Date().toISOString();
  const all = getAllStudents();
  all[data.name] = data;
  saveAllStudents(all);
  localStorage.setItem(CURRENT_KEY, data.name);
}

export function createStudent(name: string, avatar?: string): StudentData {
  const trimmed = name.trim();
  const all = getAllStudents();
  const existing = all[trimmed];
  if (existing) {
    if (avatar) existing.avatar = avatar;
    saveStudent(existing);
    return existing;
  }
  const data = defaultStudentData(trimmed);
  if (avatar) data.avatar = avatar;
  saveStudent(data);
  return data;
}

export function clearStudent(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CURRENT_KEY);
}

export function studentExists(name: string): boolean {
  if (typeof window === "undefined") return false;
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
  kind: "grammar" | "reading" | "spelling" | "wordsearch" | "stavningstest",
  moduleId: string
): ModuleProgress | null {
  const stage = data.stages[stageId];
  const map =
    kind === "grammar" ? stage.grammarModules
    : kind === "reading" ? stage.readingModules
    : kind === "spelling" ? (stage.spellingModules ?? {})
    : kind === "stavningstest" ? (stage.stavningstestModules ?? {})
    : (stage.wordsearchModules ?? {});
  return map[moduleId] ?? null;
}

export function saveModuleProgress(
  data: StudentData,
  stageId: StageId,
  kind: "grammar" | "reading" | "spelling" | "wordsearch" | "stavningstest",
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
    : kind === "reading" ? stage.readingModules
    : kind === "spelling" ? stage.spellingModules
    : kind === "stavningstest" ? stage.stavningstestModules
    : stage.wordsearchModules;
  const existing = map[moduleId];
  const prevPoints = existing?.points ?? 0;
  const addedPoints = Math.max(0, points - prevPoints);

  map[moduleId] = {
    moduleId,
    completed: existing?.completed || completed,
    points: Math.max(prevPoints, points),
    attempts: (existing?.attempts ?? 0) + 1,
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
    if (!data.achievementsRewarded) data.achievementsRewarded = [];
    return data;
  } catch {
    return defaultGamificationData();
  }
}

export function saveGamification(data: GamificationData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getGamificationKey(), JSON.stringify(data));
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
  a.download = `sprakjakten_${data.name.replace(/\s+/g, "_")}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importProgress(file: File): Promise<StudentData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as StudentData;
        if (!data.name || !data.stages) throw new Error("Ogiltig fil");
        saveStudent(data);
        resolve(data);
      } catch {
        reject(new Error("Kunde inte läsa filen. Kontrollera att det är rätt fil."));
      }
    };
    reader.onerror = () => reject(new Error("Filläsning misslyckades."));
    reader.readAsText(file);
  });
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
