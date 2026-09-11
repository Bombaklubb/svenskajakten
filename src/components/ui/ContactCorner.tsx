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
 * The contact line in the bottom-left corner, with a card that opens above it.
 *
 * The address stays visible when the card is shut, so only the word "Kontakt:"
 * is the toggle. That keeps a tap on the address doing what a tap on an address
 * should do — open the mail program — while a tap on the label opens the card on
 * a touch screen, where there is no pointer to hover with.
 */
export default function ContactCorner() {
  // Three ways in, kept apart on purpose. With a single flag the click handler
  // toggled the card shut again, because hovering had already opened it — so
  // pressing the label did nothing on a mouse, and nothing on a touch screen
  // either, where a tap fires a mouseover of its own before the click.
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pinned, setPinned] = useState(false);
  const open = hovered || focused || pinned;
  const ref = useRef<HTMLDivElement>(null);

  // Whether this device has a pointer that can hover. A touch screen has none,
  // yet Chrome still fires a mouseover of its own when a finger lands — which
  // opened the card a moment before the tap could, so the tap read as a
  // request to close it again. Hover is therefore only believed where hovering
  // is real, and the tap is left to do the work everywhere else.
  const [canHover, setCanHover] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    setCanHover(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setCanHover(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  /**
   * Pressing the label. Where the pointer can hover, the hover already governs
   * the card and a click that closed it would look like a broken button, so it
   * does nothing. Where it cannot, the press is the only way in, and toggles.
   */
  function toggle() {
    if (canHover) return;
    if (open) {
      setPinned(false);
      setHovered(false);
      setFocused(false);
    } else {
      setPinned(true);
    }
  }

  function close() {
    setPinned(false);
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
      className="relative inline-flex items-center gap-1 pointer-events-auto"
      onMouseEnter={() => canHover && setHovered(true)}
      onMouseLeave={() => canHover && setHovered(false)}
      // Focus and blur bubble in React, so tabbing into the button or either
      // chip shows the card for keyboard users too. Only a keyboard focus
      // counts: a tap focuses the button as well, and that opened the card a
      // beat before the tap's own click, which then read it as a request to
      // close — so the first tap appeared to do nothing at all.
      onFocus={(e) => {
        if ((e.target as HTMLElement).matches?.(":focus-visible")) setFocused(true);
      }}
      onBlur={() => setFocused(false)}
    >
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
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex items-center gap-1 rounded-lg px-1.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white cursor-pointer"
      >
        <span aria-hidden="true">✉️</span>
        <span>Kontakt:</span>
      </button>
      <a
        href={mailto()}
        className="text-xs font-medium text-slate-600 underline transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
      >
        {EMAIL}
      </a>
    </div>
  );
}
