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

export interface AppButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: Variant;
  icon?: string;
  full?: boolean;
  className?: string;
  disabled?: boolean;
  /** Shows a spinner in place of the label. */
  loading?: boolean;
}

export const AppButton: React.FC<AppButtonProps> = ({
  children, onClick, variant = "primary", icon, full, className, disabled, loading,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    className={cn(
      "flex items-center justify-center gap-1.5 px-5 py-3 rounded-[14px] border-none text-sm font-extrabold tracking-wide transition-all duration-300 active:opacity-80 cursor-pointer",
      variantStyles[variant],
      full && "w-full",
      loading && "rounded-[22px]",
      className
    )}
  >
    {loading ? (
      <span className="w-5 h-5 rounded-full border-[2.5px] border-current border-t-transparent animate-spin" aria-label="Loading" />
    ) : (
      <>
        {icon && <Icon name={icon} size={15} />}
        {children}
      </>
    )}
  </button>
);
