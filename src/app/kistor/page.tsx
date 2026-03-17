"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/ui/Header";
import { BlurFade } from "@/components/magicui/blur-fade";
import {
  loadStudent,
  saveStudent,
  loadGamification,
  saveGamification,
} from "@/lib/storage";
import {
  CHEST_META,
  ALL_BADGES,
  BOSS_UNLOCK_THRESHOLD,
  getBadge,
  openWoodChest,
  openSilverChest,
  openGoldChest,
  checkMissedExerciseMilestones,
} from "@/lib/gamification";
import type { StudentData, GamificationData, Chest, ChestType } from "@/lib/types";

function ChestCard({ chest, onOpen }: { chest: Chest; onOpen: (id: string) => void }) {
  const meta = CHEST_META[chest.type];
  const [animating, setAnimating] = useState(false);

  function handleClick() {
    if (chest.opened || animating) return;
    setAnimating(true);
    setTimeout(() => {
      onOpen(chest.id);
      setAnimating(false);
    }, 500);
  }

  return (
    <div
      onClick={handleClick}
      className={`relative flex flex-col items-center p-5 rounded-3xl transition-all cursor-pointer select-none ${
        !chest.opened
          ? `bg-gradient-to-br ${meta.color} hover:scale-105 active:scale-95`
          : "bg-gray-100 dark:bg-gray-700 cursor-default opacity-60"
      }`}
      style={{
        border: "3px solid",
        borderColor: chest.opened ? "#cbd5e1" : "rgba(255,255,255,0.3)",
        boxShadow: chest.opened
          ? "none"
          : "0 6px 20px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.3)",
        transform: animating ? "scale(1.08) rotate(-3deg)" : "scale(1)",
        transition: "transform 0.15s ease-out, box-shadow 0.15s",
      }}
    >
      <span
        className="text-5xl mb-3"
        style={{
          filter: chest.opened ? "grayscale(1)" : "none",
          animation: animating ? "shake 0.4s ease-in-out" : "none",
        }}
      >
        {chest.opened ? "🔓" : meta.emoji}
      </span>
      <span className={`text-sm font-bold mb-1 ${chest.opened ? "text-gray-400 dark:text-gray-500" : "text-white"}`}>
        {meta.label}
      </span>
      {chest.opened ? (
        <span className="text-xs text-gray-400 dark:text-gray-500">Öppnad</span>
      ) : (
        <span className="text-xs text-white/80 mt-1">Tryck för att öppna</span>
      )}
      {chest.opened && chest.openedReward && (
        <p className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400 leading-snug">
          {chest.openedReward}
        </p>
      )}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-8deg) scale(1.05); }
          40% { transform: rotate(8deg) scale(1.1); }
          60% { transform: rotate(-5deg) scale(1.05); }
          80% { transform: rotate(5deg); }
        }
      `}</style>
    </div>
  );
}

interface RewardResult { description: string; points: number; }

function RewardPopup({ result, onClose }: { result: RewardResult; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div
        className="bg-white dark:bg-gray-800 rounded-4xl p-8 max-w-sm w-full text-center border-3 border-amber-300"
        style={{ boxShadow: "0 8px 0 0 rgba(245,158,11,0.3), 0 16px 32px -8px rgba(245,158,11,0.25)" }}
      >
        <div className="text-6xl mb-4 animate-bounce-slow">🎉</div>
        <h2 className="text-2xl font-black text-amber-700 dark:text-amber-300 mb-3">
          Lådan är öppnad!
        </h2>
        <p className="text-base font-semibold text-sv-800 dark:text-gray-100 mb-6 leading-relaxed">
          {result.description}
        </p>
        <button
          onClick={onClose}
          className="w-full btn-primary border-3 border-amber-400 text-lg"
          style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
        >
          Toppen! ✓
        </button>
      </div>
    </div>
  );
}

const SHELF_STYLES: Record<ChestType, { bg: string; plank: string; count: string; label: string }> = {
  gold: {
    bg: "linear-gradient(135deg, rgba(253,224,71,0.15), rgba(245,158,11,0.1))",
    plank: "linear-gradient(180deg, #92400e, #78350f)",
    count: "bg-yellow-400 text-yellow-900",
    label: "text-yellow-700 dark:text-yellow-400",
  },
  silver: {
    bg: "linear-gradient(135deg, rgba(148,163,184,0.15), rgba(100,116,139,0.1))",
    plank: "linear-gradient(180deg, #475569, #334155)",
    count: "bg-slate-400 text-white",
    label: "text-slate-600 dark:text-slate-300",
  },
  wood: {
    bg: "linear-gradient(135deg, rgba(180,83,9,0.1), rgba(146,64,14,0.08))",
    plank: "linear-gradient(180deg, #b45309, #92400e)",
    count: "bg-amber-600 text-white",
    label: "text-amber-800 dark:text-amber-400",
  },
};

function TrophyShelf({ chests }: { chests: Chest[] }) {
  const byType: Record<ChestType, Chest[]> = {
    gold: chests.filter((c) => c.type === "gold"),
    silver: chests.filter((c) => c.type === "silver"),
    wood: chests.filter((c) => c.type === "wood"),
  };

  const order: ChestType[] = ["gold", "silver", "wood"];

  return (
    <div className="space-y-6">
      {order.map((type) => {
        const items = byType[type];
        if (items.length === 0) return null;
        const meta = CHEST_META[type];
        const style = SHELF_STYLES[type];
        return (
          <div key={type}>
            {/* Shelf label */}
            <div className={`flex items-center gap-2 mb-2 font-bold text-sm ${style.label}`}>
              <span>{meta.emoji}</span>
              <span>{meta.label}</span>
              <span className={`ml-1 px-2 py-0.5 text-xs rounded-full font-bold ${style.count}`}>
                ×{items.length}
              </span>
            </div>

            {/* Shelf surface */}
            <div
              className="rounded-t-2xl p-4 min-h-[80px]"
              style={{ background: style.bg, border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <div className="flex flex-wrap gap-4">
                {items.map((chest) => (
                  <div key={chest.id} className="flex flex-col items-center gap-1 w-14">
                    <span className="text-3xl drop-shadow">{meta.emoji}</span>
                    {chest.openedReward && (
                      <span className="text-[10px] text-center text-gray-500 dark:text-gray-400 leading-tight line-clamp-2">
                        {chest.openedReward}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Wooden plank */}
            <div
              className="h-3 rounded-b-lg shadow-md"
              style={{ background: style.plank, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.3)" }}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function KistorPage() {
  const router = useRouter();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [gam, setGam] = useState<GamificationData | null>(null);
  const [rewardResult, setRewardResult] = useState<RewardResult | null>(null);
  const [missedChestsCount, setMissedChestsCount] = useState(0);

  useEffect(() => {
    const s = loadStudent();
    if (!s) { router.push("/"); return; }
    setStudent(s);

    const loaded = loadGamification();

    // Award any exercise milestones the player has crossed but not yet received
    // (happens when new milestones are added to the app after the player's data was created)
    const missed = checkMissedExerciseMilestones(
      loaded.exercisesCompleted,
      loaded.exerciseMilestonesRewarded
    );
    if (missed.length > 0) {
      const updated: GamificationData = {
        ...loaded,
        chests: [...loaded.chests, ...missed.map((m) => m.chest)],
        exerciseMilestonesRewarded: [
          ...loaded.exerciseMilestonesRewarded,
          ...missed.map((m) => m.milestone),
        ],
      };
      saveGamification(updated);
      setGam(updated);
      setMissedChestsCount(missed.length);
    } else {
      setGam(loaded);
    }
  }, [router]);

  if (!student || !gam) return null;

  const unopened = gam.chests.filter((c) => !c.opened);
  const opened = gam.chests.filter((c) => c.opened);
  const exercisesLeft = Math.max(0, BOSS_UNLOCK_THRESHOLD - gam.exercisesCompleted);

  function handleOpenChest(chestId: string) {
    if (!gam || !student) return;
    const chest = gam.chests.find((c) => c.id === chestId);
    if (!chest || chest.opened) return;

    let result: { points: number; badge?: string; bonusChest?: Chest; description: string };
    if (chest.type === "wood") result = { ...openWoodChest(), badge: undefined, bonusChest: undefined };
    else if (chest.type === "silver") result = openSilverChest(gam.badges);
    else result = openGoldChest(gam.badges);

    const newChests = gam.chests.map((c) =>
      c.id === chestId ? { ...c, opened: true, openedReward: result.description } : c
    );
    const newBadges = result.badge && !gam.badges.includes(result.badge)
      ? [...gam.badges, result.badge]
      : gam.badges;
    if (result.bonusChest) newChests.push(result.bonusChest);

    const newGam = { ...gam, chests: newChests, badges: newBadges };
    saveGamification(newGam);
    setGam({ ...newGam });

    const updatedStudent = { ...student, totalPoints: student.totalPoints + result.points };
    saveStudent(updatedStudent);
    setStudent(updatedStudent);
    setRewardResult({ description: result.description, points: result.points });
  }

  return (
    <div className="min-h-screen bg-amber-50 dark:bg-gray-900">
      <Header student={student} />

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #7c2d12, #b45309, #d97706)" }}>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/" className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-3 transition-colors bg-black/20 hover:bg-black/30 px-3 py-1.5 rounded-full">
            ← Tillbaka
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-5xl drop-shadow-lg">🏆</span>
            <div>
              <h1 className="text-2xl font-black text-white drop-shadow-sm">Hemliga Kistor</h1>
              <p className="text-white/70 text-sm">Öppna kistor och vinn belöningar!</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-8">

        {/* Missed milestones notice */}
        {missedChestsCount > 0 && (
          <BlurFade delay={0}>
            <div
              className="rounded-3xl p-4 border-3 border-green-400 flex items-center gap-3"
              style={{ background: "linear-gradient(135deg, #14532d, #15803d)" }}
            >
              <span className="text-3xl">🎁</span>
              <div>
                <p className="text-white font-bold text-sm">
                  Nya kistor upplåsta!
                </p>
                <p className="text-white/80 text-xs">
                  Du fick {missedChestsCount} ny{missedChestsCount !== 1 ? "a" : ""} kista{missedChestsCount !== 1 ? "r" : ""} för övningar du redan klarat – öppna dem nedan!
                </p>
              </div>
            </div>
          </BlurFade>
        )}

        {/* Boss challenge */}
        <BlurFade delay={0.0}>
          <div
            className="rounded-3xl p-5 border-3"
            style={{
              background: gam.bossUnlocked
                ? "linear-gradient(135deg, #7f1d1d, #991b1b, #dc2626)"
                : "linear-gradient(135deg, #374151, #4b5563)",
              borderColor: gam.bossUnlocked ? "#ef4444" : "#6b7280",
              boxShadow: gam.bossUnlocked
                ? "0 6px 0 0 rgba(239,68,68,0.3), 0 12px 24px -4px rgba(239,68,68,0.2)"
                : "0 4px 0 0 rgba(0,0,0,0.2)",
            }}
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{gam.bossUnlocked ? "⚔️" : "🔒"}</span>
                <div>
                  <h2 className="text-lg font-black text-white">Boss Challenge</h2>
                  <p className="text-white/70 text-sm">
                    {gam.bossUnlocked
                      ? `Utmana bossen! Du har vunnit ${gam.bossWins} gång${gam.bossWins !== 1 ? "er" : ""}.`
                      : `Slutför ${exercisesLeft} övning${exercisesLeft !== 1 ? "ar" : ""} till för att låsa upp.`}
                  </p>
                </div>
              </div>
              {gam.bossUnlocked ? (
                <Link
                  href="/boss"
                  className="px-5 py-2.5 rounded-2xl font-bold text-sm text-red-900 cursor-pointer transition-all active:scale-95 bg-gradient-to-b from-red-50 to-red-100 border-2 border-red-200 hover:border-red-300"
                  style={{ boxShadow: "0 3px 0 0 rgba(239,68,68,0.3)" }}
                >
                  Utmana bossen! ⚔️
                </Link>
              ) : (
                <div className="text-white/50 text-sm font-medium">
                  {gam.exercisesCompleted}/{BOSS_UNLOCK_THRESHOLD} övningar
                </div>
              )}
            </div>
            {!gam.bossUnlocked && (
              <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white/40 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, (gam.exercisesCompleted / BOSS_UNLOCK_THRESHOLD) * 100)}%` }}
                />
              </div>
            )}
          </div>
        </BlurFade>

        {/* Unopened chests */}
        <BlurFade delay={0.05}>
          <section>
            <h2 className="text-lg font-black text-sv-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              🎁 Oöppnade kistor
              {unopened.length > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold bg-sv-500 text-white rounded-full">
                  {unopened.length}
                </span>
              )}
            </h2>
            {unopened.length === 0 ? (
              <div className="rounded-3xl p-8 text-center border-2 border-dashed border-sv-200 dark:border-gray-600 bg-white dark:bg-gray-800">
                <p className="text-4xl mb-3">🏅</p>
                <p className="text-sv-500 dark:text-gray-300 text-sm font-medium">
                  Inga kistor just nu. Slutför övningar för att tjäna kistor!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {unopened.map((chest) => (
                  <ChestCard key={chest.id} chest={chest} onOpen={handleOpenChest} />
                ))}
              </div>
            )}
          </section>
        </BlurFade>

        {/* Badges */}
        {gam.badges.length > 0 && (
          <BlurFade delay={0.1}>
            <section>
              <h2 className="text-lg font-black text-sv-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                🎖️ Dina märken ({gam.badges.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {gam.badges.map((badgeId) => {
                  const badge = getBadge(badgeId);
                  if (!badge) return null;
                  return (
                    <div
                      key={badgeId}
                      className="flex flex-col items-center p-4 rounded-3xl border-3 border-sv-300"
                      style={{
                        background: "linear-gradient(135deg, #7c2d12, #c2570a, #f97316)",
                        boxShadow: "0 4px 0 0 rgba(249,115,22,0.3), inset 0 1px 0 rgba(255,255,255,0.2)"
                      }}
                    >
                      <span className="text-3xl mb-2">{badge.emoji}</span>
                      <span className="text-xs font-bold text-white text-center leading-snug">
                        {badge.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          </BlurFade>
        )}

        {/* Trophy shelf – opened chests */}
        {opened.length > 0 && (
          <BlurFade delay={0.15}>
            <section>
              <h2 className="text-lg font-black text-sv-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                🏠 Trofehylla
                <span className="px-2 py-0.5 text-xs font-bold bg-amber-600 text-white rounded-full">
                  {opened.length} {opened.length === 1 ? "kista" : "kistor"}
                </span>
              </h2>
              <div
                className="rounded-3xl p-5 border-3 border-amber-200 dark:border-amber-900"
                style={{
                  background: "linear-gradient(160deg, #fef3c7 0%, #fde68a 100%)",
                  boxShadow: "inset 0 2px 8px rgba(0,0,0,0.06)"
                }}
              >
                <TrophyShelf chests={opened} />
              </div>
            </section>
          </BlurFade>
        )}

        {/* How to earn */}
        <BlurFade delay={0.2}>
          <section className="card border-sv-200">
            <h3 className="font-bold text-sv-900 dark:text-sv-100 mb-3 flex items-center gap-2">
              💡 Hur tjänar man kistor?
            </h3>
            <p className="text-xs font-bold text-sv-500 dark:text-sv-300 uppercase tracking-wide mb-2">Poängmilstolpar</p>
            <ul className="space-y-1.5 text-sm text-sv-800 dark:text-sv-100 mb-4">
              <li className="flex items-start gap-2"><span>📦</span><span><strong>Trälåda:</strong> 10, 20, 30, 50, 75, 100, 200 poäng</span></li>
              <li className="flex items-start gap-2"><span>🪙</span><span><strong>Silverlåda:</strong> 300, 500, 750, 1 500, 2 000 poäng</span></li>
              <li className="flex items-start gap-2"><span>🏆</span><span><strong>Guldlåda:</strong> 1 000, 2 500, 3 500, 5 000, 7 000, 10 000, 15 000 poäng</span></li>
            </ul>
            <p className="text-xs font-bold text-sv-500 dark:text-sv-300 uppercase tracking-wide mb-2">Övningsmilstolpar</p>
            <ul className="space-y-1.5 text-sm text-sv-800 dark:text-sv-100 mb-4">
              <li className="flex items-start gap-2"><span>📦</span><span><strong>Trälåda:</strong> 1, 2, 3, 4, 5, 7, 10, 25, 45, 55 övningar</span></li>
              <li className="flex items-start gap-2"><span>🪙</span><span><strong>Silverlåda:</strong> 12, 15, 20, 35, 40, 50, 70, 80, 90 övningar</span></li>
              <li className="flex items-start gap-2"><span>🏆</span><span><strong>Guldlåda:</strong> 30, 60, 75, 100, 125, 150, 200 övningar</span></li>
            </ul>
            <div className="flex items-start gap-2 text-sm text-sv-800 dark:text-sv-100 pt-3 border-t border-sv-100 dark:border-gray-700">
              <span>🎁</span>
              <span><strong>Mysterylåda:</strong> Slumpmässig chans efter varje övning!</span>
            </div>
          </section>
        </BlurFade>
      </main>

      {rewardResult && <RewardPopup result={rewardResult} onClose={() => setRewardResult(null)} />}
    </div>
  );
}
