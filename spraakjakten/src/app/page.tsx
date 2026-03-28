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
import { CheckCircle, Star } from "@phosphor-icons/react";
import { CheckCircle, Globe } from "@phosphor-icons/react";
import Image from "next/image";
import { loadStudent, createStudent, studentExists } from "@/lib/storage";
import type { LanguageId } from "@/lib/types";

// ─── Language config with flag gradients ──────────────────────────────────────
const LANGUAGES = [
  {
    id: "franska" as LanguageId,
    color: "#2563eb",
    shadow: "#1e3a8a",
    // French flag: blue | white | red (vertical)
    flag: "linear-gradient(to right, #2563eb 33.33%, #f0f0f0 33.33%, #f0f0f0 66.66%, #dc2626 66.66%)",
  },
  {
    id: "spanska" as LanguageId,
    color: "#c60b1e",
    shadow: "#7f0010",
    // Spanish flag: red | gold | red (horizontal, gold wider)
// ─── Language config with flag backgrounds ────────────────────────────────────
const LANGUAGES = [
  {
    id: "franska" as LanguageId,
    label: "Franska",
    color: "#2563eb",
    shadow: "#1e3a8a",
    // French flag: blue | white | red (vertical stripes)
    flag: "linear-gradient(to right, #2563eb 33.33%, #ffffff 33.33%, #ffffff 66.66%, #dc2626 66.66%)",
  },
  {
    id: "spanska" as LanguageId,
    label: "Spanska",
    color: "#c60b1e",
    shadow: "#7f0010",
    // Spanish flag: red | yellow(wide) | red (horizontal)
    flag: "linear-gradient(to bottom, #c60b1e 25%, #ffc400 25%, #ffc400 75%, #c60b1e 75%)",
  },
  {
    id: "tyska" as LanguageId,
    label: "Tyska",
    color: "#1f2937",
    shadow: "#030712",
    // German flag: black | red | gold (horizontal)
    flag: "linear-gradient(to bottom, #111827 33.33%, #dc2626 33.33%, #dc2626 66.66%, #FFCE00 66.66%)",
  },
];

// ─── 12 DiceBear adventurer avatars ──────────────────────────────────────────
const AVATARS = [
  { id: "felix",  seed: "Felix",  bg: "b6e3f4" },
  { id: "anna",   seed: "Anna",   bg: "ffdfbf" },
  { id: "carlos", seed: "Carlos", bg: "c0aede" },
  { id: "zoe",    seed: "Zoe",    bg: "ffd5dc" },
  { id: "niko",   seed: "Niko",   bg: "d1fae5" },
  { id: "emma",   seed: "Emma",   bg: "fde68a" },
  { id: "leo",    seed: "Leo",    bg: "bae4bc" },
  { id: "maya",   seed: "Maya",   bg: "f8d7da" },
  { id: "kai",    seed: "Kai",    bg: "d4f0f7" },
  { id: "sofia",  seed: "Sofia",  bg: "fce4c8" },
  { id: "ravi",   seed: "Ravi",   bg: "e8d5f5" },
  { id: "luna",   seed: "Luna",   bg: "f0f4d8" },
];

// ─── 9-segment flag-wheel icon ───────────────────────────────────────────────
// Circle r=28, inner r=14, center=(32,32) in a 64×64 viewBox
// 3 flags × 3 stripes each = 9 segments of 40° each, starting at 12 o'clock
// Pre-computed outer (R=28) and inner (r=14) boundary points at each 40° step:
//  -90°→(32,4)/(32,18)   -50°→(50,10.6)/(41,21.3)   -10°→(59.6,27.1)/(45.8,29.6)
//   30°→(56.2,46)/(44.1,39)  70°→(41.6,58.3)/(36.8,45.2)  110°→(22.4,58.3)/(27.2,45.2)
//  150°→(7.8,46)/(19.9,39)  190°→(4.4,27.1)/(18.2,29.6)  230°→(14,10.6)/(23,21.3)
//  270°→(32,4)/(32,18)  [same as -90°]
const FLAG_SEGMENTS = [
  // French flag (blue | white | red)
  { d: "M 32,4 A 28,28 0 0,1 50,10.6 L 41,21.3 A 14,14 0 0,0 32,18 Z",         fill: "#2563eb" },
  { d: "M 50,10.6 A 28,28 0 0,1 59.6,27.1 L 45.8,29.6 A 14,14 0 0,0 41,21.3 Z", fill: "#e8e8e8" },
  { d: "M 59.6,27.1 A 28,28 0 0,1 56.2,46 L 44.1,39 A 14,14 0 0,0 45.8,29.6 Z", fill: "#dc2626" },
  // Spanish flag (red | gold | red)
  { d: "M 56.2,46 A 28,28 0 0,1 41.6,58.3 L 36.8,45.2 A 14,14 0 0,0 44.1,39 Z",   fill: "#c60b1e" },
  { d: "M 41.6,58.3 A 28,28 0 0,1 22.4,58.3 L 27.2,45.2 A 14,14 0 0,0 36.8,45.2 Z", fill: "#ffc400" },
  { d: "M 22.4,58.3 A 28,28 0 0,1 7.8,46 L 19.9,39 A 14,14 0 0,0 27.2,45.2 Z",    fill: "#c60b1e" },
  // German flag (black | red | gold)
  { d: "M 7.8,46 A 28,28 0 0,1 4.4,27.1 L 18.2,29.6 A 14,14 0 0,0 19.9,39 Z",     fill: "#111827" },
  { d: "M 4.4,27.1 A 28,28 0 0,1 14,10.6 L 23,21.3 A 14,14 0 0,0 18.2,29.6 Z",    fill: "#dc2626" },
  { d: "M 14,10.6 A 28,28 0 0,1 32,4 L 32,18 A 14,14 0 0,0 23,21.3 Z",             fill: "#FFCE00" },
// ─── 12 DiceBear cartoon avatars ─────────────────────────────────────────────
const AVATARS = [
  { id: "felix",  seed: "Felix",   bg: "b6e3f4" },
  { id: "anna",   seed: "Anna",    bg: "ffdfbf" },
  { id: "carlos", seed: "Carlos",  bg: "c0aede" },
  { id: "zoe",    seed: "Zoe",     bg: "ffd5dc" },
  { id: "niko",   seed: "Niko",    bg: "d1fae5" },
  { id: "emma",   seed: "Emma",    bg: "fde68a" },
  { id: "leo",    seed: "Leo",     bg: "bae4bc" },
  { id: "maya",   seed: "Maya",    bg: "f8d7da" },
  { id: "kai",    seed: "Kai",     bg: "d4f0f7" },
  { id: "sofia",  seed: "Sofia",   bg: "fce4c8" },
  { id: "ravi",   seed: "Ravi",    bg: "e8d5f5" },
  { id: "luna",   seed: "Luna",    bg: "f0f4d8" },
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
      {/* ── TOP-LEFT: Spanish flag ribbon (red outer → gold middle → red inner) ─ */}
      <svg className="absolute top-0 left-0 z-0 pointer-events-none"
           width="300" height="260" viewBox="0 0 300 260" aria-hidden="true">
        <polygon points="0,0 200,0 0,200" fill="#c60b1e" opacity="0.90" />
        <polygon points="0,0 130,0 0,130" fill="#ffc400" />
        <polygon points="0,0 65,0 0,65"   fill="#c60b1e" />
      </svg>

      {/* ── TOP-RIGHT: German flag ribbon (gold outer → red middle → black inner) ─ */}
      <svg className="absolute top-0 right-0 z-0 pointer-events-none"
           width="300" height="260" viewBox="0 0 300 260" aria-hidden="true">
        <polygon points="300,0 300,260 100,260 280,0" fill="#FFCE00" opacity="0.92" />
        <polygon points="300,0 300,165 135,0" fill="#dc2626" />
        <polygon points="300,0 300,70 230,0"  fill="#111827" />
      </svg>

      {/* ── BOTTOM-LEFT: French flag ribbon (red outer → white → blue inner) ─── */}
      <svg className="absolute bottom-0 left-0 z-0 pointer-events-none"
           width="300" height="260" viewBox="0 0 300 260" aria-hidden="true">
        <polygon points="0,260 200,260 0,60"  fill="#dc2626" opacity="0.92" />
        <polygon points="0,260 130,260 0,130" fill="#dde3ec" />

      {/* ── Top-LEFT: Spanish flag ribbon (red → yellow → red, corner = red) ── */}
      <svg
        className="absolute top-0 left-0 z-0 pointer-events-none"
        width="300" height="260" viewBox="0 0 300 260"
        aria-hidden="true"
      >
        {/* Red outermost */}
        <polygon points="0,0 200,0 0,200" fill="#c60b1e" opacity="0.90" />
        {/* Yellow/gold middle */}
        <polygon points="0,0 130,0 0,130" fill="#ffc400" />
        {/* Red innermost (corner) */}
        <polygon points="0,0 65,0 0,65"   fill="#c60b1e" />
      </svg>

      {/* ── Top-RIGHT: German flag ribbon (gold → red → black, corner = black) ─ */}
      <svg
        className="absolute top-0 right-0 z-0 pointer-events-none"
        width="300" height="260" viewBox="0 0 300 260"
        aria-hidden="true"
      >
        {/* Gold outermost */}
        <polygon points="300,0 300,260 100,260 280,0" fill="#FFCE00" opacity="0.92" />
        {/* Red middle */}
        <polygon points="300,0 300,165 135,0" fill="#dc2626" />
        {/* Black innermost (corner) */}
        <polygon points="300,0 300,70 230,0"  fill="#111827" />
      </svg>

      {/* ── Bottom-LEFT: French flag ribbon (red → white → blue, corner = blue) ─ */}
      <svg
        className="absolute bottom-0 left-0 z-0 pointer-events-none"
        width="300" height="260" viewBox="0 0 300 260"
        aria-hidden="true"
      >
        {/* Red outermost */}
        <polygon points="0,260 200,260 0,60"  fill="#dc2626" opacity="0.92" />
        {/* White/light middle */}
        <polygon points="0,260 130,260 0,130" fill="#dde3ec" />
        {/* Blue innermost (corner) */}
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

        {/* ── 9-segment flag-wheel icon ─────────────────────────────────── */}
        <div className="flex justify-center mb-3">
          <motion.div
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.91, rotate: -20 }}
            className="relative w-16 h-16 cursor-default"
            style={{ filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.20))" }}
          >
            {/* SVG ring: 9 flag-stripe segments + white inner circle */}
            <svg width="64" height="64" viewBox="0 0 64 64" className="block">
              <circle cx="32" cy="32" r="30" fill="white" />
              {FLAG_SEGMENTS.map((seg, i) => (
                <path key={i} d={seg.d} fill={seg.fill} stroke="white" strokeWidth="1.2" />
              ))}
              {/* White center disk */}
              <circle cx="32" cy="32" r="13" fill="white" />
            </svg>
            {/* Star icon centered over SVG */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Star size={15} weight="fill" color="#f59e0b" />
        {/* ── Tricolor flag wheel icon ──────────────────────────────────── */}
        <div className="flex justify-center mb-3">
          <motion.div
            whileTap={{ rotate: 30, scale: 0.92 }}
            className="w-16 h-16 rounded-full flex items-center justify-center cursor-default"
            style={{
              // Conic gradient: French blue | Spanish red | German gold
              background: "conic-gradient(#2563eb 0deg 120deg, #c60b1e 120deg 240deg, #FFCE00 240deg 360deg)",
              boxShadow: "0 5px 18px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.10)",
            }}
          >
            {/* White inner circle with globe icon */}
            <div
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.12)" }}
            >
              <Globe size={22} weight="fill" color="#0f172a" />
            </div>
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
                border: "2px solid #fb923c",
                color: "#0f172a",
                fontFamily: "'Nunito', sans-serif",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = activeLang.color;
                e.target.style.boxShadow   = `0 0 0 3px ${activeLang.color}1a`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#fb923c";
                e.target.style.boxShadow   = "none";
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

          {/* ── Language flag buttons (no text) ───────────────────────── */}
          {/* ── Language buttons (flag backgrounds) ───────────────────── */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <div className="flex-1 h-px bg-slate-200" />
              <span
                className="flex-shrink-0 font-extrabold tracking-wide"
                style={{ fontSize: "0.8rem", color: "#475569" }}
              >
                Välj ditt språk
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
                    className="h-12 rounded-xl relative overflow-hidden"
                    style={{
                      background: lang.flag,
                      boxShadow: active
                        ? `0 4px 0 0 ${lang.shadow}, 0 6px 18px -4px ${lang.color}66`
                        : `0 2px 0 0 ${lang.shadow}`,
                      transform: active ? "translateY(-3px)" : "none",
                    }}
                  >
                    {active && (
                      <motion.span
                        layoutId="langRing"
                        className="absolute inset-0 rounded-xl"
                        style={{ boxShadow: "inset 0 0 0 3px rgba(255,255,255,0.7)" }}
                      transform: active ? "translateY(-2px)" : "none",
                    }}
                  >
                    {/* Dark overlay so text is always readable on flag background */}
                    <div className="absolute inset-0 rounded-xl" style={{ background: "rgba(0,0,0,0.28)" }} />
                    <span
                      className="relative z-10 drop-shadow"
                      style={{
                        fontFamily: "'Nunito', sans-serif",
                        textShadow: "0 1px 3px rgba(0,0,0,0.5)",
                      }}
                    >
                      {lang.label}
                    </span>
                    {active && (
                      <motion.span
                        layoutId="langRing"
                        className="absolute inset-0 rounded-xl z-20"
                        style={{ boxShadow: "inset 0 0 0 2.5px rgba(255,255,255,0.55)" }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* ── 12 avatars (2 rows of 6) ───────────────────────────────── */}
          {/* ── 12 avatars, 2 rows of 6 ───────────────────────────────── */}
          <div
            ref={avatarRef}
            className="flex flex-wrap justify-center gap-1.5 py-0.5"
          >
            {AVATARS.map((av) => {
              const chosen = selectedAvatar === av.id;
              return (
                <motion.button
                  key={av.id}
                  type="button"
                  whileTap={{ scale: 0.85 }}
                  onClick={() => setSelectedAvatar(av.id)}
                  className="flex-shrink-0 rounded-full"
                  style={{ outline: "none" }}
                  title={av.seed}
                >
                  <Image
                    src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${av.seed}&radius=50&backgroundColor=${av.bg}`}
                    alt={`Avatar ${av.seed}`}
                    width={44}
                    height={44}
                    className="rounded-full block"
                    className="rounded-full block transition-all"
                    style={{
                      border: `3px solid ${chosen ? activeLang.color : "#e2e8f0"}`,
                      boxShadow: chosen ? `0 3px 10px ${activeLang.color}55` : "none",
                      transform: chosen ? "scale(1.14)" : "scale(1)",
                      transition: "transform 0.15s, box-shadow 0.15s",
                    }}
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
