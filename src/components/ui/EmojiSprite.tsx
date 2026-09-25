import { SPRITE_COLS, SPRITE_INDEX, SPRITE_ROWS, SPRITE_URL } from "@/lib/emojiSprites";

/**
 * One picture from the emoji sprite sheet (Fluent Emoji 3D). Every avatar and
 * effect particle comes from the same sheet, so the whole set costs a single
 * download. An emoji that is not on the sheet falls back to the system's own.
 */
export default function EmojiSprite({ emoji, className = "", style }: { emoji: string; className?: string; style?: React.CSSProperties }) {
  const i = SPRITE_INDEX[emoji];
  if (i === undefined) {
    return <span className={`leading-none ${className}`} style={style}>{emoji}</span>;
  }
  const col = i % SPRITE_COLS;
  const row = Math.floor(i / SPRITE_COLS);
  return (
    <span
      role="img"
      aria-label={emoji}
      className={`inline-block bg-no-repeat ${className}`}
      style={{
        backgroundImage: `url(${SPRITE_URL})`,
        backgroundSize: `${SPRITE_COLS * 100}% ${SPRITE_ROWS * 100}%`,
        backgroundPosition: `${(col / (SPRITE_COLS - 1)) * 100}% ${(row / (SPRITE_ROWS - 1)) * 100}%`,
        ...style,
      }}
    />
  );
}
