"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/ui/Header";
import { loadStudent, createStudent, clearStudent, studentExists } from "@/lib/storage";
import { LANGUAGES } from "@/lib/languages";
import { AVATARS } from "@/lib/avatars";
import { BlurFade } from "@/components/magicui/blur-fade";
import { NumberTicker } from "@/components/magicui/number-ticker";
import type { StudentData, LanguageId } from "@/lib/types";

const LANGUAGE_SCENE_EMOJIS: Record<LanguageId, string> = {
  franska: "🗼 🥐 🎨",
  spanska: "💃 🌞 🎸",
  tyska:   "🏰 🍺 🎶",
};

export default function HomePage() {
  const [student, setStudent] = useState<StudentData | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("ninja");
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageId>("franska");
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
    const data = createStudent(nameInput.trim(), selectedAvatar, selectedLanguage);
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
        <div className="text-4xl animate-bounce-slow">🔍</div>
      </div>
    );
  }

  // ─── Login screen ───────────────────────────────────────────────────────────
  if (!student) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #7dd3fc 0%, #38bdf8 20%, #bae6fd 50%, #86efac 75%, #4ade80 100%)"
        }}
      >
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Hot air balloon */}
          <div className="absolute top-8 right-6 text-5xl animate-float opacity-90">🎈</div>
          {/* Eiffel Tower */}
          <div className="absolute bottom-0 left-4 text-7xl opacity-20 select-none">🗼</div>
          {/* Castle */}
          <div className="absolute bottom-0 right-8 text-6xl opacity-20 select-none">🏰</div>
          {/* Clouds */}
          <div className="absolute top-6 left-1/4 text-4xl opacity-60 animate-float" style={{ animationDelay: "1s" }}>☁️</div>
          <div className="absolute top-12 right-1/3 text-3xl opacity-50 animate-float" style={{ animationDelay: "2s" }}>☁️</div>
          {/* Coins */}
          <div className="absolute bottom-8 left-8 text-3xl opacity-70 animate-bounce-slow">⭐</div>
          <div className="absolute bottom-6 left-16 text-2xl opacity-60 animate-bounce-slow" style={{ animationDelay: "0.5s" }}>⭐</div>
          {/* Magnifying glass top right */}
          <div className="absolute top-10 right-16 text-4xl opacity-80 animate-float" style={{ animationDelay: "0.5s" }}>🔍</div>
        </div>

        <BlurFade className="w-full max-w-sm flex-shrink-0 relative z-10">
          {/* Title banner */}
          <div className="text-center mb-4">
            <div
              className="inline-block mb-2 px-6 py-2 rounded-2xl"
              style={{ background: "linear-gradient(135deg, #1d4ed8, #2563eb)", boxShadow: "0 4px 0 0 rgba(29,78,216,0.5), 0 8px 20px -4px rgba(29,78,216,0.4)" }}
            >
              <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-sm">
                <span style={{ color: "#fde68a" }}>Spr</span>
                <span className="text-white">å</span>
                <span style={{ color: "#fde68a" }}>k</span>
                <span className="text-white">jakten</span>
              </h1>
            </div>
            {/* Välkommen banner */}
            <div
              className="inline-block px-8 py-2 rounded-xl"
              style={{ background: "linear-gradient(135deg, #16a34a, #22c55e)", boxShadow: "0 3px 0 0 rgba(22,163,74,0.5)" }}
            >
              <p className="text-white font-black text-lg tracking-wide">Välkommen!</p>
            </div>
          </div>

          {/* Login card */}
          <div
            className="bg-white rounded-3xl p-5 border-3 border-gray-100"
            style={{ boxShadow: "0 8px 0 0 rgba(0,0,0,0.08), 0 16px 32px -8px rgba(0,0,0,0.15), inset 0 4px 8px 0 rgba(255,255,255,0.8)" }}
          >
            <h2 className="text-xl font-black mb-0.5 text-gray-800">Välkommen!</h2>
            <p className="text-orange-400 text-sm mb-4 font-medium">
              Skriv ditt namn för att börja:
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Name input */}
              <div className="relative">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ditt namn..."
                  className="input-field-orange text-base w-full"
                  autoFocus
                  maxLength={30}
                />
                {isReturning && (
                  <p className="mt-1.5 text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <span>✅</span> Välkommen tillbaka! Din data är sparad.
                  </p>
                )}
              </div>

              {/* Language selection */}
              <div>
                <p className="text-sm font-bold mb-2 text-gray-700">Välj språk:</p>
                <div className="grid grid-cols-3 gap-2">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => setSelectedLanguage(lang.id)}
                      className={`relative flex flex-col items-center justify-center gap-1 py-3 rounded-xl border-3 font-bold text-sm transition-all duration-200 cursor-pointer overflow-hidden ${
                        selectedLanguage === lang.id
                          ? "scale-105 border-white"
                          : "border-transparent opacity-80 hover:opacity-100 hover:scale-102"
                      }`}
                      style={{
                        background:
                          lang.id === "franska"
                            ? selectedLanguage === "franska"
                              ? "linear-gradient(135deg, #002395, #1d4ed8)"
                              : "linear-gradient(135deg, #1e40af, #1d4ed8)"
                            : lang.id === "spanska"
                            ? selectedLanguage === "spanska"
                              ? "linear-gradient(135deg, #c8102e, #e11d48)"
                              : "linear-gradient(135deg, #9f1239, #be123c)"
                            : selectedLanguage === "tyska"
                            ? "linear-gradient(135deg, #1c1c1c, #374151)"
                            : "linear-gradient(135deg, #1f2937, #374151)",
                        boxShadow: selectedLanguage === lang.id
                          ? "0 5px 0 0 rgba(0,0,0,0.3), 0 8px 16px -4px rgba(0,0,0,0.25)"
                          : "0 3px 0 0 rgba(0,0,0,0.2)",
                      }}
                    >
                      {/* Flag stripe for Spanish */}
                      {lang.id === "spanska" && (
                        <div className="absolute top-0 left-0 right-0 h-[6px]" style={{ background: "#c8102e" }} />
                      )}
                      {lang.id === "spanska" && (
                        <div className="absolute bottom-0 left-0 right-0 h-[6px]" style={{ background: "#c8102e" }} />
                      )}
                      {/* German flag stripes */}
                      {lang.id === "tyska" && (
                        <>
                          <div className="absolute top-0 left-0 right-0 h-[5px]" style={{ background: "#000" }} />
                          <div className="absolute top-[5px] left-0 right-0 h-[5px]" style={{ background: "#DD0000" }} />
                          <div className="absolute top-[10px] left-0 right-0 h-[5px]" style={{ background: "#FFCE00" }} />
                        </>
                      )}
                      <span className="text-2xl mt-1">{lang.flag}</span>
                      <span className="text-white font-black text-xs tracking-wide">{lang.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Avatar selection */}
              <div>
                <p className="text-sm font-bold mb-2 text-gray-700">Välj din karaktär:</p>
                <div className="grid grid-cols-5 gap-2">
                  {AVATARS.slice(0, 10).map((avatar) => (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => setSelectedAvatar(avatar.id)}
                      title={avatar.name}
                      className={`aspect-square rounded-xl flex items-center justify-center transition-all duration-200 overflow-hidden text-xl cursor-pointer border-3 ${
                        selectedAvatar === avatar.id
                          ? "border-sj-400 scale-110 bg-sj-50"
                          : "border-gray-200 bg-gray-50 hover:border-sj-300 hover:scale-105"
                      }`}
                      style={{
                        boxShadow: selectedAvatar === avatar.id
                          ? "0 4px 0 0 rgba(34,197,94,0.3), 0 6px 12px -2px rgba(34,197,94,0.2), inset 0 2px 4px 0 rgba(255,255,255,0.8)"
                          : "0 3px 0 0 rgba(0,0,0,0.08), inset 0 2px 4px 0 rgba(255,255,255,0.8)"
                      }}
                    >
                      {avatar.image
                        ? <img src={avatar.image} alt={avatar.name} className="w-full h-full object-contain p-0.5" />
                        : avatar.emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start button */}
              <button
                type="submit"
                disabled={!nameInput.trim()}
                className="w-full font-black text-lg py-4 rounded-2xl text-white transition-all duration-200 border-3 border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: nameInput.trim()
                    ? "linear-gradient(135deg, #22c55e, #16a34a)"
                    : "linear-gradient(135deg, #d1d5db, #9ca3af)",
                  boxShadow: nameInput.trim()
                    ? "0 5px 0 0 rgba(22,163,74,0.5), 0 8px 20px -4px rgba(22,163,74,0.4), inset 0 2px 4px 0 rgba(255,255,255,0.3)"
                    : "0 3px 0 0 rgba(0,0,0,0.1)",
                }}
              >
                {isReturning ? "Fortsätt jakten! 🏆" : "✅ Börja!"}
              </button>
            </form>
          </div>
        </BlurFade>
      </div>
    );
  }

  // ─── Logged in – language selection ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-sky-50 dark:bg-gray-900">
      <Header student={student} onLogout={handleLogout} />

      <main className="max-w-5xl mx-auto px-4 py-4">
        <BlurFade delay={0} className="mb-4">
          <h2 className="text-2xl font-black text-sj-800 dark:text-gray-100">Välj ditt språk</h2>
          <p className="text-sj-500 dark:text-gray-400 font-semibold mt-0.5">
            Välkommen, <span className="text-sj-600 font-black">{student.name}</span>! Totalt{" "}
            <span className="text-amber-600 font-black">⭐ <NumberTicker value={student.totalPoints} className="text-amber-600" /></span> poäng.
          </p>
        </BlurFade>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {LANGUAGES.map((lang, i) => {
            const langProgress = student.languages[lang.id];
            const vocabMods  = Object.values(langProgress?.vocabularyModules ?? {});
            const grammarMods = Object.values(langProgress?.grammarModules ?? {});
            const totalCompleted = vocabMods.filter((m) => m.completed).length
              + grammarMods.filter((m) => m.completed).length;
            const langPoints = [...vocabMods, ...grammarMods]
              .reduce((sum, m) => sum + m.points, 0);

            return (
              <BlurFade key={lang.id} delay={0.05 + i * 0.06}>
                <Link href={`/world/${lang.id}`} className="block group">
                  <div
                    className={`rounded-3xl overflow-hidden border-3 transition-all duration-200 group-hover:-translate-y-1.5 group-hover:shadow-xl cursor-pointer ${lang.borderClass}`}
                    style={{ boxShadow: "0 4px 0 0 rgba(0,0,0,0.1), 0 8px 20px -4px rgba(0,0,0,0.12)" }}
                  >
                    {/* Gradient header */}
                    <div className={`${lang.bgClass} px-5 py-6`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-5xl drop-shadow-lg">{lang.flag}</span>
                          <div>
                            <div className="text-xs font-bold text-white bg-black/30 rounded-full px-2.5 py-0.5 inline-block mb-1.5">
                              {lang.nativeName}
                            </div>
                            <h3
                              className="text-2xl font-black text-white leading-tight"
                              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)" }}
                            >
                              {lang.name}
                            </h3>
                          </div>
                        </div>
                        {langPoints > 0 && (
                          <div className="bg-black/25 rounded-xl px-2.5 py-1.5 flex items-center gap-1 flex-shrink-0">
                            <span className="text-yellow-300 text-sm">⭐</span>
                            <span className="text-white font-black text-sm">{langPoints}</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-2.5 text-2xl opacity-75 tracking-widest">
                        {LANGUAGE_SCENE_EMOJIS[lang.id]}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-white dark:bg-gray-800 px-5 py-3.5 flex items-center justify-between">
                      {totalCompleted > 0 ? (
                        <span className="text-sm font-bold text-sj-600 dark:text-gray-300 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                          {totalCompleted} modul{totalCompleted !== 1 ? "er" : ""} klarade
                        </span>
                      ) : (
                        <span className="text-sm font-semibold text-gray-400 dark:text-gray-500">
                          Inte börjat än
                        </span>
                      )}
                      <span
                        className="text-sm font-black px-4 py-1.5 rounded-xl text-white transition-all group-hover:scale-105 group-hover:shadow-md"
                        style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", boxShadow: "0 2px 0 0 rgba(22,163,74,0.4)" }}
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
