"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/ui/Header";
import { loadStudent } from "@/lib/storage";
import { getLanguage } from "@/lib/languages";
import type { StudentData } from "@/lib/types";

interface Props {
  params: Promise<{ language: string }>;
}

const HANGMAN_WORDS: Record<string, Array<{ word: string; clue: string }>> = {
  franska: [
    { word: "BONJOUR", clue: "Hej på franska" },
    { word: "MERCI", clue: "Tack på franska" },
    { word: "MAISON", clue: "Huset" },
    { word: "CHAT", clue: "Katten" },
    { word: "ECOLE", clue: "Skolan" },
    { word: "LIVRE", clue: "Boken" },
    { word: "CHIEN", clue: "Hunden" },
    { word: "SOLEIL", clue: "Solen" },
  ],
  spanska: [
    { word: "HOLA", clue: "Hej på spanska" },
    { word: "GRACIAS", clue: "Tack på spanska" },
    { word: "CASA", clue: "Huset" },
    { word: "GATO", clue: "Katten" },
    { word: "ESCUELA", clue: "Skolan" },
    { word: "LIBRO", clue: "Boken" },
    { word: "PERRO", clue: "Hunden" },
    { word: "SOL", clue: "Solen" },
  ],
  tyska: [
    { word: "HALLO", clue: "Hej på tyska" },
    { word: "DANKE", clue: "Tack på tyska" },
    { word: "HAUS", clue: "Huset" },
    { word: "KATZE", clue: "Katten" },
    { word: "SCHULE", clue: "Skolan" },
    { word: "BUCH", clue: "Boken" },
    { word: "HUND", clue: "Hunden" },
    { word: "SONNE", clue: "Solen" },
  ],
};

const MAX_WRONG = 6;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function HangmanGame({ params }: Props) {
  const { language: langId } = use(params);
  const lang = getLanguage(langId);
  const router = useRouter();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [wordData, setWordData] = useState<{ word: string; clue: string } | null>(null);
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [gameState, setGameState] = useState<"playing" | "won" | "lost">("playing");

  useEffect(() => {
    setStudent(loadStudent());
    startNewGame();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [langId]);

  function startNewGame() {
    const words = HANGMAN_WORDS[langId] ?? HANGMAN_WORDS.franska;
    const pick = words[Math.floor(Math.random() * words.length)];
    setWordData(pick);
    setGuessed(new Set());
    setGameState("playing");
  }

  function handleGuess(letter: string) {
    if (gameState !== "playing" || guessed.has(letter)) return;
    const newGuessed = new Set([...guessed, letter]);
    setGuessed(newGuessed);

    if (!wordData) return;
    const wrongCount = [...newGuessed].filter((l) => !wordData.word.includes(l)).length;
    const allRevealed = wordData.word.split("").every((l) => newGuessed.has(l));

    if (allRevealed) setGameState("won");
    else if (wrongCount >= MAX_WRONG) setGameState("lost");
  }

  if (!wordData) return null;

  const wrongGuesses = [...guessed].filter((l) => !wordData.word.includes(l));
  const wrongCount = wrongGuesses.length;

  return (
    <div className="min-h-screen bg-sky-50 dark:bg-gray-900">
      <Header student={student} />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <button onClick={() => router.push(`/world/${langId}`)} className="inline-flex items-center gap-1.5 text-sj-600 text-sm font-bold mb-4">
          ← Tillbaka
        </button>

        <div className="card mb-4">
          <h1 className="text-2xl font-black text-gray-800 dark:text-gray-100 mb-1">🎯 Hänga gubbe</h1>
          <p className="text-gray-500 text-sm">Ledtråd: <strong>{wordData.clue}</strong></p>
        </div>

        {/* Hangman figure */}
        <div className="card mb-4 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-2">
              {gameState === "won" ? "🎉" : gameState === "lost" ? "💀" : ["🙂", "😐", "😕", "😟", "😨", "😰", "😵"][wrongCount]}
            </div>
            <div className="text-sm font-bold text-gray-500">
              {MAX_WRONG - wrongCount} försök kvar
            </div>
            <div className="progress-bar-track mt-2 max-w-xs mx-auto">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${((MAX_WRONG - wrongCount) / MAX_WRONG) * 100}%`,
                  background: wrongCount >= 4 ? "linear-gradient(90deg, #ef4444, #dc2626)" : "linear-gradient(90deg, #22c55e, #16a34a)"
                }}
              />
            </div>
          </div>
        </div>

        {/* Word display */}
        <div className="card mb-4">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {wordData.word.split("").map((letter, i) => (
              <div key={i} className={`w-10 h-12 border-b-4 flex items-end justify-center pb-1 ${
                guessed.has(letter) ? "border-sj-400 text-gray-800 dark:text-gray-100" : "border-gray-300"
              }`}>
                <span className="font-black text-xl">
                  {guessed.has(letter) ? letter : ""}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Game over states */}
        {(gameState === "won" || gameState === "lost") && (
          <div className={`card mb-4 text-center ${gameState === "won" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
            <p className={`font-black text-lg mb-1 ${gameState === "won" ? "text-green-700" : "text-red-700"}`}>
              {gameState === "won" ? "🎉 Rätt! Bra jobbat!" : `😵 Fel! Ordet var: ${wordData.word}`}
            </p>
            <div className="flex gap-3 mt-3">
              <button onClick={startNewGame} className="btn-primary flex-1" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>Nästa ord</button>
              <button onClick={() => router.push(`/world/${langId}`)} className="btn-secondary flex-1 border-sj-200 text-sj-600">Tillbaka</button>
            </div>
          </div>
        )}

        {/* Keyboard */}
        {gameState === "playing" && (
          <div className="card">
            <div className="flex flex-wrap gap-1.5 justify-center">
              {ALPHABET.map((letter) => {
                const isGuessed = guessed.has(letter);
                const isCorrect = isGuessed && wordData.word.includes(letter);
                const isWrong = isGuessed && !wordData.word.includes(letter);
                return (
                  <button
                    key={letter}
                    onClick={() => handleGuess(letter)}
                    disabled={isGuessed}
                    className={`w-10 h-10 rounded-xl text-sm font-black border-2 transition-all ${
                      isCorrect
                        ? "bg-green-100 border-green-400 text-green-700"
                        : isWrong
                        ? "bg-red-100 border-red-300 text-red-400"
                        : "bg-white border-gray-200 text-gray-700 hover:border-sj-400 hover:bg-sj-50 cursor-pointer"
                    }`}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
