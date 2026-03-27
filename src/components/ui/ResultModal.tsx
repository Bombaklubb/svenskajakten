"use client";

import type { ChestType } from "@/lib/types";
import { Button } from "@/components/ui/button";

const CHEST_LABELS: Record<ChestType, string> = {
  wood: "Bronskista",
  silver: "Silverkista",
  gold: "Guldkista",
};
const CHEST_IMAGES: Record<ChestType, string> = {
  wood: "/content/bronskista.png",
  silver: "/content/silverkista.png",
  gold: "/content/guldkista.png",
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
}: ResultModalProps) {
  const pct = Math.round((totalCorrect / totalQuestions) * 100);
  const passed = passedOverride !== undefined ? passedOverride : pct >= 60;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div
        className="bg-white dark:bg-gray-800 rounded-4xl p-8 max-w-md w-full text-center animate-slide-up border-3 border-sj-100 dark:border-gray-700"
        style={{
          boxShadow: "0 10px 0 0 rgba(22,163,74,0.12), 0 20px 40px -8px rgba(22,163,74,0.2), inset 0 4px 8px 0 rgba(255,255,255,0.8)"
        }}
      >
        <div className="text-7xl mb-4 animate-bounce-slow">{passed ? "🎉" : "💪"}</div>

        <h2 className="text-3xl font-black text-sj-900 dark:text-gray-100 mb-2">
          {passed ? "Bra jobbat!" : "Försök igen!"}
        </h2>
        <p className="text-sj-400 dark:text-gray-400 mb-6 text-base font-medium">
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
                : "border-sj-300 bg-sj-50 dark:bg-sj-900/30"
            }`}
            style={{
              boxShadow: passed
                ? "0 6px 0 0 rgba(16,185,129,0.3), inset 0 4px 8px 0 rgba(255,255,255,0.8)"
                : "0 6px 0 0 rgba(22,163,74,0.2), inset 0 4px 8px 0 rgba(255,255,255,0.8)"
            }}
          >
            <span className={`text-4xl font-black ${passed ? "text-emerald-600 dark:text-emerald-400" : "text-sj-500"}`}>
              {pct}%
            </span>
            <span className="text-sm text-sj-400 dark:text-gray-400 mt-1 font-bold">
              {totalCorrect}/{totalQuestions}
            </span>
          </div>
        </div>

        {/* Points */}
        <div
          className="bg-gradient-to-b from-amber-50 to-amber-100 dark:bg-amber-900/30 border-3 border-amber-300 dark:border-amber-700 rounded-2xl p-5 mb-4"
          style={{ boxShadow: "0 4px 0 0 rgba(245,158,11,0.25), inset 0 2px 4px 0 rgba(255,255,255,0.8)" }}
        >
          <div className="flex items-center justify-center gap-3 text-amber-700 dark:text-amber-300">
            <span className="text-3xl">⭐</span>
            <div>
              <span className="text-3xl font-black">{points}</span>
              <span className="text-lg ml-1 font-bold">poäng</span>
            </div>
          </div>
          {bonusPoints > 0 && passed && (
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-2 font-bold">
              + {bonusPoints} bonuspoäng för godkänt! 🏆
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
              <p className="text-xs text-amber-600 dark:text-amber-400">
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
          <Button variant="outline" onClick={onRetry} className="flex-1 border-sj-200 text-sj-600">
            🔄 Försök igen
          </Button>
          <button
            onClick={onContinue}
            className="flex-1 btn-primary border-3 border-sj-400 text-lg"
            style={{ background: "linear-gradient(135deg, #f97316, #ea6c0a)" }}
          >
            Fortsätt →
          </button>
        </div>
      </div>
    </div>
  );
}
