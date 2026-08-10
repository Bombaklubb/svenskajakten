"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/ui/Header";
import { loadStudent, saveStudent, loadGamification, saveGamification } from "@/lib/storage";
import { BOSSES, getBadge, capNewChests, CHEST_META } from "@/lib/gamification";
import type { StudentData, GamificationData, Chest, ChestType } from "@/lib/types";

const PASS_BADGE = "boss_slayer";

const CAT_LABELS: Record<string, string> = {
  grammar: "Grammatik",
  spelling: "Stavning",
};

type Phase = "select" | "intro" | "battle" | "win" | "lose";

function DifficultyStars({ count }: { count: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 6 }, (_, i) => i + 1).map((n) => (
        <span key={n} className={`text-xs ${n <= count ? "opacity-100" : "opacity-20"}`}>⚡</span>
      ))}
    </span>
  );
}

export default function BossPage() {
  const router = useRouter();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [gam, setGam] = useState<GamificationData | null>(null);

  const [phase, setPhase] = useState<Phase>("select");
  const [activeBossId, setActiveBossId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [awardedBonus, setAwardedBonus] = useState(0);

  useEffect(() => {
    const s = loadStudent();
    if (!s) { router.push("/"); return; }
    const g = loadGamification();
    setStudent(s);
    setGam(g);
    if (!g.bossUnlocked) router.push("/kistor");
  }, []);

  if (!student || !gam) return null;

  const activeBoss = BOSSES.find((b) => b.id === activeBossId) ?? null;

  function handleSelectBoss(bossId: string) {
    setActiveBossId(bossId);
    setPhase("intro");
  }

  function handleStartBattle() {
    setCurrentIndex(0);
    setResults([]);
    setSelected(null);
    setConfirmed(false);
    setPhase("battle");
  }

  function handleSelect(idx: number) {
    if (confirmed) return;
    setSelected(idx);
  }

  function handleConfirm() {
    if (!activeBoss || selected === null || confirmed) return;
    setConfirmed(true);
    const questions = activeBoss.questions;
    const currentQ = questions[currentIndex];

    setTimeout(() => {
      const correct = selected === currentQ.correctIndex;
      const newResults = [...results, correct];

      if (currentIndex + 1 >= questions.length) {
        const totalCorrect = newResults.filter(Boolean).length;
        const passed = totalCorrect / questions.length >= activeBoss.passThreshold;

        if (passed) {
          const bonusChest: Chest = {
            id: `chest_boss_${Date.now()}`,
            type: activeBoss.rewardChestType as ChestType,
            earnedAt: new Date().toISOString(),
            opened: false,
          };
          const cappedChests = capNewChests(gam!.chests, [bonusChest]);
          const hasBossSlayer = gam!.badges.includes(PASS_BADGE);
          const newBadges = hasBossSlayer ? gam!.badges : [...gam!.badges, PASS_BADGE];
          const prevWins = gam!.bossWinsPerBoss ?? {};
          const prevBossWins = prevWins[activeBoss.id] ?? 0;
          const actualBonus = prevBossWins === 0 ? Math.min(activeBoss.bonusPoints, 200) : prevBossWins === 1 ? 50 : 0;
          const newGam: GamificationData = {
            ...gam!,
            chests: [...gam!.chests, ...cappedChests],
            badges: newBadges,
            bossWins: gam!.bossWins + 1,
            bossLastAttempt: new Date().toISOString(),
            bossWinsPerBoss: { ...prevWins, [activeBoss.id]: prevBossWins + 1 },
          };
          saveGamification(newGam);
          setGam(newGam);
          setAwardedBonus(actualBonus);
          const updatedStudent: StudentData = { ...student!, totalPoints: student!.totalPoints + actualBonus };
          saveStudent(updatedStudent);
          setStudent(updatedStudent);
        } else {
          const newGam: GamificationData = {
            ...gam!,
            bossLastAttempt: new Date().toISOString(),
          };
          saveGamification(newGam);
          setGam(newGam);
        }

        setResults(newResults);
        setPhase(passed ? "win" : "lose");
      } else {
        setResults(newResults);
        setTimeout(() => {
          setCurrentIndex((i: number) => i + 1);
          setSelected(null);
          setConfirmed(false);
        }, 600);
      }
    }, 400);
  }

  function handleRetry() {
    setCurrentIndex(0);
    setResults([]);
    setSelected(null);
    setConfirmed(false);
    setPhase("battle");
  }

  function handleBackToSelect() {
    setActiveBossId(null);
    setPhase("select");
    setCurrentIndex(0);
    setResults([]);
    setSelected(null);
    setConfirmed(false);
  }

  // ── Boss selection ───────────────────────────────────────────────────────────
  if (phase === "select") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header student={student} />
        <div style={{ background: "linear-gradient(135deg, #1f2937, #374151, #4b5563)" }}>
          <div className="max-w-3xl mx-auto px-4 py-6">
            <Link href="/kistor" className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-3 transition-colors">
              ← Hemliga kistor
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-4xl">⚔️</span>
              <div>
                <h1 className="text-2xl font-black text-white">Boss Challenge</h1>
                <p className="text-white/70 text-sm">Välj en boss att utmana!</p>
              </div>
            </div>
          </div>
        </div>

        <main className="max-w-3xl mx-auto px-4 py-8 space-y-4">
          {BOSSES.map((boss) => {
            const wins = gam.bossWinsPerBoss?.[boss.id] ?? 0;
            return (
              <button
                key={boss.id}
                onClick={() => handleSelectBoss(boss.id)}
                className="w-full text-left rounded-3xl overflow-hidden transition-all active:scale-[0.99] cursor-pointer"
                style={{ border: `3px solid ${boss.borderColor}`, boxShadow: `0 6px 24px rgba(0,0,0,0.15)` }}
              >
                <div className="flex items-center gap-4 px-5 py-4" style={{ background: boss.gradient }}>
                  <div className="text-5xl flex-shrink-0 drop-shadow-lg">{boss.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h2 className="text-lg font-black text-white">{boss.name}</h2>
                      {wins > 0 && (
                        <span className="text-xs font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">
                          {wins}× vunnit
                        </span>
                      )}
                    </div>
                    <p className="text-white/80 text-sm leading-snug">{boss.subtitle}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <DifficultyStars count={boss.difficultyStars} />
                    <p className="text-white/70 text-xs mt-1">{boss.difficulty}</p>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                    <span>📝 {boss.questions.length} frågor</span>
                    <span>🏆 +{boss.bonusPoints} poäng</span>
                  </div>
                  <span className="font-bold text-gray-500 dark:text-gray-300 text-sm">Utmana →</span>
                </div>
              </button>
            );
          })}
        </main>
      </div>
    );
  }

  // ── Boss intro ───────────────────────────────────────────────────────────────
  if (phase === "intro" && activeBoss) {
    const neededCorrect = Math.ceil(activeBoss.questions.length * activeBoss.passThreshold);
    const currentWins = gam.bossWinsPerBoss?.[activeBoss.id] ?? 0;
    const expectedBonus = currentWins === 0 ? Math.min(activeBoss.bonusPoints, 200) : currentWins === 1 ? 50 : 0;
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header student={student} />
        <div style={{ background: activeBoss.gradient }}>
          <div className="max-w-3xl mx-auto px-4 py-6">
            <button onClick={handleBackToSelect} className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-3 transition-colors">
              ← Välj boss
            </button>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{activeBoss.emoji}</span>
              <div>
                <h1 className="text-2xl font-black text-white">{activeBoss.name}</h1>
                <p className="text-white/70 text-sm">{activeBoss.subtitle}</p>
              </div>
            </div>
          </div>
        </div>

        <main className="max-w-3xl mx-auto px-4 py-8">
          <div
            className="rounded-3xl p-6 space-y-5 bg-white dark:bg-gray-800"
            style={{ border: `3px solid ${activeBoss.borderColor}`, boxShadow: `0 8px 32px rgba(0,0,0,0.12)` }}
          >
            <div className="text-center">
              <div className="text-7xl mb-3 drop-shadow-lg">{activeBoss.emoji}</div>
              <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 mb-2">Möt {activeBoss.name}!</h2>
              <p className="text-gray-500 dark:text-gray-300 text-sm">{activeBoss.description}</p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { value: activeBoss.questions.length, label: "frågor", color: "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600", textColor: "text-gray-700 dark:text-gray-200" },
                { value: expectedBonus > 0 ? `+${expectedBonus}` : "0", label: "bonuspoäng", color: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800", textColor: "text-amber-700 dark:text-amber-300" },
                { value: `${neededCorrect}/${activeBoss.questions.length}`, label: "för att vinna", color: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800", textColor: "text-green-700 dark:text-green-300" },
              ].map((stat) => (
                <div key={stat.label} className={`rounded-2xl p-3 border ${stat.color}`}>
                  <p className={`text-2xl font-black ${stat.textColor}`}>{stat.value}</p>
                  <p className={`text-xs ${stat.textColor} opacity-70`}>{stat.label}</p>
                </div>
              ))}
            </div>

            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                Vinn: {expectedBonus > 0 ? `+${expectedBonus} poäng + ` : ""}märket &quot;Bossbesegrare&quot; + {CHEST_META[activeBoss.rewardChestType].label.toLowerCase()}!
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-0.5 flex-shrink-0">↺</span>
                Förlora: Försök igen när du vill.
              </li>
            </ul>

            <button
              onClick={handleStartBattle}
              className="w-full py-4 rounded-2xl font-black text-white text-lg cursor-pointer transition-all active:scale-95"
              style={{
                background: activeBoss.gradient,
                border: `3px solid ${activeBoss.accentColor}`,
                boxShadow: `0 6px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15)`,
              }}
            >
              Starta striden! ⚔️
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ── Battle ───────────────────────────────────────────────────────────────────
  if (phase === "battle" && activeBoss) {
    const questions = activeBoss.questions;
    const currentQ = questions[currentIndex];
    const progress = (currentIndex / questions.length) * 100;
    const isCorrect = confirmed && selected === currentQ.correctIndex;
    const isWrong = confirmed && selected !== null && selected !== currentQ.correctIndex;

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header student={student} />

        <div style={{ background: activeBoss.gradient }}>
          <div className="max-w-3xl mx-auto px-4 py-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/70 text-sm">
                {activeBoss.emoji} {activeBoss.name} – Fråga {currentIndex + 1} / {questions.length}
              </span>
              <span className="text-white/70 text-sm">
                ✓ {results.filter(Boolean).length} rätt
              </span>
            </div>
            <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/70 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <main className="max-w-3xl mx-auto px-4 py-6">
          <div
            className="rounded-3xl p-6 bg-white dark:bg-gray-800"
            style={{ border: `3px solid ${activeBoss.borderColor}`, boxShadow: `0 6px 24px rgba(0,0,0,0.1)` }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                {CAT_LABELS[currentQ.category]}
              </span>
              <span className="text-2xl">{activeBoss.emoji}</span>
            </div>

            <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6 leading-snug">
              {currentQ.question}
            </p>

            <div className="space-y-3">
              {currentQ.options.map((opt, idx) => {
                let btnClass = "w-full text-left px-4 py-3 rounded-2xl font-medium transition-all cursor-pointer disabled:cursor-default text-gray-800 dark:text-gray-100";
                let btnStyle: React.CSSProperties = { boxShadow: "0 2px 8px rgba(0,0,0,0.06)" };

                if (confirmed) {
                  if (idx === currentQ.correctIndex) {
                    btnClass += " bg-green-50 dark:bg-green-900/40 border-[3px] border-green-500";
                    btnStyle = { boxShadow: "0 2px 8px rgba(34,197,94,0.25)" };
                  } else if (idx === selected) {
                    btnClass += " bg-red-50 dark:bg-red-900/40 border-[3px] border-red-500";
                    btnStyle = { boxShadow: "0 2px 8px rgba(239,68,68,0.25)" };
                  } else {
                    btnClass += " bg-white dark:bg-gray-700 border-[3px] border-gray-200 dark:border-gray-600";
                  }
                } else if (idx === selected) {
                  btnClass += " bg-orange-50 dark:bg-gray-600 border-[3px]";
                  btnStyle = { borderColor: activeBoss.accentColor, boxShadow: "0 2px 8px rgba(0,0,0,0.12)" };
                } else {
                  btnClass += " bg-white dark:bg-gray-700 border-[3px] border-gray-200 dark:border-gray-600";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    disabled={confirmed}
                    className={btnClass}
                    style={btnStyle}
                  >
                    <span className="font-bold text-gray-500 dark:text-gray-300 mr-2">{["A", "B", "C", "D"][idx]}.</span>
                    {opt}
                  </button>
                );
              })}
            </div>

            {!confirmed && (
              <button
                onClick={handleConfirm}
                disabled={selected === null}
                className="mt-5 w-full py-3 rounded-2xl font-bold text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                style={{
                  background: selected !== null ? activeBoss.gradient : "#d1d5db",
                  border: `3px solid ${selected !== null ? activeBoss.accentColor : "#9ca3af"}`,
                }}
              >
                Svara!
              </button>
            )}

            {confirmed && (
              <div className={`mt-5 rounded-2xl p-3 text-center font-bold ${
                isCorrect ? "bg-green-100 text-green-700 border-2 border-green-300" : "bg-red-100 text-red-700 border-2 border-red-300"
              }`}>
                {isCorrect ? "✓ Rätt!" : `✗ Fel! Rätt svar: ${currentQ.options[currentQ.correctIndex]}`}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ── Win screen ───────────────────────────────────────────────────────────────
  if (phase === "win" && activeBoss) {
    const totalCorrect = results.filter(Boolean).length;
    const badge = getBadge(PASS_BADGE);
    const chestLabel = CHEST_META[activeBoss.rewardChestType].label;
    const chestEmoji = CHEST_META[activeBoss.rewardChestType].emoji;

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header student={student} />
        <main className="max-w-3xl mx-auto px-4 py-10">
          <div
            className="rounded-3xl p-8 text-center"
            style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", border: "3px solid #86efac", boxShadow: "0 8px 32px rgba(34,197,94,0.2)" }}
          >
            <div className="text-7xl mb-4">🏆</div>
            <h1 className="text-3xl font-black text-green-800 mb-2">Du vann!</h1>
            <p className="text-green-600 mb-6">
              {totalCorrect}/{activeBoss.questions.length} rätt – {activeBoss.name} är besegrad!
            </p>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white rounded-2xl p-3 border border-green-200">
                <p className="text-2xl font-black text-green-600">{awardedBonus > 0 ? `+${awardedBonus}` : "0"}</p>
                <p className="text-xs text-green-500">bonuspoäng</p>
              </div>
              <div className="bg-white rounded-2xl p-3 border border-green-200">
                <p className="text-2xl">{badge?.emoji ?? "⚔️"}</p>
                <p className="text-xs text-green-500">Bossbesegrare</p>
              </div>
              <div className="bg-white rounded-2xl p-3 border border-green-200">
                <p className="text-2xl">{chestEmoji}</p>
                <p className="text-xs text-green-500">{chestLabel}!</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Link
                href="/kistor"
                className="flex-1 py-3 rounded-2xl font-bold text-white text-center cursor-pointer transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg, #16a34a, #15803d)", border: "3px solid #15803d" }}
              >
                Öppna kistor →
              </Link>
              <button
                onClick={handleRetry}
                className="flex-1 py-3 rounded-2xl font-bold text-green-700 border-2 border-green-300 bg-white cursor-pointer transition-all hover:bg-green-50 active:scale-95"
              >
                Spela igen
              </button>
            </div>
            <button
              onClick={handleBackToSelect}
              className="mt-3 w-full py-2 rounded-2xl text-sm font-bold text-green-600 hover:underline"
            >
              Välj annan boss
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ── Lose screen ──────────────────────────────────────────────────────────────
  if (phase === "lose" && activeBoss) {
    const totalCorrect = results.filter(Boolean).length;
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header student={student} />
        <main className="max-w-3xl mx-auto px-4 py-10">
          <div
            className="rounded-3xl p-8 text-center"
            style={{ background: "linear-gradient(135deg, #fef2f2, #fee2e2)", border: "3px solid #fca5a5", boxShadow: "0 8px 32px rgba(239,68,68,0.15)" }}
          >
            <div className="text-7xl mb-4">💪</div>
            <h1 className="text-3xl font-black text-red-800 mb-2">Nästan!</h1>
            <p className="text-red-600 mb-2">
              {totalCorrect}/{activeBoss.questions.length} rätt – du behöver {Math.ceil(activeBoss.questions.length * activeBoss.passThreshold)} för att vinna.
            </p>
            <p className="text-sm text-red-500 mb-6">Öva mer och försök igen. Du klarar det!</p>

            <div className="flex gap-3">
              <button
                onClick={handleRetry}
                className="flex-1 py-3 rounded-2xl font-bold text-white cursor-pointer transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg, #dc2626, #991b1b)", border: "3px solid #b91c1c" }}
              >
                Försök igen ↺
              </button>
              <Link
                href="/"
                className="flex-1 py-3 rounded-2xl font-bold text-red-700 border-2 border-red-300 bg-white cursor-pointer text-center transition-all hover:bg-red-50 active:scale-95"
              >
                Öva mer
              </Link>
            </div>
            <button
              onClick={handleBackToSelect}
              className="mt-3 w-full py-2 rounded-2xl text-sm font-bold text-red-500 hover:underline"
            >
              Välj annan boss
            </button>
          </div>
        </main>
      </div>
    );
  }

  return null;
}
