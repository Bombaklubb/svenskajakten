export interface TrackEvent {
  type: "exercise_done" | "wrong_answer" | "session_start" | "session_end";
  stage?: string;
  moduleId?: string;
  exerciseIdx?: number;
  moduleTitle?: string;
  questionPreview?: string;
  durationSeconds?: number;
}

/**
 * Fire-and-forget: sends an anonymous analytics event to the server.
 * Never throws – tracking must never crash the app.
 */
export function trackEvent(event: TrackEvent): void {
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
    keepalive: true, // survives page unload (session_end)
  }).catch(() => {});
}
