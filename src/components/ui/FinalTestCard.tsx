"use client";

import Link from "next/link";
import type { ModuleProgress, Stage } from "@/lib/types";

interface FinalTestCardProps {
  stage: Stage;
  progress: ModuleProgress | null;
}

const STAGE_COLORS: Record<string, { from: string; to: string; glow: string }> = {
  lagstadiet:    { from: "#f59e0b", to: "#d97706", glow: "rgba(245,158,11,0.4)" },
  mellanstadiet: { from: "#16a34a", to: "#15803d", glow: "rgba(22,163,74,0.4)" },
  hogstadiet:    { from: "#2563eb", to: "#1d4ed8", glow: "rgba(37,99,235,0.4)" },
  gymnasiet:     { from: "#7c3aed", to: "#6d28d9", glow: "rgba(124,58,237,0.4)" },
};

export default function FinalTestCard({ stage, progress }: FinalTestCardProps) {
  const href = `/world/${stage.id}/grammar/sluttest`;
  const colors = STAGE_COLORS[stage.id] ?? STAGE_COLORS.lagstadiet;
  const completed = !!progress?.completed;

  return (
    <Link href={href} className="block group mt-4">
      <div
        className="relative rounded-3xl overflow-hidden border-3 transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-2xl cursor-pointer"
        style={{
          borderColor: completed ? "#fbbf24" : colors.from,
          boxShadow: `0 6px 0 0 ${colors.glow}, 0 12px 28px -6px ${colors.glow}`,
        }}
      >
        {/* Animated shimmer bar */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)`,
            animation: "shimmer 1.5s infinite",
          }}
        />

        {/* Main gradient background */}
        <div
          className="px-5 py-5"
          style={{
            background: completed
              ? "linear-gradient(135deg, #fef3c7 0%, #fde68a 40%, #fbbf24 100%)"
              : `linear-gradient(135deg, ${colors.from} 0%, ${colors.to} 100%)`,
          }}
        >
          <div className="flex items-center gap-4">
            {/* Trophy icon */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 border-3"
              style={{
                background: completed
                  ? "linear-gradient(135deg, #fbbf24, #f59e0b)"
                  : "rgba(255,255,255,0.25)",
                borderColor: completed ? "#f59e0b" : "rgba(255,255,255,0.4)",
                boxShadow: "0 4px 0 0 rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.3)",
              }}
            >
              {completed ? "🥇" : "🏆"}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span
                  className="text-xs font-black px-3 py-1 rounded-full border-2"
                  style={{
                    background: "rgba(255,255,255,0.25)",
                    borderColor: "rgba(255,255,255,0.4)",
                    color: completed ? "#92400e" : "white",
                  }}
                >
                  ✦ SLUTTEST
                </span>
                {completed && (
                  <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-500 text-white border-2 border-emerald-400">
                    ✓ Klar
                  </span>
                )}
              </div>

              <h3
                className="text-xl font-black leading-tight"
                style={{
                  color: completed ? "#78350f" : "white",
                  textShadow: completed ? "none" : "0 1px 3px rgba(0,0,0,0.3)",
                }}
              >
                Sluttest – Grammatik
              </h3>
              <p
                className="text-sm font-semibold mt-0.5"
                style={{ color: completed ? "#92400e" : "rgba(255,255,255,0.85)" }}
              >
                30+ frågor · Blandat innehåll · 100 bonuspoäng
              </p>
            </div>

            {/* Arrow / points */}
            <div className="flex-shrink-0">
              {progress ? (
                <div
                  className="text-center px-3 py-2 rounded-xl border-2"
                  style={{
                    background: "rgba(255,255,255,0.25)",
                    borderColor: "rgba(255,255,255,0.4)",
                  }}
                >
                  <div className="text-lg font-black" style={{ color: completed ? "#78350f" : "white" }}>
                    ⭐ {progress.points}
                  </div>
                  <div className="text-xs font-bold" style={{ color: completed ? "#92400e" : "rgba(255,255,255,0.8)" }}>
                    poäng
                  </div>
                </div>
              ) : (
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black transition-transform duration-200 group-hover:translate-x-1 border-2"
                  style={{
                    background: "rgba(255,255,255,0.25)",
                    borderColor: "rgba(255,255,255,0.4)",
                    color: "white",
                  }}
                >
                  →
                </div>
              )}
            </div>
          </div>

          {/* Stars row */}
          <div className="mt-3 flex items-center gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className="text-base transition-all duration-200"
                style={{
                  opacity: completed ? 1 : i < 3 ? 0.9 : 0.5,
                  filter: completed ? "drop-shadow(0 0 4px #fbbf24)" : "none",
                }}
              >
                {completed ? "⭐" : "☆"}
              </span>
            ))}
            <span
              className="text-xs font-bold ml-2"
              style={{ color: completed ? "#78350f" : "rgba(255,255,255,0.75)" }}
            >
              {completed
                ? "Sluttest avklarat! Imponerande! 🎉"
                : "Testa all din grammatikkunskap!"}
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </Link>
  );
}
