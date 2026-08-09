import { NextRequest, NextResponse } from "next/server";
import { makeToken, getTeacherPassword, safeEqual } from "@/lib/teacherAuth";

/**
 * Simple in-memory rate limit. A serverless instance may be recycled or run in
 * parallel, so this is a speed bump rather than a guarantee — but it turns an
 * unlimited online brute force into a slow one.
 */
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const attempts = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);

  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    // Opportunistic cleanup so the map can't grow without bound.
    if (attempts.size > 5000) {
      for (const [key, value] of attempts) {
        if (now > value.resetAt) attempts.delete(key);
      }
    }
    return false;
  }

  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

export async function POST(req: NextRequest) {
  const expected = getTeacherPassword();
  if (!expected) {
    return NextResponse.json(
      { error: "Lärarlösenordet är inte konfigurerat. Sätt miljövariabeln TEACHER_PASSWORD." },
      { status: 503 }
    );
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "För många försök. Vänta en stund och försök igen." },
      { status: 429 }
    );
  }

  try {
    const { password } = await req.json();
    if (typeof password !== "string" || !safeEqual(password, expected)) {
      return NextResponse.json({ error: "Fel lösenord." }, { status: 401 });
    }

    return NextResponse.json({ token: makeToken(expected) });
  } catch {
    return NextResponse.json({ error: "Ogiltigt format." }, { status: 400 });
  }
}
