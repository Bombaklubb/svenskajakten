"use client";

import { useState, useEffect } from "react";
import type { MysteryBoxReward } from "@/lib/types";
import { CHEST_IMAGES, CHEST_LABELS } from "@/components/ui/ResultModal";

interface MysteryBoxPopupProps {
  reward: MysteryBoxReward;
  onClose: () => void;
}

const REWARD_ICONS: Record<string, string> = {
  points: "⭐",
  chest: "📦",
  badge: "🎖️",
};


export default function MysteryBoxPopup({ reward, onClose }: MysteryBoxPopupProps) {
  // Escape closes the popup, same as the button.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const [opened, setOpened] = useState(false);

  const chestImage = reward.type === "chest" && reward.chestType
    ? CHEST_IMAGES[reward.chestType]
    : null;
  const icon = chestImage ? null : REWARD_ICONS[reward.type];

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex overflow-y-auto overscroll-contain z-[60] px-3 pt-3 sm:px-4 sm:pt-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="m-auto bg-white dark:bg-gray-800 rounded-3xl shadow-2xl px-6 pt-6 sm:px-8 sm:pt-8 max-w-sm w-full text-center"
        style={{
          border: "3px solid #006AA7",
          boxShadow: "0 8px 32px rgba(0,106,167,0.3), 0 2px 8px rgba(0,0,0,0.2)",
        }}
      >
        {!opened ? (
          <>
            <div className="text-7xl mb-4 animate-bounce cursor-pointer select-none" style={{ animationDuration: "1s" }}>
              🎁
            </div>
            <h2 className="text-2xl font-black mb-2" style={{ color: "#006AA7" }}>
              Mysterykista!
            </h2>
            <p className="text-gray-500 dark:text-gray-300 mb-6 text-sm">
              Du hittade en mysterykista! Klicka för att öppna den.
            </p>
            <div className="sticky bottom-0 -mx-6 sm:-mx-8 px-6 sm:px-8 pt-3 pb-6 sm:pb-8 bg-white dark:bg-gray-800 rounded-b-3xl">
            <button
              autoFocus
              onClick={() => setOpened(true)}
              className="w-full py-3 px-6 rounded-2xl font-bold text-white text-lg cursor-pointer transition-all active:scale-95"
              style={{
                background: "linear-gradient(135deg, #006AA7, #004a75)",
                border: "3px solid #004a75",
                boxShadow: "0 4px 12px rgba(0,74,117,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
              }}
            >
              Öppna kistan!
            </button>
            </div>
          </>
        ) : (
          <>
            <div
              className="mb-4 flex items-center justify-center select-none"
              style={{ animation: "pop 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97)" }}
            >
              {chestImage ? (
                <img src={chestImage} alt={reward.chestType ? CHEST_LABELS[reward.chestType] : "kista"} className="w-24 h-24 object-contain drop-shadow-lg" />
              ) : (
                <span className="text-7xl">{icon}</span>
              )}
            </div>
            <h2 className="text-2xl font-black mb-2" style={{ color: "#006AA7" }}>
              Du vann!
            </h2>
            <p className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6">
              {reward.description}
            </p>
            <div className="sticky bottom-0 -mx-6 sm:-mx-8 px-6 sm:px-8 pt-3 pb-6 sm:pb-8 bg-white dark:bg-gray-800 rounded-b-3xl">
            <button
              autoFocus
              onClick={onClose}
              className="w-full py-3 px-6 rounded-2xl font-bold text-white text-base cursor-pointer transition-all active:scale-95"
              style={{
                background: "linear-gradient(135deg, #22c55e, #16a34a)",
                border: "3px solid #16a34a",
                boxShadow: "0 4px 12px rgba(34,197,94,0.4)",
              }}
            >
              Häftigt! Fortsätt →
            </button>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes pop {
          0% { transform: scale(0.3) rotate(-10deg); opacity: 0; }
          60% { transform: scale(1.2) rotate(5deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
