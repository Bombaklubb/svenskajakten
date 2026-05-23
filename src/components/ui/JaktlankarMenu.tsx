"use client";

import { useState, useRef, useEffect } from "react";

const LINKS = [
  { label: "Läsjakten",      href: "https://lasjakten.vercel.app",       icon: <span>📚</span> },
  { label: "Mattejakten",    href: "https://mattejakten.vercel.app",     icon: <span>🔢</span> },
  { label: "Engelskajakten", href: "https://engelskajakten.vercel.app",  icon: <img src="/flags/gb.svg" alt="GB" width={20} height={14} style={{ borderRadius: 2 }} /> },
  { label: "Readhunt",       href: "https://readhunt.vercel.app",        icon: <span>📖</span> },
];

export default function JaktlankarMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
      >
        🔗 Jaktlänkar
        <span className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}>▲</span>
      </button>

      {open && (
        <div
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
              {icon}
              <span>{label}</span>
              <span className="ml-auto text-slate-400 text-xs">↗</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
