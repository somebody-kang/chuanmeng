"use client";

import { useState } from "react";

type Props = {
  name: string;
  emoji: string;
  color: string;
  imageUrl?: string | null;
  className?: string;
  sizeClass?: string;
};

/** 优先显示上传立绘；无图或加载失败时回退 emoji */
export default function CharacterPortrait({
  name,
  emoji,
  color,
  imageUrl,
  className = "",
  sizeClass = "text-5xl md:text-6xl",
}: Props) {
  const [failed, setFailed] = useState(false);
  const showImg = Boolean(imageUrl) && !failed;

  return (
    <div
      className={`relative h-full w-full overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(165deg, ${color}66 0%, ${color}22 45%, rgba(0,0,0,0.35) 100%)`,
      }}
    >
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl!}
          alt={name}
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          className={`absolute inset-0 flex items-center justify-center drop-shadow-lg ${sizeClass}`}
          aria-hidden
        >
          {emoji}
        </span>
      )}
    </div>
  );
}
