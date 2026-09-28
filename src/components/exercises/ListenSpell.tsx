"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ListenSpellExercise } from "@/lib/types";
import { getCorrectMessage } from "@/lib/feedback";
import { isAnswerCorrect } from "@/lib/answers";

interface Props {
  exercise: ListenSpellExercise;
  onAnswer: (correct: boolean) => void;
  isLast?: boolean;
}

function hasSpeech(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function swedishVoice(): SpeechSynthesisVoice | undefined {
  return window.speechSynthesis
    .getVoices()
    .find((v) => v.lang.toLowerCase().replace("_", "-").startsWith("sv"));
}

function utterance(text: string, rate: number): SpeechSynthesisUtterance {
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "sv-SE";
  utter.rate = rate;
  const svVoice = swedishVoice();
  if (svVoice) utter.voice = svVoice;
  return utter;
}

/** Pause between the word and its context sentence, counted from when the word ends. */
const SENTENCE_PAUSE_MS = 400;

/** Covers the word in the context sentence, so the sentence can be read as a clue. */
function sentenceWithGap(sentence: string, word: string): string {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return sentence.replace(new RegExp(escaped, "gi"), "___");
}

export default function ListenSpell({ exercise, onAnswer, isLast }: Props) {
  const [input, setInput] = useState("");
  const [state, setState] = useState<"idle" | "correct" | "wrong">("idle");
  const [correctMsg, setCorrectMsg] = useState("");
  const [showHint, setShowHint] = useState(false);
  // Move focus to "Nästa fråga" once the answer is shown, so Enter continues
  // and a keyboard or screen-reader user lands on what comes next.
  const nextRef = useRef<HTMLButtonElement>(null);
  const answered = state !== "idle";
  useEffect(() => {
    if (answered) nextRef.current?.focus();
  }, [answered]);
  const [hasSpoken, setHasSpoken] = useState(false);
  // "unknown" until the voice list has loaded: Chrome fills it asynchronously,
  // and claiming there is no Swedish voice before then would be wrong.
  const [voice, setVoice] = useState<"unknown" | "ok" | "no-swedish" | "unsupported">("unknown");
  const pauseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Bumped on every new request and on unmount, so a word that finishes after
  // the pupil has pressed again (or left) does not start a stale sentence.
  const speakToken = useRef(0);

  useEffect(() => {
    if (!hasSpeech()) {
      setVoice("unsupported");
      return;
    }
    const synth = window.speechSynthesis;
    const check = (final: boolean) => {
      if (swedishVoice()) setVoice("ok");
      else if (final || synth.getVoices().length > 0) setVoice("no-swedish");
    };
    const onVoices = () => check(false);
    check(false);
    synth.addEventListener?.("voiceschanged", onVoices);
    // Some browsers never fire voiceschanged; decide after a moment anyway.
    const giveUp = setTimeout(() => check(true), 2000);
    return () => {
      clearTimeout(giveUp);
      synth.removeEventListener?.("voiceschanged", onVoices);
      speakToken.current++;
      if (pauseTimer.current) clearTimeout(pauseTimer.current);
      synth.cancel();
    };
  }, []);

  const handleSpeak = useCallback(() => {
    setHasSpoken(true);
    if (!hasSpeech()) return;
    const synth = window.speechSynthesis;
    const token = ++speakToken.current;
    if (pauseTimer.current) clearTimeout(pauseTimer.current);
    synth.cancel();
    const word = utterance(exercise.word, 0.85);
    if (exercise.sentence) {
      // Queue the context sentence after the word has finished. A fixed delay
      // cut long words off, because speaking again cancels what is playing.
      const sentence = exercise.sentence;
      word.onend = () => {
        if (token !== speakToken.current) return;
        pauseTimer.current = setTimeout(() => {
          if (token !== speakToken.current) return;
          synth.speak(utterance(sentence, 0.95));
        }, SENTENCE_PAUSE_MS);
      };
    }
    synth.speak(word);
  }, [exercise.word, exercise.sentence]);

  function handleSubmit() {
    if (state !== "idle" || !input.trim()) return;
    const correct = isAnswerCorrect(input, exercise.word);
    if (correct) setCorrectMsg(getCorrectMessage());
    setState(correct ? "correct" : "wrong");
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <p className="text-base sm:text-lg font-medium text-gray-800 dark:text-gray-100">
        Lyssna på ordet och stava det rätt!
      </p>

      {/* Listen button */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleSpeak}
          className="flex flex-col items-center gap-2 px-10 py-6 rounded-3xl border-3 border-sv-300 bg-gradient-to-b from-sky-50 to-blue-100 dark:from-sky-900/40 dark:to-blue-900/20 dark:border-sv-600 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          style={{ boxShadow: "0 5px 0 0 rgba(0,106,167,0.25), inset 0 2px 4px 0 rgba(255,255,255,0.7)" }}
        >
          <span className="text-5xl animate-pulse-slow">🔊</span>
          <span className="font-black text-sv-800 dark:text-sv-300">
            {hasSpoken ? "Lyssna igen" : "Lyssna på ordet"}
          </span>
        </button>
      </div>

      {(voice === "unsupported" || voice === "no-swedish") && (
        <div
          role="status"
          className="rounded-xl border border-sky-200 dark:border-sky-700 bg-sky-50 dark:bg-sky-900/20 px-4 py-3 text-sm text-sky-900 dark:text-sky-200 space-y-1"
        >
          <p className="font-semibold">
            {voice === "unsupported"
              ? "🙉 Den här webbläsaren kan tyvärr inte läsa upp ord."
              : "🙉 Den här enheten har ingen svensk röst, så uppläsningen kan låta konstig."}
          </p>
          <p>
            {exercise.sentence
              ? <>Ingen fara! Här är meningen i stället – skriv ordet som fattas: <span className="font-bold">”{sentenceWithGap(exercise.sentence, exercise.word)}”</span></>
              : "Ingen fara! Be en kompis eller vuxen läsa ordet för dig, eller titta på tipset."}
          </p>
        </div>
      )}

      {exercise.hint && (
        <div className="rounded-xl overflow-hidden border border-amber-200 dark:border-amber-700">
          <button
            onClick={() => setShowHint(!showHint)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 text-sm font-medium hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
          >
            <span className="flex items-center gap-2"><span>💡</span><span>Tips</span></span>
            <span className="text-amber-700 text-xs dark:text-amber-300">{showHint ? "▲" : "▼"}</span>
          </button>
          {showHint && (
            <div className="px-4 py-3 text-sm text-amber-900 dark:text-amber-200 bg-amber-50/60 dark:bg-amber-900/10 border-t border-amber-200 dark:border-amber-700">
              {exercise.hint}
            </div>
          )}
        </div>
      )}

      {state === "idle" && (
        <div className="flex gap-2 rounded-xl border-2 overflow-hidden transition-colors border-sv-300 bg-white dark:bg-gray-700 dark:border-sv-600 focus-within:border-sv-500">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSubmit(); } }}
            placeholder="Stava ordet här..."
            className="flex-1 px-4 py-3 text-lg bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-600 dark:placeholder:text-gray-500"
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
            {state === "correct" ? correctMsg : `✗ Fel. Rätt stavning: "${exercise.word}"`}
          </p>
          {exercise.explanation && (
            <p className="text-sm mt-1 opacity-80">💡 {exercise.explanation}</p>
          )}
        </div>
      )}

      {state !== "idle" && (
        <div className="flex justify-end pt-2">
          <button
            ref={nextRef}
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
