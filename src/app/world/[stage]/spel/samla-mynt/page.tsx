"use client";

import { useState, useEffect, useCallback, useRef, use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/ui/Header";
import { loadStudent } from "@/lib/storage";
import { getStage } from "@/lib/stages";
import type { StudentData } from "@/lib/types";

// ── Frågor per stadienivå (återanvänds från Tidsattack, men med annan layout) ─

const QUESTIONS: Record<string, { q: string; options: string[]; correct: number }[]> = {
  lagstadiet: [
    { q: "Vad är ett SUBSTANTIV?", options: ["Handlingsord", "Namn på saker, djur, personer", "Beskrivningsord", "Kopplings-ord"], correct: 1 },
    { q: "Vad är ett VERB?", options: ["Namn på saker", "Beskriver hur något är", "Handlingsord", "Kopplar meningar"], correct: 2 },
    { q: "Vad är ett ADJEKTIV?", options: ["Handlingsord", "Namn på saker", "Anger tid", "Beskriver hur något är"], correct: 3 },
    { q: "Vad sätts efter en FRÅGA?", options: ["Punkt", "Komma", "Frågetecken", "Utropstecken"], correct: 2 },
    { q: "Vad börjar varje mening med?", options: ["Liten bokstav", "Siffra", "Stor bokstav", "Punkt"], correct: 2 },
    { q: "Vad är en VOKAL?", options: ["B, C, D, F", "A, E, I, O, U, Å, Ä, Ö", "Bara A och E", "Alla bokstäver"], correct: 1 },
    { q: "Vad är ett SYNONYM?", options: ["Motsatsord", "Ord med liknande betydelse", "Felstavat ord", "Frågeord"], correct: 1 },
    { q: "Vad är en MENING?", options: ["En bok", "En bokstav", "Ord som bildar en hel tanke", "En rubrik"], correct: 2 },
    { q: "Vad kallas textens TITEL?", options: ["Stycke", "Rubrik", "Dialog", "Paragraf"], correct: 1 },
    { q: "Vad markerar TALSTRECK?", options: ["En paus", "Vad någon säger", "Frågans slut", "En lista"], correct: 1 },
  ],
  mellanstadiet: [
    { q: "Vad är ett SUBJEKT?", options: ["Verbets tidsform", "Vem/vad meningen handlar om", "Det verbet gör", "En tidsangivelse"], correct: 1 },
    { q: "Vad är PREDIKAT?", options: ["Subjektets funktion", "Verbets funktion i meningen", "En bisats", "Tidsangivelse"], correct: 1 },
    { q: "Vad är TEMPUS?", options: ["Verbets tidsform", "Meningens längd", "Ordets stavning", "En adjektivform"], correct: 0 },
    { q: "Vad är NUTID?", options: ["Något hände förr", "Något ska hända", "Något händer just nu", "Något händer ibland"], correct: 2 },
    { q: "Vad är ett PRONOMEN?", options: ["Ersätter substantiv", "Ersätter verb", "Ersätter adjektiv", "Anger tid"], correct: 0 },
    { q: "Vad är ADVERB?", options: ["Namn på saker", "Beskriver hur ett verb utförs", "Ersätter substantiv", "Anger relation"], correct: 1 },
    { q: "Vad är SAMMANSATT ORD?", options: ["Två ord ihopsatta", "Ord med många bokstäver", "Ord med förled", "Lånat ord"], correct: 0 },
    { q: "Vad är KÄLLKRITIK?", options: ["Att skriva snabbt", "Att granska källors trovärdighet", "Att kopiera text", "Att hitta synonymer"], correct: 1 },
    { q: "Vad är en PREPOSITION?", options: ["Handlingsord", "Anger relation – på, i, av", "Ersätter substantiv", "Tidsform"], correct: 1 },
    { q: "Vad är DÅTID?", options: ["Något händer nu", "Något hände förr", "Något ska hända", "Något händer ofta"], correct: 1 },
  ],
  hogstadiet: [
    { q: "Vad är en BISATS?", options: ["Självständig sats", "Underordnad sats med subjunktion", "En frågesats", "En huvudsats"], correct: 1 },
    { q: "Vad är INFINITIV?", options: ["Dåtidsformen", "Nutidsformen", "Verbets grundform – att springa", "Particip"], correct: 2 },
    { q: "Vad är PASSIV form?", options: ["Subjektet utför handlingen", "Subjektet utsätts för handlingen", "Meningen har inget subjekt", "Verbet i infinitiv"], correct: 1 },
    { q: "Vad är KONGRUENS?", options: ["Skillnad i böjning", "Böjningsöverensstämmelse", "En typ av subjunktion", "Verbets tidsform"], correct: 1 },
    { q: "Vad är RETORIK?", options: ["Att läsa snabbt", "Att tala och skriva övertygande", "En textgenre", "Att analysera litteratur"], correct: 1 },
    { q: "Vad är ett ARGUMENT?", options: ["En fråga", "En berättelse", "Skäl som stödjer ett påstående", "En slutsats"], correct: 2 },
    { q: "Vad är INVERSION?", options: ["Att skriva baklänges", "Subjektet kommer efter predikatet", "En bisats", "Passiv form"], correct: 1 },
    { q: "Vad är en NOMINALFRAS?", options: ["En verbfras", "Substantiv med bestämningar", "En adverbfras", "En prepositionsfras"], correct: 1 },
    { q: "Vad är GENRE?", options: ["Stil", "Ton", "Typ av text med gemensamma drag", "Register"], correct: 2 },
    { q: "Vad är PARTICIP?", options: ["Verbets grundform", "Verbform som fungerar som adjektiv", "Dåtidsformen", "En bisats"], correct: 1 },
  ],
  gymnasiet: [
    { q: "Vad är LOGOS?", options: ["Känsloargument", "Förnuftsbaserat argument", "Talarens trovärdighet", "Bildspråk"], correct: 1 },
    { q: "Vad är ETOS?", options: ["Logiska argument", "Känsloargument", "Talarens trovärdighet", "En stilfigur"], correct: 2 },
    { q: "Vad är PATOS?", options: ["Förnuftsargument", "Känslobaserat argument", "Talarens karaktär", "Logisk struktur"], correct: 1 },
    { q: "Vad är en METAFOR?", options: ["Jämförelse med 'som'", "Bildlig jämförelse utan 'som'", "Upprepning av ord", "Överdrift"], correct: 1 },
    { q: "Vad är IRONI?", options: ["Att skratta", "Att säga det motsatta av det man menar", "Att överdriva", "Att upprepa"], correct: 1 },
    { q: "Vad är HYPERBOL?", options: ["Understrykning", "Medveten överdrift för effekt", "Upprepning av ljud", "Bildlig jämförelse"], correct: 1 },
    { q: "Vad är ALLITTERATION?", options: ["Upprepning av slutljud", "Upprepning av begynnelseljud", "Upprepning av ord", "En metafor"], correct: 1 },
    { q: "Vad är KOHESION?", options: ["Textens yttre form", "Textens inre sammanhang", "Textens syfte", "Textens genre"], correct: 1 },
    { q: "Vad är DENOTATION?", options: ["Ords associativa betydelse", "Ords direkta, bokstavliga betydelse", "En bildlig jämförelse", "Ordets ursprung"], correct: 1 },
    { q: "Vad är INTERTEXTUALITET?", options: ["Svårläst text", "Hänvisning till andra texter", "Text inom text", "Flerspråkig text"], correct: 1 },
  ],
};

const TOTAL_COINS = 10;
const WRONG_LIMIT = 3;

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

export default function SamlaMyntPage({ params }: Props) {
  const { stage: stageId } = use(params);
  const stage = getStage(stageId);
  const [student, setStudent] = useState<StudentData | null>(null);
  useEffect(() => { setStudent(loadStudent()); }, []);
  if (!stage) return notFound();
  return <SamlaMyntGame stageId={stageId} stage={stage} student={student} />;
}

type Feedback = "coin" | "obstacle" | null;

function SamlaMyntGame({ stageId, stage, student }: {
  stageId: string;
  stage: ReturnType<typeof getStage> & object;
  student: StudentData | null;
}) {
  const [phase, setPhase] = useState<"ready" | "playing" | "done">("ready");
  const [questions] = useState(() => shuffle(QUESTIONS[stageId] ?? QUESTIONS.lagstadiet));
  const [qIndex, setQIndex] = useState(0);
  const [coins, setCoins] = useState(0);
  const [obstacles, setObstacles] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [score, setScore] = useState(0);
  const [runFrame, setRunFrame] = useState(0);
  const runRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentQ = questions[qIndex % questions.length];

  // Animate running character
  useEffect(() => {
    if (phase === "playing") {
      runRef.current = setInterval(() => setRunFrame(f => (f + 1) % 4), 200);
    }
    return () => { if (runRef.current) clearInterval(runRef.current); };
  }, [phase]);

  const handleAnswer = useCallback((idx: number) => {
    if (phase !== "playing" || feedback !== null) return;
    const isCorrect = idx === currentQ.correct;

    if (isCorrect) {
      const newCoins = coins + 1;
      setCoins(newCoins);
      setScore(s => s + 20);
      setFeedback("coin");
      feedbackTimeout.current = setTimeout(() => {
        setFeedback(null);
        if (newCoins >= TOTAL_COINS) {
          setPhase("done");
        } else {
          setQIndex(i => i + 1);
        }
      }, 600);
    } else {
      const newObstacles = obstacles + 1;
      setObstacles(newObstacles);
      setFeedback("obstacle");
      feedbackTimeout.current = setTimeout(() => {
        setFeedback(null);
        if (newObstacles >= WRONG_LIMIT) {
          setPhase("done");
        } else {
          setQIndex(i => i + 1);
        }
      }, 800);
    }
  }, [phase, feedback, currentQ, coins, obstacles]);

  const start = () => {
    setPhase("playing");
    setQIndex(0);
    setCoins(0);
    setObstacles(0);
    setFeedback(null);
    setScore(0);
    setRunFrame(0);
  };

  // Running character frames
  const runChars = ["🏃", "🏃", "🚶", "🏃"];
  const char = feedback === "obstacle" ? "😵" : feedback === "coin" ? "😄" : runChars[runFrame];

  if (phase === "ready") {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
        <Header student={student} />
        <div className="flex-1 max-w-md mx-auto w-full px-4 py-8 pt-24 flex flex-col items-center justify-center text-center">
          <Link href={`/world/${stageId}`} className="self-start text-gray-500 dark:text-gray-400 hover:text-gray-700 text-sm font-semibold mb-8">
            ← Tillbaka till Spel
          </Link>
          <div className="text-7xl mb-4">🪙</div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 mb-2">Samla mynt!</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-2">Svara rätt = samla mynt 🪙 · Svara fel = hinder 🚧</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mb-8">
            Samla <span className="font-black text-amber-500">{TOTAL_COINS} mynt</span> utan att träffa <span className="font-black text-red-500">{WRONG_LIMIT} hinder</span>!
          </p>
          <button
            onClick={start}
            className={`w-full max-w-xs py-4 rounded-2xl font-black text-white text-xl cursor-pointer ${stage!.colorClass}`}
            style={{ boxShadow: "0 5px 0 0 rgba(0,0,0,0.2)" }}
          >
            Spring! 🏃
          </button>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    const won = coins >= TOTAL_COINS;
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
        <Header student={student} />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-sm w-full text-center">
            <div className="text-6xl mb-3">{won ? "🏆" : "💥"}</div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 mb-1">
              {won ? "Alla mynt samlade!" : "Träffade för många hinder!"}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">{won ? "Fantastiskt jobbat!" : "Försök igen!"}</p>
            <div className={`border-3 ${stage!.borderClass} rounded-2xl p-5 mb-6 grid grid-cols-3 gap-3 text-center`}
              style={{ boxShadow: "0 4px 0 0 rgba(0,0,0,0.08)" }}>
              <div>
                <p className={`text-2xl font-black ${stage!.textClass}`}>{score}</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs">Poäng</p>
              </div>
              <div>
                <p className="text-2xl font-black text-amber-500">🪙 {coins}</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs">Mynt</p>
              </div>
              <div>
                <p className="text-2xl font-black text-red-500">🚧 {obstacles}</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs">Hinder</p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={start}
                className={`w-full py-3 rounded-2xl font-black text-white text-lg cursor-pointer ${stage!.colorClass}`}
                style={{ boxShadow: "0 4px 0 0 rgba(0,0,0,0.2)" }}
              >
                Spela igen 🏃
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
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <Header student={student} />
      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-4 pt-20">
        {/* HUD */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setPhase("done")} className="text-gray-400 hover:text-gray-600 text-sm font-semibold cursor-pointer">
            ← Avsluta
          </button>
          <span className={`font-black text-sm ${stage!.textClass}`}>⭐ {score}p</span>
        </div>

        {/* Track */}
        <div className={`rounded-2xl border-2 p-4 mb-4 transition-all duration-200 ${
          feedback === "coin" ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20"
          : feedback === "obstacle" ? "border-red-400 bg-red-50 dark:bg-red-900/20"
          : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
        }`}>
          {/* Progress track */}
          <div className="flex items-center gap-1 mb-3">
            {Array.from({ length: TOTAL_COINS }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-4 rounded-full transition-all duration-300 text-center text-[10px] leading-4 ${
                  i < coins ? "bg-amber-400 text-white" : "bg-gray-200 dark:bg-gray-700"
                }`}
              >
                {i < coins ? "🪙" : ""}
              </div>
            ))}
          </div>

          {/* Runner + road */}
          <div className="relative h-16 bg-gradient-to-b from-sky-100 to-sky-200 dark:from-sky-900/30 dark:to-sky-800/30 rounded-xl overflow-hidden">
            {/* Ground */}
            <div className="absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-b from-green-400 to-green-500 dark:from-green-800 dark:to-green-900 rounded-b-xl" />
            {/* Road dashes */}
            <div className="absolute bottom-2 left-0 right-0 flex gap-4 px-4">
              {[0,1,2,3,4].map(i => (
                <div key={i} className="h-1 w-8 bg-white/50 rounded-full" />
              ))}
            </div>
            {/* Character — runs left-to-right */}
            <div
              className="absolute bottom-4 text-3xl transition-all duration-150"
              style={{
                left: `${(coins / TOTAL_COINS) * 75 + 5}%`,
                transform: feedback === "obstacle" ? "scaleX(-1) rotate(-20deg)" : "scaleX(-1)",
              }}
            >
              {char}
            </div>
            {/* Feedback animation */}
            {feedback === "coin" && (
              <div className="absolute top-1 text-2xl animate-bounce"
                style={{ left: `${(coins / TOTAL_COINS) * 75 + 5}%` }}>
                🪙
              </div>
            )}
            {feedback === "obstacle" && (
              <div className="absolute top-1 text-2xl"
                style={{ left: `${(coins / TOTAL_COINS) * 75 + 5}%` }}>
                🚧
              </div>
            )}
          </div>

          {/* Lives */}
          <div className="flex justify-center gap-2 mt-2">
            {Array.from({ length: WRONG_LIMIT }).map((_, i) => (
              <span key={i} className={`text-xl transition-all duration-300 ${i >= obstacles ? "opacity-100" : "opacity-20 grayscale"}`}>
                🛡️
              </span>
            ))}
          </div>
        </div>

        {/* Question */}
        <div className="rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 mb-4"
          style={{ boxShadow: "0 2px 8px -2px rgba(0,0,0,0.06)" }}>
          <p className="text-sm text-amber-500 font-bold mb-1">🪙 Mynt {coins + 1} av {TOTAL_COINS}</p>
          <p className="text-base sm:text-lg font-black text-gray-900 dark:text-gray-100">{currentQ.q}</p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-2.5">
          {currentQ.options.map((opt, i) => (
            <button
              key={`${qIndex}-${i}`}
              onClick={() => handleAnswer(i)}
              disabled={feedback !== null}
              className={`py-3 px-4 rounded-xl border-2 font-bold text-sm transition-all duration-100 cursor-pointer text-left
                ${feedback !== null ? "opacity-50 cursor-not-allowed"
                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:border-gray-400 active:scale-95"
                }`}
              style={{ boxShadow: "0 2px 0 0 rgba(0,0,0,0.06)" }}
            >
              <span className="text-gray-400 dark:text-gray-500 mr-2 text-xs font-black">{String.fromCharCode(65 + i)}</span>
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
