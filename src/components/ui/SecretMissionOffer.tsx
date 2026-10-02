"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { declineMission, MISSION_POINTS_PER_CORRECT, MISSION_QUESTIONS } from "@/lib/secretMission";

/**
 * The golden offer box. Shown on the result screen after a lucky chapter and
 * in the popup behind the hidden star.
 *
 * It is a one-time offer: if the box goes away without "Ta uppdraget!" being
 * pressed — "Nej tack", "Fortsätt", closing, navigating away — today's mission
 * is used up.
 */
export default function SecretMissionOffer({ onDecline }: { onDecline?: () => void }) {
  const router = useRouter();
  const accepted = useRef(false);

  useEffect(() => {
    return () => {
      if (!accepted.current) declineMission();
    };
  }, []);

  function accept() {
    accepted.current = true;
    router.push("/uppdrag");
  }

  function decline() {
    declineMission();
    onDecline?.();
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-4 mb-3 text-left border-3 border-amber-300 animate-pop"
      style={{ background: "linear-gradient(135deg, #1e1b4b, #4c1d95 55%, #7c2d12)" }}
    >
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-amber-300/30 blur-2xl" aria-hidden="true" />
      <p className="text-xs font-black uppercase tracking-widest text-amber-300">🕵️ Hemligt uppdrag</p>
      <p className="mt-1 text-lg font-black text-white leading-snug">
        Klara {MISSION_QUESTIONS} blandade uppgifter – dubbla poäng!
      </p>
      <p className="mt-1 text-sm text-amber-100/90">
        {MISSION_POINTS_PER_CORRECT} poäng per rätt svar, och en silverkista om du får alla rätt.
        Erbjudandet gäller bara nu.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={accept}
          className="flex-1 py-2.5 rounded-xl font-black text-sm text-amber-950 cursor-pointer active:scale-95 transition-transform"
          style={{ background: "linear-gradient(135deg, #fde68a, #f59e0b)", boxShadow: "0 3px 0 0 #b45309" }}
        >
          Ta uppdraget! ⭐
        </button>
        <button
          onClick={decline}
          className="px-3 py-2.5 rounded-xl font-bold text-sm text-amber-100 bg-white/10 hover:bg-white/20 cursor-pointer"
        >
          Nej tack
        </button>
      </div>
    </div>
  );
}
