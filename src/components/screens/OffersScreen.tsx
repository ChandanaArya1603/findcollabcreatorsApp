import React from "react";
import { BackHeader } from "../findcollab/BackHeader";
import { Badge } from "../findcollab/Badge";
import { Card } from "../findcollab/Card";
import { Icon } from "../findcollab/Icon";

export interface Offer {
  id: number;
  name: string;
  brand: string;
  budget: string;
  status: string;
  sc: "green" | "amber" | "blue" | "red";
  due: string;
}

const offers: Offer[] = [
  { id: 1, name: "Summer Slimming Challenge", brand: "Findcollab", budget: "₹1,000", status: "Payment Released", sc: "green", due: "29 Jun 2025" },
  { id: 2, name: "Healthy Living with Moringa", brand: "Findcollab", budget: "₹5,000", status: "Payment Released", sc: "green", due: "14 Jun 2025" },
  { id: 3, name: "Sip & Trust: Blue Tea", brand: "Findcollab", budget: "₹2,000", status: "Pending", sc: "amber", due: "1 Aug 2025" },
  { id: 4, name: "Holiday Hair Revival", brand: "Findcollab", budget: "₹3,500", status: "Pending", sc: "amber", due: "15 Aug 2025" },
];

interface Props {
  push: (screen: string, data?: any) => void;
}

const OffersScreen: React.FC<Props> = ({ push }) => (
  <div className="flex-1 overflow-y-auto bg-background pb-5">
    <BackHeader title="My Offers" onBack={() => push("profile")} />
    <div className="px-4 pt-3.5 flex flex-col gap-2.5">
      {offers.map((o) => (
        <Card key={o.id} onClick={() => push("offer-detail", o)} className="!p-3.5">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1 mr-2">
              <p className="text-sm font-extrabold text-foreground leading-tight mb-0.5">{o.name}</p>
              <p className="text-xs text-text-mid">{o.brand}</p>
            </div>
            <Badge color={o.sc}>{o.status}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <span className="text-base font-black text-primary">{o.budget}</span>
              <span className="text-[11px] text-text-light ml-2">Due {o.due}</span>
            </div>
            <Icon name="chevR" size={16} className="text-text-light" />
          </div>
        </Card>
      ))}
    </div>
  </div>
);

export default OffersScreen;
