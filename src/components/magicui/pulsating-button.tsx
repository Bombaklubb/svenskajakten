"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PulsatingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  pulseColor?: string;
  duration?: string;
}

export function PulsatingButton({
  children,
  className,
  pulseColor = "#f97316",
  duration = "1.5s",
  ...props
}: PulsatingButtonProps) {
  return (
    <button
      className={cn(
        "relative flex cursor-pointer items-center justify-center rounded-xl bg-sj-500 px-6 py-3 font-bold text-white",
        "hover:-translate-y-0.5 active:translate-y-0.5 transition-transform",
        className,
      )}
      style={{ "--pulse-color": pulseColor, "--duration": duration } as React.CSSProperties}
      {...props}
    >
      <div className="relative z-10">{children}</div>
      <div
        className="absolute -inset-[2px] rounded-[inherit] animate-pulse opacity-75"
        style={{ background: pulseColor }}
      />
    </button>
  );
}
