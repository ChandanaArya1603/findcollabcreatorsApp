import React, { useState, useEffect } from "react";
import { campaignService } from "@/services/campaignService";
import { isDemoUser } from "@/lib/demo";
import { BackHeader } from "../findcollab/BackHeader";
import { Badge } from "../findcollab/Badge";
import { Card } from "../findcollab/Card";
import { Icon } from "../findcollab/Icon";

interface Props {
  onBack: () => void;
}

interface Campaign {
  brand: string;
  name: string;
  status: string;
  sc: "blue" | "green" | "amber" | "red";
  date: string;
  details: string;
  deliverables: string;
}

const DEMO_CAMPAIGNS: Campaign[] = [
  { brand: "Websites.co.in", name: "Brand Awareness Campaign", status: "Applied", sc: "blue", date: "25-08-19", details: "Promote brand visibility.", deliverables: "2 Reels, 1 Story" },
  { brand: "Findcollab", name: "Summer Slimming Challenge", status: "Offer Accepted", sc: "green", date: "20-05-25", details: "Health & fitness challenge.", deliverables: "3 Reels, 2 Posts" },
  { brand: "Findcollab", name: "VIVO MOBILE LAUNCH", status: "Shortlisted", sc: "amber", date: "01-06-25", details: "Product launch campaign.", deliverables: "1 Unboxing Reel" },
];

function statusColor(status: string): "blue" | "green" | "amber" | "red" {
  const s = status.toLowerCase();
  if (s.includes("accept") || s.includes("enlist")) return "green";
  if (s.includes("shortlist") || s.includes("pending")) return "amber";
  if (s.includes("reject")) return "red";
  return "blue";
}

const statusSteps: Record<string, string[]> = {
  Applied: ["Applied", "Under Review"],
  Shortlisted: ["Applied", "Under Review", "Shortlisted"],
  "Offer Accepted": ["Applied", "Under Review", "Shortlisted", "Offer Sent", "Offer Accepted"],
  Enlisted: ["Applied", "Under Review", "Shortlisted", "Enlisted"],
  Rejected: ["Applied", "Under Review", "Rejected"],
};

const MyCampaignsScreen: React.FC<Props> = ({ onBack }) => {
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>(DEMO_CAMPAIGNS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isDemoUser()) return;
    setLoading(true);
    campaignService.getMyCampaigns()
      .then((res) => {
        const list = res.campaigns || res.result || [];
        if (list.length > 0) {
          setCampaigns(
            list.map((c: any) => ({
              brand: c.company_name || c.brand || "",
              name: c.project_title || c.name || "",
              status: c.status || "Applied",
              sc: statusColor(c.status || "Applied"),
              date: c.dateInvited || c.created_at || "",
              details: c.description || "",
              deliverables: c.deliverables || "",
            }))
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (selected) {
    const steps = statusSteps[selected.status] || [selected.status];
    return (
      <div className="flex-1 overflow-y-auto bg-background pb-5">
        <BackHeader title="Campaign Status" onBack={() => setSelected(null)} />
        <div className="p-4 flex flex-col gap-3.5">
          <Card>
            <p className="text-[11px] text-text-light mb-0.5">{selected.brand}</p>
            <p className="text-base font-black text-foreground mb-1">{selected.name}</p>
            <Badge color={selected.sc}>{selected.status}</Badge>
            {selected.details && <p className="text-xs text-text-mid mt-3 leading-relaxed">{selected.details}</p>}
          </Card>
          <Card>
            <p className="text-sm font-extrabold text-foreground mb-3">Application Timeline</p>
            <div className="flex flex-col gap-0">
              {steps.map((step, i) => {
                const isLast = i === steps.length - 1;
                const isRejected = step === "Rejected";
                return (
                  <div key={step} className="flex gap-3 items-stretch">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full shrink-0 ${isRejected ? "bg-destructive" : isLast ? "bg-primary" : "bg-success"}`} />
                      {i < steps.length - 1 && <div className="w-0.5 flex-1 bg-border min-h-[28px]" />}
                    </div>
                    <div className="pb-4">
                      <p className={`text-[13px] font-bold ${isRejected ? "text-destructive" : isLast ? "text-primary" : "text-foreground"}`}>{step}</p>
                      <p className="text-[10px] text-text-light mt-0.5">{selected.date}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
          {selected.deliverables && (
            <Card>
              <p className="text-sm font-extrabold text-foreground mb-2">Deliverables</p>
              <div className="py-2.5 px-3 bg-primary-light rounded-[10px]">
                <p className="text-[13px] text-primary font-semibold">📱 {selected.deliverables}</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background pb-5">
      <BackHeader title="My Campaigns" onBack={onBack} />
      <div className="px-4 pt-3.5 flex flex-col gap-2.5">
        {loading && <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>}
        {!loading && campaigns.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No campaigns yet</p>}
        {!loading && campaigns.map((c, i) => (
          <Card key={i} className="!p-3.5 cursor-pointer" onClick={() => setSelected(c)}>
            <div className="flex justify-between items-start">
              <div className="flex-1 mr-2">
                <p className="text-[11px] text-text-light mb-0.5">{c.brand}</p>
                <p className="text-sm font-bold text-foreground leading-tight mb-1.5">{c.name}</p>
                <p className="text-[10px] text-text-light">{c.date}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge color={c.sc}>{c.status}</Badge>
                <Icon name="chevR" size={14} className="text-text-light" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MyCampaignsScreen;
