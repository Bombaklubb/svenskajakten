"use client";

import { useState, useRef, useEffect } from "react";

const EMAIL = "martin.akdogan@enkoping.se";

/** mailto with the subject line filled in, so the inbox says what it is about. */
function mailto(subject?: string): string {
  return subject ? `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}` : `mailto:${EMAIL}`;
}

const CHIPS = [
  { emoji: "❓", label: "Frågor", subject: "Fråga om Svenskajakten" },
  { emoji: "💡", label: "Tips",   subject: "Tips till Svenskajakten" },
];

/**
 * "Kontakta Martin" in the bottom-left corner, with a card that opens above it.
 *
 * The label is the mailto link itself, the way Engelskajakten has it: clicking
 * or tapping it writes to Martin, with no card in the way. Pointing at it first
 * offers the two subject lines, and the address is spelled out inside the card
 * for anyone who would rather copy it into their own mail program.
 */
export default function ContactCorner() {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const open = hovered || focused;
  const ref = useRef<HTMLDivElement>(null);

  // Only believe a hover where hovering is real. A touch screen has no pointer,
  // yet Chrome fires a mouseover of its own when a finger lands, which would
  // flash the card open in the moment before the tap opens the mail program.
  const [canHover, setCanHover] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    setCanHover(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setCanHover(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  function close() {
    setHovered(false);
    setFocused(false);
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("mousedown", handleClick);
    window.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="relative inline-flex items-center pointer-events-auto"
      onMouseEnter={() => canHover && setHovered(true)}
      onMouseLeave={() => canHover && setHovered(false)}
      // Focus and blur bubble in React, so tabbing into the link or either chip
      // shows the card for keyboard users too. Only a keyboard focus counts —
      // a tap focuses the link as well, and the card has no business appearing
      // when the tap is already on its way to the mail program.
      onFocus={(e) => {
        if ((e.target as HTMLElement).matches?.(":focus-visible")) setFocused(true);
      }}
      // Closing on any blur pulled the card out from under the very Tab that
      // was heading into it, so focus sailed past the chips to the next thing
      // on the page. It stays put while focus is still somewhere inside.
      onBlur={(e) => {
        if (!ref.current?.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      {/* The link comes first in the source so Tab runs label → Frågor → Tips.
          The card is lifted above it by position, not by source order. */}
      <a
        href={mailto()}
        className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
      >
        <span aria-hidden="true">✉️</span>
        <span>Kontakta Martin</span>
      </a>

      {open && (
        // Padding rather than margin: the gap up to the card has to belong to
        // this element, or the pointer crosses dead space on its way to the
        // chips and mouseleave shuts the card before it gets there.
        <div className="absolute bottom-full left-0 pb-2 w-max max-w-[calc(100vw-1.5rem)]">
          <div
            className="animate-pop rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 dark:border-gray-600 dark:bg-gray-800"
            style={{ boxShadow: "0 8px 24px -4px rgba(0,0,0,0.18)" }}
          >
            <p className="mb-2 text-xs font-bold text-slate-700 dark:text-slate-200">
              Hör av dig om du har
            </p>
            <div className="flex flex-wrap gap-2">
              {CHIPS.map(({ emoji, label, subject }) => (
                <a
                  key={label}
                  href={mailto(subject)}
                  onClick={close}
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:border-sv-400 hover:bg-sv-50 hover:text-sv-800 dark:border-gray-600 dark:bg-gray-700 dark:text-slate-200 dark:hover:border-sv-500 dark:hover:bg-gray-600 dark:hover:text-white"
                >
                  <span aria-hidden="true">{emoji}</span>
                  <span>{label}</span>
                </a>
              ))}
            </div>
            <p className="mt-2.5 text-[11px] text-slate-500 dark:text-slate-400">{EMAIL}</p>
          </div>
        </div>
      )}
    </div>
  );
}
