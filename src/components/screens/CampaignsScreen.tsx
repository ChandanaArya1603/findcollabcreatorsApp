import React, { useState, useEffect } from "react";
import { campaignService } from "@/services/campaignService";
import { isDemoUser } from "@/lib/demo";
import { Screen } from "../findcollab/Screen";
import { Badge } from "../findcollab/Badge";
import { Card } from "../findcollab/Card";
import { Pill } from "../findcollab/Pill";
import { AppButton } from "../findcollab/AppButton";
import { Icon } from "../findcollab/Icon";

export interface Campaign {
  id: number;
  brand: string;
  title: string;
  type: string;
  budget: string;
  credits: number;
  cat: string;
  plat: string;
  desc: string;
  views: number;
  apps: number;
  days: string;
}

const DEMO_CAMPAIGNS: Campaign[] = [
  { id: 1, brand: "Roma Italian Deli", title: "Piadina Launch", type: "Barter", budget: "₹0", credits: 10, cat: "Food", plat: "Instagram", desc: "We're ROMA — launching something called Piadina. We'd love to collaborate with creators who enjoy discovering new food.", views: 20, apps: 0, days: "3 days ago" },
  { id: 2, brand: "Molorra Jewelry", title: "Molorra Jewelry Campaign", type: "Paid", budget: "₹40,000", credits: 30, cat: "Fashion", plat: "Instagram", desc: "Walk in Reel / Unboxing Reel. Female influencers need to walk into the showroom and create content showcasing our jewelry.", views: 88, apps: 1, days: "1 week ago" },
  { id: 3, brand: "Menveda", title: "Sunscreen Campaign", type: "Barter", budget: "₹1,000", credits: 10, cat: "Skincare", plat: "Instagram", desc: "Position MENVEDA Sunscreen as a 3-in-1 daily essential for men.", views: 45, apps: 13, days: "2 weeks ago" },
  { id: 4, brand: "Super7", title: "Super7 Health Campaign", type: "Barter", budget: "₹1,000", credits: 10, cat: "Health", plat: "Instagram", desc: "Our product is straightforward — no preservative, no additives.", views: 31, apps: 0, days: "3 weeks ago" },
];

interface Props {
  push: (screen: string, data?: any) => void;
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "Today";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? "s" : ""} ago`;
  return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? "s" : ""} ago`;
}

const CampaignsScreen: React.FC<Props> = ({ push }) => {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [campaigns, setCampaigns] = useState<Campaign[]>(DEMO_CAMPAIGNS);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (isDemoUser()) return;
    setLoading(true);
    campaignService.getCampaigns(1)
      .then((res) => {
        const results = res.result || res.campaigns || [];
        setTotalCount(res.Total_Record || results.length);
        setCampaigns(
          results.map((c: any) => ({
            id: c.id,
            brand: c.company_name || c.brand || "",
            title: c.project_title || c.title || "",
            type: c.campaign_type || c.type || "Barter",
            budget: c.budget || "₹0",
            credits: c.credits || 10,
            cat: c.category || c.cat || "",
            plat: c.platform || c.plat || "Instagram",
            desc: c.description || c.desc || "",
            views: c.campaignViews || c.views || 0,
            apps: c.applications || c.apps || 0,
            days: timeAgo(c.created_at || c.days || ""),
          }))
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filters = ["All", "Barter", "Paid", "Affiliate"];

  const filtered = campaigns.filter(
    (c) =>
      (filter === "All" || c.type === filter) &&
      (c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.brand.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Screen>
      <div className="sticky top-0 z-10 bg-card px-4 pt-3.5 pb-2.5 border-b border-border">
        <div className="flex justify-between items-center mb-2.5">
          <h2 className="text-lg font-black text-foreground">Find Campaigns</h2>
          <Badge color="pink">{totalCount || filtered.length} live</Badge>
        </div>
        <div className="relative mb-2.5">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Icon name="search" size={15} className="text-text-light" />
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaigns…"
            className="w-full py-2.5 pl-9 pr-3 rounded-xl border-[1.5px] border-border text-[13px] bg-background outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
          {filters.map((f) => (
            <Pill key={f} active={filter === f} onClick={() => setFilter(f)}>{f}</Pill>
          ))}
        </div>
      </div>

      <div className="px-4 pt-3.5 flex flex-col gap-3">
        {loading && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">Loading campaigns…</p>
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No campaigns found</p>
          </div>
        )}
        {!loading && filtered.map((c) => (
          <Card key={c.id} onClick={() => push("campaign-detail", c)} noPadding className="overflow-hidden">
            <div className="px-3.5 pt-3.5">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <p className="text-[10px] text-text-light mb-0.5">{c.days} • {c.views} views</p>
                  <p className="text-[15px] font-extrabold text-foreground leading-tight mb-0.5">{c.title}</p>
                  <p className="text-xs text-text-mid">{c.brand}</p>
                </div>
                <Badge color={c.type === "Paid" ? "green" : c.type === "Barter" ? "pink" : "blue"}>{c.type}</Badge>
              </div>
              <p className="text-xs text-text-mid mb-3 leading-relaxed">{c.desc.substring(0, 80)}…</p>
            </div>
            <div className="px-3.5 py-2.5 border-t border-border flex justify-between items-center bg-background">
              <div>
                <span className="text-[17px] font-black text-primary">{c.budget}</span>
                <span className="text-[10px] text-text-light ml-1.5">{c.credits} credits</span>
              </div>
              <AppButton className="!py-2 !px-4 !text-xs !rounded-[10px]">Apply →</AppButton>
            </div>
          </Card>
        ))}
      </div>
    </Screen>
  );
};

export default CampaignsScreen;
