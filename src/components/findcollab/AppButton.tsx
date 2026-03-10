import React from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

type Variant = "primary" | "outline" | "ghost" | "dark";

const variantStyles: Record<Variant, string> = {
  primary: "gradient-primary text-primary-foreground shadow-primary",
  outline: "bg-transparent text-primary border-2 border-primary",
  ghost: "bg-primary-light text-primary",
  dark: "bg-surface-dark text-primary-foreground",
};

interface AppButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: Variant;
  icon?: string;
  full?: boolean;
  className?: string;
}

export const AppButton: React.FC<AppButtonProps> = ({
  children, onClick, variant = "primary", icon, full, className,
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center justify-center gap-1.5 px-5 py-3 rounded-[14px] border-none text-sm font-extrabold tracking-wide transition-opacity active:opacity-80 cursor-pointer",
      variantStyles[variant],
      full && "w-full",
      className
    )}
  >
    {icon && <Icon name={icon} size={15} />}
    {children}
  </button>
);
