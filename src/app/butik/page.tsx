"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/ui/Header";
import FramedAvatar from "@/components/ui/FramedAvatar";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { BlurFade } from "@/components/magicui/blur-fade";
import {
  loadStudent,
  getSpendable,
  buyAvatar,
  buyFrame,
  equipAvatar,
  equipFrame,
} from "@/lib/storage";
import { getAvatar, CATEGORY_LABELS } from "@/lib/avatars";
import { SHOP_AVATARS, FRAMES, RARITY_META, groupAvatarsByCategory, type Rarity } from "@/lib/shop";
import type { StudentData } from "@/lib/types";

type Tab = "avatarer" | "ramar" | "mina";

function RarityBadge({ rarity }: { rarity: Rarity }) {
  const meta = RARITY_META[rarity];
  return (
    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full tracking-wide ${meta.badgeClass}`}>
      {meta.label}
    </span>
  );
}

function PriceTag({ price }: { price: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm font-black text-amber-600 dark:text-amber-400">
      <span>⭐</span>
      {price}
    </span>
  );
}

export default function ButikPage() {
  const [student, setStudent] = useState<StudentData | null>(null);
  const [tab, setTab] = useState<Tab>("avatarer");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setStudent(loadStudent());
  }, []);

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1800);
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-amber-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sv-400 dark:text-gray-400 mb-4">Du är inte inloggad.</p>
          <Link
            href="/"
            className="btn-primary border-3 border-sv-400"
            style={{ background: "linear-gradient(135deg, #f97316, #ea6c0a)" }}
          >
            Gå till startsidan
          </Link>
        </div>
      </div>
    );
  }

  const spendable = getSpendable(student);
  const ownedAvatars = student.ownedAvatars ?? [];
  const ownedFrames = student.ownedFrames ?? [];

  // ─── Actions ──────────────────────────────────────────────────────────────
  function handleBuyAvatar(id: string, name: string) {
    if (!student) return;
    const res = buyAvatar(student, id);
    if (res.ok) {
      setStudent(res.student);
      flash(`Du köpte ${name}! 🎉`);
    } else if (res.reason === "broke") {
      flash("Du har inte råd ännu!");
    }
  }
  function handleEquipAvatar(id: string) {
    if (!student) return;
    setStudent(equipAvatar(student, id));
  }
  function handleBuyFrame(id: string, name: string) {
    if (!student) return;
    const res = buyFrame(student, id);
    if (res.ok) {
      setStudent(res.student);
      flash(`Du köpte ${name}! 🎉`);
    } else if (res.reason === "broke") {
      flash("Du har inte råd ännu!");
    }
  }
  function handleEquipFrame(id: string) {
    if (!student) return;
    setStudent(equipFrame(student, id));
  }

  const currentAvatar = getAvatar(student.avatar ?? "ninja");

  const tabs: { id: Tab; label: string }[] = [
    { id: "avatarer", label: "🧑 Avatarer" },
    { id: "ramar",    label: "🖼️ Ramar" },
    { id: "mina",     label: "🎒 Mina köp" },
  ];

  const avatarGroups = groupAvatarsByCategory(SHOP_AVATARS);

  return (
    <div className="min-h-screen bg-amber-50 dark:bg-gray-900">
      <Header student={student} />

      {/* Banner */}
      <div
        className="text-white"
        style={{ background: "linear-gradient(135deg, #7c2d12, #c2570a, #f97316)" }}
      >
        <div className="max-w-5xl mx-auto px-4 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm bg-black/20 hover:bg-black/30 px-3 py-1.5 rounded-full transition-colors mb-4"
          >
            ← Tillbaka
          </Link>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="text-5xl drop-shadow-lg">🛒</span>
              <div>
                <h1 className="text-3xl font-black text-shadow">Butiken</h1>
                <p className="text-white/80 font-semibold mt-0.5">Spendera dina poäng på coola saker!</p>
              </div>
            </div>
            <div className="text-center bg-white/15 rounded-2xl px-5 py-3 border-2 border-white/25 flex-shrink-0">
              <div className="text-white/70 text-xs font-bold uppercase tracking-wider">Att spendera</div>
              <div className="text-2xl font-black flex items-center gap-1 justify-center mt-0.5">
                ⭐ <NumberTicker value={spendable} className="text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="overflow-x-auto pb-1 mb-6">
          <div
            className="flex gap-1.5 bg-white dark:bg-gray-800 p-1.5 rounded-2xl w-max min-w-full border-2 border-sv-100 dark:border-gray-700"
            style={{ boxShadow: "0 2px 0 0 rgba(249,115,22,0.08), inset 0 1px 3px rgba(0,0,0,0.04)" }}
          >
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  tab === t.id
                    ? "bg-gradient-to-b from-orange-400 to-orange-500 text-white shadow-md scale-[1.02]"
                    : "text-sv-500 dark:text-gray-400 hover:bg-sv-50 dark:hover:bg-gray-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Avatarer ───────────────────────────────────────────────── */}
        {tab === "avatarer" && (
          <BlurFade>
            <div className="space-y-7">
              {avatarGroups.map(({ category, items }) => (
                <div key={category}>
                  <h2 className="text-xs font-black uppercase tracking-wider text-sv-400 dark:text-gray-500 mb-3">
                    {CATEGORY_LABELS[category]}
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {items.map((a) => {
                      const owned = ownedAvatars.includes(a.id);
                      const equipped = student.avatar === a.id;
                      const affordable = spendable >= a.price;
                      return (
                        <div key={a.id} className="card flex flex-col items-center text-center !p-4">
                          <FramedAvatar avatar={a} frameId={student.equippedFrame} size={72} className="mb-2" />
                          <div className="font-black text-sm text-sv-900 dark:text-gray-100 leading-tight">{a.name}</div>
                          <div className="my-1.5"><RarityBadge rarity={a.rarity} /></div>
                          {!owned && <PriceTag price={a.price} />}
                          <div className="w-full mt-2">
                            {equipped ? (
                              <button disabled className="w-full py-2 rounded-xl font-bold text-sm bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-2 border-emerald-300 dark:border-emerald-700 cursor-default">
                                ✓ Vald
                              </button>
                            ) : owned ? (
                              <button
                                onClick={() => handleEquipAvatar(a.id)}
                                className="w-full py-2 rounded-xl font-bold text-sm text-white cursor-pointer"
                                style={{ background: "linear-gradient(135deg, #006AA7, #004a75)", boxShadow: "0 3px 0 0 rgba(0,0,0,0.18)" }}
                              >
                                Använd
                              </button>
                            ) : affordable ? (
                              <button
                                onClick={() => handleBuyAvatar(a.id, a.name)}
                                className="w-full py-2 rounded-xl font-bold text-sm text-white cursor-pointer"
                                style={{ background: "linear-gradient(135deg, #f97316, #ea6c0a)", boxShadow: "0 3px 0 0 rgba(234,108,10,0.4)" }}
                              >
                                Köp
                              </button>
                            ) : (
                              <button disabled className="w-full py-2 rounded-xl font-bold text-sm bg-sv-100 dark:bg-gray-700 text-sv-400 dark:text-gray-500 cursor-not-allowed">
                                För dyrt
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </BlurFade>
        )}

        {/* ─── Ramar ──────────────────────────────────────────────────── */}
        {tab === "ramar" && (
          <BlurFade>
            <h2 className="text-xs font-black uppercase tracking-wider text-sv-400 dark:text-gray-500 mb-3">Ramar runt din avatar</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {FRAMES.map((f) => {
                const owned = ownedFrames.includes(f.id);
                const equipped = student.equippedFrame === f.id;
                const affordable = spendable >= f.price;
                return (
                  <div key={f.id} className="card flex flex-col items-center text-center !p-4">
                    <FramedAvatar avatar={currentAvatar} frameId={f.id} size={72} className="mb-2" />
                    <div className="font-black text-sm text-sv-900 dark:text-gray-100 leading-tight">{f.name}</div>
                    <div className="my-1.5"><RarityBadge rarity={f.rarity} /></div>
                    {!owned && <PriceTag price={f.price} />}
                    <div className="w-full mt-2">
                      {equipped ? (
                        <button
                          onClick={() => handleEquipFrame("")}
                          className="w-full py-2 rounded-xl font-bold text-sm bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-2 border-emerald-300 dark:border-emerald-700 cursor-pointer"
                        >
                          ✓ Vald · ta bort
                        </button>
                      ) : owned ? (
                        <button
                          onClick={() => handleEquipFrame(f.id)}
                          className="w-full py-2 rounded-xl font-bold text-sm text-white cursor-pointer"
                          style={{ background: "linear-gradient(135deg, #006AA7, #004a75)", boxShadow: "0 3px 0 0 rgba(0,0,0,0.18)" }}
                        >
                          Använd
                        </button>
                      ) : affordable ? (
                        <button
                          onClick={() => handleBuyFrame(f.id, f.name)}
                          className="w-full py-2 rounded-xl font-bold text-sm text-white cursor-pointer"
                          style={{ background: "linear-gradient(135deg, #f97316, #ea6c0a)", boxShadow: "0 3px 0 0 rgba(234,108,10,0.4)" }}
                        >
                          Köp
                        </button>
                      ) : (
                        <button disabled className="w-full py-2 rounded-xl font-bold text-sm bg-sv-100 dark:bg-gray-700 text-sv-400 dark:text-gray-500 cursor-not-allowed">
                          För dyrt
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </BlurFade>
        )}

        {/* ─── Mina köp ───────────────────────────────────────────────── */}
        {tab === "mina" && (
          <BlurFade>
            <div className="space-y-6">
              <div>
                <h2 className="text-xs font-black uppercase tracking-wider text-sv-400 dark:text-gray-500 mb-3">
                  Mina avatarer ({ownedAvatars.length})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {SHOP_AVATARS.filter((a) => ownedAvatars.includes(a.id)).map((a) => {
                    const equipped = student.avatar === a.id;
                    return (
                      <div key={a.id} className="card flex flex-col items-center text-center !p-4">
                        <FramedAvatar avatar={a} frameId={student.equippedFrame} size={72} className="mb-2" />
                        <div className="font-black text-sm text-sv-900 dark:text-gray-100 leading-tight">{a.name}</div>
                        <div className="my-1.5"><RarityBadge rarity={a.rarity} /></div>
                        <div className="w-full mt-1">
                          {equipped ? (
                            <button disabled className="w-full py-2 rounded-xl font-bold text-sm bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-2 border-emerald-300 dark:border-emerald-700 cursor-default">
                              ✓ Vald
                            </button>
                          ) : (
                            <button
                              onClick={() => handleEquipAvatar(a.id)}
                              className="w-full py-2 rounded-xl font-bold text-sm text-white cursor-pointer"
                              style={{ background: "linear-gradient(135deg, #006AA7, #004a75)", boxShadow: "0 3px 0 0 rgba(0,0,0,0.18)" }}
                            >
                              Använd
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h2 className="text-xs font-black uppercase tracking-wider text-sv-400 dark:text-gray-500 mb-3">
                  Mina ramar ({ownedFrames.length})
                </h2>
                {ownedFrames.length === 0 ? (
                  <p className="text-sm text-sv-400 dark:text-gray-500 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-sv-200 dark:border-gray-600 px-4 py-6 text-center">
                    Du äger inga ramar ännu. Köp en i fliken <strong>Ramar</strong>! 🖼️
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {FRAMES.filter((f) => ownedFrames.includes(f.id)).map((f) => {
                      const equipped = student.equippedFrame === f.id;
                      return (
                        <div key={f.id} className="card flex flex-col items-center text-center !p-4">
                          <FramedAvatar avatar={currentAvatar} frameId={f.id} size={72} className="mb-2" />
                          <div className="font-black text-sm text-sv-900 dark:text-gray-100 leading-tight">{f.name}</div>
                          <div className="my-1.5"><RarityBadge rarity={f.rarity} /></div>
                          <div className="w-full mt-1">
                            {equipped ? (
                              <button
                                onClick={() => handleEquipFrame("")}
                                className="w-full py-2 rounded-xl font-bold text-sm bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-2 border-emerald-300 dark:border-emerald-700 cursor-pointer"
                              >
                                ✓ Vald · ta bort
                              </button>
                            ) : (
                              <button
                                onClick={() => handleEquipFrame(f.id)}
                                className="w-full py-2 rounded-xl font-bold text-sm text-white cursor-pointer"
                                style={{ background: "linear-gradient(135deg, #006AA7, #004a75)", boxShadow: "0 3px 0 0 rgba(0,0,0,0.18)" }}
                              >
                                Använd
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </BlurFade>
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-sv-900 dark:bg-gray-700 text-white font-bold text-sm px-5 py-3 rounded-2xl shadow-xl animate-slide-up">
          {toast}
        </div>
      )}
    </div>
  );
}
