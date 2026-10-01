"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/ui/Header";
import { BlurFade } from "@/components/magicui/blur-fade";
import {
  loadStudent,
  addPointsToStored,
  loadGamification,
  saveGamification,
} from "@/lib/storage";
import {
  CHEST_META,
  ALL_BADGES,
  BOSS_MODULES_PER_FIGHT,
  getBadge,
  openChest,
  checkMissedExerciseMilestones,
  checkMissedPointMilestones,
  capNewChests,
  POINT_CHEST_MILESTONES,
  EXERCISE_CHEST_MILESTONES,
} from "@/lib/gamification";
import SaveWarning from "@/components/ui/SaveWarning";
import { getThemeClassName, getThemeWrapperClass } from "@/lib/shop";
import ThemeBackdrop from "@/components/ui/ThemeBackdrop";
import type { StudentData, GamificationData, Chest, ChestType } from "@/lib/types";

/** How long a chest shakes before it opens. */
const OPEN_ANIMATION_MS = 500;

function ChestCard({
  chest,
  animating,
  disabled,
  onOpen,
}: {
  chest: Chest;
  animating: boolean;
  /** True while any chest is opening: taps are ignored until it is done. */
  disabled: boolean;
  onOpen: (id: string) => void;
}) {
  const meta = CHEST_META[chest.type];

  function handleClick() {
    if (chest.opened || disabled) return;
    onOpen(chest.id);
  }

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={chest.opened ? -1 : 0}
      aria-disabled={disabled}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleClick(); } }}
      className={`w-full relative flex items-center gap-4 px-5 py-4 rounded-2xl transition-all cursor-pointer select-none ${
        !chest.opened
          ? `bg-gradient-to-r ${meta.color} active:scale-[0.98]`
          : "bg-gray-100 dark:bg-gray-700 cursor-default opacity-60"
      }`}
      style={{
        border: "2px solid",
        borderColor: chest.opened ? "#cbd5e1" : "rgba(255,255,255,0.25)",
        boxShadow: chest.opened
          ? "none"
          : "0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.25)",
        transform: animating ? "scale(1.02) rotate(-0.5deg)" : "scale(1)",
        transition: "transform 0.15s ease-out, box-shadow 0.15s",
      }}
    >
      {/* Chest image – fixed width so all rows align */}
      <div
        className="w-14 h-14 flex-shrink-0 flex items-center justify-center"
        style={{ animation: animating ? "shake 0.4s ease-in-out" : "none" }}
      >
        <img
          src={chest.opened ? meta.openImage : meta.image}
          alt={meta.label}
          className={`w-full h-full object-contain drop-shadow-md ${meta.imageClass ?? ""}`}
        />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-base leading-tight ${chest.opened ? "text-gray-600 dark:text-gray-300" : "text-white"}`}>
          {meta.label}
        </p>
        {chest.opened ? (
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">Öppnad</p>
        ) : (
          <p className="text-sm text-white/80 mt-0.5">{meta.description}</p>
        )}
        {chest.opened && chest.openedReward && (
          <p className="text-xs text-gray-500 dark:text-gray-300 leading-snug mt-0.5">{chest.openedReward}</p>
        )}
      </div>

      {/* Open arrow */}
      {!chest.opened && (
        <span className="text-white/70 text-xl flex-shrink-0">›</span>
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

interface RewardResult { title?: string; description: string; points: number; }

function RewardPopup({ result, onClose }: { result: RewardResult; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex overflow-y-auto overscroll-contain z-50 p-3 sm:p-4 animate-fade-in">
      <div
        className="m-auto bg-white dark:bg-gray-800 rounded-4xl p-6 sm:p-8 max-w-sm w-full text-center border-3 border-amber-300"
        style={{ boxShadow: "0 8px 0 0 rgba(245,158,11,0.3), 0 16px 32px -8px rgba(245,158,11,0.25)" }}
      >
        <div className="text-6xl mb-4 animate-bounce-slow">🎉</div>
        <h2 className="text-2xl font-black text-amber-700 dark:text-amber-300 mb-3">
          {result.title ?? "Kistan är öppnad!"}
        </h2>
        <p className="text-base font-semibold text-sv-800 dark:text-gray-100 mb-6 leading-relaxed whitespace-pre-line">
          {result.description}
        </p>
        <button
          autoFocus
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
  hemlig: {
    bg: "linear-gradient(135deg, rgba(167,139,250,0.25), rgba(109,40,217,0.15))",
    plank: "linear-gradient(180deg, #4c1d95, #3b0764)",
    count: "bg-violet-600 text-white",
    label: "text-violet-700 dark:text-violet-300",
  },
  diamond: {
    bg: "linear-gradient(135deg, rgba(125,211,252,0.2), rgba(14,165,233,0.12))",
    plank: "linear-gradient(180deg, #0369a1, #0c4a6e)",
    count: "bg-sky-400 text-white",
    label: "text-sky-600 dark:text-sky-300",
  },
  ruby: {
    bg: "linear-gradient(135deg, rgba(252,165,165,0.2), rgba(220,38,38,0.1))",
    plank: "linear-gradient(180deg, #b91c1c, #7f1d1d)",
    count: "bg-red-700 text-white",
    label: "text-red-700 dark:text-red-400",
  },
  emerald: {
    bg: "linear-gradient(135deg, rgba(110,231,183,0.2), rgba(16,185,129,0.1))",
    plank: "linear-gradient(180deg, #065f46, #064e3b)",
    count: "bg-emerald-500 text-white",
    label: "text-emerald-700 dark:text-emerald-400",
  },
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
    hemlig: chests.filter((c) => c.type === "hemlig"),
    diamond: chests.filter((c) => c.type === "diamond"),
    ruby: chests.filter((c) => c.type === "ruby"),
    emerald: chests.filter((c) => c.type === "emerald"),
    gold: chests.filter((c) => c.type === "gold"),
    silver: chests.filter((c) => c.type === "silver"),
    wood: chests.filter((c) => c.type === "wood"),
  };

  const order: ChestType[] = ["wood", "silver", "gold", "emerald", "ruby", "diamond", "hemlig"];

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
              <img src={meta.image} alt={meta.label} className={`w-5 h-5 object-contain ${meta.imageClass ?? ""}`} />
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
                    <img src={meta.openImage} alt={meta.label} className={`w-8 h-8 object-contain drop-shadow ${meta.imageClass ?? ""}`} />
                    {chest.openedReward && (
                      <span className="text-[10px] text-center text-gray-500 dark:text-gray-300 leading-tight line-clamp-2">
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
  // The chest currently shaking. Only one opens at a time: the ref blocks a
  // second tap before React has re-rendered.
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    const s = loadStudent();
    if (!s) { router.push("/"); return; }
    setStudent(s);

    const loaded = loadGamification();

    // Award any milestones the player has crossed but not yet received
    // (covers imported progress and retroactive milestone additions)
    const missedEx = checkMissedExerciseMilestones(
      loaded.exercisesCompleted,
      loaded.exerciseMilestonesRewarded
    );
    const missedPts = checkMissedPointMilestones(
      s.totalPoints,
      loaded.pointsMilestonesRewarded
    );
    const totalMissed = [...missedEx, ...missedPts];

    if (totalMissed.length > 0) {
      const added = capNewChests(loaded.chests, totalMissed.map((m) => m.chest));
      const updated: GamificationData = {
        ...loaded,
        chests: [...loaded.chests, ...added],
        exerciseMilestonesRewarded: [
          ...loaded.exerciseMilestonesRewarded,
          ...missedEx.map((m) => m.milestone),
        ],
        pointsMilestonesRewarded: [
          ...loaded.pointsMilestonesRewarded,
          ...missedPts.map((m) => m.milestone),
        ],
      };
      saveGamification(updated);
      setGam(updated);
      setMissedChestsCount(added.length);
    } else {
      setGam(loaded);
    }
  }, [router]);

  if (!student || !gam) return null;

  const CHEST_ORDER: ChestType[] = ["wood", "silver", "gold", "emerald", "ruby", "diamond", "hemlig"];
  const unopened = [...gam.chests.filter((c) => !c.opened)].sort(
    (a, b) => CHEST_ORDER.indexOf(a.type) - CHEST_ORDER.indexOf(b.type)
  );
  const opened = gam.chests.filter((c) => c.opened);

  /**
   * Open one chest. Reads the stored data rather than `gam` from state: a
   * second chest tapped during the first one's animation used to open against
   * the old state, undoing the first chest so it could be opened — and paid —
   * again.
   */
  function openNow(chestId: string): void {
    const opening = openChest(loadGamification(), chestId);
    if (!opening) return;
    saveGamification(opening.gam);
    setGam(opening.gam);
    const updatedStudent = addPointsToStored(opening.points);
    if (updatedStudent) setStudent(updatedStudent);
    setRewardResult({ description: opening.description, points: opening.points });
  }

  function handleOpenChest(chestId: string) {
    if (busyRef.current) return;
    busyRef.current = true;
    setAnimatingId(chestId);
    setTimeout(() => {
      try {
        openNow(chestId);
      } finally {
        busyRef.current = false;
        setAnimatingId(null);
      }
    }, OPEN_ANIMATION_MS);
  }

  /** Open every chest waiting right now and show one summary of the lot. */
  function handleOpenAll() {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      let current = loadGamification();
      const ids = current.chests.filter((c) => !c.opened).map((c) => c.id);
      let points = 0;
      const perType: Partial<Record<ChestType, number>> = {};
      const badges: string[] = [];
      const bonus: ChestType[] = [];
      for (const id of ids) {
        const opening = openChest(current, id);
        if (!opening) continue;
        current = opening.gam;
        points += opening.points;
        perType[opening.chest.type] = (perType[opening.chest.type] ?? 0) + 1;
        if (opening.badge && !badges.includes(opening.badge)) badges.push(opening.badge);
        if (opening.bonusChest) bonus.push(opening.bonusChest.type);
      }
      const opened = Object.values(perType).reduce((n, c) => n + (c ?? 0), 0);
      if (opened === 0) return;
      saveGamification(current);
      setGam(current);
      const updatedStudent = addPointsToStored(points);
      if (updatedStudent) setStudent(updatedStudent);

      const lines = [
        CHEST_ORDER.filter((t) => perType[t])
          .map((t) => `${perType[t]} × ${CHEST_META[t].label}`)
          .join(", "),
        `+${points} poäng`,
        ...badges.map((id) => {
          const b = getBadge(id);
          return b ? `Märke: ${b.label} ${b.emoji}` : "";
        }).filter(Boolean),
        bonus.length > 0
          ? `Bonus: ${bonus.map((t) => CHEST_META[t].label).join(", ")} – öppna ${bonus.length === 1 ? "den" : "dem"} nedan!`
          : "",
      ].filter(Boolean);
      setRewardResult({
        title: `${opened} ${opened === 1 ? "kista öppnad" : "kistor öppnade"}!`,
        description: lines.join("\n"),
        points,
      });
    } finally {
      busyRef.current = false;
    }
  }

  /** "Bronskista: 300 – 2 300 poäng" style ranges, straight from the milestone lists. */
  function milestoneRanges(list: { value: number; type: ChestType }[]) {
    return CHEST_ORDER.map((type) => {
      const values = list.filter((m) => m.type === type).map((m) => m.value);
      if (values.length === 0) return null;
      const min = Math.min(...values);
      const max = Math.max(...values);
      const fmt = (n: number) => n.toLocaleString("sv-SE");
      return { type, text: min === max ? fmt(min) : `${fmt(min)} – ${fmt(max)}` };
    }).filter((r): r is { type: ChestType; text: string } => r !== null);
  }
  const pointRanges = milestoneRanges(POINT_CHEST_MILESTONES.map((m) => ({ value: m.points, type: m.type })));
  const exerciseRanges = milestoneRanges(EXERCISE_CHEST_MILESTONES.map((m) => ({ value: m.exercises, type: m.type })));

  return (
    <div className={`min-h-screen ${getThemeClassName(student.equippedTheme)} ${getThemeWrapperClass(student.equippedTheme)}`}>
      <ThemeBackdrop themeId={student.equippedTheme} />
      <Header student={student} />

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #7c2d12, #b45309, #d97706)" }}>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link prefetch={false} href="/" className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-3 transition-colors bg-black/20 hover:bg-black/30 px-3 py-1.5 rounded-full">
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

        <SaveWarning />

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

        {/* Boss challenge — now one per world, earned with chapters there */}
        <BlurFade delay={0.0}>
          <Link prefetch={false}
            href="/boss"
            className="block rounded-3xl p-5 border-3 transition-all hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(135deg, #7f1d1d, #991b1b, #dc2626)",
              borderColor: "#ef4444",
              boxShadow: "0 6px 0 0 rgba(239,68,68,0.3), 0 12px 24px -4px rgba(239,68,68,0.2)",
            }}
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl">⚔️</span>
                <div>
                  <h2 className="text-lg font-black text-white">Bossutmaningen</h2>
                  <p className="text-white/70 text-sm">
                    Varje värld har sin egen boss. Du tjänar en match för varje{" "}
                    {BOSS_MODULES_PER_FIGHT} kapitel du klarar där.
                    {gam.bossWins > 0 && ` Du har vunnit ${gam.bossWins} gång${gam.bossWins !== 1 ? "er" : ""}.`}
                  </p>
                </div>
              </div>
              <span
                className="px-5 py-2.5 rounded-2xl font-bold text-sm text-red-900 bg-gradient-to-b from-red-50 to-red-100 border-2 border-red-200"
                style={{ boxShadow: "0 3px 0 0 rgba(239,68,68,0.3)" }}
              >
                Välj värld ⚔️
              </span>
            </div>
          </Link>
        </BlurFade>

        {/* Unopened chests */}
        <BlurFade delay={0.05}>
          <section>
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <h2 className="text-lg font-black text-sv-900 dark:text-gray-100 flex items-center gap-2">
                🎁 Oöppnade kistor
                {unopened.length > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-sv-700 text-white rounded-full">
                    {unopened.length}
                  </span>
                )}
              </h2>
              {unopened.length > 1 && (
                <button
                  onClick={handleOpenAll}
                  disabled={animatingId !== null}
                  className="px-4 py-2 rounded-xl font-bold text-sm text-white disabled:opacity-50 cursor-pointer"
                  style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", boxShadow: "0 3px 0 0 rgba(0,0,0,0.18)" }}
                >
                  Öppna alla ({unopened.length})
                </button>
              )}
            </div>
            {unopened.length === 0 ? (
              <div className="rounded-3xl p-8 text-center border-2 border-dashed border-sv-200 dark:border-gray-600 bg-white dark:bg-gray-800">
                <p className="text-4xl mb-3">🏅</p>
                <p className="text-sv-800 dark:text-gray-300 text-sm font-medium">
                  Inga kistor just nu. Slutför övningar för att tjäna kistor!
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {unopened.map((chest) => (
                  <ChestCard
                    key={chest.id}
                    chest={chest}
                    animating={animatingId === chest.id}
                    disabled={animatingId !== null}
                    onOpen={handleOpenChest}
                  />
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
            <p className="text-xs font-bold text-sv-800 dark:text-sv-300 uppercase tracking-wide mb-2">Poängmilstolpar</p>
            <ul className="space-y-2 text-sm text-sv-800 dark:text-sv-100 mb-4">
              {pointRanges.map(({ type, text }) => (
                <li key={type} className="flex items-center gap-3">
                  <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                    <img src={CHEST_META[type].image} alt="" className={`w-6 h-6 object-contain ${CHEST_META[type].imageClass ?? ""}`} />
                  </div>
                  <span><strong>{CHEST_META[type].label}:</strong> {text} poäng</span>
                </li>
              ))}
            </ul>
            <p className="text-xs font-bold text-sv-800 dark:text-sv-300 uppercase tracking-wide mb-2">Klarade kapitel</p>
            <p className="text-xs text-sv-800 dark:text-sv-300 mb-2">
              Räknas första gången du klarar ett kapitel (grammatik, stavning, ordsökning eller stavningstest).
            </p>
            <ul className="space-y-2 text-sm text-sv-800 dark:text-sv-100 mb-4">
              {exerciseRanges.map(({ type, text }) => (
                <li key={type} className="flex items-center gap-3">
                  <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                    <img src={CHEST_META[type].image} alt="" className={`w-6 h-6 object-contain ${CHEST_META[type].imageClass ?? ""}`} />
                  </div>
                  <span><strong>{CHEST_META[type].label}:</strong> {text} kapitel</span>
                </li>
              ))}
            </ul>
            <ul className="space-y-2 text-sm text-sv-800 dark:text-sv-100 pt-3 border-t border-sv-100 dark:border-gray-700">
              <li className="flex items-center gap-3">
                <span>🏅</span>
                <span><strong>Utmärkelser:</strong> vissa utmärkelser ger en kista – det står i utmärkelsen på din profil.</span>
              </li>
              <li className="flex items-center gap-3">
                <span>⚔️</span>
                <span><strong>Bossen:</strong> varje vinst mot en boss ger en kista.</span>
              </li>
              <li className="flex items-center gap-3">
                <span>🎁</span>
                <span><strong>Mysterykista:</strong> en slumpmässig chans när du klarar ett kapitel för första gången!</span>
              </li>
              <li className="flex items-center gap-3">
                <span>✨</span>
                <span><strong>Bonuskistor:</strong> finare kistor kan innehålla en kista till.</span>
              </li>
            </ul>
          </section>
        </BlurFade>
      </main>

      {rewardResult && <RewardPopup result={rewardResult} onClose={() => setRewardResult(null)} />}
    </div>
  );
}
