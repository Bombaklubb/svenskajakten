export interface TrackEvent {
  type: "exercise_done" | "wrong_answer" | "session_start" | "session_end";
  stage?: string;
  moduleId?: string;
  exerciseIdx?: number;
  moduleTitle?: string;
  questionPreview?: string;
  durationSeconds?: number;
  deviceId?: string;
  sessionId?: string;
}

/** Returns a persistent anonymous device ID (survives across sessions on same browser). */
export function getOrCreateDeviceId(): string {
  const KEY = "sj_device_id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

/** Returns a per-session ID (cleared when browser/tab closes). */
export function getOrCreateSessionId(): string {
  const KEY = "sj_session_id";
  let id = sessionStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(KEY, id);
  }
  return id;
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
    keepalive: true,
  }).catch(() => {});
}

/** Refreshes the "online" status for the current session. */
export function sendHeartbeat(sessionId: string): void {
  fetch("/api/heartbeat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  }).catch(() => {});
}
