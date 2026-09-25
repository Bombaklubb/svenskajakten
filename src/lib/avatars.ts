export type AvatarCategory = "utvalda" | "djur" | "skoltema" | "fordon" | "yrken" | "roligt" | "sasong" | "fantasi";

export interface Avatar {
  id: string;
  emoji: string;
  name: string;
  category?: AvatarCategory;
  /** Background colour behind the picture. Shop avatars use their category's. */
  tint?: string;
}

export const CATEGORY_LABELS: Record<AvatarCategory, string> = {
  utvalda: "Utvalda",
  djur: "Djur",
  skoltema: "Skoltema",
  fordon: "Fordon",
  yrken: "Yrken",
  roligt: "Roligt",
  sasong: "Säsong",
  fantasi: "Fantasi",
};

// Every avatar is drawn from the emoji in the sprite sheet (see
// scripts/build-sprites.mjs), so the name must describe what that picture
// shows. An id is what pupils have bought and must never change; the emoji
// and name can, as long as they still match each other.
export const AVATARS: Avatar[] = [
  { id: "ninja",       emoji: "🥷",  name: "Ninjan",       tint: "#c7d2fe" },
  { id: "wizard",      emoji: "🧙",  name: "Trollkarlen",  tint: "#ddd6fe" },
  { id: "fox",         emoji: "🦊",  name: "Räven",        tint: "#fed7aa" },
  { id: "lion",        emoji: "🦁",  name: "Lejonet",      tint: "#fde68a" },
  { id: "dragon",      emoji: "🐲",  name: "Draken",       tint: "#bbf7d0" },
  { id: "unicorn",     emoji: "🦄",  name: "Enhörningen",  tint: "#fbcfe8" },
  { id: "robot",       emoji: "🤖",  name: "Roboten",      tint: "#bfdbfe" },
  { id: "astronaut",   emoji: "🧑‍🚀", name: "Astronauten",  tint: "#bae6fd" },
  { id: "owl",         emoji: "🦉",  name: "Ugglan",       tint: "#fde68a" },
  { id: "pirate",      emoji: "🏴‍☠️", name: "Piratflaggan", tint: "#e2e8f0" },
  { id: "princess",    emoji: "👸",  name: "Prinsessan",   tint: "#fbcfe8" },
  { id: "prince",      emoji: "🤴",  name: "Prinsen",      tint: "#bfdbfe" },
  { id: "elf",         emoji: "🧝",  name: "Alven",        tint: "#bbf7d0" },
  { id: "mermaid",     emoji: "🧜‍♀️", name: "Sjöjungfrun",  tint: "#a5f3fc" },
  { id: "superhero",   emoji: "🦸",  name: "Superhjälten", tint: "#bfdbfe" },
  { id: "villain",     emoji: "🦹",  name: "Skurken",      tint: "#e9d5ff" },
  { id: "vampire",     emoji: "🧛",  name: "Vampyren",     tint: "#fecaca" },
  { id: "ghost",       emoji: "👻",  name: "Spöket",       tint: "#e0e7ff" },
  { id: "fairy",       emoji: "🧚",  name: "Fen",          tint: "#f5d0fe" },
  { id: "genie",       emoji: "🧞",  name: "Anden",        tint: "#a5f3fc" },
  { id: "cowboy",      emoji: "🤠",  name: "Cowboyen",     tint: "#fed7aa" },
  { id: "rockstar",    emoji: "🧑‍🎤", name: "Rockstjärnan", tint: "#f5d0fe" },
  { id: "detective",   emoji: "🕵️",  name: "Detektiven",   tint: "#e7e5e4" },
  { id: "frog",        emoji: "🐸",  name: "Grodan",       tint: "#bbf7d0" },
  { id: "footballer",  emoji: "⚽",  name: "Fotbollen",    tint: "#bbf7d0" },

  // ─── Utvalda ────────────────────────────────────────────────────────────
  { id: "artsoul",     emoji: "🎭",  name: "Teatermaskerna",    category: "utvalda" },
  { id: "cyborg",      emoji: "🦾",  name: "Robotarmen",        category: "utvalda" },
  { id: "pixelhero",   emoji: "🎮",  name: "Spelkontrollen",    category: "utvalda" },
  { id: "retrofigure", emoji: "👾",  name: "Pixelmonstret",     category: "utvalda" },
  { id: "hero",        emoji: "🛡️",  name: "Skölden",           category: "utvalda" },
  { id: "megabot",     emoji: "🛸",  name: "Flygande tefatet",  category: "utvalda" },
  { id: "eightbit",    emoji: "🕹️",  name: "Joysticken",        category: "utvalda" },

  // ─── Djur ───────────────────────────────────────────────────────────────
  { id: "puppy",       emoji: "🐶",  name: "Valpen",     category: "djur" },
  { id: "kitten",      emoji: "🐱",  name: "Kattungen",  category: "djur" },
  { id: "bunny",       emoji: "🐰",  name: "Kaninen",    category: "djur" },
  { id: "chick",       emoji: "🐥",  name: "Kycklingen", category: "djur" },
  { id: "penguin",     emoji: "🐧",  name: "Pingvinen",  category: "djur" },
  { id: "koala",       emoji: "🐨",  name: "Koalan",     category: "djur" },
  { id: "zebra",       emoji: "🦓",  name: "Zebran",     category: "djur" },
  { id: "giraffe",     emoji: "🦒",  name: "Giraffen",   category: "djur" },

  // ─── Skoltema ───────────────────────────────────────────────────────────
  { id: "bookworm",    emoji: "🧑‍🎓", name: "Studenten",   category: "skoltema" },
  { id: "mathwhiz",    emoji: "🧮",  name: "Kulramen",     category: "skoltema" },
  { id: "artist",      emoji: "🧑‍🎨", name: "Konstnären",  category: "skoltema" },
  { id: "musicstar",   emoji: "🎸",  name: "Gitarren",     category: "skoltema" },
  { id: "scientist",   emoji: "🧑‍🔬", name: "Forskaren",   category: "skoltema" },
  { id: "linguist",    emoji: "📚",  name: "Bokhögen",     category: "skoltema" },
  { id: "librarian",   emoji: "📖",  name: "Den öppna boken", category: "skoltema" },
  { id: "inventor",    emoji: "💡",  name: "Glödlampan",   category: "skoltema" },

  // ─── Fordon ─────────────────────────────────────────────────────────────
  { id: "car",         emoji: "🚗",  name: "Bilen",         category: "fordon" },
  { id: "suv",         emoji: "🚙",  name: "Stadsjeepen",   category: "fordon" },
  { id: "taxi",        emoji: "🚕",  name: "Taxin",         category: "fordon" },
  { id: "bus",         emoji: "🚌",  name: "Bussen",        category: "fordon" },
  { id: "bike",        emoji: "🚲",  name: "Cykeln",        category: "fordon" },
  { id: "pickup",      emoji: "🛻",  name: "Pickupen",      category: "fordon" },
  { id: "motorcycle",  emoji: "🏍️", name: "Motorcykeln",   category: "fordon" },
  { id: "policecar",   emoji: "🚓",  name: "Polisbilen",    category: "fordon" },

  // ─── Yrken ──────────────────────────────────────────────────────────────
  { id: "police",      emoji: "👮",  name: "Polisen",       category: "yrken" },
  { id: "builder",     emoji: "👷",  name: "Byggaren",      category: "yrken" },
  { id: "chef",        emoji: "🧑‍🍳", name: "Kocken",        category: "yrken" },
  { id: "farmer",      emoji: "🧑‍🌾", name: "Bonden",        category: "yrken" },
  { id: "teacher",     emoji: "🧑‍🏫", name: "Läraren",       category: "yrken" },
  { id: "doctor",      emoji: "🧑‍⚕️", name: "Doktorn",       category: "yrken" },
  { id: "firefighter", emoji: "🧑‍🚒", name: "Brandmannen",   category: "yrken" },
  { id: "mechanic",    emoji: "🧑‍🔧", name: "Mekanikern",    category: "yrken" },

  // ─── Roligt ─────────────────────────────────────────────────────────────
  { id: "coolpotato",    emoji: "🥔",  name: "Potatisen",       category: "roligt" },
  { id: "dancingtaco",   emoji: "🌮",  name: "Tacon",           category: "roligt" },
  { id: "flyingbanana",  emoji: "🍌",  name: "Bananen",         category: "roligt" },
  { id: "zombie",        emoji: "🧟",  name: "Zombien",         category: "roligt" },
  { id: "sourcucumber",  emoji: "🥒",  name: "Gurkan",          category: "roligt" },
  { id: "broccolihero",  emoji: "🥦",  name: "Broccolin",       category: "roligt" },
  { id: "ogremonster",   emoji: "👹",  name: "Monstret",        category: "roligt" },
  { id: "coffeecup",     emoji: "☕",  name: "Kaffekoppen",     category: "roligt" },
  { id: "discoegg",      emoji: "🥚",  name: "Ägget",           category: "roligt" },
  { id: "sneakypizza",   emoji: "🍕",  name: "Pizzabiten",      category: "roligt" },
  { id: "moodydonut",    emoji: "🍩",  name: "Munken",          category: "roligt" },
  { id: "sleepysloth",   emoji: "🦥",  name: "Sengångaren",     category: "roligt" },
  { id: "partypoop",     emoji: "💩",  name: "Bajskorven",      category: "roligt" },
  { id: "screamingegg",  emoji: "🍳",  name: "Stekpannan",      category: "roligt" },
  { id: "sassysushi",    emoji: "🍣",  name: "Sushin",          category: "roligt" },
  { id: "grumpycactus",  emoji: "🌵",  name: "Kaktusen",        category: "roligt" },
  { id: "hotdogboss",    emoji: "🌭",  name: "Varmkorven",      category: "roligt" },
  { id: "wobblyjelly",   emoji: "🍮",  name: "Puddingen",       category: "roligt" },
  { id: "spicypepper",   emoji: "🌶️", name: "Chilipepparn",    category: "roligt" },

  // ─── Säsong ─────────────────────────────────────────────────────────────
  { id: "easterbunny",   emoji: "🐇",  name: "Haren",             category: "sasong" },
  { id: "summerpirate",  emoji: "🏖️",  name: "Sommarstranden",    category: "sasong" },
  { id: "halloween",     emoji: "🎃",  name: "Halloweenpumpan",   category: "sasong" },
  { id: "santa",         emoji: "🎅",  name: "Jultomten",         category: "sasong" },
  { id: "snowman",       emoji: "⛄",  name: "Snögubben",         category: "sasong" },
  { id: "midsummer",     emoji: "💐",  name: "Blombuketten",      category: "sasong" },

  // ─── Fantasi ────────────────────────────────────────────────────────────
  { id: "phoenix",       emoji: "🪄",  name: "Trollstaven",   category: "fantasi" },
  { id: "firedragon",    emoji: "🐉",  name: "Jättedraken",   category: "fantasi" },
  { id: "icemage",       emoji: "🧌",  name: "Trollet",       category: "fantasi" },
  { id: "rainbow",       emoji: "🌈",  name: "Regnbågen",     category: "fantasi" },
  { id: "diamonddragon", emoji: "💎",  name: "Diamanten",     category: "fantasi" },
  { id: "galaxyhero",    emoji: "🌌",  name: "Vintergatan",   category: "fantasi" },
  { id: "legendwizard",  emoji: "🔮",  name: "Kristallkulan", category: "fantasi" },
];

export function getAvatar(id: string): Avatar {
  return AVATARS.find((a) => a.id === id) ?? AVATARS[0];
}

/** The original illustrated avatars, shown for free on the login/signup screen.
 *  Everything else is unlocked via Affären (the shop). */
export const STARTER_AVATARS: Avatar[] = AVATARS.filter((a) => !a.category);
