"use client";
// deploy trigger 2026-03-15

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/ui/Header";
import { loadStudent, createStudent, clearStudent, studentExists } from "@/lib/storage";
import { STAGES } from "@/lib/stages";
import { AVATARS } from "@/lib/avatars";
import { BlurFade } from "@/components/magicui/blur-fade";
import { NumberTicker } from "@/components/magicui/number-ticker";
import type { StudentData, StageId } from "@/lib/types";

const SCENE_EMOJIS: Record<StageId, string> = {
  lagstadiet:    "🌾 🌿 ✏️",
  mellanstadiet: "🌲 📖 🧚",
  hogstadiet:    "🌊 📜 🍾",
  gymnasiet:     "🏛️ 📚 🎓",
};

export default function HomePage() {
  const [student, setStudent] = useState<StudentData | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("ninja");
  const [loading, setLoading] = useState(true);
  const [isReturning, setIsReturning] = useState(false);

  useEffect(() => {
    setStudent(loadStudent());
    setLoading(false);
  }, []);

  function handleNameChange(value: string) {
    setNameInput(value);
    setIsReturning(studentExists(value.trim()));
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!nameInput.trim()) return;
    const data = createStudent(nameInput.trim(), selectedAvatar);
    setStudent(data);
  }

  function handleLogout() {
    clearStudent();
    setStudent(null);
    setNameInput("");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-bounce-slow">🇸🇪</div>
      </div>
    );
  }

  // ─── Login screen ───────────────────────────────────────────────────────────
  if (!student) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: "linear-gradient(135deg, #fed7aa 0%, #fef3c7 30%, #fde68a 60%, #d9f99d 100%)" }}
      >
        <BlurFade className="w-full max-w-sm flex-shrink-0">
          {/* Title */}
          <div className="text-center mb-4">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-3 animate-float border-4 border-white/60 overflow-hidden"
              style={{
                boxShadow: "0 6px 0 0 rgba(0,106,167,0.4), 0 10px 20px -4px rgba(0,106,167,0.3)"
              }}
            >
              <img src="/icon.svg" alt="Svensk flagga" className="w-full h-full" />
            </div>
            <h1 className="text-3xl font-black tracking-tight drop-shadow-sm" style={{ color: "#7c2d12" }}>
              Svenskajakten
            </h1>
            <p className="mt-1 text-sm font-bold" style={{ color: "#f97316" }}>
              Lär dig svenska på ett roligt sätt!
            </p>
          </div>

          {/* Login card */}
          <div
            className="bg-white rounded-3xl p-5 border-3 border-sv-100"
            style={{ boxShadow: "0 8px 0 0 rgba(249,115,22,0.12), 0 16px 32px -8px rgba(249,115,22,0.18), inset 0 4px 8px 0 rgba(255,255,255,0.8)" }}
          >
            <h2 className="text-xl font-black mb-0.5" style={{ color: "#7c2d12" }}>Välkommen!</h2>
            <p className="text-sv-400 text-sm mb-4 font-medium">
              Skriv ditt namn för att börja eller fortsätta.
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ditt namn..."
                  className="input-field text-base w-full"
                  autoFocus
                  maxLength={30}
                />
                {isReturning && (
                  <p className="mt-1.5 text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <span>✅</span> Välkommen tillbaka! Din data är sparad.
                  </p>
                )}
              </div>

              {/* Avatar selection */}
              <div>
                <p className="text-sm font-bold mb-2" style={{ color: "#c2570a" }}>Välj din karaktär</p>
                <div className="grid grid-cols-5 gap-2">
                  {AVATARS.map((avatar) => (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => setSelectedAvatar(avatar.id)}
                      title={avatar.name}
                      className={`aspect-square rounded-xl flex items-center justify-center transition-all duration-200 overflow-hidden text-xl cursor-pointer border-3 ${
                        selectedAvatar === avatar.id
                          ? "border-sang-400 scale-110 bg-sang-50"
                          : "border-sv-100 bg-sv-50 hover:border-sv-300 hover:scale-105"
                      }`}
                      style={{
                        boxShadow: selectedAvatar === avatar.id
                          ? "0 4px 0 0 rgba(245,158,11,0.3), 0 6px 12px -2px rgba(245,158,11,0.2), inset 0 2px 4px 0 rgba(255,255,255,0.8)"
                          : "0 3px 0 0 rgba(249,115,22,0.1), inset 0 2px 4px 0 rgba(255,255,255,0.8)"
                      }}
                    >
                      {avatar.image
                        ? <img src={avatar.image} alt={avatar.name} className="w-full h-full object-contain p-1" />
                        : avatar.emoji}
                    </button>
                  ))}
                </div>
                <p className="text-xs font-bold mt-2 text-center" style={{ color: "#f97316" }}>
                  {AVATARS.find((a) => a.id === selectedAvatar)?.name}
                </p>
              </div>

              <button
                type="submit"
                disabled={!nameInput.trim()}
                className="w-full btn-primary text-base py-3 rounded-xl border-3 border-sv-400 disabled:from-gray-200 disabled:to-gray-300 disabled:text-gray-400 disabled:border-gray-200"
                style={{ background: nameInput.trim() ? "linear-gradient(135deg, #f97316, #ea6c0a)" : undefined }}
              >
                {isReturning ? "Fortsätt jakten! 🏆" : "Starta jakten! 🚀"}
              </button>
            </form>
          </div>
        </BlurFade>
      </div>
    );
  }

  // ─── Logged in – stage selection ────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-amber-50 dark:bg-gray-900">
      <Header student={student} onLogout={handleLogout} />

      <main className="max-w-5xl mx-auto px-4 py-4">
        <BlurFade delay={0} className="mb-4">
          <h2 className="text-2xl font-black text-sv-800 dark:text-gray-100">Välj din värld</h2>
          <p className="text-sv-500 dark:text-gray-400 font-semibold mt-0.5">
            Välkommen tillbaka, <span className="text-sv-600 font-black">{student.name}</span>! Totalt{" "}
            <span className="text-amber-600 font-black">⭐ <NumberTicker value={student.totalPoints} className="text-amber-600" /></span> poäng.
          </p>
        </BlurFade>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {STAGES.map((stage, i) => {
                const stageProgress = student.stages[stage.id];
                const grammarMods  = Object.values(stageProgress.grammarModules);
                const readingMods  = Object.values(stageProgress.readingModules);
                const spellingMods = Object.values(stageProgress.spellingModules ?? {});
                const totalCompleted = grammarMods.filter((m) => m.completed).length
                  + readingMods.filter((m) => m.completed).length
                  + spellingMods.filter((m) => m.completed).length;
                const stagePoints = [...grammarMods, ...readingMods, ...spellingMods]
                  .reduce((sum, m) => sum + m.points, 0);

                return (
                  <BlurFade key={stage.id} delay={0.05 + i * 0.06}>
                    <Link href={`/world/${stage.id}`} className="block group">
                      <div
                        className={`rounded-3xl overflow-hidden border-3 transition-all duration-200 group-hover:-translate-y-1.5 group-hover:shadow-xl cursor-pointer ${stage.borderClass}`}
                        style={{ boxShadow: "0 4px 0 0 rgba(0,0,0,0.1), 0 8px 20px -4px rgba(0,0,0,0.12)" }}
                      >
                        {/* Gradient header */}
                        <div className={`${stage.bgClass} px-5 py-5`}>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-5xl drop-shadow-lg">{stage.emoji}</span>
                              <div>
                                <div className="text-xs font-bold text-white bg-black/30 rounded-full px-2.5 py-0.5 inline-block mb-1.5">
                                  {stage.subtitle} · {stage.grades}
                                </div>
                                <h3
                                  className="text-2xl font-black text-white leading-tight"
                                  style={{ textShadow: "0 1px 3px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)" }}
                                >
                                  {stage.name}
                                </h3>
                              </div>
                            </div>
                            {stagePoints > 0 && (
                              <div className="bg-black/25 rounded-xl px-2.5 py-1.5 flex items-center gap-1 flex-shrink-0">
                                <span className="text-yellow-300 text-sm">⭐</span>
                                <span className="text-white font-black text-sm">{stagePoints}</span>
                              </div>
                            )}
                          </div>
                          <div className="mt-2.5 text-2xl opacity-75 tracking-widest">
                            {SCENE_EMOJIS[stage.id as StageId]}
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-white dark:bg-gray-800 px-5 py-3.5 flex items-center justify-between">
                          {totalCompleted > 0 ? (
                            <span className="text-sm font-bold text-sv-600 dark:text-gray-300 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                              {totalCompleted} modul{totalCompleted !== 1 ? "er" : ""} klarade
                            </span>
                          ) : (
                            <span className="text-sm font-semibold text-sv-400 dark:text-gray-500">
                              Inte börjat än
                            </span>
                          )}
                          <span
                            className="text-sm font-black px-4 py-1.5 rounded-xl text-white transition-all group-hover:scale-105 group-hover:shadow-md"
                            style={{ background: "linear-gradient(135deg, #f97316, #ea6c0a)", boxShadow: "0 2px 0 0 rgba(234,108,10,0.4)" }}
                          >
                            Öppna →
                          </span>
                        </div>
                      </div>
                    </Link>
                  </BlurFade>
                );
              })}
        </div>
      </main>
    </div>
  );
}
