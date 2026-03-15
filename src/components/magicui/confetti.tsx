"use client";

import { useCallback, useEffect, useImperativeHandle, useRef } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
};

interface ConfettiProps {
  className?: string;
  manualstart?: boolean;
  children?: ReactNode;
}

export interface ConfettiRef {
  fire: (options?: { x?: number; y?: number }) => void;
}

const COLORS = [
  "#f97316", "#fbbf24", "#22c55e", "#3b82f6",
  "#a855f7", "#ec4899", "#14b8a6", "#f43f5e",
];

export function Confetti({
  className,
  manualstart = false,
}: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);

  const fire = useCallback(({ x = 0.5, y = 0.5 }: { x?: number; y?: number } = {}) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const newParticles: Particle[] = Array.from({ length: 120 }, () => ({
      x: canvas.width * x,
      y: canvas.height * y,
      vx: (Math.random() - 0.5) * 12,
      vy: Math.random() * -12 - 4,
      alpha: 1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 8 + 4,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
    }));
    particlesRef.current.push(...newParticles);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current = particlesRef.current.filter((p) => p.alpha > 0.01);
      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3;
        p.alpha -= 0.012;
        p.rotation += p.rotationSpeed;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.5);
        ctx.restore();
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    if (!manualstart) fire();

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [fire, manualstart]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("pointer-events-none absolute inset-0 w-full h-full", className)}
    />
  );
}

// Hook-variant för enkel användning
export function useConfetti() {
  const ref = useRef<{ fire: (opts?: { x?: number; y?: number }) => void } | null>(null);
  return ref;
}
