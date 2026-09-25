"use client";

import type { Avatar, AvatarCategory } from "@/lib/avatars";
import { getFrame, type Frame, type FrameOrnament } from "@/lib/shop";
import EffectOverlay from "@/components/ui/EffectOverlay";
import EmojiSprite from "@/components/ui/EmojiSprite";

/** Background behind shop avatars, by category. Starter avatars carry their own. */
const CATEGORY_TINT: Record<AvatarCategory, string> = {
  utvalda: "#c7d2fe",
  djur: "#bbf7d0",
  skoltema: "#99f6e4",
  fordon: "#bae6fd",
  yrken: "#fde68a",
  roligt: "#fbcfe8",
  sasong: "#fed7aa",
  fantasi: "#e9d5ff",
};

export function avatarTint(av: Avatar): string {
  return av.tint ?? (av.category ? CATEGORY_TINT[av.category] : "#e0e7ff");
}

/** The picture on its soft, lit-from-above background. */
export function AvatarPicture({ avatar, radius }: { avatar: Avatar; radius: number }) {
  const tint = avatarTint(avatar);
  return (
    <div
      className="w-full h-full flex items-center justify-center overflow-hidden"
      style={{
        borderRadius: radius,
        background: `radial-gradient(circle at 50% 30%, #ffffff 0%, ${tint} 75%)`,
        boxShadow: "inset 0 -3px 6px rgba(0,0,0,0.08), inset 0 2px 3px rgba(255,255,255,0.9)",
      }}
    >
      <EmojiSprite emoji={avatar.emoji} className="w-[80%] h-[80%] drop-shadow-sm" />
    </div>
  );
}

// ─── Ornaments ────────────────────────────────────────────────────────────────
// Drawn in a 100 × 100 box laid over the avatar; they may reach past its edge.

const leaf = (x: number, y: number, rot: number, c: string) =>
  <path key={`${x}${y}`} d="M0 0 C6 -10 18 -10 24 0 C18 10 6 10 0 0Z" fill={c} stroke="#14532d" strokeWidth="1.2" transform={`translate(${x} ${y}) rotate(${rot})`} />;

const sparkle = (x: number, y: number, s: number, c: string) =>
  <path key={`${x}${y}`} d={`M${x} ${y - s} Q${x} ${y} ${x + s} ${y} Q${x} ${y} ${x} ${y + s} Q${x} ${y} ${x - s} ${y} Q${x} ${y} ${x} ${y - s}Z`} fill={c} stroke="rgba(0,0,0,0.25)" strokeWidth="0.6" />;

const gem = (x: number, y: number, s: number, fill: string, edge: string) => (
  <g key={`${x}${y}`} transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-8 -4 L-4 -9 L4 -9 L8 -4 L0 8Z" fill={fill} stroke={edge} strokeWidth="1.2" strokeLinejoin="round" />
    <path d="M-8 -4 H8 M-4 -9 L-2 -4 L0 8 M4 -9 L2 -4" stroke={edge} strokeWidth="0.8" fill="none" opacity="0.7" />
    <path d="M-3 -7 L-1 -4" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
  </g>
);

const flower = (x: number, y: number, s: number) => (
  <g key={`${x}${y}`} transform={`translate(${x} ${y}) scale(${s})`}>
    {[0, 72, 144, 216, 288].map((r) => <ellipse key={r} cx="0" cy="-5" rx="3.6" ry="5" fill="#fbcfe8" stroke="#db2777" strokeWidth="0.7" transform={`rotate(${r})`} />)}
    <circle r="2.2" fill="#facc15" />
  </g>
);

function Ornament({ kind }: { kind: FrameOrnament }) {
  let body: React.ReactNode = null;
  switch (kind) {
    case "leaves":
      body = [leaf(-6, 10, -40, "#4ade80"), leaf(2, 2, -80, "#22c55e"), leaf(106, 90, 140, "#4ade80"), leaf(98, 98, 100, "#22c55e")];
      break;
    case "bubbles":
      body = [[98, 6, 6], [106, 18, 4], [96, 22, 3], [2, 94, 5], [-6, 84, 3.5]].map(([x, y, r]) => (
        <g key={`${x}${y}`}><circle cx={x} cy={y} r={r} fill="rgba(186,230,253,0.55)" stroke="#e0f2fe" strokeWidth="1.2" /><circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.28} fill="#fff" /></g>
      ));
      break;
    case "gem":
      body = gem(50, -2, 1.1, "#ef4444", "#7f1d1d");
      break;
    case "flames":
      body = [[22, 0.8], [50, 1.1], [78, 0.8]].map(([x, s]) => (
        <g key={x} transform={`translate(${x} 2) scale(${s})`}>
          <path d="M0 -16 C8 -6 9 2 0 6 C-9 2 -8 -6 0 -16Z" fill="#f97316" />
          <path d="M0 -8 C4 -3 4 2 0 4 C-4 2 -4 -3 0 -8Z" fill="#fde047" />
        </g>
      ));
      break;
    case "diamonds":
      body = [[2, 2], [98, 2], [2, 98], [98, 98]].map(([x, y]) => gem(x, y, 0.75, "#a5f3fc", "#4338ca"));
      break;
    case "crown":
      body = (
        <g transform="translate(50 -4)">
          <path d="M-16 6 L-18 -8 L-9 -1 L0 -13 L9 -1 L18 -8 L16 6Z" fill="#facc15" stroke="#92400e" strokeWidth="1.4" strokeLinejoin="round" />
          <circle cx="0" cy="-13" r="2" fill="#ef4444" /><circle cx="-18" cy="-8" r="1.8" fill="#3b82f6" /><circle cx="18" cy="-8" r="1.8" fill="#3b82f6" />
          <rect x="-16" y="3" width="32" height="4" rx="1" fill="#eab308" stroke="#92400e" strokeWidth="1" />
        </g>
      );
      break;
    case "pixels":
      body = [[-4, -4, 1, 1], [104, -4, -1, 1], [-4, 104, 1, -1], [104, 104, -1, -1]].map(([x, y, dx, dy]) => (
        <g key={`${x}${y}`} fill="#facc15" stroke="#854d0e" strokeWidth="0.8">
          <rect x={x - (dx < 0 ? 6 : 0)} y={y - (dy < 0 ? 6 : 0)} width="6" height="6" />
          <rect x={x + dx * 6 - (dx < 0 ? 6 : 0)} y={y - (dy < 0 ? 6 : 0)} width="6" height="6" />
          <rect x={x - (dx < 0 ? 6 : 0)} y={y + dy * 6 - (dy < 0 ? 6 : 0)} width="6" height="6" />
        </g>
      ));
      break;
    case "petals":
      body = [flower(4, 6, 1.3), flower(16, -2, 0.9), flower(96, 94, 1.3), flower(84, 102, 0.9)];
      break;
    case "rivets":
      body = [[4, 4], [50, 2], [96, 4], [98, 50], [96, 96], [50, 98], [4, 96], [2, 50]].map(([x, y]) => (
        <g key={`${x}${y}`}><circle cx={x} cy={y} r="3" fill="#cbd5e1" stroke="#334155" strokeWidth="1" /><circle cx={x - 0.9} cy={y - 0.9} r="1" fill="#fff" /></g>
      ));
      break;
    case "stars":
      body = [sparkle(0, 0, 9, "#fde68a"), sparkle(100, 0, 7, "#ffffff"), sparkle(0, 100, 7, "#ffffff"), sparkle(100, 100, 9, "#fde68a")];
      break;
  }
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: "visible", zIndex: 1 }} aria-hidden="true">
      {body}
    </svg>
  );
}

function Ring({ frame, radius }: { frame: Frame; radius: number }) {
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        borderRadius: radius,
        boxShadow: `0 0 0 1px rgba(0,0,0,0.12), 0 2px 10px -1px ${frame.glow}`,
        animation: frame.motion === "pulse" ? "sj-frame-pulse 2.2s ease-in-out infinite" : undefined,
      }}
    >
      {frame.motion === "spin" ? (
        <div className="absolute" style={{ inset: "-50%", background: frame.ring, animation: "sj-frame-spin 6s linear infinite" }} />
      ) : (
        <div className="absolute inset-0" style={{ background: frame.ring }} />
      )}
      {frame.motion === "shimmer" && (
        <div
          className="absolute inset-y-0 w-1/3"
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.75), transparent)", animation: "sj-frame-shimmer 3.2s ease-in-out infinite" }}
        />
      )}
      {/* A thin highlight and shadow give the ring some depth. */}
      <div className="absolute inset-0" style={{ borderRadius: radius, boxShadow: "inset 0 1px 1px rgba(255,255,255,0.7), inset 0 -1px 2px rgba(0,0,0,0.3)" }} />
    </div>
  );
}

interface FramedAvatarProps {
  avatar: Avatar;
  frameId?: string;
  effectId?: string;
  /** Outer size in pixels */
  size?: number;
  className?: string;
}

/**
 * Renders an avatar on its tinted background, wrapped in a decorated ring
 * when a frame is equipped, and surrounded by animated particles when an
 * effect is equipped.
 */
export default function FramedAvatar({ avatar, frameId, effectId, size = 40, className = "" }: FramedAvatarProps) {
  const frame = getFrame(frameId);
  const radius = Math.round(size * 0.28);
  const pad = Math.max(3, Math.round(size * 0.09));

  if (!frame) {
    return (
      <div className={`relative flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
        <div className="w-full h-full p-[2px] bg-white/70 dark:bg-gray-600" style={{ borderRadius: radius }}>
          <AvatarPicture avatar={avatar} radius={radius - 2} />
        </div>
        <EffectOverlay effectId={effectId} size={size} aura />
      </div>
    );
  }

  return (
    <div className={`relative flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
      <Ring frame={frame} radius={radius} />
      <div className="absolute" style={{ inset: pad }}>
        <AvatarPicture avatar={avatar} radius={radius - pad} />
      </div>
      {frame.ornament && size >= 44 && <Ornament kind={frame.ornament} />}
      <EffectOverlay effectId={effectId} size={size} aura />
    </div>
  );
}
