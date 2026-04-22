"use client";

import { useState, useEffect } from "react";
import type { FonemExercise } from "@/lib/types";

interface Props {
  exercise: FonemExercise;
  onAnswer: (correct: boolean) => void;
}

// ─── Speech ───────────────────────────────────────────────────────────────────

function speak(text: string, slow = false) {
  if (typeof window === "undefined") return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = "sv-SE";
  utt.rate = slow ? 0.45 : 0.82;
  utt.pitch = 1.15;
  synth.speak(utt);
}

// ─── Shared sub-components ───────────────────────────────────────────────────

function PlayBtn({
  text,
  slow,
  label,
  size = "md",
}: {
  text: string;
  slow?: boolean;
  label: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "lg" ? "px-7 py-4 text-xl gap-3"
    : size === "sm" ? "px-3 py-2 text-sm gap-1.5"
    : "px-5 py-3 text-base gap-2";
  return (
    <button
      onClick={() => speak(text, slow)}
      className={`inline-flex items-center font-bold text-white rounded-2xl shadow-md active:scale-95 transition-transform select-none ${sizeClass}`}
      style={{ background: "linear-gradient(135deg, #0ea5e9, #0369a1)", boxShadow: "0 3px 0 0 #0369a1" }}
    >
      <span>🔊</span>
      <span>{label}</span>
    </button>
  );
}

function OptionBtn({
  label,
  onClick,
  state,
  large,
}: {
  label: string;
  onClick: () => void;
  state: "idle" | "correct" | "wrong" | "highlight";
  large?: boolean;
}) {
  const base = `w-full font-black rounded-2xl border-3 transition-all duration-200 select-none active:scale-95 ${large ? "py-6 text-4xl" : "py-4 text-xl"}`;
  const colors =
    state === "correct" ? "bg-green-100 dark:bg-green-900/40 border-green-400 text-green-700 dark:text-green-300 scale-105"
    : state === "wrong"   ? "bg-red-100 dark:bg-red-900/30 border-red-400 text-red-600 dark:text-red-400"
    : state === "highlight" ? "bg-green-50 dark:bg-green-900/30 border-green-300 text-green-700 dark:text-green-300"
    : "bg-white dark:bg-gray-700 border-sv-100 dark:border-gray-600 text-gray-800 dark:text-gray-100 hover:border-sv-300 dark:hover:border-gray-400";
  return (
    <button onClick={onClick} disabled={state !== "idle"} className={`${base} ${colors}`}>
      {label}
    </button>
  );
}

function FeedbackLine({ correct, correctLabel }: { correct: boolean; correctLabel?: string }) {
  return (
    <p className={`text-center font-black text-lg mt-1 ${correct ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
      {correct ? "🎉 Rätt!" : correctLabel ? `Rätt svar: ${correctLabel}` : "Försök igen!"}
    </p>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function FonemExerciseComponent({ exercise, onAnswer }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  // For listen-and-write
  const [typed, setTyped] = useState<string[]>([]);
  const [letterPool, setLetterPool] = useState<string[]>([]);
  const [writeAnswered, setWriteAnswered] = useState(false);
  const [writeCorrect, setWriteCorrect] = useState(false);

  useEffect(() => {
    setSelected(null);
    setAnswered(false);
    setTyped([]);
    setWriteAnswered(false);
    setWriteCorrect(false);

    if (exercise.type === "listen-and-write" && exercise.answer) {
      // Build letter pool from answer letters + distractor options, then shuffle
      const letters: string[] = [];
      for (const ch of exercise.answer) letters.push(ch);
      for (const ch of (exercise.options ?? [])) letters.push(ch);
      for (let i = letters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [letters[i], letters[j]] = [letters[j], letters[i]];
      }
      setLetterPool(letters);
    }
  }, [exercise.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function choose(index: number) {
    if (answered) return;
    const correct = index === exercise.correctIndex;
    setSelected(index);
    setAnswered(true);
    setTimeout(() => {
      if (!correct) speak(exercise.speakText, true);
      onAnswer(correct);
    }, 1000);
  }

  function optionState(i: number): "idle" | "correct" | "wrong" | "highlight" {
    if (!answered) return "idle";
    if (i === exercise.correctIndex) return "correct";
    if (i === selected) return "wrong";
    return "idle";
  }

  // ── sound-choice & word-first-sound ────────────────────────────────────────
  if (exercise.type === "sound-choice" || exercise.type === "word-first-sound") {
    const isWordType = exercise.type === "word-first-sound";
    const cols = (exercise.options?.length ?? 3) <= 3 ? "grid-cols-3" : "grid-cols-2";
    return (
      <div className="space-y-6">
        <p className="text-lg font-bold text-center text-gray-700 dark:text-gray-200">{exercise.question}</p>
        <div className="flex justify-center">
          <PlayBtn
            text={exercise.speakText}
            label={isWordType ? exercise.speakText : "Lyssna på ljudet"}
            size="lg"
          />
        </div>
        {isWordType && (
          <PlayBtn text={exercise.speakText} slow label="Lyssna långsamt" size="sm" />
        )}
        <div className={`grid ${cols} gap-3`}>
          {(exercise.options ?? []).map((opt, i) => (
            <OptionBtn
              key={i}
              label={opt}
              onClick={() => choose(i)}
              state={optionState(i)}
              large
            />
          ))}
        </div>
        {answered && (
          <FeedbackLine
            correct={selected === exercise.correctIndex}
            correctLabel={exercise.options?.[exercise.correctIndex!]}
          />
        )}
        {answered && exercise.explanation && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 italic">{exercise.explanation}</p>
        )}
      </div>
    );
  }

  // ── blend-sounds ───────────────────────────────────────────────────────────
  if (exercise.type === "blend-sounds") {
    return (
      <div className="space-y-6">
        <p className="text-lg font-bold text-center text-gray-700 dark:text-gray-200">{exercise.question}</p>
        <div className="flex justify-center flex-wrap gap-3">
          {(exercise.sounds ?? []).map((s, i) => (
            <button
              key={i}
              onClick={() => speak(s)}
              className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center gap-0.5 font-black text-2xl border-3 border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 active:scale-95 transition-transform select-none"
            >
              <span className="text-xs leading-none">🔊</span>
              <span>{s}</span>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(exercise.options ?? []).map((opt, i) => (
            <OptionBtn key={i} label={opt} onClick={() => choose(i)} state={optionState(i)} />
          ))}
        </div>
        {answered && (
          <FeedbackLine
            correct={selected === exercise.correctIndex}
            correctLabel={exercise.options?.[exercise.correctIndex!]}
          />
        )}
        {answered && exercise.explanation && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 italic">{exercise.explanation}</p>
        )}
      </div>
    );
  }

  // ── combine-morphemes ──────────────────────────────────────────────────────
  if (exercise.type === "combine-morphemes") {
    return (
      <div className="space-y-6">
        <p className="text-lg font-bold text-center text-gray-700 dark:text-gray-200">{exercise.question}</p>
        <div className="flex justify-center items-center gap-2 flex-wrap">
          {(exercise.morphemes ?? []).map((m, i) => (
            <button
              key={i}
              onClick={() => speak(m)}
              className="px-4 py-3 rounded-2xl text-lg font-bold border-3 border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 flex items-center gap-2 active:scale-95 transition-transform select-none"
            >
              <span>🔊</span>
              <span>{m}</span>
            </button>
          ))}
          {(exercise.morphemes ?? []).length === 2 && (
            <span className="text-2xl font-black text-gray-400">+</span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(exercise.options ?? []).map((opt, i) => (
            <OptionBtn key={i} label={opt} onClick={() => choose(i)} state={optionState(i)} />
          ))}
        </div>
        {answered && (
          <FeedbackLine
            correct={selected === exercise.correctIndex}
            correctLabel={exercise.options?.[exercise.correctIndex!]}
          />
        )}
        {answered && exercise.explanation && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 italic">{exercise.explanation}</p>
        )}
      </div>
    );
  }

  // ── listen-and-write ───────────────────────────────────────────────────────
  if (exercise.type === "listen-and-write") {
    const word = exercise.answer ?? "";
    const blanks = Array.from({ length: word.length }, (_, i) => typed[i] ?? "");
    const allFilled = typed.length === word.length;

    function tapLetter(letter: string) {
      if (writeAnswered || typed.length >= word.length) return;
      const newTyped = [...typed, letter];
      setTyped(newTyped);
      if (newTyped.length === word.length) {
        const correct = newTyped.join("") === word;
        setWriteCorrect(correct);
        setWriteAnswered(true);
        setTimeout(() => {
          if (!correct) speak(exercise.speakText, true);
          onAnswer(correct);
        }, 1100);
      }
    }

    function backspace() {
      if (writeAnswered) return;
      setTyped((prev) => prev.slice(0, -1));
    }

    return (
      <div className="space-y-6">
        <p className="text-lg font-bold text-center text-gray-700 dark:text-gray-200">{exercise.question}</p>
        <div className="flex justify-center gap-3 flex-wrap">
          <PlayBtn text={exercise.speakText} label="Lyssna" size="lg" />
          <PlayBtn text={exercise.speakText} slow label="Långsamt" size="md" />
        </div>

        {/* Blank slots */}
        <div className="flex justify-center gap-2">
          {blanks.map((ch, i) => {
            const filled = ch !== "";
            const isCorrectCh = writeAnswered && ch === word[i];
            const isWrongCh = writeAnswered && ch !== "" && ch !== word[i];
            return (
              <div
                key={i}
                className={`w-12 h-14 rounded-xl border-3 flex items-center justify-center text-2xl font-black transition-colors ${
                  isCorrectCh ? "bg-green-100 border-green-400 text-green-700"
                  : isWrongCh  ? "bg-red-100 border-red-400 text-red-600"
                  : filled     ? "bg-white dark:bg-gray-700 border-sv-300 dark:border-gray-500 text-gray-900 dark:text-gray-100"
                  : "bg-sv-50 dark:bg-gray-800 border-sv-200 dark:border-gray-600"
                }`}
              >
                {ch}
              </div>
            );
          })}
        </div>

        {/* Letter buttons */}
        {!writeAnswered && (
          <div className="flex flex-wrap justify-center gap-2">
            {letterPool.map((letter, i) => (
              <button
                key={i}
                onClick={() => tapLetter(letter)}
                disabled={allFilled}
                className="w-12 h-12 rounded-xl border-3 border-sv-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-xl font-black active:scale-90 transition-transform select-none hover:border-sv-400 dark:hover:border-gray-400 disabled:opacity-30"
              >
                {letter}
              </button>
            ))}
            {typed.length > 0 && (
              <button
                onClick={backspace}
                className="w-12 h-12 rounded-xl border-3 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 text-lg font-black active:scale-90 transition-transform select-none"
              >
                ⌫
              </button>
            )}
          </div>
        )}

        {writeAnswered && (
          <FeedbackLine correct={writeCorrect} correctLabel={writeCorrect ? undefined : word} />
        )}
        {writeAnswered && exercise.explanation && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 italic">{exercise.explanation}</p>
        )}
      </div>
    );
  }

  return null;
}
