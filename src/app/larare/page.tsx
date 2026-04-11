"use client";

import { useState, useEffect, useCallback } from "react";

interface MistakeRecord {
  count: number;
  stage: string;
  moduleId: string;
  moduleTitle: string;
  exerciseIdx: number;
  questionPreview: string;
}

interface DailyEntry {
  date: string;
  exercises: number;
  sessions: number;
}

interface Stats {
  totals: {
    exercises: number;
    wrong: number;
    sessions: number;
    durationSeconds: number;
  };
  daily: DailyEntry[];
  topMistakes: MistakeRecord[];
}

const STAGE_LABELS: Record<string, string> = {
  lagstadiet: "Lågstadiet (Åk 1–3)",
  mellanstadiet: "Mellanstadiet (Åk 4–6)",
  hogstadiet: "Högstadiet (Åk 7–9)",
  gymnasiet: "Gymnasiet",
};

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} sek`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m} min`;
  return `${h}h ${m}m`;
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
}

export default function LararePage() {
  const [password, setPassword] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsError, setStatsError] = useState("");
  const [statsLoading, setStatsLoading] = useState(false);

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

  // Load stats when token is available
  useEffect(() => {
    if (token) fetchStats(token);
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
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Svenskajakten – Anonymiserad statistik</p>
          </div>
          <form
            onSubmit={handleLogin}
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 border border-slate-100 dark:border-gray-700 space-y-4"
          >
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Lösenord
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ange läsarlösenord"
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
          <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-4">
            Lösenordet sätts i Vercel → Environment Variables → TEACHER_PASSWORD
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
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏫</span>
            <div>
              <h1 className="font-black text-gray-900 dark:text-gray-100 text-lg">Lärarvy – Svenskajakten</h1>
              <p className="text-xs text-gray-400 dark:text-gray-500">Anonymiserad aggregerad statistik · GDPR-säkrad</p>
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
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl animate-pulse mb-3">📊</div>
            <p>Hämtar statistik…</p>
          </div>
        )}

        {stats && (
          <>
            {/* Totals cards */}
            <section>
              <h2 className="font-black text-gray-800 dark:text-gray-100 mb-3 text-sm uppercase tracking-wider">Totalt – alla enheter</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Uppgifter gjorda", value: stats.totals.exercises.toLocaleString("sv-SE"), icon: "📝" },
                  { label: "Sessioner", value: stats.totals.sessions.toLocaleString("sv-SE"), icon: "🚀" },
                  { label: "Total tid", value: formatDuration(stats.totals.durationSeconds), icon: "⏱️" },
                  { label: "Felaktiga svar", value: stats.totals.wrong.toLocaleString("sv-SE"), icon: "❌" },
                ].map(({ label, value, icon }) => (
                  <div
                    key={label}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-4 text-center shadow-sm"
                  >
                    <div className="text-2xl mb-1">{icon}</div>
                    <div className="text-2xl font-black text-gray-900 dark:text-gray-100">{value}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">{label}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Daily bar chart */}
            <section>
              <h2 className="font-black text-gray-800 dark:text-gray-100 mb-3 text-sm uppercase tracking-wider">
                Dagliga uppgifter – senaste 14 dagarna
              </h2>
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-5 shadow-sm">
                {(() => {
                  const maxVal = Math.max(...stats.daily.map((d) => d.exercises), 1);
                  return (
                    <div className="space-y-2">
                      {stats.daily.map((d) => (
                        <div key={d.date} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 dark:text-gray-400 w-14 text-right shrink-0">
                            {formatDate(d.date)}
                          </span>
                          <div className="flex-1 bg-slate-100 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                            <div
                              className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                              style={{
                                width: `${Math.max((d.exercises / maxVal) * 100, d.exercises > 0 ? 3 : 0)}%`,
                                background: "linear-gradient(90deg, #006AA7, #0891b2)",
                              }}
                            />
                          </div>
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 w-8 shrink-0">
                            {d.exercises}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </section>

            {/* Top mistakes */}
            <section>
              <h2 className="font-black text-gray-800 dark:text-gray-100 mb-3 text-sm uppercase tracking-wider">
                Vanligaste felen (topp {stats.topMistakes.length})
              </h2>
              {stats.topMistakes.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-8 text-center text-gray-400">
                  <div className="text-3xl mb-2">🎉</div>
                  <p>Inga fel registrerade ännu.</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-gray-700 bg-slate-50 dark:bg-gray-750">
                        <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide w-8">#</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Stadie</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Modul</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden sm:table-cell">Fråga</th>
                        <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Fel</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.topMistakes.map((m, i) => (
                        <tr key={`${m.stage}-${m.moduleId}-${m.exerciseIdx}`}
                          className="border-b border-slate-50 dark:border-gray-700 last:border-0 hover:bg-slate-50 dark:hover:bg-gray-750 transition-colors">
                          <td className="px-4 py-3 text-gray-400 font-medium">{i + 1}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                            <span className="whitespace-nowrap">
                              {STAGE_LABELS[m.stage] ?? m.stage}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">
                            {m.moduleTitle}
                            <span className="text-xs text-gray-400 ml-1">(nr {m.exerciseIdx + 1})</span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden sm:table-cell max-w-xs truncate">
                            {m.questionPreview}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="inline-block bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-bold px-2.5 py-1 rounded-lg text-xs">
                              {m.count}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* GDPR notice */}
            <section className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4">
              <p className="text-green-800 dark:text-green-300 text-xs font-medium">
                🔒 GDPR-säkrad: Ingen statistik innehåller elevnamn, IP-adresser eller enhetsidentifierare.
                All data är anonyma aggregerade räknare som inte kan kopplas till enskilda elever.
              </p>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
