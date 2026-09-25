/**
 * Bygger sprite-arket med alla avatarer och effektpartiklar.
 *
 * Bilderna är Microsofts Fluent Emoji i 3D (MIT-licens), hämtade ur
 * npm-paketet @lobehub/fluent-emoji-3d. Paketet är 17 MB och behövs bara när
 * arket byggs om, så det är inget beroende i appen. Så här byggs arket:
 *
 *   curl -s https://registry.npmjs.org/@lobehub/fluent-emoji-3d/-/fluent-emoji-3d-1.1.0.tgz | tar xz -C /tmp
 *   npm run build-sprites -- /tmp/package/assets
 *
 * Alla bilder hamnar i en enda webp-fil, så att en elev hämtar samtliga
 * avatarer med ett enda anrop. Filnamnet innehåller en hash av innehållet, så
 * webbläsaren kan spara den för gott och ett nytt ark får ett nytt namn.
 *
 * Kör skriptet igen när en avatar eller effekt får en ny emoji.
 */
import sharp from "sharp";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { AVATARS } from "../src/lib/avatars.ts";
import { EFFECTS } from "../src/lib/shop.ts";

const SRC = process.argv[2];
if (!SRC || !existsSync(SRC)) {
  console.error("Ange mappen med Fluent-bilderna, se kommentaren överst i skriptet.");
  process.exit(1);
}

const CELL = 128;
const COLS = 12;

const emojis = [...new Set([...AVATARS.map((a) => a.emoji), ...EFFECTS.flatMap((e) => e.particles)])];

function fileFor(emoji) {
  const cps = [...emoji].map((c) => c.codePointAt(0).toString(16).padStart(4, "0"));
  const candidates = [cps.join("-"), cps.filter((c) => c !== "fe0f").join("-"), `${cps.join("-")}-fe0f`];
  const hit = candidates.find((c) => existsSync(`${SRC}/${c}.webp`));
  if (!hit) throw new Error(`Ingen Fluent-bild för ${emoji} (${cps.join("-")})`);
  return `${SRC}/${hit}.webp`;
}

const rows = Math.ceil(emojis.length / COLS);
const tiles = await Promise.all(
  emojis.map(async (e, i) => ({
    input: await sharp(fileFor(e)).resize(CELL, CELL, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer(),
    left: (i % COLS) * CELL,
    top: Math.floor(i / COLS) * CELL,
  })),
);

const sheet = await sharp({ create: { width: COLS * CELL, height: rows * CELL, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite(tiles)
  .webp({ quality: 86, alphaQuality: 90, effort: 6 })
  .toBuffer();

const hash = createHash("sha256").update(sheet).digest("hex").slice(0, 10);
for (const f of readdirSync("public/sprites")) if (f.startsWith("emoji-")) rmSync(`public/sprites/${f}`);
writeFileSync(`public/sprites/emoji-${hash}.webp`, sheet);

const index = Object.fromEntries(emojis.map((e, i) => [e, i]));
writeFileSync(
  "src/lib/emojiSprites.ts",
  `// Genererad av scripts/build-sprites.mjs – ändra inte för hand.\n` +
    `export const SPRITE_URL = "/sprites/emoji-${hash}.webp";\n` +
    `export const SPRITE_COLS = ${COLS};\n` +
    `export const SPRITE_ROWS = ${rows};\n` +
    `export const SPRITE_INDEX: Record<string, number> = ${JSON.stringify(index, null, 2)};\n`,
);
console.log(`${emojis.length} bilder, ${COLS}×${rows}, ${(sheet.length / 1024).toFixed(0)} KB → public/sprites/emoji-${hash}.webp`);
