"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { loadStudent, createStudent, studentExists } from "@/lib/storage";
import type { LanguageId } from "@/lib/types";

// ─── Emoji-style avatars matching the design image ────────────────────────────
const EMOJI_AVATARS = [
  { id: "boy1",    emoji: "👦🏽", label: "Pojke" },
  { id: "girl1",   emoji: "👧🏼", label: "Flicka" },
  { id: "boy2",    emoji: "👦🏿", label: "Pojke" },
  { id: "man1",    emoji: "🧑🏻", label: "Elev" },
  { id: "girl2",   emoji: "👧🏻", label: "Flicka" },
  { id: "grad",    emoji: "🧑🎓", label: "Student" },
  { id: "boy3",    emoji: "👦🏻", label: "Pojke" },
  { id: "girl3",   emoji: "👧🏾", label: "Flicka" },
];

const LANGUAGES: { id: LanguageId; label: string; color: string; hover: string; shadow: string }[] = [
  { id: "franska", label: "Franska", color: "#1d4ed8", hover: "#1e40af", shadow: "rgba(29,78,216,0.4)" },
  { id: "spanska", label: "Spanska", color: "#dc2626", hover: "#b91c1c", shadow: "rgba(220,38,38,0.4)" },
  { id: "tyska",   label: "Tyska",   color: "#374151", hover: "#1f2937", shadow: "rgba(55,65,81,0.4)" },
];

interface FormValues {
  name: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [selectedLang, setSelectedLang] = useState<LanguageId>("franska");
  const [selectedAvatar, setSelectedAvatar] = useState("boy1");
  const [isReturning, setIsReturning] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: { name: "" },
  });

  const nameValue = watch("name");

  useEffect(() => {
    setIsReturning(studentExists(nameValue.trim()));
  }, [nameValue]);

  // If already logged in, redirect to their language
  useEffect(() => {
    const s = loadStudent();
    if (s) {
      router.replace(`/world/${s.selectedLanguage ?? "franska"}`);
    }
  }, [router]);

  function onSubmit({ name }: FormValues) {
    if (!name.trim()) return;
    setSubmitting(true);
    createStudent(name.trim(), selectedAvatar, selectedLang);
    router.push(`/world/${selectedLang}`);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden select-none"
         style={{ background: "#f0f4f8" }}>

      {/* ── Flag-stripe background ───────────────────────────────────────── */}
      {/* Top blue band */}
      <div className="absolute top-0 left-0 right-0 h-24 z-0"
           style={{ background: "#1d4ed8" }} />

      {/* French flag – left side */}
      <div className="absolute left-0 top-0 bottom-0 w-14 flex flex-col z-0">
        <div className="flex-1" style={{ background: "#1d4ed8" }} />
        <div className="flex-1" style={{ background: "#ffffff" }} />
        <div className="flex-1" style={{ background: "#dc2626" }} />
      </div>

      {/* German flag – right side */}
      <div className="absolute right-0 top-0 bottom-0 w-14 flex flex-col z-0">
        <div className="flex-1" style={{ background: "#1c1c1c" }} />
        <div className="flex-1" style={{ background: "#dc2626" }} />
        <div className="flex-1" style={{ background: "#FFCE00" }} />
      </div>

      {/* ── Card ────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative z-10 bg-white rounded-3xl px-8 py-8 w-full max-w-sm mx-6"
        style={{ boxShadow: "0 8px 40px -8px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)" }}
      >
        {/* Compass icon */}
        <div className="flex justify-center mb-3">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              background: "radial-gradient(circle at 35% 35%, #60a5fa, #1d4ed8)",
              boxShadow: "0 4px 12px rgba(29,78,216,0.35)"
            }}
          >
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="14" fill="white" fillOpacity="0.15"/>
              {/* North arrow – red */}
              <polygon points="18,6 21,18 18,16 15,18" fill="#ef4444"/>
              {/* South arrow – white */}
              <polygon points="18,30 21,18 18,20 15,18" fill="white"/>
              {/* Center dot */}
              <circle cx="18" cy="18" r="2" fill="white"/>
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-center text-3xl font-black tracking-tight mb-1"
            style={{ color: "#1e293b" }}>
          Språkjakten
        </h1>
        <p className="text-center text-base mb-5" style={{ color: "#64748b" }}>
          Välkommen!
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* Name input */}
          <div>
            <input
              {...register("name", { required: true, minLength: 1 })}
              type="text"
              placeholder="Ditt namn..."
              autoComplete="off"
              maxLength={30}
              className="w-full px-4 py-3.5 rounded-xl text-base font-medium outline-none transition-all"
              style={{
                border: "2px solid #f97316",
                color: "#1e293b",
              }}
              onFocus={e => e.target.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.15)"}
              onBlur={e => e.target.style.boxShadow = "none"}
            />
            <AnimatePresence>
              {isReturning && nameValue.trim() && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs font-bold text-emerald-600 mt-1.5 flex items-center gap-1"
                >
                  ✅ Välkommen tillbaka! Din data är sparad.
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Language selection */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-px bg-gray-200"/>
              <span className="text-xs font-semibold text-gray-400 flex-shrink-0">Välj språk</span>
              <div className="flex-1 h-px bg-gray-200"/>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {LANGUAGES.map((lang) => (
                <motion.button
                  key={lang.id}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedLang(lang.id)}
                  className="py-3 rounded-xl font-black text-sm text-white transition-all relative overflow-hidden"
                  style={{
                    background: lang.color,
                    boxShadow: selectedLang === lang.id
                      ? `0 4px 0 0 ${lang.shadow}, 0 6px 16px -4px ${lang.shadow}`
                      : `0 2px 0 0 ${lang.shadow}`,
                    transform: selectedLang === lang.id ? "translateY(-2px)" : "none",
                    outline: selectedLang === lang.id ? `3px solid white` : "none",
                    outlineOffset: "2px",
                  }}
                >
                  {lang.label}
                  {selectedLang === lang.id && (
                    <motion.div
                      layoutId="langIndicator"
                      className="absolute inset-0 rounded-xl"
                      style={{ border: "2px solid rgba(255,255,255,0.4)" }}
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Avatar selection */}
          <div>
            <div className="flex justify-center gap-2 flex-wrap">
              {EMOJI_AVATARS.map((av) => (
                <motion.button
                  key={av.id}
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedAvatar(av.id)}
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all cursor-pointer"
                  style={{
                    background: selectedAvatar === av.id ? "#e0f2fe" : "#f8fafc",
                    border: selectedAvatar === av.id ? "3px solid #38bdf8" : "3px solid #e2e8f0",
                    boxShadow: selectedAvatar === av.id
                      ? "0 3px 0 0 rgba(56,189,248,0.35)"
                      : "0 2px 0 0 rgba(0,0,0,0.06)",
                    transform: selectedAvatar === av.id ? "scale(1.15)" : "scale(1)",
                  }}
                  title={av.label}
                >
                  {av.emoji}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Submit button */}
          <motion.button
            type="submit"
            disabled={!nameValue.trim() || submitting}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 rounded-xl font-black text-lg text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: nameValue.trim()
                ? "linear-gradient(135deg, #22c55e, #16a34a)"
                : "linear-gradient(135deg, #94a3b8, #64748b)",
              boxShadow: nameValue.trim()
                ? "0 5px 0 0 rgba(22,163,74,0.45), 0 8px 20px -4px rgba(22,163,74,0.3)"
                : "none",
            }}
          >
            {submitting ? "Laddar..." : isReturning ? "Fortsätt! 🏆" : "Börja!"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
