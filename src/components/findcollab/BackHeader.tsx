import React from "react";
import { Icon } from "./Icon";

interface BackHeaderProps {
  title: string;
  onBack: () => void;
  right?: React.ReactNode;
}

export const BackHeader: React.FC<BackHeaderProps> = ({ title, onBack, right }) => (
  <div className="flex items-center justify-between px-4 py-3.5 bg-card border-b border-border sticky top-0 z-10 shrink-0">
    <button
      onClick={onBack}
      className="w-9 h-9 rounded-[10px] bg-muted border-none flex items-center justify-center cursor-pointer"
    >
      <Icon name="chevL" size={18} className="text-foreground" />
    </button>
    <p className="text-base font-extrabold text-foreground">{title}</p>
    <div className="w-9">{right}</div>
  </div>
);
