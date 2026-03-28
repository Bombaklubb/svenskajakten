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
import { CheckCircle } from "@phosphor-icons/react";
import Image from "next/image";
import { loadStudent, createStudent, studentExists } from "@/lib/storage";
import type { LanguageId } from "@/lib/types";

// ─── Language config ──────────────────────────────────────────────────────────
const LANGUAGES = [
  { id: "franska" as LanguageId, label: "Franska", color: "#2563eb", shadow: "#1e3a8a" },
  { id: "spanska" as LanguageId, label: "Spanska", color: "#dc2626", shadow: "#7f1d1d" },
  { id: "tyska"   as LanguageId, label: "Tyska",   color: "#1f2937", shadow: "#030712" },
];

// ─── DiceBear cartoon avatars ────────────────────────────────────────────────
const AVATARS = [
  { id: "felix",  seed: "Felix",   bg: "b6e3f4" },
  { id: "anna",   seed: "Anna",    bg: "ffdfbf" },
  { id: "carlos", seed: "Carlos",  bg: "c0aede" },
  { id: "zoe",    seed: "Zoe",     bg: "ffd5dc" },
  { id: "niko",   seed: "Niko",    bg: "d1fae5" },
  { id: "emma",   seed: "Emma",    bg: "fde68a" },
];

interface FormValues { name: string }

export default function LoginPage() {
  const router = useRouter();
  const [selectedLang, setSelectedLang]     = useState<LanguageId>("franska");
  const [selectedAvatar, setSelectedAvatar] = useState("felix");
  const [isReturning, setIsReturning]       = useState(false);
  const [submitting, setSubmitting]         = useState(false);

  const [avatarRef] = useAutoAnimate<HTMLDivElement>();
  const { register, handleSubmit, watch } = useForm<FormValues>({ defaultValues: { name: "" } });
  const nameValue  = watch("name");
  const activeLang = LANGUAGES.find((l) => l.id === selectedLang)!;

  useEffect(() => { setIsReturning(studentExists(nameValue.trim())); }, [nameValue]);
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
      style={{ background: "#f0f4f8", fontFamily: "'Nunito', 'Baloo 2', sans-serif" }}
    >
      {/* ── Top-right: German flag ribbon (black → red → gold, corner = black) ─ */}
      <svg
        className="absolute top-0 right-0 z-0 pointer-events-none"
        width="300" height="260" viewBox="0 0 300 260"
        aria-hidden="true"
      >
        {/* Gold – outermost band */}
        <polygon points="300,0 300,260 100,260 280,0" fill="#FFCE00" opacity="0.92" />
        {/* Red – middle band */}
        <polygon points="300,0 300,165 135,0" fill="#dc2626" />
        {/* Black – innermost band (at the corner) */}
        <polygon points="300,0 300,70 230,0"  fill="#111827" />
      </svg>

      {/* ── Bottom-left: French flag ribbon (red → white → blue, corner = blue) ─ */}
      <svg
        className="absolute bottom-0 left-0 z-0 pointer-events-none"
        width="300" height="260" viewBox="0 0 300 260"
        aria-hidden="true"
      >
        {/* Red – outermost band */}
        <polygon points="0,260 200,260 0,60"  fill="#dc2626" opacity="0.92" />
        {/* White/light – middle band */}
        <polygon points="0,260 130,260 0,130" fill="#dde3ec" />
        {/* Blue – innermost band (at the corner) */}
        <polygon points="0,260 65,260 0,195"  fill="#2563eb" />
      </svg>

      {/* ── Card ────────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 22, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  scale: 1 }}
        transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 bg-white rounded-3xl w-full max-w-sm mx-14 sm:mx-auto px-7 py-7"
        style={{
          boxShadow:
            "0 2px 0 1px rgba(0,0,0,0.04), 0 12px 40px -8px rgba(0,0,0,0.12), 0 4px 16px -4px rgba(0,0,0,0.06)",
        }}
      >
        {/* ── Compass icon ──────────────────────────────────────────────── */}
        <div className="flex justify-center mb-3">
          <motion.div
            whileTap={{ rotate: -15, scale: 0.92 }}
            className="w-16 h-16 rounded-full flex items-center justify-center cursor-default"
            style={{
              background: "radial-gradient(circle at 36% 30%, #60a5fa, #1d4ed8)",
              boxShadow: "0 5px 16px rgba(29,78,216,0.38), 0 2px 4px rgba(0,0,0,0.12)",
            }}
          >
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="14" fill="white" fillOpacity="0.12" />
              <circle cx="20" cy="20" r="13" stroke="white" strokeOpacity="0.25" strokeWidth="1" />
              {/* North (red) */}
              <polygon points="20,6 23.5,20 20,18 16.5,20" fill="#ef4444" />
              {/* South (white) */}
              <polygon points="20,34 23.5,20 20,22 16.5,20" fill="white" fillOpacity="0.88" />
              {/* Center */}
              <circle cx="20" cy="20" r="2.5" fill="white" />
              {/* N label */}
              <text x="20" y="10" textAnchor="middle" fill="white" fontSize="4.5" fontWeight="bold" fillOpacity="0.75">N</text>
            </svg>
          </motion.div>
        </div>

        {/* ── Title + subtitle ──────────────────────────────────────────── */}
        <h1
          className="text-center text-4xl font-extrabold tracking-tight leading-none mb-1"
          style={{ fontFamily: "'Baloo 2', sans-serif", color: "#0f172a" }}
        >
          Språkjakten
        </h1>
        <p className="text-center text-sm font-bold mb-5" style={{ color: "#94a3b8" }}>
          Välkommen!
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* ── Name input ────────────────────────────────────────────── */}
          <div>
            <input
              {...register("name", { required: true })}
              type="text"
              placeholder="Ditt namn..."
              autoComplete="off"
              maxLength={30}
              className="w-full px-4 py-3 rounded-xl text-base font-bold outline-none transition-colors bg-white placeholder:font-normal"
              style={{
                border: `2px solid #fb923c`,
                color: "#0f172a",
                fontFamily: "'Nunito', sans-serif",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = activeLang.color;
                e.target.style.boxShadow  = `0 0 0 3px ${activeLang.color}1a`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#fb923c";
                e.target.style.boxShadow  = "none";
              }}
            />
            <AnimatePresence>
              {isReturning && nameValue.trim() && (
                <motion.div
                  initial={{ opacity: 0, y: -4, height: 0 }}
                  animate={{ opacity: 1, y: 0,  height: "auto" }}
                  exit={{ opacity: 0, y: -4, height: 0 }}
                  className="flex items-center gap-1.5 mt-1.5 text-emerald-600 text-xs font-bold"
                >
                  <CheckCircle size={13} weight="fill" />
                  Välkommen tillbaka! Din framsteg är sparad.
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Language buttons ──────────────────────────────────────── */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs font-bold text-slate-400 flex-shrink-0 tracking-wide">
                Välj språk
              </span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {LANGUAGES.map((lang) => {
                const active = selectedLang === lang.id;
                return (
                  <motion.button
                    key={lang.id}
                    type="button"
                    whileTap={{ scale: 0.93 }}
                    onClick={() => setSelectedLang(lang.id)}
                    className="py-2.5 rounded-xl font-extrabold text-sm text-white relative overflow-hidden"
                    style={{
                      background: lang.color,
                      boxShadow: active
                        ? `0 4px 0 0 ${lang.shadow}, 0 6px 18px -4px ${lang.color}66`
                        : `0 2px 0 0 ${lang.shadow}`,
                      transform: active ? "translateY(-2px)" : "none",
                      fontFamily: "'Nunito', sans-serif",
                    }}
                  >
                    {lang.label}
                    {active && (
                      <motion.span
                        layoutId="langRing"
                        className="absolute inset-0 rounded-xl"
                        style={{ boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.4)" }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* ── Avatar row ────────────────────────────────────────────── */}
          <div
            ref={avatarRef}
            className="flex items-center justify-center gap-2 py-1"
          >
            {AVATARS.map((av) => {
              const chosen = selectedAvatar === av.id;
              return (
                <motion.button
                  key={av.id}
                  type="button"
                  whileTap={{ scale: 0.86 }}
                  onClick={() => setSelectedAvatar(av.id)}
                  className="flex-shrink-0 rounded-full transition-all"
                  style={{
                    border: `3px solid ${chosen ? activeLang.color : "#e2e8f0"}`,
                    boxShadow: chosen ? `0 4px 14px ${activeLang.color}44` : "none",
                    transform: chosen ? "scale(1.14)" : "scale(1)",
                    outline: "none",
                  }}
                  title={av.seed}
                >
                  <Image
                    src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${av.seed}&radius=50&backgroundColor=${av.bg}`}
                    alt={`Avatar ${av.seed}`}
                    width={50}
                    height={50}
                    className="rounded-full block"
                    unoptimized
                  />
                </motion.button>
              );
            })}
          </div>

          {/* ── Börja button ──────────────────────────────────────────── */}
          <motion.button
            type="submit"
            disabled={!canSubmit}
            whileTap={canSubmit ? { scale: 0.97 } : {}}
            className="w-full py-3.5 rounded-xl font-extrabold text-xl text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: canSubmit
                ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
                : "#94a3b8",
              boxShadow: canSubmit
                ? "0 5px 0 0 #166534, 0 8px 24px -4px rgba(22,163,74,0.35)"
                : "none",
              transform: canSubmit ? "translateY(-1px)" : "none",
              fontFamily: "'Baloo 2', sans-serif",
            }}
          >
            {submitting
              ? "Laddar..."
              : isReturning && nameValue.trim()
                ? "Fortsätt! 🏆"
                : "Börja!"}
          </motion.button>

        </form>
      </motion.div>
    </div>
  );
}
