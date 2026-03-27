"use client";

import Link from "next/link";
import ProgressBar from "./ProgressBar";
import { MagicCard } from "@/components/magicui/magic-card";
import type { ModuleProgress, Stage } from "@/lib/types";

interface ModuleCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  kind: "grammar" | "reading" | "spelling" | "wordsearch" | "stavningstest";
  stage: Stage;
  progress: ModuleProgress | null;
  locked: boolean;
  prevModuleTitle: string | null;
}

const KIND_LABEL: Record<string, string> = {
  grammar: "📝 Grammatik",
  reading: "📖 Läsning",
  spelling: "📚 Ordförråd",
  wordsearch: "🔍 Ordsökning",
  stavningstest: "⏱️ Ordtest",
};

const STAGE_GRADIENT: Record<string, string> = {
  franska: "bg-gradient-to-r from-franska-400 to-franska-600",
  spanska: "bg-gradient-to-r from-spanska-400 to-spanska-600",
  tyska: "bg-gradient-to-r from-tyska-400 to-tyska-600",
};

export default function ModuleCard({
  id,
  title,
  description,
  icon,
  kind,
  stage,
  progress,
  locked,
  prevModuleTitle,
}: ModuleCardProps) {
  const href = `/world/${stage.id}/${kind}/${id}`;

  if (locked) {
    return (
      <div className="h-full rounded-2xl border-3 border-sj-100 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 opacity-50 cursor-not-allowed select-none">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sj-50 dark:bg-gray-700 flex items-center justify-center text-lg flex-shrink-0 border-2 border-sj-100 dark:border-gray-600">
            🔒
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sj-300 dark:text-gray-400 text-sm">{title}</h3>
            {prevModuleTitle && (
              <p className="text-xs text-sj-300 dark:text-gray-500 mt-0.5 font-medium">
                Klara &quot;{prevModuleTitle}&quot; först
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link href={href} className="block group h-full">
      <MagicCard
        className={`h-full rounded-3xl border-3 bg-white dark:bg-gray-800 transition-all duration-200 group-hover:-translate-y-1 ${
          progress?.completed ? stage.borderClass : "border-sj-100 dark:border-gray-700 group-hover:border-sj-200"
        }`}
        gradientColor={
          stage.id === "franska" ? "#3b82f6"
          : stage.id === "spanska" ? "#ef4444"
          : "#eab308"
        }
        gradientOpacity={0.08}
      >
        <div
          className="px-5 py-4 h-full flex flex-col justify-between"
          style={{
            boxShadow: progress?.completed
              ? "0 5px 0 0 rgba(34,197,94,0.15), 0 8px 16px -4px rgba(34,197,94,0.1)"
              : "0 4px 0 0 rgba(22,163,74,0.08), 0 8px 16px -4px rgba(22,163,74,0.06)",
            borderRadius: "inherit",
          }}
        >
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3 border-3 ${
                progress?.completed
                  ? stage.colorClass + " text-white border-white/30"
                  : "bg-sj-50 dark:bg-gray-700 border-sj-100 dark:border-gray-600"
              }`}
              style={{
                boxShadow: progress?.completed
                  ? "0 3px 0 0 rgba(0,0,0,0.2), inset 0 2px 4px 0 rgba(255,255,255,0.3)"
                  : "0 3px 0 0 rgba(22,163,74,0.1), inset 0 2px 4px 0 rgba(255,255,255,0.8)"
              }}
            >
              {progress?.completed ? "✓" : icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-sj-900 dark:text-gray-100 text-base leading-snug">{title}</h3>
                <span className="badge bg-sj-50 dark:bg-gray-700 text-sj-400 dark:text-gray-400 text-xs flex-shrink-0 border-2 border-sj-100 dark:border-gray-600">
                  {KIND_LABEL[kind]}
                </span>
              </div>
              {progress?.completed && (
                <span className="badge bg-emerald-100 text-emerald-700 text-xs border-2 border-emerald-200 mt-1 inline-block">
                  ✓ Klar
                </span>
              )}

              <p className="text-sm text-sj-400 dark:text-gray-400 mt-1 line-clamp-1 font-medium">{description}</p>

              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1">
                  <ProgressBar value={progress?.completed ? 100 : 0} colorClass={STAGE_GRADIENT[stage.id]} />
                </div>
                {progress ? (
                  <span className="text-sm text-amber-600 dark:text-amber-400 font-bold flex-shrink-0 flex items-center gap-1">
                    ⭐ {progress.points}p
                  </span>
                ) : (
                  <span className="text-sm font-bold flex-shrink-0 text-sj-400 dark:text-gray-500 group-hover:text-sj-600 transition-colors">
                    Starta →
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </MagicCard>
    </Link>
  );
}
