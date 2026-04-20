import { NextRequest, NextResponse } from "next/server";
import { validateToken } from "@/lib/teacherAuth";

const STAGES = ["lagstadiet", "mellanstadiet", "hogstadiet", "gymnasiet"] as const;

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

    const today = new Date().toISOString().slice(0, 10);

    // Totals + online + start date + today's unique devices
    const [totalExercises, totalWrong, totalSessions, totalDuration, uniqueDevices, onlineNow, statsStartedAt, todayDevices] =
      await Promise.all([
        kv.get<number>("total:exercises"),
        kv.get<number>("total:wrong"),
        kv.get<number>("total:sessions"),
        kv.get<number>("total:duration"),
        kv.scard("unique:devices"),
        kv.zcard("online:sessions"),
        kv.get<string>("stats:started"),
        kv.scard(`daily:${today}:devices`),
      ]);

    // Per-stage exercise counts
    const stageCounts = await Promise.all(
      STAGES.map((s) => kv.get<number>(`stage:${s}:exercises`))
    );
    const stageExercises: Record<string, number> = {};
    STAGES.forEach((s, i) => {
      stageExercises[s] = stageCounts[i] ?? 0;
    });

    return NextResponse.json({
      totals: {
        exercises: totalExercises ?? 0,
        wrong: totalWrong ?? 0,
        sessions: totalSessions ?? 0,
        durationSeconds: totalDuration ?? 0,
        uniqueDevices: uniqueDevices ?? 0,
        onlineNow: onlineNow ?? 0,
        todayDevices: todayDevices ?? 0,
      },
      stageExercises,
      statsStartedAt: statsStartedAt ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Serverfel." }, { status: 500 });
  }
}
