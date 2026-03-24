"use client";

import { useState, useEffect, useCallback, useRef, use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/ui/Header";
import { loadStudent } from "@/lib/storage";
import { getStage } from "@/lib/stages";
import type { StudentData } from "@/lib/types";

// ── Frågor per stadienivå ─────────────────────────────────────────────────────

const QUESTIONS: Record<string, { q: string; options: string[]; correct: number }[]> = {
  lagstadiet: [
    { q: "Vilket ord är ett SUBSTANTIV?", options: ["springer", "hund", "glad", "snabbt"], correct: 1 },
    { q: "Vilket ord är ett VERB?", options: ["blå", "stor", "hoppar", "boll"], correct: 2 },
    { q: "Vilket ord är ett ADJEKTIV?", options: ["läser", "stol", "liten", "och"], correct: 2 },
    { q: "Vad sätts i slutet av en mening?", options: ["Komma", "Punkt", "Kolon", "Bindestreck"], correct: 1 },
    { q: "Hur börjar varje ny mening?", options: ["Med gemen", "Med siffra", "Med stor bokstav", "Med punkt"], correct: 2 },
    { q: "Vad är en VOKAL?", options: ["B, C, D", "A, E, I, O, U, Å, Ä, Ö", "F, G, H", "Alla bokstäver"], correct: 1 },
    { q: "Vad är ett SYNONYM?", options: ["Motsatsord", "Ord med liknande betydelse", "Felstavat ord", "Frågeord"], correct: 1 },
    { q: "Vad är ett RIM?", options: ["Ord som stavas lika", "Ord som slutar med samma ljud", "Ord med samma innebörd", "Långa ord"], correct: 1 },
    { q: "Vad används TALSTRECK till?", options: ["Att räkna", "Att markera vad någon säger", "Att avsluta meningar", "Att lista saker"], correct: 1 },
    { q: "Vad är en STAVELSE?", options: ["En bokstav", "En mening", "En del av ett ord med vokalljud", "En paragraf"], correct: 2 },
    { q: "Vilket ord är en KONSONANT?", options: ["A", "B", "Ö", "I"], correct: 1 },
    { q: "Vad kallas textens titel?", options: ["Stycke", "Rubrik", "Mening", "Paragraf"], correct: 1 },
    { q: "Vilket av dessa är ett MOTSATSORD till 'stor'?", options: ["Liten", "Stor", "Glad", "Snabb"], correct: 0 },
    { q: "Vad kallas ett samtal i en text?", options: ["Stycke", "Rubrik", "Dialog", "Berättelse"], correct: 2 },
    { q: "Hur många vokaler finns det i svenska?", options: ["5", "7", "9", "3"], correct: 2 },
  ],
  mellanstadiet: [
    { q: "Vad är ett SUBJEKT?", options: ["Verbets tidsform", "Vem/vad meningen handlar om", "Det verbet gör", "En tidsangivelse"], correct: 1 },
    { q: "Vad kallas verbets funktion i meningen?", options: ["Subjekt", "Objekt", "Predikat", "Adverbial"], correct: 2 },
    { q: "Vad är TEMPUS?", options: ["Verbets tidsform", "Ordets antal stavelser", "Meningens längd", "En typ av adjektiv"], correct: 0 },
    { q: "Vilket är NUTIDSFORM av 'sprang'?", options: ["Sprungit", "Springer", "Spring", "Sprang"], correct: 1 },
    { q: "Vad kallas ett ord som ersätter ett substantiv?", options: ["Adverb", "Adjektiv", "Pronomen", "Preposition"], correct: 2 },
    { q: "Vad är ett ADVERB?", options: ["Namn på saker", "Beskriver hur ett verb utförs", "Ersätter substantiv", "Anger tid"], correct: 1 },
    { q: "Vad innebär STYCKESINDELNING?", options: ["Att rimma ord", "Att dela upp text i delar om samma ämne", "Att skriva rubriker", "Att räkna meningar"], correct: 1 },
    { q: "Vad är ett SAMMANSATT ORD?", options: ["Två ord satta ihop till ett", "Ett ord med många stavelser", "Ett svårt ord", "Ett ord med förled"], correct: 0 },
    { q: "Vad är KÄLLKRITIK?", options: ["Att skriva snabbt", "Att granska en källas trovärdighet", "Att kopiera text", "Att hitta synonymer"], correct: 1 },
    { q: "Vad kallas det när ett sammansatt ord skrivs isär felaktigt?", options: ["Synonymfel", "Stavfel", "Särskrivning", "Tempusfel"], correct: 2 },
    { q: "Vad anger en PREPOSITION?", options: ["Verbets tid", "Relation i rum eller tid – på, i, av", "Subjektets funktion", "Textens genre"], correct: 1 },
    { q: "Vad är DÅTID (preteritum)?", options: ["Något händer nu", "Något hände förr", "Något ska hända", "Något händer ofta"], correct: 1 },
    { q: "Vad kallas textens inledande del?", options: ["Avslutning", "Stycke", "Inledning", "Rubrik"], correct: 2 },
    { q: "Vad är SJ-LJUDET?", options: ["Bara stavat sj", "Stavas sj, sk, stj eller sch", "Bara stavat sch", "Stavas sh eller zj"], correct: 1 },
    { q: "Vad innebär DUBBELTECKNING?", options: ["Två vokaler bredvid varandra", "Dubbel konsonant efter kort vokal", "Att skriva ett ord två gånger", "Sammansatta ord"], correct: 1 },
  ],
  hogstadiet: [
    { q: "Vad är en BISATS?", options: ["En självständig sats", "Underordnad sats med subjunktion", "En huvudsats", "En frågesats"], correct: 1 },
    { q: "Vad är INVERSION?", options: ["Att byta ordföljd så subjektet kommer efter predikatet", "Att skriva baklänges", "En typ av bisats", "Passiv form"], correct: 0 },
    { q: "Vad är verbets INFINITIV?", options: ["Dåtidsformen", "Grundformen – att springa", "Nutidsformen", "Particip"], correct: 1 },
    { q: "Vad innebär PASSIV form?", options: ["Subjektet utför handlingen", "Subjektet utsätts för handlingen", "Meningen har inget subjekt", "Verbet är i infinitiv"], correct: 1 },
    { q: "Vad är KONGRUENS?", options: ["Skillnad i böjning", "Böjningsöverensstämmelse i meningen", "En typ av subjunktion", "Verbets tidsform"], correct: 1 },
    { q: "Vad är RETORIK?", options: ["Att läsa snabbt", "Konsten att tala och skriva övertygande", "En typ av textgenre", "Att analysera litteratur"], correct: 1 },
    { q: "Vad är ett ARGUMENT?", options: ["En fråga", "Skäl som stödjer ett påstående", "En berättelse", "En slutsats"], correct: 1 },
    { q: "Vad är ett SYFTNINGSFEL?", options: ["Felaktig stavning", "Oklart vad ett pronomen syftar på", "Fel ordföljd", "Tempusfel"], correct: 1 },
    { q: "Vad inleder en BISATS?", options: ["Konjunktion", "Subjunktion", "Pronomen", "Preposition"], correct: 1 },
    { q: "Vad är en NOMINALFRAS?", options: ["En verbfras", "Substantiv med bestämningar", "En adverbfras", "En prepositionsfras"], correct: 1 },
    { q: "Vad kallas en text med gemensamma drag?", options: ["Stil", "Ton", "Genre", "Register"], correct: 2 },
    { q: "Vad är FORMELLT SPRÅK?", options: ["Vardagligt och personligt", "Officiellt och neutralt", "Känslosamt och målande", "Enkelt och kortfattat"], correct: 1 },
    { q: "Vad är ett PARTICIP?", options: ["Verbets grundform", "Verbform som fungerar som adjektiv", "Verbets dåtidsform", "En bisats"], correct: 1 },
    { q: "Vad kallas en självständig sats?", options: ["Bisats", "Subjunktion", "Huvudsats", "Nominalfras"], correct: 2 },
    { q: "Vad är en TES i en argumenterande text?", options: ["En fråga", "Det påstående man vill bevisa", "En motbild", "En slutsats"], correct: 1 },
  ],
  gymnasiet: [
    { q: "Vad är LOGOS?", options: ["Känslobaserat argument", "Förnuftsbaserat argument", "Talarens trovärdighet", "Bildspråk"], correct: 1 },
    { q: "Vad är ETOS?", options: ["Logiska argument", "Känsloargument", "Talarens trovärdighet och karaktär", "En stilfigur"], correct: 2 },
    { q: "Vad är PATOS?", options: ["Förnuftsargument", "Känslobaserat argument", "Talarens karaktär", "Logisk struktur"], correct: 1 },
    { q: "Vad är NOMINALISERING?", options: ["Pronomen som ersätter substantiv", "Verb omvandlat till substantiv", "Adjektiv i superlativ", "En retorisk stilfigur"], correct: 1 },
    { q: "Vad är DENOTATION?", options: ["Ords associativa bibetydelse", "Ords direkta, bokstavliga betydelse", "En bildlig jämförelse", "Ordets etymologi"], correct: 1 },
    { q: "Vad är KONNOTATION?", options: ["Ords direkta betydelse", "Ords associativa bibetydelse", "En retorisk figur", "Ords ursprung"], correct: 1 },
    { q: "Vad är en METAFOR?", options: ["Bildlig jämförelse med 'som'", "Bildlig jämförelse utan 'som'", "Upprepning av ord", "Överdrift"], correct: 1 },
    { q: "Vad är IRONI?", options: ["Att skratta åt sig själv", "Att säga det motsatta av det man menar", "Att överdriva kraftigt", "Att upprepa ord"], correct: 1 },
    { q: "Vad är HYPERBOL?", options: ["Understrykning", "Medveten överdrift för effekt", "Upprepning av begynnelseljud", "Bildlig jämförelse"], correct: 1 },
    { q: "Vad är ANAFOR?", options: ["Upprepning av ord i meningsslutet", "Upprepning av ord i meningsbörjan", "En typ av metafor", "Kontrast i en text"], correct: 1 },
    { q: "Vad är ALLITTERATION?", options: ["Upprepning av slutljud", "Upprepning av begynnelseljud", "Upprepning av hela ord", "En bildlig jämförelse"], correct: 1 },
    { q: "Vad är KOHESION?", options: ["Textens yttre struktur", "Textens inre sammanhang och bindning", "Textens syfte", "Textens genre"], correct: 1 },
    { q: "Vad är INTERTEXTUALITET?", options: ["Texten är svårläst", "Hänvisning till andra texter", "Text inom text", "Flerspråkig text"], correct: 1 },
    { q: "Vad är POLYFONI?", options: ["Enkel struktur med en röst", "Många röster och perspektiv i en text", "En typ av dialog", "Retorisk upprepning"], correct: 1 },
    { q: "Vad är DISKURS?", options: ["En texttyp", "Mönster för hur vi talar om ett ämne", "En argumentationsteknik", "En retorisk figur"], correct: 1 },
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
  const [questions] = useState(() => shuffle(QUESTIONS[stageId] ?? QUESTIONS.lagstadiet));
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
