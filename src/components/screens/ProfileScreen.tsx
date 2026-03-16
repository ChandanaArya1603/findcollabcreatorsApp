import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Screen } from "../findcollab/Screen";
import { Badge } from "../findcollab/Badge";
import { Card } from "../findcollab/Card";
import { AppButton } from "../findcollab/AppButton";
import { Icon } from "../findcollab/Icon";

interface Props {
  push: (screen: string, data?: any) => void;
}

const menu = [
  { label: "Media Kit", ic: "mediakit", id: "mediakit", badge: "" },
  { label: "My Campaigns", ic: "campaign", id: "mycampaigns", badge: "10" },
  { label: "My Offers", ic: "offer", id: "offers", badge: "4" },
  { label: "Messages", ic: "msg", id: "messages", badge: "2" },
  { label: "Discover Startups", ic: "startup", id: "startups", badge: "722" },
];

const ProfileScreen: React.FC<Props> = ({ push }) => {
  const { logout } = useAuth();
  return (
  <Screen>
    <div className="bg-card border-b border-border">
      <div className="h-20 gradient-hero" />
      <div className="px-4 pb-5">
        <div className="flex justify-between items-end mb-3">
          <div className="w-[72px] h-[72px] rounded-[22px] bg-primary border-4 border-card -mt-9 flex items-center justify-center">
            <span className="text-primary-foreground text-[28px] font-black">D</span>
          </div>
          <AppButton variant="ghost" icon="edit" className="!py-2 !px-3.5 !text-xs !rounded-[10px]" onClick={() => push("editprofile")}>Edit</AppButton>
        </div>
        <p className="text-[19px] font-black text-foreground mb-0.5">Dilraj Singh</p>
        <p className="text-xs text-text-light mb-2">India's Biggest Science & Experiment Creator • 📍 Chennai</p>
        <div className="flex gap-1.5 flex-wrap">
          {["Food", "Fitness", "Science & Tech", "Movies"].map((t) => (
            <Badge key={t} color="pink" sm>{t}</Badge>
          ))}
        </div>
      </div>
      <div className="flex border-t border-border">
        {[
          { ic: "insta", l: "Instagram", v: "6.1M", c: "text-pink-600" },
          { ic: "yt", l: "YouTube", v: "32.7M", c: "text-red-600" },
        ].map((s, i) => (
          <div key={i} className={`flex-1 py-3 px-4 text-center ${i === 0 ? "border-r border-border" : ""}`}>
            <div className="flex justify-center mb-1">
              <Icon name={s.ic} size={18} className={s.c} />
            </div>
            <p className="text-lg font-black text-foreground">{s.v}</p>
            <p className="text-[10px] text-text-light mt-0.5">{s.l}</p>
          </div>
        ))}
      </div>
    </div>

    <div className="px-4 pt-3.5">
      <p className="text-[13px] font-bold text-text-light uppercase tracking-widest mb-2.5">Account</p>
      <Card noPadding className="overflow-hidden mb-3.5">
        {menu.map((item, i) => (
          <div
            key={item.label}
            onClick={() => push(item.id)}
            className={`flex items-center justify-between px-4 py-3.5 cursor-pointer bg-card ${
              i < menu.length - 1 ? "border-b border-border" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[10px] bg-primary-light flex items-center justify-center">
                <Icon name={item.ic} size={17} className="text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground">{item.label}</p>
            </div>
            <div className="flex items-center gap-2">
              {item.badge && <Badge color="pink" sm>{item.badge}</Badge>}
              <Icon name="chevR" size={16} className="text-text-light" />
            </div>
          </div>
        ))}
      </Card>

      <button className="w-full py-3.5 rounded-[14px] border-[1.5px] border-destructive/10 bg-destructive/5 flex items-center justify-center gap-2 cursor-pointer">
        <Icon name="logout" size={16} className="text-destructive" />
        <span className="text-sm font-bold text-destructive">Sign Out</span>
      </button>
    </div>
  </Screen>
);

export default ProfileScreen;
