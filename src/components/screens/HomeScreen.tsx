import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { dashboardService } from "@/services/dashboardService";
import { isDemoUser } from "@/lib/demo";
import { Screen } from "../findcollab/Screen";
import { Avatar } from "../findcollab/Avatar";
import { Badge } from "../findcollab/Badge";
import { Card } from "../findcollab/Card";
import { AppButton } from "../findcollab/AppButton";
import { Icon } from "../findcollab/Icon";

interface HomeScreenProps {
  push: (screen: string, data?: any) => void;
  switchTab?: (tab: string) => void;
}

const DEMO_STATS = {
  credits: "10",
  wallet: "₹6K",
  applied: "10",
  startups: "722",
  creditsSub: "20 earned",
  walletSub: "Ready to withdraw",
  appliedSub: "4 offers received",
  startupsSub: "Available to pitch",
  profileViews: { total: 1250, directPercentage: 64 },
};

const HomeScreen: React.FC<HomeScreenProps> = ({ push, switchTab }) => {
  const { user } = useAuth();
  const [dashStats, setDashStats] = useState<any>(isDemoUser() ? null : undefined);
  const [loading, setLoading] = useState(!isDemoUser());

  useEffect(() => {
    if (isDemoUser()) return;
    setLoading(true);
    dashboardService.getStats()
      .then((res) => setDashStats(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "GOOD MORNING 👋";
    if (h < 17) return "GOOD AFTERNOON 👋";
    return "GOOD EVENING 👋";
  };

  const displayName = user?.fname || "User";
  const initial = displayName.charAt(0).toUpperCase();

  const stats = dashStats
    ? [
        { l: "Credits", v: String(dashStats.credits ?? "0"), sub: `${dashStats.creditsEarned ?? 0} earned`, ic: "wallet", c: "text-primary" },
        { l: "Wallet", v: `₹${dashStats.wallet_balance ?? 0}`, sub: "Ready to withdraw", ic: "rupee", c: "text-success" },
        { l: "Applied", v: String(dashStats.campaignsApplied ?? 0), sub: `${dashStats.campaignsInvited ?? 0} offers received`, ic: "campaign", c: "text-info" },
        { l: "Startups", v: String(dashStats.startups ?? 0), sub: "Available to pitch", ic: "startup", c: "text-warning" },
      ]
    : [
        { l: "Credits", v: DEMO_STATS.credits, sub: DEMO_STATS.creditsSub, ic: "wallet", c: "text-primary" },
        { l: "Wallet", v: DEMO_STATS.wallet, sub: DEMO_STATS.walletSub, ic: "rupee", c: "text-success" },
        { l: "Applied", v: DEMO_STATS.applied, sub: DEMO_STATS.appliedSub, ic: "campaign", c: "text-info" },
        { l: "Startups", v: DEMO_STATS.startups, sub: DEMO_STATS.startupsSub, ic: "startup", c: "text-warning" },
      ];

  const profileViews = dashStats?.profileViews ?? DEMO_STATS.profileViews;

  const bars = [140, 180, 200, 165, 210, 190, 220, 195, 240, 260, 230, 290];
  const mx = Math.max(...bars);
  const months = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

  const actions = [
    { id: "campaigns", l: "Search", ic: "search" },
    { id: "mycampaigns", l: "Campaigns", ic: "campaign" },
    { id: "offers", l: "Offers", ic: "offer" },
    { id: "startups", l: "Startups", ic: "startup" },
    { id: "wallet", l: "Wallet", ic: "wallet" },
  ];

  return (
    <Screen>
      <div className="px-4 pt-4 pb-3 bg-card">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-[11px] text-primary font-bold tracking-widest mb-0.5">{greeting()}</p>
            <h1 className="text-xl font-black text-foreground">{displayName}</h1>
          </div>
          <div className="flex gap-2 items-center">
            <div className="relative">
              <div className="w-[38px] h-[38px] rounded-xl bg-primary-light flex items-center justify-center">
                <Icon name="bell" size={17} className="text-primary" />
              </div>
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-primary border-2 border-card flex items-center justify-center">
                <span className="text-[8px] font-black text-primary-foreground">3</span>
              </div>
            </div>
            <Avatar letter={initial} size={38} />
          </div>
        </div>
      </div>

      <div className="px-4 pt-3.5 flex flex-col gap-4">
        {/* Hero */}
        <div className="bg-card rounded-[20px] p-5 relative overflow-hidden border border-border shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          <div className="absolute -right-[30px] -top-[30px] w-[120px] h-[120px] rounded-full bg-primary/10" />
          <div className="absolute right-5 -bottom-10 w-[90px] h-[90px] rounded-full bg-primary/5" />
          <Badge color="pink" sm>INFLUENCER</Badge>
          <p className="text-foreground text-[22px] font-black mt-2 mb-1 leading-tight">
            Welcome back,<br />{displayName} 🚀
          </p>
          <p className="text-muted-foreground text-xs mb-3.5">Your dashboard overview</p>
          <div className="flex gap-2">
            <AppButton className="!py-2.5 !px-4 !text-xs !rounded-[10px]" onClick={() => switchTab ? switchTab("campaigns") : push("campaigns")}>Find Campaigns</AppButton>
            <AppButton variant="ghost" className="!py-2.5 !px-4 !text-xs !rounded-[10px]" onClick={() => push("mediakit")}>Media Kit</AppButton>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {stats.map((s) => (
            <Card key={s.l} className="!p-3.5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] text-text-light uppercase tracking-wider mb-1">{s.l}</p>
                  <p className={`text-[22px] font-black leading-none mb-0.5 ${s.c}`}>{s.v}</p>
                  <p className="text-[10px] text-text-light">{s.sub}</p>
                </div>
                <div className="w-8 h-8 rounded-[10px] bg-muted flex items-center justify-center">
                  <Icon name={s.ic} size={15} className={s.c} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <p className="text-[15px] font-black text-foreground">Quick Actions</p>
        <div className="grid grid-cols-5 gap-2">
          {actions.map((a) => (
            <button
              key={a.id}
              onClick={() => ["wallet", "campaigns"].includes(a.id) && switchTab ? switchTab(a.id) : push(a.id)}
              className="bg-card border border-border rounded-[14px] py-3 px-2 flex flex-col items-center gap-1.5 cursor-pointer"
            >
              <div className="w-[38px] h-[38px] rounded-xl bg-primary-light flex items-center justify-center">
                <Icon name={a.ic} size={18} className="text-primary" />
              </div>
              <span className="text-[10px] font-bold text-text-mid">{a.l}</span>
            </button>
          ))}
        </div>

        {/* Chart */}
        <Card>
          <div className="flex justify-between items-center mb-3.5">
            <div>
              <p className="text-sm font-extrabold text-foreground">Profile Views</p>
              <p className="text-[11px] text-text-light mt-0.5">{profileViews.total?.toLocaleString() ?? "—"} total</p>
            </div>
            <Badge color="green">↑ {profileViews.directPercentage ?? 0}% direct</Badge>
          </div>
          <div className="h-[90px] flex items-end gap-[3px]">
            {bars.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <div
                  className={`w-full rounded-t ${i === 11 ? "bg-primary" : "bg-primary/20"}`}
                  style={{ height: `${(v / mx) * 78}px` }}
                />
                <span className="text-[7px] text-text-light">{months[i]}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Referral */}
        <Card className="!bg-gradient-to-br from-primary-light to-card !border-primary-mid">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="gift" size={16} className="text-primary" />
            <p className="text-[13px] font-extrabold text-foreground">Refer & Earn</p>
            <Badge color="pink" sm>+50 credits</Badge>
          </div>
          <p className="text-[11px] text-text-mid mb-2.5">Share your code and earn credits for every signup</p>
          <div className="flex gap-2 items-center">
            <div className="flex-1 bg-card rounded-[10px] py-2 px-3 border-[1.5px] border-dashed border-primary-mid">
              <p className="text-lg font-black text-primary text-center tracking-[3px]">
                {user?.fname?.substring(0, 3).toUpperCase() ?? "REF"}635
              </p>
            </div>
            <AppButton variant="ghost" icon="copy" className="!py-2.5 !px-3.5 !rounded-[10px] !text-xs">Copy</AppButton>
          </div>
        </Card>
      </div>
    </Screen>
  );
};

export default HomeScreen;
