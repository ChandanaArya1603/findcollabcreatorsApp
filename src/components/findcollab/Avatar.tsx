import React from "react";

interface AvatarProps {
  letter: string;
  size?: number;
  className?: string;
  src?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ letter, size = 40, className = "", src }) => (
  <div
    className={`bg-primary flex items-center justify-center shrink-0 overflow-hidden ${className}`}
    style={{ width: size, height: size, borderRadius: size * 0.3 }}
  >
    {src ? (
      <img src={src} alt={letter} className="w-full h-full object-cover" />
    ) : (
      <span className="text-primary-foreground font-black" style={{ fontSize: size * 0.375 }}>
        {letter}
      </span>
    )}
  </div>
);
