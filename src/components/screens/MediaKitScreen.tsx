import React, { useState } from "react";
import { BackHeader } from "../findcollab/BackHeader";
import { Badge } from "../findcollab/Badge";
import { Card } from "../findcollab/Card";
import { Pill } from "../findcollab/Pill";
import { Icon } from "../findcollab/Icon";

interface Props {
  onBack: () => void;
}

interface PlatformData {
  label: string;
  ic: string;
  color: string;
  followers: string;
  engagement: { label: string; value: string }[];
  rates: { service: string; rate: string }[];
  projects: { brand: string; link: string }[];
}

const platforms: Record<string, PlatformData> = {
  instagram: {
    label: "Instagram", ic: "insta", color: "text-pink-600",
    followers: "6.1M",
    engagement: [
      { label: "Avg Likes", value: "2.1M" },
      { label: "Reel Views", value: "2M" },
      { label: "Comments", value: "94.4K" },
      { label: "Engagement", value: "37.03%" },
    ],
    rates: [
      { service: "Reel (<60s)", rate: "₹10,00,000" },
      { service: "Static Post", rate: "₹5,00,000" },
      { service: "Video Story (<45s)", rate: "₹3,00,000" },
      { service: "Video Story (<30s)", rate: "₹1,50,000" },
    ],
    projects: [
      { brand: "Sery Cosmetics", link: "instagram.com/reel/CSQOCHsg7S2" },
      { brand: "Wow Momo", link: "instagram.com/p/C374PQBykrx" },
    ],
  },
  youtube: {
    label: "YouTube", ic: "yt", color: "text-red-600",
    followers: "32.7M",
    engagement: [
      { label: "Avg Views", value: "5.8M" },
      { label: "Subscribers", value: "32.7M" },
      { label: "Comments", value: "42K" },
      { label: "Engagement", value: "12.5%" },
    ],
    rates: [
      { service: "Dedicated Video", rate: "₹25,00,000" },
      { service: "Integrated Video", rate: "₹15,00,000" },
      { service: "Shorts", rate: "₹5,00,000" },
    ],
    projects: [
      { brand: "VIVO India", link: "youtube.com/watch?v=abc123" },
      { brand: "Nykaa", link: "youtube.com/watch?v=def456" },
    ],
  },
  linkedin: {
    label: "LinkedIn", ic: "linkedin", color: "text-blue-600",
    followers: "120K",
    engagement: [
      { label: "Avg Impressions", value: "85K" },
      { label: "Connections", value: "12K" },
      { label: "Comments", value: "1.2K" },
      { label: "Engagement", value: "8.4%" },
    ],
    rates: [
      { service: "Thought Leadership Post", rate: "₹1,50,000" },
      { service: "Article + Post", rate: "₹2,50,000" },
    ],
    projects: [
      { brand: "Zoho", link: "linkedin.com/posts/dilraj-xyz" },
    ],
  },
  tiktok: {
    label: "TikTok", ic: "tiktok", color: "text-foreground",
    followers: "4.2M",
    engagement: [
      { label: "Avg Views", value: "1.8M" },
      { label: "Likes", value: "320K" },
      { label: "Shares", value: "45K" },
      { label: "Engagement", value: "28.6%" },
    ],
    rates: [
      { service: "Video (<60s)", rate: "₹6,00,000" },
      { service: "Video (<30s)", rate: "₹3,00,000" },
    ],
    projects: [
      { brand: "Sugar Cosmetics", link: "tiktok.com/@dilraj/video/123" },
    ],
  },
  twitter: {
    label: "X (Twitter)", ic: "twitter", color: "text-foreground",
    followers: "890K",
    engagement: [
      { label: "Avg Impressions", value: "1.2M" },
      { label: "Retweets", value: "8.5K" },
      { label: "Replies", value: "3.2K" },
      { label: "Engagement", value: "5.7%" },
    ],
    rates: [
      { service: "Thread (5+ tweets)", rate: "₹2,00,000" },
      { service: "Single Tweet", rate: "₹75,000" },
    ],
    projects: [
      { brand: "Swiggy", link: "x.com/dilraj/status/789" },
    ],
  },
};

const platformKeys = ["instagram", "youtube", "linkedin", "tiktok", "twitter"];

const MediaKitScreen: React.FC<Props> = ({ onBack }) => {
  const [activePlatform, setActivePlatform] = useState("instagram");
  const [tab, setTab] = useState("stats");

  const p = platforms[activePlatform];

  return (
    <div className="flex-1 overflow-y-auto bg-background pb-5">
      <BackHeader title="My Media Kit" onBack={onBack} right={
        <button className="w-9 h-9 rounded-[10px] bg-primary-light border-none flex items-center justify-center cursor-pointer">
          <Icon name="send" size={16} className="text-primary" />
        </button>
      } />
      <div className="bg-card border-b border-border">
        <div className="h-[70px] gradient-hero" />
        <div className="px-4 pb-4">
          <div className="flex items-end gap-3 mb-3">
            <div className="w-16 h-16 rounded-[18px] bg-primary border-[3px] border-card -mt-8 flex items-center justify-center shrink-0">
              <span className="text-primary-foreground text-2xl font-black">D</span>
            </div>
            <div className="pb-1">
              <div className="flex items-center gap-1.5">
                <p className="text-[17px] font-black text-foreground">Dilraj Singh</p>
                <Badge color="blue" sm>✓ Verified</Badge>
              </div>
              <p className="text-[11px] text-text-light mt-0.5">📍 Chennai, India • Hindi, English</p>
            </div>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {["Food", "Fitness", "Science & Tech", "Movies"].map((t) => (
              <Badge key={t} color="pink" sm>{t}</Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Platform Selector */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {platformKeys.map((key) => {
            const plat = platforms[key];
            const isActive = activePlatform === key;
            return (
              <button
                key={key}
                onClick={() => { setActivePlatform(key); setTab("stats"); }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[12px] font-bold whitespace-nowrap cursor-pointer transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card text-text-mid border-border"
                }`}
              >
                <Icon name={plat.ic} size={14} className={isActive ? "text-primary-foreground" : plat.color} />
                {plat.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 pt-1">
        <div className="flex gap-2 mb-3.5">
          {[["stats", "Stats"], ["rates", "Rates"], ["projects", "Projects"]].map(([id, label]) => (
            <Pill key={id} active={tab === id} onClick={() => setTab(id)}>{label}</Pill>
          ))}
        </div>

        {tab === "stats" && (
          <div className="flex flex-col gap-3">
            <Card className="!p-4">
              <div className="flex items-center gap-2.5 mb-1">
                <Icon name={p.ic} size={22} className={p.color} />
                <div>
                  <p className="text-[11px] text-text-light">{p.label} Followers</p>
                  <p className="text-[28px] font-black text-foreground leading-none">{p.followers}</p>
                </div>
              </div>
            </Card>
            <Card className="!bg-gradient-to-br from-primary-light to-card">
              <p className="text-[13px] font-extrabold text-foreground mb-3">Engagement Metrics</p>
              <div className="grid grid-cols-2 gap-2.5">
                {p.engagement.map((e) => (
                  <div key={e.label}>
                    <p className="text-lg font-black text-primary">{e.value}</p>
                    <p className="text-[10px] text-text-mid mt-0.5">{e.label}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {tab === "rates" && (
          <Card>
            <p className="text-[13px] font-extrabold text-foreground mb-3">{p.label} Commercials</p>
            {p.rates.map((r, i) => (
              <div key={i} className={`flex justify-between items-center py-2.5 ${i < p.rates.length - 1 ? "border-b border-border" : ""}`}>
                <p className="text-[13px] text-foreground">{r.service}</p>
                <p className="text-sm font-black text-primary">{r.rate}</p>
              </div>
            ))}
          </Card>
        )}

        {tab === "projects" && (
          <div className="flex flex-col gap-2.5">
            {p.projects.map((proj, i) => (
              <Card key={i} className="!p-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-primary-light flex items-center justify-center">
                    <Icon name={p.ic} size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{proj.brand}</p>
                    <p className="text-[11px] text-primary mt-0.5">🔗 {proj.link}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaKitScreen;
