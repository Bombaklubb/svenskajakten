"use client";

import { useEffect, useState } from "react";
import type { ThemeArt } from "@/lib/themeArt";

/**
 * The equipped background theme, painted as a fixed layer behind the page.
 * Fixed rather than on the page itself, so a drawn scene stays whole on the
 * screen however long the page is, and does not stretch with the content.
 * The wrapper around it carries "isolate" (see getThemeWrapperClass), which
 * keeps the layer behind the page's content and in front of the body colour.
 *
 * The drawing code is loaded only when a theme is equipped, so pupils who
 * keep the standard background never download it.
 */
export default function ThemeBackdrop({ themeId }: { themeId?: string }) {
  const [art, setArt] = useState<ThemeArt | undefined>(undefined);

  useEffect(() => {
    if (!themeId) {
      setArt(undefined);
      return;
    }
    let live = true;
    import("@/lib/themeArt").then(({ getThemeArt }) => {
      if (live) setArt(getThemeArt(themeId));
    });
    return () => {
      live = false;
    };
  }, [themeId]);

  if (!themeId || !art) return null;
  return (
    <div aria-hidden="true" className="fixed inset-0 -z-10 pointer-events-none" style={{ background: art.bg }}>
      {/* Dims the picture a little in dark mode so the cards stay in front. */}
      <div className="absolute inset-0 hidden dark:block bg-gray-950/40" />
    </div>
  );
}
