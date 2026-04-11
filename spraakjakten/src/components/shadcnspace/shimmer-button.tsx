"use client";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ButtonHTMLAttributes } from "react";

interface ShimmerButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  background?: string;
}

export function ShimmerButton({
  children,
  className,
  shimmerColor = "rgba(255,255,255,0.4)",
  background,
  ...props
}: ShimmerButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "relative overflow-hidden rounded-xl px-6 py-3 font-bold text-white transition-shadow",
        className
      )}
      style={{ background: background ?? "linear-gradient(135deg, #22c55e, #16a34a)" }}
      {...(props as React.ComponentPropsWithoutRef<typeof motion.button>)}
    >
      <motion.span
        className="absolute inset-0 -translate-x-full skew-x-[-20deg]"
        style={{ background: `linear-gradient(90deg, transparent, ${shimmerColor}, transparent)` }}
        animate={{ translateX: ["−100%", "200%"] }}
        transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1.2, ease: "easeInOut" }}
      />
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
