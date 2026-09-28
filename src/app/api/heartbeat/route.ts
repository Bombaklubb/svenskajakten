import { NextRequest, NextResponse } from "next/server";
import { getKv, safeId } from "../_lib/kv";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Same rules as /api/track: the id becomes a set member, so it must be short
    // and harmless, or anyone could stuff the online set with junk.
    const sessionId = safeId(body?.sessionId, 100);
    if (!sessionId) {
      return NextResponse.json({ ok: true });
    }

    const kv = await getKv();
    if (!kv) return NextResponse.json({ ok: true });

    // Refresh the session's presence in the sorted set (score = current
    // timestamp). One command per beat: stale sessions are pruned by the stats
    // route, the only place the set is read, rather than on every heartbeat.
    await kv.zadd("online:sessions", { score: Date.now(), member: sessionId });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
