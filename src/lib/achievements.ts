import type { StudentData, StageId } from "./types";
import type { IconType } from "react-icons";
import {
  GiSprout, GiScrollQuill, GiOpenBook, GiPencil, GiLeafSwirl,
  GiBullseye, GiStarMedal, GiDiamondTrophy, GiTrophyCup, GiLaurelCrown,
  GiMagnifyingGlass, GiCrossedSwords,
  GiWorld, GiStarKey, GiCastleRuins, GiLaurels,
  GiEarthAmerica, GiFireball, GiSwordsEmblem, GiImperialCrown,
  GiMountainClimbing, GiGraduateCap, GiMountaintop, GiGems,
  GiRocketFlight, GiStrong, GiStarFormation, GiCrown, GiSoccerBall,
} from "react-icons/gi";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  stageId: StageId | "global";
}

function stageStats(student: StudentData, stageId: StageId) {
  const s = student.stages[stageId];
  const gram  = Object.values(s.grammarModules).filter((m) => m.completed);
  const read  = Object.values(s.readingModules).filter((m) => m.completed);
  const spell = Object.values(s.spellingModules    ?? {}).filter((m) => m.completed);
  const ws    = Object.values(s.wordsearchModules  ?? {}).filter((m) => m.completed);
  const all   = [...gram, ...read, ...spell, ...ws];
  const points = all.reduce((sum, m) => sum + m.points, 0);
  return { gram: gram.length, read: read.length, spell: spell.length,
           ws: ws.length, total: all.length, points };
}

export const ACHIEVEMENTS: Achievement[] = [
  // ── Franska ──────────────────────────────────────────────────────────────
  { id: "fra-1",  stageId: "franska", icon: "🇫🇷", title: "Franskstartare",     description: "Klara din första modul i Franska." },
  { id: "fra-2",  stageId: "franska", icon: "📝", title: "Franskgrammatiker",  description: "Klara en grammatikmodul i Franska." },
  { id: "fra-3",  stageId: "franska", icon: "📖", title: "Franskläsaren",      description: "Klara en läsförståelsemodul i Franska." },
  { id: "fra-4",  stageId: "franska", icon: "📚", title: "Franskordkunskap",   description: "Klara en ordförrådmodul i Franska." },
  { id: "fra-5",  stageId: "franska", icon: "🥐", title: "Franskmästare",      description: "Klara 5 moduler i Franska. Belöning: Bronskista!" },
  { id: "fra-6",  stageId: "franska", icon: "🎯", title: "Tredubbel utmaning", description: "Klara minst en modul av varje typ i Franska." },
  { id: "fra-7",  stageId: "franska", icon: "⭐", title: "Poängjägare FR",     description: "Samla 50 poäng i Franska." },
  { id: "fra-8",  stageId: "franska", icon: "💎", title: "Poängemästare FR",   description: "Samla 150 poäng i Franska." },
  { id: "fra-9",  stageId: "franska", icon: "🏆", title: "Franskhjälte",       description: "Klara 10 moduler i Franska. Belöning: Silverkista!" },
  { id: "fra-10", stageId: "franska", icon: "🌟", title: "Fransklegende",      description: "Klara 18 moduler i Franska. Belöning: Guldkista!" },
  { id: "fra-11", stageId: "franska", icon: "🔍", title: "Ordjägaren FR",      description: "Klara en ordsökningsmodul i Franska." },
  { id: "fra-12", stageId: "franska", icon: "🔍", title: "Ordjägaren FR II",   description: "Klara 3 ordsökningsmoduler i Franska." },

  // ── Spanska ──────────────────────────────────────────────────────────────
  { id: "spa-1",  stageId: "spanska", icon: "🇪🇸", title: "Spanskstartare",     description: "Klara din första modul i Spanska." },
  { id: "spa-2",  stageId: "spanska", icon: "📝", title: "Spanskgrammatiker",  description: "Klara en grammatikmodul i Spanska." },
  { id: "spa-3",  stageId: "spanska", icon: "📖", title: "Spanskläsaren",      description: "Klara en läsförståelsemodul i Spanska." },
  { id: "spa-4",  stageId: "spanska", icon: "📚", title: "Spanskordkunskap",   description: "Klara en ordförrådmodul i Spanska." },
  { id: "spa-5",  stageId: "spanska", icon: "🌮", title: "Spanskmästare",      description: "Klara 5 moduler i Spanska. Belöning: Bronskista!" },
  { id: "spa-6",  stageId: "spanska", icon: "🎯", title: "Tredubbel utmaning", description: "Klara minst en modul av varje typ i Spanska." },
  { id: "spa-7",  stageId: "spanska", icon: "⭐", title: "Poängjägare ES",     description: "Samla 50 poäng i Spanska." },
  { id: "spa-8",  stageId: "spanska", icon: "💎", title: "Poängemästare ES",   description: "Samla 150 poäng i Spanska." },
  { id: "spa-9",  stageId: "spanska", icon: "🏆", title: "Spanskhjälte",       description: "Klara 10 moduler i Spanska. Belöning: Silverkista!" },
  { id: "spa-10", stageId: "spanska", icon: "🌟", title: "Spansklegende",      description: "Klara 18 moduler i Spanska. Belöning: Guldkista!" },
  { id: "spa-11", stageId: "spanska", icon: "🔍", title: "Ordjägaren ES",      description: "Klara en ordsökningsmodul i Spanska." },
  { id: "spa-12", stageId: "spanska", icon: "🔍", title: "Ordjägaren ES II",   description: "Klara 3 ordsökningsmoduler i Spanska." },

  // ── Tyska ────────────────────────────────────────────────────────────────
  { id: "tys-1",  stageId: "tyska", icon: "🇩🇪", title: "Tyskstartare",       description: "Klara din första modul i Tyska." },
  { id: "tys-2",  stageId: "tyska", icon: "📝", title: "Tyskgrammatiker",    description: "Klara en grammatikmodul i Tyska." },
  { id: "tys-3",  stageId: "tyska", icon: "📖", title: "Tyskläsaren",        description: "Klara en läsförståelsemodul i Tyska." },
  { id: "tys-4",  stageId: "tyska", icon: "📚", title: "Tyskordkunskap",     description: "Klara en ordförrådmodul i Tyska." },
  { id: "tys-5",  stageId: "tyska", icon: "🥨", title: "Tyskmästare",        description: "Klara 5 moduler i Tyska. Belöning: Bronskista!" },
  { id: "tys-6",  stageId: "tyska", icon: "🎯", title: "Tredubbel utmaning", description: "Klara minst en modul av varje typ i Tyska." },
  { id: "tys-7",  stageId: "tyska", icon: "⭐", title: "Poängjägare DE",     description: "Samla 50 poäng i Tyska." },
  { id: "tys-8",  stageId: "tyska", icon: "💎", title: "Poängemästare DE",   description: "Samla 150 poäng i Tyska." },
  { id: "tys-9",  stageId: "tyska", icon: "🏆", title: "Tyskhjälte",         description: "Klara 10 moduler i Tyska. Belöning: Silverkista!" },
  { id: "tys-10", stageId: "tyska", icon: "🌟", title: "Tysklegende",        description: "Klara 18 moduler i Tyska. Belöning: Guldkista!" },
  { id: "tys-11", stageId: "tyska", icon: "🔍", title: "Ordjägaren DE",      description: "Klara en ordsökningsmodul i Tyska." },
  { id: "tys-12", stageId: "tyska", icon: "🔍", title: "Ordjägaren DE II",   description: "Klara 3 ordsökningsmoduler i Tyska." },

  // ── Globala ────────────────────────────────────────────────────────────────
  { id: "global-1", stageId: "global", icon: "🚀", title: "Första steget",       description: "Klara din allra första modul." },
  { id: "global-2", stageId: "global", icon: "💪", title: "Flerspråkig",         description: "Klara moduler i 2 olika språk. Belöning: Bronskista!" },
  { id: "global-3", stageId: "global", icon: "🌍", title: "Världsmedborgare",    description: "Klara moduler i alla 3 språk. Belöning: Silverkista!" },
  { id: "global-4", stageId: "global", icon: "⭐", title: "100 poäng",           description: "Samla totalt 100 poäng." },
  { id: "global-5", stageId: "global", icon: "👑", title: "Mästaren",            description: "Samla totalt 500 poäng. Belöning: Guldkista!" },
  { id: "global-6", stageId: "global", icon: "🏅", title: "Språkexperten",       description: "Klara 20 moduler totalt. Belöning: Silverkista!" },
  { id: "global-7", stageId: "global", icon: "🎓", title: "Polyglott",           description: "Samla totalt 1000 poäng. Belöning: Guldkista!" },
];

export function isUnlocked(a: Achievement, student: StudentData): boolean {
  const stages: StageId[] = ["franska", "spanska", "tyska"];

  if (a.stageId === "global") {
    const totalCompleted = stages.reduce(
      (sum, id) => sum + stageStats(student, id).total, 0
    );
    const stagesWithProgress = stages.filter(
      (id) => stageStats(student, id).total > 0
    ).length;

    if (a.id === "global-1") return totalCompleted >= 1;
    if (a.id === "global-2") return stagesWithProgress >= 2;
    if (a.id === "global-3") return stagesWithProgress >= 3;
    if (a.id === "global-4") return student.totalPoints >= 100;
    if (a.id === "global-5") return student.totalPoints >= 500;
    if (a.id === "global-6") return totalCompleted >= 20;
    if (a.id === "global-7") return student.totalPoints >= 1000;
    return false;
  }

  const sid = a.stageId as StageId;
  const { gram, read, spell, ws, total, points } = stageStats(student, sid);

  const prefix = sid === "franska" ? "fra"
    : sid === "spanska" ? "spa"
    : "tys";

  if (a.id === `${prefix}-1`)  return total >= 1;
  if (a.id === `${prefix}-2`)  return gram >= 1;
  if (a.id === `${prefix}-3`)  return read >= 1;
  if (a.id === `${prefix}-4`)  return spell >= 1;
  if (a.id === `${prefix}-5`)  return total >= 5;
  if (a.id === `${prefix}-6`)  return gram >= 1 && read >= 1 && spell >= 1;
  if (a.id === `${prefix}-7`)  return points >= 50;
  if (a.id === `${prefix}-8`)  return points >= 150;
  if (a.id === `${prefix}-9`)  return total >= 10;
  if (a.id === `${prefix}-10`) return total >= 18;
  if (a.id === `${prefix}-11`) return ws >= 1;
  if (a.id === `${prefix}-12`) return ws >= 3;
  return false;
}

export const ACHIEVEMENT_ICONS: Record<string, IconType> = {
  "fra-1":  GiSprout,        "fra-2":  GiScrollQuill,  "fra-3":  GiOpenBook,
  "fra-4":  GiPencil,        "fra-5":  GiLeafSwirl,    "fra-6":  GiBullseye,
  "fra-7":  GiStarMedal,     "fra-8":  GiDiamondTrophy,"fra-9":  GiTrophyCup,
  "fra-10": GiLaurelCrown,   "fra-11": GiMagnifyingGlass, "fra-12": GiCrossedSwords,
  "spa-1":  GiWorld,         "spa-2":  GiScrollQuill,  "spa-3":  GiOpenBook,
  "spa-4":  GiPencil,        "spa-5":  GiStarKey,      "spa-6":  GiBullseye,
  "spa-7":  GiStarMedal,     "spa-8":  GiDiamondTrophy,"spa-9":  GiTrophyCup,
  "spa-10": GiLaurels,       "spa-11": GiMagnifyingGlass, "spa-12": GiCrossedSwords,
  "tys-1":  GiEarthAmerica,  "tys-2":  GiScrollQuill,  "tys-3":  GiOpenBook,
  "tys-4":  GiPencil,        "tys-5":  GiFireball,     "tys-6":  GiBullseye,
  "tys-7":  GiStarMedal,     "tys-8":  GiDiamondTrophy,"tys-9":  GiSwordsEmblem,
  "tys-10": GiImperialCrown, "tys-11": GiMagnifyingGlass, "tys-12": GiCrossedSwords,
  "global-1": GiRocketFlight, "global-2": GiStrong,    "global-3": GiEarthAmerica,
  "global-4": GiStarFormation,"global-5": GiCrown,     "global-6": GiSoccerBall,
  "global-7": GiGraduateCap,
};
