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

const MEMORY_CARDS: Record<string, Array<{ word: string; translation: string }>> = {
  franska: [
    { word: "bonjour", translation: "hej" },
    { word: "merci", translation: "tack" },
    { word: "chat", translation: "katt" },
    { word: "chien", translation: "hund" },
    { word: "maison", translation: "hus" },
    { word: "école", translation: "skola" },
    { word: "livre", translation: "bok" },
    { word: "eau", translation: "vatten" },
  ],
  spanska: [
    { word: "hola", translation: "hej" },
    { word: "gracias", translation: "tack" },
    { word: "gato", translation: "katt" },
    { word: "perro", translation: "hund" },
    { word: "casa", translation: "hus" },
    { word: "escuela", translation: "skola" },
    { word: "libro", translation: "bok" },
    { word: "agua", translation: "vatten" },
  ],
  tyska: [
    { word: "hallo", translation: "hej" },
    { word: "danke", translation: "tack" },
    { word: "Katze", translation: "katt" },
    { word: "Hund", translation: "hund" },
    { word: "Haus", translation: "hus" },
    { word: "Schule", translation: "skola" },
    { word: "Buch", translation: "bok" },
    { word: "Wasser", translation: "vatten" },
  ],
};

interface Card {
  id: string;
  text: string;
  pairId: number;
  isWord: boolean;
  flipped: boolean;
  matched: boolean;
}

export default function MemoryGame({ params }: Props) {
  const { language: langId } = use(params);
  const lang = getLanguage(langId);
  const router = useRouter();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    setStudent(loadStudent());
    initGame();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [langId]);

  function initGame() {
    const wordPairs = (MEMORY_CARDS[langId] ?? MEMORY_CARDS.franska).slice(0, 6);
    const newCards: Card[] = [];
    wordPairs.forEach((pair, idx) => {
      newCards.push({ id: `w-${idx}`, text: pair.word, pairId: idx, isWord: true, flipped: false, matched: false });
      newCards.push({ id: `t-${idx}`, text: pair.translation, pairId: idx, isWord: false, flipped: false, matched: false });
    });
    // Shuffle
    for (let i = newCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newCards[i], newCards[j]] = [newCards[j], newCards[i]];
    }
    setCards(newCards);
    setSelected([]);
    setMoves(0);
    setMatches(0);
    setGameOver(false);
  }

  function handleCardClick(id: string) {
    if (selected.length === 2) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.matched || card.flipped) return;

    const newSelected = [...selected, id];
    const newCards = cards.map((c) => c.id === id ? { ...c, flipped: true } : c);
    setCards(newCards);
    setSelected(newSelected);

    if (newSelected.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = newSelected.map((sid) => newCards.find((c) => c.id === sid)!);
      if (a.pairId === b.pairId && a.isWord !== b.isWord) {
        // Match!
        setTimeout(() => {
          setCards((prev) => prev.map((c) => newSelected.includes(c.id) ? { ...c, matched: true } : c));
          setSelected([]);
          const newMatches = matches + 1;
          setMatches(newMatches);
          if (newMatches === cards.length / 2) setGameOver(true);
        }, 400);
      } else {
        // No match
        setTimeout(() => {
          setCards((prev) => prev.map((c) => newSelected.includes(c.id) ? { ...c, flipped: false } : c));
          setSelected([]);
        }, 800);
      }
    }
  }

  return (
    <div className="min-h-screen bg-sky-50 dark:bg-gray-900">
      <Header student={student} />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <button onClick={() => router.push(`/world/${langId}`)} className="inline-flex items-center gap-1.5 text-sj-600 text-sm font-bold mb-4">
          ← Tillbaka
        </button>

        <div className="card mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-gray-800 dark:text-gray-100">🃏 Memory</h1>
              <p className="text-gray-500 text-sm">Matcha {lang?.name ?? "språk"}-ord med svenska</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-sj-600">{moves}</div>
              <div className="text-xs text-gray-500">drag</div>
            </div>
          </div>
        </div>

        {gameOver ? (
          <div className="card text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-2xl font-black text-gray-800 mb-2">Grattis!</h2>
            <p className="text-gray-600 mb-6">Du klarade det på {moves} drag!</p>
            <div className="flex gap-3">
              <button onClick={initGame} className="btn-primary flex-1" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>Spela igen</button>
              <button onClick={() => router.push(`/world/${langId}`)} className="btn-secondary flex-1 border-sj-200 text-sj-600">Tillbaka</button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {cards.map((card) => (
              <button
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                disabled={card.matched || card.flipped}
                className={`aspect-square rounded-xl border-3 text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer flex items-center justify-center p-1 text-center leading-tight ${
                  card.matched
                    ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                    : card.flipped
                    ? "border-sj-400 bg-sj-50 text-sj-700"
                    : "border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-600 text-transparent hover:border-sj-300 hover:bg-sj-50/50"
                }`}
                style={{ boxShadow: "0 3px 0 0 rgba(0,0,0,0.08)" }}
              >
                {(card.flipped || card.matched) ? card.text : "?"}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
