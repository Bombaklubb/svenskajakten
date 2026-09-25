"use client";

import { getEffect } from "@/lib/shop";
import EmojiSprite from "@/components/ui/EmojiSprite";

interface EffectOverlayProps {
  effectId?: string;
  /** Reference size in pixels used to scale the particles */
  size: number;
  /** How many particles to render (default 6) */
  count?: number;
  /** Draw a ring of light round the avatar. Only for a square avatar box. */
  aura?: boolean;
  className?: string;
}

/** Motion type per effect → CSS keyframes defined in globals.css (sj-*). */
const MOTION: Record<string, string> = {
  snoflingor:    "fall",
  regn:          "fall",
  mynt:          "fall",
  stjarnfall:    "fall",
  hostlov:       "spin",
  korsbarsblom:  "spin",
  konfetti:      "spin",
  klover:        "spin",
  sapbubblor:    "rise",
  bubblor:       "rise",
  hjartan:       "rise",
  musik:         "rise",
  stjarnor:      "twinkle",
  stjarnglitter: "twinkle",
  eldlagor:      "flicker",
  eld:           "flicker",
  blixtar:       "flash",
  regnbage:      "floaty",
  fjarilar:      "floaty",
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

/** Renders a soft glow and animated particles around an avatar when an effect is equipped. */
export default function EffectOverlay({ effectId, size, count = 6, aura = false, className = "" }: EffectOverlayProps) {
  const effect = getEffect(effectId);
  if (!effect) return null;

  const motion = MOTION[effect.id] ?? "floaty";
  const slots = SLOTS.slice(0, Math.min(count, SLOTS.length));

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`} style={{ overflow: "visible", zIndex: 2 }}>
      {/* A ring of light just outside the avatar, clear in the middle so the picture stays sharp. */}
      {aura && <div
        className="absolute rounded-full"
        style={{
          inset: "-28%",
          background: `radial-gradient(circle, transparent 50%, ${effect.aura}aa 62%, transparent 72%)`,
          animation: "sj-aura 2.6s ease-in-out infinite",
        }}
      />}
      {slots.map((s, i) => {
        const px = Math.max(10, Math.round(size * 0.4 * s.scale));
        return (
          <span
            key={i}
            className="absolute select-none leading-none"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: px,
              height: px,
              animation: `sj-${motion} ${s.dur}s ease-in-out ${s.delay}s infinite`,
              willChange: "transform, opacity",
            }}
          >
            <EmojiSprite emoji={effect.particles[i % effect.particles.length]} className="w-full h-full" />
          </span>
        );
      })}
    </div>
  );
}
