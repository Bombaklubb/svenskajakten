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
// A theme paints a drawn scene or pattern behind the app's hub pages. The art
// itself lives in themeArt.ts; this is the shop's list of what can be bought.

export type ThemeCategory = "natur" | "djur" | "monster" | "spel" | "fantasy" | "riddare" | "anime" | "fest";

export const THEME_CATEGORY_LABELS: Record<ThemeCategory, string> = {
  natur: "🌲 Natur & rymd",
  djur: "🐼 Djur",
  spel: "🎮 Spel",
  fantasy: "🐉 Fantasy",
  riddare: "🏰 Riddare",
  anime: "🌸 Anime & manga",
  fest: "🪩 Fest & sport",
  monster: "🎨 Mönster",
};

export const THEME_CATEGORY_ORDER: ThemeCategory[] = ["natur", "djur", "spel", "fantasy", "riddare", "anime", "fest", "monster"];

export interface Theme {
  id: string;
  name: string;
  rarity: Rarity;
  price: number;
  category: ThemeCategory;
  /** True when the background is dark or busy, so text placed directly on it
   *  (page headings, section labels) must switch to a light colour. */
  isDark?: boolean;
}

// The ids are what pupils have bought, so an existing id must never change.
const RAW_THEMES: Omit<Theme, "price">[] = [
  // Natur & rymd
  { id: "skog",         name: "Skogen",             rarity: "vanlig",      category: "natur" },
  { id: "hav",          name: "Havet",              rarity: "vanlig",      category: "natur" },
  { id: "vinter",       name: "Vintern",            rarity: "vanlig",      category: "natur" },
  { id: "bubbelhav",    name: "Under havet",        rarity: "sallsynt",    category: "natur", isDark: true },
  { id: "solnedgang",   name: "Solnedgången",       rarity: "sallsynt",    category: "natur", isDark: true },
  { id: "rymd",         name: "Rymden",             rarity: "sallsynt",    category: "natur", isDark: true },
  { id: "regnbage",     name: "Regnbågen",          rarity: "episk",       category: "natur" },
  { id: "lava",         name: "Vulkanen",           rarity: "episk",       category: "natur", isDark: true },
  { id: "stjarnhimmel", name: "Stjärnhimmel",       rarity: "legendarisk", category: "natur", isDark: true },
  { id: "galax",        name: "Galaxen",            rarity: "legendarisk", category: "natur", isDark: true },

  // Djur
  { id: "tassar",       name: "Tassavtryck",        rarity: "vanlig",      category: "djur" },
  { id: "pingviner",    name: "Pingvinisen",        rarity: "ovanlig",     category: "djur" },
  { id: "fjarilar",     name: "Fjärilsängen",       rarity: "ovanlig",     category: "djur" },
  { id: "zebra",        name: "Zebra",              rarity: "sallsynt",    category: "djur", isDark: true },
  { id: "giraff",       name: "Giraff",             rarity: "sallsynt",    category: "djur", isDark: true },
  { id: "hastar",       name: "Hästhagen",          rarity: "sallsynt",    category: "djur" },
  { id: "pandaskog",    name: "Pandaskogen",        rarity: "sallsynt",    category: "djur" },
  { id: "savann",       name: "Savannen",           rarity: "sallsynt",    category: "djur" },
  { id: "tiger",        name: "Tiger",              rarity: "episk",       category: "djur", isDark: true },
  { id: "leopard",      name: "Leopard",            rarity: "episk",       category: "djur", isDark: true },
  { id: "korallrev",    name: "Korallrevet",        rarity: "episk",       category: "djur", isDark: true },

  // Spel
  { id: "plattform",    name: "Plattformsspelet",   rarity: "ovanlig",     category: "spel" },
  { id: "arkad",        name: "Arkadhallen",        rarity: "sallsynt",    category: "spel", isDark: true },
  { id: "blockvarld",   name: "Blockvärlden",       rarity: "episk",       category: "spel" },
  { id: "tvspel",       name: "TV-spel",            rarity: "episk",       category: "spel", isDark: true },
  { id: "dataspel",     name: "Retrospel",          rarity: "episk",       category: "spel", isDark: true },

  // Fantasy
  { id: "kristallgrotta", name: "Kristallgrottan",  rarity: "sallsynt",    category: "fantasy", isDark: true },
  { id: "trollskog",    name: "Trollskogen",        rarity: "episk",       category: "fantasy", isDark: true },
  { id: "trollkarl",    name: "Trollkarlens torn",  rarity: "episk",       category: "fantasy", isDark: true },
  { id: "enhorning",    name: "Enhörningsriket",    rarity: "legendarisk", category: "fantasy" },
  { id: "drakberget",   name: "Drakberget",         rarity: "legendarisk", category: "fantasy", isDark: true },

  // Riddare
  { id: "tornerspel",   name: "Tornerspelet",       rarity: "ovanlig",     category: "riddare" },
  { id: "vapenskold",   name: "Vapensköldar",       rarity: "sallsynt",    category: "riddare", isDark: true },
  { id: "riddarborg",   name: "Riddarborgen",       rarity: "episk",       category: "riddare" },
  { id: "kungasal",     name: "Kungasalen",         rarity: "legendarisk", category: "riddare", isDark: true },

  // Anime & manga
  { id: "actionlinjer", name: "Actionlinjer",       rarity: "ovanlig",     category: "anime" },
  { id: "mangaraster",  name: "Mangasidan",         rarity: "ovanlig",     category: "anime" },
  { id: "kawaii",       name: "Kawaii",             rarity: "sallsynt",    category: "anime" },
  { id: "serierutor",   name: "Serierutor",         rarity: "sallsynt",    category: "anime" },
  { id: "animehimmel",  name: "Animehimmel",        rarity: "sallsynt",    category: "anime" },
  { id: "sakura",       name: "Körsbärsblom",       rarity: "episk",       category: "anime" },
  { id: "neonstad",     name: "Neonstaden",         rarity: "episk",       category: "anime", isDark: true },

  // Fest & sport
  { id: "fotboll",      name: "Fotbollsplanen",     rarity: "ovanlig",     category: "fest" },
  { id: "dans",         name: "Dansscenen",         rarity: "sallsynt",    category: "fest", isDark: true },
  { id: "disco",        name: "Disco",              rarity: "episk",       category: "fest", isDark: true },

  // Mönster
  { id: "prickigt",     name: "Prickar",            rarity: "vanlig",      category: "monster" },
  { id: "rutmonster",   name: "Rutigt",             rarity: "ovanlig",     category: "monster" },
  { id: "godis",        name: "Godis",              rarity: "ovanlig",     category: "monster" },
  { id: "kamouflage",   name: "Kamouflage",         rarity: "sallsynt",    category: "monster", isDark: true },
];

export const THEMES: Theme[] = RAW_THEMES.map((t) => ({ ...t, price: RARITY_META[t.rarity].price }));

export function getTheme(id: string | undefined): Theme | undefined {
  if (!id) return undefined;
  return THEMES.find((t) => t.id === id);
}

export function groupThemesByCategory(themes: Theme[]): { category: ThemeCategory; items: Theme[] }[] {
  return THEME_CATEGORY_ORDER.map((category) => ({
    category,
    items: themes.filter((t) => t.category === category).sort((a, b) => a.price - b.price),
  })).filter((g) => g.items.length > 0);
}

/** Background classes for the hub pages: the app default when no theme is
 *  equipped. An equipped theme is painted by <ThemeBackdrop> instead. */
export function getThemeClassName(id: string | undefined): string {
  return getTheme(id) ? "" : "bg-amber-50 dark:bg-gray-900";
}

/**
 * Class for the themed page wrapper. "isolate" keeps the backdrop layer behind
 * the page's own content. Dark themes get "theme-dark", which makes text sitting
 * directly on the background (marked with "on-theme") switch to a light colour
 * so it stays readable — see globals.css.
 */
export function getThemeWrapperClass(id: string | undefined): string {
  const t = getTheme(id);
  if (!t) return "";
  return t.isDark ? "isolate theme-dark" : "isolate theme-pattern";
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
