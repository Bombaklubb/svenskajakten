"use client";

import { useEffect, useState } from "react";
import { hasSaveFailed, SAVE_FAILED_EVENT } from "@/lib/storage";

/**
 * A small banner shown when progress could not be saved to this browser —
 * storage full, or a private window that refuses every write. Without it the
 * pupil would carry on and find their points gone next time.
 *
 * Drop it anywhere on a page; it renders nothing until a save fails. Pass
 * `failed` to show it from a known result instead of listening for failures.
 */
export default function SaveWarning({ failed }: { failed?: boolean }) {
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    setSeen(hasSaveFailed());
    const onFail = () => setSeen(true);
    window.addEventListener(SAVE_FAILED_EVENT, onFail);
    return () => window.removeEventListener(SAVE_FAILED_EVENT, onFail);
  }, []);

  if (!failed && !seen) return null;

  return (
    <div
      role="alert"
      className="bg-red-50 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-600 rounded-2xl p-3 mb-3 flex items-center gap-3 text-left"
    >
      <span className="text-2xl" aria-hidden="true">⚠️</span>
      <div>
        <p className="text-sm font-bold text-red-800 dark:text-red-300">Dina framsteg kunde inte sparas!</p>
        <p className="text-xs text-red-700 dark:text-red-400">
          Webbläsaren tar inte emot mer data just nu. Be en vuxen om hjälp, och spara en kopia under Profil.
        </p>
      </div>
    </div>
  );
}
