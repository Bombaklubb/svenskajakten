import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface RainbowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export function RainbowButton({ children, className, ...props }: RainbowButtonProps) {
  return (
    <button
      className={cn(
        "group relative inline-flex h-11 cursor-pointer items-center justify-center rounded-xl px-8 py-2 font-bold text-white transition-all",
        "bg-[length:200%] [background-clip:padding-box,border-box,border-box] [background-origin:border-box] [border:calc(0.08*1rem)_solid_transparent]",
        "before:absolute before:bottom-[-20%] before:left-1/2 before:z-0 before:h-1/5 before:w-3/5 before:-translate-x-1/2 before:animate-rainbow before:bg-[linear-gradient(90deg,#f97316,#fbbf24,#22c55e,#3b82f6,#a855f7,#f97316)] before:bg-[length:200%] before:[filter:blur(calc(0.8*1rem))]",
        "animate-rainbow bg-[linear-gradient(#f97316,#f97316),linear-gradient(#f97316_50%,rgba(249,115,22,0.6)_80%,rgba(0,0,0,0)),linear-gradient(90deg,#f97316,#fbbf24,#22c55e,#3b82f6,#a855f7,#f97316)]",
        "dark:bg-[linear-gradient(#ea6c0a,#ea6c0a),linear-gradient(#ea6c0a_50%,rgba(234,108,10,0.6)_80%,rgba(0,0,0,0)),linear-gradient(90deg,#f97316,#fbbf24,#22c55e,#3b82f6,#a855f7,#f97316)]",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
