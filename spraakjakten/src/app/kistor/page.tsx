"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/ui/Header";
import { loadStudent, loadGamification, saveGamification } from "@/lib/storage";
import { CHEST_LABELS, CHEST_EMOJIS, CHEST_COLORS } from "@/lib/gamification";
import { BlurFade } from "@/components/magicui/blur-fade";
import type { StudentData, GamificationData, Chest } from "@/lib/types";

const CHEST_REWARDS: Record<string, string[]> = {
  wood:    ["🌟 +15 bonuspoäng", "📚 Ordförrådstips", "💡 Gratis ledtråd"],
  silver:  ["⭐ +30 bonuspoäng", "🎯 Bonusövning upplåst", "🏅 Framstegsmärke"],
  gold:    ["🏆 +60 bonuspoäng", "🎖️ Guldmärke", "🎁 Surprise!"],
  emerald: ["💚 +100 bonuspoäng", "👑 Smaragdtitel", "🎊 Stort firande!"],
  ruby:    ["❤️ +150 bonuspoäng", "🔮 Rubintitel", "🌈 Regnbågsmärke"],
  diamond: ["💎 +200 bonuspoäng", "👑 Diamanttitel", "🏆 Legendarisk status!"],
};

export default function KistorPage() {
  const [student, setStudent] = useState<StudentData | null>(null);
  const [gam, setGam] = useState<GamificationData | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [reward, setReward] = useState<string | null>(null);

  useEffect(() => {
    setStudent(loadStudent());
    setGam(loadGamification());
  }, []);

  function openChest(chest: Chest) {
    if (chest.opened || !gam) return;
    setOpeningId(chest.id);

    const rewards = CHEST_REWARDS[chest.type] ?? ["🎁 Surprise!"];
    const picked = rewards[Math.floor(Math.random() * rewards.length)];

    setTimeout(() => {
      const updated: GamificationData = {
        ...gam,
        chests: gam.chests.map((c) =>
          c.id === chest.id ? { ...c, opened: true, openedReward: picked } : c
        ),
      };
      saveGamification(updated);
      setGam(updated);
      setReward(picked);
      setOpeningId(null);
    }, 600);
  }

  const unopened = gam?.chests.filter((c) => !c.opened) ?? [];
  const opened   = gam?.chests.filter((c) =>  c.opened) ?? [];

  return (
    <div className="min-h-screen bg-sky-50 dark:bg-gray-900">
      <Header student={student} />

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <BlurFade>
          <Link href="/" className="inline-flex items-center gap-1.5 text-sj-600 text-sm font-bold mb-2">← Tillbaka</Link>
          <h1 className="text-2xl font-black text-gray-800 dark:text-gray-100">🏆 Mina kistor</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            Öppna dina intjänade kistor och se vad de innehåller!
          </p>
        </BlurFade>

        {/* Reward toast */}
        {reward && (
          <BlurFade>
            <div
              className="bg-gradient-to-r from-yellow-400 to-amber-400 rounded-2xl p-4 text-center font-black text-white text-lg animate-pop"
              style={{ boxShadow: "0 4px 0 0 rgba(245,158,11,0.4)" }}
            >
              ✨ {reward}
              <button onClick={() => setReward(null)} className="block mx-auto mt-2 text-xs font-bold text-white/70 hover:text-white">
                Stäng
              </button>
            </div>
          </BlurFade>
        )}

        {/* Unopened chests */}
        {unopened.length > 0 && (
          <BlurFade delay={0.04}>
            <div className="card">
              <h2 className="text-lg font-black text-gray-800 dark:text-gray-100 mb-4">
                Oöppnade ({unopened.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {unopened.map((chest) => (
                  <button
                    key={chest.id}
                    onClick={() => openChest(chest)}
                    disabled={openingId === chest.id}
                    className={`rounded-2xl overflow-hidden border-3 border-amber-300 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg active:scale-95 ${
                      openingId === chest.id ? "opacity-60 animate-wiggle" : ""
                    }`}
                    style={{ boxShadow: "0 4px 0 0 rgba(245,158,11,0.3)" }}
                  >
                    <div className={`bg-gradient-to-br ${CHEST_COLORS[chest.type]} px-4 py-5 flex flex-col items-center gap-2`}>
                      <span className="text-4xl">{openingId === chest.id ? "✨" : CHEST_EMOJIS[chest.type]}</span>
                      <span className="text-white font-black text-xs">{CHEST_LABELS[chest.type]}</span>
                    </div>
                    <div className="bg-white dark:bg-gray-800 py-2 text-center text-xs font-bold text-sj-600">
                      {openingId === chest.id ? "Öppnar..." : "Tryck för att öppna!"}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </BlurFade>
        )}

        {unopened.length === 0 && (
          <BlurFade delay={0.04}>
            <div className="card text-center py-12">
              <div className="text-5xl mb-3">📭</div>
              <h2 className="text-lg font-black text-gray-700 dark:text-gray-200 mb-1">Inga kistor att öppna</h2>
              <p className="text-gray-500 text-sm">Slutför övningar för att tjäna nya kistor!</p>
              <Link
                href="/"
                className="inline-block mt-4 btn-primary text-sm"
                style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
              >
                Öva nu →
              </Link>
            </div>
          </BlurFade>
        )}

        {/* Opened chests */}
        {opened.length > 0 && (
          <BlurFade delay={0.08}>
            <div className="card">
              <h2 className="text-lg font-black text-gray-800 dark:text-gray-100 mb-4">
                Öppnade ({opened.length})
              </h2>
              <div className="space-y-2">
                {opened.slice().reverse().map((chest) => (
                  <div
                    key={chest.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50"
                  >
                    <span className="text-2xl opacity-50">{CHEST_EMOJIS[chest.type]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-500 dark:text-gray-400">{CHEST_LABELS[chest.type]}</p>
                      {chest.openedReward && (
                        <p className="text-xs text-sj-600 dark:text-sj-400">{chest.openedReward}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">✓ Öppnad</span>
                  </div>
                ))}
              </div>
            </div>
          </BlurFade>
        )}

        {/* Boss battle teaser */}
        {(gam?.bossUnlocked) && (
          <BlurFade delay={0.12}>
            <Link href="/boss">
              <div
                className="rounded-2xl overflow-hidden border-3 border-red-400 cursor-pointer hover:-translate-y-1 transition-all"
                style={{ boxShadow: "0 4px 0 0 rgba(239,68,68,0.3)" }}
              >
                <div className="bg-gradient-to-br from-red-900 via-red-800 to-red-700 px-5 py-6 flex items-center gap-4">
                  <span className="text-5xl">👹</span>
                  <div>
                    <h3 className="text-xl font-black text-white">Bossutmaning!</h3>
                    <p className="text-white/80 text-sm">Testa dina kunskaper i alla tre språk</p>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 px-5 py-3 flex justify-between items-center">
                  <span className="text-sm text-gray-500">Vinna = extra diamantkista</span>
                  <span className="text-sm font-black text-red-600">Utmana →</span>
                </div>
              </div>
            </Link>
          </BlurFade>
        )}
      </main>
    </div>
  );
}
