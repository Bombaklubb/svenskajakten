export interface TrackEvent {
  type: "exercise_done" | "wrong_answer" | "session_start";
  stage?: string;
  moduleId?: string;
  exerciseIdx?: number;
  moduleTitle?: string;
  questionPreview?: string;
  deviceId?: string;
  sessionId?: string;
  /** How many correct answers an "exercise_done" event stands for. Sent once
   *  when a chapter is finished rather than after every single answer. */
  count?: number;
}

/** One wrong answer as the server stores it for the teacher's mistake list. */
export interface MistakeItem {
  stage: string;
  moduleId: string;
  exerciseIdx: number;
  moduleTitle?: string;
  questionPreview?: string;
}

/** The server accepts no more than this many mistakes per request. */
export const MAX_MISTAKES_PER_REQUEST = 50;

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

// ─── Wrong answers are batched ───────────────────────────────────────────────
// Every wrong answer used to be its own request, and the project's request
// quota is shared and already spent. They are held here instead and go to the
// server in one go: together with the chapter's "exercise_done", or — when the
// pupil leaves in the middle of a chapter — as a beacon when the page is hidden.
// A pupil who moves to another page inside the app keeps the same module
// instance, so the queue simply waits for the next chapter end or page hide.

let pendingMistakes: MistakeItem[] = [];
let flushListenersAttached = false;

function takePending(): MistakeItem[] {
  const batch = pendingMistakes.slice(0, MAX_MISTAKES_PER_REQUEST);
  pendingMistakes = pendingMistakes.slice(MAX_MISTAKES_PER_REQUEST);
  return batch;
}

function post(body: string): void {
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

/**
 * Sends whatever wrong answers are waiting. With `beacon` the browser is on
 * its way out, so sendBeacon is used: it survives the page being unloaded.
 */
function flushMistakes(beacon = false): void {
  while (pendingMistakes.length > 0) {
    const body = JSON.stringify({ type: "mistakes", mistakes: takePending() });
    if (beacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
      try {
        const blob = new Blob([body], { type: "application/json" });
        if (navigator.sendBeacon("/api/track", blob)) continue;
      } catch {
        // fall through to fetch
      }
    }
    post(body);
  }
}

function attachFlushListeners(): void {
  if (flushListenersAttached || typeof window === "undefined") return;
  flushListenersAttached = true;
  // pagehide covers closing the tab and leaving the site; a phone may never
  // fire it when the app is swiped away, but it does fire visibilitychange.
  window.addEventListener("pagehide", () => flushMistakes(true));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushMistakes(true);
  });
}

/**
 * Fire-and-forget: sends an anonymous analytics event to the server.
 * Never throws – tracking must never crash the app.
 *
 * "wrong_answer" is not sent at once but queued (see above); "exercise_done"
 * carries the queued wrong answers along in the same request.
 */
export function trackEvent(event: TrackEvent): void {
  try {
    if (event.type === "wrong_answer") {
      if (!event.stage || !event.moduleId || typeof event.exerciseIdx !== "number") return;
      pendingMistakes.push({
        stage: event.stage,
        moduleId: event.moduleId,
        exerciseIdx: event.exerciseIdx,
        moduleTitle: event.moduleTitle?.slice(0, 120),
        questionPreview: event.questionPreview?.slice(0, 200),
      });
      attachFlushListeners();
      // A very long session of wrong answers without a chapter end: don't let
      // the queue grow past what one request may carry.
      if (pendingMistakes.length >= MAX_MISTAKES_PER_REQUEST) flushMistakes();
      return;
    }

    if (event.type === "exercise_done") {
      post(JSON.stringify({ ...event, mistakes: takePending() }));
      // Anything beyond one request's worth goes in a request of its own.
      flushMistakes();
      return;
    }

    post(JSON.stringify(event));
  } catch {
    // Tracking is best-effort.
  }
}

/** Refreshes the "online" status for the current session. */
export function sendHeartbeat(sessionId: string): void {
  fetch("/api/heartbeat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  }).catch(() => {});
}
