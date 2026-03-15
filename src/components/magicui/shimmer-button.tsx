import { cn } from "@/lib/utils";
import type { CSSProperties, ReactNode } from "react";

interface ShimmerButtonProps {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
  className?: string;
  children?: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

export function ShimmerButton({
  shimmerColor = "#ffffff",
  shimmerSize = "0.1em",
  shimmerDuration = "1.5s",
  borderRadius = "100px",
  background = "linear-gradient(135deg, #f97316, #ea6c0a)",
  className,
  children,
  onClick,
  type = "button",
  disabled,
}: ShimmerButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={
        {
          "--shimmer-color": shimmerColor,
          "--shimmer-size": shimmerSize,
          "--shimmer-duration": shimmerDuration,
          "--border-radius": borderRadius,
          "--background": background,
        } as CSSProperties
      }
      className={cn(
        "group relative flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap px-6 py-3 font-bold text-white transition-all duration-300",
        "rounded-[var(--border-radius)] [background:var(--background)]",
        "hover:-translate-y-0.5 active:translate-y-0.5",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
        className,
      )}
    >
      <div
        className={cn(
          "absolute inset-0 overflow-hidden rounded-[var(--border-radius)]",
          "[background:linear-gradient(90deg,transparent_calc(50%-var(--shimmer-size)),var(--shimmer-color)_50%,transparent_calc(50%+var(--shimmer-size)))]",
          "animate-[shimmer_var(--shimmer-duration)_linear_infinite]",
          "opacity-0 group-hover:opacity-30 transition-opacity",
        )}
        style={{
          animation: `shimmer ${shimmerDuration} linear infinite`,
          backgroundSize: "200% 100%",
        }}
      />
      {children}
    </button>
  );
}
