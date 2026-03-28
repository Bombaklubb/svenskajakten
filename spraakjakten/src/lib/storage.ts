import type { StudentData, LanguageId, ModuleProgress, LanguageProgress, GamificationData } from "./types";
import { defaultGamificationData } from "./gamification";

const STUDENTS_KEY = "spraakjakten_students";
const CURRENT_KEY  = "spraakjakten_current";
const GAMIFICATION_KEY = "spraakjakten_gamification";

function emptyLanguageProgress(languageId: LanguageId): LanguageProgress {
  return {
    languageId,
    vocabularyModules: {},
    grammarModules: {},
    wordsearchModules: {},
  };
}

function defaultStudentData(name: string): StudentData {
  const now = new Date().toISOString();
  return {
    name,
    createdAt: now,
    lastActive: now,
    totalPoints: 0,
    languages: {
      franska: emptyLanguageProgress("franska"),
      spanska: emptyLanguageProgress("spanska"),
      tyska:   emptyLanguageProgress("tyska"),
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

export function createStudent(name: string, avatar?: string, selectedLanguage?: LanguageId): StudentData {
  const trimmed = name.trim();
  const all = getAllStudents();
  const existing = all[trimmed];
  if (existing) {
    if (avatar) existing.avatar = avatar;
    if (selectedLanguage) existing.selectedLanguage = selectedLanguage;
    saveStudent(existing);
    return existing;
  }
  const data = defaultStudentData(trimmed);
  if (avatar) data.avatar = avatar;
  if (selectedLanguage) data.selectedLanguage = selectedLanguage;
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

export function getModuleProgress(
  data: StudentData,
  languageId: LanguageId,
  kind: "vocabulary" | "grammar" | "wordsearch",
  moduleId: string
): ModuleProgress | null {
  const lang = data.languages[languageId];
  if (!lang) return null;
  const map =
    kind === "vocabulary" ? lang.vocabularyModules
    : kind === "grammar"  ? lang.grammarModules
    : (lang.wordsearchModules ?? {});
  return map[moduleId] ?? null;
}

export function saveModuleProgress(
  data: StudentData,
  languageId: LanguageId,
  kind: "vocabulary" | "grammar" | "wordsearch",
  moduleId: string,
  points: number,
  completed: boolean
): StudentData {
  const lang = data.languages[languageId];
  if (!lang.wordsearchModules) lang.wordsearchModules = {};

  const map =
    kind === "vocabulary" ? lang.vocabularyModules
    : kind === "grammar"  ? lang.grammarModules
    : lang.wordsearchModules;

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

export function exportProgress(data: StudentData): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `spraakjakten_${data.name.replace(/\s+/g, "_")}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
