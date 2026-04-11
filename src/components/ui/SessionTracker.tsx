"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

export default function SessionTracker() {
  useEffect(() => {
    const startTime = Date.now();
    trackEvent({ type: "session_start" });

    function handleUnload() {
      const durationSeconds = Math.round((Date.now() - startTime) / 1000);
      if (durationSeconds > 0) {
        trackEvent({ type: "session_end", durationSeconds });
      }
    }

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  return null;
}
