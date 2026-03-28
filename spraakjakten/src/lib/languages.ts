import type { Language } from "./types";

export const LANGUAGES: Language[] = [
  {
    id: "franska",
    name: "Franska",
    nativeName: "Français",
    flag: "🇫🇷",
    emoji: "🗼",
    description: "Utforska det franska språkets skönhet – från Paris till Provence!",
    colorClass: "bg-fra-500",
    bgClass: "bg-gradient-to-br from-fra-900 via-fra-800 to-fra-700",
    borderClass: "border-fra-400",
    textClass: "text-fra-600",
    buttonClass: "bg-fra-500 hover:bg-fra-600 text-white",
    locked: false,
  },
  {
    id: "spanska",
    name: "Spanska",
    nativeName: "Español",
    flag: "🇪🇸",
    emoji: "💃",
    description: "Lär dig spanska och öppna dörrar till hela Latinamerika och Spanien!",
    colorClass: "bg-esp-500",
    bgClass: "bg-gradient-to-br from-esp-900 via-esp-800 to-esp-700",
    borderClass: "border-esp-400",
    textClass: "text-esp-600",
    buttonClass: "bg-esp-500 hover:bg-esp-600 text-white",
    locked: false,
  },
  {
    id: "tyska",
    name: "Tyska",
    nativeName: "Deutsch",
    flag: "🇩🇪",
    emoji: "🏰",
    description: "Erövra tyskan – ett av Europas viktigaste språk för vetenskap och handel!",
    colorClass: "bg-deu-500",
    bgClass: "bg-gradient-to-br from-deu-900 via-deu-800 to-deu-700",
    borderClass: "border-deu-400",
    textClass: "text-deu-600",
    buttonClass: "bg-deu-500 hover:bg-deu-600 text-white",
    locked: false,
  },
];

export function getLanguage(id: string): Language | undefined {
  return LANGUAGES.find((l) => l.id === id);
}
