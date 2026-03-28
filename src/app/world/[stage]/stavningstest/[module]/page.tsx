"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/ui/Header";
import ResultModal from "@/components/ui/ResultModal";
import { loadStudent, saveModuleProgress, loadGamification, saveGamification } from "@/lib/storage";
import {
  chestsEarnedFromPoints,
  chestsEarnedFromExercises,
  chestsEarnedFromAchievements,
  rollMysteryBox,
  BOSS_UNLOCK_THRESHOLD,
} from "@/lib/gamification";
import { ACHIEVEMENTS, isUnlocked } from "@/lib/achievements";
import MysteryBoxPopup from "@/components/ui/MysteryBoxPopup";
import type { ChestType, MysteryBoxReward } from "@/lib/types";
import { getStage } from "@/lib/stages";
import type { StudentData, StageContent, SpellingTimedModule } from "@/lib/types";

const POINTS_PER_CORRECT = 10;
const DEFAULT_TIME_LIMIT = 60;

interface Props {
  params: Promise<{ stage: string; module: string }>;
}

export default function StavningstestPage({ params }: Props) {
  const { stage: stageId, module: moduleId } = use(params);
  const stage = getStage(stageId);
  const router = useRouter();

  const [student, setStudent] = useState<StudentData | null>(null);
  const [mod, setMod] = useState<SpellingTimedModule | null>(null);
  const [loading, setLoading] = useState(true);

  const [phase, setPhase] = useState<"intro" | "playing" | "done">("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState("");
  const [results, setResults] = useState<boolean[]>([]);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIME_LIMIT);
  const [timesUp, setTimesUp] = useState(false);

  const [showResult, setShowResult] = useState(false);
  const [chestEarned, setChestEarned] = useState<ChestType | undefined>();
  const [bossJustUnlocked, setBossJustUnlocked] = useState(false);
  const [mysteryBox, setMysteryBox] = useState<MysteryBoxReward | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const s = loadStudent();
    setStudent(s);
    fetch(`/content/${stageId}/content.json`)
      .then((r) => r.json())
      .then((data: StageContent) => {
        const found = (data.stavningstest ?? []).find((m) => m.id === moduleId);
        if (found) {
          setMod(found);
          setTimeLeft(found.timeLimit ?? DEFAULT_TIME_LIMIT);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [stageId, moduleId]);

  // Timer
  useEffect(() => {
    if (phase !== "playing") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setTimesUp(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [phase]);

  // When time runs out, finish the test
  useEffect(() => {
    if (!timesUp || phase !== "playing") return;
    // Fill remaining words as wrong
    const remaining = (mod?.words.length ?? 0) - currentIndex;
    const finalResults = [...results, ...Array(remaining).fill(false)];
    finishTest(finalResults);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timesUp]);

  // Auto-focus input
  useEffect(() => {
    if (phase === "playing" && !feedback) {
      inputRef.current?.focus();
    }
  }, [phase, currentIndex, feedback]);

  if (!stage) return notFound();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-bounce-slow">{stage.emoji}</div>
      </div>
    );
  }

  if (!mod) return notFound();

  const totalWords = mod.words.length;
  const timeLimit = mod.timeLimit ?? DEFAULT_TIME_LIMIT;
  const currentWord = mod.words[currentIndex];

  function finishTest(finalResults: boolean[]) {
    if (phase === "done") return;
    setPhase("done");
    const totalCorrect = finalResults.filter(Boolean).length;
    const passed = totalCorrect === totalWords; // must get ALL correct
    const pts = passed ? totalCorrect * POINTS_PER_CORRECT + (mod?.bonusPoints ?? 0) : totalCorrect * POINTS_PER_CORRECT;

    if (student && mod) {
      const updated = saveModuleProgress(student, stage!.id, "stavningstest", mod.id, pts, passed);
      setStudent(updated);

      const gam = loadGamification();
      const prevPoints = student.totalPoints;
      const newPoints = updated.totalPoints;
      const prevExercises = gam.exercisesCompleted;
      const newExercises = prevExercises + 1;

      const pointChests = chestsEarnedFromPoints(prevPoints, newPoints, gam.pointsMilestonesRewarded);
      const exChests = chestsEarnedFromExercises(prevExercises, newExercises, gam.exerciseMilestonesRewarded);
      const prevUnlocked = ACHIEVEMENTS.filter((a) => isUnlocked(a, student)).map((a) => a.id);
      const nowUnlocked = ACHIEVEMENTS.filter((a) => isUnlocked(a, updated)).map((a) => a.id);
      const achChests = chestsEarnedFromAchievements(prevUnlocked, nowUnlocked, gam.achievementsRewarded ?? []);

      const allNewChests = [
        ...pointChests.map((c) => c.chest),
        ...exChests.map((c) => c.chest),
        ...achChests.map((c) => c.chest),
      ];
      const firstChest = allNewChests[0];
      const wasBossUnlocked = gam.bossUnlocked;
      const nowBossUnlocked = wasBossUnlocked || newExercises >= BOSS_UNLOCK_THRESHOLD;

      const mystery = rollMysteryBox(gam.badges);
      const extraMysteryChest =
        mystery?.type === "chest" && mystery.chestType
          ? [{ id: `chest_m_${Date.now()}`, type: mystery.chestType, earnedAt: new Date().toISOString(), opened: false } as import("@/lib/types").Chest]
          : [];
      const mysteryBadge = mystery?.type === "badge" && mystery.badgeId ? mystery.badgeId : null;
      const mysteryPoints = mystery?.type === "points" && mystery.points ? mystery.points : 0;

      saveGamification({
        ...gam,
        chests: [...gam.chests, ...allNewChests, ...extraMysteryChest],
        badges: mysteryBadge && !gam.badges.includes(mysteryBadge) ? [...gam.badges, mysteryBadge] : gam.badges,
        exercisesCompleted: newExercises,
        bossUnlocked: nowBossUnlocked,
        pointsMilestonesRewarded: [...gam.pointsMilestonesRewarded, ...pointChests.map((c) => c.milestone)],
        exerciseMilestonesRewarded: [...gam.exerciseMilestonesRewarded, ...exChests.map((c) => c.milestone)],
        achievementsRewarded: [...(gam.achievementsRewarded ?? []), ...achChests.map((c) => c.achievementId)],
      });

      if (mysteryPoints > 0) setStudent({ ...updated, totalPoints: updated.totalPoints + mysteryPoints });
      if (firstChest) setChestEarned(firstChest.type as ChestType);
      if (nowBossUnlocked && !wasBossUnlocked) setBossJustUnlocked(true);
      if (mystery) setMysteryBox(mystery);
    }
    setResults(finalResults);
    setShowResult(true);
  }

  function handleSubmit() {
    if (!currentWord || feedback) return;
    const correct = input.trim().toLowerCase() === currentWord.word.toLowerCase();
    setFeedback(correct ? "correct" : "wrong");

    setTimeout(() => {
      const newResults = [...results, correct];
      setFeedback(null);
      setInput("");

      if (currentIndex + 1 >= totalWords) {
        clearInterval(timerRef.current!);
        finishTest(newResults);
      } else {
        setResults(newResults);
        setCurrentIndex((i) => i + 1);
      }
    }, 600);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSubmit();
  }

  function handleRetry() {
    setCurrentIndex(0);
    setResults([]);
    setInput("");
    setFeedback(null);
    setTimesUp(false);
    setTimeLeft(mod?.timeLimit ?? DEFAULT_TIME_LIMIT);
    setShowResult(false);
    setChestEarned(undefined);
    setBossJustUnlocked(false);
    setMysteryBox(null);
    setPhase("intro");
  }

  function handleContinue() {
    if (mysteryBox) {
      setShowResult(false);
    } else {
      router.push(`/world/${stageId}`);
    }
  }

  function handleMysteryClose() {
    setMysteryBox(null);
    router.push(`/world/${stageId}`);
  }

  const totalCorrect = results.filter(Boolean).length;
  const earnedPoints = totalCorrect * POINTS_PER_CORRECT;
  const progress = totalWords > 0 ? (currentIndex / totalWords) * 100 : 0;
  const timerPercent = (timeLeft / timeLimit) * 100;
  const timerColor =
    timeLeft > 20 ? "bg-emerald-500" : timeLeft > 10 ? "bg-amber-400" : "bg-red-500";

  // ── Intro phase ──────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header student={student} />
        <div className={`${stage.bgClass} text-white`}>
          <div className="max-w-3xl mx-auto px-4 py-6">
            <Link
              href={`/world/${stageId}`}
              className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-3 transition-colors"
            >
              ← {stage.name}
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{mod.icon}</span>
              <div>
                <h1 className="text-xl font-black text-shadow">{mod.title}</h1>
                <p className="text-white/70 text-sm">{mod.description}</p>
              </div>
            </div>
          </div>
        </div>

        <main className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <div className="card space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⏱️</span>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
                Hur fungerar stavningstestet?
              </h2>
            </div>

            <ul className="space-y-2.5">
              {[
                `Du får ${timeLimit} sekunder på dig att stava ${totalWords} ord.`,
                "Läs ledtråden och skriv ordet med rätt stavning.",
                "Tryck på Enter eller klicka på knappen för att svara.",
                "Du måste ha ALLA rätt för att klara testet och få bonuspoäng.",
                "Varje korrekt svar ger poäng, men fullständigt godkänt kräver 100 % rätt.",
              ].map((tip, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-3 py-2.5 text-amber-900 dark:text-amber-200 text-sm leading-relaxed"
                >
                  <span className="text-amber-500 mt-0.5 flex-shrink-0">💡</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>

            <div className="flex justify-end border-t border-gray-100 dark:border-gray-700 pt-3 sm:pt-4">
              <button
                onClick={() => setPhase("playing")}
                className="btn-primary w-full sm:w-auto justify-center"
                style={{ background: "linear-gradient(135deg, #006AA7, #004a75)" }}
              >
                Starta testet →
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Playing phase ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header student={student} />

      {/* Stage header with progress bar */}
      <div className={`${stage.bgClass} text-white`}>
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link
            href={`/world/${stageId}`}
            className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-2 transition-colors"
          >
            ← Avsluta
          </Link>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-white/80 font-medium">
              Ord {Math.min(currentIndex + 1, totalWords)} av {totalWords}
            </span>
            <span className="text-sm font-bold text-white">
              ⭐ {earnedPoints}p
            </span>
          </div>
          {/* Word progress */}
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/80 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4">
        {/* Timer */}
        <div className="card p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
              ⏱️ Tid kvar
            </span>
            <span
              className={`text-xl font-black tabular-nums ${
                timeLeft <= 10 ? "text-red-500 animate-pulse" : timeLeft <= 20 ? "text-amber-500" : "text-emerald-600"
              }`}
            >
              {timeLeft}s
            </span>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${timerColor}`}
              style={{ width: `${timerPercent}%` }}
            />
          </div>
        </div>

        {/* Word card */}
        <div
          className={`card transition-all duration-300 ${
            feedback === "correct"
              ? "border-2 border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
              : feedback === "wrong"
              ? "border-2 border-red-400 bg-red-50 dark:bg-red-900/20"
              : "border-2 border-transparent"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Stavningstest – Ord {currentIndex + 1}/{totalWords}
            </span>
            <div className="flex gap-1">
              {results.map((r, i) => (
                <span key={i} className={`w-2 h-2 rounded-full ${r ? "bg-emerald-400" : "bg-red-400"}`} />
              ))}
              {Array.from({ length: totalWords - results.length }).map((_, i) => (
                <span key={`p-${i}`} className="w-2 h-2 rounded-full bg-gray-200 dark:bg-gray-600" />
              ))}
            </div>
          </div>

          {/* Clue */}
          <div className="text-center mb-6">
            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 font-semibold">
              Ledtråd
            </p>
            <p className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100 leading-relaxed">
              {currentWord?.clue}
            </p>
          </div>

          {/* Feedback overlay */}
          {feedback && (
            <div
              className={`text-center py-4 rounded-xl mb-4 text-xl font-black ${
                feedback === "correct"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {feedback === "correct" ? "✓ Rätt!" : `✗ Fel – rätt svar: ${currentWord?.word}`}
            </div>
          )}

          {/* Input */}
          {!feedback && (
            <div className="space-y-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Skriv ordet här..."
                className="w-full border-2 border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-base font-medium text-center text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:border-sv-400 dark:focus:border-sv-500 transition-colors"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
              />
              <button
                onClick={handleSubmit}
                disabled={!input.trim()}
                className="btn-primary w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #006AA7, #004a75)" }}
              >
                Svara →
              </button>
            </div>
          )}
        </div>

        {/* Score so far */}
        <div className="flex justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
          <span>✓ {results.filter(Boolean).length} rätt</span>
          <span>✗ {results.filter((r) => !r).length} fel</span>
        </div>
      </main>

      {showResult && (
        <ResultModal
          points={earnedPoints}
          bonusPoints={mod.bonusPoints}
          totalCorrect={totalCorrect}
          totalQuestions={totalWords}
          chestEarned={chestEarned}
          bossUnlocked={bossJustUnlocked}
          onContinue={handleContinue}
          onRetry={handleRetry}
          passedOverride={totalCorrect === totalWords}
          subtitle={
            totalCorrect === totalWords
              ? "🎉 Perfekt! Alla ord rätt – testet klarat!"
              : timesUp
              ? `⏰ Tiden tog slut! Du fick ${totalCorrect} av ${totalWords} rätt. Du behöver alla rätt för att klara testet.`
              : `Du fick ${totalWords - totalCorrect} fel. Du behöver alla rätt för att klara testet!`
          }
        />
      )}

      {!showResult && mysteryBox && (
        <MysteryBoxPopup reward={mysteryBox} onClose={handleMysteryClose} />
      )}
    </div>
  );
}
