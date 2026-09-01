"use client";

import { useEffect } from "react";
import type { ChestType } from "@/lib/types";
import { getPointsMultiplier } from "@/lib/gamification";
import { Button } from "@/components/ui/button";

const CHEST_LABELS: Record<ChestType, string> = {
  wood: "Bronskista",
  silver: "Silverkista",
  gold: "Guldkista",
  emerald: "Smaragdkista",
  ruby: "Rubinkista",
  diamond: "Diamantkista",
  hemlig: "Hemliga kistan",
};
const CHEST_IMAGES: Record<ChestType, string> = {
  wood: "/content/bronskista.png",
  silver: "/content/silverkista.png",
  gold: "/content/guldkista.png",
  emerald: "/content/smaragdkista.png",
  ruby: "/content/rubinkista.png",
  diamond: "/content/diamantkista.png",
  hemlig: "/content/hemligkista.png",
};

interface ResultModalProps {
  points: number;
  bonusPoints: number;
  totalCorrect: number;
  totalQuestions: number;
  chestEarned?: ChestType;
  bossUnlocked?: boolean;
  onContinue: () => void;
  onRetry: () => void;
  passedOverride?: boolean;
  subtitle?: string;
  prevAttempts?: number;
  /** Surprise bonus: 2 = double points, 3 = triple points (1/undefined = none) */
  surpriseMultiplier?: number;
}

export default function ResultModal({
  points,
  bonusPoints,
  totalCorrect,
  totalQuestions,
  chestEarned,
  bossUnlocked,
  onContinue,
  onRetry,
  passedOverride,
  subtitle,
  prevAttempts = 0,
  surpriseMultiplier = 1,
}: ResultModalProps) {
  // Escape closes the dialog the same way "Fortsätt" does.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onContinue(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onContinue]);

  const pct = Math.round((totalCorrect / totalQuestions) * 100);
  const passed = passedOverride !== undefined ? passedOverride : pct >= 60;
  const multiplier = getPointsMultiplier(prevAttempts);
  const surprise = surpriseMultiplier > 1 ? surpriseMultiplier : 1;
  // Rounded the same way and in the same order as saveModuleProgress saves it,
  // so the number on screen is exactly the number added to the total.
  const displayPoints = Math.round(points * surprise * multiplier);
  // The bonus is shown as the remainder so the two lines add up to exactly the
  // saved total; rounding each part separately could leave them one apart.
  const displayBonus = passed
    ? Math.round((points + bonusPoints) * surprise * multiplier) - displayPoints
    : 0;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="resultat-rubrik"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-4xl p-8 max-w-md w-full text-center animate-slide-up border-3 border-sv-100 dark:border-gray-700"
        style={{
          boxShadow: "0 10px 0 0 rgba(249,115,22,0.12), 0 20px 40px -8px rgba(249,115,22,0.2), inset 0 4px 8px 0 rgba(255,255,255,0.8)"
        }}
      >
        <div className="text-7xl mb-4 animate-bounce-slow">{passed ? "🎉" : "💪"}</div>

        <h2 id="resultat-rubrik" className="text-3xl font-black text-sv-900 dark:text-gray-100 mb-2">
          {passed ? "Bra jobbat!" : "Försök igen!"}
        </h2>
        <p className="text-sv-800 dark:text-gray-300 mb-6 text-base font-medium">
          {subtitle ?? (passed
            ? "Du klarade övningen med godkänt resultat."
            : "Du är nästan framme – öva lite till!")}
        </p>

        {/* Score ring */}
        <div className="flex justify-center mb-6">
          <div
            className={`w-32 h-32 rounded-full flex flex-col items-center justify-center border-4 ${
              passed
                ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30"
                : "border-sv-300 bg-sv-50 dark:bg-sv-900/30"
            }`}
            style={{
              boxShadow: passed
                ? "0 6px 0 0 rgba(16,185,129,0.3), inset 0 4px 8px 0 rgba(255,255,255,0.8)"
                : "0 6px 0 0 rgba(249,115,22,0.2), inset 0 4px 8px 0 rgba(255,255,255,0.8)"
            }}
          >
            <span className={`text-4xl font-black ${passed ? "text-emerald-600 dark:text-emerald-400" : "text-sv-800"}`}>
              {pct}%
            </span>
            <span className="text-sm text-sv-800 dark:text-gray-300 mt-1 font-bold">
              {totalCorrect}/{totalQuestions}
            </span>
          </div>
        </div>

        {/* Replay notice */}
        {prevAttempts > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-2xl p-3 mb-4 text-left">
            <p className="text-sm font-bold text-blue-800 dark:text-blue-300">
              {multiplier === 0
                ? "ℹ️ Du har gjort denna övning flera gånger – du får inga fler poäng för den."
                : `ℹ️ Du har gjort denna övning förut – du får ${Math.round(multiplier * 100)}% av poängen.`}
            </p>
          </div>
        )}

        {/* Surprise multiplier */}
        {surprise > 1 && displayPoints > 0 && (
          <div
            className={`rounded-2xl p-4 mb-4 border-3 animate-pop ${
              surprise === 3
                ? "bg-gradient-to-r from-fuchsia-100 to-purple-100 dark:from-fuchsia-900/40 dark:to-purple-900/40 border-fuchsia-400 dark:border-fuchsia-600"
                : "bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 border-emerald-400 dark:border-emerald-600"
            }`}
            style={{ boxShadow: surprise === 3 ? "0 4px 0 0 rgba(192,38,211,0.3)" : "0 4px 0 0 rgba(16,185,129,0.3)" }}
          >
            <p className={`text-xl font-black ${surprise === 3 ? "text-fuchsia-700 dark:text-fuchsia-300" : "text-emerald-700 dark:text-emerald-300"}`}>
              {surprise === 3 ? "💥 JACKPOTT! TRIPPLA POÄNG! ×3" : "🍀 TUR! DUBBLA POÄNG! ×2"}
            </p>
            <p className={`text-sm font-bold mt-1 ${surprise === 3 ? "text-fuchsia-600 dark:text-fuchsia-400" : "text-emerald-600 dark:text-emerald-400"}`}>
              En sällsynt överraskning – dina poäng multipliceras!
            </p>
          </div>
        )}

        {/* Points */}
        <div
          className="bg-gradient-to-b from-amber-50 to-amber-100 dark:bg-amber-900/30 border-3 border-amber-300 dark:border-amber-700 rounded-2xl p-5 mb-4"
          style={{ boxShadow: "0 4px 0 0 rgba(245,158,11,0.25), inset 0 2px 4px 0 rgba(255,255,255,0.8)" }}
        >
          <div className="flex items-center justify-center gap-3 text-amber-700 dark:text-amber-300">
            <span className="text-3xl">⭐</span>
            <div>
              <span className="text-3xl font-black">{displayPoints}</span>
              <span className="text-lg ml-1 font-bold">poäng</span>
            </div>
          </div>
          {displayBonus > 0 && passed && (
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-2 font-bold">
              + {displayBonus} bonuspoäng för godkänt! 🏆
            </p>
          )}
        </div>

        {chestEarned && (
          <div className="bg-amber-50 dark:bg-amber-900/30 border-2 border-amber-300 dark:border-amber-600 rounded-2xl p-3 mb-3 flex items-center gap-3">
            <img src={CHEST_IMAGES[chestEarned]} alt={CHEST_LABELS[chestEarned]} className="w-10 h-10 object-contain" />
            <div className="text-left">
              <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                Du fick en {CHEST_LABELS[chestEarned]}!
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Öppna den på Hemliga kistor-sidan.
              </p>
            </div>
          </div>
        )}

        {bossUnlocked && (
          <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-600 rounded-2xl p-3 mb-3 flex items-center gap-3">
            <span className="text-3xl">⚔️</span>
            <div className="text-left">
              <p className="text-sm font-bold text-red-800 dark:text-red-300">Boss Challenge upplåst!</p>
              <p className="text-xs text-red-600 dark:text-red-400">Gå till Hemliga kistor för att utmana bossen.</p>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onRetry} className="flex-1 border-sv-200 text-sv-800 dark:text-gray-200">
            🔄 Försök igen
          </Button>
          <button
            onClick={onContinue}
            className="flex-1 btn-primary border-3 border-sv-400 text-lg"
            style={{ background: "linear-gradient(135deg, #f97316, #ea6c0a)" }}
          >
            Fortsätt →
          </button>
        </div>
      </div>
    </div>
  );
}
