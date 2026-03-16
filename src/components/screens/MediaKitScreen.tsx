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
  bgActive: string;
  followers: string;
  followerLabel: string;
  engagement: { label: string; value: string; ic?: string }[];
  engagementRate: number;
  rates: { service: string; rate: string }[];
  projects: { brand: string; link: string }[];
  recentPosts: { type: string; caption: string; likes: string; comments: string; date: string }[];
}

const platforms: Record<string, PlatformData> = {
  instagram: {
    label: "Instagram", ic: "insta", color: "text-pink-600",
    bgActive: "bg-gradient-to-br from-pink-500 to-rose-500",
    followers: "6.1M", followerLabel: "Instagram followers",
    engagementRate: 37.03,
    engagement: [
      { label: "Average Likes", value: "2.1M", ic: "heart" },
      { label: "Reels views", value: "21M", ic: "campaign" },
      { label: "Comments", value: "94.4K", ic: "chat" },
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
    recentPosts: [
      { type: "Reel", caption: "What happens when you mix sodium with water? 💥", likes: "3.2M", comments: "18K", date: "2d ago" },
      { type: "Post", caption: "Behind the scenes of our biggest experiment yet 🔬", likes: "1.8M", comments: "12K", date: "5d ago" },
      { type: "Reel", caption: "Science hack that will blow your mind 🤯", likes: "4.1M", comments: "22K", date: "1w ago" },
    ],
  },
  youtube: {
    label: "YouTube", ic: "yt", color: "text-red-600",
    bgActive: "bg-gradient-to-br from-red-500 to-red-600",
    followers: "32.7M", followerLabel: "Youtube followers",
    engagementRate: 12.5,
    engagement: [
      { label: "Avg Views", value: "5.8M", ic: "campaign" },
      { label: "Subscribers", value: "32.7M", ic: "person" },
      { label: "Comments", value: "42K", ic: "chat" },
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
    recentPosts: [
      { type: "Video", caption: "World's Largest Science Experiment! 🌍", likes: "8.2M", comments: "45K", date: "3d ago" },
      { type: "Shorts", caption: "Is this even possible? 😱", likes: "12M", comments: "32K", date: "1w ago" },
    ],
  },
  linkedin: {
    label: "LinkedIn", ic: "linkedin", color: "text-blue-600",
    bgActive: "bg-gradient-to-br from-blue-500 to-blue-600",
    followers: "120K", followerLabel: "LinkedIn followers",
    engagementRate: 8.4,
    engagement: [
      { label: "Avg Impressions", value: "85K", ic: "campaign" },
      { label: "Connections", value: "12K", ic: "person" },
      { label: "Comments", value: "1.2K", ic: "chat" },
    ],
    rates: [
      { service: "Thought Leadership Post", rate: "₹1,50,000" },
      { service: "Article + Post", rate: "₹2,50,000" },
    ],
    projects: [
      { brand: "Zoho", link: "linkedin.com/posts/dilraj-xyz" },
    ],
    recentPosts: [
      { type: "Post", caption: "5 lessons from building a 30M+ audience 📈", likes: "42K", comments: "1.8K", date: "4d ago" },
    ],
  },
  tiktok: {
    label: "TikTok", ic: "tiktok", color: "text-foreground",
    bgActive: "bg-gradient-to-br from-gray-800 to-black",
    followers: "4.2M", followerLabel: "TikTok followers",
    engagementRate: 28.6,
    engagement: [
      { label: "Avg Views", value: "1.8M", ic: "campaign" },
      { label: "Likes", value: "320K", ic: "heart" },
      { label: "Shares", value: "45K", ic: "send" },
    ],
    rates: [
      { service: "Video (<60s)", rate: "₹6,00,000" },
      { service: "Video (<30s)", rate: "₹3,00,000" },
    ],
    projects: [
      { brand: "Sugar Cosmetics", link: "tiktok.com/@dilraj/video/123" },
    ],
    recentPosts: [
      { type: "Video", caption: "This trick went viral overnight 🔥", likes: "2.1M", comments: "15K", date: "2d ago" },
    ],
  },
  twitter: {
    label: "X (Twitter)", ic: "twitter", color: "text-foreground",
    bgActive: "bg-gradient-to-br from-gray-800 to-black",
    followers: "890K", followerLabel: "X followers",
    engagementRate: 5.7,
    engagement: [
      { label: "Avg Impressions", value: "1.2M", ic: "campaign" },
      { label: "Retweets", value: "8.5K", ic: "send" },
      { label: "Replies", value: "3.2K", ic: "chat" },
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

// Donut chart component
const EngagementDonut: React.FC<{ percentage: number }> = ({ percentage }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const filled = (percentage / 100) * circumference;
  const empty = circumference - filled;

  return (
    <div className="relative w-[110px] h-[110px] flex items-center justify-center">
      <svg width="110" height="110" viewBox="0 0 110 110" className="-rotate-90">
        <circle cx="55" cy="55" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="10" />
        <circle
          cx="55" cy="55" r={radius} fill="none"
          stroke="url(#donutGradient)" strokeWidth="10"
          strokeDasharray={`${filled} ${empty}`}
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="donutGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(217, 91%, 60%)" />
            <stop offset="100%" stopColor="hsl(200, 80%, 55%)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-primary text-lg font-black">{percentage}%</span>
      </div>
    </div>
  );
};

const MediaKitScreen: React.FC<Props> = ({ onBack }) => {
  const [activePlatform, setActivePlatform] = useState("instagram");
  const [tab, setTab] = useState("stats");
  const [bioOpen, setBioOpen] = useState(false);

  const creatorBio = "My name is Dilraj Singh Rawat., Popularly known as Indian Hacker. With a remarkable journey spanning over a decade, I have successfully accumulated a staggering 32.7 million subscribers on my Youtube Channel channel, solidifying my place as a digital influencer of unparalleled stature.";
  const bioSnippet = creatorBio.slice(0, 90) + "…";

  const p = platforms[activePlatform];

  return (
    <div className="flex-1 overflow-y-auto bg-background pb-5">
      <BackHeader title="My Media Kit" onBack={onBack} right={
        <button className="w-9 h-9 rounded-[10px] bg-primary-light border-none flex items-center justify-center cursor-pointer">
          <Icon name="send" size={16} className="text-primary" />
        </button>
      } />

      {/* Profile Header */}
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
              <p className="text-[11px] text-muted-foreground mt-0.5">📍 Chennai, India • Hindi, English</p>
            </div>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {["Food", "Fitness", "Science & Tech", "Movies"].map((t) => (
              <Badge key={t} color="pink" sm>{t}</Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Bio Dropdown */}
      <div className="px-4 pt-3">
        <button
          onClick={() => setBioOpen(!bioOpen)}
          className="w-full bg-card rounded-[14px] border border-border px-4 py-3 flex items-center justify-between cursor-pointer transition-all"
        >
          <div className="flex-1 text-left">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">About</p>
            {!bioOpen && (
              <p className="text-[12px] text-foreground leading-relaxed">{bioSnippet}</p>
            )}
          </div>
          <div className={`w-6 h-6 rounded-full bg-primary-light flex items-center justify-center shrink-0 ml-2 transition-transform ${bioOpen ? "rotate-180" : ""}`}>
            <Icon name="chevD" size={14} className="text-primary" />
          </div>
        </button>
        {bioOpen && (
          <div className="bg-card border border-t-0 border-border rounded-b-[14px] px-4 pb-4 -mt-[14px] pt-3">
            <div className="border-t border-dashed border-border pt-3">
              <p className="text-[12px] text-foreground leading-relaxed">{creatorBio}</p>
            </div>
          </div>
        )}
      </div>
      <div className="px-4 pt-3 pb-1">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {platformKeys.map((key) => {
            const plat = platforms[key];
            const isActive = activePlatform === key;
            return (
              <button
                key={key}
                onClick={() => { setActivePlatform(key); setTab("stats"); }}
                className={`flex flex-col items-start gap-1 min-w-[105px] px-3 py-2.5 rounded-[14px] border cursor-pointer transition-all shrink-0 ${
                  isActive
                    ? `${plat.bgActive} text-white border-transparent shadow-md`
                    : "bg-card text-foreground border-border"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-[18px] font-black ${isActive ? "text-white" : "text-foreground"}`}>
                    {plat.followers}
                  </span>
                  <Icon name={plat.ic} size={18} className={isActive ? "text-white/80" : plat.color} />
                </div>
                <span className={`text-[9px] font-medium ${isActive ? "text-white/80" : "text-muted-foreground"}`}>
                  {plat.followerLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-1">
        <div className="flex gap-2 mb-3.5">
          {[["stats", "Stats"], ["rates", "Rates"], ["projects", "Projects"]].map(([id, label]) => (
            <Pill key={id} active={tab === id} onClick={() => setTab(id)}>{label}</Pill>
          ))}
        </div>

        {tab === "stats" && (
          <div className="flex flex-col gap-3">
            {/* Profile Engagement Card */}
            <Card>
              <p className="text-[15px] font-black text-foreground mb-3">Profile Engagement</p>
              <div className="flex items-center gap-4">
                {/* Metrics */}
                <div className="flex-1 flex flex-col gap-3">
                  {p.engagement.map((e) => (
                    <div key={e.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-primary-light flex items-center justify-center">
                          <Icon name={e.ic || "heart"} size={12} className="text-primary" />
                        </div>
                        <span className="text-[12px] text-muted-foreground">{e.label}</span>
                      </div>
                      <span className="text-[13px] font-black text-foreground">{e.value}</span>
                    </div>
                  ))}
                </div>
                {/* Donut Chart */}
                <EngagementDonut percentage={p.engagementRate} />
              </div>
              <div className="mt-3 bg-primary-light rounded-[10px] px-3 py-2">
                <p className="text-[10px] text-muted-foreground">
                  ℹ️ Achieving 5%+ engagement is good; 10%+ indicates strong performance
                </p>
              </div>
            </Card>

            {/* Engagement Metrics Gradient Card */}
            <Card className="!bg-gradient-to-br from-primary-light to-card">
              <p className="text-[13px] font-extrabold text-foreground mb-3">Quick Stats</p>
              <div className="grid grid-cols-2 gap-2.5">
                {p.engagement.map((e) => (
                  <div key={e.label}>
                    <p className="text-lg font-black text-primary">{e.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{e.label}</p>
                  </div>
                ))}
                <div>
                  <p className="text-lg font-black text-primary">{p.engagementRate}%</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Engagement Rate</p>
                </div>
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