"use client";

import { useState } from "react";
import type { Avatar } from "@/lib/avatars";
import { getFrame } from "@/lib/shop";

function Img({ av }: { av: Avatar }) {
  const [error, setError] = useState(false);
  if (!av.image || error) {
    return <span className="leading-none" style={{ fontSize: "0.7em" }}>{av.emoji}</span>;
  }
  return <img src={av.image} alt={av.name} className="w-full h-full object-contain" onError={() => setError(true)} />;
}

interface FramedAvatarProps {
  avatar: Avatar;
  frameId?: string;
  /** Outer size in pixels */
  size?: number;
  className?: string;
}

/**
 * Renders an avatar, wrapped in a decorative gradient ring when a frame is equipped.
 * Falls back to a neutral bordered box when no frame is set.
 */
export default function FramedAvatar({ avatar, frameId, size = 40, className = "" }: FramedAvatarProps) {
  const frame = getFrame(frameId);
  const pad = Math.max(2, Math.round(size * 0.07));
  const radius = Math.round(size * 0.28);

  if (!frame) {
    return (
      <div
        className={`rounded-xl overflow-hidden bg-sv-50 dark:bg-gray-700 flex items-center justify-center border-2 border-sv-200 dark:border-gray-600 ${className}`}
        style={{ width: size, height: size, fontSize: size }}
      >
        <Img av={avatar} />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        padding: pad,
        borderRadius: radius,
        background: frame.gradient,
        boxShadow: `0 0 0 1px rgba(255,255,255,0.25) inset, 0 2px 8px -1px ${frame.glow}`,
      }}
    >
      <div
        className="w-full h-full overflow-hidden bg-white dark:bg-gray-800 flex items-center justify-center"
        style={{ borderRadius: radius - pad, fontSize: size }}
      >
        <Img av={avatar} />
      </div>
    </div>
  );
}
