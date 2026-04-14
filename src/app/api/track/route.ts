import { NextRequest, NextResponse } from "next/server";

interface MistakeRecord {
  count: number;
  stage: string;
  moduleId: string;
  moduleTitle: string;
  exerciseIdx: number;
  questionPreview: string;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, stage, moduleId, exerciseIdx, moduleTitle, questionPreview, durationSeconds, deviceId, sessionId } = body;

    // Lazily import kv – silently skip if env vars not configured
    let kv: import("@vercel/kv").VercelKV;
    try {
      const mod = await import("@vercel/kv");
      kv = mod.kv;
    } catch {
      return NextResponse.json({ ok: true });
    }

    const day = todayKey();
    const ONLINE_TTL = 5 * 60 * 1000; // 5 min in ms

    if (type === "session_start") {
      const ops: Promise<unknown>[] = [
        kv.incr("total:sessions"),
        kv.incr(`daily:${day}:sessions`),
        kv.expire(`daily:${day}:sessions`, 60 * 60 * 24 * 90),
        kv.setnx("stats:started", new Date().toISOString()),
      ];
      // Track unique devices (anonymous random ID from browser)
      if (deviceId && typeof deviceId === "string") {
        ops.push(kv.sadd("unique:devices", deviceId));
      }
      // Track online now via sorted set (score = timestamp)
      if (sessionId && typeof sessionId === "string") {
        ops.push(kv.zadd("online:sessions", { score: Date.now(), member: sessionId }));
        ops.push(kv.zremrangebyscore("online:sessions", 0, Date.now() - ONLINE_TTL));
      }
      await Promise.all(ops);
    } else if (type === "session_end" && typeof durationSeconds === "number" && durationSeconds > 0) {
      await kv.incrby("total:duration", durationSeconds);
    } else if (type === "exercise_done") {
      const ops: Promise<unknown>[] = [
        kv.incr("total:exercises"),
        kv.incr(`daily:${day}:exercises`),
        kv.expire(`daily:${day}:exercises`, 60 * 60 * 24 * 90),
      ];
      if (stage && typeof stage === "string") {
        ops.push(kv.incr(`stage:${stage}:exercises`));
      }
      await Promise.all(ops);
    } else if (type === "wrong_answer" && stage && moduleId && typeof exerciseIdx === "number") {
      const mistakeKey = `mistake:${stage}:${moduleId}:${exerciseIdx}`;
      const existing = await kv.get<MistakeRecord>(mistakeKey);
      const updated: MistakeRecord = {
        count: (existing?.count ?? 0) + 1,
        stage: stage as string,
        moduleId: moduleId as string,
        moduleTitle: (moduleTitle as string) ?? moduleId,
        exerciseIdx: exerciseIdx as number,
        questionPreview: (questionPreview as string) ?? "",
      };
      await Promise.all([
        kv.set(mistakeKey, updated),
        kv.incr("total:wrong"),
      ]);
    }

    return NextResponse.json({ ok: true });
  } catch {
    // Never crash – analytics is best-effort
    return NextResponse.json({ ok: true });
  }
}
