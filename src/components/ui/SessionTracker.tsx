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

    // Heartbeat to keep "online" status alive. It runs only while the tab is
    // being looked at: a Chromebook left open on the app all day kept saying
    // "online" every two minutes with nobody there, which is both untrue and
    // paid for. Returning to the tab beats immediately, so the teacher's
    // online count picks the pupil straight back up.
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

    function startHeartbeat() {
      if (heartbeatTimer) return;
      heartbeatTimer = setInterval(() => sendHeartbeat(sessionId), HEARTBEAT_INTERVAL_MS);
    }
    function stopHeartbeat() {
      if (!heartbeatTimer) return;
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
    function handleVisibility() {
      if (document.hidden) {
        stopHeartbeat();
      } else {
        sendHeartbeat(sessionId);
        startHeartbeat();
      }
    }

    if (!document.hidden) startHeartbeat();

    function handleUnload() {
      const durationSeconds = Math.round((Date.now() - startTime) / 1000);
      if (durationSeconds > 0) {
        trackEvent({ type: "session_end", durationSeconds, sessionId });
      }
    }

    // Ctrl+Shift+L or Ctrl+Shift+P → teacher dashboard
    function handleKeydown(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && (e.key === "L" || e.key === "P")) {
        e.preventDefault();
        router.push("/larare");
      }
    }

    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("keydown", handleKeydown);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("keydown", handleKeydown);
      document.removeEventListener("visibilitychange", handleVisibility);
      stopHeartbeat();
    };
  }, [router]);

  return null;
}
