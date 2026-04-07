export interface Avatar {
  id: string;
  emoji: string;
  name: string;
  image?: string;
}

const DB = "https://api.dicebear.com/9.x";
const ADV = `${DB}/adventurer/svg`;
const BOT = `${DB}/bottts/svg`;
const PIX = `${DB}/pixel-art/svg`;
const EMO = `${DB}/fun-emoji/svg`;

export const AVATARS: Avatar[] = [
  // ── 12 login-page avatars (DiceBear adventurer, plain bg) ──────────────────
  { id: "felix",  emoji: "😊", name: "Felix",  image: `${ADV}?seed=Felix&radius=50&backgroundColor=b6e3f4` },
  { id: "anna",   emoji: "😊", name: "Anna",   image: `${ADV}?seed=Anna&radius=50&backgroundColor=ffdfbf` },
  { id: "carlos", emoji: "😊", name: "Carlos", image: `${ADV}?seed=Carlos&radius=50&backgroundColor=c0aede` },
  { id: "zoe",    emoji: "😊", name: "Zoe",    image: `${ADV}?seed=Zoe&radius=50&backgroundColor=ffd5dc` },
  { id: "niko",   emoji: "😊", name: "Niko",   image: `${ADV}?seed=Niko&radius=50&backgroundColor=d1fae5` },
  { id: "emma",   emoji: "😊", name: "Emma",   image: `${ADV}?seed=Emma&radius=50&backgroundColor=fde68a` },
  { id: "leo",    emoji: "😊", name: "Leo",    image: `${ADV}?seed=Leo&radius=50&backgroundColor=bae4bc` },
  { id: "maya",   emoji: "😊", name: "Maya",   image: `${ADV}?seed=Maya&radius=50&backgroundColor=f8d7da` },
  { id: "kai",    emoji: "😊", name: "Kai",    image: `${ADV}?seed=Kai&radius=50&backgroundColor=d4f0f7` },
  { id: "sofia",  emoji: "😊", name: "Sofia",  image: `${ADV}?seed=Sofia&radius=50&backgroundColor=fce4c8` },
  { id: "ravi",   emoji: "😊", name: "Ravi",   image: `${ADV}?seed=Ravi&radius=50&backgroundColor=e8d5f5` },
  { id: "luna",   emoji: "😊", name: "Luna",   image: `${ADV}?seed=Luna&radius=50&backgroundColor=f0f4d8` },
  // ── Legacy avatars (kept for backwards compatibility) ───────────────────────
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
  { id: "detective",   emoji: "🕵",  name: "Detektiven",
    image: `${ADV}?seed=Detektiven&backgroundColor=1c1917&backgroundType=gradientLinear&radius=50` },
  { id: "fairy",       emoji: "🧚",  name: "Fen",
    image: `${ADV}?seed=Fen&backgroundColor=831843&backgroundType=gradientLinear&radius=50` },
  { id: "cowboy",      emoji: "🤠",  name: "Cowboyen",
    image: `${ADV}?seed=Cowboyen&backgroundColor=7c2d12&backgroundType=gradientLinear&radius=50` },
  { id: "ghost",       emoji: "👻",  name: "Spöket",
    image: `${EMO}?seed=Sp%C3%B6ket&backgroundColor=312e81&backgroundType=gradientLinear&radius=50` },
  { id: "frog",        emoji: "🐸",  name: "Grodan",
    image: `${ADV}?seed=Grodan&backgroundColor=14532d&backgroundType=gradientLinear&radius=50` },
];

export function getAvatar(id: string): Avatar {
  return AVATARS.find((a) => a.id === id) ?? AVATARS[0];
}
