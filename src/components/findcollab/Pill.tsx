import React from "react";
import { cn } from "@/lib/utils";

interface PillProps {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export const Pill: React.FC<PillProps> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={cn(
      "px-4 py-2 rounded-full border-none text-xs font-bold whitespace-nowrap transition-all cursor-pointer",
      active
        ? "bg-primary text-primary-foreground shadow-primary"
        : "bg-card text-text-mid shadow-sm"
    )}
  >
    {children}
  </button>
);
