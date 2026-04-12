import { NextRequest, NextResponse } from "next/server";
import { validateToken } from "@/lib/teacherAuth";

interface MistakeRecord {
  count: number;
  stage: string;
  moduleId: string;
  moduleTitle: string;
  exerciseIdx: number;
  questionPreview: string;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");

  if (!validateToken(token)) {
    return NextResponse.json({ error: "Obehörig." }, { status: 401 });
  }

  try {
    let kv: import("@vercel/kv").VercelKV;
    try {
      const mod = await import("@vercel/kv");
      kv = mod.kv;
    } catch {
      return NextResponse.json({ error: "KV ej konfigurerat." }, { status: 503 });
    }

    // Clean stale online sessions before counting
    await kv.zremrangebyscore("online:sessions", 0, Date.now() - 5 * 60 * 1000);

    // Totals
    const [totalExercises, totalWrong, totalSessions, totalDuration, uniqueDevices, onlineNow] = await Promise.all([
      kv.get<number>("total:exercises"),
      kv.get<number>("total:wrong"),
      kv.get<number>("total:sessions"),
      kv.get<number>("total:duration"),
      kv.scard("unique:devices"),
      kv.zcard("online:sessions"),
    ]);

    // Daily data: last 14 days
    const dailyKeys: string[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dailyKeys.push(d.toISOString().slice(0, 10));
    }

    const dailyExercisesRaw = await Promise.all(
      dailyKeys.map((day) => kv.get<number>(`daily:${day}:exercises`))
    );
    const dailySessionsRaw = await Promise.all(
      dailyKeys.map((day) => kv.get<number>(`daily:${day}:sessions`))
    );

    const daily = dailyKeys.map((day, i) => ({
      date: day,
      exercises: dailyExercisesRaw[i] ?? 0,
      sessions: dailySessionsRaw[i] ?? 0,
    }));

    // Top mistakes: scan keys with pattern mistake:*
    const mistakeKeys = await kv.keys("mistake:*");
    let topMistakes: MistakeRecord[] = [];
    if (mistakeKeys.length > 0) {
      const records = await Promise.all(
        mistakeKeys.map((k) => kv.get<MistakeRecord>(k))
      );
      topMistakes = records
        .filter((r): r is MistakeRecord => r !== null)
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);
    }

    return NextResponse.json({
      totals: {
        exercises: totalExercises ?? 0,
        wrong: totalWrong ?? 0,
        sessions: totalSessions ?? 0,
        durationSeconds: totalDuration ?? 0,
        uniqueDevices: uniqueDevices ?? 0,
        onlineNow: onlineNow ?? 0,
      },
      daily,
      topMistakes,
    });
  } catch {
    return NextResponse.json({ error: "Serverfel." }, { status: 500 });
  }
}
