import { NextRequest, NextResponse } from "next/server";
import { makeToken } from "@/lib/teacherAuth";

const DEFAULT_PASSWORD = "Korsängen";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    const expected = process.env.TEACHER_PASSWORD ?? DEFAULT_PASSWORD;

    if (password !== expected) {
      return NextResponse.json({ error: "Fel lösenord." }, { status: 401 });
    }

    return NextResponse.json({ token: makeToken(expected) });
  } catch {
    return NextResponse.json({ error: "Ogiltigt format." }, { status: 400 });
  }
}
