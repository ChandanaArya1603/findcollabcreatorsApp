import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppInputProps {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  multiline?: boolean;
  type?: string;
  autoComplete?: string;
  disabled?: boolean;
  error?: boolean;
}

const base = "p-3 rounded-xl border-[1.5px] text-sm bg-card text-foreground outline-none focus:border-primary transition-colors";

/** Masked password input with an eye toggle. */
export const PasswordInput: React.FC<Omit<AppInputProps, "multiline" | "type">> = ({ value, onChange, placeholder, autoComplete, disabled, error }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        disabled={disabled}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(base, "w-full pr-11 disabled:opacity-50", error ? "border-destructive" : "border-border")}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-text-mid"
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
};

export const AppInput: React.FC<AppInputProps> = ({ label, value, onChange, placeholder, multiline, type, autoComplete, disabled, error }) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label className="text-[11px] font-bold text-text-mid uppercase tracking-wider">{label}</label>
    )}
    {multiline ? (
      <textarea
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(base, "resize-none border-border")}
      />
    ) : type === "password" ? (
      <PasswordInput value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete} disabled={disabled} error={error} />
    ) : (
      <input
        type={type}
        value={value}
        disabled={disabled}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(base, error ? "border-destructive" : "border-border")}
      />
    )}
  </div>
);
