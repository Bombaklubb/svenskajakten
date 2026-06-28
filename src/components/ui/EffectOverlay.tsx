"use client";

import { getEffect } from "@/lib/shop";

interface EffectOverlayProps {
  effectId?: string;
  /** Reference size in pixels used to scale the particles */
  size: number;
  /** How many particles to render (default 6) */
  count?: number;
  className?: string;
}

/** Motion type per effect → CSS keyframes defined in globals.css (sj-*). */
const MOTION: Record<string, string> = {
  snoflingor:    "fall",
  regn:          "fall",
  hostlov:       "spin",
  korsbarsblom:  "spin",
  konfetti:      "spin",
  sapbubblor:    "rise",
  bubblor:       "rise",
  hjartan:       "rise",
  stjarnor:      "twinkle",
  stjarnglitter: "twinkle",
  eldlagor:      "flicker",
  eld:           "flicker",
  blixtar:       "flash",
  regnbage:      "floaty",
};

/** Deterministic particle slots (percent positions) – avoids hydration mismatch. */
const SLOTS = [
  { left: 8,   top: 2,  delay: 0,    dur: 2.8, scale: 0.75 },
  { left: 86,  top: 10, delay: 0.6,  dur: 3.3, scale: 0.95 },
  { left: 32,  top: -8, delay: 1.2,  dur: 2.4, scale: 0.6  },
  { left: 66,  top: 72, delay: 0.9,  dur: 3.7, scale: 0.85 },
  { left: -6,  top: 48, delay: 1.7,  dur: 3.0, scale: 0.7  },
  { left: 102, top: 44, delay: 0.35, dur: 2.6, scale: 0.65 },
  { left: 48,  top: 94, delay: 2.1,  dur: 3.5, scale: 0.9  },
  { left: 18,  top: 80, delay: 1.4,  dur: 2.9, scale: 0.7  },
];

/** Renders animated emoji particles spread around an avatar / username when an effect is equipped. */
export default function EffectOverlay({ effectId, size, count = 6, className = "" }: EffectOverlayProps) {
  const effect = getEffect(effectId);
  if (!effect) return null;

  const motion = MOTION[effect.id] ?? "floaty";
  const slots = SLOTS.slice(0, Math.min(count, SLOTS.length));

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`} style={{ overflow: "visible", zIndex: 2 }}>
      {slots.map((s, i) => (
        <span
          key={i}
          className="absolute select-none leading-none"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            fontSize: Math.max(9, Math.round(size * 0.42 * s.scale)),
            animation: `sj-${motion} ${s.dur}s ease-in-out ${s.delay}s infinite`,
            willChange: "transform, opacity",
          }}
        >
          {effect.particles[i % effect.particles.length]}
        </span>
      ))}
    </div>
  );
}
