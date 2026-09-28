"use client";

import { useState, useEffect } from "react";

/**
 * The saved light/dark choice (localStorage "darkMode", else the system
 * setting). The class on <html> is already applied before the first paint by
 * the inline script in app/layout.tsx; this hook keeps the toggle in sync with
 * it. Change the key or the fallback in both places.
 */
export function useDarkMode() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("darkMode");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const enabled = stored !== null ? stored === "true" : prefersDark;
    setDark(enabled);
    document.documentElement.classList.toggle("dark", enabled);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    localStorage.setItem("darkMode", String(next));
    document.documentElement.classList.toggle("dark", next);
  }

  return { dark, toggle };
}
