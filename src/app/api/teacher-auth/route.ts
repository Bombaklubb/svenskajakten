import { NextRequest, NextResponse } from "next/server";

function makeToken(password: string): string {
  const payload = `${Date.now()}:${password}`;
  return Buffer.from(payload).toString("base64url");
}

export function validateToken(token: string): boolean {
  const password = process.env.TEACHER_PASSWORD;
  if (!password) return false;
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length < 2) return false;
    // Reconstruct password part (may contain colons)
    const tokenPassword = parts.slice(1).join(":");
    const ts = Number(parts[0]);
    // Token valid for 24 hours
    if (Date.now() - ts > 1000 * 60 * 60 * 24) return false;
    return tokenPassword === password;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    const expected = process.env.TEACHER_PASSWORD;

    if (!expected) {
      return NextResponse.json(
        { error: "TEACHER_PASSWORD är inte konfigurerat på servern." },
        { status: 503 }
      );
    }

    if (password !== expected) {
      return NextResponse.json({ error: "Fel lösenord." }, { status: 401 });
    }

    return NextResponse.json({ token: makeToken(expected) });
  } catch {
    return NextResponse.json({ error: "Ogiltigt format." }, { status: 400 });
  }
}
