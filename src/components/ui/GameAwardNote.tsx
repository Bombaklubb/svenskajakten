"use client";

import type { GameAward } from "@/lib/storage";
import { MINIGAME_DAILY_CAP } from "@/lib/gamification";

/**
 * Tells the pupil how many points a mini-game round actually paid out.
 *
 * Without it the reduced payout looks like a bug: the scoreboard says 250 but
 * the total only moves by 150. Saying "replay, so 60%" out loud also makes the
 * rule learnable — the first round of the day is the one worth trying hard at.
 */
export default function GameAwardNote({ award }: { award: GameAward | null }) {
  if (!award) return null;

  if (award.awarded === 0) {
    return (
      <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
        🏁 Du har redan tjänat {MINIGAME_DAILY_CAP} poäng på det här spelet idag.
        Spela vidare för nöjes skull — poängen kommer tillbaka imorgon!
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
