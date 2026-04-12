import { NextRequest, NextResponse } from "next/server";

const ONLINE_TTL_SECONDS = 5 * 60; // 5 minutes

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();
    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json({ ok: true });
    }

    let kv: import("@vercel/kv").VercelKV;
    try {
      const mod = await import("@vercel/kv");
      kv = mod.kv;
    } catch {
      return NextResponse.json({ ok: true });
    }

    // Refresh the session's presence in the sorted set (score = current timestamp)
    await kv.zadd("online:sessions", { score: Date.now(), member: sessionId });

    // Clean up stale sessions (older than 5 min) on every heartbeat
    await kv.zremrangebyscore("online:sessions", 0, Date.now() - ONLINE_TTL_SECONDS * 1000);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
