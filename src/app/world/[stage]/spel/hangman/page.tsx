"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/ui/Header";
import { loadStudent } from "@/lib/storage";
import { getStage } from "@/lib/stages";
import type { StudentData } from "@/lib/types";

// ── Ordlistor per stadienivå ──────────────────────────────────────────────────

const WORDS: Record<string, { word: string; hint: string }[]> = {
  lagstadiet: [
    { word: "SUBSTANTIV",   hint: "Namn på saker, djur och personer" },
    { word: "ADJEKTIV",     hint: "Beskriver hur något är" },
    { word: "VERB",         hint: "Ord som beskriver en handling" },
    { word: "MENING",       hint: "Ord som bildar en hel tanke" },
    { word: "VOKAL",        hint: "A, E, I, O, U och fler" },
    { word: "KONSONANT",    hint: "Bokstav som inte är vokal" },
    { word: "ALFABET",      hint: "Alla bokstäver i ordning" },
    { word: "PUNKT",        hint: "Sätts i slutet av en mening" },
    { word: "STOR",         hint: "Varje mening börjar med ___ bokstav" },
    { word: "STAVELSE",     hint: "En del av ett ord med vokalljud" },
    { word: "RIM",          hint: "Ord som slutar med samma ljud" },
    { word: "SYNONYM",      hint: "Ord med liknande betydelse" },
    { word: "DIALOG",       hint: "Samtal mellan personer i en text" },
    { word: "RUBRIK",       hint: "Textens titel" },
    { word: "BERÄTTELSE",   hint: "Text som beskriver händelser" },
  ],
  mellanstadiet: [
    { word: "SUBJEKT",      hint: "Vem eller vad meningen handlar om" },
    { word: "PREDIKAT",     hint: "Verbets funktion i meningen" },
    { word: "OBJEKT",       hint: "Det som påverkas av handlingen" },
    { word: "PRONOMEN",     hint: "Ersätter substantiv – han, hon, det" },
    { word: "ADVERB",       hint: "Beskriver hur ett verb utförs" },
    { word: "TEMPUS",       hint: "Verbets tidsform" },
    { word: "NUTID",        hint: "Något händer just nu (presens)" },
    { word: "DÅTID",        hint: "Något hände förr (preteritum)" },
    { word: "STYCKE",       hint: "Grupp meningar om samma ämne" },
    { word: "TALSTRECK",    hint: "Markerar repliker i dialog" },
    { word: "INLEDNING",    hint: "Textens början som fångar läsaren" },
    { word: "AVSLUTNING",   hint: "Textens slut som rundar av" },
    { word: "KÄLLKRITIK",   hint: "Granskning av en källas trovärdighet" },
    { word: "SAMMANSATT",   hint: "Två ord satta ihop till ett" },
    { word: "PREPOSITION",  hint: "Anger relation – på, i, av, under" },
  ],
  hogstadiet: [
    { word: "BISATS",       hint: "Underordnad sats med subjunktion" },
    { word: "HUVUDSATS",    hint: "Självständig sats som kan stå ensam" },
    { word: "INFINITIV",    hint: "Verbets grundform – att springa" },
    { word: "PARTICIP",     hint: "Verbform som fungerar som adjektiv" },
    { word: "KONGRUENS",    hint: "Böjningsöverensstämmelse i meningen" },
    { word: "INVERSION",    hint: "Subjektet kommer efter predikatet" },
    { word: "RETORIK",      hint: "Konsten att tala övertygande" },
    { word: "ARGUMENT",     hint: "Skäl som stödjer ett påstående" },
    { word: "SYFTNINGSFEL", hint: "Oklart vad ett pronomen syftar på" },
    { word: "GENRE",        hint: "Typ av text med gemensamma drag" },
    { word: "NOMINALFRAS",  hint: "Substantiv med bestämningar" },
    { word: "PASSIV",       hint: "Subjektet utsätts för handlingen" },
    { word: "AKTIV",        hint: "Subjektet utför handlingen" },
    { word: "ORDFÖLJD",     hint: "Ordningens placering i meningen" },
    { word: "SUBJUNKTION",  hint: "Ord som inleder bisats – att, om, när" },
  ],
  gymnasiet: [
    { word: "LOGOS",        hint: "Förnuftsbaserat argument" },
    { word: "ETOS",         hint: "Talarens trovärdighet" },
    { word: "PATOS",        hint: "Känslobaserat argument" },
    { word: "METAFOR",      hint: "Bildlig jämförelse utan som" },
    { word: "IRONI",        hint: "Säga det motsatta av det man menar" },
    { word: "HYPERBOL",     hint: "Medveten överdrift för effekt" },
    { word: "ANAFOR",       hint: "Upprepning av ord i meningsbörjan" },
    { word: "ALLITTERATION",hint: "Upprepning av begynnelseljud" },
    { word: "DENOTATION",   hint: "Ords direkta, bokstavliga betydelse" },
    { word: "KONNOTATION",  hint: "Ords associativa bibetydelse" },
    { word: "INTERTEXTUALITET", hint: "Hänvisning till andra texter" },
    { word: "DISKURS",      hint: "Mönster för hur vi talar om ett ämne" },
    { word: "KOHESION",     hint: "Textens inre sammanhang och bindning" },
    { word: "NARRATIV",     hint: "En berättelse eller berättelsestruktur" },
    { word: "POLYFONI",     hint: "Många röster och perspektiv i en text" },
  ],
};

const MAX_LIVES = 6;
const SWEDISH_ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ".split("");

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

export default function HangmanPage({ params }: Props) {
  const { stage: stageId } = use(params);
  const stage = getStage(stageId);
  const [student, setStudent] = useState<StudentData | null>(null);
  useEffect(() => { setStudent(loadStudent()); }, []);
  if (!stage) return notFound();
  return <HangmanGame stageId={stageId} stage={stage} student={student} />;
}

function HangmanGame({ stageId, stage, student }: {
  stageId: string;
  stage: ReturnType<typeof getStage> & object;
  student: StudentData | null;
}) {
  const [wordList] = useState(() => shuffle(WORDS[stageId] ?? WORDS.lagstadiet));
  const [wordIndex, setWordIndex] = useState(0);
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [lives, setLives] = useState(MAX_LIVES);
  const [phase, setPhase] = useState<"playing" | "won" | "lost">("playing");
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [showHint, setShowHint] = useState(false);

  const current = wordList[wordIndex % wordList.length];
  const wordLetters = current.word.replace(/\s/g, "").split("");
  const uniqueLetters = [...new Set(wordLetters)];

  const wrongGuesses = [...guessed].filter(l => !wordLetters.includes(l));
  const livesLeft = MAX_LIVES - wrongGuesses.length;

  const isWon = uniqueLetters.every(l => guessed.has(l));
  const isLost = livesLeft <= 0;

  useEffect(() => {
    if (isWon && phase === "playing") {
      const bonus = livesLeft * 10;
      setScore(s => s + 50 + bonus);
      setPhase("won");
    } else if (isLost && phase === "playing") {
      setPhase("lost");
    }
  }, [isWon, isLost, livesLeft, phase]);

  const guess = useCallback((letter: string) => {
    if (phase !== "playing" || guessed.has(letter)) return;
    setGuessed(prev => new Set([...prev, letter]));
  }, [phase, guessed]);

  const nextWord = useCallback(() => {
    setWordIndex(i => i + 1);
    setGuessed(new Set());
    setLives(MAX_LIVES);
    setPhase("playing");
    setRound(r => r + 1);
    setShowHint(false);
  }, []);

  const restart = useCallback(() => {
    setWordIndex(0);
    setGuessed(new Set());
    setLives(MAX_LIVES);
    setPhase("playing");
    setScore(0);
    setRound(1);
    setShowHint(false);
  }, []);

  const displayWord = current.word.split("").map(char =>
    char === " " ? " " : (guessed.has(char) ? char : "_")
  );

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <Header student={student} />
      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-4 pt-20">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <Link href={`/world/${stageId}`} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm font-semibold">
            ← Avsluta
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Runda {round}</span>
            <span className="text-sm font-black text-amber-500">⭐ {score}p</span>
          </div>
        </div>

        {/* Hearts */}
        <div className="flex justify-center gap-1 mb-6">
          {Array.from({ length: MAX_LIVES }).map((_, i) => (
            <span key={i} className={`text-2xl transition-all duration-300 ${i < livesLeft ? "opacity-100 scale-110" : "opacity-20 grayscale"}`}>
              ❤️
            </span>
          ))}
        </div>

        {/* Gallows SVG */}
        <div className="flex justify-center mb-4">
          <svg width="160" height="140" viewBox="0 0 160 140" className="text-gray-700 dark:text-gray-300">
            {/* Base */}
            <line x1="10" y1="135" x2="150" y2="135" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            {/* Pole */}
            <line x1="40" y1="135" x2="40" y2="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            {/* Top beam */}
            <line x1="40" y1="10" x2="110" y2="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            {/* Rope */}
            <line x1="110" y1="10" x2="110" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            {/* Head */}
            {wrongGuesses.length >= 1 && <circle cx="110" cy="42" r="12" stroke="currentColor" strokeWidth="2.5" fill="none" />}
            {/* Body */}
            {wrongGuesses.length >= 2 && <line x1="110" y1="54" x2="110" y2="90" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />}
            {/* Left arm */}
            {wrongGuesses.length >= 3 && <line x1="110" y1="65" x2="88" y2="80" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />}
            {/* Right arm */}
            {wrongGuesses.length >= 4 && <line x1="110" y1="65" x2="132" y2="80" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />}
            {/* Left leg */}
            {wrongGuesses.length >= 5 && <line x1="110" y1="90" x2="88" y2="115" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />}
            {/* Right leg */}
            {wrongGuesses.length >= 6 && <line x1="110" y1="90" x2="132" y2="115" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />}
            {/* Sad face when lost */}
            {isLost && (
              <>
                <line x1="105" y1="40" x2="107" y2="42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="107" y1="40" x2="105" y2="42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="113" y1="40" x2="115" y2="42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="115" y1="40" x2="113" y2="42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M 105 49 Q 110 45 115 49" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </>
            )}
            {/* Happy face when won */}
            {isWon && (
              <>
                <circle cx="106" cy="40" r="1.5" fill="currentColor" />
                <circle cx="114" cy="40" r="1.5" fill="currentColor" />
                <path d="M 105 46 Q 110 51 115 46" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </>
            )}
          </svg>
        </div>

        {/* Word display */}
        <div className="flex justify-center flex-wrap gap-2 mb-4">
          {displayWord.map((char, i) => (
            char === " " ? (
              <div key={i} className="w-5" />
            ) : (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <span className={`text-xl font-black tracking-widest min-w-[1.5rem] text-center ${char !== "_" ? stage!.textClass : "text-gray-800 dark:text-gray-200"}`}>
                  {char !== "_" ? char : "\u00A0"}
                </span>
                <div className={`h-0.5 w-6 rounded-full ${char !== "_" ? stage!.colorClass : "bg-gray-400 dark:bg-gray-500"}`} />
              </div>
            )
          ))}
        </div>

        {/* Hint */}
        <div className="mb-4 text-center">
          {!showHint ? (
            <button
              onClick={() => setShowHint(true)}
              className="text-xs text-amber-500 hover:text-amber-600 font-semibold underline"
            >
              💡 Visa ledtråd
            </button>
          ) : (
            <p className="text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-2 font-medium">
              💡 {current.hint}
            </p>
          )}
        </div>

        {/* Result overlay */}
        {phase !== "playing" && (
          <div className={`rounded-2xl p-4 mb-4 text-center border-2 ${
            phase === "won"
              ? "bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700"
              : "bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700"
          }`}>
            <div className="text-3xl mb-1">{phase === "won" ? "🎉" : "😢"}</div>
            <p className="font-black text-gray-900 dark:text-gray-100 text-base">
              {phase === "won" ? `Rätt! +${50 + livesLeft * 10}p` : `Ordet var: ${current.word}`}
            </p>
            <div className="flex gap-2 justify-center mt-3">
              <button
                onClick={nextWord}
                className={`px-5 py-2 rounded-xl font-bold text-white text-sm cursor-pointer ${stage!.colorClass}`}
                style={{ boxShadow: "0 3px 0 0 rgba(0,0,0,0.2)" }}
              >
                Nästa ord →
              </button>
              <button
                onClick={restart}
                className="px-4 py-2 rounded-xl font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 text-sm cursor-pointer"
              >
                Börja om
              </button>
            </div>
          </div>
        )}

        {/* Keyboard */}
        {phase === "playing" && (
          <div className="flex flex-wrap justify-center gap-1.5">
            {SWEDISH_ALPHA.map(letter => {
              const isGuessed = guessed.has(letter);
              const isCorrect = isGuessed && wordLetters.includes(letter);
              const isWrong = isGuessed && !wordLetters.includes(letter);
              return (
                <button
                  key={letter}
                  onClick={() => guess(letter)}
                  disabled={isGuessed}
                  className={`w-9 h-9 rounded-lg font-black text-sm transition-all duration-150 border-2 cursor-pointer ${
                    isCorrect
                      ? "bg-green-100 dark:bg-green-900/40 border-green-400 text-green-700 dark:text-green-300"
                      : isWrong
                        ? "bg-red-100 dark:bg-red-900/40 border-red-300 text-red-400 dark:text-red-600 opacity-40"
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:border-gray-400 active:scale-90"
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
