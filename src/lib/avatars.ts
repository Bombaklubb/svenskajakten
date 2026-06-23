export type AvatarCategory = "utvalda" | "fantasi" | "djur" | "skoltema" | "fordon" | "yrken";

export interface Avatar {
  id: string;
  emoji: string;
  name: string;
  image?: string;
  category?: AvatarCategory;
}

export const CATEGORY_LABELS: Record<AvatarCategory, string> = {
  utvalda: "Utvalda",
  fantasi: "Fantasi",
  djur: "Djur",
  skoltema: "Skoltema",
  fordon: "Fordon",
  yrken: "Yrken",
};

const DB = "https://api.dicebear.com/9.x";
const ADV = `${DB}/adventurer/svg`;
const BOT = `${DB}/bottts/svg`;
const PIX = `${DB}/pixel-art/svg`;
const EMO = `${DB}/fun-emoji/svg`;

export const AVATARS: Avatar[] = [
  { id: "ninja",       emoji: "🥷",  name: "Ninjan",
    image: `${PIX}?seed=Ninjan&backgroundColor=1e1b4b&backgroundType=gradientLinear&radius=50` },
  { id: "wizard",      emoji: "🧙",  name: "Trollkarlen",
    image: `${ADV}?seed=Trollkarlen&backgroundColor=4a1d96&backgroundType=gradientLinear&radius=50` },
  { id: "fox",         emoji: "🦊",  name: "Räven",
    image: `${ADV}?seed=R%C3%A4ven&backgroundColor=c2410c&backgroundType=gradientLinear&radius=50` },
  { id: "lion",        emoji: "🦁",  name: "Lejonet",
    image: `${ADV}?seed=Lejonet&backgroundColor=b45309&backgroundType=gradientLinear&radius=50` },
  { id: "dragon",      emoji: "🐲",  name: "Draken",
    image: `${ADV}?seed=Draken&backgroundColor=14532d&backgroundType=gradientLinear&radius=50` },
  { id: "unicorn",     emoji: "🦄",  name: "Enhörningen",
    image: `${ADV}?seed=Enh%C3%B6rningen&backgroundColor=831843&backgroundType=gradientLinear&radius=50` },
  { id: "robot",       emoji: "🤖",  name: "Roboten",
    image: `${BOT}?seed=Roboten&backgroundColor=1e3a8a&backgroundType=gradientLinear&radius=50` },
  { id: "astronaut",   emoji: "🧑",  name: "Astronauten",
    image: `${ADV}?seed=Astronauten&backgroundColor=0c4a6e&backgroundType=gradientLinear&radius=50` },
  { id: "owl",         emoji: "🦉",  name: "Ugglan",
    image: `${ADV}?seed=Ugglan&backgroundColor=78350f&backgroundType=gradientLinear&radius=50` },
  { id: "pirate",      emoji: "🏴",  name: "Piraten",
    image: `${ADV}?seed=Piraten&backgroundColor=1c1917&backgroundType=gradientLinear&radius=50` },
  { id: "princess",    emoji: "👸",  name: "Prinsessan",
    image: `${ADV}?seed=Prinsessan&backgroundColor=9d174d&backgroundType=gradientLinear&radius=50` },
  { id: "prince",      emoji: "🤴",  name: "Prinsen",
    image: `${ADV}?seed=Prinsen&backgroundColor=1e3a8a&backgroundType=gradientLinear&radius=50` },
  { id: "elf",         emoji: "🧝",  name: "Alven",
    image: `${ADV}?seed=Alven&backgroundColor=14532d&backgroundType=gradientLinear&radius=50` },
  { id: "mermaid",     emoji: "🧜",  name: "Sjöjungfrun",
    image: `${ADV}?seed=Sj%C3%B6jungfrun&backgroundColor=0c4a6e&backgroundType=gradientLinear&radius=50` },
  { id: "superhero",   emoji: "🦸",  name: "Superhjälten",
    image: `${ADV}?seed=Superh%C3%A4lten&backgroundColor=1d4ed8&backgroundType=gradientLinear&radius=50` },
  { id: "villain",     emoji: "🦹",  name: "Skurken",
    image: `${ADV}?seed=Skurken&backgroundColor=3b0764&backgroundType=gradientLinear&radius=50` },
  { id: "vampire",     emoji: "🧛",  name: "Vampyren",
    image: `${ADV}?seed=Vampyren&backgroundColor=1e1b4b&backgroundType=gradientLinear&radius=50` },
  { id: "ghost",       emoji: "👻",  name: "Spöket",
    image: `${EMO}?seed=Sp%C3%B6ket&backgroundColor=312e81&backgroundType=gradientLinear&radius=50` },
  { id: "fairy",       emoji: "🧚",  name: "Fen",
    image: `${ADV}?seed=Fen&backgroundColor=831843&backgroundType=gradientLinear&radius=50` },
  { id: "genie",       emoji: "🧞",  name: "Anden",
    image: `${ADV}?seed=Anden&backgroundColor=78350f&backgroundType=gradientLinear&radius=50` },
  { id: "cowboy",      emoji: "🤠",  name: "Cowboyen",
    image: `${ADV}?seed=Cowboyen&backgroundColor=7c2d12&backgroundType=gradientLinear&radius=50` },
  { id: "rockstar",    emoji: "🎤",  name: "Rockstjärnan",
    image: `${ADV}?seed=Rockstj%C3%A4rnan&backgroundColor=111827&backgroundType=gradientLinear&radius=50` },
  { id: "detective",   emoji: "🕵",  name: "Detektiven",
    image: `${ADV}?seed=Detektiven&backgroundColor=1c1917&backgroundType=gradientLinear&radius=50` },
  { id: "frog",        emoji: "🐸",  name: "Grodan",
    image: `${ADV}?seed=Grodan&backgroundColor=14532d&backgroundType=gradientLinear&radius=50` },
  { id: "footballer",  emoji: "⚽",  name: "Fotbollsspelaren",
    image: `${ADV}?seed=Fotbollsspelaren&backgroundColor=14532d&backgroundType=gradientLinear&radius=50` },

  // ─── Utvalda ────────────────────────────────────────────────────────────
  { id: "artsoul",     emoji: "🎭",  name: "Konstnärssjälen",  category: "utvalda" },
  { id: "cyborg",      emoji: "🦾",  name: "Cyborgen",         category: "utvalda" },
  { id: "pixelhero",   emoji: "🎮",  name: "Pixelhjälten",     category: "utvalda" },
  { id: "retrofigure", emoji: "👾",  name: "Retrofiguren",     category: "utvalda" },
  { id: "hero",        emoji: "🦸",  name: "Hjälten",          category: "utvalda" },
  { id: "megabot",     emoji: "🤖",  name: "Megaboten",        category: "utvalda" },
  { id: "eightbit",    emoji: "👾",  name: "8-bitaren",        category: "utvalda" },

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
  { id: "bookworm",    emoji: "🐛",  name: "Bokmasken",        category: "skoltema" },
  { id: "mathwhiz",    emoji: "🔢",  name: "Mattesnillet",     category: "skoltema" },
  { id: "artist",      emoji: "🎨",  name: "Konstnären",       category: "skoltema" },
  { id: "musicstar",   emoji: "🎵",  name: "Musikstjärnan",    category: "skoltema" },
  { id: "scientist",   emoji: "🔬",  name: "Vetenskapsgeniet", category: "skoltema" },
  { id: "linguist",    emoji: "📚",  name: "Språkmästaren",    category: "skoltema" },
  { id: "librarian",   emoji: "📖",  name: "Bibliotekarien",   category: "skoltema" },
  { id: "inventor",    emoji: "💡",  name: "Uppfinnaren",      category: "skoltema" },

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
  { id: "chef",        emoji: "👨‍🍳", name: "Kocken",        category: "yrken" },
  { id: "farmer",      emoji: "🧑‍🌾", name: "Bonden",        category: "yrken" },
  { id: "teacher",     emoji: "🧑‍🏫", name: "Läraren",       category: "yrken" },
  { id: "doctor",      emoji: "🧑‍⚕️", name: "Doktorn",       category: "yrken" },
  { id: "firefighter", emoji: "🧑‍🚒", name: "Brandmannen",   category: "yrken" },
  { id: "mechanic",    emoji: "🧑‍🔧", name: "Mekanikern",    category: "yrken" },
];

export function getAvatar(id: string): Avatar {
  return AVATARS.find((a) => a.id === id) ?? AVATARS[0];
}
