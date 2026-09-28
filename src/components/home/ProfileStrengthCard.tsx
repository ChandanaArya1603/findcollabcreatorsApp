import React from "react";
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
  if (!ready || percent >= 100) return null;
  const firstOpen = STEP_KEYS.find((k) => !steps[k]) ?? "basic";
  const r = 26;
  const c = 2 * Math.PI * r;

  return (
    <div className="px-4 pt-3">
      <Card className="!p-4">
        <div className="flex gap-3 items-center mb-3">
          <div className="relative w-16 h-16 shrink-0">
            <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
              <circle cx="32" cy="32" r={r} strokeWidth="6" fill="none" className="stroke-muted" />
              <circle cx="32" cy="32" r={r} strokeWidth="6" fill="none" strokeLinecap="round"
                className="stroke-primary transition-all" strokeDasharray={c} strokeDashoffset={c * (1 - percent / 100)} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-foreground">{percent}%</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-foreground">Profile strength</p>
            <p className="text-[11px] text-text-mid leading-snug mb-2">
              Finish to earn +{rewardCredits} credits instantly, and rank higher in brand searches
            </p>
            <button onClick={() => onOpenStep(firstOpen)} className="text-xs font-bold text-primary">Finish profile →</button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
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
      </Card>
    </div>
  );
};

export default ProfileStrengthCard;
