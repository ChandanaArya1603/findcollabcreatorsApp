import React, { useState } from "react";
import { campaignService } from "@/services/campaignService";
import { isDemoUser } from "@/lib/demo";
import { BackHeader } from "../findcollab/BackHeader";
import { Badge } from "../findcollab/Badge";
import { Card } from "../findcollab/Card";
import { AppButton } from "../findcollab/AppButton";
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

  return (
    <div className="flex-1 overflow-y-auto bg-background pb-5">
      <BackHeader title="Campaign Detail" onBack={onBack} />
      <div className="p-4 flex flex-col gap-3.5">
        <Card>
          <Badge color={c.type === "Paid" ? "green" : "pink"}>{c.type}</Badge>
          <p className="text-lg font-black text-foreground mt-2 mb-1">{c.title}</p>
          <p className="text-[13px] text-text-mid mb-3.5">{c.brand}</p>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { l: "Budget", v: c.budget },
              { l: "Credits", v: `${c.credits} credits` },
              { l: "Platform", v: c.plat },
              { l: "Category", v: c.cat },
            ].map((i) => (
              <div key={i.l} className="bg-background rounded-[10px] py-2.5 px-3">
                <p className="text-[10px] text-text-light uppercase tracking-wider mb-0.5">{i.l}</p>
                <p className="text-sm font-extrabold text-foreground">{i.v}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <p className="text-sm font-extrabold text-foreground mb-2">About This Campaign</p>
          <p className="text-[13px] text-text-mid leading-relaxed">{c.desc}</p>
        </Card>
        <Card className="!bg-warning/5 !border-warning/20">
          <p className="text-xs text-warning font-bold mb-1">⚡ Credit Cost</p>
          <p className="text-[13px] text-foreground">
            Applying costs <strong>{c.credits} credits</strong>.
          </p>
        </Card>
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
