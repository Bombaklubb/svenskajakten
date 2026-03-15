"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface Sparkle {
  id: number;
  x: string;
  y: string;
  color: string;
  delay: number;
  scale: number;
  lifespan: number;
}

const COLORS = ["#f97316", "#fbbf24", "#22c55e", "#a855f7", "#ec4899"];

function random(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function generateSparkle(): Sparkle {
  return {
    id: Math.random(),
    x: `${random(0, 100)}%`,
    y: `${random(0, 100)}%`,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    delay: random(0, 600),
    scale: random(0.5, 1.2),
    lifespan: random(500, 1100),
  };
}

interface SparklesTextProps {
  children: string;
  className?: string;
  sparklesCount?: number;
}

export function SparklesText({
  children,
  className,
  sparklesCount = 10,
}: SparklesTextProps) {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setSparkles((prev) => [
        ...prev.filter((s) => now - s.id < s.lifespan + s.delay),
        ...Array.from({ length: 1 }, () => ({ ...generateSparkle(), id: now + Math.random() })),
      ].slice(-sparklesCount));
    }, 350);
    return () => clearInterval(interval);
  }, [sparklesCount]);

  return (
    <span className={cn("relative inline-block", className)}>
      {sparkles.map((sparkle) => (
        <span
          key={sparkle.id}
          className="pointer-events-none absolute animate-ping"
          style={{
            left: sparkle.x,
            top: sparkle.y,
            color: sparkle.color,
            transform: `scale(${sparkle.scale})`,
            animationDelay: `${sparkle.delay}ms`,
            animationDuration: `${sparkle.lifespan}ms`,
          }}
        >
          ✦
        </span>
      ))}
      <span className="relative">{children}</span>
    </span>
  );
}
