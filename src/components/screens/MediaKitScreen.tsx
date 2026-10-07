import { ListSkeleton, Shimmer } from "../findcollab/Skeleton";
import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { toOptions, themeGradient, bannerBackground, type Option } from "@/lib/mediaKitThemes";
import { useAuth } from "@/contexts/AuthContext";
import { useMediaKit, useYoutubeData } from "@/hooks/useAppData";
import { BackHeader } from "../findcollab/BackHeader";
import { Badge } from "../findcollab/Badge";
import { Pill } from "../findcollab/Pill";
import { Icon } from "../findcollab/Icon";
import { toast } from "@/hooks/use-toast";
import { profileService } from "@/services/profileService";
import { AppButton } from "../findcollab/AppButton";
import { getProfilePhoto } from "@/lib/profilePhoto";

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
  recentPosts: { type: string; caption: string; likes: string; comments: string; date: string; thumb: string }[];
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
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [theme, setTheme] = useState("desi");
  const [banner, setBanner] = useState("theme");
  const [savedTheme, setSavedTheme] = useState("desi");
  const [savedBanner, setSavedBanner] = useState("theme");
  const [savingTheme, setSavingTheme] = useState(false);
  const [themeOptions, setThemeOptions] = useState<Option[]>([]);
  const [bannerOptions, setBannerOptions] = useState<Option[]>([]);
  const [brandLogos, setBrandLogos] = useState<{ id: string | number; url: string; sort_order?: number }[]>([]);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [deletingLogoId, setDeletingLogoId] = useState<string | number | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [downloading, setDownloading] = useState(false);
  const kitRef = useRef<HTMLDivElement>(null);
  const [platforms, setPlatforms] = useState<Record<string, PlatformData>>(EMPTY_PLATFORMS);
  const { data: mediaKitRes } = useMediaKit();
  const { data: ytDataRes } = useYoutubeData();
  const { data: settingsRes } = useQuery({ queryKey: ["media_kit_settings"], queryFn: () => profileService.getMediaKitSettings() });
  const profileData: any = mediaKitRes ?? null;

  /** Apply any (partial) settings block from the server to the UI and caches. */
  const applySettings = (s: any) => {
    if (!s) return;
    if (s.theme) { setTheme(String(s.theme)); setSavedTheme(String(s.theme)); }
    if (s.banner) { setBanner(String(s.banner)); setSavedBanner(String(s.banner)); }
    if (Array.isArray(s.themes) && s.themes.length) setThemeOptions(toOptions(s.themes));
    if (Array.isArray(s.banners) && s.banners.length) setBannerOptions(toOptions(s.banners));
    if (Array.isArray(s.brand_logos)) {
      setBrandLogos([...s.brand_logos].sort((a: any, b: any) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0)));
    }
    queryClient.setQueryData(["media_kit_settings"], (old: any) => ({ ...(old || {}), ...s }));
  };

  useEffect(() => { try { localStorage.removeItem("fc_mediakit_theme"); } catch { /* ignore */ } }, []);
  useEffect(() => { applySettings((mediaKitRes as any)?.mediaKitSettings); }, [mediaKitRes]);
  useEffect(() => { applySettings(settingsRes); }, [settingsRes]);

  useEffect(() => {
    const res: any = mediaKitRes;
    const ytData: any = ytDataRes;
    if (res) {
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

      // ── YouTube (from /youtube_data API) ───────
      // API returns { youtubeData: { items: [{ statistics: { subscriberCount }, snippet: {...} }] } }
      const ytRaw = ytData?.youtubeData || ytData?.data?.youtubeData || ytData || {};
      const ytItems = ytRaw?.items || ytData?.items || [];
      const ytItem = Array.isArray(ytItems) && ytItems.length > 0 ? ytItems[0] : {};
      const ytStats = ytItem?.statistics || {};
      const ytSnippet = ytItem?.snippet || {};
      
      const ytSubs = Number(ytStats.subscriberCount || ytStats.subscriber_count || ytData?.subscriberCount || ytData?.subscriber_count || ud.youtube_subscribe_count) || 0;
      const ytViews = Number(ytStats.viewCount || ytStats.view_count || ytData?.viewCount || ytData?.total_views || ud.youtube_view_average) || 0;
      const ytVideoCount = Number(ytStats.videoCount || ytStats.video_count || ytData?.videoCount || ytData?.video_count) || 0;
      const ytEngagement = parseFloat(ytData?.engagement_rate || ytData?.channel?.engagement_rate || ud.youtube_engagement_rate || "0");
      const ytAvgViews = Number(ytData?.average_views || ytData?.channel?.average_views || ud.youtube_view_average) || 0;
      const ytTitle = ytSnippet.title || ytSnippet.channel_name || ud.youtube_channel_name || ud.youtube_user_name || ud.youtube_url || "";
      const ytDescription = ytSnippet.description || ytSnippet.channel_description || ud.youtube_bio || ud.youtube_description || "";
      const ytThumb = ytSnippet.thumbnails?.high?.url || ytSnippet.thumbnails?.default?.url || ytSnippet.thumbnail || ud.youtube_profile_image || ud.youtube_thumbnail || "";
      updated.youtube = {
        ...updated.youtube,
        followers: fmtNum(ytSubs),
        engagementRate: Number(ytEngagement.toFixed(2)) || 0,
        engagement: [
          { label: "Avg Views", value: fmtNum(ytAvgViews || ytViews), ic: "campaign" },
          { label: "Subscribers", value: fmtNum(ytSubs), ic: "person" },
          { label: "Videos", value: ytVideoCount ? String(ytVideoCount) : "—", ic: "campaign" },
        ],
        bio: ytDescription,
        username: ytTitle,
        profilePic: ytThumb,
        link: ud.youtube_link || ud.youtube_channel_link || (ud.youtube_url ? `https://youtube.com/${ud.youtube_url}` : ""),
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
            thumb: m.image_versions2?.additional_candidates?.first_frame?.url || m.image_versions2?.candidates?.[0]?.url || "",
          };
        });
      } catch {}

      setPlatforms(updated);
    }
  }, [mediaKitRes, ytDataRes]);

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
  const languages: string[] = (profileData?.userLanguages || profileData?.languages || [])
    .map((language: any) => language.language_name || language.name || language.language)
    .filter(Boolean);

  const p = platforms[activePlatform] || platforms.instagram;
  const compactToNumber = (value: string) => {
    if (value === "—") return 0;
    const amount = Number.parseFloat(value);
    if (!Number.isFinite(amount)) return 0;
    if (value.endsWith("M")) return amount * 1_000_000;
    if (value.endsWith("K")) return amount * 1_000;
    return amount;
  };
  const totalReachValue = Object.values(platforms).reduce((sum, platform) => sum + compactToNumber(platform.followers), 0);
  const totalReach = totalReachValue >= 1_000_000
    ? `${(totalReachValue / 1_000_000).toFixed(1)}M`
    : totalReachValue >= 1_000
      ? `${(totalReachValue / 1_000).toFixed(1)}K`
      : totalReachValue > 0 ? String(totalReachValue) : "—";
  const selectedBanner = customizeOpen ? banner : savedBanner;
  const selectedTheme = customizeOpen ? theme : savedTheme;
  const selectedThemeLabel = themeOptions.find((item) => item.id === selectedTheme)?.label || selectedTheme;

  const errMsg = (error: unknown) => (error instanceof Error ? error.message : "Please try again");

  const handleShare = async () => {
    const handle = (platforms.instagram.username || "").replace(/^@/, "").trim();
    if (!handle) {
      toast({ title: "Add your Instagram first", description: "Your public media kit link uses your Instagram username." });
      return;
    }
    const url = `https://findcollab.com/instagram/${encodeURIComponent(handle)}`;
    const title = `${displayName} – Media Kit`;
    try {
      if (navigator.share) {
        await navigator.share({ title, text: "Check out my Findcollab media kit", url });
        return;
      }
    } catch {
      // user cancelled → fall through to copy
    }
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied", description: "Public media kit URL copied to clipboard" });
    } catch {
      toast({ title: "Share link", description: url });
    }
  };

  const handleSaveTheme = async () => {
    setSavingTheme(true);
    try {
      const changes: { theme?: string; banner?: string } = {};
      if (theme !== savedTheme) changes.theme = theme;
      if (banner !== savedBanner) changes.banner = banner;
      const res: any = await profileService.updateMediaKitTheme(changes);
      applySettings(res);
      toast({ title: "Media kit updated", description: res?.message || "Your theme and banner are now live" });
      setCustomizeOpen(false);
    } catch (error) {
      toast({ title: "Could not save", description: errMsg(error) });
    } finally {
      setSavingTheme(false);
    }
  };

  const handleLogoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) {
      toast({ title: "Unsupported file", description: "Use a PNG, JPG, WEBP or GIF image." });
      return;
    }
    if (file.size >= 3 * 1024 * 1024) {
      toast({ title: "File too large", description: "Logo must be under 3 MB." });
      return;
    }
    setUploadingLogo(true);
    try {
      const res: any = await profileService.uploadBrandLogo(file);
      applySettings({ brand_logos: res?.brand_logos });
      toast({ title: "Logo added", description: res?.message });
    } catch (error) {
      toast({ title: "Could not upload", description: errMsg(error) });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleDeleteLogo = async (id: string | number) => {
    if (!window.confirm("Remove this brand logo?")) return;
    setDeletingLogoId(id);
    try {
      const res: any = await profileService.deleteBrandLogo(id);
      applySettings({ brand_logos: res?.brand_logos ?? [] });
      toast({ title: "Logo removed", description: res?.message });
    } catch (error) {
      toast({ title: "Could not remove", description: errMsg(error) });
    } finally {
      setDeletingLogoId(null);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      if (!kitRef.current) throw new Error("Media kit is not ready yet");
      const safeName = (displayName || "Creator").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "Creator";
      const { exportMediaKitPdf } = await import("@/lib/mediaKitPdf");
      await exportMediaKitPdf(kitRef.current, `${safeName}-FindCollab-MediaKit.pdf`);
    } catch (error) {
      toast({ title: "Could not download", description: error instanceof Error ? error.message : "Please try again" });
    } finally {
      setDownloading(false);
    }
  };

  if (!profileData) {
    return (
      <div className="flex-1 overflow-y-auto bg-background pb-6">
        <BackHeader title="My Media Kit" onBack={onBack} />
        <div className="px-4 pt-3 flex flex-col gap-3">
          <Shimmer className="h-36 w-full rounded-[20px]" />
          <div className="flex items-center gap-3"><Shimmer className="h-16 w-16 rounded-full" /><div className="flex-1 flex flex-col gap-2"><Shimmer className="h-4 w-1/2" /><Shimmer className="h-3 w-1/3" /></div></div>
          <div className="grid grid-cols-3 gap-2">{[0, 1, 2].map((i) => <Shimmer key={i} className="h-16 rounded-[14px]" />)}</div>
          <ListSkeleton count={2} lines={3} />
        </div>
      </div>
    );
  }

  return (
    <div ref={kitRef} className="flex-1 overflow-y-auto overflow-x-hidden bg-background pb-6">
      <div data-html2canvas-ignore="true"><BackHeader title="My Media Kit" onBack={onBack} right={
        <div className="flex items-center gap-2">
          <AppButton variant="ghost" icon="edit" className="!h-9 !px-3 !py-0 !rounded-lg !text-xs" onClick={() => setCustomizeOpen((open) => !open)}>
            Style
          </AppButton>
          <AppButton variant="ghost" icon="share" className="!h-9 !w-9 !p-0 !rounded-lg" onClick={handleShare}>
            <span className="sr-only">Share</span>
          </AppButton>
        </div>
      } /></div>

      {customizeOpen && (
        <section data-html2canvas-ignore="true" className="bg-card border-b border-border px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Choose your theme</p>
            <span className="text-[10px] font-bold text-primary">{selectedThemeLabel}</span>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3">
            {themeOptions.length === 0 && <p className="text-xs text-muted-foreground">Loading themes…</p>}
            {themeOptions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTheme(item.id)}
                className={`shrink-0 flex items-center gap-2 h-9 px-3 rounded-full border text-[11px] font-bold transition-transform active:scale-95 ${theme === item.id ? "border-primary bg-primary-light text-primary" : "border-border bg-card text-foreground"}`}
              >
                <span className="w-4 h-4 rounded-full" style={{ background: themeGradient(item.id) }} />
                {item.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-3">Choose a banner</p>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {bannerOptions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setBanner(item.id)}
                className={`h-14 rounded-lg border overflow-hidden relative transition-transform active:scale-95 ${banner === item.id ? "border-2 border-primary" : "border-border"}`}
                aria-label={item.label}
              >
                <span className="absolute inset-0" style={{ background: bannerBackground(item.id, theme) }} />
                <span className="absolute inset-x-0 bottom-0 bg-card/90 text-[8px] font-bold text-foreground py-1">{item.id === "theme" ? "Theme" : item.label}</span>
              </button>
            ))}
          </div>
          <AppButton full disabled={savingTheme || (theme === savedTheme && banner === savedBanner)} onClick={handleSaveTheme}>
            {savingTheme ? "Saving…" : "Save changes"}
          </AppButton>
        </section>
      )}

      <section className="relative h-52 overflow-hidden border-b border-border">
        <div className="absolute inset-0" style={{ background: bannerBackground(selectedBanner, selectedTheme) }} />
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-card/90 backdrop-blur px-3 py-1.5 rounded-full border border-border shadow-sm">
          <span className="w-2 h-2 rounded-full bg-success" />
          <span className="text-[10px] font-black text-foreground uppercase tracking-wider">Verified creator</span>
        </div>
        <div className="absolute top-4 right-4 bg-card/90 backdrop-blur px-3 py-1.5 rounded-full border border-border">
          <span className="text-[10px] font-black text-primary uppercase tracking-wider">{selectedThemeLabel}</span>
        </div>
      </section>

      <section className="px-5 -mt-14 relative z-10">
        <div className="w-28 h-28 rounded-full border-[5px] border-card shadow-lg overflow-hidden bg-primary flex items-center justify-center">
          {(getProfilePhoto(mediaKitRes, user) || platforms.instagram.profilePic) ? (
            <img src={getProfilePhoto(mediaKitRes, user) || proxyImg(platforms.instagram.profilePic)} alt={displayName} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
          ) : (
            <span className="text-primary-foreground text-4xl font-black">{(user?.fname || "D").charAt(0)}</span>
          )}
        </div>

        <div className="mt-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-foreground break-words">{displayName}</h1>
              <span className="w-5 h-5 rounded-full bg-info text-primary-foreground flex items-center justify-center text-[11px] font-black shrink-0">✓</span>
            </div>
            {platforms.instagram.username && <p className="text-sm font-bold text-primary mt-0.5">@{platforms.instagram.username.replace(/^@/, "")}</p>}
          </div>
          <AppButton variant="ghost" icon="share" className="!w-10 !h-10 !p-0 !rounded-full shrink-0" onClick={handleShare}>
            <span className="sr-only">Share</span>
          </AppButton>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          {location && <span>⌖ {location}</span>}
          {languages.length > 0 && <span>◎ {languages.join(", ")}</span>}
        </div>
        {categories.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mt-3">{categories.map((category) => <Badge key={category} color="pink" sm>{category}</Badge>)}</div>
        )}

        <button type="button" onClick={() => setBioOpen((open) => !open)} className="w-full mt-5 text-left border-y border-border py-4 flex items-start justify-between gap-3">
          <p className={`text-[12px] text-foreground leading-relaxed break-words ${bioOpen ? "" : "line-clamp-2"}`}>{bioOpen ? creatorBio : bioSnippet}</p>
          <Icon name="chevD" size={15} className={`text-primary mt-0.5 transition-transform ${bioOpen ? "rotate-180" : ""}`} />
        </button>
      </section>

      <section className="px-5 mt-6">
        <div className="grid grid-cols-2 gap-2">
          <div className="gradient-primary rounded-lg p-4 text-primary-foreground">
            <p className="text-[9px] font-black uppercase tracking-widest opacity-80">Total reach</p>
            <p className="text-2xl font-black mt-1">{totalReach}</p>
            <p className="text-[9px] mt-1 opacity-80">Combined platforms</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 flex items-center justify-between gap-2">
            <div>
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Engagement</p>
              <p className="text-2xl font-black text-foreground mt-1">{p.engagementRate}%</p>
            </div>
            <EngagementDonut percentage={p.engagementRate} />
          </div>
        </div>
      </section>

      <section className="px-5 mt-7">
        <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-3">Social platforms</p>
        <div className="flex flex-col gap-2">
          {platformKeys.map((key) => {
            const platform = platforms[key];
            const isActive = key === activePlatform;
            return (
              <button key={key} type="button" onClick={() => { setActivePlatform(key); setTab("stats"); }} className={`w-full min-h-16 px-4 py-3 rounded-lg border flex items-center justify-between gap-3 transition-transform active:scale-[0.98] ${isActive ? "bg-primary-light border-primary" : "bg-card border-border"}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center shrink-0"><Icon name={platform.ic} size={20} className={platform.color} /></span>
                  <span className="text-left min-w-0">
                    <span className="block text-sm font-black text-foreground">{platform.label}</span>
                    <span className="block text-[10px] font-bold text-muted-foreground uppercase mt-0.5">{platform.followers} {platform.label === "YouTube" ? "subscribers" : "followers"}</span>
                  </span>
                </div>
                <Icon name="chevR" size={18} className={isActive ? "text-primary" : "text-muted-foreground"} />
              </button>
            );
          })}
        </div>
      </section>

      <section className="px-5 mt-7">
        <div className="flex gap-2 mb-4">
          {[["stats", "Stats"], ["rates", "Rates"], ["projects", "Projects"]].map(([id, label]) => <Pill key={id} active={tab === id} onClick={() => setTab(id)}>{label}</Pill>)}
        </div>

        {tab === "stats" && (
          <div className="space-y-6">
            {(p.bio || p.username || p.link) && (
              <div className="border-y border-border py-4">
                <div className="flex items-center gap-2 mb-2"><Icon name={p.ic} size={16} className={p.color} /><p className="text-sm font-black text-foreground">{p.username ? `@${p.username.replace(/^@/, "")}` : p.label}</p></div>
                {p.bio && <p className="text-[12px] leading-relaxed text-muted-foreground whitespace-pre-line break-words">{p.bio}</p>}
                {p.link && <a href={p.link} target="_blank" rel="noopener noreferrer" className="inline-block text-[11px] font-bold text-primary mt-2 break-all">{p.link.replace(/^https?:\/\//, "")}</a>}
              </div>
            )}
            <div>
              <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-3">Profile performance</p>
              <div className="grid grid-cols-3 gap-2">
                {p.engagement.map((item) => (
                  <div key={item.label} className="border border-border rounded-lg px-2 py-4 text-center bg-card">
                    <p className="text-lg font-black text-foreground">{item.value}</p>
                    <p className="text-[9px] font-bold text-muted-foreground mt-1 leading-tight">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
            {p.recentPosts.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3"><p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Recent showcase</p><span className="text-[10px] font-black text-primary uppercase">Instagram</span></div>
                <div className="grid grid-cols-3 gap-2">
                  {p.recentPosts.slice(0, 6).map((post, index) => (
                    <div key={`${post.date}-${index}`} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                      {post.thumb ? <img src={proxyImg(post.thumb)} alt={post.caption} className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center"><Icon name={p.ic} size={20} className="text-primary" /></div>}
                      <div className="absolute inset-x-0 bottom-0 bg-surface-dark/70 px-2 py-1 text-primary-foreground text-[9px] font-bold">♥ {post.likes}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "rates" && (
          <div>
            <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-3">{p.label} commercials</p>
            {p.rates.length === 0 ? <p className="text-xs text-muted-foreground py-5 text-center">No rates set yet</p> : p.rates.map((rate, index) => (
              <div key={`${rate.service}-${index}`} className="flex justify-between items-center gap-4 py-4 border-b border-border"><p className="text-sm font-bold text-foreground min-w-0 break-words">{rate.service}</p><p className="text-sm font-black text-primary shrink-0">{rate.rate}</p></div>
            ))}
          </div>
        )}

        {tab === "projects" && (
          <div>
            <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-3">Past collaborations</p>
            {p.projects.length === 0 ? <p className="text-xs text-muted-foreground py-5 text-center">No projects yet</p> : p.projects.map((project, index) => (
              <a key={`${project.brand}-${index}`} href={project.link || undefined} target={project.link ? "_blank" : undefined} rel="noopener noreferrer" className="flex items-center justify-between gap-3 py-4 border-b border-border">
                <div className="flex items-center gap-3 min-w-0"><span className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center shrink-0"><Icon name="campaign" size={18} className="text-primary" /></span><span className="text-sm font-bold text-foreground truncate">{project.brand}</span></div>
                {project.link && <Icon name="chevR" size={17} className="text-primary" />}
              </a>
            ))}
          </div>
        )}
      </section>

      <section className="px-5 mt-8">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Brands I've worked with</p>
          <div data-html2canvas-ignore="true">
            <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={handleLogoPick} />
            <AppButton variant="ghost" icon="arrowUp" className="!h-8 !px-3 !py-0 !rounded-lg !text-[11px]" disabled={uploadingLogo} onClick={() => logoInputRef.current?.click()}>
              {uploadingLogo ? "Uploading…" : "Add logo"}
            </AppButton>
          </div>
        </div>
        {brandLogos.length === 0 ? (
          <p className="text-xs text-muted-foreground py-5 text-center">No brand logos yet</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {brandLogos.map((logo) => (
              <div key={logo.id} className="relative aspect-square rounded-lg border border-border bg-card p-2 flex items-center justify-center">
                <img src={logo.url} alt="Brand logo" className="max-w-full max-h-full object-contain" loading="lazy" />
                <button
                  type="button"
                  data-html2canvas-ignore="true"
                  disabled={deletingLogoId === logo.id}
                  onClick={() => handleDeleteLogo(logo.id)}
                  aria-label="Remove logo"
                  className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-destructive text-destructive-foreground text-xs font-black flex items-center justify-center shadow disabled:opacity-50"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <div data-html2canvas-ignore="true" className="px-5 mt-8 grid grid-cols-2 gap-3">
        <AppButton variant="outline" icon="share" full onClick={handleShare}>Share</AppButton>
        <AppButton variant="primary" icon="arrowUp" full disabled={downloading} onClick={handleDownload}>{downloading ? "Preparing PDF…" : "Download"}</AppButton>
      </div>
    </div>
  );
};

export default MediaKitScreen;
