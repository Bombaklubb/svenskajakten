"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/ui/Header";
import { loadStudent } from "@/lib/storage";
import { getStage } from "@/lib/stages";
import type { StudentData } from "@/lib/types";

// ── Ordlistor per språk ──────────────────────────────────────────────────

const WORDS: Record<string, { word: string; hint: string }[]> = {
  franska: [
    { word: "BONJOUR", hint: "Hej / God dag" },
    { word: "MERCI", hint: "Tack" },
    { word: "MAISON", hint: "Hus" },
    { word: "MANGER", hint: "Äta" },
    { word: "ÉCOLE", hint: "Skola" },
    { word: "FAMILLE", hint: "Familj" },
    { word: "VOYAGE", hint: "Resa" },
    { word: "JARDIN", hint: "Trädgård" },
    { word: "ROUGE", hint: "Röd" },
    { word: "CHIEN", hint: "Hund" },
    { word: "LIVRE", hint: "Bok" },
    { word: "PARLER", hint: "Prata" },
    { word: "ÉCRIRE", hint: "Skriva" },
    { word: "SOLEIL", hint: "Sol" },
    { word: "FLEUR", hint: "Blomma" },
  ],
  spanska: [
    { word: "HOLA", hint: "Hej" },
    { word: "GRACIAS", hint: "Tack" },
    { word: "CASA", hint: "Hus" },
    { word: "COMER", hint: "Äta" },
    { word: "ESCUELA", hint: "Skola" },
    { word: "FAMILIA", hint: "Familj" },
    { word: "VIAJE", hint: "Resa" },
    { word: "PLAYA", hint: "Strand" },
    { word: "ROJO", hint: "Röd" },
    { word: "PERRO", hint: "Hund" },
    { word: "LIBRO", hint: "Bok" },
    { word: "HABLAR", hint: "Prata" },
    { word: "ESCRIBIR", hint: "Skriva" },
    { word: "AMIGO", hint: "Vän" },
    { word: "CIUDAD", hint: "Stad" },
  ],
  tyska: [
    { word: "HALLO", hint: "Hej" },
    { word: "DANKE", hint: "Tack" },
    { word: "HAUS", hint: "Hus" },
    { word: "ESSEN", hint: "Äta" },
    { word: "SCHULE", hint: "Skola" },
    { word: "FAMILIE", hint: "Familj" },
    { word: "REISE", hint: "Resa" },
    { word: "GARTEN", hint: "Trädgård" },
    { word: "BLAU", hint: "Blå" },
    { word: "HUND", hint: "Hund" },
    { word: "BUCH", hint: "Bok" },
    { word: "SPRECHEN", hint: "Prata" },
    { word: "SCHREIBEN", hint: "Skriva" },
    { word: "FREUND", hint: "Vän" },
    { word: "STADT", hint: "Stad" },
  ],
};

const MAX_LIVES = 6;
const GAME_ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖÉÈÊËÀÂÙÛÇÑÜ".split("").filter((v, i, a) => a.indexOf(v) === i);

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

export default function SnogubbenPage({ params }: Props) {
  const { stage: stageId } = use(params);
  const stage = getStage(stageId);
  const [student, setStudent] = useState<StudentData | null>(null);
  useEffect(() => { setStudent(loadStudent()); }, []);
  if (!stage) return notFound();
  return <SnogubbenGame stageId={stageId} stage={stage} student={student} />;
}

// ── Snowman SVG ───────────────────────────────────────────────────────────────
// wrongCount 0 = full snowman, 6 = melted puddle
function Snowman({ wrongCount, isWon }: { wrongCount: number; isWon: boolean }) {
  const showArms    = wrongCount < 1;
  const showHat     = wrongCount < 2;
  const showFace    = wrongCount < 3;
  const showHead    = wrongCount < 4;
  const showMiddle  = wrongCount < 5;
  const showBottom  = wrongCount < 6;

  // Melt factor: how much the bottom squashes
  const meltY = wrongCount >= 6 ? 8 : 0;

  return (
    <svg width="160" height="145" viewBox="0 0 160 145" className="mx-auto">
      {/* --- Puddle (appears at 6 wrong) --- */}
      {!showBottom && (
        <ellipse cx="80" cy="135" rx="45" ry="8" fill="#93c5fd" opacity="0.6" />
      )}

      {/* --- Bottom ball --- */}
      {showBottom && (
        <ellipse
          cx="80" cy={115 + meltY} rx="28" ry={26 - meltY / 2}
          fill="#e0f2fe" stroke="#7dd3fc" strokeWidth="2"
        />
      )}

      {/* --- Middle ball --- */}
      {showMiddle && (
        <>
          <circle cx="80" cy="80" r="19" fill="#e0f2fe" stroke="#7dd3fc" strokeWidth="2" />
          {/* Buttons on middle */}
          {showFace && (
            <>
              <circle cx="80" cy="74" r="2" fill="#64748b" />
              <circle cx="80" cy="80" r="2" fill="#64748b" />
              <circle cx="80" cy="86" r="2" fill="#64748b" />
            </>
          )}
          {/* Scarf */}
          {showHat && (
            <path d="M 62 68 Q 80 72 98 68" stroke="#f87171" strokeWidth="5" fill="none" strokeLinecap="round" />
          )}
        </>
      )}

      {/* --- Arms --- */}
      {showArms && showMiddle && (
        <>
          {/* Left arm */}
          <line x1="61" y1="76" x2="40" y2="64" stroke="#a16207" strokeWidth="3" strokeLinecap="round" />
          <line x1="40" y1="64" x2="34" y2="56" stroke="#a16207" strokeWidth="2" strokeLinecap="round" />
          <line x1="40" y1="64" x2="36" y2="58" stroke="#a16207" strokeWidth="2" strokeLinecap="round" />
          {/* Right arm */}
          <line x1="99" y1="76" x2="120" y2="64" stroke="#a16207" strokeWidth="3" strokeLinecap="round" />
          <line x1="120" y1="64" x2="126" y2="56" stroke="#a16207" strokeWidth="2" strokeLinecap="round" />
          <line x1="120" y1="64" x2="124" y2="58" stroke="#a16207" strokeWidth="2" strokeLinecap="round" />
        </>
      )}

      {/* --- Head --- */}
      {showHead && (
        <circle cx="80" cy="47" r="15" fill="#e0f2fe" stroke="#7dd3fc" strokeWidth="2" />
      )}

      {/* --- Face --- */}
      {showFace && showHead && !isWon && (
        <>
          {/* Eyes */}
          <circle cx="75" cy="44" r="2" fill="#1e293b" />
          <circle cx="85" cy="44" r="2" fill="#1e293b" />
          {/* Carrot nose */}
          <polygon points="80,47 80,52 85,49" fill="#f97316" />
          {/* Smile */}
          <path d="M 74 52 Q 80 57 86 52" stroke="#1e293b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </>
      )}

      {/* --- Happy face when won --- */}
      {isWon && showHead && (
        <>
          <circle cx="75" cy="44" r="2" fill="#1e293b" />
          <circle cx="85" cy="44" r="2" fill="#1e293b" />
          <polygon points="80,47 80,52 85,49" fill="#f97316" />
          <path d="M 73 52 Q 80 58 87 52" stroke="#1e293b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {/* Rosy cheeks */}
          <circle cx="72" cy="51" r="4" fill="#fca5a5" opacity="0.5" />
          <circle cx="88" cy="51" r="4" fill="#fca5a5" opacity="0.5" />
        </>
      )}

      {/* --- Hat --- */}
      {showHat && showHead && (
        <>
          <rect x="68" y="29" width="24" height="14" rx="2" fill="#1e293b" />
          <rect x="63" y="31" width="34" height="5" rx="2" fill="#1e293b" />
          {/* Hat stripe */}
          <rect x="68" y="36" width="24" height="3" rx="1" fill="#f87171" />
        </>
      )}

      {/* --- Sad/melting face for lost state --- */}
      {!showHead && wrongCount >= 4 && !showBottom && (
        <text x="70" y="130" fontSize="14" opacity="0.6">😢</text>
      )}

      {/* --- Snow stars / sparkles --- */}
      {isWon && (
        <>
          <text x="10"  y="30" fontSize="16">❄️</text>
          <text x="130" y="25" fontSize="14">⭐</text>
          <text x="15"  y="110" fontSize="12">✨</text>
          <text x="128" y="100" fontSize="16">❄️</text>
        </>
      )}
    </svg>
  );
}

function SnogubbenGame({ stageId, stage, student }: {
  stageId: string;
  stage: ReturnType<typeof getStage> & object;
  student: StudentData | null;
}) {
  const [wordList] = useState(() => shuffle(WORDS[stageId] ?? WORDS.franska));
  const [wordIndex, setWordIndex] = useState(0);
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
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
      setScore(s => s + 50 + livesLeft * 10);
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
    setPhase("playing");
    setRound(r => r + 1);
    setShowHint(false);
  }, []);

  const restart = useCallback(() => {
    setWordIndex(0);
    setGuessed(new Set());
    setPhase("playing");
    setScore(0);
    setRound(1);
    setShowHint(false);
  }, []);

  const displayWord = current.word.split("").map(char =>
    char === " " ? " " : (guessed.has(char) ? char : "_")
  );

  // Snowman: 0 wrong = fully built, 6 wrong = melted
  // We build it up as we play correctly — or rather, we show decay with wrong guesses
  const wrongCount = wrongGuesses.length;

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

        {/* Lives as snowflakes */}
        <div className="flex justify-center gap-1.5 mb-4">
          {Array.from({ length: MAX_LIVES }).map((_, i) => (
            <span key={i} className={`text-2xl transition-all duration-300 ${i < livesLeft ? "opacity-100" : "opacity-15 grayscale"}`}>
              ❄️
            </span>
          ))}
        </div>

        {/* Snowman */}
        <div className="flex justify-center mb-3">
          <div className={`rounded-2xl px-4 py-2 transition-colors duration-500 ${
            isWon ? "bg-blue-50 dark:bg-blue-900/20"
            : isLost ? "bg-orange-50 dark:bg-orange-900/20"
            : wrongCount >= 4 ? "bg-amber-50 dark:bg-amber-900/10"
            : "bg-sky-50 dark:bg-sky-900/10"
          }`}>
            <Snowman wrongCount={wrongCount} isWon={isWon} />
            {/* Status text under snowman */}
            <p className="text-center text-xs font-bold mt-1">
              {isWon
                ? <span className="text-green-600">Snögubben klarade sig! ⛄</span>
                : isLost
                  ? <span className="text-orange-500">Snögubben smälte... ☀️</span>
                  : wrongCount === 0
                    ? <span className="text-sky-500">Snögubben är hel! ❄️</span>
                    : wrongCount <= 2
                      ? <span className="text-blue-500">Snögubben tappar delar...</span>
                      : wrongCount <= 4
                        ? <span className="text-amber-500">Snögubben håller på att smälta! 🌡️</span>
                        : <span className="text-orange-500">Snögubben smälter snabbt! 🔥</span>
              }
            </p>
          </div>
        </div>

        {/* Word display */}
        <div className="flex justify-center flex-wrap gap-2 mb-3">
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
        <div className="mb-3 text-center">
          {!showHint ? (
            <button onClick={() => setShowHint(true)} className="text-xs text-amber-500 hover:text-amber-600 font-semibold underline">
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
              : "bg-orange-50 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700"
          }`}>
            <div className="text-3xl mb-1">{phase === "won" ? "🎉" : "☀️"}</div>
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
            {GAME_ALPHA.map(letter => {
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
                        ? "bg-orange-100 dark:bg-orange-900/40 border-orange-300 text-orange-400 dark:text-orange-600 opacity-40"
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
