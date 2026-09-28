/**
 * Shared helpers for the analytics routes. Server-side only.
 *
 * The folder name starts with an underscore, so Next.js never turns it into a
 * route of its own.
 */

/** The only stages that may appear in a KV key. */
export const VALID_STAGES = ["lagstadiet", "mellanstadiet", "hogstadiet", "gymnasiet"] as const;
export type ValidStage = (typeof VALID_STAGES)[number];

export function safeStage(value: unknown): ValidStage | null {
  return typeof value === "string" && (VALID_STAGES as readonly string[]).includes(value)
    ? (value as ValidStage)
    : null;
}

/**
 * The analytics endpoints are unauthenticated by design (they are called from
 * every pupil's browser), so every value that reaches KV is validated first:
 * ids that become part of a key or a set member are restricted to a safe
 * character set and free text is capped, otherwise anyone could mint unlimited
 * keys or store unbounded strings.
 */
export function safeId(value: unknown, maxLength = 64): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) return null;
  return /^[A-Za-z0-9_-]+$/.test(trimmed) ? trimmed : null;
}

export function safeText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.slice(0, maxLength) : "";
}

/** A pupil counts as online for this long after their last heartbeat. */
export const ONLINE_WINDOW_MS = 5 * 60 * 1000;

/** Mistake statistics are dropped after this long without a new wrong answer. */
export const MISTAKE_TTL_SECONDS = 60 * 60 * 24 * 90;

/** Sorted set of wrong-answer counts for one stage; member `${moduleId}:${idx}`. */
export function mistakesKey(stage: ValidStage): string {
  return `mistakes:${stage}`;
}

/** Hash beside it holding `{ t: moduleTitle, q: questionPreview }` per member. */
export function mistakeInfoKey(stage: ValidStage): string {
  return `mistakes:${stage}:info`;
}

/**
 * The KV client, or null when the store isn't configured. @vercel/kv imports
 * fine without its environment variables and only fails on the first command,
 * so the variables are checked up front — otherwise the caller's "not
 * configured" branch could never be reached.
 */
export async function getKv(): Promise<import("@vercel/kv").VercelKV | null> {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null;
  try {
    const mod = await import("@vercel/kv");
    return mod.kv;
  } catch {
    return null;
  }
}
