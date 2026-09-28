import { NextRequest, NextResponse } from "next/server";
import {
  getKv,
  safeId,
  safeStage,
  safeText,
  mistakesKey,
  mistakeInfoKey,
  MISTAKE_TTL_SECONDS,
  type ValidStage,
} from "../_lib/kv";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/** How many wrong answers one request may carry. Matches the client's batch size. */
const MAX_MISTAKES = 50;

interface Mistake {
  stage: ValidStage;
  member: string;
  title: string;
  preview: string;
}

/**
 * Validates a batch of wrong answers. Anything malformed is dropped on its
 * own; the rest of the batch still counts.
 */
function parseMistakes(raw: unknown): Mistake[] {
  if (!Array.isArray(raw)) return [];
  const out: Mistake[] = [];
  for (const item of raw.slice(0, MAX_MISTAKES)) {
    if (!item || typeof item !== "object") continue;
    const stage = safeStage(item.stage);
    const moduleId = safeId(item.moduleId);
    const idx = item.exerciseIdx;
    if (!stage || !moduleId || typeof idx !== "number" || !Number.isInteger(idx) || idx < 0 || idx >= 500) {
      continue;
    }
    out.push({
      stage,
      member: `${moduleId}:${idx}`,
      title: safeText(item.moduleTitle, 120) || moduleId,
      preview: safeText(item.questionPreview, 200),
    });
  }
  return out;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: true });
    }
    const { type } = body;

    const kv = await getKv();
    if (!kv) return NextResponse.json({ ok: true });

    // Everything a request writes goes out as one pipeline: one round trip,
    // and only the commands that are actually needed.
    const p = kv.pipeline();
    let commands = 0;

    if (type === "session_start") {
      // Sent once per browser session (see SessionTracker). The totals that
      // used to be counted here — sessions, daily sessions, time spent — were
      // never shown anywhere, so they are no longer kept.
      const day = todayKey();
      const deviceId = safeId(body.deviceId, 100);
      const sessionId = safeId(body.sessionId, 100);
      p.setnx("stats:started", new Date().toISOString());
      commands++;
      // Track unique devices (anonymous random ID from browser)
      if (deviceId) {
        p.sadd("unique:devices", deviceId);
        p.sadd(`daily:${day}:devices`, deviceId);
        p.expire(`daily:${day}:devices`, 60 * 60 * 24 * 90);
        commands += 3;
      }
      // Track online now via sorted set (score = timestamp). Stale entries are
      // pruned by the stats route, which is the only reader.
      if (sessionId) {
        p.zadd("online:sessions", { score: Date.now(), member: sessionId });
        commands++;
      }
    } else if (type === "exercise_done") {
      // Sent once per finished chapter, carrying how many answers were right,
      // instead of once per answer. Older clients that still send no count
      // mean one, so a stale tab keeps counting correctly.
      const raw = typeof body.count === "number" ? Math.floor(body.count) : 1;
      const count = Math.min(Math.max(raw, 1), 200);
      p.incrby("total:exercises", count);
      commands++;
      const stage = safeStage(body.stage);
      if (stage) {
        p.incrby(`stage:${stage}:exercises`, count);
        commands++;
      }
    }

    // Wrong answers: batched by the client, and carried either by the chapter's
    // "exercise_done" or by a request of their own ("mistakes"). A single
    // "wrong_answer" from a tab still running the old code is accepted too.
    const mistakes =
      type === "wrong_answer" ? parseMistakes([body]) : parseMistakes(body.mistakes);

    if (mistakes.length > 0) {
      // Collapse repeats within the batch, so one command covers each question.
      const counts = new Map<string, { m: Mistake; n: number }>();
      for (const m of mistakes) {
        const key = `${m.stage}|${m.member}`;
        const entry = counts.get(key);
        if (entry) entry.n++;
        else counts.set(key, { m, n: 1 });
      }

      const infoByStage = new Map<ValidStage, Record<string, { t: string; q: string }>>();
      for (const { m, n } of counts.values()) {
        p.zincrby(mistakesKey(m.stage), n, m.member);
        commands++;
        const info = infoByStage.get(m.stage) ?? {};
        info[m.member] = { t: m.title, q: m.preview };
        infoByStage.set(m.stage, info);
      }
      // One HSET per stage for all its previews, and the TTL is refreshed on
      // every write, so questions nobody gets wrong any more fade away.
      for (const [stage, info] of infoByStage) {
        p.hset(mistakeInfoKey(stage), info);
        p.expire(mistakesKey(stage), MISTAKE_TTL_SECONDS);
        p.expire(mistakeInfoKey(stage), MISTAKE_TTL_SECONDS);
        commands += 3;
      }
      p.incrby("total:wrong", mistakes.length);
      commands++;
    }

    if (commands > 0) await p.exec();

    return NextResponse.json({ ok: true });
  } catch {
    // Never crash – analytics is best-effort
    return NextResponse.json({ ok: true });
  }
}
