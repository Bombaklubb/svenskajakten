/**
 * Token helpers for the teacher dashboard.
 * Server-side only – never import this in client components.
 *
 * The token is an HMAC-signed expiry stamp. It deliberately does NOT contain
 * the password: anyone who gets hold of a token (shared computer, devtools)
 * can only replay it until it expires, not learn the password itself.
 */

import { createHmac, timingSafeEqual } from "crypto";

/** Session length for a teacher login. */
const TOKEN_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

/**
 * The configured teacher password, or null when it has not been set.
 * There is intentionally no default: a fallback baked into the source would be
 * public to anyone who can read the repository.
 */
export function getTeacherPassword(): string | null {
  const pw = process.env.TEACHER_PASSWORD;
  return pw && pw.length > 0 ? pw : null;
}

/** Constant-time string comparison, so responses don't leak the password byte by byte. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf-8");
  const bufB = Buffer.from(b, "utf-8");
  // timingSafeEqual requires equal lengths; hash first so length never leaks.
  const hashA = createHmac("sha256", "len").update(bufA).digest();
  const hashB = createHmac("sha256", "len").update(bufB).digest();
  return timingSafeEqual(hashA, hashB);
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/** Create a signed token that is valid for TOKEN_TTL_MS. */
export function makeToken(secret: string): string {
  const expires = String(Date.now() + TOKEN_TTL_MS);
  return `${Buffer.from(expires).toString("base64url")}.${sign(expires, secret)}`;
}

/** Verify signature and expiry. Returns false for anything malformed. */
export function validateToken(token: string): boolean {
  const secret = getTeacherPassword();
  if (!secret) return false;
  try {
    const dot = token.indexOf(".");
    if (dot === -1) return false;
    const expires = Buffer.from(token.slice(0, dot), "base64url").toString("utf-8");
    const signature = token.slice(dot + 1);

    const expected = sign(expires, secret);
    if (!safeEqual(signature, expected)) return false;

    const expiresAt = Number(expires);
    return Number.isFinite(expiresAt) && Date.now() < expiresAt;
  } catch {
    return false;
  }
}
