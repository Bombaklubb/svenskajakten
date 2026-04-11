"use client";
import { motion, Variants } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedTextProps {
  text: string;
  className?: string;
  variant?: "fadeUp" | "typewriter" | "wave";
  delay?: number;
  duration?: number;
}

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  }),
};

const waveVariants: Variants = {
  hidden: { y: 0 },
  visible: (i: number) => ({
    y: [0, -8, 0],
    transition: { delay: i * 0.06, duration: 0.5, ease: "easeInOut" },
  }),
};

export function AnimatedText({
  text,
  className,
  variant = "fadeUp",
  delay = 0,
}: AnimatedTextProps) {
  const words = text.split(" ");
  const variants = variant === "wave" ? waveVariants : fadeUpVariants;

  return (
    <span className={cn("inline-flex flex-wrap gap-x-[0.25em]", className)}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          custom={i + delay / 0.04}
          variants={variants}
          initial="hidden"
          animate="visible"
          className="inline-block"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}
