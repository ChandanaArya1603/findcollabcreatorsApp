import React, { useEffect, useState } from "react";

const KEY = "fc_profile_strength_collapsed";
import { useProfileCompletion, STEP_KEYS, type StepKey } from "@/hooks/useProfileCompletion";
import { Card } from "../findcollab/Card";
import { Icon } from "../findcollab/Icon";

const LABELS: Record<StepKey, string> = {
  basic: "Basic information",
  photo: "Profile photo",
  social: "Social accounts",
  commercials: "Add your commercials",
  projects: "Add past projects",
};

interface Props { onOpenStep: (step: StepKey) => void }

const ProfileStrengthCard: React.FC<Props> = ({ onOpenStep }) => {
  const { steps, percent, ready, rewardCredits } = useProfileCompletion();
  const [open, setOpen] = useState<boolean | null>(() => {
    const v = localStorage.getItem(KEY);
    return v === null ? null : v !== "1";
  });
  useEffect(() => { if (open === null && ready) setOpen(percent < 60); }, [open, ready, percent]);
  const toggle = () => setOpen((v) => { const next = !v; localStorage.setItem(KEY, next ? "0" : "1"); return next; });
  if (!ready || percent >= 100) return null;
  const firstOpen = STEP_KEYS.find((k) => !steps[k]) ?? "basic";
  const r = 26;
  const c = 2 * Math.PI * r;

  return (
    <div className="px-0">
      <Card className={open ? "!p-4" : "!py-2.5 !px-3"}>
        <div className="flex gap-3 items-center">
          <div className={`relative shrink-0 ${open ? "w-16 h-16" : "w-11 h-11"}`}>
            <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
              <circle cx="32" cy="32" r={r} strokeWidth="6" fill="none" className="stroke-muted" />
              <circle cx="32" cy="32" r={r} strokeWidth="6" fill="none" strokeLinecap="round"
                className="stroke-primary transition-all" strokeDasharray={c} strokeDashoffset={c * (1 - percent / 100)} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-foreground">{percent}%</span>
          </div>
          <div className="flex-1 min-w-0">
            <button
              onClick={toggle}
              aria-expanded={open}
              aria-label={open ? "Collapse profile strength" : "Expand profile strength"}
              className="w-full flex items-center justify-between gap-2 bg-transparent border-none cursor-pointer p-0 text-left"
            >
              <span className="text-sm font-black text-foreground">Profile strength</span>
              <span className={`text-text-light transition-transform ${open ? "rotate-180" : ""}`}>
                <Icon name="chevD" size={16} />
              </span>
            </button>
            {open && (
              <>
                <p className="text-[11px] text-text-mid leading-snug mb-2 mt-1">
                  Finish to earn +{rewardCredits} credits instantly, and rank higher in brand searches
                </p>
                <button onClick={() => onOpenStep(firstOpen)} className="text-xs font-bold text-primary">Finish profile →</button>
              </>
            )}
          </div>
        </div>
        {open && (
          <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-border">
            {STEP_KEYS.map((k) => (
              <div key={k} className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${steps[k] ? "bg-primary" : "border-[1.5px] border-border"}`}>
                  {steps[k] && <Icon name="check" size={12} className="text-primary-foreground" />}
                </span>
                <span className={`flex-1 text-xs font-semibold ${steps[k] ? "text-text-mid" : "text-foreground"}`}>{LABELS[k]}</span>
                {!steps[k] && (
                  <button onClick={() => onOpenStep(k)} className="text-[11px] font-bold text-primary">Add →</button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ProfileStrengthCard;
