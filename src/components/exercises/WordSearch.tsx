"use client";

import { useState, useMemo, useCallback } from "react";
import type { WordSearchWord } from "@/lib/types";

interface Cell { row: number; col: number }
interface PlacedWord { word: string; cells: Cell[] }

const SWEDISH_FILL = "ABCDEFGHIJKLMNOPRSTUVWÅÄÖ";
const DIRECTIONS: [number, number][] = [[0,1],[1,0],[1,1],[-1,1]];

function buildGrid(words: string[], size = 13) {
  const upper = words.map(w => w.toUpperCase().replace(/\s+/g, ""));
  const grid: string[][] = Array.from({ length: size }, () => Array(size).fill(""));
  const placed: PlacedWord[] = [];

  for (const word of upper) {
    let ok = false;
    for (let attempt = 0; attempt < 200 && !ok; attempt++) {
      const [dr, dc] = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
      const maxR = dr >= 0 ? size - (dr === 0 ? 0 : word.length - 1) : size;
      const minR = dr < 0 ? word.length - 1 : 0;
      const maxC = dc >= 0 ? size - (dc === 0 ? 0 : word.length - 1) : size;
      if (maxR <= minR || maxC <= 0) continue;
      const r0 = minR + Math.floor(Math.random() * (maxR - minR));
      const c0 = Math.floor(Math.random() * maxC);
      const cells: Cell[] = [];
      let canPlace = true;
      for (let i = 0; i < word.length; i++) {
        const r = r0 + dr * i, c = c0 + dc * i;
        if (r < 0 || r >= size || c < 0 || c >= size) { canPlace = false; break; }
        if (grid[r][c] !== "" && grid[r][c] !== word[i]) { canPlace = false; break; }
        cells.push({ row: r, col: c });
      }
      if (canPlace) {
        cells.forEach((cell, i) => { grid[cell.row][cell.col] = word[i]; });
        placed.push({ word, cells });
        ok = true;
      }
    }
    if (!ok) {
      // fallback: place horizontally at any free row
      for (let r = 0; r < size && !ok; r++) {
        if (word.length > size) continue;
        const c0 = Math.floor(Math.random() * (size - word.length));
        let canPlace = true;
        for (let i = 0; i < word.length; i++) {
          if (grid[r][c0 + i] !== "" && grid[r][c0 + i] !== word[i]) { canPlace = false; break; }
        }
        if (canPlace) {
          const cells: Cell[] = [];
          for (let i = 0; i < word.length; i++) { grid[r][c0 + i] = word[i]; cells.push({ row: r, col: c0 + i }); }
          placed.push({ word, cells });
          ok = true;
        }
      }
    }
  }

  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (!grid[r][c]) grid[r][c] = SWEDISH_FILL[Math.floor(Math.random() * SWEDISH_FILL.length)];

  return { grid, placed };
}

function cellsOnLine(start: Cell, end: Cell): Cell[] | null {
  const dr = end.row - start.row, dc = end.col - start.col;
  if (dr === 0 && dc === 0) return [start];
  if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return null;
  const len = Math.max(Math.abs(dr), Math.abs(dc));
  const sr = dr === 0 ? 0 : dr / Math.abs(dr);
  const sc = dc === 0 ? 0 : dc / Math.abs(dc);
  return Array.from({ length: len + 1 }, (_, i) => ({ row: start.row + sr * i, col: start.col + sc * i }));
}

const FOUND_COLORS = [
  "bg-emerald-400/70","bg-sky-400/70","bg-violet-400/70","bg-rose-400/70",
  "bg-amber-400/70","bg-teal-400/70","bg-pink-400/70","bg-indigo-400/70",
];

interface WordSearchProps {
  words: WordSearchWord[];
  onAllFound: (points: number) => void;
  pointsPerWord?: number;
}

export default function WordSearch({ words, onAllFound, pointsPerWord = 5 }: WordSearchProps) {
  const wordList = words.map(w => w.word.toUpperCase().replace(/\s+/g, ""));
  const { grid, placed } = useMemo(() => buildGrid(wordList), [words.map(w=>w.word).join(",")]);

  const [start, setStart] = useState<Cell | null>(null);
  const [hover, setHover] = useState<Cell | null>(null);
  const [foundWords, setFoundWords] = useState<{ word: string; cells: Cell[]; color: string }[]>([]);
  const [shakeCell, setShakeCell] = useState(false);

  const preview = useMemo(() => {
    if (!start || !hover) return null;
    return cellsOnLine(start, hover);
  }, [start, hover]);

  const isCellFound = useCallback((r: number, c: number) => {
    for (const fw of foundWords) {
      if (fw.cells.some(cell => cell.row === r && cell.col === c)) return fw.color;
    }
    return null;
  }, [foundWords]);

  const isInPreview = useCallback((r: number, c: number) => {
    return preview?.some(cell => cell.row === r && cell.col === c) ?? false;
  }, [preview]);

  function handleCellClick(r: number, c: number) {
    if (!start) {
      setStart({ row: r, col: c });
      setHover({ row: r, col: c });
      return;
    }
    // Second click - check if it forms a line
    const line = cellsOnLine(start, { row: r, col: c });
    if (!line) {
      // Not a straight line – reset, start new selection
      setStart({ row: r, col: c });
      setHover({ row: r, col: c });
      return;
    }
    const letters = line.map(cell => grid[cell.row][cell.col]).join("");
    const lettersRev = [...letters].reverse().join("");

    const matchedPlaced = placed.find(p => p.word === letters || p.word === lettersRev);
    if (matchedPlaced) {
      const alreadyFound = foundWords.some(fw => fw.word === matchedPlaced.word);
      if (!alreadyFound) {
        const colorIdx = foundWords.length % FOUND_COLORS.length;
        const newFound = [...foundWords, { word: matchedPlaced.word, cells: matchedPlaced.cells, color: FOUND_COLORS[colorIdx] }];
        setFoundWords(newFound);
        if (newFound.length === placed.length) {
          setTimeout(() => onAllFound(newFound.length * pointsPerWord), 600);
        }
      }
    } else {
      setShakeCell(true);
      setTimeout(() => setShakeCell(false), 400);
    }
    setStart(null);
    setHover(null);
  }

  const gridSize = grid.length;
  const cellSize = Math.min(32, Math.floor(Math.min(340, typeof window !== "undefined" ? window.innerWidth - 32 : 340) / gridSize));

  return (
    <div className="select-none">
      {/* Word list */}
      <div className="flex flex-wrap gap-2 mb-5">
        {words.map((w, i) => {
          const upper = w.word.toUpperCase().replace(/\s+/g, "");
          const found = foundWords.find(fw => fw.word === upper);
          return (
            <div
              key={w.word}
              className={`px-3 py-1.5 rounded-xl text-sm font-bold border-2 transition-all ${
                found
                  ? `${found.color.replace("/70","")} text-white border-transparent line-through opacity-70`
                  : "bg-white dark:bg-gray-700 border-sj-200 dark:border-gray-600 text-sj-800 dark:text-gray-100"
              }`}
            >
              {w.word}
            </div>
          );
        })}
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 h-2 bg-sj-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${(foundWords.length / placed.length) * 100}%` }}
          />
        </div>
        <span className="text-sm font-bold text-sj-600 dark:text-gray-300 flex-shrink-0">
          {foundWords.length}/{placed.length} hittade
        </span>
      </div>

      {/* Hint */}
      <p className="text-xs text-sj-400 dark:text-gray-400 mb-3 font-medium">
        {start ? "🎯 Klicka på sista bokstaven i ordet!" : "👆 Klicka på en bokstav för att börja"}
      </p>

      {/* Grid */}
      <div
        className={`inline-block rounded-2xl overflow-hidden border-3 border-sj-200 dark:border-gray-600 ${shakeCell ? "animate-shake" : ""}`}
        style={{ boxShadow: "0 4px 0 0 rgba(22,163,74,0.1)" }}
      >
        {grid.map((row, r) => (
          <div key={r} className="flex">
            {row.map((letter, c) => {
              const foundColor = isCellFound(r, c);
              const inPreview = isInPreview(r, c);
              const isStart = start?.row === r && start?.col === c;
              return (
                <div
                  key={c}
                  onClick={() => handleCellClick(r, c)}
                  className={`flex items-center justify-center font-black cursor-pointer transition-all duration-100 select-none text-sm
                    ${foundColor ? foundColor + " text-white" : ""}
                    ${inPreview && !foundColor ? "bg-sj-200 dark:bg-sj-700 text-sj-900 dark:text-white scale-105" : ""}
                    ${isStart && !foundColor ? "bg-sj-400 text-white ring-2 ring-sj-600 scale-105" : ""}
                    ${!foundColor && !inPreview && !isStart ? "bg-white dark:bg-gray-800 text-sj-700 dark:text-gray-200 hover:bg-sj-50 dark:hover:bg-gray-700" : ""}
                    border border-sj-50 dark:border-gray-700`}
                  style={{ width: cellSize, height: cellSize, fontSize: Math.max(10, cellSize - 10) }}
                  onMouseEnter={() => start && setHover({ row: r, col: c })}
                >
                  {letter}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-4px); }
          40% { transform: translateX(4px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(2px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  );
}
