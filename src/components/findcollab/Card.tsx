import React from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, onClick, noPadding }) => (
  <div
    onClick={onClick}
    className={cn(
      "bg-card rounded-[18px] border border-border shadow-sm transition-transform",
      onClick && "cursor-pointer active:scale-[0.98]",
      !noPadding && "p-4",
      className
    )}
  >
    {children}
  </div>
);
