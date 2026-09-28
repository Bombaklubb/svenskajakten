"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  trackEvent,
  sendHeartbeat,
  getOrCreateDeviceId,
  getOrCreateSessionId,
} from "@/lib/analytics";

const HEARTBEAT_INTERVAL_MS = 2 * 60 * 1000; // every 2 minutes
/** Coming back to the tab beats at once, but not more often than this. */
const VISIBLE_BEAT_MIN_GAP_MS = 60 * 1000;
/** sessionStorage flag: session_start has been sent for this browser session. */
const STARTED_KEY = "sj_session_started";

export default function SessionTracker() {
  const router = useRouter();
  // The teacher looking at the statistics is not a pupil, so /larare is never
  // tracked. Only the boolean is a dependency: re-running the effect on every
  // navigation would restart the heartbeat timer each time.
  const onTeacherPage = usePathname()?.startsWith("/larare") ?? false;

  // Ctrl+Shift+L or Ctrl+Shift+P → teacher dashboard
  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && (e.key === "L" || e.key === "P")) {
        e.preventDefault();
        router.push("/larare");
      }
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [router]);

  useEffect(() => {
    if (onTeacherPage) return;

    let deviceId: string;
    let sessionId: string;
    try {
      deviceId = getOrCreateDeviceId();
      sessionId = getOrCreateSessionId();
      // session_start once per browser session, not on every full page load:
      // each one costs several Redis commands and a request.
      if (!sessionStorage.getItem(STARTED_KEY)) {
        sessionStorage.setItem(STARTED_KEY, "1");
        trackEvent({ type: "session_start", deviceId, sessionId });
      }
    } catch {
      // Storage blocked (private mode, policy): no tracking at all.
      return;
    }

    // Heartbeat to keep "online" status alive. It runs only while the tab is
    // being looked at: a Chromebook left open on the app all day kept saying
    // "online" every two minutes with nobody there, which is both untrue and
    // paid for. Returning to the tab beats straight away so the teacher's
    // online count picks the pupil back up — but at most once a minute, or a
    // pupil flicking between tabs would send one beat per flick.
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    let lastBeat = Date.now();

    function beat() {
      lastBeat = Date.now();
      sendHeartbeat(sessionId);
    }
    function startHeartbeat() {
      if (heartbeatTimer) return;
      heartbeatTimer = setInterval(beat, HEARTBEAT_INTERVAL_MS);
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
        if (Date.now() - lastBeat >= VISIBLE_BEAT_MIN_GAP_MS) beat();
        startHeartbeat();
      }
    }

    if (!document.hidden) startHeartbeat();

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      stopHeartbeat();
    };
  }, [onTeacherPage]);

  return null;
}
