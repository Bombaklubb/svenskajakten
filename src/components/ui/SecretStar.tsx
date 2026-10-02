"use client";

import { useEffect, useState } from "react";
import type { StageId, StudentData } from "@/lib/types";
import { getCurrentStudentName } from "@/lib/storage";
import { canOfferMission, offerFromStar, starPlacement, type StarSpot } from "@/lib/secretMission";
import SecretMissionOffer from "@/components/ui/SecretMissionOffer";

/**
 * The hidden golden star. Once a day, after the day's first chapter, it hides
 * on either the home page or a world page, at a spot fixed for the day.
 * Clicking it offers the secret mission for that world.
 *
 * Place it inside a `relative` container; it positions itself within it.
 */
export default function SecretStar({ spot, stageId, student }: { spot: StarSpot; stageId: StageId | undefined; student: StudentData | null }) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const name = getCurrentStudentName();
    if (!name || !stageId) return;
    const place = starPlacement(name);
    setPos({ x: place.x, y: place.y });
    setVisible(place.spot === spot && canOfferMission(student, stageId));
  }, [spot, stageId, student]);

  // The popup outlives the star: clicking hides the star and opens the offer.
  if ((!visible && !open) || !stageId) return null;

  function click() {
    setOpen(offerFromStar(stageId!));
    setVisible(false);
  }

  return (
    <>
      {!open && (
        <button
          onClick={click}
          aria-label="En hemlig stjärna!"
          title="Vad är det här?"
          className="absolute z-20 w-9 h-9 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer animate-sj-star"
          style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
        >
          <span className="absolute inset-0 rounded-full bg-amber-300/50 blur-md" aria-hidden="true" />
          <svg viewBox="0 0 24 24" className="relative w-7 h-7 drop-shadow" aria-hidden="true">
            <path d="M12 1.5l3.1 6.6 7.2.9-5.3 5 1.4 7.1L12 17.6l-6.4 3.5L7 14l-5.3-5 7.2-.9L12 1.5z" fill="#fcd34d" stroke="#b45309" strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
        </button>
      )}
      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex overflow-y-auto overscroll-contain z-50 p-3 sm:p-4 animate-fade-in" role="dialog" aria-modal="true" aria-label="Hemligt uppdrag">
          <div className="m-auto max-w-sm w-full">
            <p className="text-center text-white font-black text-xl mb-3 drop-shadow">⭐ Du hittade den hemliga stjärnan!</p>
            <SecretMissionOffer onDecline={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
