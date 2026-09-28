import { NextRequest, NextResponse } from "next/server";
import { validateToken } from "@/lib/teacherAuth";
import {
  getKv,
  VALID_STAGES,
  ONLINE_WINDOW_MS,
  mistakesKey,
  mistakeInfoKey,
} from "../_lib/kv";

/** How many of the most common mistakes are returned per stage. */
const TOP_MISTAKES = 20;

/** Questions kept per stage; the long tail below this is trimmed now and then. */
const KEEP_MISTAKES = 500;

/**
 * Every teacher sees the same numbers, so one reading is shared by all of them
 * for a short while. Two teachers with the page open, or one pressing
 * "Uppdatera" repeatedly, then cost no more than one. A serverless instance
 * may be recycled at any time; that only means an extra reading.
 */
const CACHE_MS = 60 * 1000;
let cached: { at: number; body: unknown } | null = null;

/** The long tail of each mistake list is trimmed at most once an hour. */
const TRIM_EVERY_MS = 60 * 60 * 1000;
let lastTrim = 0;

export interface MistakeRow {
  stage: string;
  moduleId: string;
  exerciseIdx: number;
  moduleTitle: string;
  questionPreview: string;
  count: number;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");

  if (!validateToken(token)) {
    return NextResponse.json({ error: "Obehörig." }, { status: 401 });
  }

  if (cached && Date.now() - cached.at < CACHE_MS) {
    return NextResponse.json(cached.body);
  }

  const kv = await getKv();
  if (!kv) {
    return NextResponse.json({ error: "KV ej konfigurerat." }, { status: 503 });
  }

  try {
    const now = Date.now();
    const today = new Date(now).toISOString().slice(0, 10);

    // One pipeline, one round trip. The counters are read with a single MGET.
    const p = kv.pipeline();
    // Stale online sessions are pruned here, the set's only reader, instead of
    // on every heartbeat.
    p.zremrangebyscore("online:sessions", 0, now - ONLINE_WINDOW_MS);
    p.zcard("online:sessions");
    p.scard("unique:devices");
    p.scard(`daily:${today}:devices`);
    p.mget(
      "total:exercises",
      "total:wrong",
      "stats:started",
      ...VALID_STAGES.map((s) => `stage:${s}:exercises`)
    );
    for (const s of VALID_STAGES) {
      p.zrange(mistakesKey(s), 0, TOP_MISTAKES - 1, { rev: true, withScores: true });
    }
    const trim = now - lastTrim > TRIM_EVERY_MS;
    if (trim) {
      for (const s of VALID_STAGES) p.zremrangebyrank(mistakesKey(s), 0, -(KEEP_MISTAKES + 1));
    }
    const res = (await p.exec()) as unknown[];
    if (trim) lastTrim = now;

    const onlineNow = Number(res[1] ?? 0);
    const uniqueDevices = Number(res[2] ?? 0);
    const todayDevices = Number(res[3] ?? 0);
    const counters = (res[4] ?? []) as (number | string | null)[];
    const totalExercises = Number(counters[0] ?? 0);
    const totalWrong = Number(counters[1] ?? 0);
    const statsStartedAt = typeof counters[2] === "string" ? counters[2] : null;
    const stageExercises: Record<string, number> = {};
    VALID_STAGES.forEach((s, i) => {
      stageExercises[s] = Number(counters[3 + i] ?? 0);
    });

    // zrange withScores comes back flat: [member, score, member, score, …]
    const topByStage = VALID_STAGES.map((stage, i) => {
      const flat = (res[5 + i] ?? []) as (string | number)[];
      const rows: { member: string; count: number }[] = [];
      for (let j = 0; j + 1 < flat.length; j += 2) {
        rows.push({ member: String(flat[j]), count: Number(flat[j + 1]) });
      }
      return { stage, rows };
    });

    // Titles and question texts, only for the members actually shown.
    const withRows = topByStage.filter((t) => t.rows.length > 0);
    const infos: (Record<string, { t?: string; q?: string } | null> | null)[] = [];
    if (withRows.length > 0) {
      const p2 = kv.pipeline();
      for (const t of withRows) p2.hmget(mistakeInfoKey(t.stage), ...t.rows.map((r) => r.member));
      infos.push(...((await p2.exec()) as typeof infos));
    }

    const mistakes: MistakeRow[] = [];
    withRows.forEach((t, i) => {
      const info = infos[i] ?? {};
      for (const r of t.rows) {
        const colon = r.member.lastIndexOf(":");
        const moduleId = r.member.slice(0, colon);
        const meta = info[r.member] ?? {};
        mistakes.push({
          stage: t.stage,
          moduleId,
          exerciseIdx: Number(r.member.slice(colon + 1)),
          moduleTitle: meta.t || moduleId,
          questionPreview: meta.q ?? "",
          count: r.count,
        });
      }
    });
    mistakes.sort((a, b) => b.count - a.count);

    const body = {
      totals: {
        exercises: totalExercises,
        wrong: totalWrong,
        uniqueDevices,
        onlineNow,
        todayDevices,
      },
      stageExercises,
      // Up to TOP_MISTAKES per stage, most common first; the page picks the
      // overall top list or one stage's from these.
      mistakes,
      statsStartedAt,
    };
    cached = { at: now, body };
    return NextResponse.json(body);
  } catch {
    return NextResponse.json({ error: "Serverfel." }, { status: 500 });
  }
}
