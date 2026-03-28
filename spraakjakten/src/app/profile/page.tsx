"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/ui/Header";
import { loadStudent, loadGamification, exportProgress } from "@/lib/storage";
import { getAvatar } from "@/lib/avatars";
import { LANGUAGES } from "@/lib/languages";
import { BlurFade } from "@/components/magicui/blur-fade";
import type { StudentData, GamificationData } from "@/lib/types";

export default function ProfilePage() {
  const [student, setStudent] = useState<StudentData | null>(null);
  const [gam, setGam] = useState<GamificationData | null>(null);

  useEffect(() => {
    const s = loadStudent();
    setStudent(s);
    setGam(loadGamification());
  }, []);

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sky-50">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Inte inloggad</p>
          <Link href="/" className="btn-primary" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
            Till startsidan
          </Link>
        </div>
      </div>
    );
  }

  const av = getAvatar(student.avatar ?? "ninja");
  const openedChests = gam?.chests.filter((c) => c.opened).length ?? 0;
  const totalChests = gam?.chests.length ?? 0;

  return (
    <div className="min-h-screen bg-sky-50 dark:bg-gray-900">
      <Header student={student} />

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <BlurFade>
          <Link href="/" className="inline-flex items-center gap-1.5 text-sj-600 text-sm font-bold mb-2">
            ← Tillbaka
          </Link>
        </BlurFade>

        {/* Profile card */}
        <BlurFade delay={0.04}>
          <div className="card flex items-center gap-5">
            <div
              className="w-20 h-20 rounded-2xl overflow-hidden bg-sj-50 border-3 border-sj-200 flex items-center justify-center flex-shrink-0"
              style={{ boxShadow: "0 4px 0 0 rgba(22,163,74,0.2)" }}
            >
              {av.image ? (
                <img src={av.image} alt={av.name} className="w-full h-full object-contain" />
              ) : (
                <span className="text-4xl">{av.emoji}</span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-800 dark:text-gray-100">{student.name}</h1>
              <p className="text-sj-500 font-bold text-sm">{av.name}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="badge bg-amber-50 text-amber-700 border border-amber-200">⭐ {student.totalPoints} poäng</span>
                <span className="badge bg-blue-50 text-blue-700 border border-blue-200">🏆 {totalChests} kistor</span>
              </div>
            </div>
          </div>
        </BlurFade>

        {/* Stats per language */}
        <BlurFade delay={0.08}>
          <div className="card">
            <h2 className="text-lg font-black text-gray-800 dark:text-gray-100 mb-4">Framsteg per språk</h2>
            <div className="space-y-4">
              {LANGUAGES.map((lang) => {
                const lp = student.languages[lang.id];
                const vocabDone = Object.values(lp?.vocabularyModules ?? {}).filter((m) => m.completed).length;
                const grammarDone = Object.values(lp?.grammarModules ?? {}).filter((m) => m.completed).length;
                const langPoints = [
                  ...Object.values(lp?.vocabularyModules ?? {}),
                  ...Object.values(lp?.grammarModules ?? {}),
                ].reduce((s, m) => s + m.points, 0);
                const total = vocabDone + grammarDone;

                return (
                  <div key={lang.id} className="flex items-center gap-3">
                    <span className="text-2xl">{lang.flag}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{lang.name}</span>
                        <span className="text-xs text-amber-600 font-bold">⭐ {langPoints}p</span>
                      </div>
                      <p className="text-xs text-gray-500">{total} moduler klarade</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </BlurFade>

        {/* Badges */}
        {(gam?.badges.length ?? 0) > 0 && (
          <BlurFade delay={0.12}>
            <div className="card">
              <h2 className="text-lg font-black text-gray-800 dark:text-gray-100 mb-4">Märken</h2>
              <div className="flex flex-wrap gap-2">
                {gam!.badges.map((badge) => (
                  <span key={badge} className="badge bg-purple-50 text-purple-700 border border-purple-200">
                    🏅 {badge}
                  </span>
                ))}
              </div>
            </div>
          </BlurFade>
        )}

        {/* Chest stats */}
        <BlurFade delay={0.16}>
          <div className="card">
            <h2 className="text-lg font-black text-gray-800 dark:text-gray-100 mb-3">Kistor</h2>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-sj-50 rounded-xl p-3">
                <div className="text-2xl font-black text-sj-700">{totalChests}</div>
                <div className="text-xs text-gray-500">Totalt</div>
              </div>
              <div className="bg-amber-50 rounded-xl p-3">
                <div className="text-2xl font-black text-amber-700">{openedChests}</div>
                <div className="text-xs text-gray-500">Öppnade</div>
              </div>
              <div className="bg-red-50 rounded-xl p-3">
                <div className="text-2xl font-black text-red-700">{totalChests - openedChests}</div>
                <div className="text-xs text-gray-500">Oöppnade</div>
              </div>
            </div>
            <Link
              href="/kistor"
              className="block mt-3 text-center text-sm font-bold text-sj-600 hover:text-sj-700 py-2 rounded-xl hover:bg-sj-50 transition-colors"
            >
              Öppna kistor →
            </Link>
          </div>
        </BlurFade>

        {/* Export */}
        <BlurFade delay={0.20}>
          <div className="card">
            <h2 className="text-lg font-black text-gray-800 dark:text-gray-100 mb-3">Data</h2>
            <button
              onClick={() => exportProgress(student)}
              className="btn-secondary w-full border-sj-200 text-sj-600"
            >
              📥 Exportera framsteg
            </button>
          </div>
        </BlurFade>
      </main>
    </div>
  );
}
