import { AVATARS, type Avatar, type AvatarCategory } from "./avatars";

// ─── Rarities ──────────────────────────────────────────────────────────────────

export type Rarity = "vanlig" | "ovanlig" | "sallsynt" | "episk" | "legendarisk" | "mytisk";

export interface RarityMeta {
  id: Rarity;
  label: string;
  price: number;
  /** Tailwind classes for the small rarity badge */
  badgeClass: string;
}

export const RARITY_META: Record<Rarity, RarityMeta> = {
  vanlig:       { id: "vanlig",       label: "VANLIG",       price: 100,  badgeClass: "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300" },
  ovanlig:      { id: "ovanlig",      label: "OVANLIG",      price: 250,  badgeClass: "bg-emerald-200 text-emerald-900 dark:bg-emerald-800/60 dark:text-emerald-300" },
  sallsynt:     { id: "sallsynt",     label: "SÄLLSYNT",     price: 400,  badgeClass: "bg-sky-200 text-sky-900 dark:bg-sky-800/60 dark:text-sky-300" },
  episk:        { id: "episk",        label: "EPISK",        price: 1000, badgeClass: "bg-fuchsia-200 text-fuchsia-900 dark:bg-fuchsia-800/60 dark:text-fuchsia-300" },
  legendarisk:  { id: "legendarisk",  label: "LEGENDARISK",  price: 2500, badgeClass: "bg-amber-200 text-amber-900 dark:bg-amber-800/60 dark:text-amber-300" },
  mytisk:       { id: "mytisk",       label: "MYTISK",       price: 5000, badgeClass: "bg-purple-200 text-purple-900 dark:bg-purple-800/60 dark:text-purple-300" },
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

  // Utvalda
  artsoul: "sallsynt",
  cyborg: "sallsynt",
  pixelhero: "sallsynt",
  retrofigure: "sallsynt",
  hero: "episk",
  megabot: "episk",
  eightbit: "episk",

  // Djur
  puppy: "vanlig",
  kitten: "vanlig",
  bunny: "vanlig",
  chick: "vanlig",
  penguin: "vanlig",
  koala: "vanlig",
  zebra: "sallsynt",
  giraffe: "sallsynt",

  // Skoltema
  bookworm: "vanlig",
  mathwhiz: "vanlig",
  artist: "vanlig",
  musicstar: "vanlig",
  scientist: "sallsynt",
  linguist: "sallsynt",
  librarian: "sallsynt",
  inventor: "sallsynt",

  // Fordon
  car: "vanlig",
  suv: "vanlig",
  taxi: "vanlig",
  bus: "vanlig",
  bike: "vanlig",
  pickup: "sallsynt",
  motorcycle: "sallsynt",
  policecar: "sallsynt",

  // Yrken
  police: "vanlig",
  builder: "vanlig",
  chef: "vanlig",
  farmer: "vanlig",
  teacher: "vanlig",
  doctor: "sallsynt",
  firefighter: "sallsynt",
  mechanic: "sallsynt",

  // Roligt
  coolpotato: "sallsynt",
  dancingtaco: "sallsynt",
  flyingbanana: "sallsynt",
  zombie: "sallsynt",
  sourcucumber: "sallsynt",
  broccolihero: "sallsynt",
  ogremonster: "sallsynt",
  coffeecup: "sallsynt",
  discoegg: "sallsynt",
  sneakypizza: "sallsynt",
  moodydonut: "sallsynt",
  sleepysloth: "sallsynt",
  partypoop: "sallsynt",
  screamingegg: "sallsynt",
  sassysushi: "sallsynt",
  grumpycactus: "sallsynt",
  hotdogboss: "sallsynt",
  wobblyjelly: "sallsynt",
  spicypepper: "sallsynt",

  // Säsong
  easterbunny: "sallsynt",
  summerpirate: "sallsynt",
  halloween: "sallsynt",
  santa: "sallsynt",
  snowman: "sallsynt",
  midsummer: "sallsynt",

  // Fantasi (extra)
  phoenix: "legendarisk",
  firedragon: "episk",
  icemage: "episk",
  rainbow: "legendarisk",
  diamonddragon: "mytisk",
  galaxyhero: "mytisk",
  legendwizard: "mytisk",
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

// ─── Category groups ─────────────────────────────────────────────────────────────
// Order in which categories appear in the shop.

export const CATEGORY_ORDER: AvatarCategory[] = ["utvalda", "djur", "skoltema", "fordon", "yrken", "roligt", "sasong", "fantasi"];

export function groupAvatarsByCategory(avatars: ShopAvatar[]): { category: AvatarCategory; items: ShopAvatar[] }[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    items: avatars
      .filter((a) => (a.category ?? "fantasi") === category)
      .sort((a, b) => a.price - b.price),
  })).filter((g) => g.items.length > 0);
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

// ─── Themes (Teman) ──────────────────────────────────────────────────────────────
// A theme changes the background colour scheme of the app's hub pages.

export interface Theme {
  id: string;
  name: string;
  rarity: Rarity;
  price: number;
  /** Tailwind classes for the page background, incl. dark mode variants.
   *  Empty for pattern themes that paint their background via `bg` instead. */
  className: string;
  /** Small CSS background used for the preview swatch in the shop */
  swatch: string;
  /** Full-page CSS `background` shorthand for pattern themes (stripes, dots …).
   *  When set it takes precedence over `className`. */
  bg?: string;
  /** True when the background is dark or high-contrast, so text placed directly
   *  on it (page headings, section labels) must switch to a light colour. */
  isDark?: boolean;
}

const RAW_THEMES: Omit<Theme, "price">[] = [
  // ─── Solid gradient themes ───
  { id: "skog",        name: "Skogstema",     rarity: "vanlig",      className: "bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950 dark:to-gray-900",  swatch: "linear-gradient(135deg, #6ee7b7, #059669)" },
  { id: "hav",         name: "Havstema",      rarity: "vanlig",      className: "bg-gradient-to-br from-sky-50 to-blue-100 dark:from-sky-950 dark:to-gray-900",          swatch: "linear-gradient(135deg, #7dd3fc, #2563eb)" },
  { id: "vinter",      name: "Vintertema",    rarity: "vanlig",      className: "bg-gradient-to-br from-cyan-50 to-slate-100 dark:from-slate-900 dark:to-gray-900",      swatch: "linear-gradient(135deg, #cffafe, #94a3b8)" },
  { id: "solnedgang",  name: "Solnedgångstema", rarity: "sallsynt",  className: "bg-gradient-to-br from-pink-50 to-orange-100 dark:from-pink-950 dark:to-gray-900",      swatch: "linear-gradient(135deg, #fbcfe8, #fb923c)" },
  { id: "rymd",        name: "Rymdtema",      rarity: "sallsynt",    className: "bg-gradient-to-br from-indigo-50 to-violet-100 dark:from-indigo-950 dark:to-gray-900",   swatch: "linear-gradient(135deg, #a5b4fc, #7c3aed)" },
  { id: "lava",        name: "Lavatema",      rarity: "episk",       className: "bg-gradient-to-br from-rose-50 to-red-100 dark:from-rose-950 dark:to-gray-900",        swatch: "linear-gradient(135deg, #fda4af, #dc2626)" },
  { id: "galax",       name: "Galaxtema",     rarity: "legendarisk", className: "",
    swatch: "radial-gradient(1.2px 1.2px at 25% 25%, #fff, transparent) 0 0 / 16px 16px, radial-gradient(1.5px 1.5px at 70% 60%, #fde68a, transparent) 0 0 / 26px 26px, linear-gradient(135deg, #7c3aed, #4c1d95 60%, #1e1b4b)",
    bg:     "radial-gradient(1.5px 1.5px at 20% 30%, #ffffff, transparent) 0 0 / 70px 70px, radial-gradient(2px 2px at 70% 60%, #ffffff, transparent) 0 0 / 100px 100px, radial-gradient(1.5px 1.5px at 45% 80%, #fde68a, transparent) 0 0 / 130px 130px, linear-gradient(135deg, #4c1d95, #7c3aed 50%, #1e1b4b)", isDark: true },

  // ─── Pattern themes (stripes, dots, animal prints …) ───
  { id: "prickigt",    name: "Pricktema",       rarity: "vanlig",      className: "",
    swatch: "radial-gradient(#ffffff 26%, transparent 27%) 0 0 / 16px 16px, radial-gradient(#ffffff 26%, transparent 27%) 8px 8px / 16px 16px, #60a5fa",
    bg:     "radial-gradient(#ffffff 24%, transparent 25%) 0 0 / 30px 30px, radial-gradient(#ffffff 24%, transparent 25%) 15px 15px / 30px 30px, #60a5fa" },
  { id: "godis",       name: "Godistema",       rarity: "ovanlig",     className: "",
    swatch: "repeating-linear-gradient(45deg, #fb7185 0 8px, #ffffff 8px 16px)",
    bg:     "repeating-linear-gradient(45deg, #fb7185 0 18px, #ffffff 18px 36px)" },
  { id: "rutmonster",  name: "Rutmönstertema",  rarity: "ovanlig",     className: "",
    swatch: "conic-gradient(#a78bfa 0 25%, #ffffff 0 50%, #a78bfa 0 75%, #ffffff 0) 0 0 / 20px 20px",
    bg:     "conic-gradient(#a78bfa 0 25%, #ffffff 0 50%, #a78bfa 0 75%, #ffffff 0) 0 0 / 48px 48px" },
  { id: "zebra",       name: "Zebratema",       rarity: "sallsynt",    className: "",
    swatch: "repeating-linear-gradient(60deg, #334155 0 8px, #f8fafc 8px 16px)",
    bg:     "repeating-linear-gradient(60deg, #334155 0 18px, #f8fafc 18px 36px)", isDark: true },
  { id: "kamouflage",  name: "Kamouflagetema",  rarity: "sallsynt",    className: "",
    swatch: "radial-gradient(circle at 25% 30%, #1a2e05 18%, transparent 20%) 0 0 / 26px 26px, radial-gradient(circle at 70% 65%, #4d7c0f 16%, transparent 18%) 0 0 / 26px 26px, #3f6212",
    bg:     "radial-gradient(circle at 25% 30%, #1a2e05 13px, transparent 14px) 0 0 / 100px 100px, radial-gradient(circle at 72% 62%, #4d7c0f 16px, transparent 17px) 0 0 / 100px 100px, radial-gradient(circle at 48% 85%, #65a30d 11px, transparent 12px) 0 0 / 100px 100px, #3f6212", isDark: true },
  { id: "regnbage",    name: "Regnbågstema",    rarity: "episk",       className: "",
    swatch: "linear-gradient(135deg, #ff8fab, #ffd56b, #9ee493, #7ec8ff, #c39bf0)",
    bg:     "linear-gradient(135deg, #ff8fab, #ffd56b 30%, #9ee493 50%, #7ec8ff 70%, #c39bf0)" },
  { id: "tiger",       name: "Tigertema",       rarity: "episk",       className: "",
    swatch: "repeating-linear-gradient(70deg, #f59e0b 0 14px, #7c2d12 14px 20px)",
    bg:     "repeating-linear-gradient(72deg, #f59e0b 0 30px, #7c2d12 30px 44px)", isDark: true },
  { id: "leopard",     name: "Leopardtema",     rarity: "episk",       className: "",
    swatch: "radial-gradient(#92400e 22%, transparent 24%) 0 0 / 20px 20px, radial-gradient(#92400e 22%, transparent 24%) 10px 10px / 20px 20px, #fcd9a8",
    bg:     "radial-gradient(#92400e 20%, transparent 22%) 0 0 / 44px 44px, radial-gradient(#b45309 16%, transparent 18%) 22px 22px / 44px 44px, #fcd9a8" },
  { id: "enhorning",   name: "Enhörningstema",  rarity: "legendarisk", className: "",
    swatch: "repeating-linear-gradient(135deg, #fbcfe8 0 10px, #ddd6fe 10px 20px, #bfdbfe 20px 30px, #bbf7d0 30px 40px, #fef9c3 40px 50px)",
    bg:     "repeating-linear-gradient(135deg, #fbcfe8 0 30px, #ddd6fe 30px 60px, #bfdbfe 60px 90px, #bbf7d0 90px 120px, #fef9c3 120px 150px)" },
  { id: "stjarnhimmel", name: "Stjärnhimmel",   rarity: "legendarisk", className: "",
    swatch: "radial-gradient(1.5px 1.5px at 25% 25%, #ffffff, transparent) 0 0 / 18px 18px, radial-gradient(1.5px 1.5px at 70% 60%, #fde68a, transparent) 0 0 / 28px 28px, linear-gradient(#0b1026, #1e1b4b)",
    bg:     "radial-gradient(1.5px 1.5px at 25% 25%, #ffffff, transparent) 0 0 / 60px 60px, radial-gradient(2px 2px at 75% 55%, #ffffff, transparent) 0 0 / 90px 90px, radial-gradient(1.5px 1.5px at 50% 80%, #fde68a, transparent) 0 0 / 120px 120px, linear-gradient(#0b1026, #1e1b4b)", isDark: true },
  { id: "giraff",      name: "Giraffmönster",   rarity: "sallsynt",    className: "",
    swatch: "radial-gradient(circle at 28% 28%, #a8631b 30%, transparent 33%) 0 0 / 22px 22px, radial-gradient(circle at 72% 70%, #a8631b 30%, transparent 33%) 0 0 / 22px 22px, #f3cd8b",
    bg:     "radial-gradient(circle at 25% 25%, #a8631b 26%, transparent 30%) 0 0 / 92px 92px, radial-gradient(circle at 72% 62%, #a8631b 24%, transparent 28%) 0 0 / 92px 92px, radial-gradient(circle at 50% 90%, #a8631b 20%, transparent 24%) 0 0 / 92px 92px, #f3cd8b" },
  { id: "disco",       name: "Discotema",       rarity: "episk",       className: "",
    swatch: "repeating-linear-gradient(60deg, #8b5cf6 0 10px, #ec4899 10px 20px, #10b981 20px 30px)",
    bg:     "repeating-linear-gradient(60deg, #8b5cf6 0 24px, #ec4899 24px 48px, #10b981 48px 72px)", isDark: true },
  { id: "bubbelhav",   name: "Bubbelhavstema",  rarity: "sallsynt",    className: "",
    swatch: "radial-gradient(circle at 30% 70%, rgba(255,255,255,0.45) 0 5px, transparent 6px) 0 0 / 24px 24px, radial-gradient(circle at 75% 35%, rgba(255,255,255,0.35) 0 7px, transparent 8px) 0 0 / 30px 30px, linear-gradient(160deg, #38bdf8, #0369a1)",
    bg:     "radial-gradient(circle at 30% 70%, rgba(255,255,255,0.4) 0 14px, transparent 15px) 0 0 / 120px 120px, radial-gradient(circle at 75% 40%, rgba(255,255,255,0.28) 0 20px, transparent 21px) 0 0 / 150px 150px, radial-gradient(circle at 55% 88%, rgba(255,255,255,0.22) 0 10px, transparent 11px) 0 0 / 100px 100px, linear-gradient(160deg, #38bdf8, #0369a1)", isDark: true },
  { id: "tvspel",      name: "TV-spelstema",    rarity: "episk",       className: "",
    swatch: "conic-gradient(rgba(255,255,255,0.14) 0 25%, transparent 0 50%, rgba(255,255,255,0.14) 0 75%, transparent 0) 0 0 / 14px 14px, linear-gradient(135deg, #312e81, #6d28d9 55%, #1e1b4b)",
    bg:     "repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0 3px, transparent 3px 7px), conic-gradient(rgba(255,255,255,0.10) 0 25%, transparent 0 50%, rgba(255,255,255,0.10) 0 75%, transparent 0) 0 0 / 46px 46px, linear-gradient(135deg, #312e81, #6d28d9 55%, #1e1b4b)", isDark: true },
  { id: "dataspel",    name: "Dataspelstema",   rarity: "episk",       className: "",
    swatch: "repeating-linear-gradient(0deg, rgba(34,211,238,0.5) 0 1.5px, transparent 1.5px 12px), repeating-linear-gradient(90deg, rgba(34,211,238,0.5) 0 1.5px, transparent 1.5px 12px), linear-gradient(180deg, #0f172a, #172554)",
    bg:     "repeating-linear-gradient(0deg, rgba(34,211,238,0.35) 0 2px, transparent 2px 44px), repeating-linear-gradient(90deg, rgba(34,211,238,0.35) 0 2px, transparent 2px 44px), radial-gradient(circle at 50% 0%, rgba(236,72,153,0.35), transparent 60%), linear-gradient(180deg, #0f172a, #172554)", isDark: true },
  { id: "fotboll",     name: "Fotbollstema",    rarity: "ovanlig",     className: "",
    swatch: "repeating-linear-gradient(90deg, #16a34a 0 12px, #15803d 12px 24px)",
    bg:     "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.55) 0 3px, transparent 4px) 0 0 / 100% 100%, repeating-linear-gradient(90deg, #16a34a 0 56px, #15803d 56px 112px)" },
  { id: "dans",        name: "Danstema",        rarity: "sallsynt",    className: "",
    swatch: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8) 0 2px, transparent 3px) 0 0 / 16px 16px, radial-gradient(circle at 70% 65%, rgba(253,224,71,0.8) 0 2px, transparent 3px) 0 0 / 22px 22px, linear-gradient(135deg, #db2777, #7c3aed)",
    bg:     "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.75) 0 3px, transparent 4px) 0 0 / 70px 70px, radial-gradient(circle at 70% 60%, rgba(253,224,71,0.7) 0 3px, transparent 4px) 0 0 / 90px 90px, radial-gradient(circle at 50% 85%, rgba(103,232,249,0.6) 0 2.5px, transparent 3.5px) 0 0 / 110px 110px, linear-gradient(135deg, #db2777, #7c3aed)" },
  { id: "hastar",      name: "Hästtema",        rarity: "sallsynt",    className: "",
    swatch: "radial-gradient(ellipse 10px 7px at 30% 35%, rgba(120,53,15,0.5) 60%, transparent 65%) 0 0 / 26px 26px, radial-gradient(ellipse 8px 6px at 70% 70%, rgba(146,64,14,0.45) 60%, transparent 65%) 0 0 / 26px 26px, linear-gradient(135deg, #d6b088, #b07d4f)",
    bg:     "radial-gradient(ellipse 26px 18px at 28% 32%, rgba(120,53,15,0.4) 60%, transparent 66%) 0 0 / 110px 110px, radial-gradient(ellipse 22px 15px at 72% 68%, rgba(146,64,14,0.35) 60%, transparent 66%) 0 0 / 110px 110px, radial-gradient(ellipse 18px 13px at 50% 92%, rgba(120,53,15,0.3) 60%, transparent 66%) 0 0 / 110px 110px, linear-gradient(135deg, #d6b088, #b07d4f)" },
];

export const THEMES: Theme[] = RAW_THEMES.map((t) => ({ ...t, price: RARITY_META[t.rarity].price }));

export function getTheme(id: string | undefined): Theme | undefined {
  if (!id) return undefined;
  return THEMES.find((t) => t.id === id);
}

/** Background classes for the hub pages: the equipped theme, or the app default.
 *  Pattern themes return "" here and paint via getThemeStyle() instead. */
export function getThemeClassName(id: string | undefined): string {
  const t = getTheme(id);
  if (!t) return "bg-amber-50 dark:bg-gray-900";
  return t.bg ? "" : t.className;
}

/** Inline background style for pattern themes; empty object for gradient/default themes. */
export function getThemeStyle(id: string | undefined): { background?: string } {
  const t = getTheme(id);
  return t?.bg ? { background: t.bg } : {};
}

/**
 * Class for the themed page wrapper. Dark themes get "theme-dark", which makes
 * text sitting directly on the background (marked with "on-theme") switch to a
 * light colour so it stays readable — see globals.css.
 */
export function getThemeWrapperClass(id: string | undefined): string {
  const t = getTheme(id);
  if (!t?.bg) return "";               // plain gradient or default background
  return t.isDark ? "theme-dark" : "theme-pattern";
}

// ─── Effects (Effekter) ──────────────────────────────────────────────────────────
// A visual effect animates particles around the student's avatar.

export interface Effect {
  id: string;
  name: string;
  rarity: Rarity;
  price: number;
  /** Emoji particles used to render the effect */
  particles: string[];
}

const RAW_EFFECTS: Omit<Effect, "price">[] = [
  { id: "stjarnor",     name: "Glittrande stjärnor", rarity: "vanlig",   particles: ["✨", "⭐", "🌟"] },
  { id: "snoflingor",   name: "Snöfall",             rarity: "vanlig",   particles: ["❄️", "❅", "❄️"] },
  { id: "regn",         name: "Regn",                rarity: "vanlig",   particles: ["💧", "💧", "💧"] },
  { id: "sapbubblor",   name: "Såpbubblor",          rarity: "ovanlig",  particles: ["🫧", "🫧", "🫧"] },
  { id: "hjartan",      name: "Hjärtan",             rarity: "ovanlig",  particles: ["💖", "💕", "💗"] },
  { id: "blixtar",      name: "Blixtar",             rarity: "sallsynt", particles: ["⚡", "⚡", "⚡"] },
  { id: "eldlagor",     name: "Eldlågor",            rarity: "sallsynt", particles: ["🔥", "🔥", "🔥"] },
  { id: "hostlov",      name: "Höstlöv",             rarity: "sallsynt", particles: ["🍂", "🍁", "🍂"] },
  { id: "korsbarsblom", name: "Körsbärsblom",        rarity: "sallsynt", particles: ["🌸", "🌸", "🌼"] },
  { id: "stjarnglitter", name: "Stjärnglitter",      rarity: "episk",    particles: ["⭐", "✨", "💫"] },
  { id: "regnbage",     name: "Regnbåge",            rarity: "episk",    particles: ["🌈", "🌈", "🌈"] },
  { id: "konfetti",     name: "Konfetti",            rarity: "episk",    particles: ["🎉", "🎊", "🎉"] },
];

export const EFFECTS: Effect[] = RAW_EFFECTS.map((e) => ({ ...e, price: RARITY_META[e.rarity].price }));

export function getEffect(id: string | undefined): Effect | undefined {
  if (!id) return undefined;
  return EFFECTS.find((e) => e.id === id);
}
