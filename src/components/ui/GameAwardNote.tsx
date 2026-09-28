"use client";

import Link from "next/link";
import type { GameAward } from "@/lib/storage";
import { MINIGAME_DAILY_CAP } from "@/lib/gamification";

/**
 * Why a round paid nothing, in words a pupil can act on, or null when it paid.
 *
 * Every zero used to be explained as "the daily cap is reached", which was
 * wrong for a locked day (no chapter done yet) and for a round that simply
 * scored nothing — the pupil was told to wait until tomorrow when doing a
 * chapter, or playing better, would have paid.
 */
export function zeroAwardReason(award: GameAward): string | null {
  if (award.awarded > 0) return null;
  if (award.locked) return "Gör dagens första kapitel så ger spelen poäng.";
  if (award.capped) {
    return `Du har redan tjänat ${MINIGAME_DAILY_CAP} poäng på det här spelet idag. Poängen kommer tillbaka imorgon!`;
  }
  return "Den här omgången gav inga poäng. Försök igen!";
}

/**
 * Tells the pupil how many points a mini-game round actually paid out.
 *
 * Without it the reduced payout looks like a bug: the scoreboard says 250 but
 * the total only moves by 150. Saying "replay, so 60%" out loud also makes the
 * rule learnable — the first round of the day is the one worth trying hard at.
 */
export default function GameAwardNote({ award }: { award: GameAward | null }) {
  if (!award) return null;

  const reason = zeroAwardReason(award);
  if (reason) {
    return (
      <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
        {award.locked ? "🔒" : award.capped ? "🏁" : "💪"} {reason}
      </p>
    );
  }

  return (
    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
      ⭐ <strong className="text-gray-900 dark:text-gray-100">+{award.awarded} poäng</strong> sparade
      {award.multiplier < 1 && ` (omspel – ${Math.round(award.multiplier * 100)}%)`}
      {award.capped && " · dagens gräns för spelet är nådd"}
    </p>
  );
}

/**
 * Shown instead of a game on a day with no finished chapter.
 *
 * The world's game tab already hides the games until then, but a bookmarked or
 * typed game URL used to open a playable round that silently paid nothing.
 */
export function GameLockedScreen({ stageId, emoji }: { stageId: string; emoji: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 p-4">
      <div className="max-w-sm w-full text-center rounded-3xl border-3 border-dashed border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-5 py-8">
        <div className="text-5xl mb-2">🔒</div>
        <div className="text-3xl mb-2 opacity-60">{emoji}</div>
        <h1 className="text-lg font-black text-gray-800 dark:text-gray-100 mb-1">
          Spelen öppnar efter dagens första kapitel
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">
          Gör dagens första kapitel så ger spelen poäng. Sedan är alla fyra spelen öppna resten av dagen.
        </p>
        <Link prefetch={false}
          href={`/world/${stageId}`}
          className="inline-flex btn-primary text-sm"
          style={{ background: "linear-gradient(135deg, #006AA7, #004a75)" }}
        >
          Till kapitlen →
        </Link>
      </div>
    </div>
  );
}
