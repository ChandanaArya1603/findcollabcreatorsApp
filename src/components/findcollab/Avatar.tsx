import React from "react";

interface AvatarProps {
  letter: string;
  size?: number;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ letter, size = 40, className = "" }) => (
  <div
    className={`bg-primary flex items-center justify-center shrink-0 ${className}`}
    style={{ width: size, height: size, borderRadius: size * 0.3 }}
  >
    <span className="text-primary-foreground font-black" style={{ fontSize: size * 0.375 }}>
      {letter}
    </span>
  </div>
);
