import { AVATARS, type Avatar } from "./avatars";

// ─── Rarities ──────────────────────────────────────────────────────────────────

export type Rarity = "vanlig" | "ovanlig" | "sallsynt" | "episk" | "legendarisk";

export interface RarityMeta {
  id: Rarity;
  label: string;
  price: number;
  /** Tailwind classes for the small rarity badge */
  badgeClass: string;
}

export const RARITY_META: Record<Rarity, RarityMeta> = {
  vanlig:       { id: "vanlig",       label: "VANLIG",       price: 150,  badgeClass: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300" },
  ovanlig:      { id: "ovanlig",      label: "OVANLIG",      price: 250,  badgeClass: "bg-emerald-200 text-emerald-700 dark:bg-emerald-800/60 dark:text-emerald-300" },
  sallsynt:     { id: "sallsynt",     label: "SÄLLSYNT",     price: 400,  badgeClass: "bg-sky-200 text-sky-700 dark:bg-sky-800/60 dark:text-sky-300" },
  episk:        { id: "episk",        label: "EPISK",        price: 700,  badgeClass: "bg-fuchsia-200 text-fuchsia-700 dark:bg-fuchsia-800/60 dark:text-fuchsia-300" },
  legendarisk:  { id: "legendarisk",  label: "LEGENDARISK",  price: 1200, badgeClass: "bg-amber-200 text-amber-700 dark:bg-amber-800/60 dark:text-amber-300" },
};

// ─── Avatar shop items ───────────────────────────────────────────────────────────
// Reuses the existing AVATARS list and assigns a rarity (which sets the price).

const AVATAR_RARITY: Record<string, Rarity> = {
  ninja: "vanlig",
  fox: "vanlig",
  owl: "vanlig",
  frog: "vanlig",
  footballer: "vanlig",
  cowboy: "vanlig",
  lion: "ovanlig",
  robot: "ovanlig",
  astronaut: "ovanlig",
  pirate: "ovanlig",
  detective: "ovanlig",
  rockstar: "ovanlig",
  wizard: "sallsynt",
  elf: "sallsynt",
  mermaid: "sallsynt",
  fairy: "sallsynt",
  prince: "sallsynt",
  princess: "sallsynt",
  superhero: "episk",
  villain: "episk",
  vampire: "episk",
  ghost: "episk",
  genie: "legendarisk",
  dragon: "legendarisk",
  unicorn: "legendarisk",
};

export interface ShopAvatar extends Avatar {
  rarity: Rarity;
  price: number;
}

export const SHOP_AVATARS: ShopAvatar[] = AVATARS.map((a) => {
  const rarity = AVATAR_RARITY[a.id] ?? "vanlig";
  return { ...a, rarity, price: RARITY_META[rarity].price };
});

export function getShopAvatar(id: string): ShopAvatar | undefined {
  return SHOP_AVATARS.find((a) => a.id === id);
}

// ─── Frames (Ramar) ──────────────────────────────────────────────────────────────
// A frame is a decorative ring drawn around the student's avatar.

export interface Frame {
  id: string;
  name: string;
  rarity: Rarity;
  price: number;
  /** CSS gradient used for the ring around the avatar */
  gradient: string;
  /** Glow colour for the ring's box-shadow */
  glow: string;
}

const RAW_FRAMES: Omit<Frame, "price">[] = [
  { id: "brons",     name: "Bronsram",      rarity: "vanlig",      gradient: "linear-gradient(135deg, #d97706, #b45309)",            glow: "rgba(217,119,6,0.45)" },
  { id: "silver",    name: "Silverram",     rarity: "vanlig",      gradient: "linear-gradient(135deg, #cbd5e1, #94a3b8)",            glow: "rgba(148,163,184,0.45)" },
  { id: "skog",      name: "Skogsram",      rarity: "ovanlig",     gradient: "linear-gradient(135deg, #34d399, #059669)",            glow: "rgba(5,150,105,0.45)" },
  { id: "hav",       name: "Havsram",       rarity: "ovanlig",     gradient: "linear-gradient(135deg, #38bdf8, #2563eb)",            glow: "rgba(37,99,235,0.45)" },
  { id: "guld",      name: "Guldram",       rarity: "sallsynt",    gradient: "linear-gradient(135deg, #fde047, #f59e0b)",            glow: "rgba(245,158,11,0.5)" },
  { id: "eld",       name: "Eldram",        rarity: "sallsynt",    gradient: "linear-gradient(135deg, #fb923c, #ef4444)",            glow: "rgba(239,68,68,0.5)" },
  { id: "regnbage",  name: "Regnbågsram",   rarity: "episk",       gradient: "linear-gradient(135deg, #f43f5e, #f59e0b, #22c55e, #3b82f6, #a855f7)", glow: "rgba(168,85,247,0.5)" },
  { id: "neon",      name: "Neonram",       rarity: "episk",       gradient: "linear-gradient(135deg, #22d3ee, #a855f7, #ec4899)",   glow: "rgba(34,211,238,0.55)" },
  { id: "diamant",   name: "Diamantram",    rarity: "legendarisk", gradient: "linear-gradient(135deg, #a5f3fc, #818cf8, #c084fc)",   glow: "rgba(129,140,248,0.6)" },
  { id: "kunglig",   name: "Kunglig ram",   rarity: "legendarisk", gradient: "linear-gradient(135deg, #facc15, #7c3aed, #facc15)",   glow: "rgba(124,58,237,0.55)" },
];

export const FRAMES: Frame[] = RAW_FRAMES.map((f) => ({ ...f, price: RARITY_META[f.rarity].price }));

export function getFrame(id: string | undefined): Frame | undefined {
  if (!id) return undefined;
  return FRAMES.find((f) => f.id === id);
}
