"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/ui/Header";
import WordSearch from "@/components/exercises/WordSearch";
import { loadStudent, recordLastVisited } from "@/lib/storage";
import { finishChapter } from "@/lib/chapter";
import { rollSurpriseMultiplier, getPointsMultiplier } from "@/lib/gamification";
import { CHEST_LABELS, CHEST_IMAGES, BOSS_UNLOCKED_TEXT } from "@/components/ui/ResultModal";
import SaveWarning from "@/components/ui/SaveWarning";
import MysteryBoxPopup from "@/components/ui/MysteryBoxPopup";
import { BlurFade } from "@/components/magicui/blur-fade";
import { getStage } from "@/lib/stages";
import { loadStageContent } from "@/lib/content";
import { getThemeClassName, getThemeWrapperClass } from "@/lib/shop";
import ThemeBackdrop from "@/components/ui/ThemeBackdrop";
import type { StudentData, StageContent, WordSearchModule, ChestType, MysteryBoxReward } from "@/lib/types";

const POINTS_PER_WORD = 10;

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
  const [prevAttemptCount, setPrevAttemptCount] = useState(0);
  const [surpriseMult, setSurpriseMult] = useState(1);
  // One payout per round, however many times the grid reports "all found".
  const finishedRef = useRef(false);

  useEffect(() => {
    const s = loadStudent();
    setStudent(s);
    loadStageContent(stageId)
      .then((data: StageContent) => {
        const found = (data.wordsearch ?? []).find((m) => m.id === moduleId);
        if (found) {
          setMod(found);
          recordLastVisited({ stageId: stage!.id, kind: "wordsearch", moduleId, title: found.title, icon: found.icon ?? "🔍" });
        }
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
    if (finishedRef.current) return;
    finishedRef.current = true;
    const totalPoints = points + (mod?.bonusPoints ?? 0);
    setEarnedPoints(totalPoints);
    const surprise = rollSurpriseMultiplier();
    setSurpriseMult(surprise);

    if (!student) { setPhase("done"); return; }

    // Saving, chests, the boss gate and the mystery box all live in
    // finishChapter so the four chapter kinds pay out by the same rules.
    // Finding every word is the only way to finish, so it always passes.
    const outcome = finishChapter({
      stageId: stage!.id,
      kind: "wordsearch",
      moduleId,
      points: totalPoints * surprise,
      passed: true,
    });
    setPrevAttemptCount(outcome.prevAttempts);
    if (outcome.student) setStudent(outcome.student);
    setChestEarned(outcome.chestEarned);
    setBossJustUnlocked(outcome.bossOpenedNow);
    setMysteryBox(outcome.mystery);
    setPhase("done");
  }

  return (
    <div className={`min-h-screen ${getThemeClassName(student?.equippedTheme)} ${getThemeWrapperClass(student?.equippedTheme)}`}>
      <ThemeBackdrop themeId={student?.equippedTheme} />
      <Header student={student} />

      {/* Hero banner */}
      <div className={`${stage.bgClass} py-4`}>
        <div className="max-w-3xl mx-auto px-4 flex items-center gap-3">
          <Link prefetch={false} href={`/world/${stageId}`} className="text-white/70 hover:text-white text-sm transition-colors bg-black/20 hover:bg-black/30 px-3 py-1.5 rounded-full">
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
              <p className="text-sv-800 dark:text-gray-300 mb-6 font-medium">{mod.description}</p>

              <div className="bg-sv-50 dark:bg-gray-700 rounded-2xl p-4 mb-6 text-left border-2 border-sv-100 dark:border-gray-600">
                <p className="font-bold text-sv-800 dark:text-gray-100 mb-2 flex items-center gap-1.5">🔍 Hur man spelar</p>
                <ul className="space-y-1.5 text-sm text-sv-800 dark:text-gray-300 font-medium">
                  <li>• Hitta alla <strong>{mod.words.length} ord</strong> i bokstavsrutnätet</li>
                  <li>• Klicka på <strong>första bokstaven</strong>, sedan på <strong>sista bokstaven</strong></li>
                  <li>• Orden kan gå åt höger, ner eller diagonalt</li>
                  <li>• <strong>{POINTS_PER_WORD} poäng</strong> per hittat ord + <strong>{mod.bonusPoints} bonuspoäng</strong> för alla!</li>
                </ul>
              </div>

              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {mod.words.map((w) => (
                  <div key={w.word} className="px-3 py-1.5 bg-white dark:bg-gray-700 border-2 border-sv-200 dark:border-gray-600 rounded-xl text-sm font-bold text-sv-800 dark:text-gray-200">
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
              <p className="text-sv-800 dark:text-gray-300 mb-6 font-medium">Fantastiskt jobbat – du hittade alla {mod.words.length} ord!</p>

              {prevAttemptCount > 0 && (() => {
                const m = getPointsMultiplier(prevAttemptCount);
                return (
                  <div className="bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-2xl p-3 mb-4 text-left">
                    <p className="text-sm font-bold text-blue-800 dark:text-blue-300">
                      ℹ️ Du har gjort denna övning förut – du får {Math.round(m * 100)}% av poängen.
                    </p>
                  </div>
                );
              })()}

              {surpriseMult > 1 && (
                <div
                  className={`rounded-2xl p-4 mb-4 border-3 animate-pop ${
                    surpriseMult === 3
                      ? "bg-gradient-to-r from-fuchsia-100 to-purple-100 dark:from-fuchsia-900/40 dark:to-purple-900/40 border-fuchsia-400 dark:border-fuchsia-600"
                      : "bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 border-emerald-400 dark:border-emerald-600"
                  }`}
                  style={{ boxShadow: surpriseMult === 3 ? "0 4px 0 0 rgba(192,38,211,0.3)" : "0 4px 0 0 rgba(16,185,129,0.3)" }}
                >
                  <p className={`text-xl font-black ${surpriseMult === 3 ? "text-fuchsia-700 dark:text-fuchsia-300" : "text-emerald-700 dark:text-emerald-300"}`}>
                    {surpriseMult === 3 ? "💥 JACKPOTT! TRIPPLA POÄNG! ×3" : "🍀 TUR! DUBBLA POÄNG! ×2"}
                  </p>
                  <p className={`text-sm font-bold mt-1 ${surpriseMult === 3 ? "text-fuchsia-600 dark:text-fuchsia-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                    En sällsynt överraskning – dina poäng multipliceras!
                  </p>
                </div>
              )}

              <div
                className="bg-gradient-to-b from-amber-50 to-amber-100 dark:bg-amber-900/30 border-3 border-amber-300 dark:border-amber-700 rounded-2xl p-5 mb-4"
                style={{ boxShadow: "0 4px 0 0 rgba(245,158,11,0.25)" }}
              >
                <div className="flex items-center justify-center gap-3 text-amber-700 dark:text-amber-300">
                  <span className="text-3xl">⭐</span>
                  <div>
                    <span className="text-3xl font-black">{Math.round(earnedPoints * surpriseMult * getPointsMultiplier(prevAttemptCount))}</span>
                    <span className="text-lg ml-1 font-bold">poäng</span>
                  </div>
                </div>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1.5 font-semibold">
                  inkl. {Math.round(mod.bonusPoints * surpriseMult * getPointsMultiplier(prevAttemptCount))} bonuspoäng för att hitta alla ord!
                </p>
              </div>

              <SaveWarning />

              {chestEarned && (
                <div className="bg-amber-50 dark:bg-amber-900/30 border-2 border-amber-300 dark:border-amber-600 rounded-2xl p-3 mb-3 flex items-center gap-3 text-left">
                  <img src={CHEST_IMAGES[chestEarned]} alt={CHEST_LABELS[chestEarned]} className="w-10 h-10 object-contain" />
                  <div>
                    <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Du fick en {CHEST_LABELS[chestEarned]}!</p>
                    <p className="text-xs text-amber-700 dark:text-amber-400">Öppna den på Hemliga kistor-sidan.</p>
                  </div>
                </div>
              )}

              {bossJustUnlocked && (
                <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-600 rounded-2xl p-3 mb-3 flex items-center gap-3 text-left">
                  <span className="text-3xl">⚔️</span>
                  <div>
                    <p className="text-sm font-bold text-red-800 dark:text-red-300">Bossen är upplåst!</p>
                    <p className="text-xs text-red-600 dark:text-red-400">{BOSS_UNLOCKED_TEXT}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <Link prefetch={false}
                  href={`/world/${stageId}`}
                  className="flex-1 btn-secondary text-center border-3 border-sv-200 font-bold py-3 rounded-2xl"
                >
                  ← Tillbaka
                </Link>
                <button
                  onClick={() => {
                    // Clear everything from the round just finished, the
                    // mystery box included, before the next one starts.
                    finishedRef.current = false;
                    setPhase("playing");
                    setEarnedPoints(0);
                    setChestEarned(undefined);
                    setBossJustUnlocked(false);
                    setMysteryBox(null);
                    setSurpriseMult(1);
                    setPrevAttemptCount(0);
                  }}
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
