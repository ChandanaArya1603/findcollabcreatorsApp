import React from "react";
import { cn } from "@/lib/utils";

type BadgeColor = "pink" | "green" | "amber" | "blue" | "red" | "gray";

const colorMap: Record<BadgeColor, string> = {
  pink: "bg-primary-light text-primary-dark",
  green: "bg-success-light text-emerald-800",
  amber: "bg-warning-light text-amber-800",
  blue: "bg-info-light text-blue-800",
  red: "bg-red-100 text-red-800",
  gray: "bg-muted text-text-mid",
};

interface BadgeProps {
  color?: BadgeColor;
  sm?: boolean;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ color = "pink", sm, children }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full font-bold whitespace-nowrap",
      sm ? "px-[7px] py-[2px] text-[9px]" : "px-[9px] py-[3px] text-[10px]",
      colorMap[color]
    )}
  >
    {children}
  </span>
);
