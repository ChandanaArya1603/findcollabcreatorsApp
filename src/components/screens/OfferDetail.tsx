import React, { useState } from "react";
import { BackHeader } from "../findcollab/BackHeader";
import { Badge } from "../findcollab/Badge";
import { Card } from "../findcollab/Card";
import { AppButton } from "../findcollab/AppButton";
import { AppInput } from "../findcollab/AppInput";
import type { Offer } from "./OffersScreen";

interface Props {
  offer: Offer;
  onBack: () => void;
}

const OfferDetail: React.FC<Props> = ({ offer: o, onBack }) => {
  const [link, setLink] = useState("");

  return (
    <div className="flex-1 overflow-y-auto bg-background pb-5">
      <BackHeader title="Offer Detail" onBack={onBack} />
      <div className="p-4 flex flex-col gap-3.5">
        <Card>
          <p className="text-base font-black text-foreground mb-1">{o.name}</p>
          <p className="text-xs text-text-mid mb-3.5">{o.brand}</p>
          <div className="grid grid-cols-2 gap-2.5">
            {[{ l: "Budget", v: o.budget }, { l: "Due Date", v: o.due }].map((i) => (
              <div key={i.l} className="bg-background rounded-[10px] py-2.5 px-3">
                <p className="text-[10px] text-text-light uppercase tracking-wider mb-0.5">{i.l}</p>
                <p className="text-[15px] font-extrabold text-foreground">{i.v}</p>
              </div>
            ))}
          </div>
          <div className="mt-2.5 py-2.5 px-3 bg-background rounded-[10px]">
            <p className="text-[10px] text-text-light uppercase tracking-wider mb-1">Payment Status</p>
            <Badge color={o.sc}>{o.status}</Badge>
          </div>
        </Card>

        <Card>
          <p className="text-sm font-extrabold text-foreground mb-2.5">Deliverables</p>
          <div className="py-2.5 px-3 bg-primary-light rounded-[10px]">
            <p className="text-[13px] text-primary font-semibold">📱 Instagram – 2 Reel, 3 Static Post</p>
          </div>
        </Card>

        {o.sc === "green" && (
          <Card className="!bg-success/5 !border-success/20">
            <p className="text-[13px] font-extrabold text-success mb-2">✅ Live Performance</p>
            <p className="text-[11px] text-primary mb-2">🔗 instagram.com/reel/DFU4nHJSnaw/</p>
            <div className="grid grid-cols-3 gap-2">
              {[["Views", "10.4K"], ["Likes", "197"], ["Comments", "11"]].map(([l, v]) => (
                <div key={l} className="text-center">
                  <p className="text-base font-black text-foreground">{v}</p>
                  <p className="text-[10px] text-text-light mt-0.5">{l}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card>
          <p className="text-sm font-extrabold text-foreground mb-3">Submit Content Link</p>
          <AppInput label="Deliverable URL" value={link} onChange={setLink} placeholder="https://instagram.com/reel/…" />
          <AppButton full icon="send" className="mt-3">Submit Deliverable</AppButton>
        </Card>
      </div>
    </div>
  );
};

export default OfferDetail;
