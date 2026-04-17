const CORRECT_MESSAGES = [
  "✓ Rätt! 🎉",
  "✓ Perfekt! ⭐",
  "✓ Bra jobbat! 🌟",
  "✓ Toppen! 🏆",
  "✓ Klockrent! 🎯",
  "✓ Strålande! ✨",
  "✓ Suveränt! 🚀",
  "✓ Imponerande! 💪",
  "✓ Kanon! 🎊",
  "✓ Du är grym! 😎",
  "✓ Fantastiskt! 🌈",
  "✓ Precis rätt! 👏",
  "✓ Mästerligt! 🥇",
  "✓ Lysande! 💡",
  "✓ Du kan det här! 🦁",
  "✓ Snyggt! 🎸",
  "✓ Superbt! 🌠",
  "✓ Wow, bra! 🙌",
  "✓ Korrekt! 🔑",
  "✓ Jättebra! 🦊",
];

export function getCorrectMessage(): string {
  return CORRECT_MESSAGES[Math.floor(Math.random() * CORRECT_MESSAGES.length)];
}
