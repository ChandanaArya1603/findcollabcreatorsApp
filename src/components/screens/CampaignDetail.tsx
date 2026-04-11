import React, { useState } from "react";
import { campaignService } from "@/services/campaignService";
import { isDemoUser } from "@/lib/demo";
import { BackHeader } from "../findcollab/BackHeader";
import { Badge } from "../findcollab/Badge";
import { Card } from "../findcollab/Card";
import { AppButton } from "../findcollab/AppButton";
import { Icon } from "../findcollab/Icon";
import { toast } from "sonner";
import type { Campaign } from "./CampaignsScreen";

interface Props {
  campaign: Campaign;
  onBack: () => void;
}

const CampaignDetail: React.FC<Props> = ({ campaign: c, onBack }) => {
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const handleApply = async () => {
    if (isDemoUser()) {
      toast.success("Demo mode — application simulated!");
      setApplied(true);
      return;
    }
    setApplying(true);
    try {
      await campaignService.applyCampaign(c.id);
      toast.success("Campaign applied successfully!");
      setApplied(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to apply");
    } finally {
      setApplying(false);
    }
  };

  const stats = [
    { icon: "eye" as const, label: "Views", value: String(c.views || 0) },
    { icon: "user" as const, label: "Applications", value: String(c.apps || 0) },
    { icon: "clock" as const, label: "Posted", value: c.days || "—" },
  ];

  const details = [
    { label: "Budget", value: c.budget || "—", accent: true },
    { label: "Credits Required", value: `${c.credits} credits` },
    { label: "Platform", value: c.plat || "—" },
    { label: "Category", value: c.cat || "—" },
    { label: "Campaign Type", value: c.type || "—" },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <BackHeader title="Campaign Detail" onBack={onBack} />

      <div className="flex-1 overflow-y-auto">
        {/* Hero section */}
        <div className="bg-card px-5 pt-5 pb-4 border-b border-border">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <Badge color={c.type === "Paid" ? "green" : c.type === "Affiliate" ? "blue" : "pink"}>
                  {c.type}
                </Badge>
              </div>
              <h1 className="text-xl font-black text-foreground leading-tight mb-1">{c.title}</h1>
              <p className="text-sm text-text-mid font-medium">{c.brand}</p>
            </div>
            <div className="shrink-0 w-12 h-12 rounded-2xl bg-primary-light flex items-center justify-center">
              <span className="text-lg font-black text-primary-dark">
                {(c.brand || "?").charAt(0).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex gap-2">
            {stats.map((s) => (
              <div
                key={s.label}
                className="flex-1 bg-background rounded-xl py-2.5 px-3 text-center"
              >
                <p className="text-[11px] text-text-light mb-0.5">{s.label}</p>
                <p className="text-sm font-bold text-foreground">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 flex flex-col gap-3">
          {/* Details card */}
          <Card>
            <p className="text-sm font-extrabold text-foreground mb-3">Campaign Details</p>
            <div className="flex flex-col gap-2.5">
              {details.map((d) => (
                <div
                  key={d.label}
                  className="flex items-center justify-between py-2 px-3 bg-background rounded-xl"
                >
                  <span className="text-xs text-text-light">{d.label}</span>
                  <span
                    className={
                      d.accent
                        ? "text-sm font-black text-primary"
                        : "text-sm font-bold text-foreground"
                    }
                  >
                    {d.value}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Description card */}
          <Card>
            <p className="text-sm font-extrabold text-foreground mb-2">About This Campaign</p>
            <p className="text-[13px] text-text-mid leading-relaxed whitespace-pre-line">
              {c.desc || "No description provided."}
            </p>
          </Card>

          {/* Credit warning */}
          <Card className="!bg-warning-light !border-warning/20">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-warning/15 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-base">⚡</span>
              </div>
              <div>
                <p className="text-xs text-warning font-bold mb-0.5">Credit Cost</p>
                <p className="text-[13px] text-foreground">
                  Applying to this campaign will use{" "}
                  <strong className="text-warning">{c.credits} credits</strong> from your balance.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Bottom spacer for sticky button */}
        <div className="h-24" />
      </div>

      {/* Sticky apply button */}
      <div className="shrink-0 px-4 py-3 bg-card border-t border-border">
        <AppButton
          full
          icon={applied ? "check" : "send"}
          onClick={handleApply}
          disabled={applying || applied}
        >
          {applied ? "Applied ✓" : applying ? "Applying…" : "Apply to Campaign"}
        </AppButton>
      </div>
    </div>
  );
};

export default CampaignDetail;
