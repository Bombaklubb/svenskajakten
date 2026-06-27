"use client";

import { getEffect } from "@/lib/shop";

interface EffectOverlayProps {
  effectId?: string;
  /** Outer avatar size in pixels, used to scale the particles */
  size: number;
}

const ANIMATION_CLASS: Record<string, string> = {
  stjarnor: "animate-twinkle",
  snoflingor: "animate-fall",
  sapbubblor: "animate-float",
  blixtar: "animate-wiggle",
  eldlagor: "animate-bounce-slow",
  regnbage: "animate-float",
  konfetti: "animate-float",
};

const POSITIONS = [
  { top: "-8%", left: "-8%" },
  { top: "-18%", left: "50%" },
  { top: "-8%", left: "108%" },
];

/** Renders animated emoji particles around an avatar when an effect is equipped. */
export default function EffectOverlay({ effectId, size }: EffectOverlayProps) {
  const effect = getEffect(effectId);
  if (!effect) return null;

  const animClass = ANIMATION_CLASS[effect.id] ?? "animate-float";
  const fontSize = Math.max(10, Math.round(size * 0.34));

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ overflow: "visible" }}>
      {effect.particles.map((particle, i) => (
        <span
          key={i}
          className={`absolute select-none leading-none ${animClass}`}
          style={{
            fontSize,
            top: POSITIONS[i % POSITIONS.length].top,
            left: POSITIONS[i % POSITIONS.length].left,
            transform: "translate(-50%, -50%)",
            animationDelay: `${i * 0.25}s`,
          }}
        >
          {particle}
        </span>
      ))}
    </div>
  );
}
