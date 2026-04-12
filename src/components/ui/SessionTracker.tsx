"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  trackEvent,
  sendHeartbeat,
  getOrCreateDeviceId,
  getOrCreateSessionId,
} from "@/lib/analytics";

const HEARTBEAT_INTERVAL_MS = 2 * 60 * 1000; // every 2 minutes

export default function SessionTracker() {
  const router = useRouter();

  useEffect(() => {
    const startTime = Date.now();
    const deviceId = getOrCreateDeviceId();
    const sessionId = getOrCreateSessionId();

    trackEvent({ type: "session_start", deviceId, sessionId });

    // Heartbeat to keep "online" status alive
    const heartbeatTimer = setInterval(() => {
      sendHeartbeat(sessionId);
    }, HEARTBEAT_INTERVAL_MS);

    function handleUnload() {
      const durationSeconds = Math.round((Date.now() - startTime) / 1000);
      if (durationSeconds > 0) {
        trackEvent({ type: "session_end", durationSeconds, sessionId });
      }
    }

    // Ctrl+Shift+L → teacher dashboard
    function handleKeydown(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && e.key === "L") {
        e.preventDefault();
        router.push("/larare");
      }
    }

    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("keydown", handleKeydown);
      clearInterval(heartbeatTimer);
    };
  }, [router]);

  return null;
}
