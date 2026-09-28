"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

/**
 * The sister apps, exported so the About page can describe the same list
 * rather than keep a copy of it that quietly falls out of date.
 * `subject` is for that page; the menu itself only needs label, href and icon.
 */
export const LINKS = [
  { label: "Läsjakten",      href: "https://lasjakten.vercel.app",       icon: <span>📚</span>,
    subject: "Läsförståelse på svenska – texter att läsa och frågor på det du läst." },
  { label: "Mattejakten",    href: "https://mattejakten.vercel.app",     icon: <span>🔢</span>,
    subject: "Matematik – räkning och problemlösning på samma sätt som här." },
  { label: "Engelskajakten", href: "https://engelskajakten.vercel.app",  icon: <img src="/flags/gb.svg" alt="" width={20} height={14} style={{ borderRadius: 2 }} />,
    subject: "Engelsk grammatik, stavning och ordförråd." },
  { label: "Readhunt",       href: "https://readhunt.vercel.app",        icon: <span>📖</span>,
    subject: "Läsförståelse på engelska – Engelskajaktens systerapp för text." },
];

export default function JaktlankarMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    // Escape closes the menu and hands focus back to its button, so a
    // keyboard user isn't left somewhere inside a list that just vanished.
    function handleKey(e: KeyboardEvent) {
      if (e.key !== "Escape" || !openRef.current) return;
      setOpen(false);
      if (ref.current?.contains(document.activeElement)) buttonRef.current?.focus();
    }
    document.addEventListener("mousedown", handleClick);
    window.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="jaktlankar-menu"
        onClick={() => setOpen((o) => !o)}
        className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1 cursor-pointer rounded-lg px-2 py-1.5 bg-white/80 backdrop-blur-sm shadow-sm dark:bg-gray-900/70"
      >
        <span aria-hidden="true">🔗</span> Jaktlänkar
        <span aria-hidden="true" className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}>▲</span>
      </button>

      {open && (
        <div
          id="jaktlankar-menu"
          className="absolute bottom-full right-0 mb-2 bg-white dark:bg-gray-800 border-2 border-slate-200 dark:border-gray-600 rounded-2xl shadow-xl overflow-hidden min-w-[180px]"
          style={{ boxShadow: "0 8px 24px -4px rgba(0,0,0,0.18)" }}
        >
          {LINKS.map(({ label, href, icon }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors border-b border-slate-100 dark:border-gray-700 last:border-0"
            >
              <span aria-hidden="true" className="flex items-center">{icon}</span>
              <span>{label}</span>
              <span className="ml-auto text-slate-500 dark:text-slate-400 text-xs" aria-hidden="true">↗</span>
            </a>
          ))}
          {/* The header's ❓ link has no room below 400px, so the About page
              is offered here too: this menu is on every page, at every width. */}
          <Link prefetch={false}
            href="/om"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors border-t-2 border-slate-100 dark:border-gray-700"
          >
            <span aria-hidden="true">❓</span>
            <span>Om Svenskajakten</span>
          </Link>
        </div>
      )}
    </div>
  );
}
