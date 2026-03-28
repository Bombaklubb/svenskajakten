"use client";

import "@fontsource/nunito/700.css";
import "@fontsource/nunito/800.css";
import "@fontsource/baloo-2/700.css";
import "@fontsource/baloo-2/800.css";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { Globe, CompassRose, ArrowRight, CheckCircle, Sparkle } from "@phosphor-icons/react";
import { cva } from "class-variance-authority";
import { loadStudent, createStudent, studentExists } from "@/lib/storage";
import type { LanguageId } from "@/lib/types";

// ─── Language config ──────────────────────────────────────────────────────────
const LANGUAGES = [
  {
    id: "franska" as LanguageId,
    label: "Franska",
    native: "Français",
    flag: "🇫🇷",
    from: "#2563eb",
    to: "#1d4ed8",
    glow: "rgba(37,99,235,0.45)",
    dark: "#1e3a8a",
    stripe1: "#2563eb",
    stripe2: "#ffffff",
    stripe3: "#dc2626",
  },
  {
    id: "spanska" as LanguageId,
    label: "Spanska",
    native: "Español",
    flag: "🇪🇸",
    from: "#dc2626",
    to: "#b91c1c",
    glow: "rgba(220,38,38,0.45)",
    dark: "#7f1d1d",
    stripe1: "#dc2626",
    stripe2: "#f59e0b",
    stripe3: "#dc2626",
  },
  {
    id: "tyska" as LanguageId,
    label: "Tyska",
    native: "Deutsch",
    flag: "🇩🇪",
    from: "#374151",
    to: "#1f2937",
    glow: "rgba(55,65,81,0.45)",
    dark: "#111827",
    stripe1: "#111827",
    stripe2: "#dc2626",
    stripe3: "#FFCE00",
  },
];

// ─── Avatar config ────────────────────────────────────────────────────────────
const AVATARS = [
  { id: "boy1",  emoji: "👦🏽", bg: "#fde68a" },
  { id: "girl1", emoji: "👧🏼", bg: "#fbcfe8" },
  { id: "boy2",  emoji: "👦🏿", bg: "#d1fae5" },
  { id: "nb1",   emoji: "🧑🏻", bg: "#e0e7ff" },
  { id: "girl2", emoji: "👧🏻", bg: "#fce7f3" },
  { id: "grad",  emoji: "🧑‍🎓", bg: "#dbeafe" },
  { id: "boy3",  emoji: "👦🏻", bg: "#dcfce7" },
  { id: "girl3", emoji: "👧🏾", bg: "#fef9c3" },
];

// ─── Floating background decorations ─────────────────────────────────────────
const FLOATERS = [
  { emoji: "🗼", size: 44, x: "6%",  y: "14%", delay: 0,    dur: 3.5 },
  { emoji: "🥐", size: 32, x: "13%", y: "72%", delay: 0.6,  dur: 4.2 },
  { emoji: "🎸", size: 38, x: "84%", y: "18%", delay: 1.1,  dur: 3.8 },
  { emoji: "⚽", size: 34, x: "89%", y: "65%", delay: 0.3,  dur: 4.5 },
  { emoji: "🥨", size: 30, x: "4%",  y: "50%", delay: 1.8,  dur: 3.2 },
  { emoji: "🏰", size: 40, x: "91%", y: "42%", delay: 0.9,  dur: 4.0 },
  { emoji: "🥖", size: 28, x: "78%", y: "85%", delay: 1.4,  dur: 3.6 },
  { emoji: "💃", size: 36, x: "2%",  y: "30%", delay: 2.0,  dur: 5.0 },
];

// ─── CVA variants ─────────────────────────────────────────────────────────────
const langBtn = cva(
  [
    "relative flex flex-col items-center gap-1 py-3 px-2 rounded-2xl",
    "font-bold text-white transition-all duration-200 cursor-pointer",
    "border-3 border-white/20 select-none",
  ],
  {
    variants: {
      active: {
        true:  "scale-105 ring-4 ring-white/60 ring-offset-2 ring-offset-transparent",
        false: "opacity-80 hover:opacity-100 hover:scale-102",
      },
    },
    defaultVariants: { active: false },
  }
);

interface FormValues { name: string }

// ─── Component ────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const [selectedLang, setSelectedLang] = useState<LanguageId>("franska");
  const [selectedAvatar, setSelectedAvatar] = useState("boy1");
  const [isReturning, setIsReturning] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [avatarParent] = useAutoAnimate<HTMLDivElement>();

  const { register, handleSubmit, watch } = useForm<FormValues>({
    defaultValues: { name: "" },
  });
  const nameValue = watch("name");

  const activeLang = LANGUAGES.find((l) => l.id === selectedLang)!;

  useEffect(() => {
    setIsReturning(studentExists(nameValue.trim()));
  }, [nameValue]);

  useEffect(() => {
    const s = loadStudent();
    if (s) router.replace(`/world/${s.selectedLanguage ?? "franska"}`);
  }, [router]);

  function onSubmit({ name }: FormValues) {
    if (!name.trim()) return;
    setSubmitting(true);
    createStudent(name.trim(), selectedAvatar, selectedLang);
    router.push(`/world/${selectedLang}`);
  }

  const canSubmit = nameValue.trim().length > 0 && !submitting;

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden select-none"
      style={{ fontFamily: "'Nunito', 'Baloo 2', system-ui, sans-serif" }}
    >
      {/* ── Animated background gradient ───────────────────────────────── */}
      <motion.div
        className="absolute inset-0 z-0"
        animate={{
          background: [
            "linear-gradient(135deg, #0f172a 0%, #1e3a8a 35%, #312e81 65%, #1e1b4b 100%)",
            "linear-gradient(135deg, #1e1b4b 0%, #312e81 35%, #1e3a8a 65%, #0f172a 100%)",
          ],
        }}
        transition={{ duration: 8, repeat: Infinity, repeatType: "reverse" }}
      />

      {/* ── Star field ──────────────────────────────────────────────────── */}
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white z-0"
          style={{
            width: Math.random() * 3 + 1,
            height: Math.random() * 3 + 1,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{ opacity: [0.2, 0.9, 0.2] }}
          transition={{
            duration: 2 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 3,
          }}
        />
      ))}

      {/* ── Flag side-bars ──────────────────────────────────────────────── */}
      <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-16 flex flex-col z-10 opacity-90">
        <div className="flex-1" style={{ background: "#2563eb" }} />
        <div className="flex-1" style={{ background: "#ffffff" }} />
        <div className="flex-1" style={{ background: "#dc2626" }} />
      </div>
      <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-16 flex flex-col z-10 opacity-90">
        <div className="flex-1" style={{ background: "#111827" }} />
        <div className="flex-1" style={{ background: "#dc2626" }} />
        <div className="flex-1" style={{ background: "#FFCE00" }} />
      </div>

      {/* ── Floating decorative emojis ───────────────────────────────────── */}
      {FLOATERS.map((f, i) => (
        <motion.div
          key={i}
          className="absolute z-10 pointer-events-none"
          style={{ left: f.x, top: f.y, fontSize: f.size }}
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: f.dur, repeat: Infinity, delay: f.delay, ease: "easeInOut" }}
        >
          {f.emoji}
        </motion.div>
      ))}

      {/* ── Card ────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-20 w-full max-w-md mx-14 sm:mx-auto"
      >
        {/* Colored glow behind card */}
        <motion.div
          className="absolute inset-0 rounded-3xl blur-2xl opacity-40 -z-10"
          animate={{ background: `radial-gradient(ellipse at center, ${activeLang.glow}, transparent 70%)` }}
          transition={{ duration: 0.5 }}
        />

        <div
          className="bg-white rounded-3xl overflow-hidden"
          style={{
            boxShadow:
              "0 0 0 3px rgba(255,255,255,0.12), 0 24px 60px -10px rgba(0,0,0,0.45), 0 8px 24px -4px rgba(0,0,0,0.25)",
          }}
        >
          {/* ── Coloured top bar (animates with language) ─────────────── */}
          <motion.div
            className="h-2"
            animate={{ background: `linear-gradient(90deg, ${activeLang.stripe1}, ${activeLang.stripe2}, ${activeLang.stripe3})` }}
            transition={{ duration: 0.4 }}
          />

          <div className="px-7 pt-6 pb-7 space-y-5">

            {/* ── Logo + Title ────────────────────────────────────────── */}
            <div className="flex flex-col items-center gap-2">
              <motion.div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                animate={{
                  background: `linear-gradient(135deg, ${activeLang.from}, ${activeLang.dark})`,
                  boxShadow: `0 6px 20px ${activeLang.glow}, 0 2px 4px rgba(0,0,0,0.15)`,
                }}
                transition={{ duration: 0.4 }}
                whileTap={{ scale: 0.92, rotate: -5 }}
              >
                <Globe size={32} weight="fill" color="white" />
              </motion.div>

              <div className="text-center">
                <h1
                  className="text-4xl font-extrabold tracking-tight leading-none"
                  style={{
                    fontFamily: "'Baloo 2', sans-serif",
                    color: "#0f172a",
                  }}
                >
                  Språkjakten
                </h1>
                <p className="text-sm font-semibold text-slate-400 mt-0.5 tracking-wide uppercase">
                  Lär dig världens språk
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

              {/* ── Language buttons ─────────────────────────────────── */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 text-center">
                  Välj språk att träna
                </p>
                <div className="grid grid-cols-3 gap-2.5">
                  {LANGUAGES.map((lang) => (
                    <motion.button
                      key={lang.id}
                      type="button"
                      whileTap={{ scale: 0.94 }}
                      onClick={() => setSelectedLang(lang.id)}
                      className={langBtn({ active: selectedLang === lang.id })}
                      style={{
                        background: `linear-gradient(160deg, ${lang.from}, ${lang.dark})`,
                        boxShadow:
                          selectedLang === lang.id
                            ? `0 6px 0 0 ${lang.dark}, 0 8px 24px -4px ${lang.glow}`
                            : `0 3px 0 0 ${lang.dark}`,
                        transform:
                          selectedLang === lang.id ? "translateY(-3px)" : "translateY(0)",
                      }}
                    >
                      <span className="text-2xl leading-none">{lang.flag}</span>
                      <span className="text-sm font-extrabold leading-none">{lang.label}</span>
                      <span className="text-[10px] font-semibold opacity-75 leading-none">{lang.native}</span>
                      {selectedLang === lang.id && (
                        <motion.div
                          layoutId="langIndicator"
                          className="absolute inset-0 rounded-2xl ring-2 ring-white/60"
                        />
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* ── Avatar selection ─────────────────────────────────── */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 text-center">
                  Din avatar
                </p>
                <div
                  ref={avatarParent}
                  className="grid grid-cols-8 gap-1.5"
                >
                  {AVATARS.map((av) => (
                    <motion.button
                      key={av.id}
                      type="button"
                      whileTap={{ scale: 0.85 }}
                      onClick={() => setSelectedAvatar(av.id)}
                      className="aspect-square rounded-xl flex items-center justify-center text-xl transition-all"
                      style={{
                        background: selectedAvatar === av.id ? av.bg : "#f1f5f9",
                        border:
                          selectedAvatar === av.id
                            ? `3px solid ${activeLang.from}`
                            : "3px solid transparent",
                        transform: selectedAvatar === av.id ? "scale(1.2)" : "scale(1)",
                        boxShadow:
                          selectedAvatar === av.id
                            ? `0 4px 12px ${activeLang.glow}`
                            : "none",
                      }}
                      title={av.id}
                    >
                      {av.emoji}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* ── Name input ───────────────────────────────────────── */}
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">
                  Ditt namn
                </p>
                <motion.div
                  animate={{
                    boxShadow: nameValue.trim()
                      ? `0 0 0 3px ${activeLang.from}33`
                      : "0 0 0 0px transparent",
                  }}
                  className="rounded-2xl"
                >
                  <input
                    {...register("name", { required: true })}
                    type="text"
                    placeholder="Skriv ditt namn här..."
                    autoComplete="off"
                    maxLength={30}
                    className="w-full px-4 py-3.5 rounded-2xl text-base font-bold outline-none transition-colors bg-slate-50"
                    style={{
                      border: `2.5px solid ${nameValue.trim() ? activeLang.from : "#e2e8f0"}`,
                      color: "#0f172a",
                      fontFamily: "'Nunito', sans-serif",
                    }}
                  />
                </motion.div>

                <AnimatePresence>
                  {isReturning && nameValue.trim() && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: -4, height: 0 }}
                      className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold px-1"
                    >
                      <CheckCircle size={14} weight="fill" />
                      Välkommen tillbaka! Din framsteg är sparad.
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Submit button ────────────────────────────────────── */}
              <motion.button
                type="submit"
                disabled={!canSubmit}
                whileTap={canSubmit ? { scale: 0.97 } : {}}
                className="w-full py-4 rounded-2xl font-extrabold text-xl text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                animate={{
                  background: canSubmit
                    ? "linear-gradient(135deg, #16a34a, #15803d)"
                    : "linear-gradient(135deg, #94a3b8, #64748b)",
                  boxShadow: canSubmit
                    ? "0 6px 0 0 #14532d, 0 10px 30px -4px rgba(22,163,74,0.4)"
                    : "none",
                  y: canSubmit ? -2 : 0,
                }}
                style={{ fontFamily: "'Baloo 2', sans-serif" }}
              >
                {submitting ? (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    className="inline-block"
                  >
                    ⏳
                  </motion.span>
                ) : (
                  <>
                    <Sparkle size={22} weight="fill" />
                    {isReturning && nameValue.trim() ? "Fortsätt äventyret!" : "Börja!"}
                    <ArrowRight size={22} weight="bold" />
                  </>
                )}
              </motion.button>

            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
