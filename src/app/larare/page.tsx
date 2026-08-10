"use client";

import { useState, useEffect, useCallback } from "react";

interface Stats {
  totals: {
    exercises: number;
    wrong: number;
    sessions: number;
    durationSeconds: number;
    uniqueDevices: number;
    onlineNow: number;
    todayDevices: number;
  };
  stageExercises: Record<string, number>;
  statsStartedAt: string | null;
}

const STAGES = [
  { id: "lagstadiet",    label: "Nivå 1–3",  subtitle: "Nivå 1–3", color: "#f59e0b", bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-200 dark:border-amber-700", text: "text-amber-700 dark:text-amber-300" },
  { id: "mellanstadiet", label: "Nivå 4–6",  subtitle: "Nivå 4–6", color: "#22c55e", bg: "bg-green-50 dark:bg-green-900/20",  border: "border-green-200 dark:border-green-700",  text: "text-green-700 dark:text-green-300" },
  { id: "hogstadiet",    label: "Nivå 7–9",  subtitle: "Nivå 7–9", color: "#3b82f6", bg: "bg-blue-50 dark:bg-blue-900/20",    border: "border-blue-200 dark:border-blue-700",    text: "text-blue-700 dark:text-blue-300" },
  { id: "gymnasiet",     label: "Nivå 10",   subtitle: "Nivå 10",  color: "#a855f7", bg: "bg-purple-50 dark:bg-purple-900/20", border: "border-purple-200 dark:border-purple-700", text: "text-purple-700 dark:text-purple-300" },
];

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} sek`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m} min`;
  return `${h}h ${m}m`;
}

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

  // Load stats when token is available + auto-refresh every 30s for online count
  useEffect(() => {
    if (!token) return;
    fetchStats(token);
    const interval = setInterval(() => fetchStats(token), 30_000);
    return () => clearInterval(interval);
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
          <p className="text-center text-xs text-gray-600 dark:text-gray-600 mt-4">
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
              <div className="grid grid-cols-3 gap-3 max-w-lg">
                {[
                  { label: "Inloggade nu", value: String(stats.totals.onlineNow), icon: "🟢", highlight: stats.totals.onlineNow > 0 },
                  { label: "Inloggade idag", value: stats.totals.todayDevices.toLocaleString("sv-SE"), icon: "📅", highlight: stats.totals.todayDevices > 0 },
                  { label: "Unika enheter", value: stats.totals.uniqueDevices.toLocaleString("sv-SE"), icon: "💻", highlight: false },
                ].map(({ label, value, icon, highlight }) => (
                  <div
                    key={label}
                    className={`rounded-2xl border p-4 text-center shadow-sm transition-colors ${
                      highlight
                        ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
                        : "bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700"
                    }`}
                  >
                    <div className="text-2xl mb-1">{icon}</div>
                    <div className="text-2xl font-black text-gray-900 dark:text-gray-100">{value}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-300 mt-0.5 font-medium">{label}</div>
                  </div>
                ))}
              </div>
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
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-800 dark:text-gray-100 text-sm">{s.label}</span>
                            {s.subtitle && (
                              <span className="text-xs text-gray-600 dark:text-gray-300">{s.subtitle}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 dark:text-gray-300 font-medium">
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
                  <li>✓ Endast summerad data visas (antal, tid, uppgifter)</li>
                </ul>
              </div>
              {stats.statsStartedAt && (
                <div className="border-t border-green-700/40 px-5 py-3 flex items-center gap-2">
                  <span className="text-base">📅</span>
                  <p className="text-green-300 text-sm">
                    Svenskajakten började samla in anonym statistik{" "}
                    <strong className="text-green-200">{formatStartDate(stats.statsStartedAt)}</strong>.{" "}
                    Data äldre än 14 dagar visas inte i grafen.
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
