"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/ui/Header";
import ProgressBar from "@/components/ui/ProgressBar";
import ResultModal from "@/components/ui/ResultModal";
import FonemExerciseComponent from "@/components/exercises/FonemExercise";
import {
  loadStudent,
  saveStudent,
  saveModuleProgress,
  loadGamification,
  saveGamification,
} from "@/lib/storage";
import { trackEvent } from "@/lib/analytics";
import {
  chestsEarnedFromPoints,
  chestsEarnedFromExercises,
  chestsEarnedFromAchievements,
  rollMysteryBox,
  capNewChests,
  BOSS_UNLOCK_THRESHOLD,
} from "@/lib/gamification";
import { ACHIEVEMENTS, isUnlocked } from "@/lib/achievements";
import MysteryBoxPopup from "@/components/ui/MysteryBoxPopup";
import { getStage } from "@/lib/stages";
import type {
  StudentData,
  StageContent,
  FonemModule,
  ChestType,
  MysteryBoxReward,
} from "@/lib/types";

const POINTS_PER_CORRECT = 10;

interface Props {
  params: Promise<{ stage: string; module: string }>;
}

export default function FonemModulePage({ params }: Props) {
  const { stage: stageId, module: moduleId } = use(params);
  const stage = getStage(stageId);
  const router = useRouter();

  const [student, setStudent] = useState<StudentData | null>(null);
  const [mod, setMod] = useState<FonemModule | null>(null);
  const [loading, setLoading] = useState(true);

  const [phase, setPhase] = useState<"intro" | "exercises">("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [chestEarned, setChestEarned] = useState<ChestType | undefined>();
  const [bossJustUnlocked, setBossJustUnlocked] = useState(false);
  const [mysteryBox, setMysteryBox] = useState<MysteryBoxReward | null>(null);

  useEffect(() => {
    setStudent(loadStudent());
    fetch(`/content/${stageId}/content.json`)
      .then((r) => r.json())
      .then((data: StageContent) => {
        const found = data.fonem?.find((m) => m.id === moduleId);
        if (found) setMod(found);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [stageId, moduleId]);

  if (!stage) return notFound();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-bounce-slow">{stage.emoji}</div>
      </div>
    );
  }

  if (!mod) return notFound();

  const exercises = mod.exercises;
  const totalExercises = exercises.length;
  const currentExercise = exercises[currentIndex];
  const progress = (currentIndex / totalExercises) * 100;

  function handleAnswer(correct: boolean) {
    const newResults = [...results, correct];
    setResults(newResults);

    if (correct) {
      trackEvent({ type: "exercise_done", stage: stageId, moduleId });
    }

    if (currentIndex + 1 >= totalExercises) {
      const totalCorrect = newResults.filter(Boolean).length;
      const pts = totalCorrect * POINTS_PER_CORRECT;
      const passed = totalCorrect / totalExercises >= 0.6;
      const finalPts = passed ? pts + mod!.bonusPoints : pts;

      if (student) {
        const wasAlreadyCompleted =
          student.stages[stage!.id]?.fonemModules?.[mod!.id]?.completed ?? false;

        const updated = saveModuleProgress(
          student,
          stage!.id,
          "fonem",
          mod!.id,
          finalPts,
          passed
        );
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

        const mystery = wasAlreadyCompleted ? null : rollMysteryBox(gam.badges);
        const extraMysteryChest =
          mystery?.type === "chest" && mystery.chestType
            ? [{ id: `chest_m_${Date.now()}`, type: mystery.chestType, earnedAt: new Date().toISOString(), opened: false } as import("@/lib/types").Chest]
            : [];
        const mysteryBadge = mystery?.type === "badge" && mystery.badgeId ? mystery.badgeId : null;
        const mysteryPoints = mystery?.type === "points" && mystery.points ? mystery.points : 0;

        saveGamification({
          ...gam,
          chests: [...gam.chests, ...capNewChests(gam.chests, [...allNewChests, ...extraMysteryChest])],
          badges: mysteryBadge && !gam.badges.includes(mysteryBadge) ? [...gam.badges, mysteryBadge] : gam.badges,
          exercisesCompleted: newExercises,
          bossUnlocked: nowBossUnlocked,
          pointsMilestonesRewarded: [...gam.pointsMilestonesRewarded, ...pointChests.map((c) => c.milestone)],
          exerciseMilestonesRewarded: [...gam.exerciseMilestonesRewarded, ...exChests.map((c) => c.milestone)],
          achievementsRewarded: [...(gam.achievementsRewarded ?? []), ...achChests.map((c) => c.achievementId)],
        });

        if (mysteryPoints > 0) {
          const withMystery = { ...updated, totalPoints: updated.totalPoints + mysteryPoints };
          saveStudent(withMystery);
          setStudent(withMystery);
        }

        if (firstChest) setChestEarned(firstChest.type as ChestType);
        if (nowBossUnlocked && !wasBossUnlocked) setBossJustUnlocked(true);
        if (mystery) setMysteryBox(mystery);
      }
      setShowResult(true);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }

  function handleRetry() {
    setCurrentIndex(0);
    setResults([]);
    setShowResult(false);
    setPhase("intro");
  }

  function handleContinue() {
    if (mysteryBox) setShowResult(false);
    else router.push(`/world/${stageId}`);
  }

  function handleMysteryClose() {
    setMysteryBox(null);
    router.push(`/world/${stageId}`);
  }

  const totalCorrect = results.filter(Boolean).length;

  // ── Intro ──────────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="min-h-screen bg-amber-50 dark:bg-gray-900">
        <Header student={student} />
        <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
          <Link
            href={`/world/${stageId}`}
            className="inline-flex items-center gap-1.5 text-sv-600 dark:text-sv-400 hover:text-sv-800 text-sm font-medium transition-colors"
          >
            ← Tillbaka
          </Link>
          <div className="card text-center space-y-4">
            <div className="text-6xl">{mod.icon}</div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">{mod.title}</h1>
            <p className="text-gray-500 dark:text-gray-400">{mod.description}</p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-700">
              🔊 Talsyntes · Nivå {mod.level}
            </div>
            {mod.helpText && mod.helpText.length > 0 && (
              <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-700 rounded-2xl p-4 text-left space-y-2">
                {mod.helpText.map((tip, i) => (
                  <p key={i} className="text-sm text-sky-800 dark:text-sky-200">💡 {tip}</p>
                ))}
              </div>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {totalExercises} uppgifter · {POINTS_PER_CORRECT} poäng/rätt + {mod.bonusPoints} bonuspoäng
            </p>
          </div>
          <button
            onClick={() => setPhase("exercises")}
            className="w-full py-4 rounded-2xl font-black text-white text-lg transition-all active:scale-98"
            style={{ background: "linear-gradient(135deg, #0ea5e9, #0369a1)", boxShadow: "0 4px 0 0 #0369a1" }}
          >
            Börja övningen →
          </button>
        </main>
      </div>
    );
  }

  // ── Exercises ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-amber-50 dark:bg-gray-900">
      <Header student={student} />
      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Progress */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 font-medium mb-1.5">
            <span>{mod.title}</span>
            <span>{currentIndex + 1}/{totalExercises}</span>
          </div>
          <ProgressBar
            value={progress}
            colorClass="bg-gradient-to-r from-sky-400 to-sky-500"
          />
        </div>

        {/* Exercise card */}
        {!showResult && currentExercise && (
          <div className="card">
            <FonemExerciseComponent
              key={currentExercise.id}
              exercise={currentExercise}
              onAnswer={handleAnswer}
            />
          </div>
        )}

        {/* Result modal */}
        {showResult && (
          <ResultModal
            correct={totalCorrect}
            total={totalExercises}
            points={totalCorrect * POINTS_PER_CORRECT + (totalCorrect / totalExercises >= 0.6 ? mod!.bonusPoints : 0)}
            chestEarned={chestEarned}
            bossJustUnlocked={bossJustUnlocked}
            onRetry={handleRetry}
            onContinue={handleContinue}
          />
        )}

        {mysteryBox && (
          <MysteryBoxPopup reward={mysteryBox} onClose={handleMysteryClose} />
        )}
      </main>
    </div>
  );
}
