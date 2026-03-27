"use client";

import { useState, useEffect, useCallback, useRef, use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/ui/Header";
import { loadStudent } from "@/lib/storage";
import { getStage } from "@/lib/stages";
import type { StudentData } from "@/lib/types";

// ── Frågor per språk ─────────────────────────────────────────────────────

const QUESTIONS: Record<string, { q: string; options: string[]; correct: number }[]> = {
  franska: [
    { q: "Vad betyder 'bonjour'?", options: ["Hejdå", "Hej / God dag", "Tack", "Snälla"], correct: 1 },
    { q: "Vad betyder 'merci'?", options: ["Hej", "Snälla", "Tack", "Hejdå"], correct: 2 },
    { q: "Vad betyder 'le chat'?", options: ["Hunden", "Hästen", "Fisken", "Katten"], correct: 3 },
    { q: "Vad betyder 'manger'?", options: ["Dricka", "Äta", "Springa", "Sova"], correct: 1 },
    { q: "Hur säger man 'huset' på franska?", options: ["le jardin", "la maison", "l'école", "le chat"], correct: 1 },
    { q: "Vad betyder 'rouge'?", options: ["Blå", "Grön", "Gul", "Röd"], correct: 3 },
    { q: "Hur säger man 'skolan' på franska?", options: ["la maison", "le livre", "l'école", "le jardin"], correct: 2 },
    { q: "Vad betyder 'boire'?", options: ["Äta", "Dricka", "Läsa", "Skriva"], correct: 1 },
    { q: "Vad betyder 'le livre'?", options: ["Boken", "Skolan", "Huset", "Vännen"], correct: 0 },
    { q: "Hur säger man 'ja' på franska?", options: ["non", "merci", "oui", "bonjour"], correct: 2 },
    { q: "Vad betyder 'parler'?", options: ["Lyssna", "Prata", "Skriva", "Läsa"], correct: 1 },
    { q: "Vad betyder 'au revoir'?", options: ["Hej", "Tack", "Snälla", "Hejdå"], correct: 3 },
    { q: "Vad betyder 'la fleur'?", options: ["Trädet", "Blomman", "Solen", "Månen"], correct: 1 },
    { q: "Hur säger man 'blå' på franska?", options: ["rouge", "vert", "bleu", "noir"], correct: 2 },
    { q: "Vad betyder 'écrire'?", options: ["Läsa", "Prata", "Äta", "Skriva"], correct: 3 },
  ],
  spanska: [
    { q: "Vad betyder 'hola'?", options: ["Hejdå", "Tack", "Hej", "Snälla"], correct: 2 },
    { q: "Vad betyder 'gracias'?", options: ["Hej", "Tack", "Hejdå", "Ursäkta"], correct: 1 },
    { q: "Vad betyder 'el gato'?", options: ["Hunden", "Katten", "Fisken", "Fågeln"], correct: 1 },
    { q: "Vad betyder 'comer'?", options: ["Dricka", "Springa", "Äta", "Sova"], correct: 2 },
    { q: "Hur säger man 'huset' på spanska?", options: ["el libro", "la casa", "la escuela", "el perro"], correct: 1 },
    { q: "Vad betyder 'rojo'?", options: ["Blå", "Röd", "Grön", "Gul"], correct: 1 },
    { q: "Hur säger man 'skolan' på spanska?", options: ["la casa", "la escuela", "el libro", "la playa"], correct: 1 },
    { q: "Vad betyder 'beber'?", options: ["Äta", "Dricka", "Läsa", "Skriva"], correct: 1 },
    { q: "Vad betyder 'el libro'?", options: ["Boken", "Huset", "Skolan", "Stranden"], correct: 0 },
    { q: "Hur säger man 'ja' på spanska?", options: ["no", "gracias", "sí", "hola"], correct: 2 },
    { q: "Vad betyder 'hablar'?", options: ["Lyssna", "Skriva", "Prata", "Läsa"], correct: 2 },
    { q: "Vad betyder 'adiós'?", options: ["Hej", "Tack", "Hejdå", "Snälla"], correct: 2 },
    { q: "Vad betyder 'la playa'?", options: ["Berget", "Skogen", "Stranden", "Staden"], correct: 2 },
    { q: "Hur säger man 'blå' på spanska?", options: ["rojo", "verde", "azul", "negro"], correct: 2 },
    { q: "Vad betyder 'escribir'?", options: ["Läsa", "Prata", "Äta", "Skriva"], correct: 3 },
  ],
  tyska: [
    { q: "Vad betyder 'hallo'?", options: ["Hejdå", "Hej", "Tack", "Snälla"], correct: 1 },
    { q: "Vad betyder 'danke'?", options: ["Hej", "Hejdå", "Tack", "Ursäkta"], correct: 2 },
    { q: "Vad betyder 'die Katze'?", options: ["Hunden", "Hästen", "Katten", "Fågeln"], correct: 2 },
    { q: "Vad betyder 'essen'?", options: ["Dricka", "Äta", "Springa", "Sova"], correct: 1 },
    { q: "Hur säger man 'huset' på tyska?", options: ["die Schule", "das Haus", "das Buch", "der Hund"], correct: 1 },
    { q: "Vad betyder 'rot'?", options: ["Blå", "Grön", "Röd", "Gul"], correct: 2 },
    { q: "Hur säger man 'skolan' på tyska?", options: ["das Haus", "die Schule", "das Buch", "der Garten"], correct: 1 },
    { q: "Vad betyder 'trinken'?", options: ["Äta", "Dricka", "Läsa", "Skriva"], correct: 1 },
    { q: "Vad betyder 'das Buch'?", options: ["Boken", "Huset", "Skolan", "Trädgården"], correct: 0 },
    { q: "Hur säger man 'ja' på tyska?", options: ["nein", "danke", "ja", "hallo"], correct: 2 },
    { q: "Vad betyder 'sprechen'?", options: ["Lyssna", "Prata", "Skriva", "Läsa"], correct: 1 },
    { q: "Vad betyder 'tschüss'?", options: ["Hej", "Tack", "Snälla", "Hejdå"], correct: 3 },
    { q: "Vad betyder 'der Garten'?", options: ["Huset", "Trädgården", "Skolan", "Staden"], correct: 1 },
    { q: "Hur säger man 'blå' på tyska?", options: ["rot", "grün", "blau", "schwarz"], correct: 2 },
    { q: "Vad betyder 'schreiben'?", options: ["Läsa", "Prata", "Äta", "Skriva"], correct: 3 },
  ],
};

const GAME_DURATION = 60;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Props {
  params: Promise<{ stage: string }>;
}

export default function TidsattackPage({ params }: Props) {
  const { stage: stageId } = use(params);
  const stage = getStage(stageId);
  const [student, setStudent] = useState<StudentData | null>(null);
  useEffect(() => { setStudent(loadStudent()); }, []);
  if (!stage) return notFound();
  return <TidsattackGame stageId={stageId} stage={stage} student={student} />;
}

function TidsattackGame({ stageId, stage, student }: {
  stageId: string;
  stage: ReturnType<typeof getStage> & object;
  student: StudentData | null;
}) {
  const [phase, setPhase] = useState<"ready" | "playing" | "done">("ready");
  const [questions] = useState(() => shuffle(QUESTIONS[stageId] ?? QUESTIONS.franska));
  const [qIndex, setQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [flash, setFlash] = useState<"correct" | "wrong" | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentQ = questions[qIndex % questions.length];

  const endGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("done");
  }, []);

  useEffect(() => {
    if (phase === "playing") {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { endGame(); return 0; }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, endGame]);

  const answer = useCallback((idx: number) => {
    if (phase !== "playing") return;
    const isCorrect = idx === currentQ.correct;
    setFlash(isCorrect ? "correct" : "wrong");
    if (isCorrect) {
      setScore(s => s + 10);
      setCorrect(c => c + 1);
    } else {
      setWrong(w => w + 1);
    }
    setTimeout(() => {
      setFlash(null);
      setQIndex(i => i + 1);
    }, 400);
  }, [phase, currentQ]);

  const start = () => {
    setPhase("playing");
    setQIndex(0);
    setTimeLeft(GAME_DURATION);
    setScore(0);
    setCorrect(0);
    setWrong(0);
    setFlash(null);
  };

  const timerPct = (timeLeft / GAME_DURATION) * 100;
  const timerColor = timeLeft > 20 ? stage!.colorClass : timeLeft > 10 ? "bg-amber-500" : "bg-red-500";

  if (phase === "ready") {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
        <Header student={student} />
        <div className="flex-1 max-w-md mx-auto w-full px-4 py-8 pt-24 flex flex-col items-center justify-center text-center">
          <Link href={`/world/${stageId}`} className="self-start text-gray-500 dark:text-gray-400 hover:text-gray-700 text-sm font-semibold mb-8">
            ← Tillbaka till Spel
          </Link>
          <div className="text-7xl mb-4">⏱️</div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 mb-2">Tidsattack!</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-2">60 sekunder – svara på så många frågor du hinner!</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mb-8">Rätt svar = 10 poäng. Snabba reflexer lönar sig!</p>
          <button
            onClick={start}
            className={`w-full max-w-xs py-4 rounded-2xl font-black text-white text-xl cursor-pointer ${stage!.colorClass}`}
            style={{ boxShadow: "0 5px 0 0 rgba(0,0,0,0.2)" }}
          >
            Starta! 🚀
          </button>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    const accuracy = correct + wrong > 0 ? Math.round((correct / (correct + wrong)) * 100) : 0;
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
        <Header student={student} />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-sm w-full text-center">
            <div className="text-6xl mb-3">
              {accuracy >= 80 ? "🏆" : accuracy >= 50 ? "🎯" : "💪"}
            </div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 mb-1">Tid ute!</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Bra jobbat!</p>
            <div className={`border-3 ${stage!.borderClass} rounded-2xl p-5 mb-6 grid grid-cols-3 gap-3 text-center`}
              style={{ boxShadow: "0 4px 0 0 rgba(0,0,0,0.08)" }}>
              <div>
                <p className={`text-2xl font-black ${stage!.textClass}`}>{score}</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs">Poäng</p>
              </div>
              <div>
                <p className="text-2xl font-black text-green-600">✓ {correct}</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs">Rätt</p>
              </div>
              <div>
                <p className="text-2xl font-black text-red-500">✗ {wrong}</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs">Fel</p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={start}
                className={`w-full py-3 rounded-2xl font-black text-white text-lg cursor-pointer ${stage!.colorClass}`}
                style={{ boxShadow: "0 4px 0 0 rgba(0,0,0,0.2)" }}
              >
                Spela igen ⏱️
              </button>
              <Link
                href={`/world/${stageId}`}
                className="w-full py-3 rounded-2xl font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition text-center block"
              >
                ← Tillbaka till Spel
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col bg-white dark:bg-gray-900 transition-colors duration-150 ${
      flash === "correct" ? "bg-green-50 dark:bg-green-950" : flash === "wrong" ? "bg-red-50 dark:bg-red-950" : ""
    }`}>
      <Header student={student} />
      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-4 pt-20">
        {/* HUD */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={endGame} className="text-gray-400 hover:text-gray-600 text-sm font-semibold cursor-pointer">
            ← Avsluta
          </button>
          <div className="flex items-center gap-3">
            <span className="text-green-600 dark:text-green-400 font-bold text-sm">✓ {correct}</span>
            <span className="text-red-500 font-bold text-sm">✗ {wrong}</span>
            <span className={`font-black text-sm ${stage!.textClass}`}>⭐ {score}p</span>
          </div>
        </div>

        {/* Timer */}
        <div className="mb-1 flex items-center justify-between">
          <span className={`text-xs font-bold ${timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-gray-500 dark:text-gray-400"}`}>
            ⏱ {timeLeft}s
          </span>
        </div>
        <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full mb-6 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${timerColor}`}
            style={{ width: `${timerPct}%` }}
          />
        </div>

        {/* Question */}
        <div className={`rounded-2xl border-2 p-5 mb-5 transition-all duration-150 ${
          flash === "correct" ? "border-green-400 bg-green-50 dark:bg-green-900/30"
          : flash === "wrong" ? "border-red-400 bg-red-50 dark:bg-red-900/30"
          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        }`} style={{ boxShadow: "0 2px 8px -2px rgba(0,0,0,0.06)" }}>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-2 font-semibold">Fråga {qIndex + 1}</p>
          <p className="text-base sm:text-lg font-black text-gray-900 dark:text-gray-100">{currentQ.q}</p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 gap-2.5">
          {currentQ.options.map((opt, i) => (
            <button
              key={`${qIndex}-${i}`}
              onClick={() => answer(i)}
              disabled={flash !== null}
              className={`w-full py-3.5 px-5 rounded-xl border-2 font-bold text-left text-sm transition-all duration-100 cursor-pointer
                ${flash !== null ? "opacity-50 cursor-not-allowed"
                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:border-gray-400 active:scale-98"
                }`}
              style={{ boxShadow: "0 2px 0 0 rgba(0,0,0,0.05)" }}
            >
              <span className="text-gray-400 dark:text-gray-500 mr-3 font-black">{String.fromCharCode(65 + i)}.</span>
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
