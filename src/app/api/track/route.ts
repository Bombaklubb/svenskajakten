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

/** The only stages that may appear in a KV key. */
const VALID_STAGES = new Set(["lagstadiet", "mellanstadiet", "hogstadiet", "gymnasiet"]);

/**
 * This endpoint is unauthenticated by design (it is called from every pupil's
 * browser), so every value that reaches KV is validated first: ids that become
 * part of a key are restricted to a safe character set and free text is capped,
 * otherwise anyone could mint unlimited keys or store unbounded strings.
 */
function safeId(value: unknown, maxLength = 64): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) return null;
  return /^[A-Za-z0-9_-]+$/.test(trimmed) ? trimmed : null;
}

function safeText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.slice(0, maxLength) : "";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: true });
    }
    const { type, exerciseIdx, moduleTitle, questionPreview, durationSeconds } = body;

    const stage = typeof body.stage === "string" && VALID_STAGES.has(body.stage) ? body.stage : null;
    const moduleId = safeId(body.moduleId);
    const deviceId = safeId(body.deviceId, 100);
    const sessionId = safeId(body.sessionId, 100);

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
      if (deviceId) {
        ops.push(kv.sadd("unique:devices", deviceId));
        ops.push(kv.sadd(`daily:${day}:devices`, deviceId));
        ops.push(kv.expire(`daily:${day}:devices`, 60 * 60 * 24 * 90));
      }
      // Track online now via sorted set (score = timestamp)
      if (sessionId) {
        ops.push(kv.zadd("online:sessions", { score: Date.now(), member: sessionId }));
        ops.push(kv.zremrangebyscore("online:sessions", 0, Date.now() - ONLINE_TTL));
      }
      await Promise.all(ops);
    } else if (type === "session_end" && typeof durationSeconds === "number") {
      // Cap a single session at 4 hours so a forged value can't skew the total.
      const seconds = Math.min(Math.max(Math.floor(durationSeconds), 0), 4 * 60 * 60);
      if (seconds > 0) await kv.incrby("total:duration", seconds);
    } else if (type === "exercise_done") {
      const ops: Promise<unknown>[] = [
        kv.incr("total:exercises"),
        kv.incr(`daily:${day}:exercises`),
        kv.expire(`daily:${day}:exercises`, 60 * 60 * 24 * 90),
      ];
      if (stage) {
        ops.push(kv.incr(`stage:${stage}:exercises`));
      }
      await Promise.all(ops);
    } else if (
      type === "wrong_answer" &&
      stage &&
      moduleId &&
      typeof exerciseIdx === "number" &&
      Number.isInteger(exerciseIdx) &&
      exerciseIdx >= 0 &&
      exerciseIdx < 500
    ) {
      const mistakeKey = `mistake:${stage}:${moduleId}:${exerciseIdx}`;
      const existing = await kv.get<MistakeRecord>(mistakeKey);
      const updated: MistakeRecord = {
        count: (existing?.count ?? 0) + 1,
        stage,
        moduleId,
        moduleTitle: safeText(moduleTitle, 120) || moduleId,
        exerciseIdx,
        questionPreview: safeText(questionPreview, 200),
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
