"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/ui/Header";
import WordSearch from "@/components/exercises/WordSearch";
import { loadStudent, saveModuleProgress, loadGamification, saveGamification } from "@/lib/storage";
import { chestsEarnedFromPoints, chestsEarnedFromExercises, chestsEarnedFromAchievements, rollMysteryBox, BOSS_UNLOCK_THRESHOLD } from "@/lib/gamification";
import { ACHIEVEMENTS, isUnlocked } from "@/lib/achievements";
import MysteryBoxPopup from "@/components/ui/MysteryBoxPopup";
import { BlurFade } from "@/components/magicui/blur-fade";
import { getStage } from "@/lib/stages";
import type { StudentData, StageContent, WordSearchModule, ChestType, MysteryBoxReward } from "@/lib/types";

const POINTS_PER_WORD = 5;

interface Props {
  params: Promise<{ stage: string; module: string }>;
}

export default function WordSearchModulePage({ params }: Props) {
  const { stage: stageId, module: moduleId } = use(params);
  const stage = getStage(stageId);
  const router = useRouter();

  const [student, setStudent] = useState<StudentData | null>(null);
  const [mod, setMod] = useState<WordSearchModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<"intro" | "playing" | "done">("intro");
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [chestEarned, setChestEarned] = useState<ChestType | undefined>();
  const [bossJustUnlocked, setBossJustUnlocked] = useState(false);
  const [mysteryBox, setMysteryBox] = useState<MysteryBoxReward | null>(null);

  useEffect(() => {
    const s = loadStudent();
    setStudent(s);
    fetch(`/content/${stageId}/content.json`)
      .then((r) => r.json())
      .then((data: StageContent) => {
        const found = (data.wordsearch ?? []).find((m) => m.id === moduleId);
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

  function handleAllFound(points: number) {
    const totalPoints = points + (mod?.bonusPoints ?? 0);
    setEarnedPoints(totalPoints);

    if (!student) { setPhase("done"); return; }

    const oldPoints = student.totalPoints;
    const updatedStudent = saveModuleProgress(student, stageId as any, "wordsearch", moduleId, totalPoints, true);
    setStudent(updatedStudent);

    const gam = loadGamification();
    const prevExercises = gam.exercisesCompleted;
    const newExercises = prevExercises + 1;

    const ptChests = chestsEarnedFromPoints(oldPoints, updatedStudent.totalPoints, gam.pointsMilestonesRewarded);
    const exChests = chestsEarnedFromExercises(prevExercises, newExercises, gam.exerciseMilestonesRewarded);
    const prevUnlocked = ACHIEVEMENTS.filter((a) => isUnlocked(a, student)).map((a) => a.id);
    const nowUnlocked = ACHIEVEMENTS.filter((a) => isUnlocked(a, updatedStudent)).map((a) => a.id);
    const achChests = chestsEarnedFromAchievements(prevUnlocked, nowUnlocked, gam.achievementsRewarded ?? []);
    const allNewChests = [...ptChests.map(c => c.chest), ...exChests.map(c => c.chest), ...achChests.map(c => c.chest)];
    const firstChest = allNewChests[0];

    const mystery = rollMysteryBox(gam.badges);
    const extraMysteryChest = mystery?.type === "chest" && mystery.chestType
      ? [{ id: `chest_m_${Date.now()}`, type: mystery.chestType, earnedAt: new Date().toISOString(), opened: false } as import("@/lib/types").Chest]
      : [];
    const mysteryPoints = mystery?.type === "points" && mystery.points ? mystery.points : 0;
    const mysteryBadge = mystery?.type === "badge" && mystery.badgeId ? mystery.badgeId : null;

    const bossNowUnlocked = !gam.bossUnlocked && newExercises >= BOSS_UNLOCK_THRESHOLD;
    if (firstChest) setChestEarned(firstChest.type as ChestType);
    if (bossNowUnlocked) setBossJustUnlocked(true);

    if (mysteryPoints > 0) setStudent({ ...updatedStudent, totalPoints: updatedStudent.totalPoints + mysteryPoints });

    saveGamification({
      ...gam,
      chests: [...gam.chests, ...allNewChests, ...extraMysteryChest],
      badges: mysteryBadge && !gam.badges.includes(mysteryBadge) ? [...gam.badges, mysteryBadge] : gam.badges,
      exercisesCompleted: newExercises,
      bossUnlocked: bossNowUnlocked || gam.bossUnlocked,
      pointsMilestonesRewarded: [...gam.pointsMilestonesRewarded, ...ptChests.map(c => c.milestone)],
      exerciseMilestonesRewarded: [...gam.exerciseMilestonesRewarded, ...exChests.map(c => c.milestone)],
      achievementsRewarded: [...(gam.achievementsRewarded ?? []), ...achChests.map(c => c.achievementId)],
    });
    if (mystery) setMysteryBox(mystery);
    setPhase("done");
  }

  return (
    <div className="min-h-screen bg-amber-50 dark:bg-gray-900">
      <Header student={student} />

      {/* Hero banner */}
      <div className={`${stage.bgClass} py-4`}>
        <div className="max-w-3xl mx-auto px-4 flex items-center gap-3">
          <Link href={`/world/${stageId}`} className="text-white/70 hover:text-white text-sm transition-colors bg-black/20 hover:bg-black/30 px-3 py-1.5 rounded-full">
            ← Tillbaka
          </Link>
          <span className="text-3xl">{mod.icon}</span>
          <div>
            <h1 className="text-lg font-black text-white">{mod.title}</h1>
            <p className="text-white/70 text-xs">{mod.description}</p>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {phase === "intro" && (
          <BlurFade>
            <div
              className="card text-center"
              style={{ boxShadow: "0 6px 0 0 rgba(249,115,22,0.1), 0 12px 24px -4px rgba(249,115,22,0.08)" }}
            >
              <div className="text-6xl mb-4 animate-bounce-slow">{mod.icon}</div>
              <h2 className="text-2xl font-black text-sv-900 dark:text-gray-100 mb-2">{mod.title}</h2>
              <p className="text-sv-400 dark:text-gray-400 mb-6 font-medium">{mod.description}</p>

              <div className="bg-sv-50 dark:bg-gray-700 rounded-2xl p-4 mb-6 text-left border-2 border-sv-100 dark:border-gray-600">
                <p className="font-bold text-sv-800 dark:text-gray-100 mb-2 flex items-center gap-1.5">🔍 Hur man spelar</p>
                <ul className="space-y-1.5 text-sm text-sv-600 dark:text-gray-300 font-medium">
                  <li>• Hitta alla <strong>{mod.words.length} ord</strong> i bokstavsrutnätet</li>
                  <li>• Klicka på <strong>första bokstaven</strong>, sedan på <strong>sista bokstaven</strong></li>
                  <li>• Orden kan gå åt höger, ner eller diagonalt</li>
                  <li>• <strong>{POINTS_PER_WORD} poäng</strong> per hittat ord + <strong>{mod.bonusPoints} bonuspoäng</strong> för alla!</li>
                </ul>
              </div>

              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {mod.words.map((w) => (
                  <div key={w.word} className="px-3 py-1.5 bg-white dark:bg-gray-700 border-2 border-sv-200 dark:border-gray-600 rounded-xl text-sm font-bold text-sv-700 dark:text-gray-200">
                    {w.word}
                  </div>
                ))}
              </div>

              <button
                onClick={() => setPhase("playing")}
                className="btn-primary text-xl py-4 px-8 border-3 border-sv-400 w-full"
                style={{ background: "linear-gradient(135deg, #f97316, #ea6c0a)" }}
              >
                Starta ordsökning! 🔍
              </button>
            </div>
          </BlurFade>
        )}

        {phase === "playing" && (
          <BlurFade>
            <div className="card overflow-x-auto">
              <WordSearch
                words={mod.words}
                onAllFound={handleAllFound}
                pointsPerWord={POINTS_PER_WORD}
              />
            </div>
          </BlurFade>
        )}

        {phase === "done" && (
          <BlurFade>
            <div
              className="card text-center"
              style={{ boxShadow: "0 8px 0 0 rgba(249,115,22,0.12), 0 16px 32px -8px rgba(249,115,22,0.15)" }}
            >
              <div className="text-7xl mb-4 animate-bounce-slow">🎉</div>
              <h2 className="text-3xl font-black text-sv-900 dark:text-gray-100 mb-2">Alla ord hittade!</h2>
              <p className="text-sv-400 dark:text-gray-400 mb-6 font-medium">Fantastiskt jobbat – du hittade alla {mod.words.length} ord!</p>

              <div
                className="bg-gradient-to-b from-amber-50 to-amber-100 dark:bg-amber-900/30 border-3 border-amber-300 dark:border-amber-700 rounded-2xl p-5 mb-4"
                style={{ boxShadow: "0 4px 0 0 rgba(245,158,11,0.25)" }}
              >
                <div className="flex items-center justify-center gap-3 text-amber-700 dark:text-amber-300">
                  <span className="text-3xl">⭐</span>
                  <div>
                    <span className="text-3xl font-black">{earnedPoints}</span>
                    <span className="text-lg ml-1 font-bold">poäng</span>
                  </div>
                </div>
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-1.5 font-semibold">
                  inkl. {mod.bonusPoints} bonuspoäng för att hitta alla ord!
                </p>
              </div>

              {chestEarned && (
                <div className="bg-amber-50 dark:bg-amber-900/30 border-2 border-amber-300 dark:border-amber-600 rounded-2xl p-3 mb-3 flex items-center gap-3 text-left">
                  <span className="text-3xl">{chestEarned === "gold" ? "🏆" : chestEarned === "silver" ? "🪙" : "📦"}</span>
                  <div>
                    <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Du fick en {chestEarned === "gold" ? "Guldlåda" : chestEarned === "silver" ? "Silverlåda" : "Trälåda"}!</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">Öppna den på Hemliga kistor-sidan.</p>
                  </div>
                </div>
              )}

              {bossJustUnlocked && (
                <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-600 rounded-2xl p-3 mb-3 flex items-center gap-3 text-left">
                  <span className="text-3xl">⚔️</span>
                  <div>
                    <p className="text-sm font-bold text-red-800 dark:text-red-300">Boss Challenge upplåst!</p>
                    <p className="text-xs text-red-600 dark:text-red-400">Gå till Hemliga kistor för att utmana bossen.</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <Link
                  href={`/world/${stageId}`}
                  className="flex-1 btn-secondary text-center border-3 border-sv-200 font-bold py-3 rounded-2xl"
                >
                  ← Tillbaka
                </Link>
                <button
                  onClick={() => { setPhase("playing"); setEarnedPoints(0); setChestEarned(undefined); setBossJustUnlocked(false); }}
                  className="flex-1 btn-primary border-3 border-sv-400"
                  style={{ background: "linear-gradient(135deg, #f97316, #ea6c0a)" }}
                >
                  Spela igen 🔄
                </button>
              </div>
            </div>
          </BlurFade>
        )}
      </main>

      {mysteryBox && (
        <MysteryBoxPopup
          reward={mysteryBox}
          onClose={() => setMysteryBox(null)}
        />
      )}
    </div>
  );
}
