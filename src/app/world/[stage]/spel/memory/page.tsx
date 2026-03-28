"use client";

import { useState, useEffect, useCallback, useRef, use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/ui/Header";
import { loadStudent } from "@/lib/storage";
import { getStage } from "@/lib/stages";
import type { StudentData } from "@/lib/types";

// ── Begrepp–förklaring-par per stadienivå ─────────────────────────────────────

const CONCEPT_PAIRS: Record<string, { term: string; def: string }[]> = {
  lagstadiet: [
    { term: "substantiv",    def: "namn på saker, djur, personer" },
    { term: "verb",          def: "ord som beskriver en handling" },
    { term: "adjektiv",      def: "ord som beskriver hur något är" },
    { term: "vokal",         def: "a, e, i, o, u, y, å, ä, ö" },
    { term: "konsonant",     def: "bokstav som inte är vokal" },
    { term: "punkt",         def: "sätts i slutet av en mening" },
    { term: "frågetecken",   def: "sätts efter en fråga" },
    { term: "stor bokstav",  def: "börjar varje ny mening" },
    { term: "synonym",       def: "ord med liknande betydelse" },
    { term: "motsatsord",    def: "ord med motsatt betydelse" },
    { term: "rim",           def: "ord som slutar på samma ljud" },
    { term: "stavelse",      def: "en del av ett ord med vokalljud" },
    { term: "mening",        def: "ord som bildar en hel tanke" },
    { term: "rubrik",        def: "titeln på en text" },
    { term: "utropstecken",  def: "sätts efter ett utrop eller order" },
    { term: "komma",         def: "skiljetecken för paus i meningen" },
    { term: "alfabet",       def: "alla bokstäver i ordning" },
    { term: "berättelse",    def: "text som beskriver händelser" },
    { term: "dialog",        def: "samtal mellan personer i text" },
    { term: "talstreck",     def: "markerar vad någon säger" },
  ],
  mellanstadiet: [
    { term: "subjekt",       def: "vem eller vad meningen handlar om" },
    { term: "predikat",      def: "verbets funktion i meningen" },
    { term: "objekt",        def: "det som påverkas av handlingen" },
    { term: "adverbial",     def: "beskriver hur, när eller var" },
    { term: "pronomen",      def: "ersätter substantiv (han, hon, det)" },
    { term: "nutid",         def: "något händer just nu (presens)" },
    { term: "dåtid",         def: "något hände förr (preteritum)" },
    { term: "framtid",       def: "något kommer att hända" },
    { term: "sammansatt ord",def: "två ord satta ihop till ett" },
    { term: "särskrivning",  def: "felaktig uppdelning av sammansatt ord" },
    { term: "adjektiv",      def: "beskriver substantivets egenskaper" },
    { term: "adverb",        def: "beskriver hur ett verb utförs" },
    { term: "tempus",        def: "verbets tidsform" },
    { term: "stycke",        def: "grupp meningar om samma ämne" },
    { term: "talstreck",     def: "markerar repliker i dialog" },
    { term: "sj-ljud",       def: "ljud som stavas sj, sk, stj eller sch" },
    { term: "dubbelteckning", def: "dubbel konsonant efter kort vokal" },
    { term: "inledning",     def: "textens början som fångar läsaren" },
    { term: "avslutning",    def: "textens slut som rundar av" },
    { term: "källkritik",    def: "granskning av en källas trovärdighet" },
  ],
  hogstadiet: [
    { term: "bisats",        def: "underordnad sats med subjunktion" },
    { term: "huvudsats",     def: "självständig sats som kan stå ensam" },
    { term: "subjunktion",   def: "ord som inleder bisats (att, om, när)" },
    { term: "infinitiv",     def: "verbets grundform (att springa)" },
    { term: "particip",      def: "verbform som fungerar som adjektiv" },
    { term: "aktiv",         def: "subjektet utför handlingen" },
    { term: "passiv",        def: "subjektet utsätts för handlingen" },
    { term: "kongruens",     def: "böjningsöverensstämmelse i meningen" },
    { term: "nominalfras",   def: "substantiv med bestämningar" },
    { term: "preposition",   def: "anger relation i rum eller tid (på, i, av)" },
    { term: "ordföljd",      def: "ordningens placering i meningen" },
    { term: "inversion",     def: "subjektet kommer efter predikatet" },
    { term: "syftningsfel",  def: "oklart vad ett pronomen syftar på" },
    { term: "formellt språk",def: "officiellt och neutralt språkbruk" },
    { term: "informellt språk", def: "vardagligt och personligt språkbruk" },
    { term: "retorik",       def: "konsten att tala och skriva övertygande" },
    { term: "argument",      def: "skäl som stödjer ett påstående" },
    { term: "tes",           def: "det påstående man vill bevisa" },
    { term: "motargument",   def: "invändning mot ett argument" },
    { term: "genre",         def: "typ av text med gemensamma drag" },
  ],
  gymnasiet: [
    { term: "logos",         def: "förnuftsbaserat argument" },
    { term: "etos",          def: "talarens trovärdighet och karaktär" },
    { term: "patos",         def: "känslobaserat argument" },
    { term: "nominalisering",def: "verb omvandlat till substantiv" },
    { term: "stilnivå",      def: "graden av formellt eller informellt språk" },
    { term: "denotation",    def: "ords direkta, bokstavliga betydelse" },
    { term: "konnotation",   def: "ords associativa bibetydelse" },
    { term: "metafor",       def: "bildlig jämförelse utan 'som'" },
    { term: "ironi",         def: "säga det motsatta av det man menar" },
    { term: "hyperbol",      def: "medveten överdrift för effekt" },
    { term: "anafor",        def: "upprepning av ord i meningsbörjan" },
    { term: "allitteration", def: "upprepning av begynnelseljud" },
    { term: "perspektiv",    def: "synvinkel som texten betraktas från" },
    { term: "implicit",      def: "underförstått, inte direkt uttryckt" },
    { term: "explicit",      def: "direkt och tydligt uttryckt" },
    { term: "diskurs",       def: "mönster för hur vi talar om ett ämne" },
    { term: "intertextualitet", def: "hänvisning till andra texter" },
    { term: "polyfoni",      def: "många röster och perspektiv i en text" },
    { term: "narrativ",      def: "en berättelse eller berättelsestruktur" },
    { term: "kohesion",      def: "textens inre sammanhang och bindning" },
  ],
};

// ── Typer ─────────────────────────────────────────────────────────────────────

type Difficulty = "easy" | "medium" | "hard";
type Phase = "select" | "playing" | "victory";

interface MemCard {
  uid: number;
  pairId: number;
  side: "term" | "def";
  word: string;
  flipped: boolean;
  matched: boolean;
}

const PAIR_COUNTS: Record<Difficulty, number> = { easy: 4, medium: 6, hard: 9 };
const DIFF_LABELS: Record<Difficulty, string> = { easy: "Lätt", medium: "Medel", hard: "Svår" };
const DIFF_EMOJIS: Record<Difficulty, string> = { easy: "🟢", medium: "🟡", hard: "🔴" };

// ── Hjälpfunktioner ───────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildCards(stageId: string, difficulty: Difficulty): MemCard[] {
  const count = PAIR_COUNTS[difficulty];
  const pairs = shuffle(CONCEPT_PAIRS[stageId] ?? CONCEPT_PAIRS.lagstadiet).slice(0, count);
  const cards: MemCard[] = [];
  pairs.forEach((pair, pairId) => {
    cards.push({ uid: pairId * 2,     pairId, side: "term", word: pair.term, flipped: false, matched: false });
    cards.push({ uid: pairId * 2 + 1, pairId, side: "def",  word: pair.def,  flipped: false, matched: false });
  });
  return shuffle(cards);
}

// ── Sida ──────────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ stage: string }>;
}

export default function MemoryGamePage({ params }: Props) {
  const { stage: stageId } = use(params);
  const stage = getStage(stageId);
  const [student, setStudent] = useState<StudentData | null>(null);

  useEffect(() => { setStudent(loadStudent()); }, []);

  if (!stage) return notFound();

  return <MemoryGame stageId={stageId} stage={stage} student={student} />;
}

// ── Spelkomponent ─────────────────────────────────────────────────────────────

function MemoryGame({ stageId, stage, student }: {
  stageId: string;
  stage: ReturnType<typeof getStage> & object;
  student: StudentData | null;
}) {
  const [phase, setPhase]           = useState<Phase>("select");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [cards, setCards]           = useState<MemCard[]>([]);
  const [flippedUids, setFlippedUids] = useState<number[]>([]);
  const [moves, setMoves]           = useState(0);
  const [matches, setMatches]       = useState(0);
  const [seconds, setSeconds]       = useState(0);
  const [locked, setLocked]         = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef(0);

  const totalPairs = PAIR_COUNTS[difficulty];

  useEffect(() => {
    if (phase === "playing") {
      startRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setSeconds(Math.floor((Date.now() - startRef.current) / 1000));
      }, 500);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const startGame = useCallback((diff: Difficulty) => {
    setDifficulty(diff);
    setCards(buildCards(stageId, diff));
    setFlippedUids([]);
    setMoves(0);
    setMatches(0);
    setSeconds(0);
    setLocked(false);
    setPhase("playing");
  }, [stageId]);

  const handleCardClick = useCallback((uid: number) => {
    if (locked) return;
    const card = cards.find(c => c.uid === uid);
    if (!card || card.flipped || card.matched) return;
    if (flippedUids.includes(uid)) return;

    const newFlipped = [...flippedUids, uid];
    setCards(prev => prev.map(c => c.uid === uid ? { ...c, flipped: true } : c));
    setFlippedUids(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      setLocked(true);
      const [uid1, uid2] = newFlipped;
      const c1 = cards.find(c => c.uid === uid1)!;
      const c2 = card;

      setTimeout(() => {
        const isMatch = c1.pairId === c2.pairId && c1.side !== c2.side;
        if (isMatch) {
          setCards(prev => prev.map(c =>
            c.uid === uid1 || c.uid === uid2 ? { ...c, matched: true, flipped: true } : c
          ));
          const newMatches = matches + 1;
          setMatches(newMatches);
          if (newMatches >= totalPairs) {
            if (timerRef.current) clearInterval(timerRef.current);
            setTimeout(() => setPhase("victory"), 600);
          }
        } else {
          setCards(prev => prev.map(c =>
            c.uid === uid1 || c.uid === uid2 ? { ...c, flipped: false } : c
          ));
        }
        setFlippedUids([]);
        setLocked(false);
      }, 900);
    }
  }, [locked, cards, flippedUids, matches, totalPairs]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeStr = mins > 0 ? `${mins}:${secs.toString().padStart(2, "0")}` : `${secs}s`;
  const score = Math.max(10, 200 - moves * 3 - Math.floor(seconds / 5));

  const gridCols = difficulty === "hard" ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-4";

  // ── Välj svårighetsgrad ────────────────────────────────────────────────────
  if (phase === "select") {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
        <Header student={student} />
        <div className="flex-1 max-w-md mx-auto w-full px-4 py-8 pt-24">
          <Link
            href={`/world/${stageId}`}
            className="inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm mb-6"
          >
            ← Tillbaka till Spel
          </Link>

          <div className="text-center mb-8">
            <div className="text-6xl mb-3">🃏</div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 mb-1">Memory</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Para ihop grammatikbegrepp med rätt förklaring!</p>
          </div>

          <div className="space-y-3">
            {(["easy", "medium", "hard"] as Difficulty[]).map((diff) => (
              <button
                key={diff}
                onClick={() => startGame(diff)}
                className={`w-full border-3 rounded-2xl p-4 text-left transition-all hover:-translate-y-0.5 cursor-pointer bg-white dark:bg-gray-800 ${stage!.borderClass}`}
                style={{ boxShadow: "0 4px 0 0 rgba(0,0,0,0.08)" }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{DIFF_EMOJIS[diff]}</span>
                    <div>
                      <p className="font-black text-gray-900 dark:text-gray-100 text-base">{DIFF_LABELS[diff]}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">{PAIR_COUNTS[diff] * 2} kort – {PAIR_COUNTS[diff]} par att hitta</p>
                    </div>
                  </div>
                  <span className="text-gray-300 dark:text-gray-600 text-xl">→</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Seger ──────────────────────────────────────────────────────────────────
  if (phase === "victory") {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
        <Header student={student} />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-sm w-full text-center">
            <div className="text-7xl mb-4 animate-bounce">🎉</div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 mb-1">Grattis!</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Du hittade alla {totalPairs} par!</p>

            <div
              className={`border-3 ${stage!.borderClass} rounded-2xl p-5 mb-6 grid grid-cols-3 gap-3 text-center`}
              style={{ boxShadow: "0 4px 0 0 rgba(0,0,0,0.08)" }}
            >
              <div>
                <p className={`text-2xl font-black ${stage!.textClass}`}>{score}</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs">Poäng</p>
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{moves}</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs">Försök</p>
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{timeStr}</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs">Tid</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => startGame(difficulty)}
                className={`w-full py-3 rounded-2xl font-black text-white text-lg ${stage!.colorClass} cursor-pointer`}
                style={{ boxShadow: "0 4px 0 0 rgba(0,0,0,0.2)" }}
              >
                Spela igen – {DIFF_LABELS[difficulty]}
              </button>
              <button
                onClick={() => setPhase("select")}
                className="w-full py-3 rounded-2xl font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition cursor-pointer"
              >
                Välj svårighetsgrad
              </button>
              <Link
                href={`/world/${stageId}`}
                className={`${stage!.textClass} text-sm font-semibold hover:opacity-70 transition`}
              >
                ← Tillbaka till Spel
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Spelvyn ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <Header student={student} />
      <div className="flex-1 max-w-lg mx-auto w-full px-3 py-4 pt-20">
        {/* HUD */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setPhase("select")}
            className={`${stage!.textClass} text-sm font-semibold hover:opacity-70 transition cursor-pointer`}
          >
            ← Avsluta
          </button>
          <div className="flex items-center gap-3 text-sm font-bold text-gray-600 dark:text-gray-300">
            <span>⏱ {timeStr}</span>
            <span>🔄 {moves}</span>
            <span className={stage!.textClass}>✓ {matches}/{totalPairs}</span>
          </div>
        </div>

        {/* Förloppsindikator */}
        <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full mb-4 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${stage!.colorClass}`}
            style={{ width: `${(matches / totalPairs) * 100}%` }}
          />
        </div>

        {/* Förklaring av kortfärger */}
        <div className="flex gap-4 mb-3 justify-center text-xs text-gray-400 dark:text-gray-500 font-semibold">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-violet-200 dark:bg-violet-800 inline-block" />
            📖 Begrepp
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-amber-200 dark:bg-amber-800 inline-block" />
            💡 Förklaring
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-800 inline-block" />
            ✓ Match!
          </span>
        </div>

        {/* Kortgrid */}
        <div className={`grid ${gridCols} gap-2`}>
          {cards.map(card => (
            <CardTile
              key={card.uid}
              card={card}
              stageEmoji={stage!.emoji}
              onClick={handleCardClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Korttile ──────────────────────────────────────────────────────────────────

function CardTile({ card, stageEmoji, onClick }: {
  card: MemCard;
  stageEmoji: string;
  onClick: (uid: number) => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const bgClass = card.matched
    ? "bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-600"
    : card.flipped
      ? card.side === "term"
        ? "bg-violet-100 dark:bg-violet-900/40 border-violet-300 dark:border-violet-600"
        : "bg-amber-100 dark:bg-amber-900/40 border-amber-300 dark:border-amber-600"
      : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-750";

  const textClass = card.matched
    ? "text-green-800 dark:text-green-200"
    : card.flipped
      ? card.side === "term"
        ? "text-violet-800 dark:text-violet-200"
        : "text-amber-800 dark:text-amber-200"
      : "text-gray-300 dark:text-gray-600";

  return (
    <button
      onClick={() => onClick(card.uid)}
      disabled={card.flipped || card.matched}
      className={`relative min-h-[80px] rounded-xl border-2 flex flex-col items-center justify-center p-2 font-bold transition-all duration-200 select-none cursor-pointer ${bgClass}
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
        ${!card.flipped && !card.matched ? "active:scale-95" : ""}
      `}
      style={{ transition: "opacity 0.25s, transform 0.25s" }}
    >
      {card.matched ? (
        <>
          <span className="text-xs mb-0.5">{card.side === "term" ? "📖" : "💡"}</span>
          <span className="text-center leading-tight text-[10px] text-green-700 dark:text-green-300 font-bold px-1">{card.word}</span>
          <span className="absolute top-0.5 right-1 text-green-500 text-xs font-black">✓</span>
        </>
      ) : card.flipped ? (
        <>
          <span className="text-xs mb-0.5">{card.side === "term" ? "📖" : "💡"}</span>
          <span className={`text-center leading-tight text-[10px] font-black px-1 ${textClass}`}>{card.word}</span>
        </>
      ) : (
        <>
          <span className="text-xl opacity-30">{stageEmoji}</span>
          <span className="text-gray-300 dark:text-gray-600 text-xs font-black">?</span>
        </>
      )}
    </button>
  );
}
