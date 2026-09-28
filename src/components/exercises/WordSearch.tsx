"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
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
    if (start && start.row === r && start.col === c) {
      // Tapping the start letter again means "never mind", not a wrong word.
      setStart(null);
      setHover(null);
      return;
    }
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

  // Size the cells from the width actually available. Guessing from the window
  // width missed the card and page padding (~70 px, not 32), so on 360–412 px
  // phones the grid ran out of the card.
  const boxRef = useRef<HTMLDivElement>(null);
  const [boxWidth, setBoxWidth] = useState<number | null>(null);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => setBoxWidth(el.clientWidth);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const GRID_BORDER = 6; // border-3 on both sides of the grid
  const cellSize = Math.max(
    16,
    Math.min(32, Math.floor(((boxWidth ?? 26 * gridSize) - GRID_BORDER) / gridSize))
  );

  // Roving focus: one cell is in the tab order and the arrow keys move it, so
  // the grid is one tab stop rather than 169.
  const [focusCell, setFocusCell] = useState<Cell>({ row: 0, col: 0 });
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);
  function handleCellKey(e: React.KeyboardEvent, r: number, c: number) {
    const moves: Record<string, [number, number]> = {
      ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1],
    };
    if (e.key === "Escape" && start) {
      setStart(null);
      setHover(null);
      return;
    }
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    const row = Math.min(gridSize - 1, Math.max(0, r + move[0]));
    const col = Math.min(gridSize - 1, Math.max(0, c + move[1]));
    setFocusCell({ row, col });
    if (start) setHover({ row, col });
    cellRefs.current[row * gridSize + col]?.focus();
  }

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
                  : "bg-white dark:bg-gray-700 border-sv-200 dark:border-gray-600 text-sv-800 dark:text-gray-100"
              }`}
            >
              {w.word}
            </div>
          );
        })}
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 h-2 bg-sv-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${(foundWords.length / placed.length) * 100}%` }}
          />
        </div>
        <span className="text-sm font-bold text-sv-800 dark:text-gray-300 flex-shrink-0">
          {foundWords.length}/{placed.length} hittade
        </span>
      </div>

      {/* Hint */}
      <p className="text-xs text-sv-800 dark:text-gray-300 mb-3 font-medium">
        {start ? "🎯 Klicka på sista bokstaven i ordet!" : "👆 Klicka på en bokstav för att börja"}
      </p>

      {/* Grid */}
      <div ref={boxRef} className="w-full">
        <div
          role="group"
          aria-label={`Bokstavsrutnät, ${gridSize} gånger ${gridSize}. Välj första och sista bokstaven i ett ord.`}
          className={`inline-block max-w-full rounded-2xl overflow-hidden border-3 border-sv-200 dark:border-gray-600 ${shakeCell ? "animate-shake" : ""}`}
          style={{ boxShadow: "0 4px 0 0 rgba(249,115,22,0.1)" }}
        >
          {grid.map((row, r) => (
            <div key={r} className="flex">
              {row.map((letter, c) => {
                const foundColor = isCellFound(r, c);
                const inPreview = isInPreview(r, c);
                const isStart = start?.row === r && start?.col === c;
                return (
                  <button
                    type="button"
                    key={c}
                    ref={(el) => { cellRefs.current[r * gridSize + c] = el; }}
                    tabIndex={focusCell.row === r && focusCell.col === c ? 0 : -1}
                    aria-label={`${letter}, rad ${r + 1}, kolumn ${c + 1}${foundColor ? ", hittad" : ""}`}
                    aria-pressed={isStart}
                    onClick={() => { setFocusCell({ row: r, col: c }); handleCellClick(r, c); }}
                    onKeyDown={(e) => handleCellKey(e, r, c)}
                    className={`flex items-center justify-center p-0 font-black cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-sv-700 focus-visible:z-10 transition-all duration-100 select-none text-sm
                      ${foundColor ? foundColor + " text-white" : ""}
                      ${inPreview && !foundColor ? "bg-sv-200 dark:bg-sv-700 text-sv-900 dark:text-white scale-105" : ""}
                      ${isStart && !foundColor ? "bg-sv-400 text-white ring-2 ring-sv-600 scale-105" : ""}
                      ${!foundColor && !inPreview && !isStart ? "bg-white dark:bg-gray-800 text-sv-800 dark:text-gray-200 hover:bg-sv-50 dark:hover:bg-gray-700" : ""}
                      border border-sv-50 dark:border-gray-700`}
                    style={{ width: cellSize, height: cellSize, fontSize: Math.max(10, cellSize - 10) }}
                    onMouseEnter={() => start && setHover({ row: r, col: c })}
                    onFocus={() => start && setHover({ row: r, col: c })}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
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
