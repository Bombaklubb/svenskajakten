import { SPRITE_COLS, SPRITE_INDEX, SPRITE_ROWS, SPRITE_URL } from "@/lib/emojiSprites";

/**
 * One picture from the emoji sprite sheet (Fluent Emoji 3D). Every avatar and
 * effect particle comes from the same sheet, so the whole set costs a single
 * download. An emoji that is not on the sheet falls back to the system's own.
 *
 * `label` is what a screen reader says for it (the emoji itself by default);
 * an empty label marks the picture as decoration and hides it.
 */
export default function EmojiSprite({ emoji, label, className = "", style }: { emoji: string; label?: string; className?: string; style?: React.CSSProperties }) {
  const i = SPRITE_INDEX[emoji];
  const decorative = label === "";
  if (i === undefined) {
    return decorative ? (
      <span aria-hidden="true" className={`leading-none ${className}`} style={style}>{emoji}</span>
    ) : (
      <span role="img" aria-label={label ?? emoji} className={`leading-none ${className}`} style={style}>{emoji}</span>
    );
  }
  const col = i % SPRITE_COLS;
  const row = Math.floor(i / SPRITE_COLS);
  return (
    <span
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : label ?? emoji}
      aria-hidden={decorative ? true : undefined}
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
