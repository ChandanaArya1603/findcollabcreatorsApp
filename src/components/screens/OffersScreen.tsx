import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
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

interface Props {
  push: (screen: string, data?: any) => void;
}

function statusColor(status: string): "green" | "amber" | "blue" | "red" {
  const s = (status || "").toLowerCase();
  if (s.includes("payment") || s.includes("released") || s.includes("complete")) return "green";
  if (s.includes("reject") || s.includes("cancel")) return "red";
  if (s.includes("pending") || s.includes("review")) return "amber";
  return "blue";
}

function formatBudget(c: any): string {
  if (c.campaign_type === "barter") return "Barter";
  if (c.fixed_value) return `₹${Number(c.fixed_value).toLocaleString()}`;
  if (c.budget_min) return `₹${Number(c.budget_min).toLocaleString()}`;
  if (c.budget) return c.budget;
  return "—";
}

const OffersScreen: React.FC<Props> = ({ push }) => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Offers come from my_campaigns with offer/invited status
    api.get("/my_campaigns")
      .then((res: any) => {
        const list = res.campaigns || res.result || [];
        // Filter for campaigns where brand made an offer (invited/offer sent)
        const offerList = list
          .filter((c: any) => {
            const s = (c.status || "").toLowerCase();
            return (
              s.includes("offer") ||
              s.includes("invited") ||
              s.includes("enlisted") ||
              s.includes("payment") ||
              s.includes("complete")
            );
          })
          .map((c: any) => ({
            id: c.id,
            name: c.project_title || c.name || "",
            brand: c.company_name || c.brand || "",
            budget: formatBudget(c),
            status: c.status || "Pending",
            sc: statusColor(c.status),
            due: c.end_date
              ? new Date(c.end_date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "",
          }));
        setOffers(offerList);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex-1 overflow-y-auto bg-background pb-5">
      <BackHeader title="My Offers" onBack={() => push("profile")} />
      <div className="px-4 pt-3.5 flex flex-col gap-2.5">
        {loading && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Loading offers…
          </p>
        )}

        {!loading && offers.length === 0 && (
          <div className="text-center py-10">
            <div className="w-16 h-16 rounded-2xl bg-primary-light flex items-center justify-center mx-auto mb-3">
              <Icon name="offer" size={28} className="text-primary" />
            </div>
            <p className="text-sm font-bold text-foreground mb-1">No offers yet</p>
            <p className="text-xs text-muted-foreground">
              When brands invite you to campaigns, they'll appear here
            </p>
          </div>
        )}

        {!loading && offers.map((o) => (
          <Card
            key={o.id}
            onClick={() => push("offer-detail", o)}
            className="!p-3.5"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 mr-2">
                <p className="text-sm font-extrabold text-foreground leading-tight mb-0.5">
                  {o.name}
                </p>
                <p className="text-xs text-text-mid">{o.brand}</p>
              </div>
              <Badge color={o.sc}>{o.status}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <span className="text-base font-black text-primary">{o.budget}</span>
                {o.due && (
                  <span className="text-[11px] text-text-light ml-2">
                    Due {o.due}
                  </span>
                )}
              </div>
              <Icon name="chevR" size={16} className="text-text-light" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default OffersScreen;
