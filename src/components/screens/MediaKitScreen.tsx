import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { profileService } from "@/services/profileService";
import { BackHeader } from "../findcollab/BackHeader";
import { Badge } from "../findcollab/Badge";
import { Card } from "../findcollab/Card";
import { Pill } from "../findcollab/Pill";
import { Icon } from "../findcollab/Icon";
import { toast } from "@/hooks/use-toast";

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
  bio: string;
  link: string;
  username: string;
  profilePic: string;
}

const EMPTY_PLATFORMS: Record<string, PlatformData> = {
  instagram: {
    label: "Instagram", ic: "insta", color: "text-pink-600",
    bgActive: "bg-gradient-to-br from-pink-500 to-rose-500",
    followers: "—", followerLabel: "Instagram followers",
    engagementRate: 0,
    engagement: [
      { label: "Average Likes", value: "—", ic: "heart" },
      { label: "Posts", value: "—", ic: "campaign" },
      { label: "Following", value: "—", ic: "person" },
    ],
    rates: [], projects: [], recentPosts: [],
    bio: "", link: "", username: "", profilePic: "",
  },
  youtube: {
    label: "YouTube", ic: "yt", color: "text-red-600",
    bgActive: "bg-gradient-to-br from-red-500 to-red-600",
    followers: "—", followerLabel: "Youtube followers",
    engagementRate: 0,
    engagement: [
      { label: "Avg Views", value: "—", ic: "campaign" },
      { label: "Subscribers", value: "—", ic: "person" },
      { label: "Comments", value: "—", ic: "chat" },
    ],
    rates: [], projects: [], recentPosts: [],
    bio: "", link: "", username: "", profilePic: "",
  },
  linkedin: {
    label: "LinkedIn", ic: "linkedin", color: "text-blue-600",
    bgActive: "bg-gradient-to-br from-blue-500 to-blue-600",
    followers: "—", followerLabel: "LinkedIn followers",
    engagementRate: 0,
    engagement: [
      { label: "Avg Impressions", value: "—", ic: "campaign" },
      { label: "Connections", value: "—", ic: "person" },
      { label: "Comments", value: "—", ic: "chat" },
    ],
    rates: [], projects: [], recentPosts: [],
    bio: "", link: "", username: "", profilePic: "",
  },
};

// Instagram CDN images block hot-linking via Referer; route through a free image proxy
const proxyImg = (url: string): string => {
  if (!url) return "";
  if (url.includes("fbcdn.net") || url.includes("cdninstagram.com")) {
    return `https://images.weserv.nl/?url=${encodeURIComponent(url.replace(/^https?:\/\//, ""))}`;
  }
  return url;
};

const EngagementDonut: React.FC<{ percentage: number }> = ({ percentage }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const filled = (percentage / 100) * circumference;
  const empty = circumference - filled;
  return (
    <div className="relative w-[110px] h-[110px] flex items-center justify-center">
      <svg width="110" height="110" viewBox="0 0 110 110" className="-rotate-90">
        <circle cx="55" cy="55" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="10" />
        <circle cx="55" cy="55" r={radius} fill="none" stroke="url(#donutGradient)" strokeWidth="10" strokeDasharray={`${filled} ${empty}`} strokeLinecap="round" />
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
  const { user } = useAuth();
  const [activePlatform, setActivePlatform] = useState("instagram");
  const [tab, setTab] = useState("stats");
  const [bioOpen, setBioOpen] = useState(false);
  const [platforms, setPlatforms] = useState<Record<string, PlatformData>>(EMPTY_PLATFORMS);
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    profileService.getMediaKit().then((res) => {
      setProfileData(res);
      const updated: Record<string, PlatformData> = {
        instagram: { ...EMPTY_PLATFORMS.instagram },
        youtube: { ...EMPTY_PLATFORMS.youtube },
        linkedin: { ...EMPTY_PLATFORMS.linkedin },
      };

      const ud = res.userDetail || {};

      const fmtNum = (n: any): string => {
        const num = Number(n);
        if (!num || isNaN(num)) return "—";
        if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
        if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
        return String(num);
      };

      // ── Instagram ──────────────────────────────
      let igUser: any = {};
      try {
        const igJson = res.instagramData?.json_data ? JSON.parse(res.instagramData.json_data) : null;
        igUser = igJson?.data?.user || {};
      } catch {}
      const igFollowers = igUser.edge_followed_by?.count ?? Number(ud.primary_account_followers) ?? 0;
      const igFollowing = igUser.edge_follow?.count ?? 0;
      const igPosts = igUser.edge_owner_to_timeline_media?.count ?? 0;
      const igEngagement = parseFloat(ud.instagram_engagement_rate || "0");
      const igAvgLikes = igFollowers && igEngagement ? Math.round(igFollowers * igEngagement / 100) : 0;
      updated.instagram = {
        ...updated.instagram,
        followers: fmtNum(igFollowers),
        engagementRate: Number(igEngagement.toFixed(2)) || 0,
        engagement: [
          { label: "Average Likes", value: fmtNum(igAvgLikes), ic: "heart" },
          { label: "Posts", value: igPosts ? String(igPosts) : "—", ic: "campaign" },
          { label: "Following", value: igFollowing ? String(igFollowing) : "—", ic: "person" },
        ],
        bio: igUser.biography || ud.instagram_bio || "",
        username: igUser.username || ud.instagram_user_name || ud.instagram_username || "",
        profilePic: igUser.profile_pic_url_hd || igUser.profile_pic_url || "",
        link: (igUser.username || ud.instagram_user_name || ud.instagram_username)
          ? `https://instagram.com/${igUser.username || ud.instagram_user_name || ud.instagram_username}`
          : (ud.instagram_link || ""),
      };

      // ── YouTube ────────────────────────────────
      const ytSubs = Number(ud.youtube_subscribe_count) || 0;
      const ytViews = Number(ud.youtube_view_average) || 0;
      const ytEngagement = parseFloat(ud.youtube_engagement_rate || "0");
      updated.youtube = {
        ...updated.youtube,
        followers: fmtNum(ytSubs),
        engagementRate: Number(ytEngagement.toFixed(2)) || 0,
        engagement: [
          { label: "Avg Views", value: fmtNum(ytViews), ic: "campaign" },
          { label: "Subscribers", value: fmtNum(ytSubs), ic: "person" },
          { label: "Avg Likes", value: fmtNum(Math.round(ytViews * (ytEngagement / 100))), ic: "heart" },
        ],
        bio: ud.youtube_bio || ud.youtube_description || "",
        username: ud.youtube_channel_name || ud.youtube_user_name || "",
        profilePic: ud.youtube_profile_image || ud.youtube_thumbnail || "",
        link: ud.youtube_link || ud.youtube_channel_link || ud.youtube_url || "",
      };

      // ── LinkedIn ───────────────────────────────
      const liFollowers = Number(ud.linkedin_followers) || 0;
      const liConnections = Number(ud.linkedin_connections) || 0;
      const liEngagement = parseFloat(ud.linkedin_engagement_rate || "0");
      const liLikes = Number(ud.linkedin_average_likes) || 0;
      updated.linkedin = {
        ...updated.linkedin,
        followers: fmtNum(liFollowers),
        engagementRate: Number(liEngagement.toFixed(2)) || 0,
        engagement: [
          { label: "Avg Likes", value: fmtNum(liLikes), ic: "heart" },
          { label: "Connections", value: liConnections ? String(liConnections) : "—", ic: "person" },
          { label: "Posts", value: ud.linkedin_posts ? String(ud.linkedin_posts) : "—", ic: "campaign" },
        ],
        bio: ud.linkedin_bio || ud.linkedin_about || "",
        username: ud.linkedin_user_name || ud.linkedin_username || "",
        profilePic: ud.linkedin_profile_image || "",
        link: ud.linkedin_link || ud.linkedin_url || "",
      };

      // ── Commercials / Rates ────────────────────
      const labelMap: Record<string, string> = {
        rate_per_reel: "Reel",
        rate_per_static_post: "Static Post",
        rate_per_video_story: "Video Story",
        rate_per_static_story: "Static Story",
        rate_per_carousel: "Carousel",
        rate_per_dedicated_video: "Dedicated Video",
        rate_per_integrated_video: "Integrated Video",
        rate_per_shorts: "Shorts",
        ugc_content_instagram: "UGC Content",
      };
      const formatRates = (raw: any, valueKey: string, rateKey: string) => {
        if (!raw) return [];
        try {
          const arr = typeof raw === "string" ? JSON.parse(raw) : raw;
          return (Array.isArray(arr) ? arr : []).map((r: any) => ({
            service: labelMap[r[valueKey]] || r[valueKey] || "Service",
            rate: r[rateKey] ? `₹${Number(r[rateKey]).toLocaleString()}` : "—",
          }));
        } catch { return []; }
      };
      const uc = res.userCommercials || {};
      updated.instagram.rates = formatRates(uc.instagram_details, "instagram_values", "instagramrate");
      updated.youtube.rates = formatRates(uc.youtube_details, "youtube_values", "youtuberate");
      updated.linkedin.rates = formatRates(uc.linkedin_details, "linkedin_values", "linkedinrate");

      // ── Projects ───────────────────────────────
      if (Array.isArray(res.userProjects)) {
        const projs = res.userProjects.map((p: any) => ({
          brand: p.brand_name || p.brand || p.name || "",
          link: p.collaboration_link || p.link || p.url || "",
        }));
        Object.keys(updated).forEach((plat) => { updated[plat].projects = projs; });
      }

      // ── Recent Posts (Instagram reels) ─────────
      try {
        const reelsRaw = res.instagramData?.reels_data;
        const reels = reelsRaw ? (typeof reelsRaw === "string" ? JSON.parse(reelsRaw) : reelsRaw) : null;
        const items = reels?.items || [];
        const fmtPostNum = (n: number) => {
          if (!n) return "0";
          if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
          if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
          return String(n);
        };
        const fmtDate = (ts: number) => {
          if (!ts) return "";
          const d = new Date(ts * 1000);
          return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
        };
        updated.instagram.recentPosts = items.slice(0, 5).map((item: any) => {
          const m = item.media || item;
          const caption = m.caption?.text || "";
          return {
            type: m.media_type === 2 ? "Reel" : m.media_type === 8 ? "Carousel" : "Post",
            caption: caption.length > 80 ? caption.slice(0, 80) + "…" : caption || "(no caption)",
            likes: fmtPostNum(Number(m.like_count ?? m.fb_like_count ?? 0)),
            comments: fmtPostNum(Number(m.comment_count ?? 0)),
            date: fmtDate(Number(m.taken_at ?? 0)),
          };
        });
      } catch {}

      setPlatforms(updated);
    }).catch(() => {});
  }, []);

  const platformKeys = Object.keys(platforms);
  const displayName = user ? `${user.fname}${(user as any).lname ? ` ${(user as any).lname}` : ""}` : "User";
  const ud = profileData?.userDetail || {};
  let igBio = "";
  try {
    const igJson = profileData?.instagramData?.json_data ? JSON.parse(profileData.instagramData.json_data) : null;
    igBio = igJson?.data?.user?.biography || "";
  } catch {}
  const creatorBio = ud.introduction || ud.instagram_bio || igBio || ud.youtube_bio || "Influencer on Findcollab";
  const bioSnippet = creatorBio.length > 90 ? creatorBio.slice(0, 90) + "…" : creatorBio;
  const location = profileData ? [profileData.city, profileData.state, profileData.country].filter(Boolean).join(", ") : "";
  const categories: string[] = profileData?.userCategories?.map((c: any) => c.Interested_in_industry || c.name || c.category_name).filter(Boolean) || [];

  const p = platforms[activePlatform] || platforms.instagram;

  const handleShare = async () => {
    if (!user?.id) return;
    const url = `https://findcollab.com/media-kit/${user.id}`;
    const title = `${user.fname}${(user as any).lname ? ` ${(user as any).lname}` : ""} – Media Kit`;
    try {
      if (navigator.share) {
        await navigator.share({ title, text: "Check out my Findcollab media kit", url });
        return;
      }
    } catch {
      // user cancelled or share failed → fall through to copy
    }
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied", description: "Public media kit URL copied to clipboard" });
    } catch {
      toast({ title: "Share link", description: url });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background pb-5">
      <BackHeader title="My Media Kit" onBack={onBack} right={
        <button
          onClick={handleShare}
          aria-label="Share media kit"
          className="w-9 h-9 rounded-[10px] bg-primary-light border-none flex items-center justify-center cursor-pointer"
        >
          <Icon name="share" size={16} className="text-primary" />
        </button>
      } />

      <div className="bg-card border-b border-border">
        <div className="h-[70px] bg-primary-light" />
        <div className="px-4 pb-4">
          <div className="flex items-end gap-3 mb-3">
            <div className="w-16 h-16 rounded-[18px] border-[3px] border-card -mt-8 shrink-0 overflow-hidden bg-primary flex items-center justify-center">
              {platforms.instagram.profilePic ? (
                <img
                  src={proxyImg(platforms.instagram.profilePic)}
                  alt={displayName}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <span className="text-primary-foreground text-2xl font-black">{(user?.fname || "D").charAt(0)}</span>
              )}
            </div>
            <div className="pb-1">
              <div className="flex items-center gap-1.5">
                <p className="text-[17px] font-black text-foreground">{displayName}</p>
                <Badge color="blue" sm>✓ Verified</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">📍 {location}</p>
            </div>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {categories.map((t) => (
              <Badge key={t} color="pink" sm>{t}</Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 pt-3">
        <button onClick={() => setBioOpen(!bioOpen)} className="w-full bg-card rounded-[14px] border border-border px-4 py-3 flex items-center justify-between cursor-pointer transition-all">
          <div className="flex-1 text-left">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">About</p>
            {!bioOpen && <p className="text-[12px] text-foreground leading-relaxed">{bioSnippet}</p>}
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
              <button key={key} onClick={() => { setActivePlatform(key); setTab("stats"); }}
                className={`flex flex-col items-start gap-1 min-w-[105px] px-3 py-2.5 rounded-[14px] border cursor-pointer transition-all shrink-0 ${
                  isActive ? `${plat.bgActive} text-white border-transparent shadow-md` : "bg-card text-foreground border-border"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-[18px] font-black ${isActive ? "text-white" : "text-foreground"}`}>{plat.followers}</span>
                  <Icon name={plat.ic} size={18} className={isActive ? "text-white/80" : plat.color} />
                </div>
                <span className={`text-[9px] font-medium ${isActive ? "text-white/80" : "text-muted-foreground"}`}>{plat.followerLabel}</span>
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
            {(p.profilePic || p.bio || p.link || p.username) && (
              <Card>
                <div className="flex items-start gap-3">
                  <div className={`w-14 h-14 rounded-[16px] overflow-hidden shrink-0 flex items-center justify-center ${p.bgActive}`}>
                    {p.profilePic ? (
                      <img
                        src={p.profilePic}
                        alt={`${p.label} profile`}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <Icon name={p.ic} size={22} className="text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Icon name={p.ic} size={13} className={p.color} />
                      <p className="text-[13px] font-extrabold text-foreground">{p.label}</p>
                    </div>
                    {p.username && (
                      <p className="text-[11px] text-muted-foreground mb-1">@{p.username.replace(/^@/, "")}</p>
                    )}
                    {p.bio && (
                      <p className="text-[12px] text-foreground leading-snug whitespace-pre-line">{p.bio}</p>
                    )}
                    {p.link && (
                      <a
                        href={p.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold text-primary break-all"
                      >
                        🔗 {p.link.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            )}
            <Card>
              <p className="text-[15px] font-black text-foreground mb-3">Profile Engagement</p>
              <div className="flex items-center gap-4">
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
                <EngagementDonut percentage={p.engagementRate} />
              </div>
            </Card>
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
            {p.recentPosts.length > 0 && (
              <Card>
                <p className="text-[13px] font-extrabold text-foreground mb-3">Recent Posts</p>
                <div className="flex flex-col gap-2.5">
                  {p.recentPosts.map((post, i) => (
                    <div key={i} className={`flex items-start gap-3 pb-2.5 ${i < p.recentPosts.length - 1 ? "border-b border-border" : ""}`}>
                      <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center shrink-0">
                        <Icon name={p.ic} size={16} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Badge color="pink" sm>{post.type}</Badge>
                          <span className="text-[9px] text-muted-foreground">{post.date}</span>
                        </div>
                        <p className="text-[11px] text-foreground leading-snug truncate">{post.caption}</p>
                        <div className="flex gap-3 mt-1">
                          <span className="text-[10px] text-muted-foreground">❤️ {post.likes}</span>
                          <span className="text-[10px] text-muted-foreground">💬 {post.comments}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {tab === "rates" && (
          <Card>
            <p className="text-[13px] font-extrabold text-foreground mb-3">{p.label} Commercials</p>
            {p.rates.length === 0 && <p className="text-xs text-muted-foreground">No rates set yet</p>}
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
            {p.projects.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No projects yet</p>}
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
