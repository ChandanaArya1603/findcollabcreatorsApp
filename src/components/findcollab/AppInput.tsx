import React from "react";

interface AppInputProps {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  multiline?: boolean;
}

export const AppInput: React.FC<AppInputProps> = ({ label, value, onChange, placeholder, multiline }) => (
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
        className="p-3 rounded-xl border-[1.5px] border-border text-sm bg-card text-foreground outline-none resize-none focus:border-primary transition-colors"
      />
    ) : (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="p-3 rounded-xl border-[1.5px] border-border text-sm bg-card text-foreground outline-none focus:border-primary transition-colors"
      />
    )}
  </div>
);
