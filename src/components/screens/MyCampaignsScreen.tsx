import React from "react";
import { BackHeader } from "../findcollab/BackHeader";
import { Badge } from "../findcollab/Badge";
import { Card } from "../findcollab/Card";

interface Props {
  onBack: () => void;
}

const campaigns = [
  { brand: "Websites.co.in", name: "Brand Awareness Campaign", status: "Applied", sc: "blue" as const, date: "25-08-19" },
  { brand: "Findcollab", name: "Summer Slimming Challenge", status: "Offer Accepted", sc: "green" as const, date: "20-05-25" },
  { brand: "Findcollab", name: "Healthy Living with Moringa", status: "Offer Accepted", sc: "green" as const, date: "15-05-25" },
  { brand: "Findcollab", name: "VIVO MOBILE LAUNCH", status: "Shortlisted", sc: "amber" as const, date: "01-06-25" },
  { brand: "Randomsbymesocial", name: "Taste of Home", status: "Rejected", sc: "red" as const, date: "15-04-25" },
  { brand: "Nike", name: "Mark of Saint Jean Review", status: "Enlisted", sc: "blue" as const, date: "10-07-25" },
];

const MyCampaignsScreen: React.FC<Props> = ({ onBack }) => (
  <div className="flex-1 overflow-y-auto bg-background pb-5">
    <BackHeader title="My Campaigns" onBack={onBack} />
    <div className="px-4 pt-3.5 flex flex-col gap-2.5">
      {campaigns.map((c, i) => (
        <Card key={i} className="!p-3.5">
          <div className="flex justify-between items-start">
            <div className="flex-1 mr-2">
              <p className="text-[11px] text-text-light mb-0.5">{c.brand}</p>
              <p className="text-sm font-bold text-foreground leading-tight mb-1.5">{c.name}</p>
              <p className="text-[10px] text-text-light">{c.date}</p>
            </div>
            <Badge color={c.sc}>{c.status}</Badge>
          </div>
        </Card>
      ))}
    </div>
  </div>
);

export default MyCampaignsScreen;
