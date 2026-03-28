"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/ui/Header";
import { loadStudent, loadGamification, saveGamification } from "@/lib/storage";
import { BOSS_QUESTIONS, createChest } from "@/lib/gamification";
import { BlurFade } from "@/components/magicui/blur-fade";
import type { StudentData, GamificationData } from "@/lib/types";

type Phase = "intro" | "battle" | "result";

export default function BossPage() {
  const router = useRouter();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [gam, setGam] = useState<GamificationData | null>(null);
  const [phase, setPhase] = useState<Phase>("intro");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setStudent(loadStudent());
    setGam(loadGamification());
  }, []);

  const questions = BOSS_QUESTIONS;
  const current = questions[currentIdx];
  const PASS_THRESHOLD = Math.ceil(questions.length * 0.6);

  function handleSelect(idx: number) {
    if (revealed) return;
    setSelectedOption(idx);
    setRevealed(true);
  }

  function handleNext() {
    const isCorrect = selectedOption === current.correctIndex;
    const newCorrect = correctCount + (isCorrect ? 1 : 0);

    if (currentIdx + 1 < questions.length) {
      setCorrectCount(newCorrect);
      setCurrentIdx((prev) => prev + 1);
      setSelectedOption(null);
      setRevealed(false);
    } else {
      finishBattle(newCorrect);
    }
  }

  function finishBattle(finalCorrect: number) {
    setCorrectCount(finalCorrect);
    const won = finalCorrect >= PASS_THRESHOLD;

    if (gam) {
      const updated: GamificationData = {
        ...gam,
        bossWins: won ? gam.bossWins + 1 : gam.bossWins,
        bossLastAttempt: new Date().toISOString(),
      };
      if (won) {
        const diamondChest = createChest("diamond");
        updated.chests = [...updated.chests, diamondChest];
        if (!updated.badges.includes("boss-slayer")) {
          updated.badges = [...updated.badges, "boss-slayer"];
        }
      }
      saveGamification(updated);
      setGam(updated);
    }
    setPhase("result");
  }

  if (!gam?.bossUnlocked) {
    return (
      <div className="min-h-screen bg-sky-50 dark:bg-gray-900">
        <Header student={student} />
        <main className="max-w-2xl mx-auto px-4 py-12 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-black text-gray-800 dark:text-gray-100 mb-2">Låst</h1>
          <p className="text-gray-500 mb-6">Slutför minst 5 övningar för att låsa upp bossutmaningen!</p>
          <Link href="/" className="btn-primary" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
            Öva nu →
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sky-50 dark:bg-gray-900">
      <Header student={student} />

      <main className="max-w-2xl mx-auto px-4 py-6">
        <button onClick={() => router.push("/kistor")} className="inline-flex items-center gap-1.5 text-sj-600 text-sm font-bold mb-4">
          ← Tillbaka
        </button>

        {/* Intro */}
        {phase === "intro" && (
          <BlurFade>
            <div className="card text-center">
              <div className="text-7xl mb-4 animate-float">👹</div>
              <h1 className="text-3xl font-black text-gray-800 dark:text-gray-100 mb-2">Bossutmaning!</h1>
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                Svara på <strong>{questions.length}</strong> frågor om franska, spanska och tyska.
              </p>
              <p className="text-gray-500 text-sm mb-6">
                Du behöver minst <strong>{PASS_THRESHOLD} rätt</strong> för att vinna.
                <br />Belöning: 👑 Diamantkista + 🏅 Boss Slayer-märke!
              </p>
              {gam.bossWins > 0 && (
                <p className="text-sj-600 font-bold text-sm mb-4">
                  Du har besegrat bossen {gam.bossWins} gång{gam.bossWins !== 1 ? "er" : ""} tidigare! 🏆
                </p>
              )}
              <button
                onClick={() => setPhase("battle")}
                className="btn-primary w-full"
                style={{ background: "linear-gradient(135deg, #dc2626, #b91c1c)" }}
              >
                ⚔️ Utmana bossen!
              </button>
            </div>
          </BlurFade>
        )}

        {/* Battle */}
        {phase === "battle" && current && (
          <div className="card">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">👹</span>
                <span className="text-sm font-black text-red-600">BOSS</span>
              </div>
              <span className="text-sm font-bold text-gray-500">{currentIdx + 1}/{questions.length}</span>
            </div>

            <div className="progress-bar-track mb-6">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${(currentIdx / questions.length) * 100}%`,
                  background: "linear-gradient(90deg, #dc2626, #b91c1c)"
                }}
              />
            </div>

            <p className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-5">{current.question}</p>

            <div className="space-y-3">
              {current.options.map((opt, idx) => {
                const base = "w-full text-left px-4 py-3 rounded-xl border-2 font-medium text-sm transition-all duration-200 ";
                let style = base;
                if (!revealed) {
                  style += "border-gray-200 dark:border-gray-600 hover:border-red-400 hover:bg-red-50 cursor-pointer";
                } else if (idx === current.correctIndex) {
                  style += "border-green-400 bg-green-50 text-green-800 animate-pop";
                } else if (idx === selectedOption && selectedOption !== current.correctIndex) {
                  style += "border-red-400 bg-red-50 text-red-800 animate-shake";
                } else {
                  style += "border-gray-100 bg-gray-50 text-gray-400";
                }
                return (
                  <button key={idx} className={style} onClick={() => handleSelect(idx)} disabled={revealed}>
                    <span className="inline-flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-xs flex-shrink-0">
                        {revealed && idx === current.correctIndex ? "✓" : revealed && idx === selectedOption && selectedOption !== current.correctIndex ? "✗" : String.fromCharCode(65 + idx)}
                      </span>
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>

            {revealed && (
              <div className="mt-4 space-y-3">
                {current.explanation && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-xl p-3 text-sm text-amber-800 dark:text-amber-300">
                    💡 {current.explanation}
                  </div>
                )}
                <div className="flex justify-end">
                  <button
                    onClick={handleNext}
                    className="btn-primary"
                    style={{ background: "linear-gradient(135deg, #dc2626, #b91c1c)" }}
                  >
                    {currentIdx + 1 === questions.length ? "Visa resultat →" : "Nästa →"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Result */}
        {phase === "result" && (
          <BlurFade>
            <div className="card text-center">
              <div className="text-7xl mb-4">
                {correctCount >= PASS_THRESHOLD ? "🏆" : "💪"}
              </div>
              <h2 className="text-2xl font-black text-gray-800 dark:text-gray-100 mb-2">
                {correctCount >= PASS_THRESHOLD ? "Du besegrade bossen!" : "Bossen vann denna gång..."}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Du fick <strong>{correctCount}</strong> av <strong>{questions.length}</strong> rätt
              </p>
              {correctCount >= PASS_THRESHOLD ? (
                <div className="space-y-2 mb-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-yellow-700 font-bold text-sm animate-pop">
                    👑 Diamantkista intjänad!
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-purple-700 font-bold text-sm animate-pop">
                    🏅 Boss Slayer-märke upplåst!
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm mb-6">
                  Du behövde {PASS_THRESHOLD} rätt. Öva mer och försök igen!
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => { setPhase("intro"); setCurrentIdx(0); setCorrectCount(0); setSelectedOption(null); setRevealed(false); }}
                  className="btn-secondary flex-1 border-red-200 text-red-600"
                >
                  Försök igen
                </button>
                <button
                  onClick={() => router.push("/kistor")}
                  className="btn-primary flex-1"
                  style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
                >
                  Öppna kistor →
                </button>
              </div>
            </div>
          </BlurFade>
        )}
      </main>
    </div>
  );
}
