"use client";

import { useState, useEffect, useCallback } from "react";

interface Stats {
  totals: {
    exercises: number;
    wrong: number;
    uniqueDevices: number;
    onlineNow: number;
    todayDevices: number;
  };
  stageExercises: Record<string, number>;
  /** Up to twenty per stage, most common first. */
  mistakes?: MistakeRow[];
  statsStartedAt: string | null;
}

interface MistakeRow {
  stage: string;
  moduleId: string;
  exerciseIdx: number;
  moduleTitle: string;
  questionPreview: string;
  count: number;
}

/** How many rows the "Vanligaste felen" list shows. */
const TOP_MISTAKES = 20;

const STAGES = [
  { id: "lagstadiet",    label: "Nivå 1–3",  subtitle: "Ordängen", color: "#f59e0b", bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-200 dark:border-amber-700", text: "text-amber-700 dark:text-amber-300" },
  { id: "mellanstadiet", label: "Nivå 4–6",  subtitle: "Berättelseskogen", color: "#22c55e", bg: "bg-green-50 dark:bg-green-900/20",  border: "border-green-200 dark:border-green-700",  text: "text-green-700 dark:text-green-300" },
  { id: "hogstadiet",    label: "Nivå 7–9",  subtitle: "Texthavet", color: "#3b82f6", bg: "bg-blue-50 dark:bg-blue-900/20",    border: "border-blue-200 dark:border-blue-700",    text: "text-blue-700 dark:text-blue-300" },
  { id: "gymnasiet",     label: "Nivå 10",   subtitle: "Skrivakademin",  color: "#a855f7", bg: "bg-purple-50 dark:bg-purple-900/20", border: "border-purple-200 dark:border-purple-700", text: "text-purple-700 dark:text-purple-300" },
];

function formatStartDate(iso: string): string {
  return new Date(iso).toLocaleDateString("sv-SE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function LararePage() {
  const [password, setPassword] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsError, setStatsError] = useState("");
  const [statsLoading, setStatsLoading] = useState(false);
  const [mistakeStage, setMistakeStage] = useState<string>("all");

  // Restore token from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem("teacher_token");
    if (saved) setToken(saved);
  }, []);

  const fetchStats = useCallback(async (t: string) => {
    setStatsLoading(true);
    setStatsError("");
    try {
      const res = await fetch("/api/stats", {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.status === 401) {
        sessionStorage.removeItem("teacher_token");
        setToken(null);
        setStatsError("Sessionen har löpt ut. Logga in igen.");
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        setStatsError(data.error ?? "Kunde inte hämta statistik.");
        return;
      }
      const data = await res.json();
      setStats(data as Stats);
    } catch {
      setStatsError("Nätverksfel – kunde inte hämta statistik.");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Refreshed every two minutes, and only while the tab is actually being
  // looked at. One reading costs up to seventeen Redis commands (the route
  // shares a reading between requests for a minute), so the old
  // every-thirty-seconds timer was the single largest consumer of the month's
  // quota when a tab was left open across a school day. Coming back to the tab
  // refreshes at once, so the numbers are never stale on screen.
  useEffect(() => {
    if (!token) return;

    let timer: ReturnType<typeof setInterval> | null = null;

    function start() {
      if (timer) return;
      timer = setInterval(() => fetchStats(token!), 2 * 60_000);
    }
    function stop() {
      if (!timer) return;
      clearInterval(timer);
      timer = null;
    }
    function onVisibility() {
      if (document.hidden) {
        stop();
      } else {
        fetchStats(token!);
        start();
      }
    }

    fetchStats(token);
    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [token, fetchStats]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await fetch("/api/teacher-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error ?? "Inloggning misslyckades.");
        return;
      }
      sessionStorage.setItem("teacher_token", data.token);
      setToken(data.token);
    } catch {
      setLoginError("Nätverksfel – försök igen.");
    } finally {
      setLoginLoading(false);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem("teacher_token");
    setToken(null);
    setStats(null);
    setPassword("");
  }

  // ── Login screen ─────────────────────────────────────────────────────────────
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🏫</div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">Lärarvy</h1>
            <p className="text-gray-500 dark:text-gray-300 text-sm mt-1">Svenskajakten – Anonymiserad statistik</p>
          </div>
          <form
            onSubmit={handleLogin}
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 border border-slate-100 dark:border-gray-700 space-y-4"
          >
            <div>
              <label htmlFor="teacher-password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Lösenord
              </label>
              <input
                id="teacher-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ange lärarlösenord"
                required
                className="w-full border-2 border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 dark:bg-gray-700 focus:outline-none focus:border-blue-400 transition-colors"
              />
            </div>
            {loginError && (
              <p className="text-red-600 dark:text-red-400 text-sm font-medium">{loginError}</p>
            )}
            <button
              type="submit"
              disabled={loginLoading || !password}
              className="w-full py-3 rounded-xl font-bold text-white transition-all"
              style={{ background: "linear-gradient(135deg, #006AA7, #004a75)" }}
            >
              {loginLoading ? "Loggar in…" : "Logga in →"}
            </button>
          </form>
          <p className="text-center text-xs text-gray-600 dark:text-gray-300 mt-4">
            Lösenordet får du av den som driver Svenskajakten på din skola.
          </p>
        </div>
      </div>
    );
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl">🏫</span>
            <div>
              <h1 className="font-black text-gray-900 dark:text-gray-100 text-base sm:text-lg">Lärarvy – Svenskajakten</h1>
              <p className="text-xs text-gray-600 dark:text-gray-300">Anonymiserad aggregerad statistik · GDPR-säkrad</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchStats(token)}
              disabled={statsLoading}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              {statsLoading ? "Laddar…" : "↻ Uppdatera"}
            </button>
            <button
              onClick={handleLogout}
              className="text-sm text-red-500 dark:text-red-400 hover:underline font-medium"
            >
              Logga ut
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {statsError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-2xl p-4 text-red-700 dark:text-red-300 text-sm font-medium">
            {statsError}
          </div>
        )}

        {statsLoading && !stats && (
          <div className="text-center py-16 text-gray-600 dark:text-gray-300">
            <div className="text-4xl animate-pulse mb-3">📊</div>
            <p>Hämtar statistik…</p>
          </div>
        )}

        {stats && (
          <>
            {/* Totals cards */}
            <section>
              <h2 className="font-black text-gray-800 dark:text-gray-100 mb-3 text-sm uppercase tracking-wider">Översikt</h2>
              {/* Two columns on a phone: three tiles of a 360px screen left each one
                  about 100px, and a five-digit number spilled out of it. */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 max-w-3xl">
                {[
                  { label: "Inloggade nu", value: String(stats.totals.onlineNow), icon: "🟢", highlight: stats.totals.onlineNow > 0 },
                  { label: "Inloggade idag", value: stats.totals.todayDevices.toLocaleString("sv-SE"), icon: "📅", highlight: stats.totals.todayDevices > 0 },
                  { label: "Enheter sedan start", value: stats.totals.uniqueDevices.toLocaleString("sv-SE"), icon: "💻", highlight: false },
                  { label: "Övningar klarade", value: stats.totals.exercises.toLocaleString("sv-SE"), icon: "✅", highlight: false },
                  {
                    // Share of answered exercises that were wrong – the signal a
                    // teacher actually acts on, so show it as a rate, not a count.
                    label: "Andel fel",
                    value:
                      stats.totals.exercises + stats.totals.wrong > 0
                        ? `${Math.round((stats.totals.wrong / (stats.totals.exercises + stats.totals.wrong)) * 100)} %`
                        : "–",
                    icon: "✏️",
                    highlight: false,
                  },
                ].map(({ label, value, icon, highlight }) => (
                  <div
                    key={label}
                    className={`min-w-0 rounded-2xl border p-3 sm:p-4 text-center shadow-sm transition-colors ${
                      highlight
                        ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
                        : "bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700"
                    }`}
                  >
                    <div className="text-xl sm:text-2xl mb-1" aria-hidden="true">{icon}</div>
                    <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 break-words">{value}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 font-medium">{label}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 max-w-3xl leading-relaxed">
                &quot;Enheter sedan start&quot; räknar webbläsarprofiler som kört appen, inte fysiska datorer –
                en rensad Chromebook eller ett gästläge räknas som en ny. Siffran växer alltid och
                säger inget om hur många som använder appen just nu.
              </p>
            </section>

            {/* Per-stage usage */}
            <section>
              <h2 className="font-black text-gray-800 dark:text-gray-100 mb-3 text-sm uppercase tracking-wider">
                Användning per stadie
              </h2>
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-5 shadow-sm space-y-5">
                {(() => {
                  const total = STAGES.reduce((sum, s) => sum + (stats.stageExercises[s.id] ?? 0), 0);
                  const maxVal = Math.max(...STAGES.map((s) => stats.stageExercises[s.id] ?? 0), 1);
                  return STAGES.map((s) => {
                    const count = stats.stageExercises[s.id] ?? 0;
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                    const barWidth = Math.max((count / maxVal) * 100, count > 0 ? 3 : 0);
                    return (
                      <div key={s.id}>
                        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 mb-1.5">
                          <div className="flex flex-wrap items-baseline gap-x-2 min-w-0">
                            <span className="font-bold text-gray-800 dark:text-gray-100 text-sm">{s.label}</span>
                            {s.subtitle && (
                              <span className="text-xs text-gray-600 dark:text-gray-300">{s.subtitle}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 ml-auto">
                            <span className="text-xs text-gray-600 dark:text-gray-300 font-medium whitespace-nowrap">
                              {count.toLocaleString("sv-SE")} uppgifter
                            </span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${s.bg} ${s.border} ${s.text}`}>
                              {pct}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-gray-700 rounded-full h-5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${barWidth}%`, background: s.color }}
                          />
                        </div>
                      </div>
                    );
                  });
                })()}
                {STAGES.every((s) => (stats.stageExercises[s.id] ?? 0) === 0) && (
                  <p className="text-center text-gray-600 text-sm py-4 dark:text-gray-300">Inga uppgifter registrerade ännu.</p>
                )}
              </div>
            </section>

            {/* Most common mistakes */}
            <MistakesSection
              mistakes={stats.mistakes ?? []}
              stage={mistakeStage}
              onStageChange={setMistakeStage}
            />

            {/* GDPR notice */}
            <section className="rounded-2xl overflow-hidden border border-green-700/40" style={{ background: "#0d1f1a" }}>
              <div className="p-5">
                <p className="font-black text-green-400 text-sm mb-2">🔒 GDPR-säkrad statistik</p>
                <p className="text-green-300 text-sm mb-3">
                  Inga personuppgifter samlas in. Varje enhet identifieras av ett slumpmässigt anonymt ID som inte kan kopplas till en person. All statistik är aggregerad och visas aldrig på individnivå.
                </p>
                <ul className="space-y-1 text-green-400 text-sm">
                  <li>✓ Inga namn, IP-adresser eller inloggningsuppgifter lagras</li>
                  <li>✓ Anonymt enhets-ID (UUID) – kan inte kopplas till en elev</li>
                  <li>✓ Endast summerad data visas (antal uppgifter och fel per fråga)</li>
                </ul>
              </div>
              {stats.statsStartedAt && (
                <div className="border-t border-green-700/40 px-5 py-3 flex items-center gap-2">
                  <span className="text-base">📅</span>
                  <p className="text-green-300 text-sm">
                    Svenskajakten började samla in anonym statistik{" "}
                    <strong className="text-green-200">{formatStartDate(stats.statsStartedAt)}</strong>.{" "}
                    Listan över vanliga fel glömmer en fråga som ingen svarat fel på under 90 dagar.
                  </p>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

/**
 * "Vanligaste felen" – the questions pupils get wrong most often. The route
 * returns the top list per stage; "Alla" merges them and keeps the top twenty.
 */
function MistakesSection({
  mistakes,
  stage,
  onStageChange,
}: {
  mistakes: MistakeRow[];
  stage: string;
  onStageChange: (stage: string) => void;
}) {
  const rows = (stage === "all" ? mistakes : mistakes.filter((m) => m.stage === stage))
    .slice()
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_MISTAKES);

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
        <h2 className="font-black text-gray-800 dark:text-gray-100 text-sm uppercase tracking-wider">
          Vanligaste felen
        </h2>
        <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
          Stadie
          <select
            value={stage}
            onChange={(e) => onStageChange(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-2 py-1 text-sm"
          >
            <option value="all">Alla</option>
            {STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label} · {s.subtitle}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm">
        {rows.length === 0 ? (
          <p className="text-center text-gray-600 dark:text-gray-300 text-sm py-6 px-4">
            Inga fel registrerade ännu.
          </p>
        ) : (
          <ol className="divide-y divide-slate-100 dark:divide-gray-700">
            {rows.map((m, i) => {
              const st = STAGES.find((s) => s.id === m.stage);
              return (
                <li key={`${m.stage}:${m.moduleId}:${m.exerciseIdx}`} className="flex items-start gap-3 px-4 py-3">
                  <span className="w-6 flex-shrink-0 text-right text-sm font-black text-gray-500 dark:text-gray-400">
                    {i + 1}.
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">
                      {m.questionPreview || `Fråga ${m.exerciseIdx + 1}`}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="break-words">{m.moduleTitle} · fråga {m.exerciseIdx + 1}</span>
                      {st && (
                        <span className={`font-bold px-2 py-0.5 rounded-full border ${st.bg} ${st.border} ${st.text}`}>
                          {st.label}
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="flex-shrink-0 text-sm font-black text-red-700 dark:text-red-300 whitespace-nowrap">
                    {m.count.toLocaleString("sv-SE")} fel
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
