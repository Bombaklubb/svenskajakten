import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface BentoGridProps {
  children: ReactNode;
  className?: string;
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid w-full auto-rows-[22rem] grid-cols-3 gap-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface BentoCardProps {
  name: string;
  className?: string;
  background?: ReactNode;
  Icon: React.ElementType;
  description: string;
  href?: string;
  cta?: string;
}

export function BentoCard({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
}: BentoCardProps) {
  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-3xl",
        "border-3 border-sv-100 bg-white",
        "shadow-[0_4px_0_0_rgba(249,115,22,0.12),0_8px_16px_-4px_rgba(249,115,22,0.08)]",
        "dark:bg-gray-800 dark:border-gray-700",
        className,
      )}
    >
      <div>{background}</div>
      <div className="pointer-events-none z-10 flex flex-col gap-1 p-6 transition-all duration-300 group-hover:-translate-y-10">
        <Icon className="h-8 w-8 text-sv-500 transition-all duration-300 group-hover:scale-75" />
        <h3 className="text-xl font-black text-sv-800 dark:text-white">{name}</h3>
        <p className="text-sm text-sv-500 dark:text-gray-400">{description}</p>
      </div>
      {href && (
        <div className="pointer-events-none absolute bottom-0 flex w-full translate-y-10 flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <a href={href} className="pointer-events-auto text-sm font-bold text-sv-600 hover:underline">
            {cta ?? "Öppna →"}
          </a>
        </div>
      )}
    </div>
  );
}
