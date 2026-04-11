/**
 * Simple token helpers for the teacher dashboard.
 * Kept server-side only – never import this in client components.
 */

export function makeToken(password: string): string {
  const payload = `${Date.now()}:${password}`;
  return Buffer.from(payload).toString("base64url");
}

export function validateToken(token: string): boolean {
  const password = process.env.TEACHER_PASSWORD;
  if (!password) return false;
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const colonIdx = decoded.indexOf(":");
    if (colonIdx === -1) return false;
    const ts = Number(decoded.slice(0, colonIdx));
    const tokenPassword = decoded.slice(colonIdx + 1);
    // Token valid for 24 hours
    if (Date.now() - ts > 1000 * 60 * 60 * 24) return false;
    return tokenPassword === password;
  } catch {
    return false;
  }
}
