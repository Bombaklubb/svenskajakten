import type { Stage } from "./types";

export const STAGES: Stage[] = [
  {
    id: "franska",
    name: "Franska",
    subtitle: "Franska",
    emoji: "🇫🇷",
    grades: "Åk 6–9",
    description: "Lär dig franska – grammatik, ordförråd och läsförståelse!",
    colorClass: "bg-franska-600",
    bgClass: "bg-gradient-to-br from-franska-900 via-franska-800 to-franska-600",
    borderClass: "border-franska-400",
    textClass: "text-franska-600",
    buttonClass: "bg-franska-600 hover:bg-franska-700 text-white",
    locked: false,
  },
  {
    id: "spanska",
    name: "Spanska",
    subtitle: "Spanska",
    emoji: "🇪🇸",
    grades: "Åk 6–9",
    description: "Lär dig spanska – grammatik, ordförråd och läsförståelse!",
    colorClass: "bg-spanska-600",
    bgClass: "bg-gradient-to-br from-spanska-900 via-spanska-700 to-spanska-600",
    borderClass: "border-spanska-400",
    textClass: "text-spanska-600",
    buttonClass: "bg-spanska-600 hover:bg-spanska-700 text-white",
    locked: false,
  },
  {
    id: "tyska",
    name: "Tyska",
    subtitle: "Tyska",
    emoji: "🇩🇪",
    grades: "Åk 6–9",
    description: "Lär dig tyska – grammatik, ordförråd och läsförståelse!",
    colorClass: "bg-tyska-600",
    bgClass: "bg-gradient-to-br from-gray-900 via-gray-800 to-tyska-800",
    borderClass: "border-tyska-400",
    textClass: "text-tyska-700",
    buttonClass: "bg-gray-800 hover:bg-gray-900 text-white",
    locked: false,
  },
];

export function getStage(id: string): Stage | undefined {
  return STAGES.find((s) => s.id === id);
}
