"use client";

import { useState, useRef } from "react";
import type { WordCluesExercise } from "@/lib/types";
import { getCorrectMessage } from "@/lib/feedback";

interface Props {
  exercise: WordCluesExercise;
  onAnswer: (correct: boolean) => void;
  isLast?: boolean;
}

export default function WordClues({ exercise, onAnswer, isLast }: Props) {
  const [input, setInput] = useState("");
  const [state, setState] = useState<"idle" | "correct" | "wrong">("idle");
  const [correctMsg, setCorrectMsg] = useState("");
  const [showHint, setShowHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function normalize(s: string) {
    return s.trim().toLowerCase();
  }

  function handleSubmit() {
    if (state !== "idle" || !input.trim()) return;
    const given = normalize(input);
    const expected = normalize(exercise.answer);
    const alternatives = (exercise.alternativeAnswers ?? []).map(normalize);
    const correct = given === expected || alternatives.includes(given);
    if (correct) setCorrectMsg(getCorrectMessage());
    setState(correct ? "correct" : "wrong");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSubmit();
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">🔍</span>
        <span className="text-sm font-bold text-sv-600 dark:text-sv-300 uppercase tracking-wide">
          Kluring – vad är det?
        </span>
      </div>

      {/* Clues */}
      <div className="space-y-2">
        {exercise.clues.map((clue, i) => (
          <div
            key={i}
            className="flex items-start gap-3 bg-sv-50 dark:bg-sv-900/20 border border-sv-200 dark:border-sv-700 rounded-xl px-4 py-3"
          >
            <span className="text-sv-400 dark:text-sv-500 font-bold text-base mt-0.5 flex-shrink-0">→</span>
            <span className="text-sv-900 dark:text-sv-100 text-base font-medium">{clue}</span>
          </div>
        ))}
      </div>

      {exercise.hint && (
        <div className="rounded-xl overflow-hidden border border-amber-200 dark:border-amber-700">
          <button
            onClick={() => setShowHint(!showHint)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 text-sm font-medium hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
          >
            <span className="flex items-center gap-2"><span>💡</span><span>Tips</span></span>
            <span className="text-amber-500 text-xs">{showHint ? "▲" : "▼"}</span>
          </button>
          {showHint && (
            <div className="px-4 py-3 text-sm text-amber-900 dark:text-amber-200 bg-amber-50/60 dark:bg-amber-900/10 border-t border-amber-200 dark:border-amber-700">
              {exercise.hint}
            </div>
          )}
        </div>
      )}

      {state === "idle" && (
        <div className={`flex gap-2 rounded-xl border-2 overflow-hidden transition-colors border-sv-300 bg-white dark:bg-gray-700 dark:border-sv-600 focus-within:border-sv-500`}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Skriv ditt svar här..."
            className="flex-1 px-4 py-3 text-lg bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          <button
            onClick={handleSubmit}
            aria-label="Svara"
            disabled={!input.trim()}
            className="px-5 py-3 disabled:bg-gray-200 text-white font-semibold transition-colors"
            style={{ background: input.trim() ? "#006AA7" : undefined }}
          >
            ✓
          </button>
        </div>
      )}

      {state !== "idle" && (
        <div
          className={`rounded-xl p-4 border animate-slide-up ${
            state === "correct"
              ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-800 dark:text-green-300"
              : "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-800 dark:text-red-300"
          }`}
        >
          <p className="font-semibold">
            {state === "correct" ? correctMsg : `✗ Fel. Rätt svar: "${exercise.answer}"`}
          </p>
          {exercise.explanation && (
            <p className="text-sm mt-1 opacity-80">💡 {exercise.explanation}</p>
          )}
        </div>
      )}

      {state !== "idle" && (
        <div className="flex justify-end pt-2">
          <button
            onClick={() => onAnswer(state === "correct")}
            className="btn-primary animate-slide-up"
            style={{ background: "linear-gradient(135deg, #006AA7, #004a75)" }}
          >
            {isLast ? "Visa resultat →" : "Nästa fråga →"}
          </button>
        </div>
      )}
    </div>
  );
}
