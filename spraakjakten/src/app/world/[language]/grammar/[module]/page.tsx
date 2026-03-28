"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import Header from "@/components/ui/Header";
import MultipleChoice from "@/components/exercises/MultipleChoice";
import FillInBlank from "@/components/exercises/FillInBlank";
import { loadStudent, saveModuleProgress, loadGamification, saveGamification } from "@/lib/storage";
import { getLanguage } from "@/lib/languages";
import { checkAndAwardChests, rollMysteryBox } from "@/lib/gamification";
import type { StudentData, LanguageContent, Exercise } from "@/lib/types";

interface Props {
  params: Promise<{ language: string; module: string }>;
}

type Phase = "intro" | "exercise" | "result";

export default function GrammarModulePage({ params }: Props) {
  const { language: langId, module: moduleId } = use(params);
  const lang = getLanguage(langId);
  const router = useRouter();

  const [student, setStudent] = useState<StudentData | null>(null);
  const [moduleData, setModuleData] = useState<{ title: string; description: string; icon: string; bonusPoints: number; exercises: Exercise[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>("intro");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [newChestCount, setNewChestCount] = useState(0);
  const [mysteryReward, setMysteryReward] = useState<string | null>(null);

  useEffect(() => {
    const s = loadStudent();
    setStudent(s);
    fetch(`/content/${langId}/content.json`)
      .then((r) => r.json())
      .then((data: LanguageContent) => {
        const mod = data.grammar?.find((m) => m.id === moduleId);
        if (mod) setModuleData(mod);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [langId, moduleId]);

  if (!lang) return notFound();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-4xl animate-bounce-slow">{lang.flag}</div></div>;
  if (!moduleData) return notFound();

  const exercises = moduleData.exercises ?? [];
  const currentExercise = exercises[currentIdx];
  const POINTS_PER_CORRECT = 10;

  function handleAnswer(correct: boolean) {
    const newCorrect = correctCount + (correct ? 1 : 0);
    if (currentIdx + 1 < exercises.length) {
      setCorrectCount(newCorrect);
      setCurrentIdx((prev) => prev + 1);
    } else {
      finishModule(newCorrect);
    }
  }

  function finishModule(finalCorrect: number) {
    const pts = finalCorrect * POINTS_PER_CORRECT + (finalCorrect === exercises.length ? moduleData!.bonusPoints : 0);
    if (!student) { setPhase("result"); setCorrectCount(finalCorrect); return; }

    const updatedStudent = saveModuleProgress(student, lang!.id, "grammar", moduleId, pts, finalCorrect >= Math.ceil(exercises.length * 0.6));
    setStudent(updatedStudent);

    let gam = loadGamification();
    gam.exercisesCompleted += exercises.length;
    const { newChests, updatedGam } = checkAndAwardChests(updatedStudent.totalPoints, gam.exercisesCompleted, gam);
    const { reward, updatedGam: gam2 } = rollMysteryBox(updatedGam);
    saveGamification(gam2);

    setNewChestCount(newChests.length);
    if (reward) setMysteryReward(reward.description);
    setCorrectCount(finalCorrect);
    setPhase("result");
  }

  return (
    <div className="min-h-screen bg-sky-50 dark:bg-gray-900">
      <Header student={student} />

      <main className="max-w-2xl mx-auto px-4 py-6">
        <button onClick={() => router.push(`/world/${langId}`)} className="inline-flex items-center gap-1.5 text-sj-600 hover:text-sj-700 text-sm font-bold mb-4">
          ← Tillbaka
        </button>

        {phase === "intro" && (
          <div className="card text-center">
            <div className="text-6xl mb-4">{moduleData.icon}</div>
            <h1 className="text-2xl font-black text-gray-800 dark:text-gray-100 mb-2">{moduleData.title}</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">{moduleData.description}</p>
            <div className="flex items-center justify-center gap-4 mb-6 text-sm">
              <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full font-bold">{exercises.length} frågor</span>
              <span className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full font-bold">+{moduleData.bonusPoints} bonuspoäng</span>
            </div>
            <button
              onClick={() => setPhase("exercise")}
              className="btn-primary w-full"
              style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
            >
              Börja övningen! 📝
            </button>
          </div>
        )}

        {phase === "exercise" && currentExercise && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-gray-500">{moduleData.title}</span>
              <span className="text-sm font-bold text-sj-600">{currentIdx + 1}/{exercises.length}</span>
            </div>
            <div className="progress-bar-track mb-6">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${((currentIdx) / exercises.length) * 100}%`,
                  background: "linear-gradient(90deg, #22c55e, #16a34a)"
                }}
              />
            </div>

            {currentExercise.type === "multiple-choice" && (
              <MultipleChoice exercise={currentExercise} onAnswer={handleAnswer} isLast={currentIdx + 1 === exercises.length} />
            )}
            {currentExercise.type === "fill-in-blank" && (
              <FillInBlank exercise={currentExercise} onAnswer={handleAnswer} isLast={currentIdx + 1 === exercises.length} />
            )}
          </div>
        )}

        {phase === "result" && (
          <div className="card text-center">
            <div className="text-6xl mb-4">
              {correctCount >= Math.ceil(exercises.length * 0.8) ? "🏆" : correctCount >= Math.ceil(exercises.length * 0.5) ? "⭐" : "💪"}
            </div>
            <h2 className="text-2xl font-black text-gray-800 dark:text-gray-100 mb-2">
              {correctCount >= Math.ceil(exercises.length * 0.8) ? "Fantastiskt!" : correctCount >= Math.ceil(exercises.length * 0.5) ? "Bra jobbat!" : "Fortsätt öva!"}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Du fick <strong>{correctCount}</strong> av <strong>{exercises.length}</strong> rätt
            </p>

            {student && (
              <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-xl p-3 mb-4">
                <p className="text-amber-700 dark:text-amber-300 font-bold text-sm">
                  ⭐ {correctCount * POINTS_PER_CORRECT + (correctCount === exercises.length ? moduleData.bonusPoints : 0)} poäng intjänade!
                </p>
              </div>
            )}

            {newChestCount > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4 animate-pop">
                <p className="text-yellow-700 font-bold text-sm">🏆 {newChestCount} ny kista!</p>
              </div>
            )}

            {mysteryReward && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 mb-4 animate-pop">
                <p className="text-purple-700 font-bold text-sm">✨ Mysterielåda: {mysteryReward}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <button
                onClick={() => { setPhase("intro"); setCurrentIdx(0); setCorrectCount(0); setNewChestCount(0); setMysteryReward(null); }}
                className="btn-secondary flex-1 border-sj-200 text-sj-600"
              >
                Försök igen
              </button>
              <button
                onClick={() => router.push(`/world/${langId}`)}
                className="btn-primary flex-1"
                style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
              >
                Tillbaka →
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
