"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/ui/Header";
import ProgressBar from "@/components/ui/ProgressBar";
import { loadStudent } from "@/lib/storage";
import { STAGES } from "@/lib/stages";
import { ACHIEVEMENTS, ACHIEVEMENT_ICONS, isUnlocked } from "@/lib/achievements";
import { getAvatar } from "@/lib/avatars";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { BlurFade } from "@/components/magicui/blur-fade";
import type { StudentData, StageId } from "@/lib/types";

export default function ProfilePage() {
  const [student, setStudent] = useState<StudentData | null>(null);

  useEffect(() => {
    setStudent(loadStudent());
  }, []);

  if (!student) {
    return (
      <div className="min-h-screen bg-emerald-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sj-400 dark:text-gray-400 mb-4">Du är inte inloggad.</p>
          <Link
            href="/"
            className="btn-primary border-3 border-sj-400"
            style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
          >
            Gå till startsidan
          </Link>
        </div>
      </div>
    );
  }

  function getStageStats(stageId: StageId) {
    const s = student!.stages[stageId];
    const grammarMods = Object.values(s.grammarModules);
    const readingMods = Object.values(s.readingModules);
    const spellingMods = Object.values(s.spellingModules ?? {});
    const all = [...grammarMods, ...readingMods, ...spellingMods];
    const completed = all.filter((m) => m.completed).length;
    const totalPoints = all.reduce((sum, m) => sum + m.points, 0);
    return { completed, totalPoints, grammarMods, readingMods, spellingMods };
  }

  const joinDate = new Date(student.createdAt).toLocaleDateString("sv-SE");
  const lastActive = new Date(student.lastActive).toLocaleDateString("sv-SE");
  const av = getAvatar(student.avatar ?? "ninja");

  return (
    <div className="min-h-screen bg-emerald-50 dark:bg-gray-900">
      <Header student={student} />

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Profile hero */}
        <BlurFade delay={0}>
          <div
            className="rounded-3xl p-6 border-3 border-sj-300 text-white"
            style={{
              background: "linear-gradient(135deg, #14532d, #15803d, #22c55e)",
              boxShadow: "0 8px 0 0 rgba(22,163,74,0.3), 0 16px 32px -8px rgba(22,163,74,0.25), inset 0 2px 0 rgba(255,255,255,0.15)"
            }}
          >
            <div className="flex items-center gap-4 flex-wrap">
              <div
                className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-5xl overflow-hidden flex-shrink-0 border-3 border-white/30"
                style={{ boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2)" }}
              >
                {av.image
                  ? <img src={av.image} alt={av.name} className="w-full h-full object-contain p-1" />
                  : av.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-black drop-shadow-sm">{student.name}</h1>
                <p className="text-white/70 text-sm mt-0.5">Aktiv sedan {joinDate}</p>
                <p className="text-white/70 text-sm">Senast aktiv: {lastActive}</p>
              </div>
              <div className="text-center bg-white/15 rounded-2xl px-5 py-3 border-2 border-white/20 flex-shrink-0">
                <div className="text-3xl font-black flex items-center gap-1 justify-center">
                  ⭐ <NumberTicker value={student.totalPoints} className="text-white" />
                </div>
                <div className="text-white/70 text-xs mt-0.5 font-semibold">totala poäng</div>
              </div>
            </div>
          </div>
        </BlurFade>

        {/* Stage overview */}
        <BlurFade delay={0.05}>
          <div>
            <h2 className="text-lg font-bold text-sj-900 dark:text-gray-100 mb-3">📊 Progression per språk</h2>
            <div className="space-y-3">
              {STAGES.map((stage, i) => {
                const { completed, totalPoints, grammarMods, readingMods, spellingMods } = getStageStats(stage.id);
                const total = grammarMods.length + readingMods.length + spellingMods.length;
                const pct = total > 0 ? (completed / total) * 100 : 0;

                return (
                  <BlurFade key={stage.id} delay={0.07 + i * 0.04}>
                    <Link href={`/world/${stage.id}`} className="block group">
                      <div className="card group-hover:-translate-y-0.5 transition-transform duration-200">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-2xl">{stage.emoji}</span>
                          <div className="flex-1">
                            <h3 className="font-bold text-sj-900 dark:text-gray-100">{stage.name}</h3>
                            <p className="text-sm text-sj-400 dark:text-gray-400">{stage.grades}</p>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-amber-600 dark:text-amber-400">⭐ {totalPoints}</div>
                            <div className="text-xs text-sj-400 dark:text-gray-500">
                              {completed}/{total === 0 ? "?" : total} moduler
                            </div>
                          </div>
                        </div>
                        <ProgressBar
                          value={pct}
                          colorClass={
                            stage.id === "franska" ? "bg-gradient-to-r from-franska-400 to-franska-600"
                            : stage.id === "spanska" ? "bg-gradient-to-r from-spanska-400 to-spanska-600"
                            : stage.id === "tyska" ? "bg-gradient-to-r from-tyska-400 to-tyska-600"
                            : "bg-gradient-to-r from-tyska-400 to-tyska-600"
                          }
                          showPercent
                        />
                        {total > 0 && (
                          <div className="mt-3 grid grid-cols-3 gap-2">
                            {[
                              { mods: grammarMods, label: "📝 Grammatik" },
                              { mods: readingMods, label: "📖 Läsning" },
                              { mods: spellingMods, label: "📚 Ordförråd" },
                            ].map(({ mods, label }) => (
                              <div key={label} className="bg-sj-50 dark:bg-gray-700 rounded-xl p-2 text-xs text-center border border-sj-100 dark:border-gray-600">
                                <div className="font-bold text-sj-800 dark:text-gray-100">
                                  {mods.filter((m) => m.completed).length}/{mods.length}
                                </div>
                                <div className="text-sj-400 dark:text-gray-400">{label}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  </BlurFade>
                );
              })}
            </div>
          </div>
        </BlurFade>

        {/* Achievements */}
        <BlurFade delay={0.2}>
          <div>
            <h2 className="text-lg font-bold text-sj-900 dark:text-gray-100 mb-3">🏅 Utmärkelser</h2>
            <div className="space-y-4">
              {STAGES.map((stage) => {
                const stageAchievements = ACHIEVEMENTS.filter((a) => a.stageId === stage.id);
                const unlockedCount = stageAchievements.filter((a) => isUnlocked(a, student!)).length;
                return (
                  <div key={stage.id} className="card">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">{stage.emoji}</span>
                      <h3 className="font-bold text-sj-900 dark:text-gray-100">{stage.name}</h3>
                      <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-sj-100 dark:bg-gray-700 text-sj-600 dark:text-gray-400">
                        {unlockedCount}/{stageAchievements.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {stageAchievements.map((a) => {
                        const unlocked = isUnlocked(a, student!);
                        return (
                          <div
                            key={a.id}
                            className={`flex items-center gap-2 rounded-xl p-2.5 transition-colors ${
                              unlocked
                                ? "bg-emerald-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800"
                                : "bg-sj-50 dark:bg-gray-700/50 opacity-50 border-2 border-transparent"
                            }`}
                          >
                            {(() => {
                              const Icon = ACHIEVEMENT_ICONS[a.id];
                              return unlocked && Icon
                                ? <Icon size={22} className="flex-shrink-0 text-amber-600 dark:text-amber-400" />
                                : <span className="text-xl flex-shrink-0">{unlocked ? a.icon : "🔒"}</span>;
                            })()}
                            <div className="min-w-0">
                              <p className={`text-xs font-bold leading-tight ${unlocked ? "text-sj-900 dark:text-gray-100" : "text-sj-400 dark:text-gray-500"}`}>
                                {a.title}
                              </p>
                              <p className="text-xs text-sj-400 dark:text-gray-500 leading-tight truncate">{a.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Global achievements */}
              <div className="card">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🌍</span>
                  <h3 className="font-bold text-sj-900 dark:text-gray-100">Globala utmärkelser</h3>
                  <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-sj-100 dark:bg-gray-700 text-sj-600 dark:text-gray-400">
                    {ACHIEVEMENTS.filter((a) => a.stageId === "global" && isUnlocked(a, student!)).length}/
                    {ACHIEVEMENTS.filter((a) => a.stageId === "global").length}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {ACHIEVEMENTS.filter((a) => a.stageId === "global").map((a) => {
                    const unlocked = isUnlocked(a, student!);
                    return (
                      <div
                        key={a.id}
                        className={`flex items-center gap-2 rounded-xl p-2.5 transition-colors ${
                          unlocked
                            ? "bg-emerald-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800"
                            : "bg-sj-50 dark:bg-gray-700/50 opacity-50 border-2 border-transparent"
                        }`}
                      >
                        {(() => {
                          const Icon = ACHIEVEMENT_ICONS[a.id];
                          return unlocked && Icon
                            ? <Icon size={22} className="flex-shrink-0 text-amber-600 dark:text-amber-400" />
                            : <span className="text-xl flex-shrink-0">{unlocked ? a.icon : "🔒"}</span>;
                        })()}
                        <div className="min-w-0">
                          <p className={`text-xs font-bold leading-tight ${unlocked ? "text-sj-900 dark:text-gray-100" : "text-sj-400 dark:text-gray-500"}`}>
                            {a.title}
                          </p>
                          <p className="text-xs text-sj-400 dark:text-gray-500 leading-tight truncate">{a.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </BlurFade>
      </main>
    </div>
  );
}
