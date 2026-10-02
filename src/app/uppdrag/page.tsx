"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Header from "@/components/ui/Header";
import MultipleChoice from "@/components/exercises/MultipleChoice";
import FillInBlank from "@/components/exercises/FillInBlank";
import BuildSentence from "@/components/exercises/BuildSentence";
import WordClues from "@/components/exercises/WordClues";
import ListenSpell from "@/components/exercises/ListenSpell";
import SaveWarning from "@/components/ui/SaveWarning";
import { loadStudent } from "@/lib/storage";
import { loadStageContent } from "@/lib/content";
import { getStage } from "@/lib/stages";
import {
  getTodaysMission,
  acceptMission,
  recordMissionAnswer,
  completeMission,
  markMissionShown,
  settleAbandonedExercise,
  resolveExercise,
  MISSION_POINTS_PER_CORRECT,
  type SecretMission,
} from "@/lib/secretMission";
import { CHEST_LABELS } from "@/components/ui/ResultModal";
import type { StageContent, StudentData, GrammarExercise } from "@/lib/types";

/**
 * The secret mission itself: five mixed exercises from chapters the pupil has
 * passed in the world, worth double points. There is no "Försök igen" — an
 * accepted mission picks up where it was left after a reload and pays once.
 */
export default function MissionPage() {
  const [student, setStudent] = useState<StudentData | null>(null);
  const [mission, setMission] = useState<SecretMission | null>(null);
  const [content, setContent] = useState<StageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const finishing = useRef(false);

  // Record which exercise is on screen, so a reload cannot show it again.
  const shownIndex = mission?.status === "accepted" ? mission.answers?.length ?? 0 : -1;
  useEffect(() => {
    if (shownIndex >= 0) markMissionShown(shownIndex);
  }, [shownIndex]);

  useEffect(() => {
    setStudent(loadStudent());
    const m = getTodaysMission();
    if (!m || m.status === "declined") {
      setLoading(false);
      return;
    }
    loadStageContent(m.stageId)
      .then((c) => {
        setContent(c);
        // An offer becomes a mission when the page opens: the five exercises
        // are chosen and stored now, so a reload shows the same ones.
        if (m.status === "offered") {
          setMission(acceptMission(c));
        } else {
          // Coming back mid-mission: a question left unanswered counts as
          // wrong, and if that was the last one the mission is finished.
          const settled = settleAbandonedExercise();
          const full = settled?.exercises && (settled.answers?.length ?? 0) >= settled.exercises.length;
          setMission(full && settled?.status === "accepted" ? completeMission() ?? settled : settled);
        }
      })
      .catch(() => setMission(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-bounce-slow">🕵️</div>
      </div>
    );
  }

  const stage = mission ? getStage(mission.stageId) : undefined;
  const backHref = stage ? `/world/${stage.id}` : "/";

  if (!mission || !content || !mission.exercises) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header student={student} />
        <main className="max-w-xl mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">🕵️</div>
          <h1 className="text-2xl font-black text-sv-900 dark:text-gray-100">Inget hemligt uppdrag just nu</h1>
          <p className="mt-2 text-sv-800 dark:text-gray-300">
            Hemliga uppdrag dyker upp ibland, när du minst anar det. Fortsätt jaga!
          </p>
          <Link prefetch={false} href="/" className="inline-block mt-6 btn-primary" style={{ background: "linear-gradient(135deg, #f97316, #ea6c0a)" }}>
            Till startsidan
          </Link>
        </main>
      </div>
    );
  }

  const total = mission.exercises.length;
  const answered = mission.answers?.length ?? 0;
  const correctSoFar = (mission.answers ?? []).filter(Boolean).length;
  const done = mission.status === "done";

  function handleAnswer(correct: boolean) {
    const updated = recordMissionAnswer(correct);
    if (!updated) return;
    if ((updated.answers?.length ?? 0) >= (updated.exercises?.length ?? 0)) {
      if (finishing.current) return;
      finishing.current = true;
      const finished = completeMission();
      setMission(finished ?? updated);
      setStudent(loadStudent());
    } else {
      setMission(updated);
    }
  }

  const current: GrammarExercise | undefined = !done ? resolveExercise(content, mission.exercises[answered]) : undefined;
  const isLast = answered + 1 === total;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header student={student} />

      <div style={{ background: "linear-gradient(135deg, #1e1b4b, #4c1d95 55%, #7c2d12)" }}>
        <div className="max-w-3xl mx-auto px-4 py-6 text-white">
          <p className="text-xs font-black uppercase tracking-widest text-amber-300">🕵️ Hemligt uppdrag</p>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">Dubbla poäng – {MISSION_POINTS_PER_CORRECT} per rätt svar</h1>
          <p className="text-amber-100/90 text-sm mt-1">
            {total} blandade uppgifter från kapitel du redan klarat{stage ? ` i ${stage.name}` : ""}.
          </p>
          {!done && (
            <div className="mt-4 h-3 rounded-full bg-white/15 overflow-hidden" aria-hidden="true">
              <div className="h-full rounded-full bg-amber-300 transition-all" style={{ width: `${(answered / total) * 100}%` }} />
            </div>
          )}
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <SaveWarning />
        {!done && current && (
          <div className="card">
            <p className="text-sm font-bold text-sv-700 dark:text-gray-400 mb-3">Uppgift {answered + 1} av {total}</p>
            <div key={answered}>
              {current.type === "multiple-choice" && <MultipleChoice exercise={current} onAnswer={handleAnswer} isLast={isLast} />}
              {current.type === "fill-in-blank" && <FillInBlank exercise={current} onAnswer={handleAnswer} isLast={isLast} />}
              {current.type === "build-sentence" && <BuildSentence exercise={current} onAnswer={handleAnswer} isLast={isLast} />}
              {current.type === "word-clues" && <WordClues exercise={current} onAnswer={handleAnswer} isLast={isLast} />}
              {current.type === "listen-spell" && <ListenSpell exercise={current} onAnswer={handleAnswer} isLast={isLast} />}
            </div>
            <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-300">
              ✓ {correctSoFar} rätt · ⭐ {correctSoFar * MISSION_POINTS_PER_CORRECT} poäng
            </p>
          </div>
        )}

        {!done && !current && (
          // Content changed since the mission was dealt: count it as answered so the mission can finish.
          <div className="card text-center">
            <p className="text-sv-800 dark:text-gray-300">Den här uppgiften finns inte längre.</p>
            <button className="mt-4 btn-primary" onClick={() => handleAnswer(false)} style={{ background: "linear-gradient(135deg, #006AA7, #004a75)" }}>
              Hoppa över
            </button>
          </div>
        )}

        {done && (
          <div className="card text-center animate-pop">
            <div className="text-6xl mb-2">{correctSoFar === total ? "🏆" : "🕵️"}</div>
            <h2 className="text-2xl font-black text-sv-900 dark:text-gray-100">
              {correctSoFar === total ? "Uppdraget slutfört – alla rätt!" : "Uppdraget slutfört!"}
            </h2>
            <p className="mt-2 text-lg font-bold text-sv-800 dark:text-gray-200">
              {correctSoFar} av {total} rätt
            </p>
            <div className="mt-4 inline-flex flex-col items-center gap-1 rounded-2xl border-3 border-amber-300 bg-amber-50 dark:bg-amber-900/30 px-6 py-3">
              <span className="text-2xl font-black text-amber-700 dark:text-amber-300">⭐ +{mission.pointsAwarded ?? 0} poäng</span>
              <span className="text-xs font-bold text-amber-700/80 dark:text-amber-300/80">dubbla poäng</span>
            </div>
            {mission.chestAwarded && (
              <p className="mt-3 font-bold text-sv-800 dark:text-gray-200">
                🎁 Du fick en {CHEST_LABELS[mission.chestAwarded]}! Öppna den under 🏆.
              </p>
            )}
            <p className="mt-3 text-sm text-sv-700 dark:text-gray-400">
              Nästa hemliga uppdrag dyker upp en annan dag. Håll utkik!
            </p>
            <Link prefetch={false} href={backHref} className="inline-block mt-5 btn-primary" style={{ background: "linear-gradient(135deg, #f97316, #ea6c0a)" }}>
              Fortsätt jaga →
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
