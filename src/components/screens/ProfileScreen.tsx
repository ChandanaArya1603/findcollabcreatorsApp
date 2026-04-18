import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { profileService } from "@/services/profileService";
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
  { label: "My Campaigns", ic: "campaign", id: "mycampaigns", badge: "" },
  { label: "My Offers", ic: "offer", id: "offers", badge: "" },
  { label: "Messages", ic: "msg", id: "messages", badge: "" },
  { label: "Discover Startups", ic: "startup", id: "startups", badge: "" },
];

const ProfileScreen: React.FC<Props> = ({ push }) => {
  const { user, userDetail, logout } = useAuth();
  const [mediaKit, setMediaKit] = useState<any>(null);

  useEffect(() => {
    profileService.getMediaKit().then(setMediaKit).catch(() => {});
  }, []);

  const ud = mediaKit?.userDetail || userDetail || {};
  const displayName = user ? `${user.fname}${(user as any).lname ? ` ${(user as any).lname}` : ""}` : "User";
  const initial = (user?.fname || "D").charAt(0).toUpperCase();

  // Parse Instagram from nested json_data
  let igUser: any = {};
  if (mediaKit?.instagramData?.json_data) {
    try {
      const parsed = typeof mediaKit.instagramData.json_data === "string"
        ? JSON.parse(mediaKit.instagramData.json_data)
        : mediaKit.instagramData.json_data;
      igUser = parsed?.data?.user || {};
    } catch {}
  }
  const instagramFollowers: number | null =
    igUser.edge_followed_by?.count ??
    (ud.primary_account_followers ? Number(ud.primary_account_followers) : null) ??
    (ud.total_followers ? Number(ud.total_followers) : null);

  const youtubeSubscribers: number | null =
    ud.youtube_subscribe_count != null && ud.youtube_subscribe_count !== ""
      ? Number(ud.youtube_subscribe_count)
      : null;

  const linkedinFollowers: number | null =
    ud.linkedin_followers != null && ud.linkedin_followers !== ""
      ? Number(ud.linkedin_followers)
      : null;

  const igBio = igUser.biography || "";
  const bio = ud.introduction || ud.instagram_bio || igBio || ud.youtube_bio || "Influencer on Findcollab";
  const location = mediaKit
    ? [mediaKit.city, mediaKit.state, mediaKit.country].filter(Boolean).join(", ")
    : ud.city || "";
  const categories: string[] = mediaKit?.userCategories?.map((c: any) => c.Interested_in_industry || c.name || c.category_name).filter(Boolean) || [];

  // ── Latest Posts (from Instagram reels_data) ──
  let latestPosts: { thumb: string; caption: string; likes: number; comments: number; views?: number }[] = [];
  if (mediaKit?.instagramData?.reels_data) {
    try {
      const reels = typeof mediaKit.instagramData.reels_data === "string"
        ? JSON.parse(mediaKit.instagramData.reels_data)
        : mediaKit.instagramData.reels_data;
      const items = reels?.items || [];
      latestPosts = items.slice(0, 6).map((item: any) => {
        const m = item.media || item;
        const candidate = m.image_versions2?.additional_candidates?.first_frame || m.image_versions2?.candidates?.[0];
        const caption = m.caption?.text || "";
        return {
          thumb: candidate?.url || "",
          caption: caption.length > 60 ? caption.slice(0, 60) + "…" : caption,
          likes: Number(m.like_count ?? m.fb_like_count ?? 0),
          comments: Number(m.comment_count ?? 0),
          views: Number(m.play_count ?? m.video_view_count ?? 0),
        };
      }).filter((p: any) => p.thumb);
    } catch {}
  }

  const fmt = (n: number | null): string => {
    if (n == null) return "—";
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  };
  const finalInsta = instagramFollowers;
  const finalYt = youtubeSubscribers;
  const finalLi = linkedinFollowers;

  return (
    <Screen>
      <div className="bg-card border-b border-border">
        <div className="h-20 gradient-hero" />
        <div className="px-4 pb-5">
          <div className="flex justify-between items-end mb-3">
            <div className="w-[72px] h-[72px] rounded-[22px] bg-primary border-4 border-card -mt-9 flex items-center justify-center">
              <span className="text-primary-foreground text-[28px] font-black">{initial}</span>
            </div>
            <AppButton variant="ghost" icon="edit" className="!py-2 !px-3.5 !text-xs !rounded-[10px]" onClick={() => push("editprofile")}>Edit</AppButton>
          </div>
          <p className="text-[19px] font-black text-foreground mb-0.5">{displayName}</p>
          <p className="text-xs text-text-light mb-2">{bio} • 📍 {location}</p>
          <div className="flex gap-1.5 flex-wrap">
            {(categories.length > 0 ? categories : ["Influencer"]).map((t) => (
              <Badge key={t} color="pink" sm>{t}</Badge>
            ))}
          </div>
        </div>
        <div className="flex border-t border-border">
          {[
            { ic: "insta", l: "Instagram", v: fmt(finalInsta), c: "text-pink-600" },
            { ic: "yt", l: "YouTube", v: fmt(finalYt), c: "text-red-600" },
            { ic: "linkedin", l: "LinkedIn", v: fmt(finalLi), c: "text-blue-600" },
          ].map((s, i, arr) => (
            <div key={i} className={`flex-1 py-3 px-3 text-center ${i < arr.length - 1 ? "border-r border-border" : ""}`}>
              <div className="flex justify-center mb-1">
                <Icon name={s.ic} size={18} className={s.c} />
              </div>
              <p className="text-lg font-black text-foreground">{s.v}</p>
              <p className="text-[10px] text-text-light mt-0.5">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {latestPosts.length > 0 && (
        <div className="px-4 pt-3.5">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[13px] font-bold text-text-light uppercase tracking-widest">Latest Posts</p>
            <span className="text-[11px] text-text-light">Instagram</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {latestPosts.map((post, i) => (
              <div key={i} className="relative aspect-square rounded-[12px] overflow-hidden bg-muted group">
                <img src={post.thumb} alt={post.caption || `Post ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                  <div className="flex items-center gap-2 text-[9px] text-white font-bold">
                    <span>❤ {fmt(post.likes)}</span>
                    <span>💬 {fmt(post.comments)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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

        <button
          onClick={() => logout()}
          className="w-full py-3.5 rounded-[14px] border-[1.5px] border-destructive/10 bg-destructive/5 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Icon name="logout" size={16} className="text-destructive" />
          <span className="text-sm font-bold text-destructive">Sign Out</span>
        </button>
      </div>
    </Screen>
  );
};

export default ProfileScreen;
