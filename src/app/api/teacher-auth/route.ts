import { NextRequest, NextResponse } from "next/server";
import { makeToken } from "@/lib/teacherAuth";

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
